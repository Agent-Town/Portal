const crypto = require('crypto');

const WORLD_GRID_RATE_LIMIT_ROLLOUT_VERSION = 'agent-town.v5.world-grid.rate-limit-rollout.v1';

const REQUIRED_WORLD_GRID_RATE_LIMIT_ROLLOUT_TARGET_KEYS = [
  'trusted_proxy_header_contract',
  'risk_signal_contract',
  'hashed_identity_privacy',
  'idempotent_retry_accounting',
  'distributed_counter_store',
  'per_surface_budget_calibration',
  'abuse_burst_backoff',
  'production_observability'
];

const REQUIRED_WORLD_GRID_RATE_LIMIT_ROLLOUT_RELEASE_GAPS = [
  'trusted_proxy_header_contract_required',
  'risk_signal_contract_required',
  'distributed_counter_store_required',
  'per_surface_budget_calibration_required',
  'abuse_burst_backoff_required',
  'production_observability_required',
  'final_session_auth_integration_required',
  'ops_security_signoff_required'
];

const WORLD_GRID_RATE_LIMIT_ROLLOUT_TARGETS = [
  {
    key: 'trusted_proxy_header_contract',
    surface: 'production_proxy_edge',
    requiredEvidence: 'Release rollout must define which proxy headers are trusted, how spoofed client headers are stripped, and how direct-origin requests fail closed.',
    currentEvidence: 'docs/security/WORLD_GRID_MUTATION_SECURITY_PLAN.md',
    releaseEvidenceRequired: 'trusted_proxy_header_contract_packet'
  },
  {
    key: 'risk_signal_contract',
    surface: 'production_risk_pipeline',
    requiredEvidence: 'Release rollout must define allowed risk signal values, source ownership, default behavior when the signal is missing, and privacy-safe storage.',
    currentEvidence: 'server/world_grid/rate_limit.js',
    releaseEvidenceRequired: 'risk_signal_contract_packet'
  },
  {
    key: 'hashed_identity_privacy',
    surface: 'world_grid_rate_limit_buckets',
    requiredEvidence: 'Rate-limit bucket identity must hash session and IP material and must not persist raw session IDs, IP addresses, provider tokens, or wallet secrets.',
    currentEvidence: 'tests/world_grid_rate_limit_persistence.test.js',
    releaseEvidenceRequired: 'hashed_identity_privacy_review_packet'
  },
  {
    key: 'idempotent_retry_accounting',
    surface: 'mutating_world_grid_routes',
    requiredEvidence: 'Exact idempotent retries must not consume another bucket hit, while changed-payload idempotency conflicts must still pass through the limiter.',
    currentEvidence: 'tests/world_grid_region.test.js',
    releaseEvidenceRequired: 'idempotent_retry_accounting_packet'
  },
  {
    key: 'distributed_counter_store',
    surface: 'production_rate_limit_storage',
    requiredEvidence: 'Production rollout must use durable/shared counters with predictable reset behavior across instances and restarts.',
    currentEvidence: 'tests/world_grid_rate_limit_persistence.test.js',
    releaseEvidenceRequired: 'distributed_counter_store_packet'
  },
  {
    key: 'per_surface_budget_calibration',
    surface: 'v51_to_v55_mutation_surfaces',
    requiredEvidence: 'Each public mutation surface must have calibrated per-owner/session/risk budgets and documented retry-after behavior.',
    currentEvidence: 'docs/rate-limits.md',
    releaseEvidenceRequired: 'per_surface_budget_calibration_packet'
  },
  {
    key: 'abuse_burst_backoff',
    surface: 'public_world_grid_abuse_paths',
    requiredEvidence: 'Release rollout must define burst, sustained abuse, and elevated-risk backoff behavior without blocking legitimate exact idempotent retries.',
    currentEvidence: 'server/world_grid/rate_limit.js',
    releaseEvidenceRequired: 'abuse_burst_backoff_packet'
  },
  {
    key: 'production_observability',
    surface: 'operations_monitoring',
    requiredEvidence: 'Ops handoff must expose privacy-safe metrics for allowed/blocked mutations, risk buckets, retry-after values, and limiter errors.',
    currentEvidence: 'docs/release-evidence/WORLD_GRID_V50_REGION_PROTOTYPE_EVIDENCE_2026-05-26.md',
    releaseEvidenceRequired: 'production_observability_packet'
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

function targetMatrixDigest(targets = WORLD_GRID_RATE_LIMIT_ROLLOUT_TARGETS) {
  return sha256(JSON.stringify(targets.map((target) => ({
    key: target.key,
    surface: target.surface,
    requiredEvidence: target.requiredEvidence,
    releaseEvidenceRequired: target.releaseEvidenceRequired
  }))));
}

function inspectWorldGridRateLimitRolloutTargets(targets = WORLD_GRID_RATE_LIMIT_ROLLOUT_TARGETS) {
  const safeTargets = Array.isArray(targets) ? targets : [];
  const targetKeys = safeTargets.map((target) => String(target.key || ''));
  const missingKeys = REQUIRED_WORLD_GRID_RATE_LIMIT_ROLLOUT_TARGET_KEYS.filter((key) => !targetKeys.includes(key));
  const incompleteTargets = safeTargets.filter((target) => (
    !target.key
    || !target.surface
    || !target.requiredEvidence
    || !target.currentEvidence
    || !target.releaseEvidenceRequired
  )).map((target) => String(target.key || 'unknown'));

  return {
    ok: missingKeys.length === 0 && incompleteTargets.length === 0,
    requiredKeys: [...REQUIRED_WORLD_GRID_RATE_LIMIT_ROLLOUT_TARGET_KEYS],
    targetKeys,
    missingKeys,
    incompleteTargets,
    targetCount: safeTargets.length,
    digest: targetMatrixDigest(safeTargets)
  };
}

function buildMissingReport(errors = []) {
  return {
    version: WORLD_GRID_RATE_LIMIT_ROLLOUT_VERSION,
    status: 'prototype_release_gate',
    ok: false,
    errors,
    releaseReady: false,
    productionReady: false,
    productionEnabled: false,
    runtimeExposed: false,
    playerVisibleByDefault: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    executionStatus: 'not_executable',
    targetMatrix: inspectWorldGridRateLimitRolloutTargets([]),
    observedEvidence: {},
    releaseGaps: [...REQUIRED_WORLD_GRID_RATE_LIMIT_ROLLOUT_RELEASE_GAPS]
  };
}

function buildWorldGridRateLimitRolloutReport({
  targets = WORLD_GRID_RATE_LIMIT_ROLLOUT_TARGETS,
  observed = {},
  source = 'runtime'
} = {}) {
  const targetMatrix = inspectWorldGridRateLimitRolloutTargets(targets);
  const observedEvidence = {
    hashedIdentityProbeCount: numberValue(observed.hashedIdentityProbeCount),
    exactReplayNoChargeProbeCount: numberValue(observed.exactReplayNoChargeProbeCount),
    conflictLimiterProbeCount: numberValue(observed.conflictLimiterProbeCount),
    durableCounterProbeCount: numberValue(observed.durableCounterProbeCount),
    trustedProxyContractPresent: observed.trustedProxyContractPresent === true,
    riskSignalContractPresent: observed.riskSignalContractPresent === true,
    distributedCounterStorePresent: observed.distributedCounterStorePresent === true,
    perSurfaceCalibrationPresent: observed.perSurfaceCalibrationPresent === true,
    productionObservabilityPresent: observed.productionObservabilityPresent === true,
    privateDataExposureCount: numberValue(observed.privateDataExposureCount),
    rawSessionOrIpPersistedCount: numberValue(observed.rawSessionOrIpPersistedCount),
    idempotentReplayChargedCount: numberValue(observed.idempotentReplayChargedCount),
    conflictBypassCount: numberValue(observed.conflictBypassCount),
    appliesWorldState: observed.appliesWorldState === true,
    mutatesWorldState: observed.mutatesWorldState === true,
    exposesPrivateData: observed.exposesPrivateData === true,
    enablesProduction: observed.enablesProduction === true,
    playerVisibleByDefault: observed.playerVisibleByDefault === true
  };
  const errors = [];
  if (targetMatrix.ok !== true) errors.push('WORLD_GRID_RATE_LIMIT_ROLLOUT_TARGET_MATRIX_INCOMPLETE');
  if (observedEvidence.hashedIdentityProbeCount <= 0) errors.push('WORLD_GRID_RATE_LIMIT_ROLLOUT_HASHED_IDENTITY_REQUIRED');
  if (observedEvidence.exactReplayNoChargeProbeCount <= 0) errors.push('WORLD_GRID_RATE_LIMIT_ROLLOUT_EXACT_REPLAY_REQUIRED');
  if (observedEvidence.conflictLimiterProbeCount <= 0) errors.push('WORLD_GRID_RATE_LIMIT_ROLLOUT_CONFLICT_LIMITER_REQUIRED');
  if (observedEvidence.durableCounterProbeCount <= 0) errors.push('WORLD_GRID_RATE_LIMIT_ROLLOUT_DURABLE_COUNTER_REQUIRED');
  if (observedEvidence.privateDataExposureCount > 0 || observedEvidence.exposesPrivateData) {
    errors.push('WORLD_GRID_RATE_LIMIT_ROLLOUT_PRIVATE_DATA_FORBIDDEN');
  }
  if (observedEvidence.rawSessionOrIpPersistedCount > 0) errors.push('WORLD_GRID_RATE_LIMIT_ROLLOUT_RAW_IDENTITY_FORBIDDEN');
  if (observedEvidence.idempotentReplayChargedCount > 0) errors.push('WORLD_GRID_RATE_LIMIT_ROLLOUT_REPLAY_CHARGE_FORBIDDEN');
  if (observedEvidence.conflictBypassCount > 0) errors.push('WORLD_GRID_RATE_LIMIT_ROLLOUT_CONFLICT_BYPASS_FORBIDDEN');
  if (observedEvidence.appliesWorldState || observedEvidence.mutatesWorldState) {
    errors.push('WORLD_GRID_RATE_LIMIT_ROLLOUT_WORLD_MUTATION_FORBIDDEN');
  }
  if (observedEvidence.enablesProduction) errors.push('WORLD_GRID_RATE_LIMIT_ROLLOUT_PRODUCTION_ENABLEMENT_FORBIDDEN');
  if (observedEvidence.playerVisibleByDefault) errors.push('WORLD_GRID_RATE_LIMIT_ROLLOUT_VISIBILITY_FORBIDDEN');
  if (errors.length > 0) {
    return {
      ...buildMissingReport(errors),
      source,
      targetMatrix,
      observedEvidence
    };
  }

  return {
    version: WORLD_GRID_RATE_LIMIT_ROLLOUT_VERSION,
    status: 'prototype_release_gate',
    source,
    ok: true,
    errors: [],
    releaseReady: false,
    productionReady: false,
    productionEnabled: false,
    runtimeExposed: false,
    playerVisibleByDefault: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    executionStatus: 'not_executable',
    targetMatrix,
    targets: clone(targets),
    observedEvidence,
    releaseGaps: [...REQUIRED_WORLD_GRID_RATE_LIMIT_ROLLOUT_RELEASE_GAPS]
  };
}

function assertWorldGridRateLimitRolloutReportSafe(report = {}) {
  const errors = [];
  if (report.version !== WORLD_GRID_RATE_LIMIT_ROLLOUT_VERSION) {
    errors.push('WORLD_GRID_RATE_LIMIT_ROLLOUT_VERSION_REQUIRED');
  }
  if (report.status !== 'prototype_release_gate') {
    errors.push('WORLD_GRID_RATE_LIMIT_ROLLOUT_STATUS_REQUIRED');
  }
  if (report.releaseReady !== false || report.productionReady !== false) {
    errors.push('WORLD_GRID_RATE_LIMIT_ROLLOUT_RELEASE_READY_FORBIDDEN');
  }
  if (report.productionEnabled !== false) {
    errors.push('WORLD_GRID_RATE_LIMIT_ROLLOUT_PRODUCTION_ENABLEMENT_FORBIDDEN');
  }
  if (report.runtimeExposed !== false || report.playerVisibleByDefault !== false) {
    errors.push('WORLD_GRID_RATE_LIMIT_ROLLOUT_VISIBILITY_FORBIDDEN');
  }
  if (report.mutatesWorldState !== false || report.executionStatus !== 'not_executable') {
    errors.push('WORLD_GRID_RATE_LIMIT_ROLLOUT_NON_EXECUTING_REQUIRED');
  }
  if (report.exposesPrivateData !== false) {
    errors.push('WORLD_GRID_RATE_LIMIT_ROLLOUT_PRIVATE_DATA_FORBIDDEN');
  }
  if (
    !Array.isArray(report.releaseGaps)
    || REQUIRED_WORLD_GRID_RATE_LIMIT_ROLLOUT_RELEASE_GAPS.some((gap) => !report.releaseGaps.includes(gap))
  ) {
    errors.push('WORLD_GRID_RATE_LIMIT_ROLLOUT_RELEASE_GAPS_REQUIRED');
  }
  if (report.targetMatrix?.ok !== true || (report.targetMatrix?.missingKeys || []).length > 0) {
    errors.push('WORLD_GRID_RATE_LIMIT_ROLLOUT_TARGET_MATRIX_REQUIRED');
  }
  const evidence = report.observedEvidence || {};
  if (
    numberValue(evidence.privateDataExposureCount) > 0
    || numberValue(evidence.rawSessionOrIpPersistedCount) > 0
    || numberValue(evidence.idempotentReplayChargedCount) > 0
    || numberValue(evidence.conflictBypassCount) > 0
    || evidence.appliesWorldState === true
    || evidence.mutatesWorldState === true
    || evidence.exposesPrivateData === true
    || evidence.enablesProduction === true
    || evidence.playerVisibleByDefault === true
  ) {
    errors.push('WORLD_GRID_RATE_LIMIT_ROLLOUT_EVIDENCE_SAFETY_REQUIRED');
  }
  if (report.ok !== true || (Array.isArray(report.errors) && report.errors.length > 0)) {
    errors.push('WORLD_GRID_RATE_LIMIT_ROLLOUT_ERRORS_PRESENT');
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  REQUIRED_WORLD_GRID_RATE_LIMIT_ROLLOUT_RELEASE_GAPS: [...REQUIRED_WORLD_GRID_RATE_LIMIT_ROLLOUT_RELEASE_GAPS],
  REQUIRED_WORLD_GRID_RATE_LIMIT_ROLLOUT_TARGET_KEYS: [...REQUIRED_WORLD_GRID_RATE_LIMIT_ROLLOUT_TARGET_KEYS],
  WORLD_GRID_RATE_LIMIT_ROLLOUT_TARGETS: clone(WORLD_GRID_RATE_LIMIT_ROLLOUT_TARGETS),
  WORLD_GRID_RATE_LIMIT_ROLLOUT_VERSION,
  assertWorldGridRateLimitRolloutReportSafe,
  buildWorldGridRateLimitRolloutReport,
  inspectWorldGridRateLimitRolloutTargets
};
