// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * ZHC1 Sandbox — Learning System + Smoke Tests
 *
 * Covers: SA-T060–T064 (learning), SA-T090–T092 (smoke)
 * See specs/48_zhc1_sandbox_artifact_system_tdd_spec.md
 */

test.describe('Learning System (SA-T060–T064)', () => {

  test('SA-T060: discarded experiments recorded in published stream', async ({ request }) => {
    // Create story with metrics
    const storyRes = await request.post('/api/problem-stories', {
      data: { description: 'Learning test - track discarded' },
    });
    const story = await storyRes.json();
    await request.post(`/api/problem-stories/${story.id}/eval-proposals/metrics`, {
      data: { name: 'Accuracy', type: 'quantitative', direction: 'maximize' },
    });
    await request.post(`/api/problem-stories/${story.id}/eval-confirm`);

    // Create cards with different statuses
    await request.post(`/api/problem-stories/${story.id}/experiment-cards`, {
      data: { agentSummary: 'Kept approach', compositeScore: 0.8, status: 'kept' },
    });
    await request.post(`/api/problem-stories/${story.id}/experiment-cards`, {
      data: { agentSummary: 'Discarded approach', compositeScore: 0.3, status: 'discarded' },
    });
    await request.post(`/api/problem-stories/${story.id}/experiment-cards`, {
      data: { agentSummary: 'Another kept', compositeScore: 0.9, status: 'kept' },
    });

    // Finish and publish
    await request.fetch(`/api/problem-stories/${story.id}/finish`, { method: 'PUT' });
    const pubRes = await request.post('/api/published-streams', {
      data: { problemStoryId: story.id },
    });
    const pub = await pubRes.json();
    expect(pub.ok).toBe(true);

    const stream = pub.publishedStream;
    const kept = stream.cards.filter(c => c.status === 'kept');
    const discarded = stream.cards.filter(c => c.status === 'discarded');
    expect(kept.length).toBe(2);
    expect(discarded.length).toBe(1);
    expect(discarded[0].agentSummary).toContain('Discarded');
  });

  test('SA-T061: feedback text preserved in published stream', async ({ request }) => {
    // Create story
    const storyRes = await request.post('/api/problem-stories', {
      data: { description: 'Learning test - feedback preservation' },
    });
    const story = await storyRes.json();
    await request.post(`/api/problem-stories/${story.id}/eval-proposals/metrics`, {
      data: { name: 'Speed', type: 'quantitative', direction: 'minimize' },
    });
    await request.post(`/api/problem-stories/${story.id}/eval-confirm`);

    // Create card
    const cardRes = await request.post(`/api/problem-stories/${story.id}/experiment-cards`, {
      data: { agentSummary: 'Test approach', compositeScore: 0.6, status: 'pending_review' },
    });
    const card = await cardRes.json();

    // Submit feedback (API field is textContent, not text)
    await request.post(`/api/experiment-cards/${card.card.id}/feedback`, {
      data: { textContent: 'Remove the sidebar, it is too distracting', modality: 'text' },
    });

    // Finish and publish
    await request.fetch(`/api/problem-stories/${story.id}/finish`, { method: 'PUT' });
    const pubRes = await request.post('/api/published-streams', {
      data: { problemStoryId: story.id },
    });
    const pub = await pubRes.json();
    const stream = pub.publishedStream;

    // Feedback rounds should be preserved
    expect(stream.feedbackRounds.length).toBeGreaterThanOrEqual(1);
    // Feedback text is stored at feedbackRound.feedback.textContent
    const fbText = stream.feedbackRounds[0].feedback?.textContent || stream.feedbackRounds[0].feedback?.text || '';
    expect(fbText).toContain('sidebar');
  });

  test('SA-T064: fork lineage queryable', async ({ request }) => {
    // Create root snapshot
    const rootSnap = await request.post('/api/sandbox/snapshot', {
      data: Buffer.from('PK\x03\x04root-for-lineage'),
      headers: { 'Content-Type': 'application/octet-stream' },
    });
    const root = await rootSnap.json();
    const rootPub = await request.post(`/api/sandbox/snapshot/${root.id}/publish`, {
      data: { problemDescription: 'Root', convergenceScore: 0.5, entrypoint: 'src/index.ts' },
    });
    const rootItem = (await rootPub.json()).item;

    // Create child
    const childSnap = await request.post('/api/sandbox/snapshot', {
      data: Buffer.from('PK\x03\x04child-for-lineage'),
      headers: { 'Content-Type': 'application/octet-stream' },
    });
    const child = await childSnap.json();
    const childPub = await request.post(`/api/sandbox/snapshot/${child.id}/publish`, {
      data: { problemDescription: 'Child', convergenceScore: 0.7, entrypoint: 'src/index.ts', parentArtifactId: rootItem.id },
    });
    const childItem = (await childPub.json()).item;

    // Create grandchild
    const gcSnap = await request.post('/api/sandbox/snapshot', {
      data: Buffer.from('PK\x03\x04grandchild-for-lineage'),
      headers: { 'Content-Type': 'application/octet-stream' },
    });
    const gc = await gcSnap.json();
    const gcPub = await request.post(`/api/sandbox/snapshot/${gc.id}/publish`, {
      data: { problemDescription: 'Grandchild', convergenceScore: 0.9, entrypoint: 'src/index.ts', parentArtifactId: childItem.id },
    });
    const gcItem = (await gcPub.json()).item;

    // Query lineage from grandchild
    const lineageRes = await request.get(`/api/sandbox/library/${gcItem.id}/lineage`);
    const lineage = await lineageRes.json();
    expect(lineage.ok).toBe(true);
    expect(lineage.lineage).toEqual([rootItem.id, childItem.id, gcItem.id]);
  });
});

test.describe('Smoke Tests (SA-T090–T092)', () => {

  test('SA-T091: snapshot store + retrieve roundtrip with library', async ({ request }) => {
    // 1. Store snapshot
    const snapPayload = Buffer.from('PK\x03\x04smoke-roundtrip-test-data-with-enough-length');
    const storeRes = await request.post('/api/sandbox/snapshot', {
      data: snapPayload,
      headers: { 'Content-Type': 'application/octet-stream', 'x-problem-story-id': 'smoke-story' },
    });
    const stored = await storeRes.json();
    expect(stored.ok).toBe(true);
    expect(stored.contentType).toBe('application/zip');

    // 2. Publish as library item
    const pubRes = await request.post(`/api/sandbox/snapshot/${stored.id}/publish`, {
      data: { problemDescription: 'Smoke test', convergenceScore: 0.88, entrypoint: 'src/index.ts' },
    });
    const pub = await pubRes.json();
    expect(pub.ok).toBe(true);
    expect(pub.item.type).toBe('sandbox_snapshot');
    expect(pub.item.content_type).toBe('application/zip');
    expect(pub.item.content_hash).toBe(stored.contentHash);

    // 3. Retrieve binary
    const getRes = await request.get(`/api/sandbox/snapshot/${stored.id}`);
    expect(getRes.ok()).toBe(true);
    const body = await getRes.body();
    expect(body.length).toBe(snapPayload.length);

    // 4. Library item retrievable
    const itemRes = await request.get(`/api/sandbox/library/${pub.item.id}`);
    const item = await itemRes.json();
    expect(item.ok).toBe(true);
    expect(item.item.metadata.convergenceScore).toBe(0.88);
  });

  test('SA-T092: full publication + discovery roundtrip', async ({ request }) => {
    // 1. Create problem story
    const storyRes = await request.post('/api/problem-stories', {
      data: { description: 'Smoke test: optimize page load performance with caching' },
    });
    const story = await storyRes.json();

    // 2. Add metrics and confirm
    await request.post(`/api/problem-stories/${story.id}/eval-proposals/metrics`, {
      data: { name: 'Load time', type: 'quantitative', direction: 'minimize', unit: 'ms' },
    });
    await request.post(`/api/problem-stories/${story.id}/eval-confirm`);

    // 3. Create experiment card (agent creates these via tools now)
    const expRes = await request.post(`/api/problem-stories/${story.id}/experiment-cards`, {
      data: {
        agentSummary: 'Caching middleware implementation',
        compositeScore: 0.75,
        status: 'kept',
        artifact: {
          source: { 'src/index.ts': 'console.log("cached")' },
          outputType: 'terminal',
          outputPreview: 'cached',
          entrypoint: 'src/index.ts',
          exitCode: 0,
        },
      },
    });
    const exp = await expRes.json();
    expect(exp.ok).toBe(true);

    // 4. Finish and publish
    await request.fetch(`/api/problem-stories/${story.id}/finish`, { method: 'PUT' });
    const pubRes = await request.post('/api/published-streams', {
      data: { problemStoryId: story.id },
    });
    const pub = await pubRes.json();
    expect(pub.ok).toBe(true);
    expect(pub.publishedStream.bestCompositeScore).toBeGreaterThan(0);

    // 5. Discover it
    const discoverStory = await request.post('/api/problem-stories', {
      data: { description: 'I need to optimize page load speed with caching strategies' },
    });
    const qs = (await discoverStory.json()).id;
    const feedRes = await request.get(`/api/discovery-feed?problemStoryId=${qs}`);
    const feed = await feedRes.json();
    expect(feed.ok).toBe(true);
    expect(feed.results.length).toBeGreaterThanOrEqual(1);
  });
});
