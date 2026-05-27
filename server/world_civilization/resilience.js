const fs = require('fs');

const { V6_WORLD_FEATURE_FLAG, isWorldGridFeatureEnabled } = require('../world_grid/feature_flags');
const {
  REQUIRED_BACKUP_RESTORE_RELEASE_GAPS,
  V6_BACKUP_RESTORE_REHEARSAL_VERSION
} = require('./backup_restore');
const {
  REQUIRED_WRITE_CONTENTION_RELEASE_GAPS,
  V6_WRITE_CONTENTION_REHEARSAL_VERSION
} = require('./write_contention');

const V6_RESILIENCE_BASELINE_VERSION = 'agent-town.v6.resilience.v1';
const V6_RESILIENCE_READINESS_GATE_VERSION = 'agent-town.v6.resilience.readiness.v1';

const REQUIRED_RELEASE_GAPS = [
  'M16_RELEASE_GRADE_PROCESS_RESTART_COVERAGE_REQUIRED',
  'M16_REPLAY_RECONSTRUCTION_RELEASE_COVERAGE_REQUIRED',
  'M16_MIGRATION_UPGRADE_DOWNGRADE_TESTS_REQUIRED',
  'M16_LOAD_AND_RATE_TESTS_REQUIRED',
  'M16_ROLLBACK_RECOVERY_EXECUTION_REQUIRED',
  'M16_BACKUP_RESTORE_RELEASE_DRILL_REQUIRED',
  'M16_WRITE_CONTENTION_RELEASE_DRILL_REQUIRED'
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
    'release_slo_thresholds'
  ]
};

const V6_CIVIC_WRITE_CONTENTION_COVERAGE = {
  modulePath: 'server/world_civilization/write_contention.js',
  artifact: 'tests/world_civilization_write_contention.test.js',
  version: V6_WRITE_CONTENTION_REHEARSAL_VERSION,
  status: 'research_only',
  releaseReady: false,
  coveredChecks: [
    'multi_process_audit_ledger_writes',
    'begin_immediate_writer_serialization',
    'hash_chain_integrity_under_contention',
    'idempotent_duplicate_retry_under_contention',
    'private_row_payload_exclusion',
    'no_world_state_application'
  ],
  remainingReleaseGaps: [...REQUIRED_WRITE_CONTENTION_RELEASE_GAPS]
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
    'release_grade_backup_restore_drill',
    'migration_load_replay_rehearsal'
  ]
};

const V6_CIVIC_BACKUP_RESTORE_COVERAGE = {
  modulePath: 'server/world_civilization/backup_restore.js',
  artifact: 'tests/world_civilization_backup_restore.test.js',
  version: V6_BACKUP_RESTORE_REHEARSAL_VERSION,
  status: 'research_only',
  releaseReady: false,
  coveredChecks: [
    'closed_store_sqlite_backup_copy',
    'source_restored_hash_match',
    'restored_schema_metadata_match',
    'private_row_payload_exclusion',
    'no_world_state_application'
  ],
  remainingReleaseGaps: [...REQUIRED_BACKUP_RESTORE_RELEASE_GAPS]
};

const V6_CIVIC_AUDIT_SUMMARY_COVERAGE = {
  modulePath: 'server/world_civilization/replay_reconstruction.js',
  status: 'research_only',
  releaseReady: false,
  beforeAfterSummaryRequired: true,
  zeroHashOnlyFallbacksRequired: true,
  coveredReplayGroups: [
    {
      key: 'proposal_vote',
      stores: ['proposals', 'votes'],
      artifact: 'tests/world_civilization_proposal_vote_process_restart.test.js',
      fallbackCoverage: 'zero_hash_only_fallbacks_proven'
    },
    {
      key: 'reputation_moderation',
      stores: ['reputation', 'moderation'],
      artifact: 'tests/world_civilization_reputation_moderation_process_restart.test.js',
      fallbackCoverage: 'zero_hash_only_fallbacks_proven'
    },
    {
      key: 'effect_rollback',
      stores: ['effects'],
      artifact: 'tests/world_civilization_effect_process_restart.test.js',
      fallbackCoverage: 'zero_hash_only_fallbacks_proven'
    },
    {
      key: 'delegation_lifecycle',
      stores: ['delegations'],
      artifact: 'tests/world_civilization_delegation_process_restart.test.js',
      fallbackCoverage: 'zero_hash_only_fallbacks_proven'
    },
    {
      key: 'institution_charters',
      stores: ['institutions'],
      artifact: 'tests/world_civilization_institution_process_restart.test.js',
      fallbackCoverage: 'zero_hash_only_fallbacks_proven'
    },
    {
      key: 'public_works_resources',
      stores: ['public_works'],
      artifact: 'tests/world_civilization_public_works_process_restart.test.js',
      fallbackCoverage: 'zero_hash_only_fallbacks_proven'
    }
  ],
  excludedResearchFallbacks: [
    {
      key: 'manual_audit_ledger_rows',
      artifact: 'tests/world_civilization_audit_ledger.test.js',
      reason: 'Hash-only fallback remains documented only for manual ledger rows without store-provided summaries.'
    }
  ],
  remainingReleaseGaps: [
    'release_grade_replay_reconstruction',
    'larger_dataset_store_summary_replay',
    'backup_restore_summary_replay',
    'applied_effect_summary_reconstruction'
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
const REQUIRED_RESILIENCE_STORE_KEYS = V6_CIVIC_RESILIENCE_STORES.map((store) => store.key);
const REQUIRED_RESILIENCE_READINESS_CHECKS = [
  'feature_flag',
  'research_opt_in',
  'resilience_evidence',
  'store_restart_coverage',
  'replay_reconstruction',
  'migration_upgrade_downgrade',
  'load_rate',
  'rollback_recovery',
  'backup_restore',
  'privacy_safe_replay',
  'store_specific_zero_hash_only_fallbacks',
  'no_runtime_exposure',
  'no_player_exposure',
  'private_data_exclusion',
  'no_world_mutation'
];
const REQUIRED_RESILIENCE_EVIDENCE_CHECKS = [
  'all_civic_store_restart_probes',
  'audit_replay_reconstruction',
  'privacy_safe_replay_summaries',
  'store_specific_zero_hash_only_fallbacks',
  'hash_chain_integrity',
  'migration_upgrade_scripts',
  'migration_downgrade_scripts',
  'unsupported_upgrade_downgrade_fail_closed',
  'backup_restore_rehearsal',
  'migration_load_replay_rehearsal',
  'production_load_rate_targets',
  'multi_process_write_contention',
  'idempotency_duplicate_retry_bursts',
  'rollback_handle_reconstruction',
  'typed_rollback_execution_recovery',
  'private_data_exclusion',
  'no_effect_application_during_replay'
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeList(value) {
  return Array.isArray(value) ? value.map((entry) => String(entry || '')).filter(Boolean) : [];
}

function sameStringList(actual, expected) {
  if (!Array.isArray(actual) || !Array.isArray(expected) || actual.length !== expected.length) return false;
  return actual.every((entry, index) => entry === expected[index]);
}

function auditSummaryCoverageMatchesExpected(coverage = {}) {
  if (!Array.isArray(coverage.coveredReplayGroups)) return false;
  if (coverage.coveredReplayGroups.length !== V6_CIVIC_AUDIT_SUMMARY_COVERAGE.coveredReplayGroups.length) return false;
  return coverage.coveredReplayGroups.every((group, index) => {
    const expected = V6_CIVIC_AUDIT_SUMMARY_COVERAGE.coveredReplayGroups[index];
    return group.key === expected.key
      && sameStringList(group.stores, expected.stores)
      && group.artifact === expected.artifact
      && group.fallbackCoverage === expected.fallbackCoverage;
  });
}

function check(key, ok, error = '') {
  return { key, ok: ok === true, error: ok === true ? '' : error };
}

function inspectResilienceReadinessEvidence(evidence = {}) {
  const checks = normalizeList(evidence.checks);
  const storeKeys = normalizeList(evidence.storeKeys);
  const missingChecks = REQUIRED_RESILIENCE_EVIDENCE_CHECKS.filter((entry) => !checks.includes(entry));
  const missingStoreKeys = REQUIRED_RESILIENCE_STORE_KEYS.filter((entry) => !storeKeys.includes(entry));
  const processRestartCoverageComplete = evidence.processRestartCoverageComplete === true;
  const replayReconstructionReleaseReady = evidence.replayReconstructionReleaseReady === true;
  const migrationUpgradeDowngradeReviewed = evidence.migrationUpgradeDowngradeReviewed === true;
  const loadRateReviewed = evidence.loadRateReviewed === true;
  const rollbackRecoveryReviewed = evidence.rollbackRecoveryReviewed === true;
  const backupRestoreReviewed = evidence.backupRestoreReviewed === true;
  const privacySafeReplayReviewed = evidence.privacySafeReplayReviewed === true;
  const storeSpecificAuditSummaryCoverageComplete = evidence.storeSpecificAuditSummaryCoverageComplete === true;
  const ok = evidence.status === 'complete'
    && evidence.executionStatus === 'not_executable'
    && evidence.runtimeExposed === false
    && evidence.playerVisible === false
    && evidence.normalGameplayExposure === false
    && evidence.mutatesWorldState === false
    && evidence.appliesRollback === false
    && evidence.appliesMigration === false
    && evidence.exposesPrivateData === false
    && processRestartCoverageComplete
    && replayReconstructionReleaseReady
    && migrationUpgradeDowngradeReviewed
    && loadRateReviewed
    && rollbackRecoveryReviewed
    && backupRestoreReviewed
    && privacySafeReplayReviewed
    && storeSpecificAuditSummaryCoverageComplete
    && missingChecks.length === 0
    && missingStoreKeys.length === 0;
  return {
    ok,
    status: String(evidence.status || 'missing'),
    executionStatus: String(evidence.executionStatus || 'missing'),
    runtimeExposed: evidence.runtimeExposed === true,
    playerVisible: evidence.playerVisible === true,
    normalGameplayExposure: evidence.normalGameplayExposure === true,
    mutatesWorldState: evidence.mutatesWorldState === true,
    appliesRollback: evidence.appliesRollback === true,
    appliesMigration: evidence.appliesMigration === true,
    exposesPrivateData: evidence.exposesPrivateData === true,
    processRestartCoverageComplete,
    replayReconstructionReleaseReady,
    migrationUpgradeDowngradeReviewed,
    loadRateReviewed,
    rollbackRecoveryReviewed,
    backupRestoreReviewed,
    privacySafeReplayReviewed,
    storeSpecificAuditSummaryCoverageComplete,
    requiredChecks: [...REQUIRED_RESILIENCE_EVIDENCE_CHECKS],
    checks,
    missingChecks,
    requiredStoreKeys: [...REQUIRED_RESILIENCE_STORE_KEYS],
    storeKeys,
    missingStoreKeys
  };
}

function disabledReadinessGateReport({ source, reason }) {
  return {
    version: V6_RESILIENCE_READINESS_GATE_VERSION,
    status: 'research_only',
    source,
    featureFlag: V6_WORLD_FEATURE_FLAG,
    available: false,
    researchReady: false,
    releaseReady: false,
    failClosed: true,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    mutatesWorldState: false,
    appliesRollback: false,
    appliesMigration: false,
    exposesPrivateData: false,
    executionStatus: 'not_executable',
    evidence: inspectResilienceReadinessEvidence({}),
    checks: [],
    errors: [reason],
    disabledReason: reason
  };
}

function buildV6ResilienceReadinessGate({
  featureFlags = {},
  includeResearchResilienceReadiness = false,
  source = 'runtime',
  evidence = {}
} = {}) {
  const enabled = includeResearchResilienceReadiness === true
    && isWorldGridFeatureEnabled(featureFlags, V6_WORLD_FEATURE_FLAG);
  if (!enabled) {
    return disabledReadinessGateReport({
      source,
      reason: 'V6 resilience readiness requires explicit research opt-in and V6 feature flag'
    });
  }

  const evidenceReport = inspectResilienceReadinessEvidence(evidence);
  const checks = [
    check('feature_flag', isWorldGridFeatureEnabled(featureFlags, V6_WORLD_FEATURE_FLAG), 'FEATURE_DISABLED'),
    check('research_opt_in', includeResearchResilienceReadiness === true, 'RESEARCH_OPT_IN_REQUIRED'),
    check(
      'resilience_evidence',
      evidenceReport.status === 'complete'
        && evidenceReport.missingChecks.length === 0
        && evidenceReport.missingStoreKeys.length === 0,
      'RESILIENCE_EVIDENCE_REQUIRED'
    ),
    check('store_restart_coverage', evidenceReport.processRestartCoverageComplete, 'RESILIENCE_PROCESS_RESTART_COVERAGE_REQUIRED'),
    check('replay_reconstruction', evidenceReport.replayReconstructionReleaseReady, 'RESILIENCE_REPLAY_RECONSTRUCTION_REQUIRED'),
    check('migration_upgrade_downgrade', evidenceReport.migrationUpgradeDowngradeReviewed, 'RESILIENCE_MIGRATION_UPGRADE_DOWNGRADE_REQUIRED'),
    check('load_rate', evidenceReport.loadRateReviewed, 'RESILIENCE_LOAD_RATE_REQUIRED'),
    check('rollback_recovery', evidenceReport.rollbackRecoveryReviewed, 'RESILIENCE_ROLLBACK_RECOVERY_REQUIRED'),
    check('backup_restore', evidenceReport.backupRestoreReviewed, 'RESILIENCE_BACKUP_RESTORE_REQUIRED'),
    check('privacy_safe_replay', evidenceReport.privacySafeReplayReviewed, 'RESILIENCE_PRIVACY_SAFE_REPLAY_REQUIRED'),
    check(
      'store_specific_zero_hash_only_fallbacks',
      evidenceReport.storeSpecificAuditSummaryCoverageComplete,
      'RESILIENCE_STORE_SPECIFIC_AUDIT_SUMMARY_COVERAGE_REQUIRED'
    ),
    check(
      'no_runtime_exposure',
      evidenceReport.executionStatus === 'not_executable' && evidenceReport.runtimeExposed === false,
      'RESILIENCE_RUNTIME_EXPOSURE_FORBIDDEN'
    ),
    check(
      'no_player_exposure',
      evidenceReport.playerVisible === false && evidenceReport.normalGameplayExposure === false,
      'RESILIENCE_PLAYER_EXPOSURE_FORBIDDEN'
    ),
    check(
      'private_data_exclusion',
      evidenceReport.exposesPrivateData === false,
      'RESILIENCE_PRIVATE_DATA_FORBIDDEN'
    ),
    check(
      'no_world_mutation',
      evidenceReport.mutatesWorldState === false
        && evidenceReport.appliesRollback === false
        && evidenceReport.appliesMigration === false,
      'RESILIENCE_WORLD_MUTATION_FORBIDDEN'
    )
  ];
  const researchReady = checks.every((entry) => entry.ok);

  return {
    version: V6_RESILIENCE_READINESS_GATE_VERSION,
    status: 'research_only',
    source,
    featureFlag: V6_WORLD_FEATURE_FLAG,
    available: true,
    researchReady,
    releaseReady: false,
    failClosed: researchReady !== true,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    mutatesWorldState: false,
    appliesRollback: false,
    appliesMigration: false,
    exposesPrivateData: false,
    executionStatus: 'not_executable',
    evidence: evidenceReport,
    checks,
    errors: checks.filter((entry) => !entry.ok).map((entry) => entry.error)
  };
}

function assertV6ResilienceReadinessGateSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_RESILIENCE_READINESS_GATE_VERSION) {
    errors.push('V6_RESILIENCE_READINESS_VERSION_REQUIRED');
  }
  if (report.featureFlag !== V6_WORLD_FEATURE_FLAG) {
    errors.push('V6_RESILIENCE_READINESS_FEATURE_FLAG_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_RESILIENCE_READINESS_RESEARCH_ONLY_REQUIRED');
  }
  if (report.runtimeExposed !== false) {
    errors.push('V6_RESILIENCE_READINESS_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.playerVisible !== false) {
    errors.push('V6_RESILIENCE_READINESS_PLAYER_HIDDEN_REQUIRED');
  }
  if (report.normalGameplayExposure !== false) {
    errors.push('V6_RESILIENCE_READINESS_NORMAL_GAMEPLAY_FORBIDDEN');
  }
  if (report.mutatesWorldState !== false) {
    errors.push('V6_RESILIENCE_READINESS_WORLD_MUTATION_FORBIDDEN');
  }
  if (report.appliesRollback !== false) {
    errors.push('V6_RESILIENCE_READINESS_ROLLBACK_APPLICATION_FORBIDDEN');
  }
  if (report.appliesMigration !== false) {
    errors.push('V6_RESILIENCE_READINESS_MIGRATION_APPLICATION_FORBIDDEN');
  }
  if (report.exposesPrivateData !== false) {
    errors.push('V6_RESILIENCE_READINESS_PRIVATE_DATA_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_RESILIENCE_READINESS_NON_EXECUTING_REQUIRED');
  }
  if (report.releaseReady !== false) {
    errors.push('V6_RESILIENCE_READINESS_RELEASE_READY_FORBIDDEN');
  }
  if (report.available === true) {
    const checkKeys = new Set((report.checks || []).map((entry) => entry.key));
    for (const key of REQUIRED_RESILIENCE_READINESS_CHECKS) {
      if (!checkKeys.has(key)) errors.push(`V6_RESILIENCE_READINESS_CHECK_REQUIRED:${key}`);
    }
    const failedChecks = (report.checks || []).filter((entry) => entry.ok !== true);
    if (report.researchReady === true && failedChecks.length > 0) {
      errors.push('V6_RESILIENCE_READINESS_READY_WITH_FAILED_CHECKS');
    }
    if (report.researchReady !== true && report.failClosed !== true) {
      errors.push('V6_RESILIENCE_READINESS_DENIAL_FAIL_CLOSED_REQUIRED');
    }
    const evidence = report.evidence || {};
    if (evidence.runtimeExposed === true) {
      errors.push('V6_RESILIENCE_READINESS_EVIDENCE_RUNTIME_HIDDEN_REQUIRED');
    }
    if (evidence.playerVisible === true || evidence.normalGameplayExposure === true) {
      errors.push('V6_RESILIENCE_READINESS_EVIDENCE_PLAYER_HIDDEN_REQUIRED');
    }
    if (evidence.mutatesWorldState === true) {
      errors.push('V6_RESILIENCE_READINESS_EVIDENCE_WORLD_MUTATION_FORBIDDEN');
    }
    if (evidence.appliesRollback === true) {
      errors.push('V6_RESILIENCE_READINESS_EVIDENCE_ROLLBACK_APPLICATION_FORBIDDEN');
    }
    if (evidence.appliesMigration === true) {
      errors.push('V6_RESILIENCE_READINESS_EVIDENCE_MIGRATION_APPLICATION_FORBIDDEN');
    }
    if (evidence.exposesPrivateData === true) {
      errors.push('V6_RESILIENCE_READINESS_EVIDENCE_PRIVATE_DATA_FORBIDDEN');
    }
    if (report.researchReady === true && evidence.ok !== true) {
      errors.push('V6_RESILIENCE_READINESS_READY_WITHOUT_EVIDENCE');
    }
  } else if (report.failClosed !== true) {
    errors.push('V6_RESILIENCE_READINESS_DISABLED_FAIL_CLOSED_REQUIRED');
  }
  return {
    ok: errors.length === 0,
    errors
  };
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
    auditSummaryCoverage: null,
    loadRateCoverage: null,
    rollbackRecoveryCoverage: null,
    migrationRehearsalCoverage: null,
    backupRestoreCoverage: null,
    writeContentionCoverage: null,
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
    auditSummaryCoverage: clone(V6_CIVIC_AUDIT_SUMMARY_COVERAGE),
    loadRateCoverage: clone(V6_CIVIC_LOAD_RATE_COVERAGE),
    rollbackRecoveryCoverage: clone(V6_CIVIC_ROLLBACK_RECOVERY_COVERAGE),
    migrationRehearsalCoverage: clone(V6_CIVIC_MIGRATION_REHEARSAL_COVERAGE),
    backupRestoreCoverage: clone(V6_CIVIC_BACKUP_RESTORE_COVERAGE),
    writeContentionCoverage: clone(V6_CIVIC_WRITE_CONTENTION_COVERAGE),
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
    const auditSummaryCoverage = report.auditSummaryCoverage || {};
    if (
      auditSummaryCoverage.modulePath !== V6_CIVIC_AUDIT_SUMMARY_COVERAGE.modulePath
      || auditSummaryCoverage.status !== 'research_only'
      || auditSummaryCoverage.releaseReady !== false
      || auditSummaryCoverage.beforeAfterSummaryRequired !== true
      || auditSummaryCoverage.zeroHashOnlyFallbacksRequired !== true
      || !auditSummaryCoverageMatchesExpected(auditSummaryCoverage)
    ) {
      errors.push('V6_RESILIENCE_AUDIT_SUMMARY_COVERAGE_REQUIRED');
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
    const backupRestoreCoverage = report.backupRestoreCoverage || {};
    if (
      backupRestoreCoverage.modulePath !== V6_CIVIC_BACKUP_RESTORE_COVERAGE.modulePath
      || backupRestoreCoverage.artifact !== V6_CIVIC_BACKUP_RESTORE_COVERAGE.artifact
      || backupRestoreCoverage.version !== V6_BACKUP_RESTORE_REHEARSAL_VERSION
      || backupRestoreCoverage.status !== 'research_only'
      || backupRestoreCoverage.releaseReady !== false
      || !Array.isArray(backupRestoreCoverage.coveredChecks)
      || !backupRestoreCoverage.coveredChecks.includes('source_restored_hash_match')
      || !backupRestoreCoverage.coveredChecks.includes('private_row_payload_exclusion')
    ) {
      errors.push('V6_RESILIENCE_BACKUP_RESTORE_COVERAGE_REQUIRED');
    }
    const writeContentionCoverage = report.writeContentionCoverage || {};
    if (
      writeContentionCoverage.modulePath !== V6_CIVIC_WRITE_CONTENTION_COVERAGE.modulePath
      || writeContentionCoverage.artifact !== V6_CIVIC_WRITE_CONTENTION_COVERAGE.artifact
      || writeContentionCoverage.version !== V6_WRITE_CONTENTION_REHEARSAL_VERSION
      || writeContentionCoverage.status !== 'research_only'
      || writeContentionCoverage.releaseReady !== false
      || !Array.isArray(writeContentionCoverage.coveredChecks)
      || !writeContentionCoverage.coveredChecks.includes('multi_process_audit_ledger_writes')
      || !writeContentionCoverage.coveredChecks.includes('private_row_payload_exclusion')
    ) {
      errors.push('V6_RESILIENCE_WRITE_CONTENTION_COVERAGE_REQUIRED');
    }
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  REQUIRED_RELEASE_GAPS,
  REQUIRED_RESILIENCE_EVIDENCE_CHECKS: clone(REQUIRED_RESILIENCE_EVIDENCE_CHECKS),
  REQUIRED_RESILIENCE_READINESS_CHECKS: clone(REQUIRED_RESILIENCE_READINESS_CHECKS),
  REQUIRED_RESILIENCE_STORE_KEYS: clone(REQUIRED_RESILIENCE_STORE_KEYS),
  V6_CIVIC_AUDIT_SUMMARY_COVERAGE: clone(V6_CIVIC_AUDIT_SUMMARY_COVERAGE),
  V6_CIVIC_BACKUP_RESTORE_COVERAGE: clone(V6_CIVIC_BACKUP_RESTORE_COVERAGE),
  V6_CIVIC_LOAD_RATE_COVERAGE: clone(V6_CIVIC_LOAD_RATE_COVERAGE),
  V6_CIVIC_MIGRATION_REHEARSAL_COVERAGE: clone(V6_CIVIC_MIGRATION_REHEARSAL_COVERAGE),
  V6_CIVIC_ROLLBACK_RECOVERY_COVERAGE: clone(V6_CIVIC_ROLLBACK_RECOVERY_COVERAGE),
  V6_CIVIC_RESILIENCE_STORES: clone(V6_CIVIC_RESILIENCE_STORES),
  V6_CIVIC_WRITE_CONTENTION_COVERAGE: clone(V6_CIVIC_WRITE_CONTENTION_COVERAGE),
  V6_RESILIENCE_BASELINE_VERSION,
  V6_RESILIENCE_READINESS_GATE_VERSION,
  assertV6ResilienceBaseline,
  assertV6ResilienceReadinessGateSafe,
  buildV6ResilienceReadinessGate,
  buildV6ResilienceBaselineReport
};
