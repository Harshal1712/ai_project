import { Router, Response } from 'express';
import { Types } from 'mongoose';
import { Project } from '../models/Project.js';
import { GeneratedOutput } from '../models/GeneratedOutput.js';
import { VerificationReport } from '../models/VerificationReport.js';
import { AuditLog } from '../models/AuditLog.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import { verifyGeneratedContent } from '../services/verification/verificationService.js';

export const verificationRouter = Router();

// POST /api/verification/audit — real grounding/consistency verification
// (spec section 28) of a project's generated output against its own source
// chunks. Replaces the old FactVerificationService, which returned 5 fixed
// hardcoded checks regardless of input.
verificationRouter.post(
  '/audit',
  authenticateToken,
  aiRateLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { projectId, outputId } = req.body;

    if (!projectId || !Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'A valid projectId is required.');
    }

    const project = await Project.findById(projectId).lean();
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (project.userId.toString() !== req.user!.userId) {
      return res.status(403).json({ error: 'Access forbidden: You do not have permission to verify this project' });
    }

    let contentToVerify: string;
    let resolvedOutputId: Types.ObjectId | undefined;

    if (outputId) {
      const output = await GeneratedOutput.findOne({ _id: outputId, projectId });
      if (!output) throw new AppError(404, 'Generated output not found for this project.');
      contentToVerify = output.content;
      resolvedOutputId = output._id;
    } else {
      const outputs = await GeneratedOutput.find({ projectId }).lean();
      if (outputs.length === 0) {
        throw new AppError(400, 'This project has no generated outputs yet to verify.');
      }
      contentToVerify = outputs.map((o) => o.content).join('\n\n');
    }

    const draft = await verifyGeneratedContent(contentToVerify, new Types.ObjectId(projectId));

    const report = await VerificationReport.create({
      projectId,
      userId: req.user!.userId,
      outputId: resolvedOutputId,
      ...draft,
    });

    await AuditLog.create({ userId: req.user!.userId, projectId, action: 'VERIFICATION_RUN', detail: `Fidelity score: ${draft.fidelityScore}%` });

    return res.json({ success: true, report });
  })
);

// GET /api/verification/:projectId/latest — fetch the most recent report without re-running verification.
verificationRouter.get(
  '/:projectId/latest',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { projectId } = req.params;
    if (!Types.ObjectId.isValid(String(projectId))) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = await Project.findById(projectId).lean();
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (project.userId.toString() !== req.user!.userId) {
      return res.status(403).json({ error: 'Access forbidden' });
    }

    const report = await VerificationReport.findOne({ projectId }).sort({ createdAt: -1 }).lean();
    return res.json({ report: report || null });
  })
);
