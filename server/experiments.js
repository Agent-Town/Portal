/**
 * Experiments API — ZHC1 experiment execution routes.
 *
 * Replaces the M1 stub with the real experiment runner.
 *
 * Routes:
 *   POST /api/experiments/start  → run an experiment round
 */

const { Router } = require('express');
const { runExperimentRound } = require('./experiment-runner');
const { getProblemStory } = require('./problem-stories');

const router = Router();

// ---------------------------------------------------------------------------
// POST /api/experiments/start — start an experiment round
// ---------------------------------------------------------------------------
router.post('/start', async (req, res) => {
  const { problemStoryId, numExperiments, timeBudgetMs } = req.body;

  if (!problemStoryId) {
    return res.status(400).json({
      ok: false,
      error: 'problemStoryId is required',
    });
  }

  // Load and validate Problem Story
  const story = getProblemStory(problemStoryId);
  if (!story) {
    return res.status(404).json({
      ok: false,
      error: 'NOT_FOUND',
    });
  }

  // Verify status is active
  if (story.status !== 'active') {
    return res.status(400).json({
      ok: false,
      error: `Problem Story status is "${story.status}", expected "active". Confirm evaluation before running experiments.`,
    });
  }

  // Verify evaluation function metrics exist
  const metrics = story.evaluationFunction?.metrics;
  if (!metrics || metrics.length === 0) {
    return res.status(400).json({
      ok: false,
      error: 'Define how to measure success before running experiments — evaluation function metrics are required',
    });
  }

  // Run the experiment round
  try {
    const result = await runExperimentRound({
      problemStoryId,
      numExperiments: numExperiments || undefined,
      timeBudgetMs: timeBudgetMs || undefined,
    });

    const response = {
      ok: true,
      problemStoryId,
      roundNumber: result.roundNumber,
      cards: result.cards,
      cardsCreated: result.cards.length,
    };

    if (result.warnings.length > 0) {
      response.warnings = result.warnings;
    }

    res.status(201).json(response);
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.message || 'EXPERIMENT_ROUND_FAILED',
    });
  }
});

module.exports = router;
