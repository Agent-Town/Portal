#!/usr/bin/env node

const { spawnSync } = require('child_process');

const {
  getLiveSuiteManifest,
  getLiveSuiteStatuses,
  inspectLiveSuiteEnv,
  isTruthy,
} = require('../server/live_suite_manifest');

function listManifest() {
  process.stdout.write(`${JSON.stringify(getLiveSuiteManifest(), null, 2)}\n`);
}

function listStatus(suiteId = '') {
  const normalized = String(suiteId || '').trim();
  const statuses = getLiveSuiteStatuses(process.env);
  const payload = normalized
    ? statuses.filter((entry) => String(entry.suiteId || '') === normalized)
    : statuses;
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

function findSuite(suiteId) {
  const normalized = String(suiteId || '').trim();
  return getLiveSuiteManifest().find((entry) => String(entry.suiteId || '').trim() === normalized) || null;
}

function validateSuiteEnv(suite) {
  return inspectLiveSuiteEnv(suite, process.env);
}

function failSetup(suite, issues) {
  const suiteId = String(suite?.suiteId || '').trim() || 'unknown';
  const issueText = issues.join(',');
  process.stderr.write(`LIVE_SUITE_SETUP_REQUIRED:${suiteId}:${issueText}\n`);
  process.exit(1);
}

function runSuite(suite) {
  const result = spawnSync(String(suite.command || ''), {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });
  process.exit(typeof result.status === 'number' ? result.status : 1);
}

const args = process.argv.slice(2);
if (args.includes('--list') || args.length === 0) {
  listManifest();
  process.exit(0);
}

const statusOnly = args.includes('--status');
const checkOnly = args.includes('--check');
const suiteId = args.find((arg) => !arg.startsWith('--')) || '';
if (statusOnly) {
  listStatus(suiteId);
  process.exit(0);
}
const suite = findSuite(suiteId);
if (!suite) {
  process.stderr.write(`LIVE_SUITE_UNKNOWN:${suiteId}\n`);
  process.exit(1);
}

const validation = validateSuiteEnv(suite);
const strictRequired = isTruthy(process.env[String(suite.requiredFlag || '').trim()]) || checkOnly;
if (!validation.ok && strictRequired) {
  failSetup(suite, [...validation.missing, ...validation.mismatched]);
}
if (!validation.ok) {
  process.stdout.write(`LIVE_SUITE_SKIPPED:${suite.suiteId}:${[...validation.missing, ...validation.mismatched].join(',')}\n`);
  process.exit(0);
}
if (checkOnly) {
  process.stdout.write(`LIVE_SUITE_READY:${suite.suiteId}\n`);
  process.exit(0);
}
runSuite(suite);
