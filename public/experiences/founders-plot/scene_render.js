(function attachFoundersPlotSceneRender(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.FoundersPlotSceneRender = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function foundersPlotSceneRenderFactory() {
  function htmlEscape(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function resolveAsset(assetMap, assetId) {
    if (!assetId || !assetMap || typeof assetMap !== 'object') return null;
    return assetMap[assetId] || null;
  }

  function objectClassList(object) {
    const classes = ['at-fp-stage-object', `at-fp-stage-object--${String(object?.state || 'IDLE').toLowerCase().replace(/_/g, '-')}`];
    if (object?.selected) classes.push('at-fp-stage-object--selected');
    if (object?.goalTarget) classes.push('at-fp-stage-object--goal-target');
    if (object?.drawerKey) classes.push('at-fp-stage-object--drawer');
    return classes.join(' ');
  }

  function badgeMarkup(badge) {
    return `
      <span class="at-fp-state-badge at-fp-state-badge--${htmlEscape(String(badge?.tone || 'neutral'))}" data-badge-type="${htmlEscape(badge?.type || '')}">
        ${htmlEscape(badge?.label || '')}
      </span>
    `;
  }

  function timerMarkup(timer) {
    if (!timer) return '';
    const progress = Math.max(0, Math.min(1, Number(timer.progress || 0)));
    return `
      <span class="at-fp-timer-ring" data-testid="founders-timer-ring" style="--fp-progress:${progress};" aria-hidden="true">
        <span class="at-fp-timer-ringInner"></span>
      </span>
    `;
  }

  function imageMarkup(asset, alt) {
    if (!asset?.src) {
      return `<span class="at-fp-objectPlaceholder" aria-hidden="true"></span>`;
    }
    return `<img class="at-fp-objectSprite" src="${htmlEscape(asset.src)}" alt="${htmlEscape(alt)}" loading="eager" decoding="async" />`;
  }

  function cloverStateClass(state) {
    switch (String(state || 'NOT_STARTED').toUpperCase()) {
      case 'OBSERVING':
        return 'observing';
      case 'THINKING':
        return 'thinking';
      case 'ACTING':
        return 'acting';
      case 'WAITING_FOR_PERMISSION':
        return 'waiting-approval';
      case 'PAUSED':
        return 'paused';
      case 'RESTART_NEEDED':
      case 'ERROR':
        return 'restart-needed';
      default:
        return 'idle';
    }
  }

  function renderPlotStage(node, scene, options = {}) {
    if (!(node instanceof HTMLElement) || !scene) return;
    const assetMap = options.assetMap || {};
    node.classList.add('at-fp-stage');
    node.style.setProperty('--fp-stage-desktop', `url('${scene.stageBackgrounds?.desktop || ''}')`);
    node.style.setProperty('--fp-stage-mobile', `url('${scene.stageBackgrounds?.mobile || scene.stageBackgrounds?.desktop || ''}')`);

    const objectsMarkup = (scene.objects || []).map((object) => {
      const asset = resolveAsset(assetMap, object.assetId);
      const badges = Array.isArray(object.badges) ? object.badges : [];
      const style = [
        `--fp-x:${Number(object.x || 0)};`,
        `--fp-y:${Number(object.y || 0)};`,
        `--fp-z:${Number(object.z || 0)};`
      ].join('');
      return `
        <button
          class="${objectClassList(object)}"
          type="button"
          data-scene-object-id="${htmlEscape(object.id)}"
          data-selection-key="${htmlEscape(object.selectionKey || '')}"
          data-drawer-key="${htmlEscape(object.drawerKey || '')}"
          data-testid="${htmlEscape(object.testId || '')}"
          aria-label="${htmlEscape(object.ariaLabel || object.label || object.id)}"
          style="${style}"
        >
          <span class="at-fp-objectShadow" aria-hidden="true"></span>
          ${imageMarkup(asset, object.label || object.id)}
          <span class="at-fp-objectBadges" aria-hidden="true">
            ${badges.map((badge) => badgeMarkup(badge)).join('')}
          </span>
          ${timerMarkup(object.timer)}
          <span class="at-fp-objectLabel">${htmlEscape(object.label || '')}</span>
        </button>
      `;
    }).join('');

    const cloverAsset = resolveAsset(assetMap, scene.clover?.assetId);
    const cloverStyle = [
      `--fp-x:${Number(scene.clover?.x || 0.76)};`,
      `--fp-y:${Number(scene.clover?.y || 0.64)};`
    ].join('');

    node.innerHTML = `
      <div class="at-fp-stageBackdrop" aria-hidden="true">
        <div class="at-fp-stageLight"></div>
        <div class="at-fp-stageRoad"></div>
        <div class="at-fp-stagePatch at-fp-stagePatch--one"></div>
        <div class="at-fp-stagePatch at-fp-stagePatch--two"></div>
        <div class="at-fp-stagePatch at-fp-stagePatch--three"></div>
      </div>
      <div class="at-fp-stageObjects">
        ${objectsMarkup}
        <button
          class="at-fp-clover at-fp-clover--${htmlEscape(cloverStateClass(scene.clover?.state || 'NOT_STARTED'))}"
          type="button"
          data-scene-object-id="CLOVER"
          data-drawer-key="foreman"
          data-testid="founders-clover-avatar"
          aria-label="Clover, ${htmlEscape(String(scene.clover?.state || 'idle').replace(/_/g, ' ').toLowerCase())}. Open Foreman drawer."
          style="${cloverStyle}"
        >
          ${imageMarkup(cloverAsset, 'Clover')}
          <span class="at-fp-cloverBubble" data-testid="founders-clover-bubble">${htmlEscape(scene.clover?.bubbleText || '')}</span>
        </button>
      </div>
      <div class="at-fp-stageCaption" aria-hidden="true">Your frontier plot</div>
    `;
  }

  function renderDrawerTray(node, scene) {
    if (!(node instanceof HTMLElement) || !scene) return;
    const drawers = Array.isArray(scene.drawers) ? scene.drawers : [];
    node.innerHTML = drawers.map((drawer) => `
      <button
        class="foundersTrayButton${drawer.active ? ' is-active' : ''}"
        type="button"
        data-drawer-trigger="${htmlEscape(drawer.key)}"
        aria-label="${htmlEscape(drawer.label)}${drawer.badgeCount ? `, ${drawer.badgeCount} waiting` : ''}"
      >
        <span class="foundersTrayIcon foundersTrayIcon--${htmlEscape(drawer.icon)}" aria-hidden="true"></span>
        <span class="foundersTrayLabel">${htmlEscape(drawer.label)}</span>
        ${drawer.badgeCount ? `<span class="foundersTrayBadge">${htmlEscape(String(drawer.badgeCount))}</span>` : ''}
      </button>
    `).join('');
  }

  return {
    renderDrawerTray,
    renderPlotStage
  };
});
