/**
 * Experiment Runner — ZHC1 iteration feed execution engine.
 *
 * Takes a Problem Story + Program, runs an experiment round (up to 3
 * parallel experiments), and produces scored Experiment Cards.
 *
 * This is the "agent runs while you sleep" piece — the core loop
 * that generates modifications, scores them, and stores results.
 *
 * For ZHC1, scoring is simulated (placeholder). Real scoring comes
 * from actually running code modifications and measuring real metrics.
 */

const { getProblemStory, updateProblemStory } = require('./problem-stories');
const {
  createExperimentCard,
  listExperimentCards,
} = require('./experiment-cards');

// ── Constants ────────────────────────────────────────────────────────

/** Default time budget per experiment in milliseconds (7 minutes). */
const DEFAULT_TIME_BUDGET_MS = 7 * 60 * 1000;

/** Max experiments per round. */
const MAX_EXPERIMENTS_PER_ROUND = 3;

/** CSS gradient palette — rotated through for visual diversity. */
const GRADIENT_PALETTES = [
  { from: '#667eea', via: '#764ba2', to: '#f093fb' },
  { from: '#f093fb', via: '#f5576c', to: '#4facfe' },
  { from: '#43e97b', via: '#38f9d7', to: '#667eea' },
  { from: '#fa709a', via: '#fee140', to: '#fa709a' },
  { from: '#a18cd1', via: '#fbc2eb', to: '#a6c1ee' },
  { from: '#ffecd2', via: '#fcb69f', to: '#ff9a9e' },
  { from: '#89f7fe', via: '#66a6ff', to: '#89f7fe' },
  { from: '#fddb92', via: '#d1fdff', to: '#fddb92' },
  { from: '#c1dfc4', via: '#deecdd', to: '#c1dfc4' },
  { from: '#0c3483', via: '#a2b6df', to: '#6b8cce' },
  { from: '#7f00ff', via: '#e100ff', to: '#7f00ff' },
  { from: '#fc466b', via: '#3f5efb', to: '#fc466b' },
];

// ── Modification plan generators ────────────────────────────────────

/**
 * Generate a modification plan based on problem story constraints + feedback history.
 *
 * Reads the problem description, constraints, preferences, and feedback rounds
 * to synthesize an actionable modification plan the agent "tried".
 *
 * @param {object} story — Problem Story
 * @param {number} experimentIndex — index within the round (0, 1, 2)
 * @returns {object} { agentSummary, filePath, diffSummary }
 */
function generateModificationPlan(story, experimentIndex) {
  const constraints = story.constraints || [];
  const preferences = story.preferences || [];
  const description = story.problemDescription || '';
  const feedbackRounds = story.feedbackRounds || [];
  const metrics = story.evaluationFunction?.metrics || [];

  // Strategy variants per experiment index — different "approaches"
  const strategies = [
    { style: 'conservative', prefix: 'Tried conservative ' },
    { style: 'aggressive', prefix: 'Applied aggressive ' },
    { style: 'creative', prefix: 'Explored creative ' },
  ];

  const strategy = strategies[experimentIndex % strategies.length];
  const parts = [];

  // 1. If constraints exist, generate plan based on them (T024)
  if (constraints.length > 0) {
    // Pick a constraint to address (cycle through)
    const targetConstraint = constraints[experimentIndex % constraints.length];
    parts.push(`${strategy.prefix}adjustment: ${targetConstraint}`);
  }

  // 2. If preferences exist, incorporate them
  if (preferences.length > 0) {
    const targetPref = preferences[experimentIndex % preferences.length];
    parts.push(`Aligned with preference: ${targetPref}`);
  }

  // 3. Incorporate feedback from recent rounds
  const recentFeedback = feedbackRounds.slice(-3);
  for (const fb of recentFeedback) {
    if (fb.feedback?.sentiment === 'negative' && fb.feedback?.extractedConstraints?.length > 0) {
      parts.push(`Addressed previous rejection: ${fb.feedback.extractedConstraints[0]}`);
    }
  }

  // 4. If nothing concrete, derive from problem description keywords
  if (parts.length === 0 && description) {
    const descLower = description.toLowerCase();
    if (descLower.includes('dark')) parts.push('Applied darker color palette');
    else if (descLower.includes('light')) parts.push('Switched to lighter theme tones');
    else if (descLower.includes('modern')) parts.push('Updated to modern design tokens');
    else if (descLower.includes('simple') || descLower.includes('clean')) parts.push('Simplified layout with more whitespace');
    else if (descLower.includes('fast') || descLower.includes('speed')) parts.push('Optimized rendering pipeline');
    else parts.push(`Explored ${strategy.style} approach to: "${description.slice(0, 60)}"`);
  }

  // 5. If still empty, fallback
  if (parts.length === 0) {
    parts.push(`${strategy.prefix}layout refinement`);
  }

  const agentSummary = parts.join('. ') + '.';

  // Generate synthetic file path + diff summary
  const filePath = generateFilePath(description, experimentIndex);
  const diffSummary = generateDiffSummary(agentSummary, filePath);

  return { agentSummary, filePath, diffSummary };
}

/**
 * Generate a plausible file path for the modification.
 */
function generateFilePath(description, index) {
  const descLower = (description || '').toLowerCase();
  let basePath = 'src';

  if (descLower.includes('header') || descLower.includes('nav')) basePath = 'src/components/Header';
  else if (descLower.includes('footer')) basePath = 'src/components/Footer';
  else if (descLower.includes('color') || descLower.includes('theme') || descLower.includes('palette')) basePath = 'src/styles/theme';
  else if (descLower.includes('layout') || descLower.includes('grid')) basePath = 'src/components/Layout';
  else if (descLower.includes('font') || descLower.includes('typography')) basePath = 'src/styles/typography';
  else if (descLower.includes('button') || descLower.includes('cta')) basePath = 'src/components/Button';
  else basePath = `src/experiments/round${index + 1}`;

  return `${basePath}.css`;
}

/**
 * Generate a synthetic diff summary from the agent's modification plan.
 */
function generateDiffSummary(agentSummary, filePath) {
  // Extract key actions from agentSummary
  const actions = agentSummary
    .split(/[.!?]/)
    .map(s => s.trim())
    .filter(Boolean);

  const diffs = actions.map((action, i) => {
    const lineNum = 10 + i * 5;
    return `- L${lineNum}: ${action}`;
  });

  return `Modified ${filePath}:\n${diffs.join('\n')}`;
}

// ── Scoring engine (placeholder) ─────────────────────────────────────

/**
 * Generate simulated scores for each evaluation metric.
 *
 * Placeholder scoring:
 * - quantitative: random [0.4, 1.0], weighted toward improvement over baseline
 * - qualitative: random [0.5, 1.0]
 *
 * @param {object[]} metrics — evaluationFunction.metrics
 * @param {object} baselineScores — metric ID → baseline score
 * @param {number} experimentIndex — experiment index in round
 * @returns {{ scores: object, compositeScore: number }}
 */
function generateScores(metrics, baselineScores, experimentIndex) {
  if (!metrics || metrics.length === 0) {
    return { scores: {}, compositeScore: 0.5 };
  }

  const scores = {};
  let totalWeight = 0;
  let weightedSum = 0;

  for (const metric of metrics) {
    const metricId = metric.id;
    const weight = typeof metric.weight === 'number' ? metric.weight : 1;
    const baseline = typeof baselineScores[metricId] === 'number' ? baselineScores[metricId] : 0.5;

    let score;
    if (metric.type === 'quantitative') {
      // Generate random score [0.4, 1.0] weighted toward improvement
      // Higher baseline → narrower range above baseline (diminishing returns)
      const minScore = Math.max(0.4, baseline - 0.1);
      const maxScore = Math.min(1.0, baseline + 0.4);
      score = minScore + Math.random() * (maxScore - minScore);

      // Slight bias toward improvement (70% of the time)
      if (Math.random() < 0.7) {
        score = Math.max(score, baseline + Math.random() * 0.1);
      }
    } else {
      // Qualitative: random [0.5, 1.0]
      score = 0.5 + Math.random() * 0.5;
    }

    // Clamp to [0, 1]
    score = Math.max(0, Math.min(1, score));
    scores[metricId] = Math.round(score * 100) / 100;

    totalWeight += weight;
    weightedSum += score * weight;
  }

  const compositeScore = totalWeight > 0
    ? Math.round((weightedSum / totalWeight) * 100) / 100
    : 0.5;

  return { scores, compositeScore };
}

// ── Visual representation generator ──────────────────────────────────

/**
 * Generate a CSS gradient visual for the experiment card.
 *
 * Rotates through the palette based on experiment index and round.
 *
 * @param {number} roundNumber
 * @param {number} experimentIndex
 * @param {object} scores — metric ID → score
 * @returns {object} visual object for Experiment Card
 */
function generateVisual(roundNumber, experimentIndex, scores) {
  const palette = GRADIENT_PALETTES[
    (roundNumber * MAX_EXPERIMENTS_PER_ROUND + experimentIndex) % GRADIENT_PALETTES.length
  ];

  const gradient = `linear-gradient(135deg, ${palette.from} 0%, ${palette.via} 50%, ${palette.to} 100%)`;

  // Build a metrics summary for the visual alt text
  const scoreEntries = Object.entries(scores);
  const metricsSummary = scoreEntries.length > 0
    ? scoreEntries.map(([id, score]) => `${id.slice(0, 12)}: ${score}`).join(', ')
    : 'No metrics';

  // Generate a synthetic CSS code trace showing what was "changed"
  const scoreKeys = scoreEntries.map(([id]) => id);
  const codeTrace = [
    `/* Experiment R${roundNumber}E${experimentIndex + 1} */`,
    `.experiment-card {`,
    `  background: ${gradient};`,
    `  --score-avg: ${(scoreEntries.reduce((s, [, v]) => s + v, 0) / scoreEntries.length || 0).toFixed(2)};`,
    scoreKeys.slice(0, 4).map(k => `  --metric-${k.slice(0, 8)}: ${scores[k]};`).join('\n'),
    `}`,
  ].join('\n');

  return {
    type: 'css_gradient',
    url: gradient,
    thumbnailUrl: '',
    alt: `Experiment round ${roundNumber}, variant ${experimentIndex + 1}. ${metricsSummary}`,
    codeTrace,
  };
}

// ── Round computation ────────────────────────────────────────────────

/**
 * Compute the next round number for a problem story.
 * Looks at existing cards to find the max round number.
 *
 * @param {string} problemStoryId
 * @returns {number}
 */
function computeNextRoundNumber(problemStoryId) {
  const existingCards = listExperimentCards(problemStoryId);
  let maxRound = 0;
  for (const card of existingCards) {
    if (card.roundNumber > maxRound) maxRound = card.roundNumber;
  }
  return maxRound + 1;
}

// ── Main execution function ──────────────────────────────────────────

/**
 * Run an experiment round for a Problem Story.
 *
 * @param {object} opts
 * @param {string} opts.problemStoryId
 * @param {number} [opts.numExperiments] — how many experiments (max 3)
 * @param {number} [opts.timeBudgetMs] — max time per experiment (default 420000)
 * @returns {Promise<{ cards: object[], roundNumber: number, warnings: string[] }>}
 */
async function runExperimentRound({
  problemStoryId,
  numExperiments = MAX_EXPERIMENTS_PER_ROUND,
  timeBudgetMs = DEFAULT_TIME_BUDGET_MS,
} = {}) {
  const warnings = [];
  const roundStartTime = Date.now();

  // 1. Load Problem Story
  const story = getProblemStory(problemStoryId);
  if (!story) {
    throw new Error(`Problem Story ${problemStoryId} not found`);
  }

  // 2. Verify status is active
  if (story.status !== 'active') {
    throw new Error(`Problem Story status is "${story.status}", expected "active"`);
  }

  // 3. Verify metrics exist
  const metrics = story.evaluationFunction?.metrics;
  if (!metrics || metrics.length === 0) {
    throw new Error('Evaluation function metrics are required before running experiments');
  }

  // 4. Clamp experiment count
  numExperiments = Math.min(numExperiments, MAX_EXPERIMENTS_PER_ROUND);
  numExperiments = Math.max(1, numExperiments);

  // 5. Compute round number
  const roundNumber = computeNextRoundNumber(problemStoryId);

  // 6. Run experiments (sequentially for now — parallel would be the real agent)
  const cards = [];
  const baselineScores = story.evaluationFunction.baselineScores || {};

  for (let i = 0; i < numExperiments; i++) {
    const experimentStart = Date.now();

    // Time budget check before starting each experiment
    const elapsedInRound = experimentStart - roundStartTime;
    const remainingBudget = timeBudgetMs - elapsedInRound;
    // Allow the first experiment even if budget is tight — it should complete fast
    if (i > 0 && remainingBudget < 1000) {
      warnings.push(
        `Time budget approaching limit. Skipping experiment ${i + 1} of ${numExperiments}. ` +
        `Elapsed: ${elapsedInRound}ms, budget: ${timeBudgetMs}ms`
      );
      break;
    }

    try {
      // Generate modification plan based on constraints + feedback (T024)
      const plan = generateModificationPlan(story, i);

      // Generate scores (placeholder simulation)
      const { scores, compositeScore } = generateScores(metrics, baselineScores, i);

      // Generate visual representation
      const visual = generateVisual(roundNumber, i, scores);

      // Compute duration
      const durationMs = Date.now() - experimentStart;

      // Build score display for agent summary
      const scoreDisplay = Object.entries(scores)
        .map(([metricId, score]) => `${metricId.slice(0, 15)}=${score}`)
        .join(', ');

      // Create the experiment card
      const card = createExperimentCard(problemStoryId, {
        roundNumber,
        iterationNumber: undefined, // let createExperimentCard auto-increment
        visual,
        codeReference: {
          filePath: plan.filePath,
          diffSummary: plan.diffSummary,
          commitHash: `synth_${Date.now().toString(36)}_${i}`,
        },
        agentSummary: `${plan.agentSummary} Scores: ${scoreDisplay}`,
        deltaFromLast: generateDeltaSummary(compositeScore, baselineScores),
        scores,
        compositeScore,
        status: 'pending_review',
        durationMs,
      });

      cards.push(card);
    } catch (err) {
      warnings.push(`Experiment ${i + 1} failed: ${err.message}`);
    }
  }

  // 7. Update Problem Story total iterations
  if (cards.length > 0) {
    updateProblemStory(problemStoryId, {
      totalIterations: (story.totalIterations || 0) + cards.length,
    });
  }

  // 8. Final time budget warning
  const totalDuration = Date.now() - roundStartTime;
  if (totalDuration > timeBudgetMs * 0.9) {
    warnings.push(
      `Round completed near time budget limit. Total: ${totalDuration}ms / ${timeBudgetMs}ms`
    );
  }

  return { cards, roundNumber, warnings };
}

/**
 * Generate a delta summary string comparing the new score to baselines.
 */
function generateDeltaSummary(compositeScore, baselineScores) {
  const baselineValues = Object.values(baselineScores);
  const avgBaseline = baselineValues.length > 0
    ? baselineValues.reduce((a, b) => a + b, 0) / baselineValues.length
    : 0.5;

  const delta = compositeScore - avgBaseline;
  const sign = delta >= 0 ? '+' : '';
  return `Composite ${sign}${delta.toFixed(2)} vs baseline avg ${avgBaseline.toFixed(2)}`;
}

// ── Exports ──────────────────────────────────────────────────────────

module.exports = {
  runExperimentRound,
  generateModificationPlan,
  generateScores,
  generateVisual,
  computeNextRoundNumber,
  DEFAULT_TIME_BUDGET_MS,
  MAX_EXPERIMENTS_PER_ROUND,
};
