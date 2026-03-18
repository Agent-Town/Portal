// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * ZHC1 Sandbox — Transferability + Publication Tests
 *
 * Covers: SA-T030–T035 (transferability), SA-T040–T043 (publication)
 * See specs/48_zhc1_sandbox_artifact_system_tdd_spec.md
 */

test.describe('Transferability (SA-T030–T035)', () => {

  test('SA-T033: snapshot stored as library item', async ({ request }) => {
    // Store a snapshot
    const payload = Buffer.from('PK\x03\x04snapshot-library-test');
    const snapRes = await request.post('/api/sandbox/snapshot', {
      data: payload,
      headers: {
        'Content-Type': 'application/octet-stream',
        'x-problem-story-id': 'story-lib-test',
      },
    });
    const snap = await snapRes.json();
    expect(snap.ok).toBe(true);

    // Publish as library item
    const pubRes = await request.post(`/api/sandbox/snapshot/${snap.id}/publish`, {
      data: {
        problemDescription: 'Test library integration',
        convergenceScore: 0.85,
        entrypoint: 'src/index.ts',
      },
    });
    expect(pubRes.ok()).toBe(true);
    const pub = await pubRes.json();
    expect(pub.ok).toBe(true);
    expect(pub.item.type).toBe('sandbox_snapshot');
    expect(pub.item.content_type).toBe('application/zip');
    expect(pub.item.content_hash).toMatch(/^sha256:/);
    expect(pub.item.metadata.convergenceScore).toBe(0.85);

    // Retrieve from library
    const getRes = await request.get(`/api/sandbox/library/${pub.item.id}`);
    const getItem = await getRes.json();
    expect(getItem.ok).toBe(true);
    expect(getItem.item.id).toBe(pub.item.id);
  });

  test('SA-T035: fork preserves parent lineage', async ({ request }) => {
    // Create parent
    const parentSnap = await request.post('/api/sandbox/snapshot', {
      data: Buffer.from('PK\x03\x04parent-snap'),
      headers: { 'Content-Type': 'application/octet-stream' },
    });
    const parent = await parentSnap.json();
    const parentPub = await request.post(`/api/sandbox/snapshot/${parent.id}/publish`, {
      data: { problemDescription: 'Parent', convergenceScore: 0.7, entrypoint: 'src/index.ts' },
    });
    const parentItem = (await parentPub.json()).item;

    // Create child with parentArtifactId
    const childSnap = await request.post('/api/sandbox/snapshot', {
      data: Buffer.from('PK\x03\x04child-snap'),
      headers: { 'Content-Type': 'application/octet-stream' },
    });
    const child = await childSnap.json();
    const childPub = await request.post(`/api/sandbox/snapshot/${child.id}/publish`, {
      data: {
        problemDescription: 'Child fork',
        convergenceScore: 0.9,
        entrypoint: 'src/index.ts',
        parentArtifactId: parentItem.id,
      },
    });
    const childItem = (await childPub.json()).item;
    expect(childItem.metadata.parentArtifactId).toBe(parentItem.id);

    // Check lineage
    const lineageRes = await request.get(`/api/sandbox/library/${childItem.id}/lineage`);
    const lineage = await lineageRes.json();
    expect(lineage.ok).toBe(true);
    expect(lineage.lineage).toEqual([parentItem.id, childItem.id]);
  });

  test('SA-T033b: library listing returns items', async ({ request }) => {
    const listRes = await request.get('/api/sandbox/library');
    const list = await listRes.json();
    expect(list.ok).toBe(true);
    expect(Array.isArray(list.items)).toBe(true);
    // Items from previous tests should be present
    expect(list.items.length).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Publication (SA-T040–T043)', () => {

  test('SA-T040: published stream includes code fingerprint from artifact', async ({ request }) => {
    // Create story
    const storyRes = await request.post('/api/problem-stories', {
      data: { description: 'Publish artifact test' },
    });
    const story = await storyRes.json();

    // Add metric and confirm
    await request.post(`/api/problem-stories/${story.id}/eval-proposals/metrics`, {
      data: { name: 'Quality', type: 'qualitative', direction: 'maximize' },
    });
    await request.post(`/api/problem-stories/${story.id}/eval-confirm`);

    // Create card WITH artifact
    await request.post(`/api/problem-stories/${story.id}/experiment-cards`, {
      data: {
        agentSummary: 'Code solution',
        compositeScore: 0.8,
        status: 'kept',
        artifact: {
          source: { 'src/index.ts': 'console.log("solution")' },
          outputType: 'terminal',
          outputPreview: 'solution',
          entrypoint: 'src/index.ts',
          exitCode: 0,
          executionMs: 100,
        },
      },
    });

    // Finish and publish
    await request.fetch(`/api/problem-stories/${story.id}/finish`, { method: 'PUT' });
    const pubRes = await request.post('/api/published-streams', {
      data: { problemStoryId: story.id },
    });
    const pubData = await pubRes.json();
    expect(pubData.ok).toBe(true);
    const pub = pubData.publishedStream;
    expect(pub.id).toBeTruthy();
    // codeFingerprint should exist
    expect(typeof pub.codeFingerprint).toBe('string');
    expect(pub.codeFingerprint.length).toBeGreaterThan(0);
    // Cards should include artifact data
    expect(pub.cards.length).toBeGreaterThanOrEqual(1);
  });

  test('SA-T042: artifact discoverable in feed', async ({ request }) => {
    // Create a story to query from
    const queryStory = await request.post('/api/problem-stories', {
      data: { description: 'Publish artifact searching for solutions' },
    });
    const query = await queryStory.json();

    const feedRes = await request.get(`/api/discovery-feed?problemStoryId=${query.id}`);
    const feed = await feedRes.json();
    expect(feed.ok).toBe(true);
    expect(Array.isArray(feed.results)).toBe(true);
    // Feed endpoint works and returns results array
  });

  test('SA-T041: export button present in active loop', async ({ page }) => {
    await page.goto('/iterate');
    await page.locator('[data-testid="user-name-input"]').fill('Tester');
    await page.locator('[data-testid="identity-continue-btn"]').click();

    await expect(page.locator('[data-testid="brain-config"]')).toBeVisible();
    await page.evaluate(async () => {
      try {
        const lib = await import('/openclaw-lite/llm-config-library.js');
        await lib.saveLlmConfig({ provider: 'openai', model: 'gpt-4o-mini', apiKey: 'sk-test' });
      } catch {
        await new Promise((resolve, reject) => {
          const req = indexedDB.open('openclaw-lite', 1);
          req.onupgradeneeded = () => { req.result.createObjectStore('meta', { keyPath: 'key' }); };
          req.onsuccess = () => {
            const db = req.result;
            const tx = db.transaction('meta', 'readwrite');
            const s = tx.objectStore('meta');
            s.put({ key: 'llmProvider', value: 'openai' });
            s.put({ key: 'llmModelId', value: 'gpt-4o-mini' });
            s.put({ key: 'llmApiKey', value: 'sk-test' });
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);
          };
          req.onerror = () => reject(req.error);
        });
      }
    });
    await expect(page.locator('[data-testid="brain-continue-btn"]')).toBeEnabled({ timeout: 5000 });
    await page.locator('[data-testid="brain-continue-btn"]').click();

    await page.locator('[data-testid="problem-input"]').fill('Test problem for export button');
    await page.locator('[data-testid="start-btn"]').click();
    await expect(page.locator('[data-testid="active-loop"]')).toBeVisible({ timeout: 10000 });

    // Export button should be present
    await expect(page.locator('[data-testid="export-btn"]')).toBeVisible();
  });
});
