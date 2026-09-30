import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { AuthenticatedRequest } from './auth.js';

// Keyed by user ID when authenticated, falling back to IP — protects the
// expensive AI-backed routes (generation, Q&A, uploads, YouTube processing).
export const aiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req as AuthenticatedRequest).user?.userId || req.ip || 'unknown',
  message: { error: 'Too many requests to this endpoint. Please slow down and try again shortly.' },
});

// Tighter, IP-keyed limit for credential endpoints (login, password reset,
// Google sign-in) to slow down brute-force and email-flooding attempts.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
});
