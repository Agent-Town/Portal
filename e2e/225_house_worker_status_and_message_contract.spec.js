const { test, expect } = require('@playwright/test');

const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { installHouseWorker, listHouseWorkerSessions } = require('./helpers/house_workers');
const { resetPortalWebState } = require('./helpers/portal_web');
const { attachHouseToPageSession, getPlatformFixture } = require('./helpers/unified_platform');
const { waitForLiteApi, setDeterministicLlm } = require('./helpers/trainer');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M35.10: helper status and message targeting stay understandable for users', async ({ page, request }) => {
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
  const expectedLabel = String(installResult.json?.data?.deployment?.displayName || 'House Helper').trim();

  await page.getByTestId('house-open-office').click();
  await page.getByTestId('house-office-helper-start').first().click();

  const sessionCard = page.getByTestId('house-office-worker-session-item').first();
  await expect(sessionCard).toBeVisible();
  await expect(sessionCard).toContainText(expectedLabel);
  await expect(sessionCard.getByTestId('house-office-worker-session-status')).toContainText(/Ready|Working|Idle/);

  const nextMessage = 'Reply with one short status update for the front desk.';
  await sessionCard.getByTestId('house-office-worker-session-message-input').fill(nextMessage);
  await sessionCard.getByTestId('house-office-worker-session-ask').click();

  await expect(sessionCard.getByTestId('house-office-worker-session-reply')).not.toContainText('No reply yet.');

  const sessionsPayload = await listHouseWorkerSessions(page.request);
  expect(sessionsPayload.status).toBe(200);
  const session = sessionsPayload.json?.data?.sessions?.[0];
  expect(session).toBeTruthy();

  const visibleStatus = await sessionCard.getByTestId('house-office-worker-session-status').textContent();
  const visibleReply = await sessionCard.getByTestId('house-office-worker-session-reply').textContent();

  expect(String(visibleStatus || '')).toMatch(/Ready|Working|Idle/);
  expect(String(visibleReply || '')).toContain(String(session?.latestReply || '').trim());

  const eventKinds = Array.isArray(session?.recentEvents)
    ? session.recentEvents.map((entry) => String(entry?.eventKind || '').trim())
    : [];
  expect(eventKinds).toEqual(expect.arrayContaining(['task_message', 'assistant_reply']));
  expect(String(session?.deploymentLabel || session?.displayName || '').trim()).toBe(expectedLabel);
});
