import { Router, Response } from 'express';
import { Types } from 'mongoose';
import { Project } from '../models/Project.js';
import { FlashcardDeck, IFlashcardDeck } from '../models/FlashcardDeck.js';
import { QuizAttempt } from '../models/QuizAttempt.js';
import { AuditLog } from '../models/AuditLog.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import {
  generateFlashcards,
  loadProjectText,
  scheduleReview,
  ReviewGrade,
  MASTERED_BOX,
} from '../services/generation/flashcardService.js';

// Study mode: AI-generated flashcards with Leitner spaced repetition, plus
// quiz score tracking for the MCQ outputs.
export const studyRouter = Router();

const MIN_CARDS = 5;
const MAX_CARDS = 30;
const MAX_CARDS_PER_DECK = 200;
const REVIEW_GRADES: ReviewGrade[] = ['again', 'good', 'easy'];

async function loadOwnedProject(projectId: string, userId: string) {
  if (!Types.ObjectId.isValid(projectId)) throw new AppError(404, 'Project not found');
  const project = await Project.findById(projectId).lean();
  if (!project) throw new AppError(404, 'Project not found');
  if (project.userId.toString() !== userId) throw new AppError(403, 'Access forbidden');
  return project;
}

function deckStats(deck: IFlashcardDeck | null, now = new Date()) {
  const cards = deck?.cards ?? [];
  return {
    total: cards.length,
    due: cards.filter((c) => c.dueAt <= now).length,
    new: cards.filter((c) => c.reviewCount === 0).length,
    mastered: cards.filter((c) => c.box >= MASTERED_BOX).length,
  };
}

function serializeDeck(deck: IFlashcardDeck | null) {
  if (!deck) return null;
  return {
    id: deck._id.toString(),
    language: deck.language,
    updatedAt: deck.updatedAt,
    stats: deckStats(deck),
    cards: deck.cards.map((c) => ({
      id: c._id.toString(),
      front: c.front,
      back: c.back,
      citation: c.citation,
      box: c.box,
      dueAt: c.dueAt,
      reviewCount: c.reviewCount,
      correctCount: c.correctCount,
    })),
  };
}

// GET /api/study/overview — every project with its flashcard and quiz progress, for the Study home page.
studyRouter.get(
  '/overview',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const [projects, decks, attempts] = await Promise.all([
      Project.find({ userId, status: 'Completed' }, { name: 1, sourceType: 1, sourceName: 1, createdAt: 1 }).sort({ createdAt: -1 }).lean(),
      FlashcardDeck.find({ userId }),
      QuizAttempt.find({ userId }).sort({ createdAt: -1 }).lean(),
    ]);

    const deckByProject = new Map(decks.map((d) => [d.projectId.toString(), d]));
    const attemptsByProject = new Map<string, typeof attempts>();
    for (const a of attempts) {
      const key = a.projectId.toString();
      attemptsByProject.set(key, [...(attemptsByProject.get(key) ?? []), a]);
    }

    return res.json({
      projects: projects.map((p) => {
        const projectAttempts = attemptsByProject.get(p._id.toString()) ?? [];
        const best = projectAttempts.reduce((m, a) => Math.max(m, Math.round((a.score / a.total) * 100)), 0);
        return {
          id: p._id.toString(),
          name: p.name,
          sourceType: p.sourceType,
          sourceName: p.sourceName,
          flashcards: deckStats(deckByProject.get(p._id.toString()) ?? null),
          quiz: {
            attempts: projectAttempts.length,
            bestPercent: projectAttempts.length > 0 ? best : null,
            lastPercent: projectAttempts[0] ? Math.round((projectAttempts[0].score / projectAttempts[0].total) * 100) : null,
          },
        };
      }),
    });
  })
);

// GET /api/study/:projectId — the project's flashcard deck and quiz history.
studyRouter.get(
  '/:projectId',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const project = await loadOwnedProject(String(req.params.projectId), userId);
    const [deck, attempts] = await Promise.all([
      FlashcardDeck.findOne({ projectId: project._id, userId }),
      QuizAttempt.find({ projectId: project._id, userId }).sort({ createdAt: -1 }).limit(20).lean(),
    ]);

    return res.json({
      project: { id: project._id.toString(), name: project.name, sourceName: project.sourceName, language: project.config?.language },
      deck: serializeDeck(deck),
      quizAttempts: attempts.map((a) => ({ id: a._id.toString(), score: a.score, total: a.total, createdAt: a.createdAt })),
    });
  })
);

// POST /api/study/:projectId/flashcards — generates cards (or adds more to an
// existing deck, skipping prompts the learner already has).
studyRouter.post(
  '/:projectId/flashcards',
  authenticateToken,
  aiRateLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const project = await loadOwnedProject(String(req.params.projectId), userId);
    if (project.status !== 'Completed') throw new AppError(400, 'This project has not finished processing yet.');

    const count = Math.min(MAX_CARDS, Math.max(MIN_CARDS, Number(req.body.count) || 10));
    const language = typeof req.body.language === 'string' && req.body.language ? req.body.language : project.config?.language || 'English';

    const existing = await FlashcardDeck.findOne({ projectId: project._id, userId });
    if (existing && existing.cards.length + count > MAX_CARDS_PER_DECK) {
      throw new AppError(400, `A deck can hold at most ${MAX_CARDS_PER_DECK} cards.`);
    }

    const context = await loadProjectText(project._id);
    if (!context) throw new AppError(400, 'No processed content was found for this project.');

    const drafts = await generateFlashcards(context, project.sourceName, count, language, existing?.cards.map((c) => c.front) ?? []);
    const now = new Date();
    const newCards = drafts.map((d) => ({ ...d, box: 1, dueAt: now, reviewCount: 0, correctCount: 0 }));

    const deck = await FlashcardDeck.findOneAndUpdate(
      { projectId: project._id, userId },
      { $push: { cards: { $each: newCards } }, $setOnInsert: { language } },
      { upsert: true, new: true }
    );

    await AuditLog.create({ userId, projectId: project._id, action: 'FLASHCARDS_GENERATED', detail: `Generated ${drafts.length} flashcards for "${project.name}"` });
    return res.status(201).json({ deck: serializeDeck(deck), added: drafts.length });
  })
);

// POST /api/study/:projectId/flashcards/:cardId/review — records a recall
// grade and reschedules the card.
studyRouter.post(
  '/:projectId/flashcards/:cardId/review',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const project = await loadOwnedProject(String(req.params.projectId), userId);
    const grade = req.body.grade as ReviewGrade;
    if (!REVIEW_GRADES.includes(grade)) throw new AppError(400, `grade must be one of: ${REVIEW_GRADES.join(', ')}`);

    const deck = await FlashcardDeck.findOne({ projectId: project._id, userId });
    const card = deck?.cards.id(String(req.params.cardId));
    if (!deck || !card) throw new AppError(404, 'Flashcard not found');

    const now = new Date();
    const { box, dueAt } = scheduleReview(card.box, grade, now);
    card.box = box;
    card.dueAt = dueAt;
    card.reviewCount += 1;
    if (grade !== 'again') card.correctCount += 1;
    card.lastReviewedAt = now;
    await deck.save();

    return res.json({
      card: { id: card._id.toString(), box: card.box, dueAt: card.dueAt, reviewCount: card.reviewCount, correctCount: card.correctCount },
      stats: deckStats(deck, now),
    });
  })
);

// DELETE /api/study/:projectId/flashcards/:cardId — remove a card the learner doesn't want.
studyRouter.delete(
  '/:projectId/flashcards/:cardId',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const project = await loadOwnedProject(String(req.params.projectId), userId);
    const deck = await FlashcardDeck.findOne({ projectId: project._id, userId });
    const card = deck?.cards.id(String(req.params.cardId));
    if (!deck || !card) throw new AppError(404, 'Flashcard not found');

    card.deleteOne();
    await deck.save();
    return res.json({ success: true, stats: deckStats(deck) });
  })
);

// POST /api/study/:projectId/flashcards/reset — put every card back to box 1 and due now.
studyRouter.post(
  '/:projectId/flashcards/reset',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const project = await loadOwnedProject(String(req.params.projectId), userId);
    const deck = await FlashcardDeck.findOne({ projectId: project._id, userId });
    if (!deck) throw new AppError(404, 'No flashcard deck for this project yet');

    const now = new Date();
    for (const card of deck.cards) {
      card.box = 1;
      card.dueAt = now;
    }
    await deck.save();
    return res.json({ deck: serializeDeck(deck) });
  })
);

// POST /api/study/:projectId/quiz-attempts — records a completed quiz score.
studyRouter.post(
  '/:projectId/quiz-attempts',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const project = await loadOwnedProject(String(req.params.projectId), userId);
    const score = Number(req.body.score);
    const total = Number(req.body.total);
    if (!Number.isInteger(total) || total < 1 || !Number.isInteger(score) || score < 0 || score > total) {
      throw new AppError(400, 'score and total must be integers with 0 <= score <= total and total >= 1');
    }
    const outputId = typeof req.body.outputId === 'string' && Types.ObjectId.isValid(req.body.outputId) ? req.body.outputId : undefined;

    const attempt = await QuizAttempt.create({ userId, projectId: project._id, outputId, score, total });
    await AuditLog.create({ userId, projectId: project._id, action: 'QUIZ_ATTEMPTED', detail: `Scored ${score}/${total} on "${project.name}"` });

    return res.status(201).json({ attempt: { id: attempt._id.toString(), score, total, createdAt: attempt.createdAt } });
  })
);
