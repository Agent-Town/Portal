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
    if (object?.attention) classes.push(`at-fp-stage-object--attention-${String(object.attention).toLowerCase()}`);
    if (object?.labelVisible === true) classes.push('at-fp-stage-object--label-pinned');
    if (object?.actionLinked) classes.push('at-fp-stage-object--action-linked');
    if (object?.overlayRole) classes.push(`fp-overlay-${String(object.overlayRole).toLowerCase()}`);
    if (object?.overlayWeight) classes.push(`at-fp-overlayWeight--${String(object.overlayWeight).toLowerCase()}`);
    return classes.join(' ');
  }

  function badgeMarkup(badge) {
    const classes = [
      'at-fp-state-badge',
      'at-fp-overlayPill',
      `at-fp-state-badge--${htmlEscape(String(badge?.tone || 'neutral'))}`,
      `fp-overlay-${htmlEscape(String(badge?.overlayRole || 'status'))}`
    ];
    if (badge?.iconOnly) classes.push('at-fp-state-badge--iconOnly');
    return `
      <span
        class="${classes.join(' ')}"
        data-badge-type="${htmlEscape(badge?.type || '')}"
        data-overlay-role="${htmlEscape(badge?.overlayRole || 'status')}"
        data-overlay-weight="${htmlEscape(badge?.overlayWeight || 'medium')}"
        data-mobile-hidden="${badge?.mobileHidden ? 'true' : 'false'}"
        data-icon-only="${badge?.iconOnly ? 'true' : 'false'}"
      >
        <span class="at-fp-state-badgeGlyph" aria-hidden="true"></span>
        <span class="at-fp-state-badgeText">${htmlEscape(badge?.displayLabel || badge?.label || '')}</span>
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
      case 'CELEBRATING':
        return 'celebrating';
      case 'WAITING_FOR_PERMISSION':
        return 'waiting-approval';
      case 'ERROR':
        return 'blocked';
      case 'PAUSED':
        return 'paused';
      case 'RESTART_NEEDED':
        return 'restart-needed';
      default:
        return 'idle';
    }
  }

  function cloverAriaLabel(scene) {
    const state = String(scene?.clover?.state || 'NOT_STARTED').toUpperCase();
    const actionVerb = String(scene?.clover?.actionVerb || 'watching').trim();
    const targetLabel = String(scene?.clover?.targetLabel || 'the plot').trim();
    if (state === 'ACTING') {
      return `Clover is ${actionVerb} ${targetLabel}. Open the Foreman drawer.`;
    }
    if (state === 'CELEBRATING') {
      return `Clover is celebrating at ${targetLabel}. Open the Foreman drawer.`;
    }
    if (state === 'WAITING_FOR_PERMISSION') {
      return `Clover is waiting on ${targetLabel}. Open the Foreman drawer.`;
    }
    if (state === 'ERROR') {
      return 'Clover is blocked and needs help. Open the Foreman drawer.';
    }
    if (state === 'RESTART_NEEDED') {
      return 'Clover needs a fresh start. Open the Foreman drawer.';
    }
    return `Clover is ${actionVerb} ${targetLabel}. Open the Foreman drawer.`;
  }

  function cloverTargetLink(scene) {
    const clover = scene?.clover || null;
    const target = Array.isArray(scene?.objects)
      ? scene.objects.find((object) => object.id === clover?.targetObjectId)
      : null;
    if (!clover || !target || String(clover.state || '').toUpperCase() !== 'ACTING') return '';
    const reducedMotion = typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dx = Number(target.x || 0) - Number(clover.x || 0);
    const dy = Number(target.y || 0) - Number(clover.y || 0);
    const length = Math.max(0.04, Math.sqrt((dx * dx) + (dy * dy)));
    const angle = Math.atan2(dy, dx);
    const linkStyle = [
      `left:${Number(clover.x || 0.76) * 100}%;`,
      `top:${Number(clover.y || 0.64) * 100}%;`,
      `width:${length * 100}%;`,
      `transform:translateY(-50%) rotate(${angle}rad);`
    ].join('');
    return `
      <div
        class="at-fp-cloverTargetLink"
        data-testid="clover-target-link"
        data-target-object-id="${htmlEscape(target.id || '')}"
        data-reduced-motion="${reducedMotion ? 'true' : 'false'}"
        aria-hidden="true"
        style="${linkStyle}"
      >
        <span class="at-fp-cloverTargetLinkBeam"></span>
      </div>
    `;
  }

  function cloverBubblePersistent(state) {
    return [
      'ACTING',
      'CELEBRATING',
      'WAITING_FOR_PERMISSION',
      'ERROR',
      'RESTART_NEEDED'
    ].includes(String(state || '').toUpperCase());
  }

  function hqAccentMarkup(object) {
    if (String(object?.worldObjectId || '') !== 'hq') return '';
    const tier = String(object?.visualTier || '').toLowerCase();
    if (!tier) return '';
    return `
      <span
        class="at-fp-hqCivicAccent at-fp-hqCivicAccent--${htmlEscape(tier)}"
        data-visual-tier="${htmlEscape(tier)}"
        aria-hidden="true"
      >
        <span class="at-fp-hqCivicAccentCore"></span>
      </span>
    `;
  }

  function renderPlotStage(node, scene, options = {}) {
    if (!(node instanceof HTMLElement) || !scene) return;
    const assetMap = options.assetMap || {};
    node.classList.add('at-fp-stage');
    node.style.setProperty('--fp-stage-desktop', `url('${scene.stageBackgrounds?.desktop || ''}')`);
    node.style.setProperty('--fp-stage-mobile', `url('${scene.stageBackgrounds?.mobile || scene.stageBackgrounds?.desktop || ''}')`);
    node.dataset.layerRole = 'scene-base';
    node.dataset.sceneAssetId = String(scene.stageBackgrounds?.desktopAssetId || '');
    node.dataset.sceneLayering = String(scene.stageBackgrounds?.layerMode || 'layered_plates');

    const objectsMarkup = (scene.objects || []).map((object) => {
      const asset = resolveAsset(assetMap, object.assetId);
      const badges = Array.isArray(object.badges) ? object.badges : [];
      const actionLinked = String(scene?.clover?.state || '').toUpperCase() === 'ACTING'
        && String(scene?.clover?.targetObjectId || '') === String(object.id || '');
      const objectClasses = objectClassList({ ...object, actionLinked });
      const style = [
        `--fp-x:${Number(object.x || 0)};`,
        `--fp-y:${Number(object.y || 0)};`,
        `--fp-z:${Number(object.z || 0)};`
      ].join('');
      return `
        <button
          class="${objectClasses}"
          type="button"
          data-scene-object-id="${htmlEscape(object.id)}"
          data-selection-key="${htmlEscape(object.selectionKey || '')}"
          data-drawer-key="${htmlEscape(object.drawerKey || '')}"
          data-testid="${htmlEscape(object.testId || '')}"
          data-attention="${htmlEscape(object.attention || 'none')}"
          data-layer-role="live-object"
          data-world-object="${htmlEscape(object.worldObjectId || '')}"
          data-overlay-role="${htmlEscape(object.overlayRole || 'ambient')}"
          data-overlay-weight="${htmlEscape(object.overlayWeight || 'quiet')}"
          data-asset-id="${htmlEscape(object.assetId || '')}"
          data-visual-tier="${htmlEscape(object.visualTier || '')}"
          data-hq-level="${htmlEscape(object.hqLevel || '')}"
          data-action-linked="${actionLinked ? 'true' : 'false'}"
          data-clover-linked="${actionLinked ? 'true' : 'false'}"
          aria-label="${htmlEscape(object.ariaLabel || object.label || object.id)}"
          style="${style}"
        >
          <span class="at-fp-objectShadow" aria-hidden="true"></span>
          ${imageMarkup(asset, object.label || object.id)}
          ${hqAccentMarkup(object)}
          <span class="at-fp-objectBadges" aria-hidden="true">
            ${badges.map((badge) => badgeMarkup(badge)).join('')}
          </span>
          ${timerMarkup(object.timer)}
          <span
            class="at-fp-objectLabel fp-overlay-${htmlEscape(object.overlayRole || 'ambient')}"
            data-overlay-role="${htmlEscape(object.overlayRole || 'ambient')}"
            data-overlay-weight="${htmlEscape(object.overlayWeight || 'quiet')}"
          >${htmlEscape(object.label || '')}</span>
        </button>
      `;
    }).join('');

    const cloverAsset = resolveAsset(assetMap, scene.clover?.assetId);
    const cloverStyle = [
      `--fp-x:${Number(scene.clover?.x || 0.76)};`,
      `--fp-y:${Number(scene.clover?.y || 0.64)};`
    ].join('');

    node.innerHTML = `
      <div
        class="at-fp-stageBackdrop"
        data-layer-role="scene-base"
        data-scene-asset-id="${htmlEscape(scene.stageBackgrounds?.desktopAssetId || '')}"
        aria-hidden="true"
      >
        <div class="at-fp-stageLight"></div>
        <div class="at-fp-stageRoad"></div>
        <div class="at-fp-stagePatch at-fp-stagePatch--one"></div>
        <div class="at-fp-stagePatch at-fp-stagePatch--two"></div>
        <div class="at-fp-stagePatch at-fp-stagePatch--three"></div>
      </div>
      <div class="at-fp-stageObjects" data-layer-role="live-object">
        ${objectsMarkup}
        ${cloverTargetLink(scene)}
        <div
          class="at-fp-cloverWrap is-grounded"
          data-testid="clover-foreman"
          data-layer-role="character"
          data-state="${htmlEscape(cloverStateClass(scene.clover?.state || 'NOT_STARTED'))}"
          data-target-object-id="${htmlEscape(scene.clover?.targetObjectId || '')}"
          data-grounded="true"
          aria-label="${htmlEscape(cloverAriaLabel(scene))}"
          style="${cloverStyle}"
        >
          <span class="at-fp-cloverGroundShadow" aria-hidden="true"></span>
          <button
            class="at-fp-clover at-fp-clover--${htmlEscape(cloverStateClass(scene.clover?.state || 'NOT_STARTED'))}"
            type="button"
            data-scene-object-id="CLOVER"
            data-drawer-key="foreman"
            data-testid="founders-clover-avatar"
            data-layer-role="character"
            data-world-object="clover"
            data-overlay-role="primary-action"
            data-overlay-weight="${htmlEscape(String(scene?.clover?.state || '').toUpperCase() === 'ACTING' ? 'strong' : 'medium')}"
            data-asset-id="${htmlEscape(scene.clover?.assetId || '')}"
            data-target-object-id="${htmlEscape(scene.clover?.targetObjectId || '')}"
            aria-label="${htmlEscape(cloverAriaLabel(scene))}"
          >
            ${imageMarkup(cloverAsset, 'Clover')}
            <span class="at-fp-cloverBubble${cloverBubblePersistent(scene.clover?.state) ? ' at-fp-cloverBubble--persistent' : ''}" data-testid="founders-clover-bubble">${htmlEscape(scene.clover?.bubbleText || '')}</span>
          </button>
        </div>
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
