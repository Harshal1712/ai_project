import React from 'react';
import { X, Sparkles, ShieldCheck, Video, FileText, CheckCircle2, Layers, Cpu, Award } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-brand-900 via-slate-900 to-indigo-950 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-600/30 border border-brand-400/40 flex items-center justify-center text-brand-300 shadow-inner">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold tracking-tight">ContentIQ AI Platform</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/30 border border-brand-400/40 text-brand-200 font-semibold">
                  SIH26154
                </span>
              </div>
              <p className="text-xs text-brand-200/80 mt-1">
                Gen AI Platform for Automated Content Transformation — Problem Statement #26154
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-600 dark:text-slate-300">
          {/* Mission Box */}
          <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60">
            <h4 className="font-semibold text-brand-900 dark:text-brand-200 flex items-center gap-2">
              <Award className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              Tagline: "One Source. Every Format. AI-Powered."
            </h4>
            <p className="text-xs text-brand-800 dark:text-brand-300 mt-1 leading-relaxed">
              ContentIQ AI eliminates manual document distillation by allowing enterprise teams to upload a single raw document, video, audio file, or YouTube link and automatically transform it into 14 purpose-built outputs with factual verification.
            </p>
          </div>

          {/* Key Differentiators */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-base mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-brand-500" />
              Key Platform Differentiators
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
                <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Fact & Meaning Verification
                </div>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">
                  Line-by-line semantic diffing comparing source statements with AI outputs to flag numerical errors or meaning shifts (96%+ Fidelity Score).
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
                <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100 text-xs">
                  <Video className="w-4 h-4 text-purple-500" />
                  Interactive Video Intelligence
                </div>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">
                  Auto-extracts chapters from long videos and YouTube links with clickable timestamp navigation and video AI search.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
                <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100 text-xs">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  14 Output Formats
                </div>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">
                  Generate Executive Briefs, PPT Slides, MCQs/Quizzes, Social Media kits, Advisory notes, Video scripts, and Action items in 1 click.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
                <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100 text-xs">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Grounded "Ask Content" AI
                </div>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">
                  Interactive side-assistant that answers user questions with exact source citations and page/timestamp references.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Guide Steps */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-base mb-3">
              How to Evaluate the Demo
            </h4>
            <ol className="space-y-2">
              <li className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Dashboard:</strong> Launch transformation workflows or pick from sample projects.</span>
              </li>
              <li className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Create Transformation:</strong> Upload a PDF/video or paste a YouTube URL, configure target audience/language, and select outputs.</span>
              </li>
              <li className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Fact Verification:</strong> View side-by-side statement diffs and meaning-change flags.</span>
              </li>
              <li className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Video Intelligence:</strong> Click video chapters to jump player timestamp instantly.</span>
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
          >
            Got it, explore platform
          </button>
        </div>
      </div>
    </div>
  );
};
