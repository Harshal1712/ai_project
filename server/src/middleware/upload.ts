import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { AppError } from './errorHandler.js';

const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.docx', '.txt',
  '.mp4', '.mov', '.webm',
  '.mp3', '.wav', '.m4a',
]);

if (!fs.existsSync(env.UPLOAD_DIR)) {
  fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.UPLOAD_DIR),
  filename: (_req, file, cb) => {
    // Never trust the original filename for the on-disk name — generate a fresh
    // random name and keep only the (already-validated) extension. This closes
    // path traversal / overwrite risks at the source instead of relying on
    // string-sanitizing an attacker-controlled value.
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${crypto.randomUUID()}${ext}`;
    cb(null, safeName);
  },
});

function fileFilter(_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new Error(`File type ${ext || '(none)'} is not supported. Allowed: ${[...ALLOWED_EXTENSIONS].join(', ')}`));
  }
  cb(null, true);
}

const uploadInstance = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 },
});

// multer surfaces fileFilter/size errors via its own callback, not a thrown
// exception — without this wrapper they'd fall through to the generic 500
// handler instead of a real 400 with a useful message.
export function uploadSingleFile(fieldName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    uploadInstance.single(fieldName)(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError) {
        return next(new AppError(400, err.message));
      }
      if (err instanceof Error) {
        return next(new AppError(400, err.message));
      }
      next();
    });
  };
}

// Strips directory components from a user-supplied display name so it's safe
// to store/echo back, without affecting the actual on-disk filename above.
export function sanitizeDisplayName(fileName: string): string {
  if (!fileName) return 'unnamed_document';
  const cleaned = fileName.replace(/^.*[\\/]/, '').replace(/(\.\.[/\\])+/g, '');
  return cleaned || 'sanitized_document';
}
