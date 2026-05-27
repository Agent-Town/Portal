const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const { readCivicSqliteSchemaMetadata } = require('./sqlite_schema');

const V6_BACKUP_RESTORE_REHEARSAL_VERSION = 'agent-town.v6.backup_restore_rehearsal.v1';
const REQUIRED_BACKUP_RESTORE_RELEASE_GAPS = [
  'release_grade_backup_runbook_required',
  'encrypted_backup_storage_required',
  'point_in_time_restore_drill_required',
  'live_wal_checkpoint_strategy_required',
  'restore_slo_targets_required'
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sha256File(filePath = '') {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return `sha256:${hash.digest('hex')}`;
}

function companionFiles(sqlitePath = '') {
  return [sqlitePath, `${sqlitePath}-wal`, `${sqlitePath}-shm`].filter((filePath) => fs.existsSync(filePath));
}

function normalizeStoreKey(value = '') {
  const key = String(value || '').trim();
  return /^[a-z0-9_]+$/.test(key) ? key : '';
}

function backupFileName(storeKey = '', sourceFile = '', sqlitePath = '') {
  const suffix = sourceFile === sqlitePath ? '.sqlite' : sourceFile.slice(sqlitePath.length);
  return `${storeKey}${suffix}`;
}

function readStoreMetadata(sqlitePath = '', storeKey = '') {
  let db = null;
  try {
    db = new DatabaseSync(sqlitePath, { readOnly: true });
    return readCivicSqliteSchemaMetadata(db, storeKey);
  } catch {
    return null;
  } finally {
    if (db) db.close();
  }
}

function copyStoreFiles({ storeKey = '', sqlitePath = '', backupDir = '' } = {}) {
  const copiedFiles = [];
  const sourceFiles = companionFiles(sqlitePath);
  fs.mkdirSync(backupDir, { recursive: true });
  for (const sourceFile of sourceFiles) {
    const restoredPath = path.join(backupDir, backupFileName(storeKey, sourceFile, sqlitePath));
    fs.copyFileSync(sourceFile, restoredPath);
    copiedFiles.push({
      sourceFile,
      restoredPath,
      sourceBytes: fs.statSync(sourceFile).size,
      restoredBytes: fs.statSync(restoredPath).size,
      sourceSha256: sha256File(sourceFile),
      restoredSha256: sha256File(restoredPath)
    });
  }
  return copiedFiles;
}

function inspectStoreBackup({ requirement = {}, sqlitePath = '', backupDir = '' } = {}) {
  const storeKey = normalizeStoreKey(requirement.key);
  if (!storeKey) {
    return {
      key: String(requirement.key || ''),
      modulePath: String(requirement.modulePath || ''),
      sourceExists: false,
      restoredExists: false,
      copiedFileCount: 0,
      copiedFiles: [],
      sourceMetadata: null,
      restoredMetadata: null,
      hashesMatch: false,
      metadataMatches: false,
      reportPayloadIncludesRows: false,
      ok: false
    };
  }
  const sourceExists = Boolean(sqlitePath) && fs.existsSync(sqlitePath);
  const copiedFiles = sourceExists ? copyStoreFiles({ storeKey, sqlitePath, backupDir }) : [];
  const restoredSqlitePath = path.join(backupDir, `${storeKey}.sqlite`);
  const restoredExists = fs.existsSync(restoredSqlitePath);
  const sourceMetadata = sourceExists ? readStoreMetadata(sqlitePath, storeKey) : null;
  const restoredMetadata = restoredExists ? readStoreMetadata(restoredSqlitePath, storeKey) : null;
  const hashesMatch = copiedFiles.length > 0
    && copiedFiles.every((entry) => entry.sourceSha256 === entry.restoredSha256 && entry.sourceBytes === entry.restoredBytes);
  const metadataMatches = Boolean(sourceMetadata && restoredMetadata)
    && JSON.stringify(sourceMetadata) === JSON.stringify(restoredMetadata)
    && restoredMetadata.storeKey === storeKey
    && restoredMetadata.migrationVersion === String(requirement.migrationVersion || 'v1')
    && restoredMetadata.releaseStatus === 'research_only';

  return {
    key: storeKey,
    modulePath: String(requirement.modulePath || ''),
    sourceExists,
    restoredExists,
    copiedFileCount: copiedFiles.length,
    copiedFiles,
    sourceMetadata: sourceMetadata ? clone(sourceMetadata) : null,
    restoredMetadata: restoredMetadata ? clone(restoredMetadata) : null,
    hashesMatch,
    metadataMatches,
    reportPayloadIncludesRows: false,
    ok: sourceExists && restoredExists && hashesMatch && metadataMatches
  };
}

function buildMissingReport(errors = []) {
  return {
    version: V6_BACKUP_RESTORE_REHEARSAL_VERSION,
    status: 'research_only',
    ok: false,
    errors,
    releaseReady: false,
    runtimeExposed: false,
    playerVisible: false,
    appliesWorldState: false,
    exposesPrivateData: false,
    reportPayloadIncludesRows: false,
    executionStatus: 'not_executable',
    backupDir: '',
    storeReports: [],
    releaseGaps: [...REQUIRED_BACKUP_RESTORE_RELEASE_GAPS]
  };
}

function buildV6BackupRestoreRehearsalReport({
  storePaths = {},
  storeRequirements = [],
  backupDir = '',
  source = 'runtime'
} = {}) {
  const errors = [];
  if (!Array.isArray(storeRequirements) || storeRequirements.length === 0) {
    errors.push('V6_BACKUP_RESTORE_STORE_REQUIREMENTS_REQUIRED');
  }
  if (!backupDir || typeof backupDir !== 'string') {
    errors.push('V6_BACKUP_RESTORE_BACKUP_DIR_REQUIRED');
  }
  if (errors.length > 0) return buildMissingReport(errors);

  const storeReports = storeRequirements.map((requirement) => {
    const report = inspectStoreBackup({
      requirement,
      sqlitePath: storePaths[requirement.key],
      backupDir
    });
    if (!report.ok) errors.push(`V6_BACKUP_RESTORE_STORE_INVALID:${requirement.key}`);
    return report;
  });

  return {
    version: V6_BACKUP_RESTORE_REHEARSAL_VERSION,
    status: 'research_only',
    source,
    ok: errors.length === 0,
    errors,
    releaseReady: false,
    runtimeExposed: false,
    playerVisible: false,
    appliesWorldState: false,
    exposesPrivateData: false,
    reportPayloadIncludesRows: false,
    executionStatus: 'not_executable',
    backupDir,
    storeReports,
    releaseGaps: [...REQUIRED_BACKUP_RESTORE_RELEASE_GAPS]
  };
}

function assertV6BackupRestoreRehearsalSafe(report = {}) {
  const errors = [];
  if (report.version !== V6_BACKUP_RESTORE_REHEARSAL_VERSION) {
    errors.push('V6_BACKUP_RESTORE_VERSION_REQUIRED');
  }
  if (report.status !== 'research_only') {
    errors.push('V6_BACKUP_RESTORE_RESEARCH_ONLY_REQUIRED');
  }
  if (report.releaseReady !== false) {
    errors.push('V6_BACKUP_RESTORE_RELEASE_READY_FORBIDDEN');
  }
  if (report.runtimeExposed !== false) {
    errors.push('V6_BACKUP_RESTORE_RUNTIME_HIDDEN_REQUIRED');
  }
  if (report.playerVisible !== false) {
    errors.push('V6_BACKUP_RESTORE_PLAYER_HIDDEN_REQUIRED');
  }
  if (report.appliesWorldState !== false) {
    errors.push('V6_BACKUP_RESTORE_WORLD_APPLICATION_FORBIDDEN');
  }
  if (report.exposesPrivateData !== false || report.reportPayloadIncludesRows !== false) {
    errors.push('V6_BACKUP_RESTORE_PRIVATE_DATA_REPORT_FORBIDDEN');
  }
  if (report.executionStatus !== 'not_executable') {
    errors.push('V6_BACKUP_RESTORE_NON_EXECUTING_REQUIRED');
  }
  if (!Array.isArray(report.releaseGaps) || REQUIRED_BACKUP_RESTORE_RELEASE_GAPS.some((gap) => !report.releaseGaps.includes(gap))) {
    errors.push('V6_BACKUP_RESTORE_RELEASE_GAPS_REQUIRED');
  }
  if (report.ok !== true || (Array.isArray(report.errors) && report.errors.length > 0)) {
    errors.push('V6_BACKUP_RESTORE_ERRORS_PRESENT');
  }
  for (const storeReport of Array.isArray(report.storeReports) ? report.storeReports : []) {
    if (storeReport.ok !== true) errors.push(`V6_BACKUP_RESTORE_STORE_INVALID:${storeReport.key}`);
    if (storeReport.reportPayloadIncludesRows !== false) {
      errors.push(`V6_BACKUP_RESTORE_STORE_ROW_PAYLOAD_FORBIDDEN:${storeReport.key}`);
    }
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

module.exports = {
  REQUIRED_BACKUP_RESTORE_RELEASE_GAPS: clone(REQUIRED_BACKUP_RESTORE_RELEASE_GAPS),
  V6_BACKUP_RESTORE_REHEARSAL_VERSION,
  assertV6BackupRestoreRehearsalSafe,
  buildV6BackupRestoreRehearsalReport
};
