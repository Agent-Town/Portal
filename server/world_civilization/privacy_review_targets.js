const crypto = require('crypto');

const V6_PRIVACY_REVIEW_TARGETS_VERSION = 'agent-town.v6.privacy_review_targets.v1';
const REQUIRED_PRIVACY_REVIEW_TARGET_KEYS = [
  'private_town_isolation',
  'public_surface_data_minimization',
  'wallet_secret_exclusion',
  'brain_provider_secret_exclusion',
  'debug_trace_redaction',
  'worker_observability_redaction',
  'public_text_rendering_xss',
  'modal_lab_private_data_exclusion',
  'audit_summary_minimization',
  'cross_account_boundary'
];
const REQUIRED_PRIVACY_REVIEW_RELEASE_GAPS = [
  'privacy_product_signoff_required',
  'browser_private_town_isolation_smoke_required',
  'debug_trace_redaction_signoff_required',
  'public_surface_data_inventory_required',
  'cross_account_privacy_smoke_required',
  'privacy_incident_runbook_required'
];

const V6_PRIVACY_REVIEW_TARGETS = [
  {
    key: 'private_town_isolation',
    surface: 'private_founders_plot_and_world_grid_state',
    requiredEvidence: 'Public V6 surfaces must not expose private Founders Plot or private world-grid state.',
    currentEvidence: 'docs/technical/WORLD_GRID_STATE_MODEL.md',
    releaseEvidenceRequired: 'browser_private_town_isolation_smoke'
  },
  {
    key: 'public_surface_data_minimization',
    surface: 'public_civic_surfaces',
    requiredEvidence: 'Public civic surfaces need a reviewed inventory of fields that may render outside a private town.',
    currentEvidence: 'docs/security/PUBLIC_TEXT_RENDERING_POLICY.md',
    releaseEvidenceRequired: 'public_surface_data_inventory'
  },
  {
    key: 'wallet_secret_exclusion',
    surface: 'session_wallet_identity',
    requiredEvidence: 'Wallet addresses may appear only as approved identifiers; secrets, signatures, and provider tokens must be excluded.',
    currentEvidence: 'server/world_civilization/session_auth_targets.js',
    releaseEvidenceRequired: 'wallet_secret_exclusion_privacy_review'
  },
  {
    key: 'brain_provider_secret_exclusion',
    surface: 'brain_provider_config',
    requiredEvidence: 'Brain secrets, provider credentials, OAuth tokens, bearer tokens, and API keys must be rejected or redacted.',
    currentEvidence: 'specs/55_agent_town_v6_civic_schema_contracts.md',
    releaseEvidenceRequired: 'brain_provider_secret_redaction_signoff'
  },
  {
    key: 'debug_trace_redaction',
    surface: 'Worker Traffic / Brain / Session Context',
    requiredEvidence: 'Debug traces must redact session, wallet, Brain, provider, and private tool payloads before retention or display.',
    currentEvidence: 'docs/security/V6_AGENT_CIVILIZATION_RELEASE_REVIEW.md',
    releaseEvidenceRequired: 'debug_trace_redaction_browser_evidence'
  },
  {
    key: 'worker_observability_redaction',
    surface: 'OpenClaw Lite observability tabs',
    requiredEvidence: 'Worker observability required for V6 must be useful for QA without leaking private payloads.',
    currentEvidence: 'server/world_civilization/worker_runtime_registration.js',
    releaseEvidenceRequired: 'worker_observability_privacy_trace'
  },
  {
    key: 'public_text_rendering_xss',
    surface: 'public_proposals_votes_charters_moderation_public_works',
    requiredEvidence: 'All future public civic text must use DOM text rendering or explicit escaping and must treat agent-authored text as untrusted.',
    currentEvidence: 'docs/security/PUBLIC_TEXT_RENDERING_POLICY.md',
    releaseEvidenceRequired: 'v6_public_text_xss_browser_suite'
  },
  {
    key: 'modal_lab_private_data_exclusion',
    surface: 'internal_v6_lab_modal',
    requiredEvidence: 'The internal lab modal must not expose private debug data or normal gameplay V6 markers.',
    currentEvidence: 'e2e/244_v6_lab_modal_boundary.spec.js',
    releaseEvidenceRequired: 'lab_modal_privacy_signoff'
  },
  {
    key: 'audit_summary_minimization',
    surface: 'civic_audit_summaries',
    requiredEvidence: 'Audit summaries must be privacy-safe before/after summaries, not row payload dumps.',
    currentEvidence: 'server/world_civilization/replay_reconstruction.js',
    releaseEvidenceRequired: 'privacy_reviewed_audit_summary_inventory'
  },
  {
    key: 'cross_account_boundary',
    surface: 'multi_owner_route_tool_boundaries',
    requiredEvidence: 'Cross-account reads, writes, follows, reports, and civic routes need denial coverage before release.',
    currentEvidence: 'tests/world_grid_public_presence_persistence.test.js',
    releaseEvidenceRequired: 'cross_account_privacy_smoke'
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

function targetMatrixDigest(targets = V6_PRIVACY_REVIEW_TARGETS) {
  return sha256(JSON.stringify(targets.map((target) => ({
    key: target.key,
    surface: target.surface,
    requiredEvidence: target.requiredEvidence,
    releaseEvidenceRequired: target.releaseEvidenceRequired
  }))));
}

function inspectPrivacyReviewTargets(targets = V6_PRIVACY_REVIEW_TARGETS) {
  const safeTargets = Array.isArray(targets) ? targets : [];
  const targetKeys = safeTargets.map((target) => String(target.key || ''));
  const missingKeys = REQUIRED_PRIVACY_REVIEW_TARGET_KEYS.filter((key) => !targetKeys.includes(key));
  const incompleteTargets = safeTargets.filter((target) => (
    !target.key
    || !target.surface
    || !target.requiredEvidence
    || !target.currentEvidence
    || !target.releaseEvidenceRequired
  )).map((target) => String(target.key || 'unknown'));

  return {
    ok: missingKeys.length === 0 && incompleteTargets.length === 0,
    requiredKeys: [...REQUIRED_PRIVACY_REVIEW_TARGET_KEYS],
    targetKeys,
    missingKeys,
    incompleteTargets,
    targetCount: safeTargets.length,
    digest: targetMatrixDigest(safeTargets)
  };
}

function buildMissingReport(errors = []) {
  return {
    version: V6_PRIVACY_REVIEW_TARGETS_VERSION,
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
    executionStatus: 'not_executable',
    targetMatrix: inspectPrivacyReviewTargets([]),
    observedEvidence: {},
    releaseGaps: [...REQUIRED_PRIVACY_REVIEW_RELEASE_GAPS]
  };
}

function buildV6PrivacyReviewTargetReport({
  targets = V6_PRIVACY_REVIEW_TARGETS,
  observed = {},
  source = 'runtime'
} = {}) {
  const targetMatrix = inspectPrivacyReviewTargets(targets);
  const observedEvidence = {
    privateTownIsolationProbeCount: numberValue(observed.privateTownIsolationProbeCount),
    publicSurfaceInventoryProbeCount: numberValue(observed.publicSurfaceInventoryProbeCount),
    secretExclusionProbeCount: numberValue(observed.secretExclusionProbeCount),
    debugTraceRedactionProbeCount: numberValue(observed.debugTraceRedactionProbeCount),
    workerObservabilityRedactionProbeCount: numberValue(observed.workerObservabilityRedactionProbeCount),
    publicTextRenderingProbeCount: numberValue(observed.publicTextRenderingProbeCount),
    modalLabPrivacyProbeCount: numberValue(observed.modalLabPrivacyProbeCount),
    auditSummaryMinimizationProbeCount: numberValue(observed.auditSummaryMinimizationProbeCount),
    crossAccountBoundaryProbeCount: numberValue(observed.crossAccountBoundaryProbeCount),
    privateDataExposureCount: numberValue(observed.privateDataExposureCount),
    secretExposureCount: numberValue(observed.secretExposureCount),
    playerVisibleV6PrivacySurfaceCount: numberValue(observed.playerVisibleV6PrivacySurfaceCount),
    appliesWorldState: observed.appliesWorldState === true,
    mutatesWorldState: observed.mutatesWorldState === true,
    exposesPrivateData: observed.exposesPrivateData === true
  };
  const errors = [];
  if (targetMatrix.ok !== true) errors.push('V6_PRIVACY_REVIEW_TARGET_MATRIX_INCOMPLETE');
  if (observedEvidence.privateTownIsolationProbeCount <= 0) errors.push('V6_PRIVACY_REVIEW_PRIVATE_TOWN_ISOLATION_PROBE_REQUIRED');
  if (observedEvidence.publicSurfaceInventoryProbeCount <= 0) errors.push('V6_PRIVACY_REVIEW_PUBLIC_SURFACE_PROBE_REQUIRED');
  if (observedEvidence.secretExclusionProbeCount <= 0) errors.push('V6_PRIVACY_REVIEW_SECRET_EXCLUSION_PROBE_REQUIRED');
  if (observedEvidence.debugTraceRedactionProbeCount <= 0) errors.push('V6_PRIVACY_REVIEW_DEBUG_TRACE_PROBE_REQUIRED');
  if (observedEvidence.workerObservabilityRedactionProbeCount <= 0) errors.push('V6_PRIVACY_REVIEW_WORKER_OBSERVABILITY_PROBE_REQUIRED');
  if (observedEvidence.publicTextRenderingProbeCount <= 0) errors.push('V6_PRIVACY_REVIEW_PUBLIC_TEXT_PROBE_REQUIRED');
  if (observedEvidence.modalLabPrivacyProbeCount <= 0) errors.push('V6_PRIVACY_REVIEW_MODAL_LAB_PROBE_REQUIRED');
  if (observedEvidence.auditSummaryMinimizationProbeCount <= 0) errors.push('V6_PRIVACY_REVIEW_AUDIT_SUMMARY_PROBE_REQUIRED');
  if (observedEvidence.crossAccountBoundaryProbeCount <= 0) errors.push('V6_PRIVACY_REVIEW_CROSS_ACCOUNT_PROBE_REQUIRED');
  if (
    observedEvidence.privateDataExposureCount > 0
    || observedEvidence.secretExposureCount > 0
    || observedEvidence.exposesPrivateData
  ) {
    errors.push('V6_PRIVACY_REVIEW_PRIVATE_DATA_FORBIDDEN');
  }
  if (observedEvidence.playerVisibleV6PrivacySurfaceCount > 0) errors.push('V6_PRIVACY_REVIEW_PLAYER_SURFACE_FORBIDDEN');
  if (observedEvidence.appliesWorldState || observedEvidence.mutatesWorldState) {
    errors.push('V6_PRIVACY_REVIEW_WORLD_MUTATION_FORBIDDEN');
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
    version: V6_PRIVACY_REVIEW_TARGETS_VERSION,
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
    executionStatus: 'not_executable',
    targetMatrix,
    targets: clone(targets),
    observedEvidence,
    releaseGaps: [...REQUIRED_PRIVACY_REVIEW_RELEASE_GAPS]
  };
}

function assertV6PrivacyReviewTargetReportSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_PRIVACY_REVIEW_TARGETS_VERSION) {
    errors.push('V6_PRIVACY_REVIEW_TARGET_VERSION_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_PRIVACY_REVIEW_TARGET_RESEARCH_ONLY_REQUIRED');
  }
  if (report.releaseReady !== false || report.productionReady !== false) {
    errors.push('V6_PRIVACY_REVIEW_TARGET_RELEASE_READY_FORBIDDEN');
  }
  if (report.runtimeExposed !== false) {
    errors.push('V6_PRIVACY_REVIEW_TARGET_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.playerVisible !== false || report.normalGameplayExposure !== false) {
    errors.push('V6_PRIVACY_REVIEW_TARGET_PLAYER_HIDDEN_REQUIRED');
  }
  if (report.mutatesWorldState !== false) {
    errors.push('V6_PRIVACY_REVIEW_TARGET_WORLD_MUTATION_FORBIDDEN');
  }
  if (report.exposesPrivateData !== false) {
    errors.push('V6_PRIVACY_REVIEW_TARGET_PRIVATE_DATA_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_PRIVACY_REVIEW_TARGET_NON_EXECUTING_REQUIRED');
  }
  if (
    !Array.isArray(report.releaseGaps)
    || REQUIRED_PRIVACY_REVIEW_RELEASE_GAPS.some((gap) => !report.releaseGaps.includes(gap))
  ) {
    errors.push('V6_PRIVACY_REVIEW_TARGET_RELEASE_GAPS_REQUIRED');
  }
  if (report.targetMatrix?.ok !== true || (report.targetMatrix?.missingKeys || []).length > 0) {
    errors.push('V6_PRIVACY_REVIEW_TARGET_MATRIX_REQUIRED');
  }
  const evidence = report.observedEvidence || {};
  if (
    evidence.privateDataExposureCount > 0
    || evidence.secretExposureCount > 0
    || evidence.playerVisibleV6PrivacySurfaceCount > 0
    || evidence.appliesWorldState === true
    || evidence.mutatesWorldState === true
    || evidence.exposesPrivateData === true
  ) {
    errors.push('V6_PRIVACY_REVIEW_TARGET_EVIDENCE_SAFETY_REQUIRED');
  }
  if (report.ok !== true || (Array.isArray(report.errors) && report.errors.length > 0)) {
    errors.push('V6_PRIVACY_REVIEW_TARGET_ERRORS_PRESENT');
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  REQUIRED_PRIVACY_REVIEW_RELEASE_GAPS: [...REQUIRED_PRIVACY_REVIEW_RELEASE_GAPS],
  REQUIRED_PRIVACY_REVIEW_TARGET_KEYS: [...REQUIRED_PRIVACY_REVIEW_TARGET_KEYS],
  V6_PRIVACY_REVIEW_TARGETS: clone(V6_PRIVACY_REVIEW_TARGETS),
  V6_PRIVACY_REVIEW_TARGETS_VERSION,
  assertV6PrivacyReviewTargetReportSafe,
  buildV6PrivacyReviewTargetReport,
  inspectPrivacyReviewTargets
};
