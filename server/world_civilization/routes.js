const express = require('express');

const {
  V6_WORLD_FEATURE_FLAG,
  isWorldGridFeatureEnabled,
  resolveWorldGridFeatureFlags
} = require('../world_grid/feature_flags');
const { isAuthorizedFeatureOverrideRequest } = require('../founders_plot/feature_flags');
const {
  REQUIRED_DEBUG_TABS,
  assertV6LabLaunchPlanSafe,
  buildV6LabModalLaunchPlan
} = require('./lab_surface');
const { buildV6CivicMutationSecurityEnvelope } = require('./mutation_security');
const { buildV6ProposalSubmissionEnvelope } = require('./proposals');
const { buildV6VoteRouteAuthorizationEnvelope } = require('./votes');
const {
  buildDelegatedActionUsage,
  summarizeDelegatedActionUse
} = require('./worker_tool_adapter');

const PROPOSAL_SUBMISSION_ROUTE = '/api/world/civilization/proposals/submit';
const PROPOSAL_SUBMISSION_MUTATION_SURFACE = 'proposal.submit_for_review';
const VOTE_CAST_ROUTE = '/api/world/civilization/votes/cast';
const HUMAN_VOTE_ROUTE_SURFACE = 'human_vote_route';
const V6_LAB_LAUNCH_PLAN_ROUTE = '/api/world/civilization/lab/launch-plan';

function truthy(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

function proposalRouteEnabled(env = process.env) {
  return truthy(env.V6_CIVIC_PROPOSAL_SUBMISSION_ROUTE_ENABLED);
}

function voteRouteEnabled(env = process.env) {
  return truthy(env.V6_CIVIC_VOTE_ROUTE_ENABLED);
}

function labRouteEnabled(env = process.env) {
  return truthy(env.V6_CIVIC_LAB_MODAL_ENABLED);
}

function csrfReviewed(req) {
  return String(req.header('x-v6-civic-csrf-reviewed') || '').trim() === '1';
}

function statusForError(error = null) {
  if (!error) return 500;
  if (error.message === 'V6_CIVIC_LAB_MODAL_DISABLED') return 404;
  if (error.message === 'V6_CIVIC_LAB_MODAL_DENIED') return 403;
  if (error.message === 'V6_CIVIC_LAB_MODAL_UNSAFE') return 500;
  if (error.message === 'V6_CIVIC_PROPOSAL_ROUTE_DISABLED') return 404;
  if (error.message === 'V6_CIVIC_VOTE_ROUTE_DISABLED') return 404;
  if (error.message === 'V6_CIVIC_PROPOSAL_STORE_REQUIRED') return 503;
  if (error.message === 'V6_CIVIC_VOTE_STORE_REQUIRED') return 503;
  if (error.message === 'V6_CIVIC_DELEGATION_USAGE_STORE_REQUIRED') return 503;
  if (error.message === 'V6_CIVIC_PROPOSAL_IDENTITY_REQUIRED') return 401;
  if (error.message === 'V6_CIVIC_VOTE_IDENTITY_REQUIRED') return 401;
  if (error.message === 'CIVIC_PROPOSAL_SUBMISSION_DENIED') return 403;
  if (error.message === 'V6_CIVIC_VOTE_ROUTE_AUTHORIZATION_DENIED') return 403;
  if (error.message === 'CIVIC_VOTE_PROPOSAL_REQUIRED') return 403;
  if (error.message === 'CIVIC_VOTE_PROPOSAL_EXPIRED') return 403;
  if (error.message === 'CIVIC_PROPOSAL_INVALID') return 400;
  if (error.message === 'CIVIC_DELEGATION_USAGE_INVALID') return 400;
  if (error.message === 'CIVIC_VOTE_INVALID') return 400;
  if (error.message === 'CIVIC_PROPOSAL_IDEMPOTENCY_CONFLICT') return 409;
  if (error.message === 'CIVIC_PROPOSAL_ID_CONFLICT') return 409;
  if (error.message === 'CIVIC_DELEGATION_USAGE_IDEMPOTENCY_CONFLICT') return 409;
  if (error.message === 'CIVIC_DELEGATION_USAGE_ID_CONFLICT') return 409;
  if (error.message === 'CIVIC_VOTE_IDEMPOTENCY_CONFLICT') return 409;
  if (error.message === 'CIVIC_VOTE_ALREADY_RECORDED') return 409;
  if (error.message === 'CIVIC_VOTE_ID_CONFLICT') return 409;
  if (String(error.message || '').startsWith('CIVIC_DELEGATION_USAGE_')) return 403;
  if (error.message === 'CIVIC_DELEGATION_ACTION_BUDGET_EXHAUSTED') return 403;
  return 500;
}

function normalizeError(error = null) {
  return {
    code: String(error?.message || 'INTERNAL_ERROR'),
    details: error?.details || {}
  };
}

function normalizeCivicIdentity(identity = {}) {
  if (!identity || typeof identity !== 'object') return null;
  const accountId = String(identity.accountId || identity.ownerAccountId || '').trim();
  if (!accountId) return null;
  const actorKind = String(identity.actorKind || 'human').trim();
  const agentId = String(identity.agentId || '').trim();
  return {
    accountId,
    actorKind,
    agentId,
    walletAddress: String(identity.walletAddress || identity.address || accountId).trim()
  };
}

function firstQueryValue(value) {
  if (Array.isArray(value)) return firstQueryValue(value[0]);
  return String(value || '').trim();
}

function labResearchOptedIn(req) {
  return truthy(firstQueryValue(req?.query?.v6Lab || req?.query?.v6ResearchLab));
}

function labDebugTabsAvailable(req) {
  const raw = firstQueryValue(req?.query?.debugTabs || req?.header?.('x-v6-lab-debug-tabs'));
  if (!raw) return [...REQUIRED_DEBUG_TABS];
  return raw.split(',').map((entry) => entry.trim()).filter(Boolean);
}

function labRequestPath(req) {
  return firstQueryValue(req?.query?.requestPath || req?.header?.('x-v6-lab-request-path')) || '/app';
}

function labLaunchSurface(req) {
  return firstQueryValue(req?.query?.launchSurface || req?.header?.('x-v6-lab-launch-surface')) || 'town_hub_modal';
}

function assertLabRequestAllowed(req, env) {
  if (!labRouteEnabled(env) || !labResearchOptedIn(req)) {
    throw new Error('V6_CIVIC_LAB_MODAL_DISABLED');
  }
  if (env.NODE_ENV === 'production' && !isAuthorizedFeatureOverrideRequest(req, env)) {
    throw new Error('V6_CIVIC_LAB_MODAL_DENIED');
  }
}

function labLaunchPlanPayload(launchPlan = {}) {
  return {
    ok: true,
    status: 'research_only',
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    mutatesWorldState: false,
    exposesCivicTools: false,
    exposesPrivateData: false,
    executionStatus: 'not_executable',
    launchPlan,
    panels: Array.isArray(launchPlan.panels) ? launchPlan.panels : []
  };
}

function actorForSubmission({ sourceSurface = '', identity = {}, body = {} } = {}) {
  if (sourceSurface === 'worker_tool_submission') {
    const agentId = String(body?.actor?.agentId || identity.agentId || '').trim();
    return {
      kind: 'agent',
      accountId: identity.accountId,
      agentId
    };
  }
  return {
    kind: 'human',
    accountId: identity.accountId
  };
}

function actorForVote({ routeSurface = '', identity = {}, body = {} } = {}) {
  if (routeSurface === 'delegated_agent_vote_route' || routeSurface === 'worker_tool_vote_surface') {
    return {
      kind: 'agent',
      accountId: identity.accountId,
      agentId: String(body?.actor?.agentId || identity.agentId || '').trim()
    };
  }
  return {
    kind: 'human',
    accountId: identity.accountId
  };
}

function requiredDelegationScopeForVote(routeSurface = '') {
  if (routeSurface === 'delegated_agent_vote_route' || routeSurface === 'worker_tool_vote_surface') {
    return 'vote_advice';
  }
  return '';
}

function routeCallableVoteSurface(routeSurface = '') {
  return routeSurface === HUMAN_VOTE_ROUTE_SURFACE || routeSurface === 'delegated_agent_vote_route';
}

function delegatedSubmissionScope(sourceSurface = '') {
  return sourceSurface === 'worker_tool_submission' ? 'proposal_drafting' : '';
}

function consumeRouteDelegatedAction({
  delegationStore = null,
  input = {},
  principalAccountId = '',
  delegateAgentId = '',
  scope = '',
  actionRef = '',
  idempotencyKey = '',
  nowMs = Date.now()
} = {}) {
  if (!scope) return null;
  if (!delegationStore || typeof delegationStore.consumeDelegatedAction !== 'function') {
    throw new Error('V6_CIVIC_DELEGATION_USAGE_STORE_REQUIRED');
  }
  return delegationStore.consumeDelegatedAction(buildDelegatedActionUsage({
    input,
    principalAccountId,
    delegateAgentId,
    scope,
    actionRef,
    idempotencyKey
  }), { nowMs });
}

function preflightProposalReceiptStoreConflict(proposalStore = null, proposal = {}) {
  if (!proposalStore || typeof proposalStore.getProposal !== 'function') return;
  const proposalId = String(proposal?.proposalId || '').trim();
  if (!proposalId) return;
  const existing = proposalStore.getProposal(proposalId);
  if (!existing) return;
  if (String(existing.idempotencyKey || '') === String(proposal.idempotencyKey || '')) return;
  const error = new Error('CIVIC_PROPOSAL_ID_CONFLICT');
  error.details = { proposalId };
  throw error;
}

function preflightVoteReceiptStoreConflict(voteStore = null, vote = {}) {
  if (!voteStore) return;
  const voteId = String(vote?.voteId || '').trim();
  if (voteId && typeof voteStore.getVote === 'function') {
    const existingVote = voteStore.getVote(voteId);
    if (existingVote && String(existingVote.idempotencyKey || '') !== String(vote.idempotencyKey || '')) {
      const error = new Error('CIVIC_VOTE_ID_CONFLICT');
      error.details = { voteId };
      throw error;
    }
  }
  if (typeof voteStore.listVotes !== 'function') return;
  const proposalId = String(vote?.proposalId || '').trim();
  const voterAccountId = String(vote?.voter?.accountId || '').trim();
  if (!proposalId || !voterAccountId) return;
  const existingByProposalVoter = voteStore.listVotes({
    proposalId,
    voterAccountId,
    limit: 1
  })[0];
  if (!existingByProposalVoter) return;
  if (String(existingByProposalVoter.idempotencyKey || '') === String(vote.idempotencyKey || '')) return;
  const error = new Error('CIVIC_VOTE_ALREADY_RECORDED');
  error.details = {
    proposalId,
    voterAccountId,
    existingVoteId: existingByProposalVoter.voteId
  };
  throw error;
}

function submitProposalRoutePayload(submitted = {}, delegatedActionUse = null) {
  return {
    ok: true,
    status: 'research_only',
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    mutatesWorldState: false,
    executesProposalEffects: false,
    exposesCivicTools: false,
    exposesPrivateData: false,
    executionStatus: 'not_executable',
    proposal: {
      proposalId: submitted.proposalId,
      status: submitted.status,
      moderationStatus: submitted.moderationStatus,
      scopeKind: submitted.scopeKind,
      scopeTargetId: submitted.scopeTargetId,
      proposerKind: submitted.proposerKind,
      proposerAgentId: submitted.proposerAgentId,
      auditEntryId: submitted.auditEntryId,
      duplicate: submitted.duplicate === true
    },
    delegatedActionUse: delegatedActionUse ? summarizeDelegatedActionUse(delegatedActionUse) : null,
    submissionEnvelope: submitted.submissionEnvelope || null
  };
}

function voteRoutePayload(recorded = {}, authorizationEnvelope = {}, delegatedActionUse = null) {
  return {
    ok: true,
    status: 'research_only',
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    recordsVote: true,
    appliesVoteOutcome: false,
    mutatesWorldState: false,
    exposesCivicTools: false,
    exposesPrivateData: false,
    executionStatus: 'not_executable',
    vote: {
      voteId: recorded.voteId,
      proposalId: recorded.proposalId,
      voterAccountId: recorded.voterAccountId,
      choice: recorded.choice,
      authorizationKind: recorded.authorizationKind,
      eligibilityRuleId: recorded.eligibilityRuleId,
      receiptId: recorded.receiptId,
      auditEntryId: recorded.auditEntryId,
      duplicate: recorded.duplicate === true
    },
    delegatedActionUse: delegatedActionUse ? summarizeDelegatedActionUse(delegatedActionUse) : null,
    routeAuthorization: authorizationEnvelope
  };
}

function createWorldCivilizationRouter({
  proposalStore = null,
  voteStore = null,
  delegationStore = null,
  resolveProposalStores = null,
  resolveVoteStores = null,
  resolveCivicIdentity = null,
  env = process.env
} = {}) {
  const router = express.Router();

  router.get(V6_LAB_LAUNCH_PLAN_ROUTE, (req, res) => {
    try {
      assertLabRequestAllowed(req, env);
      const featureFlags = resolveWorldGridFeatureFlags(req, env);
      const launchPlan = buildV6LabModalLaunchPlan({
        featureFlags,
        includeResearchLab: true,
        source: 'world_civilization_route',
        requestPath: labRequestPath(req),
        launchSurface: labLaunchSurface(req),
        debugTabsAvailable: labDebugTabsAvailable(req)
      });
      const safety = assertV6LabLaunchPlanSafe(launchPlan);
      if (!safety.ok) {
        const error = new Error('V6_CIVIC_LAB_MODAL_UNSAFE');
        error.details = { safety, launchPlan };
        throw error;
      }
      if (launchPlan.allowed !== true) {
        const error = new Error('V6_CIVIC_LAB_MODAL_DENIED');
        error.details = { launchPlan };
        throw error;
      }
      return res.json(labLaunchPlanPayload(launchPlan));
    } catch (error) {
      const status = statusForError(error);
      return res.status(status).json({
        ok: false,
        error: normalizeError(error)
      });
    }
  });

  router.post(PROPOSAL_SUBMISSION_ROUTE, (req, res) => {
    try {
      if (!proposalRouteEnabled(env)) {
        throw new Error('V6_CIVIC_PROPOSAL_ROUTE_DISABLED');
      }
      const resolvedStores = typeof resolveProposalStores === 'function'
        ? (resolveProposalStores(req, res) || {})
        : {};
      const activeProposalStore = proposalStore || resolvedStores.proposalStore || null;
      const activeDelegationStore = delegationStore || resolvedStores.delegationStore || null;
      if (!activeProposalStore || typeof activeProposalStore.submitProposalForReview !== 'function') {
        throw new Error('V6_CIVIC_PROPOSAL_STORE_REQUIRED');
      }
      const rawIdentity = typeof resolveCivicIdentity === 'function'
        ? resolveCivicIdentity(req, res)
        : null;
      const identity = normalizeCivicIdentity(rawIdentity);
      if (!identity) throw new Error('V6_CIVIC_PROPOSAL_IDENTITY_REQUIRED');

      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const proposal = body.proposal && typeof body.proposal === 'object' ? body.proposal : {};
      const sourceSurface = String(body.sourceSurface || 'human_route_submission').trim();
      const featureFlags = resolveWorldGridFeatureFlags(req, env);
      const includeResearch = proposalRouteEnabled(env) && isWorldGridFeatureEnabled(featureFlags, V6_WORLD_FEATURE_FLAG);
      const actor = actorForSubmission({ sourceSurface, identity, body });
      const requiredDelegationScope = delegatedSubmissionScope(sourceSurface);
      const nowMs = Date.now();
      const mutationSecurityEnvelope = buildV6CivicMutationSecurityEnvelope({
        featureFlags,
        includeResearchMutation: includeResearch,
        source: 'world_civilization_route',
        headers: req.headers,
        env,
        session: {
          authenticated: true,
          accountId: identity.accountId
        },
        wallet: {
          serverVerified: true,
          subjectAccountId: identity.accountId,
          walletAddress: identity.walletAddress
        },
        actor,
        delegation: body.delegation || {},
        delegationStore: activeDelegationStore,
        requiredDelegationScope,
        owner: {
          ownerAccountId: identity.accountId
        },
        surface: PROPOSAL_SUBMISSION_MUTATION_SURFACE,
        idempotencyKey: proposal.idempotencyKey,
        csrfVerified: csrfReviewed(req),
        nowMs
      });
      const submissionPreflight = buildV6ProposalSubmissionEnvelope({
        featureFlags,
        includeResearchProposalSubmission: includeResearch,
        source: 'world_civilization_route',
        sourceSurface,
        proposal,
        approvalReceiptId: body.approvalReceiptId,
        mutationSecurityEnvelope,
        workerEvidence: body.workerEvidence || {},
        nowMs
      });
      if (submissionPreflight.accepted !== true) {
        const error = new Error('CIVIC_PROPOSAL_SUBMISSION_DENIED');
        error.details = submissionPreflight;
        throw error;
      }
      preflightProposalReceiptStoreConflict(activeProposalStore, proposal);
      const delegatedActionUse = consumeRouteDelegatedAction({
        delegationStore: activeDelegationStore,
        input: body,
        principalAccountId: identity.accountId,
        delegateAgentId: actor.agentId,
        scope: requiredDelegationScope,
        actionRef: proposal.proposalId,
        idempotencyKey: proposal.idempotencyKey,
        nowMs
      });
      const submitted = activeProposalStore.submitProposalForReview({
        featureFlags,
        includeResearchProposalSubmission: includeResearch,
        source: 'world_civilization_route',
        sourceSurface,
        proposal,
        approvalReceiptId: body.approvalReceiptId,
        mutationSecurityEnvelope,
        workerEvidence: body.workerEvidence || {}
      }, { nowMs });

      return res.json(submitProposalRoutePayload(submitted, delegatedActionUse));
    } catch (error) {
      const status = statusForError(error);
      return res.status(status).json({
        ok: false,
        error: normalizeError(error)
      });
    }
  });

  router.post(VOTE_CAST_ROUTE, (req, res) => {
    try {
      if (!voteRouteEnabled(env)) {
        throw new Error('V6_CIVIC_VOTE_ROUTE_DISABLED');
      }
      const resolvedStores = typeof resolveVoteStores === 'function'
        ? (resolveVoteStores(req, res) || {})
        : {};
      const activeProposalStore = proposalStore || resolvedStores.proposalStore || null;
      const activeDelegationStore = delegationStore || resolvedStores.delegationStore || null;
      const activeVoteStore = voteStore || resolvedStores.voteStore || null;
      if (!activeProposalStore || typeof activeProposalStore.getProposal !== 'function'
        || !activeVoteStore || typeof activeVoteStore.recordVote !== 'function') {
        throw new Error('V6_CIVIC_VOTE_STORE_REQUIRED');
      }
      const rawIdentity = typeof resolveCivicIdentity === 'function'
        ? resolveCivicIdentity(req, res)
        : null;
      const identity = normalizeCivicIdentity(rawIdentity);
      if (!identity) throw new Error('V6_CIVIC_VOTE_IDENTITY_REQUIRED');

      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const vote = body.vote && typeof body.vote === 'object' ? body.vote : {};
      const routeSurface = String(body.routeSurface || HUMAN_VOTE_ROUTE_SURFACE).trim();
      if (!routeCallableVoteSurface(routeSurface)) {
        const error = new Error('V6_CIVIC_VOTE_ROUTE_AUTHORIZATION_DENIED');
        error.details = {
          routeSurface,
          errors: ['V6_CIVIC_VOTE_WORKER_TOOL_SURFACE_NOT_ROUTE_CALLABLE']
        };
        throw error;
      }
      const featureFlags = resolveWorldGridFeatureFlags(req, env);
      const includeResearch = voteRouteEnabled(env) && isWorldGridFeatureEnabled(featureFlags, V6_WORLD_FEATURE_FLAG);
      const actor = actorForVote({ routeSurface, identity, body });
      const requiredDelegationScope = requiredDelegationScopeForVote(routeSurface);
      const nowMs = Date.now();
      const mutationSecurityEnvelope = buildV6CivicMutationSecurityEnvelope({
        featureFlags,
        includeResearchMutation: includeResearch,
        source: 'world_civilization_vote_route',
        headers: req.headers,
        env,
        session: {
          authenticated: true,
          accountId: identity.accountId
        },
        wallet: {
          serverVerified: true,
          subjectAccountId: identity.accountId,
          walletAddress: identity.walletAddress
        },
        actor,
        delegation: body.delegation || {},
        delegationStore: activeDelegationStore,
        requiredDelegationScope,
        owner: {
          ownerAccountId: identity.accountId
        },
        surface: routeSurface,
        idempotencyKey: vote.idempotencyKey,
        csrfVerified: csrfReviewed(req),
        nowMs
      });
      const routeAuthorization = buildV6VoteRouteAuthorizationEnvelope({
        featureFlags,
        includeResearchVoteRouteAuth: includeResearch,
        source: 'world_civilization_vote_route',
        routeSurface,
        rawVote: vote,
        proposalStore: activeProposalStore,
        mutationSecurityEnvelope,
        nowMs
      });
      if (routeAuthorization.authorized !== true) {
        const error = new Error('V6_CIVIC_VOTE_ROUTE_AUTHORIZATION_DENIED');
        error.details = { routeAuthorization };
        throw error;
      }

      preflightVoteReceiptStoreConflict(activeVoteStore, vote);
      const delegatedActionUse = consumeRouteDelegatedAction({
        delegationStore: activeDelegationStore,
        input: body,
        principalAccountId: identity.accountId,
        delegateAgentId: actor.agentId,
        scope: requiredDelegationScope,
        actionRef: vote.voteId,
        idempotencyKey: vote.idempotencyKey,
        nowMs
      });
      const recorded = activeVoteStore.recordVote(vote, { nowMs });
      return res.json(voteRoutePayload(recorded, routeAuthorization, delegatedActionUse));
    } catch (error) {
      const status = statusForError(error);
      return res.status(status).json({
        ok: false,
        error: normalizeError(error)
      });
    }
  });

  return router;
}

module.exports = {
  PROPOSAL_SUBMISSION_ROUTE,
  V6_LAB_LAUNCH_PLAN_ROUTE,
  VOTE_CAST_ROUTE,
  createWorldCivilizationRouter
};
