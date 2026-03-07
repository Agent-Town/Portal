const { test, expect } = require('@playwright/test');
const {
  bootstrapExperienceIntentHarness,
  invokeExperienceTool
} = require('./helpers/experience_intents');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('AC-59: agent_town_ui_atlas_search applies search/filter state and reflects deterministic Atlas results', async ({ page }) => {
  const visit = await bootstrapExperienceIntentHarness(page);
  expect(visit?.ok).toBe(true);

  const result = await invokeExperienceTool(page, 'agent_town_ui_atlas_search', {
    q: 'sentinel',
    family: 'ethereum',
    searchType: 'keyword'
  });

  // AC-59.1: Atlas modal is visible/focused.
  await expect(page.locator('#districtModalBackdrop:not(.is-hidden)')).toHaveCount(1, { timeout: 3000 });
  await expect(page.locator('#districtModalTitle')).toHaveText('Atlas Depot');
  const atlasFrame = page.frameLocator('#districtModalBody iframe.districtFrame');

  // AC-59.2: Atlas controls reflect requested state.
  await expect(atlasFrame.getByTestId('atlas-search-input')).toHaveValue('sentinel');
  await expect(atlasFrame.getByTestId('atlas-filter-chain-family')).toHaveValue('ethereum');
  await expect(atlasFrame.getByTestId('atlas-search-type')).toHaveValue('keyword');

  // AC-59.3: Deterministic filtered list behavior in fixture data.
  await expect(atlasFrame.getByTestId('district-open-ethereum')).toBeVisible();
  await expect(atlasFrame.getByTestId('district-open-monad')).toHaveCount(0);

  // AC-59.4: Response snapshot fields.
  expect(result?.stateSnapshot?.atlas?.query).toBe('sentinel');
  expect(result?.stateSnapshot?.atlas?.family).toBe('ethereum');
});
