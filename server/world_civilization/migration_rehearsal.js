const V6_MIGRATION_REHEARSAL_VERSION = 'agent-town.v6.migration_rehearsal.v1';
const CURRENT_MIGRATION_VERSION = 'v1';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildMissingReport(errors = []) {
  return {
    version: V6_MIGRATION_REHEARSAL_VERSION,
    status: 'research_only',
    ok: false,
    errors,
    currentMigrationVersion: CURRENT_MIGRATION_VERSION,
    targetMigrationVersion: '',
    direction: 'unknown',
    migrationScriptsAvailable: false,
    storeReports: [],
    releaseGaps: [
      'release_grade_upgrade_scripts_required',
      'release_grade_downgrade_scripts_required',
      'backup_restore_rehearsal_required'
    ],
    appliesWorldState: false,
    executionStatus: 'not_executable',
    releaseReady: false
  };
}

function normalizeTarget(targetMigrationVersion = CURRENT_MIGRATION_VERSION) {
  return String(targetMigrationVersion || '').trim();
}

function directionFor(targetMigrationVersion) {
  if (targetMigrationVersion === CURRENT_MIGRATION_VERSION) return 'same_version_inventory';
  if (/^v\d+$/.test(targetMigrationVersion) && Number(targetMigrationVersion.slice(1)) > 1) return 'unsupported_upgrade';
  return 'unsupported_downgrade';
}

function inspectStoreForMigration(requirement = {}, store = {}) {
  const metadata = typeof store?.getSchemaMetadata === 'function' ? store.getSchemaMetadata() : null;
  const migrationVersion = typeof store?.migrationVersion === 'string' ? store.migrationVersion : '';
  const expectedMigrationVersion = String(requirement.migrationVersion || CURRENT_MIGRATION_VERSION);
  const metadataOk = Boolean(metadata)
    && metadata.storeKey === requirement.key
    && metadata.migrationVersion === expectedMigrationVersion
    && metadata.schemaUserVersion === 1
    && metadata.releaseStatus === 'research_only';
  return {
    key: requirement.key,
    modulePath: requirement.modulePath,
    migrationVersion,
    expectedMigrationVersion,
    schemaMetadata: metadata ? clone(metadata) : null,
    metadataOk,
    upgradeScript: '',
    downgradeScript: '',
    ok: migrationVersion === expectedMigrationVersion && metadataOk
  };
}

function buildV6MigrationRehearsalReport({
  stores = {},
  storeRequirements = [],
  targetMigrationVersion = CURRENT_MIGRATION_VERSION
} = {}) {
  if (!Array.isArray(storeRequirements) || storeRequirements.length === 0) {
    return buildMissingReport(['V6_MIGRATION_REHEARSAL_STORE_REQUIREMENTS_REQUIRED']);
  }

  const target = normalizeTarget(targetMigrationVersion);
  const direction = directionFor(target);
  const errors = [];
  if (target !== CURRENT_MIGRATION_VERSION) {
    errors.push(`V6_MIGRATION_REHEARSAL_UNSUPPORTED_TARGET:${target || 'missing'}`);
  }

  const storeReports = storeRequirements.map((requirement) => {
    const report = inspectStoreForMigration(requirement, stores[requirement.key]);
    if (!report.ok) errors.push(`V6_MIGRATION_REHEARSAL_STORE_INVALID:${requirement.key}`);
    return report;
  });

  return {
    version: V6_MIGRATION_REHEARSAL_VERSION,
    status: 'research_only',
    ok: errors.length === 0,
    errors,
    currentMigrationVersion: CURRENT_MIGRATION_VERSION,
    targetMigrationVersion: target,
    direction,
    migrationScriptsAvailable: false,
    storeReports,
    releaseGaps: [
      'release_grade_upgrade_scripts_required',
      'release_grade_downgrade_scripts_required',
      'backup_restore_rehearsal_required'
    ],
    appliesWorldState: false,
    executionStatus: 'not_executable',
    releaseReady: false
  };
}

function assertV6MigrationRehearsalSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_MIGRATION_REHEARSAL_VERSION) {
    errors.push('V6_MIGRATION_REHEARSAL_VERSION_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_MIGRATION_REHEARSAL_RESEARCH_ONLY_REQUIRED');
  }
  if (report.appliesWorldState !== false) {
    errors.push('V6_MIGRATION_REHEARSAL_APPLIES_STATE_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_MIGRATION_REHEARSAL_NON_EXECUTING_REQUIRED');
  }
  if (report.releaseReady !== false) {
    errors.push('V6_MIGRATION_REHEARSAL_RELEASE_READY_FORBIDDEN');
  }
  if (report.migrationScriptsAvailable !== false) {
    errors.push('V6_MIGRATION_REHEARSAL_SCRIPT_AVAILABILITY_FORBIDDEN');
  }
  if (report.ok !== true || (Array.isArray(report.errors) && report.errors.length > 0)) {
    errors.push('V6_MIGRATION_REHEARSAL_ERRORS_PRESENT');
  }
  for (const storeReport of Array.isArray(report.storeReports) ? report.storeReports : []) {
    if (storeReport.ok !== true) errors.push(`V6_MIGRATION_REHEARSAL_STORE_INVALID:${storeReport.key}`);
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  CURRENT_MIGRATION_VERSION,
  V6_MIGRATION_REHEARSAL_VERSION,
  assertV6MigrationRehearsalSafe,
  buildV6MigrationRehearsalReport
};
