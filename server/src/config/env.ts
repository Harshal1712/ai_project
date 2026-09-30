import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required (MongoDB Atlas connection string)'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),

  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_MODEL: z.string().default('gemini-3.5-flash-lite'),
  // Conservative default for Gemini's free tier (as low as 5 RPM for generateContent).
  // Raise this once on a paid tier with a higher quota.
  GEMINI_GENERATION_RPM: z.coerce.number().default(4),
  EMBEDDING_MODEL: z.string().default('gemini-embedding-001'),
  EMBEDDING_DIMENSIONS: z.coerce.number().default(768),

  CHUNK_SIZE: z.coerce.number().default(1200),
  CHUNK_OVERLAP: z.coerce.number().default(150),
  TOP_K: z.coerce.number().default(6),
  SIMILARITY_THRESHOLD: z.coerce.number().default(0.55),

  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_UPLOAD_MB: z.coerce.number().default(50),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().default(20),

  VECTOR_INDEX_NAME: z.string().default('vector_index'),

  // Sends each uploaded PDF to Gemini to describe its charts, tables, and
  // figures (and to OCR scanned pages). Costs one extra generation call per PDF.
  PDF_VISUAL_ANALYSIS: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),

  // Google sign-in — leave unset to disable the "Continue with Google" flow.
  GOOGLE_CLIENT_ID: z.string().optional(),

  // Password reset emails. When SMTP_HOST is unset, reset links are printed to
  // the server console instead (handy for local development).
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('ContentIQ AI <no-reply@contentiq.local>'),
  PASSWORD_RESET_TTL_MINUTES: z.coerce.number().default(60),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment configuration:');
    for (const issue of parsed.error.issues) {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    throw new Error('Environment validation failed. Check server/.env against server/.env.example.');
  }
  return parsed.data;
}

export const env = loadEnv();
