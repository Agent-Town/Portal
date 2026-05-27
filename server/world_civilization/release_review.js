const { V6_WORLD_FEATURE_FLAG, isWorldGridFeatureEnabled } = require('../world_grid/feature_flags');

const V6_RELEASE_REVIEW_VERSION = 'agent-town.v6.release_review.v1';

const RELEASE_REVIEW_ARTIFACT = 'docs/security/V6_AGENT_CIVILIZATION_RELEASE_REVIEW.md';

const REQUIRED_REVIEW_GATES = [
  {
    key: 'threat_model',
    label: 'Threat model',
    owner: 'security',
    requiredArtifacts: [RELEASE_REVIEW_ARTIFACT],
    requiredChecks: ['trust_boundaries', 'assets', 'attacker_capabilities', 'abuse_paths', 'mitigations'],
    signoffRequired: true
  },
  {
    key: 'privacy_review',
    label: 'Privacy review',
    owner: 'security_product',
    requiredArtifacts: [RELEASE_REVIEW_ARTIFACT],
    requiredChecks: ['private_town_isolation', 'wallet_secret_exclusion', 'brain_secret_exclusion', 'debug_trace_redaction'],
    signoffRequired: true
  },
  {
    key: 'abuse_case_review',
    label: 'Abuse-case review',
    owner: 'trust_safety',
    requiredArtifacts: [
      RELEASE_REVIEW_ARTIFACT,
      'docs/security/V6_CIVIC_MUTATION_SECURITY_PLAN.md',
      'server/world_civilization/mutation_security.js',
      'tests/world_civilization_mutation_security.test.js'
    ],
    requiredChecks: [
      'spam',
      'harassment',
      'impersonation',
      'unauthorized_mutation',
      'store_backed_delegation_proof',
      'delegation_scope_mismatch',
      'delegation_budget_read_only',
      'moderation_escalation'
    ],
    signoffRequired: true
  },
  {
    key: 'data_retention_policy',
    label: 'Data-retention policy',
    owner: 'security_product',
    requiredArtifacts: [RELEASE_REVIEW_ARTIFACT],
    requiredChecks: ['audit_retention', 'deletion_policy', 'debug_log_retention', 'export_policy'],
    signoffRequired: true
  },
  {
    key: 'audit_coverage',
    label: 'Audit coverage',
    owner: 'engineering',
    requiredArtifacts: [
      RELEASE_REVIEW_ARTIFACT,
      'server/world_civilization/audit_ledger.js',
      'server/world_civilization/governance_preflight.js',
      'server/world_civilization/reputation.js',
      'server/world_civilization/moderation.js',
      'server/world_civilization/replay_reconstruction.js',
      'server/world_civilization/resilience.js',
      'server/world_civilization/migration_rehearsal.js',
      'tests/world_civilization_process_restart.test.js',
      'tests/world_civilization_proposal_vote_process_restart.test.js',
      'tests/world_civilization_reputation.test.js',
      'tests/world_civilization_reputation_moderation_process_restart.test.js',
      'tests/world_civilization_moderation.test.js',
      'tests/world_civilization_effect_process_restart.test.js',
      'tests/world_civilization_delegation_process_restart.test.js',
      'tests/world_civilization_institution_process_restart.test.js',
      'tests/world_civilization_public_works_process_restart.test.js',
      'tests/world_civilization_governance_preflight.test.js',
      'tests/world_civilization_schema_metadata.test.js',
      'tests/world_civilization_migration_rehearsal.test.js',
      'tests/world_civilization_load_rate.test.js',
      'tests/world_civilization_rollback_recovery.test.js'
    ],
    requiredChecks: [
      'append_only_ledger',
      'owner_indexes',
      'migration_versions',
      'reputation_moderation_links',
      'migration_rehearsal',
      'replay_reconstruction',
      'store_specific_audit_summary_coverage',
      'governance_preflight',
      'rollback_handles'
    ],
    signoffRequired: true
  },
  {
    key: 'validation_evidence',
    label: 'Node and Playwright validation',
    owner: 'qa_engineering',
    requiredArtifacts: [
      RELEASE_REVIEW_ARTIFACT,
      'tests/world_civilization_schemas.test.js',
      'tests/world_civilization_mutation_security.test.js',
      'tests/world_civilization_governance_preflight.test.js',
      'tests/world_civilization_votes.test.js',
      'tests/world_civilization_effects.test.js',
      'tests/world_civilization_rollback_recovery.test.js',
      'tests/world_civilization_delegations.test.js',
      'tests/world_civilization_institutions.test.js',
      'tests/world_civilization_public_works.test.js',
      'tests/world_civilization_reputation.test.js',
      'tests/world_civilization_moderation.test.js',
      'tests/world_civilization_resilience.test.js',
      'tests/world_civilization_lab_surface.test.js',
      'e2e/242_world_grid_all_features_demo_regression.spec.js'
    ],
    requiredChecks: [
      'targeted_node_suite',
      'split_playwright_smokes',
      'all_features_regression',
      'feature_override_safety',
      'vote_authorization_readiness_gate',
      'reputation_eligibility_advice_gate',
      'moderation_privacy_readiness_gate',
      'store_backed_delegation_proof',
      'effect_execution_gate',
      'agent_participation_enforcement_gate',
      'institution_readiness_gate',
      'public_works_readiness_gate',
      'lab_readiness_gate',
      'resilience_readiness_gate'
    ],
    signoffRequired: true
  },
  {
    key: 'effect_execution_review',
    label: 'Effect execution and rollback review',
    owner: 'engineering_security',
    requiredArtifacts: [
      RELEASE_REVIEW_ARTIFACT,
      'specs/62_agent_town_v6_civic_effect_rollback_foundation.md',
      'server/world_civilization/effects.js',
      'server/world_civilization/rollback_recovery.js',
      'server/world_civilization/schemas.js',
      'tests/world_civilization_effects.test.js',
      'tests/world_civilization_rollback_recovery.test.js',
      'tests/world_civilization_effect_process_restart.test.js'
    ],
    requiredChecks: [
      'typed_apply_handlers',
      'typed_rollback_handlers',
      'real_before_after_state',
      'authorization_enforced',
      'idempotent_apply_rollback',
      'irreversible_action_review',
      'conservation_tests',
      'applied_and_rollback_audit',
      'worker_route_security'
    ],
    signoffRequired: true
  },
  {
    key: 'vote_authorization_readiness_review',
    label: 'Vote authorization readiness review',
    owner: 'engineering_security_product',
    requiredArtifacts: [
      RELEASE_REVIEW_ARTIFACT,
      'specs/58_agent_town_v6_vote_authorization_foundation.md',
      'server/world_civilization/votes.js',
      'server/world_civilization/governance_preflight.js',
      'tests/world_civilization_votes.test.js',
      'tests/world_civilization_governance_preflight.test.js',
      'tests/world_civilization_proposal_vote_process_restart.test.js'
    ],
    requiredChecks: [
      'server_verified_voter_authorization',
      'eligibility_rule_verification',
      'one_vote_accounting',
      'idempotent_receipt_replay',
      'changed_vote_replay_rejection',
      'proposal_expiry_denial',
      'delegation_policy_review',
      'per_institution_voting_templates',
      'route_edge_vote_auth',
      'quorum_threshold_policy',
      'governance_preflight_integration',
      'vote_audit_rows',
      'private_data_exclusion',
      'no_effect_application'
    ],
    signoffRequired: true
  },
  {
    key: 'reputation_eligibility_advice_review',
    label: 'Reputation eligibility and advice review',
    owner: 'trust_safety_privacy_product',
    requiredArtifacts: [
      RELEASE_REVIEW_ARTIFACT,
      'specs/60_agent_town_v6_reputation_accountability_foundation.md',
      'server/world_civilization/reputation.js',
      'server/world_civilization/moderation.js',
      'docs/security/PUBLIC_TEXT_RENDERING_POLICY.md',
      'tests/world_civilization_reputation.test.js',
      'tests/world_civilization_reputation_moderation_process_restart.test.js'
    ],
    requiredChecks: [
      'eligibility_policy_review',
      'advice_policy_review',
      'source_policy_coverage',
      'moderation_dispute_link',
      'privacy_product_review',
      'public_text_rendering_review',
      'private_data_exclusion',
      'non_transferable_reputation',
      'anti_self_award',
      'bounded_delta',
      'duplicate_source_protection',
      'human_dispute_requesters',
      'reputation_audit_rows',
      'dispute_audit_rows',
      'no_player_visible_reputation',
      'no_score_mutation',
      'no_world_mutation'
    ],
    signoffRequired: true
  },
  {
    key: 'moderation_privacy_readiness_review',
    label: 'Moderation privacy readiness review',
    owner: 'trust_safety_privacy_product',
    requiredArtifacts: [
      RELEASE_REVIEW_ARTIFACT,
      'specs/61_agent_town_v6_moderation_privacy_foundation.md',
      'server/world_civilization/moderation.js',
      'docs/security/PUBLIC_TEXT_RENDERING_POLICY.md',
      'docs/product/PUBLIC_PRESENCE_PRIVACY_MODEL_V5.md',
      'tests/world_civilization_moderation.test.js',
      'tests/world_civilization_reputation_moderation_process_restart.test.js'
    ],
    requiredChecks: [
      'proposal_text_policy',
      'agent_authored_content_policy',
      'public_profile_policy',
      'attached_media_policy',
      'sandbox_artifact_policy',
      'public_works_effect_policy',
      'surface_policy_coverage',
      'abuse_report_triage',
      'appeal_operations',
      'human_review_tooling_plan',
      'redaction_policy_review',
      'public_text_rendering_review',
      'public_presence_privacy_review',
      'private_data_exclusion',
      'review_queue_replay',
      'moderation_audit_rows',
      'appeal_audit_rows',
      'no_player_visible_moderation',
      'no_moderation_effect_application',
      'no_world_mutation'
    ],
    signoffRequired: true
  },
  {
    key: 'agent_participation_review',
    label: 'Agent participation enforcement review',
    owner: 'engineering_security',
    requiredArtifacts: [
      RELEASE_REVIEW_ARTIFACT,
      'specs/63_agent_town_v6_agent_participation_delegation_foundation.md',
      'server/world_civilization/delegations.js',
      'server/world_civilization/governance_preflight.js',
      'server/world_civilization/mutation_security.js',
      'tests/world_civilization_delegations.test.js',
      'tests/world_civilization_delegation_process_restart.test.js',
      'tests/world_civilization_governance_preflight.test.js',
      'tests/world_civilization_mutation_security.test.js'
    ],
    requiredChecks: [
      'worker_tool_scope_enforcement',
      'route_edge_scope_check',
      'route_edge_expiry_check',
      'route_edge_budget_check',
      'route_edge_revocation_check',
      'principal_wallet_session_binding',
      'idempotent_budget_consumption',
      'store_backed_delegation_proof',
      'delegation_audit_rows',
      'no_backend_shortcuts',
      'no_public_autonomous_mutation'
    ],
    signoffRequired: true
  },
  {
    key: 'institution_readiness_review',
    label: 'Civic institution readiness review',
    owner: 'engineering_security_product',
    requiredArtifacts: [
      RELEASE_REVIEW_ARTIFACT,
      'specs/64_agent_town_v6_civic_institution_charter_foundation.md',
      'server/world_civilization/institutions.js',
      'server/world_civilization/delegations.js',
      'server/world_civilization/effects.js',
      'docs/security/PUBLIC_TEXT_RENDERING_POLICY.md',
      'tests/world_civilization_institutions.test.js',
      'tests/world_civilization_institution_process_restart.test.js',
      'tests/world_civilization_delegations.test.js',
      'tests/world_civilization_effects.test.js'
    ],
    requiredChecks: [
      'charter_template_review',
      'membership_rule_review',
      'eligibility_rule_review',
      'voting_rule_review',
      'moderation_policy_review',
      'proposal_type_review',
      'public_audit_summary_review',
      'public_text_rendering_review',
      'delegation_policy_link',
      'charter_change_execution_review',
      'charter_change_rollback_review',
      'private_data_exclusion',
      'institution_audit_rows',
      'no_player_visible_institutions',
      'no_world_mutation'
    ],
    signoffRequired: true
  },
  {
    key: 'public_works_readiness_review',
    label: 'Public works readiness review',
    owner: 'engineering_security_product',
    requiredArtifacts: [
      RELEASE_REVIEW_ARTIFACT,
      'specs/65_agent_town_v6_public_works_shared_resources_foundation.md',
      'server/world_civilization/public_works.js',
      'server/world_civilization/institutions.js',
      'server/world_civilization/effects.js',
      'server/world_civilization/mutation_security.js',
      'docs/security/PUBLIC_TEXT_RENDERING_POLICY.md',
      'docs/technical/WORLD_EVENT_CONSERVATION_MODEL.md',
      'tests/world_civilization_public_works.test.js',
      'tests/world_civilization_public_works_process_restart.test.js',
      'tests/world_civilization_effects.test.js',
      'tests/world_civilization_mutation_security.test.js'
    ],
    requiredChecks: [
      'governed_project_review',
      'worker_tool_enforcement',
      'wallet_session_route_auth',
      'durable_idempotency',
      'explicit_inventory_spend_authorization',
      'inventory_restart_replay',
      'resource_conservation_tests',
      'reward_cosmetic_or_conservation_tests',
      'contribution_caps_under_retry',
      'rollback_execution_review',
      'public_text_rendering_review',
      'private_data_exclusion',
      'public_works_audit_rows',
      'process_restart_replay',
      'no_private_town_mutation',
      'no_public_free_play'
    ],
    signoffRequired: true
  },
  {
    key: 'worker_tool_surface_review',
    label: 'Worker tool surface review',
    owner: 'product_engineering',
    requiredArtifacts: [
      RELEASE_REVIEW_ARTIFACT,
      'specs/59_agent_town_v6_worker_tool_surface_draft.md',
      'server/world_civilization/tools.js',
      'server/world_civilization/tool_exposure_gate.js',
      'tests/world_civilization_tools.test.js',
      'tests/world_civilization_tool_exposure_gate.test.js',
      'docs/internal-skill-testline.md'
    ],
    requiredChecks: [
      'runtime_manifest_source_of_truth',
      'openclaw_lite_worker_origin',
      'worker_traffic_observability',
      'skill_context_observability',
      'mutation_security_envelope',
      'no_backend_shortcuts'
    ],
    signoffRequired: true
  },
  {
    key: 'modal_lab_surface_review',
    label: 'Modal lab surface review',
    owner: 'product_engineering',
    requiredArtifacts: [
      RELEASE_REVIEW_ARTIFACT,
      'specs/66_agent_town_v6_modal_lab_surface_foundation.md',
      'server/world_civilization/lab_surface.js',
      'tests/world_civilization_lab_surface.test.js'
    ],
    requiredChecks: [
      'town_hub_modal_launch',
      'standalone_route_denial',
      'worker_continuity',
      'debug_observability',
      'non_executing_panels',
      'browser_visual_390',
      'browser_visual_768',
      'browser_visual_1280',
      'keyboard_accessibility',
      'focus_trap_review',
      'runtime_tool_absence',
      'normal_gameplay_exposure_denial',
      'private_debug_data_exclusion'
    ],
    signoffRequired: true
  },
  {
    key: 'resilience_readiness_review',
    label: 'Persistence replay resilience readiness review',
    owner: 'engineering_security',
    requiredArtifacts: [
      RELEASE_REVIEW_ARTIFACT,
      'specs/67_agent_town_v6_persistence_replay_resilience_foundation.md',
      'server/world_civilization/resilience.js',
      'server/world_civilization/replay_reconstruction.js',
      'server/world_civilization/migration_rehearsal.js',
      'server/world_civilization/rollback_recovery.js',
      'tests/world_civilization_resilience.test.js',
      'tests/world_civilization_replay_reconstruction.test.js',
      'tests/world_civilization_migration_rehearsal.test.js',
      'tests/world_civilization_load_rate.test.js',
      'tests/world_civilization_rollback_recovery.test.js'
    ],
    requiredChecks: [
      'all_civic_store_restart_probes',
      'audit_replay_reconstruction',
      'privacy_safe_replay_summaries',
      'store_specific_zero_hash_only_fallbacks',
      'hash_chain_integrity',
      'migration_upgrade_scripts',
      'migration_downgrade_scripts',
      'unsupported_upgrade_downgrade_fail_closed',
      'backup_restore_rehearsal',
      'migration_load_replay_rehearsal',
      'production_load_rate_targets',
      'multi_process_write_contention',
      'idempotency_duplicate_retry_bursts',
      'rollback_handle_reconstruction',
      'typed_rollback_execution_recovery',
      'private_data_exclusion',
      'no_effect_application_during_replay'
    ],
    signoffRequired: true
  },
  {
    key: 'product_signoff',
    label: 'Product release signoff',
    owner: 'product',
    requiredArtifacts: [RELEASE_REVIEW_ARTIFACT],
    requiredChecks: ['player_visible_scope', 'rollback_plan', 'support_runbook', 'disable_plan'],
    signoffRequired: true
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function disabledReport(source) {
  return {
    version: V6_RELEASE_REVIEW_VERSION,
    status: 'research_only',
    source,
    featureFlag: V6_WORLD_FEATURE_FLAG,
    available: false,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    releaseReady: false,
    executionStatus: 'not_executable',
    gateReports: [],
    disabledReason: 'V6 release review requires explicit research opt-in and V6 feature flag'
  };
}

function normalizeList(value) {
  return Array.isArray(value) ? value.map((entry) => String(entry || '')).filter(Boolean) : [];
}

function inspectGate(requirement, evidence = {}) {
  const artifacts = normalizeList(evidence.artifacts);
  const checks = normalizeList(evidence.checks);
  const signoff = String(evidence.signoff || 'missing');
  const status = String(evidence.status || 'missing');
  const missingArtifacts = requirement.requiredArtifacts.filter((artifact) => !artifacts.includes(artifact));
  const missingChecks = requirement.requiredChecks.filter((check) => !checks.includes(check));
  const signoffOk = requirement.signoffRequired !== true || signoff === 'approved';
  const complete = status === 'complete' && missingArtifacts.length === 0 && missingChecks.length === 0 && signoffOk;

  return {
    key: requirement.key,
    label: requirement.label,
    owner: requirement.owner,
    status,
    signoff,
    signoffRequired: requirement.signoffRequired === true,
    requiredArtifacts: [...requirement.requiredArtifacts],
    artifacts,
    missingArtifacts,
    requiredChecks: [...requirement.requiredChecks],
    checks,
    missingChecks,
    ok: complete
  };
}

function buildV6ReleaseReviewReport({
  featureFlags = {},
  includeResearchReview = false,
  source = 'runtime',
  evidence = {}
} = {}) {
  const enabled = includeResearchReview === true
    && isWorldGridFeatureEnabled(featureFlags, V6_WORLD_FEATURE_FLAG);
  if (!enabled) return disabledReport(source);

  const gateReports = REQUIRED_REVIEW_GATES.map((gate) => inspectGate(gate, evidence[gate.key] || {}));
  return {
    version: V6_RELEASE_REVIEW_VERSION,
    status: 'research_only',
    source,
    featureFlag: V6_WORLD_FEATURE_FLAG,
    available: true,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    releaseReady: gateReports.every((gate) => gate.ok),
    executionStatus: 'not_executable',
    gateReports
  };
}

function assertV6ReleaseReviewSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_RELEASE_REVIEW_VERSION) {
    errors.push('V6_RELEASE_REVIEW_VERSION_REQUIRED');
  }
  if (report.featureFlag !== V6_WORLD_FEATURE_FLAG) {
    errors.push('V6_RELEASE_REVIEW_FEATURE_FLAG_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_RELEASE_REVIEW_RESEARCH_ONLY_REQUIRED');
  }
  if (report.runtimeExposed !== false) {
    errors.push('V6_RELEASE_REVIEW_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.playerVisible !== false) {
    errors.push('V6_RELEASE_REVIEW_PLAYER_HIDDEN_REQUIRED');
  }
  if (report.normalGameplayExposure !== false) {
    errors.push('V6_RELEASE_REVIEW_NORMAL_GAMEPLAY_EXPOSURE_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_RELEASE_REVIEW_NON_EXECUTING_REQUIRED');
  }

  if (report.available === true) {
    const gates = Array.isArray(report.gateReports) ? report.gateReports : [];
    const gateKeys = new Set(gates.map((gate) => gate.key));
    for (const requirement of REQUIRED_REVIEW_GATES) {
      if (!gateKeys.has(requirement.key)) errors.push(`V6_RELEASE_REVIEW_GATE_REQUIRED:${requirement.key}`);
    }
    const failedGates = gates.filter((gate) => gate.ok !== true);
    if (report.releaseReady === true && failedGates.length > 0) {
      errors.push('V6_RELEASE_REVIEW_RELEASE_READY_WITH_FAILED_GATES');
    }
    for (const gate of gates) {
      if (gate.ok === true && gate.signoffRequired === true && gate.signoff !== 'approved') {
        errors.push(`V6_RELEASE_REVIEW_SIGNOFF_REQUIRED:${gate.key}`);
      }
    }
  } else if (report.releaseReady === true) {
    errors.push('V6_RELEASE_REVIEW_DISABLED_RELEASE_READY_FORBIDDEN');
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  RELEASE_REVIEW_ARTIFACT,
  REQUIRED_REVIEW_GATES: clone(REQUIRED_REVIEW_GATES),
  V6_RELEASE_REVIEW_VERSION,
  assertV6ReleaseReviewSafe,
  buildV6ReleaseReviewReport
};
