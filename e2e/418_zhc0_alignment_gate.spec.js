const { test, expect } = require('@playwright/test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  randomPort,
  startPrivyTestServer,
  stopServer,
  waitForServerHealth
} = require('./helpers/privy_test_server');

const RESET_TOKEN = 'test-reset';

async function bootstrapAlignmentPassed(page, baseUrl) {
  const resetResp = await page.request.post(`${baseUrl}/__test__/reset`, {
    headers: { 'x-test-reset': RESET_TOKEN }
  });
  expect(resetResp.ok()).toBeTruthy();

  const onboardingResp = await page.request.post(`${baseUrl}/__test__/session/bootstrap-onboarding`, {
    headers: { 'x-test-reset': RESET_TOKEN },
    data: {
      step: 'sigil',
      profile: {
        humanName: 'Robin',
        agentName: 'OpenClaw'
      }
    }
  });
  expect(onboardingResp.ok()).toBeTruthy();

  const sessionResp = await page.request.get(`${baseUrl}/api/session`);
  expect(sessionResp.ok()).toBeTruthy();
  const session = await sessionResp.json();
  const teamCode = String(session?.teamCode || '').trim();
  expect(teamCode).toMatch(/^TEAM-/);

  const connectResp = await page.request.post(`${baseUrl}/api/agent/connect`, {
    data: { teamCode, agentName: 'OpenClaw' }
  });
  expect(connectResp.ok()).toBeTruthy();

  const humanSelectResp = await page.request.post(`${baseUrl}/api/human/select`, {
    data: { elementId: 'wolf' }
  });
  expect(humanSelectResp.ok()).toBeTruthy();

  const agentSelectResp = await page.request.post(`${baseUrl}/api/agent/select`, {
    data: { teamCode, elementId: 'wolf' }
  });
  expect(agentSelectResp.ok()).toBeTruthy();

  const humanOpenResp = await page.request.post(`${baseUrl}/api/human/open/press`, {
    data: {}
  });
  expect(humanOpenResp.ok()).toBeTruthy();

  const agentOpenResp = await page.request.post(`${baseUrl}/api/agent/open/press`, {
    data: { teamCode }
  });
  expect(agentOpenResp.ok()).toBeTruthy();

  const stateResp = await page.request.get(`${baseUrl}/api/state`);
  expect(stateResp.ok()).toBeTruthy();
  const state = await stateResp.json();
  expect(state?.signup?.complete).toBe(true);
  expect(state?.signup?.mode).toBe('agent');
  expect(state?.onboarding?.step).toBe('ceremony');
  expect(state?.houseId).toBeFalsy();
}

async function openTownhallPanel(page) {
  const panelVisible = async () => (
    await page.locator('#townhallRegisterPanel').isVisible().catch(() => false)
    || await page.locator('#townhallSigilFlow').isVisible().catch(() => false)
    || await page.getByTestId('zhc-alignment-handoff').isVisible().catch(() => false)
  );
  if (await panelVisible()) return;

  const backdrop = page.locator('#districtModalBackdrop');
  if (await backdrop.isVisible().catch(() => false)) {
    const closeBtn = page.locator('#districtModalClose');
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
    }
  }

  if (!(await panelVisible())) {
    await page.getByRole('button', { name: 'Open Town Hall' }).click();
  }

  await expect.poll(panelVisible).toBe(true);
}

async function visiblePrimaryActionCount(page) {
  return page.evaluate(() => {
    return [...document.querySelectorAll('[data-zhc-primary-action="true"]')].filter((node) => {
      const style = window.getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    }).length;
  });
}

test('M44.4 alignment gate blocks /create until the co-op sigil pass exists', async ({ page }) => {
  const port = randomPort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const storePath = path.join(
    os.tmpdir(),
    `agent-town-zhc0-alignment-gate-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`
  );
  const launched = startPrivyTestServer({ port, storePath });

  try {
    await waitForServerHealth(baseUrl, launched.readLogs);
    await page.goto(`${baseUrl}/create`);

    await expect.poll(() => new URL(page.url()).pathname, { timeout: 5000 }).toBe('/');
    await expect(page.getByText('Create entropy for house key.')).toHaveCount(0);
  } finally {
    await stopServer(launched.child);
    try {
      fs.unlinkSync(storePath);
    } catch {
      // ignore temp file cleanup errors
    }
  }
});

test('M44.4 alignment handoff keeps House blocked and makes Create crest the only primary move', async ({ page }) => {
  const port = randomPort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const storePath = path.join(
    os.tmpdir(),
    `agent-town-zhc0-alignment-handoff-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`
  );
  const launched = startPrivyTestServer({ port, storePath });

  try {
    await waitForServerHealth(baseUrl, launched.readLogs);
    await bootstrapAlignmentPassed(page, baseUrl);

    await page.goto(`${baseUrl}/app`);
    await openTownhallPanel(page);

    const handoff = page.getByTestId('zhc-alignment-handoff');
    await expect(handoff).toBeVisible();
    await expect(handoff).toHaveAttribute('data-zhc-phase', 'alignment_passed');
    await expect(handoff).toHaveAttribute('data-zhc-overlay-state', 'success_feedback');
    await expect(handoff).toHaveAttribute('data-zhc-progress-step', '4');
    await expect(handoff).toHaveAttribute('data-zhc-progress-total', '9');
    await expect(handoff).toHaveAttribute('data-zhc-next-unlock', 'create');

    const blockerKey = await handoff.getAttribute('data-zhc-blocker-key');
    expect(blockerKey).toBeNull();

    const createLink = page.getByTestId('townhall-create-crest-link');
    await expect(createLink).toBeVisible();
    await expect(createLink).toHaveAttribute('href', '/create');
    await expect(createLink).toHaveAttribute('data-zhc-primary-action', 'true');
    await expect(page.locator('#openReady a[href="/house"]')).toHaveCount(0);
    await expect(page.locator('#houseNavLink')).toBeHidden();
    expect(await visiblePrimaryActionCount(page)).toBe(1);
  } finally {
    await stopServer(launched.child);
    try {
      fs.unlinkSync(storePath);
    } catch {
      // ignore temp file cleanup errors
    }
  }
});
