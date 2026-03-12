'use strict';

let heartbeatTimer = null;
let runtime = null;

function nowIso() {
  return new Date().toISOString();
}

function sendMessage(payload) {
  if (typeof process.send === 'function') {
    process.send(payload);
  }
}

function stopHeartbeat() {
  if (!heartbeatTimer) return;
  clearInterval(heartbeatTimer);
  heartbeatTimer = null;
}

function startHeartbeat(intervalMs = 2500) {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    if (!runtime) return;
    sendMessage({
      type: 'heartbeat',
      runtimeInstanceId: runtime.runtimeInstanceId,
      houseWorkerSessionId: runtime.houseWorkerSessionId,
      timestamp: nowIso(),
    });
  }, Math.max(1000, Number(intervalMs || 2500) || 2500));
}

process.on('message', (message) => {
  const msg = message && typeof message === 'object' ? message : {};
  if (msg.type === 'start') {
    runtime = {
      runtimeInstanceId: String(msg.runtimeInstanceId || '').trim(),
      houseWorkerSessionId: String(msg.houseWorkerSessionId || '').trim(),
      workspaceSnapshotRef: String(msg.workspaceSnapshotRef || '').trim() || null,
    };
    sendMessage({
      type: 'ready',
      runtimeInstanceId: runtime.runtimeInstanceId,
      houseWorkerSessionId: runtime.houseWorkerSessionId,
      pid: process.pid,
      timestamp: nowIso(),
    });
    startHeartbeat(Number(msg.heartbeatIntervalMs || 2500) || 2500);
    return;
  }
  if (msg.type === 'stop') {
    const reason = String(msg.reason || 'stopped').trim() || 'stopped';
    stopHeartbeat();
    sendMessage({
      type: 'stopped',
      runtimeInstanceId: runtime?.runtimeInstanceId || null,
      houseWorkerSessionId: runtime?.houseWorkerSessionId || null,
      reason,
      timestamp: nowIso(),
    });
    process.exit(0);
  }
});

process.on('disconnect', () => {
  stopHeartbeat();
  process.exit(0);
});
