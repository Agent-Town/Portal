const { test, expect, request: playwrightRequest } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  callPageJson,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

const APPROVED_PUBLICATION_ID = 'appr_fixture_library_publish_approved_01';
const APPROVED_PUBLIC_STACK_ID = 'appr_fixture_library_public_stack_approved_01';

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M34.2: Public Stack preview exposes local trust overlays after verification without changing Registry preview', async ({ page, request }) => {
  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  const targetHouse = await seedRecoverableTokenHouse(targetApi);
  await targetApi.dispose();
  const sourceConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_trust_preview_source_01',
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  const targetConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_trust_preview_target_01',
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
    headers: { 'Idempotency-Key': 'library-public-stack-trust-preview-alpha-001' },
    data: {
      itemType: 'library_note',
      title: 'Preview Notes',
      summary: 'First preview member.',
      contentText: 'Preview Notes should appear in trust preview.',
      sourceKind: 'user_note',
      sourceRef: 'user_note:library-public-stack-trust-preview-alpha-001',
      visibility: 'house_private',
    },
  });
  const alphaId = String(alphaResp.json?.data?.item?.libraryItemId || '');
  const betaResp = await callPageJson(page, '/api/platform/library/items', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-trust-preview-beta-001' },
    data: {
      itemType: 'playbook',
      title: 'Preview Checklist',
      summary: 'Second preview member.',
      contentText: 'Preview Checklist should remain second in trust preview.',
      sourceKind: 'workspace_file',
      sourceRef: 'workspace/.agent-town/playbooks/preview-checklist.md',
      visibility: 'house_private',
    },
  });
  const betaId = String(betaResp.json?.data?.item?.libraryItemId || '');
  await callPageJson(page, '/api/platform/library/scope', {
    method: 'POST',
    data: {
      scopeSetId: 'scope_public_stack_trust_preview_01',
      title: 'Preview Trust Pack',
      itemIds: [alphaId, betaId],
      scopeKind: 'satchel',
    },
  });
  await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-trust-preview-publish-alpha-001' },
    data: {
      libraryItemId: alphaId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-trust-preview-publish-beta-001' },
    data: {
      libraryItemId: betaId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  const publicStackResp = await callPageJson(page, '/api/platform/library/public-stacks', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-trust-preview-create-001' },
    data: {
      scopeSetId: 'scope_public_stack_trust_preview_01',
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

  const previewBefore = await callPageJson(page, `/api/platform/library/public-stacks/preview/${encodeURIComponent(libraryPublicStackId)}`);
  expect(previewBefore.status).toBe(200);
  expect(previewBefore.json?.data?.preview).toMatchObject({
    libraryPublicStackId,
    verificationState: 'unverified',
    verification: {
      libraryPublicStackVerificationId: null,
      verificationState: 'unverified',
    },
  });

  const verifyResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/verifications`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-trust-preview-verify-001' },
    data: {},
  });
  expect(verifyResp.status).toBe(201);
  const verificationId = String(verifyResp.json?.data?.verification?.libraryPublicStackVerificationId || '');

  const previewAfter = await callPageJson(page, `/api/platform/library/public-stacks/preview/${encodeURIComponent(libraryPublicStackId)}`);
  expect(previewAfter.status).toBe(200);
  expect(previewAfter.json?.data?.preview).toMatchObject({
    libraryPublicStackId,
    verificationState: 'verified',
    verification: {
      libraryPublicStackVerificationId: verificationId,
      verificationKind: 'bundle_integrity',
      verificationState: 'verified',
    },
  });
  expect(Array.isArray(previewAfter.json?.data?.preview?.proofCards)).toBe(true);
  expect(previewAfter.json.data.preview.proofCards.map((card) => card.title)).toEqual([
    'Bundle integrity',
    'Local import status',
  ]);
  expect(String(previewAfter.json?.data?.preview?.provenance?.verificationSummary || '')).toContain('Bundle hash matches');

  const registryPreview = await callPageJson(page, '/api/platform/library/public-stacks/preview/reg_atlas_skill_01');
  expect(registryPreview.status).toBe(200);
  expect(registryPreview.json?.data?.preview).toMatchObject({
    registryId: 'reg_atlas_skill_01',
    family: 'skill',
  });
  expect(registryPreview.json?.data?.preview?.bundleKind).toBeUndefined();
  expect(registryPreview.json?.data?.preview?.verification).toBeUndefined();
  expect(registryPreview.json?.data?.preview?.proofCards).toBeUndefined();
});
