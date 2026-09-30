import { Schema, model, Document, Types } from 'mongoose';

export type SourceStatus = 'PENDING' | 'EXTRACTING' | 'READY' | 'FAILED';

export interface ISource extends Document {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  userId: Types.ObjectId;
  type: string; // pdf, docx, text, video, audio, youtube
  originalName: string;
  storedFileName?: string; // multer-generated safe name on disk, if uploaded
  filePath?: string;
  mimeType?: string;
  sizeBytes?: number;
  sourceUrl?: string; // for youtube
  status: SourceStatus;
  failureReason?: string;

  // Extraction results
  pageCount?: number;
  durationSeconds?: number;
  wordCount?: number;
  readingTime?: string;

  // Document Intelligence
  keyTopics?: string[];
  importantDates?: { date: string; event: string }[];
  keyMetrics?: { label: string; value: string }[];
  entities?: { id: string; name: string; category: string; frequency: number; contextSnippet: string }[];
  references?: string[];

  // PDF visual understanding (charts, tables, figures) and scanned-PDF OCR
  visualElements?: { page: number; kind: string; title: string; description: string; keyData: string[] }[];
  ocrUsed?: boolean;

  // Video/YouTube Intelligence
  videoTitle?: string;
  chapters?: { id: string; timestamp: string; seconds: number; title: string; summary: string }[];
  importantQuotes?: { quote: string; speaker: string; timestamp: string }[];
  topicsDiscussed?: string[];
  shortSummary?: string;
  detailedSummary?: string;
  keyTakeaways?: string[];
  faq?: { question: string; answer: string; timestamp: string }[];
  quiz?: { id: number; question: string; options: string[]; correctAnswer: number; explanation: string; citation?: string }[];

  createdAt: Date;
  updatedAt: Date;
}

const sourceSchema = new Schema<ISource>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    originalName: { type: String, required: true },
    storedFileName: { type: String },
    filePath: { type: String },
    mimeType: { type: String },
    sizeBytes: { type: Number },
    sourceUrl: { type: String },
    status: { type: String, enum: ['PENDING', 'EXTRACTING', 'READY', 'FAILED'], default: 'PENDING', index: true },
    failureReason: { type: String },

    pageCount: { type: Number },
    durationSeconds: { type: Number },
    wordCount: { type: Number },
    readingTime: { type: String },

    keyTopics: { type: [String] },
    importantDates: [{ date: String, event: String }],
    keyMetrics: [{ label: String, value: String }],
    entities: [
      {
        id: String,
        name: String,
        category: String,
        frequency: Number,
        contextSnippet: String,
      },
    ],
    references: { type: [String] },

    visualElements: [{ _id: false, page: Number, kind: String, title: String, description: String, keyData: [String] }],
    ocrUsed: { type: Boolean },

    videoTitle: { type: String },
    chapters: [
      {
        id: String,
        timestamp: String,
        seconds: Number,
        title: String,
        summary: String,
      },
    ],
    importantQuotes: [{ quote: String, speaker: String, timestamp: String }],
    topicsDiscussed: { type: [String] },
    shortSummary: { type: String },
    detailedSummary: { type: String },
    keyTakeaways: { type: [String] },
    faq: [{ question: String, answer: String, timestamp: String }],
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
  },
  { timestamps: true }
);

export const Source = model<ISource>('Source', sourceSchema);
