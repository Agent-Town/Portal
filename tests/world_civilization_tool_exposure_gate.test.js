const test = require('node:test');
const assert = require('node:assert/strict');

const { REQUIRED_DEBUG_TABS } = require('../server/world_civilization/lab_surface');
const { V6_CIVIC_MUTATION_SECURITY_VERSION } = require('../server/world_civilization/mutation_security');
const {
  REQUIRED_EXPOSURE_CHECKS,
  REQUIRED_MUTATION_SECURITY_EVIDENCE_CHECKS,
  RUNTIME_TOOL_SOURCE,
  V6_CIVIC_TOOL_EXPOSURE_GATE_VERSION,
  WORKER_ORIGIN,
  assertV6CivicToolExposureGateSafe,
  buildV6CivicToolExposureGate
} = require('../server/world_civilization/tool_exposure_gate');
const { V6_WORLD_FEATURE_FLAG, parseWorldGridFeatureFlags } = require('../server/world_grid/feature_flags');
const { WORLD_GRID_TOOLS } = require('../server/world_grid/routes');

function workerEvidence(overrides = {}) {
  return {
    origin: WORKER_ORIGIN,
    backendShortcut: false,
    workerTrafficTrace: true,
    skillContextLoaded: true,
    sessionContextLinked: true,
    debugTabsAvailable: [...REQUIRED_DEBUG_TABS],
    ...overrides
  };
}

function mutationSecurityEvidence(overrides = {}) {
  return {
    version: V6_CIVIC_MUTATION_SECURITY_VERSION,
    status: 'complete',
    runtimeExposed: false,
    playerVisible: false,
    mutationApplied: false,
    checks: [
      'same_origin',
      'session_wallet_binding',
      'store_backed_delegation_proof',
      'delegation_scope_mismatch',
      'delegation_budget_read_only',
      'idempotency',
      'rate_limit',
      'runtime_hidden'
    ],
    ...overrides
  };
}

function readyGate(overrides = {}) {
  return buildV6CivicToolExposureGate({
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    includeResearchToolExposure: true,
    source: 'node_test',
    runtimeToolSource: RUNTIME_TOOL_SOURCE,
    runtimeTools: WORLD_GRID_TOOLS,
    workerEvidence: workerEvidence(),
    mutationSecurityVersion: V6_CIVIC_MUTATION_SECURITY_VERSION,
    mutationSecurityEvidence: mutationSecurityEvidence(),
    ...overrides
  });
}

test('V6 civic tool exposure gate is hidden without explicit research opt-in and V6 flag', () => {
  const noResearchOptIn = buildV6CivicToolExposureGate({
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    runtimeTools: WORLD_GRID_TOOLS
  });
  const broadV5Override = buildV6CivicToolExposureGate({
    includeResearchToolExposure: true,
    featureFlags: parseWorldGridFeatureFlags('all'),
    runtimeTools: WORLD_GRID_TOOLS
  });

  for (const report of [noResearchOptIn, broadV5Override]) {
    assert.equal(report.version, V6_CIVIC_TOOL_EXPOSURE_GATE_VERSION);
    assert.equal(report.available, false);
    assert.equal(report.researchReady, false);
    assert.equal(report.releaseReady, false);
    assert.equal(report.failClosed, true);
    assert.equal(report.runtimeExposed, false);
    assert.equal(report.playerVisible, false);
    assert.equal(report.productionEnabled, false);
    assert.deepEqual(report.draftTools, []);
    assert.deepEqual(report.civicRuntimeToolNames, []);
    assert.deepEqual(assertV6CivicToolExposureGateSafe(report), { ok: true, errors: [] });
  }
});

test('V6 civic tool exposure gate requires worker origin observability and mutation security evidence', () => {
  const report = readyGate();

  assert.equal(report.available, true);
  assert.equal(report.researchReady, true);
  assert.equal(report.releaseReady, false);
  assert.equal(report.failClosed, false);
  assert.equal(report.runtimeToolSource, RUNTIME_TOOL_SOURCE);
  assert.equal(report.workerOrigin, WORKER_ORIGIN);
  assert.deepEqual(report.missingDebugTabs, []);
  assert.equal(report.mutationSecurityVersion, V6_CIVIC_MUTATION_SECURITY_VERSION);
  assert.equal(report.mutationSecurityEvidence.ok, true);
  assert.deepEqual(report.mutationSecurityEvidence.requiredChecks, REQUIRED_MUTATION_SECURITY_EVIDENCE_CHECKS);
  assert.deepEqual(report.mutationSecurityEvidence.missingChecks, []);
  assert.deepEqual(report.checks.map((entry) => entry.key), REQUIRED_EXPOSURE_CHECKS);
  assert.ok(report.checks.every((entry) => entry.ok === true));
  assert.ok(report.draftTools.length > 0);
  assert.deepEqual(report.civicRuntimeToolNames, []);
  assert.ok(report.draftTools.every((tool) => tool.workerFirst === true));
  assert.ok(report.draftTools.every((tool) => tool.runtimeExposed === false));
  assert.ok(report.draftTools.every((tool) => tool.effects.executesCivicEffect === false));
  assert.deepEqual(assertV6CivicToolExposureGateSafe(report), { ok: true, errors: [] });
});

test('V6 civic tool exposure gate fails closed for backend shortcuts missing observability or runtime exposure drift', () => {
  const report = readyGate({
    runtimeToolSource: 'backend_local_list',
    runtimeTools: [
      ...WORLD_GRID_TOOLS,
      { name: 'et.world.civic.proposals.draft' }
    ],
    workerEvidence: workerEvidence({
      origin: 'backend_handler',
      backendShortcut: true,
      workerTrafficTrace: false,
      skillContextLoaded: false,
      debugTabsAvailable: ['Worker Tools']
    }),
    mutationSecurityVersion: 'missing',
    mutationSecurityEvidence: mutationSecurityEvidence({
      version: 'missing',
      status: 'incomplete',
      checks: ['same_origin']
    }),
    exposeRuntimeTools: true
  });

  assert.equal(report.available, true);
  assert.equal(report.researchReady, false);
  assert.equal(report.releaseReady, false);
  assert.equal(report.failClosed, true);
  assert.deepEqual(report.missingDebugTabs, ['Skill Context', 'Worker Traffic', 'Brain', 'Session Context']);
  assert.deepEqual(report.civicRuntimeToolNames, ['et.world.civic.proposals.draft']);
  assert.match(report.errors.join(','), /RUNTIME_TOOL_SOURCE_REQUIRED/);
  assert.match(report.errors.join(','), /OPENCLAW_LITE_WORKER_ORIGIN_REQUIRED/);
  assert.match(report.errors.join(','), /WORKER_OBSERVABILITY_REQUIRED/);
  assert.match(report.errors.join(','), /MUTATION_SECURITY_ENVELOPE_REQUIRED/);
  assert.match(report.errors.join(','), /MUTATION_SECURITY_EVIDENCE_REQUIRED/);
  assert.match(report.errors.join(','), /RUNTIME_CIVIC_TOOL_EXPOSURE_FORBIDDEN/);

  const safety = assertV6CivicToolExposureGateSafe(report);
  assert.equal(safety.ok, false);
  assert.match(safety.errors.join(','), /V6_CIVIC_TOOL_RUNTIME_EXPOSURE_FORBIDDEN/);
});

test('V6 civic tool exposure gate requires delegated-agent mutation security evidence', () => {
  const report = readyGate({
    mutationSecurityEvidence: mutationSecurityEvidence({
      checks: [
        'same_origin',
        'session_wallet_binding',
        'idempotency',
        'rate_limit',
        'runtime_hidden'
      ]
    })
  });

  assert.equal(report.researchReady, false);
  assert.equal(report.failClosed, true);
  assert.deepEqual(report.mutationSecurityEvidence.missingChecks, [
    'store_backed_delegation_proof',
    'delegation_scope_mismatch',
    'delegation_budget_read_only'
  ]);
  assert.match(report.errors.join(','), /MUTATION_SECURITY_EVIDENCE_REQUIRED/);
  const safety = assertV6CivicToolExposureGateSafe(report);
  assert.equal(safety.ok, false);
  assert.match(safety.errors.join(','), /V6_CIVIC_TOOL_EXPOSURE_MUTATION_SECURITY_EVIDENCE_REQUIRED:store_backed_delegation_proof/);
  assert.match(safety.errors.join(','), /V6_CIVIC_TOOL_EXPOSURE_MUTATION_SECURITY_EVIDENCE_REQUIRED:delegation_scope_mismatch/);
  assert.match(safety.errors.join(','), /V6_CIVIC_TOOL_EXPOSURE_MUTATION_SECURITY_EVIDENCE_REQUIRED:delegation_budget_read_only/);
});

test('V6 civic tool exposure gate assertion rejects fake release readiness and public exposure', () => {
  const safe = readyGate();
  const unsafe = {
    ...safe,
    releaseReady: true,
    runtimeExposed: true,
    playerVisible: true,
    normalGameplayExposure: true,
    productionEnabled: true,
    executionStatus: 'executes'
  };
  const result = assertV6CivicToolExposureGateSafe(unsafe);

  assert.equal(result.ok, false);
  assert.match(result.errors.join(','), /V6_CIVIC_TOOL_EXPOSURE_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_CIVIC_TOOL_EXPOSURE_PLAYER_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_CIVIC_TOOL_EXPOSURE_NORMAL_GAMEPLAY_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_CIVIC_TOOL_EXPOSURE_PRODUCTION_ENABLEMENT_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_CIVIC_TOOL_EXPOSURE_NON_EXECUTING_REQUIRED/);
  assert.match(result.errors.join(','), /V6_CIVIC_TOOL_EXPOSURE_RELEASE_READY_FORBIDDEN/);
});

test('V6 civic tool exposure gate assertion rejects fake readiness without mutation evidence', () => {
  const safe = readyGate();
  const unsafe = {
    ...safe,
    researchReady: true,
    mutationSecurityEvidence: {
      ok: false,
      status: 'incomplete',
      runtimeExposed: true,
      playerVisible: true,
      mutationApplied: true,
      checks: ['same_origin']
    }
  };
  const result = assertV6CivicToolExposureGateSafe(unsafe);

  assert.equal(result.ok, false);
  assert.match(result.errors.join(','), /V6_CIVIC_TOOL_EXPOSURE_MUTATION_SECURITY_EVIDENCE_REQUIRED:store_backed_delegation_proof/);
  assert.match(result.errors.join(','), /V6_CIVIC_TOOL_EXPOSURE_MUTATION_SECURITY_EVIDENCE_REQUIRED:delegation_scope_mismatch/);
  assert.match(result.errors.join(','), /V6_CIVIC_TOOL_EXPOSURE_MUTATION_SECURITY_EVIDENCE_REQUIRED:delegation_budget_read_only/);
  assert.match(result.errors.join(','), /V6_CIVIC_TOOL_EXPOSURE_MUTATION_SECURITY_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_CIVIC_TOOL_EXPOSURE_MUTATION_SECURITY_PLAYER_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_CIVIC_TOOL_EXPOSURE_MUTATION_SECURITY_NON_EXECUTING_REQUIRED/);
  assert.match(result.errors.join(','), /V6_CIVIC_TOOL_EXPOSURE_READY_WITHOUT_MUTATION_SECURITY_EVIDENCE/);
});
