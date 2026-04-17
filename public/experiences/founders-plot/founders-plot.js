/* eslint-disable no-restricted-globals */
/**
 * Founders Plot — frontier storybook client.
 *
 * A small, dependency-free SPA that renders the plot grid, resource strip,
 * quest banner, building panel, and Foreman permissions. All mutations go
 * through /api/founders-plot/* endpoints exposed by server/founders_plot.
 */

(() => {
  'use strict';

  const API = {
    state:   '/api/founders-plot/state',
    place:   '/api/founders-plot/place-building',
    queue:   '/api/founders-plot/queue-job',
    collect: '/api/founders-plot/collect-outputs',
    upgrade: '/api/founders-plot/upgrade-building',
    priority:'/api/founders-plot/set-priority',
    reward:  '/api/founders-plot/claim-reward',
    policy:  '/api/founders-plot/policy',
    recapAck:'/api/founders-plot/recap/ack',
    tools:   '/api/founders-plot/tools',
  };

  const RES_ICONS = { wood: '🪵', stone: '🪨', food: '🌾', coin: '🪙' };
  const BUILDING_LABELS = {
    HQ: 'Headquarters',
    LUMBER_CAMP: 'Lumber Camp',
    FARM_PLOT: 'Farm Plot',
    QUARRY: 'Quarry',
    WORKSHOP: 'Workshop',
    MARKET_STALL: 'Market Stall',
  };
  const GRID = { width: 3, height: 3 };

  const idemCounter = { n: 0 };
  function idem(tag) {
    idemCounter.n += 1;
    return `fp-${tag}-${Date.now().toString(36)}-${idemCounter.n.toString(36)}`;
  }

  const els = {
    quest:       document.querySelector('[data-testid="fp-quest-step"]'),
    questHint:   document.querySelector('[data-testid="fp-quest-hint"]'),
    resWood:     document.querySelector('[data-testid="fp-res-wood"]'),
    resStone:    document.querySelector('[data-testid="fp-res-stone"]'),
    resFood:     document.querySelector('[data-testid="fp-res-food"]'),
    resCoin:     document.querySelector('[data-testid="fp-res-coin"]'),
    hqLevel:     document.querySelector('[data-testid="fp-hq-level"]'),
    hqXp:        document.querySelector('[data-testid="fp-hq-xp"]'),
    grid:        document.getElementById('fp-grid'),
    palette:     document.getElementById('fp-palette'),
    palClose:    document.getElementById('fp-close-palette'),
    bldTitle:    document.getElementById('fp-bld-title'),
    bldBody:     document.getElementById('fp-bld-body'),
    foremanBody: document.getElementById('fp-foreman-body'),
    foremanAct:  document.getElementById('fp-foreman-act'),
    foremanToggle: document.getElementById('fp-foreman-toggle'),
    foremanStatus: document.querySelector('[data-testid="fp-foreman-status"]'),
    approvals:   document.querySelector('[data-testid="fp-approvals"]'),
    policyForm:  document.getElementById('fp-policy-form'),
    jobsBody:    document.getElementById('fp-jobs-body'),
    drawer:      document.getElementById('fp-recap-drawer'),
    drawerOpen:  document.getElementById('fp-drawer-toggle'),
    drawerClose: document.getElementById('fp-drawer-close'),
    drawerBody:  document.getElementById('fp-recap-body'),
    toast:       document.getElementById('fp-toast'),
  };

  const state = {
    plotId: null,
    snapshot: null,
    selected: null,
    paletteOpenForTile: null,
    pollTimer: null,
    unlocks: ['LUMBER_CAMP'],
  };

  async function api(path, method = 'GET', body = null) {
    const init = { method, headers: { 'accept': 'application/json' } };
    if (body != null) {
      init.headers['content-type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
    try {
      const res = await fetch(path, init);
      const data = await res.json().catch(() => ({ ok: false }));
      return { status: res.status, data };
    } catch (err) {
      return { status: 0, data: { ok: false, error: { code: 'NETWORK', message: String(err) } } };
    }
  }

  function toast(msg, kind = 'info') {
    if (!els.toast) return;
    els.toast.textContent = msg;
    els.toast.dataset.kind = kind;
    els.toast.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { els.toast.hidden = true; }, 2400);
  }

  // --- Render ---------------------------------------------------------------

  function renderResources(plot) {
    const inv = plot.inventory || {};
    if (els.resWood)  els.resWood.textContent  = String(inv.wood  || 0);
    if (els.resStone) els.resStone.textContent = String(inv.stone || 0);
    if (els.resFood)  els.resFood.textContent  = String(inv.food  || 0);
    if (els.resCoin)  els.resCoin.textContent  = String(inv.coin  || 0);
    if (els.hqLevel)  els.hqLevel.textContent  = `HQ Lv ${plot.hqLevel || 1}`;
    if (els.hqXp)     els.hqXp.textContent     = `${plot.townXp || 0} XP`;
  }

  function renderQuest(snapshot) {
    const q = snapshot && snapshot.quest;
    if (!q || !els.quest) return;
    els.quest.textContent = q.label || q.stepId || 'Chart the plot';
    if (els.questHint) els.questHint.textContent = q.hint || '';
  }

  function renderGrid(bundle) {
    if (!els.grid) return;
    const buildings = bundle.buildings || [];
    const pads = bundle.pads || defaultPads();
    els.grid.innerHTML = '';
    els.grid.style.setProperty('--fp-grid-cols', String(GRID.width));
    els.grid.style.setProperty('--fp-grid-rows', String(GRID.height));
    for (let y = 0; y < GRID.height; y += 1) {
      for (let x = 0; x < GRID.width; x += 1) {
        const pad = pads.find((p) => p.x === x && p.y === y);
        const building = buildings.find((b) => b.x === x && b.y === y);
        const tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'fp-tile';
        tile.dataset.testid = `fp-tile-${x}-${y}`;
        tile.dataset.x = String(x); tile.dataset.y = String(y);
        tile.setAttribute('role', 'gridcell');
        tile.setAttribute('aria-label', building
          ? `${BUILDING_LABELS[building.type] || building.type} at (${x}, ${y})`
          : `Empty pad at (${x}, ${y})`);
        if (!pad) {
          tile.classList.add('fp-tile--void');
          tile.setAttribute('aria-disabled', 'true');
          tile.disabled = true;
        } else if (building) {
          tile.classList.add('fp-tile--occupied', `fp-tile--${building.type.toLowerCase()}`);
          const label = document.createElement('span');
          label.className = 'fp-tile__label';
          label.textContent = BUILDING_LABELS[building.type] || building.type;
          tile.appendChild(label);
          const status = document.createElement('span');
          status.className = `fp-tile__status fp-tile__status--${building.state.toLowerCase()}`;
          status.textContent = humanizeState(building);
          tile.appendChild(status);
          if (building.state === 'OUTPUT_READY') {
            tile.dataset.ready = '1';
            tile.classList.add('fp-tile--ready');
          }
        } else {
          tile.classList.add('fp-tile--empty');
          const plus = document.createElement('span');
          plus.className = 'fp-tile__plus';
          plus.textContent = '+';
          tile.appendChild(plus);
        }
        tile.addEventListener('click', () => onTileClick(x, y, building));
        els.grid.appendChild(tile);
      }
    }
  }

  function humanizeState(b) {
    switch (b.state) {
      case 'UNDER_CONSTRUCTION': return 'Building…';
      case 'UPGRADING': return 'Upgrading…';
      case 'PRODUCING': return 'Producing…';
      case 'OUTPUT_READY': return 'Ready to collect';
      case 'READY': return 'Idle';
      default: return b.state;
    }
  }

  function defaultPads() {
    return [
      { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 },
      { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 },
    ];
  }

  function renderBuildingPanel(bundle) {
    if (!els.bldBody) return;
    const sel = state.selected;
    if (!sel) {
      els.bldTitle.textContent = 'Select a tile';
      els.bldBody.innerHTML = '<p class="fp-helper">Click a tile on the plot. Empty tiles can host a building. Ready buildings can be upgraded. Buildings with outputs can be collected.</p>';
      return;
    }
    if (sel.kind === 'empty') {
      els.bldTitle.textContent = `Empty pad (${sel.x}, ${sel.y})`;
      els.bldBody.innerHTML = '';
      const hint = document.createElement('p');
      hint.className = 'fp-helper';
      hint.textContent = 'Choose a blueprint to place here.';
      els.bldBody.appendChild(hint);
      openPalette(sel.x, sel.y, bundle);
      return;
    }
    const b = sel.building;
    const def = (bundle.buildingDefs || {})[b.type] || {};
    els.bldTitle.textContent = `${BUILDING_LABELS[b.type] || b.type} · Lv ${b.level || 1}`;
    els.bldBody.innerHTML = '';
    const status = document.createElement('p');
    status.className = 'fp-helper';
    status.textContent = humanizeState(b);
    els.bldBody.appendChild(status);
    if (b.type !== 'HQ') {
      const coords = document.createElement('p');
      coords.className = 'fp-helper';
      coords.textContent = `Pad (${b.x}, ${b.y})`;
      els.bldBody.appendChild(coords);
    }
    const actions = document.createElement('div');
    actions.className = 'fp-panel__actions';

    if (b.state === 'OUTPUT_READY') {
      const collectBtn = brassBtn('Collect outputs', 'fp-btn-collect', () => doCollect(b.buildingId));
      collectBtn.dataset.testid = 'fp-btn-collect';
      actions.appendChild(collectBtn);
    }
    if (b.state === 'READY' && def.produces) {
      const produceBtn = brassBtn('Queue production', 'fp-btn-queue', () => doQueueJob(b.buildingId, 'PRODUCE'));
      produceBtn.dataset.testid = 'fp-btn-queue';
      actions.appendChild(produceBtn);
    }
    if (b.state === 'READY' && b.type === 'MARKET_STALL') {
      const sellBtn = brassBtn('Sell food (daily cap)', 'fp-btn-sell', () => doQueueJob(b.buildingId, 'SELL'));
      actions.appendChild(sellBtn);
    }
    if (b.state === 'READY' && (b.type === 'HQ' || (def.upgrade && def.upgrade[b.level || 1]))) {
      const upLabel = b.type === 'HQ' ? 'Upgrade HQ' : 'Upgrade building';
      const upBtn = brassBtn(upLabel, 'fp-btn-upgrade', () => doUpgrade(b.buildingId));
      upBtn.dataset.testid = 'fp-btn-upgrade';
      actions.appendChild(upBtn);
    }
    els.bldBody.appendChild(actions);

    if (b.type !== 'HQ' && b.state === 'READY') {
      const priorityRow = document.createElement('div');
      priorityRow.className = 'fp-priority';
      ['WOOD', 'STONE', 'FOOD', 'BALANCED'].forEach((p) => {
        const btn = brassBtn(p[0] + p.slice(1).toLowerCase(), `fp-btn-priority-${p}`, () => doSetPriority(b.buildingId, p));
        btn.classList.toggle('fp-brass-btn--active', (b.priority || 'BALANCED') === p);
        priorityRow.appendChild(btn);
      });
      const legend = document.createElement('p');
      legend.className = 'fp-helper';
      legend.textContent = 'Priority biases one resource output at HQ 4+.';
      els.bldBody.appendChild(priorityRow);
      els.bldBody.appendChild(legend);
    }
  }

  function brassBtn(label, id, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'fp-brass-btn';
    b.textContent = label;
    if (id) b.id = id;
    b.addEventListener('click', onClick);
    return b;
  }

  function renderJobs(bundle) {
    if (!els.jobsBody) return;
    const running = (bundle.jobs || []).filter((j) => j.status === 'RUNNING' || j.status === 'QUEUED');
    if (!running.length) {
      els.jobsBody.innerHTML = '<p class="fp-helper">No jobs running.</p>';
      return;
    }
    const ul = document.createElement('ul');
    ul.className = 'fp-joblist';
    for (const j of running) {
      const li = document.createElement('li');
      li.className = 'fp-joblist__item';
      li.dataset.testid = `fp-job-${j.jobId}`;
      const remaining = Math.max(0, Math.round(((j.endsAt || 0) - Date.now()) / 1000));
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      li.textContent = `${j.kind} · ${BUILDING_LABELS[findType(bundle, j.buildingId)] || j.buildingId} · ${mins}m ${secs}s`;
      ul.appendChild(li);
    }
    els.jobsBody.innerHTML = '';
    els.jobsBody.appendChild(ul);
  }

  function findType(bundle, buildingId) {
    const b = (bundle.buildings || []).find((x) => x.buildingId === buildingId);
    return b ? b.type : '';
  }

  function renderForeman(bundle) {
    if (!els.foremanStatus) return;
    const pol = (bundle.policy) || {};
    const perm = (bundle.permissions || {});
    const active = ['collectOutputs','queueProduction','setPriority','sellSurplusFood']
      .filter((k) => pol[k]).length;
    const total = Object.keys(perm).length || 4;
    els.foremanStatus.textContent = pol.emergencyPause
      ? 'Foreman paused. All autonomy halted.'
      : (active === 0
        ? 'Foreman is observing. Toggle permissions to grant autonomy.'
        : `Foreman running with ${active} of ${total} permissions.`);
    if (els.policyForm) {
      const set = (name, val) => { const el = els.policyForm.elements[name]; if (el) el.checked = !!val; };
      set('collectOutputs', pol.collectOutputs);
      set('queueProduction', pol.queueProduction);
      set('setPriority', pol.setPriority);
      set('sellSurplusFood', pol.sellSurplusFood);
      set('emergencyPause', pol.emergencyPause);
    }
    renderApprovals(bundle.pendingApprovals || []);
  }

  function renderApprovals(list) {
    if (!els.approvals) return;
    if (!list.length) {
      els.approvals.innerHTML = '';
      return;
    }
    els.approvals.innerHTML = '';
    for (const a of list) {
      const card = document.createElement('div');
      card.className = 'fp-approval';
      card.dataset.testid = `fp-approval-${a.approvalId}`;
      const title = document.createElement('strong');
      title.textContent = a.title || a.actionName || 'Foreman wants to act';
      card.appendChild(title);
      const body = document.createElement('p');
      body.textContent = a.body || a.reason || '';
      card.appendChild(body);
      const row = document.createElement('div');
      row.className = 'fp-approval__row';
      const approve = brassBtn('Approve', `fp-approve-${a.approvalId}`, () => resolveApproval(a.approvalId, 'APPROVED'));
      const deny = brassBtn('Deny', `fp-deny-${a.approvalId}`, () => resolveApproval(a.approvalId, 'DENIED'));
      row.appendChild(approve); row.appendChild(deny);
      card.appendChild(row);
      els.approvals.appendChild(card);
    }
  }

  // --- Events ---------------------------------------------------------------

  function onTileClick(x, y, building) {
    if (building) {
      state.selected = { kind: 'building', building, x, y };
      closePalette();
    } else {
      state.selected = { kind: 'empty', x, y };
    }
    renderBuildingPanel(state.snapshot || {});
  }

  function openPalette(x, y, bundle) {
    if (!els.palette) return;
    els.palette.hidden = false;
    els.palClose.hidden = false;
    els.palette.innerHTML = '';
    const unlocks = (bundle.unlocks && bundle.unlocks.buildings) || state.unlocks;
    const defs = bundle.buildingDefs || {};
    unlocks.forEach((type) => {
      const def = defs[type] || {};
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'fp-palette__item fp-brass-btn';
      card.dataset.testid = `fp-palette-${type}`;
      const name = BUILDING_LABELS[type] || type;
      const cost = def.construction && def.construction.cost
        ? Object.entries(def.construction.cost).map(([k, v]) => `${v}${RES_ICONS[k] || k}`).join(' ')
        : 'free';
      card.innerHTML = `<strong>${name}</strong><span class="fp-palette__cost">${cost}</span>`;
      card.addEventListener('click', () => doPlace(type, x, y));
      els.palette.appendChild(card);
    });
    if (els.palClose) els.palClose.onclick = closePalette;
  }

  function closePalette() {
    if (!els.palette) return;
    els.palette.hidden = true;
    els.palClose.hidden = true;
  }

  // --- Actions --------------------------------------------------------------

  async function loadState() {
    const { data } = await api(API.state);
    if (!data || !data.ok) {
      toast('Unable to load plot.', 'danger');
      return;
    }
    state.plotId = data.plotId;
    state.snapshot = data.state || {};
    const bundle = normalizeBundle(data);
    state.unlocks = bundle.unlocks?.buildings || state.unlocks;
    renderAll(bundle);
  }

  function normalizeBundle(envelope) {
    const s = envelope.state || {};
    const plot = s.plot || {};
    return {
      plotId: envelope.plotId || plot.plotId,
      plot,
      inventory: plot.inventory || {},
      buildings: s.buildings || plot.buildings || [],
      jobs: s.jobs || plot.jobs || [],
      policy: s.policy || plot.policy || {},
      permissions: s.permissions || {},
      pendingApprovals: s.approvals || s.pendingApprovals || plot.pendingApprovals || [],
      quest: s.quest || plot.quest || null,
      unlocks: s.unlocks || {},
      buildingDefs: s.buildingDefs || {},
      pads: s.pads || plot.pads || defaultPads(),
      hqLevel: plot.hqLevel || 1,
      townXp: plot.townXp || 0,
      recap: envelope.recap || null,
    };
  }

  function renderAll(bundle) {
    renderResources(bundle.plot || {});
    renderQuest(bundle);
    renderGrid(bundle);
    renderJobs(bundle);
    renderBuildingPanel(bundle);
    renderForeman(bundle);
    renderRecap(bundle);
  }

  function renderRecap(bundle) {
    if (!els.drawerBody) return;
    const r = bundle.recap;
    if (!r || !r.items || !r.items.length) {
      els.drawerBody.innerHTML = '<p class="fp-helper">Nothing new yet.</p>';
      return;
    }
    const ul = document.createElement('ul');
    ul.className = 'fp-recap__list';
    for (const item of r.items) {
      const li = document.createElement('li');
      li.textContent = item.summary || item.eventType;
      ul.appendChild(li);
    }
    els.drawerBody.innerHTML = '';
    const title = document.createElement('h3');
    title.textContent = r.title || 'While you were away';
    els.drawerBody.appendChild(title);
    const summary = document.createElement('p');
    summary.className = 'fp-helper';
    summary.textContent = r.summary || '';
    els.drawerBody.appendChild(summary);
    els.drawerBody.appendChild(ul);
  }

  async function doPlace(type, x, y) {
    closePalette();
    const { data } = await api(API.place, 'POST', {
      plotId: state.plotId, type, x, y,
      actor: 'HUMAN', idempotencyKey: idem(`place-${type}-${x}-${y}`),
    });
    if (!data.ok) return toast(data.error?.message || 'Could not place.', 'danger');
    toast(`Placed ${BUILDING_LABELS[type] || type}.`);
    await loadState();
  }

  async function doQueueJob(buildingId, kind) {
    const { data } = await api(API.queue, 'POST', {
      plotId: state.plotId, buildingId, kind,
      actor: 'HUMAN', idempotencyKey: idem(`queue-${buildingId}-${kind}`),
    });
    if (!data.ok) return toast(data.error?.message || 'Could not start job.', 'danger');
    toast('Job queued.');
    await loadState();
  }

  async function doCollect(buildingId) {
    const { data } = await api(API.collect, 'POST', {
      plotId: state.plotId, buildingId,
      actor: 'HUMAN', idempotencyKey: idem(`collect-${buildingId}`),
    });
    if (!data.ok) return toast(data.error?.message || 'Nothing to collect.', 'danger');
    toast('Collected outputs.');
    await loadState();
  }

  async function doUpgrade(buildingId) {
    const { data } = await api(API.upgrade, 'POST', {
      plotId: state.plotId, buildingId,
      actor: 'HUMAN', idempotencyKey: idem(`upgrade-${buildingId}`),
    });
    if (!data.ok) return toast(data.error?.message || 'Cannot upgrade.', 'danger');
    toast('Upgrade started.');
    await loadState();
  }

  async function doSetPriority(buildingId, priority) {
    const { data } = await api(API.priority, 'POST', {
      plotId: state.plotId, buildingId, priority,
      actor: 'HUMAN', idempotencyKey: idem(`priority-${buildingId}-${priority}`),
    });
    if (!data.ok) return toast(data.error?.message || 'Cannot set priority.', 'danger');
    toast(`Priority set to ${priority}.`);
    await loadState();
  }

  async function resolveApproval(approvalId, decision) {
    const { data } = await api(`/api/founders-plot/approvals/${encodeURIComponent(approvalId)}/resolve`, 'POST', {
      plotId: state.plotId, decision,
    });
    if (!data.ok) return toast(data.error?.message || 'Cannot resolve approval.', 'danger');
    toast(`Approval ${decision.toLowerCase()}.`);
    await loadState();
  }

  async function savePolicy(ev) {
    ev.preventDefault();
    const fd = new FormData(els.policyForm);
    const input = {
      plotId: state.plotId,
      collectOutputs: fd.get('collectOutputs') === 'on',
      queueProduction: fd.get('queueProduction') === 'on',
      setPriority: fd.get('setPriority') === 'on',
      sellSurplusFood: fd.get('sellSurplusFood') === 'on',
      emergencyPause: fd.get('emergencyPause') === 'on',
    };
    const { data } = await api(API.policy, 'POST', input);
    if (!data.ok) return toast(data.error?.message || 'Could not save permissions.', 'danger');
    toast('Foreman permissions saved.');
    await loadState();
  }

  async function acknowledgeRecap() {
    await api(API.recapAck, 'POST', { plotId: state.plotId });
    toggleDrawer(false);
    await loadState();
  }

  function toggleDrawer(open) {
    if (!els.drawer) return;
    const next = typeof open === 'boolean' ? open : els.drawer.getAttribute('aria-hidden') === 'true';
    els.drawer.setAttribute('aria-hidden', next ? 'false' : 'true');
    els.drawer.classList.toggle('fp-drawer--open', next);
  }

  // --- Boot -----------------------------------------------------------------

  function bind() {
    if (els.policyForm) els.policyForm.addEventListener('submit', savePolicy);
    if (els.drawerOpen) els.drawerOpen.addEventListener('click', () => toggleDrawer(true));
    if (els.drawerClose) els.drawerClose.addEventListener('click', () => acknowledgeRecap());
    if (els.foremanAct) els.foremanAct.addEventListener('click', () => toast('Foreman is thinking…', 'info'));
    if (els.foremanToggle) els.foremanToggle.addEventListener('click', () => {
      const body = els.foremanBody;
      if (!body) return;
      const hidden = body.classList.toggle('fp-panel__body--hidden');
      els.foremanToggle.textContent = hidden ? 'Show' : 'Hide';
      els.foremanToggle.setAttribute('aria-expanded', hidden ? 'false' : 'true');
    });
  }

  function start() {
    bind();
    loadState().catch((err) => toast(String(err), 'danger'));
    // Poll every 5s to advance simulation + reflect job completions.
    state.pollTimer = setInterval(() => { loadState().catch(() => {}); }, 5000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
