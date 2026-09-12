import React, { useState, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Clock, 
  Search, 
  CheckCircle2, 
  Youtube, 
  Video, 
  Sparkles, 
  MessageSquare, 
  Quote, 
  FileText, 
  Award,
  ChevronRight,
  ExternalLink,
  Volume2
} from 'lucide-react';
import { MOCK_VIDEO_INTELLIGENCE } from '../data/mockData';
import { VideoChapter } from '../types';

export const VideoSummarizer: React.FC = () => {
  const [videoData, setVideoData] = useState(MOCK_VIDEO_INTELLIGENCE);
  const [activeTab, setActiveTab] = useState<'summary' | 'detailed' | 'takeaways' | 'quotes' | 'topics' | 'faq' | 'quiz'>('summary');
  const [currentTime, setCurrentTime] = useState(332); // Default to 05:32 Main Concept
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoSearchQuery, setVideoSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ answer: string; timestamp: string; seconds: number } | null>(null);

  const handleJumpToTimestamp = (seconds: number) => {
    setCurrentTime(seconds);
    setIsPlaying(true);
  };

  const handleVideoSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoSearchQuery.trim()) return;

    if (videoSearchQuery.toLowerCase().includes('overfitting') || videoSearchQuery.toLowerCase().includes('model')) {
      setSearchResults({
        answer: 'The speaker explains model fine-tuning and overfitting prevention strategies during Chapter 5.',
        timestamp: '37:20',
        seconds: 2240
      });
    } else if (videoSearchQuery.toLowerCase().includes('verification') || videoSearchQuery.toLowerCase().includes('fact')) {
      setSearchResults({
        answer: 'The Factual Verification Engine and hallucination prevention algorithms are detailed during Chapter 3.',
        timestamp: '14:20',
        seconds: 860
      });
    } else {
      setSearchResults({
        answer: `The query "${videoSearchQuery}" is discussed in detail during the Multimodal Processing Pipeline overview.`,
        timestamp: '05:32',
        seconds: 332
      });
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300">
              Video Intelligence
            </span>
            <span className="text-xs text-slate-400">SIH Multimodal Speech & Vision Parser</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {videoData.videoTitle}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Duration: <strong className="text-slate-700 dark:text-slate-200">{videoData.duration}</strong></span>
        </div>
      </div>

      {/* Video Player & Chapters Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Video Player Simulation */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 relative group">
            {/* Visual Canvas / Player View */}
            <div className="aspect-[16/9] relative flex items-center justify-center bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950">
              <img
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80"
                alt="Video Frame"
                className="w-full h-full object-cover opacity-40"
              />

              {/* Overlay Player Information */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-xs text-white bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                <span className="font-semibold truncate">{videoData.videoTitle}</span>
                <span className="font-mono text-brand-300">{formatSeconds(currentTime)} / {videoData.duration}</span>
              </div>

              {/* Central Play/Pause Button */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-16 h-16 rounded-full bg-brand-600/90 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform backdrop-blur-sm border border-brand-400/40"
              >
                {isPlaying ? <Pause className="w-8 h-8 fill-white" /> : <Play className="w-8 h-8 fill-white ml-1" />}
              </button>

              {/* Bottom Scrubber Controls Bar */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent space-y-2">
                <input
                  type="range"
                  min={0}
                  max={2730}
                  value={currentTime}
                  onChange={(e) => setCurrentTime(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 accent-brand-500 rounded-lg cursor-pointer"
                />
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setIsPlaying(!isPlaying)} className="hover:text-white">
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <Volume2 className="w-4 h-4" />
                    <span className="font-mono">{formatSeconds(currentTime)}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-brand-300">Auto-Synced AI Transcript</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive AI Search in Video */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-500" />
              Ask Anything About This Video (Semantic Timestamp Search)
            </h3>

            <form onSubmit={handleVideoSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={videoSearchQuery}
                  onChange={(e) => setVideoSearchQuery(e.target.value)}
                  placeholder="e.g. Where does the speaker explain overfitting?"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-brand-600 text-white font-semibold text-xs rounded-xl hover:bg-brand-700 transition-colors"
              >
                Search Timestamp
              </button>
            </form>

            {searchResults && (
              <div className="p-3.5 rounded-2xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200/60 dark:border-brand-800/60 flex items-center justify-between gap-3 animate-in fade-in">
                <div>
                  <p className="text-xs text-brand-900 dark:text-brand-200 font-medium">{searchResults.answer}</p>
                  <span className="text-[11px] text-brand-600 dark:text-brand-400 font-bold">Timestamp: {searchResults.timestamp}</span>
                </div>
                <button
                  onClick={() => handleJumpToTimestamp(searchResults.seconds)}
                  className="px-3 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-lg shrink-0 flex items-center gap-1 hover:bg-brand-700"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> Jump to {searchResults.timestamp}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Chapters Timeline */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-500" />
                AI Generated Chapters
              </h3>
              <span className="text-xs text-slate-400">{videoData.chapters.length} Key Segments</span>
            </div>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {videoData.chapters.map((chapter) => {
                const isActive = currentTime >= chapter.seconds && currentTime < (chapter.seconds + 500);

                return (
                  <div
                    key={chapter.id}
                    onClick={() => handleJumpToTimestamp(chapter.seconds)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-150 space-y-1 ${
                      isActive
                        ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 ring-1 ring-brand-500/30'
                        : 'border-slate-200/60 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/40 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-300 font-mono text-[11px]">
                          {chapter.timestamp}
                        </span>
                        {chapter.title}
                      </span>
                      <Play className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-500" />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-1">
                      {chapter.summary}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Sub-Tabs Section for Video Outputs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 overflow-x-auto scrollbar-none">
          {[
            { id: 'summary', label: 'Short Summary' },
            { id: 'detailed', label: 'Detailed Summary' },
            { id: 'takeaways', label: 'Key Takeaways' },
            { id: 'quotes', label: 'Important Quotes' },
            { id: 'topics', label: 'Topics Discussed' },
            { id: 'faq', label: 'Questions & Answers' },
            { id: 'quiz', label: 'Video MCQs' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Display */}
        <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {activeTab === 'summary' && (
            <p className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 font-medium">
              {videoData.shortSummary}
            </p>
          )}

          {activeTab === 'detailed' && (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 whitespace-pre-wrap">
              {videoData.detailedSummary}
            </div>
          )}

          {activeTab === 'takeaways' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {videoData.keyTakeaways.map((takeaway, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{takeaway}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'quotes' && (
            <div className="space-y-3">
              {videoData.importantQuotes.map((q, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/40 space-y-2">
                  <Quote className="w-5 h-5 text-purple-500" />
                  <p className="font-semibold text-slate-900 dark:text-slate-100 italic">"{q.quote}"</p>
                  <div className="flex items-center justify-between text-[11px] text-purple-700 dark:text-purple-300 font-bold">
                    <span>— {q.speaker}</span>
                    <button 
                      onClick={() => handleJumpToTimestamp(1000)}
                      className="hover:underline flex items-center gap-1"
                    >
                      <Play className="w-3 h-3 fill-current" /> Timestamp {q.timestamp}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'topics' && (
            <div className="flex flex-wrap gap-2">
              {videoData.topicsDiscussed.map((topic, idx) => (
                <span key={idx} className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs">
                  # {topic}
                </span>
              ))}
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="space-y-3">
              {videoData.faq.map((f, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <p className="font-bold text-slate-900 dark:text-white">Q: {f.question}</p>
                  <p className="text-slate-600 dark:text-slate-400">A: {f.answer}</p>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block pt-1">
                    Reference Timestamp: {f.timestamp}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'quiz' && (
            <div className="space-y-4">
              {videoData.quiz.map((q) => (
                <div key={q.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <p className="font-bold text-slate-900 dark:text-white">Q{q.id}: {q.question}</p>
                  <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    {q.options.map((opt, oIdx) => (
                      <li key={oIdx} className={`p-2 rounded-lg ${oIdx === q.correctAnswer ? 'bg-emerald-50 text-emerald-800 font-bold dark:bg-emerald-950/60 dark:text-emerald-200' : ''}`}>
                        {opt}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
