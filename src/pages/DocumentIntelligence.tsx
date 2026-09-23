import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Cpu, Search, Calendar, TrendingUp, BookOpen, Tag, ExternalLink, Loader2, FileText } from 'lucide-react';
import { DocumentIntelligenceData, ProjectItem } from '../types';
import { ContentIQApiClient, ApiError } from '../services/api';
import { VisualElementsCard } from '../components/document/VisualElementsCard';

const DOCUMENT_TYPES = ['pdf', 'docx', 'text'];

export const DocumentIntelligence: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get('projectId');

  const [docData, setDocData] = useState<DocumentIntelligenceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidateProjects, setCandidateProjects] = useState<ProjectItem[]>([]);
  const [selectedEntityCategory, setSelectedEntityCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (projectId) {
      setLoading(true);
      setError(null);
      ContentIQApiClient.getProject(projectId)
        .then(({ project }) => {
          if (!project.documentData) {
            setError('This project has no document intelligence data (it may not be a document source, or is still processing).');
          } else {
            setDocData(project.documentData);
          }
        })
        .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load document intelligence.'))
        .finally(() => setLoading(false));
    } else {
      ContentIQApiClient.getProjects().then(({ projects }) => {
        setCandidateProjects(projects.filter((p) => DOCUMENT_TYPES.includes(p.source.type) && p.status === 'Completed'));
      });
    }
  }, [projectId]);

  const entityCategories = ['All', 'Person', 'Organization', 'Technical Term', 'Metric', 'Date', 'Reference'];
  const filteredEntities = (docData?.entities || []).filter((e) => {
    const matchesCategory = selectedEntityCategory === 'All' || e.category === selectedEntityCategory;
    const matchesQuery = e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.contextSnippet.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  if (!projectId) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Document Intelligence</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Choose a document project to view its extracted topics, dates, metrics, and entities.</p>
        </div>
        {candidateProjects.length === 0 ? (
          <p className="text-sm text-slate-400">No completed document projects yet — create one first.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {candidateProjects.map((p) => (
              <button key={p.id} onClick={() => setSearchParams({ projectId: p.id })} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-left hover:border-brand-400 transition-colors flex items-center gap-3">
                <FileText className="w-5 h-5 text-brand-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{p.name}</p>
                  <p className="text-xs text-slate-400 truncate">{p.source.name}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-brand-600" /></div>;
  }

  if (error || !docData) {
    return (
      <div className="max-w-lg mx-auto text-center py-24 space-y-3">
        <p className="text-sm text-slate-500">{error}</p>
        <button onClick={() => navigate('/document-intelligence')} className="text-xs font-semibold text-brand-600 hover:underline">Choose a different project</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">Document Intelligence Engine</span>
            <span className="text-xs text-slate-400">Real entity & knowledge extraction</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{docData.documentName}</h1>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span>Word Count: <strong className="text-slate-700 dark:text-slate-200">{docData.wordCount.toLocaleString()} words</strong></span>
          <span>•</span>
          <span>Est. Reading: <strong className="text-slate-700 dark:text-slate-200">{docData.readingTime}</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500" />Extracted Numbers & Metrics</h3>
            {docData.keyMetrics.length === 0 ? <p className="text-xs text-slate-400">No numeric metrics detected.</p> : (
              <div className="grid grid-cols-2 gap-3">
                {docData.keyMetrics.map((m, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">{m.label}</span>
                    <p className="text-base font-extrabold text-brand-600 dark:text-brand-400">{m.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2"><Tag className="w-4 h-4 text-indigo-500" />Key Concepts & Topics</h3>
            <div className="flex flex-wrap gap-1.5">
              {docData.keyTopics.map((topic, idx) => (
                <span key={idx} className="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-medium text-xs border border-indigo-200/50 dark:border-indigo-800/40">{topic}</span>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2"><Calendar className="w-4 h-4 text-amber-500" />Extracted Chronology & Dates</h3>
            {docData.importantDates.length === 0 ? <p className="text-xs text-slate-400">No dates detected.</p> : (
              <div className="space-y-2.5">
                {docData.importantDates.map((d, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{d.event}</span>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-semibold">{d.date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-500" />Standards & Citation Index</h3>
            {docData.references.length === 0 ? <p className="text-xs text-slate-400">No external references detected.</p> : (
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                {docData.references.map((ref, idx) => (
                  <li key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex items-start gap-2">
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" /><span>{ref}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2"><Cpu className="w-5 h-5 text-brand-600 dark:text-brand-400" />AI Understanding — Extracted Entity Graph</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Showing {filteredEntities.length} extracted entities with context snippets</p>
              </div>
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                {entityCategories.map((cat) => (
                  <button key={cat} onClick={() => setSelectedEntityCategory(cat)} className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${selectedEntityCategory === cat ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'}`}>{cat}</button>
                ))}
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search extracted entities or context snippets..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>

            <div className="space-y-3">
              {filteredEntities.length === 0 ? <p className="text-xs text-slate-400 text-center py-8">No entities match this filter.</p> : filteredEntities.map((ent) => (
                <div key={ent.id} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/40 hover:border-brand-300 dark:hover:border-brand-800 transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{ent.name}</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">{ent.category}</span>
                    </div>
                    <span className="text-xs font-medium text-slate-400">Mentioned {ent.frequency}x</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">"{ent.contextSnippet}"</p>
                </div>
              ))}
            </div>
          </div>

          {docData.visualElements && (
            <VisualElementsCard elements={docData.visualElements} ocrUsed={docData.ocrUsed} />
          )}
        </div>
      </div>
    </div>
  );
};
