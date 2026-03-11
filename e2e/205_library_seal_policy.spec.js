const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  getPlatformCounts,
  getPlatformFixture,
  seedPlatformConfigVersion,
  ingestPlatformPokerOperatorTrace,
  seedPlatformSealedContext,
} = require('./helpers/unified_platform');

const APPROVED_PUBLICATION_ID = 'appr_fixture_library_publish_approved_01';

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M29.10: sealed Library items redact reads, block publication deterministically, and leave unsealed items publishable', async ({ page, request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_library_seal_policy_01',
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
    idempotencyKey: 'library-seal-ingest-001',
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
  const sealedContextId = String(seededSeal.json?.sealedContext?.sealedContextId || '');
  expect(sealedContextId).toMatch(/^seal_/);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const countsBeforePromotion = await getPlatformCounts(request);

  const promoteResp = await page.request.post('/api/platform/library/promotions', {
    headers: {
      'Idempotency-Key': 'library-seal-promotion-001',
    },
    data: {
      sourceKind: 'trace',
      sourceRef: traceId,
    },
    failOnStatusCode: false,
  });
  expect(promoteResp.status()).toBe(201);
  const promoteBody = await promoteResp.json();
  const sealedLibraryItemId = String(promoteBody?.data?.item?.libraryItemId || '');
  expect(sealedLibraryItemId).toMatch(/^lib_/);
  expect(promoteBody?.data?.item).toMatchObject({
    sourceKind: 'trace',
    sourceRef: traceId,
    sealPolicy: 'blocked_publication',
  });
  expect(String(promoteBody?.data?.item?.metadata?.sealedContextId || '')).toBe(sealedContextId);

  const countsAfterPromotion = await getPlatformCounts(request);
  expect(Number(countsAfterPromotion.counts?.library_items || 0)).toBe(Number(countsBeforePromotion.counts?.library_items || 0) + 1);

  const libraryRead = await page.request.get('/api/platform/library', {
    failOnStatusCode: false,
  });
  expect(libraryRead.status()).toBe(200);
  const libraryBody = await libraryRead.json();
  const sealedItem = Array.isArray(libraryBody?.data?.items)
    ? libraryBody.data.items.find((item) => String(item?.libraryItemId || '') === sealedLibraryItemId)
    : null;
  expect(sealedItem).toMatchObject({
    libraryItemId: sealedLibraryItemId,
    sealPolicy: 'blocked_publication',
    redacted: true,
    summary: 'Sealed library item. Release required for full summary.',
    contentText: '[redacted by seal policy]',
  });
  expect(sealedItem?.contentRef ?? null).toBeNull();

  const blockedCountsBefore = await getPlatformCounts(request);
  const blockedPublish = await page.request.post('/api/platform/library/publications', {
    headers: {
      'Idempotency-Key': 'library-seal-blocked-publish-001',
    },
    data: {
      libraryItemId: sealedLibraryItemId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
    failOnStatusCode: false,
  });
  expect(blockedPublish.status()).toBe(409);
  const blockedBody = await blockedPublish.json();
  expect(String(blockedBody?.error?.code || '')).toBe('LIBRARY_SEAL_BLOCKED');
  expect(String(blockedBody?.error?.details?.sealedContextId || '')).toBe(sealedContextId);

  const blockedCountsAfter = await getPlatformCounts(request);
  expect(Number(blockedCountsAfter.counts?.library_publications || 0)).toBe(Number(blockedCountsBefore.counts?.library_publications || 0));
  expect(Number(blockedCountsAfter.counts?.sealed_context_violations || 0)).toBe(Number(blockedCountsBefore.counts?.sealed_context_violations || 0) + 1);

  const blockedReplay = await page.request.post('/api/platform/library/publications', {
    headers: {
      'Idempotency-Key': 'library-seal-blocked-publish-001',
    },
    data: {
      libraryItemId: sealedLibraryItemId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
    failOnStatusCode: false,
  });
  expect(blockedReplay.status()).toBe(409);
  const blockedReplayBody = await blockedReplay.json();
  expect(String(blockedReplayBody?.error?.code || '')).toBe('LIBRARY_SEAL_BLOCKED');

  const blockedCountsReplay = await getPlatformCounts(request);
  expect(blockedCountsReplay.counts).toEqual(blockedCountsAfter.counts);

  const localItemResp = await page.request.post('/api/platform/library/items', {
    headers: {
      'Idempotency-Key': 'library-seal-safe-item-001',
    },
    data: {
      itemType: 'playbook',
      title: 'Open Publication Rule',
      summary: 'This item is not sealed and can publish normally.',
      contentText: 'Public-safe playbook.',
      sourceKind: 'workspace_file',
      sourceRef: 'workspace/.agent-town/playbooks/open-publication.md',
    },
    failOnStatusCode: false,
  });
  expect(localItemResp.status()).toBe(201);
  const localItemBody = await localItemResp.json();
  const localItemId = String(localItemBody?.data?.item?.libraryItemId || '');
  expect(localItemId).toMatch(/^lib_/);

  const allowedPublish = await page.request.post('/api/platform/library/publications', {
    headers: {
      'Idempotency-Key': 'library-seal-safe-publish-001',
    },
    data: {
      libraryItemId: localItemId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
    failOnStatusCode: false,
  });
  expect(allowedPublish.status()).toBe(201);
  const allowedBody = await allowedPublish.json();
  expect(allowedBody?.data?.publication).toMatchObject({
    libraryItemId: localItemId,
    visibility: 'registry_public',
  });

  const finalCounts = await getPlatformCounts(request);
  expect(Number(finalCounts.counts?.library_publications || 0)).toBe(Number(blockedCountsAfter.counts?.library_publications || 0) + 1);
  expect(Number(finalCounts.counts?.sealed_context_violations || 0)).toBe(Number(blockedCountsAfter.counts?.sealed_context_violations || 0));
});
