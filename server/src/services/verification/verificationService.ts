import { Types } from 'mongoose';
import { LLMService } from '../llm/LLMService.js';
import { EmbeddingService } from '../llm/EmbeddingService.js';
import { claimExtractionSchema, claimVerificationSchema } from '../llm/schemas.js';
import { retrieveRelevantChunks } from '../rag/retriever.js';
import { IVerificationCheck, VerificationStatus } from '../../models/VerificationReport.js';

export interface VerificationReportDraft {
  fidelityScore: number;
  totalChecks: number;
  passedChecks: number;
  warnings: number;
  checks: IVerificationCheck[];
}

const CLAIMS_PER_REPORT_CAP = 20; // keep the batched judge call within a reasonable size/cost

interface ClaimVerificationResult {
  results: {
    claimIndex: number;
    status: VerificationStatus;
    sourceStatement: string;
    category: string;
    note: string;
  }[];
}

// AI-output grounding/consistency verification (spec section 28) — explicitly
// NOT claimed to be perfect fact-checking. Two LLM calls total regardless of
// claim count: one to extract claims, one batched judge call to classify all
// of them against their retrieved source context, to control Gemini rate-limit
// exposure.
export async function verifyGeneratedContent(generatedContent: string, projectId: Types.ObjectId): Promise<VerificationReportDraft> {
  const { claims } = await LLMService.generateStructured<{ claims: string[] }>(
    `Extract a list of distinct, checkable factual claims (numbers, dates, names, technical statements, conditions) from the following generated content. One claim per list item, stated plainly and self-contained.
When the content states a list under a count (e.g. "the three risks are X, Y, Z"), extract each item as its own standalone claim WITHOUT carrying over the original count — write "A risk is X", never "Three risks are X" for a claim about only one item. Each claim must be true and unambiguous when read entirely on its own, with no dependency on a number or list position from the original sentence.\n\nCONTENT:\n"""\n${generatedContent}\n"""`,
    claimExtractionSchema
  );

  const cappedClaims = claims.slice(0, CLAIMS_PER_REPORT_CAP);
  if (cappedClaims.length === 0) {
    return { fidelityScore: 100, totalChecks: 0, passedChecks: 0, warnings: 0, checks: [] };
  }

  const claimEmbeddings = await EmbeddingService.embedTexts(cappedClaims);
  const contextsPerClaim = await Promise.all(
    claimEmbeddings.map((embedding) => retrieveRelevantChunks(embedding, projectId, 3))
  );

  const claimsBlock = cappedClaims
    .map((claim, i) => {
      const context = contextsPerClaim[i].map((c) => c.text).join(' | ') || '(no matching source content found)';
      return `Claim ${i}: "${claim}"\nRetrieved source context: ${context}`;
    })
    .join('\n\n');

  const verification = await LLMService.generateStructured<ClaimVerificationResult>(
    `For each claim below, compare it against its retrieved source context and classify it as exactly one of: "verified" (fully supported), "meaning_changed" (contradicts or materially alters the source), "nuance_shift" (technically consistent but loses precision, e.g. rounding), or "unsupported" (no retrieved context actually supports or addresses it).
Quote the relevant part of the retrieved context as sourceStatement (or say "No matching source content" if unsupported). Assign a category (Numbers, Metrics, Dates, Names, Technical terms, Conditions, References, or General).

${claimsBlock}`,
    claimVerificationSchema,
    'You are a strict grounding auditor. Never mark a claim "verified" unless the retrieved context actually supports it.'
  );

  const checks: IVerificationCheck[] = verification.results.map((r, i) => ({
    id: `v${i + 1}`,
    sourceStatement: r.sourceStatement,
    generatedStatement: cappedClaims[r.claimIndex] ?? cappedClaims[i],
    status: r.status,
    category: r.category,
    note: r.note,
  }));

  const passedChecks = checks.filter((c) => c.status === 'verified').length;
  const totalChecks = checks.length;
  const warnings = totalChecks - passedChecks;
  const fidelityScore = totalChecks === 0 ? 100 : Math.round((passedChecks / totalChecks) * 100);

  return { fidelityScore, totalChecks, passedChecks, warnings, checks };
}
