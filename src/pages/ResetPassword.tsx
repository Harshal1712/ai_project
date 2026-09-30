import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ContentIQApiClient, ApiError } from '../services/api';
import { AuthCard, AuthAlert, authInputClass, authButtonClass } from '../components/auth/AuthCard';
import { PasswordStrength } from '../components/auth/PasswordStrength';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { login } = useAuth();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    if (!token) return setError('This reset link is missing its token.');

    setLoading(true);
    try {
      const res = await ContentIQApiClient.resetPassword(token, password);
      login(res.token, res.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reset your password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthCard title="Invalid reset link" subtitle="This link is missing its reset token.">
        <Link to="/forgot-password" className={authButtonClass}>Request a new link</Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password" subtitle="You'll be signed in right after it's saved.">
      {error && (
        <AuthAlert tone="error">
          {error}{' '}
          {/expired|invalid/i.test(error) && (
            <Link to="/forgot-password" className="underline font-medium">Request a new link</Link>
          )}
        </AuthAlert>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">New password</label>
          <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={authInputClass} placeholder="At least 8 characters" autoComplete="new-password" />
          <PasswordStrength password={password} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Confirm new password</label>
          <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className={authInputClass} autoComplete="new-password" />
        </div>
        <button type="submit" disabled={loading} className={authButtonClass}>
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Reset password
        </button>
      </form>
    </AuthCard>
  );
}
