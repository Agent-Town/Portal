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
    assert.equal(reopened.getDecision('moderation_bridge_text_001').status, 'approved');
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
    assert.equal(summary.needsReviewCount, 1);
    assert.equal(summary.redactedFieldCount, 2);
    assert.equal(summary.latestDecisionId, 'moderation_profile_redaction_001');
    assert.equal(reopenedAudit.replay({ actorAccountId: 'acct_human_moderator' })[0].entry.objectRef, 'moderation_profile_redaction_001');
    reopened.close();
    reopenedAudit.close();
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
