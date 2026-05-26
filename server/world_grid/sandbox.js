const crypto = require('crypto');

const ALLOWED_PROPS = new Map([
  ['lantern', { propId: 'lantern', label: 'Lantern', footprint: 1 }],
  ['bench', { propId: 'bench', label: 'Bench', footprint: 1 }],
  ['garden-bed', { propId: 'garden-bed', label: 'Garden Bed', footprint: 1 }],
  ['notice-board', { propId: 'notice-board', label: 'Notice Board', footprint: 1 }]
]);

const ALLOWED_AGENT_DEMOS = new Map([
  ['route-signpost', { propId: 'notice-board', label: 'Route Signpost Demo' }]
]);

const district = {
  districtId: 'sandbox_public_commons',
  title: 'Public Commons Sandbox',
  status: 'open',
  cells: [
    { cellId: 'sandbox_cell_0', q: 0, r: 0, props: [] },
    { cellId: 'sandbox_cell_1', q: 1, r: 0, props: [] },
    { cellId: 'sandbox_cell_2', q: 0, r: 1, props: [] },
    { cellId: 'sandbox_cell_3', q: -1, r: 1, props: [] }
  ],
  rules: {
    allowedActions: ['place_prop', 'remove_prop', 'agent_demo'],
    allowedProps: Array.from(ALLOWED_PROPS.keys()),
    forbidden: ['uploads', 'chat', 'code', 'private-town-mutation', 'economy-bridge'],
    moderation: 'typed-policy-only'
  }
};

const participantsByOwner = new Map();
const actions = [];
const snapshots = new Map();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sha256(value = '') {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function publicIdFor(owner) {
  return `sandbox_${sha256(owner.ownerAccountId).slice(0, 12)}`;
}

function normalizeText(value = '', fallback = '') {
  return String(value || fallback).trim().replace(/\s+/g, ' ').slice(0, 80);
}

function redactedParticipant(owner) {
  return {
    publicId: publicIdFor(owner),
    displayName: `Visitor ${publicIdFor(owner).slice(-4)}`,
    status: 'present'
  };
}

function participants() {
  return Array.from(participantsByOwner.values()).map((participant) => clone(participant));
}

function snapshotCells() {
  return clone(district.cells);
}

function saveSnapshot(actionId) {
  const rollbackId = `rollback_${actionId}`;
  snapshots.set(rollbackId, snapshotCells());
  return rollbackId;
}

function stateFor(owner) {
  const participant = participantsByOwner.get(owner.ownerAccountId) || null;
  return {
    district: {
      ...clone(district),
      participants: participants(),
      snapshots: Array.from(snapshots.keys()).map((rollbackId) => ({ rollbackId })),
      recentActions: actions.slice(-8).map((action) => clone(action))
    },
    participant: participant ? clone(participant) : null
  };
}

function enterSandbox(owner) {
  const participant = redactedParticipant(owner);
  participantsByOwner.set(owner.ownerAccountId, participant);
  return participant;
}

function leaveSandbox(owner) {
  const publicId = publicIdFor(owner);
  const removed = participantsByOwner.delete(owner.ownerAccountId);
  return { publicId, removed };
}

function findCell(cellId = '') {
  return district.cells.find((cell) => cell.cellId === String(cellId || '').trim()) || null;
}

function recordAction(owner, kind, payload, moderationStatus, rollbackId = '') {
  const action = {
    actionId: `sandbox_action_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    actorPublicId: publicIdFor(owner),
    kind,
    payload: clone(payload),
    moderationStatus,
    rollbackId,
    createdAtMs: Date.now(),
    rolledBackAtMs: null
  };
  actions.push(action);
  return clone(action);
}

function rejectAction(owner, kind, payload, reason) {
  return recordAction(owner, kind, {
    reason,
    requested: payload && typeof payload === 'object' ? clone(payload) : {}
  }, 'rejected');
}

function placeProp(owner, payload = {}) {
  enterSandbox(owner);
  const propId = String(payload.propId || '').trim();
  const cell = findCell(payload.cellId || 'sandbox_cell_0');
  if (!cell) return rejectAction(owner, 'place_prop', payload, 'UNKNOWN_CELL');
  const prop = ALLOWED_PROPS.get(propId);
  if (!prop) return rejectAction(owner, 'place_prop', payload, 'PROP_NOT_ALLOWED');
  const actionId = `sandbox_action_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const rollbackId = saveSnapshot(actionId);
  cell.props.push({
    propInstanceId: `${actionId}_${prop.propId}`,
    propId: prop.propId,
    label: prop.label,
    actorPublicId: publicIdFor(owner)
  });
  const action = {
    actionId,
    actorPublicId: publicIdFor(owner),
    kind: 'place_prop',
    payload: { cellId: cell.cellId, propId: prop.propId, label: prop.label },
    moderationStatus: 'auto-approved',
    rollbackId,
    createdAtMs: Date.now(),
    rolledBackAtMs: null
  };
  actions.push(action);
  return clone(action);
}

function agentDemo(owner, payload = {}) {
  enterSandbox(owner);
  const demo = ALLOWED_AGENT_DEMOS.get(String(payload.demoKind || '').trim());
  if (!demo) return rejectAction(owner, 'agent_demo', payload, 'DEMO_NOT_ALLOWED');
  const cell = findCell(payload.cellId || 'sandbox_cell_0') || district.cells[0];
  const actionId = `sandbox_action_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const rollbackId = saveSnapshot(actionId);
  cell.props.push({
    propInstanceId: `${actionId}_${demo.propId}`,
    propId: demo.propId,
    label: demo.label,
    actorPublicId: publicIdFor(owner),
    agentDemo: true
  });
  const action = {
    actionId,
    actorPublicId: publicIdFor(owner),
    kind: 'agent_demo',
    payload: { cellId: cell.cellId, demoKind: normalizeText(payload.demoKind), propId: demo.propId },
    moderationStatus: 'auto-approved',
    rollbackId,
    createdAtMs: Date.now(),
    rolledBackAtMs: null
  };
  actions.push(action);
  return clone(action);
}

function rollbackLastAction(owner) {
  const actorPublicId = publicIdFor(owner);
  const action = [...actions].reverse().find((candidate) => (
    candidate.actorPublicId === actorPublicId
    && candidate.moderationStatus === 'auto-approved'
    && candidate.rollbackId
    && !candidate.rolledBackAtMs
  ));
  if (!action) {
    const error = new Error('NOT_FOUND');
    error.details = { reason: 'NO_ROLLBACK_ACTION' };
    throw error;
  }
  const snapshot = snapshots.get(action.rollbackId);
  if (!snapshot) {
    const error = new Error('NOT_FOUND');
    error.details = { rollbackId: action.rollbackId };
    throw error;
  }
  district.cells = clone(snapshot);
  const stored = actions.find((candidate) => candidate.actionId === action.actionId);
  if (stored) stored.rolledBackAtMs = Date.now();
  return {
    rollbackId: action.rollbackId,
    restored: true,
    actionId: action.actionId,
    district: stateFor(owner).district
  };
}

module.exports = {
  agentDemo,
  enterSandbox,
  leaveSandbox,
  placeProp,
  rollbackLastAction,
  stateFor
};
