#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { chromium, request: playwrightRequest } = require('playwright');

const { resetPortalWebState } = require('../e2e/helpers/portal_web');
const { seedRecoverableTokenHouse } = require('../e2e/helpers/phase1');
const { waitForLiteApi } = require('../e2e/helpers/trainer');
const { attachHouseToPageSession } = require('../e2e/helpers/unified_platform');

const baseUrl = String(process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:4173').trim().replace(/\/+$/, '');
const label = String(process.argv[2] || '').trim() || `${new Date().toISOString().slice(0, 10)}-frontend-design`;
const outputDir = path.resolve(process.cwd(), 'design', 'screenshots', label);

async function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

async function waitForHouseSummary(page, expectedText) {
  await page.waitForFunction((text) => {
    const node = document.querySelector('[data-testid="house-office-summary"]');
    const value = node ? String(node.textContent || '').trim() : '';
    return value.includes(String(text || '').trim());
  }, expectedText, { timeout: 10000 });
}

async function captureShot(page, name) {
  await page.screenshot({
    path: path.join(outputDir, name),
    fullPage: true,
  });
}

async function captureViewportShot(page, name) {
  await page.screenshot({
    path: path.join(outputDir, name),
  });
}

async function focusDistrictPanel(page, panelTestId) {
  await page.evaluate((targetTestId) => {
    const body = document.getElementById('districtModalBody');
    const panel = document.querySelector(`[data-testid="${String(targetTestId || '').trim()}"]`);
    if (!(body instanceof HTMLElement) || !(panel instanceof HTMLElement)) return;
    const bodyRect = body.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    body.scrollTop += panelRect.top - bodyRect.top - 12;
    window.scrollTo(0, 0);
  }, panelTestId);
  await page.waitForTimeout(200);
}

async function main() {
  await ensureDir(outputDir);
  const metadata = {
    capturedAt: new Date().toISOString(),
    baseUrl,
    outputDir,
    shots: [],
  };

  const api = await playwrightRequest.newContext({
    baseURL: baseUrl,
    extraHTTPHeaders: {
      'x-test-reset': process.env.TEST_RESET_TOKEN || 'test-reset',
    },
  });

  await resetPortalWebState(api);

  const browser = await chromium.launch({ headless: true });
  const mobileContext = await browser.newContext({
    baseURL: baseUrl,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();

  await mobilePage.goto(`${baseUrl}/start.html`);
  await mobilePage.waitForLoadState('domcontentloaded');
  await captureShot(mobilePage, '01_start_mobile.png');
  metadata.shots.push({ name: '01_start_mobile.png', route: '/start.html', viewport: '390x844' });

  await mobilePage.goto(`${baseUrl}/app?district=house&liteDriver=phase1`);
  await waitForLiteApi(mobilePage);
  await mobilePage.getByTestId('house-console-panel').waitFor({ state: 'visible', timeout: 10000 });
  await focusDistrictPanel(mobilePage, 'house-console-panel');
  await captureViewportShot(mobilePage, '02_house_console_mobile.png');
  metadata.shots.push({ name: '02_house_console_mobile.png', route: '/app?district=house&liteDriver=phase1', viewport: '390x844' });

  await mobilePage.getByTestId('house-open-office').click();
  await mobilePage.locator('[data-testid="house-office-map-office"]').first().waitFor({ state: 'visible', timeout: 10000 });
  await waitForHouseSummary(mobilePage, '4 offices');
  await focusDistrictPanel(mobilePage, 'house-office-panel');
  await captureViewportShot(mobilePage, '03_house_office_preview_mobile.png');
  metadata.shots.push({ name: '03_house_office_preview_mobile.png', route: '/app?district=house&liteDriver=phase1', viewport: '390x844', state: 'house-office-preview' });

  const seededHouse = await seedRecoverableTokenHouse(api);
  const attachResult = await attachHouseToPageSession(mobilePage, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  if (Number(attachResult?.status || 0) !== 200) {
    throw new Error(`ATTACH_HOUSE_FAILED:${JSON.stringify(attachResult)}`);
  }
  await mobilePage.getByTestId('house-open-office').click();
  await waitForHouseSummary(mobilePage, seededHouse.houseId);
  await focusDistrictPanel(mobilePage, 'house-office-panel');
  await captureViewportShot(mobilePage, '04_house_office_attached_mobile.png');
  metadata.shots.push({
    name: '04_house_office_attached_mobile.png',
    route: '/app?district=house&liteDriver=phase1',
    viewport: '390x844',
    state: 'house-office-attached-mobile',
    houseId: seededHouse.houseId,
  });

  await mobilePage.setViewportSize({ width: 1440, height: 1200 });
  await mobilePage.waitForTimeout(250);
  await focusDistrictPanel(mobilePage, 'house-office-panel');
  await captureViewportShot(mobilePage, '05_house_office_attached_desktop.png');
  metadata.shots.push({
    name: '05_house_office_attached_desktop.png',
    route: '/app?district=house&liteDriver=phase1',
    viewport: '1440x1200',
    state: 'house-office-attached-desktop',
    houseId: seededHouse.houseId,
  });

  fs.writeFileSync(
    path.join(outputDir, 'capture-manifest.json'),
    `${JSON.stringify(metadata, null, 2)}\n`,
    'utf8'
  );

  await mobileContext.close();
  await browser.close();
  await api.dispose();

  process.stdout.write(`Captured ${metadata.shots.length} screenshots to ${outputDir}\n`);
}

main().catch((err) => {
  process.stderr.write(`${err?.stack || err}\n`);
  process.exit(1);
});
