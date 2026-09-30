import { Schema, model, Document, Types } from 'mongoose';

export type AuditAction =
  | 'USER_REGISTERED'
  | 'USER_LOGIN'
  | 'PROJECT_CREATED'
  | 'PROJECT_DELETED'
  | 'SOURCE_PROCESSED'
  | 'OUTPUT_GENERATED'
  | 'VERIFICATION_RUN'
  | 'QA_ASKED'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET'
  | 'GOOGLE_LOGIN'
  | 'FLASHCARDS_GENERATED'
  | 'QUIZ_ATTEMPTED'
  | 'OUTPUT_TRANSLATED';

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  projectId?: Types.ObjectId;
  action: AuditAction;
  detail: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    action: { type: String, required: true },
    detail: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ userId: 1, createdAt: -1 });

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
