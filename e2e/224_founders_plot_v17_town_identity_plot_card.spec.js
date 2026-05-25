const { test, expect } = require('@playwright/test');
const {
  advancePlot,
  getPlotState,
  openFoundersPlotFrame,
  placeFirstLumberCamp,
  runLumberCycle,
  runPlotTool
} = require('./helpers/founders_plot');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

async function lumberBuildingId(frame) {
  return frame.evaluate(() => {
    const state = window.__foundersPlotTest.getState()?.state;
    const building = Array.isArray(state?.buildings)
      ? state.buildings.find((entry) => entry?.type === 'LUMBER_CAMP')
      : null;
    return String(building?.buildingId || '');
  });
}

test('V1.7 town identity style appears in Three.js and plot card stays public-safe', async ({ page }) => {
  const frame = await openFoundersPlotFrame(page);

  expect((await placeFirstLumberCamp(frame, 'v17:lumber'))?.ok).toBe(true);
  await advancePlot(frame, 91_000);
  const lumberId = await lumberBuildingId(frame);
  expect(lumberId).toMatch(/^bld_/);
  expect((await runLumberCycle(frame, lumberId, 'v17:first-lumber'))?.ok).toBe(true);

  const beforeUpgrade = await getPlotState(frame);
  expect(Number(beforeUpgrade.plot.inventory.wood || 0)).toBeGreaterThanOrEqual(4);
  expect((await runPlotTool(frame, 'et.plot.town.upgrade_landmark', {
    landmarkId: 'public_square_welcome_sign',
    idempotencyKey: 'v17:welcome-sign'
  }))?.ok).toBe(true);
  await frame.evaluate(async () => window.__foundersPlotTest.loadState());
  await frame.evaluate(() => window.__foundersPlotTest.openDrawer('signals'));
  await expect(frame.getByTestId('town-identity-card')).toBeVisible();

  const beforeStyle = await getPlotState(frame);
  const beforeInventory = { ...beforeStyle.plot.inventory };
  await frame.getByTestId('town-style-garden').click();
  await frame.waitForFunction(() => window.__foundersPlotTest.getState()?.state?.landmarks?.publicSquare?.styleId === 'garden');

  const afterStyle = await getPlotState(frame);
  expect(afterStyle.landmarks.publicSquare.styleLabel).toBe('Garden Square');
  expect(afterStyle.plot.inventory).toEqual(beforeInventory);

  const scene = await frame.evaluate(() => window.__foundersPlotTest.getScene());
  const square = scene.objects.find((object) => object.id === 'PUBLIC_SQUARE');
  expect(square.identityStyle.styleId).toBe('garden');
  expect(square.tint).toBe('#b9d88a');
  expect(scene.stateCoverage.domains.map((domain) => domain.id)).toContain('town-identity');
  expect(scene.stateCoverage.anchors.find((anchor) => anchor.id === 'STATE:town_identity')?.value).toContain('Garden Square');

  await frame.getByTestId('plot-card-generate-btn').click();
  await expect(frame.getByTestId('plot-card-preview')).toBeVisible();
  const cardText = await frame.getByTestId('plot-card-preview').innerText();
  expect(cardText).toContain('Garden Square');
  expect(cardText).not.toMatch(/provider|runtime|wallet|brain|debug|token|secret|openclaw/i);

  const card = await frame.evaluate(async () => window.__foundersPlotTest.generatePlotCard());
  expect(card.publicSquare.styleId).toBe('garden');
  expect(JSON.stringify(card)).not.toMatch(/provider|runtime|wallet|brain|debug|token|secret|openclaw/i);

  await frame.getByTestId('postcard-capture-btn').click();
  await expect(frame.getByTestId('postcard-preview')).toBeVisible();
  await expect(frame.getByTestId('postcard-preview')).toContainText('Garden Square');
  const imageSrc = await frame.getByTestId('postcard-image').getAttribute('src');
  expect(imageSrc || '').toMatch(/^data:image\/png/);

  const postcard = await frame.evaluate(async () => window.__foundersPlotTest.capturePostcard());
  expect(postcard.schemaVersion).toBe('founders-plot.postcard.v1');
  expect(postcard.publicSquareStyleId).toBe('garden');
  expect(postcard.cameraMode).toBe('postcard_flyover');
  expect(postcard.flyoverStops.map((stop) => stop.objectId)).toContain('PUBLIC_SQUARE');
  const { imageDataUrl: _imageDataUrl, ...postcardMeta } = postcard;
  expect(JSON.stringify(postcardMeta)).not.toMatch(/provider|runtime|wallet|brain|debug|token|secret|openclaw/i);

  const postcardScene = await frame.evaluate(() => window.__foundersPlotTest.getScene());
  expect(postcardScene.stateCoverage.domains.map((domain) => domain.id)).toContain('town-postcards');
  expect(postcardScene.stateCoverage.anchors.find((anchor) => anchor.id === 'STATE:town_postcard')?.status).toBe('CAPTURED');
});
