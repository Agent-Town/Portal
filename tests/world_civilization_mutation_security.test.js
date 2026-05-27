const test = require('node:test');
const assert = require('node:assert/strict');

const { V6_WORLD_FEATURE_FLAG, parseWorldGridFeatureFlags } = require('../server/world_grid/feature_flags');
const {
  REQUIRED_SECURITY_CHECKS,
  assertV6CivicMutationSecuritySafe,
  buildV6CivicMutationSecurityEnvelope
} = require('../server/world_civilization/mutation_security');

function headers(overrides = {}) {
  return {
    host: 'portal.local',
    origin: 'https://portal.local',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'empty',
    ...overrides
  };
}

function humanContext(overrides = {}) {
  return {
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    includeResearchMutation: true,
    source: 'node_test',
    headers: headers(),
    env: {
      NODE_ENV: 'production',
      WORLD_GRID_MUTATION_RATE_LIMIT_MAX: '30',
      WORLD_GRID_MUTATION_RATE_LIMIT_WINDOW_MS: '60000'
    },
    session: {
      authenticated: true,
      accountId: 'acct_v6_mutator_001'
    },
    wallet: {
      serverVerified: true,
      subjectAccountId: 'acct_v6_mutator_001',
      walletAddress: '0x0000000000000000000000000000000000000001'
    },
    actor: {
      kind: 'human',
      accountId: 'acct_v6_mutator_001'
    },
    owner: {
      ownerAccountId: 'acct_v6_mutator_001'
    },
    surface: 'proposal.draft',
    idempotencyKey: 'idem_v6_mutation_001',
    csrfVerified: true,
    nowMs: 1_779_790_000_000,
    ...overrides
  };
}

test('V6 civic mutation security envelope is hidden without explicit V6 research opt-in', () => {
  const broadV5 = buildV6CivicMutationSecurityEnvelope(humanContext({
    featureFlags: parseWorldGridFeatureFlags('all'),
    includeResearchMutation: true,
    surface: 'proposal.draft.hidden_a',
    idempotencyKey: 'idem_v6_hidden_a'
  }));
  const noResearchOptIn = buildV6CivicMutationSecurityEnvelope(humanContext({
    includeResearchMutation: false,
    surface: 'proposal.draft.hidden_b',
    idempotencyKey: 'idem_v6_hidden_b'
  }));

  for (const report of [broadV5, noResearchOptIn]) {
    assert.equal(report.allowed, false);
    assert.equal(report.failClosed, true);
    assert.equal(report.runtimeExposed, false);
    assert.equal(report.playerVisible, false);
    assert.equal(report.normalGameplayExposure, false);
    assert.equal(report.productionEnabled, false);
    assert.equal(report.mutationApplied, false);
    assert.deepEqual(assertV6CivicMutationSecuritySafe(report), { ok: true, errors: [] });
  }
});

test('V6 civic mutation security envelope requires production origin CSRF session wallet and idempotency checks', () => {
  const report = buildV6CivicMutationSecurityEnvelope(humanContext({
    surface: 'proposal.draft.allowed',
    idempotencyKey: 'idem_v6_allowed_001'
  }));

  assert.equal(report.available, true);
  assert.equal(report.allowed, true);
  assert.equal(report.failClosed, false);
  assert.equal(report.csrfRequired, true);
  assert.equal(report.csrfVerified, true);
  assert.deepEqual(report.checks.map((entry) => entry.key), REQUIRED_SECURITY_CHECKS);
  assert.ok(report.checks.every((entry) => entry.ok === true));
  assert.deepEqual(assertV6CivicMutationSecuritySafe(report), { ok: true, errors: [] });
});

test('V6 civic mutation security envelope rejects cross-origin CSRF auth owner and idempotency drift', () => {
  const report = buildV6CivicMutationSecurityEnvelope(humanContext({
    headers: headers({
      origin: 'https://evil.example',
      'sec-fetch-site': 'cross-site'
    }),
    session: {
      authenticated: true,
      accountId: 'acct_v6_mutator_001'
    },
    wallet: {
      serverVerified: false,
      subjectAccountId: 'acct_attacker_001'
    },
    owner: {
      ownerAccountId: 'acct_other_owner_001'
    },
    csrfVerified: false,
    idempotencyKey: 'bad key',
    surface: 'vote.record.rejected'
  }));

  assert.equal(report.allowed, false);
  assert.equal(report.failClosed, true);
  assert.match(report.errors.join(','), /FORBIDDEN_ORIGIN/);
  assert.match(report.errors.join(','), /WALLET_AUTH_REQUIRED/);
  assert.match(report.errors.join(','), /ACTOR_BINDING_REQUIRED/);
  assert.match(report.errors.join(','), /CSRF_REQUIRED/);
  assert.match(report.errors.join(','), /INVALID_IDEMPOTENCY_KEY/);
  assert.deepEqual(assertV6CivicMutationSecuritySafe(report), { ok: true, errors: [] });
});

test('V6 civic mutation security envelope allows delegated agent only with verified human authority', () => {
  const denied = buildV6CivicMutationSecurityEnvelope(humanContext({
    actor: {
      kind: 'agent',
      accountId: 'acct_v6_mutator_001',
      agentId: 'agent_v6_delegate_001'
    },
    surface: 'delegation.consume.denied',
    idempotencyKey: 'idem_v6_agent_denied'
  }));
  const allowed = buildV6CivicMutationSecurityEnvelope(humanContext({
    actor: {
      kind: 'agent',
      accountId: 'acct_v6_mutator_001',
      agentId: 'agent_v6_delegate_001'
    },
    delegation: {
      verified: true,
      expired: false,
      principalAccountId: 'acct_v6_mutator_001',
      delegateAgentId: 'agent_v6_delegate_001',
      approvalReceiptId: 'receipt_v6_agent_delegate_001'
    },
    surface: 'delegation.consume.allowed',
    idempotencyKey: 'idem_v6_agent_allowed'
  }));

  assert.equal(denied.allowed, false);
  assert.match(denied.errors.join(','), /ACTOR_BINDING_REQUIRED/);
  assert.deepEqual(assertV6CivicMutationSecuritySafe(denied), { ok: true, errors: [] });
  assert.equal(allowed.allowed, true);
  assert.deepEqual(assertV6CivicMutationSecuritySafe(allowed), { ok: true, errors: [] });
});

test('V6 civic mutation security envelope rate-limits by owner and surface', () => {
  const env = {
    NODE_ENV: 'production',
    WORLD_GRID_MUTATION_RATE_LIMIT_MAX: '1',
    WORLD_GRID_MUTATION_RATE_LIMIT_WINDOW_MS: '60000'
  };
  const first = buildV6CivicMutationSecurityEnvelope(humanContext({
    env,
    surface: 'public_works.contribution.rate_limit',
    idempotencyKey: 'idem_v6_rate_limit_a',
    nowMs: 1_779_790_100_000
  }));
  const second = buildV6CivicMutationSecurityEnvelope(humanContext({
    env,
    surface: 'public_works.contribution.rate_limit',
    idempotencyKey: 'idem_v6_rate_limit_b',
    nowMs: 1_779_790_100_001
  }));

  assert.equal(first.allowed, true);
  assert.equal(second.allowed, false);
  assert.match(second.errors.join(','), /RATE_LIMITED/);
  assert.equal(second.rateLimit.allowed, false);
  assert.deepEqual(assertV6CivicMutationSecuritySafe(second), { ok: true, errors: [] });
});
