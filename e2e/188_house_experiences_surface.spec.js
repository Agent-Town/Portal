const { test, expect } = require('@playwright/test');

const { invokeExperienceTool } = require('./helpers/experience_intents');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const { getPlatformFixture } = require('./helpers/unified_platform');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

async function attachHouseToPageSession(page, houseId) {
  return await page.evaluate(async ({ nextHouseId, testResetToken }) => {
    const response = await fetch('/__test__/session/attach-house', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        'x-test-reset': testResetToken,
      },
      body: JSON.stringify({ houseId: nextHouseId }),
    });
    return {
      status: response.status,
      json: await response.json(),
    };
  }, {
    nextHouseId: houseId,
    testResetToken: resetToken,
  });
}

async function readRuntimeWorkerSessionId(page) {
  await page.waitForFunction(async () => {
    try {
      if (!window.__openclawLiteTest || typeof window.__openclawLiteTest.runtimeSessionContext !== 'function') {
        return false;
      }
      const snapshot = await window.__openclawLiteTest.runtimeSessionContext({
        runtimeContext: {
          origin: window.location.origin,
          teamCode: '',
          houseId: '',
        },
        runtimeState: {},
      });
      const data = snapshot?.data || snapshot || null;
      return typeof data?.sessionId === 'string' && data.sessionId.trim().length > 0;
    } catch {
      return false;
    }
  }, null, { timeout: 10000 });

  return await page.evaluate(async () => {
    const snapshot = await window.__openclawLiteTest.runtimeSessionContext({
      runtimeContext: {
        origin: window.location.origin,
        teamCode: '',
        houseId: '',
      },
      runtimeState: {},
    });
    const data = snapshot?.data || snapshot || null;
    return String(data?.sessionId || '').trim();
  });
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.5: House exposes a minimal Experiences surface with stable order and modal continuity', async ({ page, request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const fixture = await getPlatformFixture(request, 'house_experiences_seed');
  expect(fixture?.ok).toBe(true);
  const seededExperiences = Array.isArray(fixture?.fixture?.experiences) ? fixture.fixture.experiences : [];
  expect(seededExperiences.map((entry) => String(entry?.experienceId || ''))).toEqual([
    'web.agent',
    'poker.season',
  ]);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, seededHouse.houseId);
  expect(attached.status).toBe(200);

  await expect(page.locator('#districtModalBackdrop:not(.is-hidden)')).toHaveCount(1);
  await expect(page.getByTestId('house-console-panel')).toBeVisible();
  const initialSessionId = await readRuntimeWorkerSessionId(page);

  const experiencesResponse = await page.request.get('/api/platform/experiences');
  expect(experiencesResponse.ok()).toBe(true);
  const experiencesBody = await experiencesResponse.json();
  expect(Array.isArray(experiencesBody?.data?.items)).toBe(true);
  expect(experiencesBody.data.items.map((item) => String(item?.experienceId || ''))).toEqual(
    seededExperiences.map((entry) => String(entry?.experienceId || ''))
  );

  await page.getByTestId('house-open-experiences').click();
  await expect(page.getByTestId('house-experiences-panel')).toBeVisible();
  await expect(page.locator('#houseExperiencesList button')).toHaveCount(seededExperiences.length);
  await expect(page.locator('#houseExperiencesList button').nth(0)).toContainText('Web Ops');
  await expect(page.locator('#houseExperiencesList button').nth(1)).toContainText('Poker');

  await page.locator('#houseExperiencesList button[data-experience-id="web.agent"]').click();
  await expect(page.getByTestId('house-experiences-detail')).toContainText('web.agent');
  await expect(page.getByTestId('house-experiences-detail')).toContainText('Web Ops');
  await expect(page.locator('#houseExperienceActions button[data-action-id="open_primary"]')).toContainText('Open Web Ops');
  await expect(page.locator('#houseExperienceActions button[data-action-id="open_registry"]')).toHaveAttribute('data-entry-path', '/app?district=registry');

  await page.locator('#houseExperienceActions button[data-action-id="open_primary"]').click();
  await expect(page.locator('#districtModalTitle')).toHaveText('Atlas Depot');
  const afterWebOpenSessionId = await readRuntimeWorkerSessionId(page);
  expect(afterWebOpenSessionId).toBe(initialSessionId);

  const reopenHouse = await invokeExperienceTool(page, 'agent_town_ui_open_modal', {
    modal: 'house',
    params: {},
  });
  expect(reopenHouse?.ok).toBe(true);
  expect(reopenHouse?.applied).toBe(true);
  await expect(page.getByTestId('house-console-panel')).toBeVisible();

  await page.getByTestId('house-open-experiences').click();
  await page.locator('#houseExperiencesList button[data-experience-id="poker.season"]').click();
  await expect(page.getByTestId('house-experiences-detail')).toContainText('poker.season');
  await expect(page.getByTestId('house-experiences-detail')).toContainText('Poker');
  await expect(page.locator('#houseExperienceActions button[data-action-id="open_primary"]')).toContainText('Open Poker');
  await page.locator('#houseExperienceActions button[data-action-id="open_primary"]').click();
  await expect(page.locator('#districtModalTitle')).toContainText('Poker');
  const afterPokerOpenSessionId = await readRuntimeWorkerSessionId(page);
  expect(afterPokerOpenSessionId).toBe(initialSessionId);
});
