const crypto = require('crypto');

const V6_DATA_RETENTION_TARGETS_VERSION = 'agent-town.v6.data_retention_targets.v1';
const REQUIRED_DATA_RETENTION_TARGET_KEYS = [
  'audit_ledger_retention',
  'proposal_vote_record_retention',
  'reputation_moderation_record_retention',
  'delegation_authority_retention',
  'worker_debug_trace_retention',
  'subject_export_boundary',
  'subject_deletion_boundary',
  'private_credential_exclusion',
  'backup_restore_retention',
  'retention_audit_replay'
];
const REQUIRED_DATA_RETENTION_RELEASE_GAPS = [
  'approved_retention_schedule_required',
  'subject_export_workflow_required',
  'subject_deletion_workflow_required',
  'debug_trace_retention_policy_required',
  'backup_retention_expiry_drill_required',
  'privacy_legal_signoff_required'
];

const V6_DATA_RETENTION_TARGETS = [
  {
    key: 'audit_ledger_retention',
    surface: 'civic_audit_ledger',
    requiredEvidence: 'Append-only civic audit rows need a release-approved retention schedule and replay-safe redaction boundary.',
    currentEvidence: 'server/world_civilization/audit_ledger.js',
    releaseEvidenceRequired: 'approved_audit_ledger_retention_schedule'
  },
  {
    key: 'proposal_vote_record_retention',
    surface: 'proposal_vote_stores',
    requiredEvidence: 'Proposal and vote records need retention classes for public summaries, private fields, and idempotency receipts.',
    currentEvidence: 'tests/world_civilization_proposal_vote_process_restart.test.js',
    releaseEvidenceRequired: 'proposal_vote_retention_matrix'
  },
  {
    key: 'reputation_moderation_record_retention',
    surface: 'reputation_moderation_stores',
    requiredEvidence: 'Reputation, dispute, moderation, review, and appeal records need privacy-reviewed retention and appeal windows.',
    currentEvidence: 'tests/world_civilization_reputation_moderation_process_restart.test.js',
    releaseEvidenceRequired: 'trust_safety_retention_matrix'
  },
  {
    key: 'delegation_authority_retention',
    surface: 'delegation_store',
    requiredEvidence: 'Delegation approvals, revocations, and action-budget uses need authority-lifetime retention and replay rules.',
    currentEvidence: 'tests/world_civilization_delegation_process_restart.test.js',
    releaseEvidenceRequired: 'delegation_authority_retention_review'
  },
  {
    key: 'worker_debug_trace_retention',
    surface: 'Worker Traffic / Skill Context / Session Context',
    requiredEvidence: 'Worker debug traces need retention windows and redaction rules for session, wallet, Brain, provider, and private tool data.',
    currentEvidence: 'docs/security/V6_AGENT_CIVILIZATION_RELEASE_REVIEW.md',
    releaseEvidenceRequired: 'debug_trace_retention_runbook'
  },
  {
    key: 'subject_export_boundary',
    surface: 'account_data_export',
    requiredEvidence: 'Release needs an export boundary that excludes secrets and private third-party rows while preserving audit summaries.',
    currentEvidence: 'docs/security/V6_AGENT_CIVILIZATION_RELEASE_REVIEW.md',
    releaseEvidenceRequired: 'subject_export_workflow'
  },
  {
    key: 'subject_deletion_boundary',
    surface: 'account_data_deletion',
    requiredEvidence: 'Release needs a deletion/anonymization boundary for private data while preserving required audit integrity.',
    currentEvidence: 'docs/security/V6_AGENT_CIVILIZATION_RELEASE_REVIEW.md',
    releaseEvidenceRequired: 'subject_deletion_workflow'
  },
  {
    key: 'private_credential_exclusion',
    surface: 'all_retention_reports',
    requiredEvidence: 'Retention reports must exclude wallet secrets, provider tokens, Brain credentials, and private row payloads.',
    currentEvidence: 'docs/security/PUBLIC_TEXT_RENDERING_POLICY.md',
    releaseEvidenceRequired: 'privacy_reviewed_secret_exclusion_report'
  },
  {
    key: 'backup_restore_retention',
    surface: 'backup_restore_archives',
    requiredEvidence: 'Backups need retention, expiry, restore, and deletion rehearsal evidence before release.',
    currentEvidence: 'tests/world_civilization_backup_restore.test.js',
    releaseEvidenceRequired: 'backup_retention_expiry_drill'
  },
  {
    key: 'retention_audit_replay',
    surface: 'replay_reconstruction',
    requiredEvidence: 'Replay reconstruction must remain privacy-safe under retention expiry, anonymization, and backup restore.',
    currentEvidence: 'server/world_civilization/replay_reconstruction.js',
    releaseEvidenceRequired: 'retention_aware_replay_drill'
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sha256(value = '') {
  return `sha256:${crypto.createHash('sha256').update(String(value || ''), 'utf8').digest('hex')}`;
}

function numberValue(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : fallback;
}

function targetMatrixDigest(targets = V6_DATA_RETENTION_TARGETS) {
  return sha256(JSON.stringify(targets.map((target) => ({
    key: target.key,
    surface: target.surface,
    requiredEvidence: target.requiredEvidence,
    releaseEvidenceRequired: target.releaseEvidenceRequired
  }))));
}

function inspectDataRetentionTargets(targets = V6_DATA_RETENTION_TARGETS) {
  const safeTargets = Array.isArray(targets) ? targets : [];
  const targetKeys = safeTargets.map((target) => String(target.key || ''));
  const missingKeys = REQUIRED_DATA_RETENTION_TARGET_KEYS.filter((key) => !targetKeys.includes(key));
  const incompleteTargets = safeTargets.filter((target) => (
    !target.key
    || !target.surface
    || !target.requiredEvidence
    || !target.currentEvidence
    || !target.releaseEvidenceRequired
  )).map((target) => String(target.key || 'unknown'));

  return {
    ok: missingKeys.length === 0 && incompleteTargets.length === 0,
    requiredKeys: [...REQUIRED_DATA_RETENTION_TARGET_KEYS],
    targetKeys,
    missingKeys,
    incompleteTargets,
    targetCount: safeTargets.length,
    digest: targetMatrixDigest(safeTargets)
  };
}

function buildMissingReport(errors = []) {
  return {
    version: V6_DATA_RETENTION_TARGETS_VERSION,
    status: 'research_only',
    ok: false,
    errors,
    releaseReady: false,
    productionReady: false,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    deletesRuntimeData: false,
    executionStatus: 'not_executable',
    targetMatrix: inspectDataRetentionTargets([]),
    observedEvidence: {},
    releaseGaps: [...REQUIRED_DATA_RETENTION_RELEASE_GAPS]
  };
}

function buildV6DataRetentionTargetReport({
  targets = V6_DATA_RETENTION_TARGETS,
  observed = {},
  source = 'runtime'
} = {}) {
  const targetMatrix = inspectDataRetentionTargets(targets);
  const observedEvidence = {
    auditRetentionTargetCount: numberValue(observed.auditRetentionTargetCount),
    civicStoreCoverageCount: numberValue(observed.civicStoreCoverageCount),
    debugTraceRedactionProbeCount: numberValue(observed.debugTraceRedactionProbeCount),
    privateCredentialExclusionProbeCount: numberValue(observed.privateCredentialExclusionProbeCount),
    backupRetentionProbeCount: numberValue(observed.backupRetentionProbeCount),
    subjectExportWorkflowProbeCount: numberValue(observed.subjectExportWorkflowProbeCount),
    subjectDeletionWorkflowProbeCount: numberValue(observed.subjectDeletionWorkflowProbeCount),
    retentionAwareReplayProbeCount: numberValue(observed.retentionAwareReplayProbeCount),
    privateDataExposureCount: numberValue(observed.privateDataExposureCount),
    playerVisibleRetentionSurfaceCount: numberValue(observed.playerVisibleRetentionSurfaceCount),
    deletesRuntimeData: observed.deletesRuntimeData === true,
    appliesRetentionExpiry: observed.appliesRetentionExpiry === true,
    mutatesWorldState: observed.mutatesWorldState === true,
    exposesPrivateData: observed.exposesPrivateData === true
  };
  observedEvidence.subjectExportWorkflowPresent = observedEvidence.subjectExportWorkflowProbeCount > 0;
  observedEvidence.subjectDeletionWorkflowPresent = observedEvidence.subjectDeletionWorkflowProbeCount > 0;
  observedEvidence.backupRetentionDrillPresent = observedEvidence.backupRetentionProbeCount > 0;
  const errors = [];
  if (targetMatrix.ok !== true) errors.push('V6_DATA_RETENTION_TARGET_MATRIX_INCOMPLETE');
  if (observedEvidence.auditRetentionTargetCount <= 0) errors.push('V6_DATA_RETENTION_AUDIT_TARGET_PROBE_REQUIRED');
  if (observedEvidence.civicStoreCoverageCount <= 0) errors.push('V6_DATA_RETENTION_CIVIC_STORE_PROBE_REQUIRED');
  if (observedEvidence.debugTraceRedactionProbeCount <= 0) errors.push('V6_DATA_RETENTION_DEBUG_TRACE_PROBE_REQUIRED');
  if (observedEvidence.privateCredentialExclusionProbeCount <= 0) {
    errors.push('V6_DATA_RETENTION_PRIVATE_CREDENTIAL_EXCLUSION_PROBE_REQUIRED');
  }
  if (observedEvidence.retentionAwareReplayProbeCount <= 0) errors.push('V6_DATA_RETENTION_REPLAY_PROBE_REQUIRED');
  if (observedEvidence.privateDataExposureCount > 0 || observedEvidence.exposesPrivateData) {
    errors.push('V6_DATA_RETENTION_PRIVATE_DATA_FORBIDDEN');
  }
  if (observedEvidence.playerVisibleRetentionSurfaceCount > 0) errors.push('V6_DATA_RETENTION_PLAYER_SURFACE_FORBIDDEN');
  if (observedEvidence.deletesRuntimeData || observedEvidence.appliesRetentionExpiry) {
    errors.push('V6_DATA_RETENTION_RUNTIME_DELETION_FORBIDDEN');
  }
  if (observedEvidence.mutatesWorldState) errors.push('V6_DATA_RETENTION_WORLD_MUTATION_FORBIDDEN');
  if (errors.length > 0) {
    return {
      ...buildMissingReport(errors),
      source,
      targetMatrix,
      observedEvidence
    };
  }

  return {
    version: V6_DATA_RETENTION_TARGETS_VERSION,
    status: 'research_only',
    source,
    ok: true,
    errors: [],
    releaseReady: false,
    productionReady: false,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    deletesRuntimeData: false,
    executionStatus: 'not_executable',
    targetMatrix,
    targets: clone(targets),
    observedEvidence,
    releaseGaps: [...REQUIRED_DATA_RETENTION_RELEASE_GAPS]
  };
}

function assertV6DataRetentionTargetReportSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_DATA_RETENTION_TARGETS_VERSION) {
    errors.push('V6_DATA_RETENTION_TARGET_VERSION_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_DATA_RETENTION_TARGET_RESEARCH_ONLY_REQUIRED');
  }
  if (report.releaseReady !== false || report.productionReady !== false) {
    errors.push('V6_DATA_RETENTION_TARGET_RELEASE_READY_FORBIDDEN');
  }
  if (report.runtimeExposed !== false) {
    errors.push('V6_DATA_RETENTION_TARGET_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.playerVisible !== false || report.normalGameplayExposure !== false) {
    errors.push('V6_DATA_RETENTION_TARGET_PLAYER_HIDDEN_REQUIRED');
  }
  if (report.mutatesWorldState !== false) {
    errors.push('V6_DATA_RETENTION_TARGET_WORLD_MUTATION_FORBIDDEN');
  }
  if (report.exposesPrivateData !== false) {
    errors.push('V6_DATA_RETENTION_TARGET_PRIVATE_DATA_FORBIDDEN');
  }
  if (report.deletesRuntimeData !== false) {
    errors.push('V6_DATA_RETENTION_TARGET_RUNTIME_DELETION_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_DATA_RETENTION_TARGET_NON_EXECUTING_REQUIRED');
  }
  if (
    !Array.isArray(report.releaseGaps)
    || REQUIRED_DATA_RETENTION_RELEASE_GAPS.some((gap) => !report.releaseGaps.includes(gap))
  ) {
    errors.push('V6_DATA_RETENTION_TARGET_RELEASE_GAPS_REQUIRED');
  }
  if (report.targetMatrix?.ok !== true || (report.targetMatrix?.missingKeys || []).length > 0) {
    errors.push('V6_DATA_RETENTION_TARGET_MATRIX_REQUIRED');
  }
  const evidence = report.observedEvidence || {};
  if (
    evidence.privateDataExposureCount > 0
    || evidence.playerVisibleRetentionSurfaceCount > 0
    || evidence.deletesRuntimeData === true
    || evidence.appliesRetentionExpiry === true
    || evidence.mutatesWorldState === true
    || evidence.exposesPrivateData === true
  ) {
    errors.push('V6_DATA_RETENTION_TARGET_EVIDENCE_SAFETY_REQUIRED');
  }
  if (report.ok !== true || (Array.isArray(report.errors) && report.errors.length > 0)) {
    errors.push('V6_DATA_RETENTION_TARGET_ERRORS_PRESENT');
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  REQUIRED_DATA_RETENTION_RELEASE_GAPS: [...REQUIRED_DATA_RETENTION_RELEASE_GAPS],
  REQUIRED_DATA_RETENTION_TARGET_KEYS: [...REQUIRED_DATA_RETENTION_TARGET_KEYS],
  V6_DATA_RETENTION_TARGETS: clone(V6_DATA_RETENTION_TARGETS),
  V6_DATA_RETENTION_TARGETS_VERSION,
  assertV6DataRetentionTargetReportSafe,
  buildV6DataRetentionTargetReport,
  inspectDataRetentionTargets
};
