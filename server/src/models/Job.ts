import { Schema, model, Document, Types } from 'mongoose';

export type JobType = 'PROCESS_SOURCE';

export type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface IJob extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  projectId: Types.ObjectId;
  type: JobType;
  status: JobStatus;
  stage?: string; // human-readable current step, e.g. "Extracting", "Chunking", "Embedding"
  progress: number; // 0-100, only ever set to real, measured progress
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    type: { type: String, enum: ['PROCESS_SOURCE'], required: true },
    status: { type: String, enum: ['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'QUEUED', index: true },
    stage: { type: String },
    progress: { type: Number, default: 0 },
    error: { type: String },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const Job = model<IJob>('Job', jobSchema);
