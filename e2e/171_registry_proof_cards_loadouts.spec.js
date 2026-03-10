const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const {
  getRegistryProof,
  getRegistryWebPokerFixture,
} = require('./helpers/registry_web_poker');

const registryEntityId = 'reg_github_issue_reply';

function pickProofShape(payload) {
  const proofCards = Array.isArray(payload?.proofCards) ? payload.proofCards : [];
  const loadouts = Array.isArray(payload?.loadouts) ? payload.loadouts : [];
  return {
    proofCards: proofCards.map((entry) => ({
      evidenceId: String(entry?.evidenceId || ''),
      sourceKind: String(entry?.sourceKind || ''),
      linkedAt: String(entry?.linkedAt || ''),
    })),
    loadouts: loadouts.map((entry) => ({
      loadoutId: String(entry?.loadoutId || ''),
      componentRefs: Array.isArray(entry?.componentRefs)
        ? entry.componentRefs.map((component) => String(component || ''))
        : [],
      bundleIds: Array.isArray(entry?.bundles)
        ? entry.bundles.map((bundle) => String(bundle?.bundleId || ''))
        : [],
      bundleHashes: Array.isArray(entry?.bundles)
        ? entry.bundles.map((bundle) => String(bundle?.contentHash || ''))
        : [],
    })),
  };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M24.4: registry proof cards and loadouts stay deterministic across API and storefront rendering', async ({ request, page }) => {
  const fixture = await getRegistryWebPokerFixture(request, 'registry_proof_seed');
  expect(fixture.ok).toBe(true);
  const expectedProofs = Array.isArray(fixture.fixture?.proofCards) ? fixture.fixture.proofCards : [];
  const expectedLoadouts = Array.isArray(fixture.fixture?.loadouts) ? fixture.fixture.loadouts : [];

  const proofA = await getRegistryProof(request, registryEntityId);
  const proofB = await getRegistryProof(request, registryEntityId);
  expect(proofA.status).toBe(200);
  expect(proofB.status).toBe(200);
  expect(proofA.json?.ok).toBe(true);
  expect(proofB.json?.ok).toBe(true);
  expect(proofA.json?.data).toEqual(proofB.json?.data);

  const normalized = pickProofShape(proofA.json?.data || {});
  expect(normalized.proofCards).toEqual(expectedProofs.map((entry) => ({
    evidenceId: String(entry?.evidenceId || ''),
    sourceKind: String(entry?.sourceKind || ''),
    linkedAt: String(entry?.linkedAt || ''),
  })));
  expect(normalized.loadouts).toEqual(expectedLoadouts.map((entry) => ({
    loadoutId: String(entry?.loadoutId || ''),
    componentRefs: Array.isArray(entry?.componentRefs) ? entry.componentRefs.map((component) => String(component || '')) : [],
    bundleIds: [String(entry?.bundleId || '')].filter(Boolean),
    bundleHashes: [String(entry?.contentHash || '')].filter(Boolean),
  })));

  const entityResponse = await request.get(`/api/registry/entities/${encodeURIComponent(registryEntityId)}`, {
    failOnStatusCode: false,
  });
  expect(entityResponse.status()).toBe(200);
  const entityPayload = await entityResponse.json();
  expect(entityPayload?.ok).toBe(true);
  expect(entityPayload?.data?.entity).toMatchObject({
    registryEntityId,
    storefront: {
      proofCount: expectedProofs.length,
      loadoutCount: expectedLoadouts.length,
    },
  });
  expect(Array.isArray(entityPayload?.data?.entity?.proofCards)).toBe(true);
  expect(Array.isArray(entityPayload?.data?.entity?.loadouts)).toBe(true);

  await page.goto('/registry.html');
  await expect(page.locator('[data-registry-proof-card]')).toHaveCount(expectedProofs.length);
  await expect(page.locator('[data-registry-loadout]')).toHaveCount(expectedLoadouts.length);
  await expect(page.locator('[data-registry-proof-card]').first()).toContainText(String(expectedProofs[0]?.evidenceId || ''));
  await expect(page.locator('[data-registry-loadout]').first()).toContainText(String(expectedLoadouts[0]?.loadoutId || ''));
  await expect(page.locator('[data-registry-loadout]').first()).toContainText(String(expectedLoadouts[0]?.contentHash || ''));

  await resetPortalWebState(request);
  const proofAfterReset = await getRegistryProof(request, registryEntityId);
  expect(proofAfterReset.status).toBe(200);
  expect(pickProofShape(proofAfterReset.json?.data || {})).toEqual(normalized);
});
