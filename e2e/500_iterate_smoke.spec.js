// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * ZHC1 Iterate Prototype — Smoke Tests
 *
 * Covers: IT-T001, IT-T002, IT-T010–T013, IT-T040, IT-T041
 * See specs/46_zhc1_iterate_prototype_tdd_spec.md
 *
 * Brain config + agent comms are handled by agent_panel.js (the dock).
 * These tests cover the iterate-specific flow: identity → problem → active loop.
 */

test.describe('Iterate page — entry point', () => {
  test('IT-T001: page loads with Agent Town branding', async ({ page }) => {
    await page.goto('/iterate');
    await expect(page.locator('[data-testid="iterate-page"]')).toBeVisible();
    const title = await page.title();
    expect(title).toContain('Iterate');
  });

  test('IT-T002: page is responsive at mobile width', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/iterate');
    await expect(page.locator('[data-testid="iterate-page"]')).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
});

test.describe('Iterate page — identity onboarding', () => {
  test('IT-T010: user can enter their name', async ({ page }) => {
    await page.goto('/iterate');
    const input = page.locator('[data-testid="user-name-input"]');
    await expect(input).toBeVisible();
    await input.fill('User');
    const btn = page.locator('[data-testid="identity-continue-btn"]');
    await expect(btn).toBeEnabled();
  });

  test('IT-T011: user can name their agent', async ({ page }) => {
    await page.goto('/iterate');
    const input = page.locator('[data-testid="agent-name-input"]');
    await expect(input).toBeVisible();
    await expect(input).toHaveValue('OpenClaw');
    await input.fill('Scout');
    await expect(input).toHaveValue('Scout');
  });

  test('IT-T012: avatars displayed for user and agent', async ({ page }) => {
    await page.goto('/iterate');
    const userAvatar = page.locator('[data-testid="user-avatar"]');
    const agentAvatar = page.locator('[data-testid="agent-avatar"]');
    await expect(userAvatar).toBeVisible();
    await expect(agentAvatar).toBeVisible();
    await expect(userAvatar).toHaveAttribute('src', '/brand-kit/default_user_avatar.png');
    await expect(agentAvatar).toHaveAttribute('src', '/brand-kit/default_agent_avatar.png');
  });

  test('IT-T012b: avatar upload inputs present', async ({ page }) => {
    await page.goto('/iterate');
    await expect(page.locator('[data-testid="user-avatar-upload"]')).toBeAttached();
    await expect(page.locator('[data-testid="agent-avatar-upload"]')).toBeAttached();
  });

  test('IT-T013: identity persists in localStorage', async ({ page }) => {
    await page.goto('/iterate');
    await page.locator('[data-testid="user-name-input"]').fill('User');
    await page.locator('[data-testid="agent-name-input"]').fill('Scout');
    await page.locator('[data-testid="identity-continue-btn"]').click();

    const userName = await page.evaluate(() => localStorage.getItem('iterate:userName'));
    const agentName = await page.evaluate(() => localStorage.getItem('iterate:agentName'));
    expect(userName).toBe('User');
    expect(agentName).toBe('Scout');
  });
});

test.describe('Iterate page — brain config step', () => {
  test('IT-T020: brain config shown after identity with OpenRouter button', async ({ page }) => {
    await page.goto('/iterate');
    await page.locator('[data-testid="user-name-input"]').fill('User');
    await page.locator('[data-testid="identity-continue-btn"]').click();

    await expect(page.locator('[data-testid="brain-config"]')).toBeVisible();
    await expect(page.locator('[data-testid="openrouter-connect-btn"]')).toBeVisible();
    // Continue button disabled until brain configured
    await expect(page.locator('[data-testid="brain-continue-btn"]')).toBeDisabled();
  });
});

test.describe('Iterate page — problem input', () => {
  test('IT-T040: problem input shown after brain config', async ({ page }) => {
    await page.goto('/iterate');
    await page.locator('[data-testid="user-name-input"]').fill('User');
    await page.locator('[data-testid="identity-continue-btn"]').click();

    // Brain step shows — simulate brain config by writing to IndexedDB
    await expect(page.locator('[data-testid="brain-config"]')).toBeVisible();
    await page.evaluate(async () => {
      try {
        const lib = await import('/openclaw-lite/llm-config-library.js');
        await lib.saveLlmConfig({ provider: 'openai', model: 'gpt-4o-mini', apiKey: 'sk-test' });
      } catch {
        // Fallback: write directly to IDB
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

    // Wait for detection to pick it up
    await expect(page.locator('[data-testid="brain-continue-btn"]')).toBeEnabled({ timeout: 5000 });
    await page.locator('[data-testid="brain-continue-btn"]').click();

    await expect(page.locator('[data-testid="step-problem"]')).toBeVisible();
    await expect(page.locator('[data-testid="problem-input"]')).toBeVisible();
  });

  test('IT-T041: problem story created on submit', async ({ page }) => {
    await page.goto('/iterate');

    // Complete identity
    await page.locator('[data-testid="user-name-input"]').fill('User');
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

    // Enter problem
    await page.locator('[data-testid="problem-input"]').fill('My landing page converts at 2 percent and I want to improve it to 5 percent');
    await page.locator('[data-testid="start-btn"]').click();

    // Should transition to active loop
    await expect(page.locator('[data-testid="active-loop"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="conversation-thread"]')).toBeVisible();
  });

  test('IT-T042: agent dock is present on page', async ({ page }) => {
    await page.goto('/iterate');
    // Panel loaded asynchronously via fetch
    await expect(page.locator('[data-testid="agent-panel"]')).toBeAttached({ timeout: 10000 });
  });
});
