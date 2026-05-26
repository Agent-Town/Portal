const V6_ROLLBACK_RECOVERY_VERSION = 'agent-town.v6.rollback_recovery.v1';

function safeLimit(value) {
  return Number.isInteger(Number(value)) ? Math.max(1, Math.min(500, Number(value))) : 100;
}

function buildMissingReport(errors = []) {
  return {
    version: V6_ROLLBACK_RECOVERY_VERSION,
    status: 'research_only',
    ok: false,
    errors,
    actionCount: 0,
    recoverableHandleCount: 0,
    missingRollbackCount: 0,
    missingAuditCount: 0,
    expiredWindowCount: 0,
    handles: [],
    appliesWorldState: false,
    executionStatus: 'not_executable',
    releaseReady: false
  };
}

function auditRowsForAction(auditLedger, actionId) {
  if (!auditLedger || typeof auditLedger.replay !== 'function') return [];
  return auditLedger.replay({ objectRef: actionId, limit: 25 });
}

function buildV6RollbackRecoveryReport({
  effectStore,
  auditLedger,
  proposalId = '',
  nowMs = Date.now(),
  limit = 100
} = {}) {
  if (!effectStore || typeof effectStore.listActions !== 'function' || typeof effectStore.getRollback !== 'function') {
    return buildMissingReport(['V6_ROLLBACK_RECOVERY_EFFECT_STORE_REQUIRED']);
  }
  if (!auditLedger || typeof auditLedger.replay !== 'function') {
    return buildMissingReport(['V6_ROLLBACK_RECOVERY_AUDIT_LEDGER_REQUIRED']);
  }

  const errors = [];
  const actions = effectStore.listActions({
    proposalId,
    status: 'prepared',
    limit: safeLimit(limit)
  });
  const handles = actions.map((action) => {
    const rollback = effectStore.getRollback(action.rollbackId);
    const auditRows = auditRowsForAction(auditLedger, action.actionId);
    const preparedAudit = auditRows.find((row) => (
      row.entry?.actionType === 'civic_action.prepared'
      && row.entry?.rollbackId === action.rollbackId
      && row.entry?.privacy?.redacted === true
      && row.entry?.privacy?.privateDataIncluded === false
    ));
    const windowExpiresAtMs = rollback ? rollback.createdAtMs + rollback.maxRollbackMs : 0;
    const windowOpen = rollback ? windowExpiresAtMs >= Number(nowMs || 0) : false;
    const rollbackAvailable = rollback?.status === 'available';
    const canRecoverFutureEffect = Boolean(rollback && rollbackAvailable && preparedAudit && windowOpen);

    if (!rollback) errors.push(`V6_ROLLBACK_RECOVERY_HANDLE_MISSING:${action.actionId}`);
    if (rollback && !rollbackAvailable) errors.push(`V6_ROLLBACK_RECOVERY_HANDLE_UNAVAILABLE:${action.rollbackId}`);
    if (!preparedAudit) errors.push(`V6_ROLLBACK_RECOVERY_AUDIT_MISSING:${action.actionId}`);
    if (rollback && !windowOpen) errors.push(`V6_ROLLBACK_RECOVERY_WINDOW_EXPIRED:${action.rollbackId}`);

    return {
      actionId: action.actionId,
      proposalId: action.proposalId,
      effectType: action.effectType,
      handlerName: action.handlerName,
      actionStatus: action.status,
      rollbackId: action.rollbackId,
      rollbackStatus: rollback?.status || 'missing',
      planId: rollback?.planId || '',
      auditEntryId: action.auditEntryId,
      auditEntryFound: Boolean(preparedAudit),
      windowOpen,
      canRecoverFutureEffect,
      appliesWorldState: false,
      executionStatus: 'not_executable'
    };
  });

  return {
    version: V6_ROLLBACK_RECOVERY_VERSION,
    status: 'research_only',
    ok: errors.length === 0,
    errors,
    actionCount: actions.length,
    recoverableHandleCount: handles.filter((handle) => handle.canRecoverFutureEffect).length,
    missingRollbackCount: handles.filter((handle) => handle.rollbackStatus === 'missing').length,
    missingAuditCount: handles.filter((handle) => handle.auditEntryFound !== true).length,
    expiredWindowCount: handles.filter((handle) => handle.windowOpen !== true).length,
    handles,
    appliesWorldState: false,
    executionStatus: 'not_executable',
    releaseReady: false
  };
}

function assertV6RollbackRecoverySafe(report = {}) {
  const errors = [];
  if (report.version !== V6_ROLLBACK_RECOVERY_VERSION) {
    errors.push('V6_ROLLBACK_RECOVERY_VERSION_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_ROLLBACK_RECOVERY_RESEARCH_ONLY_REQUIRED');
  }
  if (report.appliesWorldState !== false) {
    errors.push('V6_ROLLBACK_RECOVERY_APPLIES_STATE_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_ROLLBACK_RECOVERY_NON_EXECUTING_REQUIRED');
  }
  if (report.releaseReady !== false) {
    errors.push('V6_ROLLBACK_RECOVERY_RELEASE_READY_FORBIDDEN');
  }
  if (report.ok !== true || (Array.isArray(report.errors) && report.errors.length > 0)) {
    errors.push('V6_ROLLBACK_RECOVERY_ERRORS_PRESENT');
  }
  for (const handle of Array.isArray(report.handles) ? report.handles : []) {
    if (handle.appliesWorldState !== false) errors.push(`V6_ROLLBACK_RECOVERY_HANDLE_APPLIES_STATE_FORBIDDEN:${handle.actionId}`);
    if (handle.executionStatus !== 'not_executable') errors.push(`V6_ROLLBACK_RECOVERY_HANDLE_NON_EXECUTING_REQUIRED:${handle.actionId}`);
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  V6_ROLLBACK_RECOVERY_VERSION,
  assertV6RollbackRecoverySafe,
  buildV6RollbackRecoveryReport
};
