const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { CIVIC_SCHEMA_VERSION } = require('../server/world_civilization/schemas');
const { createCivicAuditLedger } = require('../server/world_civilization/audit_ledger');
const { createCivicModerationStore } = require('../server/world_civilization/moderation');

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
