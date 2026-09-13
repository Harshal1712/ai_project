import React, { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FileText,
  Youtube,
  Video,
  Mic,
  FileCode,
  Upload,
  Check,
  Sparkles,
  CheckSquare,
  Square,
  ArrowRight,
  Globe,
  Users,
  MessageSquare,
  BarChart,
  Target,
  Play,
  Loader2,
  AlertCircle
} from 'lucide-react';
import {
  SourceType,
  TargetAudience,
  OutputLanguage,
  ContentTone,
  DetailLevel,
  CommunicationObjective,
  OutputType,
  TransformationConfig
} from '../types';
import { ALL_OUTPUT_TYPES } from '../data/mockData';
import { ContentIQApiClient, ApiError } from '../services/api';

const ACCEPT_BY_TAB: Record<string, string> = {
  pdf: '.pdf,.docx,.txt',
  video: '.mp4,.mov,.webm',
  audio: '.mp3,.wav,.m4a',
};

export const CreateTransformation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { initialSourceType?: SourceType; initialConfig?: Partial<TransformationConfig>; initialOutputs?: OutputType[] } };
  const initial = location.state || {};

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedSourceType, setSelectedSourceType] = useState<SourceType>(initial.initialSourceType || 'pdf');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [youtubePreview, setYoutubePreview] = useState<{ videoTitle: string; thumbnailUrl?: string; duration: string } | null>(null);
  const [analyzingYoutube, setAnalyzingYoutube] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [audience, setAudience] = useState<TargetAudience>((initial.initialConfig?.audience as TargetAudience) || 'Executive');
  const [language, setLanguage] = useState<OutputLanguage>((initial.initialConfig?.language as OutputLanguage) || 'English');
  const [tone, setTone] = useState<ContentTone>((initial.initialConfig?.tone as ContentTone) || 'Professional');
  const [detailLevel, setDetailLevel] = useState<DetailLevel>((initial.initialConfig?.detailLevel as DetailLevel) || 'Medium');
  const [objective, setObjective] = useState<CommunicationObjective>((initial.initialConfig?.objective as CommunicationObjective) || 'Brief');

  const [selectedOutputs, setSelectedOutputs] = useState<OutputType[]>(
    initial.initialOutputs || ['Executive Summary', 'Key Points', 'Presentation / PPT', 'FAQ', 'MCQs / Quiz', 'Action Items']
  );

  const sourceTabs = [
    { id: 'pdf' as SourceType, label: 'Upload Document', icon: FileText, desc: 'PDF, DOCX, TXT' },
    { id: 'youtube' as SourceType, label: 'YouTube URL', icon: Youtube, desc: 'Video link analysis' },
    { id: 'video' as SourceType, label: 'Upload Video', icon: Video, desc: 'MP4, MOV, WEBM' },
    { id: 'audio' as SourceType, label: 'Upload Audio', icon: Mic, desc: 'MP3, WAV, M4A' },
    { id: 'text' as SourceType, label: 'Paste Text', icon: FileCode, desc: 'Raw Markdown/Text' },
  ];

  const outputCards: { type: OutputType; desc: string; category: string }[] = [
    { type: 'Executive Summary', desc: 'Concise high-level overview for C-suite decision makers', category: 'Summary' },
    { type: 'Detailed Summary', desc: 'Section-by-section breakdown of core arguments', category: 'Summary' },
    { type: 'Key Points', desc: 'Bulletized strategic highlights and takeaways', category: 'Summary' },
    { type: 'FAQ', desc: 'Frequently Asked Questions with precise answers', category: 'Q&A' },
    { type: 'Q&A', desc: 'Comprehensive Question & Answer index', category: 'Q&A' },
    { type: 'Presentation / PPT', desc: 'Structured multi-slide presentation deck with speaker notes', category: 'Visual & Decks' },
    { type: 'Social Media Post', desc: 'Engaging LinkedIn, X/Twitter, and corporate social posts', category: 'Marketing' },
    { type: 'Advisory', desc: 'Strategic advisory memo & risk assessment', category: 'Strategic' },
    { type: 'Infographic Content', desc: 'Structured data blocks ready for graphic designer layout', category: 'Visual & Decks' },
    { type: 'Training Material', desc: 'Step-by-step employee onboarding & SOP manual', category: 'Education' },
    { type: 'MCQs / Quiz', desc: 'Interactive assessment questions with answer keys', category: 'Education' },
    { type: 'Video Script', desc: '3-minute recap video script with visual cues', category: 'Media' },
    { type: 'Meeting Minutes', desc: 'Formal key discussions and attendance summary', category: 'Operational' },
    { type: 'Action Items', desc: 'Trackable task list with recommended owners', category: 'Operational' },
  ];

  const handleToggleOutput = (type: OutputType) => {
    if (selectedOutputs.includes(type)) {
      if (selectedOutputs.length > 1) setSelectedOutputs(selectedOutputs.filter((t) => t !== type));
    } else {
      setSelectedOutputs([...selectedOutputs, type]);
    }
  };

  const handleSelectPreset = (preset: 'all' | 'exec' | 'training' | 'social') => {
    switch (preset) {
      case 'all': setSelectedOutputs([...ALL_OUTPUT_TYPES]); break;
      case 'exec': setSelectedOutputs(['Executive Summary', 'Key Points', 'Presentation / PPT', 'Advisory', 'Action Items']); break;
      case 'training': setSelectedOutputs(['Detailed Summary', 'Training Material', 'MCQs / Quiz', 'FAQ', 'Q&A']); break;
      case 'social': setSelectedOutputs(['Key Points', 'Social Media Post', 'Infographic Content', 'Video Script']); break;
    }
  };

  const handleAnalyzeYoutube = async () => {
    if (!youtubeUrl.trim()) return;
    setAnalyzingYoutube(true);
    setSubmitError(null);
    setYoutubePreview(null);
    try {
      const res = await ContentIQApiClient.analyzeYoutube(youtubeUrl.trim());
      setYoutubePreview({ videoTitle: res.data.videoTitle, thumbnailUrl: res.data.thumbnailUrl, duration: res.data.duration });
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Could not analyze this YouTube video.');
    } finally {
      setAnalyzingYoutube(false);
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const config: TransformationConfig = { audience, language, tone, detailLevel, objective };

  const canGenerate =
    (selectedSourceType === 'text' && pastedText.trim().length > 0) ||
    (selectedSourceType === 'youtube' && youtubeUrl.trim().length > 0) ||
    (['pdf', 'video', 'audio'].includes(selectedSourceType) && !!selectedFile);

  const handleGenerate = async () => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      let result: { projectId: string; jobId: string };
      if (selectedSourceType === 'text') {
        result = await ContentIQApiClient.generateFromText(pastedText, 'Pasted Text.txt', config, selectedOutputs);
      } else if (selectedSourceType === 'youtube') {
        result = await ContentIQApiClient.generateFromYoutube(youtubeUrl.trim(), config, selectedOutputs);
      } else if (selectedFile) {
        result = await ContentIQApiClient.uploadSource(selectedFile, config, selectedOutputs);
      } else {
        throw new Error('Please provide source content before generating.');
      }
      navigate(`/projects/${result.projectId}/processing`, { state: { jobId: result.jobId } });
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Failed to start transformation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-16 animate-in fade-in duration-200">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300">
            Transformation Builder
          </span>
          <span className="text-xs text-slate-400">Step-by-Step AI Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
          Create Multimodal Content Transformation
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configure raw inputs, target audience guidelines, and select which outputs to synthesize.
        </p>
      </div>

      {/* STEP 1: Select Source */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-600 text-white font-bold text-sm flex items-center justify-center shadow-md">1</div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">Step 1 — Select Source Content</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Choose input format: PDF, DOCX, TXT, YouTube video, Audio, or Text</p>
            </div>
          </div>
          {(selectedFile || youtubePreview || pastedText.trim()) && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full">
              <Check className="w-3.5 h-3.5" /> Source Ready
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {sourceTabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedSourceType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedSourceType(tab.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all duration-150 flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 ring-2 ring-brand-500/20 text-brand-900 dark:text-brand-200'
                    : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
                  {isSelected && <div className="w-2 h-2 rounded-full bg-brand-600"></div>}
                </div>
                <div>
                  <p className="text-xs font-bold">{tab.label}</p>
                  <p className="text-[10px] text-slate-400 truncate">{tab.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-850/40 border border-slate-200/60 dark:border-slate-800">
          {selectedSourceType === 'youtube' ? (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Paste YouTube Video URL</label>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Youtube className="w-5 h-5 text-red-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => { setYoutubeUrl(e.target.value); setYoutubePreview(null); }}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <button
                  onClick={handleAnalyzeYoutube}
                  disabled={analyzingYoutube || !youtubeUrl.trim()}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {analyzingYoutube ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Fetching transcript & chapters...</span></>
                  ) : (
                    <><Play className="w-4 h-4" /><span>Analyze Video</span></>
                  )}
                </button>
              </div>
            </div>
          ) : selectedSourceType === 'text' ? (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Paste Source Text / Proposal</label>
              <textarea
                rows={8}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste raw markdown, document transcript, or meeting notes here..."
                className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 rounded-2xl p-8 text-center cursor-pointer transition-colors space-y-3 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_BY_TAB[selectedSourceType]}
                onChange={handleFileSelected}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Click to upload a file</p>
                <p className="text-xs text-slate-400 mt-1">Supports {ACCEPT_BY_TAB[selectedSourceType]?.replace(/\./g, '').toUpperCase()}, up to 50MB</p>
              </div>
            </div>
          )}

          {selectedFile && (
            <div className="mt-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-300 flex items-center justify-center font-bold text-xs">
                  {selectedFile.name.split('.').pop()?.toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{selectedFile.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Ready
              </span>
            </div>
          )}

          {youtubePreview && (
            <div className="mt-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {youtubePreview.thumbnailUrl && <img src={youtubePreview.thumbnailUrl} alt="" className="w-14 h-10 rounded-lg object-cover" />}
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{youtubePreview.videoTitle}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Duration: {youtubePreview.duration}</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Transcript found
              </span>
            </div>
          )}
        </div>
      </div>

      {/* STEP 2: Configure Transformation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="w-8 h-8 rounded-xl bg-brand-600 text-white font-bold text-sm flex items-center justify-center shadow-md">2</div>
          <div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white">Step 2 — Configure Transformation Parameters</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Specify target audience, output language, tone, detail level, and objective</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><Users className="w-4 h-4 text-brand-500" />Target Audience</label>
            <select value={audience} onChange={(e) => setAudience(e.target.value as TargetAudience)} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="Executive">Executive (C-Suite / Leadership)</option>
              <option value="Technical Team">Technical Team (Engineers / Architects)</option>
              <option value="Student">Student (Academic / Learners)</option>
              <option value="Customer">Customer (External Stakeholders)</option>
              <option value="Employee">Employee (Internal Staff)</option>
              <option value="General Public">General Public</option>
              <option value="Custom">Custom Persona</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><Globe className="w-4 h-4 text-indigo-500" />Output Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value as OutputLanguage)} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="English">English</option>
              <option value="Hindi">Hindi (हिंदी)</option>
              <option value="Marathi">Marathi (मराठी)</option>
              <option value="Tamil">Tamil (தமிழ்)</option>
              <option value="Telugu">Telugu (తెలుగు)</option>
              <option value="Bengali">Bengali (বাংলা)</option>
              <option value="Custom">Custom Multilingual</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><MessageSquare className="w-4 h-4 text-purple-500" />Tone & Voice</label>
            <select value={tone} onChange={(e) => setTone(e.target.value as ContentTone)} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="Professional">Professional & Polished</option>
              <option value="Simple">Simple & Plain Language</option>
              <option value="Technical">Technical & Precise</option>
              <option value="Educational">Educational & Instructive</option>
              <option value="Formal">Formal Governance</option>
              <option value="Conversational">Conversational & Engaging</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><BarChart className="w-4 h-4 text-blue-500" />Detail Level</label>
            <select value={detailLevel} onChange={(e) => setDetailLevel(e.target.value as DetailLevel)} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="Short">Short & Concise (TL;DR)</option>
              <option value="Medium">Medium Balanced Overview</option>
              <option value="Detailed">Detailed Deep Dive</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><Target className="w-4 h-4 text-emerald-500" />Communication Objective</label>
            <select value={objective} onChange={(e) => setObjective(e.target.value as CommunicationObjective)} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="Brief">Brief C-Suite Decision Makers</option>
              <option value="Inform">Inform & Update Team</option>
              <option value="Educate">Educate & Upskill</option>
              <option value="Summarize">Summarize Key Findings</option>
              <option value="Persuade">Persuade / Pitch Proposal</option>
              <option value="Train">Train Operational Staff</option>
            </select>
          </div>
        </div>
      </div>

      {/* STEP 3: Select Outputs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-600 text-white font-bold text-sm flex items-center justify-center shadow-md">3</div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">Step 3 — Select Transformation Outputs ({selectedOutputs.length} selected)</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Select multiple output formats to generate concurrently from this single source</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Presets:</span>
            <button onClick={() => handleSelectPreset('all')} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300">Select All ({ALL_OUTPUT_TYPES.length})</button>
            <button onClick={() => handleSelectPreset('exec')} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">Executive Suite</button>
            <button onClick={() => handleSelectPreset('training')} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">Training Pack</button>
            <button onClick={() => handleSelectPreset('social')} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">Social Blitz</button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {outputCards.map((card) => {
            const isSelected = selectedOutputs.includes(card.type);
            return (
              <div
                key={card.type}
                onClick={() => handleToggleOutput(card.type)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all duration-150 flex items-start gap-3 select-none ${
                  isSelected ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 ring-1 ring-brand-500/30' : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-850/30 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="mt-0.5">{isSelected ? <CheckSquare className="w-5 h-5 text-brand-600 dark:text-brand-400" /> : <Square className="w-5 h-5 text-slate-300 dark:text-slate-700" />}</div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-bold text-xs ${isSelected ? 'text-brand-900 dark:text-brand-200' : 'text-slate-800 dark:text-slate-200'}`}>{card.type}</h3>
                    <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400">{card.category}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{card.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {submitError && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Sparkles className="w-4 h-4 text-brand-500" />
            <span>Extraction, embeddings, and generation run in the background — this may take a minute for larger sources.</span>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!canGenerate || submitting}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-brand-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Generate {selectedOutputs.length} Outputs with AI</span>
            {!submitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
