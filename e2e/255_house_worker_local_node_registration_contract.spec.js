const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  getHouseWorkerProviderReadiness,
  heartbeatHouseWorkerLocalNode,
  registerHouseWorkerLocalNode,
} = require('./helpers/house_workers');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const { attachHouseToPageSession } = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('T42.6: desktop local nodes register, heartbeat, and publish provider readiness truth', async ({ page, request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });

  const localNodeId = 'desktop_node_main';
  const registrationCapabilitySet = {
    platformTargets: ['macos', 'linux'],
    maxConcurrentHelpers: 2,
    supportsBrowserTransfer: true,
    supportsPersistentExecution: true,
  };

  const registerResult = await registerHouseWorkerLocalNode(page.request, {
    localNodeId,
    displayLabel: 'Robin Desktop Node',
    capabilitySet: registrationCapabilitySet,
    leaseTtlMs: 300,
  });
  expect(registerResult.status).toBe(200);
  expect(registerResult.json?.ok).toBe(true);
  expect(registerResult.json?.data?.heartbeatPath).toBe('/api/platform/house-workers/local-node/heartbeat');
  expect(registerResult.json?.data?.providerReadinessPath).toBe('/api/platform/house-workers/provider-readiness');
  const heartbeatToken = String(registerResult.json?.data?.heartbeatToken || '').trim();
  expect(heartbeatToken).toMatch(/^hwn_[a-f0-9]+$/);

  const duplicateResult = await registerHouseWorkerLocalNode(page.request, {
    localNodeId,
    displayLabel: 'Duplicate Desktop Node',
    capabilitySet: registrationCapabilitySet,
  });
  expect(duplicateResult.status).toBe(409);
  expect(duplicateResult.json?.error?.code).toBe('EXECUTOR_NODE_ALREADY_REGISTERED');

  const initialReadiness = await getHouseWorkerProviderReadiness(page.request, { teamId: 'team_main' });
  expect(initialReadiness.status).toBe(200);
  expect(initialReadiness.json?.ok).toBe(true);
  expect(initialReadiness.json?.data?.schema).toBe('agent-town-house-worker-provider-readiness/v1');

  const providers = Array.isArray(initialReadiness.json?.data?.providers) ? initialReadiness.json.data.providers : [];
  const localNodeProvider = providers.find((entry) => String(entry?.executorKind || '').trim() === 'desktop_local_node') || null;
  expect(localNodeProvider).toBeTruthy();
  expect(localNodeProvider?.status).toBe('ready');
  expect(localNodeProvider?.nodeCount).toBe(1);
  expect(localNodeProvider?.readyNodeCount).toBe(1);
  expect(localNodeProvider?.staleNodeCount).toBe(0);
  const initialNode = Array.isArray(localNodeProvider?.nodes) ? localNodeProvider.nodes[0] || null : null;
  expect(initialNode).toMatchObject({
    localNodeId,
    displayLabel: 'Robin Desktop Node',
    availabilityState: 'ready',
    leaseStatus: 'active',
    capabilitySet: {
      runtimeKinds: ['desktop_local_node'],
      platformTargets: ['linux', 'macos'],
      maxConcurrentHelpers: 2,
      supportsBrowserTransfer: true,
      supportsPersistentExecution: true,
    },
  });
  const firstHeartbeatAt = Date.parse(String(initialNode?.lastHeartbeatAt || ''));
  const firstLeaseExpiresAt = Date.parse(String(initialNode?.leaseExpiresAt || ''));
  expect(Number.isFinite(firstHeartbeatAt)).toBe(true);
  expect(Number.isFinite(firstLeaseExpiresAt)).toBe(true);
  expect(firstLeaseExpiresAt).toBeGreaterThan(firstHeartbeatAt);

  await page.waitForTimeout(50);

  const heartbeatResult = await heartbeatHouseWorkerLocalNode(page.request, {
    localNodeId,
    capabilitySet: {
      ...registrationCapabilitySet,
      maxConcurrentHelpers: 3,
    },
    leaseTtlMs: 300,
  }, heartbeatToken);
  expect(heartbeatResult.status).toBe(200);
  expect(heartbeatResult.json?.ok).toBe(true);
  const heartbeatNode = heartbeatResult.json?.data?.node || null;
  expect(heartbeatNode?.availabilityState).toBe('ready');
  expect(heartbeatNode?.capabilitySet?.maxConcurrentHelpers).toBe(3);
  expect(Date.parse(String(heartbeatNode?.lastHeartbeatAt || ''))).toBeGreaterThan(firstHeartbeatAt);
  expect(Date.parse(String(heartbeatNode?.leaseExpiresAt || ''))).toBeGreaterThan(firstLeaseExpiresAt);

  let staleReadiness = null;
  await expect.poll(async () => {
    const payload = await getHouseWorkerProviderReadiness(page.request, { teamId: 'team_main' });
    const nextProviders = Array.isArray(payload.json?.data?.providers) ? payload.json.data.providers : [];
    const nextProvider = nextProviders.find((entry) => String(entry?.executorKind || '').trim() === 'desktop_local_node') || null;
    const nextNode = Array.isArray(nextProvider?.nodes) ? nextProvider.nodes[0] || null : null;
    staleReadiness = {
      status: payload.status,
      topLevelStatus: String(payload.json?.data?.status || '').trim(),
      providerStatus: String(nextProvider?.status || '').trim(),
      readyNodeCount: Number(nextProvider?.readyNodeCount || 0),
      staleNodeCount: Number(nextProvider?.staleNodeCount || 0),
      availabilityState: String(nextNode?.availabilityState || '').trim(),
      leaseStatus: String(nextNode?.leaseStatus || '').trim(),
    };
    return staleReadiness;
  }, {
    timeout: 5000,
    intervals: [100, 200, 400],
    message: 'expected provider readiness to fail closed after the local-node lease expired',
  }).toEqual({
    status: 200,
    topLevelStatus: 'action_required',
    providerStatus: 'action_required',
    readyNodeCount: 0,
    staleNodeCount: 1,
    availabilityState: 'stale',
    leaseStatus: 'stale',
  });
  expect(staleReadiness).toEqual({
    status: 200,
    topLevelStatus: 'action_required',
    providerStatus: 'action_required',
    readyNodeCount: 0,
    staleNodeCount: 1,
    availabilityState: 'stale',
    leaseStatus: 'stale',
  });

  const localNodeRegistrationSuccessCount = localNodeProvider?.readyNodeCount || 0;
  const duplicateLocalNodeIdentityCount = Math.max(0, Number(localNodeProvider?.nodeCount || 0) - 1);
  const providerTruthChecks = [
    initialNode?.localNodeId === localNodeId,
    initialNode?.displayLabel === 'Robin Desktop Node',
    Array.isArray(initialNode?.capabilitySet?.platformTargets)
      && initialNode.capabilitySet.platformTargets.join(',') === 'linux,macos',
    Number(initialNode?.capabilitySet?.maxConcurrentHelpers || 0) === 2,
    initialNode?.availabilityState === 'ready',
    localNodeProvider?.readyNodeCount === 1,
    Number(initialReadiness.json?.data?.counts?.localNodeCount || 0) === 1,
  ];
  const providerReadinessTruthCoverage = Math.round(
    (providerTruthChecks.filter(Boolean).length / providerTruthChecks.length) * 100
  );
  expect({
    localNodeRegistrationSuccessCount,
    duplicateLocalNodeIdentityCount,
    providerReadinessTruthCoverage,
  }).toEqual({
    localNodeRegistrationSuccessCount: 1,
    duplicateLocalNodeIdentityCount: 0,
    providerReadinessTruthCoverage: 100,
  });
});
