/**
 * Evaluation Function Engine — ZHC1 Milestone M1
 *
 * Provides metric proposal generation, natural-language metric parsing,
 * and evaluation confirmation logic for Problem Stories.
 *
 * Routes (Express Router):
 *   GET  /api/problem-stories/:id/eval-proposals        → propose metrics
 *   GET  /api/problem-stories/:id/eval-proposals/metrics → list current metrics
 *   POST /api/problem-stories/:id/eval-proposals/metrics → add metric from rawInput
 *   POST /api/problem-stories/:id/eval-confirm            → confirm evaluation
 *
 * See docs/zhc1-tdd-spec.md §4.2, §6, §7.2
 */

const express = require('express');
const { randomUUID } = require('crypto');
const {
  getProblemStory,
  updateProblemStory,
  createProblemStory,
} = require('./problem-stories');

const router = express.Router();
router.use(express.json());

/**
 * POST /api/problem-stories
 *
 * Create a new Problem Story (needed for seeding / test).
 * Body: { problemDescription: string, id?: string }
 */
router.post('/', (req, res) => {
  const { problemDescription, id } = req.body;
  if (!problemDescription || typeof problemDescription !== 'string') {
    return res.status(400).json({ error: 'problemDescription is required' });
  }
  const story = createProblemStory({ problemDescription, id });
  res.status(201).json(story);
});

/**
 * GET /api/problem-stories/:id
 *
 * Get a single Problem Story by ID.
 */
router.get('/:id', (req, res) => {
  const story = getProblemStory(req.params.id);
  if (!story) return res.status(404).json({ error: 'Problem Story not found' });
  res.json(story);
});

// ─── Type definitions (JSDoc, for reference) ───────────────────────

/**
 * @typedef {object} EvaluationMetric
 * @property {string} id
 * @property {string} name
 * @property {'quantitative'|'qualitative'} type
 * @property {'minimize'|'maximize'} direction
 * @property {string} [unit]
 * @property {{min:number,max:number}} [range]
 * @property {string} [assessmentPrompt]
 * @property {number} [weight]
 * @property {string} [rationale]
 */

/**
 * @typedef {object} ProblemStory
 * @property {string} id
 * @property {string} problemDescription
 * @property {string} status
 * @property {object} evaluationFunction
 * @property {EvaluationMetric[]} evaluationFunction.metrics
 * @property {Record<string,number>} evaluationFunction.baselineScores
 * @property {string} [evaluationFunction.confirmedAt]
 */

// ─── Metric proposal heuristics ────────────────────────────────────

/**
 * Keyword → metric proposal rules. No LLM needed — pattern matching.
 *
 * Each entry: { keywords: string[], metric: Partial<EvaluationMetric> }
 * If a keyword group matches the problem description, the metric template
 * is cloned with a fresh id and rationale.
 */
const PROPOSAL_RULES = [
  {
    keywords: ['load', 'speed', 'fast', 'slow', 'performance', 'latency', 'render', 'page load', 'boot'],
    metric: {
      name: 'Response time',
      type: 'quantitative',
      direction: 'minimize',
      unit: 'ms',
      range: { min: 0, max: 5000 },
      rationale: 'Faster response time improves user experience and engagement.',
    },
  },
  {
    keywords: ['load', 'speed', 'fast', 'slow', 'page load', 'render', 'boot', 'paint'],
    metric: {
      name: 'Largest Contentful Paint (LCP)',
      type: 'quantitative',
      direction: 'minimize',
      unit: 'ms',
      range: { min: 0, max: 10000 },
      rationale: 'LCP measures perceived load speed — a core web vital.',
    },
  },
  {
    keywords: ['layout', 'shift', 'cls', 'stable', 'jump', 'reflow'],
    metric: {
      name: 'Cumulative Layout Shift (CLS)',
      type: 'quantitative',
      direction: 'minimize',
      unit: 'score',
      range: { min: 0, max: 1 },
      rationale: 'Low CLS means the page feels stable as it loads.',
    },
  },
  {
    keywords: ['accessibility', 'a11y', 'screen reader', 'aria', 'contrast', 'wcag', 'disabled', 'inclusive'],
    metric: {
      name: 'Accessibility compliance',
      type: 'qualitative',
      direction: 'maximize',
      assessmentPrompt: 'Rate this implementation against WCAG 2.1 AA criteria (0=many violations, 1=fully compliant).',
      rationale: 'Accessibility ensures the product works for all users.',
    },
  },
  {
    keywords: ['design', 'visual', 'look', 'style', 'aesthetic', 'beautiful', 'pretty', 'clean', 'polish'],
    metric: {
      name: 'Visual quality',
      type: 'qualitative',
      direction: 'maximize',
      assessmentPrompt: 'Rate the visual quality of this implementation (0=unprofessional, 1=polished and intentional).',
      rationale: 'Visual quality impacts user trust and perceived value.',
    },
  },
  {
    keywords: ['ux', 'user experience', 'usable', 'intuitive', 'navigation', 'flow', 'onboarding'],
    metric: {
      name: 'UX coherence',
      type: 'qualitative',
      direction: 'maximize',
      assessmentPrompt: 'Rate the user experience flow (0=confusing, 1=seamless and intuitive).',
      rationale: 'Good UX reduces friction and improves task completion.',
    },
  },
  {
    keywords: ['test', 'coverage', 'testing', 'unit test', 'integration test', 'spec'],
    metric: {
      name: 'Test coverage',
      type: 'quantitative',
      direction: 'maximize',
      unit: '%',
      range: { min: 0, max: 100 },
      rationale: 'Higher test coverage increases confidence in code changes.',
    },
  },
  {
    keywords: ['error', 'bug', 'crash', 'failure', 'exception', 'broken'],
    metric: {
      name: 'Error rate',
      type: 'quantitative',
      direction: 'minimize',
      unit: '%',
      range: { min: 0, max: 100 },
      rationale: 'Lower error rates mean more reliable software.',
    },
  },
  {
    keywords: ['code', 'quality', 'clean', 'maintain', 'readable', 'lint', 'complexity', 'technical debt'],
    metric: {
      name: 'Code quality',
      type: 'qualitative',
      direction: 'maximize',
      assessmentPrompt: 'Rate the code quality (0=hard to maintain, 1=clean and well-structured).',
      rationale: 'Maintainable code reduces long-term development cost.',
    },
  },
  {
    keywords: ['responsive', 'mobile', 'tablet', 'phone', 'screen size', 'breakpoint'],
    metric: {
      name: 'Responsive design quality',
      type: 'qualitative',
      direction: 'maximize',
      assessmentPrompt: 'Rate how well this layout adapts to different screen sizes (0=breaks on mobile, 1=perfectly responsive).',
      rationale: 'Responsive design ensures usability across all devices.',
    },
  },
  {
    keywords: ['seo', 'search', 'ranking', 'meta', 'og:', 'structured data', 'sitemap'],
    metric: {
      name: 'SEO readiness',
      type: 'qualitative',
      direction: 'maximize',
      assessmentPrompt: 'Rate SEO best-practice compliance (0=no SEO, 1=fully optimized with semantic markup).',
      rationale: 'Good SEO improves discoverability and organic traffic.',
    },
  },
  {
    keywords: ['conversion', 'click', 'signup', 'funnel', 'cta', 'engage'],
    metric: {
      name: 'Conversion rate',
      type: 'quantitative',
      direction: 'maximize',
      unit: '%',
      range: { min: 0, max: 100 },
      rationale: 'Higher conversion rates indicate more effective user flows.',
    },
  },
];

/**
 * Generate metric proposals based on problem description keywords.
 * Returns 1-3 unique metrics.
 *
 * @param {string} description
 * @returns {EvaluationMetric[]}
 */
function generateMetricProposals(description) {
  const lower = description.toLowerCase();
  const matched = [];

  // Track which rule indices we've already used
  const usedIndices = new Set();

  for (const rule of PROPOSAL_RULES) {
    const hits = rule.keywords.filter((kw) => lower.includes(kw));
    if (hits.length === 0) continue;
    if (usedIndices.has(rule.keywords[0])) continue;

    usedIndices.add(rule.keywords[0]);
    matched.push({
      id: randomUUID(),
      ...rule.metric,
    });

    if (matched.length >= 3) break;
  }

  // Fallback: if nothing matched, propose a generic quality metric
  if (matched.length === 0) {
    matched.push({
      id: randomUUID(),
      name: 'Overall quality',
      type: 'qualitative',
      direction: 'maximize',
      assessmentPrompt:
        'Rate the overall quality of this implementation (0=poor, 1=excellent).',
      rationale:
        'A general quality metric ensures continuous improvement even without specific targets.',
    });
  }

  return matched;
}

// ─── Natural language metric parsing ───────────────────────────────

/** Units recognized in natural language input, mapped to canonical form. */
const UNIT_PATTERNS = [
  { regex: /\b(seconds?|secs?)\b/i, unit: 's' },
  { regex: /\b(milliseconds?|ms)\b/i, unit: 'ms' },
  { regex: /\b(minutes?|mins?)\b/i, unit: 'min' },
  { regex: /\b(hours?|hrs?)\b/i, unit: 'h' },
  { regex: /\bpercent(age)?|%/i, unit: '%' },
  { regex: /\bpixels?|px\b/i, unit: 'px' },
  { regex: /\bbytes?|kb|mb|gb\b/i, unit: 'bytes' },
  { regex: /\bscore|rating/i, unit: 'score' },
];

/** Keywords that indicate "minimize" direction. */
const MINIMIZE_KEYWORDS = [
  'faster', 'faster', 'quicker', 'smaller', 'lower', 'less', 'under',
  'below', 'reduce', 'decrease', 'minimize', 'slow down', 'shrink',
  'cut', 'trim', 'lightweight', 'compact', 'shorter', 'fewer',
];

/** Keywords that indicate "maximize" direction. */
const MAXIMIZE_KEYWORDS = [
  'better', 'higher', 'more', 'greater', 'improve', 'increase', 'maximize',
  'above', 'over', 'at least', 'bigger', 'larger', 'grow', 'expand',
  'enhance', 'boost', 'wider', 'taller',
];

/**
 * Parse a natural-language metric definition into a structured metric.
 *
 * Heuristics:
 *  1. Extract a number → use as max of range (or min if context says "at least N")
 *  2. Extract a unit from known patterns
 *  3. Infer direction from minimize/maximize keywords
 *  4. Generate a human-readable name from the input
 *
 * @param {string} rawInput — e.g. "I want the page to load in under 2 seconds"
 * @returns {EvaluationMetric}
 */
function parseNaturalLanguageMetric(rawInput) {
  const lower = rawInput.toLowerCase();

  // Extract the first number found
  const numberMatch = rawInput.match(/[\d]+(?:\.[\d]+)?/);
  const targetValue = numberMatch ? parseFloat(numberMatch[0]) : null;

  // Detect unit
  let unit = undefined;
  for (const { regex, unit: u } of UNIT_PATTERNS) {
    if (regex.test(rawInput)) {
      unit = u;
      break;
    }
  }

  // Infer direction
  let direction = 'maximize'; // default
  const minHits = MINIMIZE_KEYWORDS.filter((kw) => lower.includes(kw));
  const maxHits = MAXIMIZE_KEYWORDS.filter((kw) => lower.includes(kw));
  if (minHits.length > maxHits.length) direction = 'minimize';
  if (maxHits.length > minHits.length) direction = 'maximize';

  // Build range
  let range = undefined;
  if (targetValue !== null) {
    if (direction === 'minimize') {
      // "under 2 seconds" → max is targetValue (or targetValue * 2 for headroom)
      range = { min: 0, max: targetValue * 2 };
    } else {
      // "at least 90%" → min is targetValue
      range = { min: targetValue, max: targetValue * 1.5 };
    }
  }

  // Generate name: strip common filler phrases, capitalize
  const fillerPhrases = [
    'i want ', 'i need ', 'i would like ', 'make sure ', 'ensure ',
    'the ', 'to be ', 'should be ', 'must be ', 'has to be ',
    'i want it to ', 'it should ',
  ];
  let name = lower;
  for (const phrase of fillerPhrases) {
    name = name.replace(phrase, '');
  }
  // Capitalize first letter
  name = name.charAt(0).toUpperCase() + name.slice(1);
  // Trim trailing punctuation
  name = name.replace(/[.!?,;]+$/, '').trim();
  // Cap at ~50 chars for display
  if (name.length > 50) name = name.slice(0, 47) + '...';

  // If name is too short/generic after stripping, use a fallback
  if (name.length < 3) {
    name = unit ? `Target (${unit})` : 'Custom metric';
  }

  return {
    id: randomUUID(),
    name,
    type: targetValue !== null ? 'quantitative' : 'qualitative',
    direction,
    unit,
    range,
    rationale: `Derived from user input: "${rawInput.slice(0, 100)}"`,
  };
}

// ─── Routes ─────────────────────────────────────────────────────────

/**
 * GET /api/problem-stories/:id/eval-proposals
 *
 * Analyze the problem description and propose 1-3 metrics.
 * Returns the Problem Story's current evaluationFunction.metrics (merged with proposals).
 */
router.get('/:id/eval-proposals', (req, res) => {
  const story = getProblemStory(req.params.id);
  if (!story) {
    return res.status(404).json({ error: 'Problem Story not found' });
  }

  const proposals = generateMetricProposals(story.problemDescription);

  res.json({
    problemStoryId: story.id,
    existingMetrics: story.evaluationFunction.metrics,
    proposedMetrics: proposals,
    allMetrics: [...story.evaluationFunction.metrics, ...proposals],
  });
});

/**
 * GET /api/problem-stories/:id/eval-proposals/metrics
 *
 * Return the current metrics list (accepted so far, not proposals).
 */
router.get('/:id/eval-proposals/metrics', (req, res) => {
  const story = getProblemStory(req.params.id);
  if (!story) {
    return res.status(404).json({ error: 'Problem Story not found' });
  }

  res.json({
    problemStoryId: story.id,
    metrics: story.evaluationFunction.metrics,
  });
});

/**
 * POST /api/problem-stories/:id/eval-proposals/metrics
 *
 * Accept a natural-language rawInput and parse it into a structured metric,
 * then add it to the Problem Story's evaluation metrics.
 *
 * Body: { rawInput: string }
 */
router.post('/:id/eval-proposals/metrics', (req, res) => {
  const story = getProblemStory(req.params.id);
  if (!story) {
    return res.status(404).json({ error: 'Problem Story not found' });
  }

  const { rawInput } = req.body;
  if (!rawInput || typeof rawInput !== 'string' || rawInput.trim().length === 0) {
    return res.status(400).json({ error: 'rawInput is required and must be a non-empty string' });
  }

  // Also accept an already-structured metric for flexibility
  let metric;
  if (req.body.name && req.body.direction) {
    // Structured metric passed directly
    metric = {
      id: req.body.id || randomUUID(),
      name: req.body.name,
      type: req.body.type || 'quantitative',
      direction: req.body.direction,
      unit: req.body.unit,
      range: req.body.range,
      assessmentPrompt: req.body.assessmentPrompt,
      weight: req.body.weight,
      rationale: req.body.rationale || `User-defined metric: ${req.body.name}`,
    };
  } else {
    metric = parseNaturalLanguageMetric(rawInput);
  }

  story.evaluationFunction.metrics.push(metric);
  story.updatedAt = new Date().toISOString();

  res.status(201).json({
    problemStoryId: story.id,
    metric,
    metrics: story.evaluationFunction.metrics,
  });
});

/**
 * POST /api/problem-stories/:id/eval-confirm
 *
 * Confirm the evaluation function:
 *  - Requires ≥1 metric
 *  - Sets confirmedAt
 *  - Sets baseline scores (placeholder 0.5)
 *  - Transitions status to 'active'
 *
 * Body: {} (empty — no params needed)
 */
router.post('/:id/eval-confirm', (req, res) => {
  const story = getProblemStory(req.params.id);
  if (!story) {
    return res.status(404).json({ error: 'Problem Story not found' });
  }

  if (story.evaluationFunction.metrics.length === 0) {
    return res.status(400).json({
      error: 'Cannot confirm evaluation without at least one metric.',
    });
  }

  if (story.evaluationFunction.confirmedAt) {
    return res.status(400).json({
      error: 'Evaluation already confirmed.',
      confirmedAt: story.evaluationFunction.confirmedAt,
    });
  }

  const now = new Date().toISOString();

  // Set baseline scores (placeholder 0.5 — real baselines come from experiment execution)
  const baselineScores = {};
  for (const metric of story.evaluationFunction.metrics) {
    baselineScores[metric.id] = 0.5;
  }

  // Compute target summary from metric names
  const target = story.evaluationFunction.metrics
    .map((m) => m.name)
    .join(', ');

  story.evaluationFunction.confirmedAt = now;
  story.evaluationFunction.baselineScores = baselineScores;
  story.evaluationFunction.target = target;
  story.status = 'active';
  story.updatedAt = now;

  res.json({
    problemStoryId: story.id,
    status: story.status,
    evaluationFunction: story.evaluationFunction,
  });
});

// ─── Exports ────────────────────────────────────────────────────────

module.exports = {
  router,
  generateMetricProposals,
  parseNaturalLanguageMetric,
};
