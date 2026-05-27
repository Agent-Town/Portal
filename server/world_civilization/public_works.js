const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const { createCivicAuditLedger, sha256, stableJson } = require('./audit_ledger');
const { validatePublicWorksContribution, validatePublicWorksProject } = require('./schemas');
const {
  ensureCivicSqliteSchemaMetadata,
  readCivicSqliteSchemaMetadata
} = require('./sqlite_schema');

const RESOURCE_KEYS = ['wood', 'stone', 'food', 'coin'];
const PROJECT_STATUS_RECORDED = 'recorded';
const CONTRIBUTION_STATUS_RECORDED = 'recorded';
const MIGRATION_VERSION = 'v1';
const STORE_KEY = 'public_works';

const DEFAULT_PUBLIC_WORKS_PROJECTS = [
  {
    projectId: 'publicworks_great_ridge_bridge_001',
    institutionScopeTargetId: 'district_great_ridge',
    goalBundle: { wood: 24, stone: 12, food: 0, coin: 30 },
    perContributionCap: { wood: 2, stone: 1, food: 0, coin: 5 },
    perContributorCap: { wood: 6, stone: 3, food: 0, coin: 15 },
    cosmeticRewardsOnly: true
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeCount(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}

function normalizeBundle(bundle = {}) {
  return Object.fromEntries(RESOURCE_KEYS.map((key) => [key, normalizeCount(bundle?.[key])]));
}

function addBundles(...bundles) {
  const total = normalizeBundle();
  for (const bundle of bundles) {
    const normalized = normalizeBundle(bundle);
    for (const key of RESOURCE_KEYS) total[key] += normalized[key];
  }
  return total;
}

function subtractBundle(left = {}, right = {}) {
  const a = normalizeBundle(left);
  const b = normalizeBundle(right);
  return Object.fromEntries(RESOURCE_KEYS.map((key) => [key, Math.max(0, a[key] - b[key])]));
}

function minBundle(...bundles) {
  return Object.fromEntries(RESOURCE_KEYS.map((key) => [key, Math.min(...bundles.map((bundle) => normalizeCount(bundle?.[key])))]));
}

function bundleHasValue(bundle = {}) {
  return RESOURCE_KEYS.some((key) => normalizeCount(bundle?.[key]) > 0);
}

function parseContributionRow(row) {
  if (!row) return null;
  return {
    contributionId: row.contribution_id,
    institutionId: row.institution_id,
    projectId: row.project_id,
    contributorAccountId: row.contributor_account_id,
    sourceRef: row.source_ref,
    idempotencyKey: row.idempotency_key,
    status: row.status,
    requestedBundle: JSON.parse(row.requested_bundle_json),
    acceptedBundle: JSON.parse(row.accepted_bundle_json),
    cappedBundle: JSON.parse(row.capped_bundle_json),
    auditEntryId: row.audit_entry_id,
    createdAtMs: Number(row.created_at),
    contribution: JSON.parse(row.contribution_json)
  };
}

function parseProjectRow(row) {
  if (!row) return null;
  return {
    projectId: row.project_id,
    institutionId: row.institution_id,
    institutionScopeTargetId: row.institution_scope_target_id,
    proposalId: row.proposal_id,
    requestedByAccountId: row.requested_by_account_id,
    approvalReceiptId: row.approval_receipt_id,
    idempotencyKey: row.idempotency_key,
    status: row.status,
    goalBundle: JSON.parse(row.goal_bundle_json),
    perContributionCap: JSON.parse(row.per_contribution_cap_json),
    perContributorCap: JSON.parse(row.per_contributor_cap_json),
    cosmeticRewardsOnly: row.cosmetic_rewards_only === 1,
    auditEntryId: row.audit_entry_id,
    createdAtMs: Number(row.created_at),
    project: JSON.parse(row.project_json)
  };
}

function ensureSchema(db) {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS world_civic_public_work_contributions (
      contribution_id TEXT PRIMARY KEY,
      institution_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      contributor_account_id TEXT NOT NULL,
      source_ref TEXT NOT NULL,
      idempotency_key TEXT NOT NULL,
      status TEXT NOT NULL,
      accepted_wood INTEGER NOT NULL,
      accepted_stone INTEGER NOT NULL,
      accepted_food INTEGER NOT NULL,
      accepted_coin INTEGER NOT NULL,
      audit_entry_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      requested_bundle_json TEXT NOT NULL,
      accepted_bundle_json TEXT NOT NULL,
      capped_bundle_json TEXT NOT NULL,
      contribution_json TEXT NOT NULL,
      UNIQUE(project_id, contributor_account_id, idempotency_key)
    );
    CREATE INDEX IF NOT EXISTS idx_world_civic_public_works_project_status
      ON world_civic_public_work_contributions(project_id, status, created_at);
    CREATE INDEX IF NOT EXISTS idx_world_civic_public_works_institution
      ON world_civic_public_work_contributions(institution_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_world_civic_public_works_contributor
      ON world_civic_public_work_contributions(contributor_account_id, created_at);
    CREATE TABLE IF NOT EXISTS world_civic_public_work_projects (
      project_id TEXT PRIMARY KEY,
      institution_id TEXT NOT NULL,
      institution_scope_target_id TEXT NOT NULL,
      proposal_id TEXT NOT NULL,
      requested_by_account_id TEXT NOT NULL,
      approval_receipt_id TEXT NOT NULL,
      idempotency_key TEXT NOT NULL,
      status TEXT NOT NULL,
      cosmetic_rewards_only INTEGER NOT NULL,
      audit_entry_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      goal_bundle_json TEXT NOT NULL,
      per_contribution_cap_json TEXT NOT NULL,
      per_contributor_cap_json TEXT NOT NULL,
      project_json TEXT NOT NULL,
      UNIQUE(institution_id, idempotency_key)
    );
    CREATE INDEX IF NOT EXISTS idx_world_civic_public_work_projects_institution
      ON world_civic_public_work_projects(institution_id, status, created_at);
    CREATE INDEX IF NOT EXISTS idx_world_civic_public_work_projects_scope
      ON world_civic_public_work_projects(institution_scope_target_id, status, created_at);
    CREATE INDEX IF NOT EXISTS idx_world_civic_public_work_projects_proposal
      ON world_civic_public_work_projects(proposal_id, created_at);
  `);
  return ensureCivicSqliteSchemaMetadata(db, {
    storeKey: STORE_KEY,
    migrationVersion: MIGRATION_VERSION,
    modulePath: 'server/world_civilization/public_works.js'
  });
}

function buildStatements(db) {
  return {
    byProjectId: db.prepare(`
      SELECT *
      FROM world_civic_public_work_projects
      WHERE project_id = ?
      LIMIT 1
    `),
    byInstitutionProjectIdempotency: db.prepare(`
      SELECT *
      FROM world_civic_public_work_projects
      WHERE institution_id = ? AND idempotency_key = ?
      LIMIT 1
    `),
    insertProject: db.prepare(`
      INSERT INTO world_civic_public_work_projects (
        project_id, institution_id, institution_scope_target_id, proposal_id,
        requested_by_account_id, approval_receipt_id, idempotency_key, status,
        cosmetic_rewards_only, audit_entry_id, created_at, goal_bundle_json,
        per_contribution_cap_json, per_contributor_cap_json, project_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    listProjects: db.prepare(`
      SELECT *
      FROM world_civic_public_work_projects
      WHERE (? = '' OR institution_id = ?)
        AND (? = '' OR institution_scope_target_id = ?)
        AND (? = '' OR status = ?)
      ORDER BY created_at ASC, project_id ASC
      LIMIT ?
    `),
    byContributionId: db.prepare(`
      SELECT *
      FROM world_civic_public_work_contributions
      WHERE contribution_id = ?
      LIMIT 1
    `),
    byContributorIdempotency: db.prepare(`
      SELECT *
      FROM world_civic_public_work_contributions
      WHERE project_id = ? AND contributor_account_id = ? AND idempotency_key = ?
      LIMIT 1
    `),
    insert: db.prepare(`
      INSERT INTO world_civic_public_work_contributions (
        contribution_id, institution_id, project_id, contributor_account_id,
        source_ref, idempotency_key, status, accepted_wood, accepted_stone,
        accepted_food, accepted_coin, audit_entry_id, created_at,
        requested_bundle_json, accepted_bundle_json, capped_bundle_json,
        contribution_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    list: db.prepare(`
      SELECT *
      FROM world_civic_public_work_contributions
      WHERE (? = '' OR institution_id = ?)
        AND (? = '' OR project_id = ?)
        AND (? = '' OR contributor_account_id = ?)
        AND (? = '' OR status = ?)
      ORDER BY created_at ASC, contribution_id ASC
      LIMIT ?
    `),
    projectTotals: db.prepare(`
      SELECT
        COALESCE(SUM(accepted_wood), 0) AS wood,
        COALESCE(SUM(accepted_stone), 0) AS stone,
        COALESCE(SUM(accepted_food), 0) AS food,
        COALESCE(SUM(accepted_coin), 0) AS coin
      FROM world_civic_public_work_contributions
      WHERE project_id = ?
    `),
    contributorProjectTotals: db.prepare(`
      SELECT
        COALESCE(SUM(accepted_wood), 0) AS wood,
        COALESCE(SUM(accepted_stone), 0) AS stone,
        COALESCE(SUM(accepted_food), 0) AS food,
        COALESCE(SUM(accepted_coin), 0) AS coin
      FROM world_civic_public_work_contributions
      WHERE project_id = ? AND contributor_account_id = ?
    `),
    count: db.prepare('SELECT COUNT(1) AS count FROM world_civic_public_work_contributions'),
    projectCount: db.prepare('SELECT COUNT(1) AS count FROM world_civic_public_work_projects')
  };
}

function bundleFromTotals(row) {
  return normalizeBundle({
    wood: row?.wood,
    stone: row?.stone,
    food: row?.food,
    coin: row?.coin
  });
}

function createContributionAuditEntry({ contribution, acceptedBundle, cappedBundle, projectTotalBefore, projectTotalAfter, nowMs }) {
  return {
    schemaVersion: contribution.schemaVersion,
    entryId: `audit_${contribution.contributionId.replace(/^contribution_/, 'contribution_')}`,
    actor: {
      kind: 'human',
      accountId: contribution.contributorAccountId
    },
    actionType: 'public_works.contribution.recorded',
    objectRef: contribution.contributionId,
    idempotencyKey: contribution.idempotencyKey,
    beforeHash: sha256(stableJson({ projectId: contribution.projectId, total: projectTotalBefore })),
    afterHash: sha256(stableJson({ contribution, acceptedBundle, cappedBundle, projectTotalAfter })),
    createdAtMs: nowMs,
    migrationVersion: MIGRATION_VERSION,
    replayable: true,
    rollbackId: '',
    privacy: {
      redacted: true,
      privateDataIncluded: false,
      dataClasses: ['public_audit_summary']
    }
  };
}

function matchingVoteForReceipt(voteStore, proposalId, receiptId) {
  if (!voteStore || typeof voteStore.listVotes !== 'function') return null;
  return voteStore
    .listVotes({ proposalId, limit: 500 })
    .find((vote) => vote.receiptId === receiptId && vote.choice === 'approve') || null;
}

function approvedModerationForProposal(moderationStore, proposal) {
  if (!moderationStore || typeof moderationStore.listDecisions !== 'function') return null;
  return moderationStore
    .listDecisions({
      subjectRef: proposal.proposalId,
      surface: proposal.proposal.moderationClass,
      status: 'approved',
      limit: 1
    })[0] || null;
}

function createProjectAuditEntry({ project, institution, actor, nowMs }) {
  return {
    schemaVersion: project.schemaVersion,
    entryId: `audit_${project.projectId.replace(/^publicworks_/, 'publicworks_')}`,
    actor,
    actionType: 'public_works.project.recorded',
    objectRef: project.projectId,
    idempotencyKey: project.idempotencyKey,
    beforeHash: sha256(stableJson({
      projectId: project.projectId,
      institutionId: institution.institutionId,
      status: 'absent'
    })),
    afterHash: sha256(stableJson({
      project,
      status: PROJECT_STATUS_RECORDED,
      institutionScopeTargetId: institution.scopeTargetId
    })),
    createdAtMs: nowMs,
    migrationVersion: MIGRATION_VERSION,
    replayable: true,
    rollbackId: '',
    privacy: {
      redacted: true,
      privateDataIncluded: false,
      dataClasses: ['public_audit_summary']
    }
  };
}

function normalizedProjects(projects = DEFAULT_PUBLIC_WORKS_PROJECTS) {
  return new Map(projects.map((project) => [
    project.projectId,
    {
      ...clone(project),
      goalBundle: normalizeBundle(project.goalBundle),
      perContributionCap: normalizeBundle(project.perContributionCap),
      perContributorCap: normalizeBundle(project.perContributorCap)
    }
  ]));
}

function createCivicPublicWorksStore({
  sqlitePath,
  institutionStore,
  auditLedger = null,
  auditSqlitePath = '',
  proposalStore = null,
  voteStore = null,
  moderationStore = null,
  projects = DEFAULT_PUBLIC_WORKS_PROJECTS
}) {
  if (!sqlitePath || typeof sqlitePath !== 'string') {
    throw new Error('CIVIC_PUBLIC_WORKS_SQLITE_PATH_REQUIRED');
  }
  if (!institutionStore || typeof institutionStore.getInstitution !== 'function') {
    throw new Error('CIVIC_PUBLIC_WORKS_INSTITUTION_STORE_REQUIRED');
  }
  fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
  const db = new DatabaseSync(sqlitePath);
  let schemaMetadata;
  try {
    schemaMetadata = ensureSchema(db);
  } catch (err) {
    db.close();
    throw err;
  }
  const statements = buildStatements(db);
  const projectMap = normalizedProjects(projects);
  const ownsLedger = !auditLedger;
  const ledger = auditLedger || createCivicAuditLedger({ sqlitePath: auditSqlitePath || sqlitePath });
  let closed = false;

  function getRecordedProject(projectId = '') {
    return parseProjectRow(statements.byProjectId.get(String(projectId || '')));
  }

  function getProject(projectId = '') {
    const recorded = getRecordedProject(projectId);
    if (recorded) {
      return {
        ...recorded,
        source: 'recorded'
      };
    }
    const staticProject = projectMap.get(String(projectId || '')) || null;
    return staticProject ? { ...clone(staticProject), source: 'static' } : null;
  }

  function validateProjectPrerequisites({ project, institution, proposal, nowMs }) {
    if (!proposalStore || typeof proposalStore.getProposal !== 'function') {
      throw new Error('CIVIC_PUBLIC_WORKS_PROJECT_PROPOSAL_STORE_REQUIRED');
    }
    if (!voteStore || typeof voteStore.summarizeProposalVotes !== 'function') {
      throw new Error('CIVIC_PUBLIC_WORKS_PROJECT_VOTE_STORE_REQUIRED');
    }
    if (!moderationStore || typeof moderationStore.listDecisions !== 'function') {
      throw new Error('CIVIC_PUBLIC_WORKS_PROJECT_MODERATION_STORE_REQUIRED');
    }
    if (!institution) {
      const err = new Error('CIVIC_PUBLIC_WORKS_PROJECT_INSTITUTION_REQUIRED');
      err.details = { institutionId: project.institutionId };
      throw err;
    }
    if (institution.scopeKind !== 'public_works') {
      const err = new Error('CIVIC_PUBLIC_WORKS_PROJECT_INSTITUTION_SCOPE_REQUIRED');
      err.details = { institutionId: project.institutionId, scopeKind: institution.scopeKind };
      throw err;
    }
    if (!proposal) {
      const err = new Error('CIVIC_PUBLIC_WORKS_PROJECT_PROPOSAL_REQUIRED');
      err.details = { proposalId: project.proposalId };
      throw err;
    }
    if (proposal.expiresAtMs <= nowMs) {
      const err = new Error('CIVIC_PUBLIC_WORKS_PROJECT_PROPOSAL_EXPIRED');
      err.details = { proposalId: project.proposalId, expiresAtMs: proposal.expiresAtMs, nowMs };
      throw err;
    }
    if (proposal.scopeKind !== 'public_works' || proposal.scopeTargetId !== institution.scopeTargetId) {
      const err = new Error('CIVIC_PUBLIC_WORKS_PROJECT_PROPOSAL_SCOPE_REQUIRED');
      err.details = {
        proposalId: project.proposalId,
        expectedScopeKind: 'public_works',
        expectedScopeTargetId: institution.scopeTargetId,
        receivedScopeKind: proposal.scopeKind,
        receivedScopeTargetId: proposal.scopeTargetId
      };
      throw err;
    }
    if (proposal.proposal.effectPreview.effectType !== 'public_works_accounting') {
      const err = new Error('CIVIC_PUBLIC_WORKS_PROJECT_EFFECT_REQUIRED');
      err.details = { proposalId: project.proposalId, effectType: proposal.proposal.effectPreview.effectType };
      throw err;
    }
    if (!proposal.proposal.affectedPublicState.includes(`public_works:${project.projectId}`)) {
      const err = new Error('CIVIC_PUBLIC_WORKS_PROJECT_AFFECTED_STATE_REQUIRED');
      err.details = { proposalId: project.proposalId, projectId: project.projectId };
      throw err;
    }
    const moderation = approvedModerationForProposal(moderationStore, proposal);
    if (!moderation) {
      const err = new Error('CIVIC_PUBLIC_WORKS_PROJECT_MODERATION_REQUIRED');
      err.details = { proposalId: project.proposalId };
      throw err;
    }
    const voteSummary = voteStore.summarizeProposalVotes(project.proposalId);
    if (!voteSummary || voteSummary.counts.approve <= voteSummary.counts.reject || voteSummary.counts.approve < 1) {
      const err = new Error('CIVIC_PUBLIC_WORKS_PROJECT_APPROVAL_REQUIRED');
      err.details = { proposalId: project.proposalId, counts: voteSummary?.counts || null };
      throw err;
    }
    const approvingVote = matchingVoteForReceipt(voteStore, project.proposalId, project.approvalReceiptId);
    if (!approvingVote) {
      const err = new Error('CIVIC_PUBLIC_WORKS_PROJECT_APPROVAL_RECEIPT_REQUIRED');
      err.details = { proposalId: project.proposalId, receiptId: project.approvalReceiptId };
      throw err;
    }
    return { approvingVote, moderation };
  }

  function recordProject(rawProject = {}, { nowMs = Date.now() } = {}) {
    const validation = validatePublicWorksProject(rawProject);
    if (!validation.ok) {
      const err = new Error('CIVIC_PUBLIC_WORKS_PROJECT_INVALID');
      err.details = { errors: validation.errors };
      throw err;
    }
    const project = validation.value;
    const normalizedJson = stableJson(project);
    const existingByIdempotency = parseProjectRow(
      statements.byInstitutionProjectIdempotency.get(project.institutionId, project.idempotencyKey)
    );
    if (existingByIdempotency) {
      if (stableJson(existingByIdempotency.project) !== normalizedJson) {
        const err = new Error('CIVIC_PUBLIC_WORKS_PROJECT_IDEMPOTENCY_CONFLICT');
        err.details = {
          institutionId: project.institutionId,
          idempotencyKey: project.idempotencyKey,
          existingProjectId: existingByIdempotency.projectId
        };
        throw err;
      }
      return { ...existingByIdempotency, duplicate: true };
    }
    const existingById = getRecordedProject(project.projectId);
    if (existingById || projectMap.has(project.projectId)) {
      const err = new Error('CIVIC_PUBLIC_WORKS_PROJECT_ID_CONFLICT');
      err.details = { projectId: project.projectId };
      throw err;
    }

    const institution = institutionStore.getInstitution(project.institutionId);
    const proposal = proposalStore?.getProposal?.(project.proposalId) || null;
    const { approvingVote } = validateProjectPrerequisites({
      project,
      institution,
      proposal,
      nowMs
    });
    const auditRow = ledger.append(createProjectAuditEntry({
      project,
      institution,
      actor: approvingVote.vote.voter,
      nowMs
    }));
    statements.insertProject.run(
      project.projectId,
      project.institutionId,
      institution.scopeTargetId,
      project.proposalId,
      project.requestedBy.accountId,
      project.approvalReceiptId,
      project.idempotencyKey,
      PROJECT_STATUS_RECORDED,
      project.cosmeticRewardsOnly ? 1 : 0,
      auditRow.entry.entryId,
      nowMs,
      stableJson(project.goalBundle),
      stableJson(project.perContributionCap),
      stableJson(project.perContributorCap),
      normalizedJson
    );
    return getRecordedProject(project.projectId);
  }

  function listProjects({ institutionId = '', institutionScopeTargetId = '', status = '', limit = 100 } = {}) {
    const safeLimit = Number.isInteger(Number(limit)) ? Math.max(1, Math.min(500, Number(limit))) : 100;
    return statements.listProjects.all(
      String(institutionId || ''),
      String(institutionId || ''),
      String(institutionScopeTargetId || ''),
      String(institutionScopeTargetId || ''),
      String(status || ''),
      String(status || ''),
      safeLimit
    ).map(parseProjectRow);
  }

  function recordContribution(rawContribution = {}, { nowMs = Date.now() } = {}) {
    const validation = validatePublicWorksContribution(rawContribution);
    if (!validation.ok) {
      const err = new Error('CIVIC_PUBLIC_WORKS_CONTRIBUTION_INVALID');
      err.details = { errors: validation.errors };
      throw err;
    }
    const contribution = validation.value;
    const normalizedJson = stableJson(contribution);
    const institution = institutionStore.getInstitution(contribution.institutionId);
    if (!institution) {
      const err = new Error('CIVIC_PUBLIC_WORKS_INSTITUTION_REQUIRED');
      err.details = { institutionId: contribution.institutionId };
      throw err;
    }
    if (institution.scopeKind !== 'public_works') {
      const err = new Error('CIVIC_PUBLIC_WORKS_INSTITUTION_SCOPE_REQUIRED');
      err.details = { institutionId: contribution.institutionId, scopeKind: institution.scopeKind };
      throw err;
    }
    const project = getProject(contribution.projectId);
    if (!project) {
      const err = new Error('CIVIC_PUBLIC_WORKS_PROJECT_REQUIRED');
      err.details = { projectId: contribution.projectId };
      throw err;
    }
    if (project.institutionId && project.institutionId !== contribution.institutionId) {
      const err = new Error('CIVIC_PUBLIC_WORKS_PROJECT_INSTITUTION_MISMATCH');
      err.details = {
        projectId: contribution.projectId,
        expected: project.institutionId,
        received: contribution.institutionId
      };
      throw err;
    }
    if (project.institutionScopeTargetId && project.institutionScopeTargetId !== institution.scopeTargetId) {
      const err = new Error('CIVIC_PUBLIC_WORKS_PROJECT_SCOPE_MISMATCH');
      err.details = {
        projectId: contribution.projectId,
        expected: project.institutionScopeTargetId,
        received: institution.scopeTargetId
      };
      throw err;
    }

    const existingById = parseContributionRow(statements.byContributionId.get(contribution.contributionId));
    if (existingById) {
      if (stableJson(existingById.contribution) !== normalizedJson) {
        const err = new Error('CIVIC_PUBLIC_WORKS_CONTRIBUTION_ID_CONFLICT');
        err.details = { contributionId: contribution.contributionId };
        throw err;
      }
      return { ...existingById, duplicate: true };
    }
    const existingByKey = parseContributionRow(statements.byContributorIdempotency.get(
      contribution.projectId,
      contribution.contributorAccountId,
      contribution.idempotencyKey
    ));
    if (existingByKey) {
      if (stableJson(existingByKey.contribution) !== normalizedJson) {
        const err = new Error('CIVIC_PUBLIC_WORKS_IDEMPOTENCY_CONFLICT');
        err.details = {
          projectId: contribution.projectId,
          contributorAccountId: contribution.contributorAccountId,
          idempotencyKey: contribution.idempotencyKey,
          existingContributionId: existingByKey.contributionId
        };
        throw err;
      }
      return { ...existingByKey, duplicate: true };
    }

    const projectTotalBefore = bundleFromTotals(statements.projectTotals.get(contribution.projectId));
    const contributorTotalBefore = bundleFromTotals(
      statements.contributorProjectTotals.get(contribution.projectId, contribution.contributorAccountId)
    );
    const projectRemaining = subtractBundle(project.goalBundle, projectTotalBefore);
    const contributorRemaining = subtractBundle(project.perContributorCap, contributorTotalBefore);
    const acceptedBundle = minBundle(
      contribution.requestedBundle,
      project.perContributionCap,
      contributorRemaining,
      projectRemaining
    );
    const cappedBundle = subtractBundle(contribution.requestedBundle, acceptedBundle);
    if (!bundleHasValue(acceptedBundle)) {
      const err = new Error('CIVIC_PUBLIC_WORKS_CAP_EXCEEDED');
      err.details = {
        projectId: contribution.projectId,
        requestedBundle: contribution.requestedBundle,
        projectRemaining,
        contributorRemaining
      };
      throw err;
    }
    const projectTotalAfter = addBundles(projectTotalBefore, acceptedBundle);
    const auditRow = ledger.append(createContributionAuditEntry({
      contribution,
      acceptedBundle,
      cappedBundle,
      projectTotalBefore,
      projectTotalAfter,
      nowMs
    }));
    statements.insert.run(
      contribution.contributionId,
      contribution.institutionId,
      contribution.projectId,
      contribution.contributorAccountId,
      contribution.sourceRef,
      contribution.idempotencyKey,
      CONTRIBUTION_STATUS_RECORDED,
      acceptedBundle.wood,
      acceptedBundle.stone,
      acceptedBundle.food,
      acceptedBundle.coin,
      auditRow.entry.entryId,
      nowMs,
      stableJson(contribution.requestedBundle),
      stableJson(acceptedBundle),
      stableJson(cappedBundle),
      normalizedJson
    );
    return parseContributionRow(statements.byContributionId.get(contribution.contributionId));
  }

  function getContribution(contributionId = '') {
    return parseContributionRow(statements.byContributionId.get(String(contributionId || '')));
  }

  function listContributions({
    institutionId = '',
    projectId = '',
    contributorAccountId = '',
    status = '',
    limit = 100
  } = {}) {
    const safeLimit = Number.isInteger(Number(limit)) ? Math.max(1, Math.min(500, Number(limit))) : 100;
    return statements.list.all(
      String(institutionId || ''),
      String(institutionId || ''),
      String(projectId || ''),
      String(projectId || ''),
      String(contributorAccountId || ''),
      String(contributorAccountId || ''),
      String(status || ''),
      String(status || ''),
      safeLimit
    ).map(parseContributionRow);
  }

  function summarizeProject(projectId = '') {
    const project = getProject(projectId);
    const contributions = listContributions({ projectId, limit: 500 });
    const totalAccepted = bundleFromTotals(statements.projectTotals.get(String(projectId || '')));
    const totalRequested = contributions.reduce((total, entry) => addBundles(total, entry.requestedBundle), normalizeBundle());
    const cappedLoss = contributions.reduce((total, entry) => addBundles(total, entry.cappedBundle), normalizeBundle());
    const goalBundle = normalizeBundle(project?.goalBundle || {});
    const acceptedUnits = RESOURCE_KEYS.reduce((sum, key) => sum + Math.min(totalAccepted[key], goalBundle[key]), 0);
    const goalUnits = RESOURCE_KEYS.reduce((sum, key) => sum + goalBundle[key], 0);
    return {
      projectId: String(projectId || ''),
      contributionCount: contributions.length,
      contributorCount: new Set(contributions.map((entry) => entry.contributorAccountId)).size,
      goalBundle,
      totalRequested,
      totalAccepted,
      cappedLoss,
      progress: {
        units: acceptedUnits,
        goalUnits,
        percent: goalUnits > 0 ? Math.min(100, Math.round((acceptedUnits / goalUnits) * 100)) : 100
      },
      projectSource: project?.source || 'unknown',
      projectStatus: project?.status || (project ? PROJECT_STATUS_RECORDED : 'missing'),
      resourceConservationStatus: 'accepted_inputs_equal_public_progress',
      mutatesPrivateTown: false,
      cosmeticRewardsOnly: project?.cosmeticRewardsOnly !== false,
      executionStatus: 'not_executable'
    };
  }

  function count() {
    return Number(statements.count.get().count || 0);
  }

  function projectCount() {
    return Number(statements.projectCount.get().count || 0);
  }

  function getSchemaMetadata() {
    return readCivicSqliteSchemaMetadata(db, STORE_KEY);
  }

  function close() {
    if (closed) return;
    closed = true;
    if (ownsLedger && ledger?.close) ledger.close();
    db.close();
  }

  return {
    close,
    count,
    getContribution,
    getProject,
    getSchemaMetadata,
    listContributions,
    listProjects,
    migrationVersion: schemaMetadata.migrationVersion,
    projectCount,
    recordContribution,
    recordProject,
    sqlitePath,
    summarizeProject
  };
}

module.exports = {
  CONTRIBUTION_STATUS_RECORDED,
  DEFAULT_PUBLIC_WORKS_PROJECTS,
  PROJECT_STATUS_RECORDED,
  createCivicPublicWorksStore
};
