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

test('V6 release review audit coverage requires governance preflight evidence', () => {
  const auditGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'audit_coverage');
  const validationGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'validation_evidence');

  assert.ok(auditGate.requiredArtifacts.includes('server/world_civilization/governance_preflight.js'));
  assert.ok(auditGate.requiredArtifacts.includes('tests/world_civilization_governance_preflight.test.js'));
  assert.ok(auditGate.requiredChecks.includes('governance_preflight'));
  assert.ok(validationGate.requiredArtifacts.includes('tests/world_civilization_governance_preflight.test.js'));
});

test('V6 release review audit coverage requires reputation moderation link evidence', () => {
  const auditGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'audit_coverage');
  const validationGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'validation_evidence');

  assert.ok(auditGate.requiredArtifacts.includes('server/world_civilization/reputation.js'));
  assert.ok(auditGate.requiredArtifacts.includes('server/world_civilization/moderation.js'));
  assert.ok(auditGate.requiredArtifacts.includes('tests/world_civilization_reputation.test.js'));
  assert.ok(auditGate.requiredArtifacts.includes('tests/world_civilization_moderation.test.js'));
  assert.ok(auditGate.requiredArtifacts.includes('tests/world_civilization_reputation_moderation_process_restart.test.js'));
  assert.ok(auditGate.requiredChecks.includes('reputation_moderation_links'));
  assert.ok(validationGate.requiredArtifacts.includes('tests/world_civilization_reputation.test.js'));
  assert.ok(validationGate.requiredArtifacts.includes('tests/world_civilization_moderation.test.js'));
});

test('V6 release review requires civic mutation security evidence for abuse review', () => {
  const abuseGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'abuse_case_review');
  const validationGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'validation_evidence');

  assert.ok(abuseGate.requiredArtifacts.includes('docs/security/V6_CIVIC_MUTATION_SECURITY_PLAN.md'));
  assert.ok(abuseGate.requiredArtifacts.includes('server/world_civilization/mutation_security.js'));
  assert.ok(abuseGate.requiredArtifacts.includes('tests/world_civilization_mutation_security.test.js'));
  assert.ok(abuseGate.requiredChecks.includes('unauthorized_mutation'));
  assert.ok(abuseGate.requiredChecks.includes('store_backed_delegation_proof'));
  assert.ok(abuseGate.requiredChecks.includes('delegation_scope_mismatch'));
  assert.ok(abuseGate.requiredChecks.includes('delegation_budget_read_only'));
  assert.ok(validationGate.requiredArtifacts.includes('tests/world_civilization_mutation_security.test.js'));
  assert.ok(validationGate.requiredChecks.includes('store_backed_delegation_proof'));
});

test('V6 release review blocks abuse signoff without delegated-agent proof evidence', () => {
  const evidence = Object.fromEntries(REQUIRED_REVIEW_GATES.map((gate) => [gate.key, completeEvidenceFor(gate)]));
  evidence.abuse_case_review = {
    ...evidence.abuse_case_review,
    checks: evidence.abuse_case_review.checks.filter((check) => (
      check !== 'store_backed_delegation_proof'
      && check !== 'delegation_scope_mismatch'
      && check !== 'delegation_budget_read_only'
    ))
  };
  const report = buildV6ReleaseReviewReport({
    includeResearchReview: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence
  });
  const abuseGate = report.gateReports.find((gate) => gate.key === 'abuse_case_review');

  assert.equal(report.releaseReady, false);
  assert.equal(abuseGate.ok, false);
  assert.deepEqual(abuseGate.missingChecks, [
    'store_backed_delegation_proof',
    'delegation_scope_mismatch',
    'delegation_budget_read_only'
  ]);
  assert.deepEqual(assertV6ReleaseReviewSafe(report), { ok: true, errors: [] });
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

test('V6 release review requires worker tool exposure evidence', () => {
  const workerGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'worker_tool_surface_review');
  const validationGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'validation_evidence');

  assert.equal(workerGate.owner, 'product_engineering');
  assert.ok(workerGate.requiredArtifacts.includes('specs/59_agent_town_v6_worker_tool_surface_draft.md'));
  assert.ok(workerGate.requiredArtifacts.includes('server/world_civilization/tools.js'));
  assert.ok(workerGate.requiredArtifacts.includes('server/world_civilization/tool_exposure_gate.js'));
  assert.ok(workerGate.requiredArtifacts.includes('tests/world_civilization_tool_exposure_gate.test.js'));
  assert.ok(workerGate.requiredArtifacts.includes('docs/internal-skill-testline.md'));
  assert.ok(workerGate.requiredChecks.includes('runtime_manifest_source_of_truth'));
  assert.ok(workerGate.requiredChecks.includes('openclaw_lite_worker_origin'));
  assert.ok(workerGate.requiredChecks.includes('worker_traffic_observability'));
  assert.ok(workerGate.requiredChecks.includes('skill_context_observability'));
  assert.ok(workerGate.requiredChecks.includes('mutation_security_envelope'));
  assert.ok(workerGate.requiredChecks.includes('no_backend_shortcuts'));
  assert.ok(validationGate.requiredArtifacts.includes('tests/world_civilization_mutation_security.test.js'));
});

test('V6 release review requires effect execution and rollback gate evidence', () => {
  const effectGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'effect_execution_review');
  const validationGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'validation_evidence');

  assert.equal(effectGate.owner, 'engineering_security');
  assert.ok(effectGate.requiredArtifacts.includes('specs/62_agent_town_v6_civic_effect_rollback_foundation.md'));
  assert.ok(effectGate.requiredArtifacts.includes('server/world_civilization/effects.js'));
  assert.ok(effectGate.requiredArtifacts.includes('server/world_civilization/rollback_recovery.js'));
  assert.ok(effectGate.requiredArtifacts.includes('tests/world_civilization_effects.test.js'));
  assert.ok(effectGate.requiredArtifacts.includes('tests/world_civilization_rollback_recovery.test.js'));
  assert.ok(effectGate.requiredChecks.includes('typed_apply_handlers'));
  assert.ok(effectGate.requiredChecks.includes('typed_rollback_handlers'));
  assert.ok(effectGate.requiredChecks.includes('real_before_after_state'));
  assert.ok(effectGate.requiredChecks.includes('irreversible_action_review'));
  assert.ok(effectGate.requiredChecks.includes('conservation_tests'));
  assert.ok(effectGate.requiredChecks.includes('applied_and_rollback_audit'));
  assert.ok(validationGate.requiredChecks.includes('effect_execution_gate'));
  assert.ok(validationGate.requiredArtifacts.includes('tests/world_civilization_effects.test.js'));
});

test('V6 release review blocks signoff without effect execution rollback evidence', () => {
  const evidence = Object.fromEntries(REQUIRED_REVIEW_GATES.map((gate) => [gate.key, completeEvidenceFor(gate)]));
  evidence.effect_execution_review = {
    ...evidence.effect_execution_review,
    checks: evidence.effect_execution_review.checks.filter((check) => (
      check !== 'typed_rollback_handlers'
      && check !== 'irreversible_action_review'
      && check !== 'conservation_tests'
    ))
  };
  const report = buildV6ReleaseReviewReport({
    includeResearchReview: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence
  });
  const effectGate = report.gateReports.find((gate) => gate.key === 'effect_execution_review');

  assert.equal(report.releaseReady, false);
  assert.equal(effectGate.ok, false);
  assert.deepEqual(effectGate.missingChecks, [
    'typed_rollback_handlers',
    'irreversible_action_review',
    'conservation_tests'
  ]);
  assert.deepEqual(assertV6ReleaseReviewSafe(report), { ok: true, errors: [] });
});

test('V6 release review requires agent participation route-edge enforcement evidence', () => {
  const agentGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'agent_participation_review');
  const validationGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'validation_evidence');

  assert.equal(agentGate.owner, 'engineering_security');
  assert.ok(agentGate.requiredArtifacts.includes('specs/63_agent_town_v6_agent_participation_delegation_foundation.md'));
  assert.ok(agentGate.requiredArtifacts.includes('server/world_civilization/delegations.js'));
  assert.ok(agentGate.requiredArtifacts.includes('server/world_civilization/governance_preflight.js'));
  assert.ok(agentGate.requiredArtifacts.includes('server/world_civilization/mutation_security.js'));
  assert.ok(agentGate.requiredArtifacts.includes('tests/world_civilization_delegations.test.js'));
  assert.ok(agentGate.requiredChecks.includes('worker_tool_scope_enforcement'));
  assert.ok(agentGate.requiredChecks.includes('route_edge_expiry_check'));
  assert.ok(agentGate.requiredChecks.includes('route_edge_budget_check'));
  assert.ok(agentGate.requiredChecks.includes('route_edge_revocation_check'));
  assert.ok(agentGate.requiredChecks.includes('principal_wallet_session_binding'));
  assert.ok(agentGate.requiredChecks.includes('no_public_autonomous_mutation'));
  assert.ok(validationGate.requiredChecks.includes('agent_participation_enforcement_gate'));
  assert.ok(validationGate.requiredArtifacts.includes('tests/world_civilization_delegations.test.js'));
  assert.ok(validationGate.requiredArtifacts.includes('tests/world_civilization_mutation_security.test.js'));
});

test('V6 release review blocks signoff without agent participation route-edge controls', () => {
  const evidence = Object.fromEntries(REQUIRED_REVIEW_GATES.map((gate) => [gate.key, completeEvidenceFor(gate)]));
  evidence.agent_participation_review = {
    ...evidence.agent_participation_review,
    checks: evidence.agent_participation_review.checks.filter((check) => (
      check !== 'route_edge_budget_check'
      && check !== 'route_edge_revocation_check'
      && check !== 'principal_wallet_session_binding'
    ))
  };
  const report = buildV6ReleaseReviewReport({
    includeResearchReview: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence
  });
  const agentGate = report.gateReports.find((gate) => gate.key === 'agent_participation_review');

  assert.equal(report.releaseReady, false);
  assert.equal(agentGate.ok, false);
  assert.deepEqual(agentGate.missingChecks, [
    'route_edge_budget_check',
    'route_edge_revocation_check',
    'principal_wallet_session_binding'
  ]);
  assert.deepEqual(assertV6ReleaseReviewSafe(report), { ok: true, errors: [] });
});

test('V6 release review requires civic institution readiness evidence', () => {
  const institutionGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'institution_readiness_review');
  const validationGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'validation_evidence');

  assert.equal(institutionGate.owner, 'engineering_security_product');
  assert.ok(institutionGate.requiredArtifacts.includes('specs/64_agent_town_v6_civic_institution_charter_foundation.md'));
  assert.ok(institutionGate.requiredArtifacts.includes('server/world_civilization/institutions.js'));
  assert.ok(institutionGate.requiredArtifacts.includes('server/world_civilization/delegations.js'));
  assert.ok(institutionGate.requiredArtifacts.includes('server/world_civilization/effects.js'));
  assert.ok(institutionGate.requiredArtifacts.includes('docs/security/PUBLIC_TEXT_RENDERING_POLICY.md'));
  assert.ok(institutionGate.requiredArtifacts.includes('tests/world_civilization_institutions.test.js'));
  assert.ok(institutionGate.requiredChecks.includes('charter_template_review'));
  assert.ok(institutionGate.requiredChecks.includes('membership_rule_review'));
  assert.ok(institutionGate.requiredChecks.includes('eligibility_rule_review'));
  assert.ok(institutionGate.requiredChecks.includes('voting_rule_review'));
  assert.ok(institutionGate.requiredChecks.includes('moderation_policy_review'));
  assert.ok(institutionGate.requiredChecks.includes('proposal_type_review'));
  assert.ok(institutionGate.requiredChecks.includes('public_text_rendering_review'));
  assert.ok(institutionGate.requiredChecks.includes('delegation_policy_link'));
  assert.ok(institutionGate.requiredChecks.includes('charter_change_execution_review'));
  assert.ok(institutionGate.requiredChecks.includes('charter_change_rollback_review'));
  assert.ok(institutionGate.requiredChecks.includes('private_data_exclusion'));
  assert.ok(institutionGate.requiredChecks.includes('institution_audit_rows'));
  assert.ok(institutionGate.requiredChecks.includes('no_player_visible_institutions'));
  assert.ok(institutionGate.requiredChecks.includes('no_world_mutation'));
  assert.ok(validationGate.requiredChecks.includes('institution_readiness_gate'));
  assert.ok(validationGate.requiredArtifacts.includes('tests/world_civilization_institutions.test.js'));
});

test('V6 release review blocks signoff without institution templates public text and rollback evidence', () => {
  const evidence = Object.fromEntries(REQUIRED_REVIEW_GATES.map((gate) => [gate.key, completeEvidenceFor(gate)]));
  evidence.institution_readiness_review = {
    ...evidence.institution_readiness_review,
    checks: evidence.institution_readiness_review.checks.filter((check) => (
      check !== 'charter_template_review'
      && check !== 'public_text_rendering_review'
      && check !== 'delegation_policy_link'
      && check !== 'charter_change_rollback_review'
    ))
  };
  const report = buildV6ReleaseReviewReport({
    includeResearchReview: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence
  });
  const institutionGate = report.gateReports.find((gate) => gate.key === 'institution_readiness_review');

  assert.equal(report.releaseReady, false);
  assert.equal(institutionGate.ok, false);
  assert.deepEqual(institutionGate.missingChecks, [
    'charter_template_review',
    'public_text_rendering_review',
    'delegation_policy_link',
    'charter_change_rollback_review'
  ]);
  assert.deepEqual(assertV6ReleaseReviewSafe(report), { ok: true, errors: [] });
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
