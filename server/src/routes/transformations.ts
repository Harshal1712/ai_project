import { Router, Response } from 'express';
import { Types } from 'mongoose';
import { Project } from '../models/Project.js';
import { Source } from '../models/Source.js';
import { ContentChunk } from '../models/ContentChunk.js';
import { GeneratedOutput } from '../models/GeneratedOutput.js';
import { VerificationReport } from '../models/VerificationReport.js';
import { Conversation } from '../models/Conversation.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import { createProjectAndEnqueue } from '../services/projectCreationService.js';

export const transformationsRouter = Router();

const DEFAULT_CONFIG = { audience: 'Executive', language: 'English', tone: 'Professional', detailLevel: 'Medium', objective: 'Brief' };
const DEFAULT_OUTPUTS = ['Executive Summary', 'Key Points'];
const DOCUMENT_TYPES = ['pdf', 'docx', 'text'];
const VIDEO_TYPES = ['video', 'audio', 'youtube'];

function formatDuration(seconds?: number): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Builds the lightweight SourceContent shape the frontend expects (src/types/index.ts),
// independent of the richer Source document used for document/video intelligence.
function toSourceContent(project: any, source?: any) {
  return {
    type: project.sourceType,
    name: project.sourceName,
    url: project.sourceUrl,
    size: project.sourceSize,
    duration: source ? formatDuration(source.durationSeconds) : undefined,
    language: project.sourceLanguage,
    uploadDate: new Date(project.createdAt).toISOString().split('T')[0],
  };
}

function serializeProjectSummary(project: any) {
  return {
    id: project._id.toString(),
    name: project.name,
    source: toSourceContent(project),
    config: project.config,
    selectedOutputTypes: project.selectedOutputTypes,
    status: project.status,
    version: project.version,
    createdAt: project.createdAt,
    outputs: [],
    verification: null,
  };
}

// POST /api/transformations/generate — JSON-only creation path, for source
// types that don't require binary file bytes: 'text' (rawText) and
// 'youtube' (url). Real file types (pdf/docx/txt/video/audio) go through
// POST /api/sources/upload instead. Returns 202 + jobId — processing happens
// asynchronously in the worker, never inline on this request.
transformationsRouter.post(
  '/generate',
  authenticateToken,
  aiRateLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const { source, config, outputs } = req.body;

    const sourceType = source?.type;
    if (sourceType !== 'text' && sourceType !== 'youtube') {
      throw new AppError(400, `Source type "${sourceType}" requires a file upload — use POST /api/sources/upload instead.`);
    }
    if (sourceType === 'text' && !source?.rawText?.trim()) {
      throw new AppError(400, 'Text sources require a non-empty "rawText" field.');
    }
    if (sourceType === 'youtube' && !source?.url?.trim()) {
      throw new AppError(400, 'YouTube sources require a "url" field.');
    }

    const sourceName = source?.name || (sourceType === 'youtube' ? source.url : 'Pasted Text.txt');

    const { projectId, jobId } = await createProjectAndEnqueue({
      userId,
      sourceType,
      sourceName,
      sourceUrl: sourceType === 'youtube' ? source.url : undefined,
      sourceLanguage: source?.language,
      rawText: sourceType === 'text' ? source.rawText : undefined,
      config: { ...DEFAULT_CONFIG, ...config },
      outputTypes: outputs && outputs.length > 0 ? outputs : DEFAULT_OUTPUTS,
    });

    return res.status(202).json({ success: true, projectId, jobId, status: 'QUEUED' });
  })
);

transformationsRouter.get(
  '/projects',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const projects = await Project.find({ userId: req.user!.userId }).sort({ createdAt: -1 }).lean();
    return res.json({ projects: projects.map(serializeProjectSummary) });
  })
);

transformationsRouter.get(
  '/projects/:id',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!Types.ObjectId.isValid(String(req.params.id))) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = await Project.findById(req.params.id).lean();
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (project.userId.toString() !== req.user!.userId) {
      return res.status(403).json({ error: 'Access forbidden: You do not have permission to view this project' });
    }

    const [source, outputs, verification] = await Promise.all([
      Source.findOne({ projectId: project._id }).lean(),
      GeneratedOutput.find({ projectId: project._id }).sort({ createdAt: 1 }).lean(),
      VerificationReport.findOne({ projectId: project._id }).sort({ createdAt: -1 }).lean(),
    ]);

    const isDocument = DOCUMENT_TYPES.includes(project.sourceType);
    const isVideo = VIDEO_TYPES.includes(project.sourceType);

    const documentData = source && isDocument ? {
      documentName: source.originalName,
      wordCount: source.wordCount || 0,
      readingTime: source.readingTime || '',
      keyTopics: source.keyTopics || [],
      importantDates: source.importantDates || [],
      keyMetrics: source.keyMetrics || [],
      entities: source.entities || [],
      references: source.references || [],
    } : undefined;

    const videoData = source && isVideo ? {
      videoTitle: source.videoTitle || source.originalName,
      videoUrl: source.sourceUrl || '',
      duration: formatDuration(source.durationSeconds),
      chapters: source.chapters || [],
      shortSummary: source.shortSummary || '',
      detailedSummary: source.detailedSummary || '',
      keyTakeaways: source.keyTakeaways || [],
      importantQuotes: source.importantQuotes || [],
      topicsDiscussed: source.topicsDiscussed || [],
      faq: source.faq || [],
      quiz: source.quiz || [],
    } : undefined;

    return res.json({
      project: {
        id: project._id.toString(),
        name: project.name,
        source: toSourceContent(project, source),
        config: project.config,
        selectedOutputTypes: project.selectedOutputTypes,
        status: project.status,
        version: project.version,
        createdAt: project.createdAt,
        failureReason: project.failureReason,
        outputs: outputs.map((o) => ({
          id: o._id.toString(),
          type: o.type,
          title: o.title,
          content: o.content,
          slides: o.slides,
          quiz: o.quiz,
          items: o.items,
        })),
        verification: verification
          ? {
              fidelityScore: verification.fidelityScore,
              totalChecks: verification.totalChecks,
              passedChecks: verification.passedChecks,
              warnings: verification.warnings,
              checks: verification.checks,
            }
          : null,
        documentData,
        videoData,
      },
    });
  })
);

transformationsRouter.delete(
  '/projects/:id',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!Types.ObjectId.isValid(String(req.params.id))) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (project.userId.toString() !== req.user!.userId) {
      return res.status(403).json({ error: 'Access forbidden: You do not have permission to delete this project' });
    }

    // Mongoose has no cascading deletes — clean up every dependent collection explicitly.
    await Promise.all([
      Source.deleteMany({ projectId: project._id }),
      ContentChunk.deleteMany({ projectId: project._id }),
      GeneratedOutput.deleteMany({ projectId: project._id }),
      VerificationReport.deleteMany({ projectId: project._id }),
      Conversation.deleteMany({ projectId: project._id }),
    ]);
    await project.deleteOne();

    return res.json({ success: true, message: 'Project deleted successfully' });
  })
);
