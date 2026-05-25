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
    name: 'et.plot.town.set_identity',
    description: 'Set one cosmetic Public Square style for the town identity layer.',
    inputSchema: {
      type: 'object',
      properties: {
        landmarkId: { type: 'string', enum: ['public_square_welcome_sign'] },
        styleId: { type: 'string', enum: ['homestead', 'garden', 'market'] },
        idempotencyKey: { type: 'string' }
      },
      required: ['landmarkId', 'styleId', 'idempotencyKey'],
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
        optionId: {
          type: 'string',
          enum: [
            'raise_waymarkers',
            'host_neighbor_supper',
            'hire_depot_haulers',
            'host_work_bee',
            'seed_farm_coop',
            'organize_request_board'
          ]
        },
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
    name: 'et.plot.scenarios.get_state',
    description: 'Return the active civic scenario and available scenario offers.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.plot.scenarios.start',
    description: 'Start one available short civic scenario at the Public Square.',
    inputSchema: {
      type: 'object',
      properties: {
        scenarioId: { type: 'string', enum: ['storm_prep'] },
        idempotencyKey: { type: 'string' }
      },
      required: ['scenarioId', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.plot.scenarios.contribute',
    description: 'Spend resources on one active civic scenario task.',
    inputSchema: {
      type: 'object',
      properties: {
        scenarioId: { type: 'string', enum: ['storm_prep'] },
        taskId: { type: 'string', enum: ['brace_roofs', 'stock_supper', 'mark_depot_route'] },
        idempotencyKey: { type: 'string' }
      },
      required: ['scenarioId', 'taskId', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.plot.settlements.get_ledger',
    description: 'Return the Governor Ledger with all settlement summaries and the expedition gate.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.plot.settlements.launch_expedition',
    description: 'Launch the first Settler Expedition after Founders Plot satisfies the stability gate.',
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
    name: 'et.plot.settlements.focus',
    description: 'Switch Governor Ledger focus between Founders Plot and the second settlement.',
    inputSchema: {
      type: 'object',
      properties: {
        settlementId: { type: 'string', enum: ['town_1', 'town_2'] },
        idempotencyKey: { type: 'string' }
      },
      required: ['settlementId', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.plot.settlements.complete_founding_task',
    description: 'Complete one founding task in the second settlement using only that settlement shard inventory.',
    inputSchema: {
      type: 'object',
      properties: {
        settlementId: { type: 'string', enum: ['town_2'] },
        taskId: { type: 'string', enum: ['raise_outpost_camp'] },
        idempotencyKey: { type: 'string' }
      },
      required: ['settlementId', 'taskId', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.plot.operating_model.get_state',
    description: 'Return the current operating charter and capability web state.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.plot.operating_model.choose_charter',
    description: 'Choose the founding operating charter after the town network is stable.',
    inputSchema: {
      type: 'object',
      properties: {
        charterId: { type: 'string', enum: ['STEADY_COMMONS', 'SWIFT_DEPOT', 'CIVIC_BEACON'] },
        idempotencyKey: { type: 'string' }
      },
      required: ['charterId', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.plot.operating_model.unlock_capability',
    description: 'Unlock one small operating-model capability after a charter is chosen.',
    inputSchema: {
      type: 'object',
      properties: {
        capabilityId: { type: 'string', enum: ['CHARTER_CONTRACTS', 'SETTLEMENT_BANNERS', 'FOREMAN_BRIEFING'] },
        idempotencyKey: { type: 'string' }
      },
      required: ['capabilityId', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.plot.operating_model.refresh_contracts',
    description: 'Refresh the Contract Board through the chosen charter lens after Charter Contract Board is unlocked.',
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
    name: 'et.plot.regional.get_ledger',
    description: 'Return the regional ledger with supply routes, shared reserves, regional contracts, and pending route issues.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.plot.regional.open_supply_route',
    description: 'Open the bounded Ridge Supply Route after regional governance is ready.',
    inputSchema: {
      type: 'object',
      properties: {
        routeId: { type: 'string', enum: ['founders_ridge_supply_route'] },
        idempotencyKey: { type: 'string' }
      },
      required: ['routeId', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.plot.regional.transfer_supply_route',
    description: 'Move one deterministic supply shipment over an active regional route without creating or destroying resources.',
    inputSchema: {
      type: 'object',
      properties: {
        routeId: { type: 'string', enum: ['founders_ridge_supply_route'] },
        fromSettlementId: { type: 'string', enum: ['town_1'] },
        toSettlementId: { type: 'string', enum: ['town_2'] },
        idempotencyKey: { type: 'string' }
      },
      required: ['routeId', 'fromSettlementId', 'toSettlementId', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.plot.regional.accept_contract',
    description: 'Accept a regional contract that explicitly references Founders Plot and Ridge Outpost.',
    inputSchema: {
      type: 'object',
      properties: {
        contractId: { type: 'string', enum: ['ridge_timber_bridge'] },
        idempotencyKey: { type: 'string' }
      },
      required: ['contractId', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.plot.regional.turn_in_contract',
    description: 'Turn in a completed regional contract after the required cross-town shipment is complete.',
    inputSchema: {
      type: 'object',
      properties: {
        contractId: { type: 'string', enum: ['ridge_timber_bridge'] },
        idempotencyKey: { type: 'string' }
      },
      required: ['contractId', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.plot.creator.get_catalog',
    description: 'Return curated creator-building manifests, installed state, moderation status, and available creator actions.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.plot.creator.install_building',
    description: 'Install or re-enable one approved creator building as a server-owned town object.',
    inputSchema: {
      type: 'object',
      properties: {
        extensionId: { type: 'string', enum: ['creator.notice-kiosk'] },
        idempotencyKey: { type: 'string' }
      },
      required: ['extensionId', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.plot.creator.disable_building',
    description: 'Disable one installed creator building without deleting its last safe state.',
    inputSchema: {
      type: 'object',
      properties: {
        extensionId: { type: 'string', enum: ['creator.notice-kiosk'] },
        idempotencyKey: { type: 'string' }
      },
      required: ['extensionId', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.plot.creator.remove_building',
    description: 'Remove one installed creator building and roll the town object out of the scene safely.',
    inputSchema: {
      type: 'object',
      properties: {
        extensionId: { type: 'string', enum: ['creator.notice-kiosk'] },
        idempotencyKey: { type: 'string' }
      },
      required: ['extensionId', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.creator.notice_kiosk.post_notice',
    description: 'Run the Notice Kiosk creator tool by posting one short public-safe notice.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', minLength: 1, maxLength: 80 },
        idempotencyKey: { type: 'string' }
      },
      required: ['text', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.foreman.specialists.get_state',
    description: 'Return the specialist Foreman staffing lanes, role assignments, bounded domain tools, and open conflicts.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.foreman.specialists.assign',
    description: 'Assign or reassign one specialist Foreman to one eligible bounded domain lane.',
    inputSchema: {
      type: 'object',
      properties: {
        roleId: { type: 'string', enum: ['BUILDER_FOREMAN', 'QUARTERMASTER'] },
        domainId: { type: 'string', enum: ['construction', 'supplies', 'contracts', 'public_works'] },
        idempotencyKey: { type: 'string' }
      },
      required: ['roleId', 'domainId', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.foreman.specialists.pause',
    description: 'Pause one active specialist Foreman lane without pausing the general Foreman.',
    inputSchema: {
      type: 'object',
      properties: {
        roleId: { type: 'string', enum: ['BUILDER_FOREMAN', 'QUARTERMASTER'] },
        reason: { type: 'string' },
        idempotencyKey: { type: 'string' }
      },
      required: ['roleId', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.foreman.specialists.review_recommendation',
    description: 'Record one bounded specialist recommendation and escalate conflicting recommendations to the Exception Inbox.',
    inputSchema: {
      type: 'object',
      properties: {
        roleId: { type: 'string', enum: ['BUILDER_FOREMAN', 'QUARTERMASTER'] },
        domainId: { type: 'string', enum: ['construction', 'supplies', 'contracts', 'public_works'] },
        toolName: { type: 'string' },
        targetObjectId: { type: 'string' },
        summary: { type: 'string' },
        recommendationId: { type: 'string' },
        conflictsWith: { type: 'array', items: { type: 'string' } },
        idempotencyKey: { type: 'string' }
      },
      required: ['roleId', 'domainId', 'toolName', 'targetObjectId', 'summary', 'idempotencyKey'],
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
    name: 'et.foreman.doctrine.get_state',
    description: 'Get the current lightweight Clover preference rules.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.foreman.doctrine.set_rule',
    description: 'Enable or disable one reversible Clover preference rule.',
    inputSchema: {
      type: 'object',
      properties: {
        ruleId: {
          type: 'string',
          enum: ['PREFER_RESERVES', 'PREFER_SPEED', 'ASK_BEFORE_SPENDING', 'FINISH_ACTIVE_CONTRACTS_FIRST']
        },
        enabled: { type: 'boolean' },
        idempotencyKey: { type: 'string' }
      },
      required: ['ruleId', 'enabled', 'idempotencyKey'],
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
  },
  {
    name: 'et.foreman.governance.grant_lease',
    description: 'Grant a time-boxed Foreman lease for bounded routine help.',
    inputSchema: {
      type: 'object',
      properties: {
        durationMinutes: { type: 'number', minimum: 5, maximum: 240 },
        scope: { type: 'string', enum: ['collect_ready_outputs', 'in_session_help'] },
        idempotencyKey: { type: 'string' }
      },
      required: ['idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.foreman.governance.revoke_lease',
    description: 'Revoke the active Foreman lease and pause routine help.',
    inputSchema: {
      type: 'object',
      properties: {
        reason: { type: 'string' },
        idempotencyKey: { type: 'string' }
      },
      required: ['idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.foreman.governance.raise_exception',
    description: 'Create an Exception Inbox item when Clover needs player review.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        body: { type: 'string' },
        requestedAction: { type: 'string' },
        severity: { type: 'string', enum: ['needs_review', 'blocked', 'risk'] },
        payload: { type: 'object' },
        idempotencyKey: { type: 'string' }
      },
      required: ['title', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.foreman.governance.resolve_exception',
    description: 'Resolve one open Exception Inbox item.',
    inputSchema: {
      type: 'object',
      properties: {
        exceptionId: { type: 'string' },
        resolution: { type: 'string', enum: ['RESOLVED', 'DISMISSED'] },
        idempotencyKey: { type: 'string' }
      },
      required: ['exceptionId', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.foreman.governance.start_persistent',
    description: 'Start time-boxed while-away Clover help for the collect-ready routine after Brain authorization.',
    inputSchema: {
      type: 'object',
      properties: {
        durationMinutes: { type: 'number', minimum: 15, maximum: 240 },
        scope: { type: 'string', enum: ['collect_ready_outputs'] },
        brainReady: { type: 'boolean' },
        idempotencyKey: { type: 'string' }
      },
      required: ['brainReady', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: { type: 'object' }
  },
  {
    name: 'et.foreman.governance.pause_persistent',
    description: 'Pause while-away Clover help immediately.',
    inputSchema: {
      type: 'object',
      properties: {
        reason: { type: 'string' },
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
