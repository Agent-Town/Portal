const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  getPlatformStats,
} = require('./helpers/unified_platform');

const RESET_TOKEN = process.env.TEST_RESET_TOKEN || 'test-reset';
const APPROVED_PUBLICATION_ID = 'appr_fixture_library_publish_approved_01';

async function readPublicationsInspector(request) {
  const response = await request.get('/__test__/unified-platform/inspect/publications', {
    headers: { 'x-test-reset': RESET_TOKEN },
  });
  return await response.json();
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M29.8: Library publication requires approval, creates one durable publication row, and replays idempotently', async ({ page, request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const createResp = await page.request.post('/api/platform/library/items', {
    headers: {
      'Idempotency-Key': 'library-publish-item-001',
    },
    data: {
      itemType: 'playbook',
      title: 'Registry Publish Playbook',
      summary: 'One stable item ready for Registry publication.',
      contentText: 'Publish one curated item after explicit approval.',
      sourceKind: 'workspace_file',
      sourceRef: 'workspace/.agent-town/playbooks/publish.md',
    },
    failOnStatusCode: false,
  });
  expect(createResp.status()).toBe(201);
  const createdBody = await createResp.json();
  const libraryItemId = String(createdBody?.data?.item?.libraryItemId || '');
  const contentHash = String(createdBody?.data?.item?.contentHash || '');
  expect(libraryItemId).toMatch(/^lib_/);
  expect(contentHash).toMatch(/^sha256:/);

  const statsBefore = await getPlatformStats(request);
  expect(statsBefore?.ok).toBe(true);

  const blockedResp = await page.request.post('/api/platform/library/publications', {
    headers: {
      'Idempotency-Key': 'library-publish-001',
    },
    data: {
      libraryItemId,
      visibility: 'registry_public',
    },
    failOnStatusCode: false,
  });
  expect(blockedResp.status()).toBe(409);
  const blockedBody = await blockedResp.json();
  expect(String(blockedBody?.error?.code || '')).toBe('LIBRARY_PUBLISH_APPROVAL_REQUIRED');

  const approvedResp = await page.request.post('/api/platform/library/publications', {
    headers: {
      'Idempotency-Key': 'library-publish-001',
    },
    data: {
      libraryItemId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
    failOnStatusCode: false,
  });
  expect(approvedResp.status()).toBe(201);
  const approvedBody = await approvedResp.json();
  expect(approvedBody?.data?.publication).toMatchObject({
    libraryItemId,
    visibility: 'registry_public',
    contentHash,
  });
  expect(String(approvedBody?.data?.publication?.libraryPublicationId || '')).toMatch(/^pub_/);
  expect(String(approvedBody?.data?.publication?.registryId || '')).toMatch(/^regpub_/);

  const statsAfterApprove = await getPlatformStats(request);
  expect(Number(statsAfterApprove?.stats?.counts?.library_publications || 0)).toBe(Number(statsBefore?.stats?.counts?.library_publications || 0) + 1);
  expect(Number(statsAfterApprove?.stats?.counts?.library_items || 0)).toBe(Number(statsBefore?.stats?.counts?.library_items || 0));

  const replayResp = await page.request.post('/api/platform/library/publications', {
    headers: {
      'Idempotency-Key': 'library-publish-001',
    },
    data: {
      libraryItemId,
      visibility: 'registry_public',
    },
    failOnStatusCode: false,
  });
  expect(replayResp.status()).toBe(200);
  const replayBody = await replayResp.json();
  expect(String(replayBody?.data?.publication?.libraryPublicationId || '')).toBe(String(approvedBody?.data?.publication?.libraryPublicationId || ''));

  const statsAfterReplay = await getPlatformStats(request);
  expect(statsAfterReplay?.stats?.counts).toEqual(statsAfterApprove?.stats?.counts);

  const inspector = await readPublicationsInspector(request);
  expect(inspector?.ok).toBe(true);
  const publication = Array.isArray(inspector?.data?.publications)
    ? inspector.data.publications.find((entry) => String(entry?.libraryItemId || '') === libraryItemId)
    : null;
  expect(publication).toMatchObject({
    libraryItemId,
    visibility: 'registry_public',
    contentHash,
  });
});
