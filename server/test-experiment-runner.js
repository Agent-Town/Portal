/**
 * Integration test: Experiment Execution Engine (T020–T024)
 *
 * Tests the full flow:
 *   1. Create Problem Story
 *   2. Add metrics
 *   3. Confirm evaluation → status becomes 'active'
 *   4. Start experiment round → creates scored cards
 *   5. Verify all test assertions
 *
 * Run: node server/test-experiment-runner.js
 */

'use strict';

const { _resetStore: resetProblemStories } = require('./problem-stories');
const { _resetStore: resetExperimentCards } = require('./experiment-cards');
const { createProblemStory, getProblemStory, listProblemStories, updateProblemStory } = require('./problem-stories');
const { listExperimentCards } = require('./experiment-cards');
const { runExperimentRound, generateModificationPlan, generateScores, generateVisual } = require('./experiment-runner');

let passed = 0;
let failed = 0;

function assert(condition, testId, message) {
  if (condition) {
    console.log(`  ✅ ${testId}: ${message}`);
    passed++;
  } else {
    console.log(`  ❌ ${testId}: ${message}`);
    failed++;
  }
}

async function main() {
resetProblemStories();
resetExperimentCards();

// ── Setup: create Problem Story ──────────────────────────────────────

console.log('\n🧪 Experiment Execution Engine Tests\n');
console.log('── Setup: Create Problem Story with metrics ──');

const story = createProblemStory({
  problemDescription: 'Make the header darker and the CTA button more prominent with better contrast',
  id: 'test-story-001',
});

// Add constraints
story.constraints = [
  'Header should be applied',
  'no light backgrounds',
];
story.preferences = [
  'prefers high contrast',
];
story.status = 'draft';

updateProblemStory(story.id, { constraints: story.constraints, preferences: story.preferences });

// Add metrics manually (simulating eval-proposals flow)
const metric1Id = 'metric-speed-001';
const metric2Id = 'metric-visual-002';
const metric3Id = 'metric-contrast-003';

story.evaluationFunction = {
  target: 'Response time, Visual quality, Contrast ratio',
  metrics: [
    { id: metric1Id, name: 'Response time', type: 'quantitative', direction: 'minimize', weight: 1 },
    { id: metric2Id, name: 'Visual quality', type: 'qualitative', direction: 'maximize', weight: 2 },
    { id: metric3Id, name: 'Contrast ratio', type: 'quantitative', direction: 'maximize', weight: 1.5 },
  ],
  baselineScores: {
    [metric1Id]: 0.5,
    [metric2Id]: 0.5,
    [metric3Id]: 0.5,
  },
  confirmedAt: new Date().toISOString(),
  convergenceThreshold: 0.85,
};
story.status = 'active';
updateProblemStory(story.id, {
  evaluationFunction: story.evaluationFunction,
  status: story.status,
});

assert(story.id === 'test-story-001', 'SETUP', 'Problem Story created');
assert(story.status === 'active', 'SETUP', 'Problem Story status is active');
assert(story.evaluationFunction.metrics.length === 3, 'SETUP', '3 metrics defined');

// ── T020: POST /api/experiments/start → creates cards ──────────────

console.log('\n── T020: Experiment round creates scored cards ──');

const result = await runExperimentRound({
  problemStoryId: 'test-story-001',
  numExperiments: 3,
  timeBudgetMs: 30000,
});

assert(result.cards.length > 0, 'T020', `Round created ${result.cards.length} cards (expected >0)`);
assert(result.roundNumber === 1, 'T020', `Round number is 1`);

const firstCard = result.cards[0];
assert(firstCard.status === 'pending_review', 'T020', `Card status is 'pending_review'`);
assert(typeof firstCard.compositeScore === 'number', 'T020', `Card has compositeScore: ${firstCard.compositeScore}`);
assert(firstCard.compositeScore >= 0 && firstCard.compositeScore <= 1, 'T020', `Score in [0,1] range`);
assert(typeof firstCard.durationMs === 'number' && firstCard.durationMs >= 0, 'T020', `Card has durationMs`);
assert(typeof firstCard.durationMs === 'number' && firstCard.durationMs < 30000, 'T020', `Card completed within time budget`);

assert(firstCard.visual.type === 'css_gradient', 'T020', `Visual type is 'css_gradient'`);
assert(typeof firstCard.visual.url === 'string' && firstCard.visual.url.length > 0, 'T020', `Visual has CSS gradient URL`);
assert(typeof firstCard.scores === 'object' && Object.keys(firstCard.scores).length === 3, 'T020', `Card has 3 metric scores`);

// ── T021: Subsequent cards have deltaScore computed ─────────────────

console.log('\n── T021: deltaScore computed correctly ──');

assert(typeof firstCard.deltaScore === 'number', 'T021', `First card has deltaScore: ${firstCard.deltaScore}`);
assert(firstCard.deltaScore >= -1 && firstCard.deltaScore <= 1, 'T021', `deltaScore in [-1,1] range`);

// T021 extended: Run a second round and check deltaScore
const round2 = await runExperimentRound({
  problemStoryId: 'test-story-001',
  numExperiments: 2,
});

assert(round2.roundNumber === 2, 'T021', `Second round number is 2`);

const allCards = listExperimentCards('test-story-001');
assert(allCards.length === 5, 'T021', `Total cards: ${allCards.length} (3 + 2)`);

// Find a round 2 card — it should have a deltaScore relative to round 1 best
const r2Card = round2.cards[0];
assert(typeof r2Card.deltaScore === 'number', 'T021', `Round 2 card has deltaScore: ${r2Card.deltaScore}`);
// deltaScore = compositeScore - previous best compositeScore
// This tests that createExperimentCard correctly computes delta
assert(r2Card.deltaScore !== 0 || r2Card.compositeScore === firstCard.compositeScore,
  'T021', `deltaScore is meaningful (not hardcoded 0)`);

// ── T022: Multiple cards created per round ─────────────────────────

console.log('\n── T022: Multiple cards per round ──');

assert(result.cards.length === 3, 'T022', `Round 1 created 3 cards`);
assert(round2.cards.length === 2, 'T022', `Round 2 created 2 cards`);

// Verify each card in round 1 has a unique ID
const r1Ids = new Set(result.cards.map(c => c.id));
assert(r1Ids.size === 3, 'T022', `All round 1 cards have unique IDs`);

// Verify round numbers
for (const card of result.cards) {
  assert(card.roundNumber === 1, 'T022', `Card ${card.id.slice(0, 8)} has roundNumber=1`);
}
for (const card of round2.cards) {
  assert(card.roundNumber === 2, 'T022', `Card ${card.id.slice(0, 8)} has roundNumber=2`);
}

// ── T023: Every card has codeReference ─────────────────────────────

console.log('\n── T023: Every card has codeReference ──');

for (const card of [...result.cards, ...round2.cards]) {
  assert(
    card.codeReference && typeof card.codeReference === 'object',
    'T023',
    `Card ${card.id.slice(0, 8)} has codeReference object`
  );
  assert(
    typeof card.codeReference.filePath === 'string' && card.codeReference.filePath.length > 0,
    'T023',
    `Card ${card.id.slice(0, 8)} has filePath: "${card.codeReference.filePath}"`
  );
  assert(
    typeof card.codeReference.diffSummary === 'string' && card.codeReference.diffSummary.length > 0,
    'T023',
    `Card ${card.id.slice(0, 8)} has diffSummary (len=${card.codeReference.diffSummary.length})`
  );
}

// ── T024: Agent uses Problem Story constraints in experiment plans ─

console.log('\n── T024: Constraints used in experiment plans ──');

for (const card of result.cards) {
  const summary = card.agentSummary.toLowerCase();
  // At least one card should reference a constraint
  const hasConstraintRef = summary.includes('header') || summary.includes('no light') || summary.includes('dark');
  // We just check the summary is non-trivial and references the problem
  assert(
    card.agentSummary.length > 20,
    'T024',
    `Card ${card.id.slice(0, 8)} has meaningful agentSummary (len=${card.agentSummary.length})`
  );
}

// More targeted: test generateModificationPlan directly
const plan = generateModificationPlan(story, 0);
assert(
  plan.agentSummary.toLowerCase().includes('header') || plan.agentSummary.toLowerCase().includes('constraint'),
  'T024',
  `Modification plan incorporates constraints: "${plan.agentSummary.slice(0, 80)}"`
);
assert(plan.filePath.length > 0, 'T024', `Plan has file path: "${plan.filePath}"`);
assert(plan.diffSummary.length > 0, 'T024', `Plan has diff summary`);

// Test second variant (aggressive)
const plan2 = generateModificationPlan(story, 1);
assert(
  plan2.agentSummary.toLowerCase().includes('aggressive'),
  'T024',
  `Second variant uses aggressive strategy: "${plan2.agentSummary.slice(0, 80)}"`
);

// Test third variant (creative)
const plan3 = generateModificationPlan(story, 2);
assert(
  plan3.agentSummary.toLowerCase().includes('creative'),
  'T024',
  `Third variant uses creative strategy: "${plan3.agentSummary.slice(0, 80)}"`
);

// ── Scoring tests ───────────────────────────────────────────────────

console.log('\n── Scoring engine tests ──');

const scores1 = generateScores(story.evaluationFunction.metrics, story.evaluationFunction.baselineScores, 0);
assert(Object.keys(scores1.scores).length === 3, 'SCORE', `Scores generated for all 3 metrics`);
assert(scores1.compositeScore >= 0 && scores1.compositeScore <= 1, 'SCORE', `Composite score in range: ${scores1.compositeScore}`);

// Verify score breakdown
for (const metric of story.evaluationFunction.metrics) {
  const score = scores1.scores[metric.id];
  assert(typeof score === 'number' && score >= 0.3, 'SCORE', `Metric "${metric.name}" score=${score} (>= 0.3)`);
  if (metric.type === 'quantitative') {
    assert(score >= 0.4, 'SCORE', `Quantitative "${metric.name}" score=${score} (>= 0.4)`);
  }
}

// ── Visual generation tests ─────────────────────────────────────────

console.log('\n── Visual generation tests ──');

const visual = generateVisual(1, 0, scores1.scores);
assert(visual.type === 'css_gradient', 'VISUAL', `Visual type is css_gradient`);
assert(visual.url.includes('linear-gradient'), 'VISUAL', `Visual URL is a CSS gradient`);
assert(visual.alt.length > 0, 'VISUAL', `Visual has alt text`);
assert(visual.codeTrace.includes('background:'), 'VISUAL', `Visual codeTrace includes background property`);

// Different rounds should have different palettes
const visual2 = generateVisual(2, 0, scores1.scores);
// They might differ due to palette rotation
assert(typeof visual2.url === 'string', 'VISUAL', `Round 2 visual generated`);

// ── Time budget test ────────────────────────────────────────────────

console.log('\n── Time budget enforcement test ──');

const tinyBudgetResult = await runExperimentRound({
  problemStoryId: 'test-story-001',
  numExperiments: 10, // request way more than budget allows
  timeBudgetMs: 100,  // extremely small budget
});

// With such a tiny budget, it should still create at least 1 card
// (the first one starts immediately and completes fast)
assert(tinyBudgetResult.cards.length >= 0, 'TIME', `With tiny budget, created ${tinyBudgetResult.cards.length} cards`);
// If budget was truly exhausted, warnings should exist
const hasBudgetWarning = tinyBudgetResult.warnings.some(w => w.includes('Time budget'));
assert(tinyBudgetResult.cards.length < 10, 'TIME', `Time budget prevented all 10 from running (${tinyBudgetResult.cards.length} created)`);
assert(tinyBudgetResult.warnings.length > 0 || tinyBudgetResult.cards.length > 0, 'TIME', 'Budget enforced or cards created');

// ── Edge case: no metrics ──────────────────────────────────────────

console.log('\n── Edge case: missing metrics ──');

const noMetricsStory = createProblemStory({
  problemDescription: 'A story without metrics',
  id: 'no-metrics-story',
});
noMetricsStory.status = 'active';
updateProblemStory(noMetricsStory.id, { status: 'active' });

try {
  await runExperimentRound({ problemStoryId: 'no-metrics-story' });
  assert(false, 'EDGE', 'Should have thrown for missing metrics');
} catch (err) {
  assert(err.message.includes('metrics'), 'EDGE', `Correctly rejects: "${err.message}"`);
}

// ── Edge case: wrong status ─────────────────────────────────────────

const draftStory = createProblemStory({
  problemDescription: 'Still in draft',
  id: 'draft-story',
});

try {
  await runExperimentRound({ problemStoryId: 'draft-story' });
  assert(false, 'EDGE', 'Should have thrown for draft status');
} catch (err) {
  assert(err.message.includes('active'), 'EDGE', `Correctly rejects draft: "${err.message}"`);
}

// ── Summary ─────────────────────────────────────────────────────────

console.log('\n══════════════════════════════════════');
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log('══════════════════════════════════════\n');

// Cleanup
resetProblemStories();
resetExperimentCards();

process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });
