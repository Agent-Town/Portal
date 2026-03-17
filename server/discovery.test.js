/**
 * Discovery Feed tests — ZHC1 T080, T081, T082
 *
 * Tests:
 *   T080: Discovery feed shows only published streams (not draft/active/saved/converged)
 *   T081: Results ranked by keyword similarity when problemStoryId provided
 *   T082: Pull context adds insights from discovery stream to Problem Story
 *
 * Run: node server/discovery.test.js
 */

const assert = require('assert');
const http = require('http');

// ── Bootstrap server ───────────────────────────────────────────────

process.env.NODE_ENV = 'test';

const {
  createProblemStory,
  _resetStore: resetProblemStore,
  getProblemStory,
  updateProblemStory,
} = require('./problem-stories');
const {
  _resetStore: resetCardsStore,
} = require('./experiment-cards');
// feedback.js has no _resetStore
const {
  extractKeywords,
  keywordSimilarity,
  getPublishedStreams,
  buildStreamSummary,
  extractInsights,
} = require('./discovery');

// ── Helpers ────────────────────────────────────────────────────────

let server = null;

function startServer() {
  return new Promise((resolve) => {
    // Reset stores before starting
    resetProblemStore();
    resetCardsStore();
    resolve();
  });
}

/**
 * Make a request against the discovery router via a small Express app.
 * Returns { status, body }.
 */
function request(method, urlPath, body = null) {
  const express = require('express');
  const { router } = require('./discovery');

  const app = express();
  app.use(express.json());
  app.use('/api/discovery-feed', router);

  const mockReq = {
    method,
    url: urlPath,
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
    },
  };
  if (body) {
    mockReq.body = body;
  } else {
    mockReq.body = {};
  }

  return new Promise((resolve) => {
    // Use http module to make actual request to the express app
    const server = app.listen(0, () => {
      const port = server.address().port;
      const url = `http://localhost:${port}${urlPath}`;
      const opts = {
        method,
        headers: { 'Content-Type': 'application/json' },
      };
      const req = require('http').request(url, opts, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          server.close();
          let parsed;
          try { parsed = JSON.parse(data); } catch { parsed = data; }
          resolve({ status: res.statusCode, body: parsed });
        });
      });
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  });
}

// ── Seed data ──────────────────────────────────────────────────────

function seedStories() {
  resetProblemStore();

  // Published stream about web performance
  const s1 = createProblemStory({
    problemDescription: 'Our web application has slow page load times. Users complain about high latency and poor Core Web Vitals scores, especially LCP and CLS.',
  });
  updateProblemStory(s1.id, {
    status: 'published',
    totalIterations: 5,
    constraints: [
      { category: 'performance', description: 'Must not increase bundle size beyond 200KB' },
      { category: 'ux', description: 'Animation frame budget must stay under 16ms' },
    ],
    feedbackRounds: [
      {
        approaches: [
          'Implement lazy loading for below-the-fold images',
          'Use service worker for caching static assets',
        ],
      },
    ],
    evaluationFunction: {
      metrics: [
        { name: 'LCP', direction: 'minimize', rationale: 'Largest Contentful Paint is the primary UX metric' },
        { name: 'CLS', direction: 'minimize', rationale: 'Cumulative Layout Shift causes visual instability' },
      ],
      baselineScores: { LCP: 4200, CLS: 0.3 },
    },
  });

  // Published stream about API design
  const s2 = createProblemStory({
    problemDescription: 'REST API endpoints return inconsistent response formats. Error handling is unpredictable and clients struggle with rate limiting.',
  });
  updateProblemStory(s2.id, {
    status: 'published',
    totalIterations: 3,
    constraints: [
      { category: 'consistency', description: 'All endpoints must use RFC 7807 Problem Details for errors' },
    ],
    evaluationFunction: {
      metrics: [
        { name: 'Response consistency score', direction: 'maximize' },
      ],
      baselineScores: { 'Response consistency score': 45 },
    },
  });

  // Draft story — should NOT appear in feed
  const s3 = createProblemStory({
    problemDescription: 'Draft problem about database query optimization.',
  });
  updateProblemStory(s3.id, { status: 'draft' });

  // Active story — should NOT appear in feed
  const s4 = createProblemStory({
    problemDescription: 'Active story about memory leak debugging.',
  });
  updateProblemStory(s4.id, { status: 'active' });

  // Saved story — should NOT appear in feed
  const s5 = createProblemStory({
    problemDescription: 'Saved story about authentication flow.',
  });
  updateProblemStory(s5.id, { status: 'saved' });

  // Converged story — should NOT appear in feed
  const s6 = createProblemStory({
    problemDescription: 'Converged story about CSS grid layout.',
  });
  updateProblemStory(s6.id, { status: 'converged' });

  // Another published stream about performance (different angle)
  const s7 = createProblemStory({
    problemDescription: 'JavaScript execution is blocking the main thread. Long synchronous operations cause the UI to freeze during data processing tasks.',
  });
  updateProblemStory(s7.id, {
    status: 'published',
    totalIterations: 2,
    constraints: [],
    evaluationFunction: { metrics: [], baselineScores: {} },
  });

  return { s1, s2, s3, s4, s5, s6, s7 };
}

// ── Tests ──────────────────────────────────────────────────────────

async function testT080_FeedOnlyPublished() {
  console.log('T080: Discovery feed shows only published streams...');
  const { s1, s2, s3, s4, s5, s6, s7 } = seedStories();

  const { status, body } = await request('GET', '/api/discovery-feed');

  assert.strictEqual(status, 200, `Expected 200, got ${status}`);
  assert.strictEqual(body.ok, true, 'Response should be ok');
  assert.strictEqual(body.total, 3, `Expected 3 published streams, got ${body.total}`);

  // Verify all returned items are published
  const ids = body.results.map((r) => r.id);
  assert.ok(ids.includes(s1.id), 'Published stream s1 should be in feed');
  assert.ok(ids.includes(s2.id), 'Published stream s2 should be in feed');
  assert.ok(ids.includes(s7.id), 'Published stream s7 should be in feed');

  // Verify non-published are excluded
  assert.ok(!ids.includes(s3.id), 'Draft s3 should NOT be in feed');
  assert.ok(!ids.includes(s4.id), 'Active s4 should NOT be in feed');
  assert.ok(!ids.includes(s5.id), 'Saved s5 should NOT be in feed');
  assert.ok(!ids.includes(s6.id), 'Converged s6 should NOT be in feed');

  // Verify all returned items have status 'published'
  for (const item of body.results) {
    assert.strictEqual(item.status, 'published', `Item ${item.id} should be published`);
  }

  console.log('  ✓ T080 passed\n');
}

async function testT081_SimilarityRanking() {
  console.log('T081: Results ranked by keyword similarity when problemStoryId provided...');
  const { s1, s2, s7 } = seedStories();

  // Create a browsing story about web performance (should match s1 and s7 better than s2)
  const browser = createProblemStory({
    problemDescription: 'Our web page load times are too slow. Core Web Vitals and page latency are hurting user experience.',
  });

  const { status, body } = await request(
    'GET',
    `/api/discovery-feed?problemStoryId=${browser.id}`
  );

  assert.strictEqual(status, 200, `Expected 200, got ${status}`);
  assert.strictEqual(body.ok, true, 'Response should be ok');
  assert.strictEqual(body.rankedBySimilarity, true, 'Should be ranked by similarity');

  // Browser's story should be excluded from results
  const ids = body.results.map((r) => r.id);
  assert.ok(!ids.includes(browser.id), 'Own story should be excluded');

  // s1 and s7 (both about web performance) should rank higher than s2 (API design)
  const s1Index = ids.indexOf(s1.id);
  const s7Index = ids.indexOf(s7.id);
  const s2Index = ids.indexOf(s2.id);

  assert.ok(s1Index >= 0, 's1 should be present');
  assert.ok(s7Index >= 0, 's7 should be present');
  assert.ok(s2Index >= 0, 's2 should be present');

  // s1 or s7 should rank above s2 (performance-related > API-related)
  const perfRank = Math.min(s1Index, s7Index);
  assert.ok(
    perfRank < s2Index,
    `Performance stream (rank ${perfRank}) should rank above API stream (rank ${s2Index})`
  );

  // Verify similarity scores are present and reasonable
  for (const item of body.results) {
    assert.ok(
      typeof item.similarityScore === 'number',
      `Item ${item.id} should have similarityScore`
    );
    assert.ok(
      item.similarityScore >= 0 && item.similarityScore <= 1,
      `Similarity score should be 0-1, got ${item.similarityScore}`
    );
  }

  console.log('  ✓ T081 passed\n');
}

async function testT081_NoSimilarityWithoutStory() {
  console.log('T081: No similarity ranking when no problemStoryId...');
  seedStories();

  const { status, body } = await request('GET', '/api/discovery-feed');

  assert.strictEqual(status, 200);
  assert.strictEqual(body.rankedBySimilarity, false, 'Should NOT be ranked by similarity');

  // Results should have no similarityScore
  for (const item of body.results) {
    assert.strictEqual(
      item.similarityScore,
      undefined,
      `Item ${item.id} should NOT have similarityScore`
    );
  }

  console.log('  ✓ T081 (no story) passed\n');
}

async function testT082_PullContext() {
  console.log('T082: Pull context adds insights from discovery stream to Problem Story...');
  const { s1, s2 } = seedStories();

  // Create a user story to pull into
  const userStory = createProblemStory({
    problemDescription: 'I want to learn about web performance optimization.',
  });

  const initialContextCount = (userStory.context || []).length;

  const { status, body } = await request('POST', `/api/discovery-feed/${s1.id}/pull-context`, {
    problemStoryId: userStory.id,
    streamId: s1.id,
  });

  assert.strictEqual(status, 200, `Expected 200, got ${status}`);
  assert.strictEqual(body.ok, true, 'Response should be ok');
  assert.ok(body.pulled > 0, `Expected some insights pulled, got ${body.pulled}`);

  // Verify the user story was updated
  const updatedStory = getProblemStory(userStory.id);
  const context = updatedStory.context || [];
  assert.ok(
    context.length > initialContextCount,
    `Context should grow: ${context.length} > ${initialContextCount}`
  );

  // Verify insight format
  const newEntries = context.slice(initialContextCount);
  for (const entry of newEntries) {
    assert.ok(entry.source.startsWith('discovery:'), `Entry source should start with discovery: ${entry.source}`);
    assert.ok(typeof entry.insight === 'string' && entry.insight.length > 0, 'Insight should be non-empty string');
    assert.ok(
      ['approach', 'constraint', 'metric'].includes(entry.category),
      `Category should be approach|constraint|metric, got ${entry.category}`
    );
  }

  // Verify specific insights were pulled
  const insights = body.insights;
  assert.ok(insights.length > 0, 'Response should include extracted insights');

  // Should have constraint insights from s1
  const constraintInsights = insights.filter((i) => i.category === 'constraint');
  assert.ok(constraintInsights.length > 0, 'Should have constraint insights');

  // Should have approach insights from feedback rounds
  const approachInsights = insights.filter((i) => i.category === 'approach');
  assert.ok(approachInsights.length > 0, 'Should have approach insights from feedback rounds');

  // Should have metric insights
  const metricInsights = insights.filter((i) => i.category === 'metric');
  assert.ok(metricInsights.length > 0, 'Should have metric insights');

  console.log('  ✓ T082 passed\n');
}

async function testT082_NoDuplicatesOnRePull() {
  console.log('T082: Re-pulling context does not create duplicates...');
  const { s1 } = seedStories();

  const userStory = createProblemStory({
    problemDescription: 'I want to learn about performance.',
  });

  // Pull once
  const r1 = await request('POST', `/api/discovery-feed/${s1.id}/pull-context`, {
    problemStoryId: userStory.id,
    streamId: s1.id,
  });

  // Verify first pull worked
  assert.strictEqual(r1.status, 200, `First pull should succeed: ${r1.status}`);
  assert.ok(r1.body.pulled > 0, `First pull should pull some entries: ${r1.body.pulled}`);

  // Verify store was updated
  const storyAfterFirst = getProblemStory(userStory.id);
  const contextAfterFirst = storyAfterFirst.context || [];
  assert.strictEqual(contextAfterFirst.length, r1.body.pulled,
    `Store should have ${r1.body.pulled} context entries after first pull, got ${contextAfterFirst.length}`);

  // Pull again from same stream
  const r2 = await request('POST', `/api/discovery-feed/${s1.id}/pull-context`, {
    problemStoryId: userStory.id,
    streamId: s1.id,
  });

  assert.strictEqual(r2.body.pulled, 0, `Second pull should add 0 new entries, got ${r2.body.pulled}`);

  const story = getProblemStory(userStory.id);
  const discoveryEntries = (story.context || []).filter((c) => c.source && c.source.startsWith('discovery:'));
  assert.strictEqual(
    discoveryEntries.length,
    r1.body.pulled,
    `Context should not grow on re-pull: ${discoveryEntries.length} vs ${r1.body.pulled}`
  );

  console.log('  ✓ T082 (no duplicates) passed\n');
}

async function testT082_CannotPullFromSelf() {
  console.log('T082: Cannot pull from own story...');
  const story = createProblemStory({
    problemDescription: 'Some problem.',
  });
  updateProblemStory(story.id, { status: 'published' });

  const { status, body } = await request('POST', `/api/discovery-feed/${story.id}/pull-context`, {
    problemStoryId: story.id,
    streamId: story.id,
  });

  assert.strictEqual(status, 400, `Expected 400, got ${status}`);
  assert.strictEqual(body.ok, false, 'Should fail');
  assert.strictEqual(body.error, 'CANNOT_PULL_FROM_SELF', 'Should get CANNOT_PULL_FROM_SELF error');

  console.log('  ✓ T082 (self-pull rejected) passed\n');
}

async function testT082_NonPublishedStream() {
  console.log('T082: Cannot pull from non-published stream...');
  const { s3 } = seedStories(); // s3 is draft

  const userStory = createProblemStory({
    problemDescription: 'Another problem.',
  });

  const { status, body } = await request('POST', `/api/discovery-feed/${s3.id}/pull-context`, {
    problemStoryId: userStory.id,
    streamId: s3.id,
  });

  assert.strictEqual(status, 403, `Expected 403, got ${status}`);
  assert.strictEqual(body.error, 'STREAM_NOT_PUBLISHED', 'Should get STREAM_NOT_PUBLISHED');

  console.log('  ✓ T082 (non-published rejected) passed\n');
}

// ── Unit tests ─────────────────────────────────────────────────────

async function testKeywordExtraction() {
  console.log('Unit: keyword extraction...');

  const kw1 = extractKeywords('The quick brown fox jumps over the lazy dog');
  assert.ok(kw1.includes('quick'), 'Should include meaningful words');
  assert.ok(kw1.includes('brown'), 'Should include meaningful words');
  assert.ok(!kw1.includes('the'), 'Should exclude stop words');
  assert.ok(!kw1.includes('over'), 'Should exclude stop words');

  const kw2 = extractKeywords('');
  assert.deepStrictEqual(kw2, [], 'Empty string returns empty array');

  const kw3 = extractKeywords(null);
  assert.deepStrictEqual(kw3, [], 'Null returns empty array');

  // Deduplication
  const kw4 = extractKeywords('web performance web performance web');
  const webCount = kw4.filter((k) => k === 'web').length;
  assert.strictEqual(webCount, 1, 'Should deduplicate');

  console.log('  ✓ keyword extraction passed\n');
}

async function testSimilarity() {
  console.log('Unit: keyword similarity...');

  const sim1 = keywordSimilarity(['web', 'performance', 'latency'], ['web', 'performance', 'slow']);
  assert.ok(sim1 > 0, 'Should have some overlap');
  assert.ok(sim1 <= 1, 'Should be at most 1');

  const sim2 = keywordSimilarity(['web', 'performance'], ['database', 'query']);
  assert.strictEqual(sim2, 0, 'No overlap = 0');

  const sim3 = keywordSimilarity(['web'], ['web', 'performance']);
  assert.ok(sim3 > 0 && sim3 < 1, 'Partial overlap');

  const sim4 = keywordSimilarity([], []);
  assert.strictEqual(sim4, 0, 'Both empty = 0');

  console.log('  ✓ similarity passed\n');
}

// ── Run all tests ──────────────────────────────────────────────────

async function main() {
  console.log('\n═══ Discovery Feed Tests ═══\n');

  try {
    await startServer();

    await testKeywordExtraction();
    await testSimilarity();
    await testT080_FeedOnlyPublished();
    await testT081_SimilarityRanking();
    await testT081_NoSimilarityWithoutStory();
    await testT082_PullContext();
    await testT082_NoDuplicatesOnRePull();
    await testT082_CannotPullFromSelf();
    await testT082_NonPublishedStream();

    console.log('═══ All tests passed ═══\n');
    process.exit(0);
  } catch (err) {
    console.error('\n✗ TEST FAILED:', err.message || err);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

main();
