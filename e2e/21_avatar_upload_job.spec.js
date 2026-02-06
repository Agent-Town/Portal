const { test, expect } = require('@playwright/test');
const { reset, uploadFixture, waitForTerminalJob } = require('./helpers/avatar');

test.beforeEach(async ({ request }) => {
  await reset(request);
});

test('upload starts a job and reaches terminal state (session-scoped)', async ({ request, playwright }, testInfo) => {
  const up = await uploadFixture(request, 'good_full.png');
  expect(up.ok).toBe(true);
  expect(up.jobId).toMatch(/^avj_/);
  expect(up.avatarId).toMatch(/^ava_/);

  const job = await waitForTerminalJob(request, up.jobId);
  expect(job.status).toBe('completed');

  const isolated = await playwright.request.newContext({ baseURL: testInfo.project.use.baseURL });
  try {
    const jobResp = await isolated.get(`/api/avatar/jobs/${encodeURIComponent(up.jobId)}`);
    expect(jobResp.status()).toBe(404);

    const pkgResp = await isolated.get(`/api/avatar/${encodeURIComponent(up.avatarId)}/package`);
    expect(pkgResp.status()).toBe(404);
  } finally {
    await isolated.dispose();
  }
});
