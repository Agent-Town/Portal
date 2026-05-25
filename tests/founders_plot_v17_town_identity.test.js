const test = require('node:test');
const assert = require('node:assert/strict');

const {
  applySetTownIdentity,
  applyUpgradeLandmark,
  applyCaptureTownPostcard,
  buildPlotCard,
  buildTownPostcard,
  createInitialPlot,
  prepareLoadedState,
  stateView
} = require('../server/founders_plot/engine');

function makeEventSink() {
  const events = [];
  return {
    events,
    appendEvent(event) {
      events.push({
        ...event,
        seq: events.length + 1,
        eventId: events.length + 1,
        createdAt: event.createdAt || 50_000 + events.length
      });
    }
  };
}

function makeIdentityReadyState() {
  const state = createInitialPlot({ pairId: 'pair_v17_identity', nowMs: 1_000 });
  state.plot.inventory.wood = 12;
  state.plot.inventory.coin = 20;
  state.plot.townXp = 30;
  return state;
}

test('V1.7 Public Square style persists and does not mutate economy fields', () => {
  const state = makeIdentityReadyState();
  const sink = makeEventSink();

  applyUpgradeLandmark(state, { landmarkId: 'public_square_welcome_sign' }, {
    nowMs: 10_000,
    appendEvent: sink.appendEvent
  });
  const before = {
    inventory: { ...state.plot.inventory },
    townXp: state.plot.townXp,
    signals: { ...state.meta.townSignals }
  };

  const result = applySetTownIdentity(state, {
    landmarkId: 'public_square_welcome_sign',
    styleId: 'garden'
  }, {
    nowMs: 11_000,
    appendEvent: sink.appendEvent
  });

  assert.equal(result.style.styleId, 'garden');
  assert.equal(state.meta.landmarks.publicSquare.styleId, 'garden');
  assert.deepEqual(state.plot.inventory, before.inventory);
  assert.equal(state.plot.townXp, before.townXp);
  assert.deepEqual(state.meta.townSignals, before.signals);
  assert.ok(sink.events.some((event) => event.type === 'TOWN_IDENTITY_SET'));

  const reloaded = prepareLoadedState({
    ...state,
    meta: {
      ...state.meta,
      schemaVersion: 4
    }
  }).state;
  assert.equal(reloaded.meta.landmarks.publicSquare.styleId, 'garden');

  const view = stateView(reloaded, sink.events);
  assert.equal(view.landmarks.publicSquare.style.styleId, 'garden');
  assert.equal(view.landmarks.publicSquare.plotCardAvailable, true);
});

test('V1.7 plot card is public-safe and excludes private runtime language', () => {
  const state = makeIdentityReadyState();
  const sink = makeEventSink();
  applyUpgradeLandmark(state, { landmarkId: 'public_square_welcome_sign' }, {
    nowMs: 20_000,
    appendEvent: sink.appendEvent
  });
  applySetTownIdentity(state, {
    landmarkId: 'public_square_welcome_sign',
    styleId: 'market'
  }, {
    nowMs: 21_000,
    appendEvent: sink.appendEvent
  });

  const card = buildPlotCard(state, { nowMs: 22_000 });
  assert.equal(card.schemaVersion, 'founders-plot.plot-card.v1');
  assert.equal(card.publicSquare.styleId, 'market');
  assert.equal(card.subtitle, 'Market Corner');

  const serialized = JSON.stringify(card).toLowerCase();
  for (const forbidden of ['provider', 'runtime', 'wallet', 'brain', 'debug', 'token', 'secret', 'openclaw']) {
    assert.equal(serialized.includes(forbidden), false, `plot card leaked ${forbidden}`);
  }
});

test('V1.7 postcard capture persists public-safe camera flyover state', () => {
  const state = makeIdentityReadyState();
  const sink = makeEventSink();
  applyUpgradeLandmark(state, { landmarkId: 'public_square_welcome_sign' }, {
    nowMs: 30_000,
    appendEvent: sink.appendEvent
  });
  applySetTownIdentity(state, {
    landmarkId: 'public_square_welcome_sign',
    styleId: 'garden'
  }, {
    nowMs: 31_000,
    appendEvent: sink.appendEvent
  });

  const preview = buildTownPostcard(state, { nowMs: 32_000, captureId: 'pcap_preview' });
  assert.equal(preview.schemaVersion, 'founders-plot.postcard.v1');
  assert.equal(preview.publicSquareStyleId, 'garden');
  assert.equal(preview.cameraMode, 'postcard_flyover');
  assert.ok(preview.flyoverStops.some((stop) => stop.objectId === 'PUBLIC_SQUARE'));

  const captured = applyCaptureTownPostcard(state, { focusObjectId: 'PUBLIC_SQUARE' }, {
    nowMs: 33_000,
    appendEvent: sink.appendEvent
  });
  assert.equal(captured.postcard.publicSquareStyleLabel, 'Garden Square');
  assert.equal(state.meta.townPostcards.captures.length, 1);
  assert.equal(state.meta.townPostcards.latestCaptureId, captured.postcard.captureId);
  assert.ok(sink.events.some((event) => event.type === 'TOWN_POSTCARD_CAPTURED'));

  const view = stateView(state, sink.events);
  assert.equal(view.townPostcards.latest.captureId, captured.postcard.captureId);
  assert.match(view.townPostcards.summary, /postcard/i);

  const serialized = JSON.stringify(captured.postcard).toLowerCase();
  for (const forbidden of ['provider', 'runtime', 'wallet', 'brain', 'debug', 'token', 'secret', 'openclaw']) {
    assert.equal(serialized.includes(forbidden), false, `postcard leaked ${forbidden}`);
  }
});
