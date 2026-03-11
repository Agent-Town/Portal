#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function removeIfPresent(filePath) {
  if (!filePath) return;
  try {
    fs.rmSync(filePath, { force: true });
  } catch {
    // Ignore cleanup failures and let server startup report the real error.
  }
}

const rawStorePath = String(process.env.STORE_PATH || '').trim();
if (rawStorePath) {
  const storePath = path.resolve(rawStorePath);
  for (const suffix of ['', '-shm', '-wal', '-journal']) {
    removeIfPresent(`${storePath}${suffix}`);
  }
}

require('../server/index.js');
