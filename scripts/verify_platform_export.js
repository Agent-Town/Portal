#!/usr/bin/env node

const { exportPlatformStateSnapshot, verifyPlatformStateSnapshot } = require('../server/platform_export');

const snapshot = exportPlatformStateSnapshot();
const verification = verifyPlatformStateSnapshot(snapshot);

if (!verification.ok) {
  process.stderr.write(`${JSON.stringify(verification, null, 2)}\n`);
  process.exit(1);
}

process.stdout.write(`${JSON.stringify({ ok: true, counts: verification.counts }, null, 2)}\n`);
