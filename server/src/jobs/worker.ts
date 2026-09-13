import { connectDB } from '../config/db.js';
import { agenda } from './agenda.js';
import { registerProcessSourceJob } from './definitions/processSource.job.js';

async function main() {
  await connectDB();
  registerProcessSourceJob(agenda);
  await agenda.start();
  console.log('ContentIQ AI worker started — processing background jobs (process-source).');
}

process.on('SIGTERM', async () => {
  await agenda.stop();
  process.exit(0);
});
process.on('SIGINT', async () => {
  await agenda.stop();
  process.exit(0);
});

main().catch((err) => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});
