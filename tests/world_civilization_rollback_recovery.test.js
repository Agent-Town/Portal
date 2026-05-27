const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { CIVIC_SCHEMA_VERSION } = require('../server/world_civilization/schemas');
const { createCivicAuditLedger } = require('../server/world_civilization/audit_ledger');
const { createCivicEffectStore } = require('../server/world_civilization/effects');
const { createCivicModerationStore } = require('../server/world_civilization/moderation');
const { createCivicProposalStore } = require('../server/world_civilization/proposals');
const { createCivicVoteStore } = require('../server/world_civilization/votes');
const {
  assertV6RollbackRecoverySafe,
  buildV6RollbackRecoveryReport
} = require('../server/world_civilization/rollback_recovery');

function openStores(paths) {
  const auditLedger = createCivicAuditLedger({ sqlitePath: paths.auditPath });
  const proposalStore = createCivicProposalStore({ sqlitePath: paths.proposalPath, auditLedger });
  const voteStore = createCivicVoteStore({ sqlitePath: paths.votePath, proposalStore, auditLedger });
  const moderationStore = createCivicModerationStore({ sqlitePath: paths.moderationPath, auditLedger });
  const effectStore = createCivicEffectStore({
    sqlitePath: paths.effectPath,
    proposalStore,
    voteStore,
    moderationStore,
    auditLedger
  });
  return { auditLedger, effectStore, moderationStore, proposalStore, voteStore };
}

function closeStores(stores) {
  stores.effectStore.close();
  stores.moderationStore.close();
  stores.voteStore.close();
  stores.proposalStore.close();
  stores.auditLedger.close();
}

function withTempPaths(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-rollback-recovery-'));
  const paths = {
    auditPath: path.join(dir, 'audit.sqlite'),
    proposalPath: path.join(dir, 'proposals.sqlite'),
    votePath: path.join(dir, 'votes.sqlite'),
    moderationPath: path.join(dir, 'moderation.sqlite'),
    effectPath: path.join(dir, 'effects.sqlite')
  };
  try {
    return fn(paths);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function rollbackPlan(overrides = {}) {
  return {
    planId: 'rollbackplan_recovery_public_works_001',
    strategy: 'Recover the public works accounting snapshot from the rollback handle.',
    canRollback: true,
    irreversibleEffects: [],
    maxRollbackMs: 86_400_000,
    ...overrides
  };
}

function proposal(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    proposalId: 'proposal_recovery_bridge_001',
    proposer: {
      kind: 'human',
      accountId: 'acct_v6_recovery_proposer_001'
    },
    scope: {
      kind: 'public_works',
      targetId: 'district_recovery_ridge'
    },
    affectedPublicState: ['public_works:recovery_bridge'],
    effectPreview: {
      effectType: 'public_works_accounting',
      mutationMode: 'preview_only',
      summary: 'Preview recovery bridge accounting without applying it.'
    },
    moderationClass: 'public_works',
    expiresAtMs: 4_102_444_800_000,
    idempotencyKey: 'idem_recovery_proposal_bridge_001',
    rollbackPlan: rollbackPlan(),
    privacy: {
      redacted: true,
      privateDataIncluded: false,
      dataClasses: ['public_profile', 'public_world_state']
    },
    ...overrides
  };
}

function vote(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    voteId: 'vote_recovery_bridge_approval_001',
    proposalId: 'proposal_recovery_bridge_001',
    voter: {
      kind: 'human',
      accountId: 'acct_v6_recovery_voter_001'
    },
    choice: 'approve',
    authorization: {
      kind: 'wallet_session',
      subjectAccountId: 'acct_v6_recovery_voter_001',
      serverVerified: true
    },
    eligibilityProof: {
      eligible: true,
      ruleId: 'rule_recovery_public_works_voter_001'
    },
    receiptId: 'receipt_recovery_vote_bridge_001',
    idempotencyKey: 'idem_recovery_vote_bridge_001',
    ...overrides
  };
}

function moderationDecision(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    decisionId: 'moderation_recovery_bridge_001',
    subjectRef: 'proposal_recovery_bridge_001',
    surface: 'public_works',
    status: 'approved',
    policyVersion: 'policy_v6_recovery_public_001',
    reviewerKind: 'system',
    reasons: ['No private state or unsafe public text detected.'],
    redactedFields: [],
    ...overrides
  };
}

function civicAction(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    actionId: 'action_recovery_bridge_001',
    proposalId: 'proposal_recovery_bridge_001',
    effectType: 'public_works_accounting',
    executionAuthority: {
      kind: 'human_approved',
      receiptId: 'receipt_recovery_vote_bridge_001'
    },
    handlerName: 'et.civic.public_works.apply',
    beforeSummary: 'Recovery bridge public contribution total is 10 wood.',
    afterSummary: 'Prepared recovery bridge accounting would set the total to 12 wood.',
    auditLedgerEntryId: 'audit_action_recovery_bridge_001',
    rollbackId: 'rollback_recovery_bridge_001',
    idempotencyKey: 'idem_recovery_action_bridge_001',
    ...overrides
  };
}

function seedPreparedEffect(stores) {
  stores.proposalStore.draftProposal(proposal(), { nowMs: 1_779_784_000_000 });
  const decision = stores.moderationStore.recordDecision(moderationDecision(), { nowMs: 1_779_784_100_000 });
  stores.proposalStore.recordProposalReview(decision, { nowMs: 1_779_784_150_000 });
  stores.voteStore.recordVote(vote(), { nowMs: 1_779_784_200_000 });
  stores.effectStore.prepareEffect(civicAction(), rollbackPlan(), { nowMs: 1_779_784_300_000 });
}

test('V6 rollback recovery report reconstructs prepared handles after reopen without executing state', () => withTempPaths((paths) => {
  const stores = openStores(paths);
  seedPreparedEffect(stores);
  closeStores(stores);

  const reopened = openStores(paths);
  try {
    const report = buildV6RollbackRecoveryReport({
      effectStore: reopened.effectStore,
      auditLedger: reopened.auditLedger,
      proposalId: 'proposal_recovery_bridge_001',
      nowMs: 1_779_784_301_000
    });

    assert.equal(report.ok, true);
    assert.equal(report.status, 'research_only');
    assert.equal(report.releaseReady, false);
    assert.equal(report.appliesWorldState, false);
    assert.equal(report.executionStatus, 'not_executable');
    assert.equal(report.actionCount, 1);
    assert.equal(report.recoverableHandleCount, 1);
    assert.equal(report.missingRollbackCount, 0);
    assert.equal(report.missingAuditCount, 0);
    assert.equal(report.expiredWindowCount, 0);
    assert.deepEqual(report.handles, [{
      actionId: 'action_recovery_bridge_001',
      proposalId: 'proposal_recovery_bridge_001',
      effectType: 'public_works_accounting',
      handlerName: 'et.civic.public_works.apply',
      actionStatus: 'prepared',
      rollbackId: 'rollback_recovery_bridge_001',
      rollbackStatus: 'available',
      planId: 'rollbackplan_recovery_public_works_001',
      auditEntryId: 'audit_action_recovery_bridge_001',
      auditEntryFound: true,
      windowOpen: true,
      canRecoverFutureEffect: true,
      appliesWorldState: false,
      executionStatus: 'not_executable'
    }]);
    assert.deepEqual(assertV6RollbackRecoverySafe(report), { ok: true, errors: [] });
    assert.equal(typeof reopened.effectStore.applyEffect, 'undefined');
    assert.equal(typeof reopened.effectStore.rollbackEffect, 'undefined');
  } finally {
    closeStores(reopened);
  }
}));

test('V6 rollback recovery report fails closed for missing dependencies and expired handles', () => withTempPaths((paths) => {
  assert.match(
    buildV6RollbackRecoveryReport({ effectStore: null, auditLedger: null }).errors.join(','),
    /V6_ROLLBACK_RECOVERY_EFFECT_STORE_REQUIRED/
  );

  const stores = openStores(paths);
  try {
    seedPreparedEffect(stores);
    const missingLedger = buildV6RollbackRecoveryReport({
      effectStore: stores.effectStore,
      auditLedger: null,
      proposalId: 'proposal_recovery_bridge_001'
    });
    assert.equal(missingLedger.ok, false);
    assert.match(missingLedger.errors.join(','), /V6_ROLLBACK_RECOVERY_AUDIT_LEDGER_REQUIRED/);

    const expired = buildV6RollbackRecoveryReport({
      effectStore: stores.effectStore,
      auditLedger: stores.auditLedger,
      proposalId: 'proposal_recovery_bridge_001',
      nowMs: 1_779_784_300_000 + 86_400_001
    });
    assert.equal(expired.ok, false);
    assert.equal(expired.expiredWindowCount, 1);
    assert.equal(expired.handles[0].canRecoverFutureEffect, false);
    assert.match(expired.errors.join(','), /V6_ROLLBACK_RECOVERY_WINDOW_EXPIRED:rollback_recovery_bridge_001/);
    const safety = assertV6RollbackRecoverySafe(expired);
    assert.equal(safety.ok, false);
    assert.match(safety.errors.join(','), /V6_ROLLBACK_RECOVERY_ERRORS_PRESENT/);
  } finally {
    closeStores(stores);
  }
}));
