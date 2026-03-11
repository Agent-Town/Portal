const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const {
  bindPageSession,
  browserJson,
  seedPokerPlayHarness,
} = require('./helpers/poker_play');
const {
  waitForLiteApi,
  setDeterministicLlm,
  visitSkill,
} = require('./helpers/trainer');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M22.7: worker seat-agent proposals stay legal, persisted, and seat-private', async ({ browser, request }) => {
  const seedAt = new Date().toISOString();
  const readAt = new Date(Date.parse(seedAt) + 1000).toISOString();
  const actingUser = {
    address: 'So1anaPhase22WorkerAgentA1111111111111111111',
    houseId: 'house_phase22_worker_agent_a',
  };
  const opponentUser = {
    address: 'So1anaPhase22WorkerAgentB1111111111111111111',
    houseId: 'house_phase22_worker_agent_b',
  };
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'timebank_live',
    asOf: seedAt,
    actors: [
      {
        seatNumber: 1,
        address: actingUser.address,
        houseId: actingUser.houseId,
        displayName: 'Worker Alpha',
      },
      {
        seatNumber: 2,
        address: opponentUser.address,
        houseId: opponentUser.houseId,
        displayName: 'Worker Bravo',
      },
    ],
  });

  const actorContext = await browser.newContext();
  const actorPage = await actorContext.newPage();
  await actorPage.goto('/');
  await bindPageSession(actorPage, actingUser);
  await actorPage.goto('/app?liteDriver=phase1&trainerNamespace=1');
  await waitForLiteApi(actorPage);
  await setDeterministicLlm(actorPage);
  const visit = await visitSkill(actorPage, '/skill.md');
  expect(visit?.ok).toBe(true);

  const registry = await actorPage.evaluate(async () => {
    return await window.__openclawLiteTest.getToolRegistryInfo();
  });
  const names = Array.isArray(registry?.names) ? registry.names : [];
  expect(names).toEqual(expect.arrayContaining([
    'poker_state_get_table',
    'poker_state_get_hand_history',
    'poker_state_get_series_timeline',
    'poker_state_get_my_results',
    'poker_thread_post_note',
    'poker_action_propose',
    'poker_action_commit',
  ]));

  const tableEnvelope = await actorPage.evaluate(async ({ tableId, readAt }) => {
    return await window.__openclawLiteTest.pokerStateGetTableTool({ tableId, asOf: readAt });
  }, { tableId: seeded.tableId, readAt });
  expect(tableEnvelope?.ok).toBe(true);
  expect(String(tableEnvelope?.data?.tableId || '')).toBe(seeded.tableId);
  expect(String(tableEnvelope?.data?.state?.hand?.handId || '')).toBe(seeded.handId);
  expect(Number(tableEnvelope?.data?.state?.hand?.timeBankRemainingSeconds || 0)).toBe(15);
  const allowedActions = Array.isArray(tableEnvelope?.data?.state?.hand?.viewerAllowedActions)
    ? tableEnvelope.data.state.hand.viewerAllowedActions
    : [];
  expect(allowedActions.length).toBeGreaterThan(0);

  const noteEnvelope = await actorPage.evaluate(async ({ handId, readAt }) => {
    return await window.__openclawLiteTest.pokerThreadPostNoteTool({
      handId,
      body: 'Keep this seat note private while the worker line is evaluated.',
      asOf: readAt,
    });
  }, { handId: seeded.handId, readAt });
  expect(noteEnvelope?.ok).toBe(true);

  const proposalEnvelope = await actorPage.evaluate(async ({ tableId, handId, readAt }) => {
    return await window.__openclawLiteTest.pokerActionProposeTool({
      tableId,
      handId,
      persist: true,
      asOf: readAt,
    });
  }, {
    tableId: seeded.tableId,
    handId: seeded.handId,
    readAt,
  });
  expect(proposalEnvelope?.ok).toBe(true);
  expect(String(proposalEnvelope?.meta?.tool || '')).toBe('poker_action_propose');
  const proposal = proposalEnvelope?.data?.proposal || null;
  expect(proposal).toBeTruthy();
  expect(String(proposal?.schemaVersion || '')).toBe('poker-seat-agent-proposal-v1');
  expect(['low', 'medium', 'high']).toContain(String(proposal?.confidence || ''));
  expect(allowedActions).toContain(String(proposal?.actionKind || ''));
  expect(String(proposal?.body || '').length).toBeGreaterThan(0);
  if (proposal?.actionKind === 'raise' || proposal?.actionKind === 'bet') {
    expect(Number(proposal?.amountOil || 0)).toBeGreaterThanOrEqual(Number(tableEnvelope?.data?.state?.hand?.minRaiseToOil || 0));
  } else {
    expect(Number(proposal?.amountOil || 0)).toBeGreaterThanOrEqual(0);
  }

  const playerDetail = await browserJson(actorPage, `/api/poker/play/tables/${encodeURIComponent(seeded.tableId)}?seatAgentMode=worker&asOf=${encodeURIComponent(readAt)}`);
  expect(playerDetail.ok).toBe(true);
  expect(playerDetail.body?.data?.agentProposal?.actionKind).toBe(proposal.actionKind);
  expect(playerDetail.body?.data?.agentProposal?.body).toBe(proposal.body);
  expect(playerDetail.body?.data?.suggestion ?? null).toBeNull();

  const historyEnvelope = await actorPage.evaluate(async ({ tableId, readAt }) => {
    return await window.__openclawLiteTest.pokerStateGetHandHistoryTool({ tableId, limit: 5, asOf: readAt });
  }, { tableId: seeded.tableId, readAt });
  expect(historyEnvelope?.ok).toBe(true);
  expect(Array.isArray(historyEnvelope?.data?.history?.items)).toBe(true);
  expect(historyEnvelope.data.history.items.some((item) => String(item?.handId || '') === seeded.handId)).toBe(true);

  const resultsEnvelope = await actorPage.evaluate(async ({ readAt }) => {
    return await window.__openclawLiteTest.pokerStateGetMyResultsTool({ limit: 10, asOf: readAt });
  }, { readAt });
  expect(resultsEnvelope?.ok).toBe(true);
  expect(Array.isArray(resultsEnvelope?.data?.results?.items)).toBe(true);
  expect(resultsEnvelope.data.results.items.some((item) => String(item?.tableId || '') === seeded.tableId)).toBe(true);

  const opponentContext = await browser.newContext();
  const opponentPage = await opponentContext.newPage();
  await opponentPage.goto('/');
  await bindPageSession(opponentPage, opponentUser);
  const opponentDetail = await browserJson(opponentPage, `/api/poker/play/tables/${encodeURIComponent(seeded.tableId)}?seatAgentMode=worker&asOf=${encodeURIComponent(readAt)}`);
  expect(opponentDetail.ok).toBe(true);
  expect(opponentDetail.body?.data?.agentProposal ?? null).toBeNull();
  const opponentMessages = Array.isArray(opponentDetail.body?.data?.messages) ? opponentDetail.body.data.messages : [];
  const opponentMessageBody = JSON.stringify(opponentMessages);
  expect(opponentMessageBody).not.toContain(String(proposal?.body || ''));
  expect(opponentMessageBody).not.toContain('Keep this seat note private');

  const railResp = await request.get(`/api/poker/play/rail/tables/${encodeURIComponent(seeded.tableId)}?asOf=${encodeURIComponent(readAt)}`);
  expect(railResp.ok()).toBe(true);
  const railBody = await railResp.json();
  expect(railBody?.data?.agentProposal ?? null).toBeNull();
  expect(JSON.stringify(railBody?.data || {})).not.toContain(String(proposal?.body || ''));
  expect(JSON.stringify(railBody?.data || {})).not.toContain('Keep this seat note private');

  const illegalResp = await browserJson(actorPage, `/api/poker/play/hands/${encodeURIComponent(seeded.handId)}/proposals`, {
    method: 'POST',
    data: {
      actionKind: 'dance',
      amountOil: 0,
      body: 'illegal proposal',
      confidence: 'high',
      asOf: readAt,
    },
  });
  expect(illegalResp.ok).toBe(false);
  expect(illegalResp.status).toBe(400);

  await opponentContext.close();
  await actorContext.close();
});
