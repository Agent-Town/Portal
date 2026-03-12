const { test, expect, request: playwrightRequest } = require('@playwright/test');

const { openHouseLibraryPreviewDetails } = require('./helpers/house_library_public_stacks');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  callPageJson,
  getPlatformStats,
  readWorkerSessionId,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

const APPROVED_PUBLICATION_ID = 'appr_fixture_library_publish_approved_01';
const APPROVED_SATCHEL_RELAY_ID = 'appr_fixture_library_satchel_relay_approved_01';

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M32.4: House Library full Satchel exchange smoke stays in the same shell from source curation through target full-pack import', async ({ page, request }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });

  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  const targetHouse = await seedRecoverableTokenHouse(targetApi);
  await targetApi.dispose();

  const sourceConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_satchel_full_smoke_source_01',
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  const targetConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_satchel_full_smoke_target_01',
    houseId: targetHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  expect(sourceConfig?.ok).toBe(true);
  expect(targetConfig?.ok).toBe(true);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  let attached = await attachHouseToPageSession(page, {
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const alphaResp = await callPageJson(page, '/api/platform/library/items', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'house-library-satchel-full-alpha-001',
    },
    data: {
      itemType: 'library_note',
      title: 'Scout Notes',
      summary: 'First satchel member for the same-shell smoke.',
      contentText: 'Keep the same worker session while Satchel exchange stays in /app.',
      sourceKind: 'user_note',
      sourceRef: 'user_note:house-library-satchel-full-alpha-001',
      visibility: 'house_private',
    },
  });
  expect(alphaResp.status).toBe(201);
  const alphaId = String(alphaResp.json?.data?.item?.libraryItemId || '');

  const betaResp = await callPageJson(page, '/api/platform/library/items', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'house-library-satchel-full-beta-001',
    },
    data: {
      itemType: 'playbook',
      title: 'Launch Checklist',
      summary: 'Second satchel member for the same-shell smoke.',
      contentText: 'Import the full Satchel pack on the target House without leaving /app.',
      sourceKind: 'workspace_file',
      sourceRef: 'workspace/.agent-town/playbooks/launch-checklist-full-smoke.md',
      visibility: 'house_private',
    },
  });
  expect(betaResp.status).toBe(201);
  const betaId = String(betaResp.json?.data?.item?.libraryItemId || '');

  const seedScopeResp = await callPageJson(page, '/api/platform/library/scope', {
    method: 'POST',
    data: {
      scopeSetId: 'scope_satchel_full_smoke_seed',
      title: 'Reading Table',
      itemIds: [alphaId, betaId],
      scopeKind: 'reading_table',
    },
  });
  expect(seedScopeResp.status).toBe(200);

  const initialSessionId = await readWorkerSessionId(page);
  const statsBefore = await getPlatformStats(request);
  expect(statsBefore?.ok).toBe(true);

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  await expect(page.locator('#houseLibraryList button')).toHaveCount(2);

  await page.getByTestId('house-library-satchel-title').fill('Journey Relay Pack');
  await page.getByTestId('house-library-save-satchel').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Saved Satchel Journey Relay Pack.');

  await page.locator('#houseLibraryList button', { hasText: 'Scout Notes' }).click();
  await page.getByTestId('house-library-approval-input').fill(APPROVED_PUBLICATION_ID);
  await page.getByTestId('house-library-publish-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Published Scout Notes to Registry as regpub_');

  await page.locator('#houseLibraryList button', { hasText: 'Launch Checklist' }).click();
  await page.getByTestId('house-library-approval-input').fill(APPROVED_PUBLICATION_ID);
  await page.getByTestId('house-library-publish-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Published Launch Checklist to Registry as regpub_');

  await page.getByRole('button', { name: /Journey Relay Pack/ }).first().click();
  await openHouseLibraryPreviewDetails(page);
  await page.getByTestId('house-library-relay-target-input').fill(targetHouse.houseId);
  await page.getByTestId('house-library-relay-approval-input').fill(APPROVED_SATCHEL_RELAY_ID);
  await expect(page.getByTestId('house-library-satchel-relay-send-button')).toBeEnabled();
  await page.getByTestId('house-library-satchel-relay-send-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText(`Relayed Satchel Journey Relay Pack to ${targetHouse.houseId}.`);
  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);

  attached = await attachHouseToPageSession(page, {
    houseId: targetHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  await expect(page.getByTestId('house-library-incoming-satchels')).toContainText('Journey Relay Pack');
  await expect(page.getByTestId('house-library-incoming-satchels')).toContainText(sourceHouse.houseId);

  const satchelDeskButton = page.locator('#houseLibraryIncomingSatchels button', { hasText: 'Journey Relay Pack' }).first();
  await satchelDeskButton.click();
  await expect(page.getByTestId('house-library-incoming-satchel-preview')).toContainText('Journey Relay Pack');
  await expect(page.getByTestId('house-library-incoming-satchel-preview')).toContainText(sourceHouse.houseId);
  await expect(page.getByTestId('house-library-incoming-satchel-preview')).toContainText('Ready to import as a read-only Satchel pack.');

  await page.getByTestId('house-library-import-satchel-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Imported Satchel Journey Relay Pack from Satchel Desk.');
  await expect(page.getByTestId('house-library-incoming-satchel-preview')).toContainText('Already in your Library as Satchel Journey Relay Pack.');
  await expect(page.getByRole('button', { name: /Satchel · Journey Relay Pack/ }).first()).toBeVisible();
  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);

  const statsAfter = await getPlatformStats(request);
  expect(Number(statsAfter?.stats?.counts?.library_publications || 0)).toBe(Number(statsBefore?.stats?.counts?.library_publications || 0) + 2);
  expect(Number(statsAfter?.stats?.counts?.library_satchel_relays || 0)).toBe(Number(statsBefore?.stats?.counts?.library_satchel_relays || 0) + 1);
  expect(Number(statsAfter?.stats?.counts?.library_satchel_receipts || 0)).toBe(Number(statsBefore?.stats?.counts?.library_satchel_receipts || 0) + 1);
  expect(Number(statsAfter?.stats?.counts?.library_items || 0)).toBe(Number(statsBefore?.stats?.counts?.library_items || 0) + 2);
  expect(Number(statsAfter?.stats?.counts?.scope_sets || 0)).toBe(Number(statsBefore?.stats?.counts?.scope_sets || 0) + 2);
  expect(Number(statsAfter?.stats?.counts?.scope_set_items || 0)).toBe(Number(statsBefore?.stats?.counts?.scope_set_items || 0) + 4);
});
