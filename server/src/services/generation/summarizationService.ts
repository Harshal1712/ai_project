import { LLMService } from '../llm/LLMService.js';
import { summarySchema } from '../llm/schemas.js';

export interface SummaryResult {
  executiveSummary: string;
  detailedSummary: string;
  keyPoints: string[];
  faq: { question: string; answer: string }[];
}

const SINGLE_PASS_CHAR_LIMIT = 60_000;
const BATCH_CHAR_SIZE = 45_000;

const PRESERVE_INSTRUCTION =
  'Preserve exact names, dates, numbers, percentages, deadlines, and technical terms from the source — do not round, paraphrase away, or drop them.';

async function summarizeBatch(batch: string, index: number, total: number): Promise<string> {
  return LLMService.generateText(
    `This is part ${index + 1} of ${total} of a longer document. Summarize its content in 3-6 sentences. ${PRESERVE_INSTRUCTION}\n\nTEXT:\n"""\n${batch}\n"""`
  );
}

// Hierarchical map-reduce for long documents (spec section 25): chunk ->
// per-batch summaries -> final summary over the combined batch summaries,
// instead of sending an arbitrarily large document directly to the model.
async function buildGroundedContext(fullText: string): Promise<string> {
  if (fullText.length <= SINGLE_PASS_CHAR_LIMIT) return fullText;

  const batches: string[] = [];
  for (let i = 0; i < fullText.length; i += BATCH_CHAR_SIZE) {
    batches.push(fullText.slice(i, i + BATCH_CHAR_SIZE));
  }

  const batchSummaries = await Promise.all(batches.map((b, i) => summarizeBatch(b, i, batches.length)));
  return batchSummaries.map((s, i) => `[Section ${i + 1} summary]\n${s}`).join('\n\n');
}

export async function generateSummaries(fullText: string, sourceName: string, audience: string, tone: string): Promise<SummaryResult> {
  const context = await buildGroundedContext(fullText);

  const prompt = `Generate a summary package for the document "${sourceName}" for a ${audience} audience, in a ${tone} tone.
${PRESERVE_INSTRUCTION}
Base everything strictly on the content below — do not add outside information.

CONTENT:
"""
${context}
"""`;

  return LLMService.generateStructured<SummaryResult>(
    prompt,
    summarySchema,
    'You summarize only what is present in the given content. Never invent facts, figures, or claims not in the source.'
  );
}
