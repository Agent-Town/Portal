const { V6_WORLD_FEATURE_FLAG, isWorldGridFeatureEnabled } = require('../world_grid/feature_flags');
const { requireWorldGridMutationOrigin } = require('../world_grid/mutation_origin');
const { consumeWorldGridMutationRateLimit } = require('../world_grid/rate_limit');

const V6_CIVIC_MUTATION_SECURITY_VERSION = 'agent-town.v6.civic_mutation_security.v1';
const CIVIC_MUTATION_IDEMPOTENCY_RE = /^[A-Za-z0-9:_-]{6,120}$/;

const REQUIRED_SECURITY_CHECKS = [
  'feature_flag',
  'research_opt_in',
  'same_origin',
  'session_auth',
  'wallet_auth',
  'delegation_proof',
  'actor_binding',
  'csrf',
  'idempotency',
  'rate_limit',
  'runtime_hidden'
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function headerReader(headers = {}) {
  const normalized = Object.fromEntries(Object.entries(headers || {}).map(([key, value]) => [
    String(key || '').toLowerCase(),
    value
  ]));
  return {
    get(name = '') {
      return normalized[String(name || '').toLowerCase()] || '';
    }
  };
}

function productionRequired(env = process.env) {
  return env.NODE_ENV === 'production' || env.V6_CIVIC_MUTATION_SECURITY_REQUIRED === '1';
}

function ownerAccount(owner = {}) {
  return String(owner.ownerAccountId || owner.accountId || '').trim();
}

function actorAccount(actor = {}) {
  return String(actor.accountId || '').trim();
}

function sessionAccount(session = {}) {
  return String(session.accountId || session.subjectAccountId || '').trim();
}

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function actorBoundToSession({ actor = {}, session = {}, delegationProof = {} } = {}) {
  if (actor.kind === 'human') {
    return Boolean(actorAccount(actor) && actorAccount(actor) === sessionAccount(session));
  }
  if (actor.kind === 'agent') {
    return delegationProof.ok === true
      && String(delegationProof.principalAccountId || '') === sessionAccount(session)
      && String(delegationProof.delegateAgentId || '') === String(actor.agentId || '');
  }
  return false;
}

function evaluateDelegatedAgentProof({
  actor = {},
  session = {},
  delegation = {},
  delegationStore = null,
  requiredDelegationScope = '',
  nowMs = Date.now()
} = {}) {
  const actorKind = String(actor?.kind || '');
  const base = {
    proofRequired: actorKind === 'agent',
    proofStatus: actorKind === 'agent' ? 'missing' : 'not_required',
    requiredScope: String(requiredDelegationScope || ''),
    budgetConsumptionStatus: 'not_consumed_by_security_envelope',
    executionStatus: 'not_executable'
  };

  if (actorKind !== 'agent') {
    return {
      ok: true,
      principalAccountId: '',
      delegateAgentId: '',
      details: base
    };
  }

  const proof = isPlainObject(delegation) ? delegation : {};
  const delegationId = String(proof.delegationId || '').trim();
  const principalAccountId = String(proof.principalAccountId || '').trim();
  const delegateAgentId = String(proof.delegateAgentId || '').trim();
  const approvalReceiptId = String(proof.approvalReceiptId || '').trim();
  const requiredScope = String(requiredDelegationScope || '').trim();
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
  if (!approvalReceiptId) failures.push('approval_receipt_id_required');
  if (!requiredScope) failures.push('required_delegation_scope_required');

  let stored = null;
  let policy = null;
  if (failures.length === 0) {
    stored = delegationStore.getDelegation(delegationId);
    if (!stored) failures.push('delegation_missing');
  }
  if (stored) {
    if (stored.principalAccountId !== principalAccountId) failures.push('principal_account_mismatch');
    if (stored.delegateAgentId !== delegateAgentId) failures.push('delegate_agent_mismatch');
    if (stored.delegateAgentId !== String(actor.agentId || '')) failures.push('actor_agent_mismatch');
    if (stored.principalAccountId !== sessionAccount(session)) failures.push('session_principal_mismatch');
    if (stored.approvalReceiptId !== approvalReceiptId) failures.push('approval_receipt_mismatch');
    if (stored.scope !== requiredScope) failures.push('delegation_scope_mismatch');
    if (stored.status !== 'active') failures.push('delegation_inactive');
    if (stored.expiresAtMs <= nowMs) failures.push('delegation_expired');
  }
  if (stored && failures.length === 0) {
    policy = delegationStore.getAgentParticipationPolicy({
      principalAccountId,
      delegateAgentId,
      atMs: nowMs
    });
    const activeIds = Array.isArray(policy?.activeDelegationIds) ? policy.activeDelegationIds : [];
    const allowedScopes = Array.isArray(policy?.allowedScopes) ? policy.allowedScopes : [];
    const remainingActions = Number(policy?.remainingActionBudgetByScope?.[requiredScope] || 0);
    if (!activeIds.includes(delegationId)) failures.push('delegation_not_active_in_policy');
    if (!allowedScopes.includes(requiredScope)) failures.push('delegation_scope_not_allowed_by_policy');
    if (remainingActions <= 0) failures.push('delegation_action_budget_exhausted');
  }

  const ok = failures.length === 0;
  return {
    ok,
    principalAccountId,
    delegateAgentId,
    details: {
      ...base,
      proofStatus: ok ? 'valid' : 'invalid',
      delegationId,
      principalAccountId,
      delegateAgentId,
      approvalReceiptId,
      storedScope: stored?.scope || '',
      storedStatus: stored?.status || '',
      activeDelegationIds: Array.isArray(policy?.activeDelegationIds) ? policy.activeDelegationIds : [],
      allowedScopes: Array.isArray(policy?.allowedScopes) ? policy.allowedScopes : [],
      remainingActionBudget: Number(policy?.remainingActionBudgetByScope?.[requiredScope] || 0),
      failures
    }
  };
}

function check(key, ok, error = '') {
  return { key, ok: ok === true, error: ok === true ? '' : error };
}

function evaluateSameOrigin({ headers = {}, env = process.env } = {}) {
  try {
    requireWorldGridMutationOrigin(headerReader(headers), { productionRequired: productionRequired(env) });
    return { ok: true, error: '' };
  } catch (err) {
    return { ok: false, error: err.message || 'FORBIDDEN_ORIGIN' };
  }
}

function evaluateRateLimit({ owner = {}, surface = '', env = process.env, nowMs = Date.now() } = {}) {
  const result = consumeWorldGridMutationRateLimit({
    owner: { ownerAccountId: ownerAccount(owner) },
    surface,
    env,
    nowMs
  });
  if (!result) return { ok: false, result: null, error: 'CIVIC_MUTATION_OWNER_REQUIRED' };
  return { ok: result.allowed === true, result, error: result.allowed === true ? '' : 'RATE_LIMITED' };
}

function buildV6CivicMutationSecurityEnvelope({
  featureFlags = {},
  includeResearchMutation = false,
  source = 'runtime',
  headers = {},
  env = process.env,
  session = {},
  wallet = {},
  actor = {},
  delegation = {},
  delegationStore = null,
  requiredDelegationScope = '',
  owner = {},
  surface = '',
  idempotencyKey = '',
  csrfVerified = false,
  nowMs = Date.now()
} = {}) {
  const enabled = isWorldGridFeatureEnabled(featureFlags, V6_WORLD_FEATURE_FLAG);
  const sameOrigin = evaluateSameOrigin({ headers, env });
  const rateLimit = evaluateRateLimit({ owner, surface, env, nowMs });
  const sessionOk = session.authenticated === true && Boolean(sessionAccount(session));
  const walletOk = wallet.serverVerified === true
    && String(wallet.subjectAccountId || '') === sessionAccount(session)
    && Boolean(wallet.address || wallet.walletAddress || wallet.subjectAccountId);
  const ownerOk = ownerAccount(owner) === sessionAccount(session);
  const csrfOk = productionRequired(env) ? csrfVerified === true : true;
  const idempotencyOk = CIVIC_MUTATION_IDEMPOTENCY_RE.test(String(idempotencyKey || ''));
  const delegatedAgentProof = evaluateDelegatedAgentProof({
    actor,
    session,
    delegation,
    delegationStore,
    requiredDelegationScope,
    nowMs
  });

  const checks = [
    check('feature_flag', enabled, 'FEATURE_DISABLED'),
    check('research_opt_in', includeResearchMutation === true, 'RESEARCH_OPT_IN_REQUIRED'),
    check('same_origin', sameOrigin.ok, sameOrigin.error),
    check('session_auth', sessionOk, 'SESSION_AUTH_REQUIRED'),
    check('wallet_auth', walletOk, 'WALLET_AUTH_REQUIRED'),
    check('delegation_proof', delegatedAgentProof.ok, 'DELEGATION_PROOF_REQUIRED'),
    check('actor_binding', ownerOk && actorBoundToSession({ actor, session, delegationProof: delegatedAgentProof }), 'ACTOR_BINDING_REQUIRED'),
    check('csrf', csrfOk, 'CSRF_REQUIRED'),
    check('idempotency', idempotencyOk, 'INVALID_IDEMPOTENCY_KEY'),
    check('rate_limit', rateLimit.ok, rateLimit.error),
    check('runtime_hidden', true, '')
  ];
  const allowed = checks.every((entry) => entry.ok);
  return {
    version: V6_CIVIC_MUTATION_SECURITY_VERSION,
    status: 'research_only',
    source,
    featureFlag: V6_WORLD_FEATURE_FLAG,
    available: enabled && includeResearchMutation === true,
    allowed,
    failClosed: allowed !== true,
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    productionEnabled: false,
    executionStatus: 'not_executable',
    mutationApplied: false,
    surface: String(surface || ''),
    actor: clone(actor || {}),
    delegationProof: clone(delegatedAgentProof.details),
    ownerAccountId: ownerAccount(owner),
    sessionAccountId: sessionAccount(session),
    idempotencyKey: String(idempotencyKey || ''),
    csrfRequired: productionRequired(env),
    csrfVerified: csrfVerified === true,
    rateLimit: rateLimit.result,
    checks,
    errors: checks.filter((entry) => !entry.ok).map((entry) => entry.error)
  };
}

function assertV6CivicMutationSecuritySafe(report = {}) {
  const errors = [];
  if (report.version !== V6_CIVIC_MUTATION_SECURITY_VERSION) {
    errors.push('V6_CIVIC_MUTATION_SECURITY_VERSION_REQUIRED');
  }
  if (report.featureFlag !== V6_WORLD_FEATURE_FLAG) {
    errors.push('V6_CIVIC_MUTATION_FEATURE_FLAG_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_CIVIC_MUTATION_RESEARCH_ONLY_REQUIRED');
  }
  if (report.runtimeExposed !== false) {
    errors.push('V6_CIVIC_MUTATION_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.playerVisible !== false) {
    errors.push('V6_CIVIC_MUTATION_PLAYER_HIDDEN_REQUIRED');
  }
  if (report.normalGameplayExposure !== false) {
    errors.push('V6_CIVIC_MUTATION_NORMAL_GAMEPLAY_FORBIDDEN');
  }
  if (report.productionEnabled !== false) {
    errors.push('V6_CIVIC_MUTATION_PRODUCTION_ENABLEMENT_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable' || report.mutationApplied !== false) {
    errors.push('V6_CIVIC_MUTATION_NON_EXECUTING_REQUIRED');
  }
  const checkKeys = new Set((report.checks || []).map((entry) => entry.key));
  for (const key of REQUIRED_SECURITY_CHECKS) {
    if (!checkKeys.has(key)) errors.push(`V6_CIVIC_MUTATION_CHECK_REQUIRED:${key}`);
  }
  const failedChecks = (report.checks || []).filter((entry) => entry.ok !== true);
  if (report.allowed === true && failedChecks.length > 0) {
    errors.push('V6_CIVIC_MUTATION_ALLOWED_WITH_FAILED_CHECKS');
  }
  if (report.allowed !== true && report.failClosed !== true) {
    errors.push('V6_CIVIC_MUTATION_DENIAL_FAIL_CLOSED_REQUIRED');
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  CIVIC_MUTATION_IDEMPOTENCY_RE,
  REQUIRED_SECURITY_CHECKS: [...REQUIRED_SECURITY_CHECKS],
  V6_CIVIC_MUTATION_SECURITY_VERSION,
  assertV6CivicMutationSecuritySafe,
  buildV6CivicMutationSecurityEnvelope
};
