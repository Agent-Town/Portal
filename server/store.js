const fs = require('fs');
const path = require('path');

function getStorePath() {
  // Allow tests/e2e to isolate their store file and avoid dirtying tracked fixtures.
  if (process.env.STORE_PATH) return process.env.STORE_PATH;

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
      publicTeams: Array.isArray(parsed.publicTeams) ? parsed.publicTeams : [],
      houses: Array.isArray(parsed.houses) ? parsed.houses : [],
      claims: Array.isArray(parsed.claims) ? parsed.claims : [],
      reservations: Array.isArray(parsed.reservations) ? parsed.reservations : [],
      milestones: Array.isArray(parsed.milestones) ? parsed.milestones : [],
      rewardsLedger: Array.isArray(parsed.rewardsLedger) ? parsed.rewardsLedger : []
    };
  } catch (err) {
    return { signups: [], shares: [], publicTeams: [], houses: [], claims: [], reservations: [], milestones: [], rewardsLedger: [] };
  }
}

function writeStore(next) {
  const p = getStorePath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const cleaned = {
    ...next,
    houses: Array.isArray(next?.houses)
      ? next.houses.map((house) => {
          if (!house || typeof house !== 'object') return house;
          const { keyWrapSig, ...rest } = house;
          return rest;
        })
      : []
  };
  fs.writeFileSync(p, JSON.stringify(cleaned, null, 2) + '\n', 'utf8');
}

module.exports = {
  getStorePath,
  readStore,
  writeStore
};
