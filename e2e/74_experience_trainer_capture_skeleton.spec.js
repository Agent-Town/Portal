const { test, expect } = require('@playwright/test');
const {
  gotoAppWithLite,
  visitSkill,
  runExperience,
  listTrainerAttemptIds,
  readTrainerManifest,
  readTrainerEvents
} = require('./helpers/trainer');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

test('experience trainer captures attempt skeleton with import and manifest hashes', async ({ page }) => {
  await gotoAppWithLite(page);

  const visit = await visitSkill(page, '/skill.md');
  expect(visit?.ok).toBe(true);

  await runExperience(page, 'trainer probe: skeleton');

  await expect.poll(async () => (await listTrainerAttemptIds(page)).length, { timeout: 5000 }).toBeGreaterThan(0);
  const attemptIds = await listTrainerAttemptIds(page);
  const attemptId = attemptIds[attemptIds.length - 1];
  expect(attemptId).toBeTruthy();

  const manifest = await readTrainerManifest(page, attemptId);
  expect(manifest?.questId).toBe('portal_onboarding_v1');
  expect(manifest?.attemptId).toBe(attemptId);
  expect(Array.isArray(manifest?.experienceDocs)).toBeTruthy();
  expect((manifest?.experienceDocs || []).length).toBeGreaterThan(0);
  for (const doc of manifest.experienceDocs) {
    expect(typeof doc.path).toBe('string');
    expect(doc.path.length).toBeGreaterThan(0);
    expect(typeof doc.sha256).toBe('string');
    expect(doc.sha256).toMatch(/^[0-9a-f]{64}$/);
  }

  const events = await readTrainerEvents(page, attemptId);
  const types = events.map((event) => event.type);
  const startIdx = types.indexOf('attempt.start');
  const importIdx = types.indexOf('experience.imported');
  const endIdx = types.indexOf('attempt.end');
  expect(startIdx).toBeGreaterThanOrEqual(0);
  expect(importIdx).toBeGreaterThan(startIdx);
  expect(endIdx).toBeGreaterThan(importIdx);
});
