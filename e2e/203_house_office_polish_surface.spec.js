const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  createPlatformConfigVersion,
  createPlatformRun,
  createPlatformTrainerJob,
  ingestPlatformTraceRecords,
  promotePlatformConfigVersion,
} = require('./helpers/unified_platform');

function buildConfigPayload(configVersionId) {
  return {
    configVersionId,
    teamId: 'team_main',
    displayVersion: `${configVersionId}@2026.03.11`,
    branch: 'house-office-polish',
    status: 'candidate',
    componentRefs: {
      housePolicyVersionId: 'hpv_house_office_polish_01',
      teamCompositionVersionId: 'tcv_house_office_polish_01',
      agentConfigVersionIds: ['agv_house_office_polish_01'],
      officePolicyVersionIds: [],
      experiencePresetVersionId: 'epv_house_office_polish_01',
      integrationOverlayVersionIds: [],
      trainerPresetVersionId: 'tpv_house_office_polish_01',
    },
  };
}

async function seedHouseOfficePolishScenario(request) {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const configVersionId = 'cfg_house_office_polish_01';

  const createdConfig = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-office-polish-config-001',
    payload: buildConfigPayload(configVersionId),
  });
  expect(createdConfig.status).toBe(201);

  const promotedConfig = await promotePlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId,
    teamId: 'team_main',
    idempotencyKey: 'house-office-polish-promote-001',
  });
  expect(promotedConfig.status).toBe(200);

  const pokerRun = await createPlatformRun(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    experienceId: 'poker.season',
    teamId: 'team_main',
    configVersionId,
    entryMode: 'season_lock',
    idempotencyKey: 'house-office-polish-run-001',
  });
  expect(pokerRun.status).toBe(201);
  const pokerRunId = String(pokerRun.json?.data?.runId || '');

  const pokerIngest = await ingestPlatformTraceRecords(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    runId: pokerRunId,
    idempotencyKey: 'house-office-polish-ingest-001',
    records: [
      {
        ingestKey: 'house-office-polish-hand-001',
        sourceType: 'operator',
        payloadSchema: 'raw.poker.hand/v1',
        payload: {
          kind: 'hand_summary',
          handId: 'polish-hand-001',
          winner: 'seat_1',
        },
      },
    ],
  });
  expect(pokerIngest.status).toBe(200);

  const trainerJob = await createPlatformTrainerJob(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-office-polish-trainer-001',
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
  const trainerJobId = String(trainerJob.json?.data?.trainerJobId || '');
  const trainerResultId = String(trainerJob.json?.data?.result?.trainerResultId || '');

  return {
    seededHouse,
    configVersionId,
    trainerJobId,
    trainerResultId,
  };
}

function officeMetricsFromPayload(data, officeId) {
  const offices = Array.isArray(data?.offices) ? data.offices : [];
  const staffAgents = Array.isArray(data?.staffAgents) ? data.staffAgents : [];
  const assignments = Array.isArray(data?.assignments) ? data.assignments : [];
  const presence = Array.isArray(data?.presence) ? data.presence : [];
  const office = offices.find((entry) => String(entry?.officeId || '') === String(officeId || '')) || null;
  const officePresence = presence.filter((entry) => String(entry?.officeId || '') === String(officeId || ''));
  const officeAssignments = assignments.filter((entry) => String(entry?.officeId || '') === String(officeId || ''));
  const officeStaff = staffAgents.filter((entry) => String(entry?.officeId || '') === String(officeId || ''));
  return {
    displayName: String(office?.displayName || office?.slug || officeId || '').trim(),
    purpose: String(office?.purpose || '').trim(),
    primaryFocus: String(officePresence[0]?.focus || officeAssignments[0]?.focus || '').trim(),
    presenceCount: officePresence.length,
    assignmentCount: officeAssignments.length,
    staffCount: officeStaff.length,
  };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('House Office polish keeps selected-office context and glanceable per-office metrics in sync with the overview payload', async ({ page, request }) => {
  const scenario = await seedHouseOfficePolishScenario(request);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);

  const attached = await attachHouseToPageSession(page, {
    houseId: scenario.seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const createAssignmentResponse = await page.request.post('/api/platform/house-office/assignments', {
    data: {
      officeId: 'office_fixture_ops',
      staffAgentId: 'staff_fixture_operator',
      focus: 'Review House Office operational readiness',
      sourceKind: 'trainer_job',
      sourceId: scenario.trainerJobId,
    },
    failOnStatusCode: false,
  });
  expect(createAssignmentResponse.status()).toBe(200);

  const overviewResponse = await page.request.get('/api/platform/house-office');
  expect(overviewResponse.ok()).toBe(true);
  const overviewBody = await overviewResponse.json();
  const overview = overviewBody?.data || {};
  const selectedWorkshop = officeMetricsFromPayload(overview, 'office_fixture_workshop');
  const selectedOps = officeMetricsFromPayload(overview, 'office_fixture_ops');
  const briefingGroups = Array.isArray(overview?.briefing) ? overview.briefing : [];
  expect(briefingGroups.length).toBeGreaterThan(0);

  await page.getByTestId('house-open-office').click();
  await expect(page.getByTestId('house-office-panel')).toBeVisible();
  await expect(page.getByTestId('house-office-selected-office')).toContainText(selectedWorkshop.displayName);
  await expect(page.getByTestId('house-office-selected-office')).toContainText(selectedWorkshop.purpose);
  await expect(page.getByTestId('house-office-selected-office')).toContainText(`${selectedWorkshop.staffCount} staff`);
  await expect(page.getByTestId('house-office-selected-office')).toContainText(`${selectedWorkshop.assignmentCount} assignments`);
  await expect(page.getByTestId('house-office-selected-office')).toContainText(`${selectedWorkshop.presenceCount} presence`);
  await expect(page.getByTestId('house-office-selected-office')).toContainText(selectedWorkshop.primaryFocus);

  const firstBriefingGroup = briefingGroups[0];
  await expect(page.getByTestId('house-office-briefing-group').nth(0)).toContainText(`${firstBriefingGroup.label} · ${firstBriefingGroup.items.length} item`);

  const opsMapOffice = page.locator('[data-testid="house-office-map-office"][data-office-id="office_fixture_ops"]');
  await expect(opsMapOffice).toContainText(`${selectedOps.presenceCount} presence`);
  await expect(opsMapOffice).toContainText(`${selectedOps.staffCount} staff`);
  await expect(opsMapOffice).toContainText(`${selectedOps.assignmentCount} assignment`);
  await expect(opsMapOffice).toContainText(selectedOps.primaryFocus);

  await opsMapOffice.click();
  await expect(page.getByTestId('house-office-selected-office')).toContainText(selectedOps.displayName);
  await expect(page.getByTestId('house-office-selected-office')).toContainText(selectedOps.purpose);
  await expect(page.getByTestId('house-office-selected-office')).toContainText(`${selectedOps.staffCount} staff`);
  await expect(page.getByTestId('house-office-selected-office')).toContainText(`${selectedOps.assignmentCount} assignment`);
  await expect(page.getByTestId('house-office-selected-office')).toContainText(`${selectedOps.presenceCount} presence`);
  await expect(page.getByTestId('house-office-selected-office')).toContainText(selectedOps.primaryFocus);

  const layout = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
  }));
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
});
