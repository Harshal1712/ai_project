import React, { useState } from 'react';
import { 
  Search, 
  FolderKanban, 
  Plus, 
  FileText, 
  Video, 
  Youtube, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Filter,
  Grid,
  List as ListIcon,
  RefreshCw,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { ProjectItem, NavigationTab, SourceType } from '../types';

interface MyProjectsProps {
  projects: ProjectItem[];
  onOpenProject: (proj: ProjectItem) => void;
  setActiveTab: (tab: NavigationTab) => void;
  onDeleteProject: (id: string) => void;
}

export const MyProjects: React.FC<MyProjectsProps> = ({
  projects,
  onOpenProject,
  setActiveTab,
  onDeleteProject
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.source.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = sourceFilter === 'all' || p.source.type === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const getSourceIcon = (type: SourceType) => {
    switch (type) {
      case 'youtube': return <Youtube className="w-4 h-4 text-red-500" />;
      case 'video': return <Video className="w-4 h-4 text-purple-500" />;
      default: return <FileText className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            My Projects ({projects.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage, re-configure, and inspect past content transformations
          </p>
        </div>

        <button
          onClick={() => setActiveTab('create')}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-semibold text-xs rounded-xl shadow-md hover:shadow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ New Transformation</span>
        </button>
      </div>

      {/* Filter & View Switcher Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects by name or source file..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Filters & View Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium">Source:</span>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-xs font-semibold focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="pdf">PDF / DOCX</option>
              <option value="youtube">YouTube Video</option>
              <option value="video">Uploaded Video</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-slate-500 ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-2xs' : ''}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-slate-500 ${viewMode === 'table' ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-2xs' : ''}`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((proj) => (
            <div 
              key={proj.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold capitalize">
                    {getSourceIcon(proj.source.type)}
                    {proj.source.type}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {proj.verification?.fidelityScore || 96}%
                  </span>
                </div>

                <div>
                  <h3 
                    onClick={() => onOpenProject(proj)}
                    className="font-bold text-base text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 cursor-pointer transition-colors"
                  >
                    {proj.name}
                  </h3>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{proj.source.name}</p>
                </div>

                <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Audience: <strong>{proj.config.audience}</strong></span>
                    <span>Language: <strong>{proj.config.language}</strong></span>
                  </div>
                </div>

                {/* Output Badges */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {proj.selectedOutputTypes.slice(0, 4).map((out, idx) => (
                    <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                      {out}
                    </span>
                  ))}
                  {proj.selectedOutputTypes.length > 4 && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                      +{proj.selectedOutputTypes.length - 4}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">{proj.createdAt}</span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onDeleteProject(proj.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onOpenProject(proj)}
                    className="px-3 py-1.5 bg-brand-600 text-white font-semibold text-xs rounded-xl hover:bg-brand-700 transition-colors flex items-center gap-1"
                  >
                    <span>Open</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850/60 border-b border-slate-200/80 dark:border-slate-800 font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-5">Project</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4">Audience / Tone</th>
                <th className="py-3.5 px-4">Outputs</th>
                <th className="py-3.5 px-4">Created</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredProjects.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-850/50">
                  <td className="py-4 px-5 font-bold text-slate-900 dark:text-white">{p.name}</td>
                  <td className="py-4 px-4 text-slate-600 dark:text-slate-300">{p.source.name}</td>
                  <td className="py-4 px-4 text-slate-600 dark:text-slate-300">{p.config.audience} • {p.config.tone}</td>
                  <td className="py-4 px-4 font-semibold text-brand-600">{p.selectedOutputTypes.length} Formats</td>
                  <td className="py-4 px-4 text-slate-400">{p.createdAt}</td>
                  <td className="py-4 px-5 text-right">
                    <button onClick={() => onOpenProject(p)} className="px-3 py-1.5 bg-brand-600 text-white font-semibold rounded-lg">Open</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
