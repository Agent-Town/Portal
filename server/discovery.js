/**
 * Discovery Feed — ZHC1 T080, T081, T082
 *
 * Enables browsing published iteration streams and pulling insights
 * from other users' converged experiments into your own Problem Story.
 *
 * Routes (Express Router, mounted at /api/discovery-feed):
 *   GET  /                        → ranked discovery feed
 *   POST /:id/pull-context        → pull insights from a stream into your story
 *
 * Data source: problem-stories store filtered by status === 'published'.
 * Self-contained — no dependency on publication.js.
 *
 * Tests satisfied:
 *   T080: Discovery feed shows only published streams
 *   T081: Results ranked by keyword similarity when problemStoryId provided
 *   T082: Pull context adds insights from discovery stream to Problem Story
 */

const express = require('express');
const { listProblemStories, getProblemStory, updateProblemStory } = require('./problem-stories');

// ── Keyword extraction & similarity ────────────────────────────────

/** Common English stop words to exclude from keyword sets. */
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'but', 'by', 'can',
  'could', 'did', 'do', 'does', 'done', 'for', 'from', 'get', 'got', 'had',
  'has', 'have', 'he', 'her', 'here', 'him', 'his', 'how', 'i', 'if', 'in',
  'into', 'is', 'it', 'its', 'just', 'let', 'me', 'my', 'no', 'not', 'of',
  'on', 'or', 'our', 'own', 'say', 'she', 'so', 'some', 'than', 'that',
  'the', 'their', 'them', 'then', 'there', 'these', 'they', 'this', 'those',
  'to', 'too', 'up', 'us', 'very', 'was', 'we', 'were', 'what', 'when',
  'where', 'which', 'while', 'who', 'why', 'will', 'with', 'would', 'you',
  'your', 'about', 'also', 'all', 'any', 'because', 'been', 'before',
  'between', 'both', 'each', 'every', 'few', 'more', 'most', 'other',
  'over', 'same', 'should', 'such', 'through', 'under', 'using', 'way',
  'well', 'much', 'many', 'make', 'made', 'like', 'take', 'out',
]);

/**
 * Extract meaningful keywords from text.
 * Removes stop words, punctuation, and very short tokens.
 *
 * @param {string} text
 * @returns {string[]} unique lowercase keywords sorted for deterministic output
 */
function extractKeywords(text) {
  if (!text || typeof text !== 'string') return [];
  // Strip punctuation, split on whitespace, lowercase
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((t) => t.replace(/^-+|-+$/g, '')) // strip leading/trailing hyphens
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));
  return [...new Set(tokens)].sort();
}

/**
 * Compute Jaccard-like similarity between two keyword sets.
 * similarity = |intersection| / |union|
 *
 * @param {string[]} a
 * @param {string[]} b
 * @returns {number} 0..1
 */
function keywordSimilarity(a, b) {
  const setA = new Set(a);
  const setB = new Set(b);
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 0;
  let shared = 0;
  for (const k of setA) {
    if (setB.has(k)) shared++;
  }
  return shared / union.size;
}

// ── Publication store (thin wrapper over problem-stories) ──────────

/**
 * Get all published problem stories ("published streams").
 * T080: Only streams with status === 'published' appear in the feed.
 *
 * @returns {Array}
 */
function getPublishedStreams() {
  return listProblemStories().filter((s) => s.status === 'published');
}

/**
 * Build a summary object for a published stream suitable for the feed.
 *
 * @param {object} story
 * @returns {object}
 */
function buildStreamSummary(story) {
  return {
    id: story.id,
    problemDescription: truncate(story.problemDescription, 200),
    problemDomain: extractDomain(story),
    status: story.status,
    totalIterations: story.totalIterations || 0,
    feedbackRounds: (story.feedbackRounds || []).length,
    constraintCount: (story.constraints || []).length,
    metricCount: (story.evaluationFunction?.metrics || []).length,
    tags: buildTags(story),
    qualitySignals: buildQualitySignals(story),
    createdAt: story.createdAt,
    updatedAt: story.updatedAt,
  };
}

/** Truncate text to maxLen characters, appending ellipsis if truncated. */
function truncate(text, maxLen = 200) {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s+\S*$/, '') + '…';
}

/**
 * Extract a domain tag from the story (from tags, constraints, or description).
 * Returns null if no domain detected.
 */
function extractDomain(story) {
  // Check top-level tags first
  const tags = story.tags;
  if (Array.isArray(tags) && tags.length > 0 && typeof tags[0] === 'string') {
    return tags[0].toLowerCase();
  }
  // Fall back to first constraint category
  const constraints = story.constraints || [];
  if (constraints.length > 0 && typeof constraints[0].category === 'string') {
    return constraints[0].category.toLowerCase();
  }
  return null;
}

/**
 * Build tag array from story metadata.
 */
function buildTags(story) {
  const tags = [];
  // From explicit tags
  if (Array.isArray(story.tags)) {
    for (const t of story.tags) {
      if (typeof t === 'string' && t.trim()) tags.push(t.trim());
    }
  }
  // From metric names
  const metrics = story.evaluationFunction?.metrics || [];
  for (const m of metrics) {
    if (typeof m.name === 'string' && m.name.trim()) tags.push(m.name.trim());
  }
  return [...new Set(tags)];
}

/**
 * Build quality signal summary for sorting/display.
 */
function buildQualitySignals(story) {
  const feedbackRounds = story.feedbackRounds || [];
  const cards = story.experimentCards || []; // might not exist directly
  return {
    totalIterations: story.totalIterations || 0,
    feedbackRoundCount: feedbackRounds.length,
    constraintCount: (story.constraints || []).length,
    metricCount: (story.evaluationFunction?.metrics || []).length,
    isConverged: story.status === 'converged' || (story.status === 'published' && story.totalIterations > 0),
  };
}

// ── Insight extraction for pull-context (T082) ─────────────────────

/**
 * Extract key insights from a published stream for context pulling.
 * Returns context entries that can be appended to the requester's story.
 *
 * @param {object} stream — the published problem story
 * @returns {Array<{source: string, insight: string, category: string}>}
 */
function extractInsights(stream) {
  const entries = [];
  const streamId = stream.id;

  // Extract constraint insights
  const constraints = stream.constraints || [];
  for (const c of constraints) {
    if (typeof c.description === 'string' && c.description.trim()) {
      entries.push({
        source: `discovery:${streamId}`,
        insight: c.description.trim(),
        category: 'constraint',
      });
    }
  }

  // Extract approach insights from feedback rounds
  const feedbackRounds = stream.feedbackRounds || [];
  for (const round of feedbackRounds) {
    // Feedback round may contain approaches, preferences, or suggested approaches
    const approaches = round.approaches || round.suggestedApproaches || [];
    for (const a of approaches) {
      if (typeof a === 'string' && a.trim()) {
        entries.push({
          source: `discovery:${streamId}`,
          insight: a.trim(),
          category: 'approach',
        });
      } else if (typeof a === 'object' && typeof a.description === 'string' && a.description.trim()) {
        entries.push({
          source: `discovery:${streamId}`,
          insight: a.description.trim(),
          category: 'approach',
        });
      }
    }
  }

  // Extract metric insights (baseline/target scores)
  const metrics = stream.evaluationFunction?.metrics || [];
  const baselines = stream.evaluationFunction?.baselineScores || {};
  for (const m of metrics) {
    if (typeof m.name === 'string') {
      const baseline = baselines[m.name];
      let insight = m.name;
      if (typeof baseline === 'number') {
        insight = `${m.name}: baseline ${baseline}`;
      }
      if (typeof m.rationale === 'string' && m.rationale.trim()) {
        insight += ` — ${m.rationale.trim()}`;
      }
      entries.push({
        source: `discovery:${streamId}`,
        insight,
        category: 'metric',
      });
    }
  }

  // Deduplicate by insight text
  const seen = new Set();
  return entries.filter((e) => {
    if (seen.has(e.insight)) return false;
    seen.add(e.insight);
    return true;
  });
}

// ── Express router ─────────────────────────────────────────────────

const router = express.Router();
router.use(express.json());

/**
 * GET /api/discovery-feed
 *
 * Query params:
 *   problemStoryId  (optional) — rank by similarity to this story
 *   problemDomain   (optional) — filter by domain tag
 *   limit           (default 20, max 100)
 *   offset          (default 0)
 *
 * T080: Only published streams appear.
 * T081: When problemStoryId provided, rank by keyword similarity.
 */
router.get('/', (req, res) => {
  const problemStoryId = typeof req.query.problemStoryId === 'string' ? req.query.problemStoryId.trim() : '';
  const problemDomain = typeof req.query.problemDomain === 'string' ? req.query.problemDomain.trim() : '';
  let limit = Number.parseInt(req.query.limit || '20', 10);
  let offset = Number.parseInt(req.query.offset || '0', 10);

  if (!Number.isFinite(limit) || limit < 1) limit = 20;
  if (limit > 100) limit = 100;
  if (!Number.isFinite(offset) || offset < 0) offset = 0;

  // Get the browsing user's story for similarity matching
  let userStory = null;
  let userKeywords = [];
  if (problemStoryId) {
    userStory = getProblemStory(problemStoryId);
    if (!userStory) {
      return res.status(404).json({ ok: false, error: 'PROBLEM_STORY_NOT_FOUND' });
    }
    userKeywords = extractKeywords(userStory.problemDescription);
  }

  // Get all published streams
  let streams = getPublishedStreams()
    .filter((s) => s.id !== problemStoryId); // Exclude own story

  // Filter by domain tag if provided
  if (problemDomain) {
    const domain = problemDomain.toLowerCase();
    streams = streams.filter((s) => {
      const storyDomain = extractDomain(s);
      return storyDomain === domain;
    });
  }

  // Build summaries
  let results = streams.map(buildStreamSummary);

  // Rank: by similarity if problemStoryId provided, else by recency
  if (problemStoryId && userKeywords.length > 0) {
    for (const item of results) {
      const streamKeywords = extractKeywords(
        // Use the original story's description for better matching
        streams.find((s) => s.id === item.id)?.problemDescription || item.problemDescription
      );
      item.similarityScore = keywordSimilarity(userKeywords, streamKeywords);
    }
    results.sort((a, b) => (b.similarityScore || 0) - (a.similarityScore || 0));
  } else {
    results.sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')));
  }

  // Paginate
  const total = results.length;
  const page = results.slice(offset, offset + limit);

  res.json({
    ok: true,
    total,
    limit,
    offset,
    results: page,
    rankedBySimilarity: !!(problemStoryId && userKeywords.length > 0),
  });
});

/**
 * POST /api/discovery-feed/:id/pull-context
 *
 * Body: { problemStoryId, streamId }
 *   (streamId can also come from the URL :id param — either works)
 *
 * T082: Pull insights from a discovery stream into your Problem Story's context array.
 */
router.post('/:id/pull-context', (req, res) => {
  const urlStreamId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
  const bodyStreamId = typeof req.body?.streamId === 'string' ? req.body.streamId.trim() : '';
  const streamId = bodyStreamId || urlStreamId;
  const problemStoryId = typeof req.body?.problemStoryId === 'string' ? req.body.problemStoryId.trim() : '';

  if (!streamId) return res.status(400).json({ ok: false, error: 'MISSING_STREAM_ID' });
  if (!problemStoryId) return res.status(400).json({ ok: false, error: 'MISSING_PROBLEM_STORY_ID' });

  // Load the published stream
  const stream = getProblemStory(streamId);
  if (!stream) {
    return res.status(404).json({ ok: false, error: 'STREAM_NOT_FOUND' });
  }
  if (stream.status !== 'published') {
    return res.status(403).json({ ok: false, error: 'STREAM_NOT_PUBLISHED' });
  }

  // Load the user's Problem Story
  const userStory = getProblemStory(problemStoryId);
  if (!userStory) {
    return res.status(404).json({ ok: false, error: 'PROBLEM_STORY_NOT_FOUND' });
  }

  // Don't pull from yourself
  if (streamId === problemStoryId) {
    return res.status(400).json({ ok: false, error: 'CANNOT_PULL_FROM_SELF' });
  }

  // Extract insights from the published stream
  const insights = extractInsights(stream);
  if (insights.length === 0) {
    return res.json({ ok: true, pulled: 0, insights: [], problemStory: userStory });
  }

  // Append insights to user story's context, deduplicating by source+insight
  const existingContext = Array.isArray(userStory.context) ? userStory.context : [];
  const existingKeys = new Set(
    existingContext.map((c) => `${c.source || ''}:${c.insight || ''}`)
  );

  let pulledCount = 0;
  for (const insight of insights) {
    const key = `${insight.source}:${insight.insight}`;
    if (!existingKeys.has(key)) {
      existingContext.push(insight);
      existingKeys.add(key);
      pulledCount++;
    }
  }

  // Update the story
  const updated = updateProblemStory(problemStoryId, {
    context: existingContext,
  });

  res.json({
    ok: true,
    pulled: pulledCount,
    insights: insights,
    problemStory: updated,
  });
});

// ── Exports ────────────────────────────────────────────────────────

module.exports = {
  router,
  extractKeywords,
  keywordSimilarity,
  getPublishedStreams,
  buildStreamSummary,
  extractInsights,
};
