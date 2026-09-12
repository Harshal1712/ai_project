import React, { useState } from 'react';
import { 
  FileText, 
  Youtube, 
  Video, 
  Mic, 
  FileCode, 
  Image as ImageIcon, 
  Upload, 
  Check, 
  Sparkles, 
  Sliders, 
  CheckSquare, 
  Square, 
  ArrowRight,
  Globe,
  Users,
  MessageSquare,
  BarChart,
  Target,
  FileCheck,
  AlertCircle,
  HelpCircle,
  Play
} from 'lucide-react';
import { 
  SourceType, 
  TargetAudience, 
  OutputLanguage, 
  ContentTone, 
  DetailLevel, 
  CommunicationObjective, 
  OutputType,
  SourceContent,
  TransformationConfig
} from '../types';
import { ALL_OUTPUT_TYPES } from '../data/mockData';

interface CreateTransformationProps {
  onStartProcessing: (source: SourceContent, config: TransformationConfig, outputs: OutputType[]) => void;
  initialSourceType?: SourceType;
}

export const CreateTransformation: React.FC<CreateTransformationProps> = ({
  onStartProcessing,
  initialSourceType = 'pdf'
}) => {
  // Step 1 State: Source Selection
  const [selectedSourceType, setSelectedSourceType] = useState<SourceType>(initialSourceType);
  const [youtubeUrl, setYoutubeUrl] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [pastedText, setPastedText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<SourceContent | null>({
    type: 'pdf',
    name: 'SIH26154_Enterprise_Content_Transformation_Spec.pdf',
    size: '4.2 MB',
    language: 'English (Auto-Detected)',
    uploadDate: '2026-09-10'
  });
  const [analyzingYoutube, setAnalyzingYoutube] = useState(false);

  // Step 2 State: Configuration
  const [audience, setAudience] = useState<TargetAudience>('Executive');
  const [language, setLanguage] = useState<OutputLanguage>('English');
  const [tone, setTone] = useState<ContentTone>('Professional');
  const [detailLevel, setDetailLevel] = useState<DetailLevel>('Medium');
  const [objective, setObjective] = useState<CommunicationObjective>('Brief');

  // Step 3 State: Select Outputs
  const [selectedOutputs, setSelectedOutputs] = useState<OutputType[]>([
    'Executive Summary',
    'Key Points',
    'Presentation / PPT',
    'FAQ',
    'MCQs / Quiz',
    'Action Items'
  ]);

  const sourceTabs = [
    { id: 'pdf' as SourceType, label: 'Upload Document', icon: FileText, desc: 'PDF, DOCX, TXT' },
    { id: 'youtube' as SourceType, label: 'YouTube URL', icon: Youtube, desc: 'Video link analysis' },
    { id: 'video' as SourceType, label: 'Upload Video', icon: Video, desc: 'MP4, MOV, WEBM' },
    { id: 'audio' as SourceType, label: 'Upload Audio', icon: Mic, desc: 'MP3, WAV, M4A' },
    { id: 'text' as SourceType, label: 'Paste Text', icon: FileCode, desc: 'Raw Markdown/Text' },
    { id: 'image' as SourceType, label: 'Upload Image', icon: ImageIcon, desc: 'PNG, JPG (OCR)' },
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
      if (selectedOutputs.length > 1) {
        setSelectedOutputs(selectedOutputs.filter(t => t !== type));
      }
    } else {
      setSelectedOutputs([...selectedOutputs, type]);
    }
  };

  const handleSelectPreset = (preset: 'all' | 'exec' | 'training' | 'social') => {
    switch (preset) {
      case 'all':
        setSelectedOutputs([...ALL_OUTPUT_TYPES]);
        break;
      case 'exec':
        setSelectedOutputs(['Executive Summary', 'Key Points', 'Presentation / PPT', 'Advisory', 'Action Items']);
        break;
      case 'training':
        setSelectedOutputs(['Detailed Summary', 'Training Material', 'MCQs / Quiz', 'FAQ', 'Q&A']);
        break;
      case 'social':
        setSelectedOutputs(['Key Points', 'Social Media Post', 'Infographic Content', 'Video Script']);
        break;
    }
  };

  const handleAnalyzeYoutube = () => {
    setAnalyzingYoutube(true);
    setTimeout(() => {
      setAnalyzingYoutube(false);
      setUploadedFile({
        type: 'youtube',
        name: 'Enterprise Gen AI Architecture Keynote',
        url: youtubeUrl,
        duration: '45:30',
        thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
        language: 'English (Auto-Detected)',
        uploadDate: '2026-09-10'
      });
    }, 1200);
  };

  const handleDropFile = () => {
    setUploadedFile({
      type: selectedSourceType,
      name: selectedSourceType === 'video' ? 'Enterprise_Product_Demo.mp4' : 'Technical_Architecture_Spec.pdf',
      size: '18.4 MB',
      duration: selectedSourceType === 'video' ? '14:20' : undefined,
      language: 'English (Auto-Detected)',
      uploadDate: '2026-09-10'
    });
  };

  const handleGenerate = () => {
    const source: SourceContent = uploadedFile || {
      type: selectedSourceType,
      name: pastedText ? 'Pasted Text Document' : 'Enterprise_Source_Document.pdf',
      size: '1.2 MB',
      language: 'English',
      uploadDate: '2026-09-10'
    };

    const config: TransformationConfig = {
      audience,
      language,
      tone,
      detailLevel,
      objective
    };

    onStartProcessing(source, config, selectedOutputs);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-16 animate-in fade-in duration-200">
      {/* Header */}
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
          Configure raw inputs, target audience guidelines, and select which of the 14 outputs to synthesize.
        </p>
      </div>

      {/* STEP 1: Select Source */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-600 text-white font-bold text-sm flex items-center justify-center shadow-md">
              1
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">Step 1 — Select Source Content</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Choose input format: PDF, DOCX, YouTube video, Audio, Text, or Image</p>
            </div>
          </div>
          {uploadedFile && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full">
              <Check className="w-3.5 h-3.5" /> Source Ready
            </span>
          )}
        </div>

        {/* Source Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {sourceTabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedSourceType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedSourceType(tab.id);
                  if (tab.id === 'youtube' && !uploadedFile?.url) {
                    setUploadedFile(null);
                  }
                }}
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

        {/* Dynamic Source Input Panel */}
        <div className="p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-850/40 border border-slate-200/60 dark:border-slate-800">
          {selectedSourceType === 'youtube' ? (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Paste YouTube Video URL
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Youtube className="w-5 h-5 text-red-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <button
                  onClick={handleAnalyzeYoutube}
                  disabled={analyzingYoutube}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                >
                  {analyzingYoutube ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin text-brand-400" />
                      <span>Fetching Chapters...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Analyze Video</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : selectedSourceType === 'text' ? (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Paste Source Text / Proposal
              </label>
              <textarea
                rows={5}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste raw markdown, document transcript, or meeting notes here..."
                className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          ) : (
            <div 
              onClick={handleDropFile}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 rounded-2xl p-8 text-center cursor-pointer transition-colors space-y-3 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Click to upload or drag & drop file
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports PDF, DOCX, MP4, MP3, PNG up to 250MB
                </p>
              </div>
            </div>
          )}

          {/* Active File / Video Preview Card */}
          {uploadedFile && (
            <div className="mt-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {uploadedFile.thumbnail ? (
                  <img src={uploadedFile.thumbnail} alt="Thumbnail" className="w-14 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-300 flex items-center justify-center font-bold text-xs">
                    {uploadedFile.type.toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{uploadedFile.name}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                    {uploadedFile.size && <span>{uploadedFile.size}</span>}
                    {uploadedFile.duration && <span>Duration: {uploadedFile.duration}</span>}
                    <span>{uploadedFile.language}</span>
                  </div>
                </div>
              </div>

              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Processed
              </span>
            </div>
          )}
        </div>
      </div>

      {/* STEP 2: Configure Transformation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="w-8 h-8 rounded-xl bg-brand-600 text-white font-bold text-sm flex items-center justify-center shadow-md">
            2
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white">Step 2 — Configure Transformation Parameters</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Specify target audience, output language, tone, detail level, and objective</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Target Audience */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-brand-500" />
              Target Audience
            </label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as TargetAudience)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="Executive">Executive (C-Suite / Leadership)</option>
              <option value="Technical Team">Technical Team (Engineers / Architects)</option>
              <option value="Student">Student (Academic / Learners)</option>
              <option value="Customer">Customer (External Stakeholders)</option>
              <option value="Employee">Employee (Internal Staff)</option>
              <option value="General Public">General Public</option>
              <option value="Custom">Custom Persona</option>
            </select>
          </div>

          {/* Output Language */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-indigo-500" />
              Output Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as OutputLanguage)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi (हिंदी)</option>
              <option value="Marathi">Marathi (मराठी)</option>
              <option value="Tamil">Tamil (தமிழ்)</option>
              <option value="Telugu">Telugu (తెలుగు)</option>
              <option value="Bengali">Bengali (বাংলা)</option>
              <option value="Custom">Custom Multilingual</option>
            </select>
          </div>

          {/* Tone */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-purple-500" />
              Tone & Voice
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as ContentTone)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="Professional">Professional & Polished</option>
              <option value="Simple">Simple & Plain Language</option>
              <option value="Technical">Technical & Precise</option>
              <option value="Educational">Educational & Instructive</option>
              <option value="Formal">Formal Governance</option>
              <option value="Conversational">Conversational & Engaging</option>
            </select>
          </div>

          {/* Detail Level */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <BarChart className="w-4 h-4 text-blue-500" />
              Detail Level
            </label>
            <select
              value={detailLevel}
              onChange={(e) => setDetailLevel(e.target.value as DetailLevel)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="Short">Short & Concise (TL;DR)</option>
              <option value="Medium">Medium Balanced Overview</option>
              <option value="Detailed">Detailed Deep Dive</option>
            </select>
          </div>

          {/* Communication Objective */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-emerald-500" />
              Communication Objective
            </label>
            <select
              value={objective}
              onChange={(e) => setObjective(e.target.value as CommunicationObjective)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
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
            <div className="w-8 h-8 rounded-xl bg-brand-600 text-white font-bold text-sm flex items-center justify-center shadow-md">
              3
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">Step 3 — Select Transformation Outputs ({selectedOutputs.length} selected)</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Select multiple output formats to generate concurrently from this single source</p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Presets:</span>
            <button onClick={() => handleSelectPreset('all')} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300">
              Select All (14)
            </button>
            <button onClick={() => handleSelectPreset('exec')} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
              Executive Suite
            </button>
            <button onClick={() => handleSelectPreset('training')} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              Training Pack
            </button>
            <button onClick={() => handleSelectPreset('social')} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
              Social Blitz
            </button>
          </div>
        </div>

        {/* 14 Output Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {outputCards.map((card) => {
            const isSelected = selectedOutputs.includes(card.type);
            return (
              <div
                key={card.type}
                onClick={() => handleToggleOutput(card.type)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all duration-150 flex items-start gap-3 select-none ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 ring-1 ring-brand-500/30'
                    : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-850/30 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="mt-0.5">
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-300 dark:text-slate-700" />
                  )}
                </div>

                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-bold text-xs ${isSelected ? 'text-brand-900 dark:text-brand-200' : 'text-slate-800 dark:text-slate-200'}`}>
                      {card.type}
                    </h3>
                    <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400">
                      {card.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {card.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Primary CTA */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Sparkles className="w-4 h-4 text-brand-500" />
            <span>Fact-verification engine will run automatically during synthesis.</span>
          </div>

          <button
            onClick={handleGenerate}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-brand-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate {selectedOutputs.length} Outputs with AI</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
