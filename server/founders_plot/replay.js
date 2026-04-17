const crypto = require('crypto');

function stableJsonStringify(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableJsonStringify(entry)).join(',')}]`;
  }
  const keys = Object.keys(value).sort();
  const body = keys
    .map((key) => `${JSON.stringify(key)}:${stableJsonStringify(value[key])}`)
    .join(',');
  return `{${body}}`;
}

function sortBundleForHash(bundle) {
  const input = bundle && typeof bundle === 'object' ? bundle : {};
  const buildings = Array.isArray(input.buildings)
    ? [...input.buildings].sort((a, b) => String(a?.buildingId || '').localeCompare(String(b?.buildingId || '')))
    : [];
  const jobs = Array.isArray(input.jobs)
    ? [...input.jobs].sort((a, b) => String(a?.jobId || '').localeCompare(String(b?.jobId || '')))
    : [];
  const approvals = Array.isArray(input.approvals)
    ? [...input.approvals].sort((a, b) => String(a?.approvalId || '').localeCompare(String(b?.approvalId || '')))
    : [];

  return {
    plot: input.plot || null,
    policy: input.policy || null,
    buildings,
    jobs,
    approvals
  };
}

function computeStateHash(bundle) {
  const canonical = stableJsonStringify(sortBundleForHash(bundle));
  return crypto.createHash("sha256").update(canonical).digest("hex");
}

function replayEventLog({ initialSnapshot, events, applyEvent }) {
  const base = initialSnapshot == null
    ? null
    : JSON.parse(JSON.stringify(initialSnapshot));
  const rows = Array.isArray(events) ? events : [];
  const nextState = rows.reduce((state, event) => applyEvent(state, event), base);
  return {
    finalState: nextState,
    stateHash: computeStateHash(nextState)
  };
}

function buildReplayAudit(events) {
  return (Array.isArray(events) ? events : []).map((event) => ({
    eventSeq: Number(event?.eventSeq || 0),
    eventType: String(event?.eventType || ''),
    actor: String(event?.actor || 'SYSTEM'),
    summary: String(event?.summary || ''),
    explanation: typeof event?.explanation === 'string' ? event.explanation : null,
    createdAt: Number(event?.createdAt || 0)
  }));
}

module.exports = {
  stableJsonStringify,
  computeStateHash,
  replayEventLog,
  buildReplayAudit
};
