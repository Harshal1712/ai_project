import { Router } from 'express';
import { RAGEngine } from '../services/ragEngine.js';
export const qaRouter = Router();
qaRouter.post('/ask', (req, res) => {
    const { query, sourceName, projectId } = req.body;
    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }
    const result = RAGEngine.queryContent({
        query,
        sourceName: sourceName || 'Uploaded Document.pdf',
        projectId
    });
    return res.json({ success: true, result });
});
