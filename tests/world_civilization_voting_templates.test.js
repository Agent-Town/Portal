const test = require('node:test');
const assert = require('node:assert/strict');

const { V6_WORLD_FEATURE_FLAG, parseWorldGridFeatureFlags } = require('../server/world_grid/feature_flags');
const {
  REQUIRED_TEMPLATE_ROUTE_SURFACES,
  REQUIRED_VOTING_TEMPLATE_REVIEW_CHECKS,
  V6_VOTING_TEMPLATE_REVIEW_VERSION,
  V6_VOTING_TEMPLATE_SCOPES,
  assertV6VotingTemplateReviewReportSafe,
  buildV6VotingTemplateReviewReport,
  getV6VotingTemplateForScope,
  inspectV6VotingTemplate,
  listV6VotingTemplates
} = require('../server/world_civilization/voting_templates');

test('V6 voting template review is hidden without explicit research opt-in and V6 flag', () => {
  const noResearchOptIn = buildV6VotingTemplateReviewReport({
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true }
  });
  const broadV5Override = buildV6VotingTemplateReviewReport({
    includeResearchVotingTemplates: true,
    featureFlags: parseWorldGridFeatureFlags('all')
  });

  for (const report of [noResearchOptIn, broadV5Override]) {
    assert.equal(report.version, V6_VOTING_TEMPLATE_REVIEW_VERSION);
    assert.equal(report.available, false);
    assert.equal(report.researchReady, false);
    assert.equal(report.releaseReady, false);
    assert.equal(report.failClosed, true);
    assert.equal(report.runtimeExposed, false);
    assert.equal(report.playerVisible, false);
    assert.equal(report.mutatesWorldState, false);
    assert.equal(report.appliesVoteOutcome, false);
    assert.deepEqual(report.checks, []);
    assert.deepEqual(assertV6VotingTemplateReviewReportSafe(report), { ok: true, errors: [] });
  }
});

test('V6 voting templates cover every institution scope without execution or release claims', () => {
  const templates = listV6VotingTemplates();
  const report = buildV6VotingTemplateReviewReport({
    includeResearchVotingTemplates: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    source: 'node_test',
    templates
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
  assert.equal(report.appliesVoteOutcome, false);
  assert.equal(report.executionStatus, 'not_executable');
  assert.deepEqual(report.requiredScopes, V6_VOTING_TEMPLATE_SCOPES);
  assert.deepEqual(report.missingScopes, []);
  assert.deepEqual(report.checks.map((entry) => entry.key), REQUIRED_VOTING_TEMPLATE_REVIEW_CHECKS);
  assert.ok(report.templates.every((entry) => entry.ok === true));
  for (const scope of V6_VOTING_TEMPLATE_SCOPES) {
    const template = getV6VotingTemplateForScope(scope);
    const inspected = inspectV6VotingTemplate(template);
    assert.equal(inspected.ok, true, scope);
    assert.deepEqual(inspected.routeSurfaces, REQUIRED_TEMPLATE_ROUTE_SURFACES);
    assert.equal(inspected.approvalPolicy.policyId.startsWith('policy_v6_'), true);
  }
  assert.deepEqual(assertV6VotingTemplateReviewReportSafe(report), { ok: true, errors: [] });
});

test('V6 voting template review fails closed for missing scopes private text and route gaps', () => {
  const [first, ...rest] = listV6VotingTemplates();
  const report = buildV6VotingTemplateReviewReport({
    includeResearchVotingTemplates: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true },
    templates: [
      {
        ...first,
        publicAuditSummary: 'Leaked sk-voting-template-secret should never pass.',
        routeSurfaces: ['human_vote_route']
      },
      ...rest.filter((template) => template.scopeKind !== 'service_policy')
    ]
  });

  assert.equal(report.researchReady, false);
  assert.equal(report.releaseReady, false);
  assert.equal(report.failClosed, true);
  assert.deepEqual(report.missingScopes, ['service_policy']);
  assert.match(report.errors.join(','), /VOTING_TEMPLATE_SCOPE_COVERAGE_REQUIRED/);
  assert.match(report.errors.join(','), /VOTING_TEMPLATE_ROUTE_SURFACE_COVERAGE_REQUIRED/);
  assert.match(report.errors.join(','), /VOTING_TEMPLATE_PRIVATE_DATA_FORBIDDEN/);
  assert.match(report.errors.join(','), /public_audit_summary_private_text/);
  assert.deepEqual(assertV6VotingTemplateReviewReportSafe(report), { ok: true, errors: [] });
});

test('V6 voting template review assertion rejects visible executable or release-ready drift', () => {
  const report = buildV6VotingTemplateReviewReport({
    includeResearchVotingTemplates: true,
    featureFlags: { [V6_WORLD_FEATURE_FLAG]: true }
  });
  const unsafe = {
    ...report,
    releaseReady: true,
    runtimeExposed: true,
    playerVisible: true,
    normalGameplayExposure: true,
    mutatesWorldState: true,
    appliesVoteOutcome: true,
    executionStatus: 'executes'
  };
  const result = assertV6VotingTemplateReviewReportSafe(unsafe);

  assert.equal(result.ok, false);
  assert.match(result.errors.join(','), /V6_VOTING_TEMPLATE_REVIEW_RUNTIME_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_VOTING_TEMPLATE_REVIEW_PLAYER_HIDDEN_REQUIRED/);
  assert.match(result.errors.join(','), /V6_VOTING_TEMPLATE_REVIEW_EFFECT_APPLICATION_FORBIDDEN/);
  assert.match(result.errors.join(','), /V6_VOTING_TEMPLATE_REVIEW_NON_EXECUTING_REQUIRED/);
  assert.match(result.errors.join(','), /V6_VOTING_TEMPLATE_REVIEW_RELEASE_READY_FORBIDDEN/);
});
