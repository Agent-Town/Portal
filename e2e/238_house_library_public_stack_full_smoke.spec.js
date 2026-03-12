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
const APPROVED_PUBLIC_STACK_ID = 'appr_fixture_library_public_stack_approved_01';

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M33.4: House Library full Public Stack smoke stays in the same shell from source Satchel publication through target import', async ({ page, request }) => {
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
  });

  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  const targetHouse = await seedRecoverableTokenHouse(targetApi);
  await targetApi.dispose();

  const sourceConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_full_smoke_source_01',
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  const targetConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_full_smoke_target_01',
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
      'Idempotency-Key': 'house-library-public-stack-full-alpha-001',
    },
    data: {
      itemType: 'library_note',
      title: 'Signal Notes',
      summary: 'First public stack member for same-shell smoke.',
      contentText: 'Signal Notes keeps the same worker session while the bundle is published and imported.',
      sourceKind: 'user_note',
      sourceRef: 'user_note:house-library-public-stack-full-alpha-001',
      visibility: 'house_private',
    },
  });
  expect(alphaResp.status).toBe(201);
  const alphaId = String(alphaResp.json?.data?.item?.libraryItemId || '');

  const betaResp = await callPageJson(page, '/api/platform/library/items', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'house-library-public-stack-full-beta-001',
    },
    data: {
      itemType: 'playbook',
      title: 'Skyline Checklist',
      summary: 'Second public stack member for same-shell smoke.',
      contentText: 'Skyline Checklist should arrive as the second imported artifact.',
      sourceKind: 'workspace_file',
      sourceRef: 'workspace/.agent-town/playbooks/public-stack-full-smoke.md',
      visibility: 'house_private',
    },
  });
  expect(betaResp.status).toBe(201);
  const betaId = String(betaResp.json?.data?.item?.libraryItemId || '');

  const scopeResp = await callPageJson(page, '/api/platform/library/scope', {
    method: 'POST',
    data: {
      scopeSetId: 'scope_public_stack_full_smoke_01',
      title: 'Journey Public Pack',
      itemIds: [alphaId, betaId],
      scopeKind: 'satchel',
    },
  });
  expect(scopeResp.status).toBe(200);

  const alphaPublishResp = await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'house-library-public-stack-full-publish-alpha-001',
    },
    data: {
      libraryItemId: alphaId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  expect(alphaPublishResp.status).toBe(201);

  const betaPublishResp = await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'house-library-public-stack-full-publish-beta-001',
    },
    data: {
      libraryItemId: betaId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  expect(betaPublishResp.status).toBe(201);

  const initialSessionId = await readWorkerSessionId(page);
  const statsBefore = await getPlatformStats(request);
  expect(statsBefore?.ok).toBe(true);

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  await page.getByRole('button', { name: /Journey Public Pack/ }).first().click();
  await page.getByTestId('house-library-public-stack-approval-input').fill(APPROVED_PUBLIC_STACK_ID);
  await expect(page.getByTestId('house-library-public-stack-publish-button')).toBeEnabled();
  await page.getByTestId('house-library-public-stack-publish-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Published Satchel Journey Public Pack to Public Stacks.');
  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);

  attached = await attachHouseToPageSession(page, {
    houseId: targetHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  await page.getByTestId('house-library-public-stacks-query').fill('Journey Public Pack');
  await page.getByTestId('house-library-public-stacks-family').selectOption('house_library_stacks');
  await page.getByTestId('house-library-public-stacks-search').click();
  await expect(page.locator('#houseLibraryPublicStacksResults button')).toHaveCount(1);
  await page.locator('#houseLibraryPublicStacksResults button', { hasText: 'Journey Public Pack' }).click();
  await expect(page.getByTestId('house-library-registry-preview')).toContainText('Journey Public Pack');
  await expect(page.getByTestId('house-library-registry-preview')).toContainText(sourceHouse.houseId);
  await expect(page.getByTestId('house-library-registry-preview')).toContainText('2 items');
  await expect(page.getByTestId('house-library-guided-import-button')).toBeEnabled();

  await page.getByTestId('house-library-guided-import-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Imported Public Stack Journey Public Pack.');
  await expect(page.getByTestId('house-library-registry-preview')).toContainText('Already in your Library as Satchel Journey Public Pack.');
  await expect(page.getByRole('button', { name: /Satchel · Journey Public Pack/ }).first()).toBeVisible();
  expect(await page.evaluate(() => window.location.pathname)).toBe('/app');
  expect(await readWorkerSessionId(page)).toBe(initialSessionId);

  const statsAfter = await getPlatformStats(request);
  expect(Number(statsAfter?.stats?.counts?.library_publications || 0)).toBe(Number(statsBefore?.stats?.counts?.library_publications || 0));
  expect(Number(statsAfter?.stats?.counts?.library_public_stacks || 0)).toBe(Number(statsBefore?.stats?.counts?.library_public_stacks || 0) + 1);
  expect(Number(statsAfter?.stats?.counts?.library_public_stack_members || 0)).toBe(Number(statsBefore?.stats?.counts?.library_public_stack_members || 0) + 2);
  expect(Number(statsAfter?.stats?.counts?.library_items || 0)).toBe(Number(statsBefore?.stats?.counts?.library_items || 0) + 2);
  expect(Number(statsAfter?.stats?.counts?.library_links || 0)).toBe(Number(statsBefore?.stats?.counts?.library_links || 0) + 4);
  expect(Number(statsAfter?.stats?.counts?.scope_sets || 0)).toBe(Number(statsBefore?.stats?.counts?.scope_sets || 0) + 1);
  expect(Number(statsAfter?.stats?.counts?.scope_set_items || 0)).toBe(Number(statsBefore?.stats?.counts?.scope_set_items || 0) + 2);
});
