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
  CURRENT_MIGRATION_VERSION,
  assertV6MigrationRehearsalSafe,
  buildV6MigrationRehearsalReport
} = require('../server/world_civilization/migration_rehearsal');
const { V6_CIVIC_RESILIENCE_STORES } = require('../server/world_civilization/resilience');

function withTempCivicStores(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-migration-rehearsal-'));
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

test('V6 migration rehearsal inventories every current v1 civic store without claiming release scripts', () => withTempCivicStores(({ stores }) => {
  const report = buildV6MigrationRehearsalReport({
    stores,
    storeRequirements: V6_CIVIC_RESILIENCE_STORES,
    targetMigrationVersion: CURRENT_MIGRATION_VERSION
  });

  assert.equal(report.ok, true);
  assert.equal(report.status, 'research_only');
  assert.equal(report.currentMigrationVersion, 'v1');
  assert.equal(report.targetMigrationVersion, 'v1');
  assert.equal(report.direction, 'same_version_inventory');
  assert.equal(report.migrationScriptsAvailable, false);
  assert.equal(report.releaseReady, false);
  assert.equal(report.appliesWorldState, false);
  assert.equal(report.executionStatus, 'not_executable');
  assert.deepEqual(report.releaseGaps, [
    'release_grade_upgrade_scripts_required',
    'release_grade_downgrade_scripts_required',
    'backup_restore_rehearsal_required'
  ]);
  assert.deepEqual(report.storeReports.map((entry) => entry.key), V6_CIVIC_RESILIENCE_STORES.map((entry) => entry.key));
  for (const storeReport of report.storeReports) {
    assert.equal(storeReport.ok, true, storeReport.key);
    assert.equal(storeReport.migrationVersion, 'v1', storeReport.key);
    assert.equal(storeReport.expectedMigrationVersion, 'v1', storeReport.key);
    assert.equal(storeReport.metadataOk, true, storeReport.key);
    assert.equal(storeReport.schemaMetadata.releaseStatus, 'research_only', storeReport.key);
    assert.equal(storeReport.upgradeScript, '', storeReport.key);
    assert.equal(storeReport.downgradeScript, '', storeReport.key);
  }
  assert.deepEqual(assertV6MigrationRehearsalSafe(report), { ok: true, errors: [] });
}));

test('V6 migration rehearsal fails closed for unsupported upgrade and downgrade targets', () => withTempCivicStores(({ stores }) => {
  const upgrade = buildV6MigrationRehearsalReport({
    stores,
    storeRequirements: V6_CIVIC_RESILIENCE_STORES,
    targetMigrationVersion: 'v2'
  });
  const downgrade = buildV6MigrationRehearsalReport({
    stores,
    storeRequirements: V6_CIVIC_RESILIENCE_STORES,
    targetMigrationVersion: 'v0'
  });

  assert.equal(upgrade.ok, false);
  assert.equal(upgrade.direction, 'unsupported_upgrade');
  assert.match(upgrade.errors.join(','), /V6_MIGRATION_REHEARSAL_UNSUPPORTED_TARGET:v2/);
  assert.match(assertV6MigrationRehearsalSafe(upgrade).errors.join(','), /V6_MIGRATION_REHEARSAL_ERRORS_PRESENT/);

  assert.equal(downgrade.ok, false);
  assert.equal(downgrade.direction, 'unsupported_downgrade');
  assert.match(downgrade.errors.join(','), /V6_MIGRATION_REHEARSAL_UNSUPPORTED_TARGET:v0/);
  assert.match(assertV6MigrationRehearsalSafe(downgrade).errors.join(','), /V6_MIGRATION_REHEARSAL_ERRORS_PRESENT/);
}));

test('V6 migration rehearsal fails closed when store requirements are missing', () => {
  const report = buildV6MigrationRehearsalReport({ stores: {}, storeRequirements: [] });
  assert.equal(report.ok, false);
  assert.match(report.errors.join(','), /V6_MIGRATION_REHEARSAL_STORE_REQUIREMENTS_REQUIRED/);
  assert.match(assertV6MigrationRehearsalSafe(report).errors.join(','), /V6_MIGRATION_REHEARSAL_ERRORS_PRESENT/);
});
