const test = require('node:test');
const assert = require('node:assert/strict');

const {
  REQUIRED_PRIVACY_REVIEW_RELEASE_GAPS,
  REQUIRED_PRIVACY_REVIEW_TARGET_KEYS,
  V6_PRIVACY_REVIEW_TARGETS,
  V6_PRIVACY_REVIEW_TARGETS_VERSION,
  assertV6PrivacyReviewTargetReportSafe,
  buildV6PrivacyReviewTargetReport,
  inspectPrivacyReviewTargets
} = require('../server/world_civilization/privacy_review_targets');

function observedEvidence(overrides = {}) {
  return {
    privateTownIsolationProbeCount: 2,
    publicSurfaceInventoryProbeCount: 1,
    secretExclusionProbeCount: 2,
    debugTraceRedactionProbeCount: 1,
    workerObservabilityRedactionProbeCount: 1,
    publicTextRenderingProbeCount: 2,
    modalLabPrivacyProbeCount: 1,
    auditSummaryMinimizationProbeCount: 2,
    crossAccountBoundaryProbeCount: 2,
    privateDataExposureCount: 0,
    secretExposureCount: 0,
    playerVisibleV6PrivacySurfaceCount: 0,
    appliesWorldState: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    ...overrides
  };
}

test('V6 privacy review targets name every release privacy surface', () => {
  const matrix = inspectPrivacyReviewTargets();

  assert.equal(matrix.ok, true);
  assert.deepEqual(matrix.requiredKeys, REQUIRED_PRIVACY_REVIEW_TARGET_KEYS);
  assert.deepEqual(matrix.missingKeys, []);
  assert.equal(matrix.targetCount, V6_PRIVACY_REVIEW_TARGETS.length);
  assert.ok(matrix.targetKeys.includes('private_town_isolation'));
  assert.ok(matrix.targetKeys.includes('brain_provider_secret_exclusion'));
  assert.ok(matrix.targetKeys.includes('debug_trace_redaction'));
  assert.ok(matrix.targetKeys.includes('public_text_rendering_xss'));
  assert.ok(matrix.targetKeys.includes('cross_account_boundary'));
  assert.match(matrix.digest, /^sha256:[a-f0-9]{64}$/);
});

test('V6 privacy review report records current redaction evidence without release readiness', () => {
  const report = buildV6PrivacyReviewTargetReport({
    observed: observedEvidence(),
    source: 'node_test'
  });

  assert.equal(report.version, V6_PRIVACY_REVIEW_TARGETS_VERSION);
  assert.equal(report.status, 'research_only');
  assert.equal(report.source, 'node_test');
  assert.equal(report.ok, true);
  assert.equal(report.releaseReady, false);
  assert.equal(report.productionReady, false);
  assert.equal(report.runtimeExposed, false);
  assert.equal(report.playerVisible, false);
  assert.equal(report.normalGameplayExposure, false);
  assert.equal(report.mutatesWorldState, false);
  assert.equal(report.exposesPrivateData, false);
  assert.equal(report.executionStatus, 'not_executable');
  assert.equal(report.targetMatrix.ok, true);
  assert.equal(report.observedEvidence.secretExclusionProbeCount, 2);
  assert.equal(report.observedEvidence.publicTextRenderingProbeCount, 2);
  assert.equal(report.observedEvidence.playerVisibleV6PrivacySurfaceCount, 0);
  assert.deepEqual(report.releaseGaps, REQUIRED_PRIVACY_REVIEW_RELEASE_GAPS);
  assert.deepEqual(assertV6PrivacyReviewTargetReportSafe(report), { ok: true, errors: [] });
});

test('V6 privacy review report fails closed for incomplete targets or missing current probes', () => {
  const incomplete = buildV6PrivacyReviewTargetReport({
    targets: V6_PRIVACY_REVIEW_TARGETS.filter((target) => target.key !== 'private_town_isolation'),
    observed: observedEvidence()
  });
  assert.equal(incomplete.ok, false);
  assert.match(incomplete.errors.join(','), /V6_PRIVACY_REVIEW_TARGET_MATRIX_INCOMPLETE/);
  assert.match(assertV6PrivacyReviewTargetReportSafe(incomplete).errors.join(','), /V6_PRIVACY_REVIEW_TARGET_ERRORS_PRESENT/);

  const missingProbes = buildV6PrivacyReviewTargetReport();
  assert.equal(missingProbes.ok, false);
  assert.match(missingProbes.errors.join(','), /V6_PRIVACY_REVIEW_PRIVATE_TOWN_ISOLATION_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_PRIVACY_REVIEW_SECRET_EXCLUSION_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_PRIVACY_REVIEW_DEBUG_TRACE_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_PRIVACY_REVIEW_PUBLIC_TEXT_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_PRIVACY_REVIEW_CROSS_ACCOUNT_PROBE_REQUIRED/);
});

test('V6 privacy review assertion rejects fake release readiness private data and world mutation', () => {
  const report = buildV6PrivacyReviewTargetReport({
    observed: observedEvidence()
  });
  const unsafe = {
    ...report,
    status: 'release_candidate',
    releaseReady: true,
    productionReady: true,
    runtimeExposed: true,
    playerVisible: true,
    normalGameplayExposure: true,
    mutatesWorldState: true,
    exposesPrivateData: true,
    executionStatus: 'executes',
    releaseGaps: [],
    observedEvidence: {
      ...report.observedEvidence,
      privateDataExposureCount: 1,
      secretExposureCount: 1,
      playerVisibleV6PrivacySurfaceCount: 1,
      appliesWorldState: true,
      mutatesWorldState: true,
      exposesPrivateData: true
    }
  };
  const safety = assertV6PrivacyReviewTargetReportSafe(unsafe);

  assert.equal(safety.ok, false);
  assert.match(safety.errors.join(','), /V6_PRIVACY_REVIEW_TARGET_RESEARCH_ONLY_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_PRIVACY_REVIEW_TARGET_RELEASE_READY_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_PRIVACY_REVIEW_TARGET_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_PRIVACY_REVIEW_TARGET_PLAYER_HIDDEN_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_PRIVACY_REVIEW_TARGET_WORLD_MUTATION_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_PRIVACY_REVIEW_TARGET_PRIVATE_DATA_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_PRIVACY_REVIEW_TARGET_NON_EXECUTING_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_PRIVACY_REVIEW_TARGET_RELEASE_GAPS_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_PRIVACY_REVIEW_TARGET_EVIDENCE_SAFETY_REQUIRED/);
});
