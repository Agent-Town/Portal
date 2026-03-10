const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { getRegistryWebPokerFixture } = require('./helpers/registry_web_poker');
const {
  compilePlatformIntegration,
  executePlatformIntegration,
  resolvePlatformIntegration,
} = require('./helpers/unified_platform');

const REPO_WORKBENCH_ACTIONS = [
  'repo_workbench_v1.draft_pr',
  'repo_workbench_v1.list_repo',
  'repo_workbench_v1.read_file',
  'repo_workbench_v1.search_code',
  'repo_workbench_v1.stage_patch',
].sort();

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M24.10: repo_workbench_v1 adapter pack expands beyond GitHub-minimal actions with deterministic policy and evidence', async ({ request }) => {
  const fixture = await getRegistryWebPokerFixture(request, 'web_parse_stub_seed');
  expect(fixture.ok).toBe(true);
  const parseCandidate = fixture.fixture?.parseCandidate || {};
  const targetUrl = String(parseCandidate.sourceUrl || 'https://example.com/threaded-feed');
  const seededHouse = await seedRecoverableTokenHouse(request);

  const resolved = await resolvePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    targetUrl,
    preferredMode: 'companion',
    sourceHints: {
      parseStub: true,
      parseStubFamily: 'web_parse_stub_seed',
      adapterId: 'repo_workbench_v1',
    },
    idempotencyKey: 'repo-workbench-resolve-001',
  });
  expect(resolved.status).toBe(201);
  expect(resolved.json?.data).toMatchObject({
    sourceKind: 'parse',
    targetUrl,
    integration: {
      adapterId: 'repo_workbench_v1',
      renderMode: 'companion',
    },
    parse: {
      fixtureFamily: 'web_parse_stub_seed',
      sourceUrl: targetUrl,
      adapterId: 'repo_workbench_v1',
    },
  });
  expect(String(resolved.json?.data?.website?.registryId || '')).not.toBe('ws_github');

  const integrationId = String(resolved.json?.data?.integrationCandidateId || '');
  expect(integrationId).toMatch(/^intcand_/);

  const compiled = await compilePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    integrationId,
    idempotencyKey: 'repo-workbench-compile-001',
  });
  expect(compiled.status).toBe(201);
  expect(compiled.json?.data?.manifest).toMatchObject({
    sourceKind: 'parse',
    compatibility: {
      adapterId: 'repo_workbench_v1',
    },
    provenanceSummary: {
      parse: {
        fixtureFamily: 'web_parse_stub_seed',
        sourceUrl: targetUrl,
        adapterId: 'repo_workbench_v1',
      },
    },
  });
  expect((compiled.json?.data?.manifest?.compatibility?.actionIds || []).slice().sort()).toEqual(REPO_WORKBENCH_ACTIONS);
  expect(Object.keys(compiled.json?.data?.fileHashes || {}).sort()).toEqual([
    'heartbeat.md',
    'manifest.json',
    'manual/skill.md',
    'overlay.json',
    'policy.json',
    'provenance.json',
    'tools.md',
    'trace_map.json',
    'verification.json',
  ]);

  const replayCompiled = await compilePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    integrationId,
    idempotencyKey: 'repo-workbench-compile-001',
  });
  expect(replayCompiled.status).toBe(200);
  expect(replayCompiled.json?.data?.fileHashes).toEqual(compiled.json?.data?.fileHashes);

  const readExecution = await executePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    integrationId,
    idempotencyKey: 'repo-workbench-search-code-001',
    payload: {
      actionId: 'repo_workbench_v1.search_code',
      requestedBy: {
        actorType: 'worker',
        actorId: 'worker_main',
      },
      request: {
        params: {
          repo: 'example/repo',
          query: 'TODO',
        },
      },
    },
  });
  expect(readExecution.status).toBe(201);
  expect(readExecution.json?.data).toMatchObject({
    actionId: 'repo_workbench_v1.search_code',
    result: {
      policy: {
        requiresApproval: false,
      },
      adapter: {
        adapterId: 'repo_workbench_v1',
        renderMode: 'companion',
      },
      trace: {
        eventType: 'integration.repo_workbench_v1.search_code',
      },
    },
  });
  expect(String(readExecution.json?.data?.result?.evidence?.items?.[0]?.evidenceId || '')).toMatch(/^inev_/);
  expect(String(readExecution.json?.data?.result?.evidence?.items?.[0]?.actionId || '')).toBe('repo_workbench_v1.search_code');

  const blockedWrite = await executePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    integrationId,
    idempotencyKey: 'repo-workbench-stage-patch-blocked-001',
    payload: {
      actionId: 'repo_workbench_v1.stage_patch',
      requestedBy: {
        actorType: 'worker',
        actorId: 'worker_main',
      },
      request: {
        params: {
          repo: 'example/repo',
          patch: 'diff --git a/file.js b/file.js',
        },
      },
    },
  });
  expect(blockedWrite.status).toBe(409);
  expect(String(blockedWrite.json?.error?.code || '')).toBe('APPROVAL_REQUIRED');

  const approvedWrite = await executePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    integrationId,
    idempotencyKey: 'repo-workbench-draft-pr-approved-001',
    payload: {
      actionId: 'repo_workbench_v1.draft_pr',
      requestedBy: {
        actorType: 'worker',
        actorId: 'worker_main',
      },
      request: {
        params: {
          repo: 'example/repo',
          title: 'Patch title',
        },
        approvalId: 'appr_fixture_repo_workbench_approved_01',
      },
    },
  });
  expect(approvedWrite.status).toBe(201);
  expect(approvedWrite.json?.data).toMatchObject({
    actionId: 'repo_workbench_v1.draft_pr',
    result: {
      policy: {
        requiresApproval: true,
      },
      adapter: {
        adapterId: 'repo_workbench_v1',
      },
      trace: {
        eventType: 'integration.repo_workbench_v1.draft_pr',
      },
    },
  });
  expect(String(approvedWrite.json?.data?.result?.trace?.eventId || '')).toMatch(/^intevt_/);
  expect(String(approvedWrite.json?.data?.result?.evidence?.items?.[0]?.approvalId || '')).toBe('appr_fixture_repo_workbench_approved_01');
});
