import { Router } from 'express';
import { FactVerificationService } from '../services/factVerificationService.js';

export const verificationRouter = Router();

verificationRouter.post('/audit', (req, res) => {
  const { sourceName, outputsCount } = req.body;
  const report = FactVerificationService.verifyContent(sourceName || 'Source Document.pdf', outputsCount || 6);

  return res.json({ success: true, report });
});
