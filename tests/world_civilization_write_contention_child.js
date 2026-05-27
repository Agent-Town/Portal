const { CIVIC_SCHEMA_VERSION } = require('../server/world_civilization/schemas');
const { createCivicAuditLedger, sha256 } = require('../server/world_civilization/audit_ledger');

const HASH_PREFIX = 'agent-town.v6.write-contention';

function padded(value) {
  return String(value).padStart(3, '0');
}

function auditEntry(writerIndex, writeIndex) {
  const writer = padded(writerIndex);
  const write = padded(writeIndex);
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    entryId: `audit_contention_writer${writer}_${write}`,
    actor: {
      kind: 'human',
      accountId: `acct_v6_contention_writer${writer}`
    },
    actionType: writeIndex % 2 === 0 ? 'proposal.created' : 'vote.recorded',
    objectRef: `proposal_contention_writer${writer}_${write}`,
    idempotencyKey: `idem_contention_writer${writer}_${write}`,
    beforeHash: sha256(`${HASH_PREFIX}.before:${writer}:${write}`),
    afterHash: sha256(`${HASH_PREFIX}.after:${writer}:${write}`),
    beforeSummary: `writer ${writer} contention before summary ${write}`,
    afterSummary: `writer ${writer} contention after summary ${write}`,
    createdAtMs: 1_779_800_000_000 + (writerIndex * 100) + writeIndex,
    migrationVersion: 'v1',
    replayable: true,
    rollbackId: '',
    privacy: {
      redacted: true,
      privateDataIncluded: false,
      dataClasses: ['public_audit_summary']
    }
  };
}

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function main() {
  const sqlitePath = process.argv[2];
  const writerIndex = Number(process.argv[3]);
  const writes = Number(process.argv[4] || 0);
  if (!sqlitePath || !Number.isInteger(writerIndex) || writerIndex < 0 || !Number.isInteger(writes) || writes < 1) {
    throw new Error('WRITE_CONTENTION_CHILD_ARGS_REQUIRED');
  }
  const ledger = createCivicAuditLedger({ sqlitePath });
  const entryIds = [];
  const seqs = [];
  let duplicateCount = 0;
  try {
    for (let index = 0; index < writes; index += 1) {
      const entry = auditEntry(writerIndex, index);
      const row = ledger.append(entry);
      entryIds.push(entry.entryId);
      seqs.push(row.seq);
    }
    const duplicate = ledger.append(auditEntry(writerIndex, 0));
    if (duplicate.duplicate === true) duplicateCount += 1;
    writeJson({
      ok: true,
      writerId: `writer_${padded(writerIndex)}`,
      writeCount: entryIds.length,
      duplicateCount,
      entryIds,
      seqs,
      errors: []
    });
  } finally {
    ledger.close();
  }
}

try {
  main();
} catch (err) {
  writeJson({
    ok: false,
    writerId: `writer_${padded(Number(process.argv[3]) || 0)}`,
    writeCount: 0,
    duplicateCount: 0,
    entryIds: [],
    seqs: [],
    errors: [err.message]
  });
  process.exitCode = 1;
}
