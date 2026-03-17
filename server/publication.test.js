/**
 * Tests for Publication flow (T070, T071) and Fork (T062).
 *
 * Run: NODE_ENV=test node server/publication.test.js
 */

const assert = require('assert');

process.env.NODE_ENV = 'test';

// All module requires are deferred into main() to avoid singleton store
// initialization issues when multiple test files share the same process.

let publicationRouter, saveGameRouter, problemStoriesRouter, experimentCardsRouter, feedbackRouter;
let codeFingerprint, extractKeywords;

function createTestApp() {
  const express = require('express');
  const app = express();
  app.use(express.json());
  app.use('/api/problem-stories', problemStoriesRouter);
  app.use('/api/problem-stories', experimentCardsRouter);
  app.use('/api/experiment-cards', feedbackRouter);
  app.use('/api/save-games', saveGameRouter);
  app.use('/api', publicationRouter);
  return app;
}

let passed = 0;
let failed = 0;
const failures = [];

function ok(cond, label) {
  if (cond) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}`);
    failed++;
    failures.push(label);
  }
}

function reset() {
  const { _resetStore: r1 } = require('./problem-stories');
  const { _resetStore: r2 } = require('./experiment-cards');
  const { _resetStore: r3 } = require('./save-game');
  const { _resetStore: r4 } = require('./publication');
  r1(); r2(); r3(); r4();
}

/** Load all modules and reset all stores before any test runs. */
function resetAll() {
  // Require all modules (loading their routers/exports into module cache)
  const ps = require('./problem-stories');
  const ec = require('./experiment-cards');
  const sg = require('./save-game');
  const pub = require('./publication');
  const fb = require('./feedback');

  // Bind module-level references used by createTestApp and tests
  problemStoriesRouter = ps.problemStoriesRouter;
  experimentCardsRouter = ec.experimentCardsRouter;
  saveGameRouter = sg.router;
  publicationRouter = pub.router;
  feedbackRouter = fb.feedbackRouter;
  codeFingerprint = pub.codeFingerprint;
  extractKeywords = pub.extractKeywords;

  // Reset all singleton stores to clean state
  ps._resetStore();
  ec._resetStore();
  sg._resetStore();
  pub._resetStore();
}

function post(app, path, body) {
  return new Promise((resolve, reject) => {
    const req = { method: 'POST', url: path, body, headers: {} };
    const res = {
      statusCode: 200,
      body: null,
      setHeader() {},
      json(data) { this.body = data; resolve(this); },
      status(code) { this.statusCode = code; return this; },
    };
    app._router.handle(req, res, () => {
      resolve(res);
    });
  });
}

function get(app, path) {
  return new Promise((resolve, reject) => {
    const req = { method: 'GET', url: path, headers: {}, query: {} };
    const res = {
      statusCode: 200,
      body: null,
      setHeader() {},
      json(data) { this.body = data; resolve(this); },
      status(code) { this.statusCode = code; return this; },
    };
    app._router.handle(req, res, () => {
      resolve(res);
    });
  });
}

function put(app, path, body) {
  return new Promise((resolve, reject) => {
    const req = { method: 'PUT', url: path, body, headers: {} };
    const res = {
      statusCode: 200,
      body: null,
      setHeader() {},
      json(data) { this.body = data; resolve(this); },
      status(code) { this.statusCode = code; return this; },
    };
    app._router.handle(req, res, () => {
      resolve(res);
    });
  });
}

// ── T062: Fork creates new Problem Story, original untouched ────────
async function testT062_Fork(app) {
  console.log('\n--- T062: Fork from Save Game ---');

  // 1. Create a Problem Story
  const created = await post(app, '/api/problem-stories', {
    problemDescription: 'Build a todo app with drag and drop',
  });
  ok(created.statusCode === 201, 'Create problem story → 201');
  const storyId = created.body.id;

  // 2. Set it to active
  await put(app, `/api/problem-stories/${storyId}`, { status: 'active' });

  // 3. Create experiment cards
  const c1 = await post(app, `/api/problem-stories/${storyId}/experiment-cards`, {
    compositeScore: 0.4,
    agentSummary: 'First attempt',
    iterationNumber: 1,
    status: 'discarded',
  });
  ok(c1.statusCode === 201, 'Create card 1 → 201');

  const c2 = await post(app, `/api/problem-stories/${storyId}/experiment-cards`, {
    compositeScore: 0.8,
    agentSummary: 'Second attempt - much better',
    iterationNumber: 2,
    status: 'kept',
  });
  ok(c2.statusCode === 201, 'Create card 2 → 201');

  // 4. Create a save game
  const sg = await post(app, '/api/save-games', {
    problemStoryId: storyId,
    label: 'Before fork test',
  });
  ok(sg.statusCode === 201, 'Create save game → 201');
  const saveGameId = sg.body.saveGame.id;

  // 5. Modify the original to prove fork doesn't touch it
  await put(app, `/api/problem-stories/${storyId}`, {
    problemDescription: 'MODIFIED ORIGINAL',
  });

  // 6. Fork from save game
  const forked = await post(app, `/api/save-games/${saveGameId}/fork`);
  ok(forked.statusCode === 200, 'Fork → 200');
  const newStory = forked.body.problemStory;
  ok(newStory.id !== storyId, 'Forked story has new ID');
  ok(newStory.status === 'active', 'Forked story status is active');
  ok(newStory.parentStoryId === storyId, 'Forked story has parentStoryId set');
  ok(forked.body.forkedCardsCount === 2, 'Forked cards count is 2');
  ok(newStory.problemDescription === 'Build a todo app with drag and drop',
    'Forked story has original description (not modified)');

  // 7. Verify original untouched
  const original = await get(app, `/api/problem-stories/${storyId}`);
  ok(original.body.problemDescription === 'MODIFIED ORIGINAL',
    'Original story description still modified (untouched by fork)');

  // 8. Verify forked story has its own cards
  const newCards = await get(app, `/api/problem-stories/${newStory.id}/experiment-cards`);
  ok(newCards.body.cards.length === 2, 'Forked story has 2 cards');

  // 9. Verify original cards still intact
  const origCards = await get(app, `/api/problem-stories/${storyId}/experiment-cards`);
  ok(origCards.body.cards.length === 2, 'Original story still has 2 cards');
}

// ── T070: PUT finish → status 'converged' ─────────────────────────
async function testT070_Finish(app) {
  console.log('\n--- T070: PUT finish → converged ---');

  const created = await post(app, '/api/problem-stories', {
    problemDescription: 'Build a weather widget',
  });
  const storyId = created.body.id;
  await put(app, `/api/problem-stories/${storyId}`, { status: 'active' });

  // Finish it
  const finished = await put(app, `/api/problem-stories/${storyId}/finish`);
  ok(finished.statusCode === 200, 'Finish → 200');
  ok(finished.body.problemStory.status === 'converged', 'Story status is converged');
  ok(finished.body.ok === true, 'Response ok is true');

  // Verify persisted
  const fetched = await get(app, `/api/problem-stories/${storyId}`);
  ok(fetched.body.status === 'converged', 'Status persisted as converged');

  // Idempotent
  const again = await put(app, `/api/problem-stories/${storyId}/finish`);
  ok(again.statusCode === 200, 'Double-finish → 200 (idempotent)');

  // 404 for non-existent
  const missing = await put(app, '/api/problem-stories/nonexistent/finish');
  ok(missing.statusCode === 404, 'Finish non-existent → 404');
}

// ── T071: POST publish → PublishedStream ──────────────────────────
async function testT071_Publish(app) {
  console.log('\n--- T071: POST publish → PublishedStream ---');

  // Create and finish a story with cards
  const created = await post(app, '/api/problem-stories', {
    problemDescription: 'Create a Markdown editor with live preview and syntax highlighting',
  });
  const storyId = created.body.id;
  await put(app, `/api/problem-stories/${storyId}`, { status: 'active' });

  // Add experiment cards
  await post(app, `/api/problem-stories/${storyId}/experiment-cards`, {
    compositeScore: 0.3, agentSummary: 'Basic editor',
    status: 'discarded', iterationNumber: 1,
  });
  await post(app, `/api/problem-stories/${storyId}/experiment-cards`, {
    compositeScore: 0.85, agentSummary: 'Editor with preview',
    status: 'kept', iterationNumber: 2,
  });
  await post(app, `/api/problem-stories/${storyId}/experiment-cards`, {
    compositeScore: 0.72, agentSummary: 'Refined editor',
    status: 'refined', iterationNumber: 3,
  });

  // Finish then publish
  await put(app, `/api/problem-stories/${storyId}/finish`);

  const published = await post(app, '/api/published-streams', {
    problemStoryId: storyId,
    userSatisfaction: 4,
  });
  ok(published.statusCode === 201, 'Publish → 201');
  const ps = published.body.publishedStream;
  ok(ps.id, 'PublishedStream has ID');
  ok(ps.problemStoryId === storyId, 'problemStoryId matches');
  ok(ps.codeFingerprint && ps.codeFingerprint.length === 16, 'codeFingerprint is 16-char hex');
  ok(ps.discoveryKeywords.length > 0, 'discoveryKeywords non-empty');
  ok(ps.discoveryKeywords.includes('markdown'), 'Keyword "markdown" found');
  ok(ps.userSatisfaction === 4, 'userSatisfaction preserved');
  ok(ps.cards.length === 2, 'Only kept+refined cards (2, not 3)');
  ok(ps.cards.every(c => c.status === 'kept' || c.status === 'refined'),
    'All published cards are kept or refined');
  ok(ps.totalIterations >= 1, 'totalIterations >= 1');
  ok(ps.bestCompositeScore === 0.85, 'bestCompositeScore is 0.85');
  ok(Array.isArray(ps.feedbackRounds), 'feedbackRounds is array');
  ok(ps.convergenceSpeed > 0, 'convergenceSpeed > 0');

  // Story status changed to 'published'
  const fetched = await get(app, `/api/problem-stories/${storyId}`);
  ok(fetched.body.status === 'published', 'Story status is now published');

  // Can't publish again (now 'published', not 'converged')
  const again = await post(app, '/api/published-streams', { problemStoryId: storyId });
  ok(again.statusCode === 409, 'Re-publish → 409');

  // Can't publish a non-converged story
  reset();
  const fresh = await post(app, '/api/problem-stories', { problemDescription: 'Not converged' });
  const bad = await post(app, '/api/published-streams', { problemStoryId: fresh.body.id });
  ok(bad.statusCode === 409, 'Publish non-converged → 409');

  // Invalid satisfaction
  reset();
  const c2 = await post(app, '/api/problem-stories', { problemDescription: 'Test satisfaction' });
  await put(app, `/api/problem-stories/${c2.body.id}/finish`);
  const badSat = await post(app, '/api/published-streams', {
    problemStoryId: c2.body.id, userSatisfaction: 10,
  });
  ok(badSat.statusCode === 400, 'Invalid satisfaction → 400');
}

// ── List and Get published streams ────────────────────────────────
async function testListAndGet(app) {
  console.log('\n--- List and Get Published Streams ---');

  const created = await post(app, '/api/problem-stories', {
    problemDescription: 'Build a REST API with authentication',
  });
  const storyId = created.body.id;
  await put(app, `/api/problem-stories/${storyId}`, { status: 'active' });
  await put(app, `/api/problem-stories/${storyId}/finish`);
  const pub = await post(app, '/api/published-streams', {
    problemStoryId: storyId, userSatisfaction: 3,
  });
  const psId = pub.body.publishedStream.id;

  // List
  const list = await get(app, '/api/published-streams');
  ok(list.statusCode === 200, 'List → 200');
  ok(list.body.total >= 1, 'Total >= 1');
  ok(list.body.publishedStreams.length >= 1, 'At least 1 stream in list');

  // Get by ID
  const single = await get(app, `/api/published-streams/${psId}`);
  ok(single.statusCode === 200, 'Get by ID → 200');
  ok(single.body.publishedStream.id === psId, 'Correct stream returned');

  // Get non-existent
  const missing = await get(app, '/api/published-streams/nonexistent');
  ok(missing.statusCode === 404, 'Get non-existent → 404');

  // Deterministic codeFingerprint
  ok(codeFingerprint('hello') === codeFingerprint('hello'),
    'codeFingerprint is deterministic');
  ok(codeFingerprint('hello') !== codeFingerprint('world'),
    'codeFingerprint differs for different inputs');

  // Keywords extraction
  const kw = extractKeywords('Build a Markdown editor with live preview and syntax highlighting');
  ok(kw.includes('markdown'), 'extractKeywords finds "markdown"');
  ok(kw.includes('preview'), 'extractKeywords finds "preview"');
  ok(kw.includes('editor'), 'extractKeywords finds "editor"');
  ok(!kw.includes('and'), 'extractKeywords excludes stop words');
}

// ── Run ───────────────────────────────────────────────────────────
async function main() {
  console.log('🧪 Publication + Fork Tests (T062, T070, T071)\n');

  try {
    resetAll();
    const app = createTestApp();

    await testT062_Fork(app);
    reset();
    const app2 = createTestApp();
    await testT070_Finish(app2);
    reset();
    const app3 = createTestApp();
    await testT071_Publish(app3);
    reset();
    const app4 = createTestApp();
    await testListAndGet(app4);
  } catch (e) {
    console.error('💥 Fatal error:', e);
    failed++;
    failures.push(`Fatal: ${e.message}`);
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  if (failures.length) console.log('Failures:', failures.join(', '));
  process.exit(failed > 0 ? 1 : 0);
}

main();
