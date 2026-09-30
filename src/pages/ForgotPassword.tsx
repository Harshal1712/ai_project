import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, MailCheck } from 'lucide-react';
import { ContentIQApiClient, ApiError } from '../services/api';
import { AuthCard, AuthAlert, authInputClass, authButtonClass } from '../components/auth/AuthCard';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await ContentIQApiClient.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Forgot your password?" subtitle="Enter your account email and we'll send you a link to reset it.">
      {sent ? (
        <div className="space-y-4 text-center">
          <MailCheck className="w-10 h-10 text-emerald-500 mx-auto" />
          <p className="text-sm text-slate-600 dark:text-slate-300">
            If an account exists for <strong>{email}</strong>, a reset link is on its way. It expires in 60 minutes.
          </p>
          <p className="text-xs text-slate-400">Didn't get it? Check your spam folder or try again in a minute.</p>
          <button onClick={() => setSent(false)} className="text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline">
            Use a different email
          </button>
        </div>
      ) : (
        <>
          {error && <AuthAlert tone="error">{error}</AuthAlert>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={authInputClass} placeholder="you@company.com" />
            </div>
            <button type="submit" disabled={loading} className={authButtonClass}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Send reset link
            </button>
          </form>
        </>
      )}

      <p className="text-xs text-slate-500 text-center mt-5">
        Remembered it?{' '}
        <Link to="/login" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
