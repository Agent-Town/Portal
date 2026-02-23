const { test, expect } = require('@playwright/test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { DatabaseSync } = require('node:sqlite');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const STORE_PATH = process.env.STORE_PATH || path.join(process.cwd(), 'data', 'store.e2e.sqlite');
process.env.STORE_PATH = STORE_PATH;
const { readStore, writeStore } = require('../server/store');

const SAMPLE_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5X2rkAAAAASUVORK5CYII=';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

function buildSourceSqlite(filePath) {
  const db = new DatabaseSync(filePath);
  db.exec(
    [
      'CREATE TABLE erc8004_agents (',
      '  agent_id TEXT,',
      '  token_id INTEGER,',
      '  chain_id INTEGER,',
      '  owner_address TEXT,',
      '  created_at TEXT,',
      '  updated_at TEXT,',
      '  image_url TEXT,',
      '  name TEXT,',
      '  description TEXT,',
      '  is_testnet INTEGER DEFAULT 0',
      ');'
    ].join('\n')
  );

  const insert = db.prepare(
    [
      'INSERT INTO erc8004_agents (',
      '  agent_id, token_id, chain_id, owner_address, created_at, updated_at, image_url, name, description, is_testnet',
      ') VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ].join('\n')
  );

  const now = new Date().toISOString();
  insert.run(
    '1:1001',
    1001,
    1,
    '0x1111111111111111111111111111111111111111',
    now,
    now,
    SAMPLE_PNG_DATA_URL,
    'Atlas Sentinel',
    'Imported hero image',
    0
  );
  insert.run(
    '143:2001',
    2001,
    143,
    '0x2222222222222222222222222222222222222222',
    now,
    now,
    '',
    'Monad Courier',
    'No avatar present in source',
    0
  );
  insert.run(
    '8453:3001',
    3001,
    8453,
    '0x3333333333333333333333333333333333333333',
    now,
    now,
    SAMPLE_PNG_DATA_URL,
    'Base Quartermaster',
    'Should be skipped by opt-out tombstone',
    0
  );
  db.close();
}

function runImporter(sourceSqlitePath) {
  const cmd = [
    'scripts/import_erc8004_preregister_houses.js',
    '--source-sqlite',
    sourceSqlitePath,
    '--store-path',
    STORE_PATH,
    '--evm-only',
    '--with-images',
    '--apply'
  ];
  return spawnSync('node', cmd, {
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: 'test', STORE_PATH },
    encoding: 'utf8'
  });
}

function addShareAndPublicTeam(store, houseId, shareId, agentName) {
  store.shares.push({
    id: shareId,
    createdAt: new Date().toISOString(),
    matchedElement: null,
    agentName,
    mode: 'agent',
    houseId,
    xPostUrl: null,
    humanHandle: null,
    agentPosts: { moltbookUrl: null },
    referrals: 0,
    locked: true,
    lockedAt: new Date().toISOString(),
    optIn: { human: true, agent: true },
    public: true
  });
  store.publicTeams.push({
    id: `p_${shareId}`,
    createdAt: new Date().toISOString(),
    shareId,
    sharePath: `/s/${shareId}`,
    houseId,
    matchedElement: null,
    agentName,
    xPostUrl: null,
    humanHandle: null,
    agentPosts: { moltbookUrl: null }
  });
}

test('preregister import populates media slots and respects opt-out suppression', async ({ request }) => {
  const before = readStore();
  before.erc8004OptOut = [
    {
      erc8004Id: '8453:3001',
      state: 'opted_out',
      optedOut: true,
      mode: 'delete',
      updatedAt: new Date().toISOString()
    }
  ];
  writeStore(before);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'et-preregister-'));
  const sourceSqlitePath = path.join(tmpDir, 'erc8004-fixture.sqlite3');
  buildSourceSqlite(sourceSqlitePath);

  const run = runImporter(sourceSqlitePath);
  expect(run.status).toBe(0);

  const store = readStore();
  const anchorsById = new Map((store.anchors || []).map((a) => [a.erc8004Id, a]));
  expect(anchorsById.has('1:1001')).toBeTruthy();
  expect(anchorsById.has('143:2001')).toBeTruthy();
  expect(anchorsById.has('8453:3001')).toBeFalsy();

  const houseA = (store.houses || []).find((h) => h.id === anchorsById.get('1:1001').houseId);
  const houseB = (store.houses || []).find((h) => h.id === anchorsById.get('143:2001').houseId);
  expect(houseA?.media?.shareHero?.image).toMatch(/^data:image\//);
  expect(houseA?.media?.agentAvatar?.image).toMatch(/^data:image\//);
  expect(houseB?.media?.agentAvatar?.image || null).toBeNull();

  addShareAndPublicTeam(store, houseA.id, 'sh_m11_8_a', 'Atlas Sentinel');
  addShareAndPublicTeam(store, houseB.id, 'sh_m11_8_b', 'Monad Courier');
  writeStore(store);

  const shareAResp = await request.get('/api/share/sh_m11_8_a');
  expect(shareAResp.ok()).toBeTruthy();
  const shareA = await shareAResp.json();
  expect(shareA.share?.media?.shareHero?.imageUrl).toContain(`/api/house/${houseA.id}/media/share-hero/image`);
  expect(shareA.share?.media?.agentAvatar?.imageUrl).toContain(`/api/house/${houseA.id}/media/agent-avatar/image`);

  const shareBResp = await request.get('/api/share/sh_m11_8_b');
  expect(shareBResp.ok()).toBeTruthy();
  const shareB = await shareBResp.json();
  expect(shareB.share?.media?.agentAvatar?.imageUrl).toBeNull();

  const leaderboardResp = await request.get('/api/leaderboard');
  expect(leaderboardResp.ok()).toBeTruthy();
  const leaderboard = await leaderboardResp.json();
  const teamA = (leaderboard.teams || []).find((t) => t.shareId === 'sh_m11_8_a');
  const teamB = (leaderboard.teams || []).find((t) => t.shareId === 'sh_m11_8_b');
  expect(teamA?.media?.shareHero?.imageUrl).toContain(`/api/house/${houseA.id}/media/share-hero/image`);
  expect(teamA?.media?.agentAvatar?.imageUrl).toContain(`/api/house/${houseA.id}/media/agent-avatar/image`);
  expect(teamB?.media?.agentAvatar?.imageUrl).toBeNull();

  const atlasResp = await request.get('/api/atlas/agent/1:1001');
  expect(atlasResp.ok()).toBeTruthy();
  const atlas = await atlasResp.json();
  expect(atlas.agent?.media?.shareHero?.imageUrl).toContain(`/api/house/${houseA.id}/media/share-hero/image`);
  expect(atlas.agent?.media?.agentAvatar?.imageUrl).toContain(`/api/house/${houseA.id}/media/agent-avatar/image`);
});
