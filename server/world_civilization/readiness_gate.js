const { V6_WORLD_FEATURE_FLAG, isWorldGridFeatureEnabled } = require('../world_grid/feature_flags');

const V6_READINESS_GATE_VERSION = 'agent-town.v6.readiness_gate.v1';

const V6_READINESS_GATE_ARTIFACT = 'specs/release-gates/v60_agent_civilization_readiness_gate.md';
const V6_MILESTONE_PLAN_ARTIFACT = 'docs/product/V6_AGENT_CIVILIZATION_MILESTONE_PLAN.md';
const V5_PROMOTION_GATE_ARTIFACT = 'specs/release-gates/v5_world_grid_release_promotion_gate.md';

const REQUIRED_V6_READINESS_GATES = [
  {
    key: 'v5_world_grid_promotion',
    label: 'V5 world-grid promotion evidence',
    owner: 'qa_security_engineering',
    requiredArtifacts: [
      V5_PROMOTION_GATE_ARTIFACT,
      V6_MILESTONE_PLAN_ARTIFACT,
      'docs/product/WORLD_GRID_LADDER_V5_TO_V6.md',
      'tests/world_grid_region.test.js',
      'e2e/236_world_grid_v50_region_prototype.spec.js',
      'e2e/237_world_grid_v51_claims_prototype.spec.js',
      'e2e/238_world_grid_v52_public_presence_prototype.spec.js',
      'e2e/239_world_grid_v53_service_redaction_prototype.spec.js',
      'e2e/240_world_grid_v54_event_accounting_prototype.spec.js',
      'e2e/241_world_grid_v55_sandbox_prototype.spec.js',
      'e2e/242_world_grid_all_features_demo_regression.spec.js'
    ],
    requiredChecks: [
      'v50_region_grid',
      'v51_existing_plot_required',
      'v52_public_presence_xss_safe',
      'v53_service_redaction',
      'v54_event_accounting',
      'v55_sandbox_moderation_rollback',
      'durable_storage_evidence',
      'mutation_security_controls'
    ]
  },
  {
    key: 'feature_flag_override_safety',
    label: 'Feature flag and override safety',
    owner: 'engineering_security',
    requiredArtifacts: [
      V6_READINESS_GATE_ARTIFACT,
      'server/world_grid/feature_flags.js',
      'tests/world_grid_region.test.js'
    ],
    requiredChecks: [
      'explicit_v60_flag_required',
      'broad_v5_overrides_excluded',
      'production_override_denial',
      'runtime_v6_tools_hidden'
    ]
  },
  {
    key: 'civic_schema_contracts',
    label: 'Civic schema contracts',
    owner: 'engineering',
    requiredArtifacts: [
      'specs/55_agent_town_v6_civic_schema_contracts.md',
      'server/world_civilization/schemas.js',
      'tests/world_civilization_schemas.test.js'
    ],
    requiredChecks: [
      'proposal_schema',
      'vote_schema',
      'delegation_schema',
      'reputation_schema',
      'moderation_schema',
      'rollback_schema',
      'audit_schema',
      'institution_schema',
      'public_works_schema'
    ]
  },
  {
    key: 'audit_ledger_replay',
    label: 'Audit ledger and replay',
    owner: 'engineering_security',
    requiredArtifacts: [
      'specs/56_agent_town_v6_audit_ledger_foundation.md',
      'server/world_civilization/audit_ledger.js',
      'server/world_civilization/replay_reconstruction.js',
      'tests/world_civilization_audit_ledger.test.js',
      'tests/world_civilization_replay_reconstruction.test.js',
      'tests/world_civilization_process_restart.test.js'
    ],
    requiredChecks: [
      'append_only_ledger',
      'idempotent_replay',
      'hash_chain_integrity',
      'replay_pagination',
      'privacy_safe_summary',
      'restart_persistence'
    ]
  },
  {
    key: 'mutation_security',
    label: 'Civic mutation security',
    owner: 'security_engineering',
    requiredArtifacts: [
      'specs/70_agent_town_v6_civic_mutation_security_foundation.md',
      'docs/security/V6_CIVIC_MUTATION_SECURITY_PLAN.md',
      'server/world_civilization/mutation_security.js',
      'tests/world_civilization_mutation_security.test.js'
    ],
    requiredChecks: [
      'same_origin',
      'csrf',
      'session_wallet_auth',
      'delegated_agent_proof',
      'rate_limits',
      'idempotency',
      'no_mutation_without_envelope'
    ]
  },
  {
    key: 'worker_tool_surface',
    label: 'Worker-first civic tool surface',
    owner: 'product_engineering',
    requiredArtifacts: [
      'specs/59_agent_town_v6_worker_tool_surface_draft.md',
      'server/world_civilization/tools.js',
      'server/world_civilization/tool_exposure_gate.js',
      'server/world_civilization/worker_tool_adapter.js',
      'server/world_civilization/worker_vote_adapter.js',
      'tests/world_civilization_tools.test.js',
      'tests/world_civilization_worker_tool_adapter.test.js',
      'tests/world_civilization_worker_vote_adapter.test.js',
      'tests/world_civilization_tool_exposure_gate.test.js'
    ],
    requiredChecks: [
      'runtime_manifest_source_of_truth',
      'openclaw_lite_worker_origin',
      'worker_observability',
      'skill_context_observability',
      'worker_vote_receipt_adapter',
      'worker_vote_route_edge_authorization',
      'hidden_v6_tools',
      'no_backend_shortcuts'
    ]
  },
  {
    key: 'proposal_vote_governance',
    label: 'Proposal vote and governance preflight',
    owner: 'engineering_product',
    requiredArtifacts: [
      'specs/57_agent_town_v6_internal_proposal_lifecycle.md',
      'specs/58_agent_town_v6_vote_authorization_foundation.md',
      'specs/71_agent_town_v6_governance_preflight_foundation.md',
      'server/world_civilization/proposals.js',
      'server/world_civilization/routes.js',
      'server/world_civilization/store_wiring.js',
      'server/world_civilization/worker_tool_adapter.js',
      'server/world_civilization/worker_vote_adapter.js',
      'server/world_civilization/votes.js',
      'server/world_civilization/governance_preflight.js',
      'tests/world_civilization_proposals.test.js',
      'tests/world_civilization_routes.test.js',
      'tests/world_civilization_worker_tool_adapter.test.js',
      'tests/world_civilization_worker_vote_adapter.test.js',
      'tests/world_civilization_votes.test.js',
      'tests/world_civilization_governance_preflight.test.js'
    ],
    requiredChecks: [
      'proposal_review_ready',
      'proposal_intake_readiness_gate',
      'route_tool_submission',
      'submission_envelope',
      'approval_receipt_binding',
      'proposal_submission_mutation_security',
      'worker_tool_origin_enforcement',
      'review_queue_integration',
      'review_queue_snapshot',
      'expired_review_queue_exclusion',
      'vote_authorization',
      'worker_tool_vote_registration',
      'vote_authorization_readiness_gate',
      'vote_route_store_wiring',
      'quorum_policy',
      'preflight_blocks_missing_evidence',
      'no_effect_execution'
    ]
  },
  {
    key: 'reputation_moderation_privacy',
    label: 'Reputation moderation and privacy',
    owner: 'trust_safety_privacy',
    requiredArtifacts: [
      'specs/60_agent_town_v6_reputation_accountability_foundation.md',
      'specs/61_agent_town_v6_moderation_privacy_foundation.md',
      'server/world_civilization/reputation.js',
      'server/world_civilization/moderation.js',
      'docs/security/PUBLIC_TEXT_RENDERING_POLICY.md',
      'tests/world_civilization_reputation.test.js',
      'tests/world_civilization_moderation.test.js'
    ],
    requiredChecks: [
      'no_self_award',
      'dispute_review',
      'moderation_review_appeal',
      'public_source_link',
      'reputation_eligibility_advice_gate',
      'moderation_privacy_readiness_gate',
      'surface_policy_coverage',
      'appeal_operations_review',
      'eligibility_advice_policy',
      'private_data_redaction',
      'public_text_rendering',
      'no_score_mutation'
    ]
  },
  {
    key: 'effect_rollback',
    label: 'Civic effect execution and rollback',
    owner: 'engineering_security',
    requiredArtifacts: [
      'specs/62_agent_town_v6_civic_effect_rollback_foundation.md',
      'server/world_civilization/effects.js',
      'server/world_civilization/rollback_recovery.js',
      'tests/world_civilization_effects.test.js',
      'tests/world_civilization_rollback_recovery.test.js'
    ],
    requiredChecks: [
      'typed_apply_handlers',
      'typed_rollback_handlers',
      'governance_preflight',
      'rollback_handles',
      'conservation_tests',
      'irreversible_action_review',
      'no_world_state_apply_before_release'
    ]
  },
  {
    key: 'agent_participation',
    label: 'Agent participation controls',
    owner: 'engineering_security',
    requiredArtifacts: [
      'specs/63_agent_town_v6_agent_participation_delegation_foundation.md',
      'server/world_civilization/delegations.js',
      'tests/world_civilization_delegations.test.js',
      'tests/world_civilization_delegation_process_restart.test.js'
    ],
    requiredChecks: [
      'scoped_delegation',
      'route_edge_scope',
      'route_edge_budget',
      'revocation',
      'principal_wallet_binding',
      'no_public_autonomous_mutation'
    ]
  },
  {
    key: 'institutions_public_works',
    label: 'Civic institutions and public works',
    owner: 'engineering_product_security',
    requiredArtifacts: [
      'specs/64_agent_town_v6_civic_institution_charter_foundation.md',
      'specs/65_agent_town_v6_public_works_shared_resources_foundation.md',
      'server/world_civilization/institutions.js',
      'server/world_civilization/public_works.js',
      'tests/world_civilization_institutions.test.js',
      'tests/world_civilization_public_works.test.js'
    ],
    requiredChecks: [
      'charter_templates',
      'membership_rules',
      'public_text_review',
      'contribution_caps',
      'resource_conservation',
      'no_private_inventory_spend',
      'no_public_free_play'
    ]
  },
  {
    key: 'modal_lab_surface',
    label: 'Modal lab surface',
    owner: 'product_engineering',
    requiredArtifacts: [
      'specs/66_agent_town_v6_modal_lab_surface_foundation.md',
      'server/world_civilization/lab_surface.js',
      'tests/world_civilization_lab_surface.test.js'
    ],
    requiredChecks: [
      'town_hub_modal_launch',
      'standalone_route_denial',
      'worker_continuity',
      'debug_observability',
      'visual_390_768_1280',
      'accessibility',
      'normal_gameplay_denial'
    ]
  },
  {
    key: 'persistence_resilience',
    label: 'Persistence replay and resilience',
    owner: 'engineering_security',
    requiredArtifacts: [
      'specs/67_agent_town_v6_persistence_replay_resilience_foundation.md',
      'server/world_civilization/resilience.js',
      'server/world_civilization/replay_reconstruction.js',
      'server/world_civilization/load_rate_targets.js',
      'server/world_civilization/migration_rehearsal.js',
      'server/world_civilization/migration_load_replay.js',
      'server/world_civilization/backup_restore.js',
      'server/world_civilization/write_contention.js',
      'server/world_civilization/rollback_recovery.js',
      'tests/world_civilization_resilience.test.js',
      'tests/world_civilization_replay_reconstruction.test.js',
      'tests/world_civilization_load_rate_targets.test.js',
      'tests/world_civilization_process_restart.test.js',
      'tests/world_civilization_migration_rehearsal.test.js',
      'tests/world_civilization_migration_load_replay.test.js',
      'tests/world_civilization_backup_restore.test.js',
      'tests/world_civilization_write_contention.test.js',
      'tests/world_civilization_load_rate.test.js',
      'tests/world_civilization_rollback_recovery.test.js'
    ],
    requiredChecks: [
      'all_civic_store_restart_probes',
      'audit_replay_reconstruction',
      'privacy_safe_replay_summaries',
      'store_specific_zero_hash_only_fallbacks',
      'hash_chain_integrity',
      'migration_upgrade_downgrade',
      'migration_load_replay',
      'backup_restore',
      'production_load_rate',
      'multi_process_write_contention',
      'rollback_recovery',
      'private_data_exclusion',
      'no_effect_application_during_replay'
    ]
  },
  {
    key: 'security_product_release_review',
    label: 'Security and product release review',
    owner: 'security_product_qa',
    requiredArtifacts: [
      'specs/68_agent_town_v6_security_product_release_review_foundation.md',
      'docs/security/V6_AGENT_CIVILIZATION_RELEASE_REVIEW.md',
      'server/world_civilization/release_review.js',
      'tests/world_civilization_release_review.test.js'
    ],
    requiredChecks: [
      'threat_model',
      'privacy_review',
      'abuse_case_review',
      'audit_coverage',
      'store_specific_audit_summary_coverage',
      'validation_evidence',
      'vote_authorization_readiness_review',
      'resilience_readiness_review',
      'product_signoff'
    ]
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeList(value) {
  return Array.isArray(value) ? value.map((entry) => String(entry || '')).filter(Boolean) : [];
}

function disabledReport(source) {
  return {
    version: V6_READINESS_GATE_VERSION,
    status: 'research_only',
    source,
    featureFlag: V6_WORLD_FEATURE_FLAG,
    available: false,
    closed: false,
    releaseReady: false,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    mutatesWorldState: false,
    productionEnabled: false,
    executionStatus: 'not_executable',
    gateReports: [],
    disabledReason: 'V6 readiness gate requires explicit research opt-in and V6 feature flag'
  };
}

function inspectGate(requirement, evidence = {}) {
  const artifacts = normalizeList(evidence.artifacts);
  const checks = normalizeList(evidence.checks);
  const status = String(evidence.status || 'missing');
  const signoff = String(evidence.signoff || 'missing');
  const missingArtifacts = requirement.requiredArtifacts.filter((artifact) => !artifacts.includes(artifact));
  const missingChecks = requirement.requiredChecks.filter((check) => !checks.includes(check));
  const ok = status === 'complete'
    && signoff === 'approved'
    && missingArtifacts.length === 0
    && missingChecks.length === 0;

  return {
    key: requirement.key,
    label: requirement.label,
    owner: requirement.owner,
    status,
    signoff,
    requiredArtifacts: [...requirement.requiredArtifacts],
    artifacts,
    missingArtifacts,
    requiredChecks: [...requirement.requiredChecks],
    checks,
    missingChecks,
    ok
  };
}

function buildV6ReadinessGateReport({
  featureFlags = {},
  includeResearchReadiness = false,
  source = 'runtime',
  evidence = {}
} = {}) {
  const enabled = includeResearchReadiness === true
    && isWorldGridFeatureEnabled(featureFlags, V6_WORLD_FEATURE_FLAG);
  if (!enabled) return disabledReport(source);

  const gateReports = REQUIRED_V6_READINESS_GATES.map((gate) => inspectGate(gate, evidence[gate.key] || {}));
  const closed = gateReports.every((gate) => gate.ok);
  return {
    version: V6_READINESS_GATE_VERSION,
    status: 'research_only',
    source,
    featureFlag: V6_WORLD_FEATURE_FLAG,
    available: true,
    closed,
    releaseReady: closed,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    mutatesWorldState: false,
    productionEnabled: false,
    executionStatus: 'not_executable',
    gateReports
  };
}

function assertV6ReadinessGateSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_READINESS_GATE_VERSION) {
    errors.push('V6_READINESS_GATE_VERSION_REQUIRED');
  }
  if (report.featureFlag !== V6_WORLD_FEATURE_FLAG) {
    errors.push('V6_READINESS_GATE_FEATURE_FLAG_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_READINESS_GATE_RESEARCH_ONLY_REQUIRED');
  }
  if (report.runtimeExposed !== false) {
    errors.push('V6_READINESS_GATE_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.playerVisible !== false) {
    errors.push('V6_READINESS_GATE_PLAYER_HIDDEN_REQUIRED');
  }
  if (report.normalGameplayExposure !== false) {
    errors.push('V6_READINESS_GATE_NORMAL_GAMEPLAY_FORBIDDEN');
  }
  if (report.mutatesWorldState !== false) {
    errors.push('V6_READINESS_GATE_WORLD_MUTATION_FORBIDDEN');
  }
  if (report.productionEnabled !== false) {
    errors.push('V6_READINESS_GATE_PRODUCTION_ENABLEMENT_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_READINESS_GATE_NON_EXECUTING_REQUIRED');
  }

  if (report.available === true) {
    const gates = Array.isArray(report.gateReports) ? report.gateReports : [];
    const gateKeys = new Set(gates.map((gate) => gate.key));
    for (const gate of REQUIRED_V6_READINESS_GATES) {
      if (!gateKeys.has(gate.key)) errors.push(`V6_READINESS_GATE_REQUIRED:${gate.key}`);
    }
    const failedGates = gates.filter((gate) => gate.ok !== true);
    if (report.closed === true && failedGates.length > 0) {
      errors.push('V6_READINESS_GATE_CLOSED_WITH_FAILED_GATES');
    }
    if (report.releaseReady === true && report.closed !== true) {
      errors.push('V6_READINESS_GATE_READY_WITHOUT_CLOSURE');
    }
    if (report.closed === true && report.releaseReady !== true) {
      errors.push('V6_READINESS_GATE_CLOSED_WITHOUT_READY_REPORT');
    }
  } else if (report.closed === true || report.releaseReady === true) {
    errors.push('V6_READINESS_GATE_DISABLED_READY_FORBIDDEN');
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  REQUIRED_V6_READINESS_GATES: clone(REQUIRED_V6_READINESS_GATES),
  V5_PROMOTION_GATE_ARTIFACT,
  V6_MILESTONE_PLAN_ARTIFACT,
  V6_READINESS_GATE_ARTIFACT,
  V6_READINESS_GATE_VERSION,
  assertV6ReadinessGateSafe,
  buildV6ReadinessGateReport
};
