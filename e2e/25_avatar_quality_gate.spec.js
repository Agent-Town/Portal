const { test, expect } = require('@playwright/test');
const { reset, uploadFixture, waitForTerminalJob } = require('./helpers/avatar');

test.beforeEach(async ({ request }) => {
  await reset(request);
});

test('bad silhouette fixture fails QC with explicit code', async ({ request }) => {
  const up = await uploadFixture(request, 'bad_qc_silhouette.png');
  const job = await waitForTerminalJob(request, up.jobId);
  expect(job.status).toBe('failed');
  expect(job.errorCode).toBe('QC_SILHOUETTE_LOW');
});

test('good fixture passes QC and publishes package', async ({ request }) => {
  const up = await uploadFixture(request, 'good_full.png');
  const job = await waitForTerminalJob(request, up.jobId);
  expect(job.status).toBe('completed');

  const pkgResp = await request.get(`/api/avatar/${encodeURIComponent(up.avatarId)}/package`);
  expect(pkgResp.ok()).toBeTruthy();
  const pkg = await pkgResp.json();
  expect(pkg.qc && typeof pkg.qc.score === 'number').toBe(true);
});
