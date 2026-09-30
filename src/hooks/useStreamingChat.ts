import { useCallback, useEffect, useRef, useState } from 'react';
import { AnswerStreamHandlers, ApiError, ChatCitation, StoredChatMessage } from '../services/api';

export interface UiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations: ChatCitation[];
  streaming?: boolean;
  error?: boolean;
}

export type AskFn = (query: string, handlers: AnswerStreamHandlers, signal: AbortSignal) => Promise<void>;

let idCounter = 0;
const nextId = () => `m${Date.now()}_${idCounter++}`;

export function fromStoredMessages(messages: StoredChatMessage[]): UiChatMessage[] {
  return messages.map((m) => ({ id: nextId(), role: m.role, content: m.content, citations: m.citations ?? [] }));
}

// Owns a chat transcript and streams each answer into it token by token.
// `ask` performs the actual streaming request (per-project or multi-document).
export function useStreamingChat(ask: AskFn) {
  const [messages, setMessages] = useState<UiChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const askRef = useRef(ask);
  askRef.current = ask;

  useEffect(() => () => abortRef.current?.abort(), []);

  const patchMessage = (id: string, patch: (m: UiChatMessage) => Partial<UiChatMessage>) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch(m) } : m)));

  const send = useCallback(async (query: string) => {
    const text = query.trim();
    if (!text || abortRef.current) return;

    const assistantId = nextId();
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: 'user', content: text, citations: [] },
      { id: assistantId, role: 'assistant', content: '', citations: [], streaming: true },
    ]);
    setBusy(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await askRef.current(
        text,
        {
          onSources: (sources) => patchMessage(assistantId, () => ({ citations: sources })),
          onToken: (token) => patchMessage(assistantId, (m) => ({ content: m.content + token })),
          onDone: ({ answer, grounded }) =>
            patchMessage(assistantId, (m) => ({ content: answer || m.content, citations: grounded ? m.citations : [], streaming: false })),
        },
        controller.signal
      );
      patchMessage(assistantId, () => ({ streaming: false }));
    } catch (err) {
      if (controller.signal.aborted) {
        patchMessage(assistantId, (m) => ({ content: m.content ? `${m.content}\n\n_(stopped)_` : '_(stopped)_', streaming: false }));
      } else {
        const message = err instanceof ApiError ? err.message : 'Something went wrong answering that question.';
        patchMessage(assistantId, (m) => ({ content: m.content || message, streaming: false, error: !m.content }));
      }
    } finally {
      abortRef.current = null;
      setBusy(false);
    }
  }, []);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  return { messages, setMessages, busy, send, stop };
}
