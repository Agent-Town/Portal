const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CIVIC_SCHEMA_VERSION,
  CIVIC_ACTION_EFFECT_HANDLERS,
  validateAuditLedgerEntry,
  validateCivicAction,
  validateCivicDelegation,
  validateCivicInstitution,
  validateCivicProposal,
  validateCivicVote,
  validateModerationDecision,
  validateModerationReview,
  validatePublicWorksContribution,
  validateReputationDispute,
  validateReputationRecord,
  validateRollbackPlan,
  validateV6CivicSchema
} = require('../server/world_civilization/schemas');

const HASH_A = `sha256:${'a'.repeat(64)}`;
const HASH_B = `sha256:${'b'.repeat(64)}`;

function actor(overrides = {}) {
  return {
    kind: 'human',
    accountId: 'acct_v6_human_001',
    ...overrides
  };
}

function privacy(overrides = {}) {
  return {
    redacted: true,
    privateDataIncluded: false,
    dataClasses: ['public_profile', 'public_world_state'],
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

function proposal(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    proposalId: 'proposal_public_works_bridge_001',
    proposer: actor(),
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
    privacy: privacy(),
    ...overrides
  };
}

function vote(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    voteId: 'vote_bridge_approval_001',
    proposalId: 'proposal_public_works_bridge_001',
    voter: actor(),
    choice: 'approve',
    authorization: {
      kind: 'wallet_session',
      subjectAccountId: 'acct_v6_human_001',
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

test('V6 proposal schema accepts bounded preview-only public civic proposals', () => {
  const result = validateCivicProposal(proposal());

  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(result.value.effectPreview.mutationMode, 'preview_only');
  assert.equal(result.value.privacy.privateDataIncluded, false);
  assert.equal(result.value.rollbackPlan.canRollback, true);
});

test('V6 proposal schema rejects hidden mutation and private-data leaks', () => {
  const result = validateCivicProposal(proposal({
    effectPreview: {
      effectType: 'public_works_accounting',
      mutationMode: 'apply_now',
      summary: 'Apply immediately.'
    },
    privacy: privacy({
      privateDataIncluded: true,
      dataClasses: ['public_profile', 'brain_transcript']
    }),
    debugTrace: {
      token: 'sk-test-secret-value'
    }
  }));

  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /preview_only/);
  assert.match(result.errors.join('\n'), /privateDataIncluded/);
  assert.match(result.errors.join('\n'), /private data forbidden/);
});

test('V6 vote schema requires verified voter authorization and one receipt path', () => {
  const valid = validateCivicVote(vote());
  assert.equal(valid.ok, true, valid.errors.join('\n'));

  const forged = validateCivicVote(vote({
    authorization: {
      kind: 'wallet_session',
      subjectAccountId: 'acct_attacker_001',
      serverVerified: true
    }
  }));
  assert.equal(forged.ok, false);
  assert.match(forged.errors.join('\n'), /must match voter/);

  const unverified = validateCivicVote(vote({
    authorization: {
      kind: 'wallet_session',
      subjectAccountId: 'acct_v6_human_001',
      serverVerified: false
    }
  }));
  assert.equal(unverified.ok, false);
  assert.match(unverified.errors.join('\n'), /serverVerified/);
});

test('V6 delegation schema stays scoped, expiring, revocable, and explicit', () => {
  const valid = validateCivicDelegation({
    schemaVersion: CIVIC_SCHEMA_VERSION,
    delegationId: 'delegation_vote_advice_001',
    principalAccountId: 'acct_v6_human_001',
    delegateAgentId: 'agent_civic_clover_001',
    scope: 'vote_advice',
    expiresAtMs: 4_102_444_800_000,
    maxActions: 3,
    approvalReceiptId: 'receipt_delegate_vote_advice_001',
    revocable: true,
    canExecuteCivicEffects: false
  });
  assert.equal(valid.ok, true, valid.errors.join('\n'));

  const unsafe = validateCivicDelegation({
    schemaVersion: CIVIC_SCHEMA_VERSION,
    delegationId: 'delegation_vote_advice_002',
    principalAccountId: 'acct_v6_human_001',
    delegateAgentId: 'agent_civic_clover_001',
    scope: 'vote_advice',
    expiresAtMs: 4_102_444_800_000,
    maxActions: 3,
    approvalReceiptId: 'receipt_delegate_vote_advice_002',
    revocable: false,
    canExecuteCivicEffects: true
  });
  assert.equal(unsafe.ok, false);
  assert.match(unsafe.errors.join('\n'), /revocable/);
  assert.match(unsafe.errors.join('\n'), /civic_execution/);
});

test('V6 institution schema requires human-chartered public governance boundaries', () => {
  const valid = validateCivicInstitution({
    schemaVersion: CIVIC_SCHEMA_VERSION,
    institutionId: 'institution_bridge_council_001',
    charterId: 'charter_bridge_council_001',
    charteredBy: actor(),
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
    privacy: privacy({
      dataClasses: ['public_audit_summary', 'public_world_state']
    })
  });
  assert.equal(valid.ok, true, valid.errors.join('\n'));

  const unsafe = validateCivicInstitution({
    schemaVersion: CIVIC_SCHEMA_VERSION,
    institutionId: 'institution_agent_secret_001',
    charterId: 'charter_agent_secret_001',
    charteredBy: {
      kind: 'agent',
      accountId: 'acct_v6_human_001',
      agentId: 'agent_civic_clover_001'
    },
    displayName: 'Secret Council',
    purpose: 'Unsafe private charter.',
    scope: {
      kind: 'public_works',
      targetId: 'district_great_ridge'
    },
    proposalTypes: ['private_town'],
    membershipRuleId: 'rule_bridge_members_001',
    eligibilityRuleId: 'rule_bridge_voters_001',
    moderationPolicyId: 'policy_v6_public_001',
    votingRuleId: 'rule_bridge_majority_001',
    publicAuditSummary: 'Unsafe charter.',
    effectiveAtMs: 1_779_784_000_000,
    privacy: privacy(),
    debugTrace: {
      token: 'sk-test-secret-value'
    }
  });
  assert.equal(unsafe.ok, false);
  assert.match(unsafe.errors.join('\n'), /charteredBy.kind unsupported/);
  assert.match(unsafe.errors.join('\n'), /proposalTypes unsupported/);
  assert.match(unsafe.errors.join('\n'), /private data forbidden/);
});

test('V6 public works contribution schema requires public bundles and redacted audit data', () => {
  const valid = validatePublicWorksContribution({
    schemaVersion: CIVIC_SCHEMA_VERSION,
    contributionId: 'contribution_bridge_001',
    institutionId: 'institution_bridge_council_001',
    projectId: 'publicworks_great_ridge_bridge_001',
    contributorAccountId: 'acct_v6_contributor_001',
    sourceRef: 'action_prepare_bridge_001',
    requestedBundle: { wood: 2, stone: 1, food: 0, coin: 5 },
    idempotencyKey: 'idem_public_works_bridge_001',
    publicSummary: 'Public works contribution toward the Great Ridge bridge.',
    privacy: privacy({
      dataClasses: ['public_audit_summary', 'public_world_state']
    })
  });
  assert.equal(valid.ok, true, valid.errors.join('\n'));

  const unsafe = validatePublicWorksContribution({
    schemaVersion: CIVIC_SCHEMA_VERSION,
    contributionId: 'contribution_bridge_private_001',
    institutionId: 'institution_bridge_council_001',
    projectId: 'publicworks_great_ridge_bridge_001',
    contributorAccountId: 'acct_v6_contributor_001',
    sourceRef: 'action_prepare_bridge_001',
    requestedBundle: { wood: 0, stone: 0, food: 0, coin: 0 },
    idempotencyKey: 'idem_public_works_bridge_private_001',
    publicSummary: 'Unsafe contribution.',
    privacy: privacy(),
    debugTrace: {
      token: 'sk-test-secret-value'
    }
  });
  assert.equal(unsafe.ok, false);
  assert.match(unsafe.errors.join('\n'), /requestedBundle/);
  assert.match(unsafe.errors.join('\n'), /private data forbidden/);
});

test('V6 reputation schema blocks self-awards and currency-like transfers', () => {
  const valid = validateReputationRecord({
    schemaVersion: CIVIC_SCHEMA_VERSION,
    recordId: 'reputation_service_quality_001',
    subjectAccountId: 'acct_service_provider_001',
    awardedByAccountId: 'acct_v6_human_001',
    kind: 'service_reliability',
    delta: 2,
    sourceRef: 'proposal_public_works_bridge_001',
    disputeStatus: 'none',
    auditLedgerEntryId: 'audit_reputation_001'
  });
  assert.equal(valid.ok, true, valid.errors.join('\n'));

  const selfAward = validateReputationRecord({
    schemaVersion: CIVIC_SCHEMA_VERSION,
    recordId: 'reputation_self_001',
    subjectAccountId: 'acct_service_provider_001',
    awardedByAccountId: 'acct_service_provider_001',
    kind: 'service_reliability',
    delta: 25,
    sourceRef: 'proposal_public_works_bridge_001',
    disputeStatus: 'none',
    auditLedgerEntryId: 'audit_reputation_002'
  });
  assert.equal(selfAward.ok, false);
  assert.match(selfAward.errors.join('\n'), /self-awarded/);
  assert.match(selfAward.errors.join('\n'), /delta invalid/);
});

test('V6 reputation dispute schema requires human review and public-safe evidence', () => {
  const valid = validateReputationDispute({
    schemaVersion: CIVIC_SCHEMA_VERSION,
    disputeId: 'repdispute_service_quality_001',
    recordId: 'reputation_service_quality_001',
    subjectAccountId: 'acct_service_provider_001',
    disputedBy: actor({ accountId: 'acct_v6_reviewer_001' }),
    status: 'opened',
    reviewerKind: 'system',
    moderationDecisionId: 'moderation_bridge_text_001',
    sourceRefs: ['moderation_bridge_text_001'],
    reasons: ['Open a bounded dispute lane before reputation affects civic advice.'],
    privacy: privacy({ dataClasses: ['public_audit_summary'] })
  });
  assert.equal(valid.ok, true, valid.errors.join('\n'));

  const unsafe = validateReputationDispute({
    schemaVersion: CIVIC_SCHEMA_VERSION,
    disputeId: 'repdispute_service_quality_002',
    recordId: 'reputation_service_quality_001',
    subjectAccountId: 'acct_service_provider_001',
    disputedBy: {
      kind: 'agent',
      accountId: 'acct_v6_reviewer_001',
      agentId: 'agent_civic_clover_001'
    },
    status: 'upheld',
    reviewerKind: 'system',
    moderationDecisionId: 'moderation_bridge_text_001',
    sourceRefs: ['moderation_bridge_text_001'],
    reasons: ['Contains oauth token for debugging.'],
    privacy: privacy({ privateDataIncluded: true })
  });
  assert.equal(unsafe.ok, false);
  assert.match(unsafe.errors.join('\n'), /disputedBy.kind unsupported/);
  assert.match(unsafe.errors.join('\n'), /reviewerKind must be human/);
  assert.match(unsafe.errors.join('\n'), /privateDataIncluded/);
  assert.match(unsafe.errors.join('\n'), /private data forbidden/);
});

test('V6 moderation, action, rollback, and audit schemas require traceable safety handles', () => {
  const moderation = validateModerationDecision({
    schemaVersion: CIVIC_SCHEMA_VERSION,
    decisionId: 'moderation_bridge_text_001',
    subjectRef: 'proposal_public_works_bridge_001',
    surface: 'public_works',
    status: 'approved',
    policyVersion: 'policy_v6_public_001',
    reviewerKind: 'system',
    reasons: ['No private state or unsafe public text detected.'],
    redactedFields: []
  });
  assert.equal(moderation.ok, true, moderation.errors.join('\n'));

  const moderationReview = validateModerationReview({
    schemaVersion: CIVIC_SCHEMA_VERSION,
    reviewId: 'modreview_bridge_text_appeal_001',
    decisionId: 'moderation_bridge_text_001',
    subjectRef: 'proposal_public_works_bridge_001',
    surface: 'public_works',
    policyVersion: 'policy_v6_public_001',
    reviewType: 'appeal',
    status: 'escalated',
    requestedBy: actor(),
    reviewerKind: 'human',
    sourceRefs: ['public_report_bridge_text_001'],
    reasons: ['Public abuse report escalated this civic text for human review.'],
    privacy: privacy({ dataClasses: ['public_audit_summary'] })
  });
  assert.equal(moderationReview.ok, true, moderationReview.errors.join('\n'));

  const unsafeReview = validateModerationReview({
    schemaVersion: CIVIC_SCHEMA_VERSION,
    reviewId: 'modreview_bridge_text_appeal_002',
    decisionId: 'moderation_bridge_text_001',
    subjectRef: 'proposal_public_works_bridge_001',
    surface: 'public_works',
    policyVersion: 'policy_v6_public_001',
    reviewType: 'appeal',
    status: 'queued',
    requestedBy: {
      kind: 'agent',
      accountId: 'acct_v6_human_001',
      agentId: 'agent_civic_clover_001'
    },
    reviewerKind: 'system',
    sourceRefs: ['public_report_bridge_text_002'],
    reasons: ['Contains sk-test-secret-value'],
    privacy: privacy({ privateDataIncluded: true })
  });
  assert.equal(unsafeReview.ok, false);
  assert.match(unsafeReview.errors.join('\n'), /requestedBy.kind unsupported/);
  assert.match(unsafeReview.errors.join('\n'), /reviewerKind must be human/);
  assert.match(unsafeReview.errors.join('\n'), /privateDataIncluded/);
  assert.match(unsafeReview.errors.join('\n'), /private data forbidden/);

  const rollback = validateRollbackPlan(rollbackPlan());
  assert.equal(rollback.ok, true, rollback.errors.join('\n'));
  assert.deepEqual(rollback.value.irreversibleEffects, []);

  const action = validateCivicAction({
    schemaVersion: CIVIC_SCHEMA_VERSION,
    actionId: 'action_apply_bridge_001',
    proposalId: 'proposal_public_works_bridge_001',
    effectType: 'public_works_accounting',
    executionAuthority: {
      kind: 'human_approved',
      receiptId: 'receipt_vote_bridge_001'
    },
    handlerName: 'et.civic.public_works.apply',
    beforeSummary: 'Bridge contribution total is 20 wood.',
    afterSummary: 'Bridge contribution total is 30 wood.',
    auditLedgerEntryId: 'audit_action_bridge_001',
    rollbackId: 'rollback_bridge_001',
    idempotencyKey: 'idem_action_bridge_001'
  });
  assert.equal(action.ok, true, action.errors.join('\n'));

  const audit = validateAuditLedgerEntry({
    schemaVersion: CIVIC_SCHEMA_VERSION,
    entryId: 'audit_action_bridge_001',
    actor: actor(),
    actionType: 'civic_action.applied',
    objectRef: 'action_apply_bridge_001',
    idempotencyKey: 'idem_action_bridge_001',
    beforeHash: HASH_A,
    afterHash: HASH_B,
    createdAtMs: 1_779_784_000_000,
    migrationVersion: 'v1',
    replayable: true,
    rollbackId: 'rollback_bridge_001',
    privacy: privacy({ dataClasses: ['public_audit_summary'] })
  });
  assert.equal(audit.ok, true, audit.errors.join('\n'));
});

test('V6 civic action schema enforces typed effect handler registry', () => {
  for (const [effectType, handlerName] of Object.entries(CIVIC_ACTION_EFFECT_HANDLERS)) {
    const action = validateCivicAction({
      schemaVersion: CIVIC_SCHEMA_VERSION,
      actionId: `action_${effectType}_typed_001`,
      proposalId: 'proposal_public_works_bridge_001',
      effectType,
      executionAuthority: {
        kind: 'human_approved',
        receiptId: 'receipt_vote_bridge_001'
      },
      handlerName,
      beforeSummary: 'Prepared effect has not changed public state.',
      afterSummary: 'Prepared effect remains non-executing until release gates close.',
      auditLedgerEntryId: `audit_${effectType}_typed_001`,
      rollbackId: `rollback_${effectType}_typed_001`,
      idempotencyKey: `idem_${effectType}_typed_001`
    });
    assert.equal(action.ok, true, action.errors.join('\n'));
    assert.equal(action.value.handlerName, handlerName);
  }

  const mismatch = validateCivicAction({
    schemaVersion: CIVIC_SCHEMA_VERSION,
    actionId: 'action_public_works_mismatch_001',
    proposalId: 'proposal_public_works_bridge_001',
    effectType: 'public_works_accounting',
    executionAuthority: {
      kind: 'human_approved',
      receiptId: 'receipt_vote_bridge_001'
    },
    handlerName: CIVIC_ACTION_EFFECT_HANDLERS.public_summary,
    beforeSummary: 'Bridge contribution total is 20 wood.',
    afterSummary: 'Prepared bridge accounting would set the total to 30 wood.',
    auditLedgerEntryId: 'audit_public_works_mismatch_001',
    rollbackId: 'rollback_public_works_mismatch_001',
    idempotencyKey: 'idem_public_works_mismatch_001'
  });
  assert.equal(mismatch.ok, false);
  assert.match(mismatch.errors.join('\n'), /handlerName must match effectType public_works_accounting/);
});

test('V6 civic schema dispatcher fails closed for unknown schemas', () => {
  assert.equal(validateV6CivicSchema('proposal', proposal()).ok, true);
  assert.equal(validateV6CivicSchema('institution', {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    institutionId: 'institution_bridge_council_001',
    charterId: 'charter_bridge_council_001',
    charteredBy: actor(),
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
    privacy: privacy({ dataClasses: ['public_audit_summary'] })
  }).ok, true);
  assert.equal(validateV6CivicSchema('publicWorksContribution', {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    contributionId: 'contribution_bridge_001',
    institutionId: 'institution_bridge_council_001',
    projectId: 'publicworks_great_ridge_bridge_001',
    contributorAccountId: 'acct_v6_contributor_001',
    sourceRef: 'action_prepare_bridge_001',
    requestedBundle: { wood: 1, stone: 0, food: 0, coin: 0 },
    idempotencyKey: 'idem_public_works_bridge_001',
    publicSummary: 'Public works contribution.',
    privacy: privacy({ dataClasses: ['public_audit_summary'] })
  }).ok, true);
  const unknown = validateV6CivicSchema('treasury', {});
  assert.equal(unknown.ok, false);
  assert.match(unknown.errors.join('\n'), /unknown civic schema kind/);
});
