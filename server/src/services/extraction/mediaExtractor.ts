import { createUserContent, createPartFromUri } from '@google/genai';
import { genai, callGenerateContent } from '../llm/genaiClient.js';
import { env } from '../../config/env.js';
import { transcriptSchema } from '../llm/schemas.js';
import { uploadAndWaitForFile, deleteGeminiFile } from '../llm/geminiFiles.js';
import { Segment } from '../chunking/chunker.js';

export interface MediaExtractionResult {
  videoTitleGuess?: string;
  durationSeconds: number;
  fullText: string;
  segments: Segment[];
}

interface RawTranscript {
  videoTitleGuess?: string;
  segments: { startTime: number; endTime: number; text: string }[];
}

const TRANSCRIPTION_PROMPT = `Transcribe all spoken content in this media file with timestamps.
Break the transcript into natural segments (a sentence or short group of sentences each).
For each segment, report the start and end time in seconds as accurately as you can from the audio/video.
Note: these are your best estimates from listening/watching, not frame-accurate speech-recognition timestamps — do not fabricate precision you don't have. Return only the structured JSON.`;

// Uploaded video/audio have no local ffmpeg/Whisper available in this
// environment, so real transcription is done via Gemini's native multimodal
// Files API instead: upload the file, ask Gemini to transcribe with
// timestamps, then delete the file immediately (Gemini auto-deletes after
// 48h anyway, and this protects the 20GB/project quota during iteration).
export async function extractMedia(filePath: string, mimeType: string): Promise<MediaExtractionResult> {
  const file = await uploadAndWaitForFile(filePath, mimeType, 'media file');

  try {
    const response = await callGenerateContent(() =>
      genai.models.generateContent({
        model: env.GEMINI_MODEL,
        contents: createUserContent([createPartFromUri(file.uri, file.mimeType), TRANSCRIPTION_PROMPT]),
        config: { responseMimeType: 'application/json', responseSchema: transcriptSchema as any },
      })
    );

    const raw = response.text;
    if (!raw) throw new Error('Gemini returned an empty transcription response');

    const parsed = JSON.parse(raw) as RawTranscript;
    if (!parsed.segments || parsed.segments.length === 0) {
      throw new Error('No speech content could be transcribed from this media file.');
    }

    const segments: Segment[] = parsed.segments.map((s) => ({
      text: s.text,
      startTime: s.startTime,
      endTime: s.endTime,
    }));

    return {
      videoTitleGuess: parsed.videoTitleGuess,
      durationSeconds: Math.max(...segments.map((s) => s.endTime ?? 0)),
      fullText: segments.map((s) => s.text).join(' '),
      segments,
    };
  } finally {
    await deleteGeminiFile(file.name);
  }
}
