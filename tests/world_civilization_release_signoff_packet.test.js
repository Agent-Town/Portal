const test = require('node:test');
const assert = require('node:assert/strict');

const {
  REQUIRED_RELEASE_SIGNOFF_PACKET_GAPS,
  REQUIRED_RELEASE_SIGNOFF_PACKET_KEYS,
  V6_RELEASE_SIGNOFF_PACKET_REQUIREMENTS,
  V6_RELEASE_SIGNOFF_PACKET_VERSION,
  assertV6ReleaseSignoffPacketReportSafe,
  buildV6ReleaseSignoffPacketReport,
  inspectReleaseSignoffPacketRequirements
} = require('../server/world_civilization/release_signoff_packet');

function observedEvidence(overrides = {}) {
  return {
    productOwnerApprovalCount: 1,
    qaOwnerSignoffCount: 1,
    securityOwnerSignoffCount: 1,
    privacyOwnerSignoffCount: 1,
    supportOwnerSignoffCount: 1,
    releaseManagerApprovalCount: 1,
    engineeringOwnerApprovalCount: 1,
    blockerRegisterAcceptanceCount: 1,
    releaseCandidatePacketAcceptanceCount: 1,
    operationsHandoffAcceptanceCount: 1,
    observabilityHandoffAcceptanceCount: 1,
    supportRunbookAcceptanceCount: 1,
    privateDataExposureCount: 0,
    runtimeCivicToolExposureCount: 0,
    unsignedApprovalCount: 0,
    expiredApprovalCount: 0,
    missingOwnerCount: 0,
    appliesWorldState: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    approvesRelease: false,
    enablesProduction: false,
    publishesComms: false,
    opensCanary: false,
    productionEnabled: false,
    publishesRuntimeTools: false,
    ...overrides
  };
}

test('V6 release signoff packet requirements name every cross-functional approval surface', () => {
  const matrix = inspectReleaseSignoffPacketRequirements();

  assert.equal(matrix.ok, true);
  assert.deepEqual(matrix.requiredKeys, REQUIRED_RELEASE_SIGNOFF_PACKET_KEYS);
  assert.deepEqual(matrix.missingKeys, []);
  assert.equal(matrix.requirementCount, V6_RELEASE_SIGNOFF_PACKET_REQUIREMENTS.length);
  assert.ok(matrix.requirementKeys.includes('product_owner_approval'));
  assert.ok(matrix.requirementKeys.includes('qa_owner_signoff'));
  assert.ok(matrix.requirementKeys.includes('security_owner_signoff'));
  assert.ok(matrix.requirementKeys.includes('privacy_owner_signoff'));
  assert.ok(matrix.requirementKeys.includes('support_owner_signoff'));
  assert.ok(matrix.requirementKeys.includes('release_manager_approval'));
  assert.ok(matrix.requirementKeys.includes('engineering_owner_approval'));
  assert.ok(matrix.requirementKeys.includes('blocker_register_acceptance'));
  assert.ok(matrix.requirementKeys.includes('release_candidate_packet_acceptance'));
  assert.ok(matrix.requirementKeys.includes('operations_handoff_acceptance'));
  assert.ok(matrix.requirementKeys.includes('observability_handoff_acceptance'));
  assert.ok(matrix.requirementKeys.includes('support_runbook_acceptance'));
  assert.match(matrix.digest, /^sha256:[a-f0-9]{64}$/);
});

test('V6 release signoff packet records evidence without approving release or enabling production', () => {
  const report = buildV6ReleaseSignoffPacketReport({
    observed: observedEvidence(),
    source: 'node_test'
  });

  assert.equal(report.version, V6_RELEASE_SIGNOFF_PACKET_VERSION);
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
  assert.equal(report.executionStatus, 'not_executable');
  assert.equal(report.targetMatrix.ok, true);
  assert.equal(report.observedEvidence.productOwnerApprovalCount, 1);
  assert.equal(report.observedEvidence.releaseCandidatePacketAcceptanceCount, 1);
  assert.equal(report.observedEvidence.runtimeCivicToolExposureCount, 0);
  assert.deepEqual(report.releaseGaps, REQUIRED_RELEASE_SIGNOFF_PACKET_GAPS);
  assert.deepEqual(assertV6ReleaseSignoffPacketReportSafe(report), { ok: true, errors: [] });
});

test('V6 release signoff packet fails closed for missing evidence and unsafe approval records', () => {
  const incomplete = buildV6ReleaseSignoffPacketReport({
    requirements: V6_RELEASE_SIGNOFF_PACKET_REQUIREMENTS.filter((requirement) => requirement.key !== 'product_owner_approval'),
    observed: observedEvidence()
  });
  assert.equal(incomplete.ok, false);
  assert.match(incomplete.errors.join(','), /V6_RELEASE_SIGNOFF_PACKET_TARGET_MATRIX_INCOMPLETE/);
  assert.match(assertV6ReleaseSignoffPacketReportSafe(incomplete).errors.join(','), /V6_RELEASE_SIGNOFF_PACKET_ERRORS_PRESENT/);

  const missingEvidence = buildV6ReleaseSignoffPacketReport();
  assert.equal(missingEvidence.ok, false);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_SIGNOFF_PACKET_PRODUCT_OWNER_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_SIGNOFF_PACKET_QA_OWNER_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_SIGNOFF_PACKET_SECURITY_OWNER_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_SIGNOFF_PACKET_PRIVACY_OWNER_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_SIGNOFF_PACKET_SUPPORT_OWNER_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_SIGNOFF_PACKET_RELEASE_MANAGER_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_SIGNOFF_PACKET_ENGINEERING_OWNER_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_SIGNOFF_PACKET_RELEASE_CANDIDATE_REQUIRED/);
  assert.match(missingEvidence.errors.join(','), /V6_RELEASE_SIGNOFF_PACKET_SUPPORT_RUNBOOK_REQUIRED/);

  const unsafeApprovals = buildV6ReleaseSignoffPacketReport({
    observed: observedEvidence({
      unsignedApprovalCount: 1,
      expiredApprovalCount: 1,
      missingOwnerCount: 1
    })
  });
  assert.equal(unsafeApprovals.ok, false);
  assert.match(unsafeApprovals.errors.join(','), /V6_RELEASE_SIGNOFF_PACKET_APPROVAL_INTEGRITY_REQUIRED/);

  const unsafeSurface = buildV6ReleaseSignoffPacketReport({
    observed: observedEvidence({
      privateDataExposureCount: 1,
      runtimeCivicToolExposureCount: 1
    })
  });
  assert.equal(unsafeSurface.ok, false);
  assert.match(unsafeSurface.errors.join(','), /V6_RELEASE_SIGNOFF_PACKET_PRIVATE_DATA_FORBIDDEN/);
  assert.match(unsafeSurface.errors.join(','), /V6_RELEASE_SIGNOFF_PACKET_RUNTIME_TOOL_EXPOSURE_FORBIDDEN/);
});

test('V6 release signoff packet assertion rejects fake approval release canary and world mutation', () => {
  const report = buildV6ReleaseSignoffPacketReport({
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
    executionStatus: 'executes',
    releaseGaps: [],
    observedEvidence: {
      ...report.observedEvidence,
      privateDataExposureCount: 1,
      runtimeCivicToolExposureCount: 1,
      unsignedApprovalCount: 1,
      expiredApprovalCount: 1,
      missingOwnerCount: 1,
      appliesWorldState: true,
      mutatesWorldState: true,
      exposesPrivateData: true,
      approvesRelease: true,
      enablesProduction: true,
      productionEnabled: true,
      publishesComms: true,
      opensCanary: true,
      publishesRuntimeTools: true
    }
  };
  const safety = assertV6ReleaseSignoffPacketReportSafe(unsafe);

  assert.equal(safety.ok, false);
  assert.match(safety.errors.join(','), /V6_RELEASE_SIGNOFF_PACKET_RESEARCH_ONLY_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_RELEASE_SIGNOFF_PACKET_RELEASE_READY_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_RELEASE_SIGNOFF_PACKET_PRODUCTION_ENABLEMENT_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_RELEASE_SIGNOFF_PACKET_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_RELEASE_SIGNOFF_PACKET_NON_EXECUTING_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_RELEASE_SIGNOFF_PACKET_EXECUTION_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_RELEASE_SIGNOFF_PACKET_PRIVATE_DATA_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_RELEASE_SIGNOFF_PACKET_RELEASE_GAPS_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_RELEASE_SIGNOFF_PACKET_EVIDENCE_SAFETY_REQUIRED/);
});
