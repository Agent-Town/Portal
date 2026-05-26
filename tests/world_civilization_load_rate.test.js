const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { CIVIC_SCHEMA_VERSION } = require('../server/world_civilization/schemas');
const { createCivicAuditLedger, sha256 } = require('../server/world_civilization/audit_ledger');
const {
  assertCivicReplayReconstructionSafe,
  reconstructCivicAuditReplayFromLedger
} = require('../server/world_civilization/replay_reconstruction');

const ACTION_TYPES = [
  'proposal.created',
  'vote.recorded',
  'moderation.decided',
  'reputation.recorded',
  'public_works.contribution.recorded'
];

function withTempLedger(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-load-rate-'));
  const sqlitePath = path.join(dir, 'audit.sqlite');
  const ledger = createCivicAuditLedger({ sqlitePath });
  try {
    return fn(ledger);
  } finally {
    ledger.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function padded(index) {
  return String(index).padStart(3, '0');
}

function auditEntry(index, overrides = {}) {
  const id = padded(index);
  const actionType = ACTION_TYPES[index % ACTION_TYPES.length];
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    entryId: `audit_load_rate_${id}`,
    actor: {
      kind: 'human',
      accountId: `acct_v6_load_actor_${padded(index % 12)}`
    },
    actionType,
    objectRef: `object_load_rate_${id}`,
    idempotencyKey: `idem_load_rate_${id}`,
    beforeHash: sha256(`agent-town.v6.load.before:${id}`),
    afterHash: sha256(`agent-town.v6.load.after:${id}`),
    createdAtMs: 1_779_790_000_000 + index,
    migrationVersion: 'v1',
    replayable: true,
    rollbackId: index % 20 === 0 ? `rollback_load_rate_${id}` : '',
    privacy: {
      redacted: true,
      privateDataIncluded: false,
      dataClasses: ['public_audit_summary']
    },
    ...overrides
  };
}

function expectedActionCounts(count) {
  const counts = {};
  for (let index = 0; index < count; index += 1) {
    const actionType = ACTION_TYPES[index % ACTION_TYPES.length];
    counts[actionType] = (counts[actionType] || 0) + 1;
  }
  return Object.keys(counts).sort().reduce((out, key) => {
    out[key] = counts[key];
    return out;
  }, {});
}

test('V6 civic audit ledger handles research-scale replay pagination and retry bursts', () => withTempLedger((ledger) => {
  const entryCount = 180;
  const entries = [];
  for (let index = 0; index < entryCount; index += 1) {
    const entry = auditEntry(index);
    entries.push(entry);
    const row = ledger.append(entry);
    assert.equal(row.seq, index + 1);
    assert.equal(row.duplicate, undefined);
  }
  assert.equal(ledger.count(), entryCount);

  for (const entry of entries) {
    const duplicate = ledger.append(entry);
    assert.equal(duplicate.duplicate, true);
  }
  assert.equal(ledger.count(), entryCount);

  for (let index = 0; index < entryCount; index += 23) {
    assert.throws(
      () => ledger.append(auditEntry(index, {
        entryId: `audit_load_rate_conflict_${padded(index)}`,
        afterHash: sha256(`agent-town.v6.load.conflict:${index}`)
      })),
      /CIVIC_AUDIT_IDEMPOTENCY_CONFLICT/
    );
  }
  assert.equal(ledger.count(), entryCount);

  const collected = [];
  let afterSeq = 0;
  while (collected.length < entryCount) {
    const page = ledger.replay({ afterSeq, limit: 17 });
    if (page.length === 0) break;
    assert.ok(page.length <= 17);
    collected.push(...page);
    afterSeq = page[page.length - 1].seq;
  }
  assert.equal(collected.length, entryCount);
  assert.deepEqual(collected.map((row) => row.seq), Array.from({ length: entryCount }, (_, index) => index + 1));
  assert.deepEqual(collected.map((row) => row.entry.entryId), entries.map((entry) => entry.entryId));

  const report = reconstructCivicAuditReplayFromLedger(ledger, { pageSize: 17, maxEntries: entryCount });
  assert.equal(report.status, 'research_only');
  assert.equal(report.entryCount, entryCount);
  assert.equal(report.firstSeq, 1);
  assert.equal(report.lastSeq, entryCount);
  assert.equal(report.latestEntryHash, collected[collected.length - 1].entryHash);
  assert.equal(report.chainValid, true);
  assert.equal(report.privacySafe, true);
  assert.equal(report.releaseReady, false);
  assert.equal(report.appliesWorldState, false);
  assert.equal(report.rollbackCount, Math.ceil(entryCount / 20));
  assert.deepEqual(report.byActionType, expectedActionCounts(entryCount));
  assert.deepEqual(report.byMigrationVersion, { v1: entryCount });
  assert.deepEqual(assertCivicReplayReconstructionSafe(report), { ok: true, errors: [] });

  const cappedReport = reconstructCivicAuditReplayFromLedger(ledger, { pageSize: 250, maxEntries: 75 });
  assert.equal(cappedReport.entryCount, 75);
  assert.equal(cappedReport.lastSeq, 75);
  assert.equal(cappedReport.chainValid, true);
  assert.equal(cappedReport.privacySafe, true);
  assert.equal(cappedReport.releaseReady, false);
  assert.deepEqual(assertCivicReplayReconstructionSafe(cappedReport), { ok: true, errors: [] });
}));
