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
const {
  PROPOSAL_SUBMISSION_ROUTE,
  createWorldCivilizationRouter
} = require('../server/world_civilization/routes');
const { CIVIC_SCHEMA_VERSION } = require('../server/world_civilization/schemas');
const {
  closeConfiguredWorldCivilizationProposalStores,
  getConfiguredWorldCivilizationProposalStores
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
  delegationStore = null,
  resolveProposalStores = null,
  resolveCivicIdentity = () => ({
    accountId: ACCOUNT_ID,
    walletAddress: '0x0000000000000000000000000000000000000001'
  })
} = {}, fn) {
  const app = express();
  app.use(express.json());
  app.use(createWorldCivilizationRouter({
    proposalStore,
    delegationStore,
    resolveProposalStores,
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
  }
}

async function withStores(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-civic-routes-'));
  const auditLedger = createCivicAuditLedger({ sqlitePath: path.join(dir, 'audit.sqlite') });
  const proposalStore = createCivicProposalStore({ sqlitePath: path.join(dir, 'proposals.sqlite'), auditLedger });
  const delegationStore = createCivicDelegationStore({ sqlitePath: path.join(dir, 'delegations.sqlite'), auditLedger });
  try {
    return await fn({ auditLedger, delegationStore, proposalStore });
  } finally {
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
    delegationStore.recordDelegation(delegation(), { nowMs: 1_779_990_000_000 });
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

      assert.equal(response.status, 200, JSON.stringify(response.body));
      assert.equal(response.body.proposal.proposerKind, 'agent');
      assert.equal(response.body.proposal.proposerAgentId, AGENT_ID);
      assert.equal(response.body.submissionEnvelope.workerEvidence.origin, 'openclaw_lite_worker');
      assert.equal(response.body.submissionEnvelope.mutationSecurity.ok, true);
      assert.equal(proposalStore.count(), 1);
      assert.equal(auditLedger.replay().filter((row) => row.entry.actionType === 'proposal.created').length, 1);
    });
  });
});
