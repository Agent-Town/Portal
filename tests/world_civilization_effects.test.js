const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { CIVIC_SCHEMA_VERSION } = require('../server/world_civilization/schemas');
const { createCivicAuditLedger } = require('../server/world_civilization/audit_ledger');
const { createCivicEffectStore, EFFECT_STATUS_PREPARED, ROLLBACK_STATUS_AVAILABLE } = require('../server/world_civilization/effects');
const { createCivicModerationStore } = require('../server/world_civilization/moderation');
const { createCivicProposalStore } = require('../server/world_civilization/proposals');
const { createCivicVoteStore } = require('../server/world_civilization/votes');

function withTempEffectStores(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-effects-'));
  const auditPath = path.join(dir, 'audit.sqlite');
  const proposalPath = path.join(dir, 'proposals.sqlite');
  const votePath = path.join(dir, 'votes.sqlite');
  const moderationPath = path.join(dir, 'moderation.sqlite');
  const effectPath = path.join(dir, 'effects.sqlite');
  const auditLedger = createCivicAuditLedger({ sqlitePath: auditPath });
  const proposalStore = createCivicProposalStore({ sqlitePath: proposalPath, auditLedger });
  const voteStore = createCivicVoteStore({ sqlitePath: votePath, proposalStore, auditLedger });
  const moderationStore = createCivicModerationStore({ sqlitePath: moderationPath, auditLedger });
  const effectStore = createCivicEffectStore({
    sqlitePath: effectPath,
    proposalStore,
    voteStore,
    moderationStore,
    auditLedger
  });
  try {
    return fn({
      auditLedger,
      auditPath,
      dir,
      effectPath,
      effectStore,
      moderationPath,
      moderationStore,
      proposalPath,
      proposalStore,
      votePath,
      voteStore
    });
  } finally {
    effectStore.close();
    moderationStore.close();
    voteStore.close();
    proposalStore.close();
    auditLedger.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function proposal(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    proposalId: 'proposal_public_works_bridge_001',
    proposer: {
      kind: 'human',
      accountId: 'acct_v6_human_001'
    },
    scope: {
      kind: 'public_works',
      targetId: 'district_great_ridge'
    },
    affectedPublicState: ['public_works:gorge_bridge'],
    effectPreview: {
      effectType: 'public_works_accounting',
      mutationMode: 'preview_only',
      summary: 'Preview bridge accounting without applying it.'
    },
    moderationClass: 'public_works',
    expiresAtMs: 4_102_444_800_000,
    idempotencyKey: 'idem_proposal_bridge_001',
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
    voteId: 'vote_bridge_approval_001',
    proposalId: 'proposal_public_works_bridge_001',
    voter: {
      kind: 'human',
      accountId: 'acct_v6_voter_001'
    },
    choice: 'approve',
    authorization: {
      kind: 'wallet_session',
      subjectAccountId: 'acct_v6_voter_001',
      serverVerified: true
    },
    eligibilityProof: {
      eligible: true,
      ruleId: 'rule_public_works_voter_001'
    },
    receiptId: 'receipt_vote_bridge_001',
    idempotencyKey: 'idem_vote_bridge_001',
    ...overrides
  };
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

function rollbackPlan(overrides = {}) {
  return {
    planId: 'rollbackplan_public_works_001',
    strategy: 'Restore previous public works accounting snapshot.',
    canRollback: true,
    irreversibleEffects: [],
    maxRollbackMs: 86_400_000,
    ...overrides
  };
}

function civicAction(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    actionId: 'action_prepare_bridge_001',
    proposalId: 'proposal_public_works_bridge_001',
    effectType: 'public_works_accounting',
    executionAuthority: {
      kind: 'human_approved',
      receiptId: 'receipt_vote_bridge_001'
    },
    handlerName: 'et.civic.public_works.apply',
    beforeSummary: 'Bridge contribution total is 20 wood.',
    afterSummary: 'Prepared bridge accounting would set the total to 30 wood.',
    auditLedgerEntryId: 'audit_action_prepare_bridge_001',
    rollbackId: 'rollback_bridge_001',
    idempotencyKey: 'idem_action_bridge_001',
    ...overrides
  };
}

function seedApprovedProposal({ moderationStore, proposalStore, voteStore }) {
  proposalStore.draftProposal(proposal(), { nowMs: 1_779_784_000_000 });
  const decision = moderationStore.recordDecision(moderationDecision(), { nowMs: 1_779_784_100_000 });
  proposalStore.recordProposalReview(decision, { nowMs: 1_779_784_150_000 });
  voteStore.recordVote(vote(), { nowMs: 1_779_784_200_000 });
}

test('V6 civic effect store prepares approved actions with rollback handles but no execution', () => withTempEffectStores(({
  auditLedger,
  effectStore,
  moderationStore,
  proposalStore,
  voteStore
}) => {
  seedApprovedProposal({ moderationStore, proposalStore, voteStore });
  const prepared = effectStore.prepareEffect(civicAction(), rollbackPlan(), { nowMs: 1_779_784_300_000 });
  const rollback = effectStore.getRollback('rollback_bridge_001');
  const summary = effectStore.summarizeProposalEffects('proposal_public_works_bridge_001');

  assert.equal(prepared.actionId, 'action_prepare_bridge_001');
  assert.equal(prepared.status, EFFECT_STATUS_PREPARED);
  assert.equal(prepared.auditEntryId, 'audit_action_prepare_bridge_001');
  assert.equal(rollback.status, ROLLBACK_STATUS_AVAILABLE);
  assert.equal(rollback.actionId, 'action_prepare_bridge_001');
  assert.equal(summary.actionCount, 1);
  assert.equal(summary.rollbackCount, 1);
  assert.equal(summary.byStatus.prepared, 1);
  assert.equal(summary.appliesWorldState, false);
  assert.equal(summary.executionStatus, 'not_executable');
  assert.equal(typeof effectStore.applyEffect, 'undefined');
  assert.equal(typeof effectStore.rollbackEffect, 'undefined');

  const audit = auditLedger.getByEntryId('audit_action_prepare_bridge_001');
  assert.equal(audit.entry.actionType, 'civic_action.prepared');
  assert.equal(audit.entry.actor.accountId, 'acct_v6_voter_001');
  assert.equal(audit.entry.rollbackId, 'rollback_bridge_001');
  assert.deepEqual(
    auditLedger.replay().map((row) => row.entry.actionType),
    ['proposal.created', 'moderation.decided', 'proposal.reviewed', 'vote.recorded', 'civic_action.prepared']
  );
}));

test('V6 civic effect store enforces idempotency and rollback id uniqueness', () => withTempEffectStores(({
  effectStore,
  moderationStore,
  proposalStore,
  voteStore
}) => {
  seedApprovedProposal({ moderationStore, proposalStore, voteStore });
  const first = effectStore.prepareEffect(civicAction(), rollbackPlan(), { nowMs: 1_779_784_300_000 });
  const duplicate = effectStore.prepareEffect(civicAction(), rollbackPlan(), { nowMs: 1_779_784_301_000 });

  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.actionId, first.actionId);
  assert.equal(effectStore.count(), 1);
  assert.throws(
    () => effectStore.prepareEffect(civicAction({
      actionId: 'action_prepare_bridge_002',
      afterSummary: 'Changed after summary for the same idempotency key.',
      rollbackId: 'rollback_bridge_002'
    }), rollbackPlan(), { nowMs: 1_779_784_302_000 }),
    /CIVIC_EFFECT_IDEMPOTENCY_CONFLICT/
  );
  assert.throws(
    () => effectStore.prepareEffect(civicAction({
      actionId: 'action_prepare_bridge_003',
      auditLedgerEntryId: 'audit_action_prepare_bridge_003',
      idempotencyKey: 'idem_action_bridge_003'
    }), rollbackPlan(), { nowMs: 1_779_784_303_000 }),
    /CIVIC_EFFECT_ROLLBACK_ID_CONFLICT/
  );
  assert.equal(effectStore.count(), 1);
}));

test('V6 civic effect store rejects missing prerequisites and delegated execution without proof', () => withTempEffectStores(({
  effectStore,
  moderationStore,
  proposalStore,
  voteStore
}) => {
  assert.throws(
    () => effectStore.prepareEffect(civicAction(), rollbackPlan(), { nowMs: 1_779_784_300_000 }),
    /CIVIC_EFFECT_PROPOSAL_REQUIRED/
  );

  proposalStore.draftProposal(proposal(), { nowMs: 1_779_784_000_000 });
  assert.throws(
    () => effectStore.prepareEffect(civicAction(), rollbackPlan(), { nowMs: 1_779_784_300_000 }),
    /CIVIC_EFFECT_MODERATION_REQUIRED/
  );

  moderationStore.recordDecision(moderationDecision(), { nowMs: 1_779_784_100_000 });
  assert.throws(
    () => effectStore.prepareEffect(civicAction(), rollbackPlan(), { nowMs: 1_779_784_300_000 }),
    /CIVIC_EFFECT_PROPOSAL_REVIEW_REQUIRED/
  );

  proposalStore.recordProposalReview(moderationDecision(), { nowMs: 1_779_784_150_000 });
  assert.throws(
    () => effectStore.prepareEffect(civicAction(), rollbackPlan(), { nowMs: 1_779_784_300_000 }),
    /CIVIC_EFFECT_APPROVAL_REQUIRED/
  );

  voteStore.recordVote(vote(), { nowMs: 1_779_784_200_000 });
  assert.throws(
    () => effectStore.prepareEffect(civicAction({
      executionAuthority: {
        kind: 'delegated',
        receiptId: 'receipt_vote_bridge_001'
      }
    }), rollbackPlan(), { nowMs: 1_779_784_300_000 }),
    /CIVIC_EFFECT_DELEGATION_PROOF_REQUIRED/
  );
  assert.throws(
    () => effectStore.prepareEffect(civicAction({
      executionAuthority: {
        kind: 'human_approved',
        receiptId: 'receipt_vote_missing_001'
      }
    }), rollbackPlan(), { nowMs: 1_779_784_300_000 }),
    /CIVIC_EFFECT_APPROVAL_RECEIPT_REQUIRED/
  );
  assert.equal(effectStore.count(), 0);
}));

test('V6 civic effect store rejects invalid actions, rollback gaps, and private data before persistence', () => withTempEffectStores(({
  auditLedger,
  effectStore,
  moderationStore,
  proposalStore,
  voteStore
}) => {
  seedApprovedProposal({ moderationStore, proposalStore, voteStore });
  assert.throws(
    () => effectStore.prepareEffect(civicAction({
      actionId: 'action_private_trace_001',
      debugTrace: {
        token: 'sk-test-secret-value'
      }
    }), rollbackPlan(), { nowMs: 1_779_784_300_000 }),
    /CIVIC_EFFECT_ACTION_INVALID/
  );
  assert.throws(
    () => effectStore.prepareEffect(civicAction({
      actionId: 'action_handler_mismatch_001',
      handlerName: 'et.civic.public_summary.apply',
      auditLedgerEntryId: 'audit_action_handler_mismatch_001',
      idempotencyKey: 'idem_action_handler_mismatch_001',
      rollbackId: 'rollback_handler_mismatch_001'
    }), rollbackPlan(), { nowMs: 1_779_784_300_000 }),
    /CIVIC_EFFECT_ACTION_INVALID/
  );
  assert.throws(
    () => effectStore.prepareEffect(civicAction({
      actionId: 'action_bad_rollback_001',
      auditLedgerEntryId: 'audit_action_bad_rollback_001',
      idempotencyKey: 'idem_action_bad_rollback_001',
      rollbackId: 'rollback_bad_001'
    }), rollbackPlan({
      canRollback: false
    }), { nowMs: 1_779_784_300_000 }),
    /CIVIC_EFFECT_ROLLBACK_INVALID/
  );
  assert.throws(
    () => effectStore.prepareEffect(civicAction({
      actionId: 'action_wrong_plan_001',
      auditLedgerEntryId: 'audit_action_wrong_plan_001',
      idempotencyKey: 'idem_action_wrong_plan_001',
      rollbackId: 'rollback_wrong_plan_001'
    }), rollbackPlan({
      planId: 'rollbackplan_public_works_999'
    }), { nowMs: 1_779_784_300_000 }),
    /CIVIC_EFFECT_ROLLBACK_PLAN_MISMATCH/
  );
  assert.equal(effectStore.count(), 0);
  assert.equal(auditLedger.replay().filter((row) => row.entry.actionType === 'civic_action.prepared').length, 0);
}));

test('V6 civic effect store persists prepared actions and rollback replay indexes', () => withTempEffectStores(({
  auditLedger,
  auditPath,
  effectPath,
  effectStore,
  moderationPath,
  moderationStore,
  proposalPath,
  proposalStore,
  votePath,
  voteStore
}) => {
  seedApprovedProposal({ moderationStore, proposalStore, voteStore });
  effectStore.prepareEffect(civicAction(), rollbackPlan(), { nowMs: 1_779_784_300_000 });
  effectStore.close();
  moderationStore.close();
  voteStore.close();
  proposalStore.close();
  auditLedger.close();

  const reopenedAudit = createCivicAuditLedger({ sqlitePath: auditPath });
  const reopenedProposals = createCivicProposalStore({ sqlitePath: proposalPath, auditLedger: reopenedAudit });
  const reopenedVotes = createCivicVoteStore({
    sqlitePath: votePath,
    proposalStore: reopenedProposals,
    auditLedger: reopenedAudit
  });
  const reopenedModeration = createCivicModerationStore({ sqlitePath: moderationPath, auditLedger: reopenedAudit });
  const reopenedEffects = createCivicEffectStore({
    sqlitePath: effectPath,
    proposalStore: reopenedProposals,
    voteStore: reopenedVotes,
    moderationStore: reopenedModeration,
    auditLedger: reopenedAudit
  });
  try {
    assert.equal(reopenedEffects.count(), 1);
    assert.equal(reopenedEffects.getAction('action_prepare_bridge_001').status, EFFECT_STATUS_PREPARED);
    assert.equal(reopenedEffects.getRollback('rollback_bridge_001').status, ROLLBACK_STATUS_AVAILABLE);
    assert.deepEqual(
      reopenedEffects.listActions({ proposalId: 'proposal_public_works_bridge_001' }).map((entry) => entry.actionId),
      ['action_prepare_bridge_001']
    );
    assert.deepEqual(
      reopenedEffects.listRollbacks({ actionId: 'action_prepare_bridge_001' }).map((entry) => entry.rollbackId),
      ['rollback_bridge_001']
    );
    assert.equal(reopenedAudit.replay({ objectRef: 'action_prepare_bridge_001' })[0].entry.actionType, 'civic_action.prepared');
  } finally {
    reopenedEffects.close();
    reopenedModeration.close();
    reopenedVotes.close();
    reopenedProposals.close();
    reopenedAudit.close();
  }
}));
