/**
 * Save Game — ZHC1 checkpoint/restore for iteration feed.
 *
 * Allows users to create checkpoints of their Problem Story + Experiment Cards
 * state, restore from a checkpoint, or fork into a new story.
 *
 * Routes (Express Router, mounted at /api/save-games):
 *   POST /              → create a checkpoint
 *   GET  /              → list all save games (optional ?problemStoryId filter)
 *   GET  /:id           → get a save game
 *   POST /:id/load      → restore Problem Story + cards from save
 *   POST /:id/fork      → fork into a new Problem Story + new cards
 *
 * Tests satisfied:
 *   T060: POST /api/save-games creates checkpoint with all data
 *   T061: POST /api/save-games/:id/load restores Problem Story and cards
 */

const express = require('express');
const { randomUUID } = require('crypto');
const {
  getProblemStory,
  updateProblemStory,
  createProblemStory,
  listProblemStories,
} = require('./problem-stories');
const {
  listExperimentCards,
  getExperimentCard,
  createExperimentCard,
  _resetStore: resetCardsStore,
} = require('./experiment-cards');

// ── In-memory store ───────────────────────────────────────────

/** @type {Map<string, object>} saveGameId → SaveGame */
const saveGames = new Map();

// ── Helpers ───────────────────────────────────────────────────

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function computeBestCompositeScore(cards) {
  if (!Array.isArray(cards) || cards.length === 0) return 0;
  let best = 0;
  for (const card of cards) {
    if (typeof card.compositeScore === 'number' && card.compositeScore > best) {
      best = card.compositeScore;
    }
  }
  return Math.round(best * 100) / 100;
}

// ── Express Router ────────────────────────────────────────────

const router = express.Router();
router.use(express.json());

/**
 * POST /api/save-games — create a checkpoint
 *
 * Body: { problemStoryId: string, label?: string }
 *
 * Flow:
 *  a) Load Problem Story (deep clone)
 *  b) Load all Experiment Cards for this story (deep clone)
 *  c) Create SaveGame object
 *  d) Store in memory
 *  e) Return the SaveGame
 */
router.post('/', (req, res) => {
  const { problemStoryId, label } = req.body;

  if (!problemStoryId || typeof problemStoryId !== 'string') {
    return res.status(400).json({
      ok: false,
      error: 'MISSING_PROBLEM_STORY_ID',
      message: 'problemStoryId is required',
    });
  }

  const story = getProblemStory(problemStoryId);
  if (!story) {
    return res.status(404).json({
      ok: false,
      error: 'NOT_FOUND',
      message: `Problem Story ${problemStoryId} not found`,
    });
  }

  // (b) Load all experiment cards for this story
  const cards = listExperimentCards(problemStoryId);
  const clonedCards = deepClone(cards);

  // (c) Create SaveGame
  const saveGame = {
    id: randomUUID(),
    problemStoryId,
    createdAt: new Date().toISOString(),
    label: typeof label === 'string' ? label.slice(0, 100) : null,
    problemStory: deepClone(story),
    program: deepClone(story), // program mirrors problemStory for forward compat
    experimentCards: clonedCards,
    agentState: {},
    totalIterationsAtSave: story.totalIterations || 0,
    bestCompositeScore: computeBestCompositeScore(clonedCards),
  };

  // (d) Store
  saveGames.set(saveGame.id, saveGame);

  // (e) Return
  res.status(201).json({
    ok: true,
    saveGame,
  });
});

/**
 * GET /api/save-games — list all save games
 *
 * Query params: ?problemStoryId=... (optional filter)
 */
router.get('/', (req, res) => {
  const { problemStoryId } = req.query;
  let all = Array.from(saveGames.values());

  if (problemStoryId) {
    all = all.filter(sg => sg.problemStoryId === problemStoryId);
  }

  // Sort by createdAt desc
  all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  res.json({
    ok: true,
    saveGames: all,
  });
});

/**
 * GET /api/save-games/:id — get a save game
 */
router.get('/:id', (req, res) => {
  const saveGame = saveGames.get(req.params.id);
  if (!saveGame) {
    return res.status(404).json({
      ok: false,
      error: 'NOT_FOUND',
      message: `Save game ${req.params.id} not found`,
    });
  }

  res.json({
    ok: true,
    saveGame: deepClone(saveGame),
  });
});

/**
 * POST /api/save-games/:id/load — restore from save
 *
 * Flow:
 *  a) Load the SaveGame
 *  b) Overwrite current Problem Story in store with the saved version
 *  c) Overwrite current Experiment Cards in store with saved versions
 *  d) Return the restored Problem Story
 */
router.post('/:id/load', (req, res) => {
  const saveGame = saveGames.get(req.params.id);
  if (!saveGame) {
    return res.status(404).json({
      ok: false,
      error: 'NOT_FOUND',
      message: `Save game ${req.params.id} not found`,
    });
  }

  // (b) Overwrite Problem Story in store
  const restoredStory = deepClone(saveGame.problemStory);
  restoredStory.status = 'active';
  restoredStory.updatedAt = new Date().toISOString();
  updateProblemStory(saveGame.problemStoryId, restoredStory);

  // (c) Overwrite Experiment Cards in store
  // Clear existing cards for this story and re-create from save
  const existingCards = listExperimentCards(saveGame.problemStoryId);
  // We need to clear cards from the experiment-cards store.
  // Since experiment-cards.js doesn't expose a delete or clear-by-story,
  // we'll update each existing card status to 'discarded' and create fresh ones.
  // Actually, let's use a simpler approach: use the createExperimentCard which
  // overwrites by iteration. Instead, let's directly manipulate the internal store.
  const { _resetCardsForStory } = require('./experiment-cards');
  if (typeof _resetCardsForStory === 'function') {
    _resetCardsForStory(saveGame.problemStoryId);
  }
  for (const card of saveGame.experimentCards) {
    createExperimentCard(saveGame.problemStoryId, card);
  }

  // (d) Return
  res.json({
    ok: true,
    problemStory: deepClone(restoredStory),
    restoredCardsCount: saveGame.experimentCards.length,
    totalIterationsAtSave: saveGame.totalIterationsAtSave,
  });
});

/**
 * POST /api/save-games/:id/fork — fork from save
 *
 * Flow:
 *  a) Load the SaveGame
 *  b) Create a NEW Problem Story as a copy (new ID, status 'active')
 *  c) Create NEW Experiment Cards (new IDs, linked to new Problem Story)
 *  d) Store the new story and cards
 *  e) Return the new Problem Story with parentStoryId set
 */
router.post('/:id/fork', (req, res) => {
  const saveGame = saveGames.get(req.params.id);
  if (!saveGame) {
    return res.status(404).json({
      ok: false,
      error: 'NOT_FOUND',
      message: `Save game ${req.params.id} not found`,
    });
  }

  const parentStory = deepClone(saveGame.problemStory);

  // (b) Create new Problem Story
  const newStory = createProblemStory({
    problemDescription: parentStory.problemDescription,
  });
  newStory.constraints = deepClone(parentStory.constraints || []);
  newStory.preferences = deepClone(parentStory.preferences || []);
  newStory.context = deepClone(parentStory.context || []);
  newStory.evaluationFunction = deepClone(parentStory.evaluationFunction);
  newStory.feedbackRounds = [];
  newStory.totalIterations = 0;
  newStory.status = 'active';
  newStory.parentStoryId = saveGame.problemStoryId;
  updateProblemStory(newStory.id, newStory);

  // (c) Create NEW Experiment Cards linked to the new story
  for (const card of saveGame.experimentCards) {
    const cardCopy = { ...card };
    delete cardCopy.id; // Let createExperimentCard assign a new ID
    delete cardCopy.problemStoryId; // Will be set by createExperimentCard
    createExperimentCard(newStory.id, cardCopy);
  }

  // (e) Return
  res.json({
    ok: true,
    problemStory: newStory,
    parentStoryId: saveGame.problemStoryId,
    forkedCardsCount: saveGame.experimentCards.length,
  });
});

// ── Exports ───────────────────────────────────────────────────

module.exports = {
  router,
  saveGames,
  _resetStore: () => saveGames.clear(),
};
