import { Router, Response, Request } from 'express';
import { extractYoutube } from '../services/extraction/youtubeExtractor.js';
import { analyzeVideoIntelligence } from '../services/generation/videoIntelligenceService.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';

export const youtubeRouter = Router();

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// POST /api/youtube/analyze — a lightweight, unauthenticated real-time
// preview (real transcript + real chapter/summary analysis, but not
// persisted) used by CreateTransformation's "analyze before submitting"
// step. Actually creating a project from a YouTube URL goes through
// POST /api/transformations/generate, which persists chunks/embeddings.
youtubeRouter.post(
  '/analyze',
  aiRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { url } = req.body;
    if (!url || !url.trim()) {
      throw new AppError(400, 'YouTube URL is required');
    }

    const extraction = await extractYoutube(url).catch((err: Error) => {
      throw new AppError(422, err.message);
    });
    const intelligence = await analyzeVideoIntelligence(extraction.segments, extraction.videoTitle, extraction.durationSeconds);

    return res.json({
      success: true,
      data: {
        videoTitle: extraction.videoTitle,
        videoUrl: url,
        duration: formatDuration(extraction.durationSeconds),
        thumbnailUrl: extraction.thumbnailUrl,
        chapters: intelligence.chapters.map((c, i) => ({
          id: `c${i + 1}`,
          timestamp: formatDuration(c.startTime),
          seconds: Math.round(c.startTime),
          title: c.title,
          summary: c.summary,
        })),
        keyTakeaways: intelligence.keyTakeaways,
        importantQuotes: intelligence.importantQuotes,
        topicsDiscussed: intelligence.topicsDiscussed,
        faq: intelligence.faq,
      },
    });
  })
);
