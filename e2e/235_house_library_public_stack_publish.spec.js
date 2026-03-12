const { test, expect } = require('@playwright/test');

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
const APPROVED_PUBLIC_STACK_ID = 'appr_fixture_library_public_stack_approved_01';

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M33.1: House Library publishes one approval-gated Public Stack from an existing Satchel and replays idempotently', async ({ page, request }) => {
  const sourceHouse = await seedRecoverableTokenHouse(request);
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_publish_01',
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
      'Idempotency-Key': 'library-public-stack-alpha-001',
    },
    data: {
      itemType: 'library_note',
      title: 'Scout Notes',
      summary: 'First member for public stack publish.',
      contentText: 'Scout Notes is the first public stack member.',
      sourceKind: 'user_note',
      sourceRef: 'user_note:library-public-stack-alpha-001',
      visibility: 'house_private',
    },
  });
  expect(alphaResp.status).toBe(201);
  const alphaId = String(alphaResp.json?.data?.item?.libraryItemId || '');

  const betaResp = await callPageJson(page, '/api/platform/library/items', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-public-stack-beta-001',
    },
    data: {
      itemType: 'playbook',
      title: 'Launch Checklist',
      summary: 'Second member for public stack publish.',
      contentText: 'Launch Checklist completes the public stack.',
      sourceKind: 'workspace_file',
      sourceRef: 'workspace/.agent-town/playbooks/public-stack-launch-checklist.md',
      visibility: 'house_private',
    },
  });
  expect(betaResp.status).toBe(201);
  const betaId = String(betaResp.json?.data?.item?.libraryItemId || '');

  const scopeResp = await callPageJson(page, '/api/platform/library/scope', {
    method: 'POST',
    data: {
      scopeSetId: 'scope_public_stack_publish_01',
      title: 'Public Launch Satchel',
      itemIds: [alphaId, betaId],
      scopeKind: 'satchel',
    },
  });
  expect(scopeResp.status).toBe(200);

  const alphaPublishResp = await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-public-stack-publish-alpha-001',
    },
    data: {
      libraryItemId: alphaId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  expect(alphaPublishResp.status).toBe(201);
  const alphaPublicationId = String(alphaPublishResp.json?.data?.publication?.libraryPublicationId || '');

  const statsBefore = await getPlatformStats(request);
  expect(statsBefore?.ok).toBe(true);

  const missingPublicationResp = await callPageJson(page, '/api/platform/library/public-stacks', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-public-stack-publish-missing-publication-001',
    },
    data: {
      scopeSetId: 'scope_public_stack_publish_01',
    },
  });
  expect(missingPublicationResp.status).toBe(409);
  expect(String(missingPublicationResp.json?.error?.code || '')).toBe('LIBRARY_PUBLIC_STACK_PUBLICATION_REQUIRED');

  const betaPublishResp = await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-public-stack-publish-beta-001',
    },
    data: {
      libraryItemId: betaId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  expect(betaPublishResp.status).toBe(201);
  const betaPublicationId = String(betaPublishResp.json?.data?.publication?.libraryPublicationId || '');

  const blockedResp = await callPageJson(page, '/api/platform/library/public-stacks', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-public-stack-publish-approved-001',
    },
    data: {
      scopeSetId: 'scope_public_stack_publish_01',
    },
  });
  expect(blockedResp.status).toBe(409);
  expect(String(blockedResp.json?.error?.code || '')).toBe('LIBRARY_PUBLIC_STACK_APPROVAL_REQUIRED');

  const publishResp = await callPageJson(page, '/api/platform/library/public-stacks', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-public-stack-publish-approved-001',
    },
    data: {
      scopeSetId: 'scope_public_stack_publish_01',
      approvalId: APPROVED_PUBLIC_STACK_ID,
    },
  });
  expect(publishResp.status).toBe(201);
  const publicStack = publishResp.json?.data?.publicStack || null;
  expect(publicStack).toMatchObject({
    scopeSetId: 'scope_public_stack_publish_01',
    familySlug: 'house_library_stacks',
    title: 'Public Launch Satchel',
    publicationState: 'published',
  });
  const libraryPublicStackId = String(publicStack?.libraryPublicStackId || '');
  expect(libraryPublicStackId).toMatch(/^pstack_/);
  expect(String(publicStack?.bundleHash || '')).toMatch(/^sha256:/);

  const bundleManifest = publishResp.json?.data?.bundleManifest || null;
  expect(bundleManifest).toMatchObject({
    scopeSetId: 'scope_public_stack_publish_01',
    title: 'Public Launch Satchel',
    scopeKind: 'satchel',
    familySlug: 'house_library_stacks',
    memberCount: 2,
    orderedItemIds: [alphaId, betaId],
    orderedPublicationIds: [alphaPublicationId, betaPublicationId],
  });
  expect(Array.isArray(bundleManifest?.members)).toBe(true);
  expect(bundleManifest.members).toHaveLength(2);
  expect(bundleManifest.members[0]).toMatchObject({
    position: 0,
    libraryItemId: alphaId,
    libraryPublicationId: alphaPublicationId,
    title: 'Scout Notes',
  });
  expect(bundleManifest.members[1]).toMatchObject({
    position: 1,
    libraryItemId: betaId,
    libraryPublicationId: betaPublicationId,
    title: 'Launch Checklist',
  });

  const statsAfterCreate = await getPlatformStats(request);
  expect(Number(statsAfterCreate?.stats?.counts?.library_public_stacks || 0)).toBe(Number(statsBefore?.stats?.counts?.library_public_stacks || 0) + 1);
  expect(Number(statsAfterCreate?.stats?.counts?.library_public_stack_members || 0)).toBe(Number(statsBefore?.stats?.counts?.library_public_stack_members || 0) + 2);

  const replayResp = await callPageJson(page, '/api/platform/library/public-stacks', {
    method: 'POST',
    headers: {
      'Idempotency-Key': 'library-public-stack-publish-approved-001',
    },
    data: {
      scopeSetId: 'scope_public_stack_publish_01',
      approvalId: APPROVED_PUBLIC_STACK_ID,
    },
  });
  expect(replayResp.status).toBe(200);
  expect(String(replayResp.json?.data?.publicStack?.libraryPublicStackId || '')).toBe(libraryPublicStackId);

  const statsAfterReplay = await getPlatformStats(request);
  expect(statsAfterReplay?.stats?.counts).toEqual(statsAfterCreate?.stats?.counts);

  const publicStacksInspector = await getPlatformInspector(request, 'public-stacks');
  expect(publicStacksInspector.status).toBe(200);
  expect(publicStacksInspector.json?.data?.publicStacks).toEqual(expect.arrayContaining([
    expect.objectContaining({
      libraryPublicStackId,
      houseId: sourceHouse.houseId,
      teamId: 'team_main',
      scopeSetId: 'scope_public_stack_publish_01',
      familySlug: 'house_library_stacks',
      title: 'Public Launch Satchel',
    }),
  ]));
  expect(publicStacksInspector.json?.data?.members).toEqual(expect.arrayContaining([
    expect.objectContaining({
      libraryPublicStackId,
      libraryPublicationId: alphaPublicationId,
      sortIndex: 0,
    }),
    expect.objectContaining({
      libraryPublicStackId,
      libraryPublicationId: betaPublicationId,
      sortIndex: 1,
    }),
  ]));
});
