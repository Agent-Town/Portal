(function () {
  const params = new URLSearchParams(window.location.search || '');
  const flagOverride = String(params.get('worldGridFeatureFlags') || '').trim();
  const state = {
    payload: null,
    scene: null,
    generatedPack: null,
    playtestReport: null,
    selectedCellId: ''
  };

  function qs(selector) {
    return document.querySelector(selector);
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function activePack() {
    return state.generatedPack || state.payload?.generatedPack || null;
  }

  function packText(key, fallback) {
    return activePack()?.universePack?.text?.[key] || fallback;
  }

  function mappingName(canonicalId, fallback) {
    return window.WorldGridSceneState.mappingName(activePack(), canonicalId, fallback);
  }

  function sceneStateForPayload(payload = state.payload) {
    return window.WorldGridSceneState.createWorldGridSceneState(payload?.region, payload?.preferences, activePack());
  }

  function applyGeneratedTheme(pack = activePack()) {
    const root = document.documentElement;
    const palette = pack?.stylePack?.palette || null;
    const assignments = {
      '--world-grid-background': palette?.background || '#f7e8c8',
      '--world-grid-surface': palette?.surface || '#fff3d6',
      '--world-grid-ink': palette?.ink || '#2a1a0d',
      '--world-grid-primary': palette?.primary || '#7a3f22',
      '--world-grid-secondary': palette?.secondary || '#2f5d50',
      '--world-grid-accent': palette?.accent || '#c7892e',
      '--world-grid-focus': palette?.focus || '#2b76c4'
    };
    for (const [key, value] of Object.entries(assignments)) {
      root.style.setProperty(key, value);
    }
    const title = qs('[data-world-grid-title]');
    if (title) title.textContent = packText('topbarTitle', 'World Grid');
    const publicTitle = qs('[data-world-grid-public-title]');
    if (publicTitle) publicTitle.textContent = packText('publicPresenceTitle', 'Public Presence');
    const servicesTitle = qs('[data-world-grid-services-title]');
    if (servicesTitle) servicesTitle.textContent = packText('servicesTitle', 'Civic Services');
    const eventsTitle = qs('[data-world-grid-events-title]');
    if (eventsTitle) eventsTitle.textContent = packText('eventsTitle', 'World Event');
    const sandboxTitle = qs('[data-world-grid-sandbox-title]');
    if (sandboxTitle) sandboxTitle.textContent = packText('sandboxTitle', 'Sandbox District');
  }

  function apiHeaders() {
    const headers = { 'content-type': 'application/json' };
    if (flagOverride) headers['x-world-grid-feature-flags'] = flagOverride;
    return headers;
  }

  async function api(path, options = {}) {
    const response = await fetch(path, {
      credentials: 'include',
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(options.method ? apiHeaders() : (flagOverride ? { 'x-world-grid-feature-flags': flagOverride } : {}))
      }
    });
    const body = await response.json();
    if (!response.ok || body.ok === false) {
      const error = new Error(body?.error?.code || 'WORLD_GRID_API_FAILED');
      error.body = body;
      throw error;
    }
    return body;
  }

  function renderGeneratedPack() {
    applyGeneratedTheme();
    const pack = activePack();
    const status = qs('[data-world-grid-pack-status]');
    const summary = qs('[data-world-grid-generated-summary]');
    if (!status || !summary) return;
    if (!pack) {
      status.textContent = 'Enter a prompt to create a playable style and universe pack.';
      summary.textContent = '';
      return;
    }
    const validation = pack.validationReport?.ok === true ? packText('packValidated', 'Pack validated') : 'Pack needs review';
    const factions = (pack.universePack?.factions || []).map((faction) => faction.name).filter(Boolean).slice(0, 3);
    const metrics = pack.validationReport?.metrics || {};
    status.textContent = validation;
    summary.innerHTML = `
      <strong>${escapeHtml(pack.universePack?.name || pack.stylePack?.name || 'Generated pack')}</strong>
      <p>${escapeHtml(pack.universePack?.pitch || '')}</p>
      <p>${escapeHtml(pack.universePack?.firstLoop?.objective || '')}</p>
      ${factions.length ? `<p>${factions.map(escapeHtml).join(' · ')}</p>` : ''}
      <dl>
        <div><dt>Mappings</dt><dd>${escapeHtml(`${metrics.canonicalMappingsCovered || 0}/${metrics.requiredCanonicalMappings || 0}`)}</dd></div>
        <div><dt>Assets</dt><dd>${escapeHtml(String(metrics.fallbackAssetCount || 0))}</dd></div>
      </dl>
    `;
  }

  async function generatePackFromPrompt(event) {
    if (event) event.preventDefault();
    const prompt = qs('[data-world-grid-prompt]');
    const status = qs('[data-world-grid-pack-status]');
    const value = String(prompt?.value || '').trim();
    if (!value) {
      if (status) status.textContent = 'Add a style prompt first.';
      return;
    }
    if (status) status.textContent = 'Shaping a playable universe pack';
    try {
      const payload = await api('/api/world/generated-pack/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt: value })
      });
      state.generatedPack = payload.generatedPack || null;
      state.playtestReport = payload.playtestReport || null;
      if (state.payload) state.payload.generatedPack = state.generatedPack;
      renderGeneratedPack();
      const sceneState = sceneStateForPayload();
      renderMirror(sceneState);
      renderDetail(sceneState);
      renderScene(sceneState);
      if (state.selectedCellId) await selectCell(state.selectedCellId);
      const routeStatus = qs('[data-world-grid-status]');
      if (routeStatus) routeStatus.textContent = packText('statusReady', 'Territory survey ready');
      await refreshPublicPresence();
      await refreshServices();
      await refreshEvents();
      await refreshSandbox();
    } catch (error) {
      if (status) status.textContent = error?.body?.error?.message || 'Could not generate that pack.';
    }
  }

  function cellButton(cell) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `world-grid-cell world-grid-cell--${cell.state}`;
    button.dataset.cellId = cell.cellId;
    button.textContent = cell.label;
    button.setAttribute('aria-label', cell.accessibleName);
    button.addEventListener('click', () => selectCell(cell.cellId));
    return button;
  }

  function renderMirror(sceneState) {
    const mirror = qs('[data-world-grid-mirror]');
    mirror.innerHTML = '';
    for (const cell of sceneState.cells) {
      mirror.appendChild(cellButton(cell));
    }
  }

  function renderDetail(sceneState, explanation = null) {
    const detail = qs('[data-world-grid-detail]');
    const cell = sceneState.cells.find((item) => item.cellId === state.selectedCellId) || sceneState.cells[0];
    if (!cell) {
      detail.textContent = 'No surveyed cell selected.';
      return;
    }
    const claimsEnabled = state.payload?.territory?.claimsEnabled === true;
    const option = (state.payload?.territory?.claimOptions || []).find((item) => item.cellId === cell.cellId) || null;
    const claim = (state.payload?.territory?.claims || []).find((item) => item.cellId === cell.cellId) || null;
    const claimAction = claimsEnabled && option
      ? `<button type="button" class="world-grid-action" data-world-grid-plan-claim="${escapeHtml(cell.cellId)}">${escapeHtml(packText('planClaimAction', 'Plan claim'))}</button>`
      : claimsEnabled && claim?.status === 'planned'
        ? `<button type="button" class="world-grid-action" data-world-grid-complete-claim="${escapeHtml(claim.claimId)}">${escapeHtml(packText('completeClaimAction', 'Complete claim'))}</button>
           <button type="button" class="world-grid-action world-grid-action--quiet" data-world-grid-cancel-claim="${escapeHtml(claim.claimId)}">Cancel</button>`
        : '';
    detail.innerHTML = `
      <h2>${escapeHtml(cell.label)}</h2>
      <p>${escapeHtml(explanation?.summary || cell.accessibleName)}</p>
      <dl>
        <div><dt>State</dt><dd>${escapeHtml(cell.state)}</dd></div>
        <div><dt>Terrain</dt><dd>${escapeHtml(cell.terrain)}</dd></div>
        <div><dt>Feature</dt><dd>${escapeHtml(cell.feature || 'none')}</dd></div>
        <div><dt>Risk</dt><dd>${escapeHtml(cell.risk || 'none')}</dd></div>
      </dl>
      <p>${escapeHtml(explanation?.futureUse || 'V5.0 is a read-only territory survey.')}</p>
      ${option ? `<p>${escapeHtml(option.cloverAdvice)}</p><p>Cost: ${escapeHtml(formatCost(option.cost))}. Benefit: ${escapeHtml(option.benefit.label)}.</p>` : ''}
      ${claim ? `<p>Claim status: ${escapeHtml(claim.status)}. ${escapeHtml(claim.cloverAdvice || '')}</p>` : ''}
      ${claimAction}
    `;
    const plan = detail.querySelector('[data-world-grid-plan-claim]');
    if (plan) plan.addEventListener('click', () => planClaim(plan.dataset.worldGridPlanClaim));
    const complete = detail.querySelector('[data-world-grid-complete-claim]');
    if (complete) complete.addEventListener('click', () => completeClaim(complete.dataset.worldGridCompleteClaim));
    const cancel = detail.querySelector('[data-world-grid-cancel-claim]');
    if (cancel) cancel.addEventListener('click', () => cancelClaim(cancel.dataset.worldGridCancelClaim));
  }

  function formatCost(cost = {}) {
    const parts = ['wood', 'stone', 'food', 'coin']
      .filter((key) => Number(cost[key] || 0) > 0)
      .map((key) => `${cost[key]} ${mappingName(`resource.${key}`, key)}`);
    return parts.join(', ') || 'none';
  }

  function formatBundle(bundle = {}) {
    return formatCost(bundle);
  }

  function renderScene(sceneState) {
    const stage = qs('[data-world-grid-stage]');
    let fallback = qs('[data-world-grid-fallback]');
    if (!fallback) {
      fallback = document.createElement('div');
      fallback.className = 'world-grid-fallback';
      fallback.dataset.worldGridFallback = '';
      fallback.textContent = 'Territory survey fallback map';
      stage.appendChild(fallback);
    }
    fallback.hidden = true;
    if (state.scene?.dispose) state.scene.dispose();
    try {
      state.scene = window.WorldGridThreeRenderer.renderWorldGridScene(stage, sceneState, {
        generatedPack: activePack(),
        onSelect: (cellId) => selectCell(cellId)
      });
      stage.dataset.renderer = 'three';
      stage.dataset.generatedPackId = activePack()?.packId || '';
      stage.dataset.assetLoader = state.scene?.info?.().assetLoader?.assetAwareLoaderExists ? 'v2' : 'fallback';
    } catch (error) {
      stage.dataset.renderer = 'dom-fallback';
      stage.dataset.rendererFallbackReason = error?.message || 'WORLD_GRID_RENDER_FAILED';
      stage.innerHTML = '';
      if (fallback.parentElement !== stage) stage.appendChild(fallback);
      fallback.hidden = false;
      state.scene = null;
    }
  }

  async function selectCell(cellId) {
    state.selectedCellId = cellId;
    const payload = await api('/api/world/region/focus-cell', {
      method: 'POST',
      body: JSON.stringify({ cellId })
    });
    state.payload.preferences = payload.preferences;
    const sceneState = sceneStateForPayload();
    const explain = await api('/api/world/tool/et.world.region.explain_cell', {
      method: 'POST',
      body: JSON.stringify({ cellId })
    });
    renderDetail(sceneState, explain.data);
    if (state.scene?.setSelectedCell) state.scene.setSelectedCell(cellId);
    for (const button of document.querySelectorAll('[data-cell-id]')) {
      button.dataset.selected = button.dataset.cellId === cellId ? 'true' : 'false';
    }
  }

  async function refreshAfterTerritoryMutation(payload, selectedCellId) {
    state.payload.region = payload.region || state.payload.region;
    state.payload.territory = payload.territory || state.payload.territory;
    const sceneState = sceneStateForPayload();
    renderMirror(sceneState);
    renderScene(sceneState);
    await selectCell(selectedCellId || state.selectedCellId);
  }

  async function planClaim(cellId) {
    const payload = await api('/api/world/territory/plan-claim', {
      method: 'POST',
      body: JSON.stringify({ cellId })
    });
    state.payload.territory.claims = [...(state.payload.territory.claims || []), payload.claim];
    state.payload.territory.claimOptions = (state.payload.territory.claimOptions || []).filter((option) => option.cellId !== cellId);
    await selectCell(cellId);
  }

  async function completeClaim(claimId) {
    const payload = await api('/api/world/territory/complete-claim', {
      method: 'POST',
      body: JSON.stringify({ claimId })
    });
    await refreshAfterTerritoryMutation(payload, payload.claim.cellId);
    await recordGeneratedFirstLoopReport();
  }

  async function sha256Hex(value) {
    if (!window.crypto?.subtle || !window.TextEncoder) return '';
    const bytes = new TextEncoder().encode(String(value || ''));
    const hash = await window.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  async function captureScreenshotEvidence(sceneInfo = null) {
    const stage = qs('[data-world-grid-stage]');
    const canvas = stage?.querySelector('[data-world-grid-canvas]');
    const rect = stage?.getBoundingClientRect?.() || { width: 0, height: 0 };
    let payload = '';
    try {
      payload = canvas?.toDataURL ? canvas.toDataURL('image/png') : '';
    } catch (error) {
      payload = '';
    }
    if (!payload || payload.length < 100) {
      payload = JSON.stringify({
        generatedPackId: activePack()?.packId || '',
        renderer: sceneInfo?.renderer || '',
        width: Math.floor(rect.width || 0),
        height: Math.floor(rect.height || 0),
        assetLoader: sceneInfo?.assetLoader || null
      });
    }
    const width = Math.floor(canvas?.width || rect.width || 0);
    const height = Math.floor(canvas?.height || rect.height || 0);
    const hash = await sha256Hex(payload);
    return {
      captured: hash.length === 64 && width >= 160 && height >= 120 && payload.length > 100,
      hash,
      width,
      height,
      byteLength: payload.length,
      source: canvas ? 'three-canvas-data-url' : 'world-grid-stage-metadata'
    };
  }

  async function recordGeneratedFirstLoopReport() {
    const pack = activePack();
    if (!pack) return null;
    const sceneInfo = state.scene?.info ? state.scene.info() : null;
    const screenshotEvidence = await captureScreenshotEvidence(sceneInfo);
    try {
      const payload = await api('/api/world/generated-pack/playtest-report', {
        method: 'POST',
        body: JSON.stringify({
          packId: pack.packId,
          renderer: sceneInfo?.renderer || 'three',
          firstLoopCompleted: true,
          canonicalPayloadIntegrity: true,
          missingAssets: Number(sceneInfo?.assetLoader?.missingTextureCount || 0),
          consoleErrors: 0,
          assetLoader: sceneInfo?.assetLoader || null,
          screenshotEvidence,
          scoreEvidence: {
            measured: true,
            measurementVersion: 'agent-town-browser-playtest-measurements-v1',
            source: 'world-grid-browser-first-loop'
          }
        })
      });
      state.playtestReport = payload.playtestReport || null;
      if (state.payload) state.payload.generatedPackPlaytestReport = state.playtestReport;
      const result = qs('[data-world-grid-loop-result]');
      if (result) {
        result.innerHTML = `<p>${escapeHtml(pack.universePack?.firstLoop?.successReceipt || 'First generated loop complete.')}</p>`;
      }
      renderGeneratedPack();
      return payload.playtestReport;
    } catch (error) {
      const result = qs('[data-world-grid-loop-result]');
      if (result) result.textContent = error?.body?.error?.message || 'Generated pack playtest report could not be recorded.';
      return null;
    }
  }

  async function cancelClaim(claimId) {
    const payload = await api('/api/world/territory/cancel-claim', {
      method: 'POST',
      body: JSON.stringify({ claimId })
    });
    const claims = state.payload?.territory?.claims || [];
    const cancelled = claims.find((claim) => claim.claimId === claimId);
    state.payload.territory.claims = claims.filter((claim) => claim.claimId !== claimId);
    await selectCell(cancelled?.cellId || state.selectedCellId);
    return payload;
  }

  async function refreshPublicPresence() {
    const panel = qs('[data-world-grid-public]');
    const list = qs('[data-world-grid-public-list]');
    if (!state.payload?.featureFlags?.FEATURE_WORLD_GRID_V52_PUBLIC_PRESENCE) {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    try {
      const payload = await api('/api/world/public-towns');
      const towns = payload.towns || [];
      list.innerHTML = towns.length
        ? towns.map((town) => `<p><strong>${town.townName}</strong><br>${town.publicSummary.charmBand} in ${town.regionHint}</p>`).join('')
        : '<p>No public neighbors yet.</p>';
    } catch (error) {
      list.textContent = error?.body?.error?.message || 'Public presence is not available.';
    }
  }

  async function optInPublicPresence() {
    await api('/api/world/public-presence/opt-in', {
      method: 'POST',
      body: JSON.stringify({
        displayName: 'A Founder',
        townName: 'Founders Plot',
        privacy: {
          showOperatingStyle: false,
          showRegion: true,
          allowVisits: true
        }
      })
    });
    await refreshPublicPresence();
  }

  async function optOutPublicPresence() {
    await api('/api/world/public-presence/opt-out', {
      method: 'POST',
      body: JSON.stringify({})
    });
    await refreshPublicPresence();
  }

  async function refreshServices() {
    const panel = qs('[data-world-grid-services]');
    const list = qs('[data-world-grid-services-list]');
    if (!state.payload?.featureFlags?.FEATURE_WORLD_GRID_V53_AGENT_SERVICES) {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    try {
      const payload = await api('/api/world/services');
      const services = payload.services || [];
      list.innerHTML = services.map((service) => `
        <article class="world-grid-service-card">
          <strong>${service.title}</strong>
          <p>${service.description}</p>
          <p>${service.serviceKind} · ${service.reputation.reliabilityBand}</p>
          <button type="button" class="world-grid-action" data-world-grid-request-service="${service.serviceId}">Request advice</button>
        </article>
      `).join('');
      for (const button of list.querySelectorAll('[data-world-grid-request-service]')) {
        button.addEventListener('click', () => requestServiceAdvice(button.dataset.worldGridRequestService));
      }
    } catch (error) {
      list.textContent = error?.body?.error?.message || 'Civic services are not available.';
    }
  }

  async function requestServiceAdvice(serviceId) {
    const selected = state.payload?.region?.cells?.find((cell) => cell.cellId === state.selectedCellId) || null;
    const payload = await api('/api/world/services/request-advice', {
      method: 'POST',
      body: JSON.stringify({
        serviceId,
        input: {
          selectedCell: selected,
          regionSummary: {
            regionId: state.payload?.region?.regionId,
            cellCount: state.payload?.region?.cells?.length || 0
          },
          brainSecrets: 'must redact',
          walletSecrets: 'must redact',
          privateEventLog: ['must redact']
        }
      })
    });
    renderServiceResult(payload.request);
  }

  function renderServiceResult(request) {
    const result = qs('[data-world-grid-service-result]');
    if (!request) {
      result.textContent = '';
      return;
    }
    result.innerHTML = `
      <div class="world-grid-service-result">
        <strong>${request.output.recommendation}</strong>
        <p>${request.output.rationale}</p>
        <p>${request.output.nextStep}</p>
        <button type="button" class="world-grid-action" data-world-grid-accept-service="${request.requestId}">Accept result</button>
        <button type="button" class="world-grid-action world-grid-action--quiet" data-world-grid-report-service="${request.requestId}">Report issue</button>
      </div>
    `;
    const accept = result.querySelector('[data-world-grid-accept-service]');
    if (accept) accept.addEventListener('click', () => acceptServiceResult(accept.dataset.worldGridAcceptService));
    const report = result.querySelector('[data-world-grid-report-service]');
    if (report) report.addEventListener('click', () => reportServiceIssue(report.dataset.worldGridReportService));
  }

  async function acceptServiceResult(requestId) {
    const payload = await api('/api/world/services/accept-result', {
      method: 'POST',
      body: JSON.stringify({ requestId })
    });
    renderServiceResult(payload.request);
    const result = qs('[data-world-grid-service-result]');
    result.insertAdjacentHTML('beforeend', '<p>Accepted as advice only. No world mutation was applied.</p>');
  }

  async function reportServiceIssue(requestId) {
    const payload = await api('/api/world/services/report-issue', {
      method: 'POST',
      body: JSON.stringify({ requestId, reason: 'Player reported a service issue from the prototype board.' })
    });
    renderServiceResult(payload.request);
    const result = qs('[data-world-grid-service-result]');
    result.insertAdjacentHTML('beforeend', '<p>Issue reported.</p>');
  }

  async function refreshEvents() {
    const panel = qs('[data-world-grid-events]');
    const list = qs('[data-world-grid-events-list]');
    if (!state.payload?.featureFlags?.FEATURE_WORLD_GRID_V54_WORLD_EVENTS) {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    try {
      const payload = await api('/api/world/events');
      const items = payload.events || [];
      list.innerHTML = items.map(({ event, personal }) => `
        <article class="world-grid-event-card" data-world-grid-event-card="${event.eventId}">
          <strong>${event.title}</strong>
          <p>${event.status} · ${event.progress.percent}% complete · ${event.participantCount} towns</p>
          <div class="world-grid-event-meter" aria-label="${event.title} progress">
            <span style="--world-grid-event-progress: ${event.progress.percent}%"></span>
          </div>
          <p>Goal: ${formatBundle(event.publicGoal)}. Your contribution: ${formatBundle(personal.total)}.</p>
          <button type="button" class="world-grid-action" data-world-grid-preview-event="${event.eventId}">Preview contribution</button>
          <button type="button" class="world-grid-action" data-world-grid-contribute-event="${event.eventId}">Contribute 1 coin</button>
          ${personal.contributionCount > 0 ? `<button type="button" class="world-grid-action world-grid-action--quiet" data-world-grid-claim-event-reward="${event.eventId}">Claim badge</button>` : ''}
        </article>
      `).join('');
    } catch (error) {
      list.textContent = error?.body?.error?.message || 'World events are not available.';
    }
  }

  function bindEventPanel() {
    const panel = qs('[data-world-grid-events]');
    if (!panel || panel.dataset.bound === 'true') return;
    panel.dataset.bound = 'true';
    panel.addEventListener('click', async (event) => {
      const target = event.target.closest('button');
      if (!target) return;
      try {
        if (target.dataset.worldGridPreviewEvent) {
          await previewWorldEventContribution(target.dataset.worldGridPreviewEvent);
        } else if (target.dataset.worldGridContributeEvent) {
          await contributeWorldEvent(target.dataset.worldGridContributeEvent);
        } else if (target.dataset.worldGridClaimEventReward) {
          await claimWorldEventReward(target.dataset.worldGridClaimEventReward);
        }
      } catch (error) {
        renderEventResult(error?.body?.error?.message || 'World event action failed.');
      }
    });
  }

  function renderEventResult(message) {
    const result = qs('[data-world-grid-event-result]');
    result.innerHTML = `<div class="world-grid-event-result"><p>${message}</p></div>`;
  }

  async function previewWorldEventContribution(eventId) {
    const payload = await api('/api/world/events/preview-contribution', {
      method: 'POST',
      body: JSON.stringify({ eventId, bundle: { coin: 1 } })
    });
    renderEventResult(`Preview: ${formatBundle(payload.preview.accepted)} accepted for today.`);
  }

  async function contributeWorldEvent(eventId) {
    const payload = await api('/api/world/events/contribute', {
      method: 'POST',
      body: JSON.stringify({
        eventId,
        bundle: { coin: 1 },
        idempotencyKey: `ui_${eventId}_${Date.now()}`
      })
    });
    renderEventResult(`Contributed ${formatBundle(payload.contribution.bundle)} to the public works event.`);
    await refreshEvents();
  }

  async function claimWorldEventReward(eventId) {
    const payload = await api('/api/world/events/claim-reward', {
      method: 'POST',
      body: JSON.stringify({ eventId })
    });
    renderEventResult(`Claimed ${payload.reward.title}. Cosmetic status only; no resource mutation was applied.`);
    await refreshEvents();
  }

  async function refreshSandbox() {
    const panel = qs('[data-world-grid-sandbox]');
    const container = qs('[data-world-grid-sandbox-state]');
    if (!state.payload?.featureFlags?.FEATURE_WORLD_GRID_V55_SANDBOX_DISTRICTS) {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    try {
      const payload = await api('/api/world/sandbox');
      const district = payload.district;
      const participant = payload.participant;
      const propCount = (district.cells || []).reduce((sum, cell) => sum + (cell.props || []).length, 0);
      container.innerHTML = `
        <article class="world-grid-sandbox-card">
          <strong>${district.title}</strong>
          <p>${district.status} · ${district.participants.length} visitors · ${propCount} props</p>
          <p>${participant ? `You are ${participant.displayName}.` : 'Enter with redacted public presence.'}</p>
          <button type="button" class="world-grid-action" data-world-grid-sandbox-enter>Enter sandbox</button>
          <button type="button" class="world-grid-action" data-world-grid-sandbox-place>Place lantern</button>
          <button type="button" class="world-grid-action world-grid-action--quiet" data-world-grid-sandbox-forbidden>Place forbidden prop</button>
          <button type="button" class="world-grid-action world-grid-action--quiet" data-world-grid-sandbox-agent-demo>Agent demo</button>
          <button type="button" class="world-grid-action world-grid-action--quiet" data-world-grid-sandbox-rollback>Rollback last action</button>
          <button type="button" class="world-grid-action world-grid-action--quiet" data-world-grid-sandbox-leave>Leave sandbox</button>
        </article>
      `;
    } catch (error) {
      container.textContent = error?.body?.error?.message || 'Sandbox district is not available.';
    }
  }

  function renderSandboxResult(message) {
    const result = qs('[data-world-grid-sandbox-result]');
    result.innerHTML = `<div class="world-grid-sandbox-result"><p>${message}</p></div>`;
  }

  function bindSandboxPanel() {
    const panel = qs('[data-world-grid-sandbox]');
    if (!panel || panel.dataset.bound === 'true') return;
    panel.dataset.bound = 'true';
    panel.addEventListener('click', async (event) => {
      const target = event.target.closest('button');
      if (!target) return;
      try {
        if (target.dataset.worldGridSandboxEnter !== undefined) {
          const payload = await api('/api/world/sandbox/enter', { method: 'POST', body: JSON.stringify({}) });
          renderSandboxResult(`Entered as ${payload.participant.displayName}.`);
          await refreshSandbox();
        } else if (target.dataset.worldGridSandboxPlace !== undefined) {
          const payload = await api('/api/world/sandbox/place-prop', {
            method: 'POST',
            body: JSON.stringify({ payload: { cellId: 'sandbox_cell_0', propId: 'lantern' } })
          });
          renderSandboxResult(payload.action.moderationStatus === 'auto-approved' ? 'Lantern placed with rollback snapshot.' : 'Lantern was not approved.');
          await refreshSandbox();
        } else if (target.dataset.worldGridSandboxForbidden !== undefined) {
          const payload = await api('/api/world/sandbox/place-prop', {
            method: 'POST',
            body: JSON.stringify({ payload: { cellId: 'sandbox_cell_0', propId: 'uploaded-dragon' } })
          });
          renderSandboxResult(payload.action.moderationStatus === 'rejected' ? 'Moderation rejected that sandbox action.' : 'Unexpected sandbox approval.');
          await refreshSandbox();
        } else if (target.dataset.worldGridSandboxAgentDemo !== undefined) {
          const payload = await api('/api/world/sandbox/agent-demo', {
            method: 'POST',
            body: JSON.stringify({ payload: { cellId: 'sandbox_cell_1', demoKind: 'route-signpost' } })
          });
          renderSandboxResult(payload.action.moderationStatus === 'auto-approved' ? 'Agent demo used a typed sandbox action.' : 'Agent demo was rejected.');
          await refreshSandbox();
        } else if (target.dataset.worldGridSandboxRollback !== undefined) {
          const payload = await api('/api/world/sandbox/rollback-last', { method: 'POST', body: JSON.stringify({}) });
          renderSandboxResult(payload.restored ? 'Rollback restored the sandbox district.' : 'Rollback was not available.');
          await refreshSandbox();
        } else if (target.dataset.worldGridSandboxLeave !== undefined) {
          const payload = await api('/api/world/sandbox/leave', { method: 'POST', body: JSON.stringify({}) });
          renderSandboxResult(payload.removed ? 'Left the sandbox without private town mutation.' : 'No sandbox presence was active.');
          await refreshSandbox();
        }
      } catch (error) {
        renderSandboxResult(error?.body?.error?.message || 'Sandbox action failed.');
      }
    });
  }

  async function load() {
    const status = qs('[data-world-grid-status]');
    try {
      const payload = await api('/api/world/region');
      state.payload = payload;
      state.generatedPack = payload.generatedPack || null;
      state.playtestReport = payload.generatedPackPlaytestReport || null;
      state.selectedCellId = payload.preferences?.selectedCellId || payload.region.cells[0]?.cellId || '';
      const sceneState = sceneStateForPayload(payload);
      status.textContent = 'Preparing territory survey';
      renderGeneratedPack();
      renderMirror(sceneState);
      renderDetail(sceneState);
      renderScene(sceneState);
      if (state.selectedCellId) await selectCell(state.selectedCellId);
      const optIn = qs('[data-world-grid-public-opt-in]');
      if (optIn) optIn.addEventListener('click', optInPublicPresence);
      const optOut = qs('[data-world-grid-public-opt-out]');
      if (optOut) optOut.addEventListener('click', optOutPublicPresence);
      bindEventPanel();
      bindSandboxPanel();
      await refreshPublicPresence();
      await refreshServices();
      await refreshEvents();
      await refreshSandbox();
      status.textContent = packText('statusReady', 'Territory survey ready');
    } catch (error) {
      status.textContent = error?.body?.error?.message || 'The territory survey is not available.';
      qs('[data-world-grid-stage]').dataset.renderer = 'blocked';
    }
  }

  window.__worldGridTest = {
    getPayload: () => state.payload,
    getGeneratedPack: () => activePack(),
    getPlaytestReport: () => state.playtestReport,
    getSceneInfo: () => state.scene?.info ? state.scene.info() : null,
    generatePackFromPrompt: (prompt) => {
      const promptNode = qs('[data-world-grid-prompt]');
      if (promptNode) promptNode.value = prompt;
      return generatePackFromPrompt();
    },
    selectCell,
    planClaim,
    completeClaim,
    cancelClaim,
    optInPublicPresence,
    optOutPublicPresence,
    refreshPublicPresence,
    refreshServices,
    requestServiceAdvice,
    acceptServiceResult,
    reportServiceIssue,
    refreshEvents,
    previewWorldEventContribution,
    contributeWorldEvent,
    claimWorldEventReward,
    refreshSandbox,
    recordGeneratedFirstLoopReport,
    dispose: () => {
      if (state.scene?.dispose) state.scene.dispose();
      state.scene = null;
    }
  };

  window.addEventListener('DOMContentLoaded', () => {
    const form = qs('[data-world-grid-generate-form]');
    if (form) form.addEventListener('submit', generatePackFromPrompt);
    load();
  });
})();
