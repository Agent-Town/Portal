const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { bindPageSession, browserJson, seedPokerPlayHarness } = require('./helpers/poker_play');

const AS_OF = '2026-03-11T10:00:00.000Z';
const TIMEBANK_AS_OF = '2026-03-11T10:00:27.000Z';
const AUTO_ACT_AS_OF = '2026-03-11T10:00:43.000Z';
const ADMIN_HEADERS = { 'x-admin-token': 'test-admin' };

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.6: check/fold and seat-agent auto modes act legally, durably, and audit-visibly', async ({ browser, request }) => {
  const checkFoldSeed = await seedPokerPlayHarness(request, {
    scenario: 'timebank_live',
    asOf: AS_OF,
    tableId: 'pkt_play_phase25_auto_check_fold',
  });
  const checkFoldTableId = String(checkFoldSeed?.tableId || checkFoldSeed?.tableIds?.[0] || '');
  const checkFoldActor = checkFoldSeed?.actors?.[0] || null;
  const checkFoldHandId = String(checkFoldSeed?.handId || '');
  expect(checkFoldTableId).toBeTruthy();
  expect(checkFoldActor?.address).toBeTruthy();
  expect(checkFoldHandId).toBeTruthy();

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await bindPageSession(page, {
    address: checkFoldActor.address,
    houseId: checkFoldActor.houseId,
  });

  const enableCheckFold = await browserJson(page, `/api/poker/play/tables/${encodeURIComponent(checkFoldTableId)}/auto-act`, {
    method: 'POST',
    data: {
      mode: 'check_fold',
      asOf: AS_OF,
    },
  });
  expect(enableCheckFold.ok).toBe(true);
  expect(enableCheckFold.body?.data?.mySeat?.autoAct?.mode).toBe('check_fold');

  const advancedCheckFoldTimebank = await browserJson(page, `/api/poker/play/tables/${encodeURIComponent(checkFoldTableId)}?asOf=${encodeURIComponent(TIMEBANK_AS_OF)}`);
  expect(advancedCheckFoldTimebank.ok).toBe(true);
  const advancedCheckFold = await browserJson(page, `/api/poker/play/tables/${encodeURIComponent(checkFoldTableId)}?asOf=${encodeURIComponent(AUTO_ACT_AS_OF)}`);
  expect(advancedCheckFold.ok).toBe(true);
  const executedCheckFoldPayload = [advancedCheckFoldTimebank.body, advancedCheckFold.body].find((body) => {
    const actionKind = String(body?.data?.mySeat?.autoAct?.lastExecutedActionKind || '');
    return actionKind === 'check' || actionKind === 'fold';
  });
  expect(!!executedCheckFoldPayload).toBe(true);

  const checkFoldReview = await browserJson(page, `/api/poker/play/admin/tables/${encodeURIComponent(checkFoldTableId)}/review?handId=${encodeURIComponent(checkFoldHandId)}&asOf=${encodeURIComponent(AUTO_ACT_AS_OF)}`, {
    headers: ADMIN_HEADERS,
  });
  expect(checkFoldReview.ok).toBe(true);
  const checkFoldAudit = Array.isArray(checkFoldReview.body?.data?.auditEvents) ? checkFoldReview.body.data.auditEvents : [];
  expect(checkFoldAudit.some((event) => {
    const actionKind = String(event?.payload?.actionKind || '');
    return event?.eventKind === 'auto_act_executed'
      && event?.payload?.automationMode === 'check_fold'
      && (actionKind === 'check' || actionKind === 'fold');
  })).toBe(true);

  const seatAgentSeed = await seedPokerPlayHarness(request, {
    scenario: 'timebank_live',
    asOf: AS_OF,
    tableId: 'pkt_play_phase25_auto_agent',
  });
  const seatAgentTableId = String(seatAgentSeed?.tableId || seatAgentSeed?.tableIds?.[0] || '');
  const seatAgentActor = seatAgentSeed?.actors?.[0] || null;
  const seatAgentHandId = String(seatAgentSeed?.handId || '');
  expect(seatAgentTableId).toBeTruthy();
  expect(seatAgentActor?.address).toBeTruthy();
  expect(seatAgentHandId).toBeTruthy();

  const secondContext = await browser.newContext();
  const secondPage = await secondContext.newPage();
  await secondPage.goto('/');
  await bindPageSession(secondPage, {
    address: seatAgentActor.address,
    houseId: seatAgentActor.houseId,
  });

  const tableResp = await browserJson(secondPage, `/api/poker/play/tables/${encodeURIComponent(seatAgentTableId)}?asOf=${encodeURIComponent(AS_OF)}`);
  expect(tableResp.ok).toBe(true);
  const handId = String(tableResp.body?.data?.hand?.handId || seatAgentHandId);
  expect(handId).toBeTruthy();

  const proposalResp = await browserJson(secondPage, `/api/poker/play/hands/${encodeURIComponent(handId)}/proposals`, {
    method: 'POST',
    data: {
      tableId: seatAgentTableId,
      handId,
      actionKind: 'call',
      amountOil: 10,
      confidence: 'high',
      body: 'Seat-agent auto should complete the priced-in call at expiry.',
      asOf: AS_OF,
    },
  });
  expect(proposalResp.ok).toBe(true);
  const proposalId = String(proposalResp.body?.data?.proposal?.proposalId || '');
  expect(proposalId).toBeTruthy();

  const enableSeatAgentAuto = await browserJson(secondPage, `/api/poker/play/tables/${encodeURIComponent(seatAgentTableId)}/auto-act`, {
    method: 'POST',
    data: {
      mode: 'seat_agent_auto',
      asOf: AS_OF,
    },
  });
  expect(enableSeatAgentAuto.ok).toBe(true);
  expect(enableSeatAgentAuto.body?.data?.mySeat?.autoAct?.mode).toBe('seat_agent_auto');

  const advancedSeatAgentAutoTimebank = await browserJson(secondPage, `/api/poker/play/tables/${encodeURIComponent(seatAgentTableId)}?asOf=${encodeURIComponent(TIMEBANK_AS_OF)}`);
  expect(advancedSeatAgentAutoTimebank.ok).toBe(true);
  const advancedSeatAgentAuto = await browserJson(secondPage, `/api/poker/play/tables/${encodeURIComponent(seatAgentTableId)}?asOf=${encodeURIComponent(AUTO_ACT_AS_OF)}`);
  expect(advancedSeatAgentAuto.ok).toBe(true);
  const executedSeatAgentPayload = [advancedSeatAgentAutoTimebank.body, advancedSeatAgentAuto.body].find((body) => (
    String(body?.data?.mySeat?.autoAct?.lastExecutedActionKind || '') === 'call'
  ));
  expect(!!executedSeatAgentPayload).toBe(true);

  const seatAgentReview = await browserJson(secondPage, `/api/poker/play/admin/tables/${encodeURIComponent(seatAgentTableId)}/review?handId=${encodeURIComponent(handId)}&asOf=${encodeURIComponent(AUTO_ACT_AS_OF)}`, {
    headers: ADMIN_HEADERS,
  });
  expect(seatAgentReview.ok).toBe(true);
  const seatAgentAudit = Array.isArray(seatAgentReview.body?.data?.auditEvents) ? seatAgentReview.body.data.auditEvents : [];
  expect(seatAgentAudit.some((event) => (
    event?.eventKind === 'auto_act_executed'
      && event?.payload?.automationMode === 'seat_agent_auto'
      && event?.payload?.actionKind === 'call'
      && event?.payload?.proposalId === proposalId
  ))).toBe(true);

  await secondContext.close();
  await context.close();
});
