function buildRecap(events = [], { afterSeq = 0, limit = 8 } = {}) {
  const rows = Array.isArray(events)
    ? events.filter((event) => event && typeof event === 'object' && event.seq > afterSeq)
    : [];
  const visible = rows.filter((event) => typeof event.recapLine === 'string' && event.recapLine.trim());
  const lines = visible.slice(-Math.max(1, limit)).map((event) => ({
    seq: event.seq,
    type: event.type,
    createdAt: event.createdAt,
    line: event.recapLine
  }));
  return {
    unseenCount: visible.length,
    lines
  };
}

module.exports = {
  buildRecap
};
