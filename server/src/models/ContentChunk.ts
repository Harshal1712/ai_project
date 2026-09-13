import { Schema, model, Document, Types } from 'mongoose';
import { env } from '../config/env.js';

export interface IContentChunk extends Document {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  sourceId: Types.ObjectId;
  userId: Types.ObjectId;
  chunkIndex: number;
  text: string;
  page?: number;
  section?: string; // used instead of `page` for DOCX, which has no stored pagination
  startTime?: number;
  endTime?: number;
  embedding: number[];
  createdAt: Date;
}

const contentChunkSchema = new Schema<IContentChunk>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    sourceId: { type: Schema.Types.ObjectId, ref: 'Source', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    chunkIndex: { type: Number, required: true },
    text: { type: String, required: true },
    page: { type: Number },
    section: { type: String },
    startTime: { type: Number },
    endTime: { type: Number },
    embedding: {
      type: [Number],
      required: true,
      validate: {
        validator: (v: number[]) => v.length === env.EMBEDDING_DIMENSIONS,
        message: `embedding must have exactly ${env.EMBEDDING_DIMENSIONS} dimensions`,
      },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Vector search itself is served by the Atlas Search index (see scripts/createVectorIndex.ts),
// which cannot be declared through Mongoose — this compound index only speeds up the
// non-vector filter stage ($match on projectId) evaluated alongside $vectorSearch.
contentChunkSchema.index({ projectId: 1, sourceId: 1 });

export const ContentChunk = model<IContentChunk>('ContentChunk', contentChunkSchema);
