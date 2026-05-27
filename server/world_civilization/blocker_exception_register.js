const crypto = require('crypto');

const V6_BLOCKER_EXCEPTION_REGISTER_VERSION = 'agent-town.v6.blocker_exception_register.v1';

const REQUIRED_BLOCKER_EXCEPTION_REGISTER_KEYS = [
  'register_record',
  'blocker_owner',
  'p0_p1_clearance',
  'exception_owner',
  'exception_expiry',
  'mitigation_plan',
  'release_decision',
  'security_dependency_review',
  'qa_product_security_signoff',
  'controlled_release_handoff',
  'private_data_exclusion'
];

const REQUIRED_BLOCKER_EXCEPTION_REGISTER_GAPS = [
  'blocker_register_record_required',
  'p0_p1_clearance_required',
  'exception_expiry_review_required',
  'security_dependency_review_required',
  'qa_product_security_signoff_required',
  'controlled_release_handoff_required'
];

const V6_BLOCKER_EXCEPTION_REGISTER_REQUIREMENTS = [
  {
    key: 'register_record',
    owner: 'release_manager',
    requiredEvidence: 'The release-candidate packet must contain an explicit blocker and exception register record, even when the register is empty.',
    releaseEvidenceRequired: 'blocker_exception_register_record'
  },
  {
    key: 'blocker_owner',
    owner: 'release_manager',
    requiredEvidence: 'Every blocker must have a durable id, severity, owner, summary, status, target gate, and release decision.',
    releaseEvidenceRequired: 'owned_blocker_rows'
  },
  {
    key: 'p0_p1_clearance',
    owner: 'qa_security_product',
    requiredEvidence: 'No open P0 or P1 blocker may remain before controlled release; exceptions do not make P0/P1 blockers release-clear.',
    releaseEvidenceRequired: 'p0_p1_clearance_record'
  },
  {
    key: 'exception_owner',
    owner: 'release_manager',
    requiredEvidence: 'Every exception must link to a blocker and name owner, approver, scope, and release decision.',
    releaseEvidenceRequired: 'owned_exception_rows'
  },
  {
    key: 'exception_expiry',
    owner: 'release_manager',
    requiredEvidence: 'Every exception must have a non-expired ISO expiry before controlled-release review.',
    releaseEvidenceRequired: 'exception_expiry_review'
  },
  {
    key: 'mitigation_plan',
    owner: 'security_product',
    requiredEvidence: 'Every open non-P0/P1 blocker accepted by exception must include mitigation and monitoring notes.',
    releaseEvidenceRequired: 'exception_mitigation_plan'
  },
  {
    key: 'release_decision',
    owner: 'product_security_qa',
    requiredEvidence: 'Every blocker and exception must record an explicit release decision: close, block, defer, or accepted non-release exception.',
    releaseEvidenceRequired: 'blocker_release_decision_record'
  },
  {
    key: 'security_dependency_review',
    owner: 'security',
    requiredEvidence: 'Security dependency review must approve the blocker register before M18 controlled release can proceed.',
    releaseEvidenceRequired: 'security_dependency_review_approval'
  },
  {
    key: 'qa_product_security_signoff',
    owner: 'qa_product_security',
    requiredEvidence: 'QA, product, security, and release manager signoff must be recorded separately from the register target report.',
    releaseEvidenceRequired: 'qa_product_security_register_signoff'
  },
  {
    key: 'controlled_release_handoff',
    owner: 'release_manager',
    requiredEvidence: 'The register must hand off blocker disposition, exception expiry, mitigation, and rollback contact paths to the M18 controlled-release packet.',
    releaseEvidenceRequired: 'controlled_release_blocker_handoff'
  },
  {
    key: 'private_data_exclusion',
    owner: 'privacy_security',
    requiredEvidence: 'Blocker and exception rows must exclude private town data, wallet secrets, Brain/provider tokens, and raw debug traces.',
    releaseEvidenceRequired: 'blocker_register_private_data_exclusion'
  }
];

const RELEASE_BLOCKING_PRIORITIES = new Set(['P0', 'P1']);
const NON_BLOCKING_PRIORITIES = new Set(['P2', 'P3']);
const CLOSED_BLOCKER_STATUSES = new Set(['closed', 'resolved', 'verified_closed']);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sha256(value = '') {
  return `sha256:${crypto.createHash('sha256').update(String(value || ''), 'utf8').digest('hex')}`;
}

function text(value) {
  return String(value ?? '').trim();
}

function numberValue(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : fallback;
}

function approved(value) {
  return value === true || text(value).toLowerCase() === 'approved';
}

function isoTimeMs(value) {
  const ms = Date.parse(text(value));
  return Number.isFinite(ms) ? ms : null;
}

function asOfIso(value) {
  const parsed = isoTimeMs(value);
  return new Date(parsed ?? Date.now()).toISOString();
}

function targetMatrixDigest(requirements = V6_BLOCKER_EXCEPTION_REGISTER_REQUIREMENTS) {
  return sha256(JSON.stringify(requirements.map((requirement) => ({
    key: requirement.key,
    owner: requirement.owner,
    requiredEvidence: requirement.requiredEvidence,
    releaseEvidenceRequired: requirement.releaseEvidenceRequired
  }))));
}

function inspectBlockerExceptionRegisterRequirements(requirements = V6_BLOCKER_EXCEPTION_REGISTER_REQUIREMENTS) {
  const safeRequirements = Array.isArray(requirements) ? requirements : [];
  const requirementKeys = safeRequirements.map((requirement) => text(requirement.key));
  const missingKeys = REQUIRED_BLOCKER_EXCEPTION_REGISTER_KEYS.filter((key) => !requirementKeys.includes(key));
  const incompleteRequirements = safeRequirements.filter((requirement) => (
    !requirement.key
    || !requirement.owner
    || !requirement.requiredEvidence
    || !requirement.releaseEvidenceRequired
  )).map((requirement) => text(requirement.key) || 'unknown');

  return {
    ok: missingKeys.length === 0 && incompleteRequirements.length === 0,
    requiredKeys: [...REQUIRED_BLOCKER_EXCEPTION_REGISTER_KEYS],
    requirementKeys,
    missingKeys,
    incompleteRequirements,
    requirementCount: safeRequirements.length,
    digest: targetMatrixDigest(safeRequirements)
  };
}

function containsPrivateData(row = {}) {
  return row.containsPrivateData === true
    || row.exposesPrivateData === true
    || numberValue(row.privateDataExposureCount) > 0;
}

function normalizeBlocker(row = {}) {
  const blocker = {
    id: text(row.id),
    priority: text(row.priority).toUpperCase(),
    owner: text(row.owner),
    status: text(row.status || 'open').toLowerCase(),
    decision: text(row.decision),
    summary: text(row.summary),
    targetGate: text(row.targetGate || row.gate),
    mitigation: text(row.mitigation),
    containsPrivateData: containsPrivateData(row)
  };
  const incompleteFields = [];
  for (const field of ['id', 'priority', 'owner', 'status', 'decision', 'summary', 'targetGate']) {
    if (!blocker[field]) incompleteFields.push(field);
  }
  if (!RELEASE_BLOCKING_PRIORITIES.has(blocker.priority) && !NON_BLOCKING_PRIORITIES.has(blocker.priority)) {
    incompleteFields.push('priority');
  }

  const closed = CLOSED_BLOCKER_STATUSES.has(blocker.status);
  return {
    ...blocker,
    closed,
    releaseBlocking: RELEASE_BLOCKING_PRIORITIES.has(blocker.priority) && !closed,
    requiresException: NON_BLOCKING_PRIORITIES.has(blocker.priority) && !closed,
    incompleteFields
  };
}

function normalizeException(row = {}, blockersById = new Map(), asOfMs = Date.now()) {
  const expiresAt = text(row.expiresAt || row.expiry);
  const expiryMs = isoTimeMs(expiresAt);
  const exception = {
    id: text(row.id),
    blockerId: text(row.blockerId),
    owner: text(row.owner),
    approver: text(row.approver),
    scope: text(row.scope),
    decision: text(row.decision),
    mitigation: text(row.mitigation),
    expiresAt,
    containsPrivateData: containsPrivateData(row)
  };
  const incompleteFields = [];
  for (const field of ['id', 'blockerId', 'owner', 'approver', 'scope', 'decision', 'mitigation', 'expiresAt']) {
    if (!exception[field]) incompleteFields.push(field);
  }
  if (!blockersById.has(exception.blockerId)) incompleteFields.push('blockerId');
  const expired = expiryMs === null || expiryMs <= asOfMs;
  return {
    ...exception,
    expired,
    incompleteFields,
    valid: incompleteFields.length === 0 && expired === false && exception.containsPrivateData === false
  };
}

function buildMissingReport(errors = []) {
  return {
    version: V6_BLOCKER_EXCEPTION_REGISTER_VERSION,
    status: 'research_only',
    ok: false,
    errors,
    releaseReady: false,
    productionReady: false,
    productionEnabled: false,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    approvesRelease: false,
    executesRelease: false,
    enablesProduction: false,
    executionStatus: 'not_executable',
    targetMatrix: inspectBlockerExceptionRegisterRequirements([]),
    observedEvidence: {},
    blockerSummaries: [],
    exceptionSummaries: [],
    releaseGaps: [...REQUIRED_BLOCKER_EXCEPTION_REGISTER_GAPS]
  };
}

function buildV6BlockerExceptionRegisterReport({
  requirements = V6_BLOCKER_EXCEPTION_REGISTER_REQUIREMENTS,
  blockers = [],
  exceptions = [],
  signoffs = {},
  asOf = new Date().toISOString(),
  observed = {},
  source = 'runtime'
} = {}) {
  const targetMatrix = inspectBlockerExceptionRegisterRequirements(requirements);
  const asOfValue = asOfIso(asOf);
  const asOfMs = isoTimeMs(asOfValue);
  const blockerSummaries = (Array.isArray(blockers) ? blockers : []).map(normalizeBlocker);
  const blockersById = new Map(blockerSummaries.map((blocker) => [blocker.id, blocker]));
  const exceptionSummaries = (Array.isArray(exceptions) ? exceptions : [])
    .map((exception) => normalizeException(exception, blockersById, asOfMs));
  const validExceptionsByBlocker = new Map();
  for (const exception of exceptionSummaries) {
    if (!exception.valid) continue;
    const current = validExceptionsByBlocker.get(exception.blockerId) || [];
    current.push(exception);
    validExceptionsByBlocker.set(exception.blockerId, current);
  }

  const incompleteBlockers = blockerSummaries.filter((blocker) => blocker.incompleteFields.length > 0);
  const incompleteExceptions = exceptionSummaries.filter((exception) => exception.incompleteFields.length > 0);
  const expiredExceptions = exceptionSummaries.filter((exception) => exception.expired);
  const unlinkedExceptions = exceptionSummaries.filter((exception) => !blockersById.has(exception.blockerId));
  const openP0P1Blockers = blockerSummaries.filter((blocker) => blocker.releaseBlocking);
  const openNonBlockingWithoutException = blockerSummaries.filter((blocker) => (
    blocker.requiresException && !validExceptionsByBlocker.has(blocker.id)
  ));
  const privateDataRows = [
    ...blockerSummaries.filter((blocker) => blocker.containsPrivateData),
    ...exceptionSummaries.filter((exception) => exception.containsPrivateData)
  ];
  const signoffState = {
    releaseManager: approved(signoffs.releaseManager),
    security: approved(signoffs.security),
    qa: approved(signoffs.qa),
    product: approved(signoffs.product),
    securityDependencyReview: approved(signoffs.securityDependencyReview),
    controlledReleaseHandoff: approved(signoffs.controlledReleaseHandoff)
  };
  const observedEvidence = {
    blockerCount: blockerSummaries.length,
    exceptionCount: exceptionSummaries.length,
    closedP0P1BlockerCount: blockerSummaries.filter((blocker) => (
      RELEASE_BLOCKING_PRIORITIES.has(blocker.priority) && blocker.closed
    )).length,
    openP0P1BlockerCount: openP0P1Blockers.length,
    validExceptionCount: exceptionSummaries.filter((exception) => exception.valid).length,
    expiredExceptionCount: expiredExceptions.length,
    unlinkedExceptionCount: unlinkedExceptions.length,
    incompleteBlockerCount: incompleteBlockers.length,
    incompleteExceptionCount: incompleteExceptions.length,
    openNonBlockingWithoutExceptionCount: openNonBlockingWithoutException.length,
    privateDataExposureCount: privateDataRows.length + numberValue(observed.privateDataExposureCount),
    signoffState,
    appliesWorldState: observed.appliesWorldState === true,
    mutatesWorldState: observed.mutatesWorldState === true,
    exposesPrivateData: observed.exposesPrivateData === true,
    approvesRelease: observed.approvesRelease === true,
    enablesProduction: observed.enablesProduction === true,
    executesRelease: observed.executesRelease === true,
    publishesRuntimeTools: observed.publishesRuntimeTools === true
  };
  const errors = [];
  if (targetMatrix.ok !== true) errors.push('V6_BLOCKER_REGISTER_TARGET_MATRIX_INCOMPLETE');
  if (!signoffState.releaseManager) errors.push('V6_BLOCKER_REGISTER_RELEASE_MANAGER_SIGNOFF_REQUIRED');
  if (!signoffState.security) errors.push('V6_BLOCKER_REGISTER_SECURITY_SIGNOFF_REQUIRED');
  if (!signoffState.qa) errors.push('V6_BLOCKER_REGISTER_QA_SIGNOFF_REQUIRED');
  if (!signoffState.product) errors.push('V6_BLOCKER_REGISTER_PRODUCT_SIGNOFF_REQUIRED');
  if (!signoffState.securityDependencyReview) errors.push('V6_BLOCKER_REGISTER_SECURITY_DEPENDENCY_REVIEW_REQUIRED');
  if (!signoffState.controlledReleaseHandoff) errors.push('V6_BLOCKER_REGISTER_CONTROLLED_RELEASE_HANDOFF_REQUIRED');
  if (incompleteBlockers.length > 0) errors.push('V6_BLOCKER_REGISTER_INCOMPLETE_BLOCKER_ROWS');
  if (incompleteExceptions.length > 0) errors.push('V6_BLOCKER_REGISTER_INCOMPLETE_EXCEPTION_ROWS');
  if (expiredExceptions.length > 0) errors.push('V6_BLOCKER_REGISTER_EXPIRED_EXCEPTION');
  if (unlinkedExceptions.length > 0) errors.push('V6_BLOCKER_REGISTER_UNLINKED_EXCEPTION');
  if (openP0P1Blockers.length > 0) errors.push('V6_BLOCKER_REGISTER_P0_P1_OPEN');
  if (openNonBlockingWithoutException.length > 0) {
    errors.push('V6_BLOCKER_REGISTER_OPEN_NONBLOCKING_EXCEPTION_REQUIRED');
  }
  if (observedEvidence.privateDataExposureCount > 0 || observedEvidence.exposesPrivateData) {
    errors.push('V6_BLOCKER_REGISTER_PRIVATE_DATA_FORBIDDEN');
  }
  if (
    observedEvidence.appliesWorldState
    || observedEvidence.mutatesWorldState
    || observedEvidence.approvesRelease
    || observedEvidence.enablesProduction
    || observedEvidence.executesRelease
    || observedEvidence.publishesRuntimeTools
  ) {
    errors.push('V6_BLOCKER_REGISTER_EXECUTION_FORBIDDEN');
  }
  if (errors.length > 0) {
    return {
      ...buildMissingReport(errors),
      source,
      asOf: asOfValue,
      targetMatrix,
      observedEvidence,
      blockerSummaries,
      exceptionSummaries
    };
  }

  return {
    version: V6_BLOCKER_EXCEPTION_REGISTER_VERSION,
    status: 'research_only',
    source,
    asOf: asOfValue,
    ok: true,
    errors: [],
    releaseReady: false,
    productionReady: false,
    productionEnabled: false,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    approvesRelease: false,
    executesRelease: false,
    enablesProduction: false,
    executionStatus: 'not_executable',
    targetMatrix,
    requirements: clone(requirements),
    observedEvidence,
    blockerSummaries,
    exceptionSummaries,
    releaseGaps: [...REQUIRED_BLOCKER_EXCEPTION_REGISTER_GAPS]
  };
}

function assertV6BlockerExceptionRegisterReportSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_BLOCKER_EXCEPTION_REGISTER_VERSION) {
    errors.push('V6_BLOCKER_REGISTER_VERSION_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_BLOCKER_REGISTER_RESEARCH_ONLY_REQUIRED');
  }
  if (report.releaseReady !== false || report.productionReady !== false) {
    errors.push('V6_BLOCKER_REGISTER_RELEASE_READY_FORBIDDEN');
  }
  if (report.productionEnabled !== false || report.enablesProduction !== false) {
    errors.push('V6_BLOCKER_REGISTER_PRODUCTION_ENABLEMENT_FORBIDDEN');
  }
  if (report.runtimeExposed !== false || report.playerVisible !== false || report.normalGameplayExposure !== false) {
    errors.push('V6_BLOCKER_REGISTER_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_BLOCKER_REGISTER_NON_EXECUTING_REQUIRED');
  }
  if (report.mutatesWorldState !== false || report.executesRelease !== false || report.approvesRelease !== false) {
    errors.push('V6_BLOCKER_REGISTER_EXECUTION_FORBIDDEN');
  }
  if (report.exposesPrivateData !== false) {
    errors.push('V6_BLOCKER_REGISTER_PRIVATE_DATA_FORBIDDEN');
  }
  if (!Array.isArray(report.releaseGaps) || report.releaseGaps.length === 0) {
    errors.push('V6_BLOCKER_REGISTER_RELEASE_GAPS_REQUIRED');
  }
  if (Array.isArray(report.errors) && report.errors.length > 0) {
    errors.push('V6_BLOCKER_REGISTER_ERRORS_PRESENT');
  }
  const observedEvidence = report.observedEvidence || {};
  if (
    numberValue(observedEvidence.privateDataExposureCount) > 0
    || observedEvidence.appliesWorldState === true
    || observedEvidence.mutatesWorldState === true
    || observedEvidence.exposesPrivateData === true
    || observedEvidence.approvesRelease === true
    || observedEvidence.enablesProduction === true
    || observedEvidence.executesRelease === true
    || observedEvidence.publishesRuntimeTools === true
  ) {
    errors.push('V6_BLOCKER_REGISTER_EVIDENCE_SAFETY_REQUIRED');
  }
  if (numberValue(observedEvidence.openP0P1BlockerCount) > 0) {
    errors.push('V6_BLOCKER_REGISTER_P0_P1_CLEARANCE_REQUIRED');
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  REQUIRED_BLOCKER_EXCEPTION_REGISTER_GAPS,
  REQUIRED_BLOCKER_EXCEPTION_REGISTER_KEYS,
  V6_BLOCKER_EXCEPTION_REGISTER_REQUIREMENTS,
  V6_BLOCKER_EXCEPTION_REGISTER_VERSION,
  assertV6BlockerExceptionRegisterReportSafe,
  buildV6BlockerExceptionRegisterReport,
  inspectBlockerExceptionRegisterRequirements
};
