const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { V6_WORLD_FEATURE_FLAG, parseWorldGridFeatureFlags } = require('../server/world_grid/feature_flags');
const { CIVIC_SCHEMA_VERSION } = require('../server/world_civilization/schemas');
const { createCivicAuditLedger } = require('../server/world_civilization/audit_ledger');
const { createCivicProposalStore } = require('../server/world_civilization/proposals');
const {
  DEFAULT_VOTE_APPROVAL_POLICY,
  REQUIRED_VOTE_AUTHORIZATION_EVIDENCE_CHECKS,
  REQUIRED_VOTE_AUTHORIZATION_READINESS_CHECKS,
  REQUIRED_VOTE_ROUTE_SURFACES,
  assertV6VoteAuthorizationReadinessGateSafe,
  buildV6VoteAuthorizationReadinessGate,
  createCivicVoteStore
} = require('../server/world_civilization/votes');

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

function voteReadinessEvidence(overrides = {}) {
  return {
    status: 'complete',
    executionStatus: 'not_executable',
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    mutatesWorldState: false,
    appliesVoteOutcome: false,
    exposesPrivateData: false,
    routeEdgeAuthReviewed: true,
    votingTemplatesReviewed: true,
    replayIdempotencyReviewed: true,
    governancePreflightReviewed: true,
    checks: [...REQUIRED_VOTE_AUTHORIZATION_EVIDENCE_CHECKS],
    routeSurfaces: [...REQUIRED_VOTE_ROUTE_SURFACES],
    ...overrides
  };
}

test('V6 vote authorization readiness gate is hidden without explicit research opt-in and V6 flag', () => {
  const withoutResearchOptIn = buildV6VoteAuthorizationReadinessGate({
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence: voteReadinessEvidence()
  });
  const broadV5Override = buildV6VoteAuthorizationReadinessGate({
    includeResearchVoteReadiness: true,
    featureFlags: parseWorldGridFeatureFlags('all'),
    evidence: voteReadinessEvidence()
  });

  for (const report of [withoutResearchOptIn, broadV5Override]) {
    assert.equal(report.available, false);
    assert.equal(report.researchReady, false);
    assert.equal(report.releaseReady, false);
    assert.equal(report.failClosed, true);
    assert.equal(report.runtimeExposed, false);
    assert.equal(report.playerVisible, false);
    assert.equal(report.normalGameplayExposure, false);
    assert.equal(report.mutatesWorldState, false);
    assert.equal(report.appliesVoteOutcome, false);
    assert.equal(report.exposesPrivateData, false);
    assert.deepEqual(report.checks, []);
    assert.deepEqual(assertV6VoteAuthorizationReadinessGateSafe(report), { ok: true, errors: [] });
  }
});

test('V6 vote authorization readiness gate records route template replay and preflight evidence without execution', () => {
  const report = buildV6VoteAuthorizationReadinessGate({
    includeResearchVoteReadiness: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    source: 'node_test',
    evidence: voteReadinessEvidence()
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
  assert.equal(report.appliesVoteOutcome, false);
  assert.equal(report.exposesPrivateData, false);
  assert.equal(report.executionStatus, 'not_executable');
  assert.deepEqual(report.checks.map((entry) => entry.key), REQUIRED_VOTE_AUTHORIZATION_READINESS_CHECKS);
  assert.deepEqual(report.evidence.missingChecks, []);
  assert.deepEqual(report.evidence.missingRouteSurfaces, []);
  assert.deepEqual(assertV6VoteAuthorizationReadinessGateSafe(report), { ok: true, errors: [] });
});

test('V6 vote authorization readiness gate fails closed without route auth template and replay evidence', () => {
  const report = buildV6VoteAuthorizationReadinessGate({
    includeResearchVoteReadiness: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence: voteReadinessEvidence({
      checks: REQUIRED_VOTE_AUTHORIZATION_EVIDENCE_CHECKS.filter((check) => (
        check !== 'route_edge_vote_auth'
        && check !== 'per_institution_voting_templates'
        && check !== 'idempotent_receipt_replay'
      )),
      routeSurfaces: REQUIRED_VOTE_ROUTE_SURFACES.filter((surface) => surface !== 'delegated_agent_vote_route'),
      routeEdgeAuthReviewed: false,
      votingTemplatesReviewed: false,
      replayIdempotencyReviewed: false
    })
  });

  assert.equal(report.researchReady, false);
  assert.equal(report.failClosed, true);
  assert.deepEqual(report.evidence.missingChecks, [
    'idempotent_receipt_replay',
    'per_institution_voting_templates',
    'route_edge_vote_auth'
  ]);
  assert.deepEqual(report.evidence.missingRouteSurfaces, ['delegated_agent_vote_route']);
  assert.deepEqual(report.errors, [
    'VOTE_AUTHORIZATION_EVIDENCE_REQUIRED',
    'VOTE_ROUTE_EDGE_AUTHORIZATION_REQUIRED',
    'VOTE_TEMPLATE_REVIEW_REQUIRED',
    'VOTE_REPLAY_IDEMPOTENCY_REQUIRED'
  ]);
  assert.deepEqual(assertV6VoteAuthorizationReadinessGateSafe(report), { ok: true, errors: [] });
});

test('V6 vote authorization readiness assertion rejects fake visible outcome-applying readiness', () => {
  const report = buildV6VoteAuthorizationReadinessGate({
    includeResearchVoteReadiness: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence: voteReadinessEvidence()
  });
  const unsafe = {
    ...report,
    runtimeExposed: true,
    playerVisible: true,
    normalGameplayExposure: true,
    mutatesWorldState: true,
    appliesVoteOutcome: true,
    exposesPrivateData: true,
    releaseReady: true,
    executionStatus: 'executes',
    evidence: {
      ...report.evidence,
      runtimeExposed: true,
      playerVisible: true,
      normalGameplayExposure: true,
      mutatesWorldState: true,
      appliesVoteOutcome: true,
      exposesPrivateData: true
    }
  };
  const result = assertV6VoteAuthorizationReadinessGateSafe(unsafe);

  assert.equal(result.ok, false);
  assert.match(result.errors.join(','), /V6_VOTE_AUTHORIZATION_READINESS_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_VOTE_AUTHORIZATION_READINESS_PLAYER_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_VOTE_AUTHORIZATION_READINESS_NORMAL_GAMEPLAY_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_VOTE_AUTHORIZATION_READINESS_WORLD_MUTATION_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_VOTE_AUTHORIZATION_READINESS_OUTCOME_APPLICATION_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_VOTE_AUTHORIZATION_READINESS_PRIVATE_DATA_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_VOTE_AUTHORIZATION_READINESS_NON_EXECUTING_REQUIRED/);
  assert.match(result.errors.join(','), /V6_VOTE_AUTHORIZATION_READINESS_RELEASE_READY_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_VOTE_AUTHORIZATION_READINESS_EVIDENCE_OUTCOME_APPLICATION_FORBIDDEN/);
});

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

test('V6 vote store evaluates explicit quorum and approval threshold policies without execution', () => withTempCivicStores(({ proposalStore, voteStore }) => {
  proposalStore.draftProposal(proposal(), { nowMs: 1_779_784_000_000 });
  voteStore.recordVote(vote(), { nowMs: 1_779_784_500_000 });

  assert.equal(voteStore.evaluateProposalApproval('proposal_public_works_bridge_001', DEFAULT_VOTE_APPROVAL_POLICY).ok, true);

  const unmetQuorum = voteStore.evaluateProposalApproval('proposal_public_works_bridge_001', {
    policyId: 'policy_v6_two_vote_quorum_001',
    quorumMinVotes: 2,
    minApproveVotes: 2,
    approvalThresholdBps: 6600
  });
  assert.equal(unmetQuorum.ok, false);
  assert.deepEqual(unmetQuorum.failures, ['quorum', 'min_approve']);

  voteStore.recordVote(vote({
    voteId: 'vote_bridge_approval_002',
    voter: {
      kind: 'human',
      accountId: 'acct_v6_voter_002'
    },
    authorization: {
      kind: 'wallet_session',
      subjectAccountId: 'acct_v6_voter_002',
      serverVerified: true
    },
    receiptId: 'receipt_vote_bridge_002',
    idempotencyKey: 'idem_vote_bridge_002'
  }), { nowMs: 1_779_784_600_000 });
  const metQuorum = voteStore.evaluateProposalApproval('proposal_public_works_bridge_001', {
    policyId: 'policy_v6_two_vote_quorum_001',
    quorumMinVotes: 2,
    minApproveVotes: 2,
    approvalThresholdBps: 6600
  });
  assert.equal(metQuorum.ok, true);
  assert.equal(metQuorum.approvalBps, 10_000);
  assert.equal(metQuorum.executionStatus, 'not_executable');

  voteStore.recordVote(vote({
    voteId: 'vote_bridge_reject_003',
    voter: {
      kind: 'human',
      accountId: 'acct_v6_voter_003'
    },
    choice: 'reject',
    authorization: {
      kind: 'wallet_session',
      subjectAccountId: 'acct_v6_voter_003',
      serverVerified: true
    },
    receiptId: 'receipt_vote_bridge_003',
    idempotencyKey: 'idem_vote_bridge_003'
  }), { nowMs: 1_779_784_700_000 });
  const unmetThreshold = voteStore.evaluateProposalApproval('proposal_public_works_bridge_001', {
    policyId: 'policy_v6_supermajority_001',
    quorumMinVotes: 3,
    minApproveVotes: 2,
    approvalThresholdBps: 7000
  });
  assert.equal(unmetThreshold.ok, false);
  assert.deepEqual(unmetThreshold.failures, ['approval_threshold']);
  assert.equal(unmetThreshold.approvalBps, 6666);

  proposalStore.draftProposal(proposal({
    proposalId: 'proposal_public_works_abstain_001',
    idempotencyKey: 'idem_proposal_abstain_001'
  }), { nowMs: 1_779_784_800_000 });
  voteStore.recordVote(vote({
    voteId: 'vote_bridge_abstain_004',
    proposalId: 'proposal_public_works_abstain_001',
    voter: {
      kind: 'human',
      accountId: 'acct_v6_voter_004'
    },
    choice: 'abstain',
    authorization: {
      kind: 'wallet_session',
      subjectAccountId: 'acct_v6_voter_004',
      serverVerified: true
    },
    receiptId: 'receipt_vote_bridge_004',
    idempotencyKey: 'idem_vote_bridge_004'
  }), { nowMs: 1_779_784_900_000 });
  const abstainCountsForQuorum = voteStore.evaluateProposalApproval('proposal_public_works_abstain_001', {
    policyId: 'policy_v6_abstain_quorum_001',
    quorumMinVotes: 1,
    minApproveVotes: 1,
    approvalThresholdBps: 5001,
    countAbstainForQuorum: true
  });
  const abstainDoesNotCountForQuorum = voteStore.evaluateProposalApproval('proposal_public_works_abstain_001', {
    policyId: 'policy_v6_abstain_quorum_002',
    quorumMinVotes: 1,
    minApproveVotes: 1,
    approvalThresholdBps: 5001,
    countAbstainForQuorum: false
  });
  assert.equal(abstainCountsForQuorum.failures.includes('quorum'), false);
  assert.equal(abstainDoesNotCountForQuorum.failures.includes('quorum'), true);
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
