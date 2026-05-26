const { CIVIC_SCHEMA_VERSION } = require('../server/world_civilization/schemas');
const { createCivicAuditLedger } = require('../server/world_civilization/audit_ledger');
const { createCivicInstitutionStore } = require('../server/world_civilization/institutions');
const { createCivicPublicWorksStore } = require('../server/world_civilization/public_works');
const {
  assertCivicReplayReconstructionSafe,
  reconstructCivicAuditReplayFromLedger
} = require('../server/world_civilization/replay_reconstruction');

const INSTITUTION_ID = 'institution_restart_public_works_council_001';
const PROJECT_ID = 'publicworks_restart_bridge_001';
const PROJECTS = [
  {
    projectId: PROJECT_ID,
    institutionScopeTargetId: 'district_restart_public_works_ridge',
    goalBundle: { wood: 8, stone: 4, food: 0, coin: 20 },
    perContributionCap: { wood: 2, stone: 1, food: 0, coin: 5 },
    perContributorCap: { wood: 4, stone: 2, food: 0, coin: 10 },
    cosmeticRewardsOnly: true
  }
];

function institution(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    institutionId: INSTITUTION_ID,
    charterId: 'charter_restart_public_works_council_001',
    charteredBy: {
      kind: 'human',
      accountId: 'acct_v6_restart_public_works_charterer_001'
    },
    displayName: 'Restart Public Works Council',
    purpose: 'Coordinate restart-safe public works contribution accounting.',
    scope: {
      kind: 'public_works',
      targetId: 'district_restart_public_works_ridge'
    },
    proposalTypes: ['public_works'],
    membershipRuleId: 'rule_restart_public_works_members_001',
    eligibilityRuleId: 'rule_restart_public_works_voters_001',
    moderationPolicyId: 'policy_v6_restart_public_works_001',
    votingRuleId: 'rule_restart_public_works_majority_001',
    publicAuditSummary: 'Restart public works council charter for contribution accounting.',
    effectiveAtMs: 1_779_789_000_000,
    privacy: {
      redacted: true,
      privateDataIncluded: false,
      dataClasses: ['public_audit_summary', 'public_world_state']
    },
    ...overrides
  };
}

function contributionOne(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    contributionId: 'contribution_restart_bridge_001',
    institutionId: INSTITUTION_ID,
    projectId: PROJECT_ID,
    contributorAccountId: 'acct_v6_restart_contributor_001',
    sourceRef: 'action_restart_effect_bridge_001',
    requestedBundle: { wood: 10, stone: 2, food: 0, coin: 8 },
    idempotencyKey: 'idem_restart_public_works_bridge_001',
    publicSummary: 'Restart public works contribution toward the bridge.',
    privacy: {
      redacted: true,
      privateDataIncluded: false,
      dataClasses: ['public_audit_summary', 'public_world_state']
    },
    ...overrides
  };
}

function contributionTwo(overrides = {}) {
  return contributionOne({
    contributionId: 'contribution_restart_bridge_002',
    contributorAccountId: 'acct_v6_restart_contributor_002',
    requestedBundle: { wood: 1, stone: 1, food: 0, coin: 1 },
    idempotencyKey: 'idem_restart_public_works_bridge_002',
    publicSummary: 'Second restart public works contribution toward the bridge.',
    ...overrides
  });
}

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function openStores({ auditPath, institutionPath, publicWorksPath }) {
  const auditLedger = createCivicAuditLedger({ sqlitePath: auditPath });
  const institutionStore = createCivicInstitutionStore({ sqlitePath: institutionPath, auditLedger });
  const publicWorksStore = createCivicPublicWorksStore({
    sqlitePath: publicWorksPath,
    institutionStore,
    auditLedger,
    projects: PROJECTS
  });
  return { auditLedger, institutionStore, publicWorksStore };
}

function closeStores({ auditLedger, institutionStore, publicWorksStore }) {
  publicWorksStore.close();
  institutionStore.close();
  auditLedger.close();
}

function snapshot({ auditLedger, institutionStore, publicWorksStore }) {
  const summary = publicWorksStore.summarizeProject(PROJECT_ID);
  const replayReport = reconstructCivicAuditReplayFromLedger(auditLedger, { pageSize: 1 });
  const replaySafety = assertCivicReplayReconstructionSafe(replayReport);
  return {
    auditCount: auditLedger.count(),
    institutionCount: institutionStore.count(),
    contributionCount: publicWorksStore.count(),
    contributionIds: publicWorksStore
      .listContributions({ projectId: PROJECT_ID })
      .map((entry) => entry.contributionId),
    summary,
    replayOk: replaySafety.ok,
    replayReport
  };
}

function main() {
  const mode = process.argv[2];
  const auditPath = process.argv[3];
  const institutionPath = process.argv[4];
  const publicWorksPath = process.argv[5];
  if (!mode || !auditPath || !institutionPath || !publicWorksPath) {
    throw new Error('PUBLIC_WORKS_RESTART_PROBE_ARGS_REQUIRED');
  }

  const stores = openStores({ auditPath, institutionPath, publicWorksPath });
  try {
    if (mode === 'seed-institution') {
      const row = stores.institutionStore.charterInstitution(institution(), { nowMs: 1_779_789_000_000 });
      writeJson({
        ok: true,
        duplicate: row.duplicate === true,
        institutionId: row.institutionId,
        ...snapshot(stores)
      });
      return;
    }
    if (mode === 'record-first') {
      const row = stores.publicWorksStore.recordContribution(contributionOne(), { nowMs: 1_779_789_100_000 });
      writeJson({
        ok: true,
        duplicate: row.duplicate === true,
        contributionId: row.contributionId,
        acceptedBundle: row.acceptedBundle,
        cappedBundle: row.cappedBundle,
        ...snapshot(stores)
      });
      return;
    }
    if (mode === 'record-second') {
      const row = stores.publicWorksStore.recordContribution(contributionTwo(), { nowMs: 1_779_789_200_000 });
      writeJson({
        ok: true,
        duplicate: row.duplicate === true,
        contributionId: row.contributionId,
        acceptedBundle: row.acceptedBundle,
        cappedBundle: row.cappedBundle,
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
    throw new Error(`PUBLIC_WORKS_RESTART_PROBE_UNKNOWN_MODE:${mode}`);
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
