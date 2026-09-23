import { Schema, model, Document, Types } from 'mongoose';
import { chatMessageSchema, IChatMessage } from './Conversation.js';

// A multi-document chat: one conversation that retrieves across several of
// the user's projects at once (unlike Conversation, which is per-project).
export interface IChatSession extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  projectIds: Types.ObjectId[];
  language: string;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const chatSessionSchema = new Schema<IChatSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    projectIds: [{ type: Schema.Types.ObjectId, ref: 'Project', required: true }],
    language: { type: String, default: 'Auto' },
    messages: [chatMessageSchema],
  },
  { timestamps: true }
);

chatSessionSchema.index({ userId: 1, updatedAt: -1 });

export const ChatSession = model<IChatSession>('ChatSession', chatSessionSchema);
