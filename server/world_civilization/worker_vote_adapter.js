const {
  V6_WORLD_FEATURE_FLAG,
  isWorldGridFeatureEnabled
} = require('../world_grid/feature_flags');
const { buildV6CivicMutationSecurityEnvelope } = require('./mutation_security');
const { buildV6VoteRouteAuthorizationEnvelope } = require('./votes');
const {
  WORKER_ORIGIN,
  inspectWorkerEvidence
} = require('./worker_tool_adapter');

const V6_CIVIC_WORKER_VOTE_ADAPTER_VERSION = 'agent-town.v6.civic.worker_vote_adapter.v1';
const WORKER_VOTE_CAST_TOOL_NAME = 'et.world.civic.votes.cast';
const WORKER_VOTE_ROUTE_SURFACE = 'worker_tool_vote_surface';

function truthy(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

function workerVoteAdapterEnabled(env = process.env) {
  return truthy(env.V6_CIVIC_WORKER_VOTE_ADAPTER_ENABLED);
}

function fail(code, details = {}) {
  const error = new Error(code);
  error.details = details;
  throw error;
}

function normalizeIdentity(identity = {}) {
  if (!identity || typeof identity !== 'object') return null;
  const accountId = String(identity.accountId || identity.ownerAccountId || '').trim();
  if (!accountId) return null;
  return {
    accountId,
    walletAddress: String(identity.walletAddress || identity.address || accountId).trim()
  };
}

function authorizationMatches(left = {}, right = {}) {
  return String(left.kind || '') === String(right.kind || '')
    && String(left.subjectAccountId || '') === String(right.subjectAccountId || '')
    && left.serverVerified === right.serverVerified;
}

function voteWithToolEnvelope(input = {}) {
  const vote = input.vote && typeof input.vote === 'object' ? { ...input.vote } : {};
  const toolAuthorization = input.authorization && typeof input.authorization === 'object'
    ? { ...input.authorization }
    : null;
  const toolIdempotencyKey = String(input.idempotencyKey || '').trim();
  const voteIdempotencyKey = String(vote.idempotencyKey || '').trim();
  if (!toolAuthorization) {
    fail('V6_CIVIC_WORKER_VOTE_AUTHORIZATION_REQUIRED');
  }
  if (toolIdempotencyKey && voteIdempotencyKey && toolIdempotencyKey !== voteIdempotencyKey) {
    fail('V6_CIVIC_WORKER_VOTE_IDEMPOTENCY_MISMATCH', {
      toolIdempotencyKey,
      voteIdempotencyKey
    });
  }
  if (toolIdempotencyKey && !voteIdempotencyKey) {
    vote.idempotencyKey = toolIdempotencyKey;
  }
  if (vote.authorization && !authorizationMatches(vote.authorization, toolAuthorization)) {
    fail('V6_CIVIC_WORKER_VOTE_AUTHORIZATION_MISMATCH');
  }
  vote.authorization = toolAuthorization;
  return vote;
}

function castVoteFromWorkerTool({
  toolName = WORKER_VOTE_CAST_TOOL_NAME,
  input = {},
  identity = {},
  proposalStore = null,
  voteStore = null,
  delegationStore = null,
  featureFlags = {},
  includeResearchWorkerVote = false,
  env = process.env,
  headers = {},
  nowMs = Date.now()
} = {}) {
  if (!workerVoteAdapterEnabled(env)
    || includeResearchWorkerVote !== true
    || !isWorldGridFeatureEnabled(featureFlags, V6_WORLD_FEATURE_FLAG)) {
    fail('V6_CIVIC_WORKER_VOTE_DISABLED', {
      featureFlag: V6_WORLD_FEATURE_FLAG,
      adapterEnabled: workerVoteAdapterEnabled(env),
      researchOptIn: includeResearchWorkerVote === true
    });
  }
  if (toolName !== WORKER_VOTE_CAST_TOOL_NAME) {
    fail('V6_CIVIC_WORKER_VOTE_UNSUPPORTED', { toolName });
  }
  if (!proposalStore || typeof proposalStore.getProposal !== 'function'
    || !voteStore || typeof voteStore.recordVote !== 'function') {
    fail('V6_CIVIC_WORKER_VOTE_STORE_REQUIRED');
  }

  const civicIdentity = normalizeIdentity(identity);
  if (!civicIdentity) fail('V6_CIVIC_WORKER_VOTE_IDENTITY_REQUIRED');

  const vote = voteWithToolEnvelope(input);
  const workerEvidence = input.workerEvidence && typeof input.workerEvidence === 'object'
    ? input.workerEvidence
    : {};
  const workerReport = inspectWorkerEvidence(workerEvidence);
  if (!workerReport.ok) {
    fail('V6_CIVIC_WORKER_VOTE_OBSERVABILITY_REQUIRED', workerReport);
  }

  const agentId = String(input.actor?.agentId || '').trim();
  if (!agentId) fail('V6_CIVIC_WORKER_VOTE_AGENT_REQUIRED');

  const mutationSecurityEnvelope = buildV6CivicMutationSecurityEnvelope({
    featureFlags,
    includeResearchMutation: true,
    source: 'openclaw_lite_worker_vote_tool',
    headers,
    env,
    session: {
      authenticated: true,
      accountId: civicIdentity.accountId
    },
    wallet: {
      serverVerified: true,
      subjectAccountId: civicIdentity.accountId,
      walletAddress: civicIdentity.walletAddress
    },
    actor: {
      kind: 'agent',
      accountId: civicIdentity.accountId,
      agentId
    },
    delegation: input.delegation || {},
    delegationStore,
    requiredDelegationScope: 'vote_advice',
    owner: {
      ownerAccountId: civicIdentity.accountId
    },
    surface: WORKER_VOTE_ROUTE_SURFACE,
    idempotencyKey: vote.idempotencyKey,
    csrfVerified: workerEvidence.sameOriginCsrfReviewed === true,
    nowMs
  });

  const routeAuthorization = buildV6VoteRouteAuthorizationEnvelope({
    featureFlags,
    includeResearchVoteRouteAuth: true,
    source: 'openclaw_lite_worker_vote_tool',
    routeSurface: WORKER_VOTE_ROUTE_SURFACE,
    rawVote: vote,
    proposalStore,
    mutationSecurityEnvelope,
    nowMs
  });
  if (routeAuthorization.authorized !== true) {
    fail('V6_CIVIC_WORKER_VOTE_AUTHORIZATION_DENIED', { routeAuthorization });
  }

  const recorded = voteStore.recordVote(vote, { nowMs });
  return {
    version: V6_CIVIC_WORKER_VOTE_ADAPTER_VERSION,
    ok: true,
    status: 'research_only',
    toolName,
    featureFlag: V6_WORLD_FEATURE_FLAG,
    source: 'openclaw_lite_worker_vote_tool',
    routeSurface: WORKER_VOTE_ROUTE_SURFACE,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    recordsVote: true,
    appliesVoteOutcome: false,
    mutatesWorldState: false,
    mutatesPrivateTown: false,
    mutatesOtherUserWorld: false,
    executesProposalEffects: false,
    exposesCivicTools: false,
    exposesPrivateData: false,
    backendShortcut: false,
    executionStatus: 'not_executable',
    workerEvidence: workerReport,
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
    routeAuthorization
  };
}

module.exports = {
  V6_CIVIC_WORKER_VOTE_ADAPTER_VERSION,
  WORKER_ORIGIN,
  WORKER_VOTE_CAST_TOOL_NAME,
  WORKER_VOTE_ROUTE_SURFACE,
  castVoteFromWorkerTool,
  workerVoteAdapterEnabled
};
