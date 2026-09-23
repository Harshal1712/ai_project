import { Schema, model, Document, Types } from 'mongoose';

export interface IQuizAttempt extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  projectId: Types.ObjectId;
  outputId?: Types.ObjectId;
  score: number;
  total: number;
  createdAt: Date;
}

const quizAttemptSchema = new Schema<IQuizAttempt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    outputId: { type: Schema.Types.ObjectId, ref: 'GeneratedOutput' },
    score: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 1 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

quizAttemptSchema.index({ userId: 1, projectId: 1, createdAt: -1 });

export const QuizAttempt = model<IQuizAttempt>('QuizAttempt', quizAttemptSchema);
