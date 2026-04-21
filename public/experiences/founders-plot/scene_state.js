(function attachFoundersPlotSceneState(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.FoundersPlotSceneState = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function foundersPlotSceneStateFactory() {
  const PRODUCT_LABEL = 'Agent Town: Founders Plot';
  const BUILDING_LABELS = {
    HQ: 'Headquarters',
    LUMBER_CAMP: 'Lumber Camp',
    FARM_PLOT: 'Farm Plot',
    QUARRY: 'Quarry',
    WORKSHOP: 'Workshop',
    MARKET_STALL: 'Market Stall'
  };
  const UPGRADE_CAPS = {
    HQ: 5,
    LUMBER_CAMP: 2,
    FARM_PLOT: 2,
    QUARRY: 2,
    WORKSHOP: 2,
    MARKET_STALL: 2
  };
  const PAD_LAYOUT = {
    '0,0': { x: 0.23, y: 0.38, z: 24, label: 'Northwest Pad' },
    '1,0': { x: 0.50, y: 0.24, z: 30, label: 'North Pad' },
    '2,0': { x: 0.77, y: 0.38, z: 24, label: 'Northeast Pad' },
    '0,1': { x: 0.18, y: 0.60, z: 18, label: 'West Pad' },
    '2,1': { x: 0.82, y: 0.60, z: 18, label: 'East Pad' },
    '1,2': { x: 0.50, y: 0.78, z: 12, label: 'South Pad' }
  };
  const SPECIAL_OBJECT_LAYOUT = {
    CONTRACT_BOARD: { x: 0.90, y: 0.38, z: 16 },
    PUBLIC_SQUARE: { x: 0.10, y: 0.78, z: 10 },
    FOREMAN_HUT: { x: 0.88, y: 0.80, z: 12 },
    JOURNAL: { x: 0.10, y: 0.16, z: 8 }
  };
  const DEBUG_TERMS = [
    'provider',
    'model',
    'oauth',
    'wallet',
    'blockchain',
    'runtime token',
    'bearer',
    'mcp',
    'json',
    'debug',
    'schema',
    'worker trace',
    'openclaw'
  ];
  const DRAWER_CONFIG = [
    { key: 'contracts', label: 'Contracts', icon: 'board' },
    { key: 'foreman', label: 'Clover', icon: 'clover' },
    { key: 'journal', label: 'Journal', icon: 'journal' },
    { key: 'signals', label: 'Town mood', icon: 'signal' },
    { key: 'rewards', label: 'Rewards', icon: 'reward' },
    { key: 'approvals', label: 'Approvals', icon: 'approval' },
    { key: 'recap', label: 'Morning brief', icon: 'sun' }
  ];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function number(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function upper(value, fallback = '') {
    return String(value || fallback).trim().toUpperCase();
  }

  function labelForBuilding(type) {
    return BUILDING_LABELS[type] || String(type || 'Building').replace(/_/g, ' ');
  }

  function stateLabel(state) {
    switch (upper(state)) {
      case 'LOCKED':
        return 'locked';
      case 'BUILDABLE':
        return 'buildable';
      case 'UNDER_CONSTRUCTION':
        return 'under construction';
      case 'PRODUCING':
        return 'producing';
      case 'READY':
        return 'ready to collect';
      case 'BLOCKED':
        return 'blocked';
      case 'UPGRADE_READY':
        return 'ready to upgrade';
      case 'SELECTED':
        return 'selected';
      default:
        return 'idle';
    }
  }

  function buildingVisualState(building, view) {
    const rawState = upper(building?.state, 'READY');
    if (rawState === 'UNDER_CONSTRUCTION' || rawState === 'UPGRADING') return 'UNDER_CONSTRUCTION';
    if (rawState === 'PRODUCING') return 'PRODUCING';
    if (rawState === 'OUTPUT_READY') return 'READY';
    const currentGoal = view?.currentGoal?.primaryAction || {};
    const canUpgrade = number(UPGRADE_CAPS[building?.type] || 1) > number(building?.level || 1);
    if (
      canUpgrade
      && (
        (upper(currentGoal.type) === 'UPGRADE_BUILDING' && String(currentGoal.buildingId || '') === String(building?.buildingId || ''))
        || (upper(currentGoal.type) === 'UPGRADE_BUILDING' && upper(building?.type) === 'HQ' && !currentGoal.buildingId)
      )
    ) {
      return 'UPGRADE_READY';
    }
    return 'IDLE';
  }

  function padVisualState(view, pad) {
    const buildTypes = Array.isArray(view?.unlocks?.buildingTypes) ? view.unlocks.buildingTypes : [];
    if (buildTypes.length === 0) return 'LOCKED';
    const actionType = upper(view?.currentGoal?.primaryAction?.type);
    if (actionType === 'PLACE_BUILDING') return 'BUILDABLE';
    return 'BUILDABLE';
  }

  function timerForBuilding(building) {
    const running = building?.runningJob || null;
    if (!running || !number(running.endsAt)) return null;
    const startedAtMs = number(running.startedAt);
    const endsAtMs = number(running.endsAt);
    const nowMs = Date.now();
    const duration = Math.max(1, endsAtMs - Math.max(0, startedAtMs));
    return {
      startedAtMs,
      endsAtMs,
      progress: clamp((nowMs - startedAtMs) / duration, 0, 1)
    };
  }

  function selectionKeyToObjectId(selectedKey, view) {
    if (!selectedKey) return '';
    if (selectedKey === 'hq') return 'HQ';
    if (selectedKey.startsWith('building:')) {
      const buildingId = selectedKey.slice('building:'.length);
      const building = Array.isArray(view?.buildings)
        ? view.buildings.find((entry) => String(entry?.buildingId || '') === buildingId)
        : null;
      if (building) return building.type;
      return buildingId;
    }
    if (selectedKey.startsWith('pad:')) {
      return `PAD:${selectedKey.slice('pad:'.length)}`;
    }
    return '';
  }

  function goalTargetObjectId(view, selectedKey) {
    const action = view?.currentGoal?.primaryAction || {};
    const actionType = upper(action.type);
    if (actionType === 'PLACE_BUILDING') {
      const firstPad = Array.isArray(view?.pads)
        ? view.pads.find((pad) => pad && pad.occupied === false)
        : null;
      return firstPad ? `PAD:${firstPad.x},${firstPad.y}` : selectionKeyToObjectId(selectedKey, view);
    }
    if (actionType === 'QUEUE_JOB' || actionType === 'COLLECT_OUTPUTS' || actionType === 'SET_PRIORITY') {
      const building = Array.isArray(view?.buildings)
        ? view.buildings.find((entry) => String(entry?.buildingId || '') === String(action.buildingId || ''))
        : null;
      return building ? building.type : '';
    }
    if (actionType === 'UPGRADE_BUILDING') {
      if (!action.buildingId) return 'HQ';
      const building = Array.isArray(view?.buildings)
        ? view.buildings.find((entry) => String(entry?.buildingId || '') === String(action.buildingId || ''))
        : null;
      return building ? building.type : '';
    }
    if (actionType === 'TURN_IN_CONTRACT' || actionType === 'ACCEPT_CONTRACT') {
      return 'CONTRACT_BOARD';
    }
    if (actionType === 'UPGRADE_LANDMARK') {
      return 'PUBLIC_SQUARE';
    }
    if (actionType === 'RESOLVE_APPROVAL' || view?.foreman?.pendingApprovals?.length > 0) {
      return 'FOREMAN_HUT';
    }
    return selectionKeyToObjectId(selectedKey, view);
  }

  function buildingBadges(building, state, view) {
    const badges = [];
    if (state === 'READY') {
      const resources = Object.entries(building?.outputBuffer || {})
        .filter(([, amount]) => number(amount) > 0)
        .map(([key, amount]) => `${number(amount)} ${key}`)
        .join(', ');
      badges.push({
        type: 'ready',
        label: resources ? `Ready: ${resources}` : 'Ready to collect',
        tone: 'good'
      });
    }
    if (state === 'PRODUCING') {
      badges.push({
        type: 'timer',
        label: 'Producing',
        tone: 'neutral'
      });
    }
    if (state === 'UNDER_CONSTRUCTION') {
      badges.push({
        type: 'construction',
        label: 'Under construction',
        tone: 'warn'
      });
    }
    if (state === 'UPGRADE_READY') {
      badges.push({
        type: 'upgrade',
        label: 'Upgrade ready',
        tone: 'neutral'
      });
    }
    if (
      upper(view?.currentGoal?.primaryAction?.type) === 'QUEUE_JOB'
      && String(view?.currentGoal?.primaryAction?.buildingId || '') === String(building?.buildingId || '')
      && upper(state) === 'IDLE'
      && !view?.policy?.queueProduction
    ) {
      badges.push({
        type: 'blocked',
        label: 'Queueing still locked',
        tone: 'warn'
      });
    }
    return badges;
  }

  function assetIdForBuilding(building, state) {
    const type = upper(building?.type);
    if (type === 'HQ') return `building_hq_level_${clamp(number(building?.level || 1), 1, 5)}`;
    if (type === 'LUMBER_CAMP') return 'building_lumber_camp_base';
    if (type === 'FARM_PLOT') return 'building_farm_plot_base';
    if (type === 'QUARRY') return 'building_quarry_base';
    if (type === 'WORKSHOP') return 'building_workshop_base';
    if (type === 'MARKET_STALL') return 'building_market_stall_base';
    if (state === 'LOCKED') return 'object_locked_lot';
    return 'object_empty_lot_buildable';
  }

  function objectPrimaryAction(objectId, view, building) {
    if (objectId === 'CONTRACT_BOARD') {
      if (view?.contracts?.activeContract?.status === 'READY_TO_TURN_IN') {
        return { label: 'Turn in contract', action: 'drawer:contracts' };
      }
      return { label: 'Read contracts', action: 'drawer:contracts' };
    }
    if (objectId === 'PUBLIC_SQUARE') {
      return { label: 'Inspect square', action: 'drawer:signals' };
    }
    if (objectId === 'FOREMAN_HUT') {
      return { label: 'Talk to Clover', action: 'drawer:foreman' };
    }
    if (objectId.startsWith('PAD:')) {
      return { label: 'Build here', action: `select:${objectId}` };
    }
    if (building) {
      const state = upper(building?.state);
      if (state === 'OUTPUT_READY') return { label: 'Collect outputs', action: `select:${objectId}` };
      if (state === 'READY' && building?.type !== 'HQ') return { label: 'Queue job', action: `select:${objectId}` };
      return { label: 'Inspect', action: `select:${objectId}` };
    }
    return { label: 'Inspect', action: `select:${objectId}` };
  }

  function clampBubbleText(text, fallback) {
    const raw = String(text || fallback || '').trim();
    const sanitized = DEBUG_TERMS.reduce((value, term) => value.replace(new RegExp(term, 'ig'), ''), raw)
      .replace(/\s+/g, ' ')
      .trim();
    if (!sanitized) return fallback;
    if (sanitized.length <= 90) return sanitized;
    return `${sanitized.slice(0, 87).trimEnd()}...`;
  }

  function cloverState(view, options) {
    const runtime = view?.foreman?.runtime || {};
    const local = options?.localForemanRuntimeStatus || {};
    const pendingApprovals = Array.isArray(view?.foreman?.pendingApprovals) ? view.foreman.pendingApprovals : [];
    const receipt = view?.foreman?.receipt || null;
    const scheduler = view?.foreman?.scheduler?.collectReadyOutputs || {};
    const runtimeStatus = upper(runtime.status, 'NOT_STARTED');

    if (pendingApprovals.length > 0) {
      return {
        state: 'WAITING_FOR_PERMISSION',
        bubbleText: clampBubbleText(pendingApprovals[0]?.title, 'I need your say-so before the next move.'),
        targetObjectId: 'FOREMAN_HUT'
      };
    }
    if (runtimeStatus === 'ERROR') {
      return {
        state: 'ERROR',
        bubbleText: 'Clover hit a snag. Open the Foreman drawer.',
        targetObjectId: 'FOREMAN_HUT'
      };
    }
    if (local?.expired || local?.needsRestart || runtimeStatus === 'STALE') {
      return {
        state: 'RESTART_NEEDED',
        bubbleText: 'Clover needs a fresh start in this tab.',
        targetObjectId: 'FOREMAN_HUT'
      };
    }
    if (runtimeStatus === 'PAUSED') {
      return {
        state: 'PAUSED',
        bubbleText: 'Foreman paused. Wake Clover when you want help again.',
        targetObjectId: 'FOREMAN_HUT'
      };
    }
    if (runtimeStatus === 'ACTING' || options?.workerSchedulerStatus?.tickRunning === true || options?.manualForemanActing === true) {
      return {
        state: 'ACTING',
        bubbleText: clampBubbleText(receipt?.summary || view?.foreman?.recommendation, 'Clover is handling one safe task.'),
        targetObjectId: options?.lastActionTargetObjectId || goalTargetObjectId(view, options?.selectedKey || '')
      };
    }
    if (runtimeStatus === 'THINKING') {
      return {
        state: 'THINKING',
        bubbleText: clampBubbleText(view?.foreman?.recommendation, 'Checking the safest next step.'),
        targetObjectId: goalTargetObjectId(view, options?.selectedKey || '')
      };
    }
    if (runtimeStatus === 'BOOTING' || runtimeStatus === 'OBSERVING') {
      return {
        state: 'OBSERVING',
        bubbleText: clampBubbleText(view?.foreman?.recommendation, 'Watching the plot.'),
        targetObjectId: goalTargetObjectId(view, options?.selectedKey || '')
      };
    }
    return {
      state: 'NOT_STARTED',
      bubbleText: 'Clover is ready when you are.',
      targetObjectId: scheduler?.enabled ? 'FOREMAN_HUT' : ''
    };
  }

  function drawerBadges(view) {
    const activeContract = view?.contracts?.activeContract || null;
    const contractOffers = Array.isArray(view?.contracts?.offers) ? view.contracts.offers : [];
    const pendingApprovals = Array.isArray(view?.foreman?.pendingApprovals) ? view.foreman.pendingApprovals : [];
    const rewards = Array.isArray(view?.rewards) ? view.rewards : [];
    const unseenRecap = number(view?.recap?.unseenCount || 0);
    return {
      contracts: activeContract?.status === 'READY_TO_TURN_IN'
        ? 1
        : activeContract
          ? 1
          : contractOffers.length,
      approvals: pendingApprovals.length,
      rewards: rewards.length,
      journal: unseenRecap,
      recap: unseenRecap,
      signals: 0,
      foreman: pendingApprovals.length > 0 ? 1 : 0
    };
  }

  function currentGoal(view) {
    const goal = view?.currentGoal || view?.quest || {};
    const action = goal?.primaryAction && typeof goal.primaryAction === 'object' ? goal.primaryAction : {};
    return {
      title: String(goal.title || 'Grow the first district'),
      body: clampBubbleText(goal.body, 'Keep the town moving one clear step at a time.'),
      owner: String(goal.owner || 'tutorial'),
      primaryAction: action,
      primaryCtaLabel: String(goal.primaryCtaLabel || '').trim() || ''
    };
  }

  function resourceRows(view) {
    const inventory = view?.plot?.inventory || {};
    return [
      { key: 'wood', label: 'Wood', value: number(inventory.wood) },
      { key: 'stone', label: 'Stone', value: number(inventory.stone) },
      { key: 'food', label: 'Food', value: number(inventory.food) },
      { key: 'coin', label: 'Coin', value: number(inventory.coin) },
      { key: 'townXp', label: 'Town XP', value: number(view?.plot?.townXp) }
    ];
  }

  function drawers(view, options) {
    const badges = drawerBadges(view);
    const activeDrawer = String(options?.activeDrawer || '');
    return DRAWER_CONFIG.map((entry) => ({
      key: entry.key,
      label: entry.label,
      icon: entry.icon,
      badgeCount: badges[entry.key] || 0,
      active: activeDrawer === entry.key
    }));
  }

  function createWorldObjects(view, options) {
    const objects = [];
    const selectedObjectId = selectionKeyToObjectId(String(options?.selectedKey || ''), view);
    const goalObjectId = goalTargetObjectId(view, String(options?.selectedKey || ''));

    const hqBuilding = Array.isArray(view?.buildings)
      ? view.buildings.find((entry) => upper(entry?.type) === 'HQ')
      : null;
    if (hqBuilding) {
      const hqState = buildingVisualState(hqBuilding, view);
      const hqLayout = { x: 0.50, y: 0.49, z: 32 };
      objects.push({
        id: 'HQ',
        kind: 'building',
        buildingType: 'HQ',
        label: labelForBuilding('HQ'),
        state: hqState,
        x: hqLayout.x,
        y: hqLayout.y,
        z: hqLayout.z,
        assetId: assetIdForBuilding(hqBuilding, hqState),
        badges: buildingBadges(hqBuilding, hqState, view),
        timer: timerForBuilding(hqBuilding),
        primaryAction: objectPrimaryAction('HQ', view, hqBuilding),
        ariaLabel: `${labelForBuilding('HQ')}, ${stateLabel(hqState)}, ${objectPrimaryAction('HQ', view, hqBuilding).label}.`,
        selected: selectedObjectId === 'HQ',
        goalTarget: goalObjectId === 'HQ',
        selectionKey: 'hq',
        testId: 'founders-stage-object-HQ'
      });
    }

    const pads = Array.isArray(view?.pads) ? view.pads : [];
    pads.forEach((pad) => {
      const key = `${pad.x},${pad.y}`;
      const layout = PAD_LAYOUT[key];
      if (!layout) return;
      const building = Array.isArray(view?.buildings)
        ? view.buildings.find((entry) => number(entry?.x) === number(pad.x) && number(entry?.y) === number(pad.y) && upper(entry?.type) !== 'HQ')
        : null;
      if (building) {
        const state = buildingVisualState(building, view);
        const objectId = String(building.type || building.buildingId || key);
        objects.push({
          id: objectId,
          kind: 'building',
          buildingType: building.type,
          label: labelForBuilding(building.type),
          state,
          x: layout.x,
          y: layout.y,
          z: layout.z,
          assetId: assetIdForBuilding(building, state),
          badges: buildingBadges(building, state, view),
          timer: timerForBuilding(building),
          primaryAction: objectPrimaryAction(objectId, view, building),
          ariaLabel: `${labelForBuilding(building.type)}, ${stateLabel(state)}, ${objectPrimaryAction(objectId, view, building).label}.`,
          selected: selectedObjectId === objectId,
          goalTarget: goalObjectId === objectId,
          selectionKey: `building:${building.buildingId}`,
          testId: `founders-stage-object-${building.type}`
        });
        return;
      }
      const state = padVisualState(view, pad);
      const objectId = `PAD:${key}`;
      objects.push({
        id: objectId,
        kind: 'lot',
        label: String(layout.label || pad.label || 'Open lot'),
        state,
        x: layout.x,
        y: layout.y,
        z: layout.z,
        assetId: state === 'LOCKED' ? 'object_locked_lot' : 'object_empty_lot_buildable',
        badges: state === 'BUILDABLE'
          ? [{ type: 'build', label: 'Build here', tone: 'neutral' }]
          : [{ type: 'locked', label: 'Locked lot', tone: 'warn' }],
        timer: null,
        primaryAction: objectPrimaryAction(objectId, view, null),
        ariaLabel: `${layout.label || pad.label || 'Lot'}, ${stateLabel(state)}, ${objectPrimaryAction(objectId, view, null).label}.`,
        selected: selectedObjectId === objectId,
        goalTarget: goalObjectId === objectId,
        selectionKey: `pad:${key}`,
        testId: `founders-stage-object-lot-${pad.x}-${pad.y}`
      });
    });

    const contractsState = view?.contracts?.boardLocked
      ? 'LOCKED'
      : view?.contracts?.activeContract?.status === 'READY_TO_TURN_IN'
        ? 'READY'
        : view?.contracts?.activeContract
          ? 'PRODUCING'
          : Array.isArray(view?.contracts?.offers) && view.contracts.offers.length > 0
            ? 'BUILDABLE'
            : 'IDLE';
    objects.push({
      id: 'CONTRACT_BOARD',
      kind: 'object',
      label: 'Contract Board',
      state: contractsState,
      x: SPECIAL_OBJECT_LAYOUT.CONTRACT_BOARD.x,
      y: SPECIAL_OBJECT_LAYOUT.CONTRACT_BOARD.y,
      z: SPECIAL_OBJECT_LAYOUT.CONTRACT_BOARD.z,
      assetId: 'object_contract_board_base',
      badges: [
        view?.contracts?.activeContract?.status === 'READY_TO_TURN_IN'
          ? { type: 'contract', label: 'Turn-in ready', tone: 'good' }
          : view?.contracts?.boardLocked
            ? { type: 'locked', label: 'Unlocks at HQ2', tone: 'warn' }
            : { type: 'contract', label: 'Town requests', tone: 'neutral' }
      ],
      timer: null,
      primaryAction: objectPrimaryAction('CONTRACT_BOARD', view, null),
      ariaLabel: `Contract Board, ${stateLabel(contractsState)}, ${objectPrimaryAction('CONTRACT_BOARD', view, null).label}.`,
      selected: selectedObjectId === 'CONTRACT_BOARD',
      goalTarget: goalObjectId === 'CONTRACT_BOARD',
      selectionKey: '',
      drawerKey: 'contracts',
      testId: 'founders-stage-object-CONTRACT_BOARD'
    });

    const publicSquareLevel = number(view?.landmarks?.publicSquare?.level || 0);
    const publicSquareState = publicSquareLevel <= 0 && upper(view?.currentGoal?.primaryAction?.type) === 'UPGRADE_LANDMARK'
      ? 'UPGRADE_READY'
      : publicSquareLevel > 0
        ? 'IDLE'
        : 'BUILDABLE';
    objects.push({
      id: 'PUBLIC_SQUARE',
      kind: 'object',
      label: 'Welcome Sign',
      state: publicSquareState,
      x: SPECIAL_OBJECT_LAYOUT.PUBLIC_SQUARE.x,
      y: SPECIAL_OBJECT_LAYOUT.PUBLIC_SQUARE.y,
      z: SPECIAL_OBJECT_LAYOUT.PUBLIC_SQUARE.z,
      assetId: publicSquareLevel > 0
        ? 'object_public_square_welcome_sign_upgraded'
        : 'object_public_square_welcome_sign_base',
      badges: [
        publicSquareLevel > 0
          ? { type: 'charm', label: 'Square raised', tone: 'good' }
          : { type: 'civic', label: 'Civic project', tone: 'neutral' }
      ],
      timer: null,
      primaryAction: objectPrimaryAction('PUBLIC_SQUARE', view, null),
      ariaLabel: `Welcome Sign, ${stateLabel(publicSquareState)}, ${objectPrimaryAction('PUBLIC_SQUARE', view, null).label}.`,
      selected: selectedObjectId === 'PUBLIC_SQUARE',
      goalTarget: goalObjectId === 'PUBLIC_SQUARE',
      selectionKey: '',
      drawerKey: 'signals',
      testId: 'founders-stage-object-PUBLIC_SQUARE'
    });

    const foremanObjectState = view?.foreman?.pendingApprovals?.length > 0
      ? 'READY'
      : options?.localForemanRuntimeStatus?.needsRestart || options?.localForemanRuntimeStatus?.expired
        ? 'BLOCKED'
        : upper(view?.foreman?.runtime?.status) === 'PAUSED'
          ? 'IDLE'
          : upper(view?.foreman?.runtime?.status) === 'NOT_STARTED'
            ? 'BUILDABLE'
            : 'PRODUCING';
    objects.push({
      id: 'FOREMAN_HUT',
      kind: 'object',
      label: 'Foreman Hut',
      state: foremanObjectState,
      x: SPECIAL_OBJECT_LAYOUT.FOREMAN_HUT.x,
      y: SPECIAL_OBJECT_LAYOUT.FOREMAN_HUT.y,
      z: SPECIAL_OBJECT_LAYOUT.FOREMAN_HUT.z,
      assetId: 'object_foreman_hut_base',
      badges: [
        view?.foreman?.pendingApprovals?.length > 0
          ? { type: 'approval', label: `${view.foreman.pendingApprovals.length} waiting`, tone: 'warn' }
          : options?.localForemanRuntimeStatus?.needsRestart || options?.localForemanRuntimeStatus?.expired
            ? { type: 'restart', label: 'Needs a fresh start', tone: 'warn' }
            : { type: 'foreman', label: 'Clover nearby', tone: 'neutral' }
      ],
      timer: null,
      primaryAction: objectPrimaryAction('FOREMAN_HUT', view, null),
      ariaLabel: `Foreman Hut, ${stateLabel(foremanObjectState)}, ${objectPrimaryAction('FOREMAN_HUT', view, null).label}.`,
      selected: selectedObjectId === 'FOREMAN_HUT',
      goalTarget: goalObjectId === 'FOREMAN_HUT',
      selectionKey: '',
      drawerKey: 'foreman',
      testId: 'founders-stage-object-FOREMAN_HUT'
    });

    return objects;
  }

  function createSceneState(view, options = {}) {
    const goal = currentGoal(view);
    const clover = cloverState(view, options);
    const objects = createWorldObjects(view, options);
    const selectedObjectId = selectionKeyToObjectId(String(options.selectedKey || ''), view);
    const drawerItems = drawers(view, options);
    const objectiveTargetId = goalTargetObjectId(view, String(options.selectedKey || ''));
    const stageBackgrounds = {
      desktop: '/experiences/founders-plot/assets/scenes/founders-plot-desktop.webp',
      mobile: '/experiences/founders-plot/assets/scenes/founders-plot-mobile.webp'
    };
    return {
      productLabel: PRODUCT_LABEL,
      hqLevel: number(view?.progress?.currentLevel || view?.plot?.hqLevel || 1),
      hqProgress: {
        ratio: clamp(number(view?.progress?.next?.ratio || 0), 0, 1),
        current: number(view?.progress?.next?.xpCurrent || view?.plot?.townXp || 0),
        required: number(view?.progress?.next?.xpRequired || 0)
      },
      resources: resourceRows(view),
      currentGoal: {
        title: goal.title,
        body: goal.body,
        owner: goal.owner,
        primaryAction: goal.primaryAction,
        primaryCtaLabel: String(goal.primaryCtaLabel || '').trim(),
        targetObjectId: objectiveTargetId
      },
      clover: {
        ...clover,
        assetId: {
          NOT_STARTED: 'clover_idle',
          OBSERVING: 'clover_observing',
          THINKING: 'clover_thinking',
          ACTING: 'clover_acting',
        WAITING_FOR_PERMISSION: 'clover_waiting_approval',
        PAUSED: 'clover_paused',
        RESTART_NEEDED: 'clover_restart_needed',
        ERROR: 'clover_restart_needed'
      }[clover.state] || 'clover_idle',
        x: 0.76,
        y: 0.64
      },
      drawers: drawerItems,
      drawerBadges: drawerBadges(view),
      objects,
      selectedObjectId,
      stageBackgrounds,
      debugTerminology: DEBUG_TERMS.slice()
    };
  }

  return {
    BUILDING_LABELS,
    DRAWER_CONFIG,
    PRODUCT_LABEL,
    assetIdForBuilding,
    buildingVisualState,
    cloverState,
    createSceneState,
    drawerBadges,
    goalTargetObjectId,
    selectionKeyToObjectId,
    stateLabel
  };
});
