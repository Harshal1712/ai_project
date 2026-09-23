import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MessagesSquare, Plus, Trash2, Send, Square, Loader2, FileText, Video, Check, X, Library, AlertCircle } from 'lucide-react';
import { ContentIQApiClient, ApiError, ChatSessionSummary } from '../services/api';
import { ProjectItem } from '../types';
import { useStreamingChat, fromStoredMessages } from '../hooks/useStreamingChat';
import { ChatMessageBubble } from '../components/chat/ChatMessageBubble';
import { LanguageSelect } from '../components/chat/LanguageSelect';

const VIDEO_TYPES = ['video', 'audio', 'youtube'];
const MAX_DOCUMENTS = 10;

function SourceIcon({ type, className = 'w-4 h-4' }: { type: string; className?: string }) {
  return VIDEO_TYPES.includes(type) ? <Video className={`${className} text-rose-500`} /> : <FileText className={`${className} text-brand-500`} />;
}

// Picker for choosing which completed projects a chat should search across.
function DocumentPicker({
  projects,
  selected,
  onToggle,
}: {
  projects: ProjectItem[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  if (projects.length === 0) {
    return <p className="text-xs text-slate-400">No completed projects yet — create a transformation first.</p>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
      {projects.map((p) => {
        const isSelected = selected.has(p.id);
        const disabled = !isSelected && selected.size >= MAX_DOCUMENTS;
        return (
          <button
            key={p.id}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(p.id)}
            className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-colors disabled:opacity-40 ${
              isSelected ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40' : 'border-slate-200 dark:border-slate-800 hover:border-brand-300'
            }`}
          >
            <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-brand-600 border-brand-600' : 'border-slate-300 dark:border-slate-600'}`}>
              {isSelected && <Check className="w-3 h-3 text-white" />}
            </span>
            <SourceIcon type={p.source.type} />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{p.source.name}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export const KnowledgeChat: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [active, setActive] = useState<ChatSessionSummary | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [editingDocs, setEditingDocs] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [newTitle, setNewTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('Auto');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, setMessages, busy, send, stop } = useStreamingChat((query, handlers, signal) =>
    ContentIQApiClient.askChatSessionStream(sessionId!, query, language, handlers, signal)
  );

  const refreshSessions = () =>
    ContentIQApiClient.getChatSessions()
      .then(({ sessions }) => setSessions(sessions))
      .catch(() => {});

  useEffect(() => {
    refreshSessions();
    ContentIQApiClient.getProjects()
      .then(({ projects }) => setProjects(projects.filter((p) => p.status === 'Completed')))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setError(null);
    setEditingDocs(false);
    if (!sessionId) {
      setActive(null);
      setMessages([]);
      return;
    }
    setLoadingSession(true);
    ContentIQApiClient.getChatSession(sessionId)
      .then(({ session }) => {
        setActive(session);
        setLanguage(session.language || 'Auto');
        setMessages(fromStoredMessages(session.messages ?? []));
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load this chat.'))
      .finally(() => setLoadingSession(false));
  }, [sessionId, setMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  // Refresh message counts in the sidebar once an answer finishes.
  useEffect(() => {
    if (!busy && sessionId) refreshSessions();
  }, [busy, sessionId]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const openCreate = () => {
    setSelected(new Set());
    setNewTitle('');
    setError(null);
    setCreating(true);
  };

  const handleCreate = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    setError(null);
    try {
      const { session } = await ContentIQApiClient.createChatSession([...selected], newTitle || undefined, language);
      setCreating(false);
      await refreshSessions();
      navigate(`/chat/${session.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create chat.');
    } finally {
      setSaving(false);
    }
  };

  const openEditDocs = () => {
    if (!active) return;
    setSelected(new Set(active.projects.map((p) => p.id)));
    setEditingDocs(true);
  };

  const handleSaveDocs = async () => {
    if (!active || selected.size === 0) return;
    setSaving(true);
    try {
      const { session } = await ContentIQApiClient.updateChatSession(active.id, { projectIds: [...selected] });
      setActive({ ...active, projects: session.projects });
      setEditingDocs(false);
      refreshSessions();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update documents.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this chat? This cannot be undone.')) return;
    await ContentIQApiClient.deleteChatSession(id).catch(() => {});
    await refreshSessions();
    if (id === sessionId) navigate('/chat');
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || busy || !sessionId) return;
    const text = input;
    setInput('');
    send(text);
  };

  return (
    <div className="pb-8 animate-in fade-in duration-200">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Library className="w-7 h-7 text-brand-600" /> Multi-Document Chat
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Ask one question across several documents and videos at once — every answer cites which document it came from.
          </p>
        </div>
        <button onClick={openCreate} className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-md self-start">
          <Plus className="w-4 h-4" /> New chat
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-2 h-fit">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">Your chats</h3>
          {sessions.length === 0 && <p className="text-xs text-slate-400 px-1 py-2">No chats yet.</p>}
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => navigate(`/chat/${s.id}`)}
              className={`group p-3 rounded-xl cursor-pointer border transition-colors ${
                s.id === sessionId ? 'border-brand-300 bg-brand-50 dark:bg-brand-950/40 dark:border-brand-800' : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">{s.title}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 shrink-0"
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {s.projects.length} doc{s.projects.length === 1 ? '' : 's'} · {Math.floor(s.messageCount / 2)} question{Math.floor(s.messageCount / 2) === 1 ? '' : 's'}
              </p>
            </div>
          ))}
        </aside>

        <section className="lg:col-span-9 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col h-[calc(100vh-220px)] min-h-[520px]">
          {creating ? (
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-sm text-slate-900 dark:text-white">Start a new multi-document chat</h2>
                <button onClick={() => setCreating(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
              </div>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Chat title (optional) — e.g. Q3 reports comparison"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
              <p className="text-[11px] text-slate-500">Select up to {MAX_DOCUMENTS} documents or videos ({selected.size} selected):</p>
              <DocumentPicker projects={projects} selected={selected} onToggle={toggle} />
              {error && <p className="text-xs text-rose-500">{error}</p>}
              <div className="flex justify-end gap-2">
                <button onClick={() => setCreating(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">Cancel</button>
                <button onClick={handleCreate} disabled={selected.size === 0 || saving} className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Start chat
                </button>
              </div>
            </div>
          ) : !sessionId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
              <MessagesSquare className="w-10 h-10 text-brand-500" />
              <h2 className="font-bold text-slate-900 dark:text-white">Chat with several documents at once</h2>
              <p className="text-xs text-slate-500 max-w-md">
                Compare reports, cross-reference a video with its slide deck, or find where different sources agree and disagree.
                Answers are grounded only in the documents you pick.
              </p>
              <button onClick={openCreate} className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> New chat
              </button>
            </div>
          ) : loadingSession ? (
            <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-600" /></div>
          ) : error && !active ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center p-8">
              <AlertCircle className="w-7 h-7 text-rose-500" />
              <p className="text-sm text-slate-500">{error}</p>
            </div>
          ) : active ? (
            <>
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-bold text-sm text-slate-900 dark:text-white truncate">{active.title}</h2>
                  <div className="flex items-center gap-2 shrink-0">
                    <LanguageSelect value={language} onChange={setLanguage} />
                    <button onClick={openEditDocs} className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 hover:underline">Edit documents</button>
                  </div>
                </div>
                {editingDocs ? (
                  <div className="space-y-3 pt-1">
                    <DocumentPicker projects={projects} selected={selected} onToggle={toggle} />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingDocs(false)} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold">Cancel</button>
                      <button onClick={handleSaveDocs} disabled={selected.size === 0 || saving} className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-[11px] font-semibold disabled:opacity-50">Save</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {active.projects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => navigate(`/projects/${p.id}`)}
                        className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        <SourceIcon type={p.sourceType} className="w-3 h-3" />
                        <span className="truncate max-w-[180px]">{p.sourceName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-10 space-y-2">
                    <p className="text-xs text-slate-500">Try asking something that spans your documents:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {['What are the main differences between these documents?', 'Where do these sources agree?', 'Summarize the key numbers across all documents.'].map((q) => (
                        <button key={q} onClick={() => send(q)} className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 hover:border-brand-400">
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((m) => (
                  <ChatMessageBubble key={m.id} message={m} showDocumentNames />
                ))}
              </div>

              {error && <p className="px-4 text-xs text-rose-500">{error}</p>}
              <form onSubmit={handleSend} className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask across all selected documents..."
                  className="flex-1 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {busy ? (
                  <button type="button" onClick={stop} className="px-3 rounded-xl bg-slate-700 text-white" title="Stop generating"><Square className="w-4 h-4" /></button>
                ) : (
                  <button type="submit" disabled={!input.trim()} className="px-3 rounded-xl bg-brand-600 text-white disabled:opacity-50"><Send className="w-4 h-4" /></button>
                )}
              </form>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
};
