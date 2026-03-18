// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Visual verification of the iterate page — catches the bugs seen in manual testing.
 * Takes screenshots at each step for review.
 */

test.describe('Iterate page — visual verification', () => {

  test('full dock has zoom buttons and brain config in DOM', async ({ page }) => {
    await page.goto('/iterate');

    // Full panel should be in DOM with all key elements
    await expect(page.locator('#agentSidebar')).toBeAttached();

    // Zoom buttons (only in full panel, not basic agent_panel.js)
    await expect(page.locator('#agentPanelZoomOutBtn')).toBeAttached();
    await expect(page.locator('#agentPanelZoomInBtn')).toBeAttached();
    await expect(page.locator('#agentDebugToggleBtn')).toBeAttached();
    await expect(page.locator('#minimizeChatBtn')).toBeAttached();

    // Debug tabs
    await expect(page.locator('#agentDebugTabBrain')).toBeAttached();
    await expect(page.locator('#agentDebugTabTools')).toBeAttached();
    await expect(page.locator('#agentDebugTabSession')).toBeAttached();

    // Brain config form elements in DOM
    await expect(page.locator('#llmProviderSelect')).toBeAttached();
    await expect(page.locator('#llmKeyInput')).toBeAttached();
    await expect(page.locator('#llmSaveBtn')).toBeAttached();
    await expect(page.locator('#llmModelIdInput')).toBeAttached();

    // Chat elements
    await expect(page.locator('#chatInput')).toBeAttached();
    await expect(page.locator('#sendChatBtn')).toBeAttached();

    await page.screenshot({ path: 'test-results/iterate-dock-full.png', fullPage: true });
  });

  test('identity step renders avatars at correct size', async ({ page }) => {
    await page.goto('/iterate');
    await page.screenshot({ path: 'test-results/iterate-01-identity.png', fullPage: true });

    // Avatars should be visible and reasonably sized
    const userAvatar = page.locator('[data-testid="user-avatar"]');
    const agentAvatar = page.locator('[data-testid="agent-avatar"]');
    await expect(userAvatar).toBeVisible();
    await expect(agentAvatar).toBeVisible();

    // Check avatar dimensions (should be 120x120 on desktop, 96x96 on mobile)
    const userBox = await userAvatar.boundingBox();
    expect(userBox.width).toBeGreaterThanOrEqual(90);
    expect(userBox.height).toBeGreaterThanOrEqual(90);
  });

  test('brain config step shows OpenRouter button and detects existing config', async ({ page }) => {
    await page.goto('/iterate');
    await page.locator('[data-testid="user-name-input"]').fill('Tester');
    await page.locator('[data-testid="identity-continue-btn"]').click();

    await expect(page.locator('[data-testid="brain-config"]')).toBeVisible();
    await page.screenshot({ path: 'test-results/iterate-02-brain-config.png', fullPage: true });

    // OpenRouter button visible
    await expect(page.locator('[data-testid="openrouter-connect-btn"]')).toBeVisible();

    // Simulate brain config via IndexedDB
    await page.evaluate(async () => {
      try {
        const lib = await import('/openclaw-lite/llm-config-library.js');
        await lib.saveLlmConfig({ provider: 'openrouter', model: 'anthropic/claude-sonnet-4-5', apiKey: 'sk-test-key' });
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
            s.put({ key: 'llmApiKey', value: 'sk-test-key' });
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);
          };
          req.onerror = () => reject(req.error);
        });
      }
    });

    // Wait for detection
    await expect(page.locator('[data-testid="brain-detected"]')).toBeVisible({ timeout: 5000 });
    const detectedText = await page.locator('#brainDetectedModel').textContent();
    expect(detectedText).toContain('openrouter');

    // Continue should be enabled
    await expect(page.locator('[data-testid="brain-continue-btn"]')).toBeEnabled();
    await page.screenshot({ path: 'test-results/iterate-03-brain-detected.png', fullPage: true });
  });

  test('active loop renders correctly with conversation + feed columns', async ({ page }) => {
    await page.goto('/iterate');

    // Complete identity
    await page.locator('[data-testid="user-name-input"]').fill('Tester');
    await page.locator('[data-testid="identity-continue-btn"]').click();

    // Simulate brain config
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

    // Enter problem
    await page.locator('[data-testid="problem-input"]').fill('I want to build a tool that identifies birds in photos I take with my camera');
    await page.locator('[data-testid="start-btn"]').click();

    // Should reach active loop
    await expect(page.locator('[data-testid="active-loop"]')).toBeVisible({ timeout: 10000 });

    // Verify key elements are present
    await expect(page.locator('[data-testid="conversation-thread"]')).toBeVisible();
    await expect(page.locator('[data-testid="experiment-feed"]')).toBeAttached(); // May be hidden column on small viewport
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="chat-send-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="export-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="save-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="score-trend"]')).toBeVisible();

    // Check that "Problem submitted" system message appeared
    const sysMsg = page.locator('[data-testid="msg-system"]').first();
    await expect(sysMsg).toBeVisible();
    const sysMsgText = await sysMsg.textContent();
    expect(sysMsgText).toContain('Problem submitted');

    // No JS errors visible (the "Cannot read properties of undefined" bug)
    const errorMessages = page.locator('[data-testid="msg-system"]');
    const allTexts = await errorMessages.allTextContents();
    const hasJsError = allTexts.some(t => t.includes('Cannot read properties'));
    expect(hasJsError).toBe(false);

    // Type a message in the iterate chat bar — should not crash
    await page.locator('[data-testid="chat-input"]').fill('testing 1 2 3');
    await page.locator('[data-testid="chat-send-btn"]').click();

    // User message should appear in conversation
    const userMsg = page.locator('[data-testid="msg-user"]').first();
    await expect(userMsg).toBeVisible();

    await page.screenshot({ path: 'test-results/iterate-04-active-loop.png', fullPage: true });

    // Dock should still be visible at bottom
    await expect(page.locator('#agentSidebar')).toBeAttached();
  });

  test('no JavaScript errors on page load', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/iterate');
    await page.waitForTimeout(2000); // Let scripts initialize

    // Filter out known non-critical errors (esbuild-wasm load failure in test env, etc)
    const critical = errors.filter(e =>
      !e.includes('esbuild') &&
      !e.includes('SharedArrayBuffer') &&
      !e.includes('WebContainer')
    );
    expect(critical).toEqual([]);
  });
});
