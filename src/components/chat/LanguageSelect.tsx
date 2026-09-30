import React, { useEffect, useState } from 'react';
import { Languages } from 'lucide-react';
import { ContentIQApiClient } from '../../services/api';

const FALLBACK_LANGUAGES = ['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Spanish', 'French', 'German'];

let cachedLanguages: string[] | null = null;

// Loads the server's supported language list once per page load.
export function useLanguages(): string[] {
  const [languages, setLanguages] = useState<string[]>(cachedLanguages ?? FALLBACK_LANGUAGES);
  useEffect(() => {
    if (cachedLanguages) return;
    ContentIQApiClient.getLanguages()
      .then(({ languages }) => {
        cachedLanguages = languages;
        setLanguages(languages);
      })
      .catch(() => {});
  }, []);
  return languages;
}

export function LanguageSelect({
  value,
  onChange,
  includeAuto = true,
  className = '',
  title = 'Answer language',
}: {
  value: string;
  onChange: (language: string) => void;
  includeAuto?: boolean;
  className?: string;
  title?: string;
}) {
  const languages = useLanguages();
  return (
    <label className={`inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 ${className}`} title={title}>
      <Languages className="w-3.5 h-3.5 shrink-0" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1 text-[10px] font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
      >
        {includeAuto && <option value="Auto">Auto (match question)</option>}
        {languages.map((l) => (
          <option key={l} value={l}>{l}</option>
        ))}
      </select>
    </label>
  );
}
