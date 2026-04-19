const {
  stateHash,
  stateHashPayload
} = require('./engine');

function normalizeReplayEvent(event) {
  return {
    seq: event?.seq,
    type: event?.type,
    actor: event?.actor,
    createdAt: event?.createdAt,
    explanation: event?.explanation || '',
    recapLine: event?.recapLine || '',
    data: event && typeof event.data === 'object' ? event.data : {}
  };
}

function initialStateFromEvents(events = []) {
  const created = (Array.isArray(events) ? events : []).find((event) => event?.type === 'PLOT_CREATED') || null;
  const data = created?.data && typeof created.data === 'object' ? created.data : {};
  return {
    plot: data.plot && typeof data.plot === 'object' ? data.plot : {},
    building: data.building && typeof data.building === 'object' ? data.building : null
  };
}

function actionLogFixtureFromEvents(events = [], currentState = null) {
  const normalizedEvents = Array.isArray(events) ? events.map((event) => normalizeReplayEvent(event)) : [];
  const originMs = normalizedEvents[0]?.createdAt || 0;
  let previousCreatedAt = originMs;
  return {
    fixtureId: currentState?.plot?.plotId ? `founders_plot_${currentState.plot.plotId}` : 'founders_plot_fixture',
    initialState: initialStateFromEvents(normalizedEvents),
    actions: normalizedEvents.map((event) => ({
      seq: event.seq,
      eventId: event.seq,
      atOffsetMs: Math.max(0, Number(event.createdAt || 0) - Number(originMs || 0)),
      type: event.type,
      actor: event.actor === 'AGENT' ? 'FOREMAN' : event.actor,
      createdAt: event.createdAt,
      elapsedMsSincePrevious: Math.max(0, Number(event.createdAt || 0) - Number(previousCreatedAt || 0)),
      explanation: event.explanation || '',
      recapLine: event.recapLine || '',
      toolName: typeof event?.data?.tool === 'string' ? event.data.tool : null,
      args: {
        buildingId: event?.data?.building?.buildingId || null,
        buildingType: event?.data?.building?.type || null,
        contractId: event?.data?.contract?.contractId || null
      },
      expectedOk: true,
      tool: typeof event?.data?.tool === 'string' ? event.data.tool : null,
      resourceDelta: event?.data?.resourceDelta || null
    })).map((action, index) => {
      previousCreatedAt = normalizedEvents[index]?.createdAt || previousCreatedAt;
      return action;
    }),
    timeAdvances: normalizedEvents.slice(1).map((event, index) => ({
      atOffsetMs: Math.max(0, Number(normalizedEvents[index]?.createdAt || originMs) - Number(originMs || 0)),
      advanceByMs: Math.max(0, Number(event.createdAt || 0) - Number(normalizedEvents[index]?.createdAt || originMs))
    })),
    finalHash: currentState ? stateHash(stateHashPayload(currentState)) : '',
    expectedFinalHash: currentState ? stateHash(stateHashPayload(currentState)) : ''
  };
}

function replayFromEvents(events = [], currentState = null) {
  const normalizedEvents = Array.isArray(events) ? events.map((event) => normalizeReplayEvent(event)) : [];
  const finalState = currentState || null;
  const finalHash = finalState ? stateHash(stateHashPayload(finalState)) : '';

  return {
    eventCount: normalizedEvents.length,
    events: normalizedEvents,
    finalState,
    finalHash,
    actionLogFixture: actionLogFixtureFromEvents(normalizedEvents, finalState)
  };
}

module.exports = {
  replayFromEvents
};
