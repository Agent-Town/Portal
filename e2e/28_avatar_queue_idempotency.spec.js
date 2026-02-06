const { test, expect } = require('@playwright/test');
const { reset, uploadFixture, waitForTerminalJob } = require('./helpers/avatar');

test.beforeEach(async ({ request }) => {
  await reset(request);
});

test('burst uploads dedupe identical inputs (idempotent avatarId + jobId)', async ({ request }) => {
  const first = await uploadFixture(request, 'good_full.png');

  const burst = await Promise.all([
    uploadFixture(request, 'good_full.png'),
    uploadFixture(request, 'good_full.png'),
    uploadFixture(request, 'good_full.png')
  ]);

  for (const r of burst) {
    expect(r.avatarId).toBe(first.avatarId);
    expect(r.jobId).toBe(first.jobId);
  }

  const job = await waitForTerminalJob(request, first.jobId);
  expect(job.status).toBe('completed');
});

test('transient failure retries do not duplicate published packages', async ({ request }) => {
  const up = await uploadFixture(request, 'good_full.png', { headers: { 'x-avatar-inject-fail-once': '1' } });
  const job = await waitForTerminalJob(request, up.jobId);
  expect(job.status).toBe('completed');
  expect(job.attempts).toBeGreaterThanOrEqual(2);

  const pkgResp = await request.get(`/api/avatar/${encodeURIComponent(up.avatarId)}/package`);
  expect(pkgResp.ok()).toBeTruthy();
  const pkg = await pkgResp.json();
  expect(pkg.hashes.atlasPngSha256).toMatch(/^[a-f0-9]{64}$/);
});
