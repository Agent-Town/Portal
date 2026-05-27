const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { V6_WORLD_FEATURE_FLAG, parseWorldGridFeatureFlags } = require('../server/world_grid/feature_flags');
const { CIVIC_ACTION_EFFECT_HANDLERS, CIVIC_SCHEMA_VERSION } = require('../server/world_civilization/schemas');
const { createCivicAuditLedger } = require('../server/world_civilization/audit_ledger');
const {
  EFFECT_STATUS_PREPARED,
  REQUIRED_EFFECT_EXECUTION_CHECKS,
  REQUIRED_EFFECT_EXECUTION_EVIDENCE_CHECKS,
  ROLLBACK_STATUS_AVAILABLE,
  V6_CIVIC_EFFECT_EXECUTION_GATE_VERSION,
  assertV6CivicEffectExecutionGateSafe,
  buildV6CivicEffectExecutionGate,
  createCivicEffectStore
} = require('../server/world_civilization/effects');
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

function effectExecutionEvidence(overrides = {}) {
  return {
    status: 'complete',
    executionStatus: 'not_executable',
    runtimeExposed: false,
    playerVisible: false,
    appliesWorldState: false,
    checks: [...REQUIRED_EFFECT_EXECUTION_EVIDENCE_CHECKS],
    applyHandlers: Object.values(CIVIC_ACTION_EFFECT_HANDLERS),
    rollbackHandlers: Object.values(CIVIC_ACTION_EFFECT_HANDLERS).map((handlerName) => handlerName.replace(/\.apply$/, '.rollback')),
    ...overrides
  };
}

function seedApprovedProposal({ moderationStore, proposalStore, voteStore }) {
  proposalStore.draftProposal(proposal(), { nowMs: 1_779_784_000_000 });
  const decision = moderationStore.recordDecision(moderationDecision(), { nowMs: 1_779_784_100_000 });
  proposalStore.recordProposalReview(decision, { nowMs: 1_779_784_150_000 });
  voteStore.recordVote(vote(), { nowMs: 1_779_784_200_000 });
}

test('V6 civic effect execution gate is hidden without explicit research opt-in and V6 flag', () => {
  const noResearchOptIn = buildV6CivicEffectExecutionGate({
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence: effectExecutionEvidence()
  });
  const broadV5Override = buildV6CivicEffectExecutionGate({
    includeResearchExecutionGate: true,
    featureFlags: parseWorldGridFeatureFlags('all'),
    evidence: effectExecutionEvidence()
  });

  for (const report of [noResearchOptIn, broadV5Override]) {
    assert.equal(report.version, V6_CIVIC_EFFECT_EXECUTION_GATE_VERSION);
    assert.equal(report.available, false);
    assert.equal(report.researchReady, false);
    assert.equal(report.releaseReady, false);
    assert.equal(report.failClosed, true);
    assert.equal(report.runtimeExposed, false);
    assert.equal(report.playerVisible, false);
    assert.equal(report.appliesWorldState, false);
    assert.equal(report.executionStatus, 'not_executable');
    assert.deepEqual(assertV6CivicEffectExecutionGateSafe(report), { ok: true, errors: [] });
  }
});

test('V6 civic effect execution gate records typed handler rollback and conservation evidence without execution', () => {
  const report = buildV6CivicEffectExecutionGate({
    includeResearchExecutionGate: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    source: 'node_test',
    evidence: effectExecutionEvidence()
  });

  assert.equal(report.available, true);
  assert.equal(report.researchReady, true);
  assert.equal(report.releaseReady, false);
  assert.equal(report.failClosed, false);
  assert.equal(report.runtimeExposed, false);
  assert.equal(report.playerVisible, false);
  assert.equal(report.appliesWorldState, false);
  assert.equal(report.executionStatus, 'not_executable');
  assert.deepEqual(report.checks.map((entry) => entry.key), REQUIRED_EFFECT_EXECUTION_CHECKS);
  assert.deepEqual(report.evidence.requiredChecks, REQUIRED_EFFECT_EXECUTION_EVIDENCE_CHECKS);
  assert.deepEqual(report.evidence.missingChecks, []);
  assert.deepEqual(report.evidence.requiredApplyHandlers, Object.values(CIVIC_ACTION_EFFECT_HANDLERS));
  assert.deepEqual(report.evidence.missingApplyHandlers, []);
  assert.deepEqual(report.evidence.missingRollbackHandlers, []);
  assert.deepEqual(assertV6CivicEffectExecutionGateSafe(report), { ok: true, errors: [] });
});

test('V6 civic effect execution gate fails closed without rollback handler and conservation evidence', () => {
  const report = buildV6CivicEffectExecutionGate({
    includeResearchExecutionGate: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence: effectExecutionEvidence({
      checks: ['real_before_after_state', 'authorization_enforced'],
      rollbackHandlers: []
    })
  });

  assert.equal(report.researchReady, false);
  assert.equal(report.releaseReady, false);
  assert.equal(report.failClosed, true);
  assert.deepEqual(report.evidence.missingChecks, [
    'idempotent_apply_rollback',
    'irreversible_action_review',
    'conservation_tests',
    'applied_and_rollback_audit',
    'worker_route_security'
  ]);
  assert.deepEqual(report.evidence.missingRollbackHandlers, Object.values(CIVIC_ACTION_EFFECT_HANDLERS).map((handlerName) => handlerName.replace(/\.apply$/, '.rollback')));
  assert.match(report.errors.join(','), /EFFECT_EXECUTION_EVIDENCE_REQUIRED/);
  assert.match(report.errors.join(','), /EFFECT_ROLLBACK_HANDLER_EVIDENCE_REQUIRED/);
  assert.deepEqual(assertV6CivicEffectExecutionGateSafe(report), { ok: true, errors: [] });
});

test('V6 civic effect execution gate assertion rejects fake executable release readiness', () => {
  const report = buildV6CivicEffectExecutionGate({
    includeResearchExecutionGate: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence: effectExecutionEvidence()
  });
  const unsafe = {
    ...report,
    releaseReady: true,
    runtimeExposed: true,
    playerVisible: true,
    normalGameplayExposure: true,
    appliesWorldState: true,
    executionStatus: 'executes',
    evidence: {
      ...report.evidence,
      ok: false,
      runtimeExposed: true,
      playerVisible: true,
      appliesWorldState: true
    }
  };
  const result = assertV6CivicEffectExecutionGateSafe(unsafe);

  assert.equal(result.ok, false);
  assert.match(result.errors.join(','), /V6_CIVIC_EFFECT_EXECUTION_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_CIVIC_EFFECT_EXECUTION_PLAYER_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_CIVIC_EFFECT_EXECUTION_NORMAL_GAMEPLAY_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_CIVIC_EFFECT_EXECUTION_WORLD_MUTATION_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_CIVIC_EFFECT_EXECUTION_NON_EXECUTING_REQUIRED/);
  assert.match(result.errors.join(','), /V6_CIVIC_EFFECT_EXECUTION_RELEASE_READY_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_CIVIC_EFFECT_EXECUTION_EVIDENCE_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_CIVIC_EFFECT_EXECUTION_EVIDENCE_PLAYER_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_CIVIC_EFFECT_EXECUTION_EVIDENCE_WORLD_MUTATION_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_CIVIC_EFFECT_EXECUTION_READY_WITHOUT_EVIDENCE/);
});

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
