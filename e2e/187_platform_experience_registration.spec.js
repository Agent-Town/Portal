const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  createPlatformConfigVersion,
  createPlatformRun,
  getPlatformConfigVersionRecord,
  getPlatformFixture,
  ingestPlatformPokerOperatorTrace,
  listPlatformExperiences,
  promotePlatformConfigVersion,
} = require('./helpers/unified_platform');

function buildConfigPayload(configVersionId) {
  return {
    configVersionId,
    teamId: 'team_main',
    displayVersion: `${configVersionId}@2026.03.10`,
    branch: 'experience-registration',
    status: 'candidate',
    componentRefs: {
      housePolicyVersionId: 'hpv_20260310_01',
      teamCompositionVersionId: 'tcv_20260310_01',
      agentConfigVersionIds: ['agv_20260310_01'],
      officePolicyVersionIds: [],
      experiencePresetVersionId: 'epv_20260310_01',
      integrationOverlayVersionIds: [],
      trainerPresetVersionId: 'tpv_20260310_01',
    },
  };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.4: experience registration is explicit, aliases stay compatible, and poker ingest always pins config lineage', async ({ request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const fixture = await getPlatformFixture(request, 'platform_experience_registration_seed');
  expect(fixture?.ok).toBe(true);

  const experiences = await listPlatformExperiences(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
  });
  expect(experiences.status).toBe(200);
  const listed = Array.isArray(experiences.json?.data?.experiences) ? experiences.json.data.experiences : [];
  expect(listed).toEqual(expect.arrayContaining(
    (fixture.fixture?.experiences || []).map((entry) => expect.objectContaining({
      experienceId: String(entry.experienceId || ''),
      requiresConfigPinning: entry.requiresConfigPinning === true,
    }))
  ));

  const invalidRun = await createPlatformRun(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    experienceId: 'unknown.experience',
    teamId: 'team_main',
    configVersionId: 'cfg_missing',
    entryMode: 'normal',
    idempotencyKey: 'experience-registration-invalid-001',
  });
  expect(invalidRun.status).toBe(404);
  expect(String(invalidRun.json?.error?.code || '')).toBe('EXPERIENCE_NOT_FOUND');

  const missingPinnedConfig = await createPlatformRun(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    experienceId: 'web.agent',
    teamId: 'team_main',
    configVersionId: '',
    entryMode: 'normal',
    idempotencyKey: 'experience-registration-missing-pin-001',
  });
  expect(missingPinnedConfig.status).toBe(400);
  expect(String(missingPinnedConfig.json?.error?.code || '')).toBe('INVALID_ARGUMENT');

  const trainerRun = await createPlatformRun(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    experienceId: 'trainer.compare',
    teamId: 'team_main',
    configVersionId: '',
    entryMode: 'normal',
    idempotencyKey: 'experience-registration-trainer-001',
  });
  expect(trainerRun.status).toBe(201);
  expect(trainerRun.json?.data).toMatchObject({
    experienceId: 'trainer.compare',
    configVersionId: null,
  });

  const config = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'experience-registration-web-config-001',
    payload: buildConfigPayload('cfg_experience_registration_web_01'),
  });
  expect(config.status).toBe(201);

  const promoted = await promotePlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId: 'cfg_experience_registration_web_01',
    teamId: 'team_main',
    idempotencyKey: 'experience-registration-web-promote-001',
  });
  expect(promoted.status).toBe(200);

  const aliasedWebRun = await createPlatformRun(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    experienceId: 'web_portal_demo',
    teamId: 'team_main',
    configVersionId: 'cfg_experience_registration_web_01',
    entryMode: 'normal',
    idempotencyKey: 'experience-registration-web-run-001',
  });
  expect(aliasedWebRun.status).toBe(201);
  expect(aliasedWebRun.json?.data).toMatchObject({
    experienceId: 'web.agent',
    configVersionId: 'cfg_experience_registration_web_01',
  });

  const pokerIngest = await ingestPlatformPokerOperatorTrace(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    teamId: 'team_main',
    idempotencyKey: 'experience-registration-poker-001',
    records: [
      "{\"ingestKey\":\"op:1\",\"type\":\"hand_started\",\"entrantId\":\"entrant_fixture_alpha\"}",
    ],
  });
  expect(pokerIngest.status).toBe(201);
  const pokerConfigVersionId = String(pokerIngest.json?.data?.configVersionId || '');
  expect(pokerIngest.json?.data).toMatchObject({
    experienceId: 'poker.season',
  });
  expect(pokerConfigVersionId).toMatch(/^cfg_/);

  const pinnedPokerConfig = await getPlatformConfigVersionRecord(request, pokerConfigVersionId);
  expect(pinnedPokerConfig.status).toBe(200);
  expect(String(pinnedPokerConfig.json?.config?.configVersionId || '')).toBe(pokerConfigVersionId);
  expect(Array.isArray(pinnedPokerConfig.json?.componentVersions)).toBe(true);
  expect(pinnedPokerConfig.json.componentVersions.length).toBeGreaterThan(0);
});
