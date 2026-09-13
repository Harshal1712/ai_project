import { Router, Response } from 'express';
import { Types } from 'mongoose';
import { Project } from '../models/Project.js';
import { Conversation } from '../models/Conversation.js';
import { AuditLog } from '../models/AuditLog.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import { answerQuestion } from '../services/rag/ragService.js';

export const qaRouter = Router();

function buildCitationLabel(source: { page?: number; section?: string; startTime?: number; endTime?: number } | undefined): string {
  if (!source) return 'Grounding verification: no matching source content found';
  if (source.page != null) return `Page ${source.page}`;
  if (source.section) return `Section: ${source.section}`;
  if (source.startTime != null) {
    const format = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    return `${format(source.startTime)} - ${format(source.endTime ?? source.startTime)}`;
  }
  return 'Source content';
}

// POST /api/qa/ask — real grounded RAG (spec section 19), scoped to a single
// project so retrieval can never cross into another user's content.
qaRouter.post(
  '/ask',
  authenticateToken,
  aiRateLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { query, projectId } = req.body;

    if (!query || !query.trim()) {
      throw new AppError(400, 'Query string is required');
    }
    if (!projectId || !Types.ObjectId.isValid(projectId)) {
      throw new AppError(400, 'A valid projectId is required — Q&A is always scoped to one project\'s content.');
    }

    const project = await Project.findById(projectId).lean();
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (project.userId.toString() !== req.user!.userId) {
      return res.status(403).json({ error: 'Access forbidden: You cannot query vectors belonging to another user' });
    }

    const result = await answerQuestion(query, new Types.ObjectId(projectId));

    const conversation = await Conversation.findOneAndUpdate(
      { projectId, userId: req.user!.userId },
      {
        $push: {
          messages: {
            $each: [
              { role: 'user', content: query, citations: [] },
              {
                role: 'assistant',
                content: result.answer,
                citations: result.sources.map((s) => ({
                  sourceId: s.sourceId,
                  page: s.page,
                  startTime: s.startTime,
                  endTime: s.endTime,
                  text: s.text,
                  score: s.score,
                })),
              },
            ],
          },
        },
      },
      { upsert: true, new: true }
    );

    await AuditLog.create({ userId: req.user!.userId, projectId, action: 'QA_ASKED', detail: query.slice(0, 200) });

    return res.json({
      success: true,
      result: {
        answer: result.answer,
        grounded: result.grounded,
        citation: buildCitationLabel(result.sources[0]),
        sources: result.sources,
        conversationId: conversation._id,
      },
    });
  })
);

// GET /api/qa/:projectId/conversation — reopen a project's previous Q&A history (spec section 40).
qaRouter.get(
  '/:projectId/conversation',
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

    const conversation = await Conversation.findOne({ projectId, userId: req.user!.userId }).lean();
    return res.json({ messages: conversation?.messages || [] });
  })
);
