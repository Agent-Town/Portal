#!/usr/bin/env node

const { spawnSync } = require('child_process');

const { getLiveSuiteManifest } = require('../server/live_suite_manifest');

function parseEnvName(raw) {
  const value = String(raw || '').trim();
  const eqIndex = value.indexOf('=');
  return eqIndex >= 0 ? value.slice(0, eqIndex).trim() : value;
}

function isTruthy(value) {
  return /^(1|true|yes|on)$/i.test(String(value || '').trim());
}

function listManifest() {
  process.stdout.write(`${JSON.stringify(getLiveSuiteManifest(), null, 2)}\n`);
}

function findSuite(suiteId) {
  const normalized = String(suiteId || '').trim();
  return getLiveSuiteManifest().find((entry) => String(entry.suiteId || '').trim() === normalized) || null;
}

function validateSuiteEnv(suite) {
  const requiredEnv = Array.isArray(suite?.requiredEnv) ? suite.requiredEnv : [];
  const missing = requiredEnv
    .map(parseEnvName)
    .filter(Boolean)
    .filter((name) => !String(process.env[name] || '').trim());
  return {
    ok: missing.length === 0,
    missing,
  };
}

function failSetup(suite, missing) {
  const suiteId = String(suite?.suiteId || '').trim() || 'unknown';
  const missingText = missing.join(',');
  process.stderr.write(`LIVE_SUITE_SETUP_REQUIRED:${suiteId}:${missingText}\n`);
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

const checkOnly = args.includes('--check');
const suiteId = args.find((arg) => !arg.startsWith('--')) || '';
const suite = findSuite(suiteId);
if (!suite) {
  process.stderr.write(`LIVE_SUITE_UNKNOWN:${suiteId}\n`);
  process.exit(1);
}

const validation = validateSuiteEnv(suite);
const strictRequired = isTruthy(process.env[String(suite.requiredFlag || '').trim()]) || checkOnly;
if (!validation.ok && strictRequired) {
  failSetup(suite, validation.missing);
}
if (!validation.ok) {
  process.stdout.write(`LIVE_SUITE_SKIPPED:${suite.suiteId}:${validation.missing.join(',')}\n`);
  process.exit(0);
}
if (checkOnly) {
  process.stdout.write(`LIVE_SUITE_READY:${suite.suiteId}\n`);
  process.exit(0);
}
runSuite(suite);
