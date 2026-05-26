const { CIVIC_SCHEMA_VERSION } = require('../server/world_civilization/schemas');
const { createCivicAuditLedger } = require('../server/world_civilization/audit_ledger');
const {
  assertCivicReplayReconstructionSafe,
  reconstructCivicAuditReplayFromLedger
} = require('../server/world_civilization/replay_reconstruction');

const HASH_A = `sha256:${'a'.repeat(64)}`;
const HASH_B = `sha256:${'b'.repeat(64)}`;
const HASH_C = `sha256:${'c'.repeat(64)}`;

function auditEntry(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    entryId: 'audit_process_restart_proposal_001',
    actor: {
      kind: 'human',
      accountId: 'acct_v6_restart_001'
    },
    actionType: 'proposal.created',
    objectRef: 'proposal_process_restart_001',
    idempotencyKey: 'idem_process_restart_proposal_001',
    beforeHash: HASH_A,
    afterHash: HASH_B,
    createdAtMs: 1_779_784_000_000,
    migrationVersion: 'v1',
    replayable: true,
    rollbackId: '',
    privacy: {
      redacted: true,
      privateDataIncluded: false,
      dataClasses: ['public_audit_summary']
    },
    ...overrides
  };
}

function seed(ledger) {
  const first = ledger.append(auditEntry());
  const second = ledger.append(auditEntry({
    entryId: 'audit_process_restart_vote_001',
    actionType: 'vote.recorded',
    objectRef: 'vote_process_restart_001',
    idempotencyKey: 'idem_process_restart_vote_001',
    beforeHash: HASH_B,
    afterHash: HASH_C
  }));
  return { first, second };
}

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function main() {
  const mode = process.argv[2];
  const sqlitePath = process.argv[3];
  if (!mode || !sqlitePath) throw new Error('RESTART_PROBE_ARGS_REQUIRED');
  const ledger = createCivicAuditLedger({ sqlitePath });
  try {
    if (mode === 'seed') {
      const { first, second } = seed(ledger);
      writeJson({
        ok: true,
        count: ledger.count(),
        seqs: [first.seq, second.seq],
        duplicates: [first.duplicate === true, second.duplicate === true]
      });
      return;
    }
    if (mode === 'reconstruct') {
      const report = reconstructCivicAuditReplayFromLedger(ledger, { pageSize: 1 });
      const safety = assertCivicReplayReconstructionSafe(report);
      writeJson({ ok: safety.ok, report, safety });
      return;
    }
    throw new Error(`RESTART_PROBE_UNKNOWN_MODE:${mode}`);
  } finally {
    ledger.close();
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
