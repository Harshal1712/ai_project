import { Types } from 'mongoose';
import { agenda } from '../jobs/agenda.js';
import { Job } from '../models/Job.js';
import { ProcessSourceJobData } from '../jobs/definitions/processSource.job.js';

// Thin seam between routes and the underlying queue implementation (Agenda
// today) so the queue can be swapped later without touching route code.
export async function enqueueProcessSourceJob(data: ProcessSourceJobData): Promise<void> {
  await agenda.now('process-source', data);
}

export async function createJobRecord(userId: Types.ObjectId, projectId: Types.ObjectId) {
  return Job.create({ userId, projectId, type: 'PROCESS_SOURCE', status: 'QUEUED', progress: 0 });
}
