import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Sparkles, ShieldCheck, Cpu } from 'lucide-react';
import { SourceContent, TransformationConfig, OutputType } from '../types';

interface ProcessingScreenProps {
  source: SourceContent;
  config: TransformationConfig;
  selectedOutputs: OutputType[];
  onComplete: () => void;
}

export const ProcessingScreen: React.FC<ProcessingScreenProps> = ({
  source,
  config,
  selectedOutputs,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { label: 'Source uploaded', desc: `Ingested ${source.name} (${source.type.toUpperCase()})` },
    { label: 'Extracting content', desc: 'Parsing raw text, audio transcripts, and document tables' },
    { label: 'Understanding context', desc: `Targeting ${config.audience} audience in ${config.language}` },
    { label: 'Detecting important information', desc: 'Extracting key metrics, dates, and named entities' },
    { label: 'Generating requested outputs', desc: `Synthesizing ${selectedOutputs.length} tailored output formats` },
    { label: 'Verifying factual consistency', desc: 'Running semantic diff audit line-by-line (Fidelity Target: 96%)' },
    { label: 'Finalizing results', desc: 'Preparing interactive slide decks, quizzes, and exports' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          setTimeout(() => {
            onComplete();
          }, 800);
          return prev;
        }
      });
    }, 1100);

    return () => clearInterval(timer);
  }, []);

  const progressPercentage = Math.round(((currentStep + 1) / steps.length) * 100);

  return (
    <div className="max-w-2xl mx-auto py-16 px-4 space-y-8 animate-in fade-in zoom-in-95 duration-200">
      {/* Central Indicator Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 shadow-xl text-center space-y-6 relative overflow-hidden">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 flex items-center justify-center mx-auto shadow-lg shadow-brand-500/20 animate-ai-pulse">
          <Sparkles className="w-10 h-10 text-white animate-spin-slow" />
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            AI Engine Transforming Content...
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            ContentIQ Neural Engine v2.6 is analyzing <span className="font-semibold text-slate-700 dark:text-slate-200">{source.name}</span> and synthesizing {selectedOutputs.length} outputs.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 max-w-md mx-auto">
          <div className="flex justify-between text-xs font-semibold text-slate-500">
            <span>Overall Progress</span>
            <span className="text-brand-600 dark:text-brand-400">{progressPercentage}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-brand-600 to-purple-600 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* AI Pipeline Timeline */}
        <div className="text-left space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/80 max-w-md mx-auto">
          {steps.map((step, idx) => {
            const isDone = idx < currentStep;
            const isCurrent = idx === currentStep;
            const isPending = idx > currentStep;

            return (
              <div key={idx} className="flex items-start gap-3 text-xs">
                <div className="mt-0.5 shrink-0">
                  {isDone && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                  {isCurrent && (
                    <Loader2 className="w-4 h-4 text-brand-600 dark:text-brand-400 animate-spin" />
                  )}
                  {isPending && (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-200 dark:border-slate-700"></div>
                  )}
                </div>

                <div className="flex-1">
                  <p className={`font-semibold ${
                    isDone 
                      ? 'text-slate-700 dark:text-slate-300' 
                      : isCurrent 
                      ? 'text-brand-600 dark:text-brand-400 font-bold' 
                      : 'text-slate-400 dark:text-slate-600'
                  }`}>
                    {step.label}
                  </p>
                  {isCurrent && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 animate-pulse">
                      {step.desc}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
