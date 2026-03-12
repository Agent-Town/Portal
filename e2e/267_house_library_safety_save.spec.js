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
const {
  seedPublishedHouseLibraryPublicStack,
} = require('./helpers/house_library_public_stacks');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M39.1: local Public Stack safety saves create one durable row, replay idempotently, and update in place', async ({ page, request }) => {
  const sourceHouse = await seedRecoverableTokenHouse(request);
  const baseURL = `http://127.0.0.1:${process.env.PW_PORT || '4174'}`;
  const targetApi = await playwrightRequest.newContext({ baseURL });
  const targetHouse = await seedRecoverableTokenHouse(targetApi);
  await targetApi.dispose();

  expect((await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_safety_save_source_01',
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  }))?.ok).toBe(true);
  expect((await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_safety_save_target_01',
    houseId: targetHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  }))?.ok).toBe(true);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);

  let attached = await attachHouseToPageSession(page, {
    houseId: sourceHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const seeded = await seedPublishedHouseLibraryPublicStack(page, {
    idPrefix: 'house-library-safety-save',
    title: 'Safety Save Pack',
  });
  const libraryPublicStackId = String(seeded.libraryPublicStackId || '');
  expect(libraryPublicStackId).toBeTruthy();

  const statsBefore = await getPlatformStats(request);
  expect(statsBefore?.ok).toBe(true);

  attached = await attachHouseToPageSession(page, {
    houseId: targetHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const hiddenResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/safety`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-safety-save-hidden-001' },
    data: {
      safetyState: 'hidden_here',
      note: 'Hide this in the target House.',
    },
  });
  expect(hiddenResp.status).toBe(201);
  const hiddenRecordId = String(hiddenResp.json?.data?.safety?.libraryPublicStackSafetyRecordId || '');
  expect(hiddenRecordId).toBeTruthy();
  expect(hiddenResp.json?.data?.safety).toMatchObject({
    libraryPublicStackId,
    houseId: targetHouse.houseId,
    teamId: 'team_main',
    safetyState: 'hidden_here',
    note: 'Hide this in the target House.',
  });
  expect(hiddenResp.json?.data?.preview).toMatchObject({
    libraryPublicStackId,
    safetyState: 'hidden_here',
  });
  expect(Array.isArray(hiddenResp.json?.data?.safetyDesk)).toBe(true);
  expect(hiddenResp.json?.data?.safetyDesk).toHaveLength(1);

  const statsAfterHidden = await getPlatformStats(request);
  expect(Number(statsAfterHidden?.stats?.counts?.library_public_stack_safety_records || 0)).toBe(
    Number(statsBefore?.stats?.counts?.library_public_stack_safety_records || 0) + 1
  );

  const hiddenReplayResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/safety`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-safety-save-hidden-001' },
    data: {
      safetyState: 'hidden_here',
      note: 'Hide this in the target House.',
    },
  });
  expect(hiddenReplayResp.status).toBe(200);
  expect(String(hiddenReplayResp.json?.data?.safety?.libraryPublicStackSafetyRecordId || '')).toBe(hiddenRecordId);

  const statsAfterReplay = await getPlatformStats(request);
  expect(Number(statsAfterReplay?.stats?.counts?.library_public_stack_safety_records || 0)).toBe(
    Number(statsAfterHidden?.stats?.counts?.library_public_stack_safety_records || 0)
  );

  const reportedResp = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(libraryPublicStackId)}/safety`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'house-library-safety-save-reported-001' },
    data: {
      safetyState: 'reported_here',
      note: 'Keep this in the safety queue.',
    },
  });
  expect(reportedResp.status).toBe(200);
  expect(String(reportedResp.json?.data?.safety?.libraryPublicStackSafetyRecordId || '')).toBe(hiddenRecordId);
  expect(reportedResp.json?.data?.safety).toMatchObject({
    libraryPublicStackId,
    houseId: targetHouse.houseId,
    teamId: 'team_main',
    safetyState: 'reported_here',
    note: 'Keep this in the safety queue.',
  });

  const statsAfterReported = await getPlatformStats(request);
  expect(Number(statsAfterReported?.stats?.counts?.library_public_stack_safety_records || 0)).toBe(
    Number(statsAfterHidden?.stats?.counts?.library_public_stack_safety_records || 0)
  );

  const inspector = await getPlatformInspector(request, 'public-stack-safety');
  expect(inspector.status).toBe(200);
  expect(Array.isArray(inspector.json?.data?.safetyRecords)).toBe(true);
  expect(inspector.json?.data?.safetyRecords).toHaveLength(1);
  expect(inspector.json?.data?.safetyRecords?.[0]).toMatchObject({
    libraryPublicStackSafetyRecordId: hiddenRecordId,
    libraryPublicStackId,
    houseId: targetHouse.houseId,
    teamId: 'team_main',
    safetyState: 'reported_here',
    note: 'Keep this in the safety queue.',
  });
});
