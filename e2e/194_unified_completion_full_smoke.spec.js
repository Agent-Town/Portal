const fs = require('fs');
const path = require('path');

const { test, expect } = require('@playwright/test');

const { invokeExperienceTool } = require('./helpers/experience_intents');
const { seedRecoverableTokenHouse } = require('./helpers/phase1');
const {
  getRegistryProof,
} = require('./helpers/registry_web_poker');
const {
  getPortalState,
  resetPortalWebState,
  seedPokerOperatorFixture,
  syncPokerMirror,
} = require('./helpers/portal_web');
const { waitForLiteApi } = require('./helpers/trainer');
const {
  attachHouseToPageSession,
  compilePlatformIntegration,
  createPlatformConfigVersion,
  createPlatformRun,
  createPlatformTrainerJob,
  getPlatformFixture,
  getPlatformPackCompatibility,
  getPlatformTrainerResult,
  ingestPlatformTraceRecords,
  promotePlatformConfigVersion,
  readWorkerSessionId,
  resolvePlatformIntegration,
  verifyPlatformPackCompatibility,
} = require('./helpers/unified_platform');

const registryEntityId = 'reg_github_issue_reply';
const smokeSeasonId = 'pks_smoke_01';

function buildConfigPayload(configVersionId) {
  return {
    configVersionId,
    teamId: 'team_main',
    displayVersion: `${configVersionId}@2026.03.10`,
    branch: 'joined-completion',
    status: 'candidate',
    componentRefs: {
      housePolicyVersionId: 'hpv_joined_smoke_01',
      teamCompositionVersionId: 'tcv_joined_smoke_01',
      agentConfigVersionIds: ['agv_joined_smoke_01'],
      officePolicyVersionIds: [],
      experiencePresetVersionId: 'epv_joined_smoke_01',
      integrationOverlayVersionIds: [],
      trainerPresetVersionId: 'tpv_joined_smoke_01',
    },
  };
}

function buildSmokePokerOperatorFixture() {
  return {
    schemaVersion: '2026-03-09',
    operatorVersion: '0.9.0',
    seasons: [
      {
        seasonId: smokeSeasonId,
        seasonSlug: 'smoke-2026',
        displayName: 'Smoke 2026',
        rulesVersion: 'poker-rules-v4',
        operatorVersion: '0.9.0',
        status: 'open',
        submissionOpenAt: '2026-03-01T00:00:00.000Z',
        submissionCloseAt: '2030-03-31T00:00:00.000Z',
        latestReplayRunId: 'pkr_smoke_01',
        divisions: [
          { divisionId: 'pkd_smoke_browser', divisionSlug: 'browser-class', runnerKind: 'browser' },
        ],
      },
    ],
    submissions: [
      {
        submissionId: 'pksub_smoke_01',
        seasonId: smokeSeasonId,
        walletAddress: '0xsmoke000000000000000000000000000000000001',
        walletChain: 'evm',
        bundleHash: 'sha256:smoke-bundle-01',
        manifestHash: 'sha256:smoke-manifest-01',
        divisionSlug: 'browser-class',
        status: 'accepted',
      },
    ],
    batches: [
      {
        batchId: 'pkb_smoke_01',
        seasonId: smokeSeasonId,
        batchKind: 'season_eval',
        submissionIds: ['pksub_smoke_01'],
        batchConfig: { seedSetVersion: 'seed-smoke-v1', gamesPerPairing: 24 },
        status: 'completed',
      },
    ],
    runs: [
      {
        runId: 'pkr_smoke_01',
        batchId: 'pkb_smoke_01',
        seasonId: smokeSeasonId,
        replayReady: true,
        summary: {
          winnerSeat: 2,
          turns: 144,
          seed: 'seed-smoke-v1-001',
        },
      },
    ],
    leaderboards: [
      {
        snapshotId: 'pklb_smoke_01',
        seasonId: smokeSeasonId,
        rankings: [
          {
            submissionId: 'pksub_smoke_01',
            displayName: 'PortalBot Smoke',
            rank: 1,
            rating: 51.2,
            games: 144,
            wins: 88,
          },
        ],
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-10T10:00:00.000Z',
      },
    ],
    replays: [
      {
        replayId: 'pkr_smoke_01',
        runId: 'pkr_smoke_01',
        replayFormat: 'poker-run-replay-v1',
        artifactSha256: 'sha256:smoke-replay-01',
        summaryJson: {
          winnerSeat: 2,
          turns: 144,
          seed: 'seed-smoke-v1-001',
        },
      },
    ],
  };
}

async function readJson(response) {
  return await response.json();
}

async function reopenHouseModal(page) {
  const reopened = await invokeExperienceTool(page, 'agent_town_ui_open_modal', {
    modal: 'house',
    params: {},
  });
  expect(reopened?.ok).toBe(true);
  expect(reopened?.applied).toBe(true);
  await expect(page.getByTestId('house-console-panel')).toBeVisible();
}

function assertStillInHouseShell(page) {
  const currentUrl = new URL(page.url());
  expect(currentUrl.pathname).toBe('/app');
  expect(currentUrl.searchParams.get('district')).toBe('house');
}

function verifyCompletionDocs() {
  const repoRoot = path.join(__dirname, '..');
  const docPaths = [
    path.join(repoRoot, 'specs/22_option5_integration_unified_completion_spec.md'),
    path.join(repoRoot, 'specs/23_option5_integration_completion_backlog.md'),
    path.join(repoRoot, 'specs/25_option5_integration_platform_house_tracks_tdd_spec.md'),
  ];
  for (const docPath of docPaths) {
    const text = fs.readFileSync(docPath, 'utf8');
    expect(text).toMatch(/Werewolf.*out of scope|non-Werewolf/);
  }
  return 'docs:aligned';
}

async function collectJoinedCompletionCheckpoints(page, request) {
  const smokeFixture = await getPlatformFixture(request, 'joined_completion_smoke_seed');
  expect(smokeFixture?.ok).toBe(true);
  expect(smokeFixture?.fixture?.smoke).toEqual({
    registry: true,
    web: true,
    poker: true,
    trainer: true,
    house: true,
    tracks: true,
  });

  const seededHouse = await seedRecoverableTokenHouse(request);
  await getPortalState(request);
  await seedPokerOperatorFixture(request, buildSmokePokerOperatorFixture());
  const sync = await syncPokerMirror(request);
  expect(sync.resp.ok(), JSON.stringify(sync.body)).toBe(true);

  const configCreate = await createPlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'joined-smoke-config-001',
    payload: buildConfigPayload('cfg_joined_smoke_01'),
  });
  expect(configCreate.status).toBe(201);

  const configPromote = await promotePlatformConfigVersion(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    configVersionId: 'cfg_joined_smoke_01',
    teamId: 'team_main',
    idempotencyKey: 'joined-smoke-config-promote-001',
  });
  expect(configPromote.status).toBe(200);

  const webRun = await createPlatformRun(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    experienceId: 'web.agent',
    teamId: 'team_main',
    configVersionId: 'cfg_joined_smoke_01',
    entryMode: 'normal',
    idempotencyKey: 'joined-smoke-web-run-001',
  });
  expect(webRun.status).toBe(201);
  const webRunId = String(webRun.json?.data?.runId || '');
  expect(webRunId).toMatch(/^run_/);

  const webIngest = await ingestPlatformTraceRecords(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    runId: webRunId,
    idempotencyKey: 'joined-smoke-web-ingest-001',
    records: [
      {
        ingestKey: 'joined-smoke-web-1',
        sourceType: 'worker',
        payloadSchema: 'raw.web.observation/v1',
        payload: {
          kind: 'navigate',
          url: 'https://example.com/smoke/operators',
        },
      },
      {
        ingestKey: 'joined-smoke-web-2',
        sourceType: 'worker',
        payloadSchema: 'raw.web.observation/v1',
        payload: {
          kind: 'navigate',
          url: 'https://example.com/smoke/alerts',
        },
      },
    ],
  });
  expect(webIngest.status).toBe(200);
  expect(Number(webIngest.json?.data?.accepted || 0)).toBe(2);

  const pokerRun = await createPlatformRun(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    experienceId: 'poker.season',
    teamId: 'team_main',
    configVersionId: 'cfg_joined_smoke_01',
    entryMode: 'season_lock',
    idempotencyKey: 'joined-smoke-poker-run-001',
  });
  expect(pokerRun.status).toBe(201);
  const pokerRunId = String(pokerRun.json?.data?.runId || '');
  expect(pokerRunId).toMatch(/^run_/);

  const pokerIngest = await ingestPlatformTraceRecords(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    runId: pokerRunId,
    idempotencyKey: 'joined-smoke-poker-ingest-001',
    records: [
      {
        ingestKey: 'joined-smoke-poker-1',
        sourceType: 'operator',
        payloadSchema: 'raw.poker.hand/v1',
        payload: {
          kind: 'hand_summary',
          handId: 'smoke-hand-001',
          winner: 'seat_1',
        },
      },
      {
        ingestKey: 'joined-smoke-poker-2',
        sourceType: 'operator',
        payloadSchema: 'raw.poker.hand/v1',
        payload: {
          kind: 'hand_summary',
          handId: 'smoke-hand-002',
          winner: 'seat_2',
        },
      },
      {
        ingestKey: 'joined-smoke-poker-3',
        sourceType: 'operator',
        payloadSchema: 'raw.poker.hand/v1',
        payload: {
          kind: 'hand_summary',
          handId: 'smoke-hand-003',
          winner: 'seat_3',
        },
      },
    ],
  });
  expect(pokerIngest.status).toBe(200);
  expect(Number(pokerIngest.json?.data?.accepted || 0)).toBe(3);

  const compareJob = await createPlatformTrainerJob(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'joined-smoke-trainer-compare-001',
    payload: {
      teamId: 'team_main',
      jobKind: 'trainer_job.compare',
      targets: {
        configVersionIds: ['cfg_joined_smoke_01'],
        runIds: [webRunId, pokerRunId],
      },
      budget: {
        maxUsd: 5,
      },
    },
  });
  expect(compareJob.status).toBe(201);
  const compareTrainerResultId = String(compareJob.json?.data?.result?.trainerResultId || '');
  expect(compareTrainerResultId).toMatch(/^trr_/);

  const recommendJob = await createPlatformTrainerJob(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    idempotencyKey: 'joined-smoke-trainer-recommend-001',
    payload: {
      teamId: 'team_main',
      jobKind: 'trainer_job.recommend',
      targets: {
        configVersionIds: ['cfg_joined_smoke_01'],
      },
      budget: {
        maxUsd: 5,
      },
    },
  });
  expect(recommendJob.status).toBe(201);

  const trainerResult = await getPlatformTrainerResult(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    trainerResultId: compareTrainerResultId,
  });
  expect(trainerResult.status).toBe(200);
  const artifactKinds = Array.isArray(trainerResult.json?.data?.artifactRefs)
    ? trainerResult.json.data.artifactRefs.map((entry) => String(entry?.artifactKind || '')).filter(Boolean)
    : [];
  expect(artifactKinds).toEqual(['trainer_report']);

  const resolved = await resolvePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    targetUrl: 'https://github.com/openai/openai-codex/issues/1',
    idempotencyKey: 'joined-smoke-integration-resolve-001',
  });
  expect(resolved.status).toBe(201);
  const integrationId = String(resolved.json?.data?.integrationCandidateId || '');
  expect(integrationId).toMatch(/^intcand_/);

  const compiled = await compilePlatformIntegration(request, {
    houseId: seededHouse.houseId,
    houseAuthKey: seededHouse.houseAuthKey,
    integrationId,
    idempotencyKey: 'joined-smoke-integration-compile-001',
  });
  expect(compiled.status).toBe(201);

  const packCompatContract = await getPlatformPackCompatibility(request);
  expect(packCompatContract.status).toBe(200);
  expect(packCompatContract.json?.ok).toBe(true);

  const verifiedPack = await verifyPlatformPackCompatibility(request, {
    manifestRoot: 'manifest.json',
    manifest: compiled.json?.data?.manifest,
    files: compiled.json?.data?.manifest?.files,
  });
  expect(verifiedPack.status).toBe(200);
  expect(verifiedPack.json?.data?.compatible).toBe(true);

  await page.goto('/app?district=house&liteDriver=phase1');
  await waitForLiteApi(page);
  const attached = await attachHouseToPageSession(page, {
    houseId: seededHouse.houseId,
    teamId: 'team_main',
  });
  expect(attached.status).toBe(200);
  await expect(page.locator('#districtModalBackdrop:not(.is-hidden)')).toHaveCount(1);
  await expect(page.getByTestId('house-console-panel')).toBeVisible();
  const workerSessionId = await readWorkerSessionId(page);
  expect(workerSessionId).toMatch(/^sess_/);
  assertStillInHouseShell(page);

  const checkpoints = ['house:shell-ready'];

  await page.getByTestId('house-open-workshop').click();
  await expect(page.getByTestId('house-workshop-panel')).toBeVisible();
  const workshopBody = await readJson(await page.request.get('/api/platform/workshop'));
  expect(workshopBody?.data?.activeConfigVersionId).toBe('cfg_joined_smoke_01');
  checkpoints.push(`house:workshop:${String(workshopBody?.data?.activeConfigVersionId || '')}`);

  await page.getByTestId('house-open-tracks').click();
  await expect(page.getByTestId('house-tracks-panel')).toBeVisible();
  const tracksBody = await readJson(await page.request.get('/api/platform/tracks'));
  const trackSummary = (Array.isArray(tracksBody?.data?.tracks) ? tracksBody.data.tracks : [])
    .map((entry) => `${String(entry?.title || '')}=${Math.round(Number(entry?.progress || 0) * 100)}`)
    .join('|');
  expect(trackSummary).toBe('Poker Mastery=75|Web Ops=50|Builder=25|Analyst=40');
  checkpoints.push(`tracks:${trackSummary}`);

  await page.getByTestId('house-open-house-trainer').click();
  await expect(page.getByTestId('house-trainer-panel')).toBeVisible();
  await expect(page.getByTestId('house-trainer-results')).toContainText(compareTrainerResultId);
  checkpoints.push(`trainer:${artifactKinds.join('|')}`);

  await page.getByTestId('house-open-experiences').click();
  await page.locator('#houseExperiencesList button[data-experience-id="web.agent"]').click();
  await page.locator('#houseExperienceActions button[data-action-id="open_primary"]').click();
  await expect(page.locator('#districtModalTitle')).toHaveText('Atlas Depot');
  expect(await readWorkerSessionId(page)).toBe(workerSessionId);
  assertStillInHouseShell(page);
  checkpoints.push('web:atlas-modal');
  checkpoints.push(`web:pack-compat:${verifiedPack.json?.data?.compatible === true ? 'ok' : 'bad'}`);

  await reopenHouseModal(page);
  await page.getByTestId('house-open-experiences').click();
  await page.locator('#houseExperiencesList button[data-experience-id="web.agent"]').click();
  await page.locator('#houseExperienceActions button[data-action-id="open_registry"]').click();
  await expect(page.locator('#districtModalTitle')).toHaveText('Registry');
  await expect(page.frameLocator('iframe.districtFrame').locator('[data-registry-proof-card]').first()).toBeVisible();
  expect(await readWorkerSessionId(page)).toBe(workerSessionId);
  assertStillInHouseShell(page);
  const proof = await getRegistryProof(request, registryEntityId);
  expect(proof.status).toBe(200);
  expect(Number(proof.json?.data?.summary?.proofCardCount || 0)).toBe(1);
  expect(Number(proof.json?.data?.summary?.loadoutCount || 0)).toBe(1);
  checkpoints.push(`registry:${Number(proof.json?.data?.summary?.proofCardCount || 0)}/${Number(proof.json?.data?.summary?.loadoutCount || 0)}`);

  await reopenHouseModal(page);
  await page.getByTestId('house-open-experiences').click();
  await page.locator('#houseExperiencesList button[data-experience-id="poker.season"]').click();
  await page.locator('#houseExperienceActions button[data-action-id="open_primary"]').click();
  await expect(page.locator('#districtModalTitle')).toContainText('Poker');
  await expect(page.frameLocator('iframe.districtFrame').getByText('Smoke 2026')).toBeVisible();
  expect(await readWorkerSessionId(page)).toBe(workerSessionId);
  assertStillInHouseShell(page);
  const leaderboardBody = await readJson(await request.get(`/api/poker/leaderboards/${encodeURIComponent(smokeSeasonId)}/latest`));
  const topRanking = leaderboardBody?.data?.rankings?.[0] || {};
  expect(Number(topRanking.rank || 0)).toBe(1);
  checkpoints.push(`poker:${String(topRanking.displayName || '')}:rank${Number(topRanking.rank || 0)}`);

  checkpoints.push(verifyCompletionDocs());
  checkpoints.push('session:stable');
  return checkpoints;
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.11: final joined completion smoke is deterministic and stays inside one coherent shell', async ({ page, request }) => {
  const firstPass = await collectJoinedCompletionCheckpoints(page, request);
  await resetPortalWebState(request);
  const secondPass = await collectJoinedCompletionCheckpoints(page, request);
  expect(secondPass).toEqual(firstPass);
  expect(firstPass).toEqual([
    'house:shell-ready',
    'house:workshop:cfg_joined_smoke_01',
    'tracks:Poker Mastery=75|Web Ops=50|Builder=25|Analyst=40',
    'trainer:trainer_report',
    'web:atlas-modal',
    'web:pack-compat:ok',
    'registry:1/1',
    'poker:PortalBot Smoke:rank1',
    'docs:aligned',
    'session:stable',
  ]);
});
