const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { createCivicAuditLedger, sha256 } = require('../server/world_civilization/audit_ledger');
const { createCivicDelegationStore } = require('../server/world_civilization/delegations');
const { createCivicEffectStore } = require('../server/world_civilization/effects');
const { createCivicInstitutionStore } = require('../server/world_civilization/institutions');
const { createCivicModerationStore } = require('../server/world_civilization/moderation');
const { createCivicProposalStore } = require('../server/world_civilization/proposals');
const { createCivicPublicWorksStore } = require('../server/world_civilization/public_works');
const { createCivicReputationStore } = require('../server/world_civilization/reputation');
const { createCivicVoteStore } = require('../server/world_civilization/votes');
const { CIVIC_SCHEMA_VERSION } = require('../server/world_civilization/schemas');
const {
  REQUIRED_MIGRATION_LOAD_REPLAY_RELEASE_GAPS,
  V6_MIGRATION_LOAD_REPLAY_REHEARSAL_VERSION,
  assertV6MigrationLoadReplayRehearsalSafe,
  buildV6MigrationLoadReplayRehearsalReport
} = require('../server/world_civilization/migration_load_replay');
const { V6_CIVIC_RESILIENCE_STORES } = require('../server/world_civilization/resilience');

const ACTION_TYPES = [
  'proposal.created',
  'vote.recorded',
  'moderation.decided',
  'reputation.recorded',
  'delegation.created',
  'institution.chartered',
  'public_works.project.recorded',
  'civic_action.prepared'
];

function withTempCivicStores(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-migration-load-replay-'));
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
    return fn({ stores, auditLedger });
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

function padded(index) {
  return String(index).padStart(3, '0');
}

function auditEntry(index) {
  const id = padded(index);
  const actionType = ACTION_TYPES[index % ACTION_TYPES.length];
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    entryId: `audit_migration_load_replay_${id}`,
    actor: {
      kind: 'human',
      accountId: `acct_v6_migration_load_${padded(index % 9)}`
    },
    actionType,
    objectRef: `object_migration_load_${id}`,
    idempotencyKey: `idem_migration_load_replay_${id}`,
    beforeHash: sha256(`agent-town.v6.migration-load.before:${id}`),
    afterHash: sha256(`agent-town.v6.migration-load.after:${id}`),
    beforeSummary: `migration load replay before summary ${id}`,
    afterSummary: `migration load replay after summary ${id}`,
    createdAtMs: 1_779_810_000_000 + index,
    migrationVersion: 'v1',
    replayable: true,
    rollbackId: index % 15 === 0 ? `rollback_migration_load_${id}` : '',
    privacy: {
      redacted: true,
      privateDataIncluded: false,
      dataClasses: ['public_audit_summary']
    }
  };
}

function seedLedger(ledger, count) {
  for (let index = 0; index < count; index += 1) {
    const row = ledger.append(auditEntry(index));
    assert.equal(row.seq, index + 1);
  }
}

test('V6 migration load replay rehearsal inventories schema metadata then replays bounded audit load without execution', () => (
  withTempCivicStores(({ stores, auditLedger }) => {
    const entryCount = 96;
    seedLedger(auditLedger, entryCount);

    const report = buildV6MigrationLoadReplayRehearsalReport({
      stores,
      storeRequirements: V6_CIVIC_RESILIENCE_STORES,
      ledger: auditLedger,
      expectedReplayEntryCount: entryCount,
      pageSize: 13,
      maxEntries: entryCount,
      source: 'node_test'
    });

    assert.equal(report.version, V6_MIGRATION_LOAD_REPLAY_REHEARSAL_VERSION);
    assert.equal(report.status, 'research_only');
    assert.equal(report.source, 'node_test');
    assert.equal(report.ok, true);
    assert.equal(report.currentMigrationVersion, 'v1');
    assert.equal(report.targetMigrationVersion, 'v1');
    assert.equal(report.direction, 'same_version_inventory');
    assert.equal(report.migrationScriptsAvailable, false);
    assert.equal(report.appliesMigration, false);
    assert.equal(report.appliesWorldState, false);
    assert.equal(report.exposesPrivateData, false);
    assert.equal(report.reportPayloadIncludesRows, false);
    assert.equal(report.executionStatus, 'not_executable');
    assert.equal(report.releaseReady, false);
    assert.equal(report.expectedStoreCount, V6_CIVIC_RESILIENCE_STORES.length);
    assert.equal(report.storeCount, V6_CIVIC_RESILIENCE_STORES.length);
    assert.equal(report.expectedReplayEntryCount, entryCount);
    assert.equal(report.replayEntryCount, entryCount);
    assert.equal(report.replayPageSize, 13);
    assert.equal(report.replayMaxEntries, entryCount);
    assert.equal(report.hashChainValid, true);
    assert.equal(report.privacySafeReplay, true);
    assert.equal(report.summaryComplete, true);
    assert.deepEqual(report.releaseGaps, REQUIRED_MIGRATION_LOAD_REPLAY_RELEASE_GAPS);
    assert.deepEqual(report.migrationStoreReports.map((entry) => entry.key), V6_CIVIC_RESILIENCE_STORES.map((entry) => entry.key));
    assert.ok(report.migrationStoreReports.every((entry) => entry.ok === true));
    assert.ok(report.migrationStoreReports.every((entry) => entry.metadataOk === true));
    assert.ok(report.migrationStoreReports.every((entry) => !Object.hasOwn(entry, 'schemaMetadata')));
    assert.ok(report.migrationStoreReports.every((entry) => !Object.hasOwn(entry, 'rows')));
    assert.deepEqual(assertV6MigrationLoadReplayRehearsalSafe(report), { ok: true, errors: [] });
  })
));

test('V6 migration load replay rehearsal fails closed for unsupported migration target', () => (
  withTempCivicStores(({ stores, auditLedger }) => {
    seedLedger(auditLedger, 3);
    const report = buildV6MigrationLoadReplayRehearsalReport({
      stores,
      storeRequirements: V6_CIVIC_RESILIENCE_STORES,
      ledger: auditLedger,
      targetMigrationVersion: 'v2',
      expectedReplayEntryCount: 3
    });

    assert.equal(report.ok, false);
    assert.equal(report.direction, 'unsupported_upgrade');
    assert.match(report.errors.join(','), /V6_MIGRATION_LOAD_REPLAY_MIGRATION_INVENTORY_INVALID/);
    assert.match(report.errors.join(','), /V6_MIGRATION_LOAD_REPLAY_UNSUPPORTED_DIRECTION/);
    const safety = assertV6MigrationLoadReplayRehearsalSafe(report);
    assert.equal(safety.ok, false);
    assert.match(safety.errors.join(','), /V6_MIGRATION_LOAD_REPLAY_ERRORS_PRESENT/);
  })
));

test('V6 migration load replay assertion rejects fake migration execution and row-payload exposure', () => (
  withTempCivicStores(({ stores, auditLedger }) => {
    seedLedger(auditLedger, 2);
    const report = buildV6MigrationLoadReplayRehearsalReport({
      stores,
      storeRequirements: V6_CIVIC_RESILIENCE_STORES,
      ledger: auditLedger,
      expectedReplayEntryCount: 2
    });
    const unsafe = {
      ...report,
      status: 'release_candidate',
      releaseReady: true,
      appliesMigration: true,
      appliesWorldState: true,
      migrationScriptsAvailable: true,
      exposesPrivateData: true,
      reportPayloadIncludesRows: true,
      executionStatus: 'executes',
      hashChainValid: false,
      releaseGaps: [],
      migrationStoreReports: report.migrationStoreReports.map((entry) => (
        entry.key === 'audit_ledger'
          ? { ...entry, rows: [{ private: 'forbidden' }] }
          : entry
      ))
    };
    const result = assertV6MigrationLoadReplayRehearsalSafe(unsafe);

    assert.equal(result.ok, false);
    assert.match(result.errors.join(','), /V6_MIGRATION_LOAD_REPLAY_RESEARCH_ONLY_REQUIRED/);
    assert.match(result.errors.join(','), /V6_MIGRATION_LOAD_REPLAY_RELEASE_READY_FORBIDDEN/);
    assert.match(result.errors.join(','), /V6_MIGRATION_LOAD_REPLAY_MIGRATION_APPLICATION_FORBIDDEN/);
    assert.match(result.errors.join(','), /V6_MIGRATION_LOAD_REPLAY_WORLD_APPLICATION_FORBIDDEN/);
    assert.match(result.errors.join(','), /V6_MIGRATION_LOAD_REPLAY_SCRIPT_AVAILABILITY_FORBIDDEN/);
    assert.match(result.errors.join(','), /V6_MIGRATION_LOAD_REPLAY_PRIVATE_ROW_REPORT_FORBIDDEN/);
    assert.match(result.errors.join(','), /V6_MIGRATION_LOAD_REPLAY_NON_EXECUTING_REQUIRED/);
    assert.match(result.errors.join(','), /V6_MIGRATION_LOAD_REPLAY_RELEASE_GAPS_REQUIRED/);
    assert.match(result.errors.join(','), /V6_MIGRATION_LOAD_REPLAY_REPLAY_SAFETY_REQUIRED/);
    assert.match(result.errors.join(','), /V6_MIGRATION_LOAD_REPLAY_ROW_PAYLOAD_FORBIDDEN:audit_ledger/);
  })
));
