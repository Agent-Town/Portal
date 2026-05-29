(function () {
  'use strict';

  function initialStrategyKey() {
    try {
      const params = new URLSearchParams(window.location.search || '');
      const raw = params.get('strategyKey') || 'rush-hq3';
      return String(raw).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-') || 'rush-hq3';
    } catch (_) {
      return 'rush-hq3';
    }
  }

  const state = {
    atlas: null,
    draft: null,
    selectedStrategyId: null,
    activeStrategyKey: initialStrategyKey()
  };

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function testId(value) {
    return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  function tone(value) {
    return String(value || 'neutral').replace(/[^a-zA-Z0-9_-]/g, '');
  }

  function assetPath(value) {
    const path = String(value || '');
    const allowed = path.startsWith('/assets/icons/agent-town/');
    return allowed && !path.includes('..') ? path : '';
  }

  function strategyTitle(strategy) {
    return strategy?.title || strategy?.strategyKey || 'Strategy';
  }

  function strategyOptionForKey(strategyKey) {
    const key = String(strategyKey || state.activeStrategyKey || 'rush-hq3');
    const options = Array.isArray(state.atlas?.strategyOptions) ? state.atlas.strategyOptions : [];
    return options.find((strategy) => strategy.strategyKey === key) || state.atlas?.recommendedStrategy || null;
  }

  function compactList(items, fallback = 'None') {
    const list = Array.isArray(items)
      ? items.map((item) => String(item || '').trim()).filter(Boolean)
      : [];
    return list.length ? list.join(', ') : fallback;
  }

  function shortfallsText(shortfalls) {
    const entries = Object.entries(shortfalls && typeof shortfalls === 'object' ? shortfalls : {})
      .filter(([, amount]) => Number(amount || 0) > 0);
    if (!entries.length) return 'none from current state';
    return entries.map(([key, amount]) => `${key} ${amount}`).join(', ');
  }

  function globalIcon(iconId, overrides = {}) {
    const registry = window.AgentTownIcons;
    if (registry && typeof registry.get === 'function') return registry.get(iconId, overrides);
    return {
      iconId,
      label: overrides.label || 'Agent Town icon',
      symbol: overrides.symbol || '?',
      tone: overrides.tone || 'neutral',
      source: overrides.source || iconId,
      assetPath: overrides.assetPath || null
    };
  }

  function iconHtml(icon, className = 'atlasIcon') {
    const safeIcon = icon && typeof icon === 'object' ? icon : {};
    const symbol = String(safeIcon.symbol || '?').slice(0, 3);
    const label = safeIcon.label || 'Progression icon';
    const src = assetPath(safeIcon.assetPath);
    const image = src
      ? `<img class="atlasIconImage" src="${escapeHtml(src)}" alt="" loading="lazy" decoding="async">`
      : '';
    const fallback = `<span class="atlasIconFallback">${escapeHtml(symbol)}</span>`;
    return `<span class="${className}${src ? ' withImage' : ''} tone-${escapeHtml(tone(safeIcon.tone))}" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}">${image}${fallback}</span>`;
  }

  function markReadyImages(root = document) {
    root.querySelectorAll('.withImage .atlasIconImage').forEach((img) => {
      const wrap = img.closest('.withImage');
      if (!wrap) return;
      const markReady = () => wrap.classList.add('isImageReady');
      const markFailed = () => {
        wrap.classList.remove('withImage');
        wrap.classList.remove('isImageReady');
        img.remove();
      };
      if (img.complete) {
        if (img.naturalWidth > 0) markReady();
        else markFailed();
        return;
      }
      img.addEventListener('load', markReady, { once: true });
      img.addEventListener('error', markFailed, { once: true });
    });
  }

  async function fetchJson(url, options = {}) {
    const res = await fetch(url, {
      credentials: 'include',
      headers: { 'content-type': 'application/json', ...(options.headers || {}) },
      ...options
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      const message = data?.error?.message || data?.error || `HTTP_${res.status}`;
      throw new Error(String(message));
    }
    return data;
  }

  function requirementHtml(requirements) {
    const items = Array.isArray(requirements?.items) ? requirements.items : [];
    if (!items.length) return '';
    const chips = items.map((item) => {
      const label = item.kind === 'hq'
        ? `HQ ${item.have}/${item.required}`
        : `${item.resource}: ${item.have}/${item.required}`;
      const suffix = Number(item.missing || 0) > 0 ? ` need ${item.missing}` : '';
      const classes = `atlasRequirement${Number(item.missing || 0) > 0 ? ' missing' : ''}`;
      return `<span class="${classes}">${escapeHtml(label + suffix)}</span>`;
    }).join('');
    return `<div class="atlasRequirementList">${chips}</div>`;
  }

  function tierForStep(index) {
    if (index <= 3) return { label: 'Tier 1', name: 'Foundation', start: 0 };
    if (index <= 6) return { label: 'Tier 2', name: 'Stoneworks', start: 4 };
    return { label: 'Tier 3', name: 'Foreman', start: 7 };
  }

  function renderSummary() {
    const summary = state.atlas?.summary;
    const node = $('atlasSummary');
    if (!node) return;
    if (!summary) {
      node.textContent = 'Progression state unavailable.';
      return;
    }
    const inventory = summary.inventory || {};
    node.innerHTML = [
      `<span class="atlasPill atlasPillIcon">${iconHtml(globalIcon('building.hq'), 'atlasMiniIcon')}HQ ${escapeHtml(summary.hqLevel || 1)}</span>`,
      `<span class="atlasPill atlasPillIcon">${iconHtml(globalIcon('resource.xp'), 'atlasMiniIcon')}XP ${escapeHtml(summary.townXp || 0)}</span>`,
      `<span class="atlasPill atlasPillIcon">${iconHtml(globalIcon('resource.wood'), 'atlasMiniIcon')}wood ${escapeHtml(inventory.wood || 0)}</span>`,
      `<span class="atlasPill atlasPillIcon">${iconHtml(globalIcon('resource.food'), 'atlasMiniIcon')}food ${escapeHtml(inventory.food || 0)}</span>`,
      `<span class="atlasPill atlasPillIcon">${iconHtml(globalIcon('resource.stone'), 'atlasMiniIcon')}stone ${escapeHtml(inventory.stone || 0)}</span>`,
      `<span class="atlasPill atlasPillIcon">${iconHtml(globalIcon('resource.coin'), 'atlasMiniIcon')}coin ${escapeHtml(inventory.coin || 0)}</span>`,
      `<span class="atlasPill">${escapeHtml(summary.currentNextAction || 'Review plan')}</span>`
    ].join('');
  }

  function renderTemplateControls() {
    document.querySelectorAll('.atlasDraftStrategyBtn').forEach((button) => {
      const key = button.getAttribute('data-strategy-key') || 'rush-hq3';
      button.classList.toggle('isActive', key === state.activeStrategyKey);
    });
  }

  function renderStrategyCompare() {
    const node = $('strategyCompare');
    if (!node) return;
    const strategies = Array.isArray(state.atlas?.strategyOptions) ? state.atlas.strategyOptions : [];
    if (!strategies.length) {
      node.innerHTML = '<p class="atlasEmpty">Strategy variants unavailable.</p>';
      return;
    }
    node.innerHTML = strategies.map((strategy) => {
      const compare = strategy.compare || {};
      const selected = strategy.strategyKey === state.activeStrategyKey;
      return `
        <article class="atlasCompareCard${selected ? ' isActive' : ''}" data-testid="progression-atlas-compare-${escapeHtml(testId(strategy.strategyKey))}">
          <div class="atlasCompareHead">
            <h3>${escapeHtml(strategyTitle(strategy))}</h3>
            <button class="atlasLinkButton atlasDraftStrategyBtn" type="button" data-strategy-key="${escapeHtml(strategy.strategyKey)}">Draft</button>
          </div>
          <dl class="atlasCompareList">
            <div><dt>Goal</dt><dd>${escapeHtml(compare.goal || strategy.goal || '')}</dd></div>
            <div><dt>Steps</dt><dd>${escapeHtml(compare.stepCount || (Array.isArray(strategy.steps) ? strategy.steps.length : 0))}</dd></div>
            <div><dt>Focus</dt><dd>${escapeHtml(compactList(compare.focus || strategy.focus))}</dd></div>
            <div><dt>Blockers</dt><dd>${escapeHtml(compactList(compare.roughBlockers))}</dd></div>
            <div><dt>Shortfalls</dt><dd>${escapeHtml(shortfallsText(compare.resourceShortfalls))}</dd></div>
            <div><dt>Permissions</dt><dd>${escapeHtml(compactList(compare.permissions, 'manual only'))}</dd></div>
            <div><dt>Tradeoff</dt><dd>${escapeHtml(compare.tradeoff || strategy.summary || '')}</dd></div>
            <div><dt>Burden</dt><dd>${escapeHtml(compare.approvalDelegationBurden || '')}</dd></div>
          </dl>
        </article>
      `;
    }).join('');
  }

  function renderTree(steps) {
    if (!steps.length) return '';
    const items = steps.map((step, index) => {
      const status = String(step.status || 'blocked');
      const tier = tierForStep(index);
      const tierBadge = tier.start === index
        ? `<div class="atlasResearchTierBadge"><span>${escapeHtml(tier.label)}</span><strong>${escapeHtml(tier.name)}</strong></div>`
        : '<div class="atlasResearchTierSpacer" aria-hidden="true"></div>';
      return `
        <li class="atlasResearchNode status-${escapeHtml(status)}${tier.start === index ? ' isTierStart' : ''}" data-testid="progression-atlas-tree-node-${escapeHtml(testId(step.stepId))}">
          ${tierBadge}
          <button class="atlasResearchTile atlasExplainBtn" type="button" data-node-id="${escapeHtml(step.nodeId)}" aria-label="${escapeHtml(step.title || 'Progression node')}">
            <span class="atlasResearchTileFrame">
              ${iconHtml(step.icon, 'atlasTreeIcon')}
            </span>
            <span class="atlasResearchIndex">${escapeHtml(index + 1)}</span>
          </button>
          <div class="atlasResearchBody">
            <h4>${escapeHtml(step.title || 'Progression step')}</h4>
            <p>${escapeHtml(step.nextAction || step.blocker || step.reason || '')}</p>
          </div>
        </li>
      `;
    }).join('');
    return `
      <section class="atlasTree atlasResearchBoard" data-testid="progression-atlas-tree" aria-label="Progression tree">
        <div class="atlasTreeHeader">
          <h3>Research Map</h3>
          <span class="atlasTag">tiered</span>
        </div>
        <div class="atlasResearchViewport">
          <ol class="atlasResearchMap" style="grid-template-columns: repeat(${Math.max(1, steps.length)}, minmax(100px, 1fr));">${items}</ol>
        </div>
      </section>
    `;
  }

  function renderStep(step) {
    const status = String(step.status || 'blocked');
    const explanationButton = `<button class="atlasLinkButton atlasExplainBtn" type="button" data-node-id="${escapeHtml(step.nodeId)}">Explain</button>`;
    return `
      <article class="atlasStep" data-testid="progression-atlas-step-${escapeHtml(testId(step.stepId))}">
        <div class="atlasStepHead">
          <div class="atlasStepTitle">
            ${iconHtml(step.icon)}
            <h3>${escapeHtml(step.title)}</h3>
          </div>
          <span class="atlasStatus ${escapeHtml(status)}">${escapeHtml(status)}</span>
        </div>
        <p>${escapeHtml(step.reason || '')}</p>
        ${step.blocker ? `<p><strong>Blocker:</strong> ${escapeHtml(step.blocker)}</p>` : ''}
        ${step.nextAction ? `<p><strong>Next:</strong> ${escapeHtml(step.nextAction)}</p>` : ''}
        ${requirementHtml(step.requirements)}
        <div class="atlasStepActions">${explanationButton}</div>
      </article>
    `;
  }

  function renderStrategy(strategy, { compact = false } = {}) {
    if (!strategy) {
      return '<p class="atlasEmpty">No strategy is available yet.</p>';
    }
    const steps = Array.isArray(strategy.steps) ? strategy.steps : [];
    const selected = strategy.selected ? '<span class="atlasTag" data-testid="progression-atlas-selected-strategy">selected</span>' : '';
    const selectButton = compact && !strategy.selected
      ? `<button class="atlasButton atlasSelectStrategyBtn" type="button" data-strategy-id="${escapeHtml(strategy.strategyId)}">Select</button>`
      : '';
    return `
      <article class="atlasStrategy" data-strategy-id="${escapeHtml(strategy.strategyId || '')}">
        <div class="atlasStrategyHead">
          <h3 class="atlasStrategyTitle">${escapeHtml(strategy.title || 'Strategy')}</h3>
          <div>${selected}${selectButton}</div>
        </div>
        <p class="atlasStrategyGoal">${escapeHtml(strategy.goal || strategy.summary || '')}</p>
        ${Array.isArray(strategy.focus) && strategy.focus.length ? `<div class="atlasFocusList">${strategy.focus.map((entry) => `<span>${escapeHtml(entry)}</span>`).join('')}</div>` : ''}
        ${compact ? '' : `${renderTree(steps)}<div class="atlasStepList">${steps.map(renderStep).join('')}</div>`}
      </article>
    `;
  }

  function renderDraft() {
    const node = $('draftStrategy');
    if (!node) return;
    const strategy = state.draft || strategyOptionForKey(state.activeStrategyKey);
    node.innerHTML = renderStrategy(strategy);
    const saveBtn = $('saveStrategyBtn');
    if (saveBtn) saveBtn.disabled = !strategy;
  }

  function renderSavedStrategies() {
    const node = $('savedStrategies');
    if (!node) return;
    const strategies = Array.isArray(state.atlas?.strategies) ? state.atlas.strategies : [];
    if (!strategies.length) {
      node.innerHTML = '<p class="atlasEmpty">No private strategies saved yet. Draft and save one option to validate the Atlas loop.</p>';
      return;
    }
    node.innerHTML = strategies.map((strategy) => renderStrategy(strategy, { compact: true })).join('');
  }

  function renderAll() {
    renderSummary();
    renderTemplateControls();
    renderStrategyCompare();
    renderDraft();
    renderSavedStrategies();
    markReadyImages(document);
  }

  async function loadAtlas() {
    const data = await fetchJson('/api/founders-plot/progression-atlas');
    state.atlas = data.atlas || null;
    state.selectedStrategyId = data.atlas?.selectedStrategyId || null;
    const activeOption = strategyOptionForKey(state.activeStrategyKey);
    state.activeStrategyKey = activeOption?.strategyKey || 'rush-hq3';
    if (!state.draft) state.draft = activeOption;
    renderAll();
  }

  async function draftStrategy(strategyKey = state.activeStrategyKey) {
    const key = String(strategyKey || 'rush-hq3');
    const data = await fetchJson('/api/founders-plot/progression-atlas/strategies/draft', {
      method: 'POST',
      body: JSON.stringify({ strategyKey: key })
    });
    state.activeStrategyKey = data.strategy?.strategyKey || key;
    state.draft = data.strategy;
    renderAll();
    const explanation = $('atlasExplanation');
    if (explanation) explanation.textContent = `${strategyTitle(data.strategy)} drafted from the current Founders Plot state. Nothing in gameplay changed.`;
  }

  async function saveDraft() {
    const strategy = state.draft || strategyOptionForKey(state.activeStrategyKey);
    if (!strategy) return;
    const data = await fetchJson('/api/founders-plot/progression-atlas/strategies', {
      method: 'POST',
      body: JSON.stringify({
        strategyKey: strategy.strategyKey || 'rush-hq3',
        title: strategy.title || strategyTitle(strategy),
        select: true
      })
    });
    if (state.atlas) {
      state.atlas.strategies = data.strategies || [];
      state.atlas.selectedStrategyId = data.selectedStrategyId || null;
    }
    state.selectedStrategyId = data.selectedStrategyId || null;
    renderAll();
    const explanation = $('atlasExplanation');
    if (explanation) explanation.textContent = `Saved ${strategyTitle(strategy)} as a private strategy and selected it for this plot.`;
  }

  async function selectStrategy(strategyId) {
    if (!strategyId) return;
    const data = await fetchJson(`/api/founders-plot/progression-atlas/strategies/${encodeURIComponent(strategyId)}/select`, {
      method: 'POST',
      body: JSON.stringify({})
    });
    if (state.atlas) {
      state.atlas.strategies = data.strategies || [];
      state.atlas.selectedStrategyId = data.selectedStrategyId || null;
    }
    renderAll();
  }

  async function explainNode(nodeId) {
    const data = await fetchJson('/api/founders-plot/progression-atlas/explain', {
      method: 'POST',
      body: JSON.stringify({ nodeId })
    });
    const node = $('atlasExplanation');
    if (node) node.textContent = data.explanation || 'No explanation available.';
  }

  function bindEvents() {
    const saveBtn = $('saveStrategyBtn');
    if (saveBtn) saveBtn.addEventListener('click', () => {
      saveDraft().catch((err) => {
        const node = $('atlasExplanation');
        if (node) node.textContent = String(err?.message || err || 'Save failed');
      });
    });

    document.addEventListener('click', (event) => {
      const explain = event.target.closest('.atlasExplainBtn');
      if (explain) {
        explainNode(explain.getAttribute('data-node-id')).catch((err) => {
          const node = $('atlasExplanation');
          if (node) node.textContent = String(err?.message || err || 'Explain failed');
        });
        return;
      }
      const select = event.target.closest('.atlasSelectStrategyBtn');
      if (select) {
        selectStrategy(select.getAttribute('data-strategy-id')).catch((err) => {
          const node = $('atlasExplanation');
          if (node) node.textContent = String(err?.message || err || 'Select failed');
        });
        return;
      }
      const draft = event.target.closest('.atlasDraftStrategyBtn');
      if (draft) {
        draftStrategy(draft.getAttribute('data-strategy-key')).catch((err) => {
          const node = $('atlasExplanation');
          if (node) node.textContent = String(err?.message || err || 'Draft failed');
        });
      }
    });
  }

  bindEvents();
  loadAtlas().catch((err) => {
    const summary = $('atlasSummary');
    if (summary) summary.textContent = String(err?.message || err || 'Progression Atlas failed to load.');
  });
}());
