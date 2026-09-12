import { Router, Response } from 'express';
import { AIService, TransformationRequest } from '../services/aiService.js';
import { FactVerificationService } from '../services/factVerificationService.js';
import { DocumentExtractor } from '../services/documentExtractor.js';
import { YouTubeService } from '../services/youtubeService.js';
import { authenticateToken, AuthenticatedRequest } from './auth.js';

export const transformationsRouter = Router();

// In-memory project store
export let storedProjects: Array<{
  id: string;
  name: string;
  userId: string;
  source: any;
  config: any;
  selectedOutputTypes: string[];
  outputs: any[];
  verification: any;
  documentData?: any;
  videoData?: any;
  createdAt: string;
  status: string;
  version: string;
}> = [];

// Helper function to sanitize uploaded file names (Path Traversal Protection)
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return 'unnamed_document.pdf';
  // Remove directory traversal characters like ../ or ..\
  const cleanName = fileName.replace(/^.*[\\\/]/, '').replace(/(\.\.[\/\\])+/g, '');
  return cleanName || 'sanitized_document.pdf';
}

// POST /api/transformations/generate (Protected)
transformationsRouter.post('/generate', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId || 'usr-guest';
  const { source, config, outputs } = req.body;

  const rawFileName = source?.name || 'Transformer_Architecture.pdf';
  const sanitizedName = sanitizeFileName(rawFileName);

  // File Extension Security Validation
  const allowedExtensions = ['.pdf', '.docx', '.txt', '.mp4', '.mp3', '.png', '.jpg', '.jpeg'];
  const ext = sanitizedName.substring(sanitizedName.lastIndexOf('.')).toLowerCase();
  
  if (source?.type !== 'youtube' && source?.type !== 'text' && ext && !allowedExtensions.includes(ext)) {
    return res.status(400).json({ error: `File type ${ext} is not supported. Allowed formats: PDF, DOCX, TXT, MP4, MP3, PNG, JPG` });
  }

  const requestPayload: TransformationRequest = {
    sourceName: sanitizedName,
    sourceType: source?.type || 'pdf',
    audience: config?.audience || 'Executive',
    language: config?.language || 'English',
    tone: config?.tone || 'Professional',
    detailLevel: config?.detailLevel || 'Medium',
    objective: config?.objective || 'Brief',
    outputTypes: outputs || ['Executive Summary', 'Key Points', 'Presentation / PPT']
  };

  // Execute Generators
  const generatedOutputs = AIService.generateOutputs(requestPayload);
  const verification = FactVerificationService.verifyContent(requestPayload.sourceName, generatedOutputs.length);
  const documentData = DocumentExtractor.extractDocument(requestPayload.sourceName);
  const videoData = requestPayload.sourceType === 'youtube' ? YouTubeService.processVideo(source?.url || '') : undefined;

  const newProject = {
    id: `proj-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: requestPayload.sourceName.replace(/\.[^/.]+$/, '') + ' Transformation',
    userId,
    source: {
      type: source?.type || 'pdf',
      name: sanitizedName,
      size: source?.size || '4.2 MB',
      language: source?.language || 'English',
      uploadDate: new Date().toISOString().split('T')[0]
    },
    config: config || { audience: 'Executive', language: 'English', tone: 'Professional', detailLevel: 'Medium', objective: 'Brief' },
    selectedOutputTypes: requestPayload.outputTypes,
    outputs: generatedOutputs.map((out, idx) => ({
      id: `out-${Date.now()}-${idx}`,
      type: out.type,
      title: out.title,
      content: out.content,
      slides: out.slides,
      quiz: out.quiz
    })),
    verification,
    documentData,
    videoData,
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    status: 'Completed',
    version: 'v1.0'
  };

  storedProjects.unshift(newProject);

  return res.status(201).json({
    success: true,
    project: newProject
  });
});

// GET /api/transformations/projects (Protected — User Isolated)
transformationsRouter.get('/projects', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const userProjects = storedProjects.filter(p => p.userId === userId);
  return res.json({
    projects: userProjects
  });
});

// GET /api/transformations/projects/:id (Protected — User Isolated Authorization Check)
transformationsRouter.get('/projects/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const project = storedProjects.find(p => p.id === req.params.id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  // User Authorization Check
  if (project.userId !== req.user?.userId) {
    return res.status(403).json({ error: 'Access forbidden: You do not have permission to view this project' });
  }

  return res.json({ project });
});

// DELETE /api/transformations/projects/:id (Protected — User Isolated Authorization Check)
transformationsRouter.delete('/projects/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const project = storedProjects.find(p => p.id === req.params.id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  // User Authorization Check
  if (project.userId !== req.user?.userId) {
    return res.status(403).json({ error: 'Access forbidden: You do not have permission to delete this project' });
  }

  storedProjects = storedProjects.filter(p => p.id !== req.params.id);
  return res.json({ success: true, message: 'Project deleted successfully' });
});
