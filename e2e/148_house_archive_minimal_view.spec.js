const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { waitForLiteApi, waitForRuntimeSessionContext } = require('./helpers/trainer');
const {
  createPlatformRun,
  ingestPlatformTraceRecords,
  seedPlatformConfigVersion,
} = require('./helpers/unified_platform');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

async function attachHouseToPageSession(page, houseId) {
  return await page.evaluate(async ({ nextHouseId, testResetToken }) => {
    const response = await fetch('/__test__/session/attach-house', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        'x-test-reset': testResetToken,
      },
      body: JSON.stringify({ houseId: nextHouseId }),
    });
    return {
      status: response.status,
      json: await response.json(),
    };
  }, {
    nextHouseId: houseId,
    testResetToken: resetToken,
  });
}

async function readRuntimeWorkerSessionId(page) {
  return await waitForRuntimeSessionContext(page);
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M19.17: House Archive opens inside the hub shell, preserves worker continuity, and shows deterministic counters', async ({ page, request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_archive_seed_01',
    houseId: seededHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  expect(seededConfig?.ok).toBe(true);

  const runA = await createPlatformRun(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId: 'cfg_house_archive_seed_01',
    idempotencyKey: 'house-archive-run-a-001',
  });
  expect(runA.status).toBe(201);
  const runAId = String(runA.json?.data?.runId || '');

  const ingestA = await ingestPlatformTraceRecords(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    runId: runAId,
    idempotencyKey: 'house-archive-ingest-a-001',
    records: [
      {
        ingestKey: 'worker_a:1',
        sourceType: 'worker',
        payloadSchema: 'raw.web.observation/v1',
        payload: { kind: 'navigate', url: 'https://example.com/a' },
      },
      {
        ingestKey: 'worker_a:1',
        sourceType: 'worker',
        payloadSchema: 'raw.web.observation/v1',
        payload: { kind: 'navigate', url: 'https://example.com/a' },
      },
      {
        ingestKey: 'worker_a:invalid',
        sourceType: 'worker',
        payloadSchema: '',
        payload: { kind: 'invalid' },
      },
    ],
  });
  expect(ingestA.status).toBe(200);
  expect(ingestA.json?.data?.accepted).toBe(1);
  expect(ingestA.json?.data?.ignored).toBe(1);
  expect(ingestA.json?.data?.rejected).toBe(1);
  const traceAId = String(ingestA.json?.data?.traceId || '');

  const runB = await createPlatformRun(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId: 'cfg_house_archive_seed_01',
    idempotencyKey: 'house-archive-run-b-001',
  });
  expect(runB.status).toBe(201);
  const runBId = String(runB.json?.data?.runId || '');

  const ingestB = await ingestPlatformTraceRecords(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    runId: runBId,
    idempotencyKey: 'house-archive-ingest-b-001',
    records: [
      {
        ingestKey: 'worker_b:1',
        sourceType: 'worker',
        payloadSchema: 'raw.web.observation/v1',
        payload: { kind: 'click', selector: '#launch' },
      },
    ],
  });
  expect(ingestB.status).toBe(200);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, seededHouse.houseId);
  expect(attached.status).toBe(200);

  await expect(page.locator('#districtModalBackdrop:not(.is-hidden)')).toHaveCount(1);
  await expect(page.getByTestId('house-console-panel')).toBeVisible();
  const initialSessionId = await readRuntimeWorkerSessionId(page);

  await page.getByTestId('house-open-archive').click();
  await expect(page.getByTestId('house-archive-panel')).toBeVisible();
  await expect(page.locator('#houseArchiveList button')).toHaveCount(2);
  await page.locator(`#houseArchiveList button[data-trace-id="${traceAId}"]`).click();
  await expect(page.getByTestId('house-archive-detail')).toContainText(traceAId);
  await expect(page.getByTestId('house-archive-detail')).toContainText('accepted 1');
  await expect(page.getByTestId('house-archive-detail')).toContainText('ignored 1');
  await expect(page.getByTestId('house-archive-detail')).toContainText('rejected 1');
  const afterOpenSessionId = await readRuntimeWorkerSessionId(page);
  expect(afterOpenSessionId).toBe(initialSessionId);
});

test('M19.17: House Archive empty state is deterministic', async ({ page, request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, seededHouse.houseId);
  expect(attached.status).toBe(200);

  await page.getByTestId('house-open-archive').click();
  await expect(page.getByTestId('house-archive-empty')).toContainText('No canonical traces archived yet.');
});
