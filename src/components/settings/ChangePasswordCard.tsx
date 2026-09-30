import React, { useState } from 'react';
import { KeyRound, Loader2, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ContentIQApiClient, ApiError } from '../../services/api';
import { PasswordStrength } from '../auth/PasswordStrength';

const inputClass = 'w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/40';

// Google-only accounts have no password yet, so they "set" one without
// entering a current password; everyone else must confirm the current one.
export function ChangePasswordCard({ hasPassword }: { hasPassword: boolean }) {
  const { updateUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (newPassword.length < 8) return setError('New password must be at least 8 characters.');
    if (newPassword !== confirm) return setError('New passwords do not match.');

    setSaving(true);
    try {
      const { user } = await ContentIQApiClient.changePassword(hasPassword ? currentPassword : undefined, newPassword);
      updateUser({ hasPassword: user.hasPassword });
      setSuccess(hasPassword ? 'Password updated.' : 'Password set — you can now also sign in with your email and password.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
      <div>
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-amber-500" />
          {hasPassword ? 'Change Password' : 'Set a Password'}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {hasPassword
            ? 'Enter your current password, then choose a new one.'
            : 'Your account uses Google sign-in. Add a password to also sign in with your email.'}
        </p>
      </div>

      {error && <p className="text-xs text-rose-500">{error}</p>}
      {success && <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><Check className="w-3.5 h-3.5" />{success}</p>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        {hasPassword && (
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">Current password</label>
            <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} autoComplete="current-password" />
          </div>
        )}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-700 dark:text-slate-300">New password</label>
          <input type="password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} autoComplete="new-password" />
          <PasswordStrength password={newPassword} />
        </div>
        <div className="space-y-1.5">
          <label className="font-bold text-slate-700 dark:text-slate-300">Confirm new password</label>
          <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} autoComplete="new-password" />
        </div>
        <div className="sm:col-span-3 flex justify-end">
          <button type="submit" disabled={saving} className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-xl flex items-center gap-2 disabled:opacity-60">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {hasPassword ? 'Update password' : 'Set password'}
          </button>
        </div>
      </form>
    </div>
  );
}
