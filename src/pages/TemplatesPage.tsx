import React from 'react';
import { LayoutTemplate, Briefcase, Award, GraduationCap, Share2, ArrowRight } from 'lucide-react';
import { MOCK_TEMPLATES } from '../data/mockData';
import { NavigationTab, TransformationTemplate } from '../types';

interface TemplatesPageProps {
  setActiveTab: (tab: NavigationTab) => void;
  onUseTemplate: (tpl: TransformationTemplate) => void;
}

export const TemplatesPage: React.FC<TemplatesPageProps> = ({
  setActiveTab,
  onUseTemplate
}) => {
  const getIcon = (name: string) => {
    switch (name) {
      case 'Briefcase': return <Briefcase className="w-6 h-6 text-brand-600" />;
      case 'Award': return <Award className="w-6 h-6 text-amber-500" />;
      case 'GraduationCap': return <GraduationCap className="w-6 h-6 text-emerald-500" />;
      default: return <Share2 className="w-6 h-6 text-purple-500" />;
    }
  };

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Transformation Recipe Templates
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Pre-configured enterprise workflows designed for C-suite briefings, pitch decks, and employee onboarding.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MOCK_TEMPLATES.map((tpl) => (
          <div key={tpl.id} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800">
                  {getIcon(tpl.iconName)}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{tpl.name}</h3>
                  <p className="text-[11px] text-slate-400">Popular for: {tpl.popularFor}</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {tpl.description}
              </p>

              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Pre-Configured Outputs ({tpl.outputTypes.length}):</span>
                <div className="flex flex-wrap gap-1">
                  {tpl.outputTypes.map((out, idx) => (
                    <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                      {out}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">{tpl.targetAudience} • {tpl.tone}</span>
              <button
                onClick={() => onUseTemplate(tpl)}
                className="px-4 py-2 bg-brand-600 text-white font-semibold text-xs rounded-xl hover:bg-brand-700 transition-colors flex items-center gap-1.5"
              >
                <span>Use Recipe</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
