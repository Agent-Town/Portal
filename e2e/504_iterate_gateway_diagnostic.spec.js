// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Diagnostic test to find exactly where the gateway → worker → LLM chain breaks.
 * Captures console logs, network requests, and gateway state.
 */

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';
test.skip(!OPENROUTER_KEY, 'Requires OPENROUTER_API_KEY env var');

test('diagnose gateway chain', async ({ page }) => {
  const consoleLogs = [];
  const networkRequests = [];
  const networkFailures = [];

  // Capture console
  page.on('console', (msg) => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Capture network requests AND responses
  page.on('request', (req) => {
    if (req.url().includes('/api/') || req.url().includes('openrouter') || req.url().includes('anthropic')) {
      networkRequests.push({ method: req.method(), url: req.url() });
    }
  });
  const networkResponses = [];
  page.on('response', (res) => {
    if (res.url().includes('/api/llm') || res.url().includes('openrouter')) {
      networkResponses.push({ url: res.url(), status: res.status(), statusText: res.statusText() });
    }
  });
  page.on('requestfailed', (req) => {
    networkFailures.push({ url: req.url(), failure: req.failure()?.errorText });
  });

  // 1. Load page
  await page.goto('/iterate');
  await page.waitForTimeout(2000);

  // 2. Check gateway module
  const gatewayCheck = await page.evaluate(async () => {
    try {
      const mod = await import('/openclaw-lite/gateway.js');
      let gw = mod.default || mod;
      if (gw instanceof Promise) gw = await gw;
      return {
        loaded: true,
        type: typeof gw,
        hasOn: typeof gw?.on === 'function',
        hasSend: typeof gw?.send === 'function',
        keys: Object.keys(gw || {}).slice(0, 10),
      };
    } catch (e) {
      return { loaded: false, error: e.message };
    }
  });
  console.log('Gateway check:', JSON.stringify(gatewayCheck));

  // 3. Save LLM config to IndexedDB — iterate.js will auto-push to worker
  await page.evaluate(async ({ apiKey }) => {
    try {
      const lib = await import('/openclaw-lite/llm-config-library.js');
      await lib.saveLlmConfig({ provider: 'openrouter', model: 'anthropic/claude-sonnet-4-5', apiKey });
      console.log('LLM config saved to IndexedDB');
    } catch (e) {
      console.log('LLM config save failed:', e.message);
    }
  }, { apiKey: OPENROUTER_KEY });

  // Wait for iterate.js to push config to worker
  await page.waitForTimeout(3000);

  // 4. Check if worker is running
  const workerCheck = await page.evaluate(async () => {
    // Check for Web Worker
    if (typeof Worker === 'undefined') return { hasWorker: false, reason: 'Worker not supported' };

    // Check if the gateway events object exists
    try {
      const mod = await import('/openclaw-lite/gateway.js');
      let gw = mod.default || mod;
      if (gw instanceof Promise) gw = await gw;

      // Try to get runtime state
      if (typeof gw.send === 'function') {
        return { hasGateway: true, canSend: true };
      }
      return { hasGateway: true, canSend: false, gwType: typeof gw };
    } catch (e) {
      return { hasGateway: false, error: e.message };
    }
  });
  console.log('Worker check:', JSON.stringify(workerCheck));

  // 5. Expand dock and try sending a message
  await page.locator('.sidebar-header').click();
  await page.waitForTimeout(500);

  // Type and send
  await page.locator('#chatInput').fill('Hello, please respond with just "OK"');
  await page.locator('#sendChatBtn').click();

  // Wait for LLM response (OpenRouter can take 10-15s)
  await page.waitForTimeout(15000);

  // Check for worker errors
  const workerErrors = await page.evaluate(() => {
    const logs = document.getElementById('agentLogs');
    return logs?.textContent || '(empty)';
  });
  console.log('Worker/system logs:', workerErrors.slice(0, 1000));

  // 6. Check what happened
  const dockContent = await page.evaluate(() => {
    const transcript = document.getElementById('chatTranscript');
    return transcript?.innerHTML || '(empty)';
  });

  const agentLogs = await page.evaluate(() => {
    const logs = document.getElementById('agentLogs');
    return logs?.textContent || '(empty)';
  });

  const agentStatus = await page.evaluate(() => {
    const status = document.getElementById('agentStatus');
    return status?.textContent || '(unknown)';
  });

  await page.screenshot({ path: 'test-results/diagnostic-gateway.png', fullPage: true });

  // Output diagnostic info
  console.log('\n=== DIAGNOSTIC RESULTS ===');
  console.log('Agent status:', agentStatus);
  console.log('Dock transcript HTML length:', dockContent.length);
  console.log('Dock transcript preview:', dockContent.slice(0, 500));
  console.log('Agent logs:', agentLogs.slice(0, 500));
  console.log('Network requests:', JSON.stringify(networkRequests.slice(0, 20), null, 2));
  console.log('LLM proxy responses:', JSON.stringify(networkResponses, null, 2));
  console.log('Network failures:', JSON.stringify(networkFailures, null, 2));
  console.log('Console logs (last 20):', consoleLogs.slice(-20).join('\n'));
  console.log('=========================\n');

  // The test always passes — it's diagnostic
  expect(true).toBe(true);
});
