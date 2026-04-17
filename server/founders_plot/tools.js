function worldDeltaResultSchema(extraProperties = {}) {
  return {
    type: 'object',
    properties: {
      ok: { type: 'boolean' },
      plotId: { type: ['string', 'null'] },
      worldDelta: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            target: { type: ['string', 'null'] },
            summary: { type: 'string' }
          },
          required: ['type', 'summary'],
          additionalProperties: true
        }
      },
      error: {
        type: ['object', 'null'],
        properties: {
          code: { type: 'string' },
          message: { type: 'string' },
          retryable: { type: 'boolean' }
        },
        required: ['code', 'message', 'retryable'],
        additionalProperties: true
      },
      ...extraProperties
    },
    required: ['ok', 'plotId', 'worldDelta', 'error'],
    additionalProperties: true
  };
}

const plotIdProperty = {
  plotId: {
    type: 'string',
    minLength: 1
  }
};

const idempotencyProperty = {
  idempotencyKey: {
    type: 'string',
    minLength: 4,
    maxLength: 160
  }
};

const FOUNDERS_PLOT_TOOL_SPECS = [
  {
    name: 'et.plot.get_state',
    description: 'Returns the current structured Founders Plot state for the active plot or the provided plot id.',
    argsSchema: {
      type: 'object',
      properties: {
        ...plotIdProperty,
        includeReplay: { type: 'boolean' },
        includePublicSummary: { type: 'boolean' }
      },
      additionalProperties: false
    },
    resultSchema: worldDeltaResultSchema({
      state: { type: ['object', 'null'] },
      recap: { type: ['object', 'null'] },
      stateHash: { type: ['string', 'null'] }
    })
  },
  {
    name: 'et.plot.place_building',
    description: 'Places a building on an approved tile. Human approval is required for agent placement in Phase 1.',
    argsSchema: {
      type: 'object',
      properties: {
        ...plotIdProperty,
        type: { type: 'string' },
        x: { type: 'integer' },
        y: { type: 'integer' },
        actor: { type: 'string' },
        ...idempotencyProperty
      },
      required: ['type', 'x', 'y', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: worldDeltaResultSchema({
      building: { type: ['object', 'null'] }
    })
  },
  {
    name: 'et.plot.queue_job',
    description: 'Queues a production, workshop, or sell job for one building.',
    argsSchema: {
      type: 'object',
      properties: {
        ...plotIdProperty,
        buildingId: { type: 'string' },
        kind: { type: 'string' },
        actor: { type: 'string' },
        ...idempotencyProperty
      },
      required: ['buildingId', 'kind', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: worldDeltaResultSchema({
      job: { type: ['object', 'null'] }
    })
  },
  {
    name: 'et.plot.collect_outputs',
    description: 'Collects ready outputs from one building if policy and state permit it.',
    argsSchema: {
      type: 'object',
      properties: {
        ...plotIdProperty,
        buildingId: { type: 'string' },
        actor: { type: 'string' },
        ...idempotencyProperty
      },
      required: ['buildingId', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: worldDeltaResultSchema({
      collected: { type: ['object', 'null'] }
    })
  },
  {
    name: 'et.plot.upgrade_building',
    description: 'Starts an upgrade for HQ or a supported building. HQ upgrades require human approval for agent callers.',
    argsSchema: {
      type: 'object',
      properties: {
        ...plotIdProperty,
        buildingId: { type: 'string' },
        actor: { type: 'string' },
        ...idempotencyProperty
      },
      required: ['buildingId', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: worldDeltaResultSchema({
      job: { type: ['object', 'null'] }
    })
  },
  {
    name: 'et.plot.set_priority',
    description: 'Sets one building priority when HQ level and agent policy allow it.',
    argsSchema: {
      type: 'object',
      properties: {
        ...plotIdProperty,
        buildingId: { type: 'string' },
        priority: { type: 'string' },
        actor: { type: 'string' },
        ...idempotencyProperty
      },
      required: ['buildingId', 'priority', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: worldDeltaResultSchema({
      building: { type: ['object', 'null'] }
    })
  },
  {
    name: 'et.plot.claim_reward',
    description: 'Claims one available Founders Plot quest or HQ milestone reward.',
    argsSchema: {
      type: 'object',
      properties: {
        ...plotIdProperty,
        rewardId: { type: 'string' },
        actor: { type: 'string' },
        ...idempotencyProperty
      },
      required: ['rewardId', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: worldDeltaResultSchema({
      reward: { type: ['object', 'null'] }
    })
  },
  {
    name: 'et.plot.request_user_approval',
    description: 'Creates a human-visible approval request for a sensitive plot mutation.',
    argsSchema: {
      type: 'object',
      properties: {
        ...plotIdProperty,
        action: { type: 'string' },
        params: { type: 'object' },
        title: { type: 'string' },
        body: { type: 'string' },
        actor: { type: 'string' },
        ...idempotencyProperty
      },
      required: ['action', 'params', 'title', 'body', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: worldDeltaResultSchema({
      approval: { type: ['object', 'null'] }
    })
  }
];

module.exports = {
  FOUNDERS_PLOT_TOOL_SPECS
};
