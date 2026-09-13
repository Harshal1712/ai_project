import { Schema, model, Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
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
    passwordHash: { type: String, required: true },
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
