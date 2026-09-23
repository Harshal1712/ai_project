import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

import { authRouter } from './routes/auth.js';
import { transformationsRouter } from './routes/transformations.js';
import { sourcesRouter } from './routes/sources.js';
import { jobsRouter } from './routes/jobs.js';
import { youtubeRouter } from './routes/youtube.js';
import { qaRouter } from './routes/qa.js';
import { verificationRouter } from './routes/verification.js';
import { analyticsRouter } from './routes/analytics.js';
import { historyRouter } from './routes/history.js';
import { chatRouter } from './routes/chat.js';
import { studyRouter } from './routes/study.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '2mb' })); // large payloads (files, media) go through multipart /sources/upload, not JSON
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    system: 'ContentIQ AI — Multimodal Content Intelligence Platform',
    problemStatement: 'SIH26154',
    aiModel: env.GEMINI_MODEL,
    embeddingModel: env.EMBEDDING_MODEL,
    features: {
      googleSignIn: !!env.GOOGLE_CLIENT_ID,
      passwordResetEmail: !!env.SMTP_HOST,
      pdfVisualAnalysis: env.PDF_VISUAL_ANALYSIS,
    },
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRouter);
app.use('/api/transformations', transformationsRouter);
app.use('/api/sources', sourcesRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/youtube', youtubeRouter);
app.use('/api/qa', qaRouter);
app.use('/api/verification', verificationRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/history', historyRouter);
app.use('/api/chat', chatRouter);
app.use('/api/study', studyRouter);

app.use(notFoundHandler);
app.use(errorHandler);

async function main() {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`ContentIQ AI server running on http://localhost:${env.PORT}`);
    console.log(`Built for SIH26154 — Multimodal AI Content Intelligence Platform`);
    console.log(`Remember to run "npm run worker" in a separate process to handle background jobs.`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
