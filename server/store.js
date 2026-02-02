const fs = require('fs');
const path = require('path');

function getStorePath() {
  const isTest = process.env.NODE_ENV === 'test';
  const filename = isTest ? 'store.test.json' : 'store.json';
  return path.join(process.cwd(), 'data', filename);
}

function readStore() {
  const p = getStorePath();
  try {
    const raw = fs.readFileSync(p, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      signups: Array.isArray(parsed.signups) ? parsed.signups : [],
      shares: Array.isArray(parsed.shares) ? parsed.shares : [],
      publicPairs: Array.isArray(parsed.publicPairs) ? parsed.publicPairs : []
    };
  } catch (err) {
    return { signups: [], shares: [], publicPairs: [] };
  }
}

function writeStore(next) {
  const p = getStorePath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(next, null, 2) + '\n', 'utf8');
}

module.exports = {
  getStorePath,
  readStore,
  writeStore
};
