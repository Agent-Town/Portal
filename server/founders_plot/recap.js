function buildRecapFromEvents(events, {
  fromMs = null,
  toMs = null,
  maxItems = 8,
  hqLevel = 1
} = {}) {
  const filtered = (Array.isArray(events) ? events : [])
    .filter((event) => !fromMs || Number(event?.createdAt || 0) >= Number(fromMs))
    .filter((event) => !toMs || Number(event?.createdAt || 0) <= Number(toMs))
    .sort((a, b) => Number(a?.eventSeq || 0) - Number(b?.eventSeq || 0));

  if (!filtered.length) {
    return {
      fromMs,
      toMs,
      count: 0,
      items: [],
      title: hqLevel >= 5 ? 'Overnight planner' : 'While you were away',
      summary: 'No meaningful world changes happened while you were away.'
    };
  }

  const items = filtered.slice(-Math.max(1, Number(maxItems) || 8)).map((event) => ({
    eventSeq: Number(event.eventSeq),
    eventType: String(event.eventType || ''),
    createdAt: Number(event.createdAt || 0),
    summary: String(event.summary || ''),
    explanation: typeof event.explanation === 'string' && event.explanation.trim()
      ? event.explanation.trim()
      : null
  }));

  const completedJobs = filtered.filter((event) => event.eventType === 'JOB_COMPLETED').length;
  const collectedOutputs = filtered.filter((event) => event.eventType === 'OUTPUT_COLLECTED').length;
  const hqUpgrades = filtered.filter((event) => event.eventType === 'HQ_UPGRADED').length;
  const agentActions = filtered.filter((event) => event.eventType === 'AGENT_ACTION_EXECUTED').length;

  const summaryBits = [];
  if (completedJobs) summaryBits.push(`${completedJobs} jobs finished`);
  if (collectedOutputs) summaryBits.push(`${collectedOutputs} collections were ready`);
  if (hqUpgrades) summaryBits.push(`${hqUpgrades} HQ upgrades landed`);
  if (agentActions) summaryBits.push(`${agentActions} foreman actions were logged`);
  if (!summaryBits.length) summaryBits.push(`${filtered.length} logged changes`);

  return {
    fromMs,
    toMs,
    count: filtered.length,
    items,
    title: hqLevel >= 5 ? 'Overnight planner' : 'While you were away',
    summary: summaryBits.join(' · ')
  };
}

module.exports = {
  buildRecapFromEvents
};
