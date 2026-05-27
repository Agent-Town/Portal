const crypto = require('crypto');

const V6_LOAD_RATE_TARGETS_VERSION = 'agent-town.v6.load_rate_targets.v1';
const REQUIRED_LOAD_RATE_TARGET_RELEASE_GAPS = [
  'production_route_rate_limits_required',
  'store_specific_load_targets_required',
  'release_slo_thresholds_required',
  'abuse_burst_backoff_targets_required',
  'worker_route_load_targets_required',
  'production_infrastructure_signoff_required'
];

const REQUIRED_LOAD_RATE_TARGET_KEYS = [
  'audit_ledger_replay_pagination',
  'idempotency_duplicate_retry_burst',
  'idempotency_conflict_rejection',
  'migration_load_replay',
  'multi_process_write_contention',
  'future_civic_route_rate_limit'
];

const V6_CIVIC_LOAD_RATE_TARGETS = [
  {
    key: 'audit_ledger_replay_pagination',
    surface: 'civic_audit_ledger',
    metric: 'bounded_replay_entries_per_run',
    releaseTarget: {
      minEntries: 10000,
      maxPageSize: 100,
      p95Ms: 1500
    },
    currentEvidence: 'tests/world_civilization_load_rate.test.js',
    releaseEvidenceRequired: 'large_dataset_replay_benchmark'
  },
  {
    key: 'idempotency_duplicate_retry_burst',
    surface: 'civic_audit_ledger',
    metric: 'exact_duplicate_retry_suppression',
    releaseTarget: {
      minDuplicateRetries: 1000,
      duplicateRowDelta: 0,
      p95Ms: 1500
    },
    currentEvidence: 'tests/world_civilization_load_rate.test.js',
    releaseEvidenceRequired: 'route_and_store_retry_burst_benchmark'
  },
  {
    key: 'idempotency_conflict_rejection',
    surface: 'civic_audit_ledger',
    metric: 'changed_payload_reuse_rejection',
    releaseTarget: {
      minConflictProbes: 100,
      acceptedConflicts: 0,
      p95Ms: 750
    },
    currentEvidence: 'tests/world_civilization_load_rate.test.js',
    releaseEvidenceRequired: 'route_and_store_conflict_rejection_benchmark'
  },
  {
    key: 'migration_load_replay',
    surface: 'civic_schema_replay',
    metric: 'schema_inventory_plus_bounded_replay',
    releaseTarget: {
      minEntries: 10000,
      maxPageSize: 100,
      p95Ms: 2000
    },
    currentEvidence: 'tests/world_civilization_migration_load_replay.test.js',
    releaseEvidenceRequired: 'pre_and_post_migration_replay_diff_benchmark'
  },
  {
    key: 'multi_process_write_contention',
    surface: 'civic_audit_ledger',
    metric: 'concurrent_writer_serialization',
    releaseTarget: {
      minConcurrentWriters: 16,
      minWritesPerWriter: 50,
      p95Ms: 2500
    },
    currentEvidence: 'tests/world_civilization_write_contention.test.js',
    releaseEvidenceRequired: 'production_like_concurrent_writer_benchmark'
  },
  {
    key: 'future_civic_route_rate_limit',
    surface: 'future_civic_mutation_routes',
    metric: 'owner_surface_rate_limit_enforcement',
    releaseTarget: {
      perOwnerBurst: 20,
      perSurfaceWindowSeconds: 60,
      acceptedOverLimit: 0
    },
    currentEvidence: 'server/world_civilization/mutation_security.js',
    releaseEvidenceRequired: 'route_level_rate_limit_and_backoff_benchmark'
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

function targetMatrixDigest(targets = V6_CIVIC_LOAD_RATE_TARGETS) {
  return sha256(JSON.stringify(targets.map((target) => ({
    key: target.key,
    surface: target.surface,
    metric: target.metric,
    releaseTarget: target.releaseTarget,
    releaseEvidenceRequired: target.releaseEvidenceRequired
  }))));
}

function inspectTargetMatrix(targets = V6_CIVIC_LOAD_RATE_TARGETS) {
  const safeTargets = Array.isArray(targets) ? targets : [];
  const targetKeys = safeTargets.map((target) => String(target.key || ''));
  const missingKeys = REQUIRED_LOAD_RATE_TARGET_KEYS.filter((key) => !targetKeys.includes(key));
  const incompleteTargets = safeTargets.filter((target) => (
    !target.key
    || !target.surface
    || !target.metric
    || !target.releaseTarget
    || !target.currentEvidence
    || !target.releaseEvidenceRequired
  )).map((target) => String(target.key || 'unknown'));
  return {
    ok: missingKeys.length === 0 && incompleteTargets.length === 0,
    requiredKeys: [...REQUIRED_LOAD_RATE_TARGET_KEYS],
    targetKeys,
    missingKeys,
    incompleteTargets,
    targetCount: safeTargets.length,
    digest: targetMatrixDigest(safeTargets)
  };
}

function buildMissingReport(errors = []) {
  return {
    version: V6_LOAD_RATE_TARGETS_VERSION,
    status: 'research_only',
    ok: false,
    errors,
    releaseReady: false,
    productionReady: false,
    runtimeExposed: false,
    playerVisible: false,
    appliesWorldState: false,
    exposesPrivateData: false,
    reportPayloadIncludesRows: false,
    executionStatus: 'not_executable',
    targetMatrix: inspectTargetMatrix([]),
    researchCalibration: {},
    releaseGaps: [...REQUIRED_LOAD_RATE_TARGET_RELEASE_GAPS]
  };
}

function buildV6LoadRateTargetReport({
  targets = V6_CIVIC_LOAD_RATE_TARGETS,
  observed = {},
  source = 'runtime'
} = {}) {
  const targetMatrix = inspectTargetMatrix(targets);
  const researchCalibration = {
    replayEntryCount: numberValue(observed.replayEntryCount),
    replayPageSize: numberValue(observed.replayPageSize),
    duplicateRetryCount: numberValue(observed.duplicateRetryCount),
    conflictProbeCount: numberValue(observed.conflictProbeCount),
    concurrentWriterCount: numberValue(observed.concurrentWriterCount),
    migrationReplayEntryCount: numberValue(observed.migrationReplayEntryCount),
    routeRateLimitEvidencePresent: observed.routeRateLimitEvidencePresent === true,
    privateRowsIncluded: observed.privateRowsIncluded === true,
    appliesWorldState: observed.appliesWorldState === true
  };
  const errors = [];
  if (targetMatrix.ok !== true) errors.push('V6_LOAD_RATE_TARGET_MATRIX_INCOMPLETE');
  if (researchCalibration.replayEntryCount <= 0) errors.push('V6_LOAD_RATE_REPLAY_CALIBRATION_REQUIRED');
  if (researchCalibration.duplicateRetryCount <= 0) errors.push('V6_LOAD_RATE_RETRY_CALIBRATION_REQUIRED');
  if (researchCalibration.conflictProbeCount <= 0) errors.push('V6_LOAD_RATE_CONFLICT_CALIBRATION_REQUIRED');
  if (researchCalibration.migrationReplayEntryCount <= 0) errors.push('V6_LOAD_RATE_MIGRATION_REPLAY_CALIBRATION_REQUIRED');
  if (researchCalibration.concurrentWriterCount <= 0) errors.push('V6_LOAD_RATE_CONTENTION_CALIBRATION_REQUIRED');
  if (researchCalibration.privateRowsIncluded) errors.push('V6_LOAD_RATE_PRIVATE_ROW_REPORT_FORBIDDEN');
  if (researchCalibration.appliesWorldState) errors.push('V6_LOAD_RATE_WORLD_APPLICATION_FORBIDDEN');
  if (errors.length > 0) return {
    ...buildMissingReport(errors),
    source,
    targetMatrix,
    researchCalibration
  };

  return {
    version: V6_LOAD_RATE_TARGETS_VERSION,
    status: 'research_only',
    source,
    ok: true,
    errors: [],
    releaseReady: false,
    productionReady: false,
    runtimeExposed: false,
    playerVisible: false,
    appliesWorldState: false,
    exposesPrivateData: false,
    reportPayloadIncludesRows: false,
    executionStatus: 'not_executable',
    targetMatrix,
    researchCalibration,
    releaseGaps: [...REQUIRED_LOAD_RATE_TARGET_RELEASE_GAPS]
  };
}

function assertV6LoadRateTargetReportSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_LOAD_RATE_TARGETS_VERSION) {
    errors.push('V6_LOAD_RATE_TARGET_VERSION_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_LOAD_RATE_TARGET_RESEARCH_ONLY_REQUIRED');
  }
  if (report.releaseReady !== false || report.productionReady !== false) {
    errors.push('V6_LOAD_RATE_TARGET_RELEASE_READY_FORBIDDEN');
  }
  if (report.runtimeExposed !== false) {
    errors.push('V6_LOAD_RATE_TARGET_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.playerVisible !== false) {
    errors.push('V6_LOAD_RATE_TARGET_PLAYER_HIDDEN_REQUIRED');
  }
  if (report.appliesWorldState !== false) {
    errors.push('V6_LOAD_RATE_TARGET_WORLD_APPLICATION_FORBIDDEN');
  }
  if (report.exposesPrivateData !== false || report.reportPayloadIncludesRows !== false) {
    errors.push('V6_LOAD_RATE_TARGET_PRIVATE_ROW_REPORT_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_LOAD_RATE_TARGET_NON_EXECUTING_REQUIRED');
  }
  if (!Array.isArray(report.releaseGaps) || REQUIRED_LOAD_RATE_TARGET_RELEASE_GAPS.some((gap) => !report.releaseGaps.includes(gap))) {
    errors.push('V6_LOAD_RATE_TARGET_RELEASE_GAPS_REQUIRED');
  }
  if (report.targetMatrix?.ok !== true || (report.targetMatrix?.missingKeys || []).length > 0) {
    errors.push('V6_LOAD_RATE_TARGET_MATRIX_REQUIRED');
  }
  if (report.researchCalibration?.privateRowsIncluded === true || report.researchCalibration?.appliesWorldState === true) {
    errors.push('V6_LOAD_RATE_TARGET_CALIBRATION_SAFETY_REQUIRED');
  }
  if (report.ok !== true || (Array.isArray(report.errors) && report.errors.length > 0)) {
    errors.push('V6_LOAD_RATE_TARGET_ERRORS_PRESENT');
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  REQUIRED_LOAD_RATE_TARGET_KEYS: [...REQUIRED_LOAD_RATE_TARGET_KEYS],
  REQUIRED_LOAD_RATE_TARGET_RELEASE_GAPS: [...REQUIRED_LOAD_RATE_TARGET_RELEASE_GAPS],
  V6_CIVIC_LOAD_RATE_TARGETS: clone(V6_CIVIC_LOAD_RATE_TARGETS),
  V6_LOAD_RATE_TARGETS_VERSION,
  assertV6LoadRateTargetReportSafe,
  buildV6LoadRateTargetReport,
  inspectTargetMatrix
};
