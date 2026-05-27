const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { CIVIC_SCHEMA_VERSION } = require('../server/world_civilization/schemas');
const { createCivicAuditLedger } = require('../server/world_civilization/audit_ledger');
const { createCivicModerationStore } = require('../server/world_civilization/moderation');
const { createCivicProposalStore } = require('../server/world_civilization/proposals');
const { createCivicVoteStore } = require('../server/world_civilization/votes');
const {
  INSTITUTION_AMENDMENT_STATUS_RECORDED,
  INSTITUTION_STATUS_CHARTERED,
  createCivicInstitutionStore
} = require('../server/world_civilization/institutions');

function withTempInstitutionStore(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-institutions-'));
  const sqlitePath = path.join(dir, 'institutions.sqlite');
  const auditSqlitePath = path.join(dir, 'audit.sqlite');
  const auditLedger = createCivicAuditLedger({ sqlitePath: auditSqlitePath });
  const store = createCivicInstitutionStore({ sqlitePath, auditLedger });
  try {
    return fn({ auditLedger, auditSqlitePath, sqlitePath, store });
  } finally {
    store.close();
    auditLedger.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function withTempGovernedInstitutionStore(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-institutions-governed-'));
  const auditSqlitePath = path.join(dir, 'audit.sqlite');
  const institutionPath = path.join(dir, 'institutions.sqlite');
  const moderationPath = path.join(dir, 'moderation.sqlite');
  const proposalPath = path.join(dir, 'proposals.sqlite');
  const votePath = path.join(dir, 'votes.sqlite');
  const auditLedger = createCivicAuditLedger({ sqlitePath: auditSqlitePath });
  const proposalStore = createCivicProposalStore({ sqlitePath: proposalPath, auditLedger });
  const voteStore = createCivicVoteStore({ sqlitePath: votePath, proposalStore, auditLedger });
  const moderationStore = createCivicModerationStore({ sqlitePath: moderationPath, auditLedger });
  const store = createCivicInstitutionStore({
    sqlitePath: institutionPath,
    auditLedger,
    proposalStore,
    voteStore,
    moderationStore
  });
  try {
    return fn({ auditLedger, moderationStore, proposalStore, store, voteStore });
  } finally {
    store.close();
    moderationStore.close();
    voteStore.close();
    proposalStore.close();
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
    proposalTypes: ['public_works', 'public_world'],
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
    planId: 'rollbackplan_bridge_charter_001',
    strategy: 'Keep the previous public charter as the active record.',
    canRollback: true,
    irreversibleEffects: [],
    maxRollbackMs: 86_400_000,
    ...overrides
  };
}

function charterProposal(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    proposalId: 'proposal_bridge_charter_update_001',
    proposer: {
      kind: 'human',
      accountId: 'acct_v6_human_001'
    },
    scope: {
      kind: 'institution_charter',
      targetId: 'institution_bridge_council_001'
    },
    affectedPublicState: ['institution:institution_bridge_council_001'],
    effectPreview: {
      effectType: 'charter_update',
      mutationMode: 'preview_only',
      summary: 'Preview a Bridge Council charter update without applying it.'
    },
    moderationClass: 'institution_charter',
    expiresAtMs: 4_102_444_800_000,
    idempotencyKey: 'idem_bridge_charter_update_proposal_001',
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
    decisionId: 'moderation_bridge_charter_update_001',
    subjectRef: 'proposal_bridge_charter_update_001',
    surface: 'institution_charter',
    status: 'approved',
    policyVersion: 'policy_v6_public_001',
    reviewerKind: 'system',
    reasons: ['No private state or unsafe public charter text detected.'],
    redactedFields: [],
    ...overrides
  };
}

function vote(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    voteId: 'vote_bridge_charter_update_001',
    proposalId: 'proposal_bridge_charter_update_001',
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
    receiptId: 'receipt_bridge_charter_update_001',
    idempotencyKey: 'idem_bridge_charter_update_vote_001',
    ...overrides
  };
}

function charterAmendment(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    amendmentId: 'charteramend_bridge_council_001',
    institutionId: 'institution_bridge_council_001',
    proposalId: 'proposal_bridge_charter_update_001',
    requestedBy: {
      kind: 'human',
      accountId: 'acct_v6_human_001'
    },
    approvalReceiptId: 'receipt_bridge_charter_update_001',
    newCharterId: 'charter_bridge_council_002',
    publicSummary: 'Record a proposed Bridge Council charter update for later release review.',
    effectiveAtMs: 1_779_784_100_000,
    idempotencyKey: 'idem_bridge_charter_amendment_001',
    privacy: {
      redacted: true,
      privateDataIncluded: false,
      dataClasses: ['public_audit_summary', 'public_world_state']
    },
    ...overrides
  };
}

function seedGovernedCharterAmendmentPrerequisites({ moderationStore, proposalStore, store, voteStore }) {
  store.charterInstitution(institution(), { nowMs: 1_779_784_000_000 });
  proposalStore.draftProposal(charterProposal(), { nowMs: 1_779_784_010_000 });
  moderationStore.recordDecision(moderationDecision(), { nowMs: 1_779_784_020_000 });
  voteStore.recordVote(vote(), { nowMs: 1_779_784_030_000 });
}

test('V6 institution store records chartered institutions without player-visible mechanics', () => withTempInstitutionStore(({ auditLedger, store }) => {
  const row = store.charterInstitution(institution(), { nowMs: 1_779_784_000_000 });
  const summary = store.summarizeScopeInstitutions('district_great_ridge');

  assert.equal(row.institutionId, 'institution_bridge_council_001');
  assert.equal(row.status, INSTITUTION_STATUS_CHARTERED);
  assert.equal(row.auditEntryId, 'audit_institution_bridge_council_001');
  assert.equal(row.scopeKind, 'public_works');
  assert.equal(summary.institutionCount, 1);
  assert.equal(summary.byScope.public_works.chartered, 1);
  assert.equal(summary.playerVisible, false);
  assert.equal(summary.executionStatus, 'not_executable');
  assert.equal(typeof store.applyCharter, 'undefined');
  assert.equal(typeof store.openInstitution, 'undefined');

  const audit = auditLedger.getByEntryId('audit_institution_bridge_council_001');
  assert.equal(audit.entry.actionType, 'institution.chartered');
  assert.equal(audit.entry.actor.accountId, 'acct_v6_human_001');
  assert.equal(audit.entry.objectRef, 'institution_bridge_council_001');
}));

test('V6 institution store is idempotent by institution and rejects duplicate scope charters', () => withTempInstitutionStore(({ auditLedger, store }) => {
  const first = store.charterInstitution(institution(), { nowMs: 1_779_784_000_000 });
  const duplicate = store.charterInstitution(institution(), { nowMs: 1_779_784_001_000 });

  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.institutionId, first.institutionId);
  assert.equal(store.count(), 1);
  assert.equal(auditLedger.count(), 1);
  assert.throws(
    () => store.charterInstitution(institution({
      displayName: 'Changed Bridge Council'
    }), { nowMs: 1_779_784_002_000 }),
    /CIVIC_INSTITUTION_ID_CONFLICT/
  );
  assert.throws(
    () => store.charterInstitution(institution({
      institutionId: 'institution_bridge_council_002'
    }), { nowMs: 1_779_784_003_000 }),
    /CIVIC_INSTITUTION_SCOPE_CHARTER_CONFLICT/
  );
  assert.equal(store.count(), 1);
  assert.equal(auditLedger.count(), 1);
}));

test('V6 institution store rejects unsupported charters and private data before persistence', () => withTempInstitutionStore(({ auditLedger, store }) => {
  assert.throws(
    () => store.charterInstitution(institution({
      institutionId: 'institution_agent_charter_001',
      charterId: 'charter_agent_charter_001',
      charteredBy: {
        kind: 'agent',
        accountId: 'acct_v6_human_001',
        agentId: 'agent_civic_clover_001'
      }
    }), { nowMs: 1_779_784_000_000 }),
    /CIVIC_INSTITUTION_INVALID/
  );
  assert.throws(
    () => store.charterInstitution(institution({
      institutionId: 'institution_bad_type_001',
      charterId: 'charter_bad_type_001',
      proposalTypes: ['public_works', 'private_town']
    }), { nowMs: 1_779_784_000_000 }),
    /CIVIC_INSTITUTION_INVALID/
  );
  assert.throws(
    () => store.charterInstitution(institution({
      institutionId: 'institution_private_trace_001',
      charterId: 'charter_private_trace_001',
      debugTrace: {
        token: 'sk-test-secret-value'
      }
    }), { nowMs: 1_779_784_000_000 }),
    /CIVIC_INSTITUTION_INVALID/
  );
  assert.equal(store.count(), 0);
  assert.equal(auditLedger.count(), 0);
}));

test('V6 institution store persists charters and supports scope replay indexes', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-institutions-persist-'));
  const sqlitePath = path.join(dir, 'institutions.sqlite');
  const auditSqlitePath = path.join(dir, 'audit.sqlite');
  try {
    const auditLedger = createCivicAuditLedger({ sqlitePath: auditSqlitePath });
    const store = createCivicInstitutionStore({ sqlitePath, auditLedger });
    store.charterInstitution(institution(), { nowMs: 1_779_784_000_000 });
    store.charterInstitution(institution({
      institutionId: 'institution_sandbox_council_001',
      charterId: 'charter_sandbox_council_001',
      displayName: 'Sandbox Council',
      purpose: 'Review controlled sandbox policies before public experiments.',
      scope: {
        kind: 'sandbox_policy',
        targetId: 'district_great_ridge'
      },
      proposalTypes: ['sandbox_policy'],
      membershipRuleId: 'rule_sandbox_members_001',
      eligibilityRuleId: 'rule_sandbox_voters_001',
      moderationPolicyId: 'policy_v6_sandbox_001',
      votingRuleId: 'rule_sandbox_majority_001',
      publicAuditSummary: 'Sandbox Council charter for controlled policy review.'
    }), { nowMs: 1_779_784_001_000 });
    store.close();
    auditLedger.close();

    const reopenedAudit = createCivicAuditLedger({ sqlitePath: auditSqlitePath });
    const reopened = createCivicInstitutionStore({ sqlitePath, auditLedger: reopenedAudit });
    assert.equal(reopened.count(), 2);
    assert.equal(reopened.getInstitution('institution_bridge_council_001').displayName, 'Bridge Council');
    assert.deepEqual(
      reopened.listInstitutions({ scopeTargetId: 'district_great_ridge' }).map((row) => row.institutionId),
      ['institution_bridge_council_001', 'institution_sandbox_council_001']
    );
    assert.deepEqual(
      reopened.listInstitutions({ scopeKind: 'sandbox_policy' }).map((row) => row.institutionId),
      ['institution_sandbox_council_001']
    );
    const summary = reopened.summarizeScopeInstitutions('district_great_ridge');
    assert.equal(summary.institutionCount, 2);
    assert.equal(summary.byScope.sandbox_policy.chartered, 1);
    assert.equal(reopenedAudit.replay({ objectRef: 'institution_sandbox_council_001' })[0].entry.actionType, 'institution.chartered');
    reopened.close();
    reopenedAudit.close();
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('V6 institution charter amendments require proposal vote and moderation evidence without applying charter', () => withTempGovernedInstitutionStore(({
  auditLedger,
  moderationStore,
  proposalStore,
  store,
  voteStore
}) => {
  seedGovernedCharterAmendmentPrerequisites({ moderationStore, proposalStore, store, voteStore });
  const row = store.recordCharterAmendment(charterAmendment(), { nowMs: 1_779_784_100_000 });
  const summary = store.summarizeInstitutionGovernance('institution_bridge_council_001');
  const activeInstitution = store.getInstitution('institution_bridge_council_001');

  assert.equal(row.amendmentId, 'charteramend_bridge_council_001');
  assert.equal(row.status, INSTITUTION_AMENDMENT_STATUS_RECORDED);
  assert.equal(row.auditEntryId, 'audit_charteramend_bridge_council_001');
  assert.equal(row.newCharterId, 'charter_bridge_council_002');
  assert.equal(activeInstitution.charterId, 'charter_bridge_council_001');
  assert.equal(summary.amendmentCount, 1);
  assert.equal(summary.amendmentsByStatus.recorded, 1);
  assert.equal(summary.latestAmendmentId, 'charteramend_bridge_council_001');
  assert.equal(summary.appliesCharterChanges, false);
  assert.equal(summary.executionStatus, 'not_executable');
  assert.equal(typeof store.applyCharterAmendment, 'undefined');

  const audit = auditLedger.getByEntryId('audit_charteramend_bridge_council_001');
  assert.equal(audit.entry.actionType, 'institution.charter_amendment.recorded');
  assert.equal(audit.entry.actor.accountId, 'acct_v6_voter_001');
  assert.deepEqual(
    auditLedger.replay().map((entry) => entry.entry.actionType),
    [
      'institution.chartered',
      'proposal.created',
      'moderation.decided',
      'vote.recorded',
      'institution.charter_amendment.recorded'
    ]
  );
}));

test('V6 institution charter amendments enforce idempotency and governance prerequisites', () => withTempGovernedInstitutionStore(({
  moderationStore,
  proposalStore,
  store,
  voteStore
}) => {
  assert.throws(
    () => store.recordCharterAmendment(charterAmendment(), { nowMs: 1_779_784_100_000 }),
    /CIVIC_INSTITUTION_AMENDMENT_INSTITUTION_REQUIRED/
  );
  store.charterInstitution(institution(), { nowMs: 1_779_784_000_000 });
  assert.throws(
    () => store.recordCharterAmendment(charterAmendment(), { nowMs: 1_779_784_100_000 }),
    /CIVIC_INSTITUTION_AMENDMENT_PROPOSAL_REQUIRED/
  );
  proposalStore.draftProposal(charterProposal(), { nowMs: 1_779_784_010_000 });
  assert.throws(
    () => store.recordCharterAmendment(charterAmendment(), { nowMs: 1_779_784_100_000 }),
    /CIVIC_INSTITUTION_AMENDMENT_MODERATION_REQUIRED/
  );
  moderationStore.recordDecision(moderationDecision(), { nowMs: 1_779_784_020_000 });
  assert.throws(
    () => store.recordCharterAmendment(charterAmendment(), { nowMs: 1_779_784_100_000 }),
    /CIVIC_INSTITUTION_AMENDMENT_APPROVAL_REQUIRED/
  );
  voteStore.recordVote(vote(), { nowMs: 1_779_784_030_000 });
  const first = store.recordCharterAmendment(charterAmendment(), { nowMs: 1_779_784_100_000 });
  const duplicate = store.recordCharterAmendment(charterAmendment(), { nowMs: 1_779_784_101_000 });
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.amendmentId, first.amendmentId);
  assert.equal(store.listCharterAmendments({ institutionId: 'institution_bridge_council_001' }).length, 1);
  assert.throws(
    () => store.recordCharterAmendment(charterAmendment({
      amendmentId: 'charteramend_bridge_council_conflict_001',
      newCharterId: 'charter_bridge_council_003'
    }), { nowMs: 1_779_784_102_000 }),
    /CIVIC_INSTITUTION_AMENDMENT_IDEMPOTENCY_CONFLICT/
  );
  assert.throws(
    () => store.recordCharterAmendment(charterAmendment({
      amendmentId: 'charteramend_bridge_council_private_001',
      idempotencyKey: 'idem_bridge_charter_amendment_private_001',
      debugTrace: {
        token: 'sk-test-secret-value'
      }
    }), { nowMs: 1_779_784_103_000 }),
    /CIVIC_INSTITUTION_AMENDMENT_INVALID/
  );
}));

test('V6 institution charter amendments reject wrong proposal scope effect state and receipt', () => withTempGovernedInstitutionStore(({
  moderationStore,
  proposalStore,
  store,
  voteStore
}) => {
  store.charterInstitution(institution(), { nowMs: 1_779_784_000_000 });
  proposalStore.draftProposal(charterProposal({
    proposalId: 'proposal_bridge_charter_wrong_scope_001',
    scope: {
      kind: 'public_works',
      targetId: 'district_great_ridge'
    },
    idempotencyKey: 'idem_bridge_charter_wrong_scope_001'
  }), { nowMs: 1_779_784_010_000 });
  moderationStore.recordDecision(moderationDecision({
    decisionId: 'moderation_bridge_charter_wrong_scope_001',
    subjectRef: 'proposal_bridge_charter_wrong_scope_001'
  }), { nowMs: 1_779_784_020_000 });
  voteStore.recordVote(vote({
    voteId: 'vote_bridge_charter_wrong_scope_001',
    proposalId: 'proposal_bridge_charter_wrong_scope_001',
    receiptId: 'receipt_bridge_charter_wrong_scope_001',
    idempotencyKey: 'idem_bridge_charter_wrong_scope_vote_001'
  }), { nowMs: 1_779_784_030_000 });
  assert.throws(
    () => store.recordCharterAmendment(charterAmendment({
      amendmentId: 'charteramend_bridge_wrong_scope_001',
      proposalId: 'proposal_bridge_charter_wrong_scope_001',
      approvalReceiptId: 'receipt_bridge_charter_wrong_scope_001',
      idempotencyKey: 'idem_bridge_wrong_scope_001'
    }), { nowMs: 1_779_784_100_000 }),
    /CIVIC_INSTITUTION_AMENDMENT_PROPOSAL_SCOPE_REQUIRED/
  );

  proposalStore.draftProposal(charterProposal({
    proposalId: 'proposal_bridge_charter_missing_state_001',
    affectedPublicState: ['institution:institution_other_001'],
    idempotencyKey: 'idem_bridge_charter_missing_state_001'
  }), { nowMs: 1_779_784_040_000 });
  moderationStore.recordDecision(moderationDecision({
    decisionId: 'moderation_bridge_charter_missing_state_001',
    subjectRef: 'proposal_bridge_charter_missing_state_001'
  }), { nowMs: 1_779_784_050_000 });
  voteStore.recordVote(vote({
    voteId: 'vote_bridge_charter_missing_state_001',
    proposalId: 'proposal_bridge_charter_missing_state_001',
    voter: {
      kind: 'human',
      accountId: 'acct_v6_voter_002'
    },
    authorization: {
      kind: 'wallet_session',
      subjectAccountId: 'acct_v6_voter_002',
      serverVerified: true
    },
    receiptId: 'receipt_bridge_charter_missing_state_001',
    idempotencyKey: 'idem_bridge_charter_missing_state_vote_001'
  }), { nowMs: 1_779_784_060_000 });
  assert.throws(
    () => store.recordCharterAmendment(charterAmendment({
      amendmentId: 'charteramend_bridge_missing_state_001',
      proposalId: 'proposal_bridge_charter_missing_state_001',
      approvalReceiptId: 'receipt_bridge_charter_missing_state_001',
      idempotencyKey: 'idem_bridge_missing_state_001'
    }), { nowMs: 1_779_784_100_000 }),
    /CIVIC_INSTITUTION_AMENDMENT_AFFECTED_STATE_REQUIRED/
  );

  proposalStore.draftProposal(charterProposal(), { nowMs: 1_779_784_070_000 });
  moderationStore.recordDecision(moderationDecision(), { nowMs: 1_779_784_080_000 });
  voteStore.recordVote(vote(), { nowMs: 1_779_784_090_000 });
  assert.throws(
    () => store.recordCharterAmendment(charterAmendment({
      amendmentId: 'charteramend_bridge_missing_receipt_001',
      approvalReceiptId: 'receipt_missing_001',
      idempotencyKey: 'idem_bridge_missing_receipt_001'
    }), { nowMs: 1_779_784_100_000 }),
    /CIVIC_INSTITUTION_AMENDMENT_APPROVAL_RECEIPT_REQUIRED/
  );
  assert.equal(store.listCharterAmendments({ institutionId: 'institution_bridge_council_001' }).length, 0);
}));
