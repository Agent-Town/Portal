const { test, expect, request: playwrightRequest } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  callPageJson,
  getPlatformInspector,
  getPlatformStats,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

const APPROVED_PUBLICATION_ID = 'appr_fixture_library_publish_approved_01';
const APPROVED_SATCHEL_RELAY_ID = 'appr_fixture_library_satchel_relay_approved_01';

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M32.1: House Library creates one approval-gated Satchel bundle relay from an existing scope set and replays idempotently', async ({ page, request }) => {
  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  let targetHouse = null;
  try {
    targetHouse = await seedRecoverableTokenHouse(targetApi);
  } finally {
    await targetApi.dispose();
  }

  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_satchel_relay_source_01',
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  expect(seededConfig?.ok).toBe(true);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const alphaResp = await callPageJson(page, '/api/platform/library/items', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-satchel-bundle-alpha-001',
    },
    data: {
      itemType: 'library_note',
      title: 'Alpha Brief',
      summary: 'First bundle item.',
      contentText: 'Alpha bundle item content.',
      sourceKind: 'user_note',
      sourceRef: 'user_note:library-satchel-bundle-alpha-001',
      visibility: 'house_private',
    },
  });
  expect(alphaResp.status).toBe(201);
  const alphaId = String(alphaResp.json?.data?.item?.libraryItemId || '');
  expect(alphaId).toMatch(/^lib_/);

  const betaResp = await callPageJson(page, '/api/platform/library/items', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-satchel-bundle-beta-001',
    },
    data: {
      itemType: 'playbook',
      title: 'Beta Checklist',
      summary: 'Second bundle item.',
      contentText: 'Beta bundle item content.',
      sourceKind: 'workspace_file',
      sourceRef: 'workspace/.agent-town/playbooks/beta-checklist.md',
      visibility: 'house_private',
    },
  });
  expect(betaResp.status).toBe(201);
  const betaId = String(betaResp.json?.data?.item?.libraryItemId || '');
  expect(betaId).toMatch(/^lib_/);

  const scopeResp = await callPageJson(page, '/api/platform/library/scope', {
    method: 'POST',
    data: {
      scopeSetId: 'scope_satchel_bundle_create_01',
      title: 'Launch Satchel Alpha',
      itemIds: [alphaId, betaId],
      scopeKind: 'satchel',
    },
  });
  expect(scopeResp.status).toBe(200);
  const scopeSetId = String(scopeResp.json?.data?.activeScopeSetId || '');
  expect(scopeSetId).toBe('scope_satchel_bundle_create_01');

  const alphaPublishResp = await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-satchel-bundle-publish-alpha-001',
    },
    data: {
      libraryItemId: alphaId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  expect(alphaPublishResp.status).toBe(201);
  const alphaPublicationId = String(alphaPublishResp.json?.data?.publication?.libraryPublicationId || '');
  expect(alphaPublicationId).toMatch(/^pub_/);

  const betaPublishResp = await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-satchel-bundle-publish-beta-001',
    },
    data: {
      libraryItemId: betaId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  expect(betaPublishResp.status).toBe(201);
  const betaPublicationId = String(betaPublishResp.json?.data?.publication?.libraryPublicationId || '');
  expect(betaPublicationId).toMatch(/^pub_/);

  const statsBefore = await getPlatformStats(request);
  expect(statsBefore?.ok).toBe(true);

  const blockedResp = await callPageJson(page, '/api/platform/library/satchel-relays', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-satchel-bundle-create-001',
    },
    data: {
      scopeSetId,
      targetHouseId: String(targetHouse?.houseId || ''),
      transportKind: 'pony.relay.registry.v1',
    },
  });
  expect(blockedResp.status).toBe(409);
  expect(String(blockedResp.json?.error?.code || '')).toBe('LIBRARY_SATCHEL_RELAY_APPROVAL_REQUIRED');

  const statsAfterBlocked = await getPlatformStats(request);
  expect(statsAfterBlocked?.stats?.counts).toEqual(statsBefore?.stats?.counts);

  const relayResp = await callPageJson(page, '/api/platform/library/satchel-relays', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-satchel-bundle-create-001',
    },
    data: {
      scopeSetId,
      targetHouseId: String(targetHouse?.houseId || ''),
      transportKind: 'pony.relay.registry.v1',
      approvalId: APPROVED_SATCHEL_RELAY_ID,
    },
  });
  expect(relayResp.status).toBe(201);
  const relay = relayResp.json?.data?.relay || null;
  expect(relay).toMatchObject({
    scopeSetId,
    targetHouseId: targetHouse.houseId,
    relayState: 'queued',
  });
  const librarySatchelRelayId = String(relay?.librarySatchelRelayId || '');
  expect(librarySatchelRelayId).toMatch(/^srelay_/);

  const manifest = relayResp.json?.data?.bundleManifest || null;
  expect(manifest).toMatchObject({
    scopeSetId,
    title: 'Launch Satchel Alpha',
    scopeKind: 'satchel',
    targetHouseId: targetHouse.houseId,
    transportKind: 'pony.relay.registry.v1',
    memberCount: 2,
    orderedItemIds: [alphaId, betaId],
    orderedPublicationIds: [alphaPublicationId, betaPublicationId],
  });
  expect(String(manifest?.bundleHash || '')).toMatch(/^sha256:/);
  expect(Array.isArray(manifest?.members)).toBe(true);
  expect(manifest.members).toHaveLength(2);
  expect(manifest.members[0]).toMatchObject({
    position: 0,
    libraryItemId: alphaId,
    libraryPublicationId: alphaPublicationId,
    title: 'Alpha Brief',
  });
  expect(manifest.members[1]).toMatchObject({
    position: 1,
    libraryItemId: betaId,
    libraryPublicationId: betaPublicationId,
    title: 'Beta Checklist',
  });

  const statsAfterCreate = await getPlatformStats(request);
  expect(Number(statsAfterCreate?.stats?.counts?.library_satchel_relays || 0)).toBe(Number(statsBefore?.stats?.counts?.library_satchel_relays || 0) + 1);
  expect(Number(statsAfterCreate?.stats?.counts?.library_satchel_receipts || 0)).toBe(Number(statsBefore?.stats?.counts?.library_satchel_receipts || 0));

  const replayResp = await callPageJson(page, '/api/platform/library/satchel-relays', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-satchel-bundle-create-001',
    },
    data: {
      scopeSetId,
      targetHouseId: String(targetHouse?.houseId || ''),
      transportKind: 'pony.relay.registry.v1',
    },
  });
  expect(replayResp.status).toBe(200);
  expect(String(replayResp.json?.data?.relay?.librarySatchelRelayId || '')).toBe(librarySatchelRelayId);

  const statsAfterReplay = await getPlatformStats(request);
  expect(statsAfterReplay?.stats?.counts).toEqual(statsAfterCreate?.stats?.counts);

  const exchangeInspector = await getPlatformInspector(request, 'satchel-exchange');
  expect(exchangeInspector.status).toBe(200);
  const inspectorRelay = Array.isArray(exchangeInspector.json?.data?.relays)
    ? exchangeInspector.json.data.relays.find((entry) => String(entry?.librarySatchelRelayId || '') === librarySatchelRelayId)
    : null;
  expect(inspectorRelay).toMatchObject({
    librarySatchelRelayId,
    scopeSetId,
    targetHouseId: targetHouse.houseId,
    relayState: 'queued',
  });
  expect(inspectorRelay?.bundleManifest).toMatchObject({
    title: 'Launch Satchel Alpha',
    orderedItemIds: [alphaId, betaId],
    orderedPublicationIds: [alphaPublicationId, betaPublicationId],
  });
});
