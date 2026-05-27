const { V6_WORLD_FEATURE_FLAG, isWorldGridFeatureEnabled } = require('../world_grid/feature_flags');

const V6_CONTROLLED_RELEASE_VERSION = 'agent-town.v6.controlled_release.v1';

const CONTROLLED_RELEASE_RUNBOOK = 'docs/ops/V6_AGENT_CIVILIZATION_CONTROLLED_RELEASE_RUNBOOK.md';
const V6_READINESS_GATE_ARTIFACT = 'specs/release-gates/v60_agent_civilization_readiness_gate.md';
const V6_MILESTONE_PLAN_ARTIFACT = 'docs/product/V6_AGENT_CIVILIZATION_MILESTONE_PLAN.md';
const BLOCKER_EXCEPTION_REGISTER_ARTIFACT = 'server/world_civilization/blocker_exception_register.js';
const BLOCKER_EXCEPTION_REGISTER_TEST = 'tests/world_civilization_blocker_exception_register.test.js';
const RELEASE_OBSERVABILITY_ARTIFACT = 'server/world_civilization/release_observability.js';
const RELEASE_OBSERVABILITY_TEST = 'tests/world_civilization_release_observability.test.js';
const RELEASE_SUPPORT_ARTIFACT = 'server/world_civilization/release_support.js';
const RELEASE_SUPPORT_TEST = 'tests/world_civilization_release_support.test.js';
const RELEASE_OPERATIONS_ARTIFACT = 'server/world_civilization/release_operations.js';
const RELEASE_OPERATIONS_TEST = 'tests/world_civilization_release_operations.test.js';
const RELEASE_SIGNOFF_PACKET_ARTIFACT = 'server/world_civilization/release_signoff_packet.js';
const RELEASE_SIGNOFF_PACKET_TEST = 'tests/world_civilization_release_signoff_packet.test.js';
const CONTROLLED_RELEASE_TARGET_ARTIFACT = 'server/world_civilization/controlled_release_targets.js';
const CONTROLLED_RELEASE_TARGET_TEST = 'tests/world_civilization_controlled_release_targets.test.js';

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
    key: 'controlled_release_target_gate',
    label: 'Controlled release target gate',
    requiredArtifacts: [
      CONTROLLED_RELEASE_RUNBOOK,
      BLOCKER_EXCEPTION_REGISTER_ARTIFACT,
      BLOCKER_EXCEPTION_REGISTER_TEST,
      RELEASE_OBSERVABILITY_ARTIFACT,
      RELEASE_OBSERVABILITY_TEST,
      RELEASE_SUPPORT_ARTIFACT,
      RELEASE_SUPPORT_TEST,
      RELEASE_OPERATIONS_ARTIFACT,
      RELEASE_OPERATIONS_TEST,
      RELEASE_SIGNOFF_PACKET_ARTIFACT,
      RELEASE_SIGNOFF_PACKET_TEST,
      CONTROLLED_RELEASE_TARGET_ARTIFACT,
      CONTROLLED_RELEASE_TARGET_TEST
    ],
    requiredChecks: [
      'readiness_gate_closed_target',
      'production_flag_safety_target',
      'rollback_disable_target',
      'observability_target',
      'release_operations_target',
      'release_signoff_packet_target',
      'support_runbook_target',
      'blocker_clearance_target',
      'controlled_release_window_target',
      'canary_exit_target',
      'emergency_disable_target',
      'post_release_verification_target'
    ]
  },
  {
    key: 'readiness_gate_closed',
    label: 'V6 readiness gate closed',
    requiredArtifacts: [V6_READINESS_GATE_ARTIFACT, V6_MILESTONE_PLAN_ARTIFACT],
    requiredChecks: [
      'm0_m17_done',
      'v60_gate_closed',
      'v60_gate_report_closed',
      'readiness_audit_summary_proof',
      'release_review_ready'
    ]
  },
  {
    key: 'production_flag_safety',
    label: 'Production feature flag safety',
    requiredArtifacts: [CONTROLLED_RELEASE_RUNBOOK, RELEASE_OPERATIONS_ARTIFACT, RELEASE_OPERATIONS_TEST],
    requiredChecks: ['release_operations_gate', 'production_flag_control', 'default_off', 'admin_only_enablement', 'broad_override_exclusion', 'canary_cohort', 'emergency_disable']
  },
  {
    key: 'rollback_disable_controls',
    label: 'Rollback and disable controls',
    requiredArtifacts: [CONTROLLED_RELEASE_RUNBOOK, RELEASE_OPERATIONS_ARTIFACT, RELEASE_OPERATIONS_TEST],
    requiredChecks: ['release_operations_gate', 'disable_plan', 'rollback_owner', 'rollback_window', 'rollback_rehearsal', 'rollback_disable_drill', 'data_preservation', 'post_disable_verification']
  },
  {
    key: 'observability',
    label: 'Release observability',
    requiredArtifacts: [CONTROLLED_RELEASE_RUNBOOK, RELEASE_OBSERVABILITY_ARTIFACT, RELEASE_OBSERVABILITY_TEST],
    requiredChecks: [
      'release_observability_handoff',
      'audit_metrics',
      'worker_traffic_trace',
      'error_alerts',
      'privacy_safe_logs',
      'feature_flag_dashboard',
      'monitoring_owner',
      'runtime_tool_absence_monitor',
      'support_escalation_link'
    ]
  },
  {
    key: 'support_runbook',
    label: 'Support runbook',
    requiredArtifacts: [CONTROLLED_RELEASE_RUNBOOK, RELEASE_SUPPORT_ARTIFACT, RELEASE_SUPPORT_TEST],
    requiredChecks: [
      'release_support_runbook',
      'known_issues',
      'support_triage',
      'incident_response',
      'user_comms',
      'rollback_contact',
      'support_oncall',
      'escalation_owners',
      'privacy_safe_support_view',
      'blocker_register_link',
      'observability_link'
    ]
  },
  {
    key: 'release_signoff_packet',
    label: 'Release signoff packet',
    requiredArtifacts: [
      CONTROLLED_RELEASE_RUNBOOK,
      RELEASE_SIGNOFF_PACKET_ARTIFACT,
      RELEASE_SIGNOFF_PACKET_TEST
    ],
    requiredChecks: [
      'release_signoff_packet',
      'product_owner_approval',
      'qa_owner_signoff',
      'security_owner_signoff',
      'privacy_owner_signoff',
      'support_owner_signoff',
      'release_manager_approval',
      'engineering_owner_approval',
      'blocker_register_acceptance',
      'release_candidate_packet_acceptance',
      'operations_handoff_acceptance',
      'observability_handoff_acceptance',
      'support_runbook_acceptance'
    ]
  },
  {
    key: 'blocker_clearance',
    label: 'Release blocker clearance',
    requiredArtifacts: [CONTROLLED_RELEASE_RUNBOOK, BLOCKER_EXCEPTION_REGISTER_ARTIFACT, BLOCKER_EXCEPTION_REGISTER_TEST],
    requiredChecks: [
      'blocker_exception_register',
      'no_p0_blockers',
      'no_p1_blockers',
      'no_expired_exceptions',
      'exception_owner_expiry_mitigation',
      'security_dependency_review',
      'qa_signoff',
      'product_signoff'
    ]
  },
  {
    key: 'controlled_release_window',
    label: 'Controlled release window',
    requiredArtifacts: [CONTROLLED_RELEASE_RUNBOOK, RELEASE_OPERATIONS_ARTIFACT, RELEASE_OPERATIONS_TEST],
    requiredChecks: [
      'release_operations_gate',
      'release_window',
      'canary_scope',
      'canary_exit_criteria',
      'emergency_disable',
      'rollback_window',
      'monitoring_owner',
      'go_no_go_record',
      'post_release_verification',
      'normal_gameplay_baseline',
      'audit_replay_health_check',
      'evidence_archive'
    ]
  },
  {
    key: 'release_operations',
    label: 'Controlled release operations',
    requiredArtifacts: [CONTROLLED_RELEASE_RUNBOOK, RELEASE_OPERATIONS_ARTIFACT, RELEASE_OPERATIONS_TEST],
    requiredChecks: [
      'release_operations_gate',
      'production_flag_control',
      'release_window',
      'go_no_go_record',
      'canary_scope',
      'canary_exit',
      'emergency_disable',
      'rollback_window',
      'rollback_disable_drill',
      'post_release_verification',
      'normal_gameplay_baseline',
      'audit_replay_health_check',
      'evidence_archive'
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
    v6ReadinessGateClosed: false,
    v6ReadinessGate: null,
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

function inspectV6ReadinessGate(report = null) {
  const present = report && typeof report === 'object';
  const status = String(report?.status || 'missing');
  const featureFlag = String(report?.featureFlag || 'missing');
  const gateClosed = report?.closed === true;
  const releaseReady = report?.releaseReady === true;
  const runtimeExposed = report?.runtimeExposed === true;
  const playerVisible = report?.playerVisible === true;
  const normalGameplayExposure = report?.normalGameplayExposure === true;
  const featureFlagOk = featureFlag === V6_WORLD_FEATURE_FLAG;
  const hiddenUntilControlledRelease = runtimeExposed === false
    && playerVisible === false
    && normalGameplayExposure === false;
  const errors = [];
  if (!present) errors.push('V6_READINESS_GATE_REPORT_REQUIRED');
  if (!gateClosed) errors.push('V6_READINESS_GATE_CLOSED_REQUIRED');
  if (!releaseReady) errors.push('V6_READINESS_GATE_RELEASE_READY_REQUIRED');
  if (!featureFlagOk) errors.push('V6_READINESS_GATE_FEATURE_FLAG_REQUIRED');
  if (!hiddenUntilControlledRelease) errors.push('V6_READINESS_GATE_PRE_RELEASE_HIDDEN_REQUIRED');

  return {
    status,
    featureFlag,
    gateClosed,
    releaseReady,
    runtimeExposed,
    playerVisible,
    normalGameplayExposure,
    ok: errors.length === 0,
    errors
  };
}

function buildV6ControlledReleaseReport({
  featureFlags = {},
  includeResearchRelease = false,
  source = 'runtime',
  milestoneStatuses = {},
  releaseReviewReport = null,
  v6ReadinessGateReport = null,
  evidence = {}
} = {}) {
  const enabled = includeResearchRelease === true
    && isWorldGridFeatureEnabled(featureFlags, V6_WORLD_FEATURE_FLAG);
  if (!enabled) return disabledReport(source);

  const priorMilestones = inspectPriorMilestones(milestoneStatuses);
  const releaseReviewReady = releaseReviewReport?.releaseReady === true;
  const v6ReadinessGate = inspectV6ReadinessGate(v6ReadinessGateReport);
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
      && v6ReadinessGate.ok
      && gateReports.every((gate) => gate.ok),
    executionStatus: 'not_executable',
    priorMilestones,
    releaseReviewReady,
    v6ReadinessGateClosed: v6ReadinessGate.ok,
    v6ReadinessGate,
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
    if (report.releaseReady === true && report.v6ReadinessGateClosed !== true) {
      errors.push('V6_CONTROLLED_RELEASE_READY_WITHOUT_V6_READINESS_GATE');
    }
    const readinessGate = report.v6ReadinessGate || {};
    if (readinessGate.runtimeExposed === true || readinessGate.playerVisible === true || readinessGate.normalGameplayExposure === true) {
      errors.push('V6_CONTROLLED_RELEASE_READINESS_GATE_PRE_RELEASE_HIDDEN_REQUIRED');
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
  BLOCKER_EXCEPTION_REGISTER_ARTIFACT,
  BLOCKER_EXCEPTION_REGISTER_TEST,
  RELEASE_OBSERVABILITY_ARTIFACT,
  RELEASE_OBSERVABILITY_TEST,
  RELEASE_SUPPORT_ARTIFACT,
  RELEASE_SUPPORT_TEST,
  RELEASE_OPERATIONS_ARTIFACT,
  RELEASE_OPERATIONS_TEST,
  RELEASE_SIGNOFF_PACKET_ARTIFACT,
  RELEASE_SIGNOFF_PACKET_TEST,
  CONTROLLED_RELEASE_TARGET_ARTIFACT,
  CONTROLLED_RELEASE_TARGET_TEST,
  CONTROLLED_RELEASE_RUNBOOK,
  PRIOR_MILESTONE_KEYS: [...PRIOR_MILESTONE_KEYS],
  REQUIRED_CONTROLLED_RELEASE_GATES: clone(REQUIRED_CONTROLLED_RELEASE_GATES),
  V6_CONTROLLED_RELEASE_VERSION,
  V6_MILESTONE_PLAN_ARTIFACT,
  V6_READINESS_GATE_ARTIFACT,
  assertV6ControlledReleaseSafe,
  buildV6ControlledReleaseReport
};
