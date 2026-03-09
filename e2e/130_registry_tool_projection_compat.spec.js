const { test, expect } = require('@playwright/test');
const {
  bootstrapExperienceIntentHarness,
  invokeExperienceTool,
  readPathname,
} = require('./helpers/experience_intents');
const { resetPortalWebState } = require('./helpers/portal_web');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('WEB-106: registry intent stays modal-first and does not mutate Atlas snapshot state', async ({ page }) => {
  const visit = await bootstrapExperienceIntentHarness(page);
  expect(visit?.ok).toBe(true);

  const atlas = await invokeExperienceTool(page, 'agent_town_ui_atlas_search', {
    q: 'github',
    family: 'ethereum',
    searchType: 'keyword'
  });
  expect(atlas?.stateSnapshot?.atlas?.query).toBe('github');
  expect(atlas?.stateSnapshot?.atlas?.family).toBe('ethereum');

  const registry = await invokeExperienceTool(page, 'agent_town_ui_registry_search', {
    q: 'registry',
    family: 'registry'
  });
  expect(registry?.ok).toBe(true);
  expect(registry?.stateSnapshot?.registry?.query).toBe('registry');
  expect(registry?.stateSnapshot?.registry?.family).toBe('registry');
  expect(registry?.stateSnapshot?.atlas?.query).toBe('github');
  expect(registry?.stateSnapshot?.atlas?.family).toBe('ethereum');

  await expect(page.locator('#districtModalBackdrop:not(.is-hidden)')).toHaveCount(1, { timeout: 3000 });
  await expect(page.locator('#districtModalTitle')).toHaveText('Registry');
  const registryFrame = page.frameLocator('#districtModalBody iframe.districtFrame');
  await expect(registryFrame.locator('h1')).toHaveText('Registry');
  await expect(registryFrame.locator('#registryStatus')).toContainText('result', { timeout: 5000 });

  expect(await readPathname(page)).toBe('/app');
  expect(await page.evaluate(() => !!window.__openclawLiteTest)).toBe(true);
});
