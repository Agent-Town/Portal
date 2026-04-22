const SECTION_TITLES = [
  'What you did',
  'What the town produced',
  'Who asked for help',
  'What changed in town',
  'What Clover did',
  'What needs your decision now'
];

const HIDDEN_RECAP_EVENT_TYPES = new Set([
  'FOREMAN_CONTEXT_ASSEMBLED',
  'FOREMAN_LLM_REQUESTED',
  'FOREMAN_LLM_DECISION_SELECTED',
  'FOREMAN_TOOL_ALIAS_MAPPED',
  'FOREMAN_ACTION_REJECTED',
  'FOREMAN_WORKER_COMMAND_STARTED',
  'FOREMAN_WORKER_COMMAND_COMPLETED',
  'FOREMAN_WORKER_COMMAND_FAILED'
]);

function isHiddenRecapEvent(event) {
  return HIDDEN_RECAP_EVENT_TYPES.has(String(event?.type || '').toUpperCase());
}

function lineForEvent(event) {
  if (typeof event?.recapLine === 'string' && event.recapLine.trim()) {
    return event.recapLine.trim();
  }
  if (isHiddenRecapEvent(event)) {
    return '';
  }
  return typeof event?.explanation === 'string' ? event.explanation.trim() : '';
}

function classifySection(event) {
  const type = String(event?.type || '').toUpperCase();
  if (
    type === 'FOREMAN_RECEIPT_CREATED'
    || type === 'AGENT_ACTION_EXECUTED'
    || type.startsWith('FOREMAN_WORKER_COMMAND_')
    || type.startsWith('FOREMAN_LLM_')
    || type === 'FOREMAN_CONTEXT_ASSEMBLED'
    || type === 'FOREMAN_TOOL_ALIAS_MAPPED'
    || type === 'FOREMAN_ACTION_REJECTED'
  ) {
    return 'What Clover did';
  }
  if (type === 'APPROVAL_REQUESTED' || type === 'APPROVAL_RESOLVED') {
    return 'What needs your decision now';
  }
  if (type === 'CONTRACT_ACCEPTED' || type === 'CONTRACT_COMPLETED' || type === 'CONTRACT_MISSED') {
    return 'Who asked for help';
  }
  if (type === 'TOWN_SIGNAL_CHANGED' || type === 'LANDMARK_UPGRADED') {
    return 'What changed in town';
  }
  if (type === 'JOB_COMPLETED' || type === 'OUTPUT_COLLECTED') {
    return 'What the town produced';
  }
  return 'What you did';
}

function buildRecap(events = [], { afterSeq = 0, limit = 8 } = {}) {
  const rows = Array.isArray(events)
    ? events.filter((event) => event && typeof event === 'object' && event.seq > afterSeq)
    : [];
  const visible = rows.filter((event) => lineForEvent(event));
  const lines = visible.slice(-Math.max(1, limit)).map((event) => ({
    seq: event.seq,
    eventId: event.seq,
    type: event.type,
    createdAt: event.createdAt,
    line: lineForEvent(event)
  }));
  const sections = SECTION_TITLES.map((title) => ({
    title,
    lines: []
  }));
  const sectionMap = new Map(sections.map((section) => [section.title, section]));
  for (const event of visible.slice(-24)) {
    const title = classifySection(event);
    const section = sectionMap.get(title);
    if (!section) continue;
    section.lines.push({
      eventId: event.seq,
      type: event.type,
      createdAt: event.createdAt,
      line: lineForEvent(event)
    });
  }
  for (const section of sections) {
    section.lines = section.lines.slice(-4);
  }
  return {
    unseenCount: visible.length,
    lines,
    sections
  };
}

module.exports = {
  buildRecap
};
