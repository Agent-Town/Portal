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

test('V6 release review requires threat-model target gate evidence', () => {
  const threatModelGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'threat_model');
  const validationGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'validation_evidence');

  assert.equal(threatModelGate.owner, 'security');
  assert.ok(threatModelGate.requiredArtifacts.includes('server/world_civilization/threat_model_targets.js'));
  assert.ok(threatModelGate.requiredArtifacts.includes('tests/world_civilization_threat_model_targets.test.js'));
  assert.ok(threatModelGate.requiredChecks.includes('trust_boundaries'));
  assert.ok(threatModelGate.requiredChecks.includes('assets'));
  assert.ok(threatModelGate.requiredChecks.includes('attacker_capabilities'));
  assert.ok(threatModelGate.requiredChecks.includes('abuse_paths'));
  assert.ok(threatModelGate.requiredChecks.includes('mitigations'));
  assert.ok(threatModelGate.requiredChecks.includes('residual_risk_owners'));
  assert.ok(threatModelGate.requiredChecks.includes('worker_route_boundary'));
  assert.ok(threatModelGate.requiredChecks.includes('public_private_boundary'));
  assert.ok(threatModelGate.requiredChecks.includes('rollback_failure_modes'));
  assert.ok(threatModelGate.requiredChecks.includes('release_signoff_inputs'));
  assert.ok(threatModelGate.requiredChecks.includes('threat_model_target_gate'));
  assert.ok(validationGate.requiredArtifacts.includes('tests/world_civilization_threat_model_targets.test.js'));
  assert.ok(validationGate.requiredChecks.includes('threat_model_target_gate'));
});

test('V6 release review requires privacy review target gate evidence', () => {
  const privacyGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'privacy_review');
  const validationGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'validation_evidence');

  assert.equal(privacyGate.owner, 'security_product');
  assert.ok(privacyGate.requiredArtifacts.includes('server/world_civilization/privacy_review_targets.js'));
  assert.ok(privacyGate.requiredArtifacts.includes('tests/world_civilization_privacy_review_targets.test.js'));
  assert.ok(privacyGate.requiredChecks.includes('public_surface_data_minimization'));
  assert.ok(privacyGate.requiredChecks.includes('worker_observability_redaction'));
  assert.ok(privacyGate.requiredChecks.includes('public_text_rendering_xss'));
  assert.ok(privacyGate.requiredChecks.includes('modal_lab_private_data_exclusion'));
  assert.ok(privacyGate.requiredChecks.includes('audit_summary_minimization'));
  assert.ok(privacyGate.requiredChecks.includes('cross_account_boundary'));
  assert.ok(privacyGate.requiredChecks.includes('privacy_review_target_gate'));
  assert.ok(validationGate.requiredArtifacts.includes('tests/world_civilization_privacy_review_targets.test.js'));
  assert.ok(validationGate.requiredChecks.includes('privacy_review_target_gate'));
});

test('V6 release review requires data-retention target gate evidence', () => {
  const retentionGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'data_retention_policy');
  const validationGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'validation_evidence');

  assert.equal(retentionGate.owner, 'security_product');
  assert.ok(retentionGate.requiredArtifacts.includes('server/world_civilization/data_retention_targets.js'));
  assert.ok(retentionGate.requiredArtifacts.includes('tests/world_civilization_data_retention_targets.test.js'));
  assert.ok(retentionGate.requiredChecks.includes('data_retention_target_gate'));
  assert.ok(retentionGate.requiredChecks.includes('private_credential_exclusion'));
  assert.ok(retentionGate.requiredChecks.includes('backup_retention_expiry_target'));
  assert.ok(retentionGate.requiredChecks.includes('retention_aware_replay_target'));
  assert.ok(validationGate.requiredArtifacts.includes('tests/world_civilization_data_retention_targets.test.js'));
  assert.ok(validationGate.requiredChecks.includes('data_retention_target_gate'));
});

test('V6 release review requires product signoff target gate evidence', () => {
  const productGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'product_signoff');
  const validationGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'validation_evidence');

  assert.equal(productGate.owner, 'product');
  assert.ok(productGate.requiredArtifacts.includes('docs/ops/V6_AGENT_CIVILIZATION_CONTROLLED_RELEASE_RUNBOOK.md'));
  assert.ok(productGate.requiredArtifacts.includes('server/world_civilization/blocker_exception_register.js'));
  assert.ok(productGate.requiredArtifacts.includes('server/world_civilization/product_signoff_targets.js'));
  assert.ok(productGate.requiredArtifacts.includes('server/world_civilization/release_evidence_manifest.js'));
  assert.ok(productGate.requiredArtifacts.includes('server/world_civilization/release_observability.js'));
  assert.ok(productGate.requiredArtifacts.includes('server/world_civilization/release_operations.js'));
  assert.ok(productGate.requiredArtifacts.includes('server/world_civilization/release_signoff_packet.js'));
  assert.ok(productGate.requiredArtifacts.includes('server/world_civilization/release_support.js'));
  assert.ok(productGate.requiredArtifacts.includes('tests/world_civilization_blocker_exception_register.test.js'));
  assert.ok(productGate.requiredArtifacts.includes('tests/world_civilization_product_signoff_targets.test.js'));
  assert.ok(productGate.requiredArtifacts.includes('tests/world_civilization_release_evidence_manifest.test.js'));
  assert.ok(productGate.requiredArtifacts.includes('tests/world_civilization_release_observability.test.js'));
  assert.ok(productGate.requiredArtifacts.includes('tests/world_civilization_release_operations.test.js'));
  assert.ok(productGate.requiredArtifacts.includes('tests/world_civilization_release_signoff_packet.test.js'));
  assert.ok(productGate.requiredArtifacts.includes('tests/world_civilization_release_support.test.js'));
  assert.ok(productGate.requiredChecks.includes('player_visible_scope'));
  assert.ok(productGate.requiredChecks.includes('normal_gameplay_exposure_denial'));
  assert.ok(productGate.requiredChecks.includes('product_owner_approval'));
  assert.ok(productGate.requiredChecks.includes('qa_release_evidence'));
  assert.ok(productGate.requiredChecks.includes('security_release_evidence'));
  assert.ok(productGate.requiredChecks.includes('release_evidence_manifest'));
  assert.ok(productGate.requiredChecks.includes('release_signoff_packet'));
  assert.ok(productGate.requiredChecks.includes('qa_owner_signoff'));
  assert.ok(productGate.requiredChecks.includes('security_owner_signoff'));
  assert.ok(productGate.requiredChecks.includes('privacy_owner_signoff'));
  assert.ok(productGate.requiredChecks.includes('support_owner_signoff'));
  assert.ok(productGate.requiredChecks.includes('release_manager_approval'));
  assert.ok(productGate.requiredChecks.includes('engineering_owner_approval'));
  assert.ok(productGate.requiredChecks.includes('rollback_plan'));
  assert.ok(productGate.requiredChecks.includes('disable_plan'));
  assert.ok(productGate.requiredChecks.includes('support_runbook'));
  assert.ok(productGate.requiredChecks.includes('release_support_runbook'));
  assert.ok(productGate.requiredChecks.includes('user_comms_plan'));
  assert.ok(productGate.requiredChecks.includes('observability_handoff'));
  assert.ok(productGate.requiredChecks.includes('release_observability_handoff'));
  assert.ok(productGate.requiredChecks.includes('release_operations_gate'));
  assert.ok(productGate.requiredChecks.includes('operations_handoff_acceptance'));
  assert.ok(productGate.requiredChecks.includes('observability_handoff_acceptance'));
  assert.ok(productGate.requiredChecks.includes('support_runbook_acceptance'));
  assert.ok(productGate.requiredChecks.includes('blocker_exception_register'));
  assert.ok(productGate.requiredChecks.includes('blocker_register_acceptance'));
  assert.ok(productGate.requiredChecks.includes('release_candidate_packet_acceptance'));
  assert.ok(productGate.requiredChecks.includes('go_no_go_record'));
  assert.ok(productGate.requiredChecks.includes('post_release_monitoring'));
  assert.ok(productGate.requiredChecks.includes('product_signoff_target_gate'));
  assert.ok(validationGate.requiredArtifacts.includes('tests/world_civilization_product_signoff_targets.test.js'));
  assert.ok(validationGate.requiredArtifacts.includes('tests/world_civilization_release_evidence_manifest.test.js'));
  assert.ok(validationGate.requiredArtifacts.includes('tests/world_civilization_release_signoff_packet.test.js'));
  assert.ok(validationGate.requiredArtifacts.includes('tests/world_civilization_blocker_exception_register.test.js'));
  assert.ok(validationGate.requiredChecks.includes('blocker_exception_register'));
  assert.ok(validationGate.requiredChecks.includes('release_evidence_manifest'));
  assert.ok(validationGate.requiredChecks.includes('release_signoff_packet'));
  assert.ok(validationGate.requiredChecks.includes('product_signoff_target_gate'));
});

test('V6 release review requires validation target gate evidence', () => {
  const validationGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'validation_evidence');

  assert.equal(validationGate.owner, 'qa_engineering');
  assert.ok(validationGate.requiredArtifacts.includes('server/world_civilization/validation_targets.js'));
  assert.ok(validationGate.requiredArtifacts.includes('tests/world_civilization_validation_targets.test.js'));
  assert.ok(validationGate.requiredChecks.includes('targeted_node_suite'));
  assert.ok(validationGate.requiredChecks.includes('split_playwright_smokes'));
  assert.ok(validationGate.requiredChecks.includes('all_features_regression'));
  assert.ok(validationGate.requiredChecks.includes('feature_override_safety'));
  assert.ok(validationGate.requiredArtifacts.includes('server/world_civilization/blocker_exception_register.js'));
  assert.ok(validationGate.requiredArtifacts.includes('tests/world_civilization_blocker_exception_register.test.js'));
  assert.ok(validationGate.requiredChecks.includes('blocker_exception_register'));
  assert.ok(validationGate.requiredChecks.includes('validation_target_gate'));
  assert.ok(validationGate.requiredChecks.includes('abuse_case_target_gate'));
  assert.ok(validationGate.requiredChecks.includes('product_signoff_target_gate'));
  assert.ok(validationGate.requiredChecks.includes('threat_model_target_gate'));
  assert.ok(validationGate.requiredChecks.includes('privacy_review_target_gate'));
  assert.ok(validationGate.requiredChecks.includes('data_retention_target_gate'));
  assert.ok(validationGate.requiredChecks.includes('session_auth_target_gate'));
  assert.ok(validationGate.requiredChecks.includes('worker_runtime_registration_target'));
  assert.ok(validationGate.requiredChecks.includes('lab_readiness_gate'));
  assert.ok(validationGate.requiredChecks.includes('resilience_readiness_gate'));
  assert.ok(validationGate.requiredArtifacts.includes('e2e/247_v6_production_override_browser_smoke.spec.js'));
});

test('V6 release review requires CI validation matrix target gate evidence', () => {
  const validationGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'validation_evidence');

  assert.equal(validationGate.owner, 'qa_engineering');
  assert.ok(validationGate.requiredArtifacts.includes('server/world_civilization/ci_validation_matrix_targets.js'));
  assert.ok(validationGate.requiredArtifacts.includes('tests/world_civilization_ci_validation_matrix_targets.test.js'));
  assert.ok(validationGate.requiredChecks.includes('targeted_node_suite'));
  assert.ok(validationGate.requiredChecks.includes('split_playwright_smokes'));
  assert.ok(validationGate.requiredChecks.includes('all_features_regression'));
  assert.ok(validationGate.requiredChecks.includes('feature_override_safety'));
  assert.ok(validationGate.requiredChecks.includes('ci_validation_matrix_gate'));
  assert.ok(validationGate.requiredChecks.includes('validation_target_gate'));
  assert.ok(validationGate.requiredChecks.includes('worker_runtime_registration_target'));
  assert.ok(validationGate.requiredChecks.includes('lab_readiness_gate'));
  assert.ok(validationGate.requiredChecks.includes('resilience_readiness_gate'));
});

test('V6 release review requires release-candidate target gate evidence', () => {
  const validationGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'validation_evidence');

  assert.equal(validationGate.owner, 'qa_engineering');
  assert.ok(validationGate.requiredArtifacts.includes('server/world_civilization/release_candidate_targets.js'));
  assert.ok(validationGate.requiredArtifacts.includes('tests/world_civilization_release_candidate_targets.test.js'));
  assert.ok(validationGate.requiredChecks.includes('targeted_node_suite'));
  assert.ok(validationGate.requiredChecks.includes('split_playwright_smokes'));
  assert.ok(validationGate.requiredChecks.includes('all_features_regression'));
  assert.ok(validationGate.requiredChecks.includes('feature_override_safety'));
  assert.ok(validationGate.requiredChecks.includes('ci_validation_matrix_gate'));
  assert.ok(validationGate.requiredChecks.includes('release_candidate_target_gate'));
  assert.ok(validationGate.requiredChecks.includes('validation_target_gate'));
  assert.ok(validationGate.requiredChecks.includes('worker_runtime_registration_target'));
  assert.ok(validationGate.requiredChecks.includes('lab_readiness_gate'));
  assert.ok(validationGate.requiredChecks.includes('resilience_readiness_gate'));
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

test('V6 release review requires reputation eligibility advice gate evidence', () => {
  const reputationGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'reputation_eligibility_advice_review');
  const validationGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'validation_evidence');

  assert.equal(reputationGate.owner, 'trust_safety_privacy_product');
  assert.ok(reputationGate.requiredArtifacts.includes('specs/60_agent_town_v6_reputation_accountability_foundation.md'));
  assert.ok(reputationGate.requiredArtifacts.includes('server/world_civilization/reputation.js'));
  assert.ok(reputationGate.requiredArtifacts.includes('server/world_civilization/moderation.js'));
  assert.ok(reputationGate.requiredArtifacts.includes('docs/security/PUBLIC_TEXT_RENDERING_POLICY.md'));
  assert.ok(reputationGate.requiredArtifacts.includes('tests/world_civilization_reputation.test.js'));
  assert.ok(reputationGate.requiredChecks.includes('eligibility_policy_review'));
  assert.ok(reputationGate.requiredChecks.includes('advice_policy_review'));
  assert.ok(reputationGate.requiredChecks.includes('source_policy_coverage'));
  assert.ok(reputationGate.requiredChecks.includes('moderation_dispute_link'));
  assert.ok(reputationGate.requiredChecks.includes('privacy_product_review'));
  assert.ok(reputationGate.requiredChecks.includes('public_text_rendering_review'));
  assert.ok(reputationGate.requiredChecks.includes('no_score_mutation'));
  assert.ok(reputationGate.requiredChecks.includes('no_world_mutation'));
  assert.ok(validationGate.requiredChecks.includes('reputation_eligibility_advice_gate'));
});

test('V6 release review requires moderation privacy readiness gate evidence', () => {
  const moderationGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'moderation_privacy_readiness_review');
  const validationGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'validation_evidence');

  assert.equal(moderationGate.owner, 'trust_safety_privacy_product');
  assert.ok(moderationGate.requiredArtifacts.includes('specs/61_agent_town_v6_moderation_privacy_foundation.md'));
  assert.ok(moderationGate.requiredArtifacts.includes('server/world_civilization/moderation.js'));
  assert.ok(moderationGate.requiredArtifacts.includes('docs/security/PUBLIC_TEXT_RENDERING_POLICY.md'));
  assert.ok(moderationGate.requiredArtifacts.includes('docs/product/PUBLIC_PRESENCE_PRIVACY_MODEL_V5.md'));
  assert.ok(moderationGate.requiredArtifacts.includes('tests/world_civilization_moderation.test.js'));
  assert.ok(moderationGate.requiredChecks.includes('proposal_text_policy'));
  assert.ok(moderationGate.requiredChecks.includes('agent_authored_content_policy'));
  assert.ok(moderationGate.requiredChecks.includes('attached_media_policy'));
  assert.ok(moderationGate.requiredChecks.includes('surface_policy_coverage'));
  assert.ok(moderationGate.requiredChecks.includes('abuse_report_triage'));
  assert.ok(moderationGate.requiredChecks.includes('appeal_operations'));
  assert.ok(moderationGate.requiredChecks.includes('human_review_tooling_plan'));
  assert.ok(moderationGate.requiredChecks.includes('redaction_policy_review'));
  assert.ok(moderationGate.requiredChecks.includes('public_presence_privacy_review'));
  assert.ok(moderationGate.requiredChecks.includes('no_moderation_effect_application'));
  assert.ok(moderationGate.requiredChecks.includes('no_world_mutation'));
  assert.ok(validationGate.requiredChecks.includes('moderation_privacy_readiness_gate'));
});

test('V6 release review audit coverage requires store-specific audit-summary evidence', () => {
  const auditGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'audit_coverage');
  const resilienceGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'resilience_readiness_review');

  assert.ok(auditGate.requiredArtifacts.includes('server/world_civilization/resilience.js'));
  assert.ok(auditGate.requiredArtifacts.includes('server/world_civilization/replay_reconstruction.js'));
  assert.ok(auditGate.requiredChecks.includes('store_specific_audit_summary_coverage'));
  assert.ok(resilienceGate.requiredChecks.includes('store_specific_zero_hash_only_fallbacks'));
});

test('V6 release review requires civic mutation security evidence for abuse review', () => {
  const abuseGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'abuse_case_review');
  const validationGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'validation_evidence');

  assert.ok(abuseGate.requiredArtifacts.includes('docs/security/V6_CIVIC_MUTATION_SECURITY_PLAN.md'));
  assert.ok(abuseGate.requiredArtifacts.includes('server/world_civilization/abuse_case_targets.js'));
  assert.ok(abuseGate.requiredArtifacts.includes('server/world_civilization/mutation_security.js'));
  assert.ok(abuseGate.requiredArtifacts.includes('server/world_civilization/session_auth_targets.js'));
  assert.ok(abuseGate.requiredArtifacts.includes('server/world_grid/rate_limit_rollout.js'));
  assert.ok(abuseGate.requiredArtifacts.includes('tests/world_civilization_abuse_case_targets.test.js'));
  assert.ok(abuseGate.requiredArtifacts.includes('tests/world_civilization_session_auth_targets.test.js'));
  assert.ok(abuseGate.requiredArtifacts.includes('tests/world_civilization_mutation_security.test.js'));
  assert.ok(abuseGate.requiredArtifacts.includes('tests/world_grid_rate_limit_rollout.test.js'));
  assert.ok(abuseGate.requiredChecks.includes('spam'));
  assert.ok(abuseGate.requiredChecks.includes('harassment'));
  assert.ok(abuseGate.requiredChecks.includes('impersonation'));
  assert.ok(abuseGate.requiredChecks.includes('unauthorized_mutation'));
  assert.ok(abuseGate.requiredChecks.includes('delegation_abuse'));
  assert.ok(abuseGate.requiredChecks.includes('store_backed_delegation_proof'));
  assert.ok(abuseGate.requiredChecks.includes('delegation_scope_mismatch'));
  assert.ok(abuseGate.requiredChecks.includes('delegation_budget_read_only'));
  assert.ok(abuseGate.requiredChecks.includes('delegation_budget_abuse'));
  assert.ok(abuseGate.requiredChecks.includes('vote_reputation_farming'));
  assert.ok(abuseGate.requiredChecks.includes('public_works_spend_abuse'));
  assert.ok(abuseGate.requiredChecks.includes('session_auth_target_gate'));
  assert.ok(abuseGate.requiredChecks.includes('provider_disconnect_invalidation_target'));
  assert.ok(abuseGate.requiredChecks.includes('production_browser_session_coverage_target'));
  assert.ok(abuseGate.requiredChecks.includes('trusted_proxy_risk_signal_rollout_target'));
  assert.ok(abuseGate.requiredChecks.includes('moderation_escalation'));
  assert.ok(abuseGate.requiredChecks.includes('rollback_bypass'));
  assert.ok(abuseGate.requiredChecks.includes('public_autonomous_agent_mutation'));
  assert.ok(abuseGate.requiredChecks.includes('abuse_case_target_gate'));
  assert.ok(validationGate.requiredArtifacts.includes('tests/world_civilization_abuse_case_targets.test.js'));
  assert.ok(validationGate.requiredArtifacts.includes('tests/world_civilization_mutation_security.test.js'));
  assert.ok(validationGate.requiredArtifacts.includes('tests/world_civilization_session_auth_targets.test.js'));
  assert.ok(validationGate.requiredArtifacts.includes('tests/world_grid_rate_limit_rollout.test.js'));
  assert.ok(validationGate.requiredChecks.includes('abuse_case_target_gate'));
  assert.ok(validationGate.requiredChecks.includes('session_auth_target_gate'));
  assert.ok(validationGate.requiredChecks.includes('trusted_proxy_risk_signal_rollout_target'));
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
  const validationGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'validation_evidence');

  assert.equal(labGate.owner, 'product_engineering');
  assert.ok(labGate.requiredArtifacts.includes('specs/66_agent_town_v6_modal_lab_surface_foundation.md'));
  assert.ok(labGate.requiredArtifacts.includes('server/world_civilization/lab_surface.js'));
  assert.ok(labGate.requiredArtifacts.includes('tests/world_civilization_lab_surface.test.js'));
  assert.ok(labGate.requiredArtifacts.includes('e2e/247_v6_production_override_browser_smoke.spec.js'));
  assert.ok(labGate.requiredChecks.includes('town_hub_modal_launch'));
  assert.ok(labGate.requiredChecks.includes('standalone_route_denial'));
  assert.ok(labGate.requiredChecks.includes('worker_continuity'));
  assert.ok(labGate.requiredChecks.includes('debug_observability'));
  assert.ok(labGate.requiredChecks.includes('non_executing_panels'));
  assert.ok(labGate.requiredChecks.includes('browser_visual_390'));
  assert.ok(labGate.requiredChecks.includes('browser_visual_768'));
  assert.ok(labGate.requiredChecks.includes('browser_visual_1280'));
  assert.ok(labGate.requiredChecks.includes('keyboard_accessibility'));
  assert.ok(labGate.requiredChecks.includes('focus_trap_review'));
  assert.ok(labGate.requiredChecks.includes('runtime_tool_absence'));
  assert.ok(labGate.requiredChecks.includes('normal_gameplay_exposure_denial'));
  assert.ok(labGate.requiredChecks.includes('private_debug_data_exclusion'));
  assert.ok(validationGate.requiredChecks.includes('lab_readiness_gate'));
  assert.ok(validationGate.requiredArtifacts.includes('tests/world_civilization_lab_surface.test.js'));
});

test('V6 release review blocks signoff without lab visual accessibility and runtime absence evidence', () => {
  const evidence = Object.fromEntries(REQUIRED_REVIEW_GATES.map((gate) => [gate.key, completeEvidenceFor(gate)]));
  evidence.modal_lab_surface_review = {
    ...evidence.modal_lab_surface_review,
    checks: evidence.modal_lab_surface_review.checks.filter((check) => (
      check !== 'browser_visual_768'
      && check !== 'keyboard_accessibility'
      && check !== 'runtime_tool_absence'
      && check !== 'normal_gameplay_exposure_denial'
    ))
  };
  const report = buildV6ReleaseReviewReport({
    includeResearchReview: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence
  });
  const labGate = report.gateReports.find((gate) => gate.key === 'modal_lab_surface_review');

  assert.equal(report.releaseReady, false);
  assert.equal(labGate.ok, false);
  assert.deepEqual(labGate.missingChecks, [
    'browser_visual_768',
    'keyboard_accessibility',
    'runtime_tool_absence',
    'normal_gameplay_exposure_denial'
  ]);
  assert.deepEqual(assertV6ReleaseReviewSafe(report), { ok: true, errors: [] });
});

test('V6 release review requires persistence replay resilience readiness evidence', () => {
  const resilienceGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'resilience_readiness_review');
  const validationGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'validation_evidence');

  assert.equal(resilienceGate.owner, 'engineering_security');
  assert.ok(resilienceGate.requiredArtifacts.includes('specs/67_agent_town_v6_persistence_replay_resilience_foundation.md'));
  assert.ok(resilienceGate.requiredArtifacts.includes('server/world_civilization/resilience.js'));
  assert.ok(resilienceGate.requiredArtifacts.includes('server/world_civilization/replay_reconstruction.js'));
  assert.ok(resilienceGate.requiredArtifacts.includes('server/world_civilization/load_rate_targets.js'));
  assert.ok(resilienceGate.requiredArtifacts.includes('server/world_civilization/migration_rehearsal.js'));
  assert.ok(resilienceGate.requiredArtifacts.includes('server/world_civilization/migration_load_replay.js'));
  assert.ok(resilienceGate.requiredArtifacts.includes('server/world_civilization/backup_restore.js'));
  assert.ok(resilienceGate.requiredArtifacts.includes('server/world_civilization/write_contention.js'));
  assert.ok(resilienceGate.requiredArtifacts.includes('server/world_civilization/rollback_execution_targets.js'));
  assert.ok(resilienceGate.requiredArtifacts.includes('server/world_civilization/rollback_recovery.js'));
  assert.ok(resilienceGate.requiredArtifacts.includes('tests/world_civilization_resilience.test.js'));
  assert.ok(resilienceGate.requiredArtifacts.includes('tests/world_civilization_load_rate_targets.test.js'));
  assert.ok(resilienceGate.requiredArtifacts.includes('tests/world_civilization_migration_load_replay.test.js'));
  assert.ok(resilienceGate.requiredArtifacts.includes('tests/world_civilization_backup_restore.test.js'));
  assert.ok(resilienceGate.requiredArtifacts.includes('tests/world_civilization_write_contention.test.js'));
  assert.ok(resilienceGate.requiredArtifacts.includes('tests/world_civilization_rollback_execution_targets.test.js'));
  assert.ok(resilienceGate.requiredChecks.includes('all_civic_store_restart_probes'));
  assert.ok(resilienceGate.requiredChecks.includes('audit_replay_reconstruction'));
  assert.ok(resilienceGate.requiredChecks.includes('privacy_safe_replay_summaries'));
  assert.ok(resilienceGate.requiredChecks.includes('store_specific_zero_hash_only_fallbacks'));
  assert.ok(resilienceGate.requiredChecks.includes('hash_chain_integrity'));
  assert.ok(resilienceGate.requiredChecks.includes('migration_upgrade_scripts'));
  assert.ok(resilienceGate.requiredChecks.includes('migration_downgrade_scripts'));
  assert.ok(resilienceGate.requiredChecks.includes('backup_restore_rehearsal'));
  assert.ok(resilienceGate.requiredChecks.includes('production_load_rate_targets'));
  assert.ok(resilienceGate.requiredChecks.includes('multi_process_write_contention'));
  assert.ok(resilienceGate.requiredChecks.includes('typed_rollback_execution_recovery'));
  assert.ok(resilienceGate.requiredChecks.includes('private_data_exclusion'));
  assert.ok(resilienceGate.requiredChecks.includes('no_effect_application_during_replay'));
  assert.ok(validationGate.requiredChecks.includes('resilience_readiness_gate'));
  assert.ok(validationGate.requiredArtifacts.includes('tests/world_civilization_resilience.test.js'));
});

test('V6 release review blocks signoff without migration load rollback and backup evidence', () => {
  const evidence = Object.fromEntries(REQUIRED_REVIEW_GATES.map((gate) => [gate.key, completeEvidenceFor(gate)]));
  evidence.resilience_readiness_review = {
    ...evidence.resilience_readiness_review,
    checks: evidence.resilience_readiness_review.checks.filter((check) => (
      check !== 'migration_upgrade_scripts'
      && check !== 'store_specific_zero_hash_only_fallbacks'
      && check !== 'migration_load_replay_rehearsal'
      && check !== 'production_load_rate_targets'
      && check !== 'multi_process_write_contention'
      && check !== 'typed_rollback_execution_recovery'
      && check !== 'backup_restore_rehearsal'
    ))
  };
  const report = buildV6ReleaseReviewReport({
    includeResearchReview: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence
  });
  const resilienceGate = report.gateReports.find((gate) => gate.key === 'resilience_readiness_review');

  assert.equal(report.releaseReady, false);
  assert.equal(resilienceGate.ok, false);
  assert.deepEqual(resilienceGate.missingChecks, [
    'store_specific_zero_hash_only_fallbacks',
    'migration_upgrade_scripts',
    'backup_restore_rehearsal',
    'migration_load_replay_rehearsal',
    'production_load_rate_targets',
    'multi_process_write_contention',
    'typed_rollback_execution_recovery'
  ]);
  assert.deepEqual(assertV6ReleaseReviewSafe(report), { ok: true, errors: [] });
});

test('V6 release review requires worker tool exposure evidence', () => {
  const workerGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'worker_tool_surface_review');
  const validationGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'validation_evidence');

  assert.equal(workerGate.owner, 'product_engineering');
  assert.ok(workerGate.requiredArtifacts.includes('specs/59_agent_town_v6_worker_tool_surface_draft.md'));
  assert.ok(workerGate.requiredArtifacts.includes('server/world_civilization/tools.js'));
  assert.ok(workerGate.requiredArtifacts.includes('server/world_civilization/tool_exposure_gate.js'));
  assert.ok(workerGate.requiredArtifacts.includes('server/world_civilization/worker_runtime_registration.js'));
  assert.ok(workerGate.requiredArtifacts.includes('server/world_civilization/worker_tool_adapter.js'));
  assert.ok(workerGate.requiredArtifacts.includes('server/world_civilization/worker_vote_adapter.js'));
  assert.ok(workerGate.requiredArtifacts.includes('tests/world_civilization_tool_exposure_gate.test.js'));
  assert.ok(workerGate.requiredArtifacts.includes('tests/world_civilization_worker_runtime_registration.test.js'));
  assert.ok(workerGate.requiredArtifacts.includes('tests/world_civilization_worker_tool_adapter.test.js'));
  assert.ok(workerGate.requiredArtifacts.includes('tests/world_civilization_worker_vote_adapter.test.js'));
  assert.ok(workerGate.requiredArtifacts.includes('e2e/246_v6_worker_runtime_registration_smoke.spec.js'));
  assert.ok(workerGate.requiredArtifacts.includes('e2e/247_v6_production_override_browser_smoke.spec.js'));
  assert.ok(workerGate.requiredArtifacts.includes('e2e/248_v6_production_worker_runtime_smoke.spec.js'));
  assert.ok(workerGate.requiredArtifacts.includes('docs/internal-skill-testline.md'));
  assert.ok(workerGate.requiredChecks.includes('runtime_manifest_source_of_truth'));
  assert.ok(workerGate.requiredChecks.includes('openclaw_lite_worker_origin'));
  assert.ok(workerGate.requiredChecks.includes('worker_traffic_observability'));
  assert.ok(workerGate.requiredChecks.includes('skill_context_observability'));
  assert.ok(workerGate.requiredChecks.includes('browser_worker_runtime_registration_target'));
  assert.ok(workerGate.requiredChecks.includes('production_browser_worker_coverage_target'));
  assert.ok(workerGate.requiredChecks.includes('mutation_security_envelope'));
  assert.ok(workerGate.requiredChecks.includes('worker_vote_receipt_adapter'));
  assert.ok(workerGate.requiredChecks.includes('no_backend_shortcuts'));
  assert.ok(validationGate.requiredArtifacts.includes('tests/world_civilization_worker_vote_adapter.test.js'));
  assert.ok(validationGate.requiredArtifacts.includes('tests/world_civilization_worker_runtime_registration.test.js'));
  assert.ok(validationGate.requiredArtifacts.includes('e2e/246_v6_worker_runtime_registration_smoke.spec.js'));
  assert.ok(validationGate.requiredArtifacts.includes('e2e/247_v6_production_override_browser_smoke.spec.js'));
  assert.ok(validationGate.requiredArtifacts.includes('e2e/248_v6_production_worker_runtime_smoke.spec.js'));
  assert.ok(validationGate.requiredArtifacts.includes('tests/world_civilization_mutation_security.test.js'));
  assert.ok(validationGate.requiredChecks.includes('worker_vote_adapter_gate'));
  assert.ok(validationGate.requiredChecks.includes('worker_runtime_registration_target'));
});

test('V6 release review requires proposal intake route tool and review queue evidence', () => {
  const proposalGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'proposal_intake_readiness_review');
  const validationGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'validation_evidence');

  assert.equal(proposalGate.owner, 'engineering_security_product');
  assert.ok(proposalGate.requiredArtifacts.includes('specs/57_agent_town_v6_internal_proposal_lifecycle.md'));
  assert.ok(proposalGate.requiredArtifacts.includes('server/world_civilization/proposals.js'));
  assert.ok(proposalGate.requiredArtifacts.includes('server/world_civilization/routes.js'));
  assert.ok(proposalGate.requiredArtifacts.includes('server/world_civilization/store_wiring.js'));
  assert.ok(proposalGate.requiredArtifacts.includes('server/world_civilization/worker_tool_adapter.js'));
  assert.ok(proposalGate.requiredArtifacts.includes('server/world_civilization/mutation_security.js'));
  assert.ok(proposalGate.requiredArtifacts.includes('server/world_civilization/tool_exposure_gate.js'));
  assert.ok(proposalGate.requiredArtifacts.includes('tests/world_civilization_proposals.test.js'));
  assert.ok(proposalGate.requiredArtifacts.includes('tests/world_civilization_routes.test.js'));
  assert.ok(proposalGate.requiredArtifacts.includes('tests/world_civilization_worker_tool_adapter.test.js'));
  assert.ok(proposalGate.requiredChecks.includes('human_submission_envelope'));
  assert.ok(proposalGate.requiredChecks.includes('worker_tool_submission_envelope'));
  assert.ok(proposalGate.requiredChecks.includes('openclaw_lite_worker_origin'));
  assert.ok(proposalGate.requiredChecks.includes('mutation_security_envelope'));
  assert.ok(proposalGate.requiredChecks.includes('same_origin_csrf_session_auth'));
  assert.ok(proposalGate.requiredChecks.includes('submission_envelope'));
  assert.ok(proposalGate.requiredChecks.includes('approval_receipt_binding'));
  assert.ok(proposalGate.requiredChecks.includes('proposal_submission_mutation_security'));
  assert.ok(proposalGate.requiredChecks.includes('worker_tool_origin_enforcement'));
  assert.ok(proposalGate.requiredChecks.includes('review_queue_index'));
  assert.ok(proposalGate.requiredChecks.includes('review_queue_snapshot'));
  assert.ok(proposalGate.requiredChecks.includes('reviewed_proposal_queue_exclusion'));
  assert.ok(proposalGate.requiredChecks.includes('expired_proposal_queue_exclusion'));
  assert.ok(proposalGate.requiredChecks.includes('proposal_created_audit_rows'));
  assert.ok(proposalGate.requiredChecks.includes('proposal_reviewed_audit_rows'));
  assert.ok(proposalGate.requiredChecks.includes('no_backend_shortcuts'));
  assert.ok(proposalGate.requiredChecks.includes('no_civic_tool_exposure'));
  assert.ok(proposalGate.requiredChecks.includes('no_effect_execution'));
  assert.ok(validationGate.requiredChecks.includes('proposal_intake_readiness_gate'));
});

test('V6 release review requires effect execution and rollback gate evidence', () => {
  const effectGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'effect_execution_review');
  const validationGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'validation_evidence');

  assert.equal(effectGate.owner, 'engineering_security');
  assert.ok(effectGate.requiredArtifacts.includes('specs/62_agent_town_v6_civic_effect_rollback_foundation.md'));
  assert.ok(effectGate.requiredArtifacts.includes('server/world_civilization/effects.js'));
  assert.ok(effectGate.requiredArtifacts.includes('server/world_civilization/rollback_execution_targets.js'));
  assert.ok(effectGate.requiredArtifacts.includes('server/world_civilization/rollback_recovery.js'));
  assert.ok(effectGate.requiredArtifacts.includes('tests/world_civilization_effects.test.js'));
  assert.ok(effectGate.requiredArtifacts.includes('tests/world_civilization_rollback_execution_targets.test.js'));
  assert.ok(effectGate.requiredArtifacts.includes('tests/world_civilization_rollback_recovery.test.js'));
  assert.ok(effectGate.requiredChecks.includes('typed_apply_handlers'));
  assert.ok(effectGate.requiredChecks.includes('typed_rollback_handlers'));
  assert.ok(effectGate.requiredChecks.includes('typed_rollback_execution_targets'));
  assert.ok(effectGate.requiredChecks.includes('real_before_after_state'));
  assert.ok(effectGate.requiredChecks.includes('irreversible_action_review'));
  assert.ok(effectGate.requiredChecks.includes('conservation_tests'));
  assert.ok(effectGate.requiredChecks.includes('applied_and_rollback_audit'));
  assert.ok(validationGate.requiredChecks.includes('effect_execution_gate'));
  assert.ok(validationGate.requiredArtifacts.includes('tests/world_civilization_effects.test.js'));
});

test('V6 release review requires vote authorization readiness evidence', () => {
  const voteGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'vote_authorization_readiness_review');
  const validationGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'validation_evidence');

  assert.equal(voteGate.owner, 'engineering_security_product');
  assert.ok(voteGate.requiredArtifacts.includes('specs/58_agent_town_v6_vote_authorization_foundation.md'));
  assert.ok(voteGate.requiredArtifacts.includes('server/world_civilization/routes.js'));
  assert.ok(voteGate.requiredArtifacts.includes('server/world_civilization/store_wiring.js'));
  assert.ok(voteGate.requiredArtifacts.includes('server/world_civilization/votes.js'));
  assert.ok(voteGate.requiredArtifacts.includes('server/world_civilization/worker_vote_adapter.js'));
  assert.ok(voteGate.requiredArtifacts.includes('server/world_civilization/governance_preflight.js'));
  assert.ok(voteGate.requiredArtifacts.includes('tests/world_civilization_routes.test.js'));
  assert.ok(voteGate.requiredArtifacts.includes('tests/world_civilization_votes.test.js'));
  assert.ok(voteGate.requiredArtifacts.includes('tests/world_civilization_worker_vote_adapter.test.js'));
  assert.ok(voteGate.requiredChecks.includes('server_verified_voter_authorization'));
  assert.ok(voteGate.requiredChecks.includes('eligibility_rule_verification'));
  assert.ok(voteGate.requiredChecks.includes('one_vote_accounting'));
  assert.ok(voteGate.requiredChecks.includes('idempotent_receipt_replay'));
  assert.ok(voteGate.requiredChecks.includes('changed_vote_replay_rejection'));
  assert.ok(voteGate.requiredChecks.includes('proposal_expiry_denial'));
  assert.ok(voteGate.requiredChecks.includes('delegation_policy_review'));
  assert.ok(voteGate.requiredChecks.includes('per_institution_voting_templates'));
  assert.ok(voteGate.requiredChecks.includes('route_edge_vote_auth'));
  assert.ok(voteGate.requiredChecks.includes('worker_tool_vote_registration'));
  assert.ok(voteGate.requiredChecks.includes('hidden_vote_route_store_wiring'));
  assert.ok(voteGate.requiredChecks.includes('quorum_threshold_policy'));
  assert.ok(voteGate.requiredChecks.includes('governance_preflight_integration'));
  assert.ok(voteGate.requiredChecks.includes('vote_audit_rows'));
  assert.ok(voteGate.requiredChecks.includes('private_data_exclusion'));
  assert.ok(voteGate.requiredChecks.includes('no_effect_application'));
  assert.ok(validationGate.requiredChecks.includes('vote_authorization_readiness_gate'));
  assert.ok(validationGate.requiredArtifacts.includes('tests/world_civilization_votes.test.js'));
});

test('V6 release review blocks signoff without vote route template and replay evidence', () => {
  const evidence = Object.fromEntries(REQUIRED_REVIEW_GATES.map((gate) => [gate.key, completeEvidenceFor(gate)]));
  evidence.vote_authorization_readiness_review = {
    ...evidence.vote_authorization_readiness_review,
    checks: evidence.vote_authorization_readiness_review.checks.filter((check) => (
      check !== 'route_edge_vote_auth'
      && check !== 'hidden_vote_route_store_wiring'
      && check !== 'per_institution_voting_templates'
      && check !== 'idempotent_receipt_replay'
    ))
  };
  const report = buildV6ReleaseReviewReport({
    includeResearchReview: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence
  });
  const voteGate = report.gateReports.find((gate) => gate.key === 'vote_authorization_readiness_review');

  assert.equal(report.releaseReady, false);
  assert.equal(voteGate.ok, false);
  assert.deepEqual(voteGate.missingChecks, [
    'idempotent_receipt_replay',
    'per_institution_voting_templates',
    'route_edge_vote_auth',
    'hidden_vote_route_store_wiring'
  ]);
  assert.deepEqual(assertV6ReleaseReviewSafe(report), { ok: true, errors: [] });
});

test('V6 release review blocks signoff without effect execution rollback evidence', () => {
  const evidence = Object.fromEntries(REQUIRED_REVIEW_GATES.map((gate) => [gate.key, completeEvidenceFor(gate)]));
  evidence.effect_execution_review = {
    ...evidence.effect_execution_review,
    checks: evidence.effect_execution_review.checks.filter((check) => (
      check !== 'typed_rollback_handlers'
      && check !== 'typed_rollback_execution_targets'
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
    'typed_rollback_execution_targets',
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
  assert.ok(agentGate.requiredArtifacts.includes('server/world_civilization/routes.js'));
  assert.ok(agentGate.requiredArtifacts.includes('server/world_civilization/worker_tool_adapter.js'));
  assert.ok(agentGate.requiredArtifacts.includes('server/world_civilization/worker_vote_adapter.js'));
  assert.ok(agentGate.requiredArtifacts.includes('tests/world_civilization_delegations.test.js'));
  assert.ok(agentGate.requiredArtifacts.includes('tests/world_civilization_routes.test.js'));
  assert.ok(agentGate.requiredArtifacts.includes('tests/world_civilization_worker_tool_adapter.test.js'));
  assert.ok(agentGate.requiredArtifacts.includes('tests/world_civilization_worker_vote_adapter.test.js'));
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

test('V6 release review requires public works readiness evidence', () => {
  const publicWorksGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'public_works_readiness_review');
  const validationGate = REQUIRED_REVIEW_GATES.find((gate) => gate.key === 'validation_evidence');

  assert.equal(publicWorksGate.owner, 'engineering_security_product');
  assert.ok(publicWorksGate.requiredArtifacts.includes('specs/65_agent_town_v6_public_works_shared_resources_foundation.md'));
  assert.ok(publicWorksGate.requiredArtifacts.includes('server/world_civilization/public_works.js'));
  assert.ok(publicWorksGate.requiredArtifacts.includes('server/world_civilization/institutions.js'));
  assert.ok(publicWorksGate.requiredArtifacts.includes('server/world_civilization/effects.js'));
  assert.ok(publicWorksGate.requiredArtifacts.includes('server/world_civilization/mutation_security.js'));
  assert.ok(publicWorksGate.requiredArtifacts.includes('docs/security/PUBLIC_TEXT_RENDERING_POLICY.md'));
  assert.ok(publicWorksGate.requiredArtifacts.includes('docs/technical/WORLD_EVENT_CONSERVATION_MODEL.md'));
  assert.ok(publicWorksGate.requiredArtifacts.includes('tests/world_civilization_public_works.test.js'));
  assert.ok(publicWorksGate.requiredChecks.includes('governed_project_review'));
  assert.ok(publicWorksGate.requiredChecks.includes('worker_tool_enforcement'));
  assert.ok(publicWorksGate.requiredChecks.includes('wallet_session_route_auth'));
  assert.ok(publicWorksGate.requiredChecks.includes('durable_idempotency'));
  assert.ok(publicWorksGate.requiredChecks.includes('explicit_inventory_spend_authorization'));
  assert.ok(publicWorksGate.requiredChecks.includes('inventory_restart_replay'));
  assert.ok(publicWorksGate.requiredChecks.includes('resource_conservation_tests'));
  assert.ok(publicWorksGate.requiredChecks.includes('reward_cosmetic_or_conservation_tests'));
  assert.ok(publicWorksGate.requiredChecks.includes('contribution_caps_under_retry'));
  assert.ok(publicWorksGate.requiredChecks.includes('rollback_execution_review'));
  assert.ok(publicWorksGate.requiredChecks.includes('public_text_rendering_review'));
  assert.ok(publicWorksGate.requiredChecks.includes('private_data_exclusion'));
  assert.ok(publicWorksGate.requiredChecks.includes('public_works_audit_rows'));
  assert.ok(publicWorksGate.requiredChecks.includes('process_restart_replay'));
  assert.ok(publicWorksGate.requiredChecks.includes('no_private_town_mutation'));
  assert.ok(publicWorksGate.requiredChecks.includes('no_public_free_play'));
  assert.ok(validationGate.requiredChecks.includes('public_works_readiness_gate'));
  assert.ok(validationGate.requiredArtifacts.includes('tests/world_civilization_public_works.test.js'));
});

test('V6 release review blocks signoff without public works route inventory reward and rollback evidence', () => {
  const evidence = Object.fromEntries(REQUIRED_REVIEW_GATES.map((gate) => [gate.key, completeEvidenceFor(gate)]));
  evidence.public_works_readiness_review = {
    ...evidence.public_works_readiness_review,
    checks: evidence.public_works_readiness_review.checks.filter((check) => (
      check !== 'wallet_session_route_auth'
      && check !== 'explicit_inventory_spend_authorization'
      && check !== 'reward_cosmetic_or_conservation_tests'
      && check !== 'rollback_execution_review'
    ))
  };
  const report = buildV6ReleaseReviewReport({
    includeResearchReview: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence
  });
  const publicWorksGate = report.gateReports.find((gate) => gate.key === 'public_works_readiness_review');

  assert.equal(report.releaseReady, false);
  assert.equal(publicWorksGate.ok, false);
  assert.deepEqual(publicWorksGate.missingChecks, [
    'wallet_session_route_auth',
    'explicit_inventory_spend_authorization',
    'reward_cosmetic_or_conservation_tests',
    'rollback_execution_review'
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
