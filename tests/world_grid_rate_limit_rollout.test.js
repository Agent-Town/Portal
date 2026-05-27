const test = require('node:test');
const assert = require('node:assert/strict');

const {
  REQUIRED_WORLD_GRID_RATE_LIMIT_ROLLOUT_RELEASE_GAPS,
  REQUIRED_WORLD_GRID_RATE_LIMIT_ROLLOUT_TARGET_KEYS,
  WORLD_GRID_RATE_LIMIT_ROLLOUT_TARGETS,
  WORLD_GRID_RATE_LIMIT_ROLLOUT_VERSION,
  assertWorldGridRateLimitRolloutReportSafe,
  buildWorldGridRateLimitRolloutReport,
  inspectWorldGridRateLimitRolloutTargets
} = require('../server/world_grid/rate_limit_rollout');

function observedEvidence(overrides = {}) {
  return {
    hashedIdentityProbeCount: 1,
    exactReplayNoChargeProbeCount: 1,
    conflictLimiterProbeCount: 1,
    durableCounterProbeCount: 1,
    trustedProxyContractPresent: false,
    riskSignalContractPresent: false,
    distributedCounterStorePresent: false,
    perSurfaceCalibrationPresent: false,
    productionObservabilityPresent: false,
    privateDataExposureCount: 0,
    rawSessionOrIpPersistedCount: 0,
    idempotentReplayChargedCount: 0,
    conflictBypassCount: 0,
    appliesWorldState: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    enablesProduction: false,
    playerVisibleByDefault: false,
    ...overrides
  };
}

test('world-grid rate-limit rollout targets name trusted proxy risk and calibration gates', () => {
  const matrix = inspectWorldGridRateLimitRolloutTargets();

  assert.equal(matrix.ok, true);
  assert.deepEqual(matrix.requiredKeys, REQUIRED_WORLD_GRID_RATE_LIMIT_ROLLOUT_TARGET_KEYS);
  assert.deepEqual(matrix.missingKeys, []);
  assert.equal(matrix.targetCount, WORLD_GRID_RATE_LIMIT_ROLLOUT_TARGETS.length);
  assert.ok(matrix.targetKeys.includes('trusted_proxy_header_contract'));
  assert.ok(matrix.targetKeys.includes('risk_signal_contract'));
  assert.ok(matrix.targetKeys.includes('hashed_identity_privacy'));
  assert.ok(matrix.targetKeys.includes('idempotent_retry_accounting'));
  assert.ok(matrix.targetKeys.includes('distributed_counter_store'));
  assert.ok(matrix.targetKeys.includes('per_surface_budget_calibration'));
  assert.ok(matrix.targetKeys.includes('abuse_burst_backoff'));
  assert.ok(matrix.targetKeys.includes('production_observability'));
  assert.match(matrix.digest, /^sha256:[a-f0-9]{64}$/);
});

test('world-grid rate-limit rollout report records current foundation without approving release', () => {
  const report = buildWorldGridRateLimitRolloutReport({
    observed: observedEvidence(),
    source: 'node_test'
  });

  assert.equal(report.version, WORLD_GRID_RATE_LIMIT_ROLLOUT_VERSION);
  assert.equal(report.status, 'prototype_release_gate');
  assert.equal(report.source, 'node_test');
  assert.equal(report.ok, true);
  assert.equal(report.releaseReady, false);
  assert.equal(report.productionReady, false);
  assert.equal(report.productionEnabled, false);
  assert.equal(report.runtimeExposed, false);
  assert.equal(report.playerVisibleByDefault, false);
  assert.equal(report.mutatesWorldState, false);
  assert.equal(report.exposesPrivateData, false);
  assert.equal(report.executionStatus, 'not_executable');
  assert.equal(report.targetMatrix.ok, true);
  assert.equal(report.observedEvidence.hashedIdentityProbeCount, 1);
  assert.equal(report.observedEvidence.exactReplayNoChargeProbeCount, 1);
  assert.equal(report.observedEvidence.conflictLimiterProbeCount, 1);
  assert.equal(report.observedEvidence.trustedProxyContractPresent, false);
  assert.equal(report.observedEvidence.distributedCounterStorePresent, false);
  assert.deepEqual(report.releaseGaps, REQUIRED_WORLD_GRID_RATE_LIMIT_ROLLOUT_RELEASE_GAPS);
  assert.deepEqual(assertWorldGridRateLimitRolloutReportSafe(report), { ok: true, errors: [] });
});

test('world-grid rate-limit rollout report fails closed for missing current foundation', () => {
  const incomplete = buildWorldGridRateLimitRolloutReport({
    targets: WORLD_GRID_RATE_LIMIT_ROLLOUT_TARGETS.filter((target) => target.key !== 'risk_signal_contract'),
    observed: observedEvidence()
  });
  assert.equal(incomplete.ok, false);
  assert.match(incomplete.errors.join(','), /WORLD_GRID_RATE_LIMIT_ROLLOUT_TARGET_MATRIX_INCOMPLETE/);
  assert.match(assertWorldGridRateLimitRolloutReportSafe(incomplete).errors.join(','), /WORLD_GRID_RATE_LIMIT_ROLLOUT_ERRORS_PRESENT/);

  const missingProbes = buildWorldGridRateLimitRolloutReport();
  assert.equal(missingProbes.ok, false);
  assert.match(missingProbes.errors.join(','), /WORLD_GRID_RATE_LIMIT_ROLLOUT_HASHED_IDENTITY_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /WORLD_GRID_RATE_LIMIT_ROLLOUT_EXACT_REPLAY_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /WORLD_GRID_RATE_LIMIT_ROLLOUT_CONFLICT_LIMITER_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /WORLD_GRID_RATE_LIMIT_ROLLOUT_DURABLE_COUNTER_REQUIRED/);
});

test('world-grid rate-limit rollout assertion rejects fake production and private identity drift', () => {
  const report = buildWorldGridRateLimitRolloutReport({
    observed: observedEvidence()
  });
  const unsafe = {
    ...report,
    status: 'release_ready',
    releaseReady: true,
    productionReady: true,
    productionEnabled: true,
    runtimeExposed: true,
    playerVisibleByDefault: true,
    mutatesWorldState: true,
    exposesPrivateData: true,
    executionStatus: 'executes',
    releaseGaps: [],
    observedEvidence: {
      ...report.observedEvidence,
      privateDataExposureCount: 1,
      rawSessionOrIpPersistedCount: 1,
      idempotentReplayChargedCount: 1,
      conflictBypassCount: 1,
      appliesWorldState: true,
      mutatesWorldState: true,
      exposesPrivateData: true,
      enablesProduction: true,
      playerVisibleByDefault: true
    }
  };
  const safety = assertWorldGridRateLimitRolloutReportSafe(unsafe);

  assert.equal(safety.ok, false);
  assert.match(safety.errors.join(','), /WORLD_GRID_RATE_LIMIT_ROLLOUT_STATUS_REQUIRED/);
  assert.match(safety.errors.join(','), /WORLD_GRID_RATE_LIMIT_ROLLOUT_RELEASE_READY_FORBIDDEN/);
  assert.match(safety.errors.join(','), /WORLD_GRID_RATE_LIMIT_ROLLOUT_PRODUCTION_ENABLEMENT_FORBIDDEN/);
  assert.match(safety.errors.join(','), /WORLD_GRID_RATE_LIMIT_ROLLOUT_VISIBILITY_FORBIDDEN/);
  assert.match(safety.errors.join(','), /WORLD_GRID_RATE_LIMIT_ROLLOUT_NON_EXECUTING_REQUIRED/);
  assert.match(safety.errors.join(','), /WORLD_GRID_RATE_LIMIT_ROLLOUT_PRIVATE_DATA_FORBIDDEN/);
  assert.match(safety.errors.join(','), /WORLD_GRID_RATE_LIMIT_ROLLOUT_RELEASE_GAPS_REQUIRED/);
  assert.match(safety.errors.join(','), /WORLD_GRID_RATE_LIMIT_ROLLOUT_EVIDENCE_SAFETY_REQUIRED/);
});
