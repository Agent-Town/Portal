const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { V6_WORLD_FEATURE_FLAG, parseWorldGridFeatureFlags } = require('../server/world_grid/feature_flags');
const { CIVIC_SCHEMA_VERSION } = require('../server/world_civilization/schemas');
const { createCivicAuditLedger } = require('../server/world_civilization/audit_ledger');
const {
  REQUIRED_MODERATION_PRIVACY_EVIDENCE_CHECKS,
  REQUIRED_MODERATION_PRIVACY_READINESS_CHECKS,
  REQUIRED_MODERATION_SURFACES,
  V6_MODERATION_PRIVACY_READINESS_GATE_VERSION,
  assertV6ModerationPrivacyReadinessGateSafe,
  buildV6ModerationPrivacyReadinessGate,
  createCivicModerationStore
} = require('../server/world_civilization/moderation');

function withTempModerationStore(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-moderation-'));
  const sqlitePath = path.join(dir, 'moderation.sqlite');
  const auditSqlitePath = path.join(dir, 'audit.sqlite');
  const auditLedger = createCivicAuditLedger({ sqlitePath: auditSqlitePath });
  const store = createCivicModerationStore({ sqlitePath, auditLedger });
  try {
    return fn({ auditLedger, store, sqlitePath });
  } finally {
    store.close();
    auditLedger.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function moderationDecision(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    decisionId: 'moderation_bridge_text_001',
    subjectRef: 'proposal_public_works_bridge_001',
    surface: 'public_works',
    status: 'approved',
    policyVersion: 'policy_v6_public_001',
    reviewerKind: 'system',
    reasons: ['No private state or unsafe public text detected.'],
    redactedFields: [],
    ...overrides
  };
}

function moderationReview(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    reviewId: 'modreview_bridge_text_appeal_001',
    decisionId: 'moderation_bridge_text_001',
    subjectRef: 'proposal_public_works_bridge_001',
    surface: 'public_works',
    policyVersion: 'policy_v6_public_001',
    reviewType: 'appeal',
    status: 'escalated',
    requestedBy: {
      kind: 'human',
      accountId: 'acct_v6_human_001'
    },
    reviewerKind: 'human',
    sourceRefs: ['public_report_bridge_text_001'],
    reasons: ['Public abuse report escalated this approved civic text for human review.'],
    privacy: {
      redacted: true,
      privateDataIncluded: false,
      dataClasses: ['public_audit_summary']
    },
    ...overrides
  };
}

function moderationPrivacyReadinessEvidence(overrides = {}) {
  return {
    status: 'complete',
    executionStatus: 'not_executable',
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    mutatesWorldState: false,
    appliesModerationEffects: false,
    publishesContent: false,
    exposesPrivateData: false,
    surfacePoliciesReviewed: true,
    reviewToolingReviewed: true,
    appealOperationsReviewed: true,
    redactionPolicyReviewed: true,
    publicTextRenderingReviewed: true,
    publicPresencePrivacyReviewed: true,
    publicSourceTriageReviewed: true,
    mediaReviewPlanned: true,
    privateDataExcluded: true,
    auditRowsCovered: true,
    checks: [...REQUIRED_MODERATION_PRIVACY_EVIDENCE_CHECKS],
    surfaces: [...REQUIRED_MODERATION_SURFACES],
    ...overrides
  };
}

test('V6 moderation privacy readiness gate is hidden without explicit research opt-in and V6 flag', () => {
  const noResearchOptIn = buildV6ModerationPrivacyReadinessGate({
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence: moderationPrivacyReadinessEvidence()
  });
  const broadV5Override = buildV6ModerationPrivacyReadinessGate({
    includeResearchModerationPrivacy: true,
    featureFlags: parseWorldGridFeatureFlags('all'),
    evidence: moderationPrivacyReadinessEvidence()
  });

  for (const report of [noResearchOptIn, broadV5Override]) {
    assert.equal(report.version, V6_MODERATION_PRIVACY_READINESS_GATE_VERSION);
    assert.equal(report.available, false);
    assert.equal(report.researchReady, false);
    assert.equal(report.releaseReady, false);
    assert.equal(report.failClosed, true);
    assert.equal(report.runtimeExposed, false);
    assert.equal(report.playerVisible, false);
    assert.equal(report.normalGameplayExposure, false);
    assert.equal(report.mutatesWorldState, false);
    assert.equal(report.appliesModerationEffects, false);
    assert.equal(report.publishesContent, false);
    assert.equal(report.exposesPrivateData, false);
    assert.equal(report.executionStatus, 'not_executable');
    assert.deepEqual(report.checks, []);
    assert.deepEqual(assertV6ModerationPrivacyReadinessGateSafe(report), { ok: true, errors: [] });
  }
});

test('V6 moderation privacy readiness gate records surface review evidence without execution', () => {
  const report = buildV6ModerationPrivacyReadinessGate({
    includeResearchModerationPrivacy: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    source: 'node_test',
    evidence: moderationPrivacyReadinessEvidence()
  });

  assert.equal(report.available, true);
  assert.equal(report.source, 'node_test');
  assert.equal(report.researchReady, true);
  assert.equal(report.releaseReady, false);
  assert.equal(report.failClosed, false);
  assert.equal(report.runtimeExposed, false);
  assert.equal(report.playerVisible, false);
  assert.equal(report.normalGameplayExposure, false);
  assert.equal(report.mutatesWorldState, false);
  assert.equal(report.appliesModerationEffects, false);
  assert.equal(report.publishesContent, false);
  assert.equal(report.exposesPrivateData, false);
  assert.equal(report.executionStatus, 'not_executable');
  assert.deepEqual(report.checks.map((entry) => entry.key), REQUIRED_MODERATION_PRIVACY_READINESS_CHECKS);
  assert.deepEqual(report.evidence.requiredChecks, REQUIRED_MODERATION_PRIVACY_EVIDENCE_CHECKS);
  assert.deepEqual(report.evidence.missingChecks, []);
  assert.deepEqual(report.evidence.requiredSurfaces, REQUIRED_MODERATION_SURFACES);
  assert.deepEqual(report.evidence.missingSurfaces, []);
  assert.deepEqual(assertV6ModerationPrivacyReadinessGateSafe(report), { ok: true, errors: [] });
});

test('V6 moderation privacy readiness gate fails closed without surface and appeal evidence', () => {
  const report = buildV6ModerationPrivacyReadinessGate({
    includeResearchModerationPrivacy: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence: moderationPrivacyReadinessEvidence({
      checks: REQUIRED_MODERATION_PRIVACY_EVIDENCE_CHECKS.filter((check) => (
        check !== 'attached_media_policy'
        && check !== 'appeal_operations'
        && check !== 'human_review_tooling_plan'
        && check !== 'redaction_policy_review'
        && check !== 'public_presence_privacy_review'
        && check !== 'abuse_report_triage'
      )),
      surfaces: REQUIRED_MODERATION_SURFACES.filter((surface) => surface !== 'institution_charter'),
      surfacePoliciesReviewed: false,
      reviewToolingReviewed: false,
      appealOperationsReviewed: false,
      redactionPolicyReviewed: false,
      publicPresencePrivacyReviewed: false,
      publicSourceTriageReviewed: false,
      mediaReviewPlanned: false
    })
  });

  assert.equal(report.available, true);
  assert.equal(report.researchReady, false);
  assert.equal(report.releaseReady, false);
  assert.equal(report.failClosed, true);
  assert.deepEqual(report.evidence.missingChecks, [
    'attached_media_policy',
    'abuse_report_triage',
    'appeal_operations',
    'human_review_tooling_plan',
    'redaction_policy_review',
    'public_presence_privacy_review'
  ]);
  assert.deepEqual(report.evidence.missingSurfaces, ['institution_charter']);
  assert.deepEqual(report.errors, [
    'MODERATION_PRIVACY_EVIDENCE_REQUIRED',
    'MODERATION_SURFACE_POLICY_COVERAGE_REQUIRED',
    'MODERATION_REVIEW_APPEAL_OPERATIONS_REQUIRED',
    'MODERATION_REDACTION_POLICY_REVIEW_REQUIRED',
    'MODERATION_PUBLIC_SOURCE_TRIAGE_REQUIRED'
  ]);
  assert.deepEqual(assertV6ModerationPrivacyReadinessGateSafe(report), { ok: true, errors: [] });
});

test('V6 moderation privacy assertion rejects visible publishing or effect readiness drift', () => {
  const report = buildV6ModerationPrivacyReadinessGate({
    includeResearchModerationPrivacy: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence: moderationPrivacyReadinessEvidence()
  });
  const unsafe = {
    ...report,
    releaseReady: true,
    runtimeExposed: true,
    playerVisible: true,
    normalGameplayExposure: true,
    mutatesWorldState: true,
    appliesModerationEffects: true,
    publishesContent: true,
    exposesPrivateData: true,
    executionStatus: 'executes',
    evidence: {
      ...report.evidence,
      runtimeExposed: true,
      playerVisible: true,
      normalGameplayExposure: true,
      mutatesWorldState: true,
      appliesModerationEffects: true,
      publishesContent: true,
      exposesPrivateData: true
    }
  };
  const result = assertV6ModerationPrivacyReadinessGateSafe(unsafe);

  assert.equal(result.ok, false);
  assert.match(result.errors.join(','), /V6_MODERATION_PRIVACY_READINESS_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_MODERATION_PRIVACY_READINESS_PLAYER_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_MODERATION_PRIVACY_READINESS_NORMAL_GAMEPLAY_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_MODERATION_PRIVACY_READINESS_WORLD_MUTATION_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_MODERATION_PRIVACY_READINESS_EFFECT_APPLICATION_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_MODERATION_PRIVACY_READINESS_CONTENT_PUBLICATION_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_MODERATION_PRIVACY_READINESS_PRIVATE_DATA_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_MODERATION_PRIVACY_READINESS_NON_EXECUTING_REQUIRED/);
  assert.match(result.errors.join(','), /V6_MODERATION_PRIVACY_READINESS_RELEASE_READY_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_MODERATION_PRIVACY_READINESS_EVIDENCE_PLAYER_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_MODERATION_PRIVACY_READINESS_EVIDENCE_EFFECT_APPLICATION_FORBIDDEN/);
});

test('V6 moderation store records bounded decisions without execution', () => withTempModerationStore(({ auditLedger, store }) => {
  const row = store.recordDecision(moderationDecision(), { nowMs: 1_779_784_000_000 });
  const summary = store.summarizeSubjectModeration('proposal_public_works_bridge_001');

  assert.equal(row.decisionId, 'moderation_bridge_text_001');
  assert.equal(row.subjectRef, 'proposal_public_works_bridge_001');
  assert.equal(row.status, 'approved');
  assert.equal(row.auditEntryId, 'audit_moderation_bridge_text_001');
  assert.equal(summary.decisionCount, 1);
  assert.equal(summary.bySurface.public_works.approved, 1);
  assert.equal(summary.redactedFieldCount, 0);
  assert.equal(summary.latestDecisionId, 'moderation_bridge_text_001');
  assert.equal(summary.privateDataIncluded, false);
  assert.equal(summary.executionStatus, 'not_executable');

  const audit = auditLedger.getByEntryId('audit_moderation_bridge_text_001');
  assert.equal(audit.entry.actionType, 'moderation.decided');
  assert.equal(audit.entry.actor.kind, 'agent');
  assert.equal(audit.entry.actor.accountId, 'acct_system_moderation');
  assert.equal(audit.entry.objectRef, 'moderation_bridge_text_001');
  assert.match(audit.entry.beforeSummary, /No moderation decision existed/);
  assert.match(audit.entry.afterSummary, /Recorded moderation decision/);
  assert.match(audit.entry.afterSummary, /redacted field count 0/);
  assert.equal(audit.entry.beforeSummary.includes('Hash-only'), false);
  assert.equal(audit.entry.afterSummary.includes('Hash-only'), false);
}));

test('V6 moderation store records human review and appeal states without execution', () => withTempModerationStore(({ auditLedger, store }) => {
  store.recordDecision(moderationDecision(), { nowMs: 1_779_784_000_000 });
  const row = store.recordReview(moderationReview(), { nowMs: 1_779_784_001_000 });
  const duplicate = store.recordReview(moderationReview(), { nowMs: 1_779_784_002_000 });
  const summary = store.summarizeSubjectModeration('proposal_public_works_bridge_001');

  assert.equal(row.reviewId, 'modreview_bridge_text_appeal_001');
  assert.equal(row.decisionId, 'moderation_bridge_text_001');
  assert.equal(row.reviewType, 'appeal');
  assert.equal(row.status, 'escalated');
  assert.equal(row.review.sourceRefs[0], 'public_report_bridge_text_001');
  assert.equal(duplicate.duplicate, true);
  assert.throws(
    () => store.recordReview(moderationReview({ status: 'upheld' })),
    /CIVIC_MODERATION_REVIEW_ID_CONFLICT/
  );
  assert.equal(store.reviewCount(), 1);
  assert.equal(summary.decisionCount, 1);
  assert.equal(summary.reviewCount, 1);
  assert.equal(summary.appealCount, 1);
  assert.equal(summary.latestReviewId, 'modreview_bridge_text_appeal_001');
  assert.equal(summary.privateDataIncluded, false);
  assert.equal(summary.executionStatus, 'not_executable');

  const audit = auditLedger.getByEntryId('audit_modreview_bridge_text_appeal_001');
  assert.equal(audit.entry.actionType, 'moderation.appealed');
  assert.equal(audit.entry.actor.kind, 'human');
  assert.equal(audit.entry.actor.accountId, 'acct_v6_human_001');
  assert.equal(audit.entry.objectRef, 'modreview_bridge_text_appeal_001');
  assert.equal(audit.entry.privacy.privateDataIncluded, false);
  assert.match(audit.entry.beforeSummary, /No moderation appeal review existed/);
  assert.match(audit.entry.afterSummary, /status escalated/);
  assert.match(audit.entry.afterSummary, /1 public source refs/);
  assert.equal(audit.entry.afterSummary.includes('Hash-only'), false);
}));

test('V6 moderation store is idempotent by decision and rejects duplicate subject policy', () => withTempModerationStore(({ store }) => {
  const first = store.recordDecision(moderationDecision(), { nowMs: 1_779_784_000_000 });
  const duplicate = store.recordDecision(moderationDecision(), { nowMs: 1_779_784_000_500 });

  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.decisionId, first.decisionId);
  assert.equal(store.count(), 1);
  assert.throws(
    () => store.recordDecision(moderationDecision({ status: 'rejected' })),
    /CIVIC_MODERATION_ID_CONFLICT/
  );
  assert.throws(
    () => store.recordDecision(moderationDecision({
      decisionId: 'moderation_bridge_text_002'
    })),
    /CIVIC_MODERATION_SUBJECT_POLICY_CONFLICT/
  );
  assert.equal(store.count(), 1);
}));

test('V6 moderation store rejects unsafe review and appeal records before persistence', () => withTempModerationStore(({ auditLedger, store }) => {
  store.recordDecision(moderationDecision(), { nowMs: 1_779_784_000_000 });

  assert.throws(
    () => store.recordReview(moderationReview({
      reviewId: 'modreview_missing_decision_001',
      decisionId: 'moderation_missing_001'
    })),
    /CIVIC_MODERATION_REVIEW_DECISION_REQUIRED/
  );
  assert.throws(
    () => store.recordReview(moderationReview({
      reviewId: 'modreview_mismatch_001',
      surface: 'civic_text'
    })),
    /CIVIC_MODERATION_REVIEW_DECISION_MISMATCH/
  );
  assert.throws(
    () => store.recordReview(moderationReview({
      reviewId: 'modreview_agent_appeal_001',
      requestedBy: {
        kind: 'agent',
        accountId: 'acct_v6_human_001',
        agentId: 'agent_civic_clover_001'
      }
    })),
    /CIVIC_MODERATION_REVIEW_INVALID/
  );
  assert.throws(
    () => store.recordReview(moderationReview({
      reviewId: 'modreview_private_trace_001',
      reasons: ['Contains sk-test-secret-value']
    })),
    /CIVIC_MODERATION_REVIEW_INVALID/
  );
  assert.equal(store.reviewCount(), 0);
  assert.equal(auditLedger.count(), 1);
}));

test('V6 moderation store rejects unsupported decisions and private data before persistence', () => withTempModerationStore(({ auditLedger, store }) => {
  assert.throws(
    () => store.recordDecision(moderationDecision({
      decisionId: 'moderation_status_invalid_001',
      status: 'auto_publish'
    })),
    /CIVIC_MODERATION_INVALID/
  );
  assert.throws(
    () => store.recordDecision(moderationDecision({
      decisionId: 'moderation_private_trace_001',
      debugTrace: {
        token: 'sk-test-secret-value'
      }
    })),
    /CIVIC_MODERATION_INVALID/
  );
  assert.equal(store.count(), 0);
  assert.equal(auditLedger.count(), 0);
}));

test('V6 moderation store persists decisions and supports reviewer/status replay indexes', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-moderation-persist-'));
  const sqlitePath = path.join(dir, 'moderation.sqlite');
  const auditSqlitePath = path.join(dir, 'audit.sqlite');
  try {
    const auditLedger = createCivicAuditLedger({ sqlitePath: auditSqlitePath });
    const store = createCivicModerationStore({ sqlitePath, auditLedger });
    store.recordDecision(moderationDecision(), { nowMs: 1_779_784_000_000 });
    store.recordReview(moderationReview(), { nowMs: 1_779_784_000_500 });
    store.recordDecision(moderationDecision({
      decisionId: 'moderation_profile_redaction_001',
      surface: 'civic_text',
      status: 'needs_review',
      policyVersion: 'policy_v6_privacy_001',
      reviewerKind: 'human',
      reasons: ['Location field needs manual public-surface review.'],
      redactedFields: ['profile.location', 'profile.bio']
    }), { nowMs: 1_779_784_001_000 });
    store.close();
    auditLedger.close();

    const reopenedAudit = createCivicAuditLedger({ sqlitePath: auditSqlitePath });
    const reopened = createCivicModerationStore({ sqlitePath, auditLedger: reopenedAudit });
    assert.equal(reopened.count(), 2);
    assert.equal(reopened.reviewCount(), 1);
    assert.equal(reopened.getDecision('moderation_bridge_text_001').status, 'approved');
    assert.equal(reopened.getReview('modreview_bridge_text_appeal_001').reviewType, 'appeal');
    assert.deepEqual(
      reopened.listReviews({ decisionId: 'moderation_bridge_text_001' }).map((row) => row.reviewId),
      ['modreview_bridge_text_appeal_001']
    );
    assert.deepEqual(
      reopened.listReviews({ reviewType: 'appeal', status: 'escalated' }).map((row) => row.reviewId),
      ['modreview_bridge_text_appeal_001']
    );
    assert.deepEqual(
      reopened.listDecisions({ subjectRef: 'proposal_public_works_bridge_001' }).map((row) => row.decisionId),
      ['moderation_bridge_text_001', 'moderation_profile_redaction_001']
    );
    assert.deepEqual(
      reopened.listDecisions({ surface: 'civic_text', status: 'needs_review', reviewerKind: 'human' }).map((row) => row.decisionId),
      ['moderation_profile_redaction_001']
    );
    const summary = reopened.summarizeSubjectModeration('proposal_public_works_bridge_001');
    assert.equal(summary.decisionCount, 2);
    assert.equal(summary.reviewCount, 1);
    assert.equal(summary.appealCount, 1);
    assert.equal(summary.needsReviewCount, 1);
    assert.equal(summary.redactedFieldCount, 2);
    assert.equal(summary.latestDecisionId, 'moderation_profile_redaction_001');
    assert.equal(summary.latestReviewId, 'modreview_bridge_text_appeal_001');
    assert.equal(reopenedAudit.replay({ actorAccountId: 'acct_human_moderator' })[0].entry.objectRef, 'moderation_profile_redaction_001');
    assert.equal(reopenedAudit.replay({ actorAccountId: 'acct_v6_human_001' })[0].entry.actionType, 'moderation.appealed');
    reopened.close();
    reopenedAudit.close();
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
