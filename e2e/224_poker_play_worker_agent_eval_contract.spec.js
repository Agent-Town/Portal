const { test, expect } = require('@playwright/test');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');

test('M22.9: the poker seat-agent benchmark emits machine-readable metrics with deterministic thresholds', async () => {
  const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const raw = execFileSync(npmBin, ['run', '-s', 'eval:poker-seat-agent'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const result = JSON.parse(String(raw || '{}'));
  expect(result?.evalVersion).toBe('poker-seat-agent-eval-v1');
  expect(result?.corpusId).toBe('poker_worker_agent_eval_seed');
  expect(typeof result?.generatedAt).toBe('string');

  const metrics = result?.metrics || {};
  expect(Number(metrics?.legalActionCompliance || 0)).toBe(1);
  expect(Number(metrics?.amountLegalityCompliance || 0)).toBe(1);
  expect(Number(metrics?.schemaValidity || 0)).toBe(1);
  expect(Number(metrics?.easySpotAgreement || 0)).toBeGreaterThanOrEqual(0.8);
  expect(Number(metrics?.mediumSpotNonBlunderRate || 0)).toBeGreaterThanOrEqual(0.9);
  expect(Number(metrics?.medianLatencyMs ?? -1)).toBeGreaterThanOrEqual(0);

  expect(Array.isArray(result?.cases)).toBe(true);
  expect(result.cases.length).toBeGreaterThan(0);
  for (const row of result.cases) {
    expect(typeof row?.id).toBe('string');
    expect(typeof row?.proposal?.actionKind).toBe('string');
    expect(['low', 'medium', 'high']).toContain(String(row?.proposal?.confidence || ''));
    expect(row?.legal).toBe(true);
    expect(row?.amountLegal).toBe(true);
    expect(row?.schemaValid).toBe(true);
    expect(Number(row?.durationMs ?? -1)).toBeGreaterThanOrEqual(0);
  }
});
