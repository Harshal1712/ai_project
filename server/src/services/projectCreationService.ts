import { Types } from 'mongoose';
import { Project, SourceType } from '../models/Project.js';
import { Source } from '../models/Source.js';
import { AuditLog } from '../models/AuditLog.js';
import { createJobRecord, enqueueProcessSourceJob } from './jobService.js';
import { TransformationConfig } from './generation/transformationService.js';

export interface CreateProjectParams {
  userId: string;
  sourceType: SourceType;
  sourceName: string;
  sourceUrl?: string;
  sourceSize?: string;
  sourceLanguage?: string;
  rawText?: string;
  filePath?: string;
  mimeType?: string;
  config: TransformationConfig;
  outputTypes: string[];
}

export interface CreateProjectResult {
  projectId: string;
  jobId: string;
}

// Shared by both the JSON generate route (text/youtube) and the multipart
// upload route (pdf/docx/txt/video/audio): creates the Project+Source+Job
// records, then hands off the actual work to the background worker.
export async function createProjectAndEnqueue(params: CreateProjectParams): Promise<CreateProjectResult> {
  const userId = new Types.ObjectId(params.userId);

  const project = await Project.create({
    userId,
    name: `${params.sourceName.replace(/\.[^/.]+$/, '')} Transformation`,
    sourceType: params.sourceType,
    sourceName: params.sourceName,
    sourceUrl: params.sourceUrl,
    sourceSize: params.sourceSize,
    sourceLanguage: params.sourceLanguage || 'English',
    config: params.config,
    selectedOutputTypes: params.outputTypes,
    status: 'Processing',
  });

  const source = await Source.create({
    projectId: project._id,
    userId,
    type: params.sourceType,
    originalName: params.sourceName,
    filePath: params.filePath,
    mimeType: params.mimeType,
    sourceUrl: params.sourceUrl,
    status: 'PENDING',
  });

  const job = await createJobRecord(userId, project._id);

  await enqueueProcessSourceJob({
    jobId: job._id.toString(),
    sourceId: source._id.toString(),
    projectId: project._id.toString(),
    userId: userId.toString(),
    sourceName: params.sourceName,
    filePath: params.filePath,
    mimeType: params.mimeType,
    rawText: params.rawText,
    sourceUrl: params.sourceUrl,
    outputTypes: params.outputTypes,
    config: params.config,
  });

  await AuditLog.create({ userId, projectId: project._id, action: 'PROJECT_CREATED', detail: `Created project from ${params.sourceType} source "${params.sourceName}"` });

  return { projectId: project._id.toString(), jobId: job._id.toString() };
}
