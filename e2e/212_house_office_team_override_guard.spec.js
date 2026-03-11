const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  createPlatformRun,
  getPlatformFixture,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

async function seedHouseOfficeTeamGuardScenario(request) {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const teamAlphaConfig = 'cfg_house_office_team_guard_alpha_01';
  const teamBetaConfig = 'cfg_house_office_team_guard_beta_01';

  const seededAlpha = await seedPlatformConfigVersion(request, {
    configVersionId: teamAlphaConfig,
    houseId: seededHouse.houseId,
    teamId: 'team_alpha',
    status: 'active',
  });
  expect(seededAlpha.ok).toBe(true);

  const seededBeta = await seedPlatformConfigVersion(request, {
    configVersionId: teamBetaConfig,
    houseId: seededHouse.houseId,
    teamId: 'team_beta',
    status: 'active',
  });
  expect(seededBeta.ok).toBe(true);

  const betaRun = await createPlatformRun(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId: teamBetaConfig,
    teamId: 'team_beta',
    experienceId: 'poker.season',
    entryMode: 'season_lock',
    idempotencyKey: 'house-office-team-guard-beta-run-001',
  });
  expect(betaRun.status).toBe(201);

  return {
    seededHouse,
  };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M32.7: House Office read routes reject unavailable team overrides and allow valid ones', async ({ page, request }) => {
  const fixtureEnvelope = await getPlatformFixture(request, 'house_office_team_guard_seed');
  expect(fixtureEnvelope?.ok).toBe(true);
  const fixture = fixtureEnvelope?.fixture || {};
  const validTeamId = String(fixture?.validTeamId || '').trim();
  const invalidTeamId = String(fixture?.invalidTeamId || '').trim();
  expect(validTeamId).toBeTruthy();
  expect(invalidTeamId).toBeTruthy();

  const scenario = await seedHouseOfficeTeamGuardScenario(request);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: scenario.seededHouse.houseId,
    teamId: 'team_alpha',
  });
  expect(attached.status).toBe(200);

  for (const path of [
    `/api/platform/house-office?teamId=${encodeURIComponent(invalidTeamId)}`,
    `/api/platform/house-structure?teamId=${encodeURIComponent(invalidTeamId)}`,
    `/api/platform/house-readiness?teamId=${encodeURIComponent(invalidTeamId)}`,
  ]) {
    const response = await page.request.get(path, {
      failOnStatusCode: false,
    });
    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body?.error?.code).toBe('TEAM_NOT_FOUND');
    expect(Array.isArray(body?.error?.details?.availableTeamIds)).toBe(true);
    expect(body.error.details.availableTeamIds).toContain('team_alpha');
    expect(body.error.details.availableTeamIds).toContain(validTeamId);
  }

  const officeResponse = await page.request.get(`/api/platform/house-office?teamId=${encodeURIComponent(validTeamId)}`);
  expect(officeResponse.ok()).toBe(true);
  const officeBody = await officeResponse.json();
  expect(officeBody?.data).toMatchObject({
    houseId: scenario.seededHouse.houseId,
    teamId: validTeamId,
    activeTeamId: 'team_alpha',
  });

  const structureResponse = await page.request.get(`/api/platform/house-structure?teamId=${encodeURIComponent(validTeamId)}`);
  expect(structureResponse.ok()).toBe(true);
  const structureBody = await structureResponse.json();
  expect(structureBody?.data).toMatchObject({
    houseId: scenario.seededHouse.houseId,
    teamId: validTeamId,
    activeTeamId: 'team_alpha',
  });

  const readinessResponse = await page.request.get(`/api/platform/house-readiness?teamId=${encodeURIComponent(validTeamId)}`);
  expect(readinessResponse.ok()).toBe(true);
  const readinessBody = await readinessResponse.json();
  expect(readinessBody?.data).toMatchObject({
    houseId: scenario.seededHouse.houseId,
    activeTeamId: validTeamId,
  });
});
