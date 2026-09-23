import { Schema, model, Document, Types } from 'mongoose';

export interface IChatCitation {
  projectId?: string;
  sourceId: string;
  sourceName?: string;
  page?: number;
  section?: string;
  startTime?: number;
  endTime?: number;
  text: string;
  score: number;
}

export interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations: IChatCitation[];
  createdAt: Date;
}

export interface IConversation extends Document {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  userId: Types.ObjectId;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// Shared with ChatSession so both chat types store messages identically.
export const chatMessageSchema = new Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    citations: [
      {
        projectId: String,
        sourceId: String,
        sourceName: String,
        page: Number,
        section: String,
        startTime: Number,
        endTime: Number,
        text: String,
        score: Number,
      },
    ],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const conversationSchema = new Schema<IConversation>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    messages: [
      {
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        citations: [
          {
            projectId: String,
            sourceId: String,
            sourceName: String,
            page: Number,
            section: String,
            startTime: Number,
            endTime: Number,
            text: String,
            score: Number,
          },
        ],
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const Conversation = model<IConversation>('Conversation', conversationSchema);
