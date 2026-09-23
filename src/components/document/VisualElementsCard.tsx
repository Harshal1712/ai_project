import React, { useState } from 'react';
import { BarChart3, Table2, Workflow, Image as ImageIcon, LayoutGrid, Shapes, ScanText } from 'lucide-react';
import { VisualElement } from '../../types';

const KIND_META: Record<VisualElement['kind'], { label: string; icon: React.ElementType; tone: string }> = {
  chart: { label: 'Chart', icon: BarChart3, tone: 'text-brand-600 bg-brand-50 dark:bg-brand-950/50' },
  table: { label: 'Table', icon: Table2, tone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50' },
  diagram: { label: 'Diagram', icon: Workflow, tone: 'text-purple-600 bg-purple-50 dark:bg-purple-950/50' },
  image: { label: 'Image', icon: ImageIcon, tone: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50' },
  infographic: { label: 'Infographic', icon: LayoutGrid, tone: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50' },
  other: { label: 'Figure', icon: Shapes, tone: 'text-slate-600 bg-slate-100 dark:bg-slate-800' },
};

// Charts, tables, and figures Gemini found inside the PDF. Their descriptions
// are embedded alongside the text, so they're also answerable in Q&A.
export function VisualElementsCard({ elements, ocrUsed }: { elements: VisualElement[]; ocrUsed?: boolean }) {
  const [filter, setFilter] = useState<'all' | VisualElement['kind']>('all');
  const kinds = [...new Set(elements.map((e) => e.kind))];
  const shown = filter === 'all' ? elements : elements.filter((e) => e.kind === filter);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-600 dark:text-brand-400" />Visual Understanding — Charts, Tables & Figures
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {elements.length} visual element{elements.length === 1 ? '' : 's'} read by Gemini's multimodal model. They're searchable in Q&A with page citations.
          </p>
        </div>
        {kinds.length > 1 && (
          <div className="flex gap-1 flex-wrap">
            {(['all', ...kinds] as const).map((k) => (
              <button key={k} onClick={() => setFilter(k)} className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${filter === k ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                {k === 'all' ? 'All' : KIND_META[k].label}
              </button>
            ))}
          </div>
        )}
      </div>

      {ocrUsed && (
        <p className="text-[11px] px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
          <ScanText className="w-3.5 h-3.5 shrink-0" />
          This PDF had no text layer (scanned), so its text was read with AI OCR. Double-check exact figures against the original.
        </p>
      )}

      {elements.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-6">No charts, tables, or figures were detected in this document.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {shown.map((el, i) => {
            const meta = KIND_META[el.kind] ?? KIND_META.other;
            const Icon = meta.icon;
            return (
              <div key={i} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/40 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`p-1.5 rounded-lg shrink-0 ${meta.tone}`}><Icon className="w-3.5 h-3.5" /></span>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{el.title}</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">Page {el.page}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{el.description}</p>
                {el.keyData.length > 0 && (
                  <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 pl-1">
                    {el.keyData.slice(0, 8).map((d, j) => (
                      <li key={j} className="flex gap-1.5"><span className="text-brand-500">•</span><span>{d}</span></li>
                    ))}
                    {el.keyData.length > 8 && <li className="text-slate-400">+{el.keyData.length - 8} more</li>}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
