const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  createPlatformConfigVersion,
  createPlatformRun,
  getPlatformFixture,
  ingestPlatformTraceRecords,
  promotePlatformConfigVersion,
  readWorkerSessionId,
} = require('./helpers/unified_platform');

function buildConfigPayload(configVersionId) {
  return {
    configVersionId,
    teamId: 'team_main',
    displayVersion: `${configVersionId}@2026.03.11`,
    branch: 'house-office-ops-breadth',
    status: 'candidate',
    componentRefs: {
      housePolicyVersionId: 'hpv_house_office_ops_breadth_01',
      teamCompositionVersionId: 'tcv_house_office_ops_breadth_01',
      agentConfigVersionIds: ['agv_house_office_ops_breadth_01'],
      officePolicyVersionIds: [],
      experiencePresetVersionId: 'epv_house_office_ops_breadth_01',
      integrationOverlayVersionIds: [],
      trainerPresetVersionId: 'tpv_house_office_ops_breadth_01',
    },
  };
}

async function seedHouseOfficeOpsBreadthScenario(request) {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const configVersionId = 'cfg_house_office_ops_breadth_01';

  const createdConfig = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'house-office-ops-breadth-config-001',
    payload: buildConfigPayload(configVersionId),
  });
  expect(createdConfig.status).toBe(201);

  const promotedConfig = await promotePlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId,
    teamId: 'team_main',
    idempotencyKey: 'house-office-ops-breadth-promote-001',
  });
  expect(promotedConfig.status).toBe(200);

  const pokerRun = await createPlatformRun(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    experienceId: 'poker.season',
    teamId: 'team_main',
    configVersionId,
    entryMode: 'season_lock',
    idempotencyKey: 'house-office-ops-breadth-poker-run-001',
  });
  expect(pokerRun.status).toBe(201);
  const pokerRunId = String(pokerRun.json?.data?.runId || '').trim();

  const pokerIngest = await ingestPlatformTraceRecords(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    runId: pokerRunId,
    idempotencyKey: 'house-office-ops-breadth-poker-ingest-001',
    records: [
      {
        ingestKey: 'house-office-ops-breadth-poker-hand-001',
        sourceType: 'operator',
        payloadSchema: 'raw.poker.hand/v1',
        payload: {
          kind: 'hand_summary',
          handId: 'ops-breadth-poker-hand-001',
          winner: 'seat_1',
        },
      },
    ],
  });
  expect(pokerIngest.status).toBe(200);

  return {
    seededHouse,
    pokerRunId,
  };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M32.6: House Office reflects ops breadth for experiences and poker or web activity with exact links', async ({ page, request }) => {
  test.slow();
  test.setTimeout(180_000);

  const fixtureEnvelope = await getPlatformFixture(request, 'house_office_ops_breadth_seed');
  expect(fixtureEnvelope?.ok).toBe(true);
  const fixture = fixtureEnvelope?.fixture || {};
  const expectedBriefingFamilies = Array.isArray(fixture?.expectedBriefingFamilies) ? fixture.expectedBriefingFamilies : [];
  const expectedAttentionSourceKind = String(fixture?.expectedAttentionSourceKind || '').trim();
  const expectedAttentionSurface = String(fixture?.expectedAttentionSurface || '').trim();

  const scenario = await seedHouseOfficeOpsBreadthScenario(request);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: scenario.seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  let officeData = null;
  await expect.poll(async () => {
    const officeResponse = await page.request.get('/api/platform/house-office');
    expect(officeResponse.ok()).toBe(true);
    const officeBody = await officeResponse.json();
    officeData = officeBody?.data || {};
    const briefingGroups = Array.isArray(officeData?.briefing) ? officeData.briefing : [];
    const briefingByFamily = new Map(briefingGroups.map((group) => [String(group?.family || '').trim(), group]));
    const opsFamilies = expectedBriefingFamilies.filter((family) => briefingByFamily.has(String(family || '').trim()));
    return opsFamilies.length;
  }, { timeout: 8000 }).toBeGreaterThanOrEqual(2);

  const briefingGroups = Array.isArray(officeData?.briefing) ? officeData.briefing : [];
  const briefingByFamily = new Map(briefingGroups.map((group) => [String(group?.family || '').trim(), group]));
  const opsFamilies = expectedBriefingFamilies.filter((family) => briefingByFamily.has(String(family || '').trim()));

  const opsBriefingItems = opsFamilies.flatMap((family) => {
    const group = briefingByFamily.get(String(family || '').trim());
    return Array.isArray(group?.items) ? group.items : [];
  });
  expect(opsBriefingItems.length).toBeGreaterThanOrEqual(2);
  const opsSignalSelectionCoverage = opsBriefingItems.reduce((sum, item) => {
    const citations = Array.isArray(item?.citations) ? item.citations : [];
    const covered = citations.every((citation) => String(citation?.selection?.kind || '').trim());
    return sum + (covered ? 1 : 0);
  }, 0);
  expect(opsSignalSelectionCoverage).toBe(opsBriefingItems.length);

  const opsAttention = (Array.isArray(officeData?.attention) ? officeData.attention : []).find((item) => {
    return String(item?.sourceKind || '').trim() === expectedAttentionSourceKind
      && String(item?.deepLink?.surface || '').trim() === expectedAttentionSurface;
  }) || null;
  expect(opsAttention).toBeTruthy();
  expect(String(opsAttention?.sourceId || '').trim()).toBeTruthy();
  expect(String(opsAttention?.deepLink?.selection?.kind || '').trim()).toBe('trace');
  expect(String(opsAttention?.deepLink?.selection?.runId || '').trim()).toBe(String(opsAttention?.sourceId || '').trim());

  await page.getByTestId('house-open-office').click();
  await expect(page.getByTestId('house-office-panel')).toBeVisible();

  const initialWorkerSessionId = await readWorkerSessionId(page);
  const opsAttentionIndex = (Array.isArray(officeData?.attention) ? officeData.attention : []).findIndex((item) => {
    return String(item?.attentionId || '').trim() === String(opsAttention?.attentionId || '').trim();
  });
  expect(opsAttentionIndex).toBeGreaterThanOrEqual(0);

  await page.getByTestId('house-office-attention-item').nth(opsAttentionIndex).click();
  await expect(page.getByTestId('house-archive-panel')).toBeVisible();
  await expect(page.getByTestId('house-archive-detail')).toHaveAttribute('data-selected-run-id', String(opsAttention?.sourceId || ''));
  expect(await readWorkerSessionId(page)).toBe(initialWorkerSessionId);
});
