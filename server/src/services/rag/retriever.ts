import { Types } from 'mongoose';
import { ContentChunk } from '../../models/ContentChunk.js';
import { env } from '../../config/env.js';

export interface RetrievedChunk {
  sourceId: Types.ObjectId;
  text: string;
  page?: number;
  section?: string;
  startTime?: number;
  endTime?: number;
  score: number;
}

// Real semantic retrieval via Atlas Vector Search — scoped to the requesting
// project/user so one user's content can never leak into another's answers.
export async function retrieveRelevantChunks(
  queryEmbedding: number[],
  projectId: Types.ObjectId,
  topK: number = env.TOP_K
): Promise<RetrievedChunk[]> {
  const results = await ContentChunk.aggregate([
    {
      $vectorSearch: {
        index: env.VECTOR_INDEX_NAME,
        path: 'embedding',
        queryVector: queryEmbedding,
        numCandidates: Math.max(topK * 10, 100),
        limit: topK,
        filter: { projectId: { $eq: projectId } },
      },
    },
    {
      $project: {
        _id: 0,
        sourceId: 1,
        text: 1,
        page: 1,
        section: 1,
        startTime: 1,
        endTime: 1,
        score: { $meta: 'vectorSearchScore' },
      },
    },
  ]);

  return results as RetrievedChunk[];
}
