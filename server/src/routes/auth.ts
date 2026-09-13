import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { authenticateToken, signToken, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const authRouter = Router();

authRouter.post(
  '/register',
  asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const user = await User.create({ name: name || 'New User', email, passwordHash, role: 'ANALYST' });

    const token = signToken({ userId: user._id.toString(), email: user.email, role: user.role });
    await AuditLog.create({ userId: user._id, action: 'USER_REGISTERED', detail: `${user.email} registered` });

    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  })
);

authRouter.post(
  '/login',
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken({ userId: user._id.toString(), email: user.email, role: user.role });
    await AuditLog.create({ userId: user._id, action: 'USER_LOGIN', detail: `${user.email} logged in` });

    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
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
    return res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role, preferences: user.preferences },
    });
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
    return res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role, preferences: user.preferences },
    });
  })
);
