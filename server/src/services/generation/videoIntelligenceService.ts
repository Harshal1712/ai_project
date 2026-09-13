import { LLMService } from '../llm/LLMService.js';
import { videoIntelligenceSchema } from '../llm/schemas.js';
import { Segment } from '../chunking/chunker.js';

export interface VideoIntelligenceResult {
  chapters: { title: string; startTime: number; endTime: number; summary: string }[];
  keyTakeaways: string[];
  importantQuotes: { quote: string; speaker?: string; timestamp: string }[];
  topicsDiscussed: string[];
  faq: { question: string; answer: string; timestamp: string }[];
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function validateChapters(
  chapters: VideoIntelligenceResult['chapters'],
  durationSeconds: number
): VideoIntelligenceResult['chapters'] {
  const valid = chapters.filter(
    (c) => c.startTime >= 0 && c.startTime < c.endTime && c.startTime < durationSeconds
  );
  valid.sort((a, b) => a.startTime - b.startTime);
  if (valid.length > 0) return valid;

  // Fallback: real, evenly-spaced buckets over the actual duration rather
  // than inventing arbitrary timestamps — used only if the model's chapter
  // boundaries fail validation.
  const bucketCount = Math.max(1, Math.min(6, Math.ceil(durationSeconds / 300)));
  const bucketLength = durationSeconds / bucketCount;
  return Array.from({ length: bucketCount }, (_, i) => ({
    title: `Segment ${i + 1}`,
    startTime: i * bucketLength,
    endTime: Math.min((i + 1) * bucketLength, durationSeconds),
    summary: 'Auto-generated time segment (chapter model output failed validation).',
  }));
}

// Grounds chapters/takeaways/quotes/FAQ in the ACTUAL transcript segments —
// replaces the old hardcoded YouTubeService fabrication.
export async function analyzeVideoIntelligence(
  segments: Segment[],
  videoTitle: string,
  durationSeconds: number
): Promise<VideoIntelligenceResult> {
  const transcriptWithTimestamps = segments
    .map((s) => `[${formatTimestamp(s.startTime ?? 0)}-${formatTimestamp(s.endTime ?? 0)}] ${s.text}`)
    .join('\n');

  const prompt = `Analyze this real timestamped transcript for the video "${videoTitle}" (total duration ~${formatTimestamp(durationSeconds)}).
Generate meaningful chapters, key takeaways, important quotes, topics discussed, and an FAQ.
Every chapter's startTime/endTime and every quote/FAQ timestamp MUST correspond to actual moments in the transcript below — never invent a timestamp outside [0, ${durationSeconds.toFixed(0)}] seconds.
Report timestamps as MM:SS strings for quotes/FAQ, and as raw seconds (numbers) for chapter startTime/endTime.

TRANSCRIPT:
"""
${transcriptWithTimestamps}
"""`;

  const result = await LLMService.generateStructured<VideoIntelligenceResult>(
    prompt,
    videoIntelligenceSchema,
    'You ground every timestamp and quote in the literal transcript provided. Never invent timestamps outside the given duration.'
  );

  return { ...result, chapters: validateChapters(result.chapters, durationSeconds) };
}
