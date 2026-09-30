import { genai, callGenerateContent, withIdleTimeout } from './genaiClient.js';
import { env } from '../../config/env.js';

export const GROUNDING_SYSTEM_INSTRUCTION = `You are ContentIQ AI's grounded content assistant.
Rules you must always follow:
- Use ONLY the retrieved source context provided to you. Do not use outside/pretrained knowledge to answer factual questions about the source.
- Never invent facts, numbers, dates, names, citations, page numbers, or timestamps that are not present in the provided context.
- If the answer is not contained in the provided context, clearly say the information is not available in the provided source.
- Distinguish between what the source explicitly states and any interpretation you add — label interpretation as such.
- If asked to confirm something that contradicts the source, correct it using the source's actual statement.`;

const STREAM_IDLE_TIMEOUT_MS = 60_000;

export class LLMService {
  public static async generateText(prompt: string, systemInstruction?: string): Promise<string> {
    const response = await callGenerateContent(() =>
      genai.models.generateContent({
        model: env.GEMINI_MODEL,
        contents: prompt,
        config: systemInstruction ? { systemInstruction } : undefined,
      })
    );
    const text = response.text;
    if (!text) throw new Error('Gemini returned an empty response');
    return text;
  }

  // Streams plain-text generation, invoking onChunk for each piece as Gemini
  // produces it. Only opening the stream is retried — once tokens have been
  // sent to the client, a retry would duplicate them. Each gap between
  // chunks is bounded so a stalled stream can't hang the request forever.
  public static async streamText(
    prompt: string,
    systemInstruction: string | undefined,
    onChunk: (text: string) => void,
    abortSignal?: AbortSignal
  ): Promise<string> {
    const stream = await callGenerateContent(() =>
      genai.models.generateContentStream({
        model: env.GEMINI_MODEL,
        contents: prompt,
        config: { systemInstruction, abortSignal },
      })
    );

    const iterator = stream[Symbol.asyncIterator]();
    let full = '';
    for (;;) {
      const { value, done } = await withIdleTimeout(iterator.next(), STREAM_IDLE_TIMEOUT_MS, 'Gemini stream stalled');
      if (done) break;
      const text = value?.text;
      if (text) {
        full += text;
        onChunk(text);
      }
    }

    if (!full.trim()) throw new Error('Gemini returned an empty response');
    return full;
  }

  public static async generateStructured<T>(
    prompt: string,
    schema: object,
    systemInstruction?: string
  ): Promise<T> {
    const response = await callGenerateContent(() =>
      genai.models.generateContent({
        model: env.GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: schema as any,
        },
      })
    );

    const raw = response.text;
    if (!raw) throw new Error('Gemini returned an empty structured response');

    try {
      return JSON.parse(raw) as T;
    } catch {
      // One controlled repair attempt: ask the model to fix its own malformed JSON.
      const repaired = await callGenerateContent(() =>
        genai.models.generateContent({
          model: env.GEMINI_MODEL,
          contents: `The following was supposed to be valid JSON matching a schema but failed to parse. Return ONLY corrected valid JSON, no prose:\n\n${raw}`,
          config: { responseMimeType: 'application/json', responseSchema: schema as any },
        })
      );
      const repairedRaw = repaired.text;
      if (!repairedRaw) throw new Error('Gemini structured output could not be repaired');
      return JSON.parse(repairedRaw) as T; // let this throw if still invalid — fail loudly, never fabricate
    }
  }
}
