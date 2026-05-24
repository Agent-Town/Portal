(function attachFoundersPlotEffects(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.FoundersPlotEffects = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function foundersPlotEffectsFactory() {
  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function clampValue(value, min, max) {
    if (max < min) return (min + max) / 2;
    return Math.max(min, Math.min(max, value));
  }

  function prefersReducedMotion() {
    return typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }

  function inventorySnapshot(state) {
    const inventory = state?.plot?.inventory || {};
    return {
      wood: number(inventory.wood),
      stone: number(inventory.stone),
      food: number(inventory.food),
      coin: number(inventory.coin),
      townXp: number(state?.plot?.townXp)
    };
  }

  function labelForBuilding(type) {
    const normalized = String(type || 'Building').replace(/_/g, ' ').toLowerCase();
    return normalized.replace(/\b\w/g, (match) => match.toUpperCase());
  }

  function objectIdForBuilding(building = {}) {
    const type = String(building?.type || '');
    if (type === 'HQ') return 'HQ';
    return type || String(building?.buildingId || '');
  }

  function buildingSnapshot(state) {
    const out = new Map();
    for (const building of Array.isArray(state?.buildings) ? state.buildings : []) {
      const id = String(building?.buildingId || building?.type || '');
      if (!id) continue;
      out.set(id, {
        id,
        type: String(building?.type || ''),
        state: String(building?.state || ''),
        level: number(building?.level || 1),
        runningJobId: String(building?.runningJob?.jobId || ''),
        completedCount: Array.isArray(building?.completedJobs) ? building.completedJobs.length : 0
      });
    }
    return out;
  }

  function opportunitySnapshot(state) {
    const active = state?.townOpportunity?.active || null;
    const completed = Array.isArray(state?.townOpportunity?.completed) ? state.townOpportunity.completed : [];
    const latest = completed[completed.length - 1] || null;
    return {
      activeId: String(active?.opportunityId || ''),
      activeTitle: String(active?.title || ''),
      completedCount: completed.length,
      latestTitle: String(latest?.title || ''),
      latestOptionId: String(latest?.optionId || '')
    };
  }

  function stateSummary(state) {
    return {
      inventory: inventorySnapshot(state),
      hqLevel: number(state?.plot?.hqLevel || 1),
      currentGoalTitle: String(state?.currentGoal?.title || state?.quest?.title || ''),
      buildings: buildingSnapshot(state),
      opportunity: opportunitySnapshot(state)
    };
  }

  function createEffectsController() {
    let lastInventory = null;
    let lastReceiptId = '';
    let lastSummary = null;
    const emittedFeedbackKeys = new Set();

    function emitFlyout(layerNode, label, fromRect, toRect) {
      if (!(layerNode instanceof HTMLElement)) return;
      const chip = document.createElement('span');
      chip.className = 'at-fp-resource-flyout';
      chip.textContent = label;
      const startX = fromRect ? fromRect.left + (fromRect.width / 2) : window.innerWidth / 2;
      const startY = fromRect ? fromRect.top + (fromRect.height / 2) : window.innerHeight / 2;
      const endX = toRect ? toRect.left + (toRect.width / 2) : startX;
      const endY = toRect ? toRect.top + (toRect.height / 2) : startY - 60;
      chip.style.left = `${startX}px`;
      chip.style.top = `${startY}px`;
      chip.style.setProperty('--fp-flyout-x', `${Math.round(endX - startX)}px`);
      chip.style.setProperty('--fp-flyout-y', `${Math.round(endY - startY)}px`);
      layerNode.appendChild(chip);
      const remove = () => chip.remove();
      if (prefersReducedMotion()) {
        setTimeout(remove, 420);
        return;
      }
      chip.addEventListener('animationend', remove, { once: true });
    }

    function emitSceneFeedback(layerNode, stageNode, event) {
      if (!(layerNode instanceof HTMLElement) || !event?.label) return;
      const key = String(event.key || event.label || '');
      if (key && emittedFeedbackKeys.has(key)) return;
      if (key) emittedFeedbackKeys.add(key);
      const anchor = event.objectId
        ? stageNode?.querySelector?.(`[data-scene-object-id="${CSS.escape(String(event.objectId))}"]`)
        : null;
      const layerRect = layerNode.getBoundingClientRect();
      const anchorRect = anchor?.getBoundingClientRect?.();
      const rawX = anchorRect ? anchorRect.left + (anchorRect.width / 2) - layerRect.left : layerRect.width / 2;
      const rawY = anchorRect ? anchorRect.top + (anchorRect.height / 2) - layerRect.top : layerRect.height / 2;
      const feedbackWidth = Math.min(340, Math.max(180, layerRect.width - 24));
      const safeX = layerRect.width > 0
        ? clampValue(rawX, (feedbackWidth / 2) + 12, layerRect.width - (feedbackWidth / 2) - 12)
        : rawX;
      const safeY = layerRect.height > 0
        ? clampValue(rawY, 80, layerRect.height - 18)
        : rawY;
      const toast = document.createElement('div');
      toast.className = 'at-fp-scene-feedback';
      toast.dataset.testid = 'founders-scene-feedback';
      toast.setAttribute('data-testid', 'founders-scene-feedback');
      toast.setAttribute('data-feedback-tone', String(event.tone || 'neutral'));
      toast.setAttribute('data-feedback-key', key);
      toast.style.setProperty('--fp-feedback-left', `${Math.round(safeX)}px`);
      toast.style.setProperty('--fp-feedback-top', `${Math.round(safeY)}px`);
      toast.innerHTML = `
        <strong>${escapeHtml(event.label)}</strong>
        ${event.detail ? `<span>${escapeHtml(event.detail)}</span>` : ''}
      `;
      layerNode.querySelectorAll('.at-fp-scene-feedback').forEach((node) => node.remove());
      layerNode.appendChild(toast);
      setTimeout(() => toast.remove(), prefersReducedMotion() ? 1900 : 3200);
    }

    function highlightObject(stageNode, objectId) {
      if (!(stageNode instanceof HTMLElement) || !objectId) return;
      const node = stageNode.querySelector(`[data-scene-object-id="${CSS.escape(String(objectId))}"]`);
      if (!(node instanceof HTMLElement)) return;
      node.classList.remove('is-action-highlight');
      void node.offsetWidth;
      node.classList.add('is-action-highlight');
      setTimeout(() => {
        node.classList.remove('is-action-highlight');
      }, prefersReducedMotion() ? 160 : 1100);
    }

    function feedbackEvents(previous, next) {
      if (!previous || !next) return [];
      const events = [];
      const buildingEvents = [];
      if (next.hqLevel > previous.hqLevel) {
        events.push({
          key: `hq:${next.hqLevel}`,
          label: `Headquarters level ${next.hqLevel}`,
          detail: 'New town options unlocked',
          objectId: 'HQ',
          tone: 'unlock'
        });
      }
      if (next.opportunity.completedCount > previous.opportunity.completedCount) {
        events.push({
          key: `opportunity:completed:${next.opportunity.completedCount}:${next.opportunity.latestOptionId}`,
          label: next.opportunity.latestTitle || 'Town choice resolved',
          detail: 'Public Square changed',
          objectId: 'PUBLIC_SQUARE',
          tone: 'choice'
        });
      }
      for (const [id, building] of next.buildings.entries()) {
        const before = previous.buildings.get(id);
        const label = labelForBuilding(building.type);
        const objectId = objectIdForBuilding(building);
        if (!before && building.type !== 'HQ') {
          buildingEvents.push({
            key: `building:new:${id}`,
            label: `${label} started`,
            detail: 'New plot work is underway',
            objectId,
            tone: 'build'
          });
          continue;
        }
        if (!before) continue;
        if (building.level > before.level) {
          buildingEvents.push({
            key: `building:level:${id}:${building.level}`,
            label: `${label} level ${building.level}`,
            detail: 'Upgrade complete',
            objectId,
            tone: 'unlock'
          });
        }
        if (building.runningJobId && building.runningJobId !== before.runningJobId) {
          buildingEvents.push({
            key: `building:job:${id}:${building.runningJobId}`,
            label: `${label} is working`,
            detail: 'Production queued',
            objectId,
            tone: 'work'
          });
        }
        if (building.completedCount > before.completedCount || (before.state === 'PRODUCING' && building.state === 'OUTPUT_READY')) {
          buildingEvents.push({
            key: `building:ready:${id}:${building.completedCount}:${building.state}`,
            label: `${label} output ready`,
            detail: 'Collect from the scene',
            objectId,
            tone: 'ready'
          });
        }
        if (before.state === 'OUTPUT_READY' && building.state === 'READY' && building.completedCount === 0) {
          buildingEvents.push({
            key: `building:collect:${id}:${next.inventory.wood}:${next.inventory.food}:${next.inventory.stone}:${next.inventory.coin}`,
            label: `Collected ${label}`,
            detail: next.opportunity.activeId && next.opportunity.activeId !== previous.opportunity.activeId
              ? 'Stores updated; town choice unlocked'
              : 'Stores updated',
            objectId,
            tone: 'collect'
          });
        }
      }
      events.push(...buildingEvents);
      if (next.opportunity.activeId && next.opportunity.activeId !== previous.opportunity.activeId) {
        events.push({
          key: `opportunity:active:${next.opportunity.activeId}`,
          label: next.opportunity.activeTitle || 'Town choice waiting',
          detail: 'Choose at the Public Square',
          objectId: 'PUBLIC_SQUARE',
          tone: 'choice'
        });
      }
      return events;
    }

    function sync(args = {}) {
      const layerNode = args.layerNode;
      const stageNode = args.stageNode;
      const nextState = args.nextState || null;
      const scene = args.scene || null;
      const nextInventory = inventorySnapshot(nextState);
      const previous = lastInventory;
      const nextSummary = stateSummary(nextState);
      const previousSummary = lastSummary;

      if (previous && layerNode instanceof HTMLElement) {
        ['wood', 'stone', 'food', 'coin', 'townXp'].forEach((key) => {
          const delta = nextInventory[key] - previous[key];
          if (delta <= 0) return;
          const fromRect = scene?.clover?.targetObjectId
            ? stageNode?.querySelector?.(`[data-scene-object-id="${CSS.escape(String(scene.clover.targetObjectId))}"]`)?.getBoundingClientRect?.()
            : stageNode?.getBoundingClientRect?.();
          const targetKey = key === 'townXp' ? 'xp' : key;
          const label = key === 'townXp' ? 'Town XP' : key;
          const toRect = document.querySelector(`[data-testid="inventory-${targetKey}"]`)?.getBoundingClientRect?.();
          emitFlyout(layerNode, `+${delta} ${label}`, fromRect, toRect);
        });
      }

      const nextFeedback = feedbackEvents(previousSummary, nextSummary)[0] || null;
      if (nextFeedback) {
        emitSceneFeedback(layerNode, stageNode, nextFeedback);
        highlightObject(stageNode, nextFeedback.objectId);
      }

      const receiptId = String(nextState?.foreman?.receipt?.receiptId || '');
      if (receiptId && receiptId !== lastReceiptId) {
        highlightObject(stageNode, scene?.clover?.targetObjectId || scene?.currentGoal?.targetObjectId || '');
      }

      lastInventory = nextInventory;
      lastReceiptId = receiptId;
      lastSummary = nextSummary;
    }

    return {
      sync
    };
  }

  return {
    createEffectsController,
    inventorySnapshot,
    prefersReducedMotion
  };
});
