const test = require('node:test');
const assert = require('node:assert/strict');

const {
  REQUIRED_LOAD_RATE_TARGET_KEYS,
  REQUIRED_LOAD_RATE_TARGET_RELEASE_GAPS,
  V6_CIVIC_LOAD_RATE_TARGETS,
  V6_LOAD_RATE_TARGETS_VERSION,
  assertV6LoadRateTargetReportSafe,
  buildV6LoadRateTargetReport,
  inspectTargetMatrix
} = require('../server/world_civilization/load_rate_targets');

test('V6 load rate targets define every release SLO surface while staying research-only', () => {
  const matrix = inspectTargetMatrix();
  assert.equal(matrix.ok, true);
  assert.deepEqual(matrix.requiredKeys, REQUIRED_LOAD_RATE_TARGET_KEYS);
  assert.deepEqual(matrix.missingKeys, []);
  assert.equal(matrix.targetCount, V6_CIVIC_LOAD_RATE_TARGETS.length);
  assert.ok(matrix.targetKeys.includes('audit_ledger_replay_pagination'));
  assert.ok(matrix.targetKeys.includes('future_civic_route_rate_limit'));
  assert.match(matrix.digest, /^sha256:[a-f0-9]{64}$/);

  const report = buildV6LoadRateTargetReport({
    observed: {
      replayEntryCount: 180,
      replayPageSize: 17,
      duplicateRetryCount: 180,
      conflictProbeCount: 8,
      concurrentWriterCount: 4,
      migrationReplayEntryCount: 96,
      routeRateLimitEvidencePresent: false,
      privateRowsIncluded: false,
      appliesWorldState: false
    },
    source: 'node_test'
  });

  assert.equal(report.version, V6_LOAD_RATE_TARGETS_VERSION);
  assert.equal(report.status, 'research_only');
  assert.equal(report.source, 'node_test');
  assert.equal(report.ok, true);
  assert.equal(report.releaseReady, false);
  assert.equal(report.productionReady, false);
  assert.equal(report.runtimeExposed, false);
  assert.equal(report.playerVisible, false);
  assert.equal(report.appliesWorldState, false);
  assert.equal(report.exposesPrivateData, false);
  assert.equal(report.reportPayloadIncludesRows, false);
  assert.equal(report.executionStatus, 'not_executable');
  assert.equal(report.targetMatrix.ok, true);
  assert.equal(report.researchCalibration.replayEntryCount, 180);
  assert.equal(report.researchCalibration.routeRateLimitEvidencePresent, false);
  assert.deepEqual(report.releaseGaps, REQUIRED_LOAD_RATE_TARGET_RELEASE_GAPS);
  assert.deepEqual(assertV6LoadRateTargetReportSafe(report), { ok: true, errors: [] });
});

test('V6 load rate target report fails closed for incomplete calibration or target matrix', () => {
  const incomplete = buildV6LoadRateTargetReport({
    targets: V6_CIVIC_LOAD_RATE_TARGETS.filter((target) => target.key !== 'future_civic_route_rate_limit'),
    observed: {
      replayEntryCount: 180,
      duplicateRetryCount: 180,
      conflictProbeCount: 8,
      migrationReplayEntryCount: 96,
      concurrentWriterCount: 4
    }
  });
  assert.equal(incomplete.ok, false);
  assert.match(incomplete.errors.join(','), /V6_LOAD_RATE_TARGET_MATRIX_INCOMPLETE/);
  assert.match(assertV6LoadRateTargetReportSafe(incomplete).errors.join(','), /V6_LOAD_RATE_TARGET_ERRORS_PRESENT/);

  const missingCalibration = buildV6LoadRateTargetReport();
  assert.equal(missingCalibration.ok, false);
  assert.match(missingCalibration.errors.join(','), /V6_LOAD_RATE_REPLAY_CALIBRATION_REQUIRED/);
  assert.match(missingCalibration.errors.join(','), /V6_LOAD_RATE_RETRY_CALIBRATION_REQUIRED/);
});

test('V6 load rate target assertion rejects fake release readiness and private row drift', () => {
  const report = buildV6LoadRateTargetReport({
    observed: {
      replayEntryCount: 180,
      replayPageSize: 17,
      duplicateRetryCount: 180,
      conflictProbeCount: 8,
      concurrentWriterCount: 4,
      migrationReplayEntryCount: 96
    }
  });
  const unsafe = {
    ...report,
    status: 'release_candidate',
    releaseReady: true,
    productionReady: true,
    runtimeExposed: true,
    playerVisible: true,
    appliesWorldState: true,
    exposesPrivateData: true,
    reportPayloadIncludesRows: true,
    executionStatus: 'executes',
    releaseGaps: [],
    researchCalibration: {
      ...report.researchCalibration,
      privateRowsIncluded: true,
      appliesWorldState: true
    }
  };
  const safety = assertV6LoadRateTargetReportSafe(unsafe);

  assert.equal(safety.ok, false);
  assert.match(safety.errors.join(','), /V6_LOAD_RATE_TARGET_RESEARCH_ONLY_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_LOAD_RATE_TARGET_RELEASE_READY_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_LOAD_RATE_TARGET_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_LOAD_RATE_TARGET_PLAYER_HIDDEN_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_LOAD_RATE_TARGET_WORLD_APPLICATION_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_LOAD_RATE_TARGET_PRIVATE_ROW_REPORT_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_LOAD_RATE_TARGET_NON_EXECUTING_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_LOAD_RATE_TARGET_RELEASE_GAPS_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_LOAD_RATE_TARGET_CALIBRATION_SAFETY_REQUIRED/);
});
