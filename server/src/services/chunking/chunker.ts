export interface Segment {
  text: string;
  page?: number;
  section?: string;
  startTime?: number;
  endTime?: number;
}

export interface Chunk {
  chunkIndex: number;
  text: string;
  page?: number;
  section?: string;
  startTime?: number;
  endTime?: number;
}

interface Unit {
  text: string;
  meta: Omit<Segment, 'text'>;
}

function splitIntoSentences(text: string): string[] {
  const paragraphs = text.split(/\n{2,}/);
  const sentences: string[] = [];
  for (const para of paragraphs) {
    const parts = para.split(/(?<=[.!?])\s+(?=[A-Z0-9"'(])/);
    for (const p of parts) {
      const trimmed = p.trim();
      if (trimmed) sentences.push(trimmed);
    }
  }
  return sentences;
}

// Paragraph/sentence-aware chunking that never loses source metadata: each
// output chunk carries the page/section/time-range spanned by the sentences
// it contains, so downstream citations point at real locations.
export function chunkSegments(segments: Segment[], chunkSize: number, overlap: number): Chunk[] {
  const units: Unit[] = [];
  for (const seg of segments) {
    for (const sentence of splitIntoSentences(seg.text)) {
      units.push({
        text: sentence,
        meta: { page: seg.page, section: seg.section, startTime: seg.startTime, endTime: seg.endTime },
      });
    }
  }

  const chunks: Chunk[] = [];
  let buffer: Unit[] = [];
  let bufferLen = 0;

  const flush = () => {
    if (buffer.length === 0) return;
    const text = buffer.map((u) => u.text).join(' ').trim();
    if (!text) {
      buffer = [];
      bufferLen = 0;
      return;
    }
    const pages = buffer.map((u) => u.meta.page).filter((p): p is number => p != null);
    const sections = buffer.map((u) => u.meta.section).filter((s): s is string => s != null);
    const starts = buffer.map((u) => u.meta.startTime).filter((t): t is number => t != null);
    const ends = buffer.map((u) => u.meta.endTime).filter((t): t is number => t != null);

    chunks.push({
      chunkIndex: chunks.length,
      text,
      page: pages.length ? pages[0] : undefined,
      section: sections.length ? sections[0] : undefined,
      startTime: starts.length ? Math.min(...starts) : undefined,
      endTime: ends.length ? Math.max(...ends) : undefined,
    });
  };

  for (const unit of units) {
    if (bufferLen + unit.text.length > chunkSize && buffer.length > 0) {
      flush();
      let overlapUnits: Unit[] = [];
      let overlapLen = 0;
      for (let i = buffer.length - 1; i >= 0 && overlapLen < overlap; i--) {
        overlapUnits.unshift(buffer[i]);
        overlapLen += buffer[i].text.length;
      }
      buffer = overlapUnits;
      bufferLen = overlapLen;
    }
    buffer.push(unit);
    bufferLen += unit.text.length;
  }
  flush();

  if (chunks.length === 0) {
    throw new Error('Chunking produced no chunks — the source may have no extractable content.');
  }

  return chunks;
}
