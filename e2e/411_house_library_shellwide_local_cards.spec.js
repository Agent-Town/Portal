const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  callPageJson,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M42.3: the local Library list renders as cards and preserves imported-state filtering', async ({ page, request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  expect((await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_shellwide_local_cards_01',
    houseId: seededHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  }))?.ok).toBe(true);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const firstLocalResp = await callPageJson(page, '/api/platform/library/items', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-shellwide-local-cards-item-001' },
    data: {
      itemType: 'episodic_note',
      title: 'First Build Story',
      summary: 'A saved House memory about the first successful build.',
      contentText: 'The first build story should stay visible as a local Library card.',
      sourceKind: 'conversation_excerpt',
      sourceRef: 'conv_fixture_alpha#msg_01',
      visibility: 'house_private',
    },
  });
  expect(firstLocalResp.status).toBe(201);

  const secondLocalResp = await callPageJson(page, '/api/platform/library/items', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-shellwide-local-cards-item-002' },
    data: {
      itemType: 'fact_note',
      title: 'Atlas Uses Modal Continuity',
      summary: 'A distilled fact that Atlas should stay modal-first.',
      contentText: 'Atlas should stay modal-first and preserve worker continuity.',
      sourceKind: 'trace',
      sourceRef: 'trace_fixture_alpha',
      visibility: 'team_shared',
    },
  });
  expect(secondLocalResp.status).toBe(201);

  const importResp = await callPageJson(page, '/api/platform/library/imports', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-shellwide-local-cards-import-001' },
    data: {
      registryEntityId: 'reg_registry_catalog',
    },
  });
  expect(importResp.status).toBe(201);

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  await expect(page.getByTestId('house-library-local-card')).toHaveCount(3);
  await expect(page.getByTestId('house-library-local-card').first()).toHaveClass(/house-library-card/);
  await expect(page.getByTestId('house-library-local-card').filter({ hasText: 'First Build Story' })).toHaveCount(1);
  await expect(page.getByTestId('house-library-local-card').filter({ hasText: 'Atlas Uses Modal Continuity' })).toHaveCount(1);

  await page.getByTestId('house-library-facet-filter').selectOption('imported');
  await expect(page.getByTestId('house-library-local-card')).toHaveCount(1);
  await expect(page.getByTestId('house-library-local-card').first()).toContainText('Registry Catalog');
  await expect(page.getByTestId('house-library-local-card').first()).toContainText('Imported');
  await expect(page.getByTestId('house-library-local-card').first()).toContainText('Read only');
  await page.getByTestId('house-library-local-card').first().click();
  await expect(page.locator('#houseLibraryList button.primary')).toHaveCount(1);
});
