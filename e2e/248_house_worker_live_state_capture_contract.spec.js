const { test, expect } = require('@playwright/test');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.join(__dirname, '..');

test('T38.11: House worker live-state capture command is machine-readable and operator-guided', async () => {
  const planOutput = execFileSync('node', ['scripts/capture_house_worker_live_state.js', '--plan'], {
    cwd: repoRoot,
    env: {
      ...process.env,
      HOUSE_WORKER_LIVE_BASE_URL: 'http://localhost:4310',
      HOUSE_WORKER_LIVE_STORAGE_STATE: path.join(repoRoot, 'data', 'custom.house-worker.live-state.json'),
    },
    encoding: 'utf8',
  });
  const plan = JSON.parse(planOutput);
  expect(plan).toMatchObject({
    baseURL: 'http://localhost:4310',
    outputPath: path.join(repoRoot, 'data', 'custom.house-worker.live-state.json'),
    readinessPath: '/api/platform/house-workers/live-readiness',
    targetPath: '/app?district=house',
    requiredReadyChecks: ['house_attached', 'active_team_selected'],
    headed: true,
  });

  const defaultPlanOutput = execFileSync('node', ['scripts/capture_house_worker_live_state.js', '--plan'], {
    cwd: repoRoot,
    env: {
      ...process.env,
      HOUSE_WORKER_LIVE_BASE_URL: '',
      HOUSE_WORKER_LIVE_STORAGE_STATE: '',
      BASE_URL: '',
    },
    encoding: 'utf8',
  });
  const defaultPlan = JSON.parse(defaultPlanOutput);
  expect(defaultPlan.outputPath).toBe(path.join(repoRoot, 'data', 'house-worker.live.storage-state.json'));
  expect(defaultPlan.baseURL).toBe('http://localhost:3000');

  const helpOutput = execFileSync('node', ['scripts/capture_house_worker_live_state.js', '--help'], {
    cwd: repoRoot,
    env: process.env,
    encoding: 'utf8',
  });
  expect(helpOutput).toContain('Usage:');
  expect(helpOutput).toContain('capture_house_worker_live_state.js');
  expect(helpOutput).toContain('--plan');
  expect(helpOutput).toContain('--output');
  expect(helpOutput).toContain('sign in');
  expect(helpOutput).toContain('house attached');
});
