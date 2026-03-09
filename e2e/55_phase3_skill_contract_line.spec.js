const { test, expect } = require('@playwright/test');
const crypto = require('crypto');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function expectJsonRoute(request, { method, path, body }) {
  const res = await request.fetch(path, {
    method: String(method || 'GET').toUpperCase(),
    headers: body ? { 'content-type': 'application/json' } : undefined,
    data: body
  });
  const contentType = (res.headers()['content-type'] || '').toLowerCase();
  expect(contentType).toContain('application/json');

  const payload = await res.json();
  expect(payload && typeof payload).toBe('object');

  if (!res.ok()) {
    expect(typeof payload.error).toBe('string');
  }
}

test('skill.md keeps the minimal external-agent contract', async ({ request }) => {
  const resp = await request.get('/skill.md');
  expect(resp.ok()).toBeTruthy();
  const txt = await resp.text();

  expect(txt).toContain('name: agent-town-playbook');
  expect(txt).toContain('## Required input');
  expect(txt).toContain('## Core co-op loop');
  expect(txt).toContain('## House ceremony (minimal)');
  expect(txt).toContain('If you do not have a human partner and Team Code, use `/skill_agent_solo.md`.');
  expect(txt).toContain('Use the current page origin');
  expect(txt).not.toContain('http://localhost:4173');

  expect(txt).toContain('Ask for exactly one of these:');
  expect(txt).toContain('- `teamCode` (normal co-op flow)');
  expect(txt).toContain('- `houseId` (reconnect to an existing house)');
  expect(txt).toContain('If runtime/session context already includes one of these values, use it directly and do not ask again.');
  expect(txt).toContain('Do not ask for any other credential.');

  expect(txt).toContain('POST /api/agent/connect');
  expect(txt).toContain('GET /api/agent/state?teamCode=');
  expect(txt).toContain('POST /api/agent/select');
  expect(txt).toContain('POST /api/agent/open/press');
  expect(txt).toContain('## Canvas co-create (optional)');
  expect(txt).toContain('/api/agent/canvas/paint');
  expect(txt).toContain('GET /api/agent/canvas/image?teamCode=');
  expect(txt).toContain('Ask the human to click pixels in the `/create` canvas UI first.');
  expect(txt).toContain('Generate house key');
  expect(txt).toContain('## Share + Moltbook handoff (co-op)');
  expect(txt).toContain('POST /api/share/create');
  expect(txt).toContain('GET /api/agent/share/instructions?teamCode=');
  expect(txt).toContain('POST /api/agent/posts');
  expect(txt).toContain('## House vault note (runtime tool path)');
  expect(txt).toContain('agent_town_house_recover');
  expect(txt).toContain('agent_town_house_append_note');
  expect(txt).toContain('/api/house/:id/append');
  expect(txt).toContain('POST /api/agent/house/commit');
  expect(txt).toContain('POST /api/agent/house/reveal');
  expect(txt).toContain('agent_town_ceremony_commit');
  expect(txt).toContain('agent_town_ceremony_reveal');
  expect(txt).toContain('experience.step');
  expect(txt).toContain('experience.nextAgentAction');
  expect(txt).toContain('Keep polling `GET /api/agent/state?teamCode=...` during ceremony too.');
  expect(txt).toContain('GET /api/agent/house/material?teamCode=');
  expect(txt).toContain('POST /api/agent/house/connect');
  expect(txt).toContain('agent_town_ui_open_modal({ modal, params })');
  expect(txt).toContain('agent_town_ui_atlas_search({ q, family, searchType })');
  expect(txt).toContain('agent_town_ui_registry_search({ q, family })');
  expect(txt).toContain('agent_town_ui_pony_compose({ toHouseId, subject, draft })');
  expect(txt).toContain('trainer.invoke_action`, `trainer.list_evidence`, and `trainer.get_session_context` accept optional `webSessionId`.');
  expect(txt).toContain('Preserve backend ids exactly:');
  expect(txt).toContain('`invocationId`');
  expect(txt).toContain('`evidenceId`');
  expect(txt).toContain('`webSessionId`');

  expect(txt).toContain('Start polling immediately after connect.');
  expect(txt).toContain('Default polling interval: 1 second.');
  expect(txt).toMatch(/On transient failures, back off to 2-5 seconds and retry\.|Retry same request up to 2 additional times/);
  expect(txt).toContain('## Minimal curl sequence');
  expect(txt).toContain('while true; do');
  expect(txt).toContain('sleep 2; continue;');
  expect(txt).toContain('sleep 1');
});

test('minimal skill endpoints are wired as JSON routes', async ({ request }) => {
  const probes = [
    { method: 'POST', path: '/api/agent/connect', body: {} },
    { method: 'GET', path: '/api/agent/state?teamCode=TEAM-TEST-TEST' },
    { method: 'POST', path: '/api/agent/select', body: {} },
    { method: 'POST', path: '/api/agent/open/press', body: {} },
    { method: 'POST', path: '/api/agent/canvas/paint', body: {} },
    { method: 'GET', path: '/api/agent/canvas/image?teamCode=TEAM-TEST-TEST' },
    { method: 'POST', path: '/api/share/create', body: {} },
    { method: 'POST', path: '/api/agent/house/commit', body: {} },
    { method: 'POST', path: '/api/agent/house/reveal', body: {} },
    { method: 'GET', path: '/api/agent/house/state?teamCode=TEAM-TEST-TEST' },
    { method: 'GET', path: '/api/agent/house/material?teamCode=TEAM-TEST-TEST' },
    { method: 'POST', path: '/api/agent/house/connect', body: {} },
    { method: 'GET', path: '/api/agent/share/instructions?teamCode=TEAM-TEST-TEST' },
    { method: 'POST', path: '/api/agent/posts', body: {} }
  ];

  for (const probe of probes) {
    await expectJsonRoute(request, probe);
  }
});

test('agent state polling exposes ceremony + experience step progression in one endpoint', async ({ request }) => {
  const sessionResp = await request.get('/api/session');
  expect(sessionResp.ok()).toBeTruthy();
  const session = await sessionResp.json();
  const teamCode = String(session?.teamCode || '');
  expect(teamCode).toMatch(/^TEAM-/);

  const connect = await request.post('/api/agent/connect', {
    headers: { 'content-type': 'application/json' },
    data: { teamCode, agentName: 'StateLoop' }
  });
  expect(connect.ok()).toBeTruthy();

  const firstStateResp = await request.get(`/api/agent/state?teamCode=${encodeURIComponent(teamCode)}`);
  expect(firstStateResp.ok()).toBeTruthy();
  const firstState = await firstStateResp.json();
  expect(firstState?.ceremony?.humanCommit).toBe(false);
  expect(firstState?.experience?.id).toBe('agent_town_coop_v1');
  expect(firstState?.experience?.step).toBe('mirror_sigil');

  const pick = 'wolf';
  const humanSelect = await request.post('/api/human/select', {
    headers: { 'content-type': 'application/json' },
    data: { elementId: pick }
  });
  expect(humanSelect.ok()).toBeTruthy();
  const agentSelect = await request.post('/api/agent/select', {
    headers: { 'content-type': 'application/json' },
    data: { teamCode, elementId: pick }
  });
  expect(agentSelect.ok()).toBeTruthy();

  const afterMatchResp = await request.get(`/api/agent/state?teamCode=${encodeURIComponent(teamCode)}`);
  expect(afterMatchResp.ok()).toBeTruthy();
  const afterMatch = await afterMatchResp.json();
  expect(afterMatch?.match?.matched).toBe(true);
  expect(afterMatch?.experience?.step).toBe('wait_human_open');

  const humanOpen = await request.post('/api/human/open/press', {
    headers: { 'content-type': 'application/json' },
    data: {}
  });
  expect(humanOpen.ok()).toBeTruthy();

  const waitingAgentOpenResp = await request.get(`/api/agent/state?teamCode=${encodeURIComponent(teamCode)}`);
  expect(waitingAgentOpenResp.ok()).toBeTruthy();
  const waitingAgentOpen = await waitingAgentOpenResp.json();
  expect(waitingAgentOpen?.experience?.step).toBe('press_open');

  const agentOpen = await request.post('/api/agent/open/press', {
    headers: { 'content-type': 'application/json' },
    data: { teamCode }
  });
  expect(agentOpen.ok()).toBeTruthy();

  const postSignupResp = await request.get(`/api/agent/state?teamCode=${encodeURIComponent(teamCode)}`);
  expect(postSignupResp.ok()).toBeTruthy();
  const postSignup = await postSignupResp.json();
  expect(postSignup?.signup?.complete).toBe(true);
  expect(postSignup?.experience?.step).toBe('wait_human_commit');

  const humanCommit = crypto.createHash('sha256').update('human-step-seed').digest('base64');
  const commitResp = await request.post('/api/human/house/commit', {
    headers: { 'content-type': 'application/json' },
    data: { commit: humanCommit }
  });
  expect(commitResp.ok()).toBeTruthy();

  const agentCommitStepResp = await request.get(`/api/agent/state?teamCode=${encodeURIComponent(teamCode)}`);
  expect(agentCommitStepResp.ok()).toBeTruthy();
  const agentCommitStep = await agentCommitStepResp.json();
  expect(agentCommitStep?.ceremony?.humanCommit).toBe(true);
  expect(agentCommitStep?.experience?.step).toBe('agent_commit');
  expect(agentCommitStep?.experience?.nextAgentAction).toBe('agent_town_ceremony_commit');
});
