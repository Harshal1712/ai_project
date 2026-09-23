import { Router, Response } from 'express';
import { Types } from 'mongoose';
import { Project } from '../models/Project.js';
import { ChatSession, IChatSession } from '../models/ChatSession.js';
import { AuditLog } from '../models/AuditLog.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import { streamAnswerToClient, toMessagePair } from '../services/rag/streamToClient.js';

// Multi-document chat: a conversation that retrieves across several of the
// user's projects at once, with per-document citations.
export const chatRouter = Router();

const MAX_PROJECTS_PER_SESSION = 10;
const MAX_QUERY_LENGTH = 2000;
const HISTORY_TURNS = 6;

// Every project must exist, belong to the caller, and have finished processing
// (otherwise it has no embedded chunks to retrieve from).
async function validateProjectIds(raw: unknown, userId: string): Promise<Types.ObjectId[]> {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new AppError(400, 'Select at least one document to chat with.');
  }
  const unique = [...new Set(raw.map(String))];
  if (unique.length > MAX_PROJECTS_PER_SESSION) {
    throw new AppError(400, `A chat can include at most ${MAX_PROJECTS_PER_SESSION} documents.`);
  }
  if (!unique.every((id) => Types.ObjectId.isValid(id))) {
    throw new AppError(400, 'One or more document IDs are invalid.');
  }

  const projects = await Project.find({ _id: { $in: unique } }, { userId: 1, status: 1, name: 1 }).lean();
  if (projects.length !== unique.length) throw new AppError(404, 'One or more documents were not found.');
  if (projects.some((p) => p.userId.toString() !== userId)) {
    throw new AppError(403, 'Access forbidden: You can only chat with your own documents.');
  }
  const notReady = projects.filter((p) => p.status !== 'Completed');
  if (notReady.length > 0) {
    throw new AppError(400, `These documents haven't finished processing yet: ${notReady.map((p) => p.name).join(', ')}`);
  }
  return unique.map((id) => new Types.ObjectId(id));
}

async function loadOwnedSession(id: string, userId: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError(404, 'Chat not found');
  const session = await ChatSession.findById(id);
  if (!session) throw new AppError(404, 'Chat not found');
  if (session.userId.toString() !== userId) throw new AppError(403, 'Access forbidden');
  return session;
}

async function serializeSession(session: IChatSession, includeMessages: boolean) {
  const projects = await Project.find({ _id: { $in: session.projectIds } }, { name: 1, sourceType: 1, sourceName: 1 }).lean();
  return {
    id: session._id.toString(),
    title: session.title,
    language: session.language,
    projects: projects.map((p) => ({ id: p._id.toString(), name: p.name, sourceType: p.sourceType, sourceName: p.sourceName })),
    messageCount: session.messages.length,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    ...(includeMessages ? { messages: session.messages } : {}),
  };
}

chatRouter.get(
  '/sessions',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const sessions = await ChatSession.find({ userId: req.user!.userId }, { messages: 0 }).sort({ updatedAt: -1 }).limit(50);
    const counts = await ChatSession.aggregate([
      { $match: { userId: new Types.ObjectId(req.user!.userId) } },
      { $project: { count: { $size: '$messages' } } },
    ]);
    const countById = new Map(counts.map((c) => [c._id.toString(), c.count as number]));

    const serialized = await Promise.all(
      sessions.map(async (s) => ({ ...(await serializeSession(s, false)), messageCount: countById.get(s._id.toString()) ?? 0 }))
    );
    return res.json({ sessions: serialized });
  })
);

chatRouter.post(
  '/sessions',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const projectIds = await validateProjectIds(req.body.projectIds, userId);
    const title = typeof req.body.title === 'string' && req.body.title.trim()
      ? req.body.title.trim().slice(0, 120)
      : `Chat across ${projectIds.length} document${projectIds.length === 1 ? '' : 's'}`;

    const session = await ChatSession.create({
      userId,
      title,
      projectIds,
      language: typeof req.body.language === 'string' ? req.body.language : 'Auto',
      messages: [],
    });
    return res.status(201).json({ session: await serializeSession(session, true) });
  })
);

chatRouter.get(
  '/sessions/:id',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const session = await loadOwnedSession(String(req.params.id), req.user!.userId);
    return res.json({ session: await serializeSession(session, true) });
  })
);

chatRouter.patch(
  '/sessions/:id',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const session = await loadOwnedSession(String(req.params.id), userId);
    const { title, projectIds, language } = req.body;

    if (typeof title === 'string' && title.trim()) session.title = title.trim().slice(0, 120);
    if (typeof language === 'string') session.language = language;
    if (projectIds !== undefined) session.projectIds = await validateProjectIds(projectIds, userId);

    await session.save();
    return res.json({ session: await serializeSession(session, true) });
  })
);

chatRouter.delete(
  '/sessions/:id',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const session = await loadOwnedSession(String(req.params.id), req.user!.userId);
    await session.deleteOne();
    return res.json({ success: true });
  })
);

// POST /api/chat/sessions/:id/ask/stream — grounded answer across every
// document in the session, streamed as Server-Sent Events.
chatRouter.post(
  '/sessions/:id/ask/stream',
  authenticateToken,
  aiRateLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const session = await loadOwnedSession(String(req.params.id), userId);

    const { query } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) throw new AppError(400, 'Query string is required');
    if (query.length > MAX_QUERY_LENGTH) throw new AppError(400, `Query must be at most ${MAX_QUERY_LENGTH} characters`);

    // Re-check ownership at ask time: a project may have been deleted since the chat was created.
    const liveProjects = await Project.find({ _id: { $in: session.projectIds }, userId }, { _id: 1 }).lean();
    if (liveProjects.length === 0) {
      throw new AppError(400, 'None of the documents in this chat exist anymore. Start a new chat.');
    }

    const language = typeof req.body.language === 'string' ? req.body.language : session.language;
    const history = session.messages.slice(-HISTORY_TURNS).map((m) => ({ role: m.role, content: m.content }));
    const trimmedQuery = query.trim();

    await streamAnswerToClient(res, trimmedQuery, liveProjects.map((p) => p._id), { language, history }, async (result) => {
      await ChatSession.updateOne(
        { _id: session._id },
        { $push: { messages: { $each: toMessagePair(trimmedQuery, result) } }, $set: { language } }
      );
      await AuditLog.create({ userId, action: 'QA_ASKED', detail: `[multi-doc] ${trimmedQuery.slice(0, 190)}` });
    });
  })
);
