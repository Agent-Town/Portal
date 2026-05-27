const test = require('node:test');
const assert = require('node:assert/strict');

const { V6_WORLD_FEATURE_FLAG, parseWorldGridFeatureFlags } = require('../server/world_grid/feature_flags');
const {
  RELEASE_REVIEW_ARTIFACT,
  REQUIRED_REVIEW_GATES,
  assertV6ReleaseReviewSafe,
  buildV6ReleaseReviewReport
} = require('../server/world_civilization/release_review');

function completeEvidenceFor(gate) {
  return {
    status: 'complete',
    signoff: 'approved',
    artifacts: [...gate.requiredArtifacts],
    checks: [...gate.requiredChecks]
  };
}

test('V6 release review report is hidden without explicit research opt-in and V6 flag', () => {
  const withoutResearchOptIn = buildV6ReleaseReviewReport({
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true }
  });
  const broadV5Override = buildV6ReleaseReviewReport({
    includeResearchReview: true,
    featureFlags: parseWorldGridFeatureFlags('all')
  });

  for (const report of [withoutResearchOptIn, broadV5Override]) {
    assert.equal(report.available, false);
    assert.equal(report.runtimeExposed, false);
    assert.equal(report.playerVisible, false);
    assert.equal(report.normalGameplayExposure, false);
    assert.equal(report.releaseReady, false);
    assert.deepEqual(report.gateReports, []);
    assert.deepEqual(assertV6ReleaseReviewSafe(report), { ok: true, errors: [] });
  }
});

test('V6 release review baseline names every security and product gate but remains not ready', () => {
  const report = buildV6ReleaseReviewReport({
    includeResearchReview: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    source: 'node_test'
  });

  assert.equal(report.available, true);
  assert.equal(report.source, 'node_test');
  assert.equal(report.releaseReady, false);
  assert.deepEqual(report.gateReports.map((gate) => gate.key), REQUIRED_REVIEW_GATES.map((gate) => gate.key));
  for (const gate of report.gateReports) {
    assert.equal(gate.ok, false, gate.key);
    assert.equal(gate.status, 'missing', gate.key);
    assert.equal(gate.signoff, 'missing', gate.key);
    assert.equal(gate.signoffRequired, true, gate.key);
    assert.ok(gate.requiredArtifacts.includes(RELEASE_REVIEW_ARTIFACT), gate.key);
    assert.ok(gate.missingArtifacts.length > 0, gate.key);
    assert.ok(gate.missingChecks.length > 0, gate.key);
  }
  assert.deepEqual(assertV6ReleaseReviewSafe(report), { ok: true, errors: [] });
});

test('V6 release review audit coverage requires migration rehearsal evidence', () => {
  const auditGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'audit_coverage');

  assert.ok(auditGate.requiredArtifacts.includes('server/world_civilization/migration_rehearsal.js'));
  assert.ok(auditGate.requiredArtifacts.includes('tests/world_civilization_migration_rehearsal.test.js'));
  assert.ok(auditGate.requiredChecks.includes('migration_rehearsal'));
});

test('V6 release review requires civic mutation security evidence for abuse review', () => {
  const abuseGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'abuse_case_review');
  const validationGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'validation_evidence');

  assert.ok(abuseGate.requiredArtifacts.includes('docs/security/V6_CIVIC_MUTATION_SECURITY_PLAN.md'));
  assert.ok(abuseGate.requiredArtifacts.includes('server/world_civilization/mutation_security.js'));
  assert.ok(abuseGate.requiredArtifacts.includes('tests/world_civilization_mutation_security.test.js'));
  assert.ok(abuseGate.requiredChecks.includes('unauthorized_mutation'));
  assert.ok(validationGate.requiredArtifacts.includes('tests/world_civilization_mutation_security.test.js'));
});

test('V6 release review requires modal lab launch-surface evidence', () => {
  const labGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'modal_lab_surface_review');

  assert.equal(labGate.owner, 'product_engineering');
  assert.ok(labGate.requiredArtifacts.includes('specs/66_agent_town_v6_modal_lab_surface_foundation.md'));
  assert.ok(labGate.requiredArtifacts.includes('server/world_civilization/lab_surface.js'));
  assert.ok(labGate.requiredArtifacts.includes('tests/world_civilization_lab_surface.test.js'));
  assert.ok(labGate.requiredChecks.includes('town_hub_modal_launch'));
  assert.ok(labGate.requiredChecks.includes('standalone_route_denial'));
  assert.ok(labGate.requiredChecks.includes('worker_continuity'));
  assert.ok(labGate.requiredChecks.includes('debug_observability'));
  assert.ok(labGate.requiredChecks.includes('non_executing_panels'));
});

test('V6 release review report can only become ready with complete evidence and signoff', () => {
  const evidence = Object.fromEntries(REQUIRED_REVIEW_GATES.map((gate) => [gate.key, completeEvidenceFor(gate)]));
  const report = buildV6ReleaseReviewReport({
    includeResearchReview: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence
  });

  assert.equal(report.releaseReady, true);
  assert.equal(report.runtimeExposed, false);
  assert.equal(report.playerVisible, false);
  assert.equal(report.normalGameplayExposure, false);
  assert.deepEqual(report.gateReports.map((gate) => gate.ok), REQUIRED_REVIEW_GATES.map(() => true));
  assert.deepEqual(assertV6ReleaseReviewSafe(report), { ok: true, errors: [] });
});

test('V6 release review assertion fails closed for fake readiness or exposure drift', () => {
  const report = buildV6ReleaseReviewReport({
    includeResearchReview: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence: {
      threat_model: {
        status: 'complete',
        signoff: 'missing',
        artifacts: [RELEASE_REVIEW_ARTIFACT],
        checks: REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'threat_model').requiredChecks
      }
    }
  });
  const unsafe = {
    ...report,
    runtimeExposed: true,
    playerVisible: true,
    normalGameplayExposure: true,
    releaseReady: true,
    executionStatus: 'executes'
  };
  const result = assertV6ReleaseReviewSafe(unsafe);

  assert.equal(result.ok, false);
  assert.match(result.errors.join(','), /V6_RELEASE_REVIEW_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_RELEASE_REVIEW_PLAYER_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_RELEASE_REVIEW_NORMAL_GAMEPLAY_EXPOSURE_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_RELEASE_REVIEW_NON_EXECUTING_REQUIRED/);
  assert.match(result.errors.join(','), /V6_RELEASE_REVIEW_RELEASE_READY_WITH_FAILED_GATES/);
});
