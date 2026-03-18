// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Full end-to-end flow verification for the iterate page.
 * Tests the complete chain: page load → identity → brain → problem → gateway → tools.
 *
 * If OPENROUTER_API_KEY env var is set, also tests real LLM responses.
 * Without it, verifies the flow up to the point where an LLM would respond.
 */

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';
const HAS_REAL_KEY = OPENROUTER_KEY.length > 10;

// Helper: call iterate tool via CustomEvent bridge
async function callTool(page, action, params) {
  return await page.evaluate(async ({ action, params }) => {
    return new Promise((resolve) => {
      const requestId = `test_${Date.now()}`;
      const timeout = setTimeout(() => resolve({ ok: false, error: 'timeout' }), 8000);
      window.addEventListener('iterate.toolResponse', function h(evt) {
        if (evt.detail?.requestId !== requestId) return;
        window.removeEventListener('iterate.toolResponse', h);
        clearTimeout(timeout);
        resolve(evt.detail.envelope);
      });
      window.dispatchEvent(new CustomEvent('iterate.toolRequest', {
        detail: { requestId, action, params }
      }));
    });
  }, { action, params });
}

test.describe('Iterate E2E flow — chain verification', () => {

  test('step 1: page loads, identity works, brain detected', async ({ page }) => {
    await page.goto('/iterate');
    await expect(page.locator('[data-testid="iterate-page"]')).toBeVisible();

    // Identity
    await page.locator('[data-testid="user-name-input"]').fill('E2E Tester');
    await page.locator('[data-testid="agent-name-input"]').fill('TestAgent');
    await page.locator('[data-testid="identity-continue-btn"]').click();

    // Brain config step visible
    await expect(page.locator('[data-testid="brain-config"]')).toBeVisible();

    // Simulate brain config (always use openrouter so the proxy path works)
    const apiKey = HAS_REAL_KEY ? OPENROUTER_KEY : 'sk-test-no-real-calls';
    await page.evaluate(async ({ apiKey }) => {
      try {
        const lib = await import('/openclaw-lite/llm-config-library.js');
        await lib.saveLlmConfig({
          provider: 'openrouter',
          model: 'anthropic/claude-sonnet-4-5',
          apiKey,
        });
      } catch {
        await new Promise((resolve, reject) => {
          const req = indexedDB.open('openclaw-lite', 1);
          req.onupgradeneeded = () => req.result.createObjectStore('meta', { keyPath: 'key' });
          req.onsuccess = () => {
            const db = req.result;
            const tx = db.transaction('meta', 'readwrite');
            const s = tx.objectStore('meta');
            s.put({ key: 'llmProvider', value: 'openrouter' });
            s.put({ key: 'llmModelId', value: 'anthropic/claude-sonnet-4-5' });
            s.put({ key: 'llmApiKey', value: apiKey });
            s.put({ key: 'llmUseProxy', value: true });
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);
          };
          req.onerror = () => reject(req.error);
        });
      }
    }, { apiKey });

    // Brain detected
    await expect(page.locator('[data-testid="brain-continue-btn"]')).toBeEnabled({ timeout: 5000 });
    await page.locator('[data-testid="brain-continue-btn"]').click();

    // Problem input
    await expect(page.locator('[data-testid="step-problem"]')).toBeVisible();
    await page.screenshot({ path: 'test-results/e2e-01-problem-input.png', fullPage: true });
  });

  test('step 2: problem submitted, active loop entered, tools work', async ({ page }) => {
    // Fast-track to active loop
    await page.goto('/iterate');
    await page.locator('[data-testid="user-name-input"]').fill('E2E Tester');
    await page.locator('[data-testid="identity-continue-btn"]').click();

    const apiKey = HAS_REAL_KEY ? OPENROUTER_KEY : 'sk-test';
    await page.evaluate(async ({ apiKey }) => {
      try {
        const lib = await import('/openclaw-lite/llm-config-library.js');
        await lib.saveLlmConfig({ provider: 'openrouter', model: 'anthropic/claude-sonnet-4-5', apiKey });
      } catch {
        await new Promise((resolve, reject) => {
          const req = indexedDB.open('openclaw-lite', 1);
          req.onupgradeneeded = () => req.result.createObjectStore('meta', { keyPath: 'key' });
          req.onsuccess = () => {
            const db = req.result;
            const tx = db.transaction('meta', 'readwrite');
            const s = tx.objectStore('meta');
            s.put({ key: 'llmProvider', value: 'openrouter' });
            s.put({ key: 'llmModelId', value: 'anthropic/claude-sonnet-4-5' });
            s.put({ key: 'llmApiKey', value: apiKey });
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);
          };
          req.onerror = () => reject(req.error);
        });
      }
    }, { apiKey });

    await expect(page.locator('[data-testid="brain-continue-btn"]')).toBeEnabled({ timeout: 5000 });
    await page.locator('[data-testid="brain-continue-btn"]').click();

    // Submit problem
    await page.locator('[data-testid="problem-input"]').fill('Write a TypeScript function that checks if a number is prime');
    await page.locator('[data-testid="start-btn"]').click();
    await expect(page.locator('[data-testid="active-loop"]')).toBeVisible({ timeout: 10000 });

    // Verify tools work
    const state = await callTool(page, 'getState', {});
    expect(state.ok).toBe(true);
    expect(state.stateSnapshot.phase).toBe('active_loop');
    expect(state.stateSnapshot.storyId).toBeTruthy();

    // Set problem via tool
    const setProblem = await callTool(page, 'setProblem', {
      problemDescription: 'Write a TypeScript function that checks if a number is prime, handling edge cases'
    });
    expect(setProblem.ok).toBe(true);

    // Propose metrics via tool
    const proposeMetrics = await callTool(page, 'proposeMetrics', {
      metrics: [
        { name: 'Correctness', type: 'qualitative', direction: 'maximize', weight: 2.0, rationale: 'Must correctly identify primes' },
        { name: 'Edge cases', type: 'qualitative', direction: 'maximize', weight: 1.5, rationale: 'Handle 0, 1, negative, large numbers' },
      ]
    });
    expect(proposeMetrics.ok).toBe(true);
    await expect(page.locator('[data-testid="proposed-metrics"]')).toBeVisible();

    // Confirm metrics via tool
    const confirm = await callTool(page, 'confirmMetrics', {
      metrics: [
        { name: 'Correctness', type: 'qualitative', direction: 'maximize', weight: 2.0 },
        { name: 'Edge cases', type: 'qualitative', direction: 'maximize', weight: 1.5 },
      ]
    });
    expect(confirm.ok).toBe(true);
    expect(confirm.stateSnapshot.metricsConfirmed).toBe(true);

    // Submit code via tool
    const submitCode = await callTool(page, 'submitCode', {
      files: {
        'src/index.ts': `function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

// Test cases
console.log('isPrime(0):', isPrime(0));   // false
console.log('isPrime(1):', isPrime(1));   // false
console.log('isPrime(2):', isPrime(2));   // true
console.log('isPrime(7):', isPrime(7));   // true
console.log('isPrime(15):', isPrime(15)); // false
console.log('isPrime(97):', isPrime(97)); // true
console.log('isPrime(-5):', isPrime(-5)); // false
`
      },
      summary: 'Prime checker with edge case handling for 0, 1, negative numbers',
      compositeScore: 0.85,
    });
    expect(submitCode.ok).toBe(true);
    expect(submitCode.stateSnapshot.cardId).toBeTruthy();

    // Verify experiment card appeared
    await expect(page.locator('[data-testid="experiment-card"]').first()).toBeVisible();

    await page.screenshot({ path: 'test-results/e2e-02-full-flow.png', fullPage: true });
  });

  test('step 3: gateway connection check', async ({ page }) => {
    await page.goto('/iterate');

    // Check if gateway module loads
    const gatewayStatus = await page.evaluate(async () => {
      try {
        const mod = await import('/openclaw-lite/gateway.js');
        const gw = mod.default || mod;
        if (gw instanceof Promise) await gw;
        return {
          loaded: true,
          hasOn: typeof (gw?.on || gw) === 'function' || typeof gw?.on === 'function',
          hasSend: typeof (gw?.send || gw) === 'function' || typeof gw?.send === 'function',
          type: typeof gw,
        };
      } catch (e) {
        return { loaded: false, error: e.message };
      }
    });
    expect(gatewayStatus.loaded).toBe(true);
  });

  test('step 4: dock chat sends message without crash', async ({ page }) => {
    await page.goto('/iterate');

    // Wait for dock to be present
    await expect(page.locator('#agentSidebar')).toBeAttached();

    // Expand the dock
    await page.locator('.sidebar-header').click();
    await page.waitForTimeout(500);

    // Type in the dock chat
    const dockInput = page.locator('#chatInput');
    await expect(dockInput).toBeVisible();
    await dockInput.fill('Hello agent');
    await page.locator('#sendChatBtn').click();

    // Should not crash — check for errors
    await page.waitForTimeout(1000);
    const errors = await page.evaluate(() => {
      // Check if any error messages appeared
      const logs = document.getElementById('agentLogs');
      return logs?.textContent || '';
    });

    // No critical JS errors
    expect(errors).not.toContain('Cannot read properties');

    await page.screenshot({ path: 'test-results/e2e-03-dock-chat.png', fullPage: true });
  });
});

// Only run real LLM test if API key is provided
test.describe('Iterate E2E — real LLM integration', () => {
  test.skip(!HAS_REAL_KEY, 'Skipped: OPENROUTER_API_KEY not set');

  test('real LLM responds to chat message', async ({ page }) => {
    await page.goto('/iterate');

    // Set up brain with real key
    await page.evaluate(async ({ apiKey }) => {
      try {
        const lib = await import('/openclaw-lite/llm-config-library.js');
        await lib.saveLlmConfig({
          provider: 'openrouter',
          model: 'anthropic/claude-sonnet-4-5',
          apiKey,
        });
      } catch { /* fallback handled elsewhere */ }
    }, { apiKey: OPENROUTER_KEY });

    // Wait for gateway
    await page.waitForTimeout(2000);

    // Expand dock and send a message
    await page.locator('.sidebar-header').click();
    await page.waitForTimeout(500);
    await page.locator('#chatInput').fill('Say "hello world" and nothing else.');
    await page.locator('#sendChatBtn').click();

    // Wait for agent response (up to 30s for LLM call)
    const response = await page.evaluate(() => {
      return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(null), 30000);
        const observer = new MutationObserver(() => {
          const messages = document.querySelectorAll('.chat-message.agent, .chat-message.assistant');
          const last = messages[messages.length - 1];
          if (last?.textContent?.trim()) {
            observer.disconnect();
            clearTimeout(timeout);
            resolve(last.textContent.trim());
          }
        });
        observer.observe(document.getElementById('chatTranscript') || document.body, {
          childList: true, subtree: true
        });
      });
    });

    expect(response).toBeTruthy();
    expect(response.length).toBeGreaterThan(0);

    await page.screenshot({ path: 'test-results/e2e-04-real-llm.png', fullPage: true });
  });
});
