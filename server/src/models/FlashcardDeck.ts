import { Schema, model, Document, Types } from 'mongoose';

// Leitner-system spaced repetition: each card sits in a box 1-5. Correct
// recalls promote it (reviewed less often), misses send it back to box 1.
export interface IFlashcard {
  _id: Types.ObjectId;
  front: string;
  back: string;
  citation?: string;
  box: number;
  dueAt: Date;
  reviewCount: number;
  correctCount: number;
  lastReviewedAt?: Date;
}

export interface IFlashcardDeck extends Document {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  userId: Types.ObjectId;
  language: string;
  cards: Types.DocumentArray<IFlashcard>;
  createdAt: Date;
  updatedAt: Date;
}

const flashcardSchema = new Schema<IFlashcard>({
  front: { type: String, required: true },
  back: { type: String, required: true },
  citation: { type: String },
  box: { type: Number, default: 1, min: 1, max: 5 },
  dueAt: { type: Date, default: Date.now },
  reviewCount: { type: Number, default: 0 },
  correctCount: { type: Number, default: 0 },
  lastReviewedAt: { type: Date },
});

const flashcardDeckSchema = new Schema<IFlashcardDeck>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    language: { type: String, default: 'English' },
    cards: [flashcardSchema],
  },
  { timestamps: true }
);

flashcardDeckSchema.index({ projectId: 1, userId: 1 }, { unique: true });

export const FlashcardDeck = model<IFlashcardDeck>('FlashcardDeck', flashcardDeckSchema);
