const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { installHouseWorker, listHouseWorkerSessions, spawnHouseWorker } = require('./helpers/house_workers');
const { resetPortalWebState } = require('./helpers/portal_web');
const { attachHouseToPageSession, getPlatformFixture } = require('./helpers/unified_platform');
const { waitForLiteApi } = require('./helpers/trainer');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M35.11: helper spawn guardrails reject unsafe or runaway requests without partial rows', async ({ page, request, browser }) => {
  const installFixture = await getPlatformFixture(request, 'worker_package_install_seed');
  const guardrailFixture = await getPlatformFixture(request, 'worker_spawn_guardrail_seed');
  const structureFixture = await getPlatformFixture(request, 'house_office_structure_seed');
  expect(installFixture?.ok).toBe(true);
  expect(guardrailFixture?.ok).toBe(true);
  expect(structureFixture?.ok).toBe(true);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);

  const houseA = await seedRecoverableTokenHouse(request);
  await attachHouseToPageSession(page, {
    houseId: houseA.houseId,
    teamId: 'team_main',
  });

  const installResult = await installHouseWorker(page.request, {
    registryEntityId: installFixture.fixture.registryEntityId,
  });
  expect(installResult.status).toBe(200);
  const deploymentId = String(installResult.json?.data?.deployment?.deploymentId || '').trim();
  const initialOfficeId = String(installResult.json?.data?.deployment?.officeId || '').trim();
  expect(deploymentId).toBeTruthy();

  const unsupported = await spawnHouseWorker(page.request, {
    deploymentId,
    task: 'Guardrail probe',
    reason: 'guardrail_probe',
    apiKey: 'sk-live-should-not-pass',
  });
  expect(unsupported.status).toBe(409);
  expect(String(unsupported.json?.error?.code || unsupported.json?.error || '')).toBe('UNSUPPORTED_OVERRIDE');

  let sessionsPayload = await listHouseWorkerSessions(page.request);
  expect(sessionsPayload.status).toBe(200);
  expect(sessionsPayload.json?.data?.sessions || []).toHaveLength(0);

  const friendContext = await browser.newContext();
  const friendPage = await friendContext.newPage();
  await friendPage.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(friendPage);
  const houseB = await seedRecoverableTokenHouse(friendPage.request);
  await attachHouseToPageSession(friendPage, {
    houseId: houseB.houseId,
    teamId: 'team_main',
  });
  const foreign = await spawnHouseWorker(friendPage.request, {
    deploymentId,
    task: 'Foreign scope probe',
    reason: 'guardrail_probe',
  });
  expect(foreign.status).toBe(404);
  expect(String(foreign.json?.error?.code || foreign.json?.error || '')).toBe('DEPLOYMENT_NOT_FOUND');
  await friendContext.close();

  await attachHouseToPageSession(page, {
    houseId: houseA.houseId,
    teamId: 'team_main',
  });

  const runawayMissingParent = await spawnHouseWorker(page.request, {
    deploymentId,
    task: 'Spawn another generation',
    reason: 'guardrail_probe',
    parentWorkerSessionId: 'hws_parent_probe',
  });
  expect(runawayMissingParent.status).toBe(404);
  expect(String(runawayMissingParent.json?.error?.code || runawayMissingParent.json?.error || '')).toBe('WORKER_SESSION_NOT_FOUND');

  const firstSpawn = await spawnHouseWorker(page.request, {
    deploymentId,
    task: 'Guardrail helper 1',
    reason: 'guardrail_probe',
  });
  expect([200, 201]).toContain(firstSpawn.status);
  const firstSessionId = String(
    firstSpawn.json?.data?.houseWorkerSessionId
    || firstSpawn.json?.data?.workerSessionId
    || ''
  ).trim();
  expect(firstSessionId).toBeTruthy();

  const blockedRunaway = await spawnHouseWorker(page.request, {
    deploymentId,
    task: 'Spawn another generation',
    reason: 'guardrail_probe',
    parentWorkerSessionId: firstSessionId,
  });
  expect(blockedRunaway.status).toBe(200);
  expect(blockedRunaway.json?.ok).toBe(true);
  expect(blockedRunaway.json?.data?.reused).toBe(true);
  expect(String(blockedRunaway.json?.data?.houseWorkerSessionId || '').trim()).toBe(firstSessionId);

  const concurrencyLimit = Number(guardrailFixture.fixture.maxActiveSessions || 3);
  const candidateOfficeIds = (Array.isArray(structureFixture.fixture?.offices) ? structureFixture.fixture.offices : [])
    .map((entry) => String(entry?.officeId || '').trim())
    .filter(Boolean)
    .filter((officeId) => officeId !== initialOfficeId);
  expect(candidateOfficeIds.length).toBeGreaterThanOrEqual(3);

  const childInstall = await installHouseWorker(page.request, {
    registryEntityId: installFixture.fixture.registryEntityId,
    officeId: candidateOfficeIds[0],
  });
  expect(childInstall.status).toBe(200);
  const childDeploymentId = String(childInstall.json?.data?.deployment?.deploymentId || '').trim();
  expect(childDeploymentId).toBeTruthy();

  const nestedChild = await spawnHouseWorker(page.request, {
    deploymentId: childDeploymentId,
    task: 'Nested child helper',
    reason: 'guardrail_probe',
    parentWorkerSessionId: firstSessionId,
  });
  expect([200, 201]).toContain(nestedChild.status);
  const nestedChildSessionId = String(
    nestedChild.json?.data?.houseWorkerSessionId
    || nestedChild.json?.data?.workerSessionId
    || ''
  ).trim();
  expect(nestedChildSessionId).toBeTruthy();

  const grandchildInstall = await installHouseWorker(page.request, {
    registryEntityId: installFixture.fixture.registryEntityId,
    officeId: candidateOfficeIds[1],
  });
  expect(grandchildInstall.status).toBe(200);
  const grandchildDeploymentId = String(grandchildInstall.json?.data?.deployment?.deploymentId || '').trim();
  expect(grandchildDeploymentId).toBeTruthy();

  const grandchildSpawn = await spawnHouseWorker(page.request, {
    deploymentId: grandchildDeploymentId,
    task: 'Spawn a third generation',
    reason: 'guardrail_probe',
    parentWorkerSessionId: nestedChildSessionId,
  });
  expect([200, 201]).toContain(grandchildSpawn.status);
  const grandchildSessionId = String(
    grandchildSpawn.json?.data?.houseWorkerSessionId
    || grandchildSpawn.json?.data?.workerSessionId
    || ''
  ).trim();
  expect(grandchildSessionId).toBeTruthy();

  const greatGrandchildInstall = await installHouseWorker(page.request, {
    registryEntityId: installFixture.fixture.registryEntityId,
    officeId: candidateOfficeIds[2],
  });
  expect(greatGrandchildInstall.status).toBe(200);
  const greatGrandchildDeploymentId = String(greatGrandchildInstall.json?.data?.deployment?.deploymentId || '').trim();
  expect(greatGrandchildDeploymentId).toBeTruthy();

  const blockedNestedRunaway = await spawnHouseWorker(page.request, {
    deploymentId: greatGrandchildDeploymentId,
    task: 'Spawn a fourth generation',
    reason: 'guardrail_probe',
    parentWorkerSessionId: grandchildSessionId,
  });
  expect(blockedNestedRunaway.status).toBe(409);
  expect(String(blockedNestedRunaway.json?.error?.code || blockedNestedRunaway.json?.error || '')).toBe('RUNAWAY_SPAWN_BLOCKED');

  sessionsPayload = await listHouseWorkerSessions(page.request);
  expect(sessionsPayload.status).toBe(200);
  const activeSessions = Array.isArray(sessionsPayload.json?.data?.sessions) ? sessionsPayload.json.data.sessions : [];
  expect(activeSessions).toHaveLength(concurrencyLimit);

  const overflow = await spawnHouseWorker(page.request, {
    deploymentId: greatGrandchildDeploymentId,
    task: 'One helper too many',
    reason: 'guardrail_probe',
  });
  expect(overflow.status).toBe(409);
  expect(String(overflow.json?.error?.code || overflow.json?.error || '')).toBe('OVER_CONCURRENCY_LIMIT');

  const sessionsAfterFailures = await listHouseWorkerSessions(page.request);
  expect(sessionsAfterFailures.status).toBe(200);
  expect(sessionsAfterFailures.json?.data?.sessions || []).toHaveLength(concurrencyLimit);
});
