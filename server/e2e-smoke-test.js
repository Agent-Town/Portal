#!/usr/bin/env node
/**
 * ZHC1 End-to-End Smoke Test
 *
 * Exercises the entire iteration feed loop as a user would experience it:
 *   Create → Evaluate → Iterate → Feedback → Converge → Publish → Discover → Pull Context
 *
 * Usage:
 *   NODE_ENV=test node server/e2e-smoke-test.js
 */

'use strict';

const http = require('http');
const express = require('express');
const assert = require('assert');

// ── Reset in-memory stores for a clean slate ─────────────────────────
const { _resetStore: resetProblemStories } = require('./problem-stories');
const { _resetStore: resetExperimentCards } = require('./experiment-cards');
const { _resetStore: resetSaveGames } = require('./save-game');
const { _resetStore: resetPublication } = require('./publication');

// ── Build a minimal Express app with only the ZHC1 routers ───────────
// Mounted in the same order as the real server/index.js
const app = express();
app.use(express.json({ limit: '1mb' }));

const { problemStoriesRouter } = require('./problem-stories');
app.use('/api/problem-stories', problemStoriesRouter);

const { router: evalRouter } = require('./evaluation');
app.use('/api/problem-stories', evalRouter);

const { experimentCardsRouter } = require('./experiment-cards');
app.use('/api/problem-stories', experimentCardsRouter);

const { feedbackRouter } = require('./feedback');
app.use('/api/experiment-cards', feedbackRouter);

const { router: saveGameRouter } = require('./save-game');
app.use('/api/save-games', saveGameRouter);

const iterationLoopRouter = require('./iteration-loop');
app.use('/api/iteration-loop', iterationLoopRouter);

const { router: publicationRouter } = require('./publication');
app.use('/api', publicationRouter);

const { router: discoveryRouter } = require('./discovery');
app.use('/api/discovery-feed', discoveryRouter);

// ── Test harness ─────────────────────────────────────────────────────

const SERVER_PORT = 57381;
const results = [];
let stepIndex = 0;

function pass(step, detail = '') {
  stepIndex++;
  results.push({ step: stepIndex, name: step, status: 'PASS', detail });
  console.log(`  ✅ PASS ${stepIndex}. ${step}${detail ? ` — ${detail}` : ''}`);
}

function fail(step, detail = '') {
  stepIndex++;
  results.push({ step: stepIndex, name: step, status: 'FAIL', detail });
  console.log(`  ❌ FAIL ${stepIndex}. ${step}${detail ? ` — ${detail}` : ''}`);
}

function skip(step, detail = '') {
  stepIndex++;
  results.push({ step: stepIndex, name: step, status: 'SKIP', detail });
  console.log(`  ⏭️  SKIP ${stepIndex}. ${step}${detail ? ` — ${detail}` : ''}`);
}

/**
 * Make an HTTP request to the Express app via a bound server.
 * Returns { status, body } where body is the parsed JSON.
 */
function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);
    const opts = {
      hostname: '127.0.0.1',
      port: SERVER_PORT,
      path,
      method,
      headers,
    };

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch { parsed = data; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

/**
 * Wrap a test step in try/catch for resilience — one failure shouldn't kill the run.
 */
async function testStep(name, fn) {
  try {
    await fn();
  } catch (err) {
    fail(name, err.message || String(err));
  }
}

// ── Main test sequence ───────────────────────────────────────────────

async function main() {
  const server = app.listen(SERVER_PORT, '127.0.0.1', () => {});

  try {
    await runTests();
  } finally {
    server.close();
  }
}

async function runTests() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║          ZHC1 End-to-End Smoke Test                   ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Reset all stores
  resetProblemStories();
  resetExperimentCards();
  resetSaveGames();
  resetPublication();

  let storyId = null;
  let cardId = null;
  let saveGameId = null;
  let publishedStreamId = null;

  // ─── 1. Create Problem Story ────────────────────────────────────
  await testStep('Create Problem Story', async () => {
    const res = await request('POST', '/api/problem-stories', {
      problemDescription: 'Make my landing page load faster',
    });
    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}`);
    assert.ok(res.body, 'Response body should exist');
    storyId = res.body.id;
    assert.ok(storyId, 'Response should include an id');
    assert.strictEqual(res.body.status, 'draft', `Expected status=draft, got ${res.body.status}`);
    assert.ok(res.body.problemDescription, 'Should have problemDescription');
    pass('Create Problem Story', `id=${storyId.slice(0, 8)}...`);
  });

  if (!storyId) {
    console.log('\n  ⚠️  Story creation failed — aborting remaining steps.');
    for (const name of [
      'Get Evaluation Proposals', 'Add Custom Metric', 'Confirm Evaluation',
      'Run Experiment Round', 'Review Cards', 'Give Feedback',
      'Check Problem Story Updated', 'Run Second Round', 'Check Convergence Status',
      'Check Score Trend', 'Save Game', 'Load Save Game', 'Finish Project',
      'Publish', 'Discovery Feed', 'Pull Context',
    ]) { skip(name, 'Prerequisite failed'); }
    printSummary();
    return;
  }

  // ─── 2. Get Evaluation Proposals ────────────────────────────────
  await testStep('Get Evaluation Proposals', async () => {
    const res = await request('GET', `/api/problem-stories/${storyId}/eval-proposals`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    // Response has proposedMetrics (evaluation.js) and existingMetrics
    const metrics = res.body.proposedMetrics || res.body.metrics || [];
    assert.ok(Array.isArray(metrics), `Response should have metrics array, got keys: ${Object.keys(res.body).join(', ')}`);
    assert.ok(metrics.length >= 1, `Expected ≥1 metric, got ${metrics.length}`);
    pass('Get Evaluation Proposals', `${metrics.length} metric(s) proposed`);
  });

  // ─── 3. Add a Custom Metric ────────────────────────────────────
  // NOTE: Both problem-stories.js and evaluation.js mount POST /:id/eval-proposals/metrics.
  // problem-stories is mounted first, so it shadows evaluation. It requires name/type/direction.
  await testStep('Add Custom Metric', async () => {
    const res = await request('POST', `/api/problem-stories/${storyId}/eval-proposals/metrics`, {
      name: 'Page Load Time',
      type: 'quantitative',
      direction: 'minimize',
      unit: 'seconds',
      range: { min: 0, max: 10 },
    });
    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.ok(res.body.id, 'Metric should have an id');
    assert.ok(res.body.name, 'Metric should have a name');
    pass('Add Custom Metric', `name="${res.body.name}"`);
  });

  // ─── 4. Confirm Evaluation ─────────────────────────────────────
  await testStep('Confirm Evaluation', async () => {
    const res = await request('POST', `/api/problem-stories/${storyId}/eval-confirm`, {});
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body).slice(0, 200)}`);
    assert.strictEqual(res.body.status, 'active', `Expected status=active, got ${res.body.status}`);
    // Verify on the story itself
    const storyRes = await request('GET', `/api/problem-stories/${storyId}`);
    assert.strictEqual(storyRes.body.status, 'active', `Story status should be active, got ${storyRes.body.status}`);
    assert.ok(storyRes.body.evaluationFunction.confirmedAt, 'Should have confirmedAt');
    assert.ok(
      typeof storyRes.body.evaluationFunction.baselineScores === 'object',
      'Should have baselineScores',
    );
    const scoreKeys = Object.keys(storyRes.body.evaluationFunction.baselineScores);
    assert.ok(scoreKeys.length >= 1, `Should have ≥1 baseline score, got ${scoreKeys.length}`);
    pass('Confirm Evaluation', `status=active, ${scoreKeys.length} baseline(s)`);
  });

  // ─── 5. Run Experiment Round ───────────────────────────────────
  await testStep('Run Experiment Round', async () => {
    const res = await request('POST', '/api/iteration-loop/next-round', {
      problemStoryId: storyId,
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body).slice(0, 200)}`);
    assert.ok(res.body.ok, 'Response should be ok');
    assert.ok(res.body.data, 'Should have data');
    assert.ok(res.body.data.cards, 'Data should have cards');
    assert.ok(res.body.data.cards.length >= 2, `Expected ≥2 cards, got ${res.body.data.cards.length}`);
    cardId = res.body.data.cards[0].id;
    assert.ok(cardId, 'First card should have an id');
    pass('Run Experiment Round', `${res.body.data.cardsCreated} card(s) created`);
  });

  // ─── 6. Review Cards ───────────────────────────────────────────
  await testStep('Review Cards', async () => {
    const res = await request('GET', `/api/problem-stories/${storyId}/experiment-cards`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    // Cards endpoint returns {ok: true, cards: [...]}
    const cards = res.body.cards || (Array.isArray(res.body) ? res.body : []);
    assert.ok(cards.length >= 2, `Expected ≥2 cards, got ${cards.length}`);
    // Check sorted by iteration desc
    for (let i = 1; i < cards.length; i++) {
      assert.ok(
        cards[i - 1].iterationNumber >= cards[i].iterationNumber,
        'Cards should be sorted by iteration desc',
      );
    }
    // Keep the best card for feedback
    if (!cardId || !cards.find((c) => c.id === cardId)) {
      cardId = cards[0].id;
    }
    pass('Review Cards', `${cards.length} card(s), sorted desc`);
  });

  // ─── 7. Give Feedback on Best Card ─────────────────────────────
  await testStep('Give Feedback on Best Card', async () => {
    if (!cardId) { skip('Give Feedback on Best Card', 'No cardId available'); return; }
    const res = await request('POST', `/api/experiment-cards/${cardId}/feedback`, {
      modality: 'text',
      textContent: 'Make the header darker and reduce padding',
      reviewDurationMs: 3000,
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body).slice(0, 200)}`);
    assert.ok(res.body.ok, 'Response should be ok');
    assert.ok(res.body.data, 'Should have data with updated card');
    assert.ok(res.body.data.feedback, 'Card should have feedback');
    assert.ok(res.body.data.feedback.extractedConstraints, 'Feedback should have extractedConstraints');
    assert.ok(res.body.data.status, 'Card should have a status after feedback');
    pass('Give Feedback on Best Card', `sentiment=${res.body.data.feedback?.sentiment || '?'}, ${res.body.data.feedback?.extractedConstraints?.length || 0} constraint(s), status=${res.body.data.status}`);
  });

  // ─── 8. Check Problem Story Updated ────────────────────────────
  await testStep('Check Problem Story Updated', async () => {
    const res = await request('GET', `/api/problem-stories/${storyId}`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert.ok(Array.isArray(res.body.constraints), 'Should have constraints array');
    assert.ok(res.body.constraints.length >= 1, `Constraints should have grown, got ${res.body.constraints.length}`);
    assert.ok(Array.isArray(res.body.feedbackRounds), 'Should have feedbackRounds array');
    assert.ok(res.body.feedbackRounds.length >= 1, `Should have ≥1 feedback round, got ${res.body.feedbackRounds.length}`);
    pass('Check Problem Story Updated', `${res.body.constraints.length} constraints, ${res.body.feedbackRounds.length} round(s)`);
  });

  // ─── 9. Run Second Round ───────────────────────────────────────
  await testStep('Run Second Round', async () => {
    const res = await request('POST', '/api/iteration-loop/next-round', {
      problemStoryId: storyId,
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body).slice(0, 200)}`);
    assert.ok(res.body.data.cards.length >= 1, `Expected ≥1 card in round 2, got ${res.body.data.cards.length}`);
    // Verify second round has higher iteration numbers
    assert.ok(
      res.body.data.cards.every((c) => c.iterationNumber >= 2),
      'Round 2 cards should have iterationNumber ≥ 2',
    );
    pass('Run Second Round', `${res.body.data.cardsCreated} card(s) in round 2`);
  });

  // ─── 10. Check Convergence Status ──────────────────────────────
  await testStep('Check Convergence Status', async () => {
    const res = await request('GET', `/api/iteration-loop/convergence-status?problemStoryId=${storyId}`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert.ok(res.body.ok, 'Response should be ok');
    assert.ok(res.body.data, 'Should have data');
    assert.ok(typeof res.body.data.converged === 'boolean', 'Data should have converged boolean');
    assert.ok(typeof res.body.data.currentScore === 'number', 'Data should have currentScore');
    pass('Check Convergence Status', `converged=${res.body.data.converged}, currentScore=${res.body.data.currentScore}`);
  });

  // ─── 11. Check Score Trend ─────────────────────────────────────
  await testStep('Check Score Trend', async () => {
    const res = await request('GET', `/api/iteration-loop/score-trend?problemStoryId=${storyId}`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert.ok(res.body.ok, 'Response should be ok');
    assert.ok(res.body.data, 'Should have data');
    assert.ok(Array.isArray(res.body.data.points), 'Data should have points array');
    assert.ok(res.body.data.points.length >= 1, `Expected ≥1 trend point, got ${res.body.data.points.length}`);
    pass('Check Score Trend', `${res.body.data.points.length} point(s)`);
  });

  // ─── 12. Save Game ─────────────────────────────────────────────
  await testStep('Save Game', async () => {
    const res = await request('POST', '/api/save-games', {
      problemStoryId: storyId,
      label: 'Checkpoint 1',
    });
    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.body).slice(0, 200)}`);
    assert.ok(res.body.ok, 'Response should be ok');
    assert.ok(res.body.saveGame, 'Should have saveGame');
    assert.ok(res.body.saveGame.id, 'Save game should have an id');
    saveGameId = res.body.saveGame.id;
    assert.strictEqual(res.body.saveGame.label, 'Checkpoint 1', `Expected label=Checkpoint 1, got ${res.body.saveGame.label}`);
    pass('Save Game', `id=${saveGameId.slice(0, 8)}...`);
  });

  // ─── 13. Load Save Game ────────────────────────────────────────
  await testStep('Load Save Game', async () => {
    if (!saveGameId) { skip('Load Save Game', 'No saveGameId available'); return; }
    const res = await request('POST', `/api/save-games/${saveGameId}/load`, {});
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body).slice(0, 200)}`);
    assert.ok(res.body.problemStory, 'Should have restored problemStory');
    assert.strictEqual(res.body.problemStory.id, storyId, 'Restored story should match original');
    pass('Load Save Game', `story restored`);
  });

  // ─── 14. Finish Project ────────────────────────────────────────
  await testStep('Finish Project', async () => {
    const res = await request('PUT', `/api/problem-stories/${storyId}/finish`, {});
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body).slice(0, 200)}`);
    assert.ok(res.body.ok, 'Response should be ok');
    // Verify story status changed to converged
    const storyRes = await request('GET', `/api/problem-stories/${storyId}`);
    assert.strictEqual(storyRes.body.status, 'converged', `Expected status=converged, got ${storyRes.body.status}`);
    pass('Finish Project', 'status=converged');
  });

  // ─── 15. Publish ───────────────────────────────────────────────
  await testStep('Publish', async () => {
    const res = await request('POST', '/api/published-streams', {
      problemStoryId: storyId,
    });
    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.body).slice(0, 200)}`);
    assert.ok(res.body.ok, 'Response should be ok');
    assert.ok(res.body.publishedStream, 'Should have publishedStream');
    publishedStreamId = res.body.publishedStream.id;
    assert.ok(publishedStreamId, 'Published stream should have an id');
    pass('Publish', `stream=${publishedStreamId.slice(0, 8)}...`);
  });

  // ─── 16. Discovery Feed ───────────────────────────────────────
  await testStep('Discovery Feed', async () => {
    const res = await request('GET', '/api/discovery-feed');
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert.ok(res.body.ok, 'Response should be ok');
    assert.ok(typeof res.body.total === 'number', 'Should have total count');
    assert.ok(Array.isArray(res.body.results), 'Should have results array');
    // Find our published stream
    const found = res.body.results.find((s) =>
      s.id === publishedStreamId || s.problemStoryId === storyId
    );
    assert.ok(found, `Should find our published stream in discovery feed (${res.body.total} total)`);
    pass('Discovery Feed', `${res.body.total} stream(s), ours found`);
  });

  // ─── 17. Pull Context ──────────────────────────────────────────
  await testStep('Pull Context', async () => {
    if (!publishedStreamId) { skip('Pull Context', 'No publishedStreamId available'); return; }

    // Create a second problem story
    const createRes = await request('POST', '/api/problem-stories', {
      problemDescription: 'Optimize my website performance and reduce bounce rate',
    });
    assert.strictEqual(createRes.status, 201, `Story 2 creation failed: ${JSON.stringify(createRes.body).slice(0, 100)}`);
    const newStoryId = createRes.body.id;
    assert.ok(newStoryId, 'Second story should have an id');

    // Pull context from the published stream into the new story
    const res = await request('POST', `/api/discovery-feed/${publishedStreamId}/pull-context`, {
      problemStoryId: newStoryId,
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body).slice(0, 200)}`);
    assert.ok(res.body.ok, 'Pull should be ok');
    assert.ok(res.body.problemStory, 'Should return the updated problem story');

    // The pull-context endpoint stores insights in the story's context array.
    // Even if 0 insights were pulled (no overlapping keywords), the endpoint worked.
    const storyRes = await request('GET', `/api/problem-stories/${newStoryId}`);
    assert.strictEqual(storyRes.status, 200, 'Failed to get new story');
    assert.ok(Array.isArray(storyRes.body.context), 'Story should have context array');
    pass('Pull Context', `${res.body.pulled} insight(s) pulled, context=${storyRes.body.context.length} entries`);
  });

  // ── Summary ──────────────────────────────────────────────────────
  printSummary();
}

function printSummary() {
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const skipped = results.filter((r) => r.status === 'SKIP').length;
  const total = results.length;

  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('══════════════════════════════════════════════════════════');
  console.log(`  Total:    ${total}`);
  console.log(`  Passed:   ${passed}`);
  console.log(`  Failed:   ${failed}`);
  console.log(`  Skipped:  ${skipped}`);
  console.log('──────────────────────────────────────────────────────────');

  if (failed > 0) {
    console.log('  FAILURES:');
    for (const r of results.filter((r) => r.status === 'FAIL')) {
      console.log(`    #${r.step} ${r.name}: ${r.detail}`);
    }
  }

  console.log('══════════════════════════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('\n💥 Fatal error:', err);
  process.exit(2);
});
