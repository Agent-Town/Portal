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
