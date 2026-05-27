const test = require('node:test');
const assert = require('node:assert/strict');

const {
  REQUIRED_BLOCKER_EXCEPTION_REGISTER_GAPS,
  REQUIRED_BLOCKER_EXCEPTION_REGISTER_KEYS,
  V6_BLOCKER_EXCEPTION_REGISTER_REQUIREMENTS,
  V6_BLOCKER_EXCEPTION_REGISTER_VERSION,
  assertV6BlockerExceptionRegisterReportSafe,
  buildV6BlockerExceptionRegisterReport,
  inspectBlockerExceptionRegisterRequirements
} = require('../server/world_civilization/blocker_exception_register');

function signoffs(overrides = {}) {
  return {
    releaseManager: 'approved',
    security: 'approved',
    qa: 'approved',
    product: 'approved',
    securityDependencyReview: 'approved',
    controlledReleaseHandoff: 'approved',
    ...overrides
  };
}

function blockers(overrides = {}) {
  return [
    {
      id: 'v6-blocker-1',
      priority: 'P1',
      owner: 'qa',
      status: 'closed',
      decision: 'closed_before_release',
      summary: 'Release-candidate Playwright trace archive was missing.',
      targetGate: 'release_candidate_target_gate'
    },
    {
      id: 'v6-blocker-2',
      priority: 'P2',
      owner: 'support',
      status: 'accepted_exception',
      decision: 'accepted_non_release_exception',
      summary: 'Support runbook wording needs final handoff copy.',
      targetGate: 'support_runbook',
      mitigation: 'Release manager owns final copy before controlled release.'
    },
    ...(overrides.extraBlockers || [])
  ];
}

function exceptions(overrides = {}) {
  return [
    {
      id: 'v6-exception-1',
      blockerId: 'v6-blocker-2',
      owner: 'release_manager',
      approver: 'product_security',
      scope: 'controlled_release_packet_only',
      decision: 'accepted_non_release_exception',
      mitigation: 'Block expansion if support handoff is not approved before the go/no-go record.',
      expiresAt: '2026-12-31T00:00:00.000Z'
    },
    ...(overrides.extraExceptions || [])
  ];
}

test('V6 blocker exception register requirements name every release clearance control', () => {
  const matrix = inspectBlockerExceptionRegisterRequirements();

  assert.equal(matrix.ok, true);
  assert.deepEqual(matrix.requiredKeys, REQUIRED_BLOCKER_EXCEPTION_REGISTER_KEYS);
  assert.deepEqual(matrix.missingKeys, []);
  assert.equal(matrix.requirementCount, V6_BLOCKER_EXCEPTION_REGISTER_REQUIREMENTS.length);
  assert.ok(matrix.requirementKeys.includes('register_record'));
  assert.ok(matrix.requirementKeys.includes('p0_p1_clearance'));
  assert.ok(matrix.requirementKeys.includes('exception_expiry'));
  assert.ok(matrix.requirementKeys.includes('security_dependency_review'));
  assert.ok(matrix.requirementKeys.includes('qa_product_security_signoff'));
  assert.ok(matrix.requirementKeys.includes('controlled_release_handoff'));
  assert.ok(matrix.requirementKeys.includes('private_data_exclusion'));
  assert.match(matrix.digest, /^sha256:[a-f0-9]{64}$/);
});

test('V6 blocker exception register records clearance evidence without approving release', () => {
  const report = buildV6BlockerExceptionRegisterReport({
    blockers: blockers(),
    exceptions: exceptions(),
    signoffs: signoffs(),
    asOf: '2026-06-01T00:00:00.000Z',
    source: 'node_test'
  });

  assert.equal(report.version, V6_BLOCKER_EXCEPTION_REGISTER_VERSION);
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
  assert.equal(report.executesRelease, false);
  assert.equal(report.enablesProduction, false);
  assert.equal(report.executionStatus, 'not_executable');
  assert.equal(report.targetMatrix.ok, true);
  assert.equal(report.observedEvidence.closedP0P1BlockerCount, 1);
  assert.equal(report.observedEvidence.openP0P1BlockerCount, 0);
  assert.equal(report.observedEvidence.validExceptionCount, 1);
  assert.equal(report.observedEvidence.expiredExceptionCount, 0);
  assert.equal(report.observedEvidence.privateDataExposureCount, 0);
  assert.deepEqual(report.releaseGaps, REQUIRED_BLOCKER_EXCEPTION_REGISTER_GAPS);
  assert.deepEqual(assertV6BlockerExceptionRegisterReportSafe(report), { ok: true, errors: [] });
});

test('V6 blocker exception register fails closed for open blockers invalid exceptions or missing signoff', () => {
  const openP0 = buildV6BlockerExceptionRegisterReport({
    blockers: blockers({
      extraBlockers: [{
        id: 'v6-blocker-p0',
        priority: 'P0',
        owner: 'security',
        status: 'open',
        decision: 'block_release',
        summary: 'Provider disconnect invalidation signoff missing.',
        targetGate: 'session_auth_target_gate'
      }]
    }),
    exceptions: exceptions(),
    signoffs: signoffs(),
    asOf: '2026-06-01T00:00:00.000Z'
  });
  assert.equal(openP0.ok, false);
  assert.match(openP0.errors.join(','), /V6_BLOCKER_REGISTER_P0_P1_OPEN/);
  assert.match(assertV6BlockerExceptionRegisterReportSafe(openP0).errors.join(','), /V6_BLOCKER_REGISTER_ERRORS_PRESENT/);

  const invalidException = buildV6BlockerExceptionRegisterReport({
    blockers: blockers(),
    exceptions: exceptions({
      extraExceptions: [{
        id: 'v6-exception-expired',
        blockerId: 'v6-blocker-2',
        owner: 'release_manager',
        approver: 'qa',
        scope: 'release_packet',
        decision: 'accepted_non_release_exception',
        mitigation: 'Expired exception must not pass.',
        expiresAt: '2026-01-01T00:00:00.000Z'
      }, {
        id: 'v6-exception-unlinked',
        blockerId: 'missing-blocker',
        owner: 'release_manager',
        approver: 'qa',
        scope: 'release_packet',
        decision: 'accepted_non_release_exception',
        mitigation: 'Unlinked exception must not pass.',
        expiresAt: '2026-12-31T00:00:00.000Z'
      }]
    }),
    signoffs: signoffs(),
    asOf: '2026-06-01T00:00:00.000Z'
  });
  assert.equal(invalidException.ok, false);
  assert.match(invalidException.errors.join(','), /V6_BLOCKER_REGISTER_INCOMPLETE_EXCEPTION_ROWS/);
  assert.match(invalidException.errors.join(','), /V6_BLOCKER_REGISTER_EXPIRED_EXCEPTION/);
  assert.match(invalidException.errors.join(','), /V6_BLOCKER_REGISTER_UNLINKED_EXCEPTION/);

  const missingSignoff = buildV6BlockerExceptionRegisterReport({
    blockers: blockers(),
    exceptions: exceptions(),
    signoffs: signoffs({ securityDependencyReview: 'missing' }),
    asOf: '2026-06-01T00:00:00.000Z'
  });
  assert.equal(missingSignoff.ok, false);
  assert.match(missingSignoff.errors.join(','), /V6_BLOCKER_REGISTER_SECURITY_DEPENDENCY_REVIEW_REQUIRED/);
});

test('V6 blocker exception register assertion rejects fake release readiness exposure and execution', () => {
  const report = buildV6BlockerExceptionRegisterReport({
    blockers: blockers(),
    exceptions: exceptions(),
    signoffs: signoffs(),
    asOf: '2026-06-01T00:00:00.000Z'
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
    executesRelease: true,
    enablesProduction: true,
    executionStatus: 'executes',
    releaseGaps: [],
    observedEvidence: {
      ...report.observedEvidence,
      openP0P1BlockerCount: 1,
      privateDataExposureCount: 1,
      appliesWorldState: true,
      mutatesWorldState: true,
      exposesPrivateData: true,
      approvesRelease: true,
      enablesProduction: true,
      executesRelease: true,
      publishesRuntimeTools: true
    }
  };
  const safety = assertV6BlockerExceptionRegisterReportSafe(unsafe);

  assert.equal(safety.ok, false);
  assert.match(safety.errors.join(','), /V6_BLOCKER_REGISTER_RESEARCH_ONLY_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_BLOCKER_REGISTER_RELEASE_READY_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_BLOCKER_REGISTER_PRODUCTION_ENABLEMENT_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_BLOCKER_REGISTER_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_BLOCKER_REGISTER_NON_EXECUTING_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_BLOCKER_REGISTER_EXECUTION_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_BLOCKER_REGISTER_PRIVATE_DATA_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_BLOCKER_REGISTER_RELEASE_GAPS_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_BLOCKER_REGISTER_EVIDENCE_SAFETY_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_BLOCKER_REGISTER_P0_P1_CLEARANCE_REQUIRED/);
});
