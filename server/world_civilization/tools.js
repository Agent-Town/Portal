const { V6_WORLD_FEATURE_FLAG, isWorldGridFeatureEnabled } = require('../world_grid/feature_flags');

const V6_CIVIC_TOOL_SURFACE_VERSION = 'agent-town.v6.civic.tools.v1';

const NO_CIVIC_EFFECT = {
  executesCivicEffect: false,
  mutatesPrivateTown: false,
  mutatesOtherUserWorld: false
};

const V6_CIVIC_TOOL_DRAFTS = [
  {
    name: 'et.world.civic.proposals.list',
    featureFlag: V6_WORLD_FEATURE_FLAG,
    status: 'research_only',
    runtimeExposed: false,
    workerFirst: true,
    mode: 'read',
    description: 'List public-safe proposal summaries for the current civic scope.',
    authority: {
      requiresHumanApproval: false,
      requiresVerifiedWalletSession: true,
      allowsAgentDrafting: false,
      allowsDelegation: false
    },
    effects: NO_CIVIC_EFFECT,
    inputSchema: {
      type: 'object',
      required: ['scope'],
      properties: {
        scope: { type: 'object' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'et.world.civic.proposals.preview',
    featureFlag: V6_WORLD_FEATURE_FLAG,
    status: 'research_only',
    runtimeExposed: false,
    workerFirst: true,
    mode: 'preview',
    description: 'Preview a proposal effect without writing civic state.',
    authority: {
      requiresHumanApproval: false,
      requiresVerifiedWalletSession: true,
      allowsAgentDrafting: true,
      allowsDelegation: false
    },
    effects: NO_CIVIC_EFFECT,
    inputSchema: {
      type: 'object',
      required: ['proposal'],
      properties: {
        proposal: { type: 'object' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'et.world.civic.proposals.draft',
    featureFlag: V6_WORLD_FEATURE_FLAG,
    status: 'research_only',
    runtimeExposed: false,
    workerFirst: true,
    mode: 'draft',
    description: 'Create a local proposal draft candidate that still requires review.',
    authority: {
      requiresHumanApproval: false,
      requiresVerifiedWalletSession: true,
      allowsAgentDrafting: true,
      allowsDelegation: true
    },
    effects: NO_CIVIC_EFFECT,
    inputSchema: {
      type: 'object',
      required: ['proposal'],
      properties: {
        proposal: { type: 'object' },
        delegationRef: { type: 'string' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'et.world.civic.proposals.submit_for_review',
    featureFlag: V6_WORLD_FEATURE_FLAG,
    status: 'research_only',
    runtimeExposed: false,
    workerFirst: true,
    mode: 'submit_for_review',
    description: 'Submit a proposal draft to moderation/review without applying effects.',
    authority: {
      requiresHumanApproval: true,
      requiresVerifiedWalletSession: true,
      allowsAgentDrafting: true,
      allowsDelegation: true
    },
    effects: NO_CIVIC_EFFECT,
    inputSchema: {
      type: 'object',
      required: ['proposal', 'approvalReceiptId', 'idempotencyKey'],
      properties: {
        proposal: { type: 'object' },
        approvalReceiptId: { type: 'string' },
        idempotencyKey: { type: 'string' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'et.world.civic.votes.preview',
    featureFlag: V6_WORLD_FEATURE_FLAG,
    status: 'research_only',
    runtimeExposed: false,
    workerFirst: true,
    mode: 'preview',
    description: 'Preview vote eligibility and receipt shape without recording a vote.',
    authority: {
      requiresHumanApproval: false,
      requiresVerifiedWalletSession: true,
      allowsAgentDrafting: true,
      allowsDelegation: true
    },
    effects: NO_CIVIC_EFFECT,
    inputSchema: {
      type: 'object',
      required: ['proposalId', 'choice'],
      properties: {
        proposalId: { type: 'string' },
        choice: { type: 'string' },
        delegationRef: { type: 'string' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'et.world.civic.votes.cast',
    featureFlag: V6_WORLD_FEATURE_FLAG,
    status: 'research_only',
    runtimeExposed: false,
    workerFirst: true,
    mode: 'authorized_receipt',
    description: 'Record a vote receipt only after explicit wallet/session authorization.',
    authority: {
      requiresHumanApproval: true,
      requiresVerifiedWalletSession: true,
      allowsAgentDrafting: false,
      allowsDelegation: true
    },
    effects: {
      ...NO_CIVIC_EFFECT,
      recordsVoteReceipt: true
    },
    inputSchema: {
      type: 'object',
      required: ['vote', 'authorization', 'idempotencyKey'],
      properties: {
        vote: { type: 'object' },
        authorization: { type: 'object' },
        idempotencyKey: { type: 'string' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'et.world.civic.delegation.get_policy',
    featureFlag: V6_WORLD_FEATURE_FLAG,
    status: 'research_only',
    runtimeExposed: false,
    workerFirst: true,
    mode: 'read',
    description: 'Read the current scoped delegation policy for civic advice.',
    authority: {
      requiresHumanApproval: false,
      requiresVerifiedWalletSession: true,
      allowsAgentDrafting: false,
      allowsDelegation: false
    },
    effects: NO_CIVIC_EFFECT,
    inputSchema: {
      type: 'object',
      required: ['principalAccountId'],
      properties: {
        principalAccountId: { type: 'string' }
      },
      additionalProperties: false
    }
  },
  {
    name: 'et.world.civic.delegation.set_policy',
    featureFlag: V6_WORLD_FEATURE_FLAG,
    status: 'research_only',
    runtimeExposed: false,
    workerFirst: true,
    mode: 'policy_update_request',
    description: 'Request a scoped delegation policy update with explicit approval.',
    authority: {
      requiresHumanApproval: true,
      requiresVerifiedWalletSession: true,
      allowsAgentDrafting: true,
      allowsDelegation: false
    },
    effects: NO_CIVIC_EFFECT,
    inputSchema: {
      type: 'object',
      required: ['delegation', 'approvalReceiptId', 'idempotencyKey'],
      properties: {
        delegation: { type: 'object' },
        approvalReceiptId: { type: 'string' },
        idempotencyKey: { type: 'string' }
      },
      additionalProperties: false
    }
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function listV6CivicToolDrafts({
  featureFlags = {},
  includeResearchDrafts = false
} = {}) {
  if (!includeResearchDrafts) return [];
  if (!isWorldGridFeatureEnabled(featureFlags, V6_WORLD_FEATURE_FLAG)) return [];
  return V6_CIVIC_TOOL_DRAFTS.map((tool) => clone(tool));
}

module.exports = {
  V6_CIVIC_TOOL_DRAFTS,
  V6_CIVIC_TOOL_SURFACE_VERSION,
  listV6CivicToolDrafts
};
