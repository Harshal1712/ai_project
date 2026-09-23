export type NavigationTab = 
  | 'dashboard'
  | 'create'
  | 'processing'
  | 'results'
  | 'projects'
  | 'documents'
  | 'video-summarizer'
  | 'document-intelligence'
  | 'verification'
  | 'templates'
  | 'history'
  | 'analytics'
  | 'settings'
  | 'chat'
  | 'study';

export type SourceType = 'pdf' | 'docx' | 'text' | 'image' | 'audio' | 'video' | 'youtube';

export type TargetAudience = 
  | 'Executive'
  | 'Technical Team'
  | 'Student'
  | 'Customer'
  | 'Employee'
  | 'General Public'
  | 'Custom';

export type OutputLanguage = 
  | 'English'
  | 'Hindi'
  | 'Marathi'
  | 'Tamil'
  | 'Telugu'
  | 'Bengali'
  | 'Custom';

export type ContentTone = 
  | 'Professional'
  | 'Simple'
  | 'Technical'
  | 'Educational'
  | 'Formal'
  | 'Conversational';

export type DetailLevel = 'Short' | 'Medium' | 'Detailed';

export type CommunicationObjective = 
  | 'Inform'
  | 'Educate'
  | 'Summarize'
  | 'Persuade'
  | 'Train'
  | 'Brief';

export type OutputType = 
  | 'Executive Summary'
  | 'Detailed Summary'
  | 'Key Points'
  | 'FAQ'
  | 'Q&A'
  | 'Presentation / PPT'
  | 'Social Media Post'
  | 'Advisory'
  | 'Infographic Content'
  | 'Training Material'
  | 'MCQs / Quiz'
  | 'Video Script'
  | 'Meeting Minutes'
  | 'Action Items';

export interface SourceContent {
  type: SourceType;
  name: string;
  url?: string;
  size?: string;
  duration?: string;
  language?: string;
  thumbnail?: string;
  rawText?: string;
  uploadDate: string;
}

export interface TransformationConfig {
  audience: TargetAudience;
  language: OutputLanguage;
  tone: ContentTone;
  detailLevel: DetailLevel;
  objective: CommunicationObjective;
}

export interface SlideData {
  slideNumber: number;
  title: string;
  bulletPoints: string[];
  speakerNotes: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface GeneratedOutput {
  id: string;
  type: OutputType;
  title: string;
  content: string;
  slides?: SlideData[];
  quiz?: QuizQuestion[];
  items?: string[];
  language?: string;
  translatedFromId?: string;
}

export interface VerificationCheck {
  id: string;
  sourceStatement: string;
  generatedStatement: string;
  status: 'verified' | 'meaning_changed' | 'nuance_shift';
  category: 'Numbers' | 'Metrics' | 'Dates' | 'Names' | 'Technical terms' | 'Requirements' | 'Conditions' | 'References';
  note: string;
}

export interface VerificationReport {
  fidelityScore: number;
  totalChecks: number;
  passedChecks: number;
  warnings: number;
  checks: VerificationCheck[];
}

export interface ExtractedEntity {
  id: string;
  name: string;
  category: 'Person' | 'Organization' | 'Technical Term' | 'Metric' | 'Date' | 'Reference';
  frequency: number;
  contextSnippet: string;
}

export interface DocumentIntelligenceData {
  documentName: string;
  wordCount: number;
  readingTime: string;
  keyTopics: string[];
  importantDates: { date: string; event: string }[];
  keyMetrics: { label: string; value: string }[];
  entities: ExtractedEntity[];
  references: string[];
  visualElements?: VisualElement[];
  ocrUsed?: boolean;
  pageCount?: number;
}

export interface VisualElement {
  page: number;
  kind: 'chart' | 'table' | 'diagram' | 'image' | 'infographic' | 'other';
  title: string;
  description: string;
  keyData: string[];
}

export interface VideoChapter {
  id: string;
  timestamp: string; // e.g. "05:32"
  seconds: number;
  title: string;
  summary: string;
}

export interface VideoIntelligenceData {
  videoTitle: string;
  videoUrl: string;
  duration: string;
  chapters: VideoChapter[];
  shortSummary: string;
  detailedSummary: string;
  keyTakeaways: string[];
  importantQuotes: { quote: string; speaker: string; timestamp: string }[];
  topicsDiscussed: string[];
  faq: { question: string; answer: string; timestamp: string }[];
  quiz: QuizQuestion[];
}

export interface ProjectItem {
  id: string;
  name: string;
  source: SourceContent;
  config: TransformationConfig;
  outputs: GeneratedOutput[];
  selectedOutputTypes: OutputType[];
  verification: VerificationReport;
  documentData?: DocumentIntelligenceData;
  videoData?: VideoIntelligenceData;
  createdAt: string;
  status: 'Completed' | 'Processing' | 'Draft' | 'Failed';
  version: string;
}

export interface TransformationTemplate {
  id: string;
  name: string;
  description: string;
  iconName: string;
  targetAudience: TargetAudience;
  tone: ContentTone;
  detailLevel: DetailLevel;
  objective: CommunicationObjective;
  outputTypes: OutputType[];
  popularFor: string;
}
