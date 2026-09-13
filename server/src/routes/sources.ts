import { Router, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import { uploadSingleFile, sanitizeDisplayName } from '../middleware/upload.js';
import { createProjectAndEnqueue } from '../services/projectCreationService.js';
import { SourceType } from '../models/Project.js';

export const sourcesRouter = Router();

const EXT_TO_TYPE: Record<string, SourceType> = {
  '.pdf': 'pdf',
  '.docx': 'docx',
  '.txt': 'text',
  '.mp4': 'video',
  '.mov': 'video',
  '.webm': 'video',
  '.mp3': 'audio',
  '.wav': 'audio',
  '.m4a': 'audio',
};

const EXT_TO_MIME: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// POST /api/sources/upload — multipart creation path for source types that
// require real file bytes (pdf/docx/txt/video/audio). config/outputs arrive
// as JSON-encoded form fields since multipart forms are string-only.
sourcesRouter.post(
  '/upload',
  authenticateToken,
  aiRateLimiter,
  uploadSingleFile('file'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      throw new AppError(400, 'No file was uploaded, or its type is not supported.');
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const sourceType = EXT_TO_TYPE[ext];
    if (!sourceType) {
      await fs.unlink(req.file.path).catch(() => {});
      throw new AppError(400, `Unsupported file extension: ${ext}`);
    }

    let config = {};
    let outputTypes: string[] = ['Executive Summary', 'Key Points'];
    try {
      if (req.body.config) config = JSON.parse(req.body.config);
      if (req.body.outputs) outputTypes = JSON.parse(req.body.outputs);
    } catch {
      await fs.unlink(req.file.path).catch(() => {});
      throw new AppError(400, '"config" and "outputs" fields must be valid JSON.');
    }

    const mimeType = EXT_TO_MIME[ext] || req.file.mimetype;
    const displayName = sanitizeDisplayName(req.file.originalname);

    const { projectId, jobId } = await createProjectAndEnqueue({
      userId: req.user!.userId,
      sourceType,
      sourceName: displayName,
      sourceSize: formatFileSize(req.file.size),
      filePath: req.file.path,
      mimeType,
      config: { audience: 'Executive', language: 'English', tone: 'Professional', detailLevel: 'Medium', objective: 'Brief', ...config },
      outputTypes,
    });

    return res.status(202).json({ success: true, projectId, jobId, status: 'QUEUED' });
  })
);
