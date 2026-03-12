const { test, expect, request: playwrightRequest } = require('@playwright/test');

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
const APPROVED_RELAY_ID = 'appr_fixture_library_peer_relay_approved_01';

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M31.4: House Library full relay smoke stays in the same shell from source publish through target import', async ({ page, request }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });

  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  const targetHouse = await seedRecoverableTokenHouse(targetApi);
  await targetApi.dispose();

  const sourceConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_peer_full_smoke_source_01',
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  const targetConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_peer_full_smoke_target_01',
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

  const createItemResp = await callPageJson(page, '/api/platform/library/items', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'house-library-peer-full-smoke-item-001',
    },
    data: {
      itemType: 'library_note',
      title: 'Co-op Relay Contract',
      summary: 'A note that will be published, relayed, and imported through the House Library shell.',
      contentText: 'Keep the registry id, content hash, and provenance visible after relay import.',
      sourceKind: 'user_note',
      sourceRef: 'workspace/.agent-town/playbooks/co-op-relay-contract.md',
      visibility: 'house_private',
    },
  });
  expect(createItemResp.status).toBe(201);

  const initialSessionId = await readWorkerSessionId(page);
  const statsBefore = await getPlatformStats(request);
  expect(statsBefore?.ok).toBe(true);

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  await expect(page.locator('#houseLibraryList button')).toHaveCount(1);
  await expect(page.locator('#houseLibraryList button').first()).toContainText('Co-op Relay Contract');

  await page.getByTestId('house-library-approval-input').fill(APPROVED_PUBLICATION_ID);
  await page.getByTestId('house-library-publish-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Published Co-op Relay Contract to Registry as regpub_');

  await page.getByTestId('house-library-relay-target-input').fill(targetHouse.houseId);
  await page.getByTestId('house-library-relay-approval-input').fill(APPROVED_RELAY_ID);
  await expect(page.getByTestId('house-library-relay-send-button')).toBeEnabled();
  await page.getByTestId('house-library-relay-send-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText(`Relayed Co-op Relay Contract to ${targetHouse.houseId}.`);
  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);

  attached = await attachHouseToPageSession(page, {
    houseId: targetHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  await expect(page.getByTestId('house-library-incoming-relays')).toContainText('Co-op Relay Contract');
  await expect(page.getByTestId('house-library-incoming-relays')).toContainText(sourceHouse.houseId);
  await expect(page.getByTestId('house-library-import-relay-button')).toBeEnabled();

  await page.getByRole('button', { name: /Co-op Relay Contract/ }).click();
  await expect(page.getByTestId('house-library-incoming-relay-preview')).toContainText('Co-op Relay Contract');
  await expect(page.getByTestId('house-library-incoming-relay-preview')).toContainText(sourceHouse.houseId);
  await expect(page.getByTestId('house-library-incoming-relay-preview')).toContainText('Ready to import as a read-only Library artifact.');

  await page.getByTestId('house-library-import-relay-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Imported Co-op Relay Contract from Relay Desk.');
  await expect(page.getByTestId('house-library-detail')).toContainText('Imported from Relay Desk');
  await expect(page.getByTestId('house-library-detail')).toContainText('Read only');
  await expect(page.getByTestId('house-library-detail')).toContainText('regpub_');
  await expect(page.getByTestId('house-library-incoming-relay-preview')).toContainText('Already in your Library as Co-op Relay Contract.');
  await expect(page.getByTestId('house-library-import-relay-button')).toBeDisabled();
  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);

  const statsAfter = await getPlatformStats(request);
  expect(Number(statsAfter?.stats?.counts?.library_publications || 0)).toBe(Number(statsBefore?.stats?.counts?.library_publications || 0) + 1);
  expect(Number(statsAfter?.stats?.counts?.library_peer_relays || 0)).toBe(Number(statsBefore?.stats?.counts?.library_peer_relays || 0) + 1);
  expect(Number(statsAfter?.stats?.counts?.library_peer_receipts || 0)).toBe(Number(statsBefore?.stats?.counts?.library_peer_receipts || 0) + 1);
  expect(Number(statsAfter?.stats?.counts?.library_items || 0)).toBe(Number(statsBefore?.stats?.counts?.library_items || 0) + 1);
});
