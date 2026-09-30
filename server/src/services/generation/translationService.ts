import { LLMService } from '../llm/LLMService.js';
import { slidesSchema, mcqSchema } from '../llm/schemas.js';
import { ISlide, IQuizQuestion } from '../../models/GeneratedOutput.js';

export const SUPPORTED_LANGUAGES = [
  'English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu',
  'Spanish', 'French', 'German', 'Portuguese', 'Arabic', 'Chinese', 'Japanese', 'Korean', 'Russian',
] as const;

const TRANSLATOR_INSTRUCTION = `You are a professional translator. Translate faithfully and completely:
- Preserve meaning, structure, formatting (line breaks, bullets, numbering), and tone.
- Keep numbers, dates, percentages, currency amounts, proper names, product names, and code exactly as written.
- Keep widely-used technical terms in their common form when the target language normally does so.
- Never add, remove, summarize, or explain content.`;

export interface TranslatableOutput {
  content: string;
  slides?: ISlide[];
  quiz?: IQuizQuestion[];
}

// Translates a generated output, including the structured parts (slides,
// quiz) where the schema is re-applied so the translated version renders in
// the same UI components as the original.
export async function translateOutput(output: TranslatableOutput, targetLanguage: string): Promise<TranslatableOutput> {
  const contentPromise = LLMService.generateText(
    `Translate the following text into ${targetLanguage}. Return only the translation.\n\n"""\n${output.content}\n"""`,
    TRANSLATOR_INSTRUCTION
  );

  const slidesPromise = output.slides && output.slides.length > 0
    ? LLMService.generateStructured<{ slides: ISlide[] }>(
        `Translate every title, bullet point, and speaker note in these presentation slides into ${targetLanguage}. Keep slideNumber values and the number/order of slides and bullets unchanged.\n\n${JSON.stringify({ slides: output.slides.map(stripIds) })}`,
        slidesSchema,
        TRANSLATOR_INSTRUCTION
      ).then((r) => r.slides)
    : Promise.resolve(undefined);

  const quizPromise = output.quiz && output.quiz.length > 0
    ? LLMService.generateStructured<{ questions: Omit<IQuizQuestion, 'id'>[] }>(
        `Translate every question, option, explanation, and citation in this quiz into ${targetLanguage}. Keep correctAnswer indexes and the order of questions and options unchanged.\n\n${JSON.stringify({ questions: output.quiz.map(({ id: _id, ...q }) => stripIds(q)) })}`,
        mcqSchema,
        TRANSLATOR_INSTRUCTION
      ).then((r) =>
        r.questions.map((q, i) => ({
          ...q,
          id: i + 1,
          // The answer key must never drift during translation — always trust the original.
          correctAnswer: output.quiz![i]?.correctAnswer ?? q.correctAnswer,
        }))
      )
    : Promise.resolve(undefined);

  const [content, slides, quiz] = await Promise.all([contentPromise, slidesPromise, quizPromise]);
  return { content: content.trim(), slides, quiz };
}

function stripIds<T extends object>(obj: T): T {
  const { _id, ...rest } = obj as any;
  return rest;
}
