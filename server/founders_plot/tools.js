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
    name: 'et.plot.list_plots',
    description: 'Lists the current player-owned Founders Plot home and outpost plot summaries. Read-only.',
    argsSchema: {
      type: 'object',
      properties: {
        ...plotIdProperty
      },
      additionalProperties: false
    },
    resultSchema: worldDeltaResultSchema({
      homePlotId: { type: ['string', 'null'] },
      activePlotId: { type: ['string', 'null'] },
      plots: {
        type: 'array',
        items: { type: 'object' }
      },
      settlementClaims: {
        type: 'array',
        items: { type: 'object' }
      }
    })
  },
  {
    name: 'et.plot.get_world_grid_status',
    description: 'Returns the HQ10A server-owned World Grid read model for known plots, claims, doctrine, work orders, and civic readiness. Read-only: no civic mutation, routes, scheduling, spending, Atlas execution, or external effects.',
    argsSchema: {
      type: 'object',
      properties: {
        ...plotIdProperty
      },
      additionalProperties: false
    },
    resultSchema: worldDeltaResultSchema({
      worldGrid: { type: ['object', 'null'] },
      stateHash: { type: ['string', 'null'] }
    })
  },
  {
    name: 'et.plot.get_expedition_map',
    description: 'Returns the HQ12A server-owned Expedition Map fog-of-war read model for discovered, known, hinted, and locked/unknown frontier cells, plus the HQ12G read-only Expedition Party manifest. Read-only: no movement, operator assignment, resource gathering, routes, trade, combat, public sharing, Atlas execution, or external effects.',
    argsSchema: {
      type: 'object',
      properties: {
        ...plotIdProperty
      },
      additionalProperties: false
    },
    resultSchema: worldDeltaResultSchema({
      expeditionMap: { type: ['object', 'null'] },
      stateHash: { type: ['string', 'null'] }
    })
  },
  {
    name: 'et.plot.scout_sector',
    description: 'Reveals exactly one eligible hinted Expedition Map frontier sector as same-plot known map truth, then returns a deterministic read-only event packet with a tiny party snapshot for that sector. This writes server-owned receipt/read-model metadata only: no movement, operator assignment, resource gathering, route/trade economy, combat, public sharing, Generated Universe rendering, cross-plot mutation, scheduler, Atlas execution, or external effects. Agent callers require matching human approval.',
    argsSchema: {
      type: 'object',
      properties: {
        ...plotIdProperty,
        cellId: { type: 'string' },
        actor: { type: 'string' },
        actorType: { type: 'string' },
        ...idempotencyProperty
      },
      required: ['idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: worldDeltaResultSchema({
      scoutSector: { type: ['object', 'null'] },
      sector: { type: ['object', 'null'] },
      eventPacket: { type: ['object', 'null'] },
      alreadyScouted: { type: 'boolean' },
      revealedCellId: { type: ['string', 'null'] },
      proof: { type: ['object', 'null'] },
      expeditionMap: { type: ['object', 'null'] },
      stateHash: { type: ['string', 'null'] }
    })
  },
  {
    name: 'et.plot.list_civic_proposals',
    description: 'Lists HQ10B server-owned civic proposal records for the current plot. Read-only and proposal-only: no civic mutation, route creation, scheduling, resource spending, Atlas execution, or external effects.',
    argsSchema: {
      type: 'object',
      properties: {
        ...plotIdProperty
      },
      additionalProperties: false
    },
    resultSchema: worldDeltaResultSchema({
      civicProposals: { type: ['object', 'null'] },
      proposals: {
        type: 'array',
        items: { type: 'object' }
      },
      stateHash: { type: ['string', 'null'] }
    })
  },
  {
    name: 'et.plot.list_overlay_packs',
    description: 'Lists HQ10C server-owned Generated Universe overlay pack records for the current plot. Read-only and presentation-only: no rendering, public sharing, gameplay mutation, resource spending, route changes, scheduling, Atlas execution, or external effects.',
    argsSchema: {
      type: 'object',
      properties: {
        ...plotIdProperty
      },
      additionalProperties: false
    },
    resultSchema: worldDeltaResultSchema({
      overlayPacks: { type: ['object', 'null'] },
      packs: {
        type: 'array',
        items: { type: 'object' }
      },
      stateHash: { type: ['string', 'null'] }
    })
  },
  {
    name: 'et.plot.list_civic_projects',
    description: 'Lists HQ10D server-owned civic project/public-work records for the current plot. Read-only. Civic projects are bounded local gameplay truth with no routes, scheduling, resource spending, Atlas execution, or external effects.',
    argsSchema: {
      type: 'object',
      properties: {
        ...plotIdProperty
      },
      additionalProperties: false
    },
    resultSchema: worldDeltaResultSchema({
      civicProjects: { type: ['object', 'null'] },
      projects: {
        type: 'array',
        items: { type: 'object' }
      },
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
    description: 'Queues a production, scout, workshop, or sell job for one building.',
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
    name: 'et.plot.draft_site_plan',
    description: 'Drafts one canonical Site Plan from a collected Scout Report. This records planning intent but does not claim territory or create a second plot.',
    argsSchema: {
      type: 'object',
      properties: {
        ...plotIdProperty,
        reportId: { type: 'string' },
        title: { type: 'string' },
        focus: { type: 'string' },
        actor: { type: 'string' },
        ...idempotencyProperty
      },
      required: ['reportId', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: worldDeltaResultSchema({
      sitePlan: { type: ['object', 'null'] },
      existing: { type: 'boolean' }
    })
  },
  {
    name: 'et.plot.review_site_plan',
    description: 'Reviews an existing canonical Site Plan into HQ6 claim-ready planning state without creating territory, a convoy, resources, or a second plot.',
    argsSchema: {
      type: 'object',
      properties: {
        ...plotIdProperty,
        planId: { type: 'string' },
        reviewNote: { type: 'string' },
        actor: { type: 'string' },
        ...idempotencyProperty
      },
      required: ['planId', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: worldDeltaResultSchema({
      sitePlan: { type: ['object', 'null'] },
      existing: { type: 'boolean' }
    })
  },
  {
    name: 'et.plot.select_doctrine',
    description: 'Selects one engine-owned Research Lodge doctrine stance. Survey Discipline applies only a 5% Expedition Board SCOUT duration reduction: no resource math, no stacking, no cross-plot effects, and agent callers require matching human approval.',
    argsSchema: {
      type: 'object',
      properties: {
        ...plotIdProperty,
        doctrineId: { type: 'string' },
        actor: { type: 'string' },
        ...idempotencyProperty
      },
      required: ['doctrineId', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: worldDeltaResultSchema({
      doctrineState: { type: ['object', 'null'] },
      doctrine: { type: ['object', 'null'] },
      existing: { type: 'boolean' }
    })
  },
  {
    name: 'et.plot.create_work_order_draft',
    description: 'Creates one server-owned cohort work-order draft from an engine template. Drafts record allowed child actions and caps; only the explicit HQ9B executor can run the collect_ready_outputs_once template.',
    argsSchema: {
      type: 'object',
      properties: {
        ...plotIdProperty,
        templateId: { type: 'string' },
        scope: { type: 'object' },
        actor: { type: 'string' },
        ...idempotencyProperty
      },
      required: ['templateId', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: worldDeltaResultSchema({
      workOrder: { type: ['object', 'null'] },
      template: { type: ['object', 'null'] },
      executionAvailable: { type: 'boolean' }
    })
  },
  {
    name: 'et.plot.execute_work_order',
    description: 'Explicitly executes one server-owned HQ9B work order. The first executor supports only collect_ready_outputs_once, requires at least one ready output, collects at most two ready outputs on the same plot, spends nothing, and agent callers require matching human approval plus collectOutputs policy.',
    argsSchema: {
      type: 'object',
      properties: {
        ...plotIdProperty,
        workOrderId: { type: 'string' },
        actor: { type: 'string' },
        ...idempotencyProperty
      },
      required: ['workOrderId', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: worldDeltaResultSchema({
      workOrder: { type: ['object', 'null'] },
      childReceipts: {
        type: 'array',
        items: { type: 'object' }
      },
      executedChildCount: { type: 'integer' },
      executionAvailable: { type: 'boolean' }
    })
  },
  {
    name: 'et.plot.create_civic_proposal',
    description: 'Creates one HQ10B persisted civic proposal record after World Grid readiness. Records are advisory only: no civic mutation, route creation, scheduling, arbitrary tool execution, resource spending, Atlas execution, settlement founding, cross-plot mutation, or external effects. Agent callers require matching human approval.',
    argsSchema: {
      type: 'object',
      properties: {
        ...plotIdProperty,
        title: { type: 'string' },
        category: { type: 'string' },
        summary: { type: 'string' },
        status: { type: 'string', enum: ['DRAFT', 'REVIEWED', 'ARCHIVED'] },
        relatedPlotIds: {
          type: 'array',
          items: { type: 'string' }
        },
        reviewNote: { type: 'string' },
        actor: { type: 'string' },
        ...idempotencyProperty
      },
      required: ['title', 'summary', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: worldDeltaResultSchema({
      civicProposal: { type: ['object', 'null'] },
      proposal: { type: ['object', 'null'] },
      proposalOnly: { type: 'boolean' },
      executionAllowed: { type: 'boolean' },
      civicProposals: { type: ['object', 'null'] }
    })
  },
  {
    name: 'et.plot.create_overlay_pack',
    description: 'Creates one HQ10C persisted Generated Universe overlay pack record after World Grid readiness and a reviewed civic proposal. Records are visual/presentation only: no gameplay mutation, rendering, public sharing, route creation, scheduling, arbitrary tool execution, resource spending, Atlas execution, settlement founding, cross-plot mutation, or external effects. Agent callers require matching human approval.',
    argsSchema: {
      type: 'object',
      properties: {
        ...plotIdProperty,
        sourceProposalId: { type: 'string' },
        title: { type: 'string' },
        theme: { type: 'string' },
        summary: { type: 'string' },
        status: { type: 'string', enum: ['DRAFT', 'REVIEWED', 'ARCHIVED'] },
        targetSurfaceIds: {
          type: 'array',
          items: { type: 'string' }
        },
        targetNodeIds: {
          type: 'array',
          items: { type: 'string' }
        },
        displayHints: { type: 'object' },
        prompt: { type: 'string' },
        provenance: { type: 'object' },
        actor: { type: 'string' },
        ...idempotencyProperty
      },
      required: ['sourceProposalId', 'title', 'summary', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: worldDeltaResultSchema({
      overlayPack: { type: ['object', 'null'] },
      pack: { type: ['object', 'null'] },
      presentationOnly: { type: 'boolean' },
      visualOnly: { type: 'boolean' },
      executionAllowed: { type: 'boolean' },
      gameplayMutationPolicy: { type: 'string' },
      overlayPacks: { type: ['object', 'null'] }
    })
  },
  {
    name: 'et.plot.activate_civic_project',
    description: 'Promotes one same-plot REVIEWED civic proposal into an HQ10D bounded local civic project. The current project type is civic_beacon: it applies a deterministic local readiness/morale marker and writes an audit receipt, without resource spending, route creation, scheduling, public sharing, Atlas execution, settlement founding, cross-plot mutation, or external effects. Agent callers require matching human approval.',
    argsSchema: {
      type: 'object',
      properties: {
        ...plotIdProperty,
        sourceProposalId: { type: 'string' },
        projectType: { type: 'string', enum: ['civic_beacon'] },
        title: { type: 'string' },
        summary: { type: 'string' },
        actor: { type: 'string' },
        ...idempotencyProperty
      },
      required: ['sourceProposalId', 'title', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: worldDeltaResultSchema({
      civicProject: { type: ['object', 'null'] },
      project: { type: ['object', 'null'] },
      alreadyActivated: { type: 'boolean' },
      effectApplied: { type: 'boolean' },
      civicProjects: { type: ['object', 'null'] }
    })
  },
  {
    name: 'et.plot.inspect_civic_project',
    description: 'Records one HQ11 baseline inspection for an ACTIVE same-plot civic project. This writes a receipt and audit event and updates local readiness metadata only: no resource spending, route/trade behavior, scheduler/background work, public sharing, cross-plot mutation, arbitrary tool execution, Atlas execution, or external effects. Agent callers require matching human approval.',
    argsSchema: {
      type: 'object',
      properties: {
        ...plotIdProperty,
        projectId: { type: 'string' },
        inspectionType: { type: 'string', enum: ['baseline_readiness'] },
        note: { type: 'string' },
        actor: { type: 'string' },
        ...idempotencyProperty
      },
      required: ['projectId', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: worldDeltaResultSchema({
      civicProject: { type: ['object', 'null'] },
      project: { type: ['object', 'null'] },
      inspection: { type: ['object', 'null'] },
      alreadyInspected: { type: 'boolean' },
      inspectionApplied: { type: 'boolean' },
      civicProjects: { type: ['object', 'null'] }
    })
  },
  {
    name: 'et.plot.prepare_settler_convoy',
    description: 'Prepares one bounded Settler Convoy from an HQ6-reviewed claim-ready Site Plan. This spends resources and starts a timed convoy claim, but does not create a second plot yet.',
    argsSchema: {
      type: 'object',
      properties: {
        ...plotIdProperty,
        sitePlanId: { type: 'string' },
        actor: { type: 'string' },
        ...idempotencyProperty
      },
      required: ['sitePlanId', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: worldDeltaResultSchema({
      settlementClaim: { type: ['object', 'null'] },
      job: { type: ['object', 'null'] },
      existing: { type: 'boolean' }
    })
  },
  {
    name: 'et.plot.found_settlement',
    description: 'Founds one second plot from an arrived Settler Convoy claim. This is an explicit server-owned action with idempotency and agent approval gates.',
    argsSchema: {
      type: 'object',
      properties: {
        ...plotIdProperty,
        claimId: { type: 'string' },
        actor: { type: 'string' },
        ...idempotencyProperty
      },
      required: ['claimId', 'idempotencyKey'],
      additionalProperties: false
    },
    resultSchema: worldDeltaResultSchema({
      settlementClaim: { type: ['object', 'null'] },
      foundedPlot: { type: ['object', 'null'] },
      ownedPlots: {
        type: 'array',
        items: { type: 'object' }
      },
      existing: { type: 'boolean' }
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
