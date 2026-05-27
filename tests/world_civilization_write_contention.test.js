const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { createCivicAuditLedger } = require('../server/world_civilization/audit_ledger');
const {
  assertCivicReplayReconstructionSafe,
  reconstructCivicAuditReplayFromLedger
} = require('../server/world_civilization/replay_reconstruction');
const {
  assertV6WriteContentionRehearsalSafe,
  buildV6WriteContentionRehearsalReport
} = require('../server/world_civilization/write_contention');

const repoRoot = path.join(__dirname, '..');
const childPath = path.join(__dirname, 'world_civilization_write_contention_child.js');

function runWriter({ sqlitePath, writerIndex, writes }) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [childPath, sqlitePath, String(writerIndex), String(writes)], {
      cwd: repoRoot,
      env: {
        ...process.env,
        FORCE_COLOR: '0'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (status) => {
      const lines = stdout.trim().split('\n').filter(Boolean);
      const parsed = JSON.parse(lines[lines.length - 1] || '{}');
      if (status !== 0) {
        const err = new Error(`write contention child failed: ${writerIndex}`);
        err.details = { status, stdout, stderr, parsed };
        reject(err);
        return;
      }
      resolve(parsed);
    });
  });
}

test('V6 civic audit ledger serializes multi-process write contention without row-payload reports', { timeout: 30000 }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-write-contention-'));
  const sqlitePath = path.join(dir, 'audit.sqlite');
  const writerCount = 4;
  const writesPerWriter = 5;
  const expectedAppendCount = writerCount * writesPerWriter;
  try {
    const primed = createCivicAuditLedger({ sqlitePath });
    primed.close();

    const attempts = await Promise.all(Array.from({ length: writerCount }, (_, index) => (
      runWriter({ sqlitePath, writerIndex: index, writes: writesPerWriter })
    )));

    assert.equal(attempts.length, writerCount);
    assert.ok(attempts.every((attempt) => attempt.ok === true));
    assert.deepEqual(attempts.map((attempt) => attempt.writeCount), Array.from({ length: writerCount }, () => writesPerWriter));
    assert.deepEqual(attempts.map((attempt) => attempt.duplicateCount), Array.from({ length: writerCount }, () => 1));

    const allEntryIds = attempts.flatMap((attempt) => attempt.entryIds);
    assert.equal(new Set(allEntryIds).size, expectedAppendCount);
    assert.equal(allEntryIds.length, expectedAppendCount);

    const ledger = createCivicAuditLedger({ sqlitePath });
    try {
      assert.equal(ledger.count(), expectedAppendCount);
      const replayRows = ledger.replay({ afterSeq: 0, limit: 100 });
      assert.equal(replayRows.length, expectedAppendCount);
      assert.deepEqual(replayRows.map((row) => row.seq), Array.from({ length: expectedAppendCount }, (_, index) => index + 1));
      assert.equal(new Set(replayRows.map((row) => row.entry.entryId)).size, expectedAppendCount);
      assert.ok(replayRows.every((row) => row.entry.beforeSummary.includes('contention before summary')));
      assert.ok(replayRows.every((row) => row.entry.afterSummary.includes('contention after summary')));

      const replayReport = reconstructCivicAuditReplayFromLedger(ledger, {
        pageSize: 3,
        maxEntries: expectedAppendCount
      });
      assert.deepEqual(assertCivicReplayReconstructionSafe(replayReport), { ok: true, errors: [] });
      assert.equal(replayReport.entryCount, expectedAppendCount);
      assert.equal(replayReport.chainValid, true);
      assert.equal(replayReport.privacySafe, true);
      assert.equal(replayReport.appliesWorldState, false);

      const report = buildV6WriteContentionRehearsalReport({
        attempts,
        expectedWriterCount: writerCount,
        expectedAppendCount,
        expectedDuplicateCount: writerCount,
        ledgerCount: ledger.count(),
        replayReport,
        source: 'node_test'
      });
      assert.equal(report.ok, true);
      assert.equal(report.releaseReady, false);
      assert.equal(report.runtimeExposed, false);
      assert.equal(report.playerVisible, false);
      assert.equal(report.reportPayloadIncludesRows, false);
      assert.equal(report.executionStatus, 'not_executable');
      assert.equal(report.writerReports.length, writerCount);
      assert.ok(report.writerReports.every((writerReport) => !Object.hasOwn(writerReport, 'entryIds')));
      assert.ok(report.writerReports.every((writerReport) => !Object.hasOwn(writerReport, 'seqs')));
      assert.deepEqual(assertV6WriteContentionRehearsalSafe(report), { ok: true, errors: [] });
    } finally {
      ledger.close();
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('V6 write contention rehearsal assertion rejects release-ready and private row-report drift', () => {
  const report = buildV6WriteContentionRehearsalReport({
    attempts: [{
      ok: true,
      writerId: 'writer_001',
      writeCount: 1,
      duplicateCount: 0,
      entryIds: ['audit_contention_writer001_000'],
      errors: []
    }],
    expectedWriterCount: 1,
    expectedAppendCount: 1,
    expectedDuplicateCount: 0,
    ledgerCount: 1,
    replayReport: {
      entryCount: 1,
      chainValid: true,
      privacySafe: true,
      appliesWorldState: false
    }
  });
  const unsafe = {
    ...report,
    releaseReady: true,
    runtimeExposed: true,
    playerVisible: true,
    appliesWorldState: true,
    exposesPrivateData: true,
    reportPayloadIncludesRows: true,
    executionStatus: 'executes',
    writerReports: [{
      ...report.writerReports[0],
      entryIds: ['audit_contention_writer001_000']
    }],
    releaseGaps: []
  };
  const result = assertV6WriteContentionRehearsalSafe(unsafe);

  assert.equal(result.ok, false);
  assert.match(result.errors.join(','), /V6_WRITE_CONTENTION_RELEASE_READY_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_WRITE_CONTENTION_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_WRITE_CONTENTION_PLAYER_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_WRITE_CONTENTION_WORLD_APPLICATION_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_WRITE_CONTENTION_PRIVATE_ROW_REPORT_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_WRITE_CONTENTION_NON_EXECUTING_REQUIRED/);
  assert.match(result.errors.join(','), /V6_WRITE_CONTENTION_RELEASE_GAPS_REQUIRED/);
  assert.match(result.errors.join(','), /V6_WRITE_CONTENTION_ROW_PAYLOAD_FORBIDDEN:writer_001/);
});
