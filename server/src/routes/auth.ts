import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { User, IUser } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { authenticateToken, signToken, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { sendPasswordResetEmail } from '../services/emailService.js';
import { env } from '../config/env.js';

export const authRouter = Router();

const MIN_PASSWORD_LENGTH = 8;
const googleClient = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

function serializeUser(user: IUser) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    hasPassword: !!user.passwordHash,
    googleLinked: !!user.googleId,
  };
}

function issueSession(user: IUser) {
  const token = signToken({ userId: user._id.toString(), email: user.email, role: user.role });
  return { token, user: serializeUser(user) };
}

function assertPasswordStrength(password: unknown): asserts password is string {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
}

function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

authRouter.post(
  '/register',
  asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const user = await User.create({ name: name || 'New User', email, passwordHash, role: 'ANALYST' });

    await AuditLog.create({ userId: user._id, action: 'USER_REGISTERED', detail: `${user.email} registered` });
    return res.json(issueSession(user));
  })
);

authRouter.post(
  '/login',
  authRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (user && !user.passwordHash) {
      return res.status(401).json({ error: 'This account uses Google sign-in. Continue with Google, or use "Forgot password" to set a password.' });
    }
    if (!user || !bcrypt.compareSync(password, user.passwordHash!)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    await AuditLog.create({ userId: user._id, action: 'USER_LOGIN', detail: `${user.email} logged in` });
    return res.json(issueSession(user));
  })
);

// POST /api/auth/google — the frontend obtains a Google ID token via Google
// Identity Services; we verify its signature and audience server-side, then
// sign in the matching user (linking by verified email) or create one.
authRouter.post(
  '/google',
  authRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    if (!googleClient) {
      throw new AppError(501, 'Google sign-in is not configured on this server.');
    }
    const { credential } = req.body;
    if (!credential || typeof credential !== 'string') {
      throw new AppError(400, 'Missing Google credential');
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: env.GOOGLE_CLIENT_ID });
      payload = ticket.getPayload();
    } catch {
      throw new AppError(401, 'Google sign-in could not be verified. Please try again.');
    }
    if (!payload?.sub || !payload.email) {
      throw new AppError(401, 'Google account did not provide an email address.');
    }
    if (!payload.email_verified) {
      throw new AppError(401, 'Your Google email address is not verified.');
    }

    const email = payload.email.toLowerCase();
    let user = await User.findOne({ googleId: payload.sub });
    let isNewUser = false;

    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        // Google has verified ownership of this email, so it's safe to link it to the existing account.
        user.googleId = payload.sub;
        if (!user.avatarUrl && payload.picture) user.avatarUrl = payload.picture;
        await user.save();
      } else {
        user = await User.create({
          name: payload.name || email.split('@')[0],
          email,
          googleId: payload.sub,
          avatarUrl: payload.picture,
          role: 'ANALYST',
        });
        isNewUser = true;
      }
    }

    await AuditLog.create({
      userId: user._id,
      action: isNewUser ? 'USER_REGISTERED' : 'GOOGLE_LOGIN',
      detail: isNewUser ? `${user.email} registered with Google` : `${user.email} signed in with Google`,
    });
    return res.json(issueSession(user));
  })
);

// POST /api/auth/forgot-password — always responds the same way whether or
// not the email exists, so it can't be used to discover registered accounts.
authRouter.post(
  '/forgot-password',
  authRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      throw new AppError(400, 'Email is required');
    }

    const genericResponse = { success: true, message: 'If an account exists for that email, a reset link has been sent.' };
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.json(genericResponse);

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetTokenHash = hashResetToken(rawToken);
    user.passwordResetExpiresAt = new Date(Date.now() + env.PASSWORD_RESET_TTL_MINUTES * 60_000);
    await user.save();

    const resetUrl = `${env.FRONTEND_URL.replace(/\/$/, '')}/reset-password?token=${rawToken}`;
    try {
      await sendPasswordResetEmail(user.email, user.name, resetUrl);
    } catch (err) {
      // Log but don't surface — the response must not differ based on account existence or mail health.
      console.error('Failed to send password reset email:', err);
    }

    await AuditLog.create({ userId: user._id, action: 'PASSWORD_RESET_REQUESTED', detail: 'Password reset link requested' });
    return res.json(genericResponse);
  })
);

// POST /api/auth/reset-password — consumes a single-use reset token and signs the user in.
authRouter.post(
  '/reset-password',
  authRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    if (!token || typeof token !== 'string') {
      throw new AppError(400, 'Reset token is required');
    }
    assertPasswordStrength(newPassword);

    const user = await User.findOne({
      passwordResetTokenHash: hashResetToken(token),
      passwordResetExpiresAt: { $gt: new Date() },
    });
    if (!user) {
      throw new AppError(400, 'This reset link is invalid or has expired. Please request a new one.');
    }

    user.passwordHash = bcrypt.hashSync(newPassword, 10);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();

    await AuditLog.create({ userId: user._id, action: 'PASSWORD_RESET', detail: 'Password reset via email link' });
    return res.json(issueSession(user));
  })
);

// POST /api/auth/change-password — requires the current password, except for
// Google-only accounts setting a password for the first time.
authRouter.post(
  '/change-password',
  authenticateToken,
  authRateLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    assertPasswordStrength(newPassword);

    const user = await User.findById(req.user!.userId);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    if (user.passwordHash) {
      if (!currentPassword || !bcrypt.compareSync(currentPassword, user.passwordHash)) {
        throw new AppError(400, 'Current password is incorrect');
      }
      if (bcrypt.compareSync(newPassword, user.passwordHash)) {
        throw new AppError(400, 'New password must be different from the current password');
      }
    }

    const wasSet = !!user.passwordHash;
    user.passwordHash = bcrypt.hashSync(newPassword, 10);
    await user.save();

    await AuditLog.create({ userId: user._id, action: 'PASSWORD_CHANGED', detail: wasSet ? 'Password changed' : 'Password set for Google account' });
    return res.json({ success: true, user: serializeUser(user) });
  })
);

authRouter.get(
  '/me',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await User.findById(req.user?.userId);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    return res.json({ user: { ...serializeUser(user), preferences: user.preferences } });
  })
);

authRouter.patch(
  '/me',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { name, preferences } = req.body;
    const user = await User.findById(req.user?.userId);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    if (name) user.name = name;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };
    await user.save();
    return res.json({ user: { ...serializeUser(user), preferences: user.preferences } });
  })
);
