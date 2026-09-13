import { Agenda, Job as AgendaJob } from 'agenda';
import { env } from '../config/env.js';

// MongoDB-backed job queue (substitutes for Redis+BullMQ, which aren't
// available in this environment — see plan notes). The API process only
// enqueues jobs; `npm run worker` runs the actual processing so expensive
// AI work never blocks a request thread.
export const agenda = new Agenda({
  db: { address: env.MONGODB_URI, collection: 'agendaJobs' },
  maxConcurrency: 2,
  defaultLockLifetime: 10 * 60 * 1000, // 10 min — media transcription + multi-output generation can be slow
});

agenda.on('fail', (err: Error, job: AgendaJob) => {
  console.error(`Agenda job "${job.attrs.name}" failed:`, err.message);
});
