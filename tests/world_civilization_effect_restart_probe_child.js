const { CIVIC_SCHEMA_VERSION } = require('../server/world_civilization/schemas');
const { createCivicAuditLedger } = require('../server/world_civilization/audit_ledger');
const { createCivicEffectStore } = require('../server/world_civilization/effects');
const { createCivicModerationStore } = require('../server/world_civilization/moderation');
const { createCivicProposalStore } = require('../server/world_civilization/proposals');
const { createCivicVoteStore } = require('../server/world_civilization/votes');
const {
  assertCivicReplayReconstructionSafe,
  reconstructCivicAuditReplayFromLedger
} = require('../server/world_civilization/replay_reconstruction');

const PROPOSAL_ID = 'proposal_restart_effect_bridge_001';
const VOTE_ID = 'vote_restart_effect_bridge_001';
const ACTION_ID = 'action_restart_effect_bridge_001';
const ROLLBACK_ID = 'rollback_restart_effect_bridge_001';

function rollbackPlan(overrides = {}) {
  return {
    planId: 'rollbackplan_restart_effect_bridge_001',
    strategy: 'Restore previous restart effect bridge accounting snapshot.',
    canRollback: true,
    irreversibleEffects: [],
    maxRollbackMs: 86_400_000,
    ...overrides
  };
}

function proposal(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    proposalId: PROPOSAL_ID,
    proposer: {
      kind: 'human',
      accountId: 'acct_v6_restart_effect_proposer_001'
    },
    scope: {
      kind: 'public_works',
      targetId: 'district_restart_effect_ridge'
    },
    affectedPublicState: ['public_works:restart_effect_bridge'],
    effectPreview: {
      effectType: 'public_works_accounting',
      mutationMode: 'preview_only',
      summary: 'Preview restart effect bridge accounting without applying it.'
    },
    moderationClass: 'public_works',
    expiresAtMs: 4_102_444_800_000,
    idempotencyKey: 'idem_restart_effect_proposal_001',
    rollbackPlan: rollbackPlan(),
    privacy: {
      redacted: true,
      privateDataIncluded: false,
      dataClasses: ['public_profile', 'public_world_state']
    },
    ...overrides
  };
}

function moderationDecision(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    decisionId: 'moderation_restart_effect_bridge_001',
    subjectRef: PROPOSAL_ID,
    surface: 'public_works',
    status: 'approved',
    policyVersion: 'policy_v6_restart_effect_public_001',
    reviewerKind: 'system',
    reasons: ['Restart effect bridge proposal is public-safe for preparation only.'],
    redactedFields: [],
    ...overrides
  };
}

function vote(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    voteId: VOTE_ID,
    proposalId: PROPOSAL_ID,
    voter: {
      kind: 'human',
      accountId: 'acct_v6_restart_effect_voter_001'
    },
    choice: 'approve',
    authorization: {
      kind: 'wallet_session',
      subjectAccountId: 'acct_v6_restart_effect_voter_001',
      serverVerified: true
    },
    eligibilityProof: {
      eligible: true,
      ruleId: 'rule_restart_effect_voter_001'
    },
    receiptId: 'receipt_restart_effect_vote_001',
    idempotencyKey: 'idem_restart_effect_vote_001',
    ...overrides
  };
}

function civicAction(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    actionId: ACTION_ID,
    proposalId: PROPOSAL_ID,
    effectType: 'public_works_accounting',
    executionAuthority: {
      kind: 'human_approved',
      receiptId: 'receipt_restart_effect_vote_001'
    },
    handlerName: 'et.civic.public_works.apply',
    beforeSummary: 'Restart effect bridge contribution total is unchanged.',
    afterSummary: 'Prepared accounting would update restart effect bridge totals.',
    auditLedgerEntryId: 'audit_action_restart_effect_bridge_001',
    rollbackId: ROLLBACK_ID,
    idempotencyKey: 'idem_restart_effect_action_001',
    ...overrides
  };
}

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function openStores({ auditPath, proposalPath, votePath, moderationPath, effectPath }) {
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
  return { auditLedger, effectStore, moderationStore, proposalStore, voteStore };
}

function closeStores({ auditLedger, effectStore, moderationStore, proposalStore, voteStore }) {
  effectStore.close();
  moderationStore.close();
  voteStore.close();
  proposalStore.close();
  auditLedger.close();
}

function snapshot({ auditLedger, effectStore, moderationStore, proposalStore, voteStore }) {
  const actionRow = effectStore.getAction(ACTION_ID);
  const rollbackRow = effectStore.getRollback(ROLLBACK_ID);
  const effectSummary = effectStore.summarizeProposalEffects(PROPOSAL_ID);
  const replayReport = reconstructCivicAuditReplayFromLedger(auditLedger, { pageSize: 1 });
  const replaySafety = assertCivicReplayReconstructionSafe(replayReport);
  return {
    auditCount: auditLedger.count(),
    proposalCount: proposalStore.count(),
    voteCount: voteStore.count(),
    moderationCount: moderationStore.count(),
    effectCount: effectStore.count(),
    rollbackCount: effectStore.listRollbacks().length,
    actionStatus: actionRow?.status || '',
    rollbackStatus: rollbackRow?.status || '',
    effectSummary,
    replayOk: replaySafety.ok,
    replayReport
  };
}

function main() {
  const mode = process.argv[2];
  const auditPath = process.argv[3];
  const proposalPath = process.argv[4];
  const votePath = process.argv[5];
  const moderationPath = process.argv[6];
  const effectPath = process.argv[7];
  if (!mode || !auditPath || !proposalPath || !votePath || !moderationPath || !effectPath) {
    throw new Error('EFFECT_RESTART_PROBE_ARGS_REQUIRED');
  }

  const stores = openStores({ auditPath, proposalPath, votePath, moderationPath, effectPath });
  try {
    if (mode === 'seed-prerequisites') {
      stores.proposalStore.draftProposal(proposal(), { nowMs: 1_779_786_000_000 });
      stores.moderationStore.recordDecision(moderationDecision(), { nowMs: 1_779_786_100_000 });
      stores.voteStore.recordVote(vote(), { nowMs: 1_779_786_200_000 });
      writeJson({
        ok: true,
        ...snapshot(stores)
      });
      return;
    }
    if (mode === 'prepare-effect') {
      const row = stores.effectStore.prepareEffect(civicAction(), rollbackPlan(), { nowMs: 1_779_786_300_000 });
      writeJson({
        ok: true,
        duplicate: row.duplicate === true,
        actionId: row.actionId,
        rollbackId: row.rollbackId,
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
    throw new Error(`EFFECT_RESTART_PROBE_UNKNOWN_MODE:${mode}`);
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
