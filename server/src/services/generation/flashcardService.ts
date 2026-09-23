import { Types } from 'mongoose';
import { LLMService } from '../llm/LLMService.js';
import { flashcardsSchema } from '../llm/schemas.js';
import { ContentChunk } from '../../models/ContentChunk.js';

export interface FlashcardDraft {
  front: string;
  back: string;
  citation?: string;
}

const MAX_CONTEXT_CHARS = 60_000;

// Rebuilds the project's content from its stored chunks (the raw upload is
// deleted after processing). Long documents are sampled evenly from start to
// end instead of truncated, so cards cover the whole source, not just its opening.
export async function loadProjectText(projectId: Types.ObjectId): Promise<string> {
  const chunks = await ContentChunk.find({ projectId }, { text: 1, sourceId: 1, chunkIndex: 1 })
    .sort({ sourceId: 1, chunkIndex: 1 })
    .lean();
  if (chunks.length === 0) return '';

  const totalChars = chunks.reduce((n, c) => n + c.text.length, 0);
  if (totalChars <= MAX_CONTEXT_CHARS) return chunks.map((c) => c.text).join('\n\n');

  const keepEvery = totalChars / MAX_CONTEXT_CHARS;
  const sampled = chunks.filter((_, i) => Math.floor(i % keepEvery) === 0);
  return sampled.map((c) => c.text).join('\n\n').slice(0, MAX_CONTEXT_CHARS);
}

export async function generateFlashcards(
  context: string,
  sourceName: string,
  count: number,
  language: string,
  avoidFronts: string[] = []
): Promise<FlashcardDraft[]> {
  const avoid = avoidFronts.length > 0
    ? `\nThe learner already has cards for these prompts — do NOT repeat or rephrase them:\n${avoidFronts.map((f) => `- ${f}`).join('\n')}\n`
    : '';

  const prompt = `Create exactly ${count} study flashcards from the content of "${sourceName}" below.
Each card has:
- front: one focused question or prompt that tests a single fact, definition, number, cause/effect, or concept
- back: the concise, complete answer (1-3 sentences), taken strictly from the content
- citation: a short quoted phrase from the content that supports the answer
Cover the most important material across the whole content, mixing definitions, key figures, relationships, and "why" questions. Avoid yes/no questions and trivia.
Write the cards in ${language}, even if the content is in a different language (keep names, numbers, and technical terms exact).
${avoid}
CONTENT:
"""
${context}
"""`;

  const result = await LLMService.generateStructured<{ cards: FlashcardDraft[] }>(
    prompt,
    flashcardsSchema,
    'You write study flashcards strictly grounded in the given content. Never invent facts not present in the content.'
  );

  const seen = new Set(avoidFronts.map((f) => f.trim().toLowerCase()));
  const cards = result.cards.filter((c) => {
    const key = c.front?.trim().toLowerCase();
    if (!key || !c.back?.trim() || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (cards.length === 0) {
    throw new Error('Flashcard generation did not produce any usable cards.');
  }
  return cards;
}

// ---- Spaced repetition (Leitner system) ----

export type ReviewGrade = 'again' | 'good' | 'easy';

const MAX_BOX = 5;
// Days until the next review once a card lands in box N (index = box).
const BOX_INTERVAL_DAYS = [0, 0, 1, 3, 7, 16];
const AGAIN_DELAY_MS = 60_000; // a missed card comes back within the same session

export interface ScheduleResult {
  box: number;
  dueAt: Date;
}

export function scheduleReview(currentBox: number, grade: ReviewGrade, now: Date = new Date()): ScheduleResult {
  if (grade === 'again') {
    return { box: 1, dueAt: new Date(now.getTime() + AGAIN_DELAY_MS) };
  }
  const box = Math.min(MAX_BOX, currentBox + (grade === 'easy' ? 2 : 1));
  const dueAt = new Date(now.getTime() + BOX_INTERVAL_DAYS[box] * 24 * 60 * 60_000);
  return { box, dueAt };
}

export const MASTERED_BOX = 4;
