/**
 * Integration test: Publish → Discovery feed wiring.
 *
 * Verifies that:
 *   1. Publishing via POST /api/published-streams makes the stream visible in discovery
 *   2. Discovery feed returns enriched data (bestCompositeScore, convergenceSpeed, etc.)
 *   3. Similarity ranking works with published streams
 *   4. Pull-context works with PublishedStream IDs
 *
 * Run: NODE_ENV=test node server/integration-discovery-pub.test.js
 */

const assert = require('assert');

async function main() {
  process.env.NODE_ENV = 'test';

  const { createProblemStory, getProblemStory, updateProblemStory, _resetStore: resetPS } = require('./problem-stories');
  const { _resetStore: resetEC } = require('./experiment-cards');
  const { _resetStore: resetPub, listPublishedStreams, publishedStreams: pubMap } = require('./publication');
  const { router: discRouter, getPublishedStreams: getDiscStreams } = require('./discovery');

  // Reset all stores
  resetPS(); resetEC(); resetPub();

  // Step 1: Create a problem story with experiment cards
  const story = createProblemStory({
    problemDescription: 'Our React dashboard renders too slowly with large datasets. Virtualization is needed for scrollable tables with 100k+ rows.',
  });
  updateProblemStory(story.id, { status: 'active' });

  const { createExperimentCard } = require('./experiment-cards');
  createExperimentCard(story.id, {
    compositeScore: 0.3, agentSummary: 'Basic table render',
    status: 'discarded', iterationNumber: 1,
  });
  createExperimentCard(story.id, {
    compositeScore: 0.82, agentSummary: 'Virtualized table with windowing',
    status: 'kept', iterationNumber: 2,
  });
  createExperimentCard(story.id, {
    compositeScore: 0.91, agentSummary: 'Optimized virtualized table with row pooling',
    status: 'refined', iterationNumber: 3,
  });
  updateProblemStory(story.id, { totalIterations: 3 });
  console.log('✓ Created story with 3 experiment cards (1 discarded, 1 kept, 1 refined)');

  // Step 2: Finish → converged
  const freshStory = getProblemStory(story.id);
  freshStory.status = 'converged';
  updateProblemStory(story.id, freshStory);
  console.log('✓ Story status: converged');

  // Step 3: Publish via POST /api/published-streams
  const express = require('express');
  const http = require('http');

  function makeApp(routers) {
    const app = express();
    app.use(express.json());
    for (const { path, router } of routers) {
      app.use(path, router);
    }
    return app;
  }

  function makeRequest(app, method, path, body = null) {
    return new Promise((resolve, reject) => {
      const srv = app.listen(0, () => {
        const port = srv.address().port;
        const url = `http://localhost:${port}${path}`;
        const opts = { method, headers: { 'Content-Type': 'application/json' } };
        const req = http.request(url, opts, (res) => {
          let data = '';
          res.on('data', (c) => { data += c; });
          res.on('end', () => { srv.close(); resolve({ status: res.statusCode, body: JSON.parse(data) }); });
        });
        if (body) req.write(JSON.stringify(body));
        req.end();
      });
    });
  }

  const { router: pubRouter } = require('./publication');
  const pubApp = makeApp([{ path: '/api', router: pubRouter }]);

  const pubRes = await makeRequest(pubApp, 'POST', '/api/published-streams', {
    problemStoryId: story.id,
    userSatisfaction: 5,
  });
  assert.strictEqual(pubRes.status, 201, 'Publish should return 201');
  const ps = pubRes.body.publishedStream;
  console.log('✓ Published stream ID:', ps.id);
  console.log('  bestCompositeScore:', ps.bestCompositeScore);
  console.log('  convergenceSpeed:', ps.convergenceSpeed);
  console.log('  discoveryKeywords:', ps.discoveryKeywords.slice(0, 5));
  console.log('  cards:', ps.cards.length, '(kept+refined only)');

  // Step 4: GET /api/discovery-feed → should return the published stream
  const discApp = makeApp([{ path: '/api/discovery-feed', router: discRouter }]);

  const feedRes = await makeRequest(discApp, 'GET', '/api/discovery-feed');
  assert.strictEqual(feedRes.status, 200);
  assert.strictEqual(feedRes.body.total, 1, `Expected 1 stream in feed, got ${feedRes.body.total}`);

  const item = feedRes.body.results[0];
  assert.strictEqual(item.id, ps.id, 'Feed item should use PublishedStream ID');
  assert.strictEqual(item.status, 'published');
  assert.strictEqual(item.bestCompositeScore, 0.91, 'Should have enriched bestCompositeScore');
  assert.strictEqual(item.cardCount, 2, 'Should show kept+refined card count');
  assert.ok(item.convergenceSpeed > 0, 'Should have convergenceSpeed');
  assert.ok(item.discoveryKeywords.length > 0, 'Should have discoveryKeywords');
  assert.strictEqual(item.problemStoryId, story.id, 'Should link to original story');
  console.log('✓ Discovery feed returns enriched PublishedStream');
  console.log('  Feed item ID:', item.id);
  console.log('  bestCompositeScore:', item.bestCompositeScore);
  console.log('  convergenceSpeed:', item.convergenceSpeed);
  console.log('  problemStoryId:', item.problemStoryId);

  // Step 5: Similarity ranking with a different story
  const otherStory = createProblemStory({
    problemDescription: 'Our data grid component is slow with large datasets and needs virtual scrolling for tables.',
  });

  const simRes = await makeRequest(
    discApp, 'GET',
    `/api/discovery-feed?problemStoryId=${otherStory.id}`
  );
  assert.strictEqual(simRes.status, 200);
  assert.strictEqual(simRes.body.rankedBySimilarity, true);
  assert.strictEqual(simRes.body.total, 1);
  assert.ok(simRes.body.results[0].similarityScore > 0);
  console.log('✓ Similarity ranking works, score:', simRes.body.results[0].similarityScore.toFixed(3));

  // Step 6: Own story should be excluded from feed
  const selfRes = await makeRequest(
    discApp, 'GET',
    `/api/discovery-feed?problemStoryId=${story.id}`
  );
  assert.strictEqual(selfRes.body.total, 0, 'Own published story should be excluded');
  console.log('✓ Own story excluded from discovery feed');

  // Step 7: Pull-context works with PublishedStream ID
  const pullRes = await makeRequest(
    discApp, 'POST',
    `/api/discovery-feed/${ps.id}/pull-context`,
    { problemStoryId: otherStory.id, streamId: ps.id }
  );
  assert.strictEqual(pullRes.status, 200, `Pull context should return 200, got ${pullRes.status}`);
  assert.ok(pullRes.body.pulled > 0, `Should pull insights, got ${pullRes.body.pulled}`);
  assert.ok(pullRes.body.insights.length > 0);
  console.log('✓ Pull-context works with PublishedStream ID, pulled:', pullRes.body.pulled);

  // Step 8: Pull-context also works with problemStoryId as streamId
  const pullRes2 = await makeRequest(
    discApp, 'POST',
    `/api/discovery-feed/${story.id}/pull-context`,
    { problemStoryId: otherStory.id, streamId: story.id }
  );
  assert.strictEqual(pullRes2.status, 200, 'Pull context with problemStoryId should work');
  assert.strictEqual(pullRes2.body.pulled, 0, 'Re-pull should add 0 new entries (already pulled)');
  console.log('✓ Pull-context with problemStoryId also works, re-pull correctly deduplicates');

  // Step 9: Cannot pull from self (by problemStoryId)
  const selfPullRes = await makeRequest(
    discApp, 'POST',
    `/api/discovery-feed/${story.id}/pull-context`,
    { problemStoryId: story.id, streamId: story.id }
  );
  assert.strictEqual(selfPullRes.status, 400);
  assert.strictEqual(selfPullRes.body.error, 'CANNOT_PULL_FROM_SELF');
  console.log('✓ Self-pull rejected (by problemStoryId)');

  console.log('\n═══ Integration test PASSED ═══\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('💥 FAILED:', err);
  process.exit(1);
});
