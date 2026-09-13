import { LLMService } from '../llm/LLMService.js';
import { documentIntelligenceSchema } from '../llm/schemas.js';

export interface DocumentIntelligenceResult {
  keyTopics: string[];
  importantDates: { date: string; event: string }[];
  keyMetrics: { label: string; value: string }[];
  entities: { name: string; category: string; frequency: number; contextSnippet: string }[];
  references: string[];
}

const MAX_CONTEXT_CHARS = 120_000;

// Real, content-grounded analysis (topics/dates/metrics/entities/references)
// — replaces the old hardcoded DocumentExtractor fabrication entirely.
export async function analyzeDocumentIntelligence(fullText: string, sourceName: string): Promise<DocumentIntelligenceResult> {
  const context = fullText.length > MAX_CONTEXT_CHARS ? fullText.slice(0, MAX_CONTEXT_CHARS) : fullText;

  const prompt = `Analyze the following document ("${sourceName}") and extract structured intelligence about it.
Only report topics, dates, metrics, entities, and references that ACTUALLY APPEAR in the text below. Do not invent anything.
If a category has no genuine matches, return an empty array for it.

DOCUMENT TEXT:
"""
${context}
"""`;

  return LLMService.generateStructured<DocumentIntelligenceResult>(
    prompt,
    documentIntelligenceSchema,
    'You extract only information explicitly present in the provided text. Never fabricate entities, dates, or metrics.'
  );
}
