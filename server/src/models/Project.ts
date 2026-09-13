import { Schema, model, Document, Types } from 'mongoose';

export type SourceType = 'pdf' | 'docx' | 'text' | 'image' | 'audio' | 'video' | 'youtube';
export type ProjectStatus = 'Draft' | 'Processing' | 'Completed' | 'Failed';

export interface IProject extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  sourceType: SourceType;
  sourceName: string;
  sourceUrl?: string;
  sourceSize?: string;
  sourceDuration?: string;
  sourceLanguage: string;
  config: {
    audience: string;
    language: string;
    tone: string;
    detailLevel: string;
    objective: string;
  };
  selectedOutputTypes: string[];
  status: ProjectStatus;
  version: string;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    sourceType: { type: String, required: true },
    sourceName: { type: String, required: true },
    sourceUrl: { type: String },
    sourceSize: { type: String },
    sourceDuration: { type: String },
    sourceLanguage: { type: String, default: 'English' },
    config: {
      audience: { type: String, default: 'Executive' },
      language: { type: String, default: 'English' },
      tone: { type: String, default: 'Professional' },
      detailLevel: { type: String, default: 'Medium' },
      objective: { type: String, default: 'Brief' },
    },
    selectedOutputTypes: { type: [String], default: [] },
    status: { type: String, enum: ['Draft', 'Processing', 'Completed', 'Failed'], default: 'Draft', index: true },
    version: { type: String, default: 'v1.0' },
    failureReason: { type: String },
  },
  { timestamps: true }
);

projectSchema.index({ userId: 1, createdAt: -1 });

export const Project = model<IProject>('Project', projectSchema);
