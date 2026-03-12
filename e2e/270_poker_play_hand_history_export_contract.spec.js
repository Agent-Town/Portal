const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');
const { bindPageSession, browserJson, seedPokerPlayHarness } = require('./helpers/poker_play');

const AS_OF = '2026-03-11T14:00:00.000Z';

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

async function browserText(page, path) {
  return await page.evaluate(async (requestPath) => {
    const response = await fetch(requestPath, {
      credentials: 'include',
      cache: 'no-store',
    });
    return {
      ok: response.ok,
      status: response.status,
      contentType: response.headers.get('content-type') || '',
      text: await response.text(),
    };
  }, path);
}

test('M25.5: player hand-history export stays reproducible, format-selectable, and privacy-safe', async ({ browser, request }) => {
  const seeded = await seedPokerPlayHarness(request, {
    scenario: 'history_results_story',
    asOf: AS_OF,
    tableId: 'pkt_play_phase25_history_export',
  });
  const tableId = String(seeded?.tableIds?.[0] || seeded?.tableId || '');
  const actor = seeded?.actors?.[0] || null;
  expect(tableId).toBeTruthy();
  expect(actor?.address).toBeTruthy();

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await bindPageSession(page, {
    address: actor.address,
    houseId: actor.houseId,
  });

  const historyResp = await browserJson(page, `/api/poker/play/tables/${encodeURIComponent(tableId)}/history?status=completed&asOf=${encodeURIComponent(AS_OF)}`);
  expect(historyResp.ok).toBe(true);
  const handId = String(historyResp.body?.data?.items?.[0]?.handId || '');
  expect(handId).toBeTruthy();

  const noteResp = await browserJson(page, '/api/poker/play/notebook', {
    method: 'POST',
    data: {
      tableId,
      handId,
      topic: 'Exported study note',
      body: 'Attach this note to the completed hand export.',
      tags: ['export'],
    },
  });
  expect(noteResp.ok).toBe(true);
  const entryId = String(noteResp.body?.data?.entry?.entryId || '');
  expect(entryId).toBeTruthy();

  const jsonResp = await browserText(page, `/api/poker/play/tables/${encodeURIComponent(tableId)}/history/export?format=json&status=completed&asOf=${encodeURIComponent(AS_OF)}`);
  expect(jsonResp.ok).toBe(true);
  expect(jsonResp.contentType).toContain('application/json');
  const jsonBody = JSON.parse(jsonResp.text || '{}');
  expect(jsonBody.ok).toBe(true);
  expect(jsonBody.data?.format).toBe('json');
  expect(jsonBody.data?.items).toHaveLength(2);
  expect(jsonBody.data?.items?.[0]?.agentProposal?.body).toBe('Call once and re-evaluate on the river if the board pairs.');
  expect(jsonBody.data?.items?.[0]?.notebookEntryIds || []).toContain(entryId);
  expect(JSON.stringify(jsonBody.data?.items || [])).not.toContain('"holeCards"');
  expect(JSON.stringify(jsonBody.data?.items || [])).not.toContain('Kh');
  expect(JSON.stringify(jsonBody.data?.items || [])).not.toContain('Qs');

  const ndjsonResp = await browserText(page, `/api/poker/play/tables/${encodeURIComponent(tableId)}/history/export?format=ndjson&status=completed&asOf=${encodeURIComponent(AS_OF)}`);
  expect(ndjsonResp.ok).toBe(true);
  expect(ndjsonResp.contentType).toContain('application/x-ndjson');
  const ndjsonRows = String(ndjsonResp.text || '').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
  expect(ndjsonRows).toHaveLength(2);
  expect(ndjsonRows[0]?.notebookEntryIds || []).toContain(entryId);
  expect(JSON.stringify(ndjsonRows)).not.toContain('Kh');
  expect(JSON.stringify(ndjsonRows)).not.toContain('Qs');

  const textResp = await browserText(page, `/api/poker/play/tables/${encodeURIComponent(tableId)}/history/export?format=text&status=completed&asOf=${encodeURIComponent(AS_OF)}`);
  expect(textResp.ok).toBe(true);
  expect(textResp.contentType).toContain('text/plain');
  expect(textResp.text).toContain('Hand 2');
  expect(textResp.text).toContain('Call once and re-evaluate on the river if the board pairs.');
  expect(textResp.text).toContain(entryId);
  expect(textResp.text).not.toContain('Kh');
  expect(textResp.text).not.toContain('Qs');

  await context.close();
});
