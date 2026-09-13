import { Router, Response } from 'express';
import { AuditLog } from '../models/AuditLog.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const historyRouter = Router();

// GET /api/history — the authenticated user's real audit trail, replacing
// HistoryPage's previously fully-inline hardcoded log entries.
historyRouter.get(
  '/',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const logs = await AuditLog.find({ userId: req.user!.userId }).sort({ createdAt: -1 }).limit(100).lean();
    return res.json({ logs });
  })
);
