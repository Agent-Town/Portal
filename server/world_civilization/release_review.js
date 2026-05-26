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
    requiredArtifacts: [RELEASE_REVIEW_ARTIFACT],
    requiredChecks: ['spam', 'harassment', 'impersonation', 'unauthorized_mutation', 'moderation_escalation'],
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
      'server/world_civilization/replay_reconstruction.js',
      'server/world_civilization/resilience.js',
      'server/world_civilization/migration_rehearsal.js',
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
      'tests/world_civilization_rollback_recovery.test.js'
    ],
    requiredChecks: [
      'append_only_ledger',
      'owner_indexes',
      'migration_versions',
      'migration_rehearsal',
      'replay_reconstruction',
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
      'tests/world_civilization_resilience.test.js',
      'e2e/242_world_grid_all_features_demo_regression.spec.js'
    ],
    requiredChecks: ['targeted_node_suite', 'split_playwright_smokes', 'all_features_regression', 'feature_override_safety'],
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
