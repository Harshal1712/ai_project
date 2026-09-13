import fs from 'fs/promises';
import { Agenda, Job as AgendaJob } from 'agenda';
import { Types } from 'mongoose';
import { Job } from '../../models/Job.js';
import { Project } from '../../models/Project.js';
import { GeneratedOutput } from '../../models/GeneratedOutput.js';
import { AuditLog } from '../../models/AuditLog.js';
import { ingestSource } from '../../services/ingestion/ingestSource.js';
import { generateTransformationOutputs } from '../../services/generation/transformationService.js';

export interface ProcessSourceJobData {
  jobId: string;
  sourceId: string;
  projectId: string;
  userId: string;
  sourceName: string;
  filePath?: string;
  mimeType?: string;
  rawText?: string;
  sourceUrl?: string;
  outputTypes: string[];
  config: { audience: string; language: string; tone: string; detailLevel: string; objective: string };
}

async function updateJob(jobId: string, patch: Partial<{ status: string; stage: string; progress: number; error: string; startedAt: Date; completedAt: Date }>) {
  await Job.findByIdAndUpdate(jobId, patch);
}

// The single background pipeline: ingest (extract/chunk/embed/analyze) then
// generate every selected output type, updating real progress at each real
// milestone. Runs only in the worker process (`npm run worker`), never
// inline on an API request thread.
export function registerProcessSourceJob(agenda: Agenda) {
  agenda.define<ProcessSourceJobData>('process-source', async (agendaJob: AgendaJob<ProcessSourceJobData>) => {
    const data = agendaJob.attrs.data;
    const { jobId, sourceId, projectId, userId, sourceName, filePath, mimeType, rawText, sourceUrl, outputTypes, config } = data;

    try {
      await updateJob(jobId, { status: 'PROCESSING', stage: 'Extracting & embedding content', progress: 10, startedAt: new Date() });

      const { fullText } = await ingestSource(new Types.ObjectId(sourceId), { filePath, mimeType, rawText, sourceUrl });

      await updateJob(jobId, { stage: 'Generating outputs', progress: 65 });

      const drafts = outputTypes.length > 0
        ? await generateTransformationOutputs(outputTypes, fullText, sourceName, config)
        : [];

      if (drafts.length > 0) {
        await GeneratedOutput.insertMany(
          drafts.map((d) => ({
            projectId: new Types.ObjectId(projectId),
            userId: new Types.ObjectId(userId),
            ...d,
          }))
        );
      }

      await Project.findByIdAndUpdate(projectId, { status: 'Completed' });
      await updateJob(jobId, { status: 'COMPLETED', stage: 'Completed', progress: 100, completedAt: new Date() });
      await AuditLog.create({ userId, projectId, action: 'OUTPUT_GENERATED', detail: `Generated ${drafts.length} output(s) for "${sourceName}"` });
    } catch (err: any) {
      const message = err?.message || 'Processing failed for an unknown reason';
      await updateJob(jobId, { status: 'FAILED', error: message, completedAt: new Date() });
      await Project.findByIdAndUpdate(projectId, { status: 'Failed', failureReason: message });
    } finally {
      if (filePath) {
        await fs.unlink(filePath).catch(() => {});
      }
    }
  });
}
