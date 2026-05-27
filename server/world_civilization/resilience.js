const fs = require('fs');

const { V6_WORLD_FEATURE_FLAG, isWorldGridFeatureEnabled } = require('../world_grid/feature_flags');

const V6_RESILIENCE_BASELINE_VERSION = 'agent-town.v6.resilience.v1';

const REQUIRED_RELEASE_GAPS = [
  'M16_RELEASE_GRADE_PROCESS_RESTART_COVERAGE_REQUIRED',
  'M16_REPLAY_RECONSTRUCTION_RELEASE_COVERAGE_REQUIRED',
  'M16_MIGRATION_UPGRADE_DOWNGRADE_TESTS_REQUIRED',
  'M16_LOAD_AND_RATE_TESTS_REQUIRED',
  'M16_ROLLBACK_RECOVERY_EXECUTION_REQUIRED'
];

const V6_CIVIC_LOAD_RATE_COVERAGE = {
  artifact: 'tests/world_civilization_load_rate.test.js',
  status: 'research_only',
  releaseReady: false,
  coveredChecks: [
    'audit_ledger_replay_pagination',
    'idempotent_duplicate_retry_suppression',
    'idempotency_conflict_rejection',
    'privacy_safe_replay_reconstruction'
  ],
  remainingReleaseGaps: [
    'production_route_rate_limits',
    'store_specific_load_targets',
    'multi_process_write_contention',
    'release_slo_thresholds'
  ]
};

const V6_CIVIC_ROLLBACK_RECOVERY_COVERAGE = {
  modulePath: 'server/world_civilization/rollback_recovery.js',
  artifact: 'tests/world_civilization_rollback_recovery.test.js',
  status: 'research_only',
  releaseReady: false,
  coveredChecks: [
    'prepared_rollback_handle_reconstruction',
    'audit_linked_recovery_handles',
    'restart_safe_recovery_report',
    'non_executing_recovery_boundary'
  ],
  remainingReleaseGaps: [
    'typed_rollback_handlers',
    'applied_failed_and_rolled_back_states',
    'real_state_recovery_execution',
    'irreversible_action_review'
  ]
};

const V6_CIVIC_MIGRATION_REHEARSAL_COVERAGE = {
  modulePath: 'server/world_civilization/migration_rehearsal.js',
  artifact: 'tests/world_civilization_migration_rehearsal.test.js',
  status: 'research_only',
  releaseReady: false,
  coveredChecks: [
    'current_v1_store_inventory',
    'schema_metadata_inventory',
    'unsupported_upgrade_fails_closed',
    'unsupported_downgrade_fails_closed'
  ],
  remainingReleaseGaps: [
    'release_grade_upgrade_scripts',
    'release_grade_downgrade_scripts',
    'backup_restore_rehearsal',
    'migration_load_replay_rehearsal'
  ]
};

const V6_CIVIC_RESILIENCE_STORES = [
  {
    key: 'audit_ledger',
    label: 'Civic audit ledger',
    modulePath: 'server/world_civilization/audit_ledger.js',
    migrationVersion: 'v1',
    restartCoverage: 'tests/world_civilization_process_restart.test.js',
    requiredMethods: ['append', 'replay', 'getByEntryId', 'getByIdempotency', 'getSchemaMetadata', 'count', 'close']
  },
  {
    key: 'proposals',
    label: 'Proposal lifecycle store',
    modulePath: 'server/world_civilization/proposals.js',
    migrationVersion: 'v1',
    restartCoverage: 'tests/world_civilization_proposal_vote_process_restart.test.js',
    requiredMethods: ['draftProposal', 'getProposal', 'getSchemaMetadata', 'listProposals', 'previewProposalEffect', 'count', 'close'],
    forbiddenMethods: ['applyProposal', 'executeProposal']
  },
  {
    key: 'votes',
    label: 'Vote authorization store',
    modulePath: 'server/world_civilization/votes.js',
    migrationVersion: 'v1',
    restartCoverage: 'tests/world_civilization_proposal_vote_process_restart.test.js',
    requiredMethods: ['recordVote', 'getVote', 'getSchemaMetadata', 'listVotes', 'summarizeProposalVotes', 'count', 'close']
  },
  {
    key: 'reputation',
    label: 'Reputation accountability store',
    modulePath: 'server/world_civilization/reputation.js',
    migrationVersion: 'v1',
    restartCoverage: 'tests/world_civilization_reputation_moderation_process_restart.test.js',
    requiredMethods: ['recordReputation', 'getRecord', 'getSchemaMetadata', 'listRecords', 'summarizeSubjectReputation', 'count', 'close']
  },
  {
    key: 'moderation',
    label: 'Moderation privacy store',
    modulePath: 'server/world_civilization/moderation.js',
    migrationVersion: 'v1',
    restartCoverage: 'tests/world_civilization_reputation_moderation_process_restart.test.js',
    requiredMethods: ['recordDecision', 'getDecision', 'getSchemaMetadata', 'listDecisions', 'summarizeSubjectModeration', 'count', 'close']
  },
  {
    key: 'effects',
    label: 'Civic effect rollback store',
    modulePath: 'server/world_civilization/effects.js',
    migrationVersion: 'v1',
    restartCoverage: 'tests/world_civilization_effect_process_restart.test.js',
    requiredMethods: ['prepareEffect', 'getAction', 'getRollback', 'getSchemaMetadata', 'listActions', 'listRollbacks', 'summarizeProposalEffects', 'count', 'close'],
    forbiddenMethods: ['applyEffect', 'executeEffect']
  },
  {
    key: 'delegations',
    label: 'Agent participation delegation store',
    modulePath: 'server/world_civilization/delegations.js',
    migrationVersion: 'v1',
    restartCoverage: 'tests/world_civilization_delegation_process_restart.test.js',
    requiredMethods: ['recordDelegation', 'consumeDelegatedAction', 'revokeDelegation', 'getAgentParticipationPolicy', 'getSchemaMetadata', 'listDelegatedActionUses', 'listDelegations', 'summarizePrincipalDelegations', 'count', 'close']
  },
  {
    key: 'institutions',
    label: 'Civic institution charter store',
    modulePath: 'server/world_civilization/institutions.js',
    migrationVersion: 'v1',
    restartCoverage: 'tests/world_civilization_institution_process_restart.test.js',
    requiredMethods: ['charterInstitution', 'recordCharterAmendment', 'getCharterAmendment', 'getInstitution', 'getSchemaMetadata', 'listCharterAmendments', 'listInstitutions', 'summarizeInstitutionGovernance', 'summarizeScopeInstitutions', 'count', 'close']
  },
  {
    key: 'public_works',
    label: 'Public works shared-resource store',
    modulePath: 'server/world_civilization/public_works.js',
    migrationVersion: 'v1',
    restartCoverage: 'tests/world_civilization_public_works_process_restart.test.js',
    requiredMethods: ['recordProject', 'recordContribution', 'getProject', 'getContribution', 'getSchemaMetadata', 'listProjects', 'listContributions', 'summarizeProject', 'projectCount', 'count', 'close'],
    forbiddenMethods: ['spendPrivateInventory', 'grantReward']
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function disabledReport(source) {
  return {
    version: V6_RESILIENCE_BASELINE_VERSION,
    status: 'research_only',
    source,
    featureFlag: V6_WORLD_FEATURE_FLAG,
    available: false,
    runtimeExposed: false,
    playerVisible: false,
    releaseReady: false,
    executionStatus: 'not_executable',
    storeReports: [],
    loadRateCoverage: null,
    rollbackRecoveryCoverage: null,
    migrationRehearsalCoverage: null,
    releaseGaps: [...REQUIRED_RELEASE_GAPS],
    disabledReason: 'V6 resilience evidence requires explicit research opt-in and V6 feature flag'
  };
}

function inspectStore(requirement, store) {
  const requiredMethods = requirement.requiredMethods || [];
  const forbiddenMethods = requirement.forbiddenMethods || [];
  const missingMethods = requiredMethods.filter((method) => typeof store?.[method] !== 'function');
  const forbiddenPresent = forbiddenMethods.filter((method) => typeof store?.[method] === 'function');
  const sqlitePath = typeof store?.sqlitePath === 'string' ? store.sqlitePath : '';
  const sqliteFileExists = sqlitePath ? fs.existsSync(sqlitePath) : false;
  const migrationVersion = typeof store?.migrationVersion === 'string' ? store.migrationVersion : '';
  const schemaMetadata = typeof store?.getSchemaMetadata === 'function' ? store.getSchemaMetadata() : null;
  const schemaMetadataOk = Boolean(schemaMetadata)
    && schemaMetadata.storeKey === requirement.key
    && schemaMetadata.migrationVersion === requirement.migrationVersion
    && schemaMetadata.schemaUserVersion === 1
    && schemaMetadata.releaseStatus === 'research_only';

  return {
    key: requirement.key,
    label: requirement.label,
    modulePath: requirement.modulePath,
    migrationVersion,
    expectedMigrationVersion: requirement.migrationVersion,
    schemaMetadata,
    schemaMetadataOk,
    restartCoverage: requirement.restartCoverage,
    sqliteBacked: Boolean(sqlitePath),
    sqliteFileExists,
    requiredMethods: [...requiredMethods],
    missingMethods,
    forbiddenMethods: [...forbiddenMethods],
    forbiddenPresent,
    ok: Boolean(sqlitePath)
      && sqliteFileExists
      && migrationVersion === requirement.migrationVersion
      && schemaMetadataOk
      && missingMethods.length === 0
      && forbiddenPresent.length === 0
  };
}

function buildV6ResilienceBaselineReport({
  featureFlags = {},
  includeResearchEvidence = false,
  source = 'runtime',
  stores = {}
} = {}) {
  const enabled = includeResearchEvidence === true
    && isWorldGridFeatureEnabled(featureFlags, V6_WORLD_FEATURE_FLAG);
  if (!enabled) return disabledReport(source);

  return {
    version: V6_RESILIENCE_BASELINE_VERSION,
    status: 'research_only',
    source,
    featureFlag: V6_WORLD_FEATURE_FLAG,
    available: true,
    runtimeExposed: false,
    playerVisible: false,
    releaseReady: false,
    executionStatus: 'not_executable',
    storeReports: V6_CIVIC_RESILIENCE_STORES.map((requirement) => inspectStore(requirement, stores[requirement.key])),
    loadRateCoverage: clone(V6_CIVIC_LOAD_RATE_COVERAGE),
    rollbackRecoveryCoverage: clone(V6_CIVIC_ROLLBACK_RECOVERY_COVERAGE),
    migrationRehearsalCoverage: clone(V6_CIVIC_MIGRATION_REHEARSAL_COVERAGE),
    releaseGaps: [...REQUIRED_RELEASE_GAPS]
  };
}

function assertV6ResilienceBaseline(report = {}) {
  const errors = [];
  if (report.version !== V6_RESILIENCE_BASELINE_VERSION) {
    errors.push('V6_RESILIENCE_VERSION_REQUIRED');
  }
  if (report.featureFlag !== V6_WORLD_FEATURE_FLAG) {
    errors.push('V6_RESILIENCE_FEATURE_FLAG_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_RESILIENCE_RESEARCH_ONLY_REQUIRED');
  }
  if (report.runtimeExposed !== false) {
    errors.push('V6_RESILIENCE_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.playerVisible !== false) {
    errors.push('V6_RESILIENCE_PLAYER_HIDDEN_REQUIRED');
  }
  if (report.releaseReady !== false) {
    errors.push('V6_RESILIENCE_RELEASE_READY_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_RESILIENCE_NON_EXECUTING_REQUIRED');
  }
  if (!Array.isArray(report.releaseGaps) || REQUIRED_RELEASE_GAPS.some((gap) => !report.releaseGaps.includes(gap))) {
    errors.push('V6_RESILIENCE_RELEASE_GAPS_REQUIRED');
  }
  if (report.available === true) {
    const reports = Array.isArray(report.storeReports) ? report.storeReports : [];
    const reportKeys = new Set(reports.map((entry) => entry.key));
    for (const requirement of V6_CIVIC_RESILIENCE_STORES) {
      if (!reportKeys.has(requirement.key)) errors.push(`V6_RESILIENCE_STORE_REQUIRED:${requirement.key}`);
    }
    for (const storeReport of reports) {
      if (storeReport.ok !== true) errors.push(`V6_RESILIENCE_STORE_EVIDENCE_INVALID:${storeReport.key}`);
    }
    const loadRateCoverage = report.loadRateCoverage || {};
    if (
      loadRateCoverage.artifact !== V6_CIVIC_LOAD_RATE_COVERAGE.artifact
      || loadRateCoverage.status !== 'research_only'
      || loadRateCoverage.releaseReady !== false
      || !Array.isArray(loadRateCoverage.coveredChecks)
      || !loadRateCoverage.coveredChecks.includes('idempotent_duplicate_retry_suppression')
    ) {
      errors.push('V6_RESILIENCE_LOAD_RATE_COVERAGE_REQUIRED');
    }
    const rollbackRecoveryCoverage = report.rollbackRecoveryCoverage || {};
    if (
      rollbackRecoveryCoverage.modulePath !== V6_CIVIC_ROLLBACK_RECOVERY_COVERAGE.modulePath
      || rollbackRecoveryCoverage.artifact !== V6_CIVIC_ROLLBACK_RECOVERY_COVERAGE.artifact
      || rollbackRecoveryCoverage.status !== 'research_only'
      || rollbackRecoveryCoverage.releaseReady !== false
      || !Array.isArray(rollbackRecoveryCoverage.coveredChecks)
      || !rollbackRecoveryCoverage.coveredChecks.includes('prepared_rollback_handle_reconstruction')
    ) {
      errors.push('V6_RESILIENCE_ROLLBACK_RECOVERY_COVERAGE_REQUIRED');
    }
    const migrationRehearsalCoverage = report.migrationRehearsalCoverage || {};
    if (
      migrationRehearsalCoverage.modulePath !== V6_CIVIC_MIGRATION_REHEARSAL_COVERAGE.modulePath
      || migrationRehearsalCoverage.artifact !== V6_CIVIC_MIGRATION_REHEARSAL_COVERAGE.artifact
      || migrationRehearsalCoverage.status !== 'research_only'
      || migrationRehearsalCoverage.releaseReady !== false
      || !Array.isArray(migrationRehearsalCoverage.coveredChecks)
      || !migrationRehearsalCoverage.coveredChecks.includes('unsupported_upgrade_fails_closed')
      || !migrationRehearsalCoverage.coveredChecks.includes('unsupported_downgrade_fails_closed')
    ) {
      errors.push('V6_RESILIENCE_MIGRATION_REHEARSAL_COVERAGE_REQUIRED');
    }
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  REQUIRED_RELEASE_GAPS,
  V6_CIVIC_LOAD_RATE_COVERAGE: clone(V6_CIVIC_LOAD_RATE_COVERAGE),
  V6_CIVIC_MIGRATION_REHEARSAL_COVERAGE: clone(V6_CIVIC_MIGRATION_REHEARSAL_COVERAGE),
  V6_CIVIC_ROLLBACK_RECOVERY_COVERAGE: clone(V6_CIVIC_ROLLBACK_RECOVERY_COVERAGE),
  V6_CIVIC_RESILIENCE_STORES: clone(V6_CIVIC_RESILIENCE_STORES),
  V6_RESILIENCE_BASELINE_VERSION,
  assertV6ResilienceBaseline,
  buildV6ResilienceBaselineReport
};
