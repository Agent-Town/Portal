const { test, expect } = require('@playwright/test');
const { reset, uploadFixture, waitForTerminalJob, sha256Hex } = require('./helpers/avatar');

test.beforeEach(async ({ request }) => {
  await reset(request);
});

test('normalize stage is deterministic (hash matches stage artifact)', async ({ request }) => {
  const up = await uploadFixture(request, 'good_full.png');
  const job = await waitForTerminalJob(request, up.jobId);
  expect(job.status).toBe('completed');

  const pkgResp = await request.get(`/api/avatar/${encodeURIComponent(up.avatarId)}/package`);
  expect(pkgResp.ok()).toBeTruthy();
  const pkg = await pkgResp.json();
  expect(pkg.hashes.normalizedPngSha256).toMatch(/^[a-f0-9]{64}$/);

  const normResp = await request.get(`/api/avatar/${encodeURIComponent(up.avatarId)}/stages/normalized.png`);
  expect(normResp.ok()).toBeTruthy();
  const normBytes = await normResp.body();
  expect(sha256Hex(normBytes)).toBe(pkg.hashes.normalizedPngSha256);

  // Second upload of the exact same bytes is idempotent.
  const up2 = await uploadFixture(request, 'good_full.png');
  expect(up2.avatarId).toBe(up.avatarId);
  expect(up2.jobId).toBe(up.jobId);
});
