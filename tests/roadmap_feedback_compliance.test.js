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
    'docs/product/WORLD_GRID_LADDER_V5_TO_V6.md',
    'docs/product/V6_AGENT_CIVILIZATION_MILESTONE_PLAN.md',
    'docs/product/PUBLIC_PRESENCE_PRIVACY_MODEL_V5.md',
    'docs/product/FREE_PLAY_SANDBOX_POLICY_V5_5.md',
    'docs/technical/WORLD_GRID_STATE_MODEL.md',
    'docs/technical/THREEJS_WORLD_ZOOM_RENDERER.md',
    'docs/technical/WORLD_EVENT_CONSERVATION_MODEL.md',
    'docs/technical/PUBLIC_DISTRICT_MODERATION_AND_ROLLBACK.md',
    'docs/security/WORLD_LAYER_SECURITY_REVIEW_V5.md',
    'docs/security/WORLD_GRID_MUTATION_SECURITY_PLAN.md',
    'docs/security/AGENT_SERVICES_DATA_ACCESS_POLICY.md',
    'docs/security/PUBLIC_TEXT_RENDERING_POLICY.md',
    'docs/security/PUBLIC_PRESENCE_REDACTION_POLICY.md',
    'server/world_grid/idempotency.js',
    'server/world_civilization/audit_ledger.js',
    'server/world_civilization/proposals.js',
    'server/world_civilization/schemas.js',
    'server/world_civilization/votes.js',
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
  assert.match(plan, /Source branch: `codex\/v6-agent-civilization-milestones`/);
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
    /same-origin\s+or\s+CSRF protection/,
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
  assert.match(security, /IDEMPOTENCY_CONFLICT/);
  assert.match(security, /process-local\s+request hash\/success response/);
  assert.match(security, /reject conflicting retries after restart/);
  assert.match(stateModel, /server\/world_grid\/idempotency\.js/);
  assert.match(stateModel, /Durable idempotency rows/);
  assert.match(evidence, /Idempotency replay guard/);
  assert.match(evidence, /durable\s+idempotency records/);
});
