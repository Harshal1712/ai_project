import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  GraduationCap, Loader2, Sparkles, RotateCcw, Trash2, Plus, Trophy, Layers, CheckCircle2,
  Clock, Brain, FileText, Video, ArrowLeft, AlertCircle, Eye,
} from 'lucide-react';
import { ContentIQApiClient, ApiError, Flashcard, FlashcardDeckData, DeckStats, StudyOverviewItem } from '../services/api';
import { LanguageSelect } from '../components/chat/LanguageSelect';

const VIDEO_TYPES = ['video', 'audio', 'youtube'];
const BOX_LABELS = ['', 'Learning', 'Familiar', 'Known', 'Strong', 'Mastered'];
// Mirrors the server's Leitner intervals, used only for the "next review" hints on the grade buttons.
const BOX_INTERVAL_LABEL = ['', 'now', '1 day', '3 days', '7 days', '16 days'];

function nextIntervalLabel(box: number, grade: 'again' | 'good' | 'easy'): string {
  if (grade === 'again') return '1 min';
  return BOX_INTERVAL_LABEL[Math.min(5, box + (grade === 'easy' ? 2 : 1))];
}

function StatTile({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: number | string; tone: string }) {
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400"><Icon className={`w-3.5 h-3.5 ${tone}`} />{label}</div>
      <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 tabular-nums">{value}</p>
    </div>
  );
}

// ---------------- Overview (/study) ----------------

function StudyOverview() {
  const navigate = useNavigate();
  const [items, setItems] = useState<StudyOverviewItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ContentIQApiClient.getStudyOverview()
      .then(({ projects }) => setItems(projects))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load study progress.'));
  }, []);

  const totals = useMemo(() => {
    const all = items ?? [];
    return {
      due: all.reduce((n, p) => n + p.flashcards.due, 0),
      cards: all.reduce((n, p) => n + p.flashcards.total, 0),
      mastered: all.reduce((n, p) => n + p.flashcards.mastered, 0),
      quizzes: all.reduce((n, p) => n + p.quiz.attempts, 0),
    };
  }, [items]);

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <GraduationCap className="w-7 h-7 text-brand-600" /> Study Mode
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          AI-generated flashcards with spaced repetition, plus your quiz scores — for every document and video you've processed.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile icon={Clock} label="Due today" value={totals.due} tone="text-amber-500" />
        <StatTile icon={Layers} label="Flashcards" value={totals.cards} tone="text-brand-500" />
        <StatTile icon={CheckCircle2} label="Mastered" value={totals.mastered} tone="text-emerald-500" />
        <StatTile icon={Trophy} label="Quizzes taken" value={totals.quizzes} tone="text-purple-500" />
      </div>

      {error && <p className="text-sm text-rose-500">{error}</p>}
      {!items && !error && <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-brand-600" /></div>}
      {items && items.length === 0 && <p className="text-sm text-slate-400">No completed projects yet — create a transformation first.</p>}

      {items && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((p) => {
            const progress = p.flashcards.total > 0 ? Math.round((p.flashcards.mastered / p.flashcards.total) * 100) : 0;
            return (
              <div key={p.id} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 flex flex-col">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                    {VIDEO_TYPES.includes(p.sourceType) ? <Video className="w-4 h-4 text-rose-500" /> : <FileText className="w-4 h-4 text-brand-500" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{p.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{p.sourceName}</p>
                  </div>
                </div>

                {p.flashcards.total > 0 ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>{p.flashcards.total} cards · {p.flashcards.due} due</span>
                      <span>{progress}% mastered</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">No flashcards yet.</p>
                )}

                <p className="text-[11px] text-slate-500">
                  Quiz: {p.quiz.attempts > 0 ? `best ${p.quiz.bestPercent}% · last ${p.quiz.lastPercent}% (${p.quiz.attempts} attempt${p.quiz.attempts === 1 ? '' : 's'})` : 'not attempted'}
                </p>

                <button
                  onClick={() => navigate(`/study/${p.id}`)}
                  className={`mt-auto w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    p.flashcards.due > 0 ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {p.flashcards.total === 0 ? <><Sparkles className="w-3.5 h-3.5" /> Create flashcards</> : p.flashcards.due > 0 ? <><Brain className="w-3.5 h-3.5" /> Review {p.flashcards.due} due</> : <>Open deck</>}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------- Deck (/study/:projectId) ----------------

function GeneratePanel({ onGenerate, busy, isFirst, defaultLanguage }: { onGenerate: (count: number, language: string) => void; busy: boolean; isFirst: boolean; defaultLanguage: string }) {
  const [count, setCount] = useState(10);
  const [language, setLanguage] = useState(defaultLanguage);
  useEffect(() => setLanguage(defaultLanguage), [defaultLanguage]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold">
        {[5, 10, 15, 20, 30].map((n) => <option key={n} value={n}>{n} cards</option>)}
      </select>
      <LanguageSelect value={language} onChange={setLanguage} includeAuto={false} title="Flashcard language" />
      <button
        onClick={() => onGenerate(count, language)}
        disabled={busy}
        className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-brand-700 disabled:opacity-60"
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isFirst ? <Sparkles className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        {busy ? 'Generating...' : isFirst ? 'Generate flashcards' : 'Add more cards'}
      </button>
    </div>
  );
}

function ReviewSession({ projectId, deck, onDeckChange }: { projectId: string; deck: FlashcardDeckData; onDeckChange: (cards: Flashcard[], stats: DeckStats) => void }) {
  const buildDueQueue = useCallback(
    () => deck.cards.filter((c) => new Date(c.dueAt) <= new Date()).sort((a, b) => +new Date(a.dueAt) - +new Date(b.dueAt)).map((c) => c.id),
    [deck.cards]
  );
  const [queue, setQueue] = useState<string[]>(buildDueQueue);
  const [revealed, setRevealed] = useState(false);
  const [grading, setGrading] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const card = deck.cards.find((c) => c.id === queue[0]);

  const grade = useCallback(
    async (g: 'again' | 'good' | 'easy') => {
      if (!card || grading) return;
      setGrading(true);
      setError(null);
      try {
        const { card: updated, stats } = await ContentIQApiClient.reviewFlashcard(projectId, card.id, g);
        onDeckChange(deck.cards.map((c) => (c.id === card.id ? { ...c, ...updated } : c)), stats);
        // A missed card goes to the back of this session's queue so it comes up again shortly.
        setQueue((q) => (g === 'again' ? [...q.slice(1), card.id] : q.slice(1)));
        setReviewedCount((n) => n + 1);
        setRevealed(false);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to save your review.');
      } finally {
        setGrading(false);
      }
    },
    [card, grading, projectId, deck.cards, onDeckChange]
  );

  // Keyboard: Space/Enter reveals, 1/2/3 grade.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'SELECT') return;
      if (!revealed && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed && ['Digit1', 'Digit2', 'Digit3'].includes(e.code)) {
        grade((['again', 'good', 'easy'] as const)[Number(e.code.slice(-1)) - 1]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [revealed, grade]);

  if (!card) {
    const nextDue = deck.cards.map((c) => new Date(c.dueAt)).sort((a, b) => +a - +b)[0];
    return (
      <div className="p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
        <h3 className="font-bold text-slate-900 dark:text-white">{reviewedCount > 0 ? `Session complete — ${reviewedCount} reviews` : 'All caught up!'}</h3>
        <p className="text-xs text-slate-500">{nextDue ? `Next card is due ${nextDue.toLocaleString()}.` : 'No cards scheduled.'}</p>
        <button
          onClick={() => { setQueue(deck.cards.map((c) => c.id)); setReviewedCount(0); }}
          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
        >
          Practice all {deck.cards.length} cards anyway
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span>{queue.length} left in this session · {reviewedCount} reviewed</span>
        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold">Box {card.box} · {BOX_LABELS[card.box]}</span>
      </div>

      <button
        type="button"
        onClick={() => setRevealed(true)}
        className="w-full min-h-[260px] p-8 rounded-3xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-sm text-left flex flex-col justify-center gap-5 cursor-pointer"
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-500 mb-2">Question</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white leading-snug">{card.front}</p>
        </div>
        {revealed ? (
          <div className="pt-5 border-t border-slate-200 dark:border-slate-700 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Answer</p>
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{card.back}</p>
            {card.citation && <p className="text-[11px] italic text-slate-400">Source: “{card.citation}”</p>}
          </div>
        ) : (
          <span className="text-xs text-slate-400 flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Click or press Space to reveal the answer</span>
        )}
      </button>

      {error && <p className="text-xs text-rose-500">{error}</p>}

      {revealed && (
        <div className="grid grid-cols-3 gap-3">
          {([
            ['again', 'Again', 'bg-rose-500 hover:bg-rose-600', '1'],
            ['good', 'Good', 'bg-brand-600 hover:bg-brand-700', '2'],
            ['easy', 'Easy', 'bg-emerald-600 hover:bg-emerald-700', '3'],
          ] as const).map(([g, label, cls, key]) => (
            <button key={g} onClick={() => grade(g)} disabled={grading} className={`py-3 rounded-2xl text-white text-xs font-bold ${cls} disabled:opacity-60`}>
              {label}
              <span className="block text-[10px] font-medium opacity-80">{nextIntervalLabel(card.box, g)} · key {key}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StudyDeck({ projectId }: { projectId: string }) {
  const navigate = useNavigate();
  const [data, setData] = useState<Awaited<ReturnType<typeof ContentIQApiClient.getStudyProject>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [tab, setTab] = useState<'review' | 'cards' | 'quiz'>('review');
  const [sessionKey, setSessionKey] = useState(0);

  useEffect(() => {
    ContentIQApiClient.getStudyProject(projectId)
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load this deck.'));
  }, [projectId]);

  const updateDeck = useCallback((cards: Flashcard[], stats: DeckStats) => {
    setData((d) => (d && d.deck ? { ...d, deck: { ...d.deck, cards, stats } } : d));
  }, []);

  const handleGenerate = async (count: number, language: string) => {
    setGenerating(true);
    setGenError(null);
    try {
      const { deck } = await ContentIQApiClient.generateFlashcards(projectId, count, language);
      setData((d) => (d ? { ...d, deck } : d));
      setSessionKey((k) => k + 1);
      setTab('review');
    } catch (err) {
      setGenError(err instanceof ApiError ? err.message : 'Failed to generate flashcards.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (cardId: string) => {
    if (!data?.deck) return;
    const { stats } = await ContentIQApiClient.deleteFlashcard(projectId, cardId);
    updateDeck(data.deck.cards.filter((c) => c.id !== cardId), stats);
  };

  const handleReset = async () => {
    if (!window.confirm('Reset progress for every card in this deck?')) return;
    const { deck } = await ContentIQApiClient.resetFlashcards(projectId);
    setData((d) => (d ? { ...d, deck } : d));
    setSessionKey((k) => k + 1);
  };

  if (error) {
    return (
      <div className="max-w-lg mx-auto text-center py-24 space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <p className="text-sm text-slate-500">{error}</p>
        <button onClick={() => navigate('/study')} className="text-xs font-semibold text-brand-600 hover:underline">Back to Study Mode</button>
      </div>
    );
  }
  if (!data) return <div className="flex justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-brand-600" /></div>;

  const { project, deck, quizAttempts } = data;
  const stats = deck?.stats ?? { total: 0, due: 0, new: 0, mastered: 0 };
  const bestQuiz = quizAttempts.reduce((m, a) => Math.max(m, Math.round((a.score / a.total) * 100)), 0);

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200 max-w-5xl mx-auto">
      <button onClick={() => navigate('/study')} className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1">
        <ArrowLeft className="w-3.5 h-3.5" /> All decks
      </button>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold text-brand-600 uppercase tracking-wider">Study deck</p>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white truncate">{project.name}</h1>
          <button onClick={() => navigate(`/projects/${project.id}`)} className="text-[11px] text-slate-400 hover:underline">{project.sourceName}</button>
        </div>
        <GeneratePanel onGenerate={handleGenerate} busy={generating} isFirst={!deck || deck.cards.length === 0} defaultLanguage={deck?.language || project.language || 'English'} />
      </div>
      {genError && <p className="text-xs text-rose-500">{genError}</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile icon={Clock} label="Due now" value={stats.due} tone="text-amber-500" />
        <StatTile icon={Layers} label="Total cards" value={stats.total} tone="text-brand-500" />
        <StatTile icon={CheckCircle2} label="Mastered" value={stats.mastered} tone="text-emerald-500" />
        <StatTile icon={Trophy} label="Best quiz" value={quizAttempts.length > 0 ? `${bestQuiz}%` : '—'} tone="text-purple-500" />
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 w-fit">
        {([['review', 'Review'], ['cards', `All cards (${stats.total})`], ['quiz', `Quiz history (${quizAttempts.length})`]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${tab === key ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'review' && (
        !deck || deck.cards.length === 0 ? (
          <div className="p-10 rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
            <Sparkles className="w-9 h-9 text-brand-500 mx-auto" />
            <h3 className="font-bold text-slate-900 dark:text-white">No flashcards yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Generate a deck from this source. Cards are grounded in the extracted content and scheduled with spaced repetition, so you review what you're about to forget.</p>
          </div>
        ) : (
          <ReviewSession key={sessionKey} projectId={projectId} deck={deck} onDeckChange={updateDeck} />
        )
      )}

      {tab === 'cards' && deck && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={handleReset} className="text-xs font-semibold text-slate-500 hover:text-rose-500 flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5" /> Reset progress</button>
          </div>
          {deck.cards.map((c) => (
            <div key={c.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex gap-4">
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{c.front}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{c.back}</p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{BOX_LABELS[c.box]}</span>
                <span className="text-[10px] text-slate-400">{c.reviewCount > 0 ? `${Math.round((c.correctCount / c.reviewCount) * 100)}% recall` : 'new'}</span>
                <button onClick={() => handleDelete(c.id)} className="text-slate-400 hover:text-rose-500" title="Delete card"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'quiz' && (
        quizAttempts.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
            <p className="text-sm text-slate-500">No quiz attempts yet.</p>
            <button onClick={() => navigate(`/projects/${project.id}`)} className="text-xs font-semibold text-brand-600 hover:underline">Take this project's quiz on its Results page</button>
          </div>
        ) : (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-end gap-2 h-32" aria-label="Quiz scores over time">
              {[...quizAttempts].reverse().map((a) => {
                const pct = Math.round((a.score / a.total) * 100);
                return (
                  <div key={a.id} className="flex-1 max-w-[40px] flex flex-col items-center justify-end h-full gap-1" title={`${a.score}/${a.total} · ${new Date(a.createdAt).toLocaleString()}`}>
                    <span className="text-[9px] text-slate-400 tabular-nums">{pct}%</span>
                    <div className={`w-full rounded-t-md ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ height: `${Math.max(4, pct)}%` }} />
                  </div>
                );
              })}
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {quizAttempts.map((a) => (
                <li key={a.id} className="py-2 flex justify-between text-xs">
                  <span className="text-slate-500">{new Date(a.createdAt).toLocaleString()}</span>
                  <span className="font-bold text-slate-900 dark:text-white tabular-nums">{a.score}/{a.total} ({Math.round((a.score / a.total) * 100)}%)</span>
                </li>
              ))}
            </ul>
          </div>
        )
      )}
    </div>
  );
}

export const StudyPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  return projectId ? <StudyDeck projectId={projectId} /> : <StudyOverview />;
};
