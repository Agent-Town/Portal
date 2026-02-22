const { test, expect } = require('@playwright/test');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function ensureTownhallVisible(page) {
  const panel = page.locator('#townhallRegisterPanel');
  if (await panel.isVisible()) return;

  const modal = page.locator('#districtModalBackdrop');
  if (!(await modal.isVisible())) {
    await page.getByRole('button', { name: 'Open Town Hall' }).click();
  }
  await expect(panel).toBeVisible({ timeout: 5000 });
}

async function completeSignupForCreateRoute(page) {
  const sessionResp = await page.request.get('/api/session');
  expect(sessionResp.ok()).toBeTruthy();
  const session = await sessionResp.json();
  const teamCode = String(session?.teamCode || '');
  expect(teamCode).toMatch(/^TEAM-/);

  const connectResp = await page.request.post('/api/agent/connect', {
    headers: { 'content-type': 'application/json' },
    data: { teamCode, agentName: 'ModalTester' }
  });
  expect(connectResp.ok()).toBeTruthy();

  const humanSelectResp = await page.request.post('/api/human/select', {
    headers: { 'content-type': 'application/json' },
    data: { elementId: 'wolf' }
  });
  expect(humanSelectResp.ok()).toBeTruthy();

  const agentSelectResp = await page.request.post('/api/agent/select', {
    headers: { 'content-type': 'application/json' },
    data: { teamCode, elementId: 'wolf' }
  });
  expect(agentSelectResp.ok()).toBeTruthy();

  const humanOpenResp = await page.request.post('/api/human/open/press', {
    headers: { 'content-type': 'application/json' },
    data: {}
  });
  expect(humanOpenResp.ok()).toBeTruthy();

  const agentOpenResp = await page.request.post('/api/agent/open/press', {
    headers: { 'content-type': 'application/json' },
    data: { teamCode }
  });
  expect(agentOpenResp.ok()).toBeTruthy();

  const stateResp = await page.request.get('/api/state');
  expect(stateResp.ok()).toBeTruthy();
  const state = await stateResp.json();
  expect(state?.signup?.complete).toBe(true);
}

test('town hall exposes only the single worker path controls', async ({ page }) => {
  await page.goto('/app');
  await ensureTownhallVisible(page);

  await expect(page.getByTestId('townhall-single-path-note')).toBeVisible();
  await expect(page.getByTestId('path-human')).toHaveCount(0);
  await expect(page.getByTestId('path-coop')).toHaveCount(0);
  await expect(page.getByTestId('path-agent')).toHaveCount(0);
});

test('town hall opens /create inside the district modal frame', async ({ page }) => {
  const createResp = await page.request.get('/create');
  expect(createResp.ok()).toBeTruthy();
  expect(String(createResp.headers()['x-frame-options'] || '').toUpperCase()).toContain('SAMEORIGIN');

  await completeSignupForCreateRoute(page);
  await page.goto('/app');
  await ensureTownhallVisible(page);

  await page.evaluate(() => {
    const link = document.querySelector('#openReady a[href="/create"]');
    if (!link) throw new Error('MISSING_CREATE_LINK');
    link.click();
  });

  await expect(page).toHaveURL(/\/app/);
  await expect(page.locator('#districtModalTitle')).toHaveText('Ceremony');
  const frame = page.locator('#districtModalBody iframe.districtFrame');
  await expect(frame).toBeVisible({ timeout: 5000 });
  await expect(frame).toHaveAttribute('src', /\/create\?embed=1/);

  const ceremonyFrame = page.frameLocator('#districtModalBody iframe.districtFrame');
  await expect(ceremonyFrame.locator('#canvas')).toBeVisible();
  await expect(ceremonyFrame.getByTestId('share-btn')).toBeVisible();
  await expect(ceremonyFrame.locator('.topbar')).toBeHidden();
  await expect(ceremonyFrame.locator('footer')).toBeHidden();
  await expect(ceremonyFrame.getByTestId('agent-panel')).toHaveCount(0);
});
