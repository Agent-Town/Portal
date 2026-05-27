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
const {
  V6_CIVIC_WORKER_TOOL_ADAPTER_VERSION,
  WORKER_ORIGIN,
  WORKER_PROPOSAL_SUBMIT_TOOL_NAME,
  inspectWorkerEvidence,
  submitProposalForReviewFromWorkerTool
} = require('../server/world_civilization/worker_tool_adapter');
const { V6_WORLD_FEATURE_FLAG } = require('../server/world_grid/feature_flags');
const { WORLD_GRID_TOOLS } = require('../server/world_grid/routes');

const ACCOUNT_ID = 'acct_v6_worker_tool_001';
const AGENT_ID = 'agent_v6_worker_tool_001';

function withStores(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-worker-tool-'));
  const auditLedger = createCivicAuditLedger({ sqlitePath: path.join(dir, 'audit.sqlite') });
  const proposalStore = createCivicProposalStore({ sqlitePath: path.join(dir, 'proposals.sqlite'), auditLedger });
  const delegationStore = createCivicDelegationStore({ sqlitePath: path.join(dir, 'delegations.sqlite'), auditLedger });
  try {
    return fn({ auditLedger, delegationStore, proposalStore });
  } finally {
    delegationStore.close();
    proposalStore.close();
    auditLedger.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function proposal(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    proposalId: 'proposal_worker_tool_public_works_001',
    proposer: {
      kind: 'agent',
      accountId: ACCOUNT_ID,
      agentId: AGENT_ID
    },
    scope: {
      kind: 'public_works',
      targetId: 'district_worker_tool_bridge'
    },
    affectedPublicState: ['public_works:worker_tool_bridge'],
    effectPreview: {
      effectType: 'public_works_accounting',
      mutationMode: 'preview_only',
      summary: 'Preview worker-tool public works accounting without applying it.'
    },
    moderationClass: 'public_works',
    expiresAtMs: 4_102_444_800_000,
    idempotencyKey: 'idem_worker_tool_proposal_001',
    rollbackPlan: {
      planId: 'rollbackplan_worker_tool_public_works_001',
      strategy: 'Restore previous worker-tool bridge snapshot.',
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

function delegation(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    delegationId: 'delegation_worker_tool_proposal_001',
    principalAccountId: ACCOUNT_ID,
    delegateAgentId: AGENT_ID,
    scope: 'proposal_drafting',
    expiresAtMs: 4_102_444_800_000,
    maxActions: 2,
    approvalReceiptId: 'receipt_worker_tool_proposal_001',
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

function invokeArgs(stores, overrides = {}) {
  return {
    toolName: WORKER_PROPOSAL_SUBMIT_TOOL_NAME,
    input: {
      actor: { agentId: AGENT_ID },
      proposal: proposal(),
      approvalReceiptId: 'approval_worker_tool_proposal_001',
      idempotencyKey: 'idem_worker_tool_proposal_001',
      delegation: {
        delegationId: 'delegation_worker_tool_proposal_001',
        principalAccountId: ACCOUNT_ID,
        delegateAgentId: AGENT_ID,
        approvalReceiptId: 'receipt_worker_tool_proposal_001'
      },
      workerEvidence: workerEvidence()
    },
    identity: {
      accountId: ACCOUNT_ID,
      walletAddress: '0x0000000000000000000000000000000000000001'
    },
    proposalStore: stores.proposalStore,
    delegationStore: stores.delegationStore,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    includeResearchWorkerTool: true,
    env: {
      NODE_ENV: 'production',
      V6_CIVIC_WORKER_TOOL_ADAPTER_ENABLED: '1',
      WORLD_GRID_MUTATION_RATE_LIMIT_MAX: '100',
      WORLD_GRID_MUTATION_RATE_LIMIT_WINDOW_MS: '60000'
    },
    headers: sameOriginHeaders(),
    nowMs: 1_779_991_000_000,
    ...overrides
  };
}

test('V6 worker proposal tool adapter submits for review without runtime civic exposure', () => withStores((stores) => {
  stores.delegationStore.recordDelegation(delegation({ maxActions: 1 }), { nowMs: 1_779_990_000_000 });

  const result = submitProposalForReviewFromWorkerTool(invokeArgs(stores));
  const replay = submitProposalForReviewFromWorkerTool(invokeArgs(stores));
  const secondProposal = proposal({
    proposalId: 'proposal_worker_tool_public_works_002',
    idempotencyKey: 'idem_worker_tool_proposal_002',
    scope: {
      kind: 'public_works',
      targetId: 'district_worker_tool_bridge_002'
    },
    affectedPublicState: ['public_works:worker_tool_bridge_002'],
    rollbackPlan: {
      planId: 'rollbackplan_worker_tool_public_works_002',
      strategy: 'Restore previous worker-tool bridge snapshot.',
      canRollback: true,
      irreversibleEffects: [],
      maxRollbackMs: 86_400_000
    }
  });

  assert.equal(result.version, V6_CIVIC_WORKER_TOOL_ADAPTER_VERSION);
  assert.equal(result.ok, true);
  assert.equal(result.status, 'research_only');
  assert.equal(result.toolName, WORKER_PROPOSAL_SUBMIT_TOOL_NAME);
  assert.equal(result.runtimeExposed, false);
  assert.equal(result.playerVisible, false);
  assert.equal(result.normalGameplayExposure, false);
  assert.equal(result.mutatesWorldState, false);
  assert.equal(result.mutatesPrivateTown, false);
  assert.equal(result.mutatesOtherUserWorld, false);
  assert.equal(result.executesProposalEffects, false);
  assert.equal(result.exposesCivicTools, false);
  assert.equal(result.backendShortcut, false);
  assert.equal(result.executionStatus, 'not_executable');
  assert.equal(result.workerEvidence.origin, WORKER_ORIGIN);
  assert.deepEqual(result.workerEvidence.missingDebugTabs, []);
  assert.equal(result.proposal.proposalId, 'proposal_worker_tool_public_works_001');
  assert.equal(result.proposal.status, 'drafted');
  assert.equal(result.proposal.moderationStatus, 'needs_review');
  assert.equal(result.proposal.proposerKind, 'agent');
  assert.equal(result.proposal.proposerAgentId, AGENT_ID);
  assert.equal(result.submissionEnvelope.accepted, true);
  assert.equal(result.submissionEnvelope.sourceSurface, 'worker_tool_submission');
  assert.equal(result.submissionEnvelope.mutationSecurity.ok, true);
  assert.equal(result.submissionEnvelope.workerEvidence.origin, WORKER_ORIGIN);
  assert.equal(replay.proposal.duplicate, true);
  assert.equal(result.delegatedActionUse.usageId, 'delegationuse_proposal_worker_tool_public_works_001');
  assert.equal(result.delegatedActionUse.delegationId, 'delegation_worker_tool_proposal_001');
  assert.equal(result.delegatedActionUse.principalAccountId, ACCOUNT_ID);
  assert.equal(result.delegatedActionUse.delegateAgentId, AGENT_ID);
  assert.equal(result.delegatedActionUse.scope, 'proposal_drafting');
  assert.equal(result.delegatedActionUse.actionRef, 'proposal_worker_tool_public_works_001');
  assert.equal(result.delegatedActionUse.idempotencyKey, 'idem_worker_tool_proposal_001');
  assert.equal(result.delegatedActionUse.duplicate, false);
  assert.equal(replay.delegatedActionUse.duplicate, true);
  assert.equal(stores.proposalStore.count(), 1);
  assert.equal(stores.auditLedger.replay().filter((row) => row.entry.actionType === 'proposal.created').length, 1);
  assert.equal(stores.auditLedger.replay().filter((row) => row.entry.actionType === 'delegation.action_consumed').length, 1);
  assert.equal(stores.delegationStore.listDelegatedActionUses({
    delegationId: 'delegation_worker_tool_proposal_001'
  }).length, 1);
  const policy = stores.delegationStore.getAgentParticipationPolicy({
    principalAccountId: ACCOUNT_ID,
    delegateAgentId: AGENT_ID,
    atMs: 1_779_991_000_001
  });
  assert.equal(policy.remainingActionBudgetByScope.proposal_drafting, undefined);
  assert.throws(
    () => submitProposalForReviewFromWorkerTool(invokeArgs(stores, {
      input: {
        ...invokeArgs(stores).input,
        proposal: secondProposal,
        idempotencyKey: 'idem_worker_tool_proposal_002'
      }
    })),
    /CIVIC_PROPOSAL_SUBMISSION_DENIED/
  );
  assert.equal(stores.proposalStore.count(), 1);
  assert.equal(stores.delegationStore.listDelegatedActionUses({
    delegationId: 'delegation_worker_tool_proposal_001'
  }).length, 1);

  const runtimeWorldToolNames = WORLD_GRID_TOOLS.map((tool) => tool.name);
  assert.equal(runtimeWorldToolNames.includes(WORKER_PROPOSAL_SUBMIT_TOOL_NAME), false);
}));

test('V6 worker proposal tool adapter fails closed without explicit research gates', () => withStores((stores) => {
  stores.delegationStore.recordDelegation(delegation(), { nowMs: 1_779_990_000_000 });

  assert.throws(
    () => submitProposalForReviewFromWorkerTool(invokeArgs(stores, {
      includeResearchWorkerTool: false
    })),
    /V6_CIVIC_WORKER_TOOL_DISABLED/
  );
  assert.throws(
    () => submitProposalForReviewFromWorkerTool(invokeArgs(stores, {
      env: { NODE_ENV: 'production' }
    })),
    /V6_CIVIC_WORKER_TOOL_DISABLED/
  );
  assert.equal(stores.proposalStore.count(), 0);
  assert.equal(stores.auditLedger.replay().filter((row) => row.entry.actionType === 'proposal.created').length, 0);
}));

test('V6 worker proposal tool adapter requires OpenClaw Lite observability before persistence', () => withStores((stores) => {
  stores.delegationStore.recordDelegation(delegation(), { nowMs: 1_779_990_000_000 });

  const report = inspectWorkerEvidence(workerEvidence({
    origin: 'backend_handler',
    backendShortcut: true,
    skillContextLoaded: false,
    workerTrafficTrace: false,
    sessionContextLinked: false,
    debugTabsAvailable: ['Worker Tools']
  }));
  assert.equal(report.ok, false);
  assert.deepEqual(report.missingDebugTabs, ['Skill Context', 'Worker Traffic', 'Brain', 'Session Context']);

  assert.throws(
    () => submitProposalForReviewFromWorkerTool(invokeArgs(stores, {
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
    /V6_CIVIC_WORKER_TOOL_OBSERVABILITY_REQUIRED/
  );
  assert.equal(stores.proposalStore.count(), 0);
  assert.equal(stores.auditLedger.replay().filter((row) => row.entry.actionType === 'proposal.created').length, 0);
}));

test('V6 worker proposal tool adapter requires store-backed proposal drafting delegation', () => withStores((stores) => {
  assert.throws(
    () => submitProposalForReviewFromWorkerTool(invokeArgs(stores)),
    /CIVIC_PROPOSAL_SUBMISSION_DENIED/
  );
  assert.equal(stores.proposalStore.count(), 0);
  assert.equal(stores.auditLedger.replay().filter((row) => row.entry.actionType === 'proposal.created').length, 0);
}));
