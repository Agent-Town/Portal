const { validateCivicAction, validateRollbackPlan } = require('./schemas');
const { DEFAULT_VOTE_APPROVAL_POLICY, evaluateVoteApprovalPolicy } = require('./votes');

const V6_CIVIC_GOVERNANCE_PREFLIGHT_VERSION = 'agent-town.v6.civic.governance_preflight.v1';

const REQUIRED_GOVERNANCE_PREFLIGHT_CHECKS = [
  'action_schema',
  'rollback_schema',
  'proposal_exists',
  'rollback_plan_matches',
  'proposal_active',
  'effect_type_matches',
  'moderation_approved',
  'proposal_review_ready',
  'vote_approval',
  'vote_policy',
  'delegation_proof',
  'delegation_policy',
  'approval_receipt',
  'non_executing'
];

const CHECK_ERROR = {
  action_schema: 'CIVIC_EFFECT_ACTION_INVALID',
  rollback_schema: 'CIVIC_EFFECT_ROLLBACK_INVALID',
  proposal_exists: 'CIVIC_EFFECT_PROPOSAL_REQUIRED',
  proposal_review_ready: 'CIVIC_EFFECT_PROPOSAL_REVIEW_REQUIRED',
  rollback_plan_matches: 'CIVIC_EFFECT_ROLLBACK_PLAN_MISMATCH',
  proposal_active: 'CIVIC_EFFECT_PROPOSAL_EXPIRED',
  effect_type_matches: 'CIVIC_EFFECT_TYPE_MISMATCH',
  moderation_approved: 'CIVIC_EFFECT_MODERATION_REQUIRED',
  vote_approval: 'CIVIC_EFFECT_APPROVAL_REQUIRED',
  vote_policy: 'CIVIC_EFFECT_VOTE_POLICY_REQUIRED',
  delegation_proof: 'CIVIC_EFFECT_DELEGATION_PROOF_REQUIRED',
  delegation_policy: 'CIVIC_EFFECT_DELEGATION_UNSUPPORTED',
  approval_receipt: 'CIVIC_EFFECT_APPROVAL_RECEIPT_REQUIRED',
  non_executing: 'CIVIC_GOVERNANCE_PREFLIGHT_NON_EXECUTING_REQUIRED'
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function check(key, ok, details = {}) {
  return {
    key,
    ok: ok === true,
    error: ok === true ? '' : CHECK_ERROR[key],
    details: clone(details || {})
  };
}

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function evaluateDelegationProof({
  action,
  delegationStore,
  delegatedExecutionProof = {},
  allowDelegatedExecution = false,
  nowMs
} = {}) {
  const authorityKind = String(action?.executionAuthority?.kind || '');
  const base = {
    authorityKind,
    allowDelegatedExecution: allowDelegatedExecution === true,
    proofRequired: authorityKind === 'delegated',
    proofStatus: authorityKind === 'delegated' ? 'missing' : 'not_required',
    releaseGateReady: false,
    executionStatus: 'not_executable'
  };

  if (!action) {
    return {
      proofOk: false,
      receiptOk: false,
      policyOk: false,
      details: {
        ...base,
        proofStatus: 'action_invalid',
        failures: ['action_invalid']
      }
    };
  }

  if (authorityKind !== 'delegated') {
    return {
      proofOk: true,
      receiptOk: false,
      policyOk: true,
      details: base
    };
  }

  const proof = isPlainObject(delegatedExecutionProof) ? delegatedExecutionProof : {};
  const delegationId = String(proof.delegationId || '').trim();
  const principalAccountId = String(proof.principalAccountId || '').trim();
  const delegateAgentId = String(proof.delegateAgentId || '').trim();
  const failures = [];
  if (!delegationStore || typeof delegationStore.getDelegation !== 'function') {
    failures.push('delegation_store_required');
  }
  if (!delegationStore || typeof delegationStore.getAgentParticipationPolicy !== 'function') {
    failures.push('delegation_policy_store_required');
  }
  if (!delegationId) failures.push('delegation_id_required');
  if (!principalAccountId) failures.push('principal_account_id_required');
  if (!delegateAgentId) failures.push('delegate_agent_id_required');

  let delegation = null;
  let policy = null;
  if (failures.length === 0) {
    delegation = delegationStore.getDelegation(delegationId);
    if (!delegation) failures.push('delegation_missing');
  }
  if (delegation) {
    if (delegation.principalAccountId !== principalAccountId) failures.push('principal_account_mismatch');
    if (delegation.delegateAgentId !== delegateAgentId) failures.push('delegate_agent_mismatch');
    if (delegation.status !== 'active') failures.push('delegation_inactive');
    if (delegation.expiresAtMs <= nowMs) failures.push('delegation_expired');
    if (delegation.scope !== 'civic_execution') failures.push('delegation_scope_not_civic_execution');
    if (delegation.canExecuteCivicEffects !== true) failures.push('delegation_execution_permission_required');
    if (delegation.approvalReceiptId !== action.executionAuthority.receiptId) failures.push('delegation_receipt_mismatch');
  }
  if (delegation && failures.length === 0) {
    policy = delegationStore.getAgentParticipationPolicy({
      principalAccountId,
      delegateAgentId,
      atMs: nowMs
    });
    const activeIds = Array.isArray(policy?.activeDelegationIds) ? policy.activeDelegationIds : [];
    const remainingActions = Number(policy?.remainingActionBudgetByScope?.civic_execution || 0);
    if (!activeIds.includes(delegationId)) failures.push('delegation_not_active_in_policy');
    if (policy?.civicExecutionAllowed !== true) failures.push('civic_execution_not_allowed_by_policy');
    if (remainingActions <= 0) failures.push('delegation_action_budget_exhausted');
  }

  const proofOk = failures.length === 0;
  return {
    proofOk,
    receiptOk: proofOk,
    policyOk: false,
    details: {
      ...base,
      proofStatus: proofOk ? 'valid' : 'invalid',
      delegationId,
      principalAccountId,
      delegateAgentId,
      receiptId: action.executionAuthority.receiptId,
      delegationStatus: delegation?.status || '',
      delegationScope: delegation?.scope || '',
      canExecuteCivicEffects: delegation?.canExecuteCivicEffects === true,
      activeDelegationIds: Array.isArray(policy?.activeDelegationIds) ? policy.activeDelegationIds : [],
      remainingActionBudget: Number(policy?.remainingActionBudgetByScope?.civic_execution || 0),
      budgetConsumptionStatus: 'not_consumed_by_preflight',
      failures
    }
  };
}

function approvedModerationForProposal(moderationStore, proposal) {
  if (!proposal || !moderationStore || typeof moderationStore.listDecisions !== 'function') return null;
  return moderationStore
    .listDecisions({
      subjectRef: proposal.proposalId,
      surface: proposal.proposal.moderationClass,
      status: 'approved',
      limit: 1
    })[0] || null;
}

function voteSummaryForProposal(voteStore, proposalId = '') {
  if (!voteStore || typeof voteStore.summarizeProposalVotes !== 'function') return null;
  return voteStore.summarizeProposalVotes(String(proposalId || ''));
}

function matchingVoteForReceipt(voteStore, proposalId = '', receiptId = '') {
  if (!voteStore || typeof voteStore.listVotes !== 'function') return null;
  return voteStore
    .listVotes({ proposalId, limit: 500 })
    .find((vote) => vote.receiptId === receiptId && vote.choice === 'approve') || null;
}

function buildV6CivicGovernancePreflight({
  rawAction = {},
  rawRollbackPlan = {},
  proposalStore,
  voteStore,
  moderationStore,
  delegationStore,
  delegatedExecutionProof = {},
  nowMs = Date.now(),
  allowDelegatedExecution = false,
  voteApprovalPolicy = DEFAULT_VOTE_APPROVAL_POLICY
} = {}) {
  const actionValidation = validateCivicAction(rawAction);
  const rollbackValidation = validateRollbackPlan(rawRollbackPlan);
  const action = actionValidation.ok ? actionValidation.value : null;
  const rollbackPlan = rollbackValidation.ok ? rollbackValidation.value : null;
  const proposal = action && proposalStore?.getProposal
    ? proposalStore.getProposal(action.proposalId)
    : null;
  const voteSummary = action ? voteSummaryForProposal(voteStore, action.proposalId) : null;
  const moderationDecision = approvedModerationForProposal(moderationStore, proposal);
  const approvingVote = action
    ? matchingVoteForReceipt(voteStore, action.proposalId, action.executionAuthority?.receiptId)
    : null;
  const rollbackMatches = Boolean(
    proposal
      && rollbackPlan
      && rollbackPlan.planId === proposal.proposal.rollbackPlan.planId
  );
  const proposalReviewReady = Boolean(
    proposal
      && proposal.status === 'ready_for_vote'
      && proposal.moderationStatus === 'approved'
  );
  const proposalActive = Boolean(proposal && proposal.expiresAtMs > nowMs);
  const effectTypeMatches = Boolean(
    proposal
      && action
      && proposal.proposal.effectPreview.effectType === action.effectType
  );
  const voteApproved = Boolean(
    voteSummary
      && voteSummary.counts.approve > voteSummary.counts.reject
      && voteSummary.counts.approve >= 1
  );
  const votePolicy = evaluateVoteApprovalPolicy(voteSummary, voteApprovalPolicy);
  const delegationProof = evaluateDelegationProof({
    action,
    delegationStore,
    delegatedExecutionProof,
    allowDelegatedExecution,
    nowMs
  });
  const authorityReceiptVerified = action?.executionAuthority?.kind === 'delegated'
    ? delegationProof.receiptOk
    : Boolean(approvingVote);

  const checks = [
    check('action_schema', actionValidation.ok, { errors: actionValidation.errors || [] }),
    check('rollback_schema', rollbackValidation.ok, { errors: rollbackValidation.errors || [] }),
    check('proposal_exists', Boolean(proposal), { proposalId: action?.proposalId || '' }),
    check('rollback_plan_matches', rollbackMatches, {
      proposalId: action?.proposalId || '',
      expected: proposal?.proposal?.rollbackPlan?.planId || '',
      received: rollbackPlan?.planId || ''
    }),
    check('proposal_active', proposalActive, {
      proposalId: action?.proposalId || '',
      expiresAtMs: proposal?.expiresAtMs || 0,
      nowMs
    }),
    check('effect_type_matches', effectTypeMatches, {
      proposalId: action?.proposalId || '',
      expected: proposal?.proposal?.effectPreview?.effectType || '',
      received: action?.effectType || ''
    }),
    check('moderation_approved', Boolean(moderationDecision), {
      proposalId: action?.proposalId || '',
      moderationClass: proposal?.proposal?.moderationClass || ''
    }),
    check('proposal_review_ready', proposalReviewReady, {
      proposalId: action?.proposalId || '',
      status: proposal?.status || '',
      moderationStatus: proposal?.moderationStatus || ''
    }),
    check('vote_approval', voteApproved, {
      proposalId: action?.proposalId || '',
      counts: voteSummary?.counts || null
    }),
    check('vote_policy', votePolicy.ok, {
      proposalId: action?.proposalId || '',
      policy: votePolicy.policy,
      counts: votePolicy.counts,
      quorumVotes: votePolicy.quorumVotes,
      decisiveVotes: votePolicy.decisiveVotes,
      approvalBps: votePolicy.approvalBps,
      failures: votePolicy.failures,
      policyErrors: votePolicy.policyErrors
    }),
    check('delegation_proof', delegationProof.proofOk, {
      proposalId: action?.proposalId || '',
      ...delegationProof.details
    }),
    check('delegation_policy', delegationProof.policyOk, {
      proposalId: action?.proposalId || '',
      authorityKind: action?.executionAuthority?.kind || '',
      proofStatus: delegationProof.details.proofStatus,
      allowDelegatedExecution: allowDelegatedExecution === true,
      releaseGateReady: false,
      executionStatus: 'not_executable'
    }),
    check('approval_receipt', authorityReceiptVerified, {
      proposalId: action?.proposalId || '',
      receiptId: action?.executionAuthority?.receiptId || '',
      receiptKind: action?.executionAuthority?.kind === 'delegated' ? 'delegation_approval' : 'vote_approval'
    }),
    check('non_executing', true)
  ];
  const failedChecks = checks.filter((entry) => entry.ok !== true);
  const canPrepare = failedChecks.length === 0;

  return {
    version: V6_CIVIC_GOVERNANCE_PREFLIGHT_VERSION,
    status: 'research_only',
    canPrepare,
    failClosed: canPrepare !== true,
    releaseReady: false,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    productionEnabled: false,
    executionStatus: 'not_executable',
    mutationApplied: false,
    action,
    rollbackPlan,
    proposal,
    voteSummary,
    votePolicy,
    delegationProof: delegationProof.details,
    approvingVote,
    moderationDecision,
    checks,
    errors: failedChecks.map((entry) => entry.error)
  };
}

function assertV6CivicGovernancePreflightSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_CIVIC_GOVERNANCE_PREFLIGHT_VERSION) {
    errors.push('V6_CIVIC_GOVERNANCE_PREFLIGHT_VERSION_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_CIVIC_GOVERNANCE_PREFLIGHT_RESEARCH_ONLY_REQUIRED');
  }
  if (report.releaseReady !== false) {
    errors.push('V6_CIVIC_GOVERNANCE_PREFLIGHT_RELEASE_READY_FORBIDDEN');
  }
  if (report.runtimeExposed !== false) {
    errors.push('V6_CIVIC_GOVERNANCE_PREFLIGHT_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.playerVisible !== false) {
    errors.push('V6_CIVIC_GOVERNANCE_PREFLIGHT_PLAYER_HIDDEN_REQUIRED');
  }
  if (report.normalGameplayExposure !== false) {
    errors.push('V6_CIVIC_GOVERNANCE_PREFLIGHT_NORMAL_GAMEPLAY_FORBIDDEN');
  }
  if (report.productionEnabled !== false) {
    errors.push('V6_CIVIC_GOVERNANCE_PREFLIGHT_PRODUCTION_ENABLEMENT_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable' || report.mutationApplied !== false) {
    errors.push('V6_CIVIC_GOVERNANCE_PREFLIGHT_NON_EXECUTING_REQUIRED');
  }
  const checkKeys = new Set((report.checks || []).map((entry) => entry.key));
  for (const key of REQUIRED_GOVERNANCE_PREFLIGHT_CHECKS) {
    if (!checkKeys.has(key)) errors.push(`V6_CIVIC_GOVERNANCE_PREFLIGHT_CHECK_REQUIRED:${key}`);
  }
  const failedChecks = (report.checks || []).filter((entry) => entry.ok !== true);
  if (report.canPrepare === true && failedChecks.length > 0) {
    errors.push('V6_CIVIC_GOVERNANCE_PREFLIGHT_READY_WITH_FAILED_CHECKS');
  }
  if (report.canPrepare !== true && report.failClosed !== true) {
    errors.push('V6_CIVIC_GOVERNANCE_PREFLIGHT_DENIAL_FAIL_CLOSED_REQUIRED');
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

function throwV6CivicGovernancePreflightError(report = {}) {
  for (const key of REQUIRED_GOVERNANCE_PREFLIGHT_CHECKS) {
    const entry = (report.checks || []).find((candidate) => candidate.key === key);
    if (entry && entry.ok !== true) {
      const err = new Error(entry.error);
      err.details = { ...entry.details, preflight: report };
      throw err;
    }
  }
}

module.exports = {
  REQUIRED_GOVERNANCE_PREFLIGHT_CHECKS: [...REQUIRED_GOVERNANCE_PREFLIGHT_CHECKS],
  V6_CIVIC_GOVERNANCE_PREFLIGHT_VERSION,
  assertV6CivicGovernancePreflightSafe,
  buildV6CivicGovernancePreflight,
  throwV6CivicGovernancePreflightError
};
