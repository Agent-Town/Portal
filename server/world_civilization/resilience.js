const fs = require('fs');

const { V6_WORLD_FEATURE_FLAG, isWorldGridFeatureEnabled } = require('../world_grid/feature_flags');

const V6_RESILIENCE_BASELINE_VERSION = 'agent-town.v6.resilience.v1';

const REQUIRED_RELEASE_GAPS = [
  'M16_PROCESS_RESTART_RELEASE_COVERAGE_REQUIRED',
  'M16_REPLAY_RECONSTRUCTION_RELEASE_COVERAGE_REQUIRED',
  'M16_MIGRATION_UPGRADE_DOWNGRADE_TESTS_REQUIRED',
  'M16_LOAD_AND_RATE_TESTS_REQUIRED',
  'M16_ROLLBACK_RECOVERY_EXECUTION_REQUIRED'
];

const V6_CIVIC_RESILIENCE_STORES = [
  {
    key: 'audit_ledger',
    label: 'Civic audit ledger',
    modulePath: 'server/world_civilization/audit_ledger.js',
    migrationVersion: 'v1',
    restartCoverage: 'tests/world_civilization_process_restart.test.js',
    requiredMethods: ['append', 'replay', 'getByEntryId', 'getByIdempotency', 'count', 'close']
  },
  {
    key: 'proposals',
    label: 'Proposal lifecycle store',
    modulePath: 'server/world_civilization/proposals.js',
    migrationVersion: 'v1',
    restartCoverage: 'tests/world_civilization_proposals.test.js',
    requiredMethods: ['draftProposal', 'getProposal', 'listProposals', 'previewProposalEffect', 'count', 'close'],
    forbiddenMethods: ['applyProposal', 'executeProposal']
  },
  {
    key: 'votes',
    label: 'Vote authorization store',
    modulePath: 'server/world_civilization/votes.js',
    migrationVersion: 'v1',
    restartCoverage: 'tests/world_civilization_votes.test.js',
    requiredMethods: ['recordVote', 'getVote', 'listVotes', 'summarizeProposalVotes', 'count', 'close']
  },
  {
    key: 'reputation',
    label: 'Reputation accountability store',
    modulePath: 'server/world_civilization/reputation.js',
    migrationVersion: 'v1',
    restartCoverage: 'tests/world_civilization_reputation.test.js',
    requiredMethods: ['recordReputation', 'getRecord', 'listRecords', 'summarizeSubjectReputation', 'count', 'close']
  },
  {
    key: 'moderation',
    label: 'Moderation privacy store',
    modulePath: 'server/world_civilization/moderation.js',
    migrationVersion: 'v1',
    restartCoverage: 'tests/world_civilization_moderation.test.js',
    requiredMethods: ['recordDecision', 'getDecision', 'listDecisions', 'summarizeSubjectModeration', 'count', 'close']
  },
  {
    key: 'effects',
    label: 'Civic effect rollback store',
    modulePath: 'server/world_civilization/effects.js',
    migrationVersion: 'v1',
    restartCoverage: 'tests/world_civilization_effects.test.js',
    requiredMethods: ['prepareEffect', 'getAction', 'getRollback', 'listActions', 'listRollbacks', 'summarizeProposalEffects', 'count', 'close'],
    forbiddenMethods: ['applyEffect', 'executeEffect']
  },
  {
    key: 'delegations',
    label: 'Agent participation delegation store',
    modulePath: 'server/world_civilization/delegations.js',
    migrationVersion: 'v1',
    restartCoverage: 'tests/world_civilization_delegations.test.js',
    requiredMethods: ['recordDelegation', 'revokeDelegation', 'getAgentParticipationPolicy', 'listDelegations', 'summarizePrincipalDelegations', 'count', 'close']
  },
  {
    key: 'institutions',
    label: 'Civic institution charter store',
    modulePath: 'server/world_civilization/institutions.js',
    migrationVersion: 'v1',
    restartCoverage: 'tests/world_civilization_institutions.test.js',
    requiredMethods: ['charterInstitution', 'getInstitution', 'listInstitutions', 'summarizeScopeInstitutions', 'count', 'close']
  },
  {
    key: 'public_works',
    label: 'Public works shared-resource store',
    modulePath: 'server/world_civilization/public_works.js',
    migrationVersion: 'v1',
    restartCoverage: 'tests/world_civilization_public_works.test.js',
    requiredMethods: ['recordContribution', 'getContribution', 'listContributions', 'summarizeProject', 'count', 'close'],
    forbiddenMethods: ['spendPrivateInventory', 'grantReward']
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function disabledReport(source) {
  return {
    version: V6_RESILIENCE_BASELINE_VERSION,
    status: 'research_only',
    source,
    featureFlag: V6_WORLD_FEATURE_FLAG,
    available: false,
    runtimeExposed: false,
    playerVisible: false,
    releaseReady: false,
    executionStatus: 'not_executable',
    storeReports: [],
    releaseGaps: [...REQUIRED_RELEASE_GAPS],
    disabledReason: 'V6 resilience evidence requires explicit research opt-in and V6 feature flag'
  };
}

function inspectStore(requirement, store) {
  const requiredMethods = requirement.requiredMethods || [];
  const forbiddenMethods = requirement.forbiddenMethods || [];
  const missingMethods = requiredMethods.filter((method) => typeof store?.[method] !== 'function');
  const forbiddenPresent = forbiddenMethods.filter((method) => typeof store?.[method] === 'function');
  const sqlitePath = typeof store?.sqlitePath === 'string' ? store.sqlitePath : '';
  const sqliteFileExists = sqlitePath ? fs.existsSync(sqlitePath) : false;

  return {
    key: requirement.key,
    label: requirement.label,
    modulePath: requirement.modulePath,
    migrationVersion: requirement.migrationVersion,
    restartCoverage: requirement.restartCoverage,
    sqliteBacked: Boolean(sqlitePath),
    sqliteFileExists,
    requiredMethods: [...requiredMethods],
    missingMethods,
    forbiddenMethods: [...forbiddenMethods],
    forbiddenPresent,
    ok: Boolean(sqlitePath) && sqliteFileExists && missingMethods.length === 0 && forbiddenPresent.length === 0
  };
}

function buildV6ResilienceBaselineReport({
  featureFlags = {},
  includeResearchEvidence = false,
  source = 'runtime',
  stores = {}
} = {}) {
  const enabled = includeResearchEvidence === true
    && isWorldGridFeatureEnabled(featureFlags, V6_WORLD_FEATURE_FLAG);
  if (!enabled) return disabledReport(source);

  return {
    version: V6_RESILIENCE_BASELINE_VERSION,
    status: 'research_only',
    source,
    featureFlag: V6_WORLD_FEATURE_FLAG,
    available: true,
    runtimeExposed: false,
    playerVisible: false,
    releaseReady: false,
    executionStatus: 'not_executable',
    storeReports: V6_CIVIC_RESILIENCE_STORES.map((requirement) => inspectStore(requirement, stores[requirement.key])),
    releaseGaps: [...REQUIRED_RELEASE_GAPS]
  };
}

function assertV6ResilienceBaseline(report = {}) {
  const errors = [];
  if (report.version !== V6_RESILIENCE_BASELINE_VERSION) {
    errors.push('V6_RESILIENCE_VERSION_REQUIRED');
  }
  if (report.featureFlag !== V6_WORLD_FEATURE_FLAG) {
    errors.push('V6_RESILIENCE_FEATURE_FLAG_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_RESILIENCE_RESEARCH_ONLY_REQUIRED');
  }
  if (report.runtimeExposed !== false) {
    errors.push('V6_RESILIENCE_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.playerVisible !== false) {
    errors.push('V6_RESILIENCE_PLAYER_HIDDEN_REQUIRED');
  }
  if (report.releaseReady !== false) {
    errors.push('V6_RESILIENCE_RELEASE_READY_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_RESILIENCE_NON_EXECUTING_REQUIRED');
  }
  if (!Array.isArray(report.releaseGaps) || REQUIRED_RELEASE_GAPS.some((gap) => !report.releaseGaps.includes(gap))) {
    errors.push('V6_RESILIENCE_RELEASE_GAPS_REQUIRED');
  }
  if (report.available === true) {
    const reports = Array.isArray(report.storeReports) ? report.storeReports : [];
    const reportKeys = new Set(reports.map((entry) => entry.key));
    for (const requirement of V6_CIVIC_RESILIENCE_STORES) {
      if (!reportKeys.has(requirement.key)) errors.push(`V6_RESILIENCE_STORE_REQUIRED:${requirement.key}`);
    }
    for (const storeReport of reports) {
      if (storeReport.ok !== true) errors.push(`V6_RESILIENCE_STORE_EVIDENCE_INVALID:${storeReport.key}`);
    }
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  REQUIRED_RELEASE_GAPS,
  V6_CIVIC_RESILIENCE_STORES: clone(V6_CIVIC_RESILIENCE_STORES),
  V6_RESILIENCE_BASELINE_VERSION,
  assertV6ResilienceBaseline,
  buildV6ResilienceBaselineReport
};
