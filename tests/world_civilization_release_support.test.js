const test = require('node:test');
const assert = require('node:assert/strict');

const {
  REQUIRED_RELEASE_SUPPORT_GAPS,
  REQUIRED_RELEASE_SUPPORT_KEYS,
  V6_RELEASE_SUPPORT_REQUIREMENTS,
  V6_RELEASE_SUPPORT_VERSION,
  assertV6ReleaseSupportReportSafe,
  buildV6ReleaseSupportReport,
  inspectReleaseSupportRequirements
} = require('../server/world_civilization/release_support');

function observedEvidence(overrides = {}) {
  return {
    knownIssuesCount: 1,
    supportTriagePathCount: 1,
    incidentResponseLinkCount: 1,
    userCommsTemplateCount: 1,
    rollbackContactCount: 1,
    supportOncallSignoffCount: 1,
    escalationOwnerMatrixCount: 1,
    privacySafeSupportViewCount: 1,
    blockerRegisterLinkCount: 1,
    observabilityLinkCount: 1,
    privateDataExposureCount: 0,
    rawTraceExposureCount: 0,
    providerJargonCommsCount: 0,
    runtimeCivicToolExposureCount: 0,
    appliesWorldState: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    opensSupportQueue: false,
    publishesComms: false,
    triggersRollback: false,
    productionEnabled: false,
    publishesRuntimeTools: false,
    ...overrides
  };
}

test('V6 release support requirements name every support handoff surface', () => {
  const matrix = inspectReleaseSupportRequirements();

  assert.equal(matrix.ok, true);
  assert.deepEqual(matrix.requiredKeys, REQUIRED_RELEASE_SUPPORT_KEYS);
  assert.deepEqual(matrix.missingKeys, []);
  assert.equal(matrix.requirementCount, V6_RELEASE_SUPPORT_REQUIREMENTS.length);
  assert.ok(matrix.requirementKeys.includes('known_issues'));
  assert.ok(matrix.requirementKeys.includes('support_triage'));
  assert.ok(matrix.requirementKeys.includes('incident_response'));
  assert.ok(matrix.requirementKeys.includes('user_comms'));
  assert.ok(matrix.requirementKeys.includes('rollback_contact'));
  assert.ok(matrix.requirementKeys.includes('support_oncall'));
  assert.ok(matrix.requirementKeys.includes('escalation_owners'));
  assert.ok(matrix.requirementKeys.includes('privacy_safe_support_view'));
  assert.ok(matrix.requirementKeys.includes('blocker_register_link'));
  assert.ok(matrix.requirementKeys.includes('observability_link'));
  assert.match(matrix.digest, /^sha256:[a-f0-9]{64}$/);
});

test('V6 release support report records handoff evidence without opening support or publishing comms', () => {
  const report = buildV6ReleaseSupportReport({
    observed: observedEvidence(),
    source: 'node_test'
  });

  assert.equal(report.version, V6_RELEASE_SUPPORT_VERSION);
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
  assert.equal(report.opensSupportQueue, false);
  assert.equal(report.publishesComms, false);
  assert.equal(report.triggersRollback, false);
  assert.equal(report.executionStatus, 'not_executable');
  assert.equal(report.targetMatrix.ok, true);
  assert.equal(report.observedEvidence.knownIssuesCount, 1);
  assert.equal(report.observedEvidence.providerJargonCommsCount, 0);
  assert.equal(report.observedEvidence.runtimeCivicToolExposureCount, 0);
  assert.deepEqual(report.releaseGaps, REQUIRED_RELEASE_SUPPORT_GAPS);
  assert.deepEqual(assertV6ReleaseSupportReportSafe(report), { ok: true, errors: [] });
});

test('V6 release support report fails closed for missing evidence private data or unsafe comms', () => {
  const incomplete = buildV6ReleaseSupportReport({
    requirements: V6_RELEASE_SUPPORT_REQUIREMENTS.filter((requirement) => requirement.key !== 'known_issues'),
    observed: observedEvidence()
  });
  assert.equal(incomplete.ok, false);
  assert.match(incomplete.errors.join(','), /V6_RELEASE_SUPPORT_TARGET_MATRIX_INCOMPLETE/);
  assert.match(assertV6ReleaseSupportReportSafe(incomplete).errors.join(','), /V6_RELEASE_SUPPORT_ERRORS_PRESENT/);

  const missingEvidence = buildV6ReleaseSupportReport();
  assert.equal(missingEvidence.ok, false);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_SUPPORT_KNOWN_ISSUES_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_SUPPORT_TRIAGE_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_SUPPORT_INCIDENT_RESPONSE_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_SUPPORT_ROLLBACK_CONTACT_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_SUPPORT_ONCALL_SIGNOFF_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_SUPPORT_OBSERVABILITY_LINK_REQUIRED/);

  const unsafeComms = buildV6ReleaseSupportReport({
    observed: observedEvidence({ providerJargonCommsCount: 1 })
  });
  assert.equal(unsafeComms.ok, false);
  assert.match(unsafeComms.errors.join(','), /V6_RELEASE_SUPPORT_PRIVATE_DATA_FORBIDDEN/);
});

test('V6 release support assertion rejects fake runtime exposure execution and production enablement', () => {
  const report = buildV6ReleaseSupportReport({
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
    opensSupportQueue: true,
    publishesComms: true,
    triggersRollback: true,
    executionStatus: 'executes',
    releaseGaps: [],
    observedEvidence: {
      ...report.observedEvidence,
      privateDataExposureCount: 1,
      rawTraceExposureCount: 1,
      providerJargonCommsCount: 1,
      runtimeCivicToolExposureCount: 1,
      appliesWorldState: true,
      mutatesWorldState: true,
      exposesPrivateData: true,
      opensSupportQueue: true,
      publishesComms: true,
      triggersRollback: true,
      productionEnabled: true,
      publishesRuntimeTools: true
    }
  };
  const safety = assertV6ReleaseSupportReportSafe(unsafe);

  assert.equal(safety.ok, false);
  assert.match(safety.errors.join(','), /V6_RELEASE_SUPPORT_RESEARCH_ONLY_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_RELEASE_SUPPORT_RELEASE_READY_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_RELEASE_SUPPORT_PRODUCTION_ENABLEMENT_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_RELEASE_SUPPORT_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_RELEASE_SUPPORT_NON_EXECUTING_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_RELEASE_SUPPORT_EXECUTION_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_RELEASE_SUPPORT_PRIVATE_DATA_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_RELEASE_SUPPORT_RELEASE_GAPS_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_RELEASE_SUPPORT_EVIDENCE_SAFETY_REQUIRED/);
});
