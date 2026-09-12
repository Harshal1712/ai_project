import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Filter, 
  Search, 
  ArrowRight,
  Sparkles,
  FileText,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { MOCK_VERIFICATION } from '../data/mockData';
import { VerificationCheck } from '../types';

export const VerificationPage: React.FC = () => {
  const [report, setReport] = useState(MOCK_VERIFICATION);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const categories = ['all', 'Numbers', 'Dates', 'Names', 'Technical terms', 'Requirements', 'Conditions', 'References'];

  const filteredChecks = report.checks.filter(c => {
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesCat = filterCategory === 'all' || c.category === filterCategory;
    return matchesStatus && matchesCat;
  });

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-3xl p-8 shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>SIH26154 Key Differentiating Feature • Dual-Engine Semantic Diff</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Meaning & Fact Verification Engine
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            ContentIQ AI performs automatic token-level semantic diff audits between source documents and AI outputs. Detect shifts in working days, numeric thresholds, SLA percentages, and regulatory conditions before publishing.
          </p>

          <div className="pt-2 flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center font-extrabold text-2xl text-emerald-300 shadow-inner">
                {report.fidelityScore}%
              </div>
              <div>
                <p className="text-xs font-bold text-white">Content Fidelity Score</p>
                <p className="text-[11px] text-emerald-300/80">High Precision Verified</p>
              </div>
            </div>

            <div className="h-10 w-[1px] bg-slate-700"></div>

            <div className="text-xs space-y-1 text-slate-300">
              <p>Total Statement Checks: <strong className="text-white">{report.totalChecks}</strong></p>
              <p>Passed Checks: <strong className="text-emerald-400">{report.passedChecks}</strong> • Flagged Warnings: <strong className="text-amber-400">{report.warnings}</strong></p>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Numbers & Metrics', count: '5 Checked', status: 'Passed', icon: '123' },
          { label: 'Dates & Deadlines', count: '3 Checked', status: 'Passed', icon: '📅' },
          { label: 'Names & Orgs', count: '4 Checked', status: 'Passed', icon: '👤' },
          { label: 'Technical Terms', count: '3 Checked', status: '1 Shift', icon: '⚙️' },
          { label: 'Requirements', count: '2 Checked', status: 'Passed', icon: '📋' },
          { label: 'Conditions', count: '1 Checked', status: '1 Warning', icon: '⚠️' },
          { label: 'References', count: '4 Checked', status: 'Passed', icon: '🔗' },
        ].map((item, idx) => (
          <div key={idx} className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-1 shadow-2xs">
            <span className="text-lg">{item.icon}</span>
            <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">{item.label}</p>
            <span className="text-[10px] font-semibold block text-slate-400">{item.count}</span>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full inline-block ${
              item.status.includes('Warning') 
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' 
                : item.status.includes('Shift')
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
            }`}>
              {item.status}
            </span>
          </div>
        ))}
      </div>

      {/* Filter Controls & Statement Diff View */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Filters Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              Line-by-Line Statement Comparison
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Comparing original source statements against generated outputs
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-medium">Filter Status:</span>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                filterStatus === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              All ({report.checks.length})
            </button>
            <button
              onClick={() => setFilterStatus('meaning_changed')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                filterStatus === 'meaning_changed' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              }`}
            >
              Warnings (1)
            </button>
            <button
              onClick={() => setFilterStatus('verified')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                filterStatus === 'verified' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
              }`}
            >
              Verified (3)
            </button>
          </div>
        </div>

        {/* Statement Diff Cards */}
        <div className="space-y-4">
          {filteredChecks.map((check) => (
            <div 
              key={check.id}
              className={`p-5 rounded-2xl border transition-all space-y-4 ${
                check.status === 'meaning_changed'
                  ? 'border-amber-300 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-800/60 ring-1 ring-amber-400/30'
                  : check.status === 'nuance_shift'
                  ? 'border-blue-200 bg-blue-50/30 dark:bg-blue-950/20 dark:border-blue-800/40'
                  : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-850/30'
              }`}
            >
              {/* Card Status & Category Tag */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {check.status === 'meaning_changed' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500 text-white">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      ⚠ Meaning Changed
                    </span>
                  )}
                  {check.status === 'verified' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-600 text-white">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      ✓ Verified Accurate
                    </span>
                  )}
                  {check.status === 'nuance_shift' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-600 text-white">
                      <Info className="w-3.5 h-3.5" />
                      ℹ Nuance / Unit Shift
                    </span>
                  )}

                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    Category: {check.category}
                  </span>
                </div>

                <span className="text-xs text-slate-400 font-mono">Check #{check.id.toUpperCase()}</span>
              </div>

              {/* Side-by-Side Comparison Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                
                {/* Source Statement */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Original Source Statement
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 font-sans leading-relaxed">
                    {check.status === 'meaning_changed' ? (
                      <>
                        The strategic enterprise application must be submitted within{' '}
                        <mark className="bg-amber-200 dark:bg-amber-900/80 dark:text-amber-100 font-bold px-1 rounded">
                          7 working days
                        </mark>{' '}
                        from the official notification.
                      </>
                    ) : (
                      check.sourceStatement
                    )}
                  </p>
                </div>

                {/* Generated Statement */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    AI Generated Statement Output
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 font-sans leading-relaxed">
                    {check.status === 'meaning_changed' ? (
                      <>
                        The application must be submitted within{' '}
                        <mark className="bg-rose-200 dark:bg-rose-900/80 dark:text-rose-100 font-bold px-1 rounded line-through">
                          7 days
                        </mark>
                        .
                      </>
                    ) : (
                      check.generatedStatement
                    )}
                  </p>
                </div>

              </div>

              {/* AI Verification Note */}
              <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/70 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">AI Auditor Reasoning: </span>
                  {check.note}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
