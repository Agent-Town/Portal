#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { chromium, request: playwrightRequest } = require('playwright');

const { resetPortalWebState } = require('../e2e/helpers/portal_web');
const { installMockSolanaWallet } = require('../e2e/helpers/phase1');
const { reachCreateViaLite } = require('../e2e/helpers/phase2');
const { seedRecoverableTokenHouse } = require('../e2e/helpers/phase1');
const { waitForLiteApi } = require('../e2e/helpers/trainer');
const { attachHouseToPageSession } = require('../e2e/helpers/unified_platform');

const baseUrl = String(process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:4173').trim().replace(/\/+$/, '');
const label = String(process.argv[2] || '').trim() || `${new Date().toISOString().slice(0, 10)}-frontend-design`;
const scenario = String(process.argv[3] || 'house-office').trim() || 'house-office';
const outputDir = path.resolve(process.cwd(), 'design', 'screenshots', label);

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

async function waitForHouseSummary(page, expectedText) {
  await page.waitForFunction((text) => {
    const node = document.querySelector('[data-testid="house-office-summary"]');
    const value = node ? String(node.textContent || '').trim() : '';
    return value.includes(String(text || '').trim());
  }, expectedText, { timeout: 10000 });
}

async function captureFullPageShot(page, name) {
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

async function captureHouseOfficeScenario({ browser, api, metadata }) {
  const mobileContext = await browser.newContext({
    baseURL: baseUrl,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await mobileContext.newPage();

  await page.goto(`${baseUrl}/start.html`);
  await page.waitForLoadState('domcontentloaded');
  await captureFullPageShot(page, '01_start_mobile.png');
  metadata.shots.push({ name: '01_start_mobile.png', route: '/start.html', viewport: '390x844' });

  await page.goto(`${baseUrl}/app?district=house&liteDriver=phase1`);
  await waitForLiteApi(page);
  await page.getByTestId('house-console-panel').waitFor({ state: 'visible', timeout: 10000 });
  await focusDistrictPanel(page, 'house-console-panel');
  await captureViewportShot(page, '02_house_console_mobile.png');
  metadata.shots.push({ name: '02_house_console_mobile.png', route: '/app?district=house&liteDriver=phase1', viewport: '390x844' });

  await page.getByTestId('house-open-office').click();
  await page.locator('[data-testid="house-office-map-office"]').first().waitFor({ state: 'visible', timeout: 10000 });
  await waitForHouseSummary(page, '4 offices');
  await focusDistrictPanel(page, 'house-office-panel');
  await captureViewportShot(page, '03_house_office_preview_mobile.png');
  metadata.shots.push({ name: '03_house_office_preview_mobile.png', route: '/app?district=house&liteDriver=phase1', viewport: '390x844', state: 'house-office-preview' });

  const seededHouse = await seedRecoverableTokenHouse(api);
  const attachResult = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  if (Number(attachResult?.status || 0) !== 200) {
    throw new Error(`ATTACH_HOUSE_FAILED:${JSON.stringify(attachResult)}`);
  }
  await page.getByTestId('house-open-office').click();
  await waitForHouseSummary(page, seededHouse.houseId);
  await focusDistrictPanel(page, 'house-office-panel');
  await captureViewportShot(page, '04_house_office_attached_mobile.png');
  metadata.shots.push({
    name: '04_house_office_attached_mobile.png',
    route: '/app?district=house&liteDriver=phase1',
    viewport: '390x844',
    state: 'house-office-attached-mobile',
    houseId: seededHouse.houseId,
  });

  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.waitForTimeout(250);
  await focusDistrictPanel(page, 'house-office-panel');
  await captureViewportShot(page, '05_house_office_attached_desktop.png');
  metadata.shots.push({
    name: '05_house_office_attached_desktop.png',
    route: '/app?district=house&liteDriver=phase1',
    viewport: '1440x1200',
    state: 'house-office-attached-desktop',
    houseId: seededHouse.houseId,
  });

  await mobileContext.close();
}

async function captureLeaderboardEmptyScenario({ browser, metadata }) {
  const context = await browser.newContext({
    baseURL: baseUrl,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  await page.goto(`${baseUrl}/leaderboard`);
  await page.getByTestId('leaderboard-panel').waitFor({ state: 'visible', timeout: 10000 });
  await captureViewportShot(page, '01_leaderboard_empty_mobile.png');
  metadata.shots.push({
    name: '01_leaderboard_empty_mobile.png',
    route: '/leaderboard',
    viewport: '390x844',
    state: 'leaderboard-empty-mobile',
  });

  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.waitForTimeout(250);
  await captureViewportShot(page, '02_leaderboard_empty_desktop.png');
  metadata.shots.push({
    name: '02_leaderboard_empty_desktop.png',
    route: '/leaderboard',
    viewport: '1440x1200',
    state: 'leaderboard-empty-desktop',
  });

  await context.close();
}

async function captureRegistryWorkersScenario({ browser, metadata }) {
  const context = await browser.newContext({
    baseURL: baseUrl,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  await page.goto(`${baseUrl}/registry.html?family=workers`);
  await page.getByTestId('registry-panel').waitFor({ state: 'visible', timeout: 10000 });
  await page.getByTestId('registry-worker-package-card').waitFor({ state: 'visible', timeout: 10000 });
  await captureViewportShot(page, '01_registry_workers_mobile.png');
  metadata.shots.push({
    name: '01_registry_workers_mobile.png',
    route: '/registry.html?family=workers',
    viewport: '390x844',
    state: 'registry-workers-mobile',
  });

  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.waitForTimeout(250);
  await captureViewportShot(page, '02_registry_workers_desktop.png');
  metadata.shots.push({
    name: '02_registry_workers_desktop.png',
    route: '/registry.html?family=workers',
    viewport: '1440x1200',
    state: 'registry-workers-desktop',
  });

  await context.close();
}

async function captureCreateScenario({ browser, api, metadata }) {
  const context = await browser.newContext({
    baseURL: baseUrl,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  await installMockSolanaWallet(page);
  await reachCreateViaLite(page);
  await page.getByTestId('create-panel').waitFor({ state: 'visible', timeout: 10000 });
  await captureViewportShot(page, '01_create_mobile.png');
  metadata.shots.push({
    name: '01_create_mobile.png',
    route: '/create',
    viewport: '390x844',
    state: 'create-mobile',
  });

  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.waitForTimeout(250);
  await captureViewportShot(page, '02_create_desktop.png');
  metadata.shots.push({
    name: '02_create_desktop.png',
    route: '/create',
    viewport: '1440x1200',
    state: 'create-desktop',
  });

  await context.close();
}

async function captureTrainerBrainScenario({ browser, metadata }) {
  const context = await browser.newContext({
    baseURL: baseUrl,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('agentTown:panel:minimized', '0');
    localStorage.setItem('agentTown:panel:debugVisible', '1');
  });

  await page.goto(`${baseUrl}/app?liteDriver=phase1`);
  await waitForLiteApi(page);
  await page.getByTestId('agent-open-trainer').click();
  await page.getByTestId('trainer-root').waitFor({ state: 'visible', timeout: 10000 });
  await captureViewportShot(page, '01_trainer_mobile.png');
  metadata.shots.push({
    name: '01_trainer_mobile.png',
    route: '/app?liteDriver=phase1',
    viewport: '390x844',
    state: 'trainer-mobile',
  });

  await page.locator('#trainerModalClose').click();
  if (!(await page.getByTestId('agent-debug-pane').isVisible())) {
    await page.getByTestId('agent-debug-toggle').click();
  }
  await page.getByTestId('agent-debug-tab-brain').click();
  await expectPanelVisible(page.getByTestId('agent-debug-panel-brain'));
  await captureViewportShot(page, '02_brain_mobile.png');
  metadata.shots.push({
    name: '02_brain_mobile.png',
    route: '/app?liteDriver=phase1',
    viewport: '390x844',
    state: 'brain-mobile',
  });

  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.waitForTimeout(250);
  await page.getByTestId('agent-open-trainer').click();
  await page.getByTestId('trainer-root').waitFor({ state: 'visible', timeout: 10000 });
  await captureViewportShot(page, '03_trainer_desktop.png');
  metadata.shots.push({
    name: '03_trainer_desktop.png',
    route: '/app?liteDriver=phase1',
    viewport: '1440x1200',
    state: 'trainer-desktop',
  });

  await page.locator('#trainerModalClose').click();
  await page.getByTestId('agent-debug-tab-brain').click();
  await expectPanelVisible(page.getByTestId('agent-debug-panel-brain'));
  await captureViewportShot(page, '04_brain_desktop.png');
  metadata.shots.push({
    name: '04_brain_desktop.png',
    route: '/app?liteDriver=phase1',
    viewport: '1440x1200',
    state: 'brain-desktop',
  });

  await context.close();
}

async function expectPanelVisible(locator) {
  await locator.waitFor({ state: 'visible', timeout: 10000 });
}

async function main() {
  ensureDir(outputDir);
  const metadata = {
    capturedAt: new Date().toISOString(),
    baseUrl,
    outputDir,
    scenario,
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
  if (scenario === 'leaderboard-empty') {
    await captureLeaderboardEmptyScenario({ browser, metadata });
  } else if (scenario === 'registry-workers') {
    await captureRegistryWorkersScenario({ browser, metadata });
  } else if (scenario === 'create') {
    await captureCreateScenario({ browser, api, metadata });
  } else if (scenario === 'trainer-brain') {
    await captureTrainerBrainScenario({ browser, metadata });
  } else {
    await captureHouseOfficeScenario({ browser, api, metadata });
  }

  fs.writeFileSync(
    path.join(outputDir, 'capture-manifest.json'),
    `${JSON.stringify(metadata, null, 2)}\n`,
    'utf8'
  );

  await browser.close();
  await api.dispose();

  process.stdout.write(`Captured ${metadata.shots.length} screenshots to ${outputDir}\n`);
}

main().catch((err) => {
  process.stderr.write(`${err?.stack || err}\n`);
  process.exit(1);
});
