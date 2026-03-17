/**
 * Problem Stories — minimal in-memory store for ZHC1 iteration feed.
 *
 * Data shape follows docs/zhc1-tdd-spec.md §4.1.
 * Replace with SQLite persistence when we outgrow the prototype.
 */

const { randomUUID } = require('crypto');

/** @type {Map<string, import('./evaluation').ProblemStory>} */
const store = new Map();

/**
 * Create a new Problem Story in draft state.
 * @param {object} opts
 * @param {string} opts.problemDescription
 * @param {string} [opts.id]
 * @returns {import('./evaluation').ProblemStory}
 */
function createProblemStory({ problemDescription, id }) {
  const now = new Date().toISOString();
  const story = {
    id: id || randomUUID(),
    createdAt: now,
    updatedAt: now,
    problemDescription,
    constraints: [],
    preferences: [],
    context: [],
    evaluationFunction: {
      target: '',
      metrics: [],
      baselineScores: {},
      convergenceThreshold: undefined,
      confirmedAt: undefined,
    },
    feedbackRounds: [],
    totalIterations: 0,
    status: 'draft',
  };
  store.set(story.id, story);
  return story;
}

/**
 * Get a Problem Story by ID. Returns undefined if not found.
 * @param {string} id
 * @returns {import('./evaluation').ProblemStory | undefined}
 */
function getProblemStory(id) {
  return store.get(id);
}

/**
 * Update a Problem Story (partial merge). Returns updated story or undefined.
 * @param {string} id
 * @param {Partial<import('./evaluation').ProblemStory>} patch
 * @returns {import('./evaluation').ProblemStory | undefined}
 */
function updateProblemStory(id, patch) {
  const story = store.get(id);
  if (!story) return undefined;
  Object.assign(story, patch, { updatedAt: new Date().toISOString() });
  return story;
}

/**
 * List all Problem Stories.
 * @returns {import('./evaluation').ProblemStory[]}
 */
function listProblemStories() {
  return Array.from(store.values());
}

/**
 * Delete a Problem Story. Returns true if deleted.
 * @param {string} id
 * @returns {boolean}
 */
function deleteProblemStory(id) {
  return store.delete(id);
}

/** Reset store (useful for tests). */
function _resetStore() {
  store.clear();
}

// ---------------------------------------------------------------------------
// Express router (app-level)
// ---------------------------------------------------------------------------

const express = require('express');
const problemStoriesRouter = express.Router();

const VALID_STATUSES = ['draft', 'active', 'converged', 'saved', 'published'];

/** Deep merge helper for partial updates. */
function deepMerge(target, source) {
  const out = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] != null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      typeof target[key] === 'object' &&
      target[key] != null &&
      !Array.isArray(target[key])
    ) {
      out[key] = deepMerge(target[key], source[key]);
    } else {
      out[key] = source[key];
    }
  }
  return out;
}

// POST / — create a new Problem Story
problemStoriesRouter.post('/', (req, res) => {
  const story = createProblemStory({
    problemDescription: req.body.problemDescription || '',
    id: req.body.id, // allow tests to inject ID
  });
  // Apply any extra fields from body (constraints, preferences, etc.)
  if (req.body.constraints) story.constraints = req.body.constraints;
  if (req.body.preferences) story.preferences = req.body.preferences;
  if (req.body.context) story.context = req.body.context;
  if (req.body.evaluationFunction) {
    Object.assign(story.evaluationFunction, req.body.evaluationFunction);
  }
  if (req.body.status && VALID_STATUSES.includes(req.body.status)) {
    story.status = req.body.status;
  }
  story.updatedAt = new Date().toISOString();
  store.set(story.id, story);
  res.status(201).json(story);
});

// GET /latest — most recent Problem Story by createdAt
problemStoriesRouter.get('/latest', (_req, res) => {
  const all = listProblemStories();
  if (all.length === 0) {
    return res.status(404).json({ ok: false, error: 'NO_PROBLEM_STORIES' });
  }
  const latest = all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  res.json(latest);
});

// GET /:id — get by ID
problemStoriesRouter.get('/:id', (req, res) => {
  const story = getProblemStory(req.params.id);
  if (!story) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  res.json(story);
});

// PUT /:id — partial update
problemStoriesRouter.put('/:id', (req, res) => {
  const existing = getProblemStory(req.params.id);
  if (!existing) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });

  if (req.body.status !== undefined && !VALID_STATUSES.includes(req.body.status)) {
    return res.status(400).json({
      ok: false,
      error: `INVALID_STATUS: must be one of ${VALID_STATUSES.join(', ')}`,
    });
  }

  const updated = deepMerge(existing, req.body);
  updated.updatedAt = new Date().toISOString();
  store.set(existing.id, updated);
  res.json(updated);
});

// POST /:id/eval-proposals/metrics — add metric to evaluationFunction.metrics
problemStoriesRouter.post('/:id/eval-proposals/metrics', (req, res) => {
  const story = getProblemStory(req.params.id);
  if (!story) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });

  const { name, type, direction, unit, range, assessmentPrompt, weight } = req.body;
  if (!name || !type || !direction) {
    return res.status(400).json({
      ok: false,
      error: 'Metric requires name, type, and direction',
    });
  }

  const metric = {
    id: randomUUID(),
    name,
    type,
    direction,
    ...(unit !== undefined && { unit }),
    ...(range !== undefined && { range }),
    ...(assessmentPrompt !== undefined && { assessmentPrompt }),
    ...(weight !== undefined && { weight }),
  };

  story.evaluationFunction.metrics.push(metric);
  story.updatedAt = new Date().toISOString();
  store.set(story.id, story);

  res.status(201).json(metric);
});

module.exports = {
  createProblemStory,
  getProblemStory,
  updateProblemStory,
  listProblemStories,
  deleteProblemStory,
  _resetStore,
  problemStoriesRouter,
};
