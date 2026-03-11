const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const { getPlatformFixture } = require('./helpers/unified_platform');

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M35.0: Registry exposes a worker package family with plain-language storefront guidance', async ({ request, page }) => {
  const fixtureEnvelope = await getPlatformFixture(request, 'worker_package_registry_seed');
  expect(fixtureEnvelope?.ok).toBe(true);
  const fixture = fixtureEnvelope?.fixture || {};

  const searchResponse = await request.get('/api/registry/search?family=workers', {
    failOnStatusCode: false,
  });
  expect(searchResponse.status()).toBe(200);
  const searchPayload = await searchResponse.json();
  expect(searchPayload?.ok).toBe(true);
  const groups = Array.isArray(searchPayload?.data?.items) ? searchPayload.data.items : [];
  expect(groups).toHaveLength(1);
  expect(groups[0]).toMatchObject({
    familySlug: fixture.familySlug,
    familyTitle: fixture.familyTitle,
  });
  expect(groups[0]?.members?.[0]).toMatchObject({
    registryEntityId: fixture.registryEntityId,
    entityVersionId: fixture.entityVersionId,
    workerPackage: expect.objectContaining({
      oneLineBenefit: expect.any(String),
      whatItDoes: expect.any(String),
      bestFor: expect.any(Array),
      recommendedOfficeLabel: expect.any(String),
      supportedSurfaces: fixture.supportedSurfaces,
      install: expect.objectContaining({
        actionLabel: 'Install to House',
        shareLabel: 'Send to Friend',
        detailLabel: 'View Details',
      }),
    }),
  });

  const entityResponse = await request.get(`/api/registry/entities/${encodeURIComponent(fixture.registryEntityId)}`, {
    failOnStatusCode: false,
  });
  expect(entityResponse.status()).toBe(200);
  const entityPayload = await entityResponse.json();
  expect(entityPayload?.ok).toBe(true);
  expect(entityPayload?.data?.entity).toMatchObject({
    registryEntityId: fixture.registryEntityId,
    entityVersionId: fixture.entityVersionId,
    workerPackage: expect.objectContaining({
      portableArtifacts: expect.objectContaining({
        loadoutId: fixture.loadoutId,
        bundleHash: fixture.bundleHash,
      }),
    }),
  });

  await page.goto('/registry.html?family=workers');
  await expect(page.getByTestId('registry-worker-package-card')).toHaveCount(1);
  await expect(page.getByTestId('registry-worker-package-card')).toContainText(fixture.displayName);
  for (const field of fixture.plainLanguageFields || []) {
    if (field === 'recommendedOfficeLabel') {
      await expect(page.getByTestId('registry-worker-package-card')).toContainText('Recommended office');
      continue;
    }
    if (field === 'supportedSurfaces') {
      await expect(page.getByTestId('registry-worker-package-card')).toContainText('Works across');
      continue;
    }
    await expect(page.getByTestId('registry-worker-package-card')).toContainText(
      field === 'oneLineBenefit'
        ? 'Keeps your House organized and easy to understand.'
        : field === 'whatItDoes'
          ? 'Explains what is happening in plain language'
          : 'Best for'
    );
  }
  await expect(page.getByTestId('registry-worker-package-install')).toHaveText('Install to House');
  await expect(page.getByTestId('registry-worker-package-share')).toHaveText('Send to Friend');
  await expect(page.getByTestId('registry-worker-package-details')).toHaveText('View Details');
  await expect(page.getByTestId('registry-worker-package-advanced-body')).not.toBeVisible();
});
