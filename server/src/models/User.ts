import { Schema, model, Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash?: string; // absent for accounts created through Google sign-in
  googleId?: string;
  avatarUrl?: string;
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: Date;
  role: 'ADMIN' | 'ARCHITECT' | 'ANALYST';
  preferences: {
    defaultAudience: string;
    defaultLanguage: string;
    defaultTone: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    googleId: { type: String, unique: true, sparse: true },
    avatarUrl: { type: String },
    // Only the SHA-256 of the reset token is stored, so a database leak can't be used to reset passwords.
    passwordResetTokenHash: { type: String, index: true },
    passwordResetExpiresAt: { type: Date },
    role: { type: String, enum: ['ADMIN', 'ARCHITECT', 'ANALYST'], default: 'ANALYST' },
    preferences: {
      defaultAudience: { type: String, default: 'Executive' },
      defaultLanguage: { type: String, default: 'English' },
      defaultTone: { type: String, default: 'Professional' },
    },
  },
  { timestamps: true }
);

export const User = model<IUser>('User', userSchema);
