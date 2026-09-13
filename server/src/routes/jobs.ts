import { Router, Response } from 'express';
import { Types } from 'mongoose';
import { Job } from '../models/Job.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const jobsRouter = Router();

// GET /api/jobs/:id — polled by the frontend's ProcessingScreen instead of
// the old fake setInterval animation. Reflects real QUEUED/PROCESSING/
// COMPLETED/FAILED state and real progress from the worker.
jobsRouter.get(
  '/:id',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!Types.ObjectId.isValid(String(req.params.id))) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = await Job.findById(req.params.id).lean();
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    if (job.userId.toString() !== req.user!.userId) {
      return res.status(403).json({ error: 'Access forbidden: You do not have permission to view this job' });
    }

    return res.json({
      job: {
        id: job._id,
        projectId: job.projectId,
        status: job.status,
        stage: job.stage,
        progress: job.progress,
        error: job.error,
      },
    });
  })
);
