const { CIVIC_SCHEMA_VERSION } = require('../server/world_civilization/schemas');
const { createCivicAuditLedger } = require('../server/world_civilization/audit_ledger');
const { createCivicInstitutionStore } = require('../server/world_civilization/institutions');
const { createCivicModerationStore } = require('../server/world_civilization/moderation');
const { createCivicProposalStore } = require('../server/world_civilization/proposals');
const { createCivicPublicWorksStore } = require('../server/world_civilization/public_works');
const { createCivicVoteStore } = require('../server/world_civilization/votes');
const {
  assertCivicReplayReconstructionSafe,
  reconstructCivicAuditReplayFromLedger
} = require('../server/world_civilization/replay_reconstruction');

const INSTITUTION_ID = 'institution_restart_public_works_council_001';
const PROJECT_ID = 'publicworks_restart_bridge_001';
const PROPOSAL_ID = 'proposal_restart_public_works_project_001';

function institution(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    institutionId: INSTITUTION_ID,
    charterId: 'charter_restart_public_works_council_001',
    charteredBy: {
      kind: 'human',
      accountId: 'acct_v6_restart_public_works_charterer_001'
    },
    displayName: 'Restart Public Works Council',
    purpose: 'Coordinate restart-safe public works contribution accounting.',
    scope: {
      kind: 'public_works',
      targetId: 'district_restart_public_works_ridge'
    },
    proposalTypes: ['public_works'],
    membershipRuleId: 'rule_restart_public_works_members_001',
    eligibilityRuleId: 'rule_restart_public_works_voters_001',
    moderationPolicyId: 'policy_v6_restart_public_works_001',
    votingRuleId: 'rule_restart_public_works_majority_001',
    publicAuditSummary: 'Restart public works council charter for contribution accounting.',
    effectiveAtMs: 1_779_789_000_000,
    privacy: {
      redacted: true,
      privateDataIncluded: false,
      dataClasses: ['public_audit_summary', 'public_world_state']
    },
    ...overrides
  };
}

function rollbackPlan(overrides = {}) {
  return {
    planId: 'rollbackplan_restart_public_works_project_001',
    strategy: 'Keep the restart public works project absent.',
    canRollback: true,
    irreversibleEffects: [],
    maxRollbackMs: 86_400_000,
    ...overrides
  };
}

function projectProposal(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    proposalId: PROPOSAL_ID,
    proposer: {
      kind: 'human',
      accountId: 'acct_v6_restart_public_works_charterer_001'
    },
    scope: {
      kind: 'public_works',
      targetId: 'district_restart_public_works_ridge'
    },
    affectedPublicState: [`public_works:${PROJECT_ID}`],
    effectPreview: {
      effectType: 'public_works_accounting',
      mutationMode: 'preview_only',
      summary: 'Preview restart public works project accounting without applying it.'
    },
    moderationClass: 'public_works',
    expiresAtMs: 4_102_444_800_000,
    idempotencyKey: 'idem_restart_public_works_project_proposal_001',
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
    decisionId: 'moderation_restart_public_works_project_001',
    subjectRef: PROPOSAL_ID,
    surface: 'public_works',
    status: 'approved',
    policyVersion: 'policy_v6_restart_public_works_001',
    reviewerKind: 'system',
    reasons: ['Restart public works project record is public-safe and non-executing.'],
    redactedFields: [],
    ...overrides
  };
}

function vote(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    voteId: 'vote_restart_public_works_project_001',
    proposalId: PROPOSAL_ID,
    voter: {
      kind: 'human',
      accountId: 'acct_v6_restart_public_works_voter_001'
    },
    choice: 'approve',
    authorization: {
      kind: 'wallet_session',
      subjectAccountId: 'acct_v6_restart_public_works_voter_001',
      serverVerified: true
    },
    eligibilityProof: {
      eligible: true,
      ruleId: 'rule_restart_public_works_voters_001'
    },
    receiptId: 'receipt_restart_public_works_project_001',
    idempotencyKey: 'idem_restart_public_works_project_vote_001',
    ...overrides
  };
}

function publicWorksProject(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    projectId: PROJECT_ID,
    institutionId: INSTITUTION_ID,
    proposalId: PROPOSAL_ID,
    requestedBy: {
      kind: 'human',
      accountId: 'acct_v6_restart_public_works_charterer_001'
    },
    approvalReceiptId: 'receipt_restart_public_works_project_001',
    displayName: 'Restart Bridge Project',
    publicSummary: 'Record a restart-safe bridge project for later public works integration.',
    goalBundle: { wood: 8, stone: 4, food: 0, coin: 20 },
    perContributionCap: { wood: 2, stone: 1, food: 0, coin: 5 },
    perContributorCap: { wood: 4, stone: 2, food: 0, coin: 10 },
    cosmeticRewardsOnly: true,
    idempotencyKey: 'idem_restart_public_works_project_001',
    privacy: {
      redacted: true,
      privateDataIncluded: false,
      dataClasses: ['public_audit_summary', 'public_world_state']
    },
    ...overrides
  };
}

function contributionOne(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    contributionId: 'contribution_restart_bridge_001',
    institutionId: INSTITUTION_ID,
    projectId: PROJECT_ID,
    contributorAccountId: 'acct_v6_restart_contributor_001',
    sourceRef: 'action_restart_effect_bridge_001',
    requestedBundle: { wood: 10, stone: 2, food: 0, coin: 8 },
    idempotencyKey: 'idem_restart_public_works_bridge_001',
    publicSummary: 'Restart public works contribution toward the bridge.',
    privacy: {
      redacted: true,
      privateDataIncluded: false,
      dataClasses: ['public_audit_summary', 'public_world_state']
    },
    ...overrides
  };
}

function contributionTwo(overrides = {}) {
  return contributionOne({
    contributionId: 'contribution_restart_bridge_002',
    contributorAccountId: 'acct_v6_restart_contributor_002',
    requestedBundle: { wood: 1, stone: 1, food: 0, coin: 1 },
    idempotencyKey: 'idem_restart_public_works_bridge_002',
    publicSummary: 'Second restart public works contribution toward the bridge.',
    ...overrides
  });
}

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function openStores({ auditPath, institutionPath, publicWorksPath, proposalPath, votePath, moderationPath }) {
  const auditLedger = createCivicAuditLedger({ sqlitePath: auditPath });
  const institutionStore = createCivicInstitutionStore({ sqlitePath: institutionPath, auditLedger });
  const proposalStore = createCivicProposalStore({ sqlitePath: proposalPath, auditLedger });
  const voteStore = createCivicVoteStore({ sqlitePath: votePath, proposalStore, auditLedger });
  const moderationStore = createCivicModerationStore({ sqlitePath: moderationPath, auditLedger });
  const publicWorksStore = createCivicPublicWorksStore({
    sqlitePath: publicWorksPath,
    institutionStore,
    auditLedger,
    moderationStore,
    proposalStore,
    projects: [],
    voteStore
  });
  return { auditLedger, institutionStore, moderationStore, proposalStore, publicWorksStore, voteStore };
}

function closeStores({ auditLedger, institutionStore, moderationStore, proposalStore, publicWorksStore, voteStore }) {
  publicWorksStore.close();
  moderationStore.close();
  voteStore.close();
  proposalStore.close();
  institutionStore.close();
  auditLedger.close();
}

function snapshot({ auditLedger, institutionStore, moderationStore, proposalStore, publicWorksStore, voteStore }) {
  const summary = publicWorksStore.summarizeProject(PROJECT_ID);
  const replayReport = reconstructCivicAuditReplayFromLedger(auditLedger, { pageSize: 1 });
  const replaySafety = assertCivicReplayReconstructionSafe(replayReport);
  return {
    auditCount: auditLedger.count(),
    institutionCount: institutionStore.count(),
    projectCount: publicWorksStore.projectCount(),
    proposalCount: proposalStore.count(),
    voteCount: voteStore.count(),
    moderationCount: moderationStore.count(),
    contributionCount: publicWorksStore.count(),
    projectIds: publicWorksStore
      .listProjects({ institutionId: INSTITUTION_ID })
      .map((entry) => entry.projectId),
    contributionIds: publicWorksStore
      .listContributions({ projectId: PROJECT_ID })
      .map((entry) => entry.contributionId),
    summary,
    replayOk: replaySafety.ok,
    replayReport
  };
}

function main() {
  const mode = process.argv[2];
  const auditPath = process.argv[3];
  const institutionPath = process.argv[4];
  const publicWorksPath = process.argv[5];
  const proposalPath = process.argv[6];
  const votePath = process.argv[7];
  const moderationPath = process.argv[8];
  if (!mode || !auditPath || !institutionPath || !publicWorksPath || !proposalPath || !votePath || !moderationPath) {
    throw new Error('PUBLIC_WORKS_RESTART_PROBE_ARGS_REQUIRED');
  }

  const stores = openStores({ auditPath, institutionPath, publicWorksPath, proposalPath, votePath, moderationPath });
  try {
    if (mode === 'seed-institution') {
      const row = stores.institutionStore.charterInstitution(institution(), { nowMs: 1_779_789_000_000 });
      writeJson({
        ok: true,
        duplicate: row.duplicate === true,
        institutionId: row.institutionId,
        ...snapshot(stores)
      });
      return;
    }
    if (mode === 'seed-project') {
      stores.proposalStore.draftProposal(projectProposal(), { nowMs: 1_779_789_010_000 });
      stores.moderationStore.recordDecision(moderationDecision(), { nowMs: 1_779_789_020_000 });
      stores.voteStore.recordVote(vote(), { nowMs: 1_779_789_030_000 });
      const row = stores.publicWorksStore.recordProject(publicWorksProject(), { nowMs: 1_779_789_050_000 });
      writeJson({
        ok: true,
        duplicate: row.duplicate === true,
        projectId: row.projectId,
        ...snapshot(stores)
      });
      return;
    }
    if (mode === 'record-first') {
      const row = stores.publicWorksStore.recordContribution(contributionOne(), { nowMs: 1_779_789_100_000 });
      writeJson({
        ok: true,
        duplicate: row.duplicate === true,
        contributionId: row.contributionId,
        acceptedBundle: row.acceptedBundle,
        cappedBundle: row.cappedBundle,
        ...snapshot(stores)
      });
      return;
    }
    if (mode === 'record-second') {
      const row = stores.publicWorksStore.recordContribution(contributionTwo(), { nowMs: 1_779_789_200_000 });
      writeJson({
        ok: true,
        duplicate: row.duplicate === true,
        contributionId: row.contributionId,
        acceptedBundle: row.acceptedBundle,
        cappedBundle: row.cappedBundle,
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
    throw new Error(`PUBLIC_WORKS_RESTART_PROBE_UNKNOWN_MODE:${mode}`);
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
