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
  }
];

function getToolSpec(name) {
  return FOUNDERS_PLOT_TOOL_SPECS.find((tool) => tool.name === name) || null;
}

module.exports = {
  FOUNDERS_PLOT_TOOL_SPECS,
  getToolSpec
};
