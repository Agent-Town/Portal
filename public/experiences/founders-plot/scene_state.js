(function attachFoundersPlotSceneState(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.FoundersPlotSceneState = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function foundersPlotSceneStateFactory() {
  const BUILDING_LABELS = {
    HQ: 'Headquarters',
    LUMBER_CAMP: 'Lumber Camp',
    FARM_PLOT: 'Farm Plot',
    QUARRY: 'Quarry',
    WORKSHOP: 'Workshop',
    MARKET_STALL: 'Market Stall'
  };

  const PAD_POSITIONS = {
    '1,0': { x: 0.50, y: 0.24, z: 30 },
    '0,1': { x: 0.25, y: 0.52, z: 22 },
    '1,1': { x: 0.50, y: 0.50, z: 24 },
    '2,1': { x: 0.75, y: 0.52, z: 22 },
    '0,2': { x: 0.28, y: 0.76, z: 14 },
    '1,2': { x: 0.52, y: 0.78, z: 15 },
    '2,2': { x: 0.76, y: 0.76, z: 14 }
  };

  const ACTOR_OFFSETS = {
    clover: { x: -0.12, y: 0.10 },
    builder: { x: 0.06, y: 0.08 },
    worker: { x: -0.07, y: 0.06 },
    hauler: { x: 0.10, y: -0.02 },
    messenger: { x: 0.13, y: 0.09 }
  };

  const ROLE_ROUTE_LANES = {
    clover: -0.045,
    builder: -0.020,
    worker: 0.020,
    hauler: 0.050,
    messenger: -0.060
  };

  const ACTION_CUES = {
    clover: {
      cueType: 'foreman_presence',
      accessory: 'clover',
      lane: 'watching',
      label: 'Clover watching the plot'
    },
    builder: {
      cueType: 'construction_progress',
      accessory: 'hammer',
      lane: 'building',
      label: 'Construction work'
    },
    worker: {
      cueType: 'production_work',
      accessory: 'tools',
      lane: 'production',
      label: 'Production work'
    },
    hauler: {
      cueType: 'carry_bundle',
      accessory: 'bundle',
      lane: 'output_ready',
      label: 'Output ready'
    },
    messenger: {
      cueType: 'attention_marker',
      accessory: 'notice',
      lane: 'attention',
      label: 'Attention marker'
    }
  };

  const ACTION_ANIMATIONS = {
    clover: { mode: 'clover_watch', tempo: 0.8 },
    builder: { mode: 'work_swing', tempo: 1.25 },
    worker: { mode: 'busy_work', tempo: 1.15 },
    hauler: { mode: 'carry_wobble', tempo: 1.05 },
    messenger: { mode: 'attention_wave', tempo: 1.35 }
  };

  const ACTOR_SPRITE_SHEETS = {
    builder: {
      id: 'rigger-slate-builder-v2',
      src: '/experiences/founders-plot/assets/characters/inhabitants/builder/rigger-slate-builder-v2.png',
      metadataSrc: '/experiences/founders-plot/assets/characters/inhabitants/builder/rigger-slate-builder-v2.json',
      actionMapping: {
        CONSTRUCT: 'build',
        UPGRADE: 'build',
        OUTPUT_READY: 'ready'
      }
    },
    worker: {
      id: 'kettle-37-worker-v1',
      src: '/experiences/founders-plot/assets/characters/inhabitants/worker/kettle-37-worker-v1.png',
      metadataSrc: '/experiences/founders-plot/assets/characters/inhabitants/worker/kettle-37-worker-v1.json',
      actionMapping: {
        PRODUCE: 'work',
        SELL: 'work',
        OUTPUT_READY: 'ready'
      }
    },
    hauler: {
      id: 'oona-tallpack-hauler-v1',
      src: '/experiences/founders-plot/assets/characters/inhabitants/hauler/oona-tallpack-hauler-v1.png',
      metadataSrc: '/experiences/founders-plot/assets/characters/inhabitants/hauler/oona-tallpack-hauler-v1.json',
      actionMapping: {
        OUTPUT_READY: 'ready'
      }
    },
    messenger: {
      id: 'messenger-agentfolk-v1',
      src: '/experiences/founders-plot/assets/characters/inhabitants/messenger/messenger-agentfolk-v1.png',
      metadataSrc: '/experiences/founders-plot/assets/characters/inhabitants/messenger/messenger-agentfolk-v1.json',
      actionMapping: {
        APPROVAL: 'ready',
        REWARD: 'ready',
        QUEST: 'ready'
      }
    }
  };

  const DEFAULT_SPRITE_SHEET_ACTIONS = {
    idle: { row: 0, frames: [0, 1, 2, 3], fps: 3 },
    walk: { row: 1, frames: [0, 1, 2, 3], fps: 6 },
    build: { row: 1, frames: [0, 1, 2, 3], fps: 6 },
    work: { row: 2, frames: [0, 1, 2, 3], fps: 6 },
    ready: { row: 3, frames: [0, 1, 2, 3], fps: 4 }
  };

  function num(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function upper(value) {
    return String(value || '').trim().toUpperCase();
  }

  function labelForBuilding(type) {
    return BUILDING_LABELS[upper(type)] || String(type || 'Building').replace(/_/g, ' ');
  }

  function padKey(x, y) {
    return `${num(x)},${num(y)}`;
  }

  function padPosition(x, y) {
    const position = PAD_POSITIONS[padKey(x, y)];
    if (position) return position;
    return {
      x: clamp((num(x) + 0.5) / 3, 0.08, 0.92),
      y: clamp((num(y) + 0.5) / 3, 0.10, 0.90),
      z: 10
    };
  }

  function assetForBuilding(building = {}) {
    const type = upper(building.type);
    if (type === 'HQ') {
      const level = clamp(Math.round(num(building.level, 1)), 1, 5);
      return `/experiences/founders-plot/assets/buildings/hq-lv${level}.webp`;
    }
    const files = {
      LUMBER_CAMP: 'lumber-camp',
      FARM_PLOT: 'farm-plot',
      QUARRY: 'quarry',
      WORKSHOP: 'workshop',
      MARKET_STALL: 'market-stall'
    };
    return files[type] ? `/experiences/founders-plot/assets/buildings/${files[type]}.webp` : '';
  }

  function actorAsset(actor = {}) {
    const role = String(actor.canonicalRoleId || '').trim();
    if (ACTOR_SPRITE_SHEETS[role]) return ACTOR_SPRITE_SHEETS[role].src;
    if (role !== 'clover') return '';
    const state = String(actor.visualState || '').trim().replace(/_/g, '-');
    const allowed = [
      'acting',
      'blocked',
      'celebrating',
      'idle',
      'observing',
      'paused',
      'restart-needed',
      'thinking',
      'waiting-approval'
    ];
    const fileState = allowed.includes(state) ? state : 'observing';
    return `/experiences/founders-plot/assets/characters/v1_4_4/clover-${fileState}.webp`;
  }

  function actorSpriteSheet(actor = {}) {
    const role = String(actor.canonicalRoleId || '').trim();
    const sheet = ACTOR_SPRITE_SHEETS[role];
    if (!sheet) return null;
    const actionKind = upper(actor.actionKind || actor.visualState || '');
    const action = sheet.actionMapping[actionKind] || 'idle';
    const frames = DEFAULT_SPRITE_SHEET_ACTIONS[action] || DEFAULT_SPRITE_SHEET_ACTIONS.idle;
    return {
      id: sheet.id,
      metadataSrc: sheet.metadataSrc,
      columns: 4,
      rows: 4,
      frameWidth: 512,
      frameHeight: 512,
      action,
      ...frames
    };
  }

  function objectIdForBuilding(building = {}) {
    if (upper(building.type) === 'HQ') return 'HQ';
    return String(building.buildingId || building.type || '').trim();
  }

  function buildingByIdOrType(buildings, idOrType) {
    const key = String(idOrType || '').trim();
    if (!key) return null;
    return buildings.find((building) => String(building.buildingId || '') === key)
      || buildings.find((building) => upper(building.type) === upper(key))
      || null;
  }

  function sceneObjectForBuilding(building = {}, context = {}) {
    const pos = padPosition(building.x, building.y);
    const state = upper(building.state || 'READY');
    const id = objectIdForBuilding(building);
    const selected = context.selectedKey === `building:${building.buildingId}`;
    return {
      id,
      kind: 'building',
      buildingId: String(building.buildingId || ''),
      buildingType: upper(building.type),
      label: `${labelForBuilding(building.type)} Lv ${building.level || 1}`,
      state,
      x: pos.x,
      y: pos.y,
      z: pos.z,
      scale: upper(building.type) === 'HQ' ? 1.28 : 1,
      assetSrc: assetForBuilding(building),
      selectionKey: `building:${building.buildingId}`,
      drawerKey: 'building',
      testId: `fp-scene-building-${String(building.type || '').toLowerCase().replace(/_/g, '-')}`,
      selected,
      visualOnly: false,
      timer: building.activeJob || building.runningJob || null
    };
  }

  function sceneObjectForPad(pad = {}, buildings = [], context = {}) {
    const existing = buildings.find((building) => num(building.x) === num(pad.x) && num(building.y) === num(pad.y));
    if (existing) return null;
    const pos = padPosition(pad.x, pad.y);
    const selected = context.selectedKey === `pad:${pad.x},${pad.y}`;
    const locked = pad.locked === true;
    return {
      id: `PAD:${pad.x},${pad.y}`,
      kind: 'pad',
      label: locked ? 'Locked pad' : 'Open pad',
      state: locked ? 'LOCKED' : 'BUILDABLE',
      x: pos.x,
      y: pos.y,
      z: pos.z - 4,
      scale: 0.82,
      assetSrc: locked
        ? '/experiences/founders-plot/assets/objects/locked-lot.webp'
        : '/experiences/founders-plot/assets/objects/empty-lot.webp',
      selectionKey: `pad:${pad.x},${pad.y}`,
      drawerKey: 'build',
      testId: `fp-scene-pad-${pad.x}-${pad.y}`,
      selected,
      visualOnly: false,
      validPlacement: !locked
    };
  }

  function targetPosition(actor = {}, buildings = []) {
    const target = actor.target || {};
    const building = buildingByIdOrType(buildings, target.id || target.type);
    if (building) return padPosition(building.x, building.y);
    if (Number.isFinite(num(target.x, NaN)) && Number.isFinite(num(target.y, NaN))) {
      return padPosition(target.x, target.y);
    }
    return { x: 0.50, y: 0.42, z: 28 };
  }

  function hqBuilding(buildings = []) {
    return buildings.find((building) => upper(building.type) === 'HQ') || buildings[0] || null;
  }

  function hqAnchor(buildings = []) {
    const hq = hqBuilding(buildings);
    if (hq) {
      const pos = padPosition(hq.x, hq.y);
      return { id: objectIdForBuilding(hq), x: pos.x, y: clamp(pos.y + 0.10, 0.08, 0.92), z: pos.z };
    }
    return { id: 'HQ', x: 0.50, y: 0.34, z: 28 };
  }

  function buildingAnchor(building = {}) {
    const pos = padPosition(building.x, building.y);
    return {
      id: objectIdForBuilding(building),
      x: pos.x,
      y: clamp(pos.y + 0.03, 0.08, 0.92),
      z: pos.z
    };
  }

  function routeMidpoint(from, to, lane = 0) {
    return {
      x: clamp((from.x + to.x) / 2 + lane, 0.06, 0.94),
      y: clamp((from.y + to.y) / 2 + Math.abs(lane) * 0.35, 0.08, 0.92)
    };
  }

  function wayForBuilding(building = {}, buildings = []) {
    if (!building || upper(building.type) === 'HQ') return null;
    const from = hqAnchor(buildings);
    const to = buildingAnchor(building);
    const lane = clamp((num(building.x, 1) - 1) * 0.018, -0.030, 0.030);
    const points = [
      { x: from.x, y: from.y },
      routeMidpoint(from, to, lane),
      { x: to.x, y: to.y }
    ];
    return {
      wayId: `WAY:HQ:${to.id}`,
      kind: 'way',
      label: `HQ path to ${labelForBuilding(building.type)}`,
      from: { kind: 'building', id: from.id },
      to: { kind: 'building', id: to.id },
      points,
      targetId: to.id,
      selectionKey: `building:${building.buildingId}`,
      visualOnly: true
    };
  }

  function pointAlong(points = [], progress = 0) {
    const usable = points
      .filter((point) => Number.isFinite(num(point.x, NaN)) && Number.isFinite(num(point.y, NaN)))
      .map((point) => ({ x: num(point.x, 0.5), y: num(point.y, 0.5) }));
    if (usable.length === 0) return { x: 0.5, y: 0.5 };
    if (usable.length === 1) return usable[0];
    const clamped = clamp(num(progress, 0), 0, 1);
    const scaled = clamped * (usable.length - 1);
    const index = Math.min(usable.length - 2, Math.floor(scaled));
    const local = scaled - index;
    const from = usable[index];
    const to = usable[index + 1];
    return {
      x: from.x + ((to.x - from.x) * local),
      y: from.y + ((to.y - from.y) * local)
    };
  }

  function actorRouteProgress(actor = {}, role = 'worker') {
    const progress = clamp(num(actor.progress, 0), 0, 1);
    if (role === 'builder') return clamp(0.18 + (progress * 0.68), 0.18, 0.88);
    if (role === 'worker') return clamp(0.28 + (progress * 0.50), 0.28, 0.82);
    if (role === 'hauler') return 0.78;
    if (role === 'messenger') return 0.38;
    return 0.24;
  }

  function actorRoute(actor = {}, role = 'worker', index = 0, buildings = [], waysByTarget = new Map()) {
    const target = actor.target || {};
    const building = buildingByIdOrType(buildings, target.id || target.type);
    const from = hqAnchor(buildings);
    const lane = ROLE_ROUTE_LANES[role] || 0;
    const progress = actorRouteProgress(actor, role);

    if (building && upper(building.type) !== 'HQ') {
      const to = buildingAnchor(building);
      const way = waysByTarget.get(to.id) || wayForBuilding(building, buildings);
      const points = (way?.points || [
        { x: from.x, y: from.y },
        routeMidpoint(from, to, lane),
        { x: to.x, y: to.y }
      ]).map((point) => ({
        x: clamp(num(point.x, 0.5) + lane, 0.06, 0.94),
        y: clamp(num(point.y, 0.5) + ((index % 2) * 0.010), 0.08, 0.92)
      }));
      const at = pointAlong(points, progress);
      return {
        routeId: `ROUTE:${role}:${String(actor.actorId || index)}`,
        wayId: way?.wayId || `WAY:HQ:${to.id}`,
        mode: role === 'hauler' ? 'carry' : role === 'messenger' ? 'notify' : 'work',
        from: { kind: 'building', id: from.id },
        to: { kind: 'building', id: to.id },
        targetId: to.id,
        points,
        progress,
        lane,
        x: at.x,
        y: at.y,
        visualOnly: true
      };
    }

    const radius = role === 'clover' ? 0.08 : 0.11;
    const orbitY = role === 'messenger' ? from.y + 0.04 : from.y + 0.015;
    const points = [
      { x: clamp(from.x - radius, 0.06, 0.94), y: clamp(orbitY, 0.08, 0.92) },
      { x: clamp(from.x, 0.06, 0.94), y: clamp(orbitY + Math.abs(lane) * 0.25, 0.08, 0.92) },
      { x: clamp(from.x + radius, 0.06, 0.94), y: clamp(orbitY, 0.08, 0.92) }
    ];
    const at = pointAlong(points, progress);
    return {
      routeId: `ROUTE:${role}:${String(actor.actorId || index)}`,
      wayId: 'WAY:HQ:TOWN_SQUARE',
      mode: role === 'messenger' ? 'notify' : 'presence',
      from: { kind: 'building', id: from.id },
      to: { kind: 'town_square', id: 'HQ_APPROACH' },
      targetId: from.id,
      points,
      progress,
      lane,
      x: at.x,
      y: at.y,
      visualOnly: true
    };
  }

  function drawerKeyForActor(actor = {}) {
    const domain = String(actor.sourceDomain || '').trim();
    if (domain === 'approval') return 'approvals';
    if (domain === 'reward') return 'rewards';
    if (domain === 'quest') return 'quest';
    if (domain === 'foreman') return 'foreman';
    return actor.drawerKey || 'building';
  }

  function selectionKeyForActor(actor = {}) {
    const target = actor.target || {};
    if (target.kind === 'building' && target.id) return `building:${target.id}`;
    return actor.selectionKey || `${actor.sourceDomain || 'actor'}:${actor.sourceObjectId || actor.actorId || ''}`;
  }

  function actionCueForActor(actor = {}, role = 'worker') {
    const actionKind = upper(actor.actionKind || actor.visualState || '');
    const base = ACTION_CUES[role] || ACTION_CUES.worker;
    let cueType = base.cueType;
    let accessory = base.accessory;
    let lane = base.lane;
    let label = base.label;

    if (role === 'builder' && actionKind === 'UPGRADE') {
      cueType = 'upgrade_progress';
      accessory = 'wrench';
      label = 'Upgrade work';
    } else if (role === 'worker' && actionKind === 'SELL') {
      cueType = 'sell_work';
      accessory = 'coin';
      lane = 'selling';
      label = 'Sell work';
    } else if (role === 'messenger') {
      if (actionKind === 'APPROVAL') {
        accessory = 'approval';
        label = 'Approval waiting';
      } else if (actionKind === 'REWARD') {
        accessory = 'reward';
        label = 'Reward ready';
      } else if (actionKind === 'QUEST') {
        accessory = 'quest';
        label = 'Quest update';
      }
    }

    return {
      cueType,
      accessory,
      lane,
      label,
      actionKind,
      progress: clamp(num(actor.progress, 0), 0, 1),
      targetKind: actor.target?.kind || '',
      targetId: actor.target?.id || ''
    };
  }

  function actionAnimationForActor(actor = {}, role = 'worker', index = 0, offset = {}) {
    const base = ACTION_ANIMATIONS[role] || ACTION_ANIMATIONS.worker;
    const phaseSeed = [
      actor.actorId,
      actor.sourceDomain,
      actor.sourceObjectId,
      actor.sourceStateHash,
      role,
      index
    ].filter(Boolean).join(':');
    const offsetDistance = Math.abs(num(offset.x, 0)) + Math.abs(num(offset.y, 0));
    return {
      mode: base.mode,
      tempo: base.tempo,
      phaseSeed,
      hasWalkOffset: offsetDistance > 0.015,
      stepStyle: role === 'hauler' ? 'waddle' : role === 'messenger' ? 'skip' : 'shuffle'
    };
  }

  function sceneObjectForActor(actor = {}, index = 0, buildings = [], waysByTarget = new Map()) {
    const role = String(actor.canonicalRoleId || 'worker').trim();
    const base = targetPosition(actor, buildings);
    const route = actorRoute(actor, role, index, buildings, waysByTarget);
    const offset = ACTOR_OFFSETS[role] || { x: 0, y: 0 };
    const id = role === 'clover' ? 'CLOVER' : String(actor.actorId || `actor:${role}:${index}`);
    const label = role === 'clover'
      ? 'Clover'
      : role.charAt(0).toUpperCase() + role.slice(1);
    return {
      id,
      kind: 'actor',
      actorId: String(actor.actorId || id),
      canonicalRoleId: role,
      generatedOverlayRoleId: actor.generatedOverlayRoleId || null,
      sourceDomain: String(actor.sourceDomain || ''),
      sourceObjectId: String(actor.sourceObjectId || ''),
      sourceStateHash: String(actor.sourceStateHash || ''),
      visualState: String(actor.visualState || 'idle'),
      actionKind: actor.actionKind ? String(actor.actionKind) : '',
      progress: clamp(num(actor.progress, 0), 0, 1),
      label,
      state: String(actor.visualState || 'idle').toUpperCase(),
      x: clamp(route.x + (offset.x * 0.42), 0.06, 0.94),
      y: clamp(route.y + (offset.y * 0.42) + (index % 2) * 0.010, 0.08, 0.92),
      z: base.z + 10 + index,
      scale: role === 'clover' ? 0.85 : 0.64,
      assetSrc: actorAsset(actor),
      assetSprite: actorSpriteSheet(actor),
      selectionKey: selectionKeyForActor(actor),
      drawerKey: drawerKeyForActor(actor),
      testId: `fp-visual-actor-${role}`,
      target: actor.target || null,
      route,
      actionCue: actionCueForActor(actor, role),
      actionAnimation: actionAnimationForActor(actor, role, index, offset),
      visualOnly: true
    };
  }

  function gridCells(pads = [], buildings = [], selectedKey = '') {
    return pads.map((pad) => {
      const building = buildings.find((entry) => num(entry.x) === num(pad.x) && num(entry.y) === num(pad.y));
      return {
        id: `PAD:${pad.x},${pad.y}`,
        x: num(pad.x),
        y: num(pad.y),
        occupied: !!building,
        buildable: !building && pad.locked !== true,
        selectionKey: building ? `building:${building.buildingId}` : `pad:${pad.x},${pad.y}`,
        selected: selectedKey === (building ? `building:${building.buildingId}` : `pad:${pad.x},${pad.y}`)
      };
    });
  }

  function visualWays(buildings = [], actorObjects = []) {
    const seen = new Set();
    const ways = [];
    for (const building of buildings) {
      const way = wayForBuilding(building, buildings);
      if (!way || seen.has(way.wayId)) continue;
      seen.add(way.wayId);
      ways.push(way);
    }

    const hasTownSquareRoute = actorObjects.some((actor) => actor.route?.wayId === 'WAY:HQ:TOWN_SQUARE');
    if (hasTownSquareRoute && !seen.has('WAY:HQ:TOWN_SQUARE')) {
      const from = hqAnchor(buildings);
      ways.push({
        wayId: 'WAY:HQ:TOWN_SQUARE',
        kind: 'way',
        label: 'HQ approach',
        from: { kind: 'building', id: from.id },
        to: { kind: 'town_square', id: 'HQ_APPROACH' },
        points: [
          { x: clamp(from.x - 0.12, 0.06, 0.94), y: clamp(from.y + 0.04, 0.08, 0.92) },
          { x: from.x, y: clamp(from.y + 0.08, 0.08, 0.92) },
          { x: clamp(from.x + 0.12, 0.06, 0.94), y: clamp(from.y + 0.04, 0.08, 0.92) }
        ],
        targetId: from.id,
        selectionKey: 'building:HQ',
        visualOnly: true
      });
    }

    return ways;
  }

  function encounterProjections(actorObjects = []) {
    const groups = new Map();
    for (const actor of actorObjects) {
      const route = actor.route || {};
      const key = route.targetId || actor.target?.id || actor.selectionKey || '';
      if (!key) continue;
      const list = groups.get(key) || [];
      list.push(actor);
      groups.set(key, list);
    }
    const encounters = [];
    for (const [targetId, actors] of groups.entries()) {
      if (actors.length < 2) continue;
      const roles = actors.map((actor) => actor.canonicalRoleId).filter(Boolean);
      const sortedRoles = [...roles].sort();
      const sourceIds = actors.map((actor) => actor.actorId).sort();
      const x = actors.reduce((sum, actor) => sum + num(actor.x, 0.5), 0) / actors.length;
      const y = actors.reduce((sum, actor) => sum + num(actor.y, 0.5), 0) / actors.length;
      encounters.push({
        encounterId: `ENCOUNTER:${targetId}:${sortedRoles.join('+')}`,
        kind: 'encounter',
        targetId,
        actorIds: sourceIds,
        roles,
        cueType: sortedRoles.includes('hauler') ? 'handoff' : 'crossing_greeting',
        label: sortedRoles.includes('hauler') ? 'Handoff moment' : 'Passing moment',
        x: clamp(x, 0.06, 0.94),
        y: clamp(y - 0.03, 0.08, 0.92),
        visualOnly: true
      });
    }
    return encounters.slice(0, 6);
  }

  function createSceneState(bundle = {}, options = {}) {
    const buildings = Array.isArray(bundle.buildings) ? bundle.buildings : [];
    const pads = Array.isArray(bundle.pads) ? bundle.pads : [];
    const visualActors = Array.isArray(bundle.visualActors) ? bundle.visualActors : [];
    const context = { selectedKey: options.selectedKey || '' };
    const seedWays = buildings
      .map((building) => wayForBuilding(building, buildings))
      .filter(Boolean);
    const waysByTarget = new Map(seedWays.map((way) => [way.targetId, way]));
    const actorObjects = visualActors.map((actor, index) => sceneObjectForActor(actor, index, buildings, waysByTarget));
    const ways = visualWays(buildings, actorObjects);
    const encounters = encounterProjections(actorObjects);
    const objects = [
      ...pads.map((pad) => sceneObjectForPad(pad, buildings, context)).filter(Boolean),
      ...buildings.map((building) => sceneObjectForBuilding(building, context)),
      ...actorObjects
    ];
    const actors = objects
      .filter((object) => object.kind === 'actor')
      .map((object) => ({
        actorId: object.actorId,
        id: object.id,
        canonicalRoleId: object.canonicalRoleId,
        generatedOverlayRoleId: object.generatedOverlayRoleId,
        sourceDomain: object.sourceDomain,
        sourceObjectId: object.sourceObjectId,
        sourceStateHash: object.sourceStateHash,
        visualState: object.visualState,
        actionKind: object.actionKind,
        progress: object.progress,
        selectionKey: object.selectionKey,
        drawerKey: object.drawerKey,
        target: object.target,
        route: object.route,
        actionCue: object.actionCue,
        actionAnimation: object.actionAnimation,
        assetSrc: object.assetSrc,
        assetSprite: object.assetSprite,
        visualOnly: true
      }));
    return {
      renderer: 'three.js',
      stateHash: bundle.stateHash || bundle.audit?.stateHash || '',
      stageBackgrounds: {
        desktop: '/experiences/founders-plot/assets/scenes/founders-plot-desktop.webp',
        mobile: '/experiences/founders-plot/assets/scenes/founders-plot-mobile.webp'
      },
      grid: {
        version: 'founders-plot-grid-v1',
        width: 3,
        height: 3,
        cells: gridCells(pads, buildings, context.selectedKey)
      },
      objects,
      actors,
      ways,
      encounters
    };
  }

  return { createSceneState };
});
