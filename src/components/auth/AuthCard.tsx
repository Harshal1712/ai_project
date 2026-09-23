import React from 'react';
import { Sparkles } from 'lucide-react';

// Shared shell for the standalone auth screens (forgot/reset password), matching the Login page.
export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-xl tracking-tight">ContentIQ AI</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{title}</h1>
          <p className="text-sm text-slate-500 mb-6">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

export const authInputClass =
  'w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40';

export const authButtonClass =
  'w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-medium text-sm rounded-xl shadow-sm transition-all disabled:opacity-60';

export function AuthAlert({ tone, children }: { tone: 'error' | 'success'; children: React.ReactNode }) {
  const styles =
    tone === 'error'
      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
      : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300';
  return <div className={`mb-4 px-3 py-2 rounded-lg border text-xs ${styles}`}>{children}</div>;
}
