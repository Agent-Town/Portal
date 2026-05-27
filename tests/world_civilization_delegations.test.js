const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { V6_WORLD_FEATURE_FLAG, parseWorldGridFeatureFlags } = require('../server/world_grid/feature_flags');
const { CIVIC_SCHEMA_VERSION } = require('../server/world_civilization/schemas');
const { createCivicAuditLedger } = require('../server/world_civilization/audit_ledger');
const {
  DELEGATION_STATUS_ACTIVE,
  DELEGATION_STATUS_REVOKED,
  REQUIRED_AGENT_PARTICIPATION_ENFORCEMENT_CHECKS,
  REQUIRED_AGENT_PARTICIPATION_EVIDENCE_CHECKS,
  REQUIRED_DELEGATION_ROUTE_SURFACES,
  V6_AGENT_PARTICIPATION_ENFORCEMENT_GATE_VERSION,
  assertV6AgentParticipationEnforcementGateSafe,
  buildV6AgentParticipationEnforcementGate,
  createCivicDelegationStore
} = require('../server/world_civilization/delegations');

function withTempDelegationStore(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-delegations-'));
  const sqlitePath = path.join(dir, 'delegations.sqlite');
  const auditSqlitePath = path.join(dir, 'audit.sqlite');
  const auditLedger = createCivicAuditLedger({ sqlitePath: auditSqlitePath });
  const store = createCivicDelegationStore({ sqlitePath, auditLedger });
  try {
    return fn({ auditLedger, auditSqlitePath, sqlitePath, store });
  } finally {
    store.close();
    auditLedger.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function delegation(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    delegationId: 'delegation_vote_advice_001',
    principalAccountId: 'acct_v6_human_001',
    delegateAgentId: 'agent_civic_clover_001',
    scope: 'vote_advice',
    expiresAtMs: 4_102_444_800_000,
    maxActions: 3,
    approvalReceiptId: 'receipt_delegate_vote_advice_001',
    revocable: true,
    canExecuteCivicEffects: false,
    ...overrides
  };
}

function delegatedActionUse(overrides = {}) {
  return {
    usageId: 'delegationuse_vote_advice_001',
    delegationId: 'delegation_vote_advice_001',
    principalAccountId: 'acct_v6_human_001',
    delegateAgentId: 'agent_civic_clover_001',
    scope: 'vote_advice',
    actionRef: 'action_vote_advice_001',
    idempotencyKey: 'idem_vote_advice_use_001',
    ...overrides
  };
}

function agentParticipationEnforcementEvidence(overrides = {}) {
  return {
    status: 'complete',
    executionStatus: 'not_executable',
    runtimeExposed: false,
    playerVisible: false,
    mutatesWorldState: false,
    delegatedExecutionEnabled: false,
    workerToolEnforced: true,
    routeEdgeEnforced: true,
    lifecycleControlsEnforced: true,
    routeSurfaces: [...REQUIRED_DELEGATION_ROUTE_SURFACES],
    checks: [...REQUIRED_AGENT_PARTICIPATION_EVIDENCE_CHECKS],
    ...overrides
  };
}

test('V6 agent participation enforcement gate is hidden without explicit research opt-in and V6 flag', () => {
  const noResearchOptIn = buildV6AgentParticipationEnforcementGate({
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence: agentParticipationEnforcementEvidence()
  });
  const broadV5Override = buildV6AgentParticipationEnforcementGate({
    includeResearchDelegationEnforcement: true,
    featureFlags: parseWorldGridFeatureFlags('all'),
    evidence: agentParticipationEnforcementEvidence()
  });

  for (const report of [noResearchOptIn, broadV5Override]) {
    assert.equal(report.version, V6_AGENT_PARTICIPATION_ENFORCEMENT_GATE_VERSION);
    assert.equal(report.available, false);
    assert.equal(report.researchReady, false);
    assert.equal(report.releaseReady, false);
    assert.equal(report.failClosed, true);
    assert.equal(report.runtimeExposed, false);
    assert.equal(report.playerVisible, false);
    assert.equal(report.mutatesWorldState, false);
    assert.equal(report.delegatedExecutionEnabled, false);
    assert.equal(report.executionStatus, 'not_executable');
    assert.deepEqual(assertV6AgentParticipationEnforcementGateSafe(report), { ok: true, errors: [] });
  }
});

test('V6 agent participation enforcement gate records route-edge lifecycle evidence without execution', () => {
  const report = buildV6AgentParticipationEnforcementGate({
    includeResearchDelegationEnforcement: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    source: 'node_test',
    evidence: agentParticipationEnforcementEvidence()
  });

  assert.equal(report.available, true);
  assert.equal(report.researchReady, true);
  assert.equal(report.releaseReady, false);
  assert.equal(report.failClosed, false);
  assert.equal(report.runtimeExposed, false);
  assert.equal(report.playerVisible, false);
  assert.equal(report.mutatesWorldState, false);
  assert.equal(report.delegatedExecutionEnabled, false);
  assert.equal(report.executionStatus, 'not_executable');
  assert.deepEqual(report.checks.map((entry) => entry.key), REQUIRED_AGENT_PARTICIPATION_ENFORCEMENT_CHECKS);
  assert.deepEqual(report.evidence.requiredChecks, REQUIRED_AGENT_PARTICIPATION_EVIDENCE_CHECKS);
  assert.deepEqual(report.evidence.missingChecks, []);
  assert.deepEqual(report.evidence.requiredRouteSurfaces, REQUIRED_DELEGATION_ROUTE_SURFACES);
  assert.deepEqual(report.evidence.missingRouteSurfaces, []);
  assert.deepEqual(assertV6AgentParticipationEnforcementGateSafe(report), { ok: true, errors: [] });
});

test('V6 agent participation enforcement gate fails closed without route-edge budget and revocation evidence', () => {
  const report = buildV6AgentParticipationEnforcementGate({
    includeResearchDelegationEnforcement: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence: agentParticipationEnforcementEvidence({
      checks: [
        'worker_tool_scope_enforcement',
        'route_edge_scope_check',
        'store_backed_delegation_proof',
        'no_backend_shortcuts',
        'no_public_autonomous_mutation'
      ],
      routeSurfaces: ['proposal_drafting'],
      routeEdgeEnforced: false,
      lifecycleControlsEnforced: false
    })
  });

  assert.equal(report.researchReady, false);
  assert.equal(report.releaseReady, false);
  assert.equal(report.failClosed, true);
  assert.deepEqual(report.evidence.missingChecks, [
    'route_edge_expiry_check',
    'route_edge_budget_check',
    'route_edge_revocation_check',
    'principal_wallet_session_binding',
    'idempotent_budget_consumption',
    'delegation_audit_rows'
  ]);
  assert.deepEqual(report.evidence.missingRouteSurfaces, ['vote_advice', 'civic_execution']);
  assert.match(report.errors.join(','), /AGENT_PARTICIPATION_ENFORCEMENT_EVIDENCE_REQUIRED/);
  assert.match(report.errors.join(','), /AGENT_PARTICIPATION_ROUTE_EDGE_AUTHORIZATION_REQUIRED/);
  assert.match(report.errors.join(','), /AGENT_PARTICIPATION_LIFECYCLE_CONTROLS_REQUIRED/);
  assert.deepEqual(assertV6AgentParticipationEnforcementGateSafe(report), { ok: true, errors: [] });
});

test('V6 agent participation enforcement gate assertion rejects public delegated execution drift', () => {
  const report = buildV6AgentParticipationEnforcementGate({
    includeResearchDelegationEnforcement: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence: agentParticipationEnforcementEvidence()
  });
  const unsafe = {
    ...report,
    releaseReady: true,
    runtimeExposed: true,
    playerVisible: true,
    normalGameplayExposure: true,
    mutatesWorldState: true,
    delegatedExecutionEnabled: true,
    executionStatus: 'executes',
    evidence: {
      ...report.evidence,
      ok: false,
      runtimeExposed: true,
      playerVisible: true,
      mutatesWorldState: true,
      delegatedExecutionEnabled: true
    }
  };
  const result = assertV6AgentParticipationEnforcementGateSafe(unsafe);

  assert.equal(result.ok, false);
  assert.match(result.errors.join(','), /V6_AGENT_PARTICIPATION_ENFORCEMENT_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_AGENT_PARTICIPATION_ENFORCEMENT_PLAYER_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_AGENT_PARTICIPATION_ENFORCEMENT_NORMAL_GAMEPLAY_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_AGENT_PARTICIPATION_ENFORCEMENT_WORLD_MUTATION_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_AGENT_PARTICIPATION_ENFORCEMENT_DELEGATED_EXECUTION_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_AGENT_PARTICIPATION_ENFORCEMENT_NON_EXECUTING_REQUIRED/);
  assert.match(result.errors.join(','), /V6_AGENT_PARTICIPATION_ENFORCEMENT_RELEASE_READY_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_AGENT_PARTICIPATION_ENFORCEMENT_EVIDENCE_WORLD_MUTATION_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_AGENT_PARTICIPATION_ENFORCEMENT_READY_WITHOUT_EVIDENCE/);
});

test('V6 delegation store records scoped agent participation without execution authority', () => withTempDelegationStore(({ auditLedger, store }) => {
  const row = store.recordDelegation(delegation(), { nowMs: 1_779_784_000_000 });
  const policy = store.getAgentParticipationPolicy({
    principalAccountId: 'acct_v6_human_001',
    delegateAgentId: 'agent_civic_clover_001',
    atMs: 1_779_784_100_000
  });
  const summary = store.summarizePrincipalDelegations('acct_v6_human_001', { atMs: 1_779_784_100_000 });

  assert.equal(row.delegationId, 'delegation_vote_advice_001');
  assert.equal(row.status, DELEGATION_STATUS_ACTIVE);
  assert.equal(row.canExecuteCivicEffects, false);
  assert.deepEqual(policy.allowedScopes, ['vote_advice']);
  assert.deepEqual(policy.activeDelegationIds, ['delegation_vote_advice_001']);
  assert.equal(policy.civicExecutionAllowed, false);
  assert.equal(policy.remainingActionBudgetByScope.vote_advice, 3);
  assert.equal(policy.executionStatus, 'not_executable');
  assert.equal(summary.activeCount, 1);
  assert.equal(summary.byScope.vote_advice.active, 1);
  assert.equal(summary.executionStatus, 'not_executable');
  assert.equal(typeof store.applyDelegation, 'undefined');
  assert.equal(typeof store.executeDelegatedAction, 'undefined');

  const audit = auditLedger.getByEntryId('audit_delegation_vote_advice_001');
  assert.equal(audit.entry.actionType, 'delegation.created');
  assert.equal(audit.entry.actor.accountId, 'acct_v6_human_001');
  assert.equal(audit.entry.objectRef, 'delegation_vote_advice_001');
}));

test('V6 delegation store consumes action budgets idempotently without execution', () => withTempDelegationStore(({
  auditLedger,
  store
}) => {
  store.recordDelegation(delegation(), { nowMs: 1_779_784_000_000 });
  const first = store.consumeDelegatedAction(delegatedActionUse(), { nowMs: 1_779_784_010_000 });
  const duplicate = store.consumeDelegatedAction(delegatedActionUse(), { nowMs: 1_779_784_011_000 });
  const second = store.consumeDelegatedAction(delegatedActionUse({
    usageId: 'delegationuse_vote_advice_002',
    actionRef: 'action_vote_advice_002',
    idempotencyKey: 'idem_vote_advice_use_002'
  }), { nowMs: 1_779_784_012_000 });
  const third = store.consumeDelegatedAction(delegatedActionUse({
    usageId: 'delegationuse_vote_advice_003',
    actionRef: 'action_vote_advice_003',
    idempotencyKey: 'idem_vote_advice_use_003'
  }), { nowMs: 1_779_784_013_000 });
  const policy = store.getAgentParticipationPolicy({
    principalAccountId: 'acct_v6_human_001',
    delegateAgentId: 'agent_civic_clover_001',
    atMs: 1_779_784_014_000
  });
  const summary = store.summarizePrincipalDelegations('acct_v6_human_001', { atMs: 1_779_784_014_000 });

  assert.equal(first.usageId, 'delegationuse_vote_advice_001');
  assert.equal(first.auditEntryId, 'audit_delegationuse_vote_advice_001');
  assert.equal(duplicate.duplicate, true);
  assert.equal(second.usageId, 'delegationuse_vote_advice_002');
  assert.equal(third.usageId, 'delegationuse_vote_advice_003');
  assert.equal(store.listDelegatedActionUses({ delegationId: 'delegation_vote_advice_001' }).length, 3);
  assert.deepEqual(policy.allowedScopes, []);
  assert.deepEqual(policy.activeDelegationIds, ['delegation_vote_advice_001']);
  assert.equal(policy.remainingActionBudgetByScope.vote_advice, undefined);
  assert.equal(policy.executionStatus, 'not_executable');
  assert.equal(summary.consumedActionCount, 3);
  assert.equal(summary.remainingActionBudgetByScope.vote_advice, 0);
  assert.equal(summary.executionStatus, 'not_executable');
  assert.equal(typeof store.executeDelegatedAction, 'undefined');
  assert.equal(typeof store.applyDelegation, 'undefined');
  assert.deepEqual(
    auditLedger.replay().map((row) => row.entry.actionType),
    [
      'delegation.created',
      'delegation.action_consumed',
      'delegation.action_consumed',
      'delegation.action_consumed'
    ]
  );
  assert.throws(
    () => store.consumeDelegatedAction(delegatedActionUse({
      usageId: 'delegationuse_vote_advice_004',
      actionRef: 'action_vote_advice_004',
      idempotencyKey: 'idem_vote_advice_use_004'
    }), { nowMs: 1_779_784_015_000 }),
    /CIVIC_DELEGATION_ACTION_BUDGET_EXHAUSTED/
  );
  assert.throws(
    () => store.consumeDelegatedAction(delegatedActionUse({
      usageId: 'delegationuse_vote_advice_private_001',
      idempotencyKey: 'idem_vote_advice_private_001',
      debugTrace: {
        token: 'sk-test-secret-value'
      }
    }), { nowMs: 1_779_784_016_000 }),
    /CIVIC_DELEGATION_USAGE_INVALID/
  );
  assert.throws(
    () => store.consumeDelegatedAction(delegatedActionUse({
      usageId: 'delegationuse_vote_advice_conflict_001',
      actionRef: 'action_vote_advice_conflict_001'
    }), { nowMs: 1_779_784_017_000 }),
    /CIVIC_DELEGATION_USAGE_IDEMPOTENCY_CONFLICT/
  );
}));

test('V6 delegation usage rejects inactive, mismatched, expired, and missing delegations', () => withTempDelegationStore(({
  store
}) => {
  assert.throws(
    () => store.consumeDelegatedAction(delegatedActionUse(), { nowMs: 1_779_784_010_000 }),
    /CIVIC_DELEGATION_USAGE_DELEGATION_REQUIRED/
  );

  store.recordDelegation(delegation(), { nowMs: 1_779_784_000_000 });
  assert.throws(
    () => store.consumeDelegatedAction(delegatedActionUse({
      usageId: 'delegationuse_wrong_principal_001',
      principalAccountId: 'acct_attacker_001',
      idempotencyKey: 'idem_wrong_principal_001'
    }), { nowMs: 1_779_784_010_000 }),
    /CIVIC_DELEGATION_USAGE_PRINCIPAL_MISMATCH/
  );
  assert.throws(
    () => store.consumeDelegatedAction(delegatedActionUse({
      usageId: 'delegationuse_wrong_agent_001',
      delegateAgentId: 'agent_attacker_001',
      idempotencyKey: 'idem_wrong_agent_001'
    }), { nowMs: 1_779_784_010_000 }),
    /CIVIC_DELEGATION_USAGE_AGENT_MISMATCH/
  );
  assert.throws(
    () => store.consumeDelegatedAction(delegatedActionUse({
      usageId: 'delegationuse_wrong_scope_001',
      scope: 'proposal_drafting',
      idempotencyKey: 'idem_wrong_scope_001'
    }), { nowMs: 1_779_784_010_000 }),
    /CIVIC_DELEGATION_USAGE_SCOPE_MISMATCH/
  );
  store.revokeDelegation('delegation_vote_advice_001', {
    principalAccountId: 'acct_v6_human_001',
    nowMs: 1_779_784_020_000
  });
  assert.throws(
    () => store.consumeDelegatedAction(delegatedActionUse({
      usageId: 'delegationuse_revoked_001',
      idempotencyKey: 'idem_revoked_001'
    }), { nowMs: 1_779_784_030_000 }),
    /CIVIC_DELEGATION_USAGE_INACTIVE/
  );

  store.recordDelegation(delegation({
    delegationId: 'delegation_short_001',
    approvalReceiptId: 'receipt_delegate_short_001',
    expiresAtMs: 1_779_784_050_000
  }), { nowMs: 1_779_784_040_000 });
  assert.throws(
    () => store.consumeDelegatedAction(delegatedActionUse({
      usageId: 'delegationuse_expired_001',
      delegationId: 'delegation_short_001',
      idempotencyKey: 'idem_expired_001'
    }), { nowMs: 1_779_784_060_000 }),
    /CIVIC_DELEGATION_USAGE_EXPIRED/
  );
}));

test('V6 delegation store enforces receipt idempotency and scoped execution permission', () => withTempDelegationStore(({ auditLedger, store }) => {
  const first = store.recordDelegation(delegation(), { nowMs: 1_779_784_000_000 });
  const duplicate = store.recordDelegation(delegation(), { nowMs: 1_779_784_001_000 });

  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.delegationId, first.delegationId);
  assert.equal(store.count(), 1);
  assert.equal(auditLedger.count(), 1);
  assert.throws(
    () => store.recordDelegation(delegation({
      delegationId: 'delegation_vote_advice_002',
      scope: 'proposal_drafting'
    }), { nowMs: 1_779_784_002_000 }),
    /CIVIC_DELEGATION_RECEIPT_CONFLICT/
  );
  assert.throws(
    () => store.recordDelegation(delegation({
      delegationId: 'delegation_civic_execution_001',
      scope: 'civic_execution',
      approvalReceiptId: 'receipt_delegate_execution_001'
    }), { nowMs: 1_779_784_003_000 }),
    /CIVIC_DELEGATION_EXECUTION_PERMISSION_REQUIRED/
  );
  assert.throws(
    () => store.recordDelegation(delegation({
      delegationId: 'delegation_expired_001',
      approvalReceiptId: 'receipt_delegate_expired_001',
      expiresAtMs: 1_000
    }), { nowMs: 2_000 }),
    /CIVIC_DELEGATION_EXPIRED/
  );
  assert.throws(
    () => store.recordDelegation(delegation({
      delegationId: 'delegation_private_001',
      approvalReceiptId: 'receipt_delegate_private_001',
      debugTrace: {
        token: 'sk-test-secret-value'
      }
    }), { nowMs: 1_779_784_004_000 }),
    /CIVIC_DELEGATION_INVALID/
  );
  assert.equal(store.count(), 1);
  assert.equal(auditLedger.count(), 1);
}));

test('V6 delegation store revokes scoped authority with principal-owned audit', () => withTempDelegationStore(({ auditLedger, store }) => {
  store.recordDelegation(delegation(), { nowMs: 1_779_784_000_000 });
  assert.throws(
    () => store.revokeDelegation('delegation_vote_advice_001', {
      principalAccountId: 'acct_attacker_001',
      nowMs: 1_779_784_010_000
    }),
    /CIVIC_DELEGATION_REVOKE_PRINCIPAL_MISMATCH/
  );

  const revoked = store.revokeDelegation('delegation_vote_advice_001', {
    principalAccountId: 'acct_v6_human_001',
    nowMs: 1_779_784_020_000
  });
  const duplicate = store.revokeDelegation('delegation_vote_advice_001', {
    principalAccountId: 'acct_v6_human_001',
    nowMs: 1_779_784_030_000
  });
  const policy = store.getAgentParticipationPolicy({
    principalAccountId: 'acct_v6_human_001',
    delegateAgentId: 'agent_civic_clover_001',
    atMs: 1_779_784_040_000
  });

  assert.equal(revoked.status, DELEGATION_STATUS_REVOKED);
  assert.equal(revoked.revokeAuditEntryId, 'audit_delegation_vote_advice_001_revoked');
  assert.equal(duplicate.duplicate, true);
  assert.deepEqual(policy.allowedScopes, []);
  assert.deepEqual(policy.revokedDelegationIds, ['delegation_vote_advice_001']);
  assert.deepEqual(
    auditLedger.replay().map((row) => row.entry.actionType),
    ['delegation.created', 'delegation.revoked']
  );
}));

test('V6 delegation store persists policies and tracks civic execution delegation separately', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-delegations-persist-'));
  const sqlitePath = path.join(dir, 'delegations.sqlite');
  const auditSqlitePath = path.join(dir, 'audit.sqlite');
  try {
    const auditLedger = createCivicAuditLedger({ sqlitePath: auditSqlitePath });
    const store = createCivicDelegationStore({ sqlitePath, auditLedger });
    store.recordDelegation(delegation(), { nowMs: 1_779_784_000_000 });
    store.recordDelegation(delegation({
      delegationId: 'delegation_civic_execution_001',
      scope: 'civic_execution',
      maxActions: 1,
      approvalReceiptId: 'receipt_delegate_execution_001',
      canExecuteCivicEffects: true
    }), { nowMs: 1_779_784_010_000 });
    store.close();
    auditLedger.close();

    const reopenedAudit = createCivicAuditLedger({ sqlitePath: auditSqlitePath });
    const reopened = createCivicDelegationStore({ sqlitePath, auditLedger: reopenedAudit });
    assert.equal(reopened.count(), 2);
    assert.equal(reopened.getDelegation('delegation_civic_execution_001').canExecuteCivicEffects, true);
    assert.deepEqual(
      reopened.listDelegations({ principalAccountId: 'acct_v6_human_001' }).map((row) => row.delegationId),
      ['delegation_vote_advice_001', 'delegation_civic_execution_001']
    );
    const policy = reopened.getAgentParticipationPolicy({
      principalAccountId: 'acct_v6_human_001',
      delegateAgentId: 'agent_civic_clover_001',
      atMs: 1_779_784_020_000
    });
    assert.deepEqual(policy.allowedScopes, ['vote_advice', 'civic_execution']);
    assert.equal(policy.civicExecutionAllowed, true);
    assert.equal(policy.remainingActionBudgetByScope.civic_execution, 1);
    assert.equal(policy.executionStatus, 'not_executable');

    const summary = reopened.summarizePrincipalDelegations('acct_v6_human_001', { atMs: 1_779_784_020_000 });
    assert.equal(summary.activeCount, 2);
    assert.equal(summary.civicExecutionDelegationCount, 1);
    assert.equal(reopenedAudit.replay({ objectRef: 'delegation_civic_execution_001' })[0].entry.actionType, 'delegation.created');
    reopened.close();
    reopenedAudit.close();
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
