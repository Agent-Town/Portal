const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { createCivicAuditLedger } = require('../server/world_civilization/audit_ledger');
const { createCivicDelegationStore } = require('../server/world_civilization/delegations');
const { REQUIRED_DEBUG_TABS } = require('../server/world_civilization/lab_surface');
const { createCivicProposalStore } = require('../server/world_civilization/proposals');
const { CIVIC_SCHEMA_VERSION } = require('../server/world_civilization/schemas');
const { createCivicVoteStore } = require('../server/world_civilization/votes');
const {
  V6_CIVIC_WORKER_VOTE_ADAPTER_VERSION,
  WORKER_ORIGIN,
  WORKER_VOTE_CAST_TOOL_NAME,
  WORKER_VOTE_ROUTE_SURFACE,
  castVoteFromWorkerTool
} = require('../server/world_civilization/worker_vote_adapter');
const { V6_WORLD_FEATURE_FLAG } = require('../server/world_grid/feature_flags');
const { WORLD_GRID_TOOLS } = require('../server/world_grid/routes');

const ACCOUNT_ID = 'acct_v6_worker_vote_001';
const AGENT_ID = 'agent_v6_worker_vote_001';

function withStores(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-worker-vote-'));
  const auditLedger = createCivicAuditLedger({ sqlitePath: path.join(dir, 'audit.sqlite') });
  const proposalStore = createCivicProposalStore({ sqlitePath: path.join(dir, 'proposals.sqlite'), auditLedger });
  const delegationStore = createCivicDelegationStore({ sqlitePath: path.join(dir, 'delegations.sqlite'), auditLedger });
  const voteStore = createCivicVoteStore({ sqlitePath: path.join(dir, 'votes.sqlite'), proposalStore, auditLedger });
  try {
    return fn({ auditLedger, delegationStore, proposalStore, voteStore });
  } finally {
    voteStore.close();
    proposalStore.close();
    delegationStore.close();
    auditLedger.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function proposal(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    proposalId: 'proposal_worker_vote_public_works_001',
    proposer: {
      kind: 'human',
      accountId: ACCOUNT_ID
    },
    scope: {
      kind: 'public_works',
      targetId: 'district_worker_vote_bridge'
    },
    affectedPublicState: ['public_works:worker_vote_bridge'],
    effectPreview: {
      effectType: 'public_works_accounting',
      mutationMode: 'preview_only',
      summary: 'Preview worker-vote public works accounting without applying it.'
    },
    moderationClass: 'public_works',
    expiresAtMs: 4_102_444_800_000,
    idempotencyKey: 'idem_worker_vote_proposal_001',
    rollbackPlan: {
      planId: 'rollbackplan_worker_vote_public_works_001',
      strategy: 'Restore previous worker-vote bridge snapshot.',
      canRollback: true,
      irreversibleEffects: [],
      maxRollbackMs: 86_400_000
    },
    privacy: {
      redacted: true,
      privateDataIncluded: false,
      dataClasses: ['public_profile', 'public_world_state']
    },
    ...overrides
  };
}

function moderationDecision(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    decisionId: 'moderation_worker_vote_proposal_001',
    subjectRef: 'proposal_worker_vote_public_works_001',
    surface: 'public_works',
    status: 'approved',
    policyVersion: 'policy_v6_worker_vote_001',
    reviewerKind: 'system',
    reasons: ['Public-safe worker vote proposal text.'],
    redactedFields: [],
    ...overrides
  };
}

function vote(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    voteId: 'vote_worker_tool_public_works_001',
    proposalId: 'proposal_worker_vote_public_works_001',
    voter: {
      kind: 'human',
      accountId: ACCOUNT_ID
    },
    choice: 'approve',
    authorization: {
      kind: 'server_attested_delegation',
      subjectAccountId: ACCOUNT_ID,
      serverVerified: true
    },
    eligibilityProof: {
      eligible: true,
      ruleId: 'rule_worker_tool_vote_001'
    },
    receiptId: 'receipt_worker_tool_vote_001',
    idempotencyKey: 'idem_worker_tool_vote_001',
    ...overrides
  };
}

function delegation(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    delegationId: 'delegation_worker_tool_vote_001',
    principalAccountId: ACCOUNT_ID,
    delegateAgentId: AGENT_ID,
    scope: 'vote_advice',
    expiresAtMs: 4_102_444_800_000,
    maxActions: 2,
    approvalReceiptId: 'receipt_worker_tool_vote_delegation_001',
    revocable: true,
    canExecuteCivicEffects: false,
    ...overrides
  };
}

function workerEvidence(overrides = {}) {
  return {
    origin: WORKER_ORIGIN,
    backendShortcut: false,
    skillContextLoaded: true,
    workerTrafficTrace: true,
    sessionContextLinked: true,
    sameOriginCsrfReviewed: true,
    debugTabsAvailable: [...REQUIRED_DEBUG_TABS],
    ...overrides
  };
}

function sameOriginHeaders(origin = 'https://agent-town.test') {
  return {
    origin,
    host: new URL(origin).host,
    'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'empty'
  };
}

function seedReadyProposalAndDelegation(stores) {
  stores.proposalStore.draftProposal(proposal(), { nowMs: 1_779_990_000_000 });
  stores.proposalStore.recordProposalReview(moderationDecision(), { nowMs: 1_779_990_100_000 });
  stores.delegationStore.recordDelegation(delegation(), { nowMs: 1_779_990_200_000 });
}

function invokeArgs(stores, overrides = {}) {
  return {
    toolName: WORKER_VOTE_CAST_TOOL_NAME,
    input: {
      actor: { agentId: AGENT_ID },
      vote: vote(),
      authorization: {
        kind: 'server_attested_delegation',
        subjectAccountId: ACCOUNT_ID,
        serverVerified: true
      },
      idempotencyKey: 'idem_worker_tool_vote_001',
      delegation: {
        delegationId: 'delegation_worker_tool_vote_001',
        principalAccountId: ACCOUNT_ID,
        delegateAgentId: AGENT_ID,
        approvalReceiptId: 'receipt_worker_tool_vote_delegation_001'
      },
      workerEvidence: workerEvidence()
    },
    identity: {
      accountId: ACCOUNT_ID,
      walletAddress: '0x0000000000000000000000000000000000000003'
    },
    proposalStore: stores.proposalStore,
    voteStore: stores.voteStore,
    delegationStore: stores.delegationStore,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    includeResearchWorkerVote: true,
    env: {
      NODE_ENV: 'production',
      V6_CIVIC_WORKER_VOTE_ADAPTER_ENABLED: '1',
      WORLD_GRID_MUTATION_RATE_LIMIT_MAX: '100',
      WORLD_GRID_MUTATION_RATE_LIMIT_WINDOW_MS: '60000'
    },
    headers: sameOriginHeaders(),
    nowMs: 1_779_991_000_000,
    ...overrides
  };
}

test('V6 worker vote adapter records receipt only through route-edge authorization', () => withStores((stores) => {
  seedReadyProposalAndDelegation(stores);

  const result = castVoteFromWorkerTool(invokeArgs(stores));
  const replay = castVoteFromWorkerTool(invokeArgs(stores));

  assert.equal(result.version, V6_CIVIC_WORKER_VOTE_ADAPTER_VERSION);
  assert.equal(result.ok, true);
  assert.equal(result.status, 'research_only');
  assert.equal(result.toolName, WORKER_VOTE_CAST_TOOL_NAME);
  assert.equal(result.routeSurface, WORKER_VOTE_ROUTE_SURFACE);
  assert.equal(result.runtimeExposed, false);
  assert.equal(result.playerVisible, false);
  assert.equal(result.normalGameplayExposure, false);
  assert.equal(result.recordsVote, true);
  assert.equal(result.appliesVoteOutcome, false);
  assert.equal(result.mutatesWorldState, false);
  assert.equal(result.mutatesPrivateTown, false);
  assert.equal(result.mutatesOtherUserWorld, false);
  assert.equal(result.executesProposalEffects, false);
  assert.equal(result.exposesCivicTools, false);
  assert.equal(result.exposesPrivateData, false);
  assert.equal(result.backendShortcut, false);
  assert.equal(result.executionStatus, 'not_executable');
  assert.equal(result.workerEvidence.origin, WORKER_ORIGIN);
  assert.deepEqual(result.workerEvidence.missingDebugTabs, []);
  assert.equal(result.routeAuthorization.authorized, true);
  assert.equal(result.routeAuthorization.routeSurface, WORKER_VOTE_ROUTE_SURFACE);
  assert.equal(result.routeAuthorization.recordsVote, false);
  assert.equal(result.routeAuthorization.appliesVoteOutcome, false);
  assert.equal(result.routeAuthorization.mutationSecurity.delegationProofStatus, 'valid');
  assert.equal(result.vote.voteId, 'vote_worker_tool_public_works_001');
  assert.equal(result.vote.voterAccountId, ACCOUNT_ID);
  assert.equal(result.vote.authorizationKind, 'server_attested_delegation');
  assert.equal(result.vote.eligibilityRuleId, 'rule_worker_tool_vote_001');
  assert.equal(replay.vote.duplicate, true);
  assert.equal(stores.voteStore.count(), 1);
  assert.equal(stores.auditLedger.replay().filter((row) => row.entry.actionType === 'vote.recorded').length, 1);

  const runtimeWorldToolNames = WORLD_GRID_TOOLS.map((tool) => tool.name);
  assert.equal(runtimeWorldToolNames.includes(WORKER_VOTE_CAST_TOOL_NAME), false);
}));

test('V6 worker vote adapter fails closed without explicit research gates', () => withStores((stores) => {
  seedReadyProposalAndDelegation(stores);

  assert.throws(
    () => castVoteFromWorkerTool(invokeArgs(stores, {
      includeResearchWorkerVote: false
    })),
    /V6_CIVIC_WORKER_VOTE_DISABLED/
  );
  assert.throws(
    () => castVoteFromWorkerTool(invokeArgs(stores, {
      env: { NODE_ENV: 'production' }
    })),
    /V6_CIVIC_WORKER_VOTE_DISABLED/
  );
  assert.equal(stores.voteStore.count(), 0);
  assert.equal(stores.auditLedger.replay().filter((row) => row.entry.actionType === 'vote.recorded').length, 0);
}));

test('V6 worker vote adapter requires the tool authorization envelope to match the vote', () => withStores((stores) => {
  seedReadyProposalAndDelegation(stores);

  assert.throws(
    () => castVoteFromWorkerTool(invokeArgs(stores, {
      input: {
        ...invokeArgs(stores).input,
        authorization: undefined
      }
    })),
    /V6_CIVIC_WORKER_VOTE_AUTHORIZATION_REQUIRED/
  );
  assert.throws(
    () => castVoteFromWorkerTool(invokeArgs(stores, {
      input: {
        ...invokeArgs(stores).input,
        authorization: {
          kind: 'wallet_session',
          subjectAccountId: ACCOUNT_ID,
          serverVerified: true
        }
      }
    })),
    /V6_CIVIC_WORKER_VOTE_AUTHORIZATION_MISMATCH/
  );
  assert.equal(stores.voteStore.count(), 0);
  assert.equal(stores.auditLedger.replay().filter((row) => row.entry.actionType === 'vote.recorded').length, 0);
}));

test('V6 worker vote adapter requires OpenClaw Lite observability before persistence', () => withStores((stores) => {
  seedReadyProposalAndDelegation(stores);

  assert.throws(
    () => castVoteFromWorkerTool(invokeArgs(stores, {
      input: {
        ...invokeArgs(stores).input,
        workerEvidence: workerEvidence({
          origin: 'backend_handler',
          backendShortcut: true,
          skillContextLoaded: false,
          workerTrafficTrace: false,
          sessionContextLinked: false,
          debugTabsAvailable: ['Worker Tools']
        })
      }
    })),
    /V6_CIVIC_WORKER_VOTE_OBSERVABILITY_REQUIRED/
  );
  assert.equal(stores.voteStore.count(), 0);
  assert.equal(stores.auditLedger.replay().filter((row) => row.entry.actionType === 'vote.recorded').length, 0);
}));

test('V6 worker vote adapter requires store-backed vote-advice delegation', () => withStores((stores) => {
  stores.proposalStore.draftProposal(proposal(), { nowMs: 1_779_990_000_000 });
  stores.proposalStore.recordProposalReview(moderationDecision(), { nowMs: 1_779_990_100_000 });

  assert.throws(
    () => castVoteFromWorkerTool(invokeArgs(stores)),
    /V6_CIVIC_WORKER_VOTE_AUTHORIZATION_DENIED/
  );
  assert.equal(stores.voteStore.count(), 0);
  assert.equal(stores.auditLedger.replay().filter((row) => row.entry.actionType === 'vote.recorded').length, 0);
}));

test('V6 worker vote adapter fails closed for unreviewed proposals and missing CSRF review', () => withStores((stores) => {
  stores.proposalStore.draftProposal(proposal(), { nowMs: 1_779_990_000_000 });
  stores.delegationStore.recordDelegation(delegation(), { nowMs: 1_779_990_200_000 });

  assert.throws(
    () => castVoteFromWorkerTool(invokeArgs(stores)),
    /V6_CIVIC_WORKER_VOTE_AUTHORIZATION_DENIED/
  );
  assert.equal(stores.voteStore.count(), 0);

  stores.proposalStore.recordProposalReview(moderationDecision(), { nowMs: 1_779_990_100_000 });
  try {
    castVoteFromWorkerTool(invokeArgs(stores, {
      input: {
        ...invokeArgs(stores).input,
        workerEvidence: workerEvidence({ sameOriginCsrfReviewed: false })
      }
    }));
    assert.fail('expected missing CSRF review to fail closed');
  } catch (error) {
    assert.equal(error.message, 'V6_CIVIC_WORKER_VOTE_AUTHORIZATION_DENIED');
    assert.match(error.details.routeAuthorization.mutationSecurity.errors.join(','), /CSRF_REQUIRED/);
  }
  assert.equal(stores.voteStore.count(), 0);
  assert.equal(stores.auditLedger.replay().filter((row) => row.entry.actionType === 'vote.recorded').length, 0);
}));
