const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { CIVIC_SCHEMA_VERSION } = require('../server/world_civilization/schemas');
const { createCivicAuditLedger, sha256 } = require('../server/world_civilization/audit_ledger');

const HASH_A = `sha256:${'a'.repeat(64)}`;
const HASH_B = `sha256:${'b'.repeat(64)}`;
const HASH_C = `sha256:${'c'.repeat(64)}`;

function withTempLedger(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-audit-'));
  const sqlitePath = path.join(dir, 'audit.sqlite');
  try {
    return fn(sqlitePath);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function auditEntry(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    entryId: 'audit_action_bridge_001',
    actor: {
      kind: 'human',
      accountId: 'acct_v6_human_001'
    },
    actionType: 'civic_action.applied',
    objectRef: 'action_apply_bridge_001',
    idempotencyKey: 'idem_action_bridge_001',
    beforeHash: HASH_A,
    afterHash: HASH_B,
    createdAtMs: 1_779_784_000_000,
    migrationVersion: 'v1',
    replayable: true,
    rollbackId: 'rollback_bridge_001',
    privacy: {
      redacted: true,
      privateDataIncluded: false,
      dataClasses: ['public_audit_summary']
    },
    ...overrides
  };
}

test('V6 civic audit ledger appends validated entries in replay order with hash chain', () => withTempLedger((sqlitePath) => {
  const ledger = createCivicAuditLedger({ sqlitePath });
  const first = ledger.append(auditEntry());
  const second = ledger.append(auditEntry({
    entryId: 'audit_vote_bridge_001',
    actionType: 'vote.recorded',
    objectRef: 'vote_bridge_approval_001',
    idempotencyKey: 'idem_vote_bridge_001',
    beforeHash: HASH_B,
    afterHash: HASH_C,
    rollbackId: ''
  }));

  assert.equal(first.seq, 1);
  assert.equal(second.seq, 2);
  assert.equal(first.prevEntryHash, sha256('agent-town.v6.civic.audit.genesis'));
  assert.equal(second.prevEntryHash, first.entryHash);
  assert.notEqual(first.entryHash, second.entryHash);
  assert.deepEqual(ledger.replay().map((row) => row.entry.entryId), [
    'audit_action_bridge_001',
    'audit_vote_bridge_001'
  ]);
  assert.deepEqual(ledger.replay({ afterSeq: 1 }).map((row) => row.entry.entryId), ['audit_vote_bridge_001']);
  ledger.close();
}));

test('V6 civic audit ledger enforces idempotency without appending duplicates', () => withTempLedger((sqlitePath) => {
  const ledger = createCivicAuditLedger({ sqlitePath });
  const first = ledger.append(auditEntry());
  const duplicate = ledger.append(auditEntry());

  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.seq, first.seq);
  assert.equal(ledger.count(), 1);
  assert.throws(
    () => ledger.append(auditEntry({
      entryId: 'audit_action_bridge_002',
      afterHash: HASH_C
    })),
    /CIVIC_AUDIT_IDEMPOTENCY_CONFLICT/
  );
  assert.equal(ledger.count(), 1);
  ledger.close();
}));

test('V6 civic audit ledger rejects invalid or private-data entries before persistence', () => withTempLedger((sqlitePath) => {
  const ledger = createCivicAuditLedger({ sqlitePath });

  assert.throws(
    () => ledger.append(auditEntry({
      privacy: {
        redacted: false,
        privateDataIncluded: true,
        dataClasses: ['brain_transcript']
      },
      debugTrace: {
        token: 'sk-test-secret-value'
      }
    })),
    /CIVIC_AUDIT_ENTRY_INVALID/
  );
  assert.equal(ledger.count(), 0);
  ledger.close();
}));

test('V6 civic audit ledger persists entries across reopen and supports owner/object replay', () => withTempLedger((sqlitePath) => {
  const ledger = createCivicAuditLedger({ sqlitePath });
  ledger.append(auditEntry());
  ledger.close();

  const reopened = createCivicAuditLedger({ sqlitePath });
  assert.equal(reopened.count(), 1);
  assert.equal(reopened.getByEntryId('audit_action_bridge_001').entry.objectRef, 'action_apply_bridge_001');
  assert.equal(reopened.getByIdempotency('acct_v6_human_001', 'idem_action_bridge_001').entry.entryId, 'audit_action_bridge_001');
  assert.deepEqual(reopened.replay({ actorAccountId: 'acct_v6_human_001' }).map((row) => row.entry.entryId), ['audit_action_bridge_001']);
  assert.deepEqual(reopened.replay({ objectRef: 'action_apply_bridge_001' }).map((row) => row.entry.entryId), ['audit_action_bridge_001']);
  reopened.close();
}));
