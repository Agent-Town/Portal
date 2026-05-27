const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const express = require('express');

const { createCivicAuditLedger } = require('../server/world_civilization/audit_ledger');
const { createCivicDelegationStore } = require('../server/world_civilization/delegations');
const { createCivicProposalStore } = require('../server/world_civilization/proposals');
const { createCivicVoteStore } = require('../server/world_civilization/votes');
const {
  PROPOSAL_SUBMISSION_ROUTE,
  VOTE_CAST_ROUTE,
  createWorldCivilizationRouter
} = require('../server/world_civilization/routes');
const { CIVIC_SCHEMA_VERSION } = require('../server/world_civilization/schemas');
const {
  closeConfiguredWorldCivilizationVoteStores,
  closeConfiguredWorldCivilizationProposalStores,
  getConfiguredWorldCivilizationProposalStores,
  getConfiguredWorldCivilizationVoteStores
} = require('../server/world_civilization/store_wiring');
const { closeWorldGridRateLimitStore } = require('../server/world_grid/rate_limit');

const ACCOUNT_ID = 'acct_v6_route_human_001';
const AGENT_ID = 'agent_v6_route_delegate_001';

function proposal(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    proposalId: 'proposal_route_public_works_001',
    proposer: {
      kind: 'human',
      accountId: ACCOUNT_ID
    },
    scope: {
      kind: 'public_works',
      targetId: 'district_route_bridge'
    },
    affectedPublicState: ['public_works:route_bridge'],
    effectPreview: {
      effectType: 'public_works_accounting',
      mutationMode: 'preview_only',
      summary: 'Preview route bridge accounting without applying it.'
    },
    moderationClass: 'public_works',
    expiresAtMs: 4_102_444_800_000,
    idempotencyKey: 'idem_route_proposal_001',
    rollbackPlan: {
      planId: 'rollbackplan_route_public_works_001',
      strategy: 'Restore previous route bridge snapshot.',
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
    delegationId: 'delegation_route_proposal_001',
    principalAccountId: ACCOUNT_ID,
    delegateAgentId: AGENT_ID,
    scope: 'proposal_drafting',
    expiresAtMs: 4_102_444_800_000,
    maxActions: 2,
    approvalReceiptId: 'receipt_route_agent_proposal_001',
    revocable: true,
    canExecuteCivicEffects: false,
    ...overrides
  };
}

function vote(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    voteId: 'vote_route_public_works_001',
    proposalId: 'proposal_route_public_works_001',
    voter: {
      kind: 'human',
      accountId: ACCOUNT_ID
    },
    choice: 'approve',
    authorization: {
      kind: 'wallet_session',
      subjectAccountId: ACCOUNT_ID,
      serverVerified: true
    },
    eligibilityProof: {
      eligible: true,
      ruleId: 'rule_route_public_works_voter_001'
    },
    receiptId: 'receipt_vote_route_public_works_001',
    idempotencyKey: 'idem_vote_route_public_works_001',
    ...overrides
  };
}

function moderationDecision(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    decisionId: 'moderation_route_public_works_001',
    subjectRef: 'proposal_route_public_works_001',
    surface: 'public_works',
    status: 'approved',
    policyVersion: 'policy_v6_route_public_works_001',
    reviewerKind: 'system',
    reasons: ['Public-safe route proposal text.'],
    redactedFields: [],
    ...overrides
  };
}

function sameOriginHeaders(baseUrl, extra = {}) {
  return {
    'content-type': 'application/json',
    origin: baseUrl,
    'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'empty',
    'x-v6-civic-csrf-reviewed': '1',
    ...extra
  };
}

async function postJson(baseUrl, route, body, headers = {}) {
  const response = await fetch(`${baseUrl}${route}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  });
  return {
    status: response.status,
    body: await response.json()
  };
}

async function withCivilizationServer({
  env = {},
  proposalStore = null,
  voteStore = null,
  delegationStore = null,
  resolveProposalStores = null,
  resolveVoteStores = null,
  resolveCivicIdentity = () => ({
    accountId: ACCOUNT_ID,
    walletAddress: '0x0000000000000000000000000000000000000001'
  })
} = {}, fn) {
  const app = express();
  app.use(express.json());
  app.use(createWorldCivilizationRouter({
    proposalStore,
    voteStore,
    delegationStore,
    resolveProposalStores,
    resolveVoteStores,
    resolveCivicIdentity,
    env
  }));
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    return await fn(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    closeWorldGridRateLimitStore();
    closeConfiguredWorldCivilizationProposalStores();
    closeConfiguredWorldCivilizationVoteStores();
  }
}

async function withStores(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-civic-routes-'));
  const auditLedger = createCivicAuditLedger({ sqlitePath: path.join(dir, 'audit.sqlite') });
  const proposalStore = createCivicProposalStore({ sqlitePath: path.join(dir, 'proposals.sqlite'), auditLedger });
  const delegationStore = createCivicDelegationStore({ sqlitePath: path.join(dir, 'delegations.sqlite'), auditLedger });
  const voteStore = createCivicVoteStore({ sqlitePath: path.join(dir, 'votes.sqlite'), proposalStore, auditLedger });
  try {
    return await fn({ auditLedger, delegationStore, proposalStore, voteStore });
  } finally {
    voteStore.close();
    proposalStore.close();
    delegationStore.close();
    auditLedger.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function routeEnv(overrides = {}) {
  return {
    NODE_ENV: 'production',
    V6_CIVIC_PROPOSAL_SUBMISSION_ROUTE_ENABLED: '1',
    V6_CIVIC_VOTE_ROUTE_ENABLED: '1',
    FEATURE_WORLD_V60_AGENT_CIVILIZATION: '1',
    WORLD_GRID_MUTATION_RATE_LIMIT_MAX: '100',
    WORLD_GRID_MUTATION_RATE_LIMIT_WINDOW_MS: '60000',
    ...overrides
  };
}

test('V6 proposal submission route is hidden unless the research route flag is enabled', async () => {
  await withCivilizationServer({}, async (baseUrl) => {
    const response = await postJson(baseUrl, PROPOSAL_SUBMISSION_ROUTE, {
      sourceSurface: 'human_route_submission',
      proposal: proposal(),
      approvalReceiptId: 'approval_route_proposal_001'
    }, sameOriginHeaders(baseUrl));

    assert.equal(response.status, 404);
    assert.equal(response.body.ok, false);
    assert.equal(response.body.error.code, 'V6_CIVIC_PROPOSAL_ROUTE_DISABLED');
  });
});

test('V6 proposal submission route fails closed without explicit proposal store wiring', async () => {
  await withCivilizationServer({
    env: routeEnv()
  }, async (baseUrl) => {
    const response = await postJson(baseUrl, PROPOSAL_SUBMISSION_ROUTE, {
      sourceSurface: 'human_route_submission',
      proposal: proposal(),
      approvalReceiptId: 'approval_route_proposal_001'
    }, sameOriginHeaders(baseUrl));

    assert.equal(response.status, 503);
    assert.equal(response.body.ok, false);
    assert.equal(response.body.error.code, 'V6_CIVIC_PROPOSAL_STORE_REQUIRED');
  });
});

test('V6 proposal submission route stores human route submissions without exposing runtime civic tools', async () => {
  await withStores(async ({ auditLedger, proposalStore }) => {
    await withCivilizationServer({
      env: routeEnv(),
      proposalStore
    }, async (baseUrl) => {
      const body = {
        sourceSurface: 'human_route_submission',
        proposal: proposal(),
        approvalReceiptId: 'approval_route_proposal_001'
      };
      const response = await postJson(baseUrl, PROPOSAL_SUBMISSION_ROUTE, body, sameOriginHeaders(baseUrl));
      const replay = await postJson(baseUrl, PROPOSAL_SUBMISSION_ROUTE, body, sameOriginHeaders(baseUrl));

      assert.equal(response.status, 200, JSON.stringify(response.body));
      assert.equal(response.body.ok, true);
      assert.equal(response.body.status, 'research_only');
      assert.equal(response.body.runtimeExposed, false);
      assert.equal(response.body.playerVisible, false);
      assert.equal(response.body.normalGameplayExposure, false);
      assert.equal(response.body.mutatesWorldState, false);
      assert.equal(response.body.executesProposalEffects, false);
      assert.equal(response.body.exposesCivicTools, false);
      assert.equal(response.body.exposesPrivateData, false);
      assert.equal(response.body.executionStatus, 'not_executable');
      assert.equal(response.body.proposal.proposalId, 'proposal_route_public_works_001');
      assert.equal(response.body.proposal.status, 'drafted');
      assert.equal(response.body.proposal.moderationStatus, 'needs_review');
      assert.equal(response.body.delegatedActionUse, null);
      assert.equal(response.body.submissionEnvelope.accepted, true);
      assert.equal(response.body.submissionEnvelope.sourceSurface, 'human_route_submission');
      assert.equal(replay.status, 200, JSON.stringify(replay.body));
      assert.equal(replay.body.proposal.duplicate, true);
      assert.equal(proposalStore.count(), 1);
      assert.equal(auditLedger.replay().filter((row) => row.entry.actionType === 'proposal.created').length, 1);
      assert.deepEqual(
        proposalStore.getProposalReviewQueueSnapshot({ nowMs: 1_779_991_000_000 }).entries.map((entry) => entry.proposalId),
        ['proposal_route_public_works_001']
      );
    });
  });
});

test('V6 proposal submission route can use env-gated SQLite store wiring across reopen', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-civic-route-wiring-'));
  const env = routeEnv({
    V6_CIVIC_PROPOSAL_STORE_WIRING_ENABLED: '1',
    V6_CIVIC_AUDIT_SQLITE_PATH: path.join(dir, 'audit.sqlite'),
    V6_CIVIC_PROPOSAL_SQLITE_PATH: path.join(dir, 'proposals.sqlite'),
    V6_CIVIC_DELEGATION_SQLITE_PATH: path.join(dir, 'delegations.sqlite')
  });

  try {
    await withCivilizationServer({
      env,
      resolveProposalStores: () => getConfiguredWorldCivilizationProposalStores(env)
    }, async (baseUrl) => {
      const response = await postJson(baseUrl, PROPOSAL_SUBMISSION_ROUTE, {
        sourceSurface: 'human_route_submission',
        proposal: proposal(),
        approvalReceiptId: 'approval_route_proposal_001'
      }, sameOriginHeaders(baseUrl));

      assert.equal(response.status, 200, JSON.stringify(response.body));
      assert.equal(response.body.proposal.proposalId, 'proposal_route_public_works_001');
      assert.equal(response.body.runtimeExposed, false);
      assert.equal(response.body.executesProposalEffects, false);
      assert.equal(response.body.exposesCivicTools, false);
    });

    closeConfiguredWorldCivilizationProposalStores();
    const reopened = getConfiguredWorldCivilizationProposalStores(env);
    try {
      assert.equal(reopened.status, 'research_only');
      assert.equal(reopened.releaseReady, false);
      assert.equal(reopened.proposalStore.count(), 1);
      assert.equal(reopened.auditLedger.count(), 1);
      assert.deepEqual(
        reopened.proposalStore.getProposalReviewQueueSnapshot({ nowMs: 1_779_991_000_000 }).entries.map((entry) => entry.proposalId),
        ['proposal_route_public_works_001']
      );
    } finally {
      closeConfiguredWorldCivilizationProposalStores();
    }
  } finally {
    closeConfiguredWorldCivilizationProposalStores();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('V6 proposal submission route fails closed before persistence without same-origin CSRF review', async () => {
  await withStores(async ({ auditLedger, proposalStore }) => {
    await withCivilizationServer({
      env: routeEnv(),
      proposalStore
    }, async (baseUrl) => {
      const response = await postJson(baseUrl, PROPOSAL_SUBMISSION_ROUTE, {
        sourceSurface: 'human_route_submission',
        proposal: proposal(),
        approvalReceiptId: 'approval_route_proposal_001'
      }, sameOriginHeaders(baseUrl, {
        origin: 'https://evil.example',
        'sec-fetch-site': 'cross-site',
        'x-v6-civic-csrf-reviewed': '0'
      }));

      assert.equal(response.status, 403);
      assert.equal(response.body.ok, false);
      assert.equal(response.body.error.code, 'CIVIC_PROPOSAL_SUBMISSION_DENIED');
      assert.equal(proposalStore.count(), 0);
      assert.equal(auditLedger.count(), 0);
    });
  });
});

test('V6 proposal submission route accepts worker tool submission only with worker origin and delegation', async () => {
  await withStores(async ({ auditLedger, delegationStore, proposalStore }) => {
    delegationStore.recordDelegation(delegation({ maxActions: 1 }), { nowMs: 1_779_990_000_000 });
    await withCivilizationServer({
      env: routeEnv(),
      proposalStore,
      delegationStore
    }, async (baseUrl) => {
      const body = {
        sourceSurface: 'worker_tool_submission',
        actor: { agentId: AGENT_ID },
        proposal: proposal({
          proposalId: 'proposal_route_agent_public_works_001',
          proposer: {
            kind: 'agent',
            accountId: ACCOUNT_ID,
            agentId: AGENT_ID
          },
          idempotencyKey: 'idem_route_agent_proposal_001'
        }),
        approvalReceiptId: 'approval_route_agent_proposal_001',
        delegation: {
          delegationId: 'delegation_route_proposal_001',
          principalAccountId: ACCOUNT_ID,
          delegateAgentId: AGENT_ID,
          approvalReceiptId: 'receipt_route_agent_proposal_001'
        },
        workerEvidence: {
          origin: 'openclaw_lite_worker',
          skillContextLoaded: true,
          workerTrafficTrace: true,
          backendShortcut: false
        }
      };
      const response = await postJson(baseUrl, PROPOSAL_SUBMISSION_ROUTE, body, sameOriginHeaders(baseUrl));
      const replay = await postJson(baseUrl, PROPOSAL_SUBMISSION_ROUTE, body, sameOriginHeaders(baseUrl));

      assert.equal(response.status, 200, JSON.stringify(response.body));
      assert.equal(response.body.proposal.proposerKind, 'agent');
      assert.equal(response.body.proposal.proposerAgentId, AGENT_ID);
      assert.equal(response.body.delegatedActionUse.usageId, 'delegationuse_proposal_route_agent_public_works_001');
      assert.equal(response.body.delegatedActionUse.delegationId, 'delegation_route_proposal_001');
      assert.equal(response.body.delegatedActionUse.principalAccountId, ACCOUNT_ID);
      assert.equal(response.body.delegatedActionUse.delegateAgentId, AGENT_ID);
      assert.equal(response.body.delegatedActionUse.scope, 'proposal_drafting');
      assert.equal(response.body.delegatedActionUse.actionRef, 'proposal_route_agent_public_works_001');
      assert.equal(response.body.delegatedActionUse.idempotencyKey, 'idem_route_agent_proposal_001');
      assert.equal(response.body.delegatedActionUse.duplicate, false);
      assert.equal(replay.status, 200, JSON.stringify(replay.body));
      assert.equal(replay.body.proposal.duplicate, true);
      assert.equal(replay.body.delegatedActionUse.duplicate, true);
      assert.equal(response.body.submissionEnvelope.workerEvidence.origin, 'openclaw_lite_worker');
      assert.equal(response.body.submissionEnvelope.mutationSecurity.ok, true);
      assert.equal(proposalStore.count(), 1);
      assert.equal(auditLedger.replay().filter((row) => row.entry.actionType === 'proposal.created').length, 1);
      assert.equal(auditLedger.replay().filter((row) => row.entry.actionType === 'delegation.action_consumed').length, 1);
      assert.equal(delegationStore.listDelegatedActionUses({
        delegationId: 'delegation_route_proposal_001'
      }).length, 1);

      const denied = await postJson(baseUrl, PROPOSAL_SUBMISSION_ROUTE, {
        ...body,
        proposal: proposal({
          proposalId: 'proposal_route_agent_public_works_002',
          proposer: {
            kind: 'agent',
            accountId: ACCOUNT_ID,
            agentId: AGENT_ID
          },
          scope: {
            kind: 'public_works',
            targetId: 'district_route_bridge_002'
          },
          affectedPublicState: ['public_works:route_bridge_002'],
          idempotencyKey: 'idem_route_agent_proposal_002',
          rollbackPlan: {
            planId: 'rollbackplan_route_public_works_002',
            strategy: 'Restore previous route bridge snapshot.',
            canRollback: true,
            irreversibleEffects: [],
            maxRollbackMs: 86_400_000
          }
        })
      }, sameOriginHeaders(baseUrl));

      assert.equal(denied.status, 403);
      assert.equal(denied.body.ok, false);
      assert.equal(denied.body.error.code, 'CIVIC_PROPOSAL_SUBMISSION_DENIED');
      assert.equal(proposalStore.count(), 1);
      assert.equal(delegationStore.listDelegatedActionUses({
        delegationId: 'delegation_route_proposal_001'
      }).length, 1);
    });
  });
});

test('V6 proposal submission route rejects storage conflicts before delegated budget consumption', async () => {
  await withStores(async ({ auditLedger, delegationStore, proposalStore }) => {
    delegationStore.recordDelegation(delegation({ maxActions: 2 }), { nowMs: 1_779_990_000_000 });
    await withCivilizationServer({
      env: routeEnv(),
      proposalStore,
      delegationStore
    }, async (baseUrl) => {
      const body = {
        sourceSurface: 'worker_tool_submission',
        actor: { agentId: AGENT_ID },
        proposal: proposal({
          proposalId: 'proposal_route_agent_public_works_001',
          proposer: {
            kind: 'agent',
            accountId: ACCOUNT_ID,
            agentId: AGENT_ID
          },
          idempotencyKey: 'idem_route_agent_proposal_001'
        }),
        approvalReceiptId: 'approval_route_agent_proposal_001',
        delegation: {
          delegationId: 'delegation_route_proposal_001',
          principalAccountId: ACCOUNT_ID,
          delegateAgentId: AGENT_ID,
          approvalReceiptId: 'receipt_route_agent_proposal_001'
        },
        workerEvidence: {
          origin: 'openclaw_lite_worker',
          skillContextLoaded: true,
          workerTrafficTrace: true,
          backendShortcut: false
        }
      };
      const response = await postJson(baseUrl, PROPOSAL_SUBMISSION_ROUTE, body, sameOriginHeaders(baseUrl));
      const conflict = await postJson(baseUrl, PROPOSAL_SUBMISSION_ROUTE, {
        ...body,
        proposal: {
          ...body.proposal,
          idempotencyKey: 'idem_route_agent_proposal_conflict_001'
        }
      }, sameOriginHeaders(baseUrl));

      assert.equal(response.status, 200, JSON.stringify(response.body));
      assert.equal(conflict.status, 409, JSON.stringify(conflict.body));
      assert.equal(conflict.body.ok, false);
      assert.equal(conflict.body.error.code, 'CIVIC_PROPOSAL_ID_CONFLICT');
      assert.equal(proposalStore.count(), 1);
      assert.equal(auditLedger.replay().filter((row) => row.entry.actionType === 'proposal.created').length, 1);
      assert.equal(auditLedger.replay().filter((row) => row.entry.actionType === 'delegation.action_consumed').length, 1);
      assert.equal(delegationStore.listDelegatedActionUses({
        delegationId: 'delegation_route_proposal_001'
      }).length, 1);
    });
  });
});

test('V6 vote route is hidden unless the research route flag is enabled', async () => {
  await withCivilizationServer({}, async (baseUrl) => {
    const response = await postJson(baseUrl, VOTE_CAST_ROUTE, {
      routeSurface: 'human_vote_route',
      vote: vote()
    }, sameOriginHeaders(baseUrl));

    assert.equal(response.status, 404);
    assert.equal(response.body.ok, false);
    assert.equal(response.body.error.code, 'V6_CIVIC_VOTE_ROUTE_DISABLED');
  });
});

test('V6 vote route fails closed without explicit vote store wiring', async () => {
  await withCivilizationServer({
    env: routeEnv()
  }, async (baseUrl) => {
    const response = await postJson(baseUrl, VOTE_CAST_ROUTE, {
      routeSurface: 'human_vote_route',
      vote: vote()
    }, sameOriginHeaders(baseUrl));

    assert.equal(response.status, 503);
    assert.equal(response.body.ok, false);
    assert.equal(response.body.error.code, 'V6_CIVIC_VOTE_STORE_REQUIRED');
  });
});

test('V6 vote route records human vote receipts without applying outcomes', async () => {
  await withStores(async ({ auditLedger, proposalStore, voteStore }) => {
    proposalStore.draftProposal(proposal(), { nowMs: 1_779_991_000_000 });
    proposalStore.recordProposalReview(moderationDecision(), { nowMs: 1_779_991_100_000 });
    await withCivilizationServer({
      env: routeEnv(),
      proposalStore,
      voteStore
    }, async (baseUrl) => {
      const body = {
        routeSurface: 'human_vote_route',
        vote: vote()
      };
      const response = await postJson(baseUrl, VOTE_CAST_ROUTE, body, sameOriginHeaders(baseUrl));
      const replay = await postJson(baseUrl, VOTE_CAST_ROUTE, body, sameOriginHeaders(baseUrl));

      assert.equal(response.status, 200, JSON.stringify(response.body));
      assert.equal(response.body.ok, true);
      assert.equal(response.body.status, 'research_only');
      assert.equal(response.body.runtimeExposed, false);
      assert.equal(response.body.playerVisible, false);
      assert.equal(response.body.normalGameplayExposure, false);
      assert.equal(response.body.recordsVote, true);
      assert.equal(response.body.appliesVoteOutcome, false);
      assert.equal(response.body.mutatesWorldState, false);
      assert.equal(response.body.exposesCivicTools, false);
      assert.equal(response.body.exposesPrivateData, false);
      assert.equal(response.body.executionStatus, 'not_executable');
      assert.equal(response.body.vote.voteId, 'vote_route_public_works_001');
      assert.equal(response.body.vote.proposalId, 'proposal_route_public_works_001');
      assert.equal(response.body.vote.voterAccountId, ACCOUNT_ID);
      assert.equal(response.body.vote.choice, 'approve');
      assert.equal(response.body.routeAuthorization.authorized, true);
      assert.equal(response.body.routeAuthorization.routeSurface, 'human_vote_route');
      assert.equal(response.body.routeAuthorization.recordsVote, false);
      assert.equal(response.body.routeAuthorization.appliesVoteOutcome, false);
      assert.equal(response.body.delegatedActionUse, null);
      assert.equal(replay.status, 200, JSON.stringify(replay.body));
      assert.equal(replay.body.vote.duplicate, true);
      assert.equal(voteStore.count(), 1);
      assert.equal(auditLedger.replay().filter((row) => row.entry.actionType === 'vote.recorded').length, 1);
      assert.deepEqual(voteStore.summarizeProposalVotes('proposal_route_public_works_001'), {
        proposalId: 'proposal_route_public_works_001',
        counts: { approve: 1, reject: 0, abstain: 0 },
        total: 1,
        executionStatus: 'not_executable'
      });
    });
  });
});

test('V6 vote route can use env-gated SQLite store wiring across reopen', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-civic-vote-route-wiring-'));
  const env = routeEnv({
    V6_CIVIC_VOTE_STORE_WIRING_ENABLED: '1',
    V6_CIVIC_AUDIT_SQLITE_PATH: path.join(dir, 'audit.sqlite'),
    V6_CIVIC_PROPOSAL_SQLITE_PATH: path.join(dir, 'proposals.sqlite'),
    V6_CIVIC_VOTE_SQLITE_PATH: path.join(dir, 'votes.sqlite')
  });

  try {
    const seededStores = getConfiguredWorldCivilizationVoteStores(env);
    seededStores.proposalStore.draftProposal(proposal(), { nowMs: 1_779_991_000_000 });
    seededStores.proposalStore.recordProposalReview(moderationDecision(), { nowMs: 1_779_991_100_000 });
    closeConfiguredWorldCivilizationVoteStores();

    await withCivilizationServer({
      env,
      resolveVoteStores: () => getConfiguredWorldCivilizationVoteStores(env)
    }, async (baseUrl) => {
      const response = await postJson(baseUrl, VOTE_CAST_ROUTE, {
        routeSurface: 'human_vote_route',
        vote: vote()
      }, sameOriginHeaders(baseUrl));

      assert.equal(response.status, 200, JSON.stringify(response.body));
      assert.equal(response.body.vote.voteId, 'vote_route_public_works_001');
      assert.equal(response.body.recordsVote, true);
      assert.equal(response.body.appliesVoteOutcome, false);
      assert.equal(response.body.exposesCivicTools, false);
    });

    closeConfiguredWorldCivilizationVoteStores();
    const reopened = getConfiguredWorldCivilizationVoteStores(env);
    try {
      assert.equal(reopened.status, 'research_only');
      assert.equal(reopened.releaseReady, false);
      assert.equal(reopened.proposalStore.count(), 1);
      assert.equal(reopened.voteStore.count(), 1);
      assert.equal(reopened.auditLedger.replay().filter((row) => row.entry.actionType === 'vote.recorded').length, 1);
    } finally {
      closeConfiguredWorldCivilizationVoteStores();
    }
  } finally {
    closeConfiguredWorldCivilizationVoteStores();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('V6 vote route fails closed before persistence without same-origin CSRF review', async () => {
  await withStores(async ({ auditLedger, proposalStore, voteStore }) => {
    proposalStore.draftProposal(proposal(), { nowMs: 1_779_991_000_000 });
    proposalStore.recordProposalReview(moderationDecision(), { nowMs: 1_779_991_100_000 });
    await withCivilizationServer({
      env: routeEnv(),
      proposalStore,
      voteStore
    }, async (baseUrl) => {
      const response = await postJson(baseUrl, VOTE_CAST_ROUTE, {
        routeSurface: 'human_vote_route',
        vote: vote()
      }, sameOriginHeaders(baseUrl, {
        origin: 'https://evil.example',
        'sec-fetch-site': 'cross-site',
        'x-v6-civic-csrf-reviewed': '0'
      }));

      assert.equal(response.status, 403);
      assert.equal(response.body.ok, false);
      assert.equal(response.body.error.code, 'V6_CIVIC_VOTE_ROUTE_AUTHORIZATION_DENIED');
      assert.equal(voteStore.count(), 0);
      assert.equal(auditLedger.replay().filter((row) => row.entry.actionType === 'vote.recorded').length, 0);
    });
  });
});

test('V6 vote route accepts delegated agent vote advice only with store-backed proof', async () => {
  await withStores(async ({ auditLedger, delegationStore, proposalStore, voteStore }) => {
    proposalStore.draftProposal(proposal(), { nowMs: 1_779_991_000_000 });
    proposalStore.recordProposalReview(moderationDecision(), { nowMs: 1_779_991_100_000 });
    delegationStore.recordDelegation(delegation({
      delegationId: 'delegation_route_vote_001',
      scope: 'vote_advice',
      approvalReceiptId: 'receipt_route_agent_vote_001',
      maxActions: 1
    }), { nowMs: 1_779_991_200_000 });
    await withCivilizationServer({
      env: routeEnv(),
      proposalStore,
      delegationStore,
      voteStore
    }, async (baseUrl) => {
      const body = {
        routeSurface: 'delegated_agent_vote_route',
        actor: { agentId: AGENT_ID },
        vote: vote({
          voteId: 'vote_route_agent_public_works_001',
          authorization: {
            kind: 'server_attested_delegation',
            subjectAccountId: ACCOUNT_ID,
            serverVerified: true
          },
          receiptId: 'receipt_vote_route_agent_public_works_001',
          idempotencyKey: 'idem_vote_route_agent_public_works_001'
        }),
        delegation: {
          delegationId: 'delegation_route_vote_001',
          principalAccountId: ACCOUNT_ID,
          delegateAgentId: AGENT_ID,
          approvalReceiptId: 'receipt_route_agent_vote_001'
        }
      };
      const response = await postJson(baseUrl, VOTE_CAST_ROUTE, body, sameOriginHeaders(baseUrl));
      const replay = await postJson(baseUrl, VOTE_CAST_ROUTE, body, sameOriginHeaders(baseUrl));

      assert.equal(response.status, 200, JSON.stringify(response.body));
      assert.equal(response.body.vote.voteId, 'vote_route_agent_public_works_001');
      assert.equal(response.body.vote.authorizationKind, 'server_attested_delegation');
      assert.equal(response.body.delegatedActionUse.usageId, 'delegationuse_vote_route_agent_public_works_001');
      assert.equal(response.body.delegatedActionUse.delegationId, 'delegation_route_vote_001');
      assert.equal(response.body.delegatedActionUse.principalAccountId, ACCOUNT_ID);
      assert.equal(response.body.delegatedActionUse.delegateAgentId, AGENT_ID);
      assert.equal(response.body.delegatedActionUse.scope, 'vote_advice');
      assert.equal(response.body.delegatedActionUse.actionRef, 'vote_route_agent_public_works_001');
      assert.equal(response.body.delegatedActionUse.idempotencyKey, 'idem_vote_route_agent_public_works_001');
      assert.equal(response.body.delegatedActionUse.duplicate, false);
      assert.equal(replay.status, 200, JSON.stringify(replay.body));
      assert.equal(replay.body.vote.duplicate, true);
      assert.equal(replay.body.delegatedActionUse.duplicate, true);
      assert.equal(response.body.routeAuthorization.routeSurface, 'delegated_agent_vote_route');
      assert.equal(response.body.routeAuthorization.mutationSecurity.delegationProofStatus, 'valid');
      assert.equal(response.body.appliesVoteOutcome, false);
      assert.equal(voteStore.count(), 1);
      assert.equal(auditLedger.replay().filter((row) => row.entry.actionType === 'vote.recorded').length, 1);
      assert.equal(auditLedger.replay().filter((row) => row.entry.actionType === 'delegation.action_consumed').length, 1);
      assert.equal(delegationStore.listDelegatedActionUses({
        delegationId: 'delegation_route_vote_001'
      }).length, 1);

      proposalStore.draftProposal(proposal({
        proposalId: 'proposal_route_public_works_002',
        idempotencyKey: 'idem_route_proposal_002',
        scope: {
          kind: 'public_works',
          targetId: 'district_route_bridge_002'
        },
        affectedPublicState: ['public_works:route_bridge_002'],
        rollbackPlan: {
          planId: 'rollbackplan_route_public_works_002',
          strategy: 'Restore previous route bridge snapshot.',
          canRollback: true,
          irreversibleEffects: [],
          maxRollbackMs: 86_400_000
        }
      }), { nowMs: 1_779_991_300_000 });
      proposalStore.recordProposalReview(moderationDecision({
        decisionId: 'moderation_route_public_works_002',
        subjectRef: 'proposal_route_public_works_002'
      }), { nowMs: 1_779_991_400_000 });
      const denied = await postJson(baseUrl, VOTE_CAST_ROUTE, {
        ...body,
        vote: vote({
          voteId: 'vote_route_agent_public_works_002',
          proposalId: 'proposal_route_public_works_002',
          authorization: {
            kind: 'server_attested_delegation',
            subjectAccountId: ACCOUNT_ID,
            serverVerified: true
          },
          receiptId: 'receipt_vote_route_agent_public_works_002',
          idempotencyKey: 'idem_vote_route_agent_public_works_002',
          eligibilityProof: {
            eligible: true,
            ruleId: 'rule_route_public_works_voter_002'
          }
        })
      }, sameOriginHeaders(baseUrl));

      assert.equal(denied.status, 403);
      assert.equal(denied.body.ok, false);
      assert.equal(denied.body.error.code, 'V6_CIVIC_VOTE_ROUTE_AUTHORIZATION_DENIED');
      assert.equal(voteStore.count(), 1);
      assert.equal(delegationStore.listDelegatedActionUses({
        delegationId: 'delegation_route_vote_001'
      }).length, 1);
    });
  });
});

test('V6 vote route rejects receipt conflicts before delegated budget consumption', async () => {
  await withStores(async ({ auditLedger, delegationStore, proposalStore, voteStore }) => {
    proposalStore.draftProposal(proposal(), { nowMs: 1_779_991_000_000 });
    proposalStore.recordProposalReview(moderationDecision(), { nowMs: 1_779_991_100_000 });
    delegationStore.recordDelegation(delegation({
      delegationId: 'delegation_route_vote_001',
      scope: 'vote_advice',
      approvalReceiptId: 'receipt_route_agent_vote_001',
      maxActions: 2
    }), { nowMs: 1_779_991_200_000 });
    await withCivilizationServer({
      env: routeEnv(),
      proposalStore,
      delegationStore,
      voteStore
    }, async (baseUrl) => {
      const body = {
        routeSurface: 'delegated_agent_vote_route',
        actor: { agentId: AGENT_ID },
        vote: vote({
          voteId: 'vote_route_agent_public_works_001',
          authorization: {
            kind: 'server_attested_delegation',
            subjectAccountId: ACCOUNT_ID,
            serverVerified: true
          },
          receiptId: 'receipt_vote_route_agent_public_works_001',
          idempotencyKey: 'idem_vote_route_agent_public_works_001'
        }),
        delegation: {
          delegationId: 'delegation_route_vote_001',
          principalAccountId: ACCOUNT_ID,
          delegateAgentId: AGENT_ID,
          approvalReceiptId: 'receipt_route_agent_vote_001'
        }
      };
      const response = await postJson(baseUrl, VOTE_CAST_ROUTE, body, sameOriginHeaders(baseUrl));
      const conflict = await postJson(baseUrl, VOTE_CAST_ROUTE, {
        ...body,
        vote: vote({
          voteId: 'vote_route_agent_public_works_002',
          authorization: {
            kind: 'server_attested_delegation',
            subjectAccountId: ACCOUNT_ID,
            serverVerified: true
          },
          receiptId: 'receipt_vote_route_agent_public_works_002',
          idempotencyKey: 'idem_vote_route_agent_public_works_002'
        })
      }, sameOriginHeaders(baseUrl));

      assert.equal(response.status, 200, JSON.stringify(response.body));
      assert.equal(conflict.status, 409, JSON.stringify(conflict.body));
      assert.equal(conflict.body.ok, false);
      assert.equal(conflict.body.error.code, 'CIVIC_VOTE_ALREADY_RECORDED');
      assert.equal(voteStore.count(), 1);
      assert.equal(auditLedger.replay().filter((row) => row.entry.actionType === 'vote.recorded').length, 1);
      assert.equal(auditLedger.replay().filter((row) => row.entry.actionType === 'delegation.action_consumed').length, 1);
      assert.equal(delegationStore.listDelegatedActionUses({
        delegationId: 'delegation_route_vote_001'
      }).length, 1);
    });
  });
});

test('V6 vote route keeps worker tool vote surface reserved for worker-first wiring', async () => {
  await withStores(async ({ delegationStore, proposalStore, voteStore }) => {
    proposalStore.draftProposal(proposal(), { nowMs: 1_779_991_000_000 });
    proposalStore.recordProposalReview(moderationDecision(), { nowMs: 1_779_991_100_000 });
    delegationStore.recordDelegation(delegation({
      delegationId: 'delegation_route_vote_worker_surface_001',
      scope: 'vote_advice',
      approvalReceiptId: 'receipt_route_agent_vote_worker_surface_001'
    }), { nowMs: 1_779_991_200_000 });
    await withCivilizationServer({
      env: routeEnv(),
      proposalStore,
      delegationStore,
      voteStore
    }, async (baseUrl) => {
      const response = await postJson(baseUrl, VOTE_CAST_ROUTE, {
        routeSurface: 'worker_tool_vote_surface',
        actor: { agentId: AGENT_ID },
        vote: vote({
          voteId: 'vote_route_worker_surface_public_works_001',
          authorization: {
            kind: 'server_attested_delegation',
            subjectAccountId: ACCOUNT_ID,
            serverVerified: true
          },
          receiptId: 'receipt_vote_route_worker_surface_public_works_001',
          idempotencyKey: 'idem_vote_route_worker_surface_public_works_001'
        }),
        delegation: {
          delegationId: 'delegation_route_vote_worker_surface_001',
          principalAccountId: ACCOUNT_ID,
          delegateAgentId: AGENT_ID,
          approvalReceiptId: 'receipt_route_agent_vote_worker_surface_001'
        }
      }, sameOriginHeaders(baseUrl));

      assert.equal(response.status, 403);
      assert.equal(response.body.ok, false);
      assert.equal(response.body.error.code, 'V6_CIVIC_VOTE_ROUTE_AUTHORIZATION_DENIED');
      assert.match(response.body.error.details.errors.join(','), /V6_CIVIC_VOTE_WORKER_TOOL_SURFACE_NOT_ROUTE_CALLABLE/);
      assert.equal(voteStore.count(), 0);
    });
  });
});
