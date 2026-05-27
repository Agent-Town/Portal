const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { V6_WORLD_FEATURE_FLAG, parseWorldGridFeatureFlags } = require('../server/world_grid/feature_flags');
const { CIVIC_SCHEMA_VERSION } = require('../server/world_civilization/schemas');
const { createCivicAuditLedger } = require('../server/world_civilization/audit_ledger');
const { createCivicDelegationStore } = require('../server/world_civilization/delegations');
const { buildV6CivicMutationSecurityEnvelope } = require('../server/world_civilization/mutation_security');
const {
  MODERATION_STATUS_APPROVED,
  MODERATION_STATUS_NEEDS_REVIEW,
  MODERATION_STATUS_REJECTED,
  PROPOSAL_STATUS_DRAFTED,
  PROPOSAL_STATUS_READY_FOR_VOTE,
  PROPOSAL_STATUS_REJECTED,
  REQUIRED_PROPOSAL_INTAKE_EVIDENCE_CHECKS,
  REQUIRED_PROPOSAL_INTAKE_READINESS_CHECKS,
  REQUIRED_PROPOSAL_SUBMISSION_ENVELOPE_CHECKS,
  REQUIRED_PROPOSAL_SUBMISSION_SURFACES,
  V6_PROPOSAL_INTAKE_READINESS_GATE_VERSION,
  V6_PROPOSAL_REVIEW_QUEUE_VERSION,
  V6_PROPOSAL_SUBMISSION_ENVELOPE_VERSION,
  assertV6ProposalIntakeReadinessGateSafe,
  assertV6ProposalSubmissionEnvelopeSafe,
  buildV6ProposalIntakeReadinessGate,
  buildV6ProposalSubmissionEnvelope,
  createCivicProposalStore
} = require('../server/world_civilization/proposals');

function withTempProposalStore(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-proposals-'));
  const proposalPath = path.join(dir, 'proposals.sqlite');
  const auditPath = path.join(dir, 'audit.sqlite');
  const auditLedger = createCivicAuditLedger({ sqlitePath: auditPath });
  const store = createCivicProposalStore({ sqlitePath: proposalPath, auditLedger });
  try {
    return fn({ auditLedger, auditPath, proposalPath, store });
  } finally {
    store.close();
    auditLedger.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function withTempProposalAndDelegationStore(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-proposal-submission-'));
  const auditPath = path.join(dir, 'audit.sqlite');
  const auditLedger = createCivicAuditLedger({ sqlitePath: auditPath });
  const proposalStore = createCivicProposalStore({ sqlitePath: path.join(dir, 'proposals.sqlite'), auditLedger });
  const delegationStore = createCivicDelegationStore({ sqlitePath: path.join(dir, 'delegations.sqlite'), auditLedger });
  try {
    return fn({ auditLedger, delegationStore, proposalStore });
  } finally {
    proposalStore.close();
    delegationStore.close();
    auditLedger.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function headers(overrides = {}) {
  return {
    host: 'portal.local',
    origin: 'https://portal.local',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'empty',
    ...overrides
  };
}

function proposal(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    proposalId: 'proposal_public_works_bridge_001',
    proposer: {
      kind: 'human',
      accountId: 'acct_v6_human_001'
    },
    scope: {
      kind: 'public_works',
      targetId: 'district_great_ridge'
    },
    affectedPublicState: ['public_works:gorge_bridge'],
    effectPreview: {
      effectType: 'public_works_accounting',
      mutationMode: 'preview_only',
      summary: 'Preview bridge accounting without applying it.'
    },
    moderationClass: 'public_works',
    expiresAtMs: 4_102_444_800_000,
    idempotencyKey: 'idem_proposal_bridge_001',
    rollbackPlan: {
      planId: 'rollbackplan_public_works_001',
      strategy: 'Restore previous public works accounting snapshot.',
      canRollback: true,
      irreversibleEffects: [],
      maxRollbackMs: 86_400_000
    },
    privacy: {
      redacted: true,
      privateDataIncluded: false,
      dataClasses: ['public_profile', 'public_world_state']
    },
    ...overrides
  };
}

function agentProposal(overrides = {}) {
  return proposal({
    proposalId: 'proposal_agent_public_works_bridge_001',
    proposer: {
      kind: 'agent',
      accountId: 'acct_v6_human_001',
      agentId: 'agent_v6_delegate_001'
    },
    idempotencyKey: 'idem_proposal_agent_bridge_001',
    ...overrides
  });
}

function delegation(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    delegationId: 'delegation_proposal_submission_001',
    principalAccountId: 'acct_v6_human_001',
    delegateAgentId: 'agent_v6_delegate_001',
    scope: 'proposal_drafting',
    expiresAtMs: 4_102_444_800_000,
    maxActions: 2,
    approvalReceiptId: 'receipt_v6_agent_proposal_001',
    revocable: true,
    canExecuteCivicEffects: false,
    ...overrides
  };
}

function moderationDecision(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    decisionId: 'moderation_proposal_bridge_001',
    subjectRef: 'proposal_public_works_bridge_001',
    surface: 'public_works',
    status: 'approved',
    policyVersion: 'policy_v6_public_001',
    reviewerKind: 'system',
    reasons: ['Public-safe proposal text.'],
    redactedFields: [],
    ...overrides
  };
}

function mutationSecurityEnvelope(overrides = {}) {
  return buildV6CivicMutationSecurityEnvelope({
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    includeResearchMutation: true,
    source: 'proposal_submission_test',
    headers: headers(),
    env: {
      NODE_ENV: 'production',
      WORLD_GRID_MUTATION_RATE_LIMIT_MAX: '100',
      WORLD_GRID_MUTATION_RATE_LIMIT_WINDOW_MS: '60000'
    },
    session: {
      authenticated: true,
      accountId: 'acct_v6_human_001'
    },
    wallet: {
      serverVerified: true,
      subjectAccountId: 'acct_v6_human_001',
      walletAddress: '0x0000000000000000000000000000000000000001'
    },
    actor: {
      kind: 'human',
      accountId: 'acct_v6_human_001'
    },
    owner: {
      ownerAccountId: 'acct_v6_human_001'
    },
    surface: 'proposal.submit_for_review',
    idempotencyKey: 'idem_proposal_bridge_001',
    csrfVerified: true,
    nowMs: 1_779_790_000_000,
    ...overrides
  });
}

function proposalIntakeReadinessEvidence(overrides = {}) {
  return {
    status: 'complete',
    executionStatus: 'not_executable',
    runtimeExposed: false,
    playerVisible: false,
    normalGameplayExposure: false,
    mutatesWorldState: false,
    executesProposalEffects: false,
    exposesCivicTools: false,
    exposesPrivateData: false,
    routeToolSubmissionReviewed: true,
    reviewQueueIntegrated: true,
    workerFirstOriginReviewed: true,
    mutationSecurityEnvelopeReviewed: true,
    publicTextPrivacyReviewed: true,
    privateDataExcluded: true,
    auditRowsCovered: true,
    idempotencyReviewed: true,
    noBackendShortcuts: true,
    checks: [...REQUIRED_PROPOSAL_INTAKE_EVIDENCE_CHECKS],
    submissionSurfaces: [...REQUIRED_PROPOSAL_SUBMISSION_SURFACES],
    ...overrides
  };
}

test('V6 proposal intake readiness gate is hidden without explicit research opt-in and V6 flag', () => {
  const noResearchOptIn = buildV6ProposalIntakeReadinessGate({
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence: proposalIntakeReadinessEvidence()
  });
  const broadV5Override = buildV6ProposalIntakeReadinessGate({
    includeResearchProposalIntake: true,
    featureFlags: parseWorldGridFeatureFlags('all'),
    evidence: proposalIntakeReadinessEvidence()
  });

  for (const report of [noResearchOptIn, broadV5Override]) {
    assert.equal(report.version, V6_PROPOSAL_INTAKE_READINESS_GATE_VERSION);
    assert.equal(report.available, false);
    assert.equal(report.researchReady, false);
    assert.equal(report.releaseReady, false);
    assert.equal(report.failClosed, true);
    assert.equal(report.runtimeExposed, false);
    assert.equal(report.playerVisible, false);
    assert.equal(report.normalGameplayExposure, false);
    assert.equal(report.mutatesWorldState, false);
    assert.equal(report.executesProposalEffects, false);
    assert.equal(report.exposesCivicTools, false);
    assert.equal(report.exposesPrivateData, false);
    assert.equal(report.executionStatus, 'not_executable');
    assert.deepEqual(report.checks, []);
    assert.deepEqual(assertV6ProposalIntakeReadinessGateSafe(report), { ok: true, errors: [] });
  }
});

test('V6 proposal intake readiness gate records route tool and review queue evidence without execution', () => {
  const report = buildV6ProposalIntakeReadinessGate({
    includeResearchProposalIntake: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    source: 'node_test',
    evidence: proposalIntakeReadinessEvidence()
  });

  assert.equal(report.available, true);
  assert.equal(report.source, 'node_test');
  assert.equal(report.researchReady, true);
  assert.equal(report.releaseReady, false);
  assert.equal(report.failClosed, false);
  assert.equal(report.runtimeExposed, false);
  assert.equal(report.playerVisible, false);
  assert.equal(report.normalGameplayExposure, false);
  assert.equal(report.mutatesWorldState, false);
  assert.equal(report.executesProposalEffects, false);
  assert.equal(report.exposesCivicTools, false);
  assert.equal(report.exposesPrivateData, false);
  assert.equal(report.executionStatus, 'not_executable');
  assert.deepEqual(report.checks.map((entry) => entry.key), REQUIRED_PROPOSAL_INTAKE_READINESS_CHECKS);
  assert.deepEqual(report.evidence.requiredChecks, REQUIRED_PROPOSAL_INTAKE_EVIDENCE_CHECKS);
  assert.deepEqual(report.evidence.missingChecks, []);
  assert.deepEqual(report.evidence.requiredSubmissionSurfaces, REQUIRED_PROPOSAL_SUBMISSION_SURFACES);
  assert.deepEqual(report.evidence.missingSubmissionSurfaces, []);
  assert.deepEqual(assertV6ProposalIntakeReadinessGateSafe(report), { ok: true, errors: [] });
});

test('V6 proposal intake readiness gate fails closed without route tool and queue evidence', () => {
  const report = buildV6ProposalIntakeReadinessGate({
    includeResearchProposalIntake: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence: proposalIntakeReadinessEvidence({
      checks: REQUIRED_PROPOSAL_INTAKE_EVIDENCE_CHECKS.filter((check) => (
        check !== 'worker_tool_submission_envelope'
        && check !== 'mutation_security_envelope'
        && check !== 'review_queue_index'
        && check !== 'public_text_rendering_review'
        && check !== 'no_backend_shortcuts'
      )),
      submissionSurfaces: ['human_route_submission'],
      routeToolSubmissionReviewed: false,
      reviewQueueIntegrated: false,
      workerFirstOriginReviewed: false,
      mutationSecurityEnvelopeReviewed: false,
      publicTextPrivacyReviewed: false,
      noBackendShortcuts: false
    })
  });

  assert.equal(report.available, true);
  assert.equal(report.researchReady, false);
  assert.equal(report.releaseReady, false);
  assert.equal(report.failClosed, true);
  assert.deepEqual(report.evidence.missingChecks, [
    'worker_tool_submission_envelope',
    'mutation_security_envelope',
    'review_queue_index',
    'public_text_rendering_review',
    'no_backend_shortcuts'
  ]);
  assert.deepEqual(report.evidence.missingSubmissionSurfaces, ['worker_tool_submission', 'review_queue']);
  assert.deepEqual(report.errors, [
    'PROPOSAL_INTAKE_EVIDENCE_REQUIRED',
    'PROPOSAL_ROUTE_TOOL_SUBMISSION_REQUIRED',
    'PROPOSAL_REVIEW_QUEUE_INTEGRATION_REQUIRED',
    'PROPOSAL_WORKER_FIRST_ORIGIN_REQUIRED',
    'PROPOSAL_MUTATION_SECURITY_ENVELOPE_REQUIRED',
    'PROPOSAL_PUBLIC_TEXT_PRIVACY_REVIEW_REQUIRED'
  ]);
  assert.deepEqual(assertV6ProposalIntakeReadinessGateSafe(report), { ok: true, errors: [] });
});

test('V6 proposal intake assertion rejects visible civic tool or effect execution drift', () => {
  const report = buildV6ProposalIntakeReadinessGate({
    includeResearchProposalIntake: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    evidence: proposalIntakeReadinessEvidence()
  });
  const unsafe = {
    ...report,
    releaseReady: true,
    runtimeExposed: true,
    playerVisible: true,
    normalGameplayExposure: true,
    mutatesWorldState: true,
    executesProposalEffects: true,
    exposesCivicTools: true,
    exposesPrivateData: true,
    executionStatus: 'executes',
    evidence: {
      ...report.evidence,
      runtimeExposed: true,
      playerVisible: true,
      normalGameplayExposure: true,
      mutatesWorldState: true,
      executesProposalEffects: true,
      exposesCivicTools: true,
      exposesPrivateData: true
    }
  };
  const result = assertV6ProposalIntakeReadinessGateSafe(unsafe);

  assert.equal(result.ok, false);
  assert.match(result.errors.join(','), /V6_PROPOSAL_INTAKE_READINESS_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_PROPOSAL_INTAKE_READINESS_PLAYER_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_PROPOSAL_INTAKE_READINESS_NORMAL_GAMEPLAY_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_PROPOSAL_INTAKE_READINESS_WORLD_MUTATION_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_PROPOSAL_INTAKE_READINESS_EFFECT_EXECUTION_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_PROPOSAL_INTAKE_READINESS_CIVIC_TOOL_EXPOSURE_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_PROPOSAL_INTAKE_READINESS_PRIVATE_DATA_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_PROPOSAL_INTAKE_READINESS_NON_EXECUTING_REQUIRED/);
  assert.match(result.errors.join(','), /V6_PROPOSAL_INTAKE_READINESS_RELEASE_READY_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_PROPOSAL_INTAKE_READINESS_EVIDENCE_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_PROPOSAL_INTAKE_READINESS_EVIDENCE_EFFECT_EXECUTION_FORBIDDEN/);
});

test('V6 proposal submission envelope is hidden without explicit research opt-in and V6 flag', () => {
  const noResearchOptIn = buildV6ProposalSubmissionEnvelope({
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    sourceSurface: 'human_route_submission',
    proposal: proposal(),
    approvalReceiptId: 'approval_proposal_bridge_001',
    mutationSecurityEnvelope: mutationSecurityEnvelope()
  });
  const broadV5Override = buildV6ProposalSubmissionEnvelope({
    includeResearchProposalSubmission: true,
    featureFlags: parseWorldGridFeatureFlags('all'),
    sourceSurface: 'human_route_submission',
    proposal: proposal(),
    approvalReceiptId: 'approval_proposal_bridge_001',
    mutationSecurityEnvelope: mutationSecurityEnvelope()
  });

  for (const envelope of [noResearchOptIn, broadV5Override]) {
    assert.equal(envelope.version, V6_PROPOSAL_SUBMISSION_ENVELOPE_VERSION);
    assert.equal(envelope.available, false);
    assert.equal(envelope.accepted, false);
    assert.equal(envelope.failClosed, true);
    assert.equal(envelope.runtimeExposed, false);
    assert.equal(envelope.playerVisible, false);
    assert.equal(envelope.normalGameplayExposure, false);
    assert.equal(envelope.mutatesWorldState, false);
    assert.equal(envelope.executesProposalEffects, false);
    assert.equal(envelope.exposesCivicTools, false);
    assert.equal(envelope.exposesPrivateData, false);
    assert.equal(envelope.executionStatus, 'not_executable');
    assert.deepEqual(envelope.checks, []);
    assert.deepEqual(assertV6ProposalSubmissionEnvelopeSafe(envelope), { ok: true, errors: [] });
  }
});

test('V6 proposal submission accepts human route envelope and queues draft without effects', () => withTempProposalStore(({
  auditLedger,
  store
}) => {
  const submitted = store.submitProposalForReview({
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    includeResearchProposalSubmission: true,
    source: 'node_test',
    sourceSurface: 'human_route_submission',
    proposal: proposal(),
    approvalReceiptId: 'approval_proposal_bridge_001',
    mutationSecurityEnvelope: mutationSecurityEnvelope()
  }, { nowMs: 1_779_790_000_000 });
  const duplicate = store.submitProposalForReview({
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    includeResearchProposalSubmission: true,
    source: 'node_test',
    sourceSurface: 'human_route_submission',
    proposal: proposal(),
    approvalReceiptId: 'approval_proposal_bridge_001',
    mutationSecurityEnvelope: mutationSecurityEnvelope()
  }, { nowMs: 1_779_790_100_000 });

  assert.equal(submitted.status, PROPOSAL_STATUS_DRAFTED);
  assert.equal(submitted.moderationStatus, MODERATION_STATUS_NEEDS_REVIEW);
  assert.equal(submitted.submissionEnvelope.version, V6_PROPOSAL_SUBMISSION_ENVELOPE_VERSION);
  assert.equal(submitted.submissionEnvelope.accepted, true);
  assert.equal(submitted.submissionEnvelope.releaseReady, false);
  assert.equal(submitted.submissionEnvelope.runtimeExposed, false);
  assert.equal(submitted.submissionEnvelope.playerVisible, false);
  assert.equal(submitted.submissionEnvelope.normalGameplayExposure, false);
  assert.equal(submitted.submissionEnvelope.mutatesWorldState, false);
  assert.equal(submitted.submissionEnvelope.executesProposalEffects, false);
  assert.equal(submitted.submissionEnvelope.exposesCivicTools, false);
  assert.equal(submitted.submissionEnvelope.exposesPrivateData, false);
  assert.equal(submitted.submissionEnvelope.executionStatus, 'not_executable');
  assert.equal(submitted.submissionEnvelope.approvalReceiptId, 'approval_proposal_bridge_001');
  assert.equal(submitted.submissionEnvelope.sourceSurface, 'human_route_submission');
  assert.deepEqual(submitted.submissionEnvelope.checks.map((entry) => entry.key), REQUIRED_PROPOSAL_SUBMISSION_ENVELOPE_CHECKS);
  assert.deepEqual(assertV6ProposalSubmissionEnvelopeSafe(submitted.submissionEnvelope), { ok: true, errors: [] });
  assert.equal(duplicate.duplicate, true);
  assert.equal(store.count(), 1);
  assert.equal(auditLedger.replay().filter((row) => row.entry.actionType === 'proposal.created').length, 1);
  assert.deepEqual(
    store.getProposalReviewQueueSnapshot({ nowMs: 1_779_790_200_000 }).entries.map((entry) => entry.proposalId),
    ['proposal_public_works_bridge_001']
  );
  assert.equal(typeof store.applyProposal, 'undefined');
  assert.equal(typeof store.executeProposal, 'undefined');
}));

test('V6 proposal submission accepts worker tool envelope only with OpenClaw Lite delegation proof', () => withTempProposalAndDelegationStore(({
  auditLedger,
  delegationStore,
  proposalStore
}) => {
  delegationStore.recordDelegation(delegation(), { nowMs: 1_779_789_900_000 });
  const workerMutation = mutationSecurityEnvelope({
    actor: {
      kind: 'agent',
      accountId: 'acct_v6_human_001',
      agentId: 'agent_v6_delegate_001'
    },
    delegation: {
      delegationId: 'delegation_proposal_submission_001',
      principalAccountId: 'acct_v6_human_001',
      delegateAgentId: 'agent_v6_delegate_001',
      approvalReceiptId: 'receipt_v6_agent_proposal_001'
    },
    delegationStore,
    requiredDelegationScope: 'proposal_drafting',
    idempotencyKey: 'idem_proposal_agent_bridge_001'
  });
  const denied = buildV6ProposalSubmissionEnvelope({
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    includeResearchProposalSubmission: true,
    sourceSurface: 'worker_tool_submission',
    proposal: agentProposal(),
    approvalReceiptId: 'approval_agent_proposal_bridge_001',
    mutationSecurityEnvelope: workerMutation,
    workerEvidence: {
      origin: 'backend_route',
      skillContextLoaded: true,
      workerTrafficTrace: true,
      backendShortcut: true
    }
  });
  const submitted = proposalStore.submitProposalForReview({
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    includeResearchProposalSubmission: true,
    sourceSurface: 'worker_tool_submission',
    proposal: agentProposal(),
    approvalReceiptId: 'approval_agent_proposal_bridge_001',
    mutationSecurityEnvelope: workerMutation,
    workerEvidence: {
      origin: 'openclaw_lite_worker',
      skillContextLoaded: true,
      workerTrafficTrace: true,
      backendShortcut: false
    }
  }, { nowMs: 1_779_790_100_000 });

  assert.equal(denied.accepted, false);
  assert.equal(denied.failClosed, true);
  assert.match(denied.errors.join(','), /PROPOSAL_SUBMISSION_WORKER_ORIGIN_REQUIRED/);
  assert.deepEqual(assertV6ProposalSubmissionEnvelopeSafe(denied), { ok: true, errors: [] });
  assert.equal(submitted.proposalId, 'proposal_agent_public_works_bridge_001');
  assert.equal(submitted.proposerKind, 'agent');
  assert.equal(submitted.proposerAgentId, 'agent_v6_delegate_001');
  assert.equal(submitted.submissionEnvelope.accepted, true);
  assert.equal(submitted.submissionEnvelope.workerEvidence.origin, 'openclaw_lite_worker');
  assert.equal(submitted.submissionEnvelope.mutationSecurity.ok, true);
  assert.deepEqual(
    proposalStore.getProposalReviewQueueSnapshot({ nowMs: 1_779_790_200_000 }).entries.map((entry) => entry.proposalId),
    ['proposal_agent_public_works_bridge_001']
  );
  assert.equal(auditLedger.replay().filter((row) => row.entry.actionType === 'proposal.created').length, 1);
}));

test('V6 proposal submission denial fails closed before persistence', () => withTempProposalStore(({
  auditLedger,
  store
}) => {
  assert.throws(
    () => store.submitProposalForReview({
      featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
      includeResearchProposalSubmission: true,
      sourceSurface: 'human_route_submission',
      proposal: proposal(),
      approvalReceiptId: '',
      mutationSecurityEnvelope: mutationSecurityEnvelope({
        csrfVerified: false,
        idempotencyKey: 'wrong_idempotency_key'
      })
    }, { nowMs: 1_779_790_000_000 }),
    /CIVIC_PROPOSAL_SUBMISSION_DENIED/
  );

  assert.equal(store.count(), 0);
  assert.equal(auditLedger.count(), 0);
  assert.deepEqual(store.getProposalReviewQueueSnapshot({ nowMs: 1_779_790_100_000 }).entries, []);
}));

test('V6 proposal lifecycle drafts bounded proposals without executing effects', () => withTempProposalStore(({ auditLedger, store }) => {
  const drafted = store.draftProposal(proposal(), { nowMs: 1_779_784_000_000 });

  assert.equal(drafted.proposalId, 'proposal_public_works_bridge_001');
  assert.equal(drafted.status, PROPOSAL_STATUS_DRAFTED);
  assert.equal(drafted.moderationStatus, MODERATION_STATUS_NEEDS_REVIEW);
  assert.equal(drafted.auditEntryId, 'audit_proposal_public_works_bridge_001');
  assert.equal(store.count(), 1);
  assert.equal(auditLedger.count(), 1);
  assert.deepEqual(auditLedger.replay().map((row) => row.entry.actionType), ['proposal.created']);
  const audit = auditLedger.getByEntryId('audit_proposal_public_works_bridge_001').entry;
  assert.match(audit.beforeSummary, /No civic proposal existed/);
  assert.match(audit.afterSummary, /preview-only public_works_accounting/);
  assert.equal(audit.beforeSummary.includes('Hash-only'), false);
  assert.equal(audit.afterSummary.includes('Hash-only'), false);
  assert.equal(typeof store.applyProposal, 'undefined');
  assert.equal(typeof store.executeProposal, 'undefined');

  const preview = store.previewProposalEffect(drafted.proposalId);
  assert.equal(preview.effectPreview.mutationMode, 'preview_only');
  assert.equal(auditLedger.count(), 1);
}));

test('V6 proposal review queue lists only live drafted proposals awaiting moderation', () => withTempProposalStore(({ auditLedger, store }) => {
  store.draftProposal(proposal(), { nowMs: 1_779_784_000_000 });
  store.draftProposal(proposal({
    proposalId: 'proposal_public_works_bridge_002',
    idempotencyKey: 'idem_proposal_bridge_002',
    scope: {
      kind: 'public_works',
      targetId: 'district_great_ridge'
    }
  }), { nowMs: 1_779_784_010_000 });
  store.draftProposal(proposal({
    proposalId: 'proposal_public_works_bridge_reviewed',
    idempotencyKey: 'idem_proposal_bridge_reviewed',
    scope: {
      kind: 'public_works',
      targetId: 'district_great_ridge'
    }
  }), { nowMs: 1_779_784_020_000 });
  store.draftProposal(proposal({
    proposalId: 'proposal_public_works_bridge_expiring',
    idempotencyKey: 'idem_proposal_bridge_expiring',
    expiresAtMs: 1_779_784_050_000,
    scope: {
      kind: 'public_works',
      targetId: 'district_river_bend'
    }
  }), { nowMs: 1_779_784_030_000 });
  store.recordProposalReview(moderationDecision({
    decisionId: 'moderation_proposal_bridge_reviewed',
    subjectRef: 'proposal_public_works_bridge_reviewed'
  }), { nowMs: 1_779_784_040_000 });

  const queue = store.getProposalReviewQueueSnapshot({ nowMs: 1_779_784_045_000 });

  assert.equal(queue.version, V6_PROPOSAL_REVIEW_QUEUE_VERSION);
  assert.equal(queue.status, 'research_only');
  assert.equal(queue.runtimeExposed, false);
  assert.equal(queue.playerVisible, false);
  assert.equal(queue.normalGameplayExposure, false);
  assert.equal(queue.mutatesWorldState, false);
  assert.equal(queue.executesProposalEffects, false);
  assert.equal(queue.exposesCivicTools, false);
  assert.equal(queue.exposesPrivateData, false);
  assert.equal(queue.executionStatus, 'not_executable');
  assert.equal(queue.count, 3);
  assert.deepEqual(queue.entries.map((entry) => entry.proposalId), [
    'proposal_public_works_bridge_001',
    'proposal_public_works_bridge_002',
    'proposal_public_works_bridge_expiring'
  ]);
  assert.deepEqual(queue.entries.map((entry) => entry.queuePosition), [1, 2, 3]);
  assert.equal(queue.entries[0].queueId, 'proposal_review_queue:proposal_public_works_bridge_001');
  assert.equal(queue.entries[0].reviewSurface, 'public_works');
  assert.equal(queue.entries[0].effectType, 'public_works_accounting');
  assert.equal(queue.entries[0].affectedPublicStateCount, 1);
  assert.equal(queue.entries[0].expired, false);
  assert.equal(queue.entries[0].runtimeExposed, false);
  assert.equal(queue.entries[0].playerVisible, false);
  assert.equal(queue.entries[0].executesProposalEffects, false);
  assert.equal(typeof queue.entries[0].proposal, 'undefined');
  assert.equal(auditLedger.replay().filter((row) => row.entry.actionType === 'proposal.reviewed').length, 1);

  const scoped = store.getProposalReviewQueueSnapshot({
    scopeKind: 'public_works',
    scopeTargetId: 'district_great_ridge',
    nowMs: 1_779_784_045_000
  });
  assert.deepEqual(scoped.entries.map((entry) => entry.proposalId), [
    'proposal_public_works_bridge_001',
    'proposal_public_works_bridge_002'
  ]);

  const afterExpiry = store.getProposalReviewQueueSnapshot({ nowMs: 1_779_784_060_000 });
  assert.deepEqual(afterExpiry.entries.map((entry) => entry.proposalId), [
    'proposal_public_works_bridge_001',
    'proposal_public_works_bridge_002'
  ]);

  const withExpired = store.getProposalReviewQueueSnapshot({
    nowMs: 1_779_784_060_000,
    includeExpired: true
  });
  assert.deepEqual(withExpired.entries.map((entry) => entry.proposalId), [
    'proposal_public_works_bridge_001',
    'proposal_public_works_bridge_002',
    'proposal_public_works_bridge_expiring'
  ]);
  assert.equal(withExpired.entries.find((entry) => entry.proposalId === 'proposal_public_works_bridge_expiring').expired, true);
}));

test('V6 proposal lifecycle idempotency returns duplicates and rejects changed reuse', () => withTempProposalStore(({ auditLedger, store }) => {
  const first = store.draftProposal(proposal(), { nowMs: 1_779_784_000_000 });
  const duplicate = store.draftProposal(proposal(), { nowMs: 1_779_784_123_000 });

  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.proposalId, first.proposalId);
  assert.equal(store.count(), 1);
  assert.equal(auditLedger.count(), 1);
  assert.throws(
    () => store.draftProposal(proposal({
      proposalId: 'proposal_public_works_bridge_002',
      effectPreview: {
        effectType: 'public_works_accounting',
        mutationMode: 'preview_only',
        summary: 'Changed proposal content.'
      }
    }), { nowMs: 1_779_784_456_000 }),
    /CIVIC_PROPOSAL_IDEMPOTENCY_CONFLICT/
  );
  assert.equal(store.count(), 1);
  assert.equal(auditLedger.count(), 1);
}));

test('V6 proposal lifecycle rejects invalid, expired, and private-data proposals before persistence', () => withTempProposalStore(({ auditLedger, store }) => {
  assert.throws(
    () => store.draftProposal(proposal({
      effectPreview: {
        effectType: 'public_works_accounting',
        mutationMode: 'apply_now',
        summary: 'Apply immediately.'
      },
      debugTrace: {
        token: 'sk-test-secret-value'
      }
    }), { nowMs: 1_779_784_000_000 }),
    /CIVIC_PROPOSAL_INVALID/
  );
  assert.throws(
    () => store.draftProposal(proposal({
      proposalId: 'proposal_public_works_bridge_expired',
      idempotencyKey: 'idem_proposal_bridge_expired',
      expiresAtMs: 1_000
    }), { nowMs: 2_000 }),
    /CIVIC_PROPOSAL_EXPIRED/
  );
  assert.equal(store.count(), 0);
  assert.equal(auditLedger.count(), 0);
}));

test('V6 proposal lifecycle records moderation review transitions without executing effects', () => withTempProposalStore(({ auditLedger, store }) => {
  store.draftProposal(proposal(), { nowMs: 1_779_784_000_000 });
  const reviewed = store.recordProposalReview(moderationDecision(), { nowMs: 1_779_784_100_000 });
  const duplicate = store.recordProposalReview(moderationDecision(), { nowMs: 1_779_784_101_000 });

  assert.equal(reviewed.status, PROPOSAL_STATUS_READY_FOR_VOTE);
  assert.equal(reviewed.moderationStatus, MODERATION_STATUS_APPROVED);
  assert.equal(reviewed.reviewAuditEntryId, 'audit_proprev_moderation_proposal_bridge_001');
  assert.equal(duplicate.duplicate, true);
  assert.equal(store.count(), 1);
  assert.deepEqual(
    auditLedger.replay().map((row) => row.entry.actionType),
    ['proposal.created', 'proposal.reviewed']
  );
  assert.equal(auditLedger.getByEntryId(reviewed.reviewAuditEntryId).entry.actor.agentId, 'agent_system_moderation');
  assert.match(auditLedger.getByEntryId(reviewed.reviewAuditEntryId).entry.beforeSummary, /drafted\/needs_review/);
  assert.match(auditLedger.getByEntryId(reviewed.reviewAuditEntryId).entry.afterSummary, /ready_for_vote\/approved/);
  assert.equal(auditLedger.getByEntryId(reviewed.reviewAuditEntryId).entry.afterSummary.includes('Hash-only'), false);
  assert.equal(store.previewProposalEffect('proposal_public_works_bridge_001').status, PROPOSAL_STATUS_READY_FOR_VOTE);
  assert.equal(typeof store.applyProposal, 'undefined');
  assert.equal(typeof store.executeProposal, 'undefined');
}));

test('V6 proposal lifecycle can reject proposals through review transition', () => withTempProposalStore(({ auditLedger, store }) => {
  store.draftProposal(proposal({
    proposalId: 'proposal_public_works_bridge_reject_001',
    idempotencyKey: 'idem_proposal_bridge_reject_001'
  }), { nowMs: 1_779_784_000_000 });
  const rejected = store.recordProposalReview(moderationDecision({
    decisionId: 'moderation_proposal_bridge_reject_001',
    subjectRef: 'proposal_public_works_bridge_reject_001',
    status: 'rejected',
    reasons: ['Rejected for unsafe public wording.']
  }), { nowMs: 1_779_784_100_000 });

  assert.equal(rejected.status, PROPOSAL_STATUS_REJECTED);
  assert.equal(rejected.moderationStatus, MODERATION_STATUS_REJECTED);
  assert.equal(auditLedger.replay().filter((row) => row.entry.actionType === 'proposal.reviewed').length, 1);
}));

test('V6 proposal lifecycle rejects invalid review transitions before persistence', () => withTempProposalStore(({ auditLedger, store }) => {
  assert.throws(
    () => store.recordProposalReview(moderationDecision(), { nowMs: 1_779_784_100_000 }),
    /CIVIC_PROPOSAL_REVIEW_PROPOSAL_REQUIRED/
  );
  store.draftProposal(proposal(), { nowMs: 1_779_784_000_000 });
  assert.throws(
    () => store.recordProposalReview(moderationDecision({
      decisionId: ''
    }), { nowMs: 1_779_784_100_000 }),
    /CIVIC_PROPOSAL_REVIEW_MODERATION_DECISION_INVALID/
  );
  assert.throws(
    () => store.recordProposalReview(moderationDecision({
      surface: 'civic_text'
    }), { nowMs: 1_779_784_100_000 }),
    /CIVIC_PROPOSAL_REVIEW_SURFACE_MISMATCH/
  );
  assert.throws(
    () => store.recordProposalReview(moderationDecision({
      status: 'needs_review'
    }), { nowMs: 1_779_784_100_000 }),
    /CIVIC_PROPOSAL_REVIEW_STATUS_UNSUPPORTED/
  );
  assert.throws(
    () => store.recordProposalReview(moderationDecision(), { nowMs: 4_102_444_800_001 }),
    /CIVIC_PROPOSAL_REVIEW_EXPIRED/
  );
  assert.equal(store.getProposal('proposal_public_works_bridge_001').status, PROPOSAL_STATUS_DRAFTED);
  assert.equal(auditLedger.replay().filter((row) => row.entry.actionType === 'proposal.reviewed').length, 0);
}));

test('V6 proposal lifecycle persists across reopen and supports proposer listing', () => withTempProposalStore(({ auditLedger, auditPath, proposalPath, store }) => {
  store.draftProposal(proposal(), { nowMs: 1_779_784_000_000 });
  store.recordProposalReview(moderationDecision(), { nowMs: 1_779_784_100_000 });
  store.draftProposal(proposal({
    proposalId: 'proposal_public_works_bridge_queue',
    idempotencyKey: 'idem_proposal_bridge_queue'
  }), { nowMs: 1_779_784_200_000 });
  store.close();
  auditLedger.close();

  const reopenedAudit = createCivicAuditLedger({ sqlitePath: auditPath });
  const reopened = createCivicProposalStore({ sqlitePath: proposalPath, auditLedger: reopenedAudit });
  try {
    assert.equal(reopened.count(), 2);
    assert.equal(reopened.getProposal('proposal_public_works_bridge_001').status, PROPOSAL_STATUS_READY_FOR_VOTE);
    assert.deepEqual(
      reopened.listProposals({ proposerAccountId: 'acct_v6_human_001' }).map((entry) => entry.proposalId),
      ['proposal_public_works_bridge_001', 'proposal_public_works_bridge_queue']
    );
    assert.deepEqual(
      reopened.listProposals({ moderationStatus: MODERATION_STATUS_APPROVED }).map((entry) => entry.proposalId),
      ['proposal_public_works_bridge_001']
    );
    assert.deepEqual(
      reopened.getProposalReviewQueueSnapshot({ nowMs: 1_779_784_300_000 }).entries.map((entry) => entry.proposalId),
      ['proposal_public_works_bridge_queue']
    );
    assert.equal(reopenedAudit.count(), 3);
  } finally {
    reopened.close();
    reopenedAudit.close();
  }
}));
