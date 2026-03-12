const { test, expect } = require('@playwright/test');
const { resetPortalWebState } = require('./helpers/portal_web');

const ADMIN_HEADERS = { 'x-admin-token': 'test-admin' };

function findTemplate(templates, title) {
  return (Array.isArray(templates) ? templates : []).find((item) => String(item?.title || '') === title) || null;
}

function findScheduledItems(scheduleBody, title) {
  const days = Array.isArray(scheduleBody?.data?.days) ? scheduleBody.data.days : [];
  return days.flatMap((day) => Array.isArray(day?.items) ? day.items : []).filter((item) => String(item?.title || '') === title);
}

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M25.8++: admin schedule templates materialize recurring tournament events into the public calendar', async ({ request }) => {
  const title = 'Daily Admin Contract Ladder';
  const createResponse = await request.post('/api/poker/play/admin/schedule/templates?asOf=2026-03-12T08%3A00%3A00.000Z', {
    headers: ADMIN_HEADERS,
    data: {
      title,
      firstStartAt: '2026-03-13T12:00:00.000Z',
      recurrenceKind: 'daily',
      eventCount: 3,
      buyInOil: 440,
      smallBlindOil: 55,
      bigBlindOil: 110,
      maxSeats: 6,
      minPlayers: 2,
      lateRegistrationHands: 2,
      handsPerBlindLevel: 8,
    },
  });
  expect(createResponse.ok()).toBe(true);
  const createBody = await createResponse.json();
  const createdTemplateId = String(createBody?.data?.createdTemplateId || '');
  expect(createdTemplateId).toBeTruthy();

  const createdTemplate = findTemplate(createBody?.data?.templates, title);
  expect(createdTemplate).toBeTruthy();
  expect(createdTemplate?.templateId).toBe(createdTemplateId);
  expect(createdTemplate?.recurrenceKind).toBe('daily');
  expect(createdTemplate?.recurrenceIntervalHours).toBe(24);
  expect(createdTemplate?.recurrenceLabel).toBe('Daily 12:00 UTC');
  expect(createdTemplate?.firstStartAt).toBe('2026-03-13T12:00:00.000Z');
  expect(createdTemplate?.eventCount).toBe(3);
  expect(createdTemplate?.generatedEventCount).toBe(3);
  expect(createdTemplate?.nextStartAt).toBe('2026-03-13T12:00:00.000Z');
  expect(Array.isArray(createdTemplate?.items)).toBe(true);
  expect(createdTemplate.items).toHaveLength(3);
  expect(createdTemplate.items.map((item) => item?.scheduledStartAt)).toEqual([
    '2026-03-13T12:00:00.000Z',
    '2026-03-14T12:00:00.000Z',
    '2026-03-15T12:00:00.000Z',
  ]);

  const listResponse = await request.get('/api/poker/play/admin/schedule/templates?asOf=2026-03-12T08%3A00%3A00.000Z', {
    headers: ADMIN_HEADERS,
  });
  expect(listResponse.ok()).toBe(true);
  const listBody = await listResponse.json();
  const listedTemplate = findTemplate(listBody?.data?.templates, title);
  expect(listedTemplate?.templateId).toBe(createdTemplateId);
  expect(listedTemplate?.generatedEventCount).toBe(3);

  const publicScheduleResponse = await request.get('/api/poker/play/schedule?asOf=2026-03-12T08%3A00%3A00.000Z');
  expect(publicScheduleResponse.ok()).toBe(true);
  const publicScheduleBody = await publicScheduleResponse.json();
  const scheduledItems = findScheduledItems(publicScheduleBody, title);
  expect(scheduledItems).toHaveLength(3);
  expect(scheduledItems.map((item) => item?.scheduleTemplateId)).toEqual([createdTemplateId, createdTemplateId, createdTemplateId]);
  expect(scheduledItems.map((item) => item?.scheduleRecurrenceLabel)).toEqual(['Daily 12:00 UTC', 'Daily 12:00 UTC', 'Daily 12:00 UTC']);
  expect(scheduledItems.map((item) => item?.buyInOil)).toEqual([1100, 1100, 1100]);
});
