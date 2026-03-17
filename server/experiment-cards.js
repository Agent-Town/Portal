/**
 * Experiment Cards — ZHC1 iteration feed data model and API.
 *
 * Stores experiment cards per Problem Story in an in-memory Map.
 * Follows spec §4.3 data model.
 *
 * Routes (mounted on /api/problem-stories):
 *   POST /:id/experiment-cards     — create an experiment card
 *   GET  /:id/experiment-cards     — list cards for a story (iteration desc)
 */

const express = require('express');
const { randomUUID } = require('crypto');
const { getProblemStory } = require('./problem-stories');

// ── In-memory store ────────────────────────────────────────────────

/** @type {Map<string, Map<string, object>>} storyId → cardId → card */
const stories = new Map();

function getCardsForStory(storyId) {
  if (!stories.has(storyId)) stories.set(storyId, new Map());
  return stories.get(storyId);
}

// ── Validation helpers ─────────────────────────────────────────────

const VALID_STATUSES = ['pending_review', 'kept', 'discarded', 'refined'];

function clampString(value, maxLen) {
  if (typeof value !== 'string') return '';
  return value.length > maxLen ? value.slice(0, maxLen) : value;
}

function clampScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

// ── Card creation ──────────────────────────────────────────────────

/**
 * Create an experiment card.
 * @param {string} problemStoryId
 * @param {object} opts — partial card fields
 * @returns {object} the created card
 */
function createExperimentCard(problemStoryId, opts = {}) {
  const story = getProblemStory(problemStoryId);
  const cards = getCardsForStory(problemStoryId);

  // Determine iteration number: max existing iteration + 1
  let maxIter = 0;
  for (const c of cards.values()) {
    if (c.iterationNumber > maxIter) maxIter = c.iterationNumber;
  }
  const iterationNumber = opts.iterationNumber || maxIter + 1;
  const roundNumber = opts.roundNumber || 1;
  const now = new Date().toISOString();

  // Compute delta from last iteration (if there's a previous card)
  let deltaScore = 0;
  if (cards.size > 0) {
    let bestPrev = null;
    for (const c of cards.values()) {
      if (!bestPrev || c.iterationNumber > bestPrev.iterationNumber) bestPrev = c;
    }
    if (bestPrev && bestPrev.compositeScore != null) {
      deltaScore = clampScore(opts.compositeScore) - bestPrev.compositeScore;
    }
  }

  const card = {
    id: opts.id || randomUUID(),
    problemStoryId,
    iterationNumber,
    roundNumber,
    createdAt: now,
    durationMs: typeof opts.durationMs === 'number' ? opts.durationMs : null,

    // Visual snapshot
    visual: {
      type: opts.visual?.type || 'css_gradient',
      url: opts.visual?.url || '',
      thumbnailUrl: opts.visual?.thumbnailUrl || '',
      alt: opts.visual?.alt || '',
      codeTrace: opts.visual?.codeTrace || '',
    },

    // Code reference
    codeReference: {
      filePath: opts.codeReference?.filePath || '',
      diffSummary: opts.codeReference?.diffSummary || '',
      commitHash: opts.codeReference?.commitHash || '',
    },

    // Text summaries
    agentSummary: clampString(opts.agentSummary || '', 280),
    deltaFromLast: clampString(opts.deltaFromLast || '', 200),

    // Scores
    scores: opts.scores || {},
    compositeScore: clampScore(opts.compositeScore),
    deltaScore: Math.round(deltaScore * 100) / 100,

    // Status + feedback
    status: VALID_STATUSES.includes(opts.status) ? opts.status : 'pending_review',
    feedback: opts.feedback || null,
  };

  cards.set(card.id, card);
  return card;
}

/**
 * List all experiment cards for a story, sorted by iteration desc.
 */
function listExperimentCards(storyId) {
  const cards = getCardsForStory(storyId);
  return Array.from(cards.values()).sort((a, b) => b.iterationNumber - a.iterationNumber);
}

/**
 * Get a single experiment card by ID.
 */
function getExperimentCard(storyId, cardId) {
  return getCardsForStory(storyId).get(cardId) || null;
}

/**
 * Look up any card across all stories by card ID.
 * Used by feedback.js which only knows the card ID.
 * @param {string} cardId
 * @returns {object|null}
 */
function getCardById(cardId) {
  for (const cards of stories.values()) {
    const card = cards.get(cardId);
    if (card) return card;
  }
  return null;
}

/**
 * Update a card in-place (by card ID, any story).
 * Used by feedback.js to set status and feedback fields.
 * @param {string} cardId
 * @param {object} patch
 * @returns {object|null} updated card, or null
 */
function updateCardById(cardId, patch) {
  for (const cards of stories.values()) {
    const card = cards.get(cardId);
    if (card) {
      Object.assign(card, patch);
      return card;
    }
  }
  return null;
}

// ── Express Router ─────────────────────────────────────────────────

const experimentCardsRouter = express.Router();

/**
 * POST /api/problem-stories/:id/experiment-cards
 *
 * Create a new experiment card for a problem story.
 * Body: experiment card fields (see §4.3)
 */
experimentCardsRouter.post('/:id/experiment-cards', (req, res) => {
  const storyId = req.params.id;
  const story = getProblemStory(storyId);
  if (!story) {
    return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  }

  try {
    const card = createExperimentCard(storyId, req.body);
    res.status(201).json({ ok: true, card });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/problem-stories/:id/experiment-cards
 *
 * List all experiment cards for a story, sorted by iteration desc.
 */
experimentCardsRouter.get('/:id/experiment-cards', (req, res) => {
  const storyId = req.params.id;
  const story = getProblemStory(storyId);
  if (!story) {
    return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  }

  const cards = listExperimentCards(storyId);
  res.json({ ok: true, cards, problemStoryId: storyId });
});

module.exports = {
  experimentCardsRouter,
  createExperimentCard,
  listExperimentCards,
  getExperimentCard,
  getCardById,
  updateCardById,
  _resetStore: () => stories.clear(),
};
