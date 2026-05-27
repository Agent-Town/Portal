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
    'server/world_grid/csrf.js',
    'server/world_grid/audit_log.js',
    'server/world_grid/idempotency.js',
    'server/world_grid/mutation_origin.js',
    'server/world_grid/preferences.js',
    'server/world_grid/rate_limit.js',
    'server/world_civilization/audit_ledger.js',
    'server/world_civilization/controlled_release.js',
    'server/world_civilization/delegations.js',
    'server/world_civilization/effects.js',
    'server/world_civilization/governance_preflight.js',
    'server/world_civilization/institutions.js',
    'server/world_civilization/lab_surface.js',
    'server/world_civilization/moderation.js',
    'server/world_civilization/mutation_security.js',
    'server/world_civilization/proposals.js',
    'server/world_civilization/public_works.js',
    'server/world_civilization/reputation.js',
    'server/world_civilization/replay_reconstruction.js',
    'server/world_civilization/migration_rehearsal.js',
    'server/world_civilization/rollback_recovery.js',
    'server/world_civilization/readiness_gate.js',
    'server/world_civilization/resilience.js',
    'server/world_civilization/release_review.js',
    'server/world_civilization/schemas.js',
    'server/world_civilization/sqlite_schema.js',
    'server/world_civilization/tool_exposure_gate.js',
    'server/world_civilization/tools.js',
    'server/world_civilization/votes.js',
    'tests/world_civilization_process_restart.test.js',
    'tests/world_civilization_proposal_vote_process_restart.test.js',
    'tests/world_civilization_reputation_moderation_process_restart.test.js',
    'tests/world_civilization_effect_process_restart.test.js',
    'tests/world_civilization_delegation_process_restart.test.js',
    'tests/world_civilization_institution_process_restart.test.js',
    'tests/world_civilization_public_works_process_restart.test.js',
    'tests/world_civilization_schema_metadata.test.js',
    'tests/world_civilization_migration_rehearsal.test.js',
    'tests/world_civilization_load_rate.test.js',
    'tests/world_civilization_rollback_recovery.test.js',
    'tests/world_civilization_readiness_gate.test.js',
    'tests/world_civilization_mutation_security.test.js',
    'tests/world_civilization_tool_exposure_gate.test.js',
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
  const institutionSpec = read('specs/64_agent_town_v6_civic_institution_charter_foundation.md');
  const publicWorksSpec = read('specs/65_agent_town_v6_public_works_shared_resources_foundation.md');
  const labSpec = read('specs/66_agent_town_v6_modal_lab_surface_foundation.md');
  const persistenceSpec = read('specs/67_agent_town_v6_persistence_replay_resilience_foundation.md');
  const releaseReview = read('docs/security/V6_AGENT_CIVILIZATION_RELEASE_REVIEW.md');
  const controlledRunbook = read('docs/ops/V6_AGENT_CIVILIZATION_CONTROLLED_RELEASE_RUNBOOK.md');
  const skillLine = read('docs/internal-skill-testline.md');
  const institutionSource = read('server/world_civilization/institutions.js');
  const publicWorksSource = read('server/world_civilization/public_works.js');
  const labSource = read('server/world_civilization/lab_surface.js');
  const resilienceSource = read('server/world_civilization/resilience.js');
  const readinessSource = read('server/world_civilization/readiness_gate.js');
  const controlledSource = read('server/world_civilization/controlled_release.js');
  const voteSource = read('server/world_civilization/votes.js');
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
  assert.match(readinessSource, /V6_READINESS_GATE_PRODUCTION_ENABLEMENT_FORBIDDEN/);
  assert.match(skillLine, /V6 aggregate readiness gate/);
  assert.match(plan, /Source branch: `codex\/v6-agent-civilization-milestones`/);
  assert.match(plan, /broad V5 prototype overrides do not enable V6/);
  assert.match(spec, /FEATURE_WORLD_V60_AGENT_CIVILIZATION/);
  assert.match(spec, /WORLD_GRID_FEATURE_FLAGS=all/);
  assert.match(gate, /Broad V5 prototype overrides/);
  assert.match(gate, /Production player query\/header overrides must not enable V6\.0/);
  assert.match(plan, /M6 Worker-first V6 tool surface \| `in_progress`/);
  assert.match(plan, /server\/world_civilization\/tools\.js/);
  assert.match(plan, /server\/world_civilization\/tool_exposure_gate\.js/);
  assert.match(plan, /OpenClaw Lite worker origin/);
  assert.match(spec, /research-only civic tool draft/);
  assert.match(spec, /tool exposure gate/);
  assert.match(gate, /server\/world_civilization\/tools\.js/);
  assert.match(gate, /server\/world_civilization\/tool_exposure_gate\.js/);
  assert.match(gate, /hidden from runtime `\/api\/world\/tools`/);
  assert.match(plan, /M8 Vote authorization and delegation \| `in_progress`/);
  assert.match(plan, /evaluateVoteApprovalPolicy\(\)/);
  assert.match(plan, /buildV6VoteAuthorizationReadinessGate\(\)/);
  assert.match(plan, /route-edge vote auth/);
  assert.match(plan, /per-institution voting templates/);
  assert.match(plan, /quorumMinVotes/);
  assert.match(plan, /approvalThresholdBps/);
  assert.match(gate, /evaluateVoteApprovalPolicy\(\)/);
  assert.match(gate, /M8 research-only vote authorization readiness gate/);
  assert.match(gate, /appliesVoteOutcome: false/);
  assert.match(gate, /per-institution voting templates/);
  assert.match(releaseReview, /Vote authorization readiness review/);
  assert.match(releaseReview, /vote authorization readiness gate/);
  assert.match(readinessSource, /vote_authorization_readiness_gate/);
  assert.match(voteSource, /REQUIRED_VOTE_AUTHORIZATION_EVIDENCE_CHECKS/);
  assert.match(voteSource, /route_edge_vote_auth/);
  assert.match(voteSource, /V6_VOTE_AUTHORIZATION_READINESS_RELEASE_READY_FORBIDDEN/);
  assert.match(plan, /M9 Reputation and accountability \| `in_progress`/);
  assert.match(plan, /server\/world_civilization\/reputation\.js/);
  assert.match(plan, /reputation dispute\/review/);
  assert.match(plan, /human dispute requesters/);
  assert.match(plan, /require an existing moderation decision linked to the reputation record source/);
  assert.match(reputationSpec, /requireModerationDecisionForDisputes/);
  assert.match(reputationSpec, /CIVIC_REPUTATION_DISPUTE_MODERATION_DECISION_REQUIRED/);
  assert.match(reputationSpec, /CIVIC_REPUTATION_DISPUTE_MODERATION_DECISION_MISMATCH/);
  assert.match(gate, /server\/world_civilization\/reputation\.js/);
  assert.match(gate, /moderation-decision links that must match the reputation record source/);
  assert.match(gate, /reputation\.disputed/);
  assert.match(plan, /M10 Moderation and privacy layer \| `in_progress`/);
  assert.match(plan, /server\/world_civilization\/moderation\.js/);
  assert.match(plan, /moderation review\/appeal/);
  assert.match(plan, /abuse-report source references/);
  assert.match(moderationSpec, /reputation disputes may optionally require a moderation-store link/);
  assert.match(gate, /server\/world_civilization\/moderation\.js/);
  assert.match(gate, /required public-source review link for reputation disputes/);
  assert.match(gate, /moderation\.reviewed/);
  assert.match(gate, /moderation\.appealed/);
  assert.match(plan, /M11 Civic effect execution and rollback \| `in_progress`/);
  assert.match(plan, /server\/world_civilization\/effects\.js/);
  assert.match(plan, /server\/world_civilization\/governance_preflight\.js/);
  assert.match(plan, /recordProposalReview\(\)/);
  assert.match(plan, /ready_for_vote/);
  assert.match(plan, /proposal\.reviewed/);
  assert.match(plan, /proposal review-ready state, approved moderation, vote approval policy, human approval receipt/);
  assert.match(plan, /schema-level typed effect handler registry/);
  assert.match(plan, /buildV6CivicEffectExecutionGate\(\)/);
  assert.match(plan, /typed apply handlers, typed rollback handlers/);
  assert.match(plan, /release-signed conservation\/rollback execution/);
  assert.match(plan, /server\/world_civilization\/rollback_recovery\.js/);
  assert.match(plan, /without executing state/);
  assert.match(gate, /server\/world_civilization\/effects\.js/);
  assert.match(gate, /server\/world_civilization\/governance_preflight\.js/);
  assert.match(gate, /schema-level typed effect handler registry/);
  assert.match(gate, /typed apply handler\s+evidence/);
  assert.match(gate, /irreversible-action review/);
  assert.match(gate, /executable typed handlers/);
  assert.match(gate, /server\/world_civilization\/rollback_recovery\.js/);
  assert.match(gate, /tests\/world_civilization_rollback_recovery\.test\.js/);
  assert.match(plan, /M12 Agent participation controls \| `in_progress`/);
  assert.match(plan, /server\/world_civilization\/delegations\.js/);
  assert.match(plan, /idempotent action-budget consumption/);
  assert.match(plan, /allowDelegatedExecution/);
  assert.match(plan, /read-only active `civic_execution` delegation proof/);
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
  assert.match(plan, /\/v6.*\/v6-lab.*\/civilization/);
  assert.match(gate, /server\/world_civilization\/lab_surface\.js/);
  assert.match(gate, /town hub modal flow/);
  assert.match(gate, /fail-closed modal launch\s+plan|fail closed for standalone\s+V6 paths/);
  assert.match(gate, /M15\s+research-only lab\s+readiness gate/);
  assert.match(gate, /standaloneRouteAllowed: false/);
  assert.match(labSpec, /buildV6LabReadinessGate\(\)/);
  assert.match(labSpec, /390\/768\/1280 widths/);
  assert.match(labSource, /REQUIRED_LAB_EVIDENCE_CHECKS/);
  assert.match(labSource, /runtime_tool_absence/);
  assert.match(labSource, /V6_LAB_READINESS_RELEASE_READY_FORBIDDEN/);
  assert.match(plan, /M16 Persistence, replay, and resilience hardening \| `in_progress`/);
  assert.match(plan, /server\/world_civilization\/resilience\.js/);
  assert.match(plan, /server\/world_civilization\/sqlite_schema\.js/);
  assert.match(plan, /v1 on-disk schema metadata/);
  assert.match(plan, /server\/world_civilization\/replay_reconstruction\.js/);
  assert.match(plan, /server\/world_civilization\/migration_rehearsal\.js/);
  assert.match(plan, /tests\/world_civilization_migration_rehearsal\.test\.js/);
  assert.match(plan, /unsupported upgrade\/downgrade targets fail closed/);
  assert.match(persistenceSpec, /server\/world_civilization\/migration_rehearsal\.js/);
  assert.match(persistenceSpec, /tests\/world_civilization_migration_rehearsal\.test\.js/);
  assert.match(persistenceSpec, /Unsupported upgrade\/downgrade targets fail closed/);
  assert.match(plan, /tests\/world_civilization_load_rate\.test\.js/);
  assert.match(plan, /research-scale replay pagination plus duplicate retry bursts/);
  assert.match(plan, /tests\/world_civilization_rollback_recovery\.test\.js/);
  assert.match(plan, /prepared rollback-handle reconstruction after reopen/);
  assert.match(plan, /buildV6ResilienceReadinessGate\(\)/);
  assert.match(plan, /migration upgrade\/downgrade scripts/);
  assert.match(plan, /process restart probes now cover audit-ledger, proposal\/vote, reputation record\/dispute, moderation decision\/review, effect\/rollback, delegation, institution, and public-works/);
  assert.match(gate, /server\/world_civilization\/resilience\.js/);
  assert.match(gate, /M16 research-only resilience readiness gate/);
  assert.match(gate, /appliesMigration: false/);
  assert.match(gate, /appliesRollback: false/);
  assert.match(gate, /tests\/world_civilization_schema_metadata\.test\.js/);
  assert.match(gate, /unsupported SQLite `user_version`/);
  assert.match(gate, /server\/world_civilization\/migration_rehearsal\.js/);
  assert.match(gate, /tests\/world_civilization_migration_rehearsal\.test\.js/);
  assert.match(gate, /unsupported upgrade\/downgrade targets fail closed/);
  assert.match(gate, /tests\/world_civilization_load_rate\.test\.js/);
  assert.match(gate, /larger replay pagination and duplicate retry burst/);
  assert.match(gate, /prepared rollback\s+handles can be reconstructed/);
  assert.match(gate, /server\/world_civilization\/replay_reconstruction\.js/);
  assert.match(gate, /tests\/world_civilization_process_restart\.test\.js/);
  assert.match(gate, /tests\/world_civilization_proposal_vote_process_restart\.test\.js/);
  assert.match(gate, /tests\/world_civilization_reputation_moderation_process_restart\.test\.js/);
  assert.match(gate, /tests\/world_civilization_effect_process_restart\.test\.js/);
  assert.match(gate, /tests\/world_civilization_delegation_process_restart\.test\.js/);
  assert.match(gate, /tests\/world_civilization_institution_process_restart\.test\.js/);
  assert.match(gate, /tests\/world_civilization_public_works_process_restart\.test\.js/);
  assert.match(gate, /These current probes cover every current civic store at research scale/);
  assert.match(gate, /Release still requires release-grade process restart coverage/);
  assert.match(persistenceSpec, /buildV6ResilienceReadinessGate\(\)/);
  assert.match(resilienceSource, /REQUIRED_RESILIENCE_EVIDENCE_CHECKS/);
  assert.match(resilienceSource, /typed_rollback_execution_recovery/);
  assert.match(resilienceSource, /V6_RESILIENCE_READINESS_RELEASE_READY_FORBIDDEN/);
  assert.match(plan, /M17 Security and product release review \| `in_progress`/);
  assert.match(plan, /server\/world_civilization\/release_review\.js/);
  assert.match(plan, /store-backed delegation proof and scope-mismatch evidence/);
  assert.match(gate, /server\/world_civilization\/release_review\.js/);
  assert.match(gate, /threat model, privacy review, abuse-case review/);
  assert.match(gate, /store-backed delegation proof and scope-mismatch evidence/);
  assert.match(plan, /modal lab surface review/);
  assert.match(plan, /worker tool surface review/);
  assert.match(plan, /effect execution and rollback review/);
  assert.match(plan, /agent participation enforcement review/);
  assert.match(plan, /civic institution readiness review/);
  assert.match(plan, /public works readiness review/);
  assert.match(plan, /lab readiness gate/);
  assert.match(plan, /resilience readiness review/);
  assert.match(plan, /resilience readiness gate/);
  assert.match(gate, /modal lab\s+surface (launch )?review/);
  assert.match(gate, /effect\s+execution and rollback review/);
  assert.match(gate, /agent participation enforcement review/);
  assert.match(gate, /civic\s+institution readiness review/);
  assert.match(gate, /public works readiness review/);
  assert.match(gate, /resilience readiness review/);
  assert.match(gate, /Worker-first V6 civic tools must pass the exposure gate/);
  assert.match(releaseReview, /lab readiness gate/);
  assert.match(releaseReview, /resilience readiness gate/);
  assert.match(releaseReview, /browser visual 390\/768\/1280 coverage/);
  assert.match(releaseReview, /Civic institution readiness review/);
  assert.match(releaseReview, /institution readiness gate/);
  assert.match(releaseReview, /Public works readiness review/);
  assert.match(releaseReview, /public works readiness gate/);
  assert.match(releaseReview, /Persistence replay resilience readiness review/);
  assert.match(skillLine, /M13 readiness gate/);
  assert.match(skillLine, /civic institution readiness review/);
  assert.match(skillLine, /M14 readiness gate/);
  assert.match(skillLine, /public works readiness review/);
  assert.match(skillLine, /M15 readiness gate/);
  assert.match(skillLine, /normal gameplay exposure denial/);
  assert.match(skillLine, /M16 readiness gate/);
  assert.match(skillLine, /resilience readiness review/);
  assert.match(plan, /M18 V6 controlled release completion \| `in_progress`/);
  assert.match(plan, /server\/world_civilization\/controlled_release\.js/);
  assert.match(plan, /buildV6ReadinessGateReport\(\)/);
  assert.match(plan, /explicit closed V6 readiness-gate report/);
  assert.match(gate, /server\/world_civilization\/controlled_release\.js/);
  assert.match(gate, /closed readiness-gate report/);
  assert.match(gate, /production\s+feature flag safety, rollback\/disable rehearsals/);
  assert.match(controlledRunbook, /explicit closed V6\.0 readiness-gate report/);
  assert.match(controlledRunbook, /readiness report hidden until controlled release/);
  assert.match(controlledSource, /v6ReadinessGateReport/);
  assert.match(controlledSource, /V6_CONTROLLED_RELEASE_READY_WITHOUT_V6_READINESS_GATE/);
  assert.match(controlledSource, /V6_READINESS_GATE_PRE_RELEASE_HIDDEN_REQUIRED/);
  assert.match(skillLine, /explicit closed V6 readiness-gate report/);
});

test('V5 world-grid release promotion gate blocks V6 on prototype-only evidence', () => {
  const gate = read('specs/release-gates/v5_world_grid_release_promotion_gate.md');
  const v6Gate = read('specs/release-gates/v60_agent_civilization_readiness_gate.md');
  const ladder = read('docs/product/WORLD_GRID_LADDER_V5_TO_V6.md');
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
    /Production feature override tests/
  ];

  for (const slice of requiredSlices) {
    assert.match(gate, new RegExp(slice.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), slice);
  }
  for (const control of requiredControls) {
    assert.match(gate, control);
  }
  assert.match(gate, /V6 civic institutions may not become player-visible/);
  assert.match(v6Gate, /specs\/release-gates\/v5_world_grid_release_promotion_gate\.md/);
  assert.match(ladder, /specs\/release-gates\/v5_world_grid_release_promotion_gate\.md/);
});

test('public text rendering policy covers future V6 civic public surfaces', () => {
  const policy = read('docs/security/PUBLIC_TEXT_RENDERING_POLICY.md');
  const presence = read('docs/security/PUBLIC_PRESENCE_REDACTION_POLICY.md');
  const evidence = read('docs/release-evidence/WORLD_GRID_V50_REGION_PROTOTYPE_EVIDENCE_2026-05-26.md');

  assert.match(policy, /textContent/);
  assert.match(policy, /explicit escaping/);
  assert.match(policy, /agent-authored text as untrusted/);
  assert.match(policy, /future V6 civic proposals/);
  assert.match(presence, /PUBLIC_TEXT_RENDERING_POLICY\.md/);
  assert.match(evidence, /Prototype Persistence Warning/);
  assert.match(evidence, /e2e\/242_world_grid_all_features_demo_regression\.spec\.js/);
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

  assert.match(plan, /server\/world_civilization\/mutation_security\.js/);
  assert.match(plan, /delegated-agent proof/);
  assert.match(plan, /store-backed delegated-agent proof with required scope/);
  assert.match(plan, /read-only active `civic_execution` delegation proof/);
  assert.match(spec, /same-origin checks/);
  assert.match(spec, /session\/wallet auth/);
  assert.match(spec, /store-backed delegated-agent\s+proof/);
  assert.match(spec, /remaining\s+action budget/);
  assert.match(spec, /CSRF verification/);
  assert.match(spec, /owner\/surface rate limiting/);
  assert.match(gate, /server\/world_civilization\/mutation_security\.js/);
  assert.match(gate, /store-backed\s+delegated-agent proof/);
  assert.match(gate, /future\s+civic store write/);
  assert.match(security, /route\/tool-required scope/);
  assert.match(security, /mutationApplied: false/);
  assert.match(security, /durable\/session-bound CSRF/);
  assert.match(skillLine, /V6 civic mutation security foundation/);
  assert.match(skillLine, /tests\/world_civilization_mutation_security\.test\.js/);
});

test('V6 worker-first civic tool exposure gate is tracked as an M6 release control', () => {
  const plan = read('docs/product/V6_AGENT_CIVILIZATION_MILESTONE_PLAN.md');
  const spec = read('specs/59_agent_town_v6_worker_tool_surface_draft.md');
  const gate = read('specs/release-gates/v60_agent_civilization_readiness_gate.md');
  const releaseReview = read('docs/security/V6_AGENT_CIVILIZATION_RELEASE_REVIEW.md');
  const skillLine = read('docs/internal-skill-testline.md');
  const toolGate = read('server/world_civilization/tool_exposure_gate.js');

  assert.match(plan, /server\/world_civilization\/tool_exposure_gate\.js/);
  assert.match(plan, /Worker Tools\/Skill Context\/Worker Traffic\/Brain\/Session Context/);
  assert.match(plan, /store-backed delegated-agent proof/);
  assert.match(plan, /read-only delegation budget handling/);
  assert.match(spec, /Exposure gate: `server\/world_civilization\/tool_exposure_gate\.js`/);
  assert.match(spec, /OpenClaw Lite worker origin/);
  assert.match(spec, /same-origin, session\/wallet\s+binding/);
  assert.match(spec, /store-backed delegated-agent proof/);
  assert.match(spec, /read-only delegation budget handling/);
  assert.match(spec, /No `et\.world\.civic\.\*` entry in the runtime tool manifest/);
  assert.match(gate, /releaseReady: false/);
  assert.match(gate, /Worker-first V6 civic tools must pass the exposure gate/);
  assert.match(gate, /store-backed delegated-agent proof/);
  assert.match(gate, /read-only delegation budget handling/);
  assert.match(releaseReview, /Worker tool surface review/);
  assert.match(releaseReview, /no backend shortcuts/);
  assert.match(skillLine, /mutation-security evidence with store-backed delegation proof/);
  assert.match(skillLine, /read-only delegation budget handling/);
  assert.match(skillLine, /tests\/world_civilization_tool_exposure_gate\.test\.js/);
  assert.match(toolGate, /mutation_security_evidence/);
  assert.match(toolGate, /REQUIRED_MUTATION_SECURITY_EVIDENCE_CHECKS/);
  assert.match(toolGate, /store_backed_delegation_proof/);
  assert.match(toolGate, /delegation_scope_mismatch/);
  assert.match(toolGate, /delegation_budget_read_only/);
  assert.match(toolGate, /MUTATION_SECURITY_EVIDENCE_REQUIRED/);
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
  const effectSource = read('server/world_civilization/effects.js');
  const delegationSource = read('server/world_civilization/delegations.js');

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
  assert.match(voteSpec, /buildV6VoteAuthorizationReadinessGate\(\)/);
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
  assert.match(gate, /route-edge scope\/expiry\/budget\/\s+revocation checks/);
  assert.match(gate, /mutatesWorldState: false/);
  assert.match(gate, /`proposal\.reviewed`/);
  assert.match(releaseReview, /proposal `ready_for_vote`\/`rejected` transitions/);
  assert.match(releaseReview, /governance preflight coverage/);
  assert.match(releaseReview, /Vote authorization readiness review/);
  assert.match(releaseReview, /route-edge vote auth/);
  assert.match(releaseReview, /Effect execution and rollback review/);
  assert.match(releaseReview, /effect execution gate/);
  assert.match(releaseReview, /Agent participation enforcement review/);
  assert.match(releaseReview, /agent participation enforcement gate/);
  assert.match(skillLine, /V6 internal proposal lifecycle foundation/);
  assert.match(skillLine, /V6 vote authorization foundation/);
  assert.match(skillLine, /M8 readiness gate/);
  assert.match(skillLine, /M11 effect execution gate/);
  assert.match(skillLine, /applied\/rollback audit evidence/);
  assert.match(skillLine, /M12 enforcement gate/);
  assert.match(skillLine, /no public autonomous mutation/);
  assert.match(skillLine, /loose `allowDelegatedExecution` bypasses/);
  assert.match(skillLine, /tests\/world_civilization_votes\.test\.js/);
  assert.match(skillLine, /tests\/world_civilization_governance_preflight\.test\.js/);
  assert.match(voteSource, /REQUIRED_VOTE_ROUTE_SURFACES/);
  assert.match(voteSource, /human_vote_route/);
  assert.match(voteSource, /V6_VOTE_AUTHORIZATION_READINESS_OUTCOME_APPLICATION_FORBIDDEN/);
  assert.match(effectSource, /REQUIRED_EFFECT_EXECUTION_EVIDENCE_CHECKS/);
  assert.match(effectSource, /irreversible_action_review/);
  assert.match(effectSource, /conservation_tests/);
  assert.match(effectSource, /V6_CIVIC_EFFECT_EXECUTION_RELEASE_READY_FORBIDDEN/);
  assert.match(delegationSource, /REQUIRED_AGENT_PARTICIPATION_EVIDENCE_CHECKS/);
  assert.match(delegationSource, /route_edge_budget_check/);
  assert.match(delegationSource, /no_public_autonomous_mutation/);
  assert.match(delegationSource, /V6_AGENT_PARTICIPATION_ENFORCEMENT_RELEASE_READY_FORBIDDEN/);
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

  assert.match(plan, /durable world-grid audit log foundation/);
  assert.match(plan, /WORLD_GRID_AUDIT_SQLITE_PATH/);
  assert.match(plan, /mutating route\/tool-surface restart matrix proof/);
  assert.match(plan, /duplicate-replay suppression/);
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
  assert.match(security, /every externally visible V5\.1-V5\.5 mutating route and\s+tool surface writes a durable audit row after separate Node process restarts/);
  assert.match(security, /exact idempotent replays do not add duplicate audit rows/);
  assert.match(security, /changed-payload\s+conflicts add no audit rows/);
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
});
