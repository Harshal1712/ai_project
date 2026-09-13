import { cleanText } from './textCleaner.js';
import { ExtractionResult } from './pdfExtractor.js';

export async function extractTxt(buffer: Buffer): Promise<ExtractionResult> {
  const text = cleanText(buffer.toString('utf-8'));
  if (!text) {
    throw new Error('This text file appears to be empty.');
  }
  return { fullText: text, segments: [{ text }] };
}
