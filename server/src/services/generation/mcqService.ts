import { LLMService } from '../llm/LLMService.js';
import { mcqSchema } from '../llm/schemas.js';
import { IQuizQuestion } from '../../models/GeneratedOutput.js';

interface RawMcqResult {
  questions: { question: string; options: string[]; correctAnswer: number; explanation: string; citation?: string }[];
}

function isValidQuestion(q: RawMcqResult['questions'][number]): boolean {
  return q.options.length === 4 && q.correctAnswer >= 0 && q.correctAnswer < 4 && q.question.trim().length > 0;
}

export async function generateMCQs(context: string, sourceName: string, count = 5, language = 'English'): Promise<IQuizQuestion[]> {
  const prompt = `Generate exactly ${count} multiple-choice questions based ONLY on the content of "${sourceName}" below.
Write the questions, options, and explanations in ${language}, even if the content is in a different language.
Each question must have exactly 4 options, one correct answer (index 0-3), an explanation, and a short citation (a quoted snippet from the content that supports the answer).
The questions must be answerable strictly from the content — do not use outside knowledge.

CONTENT:
"""
${context}
"""`;

  const result = await LLMService.generateStructured<RawMcqResult>(
    prompt,
    mcqSchema,
    'You write quiz questions strictly grounded in the given content. Never invent facts not present in the content.'
  );

  const valid = result.questions.filter(isValidQuestion);
  if (valid.length === 0) {
    throw new Error('MCQ generation did not produce any valid, well-formed questions.');
  }

  return valid.map((q, i) => ({
    id: i + 1,
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    citation: q.citation,
  }));
}
