const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi, setDeterministicLlm } = require('./helpers/trainer');
const { installHouseWorker, readHouseWorkerSessionsFromPage, readHouseWorkerSupervisorSnapshot } = require('./helpers/house_workers');
const { attachHouseToPageSession, getPlatformFixture } = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('T38.0: helper runtime profile fields produce applied runtime evidence instead of decorative echoing', async ({ page, request }) => {
  const installFixture = await getPlatformFixture(request, 'worker_package_install_seed');
  const profileFixture = await getPlatformFixture(request, 'worker_runtime_profile_seed');
  expect(installFixture?.ok).toBe(true);
  expect(profileFixture?.ok).toBe(true);

  const seededHouse = await seedRecoverableTokenHouse(request);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  await setDeterministicLlm(page);
  await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });

  const installResult = await installHouseWorker(page.request, {
    registryEntityId: installFixture.fixture.registryEntityId,
  });
  expect(installResult.status).toBe(200);

  await page.getByTestId('house-open-office').click();
  await page.getByTestId('house-office-deployment-advanced').first().locator('summary').click();
  await page.getByTestId('house-office-helper-brainProfileId-input').first().fill(String(profileFixture.fixture.brainProfileId || ''));
  await page.getByTestId('house-office-helper-workspaceSeedRef-input').first().fill(String(profileFixture.fixture.workspaceSeedRef || ''));
  await page.getByTestId('house-office-helper-configVersionId-input').first().fill(String(profileFixture.fixture.configVersionId || ''));
  await page.getByTestId('house-office-helper-loadoutId-input').first().fill(String(profileFixture.fixture.loadoutId || ''));
  await page.getByTestId('house-office-helper-start').first().click();

  await expect.poll(async () => {
    const sessionsPayload = await readHouseWorkerSessionsFromPage(page, { teamId: 'team_main' });
    const session = sessionsPayload?.json?.data?.sessions?.[0] || null;
    return {
      count: Array.isArray(sessionsPayload?.json?.data?.sessions) ? sessionsPayload.json.data.sessions.length : 0,
      hasAppliedProfile: !!session?.appliedRuntimeProfile,
      hasRuntimeBinding: !!session?.runtimeBinding?.workspacePath,
      hasFingerprint: !!session?.runtimeBinding?.llmFingerprint?.modelRef,
      leaseStatus: String(session?.leaseStatus || '').trim(),
    };
  }).toEqual({
    count: 1,
    hasAppliedProfile: true,
    hasRuntimeBinding: true,
    hasFingerprint: true,
    leaseStatus: 'active_detached',
  });

  const sessionsPayload = await readHouseWorkerSessionsFromPage(page, { teamId: 'team_main' });
  const session = sessionsPayload.json?.data?.sessions?.[0];
  expect(session?.requestedRuntimeProfile).toMatchObject({
    brainProfileId: profileFixture.fixture.brainProfileId,
    workspaceSeedRef: profileFixture.fixture.workspaceSeedRef,
    configVersionId: profileFixture.fixture.configVersionId,
    loadoutId: profileFixture.fixture.loadoutId,
  });
  expect(session?.appliedRuntimeProfile).toMatchObject({
    brainProfileId: profileFixture.fixture.expectedAppliedBrainProfileId,
    workspaceSeedRef: profileFixture.fixture.workspaceSeedRef,
    configVersionId: profileFixture.fixture.configVersionId,
    loadoutId: profileFixture.fixture.loadoutId,
  });
  expect(session?.runtimeProfile).toMatchObject(session?.appliedRuntimeProfile || {});
  expect(session?.runtimeBinding).toMatchObject({
    workspacePath: profileFixture.fixture.expectedWorkspacePath,
    requestedWorkspaceSeedRef: profileFixture.fixture.workspaceSeedRef,
    workspaceBindingMode: 'workspace_path',
    runtimeSessionId: expect.any(String),
  });
  expect(session?.runtimeBinding?.llmFingerprint).toMatchObject({
    provider: 'test-local',
    modelId: 'deterministic',
    modelRef: 'test-local/deterministic',
    useProxy: true,
  });
  expect(['ready', 'idle']).toContain(String(session?.status || '').trim());
  expect(String(session?.lastHeartbeatAt || '').trim()).toBeTruthy();
  expect(String(session?.leaseExpiresAt || '').trim()).toBeTruthy();

  const snapshot = await readHouseWorkerSupervisorSnapshot(page);
  expect(snapshot?.runtimeOwnerId).toBeTruthy();
  expect(snapshot?.helpers?.[0]?.requestedRuntimeProfile).toMatchObject({
    brainProfileId: profileFixture.fixture.brainProfileId,
  });
  expect(snapshot?.helpers?.[0]?.appliedRuntimeProfile).toMatchObject({
    brainProfileId: profileFixture.fixture.expectedAppliedBrainProfileId,
  });
  expect(snapshot?.helpers?.[0]?.runtimeBinding?.workspacePath).toBe(profileFixture.fixture.expectedWorkspacePath);
});
