/**
 * Iteration Loop — ZHC1 §7.6
 *
 * Controls the feedback → experiment → convergence cycle.
 *
 * Routes (Express Router):
 *   POST /api/iteration-loop/next-round           → trigger next experiment round
 *   GET  /api/iteration-loop/convergence-status    → check convergence
 *   GET  /api/iteration-loop/score-trend           → score trend for sparkline
 *
 * Tests satisfied:
 *   T050: After feedback on cards → next round triggered, new cards created
 *   T051: Convergence detected when improvement plateaus for 3 rounds
 *   T052: Score trend endpoint returns data for sparkline rendering
 */

const express = require('express');
const { listExperimentCards, createExperimentCard } = require('./experiment-cards');
const { getProblemStory, updateProblemStory } = require('./problem-stories');

// ── Convergence detection constants ─────────────────────────────────

/** Improvement rate threshold below which we count a round as "no improvement" */
const IMPROVEMENT_RATE_THRESHOLD = 0.03;

/** Number of consecutive rounds with low improvement before declaring convergence */
const CONVERGENCE_PLATEAU_ROUNDS = 3;

// ── Experiment runner stub ─────────────────────────────────────────

/**
 * Run an experiment round for a Problem Story.
 *
 * In production this would call the experiment engine (LLM, code gen, etc).
 * For now it generates mock cards so the iteration loop can be tested end-to-end.
 *
 * @param {string} problemStoryId
 * @param {number} roundNumber
 * @param {object} story — the Problem Story (for constraints/preferences context)
 * @returns {object[]} array of created cards
 */
function runExperimentRound(problemStoryId, roundNumber, story) {
  const now = new Date().toISOString();

  // Generate 2–3 mock cards per round
  const numCards = 2 + Math.floor(Math.random() * 2); // 2 or 3

  const cards = [];
  for (let i = 0; i < numCards; i++) {
    // Simulate improving scores over rounds (with some noise)
    const baseImprovement = Math.min(roundNumber * 0.08, 0.6);
    const noise = (Math.random() - 0.3) * 0.15; // slight upward bias + variance
    const compositeScore = Math.max(0.1, Math.min(0.99,
      0.3 + baseImprovement + noise + (i * 0.03)
    ));

    const card = createExperimentCard(problemStoryId, {
      roundNumber,
      compositeScore,
      agentSummary: `Round ${roundNumber} experiment variant ${i + 1}`,
      deltaFromLast: `Iterating on feedback from round ${roundNumber - 1 || 'baseline'}`,
      visual: {
        type: 'css_gradient',
        url: '',
        alt: `Experiment round ${roundNumber} variant ${i + 1}`,
      },
      status: 'pending_review',
    });

    cards.push(card);
  }

  return cards;
}

// ── Helpers ────────────────────────────────────────────────────────

/**
 * Get the current round number for a story based on existing cards.
 * @param {string} problemStoryId
 * @returns {number}
 */
function getCurrentRoundNumber(problemStoryId) {
  const cards = listExperimentCards(problemStoryId);
  if (cards.length === 0) return 0;
  return Math.max(...cards.map((c) => c.roundNumber || 1));
}

/**
 * Check if there are reviewed cards in the current round.
 * "Reviewed" means the card has feedback and a non-pending status.
 * @param {string} problemStoryId
 * @returns {boolean}
 */
function hasReviewedCardsInCurrentRound(problemStoryId) {
  const cards = listExperimentCards(problemStoryId);
  const currentRound = getCurrentRoundNumber(problemStoryId);
  if (currentRound === 0) return false;

  const currentRoundCards = cards.filter((c) => c.roundNumber === currentRound);
  return currentRoundCards.some((c) => c.feedback && c.status !== 'pending_review');
}

/**
 * Compute per-round score summary (best and average composite scores).
 * @param {string} problemStoryId
 * @returns {Array<{round: number, bestScore: number, avgScore: number}>}
 */
function computeRoundSummaries(problemStoryId) {
  const cards = listExperimentCards(problemStoryId);

  // Group by round
  const byRound = new Map();
  for (const card of cards) {
    const round = card.roundNumber || 1;
    if (!byRound.has(round)) byRound.set(round, []);
    byRound.get(round).push(card);
  }

  const summaries = [];
  for (const [round, roundCards] of byRound) {
    const scores = roundCards.map((c) => c.compositeScore || 0);
    const bestScore = Math.max(...scores);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    summaries.push({
      round,
      bestScore: Math.round(bestScore * 100) / 100,
      avgScore: Math.round(avgScore * 100) / 100,
    });
  }

  return summaries.sort((a, b) => a.round - b.round);
}

/**
 * Compute improvement rates between consecutive round summaries.
 * Improvement rate = (later composite - earlier composite) / earlier composite
 * Uses bestScore as the composite per round.
 * @param {Array<{round: number, bestScore: number}>} summaries
 * @returns {Array<{round: number, rate: number}>}
 */
function computeImprovementRates(summaries) {
  if (summaries.length < 2) return [];

  const rates = [];
  for (let i = 1; i < summaries.length; i++) {
    const prev = summaries[i - 1].bestScore;
    const curr = summaries[i].bestScore;
    const rate = prev > 0 ? (curr - prev) / prev : 0;
    rates.push({
      round: summaries[i].round,
      rate: Math.round(rate * 1000) / 1000,
    });
  }

  return rates;
}

/**
 * Check convergence status for a Problem Story.
 * @param {string} problemStoryId
 * @returns {{
 *   converged: boolean,
 *   currentScore: number,
 *   improvementRate: number,
 *   roundsWithoutImprovement: number,
 *   message: string
 * }}
 */
function checkConvergence(problemStoryId) {
  const story = getProblemStory(problemStoryId);
  const summaries = computeRoundSummaries(problemStoryId);

  // If no rounds, no convergence
  if (summaries.length === 0) {
    return {
      converged: false,
      currentScore: 0,
      improvementRate: 0,
      roundsWithoutImprovement: 0,
      message: 'No experiment rounds yet.',
    };
  }

  const latestRound = summaries[summaries.length - 1];
  const currentScore = latestRound.bestScore;

  // Check convergence threshold from Problem Story
  const threshold = story?.evaluationFunction?.convergenceThreshold;
  if (typeof threshold === 'number' && currentScore >= threshold) {
    return {
      converged: true,
      currentScore,
      improvementRate: 0,
      roundsWithoutImprovement: 0,
      message: `Best score ${currentScore} meets convergence threshold ${threshold}. Ready to finish?`,
    };
  }

  // Check plateau detection across last 3 rounds
  const rates = computeImprovementRates(summaries);
  let roundsWithoutImprovement = 0;

  // Count consecutive rounds (from most recent) with rate < threshold
  for (let i = rates.length - 1; i >= 0; i--) {
    if (rates[i].rate < IMPROVEMENT_RATE_THRESHOLD) {
      roundsWithoutImprovement++;
    } else {
      break;
    }
  }

  const latestRate = rates.length > 0 ? rates[rates.length - 1].rate : 0;
  const converged = roundsWithoutImprovement >= CONVERGENCE_PLATEAU_ROUNDS;

  let message;
  if (converged) {
    message = 'Your solution is converging. Ready to finish?';
  } else if (roundsWithoutImprovement > 0) {
    message = `Improvement slowing down — ${roundsWithoutImprovement} round${roundsWithoutImprovement > 1 ? 's' : ''} with low improvement. Keep iterating.`;
  } else {
    message = 'Good improvement trajectory. Keep iterating!';
  }

  return {
    converged,
    currentScore,
    improvementRate: latestRate,
    roundsWithoutImprovement,
    message,
  };
}

// ── Express Router ─────────────────────────────────────────────────

const router = express.Router();
router.use(express.json());

/**
 * POST /api/iteration-loop/next-round
 *
 * Trigger next experiment round after feedback.
 * Body: { problemStoryId: string }
 */
router.post('/next-round', (req, res) => {
  const { problemStoryId } = req.body;

  if (!problemStoryId || typeof problemStoryId !== 'string') {
    return res.status(400).json({
      ok: false,
      error: 'problemStoryId is required',
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

  // Check if there are reviewed cards from the current round
  const currentRound = getCurrentRoundNumber(problemStoryId);
  if (currentRound > 0 && !hasReviewedCardsInCurrentRound(problemStoryId)) {
    return res.status(400).json({
      ok: false,
      error: 'NEED_FEEDBACK_FIRST',
      message: 'Need feedback on current round cards first',
    });
  }

  // Determine next round number
  const nextRound = currentRound + 1;

  // Run experiment round (creates new cards)
  const newCards = runExperimentRound(problemStoryId, nextRound, story);

  // Update Problem Story total iterations
  story.totalIterations = (story.totalIterations || 0) + newCards.length;
  story.updatedAt = new Date().toISOString();
  updateProblemStory(problemStoryId, story);

  res.json({
    ok: true,
    data: {
      roundNumber: nextRound,
      cardsCreated: newCards.length,
      cards: newCards,
      message: `Round ${nextRound} started with ${newCards.length} experiment variants`,
    },
  });
});

/**
 * GET /api/iteration-loop/convergence-status
 *
 * Check convergence for a Problem Story.
 * Query: ?problemStoryId=<id>
 */
router.get('/convergence-status', (req, res) => {
  const { problemStoryId } = req.query;

  if (!problemStoryId || typeof problemStoryId !== 'string') {
    return res.status(400).json({
      ok: false,
      error: 'problemStoryId query parameter is required',
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

  const status = checkConvergence(problemStoryId);

  res.json({
    ok: true,
    data: status,
  });
});

/**
 * GET /api/iteration-loop/score-trend
 *
 * Score trend data for sparkline rendering.
 * Query: ?problemStoryId=<id>
 */
router.get('/score-trend', (req, res) => {
  const { problemStoryId } = req.query;

  if (!problemStoryId || typeof problemStoryId !== 'string') {
    return res.status(400).json({
      ok: false,
      error: 'problemStoryId query parameter is required',
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

  const summaries = computeRoundSummaries(problemStoryId);

  // Baseline comes from Problem Story evaluationFunction.baselineScores
  const baselineScores = story?.evaluationFunction?.baselineScores || {};
  const baselineEntries = Object.values(baselineScores);
  const baseline = baselineEntries.length > 0
    ? Math.round((baselineEntries.reduce((a, b) => a + b, 0) / baselineEntries.length) * 100) / 100
    : 0.3; // default baseline for new stories

  res.json({
    ok: true,
    data: {
      points: summaries,
      baseline,
    },
  });
});

// ── Exports ────────────────────────────────────────────────────────

module.exports = {
  router,
  runExperimentRound,
  getCurrentRoundNumber,
  hasReviewedCardsInCurrentRound,
  computeRoundSummaries,
  computeImprovementRates,
  checkConvergence,
  IMPROVEMENT_RATE_THRESHOLD,
  CONVERGENCE_PLATEAU_ROUNDS,
};
