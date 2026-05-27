const test = require('node:test');
const assert = require('node:assert/strict');

const {
  REQUIRED_RELEASE_CANDIDATE_GAPS,
  REQUIRED_RELEASE_CANDIDATE_TARGET_KEYS,
  V6_RELEASE_CANDIDATE_TARGETS,
  V6_RELEASE_CANDIDATE_TARGETS_VERSION,
  assertV6ReleaseCandidateTargetReportSafe,
  buildV6ReleaseCandidateTargetReport,
  inspectReleaseCandidateTargets
} = require('../server/world_civilization/release_candidate_targets');

function observedEvidence(overrides = {}) {
  return {
    releaseCandidateEnvironmentCount: 1,
    commandTranscriptCount: 1,
    targetedNodeResultsCount: 1,
    splitPlaywrightResultsCount: 1,
    allFeaturesRegressionResultsCount: 1,
    browserConsoleErrorBudgetCount: 1,
    playwrightTraceArchiveCount: 1,
    productionOverrideRecheckCount: 1,
    runtimeToolAbsenceRecheckCount: 1,
    qaOwnerSignoffCount: 1,
    securityProductSignoffPacketCount: 1,
    blockerExceptionRegisterCount: 1,
    controlledReleaseHandoffCount: 1,
    privateDataExposureCount: 0,
    playerVisibleReleaseSurfaceCount: 0,
    runtimeCivicToolExposureCount: 0,
    appliesWorldState: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    executesRelease: false,
    executesValidation: false,
    publishesRuntimeTools: false,
    ...overrides
  };
}

test('V6 release-candidate targets name every evidence packet surface', () => {
  const matrix = inspectReleaseCandidateTargets();

  assert.equal(matrix.ok, true);
  assert.deepEqual(matrix.requiredKeys, REQUIRED_RELEASE_CANDIDATE_TARGET_KEYS);
  assert.deepEqual(matrix.missingKeys, []);
  assert.equal(matrix.targetCount, V6_RELEASE_CANDIDATE_TARGETS.length);
  assert.ok(matrix.targetKeys.includes('release_candidate_environment'));
  assert.ok(matrix.targetKeys.includes('command_transcript'));
  assert.ok(matrix.targetKeys.includes('browser_console_error_budget'));
  assert.ok(matrix.targetKeys.includes('playwright_trace_archive'));
  assert.ok(matrix.targetKeys.includes('production_override_recheck'));
  assert.ok(matrix.targetKeys.includes('qa_owner_signoff'));
  assert.ok(matrix.targetKeys.includes('controlled_release_handoff'));
  assert.match(matrix.digest, /^sha256:[a-f0-9]{64}$/);
});

test('V6 release-candidate report records evidence without enabling release', () => {
  const report = buildV6ReleaseCandidateTargetReport({
    observed: observedEvidence(),
    source: 'node_test'
  });

  assert.equal(report.version, V6_RELEASE_CANDIDATE_TARGETS_VERSION);
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
  assert.equal(report.executesRelease, false);
  assert.equal(report.executesValidation, false);
  assert.equal(report.publishesRuntimeTools, false);
  assert.equal(report.executionStatus, 'not_executable');
  assert.equal(report.targetMatrix.ok, true);
  assert.equal(report.observedEvidence.releaseCandidateEnvironmentCount, 1);
  assert.equal(report.observedEvidence.runtimeCivicToolExposureCount, 0);
  assert.deepEqual(report.releaseGaps, REQUIRED_RELEASE_CANDIDATE_GAPS);
  assert.deepEqual(assertV6ReleaseCandidateTargetReportSafe(report), { ok: true, errors: [] });
});

test('V6 release-candidate report fails closed for incomplete targets or missing evidence', () => {
  const incomplete = buildV6ReleaseCandidateTargetReport({
    targets: V6_RELEASE_CANDIDATE_TARGETS.filter((target) => target.key !== 'release_candidate_environment'),
    observed: observedEvidence()
  });
  assert.equal(incomplete.ok, false);
  assert.match(incomplete.errors.join(','), /V6_RELEASE_CANDIDATE_TARGET_MATRIX_INCOMPLETE/);
  assert.match(assertV6ReleaseCandidateTargetReportSafe(incomplete).errors.join(','), /V6_RELEASE_CANDIDATE_TARGET_ERRORS_PRESENT/);

  const missingEvidence = buildV6ReleaseCandidateTargetReport();
  assert.equal(missingEvidence.ok, false);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_CANDIDATE_ENVIRONMENT_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_CANDIDATE_COMMAND_TRANSCRIPT_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_CANDIDATE_CONSOLE_BUDGET_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_CANDIDATE_TRACE_ARCHIVE_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_CANDIDATE_QA_SIGNOFF_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_CANDIDATE_CONTROLLED_RELEASE_HANDOFF_REQUIRED/);
});

test('V6 release-candidate assertion rejects fake readiness exposure and execution', () => {
  const report = buildV6ReleaseCandidateTargetReport({
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
    executesRelease: true,
    executesValidation: true,
    publishesRuntimeTools: true,
    executionStatus: 'executes',
    releaseGaps: [],
    observedEvidence: {
      ...report.observedEvidence,
      privateDataExposureCount: 1,
      playerVisibleReleaseSurfaceCount: 1,
      runtimeCivicToolExposureCount: 1,
      appliesWorldState: true,
      mutatesWorldState: true,
      exposesPrivateData: true,
      executesRelease: true,
      executesValidation: true,
      publishesRuntimeTools: true
    }
  };
  const safety = assertV6ReleaseCandidateTargetReportSafe(unsafe);

  assert.equal(safety.ok, false);
  assert.match(safety.errors.join(','), /V6_RELEASE_CANDIDATE_TARGET_RESEARCH_ONLY_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_RELEASE_CANDIDATE_TARGET_RELEASE_READY_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_RELEASE_CANDIDATE_TARGET_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_RELEASE_CANDIDATE_TARGET_PLAYER_HIDDEN_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_RELEASE_CANDIDATE_TARGET_EXECUTION_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_RELEASE_CANDIDATE_TARGET_PRIVATE_DATA_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_RELEASE_CANDIDATE_TARGET_NON_EXECUTING_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_RELEASE_CANDIDATE_TARGET_RELEASE_GAPS_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_RELEASE_CANDIDATE_TARGET_EVIDENCE_SAFETY_REQUIRED/);
});
