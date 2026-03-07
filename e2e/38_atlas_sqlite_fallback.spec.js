const { test, expect } = require('@playwright/test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const { getAtlasSnapshot } = require('../server/atlas');

test('atlas snapshot derives districts from agent rows when chains table is missing', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-sqlite-fallback-'));
  const sqlitePath = path.join(tmpDir, 'erc8004.sqlite3');
  const db = new DatabaseSync(sqlitePath);
  db.exec(
    [
      'CREATE TABLE erc8004_agents (',
      '  agent_id TEXT,',
      '  chain_id INTEGER,',
      '  name TEXT,',
      '  description TEXT,',
      '  image_url TEXT,',
      '  updated_at TEXT,',
      '  is_testnet INTEGER DEFAULT 0',
      ');'
    ].join('\n')
  );

  const insert = db.prepare(
    [
      'INSERT INTO erc8004_agents (',
      '  agent_id, chain_id, name, description, image_url, updated_at, is_testnet',
      ') VALUES (?, ?, ?, ?, ?, ?, ?)'
    ].join('\n')
  );
  const now = new Date().toISOString();
  insert.run('1:1001', 1, 'Atlas Sentinel', 'mainnet row', '', now, 0);
  insert.run('1:1002', 1, 'Atlas Ranger', 'mainnet row', '', now, 0);
  insert.run('11155111:1003', 11155111, 'Atlas Scout', 'testnet row', '', now, 1);
  db.close();

  const snapshot = getAtlasSnapshot({ env: 'development', sqlitePath });
  expect(snapshot.meta?.source).toContain('sqlite:');
  expect(Array.isArray(snapshot.agents)).toBeTruthy();
  expect(Array.isArray(snapshot.districts)).toBeTruthy();
  expect(snapshot.agents.length).toBe(3);
  expect(snapshot.districts.length).toBe(1);
  expect(snapshot.districts[0].key).toBe('ethereum');
  expect(snapshot.districts[0].totalAgents).toBe(3);
  expect(snapshot.districts[0].mainnet?.agents).toBe(2);
  expect(snapshot.districts[0].testnets?.agents).toBe(1);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
