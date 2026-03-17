/**
 * Iteration Loop tests — ZHC1 §7.6
 *
 * Tests:
 *   T050: After feedback on cards → next round triggered, new cards created
 *   T051: Convergence detected when improvement plateaus for 3 rounds
 *   T052: Score trend endpoint returns data for sparkline rendering
 *
 * Run: node server/iteration-loop.test.js
 */

const assert = require('assert');
const http = require('http');

// ── Bootstrap server ───────────────────────────────────────────────

// Reset stores before requiring server modules
process.env.NODE_ENV = 'test';

const { createProblemStory, _resetStore: resetProblemStore, getProblemStory, updateProblemStory } = require('./problem-stories');
const { createExperimentCard, _resetStore: resetCardsStore, listExperimentCards, getCardById, updateCardById } = require('./experiment-cards');
const { _resetStore: resetFeedbackStore } = require('./feedback');
const {
  router: iterationLoopRouter,
  runExperimentRound,
  getCurrentRoundNumber,
  hasReviewedCardsInCurrentRound,
  computeRoundSummaries,
  computeImprovementRates,
  checkConvergence,
  IMPROVEMENT_RATE_THRESHOLD,
  CONVERGENCE_PLATEAU_ROUNDS,
} = require('./iteration-loop');

const express = require('express');

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/iteration-loop', iterationLoopRouter);
  return app;
}

let server = null;

function startServer(app) {
  return new Promise((resolve, reject) => {
    server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve(port);
    });
    server.on('error', reject);
  });
}

function stopServer() {
  return new Promise((resolve) => {
    if (server) server.close(resolve);
    else resolve();
  });
}

async function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, `http://127.0.0.1:${server.address().port}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'content-type': 'application/json' },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { data = JSON.parse(data); } catch {}
        resolve({ status: res.statusCode, body: data });
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ── Helpers ────────────────────────────────────────────────────────

function resetAll() {
  resetProblemStore();
  resetCardsStore();
  if (typeof resetFeedbackStore === 'function') resetFeedbackStore();
}

/**
 * Create a story + some cards + submit feedback on them.
 * Returns storyId and cardIds.
 */
function setupStoryWithFeedback(roundScore = 0.7) {
  const story = createProblemStory({
    problemDescription: 'Build a beautiful landing page',
  });
  updateProblemStory(story.id, {
    status: 'active',
    evaluationFunction: {
      target: 'Visual quality',
      metrics: [{ id: 'm1', name: 'Aesthetic', type: 'qualitative', direction: 'maximize' }],
      baselineScores: { aesthetic: 0.3 },
    },
  });

  // Create round 1 cards
  const card1 = createExperimentCard(story.id, {
    roundNumber: 1,
    compositeScore: roundScore,
    agentSummary: 'Variant A',
    status: 'pending_review',
  });
  const card2 = createExperimentCard(story.id, {
    roundNumber: 1,
    compositeScore: roundScore - 0.05,
    agentSummary: 'Variant B',
    status: 'pending_review',
  });

  // Submit feedback (simulate what feedback.js does)
  updateCardById(card1.id, {
    feedback: {
      cardId: card1.id,
      timestamp: new Date().toISOString(),
      modality: 'text',
      textContent: 'This looks great, keep it',
      sentiment: 'positive',
      extractedConstraints: [],
    },
    status: 'kept',
  });
  updateCardById(card2.id, {
    feedback: {
      cardId: card2.id,
      timestamp: new Date().toISOString(),
      modality: 'text',
      textContent: 'Not quite right',
      sentiment: 'negative',
      extractedConstraints: [],
    },
    status: 'discarded',
  });

  return { storyId: story.id, cardIds: [card1.id, card2.id] };
}

// ── Tests ──────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

async function test(name, fn) {
  resetAll();
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

async function main() {
  const app = createTestApp();
  const port = await startServer(app);
  console.log(`\nIteration Loop Tests (port ${port})\n`);

  // ── T050: After feedback → next round triggered, new cards created ──

  await test('T050: POST /next-round with feedback → 200, new cards created', async () => {
    const { storyId } = setupStoryWithFeedback(0.7);

    const res = await request('POST', '/api/iteration-loop/next-round', { problemStoryId: storyId });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.ok, true);
    assert.strictEqual(res.body.data.roundNumber, 2);
    assert.ok(res.body.data.cardsCreated >= 2, `Expected >= 2 cards, got ${res.body.data.cardsCreated}`);
    assert.ok(Array.isArray(res.body.data.cards));

    // Verify cards exist in the store
    const cards = listExperimentCards(storyId);
    const round2Cards = cards.filter((c) => c.roundNumber === 2);
    assert.strictEqual(round2Cards.length, res.body.data.cardsCreated);
  });

  await test('T050: POST /next-round without feedback → 400', async () => {
    const story = createProblemStory({ problemDescription: 'Test' });
    createExperimentCard(story.id, { roundNumber: 1, compositeScore: 0.5, status: 'pending_review' });

    const res = await request('POST', '/api/iteration-loop/next-round', { problemStoryId: story.id });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error, 'NEED_FEEDBACK_FIRST');
  });

  await test('T050: POST /next-round without storyId → 400', async () => {
    const res = await request('POST', '/api/iteration-loop/next-round', {});
    assert.strictEqual(res.status, 400);
  });

  await test('T050: POST /next-round with unknown story → 404', async () => {
    const res = await request('POST', '/api/iteration-loop/next-round', { problemStoryId: 'nonexistent' });
    assert.strictEqual(res.status, 404);
  });

  await test('T050: First round (no cards) → allowed, round 1 cards created', async () => {
    const story = createProblemStory({ problemDescription: 'Test first round' });

    const res = await request('POST', '/api/iteration-loop/next-round', { problemStoryId: story.id });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.roundNumber, 1);
    assert.ok(res.body.data.cardsCreated >= 2);
  });

  await test('T050: Multiple rounds in sequence', async () => {
    // Round 1
    const story = createProblemStory({ problemDescription: 'Test multi-round' });
    const res1 = await request('POST', '/api/iteration-loop/next-round', { problemStoryId: story.id });
    assert.strictEqual(res1.body.data.roundNumber, 1);

    // Give feedback on round 1 cards
    const cards = listExperimentCards(story.id);
    updateCardById(cards[0].id, {
      feedback: { cardId: cards[0].id, modality: 'text', textContent: 'Good', sentiment: 'positive' },
      status: 'kept',
    });

    // Round 2
    const res2 = await request('POST', '/api/iteration-loop/next-round', { problemStoryId: story.id });
    assert.strictEqual(res2.body.data.roundNumber, 2);

    // Give feedback on round 2 cards
    const cards2 = listExperimentCards(story.id).filter((c) => c.roundNumber === 2);
    updateCardById(cards2[0].id, {
      feedback: { cardId: cards2[0].id, modality: 'text', textContent: 'Better', sentiment: 'positive' },
      status: 'kept',
    });

    // Round 3
    const res3 = await request('POST', '/api/iteration-loop/next-round', { problemStoryId: story.id });
    assert.strictEqual(res3.body.data.roundNumber, 3);
  });

  // ── T051: Convergence detected when improvement plateaus ──────────

  await test('T051: GET /convergence-status — no rounds → not converged', async () => {
    const story = createProblemStory({ problemDescription: 'Test convergence' });

    const res = await request('GET', `/api/iteration-loop/convergence-status?problemStoryId=${story.id}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.converged, false);
    assert.strictEqual(res.body.data.currentScore, 0);
  });

  await test('T051: Convergence via threshold met', async () => {
    const story = createProblemStory({ problemDescription: 'Test threshold convergence' });
    updateProblemStory(story.id, {
      evaluationFunction: {
        ...story.evaluationFunction,
        convergenceThreshold: 0.85,
      },
    });

    // Create cards with high score
    createExperimentCard(story.id, {
      roundNumber: 1,
      compositeScore: 0.88,
      status: 'kept',
    });

    const res = await request('GET', `/api/iteration-loop/convergence-status?problemStoryId=${story.id}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.converged, true);
    assert.ok(res.body.data.message.includes('convergence threshold'));
  });

  await test('T051: Convergence via plateau (3 rounds with low improvement)', async () => {
    const story = createProblemStory({ problemDescription: 'Test plateau convergence' });

    // Create 4 rounds with minimal improvement after round 1
    createExperimentCard(story.id, { roundNumber: 1, compositeScore: 0.50, status: 'kept' });
    createExperimentCard(story.id, { roundNumber: 2, compositeScore: 0.51, status: 'kept' });  // +2%
    createExperimentCard(story.id, { roundNumber: 3, compositeScore: 0.515, status: 'kept' }); // +1%
    createExperimentCard(story.id, { roundNumber: 4, compositeScore: 0.52, status: 'kept' });  // +1%

    const status = checkConvergence(story.id);
    assert.strictEqual(status.converged, true, `Expected converged, got ${JSON.stringify(status)}`);
    assert.strictEqual(status.roundsWithoutImprovement, 3);
  });

  await test('T051: No convergence with good improvement', async () => {
    const story = createProblemStory({ problemDescription: 'Test no convergence' });

    createExperimentCard(story.id, { roundNumber: 1, compositeScore: 0.40, status: 'kept' });
    createExperimentCard(story.id, { roundNumber: 2, compositeScore: 0.55, status: 'kept' }); // +37.5%
    createExperimentCard(story.id, { roundNumber: 3, compositeScore: 0.70, status: 'kept' }); // +27%

    const status = checkConvergence(story.id);
    assert.strictEqual(status.converged, false);
    assert.ok(status.improvementRate > IMPROVEMENT_RATE_THRESHOLD);
  });

  await test('T051: GET /convergence-status — unknown story → 404', async () => {
    const res = await request('GET', '/api/iteration-loop/convergence-status?problemStoryId=nonexistent');
    assert.strictEqual(res.status, 404);
  });

  await test('T051: GET /convergence-status — missing param → 400', async () => {
    const res = await request('GET', '/api/iteration-loop/convergence-status');
    assert.strictEqual(res.status, 400);
  });

  // ── T052: Score trend endpoint ───────────────────────────────────

  await test('T052: GET /score-trend returns points and baseline', async () => {
    const story = createProblemStory({ problemDescription: 'Test score trend' });
    updateProblemStory(story.id, {
      evaluationFunction: {
        ...story.evaluationFunction,
        baselineScores: { aesthetic: 0.25, usability: 0.35 },
      },
    });

    createExperimentCard(story.id, { roundNumber: 1, compositeScore: 0.67, status: 'kept' });
    createExperimentCard(story.id, { roundNumber: 1, compositeScore: 0.55, status: 'discarded' });
    createExperimentCard(story.id, { roundNumber: 2, compositeScore: 0.83, status: 'kept' });
    createExperimentCard(story.id, { roundNumber: 2, compositeScore: 0.72, status: 'kept' });
    createExperimentCard(story.id, { roundNumber: 3, compositeScore: 0.91, status: 'kept' });
    createExperimentCard(story.id, { roundNumber: 3, compositeScore: 0.85, status: 'kept' });

    const res = await request('GET', `/api/iteration-loop/score-trend?problemStoryId=${story.id}`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.ok);

    const { points, baseline } = res.body.data;
    assert.ok(Array.isArray(points), 'points should be an array');
    assert.strictEqual(points.length, 3, 'should have 3 rounds');

    // Round 1
    assert.strictEqual(points[0].round, 1);
    assert.strictEqual(points[0].bestScore, 0.67);

    // Round 2
    assert.strictEqual(points[1].round, 2);
    assert.strictEqual(points[1].bestScore, 0.83);

    // Round 3
    assert.strictEqual(points[2].round, 3);
    assert.strictEqual(points[2].bestScore, 0.91);

    // Baseline from story
    assert.ok(typeof baseline === 'number');
    assert.strictEqual(baseline, 0.3); // avg of 0.25 and 0.35
  });

  await test('T052: GET /score-trend — no cards → empty points', async () => {
    const story = createProblemStory({ problemDescription: 'Test empty trend' });

    const res = await request('GET', `/api/iteration-loop/score-trend?problemStoryId=${story.id}`);
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data.points));
    assert.strictEqual(res.body.data.points.length, 0);
    assert.strictEqual(res.body.data.baseline, 0.3); // default baseline
  });

  await test('T052: GET /score-trend — unknown story → 404', async () => {
    const res = await request('GET', '/api/iteration-loop/score-trend?problemStoryId=nonexistent');
    assert.strictEqual(res.status, 404);
  });

  await test('T052: GET /score-trend — missing param → 400', async () => {
    const res = await request('GET', '/api/iteration-loop/score-trend');
    assert.strictEqual(res.status, 400);
  });

  // ── Unit tests for internal functions ────────────────────────────

  await test('Unit: computeRoundSummaries groups correctly', () => {
    resetAll();
    const story = createProblemStory({ problemDescription: 'Unit test' });
    createExperimentCard(story.id, { roundNumber: 1, compositeScore: 0.5 });
    createExperimentCard(story.id, { roundNumber: 1, compositeScore: 0.7 });
    createExperimentCard(story.id, { roundNumber: 2, compositeScore: 0.8 });
    createExperimentCard(story.id, { roundNumber: 2, compositeScore: 0.6 });

    const summaries = computeRoundSummaries(story.id);
    assert.strictEqual(summaries.length, 2);
    assert.strictEqual(summaries[0].round, 1);
    assert.strictEqual(summaries[0].bestScore, 0.7);
    assert.strictEqual(summaries[0].avgScore, 0.6);
    assert.strictEqual(summaries[1].round, 2);
    assert.strictEqual(summaries[1].bestScore, 0.8);
  });

  await test('Unit: computeImprovementRates calculates correctly', () => {
    const summaries = [
      { round: 1, bestScore: 0.5 },
      { round: 2, bestScore: 0.6 },
      { round: 3, bestScore: 0.65 },
    ];
    const rates = computeImprovementRates(summaries);
    assert.strictEqual(rates.length, 2);
    assert.strictEqual(rates[0].round, 2);
    // (0.6 - 0.5) / 0.5 = 0.2
    assert.strictEqual(rates[0].rate, 0.2);
    // (0.65 - 0.6) / 0.6 = 0.083
    assert.ok(Math.abs(rates[1].rate - 0.083) < 0.01);
  });

  await test('Unit: hasReviewedCardsInCurrentRound', () => {
    resetAll();
    const story = createProblemStory({ problemDescription: 'Unit test' });
    assert.strictEqual(hasReviewedCardsInCurrentRound(story.id), false);

    // Add unreviewed card
    createExperimentCard(story.id, { roundNumber: 1, compositeScore: 0.5, status: 'pending_review' });
    assert.strictEqual(hasReviewedCardsInCurrentRound(story.id), false);

    // Add reviewed card
    const card = createExperimentCard(story.id, { roundNumber: 1, compositeScore: 0.6, status: 'pending_review' });
    updateCardById(card.id, { feedback: { modality: 'text' }, status: 'kept' });
    assert.strictEqual(hasReviewedCardsInCurrentRound(story.id), true);
  });

  // ── Shutdown ─────────────────────────────────────────────────────

  await stopServer();

  console.log(`\n── Results: ${passed} passed, ${failed} failed ──\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  stopServer().then(() => process.exit(1));
});
