const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { getRegistryWebPokerFixture } = require('./helpers/registry_web_poker');
const {
  compilePlatformIntegration,
  executePlatformIntegration,
  resolvePlatformIntegration,
} = require('./helpers/unified_platform');

const THREADED_FEED_ACTIONS = [
  'threaded_feed_v1.draft_reply',
  'threaded_feed_v1.read_feed',
  'threaded_feed_v1.read_thread',
  'threaded_feed_v1.send_reply',
].sort();

async function resolveThreadedFeedIntegration(request, {
  houseId,
  houseAuthKey,
  targetUrl,
  preferredMode,
  idempotencyKey,
}) {
  return await resolvePlatformIntegration(request, {
    houseId,
    houseAuthKey,
    targetUrl,
    preferredMode,
    sourceHints: {
      parseStub: true,
      parseStubFamily: 'web_parse_stub_seed',
      adapterId: 'threaded_feed_v1',
    },
    idempotencyKey,
  });
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M24.8: threaded_feed_v1 adapter pack exposes deterministic actions, approval gates, and execution evidence', async ({ request }) => {
  const fixture = await getRegistryWebPokerFixture(request, 'web_parse_stub_seed');
  expect(fixture.ok).toBe(true);
  const parseCandidate = fixture.fixture?.parseCandidate || {};
  const targetUrl = String(parseCandidate.sourceUrl || 'https://example.com/threaded-feed');
  const seededHouse = await seedRecoverableTokenHouse(request);

  const resolvedCompanion = await resolveThreadedFeedIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    targetUrl,
    preferredMode: 'companion',
    idempotencyKey: 'threaded-feed-resolve-companion-001',
  });
  expect(resolvedCompanion.status).toBe(201);
  expect(resolvedCompanion.json?.data).toMatchObject({
    sourceKind: 'parse',
    targetUrl,
    parse: {
      fixtureFamily: 'web_parse_stub_seed',
      candidateId: String(parseCandidate.candidateId || ''),
      sourceUrl: targetUrl,
      adapterId: 'threaded_feed_v1',
    },
    integration: {
      renderMode: 'companion',
      adapterId: 'threaded_feed_v1',
    },
  });

  const resolvedEmbedded = await resolveThreadedFeedIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    targetUrl,
    preferredMode: 'embedded',
    idempotencyKey: 'threaded-feed-resolve-embedded-001',
  });
  expect(resolvedEmbedded.status).toBe(201);
  expect(resolvedEmbedded.json?.data?.integration).toMatchObject({
    renderMode: 'embedded',
    adapterId: 'threaded_feed_v1',
  });

  const integrationId = String(resolvedCompanion.json?.data?.integrationCandidateId || '');
  expect(integrationId).toMatch(/^intcand_/);

  const compiled = await compilePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    integrationId,
    idempotencyKey: 'threaded-feed-compile-001',
  });
  expect(compiled.status).toBe(201);
  expect(compiled.json?.data?.manifest).toMatchObject({
    sourceKind: 'parse',
    compatibility: {
      adapterId: 'threaded_feed_v1',
    },
    provenanceSummary: {
      parse: {
        fixtureFamily: 'web_parse_stub_seed',
        candidateId: String(parseCandidate.candidateId || ''),
        sourceUrl: targetUrl,
        adapterId: 'threaded_feed_v1',
      },
    },
  });
  expect((compiled.json?.data?.manifest?.compatibility?.actionIds || []).slice().sort()).toEqual(THREADED_FEED_ACTIONS);
  expect((compiled.json?.data?.manifest?.files && Object.keys(compiled.json.data.manifest.files).length) > 0).toBe(true);
  expect((compiled.json?.data?.manifest?.fileHashes && Object.keys(compiled.json.data.manifest.fileHashes).length) > 0).toBe(true);

  const overlayText = JSON.stringify(compiled.json?.data?.manifest || {});
  expect(overlayText.includes('threaded_feed_v1')).toBe(true);

  const readExecution = await executePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    integrationId,
    idempotencyKey: 'threaded-feed-read-feed-001',
    payload: {
      actionId: 'threaded_feed_v1.read_feed',
      requestedBy: {
        actorType: 'worker',
        actorId: 'worker_main',
      },
      request: {
        params: {
          feedId: 'feed_fixture_main',
        },
      },
    },
  });
  expect(readExecution.status).toBe(201);
  expect(readExecution.json?.data).toMatchObject({
    actionId: 'threaded_feed_v1.read_feed',
    status: 'queued',
    result: {
      policy: {
        requiresApproval: false,
      },
      adapter: {
        adapterId: 'threaded_feed_v1',
        renderMode: 'companion',
      },
      trace: {
        eventType: 'integration.threaded_feed_v1.read_feed',
      },
    },
  });
  expect(String(readExecution.json?.data?.result?.trace?.eventId || '')).toMatch(/^intevt_/);
  expect(String(readExecution.json?.data?.result?.evidence?.items?.[0]?.evidenceId || '')).toMatch(/^inev_/);
  expect(String(readExecution.json?.data?.result?.evidence?.items?.[0]?.actionId || '')).toBe('threaded_feed_v1.read_feed');
  expect(String(readExecution.json?.data?.result?.evidence?.items?.[0]?.requestDigest || '')).toMatch(/^sha256:/);

  const blockedReply = await executePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    integrationId,
    idempotencyKey: 'threaded-feed-send-reply-blocked-001',
    payload: {
      actionId: 'threaded_feed_v1.send_reply',
      requestedBy: {
        actorType: 'worker',
        actorId: 'worker_main',
      },
      request: {
        params: {
          threadId: 'thread_fixture_main',
          body: 'reply body',
        },
      },
    },
  });
  expect(blockedReply.status).toBe(409);
  expect(String(blockedReply.json?.error?.code || '')).toBe('APPROVAL_REQUIRED');

  const approvedReply = await executePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    integrationId,
    idempotencyKey: 'threaded-feed-send-reply-approved-001',
    payload: {
      actionId: 'threaded_feed_v1.send_reply',
      requestedBy: {
        actorType: 'worker',
        actorId: 'worker_main',
      },
      request: {
        params: {
          threadId: 'thread_fixture_main',
          body: 'reply body',
        },
        approvalId: 'appr_fixture_threaded_feed_approved_01',
      },
    },
  });
  expect(approvedReply.status).toBe(201);
  expect(approvedReply.json?.data).toMatchObject({
    actionId: 'threaded_feed_v1.send_reply',
    status: 'queued',
    result: {
      policy: {
        requiresApproval: true,
      },
      adapter: {
        adapterId: 'threaded_feed_v1',
        renderMode: 'companion',
      },
      trace: {
        eventType: 'integration.threaded_feed_v1.send_reply',
      },
    },
  });
  expect(String(approvedReply.json?.data?.result?.trace?.eventId || '')).toMatch(/^intevt_/);
  expect(String(approvedReply.json?.data?.result?.evidence?.items?.[0]?.approvalId || '')).toBe('appr_fixture_threaded_feed_approved_01');

  const replayApproved = await executePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    integrationId,
    idempotencyKey: 'threaded-feed-send-reply-approved-001',
    payload: {
      actionId: 'threaded_feed_v1.send_reply',
      requestedBy: {
        actorType: 'worker',
        actorId: 'worker_main',
      },
      request: {
        params: {
          threadId: 'thread_fixture_main',
          body: 'reply body',
        },
        approvalId: 'appr_fixture_threaded_feed_approved_01',
      },
    },
  });
  expect(replayApproved.status).toBe(200);
  expect(replayApproved.json?.data?.result).toEqual(approvedReply.json?.data?.result);
});
