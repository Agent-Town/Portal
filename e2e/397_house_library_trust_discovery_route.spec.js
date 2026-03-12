const { test, expect, request: playwrightRequest } = require('@playwright/test');

const { seedHouseLibraryDiscoveryScene } = require('./helpers/house_library_discovery');
const { resetPortalWebState } = require('./helpers/portal_web');
const { callPageJson } = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M40.1: Public Stack search returns deterministic discovery lanes, reasons, and lane counts', async ({ page, request }) => {
  await seedHouseLibraryDiscoveryScene(page, request, playwrightRequest, {
    titlePrefix: 'Discovery Route',
  });

  const baseSearch = await callPageJson(page, '/api/platform/library/public-stacks/search?q=Discovery%20Route%20&family=house_library_stacks', {
    method: 'GET',
  });
  expect(baseSearch.status).toBe(200);
  expect(baseSearch.json?.data).toMatchObject({
    discovery: '',
    discoveryCounts: {
      readyHere: 1,
      checkHere: 1,
      attestedElsewhere: 1,
      importedHere: 1,
    },
    resultCount: 4,
  });
  expect(Array.isArray(baseSearch.json?.data?.results)).toBe(true);
  baseSearch.json.data.results.forEach((entry) => {
    expect([
      'ready_here',
      'check_here',
      'attested_elsewhere',
      'imported_here',
    ]).toContain(String(entry?.discoveryLane || ''));
    expect(String(entry?.discoveryReason || '').trim().length).toBeGreaterThan(0);
  });

  const readySearch = await callPageJson(page, '/api/platform/library/public-stacks/search?q=Discovery%20Route%20&family=house_library_stacks&discovery=ready_here', {
    method: 'GET',
  });
  expect(readySearch.status).toBe(200);
  expect(readySearch.json?.data?.resultCount).toBe(1);
  expect(readySearch.json?.data?.results?.[0]).toMatchObject({
    displayName: 'Discovery Route Ready Pack',
    discoveryLane: 'ready_here',
    discoveryReason: 'Trusted here in this House.',
  });

  const checkSearch = await callPageJson(page, '/api/platform/library/public-stacks/search?q=Discovery%20Route%20&family=house_library_stacks&discovery=check_here', {
    method: 'GET',
  });
  expect(checkSearch.status).toBe(200);
  expect(checkSearch.json?.data?.resultCount).toBe(1);
  expect(checkSearch.json?.data?.results?.[0]).toMatchObject({
    displayName: 'Discovery Route Check Pack',
    discoveryLane: 'check_here',
    discoveryReason: 'Saved for later review in this House.',
  });

  const attestedSearch = await callPageJson(page, '/api/platform/library/public-stacks/search?q=Discovery%20Route%20&family=house_library_stacks&discovery=attested_elsewhere', {
    method: 'GET',
  });
  expect(attestedSearch.status).toBe(200);
  expect(attestedSearch.json?.data?.resultCount).toBe(1);
  expect(attestedSearch.json?.data?.results?.[0]).toMatchObject({
    displayName: 'Discovery Route Attested Pack',
    discoveryLane: 'attested_elsewhere',
    discoveryReason: 'Attested by other Houses.',
  });

  const importedSearch = await callPageJson(page, '/api/platform/library/public-stacks/search?q=Discovery%20Route%20&family=house_library_stacks&discovery=imported_here', {
    method: 'GET',
  });
  expect(importedSearch.status).toBe(200);
  expect(importedSearch.json?.data?.resultCount).toBe(1);
  expect(importedSearch.json?.data?.results?.[0]).toMatchObject({
    displayName: 'Discovery Route Imported Pack',
    discoveryLane: 'imported_here',
  });
  expect(String(importedSearch.json?.data?.results?.[0]?.discoveryReason || '')).toContain('Already in your Library as Satchel');
});
