const { test, expect } = require('@playwright/test');

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
  expect(txt).toContain('Use the current page origin');
  expect(txt).not.toContain('http://localhost:4173');

  expect(txt).toContain('POST /api/agent/connect');
  expect(txt).toContain('GET /api/agent/state?teamCode=');
  expect(txt).toContain('POST /api/agent/select');
  expect(txt).toContain('POST /api/agent/open/press');
  expect(txt).toContain('POST /api/agent/house/commit');
  expect(txt).toContain('POST /api/agent/house/reveal');
  expect(txt).toContain('GET /api/agent/house/state?teamCode=');
  expect(txt).toContain('GET /api/agent/house/material?teamCode=');
  expect(txt).toContain('POST /api/agent/house/connect');
});

test('minimal skill endpoints are wired as JSON routes', async ({ request }) => {
  const probes = [
    { method: 'POST', path: '/api/agent/connect', body: {} },
    { method: 'GET', path: '/api/agent/state?teamCode=TEAM-TEST-TEST' },
    { method: 'POST', path: '/api/agent/select', body: {} },
    { method: 'POST', path: '/api/agent/open/press', body: {} },
    { method: 'POST', path: '/api/agent/house/commit', body: {} },
    { method: 'POST', path: '/api/agent/house/reveal', body: {} },
    { method: 'GET', path: '/api/agent/house/state?teamCode=TEAM-TEST-TEST' },
    { method: 'GET', path: '/api/agent/house/material?teamCode=TEAM-TEST-TEST' },
    { method: 'POST', path: '/api/agent/house/connect', body: {} },
    { method: 'GET', path: '/api/agent/share/instructions?teamCode=TEAM-TEST-TEST' }
  ];

  for (const probe of probes) {
    await expectJsonRoute(request, probe);
  }
});
