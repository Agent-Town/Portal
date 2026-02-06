const { test, expect } = require('@playwright/test');
const { reset, uploadFixture, waitForTerminalJob } = require('./helpers/avatar');

test.beforeEach(async ({ request }) => {
  await reset(request);
});

function kpByLabel(keypoints) {
  const m = new Map();
  for (const kp of keypoints || []) {
    if (kp && typeof kp.label === 'string') m.set(kp.label, kp);
  }
  return m;
}

function expectedPoint(bounds, xPct, yPct) {
  return {
    x: Number((bounds.minX + bounds.w * xPct).toFixed(3)),
    y: Number((bounds.minY + bounds.h * yPct).toFixed(3))
  };
}

test('keypoints are canonical and derived from rig bounds (within tolerance)', async ({ request }) => {
  const up = await uploadFixture(request, 'good_full.png');
  const job = await waitForTerminalJob(request, up.jobId);
  expect(job.status).toBe('completed');

  const rigResp = await request.get(`/api/avatar/${encodeURIComponent(up.avatarId)}/stages/rig.json`);
  expect(rigResp.ok()).toBeTruthy();
  const rig = await rigResp.json();
  expect(rig.template).toBeTruthy();
  expect(rig.bounds).toBeTruthy();

  const kpResp = await request.get(`/api/avatar/${encodeURIComponent(up.avatarId)}/stages/keypoints.json`);
  expect(kpResp.ok()).toBeTruthy();
  const kpPayload = await kpResp.json();
  const keypoints = kpPayload.keypoints;
  expect(Array.isArray(keypoints)).toBe(true);
  expect(keypoints.length).toBeGreaterThanOrEqual(18);

  const bounds = rig.bounds;
  const by = kpByLabel(keypoints);
  const nose = by.get('NOSE');
  expect(nose).toBeTruthy();
  const expNose = expectedPoint(bounds, 0.5, 0.18);
  expect(Math.abs(nose.x - expNose.x)).toBeLessThan(0.001);
  expect(Math.abs(nose.y - expNose.y)).toBeLessThan(0.001);

  const lHip = by.get('LEFT HIP');
  const expLHip = expectedPoint(bounds, 0.43, 0.58);
  expect(Math.abs(lHip.x - expLHip.x)).toBeLessThan(0.001);
  expect(Math.abs(lHip.y - expLHip.y)).toBeLessThan(0.001);
});

test('missing full-body fixtures fail with FULL_BODY_REQUIRED', async ({ request }) => {
  const up = await uploadFixture(request, 'bad_headshot.png');
  const job = await waitForTerminalJob(request, up.jobId);
  expect(job.status).toBe('failed');
  expect(job.errorCode).toBe('FULL_BODY_REQUIRED');
});
