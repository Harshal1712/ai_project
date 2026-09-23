import { Types } from 'mongoose';
import { EmbeddingService } from '../llm/EmbeddingService.js';
import { LLMService, GROUNDING_SYSTEM_INSTRUCTION } from '../llm/LLMService.js';
import { ragAnswerSchema } from '../llm/schemas.js';
import { retrieveRelevantChunks, RetrievedChunk } from './retriever.js';
import { Source } from '../../models/Source.js';
import { env } from '../../config/env.js';

export interface CitationSource {
  projectId: string;
  sourceId: string;
  sourceName?: string;
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

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AskOptions {
  // 'Auto' (default) answers in the language the question was asked in.
  language?: string;
  // Recent turns of the same conversation, oldest first, for resolving follow-ups.
  history?: ChatTurn[];
}

export type StreamEvent =
  | { type: 'sources'; sources: CitationSource[] }
  | { type: 'token'; text: string }
  | { type: 'done'; answer: string; grounded: boolean };

export const NOT_AVAILABLE_ANSWER = 'The requested information is not available in the provided source content.';
const NOT_AVAILABLE_MARKER = 'NOT_AVAILABLE';
const HISTORY_TURNS_IN_PROMPT = 6;
const SHORT_FOLLOW_UP_WORDS = 8;

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatCitationLabel(chunk: RetrievedChunk, index: number, sourceName?: string): string {
  const doc = sourceName ? ` "${sourceName}"` : '';
  if (chunk.page != null) return `[${index + 1}]${doc} Page ${chunk.page}`;
  if (chunk.section) return `[${index + 1}]${doc} Section: ${chunk.section}`;
  if (chunk.startTime != null) return `[${index + 1}]${doc} ${formatTimestamp(chunk.startTime)}-${formatTimestamp(chunk.endTime ?? chunk.startTime)}`;
  return `[${index + 1}]${doc}`;
}

function languageInstruction(language?: string): string {
  if (!language || language === 'Auto') {
    return 'Write your answer in the same language the QUESTION is written in, even if the excerpts are in a different language.';
  }
  return `Write your answer in ${language}, even if the excerpts or the question are in a different language.`;
}

function hasNonLatinLetters(text: string): boolean {
  return /[^\u0000-ɏ\s\d\p{P}\p{S}]/u.test(text);
}

// Short follow-ups ("and the second one?") carry little meaning on their own,
// so the previous question is folded into the text that gets embedded.
function buildRetrievalQuery(query: string, history?: ChatTurn[]): string {
  const lastUserTurn = [...(history ?? [])].reverse().find((t) => t.role === 'user');
  if (lastUserTurn && query.trim().split(/\s+/).length <= SHORT_FOLLOW_UP_WORDS) {
    return `${lastUserTurn.content}\n${query}`;
  }
  return query;
}

async function translateQueryToEnglish(query: string): Promise<string> {
  const translated = await LLMService.generateText(
    `Translate this question into English. Return only the translated question, nothing else.\n\n${query}`
  );
  return translated.trim();
}

async function retrieveAboveThreshold(text: string, projectIds: Types.ObjectId[]): Promise<RetrievedChunk[]> {
  const embedding = await EmbeddingService.embedText(text);
  const retrieved = await retrieveRelevantChunks(embedding, projectIds);
  return retrieved.filter((c) => c.score >= env.SIMILARITY_THRESHOLD);
}

// Embed -> vector search -> similarity threshold. The embedding model is
// multilingual, but cross-language matches can score lower, so a non-Latin
// question that finds nothing gets one retry with an English translation.
async function retrieveGroundedChunks(query: string, projectIds: Types.ObjectId[], history?: ChatTurn[]): Promise<RetrievedChunk[]> {
  const retrievalQuery = buildRetrievalQuery(query, history);
  const grounded = await retrieveAboveThreshold(retrievalQuery, projectIds);
  if (grounded.length > 0 || !hasNonLatinLetters(query)) return grounded;

  const englishQuery = await translateQueryToEnglish(query);
  return retrieveAboveThreshold(buildRetrievalQuery(englishQuery, history), projectIds);
}

async function loadSourceNames(chunks: RetrievedChunk[]): Promise<Map<string, string>> {
  const ids = [...new Set(chunks.map((c) => c.sourceId.toString()))];
  const sources = await Source.find({ _id: { $in: ids } }, { originalName: 1, videoTitle: 1 }).lean();
  return new Map(sources.map((s) => [s._id.toString(), s.videoTitle || s.originalName]));
}

function toCitationSources(chunks: RetrievedChunk[], names: Map<string, string>): CitationSource[] {
  return chunks.map((chunk) => ({
    projectId: chunk.projectId.toString(),
    sourceId: chunk.sourceId.toString(),
    sourceName: names.get(chunk.sourceId.toString()),
    page: chunk.page,
    section: chunk.section,
    startTime: chunk.startTime,
    endTime: chunk.endTime,
    text: chunk.text,
    score: chunk.score,
  }));
}

function buildContextBlock(chunks: RetrievedChunk[], names: Map<string, string>, multiDocument: boolean): string {
  return chunks
    .map((chunk, i) => `${formatCitationLabel(chunk, i, multiDocument ? names.get(chunk.sourceId.toString()) : undefined)}\n${chunk.text}`)
    .join('\n\n');
}

function buildHistoryBlock(history?: ChatTurn[]): string {
  const recent = (history ?? []).slice(-HISTORY_TURNS_IN_PROMPT);
  if (recent.length === 0) return '';
  const lines = recent.map((t) => `${t.role === 'user' ? 'User' : 'Assistant'}: ${t.content}`).join('\n');
  return `CONVERSATION SO FAR (for resolving references like "it" or "the second one" — not a source of facts):\n${lines}\n\n`;
}

// The core grounded-RAG flow (spec section 17/19): embed -> vector search ->
// threshold cutoff -> cited context -> constrained generation. If nothing
// clears the similarity threshold, we return an explicit "not available"
// response WITHOUT calling the LLM — never fall through to ungrounded
// generation.
export async function answerQuestion(query: string, projectId: Types.ObjectId, options: AskOptions = {}): Promise<RagAnswer> {
  const grounded = await retrieveGroundedChunks(query, [projectId], options.history);

  if (grounded.length === 0) {
    return { answer: NOT_AVAILABLE_ANSWER, grounded: false, sources: [] };
  }

  const names = await loadSourceNames(grounded);
  const prompt = `Answer the user's question using ONLY the numbered source excerpts below. Reference which excerpt(s) support your answer implicitly through your wording, but do not fabricate anything beyond them.
If the excerpts do not actually answer the question, say the information is not available in the provided source.
${languageInstruction(options.language)}

${buildHistoryBlock(options.history)}SOURCE EXCERPTS:
${buildContextBlock(grounded, names, false)}

QUESTION: ${query}`;

  const result = await LLMService.generateStructured<{ answer: string; grounded: boolean }>(
    prompt,
    ragAnswerSchema,
    GROUNDING_SYSTEM_INSTRUCTION
  );

  return { answer: result.answer, grounded: result.grounded, sources: toCitationSources(grounded, names) };
}

// Streaming variant used by the chat UIs: emits the retrieved sources first
// (so citations render immediately), then answer tokens as Gemini produces
// them, then a final 'done' event. Works over one or many projects.
//
// The model is told to reply with a bare NOT_AVAILABLE marker when the
// excerpts don't answer the question; the first few characters are held back
// until we know whether that marker is coming, which gives a reliable
// grounded flag without a second LLM call.
export async function streamAnswer(
  query: string,
  projectIds: Types.ObjectId[],
  options: AskOptions,
  emit: (event: StreamEvent) => void,
  abortSignal?: AbortSignal
): Promise<RagAnswer> {
  const grounded = await retrieveGroundedChunks(query, projectIds, options.history);

  if (grounded.length === 0) {
    emit({ type: 'sources', sources: [] });
    emit({ type: 'token', text: NOT_AVAILABLE_ANSWER });
    emit({ type: 'done', answer: NOT_AVAILABLE_ANSWER, grounded: false });
    return { answer: NOT_AVAILABLE_ANSWER, grounded: false, sources: [] };
  }

  const names = await loadSourceNames(grounded);
  const sources = toCitationSources(grounded, names);
  emit({ type: 'sources', sources });

  const multiDocument = new Set(grounded.map((c) => c.sourceId.toString())).size > 1;
  const prompt = `Answer the user's question using ONLY the numbered source excerpts below.
Cite the excerpts that support each statement inline using their bracket numbers, e.g. [1] or [2][3].${multiDocument ? '\nThe excerpts come from several different documents — when they differ or disagree, say which document says what.' : ''}
If the excerpts do not contain the answer, reply with exactly ${NOT_AVAILABLE_MARKER} and nothing else.
${languageInstruction(options.language)}
Use short paragraphs or bullet points where it helps readability.

${buildHistoryBlock(options.history)}SOURCE EXCERPTS:
${buildContextBlock(grounded, names, multiDocument)}

QUESTION: ${query}`;

  let pending = '';
  let decided = false;
  let isNotAvailable = false;

  const flushDecision = () => {
    decided = true;
    isNotAvailable = pending.trim().startsWith(NOT_AVAILABLE_MARKER);
    if (!isNotAvailable && pending) emit({ type: 'token', text: pending });
  };

  const full = await LLMService.streamText(
    prompt,
    GROUNDING_SYSTEM_INSTRUCTION,
    (text) => {
      if (decided) {
        if (!isNotAvailable) emit({ type: 'token', text });
        return;
      }
      pending += text;
      if (pending.trimStart().length >= NOT_AVAILABLE_MARKER.length) flushDecision();
    },
    abortSignal
  );
  if (!decided) flushDecision();

  if (isNotAvailable) {
    emit({ type: 'token', text: NOT_AVAILABLE_ANSWER });
    emit({ type: 'done', answer: NOT_AVAILABLE_ANSWER, grounded: false });
    return { answer: NOT_AVAILABLE_ANSWER, grounded: false, sources: [] };
  }

  const answer = full.trim();
  emit({ type: 'done', answer, grounded: true });
  return { answer, grounded: true, sources };
}
