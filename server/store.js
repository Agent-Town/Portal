const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const TABLES = ['signups', 'shares', 'publicTeams', 'houses', 'anchors', 'inbox'];

let db = null;
let statements = null;

function getStorePath() {
  // Allow tests/e2e to isolate their store file and avoid dirtying tracked fixtures.
  if (process.env.STORE_PATH) return process.env.STORE_PATH;

  const isTest = process.env.NODE_ENV === 'test';
  const filename = isTest ? 'store.test.sqlite' : 'store.sqlite';
  return path.join(process.cwd(), 'data', filename);
}

function getLegacyStorePath() {
  if (process.env.STORE_PATH) return null;
  const isTest = process.env.NODE_ENV === 'test';
  const filename = isTest ? 'store.test.json' : 'store.json';
  return path.join(process.cwd(), 'data', filename);
}

function ensureDb() {
  if (db) return;
  const p = getStorePath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  db = new DatabaseSync(p);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec(
    [
      'CREATE TABLE IF NOT EXISTS signups (pos INTEGER NOT NULL, data TEXT NOT NULL);',
      'CREATE TABLE IF NOT EXISTS shares (pos INTEGER NOT NULL, data TEXT NOT NULL);',
      'CREATE TABLE IF NOT EXISTS publicTeams (pos INTEGER NOT NULL, data TEXT NOT NULL);',
      'CREATE TABLE IF NOT EXISTS houses (pos INTEGER NOT NULL, data TEXT NOT NULL);',
      'CREATE TABLE IF NOT EXISTS anchors (pos INTEGER NOT NULL, data TEXT NOT NULL);',
      'CREATE TABLE IF NOT EXISTS inbox (pos INTEGER NOT NULL, data TEXT NOT NULL);'
    ].join('\n')
  );
  statements = buildStatements(db);
  maybeImportLegacyStore();
}

function buildStatements(database) {
  const out = {};
  for (const table of TABLES) {
    out[table] = {
      all: database.prepare(`SELECT data FROM ${table} ORDER BY pos ASC`),
      clear: database.prepare(`DELETE FROM ${table}`),
      insert: database.prepare(`INSERT INTO ${table} (pos, data) VALUES (?, ?)`),
      count: database.prepare(`SELECT COUNT(1) as count FROM ${table}`)
    };
  }
  return out;
}

function withTransaction(database, fn) {
  database.exec('BEGIN');
  try {
    fn();
    database.exec('COMMIT');
  } catch (err) {
    database.exec('ROLLBACK');
    throw err;
  }
}

function normalizeStore(next) {
  return {
    signups: Array.isArray(next?.signups) ? next.signups : [],
    shares: Array.isArray(next?.shares) ? next.shares : [],
    publicTeams: Array.isArray(next?.publicTeams) ? next.publicTeams : [],
    houses: Array.isArray(next?.houses)
      ? next.houses.map((house) => {
          if (!house || typeof house !== 'object') return house;
          const { keyWrapSig, ...rest } = house;
          return rest;
        })
      : [],
    anchors: Array.isArray(next?.anchors) ? next.anchors : [],
    inbox: Array.isArray(next?.inbox) ? next.inbox : []
  };
}

function readStore() {
  ensureDb();
  const store = { signups: [], shares: [], publicTeams: [], houses: [], anchors: [], inbox: [] };
  for (const table of TABLES) {
    const rows = statements[table].all.all();
    const parsed = [];
    for (const row of rows) {
      try {
        parsed.push(JSON.parse(row.data));
      } catch (err) {
        // Skip malformed rows to keep the store usable.
      }
    }
    store[table] = parsed;
  }
  return store;
}

function writeStore(next) {
  ensureDb();
  const cleaned = normalizeStore(next);
  withTransaction(db, () => {
    for (const table of TABLES) {
      statements[table].clear.run();
      const rows = cleaned[table];
      for (let i = 0; i < rows.length; i += 1) {
        statements[table].insert.run(i, JSON.stringify(rows[i]));
      }
    }
  });
}

function maybeImportLegacyStore() {
  const legacyPath = getLegacyStorePath();
  if (!legacyPath || !fs.existsSync(legacyPath)) return;
  if (process.env.NODE_ENV === 'test') return;
  const hasData = TABLES.some((table) => statements[table].count.get().count > 0);
  if (hasData) return;
  try {
    const raw = fs.readFileSync(legacyPath, 'utf8');
    const parsed = JSON.parse(raw);
    const cleaned = normalizeStore(parsed);
    withTransaction(db, () => {
      for (const table of TABLES) {
        statements[table].clear.run();
        const rows = cleaned[table];
        for (let i = 0; i < rows.length; i += 1) {
          statements[table].insert.run(i, JSON.stringify(rows[i]));
        }
      }
    });
  } catch (err) {
    // Ignore legacy import errors and start with an empty store.
  }
}

module.exports = {
  getStorePath,
  readStore,
  writeStore
};
