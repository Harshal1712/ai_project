import { Router } from 'express';
import { AIService } from '../services/aiService.js';
import { FactVerificationService } from '../services/factVerificationService.js';
import { DocumentExtractor } from '../services/documentExtractor.js';
import { YouTubeService } from '../services/youtubeService.js';
export const transformationsRouter = Router();
// In-memory project store
let storedProjects = [];
transformationsRouter.post('/generate', (req, res) => {
    const { source, config, outputs } = req.body;
    const requestPayload = {
        sourceName: source?.name || 'Enterprise_Document.pdf',
        sourceType: source?.type || 'pdf',
        audience: config?.audience || 'Executive',
        language: config?.language || 'English',
        tone: config?.tone || 'Professional',
        detailLevel: config?.detailLevel || 'Medium',
        objective: config?.objective || 'Brief',
        outputTypes: outputs || ['Executive Summary', 'Key Points', 'Presentation / PPT']
    };
    // Run AI Output Generators
    const generatedOutputs = AIService.generateOutputs(requestPayload);
    const verification = FactVerificationService.verifyContent(requestPayload.sourceName, generatedOutputs.length);
    const documentData = DocumentExtractor.extractDocument(requestPayload.sourceName);
    const videoData = requestPayload.sourceType === 'youtube' ? YouTubeService.processVideo(source?.url || '') : undefined;
    const newProject = {
        id: `proj-${Date.now()}`,
        name: requestPayload.sourceName.replace(/\.[^/.]+$/, '') + ' Transformation',
        source: source || { type: 'pdf', name: requestPayload.sourceName, size: '4.2 MB', language: 'English', uploadDate: '2026-09-10' },
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
    return res.json({
        success: true,
        project: newProject
    });
});
transformationsRouter.get('/projects', (req, res) => {
    return res.json({
        projects: storedProjects
    });
});
transformationsRouter.get('/projects/:id', (req, res) => {
    const project = storedProjects.find(p => p.id === req.params.id);
    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }
    return res.json({ project });
});
transformationsRouter.delete('/projects/:id', (req, res) => {
    storedProjects = storedProjects.filter(p => p.id !== req.params.id);
    return res.json({ success: true, message: 'Project deleted' });
});
