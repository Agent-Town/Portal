const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { CIVIC_SCHEMA_VERSION } = require('../server/world_civilization/schemas');
const { createCivicAuditLedger } = require('../server/world_civilization/audit_ledger');
const {
  CIVIC_AUDIT_GENESIS_HASH,
  assertCivicReplayReconstructionSafe,
  reconstructCivicAuditReplay,
  reconstructCivicAuditReplayFromLedger
} = require('../server/world_civilization/replay_reconstruction');

const HASH_A = `sha256:${'a'.repeat(64)}`;
const HASH_B = `sha256:${'b'.repeat(64)}`;
const HASH_C = `sha256:${'c'.repeat(64)}`;

function withTempLedger(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-replay-'));
  const sqlitePath = path.join(dir, 'audit.sqlite');
  const ledger = createCivicAuditLedger({ sqlitePath });
  try {
    return fn(ledger);
  } finally {
    ledger.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function auditEntry(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    entryId: 'audit_proposal_bridge_001',
    actor: {
      kind: 'human',
      accountId: 'acct_v6_human_001'
    },
    actionType: 'proposal.created',
    objectRef: 'proposal_bridge_001',
    idempotencyKey: 'idem_proposal_bridge_001',
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

function seedLedger(ledger) {
  ledger.append(auditEntry());
  ledger.append(auditEntry({
    entryId: 'audit_vote_bridge_001',
    actionType: 'vote.recorded',
    objectRef: 'vote_bridge_001',
    idempotencyKey: 'idem_vote_bridge_001',
    beforeHash: HASH_B,
    afterHash: HASH_C
  }));
}

test('V6 replay reconstruction summarizes civic audit rows without executing effects', () => withTempLedger((ledger) => {
  seedLedger(ledger);
  const report = reconstructCivicAuditReplayFromLedger(ledger);

  assert.equal(report.entryCount, 2);
  assert.equal(report.firstSeq, 1);
  assert.equal(report.lastSeq, 2);
  assert.equal(report.latestEntryHash, ledger.replay({ afterSeq: 1 })[0].entryHash);
  assert.equal(report.chainValid, true);
  assert.equal(report.privacySafe, true);
  assert.equal(report.privateDataIncluded, false);
  assert.deepEqual(report.byActionType, {
    'proposal.created': 1,
    'vote.recorded': 1
  });
  assert.deepEqual(report.byActorKind, { human: 2 });
  assert.deepEqual(report.byMigrationVersion, { v1: 2 });
  assert.equal(report.uniqueActorCount, 1);
  assert.equal(report.uniqueObjectCount, 2);
  assert.equal(report.appliesWorldState, false);
  assert.equal(report.executionStatus, 'not_executable');
  assert.equal(report.releaseReady, false);
  assert.equal(typeof report.actorAccountIds, 'undefined');
  assert.deepEqual(assertCivicReplayReconstructionSafe(report), { ok: true, errors: [] });
}));

test('V6 replay reconstruction paginates ledger replay deterministically', () => withTempLedger((ledger) => {
  seedLedger(ledger);
  const report = reconstructCivicAuditReplayFromLedger(ledger, { pageSize: 1 });

  assert.equal(report.entryCount, 2);
  assert.equal(report.firstSeq, 1);
  assert.equal(report.lastSeq, 2);
  assert.deepEqual(assertCivicReplayReconstructionSafe(report), { ok: true, errors: [] });
}));

test('V6 replay reconstruction fails closed on hash tampering and private data', () => withTempLedger((ledger) => {
  seedLedger(ledger);
  const rows = ledger.replay();
  const tampered = [
    rows[0],
    {
      ...rows[1],
      entryHash: CIVIC_AUDIT_GENESIS_HASH,
      entry: {
        ...rows[1].entry,
        privacy: {
          redacted: false,
          privateDataIncluded: true,
          dataClasses: ['brain_transcript']
        }
      }
    }
  ];
  const report = reconstructCivicAuditReplay(tampered);
  const safety = assertCivicReplayReconstructionSafe(report);

  assert.equal(report.ok, false);
  assert.equal(report.chainValid, false);
  assert.equal(report.privacySafe, false);
  assert.match(report.errors.join(','), /CIVIC_REPLAY_ENTRY_HASH_MISMATCH/);
  assert.match(report.errors.join(','), /CIVIC_REPLAY_REDACTION_REQUIRED/);
  assert.match(report.errors.join(','), /CIVIC_REPLAY_PRIVATE_DATA_FORBIDDEN/);
  assert.equal(safety.ok, false);
  assert.match(safety.errors.join(','), /CIVIC_REPLAY_RECONSTRUCTION_CHAIN_VALID_REQUIRED/);
  assert.match(safety.errors.join(','), /CIVIC_REPLAY_RECONSTRUCTION_PRIVACY_SAFE_REQUIRED/);
  assert.match(safety.errors.join(','), /CIVIC_REPLAY_RECONSTRUCTION_ERRORS_PRESENT/);
}));

test('V6 replay reconstruction fails closed when ledger API is missing', () => {
  const report = reconstructCivicAuditReplayFromLedger(null);
  const safety = assertCivicReplayReconstructionSafe(report);

  assert.equal(report.ok, false);
  assert.match(report.errors.join(','), /CIVIC_REPLAY_LEDGER_REQUIRED/);
  assert.equal(safety.ok, false);
});
