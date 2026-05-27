const {
  V6_WORLD_FEATURE_FLAG,
  isWorldGridFeatureEnabled
} = require('../world_grid/feature_flags');
const { REQUIRED_DEBUG_TABS } = require('./lab_surface');
const { buildV6CivicMutationSecurityEnvelope } = require('./mutation_security');

const V6_CIVIC_WORKER_TOOL_ADAPTER_VERSION = 'agent-town.v6.civic.worker_tool_adapter.v1';
const WORKER_PROPOSAL_SUBMIT_TOOL_NAME = 'et.world.civic.proposals.submit_for_review';
const WORKER_PROPOSAL_SUBMISSION_SURFACE = 'proposal.submit_for_review';
const WORKER_ORIGIN = 'openclaw_lite_worker';

function truthy(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

function workerToolAdapterEnabled(env = process.env) {
  return truthy(env.V6_CIVIC_WORKER_TOOL_ADAPTER_ENABLED);
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

function proposalWithToolIdempotency(input = {}) {
  const proposal = input.proposal && typeof input.proposal === 'object' ? { ...input.proposal } : {};
  const toolIdempotencyKey = String(input.idempotencyKey || '').trim();
  const proposalIdempotencyKey = String(proposal.idempotencyKey || '').trim();
  if (toolIdempotencyKey && proposalIdempotencyKey && toolIdempotencyKey !== proposalIdempotencyKey) {
    fail('V6_CIVIC_WORKER_TOOL_IDEMPOTENCY_MISMATCH', {
      toolIdempotencyKey,
      proposalIdempotencyKey
    });
  }
  if (toolIdempotencyKey && !proposalIdempotencyKey) {
    proposal.idempotencyKey = toolIdempotencyKey;
  }
  return proposal;
}

function missingDebugTabs(workerEvidence = {}) {
  const available = new Set(Array.isArray(workerEvidence.debugTabsAvailable)
    ? workerEvidence.debugTabsAvailable.map((entry) => String(entry || ''))
    : []);
  return REQUIRED_DEBUG_TABS.filter((tab) => !available.has(tab));
}

function inspectWorkerEvidence(workerEvidence = {}) {
  const missingTabs = missingDebugTabs(workerEvidence);
  const ok = workerEvidence.origin === WORKER_ORIGIN
    && workerEvidence.backendShortcut !== true
    && workerEvidence.skillContextLoaded === true
    && workerEvidence.workerTrafficTrace === true
    && workerEvidence.sessionContextLinked === true
    && missingTabs.length === 0;
  return {
    ok,
    origin: String(workerEvidence.origin || ''),
    backendShortcut: workerEvidence.backendShortcut === true,
    skillContextLoaded: workerEvidence.skillContextLoaded === true,
    workerTrafficTrace: workerEvidence.workerTrafficTrace === true,
    sessionContextLinked: workerEvidence.sessionContextLinked === true,
    requiredDebugTabs: [...REQUIRED_DEBUG_TABS],
    debugTabsAvailable: Array.isArray(workerEvidence.debugTabsAvailable)
      ? [...workerEvidence.debugTabsAvailable]
      : [],
    missingDebugTabs: missingTabs
  };
}

function submitProposalForReviewFromWorkerTool({
  toolName = WORKER_PROPOSAL_SUBMIT_TOOL_NAME,
  input = {},
  identity = {},
  proposalStore = null,
  delegationStore = null,
  featureFlags = {},
  includeResearchWorkerTool = false,
  env = process.env,
  headers = {},
  nowMs = Date.now()
} = {}) {
  if (!workerToolAdapterEnabled(env)
    || includeResearchWorkerTool !== true
    || !isWorldGridFeatureEnabled(featureFlags, V6_WORLD_FEATURE_FLAG)) {
    fail('V6_CIVIC_WORKER_TOOL_DISABLED', {
      featureFlag: V6_WORLD_FEATURE_FLAG,
      adapterEnabled: workerToolAdapterEnabled(env),
      researchOptIn: includeResearchWorkerTool === true
    });
  }
  if (toolName !== WORKER_PROPOSAL_SUBMIT_TOOL_NAME) {
    fail('V6_CIVIC_WORKER_TOOL_UNSUPPORTED', { toolName });
  }
  if (!proposalStore || typeof proposalStore.submitProposalForReview !== 'function') {
    fail('V6_CIVIC_WORKER_TOOL_PROPOSAL_STORE_REQUIRED');
  }

  const civicIdentity = normalizeIdentity(identity);
  if (!civicIdentity) fail('V6_CIVIC_WORKER_TOOL_IDENTITY_REQUIRED');

  const proposal = proposalWithToolIdempotency(input);
  const workerEvidence = input.workerEvidence && typeof input.workerEvidence === 'object'
    ? input.workerEvidence
    : {};
  const workerReport = inspectWorkerEvidence(workerEvidence);
  if (!workerReport.ok) {
    fail('V6_CIVIC_WORKER_TOOL_OBSERVABILITY_REQUIRED', workerReport);
  }

  const agentId = String(input.actor?.agentId || proposal.proposer?.agentId || '').trim();
  if (!agentId) fail('V6_CIVIC_WORKER_TOOL_AGENT_REQUIRED');

  const mutationSecurityEnvelope = buildV6CivicMutationSecurityEnvelope({
    featureFlags,
    includeResearchMutation: true,
    source: 'openclaw_lite_worker_tool',
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
    requiredDelegationScope: 'proposal_drafting',
    owner: {
      ownerAccountId: civicIdentity.accountId
    },
    surface: WORKER_PROPOSAL_SUBMISSION_SURFACE,
    idempotencyKey: proposal.idempotencyKey,
    csrfVerified: workerEvidence.sameOriginCsrfReviewed === true,
    nowMs
  });

  const submitted = proposalStore.submitProposalForReview({
    featureFlags,
    includeResearchProposalSubmission: true,
    source: 'openclaw_lite_worker_tool',
    sourceSurface: 'worker_tool_submission',
    proposal,
    approvalReceiptId: input.approvalReceiptId,
    mutationSecurityEnvelope,
    workerEvidence
  }, { nowMs });

  return {
    version: V6_CIVIC_WORKER_TOOL_ADAPTER_VERSION,
    ok: true,
    status: 'research_only',
    toolName,
    featureFlag: V6_WORLD_FEATURE_FLAG,
    source: 'openclaw_lite_worker_tool',
    sourceSurface: 'worker_tool_submission',
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    mutatesWorldState: false,
    mutatesPrivateTown: false,
    mutatesOtherUserWorld: false,
    executesProposalEffects: false,
    exposesCivicTools: false,
    exposesPrivateData: false,
    backendShortcut: false,
    executionStatus: 'not_executable',
    workerEvidence: workerReport,
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

module.exports = {
  V6_CIVIC_WORKER_TOOL_ADAPTER_VERSION,
  WORKER_ORIGIN,
  WORKER_PROPOSAL_SUBMIT_TOOL_NAME,
  inspectWorkerEvidence,
  submitProposalForReviewFromWorkerTool,
  workerToolAdapterEnabled
};
