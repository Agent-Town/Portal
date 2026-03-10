const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const { getRegistryWebPokerFixture } = require('./helpers/registry_web_poker');
const {
  compilePlatformIntegration,
  resolvePlatformIntegration,
} = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M24.7: Parse-backed integration candidates compile into the same internal pack model', async ({ request }) => {
  const fixture = await getRegistryWebPokerFixture(request, 'web_parse_stub_seed');
  expect(fixture.ok).toBe(true);
  const parseCandidate = fixture.fixture?.parseCandidate || {};
  const seededHouse = await seedRecoverableTokenHouse(request);

  const resolved = await resolvePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    targetUrl: String(parseCandidate.sourceUrl || 'https://example.com/threaded-feed'),
    sourceHints: {
      parseStub: true,
      parseStubFamily: 'web_parse_stub_seed',
      adapterId: 'threaded_feed_v1',
    },
    idempotencyKey: 'integration-parse-resolve-001',
  });
  expect(resolved.status).toBe(201);
  expect(resolved.json?.ok).toBe(true);
  expect(String(resolved.json?.data?.integrationCandidateId || '')).toMatch(/^intcand_/);
  expect(String(resolved.json?.data?.sourceKind || '')).toBe('parse');
  expect(resolved.json?.data?.requiresCompilation).toBe(true);
  expect(resolved.json?.data?.parse).toMatchObject({
    fixtureFamily: 'web_parse_stub_seed',
    candidateId: String(parseCandidate.candidateId || ''),
    sourceUrl: String(parseCandidate.sourceUrl || ''),
    adapterId: 'threaded_feed_v1',
  });

  const integrationId = String(resolved.json?.data?.integrationCandidateId || '');
  const compiled = await compilePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    integrationId,
    idempotencyKey: 'integration-parse-compile-001',
  });
  expect(compiled.status).toBe(201);
  expect(compiled.json?.ok).toBe(true);
  expect(String(compiled.json?.data?.packVersionId || '')).toMatch(/^intpackv_/);
  expect(String(compiled.json?.data?.contentHash || '')).toMatch(/^sha256:/);
  expect(String(compiled.json?.data?.manifest?.sourceKind || '')).toBe('parse');
  expect(compiled.json?.data?.manifest?.provenanceSummary).toMatchObject({
    parse: {
      fixtureFamily: 'web_parse_stub_seed',
      candidateId: String(parseCandidate.candidateId || ''),
      sourceUrl: String(parseCandidate.sourceUrl || ''),
      adapterId: 'threaded_feed_v1',
    },
  });
  expect(String(compiled.json?.data?.fileHashes?.['provenance.json'] || '')).toMatch(/^sha256:/);
  expect(compiled.json?.data?.manifest?.files).toMatchObject({
    'manifest.json': 'manifest.json',
    'provenance.json': 'provenance.json',
  });

  const replayed = await compilePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    integrationId,
    idempotencyKey: 'integration-parse-compile-001',
  });
  expect(replayed.status).toBe(200);
  expect(replayed.json?.data).toMatchObject({
    packVersionId: compiled.json?.data?.packVersionId,
    contentHash: compiled.json?.data?.contentHash,
  });
  expect(replayed.json?.data?.fileHashes).toEqual(compiled.json?.data?.fileHashes);
});
