import { 
  ProjectItem, 
  TransformationTemplate, 
  VerificationReport, 
  DocumentIntelligenceData, 
  VideoIntelligenceData,
  OutputType
} from '../types';

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

export const MOCK_VERIFICATION: VerificationReport = {
  fidelityScore: 96,
  totalChecks: 18,
  passedChecks: 16,
  warnings: 2,
  checks: [
    {
      id: 'v1',
      sourceStatement: 'The strategic enterprise application must be submitted within 7 working days from the official notification.',
      generatedStatement: 'The application must be submitted within 7 days.',
      status: 'meaning_changed',
      category: 'Conditions',
      note: 'Source specifies "7 working days" which includes business days only. Generated statement omits "working", potentially altering deadline interpretation.'
    },
    {
      id: 'v2',
      sourceStatement: 'Phase 1 deployment requires a minimum budget allocation of $450,000 across Q3 and Q4.',
      generatedStatement: 'Phase 1 budget allocation is set at $450,000 for Q3/Q4.',
      status: 'verified',
      category: 'Numbers',
      note: 'Exact financial figure and timeframe accurately preserved.'
    },
    {
      id: 'v3',
      sourceStatement: 'Chief Technology Officer Dr. Aris Thorne highlighted AI governance guidelines under ISO/IEC 42001.',
      generatedStatement: 'Dr. Thorne introduced ISO 42001 compliance standards for organizational AI governance.',
      status: 'verified',
      category: 'Technical terms',
      note: 'Technical standard ISO/IEC 42001 correctly referenced.'
    },
    {
      id: 'v4',
      sourceStatement: 'All API calls must enforce OAuth 2.0 with JWT token expiration capped at 3600 seconds.',
      generatedStatement: 'OAuth 2.0 with JWT tokens expiring in 1 hour is required for API access.',
      status: 'nuance_shift',
      category: 'Technical terms',
      note: '3600 seconds converted to 1 hour. Technically equivalent, but precision shifted from seconds to hours.'
    },
    {
      id: 'v5',
      sourceStatement: 'Project deliverables must achieve an SLA uptime of 99.95% on primary AWS clusters.',
      generatedStatement: 'The target SLA uptime for AWS cluster hosting is 99.95%.',
      status: 'verified',
      category: 'Metrics',
      note: 'SLA percentage and cloud target strictly maintained.'
    }
  ]
};

export const MOCK_DOC_INTELLIGENCE: DocumentIntelligenceData = {
  documentName: 'SIH26154_Enterprise_Content_Transformation_Spec.pdf',
  wordCount: 4280,
  readingTime: '16 min read',
  keyTopics: [
    'Multimodal Gen AI Parsing',
    'Factual Verification Engine',
    'Enterprise Content Scaling',
    'Real-time Q&A Indexing',
    'ISO/IEC 42001 Compliance'
  ],
  importantDates: [
    { date: '2026-09-15', event: 'Hackathon Grand Finale Submission' },
    { date: '2026-10-01', event: 'Enterprise Beta Release' },
    { date: '2026-11-15', event: 'Multi-region Cloud Deployment' }
  ],
  keyMetrics: [
    { label: 'Content Fidelity Target', value: '98.5%' },
    { label: 'Supported Inputs', value: '7 Formats' },
    { label: 'Output Syntheses', value: '14 Formats' },
    { label: 'Avg Processing Latency', value: '3.8 seconds' }
  ],
  entities: [
    { id: 'e1', name: 'Smart India Hackathon 2026', category: 'Organization', frequency: 12, contextSnippet: 'Built for the SIH26154 problem statement.' },
    { id: 'e2', name: 'Dr. Aris Thorne', category: 'Person', frequency: 5, contextSnippet: 'Principal Systems Architect and AI lead.' },
    { id: 'e3', name: 'Multimodal Parsing Engine', category: 'Technical Term', frequency: 18, contextSnippet: 'Extracts tabular, visual, and acoustic features.' },
    { id: 'e4', name: '99.95% SLA', category: 'Metric', frequency: 4, contextSnippet: 'Guaranteed uptime for real-time document transformation APIs.' },
    { id: 'e5', name: 'ISO/IEC 42001', category: 'Reference', frequency: 3, contextSnippet: 'International standard for Artificial Intelligence Management Systems.' }
  ],
  references: [
    'NIST AI Risk Management Framework (AI RMF 1.0)',
    'ISO/IEC 42001:2023 Information technology — Artificial intelligence',
    'W3C Web Content Accessibility Guidelines (WCAG) 2.1 AA',
    'Google DeepMind Gen AI Architecture Guidelines 2026'
  ]
};

export const MOCK_VIDEO_INTELLIGENCE: VideoIntelligenceData = {
  videoTitle: 'Enterprise Gen AI Architecture & Automated Content Transformation',
  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  duration: '45:30',
  shortSummary: 'In this high-level technical session, the team explores ContentIQ AI architecture, covering multimodal extraction from video, audio, and documents, automated prompt structuring, cross-modal semantic consistency, and fact-verification scoring.',
  detailedSummary: `This comprehensive video breakdown addresses the critical requirements of SIH26154:
  1. Multimodal Parsing: How speech-to-text, OCR, and document layout parsing feed into a unified vector space.
  2. Enterprise Output Synthesis: Translating raw knowledge into 14 distinct business formats ranging from executive decks to interactive quizzes.
  3. Factual Verification: Implementing fine-grained token-level semantic diffing to ensure zero hallucination in regulatory and executive briefings.
  4. Real-time Q&A: Grounded retrieval allowing users to ask natural language questions with exact timestamp and page citations.`,
  chapters: [
    { id: 'c1', timestamp: '00:00', seconds: 0, title: 'Introduction & Problem Overview', summary: 'Overview of SIH26154 and challenges in traditional manual content summarization.' },
    { id: 'c2', timestamp: '05:32', seconds: 332, title: 'Multimodal Processing Pipeline', summary: 'Architectural walkthrough of audio speech recognition, document OCR, and YouTube transcription.' },
    { id: 'c3', timestamp: '14:20', seconds: 860, title: 'Factual Verification Engine', summary: 'Detailed demonstration of how statement fidelity is measured and flagged against hallucinations.' },
    { id: 'c4', timestamp: '27:45', seconds: 1665, title: 'Generative Output Formats', summary: 'Showcase of 14 target outputs including PPT decks, social posts, training modules, and quizzes.' },
    { id: 'c5', timestamp: '37:20', seconds: 2240, title: 'Model Fine-tuning & Overfitting Prevention', summary: 'Technical discussion on preventing overfitting when fine-tuning domain LLMs for enterprise data.' },
    { id: 'c6', timestamp: '41:10', seconds: 2470, title: 'Conclusion & Q&A', summary: 'Summary of benchmark results and Q&A with live audience.' }
  ],
  keyTakeaways: [
    'Automated content transformation reduces document distillation time by up to 92%.',
    'Meaning verification prevents critical liability risks in legal and financial AI summaries.',
    'Multi-output generation ensures key insights reach diverse stakeholders in their preferred format.',
    'Timestamp-grounded video Q&A enables rapid navigation through hour-long video recordings.'
  ],
  importantQuotes: [
    { quote: 'Generative AI is only as useful to an enterprise as its factual reliability.', speaker: 'Dr. Aris Thorne', timestamp: '15:42' },
    { quote: 'One source document should fuel every communication vector—from C-suite PPTs to employee quizzes.', speaker: 'Priya Sharma', timestamp: '28:10' }
  ],
  topicsDiscussed: [
    'Multimodal Embeddings',
    'Fact-Checking Algorithms',
    'Slide Deck Generation',
    'Overfitting & Generalization',
    'Enterprise Security & RBAC'
  ],
  faq: [
    { question: 'How does ContentIQ ensure legal documents are not misinterpreted?', answer: 'ContentIQ uses a dual-engine verifier that compares parsed clauses against output summaries line-by-line, flagging any change in condition or numerical constraint.', timestamp: '17:05' },
    { question: 'Where does the speaker explain overfitting?', answer: 'The speaker explains overfitting and regularization techniques at timestamp 37:20 during the technical architecture segment.', timestamp: '37:20' }
  ],
  quiz: [
    {
      id: 1,
      question: 'What is the primary purpose of the Factual Verification Engine in ContentIQ AI?',
      options: [
        'To speed up video rendering',
        'To detect meaning changes and prevent AI hallucinations',
        'To translate text into foreign languages',
        'To reduce PDF file sizes'
      ],
      correctAnswer: 1,
      explanation: 'The verification engine checks generated statements against source content to detect shifts in meaning, numbers, and technical terms.'
    },
    {
      id: 2,
      question: 'At what timestamp is overfitting and model training discussed in the video?',
      options: ['05:32', '14:20', '37:20', '41:10'],
      correctAnswer: 2,
      explanation: 'Chapter 5 begins at 37:20 specifically addressing Model Fine-tuning & Overfitting Prevention.'
    }
  ]
};

export const MOCK_PROJECTS: ProjectItem[] = [
  {
    id: 'proj-1',
    name: 'SIH26154 Gen AI Architecture Spec',
    source: {
      type: 'pdf',
      name: 'SIH26154_Enterprise_Content_Transformation_Spec.pdf',
      size: '4.2 MB',
      language: 'English',
      uploadDate: '2026-09-08'
    },
    config: {
      audience: 'Executive',
      language: 'English',
      tone: 'Professional',
      detailLevel: 'Medium',
      objective: 'Brief'
    },
    selectedOutputTypes: ['Executive Summary', 'Key Points', 'Presentation / PPT', 'FAQ', 'MCQs / Quiz', 'Action Items'],
    outputs: [
      {
        id: 'out-1',
        type: 'Executive Summary',
        title: 'Executive Summary — ContentIQ AI Platform',
        content: `ContentIQ AI is a flagship enterprise Gen AI platform designed to address the SIH26154 challenge by automating the transformation of complex multimodal inputs into 14 tailored business outputs. 

Key Highlights:
• Unified Multimodal Ingestion: Ingests PDFs, Word docs, Audio/Video recordings, YouTube URLs, and Images seamlessly.
• Automated Multi-Format Synthesis: Generates C-suite summaries, presentation slide decks, social media kits, interactive quizzes, and training collateral simultaneously.
• Meaning & Fact Verification: Implements an automated audit layer with 96%+ fidelity scoring, highlighting potential semantic shifts before release.
• Enterprise ROI: Cuts document processing cycle times by 85% and eliminates manual presentation crafting.`
      },
      {
        id: 'out-2',
        type: 'Key Points',
        title: 'Strategic Takeaways',
        content: `1. Solves Information Overload: Turns length documents into actionable intelligence.
2. Cross-Lingual Output: Native support for English, Hindi, Marathi, Tamil, Telugu, and Bengali outputs.
3. Interactive Content Assistant: Inline RAG grounded Q&A with exact paragraph level citations.
4. Built-in Security: Enterprise grade encryption and ISO/IEC 42001 compliant AI governance.`
      },
      {
        id: 'out-3',
        type: 'Presentation / PPT',
        title: 'Executive Pitch Deck',
        content: '6-Slide Interactive Deck Preview',
        slides: [
          { slideNumber: 1, title: 'ContentIQ AI Platform', bulletPoints: ['Automated Multimodal Content Transformation', 'Built for SIH26154 Enterprise Requirements', 'One Source. Every Format. AI-Powered.'], speakerNotes: 'Welcome executive leadership. Today we present ContentIQ AI.' },
          { slideNumber: 2, title: 'The Problem: Content Silos', bulletPoints: ['Unstructured PDFs & Videos take hours to distill', 'High risk of human error during manual briefing', 'Inconsistent messaging across departments'], speakerNotes: 'Highlight business impact of legacy documentation workflows.' },
          { slideNumber: 3, title: 'The Solution: 14 AI Outputs', bulletPoints: ['Single upload fuels Executive Summaries, PPTs, & Quizzes', 'Automated Fact-Verification engine with fidelity scoring', 'Grounded Q&A with instant timestamp navigation'], speakerNotes: 'Focus on multi-output flexibility.' },
          { slideNumber: 4, title: 'Core Architectural Pillars', bulletPoints: ['Multimodal Ingestion Engine (OCR + Speech + Layout)', 'Semantic Diff & Fact Checker (96%+ Fidelity)', 'Enterprise RBAC & Multi-language Support'], speakerNotes: 'Explain technological defensibility.' },
          { slideNumber: 5, title: 'Benchmark Performance', bulletPoints: ['92% Reduction in creation time', '3.8s Average transformation latency', 'Zero-hallucinated financial/metric accuracy'], speakerNotes: 'Emphasize quantitative metrics.' },
          { slideNumber: 6, title: 'Roadmap & Next Steps', bulletPoints: ['Hackathon Grand Finale (Sept 2026)', 'Enterprise Cloud Rollout (Oct 2026)', 'Custom On-Premises Model Deployment'], speakerNotes: 'Conclude with rollout schedule.' }
        ]
      },
      {
        id: 'out-4',
        type: 'FAQ',
        title: 'Frequently Asked Questions',
        content: `Q1: How does ContentIQ prevent false claims in generated summaries?
A1: ContentIQ features an automated Meaning & Fact Verification engine that checks numerical data, dates, and core statements against original text line-by-line.

Q2: Can we export outputs into Microsoft PowerPoint (.pptx)?
A2: Yes, slide decks can be exported directly to PPTX, Markdown, PDF, or raw text format.

Q3: What languages are supported for output generation?
A3: ContentIQ supports English, Hindi, Marathi, Tamil, Telugu, Bengali, and custom domain languages.`
      },
      {
        id: 'out-5',
        type: 'MCQs / Quiz',
        title: 'Comprehension Assessment',
        content: 'Interactive 2-Question Quiz',
        quiz: MOCK_VIDEO_INTELLIGENCE.quiz
      },
      {
        id: 'out-6',
        type: 'Action Items',
        title: 'Immediate Execution Plan',
        content: `[ ] Finalize API integration specs for PDF parsing engine (Target: Sept 12)
[ ] Perform load testing on YouTube video transcription pipeline (Target: Sept 14)
[ ] Conduct compliance audit for ISO/IEC 42001 adherence (Target: Sept 15)
[ ] Schedule executive demonstration with SIH evaluation panel`
      }
    ],
    verification: MOCK_VERIFICATION,
    documentData: MOCK_DOC_INTELLIGENCE,
    createdAt: '2026-09-08 14:30',
    status: 'Completed',
    version: 'v1.2'
  },
  {
    id: 'proj-2',
    name: 'Enterprise Gen AI Video Keynote',
    source: {
      type: 'youtube',
      name: 'Enterprise Gen AI Architecture Keynote',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: '45:30',
      thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
      uploadDate: '2026-09-07'
    },
    config: {
      audience: 'Technical Team',
      language: 'English',
      tone: 'Technical',
      detailLevel: 'Detailed',
      objective: 'Educate'
    },
    selectedOutputTypes: ['Detailed Summary', 'Video Script', 'Training Material', 'MCQs / Quiz'],
    outputs: [
      {
        id: 'out-201',
        type: 'Detailed Summary',
        title: 'Video Keynote Architectural Summary',
        content: MOCK_VIDEO_INTELLIGENCE.detailedSummary
      },
      {
        id: 'out-202',
        type: 'Video Script',
        title: 'Recap Video Script (3-Minute Executive Overview)',
        content: `[SCENE START]
VISUAL: Modern office, split screen showing document input on left and instant 14 outputs on right.
NARRATOR (VO): "What if a 50-page technical specification could instantly become an executive slide deck, a quiz, and a video script in under 5 seconds?"
VISUAL: Zoom into ContentIQ AI interface highlighting 96% fact verification badge.
NARRATOR (VO): "Meet ContentIQ AI. One source. Every format. Fact-verified."
[SCENE END]`
      }
    ],
    verification: {
      fidelityScore: 98,
      totalChecks: 12,
      passedChecks: 12,
      warnings: 0,
      checks: []
    },
    videoData: MOCK_VIDEO_INTELLIGENCE,
    createdAt: '2026-09-07 10:15',
    status: 'Completed',
    version: 'v1.0'
  },
  {
    id: 'proj-3',
    name: 'Quarterly AI Financial Advisory & Action Plan',
    source: {
      type: 'docx',
      name: 'Q3_Enterprise_AI_Financial_Report.docx',
      size: '2.8 MB',
      uploadDate: '2026-09-05'
    },
    config: {
      audience: 'Executive',
      language: 'English',
      tone: 'Formal',
      detailLevel: 'Medium',
      objective: 'Inform'
    },
    selectedOutputTypes: ['Advisory', 'Meeting Minutes', 'Action Items'],
    outputs: [
      {
        id: 'out-301',
        type: 'Advisory',
        title: 'Financial Strategy Advisory',
        content: 'Strategic advisory regarding enterprise AI infrastructure expenditure, cloud GPU reservations, and operational cost savings.'
      }
    ],
    verification: MOCK_VERIFICATION,
    createdAt: '2026-09-05 16:45',
    status: 'Completed',
    version: 'v1.0'
  }
];

export const MOCK_TEMPLATES: TransformationTemplate[] = [
  {
    id: 't1',
    name: 'Executive Briefing Package',
    description: 'Transform complex specs or reports into an Executive Summary, Key Points, and 5-slide PPT Deck.',
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
    name: 'SIH Pitch & Assessment Suite',
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
