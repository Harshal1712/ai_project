import { Response } from 'express';
import { Types } from 'mongoose';
import { openSse } from '../../utils/sse.js';
import { streamAnswer, AskOptions, RagAnswer, CitationSource } from './ragService.js';
import { IChatCitation, IChatMessage } from '../../models/Conversation.js';

export function toChatCitations(sources: CitationSource[]): IChatCitation[] {
  return sources.map((s) => ({
    projectId: s.projectId,
    sourceId: s.sourceId,
    sourceName: s.sourceName,
    page: s.page,
    section: s.section,
    startTime: s.startTime,
    endTime: s.endTime,
    text: s.text,
    score: s.score,
  }));
}

export function toMessagePair(query: string, result: RagAnswer): Omit<IChatMessage, 'createdAt'>[] {
  return [
    { role: 'user', content: query, citations: [] },
    { role: 'assistant', content: result.answer, citations: toChatCitations(result.sources) },
  ];
}

function describeError(err: any): string {
  const status = err?.status ?? err?.code;
  if (status === 429 || /RESOURCE_EXHAUSTED/i.test(String(err?.message ?? ''))) {
    return 'The AI service is rate-limited right now. Please wait a moment and try again.';
  }
  return 'Something went wrong while generating the answer. Please try again.';
}

// Streams a grounded answer as Server-Sent Events, then persists it via the
// caller's callback. Nothing is saved if the client disconnects mid-answer.
export async function streamAnswerToClient(
  res: Response,
  query: string,
  projectIds: Types.ObjectId[],
  options: AskOptions,
  persist: (result: RagAnswer) => Promise<void>
): Promise<void> {
  const sse = openSse(res);
  try {
    const result = await streamAnswer(query, projectIds, options, (event) => sse.send(event.type, event), sse.signal);
    if (!sse.signal.aborted) await persist(result);
  } catch (err) {
    if (!sse.signal.aborted) {
      console.error('Streaming answer failed:', err);
      sse.send('error', { error: describeError(err) });
    }
  } finally {
    sse.close();
  }
}
