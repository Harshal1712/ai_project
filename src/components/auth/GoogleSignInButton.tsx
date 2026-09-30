import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ContentIQApiClient, ApiError } from '../../services/api';

const GOOGLE_CLIENT_ID: string | undefined = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

declare global {
  interface Window {
    google?: any;
  }
}

let gsiScriptPromise: Promise<void> | null = null;

function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!gsiScriptPromise) {
    gsiScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GSI_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        gsiScriptPromise = null;
        reject(new Error('Could not load Google sign-in.'));
      };
      document.head.appendChild(script);
    });
  }
  return gsiScriptPromise;
}

export function isGoogleSignInEnabled(): boolean {
  return !!GOOGLE_CLIENT_ID;
}

// Renders Google's official "Sign in with Google" button (Google Identity
// Services). Google returns a signed ID token, which the backend verifies
// before issuing our own session JWT. Renders nothing when no client ID is configured.
export function GoogleSignInButton({ onError, text = 'continue_with' }: { onError: (message: string | null) => void; text?: 'signin_with' | 'signup_with' | 'continue_with' }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [submitting, setSubmitting] = useState(false);

  // Keep the latest callbacks without re-initializing Google's button on every render.
  const handlersRef = useRef({ login, navigate, onError });
  handlersRef.current = { login, navigate, onError };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;

    loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response: { credential?: string }) => {
            const { login, navigate, onError } = handlersRef.current;
            if (!response.credential) {
              onError('Google sign-in was cancelled.');
              return;
            }
            onError(null);
            setSubmitting(true);
            try {
              const res = await ContentIQApiClient.loginWithGoogle(response.credential);
              login(res.token, res.user);
              navigate('/dashboard');
            } catch (err) {
              onError(err instanceof ApiError ? err.message : 'Google sign-in failed. Please try again.');
            } finally {
              setSubmitting(false);
            }
          },
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: document.documentElement.classList.contains('dark') ? 'filled_black' : 'outline',
          size: 'large',
          shape: 'pill',
          text,
          width: containerRef.current.offsetWidth || 320,
        });
      })
      .catch((err) => handlersRef.current.onError(err.message));

    return () => {
      cancelled = true;
    };
  }, [text]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-[11px] text-slate-400">
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        or
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className={`flex justify-center transition-opacity ${submitting ? 'opacity-50 pointer-events-none' : ''}`}>
        <div ref={containerRef} className="w-full flex justify-center min-h-[44px]" />
      </div>
    </div>
  );
}
