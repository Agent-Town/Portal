const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const { getRegistryHealth, getRegistryWebPokerFixture } = require('./helpers/registry_web_poker');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M24.1: registry health reports family-aware schema readiness deterministically', async ({ request }) => {
  const seededFixture = await getRegistryWebPokerFixture(request, 'registry_family_seed');
  expect(seededFixture.ok).toBe(true);
  const expectedFamilies = Array.isArray(seededFixture.fixture?.registryFamilies)
    ? seededFixture.fixture.registryFamilies.map((entry) => String(entry.familySlug || ''))
    : [];

  const healthA = await getRegistryHealth(request);
  const healthB = await getRegistryHealth(request);
  expect(healthA.status).toBe(200);
  expect(healthB.status).toBe(200);
  expect(healthA.json?.ok).toBe(true);
  expect(healthB.json?.ok).toBe(true);
  expect(healthA.json?.data).toEqual(healthB.json?.data);

  const health = healthA.json?.data || {};
  expect(health.ok).toBe(true);
  expect(String(health.schemaVersion || '')).toBe('registry-family-core/v1');
  expect(health.familyModelReady).toBe(true);
  expect(Number(health.familyCount || 0)).toBe(expectedFamilies.length);
  expect(Number(health.entityCount || 0)).toBeGreaterThanOrEqual(expectedFamilies.length);
  expect(Array.isArray(health.families)).toBe(true);
  expect(health.families.map((entry) => String(entry.familySlug || ''))).toEqual(expectedFamilies);

  const searchResponse = await request.get('/api/registry/search?family=registry', {
    failOnStatusCode: false,
  });
  expect(searchResponse.status()).toBe(200);
  const searchPayload = await searchResponse.json();
  expect(searchPayload?.ok).toBe(true);
  const searchItems = Array.isArray(searchPayload?.data?.items) ? searchPayload.data.items : [];
  expect(searchItems.length).toBeGreaterThan(0);
  expect(searchItems[0]).toMatchObject({
    family: 'registry',
    familySlug: 'registry',
  });

  const entityResponse = await request.get('/api/registry/entities/reg_registry_catalog', {
    failOnStatusCode: false,
  });
  expect(entityResponse.status()).toBe(200);
  const entityPayload = await entityResponse.json();
  expect(entityPayload?.ok).toBe(true);
  expect(entityPayload?.data?.entity).toMatchObject({
    registryEntityId: 'reg_registry_catalog',
    family: 'registry',
    familySlug: 'registry',
  });
});
