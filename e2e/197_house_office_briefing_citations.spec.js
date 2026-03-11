const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  createPlatformConfigVersion,
  createPlatformRun,
  createPlatformTrainerJob,
  exportPlatformSnapshot,
  getPlatformFixture,
  importPlatformSnapshot,
  ingestPlatformTraceRecords,
  promotePlatformConfigVersion,
  setPlatformRunStatus,
} = require('./helpers/unified_platform');

function buildConfigPayload(configVersionId) {
  return {
    configVersionId,
    teamId: 'team_main',
    displayVersion: `${configVersionId}@2026.03.11`,
    branch: 'house-office-briefing',
    status: 'candidate',
    componentRefs: {
      housePolicyVersionId: 'hpv_house_office_briefing_01',
      teamCompositionVersionId: 'tcv_house_office_briefing_01',
      agentConfigVersionIds: ['agv_house_office_briefing_01'],
      officePolicyVersionIds: [],
      experiencePresetVersionId: 'epv_house_office_briefing_01',
      integrationOverlayVersionIds: [],
      trainerPresetVersionId: 'tpv_house_office_briefing_01',
    },
  };
}

function hoursAgoIso(hours) {
  return new Date(Date.now() - (Number(hours || 0) * 60 * 60 * 1000)).toISOString();
}

function rewriteRowTimes(row, {
  createdHoursAgo,
  updatedHoursAgo = createdHoursAgo,
  completedHoursAgo = null,
} = {}) {
  if (!row || typeof row !== 'object') return;
  if (createdHoursAgo != null && Object.prototype.hasOwnProperty.call(row, 'created_at')) {
    row.created_at = hoursAgoIso(createdHoursAgo);
  }
  if (updatedHoursAgo != null && Object.prototype.hasOwnProperty.call(row, 'updated_at')) {
    row.updated_at = hoursAgoIso(updatedHoursAgo);
  }
  if (completedHoursAgo != null && Object.prototype.hasOwnProperty.call(row, 'completed_at')) {
    row.completed_at = hoursAgoIso(completedHoursAgo);
  }
}

async function seedHouseOfficeBriefingScenario(request) {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const configVersionId = 'cfg_house_office_briefing_01';

  const createdConfig = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-office-briefing-config-001',
    payload: buildConfigPayload(configVersionId),
  });
  expect(createdConfig.status).toBe(201);

  const promotedConfig = await promotePlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId,
    teamId: 'team_main',
    idempotencyKey: 'house-office-briefing-promote-001',
  });
  expect(promotedConfig.status).toBe(200);

  const recentArchiveRun = await createPlatformRun(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    experienceId: 'poker.season',
    teamId: 'team_main',
    configVersionId,
    entryMode: 'season_lock',
    idempotencyKey: 'house-office-briefing-run-recent-001',
  });
  expect(recentArchiveRun.status).toBe(201);
  const recentRunId = String(recentArchiveRun.json?.data?.runId || '');

  const olderArchiveRun = await createPlatformRun(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    experienceId: 'web.agent',
    teamId: 'team_main',
    configVersionId,
    entryMode: 'normal',
    idempotencyKey: 'house-office-briefing-run-older-001',
  });
  expect(olderArchiveRun.status).toBe(201);
  const olderRunId = String(olderArchiveRun.json?.data?.runId || '');

  const oldArchiveRun = await createPlatformRun(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    experienceId: 'web.agent',
    teamId: 'team_main',
    configVersionId,
    entryMode: 'normal',
    idempotencyKey: 'house-office-briefing-run-old-001',
  });
  expect(oldArchiveRun.status).toBe(201);
  const oldRunId = String(oldArchiveRun.json?.data?.runId || '');

  expect((await setPlatformRunStatus(request, olderRunId, 'completed'))?.ok).toBe(true);
  expect((await setPlatformRunStatus(request, oldRunId, 'completed'))?.ok).toBe(true);

  const pokerIngest = await ingestPlatformTraceRecords(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    runId: recentRunId,
    idempotencyKey: 'house-office-briefing-poker-ingest-001',
    records: [
      {
        ingestKey: 'house-office-briefing-poker-hand-001',
        sourceType: 'operator',
        payloadSchema: 'raw.poker.hand/v1',
        payload: {
          kind: 'hand_summary',
          handId: 'briefing-hand-001',
          winner: 'seat_1',
        },
      },
    ],
  });
  expect(pokerIngest.status).toBe(200);
  expect((await setPlatformRunStatus(request, recentRunId, 'completed'))?.ok).toBe(true);

  const trainerJob = await createPlatformTrainerJob(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-office-briefing-trainer-001',
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

  const exported = await exportPlatformSnapshot(request);
  expect(exported.status).toBe(200);
  const snapshot = JSON.parse(JSON.stringify(exported.json?.snapshot || {}));
  const tables = snapshot?.tables || {};

  const configRow = (tables.config_versions || []).find((row) => row.config_version_id === configVersionId);
  const bindingRow = (tables.team_config_bindings || []).find((row) => row.house_id === seededHouse.houseId && row.team_id === 'team_main');
  const trainerJobRow = (tables.trainer_jobs || [])[0] || null;
  const trainerResultRow = (tables.trainer_results || [])[0] || null;
  const recentRunRow = (tables.runs || []).find((row) => row.run_id === recentRunId);
  const olderRunRow = (tables.runs || []).find((row) => row.run_id === olderRunId);
  const oldRunRow = (tables.runs || []).find((row) => row.run_id === oldRunId);
  const trackEventRow = (tables.track_progress_events || [])[0] || null;

  expect(configRow).toBeTruthy();
  expect(bindingRow).toBeTruthy();
  expect(trainerJobRow).toBeTruthy();
  expect(trainerResultRow).toBeTruthy();
  expect(recentRunRow).toBeTruthy();
  expect(olderRunRow).toBeTruthy();
  expect(oldRunRow).toBeTruthy();
  expect(trackEventRow).toBeTruthy();

  rewriteRowTimes(configRow, { createdHoursAgo: 8, updatedHoursAgo: 5 });
  rewriteRowTimes(bindingRow, { createdHoursAgo: 5, updatedHoursAgo: 2 });
  rewriteRowTimes(trainerJobRow, { createdHoursAgo: 4, updatedHoursAgo: 3.5 });
  rewriteRowTimes(trainerResultRow, { createdHoursAgo: 3.5, updatedHoursAgo: 3 });
  rewriteRowTimes(recentRunRow, { createdHoursAgo: 6, updatedHoursAgo: 1.1, completedHoursAgo: 1 });
  rewriteRowTimes(olderRunRow, { createdHoursAgo: 14, updatedHoursAgo: 6.1, completedHoursAgo: 6 });
  rewriteRowTimes(oldRunRow, { createdHoursAgo: 40, updatedHoursAgo: 36.1, completedHoursAgo: 36 });
  rewriteRowTimes(trackEventRow, { createdHoursAgo: 0.5 });

  const imported = await importPlatformSnapshot(request, snapshot, { reset: true });
  expect(imported.status).toBe(200);

  return {
    seededHouse,
    recentRunId,
    olderRunId,
    oldRunId,
  };
}

async function readHouseOffice(page) {
  const response = await page.request.get('/api/platform/house-office');
  return {
    status: response.status(),
    json: await response.json(),
  };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M29.2: House Office briefing groups cited summaries inside the stable 24h window', async ({ page, request }) => {
  const fixture = await getPlatformFixture(request, 'house_office_briefing_seed');
  expect(fixture?.ok).toBe(true);
  const defaultWindowHours = Number(fixture?.fixture?.defaultWindowHours || 24);
  const expectedFamilies = Array.isArray(fixture?.fixture?.expectedFamilies) ? fixture.fixture.expectedFamilies : [];
  const scenario = await seedHouseOfficeBriefingScenario(request);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: scenario.seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const officeResponse = await readHouseOffice(page);
  expect(officeResponse.status).toBe(200);
  const officeData = officeResponse.json?.data || {};
  const briefingGroups = Array.isArray(officeData.briefing) ? officeData.briefing : [];
  expect(briefingGroups.map((group) => String(group?.family || ''))).toEqual(expectedFamilies);
  expect(Number(officeData?.sourceManifest?.counts?.briefingGroupCount || 0)).toBe(expectedFamilies.length);

  const briefingItems = briefingGroups.flatMap((group) => Array.isArray(group?.items) ? group.items : []);
  expect(Number(officeData?.sourceManifest?.counts?.briefingItemCount || 0)).toBe(briefingItems.length);
  expect(Number(officeData?.summary?.briefingItemCount || 0)).toBe(briefingItems.length);
  expect(briefingItems.length).toBeGreaterThanOrEqual(expectedFamilies.length + 1);

  const minimumWindowStart = Date.now() - (defaultWindowHours * 60 * 60 * 1000);
  briefingItems.forEach((item) => {
    expect(String(item?.title || '')).not.toBe('');
    expect(String(item?.summary || '')).not.toMatch(/prompt|token|callback|sealed/i);
    expect(new Date(String(item?.createdAt || '')).getTime()).toBeGreaterThanOrEqual(minimumWindowStart);
    expect(Array.isArray(item?.citations)).toBe(true);
    expect(item.citations.length).toBeGreaterThan(0);
    item.citations.forEach((citation) => {
      expect(String(citation?.sourceKind || '')).not.toBe('');
      expect(String(citation?.sourceId || '')).not.toBe('');
      expect(String(citation?.entryPath || '')).toMatch(/^\/api\/platform\//);
    });
  });

  const archiveGroup = briefingGroups.find((group) => group.family === 'archive');
  expect(archiveGroup).toBeTruthy();
  const archiveSourceIds = archiveGroup.items.map((item) => String(item?.citations?.[0]?.sourceId || ''));
  expect(archiveSourceIds).toEqual([scenario.recentRunId, scenario.olderRunId]);
  expect(archiveSourceIds).not.toContain(scenario.oldRunId);

  await page.getByTestId('house-open-office').click();
  await expect(page.getByTestId('house-office-panel')).toBeVisible();
  await expect(page.getByTestId('house-office-briefing')).toBeVisible();
  await expect(page.getByTestId('house-office-briefing-group')).toHaveCount(expectedFamilies.length);
  await expect(page.getByTestId('house-office-briefing-item')).toHaveCount(briefingItems.length);

  const archiveGroupNode = page.getByTestId('house-office-briefing-group').nth(0);
  await expect(archiveGroupNode).toContainText('Archive');
  await expect(archiveGroupNode.getByTestId('house-office-briefing-item').nth(0)).toContainText(scenario.recentRunId);
  await expect(archiveGroupNode.getByTestId('house-office-briefing-item').nth(1)).toContainText(scenario.olderRunId);
  await expect(page.getByTestId('house-office-briefing')).not.toContainText(scenario.oldRunId);
  await expect(page.getByTestId('house-office-briefing-citation')).toHaveCount(
    briefingItems.reduce((sum, item) => sum + item.citations.length, 0)
  );
});
