const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const { createCivicAuditLedger } = require('../server/world_civilization/audit_ledger');
const { createCivicDelegationStore } = require('../server/world_civilization/delegations');
const { createCivicEffectStore } = require('../server/world_civilization/effects');
const { createCivicInstitutionStore } = require('../server/world_civilization/institutions');
const { createCivicModerationStore } = require('../server/world_civilization/moderation');
const { createCivicProposalStore } = require('../server/world_civilization/proposals');
const { createCivicPublicWorksStore } = require('../server/world_civilization/public_works');
const { createCivicReputationStore } = require('../server/world_civilization/reputation');
const { createCivicVoteStore } = require('../server/world_civilization/votes');
const {
  V6_CIVIC_RESILIENCE_STORES,
  buildV6ResilienceBaselineReport
} = require('../server/world_civilization/resilience');
const {
  CIVIC_SQLITE_SCHEMA_METADATA_TABLE,
  CIVIC_SQLITE_SCHEMA_USER_VERSION,
  readSqliteUserVersion
} = require('../server/world_civilization/sqlite_schema');
const { V6_WORLD_FEATURE_FLAG } = require('../server/world_grid/feature_flags');

function withTempCivicStores(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-schema-metadata-'));
  const auditLedger = createCivicAuditLedger({ sqlitePath: path.join(dir, 'audit.sqlite') });
  const proposalStore = createCivicProposalStore({ sqlitePath: path.join(dir, 'proposals.sqlite'), auditLedger });
  const moderationStore = createCivicModerationStore({ sqlitePath: path.join(dir, 'moderation.sqlite'), auditLedger });
  const voteStore = createCivicVoteStore({
    sqlitePath: path.join(dir, 'votes.sqlite'),
    proposalStore,
    auditLedger
  });
  const reputationStore = createCivicReputationStore({ sqlitePath: path.join(dir, 'reputation.sqlite'), auditLedger });
  const delegationStore = createCivicDelegationStore({ sqlitePath: path.join(dir, 'delegations.sqlite'), auditLedger });
  const institutionStore = createCivicInstitutionStore({ sqlitePath: path.join(dir, 'institutions.sqlite'), auditLedger });
  const effectStore = createCivicEffectStore({
    sqlitePath: path.join(dir, 'effects.sqlite'),
    proposalStore,
    voteStore,
    moderationStore,
    auditLedger
  });
  const publicWorksStore = createCivicPublicWorksStore({
    sqlitePath: path.join(dir, 'public_works.sqlite'),
    institutionStore,
    auditLedger
  });
  const stores = {
    audit_ledger: auditLedger,
    proposals: proposalStore,
    votes: voteStore,
    reputation: reputationStore,
    moderation: moderationStore,
    effects: effectStore,
    delegations: delegationStore,
    institutions: institutionStore,
    public_works: publicWorksStore
  };
  try {
    return fn({ dir, stores });
  } finally {
    publicWorksStore.close();
    effectStore.close();
    institutionStore.close();
    delegationStore.close();
    reputationStore.close();
    voteStore.close();
    moderationStore.close();
    proposalStore.close();
    auditLedger.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('V6 civic SQLite stores stamp v1 schema metadata and expose it to resilience reports', () => withTempCivicStores(({ stores }) => {
  const expectedByKey = new Map(V6_CIVIC_RESILIENCE_STORES.map((entry) => [entry.key, entry]));

  for (const [key, store] of Object.entries(stores)) {
    const expected = expectedByKey.get(key);
    const metadata = store.getSchemaMetadata();

    assert.equal(store.migrationVersion, 'v1', key);
    assert.equal(metadata.storeKey, key);
    assert.equal(metadata.migrationVersion, 'v1');
    assert.equal(metadata.schemaUserVersion, CIVIC_SQLITE_SCHEMA_USER_VERSION);
    assert.equal(metadata.modulePath, expected.modulePath);
    assert.equal(metadata.releaseStatus, 'research_only');
  }

  const report = buildV6ResilienceBaselineReport({
    includeResearchEvidence: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    stores
  });
  assert.equal(report.releaseReady, false);
  assert.deepEqual(report.storeReports.map((entry) => entry.key), [...expectedByKey.keys()]);
  for (const storeReport of report.storeReports) {
    assert.equal(storeReport.ok, true, storeReport.key);
    assert.equal(storeReport.schemaMetadataOk, true, storeReport.key);
    assert.equal(storeReport.expectedMigrationVersion, 'v1', storeReport.key);
    assert.equal(storeReport.schemaMetadata.storeKey, storeReport.key);
    assert.equal(storeReport.schemaMetadata.releaseStatus, 'research_only');
  }
}));

test('V6 civic SQLite schema metadata fails closed on unsupported user_version', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-schema-version-'));
  const sqlitePath = path.join(dir, 'audit.sqlite');
  try {
    const db = new DatabaseSync(sqlitePath);
    db.exec('PRAGMA user_version = 2;');
    assert.equal(readSqliteUserVersion(db), 2);
    db.close();

    assert.throws(
      () => createCivicAuditLedger({ sqlitePath }),
      /CIVIC_SQLITE_SCHEMA_USER_VERSION_UNSUPPORTED/
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('V6 civic SQLite schema metadata fails closed on migration marker drift', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-schema-marker-'));
  const sqlitePath = path.join(dir, 'audit.sqlite');
  try {
    const db = new DatabaseSync(sqlitePath);
    db.exec(`
      PRAGMA user_version = ${CIVIC_SQLITE_SCHEMA_USER_VERSION};
      CREATE TABLE ${CIVIC_SQLITE_SCHEMA_METADATA_TABLE} (
        store_key TEXT PRIMARY KEY,
        migration_version TEXT NOT NULL,
        schema_user_version INTEGER NOT NULL,
        metadata_json TEXT NOT NULL
      );
    `);
    db.prepare(`
      INSERT INTO ${CIVIC_SQLITE_SCHEMA_METADATA_TABLE} (
        store_key, migration_version, schema_user_version, metadata_json
      ) VALUES (?, ?, ?, ?)
    `).run('audit_ledger', 'v0', CIVIC_SQLITE_SCHEMA_USER_VERSION, JSON.stringify({
      modulePath: 'server/world_civilization/audit_ledger.js',
      releaseStatus: 'research_only'
    }));
    db.close();

    assert.throws(
      () => createCivicAuditLedger({ sqlitePath }),
      /CIVIC_SQLITE_SCHEMA_MIGRATION_VERSION_MISMATCH/
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
