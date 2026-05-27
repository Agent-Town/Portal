const test = require('node:test');
const assert = require('node:assert/strict');

const {
  REQUIRED_RELEASE_EVIDENCE_MANIFEST_GAPS,
  REQUIRED_RELEASE_EVIDENCE_MANIFEST_KEYS,
  V6_RELEASE_EVIDENCE_MANIFEST_REQUIREMENTS,
  V6_RELEASE_EVIDENCE_MANIFEST_VERSION,
  assertV6ReleaseEvidenceManifestReportSafe,
  buildV6ReleaseEvidenceManifestReport,
  inspectReleaseEvidenceManifestRequirements
} = require('../server/world_civilization/release_evidence_manifest');

function observedEvidence(overrides = {}) {
  return {
    releaseCandidateEnvironmentCount: 1,
    commandTranscriptCount: 1,
    targetedNodeResultsCount: 1,
    splitPlaywrightResultsCount: 1,
    allFeaturesRegressionResultsCount: 1,
    productionOverrideRecheckCount: 1,
    runtimeToolAbsenceRecheckCount: 1,
    browserConsoleErrorBudgetCount: 1,
    playwrightTraceArchiveCount: 1,
    blockerExceptionRegisterCount: 1,
    releaseSignoffPacketCount: 1,
    releaseOperationsHandoffCount: 1,
    releaseObservabilityHandoffCount: 1,
    releaseSupportHandoffCount: 1,
    auditReplayHealthCount: 1,
    controlledReleaseRunbookCount: 1,
    privateDataExposureCount: 0,
    rawTraceLeakCount: 0,
    unsignedArtifactCount: 0,
    missingDigestCount: 0,
    staleArtifactCount: 0,
    runtimeCivicToolExposureCount: 0,
    appliesWorldState: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    approvesRelease: false,
    enablesProduction: false,
    publishesComms: false,
    opensCanary: false,
    executesValidation: false,
    startsRuntimeMonitoring: false,
    productionEnabled: false,
    publishesRuntimeTools: false,
    ...overrides
  };
}

test('V6 release evidence manifest requirements name every archive input', () => {
  const matrix = inspectReleaseEvidenceManifestRequirements();

  assert.equal(matrix.ok, true);
  assert.deepEqual(matrix.requiredKeys, REQUIRED_RELEASE_EVIDENCE_MANIFEST_KEYS);
  assert.deepEqual(matrix.missingKeys, []);
  assert.equal(matrix.requirementCount, V6_RELEASE_EVIDENCE_MANIFEST_REQUIREMENTS.length);
  assert.ok(matrix.requirementKeys.includes('release_candidate_environment'));
  assert.ok(matrix.requirementKeys.includes('command_transcripts'));
  assert.ok(matrix.requirementKeys.includes('targeted_node_results'));
  assert.ok(matrix.requirementKeys.includes('split_playwright_results'));
  assert.ok(matrix.requirementKeys.includes('all_features_regression_results'));
  assert.ok(matrix.requirementKeys.includes('production_override_recheck'));
  assert.ok(matrix.requirementKeys.includes('runtime_tool_absence_recheck'));
  assert.match(
    V6_RELEASE_EVIDENCE_MANIFEST_REQUIREMENTS.find((requirement) => requirement.key === 'production_override_recheck').requiredEvidence,
    /production-mode browser evidence/
  );
  assert.match(
    V6_RELEASE_EVIDENCE_MANIFEST_REQUIREMENTS.find((requirement) => requirement.key === 'runtime_tool_absence_recheck').requiredEvidence,
    /production-mode browser override and worker-runtime smokes/
  );
  assert.ok(matrix.requirementKeys.includes('browser_console_error_budget'));
  assert.ok(matrix.requirementKeys.includes('playwright_trace_archive'));
  assert.ok(matrix.requirementKeys.includes('blocker_exception_register'));
  assert.ok(matrix.requirementKeys.includes('release_signoff_packet'));
  assert.ok(matrix.requirementKeys.includes('release_operations_handoff'));
  assert.ok(matrix.requirementKeys.includes('release_observability_handoff'));
  assert.ok(matrix.requirementKeys.includes('release_support_handoff'));
  assert.ok(matrix.requirementKeys.includes('audit_replay_health'));
  assert.ok(matrix.requirementKeys.includes('controlled_release_runbook'));
  assert.match(matrix.digest, /^sha256:[a-f0-9]{64}$/);
});

test('V6 release evidence manifest records artifact inventory without running release or validation', () => {
  const report = buildV6ReleaseEvidenceManifestReport({
    observed: observedEvidence(),
    source: 'node_test'
  });

  assert.equal(report.version, V6_RELEASE_EVIDENCE_MANIFEST_VERSION);
  assert.equal(report.status, 'research_only');
  assert.equal(report.source, 'node_test');
  assert.equal(report.ok, true);
  assert.equal(report.releaseReady, false);
  assert.equal(report.productionReady, false);
  assert.equal(report.productionEnabled, false);
  assert.equal(report.runtimeExposed, false);
  assert.equal(report.playerVisible, false);
  assert.equal(report.normalGameplayExposure, false);
  assert.equal(report.mutatesWorldState, false);
  assert.equal(report.exposesPrivateData, false);
  assert.equal(report.approvesRelease, false);
  assert.equal(report.enablesProduction, false);
  assert.equal(report.publishesComms, false);
  assert.equal(report.opensCanary, false);
  assert.equal(report.executesValidation, false);
  assert.equal(report.startsRuntimeMonitoring, false);
  assert.equal(report.executionStatus, 'not_executable');
  assert.equal(report.targetMatrix.ok, true);
  assert.equal(report.observedEvidence.commandTranscriptCount, 1);
  assert.equal(report.observedEvidence.releaseSignoffPacketCount, 1);
  assert.equal(report.observedEvidence.runtimeCivicToolExposureCount, 0);
  assert.deepEqual(report.releaseGaps, REQUIRED_RELEASE_EVIDENCE_MANIFEST_GAPS);
  assert.deepEqual(assertV6ReleaseEvidenceManifestReportSafe(report), { ok: true, errors: [] });
});

test('V6 release evidence manifest fails closed for missing evidence or unsafe artifact integrity', () => {
  const incomplete = buildV6ReleaseEvidenceManifestReport({
    requirements: V6_RELEASE_EVIDENCE_MANIFEST_REQUIREMENTS.filter((requirement) => requirement.key !== 'command_transcripts'),
    observed: observedEvidence()
  });
  assert.equal(incomplete.ok, false);
  assert.match(incomplete.errors.join(','), /V6_RELEASE_EVIDENCE_MANIFEST_TARGET_MATRIX_INCOMPLETE/);
  assert.match(assertV6ReleaseEvidenceManifestReportSafe(incomplete).errors.join(','), /V6_RELEASE_EVIDENCE_MANIFEST_ERRORS_PRESENT/);

  const missingEvidence = buildV6ReleaseEvidenceManifestReport();
  assert.equal(missingEvidence.ok, false);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_EVIDENCE_MANIFEST_ENVIRONMENT_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_EVIDENCE_MANIFEST_COMMAND_TRANSCRIPTS_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_EVIDENCE_MANIFEST_TARGETED_NODE_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_EVIDENCE_MANIFEST_SPLIT_PLAYWRIGHT_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_EVIDENCE_MANIFEST_TRACE_ARCHIVE_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_EVIDENCE_MANIFEST_SIGNOFF_PACKET_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_EVIDENCE_MANIFEST_RUNBOOK_REQUIRED/);

  const unsafeIntegrity = buildV6ReleaseEvidenceManifestReport({
    observed: observedEvidence({
      unsignedArtifactCount: 1,
      missingDigestCount: 1,
      staleArtifactCount: 1
    })
  });
  assert.equal(unsafeIntegrity.ok, false);
  assert.match(unsafeIntegrity.errors.join(','), /V6_RELEASE_EVIDENCE_MANIFEST_ARTIFACT_INTEGRITY_REQUIRED/);

  const unsafeSurface = buildV6ReleaseEvidenceManifestReport({
    observed: observedEvidence({
      privateDataExposureCount: 1,
      rawTraceLeakCount: 1,
      runtimeCivicToolExposureCount: 1
    })
  });
  assert.equal(unsafeSurface.ok, false);
  assert.match(unsafeSurface.errors.join(','), /V6_RELEASE_EVIDENCE_MANIFEST_PRIVATE_DATA_FORBIDDEN/);
  assert.match(unsafeSurface.errors.join(','), /V6_RELEASE_EVIDENCE_MANIFEST_RUNTIME_TOOL_EXPOSURE_FORBIDDEN/);
});

test('V6 release evidence manifest assertion rejects fake release approval or execution', () => {
  const report = buildV6ReleaseEvidenceManifestReport({
    observed: observedEvidence()
  });
  const unsafe = {
    ...report,
    status: 'release_candidate',
    releaseReady: true,
    productionReady: true,
    productionEnabled: true,
    runtimeExposed: true,
    playerVisible: true,
    normalGameplayExposure: true,
    mutatesWorldState: true,
    exposesPrivateData: true,
    approvesRelease: true,
    enablesProduction: true,
    publishesComms: true,
    opensCanary: true,
    executesValidation: true,
    startsRuntimeMonitoring: true,
    executionStatus: 'executes',
    releaseGaps: [],
    observedEvidence: {
      ...report.observedEvidence,
      privateDataExposureCount: 1,
      rawTraceLeakCount: 1,
      unsignedArtifactCount: 1,
      missingDigestCount: 1,
      staleArtifactCount: 1,
      runtimeCivicToolExposureCount: 1,
      appliesWorldState: true,
      mutatesWorldState: true,
      exposesPrivateData: true,
      approvesRelease: true,
      enablesProduction: true,
      productionEnabled: true,
      publishesComms: true,
      opensCanary: true,
      executesValidation: true,
      startsRuntimeMonitoring: true,
      publishesRuntimeTools: true
    }
  };
  const safety = assertV6ReleaseEvidenceManifestReportSafe(unsafe);

  assert.equal(safety.ok, false);
  assert.match(safety.errors.join(','), /V6_RELEASE_EVIDENCE_MANIFEST_RESEARCH_ONLY_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_RELEASE_EVIDENCE_MANIFEST_RELEASE_READY_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_RELEASE_EVIDENCE_MANIFEST_PRODUCTION_ENABLEMENT_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_RELEASE_EVIDENCE_MANIFEST_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_RELEASE_EVIDENCE_MANIFEST_NON_EXECUTING_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_RELEASE_EVIDENCE_MANIFEST_EXECUTION_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_RELEASE_EVIDENCE_MANIFEST_PRIVATE_DATA_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_RELEASE_EVIDENCE_MANIFEST_RELEASE_GAPS_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_RELEASE_EVIDENCE_MANIFEST_EVIDENCE_SAFETY_REQUIRED/);
});
