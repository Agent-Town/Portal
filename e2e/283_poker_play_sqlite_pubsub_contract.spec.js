const fs = require('fs');
const os = require('os');
const path = require('path');
const { test, expect } = require('@playwright/test');

const { createPokerPubSubSqliteAdapter } = require('../server/poker_pubsub');

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForCondition(predicate, {
  timeoutMs = 1500,
  intervalMs = 20,
  errorCode = 'WAIT_CONDITION_TIMEOUT',
} = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await delay(intervalMs);
  }
  throw new Error(errorCode);
}

test('M25.2 sqlite adapter: shared durable bus delivers exactly once across logical instances', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-town-poker-pubsub-'));
  const storePath = path.join(tempDir, 'pubsub.sqlite');
  const topic = 'poker-play:table:sqlite-contract';
  const deliveriesA = [];
  const deliveriesB = [];
  const adapterA = createPokerPubSubSqliteAdapter({
    storePath,
    pollIntervalMs: 10,
  });
  const adapterB = createPokerPubSubSqliteAdapter({
    storePath,
    pollIntervalMs: 10,
  });

  try {
    const unsubscribeA = adapterA.subscribe({
      topic,
      subscriberId: 'instance-a',
      listener(message, envelope) {
        deliveriesA.push({ message, envelope });
      },
    });
    const unsubscribeB = adapterB.subscribe({
      topic,
      subscriberId: 'instance-b',
      listener(message, envelope) {
        deliveriesB.push({ message, envelope });
      },
    });

    const firstEnvelope = adapterA.publish({
      topic,
      message: {
        channelKind: 'table',
        channelId: 'sqlite-contract',
        reason: 'action',
        version: 1,
      },
      metadata: {
        source: 'instance-a',
      },
    });
    expect(firstEnvelope?.publishCount).toBe(1);

    await waitForCondition(() => deliveriesA.length === 1 && deliveriesB.length === 1, {
      errorCode: 'SQLITE_PUBSUB_FIRST_DELIVERY_TIMEOUT',
    });
    expect(deliveriesA[0]?.envelope?.eventId).toBe(firstEnvelope?.eventId);
    expect(deliveriesB[0]?.envelope?.eventId).toBe(firstEnvelope?.eventId);

    await delay(80);
    expect(deliveriesA).toHaveLength(1);
    expect(deliveriesB).toHaveLength(1);

    const secondEnvelope = adapterB.publish({
      topic,
      message: {
        channelKind: 'table',
        channelId: 'sqlite-contract',
        reason: 'state_refresh',
        version: 2,
      },
      metadata: {
        source: 'instance-b',
      },
    });
    expect(secondEnvelope?.publishCount).toBe(2);

    await waitForCondition(() => deliveriesA.length === 2 && deliveriesB.length === 2, {
      errorCode: 'SQLITE_PUBSUB_SECOND_DELIVERY_TIMEOUT',
    });
    expect(deliveriesA[1]?.envelope?.eventId).toBe(secondEnvelope?.eventId);
    expect(deliveriesB[1]?.envelope?.eventId).toBe(secondEnvelope?.eventId);

    await delay(80);
    expect(deliveriesA).toHaveLength(2);
    expect(deliveriesB).toHaveLength(2);

    const summaryA = adapterA.getTopicSummary(topic);
    const summaryB = adapterB.getTopicSummary(topic);
    expect(summaryA?.adapterKind).toBe('sqlite');
    expect(summaryB?.adapterKind).toBe('sqlite');
    expect(Number(summaryA?.publishCount || 0)).toBe(2);
    expect(Number(summaryB?.publishCount || 0)).toBe(2);
    expect(summaryA?.latestEnvelope?.eventId).toBe(secondEnvelope?.eventId);
    expect(summaryB?.latestEnvelope?.eventId).toBe(secondEnvelope?.eventId);
    const subscriberA = (Array.isArray(summaryA?.subscribers) ? summaryA.subscribers : []).find((entry) => entry.subscriberId === 'instance-a');
    const subscriberB = (Array.isArray(summaryB?.subscribers) ? summaryB.subscribers : []).find((entry) => entry.subscriberId === 'instance-b');
    expect(Number(subscriberA?.deliveryCount || 0)).toBe(2);
    expect(Number(subscriberB?.deliveryCount || 0)).toBe(2);

    unsubscribeA();
    unsubscribeB();
  } finally {
    adapterA.close();
    adapterB.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
