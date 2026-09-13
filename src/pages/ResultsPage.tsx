import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Copy,
  Download,
  RefreshCw,
  Edit3,
  Check,
  Send,
  Bot,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileText,
  Presentation,
  Sparkles,
  Award,
  ExternalLink,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { ProjectItem, GeneratedOutput, QuizQuestion } from '../types';
import confetti from 'canvas-confetti';
import { ContentIQApiClient, ApiError } from '../services/api';

export const ResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeOutputTab, setActiveOutputTab] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState<string>('');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<{ [key: number]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; citation?: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [{ project: proj }, { messages }] = await Promise.all([
          ContentIQApiClient.getProject(id),
          ContentIQApiClient.getConversation(id).catch(() => ({ messages: [] as any[] })),
        ]);
        setProject(proj);
        setActiveOutputTab(proj.outputs[0]?.id || '');
        if (messages.length > 0) {
          setChatMessages(
            messages.map((m: any) => ({
              sender: m.role === 'user' ? 'user' : 'ai',
              text: m.content,
              citation: m.citations?.[0] ? buildCitationText(m.citations[0]) : undefined,
            }))
          );
        } else {
          setChatMessages([{ sender: 'ai', text: 'Ask me anything about this source content — I will answer strictly from what was extracted, with citations.' }]);
        }
      } catch (err) {
        setLoadError(err instanceof ApiError ? err.message : 'Failed to load this project.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const currentOutput = project?.outputs.find((o) => o.id === activeOutputTab) || project?.outputs[0];

  const handleCopy = (text: string, outId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(outId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (output: GeneratedOutput) => {
    const blob = new Blob([output.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project?.name || 'output'}_${output.type.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !id || chatLoading) return;

    const userText = chatInput;
    setChatInput('');
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setChatLoading(true);

    try {
      const { result } = await ContentIQApiClient.askQuestion(userText, id);
      setChatMessages((prev) => [...prev, { sender: 'ai', text: result.answer, citation: result.sources[0] ? buildCitationText(result.sources[0]) : result.citation }]);
    } catch (err) {
      setChatMessages((prev) => [...prev, { sender: 'ai', text: err instanceof ApiError ? err.message : 'Something went wrong answering that question.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSelectQuizOption = (questionId: number, optionIdx: number) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleSubmitQuiz = () => {
    setQuizSubmitted(true);
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
      </div>
    );
  }

  if (loadError || !project) {
    return (
      <div className="max-w-lg mx-auto text-center py-24 space-y-4">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <p className="text-sm text-slate-600 dark:text-slate-400">{loadError || 'Project not found.'}</p>
        <button onClick={() => navigate('/projects')} className="text-xs font-semibold text-brand-600 hover:underline">Back to My Projects</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300">{project.version}</span>
            <span className="text-xs text-slate-400">Created: {new Date(project.createdAt).toLocaleString()}</span>
            <button
              onClick={() => navigate(`/verification?projectId=${id}`)}
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {project.verification ? `${project.verification.fidelityScore}% Content Fidelity` : 'Run Fact Verification'}
            </button>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{project.name}</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/create', { state: { initialSourceType: project.source.type, initialConfig: project.config, initialOutputs: project.selectedOutputTypes } })}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-configure Parameters</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Source Intelligence</h3>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{project.source.name}</span>
              </div>
              <div className="text-[11px] text-slate-400 space-y-1">
                <p>Type: <span className="text-slate-700 dark:text-slate-300 uppercase">{project.source.type}</span></p>
                {project.source.size && <p>Size: <span className="text-slate-700 dark:text-slate-300">{project.source.size}</span></p>}
                {project.source.duration && <p>Duration: <span className="text-slate-700 dark:text-slate-300">{project.source.duration}</span></p>}
                <p>Detected Language: <span className="text-slate-700 dark:text-slate-300">{project.source.language || 'English'}</span></p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-700 dark:text-slate-300">Configured Parameters</h4>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-850"><span className="text-slate-400 block">Audience</span><span className="font-semibold text-slate-800 dark:text-slate-200">{project.config.audience}</span></div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-850"><span className="text-slate-400 block">Language</span><span className="font-semibold text-slate-800 dark:text-slate-200">{project.config.language}</span></div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-850"><span className="text-slate-400 block">Tone</span><span className="font-semibold text-slate-800 dark:text-slate-200">{project.config.tone}</span></div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-850"><span className="text-slate-400 block">Detail Level</span><span className="font-semibold text-slate-800 dark:text-slate-200">{project.config.detailLevel}</span></div>
              </div>
            </div>

            <div
              onClick={() => navigate(`/verification?projectId=${id}`)}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200/60 dark:border-emerald-800/60 cursor-pointer hover:shadow-sm transition-all space-y-1"
            >
              <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />Fact Verification Score</span>
                <span>{project.verification ? `${project.verification.fidelityScore}%` : '—'}</span>
              </div>
              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                {project.verification ? `${project.verification.passedChecks} of ${project.verification.totalChecks} checks verified.` : 'Click to run grounding verification on this content.'}
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-100 dark:border-slate-800">
              {project.outputs.map((out) => {
                const isActive = activeOutputTab === out.id;
                return (
                  <button
                    key={out.id}
                    onClick={() => { setActiveOutputTab(out.id); setIsEditing(false); }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      isActive ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20' : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {out.type === 'Presentation / PPT' && <Presentation className="w-3.5 h-3.5" />}
                    {out.type === 'MCQs / Quiz' && <Award className="w-3.5 h-3.5" />}
                    <span>{out.type}</span>
                  </button>
                );
              })}
            </div>

            {currentOutput && (
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{currentOutput.title || currentOutput.type}</h3>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => handleCopy(currentOutput.content, currentOutput.id)} className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-colors" title="Copy Content">
                    {copiedId === currentOutput.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleDownload(currentOutput)} className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-colors" title="Download Text File">
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setIsEditing(!isEditing); setEditableContent(currentOutput.content); }}
                    className={`p-2 rounded-lg transition-colors ${isEditing ? 'bg-brand-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700'}`}
                    title="Edit Content Inline"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {currentOutput && (
              <div className="space-y-4">
                {currentOutput.slides && currentOutput.slides.length > 0 ? (
                  <div className="space-y-4">
                    <div className="aspect-[16/9] bg-gradient-to-br from-slate-900 via-slate-850 to-brand-950 text-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xl border border-slate-800 relative">
                      <div className="flex items-center justify-between text-xs text-brand-300 font-semibold border-b border-white/10 pb-3">
                        <span className="flex items-center gap-1"><Presentation className="w-4 h-4 text-brand-400" />Slide {currentSlideIndex + 1} of {currentOutput.slides.length}</span>
                        <span>ContentIQ AI Presentation Deck</span>
                      </div>
                      <div className="space-y-4 my-auto">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-white">{currentOutput.slides[currentSlideIndex].title}</h2>
                        <ul className="space-y-2 text-xs sm:text-sm text-slate-200">
                          {currentOutput.slides[currentSlideIndex].bulletPoints.map((bp, i) => (
                            <li key={i} className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0 mt-2"></span><span>{bp}</span></li>
                          ))}
                        </ul>
                      </div>
                      <div className="text-[11px] text-slate-400 bg-white/5 p-2.5 rounded-xl border border-white/10">
                        <span className="font-bold text-brand-300">Speaker Notes: </span>{currentOutput.slides[currentSlideIndex].speakerNotes}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <button onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))} disabled={currentSlideIndex === 0} className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 flex items-center gap-1">
                        <ChevronLeft className="w-4 h-4" /> Previous Slide
                      </button>
                      <div className="flex gap-1">
                        {currentOutput.slides.map((_, idx) => (
                          <button key={idx} onClick={() => setCurrentSlideIndex(idx)} className={`w-2.5 h-2.5 rounded-full transition-all ${currentSlideIndex === idx ? 'bg-brand-600 w-6' : 'bg-slate-300 dark:bg-slate-700'}`}></button>
                        ))}
                      </div>
                      <button onClick={() => setCurrentSlideIndex(Math.min(currentOutput.slides!.length - 1, currentSlideIndex + 1))} disabled={currentSlideIndex === currentOutput.slides.length - 1} className="px-3.5 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold disabled:opacity-40 flex items-center gap-1">
                        Next Slide <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : currentOutput.quiz && currentOutput.quiz.length > 0 ? (
                  <div className="space-y-6">
                    <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200/50 dark:border-brand-800/40 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-brand-900 dark:text-brand-200">Interactive Quiz Assessment</h4>
                        <p className="text-xs text-brand-700/80 dark:text-brand-300/80">Test comprehension based on extracted source facts.</p>
                      </div>
                      <Award className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div className="space-y-4">
                      {currentOutput.quiz.map((q: QuizQuestion) => {
                        const selectedOpt = quizAnswers[q.id];
                        const isCorrect = selectedOpt === q.correctAnswer;
                        return (
                          <div key={q.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/40 dark:bg-slate-850/40">
                            <p className="text-xs font-bold text-slate-900 dark:text-white">Q{q.id}: {q.question}</p>
                            <div className="space-y-2">
                              {q.options.map((opt, oIdx) => {
                                let optStyle = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300';
                                if (quizSubmitted) {
                                  if (oIdx === q.correctAnswer) optStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold';
                                  else if (selectedOpt === oIdx && !isCorrect) optStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200';
                                } else if (selectedOpt === oIdx) optStyle = 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-900 dark:text-brand-200 font-bold';
                                return (
                                  <div key={oIdx} onClick={() => handleSelectQuizOption(q.id, oIdx)} className={`p-3 rounded-xl border text-xs cursor-pointer transition-colors flex items-center justify-between ${optStyle}`}>
                                    <span>{opt}</span>
                                    {quizSubmitted && oIdx === q.correctAnswer && <Check className="w-4 h-4 text-emerald-600" />}
                                  </div>
                                );
                              })}
                            </div>
                            {quizSubmitted && (
                              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                                <span className="font-bold text-slate-900 dark:text-white">Explanation: </span>{q.explanation}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {!quizSubmitted && (
                      <button onClick={handleSubmitQuiz} className="w-full py-3 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-brand-700 transition-colors">
                        Submit Answers & Check Score
                      </button>
                    )}
                  </div>
                ) : isEditing ? (
                  <textarea rows={12} value={editableContent} onChange={(e) => setEditableContent(e.target.value)} className="w-full p-4 rounded-2xl border border-brand-400 bg-white dark:bg-slate-900 text-xs sm:text-sm font-mono leading-relaxed focus:outline-none" />
                ) : (
                  <div className="p-5 rounded-2xl bg-slate-50/60 dark:bg-slate-850/40 border border-slate-200/60 dark:border-slate-800/60 whitespace-pre-wrap text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                    {currentOutput.content}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col h-[620px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-brand-100 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400"><Bot className="w-4 h-4" /></div>
                <div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white">Ask Content AI</h3>
                  <p className="text-[10px] text-slate-400">Grounded Q&A with citations</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex items-start gap-2 text-xs ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender === 'ai' && <div className="w-6 h-6 rounded-lg bg-brand-600 text-white flex items-center justify-center shrink-0 mt-0.5"><Sparkles className="w-3 h-3" /></div>}
                  <div className={`p-3 rounded-2xl max-w-[85%] space-y-1 ${msg.sender === 'user' ? 'bg-brand-600 text-white font-medium rounded-tr-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/60 dark:border-slate-700/60'}`}>
                    <p className="whitespace-pre-wrap leading-relaxed text-[11px]">{msg.text}</p>
                    {msg.citation && (
                      <div className="text-[9px] font-semibold text-brand-600 dark:text-brand-300 pt-1 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center gap-1">
                        <ExternalLink className="w-2.5 h-2.5" /><span>{msg.citation}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Retrieving grounded answer...
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask anything about this document..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button type="submit" disabled={chatLoading} className="p-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-colors shrink-0 disabled:opacity-50">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

function buildCitationText(source: { page?: number; section?: string; startTime?: number; endTime?: number }): string {
  if (source.page != null) return `Page ${source.page}`;
  if (source.section) return `Section: ${source.section}`;
  if (source.startTime != null) {
    const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    return `${fmt(source.startTime)} - ${fmt(source.endTime ?? source.startTime)}`;
  }
  return 'Source content';
}
