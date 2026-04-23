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
    '0,0': { x: 0.13, y: 0.55, z: 16, label: 'Southwest Pad' },
    '1,0': { x: 0.27, y: 0.40, z: 22, label: 'West Pad' },
    '2,0': { x: 0.42, y: 0.28, z: 28, label: 'North Pad' },
    '0,1': { x: 0.86, y: 0.40, z: 22, label: 'Northeast Pad' },
    '2,1': { x: 0.88, y: 0.68, z: 14, label: 'East Pad' },
    '1,2': { x: 0.77, y: 0.90, z: 10, label: 'South Pad' }
  };
  const SPECIAL_OBJECT_LAYOUT = {
    CONTRACT_BOARD: { x: 0.81, y: 0.66, z: 18 },
    PUBLIC_SQUARE: { x: 0.55, y: 0.78, z: 16 },
    FOREMAN_HUT: { x: 0.18, y: 0.90, z: 18 },
    JOURNAL: { x: 0.09, y: 0.86, z: 10 },
    APPROVAL_INBOX: { x: 0.93, y: 0.84, z: 12 }
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
  const BADGE_PRIORITY = {
    approval: 100,
    restart: 96,
    blocked: 92,
    locked: 88,
    ready: 80,
    contract: 76,
    timer: 68,
    construction: 64,
    upgrade: 60,
    build: 56,
    foreman: 52,
    civic: 48,
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

  function selectionKeyToObjectId(selectedKey, view) {
    if (!selectedKey) return '';
    if (selectedKey === 'hq') return 'HQ';
    if (selectedKey.startsWith('building:')) {
      const buildingId = selectedKey.slice('building:'.length);
      const building = Array.isArray(view?.buildings)
        ? view.buildings.find((entry) => String(entry?.buildingId || '') === buildingId)
        : null;
      return building ? String(building.type || buildingId) : buildingId;
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
      return building ? String(building.type || '') : '';
    }
    if (actionType === 'UPGRADE_BUILDING' || actionType === 'UPGRADE_HQ') {
      if (!action.buildingId) return 'HQ';
      const building = Array.isArray(view?.buildings)
        ? view.buildings.find((entry) => String(entry?.buildingId || '') === String(action.buildingId || ''))
        : null;
      return building ? String(building.type || '') : '';
    }
    if (actionType === 'TURN_IN_CONTRACT' || actionType === 'ACCEPT_CONTRACT' || actionType === 'VIEW_CONTRACT_BOARD') {
      return 'CONTRACT_BOARD';
    }
    if (actionType === 'UPGRADE_LANDMARK') {
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
    if (objectId === 'PUBLIC_SQUARE') return { label: 'Inspect square', action: 'drawer:signals' };
    if (objectId === 'FOREMAN_HUT') return { label: 'Talk to Clover', action: 'drawer:foreman' };
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
    const receipt = view?.foreman?.receipt || null;
    const runtimeStatus = upper(runtime.status, 'NOT_STARTED');
    const latestContract = latestCompletedContract(view);
    const celebrationFresh = latestContract && number(latestContract.completedAtMs) > 0
      ? (Date.now() - number(latestContract.completedAtMs)) < 5 * 60 * 1000
      : false;
    const targetObjectId = options?.lastActionTargetObjectId || goalTargetObjectId(view, options?.selectedKey || '');

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
        bubbleText: cleanShortCopy(view?.foreman?.recommendation, 'Checking the safest next step.'),
        targetObjectId,
        actionVerb: 'thinking about'
      };
    }
    if (runtimeStatus === 'BOOTING' || runtimeStatus === 'OBSERVING') {
      return {
        state: 'OBSERVING',
        bubbleText: cleanShortCopy(view?.foreman?.recommendation, 'Watching the plot.'),
        targetObjectId,
        actionVerb: 'watching'
      };
    }
    return {
      state: 'NOT_STARTED',
      bubbleText: 'Clover is ready when you are.',
      targetObjectId,
      actionVerb: 'ready for'
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
      body: cleanShortCopy(goal.body, 'Keep the town moving one clear step at a time.'),
      owner: String(goal.owner || 'tutorial'),
      primaryAction: action,
      primaryCtaLabel: String(goal.primaryCtaLabel || '').trim()
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
    const unseenRecap = number(view?.recap?.unseenCount || 0);

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
        const objectId = String(building.type || building.buildingId || key);
        const primaryAction = objectPrimaryAction(objectId, view, building);
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
          testId: `founders-stage-object-${building.type}`
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
        label: String(layout.label || pad.label || 'Open lot'),
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
        ariaLabel: `${layout.label || pad.label || 'Lot'}, ${stateLabel(state)}, ${primaryAction.label}.`,
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
    const publicSquareState = publicSquareLevel <= 0 && upper(view?.currentGoal?.primaryAction?.type) === 'UPGRADE_LANDMARK'
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
      badges: [
        publicSquareLevel > 0
          ? { type: 'charm', label: 'Square raised', displayLabel: 'Raised', tone: 'good', overlayRole: 'ambient', overlayWeight: 'quiet', showWhenSelected: true }
          : { type: 'civic', label: 'Civic project', displayLabel: 'Civic', tone: 'neutral', overlayRole: 'ambient', overlayWeight: 'quiet', showWhenSelected: true }
      ],
      timer: null,
      primaryAction: squareAction,
      ariaLabel: `Welcome Sign, ${stateLabel(publicSquareState)}, ${squareAction.label}.`,
      drawerKey: 'signals',
      testId: 'founders-stage-object-PUBLIC_SQUARE'
    });

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
    const approvalState = pendingApprovals.length > 0 ? 'READY' : 'IDLE';
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
        pendingApprovals.length > 0
          ? { type: 'approval', label: `${pendingApprovals.length} waiting`, displayLabel: `${pendingApprovals.length}`, tone: 'warn', overlayRole: 'status', overlayWeight: 'strong', alwaysVisible: true }
          : { type: 'civic', label: 'Inbox clear', displayLabel: 'Clear', tone: 'neutral', overlayRole: 'ambient', overlayWeight: 'quiet', showWhenSelected: true }
      ],
      timer: null,
      primaryAction: approvalAction,
      ariaLabel: `Approval Bell, ${stateLabel(approvalState)}, ${approvalAction.label}.`,
      drawerKey: 'approvals',
      testId: 'founders-stage-object-APPROVAL_INBOX'
    });

    const runtimeStatus = upper(view?.foreman?.runtime?.status);
    const foremanObjectState = options?.localForemanRuntimeStatus?.needsRestart || options?.localForemanRuntimeStatus?.expired || runtimeStatus === 'ERROR'
        ? 'BLOCKED'
        : runtimeStatus === 'PAUSED'
          ? 'IDLE'
          : runtimeStatus === 'NOT_STARTED'
            ? 'BUILDABLE'
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

  function createSceneState(view, options = {}) {
    const objects = createWorldObjects(view, options);
    const goal = currentGoal(view);
    const selectedObjectId = selectionKeyToObjectId(String(options.selectedKey || ''), view);
    const goalObjectId = goalTargetObjectId(view, String(options.selectedKey || ''), view);
    const goalObject = objects.find((object) => object.id === goalObjectId) || null;
    const cloverBase = cloverState(view, options);
    const cloverTarget = objects.find((object) => object.id === cloverBase.targetObjectId) || goalObject || null;
    const cloverPosition = cloverTargetPosition(cloverTarget);
    const drawerItems = drawers(view, options);
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
          NOT_STARTED: 'clover_idle_v1_4_2',
          OBSERVING: 'clover_observing_v1_4_2',
        THINKING: 'clover_thinking_v1_4_2',
        ACTING: 'clover_acting_v1_4_2',
        CELEBRATING: 'clover_celebrating_v1_4_2',
        WAITING_FOR_PERMISSION: 'clover_waiting_approval_v1_4_2',
        PAUSED: 'clover_paused_v1_4_2',
        ERROR: 'clover_blocked_v1_4_2',
        RESTART_NEEDED: 'clover_restart_needed_v1_4_2',
      }[cloverBase.state] || 'clover_idle_v1_4_2',
        x: cloverPosition.x,
        y: cloverPosition.y,
        mobileBubblePinned: mobileBubblePinned(cloverBase, { activeDrawer: options.activeDrawer, selectedObjectId, goalObjectId })
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
    badgeLabelRole,
    buildingVisualState,
    cloverState,
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
