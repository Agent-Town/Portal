const { CIVIC_SCHEMA_VERSION } = require('../server/world_civilization/schemas');
const { createCivicAuditLedger } = require('../server/world_civilization/audit_ledger');
const { createCivicProposalStore } = require('../server/world_civilization/proposals');
const { createCivicVoteStore } = require('../server/world_civilization/votes');
const {
  assertCivicReplayReconstructionSafe,
  reconstructCivicAuditReplayFromLedger
} = require('../server/world_civilization/replay_reconstruction');

function proposal(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    proposalId: 'proposal_restart_bridge_001',
    proposer: {
      kind: 'human',
      accountId: 'acct_v6_restart_proposer_001'
    },
    scope: {
      kind: 'public_works',
      targetId: 'district_restart_ridge'
    },
    affectedPublicState: ['public_works:restart_bridge'],
    effectPreview: {
      effectType: 'public_works_accounting',
      mutationMode: 'preview_only',
      summary: 'Preview restart bridge accounting without applying it.'
    },
    moderationClass: 'public_works',
    expiresAtMs: 4_102_444_800_000,
    idempotencyKey: 'idem_restart_proposal_001',
    rollbackPlan: {
      planId: 'rollbackplan_restart_bridge_001',
      strategy: 'Restore previous restart bridge accounting snapshot.',
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
    voteId: 'vote_restart_bridge_approval_001',
    proposalId: 'proposal_restart_bridge_001',
    voter: {
      kind: 'human',
      accountId: 'acct_v6_restart_voter_001'
    },
    choice: 'approve',
    authorization: {
      kind: 'wallet_session',
      subjectAccountId: 'acct_v6_restart_voter_001',
      serverVerified: true
    },
    eligibilityProof: {
      eligible: true,
      ruleId: 'rule_restart_voter_001'
    },
    receiptId: 'receipt_restart_vote_001',
    idempotencyKey: 'idem_restart_vote_001',
    ...overrides
  };
}

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function openStores({ auditPath, proposalPath, votePath = '' }) {
  const auditLedger = createCivicAuditLedger({ sqlitePath: auditPath });
  const proposalStore = createCivicProposalStore({ sqlitePath: proposalPath, auditLedger });
  const voteStore = votePath
    ? createCivicVoteStore({ sqlitePath: votePath, proposalStore, auditLedger })
    : null;
  return { auditLedger, proposalStore, voteStore };
}

function closeStores({ auditLedger, proposalStore, voteStore }) {
  if (voteStore) voteStore.close();
  proposalStore.close();
  auditLedger.close();
}

function snapshot({ auditLedger, proposalStore, voteStore }) {
  const proposalRow = proposalStore.getProposal('proposal_restart_bridge_001');
  const voteRow = voteStore?.getVote('vote_restart_bridge_approval_001') || null;
  const voteSummary = voteStore?.summarizeProposalVotes('proposal_restart_bridge_001') || null;
  const replayReport = reconstructCivicAuditReplayFromLedger(auditLedger, { pageSize: 1 });
  const replaySafety = assertCivicReplayReconstructionSafe(replayReport);
  return {
    auditCount: auditLedger.count(),
    proposalCount: proposalStore.count(),
    voteCount: voteStore?.count() || 0,
    proposalStatus: proposalRow?.status || '',
    proposalMutationMode: proposalRow?.proposal?.effectPreview?.mutationMode || '',
    voteChoice: voteRow?.choice || '',
    voteSummary,
    replayOk: replaySafety.ok,
    replayReport
  };
}

function main() {
  const mode = process.argv[2];
  const auditPath = process.argv[3];
  const proposalPath = process.argv[4];
  const votePath = process.argv[5];
  if (!mode || !auditPath || !proposalPath) throw new Error('PROPOSAL_VOTE_RESTART_PROBE_ARGS_REQUIRED');

  const stores = openStores({ auditPath, proposalPath, votePath });
  try {
    if (mode === 'seed-proposal') {
      const row = stores.proposalStore.draftProposal(proposal(), { nowMs: 1_779_784_000_000 });
      writeJson({
        ok: true,
        duplicate: row.duplicate === true,
        proposalId: row.proposalId,
        ...snapshot(stores)
      });
      return;
    }
    if (mode === 'record-vote') {
      const row = stores.voteStore.recordVote(vote(), { nowMs: 1_779_784_500_000 });
      writeJson({
        ok: true,
        duplicate: row.duplicate === true,
        voteId: row.voteId,
        ...snapshot(stores)
      });
      return;
    }
    if (mode === 'snapshot') {
      writeJson({
        ok: true,
        ...snapshot(stores)
      });
      return;
    }
    throw new Error(`PROPOSAL_VOTE_RESTART_PROBE_UNKNOWN_MODE:${mode}`);
  } finally {
    closeStores(stores);
  }
}

try {
  main();
} catch (err) {
  writeJson({
    ok: false,
    error: err.message
  });
  process.exitCode = 1;
}
