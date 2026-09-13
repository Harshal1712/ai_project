import { genai, withRetry } from './genaiClient.js';
import { env } from '../../config/env.js';

export class EmbeddingService {
  public static async embedText(text: string): Promise<number[]> {
    const [vector] = await EmbeddingService.embedTexts([text]);
    return vector;
  }

  public static async embedTexts(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const response = await withRetry(() =>
      genai.models.embedContent({
        model: env.EMBEDDING_MODEL,
        contents: texts,
        config: { outputDimensionality: env.EMBEDDING_DIMENSIONS },
      })
    );

    const embeddings = response.embeddings;
    if (!embeddings || embeddings.length !== texts.length) {
      throw new Error('Embedding service returned an unexpected number of vectors');
    }

    return embeddings.map((e) => {
      const values = e.values ?? [];
      if (values.length !== env.EMBEDDING_DIMENSIONS) {
        throw new Error(
          `Embedding dimension mismatch: got ${values.length}, expected ${env.EMBEDDING_DIMENSIONS}. ` +
            'Check EMBEDDING_MODEL/EMBEDDING_DIMENSIONS against the Atlas vector index configuration.'
        );
      }
      return values;
    });
  }
}
