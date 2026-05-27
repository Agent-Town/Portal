const crypto = require('crypto');

const {
  CURRENT_MIGRATION_VERSION,
  buildV6MigrationRehearsalReport
} = require('./migration_rehearsal');
const { reconstructCivicAuditReplayFromLedger } = require('./replay_reconstruction');

const V6_MIGRATION_LOAD_REPLAY_REHEARSAL_VERSION = 'agent-town.v6.migration_load_replay_rehearsal.v1';
const REQUIRED_MIGRATION_LOAD_REPLAY_RELEASE_GAPS = [
  'release_grade_migration_scripts_required',
  'large_dataset_migration_replay_required',
  'multi_store_migration_transaction_replay_required',
  'backup_restore_pre_migration_required',
  'post_migration_replay_diff_required',
  'production_replay_slo_targets_required'
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sha256(value = '') {
  return `sha256:${crypto.createHash('sha256').update(String(value || ''), 'utf8').digest('hex')}`;
}

function sanitizeMigrationStores(storeReports = []) {
  return (Array.isArray(storeReports) ? storeReports : []).map((entry) => ({
    key: String(entry.key || ''),
    modulePath: String(entry.modulePath || ''),
    migrationVersion: String(entry.migrationVersion || ''),
    expectedMigrationVersion: String(entry.expectedMigrationVersion || ''),
    metadataOk: entry.metadataOk === true,
    ok: entry.ok === true
  }));
}

function buildMissingReport(errors = []) {
  return {
    version: V6_MIGRATION_LOAD_REPLAY_REHEARSAL_VERSION,
    status: 'research_only',
    ok: false,
    errors,
    source: 'runtime',
    currentMigrationVersion: CURRENT_MIGRATION_VERSION,
    targetMigrationVersion: '',
    direction: 'unknown',
    migrationScriptsAvailable: false,
    appliesMigration: false,
    appliesWorldState: false,
    exposesPrivateData: false,
    reportPayloadIncludesRows: false,
    executionStatus: 'not_executable',
    releaseReady: false,
    expectedStoreCount: 0,
    storeCount: 0,
    storeKeyDigest: sha256(''),
    expectedReplayEntryCount: 0,
    replayEntryCount: 0,
    replayPageSize: 0,
    replayMaxEntries: 0,
    hashChainValid: false,
    privacySafeReplay: false,
    summaryComplete: false,
    migrationStoreReports: [],
    releaseGaps: [...REQUIRED_MIGRATION_LOAD_REPLAY_RELEASE_GAPS]
  };
}

function buildV6MigrationLoadReplayRehearsalReport({
  stores = {},
  storeRequirements = [],
  ledger = null,
  targetMigrationVersion = CURRENT_MIGRATION_VERSION,
  expectedReplayEntryCount = 0,
  pageSize = 25,
  maxEntries = 500,
  source = 'runtime'
} = {}) {
  const errors = [];
  if (!Array.isArray(storeRequirements) || storeRequirements.length === 0) {
    errors.push('V6_MIGRATION_LOAD_REPLAY_STORE_REQUIREMENTS_REQUIRED');
  }
  if (!ledger || typeof ledger.replay !== 'function') {
    errors.push('V6_MIGRATION_LOAD_REPLAY_LEDGER_REQUIRED');
  }
  const safeExpectedReplayEntryCount = Number.isInteger(Number(expectedReplayEntryCount))
    ? Math.max(0, Number(expectedReplayEntryCount))
    : 0;
  if (safeExpectedReplayEntryCount <= 0) {
    errors.push('V6_MIGRATION_LOAD_REPLAY_EXPECTED_REPLAY_COUNT_REQUIRED');
  }
  if (errors.length > 0) return buildMissingReport(errors);

  const migrationReport = buildV6MigrationRehearsalReport({
    stores,
    storeRequirements,
    targetMigrationVersion
  });
  const safePageSize = Math.max(1, Math.min(100, Number(pageSize) || 25));
  const safeMaxEntries = Math.max(1, Math.min(500, Number(maxEntries) || 500));
  const replayReport = reconstructCivicAuditReplayFromLedger(ledger, {
    pageSize: safePageSize,
    maxEntries: safeMaxEntries
  });
  const migrationStoreReports = sanitizeMigrationStores(migrationReport.storeReports);
  const storeKeys = migrationStoreReports.map((entry) => entry.key).sort();

  if (migrationReport.ok !== true) errors.push('V6_MIGRATION_LOAD_REPLAY_MIGRATION_INVENTORY_INVALID');
  if (migrationReport.direction !== 'same_version_inventory') errors.push('V6_MIGRATION_LOAD_REPLAY_UNSUPPORTED_DIRECTION');
  if (migrationReport.migrationScriptsAvailable !== false) errors.push('V6_MIGRATION_LOAD_REPLAY_SCRIPT_AVAILABILITY_FORBIDDEN');
  if (migrationReport.appliesWorldState !== false) errors.push('V6_MIGRATION_LOAD_REPLAY_MIGRATION_WORLD_APPLICATION_FORBIDDEN');
  if (replayReport.ok !== true) errors.push('V6_MIGRATION_LOAD_REPLAY_REPLAY_INVALID');
  if (replayReport.entryCount !== safeExpectedReplayEntryCount) errors.push('V6_MIGRATION_LOAD_REPLAY_REPLAY_COUNT_MISMATCH');
  if (replayReport.chainValid !== true) errors.push('V6_MIGRATION_LOAD_REPLAY_HASH_CHAIN_INVALID');
  if (replayReport.privacySafe !== true || replayReport.privateDataIncluded !== false) errors.push('V6_MIGRATION_LOAD_REPLAY_PRIVACY_REQUIRED');
  if (replayReport.summaryComplete !== true) errors.push('V6_MIGRATION_LOAD_REPLAY_SUMMARY_REQUIRED');
  if (replayReport.appliesWorldState !== false) errors.push('V6_MIGRATION_LOAD_REPLAY_REPLAY_WORLD_APPLICATION_FORBIDDEN');

  return {
    version: V6_MIGRATION_LOAD_REPLAY_REHEARSAL_VERSION,
    status: 'research_only',
    ok: errors.length === 0,
    errors,
    source,
    currentMigrationVersion: migrationReport.currentMigrationVersion,
    targetMigrationVersion: migrationReport.targetMigrationVersion,
    direction: migrationReport.direction,
    migrationScriptsAvailable: false,
    appliesMigration: false,
    appliesWorldState: false,
    exposesPrivateData: false,
    reportPayloadIncludesRows: false,
    executionStatus: 'not_executable',
    releaseReady: false,
    expectedStoreCount: storeRequirements.length,
    storeCount: migrationStoreReports.length,
    storeKeyDigest: sha256(storeKeys.join('\n')),
    expectedReplayEntryCount: safeExpectedReplayEntryCount,
    replayEntryCount: replayReport.entryCount,
    replayPageSize: safePageSize,
    replayMaxEntries: safeMaxEntries,
    hashChainValid: replayReport.chainValid === true,
    privacySafeReplay: replayReport.privacySafe === true,
    summaryComplete: replayReport.summaryComplete === true,
    migrationStoreReports,
    releaseGaps: [...REQUIRED_MIGRATION_LOAD_REPLAY_RELEASE_GAPS]
  };
}

function assertV6MigrationLoadReplayRehearsalSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_MIGRATION_LOAD_REPLAY_REHEARSAL_VERSION) {
    errors.push('V6_MIGRATION_LOAD_REPLAY_VERSION_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_MIGRATION_LOAD_REPLAY_RESEARCH_ONLY_REQUIRED');
  }
  if (report.releaseReady !== false) {
    errors.push('V6_MIGRATION_LOAD_REPLAY_RELEASE_READY_FORBIDDEN');
  }
  if (report.appliesMigration !== false) {
    errors.push('V6_MIGRATION_LOAD_REPLAY_MIGRATION_APPLICATION_FORBIDDEN');
  }
  if (report.appliesWorldState !== false) {
    errors.push('V6_MIGRATION_LOAD_REPLAY_WORLD_APPLICATION_FORBIDDEN');
  }
  if (report.migrationScriptsAvailable !== false) {
    errors.push('V6_MIGRATION_LOAD_REPLAY_SCRIPT_AVAILABILITY_FORBIDDEN');
  }
  if (report.exposesPrivateData !== false || report.reportPayloadIncludesRows !== false) {
    errors.push('V6_MIGRATION_LOAD_REPLAY_PRIVATE_ROW_REPORT_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_MIGRATION_LOAD_REPLAY_NON_EXECUTING_REQUIRED');
  }
  if (!Array.isArray(report.releaseGaps) || REQUIRED_MIGRATION_LOAD_REPLAY_RELEASE_GAPS.some((gap) => !report.releaseGaps.includes(gap))) {
    errors.push('V6_MIGRATION_LOAD_REPLAY_RELEASE_GAPS_REQUIRED');
  }
  if (report.hashChainValid !== true || report.privacySafeReplay !== true || report.summaryComplete !== true) {
    errors.push('V6_MIGRATION_LOAD_REPLAY_REPLAY_SAFETY_REQUIRED');
  }
  if (report.ok !== true || (Array.isArray(report.errors) && report.errors.length > 0)) {
    errors.push('V6_MIGRATION_LOAD_REPLAY_ERRORS_PRESENT');
  }
  for (const storeReport of Array.isArray(report.migrationStoreReports) ? report.migrationStoreReports : []) {
    if (storeReport.rows || storeReport.records || storeReport.schemaMetadata) {
      errors.push(`V6_MIGRATION_LOAD_REPLAY_ROW_PAYLOAD_FORBIDDEN:${storeReport.key || 'unknown'}`);
    }
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  REQUIRED_MIGRATION_LOAD_REPLAY_RELEASE_GAPS: clone(REQUIRED_MIGRATION_LOAD_REPLAY_RELEASE_GAPS),
  V6_MIGRATION_LOAD_REPLAY_REHEARSAL_VERSION,
  assertV6MigrationLoadReplayRehearsalSafe,
  buildV6MigrationLoadReplayRehearsalReport
};
