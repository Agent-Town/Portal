const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const {
  DEFAULT_CANDIDATE_ROOT,
  SECRET_LIKE_VALUE_PATTERN,
  validateAssetPromptPlan,
  validateGeneratedPack
} = require('./generated_pack');
const {
  loadGeneratedPackSchemaRegistry,
  validateGeneratedSchema
} = require('./generated_schema');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const CANDIDATE_GENERATION_RUN_VERSION = 'agent-town-candidate-image-generation-run-v1';
const JOB_LOG_SCHEMA_VERSION = 'agent-town-asset-generation-job-log-v1';
const SCHEMA_REGISTRY = loadGeneratedPackSchemaRegistry();
const GENERATOR_ID = 'generated-pack-candidate-generation-preflight-v0.1';
const ALLOWED_AUTH_MODES = new Set(['not_configured', 'operator_managed', 'oauth_user_delegated']);
const DEFAULT_RATE_LIMIT = {
  maxRequestsPerMinute: 2,
  maxConcurrentJobs: 1
};
const HUMAN_REVIEW_CHECKLIST = [
  'candidate_output_only',
  'no_default_player_exposure',
  'no_server_rule_changes',
  'no_account_or_wallet_data',
  'human_signoff_required_before_production'
];
const SECRET_LIKE_KEY_PATTERN = /(api[_-]?key|secret|private[_-]?key|credential|oauth|access[_-]?token|refresh[_-]?token|auth[_-]?token|bearer[_-]?token|id[_-]?token|session[_-]?token|provider[_-]?token|wallet[_-]?secret|seed[_-]?phrase|password|^token$)/i;
const RAW_PROMPT_KEY_PATTERN = /^(rawprompt|normalizedprompt|systemprompt|developerprompt|promptinstructions)$/i;
const RAW_TEXT_PATTERN = /\bignore\s+(all\s+)?(previous|prior|above)\s+instructions\b|\b(system|developer)\s+(prompt|message|instructions)\b|\b(tool|function)\s+call\b|\bexecute\s+(shell|bash|terminal|command|javascript|python)\b|\b(curl|wget)\s+https?:|<\s*script\b|javascript\s*:|\beval\s*\(|\bFunction\s*\(/i;

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function redactedPathSegment(key = '') {
  const segment = String(key || '');
  if (SECRET_LIKE_KEY_PATTERN.test(segment) || SECRET_LIKE_VALUE_PATTERN.test(segment)) return '<secret-like-key>';
  if (RAW_PROMPT_KEY_PATTERN.test(segment) || RAW_TEXT_PATTERN.test(segment)) return '<raw-instruction-key>';
  return segment;
}

function childPath(pathLabel = '$', key = '') {
  return `${pathLabel}.${redactedPathSegment(key)}`;
}

function redactValidationPath(pathLabel = '$') {
  return String(pathLabel || '$')
    .replace(SECRET_LIKE_VALUE_PATTERN, '<secret-like-key>')
    .split('.')
    .map((segment, index) => index === 0 ? segment : redactedPathSegment(segment))
    .join('.');
}

function redactSchemaError(error = {}) {
  const redacted = { ...error, path: redactValidationPath(error.path) };
  if (typeof redacted.actual === 'string' && (SECRET_LIKE_VALUE_PATTERN.test(redacted.actual) || RAW_TEXT_PATTERN.test(redacted.actual))) {
    redacted.actual = '<redacted-value>';
  }
  return redacted;
}

function redactedReportValue(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return value;
  return redactedPathSegment(value);
}

function findSecretLikePaths(value, pathLabel = '$', matches = []) {
  if (typeof value === 'string') {
    if (SECRET_LIKE_VALUE_PATTERN.test(value)) matches.push(pathLabel);
    return matches;
  }
  if (!value || typeof value !== 'object') return matches;
  for (const [key, child] of Object.entries(value)) {
    const nextPath = childPath(pathLabel, key);
    if (SECRET_LIKE_KEY_PATTERN.test(key) || SECRET_LIKE_VALUE_PATTERN.test(key)) matches.push(nextPath);
    findSecretLikePaths(child, nextPath, matches);
  }
  return matches;
}

function findRawPromptInstructionPaths(value, pathLabel = '$', matches = []) {
  if (typeof value === 'string') {
    if (RAW_TEXT_PATTERN.test(value)) matches.push(pathLabel);
    return matches;
  }
  if (!value || typeof value !== 'object') return matches;
  for (const [key, child] of Object.entries(value)) {
    const nextPath = childPath(pathLabel, key);
    if (RAW_PROMPT_KEY_PATTERN.test(key) || RAW_TEXT_PATTERN.test(key)) matches.push(nextPath);
    findRawPromptInstructionPaths(child, nextPath, matches);
  }
  return matches;
}

function candidateGenerationRunHash(run = {}) {
  const copy = clone(run);
  delete copy.runHash;
  return sha256(JSON.stringify(copy));
}

function clampInteger(value, min, max, fallback) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric)) return fallback;
  return Math.max(min, Math.min(max, numeric));
}

function moneyValue(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return Math.floor(numeric * 10_000) / 10_000;
}

function normalizeAuthMode(value) {
  const normalized = String(value || 'not_configured').trim().toLowerCase();
  return ALLOWED_AUTH_MODES.has(normalized) ? normalized : 'not_configured';
}

function normalizeCandidateGenerationConfig(config = {}) {
  const authMode = normalizeAuthMode(config.authMode);
  const estimatedMin = moneyValue(config?.estimatedCostUsd?.min);
  const estimatedMax = Math.max(estimatedMin, moneyValue(config?.estimatedCostUsd?.max));
  return {
    enabled: config.enabled === true,
    productSecurityApprovalGranted: config.productSecurityApprovalGranted === true,
    authModelDocumented: config.authModelDocumented === true,
    authMode,
    costModelDocumented: config.costModelDocumented === true,
    costEstimateAccepted: config.costEstimateAccepted === true,
    userConsentGranted: config.userConsentGranted === true,
    teamConsentGranted: config.teamConsentGranted === true,
    estimatedCostUsd: {
      min: estimatedMin,
      max: estimatedMax
    },
    retryPolicy: {
      maxRetries: clampInteger(config?.retryPolicy?.maxRetries, 0, 3, 0)
    },
    rateLimit: {
      maxRequestsPerMinute: clampInteger(
        config?.rateLimit?.maxRequestsPerMinute,
        1,
        10,
        DEFAULT_RATE_LIMIT.maxRequestsPerMinute
      ),
      maxConcurrentJobs: clampInteger(
        config?.rateLimit?.maxConcurrentJobs,
        1,
        2,
        DEFAULT_RATE_LIMIT.maxConcurrentJobs
      )
    }
  };
}

function isSafeRelativePath(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  if (path.isAbsolute(value)) return false;
  const normalized = path.normalize(value).replace(/\\/g, '/');
  return normalized
    && normalized !== '.'
    && !normalized.startsWith('../')
    && !normalized.includes('/../');
}

function normalizedRelativePath(value = '') {
  const normalized = path.posix.normalize(String(value || '').trim().replace(/\\/g, '/'));
  if (!normalized || normalized === '.') return '';
  return normalized.replace(/^\/+|\/+$/g, '');
}

function repoPathForRelativePath(relativePath) {
  if (!isSafeRelativePath(relativePath)) {
    const error = new Error('INVALID_CANDIDATE_GENERATION_PATH');
    error.details = { relativePath };
    throw error;
  }
  const resolved = path.resolve(REPO_ROOT, relativePath);
  if (!resolved.startsWith(`${REPO_ROOT}${path.sep}`)) {
    const error = new Error('INVALID_CANDIDATE_GENERATION_PATH');
    error.details = { relativePath };
    throw error;
  }
  return resolved;
}

function invalidCandidateGenerationPlanPath(reason, field, value) {
  const error = new Error('INVALID_CANDIDATE_GENERATION_PLAN_PATH');
  error.details = { reason, field, value: redactedReportValue(value) };
  throw error;
}

function isPathInside(root, target) {
  const base = normalizedRelativePath(root);
  const child = normalizedRelativePath(target);
  return Boolean(base && child && (child === base || child.startsWith(`${base}/`)));
}

function requireSafePlanPath(field, value) {
  if (!isSafeRelativePath(value)) {
    invalidCandidateGenerationPlanPath('UNSAFE_RELATIVE_PATH', field, value);
  }
}

function requirePlanPathInside(field, value, root, reason) {
  requireSafePlanPath(field, value);
  if (!isPathInside(root, value)) {
    invalidCandidateGenerationPlanPath(reason, field, value);
  }
}

function validateCandidateGenerationPlanPaths(plan = {}) {
  requireSafePlanPath('$.assetPromptPlan.candidateRoot', plan.candidateRoot);
  const packRoot = `${normalizedRelativePath(plan.candidateRoot)}/${normalizedRelativePath(plan.packId)}`;
  const candidateRoot = `${packRoot}/candidates`;
  const approvedRoot = `${packRoot}/approved`;
  const jobRoot = `${packRoot}/jobs`;
  (plan.targets || []).forEach((target, index) => {
    const targetPath = `$.assetPromptPlan.targets[${index}]`;
    requirePlanPathInside(`${targetPath}.candidateOutputPath`, target.candidateOutputPath, candidateRoot, 'CANDIDATE_OUTPUT_PATH_OUTSIDE_ROOT');
    requirePlanPathInside(`${targetPath}.approvedOutputPath`, target.approvedOutputPath, approvedRoot, 'APPROVED_OUTPUT_PATH_OUTSIDE_ROOT');
    requirePlanPathInside(`${targetPath}.jobLogPath`, target.jobLogPath, jobRoot, 'JOB_LOG_PATH_OUTSIDE_ROOT');
  });
}

function canonicalMappingFingerprint(pack = {}) {
  const mappings = (pack?.gameplayMapping?.canonicalEntities || []).map((mapping) => ({
    canonicalId: mapping.canonicalId,
    mechanicalKey: mapping.mechanicalKey,
    generatedName: mapping.generatedName
  })).sort((a, b) => a.canonicalId.localeCompare(b.canonicalId));
  return sha256(JSON.stringify(mappings));
}

function consentStatus(config) {
  if (config.userConsentGranted && config.teamConsentGranted) return 'granted';
  if (config.userConsentGranted || config.teamConsentGranted) return 'partial';
  return 'required';
}

function costConsentStatus(config) {
  if (config.costModelDocumented && config.costEstimateAccepted) return 'accepted';
  if (config.costModelDocumented) return 'estimate_ready_acceptance_required';
  return 'required';
}

function buildGateProblems({ config, validationReport, promptPlanReport }) {
  const problems = [];
  if (!validationReport.ok) problems.push('generated_pack_validation_failed');
  if (!promptPlanReport.ok) problems.push('asset_prompt_plan_validation_failed');
  if (!config.enabled) problems.push('generation_disabled');
  if (!config.productSecurityApprovalGranted) problems.push('product_security_approval_required');
  if (!config.authModelDocumented || config.authMode === 'not_configured') problems.push('auth_model_required');
  if (!config.costModelDocumented) problems.push('cost_model_required');
  if (!config.costEstimateAccepted) problems.push('cost_consent_required');
  if (!config.userConsentGranted || !config.teamConsentGranted) problems.push('user_team_consent_required');
  return problems;
}

function buildJobRecord({
  assetPromptPlan,
  config,
  createdAtMs,
  errors,
  outputCount,
  pack,
  phase,
  status,
  target
}) {
  return {
    schemaVersion: JOB_LOG_SCHEMA_VERSION,
    phase,
    jobId: `${assetPromptPlan.packId}:${target.promptId}:candidate-preflight-${createdAtMs}`,
    packId: assetPromptPlan.packId,
    promptId: target.promptId,
    promptHash: target.promptHash,
    promptPlanHash: assetPromptPlan.planHash,
    status,
    modelFamily: assetPromptPlan.modelFamily || 'gpt-image-2-candidate',
    authMode: config.authMode,
    costConsentStatus: costConsentStatus(config),
    consentModel: {
      explicitConsentRequiredForGeneration: true,
      status: consentStatus(config),
      userConsentStatus: config.userConsentGranted ? 'granted' : 'required',
      teamConsentStatus: config.teamConsentGranted ? 'granted' : 'required',
      productSecurityApprovalStatus: config.productSecurityApprovalGranted ? 'granted' : 'required'
    },
    costEstimate: {
      status: config.costModelDocumented ? 'documented' : 'required',
      currency: 'USD',
      estimatedMin: config.estimatedCostUsd.min,
      estimatedMax: config.estimatedCostUsd.max,
      accepted: config.costEstimateAccepted
    },
    rateLimit: config.rateLimit,
    sourceProvenance: {
      generator: GENERATOR_ID,
      promptPlanHash: assetPromptPlan.planHash,
      externalModelUsed: false,
      productionAssetApproval: 'not_requested'
    },
    retryPolicy: {
      maxRetries: config.retryPolicy.maxRetries,
      retryRecords: []
    },
    localEvidence: {
      screenshotRequired: true,
      screenshotCaptured: false,
      reviewStatus: 'not_started'
    },
    humanReviewChecklist: HUMAN_REVIEW_CHECKLIST,
    createdAtMs,
    outputCount,
    errors,
    externalImageGenerationUsed: false,
    approvedProductionAssetsCreated: false,
    fallbackStillPlayable: Boolean(pack?.validationReport?.ok),
    generatedImageAssetsCanChangeServerRules: false,
    canonicalMappingFingerprint: canonicalMappingFingerprint(pack),
    canonicalTarget: target.canonicalTarget,
    candidateOutputPath: target.candidateOutputPath,
    approvedOutputPath: target.approvedOutputPath,
    candidateOutputStatus: 'candidate_only'
  };
}

function appendJobRecord(target, record) {
  const jobLogPath = repoPathForRelativePath(target.jobLogPath);
  fs.mkdirSync(path.dirname(jobLogPath), { recursive: true });
  fs.appendFileSync(jobLogPath, `${JSON.stringify(record)}\n`, 'utf8');
}

function sanitizeAdapterResult(result, target) {
  const candidateOutputPath = String(result?.candidateOutputPath || target.candidateOutputPath || '');
  if (!candidateOutputPath || !candidateOutputPath.includes('/candidates/')) {
    return { ok: false, code: 'invalid_candidate_output_path' };
  }
  if (candidateOutputPath !== target.candidateOutputPath) {
    return { ok: false, code: 'unexpected_candidate_output_path' };
  }
  return { ok: true };
}

function validateAssetGenerationJobLogRecord(record = {}, { assetPromptPlan = null } = {}) {
  const schemaReport = SCHEMA_REGISTRY?.assetGenerationJobLog
    ? validateGeneratedSchema(record, SCHEMA_REGISTRY.assetGenerationJobLog, '$.assetGenerationJobLog')
    : { ok: true, errors: [] };
  const secretLikePaths = findSecretLikePaths(record);
  const rawInstructionPaths = findRawPromptInstructionPaths(record);
  const targets = Array.isArray(assetPromptPlan?.targets) ? assetPromptPlan.targets : [];
  const target = targets.find((item) => item.canonicalTarget === record?.canonicalTarget);
  const pathProblems = [];
  if (!isSafeRelativePath(record?.candidateOutputPath) || !String(record?.candidateOutputPath || '').includes('/candidates/')) {
    pathProblems.push('candidateOutputPath');
  }
  if (!isSafeRelativePath(record?.approvedOutputPath) || !String(record?.approvedOutputPath || '').includes('/approved/')) {
    pathProblems.push('approvedOutputPath');
  }
  if (assetPromptPlan && targets.length > 0 && !target) {
    pathProblems.push('canonicalTarget');
  } else if (target) {
    if (record.promptId !== target.promptId) pathProblems.push('promptId');
    if (record.promptHash !== target.promptHash) pathProblems.push('promptHash');
    if (record.promptPlanHash !== assetPromptPlan.planHash) pathProblems.push('promptPlanHash');
    if (record.candidateOutputPath !== target.candidateOutputPath) pathProblems.push('plannedCandidateOutputPath');
    if (record.approvedOutputPath !== target.approvedOutputPath) pathProblems.push('plannedApprovedOutputPath');
  }
  const outputCount = Number(record?.outputCount || 0);
  const statusOutputMatches = record?.status === 'candidate_recorded'
    ? outputCount > 0
    : outputCount === 0;
  const checks = [
    {
      id: 'ASSET_GENERATION_JOB_LOG_SCHEMA_VALID',
      passed: schemaReport.ok === true,
      measured: { schemaErrorCount: schemaReport.errors.length, errors: schemaReport.errors.slice(0, 5).map(redactSchemaError) }
    },
    {
      id: 'ASSET_GENERATION_JOB_LOG_CONTENT_SAFE',
      passed: secretLikePaths.length === 0 && rawInstructionPaths.length === 0,
      measured: { secretLikePaths, rawInstructionPaths }
    },
    {
      id: 'ASSET_GENERATION_JOB_LOG_PATHS_SAFE',
      passed: pathProblems.length === 0,
      measured: { pathProblems }
    },
    {
      id: 'ASSET_GENERATION_JOB_LOG_OUTPUT_STATE_COHERENT',
      passed: statusOutputMatches
        && record?.externalImageGenerationUsed === false
        && record?.approvedProductionAssetsCreated === false
        && (record?.sourceProvenance?.productionAssetApproval || 'not_requested') === 'not_requested',
      measured: {
        status: record?.status || null,
        outputCount,
        externalImageGenerationUsed: record?.externalImageGenerationUsed,
        approvedProductionAssetsCreated: record?.approvedProductionAssetsCreated
      }
    }
  ];
  return {
    ok: checks.every((check) => check.passed === true),
    checks,
    metrics: {
      schemaErrorCount: schemaReport.errors.length,
      secretLikePathCount: secretLikePaths.length,
      rawInstructionPathCount: rawInstructionPaths.length,
      pathProblemCount: pathProblems.length,
      outputCount,
      productionImageAssetCount: record?.approvedProductionAssetsCreated === true ? outputCount : 0
    }
  };
}

function validateCandidateGenerationRun(run = {}, { pack = {}, assetPromptPlan = null, jobRecords = [] } = {}) {
  const schemaReport = SCHEMA_REGISTRY?.candidateGenerationRun
    ? validateGeneratedSchema(run, SCHEMA_REGISTRY.candidateGenerationRun, '$.candidateGenerationRun')
    : { ok: true, errors: [] };
  const secretLikePaths = findSecretLikePaths(run);
  const rawInstructionPaths = findRawPromptInstructionPaths(run);
  const expectedHash = schemaReport.ok ? candidateGenerationRunHash(run) : '';
  const hashMatches = Boolean(expectedHash) && run?.runHash === expectedHash;
  const jobStatuses = Array.isArray(run?.jobStatuses) ? run.jobStatuses : [];
  const failedStatusCount = jobStatuses.filter((item) => item.status === 'failed').length;
  const candidateRecordStatusCount = jobStatuses.filter((item) => item.status === 'candidate_recorded').length;
  const statusCountsMatch = Number(run?.targetCount || 0) === jobStatuses.length
    && Number(run?.failedJobCount || 0) === failedStatusCount
    && Number(run?.candidateRecordCount || 0) === candidateRecordStatusCount;
  const jobReports = Array.isArray(jobRecords)
    ? jobRecords.map((record) => validateAssetGenerationJobLogRecord(record, { assetPromptPlan: assetPromptPlan || pack?.assetPromptPlan || null }))
    : [];
  const jobRecordsOk = jobReports.every((report) => report.ok === true)
    && (!jobRecords.length || Number(run?.jobLogWriteCount || 0) === jobRecords.length);
  const planTargets = Array.isArray((assetPromptPlan || pack?.assetPromptPlan)?.targets)
    ? (assetPromptPlan || pack.assetPromptPlan).targets
    : [];
  const allowedCanonicalTargets = new Set(planTargets.map((target) => target.canonicalTarget));
  const seenCanonicalTargets = new Set();
  const canonicalTargetProblems = [];
  for (const statusEntry of jobStatuses) {
    const canonicalTarget = statusEntry?.canonicalTarget || '';
    if (allowedCanonicalTargets.size > 0 && !allowedCanonicalTargets.has(canonicalTarget)) {
      canonicalTargetProblems.push(`unknown:${redactedReportValue(canonicalTarget)}`);
    }
    if (seenCanonicalTargets.has(canonicalTarget)) {
      canonicalTargetProblems.push(`duplicate:${redactedReportValue(canonicalTarget)}`);
    }
    seenCanonicalTargets.add(canonicalTarget);
  }
  const canonicalFingerprint = canonicalMappingFingerprint(pack || {});
  const canonicalMappingPreserved = run?.canonicalMappingPreserved === true
    && run?.canonicalMappingFingerprintBefore === run?.canonicalMappingFingerprintAfter
    && (!pack?.packId || run?.canonicalMappingFingerprintBefore === canonicalFingerprint);
  const noGenerationOrPromotion = run?.candidateImagesGenerated === false
    && run?.externalImageGenerationUsed === false
    && run?.approvedProductionAssetsCreated === false
    && Number(run?.productionImageAssetCount || 0) === 0
    && run?.generatedImageAssetsCanChangeServerRules === false;
  const checks = [
    {
      id: 'CANDIDATE_GENERATION_RUN_SCHEMA_VALID',
      passed: schemaReport.ok === true,
      measured: { schemaErrorCount: schemaReport.errors.length, errors: schemaReport.errors.slice(0, 5).map(redactSchemaError) }
    },
    {
      id: 'CANDIDATE_GENERATION_RUN_CONTENT_SAFE',
      passed: secretLikePaths.length === 0 && rawInstructionPaths.length === 0,
      measured: { secretLikePaths, rawInstructionPaths }
    },
    {
      id: 'CANDIDATE_GENERATION_RUN_HASH_STABLE',
      passed: hashMatches,
      measured: { expectedHash, actualHash: run?.runHash || '' }
    },
    {
      id: 'CANDIDATE_GENERATION_RUN_STATUS_COUNTS',
      passed: statusCountsMatch,
      measured: {
        targetCount: run?.targetCount,
        jobStatusCount: jobStatuses.length,
        failedJobCount: run?.failedJobCount,
        failedStatusCount,
        candidateRecordCount: run?.candidateRecordCount,
        candidateRecordStatusCount
      }
    },
    {
      id: 'CANDIDATE_GENERATION_RUN_TARGETS_CANONICAL',
      passed: canonicalTargetProblems.length === 0,
      measured: { canonicalTargetProblems }
    },
    {
      id: 'CANDIDATE_GENERATION_RUN_JOB_LOGS_VALID',
      passed: jobRecordsOk,
      measured: {
        jobRecordCount: jobRecords.length,
        jobLogWriteCount: run?.jobLogWriteCount,
        failedJobRecordCount: jobReports.filter((report) => report.ok !== true).length
      }
    },
    {
      id: 'CANDIDATE_GENERATION_RUN_BOUNDARY_PRESERVED',
      passed: canonicalMappingPreserved && noGenerationOrPromotion,
      measured: {
        canonicalMappingPreserved,
        noGenerationOrPromotion,
        productionImageAssetCount: run?.productionImageAssetCount
      }
    }
  ];
  return {
    ok: checks.every((check) => check.passed === true),
    checks,
    metrics: {
      schemaErrorCount: schemaReport.errors.length,
      secretLikePathCount: secretLikePaths.length,
      rawInstructionPathCount: rawInstructionPaths.length,
      hashMatches,
      statusCountsMatch,
      canonicalTargetProblemCount: canonicalTargetProblems.length,
      jobRecordsOk,
      canonicalMappingPreserved,
      noGenerationOrPromotion,
      productionImageAssetCount: Number(run?.productionImageAssetCount || 0)
    }
  };
}

async function runCandidateImageGenerationSpike({
  assetPromptPlan,
  config = {},
  generatorAdapter,
  nowMs = Date.now(),
  pack,
  targetLimit,
  writeJobLogs = true
} = {}) {
  const normalizedConfig = normalizeCandidateGenerationConfig(config);
  const plan = assetPromptPlan || pack?.assetPromptPlan || {};
  const validationReport = validateGeneratedPack(pack || {});
  const promptPlanReport = validateAssetPromptPlan(plan, pack || {});
  const targets = Array.isArray(plan.targets) ? plan.targets : [];
  if (writeJobLogs) {
    validateCandidateGenerationPlanPaths(plan);
  }
  const selectedTargets = Number.isInteger(targetLimit) && targetLimit > 0
    ? targets.slice(0, targetLimit)
    : targets;
  const gateProblems = buildGateProblems({
    config: normalizedConfig,
    validationReport,
    promptPlanReport
  });
  const beforeFingerprint = canonicalMappingFingerprint(pack || {});
  let jobLogWriteCount = 0;
  let candidateRecordCount = 0;
  let failedJobCount = 0;
  const jobStatuses = [];

  for (const target of selectedTargets) {
    let status = 'blocked';
    let outputCount = 0;
    let errors = gateProblems.map((code) => ({ code }));
    if (gateProblems.length === 0) {
      if (typeof generatorAdapter !== 'function') {
        errors = [{ code: 'generation_adapter_not_configured' }];
      } else {
        try {
          const result = await generatorAdapter({
            assetPromptPlan: plan,
            config: normalizedConfig,
            pack,
            target
          });
          const sanitizedResult = sanitizeAdapterResult(result, target);
          if (sanitizedResult.ok) {
            status = 'candidate_recorded';
            outputCount = 1;
            candidateRecordCount += 1;
            errors = [];
          } else {
            status = 'failed';
            failedJobCount += 1;
            errors = [{ code: sanitizedResult.code }];
          }
        } catch {
          status = 'failed';
          failedJobCount += 1;
          errors = [{ code: 'candidate_generation_failed' }];
        }
      }
    }
    const record = buildJobRecord({
      assetPromptPlan: plan,
      config: normalizedConfig,
      createdAtMs: nowMs,
      errors,
      outputCount,
      pack,
      phase: 'candidate-generation-preflight',
      status,
      target
    });
    if (writeJobLogs) {
      appendJobRecord(target, record);
      jobLogWriteCount += 1;
    }
    jobStatuses.push({ canonicalTarget: target.canonicalTarget, status, errors });
  }

  const adapterMissing = gateProblems.length === 0 && typeof generatorAdapter !== 'function';
  const afterFingerprint = canonicalMappingFingerprint(pack || {});
  const blockedReasons = adapterMissing
    ? [...gateProblems, 'generation_adapter_not_configured']
    : gateProblems;
  const status = gateProblems.length > 0 || adapterMissing
    ? 'blocked'
    : failedJobCount > 0
      ? 'failed'
      : candidateRecordCount > 0
        ? 'candidate_recorded'
        : 'no_targets';

  const run = {
    schemaVersion: CANDIDATE_GENERATION_RUN_VERSION,
    packId: plan.packId || pack?.packId || '',
    status,
    targetCount: selectedTargets.length,
    jobLogWriteCount,
    candidateRecordCount,
    failedJobCount,
    blockedReasons,
    jobStatuses,
    authModelDocumented: normalizedConfig.authModelDocumented,
    costConsentRequired: true,
    costConsentStatus: costConsentStatus(normalizedConfig),
    consentStatus: consentStatus(normalizedConfig),
    productSecurityApprovalGranted: normalizedConfig.productSecurityApprovalGranted,
    rateLimit: normalizedConfig.rateLimit,
    retryPolicy: normalizedConfig.retryPolicy,
    candidateImagesGenerated: false,
    externalImageGenerationUsed: false,
    approvedAssetsRequireHumanSignoff: true,
    approvedProductionAssetsCreated: false,
    productionImageAssetCount: 0,
    fallbackStillPlayable: validationReport.ok,
    deterministicFallbackRoot: DEFAULT_CANDIDATE_ROOT,
    generatedImageAssetsCanChangeServerRules: false,
    canonicalMappingFingerprintBefore: beforeFingerprint,
    canonicalMappingFingerprintAfter: afterFingerprint,
    canonicalMappingPreserved: beforeFingerprint === afterFingerprint,
    localEvidenceScreenshotRequired: true,
    humanReviewChecklist: HUMAN_REVIEW_CHECKLIST
  };
  run.runHash = candidateGenerationRunHash(run);
  return run;
}

module.exports = {
  CANDIDATE_GENERATION_RUN_VERSION,
  JOB_LOG_SCHEMA_VERSION,
  HUMAN_REVIEW_CHECKLIST,
  normalizeCandidateGenerationConfig,
  runCandidateImageGenerationSpike,
  validateAssetGenerationJobLogRecord,
  validateCandidateGenerationRun
};
