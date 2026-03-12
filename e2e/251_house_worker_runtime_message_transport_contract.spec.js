const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  installHouseWorker,
  listHouseWorkerRuntimeInstances,
  listHouseWorkerSessions,
  listHouseWorkerTransportMessages,
} = require('./helpers/house_workers');
const { resetPortalWebState } = require('./helpers/portal_web');
const { waitForLiteApi, setDeterministicLlm } = require('./helpers/trainer');
const { attachHouseToPageSession, getPlatformFixture } = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('T42.2: helper messages use durable transport state with ordered acknowledgement cursors', async ({ page, request }) => {
  const installFixture = await getPlatformFixture(request, 'worker_package_install_seed');
  expect(installFixture?.ok).toBe(true);

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
  await page.getByTestId('house-office-helper-start').first().click();

  await expect.poll(async () => {
    const sessionsPayload = await listHouseWorkerSessions(page.request, { teamId: 'team_main' });
    return Number(sessionsPayload?.json?.data?.sessions?.length || 0);
  }).toBe(1);

  const sessionsPayload = await listHouseWorkerSessions(page.request, { teamId: 'team_main' });
  const session = sessionsPayload?.json?.data?.sessions?.[0] || null;
  expect(session).toBeTruthy();
  let initialTransportMessages = [];
  await expect.poll(async () => {
    const settledSessionsPayload = await listHouseWorkerSessions(page.request, { teamId: 'team_main' });
    const settledSession = settledSessionsPayload?.json?.data?.sessions?.[0] || null;
    const transportPayload = await listHouseWorkerTransportMessages(page.request, {
      teamId: 'team_main',
      houseWorkerSessionId: String(session?.houseWorkerSessionId || '').trim(),
    });
    const transportMessages = Array.isArray(transportPayload?.json?.data?.transportMessages)
      ? transportPayload.json.data.transportMessages
      : [];
    initialTransportMessages = transportMessages;
    const lastMessage = transportMessages[transportMessages.length - 1] || null;
    return Boolean(
      String(settledSession?.latestReply || '').trim()
      && transportMessages.length >= 2
      && String(lastMessage?.direction || '').trim() === 'from_runtime'
      && String(lastMessage?.deliveryStatus || '').trim() === 'acknowledged'
    );
  }, {
    message: 'expected startup helper exchange to settle before measuring transport deltas',
  }).toBe(true);
  const initialTransportOrder = initialTransportMessages.reduce((maxOrder, entry) => {
    return Math.max(maxOrder, Number(entry?.transportOrder || 0) || 0);
  }, 0);

  const result = await page.evaluate(async ({ houseWorkerSessionId, message }) => {
    const api = window.__agentTownHouseWorkerSupervisor;
    if (!api || typeof api.message !== 'function') {
      throw new Error('HOUSE_WORKER_SUPERVISOR_API_MISSING');
    }
    return await api.message({ houseWorkerSessionId, message, actor: 'human' });
  }, {
    houseWorkerSessionId: String(session?.houseWorkerSessionId || '').trim(),
    message: 'Please confirm transport durability in one short sentence.',
  });
  expect(result?.ok).toBe(true);
  expect(String(result?.reply || '').trim()).toBeTruthy();

  await expect.poll(async () => {
    const transportPayload = await listHouseWorkerTransportMessages(page.request, {
      teamId: 'team_main',
      houseWorkerSessionId: String(session?.houseWorkerSessionId || '').trim(),
    });
    const transportMessages = Array.isArray(transportPayload?.json?.data?.transportMessages)
      ? transportPayload.json.data.transportMessages
      : [];
    return transportMessages.filter((entry) => (Number(entry?.transportOrder || 0) || 0) > initialTransportOrder).length;
  }).toBe(2);

  const transportPayload = await listHouseWorkerTransportMessages(page.request, {
    teamId: 'team_main',
    houseWorkerSessionId: String(session?.houseWorkerSessionId || '').trim(),
  });
  const runtimeInstancesPayload = await listHouseWorkerRuntimeInstances(page.request, { teamId: 'team_main' });
  const transportMessages = Array.isArray(transportPayload?.json?.data?.transportMessages)
    ? transportPayload.json.data.transportMessages
    : [];
  const newTransportMessages = transportMessages.filter((entry) => (Number(entry?.transportOrder || 0) || 0) > initialTransportOrder);
  const runtimeInstance = runtimeInstancesPayload?.json?.data?.runtimeInstances?.[0] || null;

  expect(transportPayload.status).toBe(200);
  expect(newTransportMessages).toHaveLength(2);
  expect(newTransportMessages[0]).toMatchObject({
    direction: 'to_runtime',
    deliveryStatus: 'acknowledged',
  });
  expect(newTransportMessages[1]).toMatchObject({
    direction: 'from_runtime',
    deliveryStatus: 'acknowledged',
  });
  expect(String(newTransportMessages[0]?.message || '').trim()).toContain('Please confirm transport durability');
  expect(String(newTransportMessages[1]?.message || '').trim()).toBe(String(result?.reply || '').trim());

  expect(runtimeInstance).toMatchObject({
    outboxCursor: String(newTransportMessages[0]?.transportMessageId || '').trim(),
    inboxCursor: String(newTransportMessages[1]?.transportMessageId || '').trim(),
  });
});
