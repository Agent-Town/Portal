const crypto = require('crypto');

const V6_THREAT_MODEL_TARGETS_VERSION = 'agent-town.v6.threat_model_targets.v1';
const REQUIRED_THREAT_MODEL_TARGET_KEYS = [
  'trust_boundaries',
  'asset_inventory',
  'attacker_capabilities',
  'abuse_paths',
  'mitigations',
  'residual_risk_owners',
  'worker_route_boundary',
  'public_private_boundary',
  'rollback_failure_modes',
  'release_signoff_inputs'
];
const REQUIRED_THREAT_MODEL_RELEASE_GAPS = [
  'security_owner_signoff_required',
  'trust_boundary_diagram_required',
  'abuse_case_table_required',
  'residual_risk_acceptance_required',
  'incident_response_link_required',
  'release_candidate_review_required'
];

const V6_THREAT_MODEL_TARGETS = [
  {
    key: 'trust_boundaries',
    surface: 'browser_worker_server_stores_public_surfaces',
    requiredEvidence: 'Document boundaries among browser runtime, OpenClaw Lite worker, Express routes, SQLite stores, public surfaces, and normal gameplay.',
    currentEvidence: 'docs/product/V6_AGENT_CIVILIZATION_MILESTONE_PLAN.md',
    releaseEvidenceRequired: 'security_reviewed_trust_boundary_diagram'
  },
  {
    key: 'asset_inventory',
    surface: 'civic_state_identity_private_data',
    requiredEvidence: 'Inventory assets including private town state, wallet/session identity, Brain/provider secrets, civic audit rows, proposal/vote receipts, reputation, moderation, delegations, and rollback handles.',
    currentEvidence: 'server/world_civilization/schemas.js',
    releaseEvidenceRequired: 'security_reviewed_asset_inventory'
  },
  {
    key: 'attacker_capabilities',
    surface: 'route_tool_browser_public_surfaces',
    requiredEvidence: 'Name attacker capabilities including cross-origin requests, stale sessions, cross-wallet replay, malicious public text, delegation abuse, rate-limit bursts, and worker-origin spoofing.',
    currentEvidence: 'docs/security/V6_CIVIC_MUTATION_SECURITY_PLAN.md',
    releaseEvidenceRequired: 'attacker_capability_review'
  },
  {
    key: 'abuse_paths',
    surface: 'civic_mutation_and_public_surfaces',
    requiredEvidence: 'Map abuse paths for unauthorized mutation, proposal spam, vote fraud, reputation farming, moderation evasion, public works spend abuse, and rollback bypass.',
    currentEvidence: 'docs/security/V6_AGENT_CIVILIZATION_RELEASE_REVIEW.md',
    releaseEvidenceRequired: 'abuse_case_table'
  },
  {
    key: 'mitigations',
    surface: 'v6_readiness_gates',
    requiredEvidence: 'Tie mitigations to feature flags, same-origin/CSRF/session auth, idempotency, rate limits, moderation, rollback, privacy, retention, audit replay, and controlled release.',
    currentEvidence: 'server/world_civilization/readiness_gate.js',
    releaseEvidenceRequired: 'mitigation_to_gate_trace'
  },
  {
    key: 'residual_risk_owners',
    surface: 'release_review_signoff',
    requiredEvidence: 'Every residual risk needs security/product/QA owner and explicit accept/block decision before release.',
    currentEvidence: 'server/world_civilization/release_review.js',
    releaseEvidenceRequired: 'residual_risk_owner_table'
  },
  {
    key: 'worker_route_boundary',
    surface: 'openclaw_worker_to_express_routes',
    requiredEvidence: 'Threat model must keep worker-first cognition separate from server route/state validation and block backend shortcuts.',
    currentEvidence: 'server/world_civilization/worker_runtime_registration.js',
    releaseEvidenceRequired: 'worker_route_boundary_review'
  },
  {
    key: 'public_private_boundary',
    surface: 'public_civic_surfaces_private_towns',
    requiredEvidence: 'Threat model must prove public V6 surfaces cannot leak private town state or private debug/provider data.',
    currentEvidence: 'server/world_civilization/privacy_review_targets.js',
    releaseEvidenceRequired: 'public_private_boundary_smoke'
  },
  {
    key: 'rollback_failure_modes',
    surface: 'effect_execution_and_rollback',
    requiredEvidence: 'Threat model must cover failed apply, failed rollback, partial audit write, duplicate replay, irreversible action, and emergency disable paths.',
    currentEvidence: 'server/world_civilization/rollback_execution_targets.js',
    releaseEvidenceRequired: 'rollback_failure_mode_table'
  },
  {
    key: 'release_signoff_inputs',
    surface: 'm17_m18_release_review',
    requiredEvidence: 'Threat model must feed M17 release review and M18 controlled release signoff inputs without enabling production by itself.',
    currentEvidence: 'server/world_civilization/controlled_release.js',
    releaseEvidenceRequired: 'm17_m18_threat_model_signoff_inputs'
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sha256(value = '') {
  return `sha256:${crypto.createHash('sha256').update(String(value || ''), 'utf8').digest('hex')}`;
}

function numberValue(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : fallback;
}

function targetMatrixDigest(targets = V6_THREAT_MODEL_TARGETS) {
  return sha256(JSON.stringify(targets.map((target) => ({
    key: target.key,
    surface: target.surface,
    requiredEvidence: target.requiredEvidence,
    releaseEvidenceRequired: target.releaseEvidenceRequired
  }))));
}

function inspectThreatModelTargets(targets = V6_THREAT_MODEL_TARGETS) {
  const safeTargets = Array.isArray(targets) ? targets : [];
  const targetKeys = safeTargets.map((target) => String(target.key || ''));
  const missingKeys = REQUIRED_THREAT_MODEL_TARGET_KEYS.filter((key) => !targetKeys.includes(key));
  const incompleteTargets = safeTargets.filter((target) => (
    !target.key
    || !target.surface
    || !target.requiredEvidence
    || !target.currentEvidence
    || !target.releaseEvidenceRequired
  )).map((target) => String(target.key || 'unknown'));

  return {
    ok: missingKeys.length === 0 && incompleteTargets.length === 0,
    requiredKeys: [...REQUIRED_THREAT_MODEL_TARGET_KEYS],
    targetKeys,
    missingKeys,
    incompleteTargets,
    targetCount: safeTargets.length,
    digest: targetMatrixDigest(safeTargets)
  };
}

function buildMissingReport(errors = []) {
  return {
    version: V6_THREAT_MODEL_TARGETS_VERSION,
    status: 'research_only',
    ok: false,
    errors,
    releaseReady: false,
    productionReady: false,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    appliesMitigations: false,
    executionStatus: 'not_executable',
    targetMatrix: inspectThreatModelTargets([]),
    observedEvidence: {},
    releaseGaps: [...REQUIRED_THREAT_MODEL_RELEASE_GAPS]
  };
}

function buildV6ThreatModelTargetReport({
  targets = V6_THREAT_MODEL_TARGETS,
  observed = {},
  source = 'runtime'
} = {}) {
  const targetMatrix = inspectThreatModelTargets(targets);
  const observedEvidence = {
    trustBoundaryProbeCount: numberValue(observed.trustBoundaryProbeCount),
    assetInventoryProbeCount: numberValue(observed.assetInventoryProbeCount),
    attackerCapabilityProbeCount: numberValue(observed.attackerCapabilityProbeCount),
    abusePathProbeCount: numberValue(observed.abusePathProbeCount),
    mitigationMappingProbeCount: numberValue(observed.mitigationMappingProbeCount),
    residualRiskOwnerProbeCount: numberValue(observed.residualRiskOwnerProbeCount),
    workerRouteBoundaryProbeCount: numberValue(observed.workerRouteBoundaryProbeCount),
    publicPrivateBoundaryProbeCount: numberValue(observed.publicPrivateBoundaryProbeCount),
    rollbackFailureModeProbeCount: numberValue(observed.rollbackFailureModeProbeCount),
    releaseSignoffInputProbeCount: numberValue(observed.releaseSignoffInputProbeCount),
    privateDataExposureCount: numberValue(observed.privateDataExposureCount),
    playerVisibleThreatModelSurfaceCount: numberValue(observed.playerVisibleThreatModelSurfaceCount),
    appliesMitigations: observed.appliesMitigations === true,
    appliesWorldState: observed.appliesWorldState === true,
    mutatesWorldState: observed.mutatesWorldState === true,
    exposesPrivateData: observed.exposesPrivateData === true
  };
  const errors = [];
  if (targetMatrix.ok !== true) errors.push('V6_THREAT_MODEL_TARGET_MATRIX_INCOMPLETE');
  if (observedEvidence.trustBoundaryProbeCount <= 0) errors.push('V6_THREAT_MODEL_TRUST_BOUNDARY_PROBE_REQUIRED');
  if (observedEvidence.assetInventoryProbeCount <= 0) errors.push('V6_THREAT_MODEL_ASSET_INVENTORY_PROBE_REQUIRED');
  if (observedEvidence.attackerCapabilityProbeCount <= 0) errors.push('V6_THREAT_MODEL_ATTACKER_CAPABILITY_PROBE_REQUIRED');
  if (observedEvidence.abusePathProbeCount <= 0) errors.push('V6_THREAT_MODEL_ABUSE_PATH_PROBE_REQUIRED');
  if (observedEvidence.mitigationMappingProbeCount <= 0) errors.push('V6_THREAT_MODEL_MITIGATION_MAPPING_PROBE_REQUIRED');
  if (observedEvidence.residualRiskOwnerProbeCount <= 0) errors.push('V6_THREAT_MODEL_RESIDUAL_RISK_OWNER_PROBE_REQUIRED');
  if (observedEvidence.workerRouteBoundaryProbeCount <= 0) errors.push('V6_THREAT_MODEL_WORKER_ROUTE_BOUNDARY_PROBE_REQUIRED');
  if (observedEvidence.publicPrivateBoundaryProbeCount <= 0) errors.push('V6_THREAT_MODEL_PUBLIC_PRIVATE_BOUNDARY_PROBE_REQUIRED');
  if (observedEvidence.rollbackFailureModeProbeCount <= 0) errors.push('V6_THREAT_MODEL_ROLLBACK_FAILURE_MODE_PROBE_REQUIRED');
  if (observedEvidence.releaseSignoffInputProbeCount <= 0) errors.push('V6_THREAT_MODEL_RELEASE_SIGNOFF_INPUT_PROBE_REQUIRED');
  if (observedEvidence.privateDataExposureCount > 0 || observedEvidence.exposesPrivateData) {
    errors.push('V6_THREAT_MODEL_PRIVATE_DATA_FORBIDDEN');
  }
  if (observedEvidence.playerVisibleThreatModelSurfaceCount > 0) errors.push('V6_THREAT_MODEL_PLAYER_SURFACE_FORBIDDEN');
  if (observedEvidence.appliesMitigations || observedEvidence.appliesWorldState || observedEvidence.mutatesWorldState) {
    errors.push('V6_THREAT_MODEL_EXECUTION_FORBIDDEN');
  }
  if (errors.length > 0) {
    return {
      ...buildMissingReport(errors),
      source,
      targetMatrix,
      observedEvidence
    };
  }

  return {
    version: V6_THREAT_MODEL_TARGETS_VERSION,
    status: 'research_only',
    source,
    ok: true,
    errors: [],
    releaseReady: false,
    productionReady: false,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    appliesMitigations: false,
    executionStatus: 'not_executable',
    targetMatrix,
    targets: clone(targets),
    observedEvidence,
    releaseGaps: [...REQUIRED_THREAT_MODEL_RELEASE_GAPS]
  };
}

function assertV6ThreatModelTargetReportSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_THREAT_MODEL_TARGETS_VERSION) {
    errors.push('V6_THREAT_MODEL_TARGET_VERSION_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_THREAT_MODEL_TARGET_RESEARCH_ONLY_REQUIRED');
  }
  if (report.releaseReady !== false || report.productionReady !== false) {
    errors.push('V6_THREAT_MODEL_TARGET_RELEASE_READY_FORBIDDEN');
  }
  if (report.runtimeExposed !== false) {
    errors.push('V6_THREAT_MODEL_TARGET_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.playerVisible !== false || report.normalGameplayExposure !== false) {
    errors.push('V6_THREAT_MODEL_TARGET_PLAYER_HIDDEN_REQUIRED');
  }
  if (report.mutatesWorldState !== false || report.appliesMitigations !== false) {
    errors.push('V6_THREAT_MODEL_TARGET_EXECUTION_FORBIDDEN');
  }
  if (report.exposesPrivateData !== false) {
    errors.push('V6_THREAT_MODEL_TARGET_PRIVATE_DATA_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_THREAT_MODEL_TARGET_NON_EXECUTING_REQUIRED');
  }
  if (
    !Array.isArray(report.releaseGaps)
    || REQUIRED_THREAT_MODEL_RELEASE_GAPS.some((gap) => !report.releaseGaps.includes(gap))
  ) {
    errors.push('V6_THREAT_MODEL_TARGET_RELEASE_GAPS_REQUIRED');
  }
  if (report.targetMatrix?.ok !== true || (report.targetMatrix?.missingKeys || []).length > 0) {
    errors.push('V6_THREAT_MODEL_TARGET_MATRIX_REQUIRED');
  }
  const evidence = report.observedEvidence || {};
  if (
    evidence.privateDataExposureCount > 0
    || evidence.playerVisibleThreatModelSurfaceCount > 0
    || evidence.appliesMitigations === true
    || evidence.appliesWorldState === true
    || evidence.mutatesWorldState === true
    || evidence.exposesPrivateData === true
  ) {
    errors.push('V6_THREAT_MODEL_TARGET_EVIDENCE_SAFETY_REQUIRED');
  }
  if (report.ok !== true || (Array.isArray(report.errors) && report.errors.length > 0)) {
    errors.push('V6_THREAT_MODEL_TARGET_ERRORS_PRESENT');
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  REQUIRED_THREAT_MODEL_RELEASE_GAPS: [...REQUIRED_THREAT_MODEL_RELEASE_GAPS],
  REQUIRED_THREAT_MODEL_TARGET_KEYS: [...REQUIRED_THREAT_MODEL_TARGET_KEYS],
  V6_THREAT_MODEL_TARGETS: clone(V6_THREAT_MODEL_TARGETS),
  V6_THREAT_MODEL_TARGETS_VERSION,
  assertV6ThreatModelTargetReportSafe,
  buildV6ThreatModelTargetReport,
  inspectThreatModelTargets
};
