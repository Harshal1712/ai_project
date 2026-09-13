import { Types } from 'mongoose';
import { EmbeddingService } from '../llm/EmbeddingService.js';
import { LLMService, GROUNDING_SYSTEM_INSTRUCTION } from '../llm/LLMService.js';
import { ragAnswerSchema } from '../llm/schemas.js';
import { retrieveRelevantChunks, RetrievedChunk } from './retriever.js';
import { env } from '../../config/env.js';

export interface CitationSource {
  sourceId: string;
  page?: number;
  section?: string;
  startTime?: number;
  endTime?: number;
  text: string;
  score: number;
}

export interface RagAnswer {
  answer: string;
  grounded: boolean;
  sources: CitationSource[];
}

const NOT_AVAILABLE_ANSWER = 'The requested information is not available in the provided source content.';

function formatCitationLabel(chunk: RetrievedChunk, index: number): string {
  if (chunk.page != null) return `[${index + 1}] Page ${chunk.page}`;
  if (chunk.section) return `[${index + 1}] Section: ${chunk.section}`;
  if (chunk.startTime != null) return `[${index + 1}] ${formatTimestamp(chunk.startTime)}-${formatTimestamp(chunk.endTime ?? chunk.startTime)}`;
  return `[${index + 1}]`;
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// The core grounded-RAG flow (spec section 17/19): embed -> vector search ->
// threshold cutoff -> cited context -> constrained generation. If nothing
// clears the similarity threshold, we return an explicit "not available"
// response WITHOUT calling the LLM — never fall through to ungrounded
// generation.
export async function answerQuestion(query: string, projectId: Types.ObjectId): Promise<RagAnswer> {
  const queryEmbedding = await EmbeddingService.embedText(query);
  const retrieved = await retrieveRelevantChunks(queryEmbedding, projectId);
  const grounded = retrieved.filter((c) => c.score >= env.SIMILARITY_THRESHOLD);

  if (grounded.length === 0) {
    return { answer: NOT_AVAILABLE_ANSWER, grounded: false, sources: [] };
  }

  const contextBlock = grounded
    .map((chunk, i) => `${formatCitationLabel(chunk, i)}\n${chunk.text}`)
    .join('\n\n');

  const prompt = `Answer the user's question using ONLY the numbered source excerpts below. Reference which excerpt(s) support your answer implicitly through your wording, but do not fabricate anything beyond them.
If the excerpts do not actually answer the question, say the information is not available in the provided source.

SOURCE EXCERPTS:
${contextBlock}

QUESTION: ${query}`;

  const result = await LLMService.generateStructured<{ answer: string; grounded: boolean }>(
    prompt,
    ragAnswerSchema,
    GROUNDING_SYSTEM_INSTRUCTION
  );

  return {
    answer: result.answer,
    grounded: result.grounded,
    sources: grounded.map((chunk) => ({
      sourceId: chunk.sourceId.toString(),
      page: chunk.page,
      section: chunk.section,
      startTime: chunk.startTime,
      endTime: chunk.endTime,
      text: chunk.text,
      score: chunk.score,
    })),
  };
}
