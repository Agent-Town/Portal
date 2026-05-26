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
  V6_CIVIC_LOAD_RATE_COVERAGE,
  V6_CIVIC_ROLLBACK_RECOVERY_COVERAGE,
  V6_CIVIC_RESILIENCE_STORES,
  assertV6ResilienceBaseline,
  buildV6ResilienceBaselineReport
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
    assert.equal(report.rollbackRecoveryCoverage, null);
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
  assert.deepEqual(report.rollbackRecoveryCoverage, V6_CIVIC_ROLLBACK_RECOVERY_COVERAGE);
  assert.equal(report.rollbackRecoveryCoverage.releaseReady, false);
  assert.ok(report.rollbackRecoveryCoverage.coveredChecks.includes('prepared_rollback_handle_reconstruction'));
  assert.ok(report.rollbackRecoveryCoverage.remainingReleaseGaps.includes('typed_rollback_handlers'));
  assert.deepEqual(report.releaseGaps, REQUIRED_RELEASE_GAPS);
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
    releaseGaps: []
  };
  const result = assertV6ResilienceBaseline(unsafe);

  assert.equal(result.ok, false);
  assert.match(result.errors.join(','), /V6_RESILIENCE_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_RESILIENCE_PLAYER_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_RESILIENCE_RELEASE_READY_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_RESILIENCE_NON_EXECUTING_REQUIRED/);
  assert.match(result.errors.join(','), /V6_RESILIENCE_RELEASE_GAPS_REQUIRED/);
  assert.match(result.errors.join(','), /V6_RESILIENCE_STORE_EVIDENCE_INVALID:audit_ledger/);
  assert.match(result.errors.join(','), /V6_RESILIENCE_STORE_EVIDENCE_INVALID:proposals/);
  assert.match(result.errors.join(','), /V6_RESILIENCE_STORE_EVIDENCE_INVALID:public_works/);
});
