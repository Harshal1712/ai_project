import React, { useState } from 'react';
import { FileText, Download, Search, HardDrive, FileCheck, Eye, Plus } from 'lucide-react';
import { NavigationTab } from '../types';

interface DocumentsPageProps {
  setActiveTab: (tab: NavigationTab) => void;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({ setActiveTab }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const documents = [
    { id: 'd1', name: 'SIH26154_Enterprise_Content_Transformation_Spec.pdf', type: 'PDF', size: '4.2 MB', date: '2026-09-08', entities: 18, status: 'Indexed' },
    { id: 'd2', name: 'Q3_Enterprise_AI_Financial_Report.docx', type: 'DOCX', size: '2.8 MB', date: '2026-09-05', entities: 14, status: 'Indexed' },
    { id: 'd3', name: 'Multimodal_Speech_Recognition_Transcript.txt', type: 'Text', size: '890 KB', date: '2026-09-03', entities: 9, status: 'Indexed' },
    { id: 'd4', name: 'System_Architecture_Diagram.png', type: 'Image', size: '3.1 MB', date: '2026-08-29', entities: 6, status: 'OCR Processed' }
  ];

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Document Repository ({documents.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Multimodal source document store with pre-indexed entity vectors
          </p>
        </div>

        <button
          onClick={() => setActiveTab('create')}
          className="px-5 py-2.5 bg-brand-600 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/40 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 flex items-center justify-center font-bold text-xs">
                  {doc.type}
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{doc.name}</p>
                  <p className="text-[11px] text-slate-400">{doc.size} • Uploaded {doc.date}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">{doc.entities} Knowledge Entities</span>
                <button
                  onClick={() => setActiveTab('document-intelligence')}
                  className="px-3 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded-lg text-[11px]"
                >
                  Inspect Intelligence
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
