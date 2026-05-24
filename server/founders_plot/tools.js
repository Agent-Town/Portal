const FOUNDERS_PLOT_TOOL_SPECS = [
  {
    name: 'et.plot.get_state',
    description: 'Return structured Founders Plot state for the current session plot.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    },
    resultSchema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean' },
        error: { type: ['object', 'null'] },
        worldDelta: { type: ['object', 'null'] },
        data: { type: 'object' }
      },
      required: ['ok', 'worldDelta', 'data']
    }
  },
  {
    name: 'et.plot.place_building',
    description: 'Place a starter building on one approved Founders Plot pad.',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['LUMBER_CAMP', 'FARM_PLOT', 'QUARRY', 'WORKSHOP', 'MARKET_STALL'] },
        x: { type: 'integer' },
        y: { type: 'integer' },
        approvalId: { type: 'string' },
        idempotencyKey: { type: 'string' }
      },
      required: ['type', 'x', 'y', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.plot.queue_job',
    description: 'Queue one production or market job on a ready building.',
    inputSchema: {
      type: 'object',
      properties: {
        buildingId: { type: 'string' },
        idempotencyKey: { type: 'string' }
      },
      required: ['buildingId', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.plot.collect_outputs',
    description: 'Collect the completed outputs currently buffered on one building.',
    inputSchema: {
      type: 'object',
      properties: {
        buildingId: { type: 'string' },
        idempotencyKey: { type: 'string' }
      },
      required: ['buildingId', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.plot.upgrade_building',
    description: 'Start a Headquarters or building upgrade.',
    inputSchema: {
      type: 'object',
      properties: {
        buildingId: { type: 'string' },
        approvalId: { type: 'string' },
        idempotencyKey: { type: 'string' }
      },
      required: ['idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.plot.set_priority',
    description: 'Set a single building priority once Headquarters level 4 is unlocked.',
    inputSchema: {
      type: 'object',
      properties: {
        buildingId: { type: 'string' },
        priority: { type: 'string', enum: ['WOOD', 'STONE', 'FOOD', 'BALANCED'] },
        idempotencyKey: { type: 'string' }
      },
      required: ['buildingId', 'priority', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.plot.claim_reward',
    description: 'Claim a pending daily return or level reward.',
    inputSchema: {
      type: 'object',
      properties: {
        rewardKey: { type: 'string' },
        idempotencyKey: { type: 'string' }
      },
      required: ['rewardKey', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.plot.request_user_approval',
    description: 'Create a UI-visible approval request for a sensitive Founders Plot action.',
    inputSchema: {
      type: 'object',
      properties: {
        tool: { type: 'string' },
        title: { type: 'string' },
        body: { type: 'string' },
        payload: { type: 'object' },
        idempotencyKey: { type: 'string' }
      },
      required: ['tool', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.plot.town.get_signals',
    description: 'Return the four visible town signals for the current Founders Plot.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.plot.town.upgrade_landmark',
    description: 'Upgrade the Public Square Welcome Sign when the plot can afford it.',
    inputSchema: {
      type: 'object',
      properties: {
        landmarkId: { type: 'string', enum: ['public_square_welcome_sign'] },
        idempotencyKey: { type: 'string' }
      },
      required: ['landmarkId', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.plot.town.resolve_opportunity',
    description: 'Resolve the active Public Square town opportunity after the human chooses one option.',
    inputSchema: {
      type: 'object',
      properties: {
        opportunityId: { type: 'string' },
        optionId: { type: 'string', enum: ['raise_waymarkers', 'host_neighbor_supper'] },
        idempotencyKey: { type: 'string' }
      },
      required: ['opportunityId', 'optionId', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.plot.journal.get_entries',
    description: 'Return the compact Town Journal entries derived from Founders Plot events.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.plot.contracts.get_state',
    description: 'Return the Contract Board state for the current Founders Plot.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.plot.contracts.accept',
    description: 'Accept one offered Founders Plot contract.',
    inputSchema: {
      type: 'object',
      properties: {
        contractId: { type: 'string' },
        idempotencyKey: { type: 'string' }
      },
      required: ['contractId', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.plot.contracts.turn_in',
    description: 'Turn in one ready Founders Plot contract.',
    inputSchema: {
      type: 'object',
      properties: {
        contractId: { type: 'string' },
        idempotencyKey: { type: 'string' }
      },
      required: ['contractId', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.foreman.policy.get_standing_order',
    description: 'Get the current Foreman standing order.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.foreman.policy.set_standing_order',
    description: 'Set the Foreman standing order to Careful Steward or Bold Founder.',
    inputSchema: {
      type: 'object',
      properties: {
        standingOrder: { type: 'string', enum: ['CAREFUL_STEWARD', 'BOLD_FOUNDER'] },
        idempotencyKey: { type: 'string' }
      },
      required: ['standingOrder', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.foreman.scheduler.get_status',
    description: 'Return the current Founders Plot scheduler status.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.foreman.scheduler.enable_collect_ready_outputs',
    description: 'Enable the one supported V1.1 scheduler preset: collect ready outputs.',
    inputSchema: {
      type: 'object',
      properties: {
        idempotencyKey: { type: 'string' }
      },
      required: ['idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.foreman.scheduler.pause',
    description: 'Pause the active Foreman scheduler preset.',
    inputSchema: {
      type: 'object',
      properties: {
        idempotencyKey: { type: 'string' }
      },
      required: ['idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.foreman.scheduler.resume',
    description: 'Resume the active Foreman scheduler preset.',
    inputSchema: {
      type: 'object',
      properties: {
        idempotencyKey: { type: 'string' }
      },
      required: ['idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  }
];

function getToolSpec(name) {
  return FOUNDERS_PLOT_TOOL_SPECS.find((tool) => tool.name === name) || null;
}

module.exports = {
  FOUNDERS_PLOT_TOOL_SPECS,
  getToolSpec
};
