import { Router, Response } from 'express';
import { RAGEngine } from '../services/ragEngine.js';
import { authenticateToken, AuthenticatedRequest } from './auth.js';
import { storedProjects } from './transformations.js';

export const qaRouter = Router();

// POST /api/qa/ask (Protected — User Isolated Authorization Check)
qaRouter.post('/ask', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { query, sourceName, projectId } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'Query string is required' });
  }

  // Authorization Check if querying specific project vectors
  if (projectId) {
    const project = storedProjects.find(p => p.id === projectId);
    if (project && project.userId !== req.user?.userId) {
      return res.status(403).json({ error: 'Access forbidden: You cannot query vectors belonging to another user' });
    }
  }

  const result = RAGEngine.queryContent({
    query,
    sourceName: sourceName || 'Transformer Architecture.pdf',
    projectId
  });

  return res.json({ success: true, result });
});
