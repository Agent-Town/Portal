'use strict';

const path = require('path');
const { fork } = require('child_process');

const {
  getHouseWorkerRuntimeInstanceById,
  updateHouseWorkerRuntimeInstance,
} = require('./unified_platform_store');

const HEARTBEAT_INTERVAL_MS = 2500;
const LEASE_TTL_MS = 15000;
const CHILD_PATH = path.join(__dirname, 'house_worker_backend_pool_child.js');

const poolState = {
  runtimes: new Map(),
};

function nowIso() {
  return new Date().toISOString();
}

function buildLeaseTimestamps() {
  const startedAt = Date.now();
  return {
    lastHeartbeatAt: new Date(startedAt).toISOString(),
    leaseExpiresAt: new Date(startedAt + LEASE_TTL_MS).toISOString(),
  };
}

function buildRuntimeSnapshot(entry = null) {
  const source = entry && typeof entry === 'object' ? entry : {};
  return {
    runtimeInstanceId: String(source.runtimeInstanceId || '').trim() || null,
    houseWorkerSessionId: String(source.houseWorkerSessionId || '').trim() || null,
    pid: Number(source.child?.pid || 0) || null,
    status: String(source.status || '').trim() || 'unknown',
    startedAt: String(source.startedAt || '').trim() || null,
    workspaceSnapshotRef: String(source.workspaceSnapshotRef || '').trim() || null,
    executorKind: 'backend_pool',
    executorProvider: 'portal_backend_pool',
  };
}

function applyBackendLease(runtimeInstanceId, {
  pid = 0,
  workspaceSnapshotRef = '',
  stopped = false,
} = {}) {
  const existing = getHouseWorkerRuntimeInstanceById(runtimeInstanceId);
  if (!existing) return null;
  const lease = buildLeaseTimestamps();
  return updateHouseWorkerRuntimeInstance({
    runtimeInstanceId,
    executorKind: 'backend_pool',
    executorProvider: 'portal_backend_pool',
    executorRef: pid ? `pid:${pid}` : existing.executorRef,
    leaseStatus: stopped ? 'stopped' : 'active',
    leaseOwnerKind: stopped ? 'backend_process_stopped' : 'backend_process',
    leaseOwnerLabel: stopped ? 'Stopped backend pool runtime' : 'Portal backend pool',
    leaseOwnerId: pid ? `backend:${pid}` : (stopped ? null : existing.leaseOwnerId),
    lastHeartbeatAt: stopped ? existing.lastHeartbeatAt : lease.lastHeartbeatAt,
    leaseExpiresAt: stopped ? nowIso() : lease.leaseExpiresAt,
    workspaceSnapshotRef: String(workspaceSnapshotRef || '').trim() || existing.workspaceSnapshotRef || null,
    startedAt: existing.startedAt || nowIso(),
    stoppedAt: stopped ? nowIso() : null,
    updatedAt: nowIso(),
  });
}

function bindRuntimeChild(entry) {
  const child = entry.child;
  child.on('message', (message) => {
    const msg = message && typeof message === 'object' ? message : {};
    const runtimeInstanceId = String(msg.runtimeInstanceId || '').trim();
    if (!runtimeInstanceId || runtimeInstanceId !== entry.runtimeInstanceId) return;
    if (msg.type === 'ready' || msg.type === 'heartbeat') {
      entry.status = 'active';
      applyBackendLease(runtimeInstanceId, {
        pid: Number(child.pid || 0) || 0,
        workspaceSnapshotRef: entry.workspaceSnapshotRef,
        stopped: false,
      });
      return;
    }
    if (msg.type === 'stopped') {
      entry.status = 'stopped';
      applyBackendLease(runtimeInstanceId, {
        pid: Number(child.pid || 0) || 0,
        workspaceSnapshotRef: entry.workspaceSnapshotRef,
        stopped: true,
      });
    }
  });
  child.once('exit', () => {
    const current = poolState.runtimes.get(entry.runtimeInstanceId);
    if (current && current.child === child) {
      current.status = current.status === 'stopped' ? 'stopped' : 'stale';
      if (current.status === 'stale') {
        updateHouseWorkerRuntimeInstance({
          runtimeInstanceId: current.runtimeInstanceId,
          leaseStatus: 'stale',
          leaseOwnerKind: 'backend_process',
          leaseOwnerLabel: 'Portal backend pool',
          leaseOwnerId: `backend:${Number(child.pid || 0) || 0}`,
          leaseExpiresAt: nowIso(),
          updatedAt: nowIso(),
        });
      }
      poolState.runtimes.delete(entry.runtimeInstanceId);
    }
  });
}

function startHouseWorkerBackendRuntime({
  runtimeInstanceId = '',
  houseWorkerSessionId = '',
  workspaceSnapshotRef = '',
} = {}) {
  const normalizedRuntimeInstanceId = String(runtimeInstanceId || '').trim();
  const normalizedSessionId = String(houseWorkerSessionId || '').trim();
  if (!normalizedRuntimeInstanceId || !normalizedSessionId) {
    throw new Error('HOUSE_WORKER_BACKEND_RUNTIME_INVALID');
  }
  stopHouseWorkerBackendRuntime(normalizedRuntimeInstanceId, { reason: 'replace' });
  const child = fork(CHILD_PATH, [], {
    stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
  });
  const entry = {
    runtimeInstanceId: normalizedRuntimeInstanceId,
    houseWorkerSessionId: normalizedSessionId,
    workspaceSnapshotRef: String(workspaceSnapshotRef || '').trim() || null,
    startedAt: nowIso(),
    status: 'starting',
    child,
  };
  poolState.runtimes.set(normalizedRuntimeInstanceId, entry);
  bindRuntimeChild(entry);
  child.send({
    type: 'start',
    runtimeInstanceId: normalizedRuntimeInstanceId,
    houseWorkerSessionId: normalizedSessionId,
    workspaceSnapshotRef: entry.workspaceSnapshotRef,
    heartbeatIntervalMs: HEARTBEAT_INTERVAL_MS,
  });
  applyBackendLease(normalizedRuntimeInstanceId, {
    pid: Number(child.pid || 0) || 0,
    workspaceSnapshotRef: entry.workspaceSnapshotRef,
    stopped: false,
  });
  return buildRuntimeSnapshot(entry);
}

function stopHouseWorkerBackendRuntime(runtimeInstanceId = '', { reason = 'stopped' } = {}) {
  const normalizedRuntimeInstanceId = String(runtimeInstanceId || '').trim();
  if (!normalizedRuntimeInstanceId) return false;
  const entry = poolState.runtimes.get(normalizedRuntimeInstanceId);
  if (!entry) return false;
  entry.status = 'stopping';
  try {
    if (entry.child.connected) {
      entry.child.send({
        type: 'stop',
        reason,
      });
    } else {
      entry.child.kill();
    }
  } catch {
    try {
      entry.child.kill();
    } catch {
      // ignore kill failures
    }
  }
  return true;
}

function crashHouseWorkerBackendRuntime(runtimeInstanceId = '') {
  const normalizedRuntimeInstanceId = String(runtimeInstanceId || '').trim();
  if (!normalizedRuntimeInstanceId) return false;
  const entry = poolState.runtimes.get(normalizedRuntimeInstanceId);
  if (!entry) return false;
  entry.status = 'crashing';
  try {
    entry.child.kill('SIGKILL');
  } catch {
    return false;
  }
  return true;
}

function stopAllHouseWorkerBackendRuntimes(reason = 'reset') {
  for (const runtimeInstanceId of Array.from(poolState.runtimes.keys())) {
    stopHouseWorkerBackendRuntime(runtimeInstanceId, { reason });
  }
}

function getHouseWorkerBackendRuntimeSnapshot(runtimeInstanceId = '') {
  const normalizedRuntimeInstanceId = String(runtimeInstanceId || '').trim();
  if (!normalizedRuntimeInstanceId) return null;
  return buildRuntimeSnapshot(poolState.runtimes.get(normalizedRuntimeInstanceId) || null);
}

process.on('exit', () => {
  stopAllHouseWorkerBackendRuntimes('process_exit');
});

module.exports = {
  crashHouseWorkerBackendRuntime,
  startHouseWorkerBackendRuntime,
  stopHouseWorkerBackendRuntime,
  stopAllHouseWorkerBackendRuntimes,
  getHouseWorkerBackendRuntimeSnapshot,
};
