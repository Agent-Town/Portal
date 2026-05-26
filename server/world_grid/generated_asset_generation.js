const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const {
  DEFAULT_CANDIDATE_ROOT,
  validateAssetPromptPlan,
  validateGeneratedPack
} = require('./generated_pack');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const CANDIDATE_GENERATION_RUN_VERSION = 'agent-town-candidate-image-generation-run-v1';
const JOB_LOG_SCHEMA_VERSION = 'agent-town-asset-generation-job-log-v1';
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

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
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

  return {
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
}

module.exports = {
  CANDIDATE_GENERATION_RUN_VERSION,
  HUMAN_REVIEW_CHECKLIST,
  normalizeCandidateGenerationConfig,
  runCandidateImageGenerationSpike
};
