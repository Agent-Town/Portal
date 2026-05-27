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

function actorBoundToSession({ actor = {}, session = {}, delegation = {} } = {}) {
  if (actor.kind === 'human') {
    return Boolean(actorAccount(actor) && actorAccount(actor) === sessionAccount(session));
  }
  if (actor.kind === 'agent') {
    return delegation.verified === true
      && delegation.expired !== true
      && String(delegation.principalAccountId || '') === sessionAccount(session)
      && String(delegation.delegateAgentId || '') === String(actor.agentId || '')
      && CIVIC_MUTATION_IDEMPOTENCY_RE.test(String(delegation.approvalReceiptId || ''));
  }
  return false;
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

  const checks = [
    check('feature_flag', enabled, 'FEATURE_DISABLED'),
    check('research_opt_in', includeResearchMutation === true, 'RESEARCH_OPT_IN_REQUIRED'),
    check('same_origin', sameOrigin.ok, sameOrigin.error),
    check('session_auth', sessionOk, 'SESSION_AUTH_REQUIRED'),
    check('wallet_auth', walletOk, 'WALLET_AUTH_REQUIRED'),
    check('actor_binding', ownerOk && actorBoundToSession({ actor, session, delegation }), 'ACTOR_BINDING_REQUIRED'),
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
