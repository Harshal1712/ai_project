import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line,
  AreaChart,
  Area
} from 'recharts';
import { BarChart3, TrendingUp, Clock, ShieldCheck, Layers, FileCheck } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  // Chart Data Sets
  const volumeTrendData = [
    { day: 'Mon', transformations: 140, docs: 90, videos: 30 },
    { day: 'Tue', transformations: 210, docs: 130, videos: 45 },
    { day: 'Wed', transformations: 340, docs: 210, videos: 75 },
    { day: 'Thu', transformations: 290, docs: 180, videos: 60 },
    { day: 'Fri', transformations: 480, docs: 310, videos: 110 },
    { day: 'Sat', transformations: 310, docs: 190, videos: 70 },
    { day: 'Sun', transformations: 260, docs: 160, videos: 50 },
  ];

  const outputTypesData = [
    { name: 'Summary', count: 420 },
    { name: 'PPT Deck', count: 380 },
    { name: 'FAQ / Q&A', count: 310 },
    { name: 'MCQs', count: 260 },
    { name: 'Social Post', count: 210 },
    { name: 'Action Items', count: 190 },
    { name: 'Advisory', count: 140 },
  ];

  const languageData = [
    { name: 'English', value: 65, color: '#8b5cf6' },
    { name: 'Hindi', value: 18, color: '#6366f1' },
    { name: 'Marathi', value: 8, color: '#ec4899' },
    { name: 'Tamil', value: 5, color: '#10b981' },
    { name: 'Other', value: 4, color: '#f59e0b' },
  ];

  const fidelityTrendData = [
    { week: 'W1', score: 94.2 },
    { week: 'W2', score: 95.1 },
    { week: 'W3', score: 96.0 },
    { week: 'W4', score: 96.8 },
    { week: 'W5', score: 97.4 },
  ];

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Platform Analytics & ROI Benchmarks
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Real-time telemetry tracking transformation volumes, language distribution, and factual fidelity scores.
        </p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Documents Processed</span>
            <FileCheck className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">892</p>
          <span className="text-[11px] text-emerald-600 font-medium">+12% vs last week</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Videos & YouTube Links</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">314</p>
          <span className="text-[11px] text-emerald-600 font-medium">+24% growth</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Avg Processing Latency</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">3.8s</p>
          <span className="text-[11px] text-emerald-600 font-medium">-0.4s speedup</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Content Fidelity Index</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">96.8%</p>
          <span className="text-[11px] text-slate-400 font-medium">Verified by dual engine</span>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Transformation Volume Area Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Weekly Transformation Volumes</h3>
              <p className="text-xs text-slate-400">Daily breakdowns of ingested content types</p>
            </div>
            <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">Last 7 Days</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeTrendData}>
                <defs>
                  <linearGradient id="colorTrans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} />
                <Area type="monotone" dataKey="transformations" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorTrans)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Output Types Bar Chart */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Most Popular Outputs</h3>
            <p className="text-xs text-slate-400">Total generated format count</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={outputTypesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Language Breakdown Pie Chart */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Output Language Distribution</h3>
            <p className="text-xs text-slate-400">Multilingual synthesis percentage</p>
          </div>

          <div className="h-60 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={languageData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {languageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fidelity Score Improvement Trend */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Content Fidelity Score Progression</h3>
            <p className="text-xs text-slate-400">Verifiable accuracy improvement over model updates</p>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fidelityTrendData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[90, 100]} stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
