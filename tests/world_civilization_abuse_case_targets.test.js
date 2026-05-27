const test = require('node:test');
const assert = require('node:assert/strict');

const {
  REQUIRED_ABUSE_CASE_RELEASE_GAPS,
  REQUIRED_ABUSE_CASE_TARGET_KEYS,
  V6_ABUSE_CASE_TARGETS,
  V6_ABUSE_CASE_TARGETS_VERSION,
  assertV6AbuseCaseTargetReportSafe,
  buildV6AbuseCaseTargetReport,
  inspectAbuseCaseTargets
} = require('../server/world_civilization/abuse_case_targets');

function observedEvidence(overrides = {}) {
  return {
    spamProbeCount: 2,
    harassmentProbeCount: 2,
    impersonationProbeCount: 2,
    unauthorizedMutationProbeCount: 2,
    delegationAbuseProbeCount: 2,
    delegationScopeMismatchProbeCount: 1,
    delegationBudgetProbeCount: 1,
    voteReputationFarmingProbeCount: 1,
    publicWorksSpendProbeCount: 1,
    moderationEscalationProbeCount: 1,
    rollbackBypassProbeCount: 1,
    publicAutonomousMutationProbeCount: 1,
    privateDataExposureCount: 0,
    playerVisibleAbuseSurfaceCount: 0,
    appliesWorldState: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    enablesPublicAgentMutation: false,
    publishesPublicFreePlay: false,
    ...overrides
  };
}

test('V6 abuse-case targets name every release abuse surface', () => {
  const matrix = inspectAbuseCaseTargets();

  assert.equal(matrix.ok, true);
  assert.deepEqual(matrix.requiredKeys, REQUIRED_ABUSE_CASE_TARGET_KEYS);
  assert.deepEqual(matrix.missingKeys, []);
  assert.equal(matrix.targetCount, V6_ABUSE_CASE_TARGETS.length);
  assert.ok(matrix.targetKeys.includes('spam'));
  assert.ok(matrix.targetKeys.includes('harassment'));
  assert.ok(matrix.targetKeys.includes('impersonation'));
  assert.ok(matrix.targetKeys.includes('unauthorized_mutation'));
  assert.ok(matrix.targetKeys.includes('delegation_abuse'));
  assert.ok(matrix.targetKeys.includes('rollback_bypass'));
  assert.ok(matrix.targetKeys.includes('public_autonomous_agent_mutation'));
  assert.match(matrix.digest, /^sha256:[a-f0-9]{64}$/);
});

test('V6 abuse-case report records research evidence without enabling abuse controls', () => {
  const report = buildV6AbuseCaseTargetReport({
    observed: observedEvidence(),
    source: 'node_test'
  });

  assert.equal(report.version, V6_ABUSE_CASE_TARGETS_VERSION);
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
  assert.equal(report.enablesPublicAgentMutation, false);
  assert.equal(report.publishesPublicFreePlay, false);
  assert.equal(report.executionStatus, 'not_executable');
  assert.equal(report.targetMatrix.ok, true);
  assert.equal(report.observedEvidence.unauthorizedMutationProbeCount, 2);
  assert.equal(report.observedEvidence.publicAutonomousMutationProbeCount, 1);
  assert.equal(report.observedEvidence.playerVisibleAbuseSurfaceCount, 0);
  assert.deepEqual(report.releaseGaps, REQUIRED_ABUSE_CASE_RELEASE_GAPS);
  assert.deepEqual(assertV6AbuseCaseTargetReportSafe(report), { ok: true, errors: [] });
});

test('V6 abuse-case report fails closed for incomplete targets or missing current probes', () => {
  const incomplete = buildV6AbuseCaseTargetReport({
    targets: V6_ABUSE_CASE_TARGETS.filter((target) => target.key !== 'spam'),
    observed: observedEvidence()
  });
  assert.equal(incomplete.ok, false);
  assert.match(incomplete.errors.join(','), /V6_ABUSE_CASE_TARGET_MATRIX_INCOMPLETE/);
  assert.match(assertV6AbuseCaseTargetReportSafe(incomplete).errors.join(','), /V6_ABUSE_CASE_TARGET_ERRORS_PRESENT/);

  const missingProbes = buildV6AbuseCaseTargetReport();
  assert.equal(missingProbes.ok, false);
  assert.match(missingProbes.errors.join(','), /V6_ABUSE_CASE_SPAM_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_ABUSE_CASE_HARASSMENT_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_ABUSE_CASE_IMPERSONATION_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_ABUSE_CASE_UNAUTHORIZED_MUTATION_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_ABUSE_CASE_PUBLIC_AUTONOMOUS_MUTATION_PROBE_REQUIRED/);
});

test('V6 abuse-case assertion rejects fake release readiness public agents and private data', () => {
  const report = buildV6AbuseCaseTargetReport({
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
    enablesPublicAgentMutation: true,
    publishesPublicFreePlay: true,
    executionStatus: 'executes',
    releaseGaps: [],
    observedEvidence: {
      ...report.observedEvidence,
      privateDataExposureCount: 1,
      playerVisibleAbuseSurfaceCount: 1,
      appliesWorldState: true,
      mutatesWorldState: true,
      exposesPrivateData: true,
      enablesPublicAgentMutation: true,
      publishesPublicFreePlay: true
    }
  };
  const safety = assertV6AbuseCaseTargetReportSafe(unsafe);

  assert.equal(safety.ok, false);
  assert.match(safety.errors.join(','), /V6_ABUSE_CASE_TARGET_RESEARCH_ONLY_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_ABUSE_CASE_TARGET_RELEASE_READY_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_ABUSE_CASE_TARGET_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_ABUSE_CASE_TARGET_PLAYER_HIDDEN_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_ABUSE_CASE_TARGET_EXECUTION_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_ABUSE_CASE_TARGET_PRIVATE_DATA_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_ABUSE_CASE_TARGET_NON_EXECUTING_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_ABUSE_CASE_TARGET_RELEASE_GAPS_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_ABUSE_CASE_TARGET_EVIDENCE_SAFETY_REQUIRED/);
});
