import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Plus, FileText, Video, Layers, ArrowRight, Youtube, Presentation, GraduationCap, HelpCircle, FileQuestion,
  CheckCircle2, FileCheck, ShieldCheck, Loader2, Clock
} from 'lucide-react';
import { ProjectItem, SourceType } from '../types';
import { ContentIQApiClient } from '../services/api';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [metrics, setMetrics] = useState<{ totalTransformations: number; documentsProcessed: number; videosSummarized: number; aiOutputsGenerated: number; contentFidelityScore: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([ContentIQApiClient.getProjects(), ContentIQApiClient.getMyAnalytics()])
      .then(([projRes, analyticsRes]) => {
        setProjects(projRes.projects.slice(0, 8));
        setMetrics(analyticsRes.metrics);
      })
      .finally(() => setLoading(false));
  }, []);

  const getSourceIcon = (type: SourceType) => {
    switch (type) {
      case 'youtube': return <Youtube className="w-4 h-4 text-red-500" />;
      case 'video': return <Video className="w-4 h-4 text-purple-500" />;
      case 'pdf': case 'docx': return <FileText className="w-4 h-4 text-blue-500" />;
      default: return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  const stats = [
    { label: 'Total Transformations', value: metrics?.totalTransformations ?? 0, icon: Layers, color: 'text-brand-600 bg-brand-50 dark:bg-brand-950/60' },
    { label: 'Documents Processed', value: metrics?.documentsProcessed ?? 0, icon: FileCheck, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60' },
    { label: 'Videos Summarized', value: metrics?.videosSummarized ?? 0, icon: Video, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60' },
    { label: 'AI Outputs Generated', value: metrics?.aiOutputsGenerated ?? 0, icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60' },
  ];

  const quickActions = [
    { id: 'doc', title: 'Summarize Document', desc: 'PDF, DOCX, or text files', icon: FileText, color: 'hover:border-blue-500/50 hover:bg-blue-50/20 dark:hover:bg-blue-950/20', sourceType: 'pdf' as SourceType, outputs: undefined },
    { id: 'youtube', title: 'Summarize YouTube Video', desc: 'Paste video link for chapters & Q&A', icon: Youtube, color: 'hover:border-red-500/50 hover:bg-red-50/20 dark:hover:bg-red-950/20', sourceType: 'youtube' as SourceType, outputs: undefined },
    { id: 'ppt', title: 'Generate Presentation', desc: 'Create a 5-8 slide PPT deck', icon: Presentation, color: 'hover:border-purple-500/50 hover:bg-purple-50/20 dark:hover:bg-purple-950/20', sourceType: 'pdf' as SourceType, outputs: ['Presentation / PPT'] },
    { id: 'training', title: 'Create Training Material', desc: 'Employee guides & SOPs', icon: GraduationCap, color: 'hover:border-emerald-500/50 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20', sourceType: 'pdf' as SourceType, outputs: ['Training Material'] },
    { id: 'faq', title: 'Generate FAQ', desc: 'Q&A pairs from complex sources', icon: HelpCircle, color: 'hover:border-amber-500/50 hover:bg-amber-50/20 dark:hover:bg-amber-950/20', sourceType: 'pdf' as SourceType, outputs: ['FAQ'] },
    { id: 'quiz', title: 'Generate Quiz', desc: 'Assessment MCQs with explanations', icon: FileQuestion, color: 'hover:border-indigo-500/50 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20', sourceType: 'pdf' as SourceType, outputs: ['MCQs / Quiz'] },
  ];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-200">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-brand-950 p-8 sm:p-10 text-white shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /><span>Multimodal AI Content Intelligence Platform</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">Transform any content into grounded knowledge.</h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Upload a document, video, audio file, or YouTube link and ask questions grounded in the real extracted content — with citations you can trust.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button onClick={() => navigate('/create')} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-2xl shadow-lg shadow-brand-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all">
              <Plus className="w-5 h-5" /><span>+ New Transformation</span>
            </button>
            <button onClick={() => navigate('/projects')} className="flex items-center gap-2 px-5 py-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-200 font-medium text-sm rounded-2xl transition-all">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /><span>View My Projects</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow transition-all space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{stat.label}</span>
                <div className={`p-2 rounded-xl ${stat.color}`}><Icon className="w-5 h-5" /></div>
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{loading ? '—' : stat.value.toLocaleString()}</span>
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Quick Transformation Actions</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Launch a tailored transformation workflow in one click</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => navigate('/create', { state: { initialSourceType: action.sourceType, initialOutputs: action.outputs } })}
                className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-left transition-all duration-150 flex items-start gap-4 group shadow-sm ${action.color}`}
              >
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:scale-105 transition-transform shrink-0"><Icon className="w-6 h-6 text-slate-700 dark:text-slate-200" /></div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{action.title}</h3>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{action.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Projects & Outputs</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage and inspect past content transformations</p>
          </div>
          <button onClick={() => navigate('/projects')} className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"><span>View all projects</span><ArrowRight className="w-3.5 h-3.5" /></button>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-brand-600" /></div>
          ) : projects.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-12">No projects yet — start your first transformation above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-5">Project Name</th><th className="py-3.5 px-4">Source Type</th><th className="py-3.5 px-4">Outputs</th><th className="py-3.5 px-4">Created</th><th className="py-3.5 px-4">Status</th><th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {projects.map((proj) => (
                    <tr key={proj.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-850/50 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">{getSourceIcon(proj.source.type)}</div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100 hover:text-brand-600 cursor-pointer" onClick={() => navigate(`/projects/${proj.id}`)}>{proj.name}</p>
                            <p className="text-[11px] text-slate-400 truncate max-w-xs">{proj.source.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium capitalize">{getSourceIcon(proj.source.type)}{proj.source.type}</span></td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {proj.selectedOutputTypes.slice(0, 3).map((out, idx) => <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200/50 dark:border-brand-800/40">{out}</span>)}
                          {proj.selectedOutputTypes.length > 3 && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">+{proj.selectedOutputTypes.length - 3} more</span>}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-500 dark:text-slate-400"><div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" />{new Date(proj.createdAt).toLocaleDateString()}</div></td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${proj.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : proj.status === 'Failed' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'}`}>
                          {proj.status === 'Completed' && <CheckCircle2 className="w-3.5 h-3.5" />}{proj.status}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right"><button onClick={() => navigate(`/projects/${proj.id}`)} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-brand-600 hover:text-white dark:hover:bg-brand-600 text-slate-700 dark:text-slate-200 font-semibold rounded-lg transition-colors">Open Workspace</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
