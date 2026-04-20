const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const manifest = require('../public/experiences/founders-plot/manifest.json');
const { FOUNDERS_PLOT_TOOL_SPECS } = require('../server/founders_plot/tools');

test('manifest tools exactly match server tool specs', async () => {
  expect(Array.isArray(manifest?.tools)).toBe(true);
  expect(manifest.tools.every((entry) => typeof entry === 'string')).toBe(true);
  expect([...manifest.tools].sort()).toEqual(FOUNDERS_PLOT_TOOL_SPECS.map((tool) => tool.name).sort());
});

test('heartbeat documents the scheduler runtime contract', async () => {
  const heartbeat = fs.readFileSync(path.join(__dirname, '..', 'public/experiences/founders-plot/heartbeat.md'), 'utf8');
  expect(heartbeat).toContain('in-session only');
  expect(heartbeat).toContain('COLLECT_READY_OUTPUTS');
  expect(heartbeat).toContain('nextRunAtMs');
  expect(heartbeat).toMatch(/hidden/i);
  expect(heartbeat).toContain('FOREMAN_RUNTIME_REQUIRED');
  expect(heartbeat).toContain('STALE_RUNTIME');
  expect(heartbeat).toContain('OPENCLAW_LITE_WORKER');
});

test('tools markdown names every server tool exactly once or more', async () => {
  const toolsDoc = fs.readFileSync(path.join(__dirname, '..', 'public/experiences/founders-plot/tools.md'), 'utf8');
  for (const tool of FOUNDERS_PLOT_TOOL_SPECS) {
    expect(toolsDoc).toContain(tool.name);
  }
});
