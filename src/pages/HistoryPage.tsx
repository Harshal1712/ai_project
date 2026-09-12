import React from 'react';
import { History, CheckCircle2, Clock, ShieldCheck, Cpu } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const auditLogs = [
    { id: 'log-1', action: 'Transformation Completed', project: 'SIH26154 Gen AI Architecture Spec', outputs: 6, time: '2026-09-08 14:30', duration: '3.8s', fidelity: '96%' },
    { id: 'log-2', action: 'YouTube Video Analyzed', project: 'Enterprise Gen AI Video Keynote', outputs: 4, time: '2026-09-07 10:15', duration: '4.2s', fidelity: '98%' },
    { id: 'log-3', action: 'Document Ingested', project: 'Q3_Enterprise_AI_Financial_Report.docx', outputs: 3, time: '2026-09-05 16:45', duration: '2.9s', fidelity: '95%' }
  ];

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Transformation Audit History
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Historical log of AI execution pipelines, processing durations, and fidelity benchmarks
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-850/60 border-b border-slate-200/80 dark:border-slate-800 font-bold text-slate-400 uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-5">Action</th>
              <th className="py-3.5 px-4">Target Project</th>
              <th className="py-3.5 px-4">Outputs</th>
              <th className="py-3.5 px-4">Latency</th>
              <th className="py-3.5 px-4">Fidelity</th>
              <th className="py-3.5 px-5 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {auditLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-850/50">
                <td className="py-4 px-5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {log.action}
                </td>
                <td className="py-4 px-4 text-slate-700 dark:text-slate-300 font-medium">{log.project}</td>
                <td className="py-4 px-4 font-semibold text-brand-600">{log.outputs} Formats</td>
                <td className="py-4 px-4 text-slate-500">{log.duration}</td>
                <td className="py-4 px-4">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[11px]">
                    {log.fidelity}
                  </span>
                </td>
                <td className="py-4 px-5 text-right text-slate-400">{log.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
