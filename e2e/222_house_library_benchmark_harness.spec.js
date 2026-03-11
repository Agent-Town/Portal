const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  callPageJson,
  getPlatformFixture,
  getPlatformInspector,
  ingestPlatformPokerOperatorTrace,
  seedPlatformConfigVersion,
  seedPlatformSealedContext,
} = require('./helpers/unified_platform');

const APPROVED_PUBLICATION_ID = 'appr_fixture_library_publish_approved_01';

async function collectLibraryCopyAudit(page) {
  return await page.evaluate(() => {
    const panel = document.querySelector('[data-testid="house-library-panel"]');
    const headingTexts = panel
      ? Array.from(panel.querySelectorAll('h2, h3')).map((node) => String(node.textContent || '').trim()).filter(Boolean)
      : [];
    return {
      headingTexts,
      panelText: panel ? String(panel.innerText || '') : '',
    };
  });
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M30.10: House Library benchmark harness publishes a deterministic scorecard and stable hash', async ({ page, request }) => {
  const benchmarkFixture = await getPlatformFixture(request, 'library_benchmark_seed');
  expect(benchmarkFixture?.ok).toBe(true);
  const expectedMetrics = benchmarkFixture?.fixture?.expectedMetrics || {};

  const seededHouse = await seedRecoverableTokenHouse(request);
  const seededConfig = await seedPlatformConfigVersion(request, {
    configVersionId: 'cfg_house_library_benchmark_01',
    houseId: seededHouse.houseId,
    teamId: 'team_main',
    status: 'active',
  });
  expect(seededConfig?.ok).toBe(true);

  const pokerFixture = await getPlatformFixture(request, 'poker_operator_seed_jsonl');
  expect(pokerFixture?.ok).toBe(true);
  const ingest = await ingestPlatformPokerOperatorTrace(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    teamId: 'team_main',
    idempotencyKey: 'library-benchmark-ingest-001',
    records: Array.isArray(pokerFixture?.fixture?.records) ? pokerFixture.fixture.records : [],
  });
  expect(ingest.status).toBe(201);
  const traceId = String(ingest.json?.data?.traceId || '');
  const runId = String(ingest.json?.data?.runId || '');

  const seededSeal = await seedPlatformSealedContext(request, {
    houseId: seededHouse.houseId,
    traceId,
    runId,
    releasePolicy: 'manual',
    status: 'active',
  });
  expect(seededSeal.status).toBe(200);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);

  const noteResp = await page.request.post('/api/platform/library/items', {
    headers: {
      'Idempotency-Key': 'library-benchmark-note-001',
    },
    data: {
      itemType: 'library_note',
      title: 'Benchmark Note',
      summary: 'Local benchmark note.',
      contentText: 'Keep the benchmark scope tight and visible.',
      sourceKind: 'user_note',
      sourceRef: 'benchmark:note:001',
    },
    failOnStatusCode: false,
  });
  expect(noteResp.status()).toBe(201);
  const noteItemId = String((await noteResp.json())?.data?.item?.libraryItemId || '');
  expect(noteItemId).toMatch(/^lib_/);

  const captureResp = await page.request.post('/api/platform/library/conversation-artifacts', {
    headers: {
      'Idempotency-Key': 'library-benchmark-capture-001',
    },
    data: {
      title: 'Benchmark Capture',
      messageIds: ['msg_benchmark_01'],
      messages: [
        { messageId: 'msg_benchmark_01', role: 'user', text: 'Capture this benchmark reminder.' },
      ],
    },
    failOnStatusCode: false,
  });
  expect(captureResp.status()).toBe(201);
  const conversationItemId = String((await captureResp.json())?.data?.item?.libraryItemId || '');
  expect(conversationItemId).toMatch(/^lib_/);

  const scopeResp = await page.request.post('/api/platform/library/scope', {
    data: {
      title: 'Benchmark Satchel',
      scopeKind: 'satchel',
      itemIds: [conversationItemId, noteItemId],
    },
    failOnStatusCode: false,
  });
  expect(scopeResp.status()).toBe(200);

  const sealedPromotionResp = await page.request.post('/api/platform/library/promotions', {
    headers: {
      'Idempotency-Key': 'library-benchmark-sealed-promotion-001',
    },
    data: {
      sourceKind: 'trace',
      sourceRef: traceId,
    },
    failOnStatusCode: false,
  });
  expect(sealedPromotionResp.status()).toBe(201);

  const importResp = await page.request.post('/api/platform/library/imports', {
    headers: {
      'Idempotency-Key': 'library-benchmark-import-001',
    },
    data: {
      registryEntityId: 'reg_atlas_skill_01',
    },
    failOnStatusCode: false,
  });
  expect(importResp.status()).toBe(201);

  const publishResp = await page.request.post('/api/platform/library/publications', {
    headers: {
      'Idempotency-Key': 'library-benchmark-publish-001',
    },
    data: {
      libraryItemId: noteItemId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
    failOnStatusCode: false,
  });
  expect(publishResp.status()).toBe(201);

  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  const copyAudit = await collectLibraryCopyAudit(page);

  const runA = await callPageJson(page, '/api/platform/library/benchmarks/run', {
    method: 'POST',
    data: { copyAudit },
  });
  const runB = await callPageJson(page, '/api/platform/library/benchmarks/run', {
    method: 'POST',
    data: { copyAudit },
  });
  const runC = await callPageJson(page, '/api/platform/library/benchmarks/run', {
    method: 'POST',
    data: { copyAudit },
  });

  [runA, runB, runC].forEach((run) => {
    expect(run.status).toBe(200);
    expect(run.json?.data?.metrics).toEqual(expectedMetrics);
    expect(String(run.json?.data?.outputHash || '')).toMatch(/^sha256:/);
  });
  expect(String(runA.json?.data?.outputHash || '')).toBe(String(runB.json?.data?.outputHash || ''));
  expect(String(runB.json?.data?.outputHash || '')).toBe(String(runC.json?.data?.outputHash || ''));

  const benchmarkInspector = await getPlatformInspector(request, 'benchmarks');
  expect(benchmarkInspector.status).toBe(200);
  expect(benchmarkInspector.json?.data?.metrics).toEqual(expectedMetrics);
  expect(String(benchmarkInspector.json?.data?.outputHash || '')).toBe(String(runC.json?.data?.outputHash || ''));
});
