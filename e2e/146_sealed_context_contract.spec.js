const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  getPlatformCounts,
  getPlatformFixture,
  getPlatformSealedContext,
  releasePlatformSealedContext,
  reportPlatformSealedContextViolation,
  seedPlatformSealedContext,
} = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M19.15: sealed contexts expose entrant identity, require house auth, and durably record violations', async ({ request }) => {
  const seededHouse = await seedRecoverableTokenHouse(request);
  const seededFixture = await getPlatformFixture(request, 'sealed_context_seed');
  const seededContext = await seedPlatformSealedContext(request, {
    houseId: seededHouse.houseId,
    releasePolicy: 'manual',
    status: 'active',
  });
  expect(seededContext.status).toBe(200);
  const sealedContextId = String(seededContext.json?.sealedContext?.sealedContextId || '');
  expect(sealedContextId).toBe(String(seededFixture.fixture?.sealedContext?.sealedContextId || ''));

  const missingAuth = await getPlatformSealedContext(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    sealedContextId,
    includeAuth: false,
  });
  expect(missingAuth.status).toBe(401);
  expect(String(missingAuth.json?.error?.code || '')).toBe('HOUSE_AUTH_REQUIRED');

  const readContext = await getPlatformSealedContext(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    sealedContextId,
  });
  expect(readContext.status).toBe(200);
  expect(String(readContext.json?.data?.entrantId || '')).toBe(String(seededFixture.fixture?.sealedContext?.entrantId || ''));
  expect(String(readContext.json?.data?.scopeType || '')).toBe(String(seededFixture.fixture?.sealedContext?.scopeType || ''));
  expect(String(readContext.json?.data?.scopeKey || '')).toBe(String(seededFixture.fixture?.sealedContext?.scopeKey || ''));
  expect(readContext.json?.data?.allowedReaders || []).toHaveLength(
    Array.isArray(seededFixture.fixture?.sealedContext?.allowedReaders)
      ? seededFixture.fixture.sealedContext.allowedReaders.length
      : 0
  );

  const released = await releasePlatformSealedContext(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    sealedContextId,
    payload: {},
  });
  expect(released.status).toBe(200);
  expect(String(released.json?.data?.status || '')).toBe('released');

  const beforeCounts = await getPlatformCounts(request);
  const violation = await reportPlatformSealedContextViolation(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    sealedContextId,
    payload: {
      actor: {
        actorType: 'arbiter',
        actorId: 'arbiter_fixture',
      },
      details: {
        reason: 'cross-entrant read attempt',
      },
    },
  });
  expect(violation.status).toBe(201);
  const afterCounts = await getPlatformCounts(request);
  expect(Number(afterCounts.counts?.sealed_context_violations || 0) - Number(beforeCounts.counts?.sealed_context_violations || 0)).toBe(1);
});
