const crypto = require('crypto');
const { test, expect } = require('@playwright/test');

const {
  getPortalState,
  resetPortalWebState,
  seedPokerOperatorFixture,
  syncPokerMirror,
} = require('./helpers/portal_web');

function stableJsonValue(value) {
  if (Array.isArray(value)) return value.map((item) => stableJsonValue(item));
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((acc, key) => {
      acc[key] = stableJsonValue(value[key]);
      return acc;
    }, {});
  }
  return value;
}

function stableJsonStringify(value) {
  return JSON.stringify(stableJsonValue(value));
}

function sha256(value) {
  return `sha256:${crypto.createHash('sha256').update(value, 'utf8').digest('hex')}`;
}

function computeBundleHashes({ artifactUri, entrypoint, declaredCapabilities }) {
  const normalizedCapabilities = stableJsonValue(declaredCapabilities || {});
  const contentAddress = sha256(stableJsonStringify({
    artifactUri,
    entrypoint,
    declaredCapabilities: normalizedCapabilities,
  }));
  const manifestHash = sha256(stableJsonStringify({
    schema: 'agent-town-poker-bundle/v1',
    bundle: {
      contentAddress,
      artifactUri,
      entrypoint,
    },
    declaredCapabilities: normalizedCapabilities,
  }));
  return {
    contentAddress,
    manifestHash,
  };
}

function makeSeasonFixture() {
  return {
    schemaVersion: '2026-03-09',
    operatorVersion: '0.9.0',
    seasons: [
      {
        seasonId: 'pks_hash',
        seasonSlug: 'hash-2026',
        displayName: 'Hash 2026',
        rulesVersion: 'poker-rules-v3',
        operatorVersion: '0.9.0',
        status: 'open',
        submissionOpenAt: '2026-03-01T00:00:00.000Z',
        submissionCloseAt: '2030-04-15T00:00:00.000Z',
        rulesSummary: {
          summary: 'Deterministic replay, operator-authoritative scoring, and no collusion.',
          highlights: [
            'Browser Class uses restricted browser-compatible runners.',
            'Portal mirrors operator labels without rewriting divisions.',
          ],
        },
        divisions: [
          { divisionId: 'pkd_hash_browser', divisionSlug: 'browser-class', runnerKind: 'browser' },
          { divisionId: 'pkd_hash_open', divisionSlug: 'open', runnerKind: 'native' },
        ],
      },
    ],
  };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M24.11: poker season detail exposes rules/submission window and Portal computes deterministic bundle hashes', async ({ request, page }) => {
  await getPortalState(request);
  await seedPokerOperatorFixture(request, makeSeasonFixture());
  const sync = await syncPokerMirror(request);
  expect(sync.resp.ok()).toBe(true);

  const seasonDetailResponse = await request.get('/api/poker/seasons/pks_hash');
  expect(seasonDetailResponse.ok()).toBe(true);
  const seasonDetailBody = await seasonDetailResponse.json();
  expect(seasonDetailBody?.data?.season).toMatchObject({
    seasonId: 'pks_hash',
    rulesSummary: {
      summary: 'Deterministic replay, operator-authoritative scoring, and no collusion.',
    },
    submissionWindow: {
      state: 'open',
      acceptingSubmissions: true,
      opensAt: '2026-03-01T00:00:00.000Z',
      closesAt: '2030-04-15T00:00:00.000Z',
    },
  });

  await page.goto('/poker/seasons/pks_hash?embed=1');
  await expect(page.locator('#seasonRulesSummary')).toContainText('Deterministic replay, operator-authoritative scoring, and no collusion.');
  await expect(page.locator('#seasonSubmissionWindow')).toContainText('open');
  await expect(page.locator('#seasonSubmissionWindow')).toContainText('accepting submissions');
  await expect(page.locator('#pokerContent')).toContainText('browser-class');

  const artifactUri = 's3://operator/submissions/browser-class-v1.zip';
  const entrypoint = 'runner/browser.py';
  const declaredCapabilities = {
    browserClass: 'lite',
    browserCompatible: true,
  };
  const expectedHashes = computeBundleHashes({
    artifactUri,
    entrypoint,
    declaredCapabilities,
  });

  await page.locator('#bundleArtifactUri').fill(artifactUri);
  await page.locator('#bundleEntrypoint').fill(entrypoint);
  await page.locator('#bundleCapabilities').fill(JSON.stringify(declaredCapabilities, null, 2));

  await expect(page.locator('#bundleContentAddress')).toHaveValue(expectedHashes.contentAddress);
  await expect(page.locator('#bundleManifestHash')).toHaveValue(expectedHashes.manifestHash);

  const submissionRequestPromise = page.waitForRequest((candidate) => (
    candidate.method() === 'POST'
      && candidate.url().includes('/api/poker/seasons/pks_hash/submissions')
  ));
  await page.locator('#pokerSubmissionForm button[type="submit"]').click();
  const submissionRequest = await submissionRequestPromise;
  const payload = submissionRequest.postDataJSON();
  expect(payload?.bundle).toMatchObject({
    artifactUri,
    entrypoint,
    contentAddress: expectedHashes.contentAddress,
    manifestHash: expectedHashes.manifestHash,
  });
  expect(payload?.declaredCapabilities).toEqual(declaredCapabilities);

  await expect(page.locator('#pokerStatus')).toContainText('WALLET_SUBJECT_REQUIRED');
});
