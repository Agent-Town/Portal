const { CIVIC_SCHEMA_VERSION } = require('../server/world_civilization/schemas');
const { createCivicAuditLedger } = require('../server/world_civilization/audit_ledger');
const { createCivicDelegationStore } = require('../server/world_civilization/delegations');
const {
  assertCivicReplayReconstructionSafe,
  reconstructCivicAuditReplayFromLedger
} = require('../server/world_civilization/replay_reconstruction');

const PRINCIPAL_ACCOUNT_ID = 'acct_v6_restart_delegate_principal_001';
const DELEGATE_AGENT_ID = 'agent_v6_restart_civic_clover_001';
const ADVICE_DELEGATION_ID = 'delegation_restart_vote_advice_001';
const EXECUTION_DELEGATION_ID = 'delegation_restart_civic_execution_001';
const EXECUTION_USAGE_ID = 'delegationuse_restart_execution_001';

function adviceDelegation(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    delegationId: ADVICE_DELEGATION_ID,
    principalAccountId: PRINCIPAL_ACCOUNT_ID,
    delegateAgentId: DELEGATE_AGENT_ID,
    scope: 'vote_advice',
    expiresAtMs: 4_102_444_800_000,
    maxActions: 3,
    approvalReceiptId: 'receipt_restart_delegate_vote_advice_001',
    revocable: true,
    canExecuteCivicEffects: false,
    ...overrides
  };
}

function executionDelegation(overrides = {}) {
  return adviceDelegation({
    delegationId: EXECUTION_DELEGATION_ID,
    scope: 'civic_execution',
    maxActions: 1,
    approvalReceiptId: 'receipt_restart_delegate_execution_001',
    canExecuteCivicEffects: true,
    ...overrides
  });
}

function executionUsage(overrides = {}) {
  return {
    usageId: EXECUTION_USAGE_ID,
    delegationId: EXECUTION_DELEGATION_ID,
    principalAccountId: PRINCIPAL_ACCOUNT_ID,
    delegateAgentId: DELEGATE_AGENT_ID,
    scope: 'civic_execution',
    actionRef: 'action_restart_delegate_execution_001',
    idempotencyKey: 'idem_restart_delegate_execution_001',
    ...overrides
  };
}

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function openStores({ auditPath, delegationPath }) {
  const auditLedger = createCivicAuditLedger({ sqlitePath: auditPath });
  const delegationStore = createCivicDelegationStore({ sqlitePath: delegationPath, auditLedger });
  return { auditLedger, delegationStore };
}

function closeStores({ auditLedger, delegationStore }) {
  delegationStore.close();
  auditLedger.close();
}

function snapshot({ auditLedger, delegationStore }) {
  const policy = delegationStore.getAgentParticipationPolicy({
    principalAccountId: PRINCIPAL_ACCOUNT_ID,
    delegateAgentId: DELEGATE_AGENT_ID,
    atMs: 1_779_787_500_000
  });
  const summary = delegationStore.summarizePrincipalDelegations(PRINCIPAL_ACCOUNT_ID, {
    atMs: 1_779_787_500_000
  });
  const replayReport = reconstructCivicAuditReplayFromLedger(auditLedger, { pageSize: 1 });
  const replaySafety = assertCivicReplayReconstructionSafe(replayReport);
  return {
    auditCount: auditLedger.count(),
    delegationCount: delegationStore.count(),
    usageCount: delegationStore.listDelegatedActionUses({ principalAccountId: PRINCIPAL_ACCOUNT_ID }).length,
    adviceStatus: delegationStore.getDelegation(ADVICE_DELEGATION_ID)?.status || '',
    executionStatus: delegationStore.getDelegation(EXECUTION_DELEGATION_ID)?.status || '',
    policy,
    summary,
    replayOk: replaySafety.ok,
    replayReport
  };
}

function main() {
  const mode = process.argv[2];
  const auditPath = process.argv[3];
  const delegationPath = process.argv[4];
  if (!mode || !auditPath || !delegationPath) {
    throw new Error('DELEGATION_RESTART_PROBE_ARGS_REQUIRED');
  }

  const stores = openStores({ auditPath, delegationPath });
  try {
    if (mode === 'seed-advice') {
      const row = stores.delegationStore.recordDelegation(adviceDelegation(), { nowMs: 1_779_787_000_000 });
      writeJson({
        ok: true,
        duplicate: row.duplicate === true,
        delegationId: row.delegationId,
        ...snapshot(stores)
      });
      return;
    }
    if (mode === 'consume-execution') {
      const row = stores.delegationStore.consumeDelegatedAction(executionUsage(), { nowMs: 1_779_787_150_000 });
      writeJson({
        ok: true,
        duplicate: row.duplicate === true,
        usageId: row.usageId,
        ...snapshot(stores)
      });
      return;
    }
    if (mode === 'seed-execution') {
      const row = stores.delegationStore.recordDelegation(executionDelegation(), { nowMs: 1_779_787_100_000 });
      writeJson({
        ok: true,
        duplicate: row.duplicate === true,
        delegationId: row.delegationId,
        ...snapshot(stores)
      });
      return;
    }
    if (mode === 'revoke-advice') {
      const row = stores.delegationStore.revokeDelegation(ADVICE_DELEGATION_ID, {
        principalAccountId: PRINCIPAL_ACCOUNT_ID,
        nowMs: 1_779_787_200_000
      });
      writeJson({
        ok: true,
        duplicate: row.duplicate === true,
        delegationId: row.delegationId,
        revokeAuditEntryId: row.revokeAuditEntryId || '',
        ...snapshot(stores)
      });
      return;
    }
    if (mode === 'snapshot') {
      writeJson({
        ok: true,
        ...snapshot(stores)
      });
      return;
    }
    throw new Error(`DELEGATION_RESTART_PROBE_UNKNOWN_MODE:${mode}`);
  } finally {
    closeStores(stores);
  }
}

try {
  main();
} catch (err) {
  writeJson({
    ok: false,
    error: err.message
  });
  process.exitCode = 1;
}
