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
    assert.equal(reopened.getRecord('reputation_service_quality_001').delta, 2);
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
    assert.equal(reopenedAudit.replay({ actorAccountId: 'acct_v6_human_002' })[0].entry.objectRef, 'reputation_quality_dispute_001');
    reopened.close();
    reopenedAudit.close();
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
