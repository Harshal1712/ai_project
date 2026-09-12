import React, { useState } from 'react';
import { 
  FileText, 
  Cpu, 
  Search, 
  Calendar, 
  TrendingUp, 
  User, 
  Building2, 
  BookOpen, 
  Tag, 
  CheckCircle2,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { MOCK_DOC_INTELLIGENCE } from '../data/mockData';

export const DocumentIntelligence: React.FC = () => {
  const [docData, setDocData] = useState(MOCK_DOC_INTELLIGENCE);
  const [selectedEntityCategory, setSelectedEntityCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const entityCategories = ['All', 'Person', 'Organization', 'Technical Term', 'Metric', 'Reference'];

  const filteredEntities = docData.entities.filter(e => {
    const matchesCategory = selectedEntityCategory === 'All' || e.category === selectedEntityCategory;
    const matchesQuery = e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.contextSnippet.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">
              Document Intelligence Engine
            </span>
            <span className="text-xs text-slate-400">SIH Entity & Knowledge Graph Extraction</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {docData.documentName}
          </h1>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span>Word Count: <strong className="text-slate-700 dark:text-slate-200">{docData.wordCount.toLocaleString()} words</strong></span>
          <span>•</span>
          <span>Est. Reading: <strong className="text-slate-700 dark:text-slate-200">{docData.readingTime}</strong></span>
        </div>
      </div>

      {/* Main Grid: AI Understanding Panel + Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: AI Understanding Summary Panel */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Metrics & Statistics Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Extracted Numbers & Metrics
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {docData.keyMetrics.map((m, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">{m.label}</span>
                  <p className="text-base font-extrabold text-brand-600 dark:text-brand-400">{m.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Key Topics Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-indigo-500" />
              Key Concepts & Topics
            </h3>

            <div className="flex flex-wrap gap-1.5">
              {docData.keyTopics.map((topic, idx) => (
                <span key={idx} className="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-medium text-xs border border-indigo-200/50 dark:border-indigo-800/40">
                  {topic}
                </span>
              ))}
            </div>
          </div>

          {/* Important Dates Timeline */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              Extracted Chronology & Dates
            </h3>

            <div className="space-y-2.5">
              {docData.importantDates.map((d, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-slate-100">{d.event}</span>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-semibold">
                    {d.date}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* References Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              Standards & Citation Index
            </h3>

            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              {docData.references.map((ref, idx) => (
                <li key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex items-start gap-2">
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{ref}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Right Column: Named Entity Extraction & Context Viewer */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  AI Understanding — Extracted Entity Graph
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Showing {filteredEntities.length} extracted entities with context snippets
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                {entityCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedEntityCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedEntityCategory === cat
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Entity Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search extracted entities or context snippets..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Entity List Cards */}
            <div className="space-y-3">
              {filteredEntities.map((ent) => (
                <div key={ent.id} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/40 hover:border-brand-300 dark:hover:border-brand-800 transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{ent.name}</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                        {ent.category}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-slate-400">Mentioned {ent.frequency}x</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    "{ent.contextSnippet}"
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
