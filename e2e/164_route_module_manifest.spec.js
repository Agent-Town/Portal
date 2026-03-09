const { test, expect } = require('@playwright/test');
const path = require('path');
const { execFileSync } = require('child_process');

const { resetPortalWebState } = require('./helpers/portal_web');
const { getPlatformFixture, getRouteManifest } = require('./helpers/unified_platform');

const repoRoot = path.join(__dirname, '..');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M20.8: route manifest is stable and verify:route-modules fails only when direct registrations remain in server/index.js', async ({ request }) => {
  const expectedFixture = await getPlatformFixture(request, 'route_module_manifest_expected');
  expect(expectedFixture.ok).toBe(true);
  const expectedFamilies = Array.isArray(expectedFixture.fixture?.families)
    ? expectedFixture.fixture.families.map((entry) => String(entry || ''))
    : [];

  const manifestA = await getRouteManifest(request);
  const manifestB = await getRouteManifest(request);
  expect(manifestA.ok).toBe(true);
  expect(manifestB.ok).toBe(true);

  const routesA = Array.isArray(manifestA.routes) ? manifestA.routes : [];
  const routesB = Array.isArray(manifestB.routes) ? manifestB.routes : [];
  expect(routesA).toEqual(routesB);

  const families = routesA.map((entry) => String(entry.family || ''));
  expect(families).toEqual(expect.arrayContaining(expectedFamilies));
  for (const route of routesA) {
    expect(String(route.owner || '')).toBeTruthy();
    if (expectedFamilies.includes(String(route.family || ''))) {
      expect(String(route.owner || '')).not.toBe('server/index.js');
    }
  }

  const verifyOutput = execFileSync('node', ['scripts/verify_route_modules.js'], {
    cwd: repoRoot,
    env: process.env,
    encoding: 'utf8',
  });
  const verification = JSON.parse(verifyOutput);
  expect(verification.ok).toBe(true);
  expect(Object.keys(verification.owners || {})).toEqual(expect.arrayContaining(expectedFamilies));
});
