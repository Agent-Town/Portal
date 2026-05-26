const { CIVIC_SCHEMA_VERSION } = require('../server/world_civilization/schemas');
const { createCivicAuditLedger } = require('../server/world_civilization/audit_ledger');
const { createCivicModerationStore } = require('../server/world_civilization/moderation');
const { createCivicReputationStore } = require('../server/world_civilization/reputation');
const {
  assertCivicReplayReconstructionSafe,
  reconstructCivicAuditReplayFromLedger
} = require('../server/world_civilization/replay_reconstruction');

const REPUTATION_SUBJECT = 'acct_v6_restart_service_001';
const MODERATION_SUBJECT = 'proposal_restart_civic_notice_001';

function reputationRecord(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    recordId: 'reputation_restart_service_001',
    subjectAccountId: REPUTATION_SUBJECT,
    awardedByAccountId: 'acct_v6_restart_human_001',
    kind: 'service_reliability',
    delta: 2,
    sourceRef: MODERATION_SUBJECT,
    disputeStatus: 'none',
    auditLedgerEntryId: 'audit_reputation_restart_service_001',
    ...overrides
  };
}

function moderationDecision(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    decisionId: 'moderation_restart_civic_notice_001',
    subjectRef: MODERATION_SUBJECT,
    surface: 'civic_text',
    status: 'needs_review',
    policyVersion: 'policy_v6_restart_privacy_001',
    reviewerKind: 'human',
    reasons: ['Public civic notice requires manual review before release exposure.'],
    redactedFields: ['profile.location'],
    ...overrides
  };
}

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function openStores({ auditPath, reputationPath, moderationPath }) {
  const auditLedger = createCivicAuditLedger({ sqlitePath: auditPath });
  const reputationStore = createCivicReputationStore({ sqlitePath: reputationPath, auditLedger });
  const moderationStore = createCivicModerationStore({ sqlitePath: moderationPath, auditLedger });
  return { auditLedger, reputationStore, moderationStore };
}

function closeStores({ auditLedger, reputationStore, moderationStore }) {
  moderationStore.close();
  reputationStore.close();
  auditLedger.close();
}

function snapshot({ auditLedger, reputationStore, moderationStore }) {
  const reputationSummary = reputationStore.summarizeSubjectReputation(REPUTATION_SUBJECT);
  const moderationSummary = moderationStore.summarizeSubjectModeration(MODERATION_SUBJECT);
  const replayReport = reconstructCivicAuditReplayFromLedger(auditLedger, { pageSize: 1 });
  const replaySafety = assertCivicReplayReconstructionSafe(replayReport);
  return {
    auditCount: auditLedger.count(),
    reputationCount: reputationStore.count(),
    moderationCount: moderationStore.count(),
    reputationSummary,
    moderationSummary,
    replayOk: replaySafety.ok,
    replayReport
  };
}

function main() {
  const mode = process.argv[2];
  const auditPath = process.argv[3];
  const reputationPath = process.argv[4];
  const moderationPath = process.argv[5];
  if (!mode || !auditPath || !reputationPath || !moderationPath) {
    throw new Error('REPUTATION_MODERATION_RESTART_PROBE_ARGS_REQUIRED');
  }

  const stores = openStores({ auditPath, reputationPath, moderationPath });
  try {
    if (mode === 'seed-reputation') {
      const row = stores.reputationStore.recordReputation(reputationRecord(), { nowMs: 1_779_785_000_000 });
      writeJson({
        ok: true,
        duplicate: row.duplicate === true,
        recordId: row.recordId,
        ...snapshot(stores)
      });
      return;
    }
    if (mode === 'seed-moderation') {
      const row = stores.moderationStore.recordDecision(moderationDecision(), { nowMs: 1_779_785_500_000 });
      writeJson({
        ok: true,
        duplicate: row.duplicate === true,
        decisionId: row.decisionId,
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
    throw new Error(`REPUTATION_MODERATION_RESTART_PROBE_UNKNOWN_MODE:${mode}`);
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
