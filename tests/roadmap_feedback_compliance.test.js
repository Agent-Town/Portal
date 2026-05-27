const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');

function read(relPath) {
  return fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
}

test('future roadmap uses approved release status vocabulary', () => {
  const docs = [
    'specs/46_agent_town_future_roadmap_v1_5_to_v4.md',
    'docs/product/agent-town-future-roadmap-v1.5-to-v4.md',
    'docs/technical/FOUNDERS_PLOT_ROADMAP_SLICE_PLAN_V1_6_TO_V4.md'
  ];
  for (const relPath of docs) {
    const text = read(relPath);
    assert.equal(text.includes('gated_experimental'), false, relPath);
    assert.equal(/\|\s*prototype\s*\|/.test(text), false, relPath);
    assert.match(text, /prototype_gated/, relPath);
    assert.match(text, /blocked_on_security|release_status/, relPath);
  }
});

test('V5/V6 handoff artifacts and recurring Three.js gate exist', () => {
  const required = [
    'specs/release-gates/threejs_runtime_gate.md',
    'specs/release-gates/v5_world_grid_release_promotion_gate.md',
    'specs/release-gates/v60_agent_civilization_readiness_gate.md',
    'specs/47_agent_town_v5_0_region_grid_foundation.md',
    'specs/48_agent_town_v5_0_region_grid_tdd_matrix.md',
    'specs/49_agent_town_v5_1_territory_claims.md',
    'specs/50_agent_town_v5_2_public_presence.md',
    'specs/51_agent_town_v5_3_agent_services.md',
    'specs/52_agent_town_v5_4_world_events.md',
    'specs/53_agent_town_v5_5_sandbox_districts.md',
    'specs/54_agent_town_v6_agent_civilization_foundation.md',
    'specs/55_agent_town_v6_civic_schema_contracts.md',
    'specs/56_agent_town_v6_audit_ledger_foundation.md',
    'specs/57_agent_town_v6_internal_proposal_lifecycle.md',
    'specs/58_agent_town_v6_vote_authorization_foundation.md',
    'specs/59_agent_town_v6_worker_tool_surface_draft.md',
    'specs/60_agent_town_v6_reputation_accountability_foundation.md',
    'specs/61_agent_town_v6_moderation_privacy_foundation.md',
    'specs/62_agent_town_v6_civic_effect_rollback_foundation.md',
    'specs/63_agent_town_v6_agent_participation_delegation_foundation.md',
    'specs/64_agent_town_v6_civic_institution_charter_foundation.md',
    'specs/65_agent_town_v6_public_works_shared_resources_foundation.md',
    'specs/66_agent_town_v6_modal_lab_surface_foundation.md',
    'specs/67_agent_town_v6_persistence_replay_resilience_foundation.md',
    'specs/68_agent_town_v6_security_product_release_review_foundation.md',
    'specs/69_agent_town_v6_controlled_release_completion_foundation.md',
    'specs/70_agent_town_v6_civic_mutation_security_foundation.md',
    'specs/71_agent_town_v6_governance_preflight_foundation.md',
    'docs/product/WORLD_GRID_LADDER_V5_TO_V6.md',
    'docs/product/V6_AGENT_CIVILIZATION_MILESTONE_PLAN.md',
    'docs/product/PUBLIC_PRESENCE_PRIVACY_MODEL_V5.md',
    'docs/product/FREE_PLAY_SANDBOX_POLICY_V5_5.md',
    'docs/technical/WORLD_GRID_STATE_MODEL.md',
    'docs/technical/THREEJS_WORLD_ZOOM_RENDERER.md',
    'docs/technical/WORLD_EVENT_CONSERVATION_MODEL.md',
    'docs/technical/PUBLIC_DISTRICT_MODERATION_AND_ROLLBACK.md',
    'docs/ops/V6_AGENT_CIVILIZATION_CONTROLLED_RELEASE_RUNBOOK.md',
    'docs/security/V6_AGENT_CIVILIZATION_RELEASE_REVIEW.md',
    'docs/security/WORLD_LAYER_SECURITY_REVIEW_V5.md',
    'docs/security/WORLD_GRID_MUTATION_SECURITY_PLAN.md',
    'docs/security/V6_CIVIC_MUTATION_SECURITY_PLAN.md',
    'docs/security/AGENT_SERVICES_DATA_ACCESS_POLICY.md',
    'docs/security/PUBLIC_TEXT_RENDERING_POLICY.md',
    'docs/security/PUBLIC_PRESENCE_REDACTION_POLICY.md',
    'docs/release-evidence/V6_AGENT_CIVILIZATION_QA_BRANCH_REVIEW_RESPONSE_2026-05-28.md',
    'server/world_grid/csrf.js',
    'server/world_grid/audit_log.js',
    'server/world_grid/idempotency.js',
    'server/world_grid/mutation_origin.js',
    'server/world_grid/preferences.js',
    'server/world_grid/rate_limit.js',
    'server/world_civilization/audit_ledger.js',
    'server/world_civilization/abuse_case_targets.js',
    'server/world_civilization/blocker_exception_register.js',
    'server/world_civilization/ci_validation_matrix_targets.js',
    'server/world_civilization/controlled_release.js',
    'server/world_civilization/controlled_release_targets.js',
    'server/world_civilization/data_retention_targets.js',
    'server/world_civilization/delegations.js',
    'server/world_civilization/effects.js',
    'server/world_civilization/governance_preflight.js',
    'server/world_civilization/institutions.js',
    'server/world_civilization/lab_surface.js',
    'server/world_civilization/moderation.js',
    'server/world_civilization/mutation_security.js',
    'server/world_civilization/privacy_review_targets.js',
    'server/world_civilization/product_signoff_targets.js',
    'server/world_civilization/proposals.js',
    'server/world_civilization/routes.js',
    'server/world_civilization/store_wiring.js',
    'server/world_civilization/public_works.js',
    'server/world_civilization/reputation.js',
    'server/world_civilization/replay_reconstruction.js',
    'server/world_civilization/release_candidate_targets.js',
    'server/world_civilization/release_evidence_manifest.js',
    'server/world_civilization/release_observability.js',
    'server/world_civilization/release_operations.js',
    'server/world_civilization/release_signoff_packet.js',
    'server/world_civilization/release_support.js',
    'server/world_civilization/load_rate_targets.js',
    'server/world_civilization/migration_rehearsal.js',
    'server/world_civilization/migration_load_replay.js',
    'server/world_civilization/rollback_recovery.js',
    'server/world_civilization/rollback_execution_targets.js',
    'server/world_civilization/write_contention.js',
    'server/world_civilization/readiness_gate.js',
    'server/world_civilization/resilience.js',
    'server/world_civilization/release_review.js',
    'server/world_civilization/schemas.js',
    'server/world_civilization/session_auth_targets.js',
    'server/world_civilization/sqlite_schema.js',
    'server/world_civilization/tool_exposure_gate.js',
    'server/world_civilization/threat_model_targets.js',
    'server/world_civilization/tools.js',
    'server/world_civilization/validation_targets.js',
    'server/world_civilization/votes.js',
    'server/world_civilization/worker_runtime_registration.js',
    'server/world_civilization/worker_tool_adapter.js',
    'server/world_civilization/worker_vote_adapter.js',
    'tests/world_civilization_process_restart.test.js',
    'tests/world_civilization_proposal_vote_process_restart.test.js',
    'tests/world_civilization_abuse_case_targets.test.js',
    'tests/world_civilization_blocker_exception_register.test.js',
    'tests/world_civilization_ci_validation_matrix_targets.test.js',
    'tests/world_civilization_data_retention_targets.test.js',
    'tests/world_civilization_privacy_review_targets.test.js',
    'tests/world_civilization_product_signoff_targets.test.js',
    'tests/world_civilization_reputation_moderation_process_restart.test.js',
    'tests/world_civilization_effect_process_restart.test.js',
    'tests/world_civilization_delegation_process_restart.test.js',
    'tests/world_civilization_institution_process_restart.test.js',
    'tests/world_civilization_public_works_process_restart.test.js',
    'tests/world_civilization_schema_metadata.test.js',
    'tests/world_civilization_load_rate_targets.test.js',
    'tests/world_civilization_migration_rehearsal.test.js',
    'tests/world_civilization_migration_load_replay.test.js',
    'tests/world_civilization_load_rate.test.js',
    'tests/world_civilization_write_contention.test.js',
    'tests/world_civilization_rollback_recovery.test.js',
    'tests/world_civilization_rollback_execution_targets.test.js',
    'tests/world_civilization_readiness_gate.test.js',
    'tests/world_civilization_release_candidate_targets.test.js',
    'tests/world_civilization_release_evidence_manifest.test.js',
    'tests/world_civilization_release_observability.test.js',
    'tests/world_civilization_release_operations.test.js',
    'tests/world_civilization_release_signoff_packet.test.js',
    'tests/world_civilization_release_support.test.js',
    'tests/world_civilization_mutation_security.test.js',
    'tests/world_civilization_session_auth_targets.test.js',
    'tests/world_civilization_threat_model_targets.test.js',
    'tests/world_civilization_validation_targets.test.js',
    'tests/world_civilization_routes.test.js',
    'tests/world_civilization_tool_exposure_gate.test.js',
    'tests/world_civilization_controlled_release_targets.test.js',
    'tests/world_civilization_worker_runtime_registration.test.js',
    'tests/world_civilization_worker_tool_adapter.test.js',
    'tests/world_civilization_worker_vote_adapter.test.js',
    'tests/world_civilization_governance_preflight.test.js',
    'tests/world_grid_region_preferences_persistence.test.js',
    'tests/world_grid_region_preferences_restart_probe_child.js',
    'tests/world_grid_audit_persistence.test.js',
    'tests/world_grid_csrf_persistence.test.js',
    'tests/world_grid_csrf_restart_probe_child.js',
    'tests/world_grid_rate_limit_persistence.test.js',
    'tests/world_grid_rate_limit_restart_probe_child.js',
    'tests/world_grid_idempotency_persistence.test.js',
    'tests/world_grid_idempotency_restart_probe_child.js',
    'tests/world_grid_claims_persistence.test.js',
    'tests/world_grid_claims_restart_probe_child.js',
    'tests/world_grid_public_presence_persistence.test.js',
    'tests/world_grid_public_presence_restart_probe_child.js',
    'tests/world_grid_services_persistence.test.js',
    'tests/world_grid_services_restart_probe_child.js',
    'tests/world_grid_events_persistence.test.js',
    'tests/world_grid_events_restart_probe_child.js',
    'tests/world_grid_sandbox_persistence.test.js',
    'tests/world_grid_sandbox_restart_probe_child.js',
    'e2e/243_world_grid_csrf_session_binding.spec.js',
    'e2e/244_v6_lab_modal_boundary.spec.js',
    'e2e/245_world_grid_player_route_prerequisite.spec.js',
    'public/experiences/world-grid/manifest.json',
    'public/experiences/world-grid/skill.md',
    'public/experiences/world-grid/tools.md',
    'public/experiences/world-grid/heartbeat.md',
    'public/experiences/world-grid/goals.md'
  ];
  for (const relPath of required) {
    assert.ok(fs.existsSync(path.join(repoRoot, relPath)), relPath);
  }
});

test('V6 milestone plan preserves the complete civilization ladder', () => {
  const plan = read('docs/product/V6_AGENT_CIVILIZATION_MILESTONE_PLAN.md');
  const spec = read('specs/54_agent_town_v6_agent_civilization_foundation.md');
  const gate = read('specs/release-gates/v60_agent_civilization_readiness_gate.md');
  const reputationSpec = read('specs/60_agent_town_v6_reputation_accountability_foundation.md');
  const moderationSpec = read('specs/61_agent_town_v6_moderation_privacy_foundation.md');
  const schemaSpec = read('specs/55_agent_town_v6_civic_schema_contracts.md');
  const auditSpec = read('specs/56_agent_town_v6_audit_ledger_foundation.md');
  const proposalSpec = read('specs/57_agent_town_v6_internal_proposal_lifecycle.md');
  const voteSpec = read('specs/58_agent_town_v6_vote_authorization_foundation.md');
  const toolSpec = read('specs/59_agent_town_v6_worker_tool_surface_draft.md');
  const effectSpec = read('specs/62_agent_town_v6_civic_effect_rollback_foundation.md');
  const delegationSpec = read('specs/63_agent_town_v6_agent_participation_delegation_foundation.md');
  const institutionSpec = read('specs/64_agent_town_v6_civic_institution_charter_foundation.md');
  const publicWorksSpec = read('specs/65_agent_town_v6_public_works_shared_resources_foundation.md');
  const labSpec = read('specs/66_agent_town_v6_modal_lab_surface_foundation.md');
  const persistenceSpec = read('specs/67_agent_town_v6_persistence_replay_resilience_foundation.md');
  const controlledSpec = read('specs/69_agent_town_v6_controlled_release_completion_foundation.md');
  const releaseReview = read('docs/security/V6_AGENT_CIVILIZATION_RELEASE_REVIEW.md');
  const controlledRunbook = read('docs/ops/V6_AGENT_CIVILIZATION_CONTROLLED_RELEASE_RUNBOOK.md');
  const skillLine = read('docs/internal-skill-testline.md');
  const institutionSource = read('server/world_civilization/institutions.js');
  const publicWorksSource = read('server/world_civilization/public_works.js');
  const labSource = read('server/world_civilization/lab_surface.js');
  const serverIndex = read('server/index.js');
  const labE2e = read('e2e/244_v6_lab_modal_boundary.spec.js');
  const schemaSource = read('server/world_civilization/schemas.js');
  const replaySource = read('server/world_civilization/replay_reconstruction.js');
  const resilienceSource = read('server/world_civilization/resilience.js');
  const rollbackExecutionTargetSource = read('server/world_civilization/rollback_execution_targets.js');
  const readinessSource = read('server/world_civilization/readiness_gate.js');
  const releaseReviewSource = read('server/world_civilization/release_review.js');
  const sessionAuthTargetSource = read('server/world_civilization/session_auth_targets.js');
  const controlledSource = read('server/world_civilization/controlled_release.js');
  const controlledTargetSource = read('server/world_civilization/controlled_release_targets.js');
  const proposalSource = read('server/world_civilization/proposals.js');
  const proposalRouteSource = read('server/world_civilization/routes.js');
  const proposalStoreWiringSource = read('server/world_civilization/store_wiring.js');
  const workerToolAdapterSource = read('server/world_civilization/worker_tool_adapter.js');
  const workerRuntimeRegistrationSource = read('server/world_civilization/worker_runtime_registration.js');
  const workerVoteAdapterSource = read('server/world_civilization/worker_vote_adapter.js');
  const voteSource = read('server/world_civilization/votes.js');
  const votingTemplateSource = read('server/world_civilization/voting_templates.js');
  const reputationSource = read('server/world_civilization/reputation.js');
  const moderationSource = read('server/world_civilization/moderation.js');
  const effectSource = read('server/world_civilization/effects.js');
  const delegationSource = read('server/world_civilization/delegations.js');
  const dataRetentionTargetSource = read('server/world_civilization/data_retention_targets.js');
  const privacyReviewTargetSource = read('server/world_civilization/privacy_review_targets.js');
  const threatModelTargetSource = read('server/world_civilization/threat_model_targets.js');
  const abuseCaseTargetSource = read('server/world_civilization/abuse_case_targets.js');
  const productSignoffTargetSource = read('server/world_civilization/product_signoff_targets.js');
  const blockerExceptionRegisterSource = read('server/world_civilization/blocker_exception_register.js');
  const ciValidationMatrixTargetSource = read('server/world_civilization/ci_validation_matrix_targets.js');
  const releaseCandidateTargetSource = read('server/world_civilization/release_candidate_targets.js');
  const releaseEvidenceManifestSource = read('server/world_civilization/release_evidence_manifest.js');
  const releaseObservabilitySource = read('server/world_civilization/release_observability.js');
  const releaseOperationsSource = read('server/world_civilization/release_operations.js');
  const releaseSignoffPacketSource = read('server/world_civilization/release_signoff_packet.js');
  const releaseSupportSource = read('server/world_civilization/release_support.js');
  const validationTargetSource = read('server/world_civilization/validation_targets.js');
  const requiredMilestones = [
    'M0 Hardened V5 world-grid baseline',
    'M1 Living V6 milestone contract',
    'M2 V5 evidence promotion gates',
    'M3 Release-grade world storage',
    'M4 Civic schema contracts',
    'M5 Mutation security controls',
    'M6 Worker-first V6 tool surface',
    'M7 Internal proposal lifecycle',
    'M8 Vote authorization and delegation',
    'M9 Reputation and accountability',
    'M10 Moderation and privacy layer',
    'M11 Civic effect execution and rollback',
    'M12 Agent participation controls',
    'M13 Civic institutions and charters',
    'M14 Public works and shared resources integration',
    'M15 Modal-first V6 lab surface',
    'M16 Persistence, replay, and resilience hardening',
    'M17 Security and product release review',
    'M18 V6 controlled release completion'
  ];

  for (const milestone of requiredMilestones) {
    assert.match(plan, new RegExp(milestone.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), milestone);
  }
  assert.match(plan, /V6 remains research-only/);
  assert.match(plan, /No public autonomous agent may mutate another user's world/);
  assert.match(plan, /Human approval or explicit delegation is required/);
  assert.match(spec, /docs\/product\/V6_AGENT_CIVILIZATION_MILESTONE_PLAN\.md/);
  assert.match(gate, /docs\/product\/V6_AGENT_CIVILIZATION_MILESTONE_PLAN\.md/);
  assert.match(plan, /server\/world_civilization\/readiness_gate\.js/);
  assert.match(gate, /server\/world_civilization\/readiness_gate\.js/);
  assert.match(readinessSource, /buildV6ReadinessGateReport/);
  assert.match(readinessSource, /REQUIRED_V6_READINESS_GATES/);
  assert.match(readinessSource, /proposal_vote_governance/);
  assert.match(readinessSource, /reputation_moderation_privacy/);
  assert.match(readinessSource, /persistence_resilience/);
  assert.match(readinessSource, /security_product_release_review/);
  assert.match(readinessSource, /store_specific_zero_hash_only_fallbacks/);
  assert.match(readinessSource, /store_specific_audit_summary_coverage/);
  assert.match(readinessSource, /session_wallet_continuity_targets/);
  assert.match(readinessSource, /production_browser_session_coverage_target/);
  assert.match(readinessSource, /V6_READINESS_GATE_PRODUCTION_ENABLEMENT_FORBIDDEN/);
  assert.match(readinessSource, /threat_model_target_gate/);
  assert.match(readinessSource, /abuse_case_target_gate/);
  assert.match(readinessSource, /product_signoff_target_gate/);
  assert.match(readinessSource, /privacy_review_target_gate/);
  assert.match(readinessSource, /data_retention_target_gate/);
  assert.match(readinessSource, /ci_validation_matrix_gate/);
  assert.match(readinessSource, /release_candidate_target_gate/);
  assert.match(readinessSource, /release_evidence_manifest/);
  assert.match(readinessSource, /server\/world_civilization\/release_evidence_manifest\.js/);
  assert.match(readinessSource, /tests\/world_civilization_release_evidence_manifest\.test\.js/);
  assert.match(readinessSource, /release_signoff_packet/);
  assert.match(readinessSource, /server\/world_civilization\/release_signoff_packet\.js/);
  assert.match(readinessSource, /tests\/world_civilization_release_signoff_packet\.test\.js/);
  assert.match(readinessSource, /validation_target_gate/);
  assert.match(releaseReviewSource, /session_auth_target_gate/);
  assert.match(releaseReviewSource, /threat_model_target_gate/);
  assert.match(releaseReviewSource, /server\/world_civilization\/threat_model_targets\.js/);
  assert.match(releaseReviewSource, /abuse_case_target_gate/);
  assert.match(releaseReviewSource, /server\/world_civilization\/abuse_case_targets\.js/);
  assert.match(releaseReviewSource, /product_signoff_target_gate/);
  assert.match(releaseReviewSource, /server\/world_civilization\/product_signoff_targets\.js/);
  assert.match(releaseReviewSource, /server\/world_civilization\/blocker_exception_register\.js/);
  assert.match(releaseReviewSource, /tests\/world_civilization_blocker_exception_register\.test\.js/);
  assert.match(releaseReviewSource, /blocker_exception_register/);
  assert.match(releaseReviewSource, /server\/world_civilization\/release_observability\.js/);
  assert.match(releaseReviewSource, /tests\/world_civilization_release_observability\.test\.js/);
  assert.match(releaseReviewSource, /release_observability_handoff/);
  assert.match(releaseReviewSource, /server\/world_civilization\/release_support\.js/);
  assert.match(releaseReviewSource, /tests\/world_civilization_release_support\.test\.js/);
  assert.match(releaseReviewSource, /release_support_runbook/);
  assert.match(releaseReviewSource, /privacy_review_target_gate/);
  assert.match(releaseReviewSource, /server\/world_civilization\/privacy_review_targets\.js/);
  assert.match(releaseReviewSource, /data_retention_target_gate/);
  assert.match(releaseReviewSource, /server\/world_civilization\/data_retention_targets\.js/);
  assert.match(releaseReviewSource, /server\/world_civilization\/session_auth_targets\.js/);
  assert.match(releaseReviewSource, /ci_validation_matrix_gate/);
  assert.match(releaseReviewSource, /server\/world_civilization\/ci_validation_matrix_targets\.js/);
  assert.match(releaseReviewSource, /release_candidate_target_gate/);
  assert.match(releaseReviewSource, /server\/world_civilization\/release_candidate_targets\.js/);
  assert.match(releaseReviewSource, /release_evidence_manifest/);
  assert.match(releaseReviewSource, /server\/world_civilization\/release_evidence_manifest\.js/);
  assert.match(releaseReviewSource, /tests\/world_civilization_release_evidence_manifest\.test\.js/);
  assert.match(releaseReviewSource, /release_signoff_packet/);
  assert.match(releaseReviewSource, /server\/world_civilization\/release_signoff_packet\.js/);
  assert.match(releaseReviewSource, /tests\/world_civilization_release_signoff_packet\.test\.js/);
  assert.match(releaseReviewSource, /validation_target_gate/);
  assert.match(releaseReviewSource, /server\/world_civilization\/validation_targets\.js/);
  assert.match(sessionAuthTargetSource, /V6_SESSION_AUTH_TARGETS_VERSION/);
  assert.match(sessionAuthTargetSource, /session_wallet_binding/);
  assert.match(sessionAuthTargetSource, /provider_disconnect_invalidation/);
  assert.match(sessionAuthTargetSource, /risk_aware_rate_limit_identity/);
  assert.match(threatModelTargetSource, /V6_THREAT_MODEL_TARGETS_VERSION/);
  assert.match(threatModelTargetSource, /trust_boundaries/);
  assert.match(threatModelTargetSource, /attacker_capabilities/);
  assert.match(threatModelTargetSource, /rollback_failure_modes/);
  assert.match(threatModelTargetSource, /release_signoff_inputs/);
  assert.match(abuseCaseTargetSource, /V6_ABUSE_CASE_TARGETS_VERSION/);
  assert.match(abuseCaseTargetSource, /unauthorized_mutation/);
  assert.match(abuseCaseTargetSource, /delegation_budget_abuse/);
  assert.match(abuseCaseTargetSource, /vote_reputation_farming/);
  assert.match(abuseCaseTargetSource, /public_autonomous_agent_mutation/);
  assert.match(productSignoffTargetSource, /V6_PRODUCT_SIGNOFF_TARGETS_VERSION/);
  assert.match(productSignoffTargetSource, /player_visible_scope/);
  assert.match(productSignoffTargetSource, /normal_gameplay_exposure_denial/);
  assert.match(productSignoffTargetSource, /server\/world_civilization\/release_signoff_packet\.js/);
  assert.match(productSignoffTargetSource, /server\/world_civilization\/release_observability\.js/);
  assert.match(productSignoffTargetSource, /server\/world_civilization\/release_operations\.js/);
  assert.match(productSignoffTargetSource, /server\/world_civilization\/release_support\.js/);
  assert.match(productSignoffTargetSource, /go_no_go_record/);
  assert.match(productSignoffTargetSource, /post_release_monitoring/);
  assert.match(releaseEvidenceManifestSource, /V6_RELEASE_EVIDENCE_MANIFEST_VERSION/);
  assert.match(releaseEvidenceManifestSource, /release_candidate_environment/);
  assert.match(releaseEvidenceManifestSource, /command_transcripts/);
  assert.match(releaseEvidenceManifestSource, /targeted_node_results/);
  assert.match(releaseEvidenceManifestSource, /split_playwright_results/);
  assert.match(releaseEvidenceManifestSource, /all_features_regression_results/);
  assert.match(releaseEvidenceManifestSource, /production_override_recheck/);
  assert.match(releaseEvidenceManifestSource, /runtime_tool_absence_recheck/);
  assert.match(releaseEvidenceManifestSource, /browser_console_error_budget/);
  assert.match(releaseEvidenceManifestSource, /playwright_trace_archive/);
  assert.match(releaseEvidenceManifestSource, /release_signoff_packet/);
  assert.match(releaseEvidenceManifestSource, /controlled_release_runbook/);
  assert.match(releaseEvidenceManifestSource, /V6_RELEASE_EVIDENCE_MANIFEST_RUNTIME_TOOL_EXPOSURE_FORBIDDEN/);
  assert.match(blockerExceptionRegisterSource, /V6_BLOCKER_EXCEPTION_REGISTER_VERSION/);
  assert.match(blockerExceptionRegisterSource, /p0_p1_clearance/);
  assert.match(blockerExceptionRegisterSource, /exception_expiry/);
  assert.match(blockerExceptionRegisterSource, /security_dependency_review/);
  assert.match(blockerExceptionRegisterSource, /controlled_release_handoff/);
  assert.match(blockerExceptionRegisterSource, /V6_BLOCKER_REGISTER_P0_P1_OPEN/);
  assert.match(blockerExceptionRegisterSource, /V6_BLOCKER_REGISTER_PRODUCTION_ENABLEMENT_FORBIDDEN/);
  assert.match(releaseObservabilitySource, /V6_RELEASE_OBSERVABILITY_VERSION/);
  assert.match(releaseObservabilitySource, /audit_metrics/);
  assert.match(releaseObservabilitySource, /worker_traffic_trace/);
  assert.match(releaseObservabilitySource, /privacy_safe_logs/);
  assert.match(releaseObservabilitySource, /feature_flag_dashboard/);
  assert.match(releaseObservabilitySource, /runtime_tool_absence_monitor/);
  assert.match(releaseObservabilitySource, /support_escalation_link/);
  assert.match(releaseObservabilitySource, /V6_RELEASE_OBSERVABILITY_RUNTIME_TOOL_EXPOSURE_FORBIDDEN/);
  assert.match(releaseOperationsSource, /V6_RELEASE_OPERATIONS_VERSION/);
  assert.match(releaseOperationsSource, /production_flag_control/);
  assert.match(releaseOperationsSource, /release_window/);
  assert.match(releaseOperationsSource, /go_no_go_record/);
  assert.match(releaseOperationsSource, /canary_scope/);
  assert.match(releaseOperationsSource, /canary_exit/);
  assert.match(releaseOperationsSource, /emergency_disable/);
  assert.match(releaseOperationsSource, /rollback_disable_drill/);
  assert.match(releaseOperationsSource, /post_release_verification/);
  assert.match(releaseOperationsSource, /normal_gameplay_baseline/);
  assert.match(releaseOperationsSource, /audit_replay_health_check/);
  assert.match(releaseOperationsSource, /V6_RELEASE_OPERATIONS_RUNTIME_TOOL_EXPOSURE_FORBIDDEN/);
  assert.match(releaseSignoffPacketSource, /V6_RELEASE_SIGNOFF_PACKET_VERSION/);
  assert.match(releaseSignoffPacketSource, /product_owner_approval/);
  assert.match(releaseSignoffPacketSource, /qa_owner_signoff/);
  assert.match(releaseSignoffPacketSource, /security_owner_signoff/);
  assert.match(releaseSignoffPacketSource, /privacy_owner_signoff/);
  assert.match(releaseSignoffPacketSource, /support_owner_signoff/);
  assert.match(releaseSignoffPacketSource, /release_manager_approval/);
  assert.match(releaseSignoffPacketSource, /engineering_owner_approval/);
  assert.match(releaseSignoffPacketSource, /blocker_register_acceptance/);
  assert.match(releaseSignoffPacketSource, /release_candidate_packet_acceptance/);
  assert.match(releaseSignoffPacketSource, /operations_handoff_acceptance/);
  assert.match(releaseSignoffPacketSource, /observability_handoff_acceptance/);
  assert.match(releaseSignoffPacketSource, /support_runbook_acceptance/);
  assert.match(releaseSignoffPacketSource, /V6_RELEASE_SIGNOFF_PACKET_RUNTIME_TOOL_EXPOSURE_FORBIDDEN/);
  assert.match(releaseSupportSource, /V6_RELEASE_SUPPORT_VERSION/);
  assert.match(releaseSupportSource, /known_issues/);
  assert.match(releaseSupportSource, /support_triage/);
  assert.match(releaseSupportSource, /incident_response/);
  assert.match(releaseSupportSource, /user_comms/);
  assert.match(releaseSupportSource, /rollback_contact/);
  assert.match(releaseSupportSource, /support_oncall/);
  assert.match(releaseSupportSource, /escalation_owners/);
  assert.match(releaseSupportSource, /privacy_safe_support_view/);
  assert.match(releaseSupportSource, /blocker_register_link/);
  assert.match(releaseSupportSource, /observability_link/);
  assert.match(releaseSupportSource, /V6_RELEASE_SUPPORT_RUNTIME_TOOL_EXPOSURE_FORBIDDEN/);
  assert.match(ciValidationMatrixTargetSource, /V6_CI_VALIDATION_MATRIX_TARGETS_VERSION/);
  assert.match(ciValidationMatrixTargetSource, /split_playwright_smokes/);
  assert.match(ciValidationMatrixTargetSource, /console_error_budget/);
  assert.match(ciValidationMatrixTargetSource, /trace_artifact_retention/);
  assert.match(ciValidationMatrixTargetSource, /qa_release_packet/);
  assert.match(releaseCandidateTargetSource, /V6_RELEASE_CANDIDATE_TARGETS_VERSION/);
  assert.match(releaseCandidateTargetSource, /release_candidate_environment/);
  assert.match(releaseCandidateTargetSource, /browser_console_error_budget/);
  assert.match(releaseCandidateTargetSource, /playwright_trace_archive/);
  assert.match(releaseCandidateTargetSource, /production_override_recheck/);
  assert.match(releaseCandidateTargetSource, /controlled_release_handoff/);
  assert.match(validationTargetSource, /V6_VALIDATION_TARGETS_VERSION/);
  assert.match(validationTargetSource, /split_playwright_smokes/);
  assert.match(validationTargetSource, /runtime_tool_absence/);
  assert.match(validationTargetSource, /release_candidate_run/);
  assert.match(validationTargetSource, /artifact_traceability/);
  assert.match(skillLine, /V6 aggregate readiness gate/);
  assert.match(plan, /Source branch: `codex\/v6-agent-civilization-milestones`/);
  assert.match(plan, /broad V5 prototype overrides do not enable V6/);
  assert.match(plan, /same-session player-route prerequisite proof/);
  assert.match(plan, /e2e\/245_world_grid_player_route_prerequisite\.spec\.js/);
  assert.match(spec, /FEATURE_WORLD_V60_AGENT_CIVILIZATION/);
  assert.match(spec, /WORLD_GRID_FEATURE_FLAGS=all/);
  assert.match(gate, /Broad V5 prototype overrides/);
  assert.match(gate, /Production player query\/header overrides must not enable V6\.0/);
  assert.match(plan, /M6 Worker-first V6 tool surface \| `in_progress`/);
  assert.match(plan, /server\/world_civilization\/tools\.js/);
  assert.match(plan, /server\/world_civilization\/tool_exposure_gate\.js/);
  assert.match(plan, /server\/world_civilization\/worker_runtime_registration\.js/);
  assert.match(plan, /server\/world_civilization\/worker_tool_adapter\.js/);
  assert.match(plan, /server\/world_civilization\/worker_vote_adapter\.js/);
  assert.match(plan, /V6_CIVIC_WORKER_TOOL_ADAPTER_ENABLED/);
  assert.match(plan, /V6_CIVIC_WORKER_VOTE_ADAPTER_ENABLED/);
  assert.match(plan, /et\.world\.civic\.proposals\.submit_for_review/);
  assert.match(plan, /et\.world\.civic\.votes\.cast/);
  assert.match(plan, /store-backed `proposal_drafting` delegation/);
  assert.match(plan, /idempotent delegated action-budget consumption/);
  assert.match(plan, /OpenClaw Lite worker origin/);
  assert.match(plan, /browser worker runtime registration target matrix/);
  assert.match(plan, /shared-state route adapters/);
  assert.match(spec, /research-only civic tool draft/);
  assert.match(spec, /tool exposure gate/);
  assert.match(toolSpec, /Worker runtime registration target/);
  assert.match(toolSpec, /server\/world_civilization\/worker_runtime_registration\.js/);
  assert.match(toolSpec, /tests\/world_civilization_worker_runtime_registration\.test\.js/);
  assert.match(toolSpec, /browser OpenClaw Lite worker boot evidence/);
  assert.match(toolSpec, /Worker Tool Adapter/);
  assert.match(toolSpec, /server\/world_civilization\/worker_tool_adapter\.js/);
  assert.match(toolSpec, /Worker Vote Adapter/);
  assert.match(toolSpec, /server\/world_civilization\/worker_vote_adapter\.js/);
  assert.match(toolSpec, /V6_CIVIC_WORKER_TOOL_ADAPTER_ENABLED/);
  assert.match(toolSpec, /V6_CIVIC_WORKER_VOTE_ADAPTER_ENABLED/);
  assert.match(toolSpec, /et\.world\.civic\.proposals\.submit_for_review/);
  assert.match(toolSpec, /et\.world\.civic\.votes\.cast/);
  assert.match(toolSpec, /Idempotent delegated action-budget consumption/);
  assert.match(toolSpec, /runtime `\/api\/world\/tools`/);
  assert.match(workerRuntimeRegistrationSource, /V6_WORKER_RUNTIME_REGISTRATION_VERSION/);
  assert.match(workerRuntimeRegistrationSource, /openclaw_worker_boot/);
  assert.match(workerRuntimeRegistrationSource, /shared_state_route_adapter/);
  assert.match(workerRuntimeRegistrationSource, /registersRuntimeCivicTools: false/);
  assert.match(gate, /server\/world_civilization\/tools\.js/);
  assert.match(gate, /server\/world_civilization\/tool_exposure_gate\.js/);
  assert.match(gate, /server\/world_civilization\/worker_runtime_registration\.js/);
  assert.match(gate, /browser OpenClaw Lite worker boot/);
  assert.match(gate, /hidden from runtime `\/api\/world\/tools`/);
  assert.match(plan, /M7 Internal proposal lifecycle \| `in_progress`/);
  assert.match(plan, /proposal draft\/review audit entries now include privacy-safe before\/after summaries/);
  assert.match(plan, /buildV6ProposalSubmissionEnvelope\(\)/);
  assert.match(plan, /submitProposalForReview\(\)/);
  assert.match(plan, /server\/world_civilization\/routes\.js/);
  assert.match(plan, /server\/world_civilization\/store_wiring\.js/);
  assert.match(plan, /V6_CIVIC_PROPOSAL_SUBMISSION_ROUTE_ENABLED/);
  assert.match(plan, /V6_CIVIC_PROPOSAL_STORE_WIRING_ENABLED/);
  assert.match(plan, /consumes `proposal_drafting` delegated action budget idempotently for hidden worker-tool route receipts/);
  assert.match(plan, /browser worker registration/);
  assert.match(plan, /same-origin\/CSRF-reviewed M5 security/);
  assert.match(plan, /getProposalReviewQueueSnapshot\(\)/);
  assert.match(plan, /buildV6ProposalIntakeReadinessGate\(\)/);
  assert.match(plan, /human route submission, worker tool submission/);
  assert.match(plan, /approval receipt binding/);
  assert.match(plan, /proposal-submission mutation security/);
  assert.match(plan, /worker-tool origin enforcement/);
  assert.match(plan, /review-queue snapshot/);
  assert.match(plan, /reviewed\/expired queue exclusion/);
  assert.match(plan, /no civic tool exposure/);
  assert.match(proposalSpec, /privacy-safe before\/after summary/);
  assert.match(proposalSpec, /proposal\.reviewed`\s+audit ledger entry with privacy-safe before\/after status summaries/);
  assert.match(proposalSpec, /Submission Envelope/);
  assert.match(proposalSpec, /buildV6ProposalSubmissionEnvelope\(\)/);
  assert.match(proposalSpec, /POST \/api\/world\/civilization\/proposals\/submit/);
  assert.match(proposalSpec, /V6_CIVIC_PROPOSAL_SUBMISSION_ROUTE_ENABLED/);
  assert.match(proposalSpec, /V6_CIVIC_PROPOSAL_STORE_WIRING_ENABLED/);
  assert.match(proposalSpec, /Hidden worker-tool route submissions consume\s+`proposal_drafting` delegated action budget/);
  assert.match(proposalSpec, /CIVIC_PROPOSAL_SUBMISSION_DENIED/);
  assert.match(proposalSpec, /worker_tool_adapter\.js/);
  assert.match(proposalSpec, /proposal_drafting/);
  assert.match(proposalSpec, /Review Queue Snapshot/);
  assert.match(proposalSpec, /V6_PROPOSAL_REVIEW_QUEUE_VERSION/);
  assert.match(proposalSpec, /Proposal Intake Readiness Gate/);
  assert.match(proposalSpec, /exposesCivicTools: false/);
  assert.match(proposalSource, /beforeSummary/);
  assert.match(proposalSource, /afterSummary/);
  assert.match(proposalSource, /buildV6ProposalSubmissionEnvelope/);
  assert.match(proposalSource, /submitProposalForReview/);
  assert.match(proposalSource, /V6_PROPOSAL_SUBMISSION_ENVELOPE_VERSION/);
  assert.match(proposalSource, /getProposalReviewQueueSnapshot/);
  assert.match(proposalSource, /V6_PROPOSAL_REVIEW_QUEUE_VERSION/);
  assert.match(proposalSource, /buildV6ProposalIntakeReadinessGate/);
  assert.match(proposalSource, /REQUIRED_PROPOSAL_SUBMISSION_SURFACES/);
  assert.match(proposalRouteSource, /PROPOSAL_SUBMISSION_ROUTE/);
  assert.match(proposalRouteSource, /createWorldCivilizationRouter/);
  assert.match(proposalRouteSource, /V6_CIVIC_PROPOSAL_SUBMISSION_ROUTE_ENABLED/);
  assert.match(proposalRouteSource, /resolveProposalStores/);
  assert.match(proposalRouteSource, /buildV6ProposalSubmissionEnvelope/);
  assert.match(proposalRouteSource, /buildV6CivicMutationSecurityEnvelope/);
  assert.match(proposalRouteSource, /consumeRouteDelegatedAction/);
  assert.match(proposalRouteSource, /delegatedActionUse/);
  assert.match(proposalRouteSource, /submitProposalForReview/);
  assert.match(proposalStoreWiringSource, /V6_CIVIC_PROPOSAL_STORE_WIRING_ENABLED/);
  assert.match(proposalStoreWiringSource, /V6_CIVIC_AUDIT_SQLITE_PATH/);
  assert.match(proposalStoreWiringSource, /V6_CIVIC_PROPOSAL_SQLITE_PATH/);
  assert.match(proposalStoreWiringSource, /V6_CIVIC_DELEGATION_SQLITE_PATH/);
  assert.match(proposalStoreWiringSource, /getConfiguredWorldCivilizationProposalStores/);
  assert.match(proposalStoreWiringSource, /releaseReady: false/);
  assert.match(workerToolAdapterSource, /V6_CIVIC_WORKER_TOOL_ADAPTER_VERSION/);
  assert.match(workerToolAdapterSource, /WORKER_PROPOSAL_SUBMIT_TOOL_NAME/);
  assert.match(workerToolAdapterSource, /V6_CIVIC_WORKER_TOOL_ADAPTER_ENABLED/);
  assert.match(workerToolAdapterSource, /submitProposalForReviewFromWorkerTool/);
  assert.match(workerToolAdapterSource, /buildV6CivicMutationSecurityEnvelope/);
  assert.match(workerToolAdapterSource, /proposal_drafting/);
  assert.match(workerToolAdapterSource, /consumeDelegatedAction/);
  assert.match(workerToolAdapterSource, /delegatedActionUse/);
  assert.match(workerToolAdapterSource, /sameOriginCsrfReviewed/);
  assert.match(workerToolAdapterSource, /runtimeExposed: false/);
  assert.match(workerToolAdapterSource, /executesProposalEffects: false/);
  assert.match(workerVoteAdapterSource, /V6_CIVIC_WORKER_VOTE_ADAPTER_VERSION/);
  assert.match(workerVoteAdapterSource, /WORKER_VOTE_CAST_TOOL_NAME/);
  assert.match(workerVoteAdapterSource, /V6_CIVIC_WORKER_VOTE_ADAPTER_ENABLED/);
  assert.match(workerVoteAdapterSource, /castVoteFromWorkerTool/);
  assert.match(workerVoteAdapterSource, /buildV6CivicMutationSecurityEnvelope/);
  assert.match(workerVoteAdapterSource, /buildV6VoteRouteAuthorizationEnvelope/);
  assert.match(workerVoteAdapterSource, /vote_advice/);
  assert.match(workerVoteAdapterSource, /consumeDelegatedAction/);
  assert.match(workerVoteAdapterSource, /delegatedActionUse/);
  assert.match(workerVoteAdapterSource, /sameOriginCsrfReviewed/);
  assert.match(workerVoteAdapterSource, /recordsVote: true/);
  assert.match(workerVoteAdapterSource, /appliesVoteOutcome: false/);
  assert.match(gate, /POST \/api\/world\/civilization\/proposals\/submit/);
  assert.match(gate, /V6_CIVIC_PROPOSAL_SUBMISSION_ROUTE_ENABLED/);
  assert.match(gate, /V6_CIVIC_PROPOSAL_STORE_WIRING_ENABLED/);
  assert.match(gate, /V6_CIVIC_WORKER_TOOL_ADAPTER_ENABLED/);
  assert.match(gate, /worker proposal adapter/);
  assert.match(gate, /fail\s+closed when the default app mount lacks\s+release-grade store wiring/);
  assert.match(serverIndex, /createWorldCivilizationRouter/);
  assert.match(serverIndex, /resolveWorldCivilizationIdentity/);
  assert.match(serverIndex, /getConfiguredWorldCivilizationProposalStores/);
  assert.match(readinessSource, /proposal_intake_readiness_gate/);
  assert.match(readinessSource, /submission_envelope/);
  assert.match(readinessSource, /proposal_submission_mutation_security/);
  assert.match(readinessSource, /review_queue_snapshot/);
  assert.match(readinessSource, /server\/world_civilization\/routes\.js/);
  assert.match(readinessSource, /server\/world_civilization\/store_wiring\.js/);
  assert.match(readinessSource, /server\/world_civilization\/worker_tool_adapter\.js/);
  assert.match(readinessSource, /server\/world_civilization\/worker_vote_adapter\.js/);
  assert.match(readinessSource, /tests\/world_civilization_routes\.test\.js/);
  assert.match(readinessSource, /tests\/world_civilization_worker_tool_adapter\.test\.js/);
  assert.match(readinessSource, /tests\/world_civilization_worker_vote_adapter\.test\.js/);
  assert.match(releaseReview, /worker-origin proposal tool adapter/);
  assert.match(releaseReview, /worker-origin vote tool adapter/);
  assert.match(releaseReview, /proposal route reopen/);
  assert.match(releaseReview, /idempotent `proposal_drafting` delegated action-budget consumption/);
  assert.match(releaseReview, /missing worker observability/);
  assert.match(releaseReview, /missing delegation/);
  assert.match(releaseReview, /browser worker registration/);
  assert.match(releaseReviewSource, /server\/world_civilization\/worker_tool_adapter\.js/);
  assert.match(releaseReviewSource, /server\/world_civilization\/worker_vote_adapter\.js/);
  assert.match(releaseReviewSource, /server\/world_civilization\/routes\.js/);
  assert.match(releaseReviewSource, /tests\/world_civilization_worker_tool_adapter\.test\.js/);
  assert.match(releaseReviewSource, /tests\/world_civilization_worker_vote_adapter\.test\.js/);
  assert.match(releaseReviewSource, /tests\/world_civilization_routes\.test\.js/);
  assert.match(plan, /M8 Vote authorization and delegation \| `in_progress`/);
  assert.match(plan, /evaluateVoteApprovalPolicy\(\)/);
  assert.match(plan, /buildV6VoteRouteAuthorizationEnvelope\(\)/);
  assert.match(plan, /non-recording route-edge guard/);
  assert.match(plan, /M5 mutation-security envelope/);
  assert.match(plan, /POST \/api\/world\/civilization\/votes\/cast/);
  assert.match(plan, /V6_CIVIC_VOTE_ROUTE_ENABLED/);
  assert.match(plan, /V6_CIVIC_VOTE_STORE_WIRING_ENABLED/);
  assert.match(plan, /V6_CIVIC_VOTE_SQLITE_PATH/);
  assert.match(plan, /consumes `vote_advice` delegated action budget idempotently for hidden delegated-agent route receipts/);
  assert.match(plan, /worker-tool vote registration/);
  assert.match(plan, /castVoteFromWorkerTool\(\)/);
  assert.match(plan, /server\/world_civilization\/voting_templates\.js/);
  assert.match(plan, /buildV6VotingTemplateReviewReport\(\)/);
  assert.match(plan, /public-world, public-works, sandbox-policy, institution-charter, and service-policy/);
  assert.match(plan, /vote\.recorded` audit rows with privacy-safe before\/after summaries/);
  assert.match(plan, /buildV6VoteAuthorizationReadinessGate\(\)/);
  assert.match(plan, /route-edge vote auth/);
  assert.match(plan, /per-institution voting templates/);
  assert.match(plan, /quorumMinVotes/);
  assert.match(plan, /approvalThresholdBps/);
  assert.match(gate, /evaluateVoteApprovalPolicy\(\)/);
  assert.match(gate, /M8 research-only vote authorization readiness gate/);
  assert.match(gate, /store-specific privacy-safe audit summaries for proposal\/vote records/);
  assert.match(gate, /appliesVoteOutcome: false/);
  assert.match(gate, /per-institution voting templates/);
  assert.match(voteSpec, /privacy-safe before\/after summary/);
  assert.match(voteSpec, /Route-Edge Authorization Envelope/);
  assert.match(voteSpec, /Research Vote Route/);
  assert.match(voteSpec, /POST \/api\/world\/civilization\/votes\/cast/);
  assert.match(voteSpec, /V6_CIVIC_VOTE_ROUTE_ENABLED/);
  assert.match(voteSpec, /V6_CIVIC_VOTE_STORE_WIRING_ENABLED/);
  assert.match(voteSpec, /consumes `vote_advice`\s+delegated action budget idempotently/);
  assert.match(voteSpec, /buildV6VoteRouteAuthorizationEnvelope\(\)/);
  assert.match(voteSpec, /assertV6VoteRouteAuthorizationEnvelopeSafe\(\)/);
  assert.match(voteSpec, /store-backed `vote_advice` delegation proof/);
  assert.match(voteSpec, /Worker Vote Adapter/);
  assert.match(voteSpec, /server\/world_civilization\/worker_vote_adapter\.js/);
  assert.match(voteSpec, /V6_CIVIC_WORKER_VOTE_ADAPTER_ENABLED/);
  assert.match(voteSpec, /castVoteFromWorkerTool\(\)/);
  assert.match(voteSpec, /Voting Template Review/);
  assert.match(voteSpec, /server\/world_civilization\/voting_templates\.js/);
  assert.match(voteSpec, /buildV6VotingTemplateReviewReport\(\)/);
  assert.match(voteSpec, /pending_release_review/);
  assert.match(releaseReview, /Vote authorization readiness review/);
  assert.match(releaseReview, /hidden vote route\/store wiring/);
  assert.match(releaseReview, /V6_CIVIC_VOTE_ROUTE_ENABLED/);
  assert.match(releaseReview, /V6_CIVIC_VOTE_STORE_WIRING_ENABLED/);
  assert.match(releaseReview, /consumes `vote_advice` delegated action budget idempotently/);
  assert.match(releaseReview, /worker-tool vote registration/);
  assert.match(releaseReview, /V6_CIVIC_WORKER_VOTE_ADAPTER_ENABLED/);
  assert.match(releaseReview, /vote authorization readiness gate/);
  assert.match(readinessSource, /vote_authorization_readiness_gate/);
  assert.match(readinessSource, /worker_tool_vote_registration/);
  assert.match(readinessSource, /vote_route_store_wiring/);
  assert.match(releaseReviewSource, /hidden_vote_route_store_wiring/);
  assert.match(releaseReviewSource, /worker_tool_vote_registration/);
  assert.match(voteSource, /REQUIRED_VOTE_AUTHORIZATION_EVIDENCE_CHECKS/);
  assert.match(voteSource, /beforeSummary/);
  assert.match(voteSource, /afterSummary/);
  assert.match(voteSource, /route_edge_vote_auth/);
  assert.match(voteSource, /V6_VOTE_AUTHORIZATION_READINESS_RELEASE_READY_FORBIDDEN/);
  assert.match(proposalRouteSource, /VOTE_CAST_ROUTE/);
  assert.match(proposalRouteSource, /V6_CIVIC_VOTE_ROUTE_ENABLED/);
  assert.match(proposalRouteSource, /buildV6VoteRouteAuthorizationEnvelope/);
  assert.match(proposalRouteSource, /recordVote/);
  assert.match(proposalStoreWiringSource, /V6_CIVIC_VOTE_STORE_WIRING_ENABLED/);
  assert.match(proposalStoreWiringSource, /V6_CIVIC_VOTE_SQLITE_PATH/);
  assert.match(proposalStoreWiringSource, /getConfiguredWorldCivilizationVoteStores/);
  assert.match(plan, /M9 Reputation and accountability \| `in_progress`/);
  assert.match(plan, /server\/world_civilization\/reputation\.js/);
  assert.match(plan, /reputation dispute\/review/);
  assert.match(plan, /human dispute requesters/);
  assert.match(plan, /privacy-safe before\/after audit summaries for reputation\/dispute records/);
  assert.match(plan, /require an existing moderation decision linked to the reputation record source/);
  assert.match(plan, /buildV6ReputationEligibilityAdviceGate\(\)/);
  assert.match(plan, /no score mutation/);
  assert.match(plan, /no agent authority grant/);
  assert.match(reputationSpec, /requireModerationDecisionForDisputes/);
  assert.match(reputationSpec, /CIVIC_REPUTATION_DISPUTE_MODERATION_DECISION_REQUIRED/);
  assert.match(reputationSpec, /CIVIC_REPUTATION_DISPUTE_MODERATION_DECISION_MISMATCH/);
  assert.match(reputationSpec, /privacy-safe before\/after\s+summaries/);
  assert.match(reputationSpec, /Eligibility and Advice Readiness Gate/);
  assert.match(reputationSpec, /mutatesReputationScore: false/);
  assert.match(reputationSource, /beforeSummary/);
  assert.match(reputationSource, /afterSummary/);
  assert.match(reputationSource, /buildV6ReputationEligibilityAdviceGate/);
  assert.match(reputationSource, /REQUIRED_REPUTATION_SOURCE_KINDS/);
  assert.match(gate, /server\/world_civilization\/reputation\.js/);
  assert.match(gate, /moderation-decision links that must match the reputation record source/);
  assert.match(gate, /privacy-safe before\/after audit summaries/);
  assert.match(gate, /reputation\.disputed/);
  assert.match(gate, /reputation eligibility advice gate/i);
  assert.match(readinessSource, /reputation_eligibility_advice_gate/);
  assert.match(releaseReview, /Reputation eligibility and advice review/);
  assert.match(plan, /M10 Moderation and privacy layer \| `in_progress`/);
  assert.match(plan, /server\/world_civilization\/moderation\.js/);
  assert.match(plan, /moderation review\/appeal/);
  assert.match(plan, /privacy-safe before\/after audit summaries/);
  assert.match(plan, /abuse-report source references/);
  assert.match(plan, /buildV6ModerationPrivacyReadinessGate\(\)/);
  assert.match(plan, /no moderation effect application/);
  assert.match(plan, /no content publication/);
  assert.match(moderationSpec, /reputation disputes may optionally require a moderation-store link/);
  assert.match(moderationSpec, /privacy-safe\s+before\/after summaries/);
  assert.match(moderationSpec, /Moderation Privacy Readiness Gate/);
  assert.match(moderationSpec, /appliesModerationEffects: false/);
  assert.match(moderationSource, /beforeSummary/);
  assert.match(moderationSource, /afterSummary/);
  assert.match(moderationSource, /buildV6ModerationPrivacyReadinessGate/);
  assert.match(moderationSource, /REQUIRED_MODERATION_SURFACES/);
  assert.match(gate, /server\/world_civilization\/moderation\.js/);
  assert.match(gate, /required public-source review link for reputation disputes/);
  assert.match(gate, /moderation privacy readiness gate/i);
  assert.match(gate, /moderation\.reviewed/);
  assert.match(gate, /moderation\.appealed/);
  assert.match(readinessSource, /moderation_privacy_readiness_gate/);
  assert.match(releaseReview, /Moderation privacy readiness review/);
  assert.match(plan, /M11 Civic effect execution and rollback \| `in_progress`/);
  assert.match(plan, /server\/world_civilization\/effects\.js/);
  assert.match(plan, /server\/world_civilization\/governance_preflight\.js/);
  assert.match(plan, /recordProposalReview\(\)/);
  assert.match(plan, /ready_for_vote/);
  assert.match(plan, /proposal\.reviewed/);
  assert.match(plan, /proposal review-ready state, approved moderation, vote approval policy, human approval receipt/);
  assert.match(plan, /schema-level typed effect handler registry/);
  assert.match(plan, /prepared-effect audit rows include privacy-safe before\/after summaries/);
  assert.match(effectSpec, /privacy-safe before\/after summaries/);
  assert.match(effectSource, /beforeSummary/);
  assert.match(effectSource, /afterSummary/);
  assert.match(plan, /buildV6CivicEffectExecutionGate\(\)/);
  assert.match(plan, /typed apply handlers, typed rollback handlers/);
  assert.match(plan, /release-signed conservation\/rollback execution/);
  assert.match(plan, /server\/world_civilization\/rollback_recovery\.js/);
  assert.match(plan, /server\/world_civilization\/rollback_execution_targets\.js/);
  assert.match(plan, /tests\/world_civilization_rollback_execution_targets\.test\.js/);
  assert.match(plan, /typed rollback execution target matrix/);
  assert.match(plan, /without executing state/);
  assert.match(gate, /server\/world_civilization\/effects\.js/);
  assert.match(gate, /server\/world_civilization\/governance_preflight\.js/);
  assert.match(gate, /schema-level typed effect handler registry/);
  assert.match(gate, /typed apply handler\s+evidence/);
  assert.match(gate, /irreversible-action review/);
  assert.match(gate, /executable typed handlers/);
  assert.match(gate, /server\/world_civilization\/rollback_recovery\.js/);
  assert.match(gate, /tests\/world_civilization_rollback_recovery\.test\.js/);
  assert.match(gate, /server\/world_civilization\/rollback_execution_targets\.js/);
  assert.match(gate, /tests\/world_civilization_rollback_execution_targets\.test\.js/);
  assert.match(gate, /[Tt]yped rollback execution target coverage/);
  assert.match(effectSpec, /Rollback execution target report/);
  assert.match(effectSpec, /server\/world_civilization\/rollback_execution_targets\.js/);
  assert.match(effectSpec, /rollback recovery execution drill/);
  assert.match(rollbackExecutionTargetSource, /REQUIRED_ROLLBACK_EXECUTION_TARGET_CHECKS/);
  assert.match(rollbackExecutionTargetSource, /rollback_recovery_execution_drill/);
  assert.match(rollbackExecutionTargetSource, /V6_ROLLBACK_EXECUTION_TARGETS_VERSION/);
  assert.match(rollbackExecutionTargetSource, /executionEnabled: false/);
  assert.match(plan, /M12 Agent participation controls \| `in_progress`/);
  assert.match(plan, /server\/world_civilization\/delegations\.js/);
  assert.match(plan, /idempotent action-budget consumption/);
  assert.match(plan, /allowDelegatedExecution/);
  assert.match(plan, /read-only active `civic_execution` delegation proof/);
  assert.match(plan, /privacy-safe lifecycle before\/after summaries/);
  assert.match(delegationSpec, /privacy-safe before\/after\s+summaries/);
  assert.match(delegationSource, /beforeSummary/);
  assert.match(delegationSource, /afterSummary/);
  assert.match(plan, /buildV6AgentParticipationEnforcementGate\(\)/);
  assert.match(plan, /route-edge scope\/expiry\/budget\/revocation checks/);
  assert.match(plan, /no public autonomous mutation/);
  assert.match(gate, /server\/world_civilization\/delegations\.js/);
  assert.match(gate, /loose boolean flag/);
  assert.match(gate, /delegation\.action_consumed/);
  assert.match(gate, /M12\s+research-only enforcement gate/);
  assert.match(gate, /principal wallet\/session binding/);
  assert.match(gate, /delegatedExecutionEnabled: false/);
  assert.match(plan, /M13 Civic institutions and charters \| `in_progress`/);
  assert.match(plan, /server\/world_civilization\/institutions\.js/);
  assert.match(plan, /proposal\/vote\/moderation-gated charter amendment/);
  assert.match(plan, /privacy-safe before\/after charter summaries/);
  assert.match(institutionSpec, /privacy-safe before\/after summaries/);
  assert.match(institutionSource, /beforeSummary/);
  assert.match(institutionSource, /afterSummary/);
  assert.match(plan, /buildV6CivicInstitutionReadinessGate\(\)/);
  assert.match(plan, /charter-change execution\/rollback/);
  assert.match(plan, /public-world, public-works, sandbox-policy, institution-charter, and service-policy templates/);
  assert.match(gate, /server\/world_civilization\/institutions\.js/);
  assert.match(gate, /institution\.charter_amendment\.recorded/);
  assert.match(gate, /M13\s+research-only institution readiness gate/);
  assert.match(gate, /appliesCharterChange: false/);
  assert.match(institutionSpec, /buildV6CivicInstitutionReadinessGate\(\)/);
  assert.match(institutionSpec, /public-world, public-works,\s+sandbox-policy, institution-charter, and service-policy templates/);
  assert.match(institutionSource, /REQUIRED_INSTITUTION_TEMPLATE_EVIDENCE_CHECKS/);
  assert.match(institutionSource, /charter_change_rollback_review/);
  assert.match(institutionSource, /V6_CIVIC_INSTITUTION_READINESS_RELEASE_READY_FORBIDDEN/);
  assert.match(plan, /M14 Public works and shared resources integration \| `in_progress`/);
  assert.match(plan, /server\/world_civilization\/public_works\.js/);
  assert.match(plan, /proposal\/vote\/moderation-gated public works project/);
  assert.match(plan, /privacy-safe before\/after bundle summaries/);
  assert.match(publicWorksSpec, /privacy-safe before\/after audit summaries/);
  assert.match(publicWorksSource, /beforeSummary/);
  assert.match(publicWorksSource, /afterSummary/);
  assert.match(plan, /buildV6PublicWorksReadinessGate\(\)/);
  assert.match(plan, /explicit inventory-spend authorization/);
  assert.match(plan, /no public free play/);
  assert.match(gate, /server\/world_civilization\/public_works\.js/);
  assert.match(gate, /public_works\.project\.recorded|proposal\/vote\/moderation-gated\s+project records/);
  assert.match(gate, /M14\s+research-only public works readiness gate/);
  assert.match(gate, /opensPublicContributionRoute: false/);
  assert.match(publicWorksSpec, /buildV6PublicWorksReadinessGate\(\)/);
  assert.match(publicWorksSpec, /reward-claim, rollback, and public-surface route contracts/);
  assert.match(publicWorksSource, /REQUIRED_PUBLIC_WORKS_INTEGRATION_EVIDENCE_CHECKS/);
  assert.match(publicWorksSource, /reward_cosmetic_or_conservation_tests/);
  assert.match(publicWorksSource, /V6_PUBLIC_WORKS_READINESS_RELEASE_READY_FORBIDDEN/);
  assert.match(plan, /M15 Modal-first V6 lab surface \| `in_progress`/);
  assert.match(plan, /server\/world_civilization\/lab_surface\.js/);
  assert.match(plan, /fail-closed modal launch plan/);
  assert.match(plan, /buildV6LabReadinessGate\(\)/);
  assert.match(plan, /browser visual coverage at 390\/768\/1280 widths/);
  assert.match(plan, /runtime tool absence/);
  assert.match(plan, /e2e\/244_v6_lab_modal_boundary\.spec\.js/);
  assert.match(plan, /normal `\/app` gameplay exposes no V6 lab markers or `et\.world\.civic\.\*` tools by default/);
  assert.match(plan, /\/v6.*\/v6-lab.*\/civilization/);
  assert.match(gate, /server\/world_civilization\/lab_surface\.js/);
  assert.match(gate, /e2e\/244_v6_lab_modal_boundary\.spec\.js/);
  assert.match(gate, /town hub modal flow/);
  assert.match(gate, /fail-closed modal launch\s+plan|fail closed for standalone\s+V6 paths/);
  assert.match(gate, /M15\s+research-only lab\s+readiness gate/);
  assert.match(gate, /standaloneRouteAllowed: false/);
  assert.match(labSpec, /buildV6LabReadinessGate\(\)/);
  assert.match(labSpec, /e2e\/244_v6_lab_modal_boundary\.spec\.js/);
  assert.match(labSpec, /redirects those standalone paths to\s+`\/app`/);
  assert.match(labSpec, /390\/768\/1280 widths/);
  assert.match(labSource, /REQUIRED_LAB_EVIDENCE_CHECKS/);
  assert.match(labSource, /runtime_tool_absence/);
  assert.match(labSource, /V6_LAB_READINESS_RELEASE_READY_FORBIDDEN/);
  assert.match(serverIndex, /V6_LAB_STANDALONE_PATHS/);
  assert.match(serverIndex, /v6LabStandaloneRedirectPath/);
  assert.match(labE2e, /V6_LAB_STANDALONE_PATHS/);
  assert.match(labE2e, /toBe\('\/app'\)/);
  assert.match(labE2e, /et\.world\.civic/);
  assert.match(plan, /M16 Persistence, replay, and resilience hardening \| `in_progress`/);
  assert.match(plan, /server\/world_civilization\/resilience\.js/);
  assert.match(plan, /server\/world_civilization\/sqlite_schema\.js/);
  assert.match(plan, /v1 on-disk schema metadata/);
  assert.match(plan, /server\/world_civilization\/replay_reconstruction\.js/);
  assert.match(plan, /before\/after audit summary presence/);
  assert.match(plan, /hash-only fallbacks/);
  assert.match(plan, /V6_CIVIC_AUDIT_SUMMARY_COVERAGE/);
  assert.match(plan, /store-specific zero hash-only fallback proof/);
  assert.match(plan, /server\/world_civilization\/migration_rehearsal\.js/);
  assert.match(plan, /tests\/world_civilization_migration_rehearsal\.test\.js/);
  assert.match(plan, /unsupported upgrade\/downgrade targets fail closed/);
  assert.match(plan, /server\/world_civilization\/migration_load_replay\.js/);
  assert.match(plan, /tests\/world_civilization_migration_load_replay\.test\.js/);
  assert.match(plan, /migration-load replay/);
  assert.match(persistenceSpec, /server\/world_civilization\/migration_rehearsal\.js/);
  assert.match(persistenceSpec, /server\/world_civilization\/migration_load_replay\.js/);
  assert.match(persistenceSpec, /tests\/world_civilization_migration_load_replay\.test\.js/);
  assert.match(persistenceSpec, /V6_CIVIC_AUDIT_SUMMARY_COVERAGE/);
  assert.match(persistenceSpec, /Manual audit-ledger rows without store-provided summaries/);
  assert.match(persistenceSpec, /tests\/world_civilization_migration_rehearsal\.test\.js/);
  assert.match(persistenceSpec, /Unsupported upgrade\/downgrade targets fail closed/);
  assert.match(persistenceSpec, /before\/after audit summary presence/);
  assert.match(persistenceSpec, /zero\s+hash-only summary fallbacks for those governance records/);
  assert.match(persistenceSpec, /zero hash-only summary fallbacks for\s+those privacy records/);
  assert.match(persistenceSpec, /zero hash-only summary fallbacks for those rollback records/);
  assert.match(persistenceSpec, /zero hash-only summary\s+fallbacks for those participation records/);
  assert.match(persistenceSpec, /zero\s+hash-only summary fallbacks for\s+those institution records/);
  assert.match(persistenceSpec, /zero\s+hash-only summary fallbacks for those\s+shared-resource records/);
  assert.match(persistenceSpec, /missing-summary denial/);
  assert.match(auditSpec, /beforeSummary/);
  assert.match(auditSpec, /hash-only fallbacks/);
  assert.match(schemaSpec, /privacy-safe before\/after summaries/);
  assert.match(plan, /server\/world_civilization\/load_rate_targets\.js/);
  assert.match(plan, /tests\/world_civilization_load_rate_targets\.test\.js/);
  assert.match(plan, /release SLO surfaces/);
  assert.match(plan, /tests\/world_civilization_load_rate\.test\.js/);
  assert.match(plan, /research-scale replay pagination plus duplicate retry bursts/);
  assert.match(plan, /server\/world_civilization\/backup_restore\.js/);
  assert.match(plan, /tests\/world_civilization_backup_restore\.test\.js/);
  assert.match(plan, /source\/restored hash matching/);
  assert.match(plan, /server\/world_civilization\/write_contention\.js/);
  assert.match(plan, /tests\/world_civilization_write_contention\.test\.js/);
  assert.match(plan, /multi-process write-contention/);
  assert.match(plan, /tests\/world_civilization_rollback_recovery\.test\.js/);
  assert.match(plan, /prepared rollback-handle reconstruction after reopen/);
  assert.match(plan, /tests\/world_civilization_rollback_execution_targets\.test\.js/);
  assert.match(plan, /typed rollback execution target mapping/);
  assert.match(plan, /buildV6ResilienceReadinessGate\(\)/);
  assert.match(plan, /migration upgrade\/downgrade scripts/);
  assert.match(plan, /process restart probes now cover audit-ledger, proposal\/vote, reputation record\/dispute, moderation decision\/review, effect\/rollback, delegation, institution, and public-works/);
  assert.match(gate, /server\/world_civilization\/resilience\.js/);
  assert.match(gate, /M16 research-only resilience readiness gate/);
  assert.match(gate, /appliesMigration: false/);
  assert.match(gate, /appliesRollback: false/);
  assert.match(gate, /tests\/world_civilization_schema_metadata\.test\.js/);
  assert.match(gate, /unsupported SQLite `user_version`/);
  assert.match(gate, /server\/world_civilization\/load_rate_targets\.js/);
  assert.match(gate, /tests\/world_civilization_load_rate_targets\.test\.js/);
  assert.match(gate, /load-rate target/);
  assert.match(gate, /server\/world_civilization\/migration_rehearsal\.js/);
  assert.match(gate, /tests\/world_civilization_migration_rehearsal\.test\.js/);
  assert.match(gate, /unsupported upgrade\/downgrade targets fail closed/);
  assert.match(gate, /server\/world_civilization\/migration_load_replay\.js/);
  assert.match(gate, /tests\/world_civilization_migration_load_replay\.test\.js/);
  assert.match(gate, /migration-load replay/);
  assert.match(gate, /server\/world_civilization\/backup_restore\.js/);
  assert.match(gate, /tests\/world_civilization_backup_restore\.test\.js/);
  assert.match(gate, /source\/restored hashes/);
  assert.match(gate, /server\/world_civilization\/write_contention\.js/);
  assert.match(gate, /tests\/world_civilization_write_contention\.test\.js/);
  assert.match(gate, /multi-process write-contention/);
  assert.match(gate, /tests\/world_civilization_load_rate\.test\.js/);
  assert.match(gate, /larger replay pagination and duplicate retry burst/);
  assert.match(gate, /prepared rollback\s+handles can be reconstructed/);
  assert.match(gate, /rollback execution target coverage/);
  assert.match(gate, /typed\s+target matrix is explicit/);
  assert.match(gate, /server\/world_civilization\/replay_reconstruction\.js/);
  assert.match(gate, /tests\/world_civilization_process_restart\.test\.js/);
  assert.match(gate, /tests\/world_civilization_proposal_vote_process_restart\.test\.js/);
  assert.match(gate, /tests\/world_civilization_reputation_moderation_process_restart\.test\.js/);
  assert.match(gate, /tests\/world_civilization_effect_process_restart\.test\.js/);
  assert.match(gate, /tests\/world_civilization_delegation_process_restart\.test\.js/);
  assert.match(gate, /tests\/world_civilization_institution_process_restart\.test\.js/);
  assert.match(gate, /tests\/world_civilization_public_works_process_restart\.test\.js/);
  assert.match(gate, /privacy-safe before\/after summaries/);
  assert.match(gate, /hash-only summary\s+fallbacks/);
  assert.match(gate, /store-specific zero hash-only fallback proof/);
  assert.match(gate, /These current probes cover every current civic store at research scale/);
  assert.match(gate, /Release still requires release-grade process restart coverage/);
  assert.match(persistenceSpec, /buildV6ResilienceReadinessGate\(\)/);
  assert.match(persistenceSpec, /server\/world_civilization\/load_rate_targets\.js/);
  assert.match(persistenceSpec, /tests\/world_civilization_load_rate_targets\.test\.js/);
  assert.match(persistenceSpec, /calibration-only/);
  assert.match(persistenceSpec, /server\/world_civilization\/backup_restore\.js/);
  assert.match(persistenceSpec, /tests\/world_civilization_backup_restore\.test\.js/);
  assert.match(persistenceSpec, /report exposes no row\s+payloads/);
  assert.match(persistenceSpec, /no\s+migration scripts are executed/);
  assert.match(persistenceSpec, /server\/world_civilization\/write_contention\.js/);
  assert.match(persistenceSpec, /tests\/world_civilization_write_contention\.test\.js/);
  assert.match(persistenceSpec, /multi-process write contention/);
  assert.match(persistenceSpec, /server\/world_civilization\/rollback_execution_targets\.js/);
  assert.match(persistenceSpec, /tests\/world_civilization_rollback_execution_targets\.test\.js/);
  assert.match(persistenceSpec, /typed rollback execution target evidence/);
  assert.match(schemaSource, /AUDIT_HASH_ONLY_BEFORE_SUMMARY/);
  assert.match(schemaSource, /beforeSummary/);
  assert.match(replaySource, /CIVIC_REPLAY_AUDIT_SUMMARY_REQUIRED/);
  assert.match(replaySource, /summaryCoverage/);
  assert.match(resilienceSource, /REQUIRED_RESILIENCE_EVIDENCE_CHECKS/);
  assert.match(resilienceSource, /V6_CIVIC_AUDIT_SUMMARY_COVERAGE/);
  assert.match(resilienceSource, /V6_CIVIC_BACKUP_RESTORE_COVERAGE/);
  assert.match(resilienceSource, /V6_CIVIC_LOAD_RATE_TARGET_COVERAGE/);
  assert.match(resilienceSource, /V6_CIVIC_MIGRATION_LOAD_REPLAY_COVERAGE/);
  assert.match(resilienceSource, /V6_CIVIC_WRITE_CONTENTION_COVERAGE/);
  assert.match(resilienceSource, /V6_CIVIC_ROLLBACK_EXECUTION_TARGET_COVERAGE/);
  assert.match(resilienceSource, /store_specific_zero_hash_only_fallbacks/);
  assert.match(resilienceSource, /typed_rollback_execution_recovery/);
  assert.match(resilienceSource, /V6_RESILIENCE_READINESS_RELEASE_READY_FORBIDDEN/);
  assert.match(plan, /M17 Security and product release review \| `in_progress`/);
  assert.match(plan, /server\/world_civilization\/release_review\.js/);
  assert.match(plan, /server\/world_civilization\/threat_model_targets\.js/);
  assert.match(plan, /threat-model target matrix/);
  assert.match(plan, /worker\/route boundaries/);
  assert.match(plan, /rollback failure modes/);
  assert.match(plan, /server\/world_civilization\/abuse_case_targets\.js/);
  assert.match(plan, /abuse-case target matrix/);
  assert.match(plan, /public autonomous agent mutation denial/);
  assert.match(plan, /server\/world_civilization\/product_signoff_targets\.js/);
  assert.match(plan, /product signoff target matrix/);
  assert.match(plan, /go\/no-go records/);
  assert.match(plan, /server\/world_civilization\/privacy_review_targets\.js/);
  assert.match(plan, /privacy review target matrix/);
  assert.match(plan, /public surface minimization/);
  assert.match(plan, /debug\/worker trace redaction/);
  assert.match(plan, /server\/world_civilization\/data_retention_targets\.js/);
  assert.match(plan, /data-retention target matrix/);
  assert.match(plan, /subject export\/deletion boundaries/);
  assert.match(plan, /server\/world_civilization\/ci_validation_matrix_targets\.js/);
  assert.match(plan, /CI validation matrix target/);
  assert.match(plan, /trace retention/);
  assert.match(plan, /server\/world_civilization\/release_candidate_targets\.js/);
  assert.match(plan, /release-candidate target matrix/);
  assert.match(plan, /server\/world_civilization\/blocker_exception_register\.js/);
  assert.match(plan, /blocker\/exception register target/);
  assert.match(plan, /P0\/P1 clearance/);
  assert.match(plan, /server\/world_civilization\/release_observability\.js/);
  assert.match(plan, /release observability handoff/);
  assert.match(plan, /runtime tool absence monitoring/);
  assert.match(plan, /server\/world_civilization\/release_support\.js/);
  assert.match(plan, /release\s+support runbook/);
  assert.match(plan, /privacy-safe support views/);
  assert.match(plan, /controlled release handoff/);
  assert.match(plan, /server\/world_civilization\/validation_targets\.js/);
  assert.match(plan, /validation target matrix/);
  assert.match(plan, /runtime tool absence/);
  assert.match(plan, /store-backed delegation proof and scope-mismatch evidence/);
  assert.match(plan, /store-specific audit-summary coverage/);
  assert.match(gate, /server\/world_civilization\/release_review\.js/);
  assert.match(gate, /abuse-case target gate evidence/);
  assert.match(gate, /product signoff target gate evidence/);
  assert.match(gate, /threat model target gate evidence/);
  assert.match(gate, /privacy review target gate evidence/);
  assert.match(gate, /data-retention target gate evidence/);
  assert.match(gate, /CI validation matrix target gate evidence/);
  assert.match(gate, /release-candidate target gate evidence/);
  assert.match(gate, /blocker\/exception register evidence/);
  assert.match(gate, /release observability handoff/);
  assert.match(gate, /release support runbook/);
  assert.match(gate, /validation target gate evidence/);
  assert.match(gate, /threat model, privacy review, abuse-case review/);
  assert.match(gate, /store-backed delegation proof and scope-mismatch evidence/);
  assert.match(privacyReviewTargetSource, /V6_PRIVACY_REVIEW_TARGETS_VERSION/);
  assert.match(privacyReviewTargetSource, /private_town_isolation/);
  assert.match(privacyReviewTargetSource, /brain_provider_secret_exclusion/);
  assert.match(privacyReviewTargetSource, /public_text_rendering_xss/);
  assert.match(privacyReviewTargetSource, /cross_account_boundary/);
  assert.match(dataRetentionTargetSource, /V6_DATA_RETENTION_TARGETS_VERSION/);
  assert.match(dataRetentionTargetSource, /audit_ledger_retention/);
  assert.match(dataRetentionTargetSource, /subject_export_boundary/);
  assert.match(dataRetentionTargetSource, /subject_deletion_boundary/);
  assert.match(dataRetentionTargetSource, /backup_restore_retention/);
  assert.match(dataRetentionTargetSource, /retention_audit_replay/);
  assert.match(plan, /modal lab surface review/);
  assert.match(plan, /worker tool surface review/);
  assert.match(plan, /proposal intake readiness review/);
  assert.match(plan, /effect execution and rollback review/);
  assert.match(plan, /reputation eligibility\/advice readiness/);
  assert.match(plan, /moderation privacy readiness review/);
  assert.match(plan, /agent participation enforcement review/);
  assert.match(plan, /civic institution readiness review/);
  assert.match(plan, /public works readiness review/);
  assert.match(plan, /lab readiness gate/);
  assert.match(plan, /resilience readiness review/);
  assert.match(plan, /resilience readiness gate/);
  assert.match(plan, /store_specific_zero_hash_only_fallbacks/);
  assert.match(gate, /modal lab\s+surface (launch )?review/);
  assert.match(gate, /effect\s+execution and rollback review/);
  assert.match(gate, /agent participation enforcement review/);
  assert.match(gate, /civic\s+institution readiness review/);
  assert.match(gate, /public works readiness review/);
  assert.match(gate, /resilience readiness review/);
  assert.match(gate, /resilience readiness review with store-specific zero hash-only\s+fallback proof/);
  assert.match(gate, /Worker-first V6 civic tools must pass the exposure gate/);
  assert.match(releaseReview, /lab readiness gate/);
  assert.match(releaseReview, /resilience readiness gate/);
  assert.match(releaseReview, /proposal intake readiness gate/);
  assert.match(releaseReview, /non-executing M7 proposal intake readiness gate/);
  assert.match(releaseReview, /proposal-submission mutation security/);
  assert.match(releaseReview, /worker-tool origin enforcement/);
  assert.match(releaseReview, /review queue snapshots/);
  assert.match(releaseReview, /reviewed\/expired proposal queue exclusion/);
  assert.match(releaseReview, /research-only Express proposal submission route/);
  assert.match(releaseReview, /env-gated SQLite proposal\/audit\/delegation store wiring/);
  assert.match(releaseReview, /fail-closed route\/adapter tests/);
  assert.match(releaseReview, /missing route flag, missing release store wiring, denied same-origin\/CSRF evidence, missing worker observability, missing delegation, exhausted delegated action budgets, and proposal receipt conflicts without extra budget usage/);
  assert.match(releaseReview, /browser worker registration, production route-store operations review/);
  assert.match(releaseReviewSource, /server\/world_civilization\/routes\.js/);
  assert.match(releaseReviewSource, /server\/world_civilization\/store_wiring\.js/);
  assert.match(releaseReviewSource, /tests\/world_civilization_routes\.test\.js/);
  assert.match(releaseReviewSource, /server\/world_civilization\/rollback_execution_targets\.js/);
  assert.match(releaseReviewSource, /tests\/world_civilization_rollback_execution_targets\.test\.js/);
  assert.match(releaseReviewSource, /typed_rollback_execution_targets/);
  assert.match(releaseReview, /reputation eligibility advice gate/);
  assert.match(releaseReview, /Reputation eligibility and advice review/);
  assert.match(releaseReview, /moderation privacy readiness gate/);
  assert.match(releaseReview, /non-executing M10 moderation privacy readiness gate/);
  assert.match(releaseReview, /Threat model/);
  assert.match(releaseReview, /threat model target gate/);
  assert.match(releaseReview, /rollback failure modes/);
  assert.match(releaseReview, /Abuse-case review/);
  assert.match(releaseReview, /abuse-case target gate/);
  assert.match(releaseReview, /public autonomous agent mutation denial/);
  assert.match(releaseReview, /Product signoff/);
  assert.match(releaseReview, /product signoff target gate/);
  assert.match(releaseReview, /go\/no-go record/);
  assert.match(releaseReview, /Privacy review/);
  assert.match(releaseReview, /privacy review target gate/);
  assert.match(releaseReview, /public text rendering\/XSS/);
  assert.match(releaseReview, /Data-retention policy/);
  assert.match(releaseReview, /data-retention target gate/);
  assert.match(releaseReview, /backup retention expiry target/);
  assert.match(releaseReview, /CI validation matrix target gate/);
  assert.match(releaseReview, /Playwright trace retention/);
  assert.match(releaseReview, /release-candidate target gate/);
  assert.match(releaseReview, /controlled release handoff/);
  assert.match(releaseReview, /blocker\/exception register/);
  assert.match(releaseReview, /P0\/P1 clearance/);
  assert.match(releaseReview, /release observability handoff/);
  assert.match(releaseReview, /Release support runbook/);
  assert.match(releaseReview, /server\/world_civilization\/release_support\.js/);
  assert.match(releaseReview, /Release signoff packet/);
  assert.match(releaseReview, /server\/world_civilization\/release_signoff_packet\.js/);
  assert.match(releaseReview, /Release evidence manifest/);
  assert.match(releaseReview, /server\/world_civilization\/release_evidence_manifest\.js/);
  assert.match(releaseReview, /privacy-safe audit metrics/);
  assert.match(releaseReview, /validation target gate/);
  assert.match(releaseReview, /release-candidate run/);
  assert.match(releaseReview, /store-specific audit-summary coverage/);
  assert.match(releaseReview, /store-specific zero hash-only fallback proof/);
  assert.match(releaseReview, /browser visual 390\/768\/1280 coverage/);
  assert.match(releaseReviewSource, /store_specific_audit_summary_coverage/);
  assert.match(releaseReviewSource, /store_specific_zero_hash_only_fallbacks/);
  assert.match(releaseReview, /Civic institution readiness review/);
  assert.match(releaseReview, /institution readiness gate/);
  assert.match(releaseReview, /Public works readiness review/);
  assert.match(releaseReview, /public works readiness gate/);
  assert.match(releaseReview, /Persistence replay resilience readiness review/);
  assert.match(releaseReview, /typed rollback execution target coverage/);
  assert.match(skillLine, /M13 readiness gate/);
  assert.match(skillLine, /civic institution readiness review/);
  assert.match(skillLine, /M14 readiness gate/);
  assert.match(skillLine, /public works readiness review/);
  assert.match(skillLine, /M15 readiness gate/);
  assert.match(skillLine, /normal gameplay exposure denial/);
  assert.match(skillLine, /M16 readiness gate/);
  assert.match(skillLine, /V6 threat-model target gate/);
  assert.match(skillLine, /V6 abuse-case target gate/);
  assert.match(skillLine, /V6 product signoff target gate/);
  assert.match(skillLine, /V6 privacy review target gate/);
  assert.match(skillLine, /V6 data-retention target gate/);
  assert.match(skillLine, /V6 CI validation matrix target gate/);
  assert.match(skillLine, /V6 release-candidate target gate/);
  assert.match(skillLine, /V6 blocker\/exception register gate/);
  assert.match(skillLine, /V6 release observability handoff gate/);
  assert.match(skillLine, /V6 release support runbook gate/);
  assert.match(skillLine, /tests\/world_civilization_release_support\.test\.js/);
  assert.match(skillLine, /V6 release signoff packet gate/);
  assert.match(skillLine, /tests\/world_civilization_release_signoff_packet\.test\.js/);
  assert.match(skillLine, /V6 release evidence manifest gate/);
  assert.match(skillLine, /tests\/world_civilization_release_evidence_manifest\.test\.js/);
  assert.match(skillLine, /V6 validation target gate/);
  assert.match(skillLine, /store-specific audit-summary coverage/);
  assert.match(skillLine, /store_specific_zero_hash_only_fallbacks/);
  assert.match(skillLine, /resilience readiness review/);
  assert.match(skillLine, /typed rollback execution target coverage/);
  assert.match(plan, /M18 V6 controlled release completion \| `in_progress`/);
  assert.match(plan, /server\/world_civilization\/controlled_release\.js/);
  assert.match(plan, /server\/world_civilization\/controlled_release_targets\.js/);
  assert.match(plan, /controlled release target matrix/);
  assert.match(plan, /buildV6ReadinessGateReport\(\)/);
  assert.match(plan, /explicit closed V6 readiness-gate report/);
  assert.match(plan, /readiness audit-summary proof/);
  assert.match(gate, /server\/world_civilization\/controlled_release\.js/);
  assert.match(gate, /server\/world_civilization\/controlled_release_targets\.js/);
  assert.match(gate, /controlled release target gate evidence/);
  assert.match(gate, /closed readiness-gate report/);
  assert.match(gate, /readiness audit-summary proof/);
  assert.match(gate, /production feature flag safety/);
  assert.match(gate, /rollback\/disable rehearsals/);
  assert.match(gate, /blocker\/exception register clearance/);
  assert.match(gate, /privacy-safe observability/);
  assert.match(controlledRunbook, /Controlled release target gate/);
  assert.match(controlledRunbook, /Blocker register: `server\/world_civilization\/blocker_exception_register\.js`/);
  assert.match(controlledRunbook, /Release evidence manifest: `server\/world_civilization\/release_evidence_manifest\.js`/);
  assert.match(controlledRunbook, /Observability handoff: `server\/world_civilization\/release_observability\.js`/);
  assert.match(controlledRunbook, /Support runbook handoff: `server\/world_civilization\/release_support\.js`/);
  assert.match(controlledRunbook, /Release signoff packet: `server\/world_civilization\/release_signoff_packet\.js`/);
  assert.match(controlledRunbook, /no expired exceptions/);
  assert.match(controlledRunbook, /privacy-safe support view/);
  assert.match(controlledRunbook, /runtime tool absence monitor/);
  assert.match(controlledRunbook, /explicit closed V6\.0 readiness-gate report/);
  assert.match(controlledRunbook, /readiness report hidden until controlled release/);
  assert.match(controlledRunbook, /readiness audit-summary proof/);
  assert.match(controlledSpec, /controlled release target gate/);
  assert.match(controlledSpec, /server\/world_civilization\/release_operations\.js/);
  assert.match(controlledSpec, /Release operations gate/);
  assert.match(controlledSpec, /server\/world_civilization\/release_evidence_manifest\.js/);
  assert.match(controlledSpec, /release evidence manifest/);
  assert.match(controlledSpec, /server\/world_civilization\/release_support\.js/);
  assert.match(controlledSpec, /release support runbook/);
  assert.match(controlledSpec, /server\/world_civilization\/release_signoff_packet\.js/);
  assert.match(controlledSpec, /release signoff packet/);
  assert.match(controlledSpec, /blocker\/exception register/);
  assert.match(controlledSpec, /release observability handoff/);
  assert.match(controlledSpec, /M16\/M17 audit-summary proof checks/);
  assert.match(controlledSource, /BLOCKER_EXCEPTION_REGISTER_ARTIFACT/);
  assert.match(controlledSource, /RELEASE_EVIDENCE_MANIFEST_ARTIFACT/);
  assert.match(controlledSource, /RELEASE_OBSERVABILITY_ARTIFACT/);
  assert.match(controlledSource, /RELEASE_OPERATIONS_ARTIFACT/);
  assert.match(controlledSource, /RELEASE_SIGNOFF_PACKET_ARTIFACT/);
  assert.match(controlledSource, /CONTROLLED_RELEASE_TARGET_ARTIFACT/);
  assert.match(controlledSource, /v6ReadinessGateReport/);
  assert.match(controlledSource, /readiness_audit_summary_proof/);
  assert.match(controlledSource, /V6_CONTROLLED_RELEASE_READY_WITHOUT_V6_READINESS_GATE/);
  assert.match(controlledSource, /V6_READINESS_GATE_PRE_RELEASE_HIDDEN_REQUIRED/);
  assert.match(controlledTargetSource, /V6_CONTROLLED_RELEASE_TARGETS_VERSION/);
  assert.match(controlledTargetSource, /server\/world_civilization\/blocker_exception_register\.js/);
  assert.match(controlledTargetSource, /server\/world_civilization\/release_evidence_manifest\.js/);
  assert.match(controlledTargetSource, /release_evidence_manifest/);
  assert.match(controlledTargetSource, /server\/world_civilization\/release_observability\.js/);
  assert.match(controlledTargetSource, /server\/world_civilization\/release_operations\.js/);
  assert.match(controlledTargetSource, /server\/world_civilization\/release_signoff_packet\.js/);
  assert.match(controlledTargetSource, /release_signoff_packet/);
  assert.match(controlledTargetSource, /production_flag_safety/);
  assert.match(controlledTargetSource, /emergency_disable/);
  assert.match(controlledTargetSource, /post_release_verification/);
  assert.match(skillLine, /V6 controlled release target gate/);
  assert.match(skillLine, /V6 controlled release operations gate/);
  assert.match(skillLine, /tests\/world_civilization_release_operations\.test\.js/);
  assert.match(skillLine, /explicit closed V6 readiness-gate report/);
  assert.match(skillLine, /readiness audit-summary proof/);
});

test('V5 world-grid release promotion gate blocks V6 on prototype-only evidence', () => {
  const gate = read('specs/release-gates/v5_world_grid_release_promotion_gate.md');
  const v6Gate = read('specs/release-gates/v60_agent_civilization_readiness_gate.md');
  const ladder = read('docs/product/WORLD_GRID_LADDER_V5_TO_V6.md');
  const promotionTarget = read('server/world_grid/release_promotion.js');
  const promotionTargetTest = read('tests/world_grid_release_promotion.test.js');
  const requiredSlices = [
    'V5.0 Region Grid',
    'V5.1 Territory Claims and Settler Routes',
    'V5.2 Public Presence and Safe Player Discovery',
    'V5.3 Civic Service Advice Prototype',
    'V5.4 World Events and Public Works',
    'V5.5 Controlled Free-Play Sandbox Districts'
  ];
  const requiredControls = [
    /Durable persistence/,
    /Owner indexes/,
    /Schema migration versions/,
    /Restart persistence tests/,
    /same-origin\s+context, session-bound CSRF protection/,
    /rate limits/,
    /idempotency keys/,
    /append-only audit\/replay records/,
    /Production feature override tests/,
    /same-session `\/app` Founders Plot\s+entry creates the prerequisite before V5\.1\+ World Grid mutation/,
    /WORLD_GRID_PLOT_REQUIRED/
  ];

  for (const slice of requiredSlices) {
    assert.match(gate, new RegExp(slice.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), slice);
  }
  for (const control of requiredControls) {
    assert.match(gate, control);
  }
  assert.match(gate, /V6 civic institutions may not become player-visible/);
  assert.match(gate, /e2e\/245_world_grid_player_route_prerequisite\.spec\.js/);
  assert.match(gate, /server\/world_grid\/release_promotion\.js/);
  assert.match(promotionTarget, /V5_WORLD_GRID_RELEASE_PROMOTION_VERSION/);
  assert.match(promotionTarget, /release_replay_reconstruction/);
  assert.match(promotionTarget, /provider_logout_signoff/);
  assert.match(promotionTarget, /risk_rate_limit_identity/);
  assert.match(promotionTarget, /V5_WORLD_GRID_PROMOTION_V6_EXPOSURE_FORBIDDEN/);
  assert.match(promotionTargetTest, /V5 world-grid promotion report records evidence without completing release or enabling V6/);
  assert.match(v6Gate, /specs\/release-gates\/v5_world_grid_release_promotion_gate\.md/);
  assert.match(v6Gate, /server\/world_grid\/release_promotion\.js/);
  assert.match(ladder, /specs\/release-gates\/v5_world_grid_release_promotion_gate\.md/);
  assert.match(ladder, /server\/world_grid\/release_promotion\.js/);
});

test('public text rendering policy covers future V6 civic public surfaces', () => {
  const policy = read('docs/security/PUBLIC_TEXT_RENDERING_POLICY.md');
  const presence = read('docs/security/PUBLIC_PRESENCE_REDACTION_POLICY.md');
  const evidence = read('docs/release-evidence/WORLD_GRID_V50_REGION_PROTOTYPE_EVIDENCE_2026-05-26.md');
  const qaResponse = read('docs/release-evidence/V6_AGENT_CIVILIZATION_QA_BRANCH_REVIEW_RESPONSE_2026-05-28.md');
  const worldGridApp = read('public/experiences/world-grid/app.js');

  assert.match(policy, /textContent/);
  assert.match(policy, /explicit escaping/);
  assert.match(policy, /agent-authored text as untrusted/);
  assert.match(policy, /future V6 civic proposals/);
  assert.match(policy, /appendPublicText\(\)/);
  assert.match(presence, /PUBLIC_TEXT_RENDERING_POLICY\.md/);
  assert.match(evidence, /Prototype Persistence Warning/);
  assert.match(evidence, /e2e\/242_world_grid_all_features_demo_regression\.spec\.js/);
  assert.match(qaResponse, /Public presence XSS rule should become reusable/);
  assert.match(qaResponse, /appendPublicText\(\)/);
  assert.match(worldGridApp, /function appendPublicText/);
  assert.doesNotMatch(worldGridApp, /towns\.map\(\(town\) => `<p><strong>\$\{escapeHtml\(town\.townName\)\}/);
});

test('world-grid idempotency policy rejects changed retry payloads before release promotion', () => {
  const plan = read('docs/product/V6_AGENT_CIVILIZATION_MILESTONE_PLAN.md');
  const security = read('docs/security/WORLD_GRID_MUTATION_SECURITY_PLAN.md');
  const stateModel = read('docs/technical/WORLD_GRID_STATE_MODEL.md');
  const evidence = read('docs/release-evidence/WORLD_GRID_V50_REGION_PROTOTYPE_EVIDENCE_2026-05-26.md');

  assert.match(plan, /reject changed key reuse/);
  assert.match(plan, /all externally visible mutating prototype routes/);
  assert.match(security, /IDEMPOTENCY_CONFLICT/);
  assert.match(security, /process-local\s+request hash\/success response/);
  assert.match(security, /every externally\s+visible V5\.1-V5\.5 mutating route surface/);
  assert.match(security, /changed-payload conflict rejection across every externally\s+visible V5\.1-V5\.5 mutating route and tool surface after separate Node process\s+restarts/);
  assert.match(stateModel, /server\/world_grid\/idempotency\.js/);
  assert.match(stateModel, /Durable idempotency rows/);
  assert.match(evidence, /Idempotency replay guard/);
  assert.match(evidence, /every externally visible V5\.1-V5\.5 mutating route surface/);
  assert.match(evidence, /Durable idempotency foundation/);
});

test('world-grid mutation origin policy is tracked as an M5 release security control', () => {
  const plan = read('docs/product/V6_AGENT_CIVILIZATION_MILESTONE_PLAN.md');
  const security = read('docs/security/WORLD_GRID_MUTATION_SECURITY_PLAN.md');
  const stateModel = read('docs/technical/WORLD_GRID_STATE_MODEL.md');
  const evidence = read('docs/release-evidence/WORLD_GRID_V50_REGION_PROTOTYPE_EVIDENCE_2026-05-26.md');

  assert.match(plan, /M5 Mutation security controls \| `in_progress`/);
  assert.match(plan, /production mutations require same-origin context/);
  assert.match(security, /reject explicit\s+cross-origin/);
  assert.match(security, /require positive same-origin context/);
  assert.match(security, /CSRF token protection/);
  assert.match(stateModel, /same-origin mutation context in production/);
  assert.match(evidence, /Mutation origin guard/);
  assert.match(evidence, /server\/world_grid\/mutation_origin\.js/);
});

test('V6 civic mutation security envelope is tracked as an M5 release control', () => {
  const plan = read('docs/product/V6_AGENT_CIVILIZATION_MILESTONE_PLAN.md');
  const spec = read('specs/70_agent_town_v6_civic_mutation_security_foundation.md');
  const gate = read('specs/release-gates/v60_agent_civilization_readiness_gate.md');
  const security = read('docs/security/V6_CIVIC_MUTATION_SECURITY_PLAN.md');
  const skillLine = read('docs/internal-skill-testline.md');
  const sessionAuthTargets = read('server/world_civilization/session_auth_targets.js');

  assert.match(plan, /server\/world_civilization\/mutation_security\.js/);
  assert.match(plan, /server\/world_civilization\/session_auth_targets\.js/);
  assert.match(plan, /session\/wallet binding, session-bound CSRF/);
  assert.match(plan, /provider-disconnect invalidation/);
  assert.match(plan, /risk-aware rate-limit identity/);
  assert.match(plan, /delegated-agent proof/);
  assert.match(plan, /store-backed delegated-agent proof with required scope/);
  assert.match(plan, /exact delegated-action replay allowance/);
  assert.match(plan, /read-only active `civic_execution` delegation proof/);
  assert.match(spec, /Session-auth target contract/);
  assert.match(spec, /buildV6SessionAuthTargetReport\(\)/);
  assert.match(spec, /production browser session/);
  assert.match(spec, /same-origin checks/);
  assert.match(spec, /session\/wallet auth/);
  assert.match(spec, /store-backed delegated-agent\s+proof/);
  assert.match(spec, /remaining\s+action budget/);
  assert.match(spec, /Exact delegated-action replay/);
  assert.match(spec, /CSRF verification/);
  assert.match(spec, /owner\/surface rate limiting/);
  assert.match(gate, /server\/world_civilization\/mutation_security\.js/);
  assert.match(gate, /server\/world_civilization\/session_auth_targets\.js/);
  assert.match(gate, /production browser session coverage/);
  assert.match(gate, /audit actor continuity/);
  assert.match(gate, /store-backed\s+delegated-agent proof/);
  assert.match(gate, /future civic store\s+write/);
  assert.match(security, /Session-auth target contract/);
  assert.match(security, /buildV6SessionAuthTargetReport\(\)/);
  assert.match(security, /live\s+Privy\/provider logout signoff/);
  assert.match(security, /route\/tool-required scope/);
  assert.match(security, /Exact delegated-action retries/);
  assert.match(security, /mutationApplied: false/);
  assert.match(security, /durable\/session-bound CSRF/);
  assert.match(sessionAuthTargets, /V6_SESSION_AUTH_TARGETS_VERSION/);
  assert.match(sessionAuthTargets, /route_tool_middleware_integration/);
  assert.match(sessionAuthTargets, /production_browser_coverage/);
  assert.match(sessionAuthTargets, /audit_actor_continuity/);
  assert.match(skillLine, /V6 civic mutation security foundation/);
  assert.match(skillLine, /session-auth target matrix/);
  assert.match(skillLine, /tests\/world_civilization_session_auth_targets\.test\.js/);
  assert.match(skillLine, /exact same-idempotency delegated-action replay allowance/);
  assert.match(skillLine, /tests\/world_civilization_mutation_security\.test\.js/);
});

test('V6 worker-first civic tool exposure gate is tracked as an M6 release control', () => {
  const plan = read('docs/product/V6_AGENT_CIVILIZATION_MILESTONE_PLAN.md');
  const spec = read('specs/59_agent_town_v6_worker_tool_surface_draft.md');
  const gate = read('specs/release-gates/v60_agent_civilization_readiness_gate.md');
  const releaseReview = read('docs/security/V6_AGENT_CIVILIZATION_RELEASE_REVIEW.md');
  const skillLine = read('docs/internal-skill-testline.md');
  const toolGate = read('server/world_civilization/tool_exposure_gate.js');
  const workerRuntimeRegistration = read('server/world_civilization/worker_runtime_registration.js');
  const workerToolAdapter = read('server/world_civilization/worker_tool_adapter.js');
  const worldGridRegionTest = read('tests/world_grid_region.test.js');

  assert.match(plan, /server\/world_civilization\/tool_exposure_gate\.js/);
  assert.match(plan, /server\/world_civilization\/worker_runtime_registration\.js/);
  assert.match(plan, /server\/world_civilization\/worker_tool_adapter\.js/);
  assert.match(plan, /V6_CIVIC_WORKER_TOOL_ADAPTER_ENABLED/);
  assert.match(plan, /et\.world\.civic\.proposals\.submit_for_review/);
  assert.match(plan, /Worker Tools\/Skill Context\/Worker Traffic\/Brain\/Session Context/);
  assert.match(plan, /store-backed delegated-agent proof/);
  assert.match(plan, /store-backed `proposal_drafting` delegation/);
  assert.match(plan, /idempotent delegated action-budget consumption/);
  assert.match(plan, /read-only delegation budget handling/);
  assert.match(plan, /production player `worldGridFeatureFlags=all,v60` query\/header overrides cannot enable V6/);
  assert.match(plan, /server-side V6 flag still does not publish `et\.world\.civic\.\*` tools/);
  assert.match(plan, /browser worker runtime registration target matrix/);
  assert.match(plan, /shared-state route adapters/);
  assert.match(spec, /Exposure gate: `server\/world_civilization\/tool_exposure_gate\.js`/);
  assert.match(spec, /Worker runtime registration target/);
  assert.match(spec, /server\/world_civilization\/worker_runtime_registration\.js/);
  assert.match(spec, /tests\/world_civilization_worker_runtime_registration\.test\.js/);
  assert.match(spec, /Worker proposal adapter: `server\/world_civilization\/worker_tool_adapter\.js`/);
  assert.match(spec, /Worker Tool Adapter/);
  assert.match(spec, /V6_CIVIC_WORKER_TOOL_ADAPTER_ENABLED/);
  assert.match(spec, /et\.world\.civic\.proposals\.submit_for_review/);
  assert.match(spec, /OpenClaw Lite worker origin/);
  assert.match(spec, /same-origin, session\/wallet\s+binding/);
  assert.match(spec, /store-backed delegated-agent proof/);
  assert.match(spec, /distinct actions\s+fail when the delegation budget is exhausted/);
  assert.match(spec, /read-only delegation budget handling/);
  assert.match(spec, /No `et\.world\.civic\.\*` entry in the runtime tool manifest/);
  assert.match(spec, /worldGridFeatureFlags=all,v60/);
  assert.match(spec, /server-side `FEATURE_WORLD_V60_AGENT_CIVILIZATION=1` flag/);
  assert.match(gate, /releaseReady: false/);
  assert.match(gate, /Worker-first V6 civic tools must pass the exposure gate/);
  assert.match(gate, /Worker runtime\s+registration target coverage starts/);
  assert.match(gate, /shared-state route traces/);
  assert.match(gate, /store-backed delegated-agent proof/);
  assert.match(gate, /consume delegated action budget idempotently/);
  assert.match(gate, /read-only delegation budget handling/);
  assert.match(gate, /Route-level production coverage proves player `worldGridFeatureFlags=all,v60`/);
  assert.match(releaseReview, /Worker tool surface review/);
  assert.match(releaseReview, /browser worker runtime registration target/);
  assert.match(releaseReview, /server\/world_civilization\/worker_runtime_registration\.js/);
  assert.match(releaseReview, /worker-origin proposal tool adapter/);
  assert.match(releaseReview, /pending real browser worker registration/);
  assert.match(releaseReview, /idempotent delegated action-budget consumption/);
  assert.match(releaseReview, /no backend shortcuts/);
  assert.match(releaseReview, /route-level production override coverage proves player `all,v60` overrides cannot enable V6/);
  assert.match(skillLine, /mutation-security evidence with store-backed delegation proof/);
  assert.match(skillLine, /worker_runtime_registration\.js/);
  assert.match(skillLine, /tests\/world_civilization_worker_runtime_registration\.test\.js/);
  assert.match(skillLine, /tests\/world_civilization_worker_tool_adapter\.test\.js/);
  assert.match(skillLine, /idempotent delegated action-budget consumption/);
  assert.match(skillLine, /read-only delegation budget handling/);
  assert.match(skillLine, /production player `worldGridFeatureFlags=all,v60`/);
  assert.match(skillLine, /tests\/world_civilization_tool_exposure_gate\.test\.js/);
  assert.match(toolGate, /mutation_security_evidence/);
  assert.match(toolGate, /REQUIRED_MUTATION_SECURITY_EVIDENCE_CHECKS/);
  assert.match(toolGate, /store_backed_delegation_proof/);
  assert.match(toolGate, /delegation_scope_mismatch/);
  assert.match(toolGate, /delegation_budget_read_only/);
  assert.match(toolGate, /MUTATION_SECURITY_EVIDENCE_REQUIRED/);
  assert.match(workerRuntimeRegistration, /V6_WORKER_RUNTIME_REGISTRATION_VERSION/);
  assert.match(workerRuntimeRegistration, /openclaw_worker_boot/);
  assert.match(workerRuntimeRegistration, /runtime_tool_manifest_sync/);
  assert.match(workerRuntimeRegistration, /shared_state_route_adapter/);
  assert.match(workerRuntimeRegistration, /registersRuntimeCivicTools: false/);
  assert.match(workerToolAdapter, /V6_CIVIC_WORKER_TOOL_ADAPTER_ENABLED/);
  assert.match(workerToolAdapter, /WORKER_PROPOSAL_SUBMIT_TOOL_NAME/);
  assert.match(workerToolAdapter, /buildV6CivicMutationSecurityEnvelope/);
  assert.match(workerToolAdapter, /proposal_drafting/);
  assert.match(workerToolAdapter, /buildDelegatedActionUsage/);
  assert.match(workerToolAdapter, /consumeDelegatedAction/);
  assert.match(workerToolAdapter, /runtimeExposed: false/);
  assert.match(workerToolAdapter, /executesProposalEffects: false/);
  assert.match(worldGridRegionTest, /production player overrides cannot enable V6 when V5 is server enabled/);
  assert.match(worldGridRegionTest, /production server V6 flag does not publish civic runtime tools before M6 release/);
  assert.match(worldGridRegionTest, /worldGridFeatureFlags=all,v60/);
  assert.match(worldGridRegionTest, /FEATURE_WORLD_V60_AGENT_CIVILIZATION: '1'/);
});

test('V6 governance preflight is tracked as an M7-M12 prerequisite control', () => {
  const plan = read('docs/product/V6_AGENT_CIVILIZATION_MILESTONE_PLAN.md');
  const foundation = read('specs/54_agent_town_v6_agent_civilization_foundation.md');
  const proposalSpec = read('specs/57_agent_town_v6_internal_proposal_lifecycle.md');
  const voteSpec = read('specs/58_agent_town_v6_vote_authorization_foundation.md');
  const effectSpec = read('specs/62_agent_town_v6_civic_effect_rollback_foundation.md');
  const delegationSpec = read('specs/63_agent_town_v6_agent_participation_delegation_foundation.md');
  const preflightSpec = read('specs/71_agent_town_v6_governance_preflight_foundation.md');
  const gate = read('specs/release-gates/v60_agent_civilization_readiness_gate.md');
  const releaseReview = read('docs/security/V6_AGENT_CIVILIZATION_RELEASE_REVIEW.md');
  const skillLine = read('docs/internal-skill-testline.md');
  const voteSource = read('server/world_civilization/votes.js');
  const votingTemplateSource = read('server/world_civilization/voting_templates.js');
  const effectSource = read('server/world_civilization/effects.js');
  const delegationSource = read('server/world_civilization/delegations.js');
  const proposalRouteSource = read('server/world_civilization/routes.js');

  assert.match(plan, /server\/world_civilization\/governance_preflight\.js/);
  assert.match(plan, /vote approval policy, human approval receipt/);
  assert.match(plan, /review-ready proposal/);
  assert.match(plan, /allowDelegatedExecution/);
  assert.match(foundation, /Delegated authority remains blocked/);
  assert.match(foundation, /governance_preflight\.js/);
  assert.match(proposalSpec, /recordProposalReview\(\)/);
  assert.match(proposalSpec, /CIVIC_PROPOSAL_REVIEW_MODERATION_DECISION_INVALID/);
  assert.match(proposalSpec, /`ready_for_vote`/);
  assert.match(proposalSpec, /`proposal\.reviewed`/);
  assert.match(voteSpec, /Approval Policy Rules/);
  assert.match(voteSpec, /Route-Edge Authorization Envelope/);
  assert.match(voteSpec, /Voting Template Review/);
  assert.match(voteSpec, /buildV6VoteAuthorizationReadinessGate\(\)/);
  assert.match(voteSpec, /buildV6VotingTemplateReviewReport\(\)/);
  assert.match(voteSpec, /ready_for_vote/);
  assert.match(voteSpec, /delegated_agent_vote_route/);
  assert.match(voteSpec, /quorumMinVotes/);
  assert.match(voteSpec, /approvalThresholdBps/);
  assert.match(effectSpec, /failed preflights preserve the existing `CIVIC_EFFECT_\*` error surface/);
  assert.match(effectSpec, /review-ready/);
  assert.match(effectSpec, /vote approval policy/);
  assert.match(effectSpec, /active `civic_execution` delegation\s+proof/);
  assert.match(effectSpec, /buildV6CivicEffectExecutionGate\(\)/);
  assert.match(effectSpec, /typed apply handler coverage/);
  assert.match(effectSpec, /irreversible-action review/);
  assert.match(effectSpec, /conservation tests/);
  assert.match(delegationSpec, /buildV6AgentParticipationEnforcementGate\(\)/);
  assert.match(delegationSpec, /server\/world_civilization\/routes\.js/);
  assert.match(delegationSpec, /hidden research-only proposal and vote receipts/);
  assert.match(delegationSpec, /route-edge expiry checks/);
  assert.match(delegationSpec, /principal wallet\/session binding/);
  assert.match(delegationSpec, /no public autonomous mutation/);
  assert.match(preflightSpec, /Existing proposal record/);
  assert.match(preflightSpec, /Proposal review-ready state/);
  assert.match(preflightSpec, /Vote approval with at least one approving vote/);
  assert.match(preflightSpec, /Vote approval policy passes explicit quorum/);
  assert.match(preflightSpec, /Delegated execution proof requires a matching active `civic_execution`/);
  assert.match(preflightSpec, /legacy `allowDelegatedExecution` flag cannot bypass proof/);
  assert.match(preflightSpec, /Delegated execution remains rejected/);
  assert.match(gate, /proposal review-ready state/);
  assert.match(gate, /vote approval\s+policy/);
  assert.match(gate, /delegation proof/);
  assert.match(gate, /M11 research-only execution gate/);
  assert.match(gate, /typed rollback handler evidence/);
  assert.match(gate, /appliesWorldState: false/);
  assert.match(gate, /M12\s+research-only enforcement gate/);
  assert.match(gate, /hidden research proposal\/vote routes plus internal worker proposal\/vote\s+adapters/);
  assert.match(gate, /route-edge scope\/expiry\/budget\/\s+revocation checks/);
  assert.match(gate, /mutatesWorldState: false/);
  assert.match(gate, /`proposal\.reviewed`/);
  assert.match(releaseReview, /proposal `ready_for_vote`\/`rejected` transitions/);
  assert.match(releaseReview, /governance preflight coverage/);
  assert.match(releaseReview, /Vote authorization readiness review/);
  assert.match(releaseReview, /route-edge vote auth/);
  assert.match(releaseReview, /route-edge authorization envelope/);
  assert.match(releaseReview, /per-institution voting template report/);
  assert.match(releaseReview, /Effect execution and rollback review/);
  assert.match(releaseReview, /effect execution gate/);
  assert.match(releaseReview, /Agent participation enforcement review/);
  assert.match(releaseReview, /agent participation enforcement gate/);
  assert.match(releaseReview, /hidden research proposal\/vote routes and internal worker proposal\/vote adapters/);
  assert.match(skillLine, /V6 internal proposal lifecycle foundation/);
  assert.match(skillLine, /V6 vote authorization foundation/);
  assert.match(skillLine, /M8 readiness gate/);
  assert.match(skillLine, /buildV6VoteRouteAuthorizationEnvelope\(\)/);
  assert.match(skillLine, /non-recording route-edge guard/);
  assert.match(skillLine, /POST \/api\/world\/civilization\/votes\/cast/);
  assert.match(skillLine, /V6_CIVIC_VOTE_ROUTE_ENABLED/);
  assert.match(skillLine, /V6_CIVIC_VOTE_STORE_WIRING_ENABLED/);
  assert.match(skillLine, /store-backed `vote_advice` delegation proof/);
  assert.match(skillLine, /buildV6VotingTemplateReviewReport\(\)/);
  assert.match(skillLine, /tests\/world_civilization_voting_templates\.test\.js/);
  assert.match(skillLine, /tests\/world_civilization_routes\.test\.js/);
  assert.match(skillLine, /M11 effect execution gate/);
  assert.match(skillLine, /applied\/rollback audit evidence/);
  assert.match(skillLine, /M12 enforcement gate/);
  assert.match(skillLine, /hidden research routes and internal worker proposal\/vote adapters/);
  assert.match(skillLine, /no public autonomous mutation/);
  assert.match(skillLine, /loose `allowDelegatedExecution` bypasses/);
  assert.match(skillLine, /tests\/world_civilization_votes\.test\.js/);
  assert.match(skillLine, /tests\/world_civilization_governance_preflight\.test\.js/);
  assert.match(voteSource, /REQUIRED_VOTE_ROUTE_SURFACES/);
  assert.match(voteSource, /REQUIRED_VOTE_ROUTE_AUTHORIZATION_CHECKS/);
  assert.match(voteSource, /V6_VOTE_ROUTE_AUTHORIZATION_VERSION/);
  assert.match(voteSource, /buildV6VoteRouteAuthorizationEnvelope/);
  assert.match(voteSource, /assertV6VoteRouteAuthorizationEnvelopeSafe/);
  assert.match(voteSource, /votingTemplateReviewReport/);
  assert.match(voteSource, /human_vote_route/);
  assert.match(voteSource, /worker_tool_vote_surface/);
  assert.match(voteSource, /V6_VOTE_AUTHORIZATION_READINESS_OUTCOME_APPLICATION_FORBIDDEN/);
  assert.match(votingTemplateSource, /V6_VOTING_TEMPLATE_SCOPES/);
  assert.match(votingTemplateSource, /buildV6VotingTemplateReviewReport/);
  assert.match(votingTemplateSource, /pending_release_review/);
  assert.match(votingTemplateSource, /public_works/);
  assert.match(votingTemplateSource, /institution_charter/);
  assert.match(effectSource, /REQUIRED_EFFECT_EXECUTION_EVIDENCE_CHECKS/);
  assert.match(effectSource, /irreversible_action_review/);
  assert.match(effectSource, /conservation_tests/);
  assert.match(effectSource, /V6_CIVIC_EFFECT_EXECUTION_RELEASE_READY_FORBIDDEN/);
  assert.match(delegationSource, /REQUIRED_AGENT_PARTICIPATION_EVIDENCE_CHECKS/);
  assert.match(delegationSource, /route_edge_budget_check/);
  assert.match(delegationSource, /no_public_autonomous_mutation/);
  assert.match(delegationSource, /V6_AGENT_PARTICIPATION_ENFORCEMENT_RELEASE_READY_FORBIDDEN/);
  assert.match(proposalRouteSource, /consumeRouteDelegatedAction/);
  assert.match(proposalRouteSource, /delegatedActionUse/);
});

test('world-grid CSRF policy is tracked as an M5 durable foundation', () => {
  const plan = read('docs/product/V6_AGENT_CIVILIZATION_MILESTONE_PLAN.md');
  const security = read('docs/security/WORLD_GRID_MUTATION_SECURITY_PLAN.md');
  const stateModel = read('docs/technical/WORLD_GRID_STATE_MODEL.md');
  const evidence = read('docs/release-evidence/WORLD_GRID_V50_REGION_PROTOTYPE_EVIDENCE_2026-05-26.md');
  const serverSource = read('server/index.js');
  const appSource = read('public/app.js');

  assert.match(plan, /optional durable hashed-token and session-binding SQLite foundation/);
  assert.match(plan, /WORLD_GRID_CSRF_SQLITE_PATH/);
  assert.match(plan, /browser same-wallet cross-session CSRF denial coverage/);
  assert.match(plan, /same-session token rotation plus explicit invalidation coverage/);
  assert.match(security, /\/api\/world\/mutation-token/);
  assert.match(security, /WORLD_GRID_CSRF_SQLITE_PATH/);
  assert.match(security, /world_grid_csrf_tokens/);
  assert.match(security, /invalidateWorldGridCsrfTokens\(\)/);
  assert.match(security, /owner-bound token hashes/);
  assert.match(security, /session_binding_hash/);
  assert.match(security, /cross-owner, cross-session, and\s+expired tokens fail closed/);
  assert.match(security, /separate Node process\s+restart/);
  assert.match(security, /e2e\/243_world_grid_csrf_session_binding\.spec\.js/);
  assert.match(security, /WORLD_GRID_CSRF_REQUIRED=1/);
  assert.match(security, /browser same-wallet cross-session denial/);
  assert.match(security, /same-session token rotation/);
  assert.match(security, /explicit invalidation/);
  assert.match(security, /\/api\/session\/reset/);
  assert.match(security, /pre-reset\s+same-wallet\s+token\s+is rejected after session reset/);
  assert.match(security, /\/api\/session\/world-grid-csrf\/invalidate/);
  assert.match(security, /wallet\/provider disconnect cleanup/);
  assert.match(security, /mocked provider disconnect callback coverage/);
  assert.match(security, /live\s+Privy\/provider logout signoff/);
  assert.match(stateModel, /server\/world_grid\/csrf\.js/);
  assert.match(stateModel, /world_grid_csrf_tokens/);
  assert.match(stateModel, /WORLD_GRID_CSRF_SQLITE_PATH/);
  assert.match(stateModel, /session_binding_hash/);
  assert.match(stateModel, /owner-bound hashed token rows/);
  assert.match(stateModel, /hashed session-binding rows/);
  assert.match(stateModel, /browser same-wallet cross-session denial proof/);
  assert.match(stateModel, /same-session token rotation/);
  assert.match(stateModel, /pre-reset tokens fail after `\/api\/session\/reset`/);
  assert.match(stateModel, /\/api\/session\/world-grid-csrf\/invalidate/);
  assert.match(stateModel, /mocked provider\s+disconnect callback path/);
  assert.match(evidence, /Mutation CSRF guard/);
  assert.match(evidence, /tests\/world_grid_csrf_persistence\.test\.js/);
  assert.match(evidence, /e2e\/243_world_grid_csrf_session_binding\.spec\.js/);
  assert.match(evidence, /browser same-session token rotation/);
  assert.match(evidence, /token\/session hashes survive reopen/);
  assert.match(evidence, /reject cross-session reuse/);
  assert.match(evidence, /same-wallet cross-session CSRF denial/);
  assert.match(evidence, /rotate and invalidate old same-session tokens/);
  assert.match(evidence, /pre-reset token rejection after session reset/);
  assert.match(evidence, /WORLD_GRID_CSRF_REQUIRED=1/);
  assert.match(evidence, /separate Node process restarts/);
  assert.match(evidence, /old-token rejection after wallet\/provider disconnect invalidation/);
  assert.match(evidence, /mocked provider disconnect callback path/);
  assert.match(evidence, /live Privy\/provider logout signoff/);
  assert.match(evidence, /e2e\/243_world_grid_csrf_session_binding\.spec\.js/);
  assert.match(evidence, /provider disconnect callback/);
  assert.match(serverSource, /app\.post\('\/api\/session\/world-grid-csrf\/invalidate'/);
  assert.match(serverSource, /invalidateWorldGridCsrfTokens\(owner\)/);
  assert.match(appSource, /invalidateWorldGridCsrfForWalletDisconnect/);
  assert.match(appSource, /\/api\/session\/world-grid-csrf\/invalidate/);
  assert.match(appSource, /disconnectWallet\(\{ fromProvider: true \}\)/);
});

test('world-grid mutation rate-limit policy is tracked as an M5 durable foundation', () => {
  const plan = read('docs/product/V6_AGENT_CIVILIZATION_MILESTONE_PLAN.md');
  const security = read('docs/security/WORLD_GRID_MUTATION_SECURITY_PLAN.md');
  const stateModel = read('docs/technical/WORLD_GRID_STATE_MODEL.md');
  const evidence = read('docs/release-evidence/WORLD_GRID_V50_REGION_PROTOTYPE_EVIDENCE_2026-05-26.md');
  const rateLimits = read('docs/rate-limits.md');

  assert.match(plan, /optional durable SQLite foundation/);
  assert.match(plan, /WORLD_GRID_RATE_LIMIT_SQLITE_PATH/);
  assert.match(security, /By default those buckets are process-local/);
  assert.match(security, /WORLD_GRID_RATE_LIMIT_SQLITE_PATH/);
  assert.match(security, /world_grid_rate_limit_buckets/);
  assert.match(security, /blocks mutating routes across\s+separate Node process restarts/);
  assert.match(security, /IP\/risk-aware production sharing/);
  assert.match(stateModel, /server\/world_grid\/rate_limit\.js/);
  assert.match(stateModel, /world_grid_rate_limit_buckets/);
  assert.match(stateModel, /WORLD_GRID_RATE_LIMIT_SQLITE_PATH/);
  assert.match(stateModel, /block\s+mutating routes after restart/);
  assert.match(evidence, /Mutation rate-limit guard/);
  assert.match(evidence, /tests\/world_grid_rate_limit_persistence\.test\.js/);
  assert.match(evidence, /survive separate Node process restarts/);
  assert.match(evidence, /IP\/risk-aware\s+production rate limits/);
  assert.match(rateLimits, /World-grid prototype mutation limit/);
  assert.match(rateLimits, /WORLD_GRID_MUTATION_RATE_LIMIT_MAX/);
  assert.match(rateLimits, /WORLD_GRID_RATE_LIMIT_SQLITE_PATH/);
  assert.match(rateLimits, /wallet\/owner identity, and IP\/risk-aware production\s+sharing/);
});

test('world-grid audit replay policy is tracked as an M3 release storage control', () => {
  const plan = read('docs/product/V6_AGENT_CIVILIZATION_MILESTONE_PLAN.md');
  const security = read('docs/security/WORLD_GRID_MUTATION_SECURITY_PLAN.md');
  const stateModel = read('docs/technical/WORLD_GRID_STATE_MODEL.md');
  const evidence = read('docs/release-evidence/WORLD_GRID_V50_REGION_PROTOTYPE_EVIDENCE_2026-05-26.md');
  const auditSource = read('server/world_grid/audit_log.js');
  const routeSource = read('server/world_grid/routes.js');

  assert.match(plan, /durable world-grid audit log foundation/);
  assert.match(plan, /WORLD_GRID_AUDIT_SQLITE_PATH/);
  assert.match(plan, /mutating route\/tool-surface restart matrix proof/);
  assert.match(plan, /duplicate-replay suppression/);
  assert.match(plan, /before\/after route snapshot proof/);
  assert.match(plan, /public presence, services, events, and sandbox aggregate summaries/);
  assert.match(plan, /complete exact per-record before-state reconstruction/);
  assert.match(plan, /WORLD_GRID_REGION_PREFS_SQLITE_PATH/);
  assert.match(plan, /WORLD_GRID_IDEMPOTENCY_SQLITE_PATH/);
  assert.match(plan, /WORLD_GRID_CLAIMS_SQLITE_PATH/);
  assert.match(plan, /WORLD_GRID_PUBLIC_PRESENCE_SQLITE_PATH/);
  assert.match(plan, /WORLD_GRID_SERVICES_SQLITE_PATH/);
  assert.match(plan, /WORLD_GRID_EVENTS_SQLITE_PATH/);
  assert.match(plan, /WORLD_GRID_SANDBOX_SQLITE_PATH/);
  assert.match(security, /WORLD_GRID_AUDIT_SQLITE_PATH/);
  assert.match(security, /WORLD_GRID_REGION_PREFS_SQLITE_PATH/);
  assert.match(security, /WORLD_GRID_IDEMPOTENCY_SQLITE_PATH/);
  assert.match(security, /WORLD_GRID_CLAIMS_SQLITE_PATH/);
  assert.match(security, /WORLD_GRID_PUBLIC_PRESENCE_SQLITE_PATH/);
  assert.match(security, /WORLD_GRID_SERVICES_SQLITE_PATH/);
  assert.match(security, /WORLD_GRID_EVENTS_SQLITE_PATH/);
  assert.match(security, /WORLD_GRID_SANDBOX_SQLITE_PATH/);
  assert.match(security, /every externally visible\s+V5\.1-V5\.5 mutating route and\s+tool surface writes a durable audit row after\s+separate Node process restarts/);
  assert.match(security, /exact idempotent replays do not add duplicate\s+audit rows/);
  assert.match(security, /changed-payload\s+conflicts add no audit rows/);
  assert.match(security, /agent-town\.v5\.world-grid\.audit-snapshot\.v1/);
  assert.match(security, /before\/after snapshots are\s+stored/);
  assert.match(security, /public presence, services, events, and sandbox aggregate summaries/);
  assert.match(security, /complete exact per-record before-state\s+reconstruction/);
  assert.match(security, /planned-claim retry replays after a separate Node\s+process restart/);
  assert.match(security, /selected-cell and camera preferences reopen across\s+separate Node process lifetimes/);
  assert.match(security, /every externally\s+visible V5\.1-V5\.5 mutating route and tool surface after separate Node process\s+restarts/);
  assert.match(security, /completes from durable claim state/);
  assert.match(security, /rejects a different owner mutating the\s+persisted claim region/);
  assert.match(security, /removes durable rows on cancel after restart/);
  assert.match(security, /inbound\s+follow cleanup/);
  assert.match(security, /world_grid_public_abuse_reports|one abuse report per reporter\/town/);
  assert.match(security, /private-looking report text redaction/);
  assert.match(security, /duplicate accept\/report safety/);
  assert.match(security, /duplicate\s+contribution\/reward safety/);
  assert.match(security, /rollback\s+snapshots, cell props, leave state/);
  assert.match(security, /append-only SQLite audit records/);
  assert.match(stateModel, /server\/world_grid\/audit_log\.js/);
  assert.match(stateModel, /route\/tool-surface restart matrix coverage/);
  assert.match(stateModel, /duplicate-replay suppression/);
  assert.match(stateModel, /agent-town\.v5\.world-grid\.audit-snapshot\.v1/);
  assert.match(stateModel, /before\/after region, territory, preference, public presence, services, events,\s+and sandbox aggregate summaries/);
  assert.match(stateModel, /Complete\s+exact per-record before-state reconstruction/);
  assert.match(stateModel, /server\/world_grid\/preferences\.js/);
  assert.match(stateModel, /world_grid_region_preferences/);
  assert.match(stateModel, /world_grid_idempotency_records/);
  assert.match(stateModel, /world_grid_claims/);
  assert.match(stateModel, /world_grid_public_presence/);
  assert.match(stateModel, /world_grid_public_follows/);
  assert.match(stateModel, /world_grid_public_abuse_reports/);
  assert.match(stateModel, /world_grid_service_requests/);
  assert.match(stateModel, /world_grid_service_reputation/);
  assert.match(stateModel, /world_grid_event_contributions/);
  assert.match(stateModel, /world_grid_event_rewards/);
  assert.match(stateModel, /world_grid_sandbox_participants/);
  assert.match(stateModel, /world_grid_sandbox_actions/);
  assert.match(stateModel, /world_grid_sandbox_snapshots/);
  assert.match(stateModel, /world_grid_sandbox_cells/);
  assert.match(stateModel, /selected-cell and camera state reopens across separate Node lifetimes/);
  assert.match(stateModel, /planned and\s+claimed state reopens across separate Node lifetimes/);
  assert.match(stateModel, /cancel removes durable\s+rows after restart/);
  assert.match(stateModel, /different owner cannot mutate a persisted claim\s+region through route parameters/);
  assert.match(stateModel, /opt-in\/list\/lookup\/follow\/\s+opt-out across separate\s+Node lifetimes/);
  assert.match(stateModel, /stores one abuse report per reporter\/town/);
  assert.match(stateModel, /private-looking report text/);
  assert.match(stateModel, /redacted request inputs, accepted\/reported request state,\s+reputation counters/);
  assert.match(stateModel, /contribution totals, reward state, duplicate\s+contribution\/reward safety/);
  assert.match(stateModel, /participants,\s+moderated action records, rejected action records,\s+rollback snapshots/);
  assert.match(stateModel, /V5\.1-V5\.5 mutating route and tool surfaces after\s+separate Node process restarts/);
  assert.match(stateModel, /final session-auth integration and production\s+replay coverage remain release gates/);
  assert.match(stateModel, /world_grid_audit_log/);
  assert.match(stateModel, /Current\s+`WORLD_GRID_AUDIT_SQLITE_PATH` coverage proves route\/tool audit rows reopen\s+after separate Node process restarts/);
  assert.match(evidence, /Mutation audit log/);
  assert.match(evidence, /tests\/world_grid_audit_persistence\.test\.js/);
  assert.match(evidence, /every V5\.1-V5\.5 mutating route\/tool surface writes durable audit rows/);
  assert.match(evidence, /changed-payload conflicts add no audit rows/);
  assert.match(evidence, /before\/after snapshots are present/);
  assert.match(evidence, /store-specific aggregate deltas/);
  assert.match(evidence, /complete exact per-record before-state reconstruction/);
  assert.match(evidence, /private-looking service secrets stay out of entries/);
  assert.match(evidence, /Durable V5\.0 preferences foundation/);
  assert.match(evidence, /tests\/world_grid_region_preferences_persistence\.test\.js/);
  assert.match(evidence, /Durable idempotency foundation/);
  assert.match(evidence, /tests\/world_grid_idempotency_persistence\.test\.js/);
  assert.match(evidence, /V5\.1-V5\.5 mutating route and tool surfaces after separate Node process restarts/);
  assert.match(evidence, /Durable claims foundation/);
  assert.match(evidence, /tests\/world_grid_claims_persistence\.test\.js/);
  assert.match(evidence, /reject a different owner mutating the persisted claim region/);
  assert.match(evidence, /remove durable rows on cancel after restart/);
  assert.match(evidence, /Durable public presence foundation/);
  assert.match(evidence, /tests\/world_grid_public_presence_persistence\.test\.js/);
  assert.match(evidence, /world_grid_public_abuse_reports/);
  assert.match(evidence, /duplicate reporter\/town reports/);
  assert.match(evidence, /private-looking abuse-report text/);
  assert.match(evidence, /Durable services foundation/);
  assert.match(evidence, /tests\/world_grid_services_persistence\.test\.js/);
  assert.match(evidence, /Durable events foundation/);
  assert.match(evidence, /tests\/world_grid_events_persistence\.test\.js/);
  assert.match(evidence, /Durable sandbox foundation/);
  assert.match(evidence, /tests\/world_grid_sandbox_persistence\.test\.js/);
  assert.match(evidence, /route\/tool-surface restart\s+matrix coverage/);
  assert.match(evidence, /release replay reconstruction/);
  assert.match(auditSource, /beforeSummary = null/);
  assert.match(auditSource, /afterSummary = null/);
  assert.match(auditSource, /normalizedBeforeSummary/);
  assert.match(routeSource, /buildWorldGridAuditSnapshot/);
  assert.match(routeSource, /agent-town\.v5\.world-grid\.audit-snapshot\.v1/);
  assert.match(routeSource, /publicPresence/);
  assert.match(routeSource, /services/);
  assert.match(routeSource, /events/);
  assert.match(routeSource, /sandbox/);
});
