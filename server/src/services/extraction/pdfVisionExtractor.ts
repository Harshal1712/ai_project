import { createUserContent, createPartFromUri } from '@google/genai';
import { genai, callGenerateContent } from '../llm/genaiClient.js';
import { uploadAndWaitForFile, deleteGeminiFile } from '../llm/geminiFiles.js';
import { pdfVisionSchema } from '../llm/schemas.js';
import { cleanText } from './textCleaner.js';
import { env } from '../../config/env.js';

export type VisualKind = 'chart' | 'table' | 'diagram' | 'image' | 'infographic' | 'other';

export interface VisualElement {
  page: number;
  kind: VisualKind;
  title: string;
  description: string;
  keyData: string[];
}

export interface PdfVisionResult {
  visualElements: VisualElement[];
  // Populated only in OCR mode (scanned PDFs with no text layer).
  ocrPages: { page: number; text: string }[];
}

const VISUAL_PROMPT = `Examine every page of this PDF and find the visual elements that carry information: charts, graphs, tables, diagrams, flowcharts, infographics, and meaningful images (skip logos, decorative images, and page furniture).
For each one report:
- page: the 1-based page number it appears on
- kind: chart | table | diagram | image | infographic | other
- title: its caption or a short descriptive title
- description: 2-4 sentences explaining what it shows and the main takeaway
- keyData: the specific values, labels, rows, trends, or steps it contains, copied exactly (numbers, units, and labels must match the PDF — never estimate or invent values you cannot read)
If the document contains no such visual elements, return an empty visualElements array.`;

const OCR_PROMPT = `
This PDF has no text layer (it's scanned). In addition to the visual elements, transcribe the full readable text of every page into "pages", one entry per page with its 1-based page number. Transcribe faithfully — do not summarize, and do not guess at text you cannot read.`;

// Sends the PDF to Gemini's native document understanding to describe its
// charts, tables, and figures — content the text extractor (pdfjs) can't
// see. Those descriptions get embedded like any other text, so questions
// about a chart become answerable with a page citation. In OCR mode it also
// transcribes scanned pages that have no extractable text at all.
export async function analyzePdfVisuals(filePath: string, options: { ocr: boolean }): Promise<PdfVisionResult> {
  const file = await uploadAndWaitForFile(filePath, 'application/pdf', 'PDF');

  try {
    const response = await callGenerateContent(() =>
      genai.models.generateContent({
        model: env.GEMINI_MODEL,
        contents: createUserContent([createPartFromUri(file.uri, file.mimeType), VISUAL_PROMPT + (options.ocr ? OCR_PROMPT : '')]),
        config: { responseMimeType: 'application/json', responseSchema: pdfVisionSchema as any },
      })
    );

    const raw = response.text;
    if (!raw) throw new Error('Gemini returned an empty PDF analysis response');
    const parsed = JSON.parse(raw) as { visualElements?: VisualElement[]; pages?: { page: number; text: string }[] };

    const visualElements = (parsed.visualElements ?? [])
      .filter((v) => Number.isInteger(v.page) && v.page > 0 && v.description?.trim())
      .map((v) => ({ ...v, keyData: (v.keyData ?? []).filter((d) => d.trim()) }));

    const ocrPages = (parsed.pages ?? [])
      .map((p) => ({ page: p.page, text: cleanText(p.text ?? '') }))
      .filter((p) => Number.isInteger(p.page) && p.page > 0 && p.text.length > 0);

    return { visualElements, ocrPages };
  } finally {
    await deleteGeminiFile(file.name);
  }
}

const KIND_LABELS: Record<VisualKind, string> = {
  chart: 'Chart',
  table: 'Table',
  diagram: 'Diagram',
  image: 'Image',
  infographic: 'Infographic',
  other: 'Figure',
};

// The text representation that gets chunked and embedded for retrieval.
export function describeVisualElement(v: VisualElement): string {
  const data = v.keyData.length > 0 ? ` Key data: ${v.keyData.join('; ')}.` : '';
  return `[${KIND_LABELS[v.kind] ?? 'Figure'} on page ${v.page}: ${v.title}] ${v.description}${data}`;
}
