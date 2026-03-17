/**
 * Evaluation Function Engine — ZHC1 Milestone M1
 *
 * Provides metric proposal generation, natural-language metric parsing,
 * and evaluation confirmation logic for Problem Stories.
 *
 * Routes (Express Router):
 *   POST /api/problem-stories                              → create story
 *   GET  /api/problem-stories/:id                          → get story
 *   GET  /api/problem-stories/:id/eval-proposals           → propose metrics
 *   GET  /api/problem-stories/:id/eval-proposals/metrics   → list current metrics
 *   POST /api/problem-stories/:id/eval-proposals/metrics   → add metric from rawInput
 *   POST /api/problem-stories/:id/eval-confirm              → confirm evaluation
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
const {
  listExperimentCards,
  updateCardById,
  getCardById,
} = require('./experiment-cards');
const { generateScores } = require('./experiment-runner');

const router = express.Router();
router.use(express.json());

// ─── Type definitions (JSDoc, for reference) ───────────────────────

/**
 * @typedef {object} EvaluationMetric
 * @property {string} id
 * @property {string} name
 * @property {'quantitative'|'qualitative'} type
 * @property {'minimize'|'maximize'} direction
 * @property {number} confidence — 0-1 confidence score for this proposal
 * @property {string} [unit]
 * @property {{min:number,max:number}} [range]
 * @property {string} [assessmentPrompt]
 * @property {number} [weight]
 * @property {string} [rationale]
 * @property {boolean} [needsClarification] — set when contradictory signals detected
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

// ─── Utility helpers ───────────────────────────────────────────────

/**
 * Extract the first sentence (or key phrase) from a potentially long description.
 * @param {string} text
 * @returns {string} At most ~200 chars, trimmed at last sentence boundary.
 */
function extractKeyPhrase(text) {
  if (text.length <= 200) return text.trim();
  // Try splitting at first sentence terminator
  const firstSentence = text.match(/^.+?[.!?]\s/);
  if (firstSentence) return firstSentence[0].trim().slice(0, 200);
  return text.slice(0, 200).trim();
}

/**
 * Detect contradictory signals in a description.
 * Returns a string explaining the contradiction, or null if none found.
 * @param {string} text
 * @returns {string|null}
 */
function detectContradictions(text) {
  const lower = text.toLowerCase();
  const contradictionPairs = [
    [['faster', 'smaller', 'reduce', 'minimize', 'shrink', 'compact', 'lightweight'],
     ['bigger', 'larger', 'more', 'increase', 'expand', 'grow', 'enhance']],
    [['faster', 'quicker', 'optimize', 'speed'],
     ['more features', 'richer', 'complex', 'comprehensive']],
    [['simpler', 'minimal', 'basic', 'clean'],
     ['comprehensive', 'full-featured', 'complete', 'all-in-one']],
  ];
  for (const [groupA, groupB] of contradictionPairs) {
    const hitA = groupA.some(kw => lower.includes(kw));
    const hitB = groupB.some(kw => lower.includes(kw));
    if (hitA && hitB) {
      return 'Potentially conflicting goals detected — consider clarifying priorities.';
    }
  }
  return null;
}

// ─── Metric proposal heuristics ────────────────────────────────────

/**
 * Keyword → metric proposal rules. No LLM needed — pattern matching.
 *
 * Each entry: { keywords: string[], metric: Partial<EvaluationMetric>, category: string }
 * If a keyword group matches the problem description, the metric template
 * is cloned with a fresh id, rationale, and confidence score.
 *
 * Categories help ensure diversity: always pick at least 1 quantitative + 1 qualitative.
 */
const PROPOSAL_RULES = [
  // ── Performance ──
  {
    keywords: ['load', 'speed', 'fast', 'slow', 'performance', 'latency', 'render', 'page load', 'boot'],
    category: 'performance',
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
    category: 'performance',
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
    keywords: ['throughput', 'request', 'concurrent', 'capacity', 'scale', 'rps', 'qps'],
    category: 'performance',
    metric: {
      name: 'Throughput',
      type: 'quantitative',
      direction: 'maximize',
      unit: 'req/s',
      range: { min: 0, max: 100000 },
      rationale: 'Higher throughput means the system handles more load.',
    },
  },
  {
    keywords: ['layout', 'shift', 'cls', 'stable', 'jump', 'reflow'],
    category: 'performance',
    metric: {
      name: 'Cumulative Layout Shift (CLS)',
      type: 'quantitative',
      direction: 'minimize',
      unit: 'score',
      range: { min: 0, max: 1 },
      rationale: 'Low CLS means the page feels stable as it loads.',
    },
  },
  // ── Visual / UI ──
  {
    keywords: ['design', 'visual', 'look', 'style', 'aesthetic', 'beautiful', 'pretty', 'clean', 'polish'],
    category: 'visual',
    metric: {
      name: 'Visual quality',
      type: 'qualitative',
      direction: 'maximize',
      assessmentPrompt: 'Rate the visual quality of this implementation (0=unprofessional, 1=polished and intentional).',
      rationale: 'Visual quality impacts user trust and perceived value.',
    },
  },
  {
    keywords: ['layout', 'grid', 'spacing', 'alignment', 'typography', 'whitespace'],
    category: 'visual',
    metric: {
      name: 'Layout quality',
      type: 'qualitative',
      direction: 'maximize',
      assessmentPrompt: 'Rate the layout quality (0=inconsistent, 1=well-structured with clear hierarchy).',
      rationale: 'Good layout ensures content is scannable and visually balanced.',
    },
  },
  {
    keywords: ['consistency', 'consistent', 'unified', 'cohesive', 'theme', 'brand'],
    category: 'visual',
    metric: {
      name: 'Design consistency',
      type: 'qualitative',
      direction: 'maximize',
      assessmentPrompt: 'Rate design consistency across components (0=scattered, 1=unified design language).',
      rationale: 'Consistency reduces cognitive load and builds trust.',
    },
  },
  {
    keywords: ['accessibility', 'a11y', 'screen reader', 'aria', 'contrast', 'wcag', 'disabled', 'inclusive'],
    category: 'visual',
    metric: {
      name: 'Accessibility compliance',
      type: 'qualitative',
      direction: 'maximize',
      assessmentPrompt: 'Rate this implementation against WCAG 2.1 AA criteria (0=many violations, 1=fully compliant).',
      rationale: 'Accessibility ensures the product works for all users.',
    },
  },
  {
    keywords: ['responsive', 'mobile', 'tablet', 'phone', 'screen size', 'breakpoint'],
    category: 'visual',
    metric: {
      name: 'Responsive design quality',
      type: 'qualitative',
      direction: 'maximize',
      assessmentPrompt: 'Rate how well this layout adapts to different screen sizes (0=breaks on mobile, 1=perfectly responsive).',
      rationale: 'Responsive design ensures usability across all devices.',
    },
  },
  // ── UX ──
  {
    keywords: ['ux', 'user experience', 'usable', 'intuitive', 'navigation', 'flow', 'onboarding'],
    category: 'ux',
    metric: {
      name: 'UX coherence',
      type: 'qualitative',
      direction: 'maximize',
      assessmentPrompt: 'Rate the user experience flow (0=confusing, 1=seamless and intuitive).',
      rationale: 'Good UX reduces friction and improves task completion.',
    },
  },
  // ── Code quality ──
  {
    keywords: ['test', 'coverage', 'testing', 'unit test', 'integration test', 'spec'],
    category: 'code-quality',
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
    category: 'code-quality',
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
    category: 'code-quality',
    metric: {
      name: 'Code quality',
      type: 'qualitative',
      direction: 'maximize',
      assessmentPrompt: 'Rate the code quality (0=hard to maintain, 1=clean and well-structured).',
      rationale: 'Maintainable code reduces long-term development cost.',
    },
  },
  {
    keywords: ['bundle', 'size', 'weight', 'bloat', 'filesize', 'asset size', 'minify'],
    category: 'code-quality',
    metric: {
      name: 'Bundle size',
      type: 'quantitative',
      direction: 'minimize',
      unit: 'KB',
      range: { min: 0, max: 5000 },
      rationale: 'Smaller bundles load faster and use less bandwidth.',
    },
  },
  // ── Content ──
  {
    keywords: ['seo', 'search', 'ranking', 'meta', 'og:', 'structured data', 'sitemap'],
    category: 'content',
    metric: {
      name: 'SEO readiness',
      type: 'qualitative',
      direction: 'maximize',
      assessmentPrompt: 'Rate SEO best-practice compliance (0=no SEO, 1=fully optimized with semantic markup).',
      rationale: 'Good SEO improves discoverability and organic traffic.',
    },
  },
  {
    keywords: ['content', 'text', 'copy', 'writing', 'readable', 'readability', 'grammar'],
    category: 'content',
    metric: {
      name: 'Readability',
      type: 'qualitative',
      direction: 'maximize',
      assessmentPrompt: 'Rate content readability (0=hard to parse, 1=clear and scannable).',
      rationale: 'Readable content keeps users engaged and informed.',
    },
  },
  {
    keywords: ['accuracy', 'correct', 'truthful', 'factual', 'data quality'],
    category: 'content',
    metric: {
      name: 'Content accuracy',
      type: 'qualitative',
      direction: 'maximize',
      assessmentPrompt: 'Rate content accuracy (0=contains errors, 1=factual and up-to-date).',
      rationale: 'Inaccurate content erodes trust and can cause harm.',
    },
  },
  {
    keywords: ['engagement', 'time on site', 'scroll', 'interaction', 'dwell'],
    category: 'content',
    metric: {
      name: 'Engagement',
      type: 'qualitative',
      direction: 'maximize',
      assessmentPrompt: 'Rate user engagement potential (0=users bounce, 1=deep engagement).',
      rationale: 'Engaging content drives retention and satisfaction.',
    },
  },
  // ── Conversion ──
  {
    keywords: ['conversion', 'click', 'signup', 'funnel', 'cta', 'engage'],
    category: 'conversion',
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
 * Fallback metrics returned when no keywords match.
 * Always includes one quantitative + one qualitative.
 */
const FALLBACK_METRICS = [
  {
    name: 'Overall quality',
    type: 'qualitative',
    direction: 'maximize',
    assessmentPrompt: 'Rate the overall quality of this implementation (0=poor, 1=excellent).',
    rationale: 'A general quality metric ensures continuous improvement even without specific targets.',
  },
  {
    name: 'Task completion rate',
    type: 'quantitative',
    direction: 'maximize',
    unit: '%',
    range: { min: 0, max: 100 },
    rationale: 'Measures how often users can successfully complete their intended task.',
  },
  {
    name: 'User satisfaction',
    type: 'qualitative',
    direction: 'maximize',
    assessmentPrompt: 'Rate user satisfaction with this implementation (0=frustrating, 1=delightful).',
    rationale: 'Satisfaction is a leading indicator of retention and advocacy.',
  },
];

/**
 * Compute a confidence score (0-1) for a keyword rule match.
 * Based on how many keywords matched vs total available, and keyword specificity.
 *
 * @param {string[]} matchedKeywords — keywords from the rule that matched
 * @param {string[]} allKeywords — all keywords in the rule
 * @returns {number} confidence between 0 and 1
 */
function computeConfidence(matchedKeywords, allKeywords) {
  if (allKeywords.length === 0) return 0.1;
  const ratio = matchedKeywords.length / allKeywords.length;
  // Bonus for multi-word (more specific) keyword matches
  const hasSpecific = matchedKeywords.some(kw => kw.includes(' '));
  let confidence = 0.3 + ratio * 0.5;
  if (hasSpecific) confidence += 0.1;
  return Math.min(confidence, 1.0);
}

/**
 * Generate metric proposals based on problem description keywords.
 * Returns 2-3 unique metrics, always including at least 1 quantitative
 * and 1 qualitative. Each metric includes a confidence score (0-1).
 *
 * @param {string} description — The problem story description (any length).
 *   - Empty/short (<10 chars) → returns generic fallback metrics with low confidence
 *   - Long descriptions → first sentence is extracted for matching
 *   - Contradictory signals → flagged via `needsClarification`
 * @returns {EvaluationMetric[]} Array of 2-3 metric proposals with confidence scores.
 */
function generateMetricProposals(description) {
  const originalDescription = description || '';
  const lower = originalDescription.toLowerCase().trim();

  // Edge case: empty or very short input
  if (lower.length < 10) {
    return FALLBACK_METRICS.map(m => ({
      id: randomUUID(),
      ...m,
      confidence: 0.2,
    }));
  }

  // For long descriptions, extract the key phrase for matching
  const matchText = extractKeyPhrase(lower);
  const contradiction = detectContradictions(lower);

  const matched = [];
  const usedNames = new Set();

  // Score each rule and collect matches
  const scored = [];
  for (const rule of PROPOSAL_RULES) {
    const hits = rule.keywords.filter(kw => matchText.includes(kw));
    if (hits.length === 0) continue;
    if (usedNames.has(rule.metric.name)) continue;

    const confidence = computeConfidence(hits, rule.keywords);
    scored.push({ rule, hits, confidence });
  }

  // Sort by confidence descending
  scored.sort((a, b) => b.confidence - a.confidence);

  // Select metrics ensuring diversity: at least 1 quantitative + 1 qualitative
  let hasQuantitative = false;
  let hasQualitative = false;

  for (const { rule, confidence } of scored) {
    if (matched.length >= 3) break;
    if (usedNames.has(rule.metric.name)) continue;

    const type = rule.metric.type;
    // Prefer to fill the missing type first
    if (matched.length === 1) {
      if (hasQuantitative && !hasQualitative && type !== 'qualitative') continue;
      if (hasQualitative && !hasQuantitative && type !== 'quantitative') continue;
    }

    usedNames.add(rule.metric.name);
    const metric = {
      id: randomUUID(),
      ...rule.metric,
      confidence,
    };
    if (contradiction) metric.needsClarification = true;

    matched.push(metric);
    if (type === 'quantitative') hasQuantitative = true;
    else hasQualitative = true;
  }

  // Fill gaps if we don't have both types
  if (matched.length < 2) {
    const missingType = hasQuantitative ? 'qualitative' : 'quantitative';
    const fallback = FALLBACK_METRICS.find(m => m.type === missingType);
    if (fallback && !usedNames.has(fallback.name)) {
      matched.push({
        id: randomUUID(),
        ...fallback,
        confidence: 0.3,
      });
    }
  }

  // Ensure minimum 2 results
  while (matched.length < 2) {
    const next = FALLBACK_METRICS.find(m => !usedNames.has(m.name));
    if (!next) break;
    usedNames.add(next.name);
    matched.push({
      id: randomUUID(),
      ...next,
      confidence: 0.3,
    });
  }

  return matched;
}

// ─── Natural language metric parsing ───────────────────────────────

/** Units recognized in natural language input, mapped to canonical form. */
const UNIT_PATTERNS = [
  { regex: /\b(milliseconds?|ms)\b/i, unit: 'ms' },
  { regex: /\b(seconds?|secs?)\b/i, unit: 's' },
  { regex: /\b(minutes?|mins?)\b/i, unit: 'min' },
  { regex: /\b(hours?|hrs?)\b/i, unit: 'h' },
  { regex: /\bpercent(age)?|%/i, unit: '%' },
  { regex: /\bpixels?|px\b/i, unit: 'px' },
  { regex: /\b(gigabytes?|gb)\b/i, unit: 'GB' },
  { regex: /\b(megabytes?|mb)\b/i, unit: 'MB' },
  { regex: /\b(kilobytes?|kb)\b/i, unit: 'KB' },
  { regex: /\bbytes?\b/i, unit: 'bytes' },
  { regex: /\bscore|rating/i, unit: 'score' },
];

/** Keywords that indicate "minimize" direction. */
const MINIMIZE_KEYWORDS = [
  'faster', 'quicker', 'smaller', 'lower', 'less', 'under',
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
 * Clean a natural-language input into a concise metric name.
 *
 * Steps:
 *  1. Strip filler prefixes and common noise words
 *  2. Remove numeric values and units (we store those separately)
 *  3. Capitalize first letter
 *  4. Cap at 30 characters
 *
 * @param {string} rawInput — The raw natural-language metric description.
 * @returns {string} A clean, concise metric name (max 30 chars).
 */
function cleanMetricName(rawInput) {
  // Strip common filler prefixes (longest match first to avoid partial strips)
  const fillerPrefixes = [
    'i would like ', 'i want it to ', 'i want the ', 'i need the ',
    'i want ', 'i need ', 'make sure ', 'ensure that ', 'ensure ',
    'please ', "let's ", 'we need ', 'we want ',
  ];
  let name = rawInput.toLowerCase();

  for (const prefix of fillerPrefixes) {
    if (name.startsWith(prefix)) {
      name = name.slice(prefix.length);
      break;
    }
  }

  // Remove standalone filler words (word-boundary aware, longest first)
  const fillerWords = [
    'should be ', 'must be ', 'has to be ', 'needs to be ',
    'the ', 'to ', 'for ', 'it ', 'a ', 'an ', 'in under ', 'under ',
    'less than ', 'more than ', 'at least ', 'up to ',
  ];
  for (const filler of fillerWords) {
    name = name.replace(new RegExp(`\\b${filler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), '');
  }

  // Remove trailing conjunctions/connectors
  name = name.replace(/\s+(and|but|or|so|then|than)\s+.*$/, '');

  // Remove standalone "be" at start/end
  name = name.replace(/^\s*be\s+/, '');
  name = name.replace(/\s+be\s*$/, '');

  // Remove trailing prepositions
  name = name.replace(/\s+(to|in|on|at|by|for|of|with|from)\s*$/, '');

  // Remove numeric values (the number itself, not words around it)
  name = name.replace(/\b\d+(?:\.\d+)?\b/g, '');

  // Remove unit words (so "2 seconds" → the metric name doesn't include "seconds")
  const unitWords = ['seconds?', 'secs?', 'milliseconds?', 'ms', 'minutes?', 'mins?',
    'hours?', 'hrs?', 'percent', 'pixels?', 'bytes?', 'kb', 'mb', 'gb', 'score'];
  for (const uw of unitWords) {
    name = name.replace(new RegExp(`\\b${uw}\\b`, 'gi'), '');
  }

  // Collapse whitespace and trim
  name = name.replace(/\s+/g, ' ').trim();

  // Capitalize first letter of each word
  name = name.replace(/\b\w/g, c => c.toUpperCase());

  // Trim trailing punctuation
  name = name.replace(/[.!?,;:]+$/, '').trim();

  // Hard cap at 30 characters
  if (name.length > 30) {
    name = name.slice(0, 28) + '…';
  }

  // Fallback if cleaning removed everything
  if (name.length < 2) {
    name = 'Custom metric';
  }

  return name;
}

/**
 * Parse a natural-language metric definition into a structured metric.
 *
 * Heuristics:
 *  1. Extract the first number → use as primary target value
 *  2. Detect unit from known patterns
 *  3. Infer direction from minimize/maximize keywords
 *  4. Clean the raw input into a concise metric name (max 30 chars)
 *  5. Compute confidence based on how much structured info was extracted
 *
 * @param {string} rawInput — Natural-language metric description.
 *   Examples: "I want the page to load in under 2 seconds",
 *             "reduce errors to less than 5 percent",
 *             "improve visual quality"
 * @returns {EvaluationMetric} A structured metric with confidence score.
 */
function parseNaturalLanguageMetric(rawInput) {
  const lower = rawInput.toLowerCase();

  // Extract ALL numbers found
  const allNumbers = rawInput.match(/[\d]+(?:\.[\d]+)?/g);
  const targetValue = allNumbers ? parseFloat(allNumbers[0]) : null;

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
  const minHits = MINIMIZE_KEYWORDS.filter(kw => lower.includes(kw));
  const maxHits = MAXIMIZE_KEYWORDS.filter(kw => lower.includes(kw));
  if (minHits.length > maxHits.length) direction = 'minimize';
  if (maxHits.length > minHits.length) direction = 'maximize';

  // Detect contradictions in the NL input
  const contradiction = detectContradictions(rawInput);

  // Build range from primary metric
  let range = undefined;
  if (targetValue !== null) {
    if (direction === 'minimize') {
      range = { min: 0, max: targetValue * 2 };
    } else {
      range = { min: targetValue, max: targetValue * 1.5 };
    }
  }

  // Compute confidence: more extracted info → higher confidence
  let confidence = 0.3; // base for any non-empty input
  if (targetValue !== null) confidence += 0.3;
  if (unit) confidence += 0.2;
  if (minHits.length > 0 || maxHits.length > 0) confidence += 0.1;
  // Penalty for multiple numbers (ambiguous)
  if (allNumbers && allNumbers.length > 1) confidence -= 0.1;
  confidence = Math.min(Math.max(confidence, 0.1), 1.0);

  // Clean metric name
  const name = cleanMetricName(rawInput);

  const metric = {
    id: randomUUID(),
    name,
    type: targetValue !== null ? 'quantitative' : 'qualitative',
    direction,
    unit,
    range,
    confidence,
    rationale: `Derived from user input: "${rawInput.slice(0, 100)}"`,
  };

  if (contradiction) metric.needsClarification = true;

  return metric;
}

// ─── Routes ─────────────────────────────────────────────────────────

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

/**
 * GET /api/problem-stories/:id/eval-proposals
 *
 * Analyze the problem description and propose 2-3 metrics.
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
 * Body: { rawInput: string } or { name, direction, ... } for structured input.
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
    metric = {
      id: req.body.id || randomUUID(),
      name: req.body.name,
      type: req.body.type || 'quantitative',
      direction: req.body.direction,
      unit: req.body.unit,
      range: req.body.range,
      assessmentPrompt: req.body.assessmentPrompt,
      weight: req.body.weight,
      confidence: req.body.confidence || 0.5,
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
 * Confirm the evaluation function for a Problem Story.
 *
 * Steps:
 *  - Validates story exists, has ≥1 metric, and isn't already confirmed
 *  - Sets confirmedAt
 *  - Sets baseline scores (placeholder 0.5)
 *  - Transitions status to 'active'
 *
 * @param {string} storyId — Problem Story ID
 * @returns {{ ok: true, problemStoryId: string, status: string, evaluationFunction: object }}
 * @throws {Error} with .statusCode for HTTP mapping
 */
function confirmEvaluation(storyId) {
  const story = getProblemStory(storyId);
  if (!story) {
    const err = new Error('Problem Story not found');
    err.statusCode = 404;
    throw err;
  }

  if (story.evaluationFunction.metrics.length === 0) {
    const err = new Error('Cannot confirm evaluation without at least one metric.');
    err.statusCode = 400;
    throw err;
  }

  if (story.evaluationFunction.confirmedAt) {
    const err = new Error('Evaluation already confirmed.');
    err.statusCode = 400;
    err.detail = { confirmedAt: story.evaluationFunction.confirmedAt };
    throw err;
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

  return {
    problemStoryId: story.id,
    status: story.status,
    evaluationFunction: story.evaluationFunction,
  };
}

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
  try {
    const result = confirmEvaluation(req.params.id);
    res.json(result);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    const body = { error: err.message };
    if (err.detail) Object.assign(body, err.detail);
    res.status(statusCode).json(body);
  }
});

// ─── Mid-loop metric editing (T014) ───────────────────────────────

/**
 * Rescore all existing experiment cards for a problem story.
 *
 * For each card:
 *  - Saves old scores in a `legacyScores` array entry (with timestamp)
 *  - Generates new scores using the updated metrics + baselines
 *  - Updates compositeScore
 *
 * @param {string} problemStoryId
 * @param {object[]} metrics — the new metrics array
 * @param {object} baselineScores — metric ID → baseline score
 * @returns {{ rescored: number, errors: string[] }}
 */
function rescoreAllCards(problemStoryId, metrics, baselineScores) {
  const cards = listExperimentCards(problemStoryId);
  let rescored = 0;
  const errors = [];

  if (!cards.length) return { rescored: 0, errors: [] };

  // First pass: rescore all cards, store legacy scores
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];

    // Save old scores into legacyScores
    const legacyEntry = {
      timestamp: new Date().toISOString(),
      scores: { ...card.scores },
      compositeScore: card.compositeScore,
      deltaScore: card.deltaScore,
      reason: 'metric_change',
    };

    if (!card.legacyScores) card.legacyScores = [];
    card.legacyScores.push(legacyEntry);

    // Generate new scores using the scoring engine
    try {
      const { scores, compositeScore } = generateScores(
        metrics,
        baselineScores,
        i % 3 // cycle through experiment indices for variety
      );

      updateCardById(card.id, {
        scores,
        compositeScore,
      });
      rescored++;
    } catch (err) {
      errors.push(`Card ${card.id}: ${err.message}`);
    }
  }

  // Second pass: recalculate deltaScore based on new compositeScores
  const updatedCards = listExperimentCards(problemStoryId);
  // Sort by iterationNumber ascending for delta calculation
  const sorted = [...updatedCards].sort((a, b) => a.iterationNumber - b.iterationNumber);

  for (let i = 0; i < sorted.length; i++) {
    const card = sorted[i];
    let deltaScore = 0;
    if (i > 0) {
      const prevCard = sorted[i - 1];
      deltaScore = Math.round((card.compositeScore - prevCard.compositeScore) * 100) / 100;
    }
    updateCardById(card.id, { deltaScore });
  }

  return { rescored, errors };
}

/**
 * PUT /api/problem-stories/:id/evaluation
 *
 * Mid-loop metric editing (T014).
 * Allows modifying metrics after experiments have started.
 * Automatically rescores all existing experiment cards.
 *
 * Body:
 *   { addMetric?: object }    — metric to add (name, type, direction required)
 *   { removeMetricId?: string } — metric ID to remove
 *   { updateMetric?: { id, ...fields } } — metric fields to update
 */
router.put('/:id/evaluation', (req, res) => {
  const story = getProblemStory(req.params.id);
  if (!story) {
    return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  }

  if (story.status !== 'active') {
    return res.status(400).json({
      ok: false,
      error: 'STORY_NOT_ACTIVE',
      message: 'Evaluation can only be modified for active problem stories.',
    });
  }

  const { addMetric, removeMetricId, updateMetric } = req.body;
  const metrics = story.evaluationFunction.metrics;
  const baselineScores = story.evaluationFunction.baselineScores || {};
  let changed = false;

  // ── Add metric ──
  if (addMetric) {
    if (!addMetric.name || !addMetric.type || !addMetric.direction) {
      return res.status(400).json({
        ok: false,
        error: 'INVALID_METRIC',
        message: 'addMetric requires name, type, and direction.',
      });
    }

    const metric = {
      id: randomUUID(),
      name: addMetric.name,
      type: addMetric.type,
      direction: addMetric.direction,
      unit: addMetric.unit,
      range: addMetric.range,
      assessmentPrompt: addMetric.assessmentPrompt,
      weight: typeof addMetric.weight === 'number' ? addMetric.weight : 1,
      confidence: 0.5,
      rationale: addMetric.rationale || `Mid-loop addition: ${addMetric.name}`,
    };

    metrics.push(metric);
    // Set baseline for new metric
    baselineScores[metric.id] = 0.5;
    changed = true;
  }

  // ── Remove metric ──
  if (removeMetricId) {
    const idx = metrics.findIndex((m) => m.id === removeMetricId);
    if (idx === -1) {
      return res.status(404).json({
        ok: false,
        error: 'METRIC_NOT_FOUND',
        message: `Metric ${removeMetricId} not found.`,
      });
    }
    metrics.splice(idx, 1);
    delete baselineScores[removeMetricId];
    changed = true;
  }

  // ── Update metric ──
  if (updateMetric) {
    if (!updateMetric.id) {
      return res.status(400).json({
        ok: false,
        error: 'INVALID_UPDATE',
        message: 'updateMetric requires an id field.',
      });
    }

    const idx = metrics.findIndex((m) => m.id === updateMetric.id);
    if (idx === -1) {
      return res.status(404).json({
        ok: false,
        error: 'METRIC_NOT_FOUND',
        message: `Metric ${updateMetric.id} not found.`,
      });
    }

    // Merge allowed fields
    const allowedFields = ['name', 'type', 'direction', 'unit', 'range', 'assessmentPrompt', 'weight', 'rationale'];
    for (const field of allowedFields) {
      if (updateMetric[field] !== undefined) {
        metrics[idx][field] = updateMetric[field];
      }
    }
    changed = true;
  }

  if (!changed) {
    return res.status(400).json({
      ok: false,
      error: 'NO_CHANGES',
      message: 'Provide at least one of: addMetric, removeMetricId, updateMetric.',
    });
  }

  // Persist metric changes
  story.evaluationFunction.metrics = metrics;
  story.evaluationFunction.baselineScores = baselineScores;
  story.updatedAt = new Date().toISOString();
  updateProblemStory(story.id, story);

  // Rescore all existing cards with the new metrics
  const { rescored, errors } = rescoreAllCards(story.id, metrics, baselineScores);

  res.json({
    ok: true,
    data: {
      problemStoryId: story.id,
      metrics,
      rescoredCards: rescored,
      rescoreErrors: errors.length > 0 ? errors : undefined,
      message: `Metrics updated. ${rescored} cards rescored.`,
    },
  });
});

// ─── Exports ────────────────────────────────────────────────────────

module.exports = {
  router,
  confirmEvaluation,
  generateMetricProposals,
  parseNaturalLanguageMetric,
  rescoreAllCards,
};
