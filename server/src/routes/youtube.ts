import { Router } from 'express';
import { YouTubeService } from '../services/youtubeService.js';

export const youtubeRouter = Router();

youtubeRouter.post('/analyze', (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'YouTube URL is required' });
  }

  const payload = YouTubeService.processVideo(url);
  return res.json({ success: true, data: payload });
});
