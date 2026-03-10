const { test, expect } = require('@playwright/test');

const {
  getPortalState,
  resetPortalWebState,
  seedPokerOperatorFixture,
  syncPokerMirror,
} = require('./helpers/portal_web');
const {
  getRegistryProof,
  getRegistryWebPokerFixture,
} = require('./helpers/registry_web_poker');

const registryEntityId = 'reg_github_issue_reply';

function makePokerProofFixture({ proofCard }) {
  const poker = proofCard?.poker || {};
  return {
    schemaVersion: '2026-03-09',
    operatorVersion: '0.9.0',
    seasons: [
      {
        seasonId: String(poker.seasonId || 'pks_proof'),
        seasonSlug: 'proof-2026',
        displayName: 'Proof 2026',
        rulesVersion: 'poker-rules-v3',
        operatorVersion: '0.9.0',
        status: 'open',
        submissionOpenAt: '2026-03-01T00:00:00.000Z',
        submissionCloseAt: '2030-04-15T00:00:00.000Z',
        latestReplayRunId: String(poker.runId || 'pkr_proof_01'),
        divisions: [
          { divisionId: 'pkd_proof_browser', divisionSlug: 'browser-class', runnerKind: 'browser' },
        ],
      },
    ],
    batches: [
      {
        batchId: 'pkb_proof_01',
        seasonId: String(poker.seasonId || 'pks_proof'),
        batchKind: 'season_eval',
        submissionIds: [String(poker.submissionId || 'pksub_proof_01')],
        batchConfig: { seedSetVersion: 'seed-v4', gamesPerPairing: 40 },
        status: 'queued',
      },
    ],
    runs: [
      {
        runId: String(poker.runId || 'pkr_proof_01'),
        batchId: 'pkb_proof_01',
        seasonId: String(poker.seasonId || 'pks_proof'),
        summary: {
          winnerSeat: 2,
          turns: 184,
          seed: 'seed-v4-008',
        },
      },
    ],
    leaderboards: [
      {
        snapshotId: String(poker.snapshotId || 'pklb_proof_01'),
        seasonId: String(poker.seasonId || 'pks_proof'),
        rankings: [
          {
            submissionId: String(poker.submissionId || 'pksub_proof_01'),
            displayName: 'PortalBot',
            rank: Number(poker.rank || 1),
            rating: Number(poker.rating || 42.8),
            games: 320,
            wins: 188,
          },
        ],
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-10T10:00:00.000Z',
      },
    ],
  };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M24.13: registry proof surfaces show poker-linked rank, browser class, and safety metadata without rewriting operator truth', async ({ request, page }) => {
  await getPortalState(request);
  const proofFixture = await getRegistryWebPokerFixture(request, 'registry_proof_seed');
  const safetyFixture = await getRegistryWebPokerFixture(request, 'poker_safety_evidence_seed');
  expect(proofFixture.ok).toBe(true);
  expect(safetyFixture.ok).toBe(true);

  const proofCard = Array.isArray(proofFixture.fixture?.proofCards) ? proofFixture.fixture.proofCards[0] : null;
  const safetyEvidence = Array.isArray(safetyFixture.fixture?.evidence) ? safetyFixture.fixture.evidence[0] : null;
  expect(proofCard).toBeTruthy();
  expect(safetyEvidence).toBeTruthy();

  await seedPokerOperatorFixture(request, makePokerProofFixture({ proofCard }));
  const sync = await syncPokerMirror(request);
  expect(sync.resp.ok()).toBe(true);

  const leaderboardResponse = await request.get(`/api/poker/leaderboards/${encodeURIComponent(String(proofCard.poker.seasonId || ''))}/latest`);
  expect(leaderboardResponse.ok()).toBe(true);
  const leaderboardBody = await leaderboardResponse.json();
  const leaderboardTop = leaderboardBody?.data?.rankings?.[0] || {};

  const proofResponse = await getRegistryProof(request, registryEntityId);
  expect(proofResponse.status).toBe(200);
  expect(proofResponse.json?.ok).toBe(true);
  const registryProofCard = proofResponse.json?.data?.proofCards?.[0] || null;
  expect(registryProofCard).toMatchObject({
    evidenceId: String(proofCard.evidenceId || ''),
    sourceKind: 'poker',
    poker: {
      seasonId: String(proofCard.poker.seasonId || ''),
      snapshotId: String(proofCard.poker.snapshotId || ''),
      submissionId: String(proofCard.poker.submissionId || ''),
      runId: String(proofCard.poker.runId || ''),
      rank: Number(leaderboardTop.rank || 0),
      rating: Number(leaderboardTop.rating || 0),
    },
    safety: {
      sourceKind: String(safetyEvidence.sourceKind || ''),
      flags: safetyEvidence.flags,
      policyLabels: safetyEvidence.policyLabels,
    },
    browserClass: {
      divisionSlug: String(safetyEvidence.browserClass.divisionSlug || ''),
      runnerKind: String(safetyEvidence.browserClass.runnerKind || ''),
    },
  });

  await page.goto('/registry.html');
  const card = page.locator('[data-registry-proof-card]').first();
  await expect(card).toContainText(String(proofCard.evidenceId || ''));
  await expect(card).toContainText(`Rank: ${leaderboardTop.rank}`);
  await expect(card).toContainText(String(leaderboardTop.rating));
  await expect(card).toContainText(String(safetyEvidence.browserClass.divisionSlug || ''));
  await expect(card).toContainText(String(safetyEvidence.flags[0] || ''));
  await expect(card).toContainText(String(safetyEvidence.policyLabels[0] || ''));
});
