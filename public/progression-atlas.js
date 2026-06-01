(function () {
  'use strict';

  try {
    const params = new URLSearchParams(window.location.search || '');
    document.body.classList.toggle('isAtlasEmbedded', params.get('embed') === '1');
  } catch (_) {
    document.body.classList.remove('isAtlasEmbedded');
  }

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
    engineGraph: {
      selectedNodeId: null
    },
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
    const allowed = [
      '/assets/icons/agent-town/',
      '/experiences/founders-plot/assets/objects/'
    ].some((prefix) => path.startsWith(prefix));
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

  function labelize(value, fallback = 'Item') {
    const text = String(value || fallback)
      .replace(/[._:-]+/g, ' ')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text
      .split(' ')
      .map((part) => part ? `${part[0].toUpperCase()}${part.slice(1).toLowerCase()}` : '')
      .join(' ') || fallback;
  }

  function boundaryText(value, fallback = 'advisory only') {
    return labelize(value || fallback, fallback).replace(/\bHq\b/g, 'HQ');
  }

  function canonicalNodes() {
    return Array.isArray(state.atlas?.canonicalNodes) ? state.atlas.canonicalNodes : [];
  }

  function actionRefNodes() {
    return canonicalNodes().filter((node) => node?.actionRef?.tool);
  }

  function isAtlasExecutable(actionRef) {
    return actionRef?.executableByAtlas === true || actionRef?.executable === true;
  }

  function refsExecutableCount(nodes = canonicalNodes()) {
    return nodes.filter((node) => isAtlasExecutable(node?.actionRef)).length;
  }

  function canonicalNodesByKind(kind) {
    return canonicalNodes().filter((node) => node?.kind === kind);
  }

  function nodeStatusLabel(node, fallback = 'unavailable') {
    return boundaryText(node?.status || fallback, fallback);
  }

  function actionRefLabel(node) {
    const ref = node?.actionRef;
    if (!ref?.tool) return 'No action ref exposed';
    return `${ref.tool}: metadata only`;
  }

  function numberInputValue(id) {
    const node = $(id);
    if (!node) return 0;
    return Math.max(0, Math.floor(Number(node.value || 0)));
  }

  function setNumberInputValue(id, value) {
    const node = $(id);
    if (!node) return;
    const number = Math.max(0, Math.floor(Number(value || 0)));
    node.value = number > 0 ? String(number) : '';
  }

  function shortfallsText(shortfalls) {
    const entries = Object.entries(shortfalls && typeof shortfalls === 'object' ? shortfalls : {})
      .filter(([, amount]) => Number(amount || 0) > 0);
    if (!entries.length) return 'none from current state';
    return entries.map(([key, amount]) => `${key} ${amount}`).join(', ');
  }

  function requirementItemLabel(item) {
    if (!item || typeof item !== 'object') return '';
    if (item.kind === 'hq') return `HQ ${item.have}/${item.required}`;
    if (item.kind === 'building') {
      const name = item.label || labelize(item.resource, 'Building');
      const requiredState = item.requiredState ? ` ${item.requiredState}` : '';
      const stateSuffix = item.state && item.state !== item.requiredState ? ` (now ${item.state})` : '';
      return `${name}${requiredState}: ${item.have || 0}/${item.required}${stateSuffix}`;
    }
    if (item.kind === 'xp') return `XP ${item.have || 0}/${item.required}`;
    const resource = item.resource || item.label || item.kind || 'requirement';
    if (item.required == null) return String(resource);
    return `${resource}: ${item.have || 0}/${item.required}`;
  }

  function requirementText(requirements) {
    const items = Array.isArray(requirements?.items) ? requirements.items : [];
    return items.map((item) => {
      const suffix = Number(item?.missing || 0) > 0 ? ` need ${item.missing}` : '';
      return `${requirementItemLabel(item)}${suffix}`;
    }).filter(Boolean).join(', ');
  }

  function costFromRequirements(requirements) {
    const items = Array.isArray(requirements?.items) ? requirements.items : [];
    const cost = {};
    for (const item of items) {
      if (!item || item.kind !== 'resource') continue;
      const key = String(item.resource || '').toLowerCase();
      if (!['wood', 'stone', 'food', 'coin'].includes(key)) continue;
      const required = Math.max(0, Math.floor(Number(item.required || 0)));
      if (required > 0) cost[key] = required;
    }
    return Object.keys(cost).length ? cost : null;
  }

  function costText(cost) {
    const entries = Object.entries(cost && typeof cost === 'object' ? cost : {})
      .filter(([, amount]) => Number(amount || 0) > 0);
    return entries.length
      ? entries.map(([key, amount]) => `${key} ${amount}`).join(', ')
      : '';
  }

  function hasConcreteGate(gate) {
    if (!gate || typeof gate !== 'object') return false;
    const items = Array.isArray(gate.requirements?.items) ? gate.requirements.items : [];
    return !!costText(gate.estimatedCost || costFromRequirements(gate.requirements)) || items.length > 0;
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
      const label = requirementItemLabel(item);
      const suffix = Number(item.missing || 0) > 0 ? ` need ${item.missing}` : '';
      const classes = `atlasRequirement${Number(item.missing || 0) > 0 ? ' missing' : ''}`;
      return `<span class="${classes}">${escapeHtml(label + suffix)}</span>`;
    }).join('');
    return `<div class="atlasRequirementList">${chips}</div>`;
  }

  function resourceGateHtml(gate) {
    if (!gate || typeof gate !== 'object') return '';
    if (!hasConcreteGate(gate)) return '';
    const cost = costText(gate.estimatedCost || costFromRequirements(gate.requirements));
    const requirements = requirementText(gate.requirements);
    const label = gate.canonicalNodeId ? 'Server-owned gate' : 'Draft advisory gate';
    const authority = gate.gameplayAuthority || (gate.canonicalNodeId ? 'founders_plot_engine' : 'strategy_editor_advisory');
    const policy = gate.mutationPolicy || 'advisory_only';
    return `
      <div class="atlasGate" data-testid="progression-atlas-resource-gate">
        <strong>${escapeHtml(label)}</strong>
        <span>${escapeHtml(gate.title || gate.canonicalNodeId || gate.gateId || 'Gate')}</span>
        ${cost ? `<em>${escapeHtml(cost)}</em>` : ''}
        ${requirements ? `<small>${escapeHtml(requirements)}</small>` : ''}
        <small>${escapeHtml(boundaryText(authority))} · ${escapeHtml(boundaryText(policy))}</small>
      </div>
    `;
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
      `<span class="atlasPill atlasPillIcon">${iconHtml(globalIcon('receipt.scout_report'), 'atlasMiniIcon')}reports ${escapeHtml(summary.scoutReportCount || 0)}</span>`,
      `<span class="atlasPill atlasPillIcon">${iconHtml(globalIcon('planning.site_plan'), 'atlasMiniIcon')}plans ${escapeHtml(summary.sitePlanCount || 0)}</span>`,
      `<span class="atlasPill atlasPillIcon">${iconHtml(globalIcon('plot.second_settlement'), 'atlasMiniIcon')}outposts ${escapeHtml(summary.outpostCount || 0)}</span>`,
      `<span class="atlasPill atlasPillIcon">${iconHtml(globalIcon('building.cohort_hall'), 'atlasMiniIcon')}work orders ${escapeHtml(summary.workOrderDraftCount || 0)}</span>`,
      `<span class="atlasPill">${escapeHtml(summary.currentNextAction || 'Review plan')}</span>`
    ].join('');
  }

  function renderWorkbench() {
    const summary = state.atlas?.summary;
    const situation = $('atlasSituation');
    const gateDeck = $('atlasGateDeck');
    if (situation) {
      if (!summary) {
        situation.innerHTML = '<p class="atlasEmpty">Plot snapshot unavailable.</p>';
      } else {
        const strategy = state.draft || strategyOptionForKey(state.activeStrategyKey);
        const inventory = summary.inventory || {};
        situation.innerHTML = [
          `<div class="atlasSituationMetric"><span>HQ</span><strong>Level ${escapeHtml(summary.hqLevel || 1)}</strong></div>`,
          `<div class="atlasSituationMetric"><span>XP</span><strong>${escapeHtml(summary.townXp || 0)}</strong></div>`,
          `<div class="atlasSituationMetric"><span>Materials</span><strong>${escapeHtml(costText(inventory) || 'none')}</strong></div>`,
          `<div class="atlasSituationMetric"><span>Receipts</span><strong>${escapeHtml((summary.scoutReportCount || 0) + ' reports / ' + (summary.sitePlanCount || 0) + ' plans')}</strong></div>`,
          `<div class="atlasSituationMetric isWide"><span>Active draft</span><strong>${escapeHtml(strategyTitle(strategy))}</strong></div>`,
          `<div class="atlasSituationMetric isWide"><span>Next move</span><strong>${escapeHtml(summary.currentNextAction || 'Review plan')}</strong></div>`
        ].join('');
      }
    }
    if (gateDeck) {
      const gates = resourceGateCandidates()
        .filter((gate) => gate.canonicalNodeId)
        .sort((a, b) => {
          const aMissing = Object.keys(a.requirements?.missing || {}).length;
          const bMissing = Object.keys(b.requirements?.missing || {}).length;
          return bMissing - aMissing || String(a.title || '').localeCompare(String(b.title || ''));
        })
        .slice(0, 4);
      gateDeck.innerHTML = gates.length
        ? gates.map((gate) => {
          const affordable = gate.requirements?.affordable !== false;
          const cost = costText(gate.estimatedCost || costFromRequirements(gate.requirements));
          const requirements = requirementText(gate.requirements);
          return `
            <article class="atlasGateCard${affordable ? '' : ' isBlocked'}">
              <div class="atlasGateCardHead">
                <strong>${escapeHtml(gate.title || gate.gateId || 'Resource gate')}</strong>
                <span>${affordable ? 'ready' : 'blocked'}</span>
              </div>
              ${cost ? `<em>${escapeHtml(cost)}</em>` : ''}
              ${requirements ? `<small>${escapeHtml(requirements)}</small>` : ''}
            </article>
          `;
        }).join('')
        : '<p class="atlasEmpty">No resource gates exposed yet.</p>';
    }
  }

  function formatCapValue(key, value) {
    if (key === 'maxRuntimeMs') return `${Math.round(Number(value || 0) / 1000)}s runtime`;
    if (key === 'maxChildActions') return `${Number(value || 0)} child actions`;
    if (key === 'allowedPlotScope') return boundaryText(value, 'current plot only');
    if (key === 'maxResourceSpend') return `spend ${costText(value) || '0'}`;
    return `${labelize(key)} ${typeof value === 'object' ? JSON.stringify(value) : value}`;
  }

  function miniList(items, emptyText = 'None') {
    const list = Array.isArray(items) ? items.filter(Boolean) : [];
    if (!list.length) return `<p class="atlasEmpty">${escapeHtml(emptyText)}</p>`;
    return `<div class="atlasMiniList">${list.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</div>`;
  }

  function civicProjectRows(projects) {
    if (!projects.length) {
      return `
        <article class="atlasCivicRecord">
          <strong>Canonical proposal metadata</strong>
          <p>No active civic project records are present in this read model. HQ11 planning stays on canonical HQ10D proposal metadata until Founders Plot reports server-owned project records.</p>
        </article>
      `;
    }
    return projects.slice(0, 4).map((project) => {
      const metadata = project.metadata?.project || {};
      const effect = metadata.effect || project.effects?.[0]?.effect || {};
      const receipt = metadata.receipt || {};
      return `
        <article class="atlasCivicRecord">
          <strong>${escapeHtml(project.title || metadata.title || 'Civic Project')}</strong>
          <p>${escapeHtml(metadata.summary || project.nextAction || 'Server-owned public-work record.')}</p>
          ${miniList([
            `Status: ${nodeStatusLabel(project)}`,
            `Type: ${metadata.projectType || project.target?.projectType || 'civic_beacon'}`,
            `Effect: ${effect.effectId || effect.kind || 'server-owned delta'}`,
            receipt.receiptId ? `Receipt: ${receipt.receiptId}` : 'Receipt: server-owned when active'
          ])}
        </article>
      `;
    }).join('');
  }

  function renderCivicOperations() {
    const node = $('atlasCivicOperations');
    if (!node) return;
    const worldGrid = canonicalNodeById('world_grid.read_model');
    const readiness = canonicalNodeById('world_grid.civic_readiness');
    const proposals = canonicalNodeById('world_grid.civic_proposal_records');
    const overlays = canonicalNodeById('generated_universe.overlay_pack_records');
    const activation = canonicalNodeById('world_grid.civic_project_activation');
    const civicProjects = canonicalNodesByKind('civic_project_record');
    const activeEffects = activation?.metadata?.activeEffects || {};
    const activationEffect = Array.isArray(activation?.effects) ? activation.effects[0] || {} : {};
    const readinessDelta = Number(activeEffects.localReadinessDelta || activationEffect.localReadinessDelta || 0);
    const moraleMarkers = Array.isArray(activeEffects.moraleMarkers) ? activeEffects.moraleMarkers : [];
    const projectCounts = activation?.metadata?.counts || {};
    const projectTotal = Number(projectCounts.total || civicProjects.length || 0);
    const activationReady = activation?.availability?.activationAllowed === true || activation?.status === 'available' || activation?.status === 'waiting';
    const proposalStatus = proposals ? nodeStatusLabel(proposals) : 'Unavailable';
    const overlayStatus = overlays ? nodeStatusLabel(overlays) : 'Unavailable';
    const activationStatus = activation ? nodeStatusLabel(activation) : 'Unavailable';
    const lifecycle = [
      `1. World Grid read model: ${nodeStatusLabel(worldGrid)}`,
      `2. Civic proposal records: ${proposalStatus}`,
      `3. Generated Universe overlays: ${overlayStatus}`,
      `4. Civic project activation: ${activationStatus}`,
      '5. HQ11 readiness: advisory until a canonical server model exists'
    ];
    const actors = [
      'Civic Routekeeper: visual route/readiness steward only',
      'Oracle Adjunct: reads proposal and overlay metadata',
      'Outpost Keeper: displays local public-work state',
      'Clover/Foreman: explain or request server routes; never grant Atlas execution'
    ];
    node.innerHTML = `
      <div class="atlasCivicOpsGrid">
        <article class="atlasCivicOpsCard">
          <div class="atlasCivicOpsHead">
            ${iconHtml(activation?.icon || globalIcon('progression.generic', { symbol: 'CB', tone: 'civic' }), 'atlasIcon')}
            <div>
              <h3>HQ10D Current Public Work</h3>
              <span>${escapeHtml(activationStatus)}</span>
            </div>
          </div>
          <p>${escapeHtml(activation?.nextAction || 'Activateable civic projects depend on reviewed proposal records and Founders Plot server routes.')}</p>
          ${miniList([
            `Projects: ${projectTotal}`,
            `Local readiness delta: ${readinessDelta}`,
            `Morale markers: ${moraleMarkers.length ? moraleMarkers.join(', ') : 'none reported'}`,
            actionRefLabel(activation)
          ])}
        </article>
        <article class="atlasCivicOpsCard">
          <h3>Authority Chain</h3>
          <p>Atlas shows action references, lifecycle gates, receipts, and world deltas as metadata. Founders Plot owns mutation, approval, idempotency, audit receipts, and stable gameplay truth.</p>
          ${miniList([
            `World Grid: ${worldGrid?.metadata?.boundary || 'server-owned read model when present'}`,
            `Proposal records: ${proposals?.metadata?.boundary || 'canonical proposal metadata only'}`,
            `Project activation: ${activation?.metadata?.boundary || 'server-owned route required'}`,
            'Atlas executable actions: 0'
          ])}
        </article>
        <article class="atlasCivicOpsCard">
          <h3>HQ11 Readiness</h3>
          <p>HQ11 is treated as a Living World readiness surface, not an executable control panel. If backend HQ11 fields are absent, this panel keeps the canonical proposal path visible without inventing routes, workers, schedules, or cross-plot effects.</p>
          ${miniList([
            activationReady ? 'Activation path visible' : 'Activation path gated',
            projectTotal > 0 ? 'Server project record present' : 'No server project record yet',
            'World deltas shown only when reported',
            'Next server proposal: civic operations lifecycle model'
          ])}
        </article>
      </div>
      <div class="atlasCivicLifecycle">
        <section>
          <h3>Lifecycle Gates</h3>
          ${miniList(lifecycle)}
        </section>
        <section>
          <h3>Visual Actor Roles</h3>
          ${miniList(actors)}
        </section>
      </div>
      <div class="atlasCivicRecords">
        ${civicProjectRows(civicProjects)}
      </div>
    `;
  }

  function renderOperationalBoundaries() {
    const authority = $('atlasAuthorityBoundary');
    const workOrders = $('atlasWorkOrderBrief');
    const worldGrid = $('atlasWorldGridBrief');
    const nodes = canonicalNodes();
    const refs = actionRefNodes();
    const atlasExecutableCount = refs.filter((node) => isAtlasExecutable(node.actionRef)).length;
    if (authority) {
      const samples = refs.slice(0, 4).map((node) => `${node.actionRef.tool}: metadata only`);
      authority.innerHTML = `
        <div class="atlasAuthorityMetrics">
          <div><span>Server-owned refs</span><strong>${escapeHtml(refs.length)}</strong></div>
          <div><span>Atlas executable actions</span><strong>${escapeHtml(atlasExecutableCount)}</strong></div>
          <div><span>Advisory strategies</span><strong>${escapeHtml((state.atlas?.strategies || []).length)}</strong></div>
          <div><span>Canonical nodes</span><strong>${escapeHtml(nodes.length)}</strong></div>
        </div>
        <p class="atlasBoundaryNote">Atlas explains, compares, and saves private strategy refs. Mutations stay with Founders Plot server routes and human-approved tools.</p>
        ${miniList(samples, 'No action refs exposed from the current read model.')}
      `;
    }

    if (workOrders) {
      const planner = canonicalNodeById('cohort.work_order_planner');
      const template = nodes.find((node) => node.kind === 'work_order_template' && node.target?.templateId === 'collect_ready_outputs_once')
        || canonicalNodeById('work_order.template.collect_ready_outputs_once');
      const drafts = nodes.filter((node) => node.kind === 'work_order_draft');
      const templateMeta = template?.metadata?.template || {};
      const caps = templateMeta.caps || template?.effects?.[0]?.caps || {};
      const allowedActions = templateMeta.allowedActions || template?.effects?.[0]?.allowedActions || [];
      const blockedBy = planner?.availability?.blockedBy || template?.availability?.blockedBy || [];
      const boundary = template?.metadata?.boundary || planner?.metadata?.boundary || templateMeta.authorityBoundary || 'server_owned_work_order_executor_collect_ready_outputs_once_v1';
      const capBadges = Object.entries(caps).map(([key, value]) => formatCapValue(key, value));
      workOrders.innerHTML = `
        <div class="atlasOpsStatusRow">
          <span class="atlasOpsStatus status-${escapeHtml(planner?.status || 'locked')}">Planner ${escapeHtml(planner?.status || 'locked')}</span>
          <span class="atlasOpsStatus status-${escapeHtml(template?.status || 'locked')}">Template ${escapeHtml(template?.status || 'locked')}</span>
          <span class="atlasOpsStatus">Drafts ${escapeHtml(drafts.length)}</span>
        </div>
        <h3>${escapeHtml(template?.title || 'Collect Ready Outputs Once')}</h3>
        <p>${escapeHtml(templateMeta.summary || template?.nextAction || 'Bounded cohort work orders remain server-owned and explicit.')}</p>
        ${miniList([
          ...(allowedActions.length ? [`Allowed: ${allowedActions.join(', ')}`] : []),
          ...capBadges,
          'No scheduler',
          'No arbitrary tools',
          'No spend or placement',
          'Atlas metadata only'
        ])}
        ${blockedBy.length ? `<p class="atlasBoundaryNote">Prerequisites: ${escapeHtml(blockedBy.map((entry) => boundaryText(entry)).join(', '))}</p>` : ''}
        <p class="atlasBoundaryNote">${escapeHtml(boundaryText(boundary))}</p>
      `;
    }

    if (worldGrid) {
      const horizon = state.atlas?.futureHorizon;
      const milestones = Array.isArray(horizon?.milestones) ? horizon.milestones : [];
      const world = milestones.find((milestone) => milestone.system === 'world_grid')
        || milestones[milestones.length - 1]
        || null;
      const guardrails = Array.isArray(horizon?.guardrails) ? horizon.guardrails.slice(0, 3) : [];
      worldGrid.innerHTML = world ? `
        <div class="atlasWorldGridHead">
          ${iconHtml(world.icon || globalIcon('progression.generic', { symbol: 'WG', tone: 'civic' }), 'atlasIcon')}
          <div>
            <strong>${escapeHtml(world.title || 'HQ10: World Grid Civilization')}</strong>
            <span>${escapeHtml(boundaryText(world.gameplayTruth || 'future_placeholder'))}</span>
          </div>
        </div>
        <p>${escapeHtml(world.summary || horizon?.gameplayTruthBoundary || 'World Grid remains advisory until server read-model contracts exist.')}</p>
        ${miniList([
          `Current bridge: ${horizon?.currentBridge?.title || 'Founders Plot'}`,
          `Mutation policy: ${boundaryText(horizon?.gameplayMutationPolicy || 'advisory_only')}`,
          `Next: ${world.nextImplementableSlice || 'Define public-safe projection contracts'}`
        ])}
        ${guardrails.length ? miniList(guardrails) : ''}
      ` : '<p class="atlasEmpty">World Grid horizon unavailable.</p>';
    }
  }

  function renderTemplateControls() {
    document.querySelectorAll('.atlasDraftStrategyBtn').forEach((button) => {
      const key = button.getAttribute('data-strategy-key') || 'rush-hq3';
      button.classList.toggle('isActive', key === state.activeStrategyKey);
    });
  }

  function canonicalNodeById(nodeId) {
    return canonicalNodes().find((node) => node.nodeId === nodeId) || null;
  }

  function canonicalEdges() {
    return Array.isArray(state.atlas?.canonicalEdges) ? state.atlas.canonicalEdges : [];
  }

  function canonicalNodeTitle(nodeId) {
    return canonicalNodeById(nodeId)?.title || nodeId || '';
  }

  function canonicalResourceGate(node) {
    if (!node || typeof node !== 'object') return null;
    const requirements = node.requirements || { items: [], affordable: true, missing: {} };
    const estimatedCost = node.metadata?.cost || costFromRequirements(requirements);
    if (!estimatedCost && !Array.isArray(requirements.items)) return null;
    return {
      gateId: node.nodeId,
      canonicalNodeId: node.nodeId,
      title: node.title || node.nodeId,
      kind: estimatedCost ? 'resource_spending_gate' : 'unlock_gate',
      requirements,
      estimatedCost,
      targetRef: node.target || null,
      actionRef: node.actionRef || null,
      gameplayAuthority: 'founders_plot_engine',
      mutationPolicy: 'advisory_only',
      source: 'founders_plot_engine',
      promotionStatus: 'canonical',
      executableByAtlas: false
    };
  }

  function engineGraphGroups(nodes) {
    const order = ['hq', 'building', 'production', 'planning', 'settlement', 'research', 'cohort', 'receipt', 'permission', 'policy', 'reward', 'constraint', 'effect', 'approval'];
    const labels = {
      hq: 'HQ',
      building: 'Buildings',
      production: 'Production',
      planning: 'Plans',
      settlement: 'Settlement',
      research: 'Research',
      cohort: 'Cohorts',
      receipt: 'Receipts',
      permission: 'Permissions',
      policy: 'Policies',
      reward: 'Rewards',
      constraint: 'Constraints',
      effect: 'Effects',
      approval: 'Approvals',
      other: 'Other'
    };
    const groups = new Map();
    for (const node of nodes) {
      const rawKind = String(node.kind || '');
      const key = rawKind.includes('receipt')
        ? 'receipt'
        : rawKind.includes('work_order') || rawKind.includes('cohort')
          ? 'cohort'
          : rawKind.includes('doctrine') || rawKind.includes('research')
            ? 'research'
            : rawKind.includes('settlement') || rawKind.includes('convoy') || rawKind.includes('outpost') || rawKind.includes('found_')
              ? 'settlement'
              : rawKind.includes('planning') || rawKind.includes('site_plan')
                ? 'planning'
                : rawKind.includes('production')
          ? 'production'
          : rawKind.includes('building')
            ? 'building'
            : rawKind.includes('hq')
              ? 'hq'
              : rawKind.includes('permission')
                ? 'permission'
                : rawKind.includes('policy')
                  ? 'policy'
                  : rawKind.includes('reward')
                    ? 'reward'
                    : rawKind.includes('constraint') || rawKind.includes('storage')
                      ? 'constraint'
                      : rawKind.includes('effect') || rawKind.includes('workshop_buff')
                        ? 'effect'
                        : order.includes(rawKind) ? rawKind : 'other';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(node);
    }
    return [...order, 'other']
      .filter((key) => groups.has(key))
      .map((key) => ({
        key,
        label: labels[key] || key,
        nodes: groups.get(key).sort((a, b) => String(a.nodeId).localeCompare(String(b.nodeId)))
      }));
  }

  function engineProposalNumber(id) {
    const node = $(id);
    return Math.max(0, Math.floor(Number(node?.value || 0)));
  }

  function makeEngineProposalGate({ stepId, title }) {
    const summary = state.atlas?.summary || {};
    const inventory = summary.inventory || {};
    const hqLevel = Math.max(1, Math.floor(Number(summary.hqLevel || 1)));
    const townXp = Math.max(0, Math.floor(Number(summary.townXp || 0)));
    const cost = {
      wood: engineProposalNumber('engineProposalWood'),
      stone: engineProposalNumber('engineProposalStone'),
      food: engineProposalNumber('engineProposalFood'),
      coin: engineProposalNumber('engineProposalCoin')
    };
    const estimatedCost = Object.entries(cost).reduce((acc, [key, amount]) => {
      if (amount > 0) acc[key] = amount;
      return acc;
    }, {});
    const items = Object.entries(estimatedCost).map(([resource, required]) => {
      const have = Math.max(0, Math.floor(Number(inventory[resource] || 0)));
      return {
        kind: 'resource',
        resource,
        have,
        required,
        missing: Math.max(0, required - have),
        advisory: true
      };
    });
    const xpRequired = engineProposalNumber('engineProposalXp');
    if (xpRequired > 0) {
      items.push({
        kind: 'xp',
        resource: 'XP',
        have: townXp,
        required: xpRequired,
        missing: Math.max(0, xpRequired - townXp),
        advisory: true
      });
    }
    const hqRequired = engineProposalNumber('engineProposalHq');
    if (hqRequired > 0) {
      items.push({
        kind: 'hq',
        resource: 'HQ',
        have: hqLevel,
        required: hqRequired,
        missing: Math.max(0, hqRequired - hqLevel),
        advisory: true
      });
    }
    if (!items.length) return null;
    const missing = items
      .filter((item) => Number(item.missing || 0) > 0)
      .reduce((acc, item) => {
        acc[item.resource || item.kind] = Number(item.missing || 0);
        return acc;
      }, {});
    const gateId = editorSafeId(`gate.${stepId}.${testId(title).toLowerCase()}`, `gate.${stepId}`);
    return {
      gateId,
      canonicalNodeId: null,
      title,
      kind: Object.keys(estimatedCost).length ? 'resource_spending_gate' : 'unlock_gate',
      requirements: {
        items,
        affordable: items.every((item) => Number(item.missing || 0) <= 0),
        missing,
        advisory: true
      },
      estimatedCost: Object.keys(estimatedCost).length ? estimatedCost : null,
      targetRef: { kind: 'canonical_graph_proposal_gate', id: gateId, type: 'progression_requirement' },
      actionRef: null,
      gameplayAuthority: 'strategy_editor_advisory',
      mutationPolicy: 'advisory_only',
      source: 'strategy_editor_gate_draft_v1',
      promotionStatus: 'draft',
      executableByAtlas: false
    };
  }

  function renderCanonicalCoverage() {
    const node = $('canonicalCoverage');
    if (!node) return;
    const dynamicNodes = canonicalNodes();
    const workOrderDrafts = dynamicNodes
      .filter((item) => item.kind === 'work_order_draft')
      .map((item) => item.nodeId)
      .slice(0, 3);
    const groups = [
      {
        title: 'HQ Spine',
        index: 1,
        summary: 'Command levels that the engine already owns.',
        nodes: ['hq.level.1', 'hq.level.2', 'hq.level.3', 'hq.level.4', 'hq.level.5', 'hq.level.6']
      },
      {
        title: 'Prerequisite Gates',
        index: 2,
        summary: 'StarCraft-style HQ gates, including required READY buildings.',
        nodes: ['hq.upgrade.2', 'hq.upgrade.3', 'hq.upgrade.4', 'hq.upgrade.5', 'hq.upgrade.6']
      },
      {
        title: 'Buildings',
        index: 3,
        summary: 'Functional structures already implemented in Founders Plot.',
        nodes: ['building.LUMBER_CAMP.place', 'building.FARM_PLOT.place', 'building.QUARRY.place', 'building.EXPEDITION_BOARD.place', 'building.WORKSHOP.place', 'building.MARKET_STALL.place']
      },
      {
        title: 'Loops + Receipts',
        index: 4,
        summary: 'Production, scouting, collection, selling, and buffs.',
        nodes: ['production.LUMBER_CAMP.PRODUCE', 'production.FARM_PLOT.PRODUCE', 'production.QUARRY.PRODUCE', 'production.EXPEDITION_BOARD.SCOUT', 'production.EXPEDITION_BOARD.collect', 'production.WORKSHOP.PRODUCE', 'effect.workshop.next_build_buff', 'production.MARKET_STALL.SELL', 'receipt.scout_report.scout_report_1_forest_ridge', 'planning.site_plan.scout_report_1_forest_ridge.draft']
      },
      {
        title: 'Expansion + Research',
        index: 5,
        summary: 'HQ6-HQ8 planning, outpost, and doctrine boundaries.',
        nodes: ['planning.site_plan.site_plan_scout_report_1_forest_ridge.review', 'settlement.claim.site_plan_scout_report_1_forest_ridge.prepare_convoy', 'research_lodge.advisory_stance', 'doctrine.survey_discipline']
      },
      {
        title: 'Cohorts + Policies',
        index: 6,
        summary: 'HQ9 work orders, delegation permissions, and safety caps.',
        nodes: ['cohort.work_order_planner', 'work_order.template.collect_ready_outputs_once', ...workOrderDrafts, 'permission.collectOutputs.unlock', 'permission.queueProduction.unlock', 'permission.setPriority.unlock', 'permission.sellSurplusFood.unlock', 'policy.sellDailyCoinCap', 'reward.quest.first-lumber.claim', 'reward.hq.level-5.claim', 'constraint.storage.wood', 'constraint.construction_slots']
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

  function renderEngineGraphStudio() {
    const root = $('engineGraphStudio');
    if (!root) return;
    const nodes = Array.isArray(state.atlas?.canonicalNodes) ? state.atlas.canonicalNodes : [];
    const edges = canonicalEdges();
    if (!nodes.length) {
      root.innerHTML = '<p class="atlasEmpty">Engine graph unavailable.</p>';
      return;
    }
    if (!state.engineGraph.selectedNodeId || !canonicalNodeById(state.engineGraph.selectedNodeId)) {
      state.engineGraph.selectedNodeId = nodes.find((node) => node.nodeId === 'hq.level.1')?.nodeId || nodes[0].nodeId;
    }
    const selected = canonicalNodeById(state.engineGraph.selectedNodeId) || nodes[0];
    const incoming = edges.filter((edge) => edge.to === selected.nodeId);
    const outgoing = edges.filter((edge) => edge.from === selected.nodeId);
    const gates = nodes.filter((node) => hasConcreteGate(canonicalResourceGate(node))).length;
    const actionRefs = nodes.filter((node) => node.actionRef?.tool).length;
    const groups = engineGraphGroups(nodes);
    const defaultProposalTitle = `Propose after ${selected.title || selected.nodeId}`;
    const selectedGate = canonicalResourceGate(selected);
    const actionRef = selected.actionRef || null;
    const blockedBy = Array.isArray(selected.availability?.blockedBy) ? selected.availability.blockedBy : [];
    const boundary = selected.metadata?.boundary || actionRef?.authorityBoundary || actionRef?.note || null;
    root.innerHTML = `
      <div class="atlasEngineGraphShell">
        <div class="atlasEngineGraphMap">
          <div class="atlasEngineStats">
            <span><strong>${escapeHtml(nodes.length)}</strong> nodes</span>
            <span><strong>${escapeHtml(edges.length)}</strong> edges</span>
            <span><strong>${escapeHtml(gates)}</strong> gates</span>
            <span><strong>${escapeHtml(actionRefs)}</strong> tool refs</span>
            <span><strong>${escapeHtml(refsExecutableCount(nodes))}</strong> Atlas executes</span>
          </div>
          <div class="atlasEngineGroups">
            ${groups.map((group) => `
              <section class="atlasEngineGroup">
                <h3>${escapeHtml(group.label)}</h3>
                <div class="atlasEngineNodes">
                  ${group.nodes.map((item) => {
                    const selectedClass = item.nodeId === selected.nodeId ? ' isSelected' : '';
                    return `
                      <button class="atlasEngineNode${selectedClass} status-${escapeHtml(item.status || 'blocked')}" type="button" data-engine-node-id="${escapeHtml(item.nodeId)}" data-testid="progression-atlas-engine-node-${escapeHtml(testId(item.nodeId))}">
                        ${iconHtml(item.icon, 'atlasMiniIcon')}
                        <span>${escapeHtml(item.title || item.nodeId)}</span>
                        <small>${escapeHtml(item.nodeId)}</small>
                      </button>
                    `;
                  }).join('')}
                </div>
              </section>
            `).join('')}
          </div>
        </div>
        <aside class="atlasEngineInspector" data-testid="progression-atlas-engine-inspector">
          <div class="atlasEngineInspectorHead">
            ${iconHtml(selected.icon, 'atlasIcon')}
            <div>
              <h3>${escapeHtml(selected.title || selected.nodeId)}</h3>
              <code>${escapeHtml(selected.nodeId)}</code>
            </div>
          </div>
          <div class="atlasEngineBadges">
            <span>${escapeHtml(selected.kind || 'node')}</span>
            <span>${escapeHtml(selected.status || 'blocked')}</span>
            <span>${actionRef?.tool ? 'tool ref' : 'read model'}</span>
            <span>${actionRef?.tool ? 'Atlas metadata only' : 'server read model'}</span>
          </div>
          ${selected.metadata?.body ? `<p>${escapeHtml(selected.metadata.body)}</p>` : ''}
          ${boundary ? `<p class="atlasBoundaryNote">${escapeHtml(boundary)}</p>` : ''}
          ${resourceGateHtml(selectedGate)}
          ${blockedBy.length ? `<div class="atlasBlockedBy"><strong>Prerequisites</strong>${miniList(blockedBy.map((entry) => boundaryText(entry)))}</div>` : ''}
          ${actionRef?.tool ? `
            <div class="atlasActionRefBox" data-testid="progression-atlas-action-ref-boundary">
              <strong>Non-executable action ref</strong>
              <p>Tool: <code>${escapeHtml(actionRef.tool)}</code></p>
              ${actionRef.http?.method || actionRef.http?.path ? `<p>${escapeHtml(actionRef.http?.method || 'POST')} ${escapeHtml(actionRef.http?.path || '')}</p>` : ''}
              <p>Atlas cannot execute this ref. Founders Plot owns mutation, approval, idempotency, and receipts.</p>
            </div>
          ` : ''}
          <div class="atlasEngineEdges">
            <strong>Edges</strong>
            <dl>
              <div><dt>Incoming</dt><dd>${incoming.length ? incoming.map((edge) => escapeHtml(`${edge.kind || 'edge'} from ${canonicalNodeTitle(edge.from)}`)).join(', ') : 'none'}</dd></div>
              <div><dt>Outgoing</dt><dd>${outgoing.length ? outgoing.map((edge) => escapeHtml(`${edge.kind || 'edge'} to ${canonicalNodeTitle(edge.to)}`)).join(', ') : 'none'}</dd></div>
            </dl>
          </div>
          <fieldset class="atlasEngineProposal">
            <legend>Draft graph edit</legend>
            <label>
              <span>Proposal title</span>
              <input id="engineProposalTitle" data-testid="progression-atlas-engine-proposal-title" maxlength="80" value="${escapeHtml(defaultProposalTitle)}" />
            </label>
            <div class="atlasGateDraftGrid">
              <label><span>Wood</span><input id="engineProposalWood" data-testid="progression-atlas-engine-proposal-wood" type="number" min="0" step="1" inputmode="numeric" /></label>
              <label><span>Stone</span><input id="engineProposalStone" data-testid="progression-atlas-engine-proposal-stone" type="number" min="0" step="1" inputmode="numeric" /></label>
              <label><span>Food</span><input id="engineProposalFood" data-testid="progression-atlas-engine-proposal-food" type="number" min="0" step="1" inputmode="numeric" /></label>
              <label><span>Coin</span><input id="engineProposalCoin" data-testid="progression-atlas-engine-proposal-coin" type="number" min="0" step="1" inputmode="numeric" /></label>
              <label><span>XP</span><input id="engineProposalXp" data-testid="progression-atlas-engine-proposal-xp" type="number" min="0" step="1" inputmode="numeric" /></label>
              <label><span>HQ</span><input id="engineProposalHq" data-testid="progression-atlas-engine-proposal-hq" type="number" min="1" step="1" inputmode="numeric" /></label>
            </div>
            <button class="atlasButton" id="engineProposalDraftBtn" type="button" data-testid="progression-atlas-engine-draft-proposal">Add Proposal Step</button>
          </fieldset>
        </aside>
      </div>
    `;
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
        ${resourceGateHtml(step.resourceGate)}
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

  function uniqueEditorStepId(baseId) {
    const steps = Array.isArray(state.editor.strategy?.steps) ? state.editor.strategy.steps : [];
    const used = new Set(steps.map((step) => step.stepId));
    const base = editorSafeId(baseId || `editor.step.${steps.length + 1}`);
    if (!used.has(base)) return base;
    let index = 2;
    while (used.has(`${base}.${index}`)) index += 1;
    return `${base}.${index}`;
  }

  function resourceGateCandidates() {
    const seen = new Set();
    const out = [];
    function addGate(gate, fallback = {}) {
      if (!gate || typeof gate !== 'object') return;
      const gateId = gate.canonicalNodeId || gate.gateId || fallback.canonicalNodeId || fallback.stepId || fallback.nodeId;
      if (!gateId || seen.has(gateId)) return;
      const seenKey = String(gateId).toLowerCase();
      if (seen.has(seenKey)) return;
      const hasCanonicalNodeId = Object.prototype.hasOwnProperty.call(gate, 'canonicalNodeId');
      const canonicalNodeId = hasCanonicalNodeId ? (gate.canonicalNodeId || null) : (fallback.canonicalNodeId || gateId);
      const requirements = gate.requirements || fallback.requirements || { items: [], affordable: true, missing: {} };
      const estimatedCost = gate.estimatedCost || fallback.estimatedCost || costFromRequirements(requirements);
      const next = {
        ...clone(gate),
        gateId,
        canonicalNodeId,
        title: gate.title || fallback.title || gateId,
        requirements: clone(requirements),
        estimatedCost: clone(estimatedCost),
        targetRef: clone(gate.targetRef || fallback.targetRef || null),
        actionRef: clone(gate.actionRef || fallback.actionRef || null),
        gameplayAuthority: gate.gameplayAuthority || (canonicalNodeId ? 'founders_plot_engine' : 'strategy_editor_advisory'),
        mutationPolicy: gate.mutationPolicy || 'advisory_only',
        source: gate.source || 'progression_atlas_resource_gate_v1',
        promotionStatus: gate.promotionStatus || (canonicalNodeId ? 'canonical' : 'draft'),
        executableByAtlas: false
      };
      if (!hasConcreteGate(next)) return;
      seen.add(gateId);
      seen.add(seenKey);
      out.push(next);
    }

    const strategySources = [
      state.atlas?.recommendedStrategy,
      ...(Array.isArray(state.atlas?.strategyOptions) ? state.atlas.strategyOptions : []),
      state.draft,
      state.editor.strategy
    ].filter(Boolean);
    for (const strategy of strategySources) {
      for (const step of Array.isArray(strategy.steps) ? strategy.steps : []) {
        addGate(step.resourceGate || {
          gateId: step.canonicalNodeId || step.stepId,
          canonicalNodeId: step.canonicalNodeId,
          title: step.title,
          requirements: step.requirements,
          estimatedCost: step.estimatedCost,
          targetRef: step.targetRef,
          actionRef: step.actionRef,
          gameplayAuthority: step.canonicalNodeId ? 'founders_plot_engine' : 'strategy_editor_advisory',
          mutationPolicy: 'advisory_only',
          executableByAtlas: false
        }, step);
      }
    }
    for (const node of Array.isArray(state.atlas?.canonicalNodes) ? state.atlas.canonicalNodes : []) {
      addGate({
        gateId: node.nodeId,
        canonicalNodeId: node.nodeId,
        title: node.title,
        requirements: node.requirements,
        estimatedCost: node.metadata?.cost || costFromRequirements(node.requirements),
        targetRef: node.target,
        actionRef: node.actionRef,
        gameplayAuthority: 'founders_plot_engine',
        mutationPolicy: 'advisory_only',
        executableByAtlas: false
      }, node);
    }
    return out.sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')));
  }

  function selectedGateId(step) {
    return step?.resourceGate?.canonicalNodeId || step?.resourceGate?.gateId || '';
  }

  function gateOptions(selectedId) {
    const options = ['<option value="">No resource gate</option>'];
    for (const gate of resourceGateCandidates()) {
      const gateId = gate.canonicalNodeId || gate.gateId;
      const label = [gate.title || gateId, costText(gate.estimatedCost || costFromRequirements(gate.requirements)) || requirementText(gate.requirements)]
        .filter(Boolean)
        .join(' - ');
      const selected = gateId === selectedId ? ' selected' : '';
      options.push(`<option value="${escapeHtml(gateId)}"${selected}>${escapeHtml(label)}</option>`);
    }
    return options.join('');
  }

  function gateById(gateId) {
    const id = String(gateId || '').trim();
    if (!id) return null;
    return resourceGateCandidates().find((gate) => gate.gateId === id || gate.canonicalNodeId === id) || null;
  }

  function applyResourceGate(step, gateId) {
    if (!step) return;
    const gate = gateById(gateId);
    if (!gate) {
      step.resourceGate = null;
      if (step.editorEditable) {
        step.requirements = { items: [], affordable: true, missing: {} };
        step.estimatedCost = null;
      }
      return;
    }
    const requirements = clone(gate.requirements || { items: [], affordable: true, missing: {} });
    const estimatedCost = clone(gate.estimatedCost || costFromRequirements(requirements));
    const hasCanonicalNodeId = Object.prototype.hasOwnProperty.call(gate, 'canonicalNodeId');
    const canonicalNodeId = hasCanonicalNodeId ? (gate.canonicalNodeId || null) : (gate.gateId || null);
    step.resourceGate = {
      gateId: gate.gateId,
      canonicalNodeId,
      title: gate.title,
      kind: gate.kind || 'resource_spending_gate',
      requirements,
      estimatedCost,
      targetRef: clone(gate.targetRef || null),
      actionRef: clone(gate.actionRef || null),
      gameplayAuthority: gate.gameplayAuthority || (canonicalNodeId ? 'founders_plot_engine' : 'strategy_editor_advisory'),
      mutationPolicy: 'advisory_only',
      source: gate.source || 'progression_atlas_resource_gate_v1',
      promotionStatus: gate.promotionStatus || (canonicalNodeId ? 'canonical' : 'draft'),
      executableByAtlas: false
    };
    step.requirements = clone(requirements);
    step.estimatedCost = clone(estimatedCost);
  }

  function fillGateDraftForm(step) {
    const gate = step?.resourceGate && typeof step.resourceGate === 'object' ? step.resourceGate : null;
    const title = $('editorGateTitle');
    if (title) title.value = gate?.title || '';
    const cost = gate?.estimatedCost || costFromRequirements(gate?.requirements);
    setNumberInputValue('editorGateWood', cost?.wood || 0);
    setNumberInputValue('editorGateStone', cost?.stone || 0);
    setNumberInputValue('editorGateFood', cost?.food || 0);
    setNumberInputValue('editorGateCoin', cost?.coin || 0);
    const items = Array.isArray(gate?.requirements?.items) ? gate.requirements.items : [];
    const xp = items.find((item) => item.kind === 'xp' || item.resource === 'XP');
    const hq = items.find((item) => item.kind === 'hq' || item.resource === 'HQ');
    setNumberInputValue('editorGateXp', xp?.required || 0);
    setNumberInputValue('editorGateHq', hq?.required || 0);
  }

  function createDraftGateForStep(step) {
    if (!step) return null;
    const inventory = state.atlas?.summary?.inventory || {};
    const hqLevel = Math.max(1, Math.floor(Number(state.atlas?.summary?.hqLevel || 1)));
    const townXp = Math.max(0, Math.floor(Number(state.atlas?.summary?.townXp || 0)));
    const title = String($('editorGateTitle')?.value || `${step.title || 'Strategy Step'} gate`).trim().slice(0, 80) || `${step.title || 'Strategy Step'} gate`;
    const cost = {
      wood: numberInputValue('editorGateWood'),
      stone: numberInputValue('editorGateStone'),
      food: numberInputValue('editorGateFood'),
      coin: numberInputValue('editorGateCoin')
    };
    const estimatedCost = Object.entries(cost).reduce((acc, [key, amount]) => {
      if (amount > 0) acc[key] = amount;
      return acc;
    }, {});
    const items = Object.entries(estimatedCost).map(([resource, required]) => {
      const have = Math.max(0, Math.floor(Number(inventory[resource] || 0)));
      return {
        kind: 'resource',
        resource,
        have,
        required,
        missing: Math.max(0, required - have),
        advisory: true
      };
    });
    const xpRequired = numberInputValue('editorGateXp');
    if (xpRequired > 0) {
      items.push({
        kind: 'xp',
        resource: 'XP',
        have: townXp,
        required: xpRequired,
        missing: Math.max(0, xpRequired - townXp),
        advisory: true
      });
    }
    const hqRequired = numberInputValue('editorGateHq');
    if (hqRequired > 0) {
      items.push({
        kind: 'hq',
        resource: 'HQ',
        have: hqLevel,
        required: hqRequired,
        missing: Math.max(0, hqRequired - hqLevel),
        advisory: true
      });
    }
    if (!items.length) return null;
    const missing = items
      .filter((item) => Number(item.missing || 0) > 0)
      .reduce((acc, item) => {
        acc[item.resource || item.kind] = Number(item.missing || 0);
        return acc;
      }, {});
    const gateId = editorSafeId(`gate.${step.stepId}.${testId(title).toLowerCase()}`, `gate.${step.stepId}`);
    return {
      gateId,
      canonicalNodeId: null,
      title,
      kind: Object.keys(estimatedCost).length ? 'resource_spending_gate' : 'unlock_gate',
      requirements: {
        items,
        affordable: items.every((item) => Number(item.missing || 0) <= 0),
        missing,
        advisory: true
      },
      estimatedCost: Object.keys(estimatedCost).length ? estimatedCost : null,
      targetRef: { kind: 'editor_resource_gate', id: gateId, type: 'progression_requirement' },
      actionRef: null,
      gameplayAuthority: 'strategy_editor_advisory',
      mutationPolicy: 'advisory_only',
      source: 'strategy_editor_gate_draft_v1',
      promotionStatus: 'draft',
      executableByAtlas: false
    };
  }

  function syncEditorForm() {
    const step = selectedEditorStep();
    if (!step) return;
    const title = $('editorStepTitle');
    const reason = $('editorStepReason');
    const before = $('editorStepBefore');
    const after = $('editorStepAfter');
    const gate = $('editorStepGate');
    const prompt = $('editorIconPrompt');
    if (title) title.value = step.title || '';
    if (reason) reason.value = step.reason || '';
    if (before) before.innerHTML = stepOptions(step.beforeStepId, step.stepId);
    if (after) after.innerHTML = stepOptions(step.afterStepId, step.stepId);
    if (gate) gate.innerHTML = gateOptions(selectedGateId(step));
    fillGateDraftForm(step);
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
        const gateLabel = step.resourceGate?.title ? `Gate: ${step.resourceGate.title}` : '';
        return `
          <button class="atlasEditorStep${selected ? ' isActive' : ''}" type="button" data-editor-step-id="${escapeHtml(step.stepId)}" data-testid="progression-atlas-editor-step-${escapeHtml(testId(step.stepId))}">
            ${iconHtml(step.icon, 'atlasMiniIcon')}
            <span class="atlasEditorStepText">
              <span>${escapeHtml(index + 1)}. ${escapeHtml(step.title || step.stepId)}</span>
              ${gateLabel ? `<small>${escapeHtml(gateLabel)}</small>` : ''}
            </span>
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
    const gate = $('editorStepGate');
    const prompt = $('editorIconPrompt');
    step.title = String(title?.value || step.title || 'Strategy Step').trim().slice(0, 80) || 'Strategy Step';
    step.reason = String(reason?.value || step.reason || 'Player-authored progression step.').trim().slice(0, 400);
    step.beforeStepId = String(before?.value || '').trim() || null;
    step.afterStepId = String(after?.value || '').trim() || null;
    step.connections = {
      beforeStepId: step.beforeStepId,
      afterStepId: step.afterStepId
    };
    applyResourceGate(step, gate?.value || '');
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

  function useDraftResourceGate() {
    const step = applyEditorForm();
    if (!step) return;
    const gate = createDraftGateForStep(step);
    const explanation = $('atlasExplanation');
    if (!gate) {
      if (explanation) explanation.textContent = 'Add at least one resource, XP, or HQ requirement before using a draft gate.';
      return;
    }
    step.resourceGate = gate;
    step.requirements = clone(gate.requirements);
    step.estimatedCost = clone(gate.estimatedCost);
    state.draft = state.editor.strategy;
    renderAll();
    if (explanation) explanation.textContent = `Attached draft resource gate "${gate.title}" to ${step.title}.`;
  }

  function draftEngineGraphProposal() {
    const selected = canonicalNodeById(state.engineGraph.selectedNodeId);
    const explanation = $('atlasExplanation');
    if (!selected) {
      if (explanation) explanation.textContent = 'Select an engine graph node before drafting a proposal.';
      return;
    }
    if (state.editor.open && state.editor.strategy) applyEditorForm();
    if (!state.editor.strategy) state.editor.strategy = normalizeEditorStrategy(currentEditableStrategy());
    state.editor.open = true;
    if (!Array.isArray(state.editor.strategy.steps)) state.editor.strategy.steps = [];
    const steps = state.editor.strategy.steps;
    const title = String($('engineProposalTitle')?.value || `Propose after ${selected.title || selected.nodeId}`)
      .trim()
      .slice(0, 80) || `Propose after ${selected.title || selected.nodeId}`;
    const stepId = uniqueEditorStepId(`editor.engine.${testId(title).toLowerCase()}`);
    const knownIds = new Set(steps.map((step) => step.stepId));
    const previous = steps[steps.length - 1] || null;
    const gate = makeEngineProposalGate({ stepId, title });
    const step = {
      stepId,
      nodeId: stepId,
      title,
      status: 'planned',
      stepKind: 'custom_note',
      canonicalNodeId: null,
      requestedCanonicalNodeId: null,
      reason: `Draft canonical graph proposal after ${selected.title || selected.nodeId}. Promotion is required before this becomes Founders Plot engine truth.`,
      icon: globalIcon('progression.generic', {
        label: title,
        symbol: 'GE',
        tone: 'custom',
        source: 'progression_atlas_engine_graph_editor'
      }),
      targetRef: {
        kind: 'canonical_graph_proposal',
        id: stepId,
        type: selected.nodeId
      },
      canonicalProposal: {
        proposalId: stepId,
        title,
        parentNodeId: selected.nodeId,
        parentTitle: selected.title || selected.nodeId,
        nodeKind: selected.kind || 'custom',
        source: 'strategy_editor_canonical_proposal_v1',
        promotionStatus: 'draft',
        authorityBoundary: 'requires_engine_promotion'
      },
      requirements: gate?.requirements || { items: [], affordable: true, missing: {}, advisory: true },
      estimatedCost: gate?.estimatedCost || null,
      resourceGate: gate,
      blocker: null,
      nextAction: 'Review and promote this proposal into engine rules when ready.',
      beforeStepId: knownIds.has(selected.nodeId) ? selected.nodeId : (previous?.stepId || null),
      afterStepId: null,
      connections: {
        beforeStepId: knownIds.has(selected.nodeId) ? selected.nodeId : (previous?.stepId || null),
        afterStepId: null
      },
      iconPrompt: `${title}, Founders Plot canonical graph proposal icon`,
      editorEditable: true
    };
    steps.push(step);
    state.editor.selectedStepId = stepId;
    state.draft = state.editor.strategy;
    renderAll();
    $('strategyEditorPanel')?.scrollIntoView({ block: 'nearest' });
    if (explanation) explanation.textContent = `Added "${title}" as a draft engine-graph proposal. It is not canonical until promoted into Founders Plot engine code.`;
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
      resourceGate: null,
      blocker: null,
      nextAction: 'Scout Ridge',
      beforeStepId: previous?.stepId || null,
      afterStepId: null,
      connections: { beforeStepId: previous?.stepId || null, afterStepId: null },
      iconPrompt: 'frontier ridge scout marker, Agent Town strategy icon',
      editorEditable: true
    };
    applyResourceGate(step, gateById('hq.level.3') ? 'hq.level.3' : (gateById('hq.level.2') ? 'hq.level.2' : ''));
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
    renderWorkbench();
    renderOperationalBoundaries();
    renderCivicOperations();
    renderTemplateControls();
    renderCanonicalCoverage();
    renderEngineGraphStudio();
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
    const createGateBtn = $('editorCreateGateBtn');
    if (createGateBtn) createGateBtn.addEventListener('click', useDraftResourceGate);
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
      const engineNode = event.target.closest('.atlasEngineNode');
      if (engineNode) {
        state.engineGraph.selectedNodeId = engineNode.getAttribute('data-engine-node-id');
        renderAll();
        return;
      }
      const engineDraft = event.target.closest('#engineProposalDraftBtn');
      if (engineDraft) {
        draftEngineGraphProposal();
        return;
      }
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
