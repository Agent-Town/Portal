const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { CIVIC_SCHEMA_VERSION } = require('../server/world_civilization/schemas');
const { createCivicAuditLedger } = require('../server/world_civilization/audit_ledger');
const { createCivicProposalStore } = require('../server/world_civilization/proposals');
const { createCivicVoteStore } = require('../server/world_civilization/votes');

function withTempCivicStores(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-votes-'));
  const auditPath = path.join(dir, 'audit.sqlite');
  const proposalPath = path.join(dir, 'proposals.sqlite');
  const votePath = path.join(dir, 'votes.sqlite');
  const auditLedger = createCivicAuditLedger({ sqlitePath: auditPath });
  const proposalStore = createCivicProposalStore({ sqlitePath: proposalPath, auditLedger });
  const voteStore = createCivicVoteStore({ sqlitePath: votePath, proposalStore, auditLedger });
  try {
    return fn({ auditLedger, auditPath, proposalPath, proposalStore, votePath, voteStore });
  } finally {
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
    rollbackPlan: {
      planId: 'rollbackplan_public_works_001',
      strategy: 'Restore previous public works accounting snapshot.',
      canRollback: true,
      irreversibleEffects: [],
      maxRollbackMs: 86_400_000
    },
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

test('V6 vote store records authorized votes for existing proposals without execution', () => withTempCivicStores(({ auditLedger, proposalStore, voteStore }) => {
  proposalStore.draftProposal(proposal(), { nowMs: 1_779_784_000_000 });
  const recorded = voteStore.recordVote(vote(), { nowMs: 1_779_784_500_000 });

  assert.equal(recorded.voteId, 'vote_bridge_approval_001');
  assert.equal(recorded.auditEntryId, 'audit_vote_bridge_approval_001');
  assert.equal(voteStore.count(), 1);
  assert.equal(auditLedger.count(), 2);
  assert.deepEqual(auditLedger.replay().map((row) => row.entry.actionType), ['proposal.created', 'vote.recorded']);
  assert.deepEqual(voteStore.summarizeProposalVotes('proposal_public_works_bridge_001'), {
    proposalId: 'proposal_public_works_bridge_001',
    counts: { approve: 1, reject: 0, abstain: 0 },
    total: 1,
    executionStatus: 'not_executable'
  });
  assert.equal(typeof voteStore.applyVoteOutcome, 'undefined');
  assert.equal(typeof voteStore.executeProposal, 'undefined');
}));

test('V6 vote store enforces idempotency and one-vote accounting', () => withTempCivicStores(({ auditLedger, proposalStore, voteStore }) => {
  proposalStore.draftProposal(proposal(), { nowMs: 1_779_784_000_000 });
  const first = voteStore.recordVote(vote(), { nowMs: 1_779_784_500_000 });
  const duplicate = voteStore.recordVote(vote(), { nowMs: 1_779_784_600_000 });

  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.voteId, first.voteId);
  assert.equal(voteStore.count(), 1);
  assert.equal(auditLedger.count(), 2);
  assert.throws(
    () => voteStore.recordVote(vote({
      voteId: 'vote_bridge_reject_001',
      choice: 'reject'
    }), { nowMs: 1_779_784_700_000 }),
    /CIVIC_VOTE_IDEMPOTENCY_CONFLICT/
  );
  assert.throws(
    () => voteStore.recordVote(vote({
      voteId: 'vote_bridge_reject_002',
      choice: 'reject',
      receiptId: 'receipt_vote_bridge_002',
      idempotencyKey: 'idem_vote_bridge_002'
    }), { nowMs: 1_779_784_800_000 }),
    /CIVIC_VOTE_ALREADY_RECORDED/
  );
  assert.equal(voteStore.count(), 1);
  assert.equal(auditLedger.count(), 2);
}));

test('V6 vote store rejects forged, missing-proposal, and expired-proposal votes before persistence', () => withTempCivicStores(({ auditLedger, proposalStore, voteStore }) => {
  proposalStore.draftProposal(proposal(), { nowMs: 1_779_784_000_000 });
  assert.throws(
    () => voteStore.recordVote(vote({
      authorization: {
        kind: 'wallet_session',
        subjectAccountId: 'acct_attacker_001',
        serverVerified: true
      }
    }), { nowMs: 1_779_784_500_000 }),
    /CIVIC_VOTE_INVALID/
  );
  assert.throws(
    () => voteStore.recordVote(vote({
      voteId: 'vote_missing_proposal_001',
      proposalId: 'proposal_missing_001',
      receiptId: 'receipt_vote_missing_001',
      idempotencyKey: 'idem_vote_missing_001'
    }), { nowMs: 1_779_784_500_000 }),
    /CIVIC_VOTE_PROPOSAL_REQUIRED/
  );

  proposalStore.draftProposal(proposal({
    proposalId: 'proposal_public_works_short_001',
    idempotencyKey: 'idem_proposal_short_001',
    expiresAtMs: 2_500
  }), { nowMs: 2_000 });
  assert.throws(
    () => voteStore.recordVote(vote({
      voteId: 'vote_short_expired_001',
      proposalId: 'proposal_public_works_short_001',
      receiptId: 'receipt_vote_short_001',
      idempotencyKey: 'idem_vote_short_001'
    }), { nowMs: 3_000 }),
    /CIVIC_VOTE_PROPOSAL_EXPIRED/
  );
  assert.equal(voteStore.count(), 0);
  assert.equal(auditLedger.replay().filter((row) => row.entry.actionType === 'vote.recorded').length, 0);
}));

test('V6 vote store persists votes across reopen and supports proposal/voter replay', () => withTempCivicStores(({
  auditLedger,
  auditPath,
  proposalPath,
  proposalStore,
  votePath,
  voteStore
}) => {
  proposalStore.draftProposal(proposal(), { nowMs: 1_779_784_000_000 });
  voteStore.recordVote(vote(), { nowMs: 1_779_784_500_000 });
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
  try {
    assert.equal(reopenedVotes.count(), 1);
    assert.equal(reopenedVotes.getVote('vote_bridge_approval_001').choice, 'approve');
    assert.deepEqual(
      reopenedVotes.listVotes({ proposalId: 'proposal_public_works_bridge_001' }).map((entry) => entry.voteId),
      ['vote_bridge_approval_001']
    );
    assert.deepEqual(
      reopenedVotes.listVotes({ voterAccountId: 'acct_v6_voter_001' }).map((entry) => entry.voteId),
      ['vote_bridge_approval_001']
    );
    assert.equal(reopenedAudit.count(), 2);
  } finally {
    reopenedVotes.close();
    reopenedProposals.close();
    reopenedAudit.close();
  }
}));
