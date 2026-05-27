const crypto = require('crypto');

const V5_WORLD_GRID_RELEASE_PROMOTION_VERSION = 'agent-town.v5.world-grid.release-promotion.v1';

const REQUIRED_V5_WORLD_GRID_PROMOTION_TARGET_KEYS = [
  'v50_region_grid',
  'v51_territory_claims',
  'v52_public_presence',
  'v53_service_advice',
  'v54_world_events',
  'v55_sandbox_districts',
  'durable_storage_matrix',
  'owner_index_matrix',
  'migration_version_matrix',
  'restart_persistence_matrix',
  'route_tool_mutation_security',
  'session_bound_csrf',
  'owner_surface_rate_limits',
  'idempotency_replay',
  'audit_replay_matrix',
  'production_override_safety',
  'public_text_privacy',
  'player_route_plot_prerequisite',
  'release_replay_reconstruction',
  'provider_logout_signoff',
  'risk_rate_limit_identity'
];

const REQUIRED_V5_WORLD_GRID_RELEASE_GAPS = [
  'final_session_auth_integration_required',
  'live_provider_logout_signoff_required',
  'ip_risk_rate_limit_identity_required',
  'exact_before_state_reconstruction_required',
  'release_replay_reconstruction_required',
  'production_browser_replay_required',
  'final_privacy_security_signoff_required',
  'v5_release_promotion_signoff_required'
];

const V5_WORLD_GRID_RELEASE_PROMOTION_TARGETS = [
  {
    key: 'v50_region_grid',
    slice: 'V5.0 Region Grid',
    requiredEvidence: 'Release promotion must prove deterministic read-only region rendering, no Founders Plot side effects, split browser smoke coverage, and restart-safe owner-indexed camera/focus preference persistence if preferences remain mutable.',
    currentEvidence: 'tests/world_grid_region.test.js, e2e/236_world_grid_v50_region_prototype.spec.js, tests/world_grid_region_preferences_persistence.test.js',
    releaseEvidenceRequired: 'v50_region_release_packet'
  },
  {
    key: 'v51_territory_claims',
    slice: 'V5.1 Territory Claims and Settler Routes',
    requiredEvidence: 'Release promotion must prove existing valid plot prerequisites, owner and adjacency checks, resource conservation, idempotent claim/complete/cancel flows, route/tool audit rows, and restart-safe claim state.',
    currentEvidence: 'tests/world_grid_region.test.js, tests/world_grid_claims_persistence.test.js, e2e/237_world_grid_v51_claims_prototype.spec.js',
    releaseEvidenceRequired: 'v51_claims_release_packet'
  },
  {
    key: 'v52_public_presence',
    slice: 'V5.2 Public Presence and Safe Player Discovery',
    requiredEvidence: 'Release promotion must prove explicit opt-in/out, public-safe profile schema, malicious public name rendering coverage, follow owner checks, abuse report hooks, redaction, and restart-safe public/follow/report persistence.',
    currentEvidence: 'tests/world_grid_public_presence_persistence.test.js, e2e/238_world_grid_v52_public_presence_prototype.spec.js',
    releaseEvidenceRequired: 'v52_public_presence_release_packet'
  },
  {
    key: 'v53_service_advice',
    slice: 'V5.3 Civic Service Advice Prototype',
    requiredEvidence: 'Release promotion must prove redacted request inputs, typed advice summaries, no private-state mutation on advice acceptance, bounded reputation updates, dispute/report flow targets, and restart-safe service/reputation persistence.',
    currentEvidence: 'tests/world_grid_services_persistence.test.js, e2e/239_world_grid_v53_service_redaction_prototype.spec.js',
    releaseEvidenceRequired: 'v53_service_advice_release_packet'
  },
  {
    key: 'v54_world_events',
    slice: 'V5.4 World Events and Public Works',
    requiredEvidence: 'Release promotion must prove contribution caps, reward conservation, idempotent contribution and reward claims, public ledger targets, rollback policy for accounting mistakes, and restart-safe event contribution/reward records.',
    currentEvidence: 'tests/world_grid_events_persistence.test.js, e2e/240_world_grid_v54_event_accounting_prototype.spec.js',
    releaseEvidenceRequired: 'v54_world_events_release_packet'
  },
  {
    key: 'v55_sandbox_districts',
    slice: 'V5.5 Controlled Free-Play Sandbox Districts',
    requiredEvidence: 'Release promotion must prove typed action schemas, moderation before public placement, rollback snapshots, private-town isolation, rate limits, abuse-report targets, and restart-safe participant/action/snapshot/cell records.',
    currentEvidence: 'tests/world_grid_sandbox_persistence.test.js, e2e/241_world_grid_v55_sandbox_prototype.spec.js',
    releaseEvidenceRequired: 'v55_sandbox_release_packet'
  },
  {
    key: 'durable_storage_matrix',
    slice: 'V5.0-V5.5 shared storage',
    requiredEvidence: 'Every mutable V5 store must have durable storage or an explicit release exclusion with owner, migration version, and restart proof.',
    currentEvidence: 'docs/technical/WORLD_GRID_STATE_MODEL.md, tests/world_grid_*_persistence.test.js',
    releaseEvidenceRequired: 'durable_storage_matrix_packet'
  },
  {
    key: 'owner_index_matrix',
    slice: 'V5.0-V5.5 owner safety',
    requiredEvidence: 'Every private and public V5 record type must expose owner/account indexes and prove cross-owner mutation denial or exclusion.',
    currentEvidence: 'docs/technical/WORLD_GRID_STATE_MODEL.md, tests/world_grid_claims_persistence.test.js',
    releaseEvidenceRequired: 'owner_index_matrix_packet'
  },
  {
    key: 'migration_version_matrix',
    slice: 'V5.0-V5.5 schema safety',
    requiredEvidence: 'Every durable V5 store must stamp explicit schema and migration versions with fail-closed drift handling.',
    currentEvidence: 'server/world_grid/*.js',
    releaseEvidenceRequired: 'migration_version_matrix_packet'
  },
  {
    key: 'restart_persistence_matrix',
    slice: 'V5.0-V5.5 restart proof',
    requiredEvidence: 'Every V5 mutable slice must survive process restart without silent recreation, reassignment, duplicate writes, or private-data leakage.',
    currentEvidence: 'tests/world_grid_*_restart_probe_child.js, tests/world_grid_*_persistence.test.js',
    releaseEvidenceRequired: 'restart_persistence_matrix_packet'
  },
  {
    key: 'route_tool_mutation_security',
    slice: 'V5.1-V5.5 mutation surfaces',
    requiredEvidence: 'Every mutating V5 route and tool must require owner/session identity, same-origin context, CSRF where browser sessions exist, idempotency keys, and rate limits.',
    currentEvidence: 'server/world_grid/routes.js, tests/world_grid_region.test.js',
    releaseEvidenceRequired: 'route_tool_mutation_security_packet'
  },
  {
    key: 'session_bound_csrf',
    slice: 'V5 browser mutation security',
    requiredEvidence: 'Release promotion must prove owner-bound, session-bound CSRF tokens, rotation, invalidation, session reset invalidation, disconnect invalidation, and cross-session denial.',
    currentEvidence: 'server/world_grid/csrf.js, tests/world_grid_csrf_persistence.test.js, e2e/243_world_grid_csrf_session_binding.spec.js',
    releaseEvidenceRequired: 'session_bound_csrf_packet'
  },
  {
    key: 'owner_surface_rate_limits',
    slice: 'V5 mutation abuse controls',
    requiredEvidence: 'Release promotion must prove durable owner/surface rate limits plus a release target for IP/risk-aware shared production enforcement.',
    currentEvidence: 'server/world_grid/rate_limit.js, tests/world_grid_rate_limit_persistence.test.js',
    releaseEvidenceRequired: 'owner_surface_rate_limit_packet'
  },
  {
    key: 'idempotency_replay',
    slice: 'V5 retry safety',
    requiredEvidence: 'Every mutating V5 route and tool must replay exact successful retries, reject changed key reuse, and preserve those records across restart.',
    currentEvidence: 'server/world_grid/idempotency.js, tests/world_grid_idempotency_persistence.test.js',
    releaseEvidenceRequired: 'idempotency_replay_packet'
  },
  {
    key: 'audit_replay_matrix',
    slice: 'V5 auditability',
    requiredEvidence: 'Every V5.1-V5.5 mutating route and tool must write append-only audit/replay rows with actor, surface, idempotency key, privacy-safe before/after summaries, and duplicate-replay suppression.',
    currentEvidence: 'server/world_grid/audit_log.js, tests/world_grid_audit_persistence.test.js',
    releaseEvidenceRequired: 'audit_replay_matrix_packet'
  },
  {
    key: 'production_override_safety',
    slice: 'V5/V6 feature safety',
    requiredEvidence: 'Production override tests must prove query/header prototype flags cannot force V5/V6 release surfaces on without authorized controls.',
    currentEvidence: 'server/world_grid/feature_flags.js, tests/world_grid_region.test.js',
    releaseEvidenceRequired: 'production_override_safety_packet'
  },
  {
    key: 'public_text_privacy',
    slice: 'V5 public surfaces',
    requiredEvidence: 'Public V5 surfaces must render user strings through DOM text or explicit escaping, redact private inputs, and prove no private Founders Plot data leaks.',
    currentEvidence: 'docs/security/PUBLIC_TEXT_RENDERING_POLICY.md, docs/security/PUBLIC_PRESENCE_REDACTION_POLICY.md, e2e/238_world_grid_v52_public_presence_prototype.spec.js',
    releaseEvidenceRequired: 'public_text_privacy_packet'
  },
  {
    key: 'player_route_plot_prerequisite',
    slice: 'V5.1+ route prerequisites',
    requiredEvidence: 'Browser player-route coverage must prove same-session Founders Plot entry creates the mutation prerequisite, while pre-prerequisite mutation returns WORLD_GRID_PLOT_REQUIRED without creating a plot.',
    currentEvidence: 'e2e/245_world_grid_player_route_prerequisite.spec.js',
    releaseEvidenceRequired: 'player_route_plot_prerequisite_packet'
  },
  {
    key: 'release_replay_reconstruction',
    slice: 'V5 release replay',
    requiredEvidence: 'Release promotion must prove complete exact per-record before-state reconstruction and release replay reconstruction, not only privacy-safe aggregate before/after summaries.',
    currentEvidence: 'docs/technical/WORLD_GRID_STATE_MODEL.md',
    releaseEvidenceRequired: 'release_replay_reconstruction_packet'
  },
  {
    key: 'provider_logout_signoff',
    slice: 'V5 live session invalidation',
    requiredEvidence: 'Release promotion must include live Privy/provider logout or disconnect signoff that proves browser mutation tokens and session-derived credentials fail closed after account disconnect.',
    currentEvidence: 'specs/release-gates/v5_world_grid_release_promotion_gate.md',
    releaseEvidenceRequired: 'live_provider_logout_signoff_packet'
  },
  {
    key: 'risk_rate_limit_identity',
    slice: 'V5 production abuse controls',
    requiredEvidence: 'Release promotion must define production rate-limit identity that combines owner/session with IP or risk signals without exposing private data or breaking legitimate idempotent retries.',
    currentEvidence: 'docs/technical/WORLD_GRID_STATE_MODEL.md',
    releaseEvidenceRequired: 'risk_rate_limit_identity_packet'
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

function targetMatrixDigest(targets = V5_WORLD_GRID_RELEASE_PROMOTION_TARGETS) {
  return sha256(JSON.stringify(targets.map((target) => ({
    key: target.key,
    slice: target.slice,
    requiredEvidence: target.requiredEvidence,
    releaseEvidenceRequired: target.releaseEvidenceRequired
  }))));
}

function inspectV5WorldGridReleasePromotionTargets(targets = V5_WORLD_GRID_RELEASE_PROMOTION_TARGETS) {
  const safeTargets = Array.isArray(targets) ? targets : [];
  const targetKeys = safeTargets.map((target) => String(target.key || ''));
  const missingKeys = REQUIRED_V5_WORLD_GRID_PROMOTION_TARGET_KEYS.filter((key) => !targetKeys.includes(key));
  const incompleteTargets = safeTargets.filter((target) => (
    !target.key
    || !target.slice
    || !target.requiredEvidence
    || !target.currentEvidence
    || !target.releaseEvidenceRequired
  )).map((target) => String(target.key || 'unknown'));

  return {
    ok: missingKeys.length === 0 && incompleteTargets.length === 0,
    requiredKeys: [...REQUIRED_V5_WORLD_GRID_PROMOTION_TARGET_KEYS],
    targetKeys,
    missingKeys,
    incompleteTargets,
    targetCount: safeTargets.length,
    digest: targetMatrixDigest(safeTargets)
  };
}

function buildMissingReport(errors = []) {
  return {
    version: V5_WORLD_GRID_RELEASE_PROMOTION_VERSION,
    status: 'prototype_promotion_gate',
    ok: false,
    errors,
    releaseReady: false,
    promotionComplete: false,
    v6DependencyReady: false,
    productionReady: false,
    productionEnabled: false,
    runtimeExposed: false,
    playerVisibleByDefault: false,
    normalGameplayExposure: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    enablesV6: false,
    executesPromotion: false,
    executionStatus: 'not_executable',
    targetMatrix: inspectV5WorldGridReleasePromotionTargets([]),
    observedEvidence: {},
    releaseGaps: [...REQUIRED_V5_WORLD_GRID_RELEASE_GAPS]
  };
}

function buildV5WorldGridReleasePromotionReport({
  targets = V5_WORLD_GRID_RELEASE_PROMOTION_TARGETS,
  observed = {},
  source = 'runtime'
} = {}) {
  const targetMatrix = inspectV5WorldGridReleasePromotionTargets(targets);
  const observedEvidence = {
    v50RegionProbeCount: numberValue(observed.v50RegionProbeCount),
    v51ClaimsProbeCount: numberValue(observed.v51ClaimsProbeCount),
    v52PublicPresenceProbeCount: numberValue(observed.v52PublicPresenceProbeCount),
    v53ServiceAdviceProbeCount: numberValue(observed.v53ServiceAdviceProbeCount),
    v54WorldEventsProbeCount: numberValue(observed.v54WorldEventsProbeCount),
    v55SandboxProbeCount: numberValue(observed.v55SandboxProbeCount),
    durableStorageProbeCount: numberValue(observed.durableStorageProbeCount),
    ownerIndexProbeCount: numberValue(observed.ownerIndexProbeCount),
    migrationVersionProbeCount: numberValue(observed.migrationVersionProbeCount),
    restartPersistenceProbeCount: numberValue(observed.restartPersistenceProbeCount),
    routeToolMutationSecurityProbeCount: numberValue(observed.routeToolMutationSecurityProbeCount),
    sessionBoundCsrfProbeCount: numberValue(observed.sessionBoundCsrfProbeCount),
    ownerSurfaceRateLimitProbeCount: numberValue(observed.ownerSurfaceRateLimitProbeCount),
    idempotencyReplayProbeCount: numberValue(observed.idempotencyReplayProbeCount),
    auditReplayMatrixProbeCount: numberValue(observed.auditReplayMatrixProbeCount),
    productionOverrideSafetyProbeCount: numberValue(observed.productionOverrideSafetyProbeCount),
    publicTextPrivacyProbeCount: numberValue(observed.publicTextPrivacyProbeCount),
    playerRoutePlotPrerequisiteProbeCount: numberValue(observed.playerRoutePlotPrerequisiteProbeCount),
    releaseReplayReconstructionProbeCount: numberValue(observed.releaseReplayReconstructionProbeCount),
    providerLogoutSignoffProbeCount: numberValue(observed.providerLogoutSignoffProbeCount),
    riskRateLimitIdentityProbeCount: numberValue(observed.riskRateLimitIdentityProbeCount),
    privateDataExposureCount: numberValue(observed.privateDataExposureCount),
    playerVisibleByDefaultCount: numberValue(observed.playerVisibleByDefaultCount),
    productionOverrideBypassCount: numberValue(observed.productionOverrideBypassCount),
    unauthenticatedMutationCount: numberValue(observed.unauthenticatedMutationCount),
    sideEffectPlotCreationCount: numberValue(observed.sideEffectPlotCreationCount),
    runtimeCivicToolExposureCount: numberValue(observed.runtimeCivicToolExposureCount),
    v6ExposureCount: numberValue(observed.v6ExposureCount),
    appliesWorldState: observed.appliesWorldState === true,
    mutatesWorldState: observed.mutatesWorldState === true,
    exposesPrivateData: observed.exposesPrivateData === true,
    enablesProduction: observed.enablesProduction === true,
    enablesV6: observed.enablesV6 === true,
    playerVisibleByDefault: observed.playerVisibleByDefault === true,
    executesPromotion: observed.executesPromotion === true
  };

  const errors = [];
  if (targetMatrix.ok !== true) errors.push('V5_WORLD_GRID_RELEASE_PROMOTION_TARGET_MATRIX_INCOMPLETE');
  if (observedEvidence.v50RegionProbeCount <= 0) errors.push('V5_WORLD_GRID_PROMOTION_V50_REGION_REQUIRED');
  if (observedEvidence.v51ClaimsProbeCount <= 0) errors.push('V5_WORLD_GRID_PROMOTION_V51_CLAIMS_REQUIRED');
  if (observedEvidence.v52PublicPresenceProbeCount <= 0) errors.push('V5_WORLD_GRID_PROMOTION_V52_PUBLIC_PRESENCE_REQUIRED');
  if (observedEvidence.v53ServiceAdviceProbeCount <= 0) errors.push('V5_WORLD_GRID_PROMOTION_V53_SERVICE_ADVICE_REQUIRED');
  if (observedEvidence.v54WorldEventsProbeCount <= 0) errors.push('V5_WORLD_GRID_PROMOTION_V54_WORLD_EVENTS_REQUIRED');
  if (observedEvidence.v55SandboxProbeCount <= 0) errors.push('V5_WORLD_GRID_PROMOTION_V55_SANDBOX_REQUIRED');
  if (observedEvidence.durableStorageProbeCount <= 0) errors.push('V5_WORLD_GRID_PROMOTION_DURABLE_STORAGE_REQUIRED');
  if (observedEvidence.ownerIndexProbeCount <= 0) errors.push('V5_WORLD_GRID_PROMOTION_OWNER_INDEX_REQUIRED');
  if (observedEvidence.migrationVersionProbeCount <= 0) errors.push('V5_WORLD_GRID_PROMOTION_MIGRATION_VERSION_REQUIRED');
  if (observedEvidence.restartPersistenceProbeCount <= 0) errors.push('V5_WORLD_GRID_PROMOTION_RESTART_PERSISTENCE_REQUIRED');
  if (observedEvidence.routeToolMutationSecurityProbeCount <= 0) errors.push('V5_WORLD_GRID_PROMOTION_MUTATION_SECURITY_REQUIRED');
  if (observedEvidence.sessionBoundCsrfProbeCount <= 0) errors.push('V5_WORLD_GRID_PROMOTION_SESSION_CSRF_REQUIRED');
  if (observedEvidence.ownerSurfaceRateLimitProbeCount <= 0) errors.push('V5_WORLD_GRID_PROMOTION_RATE_LIMIT_REQUIRED');
  if (observedEvidence.idempotencyReplayProbeCount <= 0) errors.push('V5_WORLD_GRID_PROMOTION_IDEMPOTENCY_REQUIRED');
  if (observedEvidence.auditReplayMatrixProbeCount <= 0) errors.push('V5_WORLD_GRID_PROMOTION_AUDIT_REPLAY_REQUIRED');
  if (observedEvidence.productionOverrideSafetyProbeCount <= 0) errors.push('V5_WORLD_GRID_PROMOTION_PRODUCTION_OVERRIDE_REQUIRED');
  if (observedEvidence.publicTextPrivacyProbeCount <= 0) errors.push('V5_WORLD_GRID_PROMOTION_PUBLIC_TEXT_PRIVACY_REQUIRED');
  if (observedEvidence.playerRoutePlotPrerequisiteProbeCount <= 0) errors.push('V5_WORLD_GRID_PROMOTION_PLAYER_ROUTE_PREREQUISITE_REQUIRED');
  if (observedEvidence.releaseReplayReconstructionProbeCount <= 0) errors.push('V5_WORLD_GRID_PROMOTION_RELEASE_REPLAY_REQUIRED');
  if (observedEvidence.providerLogoutSignoffProbeCount <= 0) errors.push('V5_WORLD_GRID_PROMOTION_PROVIDER_LOGOUT_SIGNOFF_REQUIRED');
  if (observedEvidence.riskRateLimitIdentityProbeCount <= 0) errors.push('V5_WORLD_GRID_PROMOTION_RISK_RATE_LIMIT_REQUIRED');
  if (observedEvidence.privateDataExposureCount > 0 || observedEvidence.exposesPrivateData) {
    errors.push('V5_WORLD_GRID_PROMOTION_PRIVATE_DATA_FORBIDDEN');
  }
  if (observedEvidence.playerVisibleByDefaultCount > 0 || observedEvidence.playerVisibleByDefault) {
    errors.push('V5_WORLD_GRID_PROMOTION_PLAYER_DEFAULT_VISIBILITY_FORBIDDEN');
  }
  if (observedEvidence.productionOverrideBypassCount > 0 || observedEvidence.enablesProduction) {
    errors.push('V5_WORLD_GRID_PROMOTION_PRODUCTION_ENABLEMENT_FORBIDDEN');
  }
  if (observedEvidence.unauthenticatedMutationCount > 0) errors.push('V5_WORLD_GRID_PROMOTION_UNAUTHENTICATED_MUTATION_FORBIDDEN');
  if (observedEvidence.sideEffectPlotCreationCount > 0) errors.push('V5_WORLD_GRID_PROMOTION_PLOT_SIDE_EFFECT_FORBIDDEN');
  if (observedEvidence.runtimeCivicToolExposureCount > 0 || observedEvidence.v6ExposureCount > 0 || observedEvidence.enablesV6) {
    errors.push('V5_WORLD_GRID_PROMOTION_V6_EXPOSURE_FORBIDDEN');
  }
  if (observedEvidence.appliesWorldState || observedEvidence.mutatesWorldState || observedEvidence.executesPromotion) {
    errors.push('V5_WORLD_GRID_PROMOTION_EXECUTION_FORBIDDEN');
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
    version: V5_WORLD_GRID_RELEASE_PROMOTION_VERSION,
    status: 'prototype_promotion_gate',
    source,
    ok: true,
    errors: [],
    releaseReady: false,
    promotionComplete: false,
    v6DependencyReady: false,
    productionReady: false,
    productionEnabled: false,
    runtimeExposed: false,
    playerVisibleByDefault: false,
    normalGameplayExposure: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    enablesV6: false,
    executesPromotion: false,
    executionStatus: 'not_executable',
    targetMatrix,
    targets: clone(targets),
    observedEvidence,
    releaseGaps: [...REQUIRED_V5_WORLD_GRID_RELEASE_GAPS]
  };
}

function assertV5WorldGridReleasePromotionReportSafe(report = {}) {
  const errors = [];
  if (report.version !== V5_WORLD_GRID_RELEASE_PROMOTION_VERSION) {
    errors.push('V5_WORLD_GRID_PROMOTION_VERSION_REQUIRED');
  }
  if (report.status !== 'prototype_promotion_gate') {
    errors.push('V5_WORLD_GRID_PROMOTION_STATUS_REQUIRED');
  }
  if (report.releaseReady !== false || report.promotionComplete !== false || report.v6DependencyReady !== false || report.productionReady !== false) {
    errors.push('V5_WORLD_GRID_PROMOTION_RELEASE_READY_FORBIDDEN');
  }
  if (report.productionEnabled !== false) {
    errors.push('V5_WORLD_GRID_PROMOTION_PRODUCTION_ENABLEMENT_FORBIDDEN');
  }
  if (report.runtimeExposed !== false || report.playerVisibleByDefault !== false || report.normalGameplayExposure !== false) {
    errors.push('V5_WORLD_GRID_PROMOTION_VISIBILITY_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V5_WORLD_GRID_PROMOTION_NON_EXECUTING_REQUIRED');
  }
  if (
    report.mutatesWorldState !== false
    || report.enablesV6 !== false
    || report.executesPromotion !== false
  ) {
    errors.push('V5_WORLD_GRID_PROMOTION_EXECUTION_FORBIDDEN');
  }
  if (report.exposesPrivateData !== false) {
    errors.push('V5_WORLD_GRID_PROMOTION_PRIVATE_DATA_FORBIDDEN');
  }
  if (!Array.isArray(report.releaseGaps) || report.releaseGaps.length === 0) {
    errors.push('V5_WORLD_GRID_PROMOTION_RELEASE_GAPS_REQUIRED');
  }
  if (Array.isArray(report.errors) && report.errors.length > 0) {
    errors.push('V5_WORLD_GRID_PROMOTION_ERRORS_PRESENT');
  }
  const observedEvidence = report.observedEvidence || {};
  if (
    numberValue(observedEvidence.privateDataExposureCount) > 0
    || numberValue(observedEvidence.playerVisibleByDefaultCount) > 0
    || numberValue(observedEvidence.productionOverrideBypassCount) > 0
    || numberValue(observedEvidence.unauthenticatedMutationCount) > 0
    || numberValue(observedEvidence.sideEffectPlotCreationCount) > 0
    || numberValue(observedEvidence.runtimeCivicToolExposureCount) > 0
    || numberValue(observedEvidence.v6ExposureCount) > 0
    || observedEvidence.appliesWorldState === true
    || observedEvidence.mutatesWorldState === true
    || observedEvidence.exposesPrivateData === true
    || observedEvidence.enablesProduction === true
    || observedEvidence.enablesV6 === true
    || observedEvidence.playerVisibleByDefault === true
    || observedEvidence.executesPromotion === true
  ) {
    errors.push('V5_WORLD_GRID_PROMOTION_EVIDENCE_SAFETY_REQUIRED');
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  REQUIRED_V5_WORLD_GRID_PROMOTION_TARGET_KEYS,
  REQUIRED_V5_WORLD_GRID_RELEASE_GAPS,
  V5_WORLD_GRID_RELEASE_PROMOTION_TARGETS,
  V5_WORLD_GRID_RELEASE_PROMOTION_VERSION,
  assertV5WorldGridReleasePromotionReportSafe,
  buildV5WorldGridReleasePromotionReport,
  inspectV5WorldGridReleasePromotionTargets
};
