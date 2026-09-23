import fs from 'fs/promises';
import { Types } from 'mongoose';
import { ISource, Source } from '../../models/Source.js';
import { ContentChunk } from '../../models/ContentChunk.js';
import { chunkSegments, Segment } from '../chunking/chunker.js';
import { EmbeddingService } from '../llm/EmbeddingService.js';
import { extractPdf, NoExtractableTextError } from '../extraction/pdfExtractor.js';
import { analyzePdfVisuals, describeVisualElement, PdfVisionResult } from '../extraction/pdfVisionExtractor.js';
import { extractDocx } from '../extraction/docxExtractor.js';
import { extractTxt } from '../extraction/txtExtractor.js';
import { extractYoutube } from '../extraction/youtubeExtractor.js';
import { extractMedia } from '../extraction/mediaExtractor.js';
import { cleanText } from '../extraction/textCleaner.js';
import { analyzeDocumentIntelligence } from '../generation/documentIntelligenceService.js';
import { analyzeVideoIntelligence } from '../generation/videoIntelligenceService.js';
import { generateSummaries } from '../generation/summarizationService.js';
import { generateMCQs } from '../generation/mcqService.js';
import { env } from '../../config/env.js';

export interface IngestOptions {
  filePath?: string;
  mimeType?: string;
  rawText?: string;
  sourceUrl?: string;
}

export interface IngestResult {
  fullText: string;
  wordCount: number;
}

const EMBED_BATCH_SIZE = 50;

async function embedAndStoreChunks(segments: Segment[], source: ISource): Promise<void> {
  const chunks = chunkSegments(segments, env.CHUNK_SIZE, env.CHUNK_OVERLAP);

  for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);
    const vectors = await EmbeddingService.embedTexts(batch.map((c) => c.text));

    await ContentChunk.insertMany(
      batch.map((chunk, idx) => ({
        projectId: source.projectId,
        sourceId: source._id,
        userId: source.userId,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        page: chunk.page,
        section: chunk.section,
        startTime: chunk.startTime,
        endTime: chunk.endTime,
        embedding: vectors[idx],
      }))
    );
  }
}

// Text layer via pdfjs, plus Gemini's view of the charts/tables/figures that
// pdfjs can't see. Visual descriptions are merged in page order so they
// chunk alongside the text of the page they appear on. Scanned PDFs (no
// text layer) fall back to Gemini OCR instead of failing outright.
async function extractPdfWithVisuals(filePath: string, source: ISource): Promise<{ fullText: string; segments: Segment[] }> {
  const buffer = await fs.readFile(filePath);

  let textSegments: Segment[] = [];
  let pageCount: number | undefined;
  let isScanned = false;
  try {
    const result = await extractPdf(buffer);
    textSegments = result.segments;
    pageCount = result.pageCount;
  } catch (err) {
    if (!(err instanceof NoExtractableTextError) || !env.PDF_VISUAL_ANALYSIS) throw err;
    isScanned = true;
    pageCount = err.pageCount;
  }

  let vision: PdfVisionResult = { visualElements: [], ocrPages: [] };
  if (env.PDF_VISUAL_ANALYSIS) {
    try {
      vision = await analyzePdfVisuals(filePath, { ocr: isScanned });
    } catch (err) {
      // Visual analysis is an enhancement for text PDFs — only fatal when it's our only source of text.
      if (isScanned) throw err;
      console.warn(`PDF visual analysis failed for "${source.originalName}", continuing with text only:`, err);
    }
  }

  if (isScanned) {
    if (vision.ocrPages.length === 0) {
      throw new Error('No readable text could be found in this PDF, even with OCR.');
    }
    textSegments = vision.ocrPages.map((p) => ({ text: p.text, page: p.page }));
  }

  const visualSegments: Segment[] = vision.visualElements.map((v) => ({ text: describeVisualElement(v), page: v.page }));
  // Array.prototype.sort is stable, so text keeps its order ahead of the figures on the same page.
  const segments = [...textSegments, ...visualSegments].sort((a, b) => (a.page ?? 0) - (b.page ?? 0));

  source.pageCount = pageCount;
  source.visualElements = vision.visualElements;
  source.ocrUsed = isScanned;

  const visualBlock = visualSegments.map((s) => s.text).join('\n');
  const fullText = [
    textSegments.map((s) => s.text).join('\n\n'),
    visualSegments.length > 0 ? `VISUAL ELEMENTS (charts, tables, figures):\n${visualBlock}` : '',
  ].filter(Boolean).join('\n\n');

  return { fullText, segments };
}

// The single pipeline every source type flows through: extract -> chunk ->
// embed -> persist -> derive real document/video intelligence. Mirrors the
// diagram in spec section 6, replacing every previously-fabricated step.
export async function ingestSource(sourceId: Types.ObjectId, options: IngestOptions): Promise<IngestResult> {
  const source = await Source.findById(sourceId);
  if (!source) throw new Error('Source not found');

  source.status = 'EXTRACTING';
  await source.save();

  try {
    let fullText: string;
    let segments: Segment[];

    switch (source.type) {
      case 'pdf': {
        if (!options.filePath) throw new Error('PDF source requires an uploaded file');
        const result = await extractPdfWithVisuals(options.filePath, source);
        fullText = result.fullText;
        segments = result.segments;
        break;
      }
      case 'docx': {
        if (!options.filePath) throw new Error('DOCX source requires an uploaded file');
        const buffer = await fs.readFile(options.filePath);
        const result = await extractDocx(buffer);
        fullText = result.fullText;
        segments = result.segments;
        break;
      }
      case 'text': {
        if (options.rawText && options.rawText.trim()) {
          fullText = cleanText(options.rawText);
          segments = [{ text: fullText }];
        } else if (options.filePath) {
          const buffer = await fs.readFile(options.filePath);
          const result = await extractTxt(buffer);
          fullText = result.fullText;
          segments = result.segments;
        } else {
          throw new Error('Text source requires either rawText or an uploaded .txt file');
        }
        break;
      }
      case 'video':
      case 'audio': {
        if (!options.filePath || !options.mimeType) throw new Error(`${source.type} source requires an uploaded file`);
        const result = await extractMedia(options.filePath, options.mimeType);
        fullText = result.fullText;
        segments = result.segments;
        source.durationSeconds = result.durationSeconds;
        source.videoTitle = result.videoTitleGuess || source.originalName;
        break;
      }
      case 'youtube': {
        if (!options.sourceUrl) throw new Error('YouTube source requires a URL');
        const result = await extractYoutube(options.sourceUrl);
        fullText = result.fullText;
        segments = result.segments;
        source.durationSeconds = result.durationSeconds;
        source.videoTitle = result.videoTitle;
        break;
      }
      default:
        throw new Error(`Unsupported source type: ${source.type}`);
    }

    const wordCount = fullText.split(/\s+/).filter(Boolean).length;
    source.wordCount = wordCount;
    source.readingTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;

    await embedAndStoreChunks(segments, source);

    if (source.type === 'pdf' || source.type === 'docx' || source.type === 'text') {
      const intelligence = await analyzeDocumentIntelligence(fullText, source.originalName);
      source.keyTopics = intelligence.keyTopics;
      source.importantDates = intelligence.importantDates;
      source.keyMetrics = intelligence.keyMetrics;
      source.entities = intelligence.entities.map((e, i) => ({ id: `e${i + 1}`, ...e }));
      source.references = intelligence.references;
    } else {
      const videoTitle = source.videoTitle || source.originalName;
      const [intelligence, summary, quiz] = await Promise.all([
        analyzeVideoIntelligence(segments, videoTitle, source.durationSeconds || 0),
        generateSummaries(fullText, videoTitle, 'General', 'Professional'),
        generateMCQs(fullText, videoTitle, 5).catch(() => []), // quiz is supplementary; don't fail ingestion if it can't be produced
      ]);

      source.chapters = intelligence.chapters.map((c, i) => ({
        id: `c${i + 1}`,
        timestamp: formatTimestamp(c.startTime),
        seconds: Math.round(c.startTime),
        title: c.title,
        summary: c.summary,
      }));
      source.importantQuotes = intelligence.importantQuotes.map((q) => ({ quote: q.quote, speaker: q.speaker || 'Speaker', timestamp: q.timestamp }));
      source.topicsDiscussed = intelligence.topicsDiscussed;
      source.faq = intelligence.faq;
      source.keyTakeaways = intelligence.keyTakeaways;
      source.shortSummary = summary.executiveSummary;
      source.detailedSummary = summary.detailedSummary;
      source.quiz = quiz;
    }

    source.status = 'READY';
    await source.save();

    return { fullText, wordCount };
  } catch (err: any) {
    source.status = 'FAILED';
    source.failureReason = err?.message || 'Unknown extraction error';
    await source.save();
    throw err;
  }
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
