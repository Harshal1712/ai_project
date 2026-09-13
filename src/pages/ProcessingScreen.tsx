import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Loader2, Sparkles, XCircle, ArrowLeft } from 'lucide-react';
import { ContentIQApiClient, ApiError } from '../services/api';

const MILESTONES = [
  { threshold: 0, label: 'Queued' },
  { threshold: 10, label: 'Extracting & embedding content' },
  { threshold: 65, label: 'Generating outputs' },
  { threshold: 100, label: 'Completed' },
];

const POLL_INTERVAL_MS = 2500;

export const ProcessingScreen: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const location = useLocation() as { state?: { jobId?: string } };
  const navigate = useNavigate();
  const jobId = location.state?.jobId;

  const [status, setStatus] = useState<'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'>('QUEUED');
  const [stage, setStage] = useState('Queued');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!jobId) {
      // Reloaded this URL directly with no jobId in history state — just show the project as-is.
      navigate(`/projects/${projectId}`, { replace: true });
      return;
    }

    const poll = async () => {
      try {
        const { job } = await ContentIQApiClient.getJob(jobId);
        setStatus(job.status);
        setProgress(job.progress);
        if (job.stage) setStage(job.stage);

        if (job.status === 'COMPLETED') {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setTimeout(() => navigate(`/projects/${projectId}`, { replace: true }), 600);
        } else if (job.status === 'FAILED') {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setError(job.error || 'Processing failed for an unknown reason.');
        }
      } catch (err) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setError(err instanceof ApiError ? err.message : 'Lost connection while checking processing status.');
      }
    };

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [jobId, projectId, navigate]);

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center mx-auto">
          <XCircle className="w-8 h-8 text-rose-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Processing failed</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{error}</p>
        </div>
        <button
          onClick={() => navigate('/create')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Create Transformation
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-16 px-4 space-y-8 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 shadow-xl text-center space-y-6 relative overflow-hidden">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 flex items-center justify-center mx-auto shadow-lg shadow-brand-500/20 animate-ai-pulse">
          <Sparkles className="w-10 h-10 text-white animate-spin-slow" />
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">AI Engine Transforming Content...</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">{stage}</p>
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <div className="flex justify-between text-xs font-semibold text-slate-500">
            <span>Overall Progress</span>
            <span className="text-brand-600 dark:text-brand-400">{progress}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-600 to-purple-600 transition-all duration-500 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="text-left space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/80 max-w-md mx-auto">
          {MILESTONES.map((m, idx) => {
            const isDone = progress > m.threshold && (MILESTONES[idx + 1] ? progress >= MILESTONES[idx + 1].threshold : status === 'COMPLETED');
            const isCurrent = !isDone && progress >= m.threshold && (idx === MILESTONES.length - 1 || progress < MILESTONES[idx + 1].threshold);
            return (
              <div key={m.label} className="flex items-start gap-3 text-xs">
                <div className="mt-0.5 shrink-0">
                  {isDone ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : isCurrent ? <Loader2 className="w-4 h-4 text-brand-600 dark:text-brand-400 animate-spin" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200 dark:border-slate-700" />}
                </div>
                <p className={`font-semibold ${isDone ? 'text-slate-700 dark:text-slate-300' : isCurrent ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-slate-400 dark:text-slate-600'}`}>{m.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
