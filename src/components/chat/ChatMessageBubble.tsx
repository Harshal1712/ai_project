import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, FileText, AlertCircle } from 'lucide-react';
import { ChatCitation } from '../../services/api';
import { UiChatMessage } from '../../hooks/useStreamingChat';

export function formatCitationLocation(c: { page?: number; section?: string; startTime?: number; endTime?: number }): string {
  if (c.page != null) return `Page ${c.page}`;
  if (c.section) return `Section: ${c.section}`;
  if (c.startTime != null) {
    const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    return `${fmt(c.startTime)} - ${fmt(c.endTime ?? c.startTime)}`;
  }
  return 'Source content';
}

// Renders **bold** spans and inline [n] citation markers inside one line of text.
function renderInline(text: string, citations: ChatCitation[], onCite: (index: number) => void): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\[\d+\])/g).map((part, i) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) return <strong key={i}>{bold[1]}</strong>;
    const cite = part.match(/^\[(\d+)\]$/);
    if (cite) {
      const index = Number(cite[1]) - 1;
      const source = citations[index];
      if (!source) return <span key={i}>{part}</span>;
      return (
        <button
          key={i}
          type="button"
          onClick={() => onCite(index)}
          title={`${source.sourceName ? `${source.sourceName} — ` : ''}${formatCitationLocation(source)}`}
          className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 mx-0.5 rounded bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 text-[9px] font-bold align-text-top hover:bg-brand-200"
        >
          {index + 1}
        </button>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

// Minimal markdown: paragraphs, "- "/"* "/"1. " list items, **bold**, and citation markers.
function MessageBody({ content, citations, onCite }: { content: string; citations: ChatCitation[]; onCite: (i: number) => void }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-1 leading-relaxed text-[11px]">
      {lines.map((line, i) => {
        const bullet = line.match(/^\s*(?:[-*•]|\d+\.)\s+(.*)$/);
        if (bullet) {
          return (
            <div key={i} className="flex gap-1.5 pl-1">
              <span className="text-brand-500 shrink-0">•</span>
              <span>{renderInline(bullet[1], citations, onCite)}</span>
            </div>
          );
        }
        if (!line.trim()) return <div key={i} className="h-1" />;
        const italic = line.match(/^_(.*)_$/);
        if (italic) return <p key={i} className="italic text-slate-400">{italic[1]}</p>;
        return <p key={i}>{renderInline(line, citations, onCite)}</p>;
      })}
    </div>
  );
}

export function ChatMessageBubble({ message, showDocumentNames = false }: { message: UiChatMessage; showDocumentNames?: boolean }) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [highlighted, setHighlighted] = useState<number | null>(null);

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="p-3 rounded-2xl rounded-tr-none max-w-[85%] bg-brand-600 text-white font-medium text-[11px] whitespace-pre-wrap leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  const handleCite = (index: number) => {
    setSourcesOpen(true);
    setHighlighted(index);
  };

  return (
    <div className="flex items-start gap-2">
      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${message.error ? 'bg-rose-500' : 'bg-brand-600'} text-white`}>
        {message.error ? <AlertCircle className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
      </div>
      <div className="p-3 rounded-2xl rounded-tl-none max-w-[88%] min-w-0 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
        {message.content ? (
          <MessageBody content={message.content} citations={message.citations} onCite={handleCite} />
        ) : message.streaming ? (
          <div className="flex items-center gap-1 py-1" aria-label="Thinking">
            {[0, 150, 300].map((d) => (
              <span key={d} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
            ))}
          </div>
        ) : null}
        {message.streaming && message.content && <span className="inline-block w-1.5 h-3 bg-brand-500 animate-pulse align-middle" />}

        {message.citations.length > 0 && !message.streaming && (
          <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setSourcesOpen((o) => !o)}
              className="text-[9px] font-semibold text-brand-600 dark:text-brand-300 flex items-center gap-1"
            >
              {sourcesOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {message.citations.length} source{message.citations.length === 1 ? '' : 's'}
              {!sourcesOpen && ` · ${formatCitationLocation(message.citations[0])}`}
            </button>
            {sourcesOpen && (
              <ol className="mt-1.5 space-y-1.5">
                {message.citations.map((c, i) => (
                  <li
                    key={i}
                    className={`p-2 rounded-lg text-[10px] border transition-colors ${
                      highlighted === i
                        ? 'border-brand-400 bg-brand-50 dark:bg-brand-950/50'
                        : 'border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
                      <span className="w-4 h-4 rounded bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 text-[9px] flex items-center justify-center shrink-0">{i + 1}</span>
                      {showDocumentNames && c.sourceName && (
                        <span className="flex items-center gap-1 truncate"><FileText className="w-3 h-3 shrink-0" />{c.sourceName}</span>
                      )}
                      <span className="text-slate-400 shrink-0">{formatCitationLocation(c)}</span>
                      <span className="ml-auto text-slate-400 shrink-0" title="Similarity score">{Math.round(c.score * 100)}%</span>
                    </div>
                    <p className="mt-1 text-slate-500 dark:text-slate-400 line-clamp-4">{c.text}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
