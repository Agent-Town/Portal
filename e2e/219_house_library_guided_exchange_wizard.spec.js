const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { openHouseLibraryPreviewDetails } = require('./helpers/house_library_public_stacks');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  getPlatformFixture,
  getPlatformStats,
  ingestPlatformPokerOperatorTrace,
  seedPlatformConfigVersion,
  seedPlatformSealedContext,
} = require('./helpers/unified_platform');

const APPROVED_PUBLICATION_ID = 'appr_fixture_library_publish_approved_01';

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M30.7: House Library guided exchange keeps trust, approval, sealing, and replay deterministic', async ({ page, request }) => {
  const exchangeFixture = await getPlatformFixture(request, 'library_guided_exchange_seed');
  expect(exchangeFixture?.ok).toBe(true);
  const registryId = String(exchangeFixture?.fixture?.registryId || 'reg_atlas_skill_01');

  const seededHouse = await seedRecoverableTokenHouse(request);
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_guided_exchange_01',
    houseId: seededHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  expect(seededConfig?.ok).toBe(true);

  const pokerFixture = await getPlatformFixture(request, 'poker_operator_seed_jsonl');
  expect(pokerFixture?.ok).toBe(true);
  const ingest = await ingestPlatformPokerOperatorTrace(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    teamId: 'team_main',
    idempotencyKey: 'guided-exchange-seal-ingest-001',
    records: Array.isArray(pokerFixture?.fixture?.records) ? pokerFixture.fixture.records : [],
  });
  expect(ingest.status).toBe(201);
  const traceId = String(ingest.json?.data?.traceId || '');
  const runId = String(ingest.json?.data?.runId || '');
  expect(traceId).toMatch(/^trace_/);
  expect(runId).toMatch(/^run_/);

  const seededSeal = await seedPlatformSealedContext(request, {
    houseId: seededHouse.houseId,
    traceId,
    runId,
    releasePolicy: 'manual',
    status: 'active',
  });
  expect(seededSeal.status).toBe(200);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const localItemResp = await page.request.post('/api/platform/library/items', {
    headers: {
      'Idempotency-Key': 'guided-exchange-local-item-001',
    },
    data: {
      itemType: 'playbook',
      title: 'Guide Publish Candidate',
      summary: 'Private Library item ready for explicit public release.',
      contentText: 'Keep this private until the human approves publishing.',
      sourceKind: 'workspace_file',
      sourceRef: 'workspace/.agent-town/playbooks/guide-publish-candidate.md',
    },
    failOnStatusCode: false,
  });
  expect(localItemResp.status()).toBe(201);
  const localItemId = String((await localItemResp.json())?.data?.item?.libraryItemId || '');
  expect(localItemId).toMatch(/^lib_/);

  const promoteResp = await page.request.post('/api/platform/library/promotions', {
    headers: {
      'Idempotency-Key': 'guided-exchange-sealed-promotion-001',
    },
    data: {
      sourceKind: 'trace',
      sourceRef: traceId,
    },
    failOnStatusCode: false,
  });
  expect(promoteResp.status()).toBe(201);
  const sealedLibraryItemId = String((await promoteResp.json())?.data?.item?.libraryItemId || '');
  expect(sealedLibraryItemId).toMatch(/^lib_/);

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();

  await page.getByTestId('house-library-public-stacks-query').fill('atlas');
  await page.getByTestId('house-library-storefront-chip-skills').click();
  await page.getByTestId('house-library-public-stacks-search').click();
  await page.locator(`#houseLibraryPublicStacksResults button[data-registry-id="${registryId}"]`).click();
  await openHouseLibraryPreviewDetails(page);

  await expect(page.getByTestId('house-library-registry-preview')).toContainText(registryId);
  await expect(page.getByTestId('house-library-registry-preview')).toContainText('Public');
  await expect(page.getByTestId('house-library-exchange-summary')).toContainText('Public');
  await expect(page.getByTestId('house-library-exchange-summary')).toContainText('Read only after import');

  const statsBeforeImport = await getPlatformStats(request);
  await page.getByTestId('house-library-guided-import-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Imported');

  const statsAfterImport = await getPlatformStats(request);
  expect(Number(statsAfterImport?.stats?.counts?.library_items || 0)).toBe(Number(statsBeforeImport?.stats?.counts?.library_items || 0) + 1);

  await expect(page.getByTestId('house-library-exchange-summary')).toContainText('Already in your Library');
  await page.getByTestId('house-library-guided-import-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Imported');

  const libraryRead = await page.request.get('/api/platform/library', {
    failOnStatusCode: false,
  });
  expect(libraryRead.status()).toBe(200);
  const libraryBody = await libraryRead.json();
  const importedItems = Array.isArray(libraryBody?.data?.items)
    ? libraryBody.data.items.filter((item) => String(item?.registryId || '') === registryId)
    : [];
  expect(importedItems).toHaveLength(1);

  const statsAfterImportReplay = await getPlatformStats(request);
  expect(Number(statsAfterImportReplay?.stats?.counts?.library_items || 0)).toBe(Number(statsAfterImport?.stats?.counts?.library_items || 0));

  await page.locator(`#houseLibraryList button[data-library-item-id="${localItemId}"]`).click();
  await expect(page.getByTestId('house-library-exchange-summary')).toContainText('Private');
  await expect(page.getByTestId('house-library-exchange-summary')).toContainText('Approval is required before publishing.');

  const statsBeforeBlockedPublish = await getPlatformStats(request);
  await openHouseLibraryPreviewDetails(page);
  await page.getByTestId('house-library-guided-publish-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('LIBRARY_PUBLISH_APPROVAL_REQUIRED');
  const statsAfterBlockedPublish = await getPlatformStats(request);
  expect(Number(statsAfterBlockedPublish?.stats?.counts?.library_publications || 0)).toBe(Number(statsBeforeBlockedPublish?.stats?.counts?.library_publications || 0));

  await openHouseLibraryPreviewDetails(page);
  await page.getByTestId('house-library-guided-approval-input').fill(APPROVED_PUBLICATION_ID);
  await page.getByTestId('house-library-guided-publish-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Published Guide Publish Candidate to Registry as regpub_');

  const statsAfterPublish = await getPlatformStats(request);
  expect(Number(statsAfterPublish?.stats?.counts?.library_publications || 0)).toBe(Number(statsBeforeBlockedPublish?.stats?.counts?.library_publications || 0) + 1);

  await openHouseLibraryPreviewDetails(page);
  await page.getByTestId('house-library-guided-approval-input').fill(APPROVED_PUBLICATION_ID);
  await page.getByTestId('house-library-guided-publish-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('Published Guide Publish Candidate to Registry as regpub_');
  const statsAfterPublishReplay = await getPlatformStats(request);
  expect(Number(statsAfterPublishReplay?.stats?.counts?.library_publications || 0)).toBe(Number(statsAfterPublish?.stats?.counts?.library_publications || 0));

  await page.locator(`#houseLibraryList button[data-library-item-id="${sealedLibraryItemId}"]`).click();
  await expect(page.getByTestId('house-library-exchange-summary')).toContainText('seal is active');
  await openHouseLibraryPreviewDetails(page);
  await page.getByTestId('house-library-guided-approval-input').fill(APPROVED_PUBLICATION_ID);
  await page.getByTestId('house-library-guided-publish-button').click();
  await expect(page.getByTestId('house-library-action-status')).toContainText('LIBRARY_SEAL_BLOCKED');
  const statsAfterSealedPublish = await getPlatformStats(request);
  expect(Number(statsAfterSealedPublish?.stats?.counts?.library_publications || 0)).toBe(Number(statsAfterPublishReplay?.stats?.counts?.library_publications || 0));
});
