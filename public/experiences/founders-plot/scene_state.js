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
    '0,0': { x: 0.13, y: 0.55, z: 16, label: 'Northwest Pad' },
    '1,0': { x: 0.27, y: 0.40, z: 22, label: 'North Pad' },
    '2,0': { x: 0.42, y: 0.28, z: 28, label: 'Northeast Pad' },
    '0,1': { x: 0.86, y: 0.40, z: 22, label: 'West Pad' },
    '2,1': { x: 0.88, y: 0.68, z: 14, label: 'East Pad' },
    '1,2': { x: 0.77, y: 0.90, z: 10, label: 'South Pad' }
  };
  const WORLD_GRID = {
    version: 'founders-plot-grid-v1',
    cols: 8,
    rows: 5,
    worldWidth: 16,
    worldHeight: 9
  };
  const SPECIAL_OBJECT_LAYOUT = {
    CONTRACT_BOARD: { x: 0.81, y: 0.66, z: 18 },
    PUBLIC_SQUARE: { x: 0.55, y: 0.78, z: 16 },
    SCENARIO_SITE: { x: 0.46, y: 0.86, z: 17 },
    FOREMAN_HUT: { x: 0.18, y: 0.90, z: 18 },
    GOVERNOR_LEDGER: { x: 0.34, y: 0.87, z: 19 },
    SETTLEMENT_NODE_TOWN_1: { x: 0.24, y: 0.72, z: 12 },
    SETTLEMENT_NODE_TOWN_2: { x: 0.46, y: 0.70, z: 12 },
    JOURNAL: { x: 0.09, y: 0.86, z: 10 },
    CREATOR_KIOSK: { x: 0.64, y: 0.90, z: 13 },
    APPROVAL_INBOX: { x: 0.93, y: 0.84, z: 12 }
  };
  const WORLD_PROPS = [
    {
      id: 'PROP:SUPPLY_CRATES',
      propId: 'supply_crates',
      worldObjectId: 'supply_crates',
      label: 'Supply Crates',
      state: 'AMBIENT',
      x: 0.34,
      y: 0.71,
      z: 11,
      scale: 0.5,
      assetId: 'founders_plot_supply_crates_prop_v1_4_4'
    }
  ];
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
    { key: 'settlements', label: 'Ledger', icon: 'ledger' },
    { key: 'operating', label: 'Charter', icon: 'charter' },
    { key: 'creator', label: 'Creator', icon: 'creator' },
    { key: 'journal', label: 'Journal', icon: 'journal' },
    { key: 'signals', label: 'Town mood', icon: 'signal' },
    { key: 'rewards', label: 'Rewards', icon: 'reward' },
    { key: 'approvals', label: 'Approvals', icon: 'approval' },
    { key: 'recap', label: 'Morning brief', icon: 'sun' }
  ];
  const DRAWER_FEATURES = {
    settlements: 'FEATURE_FOUNDERS_V25_SECOND_SETTLEMENT',
    operating: 'FEATURE_FOUNDERS_V30_OPERATING_MODEL',
    creator: 'FEATURE_FOUNDERS_V45_CREATOR_BUILDINGS'
  };
  const COVERAGE_FEATURES = {
    'civic-scenarios': 'FEATURE_FOUNDERS_V16_SCENARIOS',
    'town-identity': 'FEATURE_FOUNDERS_V17_TOWN_IDENTITY',
    'town-postcards': 'FEATURE_FOUNDERS_V17_TOWN_IDENTITY',
    settlements: 'FEATURE_FOUNDERS_V25_SECOND_SETTLEMENT',
    'regional-network': 'FEATURE_FOUNDERS_V35_REGIONAL_GOVERNANCE',
    'operating-model': 'FEATURE_FOUNDERS_V30_OPERATING_MODEL',
    'creator-extensions': 'FEATURE_FOUNDERS_V45_CREATOR_BUILDINGS',
    'foreman-governance': 'FEATURE_FOUNDERS_V20_PERSISTENT_FOREMAN',
    'foreman-persistent': 'FEATURE_FOUNDERS_V20_PERSISTENT_FOREMAN',
    'foreman-doctrine': 'FEATURE_FOUNDERS_V21_DOCTRINE_LITE',
    'foreman-specialists': 'FEATURE_FOUNDERS_V31_SPECIALISTS'
  };
  const BADGE_PRIORITY = {
    approval: 100,
    restart: 96,
    blocked: 92,
    locked: 88,
    ready: 80,
    contract: 76,
    opportunity: 74,
    timer: 68,
    construction: 64,
    upgrade: 60,
    build: 56,
    foreman: 52,
    civic: 48,
    identity: 46,
    postcard: 45,
    charm: 44
  };
  const WORLD_OBJECT_IDS = {
    HQ: 'hq',
    LUMBER_CAMP: 'lumber_camp',
    FARM_PLOT: 'farm_plot',
    QUARRY: 'quarry',
    WORKSHOP: 'workshop',
    MARKET_STALL: 'market_stall',
    CONTRACT_BOARD: 'contract_board',
    PUBLIC_SQUARE: 'public_square',
    SCENARIO_SITE: 'scenario_site',
    FOREMAN_HUT: 'foreman_hut',
    JOURNAL: 'journal',
    APPROVAL_INBOX: 'approval_inbox'
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function number(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function roadmapFeatureEnabled(view, featureKey = '') {
    if (!featureKey) return true;
    return view?.featureFlags?.[featureKey] === true;
  }

  function gridCoordForPoint(x, y) {
    const col = clamp(Math.floor(clamp(number(x, 0.5), 0, 0.9999) * WORLD_GRID.cols), 0, WORLD_GRID.cols - 1);
    const row = clamp(Math.floor(clamp(number(y, 0.5), 0, 0.9999) * WORLD_GRID.rows), 0, WORLD_GRID.rows - 1);
    return {
      id: `GRID:${col},${row}`,
      col,
      row,
      x: (col + 0.5) / WORLD_GRID.cols,
      y: (row + 0.5) / WORLD_GRID.rows
    };
  }

  function createWorldGrid(objects = [], selectedObjectId = '') {
    const objectCells = new Map();
    objects.forEach((object) => {
      const cell = gridCoordForPoint(object?.x, object?.y);
      objectCells.set(cell.id, [...(objectCells.get(cell.id) || []), object]);
    });

    const cells = [];
    for (let row = 0; row < WORLD_GRID.rows; row += 1) {
      for (let col = 0; col < WORLD_GRID.cols; col += 1) {
        const id = `GRID:${col},${row}`;
        const center = {
          x: (col + 0.5) / WORLD_GRID.cols,
          y: (row + 0.5) / WORLD_GRID.rows
        };
        const cellObjects = objectCells.get(id) || [];
        const primary = cellObjects.find((object) => String(object?.id || '').startsWith('PAD:'))
          || cellObjects.find((object) => object?.kind === 'building')
          || cellObjects[0]
          || null;
        const padObject = cellObjects.find((object) => String(object?.id || '').startsWith('PAD:')) || null;
        const buildingObject = cellObjects.find((object) => object?.kind === 'building') || null;
        const buildable = !!padObject && String(padObject.state || '').toUpperCase() === 'BUILDABLE';
        const locked = !!padObject && String(padObject.state || '').toUpperCase() === 'LOCKED';
        const occupied = !!buildingObject;
        cells.push({
          id,
          col,
          row,
          x: center.x,
          y: center.y,
          width: 1 / WORLD_GRID.cols,
          height: 1 / WORLD_GRID.rows,
          objectIds: cellObjects.map((object) => String(object?.id || '')).filter(Boolean),
          primaryObjectId: String(primary?.id || ''),
          primaryLabel: String(primary?.label || ''),
          selectionKey: String(primary?.selectionKey || ''),
          drawerKey: String(primary?.drawerKey || ''),
          buildable,
          locked,
          occupied,
          selected: !!selectedObjectId && cellObjects.some((object) => String(object?.id || '') === selectedObjectId),
          validPlacement: buildable && !occupied,
          padX: padObject?.padX ?? buildingObject?.padX ?? null,
          padY: padObject?.padY ?? buildingObject?.padY ?? null
        });
      }
    }

    return {
      version: WORLD_GRID.version,
      cols: WORLD_GRID.cols,
      rows: WORLD_GRID.rows,
      world: {
        width: WORLD_GRID.worldWidth,
        height: WORLD_GRID.worldHeight
      },
      cells
    };
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
      default:
        return 'idle';
    }
  }

  function cleanShortCopy(text, fallback) {
    const raw = String(text || fallback || '').trim();
    const sanitized = DEBUG_TERMS.reduce((value, term) => value.replace(new RegExp(term, 'ig'), ''), raw)
      .replace(/\s+/g, ' ')
      .trim();
    if (!sanitized) return fallback;
    if (sanitized.length <= 90) return sanitized;
    return `${sanitized.slice(0, 87).trimEnd()}...`;
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

  function padVisualState(view) {
    const buildTypes = Array.isArray(view?.unlocks?.buildingTypes) ? view.unlocks.buildingTypes : [];
    return buildTypes.length === 0 ? 'LOCKED' : 'BUILDABLE';
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

  function objectIdForBuilding(building, view) {
    if (!building) return '';
    const type = String(building.type || building.buildingId || '').trim();
    if (upper(type) === 'HQ') return 'HQ';
    const sameTypeCount = Array.isArray(view?.buildings)
      ? view.buildings.filter((entry) => upper(entry?.type) === upper(type)).length
      : 0;
    if (sameTypeCount > 1 && building.buildingId) return `${type}:${building.buildingId}`;
    return type || String(building.buildingId || '');
  }

  function selectionKeyToObjectId(selectedKey, view) {
    if (!selectedKey) return '';
    if (selectedKey === 'hq') return 'HQ';
    if (selectedKey.startsWith('building:')) {
      const buildingId = selectedKey.slice('building:'.length);
      const building = Array.isArray(view?.buildings)
        ? view.buildings.find((entry) => String(entry?.buildingId || '') === buildingId)
        : null;
      return building ? objectIdForBuilding(building, view) : buildingId;
    }
    if (selectedKey.startsWith('pad:')) return `PAD:${selectedKey.slice('pad:'.length)}`;
    return '';
  }

  function goalTargetObjectId(view, selectedKey) {
    const action = view?.currentGoal?.primaryAction || view?.quest?.primaryAction || {};
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
      return building ? objectIdForBuilding(building, view) : '';
    }
    if (actionType === 'UPGRADE_BUILDING' || actionType === 'UPGRADE_HQ') {
      if (!action.buildingId) return 'HQ';
      const building = Array.isArray(view?.buildings)
        ? view.buildings.find((entry) => String(entry?.buildingId || '') === String(action.buildingId || ''))
        : null;
      return building ? objectIdForBuilding(building, view) : '';
    }
    if (actionType === 'TURN_IN_CONTRACT' || actionType === 'ACCEPT_CONTRACT' || actionType === 'VIEW_CONTRACT_BOARD') {
      return 'CONTRACT_BOARD';
    }
    if (actionType === 'START_SCENARIO' || actionType === 'CONTRIBUTE_SCENARIO' || actionType === 'VIEW_SCENARIO_BOARD') {
      return 'SCENARIO_SITE';
    }
    if (actionType === 'UPGRADE_LANDMARK' || actionType === 'VIEW_TOWN_OPPORTUNITY' || actionType === 'VIEW_TOWN_IDENTITY') {
      return 'PUBLIC_SQUARE';
    }
    if (actionType === 'RESOLVE_APPROVAL' || (Array.isArray(view?.foreman?.pendingApprovals) && view.foreman.pendingApprovals.length > 0)) {
      return 'APPROVAL_INBOX';
    }
    return selectionKeyToObjectId(selectedKey, view);
  }

  function sortBadges(badges = []) {
    return badges.slice().sort((left, right) => {
      const priorityLeft = BADGE_PRIORITY[String(left?.type || '').trim()] || 0;
      const priorityRight = BADGE_PRIORITY[String(right?.type || '').trim()] || 0;
      return priorityRight - priorityLeft;
    });
  }

  function capBadges(badges = [], { viewportWidth = 1280, selected = false } = {}) {
    const sorted = sortBadges(badges);
    if (selected) return sorted;
    if (number(viewportWidth, 1280) <= 430) return sorted.slice(0, 1);
    return sorted.slice(0, 2);
  }

  function viewportClass(viewportWidth = 1280) {
    const normalized = number(viewportWidth, 1280);
    if (normalized <= 480) return 'mobile';
    if (normalized <= 900) return 'tablet';
    return 'desktop';
  }

  function mobileSignalPriority(role = '') {
    switch (String(role || '').trim()) {
      case 'critical':
        return 100;
      case 'objective':
        return 92;
      case 'clover':
        return 84;
      case 'selected':
        return 76;
      case 'status':
        return 64;
      case 'locked':
        return 44;
      case 'available':
        return 32;
      default:
        return 12;
    }
  }

  function objectAttention(object, goalObjectId) {
    if (String(object?.id || '') === String(goalObjectId || '')) return 'recommended';
    if (object?.state === 'BLOCKED' || object?.state === 'LOCKED') return 'blocked';
    if (object?.kind === 'lot' && object?.state === 'BUILDABLE') return 'available';
    return 'none';
  }

  function objectLabelRole(object, context = {}) {
    const {
      selected = false,
      goalTarget = false,
      cloverTarget = false
    } = context;
    if (selected) return 'selected';
    if (goalTarget) return 'objective';
    if (cloverTarget) return 'clover';
    if (object?.state === 'BLOCKED') return 'critical';
    if (object?.state === 'LOCKED') return 'locked';
    if (object?.kind === 'lot' && object?.state === 'BUILDABLE') return 'available';
    return 'ambient';
  }

  function badgeLabelRole(badge = {}, context = {}) {
    const {
      selected = false,
      goalTarget = false,
      cloverTarget = false
    } = context;
    const type = String(badge?.type || '').trim();
    if (type === 'approval' || type === 'restart' || type === 'blocked') return 'critical';
    if (goalTarget) return 'objective';
    if (selected) return 'selected';
    if (cloverTarget) return 'clover';
    if (type === 'build') return 'available';
    if (type === 'locked') return 'locked';
    if (String(badge?.overlayRole || '').trim() === 'status') return 'status';
    return 'ambient';
  }

  function shouldShowLabel(object, {
    viewportWidth = 1280,
    selected = false,
    attention = 'none',
    labelRole = '',
    cloverTarget = false,
    cloverState = ''
  } = {}) {
    const mobile = viewportClass(viewportWidth) === 'mobile';
    if (mobile) {
      if (String(cloverState || '').toUpperCase() === 'ACTING') {
        if (selected) return true;
        if (String(labelRole || '').trim() === 'critical') return true;
        if (cloverTarget) return false;
        return false;
      }
      return ['objective', 'selected', 'clover', 'critical'].includes(String(labelRole || '').trim()) || (cloverTarget && !selected);
    }
    return selected || attention === 'recommended' || cloverTarget;
  }

  function worldObjectIdFor(objectId, buildingType = '') {
    if (buildingType && WORLD_OBJECT_IDS[upper(buildingType)]) return WORLD_OBJECT_IDS[upper(buildingType)];
    if (String(objectId || '').startsWith('PAD:')) return 'lot';
    return WORLD_OBJECT_IDS[String(objectId || '')] || String(objectId || '').trim().toLowerCase();
  }

  function hqVisualTier(level) {
    const normalized = clamp(number(level || 1), 1, 5);
    if (normalized >= 5) return 'established';
    if (normalized >= 3) return 'improved';
    return 'starter';
  }

  function hqScale(level) {
    const normalized = clamp(number(level || 1), 1, 5);
    if (normalized >= 5) return 1.08;
    if (normalized >= 3) return 1.01;
    return 0.92;
  }

  function badgeOverlayDefaults(badge = {}) {
    switch (String(badge.type || '').trim()) {
      case 'build':
        return { overlayRole: 'available', overlayWeight: 'quiet' };
      case 'locked':
      case 'blocked':
      case 'restart':
        return { overlayRole: 'status', overlayWeight: 'medium' };
      case 'ready':
        return { overlayRole: 'status', overlayWeight: 'medium' };
      case 'approval':
        return { overlayRole: 'status', overlayWeight: 'strong' };
      case 'contract':
      case 'foreman':
      case 'civic':
      case 'charm':
        return { overlayRole: 'ambient', overlayWeight: 'quiet' };
      default:
        return { overlayRole: 'status', overlayWeight: 'medium' };
    }
  }

  function badgeShouldRender(badge = {}, context = {}) {
    const {
      selected = false,
      goalTarget = false,
      viewportWidth = 1280,
      cloverTarget = false
    } = context;
    const mobile = viewportClass(viewportWidth) === 'mobile';
    const labelRole = String(badge?.labelRole || '').trim();
    if (badge.showWhenSelected && !selected && !goalTarget) return false;
    if (badge.showWhenGoal && !goalTarget) return false;
    if (badge.overlayRole === 'ambient' && !badge.alwaysVisible && !selected && !goalTarget) return false;
    if (badge.overlayRole === 'available' && mobile && !selected && !goalTarget) return false;
    if (mobile) {
      if (labelRole === 'critical') return true;
      if (selected || goalTarget) return labelRole !== 'ambient' || badge.alwaysVisible === true;
      if (cloverTarget) return labelRole === 'clover' || labelRole === 'critical';
      return false;
    }
    return true;
  }

  function decorateBadges(badges = [], context = {}) {
    const { viewportWidth = 1280, goalTarget = false, cloverTarget = false, cloverState = '' } = context;
    const mobile = viewportClass(viewportWidth) === 'mobile';
    const decorated = badges
      .map((badge) => {
        const defaults = badgeOverlayDefaults(badge);
        const labelRole = badgeLabelRole(badge, context);
        return {
          ...defaults,
          ...badge,
          displayLabel: badge.displayLabel || badge.label,
          labelRole,
          mobileHidden: badge.mobileHidden === true || (mobile && badge.overlayRole === 'available' && !goalTarget)
        };
      })
      .filter((badge) => badgeShouldRender(badge, context))
      .map((badge) => ({
        ...badge,
        iconOnly: badge.iconOnly === true || (mobile && badge.overlayRole === 'available' && !goalTarget)
      }));
    const capped = capBadges(decorated, context);
    const prioritized = capped.slice().sort((left, right) => mobileSignalPriority(right.labelRole) - mobileSignalPriority(left.labelRole));
    if (mobile && String(cloverState || '').toUpperCase() === 'ACTING' && cloverTarget) {
      return prioritized.filter((badge) => badge.labelRole === 'critical').slice(0, 1);
    }
    if (mobile && !(context.selected || goalTarget)) {
      return prioritized.filter((badge) => badge.labelRole === 'critical');
    }
    return prioritized;
  }

  function objectOverlayMeta(object, { selected = false, goalTarget = false, attention = 'none' } = {}) {
    if (goalTarget) return { overlayRole: 'objective', overlayWeight: 'strong' };
    if (selected) return { overlayRole: 'primary-action', overlayWeight: 'medium' };
    if (attention === 'available') return { overlayRole: 'available', overlayWeight: 'quiet' };
    if (attention === 'blocked') return { overlayRole: 'status', overlayWeight: 'medium' };
    return { overlayRole: 'ambient', overlayWeight: 'quiet' };
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
        tone: 'good',
        overlayRole: 'status',
        overlayWeight: 'medium'
      });
    }
    if (state === 'PRODUCING') {
      badges.push({
        type: 'timer',
        label: 'Producing',
        tone: 'neutral',
        overlayRole: 'status',
        overlayWeight: 'quiet',
        showWhenSelected: true
      });
    }
    if (state === 'UNDER_CONSTRUCTION') {
      badges.push({
        type: 'construction',
        label: 'Under construction',
        tone: 'warn',
        overlayRole: 'status',
        overlayWeight: 'medium'
      });
    }
    if (state === 'UPGRADE_READY') {
      badges.push({
        type: 'upgrade',
        label: 'Upgrade ready',
        tone: 'neutral',
        overlayRole: 'status',
        overlayWeight: 'medium'
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
        tone: 'warn',
        overlayRole: 'status',
        overlayWeight: 'medium'
      });
    }
    return badges;
  }

  function assetIdForBuilding(building, state) {
    const type = upper(building?.type);
    if (type === 'HQ') return `founders_plot_hq_lv${clamp(number(building?.level || 1), 1, 5)}_v1_4_2`;
    if (type === 'LUMBER_CAMP') return 'founders_plot_lumber_camp_v1_4_2';
    if (type === 'FARM_PLOT') return 'founders_plot_farm_plot_v1_4_2';
    if (type === 'QUARRY') return 'founders_plot_quarry_v1_4_2';
    if (type === 'WORKSHOP') return 'founders_plot_workshop_v1_4_2';
    if (type === 'MARKET_STALL') return 'founders_plot_market_stall_v1_4_2';
    if (state === 'LOCKED') return 'founders_plot_locked_lot_v1_4_2';
    return 'founders_plot_empty_lot_v1_4_2';
  }

  function objectPrimaryAction(objectId, view, building) {
    if (objectId === 'CONTRACT_BOARD') {
      if (view?.contracts?.activeContract?.status === 'READY_TO_TURN_IN') {
        return { label: 'Turn in contract', action: 'drawer:contracts' };
      }
      return { label: 'Read contracts', action: 'drawer:contracts' };
    }
    if (objectId === 'PUBLIC_SQUARE') {
      if (view?.townOpportunity?.active) return { label: 'Choose town play', action: 'drawer:signals' };
      if (view?.operatingModel?.gate?.ready === true && !view?.operatingModel?.selectedCharterId) {
        return { label: 'Choose town charter', action: 'drawer:operating' };
      }
      if (number(view?.landmarks?.publicSquare?.level) > 0 && !view?.landmarks?.publicSquare?.styleId) {
        return { label: 'Choose square style', action: 'drawer:signals' };
      }
      if (number(view?.landmarks?.publicSquare?.level) > 0) {
        return { label: 'Capture postcard', action: 'drawer:signals' };
      }
      return { label: 'Inspect square', action: 'drawer:signals' };
    }
    if (objectId === 'SCENARIO_SITE') {
      const activeScenario = view?.scenarios?.active || null;
      const offers = Array.isArray(view?.scenarios?.offers) ? view.scenarios.offers : [];
      if (activeScenario) return { label: 'Work scenario', action: 'drawer:signals' };
      if (offers.length > 0) return { label: 'Start scenario', action: 'drawer:signals' };
      return { label: 'Inspect civic site', action: 'drawer:signals' };
    }
    if (objectId === 'FOREMAN_HUT') return { label: 'Talk to Clover', action: 'drawer:foreman' };
    if (objectId === 'GOVERNOR_LEDGER') return { label: 'Open Governor Ledger', action: 'drawer:settlements' };
    if (objectId.startsWith('SETTLEMENT_NODE_')) return { label: 'Jump to town', action: 'drawer:settlements' };
    if (objectId === 'CREATOR_NOTICE_KIOSK') return { label: 'Open Creator Buildings', action: 'drawer:creator' };
    if (objectId === 'JOURNAL') return { label: 'Read journal', action: 'drawer:journal' };
    if (objectId === 'APPROVAL_INBOX') return { label: 'Review approvals', action: 'drawer:approvals' };
    if (objectId.startsWith('PAD:')) return { label: 'Build here', action: `select:${objectId}` };
    if (building) {
      const state = upper(building?.state);
      if (state === 'OUTPUT_READY') return { label: 'Collect outputs', action: `select:${objectId}` };
      if (state === 'READY' && building?.type !== 'HQ') return { label: 'Queue job', action: `select:${objectId}` };
      return { label: 'Inspect', action: `select:${objectId}` };
    }
    return { label: 'Inspect', action: `select:${objectId}` };
  }

  function actionVerbForReceipt(receipt = {}) {
    const action = upper(receipt?.action || '');
    if (action === 'COLLECT_READY_OUTPUTS') return 'collecting from';
    if (action === 'QUEUE_BEST_JOB' || action === 'QUEUE_JOB') return 'queueing work at';
    if (action === 'SET_PRIORITY') return 'setting priority for';
    return 'helping with';
  }

  function latestCompletedContract(view) {
    const completed = Array.isArray(view?.contracts?.completed) ? view.contracts.completed : [];
    return completed
      .filter((contract) => contract && String(contract.contractId || '').trim())
      .sort((left, right) => number(right?.completedAtMs) - number(left?.completedAtMs))[0] || null;
  }

  function cloverState(view, options) {
    const runtime = view?.foreman?.runtime || {};
    const local = options?.localForemanRuntimeStatus || {};
    const pendingApprovals = Array.isArray(view?.foreman?.pendingApprovals) ? view.foreman.pendingApprovals : [];
    const specialistConflicts = Array.isArray(view?.foreman?.specialists?.conflicts) ? view.foreman.specialists.conflicts : [];
    const receipt = view?.foreman?.receipt || null;
    const runtimeStatus = upper(runtime.status, 'NOT_STARTED');
    const latestContract = latestCompletedContract(view);
    const celebrationFresh = latestContract && number(latestContract.completedAtMs) > 0
      ? (Date.now() - number(latestContract.completedAtMs)) < 5 * 60 * 1000
      : false;
    const companionAdvice = view?.foreman?.companionAdvice || {};
    const companionLine = cleanShortCopy(companionAdvice?.sceneLine || view?.foreman?.recommendation, 'Clover is reading the town.');
    const companionTargetObjectId = String(companionAdvice?.targetObjectId || '');
    const targetObjectId = options?.lastActionTargetObjectId || companionTargetObjectId || goalTargetObjectId(view, options?.selectedKey || '');

    if (pendingApprovals.length > 0) {
      return {
        state: 'WAITING_FOR_PERMISSION',
        bubbleText: cleanShortCopy(pendingApprovals[0]?.title, 'I need your say-so before the next move.'),
        targetObjectId: 'APPROVAL_INBOX',
        actionVerb: 'waiting on'
      };
    }
    if (runtimeStatus === 'ERROR') {
      return {
        state: 'ERROR',
        bubbleText: 'Clover hit a snag. Open the Foreman drawer.',
        targetObjectId: 'FOREMAN_HUT',
        actionVerb: 'recovering near'
      };
    }
    if (local?.expired || local?.needsRestart || runtimeStatus === 'STALE') {
      return {
        state: 'RESTART_NEEDED',
        bubbleText: 'Clover needs a fresh start in this tab.',
        targetObjectId: 'FOREMAN_HUT',
        actionVerb: 'resetting near'
      };
    }
    if (runtimeStatus === 'PAUSED') {
      return {
        state: 'PAUSED',
        bubbleText: 'Foreman paused. Wake Clover when you want help again.',
        targetObjectId: 'FOREMAN_HUT',
        actionVerb: 'resting at'
      };
    }
    if (runtimeStatus === 'ACTING' || options?.workerSchedulerStatus?.tickRunning === true || options?.manualForemanActing === true) {
      return {
        state: 'ACTING',
        bubbleText: cleanShortCopy(receipt?.summary || receipt?.reason || view?.foreman?.recommendation, 'Clover is handling one safe task.'),
        targetObjectId,
        actionVerb: actionVerbForReceipt(receipt)
      };
    }
    if (celebrationFresh && runtimeStatus !== 'NOT_STARTED') {
      return {
        state: 'CELEBRATING',
        bubbleText: cleanShortCopy(
          latestContract?.townBenefit || `${latestContract?.title || 'That town request'} landed well.`,
          'The town cheered for that finished request.'
        ),
        targetObjectId: 'CONTRACT_BOARD',
        actionVerb: 'celebrating at'
      };
    }
    if (runtimeStatus === 'THINKING') {
      return {
        state: 'THINKING',
        bubbleText: companionLine || 'Checking the safest next step.',
        targetObjectId,
        actionVerb: 'thinking about'
      };
    }
    if (runtimeStatus === 'BOOTING' || runtimeStatus === 'OBSERVING') {
      return {
        state: 'OBSERVING',
        bubbleText: companionLine || 'Watching the plot.',
        targetObjectId,
        actionVerb: 'watching'
      };
    }
    return {
      state: 'NOT_STARTED',
      bubbleText: companionLine || 'Clover is ready when you are.',
      targetObjectId,
      actionVerb: companionTargetObjectId ? 'suggesting' : 'ready for'
    };
  }

  function drawerBadges(view) {
    const activeContract = view?.contracts?.activeContract || null;
    const contractOffers = Array.isArray(view?.contracts?.offers) ? view.contracts.offers : [];
    const pendingApprovals = Array.isArray(view?.foreman?.pendingApprovals) ? view.foreman.pendingApprovals : [];
    const specialistConflicts = Array.isArray(view?.foreman?.specialists?.conflicts) ? view.foreman.specialists.conflicts : [];
    const rewards = Array.isArray(view?.rewards) ? view.rewards : [];
    const unseenRecap = number(view?.recap?.unseenCount || 0);
    const scenarioCount = view?.scenarios?.active ? 1 : Array.isArray(view?.scenarios?.offers) ? view.scenarios.offers.length : 0;
    const regionalIssues = number(view?.regionalNetwork?.pendingIssueCount || 0);
    const creatorInstalled = Array.isArray(view?.creatorExtensions?.installed) ? view.creatorExtensions.installed : [];
    const creatorCatalog = Array.isArray(view?.creatorExtensions?.catalog) ? view.creatorExtensions.catalog : [];
    const creatorReady = creatorCatalog.some((entry) => Array.isArray(entry?.allowedActions) && entry.allowedActions.includes('install'));
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
      settlements: view?.settlements?.expedition?.status === 'READY'
        ? 1
        : regionalIssues > 0
          ? regionalIssues
          : number(view?.settlements?.pendingDecisionCount || 0),
      operating: view?.operatingModel?.gate?.ready === true && !view?.operatingModel?.selectedCharterId ? 1 : 0,
      creator: creatorInstalled.length > 0
        ? creatorInstalled.filter((entry) => entry?.active === true || String(entry?.status || '').toUpperCase() === 'ACTIVE').length || creatorInstalled.length
        : creatorReady ? 1 : 0,
      signals: view?.townOpportunity?.active ? 1 : scenarioCount,
      foreman: pendingApprovals.length > 0
        ? 1
        : specialistConflicts.length > 0
          ? specialistConflicts.length
          : view?.foreman?.specialists?.gate?.ready === true && (!view?.foreman?.specialists?.activeAssignments || view.foreman.specialists.activeAssignments.length === 0)
            ? 1
            : 0
    };
  }

  function currentGoal(view) {
    const goal = view?.currentGoal || view?.quest || {};
    const action = goal?.primaryAction && typeof goal.primaryAction === 'object' ? goal.primaryAction : {};
    return {
      title: String(goal.title || 'Grow the first district'),
      body: cleanShortCopy(goal.body, 'Keep the town moving one clear step at a time.'),
      owner: String(goal.owner || 'tutorial'),
      primaryAction: action,
      primaryCtaLabel: String(goal.primaryCtaLabel || '').trim()
    };
  }

  function resourceRows(view) {
    const inventory = view?.plot?.inventory || {};
    const caps = view?.plot?.storageCaps || {};
    const next = view?.progress?.next || null;
    const withCap = (key, label, value, cap) => ({
      key,
      label,
      value: number(value),
      cap: cap == null ? null : number(cap),
      ratio: cap == null || number(cap) <= 0 ? null : clamp(number(value) / Math.max(1, number(cap)), 0, 1),
      displayValue: cap == null || number(cap) <= 0 ? String(number(value)) : `${number(value)} / ${number(cap)}`
    });
    return [
      withCap('wood', 'Wood', inventory.wood, caps.wood),
      withCap('stone', 'Stone', inventory.stone, caps.stone),
      withCap('food', 'Food', inventory.food, caps.food),
      withCap('coin', 'Coin', inventory.coin, null),
      withCap('townXp', 'Town XP', view?.plot?.townXp, next?.xpRequired || null)
    ];
  }

  function formatCount(value) {
    return String(number(value));
  }

  function formatResourceKey(key) {
    switch (String(key || '')) {
      case 'wood':
        return 'wood';
      case 'stone':
        return 'stone';
      case 'food':
        return 'food';
      case 'coin':
        return 'coin';
      case 'townXp':
      case 'town_xp':
        return 'town XP';
      default:
        return String(key || '').replace(/_/g, ' ');
    }
  }

  function summarizeAmounts(amounts = {}, { includeZero = false } = {}) {
    return Object.entries(amounts || {})
      .filter(([, amount]) => includeZero || number(amount) > 0)
      .map(([key, amount]) => `${number(amount)} ${formatResourceKey(key)}`)
      .join(', ');
  }

  function summarizeSignals(signals = {}, bands = {}) {
    const keys = ['depotReadiness', 'marketConfidence', 'neighborGoodwill', 'publicCharm'];
    return keys
      .map((key) => {
        const value = number(signals?.[key], 50);
        const band = String(bands?.[key] || '').toLowerCase();
        return `${key.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`)} ${value}${band ? ` ${band}` : ''}`;
      })
      .join(' | ');
  }

  function summarizeRequirements(requirements = {}) {
    const resources = summarizeAmounts(requirements?.resources || {});
    const buildings = Array.isArray(requirements?.buildings)
      ? requirements.buildings
        .filter((entry) => entry && number(entry.minCount) > 0)
        .map((entry) => `${number(entry.minCount)} ${labelForBuilding(entry.buildingType)}`)
        .join(', ')
      : '';
    return [resources, buildings].filter(Boolean).join(', ') || 'No gated requirement';
  }

  function summarizeContractRewards(contract = {}) {
    const rewards = contract?.rewards || {};
    const resources = summarizeAmounts(rewards.resources || {});
    const xp = number(rewards.townXp) > 0 ? `${number(rewards.townXp)} town XP` : '';
    const signal = summarizeAmounts(rewards.signalDelta || {});
    return [resources, xp, signal].filter(Boolean).join(', ') || 'Town goodwill';
  }

  function summarizeGrant(grant = {}) {
    const normalized = {
      wood: grant.wood,
      stone: grant.stone,
      food: grant.food,
      coin: grant.coin,
      town_xp: grant.town_xp ?? grant.townXp
    };
    return summarizeAmounts(normalized) || 'Ready to claim';
  }

  function formatContractStatus(status = '') {
    return String(status || 'OFFERED').replace(/_/g, ' ').toLowerCase();
  }

  function contractSummaryRows(view) {
    const contracts = view?.contracts || {};
    const recommendation = contracts.recommendation || null;
    if (contracts.boardLocked) {
      return [
        { label: 'Board', value: 'Unlocks at Headquarters level 2' }
      ];
    }
    const active = contracts.activeContract || null;
    if (active) {
      return [
        { label: 'Active', value: cleanShortCopy(active.title, 'Town request') },
        { label: 'Status', value: formatContractStatus(active.status) },
        { label: 'Needs', value: summarizeRequirements(active.requirements || {}) },
        { label: 'Reward', value: summarizeContractRewards(active) }
      ];
    }
    const offers = Array.isArray(contracts.offers) ? contracts.offers : [];
    return [
      { label: 'Offers', value: `${offers.length} available` },
      recommendation?.contractId
        ? { label: 'Clover pick', value: cleanShortCopy(recommendation.requesterName || recommendation.reason, 'Town request') }
        : null,
      ...offers.slice(0, 2).map((offer) => ({
        label: cleanShortCopy(offer?.requesterSnapshot?.displayName || offer?.requester || 'Town request', 'Town request'),
        value: cleanShortCopy(offer?.title, 'Choose a request')
      }))
    ].filter(Boolean);
  }

  function requesterSummaryRows(view) {
    const requesters = Array.isArray(view?.requesters) ? view.requesters : [];
    const seen = requesters.filter((requester) => number(requester?.lastSeenAtMs) > 0 || number(requester?.completedContracts) > 0);
    const rows = (seen.length > 0 ? seen : requesters).slice(0, 3).map((requester) => ({
      label: cleanShortCopy(requester?.displayName, 'Requester'),
      value: cleanShortCopy(requester?.institution || requester?.roleTitle, 'Town institution')
    }));
    return rows.length > 0 ? rows : [{ label: 'Requesters', value: 'No town requests yet' }];
  }

  function policyRows(view) {
    const policy = view?.policy || {};
    const unlocked = new Set(Array.isArray(view?.unlocks?.permissions) ? view.unlocks.permissions : []);
    const permissionLabels = {
      observeAndSuggest: 'Suggest',
      collectOutputs: 'Collect',
      queueProduction: 'Queue',
      setPriority: 'Priority',
      sellSurplusFood: 'Sell food'
    };
    return Object.keys(permissionLabels).map((key) => ({
      key,
      label: permissionLabels[key],
      enabled: policy[key] === true,
      unlocked: unlocked.has(key),
      value: unlocked.has(key) ? (policy[key] === true ? 'on' : 'off') : 'locked'
    }));
  }

  function compactPolicySummary(view) {
    const rows = policyRows(view);
    const unlocked = rows.filter((row) => row.unlocked);
    const enabled = unlocked.filter((row) => row.enabled);
    const emergency = view?.policy?.emergencyPause === true ? ' paused' : '';
    return `${enabled.length}/${unlocked.length || rows.length} permissions on${emergency}`;
  }

  function schedulerSummary(view) {
    const task = view?.foreman?.scheduler?.collectReadyOutputs || {};
    if (task.enabled === true && task.paused === true) return `collect ready paused, ${number(task.runCount)} runs`;
    if (task.enabled === true) return `collect ready on, ${number(task.runCount)} runs`;
    return 'collect ready off';
  }

  function standingOrderLabel(order = '') {
    return upper(order) === 'BOLD_FOUNDER' ? 'Bold Founder' : 'Careful Steward';
  }

  function objectForId(objects = [], objectId = '') {
    return objects.find((object) => String(object?.id || '') === String(objectId || '')) || null;
  }

  function buildingForObject(view, object = {}) {
    const selectionKey = String(object?.selectionKey || '');
    const buildings = Array.isArray(view?.buildings) ? view.buildings : [];
    if (selectionKey.startsWith('building:')) {
      const buildingId = selectionKey.slice('building:'.length);
      return buildings.find((entry) => String(entry?.buildingId || '') === buildingId) || null;
    }
    if (String(object?.id || '') === 'HQ') return buildings.find((entry) => upper(entry?.type) === 'HQ') || null;
    return buildings.find((entry) => upper(entry?.type) === upper(object?.buildingType || object?.id || '')) || null;
  }

  function selectedObjectDetail(view, {
    objects = [],
    selectedObjectId = '',
    goalObjectId = ''
  } = {}) {
    const objectId = selectedObjectId || goalObjectId || '';
    const object = objectForId(objects, objectId);
    if (!object) {
      return {
        id: 'DETAIL:none',
        objectId: '',
        mode: 'none',
        title: 'No object selected',
        rows: []
      };
    }
    const mode = selectedObjectId ? 'selected' : 'objective';
    const building = buildingForObject(view, object);
    const rows = [];
    if (building) {
      rows.push({ label: 'Level', value: formatCount(building.level || object.hqLevel || 1) });
      rows.push({ label: 'State', value: stateLabel(building.state || object.state) });
      rows.push({ label: 'Priority', value: String(building.priority || 'BALANCED').toLowerCase() });
      const outputs = summarizeAmounts(building.outputBuffer || {});
      if (outputs) rows.push({ label: 'Ready output', value: outputs });
      if (building.runningJob) rows.push({ label: 'Job', value: String(building.runningJob.kind || 'running').toLowerCase() });
      if (object.id === 'HQ' && view?.progress?.next) {
        rows.push({ label: 'Next HQ', value: `${number(view.progress.next.xpCurrent)} / ${number(view.progress.next.xpRequired)} XP` });
      }
    } else if (String(object.id || '').startsWith('PAD:')) {
      rows.push({ label: 'State', value: stateLabel(object.state) });
      rows.push({ label: 'Grid', value: `${object.gridCellId || 'open cell'}` });
      rows.push({ label: 'Builds', value: (view?.unlocks?.buildingTypes || []).map(labelForBuilding).join(', ') || 'locked' });
    } else if (object.id === 'CONTRACT_BOARD') {
      rows.push(...contractSummaryRows(view).slice(0, 4));
	    } else if (object.id === 'PUBLIC_SQUARE') {
	      const opportunity = view?.townOpportunity?.active || null;
	      const square = view?.landmarks?.publicSquare || {};
	      if (opportunity) {
	        rows.push({ label: 'Choice', value: cleanShortCopy(opportunity.title, 'Town opportunity') });
	        rows.push({ label: 'Options', value: (opportunity.options || []).map((option) => option.label).join(' or ') });
	      }
	      rows.push({ label: 'Welcome Sign', value: number(square.level) > 0 ? 'raised' : 'not raised' });
	      if (square.styleLabel || square.styleId) {
	        rows.push({ label: 'Style', value: cleanShortCopy(square.styleLabel || square.styleId, 'Town style') });
	      } else if (number(square.level) > 0) {
	        rows.push({ label: 'Style', value: 'not chosen' });
	      }
	      rows.push({ label: 'Signals', value: summarizeSignals(view?.townSignals || {}, view?.townSignals?.bands || {}) });
    } else if (object.id === 'SCENARIO_SITE') {
      const scenario = view?.scenarios?.active || null;
      const offers = Array.isArray(view?.scenarios?.offers) ? view.scenarios.offers : [];
      if (scenario) {
        rows.push({ label: 'Project', value: cleanShortCopy(scenario.title, 'Civic project') });
        rows.push({ label: 'Progress', value: `${number(scenario.completedTasks)} / ${number(scenario.minCompletedTasks)} tasks` });
        const nextTask = (Array.isArray(scenario.tasks) ? scenario.tasks : []).find((task) => task.completed !== true);
        if (nextTask) rows.push({ label: 'Next', value: cleanShortCopy(nextTask.label, 'Prep task') });
      } else if (offers[0]) {
        rows.push({ label: 'Available', value: cleanShortCopy(offers[0].title, 'Civic project') });
        rows.push({ label: 'Tradeoff', value: 'Uses reserves while requests stay active' });
      } else {
        rows.push({ label: 'Civic project', value: 'No scenario waiting' });
      }
    } else if (object.id === 'APPROVAL_INBOX') {
      const approvals = Array.isArray(view?.foreman?.pendingApprovals) ? view.foreman.pendingApprovals : [];
      const exceptions = Array.isArray(view?.foreman?.governance?.openExceptions) ? view.foreman.governance.openExceptions : [];
      const waiting = approvals.length + exceptions.length;
      rows.push({ label: 'Waiting', value: `${waiting} decision${waiting === 1 ? '' : 's'}` });
      if (approvals[0]) rows.push({ label: 'Next', value: cleanShortCopy(approvals[0].title, 'Approval request') });
      if (!approvals[0] && exceptions[0]) rows.push({ label: 'Next', value: cleanShortCopy(exceptions[0].title, 'Foreman exception') });
    } else if (object.id === 'FOREMAN_HUT') {
      rows.push({ label: 'Clover', value: String(view?.foreman?.runtime?.status || 'NOT_STARTED').replace(/_/g, ' ').toLowerCase() });
      if (view?.foreman?.companionAdvice?.bottleneck) {
        rows.push({ label: 'Read', value: cleanShortCopy(view.foreman.companionAdvice.bottleneck, 'steady growth') });
      }
      rows.push({ label: 'Order', value: standingOrderLabel(view?.foreman?.standingOrder) });
      rows.push({ label: 'Scheduler', value: schedulerSummary(view) });
      rows.push({ label: 'Policy', value: compactPolicySummary(view) });
    } else if (object.id === 'JOURNAL') {
      rows.push({ label: 'Journal', value: `${number(view?.journal?.entries?.length)} entries` });
      rows.push({ label: 'Morning brief', value: `${number(view?.recap?.unseenCount)} unseen` });
    }
    return {
      id: `DETAIL:${object.id}`,
      objectId: object.id,
      mode,
      title: mode === 'selected' ? `Selected: ${object.label}` : `Objective: ${object.label}`,
      rows: rows.slice(0, 5)
    };
  }

  function createStateCoverage(view, {
    objects = [],
    goal = {},
    goalObjectId = '',
    selectedObjectId = ''
  } = {}) {
    const resources = resourceRows(view);
    const progress = view?.progress?.next || null;
    const activeContract = view?.contracts?.activeContract || null;
    const offers = Array.isArray(view?.contracts?.offers) ? view.contracts.offers : [];
    const rewards = Array.isArray(view?.rewards) ? view.rewards : [];
    const approvals = Array.isArray(view?.foreman?.pendingApprovals) ? view.foreman.pendingApprovals : [];
    const exceptions = Array.isArray(view?.foreman?.governance?.openExceptions) ? view.foreman.governance.openExceptions : [];
    const pendingDecisionCount = approvals.length + exceptions.length;
    const journalEntries = Array.isArray(view?.journal?.entries) ? view.journal.entries : [];
    const allowedTools = Array.isArray(view?.foreman?.allowedTools) ? view.foreman.allowedTools : [];
    const unlockedBuildings = Array.isArray(view?.unlocks?.buildingTypes) ? view.unlocks.buildingTypes : [];
    const hqProgressText = progress
      ? `HQ ${number(view?.plot?.hqLevel || 1)} -> ${number(progress.level || 0)}: ${number(progress.xpCurrent)} / ${number(progress.xpRequired)} XP`
      : `HQ ${number(view?.plot?.hqLevel || 1)} is capped`;
    const resourceSummary = resources.map((row) => `${row.label}: ${row.displayValue}`).join(' | ');
    const contractRows = contractSummaryRows(view);
    const requesterRows = requesterSummaryRows(view);
    const signalsSummary = summarizeSignals(view?.townSignals || {}, view?.townSignals?.bands || {});
    const townOpportunity = view?.townOpportunity?.active || null;
    const townOpportunityValue = townOpportunity
      ? `${cleanShortCopy(townOpportunity.title, 'Town opportunity')}: ${(townOpportunity.options || []).map((option) => option.label).join(' or ')}`
      : signalsSummary;
    const activeScenario = view?.scenarios?.active || null;
    const scenarioOffers = Array.isArray(view?.scenarios?.offers) ? view.scenarios.offers : [];
    const scenarioRows = activeScenario
      ? [
          { label: 'Project', value: cleanShortCopy(activeScenario.title, 'Civic project') },
          { label: 'Progress', value: `${number(activeScenario.completedTasks)} / ${number(activeScenario.minCompletedTasks)} tasks` }
        ]
      : scenarioOffers.slice(0, 2).map((offer) => ({
          label: cleanShortCopy(offer.title, 'Civic project'),
          value: cleanShortCopy(offer.body, 'Short town project')
        }));
    const policySummary = compactPolicySummary(view);
    const schedulerText = schedulerSummary(view);
    const receipt = view?.foreman?.receipt || null;
    const companionAdvice = view?.foreman?.companionAdvice || {};
    const creatorExtensions = view?.creatorExtensions || {};
    const creatorInstalled = Array.isArray(creatorExtensions.installed) ? creatorExtensions.installed : [];
    const creatorCatalog = Array.isArray(creatorExtensions.catalog) ? creatorExtensions.catalog : [];
    const activeCreator = creatorInstalled.find((entry) => entry?.active === true || upper(entry?.status) === 'ACTIVE') || null;
    const disabledCreator = creatorInstalled.find((entry) => upper(entry?.status) === 'DISABLED') || null;
    const creatorReady = creatorCatalog.some((entry) => entry?.gate?.ready === true || (Array.isArray(entry?.allowedActions) && entry.allowedActions.includes('install')));
    const creatorRows = creatorInstalled.length > 0
      ? creatorInstalled.map((entry) => ({
        label: cleanShortCopy(entry.label, 'Creator building'),
        value: `${entry.status || 'ACTIVE'} · ${number(entry?.state?.noticeCount || 0)} notice${number(entry?.state?.noticeCount || 0) === 1 ? '' : 's'}`
      }))
      : creatorCatalog.slice(0, 2).map((entry) => ({
        label: cleanShortCopy(entry.label, 'Creator building'),
        value: entry?.gate?.ready === true ? 'Ready to install' : cleanShortCopy(entry?.gate?.summary, 'Locked')
      }));
    const blocked = [];
    const propObjects = objects.filter((object) => object?.kind === 'prop');
    if (view?.policy?.emergencyPause === true) blocked.push('Emergency pause');
    if (view?.contracts?.boardLocked === true) blocked.push('Contract board locked');
    if (goal?.primaryAction && !goalObjectId) blocked.push('Goal has no scene target');

    const hud = [
      {
        id: 'HUD:resources',
        domainId: 'plot-resources',
        tier: 'canvas-hud',
        label: 'Stores',
        value: resourceSummary,
        items: resources
      },
      {
        id: 'HUD:hq-progress',
        domainId: 'hq-progress',
        tier: 'canvas-hud',
        label: 'Headquarters',
        value: hqProgressText,
        ratio: progress ? clamp(number(progress.ratio), 0, 1) : 1,
        current: progress ? number(progress.xpCurrent) : number(view?.plot?.townXp),
        required: progress ? number(progress.xpRequired) : number(view?.plot?.townXp)
      },
      {
        id: 'HUD:objective',
        domainId: 'current-goal',
        tier: 'canvas-hud',
        label: cleanShortCopy(goal.title, 'Current objective'),
        value: cleanShortCopy(goal.body, 'Keep the plot moving.'),
        owner: String(goal.owner || 'tutorial'),
        targetObjectId: goalObjectId
      }
    ];

    const anchors = [
      {
        id: 'STATE:contracts',
        domainId: 'contracts',
        tier: 'in-world-marker',
        objectId: 'CONTRACT_BOARD',
        drawerKey: 'contracts',
        label: 'Requests',
        status: view?.contracts?.boardLocked ? 'LOCKED' : activeContract ? String(activeContract.status || 'ACTIVE') : 'OFFERS',
        count: activeContract ? 1 : offers.length,
        value: contractRows.map((row) => `${row.label}: ${row.value}`).join(' | '),
        detailRows: contractRows
      },
      {
        id: 'STATE:requesters',
        domainId: 'requesters',
        tier: 'in-world-marker',
        objectId: 'CONTRACT_BOARD',
        drawerKey: 'contracts',
        label: 'Requesters',
        status: requesterRows.length > 0 ? 'VISIBLE' : 'QUIET',
        count: requesterRows.length,
        value: requesterRows.map((row) => `${row.label}: ${row.value}`).join(' | '),
        detailRows: requesterRows
      },
      {
        id: 'STATE:rewards',
        domainId: 'rewards',
        tier: 'in-world-marker',
        objectId: 'PUBLIC_SQUARE',
        drawerKey: 'rewards',
        label: 'Rewards',
        status: rewards.length > 0 ? 'READY' : 'IDLE',
        count: rewards.length,
        value: rewards[0] ? `${cleanShortCopy(rewards[0].title, 'Reward ready')}: ${summarizeGrant(rewards[0].grant || {})}` : 'No claim waiting'
      },
      {
        id: 'STATE:signals',
        domainId: 'town-signals-landmarks',
        tier: 'in-world-marker',
        objectId: 'PUBLIC_SQUARE',
        drawerKey: 'signals',
        label: 'Town mood',
        status: townOpportunity ? 'READY' : number(view?.landmarks?.publicSquare?.level) > 0 ? 'RAISED' : 'OPEN',
        count: townOpportunity ? 1 : number(view?.landmarks?.publicSquare?.level),
        value: townOpportunityValue,
        detailRows: townOpportunity
          ? [
              { label: 'Choice', value: cleanShortCopy(townOpportunity.title, 'Town opportunity') },
              { label: 'Options', value: (townOpportunity.options || []).map((option) => option.label).join(' or ') }
            ]
          : [{ label: 'Signals', value: signalsSummary }]
      },
      {
        id: 'STATE:town_identity',
        domainId: 'town-identity',
        tier: 'in-world-marker',
        objectId: 'PUBLIC_SQUARE',
        drawerKey: 'signals',
        label: 'Town style',
        status: view?.landmarks?.publicSquare?.styleId ? 'SET' : number(view?.landmarks?.publicSquare?.level) > 0 ? 'AVAILABLE' : 'LOCKED',
        count: view?.landmarks?.publicSquare?.styleId ? 1 : 0,
        value: view?.landmarks?.publicSquare?.styleLabel || (number(view?.landmarks?.publicSquare?.level) > 0 ? 'Choose a Public Square style' : 'Raise the Welcome Sign first'),
        detailRows: [
          { label: 'Style', value: view?.landmarks?.publicSquare?.styleLabel || 'Not chosen' },
          { label: 'Effect', value: 'Cosmetic only' }
        ]
      },
      {
        id: 'STATE:town_postcard',
        domainId: 'town-postcards',
        tier: 'in-world-marker',
        objectId: 'PUBLIC_SQUARE',
        drawerKey: 'signals',
        label: 'Postcard',
        status: view?.townPostcards?.latest ? 'CAPTURED' : view?.townPostcards?.available ? 'READY' : 'LOCKED',
        count: number(view?.townPostcards?.captureCount || 0),
        value: view?.townPostcards?.summary || 'Raise the Welcome Sign before capturing a postcard',
        detailRows: [
          { label: 'Latest', value: view?.townPostcards?.latest?.cameraLabel || 'No postcard yet' },
          { label: 'Camera', value: view?.townPostcards?.latest?.cameraMode || 'postcard_flyover' }
        ]
      },
      {
        id: 'STATE:scenarios',
        domainId: 'civic-scenarios',
        tier: 'in-world-marker',
        objectId: 'SCENARIO_SITE',
        drawerKey: 'signals',
        label: 'Civic project',
        status: activeScenario ? String(activeScenario.status || 'ACTIVE') : scenarioOffers.length > 0 ? 'OFFERED' : 'QUIET',
        count: activeScenario ? number(activeScenario.completedTasks) : scenarioOffers.length,
        value: activeScenario
          ? `${cleanShortCopy(activeScenario.title, 'Civic project')}: ${number(activeScenario.completedTasks)} / ${number(activeScenario.minCompletedTasks)} tasks`
          : scenarioRows.map((row) => `${row.label}: ${row.value}`).join(' | ') || 'No civic scenario waiting',
        detailRows: scenarioRows
      },
      {
        id: 'STATE:settlements',
        domainId: 'settlements',
        tier: 'in-world-marker',
        objectId: 'GOVERNOR_LEDGER',
        drawerKey: 'settlements',
        label: 'Governor Ledger',
        status: view?.settlements?.expedition?.status || 'LOCKED',
        count: Array.isArray(view?.settlements?.settlements) ? view.settlements.settlements.length : 1,
        value: view?.settlements?.summary || 'Stabilize the first town before launching settlers',
        detailRows: (Array.isArray(view?.settlements?.settlements) ? view.settlements.settlements : []).map((settlement) => ({
          label: settlement.name || settlement.settlementId,
          value: `${settlement.status || 'ACTIVE'} · ${number(settlement.pendingDecisionCount)} pending`
        }))
      },
      {
        id: 'STATE:regional-network',
        domainId: 'regional-network',
        tier: 'in-world-marker',
        objectId: 'GOVERNOR_LEDGER',
        drawerKey: 'settlements',
        label: 'Regional routes',
        status: (view?.regionalNetwork?.issues || []).length > 0
          ? 'ISSUE'
          : (view?.regionalNetwork?.routes || []).some((route) => ['ACTIVE', 'SHORTAGE'].includes(String(route.status || '').toUpperCase()))
            ? 'ACTIVE'
            : view?.regionalNetwork?.gate?.ready === true
              ? 'READY'
              : 'LOCKED',
        count: Array.isArray(view?.regionalNetwork?.routes) ? view.regionalNetwork.routes.length : 0,
        value: view?.regionalNetwork?.summary || 'Regional routes are not ready yet',
        detailRows: (Array.isArray(view?.regionalNetwork?.routes) ? view.regionalNetwork.routes : []).map((route) => ({
          label: route.label || route.routeId || 'Route',
          value: `${route.status || 'LOCKED'} · ${route.fromSettlementName || route.fromSettlementId || ''} -> ${route.toSettlementName || route.toSettlementId || ''}`
        }))
      },
      {
        id: 'STATE:operating-model',
        domainId: 'operating-model',
        tier: 'in-world-marker',
        objectId: 'PUBLIC_SQUARE',
        drawerKey: 'operating',
        label: 'Charter',
        status: view?.operatingModel?.selectedCharterId ? 'CHOSEN' : view?.operatingModel?.gate?.ready ? 'READY' : 'LOCKED',
        count: Array.isArray(view?.operatingModel?.unlockedCapabilities) ? view.operatingModel.unlockedCapabilities.length : 0,
        value: view?.operatingModel?.charter?.label || view?.operatingModel?.summary || 'Choose an operating charter',
        detailRows: [
          { label: 'Charter', value: view?.operatingModel?.charter?.label || 'Not chosen' },
          { label: 'Banner', value: view?.operatingModel?.bannerText || 'No charter banner yet' },
          { label: 'Actions', value: Array.isArray(view?.operatingModel?.allowedActions) ? view.operatingModel.allowedActions.join(', ') : 'none' }
        ]
      },
      {
        id: 'STATE:creator-extensions',
        domainId: 'creator-extensions',
        tier: 'in-world-marker',
        objectId: creatorInstalled.length > 0 ? 'CREATOR_NOTICE_KIOSK' : 'PUBLIC_SQUARE',
        drawerKey: 'creator',
        label: 'Creator buildings',
        status: activeCreator
          ? 'ACTIVE'
          : disabledCreator
            ? 'DISABLED'
            : creatorReady ? 'READY' : 'LOCKED',
        count: creatorInstalled.length,
        value: creatorExtensions.summary || 'No creator buildings attached yet',
        detailRows: creatorRows
      },
      {
        id: 'STATE:journal',
        domainId: 'journal-recap',
        tier: 'in-world-marker',
        objectId: 'JOURNAL',
        drawerKey: 'journal',
        label: 'Journal',
        status: number(view?.recap?.unseenCount) > 0 ? 'UNSEEN' : 'CURRENT',
        count: journalEntries.length,
        value: `${journalEntries.length} entries, ${number(view?.recap?.unseenCount)} unseen brief lines`
      },
      {
        id: 'STATE:world-props',
        domainId: 'world-props',
        tier: 'world-object',
        objectId: propObjects[0]?.id || '',
        label: 'World props',
        status: propObjects.length > 0 ? 'REGISTERED' : 'EMPTY',
        count: propObjects.length,
        value: propObjects.map((object) => object.label).join(', ') || 'No ambient props registered',
        detailRows: propObjects.map((object) => ({ label: object.label, value: object.assetId || 'missing asset' }))
      },
      {
        id: 'STATE:approvals',
        domainId: 'approvals',
        tier: 'in-world-marker',
        objectId: 'APPROVAL_INBOX',
        drawerKey: 'approvals',
        label: 'Approvals',
        status: pendingDecisionCount > 0 ? 'WAITING' : 'CLEAR',
        count: pendingDecisionCount,
        value: approvals[0]
          ? cleanShortCopy(approvals[0].title, 'Approval waiting')
          : exceptions[0]
            ? cleanShortCopy(exceptions[0].title, 'Foreman exception')
            : 'No approval waiting'
      },
      {
        id: 'STATE:governance',
        domainId: 'foreman-governance',
        tier: 'selected-object-detail',
        objectId: 'FOREMAN_HUT',
        drawerKey: 'foreman',
        label: 'Governance',
        status: view?.foreman?.governance?.activeLease ? 'LEASE_ACTIVE' : 'LEASE_REQUIRED',
        count: pendingDecisionCount,
        value: view?.foreman?.governance?.summary || 'No active Foreman lease'
      },
      {
        id: 'STATE:persistent_foreman',
        domainId: 'foreman-persistent',
        tier: 'selected-object-detail',
        objectId: 'FOREMAN_HUT',
        drawerKey: 'foreman',
        label: 'While-away',
        status: view?.foreman?.governance?.persistent?.active ? 'ACTIVE' : 'OFF',
        count: view?.foreman?.governance?.persistent?.actionCount || 0,
        value: view?.foreman?.governance?.persistent?.summary || 'While-away Clover help is off'
      },
      {
        id: 'STATE:doctrine',
        domainId: 'foreman-doctrine',
        tier: 'selected-object-detail',
        objectId: 'FOREMAN_HUT',
        drawerKey: 'foreman',
        label: 'Clover rules',
        status: (view?.foreman?.doctrine?.activeRules || []).length > 0 ? 'PREFERENCES_SET' : 'EMPTY',
        count: (view?.foreman?.doctrine?.activeRules || []).length,
        value: view?.foreman?.doctrine?.summary || 'No Clover preferences set yet'
      },
      {
        id: 'STATE:specialists',
        domainId: 'foreman-specialists',
        tier: 'selected-object-detail',
        objectId: 'FOREMAN_HUT',
        drawerKey: 'foreman',
        label: 'Specialists',
        status: (view?.foreman?.specialists?.activeAssignments || []).length > 0
          ? 'STAFFED'
          : view?.foreman?.specialists?.gate?.ready === true
            ? 'READY'
            : 'LOCKED',
        count: (view?.foreman?.specialists?.activeAssignments || []).length,
        value: view?.foreman?.specialists?.summary || 'Specialist lanes are not staffed yet',
        detailRows: (view?.foreman?.specialists?.roles || []).map((role) => ({
          label: role.label || role.roleId || 'Specialist',
          value: role.active ? `${role.domain?.label || role.domainId} active` : String(role.status || 'UNASSIGNED')
        }))
      },
      {
        id: 'STATE:foreman',
        domainId: 'foreman-runtime',
        tier: 'in-world-marker',
        objectId: 'FOREMAN_HUT',
        drawerKey: 'foreman',
        label: 'Clover',
        status: String(view?.foreman?.runtime?.status || 'NOT_STARTED'),
        count: receipt?.receiptId ? 1 : 0,
        value: receipt
          ? cleanShortCopy(receipt.reason || receipt.result, 'Recent Clover receipt')
          : cleanShortCopy(companionAdvice?.recommendation || view?.foreman?.recommendation, 'Clover is ready'),
        detailRows: [
          { label: 'Advice', value: cleanShortCopy(companionAdvice?.sceneLine || view?.foreman?.recommendation, 'Clover is reading the town') },
          { label: 'Bottleneck', value: cleanShortCopy(companionAdvice?.bottleneck || 'none', 'none') }
        ]
      },
      {
        id: 'STATE:policy',
        domainId: 'policy-permissions',
        tier: 'selected-object-detail',
        objectId: 'FOREMAN_HUT',
        drawerKey: 'foreman',
        label: 'Policy',
        status: view?.policy?.emergencyPause === true ? 'PAUSED' : 'ACTIVE',
        count: policyRows(view).filter((row) => row.enabled).length,
        value: policySummary,
        detailRows: policyRows(view)
      },
      {
        id: 'STATE:scheduler',
        domainId: 'scheduler',
        tier: 'selected-object-detail',
        objectId: 'FOREMAN_HUT',
        drawerKey: 'foreman',
        label: 'Scheduler',
        status: view?.foreman?.scheduler?.collectReadyOutputs?.enabled ? 'ENABLED' : 'DISABLED',
        count: number(view?.foreman?.scheduler?.collectReadyOutputs?.runCount),
        value: schedulerText
      },
      {
        id: 'STATE:standing-order',
        domainId: 'standing-order',
        tier: 'selected-object-detail',
        objectId: 'FOREMAN_HUT',
        drawerKey: 'foreman',
        label: 'Order',
        status: upper(view?.foreman?.standingOrder || 'CAREFUL_STEWARD'),
        count: 1,
        value: standingOrderLabel(view?.foreman?.standingOrder)
      },
      {
        id: 'STATE:unlocks',
        domainId: 'unlocks-blocked',
        tier: 'selected-object-detail',
        objectId: 'HQ',
        selectionKey: 'hq',
        label: 'Unlocks',
        status: blocked.length > 0 ? 'BLOCKED' : 'AVAILABLE',
        count: unlockedBuildings.length,
        value: `${unlockedBuildings.map(labelForBuilding).join(', ') || 'No building unlocks'} | ${allowedTools.length} tools`
      }
    ];

    const domains = [
        { id: 'plot-resources', label: 'Plot resources and storage caps', tier: 'canvas-hud', source: 'plot.inventory + plot.storageCaps' },
        { id: 'hq-progress', label: 'Headquarters level progress', tier: 'canvas-hud', source: 'progress.next' },
        { id: 'pads-buildings-jobs', label: 'Pads, buildings, production jobs, outputs, timers', tier: 'world-object', source: 'pads + buildings + jobs' },
        { id: 'current-goal', label: 'Current goal and target action', tier: 'canvas-hud', source: 'currentGoal + quest' },
        { id: 'contracts', label: 'Contract board, offers, active turn-in state', tier: 'in-world-marker', source: 'contracts' },
        { id: 'requesters', label: 'Named requesters and institutions', tier: 'in-world-marker', source: 'requesters + contracts' },
        { id: 'civic-scenarios', label: 'Short civic scenario offers, progress, and outcomes', tier: 'in-world-marker', source: 'scenarios' },
        { id: 'settlements', label: 'Governor Ledger settlement shards and expedition gate', tier: 'in-world-marker', source: 'settlements' },
        { id: 'regional-network', label: 'Regional supply routes, contracts, shared reserves, and route issues', tier: 'in-world-marker', source: 'regionalNetwork' },
        { id: 'operating-model', label: 'Operating charter, capability web, and town banner', tier: 'in-world-marker', source: 'operatingModel' },
        { id: 'creator-extensions', label: 'Curated creator buildings, typed state, and rollback', tier: 'in-world-marker', source: 'creatorExtensions' },
        { id: 'town-signals-landmarks', label: 'Town signals and landmark state', tier: 'in-world-marker', source: 'townSignals + landmarks' },
        { id: 'town-identity', label: 'Public Square style and plot-card identity', tier: 'in-world-marker', source: 'landmarks.publicSquare.style' },
        { id: 'town-postcards', label: 'Camera postcard captures and public-safe postcard export state', tier: 'in-world-marker', source: 'townPostcards' },
        { id: 'rewards', label: 'Claimable rewards', tier: 'in-world-marker', source: 'rewards' },
        { id: 'journal-recap', label: 'Journal and morning recap state', tier: 'in-world-marker', source: 'journal + recap' },
        { id: 'world-props', label: 'Registered ambient world props', tier: 'world-object', source: 'WORLD_PROPS + asset manifest' },
        { id: 'approvals', label: 'Pending approval stack', tier: 'in-world-marker', source: 'foreman.pendingApprovals' },
        { id: 'foreman-runtime', label: 'Clover runtime, receipts, recommendation', tier: 'in-world-marker', source: 'foreman.runtime + receipt + recommendation' },
        { id: 'foreman-governance', label: 'Foreman leases and exception inbox', tier: 'selected-object-detail', source: 'foreman.governance' },
        { id: 'foreman-persistent', label: 'While-away Foreman runtime and bounded task status', tier: 'selected-object-detail', source: 'foreman.governance.persistent + foreman.scheduler' },
        { id: 'foreman-doctrine', label: 'Clover preference rules and teaching state', tier: 'selected-object-detail', source: 'foreman.doctrine + teachingPreferences' },
        { id: 'foreman-specialists', label: 'Specialist Foreman staffing lanes and conflict state', tier: 'selected-object-detail', source: 'foreman.specialists' },
        { id: 'policy-permissions', label: 'Foreman permission policy', tier: 'selected-object-detail', source: 'policy + unlocks.permissions' },
        { id: 'scheduler', label: 'Collect-ready scheduler', tier: 'selected-object-detail', source: 'foreman.scheduler' },
        { id: 'standing-order', label: 'Foreman standing order', tier: 'selected-object-detail', source: 'foreman.standingOrder' },
        { id: 'unlocks-blocked', label: 'Unlocks and blocked-state indicators', tier: 'selected-object-detail', source: 'unlocks + policy + currentGoal' },
        { id: 'selected-object', label: 'Selected object detail summary', tier: 'selected-object-detail', source: 'selected object + world object' }
      ];
    const featureAllowed = (domainId = '') => roadmapFeatureEnabled(view, COVERAGE_FEATURES[String(domainId || '')]);
    const filteredAnchors = anchors.filter((anchor) => featureAllowed(anchor.domainId));

    return {
      version: 'founders-plot-state-coverage-v1',
      domains: domains.filter((domain) => featureAllowed(domain.id)),
      hud,
      anchors: filteredAnchors,
      selectedDetail: selectedObjectDetail(view, { objects, selectedObjectId, goalObjectId }),
      retainedDomControls: [
        'drawer bodies',
        'selection action buttons',
        'Brain connection controls',
        'Foreman setup controls'
      ],
      blocked
    };
  }

  function drawers(view, options) {
    const badges = drawerBadges(view);
    const activeDrawer = String(options?.activeDrawer || '');
    return DRAWER_CONFIG.filter((entry) => roadmapFeatureEnabled(view, DRAWER_FEATURES[entry.key])).map((entry) => ({
      key: entry.key,
      label: entry.label,
      icon: entry.icon,
      badgeCount: badges[entry.key] || 0,
      active: activeDrawer === entry.key
    }));
  }

  function primaryGoalLabel(goal, targetLabel) {
    const action = goal?.primaryAction || {};
    const actionType = upper(action.type);
    if (goal?.primaryCtaLabel) return goal.primaryCtaLabel;
    if (actionType === 'PLACE_BUILDING') return targetLabel ? `Build on ${targetLabel}` : `Place ${labelForBuilding(action.buildingType)}`;
    if (actionType === 'QUEUE_JOB') return targetLabel ? `Queue work at ${targetLabel}` : 'Queue the next job';
    if (actionType === 'COLLECT_OUTPUTS') return targetLabel ? `Collect from ${targetLabel}` : 'Collect outputs';
    if (actionType === 'UPGRADE_BUILDING' || actionType === 'UPGRADE_HQ') return targetLabel ? `Upgrade ${targetLabel}` : 'Upgrade Headquarters';
    if (actionType === 'VIEW_CONTRACT_BOARD' || actionType === 'ACCEPT_CONTRACT' || actionType === 'TURN_IN_CONTRACT') return 'Open Contract Board';
    if (actionType === 'RESOLVE_APPROVAL') return 'Review approval';
    if (actionType === 'UPGRADE_LANDMARK') return 'Raise the Welcome Sign';
    if (actionType === 'VIEW_TOWN_OPPORTUNITY') return 'Choose town play';
    if (actionType === 'START_SCENARIO') return 'Start scenario';
    if (actionType === 'CONTRIBUTE_SCENARIO') return 'Prep scenario';
    if (actionType === 'VIEW_SCENARIO_BOARD') return 'Open civic project';
    return 'Continue';
  }

  function cloverTargetPosition(targetObject) {
    if (!targetObject) return { x: 0.76, y: 0.64 };
    return {
      x: clamp(number(targetObject.x, 0.76) + (targetObject.kind === 'lot' ? 0.07 : 0.09), 0.12, 0.9),
      y: clamp(number(targetObject.y, 0.64) + (targetObject.kind === 'lot' ? 0.02 : 0.04), 0.24, 0.84)
    };
  }

  function mobileBubblePinned(clover = {}, { activeDrawer = '', selectedObjectId = '', goalObjectId = '' } = {}) {
    const state = upper(clover?.state);
    if (['ACTING', 'CELEBRATING', 'WAITING_FOR_PERMISSION', 'ERROR', 'RESTART_NEEDED'].includes(state)) return true;
    if (String(activeDrawer || '') === 'foreman') return true;
    if (String(selectedObjectId || '') === 'FOREMAN_HUT') return true;
    if (['FOREMAN_HUT', 'APPROVAL_INBOX'].includes(String(goalObjectId || ''))) return true;
    return false;
  }

  function createWorldObjects(view, options) {
    const selectedObjectId = selectionKeyToObjectId(String(options?.selectedKey || ''), view);
    const goalObjectId = goalTargetObjectId(view, String(options?.selectedKey || ''), view);
    const objects = [];
    const journalEntries = Array.isArray(view?.journal?.entries) ? view.journal.entries : [];
    const pendingApprovals = Array.isArray(view?.foreman?.pendingApprovals) ? view.foreman.pendingApprovals : [];
    const openExceptions = Array.isArray(view?.foreman?.governance?.openExceptions) ? view.foreman.governance.openExceptions : [];
    const pendingDecisions = pendingApprovals.length + openExceptions.length;
    const unseenRecap = number(view?.recap?.unseenCount || 0);
    const scenariosEnabled = roadmapFeatureEnabled(view, 'FEATURE_FOUNDERS_V16_SCENARIOS');
    const identityEnabled = roadmapFeatureEnabled(view, 'FEATURE_FOUNDERS_V17_TOWN_IDENTITY');
    const settlementsEnabled = roadmapFeatureEnabled(view, 'FEATURE_FOUNDERS_V25_SECOND_SETTLEMENT');
    const operatingEnabled = roadmapFeatureEnabled(view, 'FEATURE_FOUNDERS_V30_OPERATING_MODEL');
    const regionalEnabled = roadmapFeatureEnabled(view, 'FEATURE_FOUNDERS_V35_REGIONAL_GOVERNANCE');
    const creatorEnabled = roadmapFeatureEnabled(view, 'FEATURE_FOUNDERS_V45_CREATOR_BUILDINGS');
    const settlementWorldEnabled = settlementsEnabled || regionalEnabled;

    const hqBuilding = Array.isArray(view?.buildings)
      ? view.buildings.find((entry) => upper(entry?.type) === 'HQ')
      : null;
    if (hqBuilding) {
      const hqState = buildingVisualState(hqBuilding, view);
      const primaryAction = objectPrimaryAction('HQ', view, hqBuilding);
      objects.push({
        id: 'HQ',
        kind: 'building',
        buildingType: 'HQ',
        worldObjectId: 'hq',
        label: labelForBuilding('HQ'),
        state: hqState,
        x: 0.65,
        y: 0.44,
        z: 32,
        hqLevel: clamp(number(hqBuilding?.level || 1), 1, 5),
        visualTier: hqVisualTier(hqBuilding?.level || 1),
        scale: hqScale(hqBuilding?.level || 1),
        assetId: assetIdForBuilding(hqBuilding, hqState),
        badges: buildingBadges(hqBuilding, hqState, view),
        timer: timerForBuilding(hqBuilding),
        primaryAction,
        ariaLabel: `${labelForBuilding('HQ')} level ${clamp(number(hqBuilding?.level || 1), 1, 5)}, ${stateLabel(hqState)}, ${primaryAction.label}.`,
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
        const objectId = objectIdForBuilding(building, view);
        const primaryAction = objectPrimaryAction(objectId, view, building);
        const sameTypeCount = Array.isArray(view?.buildings)
          ? view.buildings.filter((entry) => upper(entry?.type) === upper(building.type)).length
          : 0;
        objects.push({
          id: objectId,
          kind: 'building',
          buildingType: building.type,
          worldObjectId: worldObjectIdFor(objectId, building.type),
          label: labelForBuilding(building.type),
          state,
          x: layout.x,
          y: layout.y,
          z: layout.z,
          assetId: assetIdForBuilding(building, state),
          badges: buildingBadges(building, state, view),
          timer: timerForBuilding(building),
          primaryAction,
          ariaLabel: `${labelForBuilding(building.type)}, ${stateLabel(state)}, ${primaryAction.label}.`,
          selectionKey: `building:${building.buildingId}`,
          padX: number(building.x),
          padY: number(building.y),
          testId: sameTypeCount > 1
            ? `founders-stage-object-${building.type}-${building.buildingId}`
            : `founders-stage-object-${building.type}`
        });
        return;
      }

      const state = padVisualState(view);
      const objectId = `PAD:${key}`;
      const primaryAction = objectPrimaryAction(objectId, view, null);
      objects.push({
        id: objectId,
        kind: 'lot',
        worldObjectId: 'lot',
        label: String(pad.label || layout.label || 'Open lot'),
        state,
        x: layout.x,
        y: layout.y,
        z: layout.z,
        assetId: state === 'LOCKED' ? 'founders_plot_locked_lot_v1_4_2' : 'founders_plot_empty_lot_v1_4_2',
        badges: state === 'BUILDABLE'
          ? [{
            type: 'build',
            label: 'Build here',
            displayLabel: '+',
            tone: 'neutral',
            overlayRole: 'available',
            overlayWeight: 'quiet',
            iconOnly: true,
            showWhenSelected: true,
            mobileHidden: true
          }]
          : [{
            type: 'locked',
            label: 'Locked lot',
            displayLabel: 'Locked',
            tone: 'warn',
            overlayRole: 'status',
            overlayWeight: 'quiet',
            showWhenSelected: true
          }],
        timer: null,
        primaryAction,
        ariaLabel: `${pad.label || layout.label || 'Lot'}, ${stateLabel(state)}, ${primaryAction.label}.`,
        selectionKey: `pad:${key}`,
        padX: number(pad.x),
        padY: number(pad.y),
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
    const contractAction = objectPrimaryAction('CONTRACT_BOARD', view, null);
    objects.push({
      id: 'CONTRACT_BOARD',
      kind: 'object',
      worldObjectId: 'contract_board',
      label: 'Contract Board',
      state: contractsState,
      x: SPECIAL_OBJECT_LAYOUT.CONTRACT_BOARD.x,
      y: SPECIAL_OBJECT_LAYOUT.CONTRACT_BOARD.y,
      z: SPECIAL_OBJECT_LAYOUT.CONTRACT_BOARD.z,
      assetId: 'founders_plot_contract_board_v1_4_2',
      badges: [
        view?.contracts?.activeContract?.status === 'READY_TO_TURN_IN'
          ? { type: 'contract', label: 'Turn-in ready', tone: 'good', overlayRole: 'status', overlayWeight: 'medium', alwaysVisible: true }
          : view?.contracts?.boardLocked
            ? { type: 'locked', label: 'Unlocks at HQ2', tone: 'warn', overlayRole: 'status', overlayWeight: 'medium', alwaysVisible: true }
            : { type: 'contract', label: 'Town requests', displayLabel: 'Requests', tone: 'neutral', overlayRole: 'ambient', overlayWeight: 'quiet', showWhenSelected: true }
      ],
      timer: null,
      primaryAction: contractAction,
      ariaLabel: `Contract Board, ${stateLabel(contractsState)}, ${contractAction.label}.`,
      drawerKey: 'contracts',
      testId: 'founders-stage-object-CONTRACT_BOARD'
    });

    const publicSquareLevel = number(view?.landmarks?.publicSquare?.level || 0);
    const publicSquareStyle = identityEnabled ? view?.landmarks?.publicSquare?.style || null : null;
    const publicSquareStyleLabel = identityEnabled ? view?.landmarks?.publicSquare?.styleLabel || publicSquareStyle?.label || '' : '';
    const charterLabel = operatingEnabled ? view?.operatingModel?.charter?.label || '' : '';
    const townOpportunityActive = !!view?.townOpportunity?.active?.opportunityId;
    const publicSquareState = townOpportunityActive
      ? 'READY'
      : publicSquareLevel <= 0 && upper(view?.currentGoal?.primaryAction?.type) === 'UPGRADE_LANDMARK'
      ? 'UPGRADE_READY'
      : publicSquareLevel > 0
        ? 'IDLE'
        : 'BUILDABLE';
    const squareAction = objectPrimaryAction('PUBLIC_SQUARE', view, null);
    objects.push({
      id: 'PUBLIC_SQUARE',
      kind: 'object',
      worldObjectId: 'public_square',
      label: 'Welcome Sign',
      state: publicSquareState,
      x: SPECIAL_OBJECT_LAYOUT.PUBLIC_SQUARE.x,
      y: SPECIAL_OBJECT_LAYOUT.PUBLIC_SQUARE.y,
      z: SPECIAL_OBJECT_LAYOUT.PUBLIC_SQUARE.z,
      assetId: 'founders_plot_public_square_v1_4_2',
      tint: publicSquareStyle?.palette?.tint || '',
      identityStyle: publicSquareStyle ? {
        styleId: publicSquareStyle.styleId,
        label: publicSquareStyle.label,
        ornament: publicSquareStyle.ornament,
        palette: publicSquareStyle.palette || {}
      } : null,
      badges: [
        townOpportunityActive
          ? { type: 'opportunity', label: 'Town choice waiting', displayLabel: 'Choice', tone: 'good', overlayRole: 'status', overlayWeight: 'strong', alwaysVisible: true }
          : charterLabel
          ? { type: 'identity', label: charterLabel, displayLabel: 'Charter', tone: 'good', overlayRole: 'ambient', overlayWeight: 'quiet', showWhenSelected: true }
          : publicSquareStyleLabel
          ? { type: 'identity', label: publicSquareStyleLabel, displayLabel: publicSquareStyleLabel.replace(/\s+Square$/i, ''), tone: 'good', overlayRole: 'ambient', overlayWeight: 'quiet', showWhenSelected: true }
          : identityEnabled && publicSquareLevel > 0
          ? { type: 'charm', label: 'Choose town style', displayLabel: 'Style', tone: 'neutral', overlayRole: 'status', overlayWeight: 'medium', showWhenSelected: true }
          : { type: 'civic', label: publicSquareLevel > 0 ? 'Welcome Sign raised' : 'Civic project', displayLabel: publicSquareLevel > 0 ? 'Square' : 'Civic', tone: 'neutral', overlayRole: 'ambient', overlayWeight: 'quiet', showWhenSelected: true }
      ],
      timer: null,
      primaryAction: squareAction,
      ariaLabel: `Public Square, ${townOpportunityActive ? 'town choice waiting' : stateLabel(publicSquareState)}, ${squareAction.label}.`,
      drawerKey: 'signals',
      testId: 'founders-stage-object-PUBLIC_SQUARE'
    });

    if (scenariosEnabled) {
      const activeScenario = view?.scenarios?.active || null;
      const scenarioOffers = Array.isArray(view?.scenarios?.offers) ? view.scenarios.offers : [];
      const scenarioState = activeScenario
        ? activeScenario.status === 'COMPLETED'
          ? 'READY'
          : 'PRODUCING'
        : scenarioOffers.length > 0
          ? 'BUILDABLE'
          : 'IDLE';
      const scenarioAction = objectPrimaryAction('SCENARIO_SITE', view, null);
      objects.push({
        id: 'SCENARIO_SITE',
        kind: 'object',
        worldObjectId: 'scenario_site',
        label: activeScenario?.title || scenarioOffers[0]?.title || 'Civic Project Site',
        state: scenarioState,
        x: SPECIAL_OBJECT_LAYOUT.SCENARIO_SITE.x,
        y: SPECIAL_OBJECT_LAYOUT.SCENARIO_SITE.y,
        z: SPECIAL_OBJECT_LAYOUT.SCENARIO_SITE.z,
        assetId: 'founders_plot_public_square_v1_4_2',
        badges: [
          activeScenario
            ? { type: 'opportunity', label: `${number(activeScenario.completedTasks)} / ${number(activeScenario.minCompletedTasks)} prep`, displayLabel: 'Prep', tone: 'good', overlayRole: 'status', overlayWeight: 'strong', alwaysVisible: true }
            : scenarioOffers.length > 0
              ? { type: 'civic', label: 'Scenario available', displayLabel: 'Event', tone: 'neutral', overlayRole: 'status', overlayWeight: 'medium', alwaysVisible: true }
              : { type: 'civic', label: 'Civic project site', displayLabel: 'Civic', tone: 'neutral', overlayRole: 'ambient', overlayWeight: 'quiet', showWhenSelected: true }
        ],
        timer: activeScenario?.dueAtMs ? {
          startedAtMs: number(activeScenario.startedAtMs),
          label: 'Scenario window',
          endsAtMs: number(activeScenario.dueAtMs),
          status: 'RUNNING',
          progress: clamp((Date.now() - number(activeScenario.startedAtMs)) / Math.max(1, number(activeScenario.dueAtMs) - number(activeScenario.startedAtMs)), 0, 1)
        } : null,
        primaryAction: scenarioAction,
        ariaLabel: `Civic project site, ${stateLabel(scenarioState)}, ${scenarioAction.label}.`,
        drawerKey: 'signals',
        testId: 'founders-stage-object-SCENARIO_SITE'
      });
    }

    const journalAction = objectPrimaryAction('JOURNAL', view, null);
    const journalState = unseenRecap > 0 ? 'READY' : 'IDLE';
    objects.push({
      id: 'JOURNAL',
      kind: 'object',
      worldObjectId: 'journal',
      label: 'Town Journal',
      state: journalState,
      x: SPECIAL_OBJECT_LAYOUT.JOURNAL.x,
      y: SPECIAL_OBJECT_LAYOUT.JOURNAL.y,
      z: SPECIAL_OBJECT_LAYOUT.JOURNAL.z,
      assetId: 'founders_plot_journal_trigger_v1_4_2',
      badges: [
        unseenRecap > 0
          ? { type: 'ready', label: `${unseenRecap} new note${unseenRecap === 1 ? '' : 's'}`, displayLabel: `${unseenRecap}`, tone: 'good', overlayRole: 'status', overlayWeight: 'medium', alwaysVisible: true }
          : { type: 'civic', label: journalEntries.length > 0 ? 'Town record' : 'Journal stand', displayLabel: 'Journal', tone: 'neutral', overlayRole: 'ambient', overlayWeight: 'quiet', showWhenSelected: true }
      ],
      timer: null,
      primaryAction: journalAction,
      ariaLabel: `Town Journal, ${stateLabel(journalState)}, ${journalAction.label}.`,
      drawerKey: 'journal',
      testId: 'founders-stage-object-JOURNAL'
    });

    const approvalAction = objectPrimaryAction('APPROVAL_INBOX', view, null);
    const approvalState = pendingDecisions > 0 ? 'READY' : 'IDLE';
    objects.push({
      id: 'APPROVAL_INBOX',
      kind: 'object',
      worldObjectId: 'approval_inbox',
      label: 'Approval Bell',
      state: approvalState,
      x: SPECIAL_OBJECT_LAYOUT.APPROVAL_INBOX.x,
      y: SPECIAL_OBJECT_LAYOUT.APPROVAL_INBOX.y,
      z: SPECIAL_OBJECT_LAYOUT.APPROVAL_INBOX.z,
      assetId: 'founders_plot_approval_inbox_v1_4_2',
      badges: [
        pendingDecisions > 0
          ? { type: 'approval', label: `${pendingDecisions} waiting`, displayLabel: `${pendingDecisions}`, tone: 'warn', overlayRole: 'status', overlayWeight: 'strong', alwaysVisible: true }
          : { type: 'civic', label: 'Inbox clear', displayLabel: 'Clear', tone: 'neutral', overlayRole: 'ambient', overlayWeight: 'quiet', showWhenSelected: true }
      ],
      timer: null,
      primaryAction: approvalAction,
      ariaLabel: `Approval Bell, ${stateLabel(approvalState)}, ${approvalAction.label}.`,
      drawerKey: 'approvals',
      testId: 'founders-stage-object-APPROVAL_INBOX'
    });

    if (settlementWorldEnabled) {
      const settlementLedger = view?.settlements || {};
      const settlementCount = Array.isArray(settlementLedger.settlements) ? settlementLedger.settlements.length : 1;
      const expeditionStatus = upper(settlementLedger?.expedition?.status || '');
      const regionalRoutes = regionalEnabled && Array.isArray(view?.regionalNetwork?.routes) ? view.regionalNetwork.routes : [];
      const regionalIssues = regionalEnabled ? number(view?.regionalNetwork?.pendingIssueCount || 0) : 0;
      const regionalActive = regionalRoutes.some((route) => ['ACTIVE', 'SHORTAGE'].includes(upper(route?.status || '')));
      const regionalReady = view?.regionalNetwork?.gate?.ready === true && regionalRoutes.some((route) => upper(route?.status || '') === 'READY');
      const ledgerState = regionalIssues > 0
        ? 'BLOCKED'
        : expeditionStatus === 'READY'
        ? 'READY'
        : expeditionStatus === 'LAUNCHED' || regionalActive
          ? 'PRODUCING'
          : 'IDLE';
      const ledgerAction = objectPrimaryAction('GOVERNOR_LEDGER', view, null);
      objects.push({
        id: 'GOVERNOR_LEDGER',
        kind: 'object',
        worldObjectId: 'governor_ledger',
        label: 'Governor Ledger',
        state: ledgerState,
        x: SPECIAL_OBJECT_LAYOUT.GOVERNOR_LEDGER.x,
        y: SPECIAL_OBJECT_LAYOUT.GOVERNOR_LEDGER.y,
        z: SPECIAL_OBJECT_LAYOUT.GOVERNOR_LEDGER.z,
        assetId: 'founders_plot_journal_trigger_v1_4_2',
        badges: [
          regionalIssues > 0
            ? { type: 'approval', label: `${regionalIssues} regional issue${regionalIssues === 1 ? '' : 's'}`, displayLabel: `${regionalIssues}`, tone: 'warn', overlayRole: 'status', overlayWeight: 'strong', alwaysVisible: true }
            : regionalReady
              ? { type: 'opportunity', label: 'Regional route ready', displayLabel: 'Route', tone: 'good', overlayRole: 'status', overlayWeight: 'strong', alwaysVisible: true }
              : expeditionStatus === 'READY'
            ? { type: 'opportunity', label: 'Settler Expedition ready', displayLabel: 'Expedition', tone: 'good', overlayRole: 'status', overlayWeight: 'strong', alwaysVisible: true }
            : expeditionStatus === 'LAUNCHED' || regionalActive
              ? { type: 'civic', label: `${settlementCount} settlements`, displayLabel: `${settlementCount} towns`, tone: 'good', overlayRole: 'status', overlayWeight: 'medium', showWhenSelected: true }
              : { type: 'civic', label: 'Governor Ledger', displayLabel: 'Ledger', tone: 'neutral', overlayRole: 'ambient', overlayWeight: 'quiet', showWhenSelected: true }
        ],
        timer: null,
        primaryAction: ledgerAction,
        ariaLabel: `Governor Ledger, ${stateLabel(ledgerState)}, ${ledgerAction.label}.`,
        drawerKey: 'settlements',
        testId: 'founders-stage-object-GOVERNOR_LEDGER'
      });

      if (settlementCount > 1 || regionalRoutes.length > 0) {
        const settlements = Array.isArray(settlementLedger.settlements) ? settlementLedger.settlements : [];
        for (const settlement of settlements.slice(0, 2)) {
          const settlementId = String(settlement?.settlementId || settlement?.id || '');
          const nodeId = settlementId === 'town_2' ? 'SETTLEMENT_NODE_TOWN_2' : 'SETTLEMENT_NODE_TOWN_1';
          const layout = SPECIAL_OBJECT_LAYOUT[nodeId] || SPECIAL_OBJECT_LAYOUT.SETTLEMENT_NODE_TOWN_1;
          const active = String(settlementLedger.activeSettlementId || '') === settlementId;
          const nodeAction = objectPrimaryAction(nodeId, view, null);
          objects.push({
            id: nodeId,
            kind: 'object',
            worldObjectId: `settlement_node_${settlementId || 'town'}`,
            label: settlement?.name || (settlementId === 'town_2' ? 'Ridge Outpost' : 'Founders Plot'),
            state: active ? 'READY' : 'IDLE',
            x: layout.x,
            y: layout.y,
            z: layout.z,
            scale: active ? 0.58 : 0.5,
            assetId: settlementId === 'town_2' ? 'founders_plot_supply_crates_prop_v1_4_4' : 'founders_plot_journal_trigger_v1_4_2',
            badges: [
              active
                ? { type: 'civic', label: 'Camera focus', displayLabel: 'Focus', tone: 'good', overlayRole: 'status', overlayWeight: 'medium', alwaysVisible: true }
                : { type: 'civic', label: 'Settlement node', displayLabel: 'Town', tone: 'neutral', overlayRole: 'ambient', overlayWeight: 'quiet', showWhenSelected: true }
            ],
            attention: active ? 'recommended' : '',
            timer: null,
            primaryAction: nodeAction,
            ariaLabel: `${settlement?.name || 'Settlement node'}, ${active ? 'camera focus' : 'regional map node'}, ${nodeAction.label}.`,
            drawerKey: 'settlements',
            selectionKey: `settlement:${settlementId}`,
            testId: `founders-stage-object-${nodeId}`
          });
        }
      }
    }

    const runtimeStatus = upper(view?.foreman?.runtime?.status);
    const foremanObjectState = options?.localForemanRuntimeStatus?.needsRestart || options?.localForemanRuntimeStatus?.expired || runtimeStatus === 'ERROR'
        ? 'BLOCKED'
        : runtimeStatus === 'PAUSED'
          ? 'IDLE'
          : ['BOOTING', 'OBSERVING', 'THINKING', 'ACTING'].includes(runtimeStatus)
              ? 'PRODUCING'
              : 'IDLE';
    const foremanAction = objectPrimaryAction('FOREMAN_HUT', view, null);
    objects.push({
      id: 'FOREMAN_HUT',
      kind: 'object',
      worldObjectId: 'foreman_hut',
      label: 'Foreman Hut',
      state: foremanObjectState,
      x: SPECIAL_OBJECT_LAYOUT.FOREMAN_HUT.x,
      y: SPECIAL_OBJECT_LAYOUT.FOREMAN_HUT.y,
      z: SPECIAL_OBJECT_LAYOUT.FOREMAN_HUT.z,
      assetId: 'founders_plot_foreman_hut_v1_4_2',
      badges: [
        options?.localForemanRuntimeStatus?.needsRestart || options?.localForemanRuntimeStatus?.expired || runtimeStatus === 'ERROR'
            ? { type: 'restart', label: 'Needs a fresh start', displayLabel: 'Restart', tone: 'warn', overlayRole: 'status', overlayWeight: 'strong', alwaysVisible: true }
            : runtimeStatus === 'NOT_STARTED'
              ? { type: 'foreman', label: 'Start Clover', displayLabel: 'Clover', tone: 'neutral', overlayRole: 'ambient', overlayWeight: 'quiet', showWhenSelected: true }
              : { type: 'foreman', label: pendingApprovals.length > 0 ? 'Clover is waiting' : 'Clover nearby', displayLabel: 'Clover', tone: 'neutral', overlayRole: 'ambient', overlayWeight: 'quiet', showWhenSelected: true }
      ],
      timer: null,
      primaryAction: foremanAction,
      ariaLabel: `Foreman Hut, ${stateLabel(foremanObjectState)}, ${foremanAction.label}.`,
      drawerKey: 'foreman',
      testId: 'founders-stage-object-FOREMAN_HUT'
    });

    const creatorInstalled = creatorEnabled && Array.isArray(view?.creatorExtensions?.installed) ? view.creatorExtensions.installed : [];
    const creatorKiosk = creatorInstalled.find((entry) => entry?.active === true || upper(entry?.status) === 'ACTIVE') || creatorInstalled[0] || null;
    if (creatorKiosk) {
      const creatorActive = creatorKiosk.active === true || upper(creatorKiosk.status) === 'ACTIVE';
      const creatorAction = objectPrimaryAction('CREATOR_NOTICE_KIOSK', view, null);
      const noticeCount = number(creatorKiosk?.state?.noticeCount || 0);
      objects.push({
        id: 'CREATOR_NOTICE_KIOSK',
        kind: 'object',
        worldObjectId: 'creator_notice_kiosk',
        label: creatorKiosk.label || 'Creator Notice Kiosk',
        state: creatorActive ? 'READY' : 'IDLE',
        x: SPECIAL_OBJECT_LAYOUT.CREATOR_KIOSK.x,
        y: SPECIAL_OBJECT_LAYOUT.CREATOR_KIOSK.y,
        z: SPECIAL_OBJECT_LAYOUT.CREATOR_KIOSK.z,
        assetId: 'founders_plot_journal_trigger_v1_4_2',
        badges: [
          creatorActive
            ? { type: 'civic', label: `${noticeCount} notice${noticeCount === 1 ? '' : 's'}`, displayLabel: 'Creator', tone: 'good', overlayRole: 'status', overlayWeight: 'medium', showWhenSelected: true }
            : { type: 'locked', label: 'Creator building disabled', displayLabel: 'Disabled', tone: 'warn', overlayRole: 'status', overlayWeight: 'quiet', showWhenSelected: true }
        ],
        timer: null,
        primaryAction: creatorAction,
        ariaLabel: `${creatorKiosk.label || 'Creator Notice Kiosk'}, ${creatorActive ? 'attached' : 'disabled'}, ${creatorAction.label}.`,
        drawerKey: 'creator',
        testId: 'founders-stage-object-CREATOR_NOTICE_KIOSK'
      });
    }

    WORLD_PROPS.forEach((prop) => {
      objects.push({
        id: prop.id,
        kind: 'prop',
        propId: prop.propId,
        worldObjectId: prop.worldObjectId,
        label: prop.label,
        state: prop.state,
        x: prop.x,
        y: prop.y,
        z: prop.z,
        scale: prop.scale,
        assetId: prop.assetId,
        badges: [],
        timer: null,
        primaryAction: { label: 'Ambient prop', action: '' },
        ariaLabel: `${prop.label}, ambient world prop.`,
        testId: `founders-stage-object-${prop.propId}`
      });
    });

    const viewportWidth = number(options?.viewportWidth, 1280);
    const currentCloverState = cloverState(view, options);
    const cloverTargetObjectId = String(currentCloverState?.targetObjectId || '');
    return objects.map((object) => {
      const attention = objectAttention(object, goalObjectId);
      const selected = selectedObjectId === object.id;
      const goalTarget = goalObjectId === object.id;
      const cloverTarget = cloverTargetObjectId === object.id;
      const overlayMeta = objectOverlayMeta(object, { selected, goalTarget, attention });
      const labelRole = objectLabelRole(object, { viewportWidth, selected, goalTarget, attention, cloverTarget });
      const badges = decorateBadges(object.badges, {
        viewportWidth,
        selected,
        goalTarget,
        attention,
        object,
        cloverTarget,
        cloverState: currentCloverState?.state || ''
      });
      return {
        ...object,
        selected,
        goalTarget,
        cloverTarget,
        attention,
        overlayRole: overlayMeta.overlayRole,
        overlayWeight: overlayMeta.overlayWeight,
        labelRole,
        badges,
        labelVisible: shouldShowLabel(object, {
          viewportWidth,
          selected,
          attention,
          labelRole,
          cloverTarget,
          cloverState: currentCloverState?.state || ''
        })
      };
    });
  }

  function regionalRouteVisuals(view, objects = []) {
    if (!roadmapFeatureEnabled(view, 'FEATURE_FOUNDERS_V35_REGIONAL_GOVERNANCE')) return [];
    const homeNode = objectForId(objects, 'SETTLEMENT_NODE_TOWN_1') || objectForId(objects, 'HQ') || objectForId(objects, 'PUBLIC_SQUARE');
    const ridgeNode = objectForId(objects, 'SETTLEMENT_NODE_TOWN_2') || objectForId(objects, 'GOVERNOR_LEDGER');
    if (!homeNode || !ridgeNode) return [];
    const routes = Array.isArray(view?.regionalNetwork?.routes) ? view.regionalNetwork.routes : [];
    return routes.map((route) => {
      const status = upper(route?.status || 'LOCKED');
      return {
        routeId: String(route?.routeId || ''),
        label: String(route?.label || 'Regional route'),
        status,
        fromObjectId: homeNode.id,
        toObjectId: ridgeNode.id,
        from: { x: number(homeNode.x, 0.5), y: number(homeNode.y, 0.5), z: number(homeNode.z, 10) },
        to: { x: number(ridgeNode.x, 0.5), y: number(ridgeNode.y, 0.5), z: number(ridgeNode.z, 10) },
        active: ['ACTIVE', 'SHORTAGE'].includes(status),
        issue: status === 'SHORTAGE'
      };
    });
  }

  function regionalMapState(view, objects = []) {
    const settlementsEnabled = roadmapFeatureEnabled(view, 'FEATURE_FOUNDERS_V25_SECOND_SETTLEMENT');
    const regionalEnabled = roadmapFeatureEnabled(view, 'FEATURE_FOUNDERS_V35_REGIONAL_GOVERNANCE');
    if (!settlementsEnabled && !regionalEnabled) {
      return {
        version: 'founders-plot-regional-map-disabled-v1',
        enabled: false,
        activeSettlementId: 'town_1',
        cameraFocusObjectId: objectForId(objects, 'HQ') ? 'HQ' : 'PUBLIC_SQUARE',
        settlementNodes: [],
        routeCount: 0,
        issueCount: 0,
        transitionLabel: ''
      };
    }
    const settlementLedger = view?.settlements || {};
    const settlements = Array.isArray(settlementLedger.settlements) ? settlementLedger.settlements : [];
    const activeSettlementId = String(settlementLedger.activeSettlementId || 'town_1');
    const focusObjectId = activeSettlementId === 'town_2' ? 'SETTLEMENT_NODE_TOWN_2' : 'SETTLEMENT_NODE_TOWN_1';
    const routes = regionalEnabled && Array.isArray(view?.regionalNetwork?.routes) ? view.regionalNetwork.routes : [];
    return {
      version: 'founders-plot-regional-map-v1',
      enabled: true,
      activeSettlementId,
      cameraFocusObjectId: objectForId(objects, focusObjectId) ? focusObjectId : objectForId(objects, 'GOVERNOR_LEDGER') ? 'GOVERNOR_LEDGER' : 'HQ',
      settlementNodes: settlements.map((settlement) => {
        const settlementId = String(settlement?.settlementId || '');
        return {
          settlementId,
          objectId: settlementId === 'town_2' ? 'SETTLEMENT_NODE_TOWN_2' : 'SETTLEMENT_NODE_TOWN_1',
          label: String(settlement?.name || settlementId || 'Settlement'),
          active: settlementId === activeSettlementId
        };
      }),
      routeCount: routes.length,
      issueCount: number(view?.regionalNetwork?.pendingIssueCount || 0),
      transitionLabel: activeSettlementId === 'town_2' ? 'Camera jumped to Ridge Outpost' : 'Camera centered on Founders Plot'
    };
  }

  function createSceneState(view, options = {}) {
    const goal = currentGoal(view);
    const selectedObjectId = selectionKeyToObjectId(String(options.selectedKey || ''), view);
    const objects = createWorldObjects(view, options).map((object) => {
      const gridCell = gridCoordForPoint(object.x, object.y);
      return {
        ...object,
        gridCellId: gridCell.id,
        gridCol: gridCell.col,
        gridRow: gridCell.row
      };
    });
    const goalObjectId = goalTargetObjectId(view, String(options.selectedKey || ''), view);
    const goalObject = objects.find((object) => object.id === goalObjectId) || null;
    const cloverBase = cloverState(view, options);
    const cloverTarget = objects.find((object) => object.id === cloverBase.targetObjectId) || goalObject || null;
    const cloverPosition = cloverTargetPosition(cloverTarget);
    const cloverGridCell = gridCoordForPoint(cloverPosition.x, cloverPosition.y);
    const grid = createWorldGrid(objects, selectedObjectId);
    const regionalRoutes = regionalRouteVisuals(view, objects);
    const regionalMap = regionalMapState(view, objects);
    const drawerItems = drawers(view, options);
    const stateCoverage = createStateCoverage(view, {
      objects,
      goal,
      goalObjectId,
      selectedObjectId
    });
    const stageBackgrounds = {
      desktop: '/experiences/founders-plot/assets/scenes/founders-plot-desktop.webp',
      mobile: '/experiences/founders-plot/assets/scenes/founders-plot-mobile.webp',
      desktopAssetId: 'founders_plot_scene_desktop_v1_4_2',
      mobileAssetId: 'founders_plot_scene_mobile_v1_4_2',
      layerMode: 'layered_plates'
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
        primaryCtaLabel: primaryGoalLabel(goal, goalObject?.label || ''),
        targetObjectId: goalObjectId,
        targetLabel: goalObject?.label || '',
        recommendedObjectId: goalObjectId
      },
      clover: {
        ...cloverBase,
        targetObjectId: cloverTarget?.id || cloverBase.targetObjectId || '',
        targetLabel: cloverTarget?.label || '',
        actionVerb: cloverBase.actionVerb || actionVerbForReceipt(view?.foreman?.receipt || {}),
        assetId: {
          NOT_STARTED: 'clover_idle_v1_4_4',
          OBSERVING: 'clover_observing_v1_4_4',
          THINKING: 'clover_thinking_v1_4_4',
          ACTING: 'clover_acting_v1_4_4',
          CELEBRATING: 'clover_celebrating_v1_4_4',
          WAITING_FOR_PERMISSION: 'clover_waiting_approval_v1_4_4',
          PAUSED: 'clover_paused_v1_4_4',
          ERROR: 'clover_blocked_v1_4_4',
          RESTART_NEEDED: 'clover_restart_needed_v1_4_4'
        }[cloverBase.state] || 'clover_idle_v1_4_4',
        x: cloverPosition.x,
        y: cloverPosition.y,
        gridCellId: cloverGridCell.id,
        gridCol: cloverGridCell.col,
        gridRow: cloverGridCell.row,
        mobileBubblePinned: mobileBubblePinned(cloverBase, { activeDrawer: options.activeDrawer, selectedObjectId, goalObjectId })
      },
      drawers: drawerItems,
      drawerBadges: drawerBadges(view),
      objects,
      regionalRoutes,
      regionalMap,
      cameraFocus: {
        objectId: regionalMap.cameraFocusObjectId,
        reason: regionalMap.transitionLabel
      },
      grid,
      stateCoverage,
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
    badgeLabelRole,
    buildingVisualState,
    cloverState,
    createStateCoverage,
    createSceneState,
    drawerBadges,
    goalTargetObjectId,
    mobileSignalPriority,
    objectLabelRole,
    selectionKeyToObjectId,
    viewportClass,
    stateLabel
  };
});
