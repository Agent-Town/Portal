const crypto = require('crypto');
const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { readVfsText, visitSkill, waitForLiteApi } = require('./helpers/trainer');
const {
  compileDefaultSkillPack,
  DEFAULT_COMPILED_PACK_MANIFEST_PATH,
  getDefaultCompiledPackManifest,
} = require('./helpers/unified_platform');

function sha256PrefixedHex(input) {
  return `sha256:${crypto.createHash('sha256').update(String(input || ''), 'utf8').digest('hex')}`;
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M19.2: default same-origin skill compiles into an internal pack before execution', async ({ request, page }) => {
  const packResp = await request.get('/api/platform/default-skill-pack');
  expect(packResp.ok()).toBe(true);
  const packBody = await packResp.json();
  const pack = packBody?.data || {};
  expect(String(pack.packVersionId || '')).toMatch(/^packv_/);
  expect(String(pack.contentHash || '')).toMatch(/^sha256:/);
  expect(pack.sourceRefs?.[0]?.path).toBe('/skill.md');
  expect(Object.keys(pack.fileHashes || {}).sort()).toEqual([
    'heartbeat.md',
    'manual/skill.md',
    'tools.md',
    'trace_map.json',
  ]);

  const externalSkillResp = await request.get('/skill.md');
  expect(externalSkillResp.ok()).toBe(true);
  const externalSkill = await externalSkillResp.text();
  expect(String(pack.sourceRefs?.[0]?.hash || '')).toBe(sha256PrefixedHex(externalSkill));

  await page.goto('/app?liteDriver=phase1');
  await waitForLiteApi(page);

  const visit = await page.evaluate(async () => {
    return await window.__openclawLiteTest.visitExperience({ url: '/skill.md' });
  });
  expect(visit?.ok).toBe(true);

  const dryRun = await page.evaluate(async () => {
    return await window.__openclawLiteTest.experienceRun({ dryRun: true });
  });
  expect(dryRun?.ok).toBe(true);
  expect(dryRun?.data?.mode).toBe('dry-run');

  const manifest = await getDefaultCompiledPackManifest(page);
  expect(manifest?.packVersionId || '').toMatch(/^packv_/);
  expect(manifest?.contentHash || '').toMatch(/^sha256:/);
  expect(manifest?.sourceRefs?.[0]?.path).toBe('/skill.md');
  expect(Object.keys(manifest?.fileHashes || {}).sort()).toEqual([
    'heartbeat.md',
    'manual/skill.md',
    'tools.md',
    'trace_map.json',
  ]);

  const manifestText = await readVfsText(page, DEFAULT_COMPILED_PACK_MANIFEST_PATH);
  expect(typeof manifestText).toBe('string');
  expect(String(manifestText || '')).toContain(String(manifest.packVersionId || ''));
  expect(await readVfsText(page, 'workspace/heartbeat.md')).toContain('# Heartbeat');
  expect(await readVfsText(page, 'workspace/tools.md')).toContain('# Tools');
  expect(await readVfsText(page, 'workspace/trace_map.json')).toContain('"traceMapVersion"');

  const replayA = await compileDefaultSkillPack(page, { idempotencyKey: 'default-pack-bridge-001' });
  const replayB = await compileDefaultSkillPack(page, { idempotencyKey: 'default-pack-bridge-001' });
  expect(replayA?.packVersionId).toBe(manifest?.packVersionId);
  expect(replayB?.packVersionId).toBe(manifest?.packVersionId);

  const packVisit = await visitSkill(page, String(pack.entryUrl || ''));
  expect(packVisit?.ok).toBe(true);
  const importedCompiledSkillState = await page.evaluate(async () => {
    return await window.__openclawLiteTest.skillState();
  });
  const normalizedImportedCompiledSkillState = importedCompiledSkillState?.data || importedCompiledSkillState || {};
  expect(String(normalizedImportedCompiledSkillState?.sourceUrl || '')).toContain('/__compiled/default-skill-pack/skill.md');
});
