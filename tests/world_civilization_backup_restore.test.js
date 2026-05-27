const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

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
  REQUIRED_BACKUP_RESTORE_RELEASE_GAPS,
  V6_BACKUP_RESTORE_REHEARSAL_VERSION,
  assertV6BackupRestoreRehearsalSafe,
  buildV6BackupRestoreRehearsalReport
} = require('../server/world_civilization/backup_restore');
const { CIVIC_SCHEMA_VERSION } = require('../server/world_civilization/schemas');
const { V6_CIVIC_RESILIENCE_STORES } = require('../server/world_civilization/resilience');

const HASH_A = `sha256:${'a'.repeat(64)}`;
const HASH_B = `sha256:${'b'.repeat(64)}`;

function auditEntry(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    entryId: 'audit_backup_restore_001',
    actor: {
      kind: 'human',
      accountId: 'acct_v6_backup_restore_001'
    },
    actionType: 'civic_action.applied',
    objectRef: 'action_backup_restore_001',
    idempotencyKey: 'idem_backup_restore_001',
    beforeHash: HASH_A,
    afterHash: HASH_B,
    beforeSummary: 'No proposal backup rehearsal row existed.',
    afterSummary: 'A research-only backup rehearsal audit row exists.',
    createdAtMs: 1_779_784_000_000,
    migrationVersion: 'v1',
    replayable: true,
    rollbackId: '',
    privacy: {
      redacted: true,
      privateDataIncluded: false,
      dataClasses: ['public_audit_summary']
    },
    ...overrides
  };
}

function closeStores(stores = {}) {
  stores.publicWorksStore?.close();
  stores.effectStore?.close();
  stores.institutionStore?.close();
  stores.delegationStore?.close();
  stores.reputationStore?.close();
  stores.voteStore?.close();
  stores.moderationStore?.close();
  stores.proposalStore?.close();
  stores.auditLedger?.close();
}

function withClosedTempCivicStorePaths(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-backup-restore-'));
  const storePaths = {
    audit_ledger: path.join(dir, 'audit.sqlite'),
    proposals: path.join(dir, 'proposals.sqlite'),
    votes: path.join(dir, 'votes.sqlite'),
    reputation: path.join(dir, 'reputation.sqlite'),
    moderation: path.join(dir, 'moderation.sqlite'),
    effects: path.join(dir, 'effects.sqlite'),
    delegations: path.join(dir, 'delegations.sqlite'),
    institutions: path.join(dir, 'institutions.sqlite'),
    public_works: path.join(dir, 'public_works.sqlite')
  };
  const auditLedger = createCivicAuditLedger({ sqlitePath: storePaths.audit_ledger });
  const proposalStore = createCivicProposalStore({ sqlitePath: storePaths.proposals, auditLedger });
  const moderationStore = createCivicModerationStore({ sqlitePath: storePaths.moderation, auditLedger });
  const voteStore = createCivicVoteStore({
    sqlitePath: storePaths.votes,
    proposalStore,
    auditLedger
  });
  const reputationStore = createCivicReputationStore({ sqlitePath: storePaths.reputation, auditLedger });
  const delegationStore = createCivicDelegationStore({ sqlitePath: storePaths.delegations, auditLedger });
  const institutionStore = createCivicInstitutionStore({ sqlitePath: storePaths.institutions, auditLedger });
  const effectStore = createCivicEffectStore({
    sqlitePath: storePaths.effects,
    proposalStore,
    voteStore,
    moderationStore,
    auditLedger
  });
  const publicWorksStore = createCivicPublicWorksStore({
    sqlitePath: storePaths.public_works,
    institutionStore,
    auditLedger
  });
  const stores = {
    auditLedger,
    proposalStore,
    moderationStore,
    voteStore,
    reputationStore,
    delegationStore,
    institutionStore,
    effectStore,
    publicWorksStore
  };
  let closed = false;
  try {
    auditLedger.append(auditEntry());
    closeStores(stores);
    closed = true;
    return fn({
      dir,
      storePaths,
      backupDir: path.join(dir, 'backup')
    });
  } finally {
    if (!closed) closeStores(stores);
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('V6 backup restore rehearsal copies closed SQLite stores without exposing row payloads', () => (
  withClosedTempCivicStorePaths(({ storePaths, backupDir }) => {
    const report = buildV6BackupRestoreRehearsalReport({
      storePaths,
      backupDir,
      storeRequirements: V6_CIVIC_RESILIENCE_STORES,
      source: 'node_test'
    });

    assert.equal(report.version, V6_BACKUP_RESTORE_REHEARSAL_VERSION);
    assert.equal(report.status, 'research_only');
    assert.equal(report.source, 'node_test');
    assert.equal(report.ok, true);
    assert.equal(report.releaseReady, false);
    assert.equal(report.runtimeExposed, false);
    assert.equal(report.playerVisible, false);
    assert.equal(report.appliesWorldState, false);
    assert.equal(report.exposesPrivateData, false);
    assert.equal(report.reportPayloadIncludesRows, false);
    assert.equal(report.executionStatus, 'not_executable');
    assert.deepEqual(report.releaseGaps, REQUIRED_BACKUP_RESTORE_RELEASE_GAPS);
    assert.deepEqual(report.storeReports.map((entry) => entry.key), V6_CIVIC_RESILIENCE_STORES.map((entry) => entry.key));
    for (const storeReport of report.storeReports) {
      assert.equal(storeReport.ok, true, storeReport.key);
      assert.equal(storeReport.sourceExists, true, storeReport.key);
      assert.equal(storeReport.restoredExists, true, storeReport.key);
      assert.equal(storeReport.hashesMatch, true, storeReport.key);
      assert.equal(storeReport.metadataMatches, true, storeReport.key);
      assert.equal(storeReport.reportPayloadIncludesRows, false, storeReport.key);
      assert.equal(storeReport.sourceMetadata.storeKey, storeReport.key);
      assert.equal(storeReport.restoredMetadata.storeKey, storeReport.key);
      assert.ok(storeReport.copiedFileCount >= 1, storeReport.key);
      assert.ok(storeReport.copiedFiles.every((entry) => (
        entry.sourceSha256 === entry.restoredSha256
        && entry.sourceBytes === entry.restoredBytes
        && !Object.prototype.hasOwnProperty.call(entry, 'rows')
      )), storeReport.key);
    }

    const restoredAudit = createCivicAuditLedger({ sqlitePath: path.join(backupDir, 'audit_ledger.sqlite') });
    try {
      assert.equal(restoredAudit.count(), 1);
      assert.equal(restoredAudit.getByEntryId('audit_backup_restore_001').entry.entryId, 'audit_backup_restore_001');
    } finally {
      restoredAudit.close();
    }
    assert.deepEqual(assertV6BackupRestoreRehearsalSafe(report), { ok: true, errors: [] });
  })
));

test('V6 backup restore rehearsal fails closed when a required store path is missing', () => (
  withClosedTempCivicStorePaths(({ storePaths, backupDir }) => {
    const incompletePaths = { ...storePaths };
    delete incompletePaths.public_works;
    const report = buildV6BackupRestoreRehearsalReport({
      storePaths: incompletePaths,
      backupDir,
      storeRequirements: V6_CIVIC_RESILIENCE_STORES
    });

    assert.equal(report.ok, false);
    assert.match(report.errors.join(','), /V6_BACKUP_RESTORE_STORE_INVALID:public_works/);
    const safety = assertV6BackupRestoreRehearsalSafe(report);
    assert.equal(safety.ok, false);
    assert.match(safety.errors.join(','), /V6_BACKUP_RESTORE_ERRORS_PRESENT/);
    assert.match(safety.errors.join(','), /V6_BACKUP_RESTORE_STORE_INVALID:public_works/);
  })
));

test('V6 backup restore safety assertion rejects fake release or private row payload exposure', () => (
  withClosedTempCivicStorePaths(({ storePaths, backupDir }) => {
    const report = buildV6BackupRestoreRehearsalReport({
      storePaths,
      backupDir,
      storeRequirements: V6_CIVIC_RESILIENCE_STORES
    });
    const unsafe = {
      ...report,
      status: 'release_candidate',
      releaseReady: true,
      runtimeExposed: true,
      playerVisible: true,
      appliesWorldState: true,
      exposesPrivateData: true,
      reportPayloadIncludesRows: true,
      executionStatus: 'executes',
      releaseGaps: [],
      storeReports: report.storeReports.map((entry) => (
        entry.key === 'audit_ledger'
          ? { ...entry, reportPayloadIncludesRows: true, rows: [{ private: 'not allowed' }] }
          : entry
      ))
    };
    const safety = assertV6BackupRestoreRehearsalSafe(unsafe);

    assert.equal(safety.ok, false);
    assert.match(safety.errors.join(','), /V6_BACKUP_RESTORE_RESEARCH_ONLY_REQUIRED/);
    assert.match(safety.errors.join(','), /V6_BACKUP_RESTORE_RELEASE_READY_FORBIDDEN/);
    assert.match(safety.errors.join(','), /V6_BACKUP_RESTORE_RUNTIME_HIDDEN_REQUIRED/);
    assert.match(safety.errors.join(','), /V6_BACKUP_RESTORE_PLAYER_HIDDEN_REQUIRED/);
    assert.match(safety.errors.join(','), /V6_BACKUP_RESTORE_WORLD_APPLICATION_FORBIDDEN/);
    assert.match(safety.errors.join(','), /V6_BACKUP_RESTORE_PRIVATE_DATA_REPORT_FORBIDDEN/);
    assert.match(safety.errors.join(','), /V6_BACKUP_RESTORE_NON_EXECUTING_REQUIRED/);
    assert.match(safety.errors.join(','), /V6_BACKUP_RESTORE_RELEASE_GAPS_REQUIRED/);
    assert.match(safety.errors.join(','), /V6_BACKUP_RESTORE_STORE_ROW_PAYLOAD_FORBIDDEN:audit_ledger/);
  })
));
