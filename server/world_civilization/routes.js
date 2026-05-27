const express = require('express');

const {
  V6_WORLD_FEATURE_FLAG,
  isWorldGridFeatureEnabled,
  resolveWorldGridFeatureFlags
} = require('../world_grid/feature_flags');
const { buildV6CivicMutationSecurityEnvelope } = require('./mutation_security');

const PROPOSAL_SUBMISSION_ROUTE = '/api/world/civilization/proposals/submit';
const PROPOSAL_SUBMISSION_MUTATION_SURFACE = 'proposal.submit_for_review';

function truthy(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

function routeEnabled(env = process.env) {
  return truthy(env.V6_CIVIC_PROPOSAL_SUBMISSION_ROUTE_ENABLED);
}

function csrfReviewed(req) {
  return String(req.header('x-v6-civic-csrf-reviewed') || '').trim() === '1';
}

function statusForError(error = null) {
  if (!error) return 500;
  if (error.message === 'V6_CIVIC_PROPOSAL_ROUTE_DISABLED') return 404;
  if (error.message === 'V6_CIVIC_PROPOSAL_STORE_REQUIRED') return 503;
  if (error.message === 'V6_CIVIC_PROPOSAL_IDENTITY_REQUIRED') return 401;
  if (error.message === 'CIVIC_PROPOSAL_SUBMISSION_DENIED') return 403;
  if (error.message === 'CIVIC_PROPOSAL_INVALID') return 400;
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

function submitProposalRoutePayload(submitted = {}) {
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
    submissionEnvelope: submitted.submissionEnvelope || null
  };
}

function createWorldCivilizationRouter({
  proposalStore = null,
  delegationStore = null,
  resolveCivicIdentity = null,
  env = process.env
} = {}) {
  const router = express.Router();

  router.post(PROPOSAL_SUBMISSION_ROUTE, (req, res) => {
    try {
      if (!routeEnabled(env)) {
        throw new Error('V6_CIVIC_PROPOSAL_ROUTE_DISABLED');
      }
      if (!proposalStore || typeof proposalStore.submitProposalForReview !== 'function') {
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
      const includeResearch = routeEnabled(env) && isWorldGridFeatureEnabled(featureFlags, V6_WORLD_FEATURE_FLAG);
      const actor = actorForSubmission({ sourceSurface, identity, body });
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
        delegationStore,
        requiredDelegationScope: sourceSurface === 'worker_tool_submission' ? 'proposal_drafting' : '',
        owner: {
          ownerAccountId: identity.accountId
        },
        surface: PROPOSAL_SUBMISSION_MUTATION_SURFACE,
        idempotencyKey: proposal.idempotencyKey,
        csrfVerified: csrfReviewed(req),
        nowMs: Date.now()
      });
      const submitted = proposalStore.submitProposalForReview({
        featureFlags,
        includeResearchProposalSubmission: includeResearch,
        source: 'world_civilization_route',
        sourceSurface,
        proposal,
        approvalReceiptId: body.approvalReceiptId,
        mutationSecurityEnvelope,
        workerEvidence: body.workerEvidence || {}
      }, { nowMs: Date.now() });

      return res.json(submitProposalRoutePayload(submitted));
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
  createWorldCivilizationRouter
};
