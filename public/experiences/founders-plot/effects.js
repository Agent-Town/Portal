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

  function prefersReducedMotion() {
    return typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

  function createEffectsController() {
    let lastInventory = null;
    let lastReceiptId = '';

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

    function sync(args = {}) {
      const layerNode = args.layerNode;
      const stageNode = args.stageNode;
      const nextState = args.nextState || null;
      const scene = args.scene || null;
      const nextInventory = inventorySnapshot(nextState);
      const previous = lastInventory;

      if (previous && layerNode instanceof HTMLElement) {
        ['wood', 'stone', 'food', 'coin'].forEach((key) => {
          const delta = nextInventory[key] - previous[key];
          if (delta <= 0) return;
          const fromRect = scene?.clover?.targetObjectId
            ? stageNode?.querySelector?.(`[data-scene-object-id="${CSS.escape(String(scene.clover.targetObjectId))}"]`)?.getBoundingClientRect?.()
            : stageNode?.getBoundingClientRect?.();
          const toRect = document.querySelector(`[data-testid="inventory-${key}"]`)?.getBoundingClientRect?.();
          emitFlyout(layerNode, `+${delta} ${key}`, fromRect, toRect);
        });
      }

      const receiptId = String(nextState?.foreman?.receipt?.receiptId || '');
      if (receiptId && receiptId !== lastReceiptId) {
        highlightObject(stageNode, scene?.clover?.targetObjectId || scene?.currentGoal?.targetObjectId || '');
      }

      lastInventory = nextInventory;
      lastReceiptId = receiptId;
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
