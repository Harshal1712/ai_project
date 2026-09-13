// @ts-ignore — pdfjs-dist ships its own types but its legacy Node entrypoint
// resolves inconsistently under NodeNext moduleResolution.
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { cleanText } from './textCleaner.js';

export interface ExtractedSegment {
  text: string;
  page?: number;
  startTime?: number;
  endTime?: number;
}

export interface ExtractionResult {
  fullText: string;
  segments: ExtractedSegment[];
  pageCount?: number;
}

// Uses pdfjs-dist directly rather than the `pdf-parse` wrapper, which bundles
// a long-abandoned pdf.js from 2018 (v1.10.100) — confirmed live during
// testing to reject real-world PDFs with a "bad XRef entry" error that
// pdfjs-dist's current, actively-maintained parser handles without issue.
export async function extractPdf(buffer: Buffer): Promise<ExtractionResult> {
  const data = new Uint8Array(buffer);
  const loadingTask = getDocument({ data, useSystemFonts: true, disableFontFace: true });
  const pdfDocument = await loadingTask.promise;

  const segments: ExtractedSegment[] = [];
  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
    const page = await pdfDocument.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const text = cleanText(textContent.items.map((item: any) => item.str ?? '').join(' '));
    if (text.length > 0) segments.push({ text, page: pageNumber });
    page.cleanup();
  }

  const pageCount = pdfDocument.numPages;
  await loadingTask.destroy();

  const fullText = segments.map((s) => s.text).join('\n\n');
  if (fullText.length === 0) {
    throw new Error('No extractable text found in this PDF. It may be a scanned/image-only document.');
  }

  return { fullText, segments, pageCount };
}
