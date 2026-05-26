const { CIVIC_SCHEMA_VERSION } = require('../server/world_civilization/schemas');
const { createCivicAuditLedger } = require('../server/world_civilization/audit_ledger');
const { createCivicInstitutionStore } = require('../server/world_civilization/institutions');
const {
  assertCivicReplayReconstructionSafe,
  reconstructCivicAuditReplayFromLedger
} = require('../server/world_civilization/replay_reconstruction');

const SCOPE_TARGET_ID = 'district_restart_civic_ridge';
const PUBLIC_WORKS_INSTITUTION_ID = 'institution_restart_bridge_council_001';
const SANDBOX_INSTITUTION_ID = 'institution_restart_sandbox_council_001';

function publicWorksInstitution(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    institutionId: PUBLIC_WORKS_INSTITUTION_ID,
    charterId: 'charter_restart_bridge_council_001',
    charteredBy: {
      kind: 'human',
      accountId: 'acct_v6_restart_charterer_001'
    },
    displayName: 'Restart Bridge Council',
    purpose: 'Coordinate restart-safe public works proposals for a ridge district.',
    scope: {
      kind: 'public_works',
      targetId: SCOPE_TARGET_ID
    },
    proposalTypes: ['public_works', 'public_world'],
    membershipRuleId: 'rule_restart_bridge_members_001',
    eligibilityRuleId: 'rule_restart_bridge_voters_001',
    moderationPolicyId: 'policy_v6_restart_public_001',
    votingRuleId: 'rule_restart_bridge_majority_001',
    publicAuditSummary: 'Restart Bridge Council charter for public works coordination.',
    effectiveAtMs: 1_779_788_000_000,
    privacy: {
      redacted: true,
      privateDataIncluded: false,
      dataClasses: ['public_audit_summary', 'public_world_state']
    },
    ...overrides
  };
}

function sandboxInstitution(overrides = {}) {
  return publicWorksInstitution({
    institutionId: SANDBOX_INSTITUTION_ID,
    charterId: 'charter_restart_sandbox_council_001',
    displayName: 'Restart Sandbox Council',
    purpose: 'Review controlled sandbox policies before public experiments.',
    scope: {
      kind: 'sandbox_policy',
      targetId: SCOPE_TARGET_ID
    },
    proposalTypes: ['sandbox_policy'],
    membershipRuleId: 'rule_restart_sandbox_members_001',
    eligibilityRuleId: 'rule_restart_sandbox_voters_001',
    moderationPolicyId: 'policy_v6_restart_sandbox_001',
    votingRuleId: 'rule_restart_sandbox_majority_001',
    publicAuditSummary: 'Restart Sandbox Council charter for controlled policy review.',
    ...overrides
  });
}

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function openStores({ auditPath, institutionPath }) {
  const auditLedger = createCivicAuditLedger({ sqlitePath: auditPath });
  const institutionStore = createCivicInstitutionStore({ sqlitePath: institutionPath, auditLedger });
  return { auditLedger, institutionStore };
}

function closeStores({ auditLedger, institutionStore }) {
  institutionStore.close();
  auditLedger.close();
}

function snapshot({ auditLedger, institutionStore }) {
  const summary = institutionStore.summarizeScopeInstitutions(SCOPE_TARGET_ID);
  const replayReport = reconstructCivicAuditReplayFromLedger(auditLedger, { pageSize: 1 });
  const replaySafety = assertCivicReplayReconstructionSafe(replayReport);
  return {
    auditCount: auditLedger.count(),
    institutionCount: institutionStore.count(),
    publicWorksStatus: institutionStore.getInstitution(PUBLIC_WORKS_INSTITUTION_ID)?.status || '',
    sandboxStatus: institutionStore.getInstitution(SANDBOX_INSTITUTION_ID)?.status || '',
    institutionIds: institutionStore
      .listInstitutions({ scopeTargetId: SCOPE_TARGET_ID })
      .map((entry) => entry.institutionId),
    summary,
    replayOk: replaySafety.ok,
    replayReport
  };
}

function main() {
  const mode = process.argv[2];
  const auditPath = process.argv[3];
  const institutionPath = process.argv[4];
  if (!mode || !auditPath || !institutionPath) {
    throw new Error('INSTITUTION_RESTART_PROBE_ARGS_REQUIRED');
  }

  const stores = openStores({ auditPath, institutionPath });
  try {
    if (mode === 'seed-public-works') {
      const row = stores.institutionStore.charterInstitution(publicWorksInstitution(), { nowMs: 1_779_788_000_000 });
      writeJson({
        ok: true,
        duplicate: row.duplicate === true,
        institutionId: row.institutionId,
        ...snapshot(stores)
      });
      return;
    }
    if (mode === 'seed-sandbox') {
      const row = stores.institutionStore.charterInstitution(sandboxInstitution(), { nowMs: 1_779_788_100_000 });
      writeJson({
        ok: true,
        duplicate: row.duplicate === true,
        institutionId: row.institutionId,
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
    throw new Error(`INSTITUTION_RESTART_PROBE_UNKNOWN_MODE:${mode}`);
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
