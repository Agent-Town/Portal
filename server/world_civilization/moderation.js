const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const { V6_WORLD_FEATURE_FLAG, isWorldGridFeatureEnabled } = require('../world_grid/feature_flags');
const { createCivicAuditLedger, sha256, stableJson } = require('./audit_ledger');
const { validateModerationDecision, validateModerationReview } = require('./schemas');
const {
  ensureCivicSqliteSchemaMetadata,
  readCivicSqliteSchemaMetadata
} = require('./sqlite_schema');

const MIGRATION_VERSION = 'v1';
const STORE_KEY = 'moderation';
const V6_MODERATION_PRIVACY_READINESS_GATE_VERSION = 'agent-town.v6.moderation_privacy_readiness.v1';
const REQUIRED_MODERATION_PRIVACY_READINESS_CHECKS = [
  'feature_flag',
  'research_opt_in',
  'moderation_privacy_evidence',
  'surface_policy_coverage',
  'review_appeal_operations',
  'redaction_policy_review',
  'public_source_triage',
  'no_runtime_exposure',
  'no_player_visible_moderation',
  'no_moderation_effect_application',
  'no_world_mutation'
];
const REQUIRED_MODERATION_PRIVACY_EVIDENCE_CHECKS = [
  'proposal_text_policy',
  'agent_authored_content_policy',
  'public_profile_policy',
  'attached_media_policy',
  'sandbox_artifact_policy',
  'public_works_effect_policy',
  'abuse_report_triage',
  'appeal_operations',
  'human_review_tooling_plan',
  'redaction_policy_review',
  'public_text_rendering_review',
  'public_presence_privacy_review',
  'private_data_exclusion',
  'review_queue_replay',
  'moderation_audit_rows',
  'appeal_audit_rows'
];
const REQUIRED_MODERATION_SURFACES = [
  'civic_text',
  'public_works',
  'sandbox_policy',
  'reputation_policy',
  'institution_charter'
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeList(value) {
  return Array.isArray(value) ? value.map((entry) => String(entry || '')).filter(Boolean) : [];
}

function check(key, ok, error = '') {
  return { key, ok: ok === true, error: ok === true ? '' : error };
}

function inspectModerationPrivacyReadinessEvidence(evidence = {}) {
  const checks = normalizeList(evidence.checks);
  const surfaces = normalizeList(evidence.surfaces);
  const missingChecks = REQUIRED_MODERATION_PRIVACY_EVIDENCE_CHECKS.filter((entry) => !checks.includes(entry));
  const missingSurfaces = REQUIRED_MODERATION_SURFACES.filter((entry) => !surfaces.includes(entry));
  const surfacePoliciesReviewed = evidence.surfacePoliciesReviewed === true;
  const reviewToolingReviewed = evidence.reviewToolingReviewed === true;
  const appealOperationsReviewed = evidence.appealOperationsReviewed === true;
  const redactionPolicyReviewed = evidence.redactionPolicyReviewed === true;
  const publicTextRenderingReviewed = evidence.publicTextRenderingReviewed === true;
  const publicPresencePrivacyReviewed = evidence.publicPresencePrivacyReviewed === true;
  const publicSourceTriageReviewed = evidence.publicSourceTriageReviewed === true;
  const mediaReviewPlanned = evidence.mediaReviewPlanned === true;
  const privateDataExcluded = evidence.privateDataExcluded === true;
  const auditRowsCovered = evidence.auditRowsCovered === true;
  const ok = evidence.status === 'complete'
    && evidence.executionStatus === 'not_executable'
    && evidence.runtimeExposed === false
    && evidence.playerVisible === false
    && evidence.normalGameplayExposure === false
    && evidence.mutatesWorldState === false
    && evidence.appliesModerationEffects === false
    && evidence.publishesContent === false
    && evidence.exposesPrivateData === false
    && surfacePoliciesReviewed
    && reviewToolingReviewed
    && appealOperationsReviewed
    && redactionPolicyReviewed
    && publicTextRenderingReviewed
    && publicPresencePrivacyReviewed
    && publicSourceTriageReviewed
    && mediaReviewPlanned
    && privateDataExcluded
    && auditRowsCovered
    && missingChecks.length === 0
    && missingSurfaces.length === 0;
  return {
    ok,
    status: String(evidence.status || 'missing'),
    executionStatus: String(evidence.executionStatus || 'missing'),
    runtimeExposed: evidence.runtimeExposed === true,
    playerVisible: evidence.playerVisible === true,
    normalGameplayExposure: evidence.normalGameplayExposure === true,
    mutatesWorldState: evidence.mutatesWorldState === true,
    appliesModerationEffects: evidence.appliesModerationEffects === true,
    publishesContent: evidence.publishesContent === true,
    exposesPrivateData: evidence.exposesPrivateData === true,
    surfacePoliciesReviewed,
    reviewToolingReviewed,
    appealOperationsReviewed,
    redactionPolicyReviewed,
    publicTextRenderingReviewed,
    publicPresencePrivacyReviewed,
    publicSourceTriageReviewed,
    mediaReviewPlanned,
    privateDataExcluded,
    auditRowsCovered,
    requiredChecks: [...REQUIRED_MODERATION_PRIVACY_EVIDENCE_CHECKS],
    checks,
    missingChecks,
    requiredSurfaces: [...REQUIRED_MODERATION_SURFACES],
    surfaces,
    missingSurfaces
  };
}

function disabledModerationPrivacyReadinessReport({ source, reason }) {
  return {
    version: V6_MODERATION_PRIVACY_READINESS_GATE_VERSION,
    status: 'research_only',
    source,
    featureFlag: V6_WORLD_FEATURE_FLAG,
    available: false,
    researchReady: false,
    releaseReady: false,
    failClosed: true,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    mutatesWorldState: false,
    appliesModerationEffects: false,
    publishesContent: false,
    exposesPrivateData: false,
    executionStatus: 'not_executable',
    evidence: inspectModerationPrivacyReadinessEvidence({}),
    checks: [],
    errors: [reason],
    disabledReason: reason
  };
}

function buildV6ModerationPrivacyReadinessGate({
  featureFlags = {},
  includeResearchModerationPrivacy = false,
  source = 'runtime',
  evidence = {}
} = {}) {
  const enabled = includeResearchModerationPrivacy === true
    && isWorldGridFeatureEnabled(featureFlags, V6_WORLD_FEATURE_FLAG);
  if (!enabled) {
    return disabledModerationPrivacyReadinessReport({
      source,
      reason: 'V6 moderation privacy readiness requires explicit research opt-in and V6 feature flag'
    });
  }

  const evidenceReport = inspectModerationPrivacyReadinessEvidence(evidence);
  const checks = [
    check('feature_flag', isWorldGridFeatureEnabled(featureFlags, V6_WORLD_FEATURE_FLAG), 'FEATURE_DISABLED'),
    check('research_opt_in', includeResearchModerationPrivacy === true, 'RESEARCH_OPT_IN_REQUIRED'),
    check(
      'moderation_privacy_evidence',
      evidenceReport.status === 'complete' && evidenceReport.missingChecks.length === 0,
      'MODERATION_PRIVACY_EVIDENCE_REQUIRED'
    ),
    check(
      'surface_policy_coverage',
      evidenceReport.surfacePoliciesReviewed && evidenceReport.missingSurfaces.length === 0,
      'MODERATION_SURFACE_POLICY_COVERAGE_REQUIRED'
    ),
    check(
      'review_appeal_operations',
      evidenceReport.reviewToolingReviewed && evidenceReport.appealOperationsReviewed,
      'MODERATION_REVIEW_APPEAL_OPERATIONS_REQUIRED'
    ),
    check(
      'redaction_policy_review',
      evidenceReport.redactionPolicyReviewed
        && evidenceReport.publicTextRenderingReviewed
        && evidenceReport.publicPresencePrivacyReviewed
        && evidenceReport.privateDataExcluded
        && evidenceReport.exposesPrivateData === false,
      'MODERATION_REDACTION_POLICY_REVIEW_REQUIRED'
    ),
    check(
      'public_source_triage',
      evidenceReport.publicSourceTriageReviewed && evidenceReport.mediaReviewPlanned,
      'MODERATION_PUBLIC_SOURCE_TRIAGE_REQUIRED'
    ),
    check(
      'no_runtime_exposure',
      evidenceReport.executionStatus === 'not_executable' && evidenceReport.runtimeExposed === false,
      'MODERATION_RUNTIME_EXPOSURE_FORBIDDEN'
    ),
    check(
      'no_player_visible_moderation',
      evidenceReport.playerVisible === false && evidenceReport.normalGameplayExposure === false,
      'MODERATION_PLAYER_VISIBLE_SURFACE_FORBIDDEN'
    ),
    check(
      'no_moderation_effect_application',
      evidenceReport.appliesModerationEffects === false && evidenceReport.publishesContent === false,
      'MODERATION_EFFECT_APPLICATION_FORBIDDEN'
    ),
    check(
      'no_world_mutation',
      evidenceReport.mutatesWorldState === false,
      'MODERATION_WORLD_MUTATION_FORBIDDEN'
    )
  ];
  const researchReady = checks.every((entry) => entry.ok);

  return {
    version: V6_MODERATION_PRIVACY_READINESS_GATE_VERSION,
    status: 'research_only',
    source,
    featureFlag: V6_WORLD_FEATURE_FLAG,
    available: true,
    researchReady,
    releaseReady: false,
    failClosed: researchReady !== true,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    mutatesWorldState: false,
    appliesModerationEffects: false,
    publishesContent: false,
    exposesPrivateData: false,
    executionStatus: 'not_executable',
    evidence: evidenceReport,
    checks,
    errors: checks.filter((entry) => !entry.ok).map((entry) => entry.error)
  };
}

function assertV6ModerationPrivacyReadinessGateSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_MODERATION_PRIVACY_READINESS_GATE_VERSION) {
    errors.push('V6_MODERATION_PRIVACY_READINESS_VERSION_REQUIRED');
  }
  if (report.featureFlag !== V6_WORLD_FEATURE_FLAG) {
    errors.push('V6_MODERATION_PRIVACY_READINESS_FEATURE_FLAG_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_MODERATION_PRIVACY_READINESS_RESEARCH_ONLY_REQUIRED');
  }
  if (report.runtimeExposed !== false) {
    errors.push('V6_MODERATION_PRIVACY_READINESS_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.playerVisible !== false) {
    errors.push('V6_MODERATION_PRIVACY_READINESS_PLAYER_HIDDEN_REQUIRED');
  }
  if (report.normalGameplayExposure !== false) {
    errors.push('V6_MODERATION_PRIVACY_READINESS_NORMAL_GAMEPLAY_FORBIDDEN');
  }
  if (report.mutatesWorldState !== false) {
    errors.push('V6_MODERATION_PRIVACY_READINESS_WORLD_MUTATION_FORBIDDEN');
  }
  if (report.appliesModerationEffects !== false) {
    errors.push('V6_MODERATION_PRIVACY_READINESS_EFFECT_APPLICATION_FORBIDDEN');
  }
  if (report.publishesContent !== false) {
    errors.push('V6_MODERATION_PRIVACY_READINESS_CONTENT_PUBLICATION_FORBIDDEN');
  }
  if (report.exposesPrivateData !== false) {
    errors.push('V6_MODERATION_PRIVACY_READINESS_PRIVATE_DATA_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_MODERATION_PRIVACY_READINESS_NON_EXECUTING_REQUIRED');
  }
  if (report.releaseReady !== false) {
    errors.push('V6_MODERATION_PRIVACY_READINESS_RELEASE_READY_FORBIDDEN');
  }
  if (report.available === true) {
    const checkKeys = new Set((report.checks || []).map((entry) => entry.key));
    for (const key of REQUIRED_MODERATION_PRIVACY_READINESS_CHECKS) {
      if (!checkKeys.has(key)) errors.push(`V6_MODERATION_PRIVACY_READINESS_CHECK_REQUIRED:${key}`);
    }
    const failedChecks = (report.checks || []).filter((entry) => entry.ok !== true);
    if (report.researchReady === true && failedChecks.length > 0) {
      errors.push('V6_MODERATION_PRIVACY_READINESS_READY_WITH_FAILED_CHECKS');
    }
    if (report.researchReady !== true && report.failClosed !== true) {
      errors.push('V6_MODERATION_PRIVACY_READINESS_DENIAL_FAIL_CLOSED_REQUIRED');
    }
    const evidence = report.evidence || {};
    if (evidence.runtimeExposed === true) {
      errors.push('V6_MODERATION_PRIVACY_READINESS_EVIDENCE_RUNTIME_HIDDEN_REQUIRED');
    }
    if (evidence.playerVisible === true || evidence.normalGameplayExposure === true) {
      errors.push('V6_MODERATION_PRIVACY_READINESS_EVIDENCE_PLAYER_HIDDEN_REQUIRED');
    }
    if (evidence.mutatesWorldState === true) {
      errors.push('V6_MODERATION_PRIVACY_READINESS_EVIDENCE_WORLD_MUTATION_FORBIDDEN');
    }
    if (evidence.appliesModerationEffects === true) {
      errors.push('V6_MODERATION_PRIVACY_READINESS_EVIDENCE_EFFECT_APPLICATION_FORBIDDEN');
    }
    if (evidence.publishesContent === true) {
      errors.push('V6_MODERATION_PRIVACY_READINESS_EVIDENCE_CONTENT_PUBLICATION_FORBIDDEN');
    }
    if (evidence.exposesPrivateData === true) {
      errors.push('V6_MODERATION_PRIVACY_READINESS_EVIDENCE_PRIVATE_DATA_FORBIDDEN');
    }
    if (report.researchReady === true && evidence.ok !== true) {
      errors.push('V6_MODERATION_PRIVACY_READINESS_READY_WITHOUT_EVIDENCE');
    }
  } else if (report.failClosed !== true) {
    errors.push('V6_MODERATION_PRIVACY_READINESS_DISABLED_FAIL_CLOSED_REQUIRED');
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

function parseModerationRow(row) {
  if (!row) return null;
  return {
    decisionId: row.decision_id,
    subjectRef: row.subject_ref,
    surface: row.surface,
    status: row.status,
    policyVersion: row.policy_version,
    reviewerKind: row.reviewer_kind,
    auditEntryId: row.audit_entry_id,
    createdAtMs: Number(row.created_at),
    decision: JSON.parse(row.decision_json)
  };
}

function parseReviewRow(row) {
  if (!row) return null;
  return {
    reviewId: row.review_id,
    decisionId: row.decision_id,
    subjectRef: row.subject_ref,
    surface: row.surface,
    policyVersion: row.policy_version,
    reviewType: row.review_type,
    status: row.status,
    requestedByAccountId: row.requested_by_account_id,
    reviewerKind: row.reviewer_kind,
    auditEntryId: row.audit_entry_id,
    createdAtMs: Number(row.created_at),
    review: JSON.parse(row.review_json)
  };
}

function ensureSchema(db) {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS world_civic_moderation_decisions (
      decision_id TEXT PRIMARY KEY,
      subject_ref TEXT NOT NULL,
      surface TEXT NOT NULL,
      status TEXT NOT NULL,
      policy_version TEXT NOT NULL,
      reviewer_kind TEXT NOT NULL,
      audit_entry_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      decision_json TEXT NOT NULL,
      UNIQUE(subject_ref, surface, policy_version)
    );
    CREATE INDEX IF NOT EXISTS idx_world_civic_moderation_subject
      ON world_civic_moderation_decisions(subject_ref, created_at);
    CREATE INDEX IF NOT EXISTS idx_world_civic_moderation_surface_status
      ON world_civic_moderation_decisions(surface, status, created_at);
    CREATE INDEX IF NOT EXISTS idx_world_civic_moderation_policy
      ON world_civic_moderation_decisions(policy_version, created_at);
    CREATE INDEX IF NOT EXISTS idx_world_civic_moderation_reviewer
      ON world_civic_moderation_decisions(reviewer_kind, created_at);

    CREATE TABLE IF NOT EXISTS world_civic_moderation_reviews (
      review_id TEXT PRIMARY KEY,
      decision_id TEXT NOT NULL,
      subject_ref TEXT NOT NULL,
      surface TEXT NOT NULL,
      policy_version TEXT NOT NULL,
      review_type TEXT NOT NULL,
      status TEXT NOT NULL,
      requested_by_account_id TEXT NOT NULL,
      reviewer_kind TEXT NOT NULL,
      audit_entry_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      review_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_world_civic_moderation_reviews_decision
      ON world_civic_moderation_reviews(decision_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_world_civic_moderation_reviews_subject
      ON world_civic_moderation_reviews(subject_ref, created_at);
    CREATE INDEX IF NOT EXISTS idx_world_civic_moderation_reviews_queue
      ON world_civic_moderation_reviews(review_type, status, created_at);
    CREATE INDEX IF NOT EXISTS idx_world_civic_moderation_reviews_requester
      ON world_civic_moderation_reviews(requested_by_account_id, created_at);
  `);
  return ensureCivicSqliteSchemaMetadata(db, {
    storeKey: STORE_KEY,
    migrationVersion: MIGRATION_VERSION,
    modulePath: 'server/world_civilization/moderation.js'
  });
}

function buildStatements(db) {
  return {
    byDecisionId: db.prepare(`
      SELECT *
      FROM world_civic_moderation_decisions
      WHERE decision_id = ?
      LIMIT 1
    `),
    bySubjectSurfacePolicy: db.prepare(`
      SELECT *
      FROM world_civic_moderation_decisions
      WHERE subject_ref = ? AND surface = ? AND policy_version = ?
      LIMIT 1
    `),
    insert: db.prepare(`
      INSERT INTO world_civic_moderation_decisions (
        decision_id, subject_ref, surface, status, policy_version,
        reviewer_kind, audit_entry_id, created_at, decision_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    list: db.prepare(`
      SELECT *
      FROM world_civic_moderation_decisions
      WHERE (? = '' OR subject_ref = ?)
        AND (? = '' OR surface = ?)
        AND (? = '' OR status = ?)
        AND (? = '' OR reviewer_kind = ?)
      ORDER BY created_at ASC, decision_id ASC
      LIMIT ?
    `),
    byReviewId: db.prepare(`
      SELECT *
      FROM world_civic_moderation_reviews
      WHERE review_id = ?
      LIMIT 1
    `),
    insertReview: db.prepare(`
      INSERT INTO world_civic_moderation_reviews (
        review_id, decision_id, subject_ref, surface, policy_version, review_type,
        status, requested_by_account_id, reviewer_kind, audit_entry_id, created_at,
        review_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    listReviews: db.prepare(`
      SELECT *
      FROM world_civic_moderation_reviews
      WHERE (? = '' OR decision_id = ?)
        AND (? = '' OR subject_ref = ?)
        AND (? = '' OR review_type = ?)
        AND (? = '' OR status = ?)
      ORDER BY created_at ASC, review_id ASC
      LIMIT ?
    `),
    summaryCounts: db.prepare(`
      SELECT surface, status, COUNT(1) AS count
      FROM world_civic_moderation_decisions
      WHERE subject_ref = ?
      GROUP BY surface, status
    `),
    summaryDecisions: db.prepare(`
      SELECT *
      FROM world_civic_moderation_decisions
      WHERE subject_ref = ?
      ORDER BY created_at DESC, decision_id DESC
    `),
    count: db.prepare('SELECT COUNT(1) AS count FROM world_civic_moderation_decisions'),
    reviewCount: db.prepare('SELECT COUNT(1) AS count FROM world_civic_moderation_reviews')
  };
}

function auditIdempotencyKey(decision) {
  return `idem_${decision.decisionId.replace(/^moderation_/, 'mod_').slice(0, 80)}`;
}

function auditActorFor(decision) {
  if (decision.reviewerKind === 'system') {
    return {
      kind: 'agent',
      accountId: 'acct_system_moderation',
      agentId: 'agent_system_moderation'
    };
  }
  return {
    kind: 'human',
    accountId: 'acct_human_moderator'
  };
}

function auditActorForReview(review) {
  return {
    kind: 'human',
    accountId: review.requestedBy.accountId
  };
}

function createModerationAuditEntry(decision, nowMs) {
  const redactedFieldCount = Array.isArray(decision.redactedFields) ? decision.redactedFields.length : 0;
  return {
    schemaVersion: decision.schemaVersion,
    entryId: `audit_${decision.decisionId.replace(/^moderation_/, 'moderation_')}`,
    actor: auditActorFor(decision),
    actionType: 'moderation.decided',
    objectRef: decision.decisionId,
    idempotencyKey: auditIdempotencyKey(decision),
    beforeHash: sha256(`agent-town.v6.civic.moderation.absent:${decision.decisionId}`),
    afterHash: sha256(stableJson(decision)),
    beforeSummary: `No moderation decision existed for ${decision.decisionId} on ${decision.subjectRef}.`,
    afterSummary: `Recorded moderation decision ${decision.decisionId} as ${decision.status} for ${decision.surface} under ${decision.policyVersion}; redacted field count ${redactedFieldCount}.`,
    createdAtMs: nowMs,
    migrationVersion: MIGRATION_VERSION,
    replayable: true,
    rollbackId: '',
    privacy: {
      redacted: true,
      privateDataIncluded: false,
      dataClasses: ['public_audit_summary']
    }
  };
}

function reviewAuditIdempotencyKey(review) {
  return `idem_${review.reviewId.replace(/^modreview_/, 'modreview_').slice(0, 80)}`;
}

function createModerationReviewAuditEntry(review, nowMs) {
  const sourceRefCount = Array.isArray(review.sourceRefs) ? review.sourceRefs.length : 0;
  return {
    schemaVersion: review.schemaVersion,
    entryId: `audit_${review.reviewId.replace(/^modreview_/, 'modreview_')}`,
    actor: auditActorForReview(review),
    actionType: review.reviewType === 'appeal' ? 'moderation.appealed' : 'moderation.reviewed',
    objectRef: review.reviewId,
    idempotencyKey: reviewAuditIdempotencyKey(review),
    beforeHash: sha256(`agent-town.v6.civic.moderation.review.absent:${review.reviewId}`),
    afterHash: sha256(stableJson(review)),
    beforeSummary: `No moderation ${review.reviewType} review existed for ${review.reviewId} on decision ${review.decisionId}.`,
    afterSummary: `Recorded moderation ${review.reviewType} review ${review.reviewId} with status ${review.status}, reviewer kind ${review.reviewerKind}, and ${sourceRefCount} public source refs.`,
    createdAtMs: nowMs,
    migrationVersion: MIGRATION_VERSION,
    replayable: true,
    rollbackId: '',
    privacy: {
      redacted: true,
      privateDataIncluded: false,
      dataClasses: ['public_audit_summary']
    }
  };
}

function createCivicModerationStore({ sqlitePath, auditLedger = null, auditSqlitePath = '' }) {
  if (!sqlitePath || typeof sqlitePath !== 'string') {
    throw new Error('CIVIC_MODERATION_SQLITE_PATH_REQUIRED');
  }
  fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
  const db = new DatabaseSync(sqlitePath);
  let schemaMetadata;
  try {
    schemaMetadata = ensureSchema(db);
  } catch (err) {
    db.close();
    throw err;
  }
  const statements = buildStatements(db);
  const ownsLedger = !auditLedger;
  const ledger = auditLedger || createCivicAuditLedger({ sqlitePath: auditSqlitePath || sqlitePath });
  let closed = false;

  function recordDecision(rawDecision = {}, { nowMs = Date.now() } = {}) {
    const validation = validateModerationDecision(rawDecision);
    if (!validation.ok) {
      const err = new Error('CIVIC_MODERATION_INVALID');
      err.details = { errors: validation.errors };
      throw err;
    }
    const decision = validation.value;
    const normalizedJson = stableJson(decision);

    const existingById = parseModerationRow(statements.byDecisionId.get(decision.decisionId));
    if (existingById) {
      if (stableJson(existingById.decision) !== normalizedJson) {
        const err = new Error('CIVIC_MODERATION_ID_CONFLICT');
        err.details = { decisionId: decision.decisionId };
        throw err;
      }
      return { ...existingById, duplicate: true };
    }

    const existingBySubjectPolicy = parseModerationRow(statements.bySubjectSurfacePolicy.get(
      decision.subjectRef,
      decision.surface,
      decision.policyVersion
    ));
    if (existingBySubjectPolicy) {
      const err = new Error('CIVIC_MODERATION_SUBJECT_POLICY_CONFLICT');
      err.details = {
        subjectRef: decision.subjectRef,
        surface: decision.surface,
        policyVersion: decision.policyVersion,
        existingDecisionId: existingBySubjectPolicy.decisionId
      };
      throw err;
    }

    const auditRow = ledger.append(createModerationAuditEntry(decision, nowMs));
    statements.insert.run(
      decision.decisionId,
      decision.subjectRef,
      decision.surface,
      decision.status,
      decision.policyVersion,
      decision.reviewerKind,
      auditRow.entry.entryId,
      nowMs,
      normalizedJson
    );
    return parseModerationRow(statements.byDecisionId.get(decision.decisionId));
  }

  function getDecision(decisionId = '') {
    return parseModerationRow(statements.byDecisionId.get(String(decisionId || '')));
  }

  function recordReview(rawReview = {}, { nowMs = Date.now() } = {}) {
    const validation = validateModerationReview(rawReview);
    if (!validation.ok) {
      const err = new Error('CIVIC_MODERATION_REVIEW_INVALID');
      err.details = { errors: validation.errors };
      throw err;
    }
    const review = validation.value;
    const normalizedJson = stableJson(review);

    const existingById = parseReviewRow(statements.byReviewId.get(review.reviewId));
    if (existingById) {
      if (stableJson(existingById.review) !== normalizedJson) {
        const err = new Error('CIVIC_MODERATION_REVIEW_ID_CONFLICT');
        err.details = { reviewId: review.reviewId };
        throw err;
      }
      return { ...existingById, duplicate: true };
    }

    const decision = getDecision(review.decisionId);
    if (!decision) {
      const err = new Error('CIVIC_MODERATION_REVIEW_DECISION_REQUIRED');
      err.details = { decisionId: review.decisionId };
      throw err;
    }
    if (
      decision.subjectRef !== review.subjectRef
      || decision.surface !== review.surface
      || decision.policyVersion !== review.policyVersion
    ) {
      const err = new Error('CIVIC_MODERATION_REVIEW_DECISION_MISMATCH');
      err.details = {
        decisionId: review.decisionId,
        subjectRef: review.subjectRef,
        surface: review.surface,
        policyVersion: review.policyVersion
      };
      throw err;
    }

    const auditRow = ledger.append(createModerationReviewAuditEntry(review, nowMs));
    statements.insertReview.run(
      review.reviewId,
      review.decisionId,
      review.subjectRef,
      review.surface,
      review.policyVersion,
      review.reviewType,
      review.status,
      review.requestedBy.accountId,
      review.reviewerKind,
      auditRow.entry.entryId,
      nowMs,
      normalizedJson
    );
    return parseReviewRow(statements.byReviewId.get(review.reviewId));
  }

  function getReview(reviewId = '') {
    return parseReviewRow(statements.byReviewId.get(String(reviewId || '')));
  }

  function listDecisions({ subjectRef = '', surface = '', status = '', reviewerKind = '', limit = 100 } = {}) {
    const safeLimit = Number.isInteger(Number(limit)) ? Math.max(1, Math.min(500, Number(limit))) : 100;
    return statements.list.all(
      String(subjectRef || ''),
      String(subjectRef || ''),
      String(surface || ''),
      String(surface || ''),
      String(status || ''),
      String(status || ''),
      String(reviewerKind || ''),
      String(reviewerKind || ''),
      safeLimit
    ).map(parseModerationRow);
  }

  function listReviews({ decisionId = '', subjectRef = '', reviewType = '', status = '', limit = 100 } = {}) {
    const safeLimit = Number.isInteger(Number(limit)) ? Math.max(1, Math.min(500, Number(limit))) : 100;
    return statements.listReviews.all(
      String(decisionId || ''),
      String(decisionId || ''),
      String(subjectRef || ''),
      String(subjectRef || ''),
      String(reviewType || ''),
      String(reviewType || ''),
      String(status || ''),
      String(status || ''),
      safeLimit
    ).map(parseReviewRow);
  }

  function summarizeSubjectModeration(subjectRef = '') {
    const rows = statements.summaryCounts.all(String(subjectRef || ''));
    const decisions = statements.summaryDecisions.all(String(subjectRef || '')).map(parseModerationRow);
    const reviews = listReviews({ subjectRef, limit: 500 });
    const bySurface = {};
    let decisionCount = 0;
    let rejectedCount = 0;
    let needsReviewCount = 0;
    let redactedFieldCount = 0;
    let appealCount = 0;
    for (const row of rows) {
      const surface = String(row.surface || '');
      const status = String(row.status || '');
      const count = Number(row.count || 0);
      if (!bySurface[surface]) bySurface[surface] = { approved: 0, rejected: 0, needs_review: 0 };
      bySurface[surface][status] = (bySurface[surface][status] || 0) + count;
      decisionCount += count;
      if (status === 'rejected') rejectedCount += count;
      if (status === 'needs_review') needsReviewCount += count;
    }
    for (const row of decisions) {
      redactedFieldCount += Array.isArray(row.decision.redactedFields) ? row.decision.redactedFields.length : 0;
    }
    for (const row of reviews) {
      if (row.reviewType === 'appeal') appealCount += 1;
    }
    return {
      subjectRef: String(subjectRef || ''),
      decisionCount,
      reviewCount: reviews.length,
      appealCount,
      rejectedCount,
      needsReviewCount,
      bySurface,
      redactedFieldCount,
      latestDecisionId: decisions[0]?.decisionId || '',
      latestReviewId: reviews[reviews.length - 1]?.reviewId || '',
      privateDataIncluded: false,
      executionStatus: 'not_executable'
    };
  }

  function count() {
    return Number(statements.count.get().count || 0);
  }

  function reviewCount() {
    return Number(statements.reviewCount.get().count || 0);
  }

  function getSchemaMetadata() {
    return readCivicSqliteSchemaMetadata(db, STORE_KEY);
  }

  function close() {
    if (closed) return;
    closed = true;
    if (ownsLedger && ledger?.close) ledger.close();
    db.close();
  }

  return {
    close,
    count,
    getDecision,
    getReview,
    getSchemaMetadata,
    listDecisions,
    listReviews,
    migrationVersion: schemaMetadata.migrationVersion,
    recordDecision,
    recordReview,
    reviewCount,
    sqlitePath,
    summarizeSubjectModeration
  };
}

module.exports = {
  REQUIRED_MODERATION_PRIVACY_EVIDENCE_CHECKS: clone(REQUIRED_MODERATION_PRIVACY_EVIDENCE_CHECKS),
  REQUIRED_MODERATION_PRIVACY_READINESS_CHECKS: clone(REQUIRED_MODERATION_PRIVACY_READINESS_CHECKS),
  REQUIRED_MODERATION_SURFACES: clone(REQUIRED_MODERATION_SURFACES),
  V6_MODERATION_PRIVACY_READINESS_GATE_VERSION,
  assertV6ModerationPrivacyReadinessGateSafe,
  buildV6ModerationPrivacyReadinessGate,
  createCivicModerationStore
};
