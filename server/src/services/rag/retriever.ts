import { Types } from 'mongoose';
import { ContentChunk } from '../../models/ContentChunk.js';
import { env } from '../../config/env.js';

export interface RetrievedChunk {
  projectId: Types.ObjectId;
  sourceId: Types.ObjectId;
  text: string;
  page?: number;
  section?: string;
  startTime?: number;
  endTime?: number;
  score: number;
}

// Real semantic retrieval via Atlas Vector Search — scoped to the requesting
// user's project(s) so one user's content can never leak into another's
// answers. Accepts several projects for multi-document chat; callers must
// have already verified the user owns every project passed in.
export async function retrieveRelevantChunks(
  queryEmbedding: number[],
  projectIds: Types.ObjectId | Types.ObjectId[],
  topK: number = env.TOP_K
): Promise<RetrievedChunk[]> {
  const ids = Array.isArray(projectIds) ? projectIds : [projectIds];
  if (ids.length === 0) return [];

  const results = await ContentChunk.aggregate([
    {
      $vectorSearch: {
        index: env.VECTOR_INDEX_NAME,
        path: 'embedding',
        queryVector: queryEmbedding,
        numCandidates: Math.max(topK * 10, 100),
        limit: topK,
        filter: ids.length === 1 ? { projectId: { $eq: ids[0] } } : { projectId: { $in: ids } },
      },
    },
    {
      $project: {
        _id: 0,
        projectId: 1,
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
