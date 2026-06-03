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
    sitePlan:'/api/founders-plot/draft-site-plan',
    reviewSitePlan:'/api/founders-plot/review-site-plan',
    plots:'/api/founders-plot/plots',
    prepareSettlerConvoy:'/api/founders-plot/prepare-settler-convoy',
    foundSettlement:'/api/founders-plot/found-settlement',
    selectDoctrine:'/api/founders-plot/select-doctrine',
    workOrderDraft:'/api/founders-plot/work-orders/draft',
    workOrderExecute:'/api/founders-plot/work-orders/execute',
    worldGrid:'/api/founders-plot/world-grid',
    expeditionMap:'/api/founders-plot/expedition-map',
    scoutSector:'/api/founders-plot/expedition-map/scout-sector',
    moveExpeditionUnit:'/api/founders-plot/expedition-map/move-unit',
    packetSitePlan:'/api/founders-plot/expedition-map/draft-site-plan',
    civicProposals:'/api/founders-plot/civic-proposals',
    overlayPacks:'/api/founders-plot/overlay-packs',
    civicProjects:'/api/founders-plot/civic-projects',
    inspectCivicProject:'/api/founders-plot/civic-projects/inspect',
    upgrade: '/api/founders-plot/upgrade-building',
    priority:'/api/founders-plot/set-priority',
    reward:  '/api/founders-plot/claim-reward',
    policy:  '/api/founders-plot/policy',
    recapAck:'/api/founders-plot/recap/ack',
    tools:   '/api/founders-plot/tools',
  };

  const RES_ICONS = { wood: '🪵', stone: '🪨', food: '🌾', coin: '🪙', scout_report: '🧭' };
  const FP_ASSET_BASE = '/experiences/founders-plot/assets';
  const EXPEDITION_GENERATED_HUD_CHROME_PACK_ID = 'hq17c-generated-hud-chrome-v1';
  const EXPEDITION_GENERATED_HUD_MASK_LAYER_ID = 'hq17d_three_masked_profiles_and_text_v1';
  const EXPEDITION_GENERATED_HUD_CLEAN_COMPOSITE_ID = 'hq17e_clean_hud_chrome_compositor_v1';
  const EXPEDITION_GENERATED_HUD_CHROME_BASE = `${FP_ASSET_BASE}/expedition-map/${EXPEDITION_GENERATED_HUD_CHROME_PACK_ID}`;
  const EXPEDITION_GENERATED_HUD_CHROME_ASSETS = Object.freeze({
    'crest-status': { slot: 'crest-status', path: `${EXPEDITION_GENERATED_HUD_CHROME_BASE}/crest-status.png`, anchor: 'top-left' },
    'objective-loop': { slot: 'objective-loop', path: `${EXPEDITION_GENERATED_HUD_CHROME_BASE}/objective-plaque.png`, anchor: 'top-left' },
    'unit-dock': { slot: 'unit-dock', path: `${EXPEDITION_GENERATED_HUD_CHROME_BASE}/unit-dock.png`, anchor: 'bottom-left' },
    'command-tray': { slot: 'command-tray', path: `${EXPEDITION_GENERATED_HUD_CHROME_BASE}/command-tray.png`, anchor: 'bottom-right' },
    'collapsed-ledger': { slot: 'collapsed-ledger', path: `${EXPEDITION_GENERATED_HUD_CHROME_BASE}/ledger-rail.png`, anchor: 'right' },
    'selected-context': { slot: 'selected-context', path: `${EXPEDITION_GENERATED_HUD_CHROME_BASE}/selected-context-frame.png`, anchor: 'bottom-right' },
    'command-puck': { slot: 'command-puck', path: `${EXPEDITION_GENERATED_HUD_CHROME_BASE}/command-puck.png`, anchor: 'selected-command' },
  });
  function expeditionGeneratedHudChromeAsset(slot) {
    return EXPEDITION_GENERATED_HUD_CHROME_ASSETS[String(slot || '')] || null;
  }
  function expeditionGeneratedHudChromeModel() {
    return {
      packId: EXPEDITION_GENERATED_HUD_CHROME_PACK_ID,
      manifestPath: `${EXPEDITION_GENERATED_HUD_CHROME_BASE}/manifest.json`,
      sourceConcept: 'agent-town-hq17a-fullscreen-hud-redesign-concept-01-2026-06-03.png',
      visualOnly: true,
      readOnly: true,
      routeAuthority: false,
      actionAuthority: false,
      executableActions: 0,
      cleanComposite: EXPEDITION_GENERATED_HUD_CLEAN_COMPOSITE_ID,
      assets: Object.values(EXPEDITION_GENERATED_HUD_CHROME_ASSETS),
    };
  }
  function bindExpeditionGeneratedHudChrome(node, slot) {
    const asset = expeditionGeneratedHudChromeAsset(slot);
    if (!node || !asset?.path) return node;
    node.dataset.generatedChromePack = EXPEDITION_GENERATED_HUD_CHROME_PACK_ID;
    node.dataset.generatedChromeSlot = String(asset.slot || slot);
    node.dataset.generatedChromeSrc = String(asset.path || '');
    node.dataset.generatedChromePresentationOnly = 'true';
    node.dataset.generatedChromeLiveText = 'dom';
    node.dataset.generatedChromeTextLayer = 'three-canvas';
    node.dataset.generatedChromeCleanComposite = EXPEDITION_GENERATED_HUD_CLEAN_COMPOSITE_ID;
    node.style.setProperty('--fp-generated-hud-chrome', `url("${asset.path}")`);
    node.classList.add('fp-expedition-generated-chrome-frame');
    return node;
  }
  const CARD_ART = Object.freeze({
    scoutReport: `${FP_ASSET_BASE}/objects/scout-report-dossier.webp`,
    sitePlan: `${FP_ASSET_BASE}/objects/site-plan-dossier.webp`,
    reviewedPlan: `${FP_ASSET_BASE}/objects/reviewed-plan-stamp.webp`,
    claimReadyPlan: `${FP_ASSET_BASE}/objects/claim-ready-plan.webp`,
    settlerConvoy: `${FP_ASSET_BASE}/objects/settler-convoy-wagon.webp`,
    settlementClaim: `${FP_ASSET_BASE}/objects/settlement-claim-manifest.webp`,
    convoyRoute: `${FP_ASSET_BASE}/objects/convoy-route-map.webp`,
    outpostMarker: `${FP_ASSET_BASE}/objects/outpost-marker.webp`,
    secondPlotFounded: `${FP_ASSET_BASE}/objects/second-plot-founded-receipt.webp`,
    doctrine: `${FP_ASSET_BASE}/buildings/research-lodge.webp`,
    workOrder: `${FP_ASSET_BASE}/objects/cohort-work-order-dossier.webp`,
    worldGridBeacon: `${FP_ASSET_BASE}/objects/world-grid-civic-beacon.webp`,
    civicProposalDossier: `${FP_ASSET_BASE}/objects/civic-proposal-dossier-card-art.webp`,
    generatedUniverseOverlayPack: `${FP_ASSET_BASE}/objects/generated-universe-overlay-pack-card-art.webp`,
  });
  const EXPEDITION_FOG_ORDER = ['discovered', 'known', 'hinted', 'locked_unknown'];
  const EXPEDITION_FOG_COPY = Object.freeze({
    discovered: {
      label: 'Discovered',
      token: '◆',
      meaning: 'Owned plot or founded outpost truth is visible.',
      selected: 'Visible: verified server truth can show receipts, terrain, risk, and resource hints.',
      scout: 'Scout Sector is not used for discovered cells.',
    },
    known: {
      label: 'Known',
      token: '●',
      meaning: 'Reviewed or scouted sector truth is recorded.',
      selected: 'Visible: verified server truth can show receipts, terrain, risk, and resource hints.',
      scout: 'Use existing verified panels for any allowed follow-up.',
    },
    hinted: {
      label: 'Hinted',
      token: '◇',
      meaning: 'A server-hinted frontier edge exists.',
      selected: 'Hidden: no resources, routes, or actions are exposed.',
      scout: 'Only Scout Sector can reveal one eligible hinted edge as known.',
    },
    locked_unknown: {
      label: 'Locked',
      token: '□',
      meaning: 'A sealed placeholder beyond the current frontier.',
      selected: 'Hidden: no resources, routes, actions, or receipts are exposed.',
      scout: 'No Expedition Map action is available for locked unknown cells.',
    },
  });
  const RESOURCE_KEYS = ['wood', 'stone', 'food', 'coin'];
  const BUILDING_LABELS = {
    HQ: 'Headquarters',
    LUMBER_CAMP: 'Lumber Camp',
    FARM_PLOT: 'Farm Plot',
    QUARRY: 'Quarry',
    EXPEDITION_BOARD: 'Expedition Board',
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
    scoutReportCount: document.querySelector('[data-testid="fp-scout-report-count"]'),
    sitePlanCount: document.querySelector('[data-testid="fp-site-plan-count"]'),
    stage:       document.getElementById('fp-three-stage'),
    threeViewport: document.getElementById('fp-three-viewport'),
    actorHooks:  document.getElementById('fp-scene-actor-hooks'),
    grid:        document.getElementById('fp-grid'),
    palette:     document.getElementById('fp-palette'),
    palClose:    document.getElementById('fp-close-palette'),
    bldTitle:    document.getElementById('fp-bld-title'),
    bldBody:     document.getElementById('fp-bld-body'),
    rewardsBody: document.getElementById('fp-rewards-body'),
    foremanBody: document.getElementById('fp-foreman-body'),
    foremanAct:  document.getElementById('fp-foreman-act'),
    foremanToggle: document.getElementById('fp-foreman-toggle'),
    foremanStatus: document.querySelector('[data-testid="fp-foreman-status"]'),
    approvals:   document.querySelector('[data-testid="fp-approvals"]'),
    policyForm:  document.getElementById('fp-policy-form'),
    jobsBody:    document.getElementById('fp-jobs-body'),
    ownedPlotsBody: document.getElementById('fp-owned-plots-body'),
    scoutReportsBody: document.getElementById('fp-scout-reports-body'),
    sitePlansBody: document.getElementById('fp-site-plans-body'),
    settlementClaimsBody: document.getElementById('fp-settlement-claims-body'),
    doctrineBody: document.getElementById('fp-doctrine-body'),
    workOrdersBody: document.getElementById('fp-work-orders-body'),
    expeditionMapBody: document.getElementById('fp-expedition-map-body'),
    worldGridBody: document.getElementById('fp-world-grid-body'),
    civicProposalsBody: document.getElementById('fp-civic-proposals-body'),
    overlayPacksBody: document.getElementById('fp-overlay-packs-body'),
    civicOperationsBody: document.getElementById('fp-civic-operations-body'),
    drawer:      document.getElementById('fp-recap-drawer'),
    drawerOpen:  document.getElementById('fp-drawer-toggle'),
    drawerClose: document.getElementById('fp-drawer-close'),
    drawerBody:  document.getElementById('fp-recap-body'),
    toast:       document.getElementById('fp-toast'),
    openAtlas:   document.getElementById('fp-open-atlas'),
    atlasBackdrop: document.getElementById('fp-atlas-backdrop'),
    atlasClose:  document.getElementById('fp-close-atlas'),
    atlasFrame:  document.getElementById('fp-atlas-frame'),
  };

  const state = {
    plotId: null,
    snapshot: null,
    bundle: null,
    selected: null,
    paletteOpenForTile: null,
    pollTimer: null,
    unlocks: ['LUMBER_CAMP'],
    scene: null,
    threeInfo: null,
    reviewPendingPlanId: '',
    convoyPendingPlanId: '',
    foundingPendingClaimId: '',
    doctrinePendingId: '',
    workOrderDraftPendingTemplateId: '',
    workOrderExecutePendingId: '',
    scoutSectorPendingCellId: '',
    expeditionUnitMovePendingId: '',
    expeditionPacketSitePlanPendingId: '',
    scoutSectorReceipt: null,
    expeditionSelectedCellId: '',
    expeditionSelectedUnitId: '',
    expeditionCommandPreview: null,
    expeditionCommandOutcomeFeedback: null,
    expeditionCommandOutcomeFeedbackTimer: 0,
    expeditionMapThreeInfo: null,
    rewardClaimPendingId: '',
    civicProjectInspectionPendingId: '',
    civicProposalPending: false,
    civicProposalDraft: null,
    overlayPackPending: false,
    overlayPackDraft: null,
    overlayAppliedPackId: '',
    overlayAppliedPlotId: '',
    overlayPreviewSelectionId: '',
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
    if (els.scoutReportCount) {
      const reports = Array.isArray(plot.scoutReports) ? plot.scoutReports.length : 0;
      els.scoutReportCount.textContent = `Reports ${reports}`;
    }
    if (els.sitePlanCount) {
      const plans = Array.isArray(plot.sitePlans) ? plot.sitePlans.length : 0;
      els.sitePlanCount.textContent = `Plans ${plans}`;
    }
  }

  function renderQuest(snapshot) {
    const q = snapshot && snapshot.quest;
    if (!q || !els.quest) return;
    // Server emits {id, title, body, primaryAction}. Older shapes used
    // {stepId, label, hint}. Accept either so future spec tweaks don't
    // silently leave "Loading…" in the banner.
    els.quest.textContent = q.title || q.label || q.stepId || q.id || 'Chart the plot';
    if (els.questHint) els.questHint.textContent = q.body || q.hint || '';
  }

  function resourceAmount(bundle, key) {
    return Number(bundle?.plot?.inventory?.[key] || bundle?.inventory?.[key] || 0);
  }

  function townXp(bundle) {
    return Number(bundle?.plot?.townXp || bundle?.townXp || 0);
  }

  function normalizeCost(cost) {
    const out = {};
    const source = cost && typeof cost === 'object' ? cost : {};
    RESOURCE_KEYS.forEach((key) => {
      const value = Math.max(0, Math.floor(Number(source[key] || 0)));
      if (value > 0) out[key] = value;
    });
    return out;
  }

  function outputLabel(key) {
    if (key === 'scout_report') return 'Scout report';
    if (key === 'town_xp') return 'Town XP';
    return String(key || '').replace(/_/g, ' ');
  }

  function formatGrant(grant = {}) {
    return Object.entries(grant || {})
      .filter(([, value]) => Number(value || 0) > 0)
      .map(([key, value]) => `${RES_ICONS[key] || ''} ${outputLabel(key)} +${Number(value)}`.trim())
      .join(', ');
  }

  function safeTestId(value) {
    return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '_') || 'item';
  }

  function appendCardArt(card, src, alt, testid, modifier = '') {
    if (!card || !src) return null;
    const img = document.createElement('img');
    img.className = `fp-card-art${modifier ? ` fp-card-art--${modifier}` : ''}`;
    img.src = src;
    img.alt = alt || '';
    img.loading = 'lazy';
    img.decoding = 'async';
    if (testid) img.dataset.testid = testid;
    card.appendChild(img);
    return img;
  }

  function isSitePlanReviewed(plan) {
    return plan?.reviewStatus === 'reviewed'
      || plan?.promotionStatus === 'reviewed_claim_ready'
      || plan?.status === 'REVIEWED';
  }

  function claimBlocksSitePlan(claim) {
    const status = String(claim?.status || '').toUpperCase();
    return ['CLAIM_READY', 'CONVOY_PREPARING', 'CONVOY_ARRIVED', 'FOUNDED'].includes(status);
  }

  function claimForSitePlan(bundle, plan) {
    const planId = String(plan?.planId || '');
    const planClaimId = String(plan?.claimId || '');
    return (bundle.settlementClaims || []).find((claim) => {
      if (!claimBlocksSitePlan(claim)) return false;
      return String(claim.sitePlanId || '') === planId
        || (planClaimId && String(claim.claimId || '') === planClaimId);
    }) || null;
  }

  function isDoctrineAvailable(doctrine) {
    if (doctrine?.selected) return false;
    const availability = doctrine?.availability || {};
    return availability.unlocked === true
      || (!Array.isArray(availability.blockedBy) && doctrine?.status === 'available')
      || (Array.isArray(availability.blockedBy) && availability.blockedBy.length === 0);
  }

  function doctrineBlockedText(doctrine) {
    const availability = doctrine?.availability || {};
    const blocked = Array.isArray(availability.blockedBy) ? availability.blockedBy : [];
    if (!blocked.length) return 'Locked until the server exposes this doctrine as available.';
    return `Locked by ${blocked.map((entry) => String(entry || '').replace(/\./g, ' ')).join(', ')}.`;
  }

  function formatDuration(ms) {
    const total = Math.max(0, Math.round(Number(ms || 0) / 1000));
    if (!total) return '';
    if (total >= 3600) {
      const hours = Math.floor(total / 3600);
      const mins = Math.floor((total % 3600) / 60);
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  }

  function friendlyToken(value) {
    return String(value || '')
      .replace(/^hq\.level\.(\d+)$/, 'HQ Lv $1')
      .replace(/^settlement\.outpost\.founded$/, 'founded outpost')
      .replace(/^doctrine\.survey_discipline\.selected$/, 'Survey Discipline selected')
      .replace(/^work_order\.collect_ready_outputs_once\.available$/, 'Collect-ready work-order executor available')
      .replace(/^et\.plot\./, '')
      .replace(/_/g, ' ')
      .replace(/\./g, ' ');
  }

  function appendChipSet(card, entries) {
    const chips = document.createElement('div');
    chips.className = 'fp-scout-report__chips';
    entries.filter(Boolean).forEach((text) => {
      const chip = document.createElement('span');
      chip.textContent = text;
      chips.appendChild(chip);
    });
    if (chips.childElementCount) card.appendChild(chips);
    return chips;
  }

  function isWorkOrderTemplateAvailable(template) {
    const availability = template?.availability || {};
    return availability.unlocked === true
      || (Array.isArray(availability.blockedBy) && availability.blockedBy.length === 0);
  }

  function workOrderBlockedText(template) {
    const blocked = Array.isArray(template?.availability?.blockedBy) ? template.availability.blockedBy : [];
    if (!blocked.length) return 'Locked until the server exposes this template as available.';
    return `Server prerequisites: ${blocked.map(friendlyToken).join(', ')}.`;
  }

  function workOrderScopeText(scope) {
    const mode = String(scope?.mode || 'all_ready_outputs').replace(/_/g, ' ');
    const maxBuildings = Number(scope?.maxBuildings || 0);
    const selected = Array.isArray(scope?.buildingIds) ? scope.buildingIds.length : 0;
    const target = String(scope?.targetState || 'OUTPUT_READY').replace(/_/g, ' ');
    if (selected > 0) return `${selected} selected buildings, ${target.toLowerCase()}`;
    return `${mode}, ${target.toLowerCase()}${maxBuildings ? `, max ${maxBuildings}` : ''}`;
  }

  function zeroSpendCap(caps) {
    const spend = caps?.maxResourceSpend || {};
    return RESOURCE_KEYS.every((key) => Number(spend[key] || 0) === 0);
  }

  function workOrderCapChips(caps = {}) {
    return [
      Number(caps.maxChildActions || 0) ? `cap ${Number(caps.maxChildActions)} child actions` : '',
      zeroSpendCap(caps) ? 'spend cap 0' : '',
      caps.maxRuntimeMs ? `runtime cap ${formatDuration(caps.maxRuntimeMs)}` : '',
      caps.allowedPlotScope ? String(caps.allowedPlotScope).replace(/_/g, ' ') : ''
    ];
  }

  function effectiveWorkOrderStatus(order) {
    const status = String(order?.status || 'DRAFT').toUpperCase();
    if (status === 'DRAFT' && order?.expiresAt != null && Number(order.expiresAt) < Date.now()) return 'EXPIRED';
    return status;
  }

  function workOrderExpiryText(order, statusKey = effectiveWorkOrderStatus(order)) {
    if (statusKey === 'COMPLETED') return 'Completed receipt. Child receipts are preserved for audit.';
    if (order?.expiresAt == null) return 'Draft expiry is set by the server.';
    const remaining = Number(order.expiresAt) - Date.now();
    if (remaining <= 0) return 'Expired draft. Recreate it before execution.';
    return `Expires in about ${formatDuration(remaining)}.`;
  }

  function civicProposalModel(bundle) {
    const raw = bundle?.civicProposals;
    if (Array.isArray(raw)) {
      return {
        status: raw.length ? 'RECORDING_READY' : '',
        proposalOnly: true,
        readOnlyExecution: true,
        allowedStatuses: ['DRAFT', 'REVIEWED', 'ARCHIVED'],
        allowedCategories: ['coordination', 'public_work', 'route_study', 'civic_memory'],
        counts: { total: raw.length },
        proposals: raw,
      };
    }
    const model = raw && typeof raw === 'object' ? raw : {};
    const proposals = Array.isArray(model.proposals)
      ? model.proposals
      : Array.isArray(bundle?.proposals)
        ? bundle.proposals
        : [];
    return { ...model, proposals };
  }

  function isCivicProposalRecordingReady(model) {
    return model?.proposalOnly === true
      && String(model?.status || '').toUpperCase() === 'RECORDING_READY';
  }

  function civicProposalScopeText(scope = {}) {
    const known = Number(scope.knownPlotCount || 0);
    const outposts = Number(scope.outpostCount || 0);
    const related = Array.isArray(scope.relatedPlotIds) ? scope.relatedPlotIds.length : 0;
    const executionAllowed = scope.executionAllowed === true ? 'execution allowed' : 'execution not implemented';
    return [
      scope.proposalOnly === false ? 'proposalOnly false' : 'proposalOnly true',
      executionAllowed,
      known ? `${known} known plots` : '',
      outposts ? `${outposts} outposts` : '',
      related ? `${related} related plots` : '',
    ].filter(Boolean).join(', ');
  }

  function civicProposalCountsText(counts = {}) {
    const byStatus = counts.byStatus || {};
    const draft = Number(counts.draftCount ?? byStatus.DRAFT ?? 0);
    const reviewed = Number(counts.reviewedCount ?? byStatus.REVIEWED ?? 0);
    const archived = Number(counts.archivedCount ?? byStatus.ARCHIVED ?? 0);
    const total = Number(counts.total ?? draft + reviewed + archived);
    return `${countLabel(total, 'proposal record')}: DRAFT ${draft}, REVIEWED ${reviewed}, ARCHIVED ${archived}.`;
  }

  function civicProposalFormOptions(model, key, fallback) {
    const values = Array.isArray(model?.[key]) && model[key].length ? model[key] : fallback;
    return values.map((value) => String(value || '').trim()).filter(Boolean);
  }

  const CIVIC_PROPOSAL_DRAFT_FIELDS = ['title', 'category', 'status', 'summary', 'reviewNote'];
  const OVERLAY_PACK_DRAFT_FIELDS = ['sourceProposalId', 'title', 'theme', 'status', 'summary', 'prompt'];

  function readFormDraft(form, fields) {
    const draft = {};
    for (const fieldName of fields) {
      const field = form?.elements?.[fieldName];
      draft[fieldName] = field ? String(field.value || '') : '';
    }
    return draft;
  }

  function writeFormDraft(form, draft, fields) {
    if (!form || !draft) return;
    for (const fieldName of fields) {
      const field = form.elements?.[fieldName];
      if (!field || draft[fieldName] == null) continue;
      const value = String(draft[fieldName] || '');
      if (field.tagName === 'SELECT') {
        const hasOption = Array.from(field.options || []).some((option) => option.value === value);
        if (hasOption) field.value = value;
      } else {
        field.value = value;
      }
    }
  }

  function bindFormDraft(form, fields, stateKey) {
    if (!form) return;
    const persist = () => { state[stateKey] = readFormDraft(form, fields); };
    form.addEventListener('input', persist);
    form.addEventListener('change', persist);
  }

  function captureFormDraft(container, testid, fields, stateKey) {
    const form = container?.querySelector(`[data-testid="${testid}"]`);
    if (form) state[stateKey] = readFormDraft(form, fields);
    return state[stateKey] || null;
  }

  function resetFormDraft(form, stateKey) {
    if (form && typeof form.reset === 'function') form.reset();
    state[stateKey] = null;
  }

  function overlayPackModel(bundle) {
    const raw = bundle?.overlayPacks;
    if (Array.isArray(raw)) {
      return {
        status: raw.length ? 'RECORDING_READY' : '',
        title: 'Generated Universe Overlay Packs',
        presentationOnly: true,
        visualOnly: true,
        allowedStatuses: ['DRAFT', 'REVIEWED', 'ARCHIVED'],
        counts: { total: raw.length },
        packs: raw,
      };
    }
    const model = raw && typeof raw === 'object' ? raw : {};
    const packs = Array.isArray(model.packs)
      ? model.packs
      : Array.isArray(bundle?.packs)
        ? bundle.packs
        : [];
    return { ...model, packs };
  }

  function isOverlayPackRecordingReady(model) {
    return model?.presentationOnly === true
      && model?.visualOnly === true
      && String(model?.status || '').toUpperCase() === 'RECORDING_READY';
  }

  function overlayPackId(pack = {}) {
    const source = pack && typeof pack === 'object' ? pack : {};
    return String(source.overlayPackId || source.packId || source.id || '').trim();
  }

  function validOverlayPacks(packs = []) {
    return (Array.isArray(packs) ? packs : [])
      .filter((pack) => pack && typeof pack === 'object' && overlayPackId(pack));
  }

  function sortedOverlayPacks(packs = []) {
    return validOverlayPacks(packs)
      .sort((a, b) => Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0));
  }

  function civicProjectId(project = {}) {
    const source = project && typeof project === 'object' ? project : {};
    return String(source.projectId || source.civicProjectId || source.id || '').trim();
  }

  function civicProjectTitle(project = {}) {
    return String(project?.title || friendlyToken(project?.projectType || 'civic project')).trim();
  }

  function validCivicProjects(projects = []) {
    return (Array.isArray(projects) ? projects : [])
      .filter((project) => project && typeof project === 'object' && civicProjectId(project));
  }

  function sortedCivicProjects(projects = []) {
    return validCivicProjects(projects)
      .sort((a, b) => Number(b.updatedAt || b.activatedAt || b.createdAt || 0) - Number(a.updatedAt || a.activatedAt || a.createdAt || 0));
  }

  function civicProjectInspections(project = {}) {
    const receiptInspections = Array.isArray(project?.receipt?.inspections) ? project.receipt.inspections : [];
    const directInspections = Array.isArray(project?.inspections) ? project.inspections : [];
    return [...receiptInspections, ...directInspections].filter((entry) => entry && typeof entry === 'object');
  }

  function civicProjectBaselineInspection(project = {}) {
    return civicProjectInspections(project)
      .find((entry) => String(entry.inspectionType || '').toLowerCase() === 'baseline_readiness')
      || null;
  }

  function civicInspectionTime(receipt = {}) {
    const raw = Number(receipt?.inspectedAt || receipt?.createdAt || 0);
    if (!raw) return '';
    return new Date(raw).toLocaleString();
  }

  function isCivicProjectActive(project = {}) {
    return String(project?.status || '').toUpperCase() === 'ACTIVE';
  }

  function isCivicProjectBaselineInspected(project = {}) {
    return !!civicProjectBaselineInspection(project)
      || project?.effect?.inspection?.baselineReadinessInspected === true
      || project?.baselineReadinessInspected === true;
  }

  function activeUninspectedCivicProject(projects = []) {
    return sortedCivicProjects(projects)
      .find((project) => isCivicProjectActive(project) && !isCivicProjectBaselineInspected(project))
      || null;
  }

  function civicProjectModel(bundle) {
    const raw = bundle?.civicProjects;
    const worldGridProjects = bundle?.worldGrid?.civicProjects || {};
    const summary = bundle?.publicSummary || {};
    if (Array.isArray(raw)) {
      const projects = sortedCivicProjects(raw);
      const activeCount = projects.filter((project) => String(project.status || '').toUpperCase() === 'ACTIVE').length;
      return {
        status: activeCount > 0 ? 'ACTIVE' : projects.length ? 'RECORDED' : '',
        publicWork: true,
        activationAllowed: false,
        authorityBoundary: worldGridProjects.authorityBoundary || 'server-owned civic project records',
        counts: { total: projects.length, activeCount },
        activeEffects: {
          localCivicBeacon: activeCount > 0,
          activeBeaconCount: activeCount,
          localReadinessDelta: Math.min(1, activeCount),
          moraleMarkers: activeCount > 0 ? ['civic_beacon_lit'] : [],
        },
        projects,
      };
    }
    const model = raw && typeof raw === 'object' ? raw : {};
    const projects = sortedCivicProjects(model.projects || []);
    const activeCount = Number(model.counts?.activeCount ?? worldGridProjects.activeCount ?? summary.civicProjectActiveCount ?? projects.filter((project) => String(project.status || '').toUpperCase() === 'ACTIVE').length);
    const total = Number(model.counts?.total ?? worldGridProjects.total ?? summary.civicProjectCount ?? projects.length);
    return {
      ...model,
      status: model.status || (activeCount > 0 ? 'ACTIVE' : worldGridProjects.activationAllowed ? 'ACTIVATION_READY' : ''),
      publicWork: model.publicWork ?? worldGridProjects.publicWork ?? true,
      activationAllowed: model.activationAllowed ?? worldGridProjects.activationAllowed ?? false,
      authorityBoundary: model.authorityBoundary || worldGridProjects.authorityBoundary || 'server-owned civic project activation state',
      counts: {
        ...(model.counts || {}),
        total,
        activeCount,
        byStatus: model.counts?.byStatus || worldGridProjects.byStatus || {},
        byType: model.counts?.byType || worldGridProjects.byType || {},
      },
      activeEffects: {
        ...(model.activeEffects || {}),
        localCivicBeacon: model.activeEffects?.localCivicBeacon ?? worldGridProjects.localCivicBeaconActive ?? summary.civicBeaconActive ?? activeCount > 0,
        activeBeaconCount: model.activeEffects?.activeBeaconCount ?? Number(worldGridProjects.byType?.civic_beacon || (worldGridProjects.localCivicBeaconActive ? 1 : 0) || 0),
        localReadinessDelta: model.activeEffects?.localReadinessDelta ?? worldGridProjects.localReadinessDelta ?? summary.civicReadinessScore ?? 0,
        moraleMarkers: model.activeEffects?.moraleMarkers || bundle?.worldGrid?.civicReadiness?.moraleMarkers || [],
      },
      projects,
    };
  }

  function civicOperationsModel(bundle) {
    const raw = bundle?.civicOperations;
    const model = Array.isArray(raw)
      ? { operations: raw, counts: { total: raw.length } }
      : raw && typeof raw === 'object'
        ? raw
        : {};
    const worldGridOps = bundle?.worldGrid?.civicOperations || {};
    const operations = Array.isArray(model.operations) ? model.operations : [];
    const localCareScore = Number(model.activeEffects?.localCareScore ?? model.progress?.current ?? worldGridOps.localCareScore ?? 0);
    const maxLocalCareScore = Number(model.activeEffects?.maxLocalCareScore ?? model.progress?.max ?? worldGridOps.maxLocalCareScore ?? 0);
    const total = Number(model.counts?.total ?? worldGridOps.total ?? operations.length);
    const completedCount = Number(model.counts?.completedCount ?? worldGridOps.completedCount ?? worldGridOps.completedBeaconRounds ?? operations.filter((operation) => String(operation.status || '').toUpperCase() === 'COMPLETED').length);
    return {
      ...model,
      status: model.status || worldGridOps.status || '',
      implementation: model.implementation || worldGridOps.implementation || '',
      authorityBoundary: model.authorityBoundary || worldGridOps.authorityBoundary || '',
      operationAllowed: model.operationAllowed ?? worldGridOps.operationAllowed ?? false,
      allowedOperationTypes: Array.isArray(model.allowedOperationTypes) ? model.allowedOperationTypes : (Array.isArray(worldGridOps.allowedOperationTypes) ? worldGridOps.allowedOperationTypes : []),
      counts: {
        ...(model.counts || {}),
        total,
        completedCount,
        beaconRoundCount: Number(model.counts?.beaconRoundCount ?? worldGridOps.completedBeaconRounds ?? 0),
      },
      activeEffects: {
        ...(model.activeEffects || {}),
        localCareScore,
        maxLocalCareScore,
        moraleMarkers: model.activeEffects?.moraleMarkers || worldGridOps.moraleMarkers || [],
      },
      lifecycle: model.lifecycle || worldGridOps.lifecycle || null,
      readiness: model.readiness || model.requirements || worldGridOps.readiness || null,
      progress: model.progress || worldGridOps.progress || null,
      operations,
    };
  }

  function hasCivicOperationsReadModel(model) {
    return !!model.status
      || !!model.implementation
      || Number(model.counts?.total || 0) > 0
      || Number(model.activeEffects?.maxLocalCareScore || 0) > 0;
  }

  function operationProgress(model) {
    const progress = model?.progress && typeof model.progress === 'object' ? model.progress : {};
    const current = Number(progress.current ?? model?.activeEffects?.localCareScore ?? 0);
    const max = Number(progress.max ?? model?.activeEffects?.maxLocalCareScore ?? 0);
    const percent = progress.percent != null
      ? Number(progress.percent)
      : max > 0
        ? Math.round((Math.max(0, current) / max) * 100)
        : 0;
    return {
      current,
      max,
      percent: Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0)),
      label: progress.label || (max > 0 ? `${current}/${max} local care` : 'progress pending'),
    };
  }

  function operationItems(value) {
    if (!value || typeof value !== 'object') return [];
    if (Array.isArray(value.items)) return value.items;
    if (Array.isArray(value.signals)) return value.signals;
    if (Array.isArray(value.checks)) return value.checks;
    return [];
  }

  function overlayPackStorageKey(plotId) {
    return `fp:hq10d:local-overlay-preview:${String(plotId || 'unknown')}`;
  }

  function readStoredOverlayPackId(plotId) {
    try {
      return window.localStorage?.getItem(overlayPackStorageKey(plotId)) || '';
    } catch (_) {
      return '';
    }
  }

  function storeOverlayPackId(plotId, packId) {
    try {
      if (!window.localStorage) return;
      const key = overlayPackStorageKey(plotId);
      if (packId) window.localStorage.setItem(key, packId);
      else window.localStorage.removeItem(key);
    } catch (_) {}
  }

  function syncLocalOverlayState(bundle) {
    const plotId = String(bundle?.plotId || bundle?.plot?.plotId || state.plotId || '');
    const model = overlayPackModel(bundle);
    const packs = sortedOverlayPacks(model.packs);
    const packIds = new Set(packs.map(overlayPackId).filter(Boolean));

    if (state.overlayAppliedPlotId !== plotId) {
      state.overlayAppliedPlotId = plotId;
      state.overlayAppliedPackId = readStoredOverlayPackId(plotId);
      state.overlayPreviewSelectionId = '';
    }

    if (state.overlayAppliedPackId && !packIds.has(state.overlayAppliedPackId)) {
      state.overlayAppliedPackId = '';
      storeOverlayPackId(plotId, '');
    }

    if (state.overlayPreviewSelectionId && !packIds.has(state.overlayPreviewSelectionId)) {
      state.overlayPreviewSelectionId = '';
    }

    if (!state.overlayPreviewSelectionId && packs.length) {
      state.overlayPreviewSelectionId = state.overlayAppliedPackId || overlayPackId(sortedOverlayPacks(packs)[0]);
    }
  }

  function overlayPackById(bundle, packId) {
    const model = overlayPackModel(bundle);
    const packs = sortedOverlayPacks(model.packs);
    return packs.find((pack) => overlayPackId(pack) === String(packId || '')) || null;
  }

  function activeOverlayPack(bundle) {
    return overlayPackById(bundle, state.overlayAppliedPackId);
  }

  function selectedOverlayPack(bundle) {
    return overlayPackById(bundle, state.overlayPreviewSelectionId)
      || activeOverlayPack(bundle)
      || sortedOverlayPacks(overlayPackModel(bundle).packs || [])[0]
      || null;
  }

  function overlayPackVisualPreset(pack = {}) {
    const theme = String(pack.theme || pack.displayHints?.colorway || pack.displayHints?.skins?.[0] || '').toLowerCase();
    const title = String(pack.title || '').toLowerCase();
    const text = `${theme} ${title}`;
    if (text.includes('lantern') || text.includes('amber')) return 'lantern';
    if (text.includes('oracle') || text.includes('signal')) return 'oracle';
    if (text.includes('grid') || text.includes('beacon') || text.includes('civic')) return 'beacon';
    return 'civic';
  }

  function overlayPackSurfaceLabel(pack = {}, surface = 'world_grid') {
    const labels = pack.displayHints?.labels || {};
    return labels[surface]
      || labels[String(surface).replace(/_([a-z])/g, (_, ch) => ch.toUpperCase())]
      || labels.generated_universe
      || pack.title
      || 'Local overlay preview';
  }

  function overlayPackCountsText(counts = {}) {
    const byStatus = counts.byStatus || {};
    const draft = Number(counts.draftCount ?? byStatus.DRAFT ?? 0);
    const reviewed = Number(counts.reviewedCount ?? byStatus.REVIEWED ?? 0);
    const archived = Number(counts.archivedCount ?? byStatus.ARCHIVED ?? 0);
    const total = Number(counts.total ?? draft + reviewed + archived);
    return `${countLabel(total, 'overlay pack record')}: DRAFT ${draft}, REVIEWED ${reviewed}, ARCHIVED ${archived}.`;
  }

  function overlayPackOmittedCapabilities() {
    return [
      'public sharing',
      'actual Generated Universe rendering',
      'gameplay costs resources buffs',
      'routes trade behavior',
      'scheduler background execution',
      'Atlas owned execution',
      'external effects'
    ];
  }

  function reviewedCivicProposalOptions(bundle, model) {
    const civicModel = civicProposalModel(bundle);
    const proposals = Array.isArray(civicModel.proposals) ? civicModel.proposals : [];
    const options = proposals
      .filter((proposal) => String(proposal.status || '').toUpperCase() === 'REVIEWED')
      .map((proposal) => ({
        id: String(proposal.proposalId || ''),
        label: proposal.title ? `${proposal.title} (${proposal.proposalId})` : String(proposal.proposalId || '')
      }))
      .filter((entry) => entry.id);
    const seen = new Set(options.map((entry) => entry.id));
    const sourceIds = Array.isArray(model?.sourceProposalIds) ? model.sourceProposalIds : [];
    for (const sourceProposalId of sourceIds) {
      const id = String(sourceProposalId || '');
      if (!id || seen.has(id)) continue;
      seen.add(id);
      options.push({ id, label: id });
    }
    return options;
  }

  function overlayPackTargetText(pack = {}) {
    const surfaces = Array.isArray(pack.targetSurfaceIds) ? pack.targetSurfaceIds : [];
    const nodes = Array.isArray(pack.targetNodeIds) ? pack.targetNodeIds : [];
    return [
      surfaces.length ? `surfaces ${surfaces.map(friendlyToken).join(', ')}` : 'surfaces server default',
      nodes.length ? `nodes ${nodes.map(friendlyToken).join(', ')}` : ''
    ].filter(Boolean).join('; ');
  }

  function overlayPackPromptText(pack = {}) {
    const prompt = pack.prompt || {};
    const rawStored = prompt.rawPromptStored === true ? 'raw prompt stored true' : 'raw prompt stored false';
    return prompt.promptDigest
      ? `Prompt digest ${prompt.promptDigest}; ${rawStored}.`
      : `Prompt digest pending; ${rawStored}.`;
  }

  function statusCountText(byStatus = {}) {
    const entries = Object.entries(byStatus || {})
      .filter(([, value]) => Number(value || 0) > 0)
      .map(([key, value]) => `${String(key || '').replace(/_/g, ' ')} ${Number(value || 0)}`);
    return entries.length ? entries.join(', ') : 'no active claims';
  }

  function countLabel(value, singular, plural = `${singular}s`) {
    const count = Number(value || 0);
    return `${count} ${count === 1 ? singular : plural}`;
  }

  function ensureExpeditionMapPanel() {
    if (els.expeditionMapBody && document.body.contains(els.expeditionMapBody)) {
      return els.expeditionMapBody;
    }
    const main = document.querySelector('.fp-main');
    const side = document.querySelector('.fp-side');
    if (!main && !side) return null;

    const panel = document.createElement('section');
    panel.className = 'fp-parchment fp-panel fp-expedition-map-panel';
    panel.dataset.testid = 'fp-expedition-map-panel';

    const head = document.createElement('header');
    head.className = 'fp-panel__head';
    const title = document.createElement('h2');
    title.className = 'fp-panel__title';
    title.textContent = 'Expedition Map';
    head.appendChild(title);

    const body = document.createElement('div');
    body.className = 'fp-panel__body';
    body.id = 'fp-expedition-map-body';
    body.dataset.testid = 'fp-expedition-map-body';
    body.innerHTML = '<p class="fp-helper">Expedition Map readiness loading.</p>';

    panel.append(head, body);
    if (main) {
      main.insertBefore(panel, main.firstElementChild || null);
    } else {
      const anchor = document.querySelector('[data-testid="fp-world-grid-panel"]')
        || document.querySelector('[data-testid="fp-doctrine-panel"]');
      if (anchor?.parentNode) anchor.parentNode.insertBefore(panel, anchor);
      else side.appendChild(panel);
    }
    els.expeditionMapBody = body;
    return body;
  }

  function expeditionMapModel(bundle) {
    const raw = bundle?.expeditionMap;
    return raw && typeof raw === 'object' ? raw : {};
  }

  function hasExpeditionMapReadModel(model, bundle) {
    return !!model.status
      || Array.isArray(model.cells)
      || bundle?.publicSummary?.expeditionMapStatus != null;
  }

  function expeditionCells(model) {
    return (Array.isArray(model?.cells) ? model.cells : [])
      .filter((cell) => cell && typeof cell === 'object' && cell.cellId);
  }

  function expeditionFogCounts(model, cells) {
    const counts = {
      discovered: Number(model?.fog?.counts?.discovered || 0),
      known: Number(model?.fog?.counts?.known || 0),
      hinted: Number(model?.fog?.counts?.hinted || 0),
      locked_unknown: Number(model?.fog?.counts?.locked_unknown || 0),
    };
    if (Object.values(counts).some((value) => value > 0)) return counts;
    for (const cell of cells) {
      const key = String(cell.fogState || 'locked_unknown');
      counts[key] = Number(counts[key] || 0) + 1;
    }
    return counts;
  }

  function expeditionFogDefinition(fogState) {
    const key = String(fogState || 'locked_unknown');
    return EXPEDITION_FOG_COPY[key] || {
      label: friendlyToken(key || 'unknown'),
      token: '?',
      meaning: 'Server-owned fog state.',
      selected: 'Read-only server map context.',
      scout: 'No local Expedition Map action is implied.',
    };
  }

  function appendExpeditionFogLegend(card, counts, selectedFogState = '') {
    const legend = document.createElement('div');
    legend.className = 'fp-expedition-fog-legend';
    legend.dataset.testid = 'fp-expedition-fog-legend';
    EXPEDITION_FOG_ORDER.forEach((fogState) => {
      const info = expeditionFogDefinition(fogState);
      const item = document.createElement('span');
      item.className = `fp-expedition-fog-legend__item fp-expedition-fog-legend__item--${safeTestId(fogState)}`;
      item.dataset.testid = `fp-expedition-fog-legend-${safeTestId(fogState)}`;
      item.dataset.fogState = fogState;
      if (String(selectedFogState || '') === fogState) item.dataset.selected = 'true';

      const swatch = document.createElement('i');
      swatch.textContent = info.token;
      swatch.setAttribute('aria-hidden', 'true');

      const text = document.createElement('span');
      const label = document.createElement('strong');
      label.textContent = `${info.label} ${Number(counts?.[fogState] || 0)}`;
      const copy = document.createElement('small');
      copy.textContent = info.meaning;
      text.append(label, copy);
      item.append(swatch, text);
      legend.appendChild(item);
    });
    card.appendChild(legend);
    return legend;
  }

  function appendExpeditionAuditDetails(card, labelText, bodyNodes = [], testid = '') {
    const details = document.createElement('details');
    details.className = 'fp-expedition-audit-details';
    if (testid) details.dataset.testid = testid;
    const summary = document.createElement('summary');
    summary.textContent = labelText || 'Audit details';
    details.appendChild(summary);
    bodyNodes.filter(Boolean).forEach((node) => details.appendChild(node));
    card.appendChild(details);
    return details;
  }

  function expeditionPartyInitials(name = '') {
    const parts = String(name || '').replace(/[^\w\s-]/g, ' ').split(/[\s-]+/).filter(Boolean);
    const initials = parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
    return initials || 'ET';
  }

  function expeditionPartyRoleCode(role = '') {
    const value = String(role || '').toLowerCase();
    if (/scout|pathfinder/.test(value)) return 'SCT';
    if (/messenger|courier|signal/.test(value)) return 'MSG';
    if (/hq|desk|operator/.test(value)) return 'HQ';
    return 'FLD';
  }

  function appendExpeditionPartyBadges(card, members, scope = 'map') {
    if (!card || !members.length) return null;
    const row = document.createElement('div');
    row.className = 'fp-expedition-party-badges';
    row.dataset.testid = `fp-expedition-party-badges-${safeTestId(scope)}`;
    row.dataset.partyCount = String(members.length);
    row.setAttribute('aria-label', `${countLabel(members.length, 'party member')} in the read-only expedition party manifest.`);
    members.slice(0, 5).forEach((member) => {
      const badge = document.createElement('span');
      badge.dataset.memberId = member.memberId;
      badge.dataset.role = member.role;
      badge.dataset.roleCode = expeditionPartyRoleCode(member.role);
      badge.title = `${member.displayName} - ${expeditionPartyRoleText(member.role)}`;
      badge.setAttribute('aria-label', badge.title);
      const avatar = document.createElement('i');
      avatar.textContent = expeditionPartyInitials(member.displayName);
      avatar.setAttribute('aria-hidden', 'true');
      badge.appendChild(avatar);
      row.appendChild(badge);
    });
    card.appendChild(row);
    return row;
  }

  function expeditionReceiptCount(cell = {}, packet = null) {
    const receipts = Array.isArray(cell?.receipts) ? cell.receipts.length : 0;
    return receipts + (packet?.packetId ? 1 : 0);
  }

  function expeditionReceiptTraceItems(cell = {}, packet = null, hidden = false) {
    const receipts = Array.isArray(cell?.receipts) ? cell.receipts : [];
    if (hidden) {
      return receipts.length ? [`${countLabel(receipts.length, 'server receipt')}`] : ['no public receipt'];
    }
    const items = receipts.slice(-2).map((receipt) => {
      const ids = receipt?.sourceIds || {};
      return [
        friendlyToken(receipt.kind || 'read model receipt'),
        ids.scoutId ? `scout ${ids.scoutId}` : '',
        ids.planId ? `plan ${ids.planId}` : '',
        ids.claimId || ids.originClaimId ? `claim ${ids.claimId || ids.originClaimId}` : '',
      ].filter(Boolean).join(' - ');
    });
    if (packet?.packetId) items.push(`marker ${packet.packetId}`);
    return items.length ? items : ['server read model'];
  }

  function appendExpeditionReceiptTrace(card, cell, packet = null, scope = 'selected') {
    if (!card || !cell) return null;
    const fogState = String(cell.fogState || 'locked_unknown');
    const hidden = !['discovered', 'known'].includes(fogState);
    const items = expeditionReceiptTraceItems(cell, packet, hidden);
    const receiptCount = expeditionReceiptCount(cell, packet);
    const trace = document.createElement('div');
    trace.className = 'fp-expedition-receipt-trace';
    trace.dataset.testid = `fp-expedition-receipt-trace-${safeTestId(scope)}`;
    trace.dataset.fogState = fogState;
    trace.dataset.receiptCount = String(receiptCount);
    trace.title = `${hidden ? 'Provenance sealed' : 'Receipt trace'}: ${items.join('; ')}`;
    trace.setAttribute('aria-label', trace.title);
    const label = document.createElement('small');
    label.textContent = '⚿';
    label.title = hidden ? 'Provenance sealed' : 'Receipt trace';
    label.setAttribute('aria-hidden', 'true');
    trace.appendChild(label);
    const chip = document.createElement('span');
    chip.textContent = receiptCount ? `${receiptCount} ⚿` : '0 ⚿';
    trace.appendChild(chip);
    card.appendChild(trace);
    return trace;
  }

  function appendExpeditionMapVisualHud(card, model, counts, selectedCell, scoutableCells, bundle) {
    if (!card || !selectedCell) return null;
    const fogState = String(selectedCell.fogState || 'locked_unknown');
    const selectedScoutable = isExpeditionScoutSectorEligible(selectedCell);
    const packet = expeditionPacketForCell(model, selectedCell);
    const partySource = expeditionPartySource(model, packet);
    const partyMembers = expeditionPartyMembers(partySource);

    const hud = document.createElement('div');
    hud.className = 'fp-expedition-map-visual-hud';
    hud.dataset.testid = 'fp-expedition-map-visual-hud';
    hud.dataset.hudInstrument = 'selected-context';
    bindExpeditionGeneratedHudChrome(hud, 'selected-context');
    hud.dataset.selectedCellId = String(selectedCell.cellId || '');
    hud.dataset.fogState = fogState;
    hud.dataset.scoutable = selectedScoutable ? 'true' : 'false';

    const fogRail = document.createElement('div');
    fogRail.className = 'fp-expedition-fog-pips';
    fogRail.dataset.testid = 'fp-expedition-fog-pips';
    fogRail.dataset.hudInstrument = 'fog-pips';
    EXPEDITION_FOG_ORDER.forEach((stateKey) => {
      const info = expeditionFogDefinition(stateKey);
      const pip = document.createElement('span');
      pip.className = `fp-expedition-fog-pip fp-expedition-fog-pip--${safeTestId(stateKey)}`;
      pip.dataset.fogState = stateKey;
      pip.dataset.label = info.label;
      pip.title = `${info.label}: ${info.meaning}`;
      pip.setAttribute('aria-label', `${info.label}: ${Number(counts?.[stateKey] || 0)}. ${info.meaning}`);
      if (stateKey === fogState) pip.dataset.selected = 'true';
      const swatch = document.createElement('i');
      swatch.textContent = info.token;
      swatch.setAttribute('aria-hidden', 'true');
      const count = document.createElement('strong');
      count.textContent = String(Number(counts?.[stateKey] || 0));
      const label = document.createElement('small');
      label.textContent = '';
      label.title = info.label;
      pip.append(swatch, count, label);
      fogRail.appendChild(pip);
    });
    hud.appendChild(fogRail);

    const selected = document.createElement('section');
    selected.className = `fp-expedition-map-selected-summary fp-expedition-map-selected-summary--${safeTestId(fogState)}`;
    selected.dataset.testid = 'fp-expedition-map-selected-summary';
    selected.dataset.cellId = String(selectedCell.cellId || '');
    selected.dataset.fogState = fogState;
    selected.dataset.scoutable = selectedScoutable ? 'true' : 'false';
    selected.dataset.receiptCount = String(expeditionReceiptCount(selectedCell, packet));
    selected.dataset.partyCount = String(partyMembers.length);
    selected.dataset.hudInstrument = 'selected-sector';
    bindExpeditionGeneratedHudChrome(selected, 'selected-context');
    selected.title = [
      `Selected ${selectedCell.cellId || 'cell'}`,
      `${friendlyToken(fogState)} fog`,
      selectedScoutable ? 'Scout Sector eligible' : 'read-only selection',
      `${countLabel(expeditionReceiptCount(selectedCell, packet), 'receipt')}`,
      `${countLabel(partyMembers.length, 'party member')}`,
    ].join(' - ');
    selected.setAttribute('aria-label', selected.title);

    const head = document.createElement('div');
    head.className = 'fp-expedition-map-selected-summary__head';
    const marker = document.createElement('i');
    marker.textContent = expeditionCellKindLabel(selectedCell);
    marker.setAttribute('aria-hidden', 'true');
    const titleWrap = document.createElement('span');
    const title = document.createElement('strong');
    title.textContent = expeditionCellKindLabel(selectedCell);
    title.title = selectedCell.title || friendlyToken(selectedCell.kind || selectedCell.cellId);
    const meta = document.createElement('small');
    meta.textContent = expeditionFogShortLabel(fogState);
    meta.title = selectedCell.cellId || '';
    titleWrap.append(title, meta);
    head.append(marker, titleWrap);
    selected.appendChild(head);

    const chipRow = document.createElement('div');
    chipRow.className = 'fp-expedition-map-selected-summary__chips';
    [
      ['fog', expeditionFogShortLabel(fogState), `${friendlyToken(fogState)} fog state`],
      ['scout', selectedScoutable ? '⌖' : '○', selectedScoutable ? 'Scout Sector eligible' : 'read-only selection'],
      ['receipt', expeditionReceiptCount(selectedCell, packet) ? `${expeditionReceiptCount(selectedCell, packet)} ⚿` : '0 ⚿', `${countLabel(expeditionReceiptCount(selectedCell, packet), 'receipt')}`],
      ['party', partyMembers.length ? `${partyMembers.length} ◉` : '0 ◉', `${countLabel(partyMembers.length, 'party member')}`],
    ].forEach(([kind, text, fullText]) => {
      const chip = document.createElement('span');
      chip.dataset.kind = kind;
      chip.title = fullText;
      chip.setAttribute('aria-label', fullText);
      chip.textContent = text;
      chipRow.appendChild(chip);
    });
    selected.appendChild(chipRow);

    const visualSurveyBridge = expeditionSurveyBridge(model);
    if (visualSurveyBridge && String(visualSurveyBridge.activeCellId || '') === String(selectedCell.cellId || '')) {
      appendExpeditionSurveyBridge(selected, visualSurveyBridge, {
        scope: 'map-selected',
        testId: 'fp-expedition-survey-bridge-map-selected',
      });
    }

    appendExpeditionReceiptTrace(selected, selectedCell, packet, 'map-selected');
    appendExpeditionPartyBadges(selected, partyMembers, 'map-selected');
    hud.appendChild(selected);
    card.appendChild(hud);
    return hud;
  }

  const EXPEDITION_UNIT_SPRITE_ASSET_BASE = '/experiences/founders-plot/assets/expedition-map/hq15e-expedition-unit-marker-sprites-v1';
  const EXPEDITION_UNIT_SPRITE_PATHS = {
    scout: `${EXPEDITION_UNIT_SPRITE_ASSET_BASE}/scout-pathfinder-v1.png`,
    courier: `${EXPEDITION_UNIT_SPRITE_ASSET_BASE}/courier-signal-runner-v1.png`,
    surveyor: `${EXPEDITION_UNIT_SPRITE_ASSET_BASE}/surveyor-beacon-v1.png`,
    field_support: `${EXPEDITION_UNIT_SPRITE_ASSET_BASE}/surveyor-beacon-v1.png`,
    settler_convoy: `${EXPEDITION_UNIT_SPRITE_ASSET_BASE}/settler-convoy-v1.png`,
    outpost_crew: `${EXPEDITION_UNIT_SPRITE_ASSET_BASE}/outpost-crew-v1.png`
  };

  function expeditionUnitSpritePath(unit = {}) {
    const type = String(unit.unitType || '').toLowerCase();
    return EXPEDITION_UNIT_SPRITE_PATHS[type] || '';
  }

  function expeditionCompactCellLabel(cellId = '') {
    const id = String(cellId || '');
    if (!id) return 'UNPLACED';
    if (id === 'cell_origin') return 'ORIGIN';
    const match = id.match(/^cell_q(-?\d+)_r(-?\d+)$/);
    if (match) return `Q${match[1]} R${match[2]}`;
    return friendlyToken(id).replace(/^Cell\s+/i, '').toUpperCase();
  }

  function expeditionFogShortLabel(fogState = '') {
    switch (String(fogState || '').toLowerCase()) {
      case 'discovered': return '◆';
      case 'known': return '●';
      case 'hinted': return '◇';
      case 'locked_unknown': return '□';
      default: return '◎';
    }
  }

  function expeditionFogCompactTitle(fogState = '') {
    const info = expeditionFogDefinition(fogState);
    return `${info.label}: ${info.meaning}`;
  }

  function expeditionUnitRoleCode(unit = {}) {
    switch (String(unit.unitType || '').toLowerCase()) {
      case 'scout': return 'SCT';
      case 'courier': return 'MSG';
      case 'surveyor': return 'SVY';
      case 'settler_convoy': return 'CNV';
      case 'outpost_crew': return 'OUT';
      case 'field_support': return 'SUP';
      default: return 'UNIT';
    }
  }

  function expeditionUnitRoleGlyph(unit = {}) {
    switch (String(unit.unitType || '').toLowerCase()) {
      case 'scout': return '⌖';
      case 'courier': return '✉';
      case 'surveyor': return '▧';
      case 'settler_convoy': return '▣';
      case 'outpost_crew': return '⌂';
      case 'field_support': return '◉';
      default: return '◎';
    }
  }

  function expeditionMapCommandActions(unit = {}) {
    const commandHints = Array.isArray(unit.commandHints) ? unit.commandHints : [];
    return commandHints.filter((command) => {
      const commandId = String(command.commandId || '');
      if (command.enabled === false) return false;
      if (commandId === 'prepare_settler_convoy') return !!(command.sourcePlanId || unit.sourcePlanId);
      if (commandId === 'found_settlement') return !!(command.claimId || unit.sourceClaimId);
      return false;
    });
  }

  function expeditionUnitActionCount(unit = {}, model = {}, selectedCell = null) {
    const scoutAction = expeditionUnitScoutCommandTarget(unit, selectedCell, model).targetCell?.cellId ? 1 : 0;
    return scoutAction + expeditionUnitMoveTargets(unit, model).length + expeditionMapCommandActions(unit).length;
  }

  function expeditionNearestScoutableCell(sourceCell = null, model = {}) {
    const targets = expeditionCells(model).filter(isExpeditionScoutSectorEligible);
    if (!targets.length) return null;
    if (!sourceCell) return targets[0];
    const sourceQ = Number(sourceCell.q || 0);
    const sourceR = Number(sourceCell.r || 0);
    return targets
      .map((cell) => ({
        cell,
        distance: Math.abs(Number(cell.q || 0) - sourceQ)
          + Math.abs(Number(cell.r || 0) - sourceR)
          + Math.abs((Number(cell.q || 0) + Number(cell.r || 0)) - (sourceQ + sourceR)),
      }))
      .sort((a, b) => a.distance - b.distance)[0]?.cell || targets[0];
  }

  function expeditionOutpostStatusModel(unit = {}, selectedCell = null, model = {}) {
    const unitType = String(unit.unitType || '').toLowerCase();
    const cellStatus = String(selectedCell?.status || '').toUpperCase();
    const cellKind = String(selectedCell?.kind || '').toLowerCase();
    const selectedIsOutpost = cellStatus === 'OWNED_OUTPOST' || cellKind === 'owned_outpost';
    const unitCellId = String(unit.cellId || unit.location?.cellId || '').trim();
    const unitCell = unitCellId
      ? expeditionCells(model).find((cell) => String(cell.cellId || '') === unitCellId) || null
      : null;
    const outpostCell = unitType === 'outpost_crew'
      ? (unitCell || (selectedIsOutpost ? selectedCell : null))
      : (selectedIsOutpost ? selectedCell : null);
    if (!outpostCell) return null;
    const sourceIds = outpostCell?.sourceIds || {};
    const nextCell = expeditionNearestScoutableCell(outpostCell, model);
    const claimId = String(unit.sourceClaimId || sourceIds.claimId || sourceIds.originClaimId || '');
    const foundedPlotId = String(sourceIds.plotId || sourceIds.foundedPlotId || '');
    const stateText = friendlyToken(unit.state || outpostCell?.status || 'stationed');
    return {
      unitId: String(unit.unitId || ''),
      cellId: String(outpostCell?.cellId || unit.cellId || unit.location?.cellId || ''),
      claimId,
      foundedPlotId,
      stateText,
      stateShort: /stationed|owned|founded/i.test(stateText) ? 'Set' : stateText.slice(0, 8),
      nextCell,
      sourceIds,
      authorityBoundary: unit.authorityBoundary || model.units?.authorityBoundary || model.authorityBoundary || '',
    };
  }

  function appendExpeditionOutpostStatusSurface(parent, unit = {}, selectedCell = null, model = {}) {
    const outpost = expeditionOutpostStatusModel(unit, selectedCell, model);
    if (!parent || !outpost) return null;
    const surface = document.createElement('section');
    surface.className = 'fp-expedition-outpost-status';
    surface.dataset.testid = 'fp-expedition-outpost-status';
    surface.dataset.unitId = outpost.unitId;
    surface.dataset.cellId = outpost.cellId;
    surface.dataset.claimId = outpost.claimId;
    surface.dataset.foundedPlotId = outpost.foundedPlotId;
    surface.dataset.readOnly = 'true';
    surface.dataset.actions = '0';
    surface.dataset.nextCellId = String(outpost.nextCell?.cellId || '');
    surface.dataset.bridgeTargetCellId = String(outpost.nextCell?.cellId || '');
    surface.dataset.bridgeCommandId = outpost.nextCell ? 'scout_sector' : '';
    surface.dataset.bridgeReadOnly = 'true';
    surface.dataset.bridgeActions = '0';
    surface.dataset.hudInstrument = 'outpost-context';
    bindExpeditionGeneratedHudChrome(surface, 'selected-context');
    if (outpost.nextCell?.cellId) surface.dataset.mapNativeCue = 'next_scout';

    const chips = document.createElement('div');
    chips.className = 'fp-expedition-outpost-status__chips';
    [
      ['⌂', outpost.stateShort, `Outpost crew ${outpost.stateText}`],
      ['●', expeditionCompactCellLabel(outpost.cellId), `Owned outpost cell ${outpost.cellId}`],
      outpost.nextCell
        ? ['◇', expeditionCompactCellLabel(outpost.nextCell.cellId), `Next spatial step: Scout Sector target ${outpost.nextCell.cellId}`]
        : ['◎', 'Hold', 'No adjacent server-exposed frontier hint in this read model'],
      ['0', '✦', 'No outpost command authority exposed'],
    ].forEach(([icon, text, fullText], index) => {
      const chip = document.createElement('span');
      chip.textContent = `${icon} ${text}`;
      chip.title = fullText;
      chip.setAttribute('aria-label', fullText);
      if (index === 2) {
        chip.dataset.testid = 'fp-expedition-outpost-next-frontier';
        chip.dataset.cellId = String(outpost.nextCell?.cellId || '');
        chip.dataset.commandId = outpost.nextCell ? 'scout_sector' : '';
        chip.dataset.readOnly = 'true';
        chip.dataset.actions = '0';
      }
      chips.appendChild(chip);
    });
    surface.appendChild(chips);

    if (outpost.nextCell?.cellId) {
      const cue = document.createElement('div');
      cue.className = 'fp-expedition-outpost-status__next-cue';
      cue.dataset.testid = 'fp-expedition-outpost-next-scout-cue';
      cue.dataset.commandId = 'scout_sector';
      cue.dataset.cellId = String(outpost.nextCell.cellId || '');
      cue.dataset.visualOnly = 'true';
      cue.dataset.readOnly = 'true';
      cue.dataset.actions = '0';
      cue.dataset.routeAuthority = 'false';
      cue.dataset.resourceDelta = '{}';
      cue.dataset.hudInstrument = 'next-scout-cue';
      bindExpeditionGeneratedHudChrome(cue, 'command-puck');
      cue.title = `Next Scout cue for ${outpost.nextCell.cellId}. The actual mutation remains the existing Scout Sector command.`;
      cue.setAttribute('aria-label', cue.title);
      const icon = document.createElement('i');
      icon.textContent = '⌖';
      icon.setAttribute('aria-hidden', 'true');
      const label = document.createElement('strong');
      label.textContent = 'Next Scout';
      const target = document.createElement('small');
      target.textContent = expeditionCompactCellLabel(outpost.nextCell.cellId);
      cue.append(icon, label, target);
      surface.appendChild(cue);
    }

    const detailBody = document.createElement('div');
    detailBody.className = 'fp-expedition-inspector-section__body';
    const copy = document.createElement('p');
    copy.textContent = 'Server-owned outpost status projected from the selected owned cell and outpost_crew unit. It adds no client command or gameplay authority.';
    detailBody.appendChild(copy);
    appendChipSet(detailBody, [
      outpost.claimId ? `claim ${outpost.claimId}` : '',
      outpost.foundedPlotId ? `plot ${outpost.foundedPlotId}` : '',
      outpost.authorityBoundary ? `authority ${friendlyToken(outpost.authorityBoundary)}` : '',
    ]);
    appendExpeditionAuditDetails(surface, 'Details', [detailBody], 'fp-expedition-outpost-status-details');
    parent.appendChild(surface);
    return surface;
  }

  function expeditionShortCommandLabel(commandId = '', fallback = '') {
    const id = String(commandId || '');
    if (id === 'scout_sector') return 'Scout';
    if (id === 'prepare_settler_convoy') return 'Convoy';
    if (id === 'found_settlement') return 'Found';
    if (id === 'move_unit') return 'Move';
    if (/inspect/i.test(fallback)) return 'Inspect';
    return String(fallback || friendlyToken(id || 'Command')).replace(/\s+sector$/i, '').slice(0, 14);
  }

  function setCommandButtonA11y(button, icon, label, fullLabel) {
    if (!button) return;
    button.dataset.commandIcon = icon;
    button.dataset.iconOnly = String(label || '') === String(icon || '') ? 'true' : 'false';
    button.title = fullLabel;
    button.setAttribute('aria-label', fullLabel);
    if (label) button.textContent = label;
  }

  function appendExpeditionUnitRoster(card, model, selectedCell) {
    const units = expeditionUnits(model);
    if (!card || !units.length) return null;
    const selectedUnit = selectedExpeditionUnit(model, selectedCell);
    if (selectedUnit?.unitId) state.expeditionSelectedUnitId = String(selectedUnit.unitId);
    const movementReady = units.some((unit) => unit.movement?.movementMutationImplemented === true);

    const roster = document.createElement('section');
    roster.className = 'fp-expedition-unit-roster';
    roster.dataset.testid = 'fp-expedition-unit-roster';
    roster.dataset.readOnly = 'true';
    roster.dataset.actions = '0';
    roster.dataset.movementMutation = movementReady ? 'true' : 'false';
    roster.dataset.hudInstrument = 'unit-dock';
    bindExpeditionGeneratedHudChrome(roster, 'unit-dock');

    const head = document.createElement('div');
    head.className = 'fp-expedition-unit-roster__head';
    const title = document.createElement('strong');
    title.textContent = '◉';
    title.title = 'Map units';
    title.setAttribute('aria-label', 'Map units');
    const meta = document.createElement('small');
    const readyActions = units.reduce((total, unit) => total + expeditionUnitActionCount(unit, model, selectedCell), 0);
    meta.textContent = movementReady
      ? `${units.length} ◉ ${readyActions} ✦`
      : `${units.length} ◉`;
    meta.title = movementReady
      ? `${countLabel(units.length, 'unit')}; ${countLabel(readyActions, 'ready command')}; movement ready`
      : `${countLabel(units.length, 'unit')}; movement pending server slice`;
    meta.setAttribute('aria-label', meta.title);
    head.append(title, meta);
    roster.appendChild(head);

    const rail = document.createElement('div');
    rail.className = 'fp-expedition-unit-rail';
    units.forEach((unit) => {
      const selected = String(unit.unitId || '') === String(state.expeditionSelectedUnitId || selectedUnit?.unitId || '');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `fp-expedition-unit-token fp-expedition-unit-token--${safeTestId(unit.unitType)}${selected ? ' fp-expedition-unit-token--selected' : ''}`;
      button.dataset.testid = `fp-expedition-unit-token-${safeTestId(unit.unitId)}`;
      button.dataset.unitId = String(unit.unitId || '');
      button.dataset.unitType = String(unit.unitType || '');
      button.dataset.cellId = String(unit.cellId || '');
      button.dataset.generatedHudProfileMask = 'three-canvas-circle';
      button.dataset.generatedHudMaskLayer = EXPEDITION_GENERATED_HUD_MASK_LAYER_ID;
      button.dataset.readOnly = unit.readOnly === false ? 'false' : 'true';
      button.dataset.movementMutation = unit.movement?.movementMutationImplemented === true ? 'true' : 'false';
      const unitActionCount = expeditionUnitActionCount(unit, model, selected ? selectedCell : null);
      button.dataset.actions = String(unitActionCount);
      const unitTitle = `${unit.displayName || expeditionUnitTypeLabel(unit)} - ${expeditionUnitTypeLabel(unit)} at ${unit.cellId || 'unplaced'}; ${unitActionCount ? countLabel(unitActionCount, 'ready command') : 'no ready commands'}.`;
      button.title = unitTitle;
      button.setAttribute('aria-label', `${unitTitle}${selected ? ' Selected.' : ''}`);
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
      button.addEventListener('click', () => {
        selectExpeditionUnit(unit, model, unit.cellId);
        renderExpeditionMap(state.bundle || {});
      });
      const icon = document.createElement('i');
      icon.className = 'fp-expedition-unit-token__sprite';
      const spritePath = expeditionUnitSpritePath(unit);
      if (spritePath) icon.style.setProperty('--unit-sprite', `url("${spritePath}")`);
      icon.textContent = expeditionUnitToken(unit);
      icon.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span');
      label.className = 'fp-expedition-unit-token__meta';
      const name = document.createElement('strong');
      name.textContent = expeditionUnitRoleGlyph(unit);
      name.title = unit.displayName || expeditionUnitTypeLabel(unit);
      const role = document.createElement('small');
      role.textContent = expeditionFogShortLabel(unit.location?.fogState || unit.fogState || '');
      role.title = unit.cellId || 'unplaced';
      const ready = document.createElement('b');
      ready.className = 'fp-expedition-unit-token__ready';
      ready.dataset.actions = String(unitActionCount);
      ready.title = unitActionCount ? countLabel(unitActionCount, 'ready command') : 'No ready commands';
      ready.textContent = unitActionCount ? String(unitActionCount) : '0';
      label.append(name, role, ready);
      button.append(icon, label);
      rail.appendChild(button);
    });
    roster.appendChild(rail);

    if (selectedUnit) {
      const scoutCommandTarget = expeditionUnitScoutCommandTarget(selectedUnit, selectedCell, model);
      const moveTargets = expeditionUnitMoveTargets(selectedUnit, model);
      const commandHints = Array.isArray(selectedUnit.commandHints) ? selectedUnit.commandHints : [];
      const mapCommandActions = expeditionMapCommandActions(selectedUnit);
      const actionCount = (scoutCommandTarget.targetCell?.cellId ? 1 : 0) + moveTargets.length + mapCommandActions.length;
      roster.dataset.actions = String(actionCount);
      const commandBar = document.createElement('div');
      commandBar.className = 'fp-expedition-unit-command-bar';
      commandBar.dataset.testid = 'fp-expedition-unit-command-bar';
      commandBar.dataset.unitId = String(selectedUnit.unitId || '');
      commandBar.dataset.cellId = String(selectedUnit.cellId || '');
      commandBar.dataset.readOnly = 'true';
      commandBar.dataset.movementMutation = selectedUnit.movement?.movementMutationImplemented === true ? 'true' : 'false';
      commandBar.dataset.actions = String(actionCount);
      commandBar.dataset.hudInstrument = 'command-puck';
      bindExpeditionGeneratedHudChrome(commandBar, 'command-puck');
      const label = document.createElement('small');
      label.className = 'fp-expedition-unit-command-bar__unit';
      label.dataset.testid = 'fp-expedition-unit-command-selected';
      label.dataset.unitName = String(selectedUnit.displayName || '');
      label.title = `${selectedUnit.displayName || expeditionUnitTypeLabel(selectedUnit)} selected at ${selectedUnit.cellId || 'unplaced'}`;
      label.setAttribute('aria-label', label.title);
      label.textContent = `${expeditionUnitToken(selectedUnit)} ${expeditionUnitRoleGlyph(selectedUnit)}`;
      commandBar.appendChild(label);
      commandHints.slice(0, 4).forEach((command) => {
        const commandId = String(command.commandId || '');
        if (commandId === 'move_unit' && moveTargets.length) {
          moveTargets.slice(0, 3).forEach((targetCell) => {
            const targetCellId = String(targetCell.cellId || '');
            const pending = state.expeditionUnitMovePendingId === `${selectedUnit.unitId}:${targetCellId}`;
            const button = brassBtn(pending ? '⏳' : '↦', `fp-btn-move-expedition-unit-${safeTestId(selectedUnit.unitId)}-${safeTestId(targetCellId)}`, () => {
              state.expeditionSelectedUnitId = String(selectedUnit.unitId || '');
              state.expeditionSelectedCellId = targetCellId;
              doMoveExpeditionUnit(selectedUnit.unitId, targetCellId);
            });
            button.classList.add('fp-brass-btn--small', 'fp-expedition-unit-command-bar__button');
            setCommandButtonA11y(button, '↦', pending ? '⏳' : '↦', `Move ${selectedUnit.displayName || expeditionUnitTypeLabel(selectedUnit)} to ${targetCellId}`);
            button.dataset.testid = `fp-btn-move-expedition-unit-${safeTestId(selectedUnit.unitId)}-${safeTestId(targetCellId)}`;
            button.dataset.unitId = String(selectedUnit.unitId || '');
            button.dataset.cellId = targetCellId;
            button.dataset.commandId = commandId;
            button.dataset.serverMutationImplemented = 'true';
            button.dataset.idempotencyKey = expeditionUnitMoveIdempotencyKey(state.bundle || {}, model, selectedUnit, targetCell);
            button.disabled = !!state.expeditionUnitMovePendingId;
            commandBar.appendChild(button);
            const target = document.createElement('span');
            target.className = 'fp-expedition-unit-command-chip fp-expedition-unit-command-chip--target';
            target.dataset.testid = 'fp-expedition-unit-move-target';
            target.dataset.cellId = targetCellId;
            target.dataset.fogState = String(targetCell.fogState || '');
            target.title = `Move target ${targetCellId}`;
            target.setAttribute('aria-label', `Move target ${targetCellId}, ${friendlyToken(targetCell.fogState || '')}`);
            target.title = `${target.title}. ${expeditionFogCompactTitle(targetCell.fogState)}`;
            target.textContent = `↦ ${expeditionFogShortLabel(targetCell.fogState)}`;
            commandBar.appendChild(target);
          });
          return;
        }
        if (commandId === 'scout_sector' && scoutCommandTarget.targetCell?.cellId) {
          const targetCell = scoutCommandTarget.targetCell;
          const targetCellId = String(targetCell.cellId || '');
          const pending = state.scoutSectorPendingCellId === targetCellId;
          const button = brassBtn(pending ? '⏳' : '⌖', `fp-btn-scout-sector-unit-command-${safeTestId(targetCellId)}`, () => {
            state.expeditionSelectedUnitId = String(selectedUnit.unitId || '');
            state.expeditionSelectedCellId = targetCellId;
            doScoutExpeditionSector(targetCellId);
          });
          button.classList.add('fp-brass-btn--small', 'fp-expedition-unit-command-bar__button');
          setCommandButtonA11y(button, '⌖', pending ? '⏳' : '⌖', `Scout Sector with ${selectedUnit.displayName || expeditionUnitTypeLabel(selectedUnit)} at ${targetCellId}`);
          button.dataset.testid = `fp-btn-scout-sector-unit-command-${safeTestId(targetCellId)}`;
          button.dataset.unitId = String(selectedUnit.unitId || '');
          button.dataset.cellId = targetCellId;
          button.dataset.commandId = commandId;
          button.dataset.serverMutationImplemented = 'true';
          button.dataset.idempotencyKey = scoutSectorIdempotencyKey(state.bundle || {}, model, targetCell);
          button.disabled = !!state.scoutSectorPendingCellId;
          commandBar.appendChild(button);
          const target = document.createElement('span');
          target.className = 'fp-expedition-unit-command-chip fp-expedition-unit-command-chip--target';
          target.dataset.testid = 'fp-expedition-unit-command-target';
          target.dataset.cellId = targetCellId;
          target.dataset.fogState = String(targetCell.fogState || '');
          target.title = `Scout target ${targetCellId}`;
          target.setAttribute('aria-label', `Scout Sector target ${targetCellId}, ${friendlyToken(targetCell.fogState || '')}`);
          target.title = `${target.title}. ${expeditionFogCompactTitle(targetCell.fogState)}`;
          target.textContent = `⌖ ${expeditionFogShortLabel(targetCell.fogState)}`;
          commandBar.appendChild(target);
          return;
        }
        if (commandId === 'prepare_settler_convoy' && command.enabled !== false) {
          const planId = String(command.sourcePlanId || selectedUnit.sourcePlanId || '');
          if (planId) {
            const pending = state.convoyPendingPlanId === planId;
            const button = brassBtn(pending ? '⏳' : '▣', `fp-btn-prepare-settler-convoy-unit-command-${safeTestId(planId)}`, () => {
              state.expeditionSelectedUnitId = String(selectedUnit.unitId || '');
              if (selectedUnit.cellId) state.expeditionSelectedCellId = String(selectedUnit.cellId || '');
              doPrepareSettlerConvoy(planId);
            });
            button.classList.add('fp-brass-btn--small', 'fp-expedition-unit-command-bar__button');
            setCommandButtonA11y(button, '▣', pending ? '⏳' : '▣', `Prepare Convoy from site plan ${planId}`);
            button.dataset.testid = `fp-btn-prepare-settler-convoy-unit-command-${safeTestId(planId)}`;
            button.dataset.unitId = String(selectedUnit.unitId || '');
            button.dataset.planId = planId;
            button.dataset.cellId = String(selectedUnit.cellId || '');
            button.dataset.commandId = commandId;
            button.dataset.serverMutationImplemented = 'true';
            button.disabled = !!state.convoyPendingPlanId;
            commandBar.appendChild(button);
            const target = document.createElement('span');
            target.className = 'fp-expedition-unit-command-chip fp-expedition-unit-command-chip--target';
            target.dataset.testid = 'fp-expedition-unit-command-plan-target';
            target.dataset.planId = planId;
            target.dataset.cellId = String(selectedUnit.cellId || '');
            target.title = `Site plan ${planId}`;
            target.setAttribute('aria-label', `Site plan target ${planId}`);
            target.textContent = '▧';
            commandBar.appendChild(target);
            return;
          }
        }
        if (commandId === 'found_settlement' && command.enabled !== false) {
          const claimId = String(command.claimId || selectedUnit.sourceClaimId || '');
          if (claimId) {
            const pending = state.foundingPendingClaimId === claimId;
            const button = brassBtn(pending ? '⏳' : '⌂', `fp-btn-found-settlement-unit-command-${safeTestId(claimId)}`, () => {
              state.expeditionSelectedUnitId = String(selectedUnit.unitId || '');
              if (selectedUnit.cellId) state.expeditionSelectedCellId = String(selectedUnit.cellId || '');
              doFoundSettlement(claimId);
            });
            button.classList.add('fp-brass-btn--small', 'fp-expedition-unit-command-bar__button');
            setCommandButtonA11y(button, '⌂', pending ? '⏳' : '⌂', `Found Outpost from claim ${claimId}`);
            button.dataset.testid = `fp-btn-found-settlement-unit-command-${safeTestId(claimId)}`;
            button.dataset.unitId = String(selectedUnit.unitId || '');
            button.dataset.claimId = claimId;
            button.dataset.cellId = String(selectedUnit.cellId || '');
            button.dataset.commandId = commandId;
            button.dataset.serverMutationImplemented = 'true';
            button.disabled = !!state.foundingPendingClaimId;
            commandBar.appendChild(button);
            const target = document.createElement('span');
            target.className = 'fp-expedition-unit-command-chip fp-expedition-unit-command-chip--target';
            target.dataset.testid = 'fp-expedition-unit-command-claim-target';
            target.dataset.claimId = claimId;
            target.dataset.cellId = String(selectedUnit.cellId || '');
            target.title = `Outpost claim ${claimId}`;
            target.setAttribute('aria-label', `Outpost claim target ${claimId}`);
            target.textContent = '⌂';
            commandBar.appendChild(target);
            return;
          }
        }
        const chip = document.createElement('span');
        chip.className = 'fp-expedition-unit-command-chip';
        chip.dataset.testid = `fp-expedition-unit-command-${safeTestId(command.commandId || command.label || 'command')}`;
        chip.dataset.commandId = commandId;
        chip.dataset.serverMutationImplemented = command.serverMutationImplemented === true ? 'true' : 'false';
        const commandEnabled = commandId === 'scout_sector'
          ? false
          : command.enabled !== false;
        chip.dataset.enabled = commandEnabled ? 'true' : 'false';
        chip.textContent = commandId === 'scout_sector'
          ? '⌖×'
          : expeditionGuidedCommandIcon(commandId) || expeditionShortCommandLabel(commandId, command.label || friendlyToken(command.commandId || 'unit command'));
        chip.title = command.label || friendlyToken(command.commandId || 'unit command');
        chip.setAttribute('aria-label', chip.title);
        commandBar.appendChild(chip);
      });
      const move = document.createElement('span');
      move.className = 'fp-expedition-unit-command-chip fp-expedition-unit-command-chip--count';
      move.dataset.testid = 'fp-expedition-unit-command-move-preview';
      move.dataset.enabled = moveTargets.length ? 'true' : 'false';
      move.dataset.count = String(moveTargets.length);
      move.title = moveTargets.length ? countLabel(moveTargets.length, 'move target') : 'Move locked';
      move.setAttribute('aria-label', move.title);
      move.textContent = moveTargets.length ? `${moveTargets.length} ↦` : '0 ↦';
      commandBar.appendChild(move);
      const movement = document.createElement('span');
      movement.className = 'fp-expedition-unit-command-chip fp-expedition-unit-command-chip--authority';
      movement.dataset.testid = 'fp-expedition-unit-movement-boundary';
      movement.dataset.enabled = selectedUnit.movement?.movementMutationImplemented === true ? 'true' : 'false';
      movement.title = selectedUnit.movement?.movementMutationImplemented === true
        ? 'Server movement active'
        : 'Movement pending server slice';
      movement.setAttribute('aria-label', movement.title);
      movement.textContent = selectedUnit.movement?.movementMutationImplemented === true ? '↦' : '⏳';
      commandBar.appendChild(movement);
      roster.appendChild(commandBar);
      appendExpeditionOutpostStatusSurface(roster, selectedUnit, selectedCell, model);
    }

    card.appendChild(roster);
    return roster;
  }

  function expeditionResourceHintsText(resourceHints = {}) {
    const entries = RESOURCE_KEYS
      .map((key) => [key, Number(resourceHints?.[key] || 0)])
      .filter(([, value]) => value > 0)
      .map(([key, value]) => `${key} +${value}`);
    return entries.length ? entries.join(', ') : '';
  }

  function expeditionCellKindLabel(cell = {}) {
    const status = String(cell.status || '');
    if (status.includes('OUTPOST') || String(cell.kind || '').includes('outpost')) return '⌂';
    if (status.includes('SITE_PLAN')) return '▧';
    if (status.includes('SCOUT')) return '⌖';
    if (String(cell.fogState || '') === 'hinted') return '◇';
    if (String(cell.fogState || '') === 'locked_unknown') return '□';
    if (String(cell.kind || '') === 'origin_plot') return 'HQ';
    return '◎';
  }

  function isExpeditionScoutSectorEligible(cell = {}) {
    return String(cell.fogState || '') === 'hinted'
      && String(cell.kind || '') === 'frontier_hint';
  }

  function scoutSectorIdempotencyKey(bundle, model, cell) {
    const plotId = safeTestId(bundle?.plotId || state.plotId || 'plot');
    const cellId = safeTestId(cell?.cellId || 'cell');
    const projection = safeTestId(model?.projectionHash || bundle?.stateHash || cell?.sourceIds?.adjacentCellId || 'projection');
    return `fp-scout-sector-${plotId}-${cellId}-${projection}`;
  }

  function expeditionUnitMoveIdempotencyKey(bundle, model, unit, targetCell) {
    const plotId = safeTestId(bundle?.plotId || state.plotId || 'plot');
    const unitId = safeTestId(unit?.unitId || 'unit');
    const sourceCellId = safeTestId(unit?.cellId || unit?.location?.cellId || 'source');
    const targetCellId = safeTestId(targetCell?.cellId || 'target');
    const projection = safeTestId(model?.projectionHash || bundle?.stateHash || 'projection');
    return `fp-expedition-unit-move-${plotId}-${unitId}-${sourceCellId}-${targetCellId}-${projection}`;
  }

  function expeditionCommandHint(unit = {}, commandId = '') {
    return (Array.isArray(unit.commandHints) ? unit.commandHints : [])
      .find((command) => String(command.commandId || '') === String(commandId || '')) || null;
  }

  function clearExpeditionCommandPreview() {
    state.expeditionCommandPreview = null;
  }

  function expeditionCommandPreviewFromDetail(detail = {}) {
    const commandId = String(detail.commandId || '').trim();
    const unitId = String(detail.unitId || '').trim();
    const cellId = String(detail.cellId || detail.targetCellId || '').trim();
    if (!commandId || !unitId || !cellId) return null;
    const bundle = state.bundle || {};
    const model = expeditionMapModel(bundle);
    const cells = expeditionCells(model);
    const targetCell = cells.find((cell) => String(cell.cellId || '') === cellId);
    const unit = expeditionUnits(model).find((entry) => String(entry.unitId || '') === unitId);
    if (!unit || !targetCell) return null;
    const command = expeditionCommandHint(unit, commandId);
    if (!command && commandId !== 'move_unit') return null;
    const targetCellIds = Array.isArray(command?.targetCellIds)
      ? command.targetCellIds.map((target) => String(target || '')).filter(Boolean)
      : [];
    const preview = {
      commandId,
      unitId,
      unitType: unit.unitType,
      unitName: unit.displayName || expeditionUnitTypeLabel(unit),
      cellId,
      cellLabel: expeditionCompactCellLabel(cellId),
      fogState: String(targetCell.fogState || ''),
      fogLabel: expeditionFogShortLabel(targetCell.fogState),
      serverMutationImplemented: command?.serverMutationImplemented === true,
      readModelValidated: true,
      previewOnly: true,
    };

    if (commandId === 'move_unit') {
      const moveTarget = expeditionUnitMoveTargets(unit, model)
        .find((cell) => String(cell.cellId || '') === cellId);
      if (!moveTarget) return null;
      preview.label = 'Move';
      preview.icon = '↦';
      preview.serverMutationImplemented = unit.movement?.movementMutationImplemented === true;
      preview.idempotencyKey = expeditionUnitMoveIdempotencyKey(bundle, model, unit, moveTarget);
      preview.ariaLabel = `Preview Move ${preview.unitName} to ${cellId}`;
      return preview.serverMutationImplemented ? preview : null;
    }

    if (commandId === 'scout_sector') {
      const scoutTarget = expeditionUnitScoutCommandTarget(unit, targetCell, model).targetCell;
      if (!scoutTarget || String(scoutTarget.cellId || '') !== cellId) return null;
      preview.label = 'Scout';
      preview.icon = '⌖';
      preview.serverMutationImplemented = command?.serverMutationImplemented === true;
      preview.idempotencyKey = scoutSectorIdempotencyKey(bundle, model, scoutTarget);
      preview.ariaLabel = `Preview Scout Sector with ${preview.unitName} at ${cellId}`;
      return preview.serverMutationImplemented ? preview : null;
    }

    if (commandId === 'prepare_settler_convoy') {
      const planId = String(command?.sourcePlanId || unit.sourcePlanId || '');
      const targetMatches = !targetCellIds.length || targetCellIds.includes(cellId) || String(unit.cellId || '') === cellId;
      if (!planId || !targetMatches || command?.enabled === false) return null;
      preview.label = 'Convoy';
      preview.icon = '▣';
      preview.planId = planId;
      preview.serverMutationImplemented = command?.serverMutationImplemented === true;
      preview.ariaLabel = `Preview Prepare Convoy from site plan ${planId}`;
      return preview.serverMutationImplemented ? preview : null;
    }

    if (commandId === 'found_settlement') {
      const claimId = String(command?.claimId || unit.sourceClaimId || '');
      const targetMatches = !targetCellIds.length || targetCellIds.includes(cellId) || String(unit.cellId || '') === cellId;
      if (!claimId || !targetMatches || command?.enabled === false) return null;
      preview.label = 'Found';
      preview.icon = '⌂';
      preview.claimId = claimId;
      preview.serverMutationImplemented = command?.serverMutationImplemented === true;
      preview.ariaLabel = `Preview Found Outpost from claim ${claimId}`;
      return preview.serverMutationImplemented ? preview : null;
    }

    return null;
  }

  function appendExpeditionCommandPreview(host) {
    const preview = expeditionCommandPreviewFromDetail(state.expeditionCommandPreview || {});
    if (!preview || !host) {
      clearExpeditionCommandPreview();
      return null;
    }
    state.expeditionCommandPreview = preview;
    const pending = !!(state.expeditionUnitMovePendingId || state.scoutSectorPendingCellId || state.convoyPendingPlanId || state.foundingPendingClaimId);
    const panel = document.createElement('section');
    panel.className = `fp-expedition-command-preview fp-expedition-command-preview--${safeTestId(preview.commandId)}`;
    panel.dataset.testid = 'fp-expedition-command-preview';
    panel.dataset.commandId = preview.commandId;
    panel.dataset.unitId = preview.unitId;
    panel.dataset.cellId = preview.cellId;
    panel.dataset.previewOnly = 'true';
    panel.dataset.serverMutationImplemented = preview.serverMutationImplemented ? 'true' : 'false';
    panel.dataset.hudInstrument = 'command-preview';
    bindExpeditionGeneratedHudChrome(panel, 'command-tray');
    panel.title = preview.ariaLabel || `${preview.label} ${preview.cellId}`;
    panel.setAttribute('aria-label', panel.title);
    ['pointerdown', 'pointermove', 'pointerup', 'click', 'wheel'].forEach((eventName) => {
      panel.addEventListener(eventName, (event) => event.stopPropagation());
    });

    const icon = document.createElement('i');
    icon.textContent = preview.icon || '◎';
    icon.setAttribute('aria-hidden', 'true');
    const text = document.createElement('span');
    const title = document.createElement('strong');
    title.textContent = preview.label;
    const meta = document.createElement('small');
    meta.textContent = `${expeditionUnitRoleCode(preview)} · ${preview.cellLabel} · ${preview.fogLabel}`;
    text.append(title, meta);
    panel.append(icon, text);

    const actions = document.createElement('div');
    actions.className = 'fp-expedition-command-preview__actions';
    const confirm = brassBtn('Confirm', 'fp-btn-expedition-command-preview-confirm', () => confirmExpeditionCommandPreview());
    confirm.classList.add('fp-brass-btn--small');
    confirm.dataset.testid = 'fp-btn-expedition-command-preview-confirm';
    confirm.dataset.commandId = preview.commandId;
    confirm.dataset.unitId = preview.unitId;
    confirm.dataset.cellId = preview.cellId;
    confirm.disabled = pending;
    const cancel = brassBtn('×', 'fp-btn-expedition-command-preview-cancel', () => {
      clearExpeditionCommandPreview();
      renderExpeditionMap(state.bundle || {});
    });
    cancel.classList.add('fp-brass-btn--small', 'fp-expedition-command-preview__cancel');
    cancel.dataset.testid = 'fp-btn-expedition-command-preview-cancel';
    cancel.setAttribute('aria-label', 'Cancel command preview');
    actions.append(confirm, cancel);
    panel.appendChild(actions);
    host.appendChild(panel);
    return panel;
  }

  function confirmExpeditionCommandPreview() {
    const preview = expeditionCommandPreviewFromDetail(state.expeditionCommandPreview || {});
    if (!preview) {
      clearExpeditionCommandPreview();
      renderExpeditionMap(state.bundle || {});
      return toast('That map command target is no longer available.', 'danger');
    }
    clearExpeditionCommandPreview();
    state.expeditionSelectedUnitId = preview.unitId;
    state.expeditionSelectedCellId = preview.cellId;
    if (preview.commandId === 'move_unit') return doMoveExpeditionUnit(preview.unitId, preview.cellId);
    if (preview.commandId === 'scout_sector') return doScoutExpeditionSector(preview.cellId);
    if (preview.commandId === 'prepare_settler_convoy' && preview.planId) return doPrepareSettlerConvoy(preview.planId);
    if (preview.commandId === 'found_settlement' && preview.claimId) return doFoundSettlement(preview.claimId);
    renderExpeditionMap(state.bundle || {});
    return toast('That command preview is not executable from the map yet.', 'danger');
  }

  function expeditionCommandOutcomeDefaults(commandId = '') {
    switch (String(commandId || '')) {
      case 'move_unit':
        return { label: 'Moved', icon: '↦' };
      case 'scout_sector':
        return { label: 'Scouted', icon: '⌖' };
      case 'draft_site_plan_from_packet':
        return { label: 'Planned', icon: '◇' };
      case 'review_site_plan':
        return { label: 'Reviewed', icon: '✓' };
      case 'prepare_settler_convoy':
        return { label: 'Convoy', icon: '▣' };
      case 'found_settlement':
        return { label: 'Founded', icon: '⌂' };
      default:
        return { label: 'Done', icon: '◎' };
    }
  }

  function expeditionCommandHintTarget(model = {}, commandId = '', matcher = () => false) {
    for (const unit of expeditionUnits(model)) {
      for (const command of unit.commandHints) {
        if (String(command.commandId || '') !== String(commandId || '')) continue;
        if (!matcher(command, unit)) continue;
        const targetCellIds = Array.isArray(command.targetCellIds)
          ? command.targetCellIds.map((target) => String(target || '')).filter(Boolean)
          : [];
        return {
          unit,
          command,
          cellId: targetCellIds[0] || String(unit.cellId || ''),
        };
      }
    }
    return { unit: null, command: null, cellId: '' };
  }

  function expeditionFoundedOutpostResultTarget(model = {}, { claimId = '', foundedPlotId = '', fallbackCellId = '' } = {}) {
    const safeClaimId = String(claimId || '').trim();
    const safeFoundedPlotId = String(foundedPlotId || '').trim();
    const cells = expeditionCells(model);
    const outpostCells = cells.filter((cell) => {
      const sourceIds = cell?.sourceIds || {};
      return String(cell.kind || '') === 'owned_outpost'
        || String(cell.status || '') === 'OWNED_OUTPOST'
        || (safeFoundedPlotId && String(sourceIds.plotId || '') === safeFoundedPlotId)
        || (safeClaimId && (
          String(sourceIds.claimId || '') === safeClaimId
          || String(sourceIds.originClaimId || '') === safeClaimId
        ));
    });
    const cell = outpostCells.find((entry) => {
      const sourceIds = entry?.sourceIds || {};
      return safeClaimId && (
        String(sourceIds.claimId || '') === safeClaimId
        || String(sourceIds.originClaimId || '') === safeClaimId
      );
    }) || outpostCells.find((entry) => {
      const sourceIds = entry?.sourceIds || {};
      return safeFoundedPlotId && String(sourceIds.plotId || '') === safeFoundedPlotId;
    }) || outpostCells.find((entry) => (
      fallbackCellId && String(entry.cellId || '') === String(fallbackCellId || '')
    )) || null;

    const units = expeditionUnits(model);
    const unit = units.find((entry) => (
      String(entry.unitType || '') === 'outpost_crew'
      && safeClaimId
      && String(entry.sourceClaimId || '') === safeClaimId
    )) || units.find((entry) => (
      String(entry.unitType || '') === 'outpost_crew'
      && cell?.cellId
      && String(entry.cellId || '') === String(cell.cellId || '')
    )) || null;

    return {
      cell,
      unit,
      cellId: cell?.cellId || unit?.cellId || fallbackCellId || '',
    };
  }

  function clearExpeditionCommandOutcomeFeedback(feedbackId = '') {
    if (feedbackId && String(state.expeditionCommandOutcomeFeedback?.feedbackId || '') !== String(feedbackId)) return;
    state.expeditionCommandOutcomeFeedback = null;
    if (state.expeditionCommandOutcomeFeedbackTimer) {
      clearTimeout(state.expeditionCommandOutcomeFeedbackTimer);
      state.expeditionCommandOutcomeFeedbackTimer = 0;
    }
  }

  function setExpeditionCommandOutcomeFeedback(input = {}) {
    const commandId = String(input.commandId || '').trim();
    const cellId = String(input.cellId || input.targetCellId || '').trim();
    if (!commandId || !cellId) return null;
    const defaults = expeditionCommandOutcomeDefaults(commandId);
    const now = Date.now();
    const feedback = {
      feedbackId: `${safeTestId(commandId)}-${safeTestId(cellId)}-${now.toString(36)}`,
      commandId,
      unitId: String(input.unitId || state.expeditionSelectedUnitId || '').trim(),
      unitType: String(input.unitType || '').trim(),
      cellId,
      targetCellId: cellId,
      sourceCellId: String(input.sourceCellId || '').trim(),
      label: String(input.label || defaults.label),
      icon: String(input.icon || defaults.icon),
      receiptId: String(input.receiptId || '').trim(),
      receiptKind: String(input.receiptKind || commandId).trim(),
      serverOwnedResult: true,
      visualOnly: true,
      readOnly: true,
      executableActions: 0,
      routeAuthority: false,
      actionAuthority: false,
      createdAt: now,
      expiresAt: now + 9000,
    };
    feedback.ariaLabel = input.ariaLabel
      || `${feedback.label} ${expeditionUnitRoleCode(feedback)} at ${expeditionCompactCellLabel(feedback.cellId)} from server result.`;
    clearExpeditionCommandOutcomeFeedback();
    state.expeditionCommandOutcomeFeedback = feedback;
    state.expeditionCommandOutcomeFeedbackTimer = setTimeout(() => {
      clearExpeditionCommandOutcomeFeedback(feedback.feedbackId);
      renderExpeditionMap(state.bundle || {});
    }, Math.max(1000, feedback.expiresAt - now));
    return feedback;
  }

  function expeditionCommandOutcomeFeedbackForRender(model = {}, cells = []) {
    const feedback = state.expeditionCommandOutcomeFeedback;
    if (!feedback) return null;
    if (Number(feedback.expiresAt || 0) <= Date.now()) {
      clearExpeditionCommandOutcomeFeedback(feedback.feedbackId);
      return null;
    }
    const targetCell = cells.find((cell) => String(cell.cellId || '') === String(feedback.cellId || ''));
    if (!targetCell) return null;
    const unit = feedback.unitId
      ? expeditionUnits(model).find((entry) => String(entry.unitId || '') === String(feedback.unitId || ''))
      : null;
    return {
      ...feedback,
      unitType: feedback.unitType || String(unit?.unitType || ''),
      unitName: unit?.displayName || expeditionUnitTypeLabel(unit || feedback),
      cellLabel: expeditionCompactCellLabel(targetCell.cellId || feedback.cellId),
      fogState: String(targetCell.fogState || ''),
      fogLabel: expeditionFogShortLabel(targetCell.fogState),
    };
  }

  function appendExpeditionCommandOutcomeChip(host, outcome) {
    if (!host || !outcome) return null;
    const chip = document.createElement('section');
    chip.className = `fp-expedition-command-outcome fp-expedition-command-outcome--${safeTestId(outcome.commandId)}`;
    chip.dataset.testid = 'fp-expedition-command-outcome-chip';
    chip.dataset.commandId = String(outcome.commandId || '');
    chip.dataset.unitId = String(outcome.unitId || '');
    chip.dataset.cellId = String(outcome.cellId || '');
    chip.dataset.serverOwnedResult = 'true';
    chip.dataset.visualOnly = 'true';
    chip.dataset.readOnly = 'true';
    chip.dataset.executableActions = '0';
    chip.title = outcome.ariaLabel || `${outcome.label} ${outcome.cellLabel}`;
    chip.setAttribute('aria-label', chip.title);
    ['pointerdown', 'pointermove', 'pointerup', 'click', 'wheel'].forEach((eventName) => {
      chip.addEventListener(eventName, (event) => event.stopPropagation());
    });

    const icon = document.createElement('i');
    icon.textContent = outcome.icon || '◎';
    icon.setAttribute('aria-hidden', 'true');
    const text = document.createElement('span');
    const title = document.createElement('strong');
    title.textContent = outcome.label || 'Done';
    const meta = document.createElement('small');
    meta.textContent = `${expeditionUnitRoleCode(outcome)} · ${outcome.cellLabel} · ${outcome.fogLabel || '◎'}`;
    text.append(title, meta);
    chip.append(icon, text);
    host.appendChild(chip);
    return chip;
  }

  function expeditionCellBounds(cells) {
    const points = cells.map((cell) => {
      const q = Number(cell.q || 0);
      const r = Number(cell.r || 0);
      return { x: q + (r * 0.5), y: r * 0.86 };
    });
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const minX = Math.min(...xs, 0);
    const maxX = Math.max(...xs, 0);
    const minY = Math.min(...ys, 0);
    const maxY = Math.max(...ys, 0);
    return {
      minX,
      minY,
      rangeX: Math.max(1, maxX - minX),
      rangeY: Math.max(1, maxY - minY),
    };
  }

  function expeditionCellPosition(cell, bounds) {
    const q = Number(cell.q || 0);
    const r = Number(cell.r || 0);
    const x = q + (r * 0.5);
    const y = r * 0.86;
    return {
      left: 8 + (((x - bounds.minX) / bounds.rangeX) * 84),
      top: 10 + (((y - bounds.minY) / bounds.rangeY) * 80),
    };
  }

  function appendExpeditionMetrics(card, counts, scope = {}) {
    const metrics = document.createElement('div');
    metrics.className = 'fp-expedition-map-metrics';
    metrics.dataset.testid = 'fp-expedition-map-metrics';
    [
      ['Discovered', counts.discovered],
      ['Known', counts.known],
      ['Hinted', counts.hinted],
      ['Hidden', counts.locked_unknown],
      ['Outposts', scope.ownedPlotCount != null ? Math.max(0, Number(scope.ownedPlotCount || 0) - 1) : null],
    ].forEach(([label, value]) => {
      if (value == null) return;
      const item = document.createElement('span');
      const itemLabel = document.createElement('small');
      itemLabel.textContent = label;
      const itemValue = document.createElement('strong');
      itemValue.textContent = String(Number(value || 0));
      item.append(itemLabel, itemValue);
      metrics.appendChild(item);
    });
    card.appendChild(metrics);
  }

  function expeditionLatestPacket(model) {
    const packets = expeditionEventPackets(model);
    return packets.length ? packets[packets.length - 1] : null;
  }

  function expeditionSurveyBridge(model = {}) {
    const bridge = model?.surveyBridge && typeof model.surveyBridge === 'object' ? model.surveyBridge : null;
    if (!bridge || bridge.readOnly !== true) return null;
    return bridge;
  }

  function expeditionSurveyBridgeActiveCandidate(bridge = null) {
    const active = bridge?.activeCandidate && typeof bridge.activeCandidate === 'object'
      ? bridge.activeCandidate
      : null;
    if (active?.packetId) return active;
    const candidates = Array.isArray(bridge?.candidates) ? bridge.candidates : [];
    return candidates.find((candidate) => candidate?.packetId) || null;
  }

  function expeditionSurveyBridgeCandidateForPlan(bridge = null, planId = '') {
    const safePlanId = String(planId || '').trim();
    if (!safePlanId) return null;
    const candidates = [
      bridge?.activeCandidate,
      ...(Array.isArray(bridge?.candidates) ? bridge.candidates : []),
    ].filter((candidate) => candidate && typeof candidate === 'object');
    return candidates.find((candidate) => (
      String(candidate.sitePlan?.planId || '') === safePlanId
      || String(candidate.commandState?.sourcePlanId || '') === safePlanId
      || String(candidate.surveyorUnit?.sourcePlanId || '') === safePlanId
    )) || null;
  }

  function expeditionSurveyBridgeStatusLabel(status = '') {
    const key = String(status || '').toUpperCase();
    if (key === 'SURVEYOR_COMMAND_READY') return 'Ready';
    if (key === 'SITE_PLAN_PRESENT') return 'Ready';
    if (key === 'PACKET_READY_FOR_SITE_PLAN_PREFLIGHT') return 'Plan';
    if (key === 'WAITING_FOR_SCOUT_PACKET') return 'Scout';
    return friendlyToken(status || 'Ready');
  }

  function expeditionObjectiveModel({ model, cells, counts, selectedCell, scoutableCells, surveyBridge = null }) {
    const selectedScoutable = selectedCell && isExpeditionScoutSectorEligible(selectedCell)
      ? selectedCell
      : null;
    const scoutTarget = selectedScoutable || scoutableCells[0] || null;
    const latestPacket = expeditionLatestPacket(model);
    const partySource = expeditionPartySource(model, latestPacket);
    const partyMembers = expeditionPartyMembers(partySource);
    const revealedCount = Number(counts.discovered || 0) + Number(counts.known || 0);
    const hiddenCount = Number(counts.hinted || 0) + Number(counts.locked_unknown || 0);
    const bridgeCandidate = expeditionSurveyBridgeActiveCandidate(surveyBridge);
    const bridgeCommand = bridgeCandidate?.commandState && typeof bridgeCandidate.commandState === 'object'
      ? bridgeCandidate.commandState
      : {};
    const bridgeCellId = String(bridgeCandidate?.cellId || surveyBridge?.activeCellId || '').trim();
    const bridgePlanId = String(bridgeCommand.sourcePlanId || bridgeCandidate?.sitePlan?.planId || '').trim();
    const settlerConvoyUnits = expeditionUnits(model)
      .filter((unit) => String(unit.unitType || '') === 'settler_convoy' && String(unit.sourceClaimId || '').trim())
      .sort((a, b) => {
        const aReady = (a.commandHints || []).some((command) => String(command.commandId || '') === 'found_settlement' && command.enabled !== false);
        const bReady = (b.commandHints || []).some((command) => String(command.commandId || '') === 'found_settlement' && command.enabled !== false);
        return Number(bReady) - Number(aReady) || String(a.unitId || '').localeCompare(String(b.unitId || ''));
      });
    const focusedConvoyUnit = settlerConvoyUnits.find((unit) => String(unit.unitId || '') === String(state.expeditionSelectedUnitId || ''))
      || settlerConvoyUnits.find((unit) => String(unit.cellId || '') === String(selectedCell?.cellId || ''))
      || settlerConvoyUnits[0]
      || null;
    const focusedConvoyCommand = (focusedConvoyUnit?.commandHints || [])
      .find((command) => String(command.commandId || '') === 'found_settlement' && command.enabled !== false) || null;

    if (focusedConvoyUnit?.sourceClaimId && focusedConvoyUnit.cellId) {
      const foundReady = !!(focusedConvoyCommand?.serverMutationImplemented === true);
      return {
        mode: 'convoy',
        eyebrow: 'Current focus',
        title: foundReady ? 'Found Outpost' : 'Convoy Rolling',
        body: foundReady
          ? `${expeditionCompactCellLabel(focusedConvoyUnit.cellId)} convoy has arrived. Pick Found to place the outpost.`
          : `${expeditionCompactCellLabel(focusedConvoyUnit.cellId)} convoy is rolling. Found unlocks when it arrives.`,
        selectedCellId: selectedCell?.cellId || focusedConvoyUnit.cellId,
        targetCellId: focusedConvoyUnit.cellId,
        packetId: latestPacket?.packetId || '',
        partyId: partySource?.partyId || latestPacket?.partyId || '',
        facts: [
          ['Convoy', expeditionCompactCellLabel(focusedConvoyUnit.cellId)],
          ['Claim', foundReady ? 'Arrived' : 'Preparing'],
          ['Command', foundReady ? 'Found' : 'Locked'],
          ['Actions', foundReady ? 1 : 0],
        ],
      };
    }

    if (
      bridgeCandidate
      && String(bridgeCommand.commandId || '') === 'prepare_settler_convoy'
      && bridgeCommand.serverMutationImplemented === true
      && bridgeCellId
      && bridgePlanId
    ) {
      return {
        mode: 'convoy',
        eyebrow: 'Current focus',
        title: 'Send Convoy',
        body: `${expeditionCompactCellLabel(bridgeCellId)} is surveyed and ready. Use Convoy from the map target.`,
        selectedCellId: selectedCell?.cellId || bridgeCellId,
        targetCellId: bridgeCellId,
        packetId: bridgeCandidate.packetId || latestPacket?.packetId || '',
        partyId: partySource?.partyId || latestPacket?.partyId || '',
        facts: [
          ['Target', expeditionCompactCellLabel(bridgeCellId)],
          ['Crew', 'Ready'],
          ['Command', 'Convoy'],
          ['Actions', 1],
        ],
      };
    }

    if (scoutTarget) {
      return {
        mode: 'scout',
        eyebrow: 'Current focus',
        title: 'Scout Map Edge',
        body: `${expeditionCompactCellLabel(scoutTarget.cellId)} is a hinted map target. Scout reveals one sector.`,
        selectedCellId: selectedCell?.cellId || scoutTarget.cellId,
        targetCellId: scoutTarget.cellId,
        packetId: latestPacket?.packetId || '',
        partyId: partySource?.partyId || '',
        facts: [
          ['Scoutable', scoutableCells.length],
          ['Revealed', revealedCount],
          ['Hidden', hiddenCount],
          ['Party', partyMembers.length || null],
        ],
      };
    }

    if (latestPacket) {
      return {
        mode: 'marker',
        eyebrow: 'Current focus',
        title: 'Scout Result Ready',
        body: `${expeditionCompactCellLabel(latestPacket.cellId || latestPacket.receiptLink?.cellId || '') || 'A revealed sector'} has a new map marker. Select it for the next step.`,
        selectedCellId: selectedCell?.cellId || latestPacket.cellId || '',
        targetCellId: latestPacket.cellId || latestPacket.receiptLink?.cellId || '',
        packetId: latestPacket.packetId,
        partyId: partySource?.partyId || latestPacket.partyId || '',
        facts: [
          ['Markers', expeditionEventPackets(model).length],
          ['Actions', Array.isArray(latestPacket.executableActions) ? latestPacket.executableActions.length : 0],
          ['Revealed', revealedCount],
          ['Party', partyMembers.length || null],
        ],
      };
    }

    return {
      mode: revealedCount ? 'inspect' : 'read',
      eyebrow: 'Current focus',
      title: revealedCount ? 'Explore Revealed Sectors' : 'Open the Map',
      body: revealedCount
        ? `${countLabel(revealedCount, 'revealed sector')} can be selected on the map.`
        : 'No revealed frontier sector is available yet.',
      selectedCellId: selectedCell?.cellId || '',
      targetCellId: selectedCell?.cellId || '',
      packetId: latestPacket?.packetId || '',
      partyId: partySource?.partyId || '',
      facts: [
        ['Revealed', revealedCount],
        ['Hinted', counts.hinted],
        ['Locked', counts.locked_unknown],
        ['Actions', 0],
      ],
    };
  }

  function expeditionObjectiveShortLabel(mode = '') {
    const key = String(mode || '').toLowerCase();
    if (key === 'scout') return '⌖';
    if (key === 'packet' || key === 'marker') return '⚿';
    if (key === 'convoy') return '▣';
    if (key === 'inspect') return '◎';
    return '◎';
  }

  function expeditionObjectiveFactCode(labelText = '') {
    const label = String(labelText || '').toLowerCase();
    if (label.startsWith('scout')) return '⌖';
    if (label.startsWith('packet') || label.startsWith('marker')) return '⚿';
    if (label.startsWith('revealed')) return '◆';
    if (label.startsWith('hidden') || label.startsWith('locked')) return '□';
    if (label.startsWith('hinted')) return '◇';
    if (label.startsWith('party')) return '◉';
    if (label.startsWith('actions') || label.startsWith('command')) return '✦';
    if (label.startsWith('target')) return '◎';
    if (label.startsWith('crew')) return '◉';
    if (label.startsWith('plan') || label.startsWith('surveyor')) return '▧';
    if (label.startsWith('convoy')) return '▣';
    if (label.startsWith('claim')) return '⌂';
    return '•';
  }

  function expeditionObjectiveFactValueGlyph(labelText = '', valueText = '') {
    const value = String(valueText || '').trim();
    if (!value) return '';
    if (/^\d+$/.test(value)) return value;
    if (/^q-?\d+\s+r-?\d+$/i.test(value) || /^cell_/i.test(value)) return '◎';
    if (/ready|arrived|done|complete/i.test(value)) return '✓';
    if (/rolling|preparing|locked|wait/i.test(value)) return '⏳';
    if (/convoy/i.test(value)) return '▣';
    if (/found|outpost|claim/i.test(value)) return '⌂';
    if (/scout/i.test(value)) return '⌖';
    if (/marker|packet|receipt/i.test(value)) return '⚿';
    if (/survey|site|plan/i.test(value)) return '▧';
    return expeditionObjectiveFactCode(labelText);
  }

  function expeditionGuidedCommandLabel(commandId = '', fallback = '') {
    switch (String(commandId || '')) {
      case 'move_unit':
        return 'Move';
      case 'scout_sector':
        return 'Scout';
      case 'draft_site_plan_from_packet':
        return 'Plan';
      case 'review_site_plan':
        return 'Review';
      case 'prepare_settler_convoy':
        return 'Convoy';
      case 'found_settlement':
        return 'Found';
      case 'review_packet':
        return 'Marker';
      case 'survey_site_plan_contract_required':
        return 'Plan';
      default:
        return fallback || 'Inspect';
    }
  }

  function expeditionGuidedCommandIcon(commandId = '') {
    switch (String(commandId || '')) {
      case 'move_unit':
        return '↦';
      case 'scout_sector':
        return '⌖';
      case 'draft_site_plan_from_packet':
        return '◇';
      case 'review_site_plan':
        return '✓';
      case 'prepare_settler_convoy':
        return '▣';
      case 'found_settlement':
        return '⌂';
      case 'review_packet':
        return '⚿';
      case 'survey_site_plan_contract_required':
        return '◇';
      default:
        return '◎';
    }
  }

  function expeditionGuidedCommandTargetIds(command = {}, unit = {}) {
    const targets = Array.isArray(command.targetCellIds)
      ? command.targetCellIds.map((target) => String(target || '')).filter(Boolean)
      : [];
    const unitCellId = String(unit.cellId || unit.location?.cellId || '').trim();
    return targets.length ? targets : (unitCellId ? [unitCellId] : []);
  }

  function expeditionGuidedCommandCandidate(model = {}, cells = [], commandId = '', validator = () => true) {
    for (const unit of expeditionUnits(model)) {
      for (const command of unit.commandHints) {
        if (String(command.commandId || '') !== String(commandId || '')) continue;
        if (command.enabled === false || command.serverMutationImplemented !== true) continue;
        for (const targetCellId of expeditionGuidedCommandTargetIds(command, unit)) {
          const targetCell = cells.find((cell) => String(cell.cellId || '') === targetCellId) || null;
          if (!targetCell && commandId !== 'found_settlement' && commandId !== 'prepare_settler_convoy') continue;
          if (!validator({ unit, command, targetCell, targetCellId })) continue;
          return {
            commandId,
            actionName: String(command.actionName || ''),
            unitId: String(unit.unitId || ''),
            unitType: String(unit.unitType || ''),
            unitCode: expeditionUnitRoleCode(unit),
            targetCellId,
            targetLabel: expeditionCompactCellLabel(targetCellId),
            fogLabel: expeditionFogShortLabel(targetCell?.fogState || unit.location?.fogState || ''),
            label: expeditionGuidedCommandLabel(commandId, command.label),
            icon: expeditionGuidedCommandIcon(commandId),
            sourcePlanId: String(command.sourcePlanId || unit.sourcePlanId || ''),
            claimId: String(command.claimId || unit.sourceClaimId || ''),
            serverMutationImplemented: true,
          };
        }
      }
    }
    return null;
  }

  function expeditionGuidedLoopModel({ model = {}, cells = [], selectedCell = null, objective = null, outcome = null } = {}) {
    const latestPacket = expeditionLatestPacket(model);
    const found = expeditionGuidedCommandCandidate(model, cells, 'found_settlement', ({ command, unit, targetCellId }) => (
      !!(command.claimId || unit.sourceClaimId) && !!targetCellId
    ));
    const convoy = expeditionGuidedCommandCandidate(model, cells, 'prepare_settler_convoy', ({ command, unit, targetCellId }) => (
      !!(command.sourcePlanId || unit.sourcePlanId) && !!targetCellId
    ));
    const scout = expeditionGuidedCommandCandidate(model, cells, 'scout_sector', ({ targetCell }) => (
      isExpeditionScoutSectorEligible(targetCell)
    ));
    const move = expeditionGuidedCommandCandidate(model, cells, 'move_unit', ({ unit, targetCellId, targetCell }) => (
      ['discovered', 'known'].includes(String(targetCell?.fogState || ''))
      && expeditionUnitMoveTargets(unit, model).some((cell) => String(cell.cellId || '') === targetCellId)
    ));
    const packet = latestPacket ? {
      commandId: 'review_packet',
      actionName: String(latestPacket.receiptLink?.actionName || 'et.plot.scout_sector'),
      unitId: '',
      unitType: 'receipt',
      unitCode: '⚿',
      targetCellId: String(latestPacket.cellId || latestPacket.receiptLink?.cellId || objective?.targetCellId || ''),
      targetLabel: expeditionCompactCellLabel(latestPacket.cellId || latestPacket.receiptLink?.cellId || objective?.targetCellId || ''),
      fogLabel: '⚿',
      label: 'Marker',
      icon: '⚿',
      packetId: String(latestPacket.packetId || ''),
      serverMutationImplemented: false,
    } : null;
    const active = found || convoy || scout || move || packet || null;
    const receiptLabel = outcome
      ? expeditionGuidedCommandLabel(outcome.commandId, outcome.label)
      : (packet ? 'Marker' : 'Map');
    const receiptCellId = outcome?.cellId || packet?.targetCellId || objective?.targetCellId || selectedCell?.cellId || '';
    const receiptKind = outcome?.receiptKind || (packet ? 'event_packet_receipt' : 'map_focus_receipt');
    const fallbackTarget = objective?.targetCellId || selectedCell?.cellId || active?.targetCellId || '';
    const targetLabel = active?.targetLabel || expeditionCompactCellLabel(fallbackTarget);
    const targetFog = active?.fogLabel || expeditionFogShortLabel(selectedCell?.fogState || '');

    return {
      kind: 'expedition_guided_loop',
      version: 'hq16f_guided_loop_ui_v1',
      readOnly: true,
      executableActions: 0,
      objectiveMode: String(objective?.mode || 'inspect'),
      activeCommandId: String(active?.commandId || ''),
      nextCommandId: String(active?.commandId || (packet ? 'review_packet' : 'inspect_map')),
      targetCellId: String(active?.targetCellId || fallbackTarget || ''),
      packetId: String(packet?.packetId || objective?.packetId || ''),
      steps: [
        {
          phase: 'objective',
          code: '◎',
          label: expeditionObjectiveShortLabel(objective?.mode || ''),
          icon: expeditionGuidedCommandIcon(['packet', 'marker'].includes(String(objective?.mode || '')) ? 'review_packet' : active?.commandId),
          meta: targetLabel || 'Map',
          commandId: String(objective?.mode || ''),
          targetCellId: String(objective?.targetCellId || active?.targetCellId || ''),
        },
        {
          phase: 'command',
          code: '✦',
          label: active ? active.label : 'Inspect',
          icon: active?.icon || '◎',
          meta: active ? `${active.unitCode} · ${targetLabel || 'Map'}` : '0 ✦',
          commandId: String(active?.commandId || ''),
          unitId: String(active?.unitId || ''),
          targetCellId: String(active?.targetCellId || ''),
          primaryCommand: true,
        },
        {
          phase: 'resolve',
          code: '✓',
          label: outcome ? 'Done' : (active ? 'Ready' : 'Idle'),
          icon: outcome?.icon || active?.icon || '◎',
          meta: outcome ? expeditionCompactCellLabel(outcome.cellId) : (targetFog || '◎'),
          commandId: String(outcome?.commandId || active?.commandId || ''),
          targetCellId: String(outcome?.cellId || active?.targetCellId || ''),
        },
        {
          phase: 'receipt',
          code: '⚿',
          label: receiptLabel,
          icon: '⚿',
          meta: expeditionCompactCellLabel(receiptCellId) || 'Map',
          commandId: String(outcome?.commandId || packet?.commandId || ''),
          targetCellId: String(receiptCellId || ''),
          receiptKind,
          packetId: String(packet?.packetId || ''),
          receiptChip: true,
        },
        {
          phase: 'next',
          code: '➜',
          label: active ? active.label : (packet ? 'Marker' : 'Map'),
          icon: active?.icon || packet?.icon || '◎',
          meta: active ? `${targetLabel || 'Map'} · ${targetFog || '◎'}` : 'Map',
          commandId: String(active?.commandId || packet?.commandId || 'inspect_map'),
          targetCellId: String(active?.targetCellId || packet?.targetCellId || selectedCell?.cellId || ''),
        },
      ],
      ledgerText: 'Debug detail: guided loop rows are derived from existing Expedition Map cells, unit command hints, map markers, and the latest local server result. They do not create commands, costs, rewards, routes, hidden truth, Atlas execution, or external effects.',
    };
  }

  function appendExpeditionGuidedLoop(strip, loop) {
    if (!strip || !loop) return null;
    strip.dataset.guidedLoop = 'true';
    strip.dataset.guidedLoopVersion = loop.version;
    strip.dataset.guidedLoopReadOnly = 'true';
    strip.dataset.guidedLoopActions = '0';
    if (loop.activeCommandId) strip.dataset.activeCommandId = loop.activeCommandId;
    if (loop.nextCommandId) strip.dataset.nextCommandId = loop.nextCommandId;

    const rail = document.createElement('div');
    rail.className = 'fp-expedition-guided-loop';
    rail.dataset.testid = 'fp-expedition-guided-loop';
    rail.dataset.readOnly = 'true';
    rail.dataset.actions = '0';
    rail.dataset.objectiveMode = loop.objectiveMode;
    rail.dataset.activeCommandId = loop.activeCommandId;
    rail.dataset.nextCommandId = loop.nextCommandId;
    if (loop.targetCellId) rail.dataset.targetCellId = loop.targetCellId;
    if (loop.packetId) rail.dataset.packetId = loop.packetId;
    rail.title = loop.ledgerText;
    rail.setAttribute('aria-label', `Guided expedition loop: ${loop.steps.map((step) => `${step.code} ${step.label}`).join(', ')}. Read-only view over server state.`);

    loop.steps.forEach((step) => {
      const item = document.createElement('span');
      item.className = `fp-expedition-guided-loop__step fp-expedition-guided-loop__step--${safeTestId(step.phase)}`;
      item.dataset.testid = `fp-expedition-guided-loop-step-${safeTestId(step.phase)}`;
      item.dataset.phase = step.phase;
      item.dataset.commandId = String(step.commandId || '');
      item.dataset.targetCellId = String(step.targetCellId || '');
      item.dataset.readOnly = 'true';
      item.dataset.actions = '0';
      if (step.unitId) item.dataset.unitId = step.unitId;
      if (step.receiptKind) item.dataset.receiptKind = step.receiptKind;
      if (step.packetId) item.dataset.packetId = step.packetId;
      item.title = `${step.code}: ${step.label}${step.targetCellId ? ` - ${step.targetCellId}` : ''}`;
      item.setAttribute('aria-label', item.title);
      if (step.primaryCommand) item.dataset.primaryCommand = 'true';
      if (step.receiptChip) item.dataset.receiptChip = 'true';

      const code = document.createElement('small');
      code.textContent = step.code;
      const icon = document.createElement('i');
      icon.textContent = step.icon || '◎';
      icon.setAttribute('aria-hidden', 'true');
      const label = document.createElement('strong');
      label.textContent = step.label || 'Map';
      if (step.primaryCommand) label.dataset.testid = 'fp-expedition-guided-loop-primary-command';
      if (step.receiptChip) label.dataset.testid = 'fp-expedition-guided-loop-receipt-chip';
      const meta = document.createElement('em');
      meta.textContent = step.meta || '◎';
      item.append(code, icon, label, meta);
      rail.appendChild(item);
    });
    strip.appendChild(rail);
    return rail;
  }

  function appendExpeditionSurveyBridge(strip, bridge = null, options = {}) {
    const candidate = expeditionSurveyBridgeActiveCandidate(bridge);
    if (!strip || !bridge || !candidate) return null;
    const testId = String(options.testId || 'fp-expedition-survey-bridge');
    const scope = String(options.scope || 'objective');
    const commandState = candidate.commandState && typeof candidate.commandState === 'object'
      ? candidate.commandState
      : {};
    const cellId = String(candidate.cellId || bridge.activeCellId || '');
    const packetId = String(candidate.packetId || bridge.activePacketId || '');
    const statusLabel = expeditionSurveyBridgeStatusLabel(candidate.status || bridge.status);
    const cellLabel = expeditionCompactCellLabel(cellId);
    const canDraftPacketPlan = commandState.commandId === 'draft_site_plan_from_packet'
      && commandState.actionName === 'et.plot.draft_site_plan_from_packet'
      && commandState.enabled !== false
      && commandState.serverMutationImplemented === true
      && !!packetId;
    const reviewPlanId = String(commandState.sourcePlanId || candidate.sitePlan?.planId || '').trim();
    const canReviewSitePlan = commandState.commandId === 'review_site_plan'
      && commandState.actionName === 'et.plot.review_site_plan'
      && commandState.enabled !== false
      && commandState.serverMutationImplemented === true
      && !!reviewPlanId;
    const canPrepareBridgeConvoy = commandState.commandId === 'prepare_settler_convoy'
      && commandState.actionName === 'et.plot.prepare_settler_convoy'
      && commandState.enabled !== false
      && commandState.serverMutationImplemented === true
      && !!reviewPlanId;
    const pendingPacketPlan = canDraftPacketPlan && state.expeditionPacketSitePlanPendingId === packetId;
    const pendingReviewPlan = canReviewSitePlan && state.reviewPendingPlanId === reviewPlanId;
    const pendingConvoyPlan = canPrepareBridgeConvoy && state.convoyPendingPlanId === reviewPlanId;
    const hasCommandAction = canDraftPacketPlan || canReviewSitePlan || canPrepareBridgeConvoy;
    const rail = document.createElement('div');
    rail.className = 'fp-expedition-survey-bridge';
    rail.dataset.testid = testId;
    rail.dataset.scope = scope;
    rail.dataset.bridgeVersion = String(bridge.version || '');
    rail.dataset.status = String(candidate.status || bridge.status || '');
    rail.dataset.cellId = cellId;
    rail.dataset.packetId = packetId;
    rail.dataset.readOnly = 'true';
    rail.dataset.actions = hasCommandAction ? '1' : '0';
    rail.dataset.serverMutationImplemented = commandState.serverMutationImplemented === true ? 'true' : 'false';
    rail.dataset.commandId = String(commandState.commandId || '');
    rail.dataset.actionName = String(commandState.actionName || '');
    rail.dataset.mapNativeVerb = expeditionGuidedCommandLabel(commandState.commandId, commandState.label);
    if (reviewPlanId) rail.dataset.planId = reviewPlanId;
    if (pendingPacketPlan || pendingReviewPlan || pendingConvoyPlan) rail.dataset.pending = 'true';
    rail.title = bridge.ledgerText || 'Scout Packet to Site Plan bridge is read-only readiness only.';
    rail.setAttribute('aria-label', `Map bridge: ${statusLabel} at ${cellId || 'selected cell'}. ${hasCommandAction ? 'Command ready.' : 'Read-only; zero executable actions.'}`);

    [
      {
        phase: 'packet',
        code: '⚑',
        label: 'Scout',
        meta: cellLabel,
        testId: `${testId}-step-packet`,
      },
      {
        phase: 'site-plan',
        code: '▧',
        label: candidate.sitePlan?.planId ? 'Site' : 'Plan',
        meta: statusLabel,
        testId: `${testId}-step-site-plan`,
      },
      {
        phase: 'command',
        code: '✦',
        label: commandState.serverMutationImplemented === true ? expeditionGuidedCommandLabel(commandState.commandId, commandState.label) : 'Wait',
        meta: commandState.serverMutationImplemented === true ? 'Go' : 'Wait',
        testId: `${testId}-step-command`,
      },
    ].forEach((step) => {
      const item = document.createElement('span');
      item.className = `fp-expedition-survey-bridge__step fp-expedition-survey-bridge__step--${safeTestId(step.phase)}`;
      item.dataset.testid = step.testId;
      item.dataset.phase = step.phase;
      item.dataset.readOnly = 'true';
      item.dataset.actions = '0';
      item.dataset.cellId = cellId;
      if (packetId) item.dataset.packetId = packetId;
      item.title = `${step.code}: ${step.label} - ${step.meta}`;
      item.setAttribute('aria-label', item.title);
      const code = document.createElement('small');
      code.textContent = step.code;
      const label = document.createElement('strong');
      label.textContent = step.label;
      const meta = document.createElement('em');
      meta.textContent = step.meta || '◎';
      item.append(code, label, meta);
      rail.appendChild(item);
    });

    if (canDraftPacketPlan) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'fp-expedition-survey-bridge__command fp-brass-btn';
      button.dataset.testid = `fp-btn-draft-site-plan-from-packet-${safeTestId(packetId)}`;
      button.dataset.packetId = packetId;
      button.dataset.cellId = cellId;
      button.dataset.commandId = commandState.commandId;
      button.dataset.actionName = commandState.actionName;
      button.dataset.serverMutationImplemented = 'true';
      button.dataset.routeAuthority = 'false';
      button.dataset.resourceDelta = '{}';
      button.dataset.mapNativeVerb = 'Plan';
      button.disabled = pendingPacketPlan;
      button.textContent = pendingPacketPlan ? '...' : expeditionGuidedCommandLabel(commandState.commandId, commandState.label);
      button.title = `Plan from map marker ${packetId} through the guarded packet Site Plan endpoint. No route, resource, reward, Surveyor, Atlas execution, or external effect.`;
      button.setAttribute('aria-label', button.title);
      button.addEventListener('click', () => doDraftSitePlanFromPacket(packetId, cellId));
      rail.appendChild(button);
    }

    if (canReviewSitePlan) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'fp-expedition-survey-bridge__command fp-brass-btn';
      button.dataset.testid = `${testId}-btn-review-site-plan-${safeTestId(reviewPlanId)}`;
      button.dataset.planId = reviewPlanId;
      button.dataset.cellId = cellId;
      button.dataset.commandId = commandState.commandId;
      button.dataset.actionName = commandState.actionName;
      button.dataset.serverMutationImplemented = 'true';
      button.dataset.routeAuthority = 'false';
      button.dataset.resourceDelta = '{}';
      button.dataset.mapNativeVerb = 'Review';
      button.disabled = pendingReviewPlan;
      button.textContent = pendingReviewPlan ? '...' : expeditionGuidedCommandLabel(commandState.commandId, commandState.label);
      button.title = `Review map plan ${reviewPlanId} through the guarded HQ6 endpoint. No territory, route, resource, reward, Surveyor creation in browser, Atlas execution, or external effect.`;
      button.setAttribute('aria-label', button.title);
      button.addEventListener('click', () => doReviewSitePlan(reviewPlanId));
      rail.appendChild(button);
    }

    if (canPrepareBridgeConvoy) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'fp-expedition-survey-bridge__command fp-brass-btn';
      button.dataset.testid = `${testId}-btn-prepare-settler-convoy-${safeTestId(reviewPlanId)}`;
      button.dataset.planId = reviewPlanId;
      button.dataset.cellId = cellId;
      button.dataset.commandId = commandState.commandId;
      button.dataset.actionName = commandState.actionName;
      button.dataset.serverMutationImplemented = 'true';
      button.dataset.routeAuthority = 'false';
      button.dataset.resourceDelta = '{}';
      button.dataset.mapNativeVerb = 'Convoy';
      button.disabled = pendingConvoyPlan;
      button.textContent = pendingConvoyPlan ? '...' : expeditionGuidedCommandLabel(commandState.commandId, commandState.label);
      button.title = `Prepare Convoy from reviewed Site Plan ${reviewPlanId} through the guarded convoy endpoint.`;
      button.setAttribute('aria-label', button.title);
      button.addEventListener('click', () => doPrepareSettlerConvoy(reviewPlanId));
      rail.appendChild(button);
    }

    strip.appendChild(rail);
    return rail;
  }

  function appendExpeditionObjectiveStrip(body, objective, guidedLoop = null, surveyBridge = null) {
    if (!body || !objective) return null;
    const strip = document.createElement('article');
    strip.className = `fp-expedition-objective-strip fp-expedition-objective-strip--${safeTestId(objective.mode)}`;
    strip.dataset.testid = 'fp-expedition-objective-strip';
    strip.dataset.mode = objective.mode;
    strip.dataset.readOnly = 'true';
    strip.dataset.actions = '0';
    if (objective.selectedCellId) strip.dataset.selectedCellId = String(objective.selectedCellId);
    if (objective.targetCellId) strip.dataset.targetCellId = String(objective.targetCellId);
    if (objective.packetId) strip.dataset.packetId = String(objective.packetId);
    if (objective.partyId) strip.dataset.partyId = String(objective.partyId);
    strip.title = `${objective.title || 'Expedition Map focus'}: ${objective.body || 'Server-owned read model only.'}`;
    strip.setAttribute('aria-label', strip.title);

    const copy = document.createElement('div');
    copy.className = 'fp-expedition-objective-strip__copy';
    const eyebrow = document.createElement('small');
    eyebrow.textContent = '⌾';
    eyebrow.title = 'Current focus';
    eyebrow.setAttribute('aria-label', 'Current focus');
    const title = document.createElement('strong');
    title.textContent = expeditionObjectiveShortLabel(objective.mode);
    const bodyCopy = document.createElement('p');
    bodyCopy.textContent = objective.body || 'Server-owned read model only.';
    bodyCopy.dataset.testid = 'fp-expedition-objective-copy';
    copy.append(eyebrow, title);

    const facts = document.createElement('div');
    facts.className = 'fp-expedition-objective-strip__facts';
    facts.dataset.testid = 'fp-expedition-objective-strip-facts';
    (objective.facts || []).forEach(([labelText, valueText]) => {
      if (valueText == null || valueText === '') return;
      const item = document.createElement('span');
      const label = document.createElement('small');
      label.textContent = expeditionObjectiveFactCode(labelText);
      label.title = labelText;
      const value = document.createElement('strong');
      value.dataset.value = String(valueText);
      value.textContent = expeditionObjectiveFactValueGlyph(labelText, valueText);
      item.title = `${labelText}: ${valueText}`;
      item.setAttribute('aria-label', item.title);
      item.append(label, value);
      facts.appendChild(item);
    });

    const boundary = document.createElement('small');
    boundary.className = 'fp-expedition-objective-strip__boundary';
    boundary.dataset.testid = 'fp-expedition-objective-strip-boundary';
    boundary.textContent = 'Read-only marker. No new server objectives, hidden truth, or actions.';

    strip.append(copy, facts);
    appendExpeditionGuidedLoop(strip, guidedLoop);
    appendExpeditionSurveyBridge(strip, surveyBridge);
    const ledgerCopy = document.createElement('small');
    ledgerCopy.textContent = [
      guidedLoop?.ledgerText || 'Ledger detail: focus markers are derived only from existing map cells, map markers, and party state. They cannot create resources, routes, assignments, timers, rewards, Atlas execution, sharing, or external effects.',
      surveyBridge?.ledgerText || '',
    ].filter(Boolean).join(' ');
    const ledger = appendExpeditionAuditDetails(strip, 'Details', [bodyCopy, boundary, ledgerCopy], 'fp-expedition-objective-ledger-details');
    if (ledger) {
      ledger.dataset.readOnly = 'true';
      ledger.dataset.actions = '0';
    }
    body.appendChild(strip);
    return strip;
  }

  function appendExpeditionInspectorChrome(drawer, model, selectedCell, counts) {
    if (!drawer) return null;
    const fogState = String(selectedCell?.fogState || 'locked_unknown');
    const revealed = Number(counts?.discovered || 0) + Number(counts?.known || 0);
    const hidden = Number(counts?.hinted || 0) + Number(counts?.locked_unknown || 0);
    const chrome = document.createElement('div');
    chrome.className = 'fp-expedition-inspector-drawer__chrome';
    chrome.dataset.testid = 'fp-expedition-inspector-chrome';
    chrome.dataset.selectedCellId = String(selectedCell?.cellId || '');
    chrome.dataset.fogState = fogState;
    chrome.dataset.readOnly = 'true';
    chrome.dataset.actions = '0';
    chrome.title = `Visual inspector: ${selectedCell?.cellId || 'no selected cell'} - ${friendlyToken(fogState)}; ${countLabel(revealed, 'revealed sector')}; ${countLabel(hidden, 'hidden silhouette')}.`;
    chrome.setAttribute('aria-label', chrome.title);

    const label = document.createElement('small');
    label.textContent = '⌘';
    label.title = 'Visual inspector';
    const title = document.createElement('strong');
    title.textContent = expeditionCellKindLabel(selectedCell || {});
    title.title = selectedCell?.title || model?.title || 'Expedition Map';
    const meta = document.createElement('span');
    meta.textContent = expeditionFogShortLabel(fogState);
    meta.title = selectedCell?.cellId || 'no selected cell';
    chrome.append(label, title, meta);

    const chips = document.createElement('div');
    chips.className = 'fp-expedition-inspector-drawer__chips';
    chips.dataset.testid = 'fp-expedition-inspector-chips';
    [
      ['◎', 'read-only server map projection'],
      [`◆${revealed}`, `${countLabel(revealed, 'revealed sector')}`],
      [`□${hidden}`, `${countLabel(hidden, 'hidden silhouette')}`],
      [selectedCell && isExpeditionScoutSectorEligible(selectedCell) ? '⌖' : '×', selectedCell && isExpeditionScoutSectorEligible(selectedCell) ? 'Scout Sector eligible' : 'no drawer actions'],
    ].forEach(([text, fullText]) => {
      const chip = document.createElement('i');
      chip.textContent = text;
      chip.title = fullText;
      chip.setAttribute('aria-label', fullText);
      chips.appendChild(chip);
    });
    chrome.appendChild(chips);
    drawer.appendChild(chrome);
    return chrome;
  }

  function appendExpeditionInspectorSection(drawer, labelText, contentNode, testid, options = {}) {
    if (!drawer || !contentNode) return null;
    const section = document.createElement('details');
    section.className = 'fp-expedition-inspector-section';
    section.dataset.testid = testid;
    section.dataset.readOnly = 'true';
    section.dataset.actions = '0';
    if (options.open) section.open = true;

    const summary = document.createElement('summary');
    const fullMeta = options.meta || 'compact read-only drawer';
    const visibleLabel = options.shortLabel || ({
      'Selected-sector proof': 'Sector proof',
      'Evidence packet': 'Evidence',
      'Fog ledger': 'Fog',
      'Sector action aliases': 'Aliases',
      'Revealed-sector ledger': 'Revealed',
    }[labelText] || labelText);
    const visibleMeta = options.shortMeta || (() => {
      const meta = String(fullMeta || '');
      const privateFog = meta.match(/(\d+)\s+private fog/i);
      const readOnly = meta.match(/(\d+)\s+read-only/i);
      if (privateFog) return `${privateFog[1]} fog`;
      if (readOnly) return `${readOnly[1]} receipt`;
      if (/pending/i.test(meta)) return 'pending';
      if (/secondary/i.test(meta)) return 'alias';
      if (/receipt/i.test(meta)) return 'details';
      if (/details|visual/i.test(meta)) return 'details';
      return 'ledger';
    })();
    summary.title = `${labelText}: ${fullMeta}`;
    summary.setAttribute('aria-label', summary.title);
    const label = document.createElement('strong');
    label.textContent = visibleLabel;
    const meta = document.createElement('small');
    meta.textContent = visibleMeta;
    summary.append(label, meta);
    section.append(summary, contentNode);
    drawer.appendChild(section);
    return section;
  }

  function appendExpeditionLinks(card, cell, model) {
    const ids = cell?.sourceIds || {};
    const links = [];
    if (ids.reportId) links.push(['Scout report', '#fp-scout-reports-body', ids.reportId]);
    if (ids.planId) links.push(['Site plan', '#fp-site-plans-body', ids.planId]);
    if (ids.claimId) links.push(['Settlement claim', '#fp-settlement-claims-body', ids.claimId]);
    const plotId = ids.plotId || ids.foundedPlotId;
    const homePlotId = model?.scope?.homePlotId || model?.sourceSummary?.originPlotId;
    if (plotId && plotId !== homePlotId) links.push(['Owned outpost', '#fp-owned-plots-body', plotId]);
    if (!links.length) return null;

    const row = document.createElement('div');
    row.className = 'fp-expedition-sector-links';
    links.forEach(([label, href, id]) => {
      const link = document.createElement('a');
      link.href = href;
      link.dataset.testid = `fp-expedition-link-${safeTestId(cell.cellId)}-${safeTestId(label)}`;
      link.textContent = `${label}: ${id}`;
      row.appendChild(link);
    });
    card.appendChild(row);
    return row;
  }

  function appendExpeditionReceipts(card, cell) {
    const receipts = Array.isArray(cell?.receipts) ? cell.receipts : [];
    if (!receipts.length) return null;
    const rows = document.createElement('div');
    rows.className = 'fp-expedition-sector-receipts';
    rows.dataset.testid = `fp-expedition-receipts-${safeTestId(cell.cellId)}`;
    receipts.slice(0, 3).forEach((receipt) => {
      const row = document.createElement('span');
      const label = document.createElement('small');
      label.textContent = 'Receipt';
      const kind = document.createElement('strong');
      kind.textContent = friendlyToken(receipt.kind || 'read model receipt');
      row.append(label, kind);
      const ids = Object.entries(receipt.sourceIds || {})
        .filter(([, value]) => value != null && value !== '')
        .map(([key, value]) => `${friendlyToken(key)} ${value}`)
        .join(', ');
      if (ids) {
        const source = document.createElement('small');
        source.textContent = ids;
        row.appendChild(source);
      }
      rows.appendChild(row);
    });
    card.appendChild(rows);
    return rows;
  }

  function expeditionEventPackets(model) {
    return (Array.isArray(model?.eventPackets) ? model.eventPackets : [])
      .filter((packet) => packet && typeof packet === 'object' && packet.packetId);
  }

  function expeditionPacketForCell(model, cell) {
    if (!cell || typeof cell !== 'object') return null;
    const inlinePacket = cell.eventPacket && typeof cell.eventPacket === 'object' ? cell.eventPacket : null;
    if (inlinePacket?.packetId) return inlinePacket;
    const cellId = String(cell.cellId || '');
    const sourceIds = cell.sourceIds || {};
    const receiptPacketIds = new Set((Array.isArray(cell.receipts) ? cell.receipts : [])
      .map((receipt) => receipt?.eventPacketId || receipt?.sourceIds?.eventPacketId || receipt?.sourceIds?.packetId)
      .filter(Boolean)
      .map(String));
    return expeditionEventPackets(model).find((packet) => {
      const packetId = String(packet.packetId || '');
      return String(packet.cellId || packet.receiptLink?.cellId || '') === cellId
        || receiptPacketIds.has(packetId)
        || (sourceIds.scoutId && String(packet.scoutId || packet.receiptLink?.scoutId || '') === String(sourceIds.scoutId));
    }) || null;
  }

  function expeditionPacketReceiptText(packet = {}) {
    const link = packet.receiptLink || {};
    const action = link.actionName || 'et.plot.scout_sector';
    const scoutId = link.scoutId || packet.scoutId || '';
    const cellId = link.cellId || packet.cellId || '';
    return [
      `source ${friendlyToken(action)}`,
      scoutId ? `scout ${scoutId}` : '',
      cellId ? `cell ${cellId}` : '',
      link.via ? `via ${link.via}` : '',
    ].filter(Boolean).join(' - ');
  }

  function expeditionPacketTypeText(packet = {}) {
    return friendlyToken(packet.templateId || packet.kind || 'event marker details')
      .replace(/\bpacket\b/gi, 'marker');
  }

  function expeditionPacketDisplayName(packet = {}, fallback = 'Expedition Marker') {
    return String(packet?.discoveryFlavor || fallback || 'Expedition Marker')
      .replace(/\bpacket\b/gi, 'marker');
  }

  function expeditionPacketSourceText(packet = {}) {
    const link = packet.receiptLink || {};
    return [
      link.actionName || 'et.plot.scout_sector',
      packet.scoutId || link.scoutId || '',
      packet.boundaryFlags?.receiptMetadataOnly ? 'marker metadata only' : '',
    ].filter(Boolean).map(friendlyToken).join(' - ');
  }

  function expeditionPartySource(model = {}, packet = null) {
    const snapshot = packet?.partySnapshot && typeof packet.partySnapshot === 'object'
      ? packet.partySnapshot
      : null;
    const manifest = model?.expeditionParty && typeof model.expeditionParty === 'object'
      ? model.expeditionParty
      : null;
    return snapshot || manifest;
  }

  function expeditionPartyMembers(source = {}) {
    return (Array.isArray(source?.members) ? source.members : [])
      .filter((member) => member && typeof member === 'object' && member.displayName)
      .map((member) => ({
        memberId: String(member.memberId || member.displayName),
        displayName: String(member.displayName),
        role: String(member.role || 'field_operator'),
      }));
  }

  function expeditionPartyRoleText(role = '') {
    const normalized = String(role || '').trim();
    if (!normalized) return 'Field operator';
    return friendlyToken(normalized).replace(/\bhq\b/i, 'HQ');
  }

  function expeditionUnits(model = {}) {
    return (Array.isArray(model?.units?.items) ? model.units.items : [])
      .filter((unit) => unit && typeof unit === 'object' && unit.unitId)
      .map((unit) => ({
        ...unit,
        unitId: String(unit.unitId || ''),
        unitType: String(unit.unitType || unit.role || 'field_support'),
        displayName: String(unit.displayName || friendlyToken(unit.role || unit.unitType || 'field unit')),
        role: String(unit.role || unit.unitType || 'field_support'),
        cellId: String(unit.location?.cellId || ''),
        commandHints: Array.isArray(unit.commandHints) ? unit.commandHints : []
      }));
  }

  function expeditionUnitsForCell(model = {}, cell = {}) {
    const cellId = String(cell?.cellId || '');
    return expeditionUnits(model).filter((unit) => String(unit.cellId || '') === cellId);
  }

  function selectedExpeditionUnit(model = {}, selectedCell = null) {
    const units = expeditionUnits(model);
    if (!units.length) return null;
    const selectedId = String(state.expeditionSelectedUnitId || '');
    return units.find((unit) => String(unit.unitId || '') === selectedId)
      || (selectedCell ? units.find((unit) => String(unit.cellId || '') === String(selectedCell.cellId || '')) : null)
      || units[0];
  }

  function expeditionUnitScoutCommandTarget(unit = {}, selectedCell = null, model = {}) {
    const command = (Array.isArray(unit.commandHints) ? unit.commandHints : [])
      .find((entry) => String(entry.commandId || '') === 'scout_sector');
    if (!command || command.enabled === false) return { command: null, targetCell: null };
    const targetCellIds = Array.isArray(command.targetCellIds)
      ? command.targetCellIds.map((cellId) => String(cellId || '')).filter(Boolean)
      : [];
    if (!targetCellIds.length) return { command, targetCell: null };
    const selectedCellId = String(selectedCell?.cellId || '');
    const eligibleTargets = expeditionCells(model)
      .filter((cell) => targetCellIds.includes(String(cell.cellId || '')) && isExpeditionScoutSectorEligible(cell));
    const targetCell = eligibleTargets.find((cell) => String(cell.cellId || '') === selectedCellId)
      || eligibleTargets[0]
      || null;
    return { command, targetCell };
  }

  function expeditionUnitMoveTargets(unit = {}, model = {}) {
    const targetCellIds = Array.isArray(unit.movement?.allowedTargetCellIds)
      ? unit.movement.allowedTargetCellIds.map((cellId) => String(cellId || '')).filter(Boolean)
      : [];
    if (!targetCellIds.length) return [];
    return expeditionCells(model)
      .filter((cell) => targetCellIds.includes(String(cell.cellId || '')))
      .filter((cell) => ['discovered', 'known'].includes(String(cell.fogState || '')));
  }

  function selectExpeditionUnit(unit = {}, model = {}, preferredCellId = '') {
    if (!unit?.unitId) return;
    state.expeditionSelectedUnitId = String(unit.unitId || '');
    const preferredCell = expeditionCells(model)
      .find((cell) => String(cell.cellId || '') === String(preferredCellId || '')) || null;
    const scoutCommandTarget = expeditionUnitScoutCommandTarget(unit, preferredCell, model);
    const nextCellId = scoutCommandTarget.targetCell?.cellId || preferredCellId || unit.cellId || '';
    if (nextCellId) state.expeditionSelectedCellId = String(nextCellId);
  }

  function expeditionUnitTypeLabel(unit = {}) {
    return friendlyToken(unit.unitType || unit.role || 'field unit')
      .replace(/\bhq\b/i, 'HQ');
  }

  function expeditionUnitToken(unit = {}) {
    const type = String(unit.unitType || '').toLowerCase();
    if (type === 'scout') return '⌖';
    if (type === 'courier') return '⚑';
    if (type === 'surveyor') return '⌗';
    if (type === 'settler_convoy') return '▣';
    if (type === 'outpost_crew') return '⌂';
    return '◈';
  }

  function expeditionPartyMemberByRole(members, patterns) {
    return members.find((member) => patterns.some((pattern) => pattern.test(member.role)));
  }

  function expeditionPacketOperatorName(packet = {}) {
    const source = expeditionPartySource({}, packet);
    const members = expeditionPartyMembers(source);
    return expeditionPartyMemberByRole(members, [/scout/i, /pathfinder/i])?.displayName
      || members[0]?.displayName
      || '';
  }

  function expeditionPartyModel(cell = {}, model = {}, packet = null) {
    if (!cell || typeof cell !== 'object') return null;
    const source = expeditionPartySource(model, packet);
    const members = expeditionPartyMembers(source);
    if (!source || !members.length) return null;
    const sourceIds = cell.sourceIds || {};
    const link = packet?.receiptLink || {};
    const fogState = String(cell.fogState || 'locked_unknown');
    const scoutId = packet?.scoutId || link.scoutId || sourceIds.scoutId || '';
    const scoutMember = expeditionPartyMemberByRole(members, [/scout/i, /pathfinder/i]) || members[0];
    const deskMember = expeditionPartyMemberByRole(members, [/desk/i, /hq/i, /operator/i])
      || members.find((member) => member.memberId !== scoutMember.memberId)
      || scoutMember;
    const operatorName = packet ? (expeditionPacketOperatorName(packet) || scoutMember.displayName) : scoutMember.displayName;
    const anchorId = packet?.packetId || sourceIds.planId || sourceIds.reportId || sourceIds.claimId || cell.cellId;
    const partyId = source.partyId || packet?.partyId || 'expedition party';
    const title = packet
      ? `${operatorName} field party`
      : (fogState === 'hinted' ? 'Scout Sector watch party' : 'Map desk field party');
    const mode = packet
      ? 'Marker placed'
      : (fogState === 'hinted' ? 'Scout target ready' : 'Reading known map truth');
    const note = packet
      ? `${operatorName} and ${deskMember.displayName} keep this marker as named field color for ${cell.cellId}; it does not unlock routes, resources, or actions.`
      : `${deskMember.displayName} and ${operatorName} keep this sector as read-only map context from the server party manifest.`;
    return {
      title,
      mode,
      note,
      partyId,
      members,
      operatorName,
      operatorRole: expeditionPartyRoleText(scoutMember.role),
      scoutId,
      anchorId,
      deskName: deskMember.displayName,
      deskRole: expeditionPartyRoleText(deskMember.role),
      cellId: cell.cellId || link.cellId || packet?.cellId || '',
      projectionHash: model?.projectionHash || model?.receipt?.projectionHash || '',
      actionCount: 0,
      readOnly: true,
    };
  }

  function appendExpeditionPartyFlavor(card, cell, model, packet = null, scope = 'selected') {
    const party = expeditionPartyModel(cell, model, packet);
    if (!card || !party) return null;
    const slug = safeTestId(packet?.cellId || cell?.cellId || 'selected');
    const wrap = document.createElement('div');
    wrap.className = 'fp-expedition-party';
    wrap.dataset.testid = `fp-expedition-party-${safeTestId(scope)}-${slug}`;
    wrap.dataset.actions = '0';
    wrap.dataset.readOnly = 'true';

    const title = document.createElement('strong');
    title.textContent = party.title;
    const status = document.createElement('span');
    status.textContent = party.mode;
    const copy = document.createElement('p');
    copy.textContent = party.note;
    wrap.append(title, status, copy);

    const facts = document.createElement('div');
    facts.className = 'fp-expedition-party__facts';
    [
      ['Operator', `${party.operatorName} - ${party.operatorRole}`],
      ['Desk', `${party.deskName} - ${party.deskRole}`],
      ['Anchor', party.anchorId],
      ['Manifest', party.partyId],
    ].forEach(([labelText, valueText]) => {
      const item = document.createElement('span');
      const label = document.createElement('small');
      label.textContent = labelText;
      const value = document.createElement('strong');
      value.textContent = String(valueText);
      item.append(label, value);
      facts.appendChild(item);
    });
    wrap.appendChild(facts);

    const roster = document.createElement('div');
    roster.className = 'fp-expedition-party__roster';
    roster.dataset.testid = `fp-expedition-party-roster-${safeTestId(scope)}-${slug}`;
    party.members.forEach((member) => {
      const item = document.createElement('span');
      item.dataset.memberId = member.memberId;
      const name = document.createElement('strong');
      name.textContent = member.displayName;
      const role = document.createElement('small');
      role.textContent = expeditionPartyRoleText(member.role);
      item.append(name, role);
      roster.appendChild(item);
    });
    wrap.appendChild(roster);

    const boundary = document.createElement('small');
    boundary.textContent = 'Party flavor is presentation-only: zero actions, no autonomy, no routes, no resources, no combat, no sharing, and no Atlas execution.';
    wrap.appendChild(boundary);
    card.appendChild(wrap);
    return wrap;
  }

  function appendExpeditionPacketFacts(card, packet) {
    const facts = document.createElement('div');
    facts.className = 'fp-expedition-event-packet-facts';
    facts.dataset.testid = `fp-expedition-event-packet-facts-${safeTestId(packet.packetId)}`;
    [
      ['Marker', expeditionPacketDisplayName(packet)],
      ['Origin', expeditionPacketReceiptText(packet)],
      ['Read-only', packet.readOnly ? 'true' : 'false'],
      ['Actions', Array.isArray(packet.executableActions) ? String(packet.executableActions.length) : '0'],
    ].forEach(([labelText, valueText]) => {
      if (!valueText) return;
      const item = document.createElement('span');
      const label = document.createElement('small');
      label.textContent = labelText;
      const value = document.createElement('strong');
      value.textContent = String(valueText);
      item.append(label, value);
      facts.appendChild(item);
    });
    card.appendChild(facts);
    return facts;
  }

  function appendExpeditionPacketEvidenceChips(card, packet, cell) {
    const chips = appendChipSet(card, [
      `type ${expeditionPacketTypeText(packet)}`,
      `source ${expeditionPacketSourceText(packet)}`,
      `scout ${packet.receiptLink?.scoutId || packet.scoutId || 'scout sector'}`,
      `cell ${packet.cellId || cell?.cellId || 'selected'}`,
      packet.boundaryFlags?.readModelOnly ? 'read model only' : 'read only',
      packet.boundaryFlags?.receiptMetadataOnly ? 'marker metadata only' : '',
      'zero executable actions',
    ]);
    if (chips) {
      chips.classList.add('fp-expedition-event-packet__chips');
      chips.dataset.testid = `fp-expedition-event-packet-chips-${safeTestId(packet.packetId)}`;
    }
    return chips;
  }

  function expeditionLocationVisitModel(model = {}, cell = {}) {
    const fogState = String(cell?.fogState || '');
    if (!['known', 'discovered'].includes(fogState)) return null;
    const packet = expeditionPacketForCell(model, cell);
    const sourceTruth = String(cell?.sourceTruth || '');
    const receiptAction = String(packet?.receiptLink?.actionName || '');
    const packetActions = Array.isArray(packet?.executableActions) ? packet.executableActions.length : 0;
    const scoutPacket = !!packet?.packetId
      && packet.readOnly === true
      && packetActions === 0
      && receiptAction === 'et.plot.scout_sector'
      && /scout[_-]?sector/i.test(sourceTruth);
    if (!scoutPacket) return null;
    const cells = expeditionCells(model);
    const hiddenVisitCount = cells.filter((entry) => {
      const entryFog = String(entry?.fogState || '');
      return ['hinted', 'locked_unknown'].includes(entryFog) && !!expeditionPacketForCell(model, entry);
    }).length;
    const publicSlot = cell.publicTerrainAssetSlot || cell.terrainAssetSlot || cell.siteType || fogState;
    const party = expeditionPartyModel(cell, model, packet);
    return {
      kind: 'expedition_location_visit',
      version: 'hq16g_scout_sector_visit_layer_v1',
      cellId: String(cell.cellId || ''),
      cellTitle: cell.title || friendlyToken(cell.kind || cell.cellId || 'visited sector'),
      fogState,
      terrainSlot: String(publicSlot || 'known'),
      packet,
      party,
      receiptAction,
      readOnly: true,
      actions: 0,
      hiddenVisitCount,
    };
  }

  function appendExpeditionLocationVisitSurface(body, cell, model) {
    if (!body) return null;
    const visit = expeditionLocationVisitModel(model, cell);
    if (!visit) return null;
    const slug = safeTestId(visit.cellId);
    const card = document.createElement('article');
    card.className = 'fp-expedition-map-card fp-expedition-location-visit';
    card.dataset.testid = `fp-expedition-location-visit-${slug}`;
    card.dataset.kind = visit.kind;
    card.dataset.version = visit.version;
    card.dataset.cellId = visit.cellId;
    card.dataset.packetId = String(visit.packet.packetId || '');
    card.dataset.fogState = visit.fogState;
    card.dataset.terrainSlot = visit.terrainSlot;
    card.dataset.sourceAction = visit.receiptAction;
    card.dataset.readOnly = 'true';
    card.dataset.actions = '0';
    card.dataset.hiddenVisitCount = String(visit.hiddenVisitCount);
    card.title = `Visit layer for ${visit.cellId}: read-only Scout Sector packet scene; zero actions.`;
    card.setAttribute('aria-label', card.title);

    const header = document.createElement('div');
    header.className = 'fp-expedition-location-visit__header';
    const titleWrap = document.createElement('div');
    const eyebrow = document.createElement('small');
    eyebrow.textContent = 'VISIT';
    const title = document.createElement('strong');
    title.textContent = visit.cellTitle;
    titleWrap.append(eyebrow, title);
    const seal = document.createElement('span');
    seal.textContent = 'READ';
    seal.title = 'Read-only visit layer, no map mutation actions';
    seal.setAttribute('aria-label', seal.title);
    header.append(titleWrap, seal);
    card.appendChild(header);

    const scene = document.createElement('div');
    scene.className = 'fp-expedition-location-visit__scene';
    scene.dataset.testid = `fp-expedition-location-visit-scene-${slug}`;
    scene.dataset.packetId = String(visit.packet.packetId || '');
    scene.dataset.readOnly = 'true';
    scene.dataset.actions = '0';
    const sceneIcon = document.createElement('i');
    sceneIcon.textContent = '⌖';
    sceneIcon.setAttribute('aria-hidden', 'true');
    const sceneCopy = document.createElement('span');
    const sceneTitle = document.createElement('strong');
    sceneTitle.textContent = expeditionPacketDisplayName(visit.packet, 'Scout marker overlook');
    const sceneMeta = document.createElement('small');
    sceneMeta.textContent = `${expeditionCompactCellLabel(visit.cellId)} · ${expeditionFogShortLabel(visit.fogState)} · ${friendlyToken(visit.terrainSlot)}`;
    sceneCopy.append(sceneTitle, sceneMeta);
    scene.append(sceneIcon, sceneCopy);
    card.appendChild(scene);

    const facts = document.createElement('div');
    facts.className = 'fp-expedition-location-visit__facts';
    facts.dataset.testid = `fp-expedition-location-visit-facts-${slug}`;
    [
      ['Cell', expeditionCompactCellLabel(visit.cellId)],
      ['Marker', 'MRK'],
      ['Effect', 'Scout'],
      ['Actions', '0'],
    ].forEach(([labelText, valueText]) => {
      const item = document.createElement('span');
      const label = document.createElement('small');
      label.textContent = labelText;
      const value = document.createElement('strong');
      value.textContent = valueText;
      item.title = `${labelText}: ${valueText}`;
      item.setAttribute('aria-label', item.title);
      item.append(label, value);
      facts.appendChild(item);
    });
    card.appendChild(facts);

    const copy = document.createElement('p');
    copy.textContent = 'Map-local place view from the Scout marker. The selected cell stays anchored to the map; details stay tucked away.';
    card.appendChild(copy);
    appendExpeditionPartyBadges(card, visit.party?.members || [], 'visit');

    const ledgerBody = document.createElement('small');
    ledgerBody.textContent = `Ledger detail: ${visit.packet.packetId} is read-only receipt evidence from ${visit.receiptAction}; hidden visit anchors: ${visit.hiddenVisitCount}.`;
    const ledger = appendExpeditionAuditDetails(card, 'Visit ledger', [ledgerBody], `fp-expedition-location-visit-ledger-${slug}`);
    if (ledger) {
      ledger.dataset.readOnly = 'true';
      ledger.dataset.actions = '0';
    }
    body.appendChild(card);
    return card;
  }

  function appendExpeditionEventPacketSurface(body, cell, model) {
    if (!body) return null;
    const packets = expeditionEventPackets(model);
    const packet = expeditionPacketForCell(model, cell);
    const slug = safeTestId(packet?.cellId || cell?.cellId || 'none');
    const card = document.createElement('article');
    card.className = `fp-expedition-map-card fp-expedition-event-packet${packet ? ' fp-expedition-event-packet--ready' : ' fp-expedition-event-packet--locked'}`;
    card.dataset.testid = packet ? `fp-expedition-event-packet-${slug}` : 'fp-expedition-event-packet-empty';
    if (packet?.packetId) card.dataset.packetId = String(packet.packetId);
    if (cell?.cellId) card.dataset.cellId = String(cell.cellId);
    card.dataset.readOnly = packet?.readOnly ? 'true' : 'pending';

    const header = document.createElement('div');
    header.className = 'fp-expedition-event-packet__header';
    const titleWrap = document.createElement('div');
    const eyebrow = document.createElement('small');
    eyebrow.textContent = packet ? 'Map marker' : 'Map marker pending';
    const title = document.createElement('strong');
    title.textContent = expeditionPacketDisplayName(packet, 'Expedition Marker');
    titleWrap.append(eyebrow, title);
    header.appendChild(titleWrap);
    const seal = document.createElement('span');
    seal.className = 'fp-expedition-event-packet__seal';
    seal.textContent = packet ? 'Locked' : 'No marker';
    header.appendChild(seal);
    card.appendChild(header);

    const stateLine = document.createElement('div');
    stateLine.className = `fp-site-plan__status${packet ? ' fp-site-plan__status--reviewed' : ''}`;
    stateLine.textContent = packet
      ? `Map marker - ${expeditionCompactCellLabel(packet.cellId || packet.receiptLink?.cellId || cell?.cellId || '')}`
      : (packets.length ? 'No marker on selected sector' : 'Scout a hinted edge to place one');
    card.appendChild(stateLine);

    if (packet) {
      appendExpeditionPacketEvidenceChips(card, packet, cell);
      const evidenceCopy = document.createElement('p');
      evidenceCopy.className = 'fp-expedition-event-packet__lede';
      evidenceCopy.textContent = 'Selected-sector marker only. It points to what Scout revealed; commands stay on units and target rings.';
      card.appendChild(evidenceCopy);
      appendExpeditionPartyFlavor(card, cell, model, packet, 'packet');
      [
        packet.terrainExplanation,
        packet.riskExplanation,
        packet.operatorNote,
      ].filter(Boolean).forEach((text) => {
        const copy = document.createElement('p');
        copy.textContent = text;
        card.appendChild(copy);
      });
      appendExpeditionPacketFacts(card, packet);
      const boundary = document.createElement('small');
      boundary.dataset.testid = `fp-expedition-event-packet-boundary-${slug}`;
      boundary.textContent = 'Marker details only. No route/trade creation, resource changes, combat, scheduler work, public sharing, Generated Universe rendering, Atlas execution, cross-plot mutation, or external effects.';
      card.appendChild(boundary);
    } else {
      const copy = document.createElement('p');
      copy.textContent = packets.length
        ? 'This selected sector was already known from existing map truth. Scout markers appear on sectors revealed from hinted edges.'
        : 'No map markers are placed yet. Scout a server-hinted edge to create the next spatial clue.';
      const boundary = document.createElement('small');
      boundary.textContent = 'This panel is read-only and cannot create, apply, render, share, route, trade, schedule, fight, execute Atlas, or mutate any plot.';
      card.append(copy, boundary);
    }
    body.appendChild(card);
    return card;
  }

  function appendScoutSectorResult(body) {
    const receipt = state.scoutSectorReceipt;
    if (!receipt || !body) return null;
    const proof = receipt.proof || {};
    const before = proof.beforeFogCounts || {};
    const after = proof.afterFogCounts || {};
    const cellId = receipt.cellId || proof.cellId || 'selected sector';
    const card = document.createElement('article');
    card.className = 'fp-expedition-map-card fp-expedition-map-card--scout-result';
    card.dataset.testid = 'fp-scout-sector-result';
    const title = document.createElement('strong');
    title.textContent = receipt.alreadyScouted ? 'Sector Already Known' : 'Sector Scouted';
    const copy = document.createElement('p');
    copy.textContent = `${expeditionCompactCellLabel(cellId)} is now ${friendlyToken(proof.targetAfterFogState || 'known')}. The map gained one playable marker.`;
    const boundary = document.createElement('small');
    boundary.textContent = `Audit: ${cellId} changed from ${friendlyToken(proof.targetBeforeFogState || 'hinted')} to ${friendlyToken(proof.targetAfterFogState || 'known')}; hinted ${Number(before.hinted || 0)} -> ${Number(after.hinted || 0)}, known ${Number(before.known || 0)} -> ${Number(after.known || 0)}. No movement, harvesting, routes, trades, scheduler, Atlas execution, public sharing, or external effects.`;
    card.append(title, copy);
    const details = appendExpeditionAuditDetails(card, 'Details', [boundary], 'fp-scout-sector-result-details');
    if (details) {
      details.dataset.readOnly = 'true';
      details.dataset.actions = '0';
    }
    body.appendChild(card);
    return card;
  }

  function appendScoutSectorActions(body, eligibleCells, model, bundle) {
    if (!body || !eligibleCells.length) return null;
    const card = document.createElement('article');
    card.className = 'fp-expedition-map-card fp-expedition-map-card--scout';
    card.dataset.testid = 'fp-scout-sector-card';
    card.dataset.primary = 'false';
    const title = document.createElement('strong');
    title.textContent = 'Scout Sector aliases';
    const copy = document.createElement('p');
    copy.textContent = 'Scout-unit commands above are primary; these sector rows mirror the same Scout action.';
    card.append(title, copy);

    const list = document.createElement('div');
    list.className = 'fp-scout-sector-list';
    eligibleCells.forEach((cell) => {
      const slug = safeTestId(cell.cellId);
      const row = document.createElement('div');
      row.className = 'fp-scout-sector-row';
      row.dataset.testid = `fp-scout-sector-option-${slug}`;

      const label = document.createElement('span');
      const name = document.createElement('strong');
      name.textContent = cell.title || friendlyToken(cell.cellId);
      const meta = document.createElement('small');
      meta.textContent = `${cell.cellId} - ${friendlyToken(cell.status || cell.fogState)}${cell.sourceIds?.adjacentCellId ? ` from ${cell.sourceIds.adjacentCellId}` : ''}`;
      label.append(name, meta);

      const pending = state.scoutSectorPendingCellId === String(cell.cellId || '');
      const button = brassBtn(pending ? 'Scouting...' : 'Scout Sector', `fp-btn-scout-sector-${slug}`, () => doScoutExpeditionSector(cell.cellId));
      button.dataset.testid = `fp-btn-scout-sector-${slug}`;
      button.dataset.cellId = String(cell.cellId || '');
      button.dataset.idempotencyKey = scoutSectorIdempotencyKey(bundle, model, cell);
      button.disabled = !!state.scoutSectorPendingCellId;
      row.append(label, button);
      list.appendChild(row);
    });
    card.appendChild(list);
    const boundary = document.createElement('small');
    boundary.textContent = 'Alias only. Only hinted frontier_hint cells get this action; known, discovered, and locked cells remain read-only here.';
    card.appendChild(boundary);
    body.appendChild(card);
    return card;
  }

  function renderExpeditionMapThreeSurface(card, model, cells, selectedCellId) {
    const host = document.createElement('div');
    host.className = 'fp-expedition-three-host';
    host.dataset.testid = 'fp-expedition-three-host';
    host.setAttribute('role', 'img');
    host.setAttribute('aria-label', 'Zoomable private Expedition Map. Wheel or pinch to zoom, drag to pan, select sectors for details.');
    card.appendChild(host);

    const renderer = window.FoundersPlotThreeRenderer;
    if (!renderer || typeof renderer.renderExpeditionMap !== 'function') {
      const fallback = document.createElement('small');
      fallback.textContent = 'Three.js renderer unavailable; static read model remains below.';
      card.appendChild(fallback);
      return false;
    }

    const updateSemanticZoom = appendExpeditionSemanticZoomOverlay(host, renderer, model, cells, selectedCellId);
    const outcomeFeedback = expeditionCommandOutcomeFeedbackForRender(model, cells);
    state.expeditionMapThreeInfo = renderer.renderExpeditionMap(host, {
      ...model,
      cells,
      generatedHudChrome: expeditionGeneratedHudChromeModel(),
    }, {
      selectedCellId,
      selectedUnitId: state.expeditionSelectedUnitId,
      outcomeFeedback,
    });
    const controls = document.createElement('div');
    controls.className = 'fp-expedition-map-controls';
    controls.dataset.testid = 'fp-expedition-map-controls';
    [
      ['+', 'Zoom in', () => renderer.zoomExpeditionMap?.(host, 1.18)],
      ['-', 'Zoom out', () => renderer.zoomExpeditionMap?.(host, 1 / 1.18)],
      ['0', 'Reset map view', () => renderer.resetExpeditionMapCamera?.(host)],
    ].forEach(([label, ariaLabel, action]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'fp-expedition-map-control-btn';
      button.textContent = label;
      button.setAttribute('aria-label', ariaLabel);
      button.addEventListener('click', () => {
        action();
        state.expeditionMapThreeInfo = renderer.getExpeditionMapInfo?.(host) || state.expeditionMapThreeInfo;
        updateSemanticZoom?.();
      });
      controls.appendChild(button);
    });
    host.appendChild(controls);
    appendExpeditionCommandPreview(host);
    appendExpeditionCommandOutcomeChip(host, outcomeFeedback);
    updateSemanticZoom?.();
    host.dataset.renderer = 'three.js';
    return true;
  }

  function expeditionSemanticZoomTier(zoom) {
    const value = Number(zoom) || 1;
    if (value >= 2.25) {
      return {
        key: 'detail',
        label: 'Detail',
        copy: 'Selected-cell facts stay below; close zoom does not unlock extra truth.',
      };
    }
    if (value >= 1.35) {
      return {
        key: 'sector',
        label: 'Sector',
        copy: 'Hex labels and fog edges carry the readable sector layer.',
      };
    }
    return {
      key: 'survey',
      label: 'Survey',
      copy: 'Broad region silhouette from discovered, known, hinted, and locked cells.',
    };
  }

  function expeditionSemanticSelectedHint(cell, tier, counts) {
    if (!cell) return 'No selected cell in this read model.';
    const fogState = String(cell.fogState || 'locked_unknown');
    const title = cell.title || friendlyToken(cell.kind || cell.cellId);
    if (fogState === 'locked_unknown') {
      return `Selected: ${title} stays sealed; no resources, routes, or action data.`;
    }
    if (tier.key === 'survey') {
      const revealed = Number(counts.discovered || 0) + Number(counts.known || 0);
      const hidden = Number(counts.hinted || 0) + Number(counts.locked_unknown || 0);
      return `${countLabel(revealed, 'revealed cell')} / ${countLabel(hidden, 'hidden silhouette')} visible at survey scale.`;
    }
    if (fogState === 'hinted') {
      return `Selected: ${title} is a hinted edge; only Scout Sector can make it known.`;
    }
    if (tier.key === 'detail') {
      const resources = expeditionResourceHintsText(cell.resourceHints);
      return `Selected: ${title}${resources ? `, resources ${resources}` : ''}; receipts remain read-only.`;
    }
    return `Selected: ${title}; facts remain server-owned and read-only.`;
  }

  function appendExpeditionSemanticZoomOverlay(host, renderer, model, cells, selectedCellId) {
    document.querySelectorAll('[data-testid="fp-expedition-semantic-zoom"]').forEach((node) => node.remove());
    const overlay = document.createElement('div');
    overlay.className = 'fp-expedition-semantic-zoom';
    overlay.dataset.testid = 'fp-expedition-semantic-zoom';

    const tierLabel = document.createElement('strong');
    tierLabel.dataset.testid = 'fp-expedition-zoom-tier';
    const tierCopy = document.createElement('p');
    tierCopy.dataset.testid = 'fp-expedition-zoom-copy';
    const selectedHint = document.createElement('small');
    selectedHint.dataset.testid = 'fp-expedition-selected-zoom-hint';

    overlay.append(tierLabel, tierCopy, selectedHint);
    host.appendChild(overlay);

    const counts = expeditionFogCounts(model, cells);
    const update = () => {
      const info = renderer?.getExpeditionMapInfo?.(host) || state.expeditionMapThreeInfo || {};
      const tier = expeditionSemanticZoomTier(info.camera?.zoom || info.zoom);
      const currentCellId = String(info.selectedCellId || selectedCellId || '');
      const selected = cells.find((cell) => String(cell.cellId || '') === currentCellId) || selectedExpeditionCell(cells, model);
      host.dataset.zoomTier = tier.key;
      overlay.dataset.zoomTier = tier.key;
      tierLabel.textContent = tier.label;
      tierLabel.title = tier.copy;
      tierLabel.setAttribute('aria-label', `${tier.label} zoom: ${tier.copy}`);
      const revealed = Number(counts.discovered || 0) + Number(counts.known || 0);
      const hidden = Number(counts.hinted || 0) + Number(counts.locked_unknown || 0);
      tierCopy.textContent = `R${revealed} H${hidden}`;
      tierCopy.title = tier.copy;
      tierCopy.setAttribute('aria-label', `${countLabel(revealed, 'revealed cell')} and ${countLabel(hidden, 'hidden silhouette')}. ${tier.copy}`);
      const selectedDetail = expeditionSemanticSelectedHint(selected, tier, counts);
      selectedHint.textContent = `${expeditionCompactCellLabel(selected?.cellId)} · ${expeditionFogShortLabel(selected?.fogState)}`;
      selectedHint.title = selectedDetail;
      selectedHint.setAttribute('aria-label', selectedDetail);
      selectedHint.dataset.fogState = String(selected?.fogState || '');
    };

    let frame = 0;
    const schedule = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };
    host.addEventListener('wheel', schedule);
    host.addEventListener('pointermove', schedule);
    host.addEventListener('pointerup', schedule);
    host.addEventListener('pointercancel', schedule);
    host.addEventListener('founders-plot-expedition-map-view-change', update);
    return update;
  }

  function selectedExpeditionCell(cells, model = null) {
    if (!cells.length) return null;
    const selected = String(state.expeditionSelectedCellId || '');
    return cells.find((cell) => String(cell.cellId || '') === selected)
      || cells.find((cell) => String(cell.fogState || '') === 'hinted')
      || (model ? cells.find((cell) => !!expeditionPacketForCell(model, cell)) : null)
      || cells.find((cell) => ['discovered', 'known'].includes(String(cell.fogState || '')))
      || cells[0];
  }

  function appendSelectedExpeditionRules(card, cell, fogState) {
    const info = expeditionFogDefinition(fogState);
    const hidden = !['discovered', 'known'].includes(fogState);
    const rules = document.createElement('div');
    rules.className = 'fp-expedition-selected-rules';
    rules.dataset.testid = 'fp-expedition-selected-rules';
    rules.dataset.fogState = fogState;
    [
      ['Visibility', info.selected],
      ['Scout path', info.scout],
      ['Zoom context', hidden ? 'Semantic zoom clarifies status only.' : 'Semantic zoom mirrors this selected card.'],
      ['Authority', 'Server read model only; this card adds no mutation path.'],
    ].forEach(([labelText, valueText]) => {
      const item = document.createElement('span');
      item.dataset.testid = `fp-expedition-selected-rule-${safeTestId(labelText)}`;
      const label = document.createElement('small');
      label.textContent = labelText;
      const value = document.createElement('strong');
      value.textContent = valueText;
      item.append(label, value);
      rules.appendChild(item);
    });
    if (cell?.cellId) rules.dataset.cellId = String(cell.cellId);
    card.appendChild(rules);
    return rules;
  }

  function appendSelectedExpeditionDetails(body, cell, model) {
    if (!body || !cell) return null;
    const slug = safeTestId(cell.cellId);
    const fogState = String(cell.fogState || 'locked_unknown');
    const hidden = !['discovered', 'known'].includes(fogState);
    const card = document.createElement('article');
    card.className = `fp-expedition-sector-card fp-expedition-sector-card--selected fp-expedition-sector-card--${safeTestId(fogState)}`;
    card.dataset.testid = 'fp-expedition-selected-sector';
    card.dataset.cellId = String(cell.cellId || '');
    card.dataset.fogState = fogState;

    const title = document.createElement('strong');
    title.textContent = cell.title || friendlyToken(cell.kind || cell.cellId);
    card.appendChild(title);

    const status = document.createElement('div');
    status.className = `fp-site-plan__status${fogState === 'discovered' ? ' fp-site-plan__status--reviewed' : ''}`;
    status.dataset.testid = `fp-expedition-selected-status-${slug}`;
    status.textContent = `${cell.cellId} - ${friendlyToken(cell.status || fogState)} - ${friendlyToken(fogState)}`;
    card.appendChild(status);

    const copy = document.createElement('p');
    if (hidden) {
      copy.textContent = fogState === 'hinted'
        ? 'Server-provided frontier hint. Resources and hidden gameplay truth remain unrevealed until Scout makes this cell known.'
        : 'Locked unknown sector. No resources, routes, or hidden truth are exposed by this renderer.';
    } else {
      const resources = expeditionResourceHintsText(cell.resourceHints);
      copy.textContent = cell.summary || [
        cell.siteType ? `Terrain ${friendlyToken(cell.siteType)}` : '',
        cell.risk ? `risk ${friendlyToken(cell.risk)}` : '',
        resources ? `hints ${resources}` : '',
      ].filter(Boolean).join(', ') || 'Server-owned map cell without additional copy.';
    }
    card.appendChild(copy);
    appendSelectedExpeditionRules(card, cell, fogState);

    appendExpeditionPartyFlavor(card, cell, model, expeditionPacketForCell(model, cell), 'selected');

    appendChipSet(card, [
      `cell ${cell.cellId}`,
      `fog ${friendlyToken(fogState)}`,
      cell.sourceTruth ? `source ${friendlyToken(cell.sourceTruth)}` : '',
      !hidden && cell.siteType ? `terrain ${friendlyToken(cell.siteType)}` : '',
      !hidden && cell.risk ? `risk ${friendlyToken(cell.risk)}` : '',
      !hidden && expeditionResourceHintsText(cell.resourceHints) ? `resources ${expeditionResourceHintsText(cell.resourceHints)}` : '',
    ]);
    appendExpeditionReceiptTrace(card, cell, expeditionPacketForCell(model, cell), 'selected');
    if (!hidden) {
      appendExpeditionReceipts(card, cell);
      appendExpeditionLinks(card, cell, model);
    }
    const boundary = document.createElement('small');
    boundary.textContent = hidden
      ? 'Selection is visual-only and cannot scout, harvest, move, route, trade, or execute Atlas actions.'
      : (cell.recommendedNext || 'Selection is read-only; use existing verified panels for any allowed follow-up.');
    card.appendChild(boundary);
    body.appendChild(card);
    return card;
  }

  function renderExpeditionMap(bundle) {
    const body = ensureExpeditionMapPanel();
    if (!body) return;
    const model = expeditionMapModel(bundle);
    const cells = expeditionCells(model);
    const previousThreeHost = body.querySelector('[data-testid="fp-expedition-three-host"]');
    const renderer = window.FoundersPlotThreeRenderer;
    if (previousThreeHost && renderer && typeof renderer.disposeExpeditionMap === 'function') {
      renderer.disposeExpeditionMap(previousThreeHost);
    }
    body.innerHTML = '';
    body.classList.add(
      'fp-expedition-map-body',
      'fp-expedition-map-body--map-first',
      'fp-expedition-map-body--hq17b-option1',
      'fp-expedition-map-body--hq17c-generated-chrome',
      'fp-expedition-map-body--hq17d-three-masks',
    );
    body.closest('.fp-expedition-map-panel')?.classList.add(
      'fp-expedition-map-panel--hq17b-option1',
      'fp-expedition-map-panel--hq17c-generated-chrome',
      'fp-expedition-map-panel--hq17d-three-masks',
    );

    if (!hasExpeditionMapReadModel(model, bundle)) {
      body.innerHTML = '<p class="fp-helper">Expedition Map fog state is not exposed by the server read model yet.</p>';
      return;
    }

    const counts = expeditionFogCounts(model, cells);
    const status = String(model.status || bundle?.publicSummary?.expeditionMapStatus || 'READ_MODEL_PENDING').replace(/_/g, ' ');
    const revealedCells = cells.filter((cell) => ['discovered', 'known'].includes(String(cell.fogState || '')));
    const hiddenCells = cells.filter((cell) => ['hinted', 'locked_unknown'].includes(String(cell.fogState || '')));
    const scoutableCells = hiddenCells.filter(isExpeditionScoutSectorEligible);
    const selectedCell = selectedExpeditionCell(cells, model);
    if (selectedCell) state.expeditionSelectedCellId = String(selectedCell.cellId || '');
    const surveyBridge = expeditionSurveyBridge(model);
    const objective = expeditionObjectiveModel({ model, cells, counts, selectedCell, scoutableCells, surveyBridge });
    const guidedLoop = expeditionGuidedLoopModel({
      model,
      cells,
      selectedCell,
      objective,
      outcome: expeditionCommandOutcomeFeedbackForRender(model, cells),
    });
    const runtimeShell = document.createElement('section');
    runtimeShell.className = 'fp-expedition-map-runtime';
    runtimeShell.dataset.testid = 'fp-expedition-map-runtime';
    const hud = document.createElement('aside');
    hud.className = 'fp-expedition-map-hud fp-expedition-inspector-drawer fp-expedition-ledger-rail';
    hud.dataset.testid = 'fp-expedition-map-hud';
    hud.dataset.drawer = 'visual-inspector';
    hud.dataset.readOnly = 'true';
    hud.dataset.actions = '0';
    hud.dataset.hudInstrument = 'collapsed-ledger';
    bindExpeditionGeneratedHudChrome(hud, 'collapsed-ledger');
    runtimeShell.appendChild(hud);
    body.appendChild(runtimeShell);
    appendExpeditionInspectorChrome(hud, model, selectedCell, counts);

    const statusCard = document.createElement('article');
    statusCard.className = `fp-expedition-map-card fp-expedition-hud-crest${model.status === 'FOG_READ_MODEL_READY' ? ' fp-expedition-map-card--ready' : ''}`;
    statusCard.dataset.testid = 'fp-expedition-map-status';
    statusCard.dataset.status = String(model.status || '');
    statusCard.dataset.readOnly = model.readOnly ? 'true' : 'false';
    statusCard.dataset.revealed = String(revealedCells.length);
    statusCard.dataset.hidden = String(hiddenCells.length);
    statusCard.dataset.hudInstrument = 'crest-status';
    bindExpeditionGeneratedHudChrome(statusCard, 'crest-status');
    statusCard.title = `${status}; ${countLabel(revealedCells.length, 'revealed sector')} and ${countLabel(hiddenCells.length, 'hidden silhouette')} from server-owned fog state.`;
    statusCard.setAttribute('aria-label', statusCard.title);
    const title = document.createElement('strong');
    title.textContent = '◎';
    title.title = model.title || 'Private Expedition Map';
    statusCard.appendChild(title);

    const statusSymbols = document.createElement('div');
    statusSymbols.className = 'fp-expedition-map-status-symbols';
    statusSymbols.dataset.testid = 'fp-expedition-map-status-symbols';
    [
      ['◎', model.readOnly ? 'private read-only server projection' : status],
      [`◆${revealedCells.length}`, countLabel(revealedCells.length, 'revealed sector')],
      [`□${hiddenCells.length}`, countLabel(hiddenCells.length, 'hidden silhouette')],
    ].forEach(([text, fullText]) => {
      const chip = document.createElement('span');
      chip.textContent = text;
      chip.title = fullText;
      chip.setAttribute('aria-label', fullText);
      statusSymbols.appendChild(chip);
    });
    statusCard.appendChild(statusSymbols);

    const statusLedgerBody = document.createElement('div');
    statusLedgerBody.className = 'fp-expedition-inspector-section__body';
    const stateLine = document.createElement('div');
    stateLine.className = `fp-site-plan__status${model.readOnly ? ' fp-site-plan__status--reviewed' : ''}`;
    stateLine.textContent = model.readOnly ? `${status} - private read-only` : status;
    statusLedgerBody.appendChild(stateLine);
    const summary = document.createElement('p');
    summary.textContent = `${countLabel(revealedCells.length, 'revealed sector')} and ${countLabel(hiddenCells.length, 'hidden silhouette')} from server-owned fog state.`;
    statusLedgerBody.appendChild(summary);
    appendExpeditionMetrics(statusLedgerBody, counts, model.scope || {});
    appendExpeditionFogLegend(statusLedgerBody, counts, selectedCell?.fogState);
    const boundary = document.createElement('small');
    boundary.dataset.testid = 'fp-expedition-map-boundary';
    boundary.textContent = `${friendlyToken(model.authorityBoundary || 'server-owned read-only expedition map projection')}. No autonomous movement, resource gathering, routes, trades, combat, public sharing, Atlas execution, or external effects.`;
    statusLedgerBody.appendChild(boundary);
    const statusLedger = appendExpeditionAuditDetails(statusCard, 'Ledger / fog', [statusLedgerBody], 'fp-expedition-map-authority-details');
    if (statusLedger) {
      statusLedger.dataset.readOnly = 'true';
      statusLedger.dataset.actions = '0';
    }
    const inspector = hud;

    const boardCard = document.createElement('article');
    boardCard.className = 'fp-expedition-map-card fp-expedition-map-card--board';
    boardCard.dataset.testid = 'fp-expedition-map-board-card';
    boardCard.dataset.hudComposition = 'hq17c_generated_chrome_runtime';
    boardCard.dataset.generatedChromePack = EXPEDITION_GENERATED_HUD_CHROME_PACK_ID;
    boardCard.dataset.generatedHudMaskLayer = EXPEDITION_GENERATED_HUD_MASK_LAYER_ID;
    boardCard.dataset.generatedHudCleanComposite = EXPEDITION_GENERATED_HUD_CLEAN_COMPOSITE_ID;
    boardCard.dataset.generatedHudTextLayer = 'three-canvas';
    const boardTitle = document.createElement('strong');
    boardTitle.textContent = '◎';
    boardTitle.title = 'Zoomable sectors';
    boardCard.appendChild(boardTitle);
    const threeRendered = renderExpeditionMapThreeSurface(boardCard, { ...model, objective }, cells, state.expeditionSelectedCellId);
    const board = document.createElement('div');
    board.className = `fp-expedition-map-board${threeRendered ? ' fp-expedition-map-board--fallback' : ''}`;
    board.dataset.testid = 'fp-expedition-map-board';
    if (threeRendered) {
      board.hidden = true;
      board.setAttribute('aria-hidden', 'true');
    }
    board.setAttribute('role', 'img');
    board.setAttribute('aria-label', 'Read-only frontier map with discovered, known, hinted, and locked sectors.');
    const bounds = expeditionCellBounds(cells.length ? cells : [{ cellId: 'cell_origin', q: 0, r: 0 }]);
    cells.forEach((cell) => {
      const pos = expeditionCellPosition(cell, bounds);
      const fogState = String(cell.fogState || 'locked_unknown');
      const scoutable = isExpeditionScoutSectorEligible(cell);
      const cellEl = document.createElement('span');
      cellEl.className = `fp-expedition-cell fp-expedition-cell--${safeTestId(fogState)}${scoutable ? ' fp-expedition-cell--scoutable' : ''}`;
      cellEl.dataset.testid = `fp-expedition-cell-${safeTestId(cell.cellId)}`;
      cellEl.dataset.fogState = fogState;
      cellEl.dataset.status = String(cell.status || '');
      if (scoutable) cellEl.dataset.scoutable = 'true';
      cellEl.style.left = `${Math.max(4, Math.min(96, pos.left)).toFixed(2)}%`;
      cellEl.style.top = `${Math.max(5, Math.min(95, pos.top)).toFixed(2)}%`;
      cellEl.title = `${cell.title || friendlyToken(cell.kind || cell.cellId)} - ${friendlyToken(cell.status || fogState)}`;
      cellEl.textContent = expeditionCellKindLabel(cell);
      board.appendChild(cellEl);
    });
    boardCard.appendChild(board);
    const boardCopy = document.createElement('small');
    boardCopy.textContent = hiddenCells.length
      ? 'Dim silhouettes are server-provided hinted or locked cells; they do not reveal resources or actions.'
      : 'No hidden silhouettes are present in this read model.';
    boardCopy.hidden = true;
    boardCopy.title = boardCopy.textContent;
    boardCard.appendChild(boardCopy);
    boardCard.appendChild(statusCard);
    const objectiveStrip = appendExpeditionObjectiveStrip(boardCard, objective, guidedLoop, surveyBridge);
    if (objectiveStrip) {
      objectiveStrip.classList.add('fp-expedition-hud-objective');
      objectiveStrip.dataset.hudInstrument = 'objective-loop';
      bindExpeditionGeneratedHudChrome(objectiveStrip, 'objective-loop');
    }
    const visitSurface = appendExpeditionLocationVisitSurface(boardCard, selectedCell, model);
    if (visitSurface) {
      visitSurface.dataset.hudInstrument = 'site-context';
      bindExpeditionGeneratedHudChrome(visitSurface, 'selected-context');
    }
    appendExpeditionMapVisualHud(boardCard, model, counts, selectedCell, scoutableCells, bundle);
    appendExpeditionUnitRoster(boardCard, model, selectedCell);
    runtimeShell.insertBefore(boardCard, hud);
    const selectedDetails = document.createElement('div');
    selectedDetails.className = 'fp-expedition-inspector-section__body';
    appendSelectedExpeditionDetails(selectedDetails, selectedCell, model);
    appendExpeditionInspectorSection(
      inspector,
      'Selected details',
      selectedDetails,
      'fp-expedition-inspector-selected-details',
      {
        meta: selectedCell ? `${selectedCell.cellId} - visual details tucked away` : 'no selected sector',
      },
    );
    const evidenceDetails = document.createElement('div');
    evidenceDetails.className = 'fp-expedition-inspector-section__body';
    appendExpeditionEventPacketSurface(evidenceDetails, selectedCell, model);
    appendExpeditionInspectorSection(
      inspector,
      'Marker details',
      evidenceDetails,
      'fp-expedition-inspector-evidence',
      {
        meta: expeditionPacketForCell(model, selectedCell) ? 'details tucked away' : 'pending Scout result',
      },
    );

    const hiddenDetails = document.createElement('div');
    hiddenDetails.className = 'fp-expedition-inspector-section__body';
    const hiddenCard = document.createElement('article');
    hiddenCard.className = 'fp-expedition-map-card fp-expedition-map-card--hidden';
    hiddenCard.dataset.testid = 'fp-expedition-map-hidden-summary';
    const hiddenTitle = document.createElement('strong');
    hiddenTitle.textContent = 'Hidden frontier';
    hiddenCard.appendChild(hiddenTitle);
    const hiddenCopy = document.createElement('p');
    hiddenCopy.textContent = `${countLabel(counts.hinted, 'hinted silhouette')} and ${countLabel(counts.locked_unknown, 'locked unknown sector')} remain private fog.`;
    hiddenCard.appendChild(hiddenCopy);
    appendChipSet(hiddenCard, hiddenCells.slice(0, 8).map((cell) => `${friendlyToken(cell.fogState)} ${cell.cellId}`));
    hiddenDetails.appendChild(hiddenCard);
    appendExpeditionInspectorSection(
      inspector,
      'Fog ledger',
      hiddenDetails,
      'fp-expedition-inspector-fog-ledger',
      {
        meta: `${countLabel(hiddenCells.length, 'private fog cell')} - tucked away`,
      },
    );
    appendScoutSectorResult(inspector);
    const scoutAliasDetails = document.createElement('div');
    scoutAliasDetails.className = 'fp-expedition-inspector-section__body';
    appendScoutSectorActions(scoutAliasDetails, scoutableCells, model, bundle);
    if (scoutAliasDetails.childElementCount) {
      appendExpeditionInspectorSection(
        inspector,
        'Sector action aliases',
        scoutAliasDetails,
        'fp-expedition-inspector-scout-aliases',
        {
          meta: 'secondary to unit commands',
        },
      );
    }

    const sectorList = document.createElement('div');
    sectorList.className = 'fp-expedition-sector-list';
    sectorList.dataset.testid = 'fp-expedition-sector-list';
    revealedCells.forEach((cell) => {
      const slug = safeTestId(cell.cellId);
      const card = document.createElement('article');
      card.className = `fp-expedition-sector-card fp-expedition-sector-card--${safeTestId(cell.fogState)}${String(cell.status || '').includes('OUTPOST') ? ' fp-expedition-sector-card--outpost' : ''}`;
      card.dataset.testid = `fp-expedition-sector-${slug}`;
      card.dataset.fogState = String(cell.fogState || '');
      card.dataset.cellId = String(cell.cellId || '');

      const sectorTitle = document.createElement('strong');
      sectorTitle.textContent = cell.title || friendlyToken(cell.kind || cell.cellId);
      card.appendChild(sectorTitle);
      const sectorStatus = document.createElement('div');
      sectorStatus.className = `fp-site-plan__status${cell.fogState === 'discovered' ? ' fp-site-plan__status--reviewed' : ''}`;
      sectorStatus.dataset.testid = `fp-expedition-sector-status-${slug}`;
      sectorStatus.textContent = `${friendlyToken(cell.status || cell.fogState)} - ${friendlyToken(cell.fogState)}`;
      card.appendChild(sectorStatus);

      const copy = document.createElement('p');
      const resources = expeditionResourceHintsText(cell.resourceHints);
      copy.textContent = cell.summary || [
        cell.siteType ? `Terrain ${friendlyToken(cell.siteType)}` : '',
        cell.risk ? `risk ${friendlyToken(cell.risk)}` : '',
        resources ? `hints ${resources}` : '',
      ].filter(Boolean).join(', ') || 'Server-owned map cell without additional copy.';
      card.appendChild(copy);

      appendChipSet(card, [
        cell.siteType ? `terrain ${friendlyToken(cell.siteType)}` : '',
        cell.risk ? `risk ${friendlyToken(cell.risk)}` : '',
        resources ? `resources ${resources}` : '',
        ...(Array.isArray(cell.traits) ? cell.traits.map(friendlyToken) : []),
      ]);
      appendExpeditionReceipts(card, cell);
      appendExpeditionLinks(card, cell, model);
      const packet = expeditionPacketForCell(model, cell);
      if (packet) {
        const packetLine = document.createElement('small');
        packetLine.dataset.testid = `fp-expedition-sector-packet-${slug}`;
        packetLine.textContent = `${expeditionPacketDisplayName(packet, 'Map marker')} - ${expeditionCompactCellLabel(packet.cellId || packet.receiptLink?.cellId || cell.cellId)}; no actions.`;
        card.appendChild(packetLine);
      }
      const next = document.createElement('small');
      next.textContent = cell.recommendedNext || 'No map mutation is available from this panel.';
      card.appendChild(next);
      sectorList.appendChild(card);
    });

    if (!sectorList.childElementCount) {
      const empty = document.createElement('p');
      empty.className = 'fp-helper';
      empty.textContent = 'No revealed frontier sectors are present yet.';
      sectorList.appendChild(empty);
    }
    appendExpeditionInspectorSection(
      hud,
      'Revealed-sector ledger',
      sectorList,
      'fp-expedition-inspector-ledger',
      {
        meta: `${countLabel(revealedCells.length, 'read-only sector')} - receipts tucked away`,
      },
    );
  }

  function renderWorldGrid(bundle) {
    if (!els.worldGridBody) return;
    const worldGrid = bundle.worldGrid || {};
    const hasReadModel = !!worldGrid.status || !!bundle.publicSummary?.worldGridStatus;
    els.worldGridBody.innerHTML = '';
    els.worldGridBody.classList.remove(
      'fp-world-grid-body--overlay-lantern',
      'fp-world-grid-body--overlay-oracle',
      'fp-world-grid-body--overlay-beacon',
      'fp-world-grid-body--overlay-civic'
    );
    delete els.worldGridBody.dataset.localOverlayPackId;
    delete els.worldGridBody.dataset.localOverlayPreset;
    if (!hasReadModel) {
      els.worldGridBody.innerHTML = '<p class="fp-helper">World Grid readiness is not exposed by the server read model yet.</p>';
      return;
    }

    const appliedOverlay = activeOverlayPack(bundle);
    const appliedOverlayId = overlayPackId(appliedOverlay);
    const appliedPreset = appliedOverlay ? overlayPackVisualPreset(appliedOverlay) : '';
    if (appliedOverlay) {
      els.worldGridBody.classList.add(`fp-world-grid-body--overlay-${appliedPreset}`);
      els.worldGridBody.dataset.localOverlayPackId = appliedOverlayId;
      els.worldGridBody.dataset.localOverlayPreset = appliedPreset;
    }

    const status = String(worldGrid.status || bundle.publicSummary?.worldGridStatus || 'READ_MODEL_PENDING').replace(/_/g, ' ');
    const statusCard = document.createElement('article');
    statusCard.className = `fp-world-grid-card${worldGrid.civicReadiness?.ready ? ' fp-world-grid-card--ready' : ''}${appliedOverlay ? ' fp-world-grid-card--local-overlay' : ''}`;
    statusCard.dataset.testid = 'fp-world-grid-status';
    appendCardArt(statusCard, CARD_ART.worldGridBeacon, 'World Grid civic beacon', 'fp-world-grid-status-art');

    const title = document.createElement('strong');
    title.textContent = appliedOverlay
      ? overlayPackSurfaceLabel(appliedOverlay, 'world_grid')
      : 'World Grid status';
    statusCard.appendChild(title);

    const stateLine = document.createElement('div');
    stateLine.className = `fp-site-plan__status${worldGrid.readOnly ? ' fp-site-plan__status--reviewed' : ''}`;
    stateLine.textContent = worldGrid.readOnly ? `${status} - read-only` : status;
    statusCard.appendChild(stateLine);

    const summary = document.createElement('p');
    const req = worldGrid.requirements || {};
    const nextSlice = String(worldGrid.civicReadiness?.nextPromotableSlice || '').toUpperCase();
    const nextSliceLabel = nextSlice === 'HQ10B_CIVIC_PROPOSAL_RECORDS'
      ? 'HQ10B civic proposal records'
      : friendlyToken(worldGrid.civicReadiness?.nextPromotableSlice || 'the next civic slice');
    summary.textContent = `${Number(req.satisfiedCount || 0)}/${Number(req.totalCount || 0)} requirements ready for ${nextSliceLabel}.`;
    statusCard.appendChild(summary);

    const boundary = document.createElement('small');
    boundary.dataset.testid = 'fp-world-grid-boundary';
    boundary.textContent = 'Read-only advisory projection. No civic mutation, routes, scheduling, spending, Atlas execution, or arbitrary tool execution.';
    statusCard.appendChild(boundary);

    if (appliedOverlay) {
      const overlayProof = document.createElement('div');
      overlayProof.className = `fp-world-grid-overlay-proof fp-world-grid-overlay-proof--${appliedPreset}`;
      overlayProof.dataset.testid = 'fp-world-grid-local-overlay-proof';
      overlayProof.dataset.overlayPackId = appliedOverlayId;
      overlayProof.dataset.localOnly = 'true';

      const img = document.createElement('img');
      img.src = CARD_ART.worldGridBeacon;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      overlayProof.appendChild(img);

      const proofText = document.createElement('span');
      const proofTitle = document.createElement('strong');
      proofTitle.textContent = appliedOverlay.title || 'Overlay preview';
      const proofSmall = document.createElement('small');
      proofSmall.textContent = 'Local preview only; server gameplay truth unchanged.';
      proofText.appendChild(proofTitle);
      proofText.appendChild(proofSmall);
      overlayProof.appendChild(proofText);
      statusCard.appendChild(overlayProof);
    }
    els.worldGridBody.appendChild(statusCard);

    const requirementCard = document.createElement('article');
    requirementCard.className = 'fp-world-grid-card';
    requirementCard.dataset.testid = 'fp-world-grid-requirements';
    const requirementTitle = document.createElement('strong');
    requirementTitle.textContent = 'Requirements';
    requirementCard.appendChild(requirementTitle);
    const requirementItems = Array.isArray(req.items) ? req.items : [];
    if (!requirementItems.length) {
      const empty = document.createElement('p');
      empty.textContent = 'No World Grid requirements are published yet.';
      requirementCard.appendChild(empty);
    } else {
      for (const item of requirementItems) {
        const row = document.createElement('span');
        row.className = `fp-requirement${item.satisfied ? ' fp-requirement--output' : ' fp-requirement--missing'}`;
        row.dataset.testid = `fp-world-grid-requirement-${safeTestId(item.key || item.label)}`;
        row.textContent = `${item.satisfied ? 'Ready' : 'Blocked'}: ${item.label || friendlyToken(item.key)}`;
        requirementCard.appendChild(row);
      }
    }
    els.worldGridBody.appendChild(requirementCard);

    const scope = worldGrid.scope || {};
    const claims = worldGrid.claims || {};
    const scopeCard = document.createElement('article');
    scopeCard.className = 'fp-world-grid-card';
    scopeCard.dataset.testid = 'fp-world-grid-scope';
    const scopeTitle = document.createElement('strong');
    scopeTitle.textContent = 'Known scope';
    scopeCard.appendChild(scopeTitle);
    const scopeText = document.createElement('p');
    scopeText.textContent = [
      countLabel(scope.knownPlotCount, 'known plot'),
      countLabel(scope.outpostCount || claims.foundedOutpostCount, 'founded outpost'),
      countLabel(scope.knownClaimCount || claims.total, 'settlement claim')
    ].join(', ') + '.';
    scopeCard.appendChild(scopeText);
    const claimText = document.createElement('small');
    claimText.textContent = `Claims: ${statusCountText(claims.byStatus)}. Home ${scope.homePlotId || 'unknown'}, active ${scope.activePlotId || 'unknown'}.`;
    scopeCard.appendChild(claimText);
    els.worldGridBody.appendChild(scopeCard);

    const signalCard = document.createElement('article');
    signalCard.className = `fp-world-grid-card${worldGrid.civicReadiness?.ready ? ' fp-world-grid-card--ready' : ''}`;
    signalCard.dataset.testid = 'fp-world-grid-civic-readiness';
    const signalTitle = document.createElement('strong');
    signalTitle.textContent = 'Civic readiness';
    signalCard.appendChild(signalTitle);
    appendChipSet(signalCard, (worldGrid.civicReadiness?.signals || []).map((signal) => {
      const label = friendlyToken(signal.key);
      return `${signal.ready ? 'Ready' : 'Blocked'}: ${label}`;
    }));
    const signalCopy = document.createElement('small');
    const blockedBy = Array.isArray(worldGrid.civicReadiness?.blockedBy) ? worldGrid.civicReadiness.blockedBy : [];
    signalCopy.textContent = blockedBy.length
      ? `Blocked by ${blockedBy.map(friendlyToken).join(', ')}.`
      : 'Civic proposal records may be promoted next, but this panel cannot create or execute them.';
    signalCard.appendChild(signalCopy);
    els.worldGridBody.appendChild(signalCard);

    const prohibited = Array.isArray(worldGrid.civicReadiness?.prohibitedCapabilities)
      ? worldGrid.civicReadiness.prohibitedCapabilities
      : [];
    const guardrail = document.createElement('article');
    guardrail.className = 'fp-world-grid-card fp-world-grid-card--guardrail';
    guardrail.dataset.testid = 'fp-world-grid-prohibited-capabilities';
    const guardrailTitle = document.createElement('strong');
    guardrailTitle.textContent = 'Prohibited capabilities';
    guardrail.appendChild(guardrailTitle);
    appendChipSet(guardrail, prohibited.map(friendlyToken));
    const guardrailCopy = document.createElement('small');
    guardrailCopy.textContent = worldGrid.authorityBoundary || 'server-owned read-only projection only';
    guardrail.appendChild(guardrailCopy);
    els.worldGridBody.appendChild(guardrail);
  }

  function renderCivicProposals(bundle) {
    if (!els.civicProposalsBody) return;
    const draft = captureFormDraft(els.civicProposalsBody, 'fp-civic-proposal-form', CIVIC_PROPOSAL_DRAFT_FIELDS, 'civicProposalDraft');
    const model = civicProposalModel(bundle);
    const proposals = Array.isArray(model.proposals) ? model.proposals : [];
    const worldGridProposalSummary = bundle.worldGrid?.civicProposals || {};
    const hasReadModel = !!model.status || proposals.length > 0 || !!worldGridProposalSummary.total;
    els.civicProposalsBody.innerHTML = '';
    if (!hasReadModel) {
      els.civicProposalsBody.innerHTML = '<p class="fp-helper">Civic proposal records are not exposed by the server read model yet.</p>';
      return;
    }

    const ready = isCivicProposalRecordingReady(model);
    const status = String(model.status || 'LOCKED').toUpperCase().replace(/_/g, ' ');
    const summaryCard = document.createElement('article');
    summaryCard.className = `fp-civic-proposal-card${ready ? ' fp-civic-proposal-card--ready' : ' fp-civic-proposal-card--locked'}`;
    summaryCard.dataset.testid = 'fp-civic-proposals-status';
    appendCardArt(summaryCard, CARD_ART.civicProposalDossier, 'Civic proposal dossier card art', 'fp-civic-proposals-status-art');

    const title = document.createElement('strong');
    title.textContent = model.title || 'Civic Proposal Records';
    summaryCard.appendChild(title);

    const stateLine = document.createElement('div');
    stateLine.className = `fp-site-plan__status${ready ? ' fp-site-plan__status--reviewed' : ''}`;
    stateLine.textContent = `${status} - proposal only`;
    summaryCard.appendChild(stateLine);

    const summary = document.createElement('p');
    summary.textContent = civicProposalCountsText(model.counts || worldGridProposalSummary || {});
    summaryCard.appendChild(summary);

    appendChipSet(summaryCard, [
      ...(civicProposalFormOptions(model, 'allowedStatuses', ['DRAFT', 'REVIEWED', 'ARCHIVED'])),
      ...(civicProposalFormOptions(model, 'allowedCategories', ['coordination', 'public_work', 'route_study', 'civic_memory']).map(friendlyToken)),
    ]);

    const boundary = document.createElement('small');
    boundary.dataset.testid = 'fp-civic-proposals-boundary';
    boundary.textContent = `${model.authorityBoundary || worldGridProposalSummary.authorityBoundary || 'server-owned civic proposal records only'}. Records are for review and memory; execution is not implemented.`;
    summaryCard.appendChild(boundary);
    els.civicProposalsBody.appendChild(summaryCard);

    if (!ready) {
      const locked = document.createElement('article');
      locked.className = 'fp-civic-proposal-card fp-civic-proposal-card--locked';
      locked.dataset.testid = 'fp-civic-proposals-locked';
      const lockedTitle = document.createElement('strong');
      lockedTitle.textContent = 'Create civic proposal';
      locked.appendChild(lockedTitle);
      const lockedCopy = document.createElement('p');
      const blocked = Array.isArray(model.requirements?.blockedBy) ? model.requirements.blockedBy : [];
      lockedCopy.textContent = blocked.length
        ? `Locked by ${blocked.map(friendlyToken).join(', ')}.`
        : 'Locked until the server reports HQ10B civic proposal recording ready.';
      locked.appendChild(lockedCopy);
      const lockedBoundary = document.createElement('small');
      lockedBoundary.textContent = 'No local create affordance is shown until the API read model says RECORDING_READY.';
      locked.appendChild(lockedBoundary);
      els.civicProposalsBody.appendChild(locked);
    } else {
      const form = document.createElement('form');
      form.className = 'fp-civic-proposal-form';
      form.dataset.testid = 'fp-civic-proposal-form';

      const formTitle = document.createElement('strong');
      formTitle.textContent = 'Create civic proposal';
      form.appendChild(formTitle);

      const formCopy = document.createElement('p');
      formCopy.textContent = 'This writes one advisory record through POST /api/founders-plot/civic-proposals. It does not execute, apply, route, trade, spend, share, or schedule anything.';
      form.appendChild(formCopy);

      const titleLabel = document.createElement('label');
      titleLabel.textContent = 'Title';
      const titleInput = document.createElement('input');
      titleInput.name = 'title';
      titleInput.maxLength = 120;
      titleInput.placeholder = 'Civic memory review';
      titleInput.dataset.testid = 'fp-civic-proposal-title';
      titleLabel.appendChild(titleInput);
      form.appendChild(titleLabel);

      const categoryLabel = document.createElement('label');
      categoryLabel.textContent = 'Category';
      const categorySelect = document.createElement('select');
      categorySelect.name = 'category';
      categorySelect.dataset.testid = 'fp-civic-proposal-category';
      for (const category of civicProposalFormOptions(model, 'allowedCategories', ['coordination', 'public_work', 'route_study', 'civic_memory'])) {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = friendlyToken(category);
        categorySelect.appendChild(option);
      }
      categoryLabel.appendChild(categorySelect);
      form.appendChild(categoryLabel);

      const statusLabel = document.createElement('label');
      statusLabel.textContent = 'Record status';
      const statusSelect = document.createElement('select');
      statusSelect.name = 'status';
      statusSelect.dataset.testid = 'fp-civic-proposal-status-select';
      for (const proposalStatus of civicProposalFormOptions(model, 'allowedStatuses', ['DRAFT', 'REVIEWED', 'ARCHIVED'])) {
        const option = document.createElement('option');
        option.value = proposalStatus;
        option.textContent = proposalStatus;
        statusSelect.appendChild(option);
      }
      statusSelect.value = statusSelect.querySelector('option[value="DRAFT"]') ? 'DRAFT' : statusSelect.value;
      statusLabel.appendChild(statusSelect);
      form.appendChild(statusLabel);

      const summaryLabel = document.createElement('label');
      summaryLabel.textContent = 'Summary';
      const summaryInput = document.createElement('textarea');
      summaryInput.name = 'summary';
      summaryInput.maxLength = 480;
      summaryInput.rows = 3;
      summaryInput.placeholder = 'Record the civic idea, evidence, or review memory.';
      summaryInput.dataset.testid = 'fp-civic-proposal-summary';
      summaryLabel.appendChild(summaryInput);
      form.appendChild(summaryLabel);

      const noteLabel = document.createElement('label');
      noteLabel.textContent = 'Review note';
      const noteInput = document.createElement('textarea');
      noteInput.name = 'reviewNote';
      noteInput.maxLength = 320;
      noteInput.rows = 2;
      noteInput.placeholder = 'Optional review context.';
      noteInput.dataset.testid = 'fp-civic-proposal-review-note';
      noteLabel.appendChild(noteInput);
      form.appendChild(noteLabel);

      const button = brassBtn(state.civicProposalPending ? 'Recording...' : 'Create civic proposal', 'fp-btn-create-civic-proposal', () => doCreateCivicProposal(form));
      button.type = 'button';
      button.dataset.testid = 'fp-btn-create-civic-proposal';
      button.classList.add('fp-brass-btn--small');
      button.disabled = state.civicProposalPending;
      button.title = 'Create one server-owned advisory civic proposal record. Execution is not implemented.';
      form.appendChild(button);

      const formBoundary = document.createElement('small');
      formBoundary.textContent = 'Advisory record only. No world mutation, public effect, route creation, scheduling, spending, sharing, or Atlas execution.';
      form.appendChild(formBoundary);

      writeFormDraft(form, draft, CIVIC_PROPOSAL_DRAFT_FIELDS);
      bindFormDraft(form, CIVIC_PROPOSAL_DRAFT_FIELDS, 'civicProposalDraft');
      els.civicProposalsBody.appendChild(form);
    }

    const listTitle = document.createElement('p');
    listTitle.className = 'fp-helper';
    listTitle.textContent = proposals.length ? 'Stored proposal records' : 'No civic proposal records yet.';
    els.civicProposalsBody.appendChild(listTitle);

    for (const proposal of [...proposals].sort((a, b) => Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0)).slice(0, 6)) {
      const proposalId = String(proposal.proposalId || '');
      const proposalSlug = safeTestId(proposalId);
      const statusKey = String(proposal.status || 'DRAFT').toUpperCase();
      const card = document.createElement('article');
      card.className = `fp-civic-proposal-card fp-civic-proposal-card--${statusKey.toLowerCase()}`;
      card.dataset.testid = `fp-civic-proposal-${proposalSlug}`;

      const cardTitle = document.createElement('strong');
      cardTitle.textContent = proposal.title || 'Civic Proposal';
      card.appendChild(cardTitle);

      const cardStatus = document.createElement('div');
      cardStatus.className = `fp-site-plan__status${statusKey === 'REVIEWED' ? ' fp-site-plan__status--reviewed' : ''}`;
      cardStatus.dataset.testid = `fp-civic-proposal-status-${proposalSlug}`;
      cardStatus.textContent = statusKey;
      card.appendChild(cardStatus);

      const cardSummary = document.createElement('p');
      cardSummary.textContent = proposal.summary || 'No summary recorded.';
      card.appendChild(cardSummary);

      appendChipSet(card, [
        friendlyToken(proposal.category || 'coordination'),
        civicProposalScopeText(proposal.scope || {}),
        proposal.review?.reviewStatus ? friendlyToken(proposal.review.reviewStatus) : '',
        proposal.review?.reviewedBy ? `reviewed by ${String(proposal.review.reviewedBy).toLowerCase()}` : '',
        proposal.review?.executionDecision ? friendlyToken(proposal.review.executionDecision) : '',
        proposal.createdBy ? `created by ${String(proposal.createdBy).toLowerCase()}` : '',
        proposal.approvedBy ? `approved by ${String(proposal.approvedBy).toLowerCase()}` : '',
      ]);

      const review = document.createElement('small');
      review.textContent = proposal.review?.note
        ? `Review memory: ${proposal.review.note}`
        : 'Review memory: pending. Execution decision: not executable.';
      card.appendChild(review);

      const cardBoundary = document.createElement('small');
      cardBoundary.textContent = `${proposal.authorityBoundary || model.authorityBoundary || 'proposal record only'}; execution is not implemented.`;
      card.appendChild(cardBoundary);

      els.civicProposalsBody.appendChild(card);
    }
  }

  function renderOverlayApplicationPreview(bundle, model, packs) {
    const sortedPacks = sortedOverlayPacks(packs);
    if (!sortedPacks.length) return null;

    const selected = selectedOverlayPack(bundle) || sortedPacks[0];
    const selectedId = overlayPackId(selected);
    const active = activeOverlayPack(bundle);
    const activeId = overlayPackId(active);
    const selectedPreset = overlayPackVisualPreset(selected);
    const activeApplied = !!selectedId && selectedId === activeId;

    const card = document.createElement('article');
    card.className = `fp-overlay-preview-card fp-overlay-preview-card--${selectedPreset}${active ? ' fp-overlay-preview-card--active' : ''}`;
    card.dataset.testid = 'fp-overlay-application-preview';
    card.dataset.selectedPackId = selectedId;
    card.dataset.appliedPackId = activeId;
    card.dataset.localOnly = 'true';

    const heading = document.createElement('strong');
    heading.textContent = 'Local overlay application';
    card.appendChild(heading);

    const stateLine = document.createElement('div');
    stateLine.className = `fp-site-plan__status${active ? ' fp-site-plan__status--reviewed' : ''}`;
    stateLine.dataset.testid = 'fp-overlay-preview-active';
    stateLine.textContent = active
      ? `Applied locally: ${active.title || activeId}`
      : 'No local overlay applied';
    card.appendChild(stateLine);

    const copy = document.createElement('p');
    copy.textContent = active
      ? 'This browser is previewing the selected pack on the World Grid and Atlas presentation below.'
      : 'Choose a stored pack and apply it to this browser-only preview surface.';
    card.appendChild(copy);

    const controls = document.createElement('div');
    controls.className = 'fp-overlay-preview__controls';

    const selectLabel = document.createElement('label');
    selectLabel.textContent = 'Overlay pack';
    const select = document.createElement('select');
    select.dataset.testid = 'fp-overlay-pack-preview-select';
    select.name = 'overlayPackPreview';
    for (const pack of sortedPacks) {
      const option = document.createElement('option');
      option.value = overlayPackId(pack);
      option.textContent = pack.title || overlayPackId(pack);
      select.appendChild(option);
    }
    select.value = selectedId;
    select.addEventListener('change', () => {
      state.overlayPreviewSelectionId = select.value;
      renderOverlayPacks(state.bundle || bundle || {});
    });
    selectLabel.appendChild(select);
    controls.appendChild(selectLabel);

    const applyButton = brassBtn(activeApplied ? 'Preview Applied' : 'Apply Local Preview', 'fp-btn-apply-overlay-pack', () => applyLocalOverlayPreview(select.value));
    applyButton.dataset.testid = 'fp-btn-apply-overlay-pack';
    applyButton.classList.add('fp-brass-btn--small');
    applyButton.disabled = activeApplied;
    applyButton.title = 'Apply this record to the local UI preview only. No server mutation is sent.';
    controls.appendChild(applyButton);

    if (active) {
      const clearButton = brassBtn('Clear Local Preview', 'fp-btn-clear-overlay-preview', clearLocalOverlayPreview);
      clearButton.dataset.testid = 'fp-btn-clear-overlay-preview';
      clearButton.classList.add('fp-brass-btn--small');
      clearButton.title = 'Remove the browser-local overlay preview.';
      controls.appendChild(clearButton);
    }
    card.appendChild(controls);

    const visual = document.createElement('div');
    visual.className = `fp-overlay-preview__visual fp-overlay-preview__visual--${selectedPreset}${activeApplied ? ' fp-overlay-preview__visual--applied' : ''}`;
    visual.dataset.testid = 'fp-overlay-preview-visual';

    const worldSurface = document.createElement('div');
    worldSurface.className = 'fp-overlay-preview__surface fp-overlay-preview__surface--world';
    worldSurface.dataset.testid = 'fp-overlay-preview-world-grid';
    const beacon = document.createElement('img');
    beacon.src = CARD_ART.worldGridBeacon;
    beacon.alt = '';
    beacon.loading = 'lazy';
    beacon.decoding = 'async';
    worldSurface.appendChild(beacon);
    const worldText = document.createElement('span');
    const worldTitle = document.createElement('strong');
    worldTitle.textContent = overlayPackSurfaceLabel(selected, 'world_grid');
    const worldSmall = document.createElement('small');
    worldSmall.textContent = 'World Grid panel skin';
    worldText.appendChild(worldTitle);
    worldText.appendChild(worldSmall);
    worldSurface.appendChild(worldText);
    visual.appendChild(worldSurface);

    const atlasSurface = document.createElement('div');
    atlasSurface.className = 'fp-overlay-preview__surface fp-overlay-preview__surface--atlas';
    atlasSurface.dataset.testid = 'fp-overlay-preview-atlas';
    const atlasTitle = document.createElement('strong');
    atlasTitle.textContent = overlayPackSurfaceLabel(selected, 'generated_universe');
    atlasSurface.appendChild(atlasTitle);
    const nodeRail = document.createElement('div');
    nodeRail.className = 'fp-overlay-preview__nodes';
    const nodes = Array.isArray(selected.targetNodeIds) && selected.targetNodeIds.length
      ? selected.targetNodeIds.slice(0, 3)
      : ['world_grid.read_model', 'generated_universe.overlay_pack_records'];
    for (const node of nodes) {
      const nodeChip = document.createElement('span');
      nodeChip.textContent = friendlyToken(node);
      nodeRail.appendChild(nodeChip);
    }
    atlasSurface.appendChild(nodeRail);
    visual.appendChild(atlasSurface);
    card.appendChild(visual);

    const boundary = document.createElement('small');
    boundary.dataset.testid = 'fp-overlay-preview-boundary';
    boundary.textContent = `${model.authorityBoundary || 'local presentation preview only'}; apply here means browser-local UI preview, not gameplay authority or public sharing.`;
    card.appendChild(boundary);
    return card;
  }

  function renderOverlayPacks(bundle) {
    if (!els.overlayPacksBody) return;
    const draft = captureFormDraft(els.overlayPacksBody, 'fp-overlay-pack-form', OVERLAY_PACK_DRAFT_FIELDS, 'overlayPackDraft');
    const model = overlayPackModel(bundle);
    const packs = sortedOverlayPacks(model.packs);
    const hasReadModel = !!model.status || packs.length > 0 || bundle.publicSummary?.overlayPackCount != null;
    els.overlayPacksBody.innerHTML = '';
    if (!hasReadModel) {
      els.overlayPacksBody.innerHTML = '<p class="fp-helper">Generated Universe overlay pack records are not exposed by the server read model yet.</p>';
      return;
    }

    const ready = isOverlayPackRecordingReady(model);
    const status = String(model.status || 'LOCKED').toUpperCase().replace(/_/g, ' ');
    const summaryCard = document.createElement('article');
    summaryCard.className = `fp-overlay-pack-card${ready ? ' fp-overlay-pack-card--ready' : ' fp-overlay-pack-card--locked'}`;
    summaryCard.dataset.testid = 'fp-overlay-packs-status';
    appendCardArt(summaryCard, CARD_ART.generatedUniverseOverlayPack, 'Generated Universe overlay pack card art', 'fp-overlay-packs-status-art');

    const title = document.createElement('strong');
    title.textContent = model.title || 'Generated Universe Overlay Packs';
    summaryCard.appendChild(title);

    const stateLine = document.createElement('div');
    stateLine.className = `fp-site-plan__status${ready ? ' fp-site-plan__status--reviewed' : ''}`;
    stateLine.textContent = `${status} - presentation only`;
    summaryCard.appendChild(stateLine);

    const summary = document.createElement('p');
    summary.textContent = overlayPackCountsText(model.counts || {});
    summaryCard.appendChild(summary);

    appendChipSet(summaryCard, [
      model.presentationOnly ? 'presentationOnly true' : 'presentationOnly pending',
      model.visualOnly ? 'visualOnly true' : 'visualOnly pending',
      'execution disabled',
      model.renderingImplemented === true ? 'rendering implemented' : 'rendering not implemented',
      model.publicSharing === true ? 'public sharing true' : 'public sharing false',
      model.stableGameplayHashExcluded ? 'stable gameplay hash excluded' : ''
    ]);

    const boundary = document.createElement('small');
    boundary.dataset.testid = 'fp-overlay-packs-boundary';
    boundary.textContent = `${model.authorityBoundary || 'server-owned Generated Universe overlay pack records only'}. Records are presentation-only memory/proposal artifacts; they are not applied overlays, generated renders, or public shares.`;
    summaryCard.appendChild(boundary);
    els.overlayPacksBody.appendChild(summaryCard);

    const requirementsCard = document.createElement('article');
    requirementsCard.className = `fp-overlay-pack-card${ready ? ' fp-overlay-pack-card--ready' : ' fp-overlay-pack-card--locked'}`;
    requirementsCard.dataset.testid = 'fp-overlay-packs-requirements';
    const requirementsTitle = document.createElement('strong');
    requirementsTitle.textContent = 'Server requirements';
    requirementsCard.appendChild(requirementsTitle);
    const requirementItems = Array.isArray(model.requirements?.items) ? model.requirements.items : [];
    if (!requirementItems.length) {
      const empty = document.createElement('p');
      empty.textContent = 'The server has not published overlay-pack requirements yet.';
      requirementsCard.appendChild(empty);
    } else {
      for (const item of requirementItems) {
        const row = document.createElement('span');
        row.className = `fp-requirement${item.satisfied ? ' fp-requirement--output' : ' fp-requirement--missing'}`;
        row.dataset.testid = `fp-overlay-pack-requirement-${safeTestId(item.key || item.label)}`;
        row.textContent = `${item.satisfied ? 'Ready' : 'Blocked'}: ${item.label || friendlyToken(item.key)}`;
        requirementsCard.appendChild(row);
      }
    }
    const blockedBy = Array.isArray(model.requirements?.blockedBy) ? model.requirements.blockedBy : [];
    const blockedCopy = document.createElement('small');
    blockedCopy.textContent = blockedBy.length
      ? `Locked by ${blockedBy.map(friendlyToken).join(', ')}. The UI cannot bypass these server-owned requirements.`
      : 'All published requirements are ready; the UI can only write a record.';
    requirementsCard.appendChild(blockedCopy);
    els.overlayPacksBody.appendChild(requirementsCard);

    const omitted = document.createElement('article');
    omitted.className = 'fp-overlay-pack-card fp-overlay-pack-card--guardrail';
    omitted.dataset.testid = 'fp-overlay-packs-omitted-capabilities';
    const omittedTitle = document.createElement('strong');
    omittedTitle.textContent = 'Omitted capabilities';
    omitted.appendChild(omittedTitle);
    appendChipSet(omitted, overlayPackOmittedCapabilities());
    const omittedCopy = document.createElement('small');
    omittedCopy.textContent = 'None of these are available from this Founders Plot surface.';
    omitted.appendChild(omittedCopy);
    els.overlayPacksBody.appendChild(omitted);

    const previewCard = renderOverlayApplicationPreview(bundle, model, packs);
    if (previewCard) els.overlayPacksBody.appendChild(previewCard);

    if (!ready) {
      const locked = document.createElement('article');
      locked.className = 'fp-overlay-pack-card fp-overlay-pack-card--locked';
      locked.dataset.testid = 'fp-overlay-packs-locked';
      const lockedTitle = document.createElement('strong');
      lockedTitle.textContent = 'Create overlay record';
      locked.appendChild(lockedTitle);
      const lockedCopy = document.createElement('p');
      lockedCopy.textContent = blockedBy.length
        ? `Locked by ${blockedBy.map(friendlyToken).join(', ')}.`
        : 'Locked until the server reports HQ10C overlay recording ready.';
      locked.appendChild(lockedCopy);
      const lockedBoundary = document.createElement('small');
      lockedBoundary.textContent = 'No local create affordance is shown until the API read model says RECORDING_READY.';
      locked.appendChild(lockedBoundary);
      els.overlayPacksBody.appendChild(locked);
    } else {
      const sourceOptions = reviewedCivicProposalOptions(bundle, model);
      const form = document.createElement('form');
      form.className = 'fp-overlay-pack-form';
      form.dataset.testid = 'fp-overlay-pack-form';

      const formTitle = document.createElement('strong');
      formTitle.textContent = 'Create overlay record';
      form.appendChild(formTitle);

      const formCopy = document.createElement('p');
      formCopy.textContent = 'This writes one presentation-only record through POST /api/founders-plot/overlay-packs. It does not apply, render, publish, share, route, trade, spend, schedule, or execute anything.';
      form.appendChild(formCopy);

      const sourceLabel = document.createElement('label');
      sourceLabel.textContent = 'Reviewed civic proposal';
      const sourceSelect = document.createElement('select');
      sourceSelect.name = 'sourceProposalId';
      sourceSelect.dataset.testid = 'fp-overlay-pack-source-proposal';
      for (const optionData of sourceOptions) {
        const option = document.createElement('option');
        option.value = optionData.id;
        option.textContent = optionData.label;
        sourceSelect.appendChild(option);
      }
      sourceLabel.appendChild(sourceSelect);
      form.appendChild(sourceLabel);

      const titleLabel = document.createElement('label');
      titleLabel.textContent = 'Title';
      const titleInput = document.createElement('input');
      titleInput.name = 'title';
      titleInput.maxLength = 120;
      titleInput.placeholder = 'Lantern Grid Overlay';
      titleInput.dataset.testid = 'fp-overlay-pack-title';
      titleLabel.appendChild(titleInput);
      form.appendChild(titleLabel);

      const themeLabel = document.createElement('label');
      themeLabel.textContent = 'Theme';
      const themeInput = document.createElement('input');
      themeInput.name = 'theme';
      themeInput.maxLength = 80;
      themeInput.placeholder = 'lantern_grid';
      themeInput.dataset.testid = 'fp-overlay-pack-theme';
      themeLabel.appendChild(themeInput);
      form.appendChild(themeLabel);

      const statusLabel = document.createElement('label');
      statusLabel.textContent = 'Record status';
      const statusSelect = document.createElement('select');
      statusSelect.name = 'status';
      statusSelect.dataset.testid = 'fp-overlay-pack-status-select';
      const statusOptions = Array.isArray(model.allowedStatuses) && model.allowedStatuses.length
        ? model.allowedStatuses
        : ['DRAFT', 'REVIEWED', 'ARCHIVED'];
      for (const packStatus of statusOptions) {
        const option = document.createElement('option');
        option.value = packStatus;
        option.textContent = packStatus;
        statusSelect.appendChild(option);
      }
      statusSelect.value = statusSelect.querySelector('option[value="DRAFT"]') ? 'DRAFT' : statusSelect.value;
      statusLabel.appendChild(statusSelect);
      form.appendChild(statusLabel);

      const summaryLabel = document.createElement('label');
      summaryLabel.textContent = 'Summary';
      const summaryInput = document.createElement('textarea');
      summaryInput.name = 'summary';
      summaryInput.maxLength = 480;
      summaryInput.rows = 3;
      summaryInput.placeholder = 'Presentation-only labels, skins, or display hints for civic review.';
      summaryInput.dataset.testid = 'fp-overlay-pack-summary';
      summaryLabel.appendChild(summaryInput);
      form.appendChild(summaryLabel);

      const promptLabel = document.createElement('label');
      promptLabel.textContent = 'Sanitized prompt';
      const promptInput = document.createElement('textarea');
      promptInput.name = 'prompt';
      promptInput.maxLength = 600;
      promptInput.rows = 2;
      promptInput.placeholder = 'Warm civic lantern overlay, presentation only.';
      promptInput.dataset.testid = 'fp-overlay-pack-prompt';
      promptLabel.appendChild(promptInput);
      form.appendChild(promptLabel);

      const targets = document.createElement('small');
      targets.dataset.testid = 'fp-overlay-pack-form-targets';
      targets.textContent = 'Targets recorded as metadata: Progression Atlas and World Grid nodes only.';
      form.appendChild(targets);

      const button = brassBtn(state.overlayPackPending ? 'Recording...' : 'Create Overlay Record', 'fp-btn-create-overlay-pack', () => doCreateOverlayPack(form));
      button.type = 'button';
      button.dataset.testid = 'fp-btn-create-overlay-pack';
      button.classList.add('fp-brass-btn--small');
      button.disabled = state.overlayPackPending || !sourceOptions.length;
      button.title = 'Create one server-owned Generated Universe overlay pack record. Rendering and sharing are not implemented.';
      form.appendChild(button);

      const formBoundary = document.createElement('small');
      formBoundary.textContent = sourceOptions.length
        ? 'Record only. No applied overlay, render, public share, gameplay mutation, resource spend, route, scheduler, external effect, or Atlas execution.'
        : 'No reviewed civic proposal source is available in the read model.';
      form.appendChild(formBoundary);

      writeFormDraft(form, draft, OVERLAY_PACK_DRAFT_FIELDS);
      bindFormDraft(form, OVERLAY_PACK_DRAFT_FIELDS, 'overlayPackDraft');
      els.overlayPacksBody.appendChild(form);
    }

    const listTitle = document.createElement('p');
    listTitle.className = 'fp-helper';
    listTitle.textContent = packs.length ? 'Stored overlay records' : 'No Generated Universe overlay pack records yet.';
    els.overlayPacksBody.appendChild(listTitle);

    for (const pack of sortedOverlayPacks(packs).slice(0, 6)) {
      const packId = String(pack.overlayPackId || '');
      const packSlug = safeTestId(packId);
      const statusKey = String(pack.status || 'DRAFT').toUpperCase();
      const card = document.createElement('article');
      card.className = `fp-overlay-pack-card fp-overlay-pack-card--${statusKey.toLowerCase()}`;
      card.dataset.testid = `fp-overlay-pack-${packSlug}`;

      const cardTitle = document.createElement('strong');
      cardTitle.textContent = pack.title || 'Generated Universe Overlay Pack';
      card.appendChild(cardTitle);

      const cardStatus = document.createElement('div');
      cardStatus.className = `fp-site-plan__status${statusKey === 'REVIEWED' ? ' fp-site-plan__status--reviewed' : ''}`;
      cardStatus.dataset.testid = `fp-overlay-pack-status-${packSlug}`;
      cardStatus.textContent = statusKey;
      card.appendChild(cardStatus);

      const cardSummary = document.createElement('p');
      cardSummary.textContent = pack.summary || 'No summary recorded.';
      card.appendChild(cardSummary);

      appendChipSet(card, [
        pack.theme ? friendlyToken(pack.theme) : 'civic',
        pack.presentationOnly === false ? 'presentationOnly false' : 'presentationOnly true',
        pack.visualOnly === false ? 'visualOnly false' : 'visualOnly true',
        'execution disabled',
        pack.provenance?.publicSharing === true ? 'public sharing true' : 'public sharing false',
        pack.provenance?.externalEffects === true ? 'external effects true' : 'external effects false',
        pack.createdBy ? `created by ${String(pack.createdBy).toLowerCase()}` : '',
        pack.approvedBy ? `approved by ${String(pack.approvedBy).toLowerCase()}` : '',
      ]);

      const targets = document.createElement('small');
      targets.dataset.testid = `fp-overlay-pack-targets-${packSlug}`;
      targets.textContent = overlayPackTargetText(pack);
      card.appendChild(targets);

      const prompt = document.createElement('small');
      prompt.dataset.testid = `fp-overlay-pack-prompt-${packSlug}`;
      prompt.textContent = overlayPackPromptText(pack);
      card.appendChild(prompt);

      const provenance = document.createElement('small');
      provenance.textContent = `Source proposal ${pack.sourceProposalId || 'unknown'}; rendering and public sharing are not implemented.`;
      card.appendChild(provenance);

      const cardBoundary = document.createElement('small');
      cardBoundary.textContent = `${pack.authorityBoundary || model.authorityBoundary || 'overlay pack record only'}; gameplay mutation policy ${pack.gameplayMutationPolicy || 'presentation_only'}.`;
      card.appendChild(cardBoundary);

      els.overlayPacksBody.appendChild(card);
    }
  }

  function renderCivicOperations(bundle) {
    if (!els.civicOperationsBody) return;
    const projectsModel = civicProjectModel(bundle);
    const operationsModel = civicOperationsModel(bundle);
    const projects = sortedCivicProjects(projectsModel.projects);
    const worldGridProjects = bundle.worldGrid?.civicProjects || {};
    const worldGridReadiness = bundle.worldGrid?.civicReadiness || {};
    const hasProjectState = !!projectsModel.status
      || projects.length > 0
      || Number(projectsModel.counts?.total || 0) > 0
      || worldGridProjects.localCivicBeaconActive === true
      || bundle.publicSummary?.civicProjectCount != null;
    const hasOpsState = hasCivicOperationsReadModel(operationsModel);
    els.civicOperationsBody.innerHTML = '';
    els.civicOperationsBody.classList.add('fp-civic-operation-board');
    if (!hasProjectState && !hasOpsState) {
      els.civicOperationsBody.innerHTML = '<p class="fp-helper">Civic project state is not published by the server read model yet.</p>';
      return;
    }

    const activeCount = Number(projectsModel.counts?.activeCount || 0);
    const localReadiness = Number(projectsModel.activeEffects?.localReadinessDelta ?? worldGridReadiness.localProjectReadinessScore ?? 0);
    const moraleMarkers = [
      ...(Array.isArray(projectsModel.activeEffects?.moraleMarkers) ? projectsModel.activeEffects.moraleMarkers : []),
      ...(Array.isArray(operationsModel.activeEffects?.moraleMarkers) ? operationsModel.activeEffects.moraleMarkers : []),
    ].filter((entry, index, arr) => entry && arr.indexOf(entry) === index);

    const statusCard = document.createElement('article');
    statusCard.className = `fp-civic-operation-card fp-civic-operation-card--summary${activeCount > 0 || hasOpsState ? ' fp-civic-operation-card--ready' : ' fp-civic-operation-card--locked'}`;
    statusCard.dataset.testid = 'fp-civic-operations-status';
    appendCardArt(statusCard, CARD_ART.worldGridBeacon, 'Civic operations beacon', 'fp-civic-operations-status-art');

    const title = document.createElement('strong');
    title.textContent = 'Civic Operations';
    statusCard.appendChild(title);

    const stateLine = document.createElement('div');
    stateLine.className = `fp-site-plan__status${activeCount > 0 || hasOpsState ? ' fp-site-plan__status--reviewed' : ''}`;
    const projectStatus = String(projectsModel.status || 'PROJECT_STATE_PENDING').replace(/_/g, ' ');
    const operationStatus = String(operationsModel.status || '').replace(/_/g, ' ');
    stateLine.textContent = hasOpsState
      ? `${operationStatus || 'OPERATIONS READY'} - SERVER READ MODEL`
      : `${projectStatus} - CIVIC PROJECT STATE`;
    statusCard.appendChild(stateLine);

    const summary = document.createElement('p');
    summary.textContent = `${countLabel(projectsModel.counts?.total, 'civic project')} tracked, ${countLabel(activeCount, 'active public work')}; readiness +${localReadiness}.`;
    statusCard.appendChild(summary);

    const metrics = document.createElement('div');
    metrics.className = 'fp-civic-operation-metrics';
    metrics.dataset.testid = 'fp-civic-operations-metrics';
    [
      ['Projects', Number(projectsModel.counts?.total || 0)],
      ['Active', activeCount],
      ['Care', hasOpsState ? `${Number(operationsModel.activeEffects?.localCareScore || 0)}/${Number(operationsModel.activeEffects?.maxLocalCareScore || 0) || 0}` : 'pending'],
    ].forEach(([label, value]) => {
      const item = document.createElement('span');
      const itemLabel = document.createElement('small');
      itemLabel.textContent = label;
      const itemValue = document.createElement('strong');
      itemValue.textContent = value;
      item.append(itemLabel, itemValue);
      metrics.appendChild(item);
    });
    statusCard.appendChild(metrics);

    appendChipSet(statusCard, [
      projectsModel.activeEffects?.localCivicBeacon ? 'civic beacon active' : 'civic beacon pending',
      projectsModel.publicWork ? 'public work record' : '',
      hasOpsState ? 'HQ11 local-care ledger present' : 'HQ11 local-care ledger pending',
      operationsModel.operationAllowed ? 'server says local care is available' : '',
      ...moraleMarkers.map(friendlyToken),
    ]);

    const boundary = document.createElement('small');
    boundary.dataset.testid = 'fp-civic-operations-boundary';
    boundary.textContent = `${operationsModel.authorityBoundary || projectsModel.authorityBoundary || 'server-owned civic state only'}. This board reads local civic state and records one human inspection receipt; it does not create routes, trades, schedules, public shares, spending, or Atlas control.`;
    statusCard.appendChild(boundary);
    els.civicOperationsBody.appendChild(statusCard);

    const inspectableProject = activeUninspectedCivicProject(projects);
    const latestInspectedProject = projects.find((project) => isCivicProjectBaselineInspected(project)) || null;
    const inspectionCard = document.createElement('article');
    inspectionCard.className = `fp-civic-operation-card fp-civic-action-card${inspectableProject || latestInspectedProject ? ' fp-civic-operation-card--ready' : ' fp-civic-operation-card--locked'}`;
    inspectionCard.dataset.testid = 'fp-civic-project-inspection';
    const inspectionTitle = document.createElement('strong');
    inspectionTitle.textContent = inspectableProject ? 'Next action: inspect the active work' : 'Inspection receipt';
    inspectionCard.appendChild(inspectionTitle);
    const inspectionState = document.createElement('div');
    inspectionState.className = `fp-site-plan__status${latestInspectedProject ? ' fp-site-plan__status--reviewed' : ''}`;
    inspectionState.dataset.testid = 'fp-civic-project-inspection-status';
    if (inspectableProject) {
      inspectionState.textContent = 'HUMAN INSPECTION READY';
    } else if (activeCount > 0 && latestInspectedProject) {
      inspectionState.textContent = 'RECEIPT RECORDED';
    } else {
      inspectionState.textContent = 'WAITING FOR ACTIVE PUBLIC WORK';
    }
    inspectionCard.appendChild(inspectionState);
    const inspectionCopy = document.createElement('p');
    if (inspectableProject) {
      inspectionCopy.textContent = `Record a one-time readiness receipt for ${civicProjectTitle(inspectableProject)}. This confirms the project is visible and understood before later civic-operation slices build on it.`;
    } else if (activeCount > 0 && latestInspectedProject) {
      const receipt = civicProjectBaselineInspection(latestInspectedProject);
      const when = civicInspectionTime(receipt);
      inspectionCopy.textContent = `Receipt stored by server for ${civicProjectTitle(latestInspectedProject)}${when ? ` at ${when}` : ''}.`;
    } else {
      inspectionCopy.textContent = 'The next action appears when the server exposes an active same-plot civic project.';
    }
    inspectionCard.appendChild(inspectionCopy);
    appendChipSet(inspectionCard, [
      inspectableProject ? 'human check required' : '',
      inspectableProject ? 'one receipt only' : '',
      activeCount > 0 && latestInspectedProject ? 'receipt stored' : '',
      'actor HUMAN only',
      'no scheduler',
      'no routes or trades',
      'Atlas advisory only',
    ]);
    const inspectionBoundary = document.createElement('small');
    inspectionBoundary.textContent = 'Uses only POST /api/founders-plot/civic-projects/inspect for this plot; no background automation, external sharing, spending, or cross-plot mutation.';
    inspectionCard.appendChild(inspectionBoundary);
    if (inspectableProject) {
      const inspectableProjectId = civicProjectId(inspectableProject);
      const pending = state.civicProjectInspectionPendingId === inspectableProjectId;
      const projectSlug = safeTestId(inspectableProjectId);
      const inspectButton = brassBtn(pending ? 'Recording receipt...' : 'Record Inspection Receipt', `fp-btn-inspect-civic-project-${projectSlug}`, () => doInspectCivicProject(inspectableProjectId));
      inspectButton.dataset.testid = `fp-btn-inspect-civic-project-${projectSlug}`;
      inspectButton.classList.add('fp-brass-btn--small');
      inspectButton.disabled = pending;
      inspectButton.title = 'Record the HQ11 baseline_readiness inspection through the bounded server route.';
      inspectionCard.appendChild(inspectButton);
    } else if (activeCount > 0 && latestInspectedProject) {
      const receipt = civicProjectBaselineInspection(latestInspectedProject) || {};
      const receiptRows = document.createElement('div');
      receiptRows.className = 'fp-civic-receipt-grid';
      receiptRows.dataset.testid = 'fp-civic-project-inspection-receipt';
      [
        ['Project', civicProjectTitle(latestInspectedProject)],
        ['Type', friendlyToken(receipt.inspectionType || 'baseline_readiness')],
        ['Actor', receipt.inspectedBy || 'HUMAN'],
        ['Boundary', receipt.authorityBoundary || latestInspectedProject.authorityBoundary || projectsModel.authorityBoundary],
      ].forEach(([label, value]) => {
        if (!value) return;
        const row = document.createElement('span');
        const rowLabel = document.createElement('small');
        rowLabel.textContent = label;
        const rowValue = document.createElement('strong');
        rowValue.textContent = value;
        row.append(rowLabel, rowValue);
        receiptRows.appendChild(row);
      });
      inspectionCard.appendChild(receiptRows);
    }
    els.civicOperationsBody.appendChild(inspectionCard);

    const progress = operationProgress(operationsModel);
    const progressCard = document.createElement('article');
    progressCard.className = `fp-civic-operation-card${hasOpsState ? ' fp-civic-operation-card--ready' : ''}`;
    progressCard.dataset.testid = 'fp-civic-operations-progress';
    const progressTitle = document.createElement('strong');
    progressTitle.textContent = hasOpsState ? 'Local care ledger' : 'Local care lifecycle';
    progressCard.appendChild(progressTitle);
    const progressCopy = document.createElement('p');
    progressCopy.textContent = hasOpsState
      ? `${progress.label}; ${countLabel(operationsModel.counts?.completedCount, 'server receipt')} logged.`
      : 'HQ11 local-care lifecycle fields are not published yet; showing current civic project truth instead.';
    progressCard.appendChild(progressCopy);
    const meter = document.createElement('div');
    meter.className = 'fp-civic-operation-progress';
    meter.setAttribute('role', 'progressbar');
    meter.setAttribute('aria-valuemin', '0');
    meter.setAttribute('aria-valuemax', '100');
    meter.setAttribute('aria-valuenow', String(Math.round(progress.percent)));
    meter.dataset.testid = 'fp-civic-operations-progress-meter';
    const bar = document.createElement('span');
    bar.style.width = `${progress.percent}%`;
    meter.appendChild(bar);
    progressCard.appendChild(meter);
    const lifecycle = operationsModel.lifecycle && typeof operationsModel.lifecycle === 'object' ? operationsModel.lifecycle : {};
    appendChipSet(progressCard, [
      lifecycle.phase ? `phase ${friendlyToken(lifecycle.phase)}` : '',
      lifecycle.status ? `lifecycle ${friendlyToken(lifecycle.status)}` : '',
      operationsModel.counts?.beaconRoundCount ? `beacon rounds ${operationsModel.counts.beaconRoundCount}` : '',
      operationsModel.allowedOperationTypes.length ? `allowed ${operationsModel.allowedOperationTypes.map(friendlyToken).join(', ')}` : '',
    ]);
    els.civicOperationsBody.appendChild(progressCard);

    const readinessCard = document.createElement('article');
    readinessCard.className = `fp-civic-operation-card${worldGridReadiness.ready ? ' fp-civic-operation-card--ready' : ''}`;
    readinessCard.dataset.testid = 'fp-civic-operations-readiness';
    const readinessTitle = document.createElement('strong');
    readinessTitle.textContent = 'Readiness checklist';
    readinessCard.appendChild(readinessTitle);
    const readinessItems = [
      ...(Array.isArray(worldGridReadiness.signals) ? worldGridReadiness.signals : []),
      ...operationItems(operationsModel.readiness),
    ];
    if (!readinessItems.length) {
      const empty = document.createElement('p');
      empty.textContent = 'No readiness signals are published yet.';
      readinessCard.appendChild(empty);
    } else {
      for (const item of readinessItems.slice(0, 8)) {
        const row = document.createElement('span');
        row.className = `fp-requirement${item.ready === false || item.satisfied === false ? ' fp-requirement--missing' : ' fp-requirement--output'}`;
        row.dataset.testid = `fp-civic-operation-readiness-${safeTestId(item.key || item.label)}`;
        row.textContent = `${item.ready === false || item.satisfied === false ? 'Blocked' : 'Ready'}: ${friendlyToken(item.label || item.key)}`;
        readinessCard.appendChild(row);
      }
    }
    const blockedBy = [
      ...(Array.isArray(worldGridReadiness.blockedBy) ? worldGridReadiness.blockedBy : []),
      ...(Array.isArray(operationsModel.readiness?.blockedBy) ? operationsModel.readiness.blockedBy : []),
    ];
    const readinessCopy = document.createElement('small');
    readinessCopy.textContent = blockedBy.length
      ? `Blocked by ${blockedBy.map(friendlyToken).join(', ')}.`
      : `Next civic slice: ${friendlyToken(worldGridReadiness.nextPromotableSlice || operationsModel.lifecycle?.next || 'not published')}.`;
    readinessCard.appendChild(readinessCopy);
    els.civicOperationsBody.appendChild(readinessCard);

    const projectsCard = document.createElement('article');
    projectsCard.className = `fp-civic-operation-card${activeCount > 0 ? ' fp-civic-operation-card--ready' : ' fp-civic-operation-card--locked'}`;
    projectsCard.dataset.testid = 'fp-civic-operations-projects';
    const projectsTitle = document.createElement('strong');
    projectsTitle.textContent = projects.length ? 'Public works ledger' : 'Public works summary';
    projectsCard.appendChild(projectsTitle);
    if (!projects.length) {
      const empty = document.createElement('p');
      empty.textContent = worldGridProjects.localCivicBeaconActive
        ? 'World Grid reports a local Civic Beacon, but project records were not included in this response.'
        : 'No civic project records are active yet.';
      projectsCard.appendChild(empty);
      appendChipSet(projectsCard, [
        Number(worldGridProjects.total || 0) ? `${Number(worldGridProjects.total || 0)} project records` : '',
        worldGridProjects.localCivicBeaconActive ? 'local civic beacon active' : '',
        worldGridProjects.latestProjectId ? `latest ${worldGridProjects.latestProjectId}` : '',
      ]);
    } else {
      for (const project of projects.slice(0, 4)) {
        const projectId = civicProjectId(project);
        const projectRow = document.createElement('div');
        projectRow.className = 'fp-civic-operation-project';
        projectRow.dataset.testid = `fp-civic-operation-project-${safeTestId(projectId)}`;
        const rowTitle = document.createElement('strong');
        rowTitle.textContent = civicProjectTitle(project);
        projectRow.appendChild(rowTitle);
        const rowCopy = document.createElement('p');
        rowCopy.textContent = project.summary || `Source proposal ${project.sourceProposalId || 'unknown'}.`;
        projectRow.appendChild(rowCopy);
        appendChipSet(projectRow, [
          project.status,
          friendlyToken(project.projectType || ''),
          project.effect?.effectId,
          project.effect?.readinessDelta != null ? `readiness +${Number(project.effect.readinessDelta || 0)}` : '',
          project.effect?.moraleMarker ? friendlyToken(project.effect.moraleMarker) : '',
          isCivicProjectBaselineInspected(project) ? 'baseline readiness inspected' : 'baseline readiness pending',
        ]);
        const rowBoundary = document.createElement('small');
        rowBoundary.textContent = `${project.authorityBoundary || projectsModel.authorityBoundary}; source proposal ${project.sourceProposalId || 'unknown'}.`;
        projectRow.appendChild(rowBoundary);
        projectsCard.appendChild(projectRow);
      }
    }
    els.civicOperationsBody.appendChild(projectsCard);

    if (Array.isArray(operationsModel.operations) && operationsModel.operations.length) {
      const receiptsCard = document.createElement('article');
      receiptsCard.className = 'fp-civic-operation-card fp-civic-operation-card--ready';
      receiptsCard.dataset.testid = 'fp-civic-operations-receipts';
      const receiptsTitle = document.createElement('strong');
      receiptsTitle.textContent = 'Latest local-care receipts';
      receiptsCard.appendChild(receiptsTitle);
      for (const operation of operationsModel.operations.slice(0, 4)) {
        const row = document.createElement('div');
        row.className = 'fp-civic-operation-project';
        row.dataset.testid = `fp-civic-operation-receipt-${safeTestId(operation.operationId || operation.id)}`;
        const rowTitle = document.createElement('strong');
        rowTitle.textContent = operation.title || friendlyToken(operation.operationType || 'civic operation');
        row.appendChild(rowTitle);
        const rowCopy = document.createElement('p');
        rowCopy.textContent = operation.summary || 'Server-owned civic operation receipt.';
        row.appendChild(rowCopy);
        appendChipSet(row, [operation.status, friendlyToken(operation.operationType || ''), operation.effect?.effectId]);
        receiptsCard.appendChild(row);
      }
      els.civicOperationsBody.appendChild(receiptsCard);
    }
  }

  function buildingPrerequisiteStatus(bundle, prerequisite) {
    const type = String(prerequisite?.type || '').trim().toUpperCase();
    const requiredState = String(prerequisite?.requiredState || 'READY').trim().toUpperCase() || 'READY';
    const building = (bundle.buildings || []).find((entry) => entry.type === type) || null;
    const stateValue = prerequisite?.state || building?.state || null;
    const satisfied = prerequisite?.satisfied === true || (!!building && stateValue === requiredState);
    return {
      type,
      label: prerequisite?.label || BUILDING_LABELS[type] || type,
      requiredState,
      state: stateValue,
      satisfied
    };
  }

  function affordability(bundle, { cost = {}, xpRequired = null, buildingPrerequisites = [] } = {}) {
    const missing = {};
    const normalized = normalizeCost(cost);
    RESOURCE_KEYS.forEach((key) => {
      const gap = Math.max(0, Number(normalized[key] || 0) - resourceAmount(bundle, key));
      if (gap > 0) missing[key] = gap;
    });
    const xpNeed = xpRequired == null ? null : Math.max(0, Math.floor(Number(xpRequired || 0)));
    const xpGap = xpNeed == null ? 0 : Math.max(0, xpNeed - townXp(bundle));
    if (xpGap > 0) missing.xp = xpGap;
    (Array.isArray(buildingPrerequisites) ? buildingPrerequisites : []).forEach((entry) => {
      const status = buildingPrerequisiteStatus(bundle, entry);
      if (!status.satisfied && status.type) missing[`building:${status.type}`] = 1;
    });
    return {
      missing,
      canAfford: Object.keys(missing).length === 0,
    };
  }

  function makeRequirements(bundle, {
    cost = {},
    xpRequired = null,
    buildingPrerequisites = [],
    lockedLabel = '',
    output = null,
    testid = '',
  } = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'fp-requirements';
    if (testid) wrap.dataset.testid = testid;
    if (lockedLabel) {
      const lock = document.createElement('span');
      lock.className = 'fp-requirement fp-requirement--locked';
      lock.textContent = lockedLabel;
      wrap.appendChild(lock);
    }
    const normalized = normalizeCost(cost);
    RESOURCE_KEYS.forEach((key) => {
      const need = Number(normalized[key] || 0);
      if (!need) return;
      const have = resourceAmount(bundle, key);
      const missing = Math.max(0, need - have);
      const row = document.createElement('span');
      row.className = `fp-requirement${missing > 0 ? ' fp-requirement--missing' : ''}`;
      row.textContent = `${RES_ICONS[key] || key} ${key}: ${have}/${need}${missing > 0 ? ` need ${missing}` : ''}`;
      wrap.appendChild(row);
    });
    if (xpRequired != null) {
      const need = Math.max(0, Math.floor(Number(xpRequired || 0)));
      const have = townXp(bundle);
      const missing = Math.max(0, need - have);
      const row = document.createElement('span');
      row.className = `fp-requirement${missing > 0 ? ' fp-requirement--missing' : ''}`;
      row.textContent = `XP: ${have}/${need}${missing > 0 ? ` need ${missing}` : ''}`;
      wrap.appendChild(row);
    }
    (Array.isArray(buildingPrerequisites) ? buildingPrerequisites : []).forEach((entry) => {
      const status = buildingPrerequisiteStatus(bundle, entry);
      if (!status.type) return;
      const row = document.createElement('span');
      row.className = `fp-requirement${status.satisfied ? '' : ' fp-requirement--missing'}`;
      row.textContent = `${status.label}: ${status.state || 'missing'}/${status.requiredState}`;
      wrap.appendChild(row);
    });
	    if (output && typeof output === 'object') {
	      const entries = Object.entries(output)
	        .filter(([, value]) => Number(value || 0) > 0)
	        .map(([key, value]) => `${RES_ICONS[key] || key} ${outputLabel(key)} +${value}`);
      if (entries.length) {
        const row = document.createElement('span');
        row.className = 'fp-requirement fp-requirement--output';
        row.textContent = `Produces ${entries.join(', ')}`;
        wrap.appendChild(row);
      }
    }
    if (!wrap.children.length) {
      const row = document.createElement('span');
      row.className = 'fp-requirement';
      row.textContent = 'No resource cost';
      wrap.appendChild(row);
    }
    return wrap;
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
        tile.dataset.selected = isTileSelected(x, y, building) ? 'true' : 'false';
        tile.setAttribute('aria-label', building
          ? `${BUILDING_LABELS[building.type] || building.type} at (${x}, ${y})`
          : `Empty pad at (${x}, ${y})`);
        if (!pad) {
          tile.classList.add('fp-tile--void');
          tile.dataset.state = 'VOID';
          tile.setAttribute('aria-disabled', 'true');
          tile.disabled = true;
        } else if (building) {
          tile.classList.add('fp-tile--occupied', `fp-tile--${building.type.toLowerCase()}`);
          tile.dataset.state = building.state === 'UNDER_CONSTRUCTION' || building.state === 'UPGRADING'
            ? 'CONSTRUCTION'
            : building.state;
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
          tile.dataset.state = 'EMPTY';
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

  function isTileSelected(x, y, building) {
    if (!state.selected) return false;
    if (state.selected.kind === 'empty') return state.selected.x === x && state.selected.y === y && !building;
    return !!building && state.selected.building?.buildingId === building.buildingId;
  }

  function humanizeState(b) {
    switch (b.state) {
      case 'UNDER_CONSTRUCTION': return 'Building…';
      case 'UPGRADING': return 'Upgrading…';
      case 'PRODUCING': return b.type === 'EXPEDITION_BOARD' ? 'Scouting…' : 'Producing…';
      case 'OUTPUT_READY': return b.type === 'EXPEDITION_BOARD' ? 'Report ready' : 'Ready to collect';
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
	    if (b.state === 'READY' && b.canQueue) {
	      const spec = productionSpec(b);
	      if (spec) {
	        const label = document.createElement('p');
	        label.className = 'fp-helper';
	        label.textContent = spec.kind === 'SCOUT' ? 'Scout requirements' : spec.kind === 'SELL' ? 'Sell requirements' : 'Production requirements';
	        els.bldBody.appendChild(label);
	        els.bldBody.appendChild(makeRequirements(bundle, {
	          cost: spec.input,
	          output: spec.output,
	          testid: `fp-production-requirements-${b.type}`,
	        }));
	      }
	      const jobKind = spec?.kind || 'PRODUCE';
	      const buttonMeta = jobKind === 'SCOUT'
	        ? { label: 'Dispatch scout', id: 'fp-btn-scout', testid: 'fp-btn-scout' }
	        : jobKind === 'SELL'
	          ? { label: 'Sell food (daily cap)', id: 'fp-btn-sell', testid: 'fp-btn-sell' }
	          : { label: 'Queue production', id: 'fp-btn-queue', testid: 'fp-btn-queue' };
	      const produceBtn = brassBtn(buttonMeta.label, buttonMeta.id, () => doQueueJob(b.buildingId, jobKind));
	      const specAfford = affordability(bundle, { cost: spec?.input || {} });
	      produceBtn.disabled = !specAfford.canAfford;
	      if (!specAfford.canAfford) produceBtn.title = 'Collect the missing inputs before queueing this job.';
	      produceBtn.dataset.testid = buttonMeta.testid;
	      actions.appendChild(produceBtn);
	    }
    if (b.state === 'READY' && (b.type === 'HQ' || (def.upgrade && def.upgrade[b.level || 1]))) {
      const upgradeRule = b.type === 'HQ' ? bundle.hqUpgrade : def.upgrade?.[b.level || 1];
      if (upgradeRule) {
        const label = document.createElement('p');
        label.className = 'fp-helper';
        label.textContent = b.type === 'HQ'
          ? `Next upgrade: HQ Level ${upgradeRule.nextLevel}`
          : `Next upgrade: Level ${upgradeRule.toLevel}`;
        els.bldBody.appendChild(label);
        els.bldBody.appendChild(makeRequirements(bundle, {
          cost: upgradeRule.cost,
          xpRequired: b.type === 'HQ' ? upgradeRule.xpRequired : null,
          buildingPrerequisites: b.type === 'HQ' ? upgradeRule.buildingPrerequisites : [],
          testid: `fp-upgrade-requirements-${b.type}`,
        }));
      }
      const upLabel = b.type === 'HQ' ? 'Upgrade HQ' : 'Upgrade building';
      const upBtn = brassBtn(upLabel, 'fp-btn-upgrade', () => doUpgrade(b.buildingId));
      const upAfford = affordability(bundle, {
        cost: upgradeRule?.cost || {},
        xpRequired: b.type === 'HQ' ? upgradeRule?.xpRequired : null,
        buildingPrerequisites: b.type === 'HQ' ? upgradeRule?.buildingPrerequisites || [] : [],
      });
      upBtn.disabled = !upAfford.canAfford;
      if (!upAfford.canAfford) upBtn.title = 'Collect the missing resources, XP, or prerequisite buildings before starting this upgrade.';
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

  function renderRewards(bundle) {
    if (!els.rewardsBody) return;
    const rewards = Array.isArray(bundle.rewards) ? bundle.rewards : [];
    els.rewardsBody.innerHTML = '';
    if (!rewards.length) {
      const empty = document.createElement('p');
      empty.className = 'fp-helper';
      empty.textContent = 'No claimable rewards right now. Build, collect, and upgrade HQ milestones to unlock the next crate.';
      els.rewardsBody.appendChild(empty);
      return;
    }
    const intro = document.createElement('p');
    intro.className = 'fp-helper';
    intro.textContent = 'Claim these server-owned milestone rewards when they appear. They are part of the normal coin and XP path.';
    els.rewardsBody.appendChild(intro);
    rewards.forEach((reward) => {
      const rewardId = String(reward.rewardId || '');
      if (!rewardId) return;
      const rewardSlug = safeTestId(rewardId);
      const card = document.createElement('div');
      card.className = 'fp-reward-card';
      card.dataset.testid = `fp-reward-${rewardSlug}`;
      const title = document.createElement('strong');
      title.textContent = reward.title || rewardId;
      card.appendChild(title);
      const body = document.createElement('p');
      body.textContent = reward.body || 'Milestone reward available.';
      card.appendChild(body);
      const grant = document.createElement('small');
      grant.dataset.testid = `fp-reward-grant-${rewardSlug}`;
      grant.textContent = formatGrant(reward.grant) || 'Server-owned reward';
      card.appendChild(grant);
      const pending = state.rewardClaimPendingId === rewardId;
      const button = brassBtn(pending ? 'Claiming...' : 'Claim Reward', `fp-btn-claim-reward-${rewardSlug}`, () => doClaimReward(rewardId));
      button.dataset.testid = `fp-btn-claim-reward-${rewardSlug}`;
      button.classList.add('fp-brass-btn--small');
      button.disabled = pending;
      button.title = 'Claim this existing server-owned reward through /api/founders-plot/claim-reward.';
      card.appendChild(button);
      els.rewardsBody.appendChild(card);
    });
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

  function productionSpec(building) {
    const level = Number(building?.level || 1);
    switch (building?.type) {
      case 'LUMBER_CAMP':
        return { kind: 'PRODUCE', input: {}, output: { wood: level >= 2 ? 14 : 10 } };
      case 'FARM_PLOT':
        return { kind: 'PRODUCE', input: {}, output: { food: level >= 2 ? 12 : 8 } };
      case 'QUARRY':
        return { kind: 'PRODUCE', input: {}, output: { stone: level >= 2 ? 12 : 8 } };
      case 'EXPEDITION_BOARD':
        return { kind: 'SCOUT', input: { food: 6, wood: 4 }, output: { scout_report: 1 } };
      case 'WORKSHOP':
        return { kind: 'PRODUCE', input: { wood: 8, stone: 4 }, output: {} };
      case 'MARKET_STALL':
        return { kind: 'SELL', input: { food: 6 }, output: { coin: level >= 2 ? 4 : 3 } };
      default:
        return null;
    }
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
	      li.textContent = `${jobKindLabel(j.kind)} · ${BUILDING_LABELS[findType(bundle, j.buildingId)] || j.buildingId} · ${mins}m ${secs}s`;
	      ul.appendChild(li);
	    }
	    els.jobsBody.innerHTML = '';
	    els.jobsBody.appendChild(ul);
	  }

	  function jobKindLabel(kind) {
	    const key = String(kind || '').toUpperCase();
	    if (key === 'SCOUT') return 'Scouting';
	    if (key === 'SETTLER_CONVOY') return 'Settler Convoy';
	    if (key === 'SELL') return 'Selling';
	    if (key === 'PRODUCE') return 'Production';
	    return key || 'Job';
	  }

	  function renderScoutReports(bundle) {
	    if (!els.scoutReportsBody) return;
	    const reports = Array.isArray(bundle.scoutReports) ? bundle.scoutReports : [];
	    const sitePlans = Array.isArray(bundle.sitePlans) ? bundle.sitePlans : [];
	    const planReportIds = new Set(sitePlans.map((plan) => String(plan.reportId || '')));
	    if (!reports.length) {
	      els.scoutReportsBody.innerHTML = '<p class="fp-helper">No reports yet. Build an Expedition Board after HQ3, then dispatch a scout.</p>';
	      return;
	    }
	    els.scoutReportsBody.innerHTML = '';
	    for (const report of [...reports].sort((a, b) => Number(b.sequence || 0) - Number(a.sequence || 0)).slice(0, 4)) {
	      const card = document.createElement('article');
	      card.className = 'fp-scout-report';
	      card.dataset.testid = `fp-scout-report-${String(report.reportId || '').replace(/[^a-zA-Z0-9_-]/g, '_')}`;
	      appendCardArt(card, CARD_ART.scoutReport, 'Scout Report dossier', `fp-scout-report-art-${safeTestId(report.reportId)}`);
	      const title = document.createElement('strong');
	      title.textContent = report.title || 'Scout Report';
	      card.appendChild(title);
	      const summary = document.createElement('p');
	      summary.textContent = report.summary || 'Nearby-site intelligence recorded.';
	      card.appendChild(summary);
	      const chips = document.createElement('div');
	      chips.className = 'fp-scout-report__chips';
	      [
	        report.siteType ? `site: ${String(report.siteType).replace(/_/g, ' ')}` : '',
	        report.risk ? `risk: ${report.risk}` : '',
	        ...(Array.isArray(report.traits) ? report.traits.slice(0, 3) : [])
	      ].filter(Boolean).forEach((text) => {
	        const chip = document.createElement('span');
	        chip.textContent = text;
	        chips.appendChild(chip);
	      });
	      card.appendChild(chips);
	      if (report.recommendedNext) {
	        const next = document.createElement('small');
	        next.textContent = report.recommendedNext;
	        card.appendChild(next);
	      }
	      const reportId = String(report.reportId || '');
	      const hasPlan = planReportIds.has(reportId);
	      const planButton = brassBtn(hasPlan ? 'Site Plan drafted' : 'Draft Site Plan', `fp-btn-draft-site-plan-${reportId.replace(/[^a-zA-Z0-9_-]/g, '_')}`, () => doDraftSitePlan(reportId));
	      planButton.dataset.testid = `fp-btn-draft-site-plan-${reportId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
	      planButton.classList.add('fp-brass-btn--small');
	      planButton.disabled = hasPlan || !reportId;
	      if (hasPlan) planButton.title = 'This Scout Report already has an engine-owned Site Plan draft.';
	      card.appendChild(planButton);
	      els.scoutReportsBody.appendChild(card);
	    }
	  }

	  function renderSitePlans(bundle) {
	    if (!els.sitePlansBody) return;
	    const plans = Array.isArray(bundle.sitePlans) ? bundle.sitePlans : [];
	    const hqLevel = Math.max(1, Math.floor(Number(bundle?.plot?.hqLevel || bundle?.hqLevel || 1)));
	    if (!plans.length) {
	      els.sitePlansBody.innerHTML = '<p class="fp-helper">No Site Plans yet. Draft one from a collected Scout Report; Atlas variants can stay private proposals until promoted.</p>';
	      return;
	    }
	    els.sitePlansBody.innerHTML = '';
	    for (const plan of [...plans].sort((a, b) => Number(b.sequence || 0) - Number(a.sequence || 0)).slice(0, 4)) {
	      const planId = String(plan.planId || '');
	      const planSlug = safeTestId(planId);
	      const reviewed = isSitePlanReviewed(plan);
	      const pendingReview = state.reviewPendingPlanId === planId;
	      const pendingConvoy = state.convoyPendingPlanId === planId;
	      const settlementClaim = claimForSitePlan(bundle, plan);
	      const canReview = hqLevel >= 6 && planId && !reviewed;
	      const canPrepareConvoy = reviewed && planId && !settlementClaim;
	      const card = document.createElement('article');
	      card.className = `fp-site-plan${reviewed ? ' fp-site-plan--reviewed' : ''}`;
	      card.dataset.testid = `fp-site-plan-${planSlug}`;
	      appendCardArt(
	        card,
	        settlementClaim ? CARD_ART.claimReadyPlan : reviewed ? CARD_ART.reviewedPlan : CARD_ART.sitePlan,
	        reviewed ? 'Reviewed Site Plan' : 'Site Plan dossier',
	        `fp-site-plan-art-${planSlug}`,
	        reviewed ? 'stamp' : ''
	      );
	      const title = document.createElement('strong');
	      title.textContent = plan.title || 'Site Plan';
	      card.appendChild(title);
	      const summary = document.createElement('p');
	      summary.textContent = plan.summary || 'Canonical planning draft recorded from a Scout Report.';
	      card.appendChild(summary);
	      const chips = document.createElement('div');
	      chips.className = 'fp-scout-report__chips';
	      [
	        plan.focus ? `focus: ${plan.focus}` : '',
	        plan.status ? `status: ${plan.status}` : '',
	        plan.promotionStatus ? `promotion: ${plan.promotionStatus}` : '',
	        plan.siteType ? `site: ${String(plan.siteType).replace(/_/g, ' ')}` : ''
	      ].filter(Boolean).forEach((text) => {
	        const chip = document.createElement('span');
	        chip.textContent = text;
	        chips.appendChild(chip);
	      });
	      card.appendChild(chips);
	      const status = document.createElement('div');
	      status.className = `fp-site-plan__status${reviewed ? ' fp-site-plan__status--reviewed' : ''}`;
	      status.dataset.testid = `fp-site-plan-review-status-${planSlug}`;
	      status.textContent = reviewed
	        ? settlementClaim
	          ? `Settlement claim ${String(settlementClaim.status || '').replace(/_/g, ' ')}`
	          : 'Claim-ready planning only'
	        : hqLevel >= 6
	          ? 'Settlement Charter review available'
	          : 'Settlement Charter unlocks at HQ Lv 6';
	      card.appendChild(status);
	      const boundary = document.createElement('small');
	      boundary.textContent = reviewed
	        ? settlementClaim
	          ? 'This plan is already tied to the server-owned Settler Convoy claim path.'
	          : 'Reviewed by HQ6. No territory claimed yet; ready for one explicit Settler Convoy claim, and no second plot exists until founding.'
	        : (plan.recommendedNext || 'No claim or second plot exists until a future engine promotion implements it.');
	      card.appendChild(boundary);
	      if (canReview) {
	        const reviewButton = brassBtn(pendingReview ? 'Reviewing...' : 'Review Site Plan', `fp-btn-review-site-plan-${planSlug}`, () => doReviewSitePlan(planId));
	        reviewButton.dataset.testid = `fp-btn-review-site-plan-${planSlug}`;
	        reviewButton.classList.add('fp-brass-btn--small');
	        reviewButton.disabled = pendingReview;
	        reviewButton.title = 'HQ6 Settlement Charter review marks claim-ready planning only.';
	        card.appendChild(reviewButton);
	      }
	      if (canPrepareConvoy) {
	        const convoyButton = brassBtn(pendingConvoy ? 'Preparing...' : 'Prepare Settler Convoy', `fp-btn-prepare-settler-convoy-${planSlug}`, () => doPrepareSettlerConvoy(planId));
	        convoyButton.dataset.testid = `fp-btn-prepare-settler-convoy-${planSlug}`;
	        convoyButton.classList.add('fp-brass-btn--small');
	        convoyButton.disabled = pendingConvoy;
	        convoyButton.title = 'Spend the engine-owned HQ7 convoy cost and create a timed settlement claim.';
	        card.appendChild(convoyButton);
	      }
	      els.sitePlansBody.appendChild(card);
	    }
	  }

  function renderOwnedPlots(bundle) {
    if (!els.ownedPlotsBody) return;
    const plots = Array.isArray(bundle.ownedPlots) ? bundle.ownedPlots : [];
    if (!plots.length) {
      els.ownedPlotsBody.innerHTML = '<p class="fp-helper">No owned plot summary yet. Open the plot once to seed home membership.</p>';
      return;
    }
    const wrap = document.createElement('div');
    wrap.className = 'fp-owned-plots';
    for (const plot of plots) {
      const row = document.createElement('article');
      row.className = `fp-owned-plot${plot.active ? ' fp-owned-plot--active' : ''}`;
      row.dataset.testid = `fp-owned-plot-${safeTestId(plot.plotId)}`;
      const title = document.createElement('strong');
      title.textContent = `${plot.role === 'OUTPOST' ? 'Outpost' : 'Home'} - ${plot.title || plot.plotId || 'Plot'}`;
      row.appendChild(title);
      const detail = document.createElement('small');
      detail.textContent = `${plot.plotId || 'plot'} - HQ Lv ${plot.hqLevel || 1}${plot.siteType ? ` - ${String(plot.siteType).replace(/_/g, ' ')}` : ''}${plot.active ? ' - active' : ''}`;
      row.appendChild(detail);
      wrap.appendChild(row);
    }
    els.ownedPlotsBody.innerHTML = '';
    els.ownedPlotsBody.appendChild(wrap);
    const note = document.createElement('p');
    note.className = 'fp-helper';
    note.textContent = 'Owned plots are read-only here for this slice; full plot switching is deferred.';
    els.ownedPlotsBody.appendChild(note);
  }

	  function renderSettlementClaims(bundle) {
	    if (!els.settlementClaimsBody) return;
	    const claims = Array.isArray(bundle.settlementClaims) ? bundle.settlementClaims : [];
    const plansById = new Map((bundle.sitePlans || []).map((plan) => [String(plan.planId || ''), plan]));
    const plotsById = new Map((bundle.ownedPlots || []).map((plot) => [String(plot.plotId || ''), plot]));
    if (!claims.length) {
      els.settlementClaimsBody.innerHTML = '<p class="fp-helper">No Settlement Claims yet. A reviewed Site Plan can prepare the first Settler Convoy.</p>';
      return;
    }
    els.settlementClaimsBody.innerHTML = '';
    for (const claim of [...claims].sort((a, b) => Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0)).slice(0, 5)) {
      const claimId = String(claim.claimId || '');
      const claimSlug = safeTestId(claimId);
      const statusKey = String(claim.status || '').toUpperCase();
      const sourcePlan = plansById.get(String(claim.sitePlanId || ''));
      const foundedPlot = plotsById.get(String(claim.foundedPlotId || ''));
      const card = document.createElement('article');
      card.className = `fp-settlement-claim fp-settlement-claim--${statusKey.toLowerCase().replace(/_/g, '-')}`;
      card.dataset.testid = `fp-settlement-claim-${claimSlug}`;
      appendCardArt(
        card,
        statusKey === 'FOUNDED'
          ? CARD_ART.secondPlotFounded
          : statusKey === 'CONVOY_ARRIVED'
            ? CARD_ART.outpostMarker
            : statusKey === 'CONVOY_PREPARING'
              ? CARD_ART.settlerConvoy
              : CARD_ART.settlementClaim,
        'Settlement Claim',
        `fp-settlement-claim-art-${claimSlug}`
      );

      const title = document.createElement('strong');
      title.textContent = claim.title || 'Settlement Claim';
      card.appendChild(title);

      const status = document.createElement('div');
      status.className = 'fp-site-plan__status fp-site-plan__status--reviewed';
      status.dataset.testid = `fp-settlement-claim-status-${claimSlug}`;
      status.textContent = statusKey.replace(/_/g, ' ');
      card.appendChild(status);

      const meta = document.createElement('p');
      const durationMs = Number(claim.receipt?.durationMs || 0) || Math.max(0, Number(claim.convoyEndsAt || 0) - Number(claim.convoyStartedAt || 0));
      meta.textContent = [
        sourcePlan ? `Source plan: ${sourcePlan.title || sourcePlan.planId}` : claim.sitePlanId ? `Source plan: ${claim.sitePlanId}` : '',
        durationMs ? `Duration: ${formatDuration(durationMs)}` : '',
        claim.siteType ? `Site: ${String(claim.siteType).replace(/_/g, ' ')}` : '',
        claim.risk ? `Risk: ${claim.risk}` : ''
      ].filter(Boolean).join(' - ');
      card.appendChild(meta);

      card.appendChild(makeRequirements(bundle, {
        cost: claim.cost || claim.receipt?.cost || {},
        testid: `fp-settlement-claim-cost-${claimSlug}`,
      }));

      if (statusKey === 'CONVOY_PREPARING') {
        const remaining = Math.max(0, Number(claim.convoyEndsAt || 0) - Date.now());
        const detail = document.createElement('small');
        detail.textContent = remaining > 0
          ? `Convoy preparing. Arrival in about ${formatDuration(remaining)}.`
          : 'Convoy is preparing; refresh will mark arrival when the server simulation advances.';
        card.appendChild(detail);
      }

      if (statusKey === 'CONVOY_ARRIVED') {
        const pendingFound = state.foundingPendingClaimId === claimId;
        const foundButton = brassBtn(pendingFound ? 'Founding...' : 'Found Settlement', `fp-btn-found-settlement-${claimSlug}`, () => doFoundSettlement(claimId));
        foundButton.dataset.testid = `fp-btn-found-settlement-${claimSlug}`;
        foundButton.classList.add('fp-brass-btn--small');
        foundButton.disabled = pendingFound;
        foundButton.title = 'Create the second plot from this arrived Settler Convoy claim.';
        card.appendChild(foundButton);
      }

      if (statusKey === 'FOUNDED') {
        const founded = document.createElement('small');
        founded.dataset.testid = `fp-settlement-claim-founded-${claimSlug}`;
        founded.textContent = `Second plot founded explicitly: ${foundedPlot?.title || 'Settler Outpost'} (${claim.foundedPlotId || 'owned outpost'}).`;
        card.appendChild(founded);
      }

      els.settlementClaimsBody.appendChild(card);
	    }
	  }

  function renderDoctrine(bundle) {
    if (!els.doctrineBody) return;
    const research = bundle.research || {};
    const catalog = Array.isArray(bundle.doctrineCatalog) ? bundle.doctrineCatalog : [];
    const doctrineState = bundle.doctrineState || {};
    const selectedId = doctrineState.status === 'SELECTED' ? String(doctrineState.selectedDoctrineId || '') : '';
    const lodge = research.lodge || {};
    const lodgeReady = lodge.status === 'OPERATIONAL_READY' || catalog.some(isDoctrineAvailable) || !!selectedId;

    els.doctrineBody.innerHTML = '';

    const intro = document.createElement('p');
    intro.className = 'fp-helper';
    intro.textContent = lodgeReady
      ? 'Server-owned doctrine stance is available here; no physical Research Lodge building exists in this slice.'
      : 'Doctrine selection unlocks after the server marks Research Lodge doctrine ready; no building or research tree exists yet.';
    els.doctrineBody.appendChild(intro);

    if (!catalog.length) {
      const empty = document.createElement('p');
      empty.className = 'fp-helper';
      empty.textContent = 'No doctrine catalog entries are exposed by the server yet.';
      els.doctrineBody.appendChild(empty);
      return;
    }

    for (const doctrine of catalog) {
      const doctrineId = String(doctrine.doctrineId || '');
      const doctrineSlug = safeTestId(doctrineId);
      const selected = doctrine.selected === true || (!!selectedId && selectedId === doctrineId);
      const available = isDoctrineAvailable(doctrine);
      const pending = state.doctrinePendingId === doctrineId;
      const effect = doctrine.effectValue || {};
      const card = document.createElement('article');
      card.className = `fp-doctrine-card${selected ? ' fp-doctrine-card--selected' : available ? ' fp-doctrine-card--available' : ''}`;
      card.dataset.testid = `fp-doctrine-${doctrineSlug}`;
      appendCardArt(card, CARD_ART.doctrine, 'Research Lodge', `fp-doctrine-art-${doctrineSlug}`);

      const title = document.createElement('strong');
      title.textContent = doctrine.title || doctrineId || 'Doctrine';
      card.appendChild(title);

      const status = document.createElement('div');
      status.className = `fp-site-plan__status${selected ? ' fp-site-plan__status--reviewed' : ''}`;
      status.dataset.testid = `fp-doctrine-status-${doctrineSlug}`;
      status.textContent = selected ? 'Selected' : available ? 'Available' : 'Locked';
      card.appendChild(status);

      const summary = document.createElement('p');
      summary.textContent = doctrine.summary || 'Server-owned doctrine catalog entry.';
      card.appendChild(summary);

      const chips = document.createElement('div');
      chips.className = 'fp-scout-report__chips';
      [
        doctrine.engineOwnedEffect ? 'server-owned effect' : 'advisory only',
        doctrine.gameplayBuff ? 'gameplay buff' : '',
        doctrine.effectKind ? String(doctrine.effectKind).replace(/_/g, ' ') : '',
      ].filter(Boolean).forEach((text) => {
        const chip = document.createElement('span');
        chip.textContent = text;
        chips.appendChild(chip);
      });
      card.appendChild(chips);

      const effectCopy = document.createElement('small');
      if (selected && doctrine.effectKind === 'scout_duration_modifier') {
        const pct = Number(effect.reductionPct || Math.round((1 - Number(effect.durationMultiplier || 1)) * 100));
        effectCopy.dataset.testid = `fp-doctrine-effect-${doctrineSlug}`;
        effectCopy.textContent = `Effect selected: Expedition Board SCOUT duration reduced by ${pct || 5}%. Costs, outputs, inventory, settlement, and cross-plot rules are unchanged.`;
      } else if (available && doctrine.effectKind === 'scout_duration_modifier') {
        effectCopy.textContent = 'Available effect: only Expedition Board SCOUT duration gets 5% shorter after selection.';
      } else {
        effectCopy.textContent = doctrineBlockedText(doctrine);
      }
      card.appendChild(effectCopy);

      if (available && !selected) {
        const button = brassBtn(pending ? 'Selecting...' : 'Select Doctrine', `fp-btn-select-doctrine-${doctrineSlug}`, () => doSelectDoctrine(doctrineId));
        button.dataset.testid = `fp-btn-select-doctrine-${doctrineSlug}`;
        button.classList.add('fp-brass-btn--small');
        button.disabled = pending;
        button.title = 'Select this server-owned doctrine for the current plot.';
        card.appendChild(button);
      }

      els.doctrineBody.appendChild(card);
    }
  }

  function renderWorkOrders(bundle) {
    if (!els.workOrdersBody) return;
    const planner = bundle.cohortPlanner || {};
    const templates = Array.isArray(bundle.workOrderTemplates)
      ? bundle.workOrderTemplates
      : Array.isArray(planner.templates)
        ? planner.templates
        : [];
    const workOrders = Array.isArray(bundle.workOrders)
      ? bundle.workOrders
      : Array.isArray(planner.workOrders)
        ? planner.workOrders
        : [];
    const hasReadModel = !!planner.status || templates.length > 0 || workOrders.length > 0;

    els.workOrdersBody.innerHTML = '';
    if (!hasReadModel) {
      els.workOrdersBody.innerHTML = '<p class="fp-helper">Work Orders are not exposed by the server read model yet.</p>';
      return;
    }

    const intro = document.createElement('p');
    intro.className = 'fp-helper';
    intro.textContent = planner.status === 'DRAFTING_READY'
      ? 'Bounded delegation only: draft here, execute explicitly, collect receipts.'
      : 'Locked by server prerequisites. The UI only reflects the planner read model.';
    els.workOrdersBody.appendChild(intro);

    const templateList = templates.length
      ? templates
      : [{
        templateId: 'collect_ready_outputs_once',
        title: 'Collect Ready Outputs Once',
        allowedActions: ['et.plot.collect_outputs'],
        caps: { maxChildActions: 2, maxResourceSpend: { wood: 0, stone: 0, food: 0, coin: 0 }, maxRuntimeMs: 120000, allowedPlotScope: 'current_plot_only' },
        availability: { unlocked: false, blockedBy: [] },
        authorityBoundary: 'server_owned_work_order_executor_collect_ready_outputs_once_v1'
      }];

    for (const template of templateList.filter((entry) => entry.templateId === 'collect_ready_outputs_once')) {
      const templateId = String(template.templateId || '');
      const templateSlug = safeTestId(templateId);
      const available = isWorkOrderTemplateAvailable(template);
      const pending = state.workOrderDraftPendingTemplateId === templateId;
      const card = document.createElement('article');
      card.className = `fp-work-order-card${available ? ' fp-work-order-card--available' : ' fp-work-order-card--locked'}`;
      card.dataset.testid = `fp-work-order-template-${templateSlug}`;
      appendCardArt(card, CARD_ART.workOrder, 'Cohort Work Order dossier', `fp-work-order-template-art-${templateSlug}`);

      const title = document.createElement('strong');
      title.textContent = template.title || 'Collect Ready Outputs Once';
      card.appendChild(title);

      const status = document.createElement('div');
      status.className = `fp-site-plan__status${available ? ' fp-site-plan__status--reviewed' : ''}`;
      status.dataset.testid = `fp-work-order-template-status-${templateSlug}`;
      status.textContent = available ? 'Draft ready' : 'Locked';
      card.appendChild(status);

      const summary = document.createElement('p');
      summary.textContent = template.summary || 'Create a bounded collect-ready-outputs work order draft.';
      card.appendChild(summary);

      appendChipSet(card, [
        ...(Array.isArray(template.allowedActions) ? template.allowedActions.map(friendlyToken) : []),
        ...workOrderCapChips(template.caps || {}),
        'draft expires 24h'
      ]);

      const boundary = document.createElement('small');
      boundary.dataset.testid = `fp-work-order-template-boundary-${templateSlug}`;
      boundary.textContent = available
        ? 'Explicit execution only. No scheduler, spending, placement, scouting, founding, or Atlas mutation.'
        : workOrderBlockedText(template);
      card.appendChild(boundary);

      if (available) {
        const button = brassBtn(pending ? 'Drafting...' : 'Create Draft', `fp-btn-create-work-order-${templateSlug}`, () => doCreateWorkOrderDraft(templateId));
        button.dataset.testid = `fp-btn-create-work-order-${templateSlug}`;
        button.classList.add('fp-brass-btn--small');
        button.disabled = pending;
        button.title = 'Create one server-owned DRAFT work order. It will not execute automatically.';
        card.appendChild(button);
      }

      els.workOrdersBody.appendChild(card);
    }

    const listTitle = document.createElement('p');
    listTitle.className = 'fp-helper';
    listTitle.textContent = workOrders.length ? 'Receipts and drafts' : 'No work-order drafts yet.';
    els.workOrdersBody.appendChild(listTitle);

    for (const order of [...workOrders].sort((a, b) => Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0)).slice(0, 5)) {
      const workOrderId = String(order.workOrderId || '');
      const orderSlug = safeTestId(workOrderId);
      const statusKey = effectiveWorkOrderStatus(order);
      const pending = state.workOrderExecutePendingId === workOrderId;
      const canExecute = statusKey === 'DRAFT'
        && order.templateId === 'collect_ready_outputs_once'
        && planner.executionAvailable === true;
      const card = document.createElement('article');
      card.className = `fp-work-order-card fp-work-order-card--${statusKey.toLowerCase()}`;
      card.dataset.testid = `fp-work-order-${orderSlug}`;
      appendCardArt(card, CARD_ART.workOrder, 'Work Order dossier', `fp-work-order-art-${orderSlug}`);

      const title = document.createElement('strong');
      title.textContent = order.title || 'Work Order Draft';
      card.appendChild(title);

      const status = document.createElement('div');
      status.className = `fp-site-plan__status${statusKey === 'COMPLETED' ? ' fp-site-plan__status--reviewed' : ''}`;
      status.dataset.testid = `fp-work-order-status-${orderSlug}`;
      status.textContent = statusKey;
      card.appendChild(status);

      const meta = document.createElement('p');
      meta.textContent = `${String(order.templateId || '').replace(/_/g, ' ')} - ${workOrderScopeText(order.scope || {})}`;
      card.appendChild(meta);

      appendChipSet(card, [
        ...(Array.isArray(order.allowedActions) ? order.allowedActions.map(friendlyToken) : []),
        ...workOrderCapChips(order.caps || {}),
        `${Array.isArray(order.childReceipts) ? order.childReceipts.length : 0} child receipts`
      ]);

      const expiry = document.createElement('small');
      expiry.dataset.testid = `fp-work-order-expiry-${orderSlug}`;
      expiry.textContent = workOrderExpiryText(order, statusKey);
      card.appendChild(expiry);

      const boundary = document.createElement('small');
      boundary.textContent = order.failureReason
        ? `Failure: ${order.failureReason}`
        : 'Execution is a human-clicked endpoint call. No background automation runs this draft.';
      card.appendChild(boundary);

      if (canExecute) {
        const button = brassBtn(pending ? 'Executing...' : 'Execute Work Order', `fp-btn-execute-work-order-${orderSlug}`, () => doExecuteWorkOrder(workOrderId));
        button.dataset.testid = `fp-btn-execute-work-order-${orderSlug}`;
        button.classList.add('fp-brass-btn--small');
        button.disabled = pending;
        button.title = 'Execute this DRAFT once through /api/founders-plot/work-orders/execute.';
        card.appendChild(button);
      }

      els.workOrdersBody.appendChild(card);
    }
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
        ? 'Foreman is observing. Enable a permission, then let the first delegated action resolve for +10 XP in that tier.'
        : `Foreman running with ${active} of ${total} permissions. The first successful delegated action in each tier grants +10 XP.`);
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

  function selectedKey() {
    if (!state.selected) return '';
    if (state.selected.kind === 'empty') return `pad:${state.selected.x},${state.selected.y}`;
    if (state.selected.kind === 'building' && state.selected.building?.buildingId) {
      return `building:${state.selected.building.buildingId}`;
    }
    return '';
  }

  function renderScene(bundle) {
    if (!window.FoundersPlotSceneState || !els.stage || !els.threeViewport) return;
    const scene = window.FoundersPlotSceneState.createSceneState(bundle, {
      selectedKey: selectedKey()
    });
    state.scene = scene;
    renderActorHooks(scene);
    const renderer = window.FoundersPlotThreeRenderer;
    if (renderer && typeof renderer.renderPlotScene === 'function') {
      state.threeInfo = renderer.renderPlotScene(els.stage, els.threeViewport, scene);
    }
  }

  function renderActorHooks(scene) {
    if (!els.actorHooks) return;
    els.actorHooks.innerHTML = '';
    const actors = Array.isArray(scene?.actors) ? scene.actors : [];
    actors.forEach((actor) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.testid = `fp-visual-actor-${actor.canonicalRoleId}`;
      button.dataset.visualActorId = actor.actorId;
      button.dataset.role = actor.canonicalRoleId;
      button.dataset.sourceDomain = actor.sourceDomain;
      button.dataset.sourceObjectId = actor.sourceObjectId;
      button.dataset.selectionKey = actor.selectionKey;
      button.dataset.drawerKey = actor.drawerKey;
      button.dataset.actionKind = actor.actionKind || '';
      button.dataset.actionCue = actor.actionCue?.cueType || '';
      button.dataset.accessory = actor.actionCue?.accessory || '';
      button.dataset.progress = String(actor.progress ?? 0);
      button.dataset.routeId = actor.route?.routeId || '';
      button.dataset.wayId = actor.route?.wayId || '';
      button.dataset.routeProgress = String(actor.route?.progress ?? '');
      button.dataset.visualOnly = 'true';
      button.textContent = `${actor.canonicalRoleId} ${actor.sourceObjectId}`;
      button.addEventListener('click', () => handleScenePick({ detail: actor }));
      els.actorHooks.appendChild(button);
    });
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
    renderBuildingPanel(state.bundle || state.snapshot || {});
    renderScene(state.bundle || state.snapshot || {});
  }

  function handleScenePick(ev) {
    const detail = ev?.detail || {};
    if (detail.drawerKey === 'approvals' || detail.sourceDomain === 'approval') {
      els.foremanBody?.scrollIntoView({ block: 'nearest' });
      els.approvals?.querySelector('button')?.focus();
      return;
    }
    if (detail.drawerKey === 'foreman' || detail.sourceDomain === 'foreman') {
      els.foremanBody?.scrollIntoView({ block: 'nearest' });
      els.foremanAct?.focus();
      return;
    }
    if (detail.drawerKey === 'rewards' || detail.sourceDomain === 'reward' || detail.drawerKey === 'quest' || detail.sourceDomain === 'quest') {
      document.querySelector('[data-testid="fp-quest-step"]')?.scrollIntoView({ block: 'nearest' });
      return;
    }
    selectByKey(detail.selectionKey || '');
  }

  function selectByKey(key) {
    const bundle = state.bundle || {};
    const buildings = Array.isArray(bundle.buildings) ? bundle.buildings : [];
    if (String(key).startsWith('building:')) {
      const id = key.slice('building:'.length);
      const building = buildings.find((entry) => String(entry.buildingId || '') === id)
        || buildings.find((entry) => entry.type === id)
        || null;
      if (building) {
        state.selected = { kind: 'building', building, x: building.x, y: building.y };
        closePalette();
      }
    } else if (String(key).startsWith('pad:')) {
      const [xRaw, yRaw] = key.slice('pad:'.length).split(',');
      const x = Number(xRaw);
      const y = Number(yRaw);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        const building = buildings.find((entry) => Number(entry.x) === x && Number(entry.y) === y);
        state.selected = building ? { kind: 'building', building, x, y } : { kind: 'empty', x, y };
      }
    }
    renderGrid(bundle);
    renderBuildingPanel(bundle);
    renderScene(bundle);
    document.querySelector('[data-testid="fp-building-panel"]')?.scrollIntoView({ block: 'nearest' });
    document.querySelector('[data-testid="fp-building-panel"] button')?.focus();
  }

  function openPalette(x, y, bundle) {
    if (!els.palette) return;
    els.palette.hidden = false;
    els.palClose.hidden = false;
    els.palette.innerHTML = '';
    const defs = bundle.buildingDefs || {};
    const hqLevel = Number(bundle?.plot?.hqLevel || bundle?.hqLevel || 1);
    const types = Object.keys(defs).filter((type) => type !== 'HQ')
      .sort((a, b) => Number(defs[a]?.unlockHqLevel || 1) - Number(defs[b]?.unlockHqLevel || 1));
    const list = types.length ? types : ((bundle.unlocks && bundle.unlocks.buildings) || state.unlocks);
    list.forEach((type) => {
      const def = defs[type] || {};
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'fp-palette__item fp-brass-btn';
      card.dataset.testid = `fp-palette-${type}`;
      const name = BUILDING_LABELS[type] || type;
      const locked = hqLevel < Number(def.unlockHqLevel || 1);
      const cost = def.construction?.cost || {};
      const afford = affordability(bundle, { cost });
      card.disabled = locked || !afford.canAfford;
      card.dataset.locked = locked ? 'true' : 'false';
      card.dataset.affordable = afford.canAfford ? 'true' : 'false';
      if (locked) card.title = `${name} unlocks at HQ Level ${def.unlockHqLevel}.`;
      else if (!afford.canAfford) card.title = `Collect the missing resources before placing ${name}.`;
      const title = document.createElement('strong');
      title.textContent = name;
      card.appendChild(title);
      const status = document.createElement('span');
      status.className = 'fp-palette__cost';
      status.textContent = locked ? `Locked until HQ Lv ${def.unlockHqLevel}` : 'Build cost';
      card.appendChild(status);
      card.appendChild(makeRequirements(bundle, {
        cost,
        lockedLabel: locked ? `HQ Lv ${hqLevel}/${def.unlockHqLevel}` : '',
        testid: `fp-build-requirements-${type}`,
      }));
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
    state.bundle = bundle;
    state.unlocks = bundle.unlocks?.buildings || state.unlocks;
    await refreshOwnedPlotsSummary(bundle);
    await refreshWorldGridStatus(bundle);
    await refreshExpeditionMapStatus(bundle);
    await refreshCivicProposals(bundle);
    await refreshOverlayPacks(bundle);
    await refreshCivicProjects(bundle);
    syncLocalOverlayState(bundle);
    renderAll(bundle);
    return bundle;
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
	      rewards: s.rewards || [],
	      quest: s.quest || plot.quest || null,
	      unlocks: s.unlocks || { buildings: s.unlockedBuildings || [] },
	      buildingDefs: s.buildingDefs || {},
	      hqUpgrade: s.hqUpgrade || null,
	      scoutReports: s.scoutReports || plot.scoutReports || [],
		      sitePlans: s.sitePlans || plot.sitePlans || [],
      settlementClaims: s.settlementClaims || [],
      research: s.research || {},
      doctrineCatalog: s.doctrineCatalog || s.research?.doctrineCatalog || [],
      doctrineState: s.doctrineState || s.research?.doctrineState || plot.doctrineState || {},
      cohortPlanner: s.cohortPlanner || {},
      workOrderTemplates: s.workOrderTemplates || s.cohortPlanner?.templates || [],
      workOrders: s.workOrders || s.cohortPlanner?.workOrders || [],
      worldGrid: s.worldGrid || null,
      expeditionMap: s.expeditionMap || null,
      civicProposals: s.civicProposals || null,
      proposals: s.proposals || s.civicProposals?.proposals || [],
      overlayPacks: s.overlayPacks || null,
      packs: s.packs || s.overlayPacks?.packs || [],
      civicProjects: s.civicProjects || null,
      civicOperations: s.civicOperations || null,
      publicSummary: s.publicSummary || {},
      ownedPlots: s.ownedPlots || [],
	      activePlotId: s.activePlotId || plot.plotId || envelope.plotId || null,
	      homePlotId: s.homePlotId || plot.plotId || envelope.plotId || null,
	      visualActors: s.visualActors || [],
      audit: s.audit || {},
      stateHash: s.audit?.stateHash || envelope.stateHash || '',
      pads: s.pads || plot.pads || defaultPads(),
      hqLevel: plot.hqLevel || 1,
      townXp: plot.townXp || 0,
      recap: envelope.recap || null,
    };
  }

  async function refreshOwnedPlotsSummary(bundle) {
    if (!bundle?.plotId) return;
    const query = `${API.plots}?plotId=${encodeURIComponent(bundle.plotId)}`;
    const { data } = await api(query);
    if (!data?.ok || !Array.isArray(data.plots)) return;
    bundle.ownedPlots = data.plots;
    bundle.homePlotId = data.homePlotId || bundle.homePlotId;
    bundle.activePlotId = data.activePlotId || bundle.activePlotId;
    if (Array.isArray(data.settlementClaims)) bundle.settlementClaims = data.settlementClaims;
  }

  async function refreshWorldGridStatus(bundle) {
    if (!bundle?.plotId || bundle.worldGrid?.status) return;
    const { data } = await api(API.worldGrid);
    if (!data?.ok || !data.worldGrid) return;
    bundle.worldGrid = data.worldGrid;
  }

  async function refreshExpeditionMapStatus(bundle) {
    if (!bundle?.plotId || bundle.expeditionMap?.status) return;
    const hasMapSummary = bundle.publicSummary?.expeditionMapStatus != null
      || bundle.publicSummary?.expeditionMapKnownCount != null
      || bundle.publicSummary?.expeditionMapDiscoveredCount != null;
    if (!hasMapSummary) return;
    const query = `${API.expeditionMap}?plotId=${encodeURIComponent(bundle.plotId)}`;
    const { data } = await api(query);
    if (!data?.ok || !data.expeditionMap) return;
    bundle.expeditionMap = data.expeditionMap;
  }

  async function refreshCivicProposals(bundle) {
    if (!bundle?.plotId) return;
    const existing = civicProposalModel(bundle);
    if (existing.status && Array.isArray(existing.proposals)) return;
    const hasCivicSummary = bundle.publicSummary?.civicProposalCount != null
      || bundle.worldGrid?.civicProposals?.total != null;
    if (!hasCivicSummary) return;
    const query = `${API.civicProposals}?plotId=${encodeURIComponent(bundle.plotId)}`;
    const { data } = await api(query);
    if (!data?.ok || !data.civicProposals) return;
    bundle.civicProposals = data.civicProposals;
    if (Array.isArray(data.proposals) && !Array.isArray(bundle.civicProposals.proposals)) {
      bundle.civicProposals.proposals = data.proposals;
    }
  }

  async function refreshOverlayPacks(bundle) {
    if (!bundle?.plotId) return;
    const existing = overlayPackModel(bundle);
    if (existing.status && Array.isArray(existing.packs)) return;
    const hasOverlaySummary = bundle.publicSummary?.overlayPackCount != null;
    if (!hasOverlaySummary) return;
    const query = `${API.overlayPacks}?plotId=${encodeURIComponent(bundle.plotId)}`;
    const { data } = await api(query);
    if (!data?.ok || !data.overlayPacks) return;
    bundle.overlayPacks = data.overlayPacks;
    if (Array.isArray(data.packs) && !Array.isArray(bundle.overlayPacks.packs)) {
      bundle.overlayPacks.packs = data.packs;
    }
  }

  async function refreshCivicProjects(bundle) {
    if (!bundle?.plotId) return;
    const existing = civicProjectModel(bundle);
    if (existing.status && Array.isArray(existing.projects) && existing.projects.length > 0) return;
    const hasProjectSummary = bundle.publicSummary?.civicProjectCount != null
      || bundle.worldGrid?.civicProjects?.total != null
      || bundle.worldGrid?.civicProjects?.localCivicBeaconActive === true;
    if (!hasProjectSummary) return;
    const query = `${API.civicProjects}?plotId=${encodeURIComponent(bundle.plotId)}`;
    const { data } = await api(query);
    if (!data?.ok || !data.civicProjects) return;
    bundle.civicProjects = data.civicProjects;
    if (Array.isArray(data.projects) && !Array.isArray(bundle.civicProjects.projects)) {
      bundle.civicProjects.projects = data.projects;
    }
  }

  function renderAll(bundle) {
    refreshSelectedFromBundle(bundle);
    renderResources(bundle.plot || {});
    renderQuest(bundle);
	    renderGrid(bundle);
	    renderJobs(bundle);
	    renderOwnedPlots(bundle);
    renderBuildingPanel(bundle);
	    renderRewards(bundle);
	    renderScoutReports(bundle);
	    renderSitePlans(bundle);
	    renderSettlementClaims(bundle);
	    renderDoctrine(bundle);
	    renderWorkOrders(bundle);
	    renderExpeditionMap(bundle);
	    renderWorldGrid(bundle);
	    renderCivicProposals(bundle);
	    renderOverlayPacks(bundle);
	    renderCivicOperations(bundle);
	    renderForeman(bundle);
    renderRecap(bundle);
    renderScene(bundle);
  }

  function refreshSelectedFromBundle(bundle) {
    if (!state.selected || !bundle) return;
    const buildings = Array.isArray(bundle.buildings) ? bundle.buildings : [];
    const current = state.selected.kind === 'building'
      ? buildings.find((b) => b.buildingId === state.selected.building?.buildingId)
      : buildings.find((b) => b.x === state.selected.x && b.y === state.selected.y);
    if (current) {
      state.selected = {
        kind: 'building',
        building: current,
        x: current.x,
        y: current.y,
      };
      return;
    }
    if (state.selected.kind === 'building') {
      state.selected = null;
    }
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
	    toast(kind === 'SCOUT' ? 'Scout dispatched.' : 'Job queued.');
	    await loadState();
	  }

  async function doCollect(buildingId) {
    const { data } = await api(API.collect, 'POST', {
      plotId: state.plotId, buildingId,
      actor: 'HUMAN', idempotencyKey: idem(`collect-${buildingId}`),
	    });
	    if (!data.ok) return toast(data.error?.message || 'Nothing to collect.', 'danger');
	    toast(data.extras?.collected?.scout_report ? 'Scout report collected.' : 'Collected outputs.');
	    await loadState();
	  }

  async function doDraftSitePlan(reportId) {
    const report = (state.bundle?.scoutReports || []).find((entry) => String(entry.reportId || '') === String(reportId || ''));
    const { data } = await api(API.sitePlan, 'POST', {
      plotId: state.plotId,
      reportId,
      title: report?.title ? `${report.title} Site Plan` : 'Site Plan',
      focus: 'balanced',
      actor: 'HUMAN',
      idempotencyKey: idem(`site-plan-${reportId}`),
    });
    if (!data.ok) return toast(data.error?.message || 'Could not draft Site Plan.', 'danger');
    toast(data.existing ? 'Site Plan already exists.' : 'Site Plan drafted.');
    await loadState();
  }

  async function doDraftSitePlanFromPacket(packetId, cellId = '') {
    const safePacketId = String(packetId || '').trim();
    if (!safePacketId) return;
    const bundle = state.bundle || {};
    const model = expeditionMapModel(bundle);
    const packet = expeditionEventPackets(model).find((entry) => String(entry.packetId || '') === safePacketId) || {};
    const targetCellId = String(cellId || packet.cellId || packet.receiptLink?.cellId || '').trim();
    state.expeditionPacketSitePlanPendingId = safePacketId;
    if (targetCellId) state.expeditionSelectedCellId = targetCellId;
    renderExpeditionMap(bundle);
    const { data } = await api(API.packetSitePlan, 'POST', {
      plotId: state.plotId,
      packetId: safePacketId,
      title: targetCellId ? `${expeditionCompactCellLabel(targetCellId)} Site Plan` : 'Scout Packet Site Plan',
      focus: 'balanced',
      actor: 'HUMAN',
      idempotencyKey: idem(`packet-site-plan-${safeTestId(safePacketId)}`),
    });
    state.expeditionPacketSitePlanPendingId = '';
    if (!data.ok) {
      renderExpeditionMap(state.bundle || {});
      return toast(data.error?.message || 'Could not draft packet Site Plan.', 'danger');
    }
    const nextCellId = String(data.cellId || targetCellId || '').trim();
    if (nextCellId) state.expeditionSelectedCellId = nextCellId;
    setExpeditionCommandOutcomeFeedback({
      commandId: 'draft_site_plan_from_packet',
      cellId: nextCellId,
      unitType: 'surveyor',
      label: data.existing ? 'Surveyed' : 'Surveyed',
      receiptId: data.sitePlan?.planId || '',
      receiptKind: 'packet_site_plan_draft',
    });
    toast(data.existing ? 'Map target already surveyed.' : 'Map target surveyed.');
    await loadState();
  }

  async function doReviewSitePlan(planId) {
    const safePlanId = String(planId || '');
    const model = expeditionMapModel(state.bundle || {});
    const bridgeCandidate = expeditionSurveyBridgeCandidateForPlan(expeditionSurveyBridge(model), safePlanId);
    if (bridgeCandidate?.cellId) state.expeditionSelectedCellId = String(bridgeCandidate.cellId || '');
    state.reviewPendingPlanId = safePlanId;
    renderSitePlans(state.bundle || {});
    renderExpeditionMap(state.bundle || {});
    const { data } = await api(API.reviewSitePlan, 'POST', {
      plotId: state.plotId,
      planId: safePlanId,
      reviewNote: 'HQ6 Settlement Charter review: claim-ready planning only; no territory claimed.',
      actor: 'HUMAN',
      idempotencyKey: idem(`review-site-plan-${safePlanId}`),
    });
    state.reviewPendingPlanId = '';
    if (!data.ok) {
      renderSitePlans(state.bundle || {});
      renderExpeditionMap(state.bundle || {});
      return toast(data.error?.message || 'Could not review Site Plan.', 'danger');
    }
    const reviewedMap = data.state?.expeditionMap || {};
    const reviewedBridge = expeditionSurveyBridge(reviewedMap);
    const reviewedCandidate = expeditionSurveyBridgeCandidateForPlan(reviewedBridge, safePlanId) || bridgeCandidate;
    const reviewedCellId = String(reviewedCandidate?.cellId || '').trim();
    const surveyorUnit = (Array.isArray(reviewedMap.units?.items) ? reviewedMap.units.items : [])
      .find((unit) => String(unit.sourcePlanId || '') === safePlanId && String(unit.unitType || '') === 'surveyor') || null;
    if (reviewedCellId) state.expeditionSelectedCellId = reviewedCellId;
    if (surveyorUnit?.unitId) state.expeditionSelectedUnitId = String(surveyorUnit.unitId || '');
    if (reviewedCellId) {
      setExpeditionCommandOutcomeFeedback({
        commandId: 'review_site_plan',
        cellId: reviewedCellId,
        unitId: surveyorUnit?.unitId || '',
        unitType: 'surveyor',
        label: 'Ready',
        receiptId: safePlanId,
        receiptKind: 'site_plan_review',
      });
    }
    toast(data.existing ? 'Map target already ready.' : 'Map target ready for convoy.');
    await loadState();
  }

  async function doPrepareSettlerConvoy(sitePlanId) {
    const safePlanId = String(sitePlanId || '');
    const model = expeditionMapModel(state.bundle || {});
    const target = expeditionCommandHintTarget(model, 'prepare_settler_convoy', (command, unit) => (
      String(command.sourcePlanId || unit.sourcePlanId || '') === safePlanId
    ));
    state.convoyPendingPlanId = safePlanId;
    renderSitePlans(state.bundle || {});
    renderExpeditionMap(state.bundle || {});
    const { data } = await api(API.prepareSettlerConvoy, 'POST', {
      plotId: state.plotId,
      sitePlanId: safePlanId,
      actor: 'HUMAN',
      idempotencyKey: idem(`prepare-settler-convoy-${safePlanId}`),
    });
    state.convoyPendingPlanId = '';
    if (!data.ok) {
      renderSitePlans(state.bundle || {});
      renderExpeditionMap(state.bundle || {});
      return toast(data.error?.message || 'Could not prepare Settler Convoy.', 'danger');
    }
    const nextBundle = await loadState();
    const claimId = String(data.settlementClaim?.claimId || '');
    const targetCellId = target.cellId || state.expeditionSelectedCellId;
    let convoyUnit = null;
    if (claimId) {
      const nextModel = expeditionMapModel(nextBundle || state.bundle || {});
      convoyUnit = expeditionUnits(nextModel).find((unit) => (
        String(unit.unitType || '') === 'settler_convoy'
        && String(unit.sourceClaimId || '') === claimId
      ));
      if (convoyUnit?.unitId) {
        state.expeditionSelectedUnitId = String(convoyUnit.unitId || '');
        if (convoyUnit.cellId) state.expeditionSelectedCellId = String(convoyUnit.cellId || '');
      }
    }
    const eventCellId = convoyUnit?.cellId || targetCellId;
    if (eventCellId) {
      state.expeditionSelectedCellId = eventCellId;
      setExpeditionCommandOutcomeFeedback({
        commandId: 'prepare_settler_convoy',
        unitId: convoyUnit?.unitId || target.unit?.unitId || state.expeditionSelectedUnitId,
        unitType: convoyUnit?.unitType || 'settler_convoy',
        cellId: eventCellId,
        label: 'Rolling',
        receiptId: data.settlementClaim?.claimId || data.job?.jobId || '',
        receiptKind: data.settlementClaim?.claimId ? 'settler_convoy_claim' : 'settler_convoy_job',
      });
      renderExpeditionMap(nextBundle || state.bundle || {});
    }
    toast(data.existing ? 'Settler Convoy claim already exists.' : 'Settler Convoy preparing.');
  }

  async function doFoundSettlement(claimId) {
    const safeClaimId = String(claimId || '');
    const model = expeditionMapModel(state.bundle || {});
    const target = expeditionCommandHintTarget(model, 'found_settlement', (command, unit) => (
      String(command.claimId || unit.sourceClaimId || '') === safeClaimId
    ));
    state.foundingPendingClaimId = safeClaimId;
    renderSettlementClaims(state.bundle || {});
    const { data } = await api(API.foundSettlement, 'POST', {
      plotId: state.plotId,
      claimId: safeClaimId,
      actor: 'HUMAN',
      idempotencyKey: idem(`found-settlement-${safeClaimId}`),
    });
    state.foundingPendingClaimId = '';
    if (!data.ok) {
      renderSettlementClaims(state.bundle || {});
      return toast(data.error?.message || 'Could not found settlement.', 'danger');
    }
    const targetCellId = target.cellId || state.expeditionSelectedCellId;
    if (targetCellId) {
      state.expeditionSelectedCellId = targetCellId;
      if (target.unit?.unitId) state.expeditionSelectedUnitId = target.unit.unitId;
    }
    const nextBundle = await loadState();
    const foundedPlotId = String(data.foundedPlot?.plotId || data.settlementClaim?.foundedPlotId || '');
    const nextModel = expeditionMapModel(nextBundle || state.bundle || {});
    const result = expeditionFoundedOutpostResultTarget(nextModel, {
      claimId: data.settlementClaim?.claimId || safeClaimId,
      foundedPlotId,
      fallbackCellId: targetCellId,
    });
    if (result.cellId) state.expeditionSelectedCellId = String(result.cellId || '');
    if (result.unit?.unitId) state.expeditionSelectedUnitId = String(result.unit.unitId || '');
    if (result.cellId) {
      setExpeditionCommandOutcomeFeedback({
        commandId: 'found_settlement',
        unitId: result.unit?.unitId || target.unit?.unitId || state.expeditionSelectedUnitId,
        unitType: result.unit?.unitType || target.unit?.unitType || 'settler_convoy',
        cellId: result.cellId,
        receiptId: data.settlementClaim?.claimId || safeClaimId,
        receiptKind: 'settlement_found_receipt',
        label: 'Founded',
        icon: '⌂',
      });
      renderExpeditionMap(nextBundle || state.bundle || {});
    }
    toast(data.existing ? 'Settlement already founded.' : 'Second plot founded.');
  }

  async function doSelectDoctrine(doctrineId) {
    const safeDoctrineId = String(doctrineId || '');
    state.doctrinePendingId = safeDoctrineId;
    renderDoctrine(state.bundle || {});
    const { data } = await api(API.selectDoctrine, 'POST', {
      plotId: state.plotId,
      doctrineId: safeDoctrineId,
      actor: 'HUMAN',
      idempotencyKey: idem(`select-doctrine-${safeDoctrineId}`),
    });
    state.doctrinePendingId = '';
    if (!data.ok) {
      renderDoctrine(state.bundle || {});
      return toast(data.error?.message || 'Could not select doctrine.', 'danger');
    }
    toast(data.existing ? 'Doctrine already selected.' : 'Doctrine selected.');
    await loadState();
  }

  async function doCreateWorkOrderDraft(templateId) {
    const safeTemplateId = String(templateId || '');
    state.workOrderDraftPendingTemplateId = safeTemplateId;
    renderWorkOrders(state.bundle || {});
    const { data } = await api(API.workOrderDraft, 'POST', {
      plotId: state.plotId,
      templateId: safeTemplateId,
      scope: {
        mode: 'all_ready_outputs',
        plotId: state.plotId
      },
      actor: 'HUMAN',
      idempotencyKey: idem(`work-order-draft-${safeTemplateId}`),
    });
    state.workOrderDraftPendingTemplateId = '';
    if (!data.ok) {
      renderWorkOrders(state.bundle || {});
      return toast(data.error?.message || 'Could not create Work Order draft.', 'danger');
    }
    toast('Work Order draft created.');
    await loadState();
  }

  async function doExecuteWorkOrder(workOrderId) {
    const safeWorkOrderId = String(workOrderId || '');
    state.workOrderExecutePendingId = safeWorkOrderId;
    renderWorkOrders(state.bundle || {});
    const { data } = await api(API.workOrderExecute, 'POST', {
      plotId: state.plotId,
      workOrderId: safeWorkOrderId,
      actor: 'HUMAN',
      idempotencyKey: idem(`work-order-execute-${safeWorkOrderId}`),
    });
    state.workOrderExecutePendingId = '';
    if (!data.ok) {
      renderWorkOrders(state.bundle || {});
      return toast(data.error?.message || 'Could not execute Work Order.', 'danger');
    }
    toast(`Work Order executed: ${data.executedChildCount || 0} receipts.`);
    await loadState();
  }

  async function doScoutExpeditionSector(cellId) {
    const safeCellId = String(cellId || '').trim();
    if (!safeCellId) return;
    const bundle = state.bundle || {};
    const model = expeditionMapModel(bundle);
    const cell = expeditionCells(model).find((entry) => String(entry.cellId || '') === safeCellId);
    if (!isExpeditionScoutSectorEligible(cell)) {
      return toast('Only server-hinted map-edge sectors can be scouted here.', 'danger');
    }
    state.scoutSectorPendingCellId = safeCellId;
    renderExpeditionMap(bundle);
    const { data } = await api(API.scoutSector, 'POST', {
      plotId: state.plotId,
      cellId: safeCellId,
      actor: 'HUMAN',
      idempotencyKey: scoutSectorIdempotencyKey(bundle, model, cell),
    });
    state.scoutSectorPendingCellId = '';
    if (!data.ok) {
      renderExpeditionMap(state.bundle || {});
      return toast(data.error?.message || 'Could not scout that sector.', 'danger');
    }
    state.scoutSectorReceipt = {
      cellId: data.revealedCellId || safeCellId,
      alreadyScouted: !!data.alreadyScouted,
      scoutSector: data.scoutSector || data.sector || null,
      proof: data.proof || {},
      recordedAt: new Date().toISOString(),
    };
    state.expeditionSelectedCellId = String(data.revealedCellId || safeCellId);
    const target = expeditionCommandHintTarget(model, 'scout_sector', (command) => (
      (Array.isArray(command.targetCellIds) ? command.targetCellIds : [])
        .map((targetCellId) => String(targetCellId || ''))
        .includes(safeCellId)
    ));
    if (target.unit?.unitId) state.expeditionSelectedUnitId = target.unit.unitId;
    setExpeditionCommandOutcomeFeedback({
      commandId: 'scout_sector',
      unitId: target.unit?.unitId || state.expeditionSelectedUnitId,
      unitType: target.unit?.unitType || 'scout',
      cellId: data.revealedCellId || safeCellId,
      sourceCellId: data.scoutSector?.sourceCellId || data.sector?.sourceCellId || data.proof?.sourceCellId || '',
      receiptId: data.scoutSector?.scoutId || data.sector?.scoutId || data.eventPacket?.packetId || '',
      receiptKind: data.eventPacket?.packetId ? 'scout_sector_event_packet' : 'scout_sector_receipt',
    });
    await loadState();
    toast(data.alreadyScouted ? 'Sector already known.' : 'Sector scouted.');
  }

  async function doMoveExpeditionUnit(unitId, targetCellId) {
    const safeUnitId = String(unitId || '').trim();
    const safeTargetCellId = String(targetCellId || '').trim();
    if (!safeUnitId || !safeTargetCellId) return;
    const bundle = state.bundle || {};
    const model = expeditionMapModel(bundle);
    const unit = expeditionUnits(model).find((entry) => String(entry.unitId || '') === safeUnitId);
    const targetCell = expeditionCells(model).find((entry) => String(entry.cellId || '') === safeTargetCellId);
    const allowed = expeditionUnitMoveTargets(unit, model).some((entry) => String(entry.cellId || '') === safeTargetCellId);
    if (!unit || !targetCell || !allowed) {
      return toast('Scout movement only targets adjacent discovered or known map cells.', 'danger');
    }
    state.expeditionUnitMovePendingId = `${safeUnitId}:${safeTargetCellId}`;
    renderExpeditionMap(bundle);
    const { data } = await api(API.moveExpeditionUnit, 'POST', {
      plotId: state.plotId,
      unitId: safeUnitId,
      targetCellId: safeTargetCellId,
      actor: 'HUMAN',
      idempotencyKey: expeditionUnitMoveIdempotencyKey(bundle, model, unit, targetCell),
    });
    state.expeditionUnitMovePendingId = '';
    if (!data.ok) {
      renderExpeditionMap(state.bundle || {});
      return toast(data.error?.message || 'Could not move that unit.', 'danger');
    }
    state.expeditionSelectedUnitId = safeUnitId;
    state.expeditionSelectedCellId = String(data.targetCellId || safeTargetCellId);
    setExpeditionCommandOutcomeFeedback({
      commandId: 'move_unit',
      unitId: safeUnitId,
      unitType: unit.unitType,
      cellId: data.targetCellId || data.move?.targetCellId || data.movement?.targetCellId || safeTargetCellId,
      sourceCellId: data.sourceCellId || data.move?.sourceCellId || data.movement?.sourceCellId || unit.cellId || '',
      receiptId: data.move?.moveId || data.movement?.moveId || '',
      receiptKind: 'expedition_unit_move_receipt',
    });
    await loadState();
    toast(data.alreadyMoved ? 'Scout is already there.' : 'Scout moved.');
  }

  async function doInspectCivicProject(projectId) {
    const safeProjectId = String(projectId || '').trim();
    if (!safeProjectId) return;
    state.civicProjectInspectionPendingId = safeProjectId;
    renderCivicOperations(state.bundle || {});
    const { data } = await api(API.inspectCivicProject, 'POST', {
      plotId: state.plotId,
      projectId: safeProjectId,
      inspectionType: 'baseline_readiness',
      note: 'Human baseline readiness inspection from the Founders Plot Civic Operations board.',
      actor: 'HUMAN',
      idempotencyKey: idem(`inspect-civic-project-${safeTestId(safeProjectId)}`),
    });
    state.civicProjectInspectionPendingId = '';
    if (!data.ok) {
      renderCivicOperations(state.bundle || {});
      return toast(data.error?.message || 'Could not inspect civic project.', 'danger');
    }
    toast(data.alreadyInspected ? 'Inspection receipt already recorded.' : 'Inspection receipt recorded.');
    await loadState();
  }

  async function doCreateCivicProposal(form) {
    const fd = new FormData(form);
    const title = String(fd.get('title') || '').trim();
    const summary = String(fd.get('summary') || '').trim();
    const category = String(fd.get('category') || 'coordination').trim();
    const status = String(fd.get('status') || 'DRAFT').trim().toUpperCase();
    const reviewNote = String(fd.get('reviewNote') || '').trim();
    if (!title || !summary) {
      return toast('Civic proposal records require a title and summary.', 'danger');
    }
    state.civicProposalPending = true;
    renderCivicProposals(state.bundle || {});
    const { data } = await api(API.civicProposals, 'POST', {
      plotId: state.plotId,
      title,
      category,
      summary,
      status,
      reviewNote,
      relatedPlotIds: [],
      actor: 'HUMAN',
      idempotencyKey: idem(`civic-proposal-${safeTestId(title).slice(0, 48)}`),
    });
    state.civicProposalPending = false;
    if (!data.ok) {
      renderCivicProposals(state.bundle || {});
      return toast(data.error?.message || 'Could not create civic proposal record.', 'danger');
    }
    toast('Civic proposal record created.');
    resetFormDraft(form, 'civicProposalDraft');
    await loadState();
  }

  function applyLocalOverlayPreview(packId) {
    const safePackId = String(packId || '').trim();
    const bundle = state.bundle || {};
    const pack = overlayPackById(bundle, safePackId);
    if (!pack) {
      toast('Choose a stored overlay pack first.', 'danger');
      return;
    }
    state.overlayAppliedPackId = safePackId;
    state.overlayPreviewSelectionId = safePackId;
    storeOverlayPackId(bundle.plotId || state.plotId, safePackId);
    renderWorldGrid(bundle);
    renderOverlayPacks(bundle);
    toast('Local overlay preview applied.');
  }

  function clearLocalOverlayPreview() {
    const bundle = state.bundle || {};
    state.overlayAppliedPackId = '';
    storeOverlayPackId(bundle.plotId || state.plotId, '');
    renderWorldGrid(bundle);
    renderOverlayPacks(bundle);
    toast('Local overlay preview cleared.');
  }

  async function doCreateOverlayPack(form) {
    const fd = new FormData(form);
    const sourceProposalId = String(fd.get('sourceProposalId') || '').trim();
    const title = String(fd.get('title') || '').trim();
    const theme = String(fd.get('theme') || 'civic').trim() || 'civic';
    const status = String(fd.get('status') || 'DRAFT').trim().toUpperCase();
    const summary = String(fd.get('summary') || '').trim();
    const prompt = String(fd.get('prompt') || '').trim();
    if (!sourceProposalId || !title || !summary) {
      return toast('Overlay records require a reviewed proposal, title, and summary.', 'danger');
    }
    state.overlayPackPending = true;
    renderOverlayPacks(state.bundle || {});
    const { data } = await api(API.overlayPacks, 'POST', {
      plotId: state.plotId,
      sourceProposalId,
      title,
      theme,
      summary,
      status,
      targetSurfaceIds: ['progression_atlas', 'world_grid'],
      targetNodeIds: ['generated_universe.overlay_pack_records', 'world_grid.read_model'],
      displayHints: {
        labels: { generated_universe: title },
        notes: summary,
        colorway: theme,
      },
      prompt,
      provenance: {
        source: 'founders_plot_overlay_pack_ui',
        provider: 'none',
        model: 'none',
      },
      actor: 'HUMAN',
      idempotencyKey: idem(`overlay-pack-${safeTestId(title).slice(0, 48)}`),
    });
    state.overlayPackPending = false;
    if (!data.ok) {
      renderOverlayPacks(state.bundle || {});
      return toast(data.error?.message || 'Could not create overlay record.', 'danger');
    }
    toast('Overlay record created.');
    resetFormDraft(form, 'overlayPackDraft');
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

  async function doClaimReward(rewardId) {
    const safeRewardId = String(rewardId || '');
    if (!safeRewardId) return;
    state.rewardClaimPendingId = safeRewardId;
    renderRewards(state.bundle || {});
    const { data } = await api(API.reward, 'POST', {
      plotId: state.plotId,
      rewardId: safeRewardId,
      actor: 'HUMAN',
      idempotencyKey: idem(`claim-reward-${safeTestId(safeRewardId)}`),
    });
    state.rewardClaimPendingId = '';
    if (!data.ok) {
      renderRewards(state.bundle || {});
      return toast(data.error?.message || 'Could not claim reward.', 'danger');
    }
    toast('Reward claimed.');
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

  function initialAtlasParams() {
    try {
      return new URLSearchParams(window.location.search || '');
    } catch (_) {
      return new URLSearchParams();
    }
  }

  function atlasUrl(strategyKey = '') {
    const params = new URLSearchParams();
    params.set('embed', '1');
    params.set('surface', 'founders-plot');
    const safeStrategy = String(strategyKey || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    if (safeStrategy) params.set('strategyKey', safeStrategy);
    return `/progression-atlas?${params.toString()}`;
  }

  function openProgressionAtlas(strategyKey = '') {
    if (!els.atlasBackdrop || !els.atlasFrame) {
      window.location.assign(atlasUrl(strategyKey));
      return;
    }
    const nextSrc = atlasUrl(strategyKey);
    if (!els.atlasFrame.src || !els.atlasFrame.src.endsWith(nextSrc)) {
      els.atlasFrame.src = nextSrc;
    }
    els.atlasBackdrop.hidden = false;
    els.atlasBackdrop.setAttribute('aria-hidden', 'false');
    document.body.classList.add('fp-atlas-open');
  }

  function closeProgressionAtlas() {
    if (!els.atlasBackdrop) return;
    els.atlasBackdrop.hidden = true;
    els.atlasBackdrop.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('fp-atlas-open');
  }

  function maybeOpenInitialAtlas() {
    const params = initialAtlasParams();
    const shouldOpen = params.get('atlas') === '1' || params.get('progressionAtlas') === '1';
    if (!shouldOpen) return;
    openProgressionAtlas(params.get('strategyKey') || '');
  }

  function handleExpeditionMapSelect(ev) {
    const cellId = String(ev?.detail?.cellId || '').trim();
    if (!cellId) return;
    const model = expeditionMapModel(state.bundle || {});
    const exists = expeditionCells(model).some((cell) => String(cell.cellId || '') === cellId);
    if (!exists) return;
    clearExpeditionCommandPreview();
    state.expeditionSelectedCellId = cellId;
    renderExpeditionMap(state.bundle || {});
  }

  function handleExpeditionUnitSelect(ev) {
    const unitId = String(ev?.detail?.unitId || '').trim();
    const cellId = String(ev?.detail?.cellId || '').trim();
    if (!unitId) return;
    const model = expeditionMapModel(state.bundle || {});
    const unit = expeditionUnits(model).find((entry) => String(entry.unitId || '') === unitId);
    if (!unit) return;
    clearExpeditionCommandPreview();
    selectExpeditionUnit(unit, model, cellId || unit.cellId);
    renderExpeditionMap(state.bundle || {});
  }

  function handleExpeditionCommandTargetPreview(ev) {
    const preview = expeditionCommandPreviewFromDetail(ev?.detail || {});
    if (!preview) {
      clearExpeditionCommandPreview();
      renderExpeditionMap(state.bundle || {});
      return toast('That map command target is not valid for the current read model.', 'danger');
    }
    state.expeditionSelectedUnitId = preview.unitId;
    state.expeditionSelectedCellId = preview.cellId;
    state.expeditionCommandPreview = preview;
    renderExpeditionMap(state.bundle || {});
  }

  // --- Boot -----------------------------------------------------------------

  function bind() {
    window.addEventListener('founders-plot-scene-pick', handleScenePick);
    window.addEventListener('founders-plot-expedition-map-select', handleExpeditionMapSelect);
    window.addEventListener('founders-plot-expedition-unit-select', handleExpeditionUnitSelect);
    window.addEventListener('founders-plot-expedition-command-target-preview', handleExpeditionCommandTargetPreview);
    if (els.policyForm) els.policyForm.addEventListener('submit', savePolicy);
    if (els.drawerOpen) els.drawerOpen.addEventListener('click', () => toggleDrawer(true));
    if (els.drawerClose) els.drawerClose.addEventListener('click', () => acknowledgeRecap());
    if (els.openAtlas) els.openAtlas.addEventListener('click', () => openProgressionAtlas());
    if (els.atlasClose) els.atlasClose.addEventListener('click', () => closeProgressionAtlas());
    if (els.atlasBackdrop) {
      els.atlasBackdrop.addEventListener('click', (ev) => {
        if (ev.target === els.atlasBackdrop) closeProgressionAtlas();
      });
    }
    if (els.foremanAct) els.foremanAct.addEventListener('click', () => toast('Foreman is thinking…', 'info'));
    if (els.foremanToggle) els.foremanToggle.addEventListener('click', () => {
      const body = els.foremanBody;
      if (!body) return;
      const hidden = body.classList.toggle('fp-panel__body--hidden');
      els.foremanToggle.textContent = hidden ? 'Show' : 'Hide';
      els.foremanToggle.setAttribute('aria-expanded', hidden ? 'false' : 'true');
    });
  }

  window.__foundersPlotTest = {
    getState: () => state.bundle,
    getScene: () => state.scene,
    getVisualActors: () => state.scene?.actors || [],
    getThreeSceneInfo: () => {
      const renderer = window.FoundersPlotThreeRenderer;
      if (renderer && typeof renderer.getPlotSceneInfo === 'function' && els.stage) {
        return renderer.getPlotSceneInfo(els.stage) || state.threeInfo || {};
      }
      return state.threeInfo || {};
    },
    getExpeditionMapInfo: () => {
      const renderer = window.FoundersPlotThreeRenderer;
      const host = document.querySelector('[data-testid="fp-expedition-three-host"]');
      if (renderer && typeof renderer.getExpeditionMapInfo === 'function' && host) {
        return renderer.getExpeditionMapInfo(host) || state.expeditionMapThreeInfo || {};
      }
      return state.expeditionMapThreeInfo || {};
    },
    getSelectedExpeditionCellId: () => state.expeditionSelectedCellId
  };

  function start() {
    bind();
    loadState().catch((err) => toast(String(err), 'danger'));
    maybeOpenInitialAtlas();
    // Poll every 5s to advance simulation + reflect job completions.
    state.pollTimer = setInterval(() => { loadState().catch(() => {}); }, 5000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
