import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Clock, ShieldCheck, Layers, FileCheck, Loader2 } from 'lucide-react';
import { ContentIQApiClient } from '../services/api';

const PIE_COLORS = ['#8b5cf6', '#6366f1', '#ec4899', '#10b981', '#f59e0b', '#0ea5e9'];

export const AnalyticsPage: React.FC = () => {
  const [myMetrics, setMyMetrics] = useState<{ totalTransformations: number; documentsProcessed: number; videosSummarized: number; avgLatencySeconds: number; contentFidelityScore: number } | null>(null);
  const [topOutputTypes, setTopOutputTypes] = useState<{ name: string; count: number }[]>([]);
  const [languageDistribution, setLanguageDistribution] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([ContentIQApiClient.getMyAnalytics(), ContentIQApiClient.getGlobalTelemetry()])
      .then(([mine, global]) => {
        setMyMetrics(mine.metrics);
        setTopOutputTypes(global.topOutputTypes);
        setLanguageDistribution(global.languageDistribution);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Analytics</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Real usage metrics computed from your account's projects, outputs, and verification runs.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-brand-600" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold"><span>Documents Processed</span><FileCheck className="w-4 h-4 text-blue-500" /></div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{myMetrics?.documentsProcessed ?? 0}</p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold"><span>Videos & YouTube Links</span><Layers className="w-4 h-4 text-purple-500" /></div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{myMetrics?.videosSummarized ?? 0}</p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold"><span>Avg Job Latency</span><Clock className="w-4 h-4 text-amber-500" /></div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{myMetrics?.avgLatencySeconds ? `${myMetrics.avgLatencySeconds}s` : '—'}</p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold"><span>Content Fidelity Index</span><ShieldCheck className="w-4 h-4 text-emerald-500" /></div>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{myMetrics?.contentFidelityScore ? `${myMetrics.contentFidelityScore}%` : '—'}</p>
              <span className="text-[11px] text-slate-400 font-medium">Average across your verification runs</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Most Popular Output Types (Platform-wide)</h3>
                <p className="text-xs text-slate-400">Total generated format count across all users</p>
              </div>
              <div className="h-64">
                {topOutputTypes.length === 0 ? <p className="text-xs text-slate-400 flex items-center justify-center h-full">No outputs generated yet.</p> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topOutputTypes} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis type="number" stroke="#94a3b8" fontSize={10} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={110} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#6366f1" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Output Language Distribution (Platform-wide)</h3>
                <p className="text-xs text-slate-400">Share of projects configured per output language</p>
              </div>
              <div className="h-60 flex items-center justify-center">
                {languageDistribution.length === 0 ? <p className="text-xs text-slate-400">No projects yet.</p> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={languageDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {languageDistribution.map((_, index) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
