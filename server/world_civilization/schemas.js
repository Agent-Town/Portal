const CIVIC_SCHEMA_VERSION = 'agent-town.v6.civic.v1';
const CIVIC_ID_RE = /^[a-z][a-z0-9_:-]{5,96}$/;
const TOOL_NAME_RE = /^et\.civic\.[a-z0-9_]+\.[a-z0-9_]+$/;
const HASH_RE = /^sha256:[a-f0-9]{64}$/;
const SECRET_TEXT_RE = /\b(?:sk-[a-z0-9_-]{8,}|bearer\s+[a-z0-9._-]{8,}|oauth[-_ ]?token|api[-_ ]?key|private[-_ ]?key|secret)\b/i;
const FORBIDDEN_PRIVATE_KEYS = new Set([
  'brain',
  'credential',
  'debugtrace',
  'idtoken',
  'oauth',
  'password',
  'privatekey',
  'providercredential',
  'secret',
  'token',
  'transcript',
  'walletsecret'
]);

const PROPOSAL_SCOPES = new Set([
  'public_world',
  'public_works',
  'sandbox_policy',
  'institution_charter',
  'service_policy'
]);
const MODERATION_CLASSES = new Set([
  'civic_text',
  'public_works',
  'sandbox_policy',
  'reputation_policy',
  'institution_charter'
]);
const VOTE_CHOICES = new Set(['approve', 'reject', 'abstain']);
const DELEGATION_SCOPES = new Set(['proposal_drafting', 'vote_advice', 'civic_execution']);
const CIVIC_ACTION_EFFECT_HANDLERS = Object.freeze({
  public_summary: 'et.civic.public_summary.apply',
  public_works_accounting: 'et.civic.public_works.apply',
  sandbox_policy: 'et.civic.sandbox_policy.apply',
  charter_update: 'et.civic.charter.apply'
});
const CIVIC_ACTION_EFFECTS = new Set(Object.keys(CIVIC_ACTION_EFFECT_HANDLERS));
const MODERATION_STATUSES = new Set(['approved', 'rejected', 'needs_review']);
const MODERATION_REVIEW_TYPES = new Set(['human_review', 'appeal']);
const MODERATION_REVIEW_STATUSES = new Set(['queued', 'upheld', 'overturned', 'escalated']);
const REPUTATION_KINDS = new Set(['service_reliability', 'proposal_quality', 'moderation_trust']);
const REPUTATION_DISPUTE_STATUSES = new Set(['opened', 'under_review', 'upheld', 'overturned', 'dismissed']);
const RESOURCE_BUNDLE_KEYS = ['wood', 'stone', 'food', 'coin'];
const AUDIT_ACTION_TYPES = new Set([
  'proposal.created',
  'vote.recorded',
  'delegation.created',
  'delegation.action_consumed',
  'delegation.revoked',
  'institution.chartered',
  'institution.charter_amendment.recorded',
  'public_works.project.recorded',
  'public_works.contribution.recorded',
  'reputation.recorded',
  'reputation.disputed',
  'reputation.reviewed',
  'proposal.reviewed',
  'moderation.decided',
  'moderation.reviewed',
  'moderation.appealed',
  'civic_action.prepared',
  'civic_action.applied',
  'rollback.applied'
]);

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function safeText(value, max = 240) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function normalizedKey(key = '') {
  return String(key || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findPrivateData(value, path = 'payload', found = []) {
  if (value === null || value === undefined) return found;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => findPrivateData(entry, `${path}[${index}]`, found));
    return found;
  }
  if (typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      const normalized = normalizedKey(key);
      if (FORBIDDEN_PRIVATE_KEYS.has(normalized) || normalized.endsWith('token') || normalized.endsWith('secret')) {
        found.push(`${path}.${key}`);
      }
      findPrivateData(child, `${path}.${key}`, found);
    }
    return found;
  }
  if (typeof value === 'string' && SECRET_TEXT_RE.test(value)) found.push(path);
  return found;
}

function validateString(errors, value, path, { pattern = null, max = 160, min = 1 } = {}) {
  const text = safeText(value, max);
  if (text.length < min) {
    errors.push(`${path} required`);
    return '';
  }
  if (pattern && !pattern.test(text)) errors.push(`${path} invalid`);
  return text;
}

function validateEnum(errors, value, allowed, path) {
  const text = safeText(value, 80);
  if (!allowed.has(text)) errors.push(`${path} unsupported`);
  return text;
}

function validateNumber(errors, value, path, { min = 0, max = Number.MAX_SAFE_INTEGER, integer = true } = {}) {
  const number = Number(value);
  const valid = Number.isFinite(number)
    && number >= min
    && number <= max
    && (!integer || Number.isInteger(number));
  if (!valid) errors.push(`${path} invalid`);
  return number;
}

function validateStringArray(errors, value, path, { maxItems = 8, maxLen = 80, required = true } = {}) {
  if (!Array.isArray(value)) {
    if (required) errors.push(`${path} must be array`);
    return [];
  }
  if (value.length > maxItems) errors.push(`${path} too many items`);
  return value.slice(0, maxItems).map((entry, index) => validateString(errors, entry, `${path}[${index}]`, { max: maxLen }));
}

function validateSchemaVersion(errors, raw) {
  if (raw?.schemaVersion !== CIVIC_SCHEMA_VERSION) errors.push('schemaVersion unsupported');
}

function validateActor(errors, raw, path, { allowAgent = true } = {}) {
  if (!isPlainObject(raw)) {
    errors.push(`${path} required`);
    return {};
  }
  const kind = validateEnum(errors, raw.kind, allowAgent ? new Set(['human', 'agent']) : new Set(['human']), `${path}.kind`);
  const accountId = validateString(errors, raw.accountId, `${path}.accountId`, { pattern: CIVIC_ID_RE, max: 96 });
  const agentId = raw.agentId === undefined ? '' : validateString(errors, raw.agentId, `${path}.agentId`, { pattern: CIVIC_ID_RE, max: 96 });
  if (kind === 'agent' && !agentId) errors.push(`${path}.agentId required for agent actor`);
  return agentId ? { kind, accountId, agentId } : { kind, accountId };
}

function validatePrivacy(errors, raw, path) {
  if (!isPlainObject(raw)) {
    errors.push(`${path} required`);
    return {};
  }
  const privateDataIncluded = raw.privateDataIncluded === true;
  if (privateDataIncluded) errors.push(`${path}.privateDataIncluded must be false`);
  if (raw.redacted !== true) errors.push(`${path}.redacted must be true`);
  const dataClasses = validateStringArray(errors, raw.dataClasses, `${path}.dataClasses`, { maxItems: 8, maxLen: 64 });
  const forbidden = dataClasses.filter((entry) => !['public_profile', 'public_world_state', 'public_audit_summary'].includes(entry));
  if (forbidden.length) errors.push(`${path}.dataClasses includes private classes`);
  return {
    redacted: raw.redacted === true,
    privateDataIncluded,
    dataClasses
  };
}

function normalizeRollbackPlan(errors, raw, path = 'rollbackPlan') {
  if (!isPlainObject(raw)) {
    errors.push(`${path} required`);
    return {};
  }
  const planId = validateString(errors, raw.planId, `${path}.planId`, { pattern: CIVIC_ID_RE, max: 96 });
  const strategy = validateString(errors, raw.strategy, `${path}.strategy`, { max: 120 });
  const canRollback = raw.canRollback === true;
  if (!canRollback) errors.push(`${path}.canRollback must be true for V6 civic effects`);
  const irreversibleEffects = validateStringArray(errors, raw.irreversibleEffects || [], `${path}.irreversibleEffects`, {
    maxItems: 6,
    maxLen: 80,
    required: false
  });
  const maxRollbackMs = validateNumber(errors, raw.maxRollbackMs, `${path}.maxRollbackMs`, { min: 1, max: 30 * 24 * 60 * 60 * 1000 });
  return { planId, strategy, canRollback, irreversibleEffects, maxRollbackMs };
}

function validateCivicProposal(raw = {}) {
  const errors = [];
  if (!isPlainObject(raw)) return { ok: false, errors: ['proposal must be object'] };
  validateSchemaVersion(errors, raw);
  const proposalId = validateString(errors, raw.proposalId, 'proposalId', { pattern: /^proposal_[a-z0-9_:-]{4,88}$/ });
  const proposer = validateActor(errors, raw.proposer, 'proposer');
  const scope = isPlainObject(raw.scope) ? raw.scope : {};
  if (!isPlainObject(raw.scope)) errors.push('scope required');
  const scopeKind = validateEnum(errors, scope.kind, PROPOSAL_SCOPES, 'scope.kind');
  const scopeTargetId = validateString(errors, scope.targetId, 'scope.targetId', { pattern: CIVIC_ID_RE, max: 96 });
  const affectedPublicState = validateStringArray(errors, raw.affectedPublicState, 'affectedPublicState', { maxItems: 12, maxLen: 96 });
  const effectPreview = isPlainObject(raw.effectPreview) ? raw.effectPreview : {};
  if (!isPlainObject(raw.effectPreview)) errors.push('effectPreview required');
  const effectType = validateEnum(errors, effectPreview.effectType, CIVIC_ACTION_EFFECTS, 'effectPreview.effectType');
  const mutationMode = validateString(errors, effectPreview.mutationMode, 'effectPreview.mutationMode', { max: 40 });
  if (mutationMode !== 'preview_only') errors.push('effectPreview.mutationMode must be preview_only');
  const summary = validateString(errors, effectPreview.summary, 'effectPreview.summary', { max: 400 });
  const moderationClass = validateEnum(errors, raw.moderationClass, MODERATION_CLASSES, 'moderationClass');
  const expiresAtMs = validateNumber(errors, raw.expiresAtMs, 'expiresAtMs', { min: 1 });
  const idempotencyKey = validateString(errors, raw.idempotencyKey, 'idempotencyKey', { pattern: CIVIC_ID_RE, max: 96 });
  const rollbackPlan = normalizeRollbackPlan(errors, raw.rollbackPlan);
  const privacy = validatePrivacy(errors, raw.privacy, 'privacy');
  const privatePaths = findPrivateData(raw);
  if (privatePaths.length) errors.push(`private data forbidden: ${privatePaths.join(', ')}`);
  return {
    ok: errors.length === 0,
    errors,
    value: errors.length ? null : {
      schemaVersion: CIVIC_SCHEMA_VERSION,
      proposalId,
      proposer,
      scope: { kind: scopeKind, targetId: scopeTargetId },
      affectedPublicState,
      effectPreview: { effectType, mutationMode, summary },
      moderationClass,
      expiresAtMs,
      idempotencyKey,
      rollbackPlan,
      privacy
    }
  };
}

function validateCivicVote(raw = {}) {
  const errors = [];
  if (!isPlainObject(raw)) return { ok: false, errors: ['vote must be object'] };
  validateSchemaVersion(errors, raw);
  const voteId = validateString(errors, raw.voteId, 'voteId', { pattern: /^vote_[a-z0-9_:-]{4,88}$/ });
  const proposalId = validateString(errors, raw.proposalId, 'proposalId', { pattern: /^proposal_[a-z0-9_:-]{4,88}$/ });
  const voter = validateActor(errors, raw.voter, 'voter', { allowAgent: false });
  const choice = validateEnum(errors, raw.choice, VOTE_CHOICES, 'choice');
  const authorization = isPlainObject(raw.authorization) ? raw.authorization : {};
  if (!isPlainObject(raw.authorization)) errors.push('authorization required');
  const authKind = validateEnum(errors, authorization.kind, new Set(['wallet_session', 'server_attested_delegation']), 'authorization.kind');
  const authSubject = validateString(errors, authorization.subjectAccountId, 'authorization.subjectAccountId', { pattern: CIVIC_ID_RE, max: 96 });
  if (authSubject && voter.accountId && authSubject !== voter.accountId) errors.push('authorization.subjectAccountId must match voter.accountId');
  if (authorization.serverVerified !== true) errors.push('authorization.serverVerified must be true');
  const eligibilityProof = isPlainObject(raw.eligibilityProof) ? raw.eligibilityProof : {};
  if (!isPlainObject(raw.eligibilityProof)) errors.push('eligibilityProof required');
  if (eligibilityProof.eligible !== true) errors.push('eligibilityProof.eligible must be true');
  const eligibilityRuleId = validateString(errors, eligibilityProof.ruleId, 'eligibilityProof.ruleId', { pattern: CIVIC_ID_RE, max: 96 });
  const receiptId = validateString(errors, raw.receiptId, 'receiptId', { pattern: /^receipt_[a-z0-9_:-]{4,88}$/ });
  const idempotencyKey = validateString(errors, raw.idempotencyKey, 'idempotencyKey', { pattern: CIVIC_ID_RE, max: 96 });
  const privatePaths = findPrivateData(raw);
  if (privatePaths.length) errors.push(`private data forbidden: ${privatePaths.join(', ')}`);
  return {
    ok: errors.length === 0,
    errors,
    value: errors.length ? null : {
      schemaVersion: CIVIC_SCHEMA_VERSION,
      voteId,
      proposalId,
      voter,
      choice,
      authorization: {
        kind: authKind,
        subjectAccountId: authSubject,
        serverVerified: true
      },
      eligibilityProof: {
        eligible: true,
        ruleId: eligibilityRuleId
      },
      receiptId,
      idempotencyKey
    }
  };
}

function validateCivicDelegation(raw = {}) {
  const errors = [];
  if (!isPlainObject(raw)) return { ok: false, errors: ['delegation must be object'] };
  validateSchemaVersion(errors, raw);
  const delegationId = validateString(errors, raw.delegationId, 'delegationId', { pattern: /^delegation_[a-z0-9_:-]{4,88}$/ });
  const principalAccountId = validateString(errors, raw.principalAccountId, 'principalAccountId', { pattern: CIVIC_ID_RE, max: 96 });
  const delegateAgentId = validateString(errors, raw.delegateAgentId, 'delegateAgentId', { pattern: CIVIC_ID_RE, max: 96 });
  const scope = validateEnum(errors, raw.scope, DELEGATION_SCOPES, 'scope');
  const expiresAtMs = validateNumber(errors, raw.expiresAtMs, 'expiresAtMs', { min: 1 });
  const maxActions = validateNumber(errors, raw.maxActions, 'maxActions', { min: 1, max: 50 });
  const approvalReceiptId = validateString(errors, raw.approvalReceiptId, 'approvalReceiptId', { pattern: /^receipt_[a-z0-9_:-]{4,88}$/ });
  if (raw.revocable !== true) errors.push('revocable must be true');
  if (raw.canExecuteCivicEffects === true && scope !== 'civic_execution') {
    errors.push('canExecuteCivicEffects requires civic_execution scope');
  }
  const privatePaths = findPrivateData(raw);
  if (privatePaths.length) errors.push(`private data forbidden: ${privatePaths.join(', ')}`);
  return {
    ok: errors.length === 0,
    errors,
    value: errors.length ? null : {
      schemaVersion: CIVIC_SCHEMA_VERSION,
      delegationId,
      principalAccountId,
      delegateAgentId,
      scope,
      expiresAtMs,
      maxActions,
      approvalReceiptId,
      revocable: raw.revocable === true,
      canExecuteCivicEffects: raw.canExecuteCivicEffects === true
    }
  };
}

function validateCivicInstitution(raw = {}) {
  const errors = [];
  if (!isPlainObject(raw)) return { ok: false, errors: ['institution must be object'] };
  validateSchemaVersion(errors, raw);
  const institutionId = validateString(errors, raw.institutionId, 'institutionId', { pattern: /^institution_[a-z0-9_:-]{4,88}$/ });
  const charterId = validateString(errors, raw.charterId, 'charterId', { pattern: /^charter_[a-z0-9_:-]{4,88}$/ });
  const charteredBy = validateActor(errors, raw.charteredBy, 'charteredBy', { allowAgent: false });
  const displayName = validateString(errors, raw.displayName, 'displayName', { max: 80 });
  const purpose = validateString(errors, raw.purpose, 'purpose', { max: 300 });
  const scope = isPlainObject(raw.scope) ? raw.scope : {};
  if (!isPlainObject(raw.scope)) errors.push('scope required');
  const scopeKind = validateEnum(errors, scope.kind, PROPOSAL_SCOPES, 'scope.kind');
  const scopeTargetId = validateString(errors, scope.targetId, 'scope.targetId', { pattern: CIVIC_ID_RE, max: 96 });
  const proposalTypes = validateStringArray(errors, raw.proposalTypes, 'proposalTypes', { maxItems: 8, maxLen: 64 });
  for (const proposalType of proposalTypes) {
    if (!PROPOSAL_SCOPES.has(proposalType)) errors.push(`proposalTypes unsupported: ${proposalType}`);
  }
  const membershipRuleId = validateString(errors, raw.membershipRuleId, 'membershipRuleId', { pattern: /^rule_[a-z0-9_:-]{4,88}$/ });
  const eligibilityRuleId = validateString(errors, raw.eligibilityRuleId, 'eligibilityRuleId', { pattern: /^rule_[a-z0-9_:-]{4,88}$/ });
  const moderationPolicyId = validateString(errors, raw.moderationPolicyId, 'moderationPolicyId', { pattern: /^policy_[a-z0-9_:-]{4,88}$/ });
  const votingRuleId = validateString(errors, raw.votingRuleId, 'votingRuleId', { pattern: /^rule_[a-z0-9_:-]{4,88}$/ });
  const publicAuditSummary = validateString(errors, raw.publicAuditSummary, 'publicAuditSummary', { max: 480 });
  const effectiveAtMs = validateNumber(errors, raw.effectiveAtMs, 'effectiveAtMs', { min: 1 });
  const privacy = validatePrivacy(errors, raw.privacy, 'privacy');
  const privatePaths = findPrivateData(raw);
  if (privatePaths.length) errors.push(`private data forbidden: ${privatePaths.join(', ')}`);
  return {
    ok: errors.length === 0,
    errors,
    value: errors.length ? null : {
      schemaVersion: CIVIC_SCHEMA_VERSION,
      institutionId,
      charterId,
      charteredBy,
      displayName,
      purpose,
      scope: { kind: scopeKind, targetId: scopeTargetId },
      proposalTypes,
      membershipRuleId,
      eligibilityRuleId,
      moderationPolicyId,
      votingRuleId,
      publicAuditSummary,
      effectiveAtMs,
      privacy
    }
  };
}

function validateCivicInstitutionAmendment(raw = {}) {
  const errors = [];
  if (!isPlainObject(raw)) return { ok: false, errors: ['institution amendment must be object'] };
  validateSchemaVersion(errors, raw);
  const amendmentId = validateString(errors, raw.amendmentId, 'amendmentId', { pattern: /^charteramend_[a-z0-9_:-]{4,88}$/ });
  const institutionId = validateString(errors, raw.institutionId, 'institutionId', { pattern: /^institution_[a-z0-9_:-]{4,88}$/ });
  const proposalId = validateString(errors, raw.proposalId, 'proposalId', { pattern: /^proposal_[a-z0-9_:-]{4,88}$/ });
  const requestedBy = validateActor(errors, raw.requestedBy, 'requestedBy', { allowAgent: false });
  const approvalReceiptId = validateString(errors, raw.approvalReceiptId, 'approvalReceiptId', { pattern: /^receipt_[a-z0-9_:-]{4,88}$/ });
  const newCharterId = validateString(errors, raw.newCharterId, 'newCharterId', { pattern: /^charter_[a-z0-9_:-]{4,88}$/ });
  const publicSummary = validateString(errors, raw.publicSummary, 'publicSummary', { max: 480 });
  const effectiveAtMs = validateNumber(errors, raw.effectiveAtMs, 'effectiveAtMs', { min: 1 });
  const idempotencyKey = validateString(errors, raw.idempotencyKey, 'idempotencyKey', { pattern: CIVIC_ID_RE, max: 96 });
  const privacy = validatePrivacy(errors, raw.privacy, 'privacy');
  const privatePaths = findPrivateData(raw);
  if (privatePaths.length) errors.push(`private data forbidden: ${privatePaths.join(', ')}`);
  return {
    ok: errors.length === 0,
    errors,
    value: errors.length ? null : {
      schemaVersion: CIVIC_SCHEMA_VERSION,
      amendmentId,
      institutionId,
      proposalId,
      requestedBy,
      approvalReceiptId,
      newCharterId,
      publicSummary,
      effectiveAtMs,
      idempotencyKey,
      privacy
    }
  };
}

function normalizeResourceBundle(errors, raw, path) {
  if (!isPlainObject(raw)) {
    errors.push(`${path} required`);
    return Object.fromEntries(RESOURCE_BUNDLE_KEYS.map((key) => [key, 0]));
  }
  const bundle = {};
  for (const key of RESOURCE_BUNDLE_KEYS) {
    bundle[key] = validateNumber(errors, raw[key] || 0, `${path}.${key}`, { min: 0, max: 1_000, integer: true });
  }
  return bundle;
}

function validatePublicWorksContribution(raw = {}) {
  const errors = [];
  if (!isPlainObject(raw)) return { ok: false, errors: ['public works contribution must be object'] };
  validateSchemaVersion(errors, raw);
  const contributionId = validateString(errors, raw.contributionId, 'contributionId', { pattern: /^contribution_[a-z0-9_:-]{4,88}$/ });
  const institutionId = validateString(errors, raw.institutionId, 'institutionId', { pattern: /^institution_[a-z0-9_:-]{4,88}$/ });
  const projectId = validateString(errors, raw.projectId, 'projectId', { pattern: /^publicworks_[a-z0-9_:-]{4,88}$/ });
  const contributorAccountId = validateString(errors, raw.contributorAccountId, 'contributorAccountId', { pattern: CIVIC_ID_RE, max: 96 });
  const sourceRef = validateString(errors, raw.sourceRef, 'sourceRef', { pattern: CIVIC_ID_RE, max: 96 });
  const requestedBundle = normalizeResourceBundle(errors, raw.requestedBundle, 'requestedBundle');
  if (!RESOURCE_BUNDLE_KEYS.some((key) => requestedBundle[key] > 0)) errors.push('requestedBundle must include at least one resource');
  const idempotencyKey = validateString(errors, raw.idempotencyKey, 'idempotencyKey', { pattern: CIVIC_ID_RE, max: 96 });
  const publicSummary = validateString(errors, raw.publicSummary, 'publicSummary', { max: 360 });
  const privacy = validatePrivacy(errors, raw.privacy, 'privacy');
  const privatePaths = findPrivateData(raw);
  if (privatePaths.length) errors.push(`private data forbidden: ${privatePaths.join(', ')}`);
  return {
    ok: errors.length === 0,
    errors,
    value: errors.length ? null : {
      schemaVersion: CIVIC_SCHEMA_VERSION,
      contributionId,
      institutionId,
      projectId,
      contributorAccountId,
      sourceRef,
      requestedBundle,
      idempotencyKey,
      publicSummary,
      privacy
    }
  };
}

function validatePublicWorksProject(raw = {}) {
  const errors = [];
  if (!isPlainObject(raw)) return { ok: false, errors: ['public works project must be object'] };
  validateSchemaVersion(errors, raw);
  const projectId = validateString(errors, raw.projectId, 'projectId', { pattern: /^publicworks_[a-z0-9_:-]{4,88}$/ });
  const institutionId = validateString(errors, raw.institutionId, 'institutionId', { pattern: /^institution_[a-z0-9_:-]{4,88}$/ });
  const proposalId = validateString(errors, raw.proposalId, 'proposalId', { pattern: /^proposal_[a-z0-9_:-]{4,88}$/ });
  const requestedBy = validateActor(errors, raw.requestedBy, 'requestedBy', { allowAgent: false });
  const approvalReceiptId = validateString(errors, raw.approvalReceiptId, 'approvalReceiptId', { pattern: /^receipt_[a-z0-9_:-]{4,88}$/ });
  const displayName = validateString(errors, raw.displayName, 'displayName', { max: 80 });
  const publicSummary = validateString(errors, raw.publicSummary, 'publicSummary', { max: 480 });
  const goalBundle = normalizeResourceBundle(errors, raw.goalBundle, 'goalBundle');
  const perContributionCap = normalizeResourceBundle(errors, raw.perContributionCap, 'perContributionCap');
  const perContributorCap = normalizeResourceBundle(errors, raw.perContributorCap, 'perContributorCap');
  if (!RESOURCE_BUNDLE_KEYS.some((key) => goalBundle[key] > 0)) errors.push('goalBundle must include at least one resource');
  if (!RESOURCE_BUNDLE_KEYS.some((key) => perContributionCap[key] > 0)) errors.push('perContributionCap must include at least one resource');
  if (!RESOURCE_BUNDLE_KEYS.some((key) => perContributorCap[key] > 0)) errors.push('perContributorCap must include at least one resource');
  const cosmeticRewardsOnly = raw.cosmeticRewardsOnly === true;
  if (!cosmeticRewardsOnly) errors.push('cosmeticRewardsOnly must be true');
  const idempotencyKey = validateString(errors, raw.idempotencyKey, 'idempotencyKey', { pattern: CIVIC_ID_RE, max: 96 });
  const privacy = validatePrivacy(errors, raw.privacy, 'privacy');
  const privatePaths = findPrivateData(raw);
  if (privatePaths.length) errors.push(`private data forbidden: ${privatePaths.join(', ')}`);
  return {
    ok: errors.length === 0,
    errors,
    value: errors.length ? null : {
      schemaVersion: CIVIC_SCHEMA_VERSION,
      projectId,
      institutionId,
      proposalId,
      requestedBy,
      approvalReceiptId,
      displayName,
      publicSummary,
      goalBundle,
      perContributionCap,
      perContributorCap,
      cosmeticRewardsOnly,
      idempotencyKey,
      privacy
    }
  };
}

function validateReputationRecord(raw = {}) {
  const errors = [];
  if (!isPlainObject(raw)) return { ok: false, errors: ['reputation record must be object'] };
  validateSchemaVersion(errors, raw);
  const recordId = validateString(errors, raw.recordId, 'recordId', { pattern: /^reputation_[a-z0-9_:-]{4,88}$/ });
  const subjectAccountId = validateString(errors, raw.subjectAccountId, 'subjectAccountId', { pattern: CIVIC_ID_RE, max: 96 });
  const awardedByAccountId = validateString(errors, raw.awardedByAccountId, 'awardedByAccountId', { pattern: CIVIC_ID_RE, max: 96 });
  if (subjectAccountId && awardedByAccountId && subjectAccountId === awardedByAccountId) errors.push('reputation cannot be self-awarded');
  const kind = validateEnum(errors, raw.kind, REPUTATION_KINDS, 'kind');
  const delta = validateNumber(errors, raw.delta, 'delta', { min: -5, max: 5, integer: true });
  if (delta === 0) errors.push('delta must be non-zero');
  const sourceRef = validateString(errors, raw.sourceRef, 'sourceRef', { pattern: CIVIC_ID_RE, max: 96 });
  const disputeStatus = validateEnum(errors, raw.disputeStatus, new Set(['none', 'open', 'resolved']), 'disputeStatus');
  const auditLedgerEntryId = validateString(errors, raw.auditLedgerEntryId, 'auditLedgerEntryId', { pattern: /^audit_[a-z0-9_:-]{4,88}$/ });
  const privatePaths = findPrivateData(raw);
  if (privatePaths.length) errors.push(`private data forbidden: ${privatePaths.join(', ')}`);
  return {
    ok: errors.length === 0,
    errors,
    value: errors.length ? null : {
      schemaVersion: CIVIC_SCHEMA_VERSION,
      recordId,
      subjectAccountId,
      awardedByAccountId,
      kind,
      delta,
      sourceRef,
      disputeStatus,
      auditLedgerEntryId
    }
  };
}

function validateReputationDispute(raw = {}) {
  const errors = [];
  if (!isPlainObject(raw)) return { ok: false, errors: ['reputation dispute must be object'] };
  validateSchemaVersion(errors, raw);
  const disputeId = validateString(errors, raw.disputeId, 'disputeId', { pattern: /^repdispute_[a-z0-9_:-]{4,88}$/ });
  const recordId = validateString(errors, raw.recordId, 'recordId', { pattern: /^reputation_[a-z0-9_:-]{4,88}$/ });
  const subjectAccountId = validateString(errors, raw.subjectAccountId, 'subjectAccountId', { pattern: CIVIC_ID_RE, max: 96 });
  const disputedBy = validateActor(errors, raw.disputedBy, 'disputedBy', { allowAgent: false });
  const status = validateEnum(errors, raw.status, REPUTATION_DISPUTE_STATUSES, 'status');
  const reviewerKind = validateEnum(errors, raw.reviewerKind, new Set(['system', 'human']), 'reviewerKind');
  if (status !== 'opened' && reviewerKind !== 'human') errors.push('reviewerKind must be human for reviewed disputes');
  const moderationDecisionId = raw.moderationDecisionId === undefined || raw.moderationDecisionId === ''
    ? ''
    : validateString(errors, raw.moderationDecisionId, 'moderationDecisionId', { pattern: /^moderation_[a-z0-9_:-]{4,88}$/ });
  const sourceRefs = validateStringArray(errors, raw.sourceRefs || [], 'sourceRefs', { maxItems: 8, maxLen: 96, required: false });
  const reasons = validateStringArray(errors, raw.reasons, 'reasons', { maxItems: 8, maxLen: 120 });
  const privacy = validatePrivacy(errors, raw.privacy, 'privacy');
  const privatePaths = findPrivateData(raw);
  if (privatePaths.length) errors.push(`private data forbidden: ${privatePaths.join(', ')}`);
  return {
    ok: errors.length === 0,
    errors,
    value: errors.length ? null : {
      schemaVersion: CIVIC_SCHEMA_VERSION,
      disputeId,
      recordId,
      subjectAccountId,
      disputedBy,
      status,
      reviewerKind,
      moderationDecisionId,
      sourceRefs,
      reasons,
      privacy
    }
  };
}

function validateModerationDecision(raw = {}) {
  const errors = [];
  if (!isPlainObject(raw)) return { ok: false, errors: ['moderation decision must be object'] };
  validateSchemaVersion(errors, raw);
  const decisionId = validateString(errors, raw.decisionId, 'decisionId', { pattern: /^moderation_[a-z0-9_:-]{4,88}$/ });
  const subjectRef = validateString(errors, raw.subjectRef, 'subjectRef', { pattern: CIVIC_ID_RE, max: 96 });
  const surface = validateEnum(errors, raw.surface, MODERATION_CLASSES, 'surface');
  const status = validateEnum(errors, raw.status, MODERATION_STATUSES, 'status');
  const policyVersion = validateString(errors, raw.policyVersion, 'policyVersion', { pattern: /^policy_[a-z0-9_:-]{4,88}$/ });
  const reviewerKind = validateEnum(errors, raw.reviewerKind, new Set(['system', 'human']), 'reviewerKind');
  const reasons = validateStringArray(errors, raw.reasons, 'reasons', { maxItems: 8, maxLen: 120 });
  const redactedFields = validateStringArray(errors, raw.redactedFields || [], 'redactedFields', { maxItems: 12, maxLen: 80, required: false });
  const privatePaths = findPrivateData(raw);
  if (privatePaths.length) errors.push(`private data forbidden: ${privatePaths.join(', ')}`);
  return {
    ok: errors.length === 0,
    errors,
    value: errors.length ? null : {
      schemaVersion: CIVIC_SCHEMA_VERSION,
      decisionId,
      subjectRef,
      surface,
      status,
      policyVersion,
      reviewerKind,
      reasons,
      redactedFields
    }
  };
}

function validateModerationReview(raw = {}) {
  const errors = [];
  if (!isPlainObject(raw)) return { ok: false, errors: ['moderation review must be object'] };
  validateSchemaVersion(errors, raw);
  const reviewId = validateString(errors, raw.reviewId, 'reviewId', { pattern: /^modreview_[a-z0-9_:-]{4,88}$/ });
  const decisionId = validateString(errors, raw.decisionId, 'decisionId', { pattern: /^moderation_[a-z0-9_:-]{4,88}$/ });
  const subjectRef = validateString(errors, raw.subjectRef, 'subjectRef', { pattern: CIVIC_ID_RE, max: 96 });
  const surface = validateEnum(errors, raw.surface, MODERATION_CLASSES, 'surface');
  const policyVersion = validateString(errors, raw.policyVersion, 'policyVersion', { pattern: /^policy_[a-z0-9_:-]{4,88}$/ });
  const reviewType = validateEnum(errors, raw.reviewType, MODERATION_REVIEW_TYPES, 'reviewType');
  const status = validateEnum(errors, raw.status, MODERATION_REVIEW_STATUSES, 'status');
  const requestedBy = validateActor(errors, raw.requestedBy, 'requestedBy', { allowAgent: false });
  const reviewerKind = validateEnum(errors, raw.reviewerKind, new Set(['system', 'human']), 'reviewerKind');
  if (reviewType === 'appeal' && reviewerKind !== 'human') errors.push('reviewerKind must be human for appeals');
  const sourceRefs = validateStringArray(errors, raw.sourceRefs || [], 'sourceRefs', { maxItems: 8, maxLen: 96, required: false });
  const reasons = validateStringArray(errors, raw.reasons, 'reasons', { maxItems: 8, maxLen: 120 });
  const privacy = validatePrivacy(errors, raw.privacy, 'privacy');
  const privatePaths = findPrivateData(raw);
  if (privatePaths.length) errors.push(`private data forbidden: ${privatePaths.join(', ')}`);
  return {
    ok: errors.length === 0,
    errors,
    value: errors.length ? null : {
      schemaVersion: CIVIC_SCHEMA_VERSION,
      reviewId,
      decisionId,
      subjectRef,
      surface,
      policyVersion,
      reviewType,
      status,
      requestedBy,
      reviewerKind,
      sourceRefs,
      reasons,
      privacy
    }
  };
}

function validateCivicAction(raw = {}) {
  const errors = [];
  if (!isPlainObject(raw)) return { ok: false, errors: ['civic action must be object'] };
  validateSchemaVersion(errors, raw);
  const actionId = validateString(errors, raw.actionId, 'actionId', { pattern: /^action_[a-z0-9_:-]{4,88}$/ });
  const proposalId = validateString(errors, raw.proposalId, 'proposalId', { pattern: /^proposal_[a-z0-9_:-]{4,88}$/ });
  const effectType = validateEnum(errors, raw.effectType, CIVIC_ACTION_EFFECTS, 'effectType');
  const executionAuthority = isPlainObject(raw.executionAuthority) ? raw.executionAuthority : {};
  if (!isPlainObject(raw.executionAuthority)) errors.push('executionAuthority required');
  const authorityKind = validateEnum(errors, executionAuthority.kind, new Set(['human_approved', 'delegated']), 'executionAuthority.kind');
  const authorityReceiptId = validateString(errors, executionAuthority.receiptId, 'executionAuthority.receiptId', { pattern: /^receipt_[a-z0-9_:-]{4,88}$/ });
  const handlerName = validateString(errors, raw.handlerName, 'handlerName', { pattern: TOOL_NAME_RE, max: 96 });
  if (effectType && handlerName && handlerName !== CIVIC_ACTION_EFFECT_HANDLERS[effectType]) {
    errors.push(`handlerName must match effectType ${effectType}`);
  }
  const beforeSummary = validateString(errors, raw.beforeSummary, 'beforeSummary', { max: 480 });
  const afterSummary = validateString(errors, raw.afterSummary, 'afterSummary', { max: 480 });
  const auditLedgerEntryId = validateString(errors, raw.auditLedgerEntryId, 'auditLedgerEntryId', { pattern: /^audit_[a-z0-9_:-]{4,88}$/ });
  const rollbackId = validateString(errors, raw.rollbackId, 'rollbackId', { pattern: /^rollback_[a-z0-9_:-]{4,88}$/ });
  const idempotencyKey = validateString(errors, raw.idempotencyKey, 'idempotencyKey', { pattern: CIVIC_ID_RE, max: 96 });
  const privatePaths = findPrivateData(raw);
  if (privatePaths.length) errors.push(`private data forbidden: ${privatePaths.join(', ')}`);
  return {
    ok: errors.length === 0,
    errors,
    value: errors.length ? null : {
      schemaVersion: CIVIC_SCHEMA_VERSION,
      actionId,
      proposalId,
      effectType,
      executionAuthority: {
        kind: authorityKind,
        receiptId: authorityReceiptId
      },
      handlerName,
      beforeSummary,
      afterSummary,
      auditLedgerEntryId,
      rollbackId,
      idempotencyKey
    }
  };
}

function validateAuditLedgerEntry(raw = {}) {
  const errors = [];
  if (!isPlainObject(raw)) return { ok: false, errors: ['audit ledger entry must be object'] };
  validateSchemaVersion(errors, raw);
  const entryId = validateString(errors, raw.entryId, 'entryId', { pattern: /^audit_[a-z0-9_:-]{4,88}$/ });
  const actor = validateActor(errors, raw.actor, 'actor');
  const actionType = validateEnum(errors, raw.actionType, AUDIT_ACTION_TYPES, 'actionType');
  const objectRef = validateString(errors, raw.objectRef, 'objectRef', { pattern: CIVIC_ID_RE, max: 96 });
  const idempotencyKey = validateString(errors, raw.idempotencyKey, 'idempotencyKey', { pattern: CIVIC_ID_RE, max: 96 });
  const beforeHash = validateString(errors, raw.beforeHash, 'beforeHash', { pattern: HASH_RE, max: 80 });
  const afterHash = validateString(errors, raw.afterHash, 'afterHash', { pattern: HASH_RE, max: 80 });
  const createdAtMs = validateNumber(errors, raw.createdAtMs, 'createdAtMs', { min: 1 });
  const migrationVersion = validateString(errors, raw.migrationVersion, 'migrationVersion', { pattern: /^v[0-9]+(?:\.[0-9]+){0,2}$/i, max: 24 });
  if (raw.replayable !== true) errors.push('replayable must be true');
  const rollbackId = raw.rollbackId === undefined || raw.rollbackId === null || raw.rollbackId === ''
    ? ''
    : validateString(errors, raw.rollbackId, 'rollbackId', { pattern: /^rollback_[a-z0-9_:-]{4,88}$/ });
  const privacy = validatePrivacy(errors, raw.privacy, 'privacy');
  const privatePaths = findPrivateData(raw);
  if (privatePaths.length) errors.push(`private data forbidden: ${privatePaths.join(', ')}`);
  return {
    ok: errors.length === 0,
    errors,
    value: errors.length ? null : {
      schemaVersion: CIVIC_SCHEMA_VERSION,
      entryId,
      actor,
      actionType,
      objectRef,
      idempotencyKey,
      beforeHash,
      afterHash,
      createdAtMs,
      migrationVersion,
      replayable: raw.replayable === true,
      rollbackId,
      privacy
    }
  };
}

function validateRollbackPlan(raw = {}) {
  const errors = [];
  const value = normalizeRollbackPlan(errors, raw, 'rollbackPlan');
  const privatePaths = findPrivateData(raw);
  if (privatePaths.length) errors.push(`private data forbidden: ${privatePaths.join(', ')}`);
  return {
    ok: errors.length === 0,
    errors,
    value: errors.length ? null : value
  };
}

function validateV6CivicSchema(kind, raw = {}) {
  const validators = {
    proposal: validateCivicProposal,
    vote: validateCivicVote,
    delegation: validateCivicDelegation,
    institution: validateCivicInstitution,
    institutionAmendment: validateCivicInstitutionAmendment,
    publicWorksProject: validatePublicWorksProject,
    publicWorksContribution: validatePublicWorksContribution,
    reputation: validateReputationRecord,
    reputationDispute: validateReputationDispute,
    moderation: validateModerationDecision,
    moderationReview: validateModerationReview,
    action: validateCivicAction,
    audit: validateAuditLedgerEntry,
    rollback: validateRollbackPlan
  };
  const validator = validators[String(kind || '')];
  if (!validator) return { ok: false, errors: [`unknown civic schema kind: ${kind}`], value: null };
  return validator(raw);
}

module.exports = {
  AUDIT_ACTION_TYPES,
  CIVIC_ACTION_EFFECT_HANDLERS,
  CIVIC_SCHEMA_VERSION,
  MODERATION_CLASSES,
  PROPOSAL_SCOPES,
  validateAuditLedgerEntry,
  validateCivicAction,
  validateCivicDelegation,
  validateCivicInstitutionAmendment,
  validateCivicInstitution,
  validateCivicProposal,
  validateCivicVote,
  validateModerationDecision,
  validateModerationReview,
  validatePublicWorksContribution,
  validatePublicWorksProject,
  validateReputationDispute,
  validateReputationRecord,
  validateRollbackPlan,
  validateV6CivicSchema
};
