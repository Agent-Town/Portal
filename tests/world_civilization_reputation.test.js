const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { CIVIC_SCHEMA_VERSION } = require('../server/world_civilization/schemas');
const { createCivicAuditLedger } = require('../server/world_civilization/audit_ledger');
const { createCivicReputationStore } = require('../server/world_civilization/reputation');

function withTempReputationStore(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-reputation-'));
  const sqlitePath = path.join(dir, 'reputation.sqlite');
  const auditSqlitePath = path.join(dir, 'audit.sqlite');
  const auditLedger = createCivicAuditLedger({ sqlitePath: auditSqlitePath });
  const store = createCivicReputationStore({ sqlitePath, auditLedger });
  try {
    return fn({ auditLedger, store, sqlitePath });
  } finally {
    store.close();
    auditLedger.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function reputationRecord(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    recordId: 'reputation_service_quality_001',
    subjectAccountId: 'acct_service_provider_001',
    awardedByAccountId: 'acct_v6_human_001',
    kind: 'service_reliability',
    delta: 2,
    sourceRef: 'proposal_public_works_bridge_001',
    disputeStatus: 'none',
    auditLedgerEntryId: 'audit_reputation_service_quality_001',
    ...overrides
  };
}

function reputationDispute(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    disputeId: 'repdispute_service_quality_001',
    recordId: 'reputation_service_quality_001',
    subjectAccountId: 'acct_service_provider_001',
    disputedBy: {
      kind: 'human',
      accountId: 'acct_v6_human_002'
    },
    status: 'opened',
    reviewerKind: 'system',
    moderationDecisionId: 'moderation_bridge_text_001',
    sourceRefs: ['moderation_bridge_text_001'],
    reasons: ['Human reviewer should inspect the service quality award before release use.'],
    privacy: {
      redacted: true,
      privateDataIncluded: false,
      dataClasses: ['public_audit_summary']
    },
    ...overrides
  };
}

test('V6 reputation store records bounded accountability entries without execution', () => withTempReputationStore(({ auditLedger, store }) => {
  const row = store.recordReputation(reputationRecord(), { nowMs: 1_779_784_000_000 });
  const summary = store.summarizeSubjectReputation('acct_service_provider_001');

  assert.equal(row.recordId, 'reputation_service_quality_001');
  assert.equal(row.subjectAccountId, 'acct_service_provider_001');
  assert.equal(row.delta, 2);
  assert.equal(row.auditEntryId, 'audit_reputation_service_quality_001');
  assert.equal(summary.totalScore, 2);
  assert.equal(summary.recordCount, 1);
  assert.equal(summary.byKind.service_reliability.score, 2);
  assert.equal(summary.transferable, false);
  assert.equal(summary.executionStatus, 'not_executable');

  const audit = auditLedger.getByEntryId('audit_reputation_service_quality_001');
  assert.equal(audit.entry.actionType, 'reputation.recorded');
  assert.equal(audit.entry.actor.accountId, 'acct_v6_human_001');
  assert.equal(audit.entry.objectRef, 'reputation_service_quality_001');
}));

test('V6 reputation store records dispute review workflow without score mutation', () => withTempReputationStore(({ auditLedger, store }) => {
  store.recordReputation(reputationRecord(), { nowMs: 1_779_784_000_000 });
  const row = store.recordDispute(reputationDispute(), { nowMs: 1_779_784_001_000 });
  const duplicate = store.recordDispute(reputationDispute(), { nowMs: 1_779_784_002_000 });
  const summary = store.summarizeSubjectReputation('acct_service_provider_001');

  assert.equal(row.disputeId, 'repdispute_service_quality_001');
  assert.equal(row.recordId, 'reputation_service_quality_001');
  assert.equal(row.status, 'opened');
  assert.equal(row.moderationDecisionId, 'moderation_bridge_text_001');
  assert.equal(row.dispute.sourceRefs[0], 'moderation_bridge_text_001');
  assert.equal(duplicate.duplicate, true);
  assert.throws(
    () => store.recordDispute(reputationDispute({ status: 'upheld', reviewerKind: 'human' })),
    /CIVIC_REPUTATION_DISPUTE_ID_CONFLICT/
  );
  assert.throws(
    () => store.recordDispute(reputationDispute({ disputeId: 'repdispute_service_quality_002' })),
    /CIVIC_REPUTATION_DISPUTE_SOURCE_CONFLICT/
  );
  assert.equal(store.disputeCount(), 1);
  assert.equal(summary.totalScore, 2);
  assert.equal(summary.recordCount, 1);
  assert.equal(summary.disputeReviewCount, 1);
  assert.equal(summary.openDisputeReviewCount, 1);
  assert.equal(summary.latestDisputeId, 'repdispute_service_quality_001');
  assert.equal(summary.transferable, false);
  assert.equal(summary.executionStatus, 'not_executable');

  const audit = auditLedger.getByEntryId('audit_repdispute_service_quality_001');
  assert.equal(audit.entry.actionType, 'reputation.disputed');
  assert.equal(audit.entry.actor.kind, 'human');
  assert.equal(audit.entry.actor.accountId, 'acct_v6_human_002');
  assert.equal(audit.entry.objectRef, 'repdispute_service_quality_001');
  assert.equal(audit.entry.privacy.privateDataIncluded, false);
}));

test('V6 reputation store is idempotent by record and rejects duplicate source awards', () => withTempReputationStore(({ store }) => {
  const first = store.recordReputation(reputationRecord(), { nowMs: 1_779_784_000_000 });
  const duplicate = store.recordReputation(reputationRecord(), { nowMs: 1_779_784_000_500 });

  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.recordId, first.recordId);
  assert.equal(store.count(), 1);
  assert.throws(
    () => store.recordReputation(reputationRecord({ delta: 3 })),
    /CIVIC_REPUTATION_ID_CONFLICT/
  );
  assert.throws(
    () => store.recordReputation(reputationRecord({
      recordId: 'reputation_service_quality_002',
      auditLedgerEntryId: 'audit_reputation_service_quality_002'
    })),
    /CIVIC_REPUTATION_SOURCE_CONFLICT/
  );
  assert.equal(store.count(), 1);
}));

test('V6 reputation store rejects unsafe dispute reviews before persistence', () => withTempReputationStore(({ auditLedger, store }) => {
  store.recordReputation(reputationRecord(), { nowMs: 1_779_784_000_000 });

  assert.throws(
    () => store.recordDispute(reputationDispute({
      disputeId: 'repdispute_missing_record_001',
      recordId: 'reputation_missing_001'
    })),
    /CIVIC_REPUTATION_DISPUTE_RECORD_REQUIRED/
  );
  assert.throws(
    () => store.recordDispute(reputationDispute({
      disputeId: 'repdispute_mismatch_001',
      subjectAccountId: 'acct_wrong_subject_001'
    })),
    /CIVIC_REPUTATION_DISPUTE_RECORD_MISMATCH/
  );
  assert.throws(
    () => store.recordDispute(reputationDispute({
      disputeId: 'repdispute_agent_request_001',
      disputedBy: {
        kind: 'agent',
        accountId: 'acct_v6_human_002',
        agentId: 'agent_civic_clover_001'
      }
    })),
    /CIVIC_REPUTATION_DISPUTE_INVALID/
  );
  assert.throws(
    () => store.recordDispute(reputationDispute({
      disputeId: 'repdispute_review_system_001',
      status: 'upheld',
      reviewerKind: 'system'
    })),
    /CIVIC_REPUTATION_DISPUTE_INVALID/
  );
  assert.throws(
    () => store.recordDispute(reputationDispute({
      disputeId: 'repdispute_private_trace_001',
      reasons: ['Contains bearer secret-token-value']
    })),
    /CIVIC_REPUTATION_DISPUTE_INVALID/
  );
  assert.equal(store.disputeCount(), 0);
  assert.equal(auditLedger.count(), 1);
}));

test('V6 reputation store rejects self-awards, currency-like deltas, and private data', () => withTempReputationStore(({ store }) => {
  assert.throws(
    () => store.recordReputation(reputationRecord({
      recordId: 'reputation_self_award_001',
      subjectAccountId: 'acct_service_provider_001',
      awardedByAccountId: 'acct_service_provider_001',
      auditLedgerEntryId: 'audit_reputation_self_award_001'
    })),
    /CIVIC_REPUTATION_INVALID/
  );
  assert.throws(
    () => store.recordReputation(reputationRecord({
      recordId: 'reputation_too_large_001',
      delta: 25,
      auditLedgerEntryId: 'audit_reputation_too_large_001'
    })),
    /CIVIC_REPUTATION_INVALID/
  );
  assert.throws(
    () => store.recordReputation(reputationRecord({
      recordId: 'reputation_private_001',
      auditLedgerEntryId: 'audit_reputation_private_001',
      debugTrace: {
        token: 'sk-test-secret-value'
      }
    })),
    /CIVIC_REPUTATION_INVALID/
  );
  assert.equal(store.count(), 0);
}));

test('V6 reputation store persists records and supports dispute replay indexes', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-reputation-persist-'));
  const sqlitePath = path.join(dir, 'reputation.sqlite');
  const auditSqlitePath = path.join(dir, 'audit.sqlite');
  try {
    const auditLedger = createCivicAuditLedger({ sqlitePath: auditSqlitePath });
    const store = createCivicReputationStore({ sqlitePath, auditLedger });
    store.recordReputation(reputationRecord(), { nowMs: 1_779_784_000_000 });
    store.recordDispute(reputationDispute(), { nowMs: 1_779_784_000_500 });
    store.recordReputation(reputationRecord({
      recordId: 'reputation_quality_dispute_001',
      awardedByAccountId: 'acct_v6_human_002',
      delta: -1,
      sourceRef: 'moderation_bridge_text_001',
      disputeStatus: 'open',
      auditLedgerEntryId: 'audit_reputation_quality_dispute_001'
    }), { nowMs: 1_779_784_001_000 });
    store.close();
    auditLedger.close();

    const reopenedAudit = createCivicAuditLedger({ sqlitePath: auditSqlitePath });
    const reopened = createCivicReputationStore({ sqlitePath, auditLedger: reopenedAudit });
    assert.equal(reopened.count(), 2);
    assert.equal(reopened.disputeCount(), 1);
    assert.equal(reopened.getRecord('reputation_service_quality_001').delta, 2);
    assert.equal(reopened.getDispute('repdispute_service_quality_001').status, 'opened');
    assert.deepEqual(
      reopened.listDisputes({ recordId: 'reputation_service_quality_001' }).map((row) => row.disputeId),
      ['repdispute_service_quality_001']
    );
    assert.deepEqual(
      reopened.listDisputes({ status: 'opened' }).map((row) => row.disputeId),
      ['repdispute_service_quality_001']
    );
    assert.deepEqual(
      reopened.listRecords({ subjectAccountId: 'acct_service_provider_001' }).map((row) => row.recordId),
      ['reputation_service_quality_001', 'reputation_quality_dispute_001']
    );
    assert.deepEqual(
      reopened.listRecords({ disputeStatus: 'open' }).map((row) => row.recordId),
      ['reputation_quality_dispute_001']
    );
    const summary = reopened.summarizeSubjectReputation('acct_service_provider_001');
    assert.equal(summary.totalScore, 1);
    assert.equal(summary.openDisputeCount, 1);
    assert.equal(summary.disputeReviewCount, 1);
    assert.equal(summary.openDisputeReviewCount, 1);
    assert.equal(summary.latestDisputeId, 'repdispute_service_quality_001');
    assert.deepEqual(
      reopenedAudit.replay({ actorAccountId: 'acct_v6_human_002' }).map((row) => row.entry.objectRef),
      ['repdispute_service_quality_001', 'reputation_quality_dispute_001']
    );
    assert.equal(reopenedAudit.replay({ actorAccountId: 'acct_v6_human_002' })[0].entry.actionType, 'reputation.disputed');
    reopened.close();
    reopenedAudit.close();
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
