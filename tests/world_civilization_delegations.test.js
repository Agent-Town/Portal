const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { CIVIC_SCHEMA_VERSION } = require('../server/world_civilization/schemas');
const { createCivicAuditLedger } = require('../server/world_civilization/audit_ledger');
const {
  DELEGATION_STATUS_ACTIVE,
  DELEGATION_STATUS_REVOKED,
  createCivicDelegationStore
} = require('../server/world_civilization/delegations');

function withTempDelegationStore(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-delegations-'));
  const sqlitePath = path.join(dir, 'delegations.sqlite');
  const auditSqlitePath = path.join(dir, 'audit.sqlite');
  const auditLedger = createCivicAuditLedger({ sqlitePath: auditSqlitePath });
  const store = createCivicDelegationStore({ sqlitePath, auditLedger });
  try {
    return fn({ auditLedger, auditSqlitePath, sqlitePath, store });
  } finally {
    store.close();
    auditLedger.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function delegation(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    delegationId: 'delegation_vote_advice_001',
    principalAccountId: 'acct_v6_human_001',
    delegateAgentId: 'agent_civic_clover_001',
    scope: 'vote_advice',
    expiresAtMs: 4_102_444_800_000,
    maxActions: 3,
    approvalReceiptId: 'receipt_delegate_vote_advice_001',
    revocable: true,
    canExecuteCivicEffects: false,
    ...overrides
  };
}

test('V6 delegation store records scoped agent participation without execution authority', () => withTempDelegationStore(({ auditLedger, store }) => {
  const row = store.recordDelegation(delegation(), { nowMs: 1_779_784_000_000 });
  const policy = store.getAgentParticipationPolicy({
    principalAccountId: 'acct_v6_human_001',
    delegateAgentId: 'agent_civic_clover_001',
    atMs: 1_779_784_100_000
  });
  const summary = store.summarizePrincipalDelegations('acct_v6_human_001', { atMs: 1_779_784_100_000 });

  assert.equal(row.delegationId, 'delegation_vote_advice_001');
  assert.equal(row.status, DELEGATION_STATUS_ACTIVE);
  assert.equal(row.canExecuteCivicEffects, false);
  assert.deepEqual(policy.allowedScopes, ['vote_advice']);
  assert.deepEqual(policy.activeDelegationIds, ['delegation_vote_advice_001']);
  assert.equal(policy.civicExecutionAllowed, false);
  assert.equal(policy.remainingActionBudgetByScope.vote_advice, 3);
  assert.equal(policy.executionStatus, 'not_executable');
  assert.equal(summary.activeCount, 1);
  assert.equal(summary.byScope.vote_advice.active, 1);
  assert.equal(summary.executionStatus, 'not_executable');
  assert.equal(typeof store.applyDelegation, 'undefined');
  assert.equal(typeof store.executeDelegatedAction, 'undefined');

  const audit = auditLedger.getByEntryId('audit_delegation_vote_advice_001');
  assert.equal(audit.entry.actionType, 'delegation.created');
  assert.equal(audit.entry.actor.accountId, 'acct_v6_human_001');
  assert.equal(audit.entry.objectRef, 'delegation_vote_advice_001');
}));

test('V6 delegation store enforces receipt idempotency and scoped execution permission', () => withTempDelegationStore(({ auditLedger, store }) => {
  const first = store.recordDelegation(delegation(), { nowMs: 1_779_784_000_000 });
  const duplicate = store.recordDelegation(delegation(), { nowMs: 1_779_784_001_000 });

  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.delegationId, first.delegationId);
  assert.equal(store.count(), 1);
  assert.equal(auditLedger.count(), 1);
  assert.throws(
    () => store.recordDelegation(delegation({
      delegationId: 'delegation_vote_advice_002',
      scope: 'proposal_drafting'
    }), { nowMs: 1_779_784_002_000 }),
    /CIVIC_DELEGATION_RECEIPT_CONFLICT/
  );
  assert.throws(
    () => store.recordDelegation(delegation({
      delegationId: 'delegation_civic_execution_001',
      scope: 'civic_execution',
      approvalReceiptId: 'receipt_delegate_execution_001'
    }), { nowMs: 1_779_784_003_000 }),
    /CIVIC_DELEGATION_EXECUTION_PERMISSION_REQUIRED/
  );
  assert.throws(
    () => store.recordDelegation(delegation({
      delegationId: 'delegation_expired_001',
      approvalReceiptId: 'receipt_delegate_expired_001',
      expiresAtMs: 1_000
    }), { nowMs: 2_000 }),
    /CIVIC_DELEGATION_EXPIRED/
  );
  assert.throws(
    () => store.recordDelegation(delegation({
      delegationId: 'delegation_private_001',
      approvalReceiptId: 'receipt_delegate_private_001',
      debugTrace: {
        token: 'sk-test-secret-value'
      }
    }), { nowMs: 1_779_784_004_000 }),
    /CIVIC_DELEGATION_INVALID/
  );
  assert.equal(store.count(), 1);
  assert.equal(auditLedger.count(), 1);
}));

test('V6 delegation store revokes scoped authority with principal-owned audit', () => withTempDelegationStore(({ auditLedger, store }) => {
  store.recordDelegation(delegation(), { nowMs: 1_779_784_000_000 });
  assert.throws(
    () => store.revokeDelegation('delegation_vote_advice_001', {
      principalAccountId: 'acct_attacker_001',
      nowMs: 1_779_784_010_000
    }),
    /CIVIC_DELEGATION_REVOKE_PRINCIPAL_MISMATCH/
  );

  const revoked = store.revokeDelegation('delegation_vote_advice_001', {
    principalAccountId: 'acct_v6_human_001',
    nowMs: 1_779_784_020_000
  });
  const duplicate = store.revokeDelegation('delegation_vote_advice_001', {
    principalAccountId: 'acct_v6_human_001',
    nowMs: 1_779_784_030_000
  });
  const policy = store.getAgentParticipationPolicy({
    principalAccountId: 'acct_v6_human_001',
    delegateAgentId: 'agent_civic_clover_001',
    atMs: 1_779_784_040_000
  });

  assert.equal(revoked.status, DELEGATION_STATUS_REVOKED);
  assert.equal(revoked.revokeAuditEntryId, 'audit_delegation_vote_advice_001_revoked');
  assert.equal(duplicate.duplicate, true);
  assert.deepEqual(policy.allowedScopes, []);
  assert.deepEqual(policy.revokedDelegationIds, ['delegation_vote_advice_001']);
  assert.deepEqual(
    auditLedger.replay().map((row) => row.entry.actionType),
    ['delegation.created', 'delegation.revoked']
  );
}));

test('V6 delegation store persists policies and tracks civic execution delegation separately', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-delegations-persist-'));
  const sqlitePath = path.join(dir, 'delegations.sqlite');
  const auditSqlitePath = path.join(dir, 'audit.sqlite');
  try {
    const auditLedger = createCivicAuditLedger({ sqlitePath: auditSqlitePath });
    const store = createCivicDelegationStore({ sqlitePath, auditLedger });
    store.recordDelegation(delegation(), { nowMs: 1_779_784_000_000 });
    store.recordDelegation(delegation({
      delegationId: 'delegation_civic_execution_001',
      scope: 'civic_execution',
      maxActions: 1,
      approvalReceiptId: 'receipt_delegate_execution_001',
      canExecuteCivicEffects: true
    }), { nowMs: 1_779_784_010_000 });
    store.close();
    auditLedger.close();

    const reopenedAudit = createCivicAuditLedger({ sqlitePath: auditSqlitePath });
    const reopened = createCivicDelegationStore({ sqlitePath, auditLedger: reopenedAudit });
    assert.equal(reopened.count(), 2);
    assert.equal(reopened.getDelegation('delegation_civic_execution_001').canExecuteCivicEffects, true);
    assert.deepEqual(
      reopened.listDelegations({ principalAccountId: 'acct_v6_human_001' }).map((row) => row.delegationId),
      ['delegation_vote_advice_001', 'delegation_civic_execution_001']
    );
    const policy = reopened.getAgentParticipationPolicy({
      principalAccountId: 'acct_v6_human_001',
      delegateAgentId: 'agent_civic_clover_001',
      atMs: 1_779_784_020_000
    });
    assert.deepEqual(policy.allowedScopes, ['vote_advice', 'civic_execution']);
    assert.equal(policy.civicExecutionAllowed, true);
    assert.equal(policy.remainingActionBudgetByScope.civic_execution, 1);
    assert.equal(policy.executionStatus, 'not_executable');

    const summary = reopened.summarizePrincipalDelegations('acct_v6_human_001', { atMs: 1_779_784_020_000 });
    assert.equal(summary.activeCount, 2);
    assert.equal(summary.civicExecutionDelegationCount, 1);
    assert.equal(reopenedAudit.replay({ objectRef: 'delegation_civic_execution_001' })[0].entry.actionType, 'delegation.created');
    reopened.close();
    reopenedAudit.close();
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
