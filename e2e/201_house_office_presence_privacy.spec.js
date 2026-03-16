const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const {
  attachHouseToPageSession,
  createPlatformConfigVersion,
  createPlatformTrainerJob,
  exportPlatformSnapshot,
  getPlatformFixture,
  importPlatformSnapshot,
  promotePlatformConfigVersion,
  readWorkerSessionId,
} = require('./helpers/unified_platform');
const { waitForLiteApi } = require('./helpers/trainer');

function buildConfigPayload(configVersionId) {
  return {
    configVersionId,
    teamId: 'team_main',
    displayVersion: `${configVersionId}@2026.03.11`,
    branch: 'house-office-privacy',
    status: 'candidate',
    componentRefs: {
      housePolicyVersionId: 'hpv_house_office_privacy_01',
      teamCompositionVersionId: 'tcv_house_office_privacy_01',
      agentConfigVersionIds: ['agv_house_office_privacy_01'],
      officePolicyVersionIds: [],
      experiencePresetVersionId: 'epv_house_office_privacy_01',
      integrationOverlayVersionIds: [],
      trainerPresetVersionId: 'tpv_house_office_privacy_01',
    },
  };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M29.6: House Office redacts unsafe focus text and keeps safe deep links deterministic', async ({ page, request }) => {
  test.slow();
  test.setTimeout(180_000);
  const assignmentsFixtureEnvelope = await getPlatformFixture(request, 'house_office_assignments_seed');
  expect(assignmentsFixtureEnvelope?.ok).toBe(true);
  const assignmentsFixture = assignmentsFixtureEnvelope?.fixture || {};
  const officeId = String(assignmentsFixture?.offices?.[0]?.officeId || '').trim();
  const staffAgentId = String(assignmentsFixture?.staffAgents?.[0]?.staffAgentId || '').trim();
  expect(officeId).toBeTruthy();
  expect(staffAgentId).toBeTruthy();

  const privacyFixtureEnvelope = await getPlatformFixture(request, 'house_office_privacy_seed');
  expect(privacyFixtureEnvelope?.ok).toBe(true);
  const privacyFixture = privacyFixtureEnvelope?.fixture || {};
  const unsafeAssignmentFocus = String(privacyFixture?.unsafeAssignmentFocus || '').trim();
  const expectedRedactedFocus = String(privacyFixture?.expectedRedactedFocus || '').trim();
  const forbiddenFields = Array.isArray(privacyFixture?.forbiddenFields) ? privacyFixture.forbiddenFields : [];
  expect(unsafeAssignmentFocus).toBeTruthy();
  expect(expectedRedactedFocus).toBeTruthy();

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);

  const seededHouse = await seedRecoverableTokenHouse(request);
  const configVersionId = 'cfg_house_office_privacy_01';
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const createdConfig = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-office-privacy-config-001',
    payload: buildConfigPayload(configVersionId),
  });
  expect(createdConfig.status).toBe(201);

  const promotedConfig = await promotePlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId,
    teamId: 'team_main',
    idempotencyKey: 'house-office-privacy-promote-001',
  });
  expect(promotedConfig.status).toBe(200);

  const trainerJob = await createPlatformTrainerJob(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-office-privacy-trainer-001',
    payload: {
      teamId: 'team_main',
      jobKind: 'trainer_job.compare',
      targets: {
        configVersionIds: [configVersionId],
      },
      budget: {
        maxUsd: 5,
      },
    },
  });
  expect(trainerJob.status).toBe(201);
  const trainerResultId = String(trainerJob.json?.data?.result?.trainerResultId || '');
  const trainerJobId = String(trainerJob.json?.data?.trainerJobId || '');
  expect(trainerResultId).toMatch(/^trr_/);

  const exported = await exportPlatformSnapshot(request);
  expect(exported.status).toBe(200);
  const snapshot = exported.json?.snapshot || null;
  expect(snapshot?.schemaVersion).toBe('platform-export/v1');
  snapshot.tables.house_staff_assignments.push({
    assignment_id: 'assign_house_office_privacy_seed_01',
    house_id: seededHouse.houseId,
    team_id: 'team_main',
    office_id: officeId,
    staff_agent_id: staffAgentId,
    focus: unsafeAssignmentFocus,
    source_kind: 'trainer_result',
    source_id: trainerResultId,
    source_ref_json: JSON.stringify({
      sourceKind: 'trainer_result',
      sourceId: trainerResultId,
      entryPath: '/api/platform/trainer',
      selection: {
        kind: 'trainer_result',
        trainerResultId,
        trainerJobId,
      },
    }),
    idempotency_key: 'house-office-privacy-import-001',
    started_at: '2026-03-11T00:00:00.000Z',
    created_at: '2026-03-11T00:00:00.000Z',
    updated_at: '2026-03-11T00:00:00.000Z',
  });
  const imported = await importPlatformSnapshot(request, snapshot, { reset: false });
  expect(imported.status).toBe(200);

  const reattached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(reattached.status).toBe(200);

  const firstReadResponse = await page.request.get('/api/platform/house-office');
  expect(firstReadResponse.ok()).toBe(true);
  const firstReadBody = await firstReadResponse.json();
  const secondReadResponse = await page.request.get('/api/platform/house-office');
  expect(secondReadResponse.ok()).toBe(true);
  const secondReadBody = await secondReadResponse.json();

  expect(secondReadBody?.data).toEqual(firstReadBody?.data);
  expect(firstReadBody?.data?.assignments || []).toHaveLength(1);
  expect(firstReadBody?.data?.assignments?.[0]).toMatchObject({
    focus: expectedRedactedFocus,
    sourceKind: 'trainer_result',
    sourceId: trainerResultId,
    sourceRefs: [
      expect.objectContaining({
        sourceKind: 'trainer_result',
        sourceId: trainerResultId,
        entryPath: '/api/platform/trainer',
        selection: {
          kind: 'trainer_result',
          trainerResultId,
          trainerJobId,
        },
      }),
    ],
  });

  const payloadText = JSON.stringify(firstReadBody?.data || {});
  for (const forbiddenField of forbiddenFields) {
    expect(payloadText).not.toContain(String(forbiddenField || ''));
  }

  const sessionIdBefore = await readWorkerSessionId(page);
  expect(sessionIdBefore).toBeTruthy();

  await page.getByTestId('house-open-office').click();
  await page.evaluate(async () => {
    if (typeof window.loadHouseOfficeSurface === 'function') {
      await window.loadHouseOfficeSurface({ skipContext: true });
    }
  });
  await expect(page.getByTestId('house-office-panel')).toBeVisible();
  await expect(page.getByTestId('house-office-summary')).toContainText('1 assignments');
  await expect(page.getByTestId('house-office-assignments')).toBeVisible();
  await expect(page.getByTestId('house-office-assignment-item')).toHaveCount(1);
  await expect(page.getByTestId('house-office-assignment-item').nth(0)).toContainText(expectedRedactedFocus);

  const panelText = await page.getByTestId('house-office-panel').innerText();
  for (const forbiddenField of forbiddenFields) {
    expect(panelText).not.toContain(String(forbiddenField || ''));
  }

  await page.getByTestId('house-office-assignment-item').nth(0).click();
  await expect(page.getByTestId('house-trainer-panel')).toBeVisible();
  await expect(page.getByTestId('house-team-summary')).toContainText('team_main');

  const sessionIdAfter = await readWorkerSessionId(page);
  expect(sessionIdAfter).toBe(sessionIdBefore);
});
