const { V6_WORLD_FEATURE_FLAG, isWorldGridFeatureEnabled } = require('../world_grid/feature_flags');

const V6_CONTROLLED_RELEASE_VERSION = 'agent-town.v6.controlled_release.v1';

const CONTROLLED_RELEASE_RUNBOOK = 'docs/ops/V6_AGENT_CIVILIZATION_CONTROLLED_RELEASE_RUNBOOK.md';
const V6_READINESS_GATE_ARTIFACT = 'specs/release-gates/v60_agent_civilization_readiness_gate.md';
const V6_MILESTONE_PLAN_ARTIFACT = 'docs/product/V6_AGENT_CIVILIZATION_MILESTONE_PLAN.md';

const PRIOR_MILESTONE_KEYS = [
  'M0',
  'M1',
  'M2',
  'M3',
  'M4',
  'M5',
  'M6',
  'M7',
  'M8',
  'M9',
  'M10',
  'M11',
  'M12',
  'M13',
  'M14',
  'M15',
  'M16',
  'M17'
];

const REQUIRED_CONTROLLED_RELEASE_GATES = [
  {
    key: 'readiness_gate_closed',
    label: 'V6 readiness gate closed',
    requiredArtifacts: [V6_READINESS_GATE_ARTIFACT, V6_MILESTONE_PLAN_ARTIFACT],
    requiredChecks: ['m0_m17_done', 'v60_gate_closed', 'release_review_ready']
  },
  {
    key: 'production_flag_safety',
    label: 'Production feature flag safety',
    requiredArtifacts: [CONTROLLED_RELEASE_RUNBOOK],
    requiredChecks: ['default_off', 'admin_only_enablement', 'broad_override_exclusion', 'canary_cohort', 'emergency_disable']
  },
  {
    key: 'rollback_disable_controls',
    label: 'Rollback and disable controls',
    requiredArtifacts: [CONTROLLED_RELEASE_RUNBOOK],
    requiredChecks: ['disable_plan', 'rollback_owner', 'rollback_rehearsal', 'data_preservation', 'post_disable_verification']
  },
  {
    key: 'observability',
    label: 'Release observability',
    requiredArtifacts: [CONTROLLED_RELEASE_RUNBOOK],
    requiredChecks: ['audit_metrics', 'worker_traffic_trace', 'error_alerts', 'privacy_safe_logs', 'feature_flag_dashboard']
  },
  {
    key: 'support_runbook',
    label: 'Support runbook',
    requiredArtifacts: [CONTROLLED_RELEASE_RUNBOOK],
    requiredChecks: ['known_issues', 'support_triage', 'incident_response', 'user_comms', 'rollback_contact']
  },
  {
    key: 'blocker_clearance',
    label: 'Release blocker clearance',
    requiredArtifacts: [CONTROLLED_RELEASE_RUNBOOK],
    requiredChecks: ['no_p0_blockers', 'no_p1_blockers', 'security_dependency_review', 'qa_signoff', 'product_signoff']
  },
  {
    key: 'controlled_release_window',
    label: 'Controlled release window',
    requiredArtifacts: [CONTROLLED_RELEASE_RUNBOOK],
    requiredChecks: ['release_window', 'canary_exit_criteria', 'rollback_window', 'monitoring_owner', 'go_no_go_record']
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
    version: V6_CONTROLLED_RELEASE_VERSION,
    status: 'research_only',
    source,
    featureFlag: V6_WORLD_FEATURE_FLAG,
    available: false,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    productionEnabled: false,
    releaseReady: false,
    executionStatus: 'not_executable',
    priorMilestones: [],
    releaseReviewReady: false,
    gateReports: [],
    disabledReason: 'V6 controlled release requires explicit research opt-in and V6 feature flag'
  };
}

function inspectPriorMilestones(statuses = {}) {
  return PRIOR_MILESTONE_KEYS.map((key) => ({
    key,
    status: String(statuses[key] || 'missing'),
    ok: statuses[key] === 'done'
  }));
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

function buildV6ControlledReleaseReport({
  featureFlags = {},
  includeResearchRelease = false,
  source = 'runtime',
  milestoneStatuses = {},
  releaseReviewReport = null,
  evidence = {}
} = {}) {
  const enabled = includeResearchRelease === true
    && isWorldGridFeatureEnabled(featureFlags, V6_WORLD_FEATURE_FLAG);
  if (!enabled) return disabledReport(source);

  const priorMilestones = inspectPriorMilestones(milestoneStatuses);
  const releaseReviewReady = releaseReviewReport?.releaseReady === true;
  const gateReports = REQUIRED_CONTROLLED_RELEASE_GATES.map((gate) => inspectGate(gate, evidence[gate.key] || {}));
  return {
    version: V6_CONTROLLED_RELEASE_VERSION,
    status: 'research_only',
    source,
    featureFlag: V6_WORLD_FEATURE_FLAG,
    available: true,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    productionEnabled: false,
    releaseReady: priorMilestones.every((milestone) => milestone.ok)
      && releaseReviewReady
      && gateReports.every((gate) => gate.ok),
    executionStatus: 'not_executable',
    priorMilestones,
    releaseReviewReady,
    gateReports
  };
}

function assertV6ControlledReleaseSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_CONTROLLED_RELEASE_VERSION) {
    errors.push('V6_CONTROLLED_RELEASE_VERSION_REQUIRED');
  }
  if (report.featureFlag !== V6_WORLD_FEATURE_FLAG) {
    errors.push('V6_CONTROLLED_RELEASE_FEATURE_FLAG_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_CONTROLLED_RELEASE_RESEARCH_ONLY_REQUIRED');
  }
  if (report.runtimeExposed !== false) {
    errors.push('V6_CONTROLLED_RELEASE_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.playerVisible !== false) {
    errors.push('V6_CONTROLLED_RELEASE_PLAYER_HIDDEN_REQUIRED');
  }
  if (report.normalGameplayExposure !== false) {
    errors.push('V6_CONTROLLED_RELEASE_NORMAL_GAMEPLAY_EXPOSURE_FORBIDDEN');
  }
  if (report.productionEnabled !== false) {
    errors.push('V6_CONTROLLED_RELEASE_PRODUCTION_ENABLEMENT_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_CONTROLLED_RELEASE_NON_EXECUTING_REQUIRED');
  }

  if (report.available === true) {
    const milestones = Array.isArray(report.priorMilestones) ? report.priorMilestones : [];
    const milestoneKeys = new Set(milestones.map((milestone) => milestone.key));
    for (const key of PRIOR_MILESTONE_KEYS) {
      if (!milestoneKeys.has(key)) errors.push(`V6_CONTROLLED_RELEASE_MILESTONE_REQUIRED:${key}`);
    }
    const incompleteMilestones = milestones.filter((milestone) => milestone.ok !== true);
    if (report.releaseReady === true && incompleteMilestones.length > 0) {
      errors.push('V6_CONTROLLED_RELEASE_READY_WITH_INCOMPLETE_MILESTONES');
    }
    if (report.releaseReady === true && report.releaseReviewReady !== true) {
      errors.push('V6_CONTROLLED_RELEASE_READY_WITHOUT_RELEASE_REVIEW');
    }

    const gates = Array.isArray(report.gateReports) ? report.gateReports : [];
    const gateKeys = new Set(gates.map((gate) => gate.key));
    for (const gate of REQUIRED_CONTROLLED_RELEASE_GATES) {
      if (!gateKeys.has(gate.key)) errors.push(`V6_CONTROLLED_RELEASE_GATE_REQUIRED:${gate.key}`);
    }
    const failedGates = gates.filter((gate) => gate.ok !== true);
    if (report.releaseReady === true && failedGates.length > 0) {
      errors.push('V6_CONTROLLED_RELEASE_READY_WITH_FAILED_GATES');
    }
  } else if (report.releaseReady === true) {
    errors.push('V6_CONTROLLED_RELEASE_DISABLED_READY_FORBIDDEN');
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  CONTROLLED_RELEASE_RUNBOOK,
  PRIOR_MILESTONE_KEYS: [...PRIOR_MILESTONE_KEYS],
  REQUIRED_CONTROLLED_RELEASE_GATES: clone(REQUIRED_CONTROLLED_RELEASE_GATES),
  V6_CONTROLLED_RELEASE_VERSION,
  V6_MILESTONE_PLAN_ARTIFACT,
  V6_READINESS_GATE_ARTIFACT,
  assertV6ControlledReleaseSafe,
  buildV6ControlledReleaseReport
};
