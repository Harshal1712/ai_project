import { Types } from 'mongoose';
import { Project } from '../models/Project.js';
import { Source } from '../models/Source.js';
import { GeneratedOutput } from '../models/GeneratedOutput.js';
import { VerificationReport } from '../models/VerificationReport.js';
import { Job } from '../models/Job.js';

const DOCUMENT_TYPES = ['pdf', 'docx', 'text'];
const VIDEO_TYPES = ['video', 'audio', 'youtube'];

async function computeAvgLatencySeconds(filter: Record<string, unknown>): Promise<number> {
  const completedJobs = await Job.find({ ...filter, status: 'COMPLETED', startedAt: { $ne: null }, completedAt: { $ne: null } })
    .select('startedAt completedAt')
    .lean();

  if (completedJobs.length === 0) return 0;

  const totalSeconds = completedJobs.reduce((sum, j) => {
    return sum + (new Date(j.completedAt!).getTime() - new Date(j.startedAt!).getTime()) / 1000;
  }, 0);

  return Number((totalSeconds / completedJobs.length).toFixed(2));
}

async function computeAvgFidelity(filter: Record<string, unknown>): Promise<number> {
  const reports = await VerificationReport.find(filter).select('fidelityScore').lean();
  if (reports.length === 0) return 0;
  return Number((reports.reduce((sum, r) => sum + r.fidelityScore, 0) / reports.length).toFixed(1));
}

export interface TelemetryMetrics {
  totalTransformations: number;
  documentsProcessed: number;
  videosSummarized: number;
  aiOutputsGenerated: number;
  avgLatencySeconds: number;
  contentFidelityScore: number;
}

export interface TopOutputType {
  name: string;
  count: number;
}

export interface LanguageDistributionEntry {
  name: string;
  value: number;
}

// Every number below comes from a real database aggregation — no hardcoded
// values, per spec section 41.
export async function getGlobalTelemetry(): Promise<{
  metrics: TelemetryMetrics;
  topOutputTypes: TopOutputType[];
  languageDistribution: LanguageDistributionEntry[];
}> {
  const [totalTransformations, documentsProcessed, videosSummarized, aiOutputsGenerated, avgLatencySeconds, contentFidelityScore] =
    await Promise.all([
      Project.countDocuments({}),
      Source.countDocuments({ type: { $in: DOCUMENT_TYPES }, status: 'READY' }),
      Source.countDocuments({ type: { $in: VIDEO_TYPES }, status: 'READY' }),
      GeneratedOutput.countDocuments({}),
      computeAvgLatencySeconds({}),
      computeAvgFidelity({}),
    ]);

  const topOutputTypesAgg = await GeneratedOutput.aggregate([
    { $group: { _id: '$type', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 6 },
  ]);

  const languageAgg = await Project.aggregate([
    { $group: { _id: '$config.language', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  return {
    metrics: {
      totalTransformations,
      documentsProcessed,
      videosSummarized,
      aiOutputsGenerated,
      avgLatencySeconds,
      contentFidelityScore,
    },
    topOutputTypes: topOutputTypesAgg.map((t) => ({ name: t._id || 'Unknown', count: t.count })),
    languageDistribution: languageAgg.map((l) => ({ name: l._id || 'Unknown', value: l.count })),
  };
}

export async function getUserTelemetry(userId: Types.ObjectId) {
  const projectFilter = { userId };
  const [totalTransformations, aiOutputsGenerated, avgLatencySeconds, contentFidelityScore] = await Promise.all([
    Project.countDocuments(projectFilter),
    GeneratedOutput.countDocuments({ userId }),
    computeAvgLatencySeconds({ userId }),
    computeAvgFidelity({ userId }),
  ]);

  const documentsProcessed = await Source.countDocuments({ userId, type: { $in: DOCUMENT_TYPES }, status: 'READY' });
  const videosSummarized = await Source.countDocuments({ userId, type: { $in: VIDEO_TYPES }, status: 'READY' });

  return {
    totalTransformations,
    documentsProcessed,
    videosSummarized,
    aiOutputsGenerated,
    avgLatencySeconds,
    contentFidelityScore,
  };
}
