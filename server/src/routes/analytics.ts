import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getGlobalTelemetry, getUserTelemetry } from '../services/analyticsService.js';

export const analyticsRouter = Router();

// GET /api/analytics/telemetry — global, aggregate-only platform metrics
// (no per-user content exposed). Every number is computed live from the
// database — replaces the old hardcoded constants entirely.
analyticsRouter.get(
  '/telemetry',
  asyncHandler(async (_req: Request, res: Response) => {
    const telemetry = await getGlobalTelemetry();
    return res.json(telemetry);
  })
);

// GET /api/analytics/summary — the authenticated user's own stats, for the AnalyticsPage dashboard.
analyticsRouter.get(
  '/summary',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const metrics = await getUserTelemetry(new Types.ObjectId(req.user!.userId));
    return res.json({ metrics });
  })
);
