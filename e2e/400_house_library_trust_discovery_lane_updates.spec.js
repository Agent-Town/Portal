const { test, expect, request: playwrightRequest } = require('@playwright/test');

const { seedHouseLibraryDiscoveryScene } = require('./helpers/house_library_discovery');
const {
  importHouseLibraryPublicStackApi,
  openHouseLibraryPublicStackPreview,
} = require('./helpers/house_library_public_stacks');
const { resetPortalWebState } = require('./helpers/portal_web');
const { callPageJson } = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M40.4: local verify and import actions move a Public Stack across discovery lanes deterministically', async ({ page, request }) => {
  const scene = await seedHouseLibraryDiscoveryScene(page, request, playwrightRequest, {
    titlePrefix: 'Discovery Update',
  });
  const attestedStackId = String(scene.stacks.attested.libraryPublicStackId || '');

  let response = await callPageJson(page, '/api/platform/library/public-stacks/search?q=Discovery%20Update%20Attested%20Pack&family=house_library_stacks&discovery=attested_elsewhere', {
    method: 'GET',
  });
  expect(response.status).toBe(200);
  expect(response.json?.data?.resultCount).toBe(1);

  response = await callPageJson(page, `/api/platform/library/public-stacks/${encodeURIComponent(attestedStackId)}/verifications`, {
    method: 'POST',
    headers: { 'Idempotency-Key': 'discovery-update-verify-001' },
    data: {},
  });
  expect(response.status).toBe(201);

  response = await callPageJson(page, '/api/platform/library/public-stacks/search?q=Discovery%20Update%20Attested%20Pack&family=house_library_stacks&discovery=ready_here', {
    method: 'GET',
  });
  expect(response.status).toBe(200);
  expect(response.json?.data?.resultCount).toBe(1);
  expect(response.json?.data?.results?.[0]).toMatchObject({
    displayName: 'Discovery Update Attested Pack',
    discoveryLane: 'ready_here',
    discoveryReason: 'Verified here in this House.',
  });

  response = await importHouseLibraryPublicStackApi(page, {
    libraryPublicStackId: attestedStackId,
    idempotencyKey: 'discovery-update-import-001',
  });
  expect(response.status).toBe(201);

  response = await callPageJson(page, '/api/platform/library/public-stacks/search?q=Discovery%20Update%20Attested%20Pack&family=house_library_stacks&discovery=imported_here', {
    method: 'GET',
  });
  expect(response.status).toBe(200);
  expect(response.json?.data?.resultCount).toBe(1);
  expect(response.json?.data?.results?.[0]).toMatchObject({
    displayName: 'Discovery Update Attested Pack',
    discoveryLane: 'imported_here',
  });
  expect(String(response.json?.data?.results?.[0]?.discoveryReason || '')).toContain('Already in your Library as Satchel');
});
