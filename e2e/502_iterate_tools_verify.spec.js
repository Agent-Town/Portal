// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Verify the iterate tool surface works end-to-end.
 * Simulates what the agent would do via tools.
 */

// Helper: get through identity + brain to active loop
async function reachActiveLoop(page, problem) {
  await page.goto('/iterate');
  await page.locator('[data-testid="user-name-input"]').fill('Tester');
  await page.locator('[data-testid="identity-continue-btn"]').click();

  await expect(page.locator('[data-testid="brain-config"]')).toBeVisible();
  await page.evaluate(async () => {
    try {
      const lib = await import('/openclaw-lite/llm-config-library.js');
      await lib.saveLlmConfig({ provider: 'openrouter', model: 'anthropic/claude-sonnet-4-5', apiKey: 'sk-test' });
    } catch {
      await new Promise((resolve, reject) => {
        const req = indexedDB.open('openclaw-lite', 1);
        req.onupgradeneeded = () => { req.result.createObjectStore('meta', { keyPath: 'key' }); };
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction('meta', 'readwrite');
          const s = tx.objectStore('meta');
          s.put({ key: 'llmProvider', value: 'openrouter' });
          s.put({ key: 'llmModelId', value: 'anthropic/claude-sonnet-4-5' });
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

  await page.locator('[data-testid="problem-input"]').fill(problem || 'Build a function that sorts an array');
  await page.locator('[data-testid="start-btn"]').click();
  await expect(page.locator('[data-testid="active-loop"]')).toBeVisible({ timeout: 10000 });
}

// Helper: call an iterate tool via the CustomEvent bridge (simulates what the worker does)
async function callIterateTool(page, action, params) {
  return await page.evaluate(async ({ action, params }) => {
    return new Promise((resolve) => {
      const requestId = `test_${Date.now()}`;
      const timeout = setTimeout(() => resolve({ ok: false, error: 'timeout' }), 5000);

      window.addEventListener('iterate.toolResponse', function handler(evt) {
        if (evt.detail?.requestId !== requestId) return;
        window.removeEventListener('iterate.toolResponse', handler);
        clearTimeout(timeout);
        resolve(evt.detail.envelope);
      });

      window.dispatchEvent(new CustomEvent('iterate.toolRequest', {
        detail: { requestId, action, params }
      }));
    });
  }, { action, params });
}

test.describe('Iterate tools — full verification', () => {

  test('getState returns current iterate state', async ({ page }) => {
    await reachActiveLoop(page, 'Test problem for state check');

    const result = await callIterateTool(page, 'getState', {});
    expect(result.ok).toBe(true);
    expect(result.stateSnapshot.phase).toBe('active_loop');
    expect(result.stateSnapshot.storyId).toBeTruthy();
    expect(result.stateSnapshot.userName).toBe('Tester');
  });

  test('setProblem updates the page title', async ({ page }) => {
    await reachActiveLoop(page, 'Initial problem');

    const result = await callIterateTool(page, 'setProblem', {
      problemDescription: 'Optimize database query performance for large datasets'
    });
    expect(result.ok).toBe(true);
    expect(result.applied).toBe(true);

    // Title should be updated
    const title = await page.locator('#problemTitle').textContent();
    expect(title).toContain('Optimize database');

    // System message should appear in conversation
    await expect(page.locator('[data-testid="msg-system"]').last()).toContainText('Problem set');

    await page.screenshot({ path: 'test-results/tool-01-set-problem.png', fullPage: true });
  });

  test('proposeMetrics renders metric cards with confirm button', async ({ page }) => {
    await reachActiveLoop(page, 'Test for metrics');

    const result = await callIterateTool(page, 'proposeMetrics', {
      metrics: [
        { name: 'Query time', type: 'quantitative', direction: 'minimize', weight: 1.5, rationale: 'Primary performance indicator' },
        { name: 'Memory usage', type: 'quantitative', direction: 'minimize', weight: 1.0, rationale: 'Should not consume excessive RAM' },
        { name: 'Code clarity', type: 'qualitative', direction: 'maximize', weight: 0.5, rationale: 'Must be maintainable' },
      ]
    });
    expect(result.ok).toBe(true);

    // Metric cards should be visible
    await expect(page.locator('[data-testid="proposed-metrics"]')).toBeVisible();
    const metricCards = page.locator('[data-testid="metric-card"]');
    expect(await metricCards.count()).toBe(3);

    // Confirm button should be present
    await expect(page.locator('[data-action="confirm-metrics"]')).toBeVisible();

    await page.screenshot({ path: 'test-results/tool-02-propose-metrics.png', fullPage: true });
  });

  test('confirmMetrics activates story on server', async ({ page }) => {
    await reachActiveLoop(page, 'Test for confirm');

    // First propose
    await callIterateTool(page, 'proposeMetrics', {
      metrics: [
        { name: 'Speed', type: 'quantitative', direction: 'minimize', weight: 1.0 },
      ]
    });

    // Then confirm
    const result = await callIterateTool(page, 'confirmMetrics', {
      metrics: [
        { name: 'Speed', type: 'quantitative', direction: 'minimize', weight: 1.0 },
      ]
    });
    expect(result.ok).toBe(true);
    expect(result.stateSnapshot.metricsConfirmed).toBe(true);

    // System message about confirmation
    await expect(page.locator('[data-testid="msg-system"]').last()).toContainText('metrics confirmed');
  });

  test('submitCode creates experiment card in feed', async ({ page }) => {
    await reachActiveLoop(page, 'Test for code submission');

    // Confirm metrics first
    await callIterateTool(page, 'confirmMetrics', {
      metrics: [{ name: 'Correctness', type: 'qualitative', direction: 'maximize', weight: 1.0 }]
    });

    // Submit code
    const result = await callIterateTool(page, 'submitCode', {
      files: { 'src/index.ts': 'const arr = [3,1,2];\narr.sort((a,b) => a-b);\nconsole.log(arr);' },
      summary: 'Basic array sort using native sort method',
      compositeScore: 0.7,
    });

    expect(result.ok).toBe(true);
    expect(result.stateSnapshot.cardId).toBeTruthy();

    // Experiment card should appear in the feed
    await expect(page.locator('[data-testid="experiment-card"]').first()).toBeVisible();

    await page.screenshot({ path: 'test-results/tool-03-submit-code.png', fullPage: true });
  });

  test('full tool flow: problem → metrics → code → card', async ({ page }) => {
    await reachActiveLoop(page, 'E2E tool flow test');
    await page.screenshot({ path: 'test-results/tool-flow-01-start.png', fullPage: true });

    // 1. Set problem
    await callIterateTool(page, 'setProblem', {
      problemDescription: 'Write a function that checks if a string is a palindrome, handling edge cases like spaces and capitalization'
    });

    // 2. Propose metrics
    await callIterateTool(page, 'proposeMetrics', {
      metrics: [
        { name: 'Correctness', type: 'qualitative', direction: 'maximize', weight: 2.0, rationale: 'Must handle all edge cases' },
        { name: 'Code size', type: 'quantitative', direction: 'minimize', weight: 0.5, rationale: 'Prefer concise solutions' },
      ]
    });
    await page.screenshot({ path: 'test-results/tool-flow-02-metrics.png', fullPage: true });

    // 3. Confirm metrics
    await callIterateTool(page, 'confirmMetrics', {});

    // 4. Submit first experiment
    const exp1 = await callIterateTool(page, 'submitCode', {
      files: {
        'src/index.ts': `function isPalindrome(s: string): boolean {
  const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleaned === cleaned.split('').reverse().join('');
}

console.log(isPalindrome('racecar'));    // true
console.log(isPalindrome('Race Car'));   // true
console.log(isPalindrome('hello'));      // false
console.log(isPalindrome('A man a plan a canal Panama')); // true
`
      },
      summary: 'Palindrome checker with case/space normalization',
      compositeScore: 0.85,
    });
    expect(exp1.ok).toBe(true);
    await page.screenshot({ path: 'test-results/tool-flow-03-experiment.png', fullPage: true });

    // 5. Check state
    const state = await callIterateTool(page, 'getState', {});
    expect(state.stateSnapshot.experimentCount).toBeGreaterThanOrEqual(1);
    expect(state.stateSnapshot.currentRound).toBeGreaterThanOrEqual(1);

    // 6. Verify the card is in the feed with content
    const card = page.locator('[data-testid="experiment-card"]').first();
    await expect(card).toBeVisible();
    const cardText = await card.textContent();
    expect(cardText).toContain('Palindrome');

    await page.screenshot({ path: 'test-results/tool-flow-04-final.png', fullPage: true });
  });
});
