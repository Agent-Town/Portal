const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const { getRegistryFamily, getRegistryWebPokerFixture } = require('./helpers/registry_web_poker');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M24.2: registry search groups results by family and storefront payloads stay deterministic', async ({ request }) => {
  const seededFixture = await getRegistryWebPokerFixture(request, 'registry_family_seed');
  expect(seededFixture.ok).toBe(true);
  const expectedGroups = Array.isArray(seededFixture.fixture?.groupedSearch)
    ? seededFixture.fixture.groupedSearch
    : [];

  const searchResponseA = await request.get('/api/registry/search', { failOnStatusCode: false });
  const searchResponseB = await request.get('/api/registry/search', { failOnStatusCode: false });
  expect(searchResponseA.status()).toBe(200);
  expect(searchResponseB.status()).toBe(200);

  const searchA = await searchResponseA.json();
  const searchB = await searchResponseB.json();
  expect(searchA?.ok).toBe(true);
  expect(searchB?.ok).toBe(true);
  expect(searchA?.data).toEqual(searchB?.data);

  const groups = Array.isArray(searchA?.data?.items) ? searchA.data.items : [];
  expect(groups.map((entry) => String(entry.familySlug || ''))).toEqual(
    expectedGroups.map((entry) => String(entry.familySlug || ''))
  );
  expect(groups.map((entry) => String(entry.familyTitle || ''))).toEqual(
    expectedGroups.map((entry) => String(entry.familyTitle || ''))
  );
  expect(groups.map((entry) => Array.isArray(entry.members) ? entry.members.map((member) => String(member.registryEntityId || '')) : []))
    .toEqual(
      expectedGroups.map((entry) => Array.isArray(entry.members) ? entry.members.map((member) => String(member.registryEntityId || '')) : [])
    );

  const entityResponse = await request.get('/api/registry/entities/reg_github_issue_reply', {
    failOnStatusCode: false,
  });
  expect(entityResponse.status()).toBe(200);
  const entityPayload = await entityResponse.json();
  expect(entityPayload?.ok).toBe(true);
  expect(entityPayload?.data?.entity).toMatchObject({
    registryEntityId: 'reg_github_issue_reply',
    family: 'developer_workflows',
    familySlug: 'developer_workflows',
    familyInfo: {
      familySlug: 'developer_workflows',
      displayName: 'Developer Workflows',
      status: 'ready',
    },
  });

  const family = await getRegistryFamily(request, 'developer_workflows');
  expect(family.status).toBe(200);
  expect(family.json?.ok).toBe(true);
  expect(family.json?.data?.family).toMatchObject({
    family: 'developer_workflows',
    familySlug: 'developer_workflows',
    displayName: 'Developer Workflows',
    status: 'ready',
    entityCount: 1,
  });
  expect(Array.isArray(family.json?.data?.family?.members)).toBe(true);
  expect(family.json.data.family.members[0]).toMatchObject({
    registryEntityId: 'reg_github_issue_reply',
    slug: 'github-issue-reply',
  });
});
