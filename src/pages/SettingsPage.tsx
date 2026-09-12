import React, { useState } from 'react';
import { Settings, User, Bot, Globe, Bell, Shield, Key, Save, Check } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [saved, setSaved] = useState(false);

  // Settings State
  const [selectedModel, setSelectedModel] = useState('gemini-pro');
  const [defaultAudience, setDefaultAudience] = useState('Executive');
  const [defaultTone, setDefaultTone] = useState('Professional');
  const [enableFactChecking, setEnableFactChecking] = useState(true);
  const [autoSaveExports, setAutoSaveExports] = useState(true);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            System & AI Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure default transformation defaults, AI model providers, and enterprise security.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-brand-600 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-2 hover:bg-brand-700 transition-colors"
        >
          {saved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          <span>{saved ? 'Settings Saved' : 'Save Changes'}</span>
        </button>
      </div>

      {/* AI Model Preferences */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Bot className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          AI Engine Provider Preferences
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { id: 'gemini-pro', name: 'Gemini 1.5 Pro (Recommended)', desc: '1M token context for long multimodal documents & videos', badge: 'Active' },
            { id: 'sonnet', name: 'Claude 3.5 Sonnet', desc: 'High accuracy structured JSON & slide creation', badge: 'Available' },
            { id: 'gpt-4o', name: 'GPT-4o Enterprise', desc: 'Omni multimodal processing for fast transcription', badge: 'Available' },
            { id: 'llama-3', name: 'Local Llama-3-70B (On-Prem)', desc: 'Air-gapped local model for maximum data privacy', badge: 'Self-Hosted' }
          ].map((m) => (
            <div
              key={m.id}
              onClick={() => setSelectedModel(m.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-1 ${
                selectedModel === m.id
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 ring-1 ring-brand-500/30'
                  : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-850/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white">{m.name}</span>
                <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                  {m.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Default Transformation Preferences */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-500" />
          Default Transformation Preferences
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">Default Target Audience</label>
            <select
              value={defaultAudience}
              onChange={(e) => setDefaultAudience(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850"
            >
              <option value="Executive">Executive</option>
              <option value="Technical Team">Technical Team</option>
              <option value="Employee">Employee</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">Default Output Tone</label>
            <select
              value={defaultTone}
              onChange={(e) => setDefaultTone(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850"
            >
              <option value="Professional">Professional</option>
              <option value="Technical">Technical</option>
              <option value="Simple">Simple</option>
            </select>
          </div>
        </div>
      </div>

      {/* Security & Verification Settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-500" />
          Governance & Security
        </h3>

        <div className="space-y-3 text-xs">
          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 cursor-pointer">
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Automated Fact & Meaning Check</p>
              <p className="text-[11px] text-slate-400">Run line-by-line semantic diff on every generated output</p>
            </div>
            <input
              type="checkbox"
              checked={enableFactChecking}
              onChange={(e) => setEnableFactChecking(e.target.checked)}
              className="w-4 h-4 accent-brand-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 cursor-pointer">
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Auto-Archive Projects</p>
              <p className="text-[11px] text-slate-400">Save completed slide decks & markdown outputs to workspace storage</p>
            </div>
            <input
              type="checkbox"
              checked={autoSaveExports}
              onChange={(e) => setAutoSaveExports(e.target.checked)}
              className="w-4 h-4 accent-brand-600 rounded"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
