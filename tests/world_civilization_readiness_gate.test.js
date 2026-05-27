const test = require('node:test');
const assert = require('node:assert/strict');

const { V6_WORLD_FEATURE_FLAG, parseWorldGridFeatureFlags } = require('../server/world_grid/feature_flags');
const {
  REQUIRED_V6_READINESS_GATES,
  V5_PROMOTION_GATE_ARTIFACT,
  V5_PROMOTION_TARGET_ARTIFACT,
  V5_PROMOTION_TARGET_TEST,
  V5_REPLAY_RECONSTRUCTION_ARTIFACT,
  V5_REPLAY_RECONSTRUCTION_TEST,
  V6_MILESTONE_PLAN_ARTIFACT,
  V6_READINESS_GATE_ARTIFACT,
  assertV6ReadinessGateSafe,
  buildV6ReadinessGateReport
} = require('../server/world_civilization/readiness_gate');

function completeEvidenceFor(gate) {
  return {
    status: 'complete',
    signoff: 'approved',
    artifacts: [...gate.requiredArtifacts],
    checks: [...gate.requiredChecks]
  };
}

function completeReadinessEvidence() {
  return Object.fromEntries(REQUIRED_V6_READINESS_GATES.map((gate) => [gate.key, completeEvidenceFor(gate)]));
}

test('V6 readiness gate report is hidden without explicit research opt-in and V6 flag', () => {
  const withoutResearchOptIn = buildV6ReadinessGateReport({
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true }
  });
  const broadV5Override = buildV6ReadinessGateReport({
    includeResearchReadiness: true,
    featureFlags: parseWorldGridFeatureFlags('all')
  });

  for (const report of [withoutResearchOptIn, broadV5Override]) {
    assert.equal(report.available, false);
    assert.equal(report.closed, false);
    assert.equal(report.releaseReady, false);
    assert.equal(report.runtimeExposed, false);
    assert.equal(report.playerVisible, false);
    assert.equal(report.normalGameplayExposure, false);
    assert.equal(report.mutatesWorldState, false);
    assert.equal(report.productionEnabled, false);
    assert.deepEqual(report.gateReports, []);
    assert.deepEqual(assertV6ReadinessGateSafe(report), { ok: true, errors: [] });
  }
});

test('V6 readiness gate baseline names every prerequisite domain but remains open', () => {
  const report = buildV6ReadinessGateReport({
    includeResearchReadiness: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    source: 'node_test'
  });

  assert.equal(report.available, true);
  assert.equal(report.source, 'node_test');
  assert.equal(report.closed, false);
  assert.equal(report.releaseReady, false);
  assert.deepEqual(report.gateReports.map((gate) => gate.key), REQUIRED_V6_READINESS_GATES.map((gate) => gate.key));
  assert.ok(report.gateReports.some((gate) => gate.requiredArtifacts.includes(V5_PROMOTION_GATE_ARTIFACT)));
  assert.ok(report.gateReports.some((gate) => gate.requiredArtifacts.includes(V6_READINESS_GATE_ARTIFACT)));
  assert.ok(report.gateReports.some((gate) => gate.requiredArtifacts.includes(V6_MILESTONE_PLAN_ARTIFACT)));
  const v5PromotionGate = REQUIRED_V6_READINESS_GATES.find((gate) => gate.key === 'v5_world_grid_promotion');
  const persistenceGate = REQUIRED_V6_READINESS_GATES.find((gate) => gate.key === 'persistence_resilience');
  const effectGate = REQUIRED_V6_READINESS_GATES.find((gate) => gate.key === 'effect_rollback');
  const mutationSecurityGate = REQUIRED_V6_READINESS_GATES.find((gate) => gate.key === 'mutation_security');
  const proposalGate = REQUIRED_V6_READINESS_GATES.find((gate) => gate.key === 'proposal_vote_governance');
  const reputationGate = REQUIRED_V6_READINESS_GATES.find((gate) => gate.key === 'reputation_moderation_privacy');
  const releaseReviewGate = REQUIRED_V6_READINESS_GATES.find((gate) => gate.key === 'security_product_release_review');
  const workerToolGate = REQUIRED_V6_READINESS_GATES.find((gate) => gate.key === 'worker_tool_surface');
  assert.ok(v5PromotionGate.requiredArtifacts.includes(V5_PROMOTION_TARGET_ARTIFACT));
  assert.ok(v5PromotionGate.requiredArtifacts.includes(V5_PROMOTION_TARGET_TEST));
  assert.ok(v5PromotionGate.requiredArtifacts.includes(V5_REPLAY_RECONSTRUCTION_ARTIFACT));
  assert.ok(v5PromotionGate.requiredArtifacts.includes(V5_REPLAY_RECONSTRUCTION_TEST));
  assert.ok(v5PromotionGate.requiredChecks.includes('v5_release_promotion_target'));
  assert.ok(v5PromotionGate.requiredChecks.includes('v5_replay_reconstruction_target'));
  assert.ok(v5PromotionGate.requiredChecks.includes('exact_before_state_reconstruction_target'));
  assert.ok(v5PromotionGate.requiredChecks.includes('production_replay_coverage_target'));
  assert.ok(v5PromotionGate.requiredChecks.includes('live_provider_logout_signoff_target'));
  assert.ok(v5PromotionGate.requiredChecks.includes('risk_rate_limit_identity_target'));
  assert.ok(workerToolGate.requiredArtifacts.includes('server/world_civilization/worker_tool_adapter.js'));
  assert.ok(workerToolGate.requiredArtifacts.includes('server/world_civilization/worker_vote_adapter.js'));
  assert.ok(workerToolGate.requiredArtifacts.includes('server/world_civilization/worker_runtime_registration.js'));
  assert.ok(workerToolGate.requiredArtifacts.includes('tests/world_civilization_worker_tool_adapter.test.js'));
  assert.ok(workerToolGate.requiredArtifacts.includes('tests/world_civilization_worker_vote_adapter.test.js'));
  assert.ok(workerToolGate.requiredArtifacts.includes('tests/world_civilization_worker_runtime_registration.test.js'));
  assert.ok(workerToolGate.requiredChecks.includes('worker_vote_receipt_adapter'));
  assert.ok(workerToolGate.requiredChecks.includes('worker_vote_route_edge_authorization'));
  assert.ok(workerToolGate.requiredChecks.includes('browser_worker_runtime_registration_target'));
  assert.ok(workerToolGate.requiredChecks.includes('production_browser_worker_coverage_target'));
  assert.ok(mutationSecurityGate.requiredArtifacts.includes('server/world_civilization/session_auth_targets.js'));
  assert.ok(mutationSecurityGate.requiredArtifacts.includes('tests/world_civilization_session_auth_targets.test.js'));
  assert.ok(mutationSecurityGate.requiredChecks.includes('session_wallet_continuity_targets'));
  assert.ok(mutationSecurityGate.requiredChecks.includes('provider_disconnect_invalidation_target'));
  assert.ok(mutationSecurityGate.requiredChecks.includes('route_tool_session_auth_target'));
  assert.ok(mutationSecurityGate.requiredChecks.includes('production_browser_session_coverage_target'));
  assert.ok(mutationSecurityGate.requiredChecks.includes('risk_aware_rate_limit_identity_target'));
  assert.ok(proposalGate.requiredChecks.includes('proposal_intake_readiness_gate'));
  assert.ok(proposalGate.requiredArtifacts.includes('server/world_civilization/routes.js'));
  assert.ok(proposalGate.requiredArtifacts.includes('server/world_civilization/store_wiring.js'));
  assert.ok(proposalGate.requiredArtifacts.includes('server/world_civilization/worker_tool_adapter.js'));
  assert.ok(proposalGate.requiredArtifacts.includes('server/world_civilization/worker_vote_adapter.js'));
  assert.ok(proposalGate.requiredArtifacts.includes('tests/world_civilization_routes.test.js'));
  assert.ok(proposalGate.requiredArtifacts.includes('tests/world_civilization_worker_tool_adapter.test.js'));
  assert.ok(proposalGate.requiredArtifacts.includes('tests/world_civilization_worker_vote_adapter.test.js'));
  assert.ok(proposalGate.requiredChecks.includes('route_tool_submission'));
  assert.ok(proposalGate.requiredChecks.includes('worker_tool_vote_registration'));
  assert.ok(proposalGate.requiredChecks.includes('vote_route_store_wiring'));
  assert.ok(proposalGate.requiredChecks.includes('submission_envelope'));
  assert.ok(proposalGate.requiredChecks.includes('approval_receipt_binding'));
  assert.ok(proposalGate.requiredChecks.includes('proposal_submission_mutation_security'));
  assert.ok(proposalGate.requiredChecks.includes('worker_tool_origin_enforcement'));
  assert.ok(proposalGate.requiredChecks.includes('review_queue_integration'));
  assert.ok(proposalGate.requiredChecks.includes('review_queue_snapshot'));
  assert.ok(proposalGate.requiredChecks.includes('expired_review_queue_exclusion'));
  assert.ok(reputationGate.requiredChecks.includes('reputation_eligibility_advice_gate'));
  assert.ok(reputationGate.requiredChecks.includes('moderation_privacy_readiness_gate'));
  assert.ok(reputationGate.requiredChecks.includes('surface_policy_coverage'));
  assert.ok(reputationGate.requiredChecks.includes('appeal_operations_review'));
  assert.ok(reputationGate.requiredChecks.includes('eligibility_advice_policy'));
  assert.ok(reputationGate.requiredChecks.includes('no_score_mutation'));
  assert.ok(effectGate.requiredArtifacts.includes('server/world_civilization/rollback_execution_targets.js'));
  assert.ok(effectGate.requiredArtifacts.includes('tests/world_civilization_rollback_execution_targets.test.js'));
  assert.ok(effectGate.requiredChecks.includes('typed_rollback_execution_targets'));
  assert.ok(persistenceGate.requiredArtifacts.includes('server/world_civilization/replay_reconstruction.js'));
  assert.ok(persistenceGate.requiredArtifacts.includes('server/world_civilization/load_rate_targets.js'));
  assert.ok(persistenceGate.requiredArtifacts.includes('server/world_civilization/backup_restore.js'));
  assert.ok(persistenceGate.requiredArtifacts.includes('server/world_civilization/migration_load_replay.js'));
  assert.ok(persistenceGate.requiredArtifacts.includes('server/world_civilization/write_contention.js'));
  assert.ok(persistenceGate.requiredArtifacts.includes('server/world_civilization/rollback_execution_targets.js'));
  assert.ok(persistenceGate.requiredArtifacts.includes('tests/world_civilization_replay_reconstruction.test.js'));
  assert.ok(persistenceGate.requiredArtifacts.includes('tests/world_civilization_load_rate_targets.test.js'));
  assert.ok(persistenceGate.requiredArtifacts.includes('tests/world_civilization_backup_restore.test.js'));
  assert.ok(persistenceGate.requiredArtifacts.includes('tests/world_civilization_migration_load_replay.test.js'));
  assert.ok(persistenceGate.requiredArtifacts.includes('tests/world_civilization_write_contention.test.js'));
  assert.ok(persistenceGate.requiredArtifacts.includes('tests/world_civilization_rollback_execution_targets.test.js'));
  assert.ok(persistenceGate.requiredArtifacts.includes('tests/world_civilization_process_restart.test.js'));
  assert.ok(persistenceGate.requiredChecks.includes('store_specific_zero_hash_only_fallbacks'));
  assert.ok(persistenceGate.requiredChecks.includes('backup_restore'));
  assert.ok(persistenceGate.requiredChecks.includes('migration_load_replay'));
  assert.ok(persistenceGate.requiredChecks.includes('multi_process_write_contention'));
  assert.ok(persistenceGate.requiredChecks.includes('typed_rollback_execution_recovery'));
  assert.ok(persistenceGate.requiredChecks.includes('privacy_safe_replay_summaries'));
  assert.ok(persistenceGate.requiredChecks.includes('no_effect_application_during_replay'));
  assert.ok(releaseReviewGate.requiredChecks.includes('audit_coverage'));
  assert.ok(releaseReviewGate.requiredArtifacts.includes('server/world_civilization/threat_model_targets.js'));
  assert.ok(releaseReviewGate.requiredArtifacts.includes('tests/world_civilization_threat_model_targets.test.js'));
  assert.ok(releaseReviewGate.requiredChecks.includes('threat_model_target_gate'));
  assert.ok(releaseReviewGate.requiredArtifacts.includes('server/world_civilization/abuse_case_targets.js'));
  assert.ok(releaseReviewGate.requiredArtifacts.includes('tests/world_civilization_abuse_case_targets.test.js'));
  assert.ok(releaseReviewGate.requiredChecks.includes('abuse_case_target_gate'));
  assert.ok(releaseReviewGate.requiredArtifacts.includes('server/world_civilization/blocker_exception_register.js'));
  assert.ok(releaseReviewGate.requiredArtifacts.includes('tests/world_civilization_blocker_exception_register.test.js'));
  assert.ok(releaseReviewGate.requiredChecks.includes('blocker_exception_register'));
  assert.ok(releaseReviewGate.requiredArtifacts.includes('server/world_civilization/product_signoff_targets.js'));
  assert.ok(releaseReviewGate.requiredArtifacts.includes('tests/world_civilization_product_signoff_targets.test.js'));
  assert.ok(releaseReviewGate.requiredChecks.includes('product_signoff_target_gate'));
  assert.ok(releaseReviewGate.requiredArtifacts.includes('server/world_civilization/release_evidence_manifest.js'));
  assert.ok(releaseReviewGate.requiredArtifacts.includes('tests/world_civilization_release_evidence_manifest.test.js'));
  assert.ok(releaseReviewGate.requiredChecks.includes('release_evidence_manifest'));
  assert.ok(releaseReviewGate.requiredArtifacts.includes('server/world_civilization/release_observability.js'));
  assert.ok(releaseReviewGate.requiredArtifacts.includes('tests/world_civilization_release_observability.test.js'));
  assert.ok(releaseReviewGate.requiredChecks.includes('release_observability_handoff'));
  assert.ok(releaseReviewGate.requiredArtifacts.includes('server/world_civilization/release_operations.js'));
  assert.ok(releaseReviewGate.requiredArtifacts.includes('tests/world_civilization_release_operations.test.js'));
  assert.ok(releaseReviewGate.requiredChecks.includes('release_operations_gate'));
  assert.ok(releaseReviewGate.requiredArtifacts.includes('server/world_civilization/release_signoff_packet.js'));
  assert.ok(releaseReviewGate.requiredArtifacts.includes('tests/world_civilization_release_signoff_packet.test.js'));
  assert.ok(releaseReviewGate.requiredChecks.includes('release_signoff_packet'));
  assert.ok(releaseReviewGate.requiredArtifacts.includes('server/world_civilization/release_support.js'));
  assert.ok(releaseReviewGate.requiredArtifacts.includes('tests/world_civilization_release_support.test.js'));
  assert.ok(releaseReviewGate.requiredChecks.includes('release_support_runbook'));
  assert.ok(releaseReviewGate.requiredArtifacts.includes('server/world_civilization/validation_targets.js'));
  assert.ok(releaseReviewGate.requiredArtifacts.includes('tests/world_civilization_validation_targets.test.js'));
  assert.ok(releaseReviewGate.requiredChecks.includes('validation_target_gate'));
  assert.ok(releaseReviewGate.requiredArtifacts.includes('server/world_civilization/ci_validation_matrix_targets.js'));
  assert.ok(releaseReviewGate.requiredArtifacts.includes('tests/world_civilization_ci_validation_matrix_targets.test.js'));
  assert.ok(releaseReviewGate.requiredChecks.includes('ci_validation_matrix_gate'));
  assert.ok(releaseReviewGate.requiredArtifacts.includes('server/world_civilization/release_candidate_targets.js'));
  assert.ok(releaseReviewGate.requiredArtifacts.includes('tests/world_civilization_release_candidate_targets.test.js'));
  assert.ok(releaseReviewGate.requiredChecks.includes('release_candidate_target_gate'));
  assert.ok(releaseReviewGate.requiredArtifacts.includes('server/world_civilization/privacy_review_targets.js'));
  assert.ok(releaseReviewGate.requiredArtifacts.includes('tests/world_civilization_privacy_review_targets.test.js'));
  assert.ok(releaseReviewGate.requiredChecks.includes('privacy_review_target_gate'));
  assert.ok(releaseReviewGate.requiredArtifacts.includes('server/world_civilization/data_retention_targets.js'));
  assert.ok(releaseReviewGate.requiredArtifacts.includes('tests/world_civilization_data_retention_targets.test.js'));
  assert.ok(releaseReviewGate.requiredChecks.includes('data_retention_policy'));
  assert.ok(releaseReviewGate.requiredChecks.includes('data_retention_target_gate'));
  assert.ok(releaseReviewGate.requiredChecks.includes('store_specific_audit_summary_coverage'));
  for (const gate of report.gateReports) {
    assert.equal(gate.ok, false, gate.key);
    assert.equal(gate.status, 'missing', gate.key);
    assert.equal(gate.signoff, 'missing', gate.key);
    assert.ok(gate.missingArtifacts.length > 0, gate.key);
    assert.ok(gate.missingChecks.length > 0, gate.key);
  }
  assert.deepEqual(assertV6ReadinessGateSafe(report), { ok: true, errors: [] });
});

test('V6 readiness gate closes only with complete signed evidence and stays hidden', () => {
  const report = buildV6ReadinessGateReport({
    includeResearchReadiness: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence: completeReadinessEvidence()
  });

  assert.equal(report.closed, true);
  assert.equal(report.releaseReady, true);
  assert.equal(report.runtimeExposed, false);
  assert.equal(report.playerVisible, false);
  assert.equal(report.normalGameplayExposure, false);
  assert.equal(report.mutatesWorldState, false);
  assert.equal(report.productionEnabled, false);
  assert.equal(report.executionStatus, 'not_executable');
  assert.deepEqual(report.gateReports.map((gate) => gate.ok), REQUIRED_V6_READINESS_GATES.map(() => true));
  assert.deepEqual(assertV6ReadinessGateSafe(report), { ok: true, errors: [] });
});

test('V6 readiness gate fails closed without proposal vote privacy and resilience evidence', () => {
  const evidence = completeReadinessEvidence();
  evidence.proposal_vote_governance = {
    ...evidence.proposal_vote_governance,
    checks: evidence.proposal_vote_governance.checks.filter((check) => check !== 'vote_authorization')
  };
  evidence.reputation_moderation_privacy = {
    ...evidence.reputation_moderation_privacy,
    checks: evidence.reputation_moderation_privacy.checks.filter((check) => check !== 'private_data_redaction')
  };
  evidence.persistence_resilience = {
    ...evidence.persistence_resilience,
    checks: evidence.persistence_resilience.checks.filter((check) => (
      check !== 'production_load_rate'
      && check !== 'migration_load_replay'
      && check !== 'multi_process_write_contention'
      && check !== 'store_specific_zero_hash_only_fallbacks'
      && check !== 'typed_rollback_execution_recovery'
    ))
  };
  evidence.security_product_release_review = {
    ...evidence.security_product_release_review,
    checks: evidence.security_product_release_review.checks.filter((check) => (
      check !== 'audit_coverage'
      && check !== 'store_specific_audit_summary_coverage'
    ))
  };
  const report = buildV6ReadinessGateReport({
    includeResearchReadiness: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence
  });

  assert.equal(report.closed, false);
  assert.equal(report.releaseReady, false);
  assert.deepEqual(report.gateReports.find((gate) => gate.key === 'proposal_vote_governance').missingChecks, ['vote_authorization']);
  assert.deepEqual(report.gateReports.find((gate) => gate.key === 'reputation_moderation_privacy').missingChecks, ['private_data_redaction']);
  assert.deepEqual(report.gateReports.find((gate) => gate.key === 'persistence_resilience').missingChecks, [
    'store_specific_zero_hash_only_fallbacks',
    'migration_load_replay',
    'production_load_rate',
    'multi_process_write_contention',
    'typed_rollback_execution_recovery'
  ]);
  assert.deepEqual(report.gateReports.find((gate) => gate.key === 'security_product_release_review').missingChecks, [
    'audit_coverage',
    'store_specific_audit_summary_coverage'
  ]);
  assert.deepEqual(assertV6ReadinessGateSafe(report), { ok: true, errors: [] });
});

test('V6 readiness gate assertion rejects fake closure or exposure drift', () => {
  const report = buildV6ReadinessGateReport({
    includeResearchReadiness: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence: {
      civic_schema_contracts: completeEvidenceFor(REQUIRED_V6_READINESS_GATES.find((gate) => gate.key === 'civic_schema_contracts'))
    }
  });
  const unsafe = {
    ...report,
    closed: true,
    releaseReady: true,
    runtimeExposed: true,
    playerVisible: true,
    normalGameplayExposure: true,
    mutatesWorldState: true,
    productionEnabled: true,
    executionStatus: 'executes'
  };
  const result = assertV6ReadinessGateSafe(unsafe);

  assert.equal(result.ok, false);
  assert.match(result.errors.join(','), /V6_READINESS_GATE_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_READINESS_GATE_PLAYER_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_READINESS_GATE_NORMAL_GAMEPLAY_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_READINESS_GATE_WORLD_MUTATION_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_READINESS_GATE_PRODUCTION_ENABLEMENT_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_READINESS_GATE_NON_EXECUTING_REQUIRED/);
  assert.match(result.errors.join(','), /V6_READINESS_GATE_CLOSED_WITH_FAILED_GATES/);
});
