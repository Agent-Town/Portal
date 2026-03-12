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
const APPROVED_PUBLIC_STACK_ID = 'appr_fixture_library_public_stack_approved_01';

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M34.1: target House verifies one published Public Stack with idempotent local trust receipts', async ({ page, request }) => {
  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  const targetHouse = await seedRecoverableTokenHouse(targetApi);
  await targetApi.dispose();

  const sourceConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_verify_source_01',
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  const targetConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_verify_target_01',
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
    headers: { 'Idempotency-Key': 'library-public-stack-verify-alpha-001' },
    data: {
      itemType: 'library_note',
      title: 'Trust Notes',
      summary: 'First member for verification.',
      contentText: 'Trust Notes should be part of the verified bundle.',
      sourceKind: 'user_note',
      sourceRef: 'user_note:library-public-stack-verify-alpha-001',
      visibility: 'house_private',
    },
  });
  const alphaId = String(alphaResp.json?.data?.item?.libraryItemId || '');

  const betaResp = await callPageJson(page, '/api/platform/library/items', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-verify-beta-001' },
    data: {
      itemType: 'playbook',
      title: 'Trust Checklist',
      summary: 'Second member for verification.',
      contentText: 'Trust Checklist should be the second verified member.',
      sourceKind: 'workspace_file',
      sourceRef: 'workspace/.agent-town/playbooks/trust-checklist.md',
      visibility: 'house_private',
    },
  });
  const betaId = String(betaResp.json?.data?.item?.libraryItemId || '');

  const scopeResp = await callPageJson(page, '/api/platform/library/scope', {
    method: 'POST',
    data: {
      scopeSetId: 'scope_public_stack_verify_01',
      title: 'Trust Pack',
      itemIds: [alphaId, betaId],
      scopeKind: 'satchel',
    },
  });
  expect(scopeResp.status).toBe(200);

  await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-verify-publish-alpha-001' },
    data: {
      libraryItemId: alphaId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-verify-publish-beta-001' },
    data: {
      libraryItemId: betaId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });

  const publicStackResp = await callPageJson(page, '/api/platform/library/public-stacks', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-verify-create-001' },
    data: {
      scopeSetId: 'scope_public_stack_verify_01',
      approvalId: APPROVED_PUBLIC_STACK_ID,
    },
  });
  expect(publicStackResp.status).toBe(201);
  const libraryPublicStackId = String(publicStackResp.json?.data?.publicStack?.libraryPublicStackId || '');

  attached = await attachHouseToPageSession(page, {
    houseId: targetHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const missingIdempotency = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/verifications`, {
    method: 'POST',
    data: {},
  });
  expect(missingIdempotency.status).toBe(400);
  expect(missingIdempotency.json?.error?.code || missingIdempotency.json?.code).toBe('LIBRARY_IDEMPOTENCY_REQUIRED');

  const missingStack = await callPageJson(page, '/api/platform/library/public-stacks/pstack_missing/verifications', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-verify-missing-001' },
    data: {},
  });
  expect(missingStack.status).toBe(404);
  expect(missingStack.json?.error?.code || missingStack.json?.code).toBe('PUBLIC_STACK_NOT_FOUND');

  const statsBefore = await getPlatformStats(request);
  expect(statsBefore?.ok).toBe(true);

  const verifyResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/verifications`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-verify-target-001' },
    data: {},
  });
  expect(verifyResp.status).toBe(201);
  expect(verifyResp.json?.data?.verification).toMatchObject({
    verificationKind: 'bundle_integrity',
    verificationState: 'verified',
    bundleHash: expect.stringMatching(/^sha256:/),
    libraryPublicStackVerificationId: expect.stringMatching(/^pstv_/),
  });
  expect(Array.isArray(verifyResp.json?.data?.members)).toBe(true);
  expect(verifyResp.json.data.members).toHaveLength(2);
  expect(verifyResp.json.data.members[0]).toMatchObject({
    verificationState: 'verified',
    sortIndex: 0,
  });
  expect(verifyResp.json.data.members[1]).toMatchObject({
    verificationState: 'verified',
    sortIndex: 1,
  });

  const statsAfter = await getPlatformStats(request);
  expect(Number(statsAfter?.stats?.counts?.library_public_stack_verifications || 0)).toBe(Number(statsBefore?.stats?.counts?.library_public_stack_verifications || 0) + 1);
  expect(Number(statsAfter?.stats?.counts?.library_public_stack_verification_members || 0)).toBe(Number(statsBefore?.stats?.counts?.library_public_stack_verification_members || 0) + 2);

  const trustInspector = await getPlatformInspector(request, 'public-stack-trust');
  expect(trustInspector.status).toBe(200);
  expect(Array.isArray(trustInspector.json?.data?.verifications)).toBe(true);
  expect(Array.isArray(trustInspector.json?.data?.verificationMembers)).toBe(true);
  expect(trustInspector.json.data.verifications).toHaveLength(1);
  expect(trustInspector.json.data.verificationMembers).toHaveLength(2);
  expect(trustInspector.json.data.verifications[0]).toMatchObject({
    libraryPublicStackId,
    houseId: targetHouse.houseId,
    teamId: 'team_main',
    verificationKind: 'bundle_integrity',
    verificationState: 'verified',
  });

  const replayResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/verifications`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-verify-target-001' },
    data: {},
  });
  expect(replayResp.status).toBe(200);
  expect(replayResp.json?.data?.verification?.libraryPublicStackVerificationId).toBe(verifyResp.json?.data?.verification?.libraryPublicStackVerificationId);

  const statsAfterReplay = await getPlatformStats(request);
  expect(statsAfterReplay?.stats?.counts).toEqual(statsAfter?.stats?.counts);
});
