const test = require('node:test');
const assert = require('node:assert/strict');

const {
  V6_CIVIC_TOOL_DRAFTS,
  V6_CIVIC_TOOL_SURFACE_VERSION,
  listV6CivicToolDrafts
} = require('../server/world_civilization/tools');
const { parseWorldGridFeatureFlags } = require('../server/world_grid/feature_flags');
const { WORLD_GRID_TOOLS } = require('../server/world_grid/routes');

const EXPECTED_TOOL_NAMES = [
  'et.world.civic.proposals.list',
  'et.world.civic.proposals.preview',
  'et.world.civic.proposals.draft',
  'et.world.civic.proposals.submit_for_review',
  'et.world.civic.votes.preview',
  'et.world.civic.votes.cast',
  'et.world.civic.delegation.get_policy',
  'et.world.civic.delegation.set_policy'
];

test('V6 civic worker tool drafts stay research-only, feature-gated, and non-executing', () => {
  assert.equal(V6_CIVIC_TOOL_SURFACE_VERSION, 'agent-town.v6.civic.tools.v1');
  assert.deepEqual(V6_CIVIC_TOOL_DRAFTS.map((tool) => tool.name), EXPECTED_TOOL_NAMES);

  for (const tool of V6_CIVIC_TOOL_DRAFTS) {
    assert.equal(tool.featureFlag, 'FEATURE_WORLD_V60_AGENT_CIVILIZATION', tool.name);
    assert.equal(tool.status, 'research_only', tool.name);
    assert.equal(tool.runtimeExposed, false, tool.name);
    assert.equal(tool.workerFirst, true, tool.name);
    assert.equal(tool.effects.executesCivicEffect, false, tool.name);
    assert.equal(tool.effects.mutatesPrivateTown, false, tool.name);
    assert.equal(tool.effects.mutatesOtherUserWorld, false, tool.name);
    assert.equal(tool.authority.requiresVerifiedWalletSession, true, tool.name);
    assert.equal(tool.inputSchema.additionalProperties, false, tool.name);
  }

  const approvalTools = V6_CIVIC_TOOL_DRAFTS
    .filter((tool) => tool.mode === 'submit_for_review' || tool.mode === 'authorized_receipt' || tool.mode === 'policy_update_request')
    .map((tool) => tool.name);
  assert.deepEqual(approvalTools, [
    'et.world.civic.proposals.submit_for_review',
    'et.world.civic.votes.cast',
    'et.world.civic.delegation.set_policy'
  ]);
  for (const name of approvalTools) {
    const tool = V6_CIVIC_TOOL_DRAFTS.find((candidate) => candidate.name === name);
    assert.equal(tool.authority.requiresHumanApproval, true, name);
    assert.ok(tool.inputSchema.required.includes('idempotencyKey'), name);
  }
});

test('V6 civic tool drafts require explicit research opt-in and remain absent from runtime world tools', () => {
  assert.deepEqual(listV6CivicToolDrafts(), []);
  assert.deepEqual(listV6CivicToolDrafts({
    includeResearchDrafts: true,
    featureFlags: parseWorldGridFeatureFlags('all')
  }), []);

  const explicit = listV6CivicToolDrafts({
    includeResearchDrafts: true,
    featureFlags: parseWorldGridFeatureFlags('v60')
  });
  assert.deepEqual(explicit.map((tool) => tool.name), EXPECTED_TOOL_NAMES);

  const runtimeWorldToolNames = WORLD_GRID_TOOLS.map((tool) => tool.name);
  for (const name of EXPECTED_TOOL_NAMES) {
    assert.equal(runtimeWorldToolNames.includes(name), false, name);
  }
  assert.equal(WORLD_GRID_TOOLS.some((tool) => tool.featureFlag === 'FEATURE_WORLD_V60_AGENT_CIVILIZATION'), false);
});
