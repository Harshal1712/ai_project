import { LLMService } from '../llm/LLMService.js';
import { slidesSchema } from '../llm/schemas.js';
import { generateSummaries, SummaryResult } from './summarizationService.js';
import { generateMCQs } from './mcqService.js';
import { ISlide, IQuizQuestion } from '../../models/GeneratedOutput.js';

export interface TransformationConfig {
  audience: string;
  language: string;
  tone: string;
  detailLevel: string;
  objective: string;
}

export interface GeneratedOutputDraft {
  type: string;
  title: string;
  content: string;
  slides?: ISlide[];
  quiz?: IQuizQuestion[];
}

const SUMMARY_DERIVED_TYPES = new Set(['Executive Summary', 'Detailed Summary', 'Key Points', 'FAQ']);

const GENERIC_TYPE_INSTRUCTIONS: Record<string, string> = {
  'Social Media Post': 'Write a short, engaging social media post announcing/summarizing this content, with 2-4 relevant hashtags.',
  Advisory: 'Write a formal advisory notice highlighting risks, recommendations, and required actions found in this content.',
  'Infographic Content': 'Extract 5-8 short, punchy stat/fact callouts suitable for an infographic, each on its own line.',
  'Training Material': 'Write structured training material (learning objectives, key concepts, a short exercise) based on this content.',
  'Video Script': 'Write a narration script (with scene/segment markers) suitable for turning this content into a short video.',
  'Meeting Minutes': 'Rewrite this content in the format of formal meeting minutes: attendees (if named), discussion points, decisions, action items.',
  'Action Items': 'Extract a checklist of concrete action items implied or stated in this content, each as a single actionable line.',
  'Q&A': 'Generate 5 realistic questions a reader might ask about this content, each followed by a grounded answer.',
};

function buildGroundingHeader(sourceName: string, config: TransformationConfig): string {
  return `Source: "${sourceName}"
Target audience: ${config.audience} | Output language: ${config.language} | Tone: ${config.tone} | Detail level: ${config.detailLevel} | Objective: ${config.objective}
Base your output strictly on the content provided below. Do not invent facts not present in it.`;
}

async function generatePresentation(context: string, sourceName: string, config: TransformationConfig): Promise<GeneratedOutputDraft> {
  const prompt = `${buildGroundingHeader(sourceName, config)}
Create a 5-8 slide presentation deck summarizing this content, with concise bullet points and brief speaker notes per slide.

CONTENT:
"""
${context}
"""`;

  const result = await LLMService.generateStructured<{ slides: ISlide[] }>(
    prompt,
    slidesSchema,
    'You create presentation decks strictly grounded in the given content.'
  );

  return {
    type: 'Presentation / PPT',
    title: `Presentation / PPT — ${sourceName}`,
    content: `${result.slides.length}-slide deck generated from "${sourceName}"`,
    slides: result.slides,
  };
}

async function generateQuiz(context: string, sourceName: string): Promise<GeneratedOutputDraft> {
  const quiz = await generateMCQs(context, sourceName, 5);
  return {
    type: 'MCQs / Quiz',
    title: `MCQs / Quiz — ${sourceName}`,
    content: 'Interactive comprehension assessment generated from the source content.',
    quiz,
  };
}

async function generateGeneric(type: string, context: string, sourceName: string, config: TransformationConfig): Promise<GeneratedOutputDraft> {
  const instruction = GENERIC_TYPE_INSTRUCTIONS[type] ?? `Generate a "${type}" style output based on this content.`;
  const prompt = `${buildGroundingHeader(sourceName, config)}
${instruction}

CONTENT:
"""
${context}
"""`;

  const content = await LLMService.generateText(
    prompt,
    'You generate content strictly grounded in what is provided. Never fabricate facts, figures, or quotes not present in the source.'
  );

  return { type, title: `${type} — ${sourceName}`, content };
}

function summaryOutputsFrom(summary: SummaryResult, types: string[], sourceName: string): GeneratedOutputDraft[] {
  const outputs: GeneratedOutputDraft[] = [];
  for (const type of types) {
    if (type === 'Executive Summary') {
      outputs.push({ type, title: `${type} — ${sourceName}`, content: summary.executiveSummary });
    } else if (type === 'Detailed Summary') {
      outputs.push({ type, title: `${type} — ${sourceName}`, content: summary.detailedSummary });
    } else if (type === 'Key Points') {
      outputs.push({ type, title: `${type} — ${sourceName}`, content: summary.keyPoints.map((p) => `• ${p}`).join('\n') });
    } else if (type === 'FAQ') {
      outputs.push({
        type,
        title: `${type} — ${sourceName}`,
        content: summary.faq.map((f, i) => `Q${i + 1}: ${f.question}\nA${i + 1}: ${f.answer}`).join('\n\n'),
      });
    }
  }
  return outputs;
}

// Generates every selected output type from the ACTUAL source content —
// replaces the old AIService, which returned fixed fabricated strings
// regardless of input. Summary-derived types share a single LLM call.
export async function generateTransformationOutputs(
  outputTypes: string[],
  context: string,
  sourceName: string,
  config: TransformationConfig
): Promise<GeneratedOutputDraft[]> {
  const outputs: GeneratedOutputDraft[] = [];
  const summaryTypes = outputTypes.filter((t) => SUMMARY_DERIVED_TYPES.has(t));
  const otherTypes = outputTypes.filter((t) => !SUMMARY_DERIVED_TYPES.has(t));

  const tasks: Promise<void>[] = [];

  if (summaryTypes.length > 0) {
    tasks.push(
      generateSummaries(context, sourceName, config.audience, config.tone).then((summary) => {
        outputs.push(...summaryOutputsFrom(summary, summaryTypes, sourceName));
      })
    );
  }

  for (const type of otherTypes) {
    if (type === 'Presentation / PPT') {
      tasks.push(generatePresentation(context, sourceName, config).then((o) => { outputs.push(o); }));
    } else if (type === 'MCQs / Quiz') {
      tasks.push(generateQuiz(context, sourceName).then((o) => { outputs.push(o); }));
    } else {
      tasks.push(generateGeneric(type, context, sourceName, config).then((o) => { outputs.push(o); }));
    }
  }

  await Promise.all(tasks);

  // Preserve the caller's requested order rather than the settle order of Promise.all.
  const order = new Map(outputTypes.map((t, i) => [t, i]));
  outputs.sort((a, b) => (order.get(a.type) ?? 0) - (order.get(b.type) ?? 0));
  return outputs;
}
