const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { V6_WORLD_FEATURE_FLAG, parseWorldGridFeatureFlags } = require('../server/world_grid/feature_flags');
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
  REQUIRED_RELEASE_GAPS,
  REQUIRED_RESILIENCE_EVIDENCE_CHECKS,
  REQUIRED_RESILIENCE_READINESS_CHECKS,
  REQUIRED_RESILIENCE_STORE_KEYS,
  V6_CIVIC_AUDIT_SUMMARY_COVERAGE,
  V6_CIVIC_BACKUP_RESTORE_COVERAGE,
  V6_CIVIC_LOAD_RATE_COVERAGE,
  V6_CIVIC_LOAD_RATE_TARGET_COVERAGE,
  V6_CIVIC_MIGRATION_LOAD_REPLAY_COVERAGE,
  V6_CIVIC_MIGRATION_REHEARSAL_COVERAGE,
  V6_CIVIC_ROLLBACK_RECOVERY_COVERAGE,
  V6_CIVIC_RESILIENCE_STORES,
  V6_CIVIC_WRITE_CONTENTION_COVERAGE,
  assertV6ResilienceBaseline,
  assertV6ResilienceReadinessGateSafe,
  buildV6ResilienceBaselineReport,
  buildV6ResilienceReadinessGate
} = require('../server/world_civilization/resilience');

function withTempCivicStores(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-resilience-'));
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

function resilienceReadinessEvidence(overrides = {}) {
  return {
    status: 'complete',
    executionStatus: 'not_executable',
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    mutatesWorldState: false,
    appliesRollback: false,
    appliesMigration: false,
    exposesPrivateData: false,
    processRestartCoverageComplete: true,
    replayReconstructionReleaseReady: true,
    migrationUpgradeDowngradeReviewed: true,
    loadRateReviewed: true,
    rollbackRecoveryReviewed: true,
    backupRestoreReviewed: true,
    privacySafeReplayReviewed: true,
    storeSpecificAuditSummaryCoverageComplete: true,
    checks: [...REQUIRED_RESILIENCE_EVIDENCE_CHECKS],
    storeKeys: [...REQUIRED_RESILIENCE_STORE_KEYS],
    ...overrides
  };
}

test('V6 resilience report is hidden without explicit research opt-in and V6 flag', () => {
  const withoutResearchOptIn = buildV6ResilienceBaselineReport({
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true }
  });
  const broadV5Override = buildV6ResilienceBaselineReport({
    includeResearchEvidence: true,
    featureFlags: parseWorldGridFeatureFlags('all')
  });

  for (const report of [withoutResearchOptIn, broadV5Override]) {
    assert.equal(report.available, false);
    assert.equal(report.runtimeExposed, false);
    assert.equal(report.playerVisible, false);
    assert.equal(report.releaseReady, false);
    assert.deepEqual(report.storeReports, []);
    assert.equal(report.loadRateCoverage, null);
    assert.equal(report.loadRateTargetCoverage, null);
    assert.equal(report.rollbackRecoveryCoverage, null);
    assert.equal(report.migrationRehearsalCoverage, null);
    assert.equal(report.migrationLoadReplayCoverage, null);
    assert.equal(report.backupRestoreCoverage, null);
    assert.equal(report.writeContentionCoverage, null);
    assert.deepEqual(report.releaseGaps, REQUIRED_RELEASE_GAPS);
    assert.deepEqual(assertV6ResilienceBaseline(report), { ok: true, errors: [] });
  }
});

test('V6 resilience baseline verifies current SQLite stores and keeps release gates open', () => withTempCivicStores(({ stores }) => {
  const report = buildV6ResilienceBaselineReport({
    includeResearchEvidence: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    source: 'node_test',
    stores
  });

  assert.equal(report.available, true);
  assert.equal(report.source, 'node_test');
  assert.equal(report.releaseReady, false);
  assert.deepEqual(report.loadRateCoverage, V6_CIVIC_LOAD_RATE_COVERAGE);
  assert.equal(report.loadRateCoverage.releaseReady, false);
  assert.ok(report.loadRateCoverage.coveredChecks.includes('idempotent_duplicate_retry_suppression'));
  assert.ok(report.loadRateCoverage.remainingReleaseGaps.includes('production_route_rate_limits'));
  assert.deepEqual(report.loadRateTargetCoverage, V6_CIVIC_LOAD_RATE_TARGET_COVERAGE);
  assert.equal(report.loadRateTargetCoverage.releaseReady, false);
  assert.ok(report.loadRateTargetCoverage.coveredChecks.includes('future_civic_route_rate_limit_targets'));
  assert.ok(report.loadRateTargetCoverage.coveredChecks.includes('no_world_state_application'));
  assert.ok(report.loadRateTargetCoverage.remainingReleaseGaps.includes('production_infrastructure_signoff_required'));
  assert.deepEqual(report.rollbackRecoveryCoverage, V6_CIVIC_ROLLBACK_RECOVERY_COVERAGE);
  assert.equal(report.rollbackRecoveryCoverage.releaseReady, false);
  assert.ok(report.rollbackRecoveryCoverage.coveredChecks.includes('prepared_rollback_handle_reconstruction'));
  assert.ok(report.rollbackRecoveryCoverage.remainingReleaseGaps.includes('typed_rollback_handlers'));
  assert.deepEqual(report.migrationRehearsalCoverage, V6_CIVIC_MIGRATION_REHEARSAL_COVERAGE);
  assert.equal(report.migrationRehearsalCoverage.releaseReady, false);
  assert.ok(report.migrationRehearsalCoverage.coveredChecks.includes('unsupported_upgrade_fails_closed'));
  assert.ok(report.migrationRehearsalCoverage.remainingReleaseGaps.includes('release_grade_upgrade_scripts'));
  assert.deepEqual(report.migrationLoadReplayCoverage, V6_CIVIC_MIGRATION_LOAD_REPLAY_COVERAGE);
  assert.equal(report.migrationLoadReplayCoverage.releaseReady, false);
  assert.ok(report.migrationLoadReplayCoverage.coveredChecks.includes('current_schema_inventory_before_replay'));
  assert.ok(report.migrationLoadReplayCoverage.coveredChecks.includes('no_migration_application'));
  assert.ok(report.migrationLoadReplayCoverage.remainingReleaseGaps.includes('large_dataset_migration_replay_required'));
  assert.deepEqual(report.backupRestoreCoverage, V6_CIVIC_BACKUP_RESTORE_COVERAGE);
  assert.equal(report.backupRestoreCoverage.releaseReady, false);
  assert.ok(report.backupRestoreCoverage.coveredChecks.includes('source_restored_hash_match'));
  assert.ok(report.backupRestoreCoverage.coveredChecks.includes('private_row_payload_exclusion'));
  assert.ok(report.backupRestoreCoverage.remainingReleaseGaps.includes('point_in_time_restore_drill_required'));
  assert.deepEqual(report.writeContentionCoverage, V6_CIVIC_WRITE_CONTENTION_COVERAGE);
  assert.equal(report.writeContentionCoverage.releaseReady, false);
  assert.ok(report.writeContentionCoverage.coveredChecks.includes('multi_process_audit_ledger_writes'));
  assert.ok(report.writeContentionCoverage.coveredChecks.includes('private_row_payload_exclusion'));
  assert.ok(report.writeContentionCoverage.remainingReleaseGaps.includes('production_route_contention_slo_targets_required'));
  assert.deepEqual(report.releaseGaps, REQUIRED_RELEASE_GAPS);
  assert.deepEqual(report.auditSummaryCoverage, V6_CIVIC_AUDIT_SUMMARY_COVERAGE);
  assert.equal(report.auditSummaryCoverage.releaseReady, false);
  assert.equal(report.auditSummaryCoverage.beforeAfterSummaryRequired, true);
  assert.equal(report.auditSummaryCoverage.zeroHashOnlyFallbacksRequired, true);
  assert.deepEqual(
    report.auditSummaryCoverage.coveredReplayGroups.map((entry) => entry.key),
    [
      'proposal_vote',
      'reputation_moderation',
      'effect_rollback',
      'delegation_lifecycle',
      'institution_charters',
      'public_works_resources'
    ]
  );
  assert.ok(report.auditSummaryCoverage.coveredReplayGroups.every((entry) => (
    entry.fallbackCoverage === 'zero_hash_only_fallbacks_proven'
  )));
  assert.equal(report.auditSummaryCoverage.excludedResearchFallbacks[0].key, 'manual_audit_ledger_rows');
  assert.deepEqual(report.storeReports.map((entry) => entry.key), V6_CIVIC_RESILIENCE_STORES.map((entry) => entry.key));
  for (const storeReport of report.storeReports) {
    assert.equal(storeReport.ok, true, storeReport.key);
    assert.equal(storeReport.sqliteBacked, true, storeReport.key);
    assert.equal(storeReport.sqliteFileExists, true, storeReport.key);
    assert.equal(storeReport.migrationVersion, 'v1', storeReport.key);
    assert.equal(storeReport.expectedMigrationVersion, 'v1', storeReport.key);
    assert.equal(storeReport.schemaMetadataOk, true, storeReport.key);
    assert.equal(storeReport.schemaMetadata.storeKey, storeReport.key);
    assert.equal(storeReport.schemaMetadata.migrationVersion, 'v1', storeReport.key);
    assert.equal(storeReport.schemaMetadata.releaseStatus, 'research_only', storeReport.key);
    assert.deepEqual(storeReport.missingMethods, [], storeReport.key);
    assert.deepEqual(storeReport.forbiddenPresent, [], storeReport.key);
    assert.match(storeReport.restartCoverage, /^tests\/world_civilization_.*\.test\.js$/);
  }
  assert.deepEqual(assertV6ResilienceBaseline(report), { ok: true, errors: [] });
}));

test('V6 resilience assertion fails closed for missing store evidence and release-ready drift', () => {
  const report = buildV6ResilienceBaselineReport({
    includeResearchEvidence: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    stores: {
      audit_ledger: {
        sqlitePath: '/tmp/portal-v6-missing-audit.sqlite',
        append() {},
        count() {},
        close() {}
      }
    }
  });
  const unsafe = {
    ...report,
    runtimeExposed: true,
    playerVisible: true,
    releaseReady: true,
    executionStatus: 'executes',
    auditSummaryCoverage: {
      ...report.auditSummaryCoverage,
      coveredReplayGroups: report.auditSummaryCoverage.coveredReplayGroups.map((entry) => (
        entry.key === 'proposal_vote' ? { ...entry, artifact: 'tests/fake_replay.test.js' } : entry
      ))
    },
    backupRestoreCoverage: {
      ...report.backupRestoreCoverage,
      artifact: 'tests/fake_backup_restore.test.js'
    },
    loadRateTargetCoverage: {
      ...report.loadRateTargetCoverage,
      artifact: 'tests/fake_load_rate_targets.test.js'
    },
    migrationLoadReplayCoverage: {
      ...report.migrationLoadReplayCoverage,
      artifact: 'tests/fake_migration_load_replay.test.js'
    },
    writeContentionCoverage: {
      ...report.writeContentionCoverage,
      artifact: 'tests/fake_write_contention.test.js'
    },
    releaseGaps: []
  };
  const result = assertV6ResilienceBaseline(unsafe);

  assert.equal(result.ok, false);
  assert.match(result.errors.join(','), /V6_RESILIENCE_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_RESILIENCE_PLAYER_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_RESILIENCE_RELEASE_READY_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_RESILIENCE_NON_EXECUTING_REQUIRED/);
  assert.match(result.errors.join(','), /V6_RESILIENCE_RELEASE_GAPS_REQUIRED/);
  assert.match(result.errors.join(','), /V6_RESILIENCE_AUDIT_SUMMARY_COVERAGE_REQUIRED/);
  assert.match(result.errors.join(','), /V6_RESILIENCE_LOAD_RATE_TARGET_COVERAGE_REQUIRED/);
  assert.match(result.errors.join(','), /V6_RESILIENCE_MIGRATION_LOAD_REPLAY_COVERAGE_REQUIRED/);
  assert.match(result.errors.join(','), /V6_RESILIENCE_BACKUP_RESTORE_COVERAGE_REQUIRED/);
  assert.match(result.errors.join(','), /V6_RESILIENCE_WRITE_CONTENTION_COVERAGE_REQUIRED/);
  assert.match(result.errors.join(','), /V6_RESILIENCE_STORE_EVIDENCE_INVALID:audit_ledger/);
  assert.match(result.errors.join(','), /V6_RESILIENCE_STORE_EVIDENCE_INVALID:proposals/);
  assert.match(result.errors.join(','), /V6_RESILIENCE_STORE_EVIDENCE_INVALID:public_works/);
});

test('V6 resilience readiness gate is hidden without explicit research opt-in and V6 flag', () => {
  const withoutResearchOptIn = buildV6ResilienceReadinessGate({
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence: resilienceReadinessEvidence()
  });
  const broadV5Override = buildV6ResilienceReadinessGate({
    includeResearchResilienceReadiness: true,
    featureFlags: parseWorldGridFeatureFlags('all'),
    evidence: resilienceReadinessEvidence()
  });

  for (const report of [withoutResearchOptIn, broadV5Override]) {
    assert.equal(report.available, false);
    assert.equal(report.researchReady, false);
    assert.equal(report.releaseReady, false);
    assert.equal(report.failClosed, true);
    assert.equal(report.runtimeExposed, false);
    assert.equal(report.playerVisible, false);
    assert.equal(report.normalGameplayExposure, false);
    assert.equal(report.mutatesWorldState, false);
    assert.equal(report.appliesRollback, false);
    assert.equal(report.appliesMigration, false);
    assert.equal(report.exposesPrivateData, false);
    assert.deepEqual(report.checks, []);
    assert.deepEqual(assertV6ResilienceReadinessGateSafe(report), { ok: true, errors: [] });
  }
});

test('V6 resilience readiness gate records restart replay migration load and rollback evidence without execution', () => {
  const report = buildV6ResilienceReadinessGate({
    includeResearchResilienceReadiness: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    source: 'node_test',
    evidence: resilienceReadinessEvidence()
  });

  assert.equal(report.available, true);
  assert.equal(report.source, 'node_test');
  assert.equal(report.researchReady, true);
  assert.equal(report.releaseReady, false);
  assert.equal(report.failClosed, false);
  assert.equal(report.runtimeExposed, false);
  assert.equal(report.playerVisible, false);
  assert.equal(report.normalGameplayExposure, false);
  assert.equal(report.mutatesWorldState, false);
  assert.equal(report.appliesRollback, false);
  assert.equal(report.appliesMigration, false);
  assert.equal(report.exposesPrivateData, false);
  assert.equal(report.executionStatus, 'not_executable');
  assert.deepEqual(report.checks.map((entry) => entry.key), REQUIRED_RESILIENCE_READINESS_CHECKS);
  assert.equal(report.evidence.ok, true);
  assert.equal(report.evidence.storeSpecificAuditSummaryCoverageComplete, true);
  assert.deepEqual(report.evidence.missingChecks, []);
  assert.deepEqual(report.evidence.missingStoreKeys, []);
  assert.deepEqual(report.evidence.requiredStoreKeys, REQUIRED_RESILIENCE_STORE_KEYS);
  assert.deepEqual(assertV6ResilienceReadinessGateSafe(report), { ok: true, errors: [] });
});

test('V6 resilience readiness gate fails closed without migration load rollback and store evidence', () => {
  const report = buildV6ResilienceReadinessGate({
    includeResearchResilienceReadiness: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence: resilienceReadinessEvidence({
      checks: REQUIRED_RESILIENCE_EVIDENCE_CHECKS.filter((check) => (
        check !== 'migration_upgrade_scripts'
        && check !== 'production_load_rate_targets'
        && check !== 'typed_rollback_execution_recovery'
        && check !== 'backup_restore_rehearsal'
        && check !== 'store_specific_zero_hash_only_fallbacks'
      )),
      storeKeys: REQUIRED_RESILIENCE_STORE_KEYS.filter((key) => key !== 'public_works'),
      migrationUpgradeDowngradeReviewed: false,
      loadRateReviewed: false,
      rollbackRecoveryReviewed: false,
      backupRestoreReviewed: false,
      storeSpecificAuditSummaryCoverageComplete: false
    })
  });

  assert.equal(report.available, true);
  assert.equal(report.researchReady, false);
  assert.equal(report.failClosed, true);
  assert.deepEqual(report.evidence.missingChecks, [
    'store_specific_zero_hash_only_fallbacks',
    'migration_upgrade_scripts',
    'backup_restore_rehearsal',
    'production_load_rate_targets',
    'typed_rollback_execution_recovery'
  ]);
  assert.deepEqual(report.evidence.missingStoreKeys, ['public_works']);
  assert.deepEqual(report.errors, [
    'RESILIENCE_EVIDENCE_REQUIRED',
    'RESILIENCE_MIGRATION_UPGRADE_DOWNGRADE_REQUIRED',
    'RESILIENCE_LOAD_RATE_REQUIRED',
    'RESILIENCE_ROLLBACK_RECOVERY_REQUIRED',
    'RESILIENCE_BACKUP_RESTORE_REQUIRED',
    'RESILIENCE_STORE_SPECIFIC_AUDIT_SUMMARY_COVERAGE_REQUIRED'
  ]);
  assert.deepEqual(assertV6ResilienceReadinessGateSafe(report), { ok: true, errors: [] });
});

test('V6 resilience readiness assertion rejects fake executable migration rollback or private-data readiness', () => {
  const report = buildV6ResilienceReadinessGate({
    includeResearchResilienceReadiness: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence: resilienceReadinessEvidence()
  });
  const unsafe = {
    ...report,
    runtimeExposed: true,
    playerVisible: true,
    normalGameplayExposure: true,
    mutatesWorldState: true,
    appliesRollback: true,
    appliesMigration: true,
    exposesPrivateData: true,
    releaseReady: true,
    executionStatus: 'executes',
    evidence: {
      ...report.evidence,
      runtimeExposed: true,
      playerVisible: true,
      normalGameplayExposure: true,
      mutatesWorldState: true,
      appliesRollback: true,
      appliesMigration: true,
      exposesPrivateData: true
    }
  };
  const result = assertV6ResilienceReadinessGateSafe(unsafe);

  assert.equal(result.ok, false);
  assert.match(result.errors.join(','), /V6_RESILIENCE_READINESS_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_RESILIENCE_READINESS_PLAYER_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_RESILIENCE_READINESS_NORMAL_GAMEPLAY_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_RESILIENCE_READINESS_WORLD_MUTATION_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_RESILIENCE_READINESS_ROLLBACK_APPLICATION_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_RESILIENCE_READINESS_MIGRATION_APPLICATION_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_RESILIENCE_READINESS_PRIVATE_DATA_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_RESILIENCE_READINESS_NON_EXECUTING_REQUIRED/);
  assert.match(result.errors.join(','), /V6_RESILIENCE_READINESS_RELEASE_READY_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_RESILIENCE_READINESS_EVIDENCE_MIGRATION_APPLICATION_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_RESILIENCE_READINESS_EVIDENCE_PRIVATE_DATA_FORBIDDEN/);
});
