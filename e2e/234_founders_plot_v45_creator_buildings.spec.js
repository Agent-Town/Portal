const { test, expect } = require('@playwright/test');
const {
  bootstrapToHq2,
  getPlotState,
  openFoundersPlotFrame
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

function coreSnapshot(state) {
  return {
    inventory: state?.plot?.inventory || {},
    buildingCount: Array.isArray(state?.buildings) ? state.buildings.length : 0,
    hqLevel: state?.plot?.hqLevel || 0,
    permissions: state?.policy || {}
  };
}

test('V4.5 installs, runs, disables, and removes a creator Notice Kiosk in Three.js without mutating core town truth', async ({ page }) => {
  test.setTimeout(90_000);
  const frame = await openFoundersPlotFrame(page);
  await bootstrapToHq2(frame);
  await frame.evaluate(async () => {
    await window.__foundersPlotTest.loadState();
    window.__foundersPlotTest.openDrawer('creator');
  });

  const before = coreSnapshot(await getPlotState(frame));
  await expect(frame.getByTestId('creator-extensions-panel')).toBeVisible();
  await expect(frame.getByTestId('creator-catalog-creator-notice-kiosk')).toContainText('Creator Notice Kiosk');
  await expect(frame.getByTestId('creator-catalog-creator-notice-kiosk')).toContainText('Local curated import');
  await expect(frame.getByTestId('creator-catalog-creator-notice-kiosk')).toContainText('Assets approved');
  await expect(frame.getByTestId('creator-catalog-creator-notice-kiosk')).toContainText('Credit only');
  await expect(frame.getByTestId('creator-install-creator-notice-kiosk')).toBeEnabled();

  await frame.getByTestId('creator-install-creator-notice-kiosk').click();
  await expect.poll(async () => {
    const state = await getPlotState(frame);
    return state?.creatorExtensions?.installed?.[0]?.status;
  }).toBe('ACTIVE');

  await expect(frame.getByTestId('creator-installed-creator-notice-kiosk')).toBeVisible();
  const sceneAfterInstall = await frame.evaluate(() => window.__foundersPlotTest.getScene() || null);
  expect(sceneAfterInstall?.objects?.some((object) => object.id === 'CREATOR_NOTICE_KIOSK')).toBe(true);
  expect(sceneAfterInstall?.stateCoverage?.domains?.map((entry) => entry.id)).toContain('creator-extensions');
  const creatorAnchor = sceneAfterInstall?.stateCoverage?.anchors?.find((entry) => entry.id === 'STATE:creator-extensions');
  expect(creatorAnchor?.objectId).toBe('CREATOR_NOTICE_KIOSK');
  expect(creatorAnchor?.status).toBe('ACTIVE');

  const threeInfo = await frame.evaluate(() => window.__foundersPlotTest.getThreeSceneInfo());
  expect(threeInfo?.objectIds).toContain('CREATOR_NOTICE_KIOSK');

  await frame.getByTestId('creator-post-notice-creator-notice-kiosk').click();
  await expect(frame.getByTestId('creator-installed-creator-notice-kiosk')).toContainText('Welcome travelers to this growing town.');
  await expect.poll(async () => {
    const state = await getPlotState(frame);
    return state?.creatorExtensions?.installed?.[0]?.state?.noticeCount;
  }).toBe(1);

  await frame.getByTestId('creator-disable-creator-notice-kiosk').click();
  await expect.poll(async () => {
    const state = await getPlotState(frame);
    return state?.creatorExtensions?.installed?.[0]?.status;
  }).toBe('DISABLED');

  const sceneAfterDisable = await frame.evaluate(() => window.__foundersPlotTest.getScene() || null);
  expect(sceneAfterDisable?.objects?.some((object) => object.id === 'CREATOR_NOTICE_KIOSK')).toBe(true);
  expect(sceneAfterDisable?.stateCoverage?.anchors?.find((entry) => entry.id === 'STATE:creator-extensions')?.status).toBe('DISABLED');

  await frame.getByTestId('creator-remove-creator-notice-kiosk').click();
  await expect.poll(async () => {
    const state = await getPlotState(frame);
    return state?.creatorExtensions?.installed?.length || 0;
  }).toBe(0);

  const after = coreSnapshot(await getPlotState(frame));
  expect(after).toEqual(before);
  const sceneAfterRemove = await frame.evaluate(() => window.__foundersPlotTest.getScene() || null);
  expect(sceneAfterRemove?.objects?.some((object) => object.id === 'CREATOR_NOTICE_KIOSK')).toBe(false);
});
