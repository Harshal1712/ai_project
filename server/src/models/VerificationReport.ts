import { Schema, model, Document, Types } from 'mongoose';

export type VerificationStatus = 'verified' | 'meaning_changed' | 'nuance_shift' | 'unsupported';

export interface IVerificationCheck {
  id: string;
  sourceStatement: string;
  generatedStatement: string;
  status: VerificationStatus;
  category: string;
  note: string;
}

export interface IVerificationReport extends Document {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  userId: Types.ObjectId;
  outputId?: Types.ObjectId;
  fidelityScore: number;
  totalChecks: number;
  passedChecks: number;
  warnings: number;
  checks: IVerificationCheck[];
  createdAt: Date;
}

const verificationReportSchema = new Schema<IVerificationReport>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    outputId: { type: Schema.Types.ObjectId, ref: 'GeneratedOutput' },
    fidelityScore: { type: Number, required: true },
    totalChecks: { type: Number, required: true },
    passedChecks: { type: Number, required: true },
    warnings: { type: Number, required: true },
    checks: [
      {
        id: String,
        sourceStatement: String,
        generatedStatement: String,
        status: { type: String, enum: ['verified', 'meaning_changed', 'nuance_shift', 'unsupported'] },
        category: String,
        note: String,
      },
    ],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const VerificationReport = model<IVerificationReport>('VerificationReport', verificationReportSchema);
