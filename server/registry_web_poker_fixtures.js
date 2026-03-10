const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const FIXTURE_DIR = path.join(__dirname, 'fixtures', 'registry-web-poker');
const FIXTURE_FILES = {
  registry_family_seed: 'registry_family_seed.json',
  registry_claim_review_seed: 'registry_claim_review_seed.json',
  registry_proof_seed: 'registry_proof_seed.json',
  web_parse_stub_seed: 'web_parse_stub_seed.json',
  web_adapter_expected_actions: 'web_adapter_expected_actions.json',
  poker_season_detail_seed: 'poker_season_detail_seed.json',
  poker_run_history_seed: 'poker_run_history_seed.json',
  poker_safety_evidence_seed: 'poker_safety_evidence_seed.json',
};

const fixtureCache = new Map();

function listFixtureFamilies() {
  return Object.keys(FIXTURE_FILES);
}

function readFixtureFile(family) {
  const key = String(family || '').trim();
  const filename = FIXTURE_FILES[key];
  if (!filename) return null;
  const filepath = path.join(FIXTURE_DIR, filename);
  if (!fs.existsSync(filepath)) return null;
  return fs.readFileSync(filepath, 'utf8');
}

function loadFixtureFamily(family) {
  const key = String(family || '').trim();
  if (!FIXTURE_FILES[key]) return null;
  if (fixtureCache.has(key)) return fixtureCache.get(key);
  const raw = readFixtureFile(key);
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  fixtureCache.set(key, parsed);
  return parsed;
}

function buildFixtureManifest() {
  const manifest = {};
  for (const family of listFixtureFamilies()) {
    const raw = readFixtureFile(family) || '';
    manifest[family] = `sha256:${crypto.createHash('sha256').update(raw, 'utf8').digest('hex')}`;
  }
  return manifest;
}

function getRegistryWebPokerTestStats() {
  const fixtureFamilies = listFixtureFamilies();
  const fixtureManifest = buildFixtureManifest();
  const manifestHash = `sha256:${crypto.createHash('sha256').update(JSON.stringify(fixtureManifest), 'utf8').digest('hex')}`;
  return {
    fixtureFamilies,
    fixtureManifest,
    fixtureManifestHash: manifestHash,
    inspectors: {
      registry: true,
      packManifest: true,
      poker: true,
    },
  };
}

module.exports = {
  getRegistryWebPokerTestFixture: loadFixtureFamily,
  getRegistryWebPokerTestStats,
  listRegistryWebPokerFixtureFamilies: listFixtureFamilies,
};
