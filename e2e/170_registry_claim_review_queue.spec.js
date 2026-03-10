const { test, expect } = require('@playwright/test');

const {
  bindMockSolanaWallet,
  getPortalState,
  resetPortalWebState,
} = require('./helpers/portal_web');
const {
  getRegistryReviewQueue,
  getRegistryWebPokerFixture,
  startRegistryClaim,
} = require('./helpers/registry_web_poker');

const claimTargetId = 'reg_github_issue_reply';
const claimNote = 'Deterministic Registry claim from the seeded wallet.';

async function runDeterministicClaimFlow(request) {
  await resetPortalWebState(request);
  await getPortalState(request);
  await bindMockSolanaWallet(request);

  const created = await startRegistryClaim(request, {
    registryEntityId: claimTargetId,
    note: claimNote,
  });
  expect(created.status).toBe(201);
  expect(created.json?.ok).toBe(true);

  const queue = await getRegistryReviewQueue(request);
  expect(queue.status).toBe(200);
  expect(queue.json?.ok).toBe(true);

  return {
    created: created.json?.data || {},
    queue: queue.json?.data || {},
  };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M24.3: registry claim-start and review queue stay deterministic and wallet-bound', async ({ request }) => {
  const fixture = await getRegistryWebPokerFixture(request, 'registry_claim_review_seed');
  expect(fixture.ok).toBe(true);
  const expectedReviewKinds = Array.isArray(fixture.fixture?.expectedReviewKinds)
    ? fixture.fixture.expectedReviewKinds.map((entry) => String(entry || ''))
    : ['duplicate_check', 'claim_validation'];

  await getPortalState(request);
  const missingWallet = await startRegistryClaim(request, {
    registryEntityId: claimTargetId,
  });
  expect(missingWallet.status).toBe(400);
  expect(missingWallet.json?.ok).toBe(false);
  expect(String(missingWallet.json?.error?.code || '')).toBe('wallet_required');

  await bindMockSolanaWallet(request);
  const missingTarget = await startRegistryClaim(request, {});
  expect(missingTarget.status).toBe(400);
  expect(missingTarget.json?.ok).toBe(false);
  expect(String(missingTarget.json?.error?.code || '')).toBe('claim_target_missing');

  const firstPass = await runDeterministicClaimFlow(request);
  const firstClaim = firstPass.created.claim || {};
  const firstReviews = Array.isArray(firstPass.created.reviews) ? firstPass.created.reviews : [];
  const queueItemsA = Array.isArray(firstPass.queue.items) ? firstPass.queue.items : [];

  expect(firstClaim).toMatchObject({
    registryEntityId: claimTargetId,
    claimantWalletSubject: 'solana:So1anaMockResume11111111111111111111111111111',
    status: 'pending_validation',
  });
  expect(firstReviews.map((entry) => String(entry.reviewKind || ''))).toEqual(expectedReviewKinds);
  expect(queueItemsA.map((entry) => String(entry.reviewKind || ''))).toEqual(expectedReviewKinds);
  expect(Number(firstPass.queue.total || 0)).toBe(expectedReviewKinds.length);
  expect(firstPass.queue.counts).toMatchObject({
    byKind: {
      duplicate_check: 1,
      claim_validation: 1,
    },
    queued: 2,
  });
  expect(queueItemsA[0]).toMatchObject({
    reviewKind: 'duplicate_check',
    registryEntityId: claimTargetId,
    claimId: firstClaim.claimId,
    status: 'queued',
    entity: {
      registryEntityId: claimTargetId,
      familySlug: 'developer_workflows',
      slug: 'github-issue-reply',
    },
  });
  expect(queueItemsA[1]).toMatchObject({
    reviewKind: 'claim_validation',
    registryEntityId: claimTargetId,
    claimId: firstClaim.claimId,
    status: 'queued',
  });

  const conflict = await startRegistryClaim(request, {
    registryEntityId: claimTargetId,
    note: claimNote,
  });
  expect(conflict.status).toBe(409);
  expect(conflict.json?.ok).toBe(false);
  expect(String(conflict.json?.error?.code || '')).toBe('claim_conflict');
  expect(String(conflict.json?.error?.details?.claimId || '')).toBe(String(firstClaim.claimId || ''));

  const secondPass = await runDeterministicClaimFlow(request);
  const secondClaim = secondPass.created.claim || {};
  const queueItemsB = Array.isArray(secondPass.queue.items) ? secondPass.queue.items : [];

  expect(secondClaim.claimId).toBe(firstClaim.claimId);
  expect(
    queueItemsB.map((entry) => ({
      reviewId: String(entry.reviewId || ''),
      reviewKind: String(entry.reviewKind || ''),
      claimId: String(entry.claimId || ''),
      registryEntityId: String(entry.registryEntityId || ''),
      status: String(entry.status || ''),
    }))
  ).toEqual(
    queueItemsA.map((entry) => ({
      reviewId: String(entry.reviewId || ''),
      reviewKind: String(entry.reviewKind || ''),
      claimId: String(entry.claimId || ''),
      registryEntityId: String(entry.registryEntityId || ''),
      status: String(entry.status || ''),
    }))
  );
  expect(secondPass.queue.counts).toEqual(firstPass.queue.counts);
});
