import { YoutubeTranscript } from 'youtube-transcript';
import { cleanText } from './textCleaner.js';
import { Segment } from '../chunking/chunker.js';

export interface YoutubeExtractionResult {
  videoId: string;
  videoTitle: string;
  thumbnailUrl?: string;
  authorName?: string;
  durationSeconds: number;
  fullText: string;
  segments: Segment[];
}

export function extractYoutubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function fetchOEmbedMetadata(url: string): Promise<{ title?: string; thumbnailUrl?: string; authorName?: string }> {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    if (!res.ok) return {};
    const data = (await res.json()) as { title?: string; thumbnail_url?: string; author_name?: string };
    return { title: data.title, thumbnailUrl: data.thumbnail_url, authorName: data.author_name };
  } catch {
    return {};
  }
}

// Real transcript retrieval only — no fabricated fallback. If a video has no
// captions, is private, or is otherwise unavailable, this throws a real error
// per spec section 11 rather than returning invented content.
export async function extractYoutube(url: string): Promise<YoutubeExtractionResult> {
  const videoId = extractYoutubeVideoId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL — could not extract a video ID.');
  }

  let rawTranscript;
  try {
    rawTranscript = await YoutubeTranscript.fetchTranscript(videoId);
  } catch (err: any) {
    throw new Error(
      `Could not retrieve a transcript for this video: ${err?.message || 'it may be private, deleted, or have captions disabled.'}`
    );
  }

  if (!rawTranscript || rawTranscript.length === 0) {
    throw new Error('This video has no available captions/transcript to process.');
  }

  const segments: Segment[] = rawTranscript.map((t) => ({
    text: cleanText(t.text),
    startTime: t.offset / 1000,
    endTime: (t.offset + t.duration) / 1000,
  }));

  const fullText = segments.map((s) => s.text).join(' ');
  const durationSeconds = Math.max(...segments.map((s) => s.endTime ?? 0));

  const metadata = await fetchOEmbedMetadata(url);

  return {
    videoId,
    videoTitle: metadata.title || `YouTube Video (${videoId})`,
    thumbnailUrl: metadata.thumbnailUrl,
    authorName: metadata.authorName,
    durationSeconds,
    fullText,
    segments,
  };
}
