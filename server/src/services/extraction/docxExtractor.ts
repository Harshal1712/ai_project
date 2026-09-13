import mammoth from 'mammoth';
import { cleanText } from './textCleaner.js';
import { ExtractedSegment, ExtractionResult } from './pdfExtractor.js';

// DOCX has no stored pagination, so unlike PDF we cannot produce real page
// numbers. Instead each segment carries a "section" label (nearest preceding
// heading, or "Document") which the RAG/citation layer surfaces in place of
// a page number for this source type.
export async function extractDocx(buffer: Buffer): Promise<ExtractionResult & { segments: (ExtractedSegment & { section?: string })[] }> {
  const { value: html } = await mammoth.convertToHtml({ buffer });

  const blockRegex = /<(h[1-6]|p|li)[^>]*>([\s\S]*?)<\/\1>/g;
  const segments: (ExtractedSegment & { section?: string })[] = [];
  let currentSection = 'Document';
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(html)) !== null) {
    const tag = match[1];
    const text = cleanText(stripTags(match[2]));
    if (!text) continue;

    if (/^h[1-6]$/.test(tag)) {
      currentSection = text;
      continue; // headings become the section label for subsequent paragraphs, not chunk content on their own
    }

    segments.push({ text, section: currentSection });
  }

  if (segments.length === 0) {
    throw new Error('No extractable text found in this DOCX file.');
  }

  const fullText = segments.map((s) => s.text).join('\n\n');
  return { fullText, segments };
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
