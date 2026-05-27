const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { CIVIC_SCHEMA_VERSION } = require('../server/world_civilization/schemas');
const { createCivicAuditLedger } = require('../server/world_civilization/audit_ledger');
const { createCivicInstitutionStore } = require('../server/world_civilization/institutions');
const { createCivicModerationStore } = require('../server/world_civilization/moderation');
const { createCivicProposalStore } = require('../server/world_civilization/proposals');
const { createCivicVoteStore } = require('../server/world_civilization/votes');
const {
  CONTRIBUTION_STATUS_RECORDED,
  PROJECT_STATUS_RECORDED,
  createCivicPublicWorksStore
} = require('../server/world_civilization/public_works');

function withTempPublicWorksStore(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-public-works-'));
  const auditPath = path.join(dir, 'audit.sqlite');
  const institutionPath = path.join(dir, 'institutions.sqlite');
  const publicWorksPath = path.join(dir, 'public_works.sqlite');
  const auditLedger = createCivicAuditLedger({ sqlitePath: auditPath });
  const institutionStore = createCivicInstitutionStore({ sqlitePath: institutionPath, auditLedger });
  const publicWorksStore = createCivicPublicWorksStore({
    sqlitePath: publicWorksPath,
    institutionStore,
    auditLedger
  });
  try {
    return fn({ auditLedger, auditPath, institutionPath, institutionStore, publicWorksPath, publicWorksStore });
  } finally {
    publicWorksStore.close();
    institutionStore.close();
    auditLedger.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function withTempGovernedPublicWorksStore(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-public-works-governed-'));
  const auditPath = path.join(dir, 'audit.sqlite');
  const institutionPath = path.join(dir, 'institutions.sqlite');
  const moderationPath = path.join(dir, 'moderation.sqlite');
  const proposalPath = path.join(dir, 'proposals.sqlite');
  const publicWorksPath = path.join(dir, 'public_works.sqlite');
  const votePath = path.join(dir, 'votes.sqlite');
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
  try {
    return fn({ auditLedger, institutionStore, moderationStore, proposalStore, publicWorksStore, voteStore });
  } finally {
    publicWorksStore.close();
    moderationStore.close();
    voteStore.close();
    proposalStore.close();
    institutionStore.close();
    auditLedger.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function institution(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    institutionId: 'institution_bridge_council_001',
    charterId: 'charter_bridge_council_001',
    charteredBy: {
      kind: 'human',
      accountId: 'acct_v6_human_001'
    },
    displayName: 'Bridge Council',
    purpose: 'Coordinate public works proposals for the Great Ridge district.',
    scope: {
      kind: 'public_works',
      targetId: 'district_great_ridge'
    },
    proposalTypes: ['public_works'],
    membershipRuleId: 'rule_bridge_members_001',
    eligibilityRuleId: 'rule_bridge_voters_001',
    moderationPolicyId: 'policy_v6_public_001',
    votingRuleId: 'rule_bridge_majority_001',
    publicAuditSummary: 'Bridge Council charter for public works coordination.',
    effectiveAtMs: 1_779_784_000_000,
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
    planId: 'rollbackplan_public_works_project_001',
    strategy: 'Keep the project absent and preserve contribution accounting.',
    canRollback: true,
    irreversibleEffects: [],
    maxRollbackMs: 86_400_000,
    ...overrides
  };
}

function projectProposal(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    proposalId: 'proposal_public_works_project_001',
    proposer: {
      kind: 'human',
      accountId: 'acct_v6_human_001'
    },
    scope: {
      kind: 'public_works',
      targetId: 'district_great_ridge'
    },
    affectedPublicState: ['public_works:publicworks_governed_bridge_001'],
    effectPreview: {
      effectType: 'public_works_accounting',
      mutationMode: 'preview_only',
      summary: 'Preview governed bridge project accounting without applying it.'
    },
    moderationClass: 'public_works',
    expiresAtMs: 4_102_444_800_000,
    idempotencyKey: 'idem_public_works_project_proposal_001',
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
    decisionId: 'moderation_public_works_project_001',
    subjectRef: 'proposal_public_works_project_001',
    surface: 'public_works',
    status: 'approved',
    policyVersion: 'policy_v6_public_001',
    reviewerKind: 'system',
    reasons: ['Governed public works project text is public-safe.'],
    redactedFields: [],
    ...overrides
  };
}

function vote(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    voteId: 'vote_public_works_project_001',
    proposalId: 'proposal_public_works_project_001',
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
      ruleId: 'rule_bridge_voters_001'
    },
    receiptId: 'receipt_public_works_project_001',
    idempotencyKey: 'idem_public_works_project_vote_001',
    ...overrides
  };
}

function publicWorksProject(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    projectId: 'publicworks_governed_bridge_001',
    institutionId: 'institution_bridge_council_001',
    proposalId: 'proposal_public_works_project_001',
    requestedBy: {
      kind: 'human',
      accountId: 'acct_v6_human_001'
    },
    approvalReceiptId: 'receipt_public_works_project_001',
    displayName: 'Governed Bridge Project',
    publicSummary: 'Record a governed bridge project for later public works integration.',
    goalBundle: { wood: 10, stone: 5, food: 0, coin: 20 },
    perContributionCap: { wood: 2, stone: 1, food: 0, coin: 5 },
    perContributorCap: { wood: 4, stone: 2, food: 0, coin: 10 },
    cosmeticRewardsOnly: true,
    idempotencyKey: 'idem_public_works_project_001',
    privacy: {
      redacted: true,
      privateDataIncluded: false,
      dataClasses: ['public_audit_summary', 'public_world_state']
    },
    ...overrides
  };
}

function contribution(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    contributionId: 'contribution_bridge_001',
    institutionId: 'institution_bridge_council_001',
    projectId: 'publicworks_great_ridge_bridge_001',
    contributorAccountId: 'acct_v6_contributor_001',
    sourceRef: 'action_prepare_bridge_001',
    requestedBundle: { wood: 10, stone: 2, food: 0, coin: 8 },
    idempotencyKey: 'idem_public_works_bridge_001',
    publicSummary: 'Public works contribution toward the Great Ridge bridge.',
    privacy: {
      redacted: true,
      privateDataIncluded: false,
      dataClasses: ['public_audit_summary', 'public_world_state']
    },
    ...overrides
  };
}

function seedBridgeInstitution(institutionStore) {
  institutionStore.charterInstitution(institution(), { nowMs: 1_779_784_000_000 });
}

function seedGovernedProjectPrerequisites({ institutionStore, moderationStore, proposalStore, voteStore }) {
  seedBridgeInstitution(institutionStore);
  proposalStore.draftProposal(projectProposal(), { nowMs: 1_779_784_010_000 });
  moderationStore.recordDecision(moderationDecision(), { nowMs: 1_779_784_020_000 });
  voteStore.recordVote(vote(), { nowMs: 1_779_784_030_000 });
}

test('V6 public works projects require proposal vote and moderation evidence before contributions', () => withTempGovernedPublicWorksStore(({
  auditLedger,
  institutionStore,
  moderationStore,
  proposalStore,
  publicWorksStore,
  voteStore
}) => {
  seedGovernedProjectPrerequisites({ institutionStore, moderationStore, proposalStore, voteStore });
  const project = publicWorksStore.recordProject(publicWorksProject(), { nowMs: 1_779_784_100_000 });
  const storedProject = publicWorksStore.getProject('publicworks_governed_bridge_001');
  const preContributionSummary = publicWorksStore.summarizeProject('publicworks_governed_bridge_001');

  assert.equal(project.projectId, 'publicworks_governed_bridge_001');
  assert.equal(project.status, PROJECT_STATUS_RECORDED);
  assert.equal(project.auditEntryId, 'audit_publicworks_governed_bridge_001');
  assert.equal(storedProject.source, 'recorded');
  assert.equal(storedProject.institutionScopeTargetId, 'district_great_ridge');
  assert.deepEqual(storedProject.goalBundle, { wood: 10, stone: 5, food: 0, coin: 20 });
  assert.equal(preContributionSummary.projectSource, 'recorded');
  assert.equal(preContributionSummary.projectStatus, PROJECT_STATUS_RECORDED);
  assert.equal(preContributionSummary.contributionCount, 0);
  assert.equal(preContributionSummary.mutatesPrivateTown, false);
  assert.equal(preContributionSummary.cosmeticRewardsOnly, true);
  assert.equal(preContributionSummary.executionStatus, 'not_executable');
  assert.equal(typeof publicWorksStore.openPublicContributionRoute, 'undefined');
  assert.equal(typeof publicWorksStore.spendPrivateInventory, 'undefined');
  assert.equal(typeof publicWorksStore.grantReward, 'undefined');

  const contributionRow = publicWorksStore.recordContribution(contribution({
    contributionId: 'contribution_governed_bridge_001',
    projectId: 'publicworks_governed_bridge_001',
    requestedBundle: { wood: 3, stone: 2, food: 0, coin: 6 },
    idempotencyKey: 'idem_governed_bridge_contribution_001'
  }), { nowMs: 1_779_784_110_000 });
  assert.deepEqual(contributionRow.acceptedBundle, { wood: 2, stone: 1, food: 0, coin: 5 });
  assert.equal(publicWorksStore.projectCount(), 1);
  assert.equal(publicWorksStore.count(), 1);
  assert.deepEqual(
    auditLedger.replay().map((entry) => entry.entry.actionType),
    [
      'institution.chartered',
      'proposal.created',
      'moderation.decided',
      'vote.recorded',
      'public_works.project.recorded',
      'public_works.contribution.recorded'
    ]
  );
  assert.equal(auditLedger.getByEntryId('audit_publicworks_governed_bridge_001').entry.actor.accountId, 'acct_v6_voter_001');
}));

test('V6 public works project records enforce idempotency and governance prerequisites', () => withTempGovernedPublicWorksStore(({
  institutionStore,
  moderationStore,
  proposalStore,
  publicWorksStore,
  voteStore
}) => {
  assert.throws(
    () => publicWorksStore.recordProject(publicWorksProject(), { nowMs: 1_779_784_100_000 }),
    /CIVIC_PUBLIC_WORKS_PROJECT_INSTITUTION_REQUIRED/
  );
  seedBridgeInstitution(institutionStore);
  assert.throws(
    () => publicWorksStore.recordProject(publicWorksProject(), { nowMs: 1_779_784_100_000 }),
    /CIVIC_PUBLIC_WORKS_PROJECT_PROPOSAL_REQUIRED/
  );
  proposalStore.draftProposal(projectProposal(), { nowMs: 1_779_784_010_000 });
  assert.throws(
    () => publicWorksStore.recordProject(publicWorksProject(), { nowMs: 1_779_784_100_000 }),
    /CIVIC_PUBLIC_WORKS_PROJECT_MODERATION_REQUIRED/
  );
  moderationStore.recordDecision(moderationDecision(), { nowMs: 1_779_784_020_000 });
  assert.throws(
    () => publicWorksStore.recordProject(publicWorksProject(), { nowMs: 1_779_784_100_000 }),
    /CIVIC_PUBLIC_WORKS_PROJECT_APPROVAL_REQUIRED/
  );
  voteStore.recordVote(vote(), { nowMs: 1_779_784_030_000 });
  const first = publicWorksStore.recordProject(publicWorksProject(), { nowMs: 1_779_784_100_000 });
  const duplicate = publicWorksStore.recordProject(publicWorksProject(), { nowMs: 1_779_784_101_000 });
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.projectId, first.projectId);
  assert.equal(publicWorksStore.listProjects({ institutionId: 'institution_bridge_council_001' }).length, 1);
  assert.throws(
    () => publicWorksStore.recordProject(publicWorksProject({
      projectId: 'publicworks_governed_bridge_conflict_001',
      displayName: 'Conflicting Bridge Project'
    }), { nowMs: 1_779_784_102_000 }),
    /CIVIC_PUBLIC_WORKS_PROJECT_IDEMPOTENCY_CONFLICT/
  );
  assert.throws(
    () => publicWorksStore.recordProject(publicWorksProject({
      projectId: 'publicworks_governed_bridge_private_001',
      idempotencyKey: 'idem_public_works_project_private_001',
      debugTrace: {
        token: 'sk-test-secret-value'
      }
    }), { nowMs: 1_779_784_103_000 }),
    /CIVIC_PUBLIC_WORKS_PROJECT_INVALID/
  );
}));

test('V6 public works project records reject wrong scope effect state and receipt', () => withTempGovernedPublicWorksStore(({
  institutionStore,
  moderationStore,
  proposalStore,
  publicWorksStore,
  voteStore
}) => {
  seedBridgeInstitution(institutionStore);
  proposalStore.draftProposal(projectProposal({
    proposalId: 'proposal_public_works_wrong_scope_001',
    scope: {
      kind: 'institution_charter',
      targetId: 'institution_bridge_council_001'
    },
    idempotencyKey: 'idem_public_works_wrong_scope_001'
  }), { nowMs: 1_779_784_010_000 });
  moderationStore.recordDecision(moderationDecision({
    decisionId: 'moderation_public_works_wrong_scope_001',
    subjectRef: 'proposal_public_works_wrong_scope_001',
    surface: 'public_works'
  }), { nowMs: 1_779_784_020_000 });
  voteStore.recordVote(vote({
    voteId: 'vote_public_works_wrong_scope_001',
    proposalId: 'proposal_public_works_wrong_scope_001',
    receiptId: 'receipt_public_works_wrong_scope_001',
    idempotencyKey: 'idem_public_works_wrong_scope_vote_001'
  }), { nowMs: 1_779_784_030_000 });
  assert.throws(
    () => publicWorksStore.recordProject(publicWorksProject({
      projectId: 'publicworks_wrong_scope_001',
      proposalId: 'proposal_public_works_wrong_scope_001',
      approvalReceiptId: 'receipt_public_works_wrong_scope_001',
      idempotencyKey: 'idem_public_works_project_wrong_scope_001'
    }), { nowMs: 1_779_784_100_000 }),
    /CIVIC_PUBLIC_WORKS_PROJECT_PROPOSAL_SCOPE_REQUIRED/
  );

  proposalStore.draftProposal(projectProposal({
    proposalId: 'proposal_public_works_missing_state_001',
    affectedPublicState: ['public_works:publicworks_other_001'],
    idempotencyKey: 'idem_public_works_missing_state_001'
  }), { nowMs: 1_779_784_040_000 });
  moderationStore.recordDecision(moderationDecision({
    decisionId: 'moderation_public_works_missing_state_001',
    subjectRef: 'proposal_public_works_missing_state_001'
  }), { nowMs: 1_779_784_050_000 });
  voteStore.recordVote(vote({
    voteId: 'vote_public_works_missing_state_001',
    proposalId: 'proposal_public_works_missing_state_001',
    voter: {
      kind: 'human',
      accountId: 'acct_v6_voter_002'
    },
    authorization: {
      kind: 'wallet_session',
      subjectAccountId: 'acct_v6_voter_002',
      serverVerified: true
    },
    receiptId: 'receipt_public_works_missing_state_001',
    idempotencyKey: 'idem_public_works_missing_state_vote_001'
  }), { nowMs: 1_779_784_060_000 });
  assert.throws(
    () => publicWorksStore.recordProject(publicWorksProject({
      projectId: 'publicworks_missing_state_001',
      proposalId: 'proposal_public_works_missing_state_001',
      approvalReceiptId: 'receipt_public_works_missing_state_001',
      idempotencyKey: 'idem_public_works_project_missing_state_001'
    }), { nowMs: 1_779_784_100_000 }),
    /CIVIC_PUBLIC_WORKS_PROJECT_AFFECTED_STATE_REQUIRED/
  );

  proposalStore.draftProposal(projectProposal(), { nowMs: 1_779_784_070_000 });
  moderationStore.recordDecision(moderationDecision(), { nowMs: 1_779_784_080_000 });
  voteStore.recordVote(vote(), { nowMs: 1_779_784_090_000 });
  assert.throws(
    () => publicWorksStore.recordProject(publicWorksProject({
      approvalReceiptId: 'receipt_missing_001',
      idempotencyKey: 'idem_public_works_project_missing_receipt_001'
    }), { nowMs: 1_779_784_100_000 }),
    /CIVIC_PUBLIC_WORKS_PROJECT_APPROVAL_RECEIPT_REQUIRED/
  );
  assert.equal(publicWorksStore.projectCount(), 0);
}));

test('V6 public works store records capped shared contributions without private mutation', () => withTempPublicWorksStore(({
  auditLedger,
  institutionStore,
  publicWorksStore
}) => {
  seedBridgeInstitution(institutionStore);
  const row = publicWorksStore.recordContribution(contribution(), { nowMs: 1_779_784_100_000 });
  const summary = publicWorksStore.summarizeProject('publicworks_great_ridge_bridge_001');

  assert.equal(row.contributionId, 'contribution_bridge_001');
  assert.equal(row.status, CONTRIBUTION_STATUS_RECORDED);
  assert.deepEqual(row.acceptedBundle, { wood: 2, stone: 1, food: 0, coin: 5 });
  assert.deepEqual(row.cappedBundle, { wood: 8, stone: 1, food: 0, coin: 3 });
  assert.equal(row.auditEntryId, 'audit_contribution_bridge_001');
  assert.equal(summary.contributionCount, 1);
  assert.equal(summary.contributorCount, 1);
  assert.deepEqual(summary.totalAccepted, { wood: 2, stone: 1, food: 0, coin: 5 });
  assert.equal(summary.resourceConservationStatus, 'accepted_inputs_equal_public_progress');
  assert.equal(summary.mutatesPrivateTown, false);
  assert.equal(summary.cosmeticRewardsOnly, true);
  assert.equal(summary.executionStatus, 'not_executable');
  assert.equal(typeof publicWorksStore.spendPrivateInventory, 'undefined');
  assert.equal(typeof publicWorksStore.grantReward, 'undefined');

  const audit = auditLedger.getByEntryId('audit_contribution_bridge_001');
  assert.equal(audit.entry.actionType, 'public_works.contribution.recorded');
  assert.equal(audit.entry.actor.accountId, 'acct_v6_contributor_001');
  assert.equal(audit.entry.objectRef, 'contribution_bridge_001');
}));

test('V6 public works store enforces idempotency and contributor caps', () => withTempPublicWorksStore(({
  institutionStore,
  publicWorksStore
}) => {
  seedBridgeInstitution(institutionStore);
  const first = publicWorksStore.recordContribution(contribution(), { nowMs: 1_779_784_100_000 });
  const duplicate = publicWorksStore.recordContribution(contribution(), { nowMs: 1_779_784_101_000 });

  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.contributionId, first.contributionId);
  assert.equal(publicWorksStore.count(), 1);
  assert.throws(
    () => publicWorksStore.recordContribution(contribution({
      contributionId: 'contribution_bridge_002',
      requestedBundle: { wood: 1, stone: 0, food: 0, coin: 0 }
    }), { nowMs: 1_779_784_102_000 }),
    /CIVIC_PUBLIC_WORKS_IDEMPOTENCY_CONFLICT/
  );

  publicWorksStore.recordContribution(contribution({
    contributionId: 'contribution_bridge_003',
    requestedBundle: { wood: 10, stone: 2, food: 0, coin: 10 },
    idempotencyKey: 'idem_public_works_bridge_003'
  }), { nowMs: 1_779_784_103_000 });
  publicWorksStore.recordContribution(contribution({
    contributionId: 'contribution_bridge_004',
    requestedBundle: { wood: 10, stone: 2, food: 0, coin: 10 },
    idempotencyKey: 'idem_public_works_bridge_004'
  }), { nowMs: 1_779_784_104_000 });
  assert.throws(
    () => publicWorksStore.recordContribution(contribution({
      contributionId: 'contribution_bridge_005',
      requestedBundle: { wood: 10, stone: 2, food: 0, coin: 10 },
      idempotencyKey: 'idem_public_works_bridge_005'
    }), { nowMs: 1_779_784_105_000 }),
    /CIVIC_PUBLIC_WORKS_CAP_EXCEEDED/
  );
  assert.deepEqual(
    publicWorksStore.summarizeProject('publicworks_great_ridge_bridge_001').totalAccepted,
    { wood: 6, stone: 3, food: 0, coin: 15 }
  );
}));

test('V6 public works store rejects missing institutions, wrong scopes, unknown projects, and private data', () => withTempPublicWorksStore(({
  auditLedger,
  institutionStore,
  publicWorksStore
}) => {
  assert.throws(
    () => publicWorksStore.recordContribution(contribution(), { nowMs: 1_779_784_100_000 }),
    /CIVIC_PUBLIC_WORKS_INSTITUTION_REQUIRED/
  );

  institutionStore.charterInstitution(institution({
    institutionId: 'institution_sandbox_council_001',
    charterId: 'charter_sandbox_council_001',
    displayName: 'Sandbox Council',
    purpose: 'Review controlled sandbox policies.',
    scope: {
      kind: 'sandbox_policy',
      targetId: 'district_great_ridge'
    },
    proposalTypes: ['sandbox_policy'],
    membershipRuleId: 'rule_sandbox_members_001',
    eligibilityRuleId: 'rule_sandbox_voters_001',
    moderationPolicyId: 'policy_v6_sandbox_001',
    votingRuleId: 'rule_sandbox_majority_001'
  }), { nowMs: 1_779_784_000_000 });
  assert.throws(
    () => publicWorksStore.recordContribution(contribution({
      contributionId: 'contribution_wrong_scope_001',
      institutionId: 'institution_sandbox_council_001'
    }), { nowMs: 1_779_784_100_000 }),
    /CIVIC_PUBLIC_WORKS_INSTITUTION_SCOPE_REQUIRED/
  );

  seedBridgeInstitution(institutionStore);
  assert.throws(
    () => publicWorksStore.recordContribution(contribution({
      contributionId: 'contribution_unknown_project_001',
      projectId: 'publicworks_unknown_001',
      idempotencyKey: 'idem_unknown_project_001'
    }), { nowMs: 1_779_784_100_000 }),
    /CIVIC_PUBLIC_WORKS_PROJECT_REQUIRED/
  );
  assert.throws(
    () => publicWorksStore.recordContribution(contribution({
      contributionId: 'contribution_private_trace_001',
      idempotencyKey: 'idem_private_trace_001',
      debugTrace: {
        token: 'sk-test-secret-value'
      }
    }), { nowMs: 1_779_784_100_000 }),
    /CIVIC_PUBLIC_WORKS_CONTRIBUTION_INVALID/
  );
  assert.equal(publicWorksStore.count(), 0);
  assert.equal(auditLedger.replay().filter((row) => row.entry.actionType === 'public_works.contribution.recorded').length, 0);
}));

test('V6 public works store persists contributions and supports replay indexes', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-public-works-persist-'));
  const auditPath = path.join(dir, 'audit.sqlite');
  const institutionPath = path.join(dir, 'institutions.sqlite');
  const publicWorksPath = path.join(dir, 'public_works.sqlite');
  try {
    const auditLedger = createCivicAuditLedger({ sqlitePath: auditPath });
    const institutionStore = createCivicInstitutionStore({ sqlitePath: institutionPath, auditLedger });
    const publicWorksStore = createCivicPublicWorksStore({
      sqlitePath: publicWorksPath,
      institutionStore,
      auditLedger
    });
    seedBridgeInstitution(institutionStore);
    publicWorksStore.recordContribution(contribution(), { nowMs: 1_779_784_100_000 });
    publicWorksStore.recordContribution(contribution({
      contributionId: 'contribution_bridge_other_001',
      contributorAccountId: 'acct_v6_contributor_002',
      requestedBundle: { wood: 1, stone: 1, food: 0, coin: 1 },
      idempotencyKey: 'idem_public_works_other_001'
    }), { nowMs: 1_779_784_101_000 });
    publicWorksStore.close();
    institutionStore.close();
    auditLedger.close();

    const reopenedAudit = createCivicAuditLedger({ sqlitePath: auditPath });
    const reopenedInstitutions = createCivicInstitutionStore({ sqlitePath: institutionPath, auditLedger: reopenedAudit });
    const reopened = createCivicPublicWorksStore({
      sqlitePath: publicWorksPath,
      institutionStore: reopenedInstitutions,
      auditLedger: reopenedAudit
    });
    assert.equal(reopened.count(), 2);
    assert.equal(reopened.getContribution('contribution_bridge_001').acceptedBundle.wood, 2);
    assert.deepEqual(
      reopened.listContributions({ projectId: 'publicworks_great_ridge_bridge_001' }).map((row) => row.contributionId),
      ['contribution_bridge_001', 'contribution_bridge_other_001']
    );
    assert.deepEqual(
      reopened.listContributions({ contributorAccountId: 'acct_v6_contributor_002' }).map((row) => row.contributionId),
      ['contribution_bridge_other_001']
    );
    const summary = reopened.summarizeProject('publicworks_great_ridge_bridge_001');
    assert.deepEqual(summary.totalAccepted, { wood: 3, stone: 2, food: 0, coin: 6 });
    assert.equal(reopenedAudit.replay({ objectRef: 'contribution_bridge_other_001' })[0].entry.actionType, 'public_works.contribution.recorded');
    reopened.close();
    reopenedInstitutions.close();
    reopenedAudit.close();
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
