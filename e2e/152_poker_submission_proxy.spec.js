const { test, expect } = require('@playwright/test');
const {
  getPokerSubmissionRow,
  getPortalState,
  getTableCount,
  resetPortalWebState,
  resetToken,
  seedPokerOperatorFixture,
} = require('./helpers/portal_web');

function makeSubmissionFixture(status = 'open') {
  return {
    schemaVersion: '2026-03-09',
    operatorVersion: '0.9.0',
    seasons: [
      {
        seasonId: 'pks_submit',
        seasonSlug: 'submit-2026',
        displayName: 'Submit 2026',
        rulesVersion: 'poker-rules-v3',
        operatorVersion: '0.9.0',
        status,
        submissionOpenAt: '2026-04-01T00:00:00.000Z',
        submissionCloseAt: status === 'closed'
          ? '2026-01-01T00:00:00.000Z'
          : '2030-04-15T00:00:00.000Z',
        divisions: [
          { divisionId: 'pkd_submit', divisionSlug: 'standard', runnerKind: 'native' },
        ],
      },
    ],
  };
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M16.11: poker submission proxy binds wallet/session ownership and replays idempotent submissions', async ({ request }) => {
  await getPortalState(request);
  const walletAddress = 'So1anaMockResume11111111111111111111111111111';
  const bindResp = await request.post('/__test__/session/bind-wallet', {
    headers: { 'x-test-reset': resetToken },
    data: {
      chain: 'solana',
      address: walletAddress,
    },
  });
  expect(bindResp.ok()).toBe(true);
  const bindBody = await bindResp.json();
  const portalSessionId = String(bindBody?.sessionId || '');
  expect(portalSessionId).not.toBe('');

  await seedPokerOperatorFixture(request, makeSubmissionFixture('closed'));
  const closedResp = await request.post('/api/poker/seasons/pks_submit/submissions', {
    headers: { 'Idempotency-Key': 'poker-submit-closed-001' },
    data: {
      portalSubmissionId: 'portal-submit-closed',
      bundle: {
        contentAddress: 'sha256:closed-bundle',
        manifestHash: 'sha256:closed-manifest',
        artifactUri: 's3://operator/submissions/closed.zip',
        entrypoint: 'play.py',
      },
      declaredCapabilities: {
        browserCompatible: false,
      },
    },
  });
  expect(closedResp.status()).toBe(409);
  const closedBody = await closedResp.json();
  expect(String(closedBody?.error?.code || '')).toBe('POKER_SEASON_CLOSED');

  await seedPokerOperatorFixture(request, makeSubmissionFixture('open'));

  const firstSubmit = await request.post('/api/poker/seasons/pks_submit/submissions', {
    headers: { 'Idempotency-Key': 'poker-submit-open-001' },
    data: {
      portalSubmissionId: 'portal-submit-open',
      bundle: {
        contentAddress: 'sha256:open-bundle',
        manifestHash: 'sha256:open-manifest',
        artifactUri: 's3://operator/submissions/open.zip',
        entrypoint: 'play.py',
      },
      declaredCapabilities: {
        browserCompatible: false,
      },
    },
  });
  expect(firstSubmit.ok()).toBe(true);
  const firstBody = await firstSubmit.json();
  expect(firstBody?.data?.replayed).toBe(false);
  const submissionId = String(firstBody?.data?.submission?.submissionId || '');
  expect(submissionId).toBe('portal-submit-open');
  expect(await getTableCount(request, 'poker_setup_submissions')).toBe(1);

  const replaySubmit = await request.post('/api/poker/seasons/pks_submit/submissions', {
    headers: { 'Idempotency-Key': 'poker-submit-open-001' },
    data: {
      portalSubmissionId: 'portal-submit-open',
      bundle: {
        contentAddress: 'sha256:open-bundle',
        manifestHash: 'sha256:open-manifest',
        artifactUri: 's3://operator/submissions/open.zip',
        entrypoint: 'play.py',
      },
      declaredCapabilities: {
        browserCompatible: false,
      },
    },
  });
  expect(replaySubmit.ok()).toBe(true);
  const replayBody = await replaySubmit.json();
  expect(replayBody?.data?.submission?.submissionId).toBe(submissionId);
  expect(await getTableCount(request, 'poker_setup_submissions')).toBe(1);

  const mirroredRow = await getPokerSubmissionRow(request, submissionId);
  expect(mirroredRow?.walletSubject).toBe(walletAddress);
  expect(mirroredRow?.portalSessionId).toBe(portalSessionId);
});
