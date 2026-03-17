/**
 * Experiments API — ZHC1 stub (Milestone M1)
 *
 * Minimal endpoint to satisfy T003: blocks experiment execution when
 * evaluation function metrics are empty.
 *
 * Full experiment engine comes in a later milestone.
 */

const { Router } = require('express');
const { getProblemStory } = require('./problem-stories');

const router = Router();

// ---------------------------------------------------------------------------
// POST /api/experiments/start — start an experiment round
// ---------------------------------------------------------------------------
router.post('/start', (req, res) => {
  const { problemStoryId } = req.body;

  if (!problemStoryId) {
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
    });
  }

  const metrics = story.evaluationFunction?.metrics;
  if (!metrics || metrics.length === 0) {
    return res.status(400).json({
      ok: false,
      error: 'Define how to measure success before running experiments — evaluation function metrics are required',
    });
  }

  // Future: kick off experiment engine here
  res.status(501).json({
    ok: false,
    error: 'EXPERIMENT_ENGINE_NOT_IMPLEMENTED',
  });
});

module.exports = router;
