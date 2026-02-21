const { test, expect } = require('@playwright/test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { DatabaseSync } = require('node:sqlite');
const { Wallet } = require('ethers');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';
const STORE_PATH = process.env.STORE_PATH || path.join(process.cwd(), 'data', 'store.e2e.sqlite');
process.env.STORE_PATH = STORE_PATH;
const { readStore, writeStore } = require('../server/store');

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

function buildOptOutMessage({ erc8004Id, nonce, mode = 'delete' }) {
  return [
    'AgentTown ERC-8004 Opt-Out',
    `erc8004Id: ${erc8004Id}`,
    `nonce: ${nonce}`,
    `mode: ${mode}`
  ].join('\n');
}

function buildSourceSqlite(filePath, ownerAddress) {
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
  const now = new Date().toISOString();
  db.prepare(
    [
      'INSERT INTO erc8004_agents (',
      '  agent_id, token_id, chain_id, owner_address, created_at, updated_at, image_url, name, description, is_testnet',
      ') VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ].join('\n')
  ).run(
    '1:1001',
    1001,
    1,
    ownerAddress,
    now,
    now,
    '',
    'Atlas Sentinel',
    'Opt-out target',
    0
  );
  db.close();
}

function runImporter(sourceSqlitePath) {
  return spawnSync(
    'node',
    [
      'scripts/import_erc8004_preregister_houses.js',
      '--source-sqlite',
      sourceSqlitePath,
      '--store-path',
      STORE_PATH,
      '--evm-only',
      '--apply'
    ],
    {
      cwd: process.cwd(),
      env: { ...process.env, NODE_ENV: 'test', STORE_PATH },
      encoding: 'utf8'
    }
  );
}

test('ownership-verified opt-out removes storefront surfaces and blocks re-import', async ({ request }) => {
  const owner = Wallet.createRandom();
  const nonOwner = Wallet.createRandom();

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'et-optout-'));
  const sourceSqlitePath = path.join(tmpDir, 'erc8004-optout-fixture.sqlite3');
  buildSourceSqlite(sourceSqlitePath, owner.address);

  const firstImport = runImporter(sourceSqlitePath);
  expect(firstImport.status).toBe(0);

  const initialStore = readStore();
  const anchor = (initialStore.anchors || []).find((a) => a.erc8004Id === '1:1001');
  expect(anchor).toBeTruthy();
  const houseId = anchor.houseId;
  expect(houseId).toBeTruthy();

  initialStore.shares.push({
    id: 'sh_optout_1',
    createdAt: new Date().toISOString(),
    matchedElement: null,
    agentName: 'Atlas Sentinel',
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
  initialStore.publicTeams.push({
    id: 'p_sh_optout_1',
    createdAt: new Date().toISOString(),
    shareId: 'sh_optout_1',
    sharePath: '/s/sh_optout_1',
    houseId,
    matchedElement: null,
    agentName: 'Atlas Sentinel',
    xPostUrl: null,
    humanHandle: null,
    agentPosts: { moltbookUrl: null }
  });
  writeStore(initialStore);

  const badNonceResp = await request.get('/api/erc8004/optout/nonce?erc8004Id=1:1001');
  expect(badNonceResp.ok()).toBeTruthy();
  const badNonce = await badNonceResp.json();
  const badSigResp = await request.post('/api/erc8004/optout', {
    data: {
      erc8004Id: '1:1001',
      ownerAddress: owner.address,
      chainType: 'evm',
      signature: '0xdeadbeef',
      nonce: badNonce.nonce,
      mode: 'delete'
    }
  });
  expect(badSigResp.status()).toBe(401);
  expect((await badSigResp.json()).error).toBe('AUTH_INVALID_SIGNATURE');

  const nonOwnerNonceResp = await request.get('/api/erc8004/optout/nonce?erc8004Id=1:1001');
  expect(nonOwnerNonceResp.ok()).toBeTruthy();
  const nonOwnerNonce = await nonOwnerNonceResp.json();
  const nonOwnerMsg = buildOptOutMessage({ erc8004Id: '1:1001', nonce: nonOwnerNonce.nonce });
  const nonOwnerSig = await nonOwner.signMessage(nonOwnerMsg);
  const nonOwnerResp = await request.post('/api/erc8004/optout', {
    data: {
      erc8004Id: '1:1001',
      ownerAddress: nonOwner.address,
      chainType: 'evm',
      signature: nonOwnerSig,
      nonce: nonOwnerNonce.nonce,
      mode: 'delete'
    }
  });
  expect(nonOwnerResp.status()).toBe(403);
  expect((await nonOwnerResp.json()).error).toBe('OWNERSHIP_MISMATCH');

  const ownerNonceResp = await request.get('/api/erc8004/optout/nonce?erc8004Id=1:1001');
  expect(ownerNonceResp.ok()).toBeTruthy();
  const ownerNonce = await ownerNonceResp.json();
  const ownerMsg = buildOptOutMessage({ erc8004Id: '1:1001', nonce: ownerNonce.nonce });
  const ownerSig = await owner.signMessage(ownerMsg);
  const ownerResp = await request.post('/api/erc8004/optout', {
    data: {
      erc8004Id: '1:1001',
      ownerAddress: owner.address,
      chainType: 'evm',
      signature: ownerSig,
      nonce: ownerNonce.nonce,
      reason: 'owner requested removal',
      mode: 'delete'
    }
  });
  expect(ownerResp.ok()).toBeTruthy();
  const ownerJson = await ownerResp.json();
  expect(ownerJson.ok).toBeTruthy();
  expect(ownerJson.optedOut).toBeTruthy();

  const atlasAgentResp = await request.get('/api/atlas/agent/1:1001');
  expect(atlasAgentResp.status()).toBe(404);
  const atlasSearchResp = await request.get('/api/atlas/search?q=1:1001');
  expect(atlasSearchResp.ok()).toBeTruthy();
  const atlasSearch = await atlasSearchResp.json();
  expect((atlasSearch.results || []).find((r) => r.erc8004Id === '1:1001') || null).toBeNull();

  const shareResp = await request.get('/api/share/sh_optout_1');
  expect(shareResp.status()).toBe(404);
  const leaderboardResp = await request.get('/api/leaderboard');
  expect(leaderboardResp.ok()).toBeTruthy();
  const leaderboard = await leaderboardResp.json();
  expect((leaderboard.teams || []).find((t) => t.shareId === 'sh_optout_1') || null).toBeNull();

  const secondImport = runImporter(sourceSqlitePath);
  expect(secondImport.status).toBe(0);

  const finalStore = readStore();
  expect((finalStore.anchors || []).find((a) => a.erc8004Id === '1:1001') || null).toBeNull();
  expect((finalStore.erc8004OptOut || []).find((r) => r.erc8004Id === '1:1001') || null).toBeTruthy();
});
