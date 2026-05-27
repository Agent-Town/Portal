const { CIVIC_SCHEMA_VERSION } = require('../server/world_civilization/schemas');
const { createCivicAuditLedger } = require('../server/world_civilization/audit_ledger');
const { createCivicModerationStore } = require('../server/world_civilization/moderation');
const { createCivicProposalStore } = require('../server/world_civilization/proposals');
const { createCivicVoteStore } = require('../server/world_civilization/votes');
const { createCivicInstitutionStore } = require('../server/world_civilization/institutions');
const {
  assertCivicReplayReconstructionSafe,
  reconstructCivicAuditReplayFromLedger
} = require('../server/world_civilization/replay_reconstruction');

const SCOPE_TARGET_ID = 'district_restart_civic_ridge';
const PUBLIC_WORKS_INSTITUTION_ID = 'institution_restart_bridge_council_001';
const SANDBOX_INSTITUTION_ID = 'institution_restart_sandbox_council_001';
const CHARTER_PROPOSAL_ID = 'proposal_restart_bridge_charter_001';
const CHARTER_AMENDMENT_ID = 'charteramend_restart_bridge_council_001';

function publicWorksInstitution(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    institutionId: PUBLIC_WORKS_INSTITUTION_ID,
    charterId: 'charter_restart_bridge_council_001',
    charteredBy: {
      kind: 'human',
      accountId: 'acct_v6_restart_charterer_001'
    },
    displayName: 'Restart Bridge Council',
    purpose: 'Coordinate restart-safe public works proposals for a ridge district.',
    scope: {
      kind: 'public_works',
      targetId: SCOPE_TARGET_ID
    },
    proposalTypes: ['public_works', 'public_world'],
    membershipRuleId: 'rule_restart_bridge_members_001',
    eligibilityRuleId: 'rule_restart_bridge_voters_001',
    moderationPolicyId: 'policy_v6_restart_public_001',
    votingRuleId: 'rule_restart_bridge_majority_001',
    publicAuditSummary: 'Restart Bridge Council charter for public works coordination.',
    effectiveAtMs: 1_779_788_000_000,
    privacy: {
      redacted: true,
      privateDataIncluded: false,
      dataClasses: ['public_audit_summary', 'public_world_state']
    },
    ...overrides
  };
}

function sandboxInstitution(overrides = {}) {
  return publicWorksInstitution({
    institutionId: SANDBOX_INSTITUTION_ID,
    charterId: 'charter_restart_sandbox_council_001',
    displayName: 'Restart Sandbox Council',
    purpose: 'Review controlled sandbox policies before public experiments.',
    scope: {
      kind: 'sandbox_policy',
      targetId: SCOPE_TARGET_ID
    },
    proposalTypes: ['sandbox_policy'],
    membershipRuleId: 'rule_restart_sandbox_members_001',
    eligibilityRuleId: 'rule_restart_sandbox_voters_001',
    moderationPolicyId: 'policy_v6_restart_sandbox_001',
    votingRuleId: 'rule_restart_sandbox_majority_001',
    publicAuditSummary: 'Restart Sandbox Council charter for controlled policy review.',
    ...overrides
  });
}

function rollbackPlan(overrides = {}) {
  return {
    planId: 'rollbackplan_restart_bridge_charter_001',
    strategy: 'Keep the restart bridge council charter unchanged.',
    canRollback: true,
    irreversibleEffects: [],
    maxRollbackMs: 86_400_000,
    ...overrides
  };
}

function charterProposal(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    proposalId: CHARTER_PROPOSAL_ID,
    proposer: {
      kind: 'human',
      accountId: 'acct_v6_restart_charterer_001'
    },
    scope: {
      kind: 'institution_charter',
      targetId: PUBLIC_WORKS_INSTITUTION_ID
    },
    affectedPublicState: [`institution:${PUBLIC_WORKS_INSTITUTION_ID}`],
    effectPreview: {
      effectType: 'charter_update',
      mutationMode: 'preview_only',
      summary: 'Preview restart bridge council charter update without applying it.'
    },
    moderationClass: 'institution_charter',
    expiresAtMs: 4_102_444_800_000,
    idempotencyKey: 'idem_restart_bridge_charter_proposal_001',
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
    decisionId: 'moderation_restart_bridge_charter_001',
    subjectRef: CHARTER_PROPOSAL_ID,
    surface: 'institution_charter',
    status: 'approved',
    policyVersion: 'policy_v6_restart_public_001',
    reviewerKind: 'system',
    reasons: ['Restart charter amendment is public-safe and non-executing.'],
    redactedFields: [],
    ...overrides
  };
}

function vote(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    voteId: 'vote_restart_bridge_charter_001',
    proposalId: CHARTER_PROPOSAL_ID,
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
      ruleId: 'rule_restart_bridge_voters_001'
    },
    receiptId: 'receipt_restart_bridge_charter_vote_001',
    idempotencyKey: 'idem_restart_bridge_charter_vote_001',
    ...overrides
  };
}

function charterAmendment(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    amendmentId: CHARTER_AMENDMENT_ID,
    institutionId: PUBLIC_WORKS_INSTITUTION_ID,
    proposalId: CHARTER_PROPOSAL_ID,
    requestedBy: {
      kind: 'human',
      accountId: 'acct_v6_restart_charterer_001'
    },
    approvalReceiptId: 'receipt_restart_bridge_charter_vote_001',
    newCharterId: 'charter_restart_bridge_council_002',
    publicSummary: 'Record a restart bridge council charter update for later review.',
    effectiveAtMs: 1_779_788_200_000,
    idempotencyKey: 'idem_restart_bridge_charter_amendment_001',
    privacy: {
      redacted: true,
      privateDataIncluded: false,
      dataClasses: ['public_audit_summary', 'public_world_state']
    },
    ...overrides
  };
}

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function openStores({ auditPath, institutionPath, proposalPath, votePath, moderationPath }) {
  const auditLedger = createCivicAuditLedger({ sqlitePath: auditPath });
  const proposalStore = createCivicProposalStore({ sqlitePath: proposalPath, auditLedger });
  const voteStore = createCivicVoteStore({ sqlitePath: votePath, proposalStore, auditLedger });
  const moderationStore = createCivicModerationStore({ sqlitePath: moderationPath, auditLedger });
  const institutionStore = createCivicInstitutionStore({
    sqlitePath: institutionPath,
    auditLedger,
    proposalStore,
    voteStore,
    moderationStore
  });
  return { auditLedger, institutionStore, moderationStore, proposalStore, voteStore };
}

function closeStores({ auditLedger, institutionStore, moderationStore, proposalStore, voteStore }) {
  institutionStore.close();
  moderationStore.close();
  voteStore.close();
  proposalStore.close();
  auditLedger.close();
}

function snapshot({ auditLedger, institutionStore, moderationStore, proposalStore, voteStore }) {
  const summary = institutionStore.summarizeScopeInstitutions(SCOPE_TARGET_ID);
  const governanceSummary = institutionStore.summarizeInstitutionGovernance(PUBLIC_WORKS_INSTITUTION_ID);
  const replayReport = reconstructCivicAuditReplayFromLedger(auditLedger, { pageSize: 1 });
  const replaySafety = assertCivicReplayReconstructionSafe(replayReport);
  return {
    auditCount: auditLedger.count(),
    institutionCount: institutionStore.count(),
    amendmentCount: institutionStore.listCharterAmendments({ institutionId: PUBLIC_WORKS_INSTITUTION_ID }).length,
    proposalCount: proposalStore.count(),
    voteCount: voteStore.count(),
    moderationCount: moderationStore.count(),
    publicWorksCharterId: institutionStore.getInstitution(PUBLIC_WORKS_INSTITUTION_ID)?.charterId || '',
    publicWorksStatus: institutionStore.getInstitution(PUBLIC_WORKS_INSTITUTION_ID)?.status || '',
    sandboxStatus: institutionStore.getInstitution(SANDBOX_INSTITUTION_ID)?.status || '',
    institutionIds: institutionStore
      .listInstitutions({ scopeTargetId: SCOPE_TARGET_ID })
      .map((entry) => entry.institutionId),
    governanceSummary,
    summary,
    replayOk: replaySafety.ok,
    replayReport
  };
}

function main() {
  const mode = process.argv[2];
  const auditPath = process.argv[3];
  const institutionPath = process.argv[4];
  const proposalPath = process.argv[5];
  const votePath = process.argv[6];
  const moderationPath = process.argv[7];
  if (!mode || !auditPath || !institutionPath || !proposalPath || !votePath || !moderationPath) {
    throw new Error('INSTITUTION_RESTART_PROBE_ARGS_REQUIRED');
  }

  const stores = openStores({ auditPath, institutionPath, proposalPath, votePath, moderationPath });
  try {
    if (mode === 'seed-public-works') {
      const row = stores.institutionStore.charterInstitution(publicWorksInstitution(), { nowMs: 1_779_788_000_000 });
      writeJson({
        ok: true,
        duplicate: row.duplicate === true,
        institutionId: row.institutionId,
        ...snapshot(stores)
      });
      return;
    }
    if (mode === 'seed-amendment') {
      stores.proposalStore.draftProposal(charterProposal(), { nowMs: 1_779_788_010_000 });
      stores.moderationStore.recordDecision(moderationDecision(), { nowMs: 1_779_788_020_000 });
      stores.voteStore.recordVote(vote(), { nowMs: 1_779_788_030_000 });
      const row = stores.institutionStore.recordCharterAmendment(charterAmendment(), { nowMs: 1_779_788_200_000 });
      writeJson({
        ok: true,
        duplicate: row.duplicate === true,
        amendmentId: row.amendmentId,
        ...snapshot(stores)
      });
      return;
    }
    if (mode === 'seed-sandbox') {
      const row = stores.institutionStore.charterInstitution(sandboxInstitution(), { nowMs: 1_779_788_100_000 });
      writeJson({
        ok: true,
        duplicate: row.duplicate === true,
        institutionId: row.institutionId,
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
    throw new Error(`INSTITUTION_RESTART_PROBE_UNKNOWN_MODE:${mode}`);
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
