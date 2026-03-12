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

test('M36.2: Public Stack preview exposes attestation counts and authored cards without replacing the active House review', async ({ page, request }) => {
  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  const targetHouse = await seedRecoverableTokenHouse(targetApi);
  await targetApi.dispose();

  const sourceConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_attestation_preview_source_01',
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  const targetConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_attestation_preview_target_01',
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
    headers: { 'Idempotency-Key': 'library-public-stack-attestation-preview-alpha-001' },
    data: {
      itemType: 'library_note',
      title: 'Attestation Preview Notes',
      summary: 'First preview attestation member.',
      contentText: 'Attestation Preview Notes should appear in the public attestation preview.',
      sourceKind: 'user_note',
      sourceRef: 'user_note:library-public-stack-attestation-preview-alpha-001',
      visibility: 'house_private',
    },
  });
  const alphaId = String(alphaResp.json?.data?.item?.libraryItemId || '');
  const betaResp = await callPageJson(page, '/api/platform/library/items', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-attestation-preview-beta-001' },
    data: {
      itemType: 'playbook',
      title: 'Attestation Preview Checklist',
      summary: 'Second preview attestation member.',
      contentText: 'Attestation Preview Checklist should remain visible in the preview.',
      sourceKind: 'workspace_file',
      sourceRef: 'workspace/.agent-town/playbooks/attestation-preview-checklist.md',
      visibility: 'house_private',
    },
  });
  const betaId = String(betaResp.json?.data?.item?.libraryItemId || '');
  await callPageJson(page, '/api/platform/library/scope', {
    method: 'POST',
    data: {
      scopeSetId: 'scope_public_stack_attestation_preview_01',
      title: 'Attestation Preview Pack',
      itemIds: [alphaId, betaId],
      scopeKind: 'satchel',
    },
  });
  await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-attestation-preview-publish-alpha-001' },
    data: {
      libraryItemId: alphaId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-attestation-preview-publish-beta-001' },
    data: {
      libraryItemId: betaId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  const publicStackResp = await callPageJson(page, '/api/platform/library/public-stacks', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-attestation-preview-stack-001' },
    data: {
      scopeSetId: 'scope_public_stack_attestation_preview_01',
      approvalId: APPROVED_PUBLIC_STACK_ID,
    },
  });
  expect(publicStackResp.status).toBe(201);
  const libraryPublicStackId = String(publicStackResp.json?.data?.publicStack?.libraryPublicStackId || '');

  const sourceReviewResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/reviews`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-attestation-preview-review-001' },
    data: {
      reviewTier: 'trusted_here',
      note: 'Ready for sharing from this House.',
    },
  });
  expect(sourceReviewResp.status).toBe(201);

  const sourceAttestationResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/attestations`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-attestation-preview-attest-001' },
    data: {},
  });
  expect(sourceAttestationResp.status).toBe(201);

  attached = await attachHouseToPageSession(page, {
    houseId: targetHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const previewBeforeTargetReview = await callPageJson(page, `/api/platform/library/public-stacks/preview/${encodeURIComponent(libraryPublicStackId)}`);
  expect(previewBeforeTargetReview.status).toBe(200);
  expect(previewBeforeTargetReview.json?.data?.preview).toMatchObject({
    libraryPublicStackId,
    reviewTier: null,
    review: null,
    localAttestation: null,
    attestationCounts: {
      total: 1,
      trustedHere: 1,
      reviewLater: 0,
      blockedHere: 0,
    },
  });
  expect(Array.isArray(previewBeforeTargetReview.json?.data?.preview?.attestations)).toBe(true);
  expect(previewBeforeTargetReview.json.data.preview.attestations).toEqual([
    expect.objectContaining({
      houseId: sourceHouse.houseId,
      teamId: 'team_main',
      reviewTier: 'trusted_here',
      summary: expect.stringContaining('trusted here'),
    }),
  ]);
  expect(String(previewBeforeTargetReview.json?.data?.preview?.provenance?.attestationSummary || '')).toContain('1 attestation');

  const targetReviewResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/reviews`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-attestation-preview-target-review-001' },
    data: {
      reviewTier: 'blocked_here',
      note: 'Keep this out of this House.',
    },
  });
  expect(targetReviewResp.status).toBe(201);

  const previewAfterTargetReview = await callPageJson(page, `/api/platform/library/public-stacks/preview/${encodeURIComponent(libraryPublicStackId)}`);
  expect(previewAfterTargetReview.status).toBe(200);
  expect(previewAfterTargetReview.json?.data?.preview).toMatchObject({
    libraryPublicStackId,
    reviewTier: 'blocked_here',
    review: {
      houseId: targetHouse.houseId,
      teamId: 'team_main',
      reviewTier: 'blocked_here',
      note: 'Keep this out of this House.',
    },
    localAttestation: null,
    attestationCounts: {
      total: 1,
      trustedHere: 1,
      reviewLater: 0,
      blockedHere: 0,
    },
  });
  expect(previewAfterTargetReview.json.data.preview.attestations).toEqual([
    expect.objectContaining({
      houseId: sourceHouse.houseId,
      reviewTier: 'trusted_here',
    }),
  ]);
  expect(String(previewAfterTargetReview.json?.data?.preview?.review?.summary || '')).toContain('Blocked here');

  const registryPreview = await callPageJson(page, '/api/platform/library/public-stacks/preview/reg_atlas_skill_01');
  expect(registryPreview.status).toBe(200);
  expect(registryPreview.json?.data?.preview).toMatchObject({
    registryId: 'reg_atlas_skill_01',
    family: 'skill',
  });
  expect(registryPreview.json?.data?.preview?.attestations).toBeUndefined();
  expect(registryPreview.json?.data?.preview?.attestationCounts).toBeUndefined();
});
