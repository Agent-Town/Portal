const { test, expect } = require('@playwright/test');
const {
  REPLAYABILITY_PROMPT_SUITE,
  analyzePackDiversity
} = require('../server/world_grid/generated_pack');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

async function completeGeneratedFirstLoop(page, prompt) {
  await page.goto('/experiences/world-grid/index.html?worldGridFeatureFlags=all');
  await expect(page.getByText('Territory survey ready')).toBeVisible();
  await expect(page.locator('[data-world-grid-stage][data-renderer="three"]')).toBeVisible();

  await page.locator('[data-world-grid-prompt]').fill(prompt);
  await page.getByRole('button', { name: 'Generate pack' }).click();
  await expect(page.locator('[data-world-grid-pack-status]')).toContainText(/pack validated/i);

  const generatedPack = await page.evaluate(() => window.__worldGridTest.getGeneratedPack());
  expect(generatedPack?.validationReport?.ok).toBe(true);

  await page.locator('.world-grid-cell--claimable').first().click();
  await page.getByRole('button', { name: /^Plan / }).click();
  await expect(page.locator('[data-world-grid-detail]')).toContainText('Claim status: planned');
  await page.getByRole('button', { name: /^Complete / }).click();
  await expect(page.locator('[data-world-grid-loop-result]')).toContainText(/route complete/i);

  const report = await page.evaluate(() => window.__worldGridTest.getPlaytestReport());
  expect(report?.playtestPassed).toBe(true);
  expect(report?.defaultScoresUsed).toBe(false);
  expect(report?.screenshotEvidence?.captured).toBe(true);
  return { generatedPack, report };
}

test('GU-9 ten generated prompts are playable and meaningfully diverse in the browser loop', async ({ page, request }) => {
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  const packs = [];
  const playtestReports = [];
  for (const prompt of REPLAYABILITY_PROMPT_SUITE) {
    await test.step(prompt, async () => {
      await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
      const result = await completeGeneratedFirstLoop(page, prompt);
      packs.push(result.generatedPack);
      playtestReports.push(result.report);
    });
  }

  const diversity = analyzePackDiversity(packs, {
    playtestReports,
    requirePlaytestReports: true,
    expectedPromptCount: 10,
    meaningfulDifferenceScoreMin: 0.65
  });

  expect(diversity.ok, JSON.stringify(diversity.metrics)).toBe(true);
  expect(diversity.metrics.promptCount).toBe(10);
  expect(diversity.metrics.validPackCount).toBe(10);
  expect(diversity.metrics.firstLoopPassCount).toBe(10);
  expect(diversity.metrics.uniqueReplayabilitySignatures).toBe(10);
  expect(diversity.metrics.uniqueScreenshotHashes).toBe(10);
  expect(diversity.metrics.meaningfulDifferenceScoreMin).toBeGreaterThanOrEqual(0.65);
  expect(diversity.metrics.forbiddenAuthorityCount).toBe(0);
  expect(diversity.metrics.rawPromptLeakCount).toBe(0);
  expect(consoleErrors).toEqual([]);
});
