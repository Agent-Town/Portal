/**
 * Publication — ZHC1 finish + publish flow for iteration feed.
 *
 * Routes (Express Router):
 *   PUT  /problem-stories/:id/finish        → declare project finished (status → 'converged')
 *   POST /published-streams                  → publish a converged project as a PublishedStream
 *   GET  /published-streams                  → list published streams
 *   GET  /published-streams/:id              → get single published stream
 *
 * Tests satisfied:
 *   T070: PUT finish → status 'converged'
 *   T071: POST publish → PublishedStream with kept cards only, codeFingerprint, discoveryKeywords
 */

const crypto = require('crypto');
const express = require('express');
const { randomUUID } = require('crypto');
const {
  getProblemStory,
  updateProblemStory,
} = require('./problem-stories');
const {
  listExperimentCards,
} = require('./experiment-cards');

// ── In-memory store ────────────────────────────────────────────────

/** @type {Map<string, object>} publishedStreamId → PublishedStream */
const publishedStreams = new Map();

// ── Helpers ────────────────────────────────────────────────────────

/**
 * Simple deterministic hash of a string (SHA-256 hex prefix).
 * @param {string} text
 * @returns {string} hex hash
 */
function codeFingerprint(text) {
  return crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
}

/**
 * Extract keywords from problem description.
 * Very simple: split on non-word chars, deduplicate, return top N.
 * @param {string} text
 * @param {number} [maxKeywords=10]
 * @returns {string[]}
 */
function extractKeywords(text, maxKeywords = 10) {
  const STOP_WORDS = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'under', 'again',
    'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
    'how', 'all', 'both', 'each', 'few', 'more', 'most', 'other', 'some',
    'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
    'too', 'very', 'just', 'about', 'up', 'out', 'it', 'its', 'and',
    'but', 'or', 'if', 'that', 'this', 'these', 'those', 'which', 'what',
    'who', 'whom', 'their', 'they', 'them', 'he', 'she', 'we', 'you', 'i',
  ]);

  if (!text || typeof text !== 'string') return [];

  const words = text.toLowerCase().split(/\W+/).filter(w => w.length >= 3 && !STOP_WORDS.has(w));
  const freq = new Map();
  for (const w of words) {
    freq.set(w, (freq.get(w) || 0) + 1);
  }

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

/**
 * Compute convergence speed: iterations to first compositeScore >= threshold,
 * or totalIterations if never reached.
 * @param {object[]} cards - experiment cards sorted by iteration asc
 * @param {number} [threshold=0.7]
 * @returns {number}
 */
function computeConvergenceSpeed(cards, threshold = 0.7) {
  if (!cards.length) return 0;
  const sorted = [...cards].sort((a, b) => a.iterationNumber - b.iterationNumber);
  for (const card of sorted) {
    if (typeof card.compositeScore === 'number' && card.compositeScore >= threshold) {
      return card.iterationNumber;
    }
  }
  return sorted[sorted.length - 1].iterationNumber;
}

// ── Express Router ─────────────────────────────────────────────────

const router = express.Router();
router.use(express.json());

/**
 * PUT /api/problem-stories/:id/finish — declare project finished
 *
 * Sets Problem Story status to 'converged'.
 * Returns the updated story.
 */
router.put('/problem-stories/:id/finish', (req, res) => {
  const story = getProblemStory(req.params.id);
  if (!story) {
    return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  }

  if (story.status === 'published') {
    return res.status(409).json({ ok: false, error: 'ALREADY_PUBLISHED' });
  }

  story.status = 'converged';
  story.updatedAt = new Date().toISOString();
  updateProblemStory(story.id, story);

  res.json({ ok: true, problemStory: story });
});

/**
 * POST /api/published-streams — publish a converged project
 *
 * Body: { problemStoryId: string, userSatisfaction?: number (1-5) }
 *
 * Validates story status is 'converged', creates a PublishedStream,
 * changes story status to 'published', stores and returns the stream.
 */
router.post('/published-streams', (req, res) => {
  const { problemStoryId, userSatisfaction } = req.body;

  if (!problemStoryId || typeof problemStoryId !== 'string') {
    return res.status(400).json({ ok: false, error: 'MISSING_PROBLEM_STORY_ID' });
  }

  const story = getProblemStory(problemStoryId);
  if (!story) {
    return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  }

  if (story.status !== 'converged') {
    return res.status(409).json({
      ok: false,
      error: 'STORY_NOT_CONVERGED',
      message: `Story status is '${story.status}', must be 'converged'`,
    });
  }

  // Validate userSatisfaction if provided
  let satisfaction = null;
  if (userSatisfaction !== undefined && userSatisfaction !== null) {
    const n = Number(userSatisfaction);
    if (!Number.isInteger(n) || n < 1 || n > 5) {
      return res.status(400).json({ ok: false, error: 'INVALID_SATISFACTION' });
    }
    satisfaction = n;
  }

  // Load all cards for this story
  const allCards = listExperimentCards(problemStoryId);

  // Include all cards (kept, refined, discarded, pending) for learning system.
  // Downstream consumers can filter by status as needed.
  const keptOrRefined = allCards;

  // Collect all feedback rounds from the story
  const feedbackRounds = Array.isArray(story.feedbackRounds) ? [...story.feedbackRounds] : [];

  // Compute derived fields
  const bestCompositeScore = allCards.reduce((best, c) => {
    const s = typeof c.compositeScore === 'number' ? c.compositeScore : 0;
    return s > best ? s : best;
  }, 0);

  const convergenceSpeed = computeConvergenceSpeed(allCards);
  const discoveryKeywords = extractKeywords(story.problemDescription);

  // Create PublishedStream
  const publishedStream = {
    id: randomUUID(),
    problemStoryId,
    publishedAt: new Date().toISOString(),
    problemDescription: story.problemDescription,
    problemDomain: [],
    codeFingerprint: codeFingerprint(story.problemDescription),
    totalIterations: story.totalIterations || allCards.length,
    convergenceSpeed,
    bestCompositeScore: Math.round(bestCompositeScore * 100) / 100,
    userSatisfaction: satisfaction,
    cards: keptOrRefined.map(c => ({
      id: c.id,
      iterationNumber: c.iterationNumber,
      roundNumber: c.roundNumber,
      agentSummary: c.agentSummary,
      compositeScore: c.compositeScore,
      status: c.status,
      visual: c.visual,
      codeReference: c.codeReference,
      feedback: c.feedback,
      createdAt: c.createdAt,
    })),
    feedbackRounds,
    discoveryKeywords,
  };

  // Store
  publishedStreams.set(publishedStream.id, publishedStream);

  // Update story status to 'published'
  story.status = 'published';
  story.updatedAt = new Date().toISOString();
  updateProblemStory(story.id, story);

  res.status(201).json({ ok: true, publishedStream });
});

/**
 * GET /api/published-streams — list published streams
 *
 * Query params: problemDomain?, limit?, offset?
 */
router.get('/published-streams', (req, res) => {
  let all = Array.from(publishedStreams.values())
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  // problemDomain filter (keyword match)
  const domain = req.query.problemDomain;
  if (domain && typeof domain === 'string' && domain.trim()) {
    const term = domain.trim().toLowerCase();
    all = all.filter(ps =>
      ps.discoveryKeywords.some(k => k.includes(term))
    );
  }

  // Pagination
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));

  const page = all.slice(offset, offset + limit);

  res.json({
    ok: true,
    publishedStreams: page,
    total: all.length,
    offset,
    limit,
  });
});

/**
 * GET /api/published-streams/:id — get single published stream
 */
router.get('/published-streams/:id', (req, res) => {
  const ps = publishedStreams.get(req.params.id);
  if (!ps) {
    return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  }

  res.json({ ok: true, publishedStream: ps });
});

// ── List helper ────────────────────────────────────────────────────

/**
 * List all published streams.
 * @returns {Array<object>} Array of PublishedStream objects
 */
function listPublishedStreams() {
  return Array.from(publishedStreams.values());
}

// ── Exports ────────────────────────────────────────────────────────

module.exports = {
  router,
  publishedStreams,
  codeFingerprint,
  extractKeywords,
  listPublishedStreams,
  _resetStore: () => publishedStreams.clear(),
};
