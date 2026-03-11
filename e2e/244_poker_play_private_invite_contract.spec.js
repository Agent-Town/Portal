const { test, expect } = require('@playwright/test');
const {
  resetPortalWebState,
  seedStreamflowLocks,
} = require('./helpers/portal_web');
const {
  bindPageSession,
  browserJson,
  verifyStreamflowAndFundOil,
} = require('./helpers/poker_play');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M23.16: invite-only tables stay out of public discovery and require a valid invite before pre-join reads or seats', async ({ browser, request }) => {
  const userA = {
    address: 'So1anaMockCashA111111111111111111111111111111',
    houseId: 'house_invite_a',
    streamId: 'stream-invite-a',
  };
  const userB = {
    address: 'So1anaMockCashB111111111111111111111111111111',
    houseId: 'house_invite_b',
    streamId: 'stream-invite-b',
  };

  await seedStreamflowLocks(request, {
    locks: [
      {
        address: userA.address,
        streamId: userA.streamId,
        tokenSymbol: '$AGENTTOWN',
        locked: true,
        lockedAmountAtomic: '2500000',
      },
      {
        address: userB.address,
        streamId: userB.streamId,
        tokenSymbol: '$AGENTTOWN',
        locked: true,
        lockedAmountAtomic: '2500000',
      },
    ],
  });

  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  await pageA.goto('/');
  await bindPageSession(pageA, userA);
  await verifyStreamflowAndFundOil(pageA, request, {
    address: userA.address,
    streamId: userA.streamId,
  });

  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  await pageB.goto('/');
  await bindPageSession(pageB, userB);
  await verifyStreamflowAndFundOil(pageB, request, {
    address: userB.address,
    streamId: userB.streamId,
  });

  let resp = await browserJson(pageA, '/api/poker/play/tables', {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userA.address },
    data: {
      accessMode: 'invite_only',
      tableType: 'cash',
      title: 'Invite Cash Contract',
      smallBlindOil: 15,
      bigBlindOil: 30,
      buyInOil: 300,
      seatNumber: 1,
      displayName: 'Invite Alpha',
    },
  });
  expect(resp.ok).toBe(true);
  const created = resp.body?.data || {};
  const tableId = String(created?.table?.tableId || '');
  const inviteCode = String(created?.table?.access?.inviteCode || '');
  const inviteJoinPath = String(created?.table?.access?.inviteJoinPath || '');
  expect(tableId).toBeTruthy();
  expect(created?.table?.access?.mode).toBe('invite_only');
  expect(created?.table?.access?.inviteOnly).toBe(true);
  expect(created?.table?.access?.viewerCanShareInvite).toBe(true);
  expect(inviteCode).toMatch(/^PK-/);
  expect(inviteJoinPath).toContain(`inviteCode=${encodeURIComponent(inviteCode)}`);

  resp = await browserJson(pageA, '/api/poker/play/tables', {
    headers: { 'x-wallet-solana-address': userA.address },
  });
  expect(resp.ok).toBe(true);
  expect((resp.body?.data?.items || []).some((item) => String(item?.tableId || '') === tableId)).toBe(true);

  resp = await browserJson(pageB, '/api/poker/play/tables', {
    headers: { 'x-wallet-solana-address': userB.address },
  });
  expect(resp.ok).toBe(true);
  expect((resp.body?.data?.items || []).some((item) => String(item?.tableId || '') === tableId)).toBe(false);

  resp = await browserJson(pageB, '/api/poker/play/rail');
  expect(resp.ok).toBe(true);
  expect((resp.body?.data?.items || []).some((item) => String(item?.tableId || '') === tableId)).toBe(false);

  resp = await browserJson(pageB, `/api/poker/play/tables/${encodeURIComponent(tableId)}`, {
    headers: { 'x-wallet-solana-address': userB.address },
  });
  expect(resp.ok).toBe(false);
  expect(resp.status).toBe(403);
  expect(resp.body?.error?.code).toBe('POKER_PLAY_INVITE_REQUIRED');

  resp = await browserJson(pageB, `/api/poker/play/tables/${encodeURIComponent(tableId)}/sit`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userB.address },
    data: {
      seatNumber: 2,
      displayName: 'Invite Bravo',
      buyInOil: 300,
    },
  });
  expect(resp.ok).toBe(false);
  expect(resp.status).toBe(403);
  expect(resp.body?.error?.code).toBe('POKER_PLAY_INVITE_REQUIRED');

  resp = await browserJson(pageB, `/api/poker/play/tables/${encodeURIComponent(tableId)}?inviteCode=${encodeURIComponent(inviteCode)}`, {
    headers: { 'x-wallet-solana-address': userB.address },
  });
  expect(resp.ok).toBe(true);
  expect(resp.body?.data?.table?.access?.viewerAuthorized).toBe(true);
  expect(resp.body?.data?.table?.access?.viewerAuthorizedByInvite).toBe(true);

  resp = await browserJson(pageB, `/api/poker/play/tables/${encodeURIComponent(tableId)}/sit`, {
    method: 'POST',
    headers: { 'x-wallet-solana-address': userB.address },
    data: {
      seatNumber: 2,
      displayName: 'Invite Bravo',
      buyInOil: 300,
      inviteCode,
    },
  });
  expect(resp.ok).toBe(true);
  expect(resp.body?.data?.mySeat?.seatNumber).toBe(2);

  resp = await browserJson(pageB, '/api/poker/play/tables', {
    headers: { 'x-wallet-solana-address': userB.address },
  });
  expect(resp.ok).toBe(true);
  expect((resp.body?.data?.items || []).some((item) => String(item?.tableId || '') === tableId)).toBe(true);

  resp = await browserJson(pageB, `/api/poker/play/rail/tables/${encodeURIComponent(tableId)}`);
  expect(resp.ok).toBe(false);
  expect(resp.status).toBe(404);
  expect(resp.body?.error?.code).toBe('NOT_FOUND');

  await contextA.close();
  await contextB.close();
});
