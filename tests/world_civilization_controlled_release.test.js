const test = require('node:test');
const assert = require('node:assert/strict');

const { V6_WORLD_FEATURE_FLAG, parseWorldGridFeatureFlags } = require('../server/world_grid/feature_flags');
const {
  RELEASE_REVIEW_ARTIFACT,
  REQUIRED_REVIEW_GATES,
  buildV6ReleaseReviewReport
} = require('../server/world_civilization/release_review');
const {
  CONTROLLED_RELEASE_RUNBOOK,
  PRIOR_MILESTONE_KEYS,
  REQUIRED_CONTROLLED_RELEASE_GATES,
  V6_MILESTONE_PLAN_ARTIFACT,
  V6_READINESS_GATE_ARTIFACT,
  assertV6ControlledReleaseSafe,
  buildV6ControlledReleaseReport
} = require('../server/world_civilization/controlled_release');

function completeReviewEvidence() {
  return Object.fromEntries(REQUIRED_REVIEW_GATES.map((gate) => [gate.key, {
    status: 'complete',
    signoff: 'approved',
    artifacts: [...gate.requiredArtifacts],
    checks: [...gate.requiredChecks]
  }]));
}

function completeReleaseEvidence() {
  return Object.fromEntries(REQUIRED_CONTROLLED_RELEASE_GATES.map((gate) => [gate.key, {
    status: 'complete',
    signoff: 'approved',
    artifacts: [...gate.requiredArtifacts],
    checks: [...gate.requiredChecks]
  }]));
}

function allPriorMilestonesDone(overrides = {}) {
  return {
    ...Object.fromEntries(PRIOR_MILESTONE_KEYS.map((key) => [key, 'done'])),
    ...overrides
  };
}

function readyReleaseReviewReport() {
  return buildV6ReleaseReviewReport({
    includeResearchReview: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence: completeReviewEvidence()
  });
}

test('V6 controlled release report is hidden without explicit research opt-in and V6 flag', () => {
  const withoutResearchOptIn = buildV6ControlledReleaseReport({
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true }
  });
  const broadV5Override = buildV6ControlledReleaseReport({
    includeResearchRelease: true,
    featureFlags: parseWorldGridFeatureFlags('all')
  });

  for (const report of [withoutResearchOptIn, broadV5Override]) {
    assert.equal(report.available, false);
    assert.equal(report.runtimeExposed, false);
    assert.equal(report.playerVisible, false);
    assert.equal(report.normalGameplayExposure, false);
    assert.equal(report.productionEnabled, false);
    assert.equal(report.releaseReady, false);
    assert.deepEqual(report.priorMilestones, []);
    assert.deepEqual(report.gateReports, []);
    assert.deepEqual(assertV6ControlledReleaseSafe(report), { ok: true, errors: [] });
  }
});

test('V6 controlled release baseline names all launch controls but remains blocked by current evidence', () => {
  const report = buildV6ControlledReleaseReport({
    includeResearchRelease: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    source: 'node_test'
  });

  assert.equal(report.available, true);
  assert.equal(report.source, 'node_test');
  assert.equal(report.releaseReady, false);
  assert.equal(report.releaseReviewReady, false);
  assert.deepEqual(report.priorMilestones.map((entry) => entry.key), PRIOR_MILESTONE_KEYS);
  assert.deepEqual(report.gateReports.map((entry) => entry.key), REQUIRED_CONTROLLED_RELEASE_GATES.map((gate) => gate.key));
  assert.ok(report.priorMilestones.every((entry) => entry.ok === false));
  for (const gate of report.gateReports) {
    assert.equal(gate.ok, false, gate.key);
    assert.equal(gate.status, 'missing', gate.key);
    assert.equal(gate.signoff, 'missing', gate.key);
    assert.ok(gate.missingArtifacts.length > 0, gate.key);
    assert.ok(gate.missingChecks.length > 0, gate.key);
  }
  assert.deepEqual(assertV6ControlledReleaseSafe(report), { ok: true, errors: [] });
});

test('V6 controlled release can only become ready after prior milestones, release review, and controls close', () => {
  const review = readyReleaseReviewReport();
  const report = buildV6ControlledReleaseReport({
    includeResearchRelease: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    milestoneStatuses: allPriorMilestonesDone(),
    releaseReviewReport: review,
    evidence: completeReleaseEvidence()
  });

  assert.equal(review.releaseReady, true);
  assert.equal(report.releaseReady, true);
  assert.equal(report.runtimeExposed, false);
  assert.equal(report.playerVisible, false);
  assert.equal(report.normalGameplayExposure, false);
  assert.equal(report.productionEnabled, false);
  assert.deepEqual(report.priorMilestones.map((entry) => entry.ok), PRIOR_MILESTONE_KEYS.map(() => true));
  assert.deepEqual(report.gateReports.map((entry) => entry.ok), REQUIRED_CONTROLLED_RELEASE_GATES.map(() => true));
  assert.ok(report.gateReports.some((gate) => gate.requiredArtifacts.includes(CONTROLLED_RELEASE_RUNBOOK)));
  assert.ok(report.gateReports.some((gate) => gate.requiredArtifacts.includes(V6_READINESS_GATE_ARTIFACT)));
  assert.ok(report.gateReports.some((gate) => gate.requiredArtifacts.includes(V6_MILESTONE_PLAN_ARTIFACT)));
  assert.ok(REQUIRED_REVIEW_GATES.every((gate) => gate.requiredArtifacts.includes(RELEASE_REVIEW_ARTIFACT)));
  assert.deepEqual(assertV6ControlledReleaseSafe(report), { ok: true, errors: [] });
});

test('V6 controlled release assertion fails closed for fake readiness, exposure, or incomplete gates', () => {
  const report = buildV6ControlledReleaseReport({
    includeResearchRelease: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    milestoneStatuses: allPriorMilestonesDone({ M16: 'in_progress' }),
    releaseReviewReport: { releaseReady: false },
    evidence: {
      production_flag_safety: {
        status: 'complete',
        signoff: 'approved',
        artifacts: [CONTROLLED_RELEASE_RUNBOOK],
        checks: REQUIRED_CONTROLLED_RELEASE_GATES.find((gate) => gate.key === 'production_flag_safety').requiredChecks
      }
    }
  });
  const unsafe = {
    ...report,
    runtimeExposed: true,
    playerVisible: true,
    normalGameplayExposure: true,
    productionEnabled: true,
    releaseReady: true,
    executionStatus: 'executes'
  };
  const result = assertV6ControlledReleaseSafe(unsafe);

  assert.equal(result.ok, false);
  assert.match(result.errors.join(','), /V6_CONTROLLED_RELEASE_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_CONTROLLED_RELEASE_PLAYER_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_CONTROLLED_RELEASE_NORMAL_GAMEPLAY_EXPOSURE_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_CONTROLLED_RELEASE_PRODUCTION_ENABLEMENT_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_CONTROLLED_RELEASE_NON_EXECUTING_REQUIRED/);
  assert.match(result.errors.join(','), /V6_CONTROLLED_RELEASE_READY_WITH_INCOMPLETE_MILESTONES/);
  assert.match(result.errors.join(','), /V6_CONTROLLED_RELEASE_READY_WITHOUT_RELEASE_REVIEW/);
  assert.match(result.errors.join(','), /V6_CONTROLLED_RELEASE_READY_WITH_FAILED_GATES/);
});
