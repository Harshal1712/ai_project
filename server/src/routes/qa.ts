import { Router, Response } from 'express';
import { Types } from 'mongoose';
import { Project } from '../models/Project.js';
import { Conversation } from '../models/Conversation.js';
import { AuditLog } from '../models/AuditLog.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import { answerQuestion, ChatTurn } from '../services/rag/ragService.js';
import { streamAnswerToClient, toMessagePair } from '../services/rag/streamToClient.js';

export const qaRouter = Router();

const MAX_QUERY_LENGTH = 2000;

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

function parseQuestion(body: any): { query: string; projectId: string; language?: string } {
  const { query, projectId, language } = body;
  if (!query || typeof query !== 'string' || !query.trim()) {
    throw new AppError(400, 'Query string is required');
  }
  if (query.length > MAX_QUERY_LENGTH) {
    throw new AppError(400, `Query must be at most ${MAX_QUERY_LENGTH} characters`);
  }
  if (!projectId || !Types.ObjectId.isValid(projectId)) {
    throw new AppError(400, 'A valid projectId is required — Q&A is always scoped to one project\'s content.');
  }
  return { query: query.trim(), projectId, language: typeof language === 'string' ? language : undefined };
}

// Ownership check shared by every Q&A route — retrieval can never cross into another user's content.
async function assertProjectAccess(projectId: string, userId: string): Promise<void> {
  const project = await Project.findById(projectId, { userId: 1 }).lean();
  if (!project) throw new AppError(404, 'Project not found');
  if (project.userId.toString() !== userId) {
    throw new AppError(403, 'Access forbidden: You cannot query vectors belonging to another user');
  }
}

// History comes from the stored conversation, never from the client, so a
// caller can't inject fabricated "prior answers" into the prompt.
async function loadHistory(projectId: string, userId: string): Promise<ChatTurn[]> {
  const conversation = await Conversation.findOne({ projectId, userId }, { messages: { $slice: -6 } }).lean();
  return (conversation?.messages ?? []).map((m) => ({ role: m.role, content: m.content }));
}

async function saveExchange(projectId: string, userId: string, query: string, result: Parameters<typeof toMessagePair>[1]) {
  const conversation = await Conversation.findOneAndUpdate(
    { projectId, userId },
    { $push: { messages: { $each: toMessagePair(query, result) } } },
    { upsert: true, new: true }
  );
  await AuditLog.create({ userId, projectId, action: 'QA_ASKED', detail: query.slice(0, 200) });
  return conversation;
}

// POST /api/qa/ask — real grounded RAG (spec section 19), scoped to a single
// project so retrieval can never cross into another user's content.
qaRouter.post(
  '/ask',
  authenticateToken,
  aiRateLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { query, projectId, language } = parseQuestion(req.body);
    const userId = req.user!.userId;
    await assertProjectAccess(projectId, userId);

    const history = await loadHistory(projectId, userId);
    const result = await answerQuestion(query, new Types.ObjectId(projectId), { language, history });
    const conversation = await saveExchange(projectId, userId, query, result);

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

// POST /api/qa/ask/stream — same grounded RAG, streamed as Server-Sent
// Events: `sources` (citations) first, then `token` events as the answer is
// generated, then `done` (or `error`).
qaRouter.post(
  '/ask/stream',
  authenticateToken,
  aiRateLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { query, projectId, language } = parseQuestion(req.body);
    const userId = req.user!.userId;
    await assertProjectAccess(projectId, userId);

    const history = await loadHistory(projectId, userId);
    await streamAnswerToClient(res, query, [new Types.ObjectId(projectId)], { language, history }, async (result) => {
      await saveExchange(projectId, userId, query, result);
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

// DELETE /api/qa/:projectId/conversation — start the project's Q&A over.
qaRouter.delete(
  '/:projectId/conversation',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const projectId = String(req.params.projectId);
    if (!Types.ObjectId.isValid(projectId)) {
      return res.status(404).json({ error: 'Project not found' });
    }
    await assertProjectAccess(projectId, req.user!.userId);
    await Conversation.deleteOne({ projectId, userId: req.user!.userId });
    return res.json({ success: true });
  })
);
