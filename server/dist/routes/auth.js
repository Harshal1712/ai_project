import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'contentiq-enterprise-sih26154-secret-key';
// Mock in-memory auth for zero-config demonstration
const users = [
    {
        id: 'usr-1',
        name: 'Harshwardhan',
        email: 'harshwardhan@contentiq.ai',
        passwordHash: bcrypt.hashSync('admin123', 8),
        role: 'ARCHITECT'
    }
];
authRouter.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
});
authRouter.post('/register', (req, res) => {
    const { name, email, password } = req.body;
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'Email already registered' });
    }
    const newUser = {
        id: `usr-${Date.now()}`,
        name: name || 'Enterprise User',
        email,
        passwordHash: bcrypt.hashSync(password || 'password123', 8),
        role: 'ANALYST'
    };
    users.push(newUser);
    const token = jwt.sign({ userId: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({
        token,
        user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
        }
    });
});
