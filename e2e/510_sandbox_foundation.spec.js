// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * ZHC1 Sandbox & Artifact System — Foundation + Artifact Model Tests
 *
 * Covers: SA-T001–T007 (sandbox foundation), SA-T010–T014 (artifact model)
 * See specs/48_zhc1_sandbox_artifact_system_tdd_spec.md
 */

// Helper: complete identity + brain config to reach active loop
async function reachActiveLoop(page, problemText) {
  await page.goto('/iterate');
  await page.locator('[data-testid="user-name-input"]').fill('Tester');
  await page.locator('[data-testid="identity-continue-btn"]').click();

  // Simulate brain config
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

  await page.locator('[data-testid="problem-input"]').fill(problemText || 'Write a function that reverses a string');
  await page.locator('[data-testid="start-btn"]').click();
  await expect(page.locator('[data-testid="active-loop"]')).toBeVisible({ timeout: 10000 });
}

test.describe('Sandbox Foundation (SA-T001–T007)', () => {

  test('SA-T002: sandbox module loads (fallback if no SharedArrayBuffer)', async ({ page }) => {
    // In test env, SharedArrayBuffer may not be available (no COEP in test config)
    // The sandbox should still load in fallback mode
    await page.goto('/iterate');
    const sandboxType = await page.evaluate(async () => {
      try {
        const mod = await import('/sandbox.js');
        const sb = await mod.createSandbox();
        const type = sb.type;
        sb.dispose();
        return type;
      } catch (e) {
        return `error: ${e.message}`;
      }
    });
    // Should be 'webcontainer' or 'fallback', not an error
    expect(['webcontainer', 'fallback']).toContain(sandboxType);
  });

  test('SA-T005: COOP header set on /iterate route (COEP deferred for worker compat)', async ({ page }) => {
    const response = await page.goto('/iterate');
    // COEP removed because it blocks same-origin Workers with ERR_BLOCKED_BY_RESPONSE.
    // COOP is still set for security.
    const coop = response.headers()['cross-origin-opener-policy'];
    expect(coop).toBe('same-origin');
  });

  test('SA-T007: sandbox.js exports expected API', async ({ page }) => {
    await page.goto('/iterate');
    const api = await page.evaluate(async () => {
      const mod = await import('/sandbox.js');
      return {
        hasCreateSandbox: typeof mod.createSandbox === 'function',
        hasSupportsWebContainer: typeof mod.supportsWebContainer === 'function',
        hasDefaultEntrypoint: typeof mod.DEFAULT_ENTRYPOINT === 'string',
      };
    });
    expect(api.hasCreateSandbox).toBe(true);
    expect(api.hasSupportsWebContainer).toBe(true);
    expect(api.hasDefaultEntrypoint).toBe(true);
  });
});

test.describe('Artifact Model (SA-T010–T014)', () => {

  test('SA-T014: API accepts experiment card with artifact field', async ({ page, request }) => {
    // Create a problem story first
    const storyRes = await request.post('/api/problem-stories', {
      data: { description: 'Test artifact card' },
    });
    const story = await storyRes.json();
    expect(story.id).toBeTruthy();

    // Submit a card with artifact
    const cardRes = await request.post(`/api/problem-stories/${story.id}/experiment-cards`, {
      data: {
        agentSummary: 'Test with TypeScript artifact',
        compositeScore: 0.7,
        artifact: {
          source: { 'src/index.ts': 'console.log("hello")' },
          outputType: 'terminal',
          outputPreview: 'hello',
          entrypoint: 'src/index.ts',
          executionMs: 150,
          exitCode: 0,
        },
      },
    });
    expect(cardRes.ok()).toBe(true);
    const cardData = await cardRes.json();
    expect(cardData.ok).toBe(true);
    expect(cardData.card.artifact).toBeTruthy();
    expect(cardData.card.artifact.source).toEqual({ 'src/index.ts': 'console.log("hello")' });
    expect(cardData.card.artifact.outputType).toBe('terminal');
    expect(cardData.card.artifact.outputPreview).toBe('hello');
    expect(cardData.card.artifact.exitCode).toBe(0);
    expect(cardData.card.artifact.executionMs).toBe(150);

    // Verify it's retrievable
    const listRes = await request.get(`/api/problem-stories/${story.id}/experiment-cards`);
    const list = await listRes.json();
    expect(list.cards.length).toBe(1);
    expect(list.cards[0].artifact.source).toEqual({ 'src/index.ts': 'console.log("hello")' });
  });

  test('SA-T014b: card without artifact still works (backwards compat)', async ({ page, request }) => {
    const storyRes = await request.post('/api/problem-stories', {
      data: { description: 'Test no artifact' },
    });
    const story = await storyRes.json();

    const cardRes = await request.post(`/api/problem-stories/${story.id}/experiment-cards`, {
      data: {
        agentSummary: 'Text-only experiment',
        compositeScore: 0.5,
      },
    });
    const cardData = await cardRes.json();
    expect(cardData.ok).toBe(true);
    expect(cardData.card.artifact).toBeNull();
  });
});

test.describe('Snapshot Storage API', () => {

  test('snapshot POST + GET roundtrip', async ({ request }) => {
    // Create a test zip-like payload
    const payload = Buffer.from('PK\x03\x04test-snapshot-data-here');

    const postRes = await request.post('/api/sandbox/snapshot', {
      data: payload,
      headers: {
        'Content-Type': 'application/octet-stream',
        'x-problem-story-id': 'test-story-1',
        'x-card-id': 'test-card-1',
      },
    });
    expect(postRes.ok()).toBe(true);
    const postData = await postRes.json();
    expect(postData.ok).toBe(true);
    expect(postData.id).toBeTruthy();
    expect(postData.contentHash).toMatch(/^sha256:/);
    expect(postData.contentType).toBe('application/zip');
    expect(postData.size).toBeGreaterThan(0);

    // Retrieve it
    const getRes = await request.get(`/api/sandbox/snapshot/${postData.id}`);
    expect(getRes.ok()).toBe(true);
    expect(getRes.headers()['content-type']).toBe('application/zip');
    expect(getRes.headers()['x-content-hash']).toBe(postData.contentHash);

    // Metadata endpoint
    const metaRes = await request.get(`/api/sandbox/snapshot/${postData.id}/meta`);
    const meta = await metaRes.json();
    expect(meta.ok).toBe(true);
    expect(meta.contentHash).toBe(postData.contentHash);
    expect(meta.problemStoryId).toBe('test-story-1');
    expect(meta.cardId).toBe('test-card-1');
  });

  test('snapshot 404 for unknown ID', async ({ request }) => {
    const res = await request.get('/api/sandbox/snapshot/nonexistent');
    expect(res.status()).toBe(404);
  });
});
