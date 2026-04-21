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
  const lots = scene.objects.filter((object) => object.kind === 'lot');
  assert.equal(lots.length, 6);
  assert.ok(lots.every((object) => object.state === 'BUILDABLE'));
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
  assert.equal(lumber.assetId, 'building_lumber_camp_base');
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

  assert.equal(scene.currentGoal.targetObjectId, 'FOREMAN_HUT');
  assert.equal(scene.clover.state, 'WAITING_FOR_PERMISSION');
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
  assert.equal(scene.clover.assetId, 'clover_restart_needed');
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
