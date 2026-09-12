import { Router } from 'express';
export const analyticsRouter = Router();
analyticsRouter.get('/telemetry', (req, res) => {
    return res.json({
        metrics: {
            totalTransformations: 1428,
            documentsProcessed: 892,
            videosSummarized: 314,
            aiOutputsGenerated: 5640,
            avgLatencySeconds: 3.8,
            contentFidelityScore: 96.8
        },
        topOutputTypes: [
            { name: 'Summary', count: 420 },
            { name: 'PPT Deck', count: 380 },
            { name: 'FAQ / Q&A', count: 310 },
            { name: 'MCQs', count: 260 },
            { name: 'Social Post', count: 210 },
            { name: 'Action Items', count: 190 }
        ],
        languageDistribution: [
            { name: 'English', value: 65 },
            { name: 'Hindi', value: 18 },
            { name: 'Marathi', value: 8 },
            { name: 'Tamil', value: 5 },
            { name: 'Other', value: 4 }
        ]
    });
});
