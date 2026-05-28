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
    if (role !== 'clover') return '';
    const state = String(actor.visualState || '').trim().replace(/_/g, '-');
    const allowed = ['acting', 'blocked', 'celebrating', 'idle', 'observing', 'paused', 'thinking', 'waiting-approval'];
    const fileState = allowed.includes(state) ? state : 'observing';
    return `/experiences/founders-plot/assets/characters/clover-${fileState}.webp`;
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

  function sceneObjectForActor(actor = {}, index = 0, buildings = []) {
    const role = String(actor.canonicalRoleId || 'worker').trim();
    const base = targetPosition(actor, buildings);
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
      x: clamp(base.x + offset.x, 0.06, 0.94),
      y: clamp(base.y + offset.y + (index % 2) * 0.015, 0.08, 0.92),
      z: base.z + 10 + index,
      scale: role === 'clover' ? 0.85 : 0.64,
      assetSrc: actorAsset(actor),
      selectionKey: selectionKeyForActor(actor),
      drawerKey: drawerKeyForActor(actor),
      testId: `fp-visual-actor-${role}`,
      target: actor.target || null,
      actionCue: actionCueForActor(actor, role),
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

  function createSceneState(bundle = {}, options = {}) {
    const buildings = Array.isArray(bundle.buildings) ? bundle.buildings : [];
    const pads = Array.isArray(bundle.pads) ? bundle.pads : [];
    const visualActors = Array.isArray(bundle.visualActors) ? bundle.visualActors : [];
    const context = { selectedKey: options.selectedKey || '' };
    const objects = [
      ...pads.map((pad) => sceneObjectForPad(pad, buildings, context)).filter(Boolean),
      ...buildings.map((building) => sceneObjectForBuilding(building, context)),
      ...visualActors.map((actor, index) => sceneObjectForActor(actor, index, buildings))
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
        actionCue: object.actionCue,
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
      actors
    };
  }

  return { createSceneState };
});
