const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { getRegistryWebPokerFixture } = require('./helpers/registry_web_poker');
const {
  compilePlatformIntegration,
  executePlatformIntegration,
  resolvePlatformIntegration,
} = require('./helpers/unified_platform');

const DELIBERATION_ACTIONS = [
  'deliberation_v1.change_status',
  'deliberation_v1.comment_item',
  'deliberation_v1.list_boards',
  'deliberation_v1.read_item',
].sort();

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M24.9: deliberation_v1 adapter pack keeps action inventory, approval policy, and trace evidence deterministic', async ({ request }) => {
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
      adapterId: 'deliberation_v1',
    },
    idempotencyKey: 'deliberation-resolve-001',
  });
  expect(resolved.status).toBe(201);
  expect(resolved.json?.data).toMatchObject({
    sourceKind: 'parse',
    integration: {
      adapterId: 'deliberation_v1',
      renderMode: 'companion',
    },
    parse: {
      fixtureFamily: 'web_parse_stub_seed',
      sourceUrl: targetUrl,
      adapterId: 'deliberation_v1',
    },
  });

  const integrationId = String(resolved.json?.data?.integrationCandidateId || '');
  expect(integrationId).toMatch(/^intcand_/);

  const compiled = await compilePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    integrationId,
    idempotencyKey: 'deliberation-compile-001',
  });
  expect(compiled.status).toBe(201);
  expect(compiled.json?.data?.manifest).toMatchObject({
    sourceKind: 'parse',
    compatibility: {
      adapterId: 'deliberation_v1',
    },
    provenanceSummary: {
      parse: {
        fixtureFamily: 'web_parse_stub_seed',
        sourceUrl: targetUrl,
        adapterId: 'deliberation_v1',
      },
    },
  });
  expect((compiled.json?.data?.manifest?.compatibility?.actionIds || []).slice().sort()).toEqual(DELIBERATION_ACTIONS);

  const readExecution = await executePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    integrationId,
    idempotencyKey: 'deliberation-read-item-001',
    payload: {
      actionId: 'deliberation_v1.read_item',
      requestedBy: {
        actorType: 'worker',
        actorId: 'worker_main',
      },
      request: {
        params: {
          boardId: 'board_fixture_main',
          itemId: 'item_fixture_main',
        },
      },
    },
  });
  expect(readExecution.status).toBe(201);
  expect(readExecution.json?.data).toMatchObject({
    actionId: 'deliberation_v1.read_item',
    status: 'queued',
    result: {
      policy: {
        requiresApproval: false,
      },
      adapter: {
        adapterId: 'deliberation_v1',
      },
      trace: {
        eventType: 'integration.deliberation_v1.read_item',
      },
    },
  });
  expect(String(readExecution.json?.data?.result?.trace?.eventId || '')).toMatch(/^intevt_/);
  expect(String(readExecution.json?.data?.result?.evidence?.items?.[0]?.evidenceId || '')).toMatch(/^inev_/);
  expect(String(readExecution.json?.data?.result?.evidence?.items?.[0]?.actionId || '')).toBe('deliberation_v1.read_item');

  const blockedWrite = await executePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    integrationId,
    idempotencyKey: 'deliberation-comment-blocked-001',
    payload: {
      actionId: 'deliberation_v1.comment_item',
      requestedBy: {
        actorType: 'worker',
        actorId: 'worker_main',
      },
      request: {
        params: {
          itemId: 'item_fixture_main',
          body: 'comment body',
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
    idempotencyKey: 'deliberation-comment-approved-001',
    payload: {
      actionId: 'deliberation_v1.comment_item',
      requestedBy: {
        actorType: 'worker',
        actorId: 'worker_main',
      },
      request: {
        params: {
          itemId: 'item_fixture_main',
          body: 'comment body',
        },
        approvalId: 'appr_fixture_deliberation_approved_01',
      },
    },
  });
  expect(approvedWrite.status).toBe(201);
  expect(approvedWrite.json?.data).toMatchObject({
    actionId: 'deliberation_v1.comment_item',
    result: {
      policy: {
        requiresApproval: true,
      },
      adapter: {
        adapterId: 'deliberation_v1',
      },
      trace: {
        eventType: 'integration.deliberation_v1.comment_item',
      },
    },
  });
  expect(String(approvedWrite.json?.data?.result?.trace?.eventId || '')).toMatch(/^intevt_/);
  expect(String(approvedWrite.json?.data?.result?.evidence?.items?.[0]?.approvalId || '')).toBe('appr_fixture_deliberation_approved_01');

  const replayApproved = await executePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    integrationId,
    idempotencyKey: 'deliberation-comment-approved-001',
    payload: {
      actionId: 'deliberation_v1.comment_item',
      requestedBy: {
        actorType: 'worker',
        actorId: 'worker_main',
      },
      request: {
        params: {
          itemId: 'item_fixture_main',
          body: 'comment body',
        },
        approvalId: 'appr_fixture_deliberation_approved_01',
      },
    },
  });
  expect(replayApproved.status).toBe(200);
  expect(replayApproved.json?.data?.result).toEqual(approvedWrite.json?.data?.result);
});
