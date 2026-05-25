const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createSceneState
} = require('../public/experiences/founders-plot/scene_state.js');

function makeBaseView(overrides = {}) {
  return {
    progress: {
      currentLevel: 1,
      next: {
        ratio: 0.2,
        xpCurrent: 5,
        xpRequired: 25
      }
    },
    plot: {
      hqLevel: 1,
      townXp: 5,
      inventory: {
        wood: 6,
        stone: 0,
        food: 0,
        coin: 20
      }
    },
    unlocks: {
      buildingTypes: ['LUMBER_CAMP']
    },
    currentGoal: {
      title: 'Build the Lumber Camp',
      body: 'Place the first production building.',
      owner: 'tutorial',
      primaryAction: {
        type: 'PLACE_BUILDING',
        buildingType: 'LUMBER_CAMP'
      }
    },
    quest: {
      title: 'Build the Lumber Camp',
      body: 'Place the first production building.',
      step: 'place_lumber_camp',
      primaryAction: {
        type: 'PLACE_BUILDING',
        buildingType: 'LUMBER_CAMP'
      }
    },
    contracts: {
      boardLocked: true,
      offers: [],
      activeContract: null,
      completed: []
    },
    scenarios: {
      offers: [],
      active: null,
      completed: []
    },
    foreman: {
      recommendation: 'Set a Lumber Camp first.',
      pendingApprovals: [],
      standingOrder: 'CAREFUL_STEWARD',
      runtime: {
        status: 'NOT_STARTED',
        runtimeId: '',
        expiresAt: 0
      },
      scheduler: {
        collectReadyOutputs: {
          enabled: false,
          paused: false,
          runCount: 0
        }
      },
      receipt: null,
      lastDecision: {
        chosenCandidateId: null,
        planCard: null
      }
    },
    landmarks: {
      publicSquare: {
        level: 0
      }
    },
    rewards: [],
    recap: {
      unseenCount: 0
    },
    pads: [
      { x: 0, y: 0, occupied: false, label: 'Northwest Pad' },
      { x: 1, y: 0, occupied: false, label: 'North Pad' },
      { x: 2, y: 0, occupied: false, label: 'Northeast Pad' },
      { x: 0, y: 1, occupied: false, label: 'West Pad' },
      { x: 2, y: 1, occupied: false, label: 'East Pad' },
      { x: 1, y: 2, occupied: false, label: 'South Pad' }
    ],
    buildings: [
      {
        buildingId: 'hq_1',
        type: 'HQ',
        x: 1,
        y: 1,
        level: 1,
        state: 'READY',
        outputBuffer: {},
        completedJobs: [],
        runningJob: null
      }
    ],
    jobs: [],
    ...overrides
  };
}

test('empty plot maps to HQ plus buildable lots', () => {
  const scene = createSceneState(makeBaseView(), {
    selectedKey: '',
    activeDrawer: ''
  });

  assert.equal(scene.hqLevel, 1);
  assert.ok(scene.objects.some((object) => object.id === 'HQ'));
  assert.ok(scene.objects.some((object) => object.id === 'CONTRACT_BOARD'));
  assert.ok(scene.objects.some((object) => object.id === 'PUBLIC_SQUARE'));
  assert.ok(scene.objects.some((object) => object.id === 'FOREMAN_HUT'));
  assert.ok(scene.objects.some((object) => object.id === 'JOURNAL'));
  assert.ok(scene.objects.some((object) => object.id === 'APPROVAL_INBOX'));
  const lots = scene.objects.filter((object) => object.kind === 'lot');
  assert.equal(lots.length, 6);
  assert.ok(lots.every((object) => object.state === 'BUILDABLE'));
  const lotsWithBuildBadges = lots.filter((object) => object.badges.some((badge) => badge.type === 'build'));
  assert.deepEqual(lotsWithBuildBadges.map((object) => object.id), [scene.currentGoal.targetObjectId]);
  assert.equal(scene.objects.find((object) => object.id === 'FOREMAN_HUT')?.state, 'IDLE');
});

test('a built Lumber Camp maps to the right world object', () => {
  const scene = createSceneState(makeBaseView({
    pads: makeBaseView().pads.map((pad) => (pad.x === 0 && pad.y === 0 ? { ...pad, occupied: true } : pad)),
    buildings: [
      ...makeBaseView().buildings,
      {
        buildingId: 'bld_lumber',
        type: 'LUMBER_CAMP',
        x: 0,
        y: 0,
        level: 1,
        state: 'READY',
        outputBuffer: {},
        completedJobs: [],
        runningJob: null
      }
    ]
  }));

  const lumber = scene.objects.find((object) => object.id === 'LUMBER_CAMP');
  assert.ok(lumber);
  assert.equal(lumber.assetId, 'founders_plot_lumber_camp_v1_4_2');
  assert.equal(lumber.selectionKey, 'building:bld_lumber');
});

test('a running job maps to PRODUCING with timer progress', () => {
  const originalNow = Date.now;
  Date.now = () => 1_500;
  try {
    const scene = createSceneState(makeBaseView({
      pads: makeBaseView().pads.map((pad) => (pad.x === 0 && pad.y === 0 ? { ...pad, occupied: true } : pad)),
      buildings: [
        ...makeBaseView().buildings,
        {
          buildingId: 'bld_lumber',
          type: 'LUMBER_CAMP',
          x: 0,
          y: 0,
          level: 1,
          state: 'PRODUCING',
          outputBuffer: {},
          completedJobs: [],
          runningJob: {
            startedAt: 1_000,
            endsAt: 2_000
          }
        }
      ]
    }));

    const lumber = scene.objects.find((object) => object.id === 'LUMBER_CAMP');
    assert.equal(lumber.state, 'PRODUCING');
    assert.ok(lumber.timer);
    assert.equal(lumber.timer.progress, 0.5);
  } finally {
    Date.now = originalNow;
  }
});

test('output ready maps to READY and shows a ready badge', () => {
  const scene = createSceneState(makeBaseView({
    pads: makeBaseView().pads.map((pad) => (pad.x === 0 && pad.y === 0 ? { ...pad, occupied: true } : pad)),
    buildings: [
      ...makeBaseView().buildings,
      {
        buildingId: 'bld_lumber',
        type: 'LUMBER_CAMP',
        x: 0,
        y: 0,
        level: 1,
        state: 'OUTPUT_READY',
        outputBuffer: { wood: 4 },
        completedJobs: [{ jobId: 'job_1' }],
        runningJob: null
      }
    ]
  }));

  const lumber = scene.objects.find((object) => object.id === 'LUMBER_CAMP');
  assert.equal(lumber.state, 'READY');
  assert.ok(lumber.badges.some((badge) => /ready/i.test(String(badge.label))));
});

test('creator extension state maps to a Notice Kiosk object and coverage anchor', () => {
  const scene = createSceneState(makeBaseView({
    plot: {
      ...makeBaseView().plot,
      hqLevel: 2
    },
    creatorExtensions: {
      version: 'v4.5',
      summary: '1 curated creator building attached.',
      catalog: [{
        extensionId: 'creator.notice-kiosk',
        label: 'Creator Notice Kiosk',
        gate: { ready: true },
        allowedActions: ['post_notice', 'disable', 'remove']
      }],
      installed: [{
        extensionId: 'creator.notice-kiosk',
        objectId: 'CREATOR_NOTICE_KIOSK',
        label: 'Creator Notice Kiosk',
        status: 'ACTIVE',
        active: true,
        state: {
          noticeCount: 1,
          featuredNotice: 'Welcome builders to this growing town.',
          enabled: true
        }
      }]
    }
  }));

  const kiosk = scene.objects.find((object) => object.id === 'CREATOR_NOTICE_KIOSK');
  assert.ok(kiosk);
  assert.equal(kiosk.drawerKey, 'creator');
  assert.equal(kiosk.testId, 'founders-stage-object-CREATOR_NOTICE_KIOSK');
  assert.ok(scene.drawers.some((drawer) => drawer.key === 'creator'));
  assert.ok(scene.stateCoverage.domains.some((domain) => domain.id === 'creator-extensions'));
  const anchor = scene.stateCoverage.anchors.find((entry) => entry.id === 'STATE:creator-extensions');
  assert.equal(anchor.objectId, 'CREATOR_NOTICE_KIOSK');
  assert.equal(anchor.status, 'ACTIVE');
});

test('duplicate Lumber Camps keep distinct scene IDs and selected actions', () => {
  const view = makeBaseView({
    pads: makeBaseView().pads.map((pad) => {
      if (pad.x === 0 && pad.y === 0) return { ...pad, occupied: true };
      if (pad.x === 1 && pad.y === 0) return { ...pad, occupied: true };
      return pad;
    }),
    buildings: [
      ...makeBaseView().buildings,
      {
        buildingId: 'bld_lumber_running',
        type: 'LUMBER_CAMP',
        x: 0,
        y: 0,
        level: 1,
        state: 'PRODUCING',
        outputBuffer: {},
        completedJobs: [],
        runningJob: {
          startedAt: 1_000,
          endsAt: 2_000
        }
      },
      {
        buildingId: 'bld_lumber_ready',
        type: 'LUMBER_CAMP',
        x: 1,
        y: 0,
        level: 1,
        state: 'OUTPUT_READY',
        outputBuffer: { wood: 6 },
        completedJobs: [{ jobId: 'job_ready' }],
        runningJob: null
      }
    ]
  });
  const scene = createSceneState(view, {
    selectedKey: 'building:bld_lumber_ready'
  });

  const lumberObjects = scene.objects.filter((object) => object.buildingType === 'LUMBER_CAMP');
  assert.equal(lumberObjects.length, 2);
  assert.deepEqual(lumberObjects.map((object) => object.id).sort(), [
    'LUMBER_CAMP:bld_lumber_ready',
    'LUMBER_CAMP:bld_lumber_running'
  ]);
  assert.equal(scene.selectedObjectId, 'LUMBER_CAMP:bld_lumber_ready');
  assert.equal(lumberObjects.filter((object) => object.selected).length, 1);
  assert.equal(scene.stateCoverage.selectedDetail.objectId, 'LUMBER_CAMP:bld_lumber_ready');
  assert.ok(scene.stateCoverage.selectedDetail.rows.some((row) => row.label === 'Ready output' && /6 wood/.test(row.value)));
});

test('contract-ready state marks the Contract Board as ready', () => {
  const scene = createSceneState(makeBaseView({
    contracts: {
      boardLocked: false,
      offers: [],
      activeContract: {
        contractId: 'ctr_1',
        status: 'READY_TO_TURN_IN'
      },
      completed: []
    }
  }));

  const board = scene.objects.find((object) => object.id === 'CONTRACT_BOARD');
  assert.equal(board.state, 'READY');
  assert.ok(board.badges.some((badge) => /turn-in ready/i.test(String(badge.label))));
});

test('V1.5 requester and Clover-pick state maps to Contract Board scene anchors', () => {
  const scene = createSceneState(makeBaseView({
    requesters: [
      {
        requesterId: 'jasper_depot_clerk',
        displayName: 'Jasper at the Depot',
        institution: 'Atlas Depot',
        completedContracts: 0,
        lastSeenAtMs: 10_000
      },
      {
        requesterId: 'mara_market_host',
        displayName: 'Mara from Market Circle',
        institution: 'Market Circle',
        completedContracts: 0,
        lastSeenAtMs: 10_000
      }
    ],
    contracts: {
      boardLocked: false,
      offers: [
        {
          contractId: 'ctr_stock',
          kind: 'SUPPLY',
          title: 'Stock the Depot',
          requesterSnapshot: {
            displayName: 'Jasper at the Depot',
            institution: 'Atlas Depot'
          }
        },
        {
          contractId: 'ctr_market',
          kind: 'BUILD',
          title: 'Breakfast Before Market',
          requesterSnapshot: {
            displayName: 'Mara from Market Circle',
            institution: 'Market Circle'
          }
        }
      ],
      activeContract: null,
      completed: [],
      recommendation: {
        contractId: 'ctr_market',
        title: 'Clover pick',
        requesterName: 'Mara from Market Circle',
        reason: 'Clover is favoring a request that protects reserves.'
      }
    }
  }));

  const domainIds = scene.stateCoverage.domains.map((domain) => domain.id);
  assert.ok(domainIds.includes('requesters'));

  const contractAnchor = scene.stateCoverage.anchors.find((anchor) => anchor.id === 'STATE:contracts');
  const requesterAnchor = scene.stateCoverage.anchors.find((anchor) => anchor.id === 'STATE:requesters');
  assert.ok(contractAnchor);
  assert.ok(requesterAnchor);
  assert.equal(contractAnchor.objectId, 'CONTRACT_BOARD');
  assert.match(contractAnchor.value, /Clover pick: Mara from Market Circle/);
  assert.equal(requesterAnchor.drawerKey, 'contracts');
  assert.match(requesterAnchor.value, /Jasper at the Depot: Atlas Depot/);
  assert.match(requesterAnchor.value, /Mara from Market Circle: Market Circle/);
});

test('journal trigger and approval inbox map to the promoted civic objects', () => {
  const scene = createSceneState(makeBaseView({
    foreman: {
      ...makeBaseView().foreman,
      pendingApprovals: [
        {
          approvalId: 'apr_1',
          title: 'Approve the spend'
        }
      ]
    },
    recap: {
      unseenCount: 2
    },
    journal: {
      entries: [
        {
          journalId: 'journal_1',
          title: 'The town woke up early.'
        }
      ]
    }
  }));

  const journal = scene.objects.find((object) => object.id === 'JOURNAL');
  const approvals = scene.objects.find((object) => object.id === 'APPROVAL_INBOX');
  assert.ok(journal);
  assert.ok(approvals);
  assert.equal(journal.assetId, 'founders_plot_journal_trigger_v1_4_2');
  assert.equal(approvals.assetId, 'founders_plot_approval_inbox_v1_4_2');
  assert.equal(journal.drawerKey, 'journal');
  assert.equal(approvals.drawerKey, 'approvals');
  assert.equal(journal.state, 'READY');
  assert.equal(approvals.state, 'READY');
});

test('V1.6 civic scenario maps to the Three.js civic project anchor', () => {
  const scene = createSceneState(makeBaseView({
    currentGoal: {
      title: 'Storm Prep: Brace roofs',
      body: 'Spend reserves to prepare for the storm.',
      owner: 'scenario',
      primaryAction: {
        type: 'CONTRIBUTE_SCENARIO',
        scenarioId: 'storm_prep',
        taskId: 'brace_roofs'
      }
    },
    scenarios: {
      offers: [],
      active: {
        scenarioId: 'storm_prep',
        title: 'Storm Prep',
        status: 'ACTIVE',
        startedAtMs: Date.now() - 60_000,
        dueAtMs: Date.now() + 600_000,
        completedTasks: 1,
        minCompletedTasks: 2,
        progress: 0.5,
        tasks: [
          { taskId: 'brace_roofs', label: 'Brace roofs', completed: false },
          { taskId: 'stock_supper', label: 'Stock supper stores', completed: true }
        ]
      },
      completed: []
    }
  }));

  const scenario = scene.objects.find((object) => object.id === 'SCENARIO_SITE');
  assert.ok(scenario);
  assert.equal(scenario.state, 'PRODUCING');
  assert.equal(scenario.drawerKey, 'signals');
  assert.equal(scene.currentGoal.targetObjectId, 'SCENARIO_SITE');
  assert.ok(scenario.badges.some((badge) => /prep/i.test(String(badge.label))));

  const domainIds = scene.stateCoverage.domains.map((domain) => domain.id);
  assert.ok(domainIds.includes('civic-scenarios'));
  const anchor = scene.stateCoverage.anchors.find((entry) => entry.id === 'STATE:scenarios');
  assert.ok(anchor);
  assert.equal(anchor.objectId, 'SCENARIO_SITE');
  assert.match(anchor.value, /Storm Prep/);
});

test('V1.7 town identity maps to the Public Square scene anchor', () => {
  const scene = createSceneState(makeBaseView({
    currentGoal: {
      title: 'Choose the square style',
      body: 'Pick the town look.',
      owner: 'identity',
      primaryAction: {
        type: 'VIEW_TOWN_IDENTITY',
        landmarkId: 'public_square_welcome_sign'
      }
    },
    landmarks: {
      publicSquare: {
        level: 1,
        styleId: 'garden',
        styleLabel: 'Garden Square',
        style: {
          styleId: 'garden',
          label: 'Garden Square',
          ornament: 'planters',
          palette: { tint: '#b9d88a', accent: '#2f5d50' }
        },
        availableStyles: []
      }
    }
  }));

  const square = scene.objects.find((object) => object.id === 'PUBLIC_SQUARE');
  assert.ok(square);
  assert.equal(scene.currentGoal.targetObjectId, 'PUBLIC_SQUARE');
  assert.equal(square.identityStyle.styleId, 'garden');
  assert.equal(square.tint, '#b9d88a');
  assert.ok(square.badges.some((badge) => /Garden Square/.test(String(badge.label))));

  const domainIds = scene.stateCoverage.domains.map((domain) => domain.id);
  assert.ok(domainIds.includes('town-identity'));
  const anchor = scene.stateCoverage.anchors.find((entry) => entry.id === 'STATE:town_identity');
  assert.ok(anchor);
  assert.equal(anchor.objectId, 'PUBLIC_SQUARE');
  assert.match(anchor.value, /Garden Square/);
});

test('pending approval takes over the objective target and Clover state', () => {
  const scene = createSceneState(makeBaseView({
    currentGoal: {
      title: 'Approve Clover',
      body: 'Clover needs your say-so.',
      owner: 'approval',
      primaryAction: {
        type: 'RESOLVE_APPROVAL'
      }
    },
    foreman: {
      ...makeBaseView().foreman,
      pendingApprovals: [
        {
          approvalId: 'apr_1',
          title: 'Approve the spend'
        }
      ]
    }
  }));

  assert.equal(scene.currentGoal.targetObjectId, 'APPROVAL_INBOX');
  assert.equal(scene.clover.state, 'WAITING_FOR_PERMISSION');
  assert.equal(scene.clover.targetObjectId, 'APPROVAL_INBOX');
});

test('V2.0 Foreman governance maps leases and exceptions to scene anchors', () => {
  const scene = createSceneState(makeBaseView({
    foreman: {
      ...makeBaseView().foreman,
      governance: {
        activeLease: {
          leaseId: 'fls_1',
          status: 'ACTIVE',
          scope: 'collect_ready_outputs',
          expiresAtMs: Date.now() + 60_000
        },
        openExceptions: [
          {
            exceptionId: 'fex_1',
            title: 'Review surplus collection',
            status: 'OPEN'
          }
        ],
        summary: 'Lease active until later'
      }
    }
  }));

  const approvalInbox = scene.objects.find((object) => object.id === 'APPROVAL_INBOX');
  assert.ok(approvalInbox);
  assert.equal(approvalInbox.state, 'READY');
  assert.ok(approvalInbox.badges.some((badge) => String(badge.displayLabel) === '1'));

  const domainIds = scene.stateCoverage.domains.map((domain) => domain.id);
  assert.ok(domainIds.includes('foreman-governance'));
  const governance = scene.stateCoverage.anchors.find((entry) => entry.id === 'STATE:governance');
  assert.ok(governance);
  assert.equal(governance.status, 'LEASE_ACTIVE');
  assert.match(governance.value, /Lease active/);
});

test('V2.1 Doctrine Lite maps Clover preferences to scene anchors', () => {
  const scene = createSceneState(makeBaseView({
    foreman: {
      ...makeBaseView().foreman,
      doctrine: {
        activeRules: [
          {
            ruleId: 'PREFER_RESERVES',
            label: 'Prefer reserves',
            summary: 'Favor requests that protect reserves.'
          }
        ],
        summary: 'Clover is following prefer reserves.',
        rules: []
      }
    }
  }));

  const domainIds = scene.stateCoverage.domains.map((domain) => domain.id);
  assert.ok(domainIds.includes('foreman-doctrine'));
  const doctrine = scene.stateCoverage.anchors.find((entry) => entry.id === 'STATE:doctrine');
  assert.ok(doctrine);
  assert.equal(doctrine.objectId, 'FOREMAN_HUT');
  assert.equal(doctrine.status, 'PREFERENCES_SET');
  assert.equal(doctrine.count, 1);
  assert.match(doctrine.value, /prefer reserves/);
});

test('V3.1 Specialist Foremen map staffing lanes to scene anchors', () => {
  const scene = createSceneState(makeBaseView({
    foreman: {
      ...makeBaseView().foreman,
      specialists: {
        gate: {
          ready: true,
          summary: 'The Foreman bench is ready for specialist staffing.'
        },
        activeAssignments: [
          {
            roleId: 'BUILDER_FOREMAN',
            label: 'Builder Foreman',
            domainId: 'construction',
            active: true
          },
          {
            roleId: 'QUARTERMASTER',
            label: 'Quartermaster',
            domainId: 'supplies',
            active: true
          }
        ],
        roles: [
          {
            roleId: 'BUILDER_FOREMAN',
            label: 'Builder Foreman',
            domainId: 'construction',
            active: true,
            domain: { label: 'Construction' }
          },
          {
            roleId: 'QUARTERMASTER',
            label: 'Quartermaster',
            domainId: 'supplies',
            active: true,
            domain: { label: 'Supplies' }
          }
        ],
        summary: '2 specialist lanes staffed.'
      }
    }
  }));

  const domainIds = scene.stateCoverage.domains.map((domain) => domain.id);
  assert.ok(domainIds.includes('foreman-specialists'));
  const specialists = scene.stateCoverage.anchors.find((entry) => entry.id === 'STATE:specialists');
  assert.ok(specialists);
  assert.equal(specialists.objectId, 'FOREMAN_HUT');
  assert.equal(specialists.status, 'STAFFED');
  assert.equal(specialists.count, 2);
  assert.match(specialists.value, /2 specialist/);
});

test('V2.0 persistent Foreman maps while-away help to scene anchors', () => {
  const scene = createSceneState(makeBaseView({
    foreman: {
      ...makeBaseView().foreman,
      governance: {
        activeLease: {
          leaseId: 'fls_1',
          status: 'ACTIVE',
          scope: 'collect_ready_outputs',
          expiresAtMs: Date.now() + 60_000
        },
        persistent: {
          status: 'ACTIVE',
          active: true,
          actionCount: 2,
          summary: 'Clover can watch while you are away until later.'
        },
        openExceptions: [],
        summary: 'While-away help active. Lease active until later'
      }
    }
  }));

  const domainIds = scene.stateCoverage.domains.map((domain) => domain.id);
  assert.ok(domainIds.includes('foreman-persistent'));
  const persistent = scene.stateCoverage.anchors.find((entry) => entry.id === 'STATE:persistent_foreman');
  assert.ok(persistent);
  assert.equal(persistent.objectId, 'FOREMAN_HUT');
  assert.equal(persistent.status, 'ACTIVE');
  assert.equal(persistent.count, 2);
  assert.match(persistent.value, /watch while you are away/);
});

test('V2.5 Governor Ledger maps second settlement state to scene anchors', () => {
  const scene = createSceneState(makeBaseView({
    settlements: {
      activeSettlementId: 'town_2',
      expedition: {
        status: 'LAUNCHED'
      },
      summary: '2 settlements in the Governor Ledger.',
      pendingDecisionCount: 1,
      settlements: [
        {
          settlementId: 'town_1',
          name: 'Founders Plot',
          status: 'GOVERNED',
          pendingDecisionCount: 0
        },
        {
          settlementId: 'town_2',
          name: 'Ridge Outpost',
          status: 'FOUNDING',
          pendingDecisionCount: 1
        }
      ]
    }
  }), {
    selectedKey: '',
    activeDrawer: ''
  });

  assert.ok(scene.drawers.some((drawer) => drawer.key === 'settlements'));
  assert.ok(scene.objects.some((object) => object.id === 'GOVERNOR_LEDGER'));
  assert.ok(scene.stateCoverage.domains.some((domain) => domain.id === 'settlements'));
  const ledger = scene.stateCoverage.anchors.find((entry) => entry.id === 'STATE:settlements');
  assert.ok(ledger);
  assert.equal(ledger.objectId, 'GOVERNOR_LEDGER');
  assert.equal(ledger.status, 'LAUNCHED');
  assert.equal(ledger.count, 2);
});

test('V3.0 operating model maps charter and capability state to scene anchors', () => {
  const scene = createSceneState(makeBaseView({
    operatingModel: {
      gate: {
        ready: true,
        summary: 'The town network is ready to choose an operating charter.'
      },
      selectedCharterId: 'STEADY_COMMONS',
      charter: {
        charterId: 'STEADY_COMMONS',
        label: 'Steady Commons',
        bannerText: 'Steady Commons'
      },
      summary: 'Steady Commons is shaping contracts, Clover suggestions, and town signage.',
      bannerText: 'Steady Commons',
      unlockedCapabilities: [{ capabilityId: 'CHARTER_CONTRACTS', label: 'Charter Contract Board' }],
      allowedActions: ['unlock_capability', 'refresh_contracts']
    }
  }), {
    selectedKey: '',
    activeDrawer: ''
  });

  assert.ok(scene.drawers.some((drawer) => drawer.key === 'operating'));
  assert.ok(scene.stateCoverage.domains.some((domain) => domain.id === 'operating-model'));
  const operating = scene.stateCoverage.anchors.find((entry) => entry.id === 'STATE:operating-model');
  assert.ok(operating);
  assert.equal(operating.objectId, 'PUBLIC_SQUARE');
  assert.equal(operating.status, 'CHOSEN');
  assert.equal(operating.count, 1);
  assert.match(operating.value, /Steady Commons/);
});

test('V3.5 regional network maps routes and route issues to Governor Ledger scene coverage', () => {
  const scene = createSceneState(makeBaseView({
    regionalNetwork: {
      gate: {
        ready: true,
        summary: 'The Governor Ledger can open bounded regional routes.'
      },
      summary: 'Regional ledger has 1 pending issue.',
      pendingIssueCount: 1,
      routes: [{
        routeId: 'founders_ridge_supply_route',
        label: 'Ridge Supply Route',
        status: 'SHORTAGE',
        fromSettlementId: 'town_1',
        fromSettlementName: 'Founders Plot',
        toSettlementId: 'town_2',
        toSettlementName: 'Ridge Outpost',
        transferAmount: 4,
        resource: 'wood',
        totalTransfers: 0
      }],
      contracts: [{
        contractId: 'ridge_timber_bridge',
        title: 'Ridge Timber Bridge',
        status: 'ACTIVE',
        fromSettlementName: 'Founders Plot',
        toSettlementName: 'Ridge Outpost',
        progressTransfers: 0,
        requiredTransfers: 1
      }],
      issues: [{
        issueId: 'route-shortage:founders_ridge_supply_route',
        type: 'route_shortage',
        title: 'Ridge Supply Route shortage',
        summary: 'Founders Plot needs 4 wood before the next shipment.'
      }]
    }
  }), {
    selectedKey: '',
    activeDrawer: ''
  });

  assert.ok(scene.stateCoverage.domains.some((domain) => domain.id === 'regional-network'));
  const regional = scene.stateCoverage.anchors.find((entry) => entry.id === 'STATE:regional-network');
  assert.ok(regional);
  assert.equal(regional.objectId, 'GOVERNOR_LEDGER');
  assert.equal(regional.status, 'ISSUE');
  assert.equal(regional.count, 1);
  assert.match(regional.value, /pending issue/);
  assert.equal(scene.regionalRoutes[0].routeId, 'founders_ridge_supply_route');
  assert.equal(scene.regionalRoutes[0].status, 'SHORTAGE');
});

test('stale runtime maps to restart-needed Clover state', () => {
  const scene = createSceneState(makeBaseView({
    foreman: {
      ...makeBaseView().foreman,
      runtime: {
        status: 'OBSERVING',
        runtimeId: 'rt_1',
        expiresAt: 10
      }
    }
  }), {
    localForemanRuntimeStatus: {
      hasServerRuntime: true,
      hasLocalToken: true,
      expired: true,
      needsRestart: true
    }
  });

  assert.equal(scene.clover.state, 'RESTART_NEEDED');
  assert.equal(scene.clover.assetId, 'clover_restart_needed_v1_4_4');
});

test('runtime error maps Clover to the blocked asset', () => {
  const scene = createSceneState(makeBaseView({
    foreman: {
      ...makeBaseView().foreman,
      runtime: {
        status: 'ERROR',
        runtimeId: 'rt_1',
        expiresAt: Date.now() + 60_000
      }
    }
  }), {
    localForemanRuntimeStatus: {
      hasServerRuntime: true,
      hasLocalToken: true,
      expired: false,
      needsRestart: false
    }
  });

  assert.equal(scene.clover.state, 'ERROR');
  assert.equal(scene.clover.assetId, 'clover_blocked_v1_4_4');
});

test('recently completed contracts let Clover celebrate at the contract board', () => {
  const now = Date.now();
  const scene = createSceneState(makeBaseView({
    foreman: {
      ...makeBaseView().foreman,
      runtime: {
        status: 'OBSERVING',
        runtimeId: 'rt_1',
        expiresAt: now + 60_000
      }
    },
    contracts: {
      boardLocked: false,
      offers: [],
      activeContract: null,
      completed: [
        {
          contractId: 'ctr_done',
          title: 'Market Banner',
          townBenefit: 'The town square finally feels welcoming.',
          completedAtMs: now - 30_000
        }
      ]
    }
  }));

  assert.equal(scene.clover.state, 'CELEBRATING');
  assert.equal(scene.clover.assetId, 'clover_celebrating_v1_4_4');
  assert.equal(scene.clover.targetObjectId, 'CONTRACT_BOARD');
});

test('multiple buildable lots still resolve to one recommended attention target', () => {
  const scene = createSceneState(makeBaseView(), {
    selectedKey: '',
    activeDrawer: '',
    viewportWidth: 1280
  });

  const recommended = scene.objects.filter((object) => object.attention === 'recommended');
  const available = scene.objects.filter((object) => object.attention === 'available');
  assert.equal(recommended.length, 1);
  assert.ok(available.length >= 1);
  assert.equal(scene.currentGoal.targetObjectId, recommended[0].id);
  assert.equal(recommended[0].badges.filter((badge) => badge.type === 'build').length, 1);
  assert.ok(available.every((object) => object.badges.every((badge) => badge.type !== 'build')));
});

test('acting Clover exposes action and target metadata for renderer linkage', () => {
  const scene = createSceneState(makeBaseView({
    foreman: {
      ...makeBaseView().foreman,
      runtime: {
        status: 'ACTING',
        runtimeId: 'rt_1',
        expiresAt: Date.now() + 60_000
      },
      receipt: {
        receiptId: 'rcp_1',
        action: 'collect_ready_outputs',
        result: 'Collected 4 wood.',
        reason: 'Collected 4 wood from the Lumber Camp.'
      }
    },
    pads: makeBaseView().pads.map((pad) => (pad.x === 0 && pad.y === 0 ? { ...pad, occupied: true } : pad)),
    buildings: [
      ...makeBaseView().buildings,
      {
        buildingId: 'bld_lumber',
        type: 'LUMBER_CAMP',
        x: 0,
        y: 0,
        level: 1,
        state: 'OUTPUT_READY',
        outputBuffer: { wood: 4 },
        completedJobs: [{ jobId: 'job_1' }],
        runningJob: null
      }
    ]
  }), {
    viewportWidth: 1280,
    manualForemanActing: true,
    lastActionTargetObjectId: 'LUMBER_CAMP'
  });

  assert.equal(scene.clover.state, 'ACTING');
  assert.equal(scene.clover.targetObjectId, 'LUMBER_CAMP');
  assert.ok(scene.clover.actionVerb);
  assert.equal(scene.clover.targetLabel, 'Lumber Camp');
});
