import React from 'react';

// Lightweight strength hint — the server only enforces the 8-character minimum.
function scorePassword(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(4, score);
}

const LEVELS = [
  { label: 'Too short', color: 'bg-rose-500' },
  { label: 'Weak', color: 'bg-rose-500' },
  { label: 'Fair', color: 'bg-amber-500' },
  { label: 'Good', color: 'bg-emerald-500' },
  { label: 'Strong', color: 'bg-emerald-600' },
];

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score = password.length < 8 ? 0 : scorePassword(password);
  const level = LEVELS[score];
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={`h-1 flex-1 rounded-full ${i <= score ? level.color : 'bg-slate-200 dark:bg-slate-700'}`} />
        ))}
      </div>
      <p className="text-[10px] text-slate-400">{level.label}</p>
    </div>
  );
}
