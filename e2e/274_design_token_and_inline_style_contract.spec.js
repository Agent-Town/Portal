const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

test('design token foundation stays present in shared styles', async () => {
  const stylesPath = path.join(process.cwd(), 'public/styles.css');
  const styles = fs.readFileSync(stylesPath, 'utf8');

  expect(styles).toContain('--font-ui: "Source Sans 3", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;');
  expect(styles).toContain('--type-display-2: clamp(1.625rem, 2.4vw, 2.125rem);');
  expect(styles).toContain('--space-24: 1.5rem;');
  expect(styles).toContain('--radius-xl: 1.25rem;');
  expect(styles).toContain('--color-surface-base: #fff8ee;');
  expect(styles).toContain('--motion-standard: 180ms;');
  expect(styles).toContain('.btn.quiet {');
  expect(styles).not.toMatch(/\n\.panel::before\s*\{/);
});

test('start template stays free of inline layout styling and warning-banner fallback', async () => {
  const startPath = path.join(process.cwd(), 'public/start.html');
  const startHtml = fs.readFileSync(startPath, 'utf8');

  expect(startHtml).not.toMatch(/\sstyle=/);
  expect(startHtml).not.toContain('startWarning');
  expect(startHtml).toContain('data-testid="start-card"');
  expect(startHtml).toContain('id="enterBtn"');
});

test('town shell markup keeps trainer layout classes and plain-language dock controls', async () => {
  const indexPath = path.join(process.cwd(), 'public/index.html');
  const indexHtml = fs.readFileSync(indexPath, 'utf8');

  expect(indexHtml).toContain('class="trainerQuestTitle"');
  expect(indexHtml).toContain('class="trainerActionRow"');
  expect(indexHtml).toContain('class="input trainerCompactInput"');
  expect(indexHtml).toContain('class="small trainerToggleLabel"');
  expect(indexHtml).not.toContain('style="display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:10px;"');
  expect(indexHtml).not.toContain('style="max-width:120px;"');
  expect(indexHtml).not.toContain('>⚙<');
  expect(indexHtml).not.toContain('>🔍-<');
  expect(indexHtml).not.toContain('>🔍+<');
  expect(indexHtml).not.toContain('>□<');
  expect(indexHtml).toContain('>Debug</button>');
  expect(indexHtml).toContain('>Small</button>');
  expect(indexHtml).toContain('>Large</button>');
  expect(indexHtml).toContain('>Open</button>');
});

test('house console header region uses structured classes instead of inline layout styling', async () => {
  const housePath = path.join(process.cwd(), 'public/views/house.html');
  const houseHtml = fs.readFileSync(housePath, 'utf8');

  expect(houseHtml).toContain('data-testid="house-console-summary-card"');
  expect(houseHtml).toContain('data-testid="house-console-primary-actions"');
  expect(houseHtml).toContain('data-testid="house-console-support"');
  expect(houseHtml).toContain('class="houseConsoleDistrictShell"');
  expect(houseHtml).not.toContain('id="houseOfficeDistrictShell" data-testid="house-office-district-shell" style=');
  expect(houseHtml).not.toContain('id="houseTeamSummary" data-testid="house-team-summary" style=');
  expect(houseHtml).not.toContain('id="houseReadinessSummary" data-testid="house-readiness-summary" style=');
  expect(houseHtml).not.toContain('id="houseWorkerLiveReadinessSummary" data-testid="house-worker-live-readiness-summary" style=');
});

test('house office static markup uses section classes instead of inline spacing', async () => {
  const housePath = path.join(process.cwd(), 'public/views/house.html');
  const houseHtml = fs.readFileSync(housePath, 'utf8');

  expect(houseHtml).toContain('data-testid="house-office-hero"');
  expect(houseHtml).toContain('data-testid="house-office-overview-grid"');
  expect(houseHtml).toContain('class="houseOfficeSectionHeader"');
  expect(houseHtml).toContain('class="houseOfficeMap"');
  expect(houseHtml).not.toContain('id="houseOfficeShareActions" data-testid="house-office-share-actions" style=');
  expect(houseHtml).not.toContain('id="houseOfficeSelectedOffice" data-testid="house-office-selected-office" style=');
  expect(houseHtml).not.toContain('id="houseOfficePresence" data-testid="house-office-presence" style=');
  expect(houseHtml).not.toContain('id="houseOfficeMap" data-testid="house-office-map" style=');
  expect(houseHtml).not.toContain('id="houseOfficeSourceManifest" data-testid="house-office-source-manifest" style=');
});

test('leaderboard markup uses structured empty-state and support-rail classes', async () => {
  const leaderboardPath = path.join(process.cwd(), 'public/leaderboard.html');
  const leaderboardHtml = fs.readFileSync(leaderboardPath, 'utf8');

  expect(leaderboardHtml).toContain('data-testid="leaderboard-panel"');
  expect(leaderboardHtml).toContain('data-testid="leaderboard-stat-rail"');
  expect(leaderboardHtml).toContain('data-testid="leaderboard-empty-state"');
  expect(leaderboardHtml).toContain('data-testid="leaderboard-empty-actions"');
  expect(leaderboardHtml).not.toContain('id="empty" style=');
});
