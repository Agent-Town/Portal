const test = require('node:test');
const assert = require('node:assert/strict');

const {
  REQUIRED_WORKER_RUNTIME_REGISTRATION_RELEASE_GAPS,
  REQUIRED_WORKER_RUNTIME_REGISTRATION_TARGET_KEYS,
  V6_WORKER_RUNTIME_REGISTRATION_TARGETS,
  V6_WORKER_RUNTIME_REGISTRATION_VERSION,
  assertV6WorkerRuntimeRegistrationReportSafe,
  buildV6WorkerRuntimeRegistrationReport,
  inspectWorkerRuntimeRegistrationTargets
} = require('../server/world_civilization/worker_runtime_registration');

function observedEvidence(overrides = {}) {
  return {
    runtimeManifestProbeCount: 2,
    workerAdapterContractProbeCount: 2,
    observabilityContractProbeCount: 1,
    productionOverrideProbeCount: 2,
    browserWorkerRegistrationProbeCount: 0,
    productionBrowserWorkerProbeCount: 0,
    civicRuntimeToolCount: 0,
    registeredRuntimeCivicToolCount: 0,
    playerVisibleCivicToolCount: 0,
    backendShortcutCount: 0,
    productionOverrideBypass: false,
    mutatesWorldState: false,
    exposesPrivateData: false,
    ...overrides
  };
}

test('V6 worker runtime registration targets name every browser worker release surface', () => {
  const matrix = inspectWorkerRuntimeRegistrationTargets();
  const browserSmokeTargets = V6_WORKER_RUNTIME_REGISTRATION_TARGETS.filter((target) => (
    String(target.currentEvidence || '').includes('e2e/246_v6_worker_runtime_registration_smoke.spec.js')
  )).map((target) => target.key);
  const productionBrowserSmokeTargets = V6_WORKER_RUNTIME_REGISTRATION_TARGETS.filter((target) => (
    String(target.currentEvidence || '').includes('e2e/248_v6_production_worker_runtime_smoke.spec.js')
  )).map((target) => target.key);
  const modalLifetimeTarget = V6_WORKER_RUNTIME_REGISTRATION_TARGETS.find((target) => (
    target.key === 'modal_lifetime_continuity'
  ));

  assert.equal(matrix.ok, true);
  assert.deepEqual(matrix.requiredKeys, REQUIRED_WORKER_RUNTIME_REGISTRATION_TARGET_KEYS);
  assert.deepEqual(matrix.missingKeys, []);
  assert.equal(matrix.targetCount, V6_WORKER_RUNTIME_REGISTRATION_TARGETS.length);
  assert.ok(matrix.targetKeys.includes('openclaw_worker_boot'));
  assert.ok(matrix.targetKeys.includes('runtime_tool_manifest_sync'));
  assert.ok(matrix.targetKeys.includes('production_override_denial'));
  assert.ok(browserSmokeTargets.includes('openclaw_worker_boot'));
  assert.ok(browserSmokeTargets.includes('runtime_tool_manifest_sync'));
  assert.ok(browserSmokeTargets.includes('civic_tool_absence_before_release'));
  assert.ok(browserSmokeTargets.includes('debug_observability_tabs'));
  assert.ok(browserSmokeTargets.includes('skill_context_import'));
  assert.ok(browserSmokeTargets.includes('worker_traffic_trace'));
  assert.ok(browserSmokeTargets.includes('session_context_link'));
  assert.ok(browserSmokeTargets.includes('production_override_denial'));
  assert.ok(productionBrowserSmokeTargets.includes('openclaw_worker_boot'));
  assert.ok(productionBrowserSmokeTargets.includes('runtime_tool_manifest_sync'));
  assert.ok(productionBrowserSmokeTargets.includes('civic_tool_absence_before_release'));
  assert.ok(productionBrowserSmokeTargets.includes('debug_observability_tabs'));
  assert.ok(productionBrowserSmokeTargets.includes('skill_context_import'));
  assert.ok(productionBrowserSmokeTargets.includes('worker_traffic_trace'));
  assert.ok(productionBrowserSmokeTargets.includes('session_context_link'));
  assert.ok(productionBrowserSmokeTargets.includes('production_override_denial'));
  assert.ok(String(modalLifetimeTarget.currentEvidence || '').includes('e2e/249_v6_lab_modal_worker_lifetime_smoke.spec.js'));
  assert.match(matrix.digest, /^sha256:[a-f0-9]{64}$/);
});

test('V6 worker runtime registration report captures current contract probes without exposing tools', () => {
  const report = buildV6WorkerRuntimeRegistrationReport({
    observed: observedEvidence(),
    source: 'node_test'
  });

  assert.equal(report.version, V6_WORKER_RUNTIME_REGISTRATION_VERSION);
  assert.equal(report.status, 'research_only');
  assert.equal(report.source, 'node_test');
  assert.equal(report.ok, true);
  assert.equal(report.releaseReady, false);
  assert.equal(report.productionReady, false);
  assert.equal(report.runtimeExposed, false);
  assert.equal(report.playerVisible, false);
  assert.equal(report.normalGameplayExposure, false);
  assert.equal(report.registersRuntimeCivicTools, false);
  assert.equal(report.usesBackendShortcut, false);
  assert.equal(report.mutatesWorldState, false);
  assert.equal(report.exposesPrivateData, false);
  assert.equal(report.executionStatus, 'not_executable');
  assert.equal(report.targetMatrix.ok, true);
  assert.equal(report.observedEvidence.runtimeManifestProbeCount, 2);
  assert.equal(report.observedEvidence.workerAdapterContractProbeCount, 2);
  assert.equal(report.observedEvidence.browserWorkerRegistrationCovered, false);
  assert.equal(report.observedEvidence.productionBrowserWorkerCovered, false);
  assert.deepEqual(report.releaseGaps, REQUIRED_WORKER_RUNTIME_REGISTRATION_RELEASE_GAPS);
  assert.deepEqual(assertV6WorkerRuntimeRegistrationReportSafe(report), { ok: true, errors: [] });
});

test('V6 worker runtime registration report can record browser smoke without closing release gaps', () => {
  const report = buildV6WorkerRuntimeRegistrationReport({
    observed: observedEvidence({
      browserWorkerRegistrationProbeCount: 1,
      productionBrowserWorkerProbeCount: 1
    }),
    source: 'browser_smoke'
  });

  assert.equal(report.ok, true);
  assert.equal(report.source, 'browser_smoke');
  assert.equal(report.observedEvidence.browserWorkerRegistrationProbeCount, 1);
  assert.equal(report.observedEvidence.browserWorkerRegistrationCovered, true);
  assert.equal(report.observedEvidence.productionBrowserWorkerProbeCount, 1);
  assert.equal(report.observedEvidence.productionBrowserWorkerCovered, true);
  assert.equal(report.releaseReady, false);
  assert.ok(report.releaseGaps.includes('full_production_browser_coverage_required'));
  assert.deepEqual(assertV6WorkerRuntimeRegistrationReportSafe(report), { ok: true, errors: [] });
});

test('V6 worker runtime registration report fails closed for incomplete targets or missing probes', () => {
  const incomplete = buildV6WorkerRuntimeRegistrationReport({
    targets: V6_WORKER_RUNTIME_REGISTRATION_TARGETS.filter((target) => target.key !== 'openclaw_worker_boot'),
    observed: observedEvidence()
  });
  assert.equal(incomplete.ok, false);
  assert.match(incomplete.errors.join(','), /V6_WORKER_RUNTIME_REGISTRATION_TARGET_MATRIX_INCOMPLETE/);
  assert.match(assertV6WorkerRuntimeRegistrationReportSafe(incomplete).errors.join(','), /V6_WORKER_RUNTIME_REGISTRATION_ERRORS_PRESENT/);

  const missingProbes = buildV6WorkerRuntimeRegistrationReport();
  assert.equal(missingProbes.ok, false);
  assert.match(missingProbes.errors.join(','), /V6_WORKER_RUNTIME_MANIFEST_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_WORKER_RUNTIME_ADAPTER_CONTRACT_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_WORKER_RUNTIME_OBSERVABILITY_PROBE_REQUIRED/);
  assert.match(missingProbes.errors.join(','), /V6_WORKER_RUNTIME_PRODUCTION_OVERRIDE_PROBE_REQUIRED/);
});

test('V6 worker runtime registration assertion rejects fake runtime exposure or backend shortcuts', () => {
  const report = buildV6WorkerRuntimeRegistrationReport({
    observed: observedEvidence()
  });
  const unsafe = {
    ...report,
    status: 'release_candidate',
    releaseReady: true,
    productionReady: true,
    runtimeExposed: true,
    playerVisible: true,
    normalGameplayExposure: true,
    registersRuntimeCivicTools: true,
    usesBackendShortcut: true,
    mutatesWorldState: true,
    exposesPrivateData: true,
    executionStatus: 'executes',
    releaseGaps: [],
    observedEvidence: {
      ...report.observedEvidence,
      civicRuntimeToolCount: 1,
      registeredRuntimeCivicToolCount: 1,
      playerVisibleCivicToolCount: 1,
      backendShortcutCount: 1,
      productionOverrideBypass: true,
      mutatesWorldState: true,
      exposesPrivateData: true
    }
  };
  const safety = assertV6WorkerRuntimeRegistrationReportSafe(unsafe);

  assert.equal(safety.ok, false);
  assert.match(safety.errors.join(','), /V6_WORKER_RUNTIME_REGISTRATION_RESEARCH_ONLY_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_WORKER_RUNTIME_REGISTRATION_RELEASE_READY_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_WORKER_RUNTIME_REGISTRATION_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_WORKER_RUNTIME_REGISTRATION_PLAYER_HIDDEN_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_WORKER_RUNTIME_REGISTRATION_TOOL_REGISTRATION_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_WORKER_RUNTIME_REGISTRATION_BACKEND_SHORTCUT_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_WORKER_RUNTIME_REGISTRATION_WORLD_MUTATION_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_WORKER_RUNTIME_REGISTRATION_PRIVATE_DATA_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_WORKER_RUNTIME_REGISTRATION_NON_EXECUTING_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_WORKER_RUNTIME_REGISTRATION_RELEASE_GAPS_REQUIRED/);
  assert.match(safety.errors.join(','), /V6_WORKER_RUNTIME_REGISTRATION_TOOL_EXPOSURE_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_WORKER_RUNTIME_REGISTRATION_CONTROL_BYPASS_FORBIDDEN/);
  assert.match(safety.errors.join(','), /V6_WORKER_RUNTIME_REGISTRATION_EVIDENCE_SAFETY_REQUIRED/);
});
