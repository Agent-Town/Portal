const { test, expect } = require('@playwright/test');
const { reset, fixturePath } = require('./helpers/avatar');
const fs = require('fs');

test.beforeEach(async ({ request }) => {
  await reset(request);
});

async function uploadFixtureInPageSession(page, name) {
  // Establish the session cookie first (avatar endpoints are session-scoped).
  await page.goto('/');
  const buf = fs.readFileSync(fixturePath(name));
  const resp = await page.request.post('/api/avatar/upload', {
    multipart: {
      avatar: {
        name,
        mimeType: 'image/png',
        buffer: buf
      }
    }
  });
  expect(resp.ok()).toBeTruthy();
  const up = await resp.json();
  const started = Date.now();
  while (Date.now() - started < 20000) {
    const r = await page.request.get(`/api/avatar/jobs/${encodeURIComponent(up.jobId)}`);
    expect(r.ok()).toBeTruthy();
    const payload = await r.json();
    if (payload.job.status === 'completed' || payload.job.status === 'failed') {
      expect(payload.job.status).toBe('completed');
      return up;
    }
    await page.waitForTimeout(120);
  }
  throw new Error('timeout waiting for avatar job');
}

test('world runtime maps movement state to correct clip+direction', async ({ page }) => {
  const up = await uploadFixtureInPageSession(page, 'good_full.png');

  await page.goto(`/world?avatar=${encodeURIComponent(up.avatarId)}`);

  const state = page.getByTestId('world-avatar-state');
  await expect(state).toContainText(up.avatarId);
  await expect(state).toContainText('clip=idle');

  await page.dispatchEvent('[data-testid="dpad-left"]', 'pointerdown');
  await page.waitForTimeout(300);
  await expect(state).toContainText('clip=walk');
  await expect(state).toContainText('dir=west');

  const t1 = await state.textContent();
  await page.waitForTimeout(300);
  const t2 = await state.textContent();
  expect(t2).not.toBe(t1);

  await page.dispatchEvent('[data-testid="dpad-left"]', 'pointerup');
  await page.waitForTimeout(200);
  await expect(state).toContainText('clip=idle');
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('mobile world uses touch-friendly controls and advances frames', async ({ page }) => {
    const up = await uploadFixtureInPageSession(page, 'good_full.png');

    await page.goto(`/world?avatar=${encodeURIComponent(up.avatarId)}`);

    const state = page.getByTestId('world-avatar-state');
    await expect(state).toContainText('clip=idle');

    await page.dispatchEvent('[data-testid="dpad-down"]', 'pointerdown');
    await page.waitForTimeout(250);
    const a = await state.textContent();
    await page.waitForTimeout(250);
    const b = await state.textContent();

    expect(b).not.toBe(a);
    await expect(state).toContainText('dir=south');

    await page.dispatchEvent('[data-testid="dpad-down"]', 'pointerup');
    await page.waitForTimeout(150);
    await expect(state).toContainText('clip=idle');
  });
});
