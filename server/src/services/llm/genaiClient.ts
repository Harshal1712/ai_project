import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env.js';

// Single shared client for both the LLM (generateContent) and embedding
// (embedContent) calls, plus the Files API used for video/audio understanding.
export const genai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

// Gemini's free tier caps generateContent as low as 5 requests/minute per
// model — comfortably exceeded by a single transformation firing several
// generation calls in parallel (summary, PPT, MCQs, document intelligence...).
// This proactively paces calls through a sliding-window limiter instead of
// only reacting to 429s after the fact, which is both more reliable and
// friendlier to the quota than bursting-then-backing-off.
class SlidingWindowRateLimiter {
  private callTimestamps: number[] = [];
  constructor(private maxCalls: number, private windowMs: number) {}

  async acquire(): Promise<void> {
    for (;;) {
      const now = Date.now();
      this.callTimestamps = this.callTimestamps.filter((t) => now - t < this.windowMs);
      if (this.callTimestamps.length < this.maxCalls) {
        this.callTimestamps.push(now);
        return;
      }
      const waitMs = this.windowMs - (now - this.callTimestamps[0]) + 100;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
}

// Deliberately conservative default — comfortably under the free tier's 5
// RPM ceiling for generateContent. Raise GEMINI_GENERATION_RPM once on a
// paid tier with higher quota.
export const generationLimiter = new SlidingWindowRateLimiter(env.GEMINI_GENERATION_RPM, 60_000);

function parseRetryDelayMs(err: any): number | null {
  const message = String(err?.message ?? '');
  const match = message.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/);
  if (match) return Math.ceil(parseFloat(match[1]) * 1000);
  return null;
}

class TimeoutError extends Error {}

// Never trust a third-party SDK's own timeout/retry defaults to actually
// bound a call in practice — observed live during testing: a generateContent
// call hung indefinitely (7+ minutes, no error, no response) with no
// visible cause. This guarantees every call either resolves or rejects
// within REQUEST_TIMEOUT_MS so a background job can never hang forever.
const REQUEST_TIMEOUT_MS = 90_000;

async function withTimeout<T>(fn: () => Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(`Gemini request timed out after ${REQUEST_TIMEOUT_MS}ms`)), REQUEST_TIMEOUT_MS);
  });
  try {
    return await Promise.race([fn(), timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

// Bounds a single await (used between streamed chunks, where the overall
// request timeout doesn't apply because the stream may legitimately run long).
export async function withIdleTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(message)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

// Every structured/text call routes through this so 429s/timeouts back off
// using the server's own suggested retry delay when it provides one,
// instead of a blind exponential guess.
export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 5): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await withTimeout(fn);
    } catch (err: any) {
      lastError = err;
      const status = err?.status ?? err?.code;
      const isRateLimited = status === 429 || /RESOURCE_EXHAUSTED/i.test(String(err?.message ?? ''));
      const isTimeout = err instanceof TimeoutError;
      const isTransient = status === 503 || status === 500;

      if ((isRateLimited || isTransient || isTimeout) && attempt < maxRetries) {
        const suggested = isRateLimited ? parseRetryDelayMs(err) : null;
        const delayMs = suggested ?? Math.min(2000 * 2 ** attempt, 60_000);
        await new Promise((resolve) => setTimeout(resolve, delayMs + Math.random() * 500));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

// Wraps a Gemini generateContent call with both the proactive rate limiter
// and the reactive retry/timeout — use this (not a bare withRetry) for
// every generateContent call so concurrent output generation naturally
// paces itself instead of bursting past the quota.
export async function callGenerateContent<T>(fn: () => Promise<T>): Promise<T> {
  return withRetry(async () => {
    await generationLimiter.acquire();
    return fn();
  });
}
