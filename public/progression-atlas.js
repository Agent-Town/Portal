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
    activeStrategyKey: initialStrategyKey(),
    editor: {
      open: false,
      strategy: null,
      selectedStepId: null
    }
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

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
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

  function editorSafeId(value, fallback = 'editor.step') {
    const safe = String(value || '')
      .trim()
      .replace(/[^a-zA-Z0-9._:-]/g, '_')
      .replace(/^_+|_+$/g, '');
    return safe || fallback;
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
    if (index <= 8) return { label: 'Tier 2', name: 'Resource Loops', start: 4 };
    if (index <= 13) return { label: 'Tier 3', name: 'Foreman', start: 9 };
    if (index <= 18) return { label: 'Tier 4', name: 'HQ5 Bridge', start: 14 };
    return { label: 'Tier 5', name: 'HQ10 Horizon', start: 19 };
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

  function canonicalNodeById(nodeId) {
    const nodes = Array.isArray(state.atlas?.canonicalNodes) ? state.atlas.canonicalNodes : [];
    return nodes.find((node) => node.nodeId === nodeId) || null;
  }

  function renderCanonicalCoverage() {
    const node = $('canonicalCoverage');
    if (!node) return;
    const groups = [
      {
        title: 'HQ Spine',
        index: 1,
        summary: 'Command upgrades and coordination unlocks.',
        nodes: ['hq.level.1', 'hq.level.2', 'hq.level.3', 'hq.level.4', 'hq.level.5']
      },
      {
        title: 'Current Buildings',
        index: 2,
        summary: 'Structures already implemented in Founders Plot.',
        nodes: ['building.LUMBER_CAMP.place', 'building.FARM_PLOT.place', 'building.QUARRY.place', 'building.WORKSHOP.place', 'building.MARKET_STALL.place']
      },
      {
        title: 'Loops + Effects',
        index: 3,
        summary: 'Production, collection, selling, and buffs.',
        nodes: ['production.LUMBER_CAMP.PRODUCE', 'production.FARM_PLOT.PRODUCE', 'production.QUARRY.PRODUCE', 'production.WORKSHOP.PRODUCE', 'effect.workshop.next_build_buff', 'production.MARKET_STALL.SELL']
      },
      {
        title: 'Permissions',
        index: 4,
        summary: 'Delegation gates, policies, and safety caps.',
        nodes: ['permission.collectOutputs.unlock', 'permission.queueProduction.unlock', 'permission.setPriority.unlock', 'permission.sellSurplusFood.unlock', 'policy.sellDailyCoinCap']
      },
      {
        title: 'Rewards + Caps',
        index: 5,
        summary: 'Receipts, milestones, storage, and throughput.',
        nodes: ['reward.quest.first-lumber.claim', 'reward.hq.level-5.claim', 'constraint.storage.wood', 'constraint.construction_slots']
      }
    ];
    const legend = ['done', 'available', 'waiting', 'blocked', 'locked'].map((status) => (
      `<span class="atlasCoverageLegendItem status-${status}"><i aria-hidden="true"></i>${escapeHtml(status)}</span>`
    )).join('');
    const lanes = groups.map((group) => {
      const items = group.nodes.map((nodeId) => canonicalNodeById(nodeId)).filter(Boolean);
      return `
        <section class="atlasCoverageLane">
          <div class="atlasCoverageGroup">
            <span class="atlasCoverageLaneNumber">${escapeHtml(group.index)}</span>
            <div>
              <h3>${escapeHtml(group.title)}</h3>
              <p>${escapeHtml(group.summary)}</p>
            </div>
          </div>
          <div class="atlasCoverageItems" style="--atlas-coverage-count: ${Math.max(items.length, 1)};">
            ${items.map((item) => `
              <button class="atlasCoverageNode atlasExplainBtn status-${escapeHtml(item.status || 'blocked')}" type="button" data-node-id="${escapeHtml(item.nodeId)}" data-testid="progression-atlas-canonical-${escapeHtml(testId(item.nodeId))}">
                <span class="atlasCoverageNodeFrame">${iconHtml(item.icon, 'atlasCoverageIcon')}</span>
                <span class="atlasCoverageNodeLabel">${escapeHtml(item.title || item.nodeId)}</span>
                <strong>${escapeHtml(item.status || 'blocked')}</strong>
              </button>
            `).join('')}
          </div>
        </section>
      `;
    }).join('');
    node.innerHTML = lanes
      ? `<div class="atlasCoverageLegend" data-testid="progression-atlas-canonical-status-legend">${legend}</div><div class="atlasCoverageLanes">${lanes}</div>`
      : '<p class="atlasEmpty">Canonical coverage unavailable.</p>';
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
            ${Array.isArray(compare.futureMilestones) && compare.futureMilestones.length
              ? `<div><dt>Future</dt><dd>${escapeHtml(compactList(compare.futureMilestones.map((item) => item.title), 'none'))}</dd></div>`
              : ''}
            <div><dt>Tradeoff</dt><dd>${escapeHtml(compare.tradeoff || strategy.summary || '')}</dd></div>
            <div><dt>Burden</dt><dd>${escapeHtml(compare.approvalDelegationBurden || '')}</dd></div>
          </dl>
        </article>
      `;
    }).join('');
  }

  function renderFutureHorizon() {
    const node = $('futureHorizon');
    if (!node) return;
    const horizon = state.atlas?.futureHorizon;
    const milestones = Array.isArray(horizon?.milestones) ? horizon.milestones : [];
    if (!horizon || !milestones.length) {
      node.innerHTML = '<p class="atlasEmpty">HQ10 horizon unavailable.</p>';
      return;
    }
    const bridge = horizon.currentBridge || {};
    const cards = milestones.map((milestone) => `
      <button class="atlasHorizonNode atlasExplainBtn status-${escapeHtml(milestone.status || 'locked')}" type="button" data-node-id="${escapeHtml(milestone.nodeId)}" data-testid="progression-atlas-horizon-hq${escapeHtml(milestone.hqLevel)}">
        <span class="atlasHorizonIcon">${iconHtml(milestone.icon, 'atlasTreeIcon')}</span>
        <span class="atlasHorizonLevel">HQ${escapeHtml(milestone.hqLevel)}</span>
        <strong>${escapeHtml(milestone.title)}</strong>
        <em>${escapeHtml(milestone.system || 'future')}</em>
        <span>${escapeHtml((milestone.possibilities || []).slice(0, 2).join(' '))}</span>
      </button>
    `).join('');
    node.innerHTML = `
      <div class="atlasHorizonIntro">
        <div>
          <strong>${escapeHtml(bridge.title || 'Current playable cap')}</strong>
          <p>${escapeHtml(horizon.gameplayTruthBoundary || '')}</p>
        </div>
        <button class="atlasButton atlasDraftStrategyBtn" type="button" data-strategy-key="${escapeHtml(horizon.recommendedTemplateKey || 'hq10-horizon')}" data-testid="progression-atlas-horizon-draft">Draft HQ10 Path</button>
      </div>
      <div class="atlasHorizonRail" style="--atlas-horizon-count: ${Math.max(milestones.length, 1)};">
        ${cards}
      </div>
      <div class="atlasHorizonGuardrails">
        ${(horizon.guardrails || []).map((entry) => `<span>${escapeHtml(entry)}</span>`).join('')}
      </div>
    `;
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

  function currentEditableStrategy() {
    return state.editor.strategy || state.draft || strategyOptionForKey(state.activeStrategyKey);
  }

  function normalizeEditorStrategy(strategy) {
    const source = clone(strategy || strategyOptionForKey(state.activeStrategyKey) || {});
    const steps = Array.isArray(source.steps) ? source.steps : [];
    source.title = source.title && !String(source.title).includes('Edited')
      ? `${source.title} Edited`
      : (source.title || 'Custom Strategy');
    source.strategyKey = source.strategyKey && String(source.strategyKey).startsWith('custom-')
      ? source.strategyKey
      : `custom-${testId(source.title).toLowerCase() || 'strategy'}`;
    source.generatedBy = 'progression_atlas_strategy_editor_v1';
    source.steps = steps.map((step, index) => ({
      ...clone(step),
      stepId: editorSafeId(step.stepId || step.nodeId || `editor.step.${index + 1}`),
      nodeId: editorSafeId(step.nodeId || step.stepId || `editor.step.${index + 1}`),
      status: step.status || 'planned',
      reason: step.reason || 'Player-authored progression step.',
      beforeStepId: step.beforeStepId || step.connections?.beforeStepId || (index > 0 ? editorSafeId(steps[index - 1]?.stepId || steps[index - 1]?.nodeId) : null),
      afterStepId: step.afterStepId || step.connections?.afterStepId || null,
      iconPrompt: step.icon?.prompt || `${step.title || 'Strategy step'}, Agent Town strategy icon`,
      editorEditable: true
    }));
    return source;
  }

  function selectedEditorStep() {
    const steps = Array.isArray(state.editor.strategy?.steps) ? state.editor.strategy.steps : [];
    return steps.find((step) => step.stepId === state.editor.selectedStepId) || steps[0] || null;
  }

  function stepOptions(selectedId, currentId) {
    const steps = Array.isArray(state.editor.strategy?.steps) ? state.editor.strategy.steps : [];
    const options = ['<option value="">None</option>'];
    for (const step of steps) {
      if (step.stepId === currentId) continue;
      const selected = step.stepId === selectedId ? ' selected' : '';
      options.push(`<option value="${escapeHtml(step.stepId)}"${selected}>${escapeHtml(step.title || step.stepId)}</option>`);
    }
    return options.join('');
  }

  function syncEditorForm() {
    const step = selectedEditorStep();
    if (!step) return;
    const title = $('editorStepTitle');
    const reason = $('editorStepReason');
    const before = $('editorStepBefore');
    const after = $('editorStepAfter');
    const prompt = $('editorIconPrompt');
    if (title) title.value = step.title || '';
    if (reason) reason.value = step.reason || '';
    if (before) before.innerHTML = stepOptions(step.beforeStepId, step.stepId);
    if (after) after.innerHTML = stepOptions(step.afterStepId, step.stepId);
    if (prompt) prompt.value = step.iconPrompt || step.icon?.prompt || `${step.title || 'Strategy step'}, Agent Town strategy icon`;
  }

  function renderEditor() {
    const panel = $('strategyEditorPanel');
    if (!panel) return;
    panel.hidden = !state.editor.open;
    if (!state.editor.open) return;
    if (!state.editor.strategy) {
      state.editor.strategy = normalizeEditorStrategy(currentEditableStrategy());
      state.editor.selectedStepId = state.editor.strategy.steps[0]?.stepId || null;
    }
    const steps = Array.isArray(state.editor.strategy?.steps) ? state.editor.strategy.steps : [];
    const list = $('editorStepList');
    if (list) {
      list.innerHTML = steps.map((step, index) => {
        const selected = step.stepId === state.editor.selectedStepId;
        return `
          <button class="atlasEditorStep${selected ? ' isActive' : ''}" type="button" data-editor-step-id="${escapeHtml(step.stepId)}" data-testid="progression-atlas-editor-step-${escapeHtml(testId(step.stepId))}">
            ${iconHtml(step.icon, 'atlasMiniIcon')}
            <span>${escapeHtml(index + 1)}. ${escapeHtml(step.title || step.stepId)}</span>
          </button>
        `;
      }).join('');
    }
    syncEditorForm();
    markReadyImages(panel);
  }

  function applyEditorForm() {
    const strategy = state.editor.strategy;
    if (!strategy) return null;
    const step = selectedEditorStep();
    if (!step) return null;
    const title = $('editorStepTitle');
    const reason = $('editorStepReason');
    const before = $('editorStepBefore');
    const after = $('editorStepAfter');
    const prompt = $('editorIconPrompt');
    step.title = String(title?.value || step.title || 'Strategy Step').trim().slice(0, 80) || 'Strategy Step';
    step.reason = String(reason?.value || step.reason || 'Player-authored progression step.').trim().slice(0, 400);
    step.beforeStepId = String(before?.value || '').trim() || null;
    step.afterStepId = String(after?.value || '').trim() || null;
    step.connections = {
      beforeStepId: step.beforeStepId,
      afterStepId: step.afterStepId
    };
    step.iconPrompt = String(prompt?.value || step.iconPrompt || `${step.title}, Agent Town strategy icon`).trim().slice(0, 300);
    if (step.icon) {
      step.icon.label = step.title;
      step.icon.prompt = step.iconPrompt;
      if (step.icon.genAi) step.icon.genAi.prompt = step.iconPrompt;
    }
    strategy.generatedBy = 'progression_atlas_strategy_editor_v1';
    state.draft = strategy;
    return step;
  }

  function openEditor() {
    state.editor.open = true;
    state.editor.strategy = normalizeEditorStrategy(currentEditableStrategy());
    state.editor.selectedStepId = state.editor.strategy.steps[0]?.stepId || null;
    state.draft = state.editor.strategy;
    renderAll();
    $('strategyEditorPanel')?.scrollIntoView({ block: 'nearest' });
  }

  function addEditorStep() {
    if (!state.editor.strategy) state.editor.strategy = normalizeEditorStrategy(currentEditableStrategy());
    applyEditorForm();
    const steps = state.editor.strategy.steps;
    const previous = steps[steps.length - 1] || null;
    const stepId = editorSafeId(`editor.custom.${steps.length + 1}`);
    const step = {
      stepId,
      nodeId: stepId,
      title: 'Scout Ridge',
      status: 'planned',
      reason: 'Player-authored expansion or strategy checkpoint.',
      icon: globalIcon('progression.generic', {
        label: 'Scout Ridge',
        symbol: 'SR',
        tone: 'custom',
        source: 'progression_atlas_strategy_editor'
      }),
      requirements: { items: [], affordable: true, missing: {} },
      blocker: null,
      nextAction: 'Scout Ridge',
      beforeStepId: previous?.stepId || null,
      afterStepId: null,
      connections: { beforeStepId: previous?.stepId || null, afterStepId: null },
      iconPrompt: 'frontier ridge scout marker, Agent Town strategy icon',
      editorEditable: true
    };
    steps.push(step);
    state.editor.selectedStepId = stepId;
    state.draft = state.editor.strategy;
    renderAll();
  }

  async function generateEditorIcon() {
    const step = applyEditorForm();
    if (!step) return;
    const data = await fetchJson('/api/founders-plot/progression-atlas/icons/generate', {
      method: 'POST',
      body: JSON.stringify({
        title: step.title,
        prompt: step.iconPrompt || `${step.title}, Agent Town strategy icon`
      })
    });
    step.icon = data.icon;
    step.iconPrompt = data.icon?.prompt || step.iconPrompt;
    state.draft = state.editor.strategy;
    renderAll();
    const explanation = $('atlasExplanation');
    if (explanation) explanation.textContent = `Attached a GenAI icon draft to ${step.title}. Gameplay state did not change.`;
  }

  async function saveEditorStrategy() {
    applyEditorForm();
    const strategy = state.editor.strategy;
    if (!strategy) return;
    const data = await fetchJson('/api/founders-plot/progression-atlas/strategies', {
      method: 'POST',
      body: JSON.stringify({
        strategy,
        select: true
      })
    });
    if (state.atlas) {
      state.atlas.strategies = data.strategies || [];
      state.atlas.selectedStrategyId = data.selectedStrategyId || null;
    }
    state.draft = data.strategy || strategy;
    state.selectedStrategyId = data.selectedStrategyId || null;
    renderAll();
    const explanation = $('atlasExplanation');
    if (explanation) explanation.textContent = `Saved ${strategyTitle(data.strategy || strategy)} as a private edited strategy.`;
  }

  function renderAll() {
    renderSummary();
    renderTemplateControls();
    renderCanonicalCoverage();
    renderStrategyCompare();
    renderFutureHorizon();
    renderDraft();
    renderEditor();
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
    const openEditorBtn = $('openEditorBtn');
    if (openEditorBtn) openEditorBtn.addEventListener('click', openEditor);
    const addStepBtn = $('editorAddStepBtn');
    if (addStepBtn) addStepBtn.addEventListener('click', addEditorStep);
    const editorForm = $('strategyEditorForm');
    if (editorForm) editorForm.addEventListener('submit', (event) => {
      event.preventDefault();
      applyEditorForm();
      renderAll();
    });
    const generateIconBtn = $('editorGenerateIconBtn');
    if (generateIconBtn) generateIconBtn.addEventListener('click', () => {
      generateEditorIcon().catch((err) => {
        const node = $('atlasExplanation');
        if (node) node.textContent = String(err?.message || err || 'Icon generation failed');
      });
    });
    const saveEditorBtn = $('editorSaveStrategyBtn');
    if (saveEditorBtn) saveEditorBtn.addEventListener('click', () => {
      saveEditorStrategy().catch((err) => {
        const node = $('atlasExplanation');
        if (node) node.textContent = String(err?.message || err || 'Edited strategy save failed');
      });
    });

    document.addEventListener('click', (event) => {
      const editorStep = event.target.closest('.atlasEditorStep');
      if (editorStep) {
        applyEditorForm();
        state.editor.selectedStepId = editorStep.getAttribute('data-editor-step-id');
        renderAll();
        return;
      }
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
