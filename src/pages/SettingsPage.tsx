import React, { useEffect, useState } from 'react';
import { Bot, Globe, Shield, Save, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ContentIQApiClient, ApiError } from '../services/api';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [defaultAudience, setDefaultAudience] = useState('Executive');
  const [defaultTone, setDefaultTone] = useState('Professional');
  const [health, setHealth] = useState<{ aiModel: string; embeddingModel: string } | null>(null);

  useEffect(() => {
    ContentIQApiClient.getMe().then(({ user }) => {
      if (user.preferences?.defaultAudience) setDefaultAudience(user.preferences.defaultAudience);
      if (user.preferences?.defaultTone) setDefaultTone(user.preferences.defaultTone);
    });
    ContentIQApiClient.getHealthInfo().then(setHealth);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await ContentIQApiClient.updateMe({ preferences: { defaultAudience, defaultTone } });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Account & AI Settings</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Signed in as {user?.name} ({user?.email})</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 bg-brand-600 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-2 hover:bg-brand-700 transition-colors disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          <span>{saved ? 'Saved' : 'Save Changes'}</span>
        </button>
      </div>

      {error && <p className="text-xs text-rose-500">{error}</p>}

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2"><Bot className="w-4 h-4 text-brand-600 dark:text-brand-400" />AI Engine Configuration</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Configured server-side via environment variables — not user-switchable, to keep generation and embeddings consistent across your projects.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-850/30">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Generation Model</span>
            <span className="font-bold text-sm text-slate-900 dark:text-white">{health?.aiModel || 'Loading...'}</span>
          </div>
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-850/30">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Embedding Model</span>
            <span className="font-bold text-sm text-slate-900 dark:text-white">{health?.embeddingModel || 'Loading...'}</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2"><Globe className="w-4 h-4 text-indigo-500" />Default Transformation Preferences</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Used to prefill new transformations — you can still override them per project.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">Default Target Audience</label>
            <select value={defaultAudience} onChange={(e) => setDefaultAudience(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850">
              <option value="Executive">Executive</option>
              <option value="Technical Team">Technical Team</option>
              <option value="Student">Student</option>
              <option value="Employee">Employee</option>
              <option value="General Public">General Public</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">Default Output Tone</label>
            <select value={defaultTone} onChange={(e) => setDefaultTone(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850">
              <option value="Professional">Professional</option>
              <option value="Technical">Technical</option>
              <option value="Simple">Simple</option>
              <option value="Conversational">Conversational</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-500" />Security</h3>
        <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-disc list-inside">
          <li>Every project, source, and conversation is scoped to your account — other users cannot read, list, or delete your content.</li>
          <li>Passwords are hashed with bcrypt; sessions use short-lived signed JWTs.</li>
          <li>AI generation and Q&A endpoints are rate-limited per account to prevent abuse.</li>
          <li>Fact verification is available on-demand from any project's Results page and is not run automatically on every output.</li>
        </ul>
      </div>
    </div>
  );
};
