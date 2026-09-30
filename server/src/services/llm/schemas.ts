import { Type } from '@google/genai';

// Gemini's responseSchema is a restricted OpenAPI subset (no $ref/oneOf), so
// these are hand-written with the SDK's Type enum rather than derived from
// the app's zod/TS types.

export const summarySchema = {
  type: Type.OBJECT,
  properties: {
    executiveSummary: { type: Type.STRING },
    detailedSummary: { type: Type.STRING },
    keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
    faq: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { question: { type: Type.STRING }, answer: { type: Type.STRING } },
        required: ['question', 'answer'],
      },
    },
  },
  required: ['executiveSummary', 'detailedSummary', 'keyPoints', 'faq'],
};

export const mcqSchema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctAnswer: { type: Type.INTEGER },
          explanation: { type: Type.STRING },
          citation: { type: Type.STRING },
        },
        required: ['question', 'options', 'correctAnswer', 'explanation'],
      },
    },
  },
  required: ['questions'],
};

export const chaptersSchema = {
  type: Type.OBJECT,
  properties: {
    chapters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          startTime: { type: Type.NUMBER },
          endTime: { type: Type.NUMBER },
          summary: { type: Type.STRING },
        },
        required: ['title', 'startTime', 'endTime', 'summary'],
      },
    },
  },
  required: ['chapters'],
};

export const ragAnswerSchema = {
  type: Type.OBJECT,
  properties: {
    answer: { type: Type.STRING },
    grounded: { type: Type.BOOLEAN },
  },
  required: ['answer', 'grounded'],
};

export const claimExtractionSchema = {
  type: Type.OBJECT,
  properties: {
    claims: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['claims'],
};

export const claimVerificationSchema = {
  type: Type.OBJECT,
  properties: {
    results: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          claimIndex: { type: Type.INTEGER },
          status: {
            type: Type.STRING,
            enum: ['verified', 'meaning_changed', 'nuance_shift', 'unsupported'],
          },
          sourceStatement: { type: Type.STRING },
          category: { type: Type.STRING },
          note: { type: Type.STRING },
        },
        required: ['claimIndex', 'status', 'sourceStatement', 'category', 'note'],
      },
    },
  },
  required: ['results'],
};

export const documentIntelligenceSchema = {
  type: Type.OBJECT,
  properties: {
    keyTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
    importantDates: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { date: { type: Type.STRING }, event: { type: Type.STRING } },
        required: ['date', 'event'],
      },
    },
    keyMetrics: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { label: { type: Type.STRING }, value: { type: Type.STRING } },
        required: ['label', 'value'],
      },
    },
    entities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          category: {
            type: Type.STRING,
            enum: ['Person', 'Organization', 'Technical Term', 'Metric', 'Date', 'Reference'],
          },
          frequency: { type: Type.INTEGER },
          contextSnippet: { type: Type.STRING },
        },
        required: ['name', 'category', 'frequency', 'contextSnippet'],
      },
    },
    references: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['keyTopics', 'importantDates', 'keyMetrics', 'entities', 'references'],
};

export const videoIntelligenceSchema = {
  type: Type.OBJECT,
  properties: {
    chapters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          startTime: { type: Type.NUMBER },
          endTime: { type: Type.NUMBER },
          summary: { type: Type.STRING },
        },
        required: ['title', 'startTime', 'endTime', 'summary'],
      },
    },
    keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
    importantQuotes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          quote: { type: Type.STRING },
          speaker: { type: Type.STRING },
          timestamp: { type: Type.STRING },
        },
        required: ['quote', 'timestamp'],
      },
    },
    topicsDiscussed: { type: Type.ARRAY, items: { type: Type.STRING } },
    faq: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          answer: { type: Type.STRING },
          timestamp: { type: Type.STRING },
        },
        required: ['question', 'answer', 'timestamp'],
      },
    },
  },
  required: ['chapters', 'keyTakeaways', 'importantQuotes', 'topicsDiscussed', 'faq'],
};

export const slidesSchema = {
  type: Type.OBJECT,
  properties: {
    slides: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          slideNumber: { type: Type.INTEGER },
          title: { type: Type.STRING },
          bulletPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          speakerNotes: { type: Type.STRING },
        },
        required: ['slideNumber', 'title', 'bulletPoints', 'speakerNotes'],
      },
    },
  },
  required: ['slides'],
};

export const transcriptSchema = {
  type: Type.OBJECT,
  properties: {
    videoTitleGuess: { type: Type.STRING },
    segments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          startTime: { type: Type.NUMBER },
          endTime: { type: Type.NUMBER },
          text: { type: Type.STRING },
        },
        required: ['startTime', 'endTime', 'text'],
      },
    },
  },
  required: ['segments'],
};

export const pdfVisionSchema = {
  type: Type.OBJECT,
  properties: {
    visualElements: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          page: { type: Type.INTEGER },
          kind: { type: Type.STRING, enum: ['chart', 'table', 'diagram', 'image', 'infographic', 'other'] },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          keyData: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['page', 'kind', 'title', 'description', 'keyData'],
      },
    },
    // Only requested for scanned/image-only PDFs that have no text layer.
    pages: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { page: { type: Type.INTEGER }, text: { type: Type.STRING } },
        required: ['page', 'text'],
      },
    },
  },
  required: ['visualElements'],
};

export const flashcardsSchema = {
  type: Type.OBJECT,
  properties: {
    cards: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          front: { type: Type.STRING },
          back: { type: Type.STRING },
          citation: { type: Type.STRING },
        },
        required: ['front', 'back'],
      },
    },
  },
  required: ['cards'],
};
