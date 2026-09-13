import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, CheckCircle2, Info, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { VerificationReport } from '../types';
import { ContentIQApiClient, ApiError } from '../services/api';

export const VerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');

  const [report, setReport] = useState<VerificationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (!projectId) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      try {
        const { report: latest } = await ContentIQApiClient.getLatestVerification(projectId);
        setReport(latest);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load verification report.');
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  const handleRunVerification = async () => {
    if (!projectId) return;
    setRunning(true);
    setError(null);
    try {
      const { report: fresh } = await ContentIQApiClient.runVerification(projectId);
      setReport(fresh);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to run verification.');
    } finally {
      setRunning(false);
    }
  };

  const categoryBreakdown = useMemo(() => {
    if (!report) return [];
    const groups = new Map<string, { total: number; warnings: number }>();
    for (const c of report.checks) {
      const g = groups.get(c.category) || { total: 0, warnings: 0 };
      g.total += 1;
      if (c.status !== 'verified') g.warnings += 1;
      groups.set(c.category, g);
    }
    return Array.from(groups.entries()).map(([category, g]) => ({ category, ...g }));
  }, [report]);

  const filteredChecks = report?.checks.filter((c) => filterStatus === 'all' || c.status === filterStatus) || [];
  const verifiedCount = report?.checks.filter((c) => c.status === 'verified').length || 0;
  const warningCount = report ? report.checks.length - verifiedCount : 0;

  if (!projectId) {
    return (
      <div className="max-w-lg mx-auto text-center py-24 space-y-3">
        <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto" />
        <p className="text-sm text-slate-500">Open a project's results and click "Fact Verification Score" to audit its generated content.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-200">
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-3xl p-8 shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI Output Grounding / Consistency Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Meaning & Fact Verification Engine</h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            ContentIQ AI extracts claims from generated output and checks each one against the retrieved source content — surfacing numbers, dates, and conditions that were changed, softened, or unsupported.
            This is a grounding/consistency check, not a guarantee of perfect factual correctness.
          </p>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-300"><Loader2 className="w-4 h-4 animate-spin" /> Loading verification status...</div>
          ) : report ? (
            <div className="pt-2 flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center font-extrabold text-2xl text-emerald-300 shadow-inner">{report.fidelityScore}%</div>
                <div>
                  <p className="text-xs font-bold text-white">Content Fidelity Score</p>
                  <p className="text-[11px] text-emerald-300/80">Based on {report.totalChecks} extracted claims</p>
                </div>
              </div>
              <div className="h-10 w-[1px] bg-slate-700"></div>
              <div className="text-xs space-y-1 text-slate-300">
                <p>Total Statement Checks: <strong className="text-white">{report.totalChecks}</strong></p>
                <p>Passed Checks: <strong className="text-emerald-400">{report.passedChecks}</strong> • Flagged Warnings: <strong className="text-amber-400">{report.warnings}</strong></p>
              </div>
              <button onClick={handleRunVerification} disabled={running} className="ml-auto px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-semibold flex items-center gap-2 disabled:opacity-50">
                {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} Re-run Verification
              </button>
            </div>
          ) : (
            <button onClick={handleRunVerification} disabled={running} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs rounded-xl flex items-center gap-2 disabled:opacity-50">
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Run Fact Verification
            </button>
          )}

          {error && <p className="text-xs text-rose-300 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{error}</p>}
        </div>
      </div>

      {report && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {categoryBreakdown.map((item) => (
              <div key={item.category} className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-1 shadow-2xs">
                <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">{item.category}</p>
                <span className="text-[10px] font-semibold block text-slate-400">{item.total} Checked</span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full inline-block ${item.warnings > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'}`}>
                  {item.warnings > 0 ? `${item.warnings} Flagged` : 'Passed'}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-500" />Claim-by-Claim Comparison</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Comparing extracted claims from generated output against retrieved source content</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400 font-medium">Filter Status:</span>
                <button onClick={() => setFilterStatus('all')} className={`px-3 py-1 rounded-xl text-xs font-semibold ${filterStatus === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>All ({report.checks.length})</button>
                <button onClick={() => setFilterStatus('verified')} className={`px-3 py-1 rounded-xl text-xs font-semibold ${filterStatus === 'verified' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'}`}>Verified ({verifiedCount})</button>
                <button onClick={() => setFilterStatus('meaning_changed')} className={`px-3 py-1 rounded-xl text-xs font-semibold ${filterStatus === 'meaning_changed' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'}`}>Warnings ({warningCount})</button>
              </div>
            </div>

            <div className="space-y-4">
              {filteredChecks.map((check) => (
                <div key={check.id} className={`p-5 rounded-2xl border transition-all space-y-4 ${check.status === 'meaning_changed' ? 'border-amber-300 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-800/60 ring-1 ring-amber-400/30' : check.status === 'nuance_shift' ? 'border-blue-200 bg-blue-50/30 dark:bg-blue-950/20 dark:border-blue-800/40' : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-850/30'}`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      {check.status === 'meaning_changed' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500 text-white"><AlertTriangle className="w-3.5 h-3.5" />Meaning Changed</span>}
                      {check.status === 'verified' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-600 text-white"><CheckCircle2 className="w-3.5 h-3.5" />Verified</span>}
                      {check.status === 'nuance_shift' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-600 text-white"><Info className="w-3.5 h-3.5" />Nuance Shift</span>}
                      {(check.status as string) === 'unsupported' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-600 text-white"><AlertTriangle className="w-3.5 h-3.5" />Unsupported</span>}
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Category: {check.category}</span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">Check #{check.id.toUpperCase()}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Retrieved Source Context</span>
                      <p className="text-slate-800 dark:text-slate-200 font-sans leading-relaxed">{check.sourceStatement}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Generated Claim</span>
                      <p className="text-slate-800 dark:text-slate-200 font-sans leading-relaxed">{check.generatedStatement}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/70 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                    <div><span className="font-bold text-slate-900 dark:text-white">AI Auditor Reasoning: </span>{check.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
