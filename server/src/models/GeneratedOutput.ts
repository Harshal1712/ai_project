import { Schema, model, Document, Types } from 'mongoose';

export interface ISlide {
  slideNumber: number;
  title: string;
  bulletPoints: string[];
  speakerNotes: string;
}

export interface IQuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  citation?: string;
}

export interface IGeneratedOutput extends Document {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  userId: Types.ObjectId;
  type: string;
  title: string;
  content: string;
  slides?: ISlide[];
  quiz?: IQuizQuestion[];
  items?: string[];
  createdAt: Date;
}

const generatedOutputSchema = new Schema<IGeneratedOutput>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    slides: [
      {
        slideNumber: Number,
        title: String,
        bulletPoints: [String],
        speakerNotes: String,
      },
    ],
    quiz: [
      {
        id: Number,
        question: String,
        options: [String],
        correctAnswer: Number,
        explanation: String,
        citation: String,
      },
    ],
    items: { type: [String] },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const GeneratedOutput = model<IGeneratedOutput>('GeneratedOutput', generatedOutputSchema);
