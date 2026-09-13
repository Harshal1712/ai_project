import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { ContentIQApiClient, ApiError } from '../services/api';

interface AuditLogEntry {
  _id: string;
  action: string;
  detail: string;
  projectId?: string;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  USER_REGISTERED: 'Account Registered',
  USER_LOGIN: 'Logged In',
  PROJECT_CREATED: 'Project Created',
  PROJECT_DELETED: 'Project Deleted',
  OUTPUT_GENERATED: 'Outputs Generated',
  VERIFICATION_RUN: 'Verification Run',
  QA_ASKED: 'Question Asked',
};

export const HistoryPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ContentIQApiClient.getHistory()
      .then(({ logs }) => setLogs(logs))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load history.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Activity History</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Real audit trail of your account's actions on ContentIQ AI</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-brand-600" /></div>
        ) : error ? (
          <p className="text-sm text-rose-500 text-center py-12">{error}</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-12">No activity recorded yet.</p>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850/60 border-b border-slate-200/80 dark:border-slate-800 font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-5">Action</th>
                <th className="py-3.5 px-4">Detail</th>
                <th className="py-3.5 px-5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-850/50">
                  <td className="py-4 px-5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    {ACTION_LABELS[log.action] || log.action}
                  </td>
                  <td className="py-4 px-4 text-slate-700 dark:text-slate-300">{log.detail}</td>
                  <td className="py-4 px-5 text-right text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
