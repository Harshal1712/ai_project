import mongoose from 'mongoose';
import { env } from './env.js';

let connected = false;

export async function connectDB(): Promise<void> {
  if (connected) return;

  mongoose.set('strictQuery', true);

  await mongoose.connect(env.MONGODB_URI);
  connected = true;

  console.log(`Connected to MongoDB: ${mongoose.connection.name}`);

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });
}

export async function disconnectDB(): Promise<void> {
  if (!connected) return;
  await mongoose.disconnect();
  connected = false;
}
