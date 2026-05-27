const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { createCivicAuditLedger } = require('../server/world_civilization/audit_ledger');
const {
  REQUIRED_GOVERNANCE_PREFLIGHT_CHECKS,
  V6_CIVIC_GOVERNANCE_PREFLIGHT_VERSION,
  assertV6CivicGovernancePreflightSafe,
  buildV6CivicGovernancePreflight,
  throwV6CivicGovernancePreflightError
} = require('../server/world_civilization/governance_preflight');
const { createCivicEffectStore } = require('../server/world_civilization/effects');
const { createCivicModerationStore } = require('../server/world_civilization/moderation');
const { createCivicProposalStore } = require('../server/world_civilization/proposals');
const { CIVIC_SCHEMA_VERSION } = require('../server/world_civilization/schemas');
const { createCivicVoteStore } = require('../server/world_civilization/votes');

function withStores(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-preflight-'));
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
    return fn({ auditLedger, effectStore, moderationStore, proposalStore, voteStore });
  } finally {
    effectStore.close();
    moderationStore.close();
    voteStore.close();
    proposalStore.close();
    auditLedger.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function rollbackPlan(overrides = {}) {
  return {
    planId: 'rollbackplan_governance_preflight_001',
    strategy: 'Restore the prior public accounting snapshot.',
    canRollback: true,
    irreversibleEffects: [],
    maxRollbackMs: 86_400_000,
    ...overrides
  };
}

function proposal(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    proposalId: 'proposal_governance_preflight_001',
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
    idempotencyKey: 'idem_proposal_preflight_001',
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
    voteId: 'vote_governance_preflight_001',
    proposalId: 'proposal_governance_preflight_001',
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
    receiptId: 'receipt_vote_preflight_001',
    idempotencyKey: 'idem_vote_preflight_001',
    ...overrides
  };
}

function moderationDecision(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    decisionId: 'moderation_governance_preflight_001',
    subjectRef: 'proposal_governance_preflight_001',
    surface: 'public_works',
    status: 'approved',
    policyVersion: 'policy_v6_public_001',
    reviewerKind: 'system',
    reasons: ['Public-safe proposal text.'],
    redactedFields: [],
    ...overrides
  };
}

function civicAction(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    actionId: 'action_governance_preflight_001',
    proposalId: 'proposal_governance_preflight_001',
    effectType: 'public_works_accounting',
    executionAuthority: {
      kind: 'human_approved',
      receiptId: 'receipt_vote_preflight_001'
    },
    handlerName: 'et.civic.public_works.apply',
    beforeSummary: 'Bridge contribution total is 20 wood.',
    afterSummary: 'Prepared bridge accounting would set the total to 30 wood.',
    auditLedgerEntryId: 'audit_action_governance_preflight_001',
    rollbackId: 'rollback_governance_preflight_001',
    idempotencyKey: 'idem_action_preflight_001',
    ...overrides
  };
}

function seedApproved({ moderationStore, proposalStore, voteStore }) {
  proposalStore.draftProposal(proposal(), { nowMs: 1_779_784_000_000 });
  const decision = moderationStore.recordDecision(moderationDecision(), { nowMs: 1_779_784_100_000 });
  proposalStore.recordProposalReview(decision, { nowMs: 1_779_784_150_000 });
  voteStore.recordVote(vote(), { nowMs: 1_779_784_200_000 });
}

function preflight(stores, overrides = {}) {
  return buildV6CivicGovernancePreflight({
    rawAction: civicAction(),
    rawRollbackPlan: rollbackPlan(),
    proposalStore: stores.proposalStore,
    voteStore: stores.voteStore,
    moderationStore: stores.moderationStore,
    nowMs: 1_779_784_300_000,
    ...overrides
  });
}

test('V6 governance preflight passes only approved proposal vote moderation and rollback prerequisites', () => withStores((stores) => {
  seedApproved(stores);
  const report = preflight(stores);

  assert.equal(report.version, V6_CIVIC_GOVERNANCE_PREFLIGHT_VERSION);
  assert.equal(report.status, 'research_only');
  assert.equal(report.canPrepare, true);
  assert.equal(report.failClosed, false);
  assert.equal(report.releaseReady, false);
  assert.equal(report.executionStatus, 'not_executable');
  assert.equal(report.mutationApplied, false);
  assert.deepEqual(report.checks.map((entry) => entry.key), REQUIRED_GOVERNANCE_PREFLIGHT_CHECKS);
  assert.ok(report.checks.every((entry) => entry.ok === true));
  assert.equal(report.proposal.proposalId, 'proposal_governance_preflight_001');
  assert.equal(report.approvingVote.voteId, 'vote_governance_preflight_001');
  assert.equal(report.moderationDecision.decisionId, 'moderation_governance_preflight_001');
  assert.deepEqual(assertV6CivicGovernancePreflightSafe(report), { ok: true, errors: [] });
}));

test('V6 governance preflight fails closed for missing moderation vote and approval receipt', () => withStores((stores) => {
  let report = preflight(stores);
  assert.equal(report.canPrepare, false);
  assert.equal(report.failClosed, true);
  assert.match(report.errors.join(','), /CIVIC_EFFECT_PROPOSAL_REQUIRED/);
  assert.throws(() => throwV6CivicGovernancePreflightError(report), /CIVIC_EFFECT_PROPOSAL_REQUIRED/);

  stores.proposalStore.draftProposal(proposal(), { nowMs: 1_779_784_000_000 });
  report = preflight(stores);
  assert.match(report.errors.join(','), /CIVIC_EFFECT_MODERATION_REQUIRED/);
  assert.throws(() => throwV6CivicGovernancePreflightError(report), /CIVIC_EFFECT_MODERATION_REQUIRED/);

  stores.moderationStore.recordDecision(moderationDecision(), { nowMs: 1_779_784_100_000 });
  report = preflight(stores);
  assert.match(report.errors.join(','), /CIVIC_EFFECT_PROPOSAL_REVIEW_REQUIRED/);
  assert.throws(() => throwV6CivicGovernancePreflightError(report), /CIVIC_EFFECT_PROPOSAL_REVIEW_REQUIRED/);

  stores.proposalStore.recordProposalReview(moderationDecision(), { nowMs: 1_779_784_150_000 });
  report = preflight(stores);
  assert.match(report.errors.join(','), /CIVIC_EFFECT_APPROVAL_REQUIRED/);
  assert.throws(() => throwV6CivicGovernancePreflightError(report), /CIVIC_EFFECT_APPROVAL_REQUIRED/);

  stores.voteStore.recordVote(vote(), { nowMs: 1_779_784_200_000 });
  report = preflight(stores, {
    rawAction: civicAction({
      executionAuthority: {
        kind: 'human_approved',
        receiptId: 'receipt_vote_missing_001'
      }
    })
  });
  assert.match(report.errors.join(','), /CIVIC_EFFECT_APPROVAL_RECEIPT_REQUIRED/);
  assert.throws(() => throwV6CivicGovernancePreflightError(report), /CIVIC_EFFECT_APPROVAL_RECEIPT_REQUIRED/);
  assert.deepEqual(assertV6CivicGovernancePreflightSafe(report), { ok: true, errors: [] });
}));

test('V6 governance preflight enforces explicit vote quorum and threshold policy', () => withStores((stores) => {
  stores.proposalStore.draftProposal(proposal(), { nowMs: 1_779_784_000_000 });
  const decision = stores.moderationStore.recordDecision(moderationDecision(), { nowMs: 1_779_784_100_000 });
  stores.proposalStore.recordProposalReview(decision, { nowMs: 1_779_784_150_000 });
  stores.voteStore.recordVote(vote(), { nowMs: 1_779_784_200_000 });

  let report = preflight(stores, {
    voteApprovalPolicy: {
      policyId: 'policy_v6_preflight_two_vote_001',
      quorumMinVotes: 2,
      minApproveVotes: 2,
      approvalThresholdBps: 6600
    }
  });
  assert.equal(report.canPrepare, false);
  assert.match(report.errors.join(','), /CIVIC_EFFECT_VOTE_POLICY_REQUIRED/);
  assert.deepEqual(report.votePolicy.failures, ['quorum', 'min_approve']);
  assert.throws(() => throwV6CivicGovernancePreflightError(report), /CIVIC_EFFECT_VOTE_POLICY_REQUIRED/);

  stores.voteStore.recordVote(vote({
    voteId: 'vote_governance_preflight_002',
    voter: {
      kind: 'human',
      accountId: 'acct_v6_voter_002'
    },
    authorization: {
      kind: 'wallet_session',
      subjectAccountId: 'acct_v6_voter_002',
      serverVerified: true
    },
    receiptId: 'receipt_vote_preflight_002',
    idempotencyKey: 'idem_vote_preflight_002'
  }), { nowMs: 1_779_784_250_000 });

  report = preflight(stores, {
    voteApprovalPolicy: {
      policyId: 'policy_v6_preflight_two_vote_001',
      quorumMinVotes: 2,
      minApproveVotes: 2,
      approvalThresholdBps: 6600
    }
  });
  assert.equal(report.canPrepare, true);
  assert.equal(report.votePolicy.ok, true);
  assert.equal(report.votePolicy.approvalBps, 10_000);
  assert.deepEqual(assertV6CivicGovernancePreflightSafe(report), { ok: true, errors: [] });
}));

test('V6 governance preflight rejects delegated execution and stale or mismatched effect inputs', () => withStores((stores) => {
  seedApproved(stores);
  const delegated = preflight(stores, {
    rawAction: civicAction({
      executionAuthority: {
        kind: 'delegated',
        receiptId: 'receipt_vote_preflight_001'
      }
    })
  });
  const wrongEffect = preflight(stores, {
    rawAction: civicAction({
      effectType: 'public_summary',
      handlerName: 'et.civic.public_summary.apply'
    })
  });
  const wrongRollback = preflight(stores, {
    rawRollbackPlan: rollbackPlan({
      planId: 'rollbackplan_wrong_001'
    })
  });
  const expired = preflight(stores, {
    nowMs: 4_102_444_800_001
  });

  assert.match(delegated.errors.join(','), /CIVIC_EFFECT_DELEGATION_UNSUPPORTED/);
  assert.throws(() => throwV6CivicGovernancePreflightError(delegated), /CIVIC_EFFECT_DELEGATION_UNSUPPORTED/);
  assert.match(wrongEffect.errors.join(','), /CIVIC_EFFECT_TYPE_MISMATCH/);
  assert.throws(() => throwV6CivicGovernancePreflightError(wrongEffect), /CIVIC_EFFECT_TYPE_MISMATCH/);
  assert.match(wrongRollback.errors.join(','), /CIVIC_EFFECT_ROLLBACK_PLAN_MISMATCH/);
  assert.throws(() => throwV6CivicGovernancePreflightError(wrongRollback), /CIVIC_EFFECT_ROLLBACK_PLAN_MISMATCH/);
  assert.match(expired.errors.join(','), /CIVIC_EFFECT_PROPOSAL_EXPIRED/);
  assert.throws(() => throwV6CivicGovernancePreflightError(expired), /CIVIC_EFFECT_PROPOSAL_EXPIRED/);
}));

test('V6 effect preparation uses governance preflight before writing prepared actions', () => withStores((stores) => {
  stores.proposalStore.draftProposal(proposal(), { nowMs: 1_779_784_000_000 });

  assert.throws(
    () => stores.effectStore.prepareEffect(civicAction(), rollbackPlan(), { nowMs: 1_779_784_300_000 }),
    (err) => {
      assert.match(err.message, /CIVIC_EFFECT_MODERATION_REQUIRED/);
      assert.equal(err.details.preflight.version, V6_CIVIC_GOVERNANCE_PREFLIGHT_VERSION);
      assert.equal(stores.effectStore.count(), 0);
      return true;
    }
  );

  const decision = stores.moderationStore.recordDecision(moderationDecision(), { nowMs: 1_779_784_100_000 });
  stores.proposalStore.recordProposalReview(decision, { nowMs: 1_779_784_150_000 });
  stores.voteStore.recordVote(vote(), { nowMs: 1_779_784_200_000 });
  const prepared = stores.effectStore.prepareEffect(civicAction(), rollbackPlan(), { nowMs: 1_779_784_300_000 });

  assert.equal(prepared.actionId, 'action_governance_preflight_001');
  assert.equal(prepared.status, 'prepared');
  assert.equal(stores.effectStore.count(), 1);
}));
