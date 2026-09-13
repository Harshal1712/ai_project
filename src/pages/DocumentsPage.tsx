import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, Plus, Loader2 } from 'lucide-react';
import { ProjectItem } from '../types';
import { ContentIQApiClient } from '../services/api';

const DOCUMENT_TYPES = ['pdf', 'docx', 'text'];

export const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ContentIQApiClient.getProjects()
      .then(({ projects }) => setDocuments(projects.filter((p) => DOCUMENT_TYPES.includes(p.source.type))))
      .finally(() => setLoading(false));
  }, []);

  const filtered = documents.filter((d) => d.source.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Document Repository ({documents.length})</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Your uploaded and processed document sources</p>
        </div>
        <button onClick={() => navigate('/create', { state: { initialSourceType: 'pdf' } })} className="px-5 py-2.5 bg-brand-600 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-2">
          <Plus className="w-4 h-4" /><span>Upload Document</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search documents..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-brand-600" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-12">No documents uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((doc) => (
              <div key={doc.id} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/40 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 flex items-center justify-center font-bold text-xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{doc.source.name}</p>
                    <p className="text-[11px] text-slate-400">{doc.source.size || ''} • Uploaded {new Date(doc.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className={`font-semibold ${doc.status === 'Completed' ? 'text-emerald-600' : doc.status === 'Failed' ? 'text-rose-600' : 'text-amber-600'}`}>{doc.status}</span>
                  <button onClick={() => navigate(`/document-intelligence?projectId=${doc.id}`)} className="px-3 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded-lg text-[11px]">
                    Inspect Intelligence
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
