import { TransformationTemplate, OutputType } from '../types';

export const ALL_OUTPUT_TYPES: OutputType[] = [
  'Executive Summary',
  'Detailed Summary',
  'Key Points',
  'FAQ',
  'Q&A',
  'Presentation / PPT',
  'Social Media Post',
  'Advisory',
  'Infographic Content',
  'Training Material',
  'MCQs / Quiz',
  'Video Script',
  'Meeting Minutes',
  'Action Items'
];

// Recipe metadata only (prefills the Create Transformation config) — no fabricated
// generated content lives here; actual outputs always come from the real AI pipeline.
export const MOCK_TEMPLATES: TransformationTemplate[] = [
  {
    id: 't1',
    name: 'Executive Briefing Package',
    description: 'Transform complex specs or reports into an Executive Summary, Key Points, and a slide deck.',
    iconName: 'Briefcase',
    targetAudience: 'Executive',
    tone: 'Professional',
    detailLevel: 'Short',
    objective: 'Brief',
    outputTypes: ['Executive Summary', 'Key Points', 'Presentation / PPT', 'Action Items'],
    popularFor: 'C-Suite Briefings, Board Meetings, Investor Updates'
  },
  {
    id: 't2',
    name: 'Pitch & Assessment Suite',
    description: 'Generate pitch summaries, FAQs, Q&A indices, and interactive evaluation quizzes from project proposals.',
    iconName: 'Award',
    targetAudience: 'Technical Team',
    tone: 'Technical',
    detailLevel: 'Detailed',
    objective: 'Educate',
    outputTypes: ['Detailed Summary', 'FAQ', 'Q&A', 'MCQs / Quiz', 'Presentation / PPT'],
    popularFor: 'Hackathon Submissions, Product Demos, Technical Grants'
  },
  {
    id: 't3',
    name: 'Corporate Training & Onboarding Kit',
    description: 'Convert SOPs, manuals, or training videos into employee guides, quiz modules, and video scripts.',
    iconName: 'GraduationCap',
    targetAudience: 'Employee',
    tone: 'Educational',
    detailLevel: 'Medium',
    objective: 'Train',
    outputTypes: ['Training Material', 'MCQs / Quiz', 'Video Script', 'FAQ'],
    popularFor: 'Employee Onboarding, Compliance Training, Technical Upskilling'
  },
  {
    id: 't4',
    name: 'Omnichannel Social Media Blitz',
    description: 'Distill blog posts or whitepapers into LinkedIn posts, tweets, visual infographics, and key takeaways.',
    iconName: 'Share2',
    targetAudience: 'Customer',
    tone: 'Conversational',
    detailLevel: 'Short',
    objective: 'Persuade',
    outputTypes: ['Social Media Post', 'Infographic Content', 'Key Points'],
    popularFor: 'Marketing Campaigns, Product Announcements, Content Repurposing'
  }
];
