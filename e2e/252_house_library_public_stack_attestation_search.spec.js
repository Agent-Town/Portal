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

async function publishPublicStackFromItems(page, {
  scopeSetId,
  title,
  alphaKey,
  betaKey,
}) {
  const alphaResp = await callPageJson(page, '/api/platform/library/items', {
    method: 'POST',
    headers: { 'Idempotency-Key': `${alphaKey}-alpha` },
    data: {
      itemType: 'library_note',
      title: `${title} Notes`,
      summary: `First member for ${title}.`,
      contentText: `${title} Notes should be included in the published stack.`,
      sourceKind: 'user_note',
      sourceRef: `user_note:${alphaKey}-alpha`,
      visibility: 'house_private',
    },
  });
  const alphaId = String(alphaResp.json?.data?.item?.libraryItemId || '');

  const betaResp = await callPageJson(page, '/api/platform/library/items', {
    method: 'POST',
    headers: { 'Idempotency-Key': `${betaKey}-beta` },
    data: {
      itemType: 'playbook',
      title: `${title} Checklist`,
      summary: `Second member for ${title}.`,
      contentText: `${title} Checklist should remain second in the bundle.`,
      sourceKind: 'workspace_file',
      sourceRef: `workspace/.agent-town/playbooks/${scopeSetId}.md`,
      visibility: 'house_private',
    },
  });
  const betaId = String(betaResp.json?.data?.item?.libraryItemId || '');

  await callPageJson(page, '/api/platform/library/scope', {
    method: 'POST',
    data: {
      scopeSetId,
      title,
      itemIds: [alphaId, betaId],
      scopeKind: 'satchel',
    },
  });
  await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: { 'Idempotency-Key': `${scopeSetId}-publish-alpha` },
    data: {
      libraryItemId: alphaId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: { 'Idempotency-Key': `${scopeSetId}-publish-beta` },
    data: {
      libraryItemId: betaId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  const publicStackResp = await callPageJson(page, '/api/platform/library/public-stacks', {
    method: 'POST',
    headers: { 'Idempotency-Key': `${scopeSetId}-stack` },
    data: {
      scopeSetId,
      approvalId: APPROVED_PUBLIC_STACK_ID,
    },
  });
  expect(publicStackResp.status).toBe(201);
  return String(publicStackResp.json?.data?.publicStack?.libraryPublicStackId || '');
}

test('M36.3: Public Stack search exposes deterministic attestation summaries without changing lexical ordering', async ({ page, request }) => {
  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  const targetHouse = await seedRecoverableTokenHouse(targetApi);
  await targetApi.dispose();

  const sourceConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_attestation_search_source_01',
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  const targetConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_public_stack_attestation_search_target_01',
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

  const alphaStackId = await publishPublicStackFromItems(page, {
    scopeSetId: 'scope_public_stack_attestation_search_alpha_01',
    title: 'Alpha Attestation Pack',
    alphaKey: 'library-public-stack-attestation-search-alpha-001',
    betaKey: 'library-public-stack-attestation-search-alpha-002',
  });
  const bravoStackId = await publishPublicStackFromItems(page, {
    scopeSetId: 'scope_public_stack_attestation_search_bravo_01',
    title: 'Bravo Attestation Pack',
    alphaKey: 'library-public-stack-attestation-search-bravo-001',
    betaKey: 'library-public-stack-attestation-search-bravo-002',
  });

  const bravoReviewResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(bravoStackId)}/reviews`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-attestation-search-bravo-review-001' },
    data: {
      reviewTier: 'trusted_here',
      note: 'Good to publish as a trusted example.',
    },
  });
  expect(bravoReviewResp.status).toBe(201);
  const bravoAttestResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(bravoStackId)}/attestations`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'library-public-stack-attestation-search-bravo-attest-001' },
    data: {},
  });
  expect(bravoAttestResp.status).toBe(201);

  attached = await attachHouseToPageSession(page, {
    houseId: targetHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const searchResp = await callPageJson(page, '/api/platform/library/public-stacks/search?family=house_library_stacks');
  expect(searchResp.status).toBe(200);
  expect(searchResp.json?.data).toMatchObject({
    family: 'house_library_stacks',
    resultCount: 2,
  });
  expect(searchResp.json?.data?.results?.map((entry) => entry.displayName)).toEqual([
    'Alpha Attestation Pack',
    'Bravo Attestation Pack',
  ]);

  expect(searchResp.json?.data?.results?.[0]).toMatchObject({
    registryId: alphaStackId,
    attestationCounts: {
      total: 0,
      trustedHere: 0,
      reviewLater: 0,
      blockedHere: 0,
    },
    attestationSummary: null,
    storefront: {
      attestationCount: 0,
    },
  });
  expect(searchResp.json?.data?.results?.[1]).toMatchObject({
    registryId: bravoStackId,
    attestationCounts: {
      total: 1,
      trustedHere: 1,
      reviewLater: 0,
      blockedHere: 0,
    },
    attestationSummary: expect.stringContaining('1 attestation'),
    storefront: {
      attestationCount: 1,
      attestationSummary: expect.stringContaining('1 attestation'),
    },
  });
});
