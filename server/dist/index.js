import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.js';
import { transformationsRouter } from './routes/transformations.js';
import { youtubeRouter } from './routes/youtube.js';
import { qaRouter } from './routes/qa.js';
import { verificationRouter } from './routes/verification.js';
import { analyticsRouter } from './routes/analytics.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        system: 'ContentIQ AI Enterprise Platform',
        problemStatement: 'SIH26154',
        version: 'v2.6.0',
        timestamp: new Date().toISOString()
    });
});
// API Routes
app.use('/api/auth', authRouter);
app.use('/api/transformations', transformationsRouter);
app.use('/api/youtube', youtubeRouter);
app.use('/api/qa', qaRouter);
app.use('/api/verification', verificationRouter);
app.use('/api/analytics', analyticsRouter);
app.listen(PORT, () => {
    console.log(`⚡ ContentIQ AI Server running on http://localhost:${PORT}`);
    console.log(`🚀 Built for SIH26154 — Automated Content Transformation Platform`);
});
