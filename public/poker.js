(function () {
  const titleEl = document.getElementById('pokerTitle');
  const subtitleEl = document.getElementById('pokerSubtitle');
  const statusEl = document.getElementById('pokerStatus');
  const contentEl = document.getElementById('pokerContent');
  const isEmbedded = new URLSearchParams(window.location.search).get('embed') === '1';
  const POKER_ADMIN_TOKEN_KEY = 'poker.adminToken';
  let countdownTimer = null;
  let liveRefreshTimer = null;
  let liveTableStream = null;
  let liveTableStreamKey = '';
  let liveTableRefreshInFlight = false;
  let pokerRuntimeGatewayPromise = null;

  function setTitle(title, subtitle) {
    if (titleEl) titleEl.textContent = title;
    if (subtitleEl) subtitleEl.textContent = subtitle;
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text || '';
  }

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function getRouteSearchParams() {
    return new URLSearchParams(window.location.search || '');
  }

  function buildPokerHref(path, extraParams = {}) {
    let parsed;
    try {
      parsed = new URL(path, window.location.origin);
    } catch {
      return String(path || '/poker');
    }
    const currentParams = getRouteSearchParams();
    const asOf = String(currentParams.get('asOf') || '').trim();
    if (asOf && !parsed.searchParams.has('asOf')) {
      parsed.searchParams.set('asOf', asOf);
    }
    for (const [key, rawValue] of Object.entries(extraParams || {})) {
      const value = rawValue == null ? '' : String(rawValue).trim();
      if (!key) continue;
      if (!value) {
        parsed.searchParams.delete(key);
        continue;
      }
      parsed.searchParams.set(key, value);
    }
    if (isEmbedded) {
      parsed.searchParams.set('embed', '1');
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  }

  function getParentRuntimeGateway() {
    try {
      if (window.parent && window.parent !== window && window.parent.location?.origin === window.location.origin) {
        return window.parent.AgentTownRuntimeGateway || null;
      }
    } catch {
      // ignore cross-window access failures
    }
    return null;
  }

  async function getPokerRuntimeGateway() {
    const parentGateway = getParentRuntimeGateway();
    if (parentGateway) return parentGateway;
    if (window.__AGENT_TOWN_POKER_GATEWAY__) return window.__AGENT_TOWN_POKER_GATEWAY__;
    if (!pokerRuntimeGatewayPromise) {
      pokerRuntimeGatewayPromise = import('/openclaw-lite/gateway.js')
        .then((module) => module?.default || module)
        .then(async (gateway) => (gateway instanceof Promise ? await gateway : gateway))
        .then((gateway) => {
          window.__AGENT_TOWN_POKER_GATEWAY__ = gateway || null;
          return gateway || null;
        })
        .catch(() => null);
    }
    return await pokerRuntimeGatewayPromise;
  }

  function shouldUseWorkerSeatAgentMode() {
    return !!(getParentRuntimeGateway() || window.__AGENT_TOWN_POKER_GATEWAY__);
  }

  function buildPokerApiPath(basePath, extraParams = {}) {
    const params = new URLSearchParams();
    const routeParams = getRouteSearchParams();
    const asOf = String(routeParams.get('asOf') || '').trim();
    if (asOf) params.set('asOf', asOf);
    for (const [key, rawValue] of Object.entries(extraParams || {})) {
      const value = rawValue == null ? '' : String(rawValue).trim();
      if (!key || !value) continue;
      params.set(key, value);
    }
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  function buildPlayTableApiPath(tableId, { rail = false } = {}) {
    const base = rail
      ? `/api/poker/play/rail/tables/${encodeURIComponent(tableId)}`
      : `/api/poker/play/tables/${encodeURIComponent(tableId)}`;
    const extra = {};
    if (!rail && shouldUseWorkerSeatAgentMode()) extra.seatAgentMode = 'worker';
    return buildPokerApiPath(base, extra);
  }

  function buildPlayTableHistoryApiPath(tableId, { status = '' } = {}) {
    return buildPokerApiPath(`/api/poker/play/tables/${encodeURIComponent(tableId)}/history`, {
      status,
    });
  }

  function buildPlaySeriesTimelineApiPath(seriesId, { rail = false } = {}) {
    const base = rail
      ? `/api/poker/play/rail/series/${encodeURIComponent(seriesId)}/timeline`
      : `/api/poker/play/series/${encodeURIComponent(seriesId)}/timeline`;
    return buildPokerApiPath(base);
  }

  function buildPlayResultsApiPath() {
    return buildPokerApiPath('/api/poker/play/results/me');
  }

  function buildPlayIntegrityQueueApiPath({ status = '' } = {}) {
    return buildPokerApiPath('/api/poker/play/admin/integrity', { status });
  }

  function readWalletRecoveryKey() {
    try {
      return String(window.localStorage.getItem('agentTown:walletRecoveryKey') || '').trim();
    } catch {
      return '';
    }
  }

  function readStoredPokerAdminToken() {
    try {
      return String(window.localStorage.getItem(POKER_ADMIN_TOKEN_KEY) || '').trim();
    } catch {
      return '';
    }
  }

  async function buildIdentityHeaders() {
    const headers = {};
    const client = getWalletClient();
    if (client) {
      try {
        const solanaAddress = await client.getAddress({ chain: 'solana' });
        if (solanaAddress) headers['x-wallet-solana-address'] = solanaAddress;
      } catch {
        // ignore wallet lookup failures
      }
      try {
        const evmAddress = await client.getAddress({ chain: 'evm' });
        if (evmAddress) headers['x-wallet-evm-address'] = evmAddress;
      } catch {
        // ignore wallet lookup failures
      }
    }
    const recoveryKey = readWalletRecoveryKey();
    if (recoveryKey) headers['x-wallet-recovery-key'] = recoveryKey;
    return headers;
  }

  async function api(path, options = {}) {
    const identityHeaders = await buildIdentityHeaders();
    const headers = {
      Accept: 'application/json',
      ...identityHeaders,
      'content-type': 'application/json',
      ...(options.headers || {}),
    };
    const response = await fetch(path, {
      credentials: 'include',
      cache: 'no-store',
      ...options,
      headers,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err = new Error(body?.error?.message || `HTTP_${response.status}`);
      err.status = response.status;
      err.code = body?.error?.code || 'UNKNOWN';
      err.body = body;
      throw err;
    }
    return body;
  }

  function clearCountdownTimer() {
    if (countdownTimer) {
      window.clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }

  function clearLiveRefreshTimer() {
    if (liveRefreshTimer) {
      window.clearTimeout(liveRefreshTimer);
      liveRefreshTimer = null;
    }
  }

  function clearLiveTableStream() {
    if (liveTableStream) {
      liveTableStream.close();
      liveTableStream = null;
    }
    liveTableStreamKey = '';
  }

  function formatPlaySeatStatus(status) {
    const value = String(status || '').trim().toLowerCase();
    if (value === 'leaving_after_hand') return 'leaving after hand';
    if (value === 'registered') return 'registered for next hand';
    if (value.includes('_')) return value.replace(/_/g, ' ');
    return value || 'active';
  }

  function renderCards(items) {
    clearCountdownTimer();
    clearLiveRefreshTimer();
    if (!contentEl) return;
    contentEl.innerHTML = '';
    for (const item of items) {
      const card = document.createElement('article');
      card.className = 'pokerCard';
      card.innerHTML = item;
      contentEl.appendChild(card);
    }
  }

  function formatIso(value) {
    const ms = Date.parse(String(value || ''));
    if (!Number.isFinite(ms)) return 'n/a';
    return new Date(ms).toLocaleString();
  }

  function renderMetaBadges(items) {
    return `<div class="pokerMeta">${items.map((item) => `<span class="pokerBadge">${escapeHtml(item)}</span>`).join('')}</div>`;
  }

  function renderSummaryMetric(label, value) {
    return `
      <div class="pokerCard pokerInset">
        <div class="pokerLabel">${escapeHtml(label)}</div>
        <div class="pokerSummaryValue">${escapeHtml(value)}</div>
      </div>
    `;
  }

  function renderPokerCards(cards) {
    const items = Array.isArray(cards) ? cards : [];
    return items.length
      ? `<div class="pokerCardStrip">${items.map((card) => `<span class="pokerMiniCard">${escapeHtml(card)}</span>`).join('')}</div>`
      : '<div class="pokerCardStrip"><span class="pokerMiniCard">--</span></div>';
  }

  function renderPayoutPlan(payouts) {
    const items = Array.isArray(payouts) ? payouts : [];
    if (!items.length) return '<p>No payout ladder yet.</p>';
    return `
      <div class="pokerStack">
        ${items.map((item) => `
          <div class="pokerRow">
            <span>${escapeHtml(`${Number(item.place || 0)} place`)}</span>
            <span>${escapeHtml(`${Number(item.percent || 0)}%`)}</span>
            <span>${Number(item.amountOil || 0)} OIL</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderSeriesStandings(standings) {
    const items = Array.isArray(standings) ? standings : [];
    if (!items.length) return '<p>No final placements yet.</p>';
    return `
      <div class="pokerStack">
        ${items.map((item) => `
          <div class="pokerRow">
            <span>${escapeHtml(`${Number(item.place || 0)}.`)}</span>
            <span>${escapeHtml(item.displayName || 'Seat')}</span>
            <span>${Number(item.prizeOil || 0)} OIL</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderSeriesClosureNotice(series) {
    if (!series || String(series?.stage || '') !== 'cancelled') return '';
    const refundedSeatCount = Number(series?.refundedSeatCount || 0);
    const refundedTotalOil = Number(series?.refundedTotalOil || 0);
    const closeReason = String(series?.closeReason || 'Tournament series cancelled by operator.');
    return `
      <p>${escapeHtml(closeReason)}${refundedSeatCount ? ` ${refundedSeatCount} seat${refundedSeatCount === 1 ? '' : 's'} refunded for ${refundedTotalOil} OIL.` : ''}</p>
    `;
  }

  function formatTimelineEventKind(eventKind) {
    const value = String(eventKind || '').trim();
    if (!value) return 'event';
    return value.replaceAll('_', ' ');
  }

  function sortTimelineItems(items) {
    return (Array.isArray(items) ? items.slice() : []).sort((left, right) => {
      const leftAt = Date.parse(String(left?.createdAt || ''));
      const rightAt = Date.parse(String(right?.createdAt || ''));
      if (Number.isFinite(leftAt) && Number.isFinite(rightAt) && leftAt !== rightAt) {
        return leftAt - rightAt;
      }
      return `${String(left?.tableId || '')}:${String(left?.handId || '')}:${String(left?.eventKind || '')}`
        .localeCompare(`${String(right?.tableId || '')}:${String(right?.handId || '')}:${String(right?.eventKind || '')}`);
    });
  }

  function renderTimelinePayload(payload) {
    const body = typeof payload?.body === 'string' ? payload.body.trim() : '';
    const parts = [];
    if (body) parts.push(`<div>${escapeHtml(body)}</div>`);
    if (typeof payload?.reason === 'string' && payload.reason.trim()) {
      parts.push(`<div class="pokerMuted">Reason: ${escapeHtml(payload.reason)}</div>`);
    }
    if (typeof payload?.status === 'string' && payload.status.trim()) {
      parts.push(`<div class="pokerMuted">Status: ${escapeHtml(payload.status)}</div>`);
    }
    if (Number(payload?.amountOil || 0) > 0) {
      parts.push(`<div class="pokerMuted">${Number(payload.amountOil || 0)} OIL</div>`);
    }
    if (typeof payload?.actionKind === 'string' && payload.actionKind.trim()) {
      parts.push(`<div class="pokerMuted">Action: ${escapeHtml(payload.actionKind)}</div>`);
    }
    return parts.join('') || '<div class="pokerMuted">No additional payload.</div>';
  }

  function renderPlayResultRows(items) {
    const rows = Array.isArray(items) ? items : [];
    if (!rows.length) return '<p>No completed or active seat history yet.</p>';
    return `
      <div class="pokerStack">
        ${rows.map((item) => `
          <div class="pokerMessage">
            <div class="pokerSplit">
              <div>
                <div class="pokerLabel">${escapeHtml(item.title || 'Live Table')}</div>
                <div>${escapeHtml(item.tableType || 'cash')}${item.seriesTitle ? ` · ${escapeHtml(item.seriesTitle)}` : ''}</div>
              </div>
              <div class="pokerMuted">${escapeHtml(item.completedAt ? formatIso(item.completedAt) : 'in progress')}</div>
            </div>
            <div class="pokerSummary">
              ${renderSummaryMetric('Seat', `${Number(item.seatNumber || 0)}`)}
              ${renderSummaryMetric('Invested', `${Number(item.investedOil || 0)} OIL`)}
              ${renderSummaryMetric('Returned', `${Number(item.returnedOil || 0)} OIL`)}
              ${renderSummaryMetric('Prize', `${Number(item.prizeOil || 0)} OIL`)}
              ${renderSummaryMetric('Net', `${Number(item.netOil || 0)} OIL`)}
              ${renderSummaryMetric('Finish', item.finishPosition ? `${Number(item.finishPosition || 0)}` : 'n/a')}
            </div>
            <div class="pokerMuted">${escapeHtml(item.live ? `live stack ${Number(item.stackOil || 0)} OIL · ${formatPlaySeatStatus(item.status)}` : formatPlaySeatStatus(item.status))}</div>
            <div class="pokerLinks">
              <a href="${escapeHtml(buildPokerHref(`/poker/play/tables/${encodeURIComponent(item.tableId || '')}`))}">Open Table</a>
              <a href="${escapeHtml(buildPokerHref(`/poker/play/tables/${encodeURIComponent(item.tableId || '')}/history`, { status: 'completed' }))}">Hand History</a>
              ${item.seriesId ? `<a href="${escapeHtml(buildPokerHref(`/poker/play/series/${encodeURIComponent(item.seriesId)}/timeline`))}">Series Timeline</a>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderPlayHandHistoryRows(items) {
    const rows = Array.isArray(items) ? items : [];
    if (!rows.length) return '<p>No hand history rows matched this filter.</p>';
    return `
      <div class="pokerStack">
        ${rows.map((item) => `
          <div class="pokerMessage">
            <div class="pokerSplit">
              <div>
                <div class="pokerLabel">Hand ${Number(item.handNumber || 0)} · ${escapeHtml(item.status || 'unknown')}</div>
                <div>${escapeHtml(item.result?.note || `${item.actionCount || 0} public actions recorded.`)}</div>
              </div>
              <div class="pokerMuted">${escapeHtml(item.completedAt ? formatIso(item.completedAt) : formatIso(item.startedAt))}</div>
            </div>
            <div class="pokerMeta">
              <span class="pokerBadge">${escapeHtml(item.street || 'preflop')}</span>
              <span class="pokerBadge">${Number(item.actionCount || 0)} actions</span>
              ${item.agentProposal ? '<span class="pokerBadge">worker line</span>' : ''}
            </div>
            <div class="pokerLabel">Board</div>
            ${renderPokerCards(item.communityCards || [])}
            ${item.agentProposal ? `<p>${escapeHtml(item.agentProposal.body || 'No worker note.')}</p>` : ''}
            ${Array.isArray(item.actions) && item.actions.length ? renderPublicActionLog(item.actions, 'No public actions logged.') : '<p class="pokerMuted">No public actions logged.</p>'}
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderTimelineRows(items, { emptyText = 'No timeline rows yet.' } = {}) {
    const rows = sortTimelineItems(items);
    if (!rows.length) return `<p>${escapeHtml(emptyText)}</p>`;
    return `
      <div class="pokerStack">
        ${rows.map((item) => `
          <div class="pokerMessage">
            <div class="pokerSplit">
              <div>
                <div class="pokerLabel">${escapeHtml(formatTimelineEventKind(item.eventKind || 'event'))}</div>
                <div>${escapeHtml(item.tableTitle || item.tableId || 'Tournament Table')} · ${escapeHtml(item.seatLabel || item.actorRole || 'system')}</div>
              </div>
              <div class="pokerMuted">${escapeHtml(formatIso(item.createdAt))}</div>
            </div>
            ${renderTimelinePayload(item.payload || {})}
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderIntegrityFlagRows(items) {
    const rows = Array.isArray(items) ? items : [];
    if (!rows.length) return '<p>No integrity flags matched this filter.</p>';
    return `
      <div class="pokerStack">
        ${rows.map((item) => `
          <div class="pokerMessage">
            <div class="pokerSplit">
              <div>
                <div class="pokerLabel">${escapeHtml(item.category || 'flag')} · ${escapeHtml(item.severity || 'medium')}</div>
                <div>${escapeHtml(item.tableTitle || item.tableId || 'Poker Table')}${item.seriesTitle ? ` · ${escapeHtml(item.seriesTitle)}` : ''}</div>
              </div>
              <div class="pokerMuted">${escapeHtml(formatIso(item.createdAt))}</div>
            </div>
            <div>${escapeHtml(item.summary || 'No flag summary available.')}</div>
            <div class="pokerMeta">
              ${item.status ? `<span class="pokerBadge">${escapeHtml(item.status)}</span>` : ''}
              ${item.seatLabel ? `<span class="pokerBadge">${escapeHtml(item.seatLabel)}</span>` : ''}
            </div>
            <div class="pokerLinks">
              <a href="${escapeHtml(buildPokerHref(`/poker/play/tables/${encodeURIComponent(item.tableId || '')}`))}">Open Table</a>
              <button class="pokerButton" type="button" data-integrity-action="resolved" data-flag-id="${escapeHtml(item.flagId || '')}">Resolve</button>
              <button class="pokerButton" type="button" data-integrity-action="dismissed" data-flag-id="${escapeHtml(item.flagId || '')}">Dismiss</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function buildAdminSeriesTimelineItems(review) {
    const tables = Array.isArray(review?.tables) ? review.tables : [];
    return sortTimelineItems(
      tables.flatMap((entry) => {
        const reviewData = entry?.review || {};
        const table = reviewData?.table || {};
        return (Array.isArray(reviewData?.auditEvents) ? reviewData.auditEvents : []).map((event) => ({
          createdAt: event.createdAt || null,
          tableId: entry?.tableId || table?.tableId || '',
          tableTitle: table?.title || entry?.tableId || 'Tournament Table',
          handId: event.handId || null,
          eventKind: event.eventKind || 'event',
          actorRole: event.actorRole || 'system',
          seatNumber: event.seatNumber == null ? null : Number(event.seatNumber || 0),
          seatLabel: event.seatLabel || event.actorRole || 'system',
          payload: event.payload || {},
        }));
      })
    );
  }

  function triggerJsonDownload(filename, data) {
    const blob = new Blob([JSON.stringify(data || {}, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  function renderPublicActionLog(actions, emptyText = 'No public actions logged yet.') {
    const items = Array.isArray(actions) ? actions : [];
    if (!items.length) return `<p>${escapeHtml(emptyText)}</p>`;
    return `
      <div class="pokerStack">
        ${items.slice(-10).map((action) => `
          <div class="pokerRow">
            <span>${escapeHtml(action.seatLabel || 'Seat')}</span>
            <span>${escapeHtml(action.actionKind || 'act')}</span>
            <span>${Number(action.amountOil || 0)} OIL</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderReturnedUncalledSummary(returnedUncalledBySeat) {
    const entries = Object.entries(returnedUncalledBySeat && typeof returnedUncalledBySeat === 'object' ? returnedUncalledBySeat : {})
      .map(([seatNumber, amountOil]) => ({
        seatNumber: Number(seatNumber || 0),
        amountOil: Number(amountOil || 0),
      }))
      .filter((entry) => entry.seatNumber > 0 && entry.amountOil > 0);
    if (!entries.length) return '';
    return `
      <div class="pokerLabel">Returned Uncalled Chips</div>
      <div class="pokerStack">
        ${entries.map((entry) => `
          <div class="pokerRow">
            <span>${escapeHtml(`Seat ${entry.seatNumber}`)}</span>
            <span>${escapeHtml(`${entry.amountOil} OIL`)}</span>
            <span>returned</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderMatchedPots(result) {
    const slices = Array.isArray(result?.potSlices) ? result.potSlices : [];
    if (!slices.length) return '';
    return `
      <div class="pokerLabel">Matched Pots</div>
      <div id="pokerMatchedPots" class="pokerStack">
        ${slices.map((slice) => `
          <div class="pokerMessage" data-pot-kind="${escapeHtml(slice.potKind || 'pot')}">
            <div class="pokerLabel">${escapeHtml(`${slice.potKind || 'pot'} pot · ${Number(slice.totalOil || 0)} OIL`)}</div>
            <div>${escapeHtml(`Eligible seats: ${(Array.isArray(slice.eligibleSeatNumbers) ? slice.eligibleSeatNumbers : []).join(', ') || 'none'}`)}</div>
            <div>${escapeHtml(`Winning seats: ${(Array.isArray(slice.winningSeatNumbers) ? slice.winningSeatNumbers : []).join(', ') || 'none'}`)}</div>
            ${Array.isArray(slice.oddChipSeatNumbers) && slice.oddChipSeatNumbers.length
              ? `<div>${escapeHtml(`Odd chip: seat ${slice.oddChipSeatNumbers.join(', seat ')}`)}</div>`
              : ''}
          </div>
        `).join('')}
      </div>
      ${renderReturnedUncalledSummary(result?.returnedUncalledBySeat)}
    `;
  }

  function renderSeatMarkers(seats) {
    const items = Array.isArray(seats) ? seats : [];
    if (!items.length) return '<p>No seats are filled yet.</p>';
    return `
      <div class="pokerStack">
        ${items.map((seat) => `
          <div class="pokerRow">
            <div>
              <div class="pokerLabel">Seat ${Number(seat.seatNumber || 0)}</div>
              <div>${escapeHtml(seat.displayName || `Seat ${seat.seatNumber}`)}</div>
            </div>
            <div class="pokerMeta">
              ${seat.isViewer ? '<span class="pokerBadge">you</span>' : ''}
              ${seat.isActing ? '<span class="pokerBadge">acting</span>' : ''}
              <span class="pokerBadge">${escapeHtml(formatPlaySeatStatus(seat.status || 'open'))}</span>
              ${seat.presenceStatus === 'disconnected' ? '<span class="pokerBadge">disconnected</span>' : ''}
              <span class="pokerBadge">${Number(seat.stackOil || 0)} OIL</span>
              ${seat.folded ? '<span class="pokerBadge">folded</span>' : ''}
              ${seat.allIn ? '<span class="pokerBadge">all-in</span>' : ''}
            </div>
            <div>
              ${renderPokerCards(Array.isArray(seat.holeCards) && seat.holeCards.length ? seat.holeCards : Array.from({ length: Number(seat.hiddenCardCount || 0) }, () => '??'))}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderActionOptions(actions) {
    const items = Array.isArray(actions) ? actions : [];
    return items.length
      ? items.map((action) => `<option value="${escapeHtml(action)}">${escapeHtml(action)}</option>`).join('')
      : '<option value="">No actions</option>';
  }

  function scheduleLiveTableRefresh(tableId, { rail = false } = {}) {
    clearLiveRefreshTimer();
    if (!tableId) return;
    const expectedPath = rail ? `/poker/play/rail/tables/${tableId}` : `/poker/play/tables/${tableId}`;
    liveRefreshTimer = window.setTimeout(() => {
      const path = window.location.pathname;
      if (path === expectedPath) {
        refreshLiveTable(tableId, { silent: true, rail }).catch(() => {});
      }
    }, 15000);
  }

  function scheduleRailSeriesRefresh(seriesId) {
    clearLiveRefreshTimer();
    if (!seriesId) return;
    const expectedPath = `/poker/play/rail/series/${seriesId}`;
    liveRefreshTimer = window.setTimeout(() => {
      if (window.location.pathname === expectedPath) {
        loadPlayRailSeries(seriesId, { silent: true }).catch(() => {});
      }
    }, 15000);
  }

  async function refreshLiveTable(tableId, { silent = false, rail = false } = {}) {
    if (!tableId || liveTableRefreshInFlight) return;
    liveTableRefreshInFlight = true;
    try {
      await loadPlayTable(tableId, { silent, rail });
    } finally {
      liveTableRefreshInFlight = false;
    }
  }

  async function refreshRailSeries(seriesId, { silent = false } = {}) {
    if (!seriesId || liveTableRefreshInFlight) return;
    liveTableRefreshInFlight = true;
    try {
      await loadPlayRailSeries(seriesId, { silent });
    } finally {
      liveTableRefreshInFlight = false;
    }
  }

  function bindLiveTableStream(tableId, { rail = false } = {}) {
    if (!tableId || typeof window.EventSource !== 'function') return;
    const streamKey = `${rail ? 'rail' : 'player'}:${tableId}`;
    if (liveTableStream && liveTableStreamKey === streamKey) return;
    clearLiveTableStream();
    liveTableStreamKey = streamKey;
    const expectedPath = rail ? `/poker/play/rail/tables/${tableId}` : `/poker/play/tables/${tableId}`;
    const streamPath = rail
      ? `/api/poker/play/rail/tables/${encodeURIComponent(tableId)}/stream`
      : `/api/poker/play/tables/${encodeURIComponent(tableId)}/stream`;
    const stream = new window.EventSource(buildPokerHref(streamPath), {
      withCredentials: true,
    });
    liveTableStream = stream;
    stream.addEventListener('table', () => {
      if (window.location.pathname === expectedPath) {
        refreshLiveTable(tableId, { silent: true, rail }).catch(() => {});
      }
    });
    stream.addEventListener('error', () => {
      scheduleLiveTableRefresh(tableId, { rail });
    });
  }

  function bindRailSeriesStream(seriesId) {
    if (!seriesId || typeof window.EventSource !== 'function') return;
    const streamKey = `series:${seriesId}`;
    if (liveTableStream && liveTableStreamKey === streamKey) return;
    clearLiveTableStream();
    liveTableStreamKey = streamKey;
    const expectedPath = `/poker/play/rail/series/${seriesId}`;
    const stream = new window.EventSource(buildPokerHref(`/api/poker/play/rail/series/${encodeURIComponent(seriesId)}/stream`), {
      withCredentials: true,
    });
    liveTableStream = stream;
    stream.addEventListener('series', () => {
      if (window.location.pathname === expectedPath) {
        refreshRailSeries(seriesId, { silent: true }).catch(() => {});
      }
    });
    stream.addEventListener('error', () => {
      scheduleRailSeriesRefresh(seriesId);
    });
  }

  function renderSnapshotSlots(snapshotState) {
    const slots = Array.isArray(snapshotState?.slots) ? snapshotState.slots : [];
    if (!slots.length) return '<p>No hourly snapshot schedule yet.</p>';
    return `
      <div class="pokerStack">
        ${slots.map((slot) => `
          <div class="pokerRow">
            <span>${escapeHtml(formatIso(slot.scheduledFor))}</span>
            <span class="pokerBadge">${escapeHtml(slot.status)}</span>
            <span>${Number(slot.amountAwarded || 0)} OIL</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  function bytesToBase64(value) {
    const bytes = value instanceof Uint8Array
      ? value
      : value instanceof ArrayBuffer
        ? new Uint8Array(value)
        : ArrayBuffer.isView(value)
          ? new Uint8Array(value.buffer)
          : null;
    if (!bytes) return '';
    let out = '';
    for (const byte of bytes) out += String.fromCharCode(byte);
    return window.btoa(out);
  }

  function getWalletClient() {
    const scopes = [];
    if (window.parent && window.parent !== window) scopes.push(window.parent);
    scopes.push(window);
    for (const scope of scopes) {
      if (typeof scope.initWalletClient !== 'function') continue;
      try {
        const client = scope.initWalletClient();
        if (client) return client;
      } catch {
        // ignore and try next scope
      }
    }
    return null;
  }

  async function ensureSolanaWallet(client) {
    if (!client) throw new Error('WALLET_CLIENT_UNAVAILABLE');
    let address = await client.getAddress({ chain: 'solana' });
    if (!address) {
      await client.connect({ chain: 'solana' });
      address = await client.getAddress({ chain: 'solana' });
    }
    if (!address) throw new Error('WALLET_ADDRESS_UNAVAILABLE');
    return address;
  }

  function persistStreamId(value) {
    try {
      window.localStorage.setItem('poker.centaur.streamId', String(value || ''));
    } catch {
      // ignore
    }
  }

  function readStoredStreamId() {
    try {
      return window.localStorage.getItem('poker.centaur.streamId') || '';
    } catch {
      return '';
    }
  }

  function bindCountdown(expiresAt) {
    clearCountdownTimer();
    const el = document.getElementById('centaurCountdownValue');
    if (!el || !expiresAt) return;
    const render = () => {
      const remainingMs = Date.parse(String(expiresAt || '')) - Date.now();
      const remaining = Math.max(0, Math.ceil(remainingMs / 1000));
      el.textContent = remaining > 0 ? `${remaining}s` : 'expired';
      if (remaining <= 0) clearCountdownTimer();
    };
    render();
    countdownTimer = window.setInterval(render, 1000);
  }

  async function loadIndex() {
    setTitle('Portal Poker', 'Live 6-max tables, mirrored seasons, and centaur tournaments share one hub.');
    setStatus('Loading poker overview...');
    const [seasonsPayload, centaurPayload, playPayload] = await Promise.all([
      api('/api/poker/seasons'),
      api('/api/poker/centaur/tournaments').catch(() => null),
      api('/api/poker/play/tables').catch(() => null),
    ]);
    const items = Array.isArray(seasonsPayload?.data?.items) ? seasonsPayload.data.items : [];
    const cards = [];
    if (playPayload?.data) {
      const tables = Array.isArray(playPayload.data.items) ? playPayload.data.items : [];
      const series = Array.isArray(playPayload.data.series) ? playPayload.data.series : [];
      const oilBalance = Number(playPayload?.data?.oilBalance?.balance || 0);
      cards.push(`
        <h2>Live 6-Max Tables</h2>
        <p>Play cash and single-table tournament hold’em with other users and their agents. Each seat gets a private agent thread and a live decision clock.</p>
        ${renderMetaBadges([
          playPayload?.data?.houseId || 'house pending',
          playPayload?.data?.wallet?.address || 'wallet pending',
          `${oilBalance} OIL`,
          series.length ? `${series.length} tournament series` : 'no tournament series',
          tables.length ? `${tables.length} tables` : 'no tables',
        ])}
        <div class="pokerLinks">
          <a href="${escapeHtml(buildPokerHref('/poker/play'))}">Open Live Lobby</a>
          <a href="${escapeHtml(buildPokerHref('/poker/play/rail'))}">Open Rail</a>
          ${tables.slice(0, 2).map((table) => `<a href="${escapeHtml(buildPokerHref(`/poker/play/tables/${encodeURIComponent(table.tableId)}`))}">${escapeHtml(table.title)}</a>`).join('')}
        </div>
      `);
    }
    if (centaurPayload?.data) {
      const tournaments = Array.isArray(centaurPayload.data.items) ? centaurPayload.data.items : [];
      const oilBalance = Number(centaurPayload?.data?.oilBalance?.balance || 0);
      cards.push(`
        <h2>Centaur Tournaments</h2>
        <p>Human and AI discuss one line together under a live action clock. OIL is credited offchain from verified Streamflow lock snapshots.</p>
        ${renderMetaBadges([
          centaurPayload?.data?.houseId || 'house pending',
          centaurPayload?.data?.wallet?.address || 'wallet pending',
          `${oilBalance} OIL`,
          tournaments.length ? `${tournaments.length} open` : 'no tournaments',
        ])}
        <div class="pokerLinks">
          <a href="${escapeHtml(buildPokerHref('/poker/centaur'))}">Open Centaur Lobby</a>
        </div>
      `);
    }
    if (!items.length) {
      cards.push('<h2>No mirrored seasons yet.</h2><p>Run a mirror sync before opening classic poker pages.</p>');
      setStatus('Live tables and centaur lobby ready. No mirrored operator seasons yet.');
      renderCards(cards);
      return;
    }
    cards.push(...items.map((item) => {
      const latestReplayRunId = item?.latestReplayHighlight?.runId || '';
      const latestLeaderboardSnapshotId = item?.latestLeaderboardSnapshot?.snapshotId || '';
      return `
        <h2>${escapeHtml(item.displayName)}</h2>
        <div>${escapeHtml(item.seasonSlug)}</div>
        ${renderMetaBadges([item.status, item.rulesVersion || 'rules', item.operatorVersion || 'operator'])}
        <div class="pokerLinks">
          <a href="${escapeHtml(buildPokerHref(`/poker/seasons/${encodeURIComponent(item.seasonId)}`))}">Season</a>
          <a href="${escapeHtml(buildPokerHref(`/poker/leaderboards/${encodeURIComponent(item.seasonId)}`))}">Leaderboard</a>
          ${latestReplayRunId ? `<a href="${escapeHtml(buildPokerHref(`/poker/replays/${encodeURIComponent(latestReplayRunId)}`))}">Replay</a>` : ''}
          ${latestLeaderboardSnapshotId ? `<span class="pokerBadge">snapshot ${escapeHtml(latestLeaderboardSnapshotId)}</span>` : ''}
        </div>
      `;
    }));
    setStatus(`Loaded ${items.length} mirrored season${items.length === 1 ? '' : 's'}, live tables, and the centaur lobby.`);
    renderCards(cards);
  }

  async function loadPlayLobby() {
    clearLiveTableStream();
    setTitle('Live Poker Lobby', 'Cash and single-table tournament hold’em with private human + agent seat threads.');
    setStatus('Loading live tables...');
    const payload = await api('/api/poker/play/tables');
    const items = Array.isArray(payload?.data?.items) ? payload.data.items : [];
    const series = Array.isArray(payload?.data?.series) ? payload.data.series : [];
    const oilBalance = Number(payload?.data?.oilBalance?.balance || 0);
    renderCards([
      `
        <h2>Eligibility</h2>
        <div class="pokerSummary">
          ${renderSummaryMetric('House', payload?.data?.houseId || 'Pending')}
          ${renderSummaryMetric('Wallet', payload?.data?.wallet?.address || 'Bind wallet')}
          ${renderSummaryMetric('OIL Balance', `${oilBalance}`)}
          ${renderSummaryMetric('Tournament Series', `${series.length}`)}
          ${renderSummaryMetric('Live Tables', `${items.length}`)}
        </div>
      `,
      `
        <h2>Quick Seat</h2>
        <p>Matchmake into an existing live table with the same structure, or create a new one instantly if no match exists.</p>
        <div class="pokerLinks">
          <a href="${escapeHtml(buildPokerHref('/poker/play/rail'))}">Open Public Rail</a>
          <a href="${escapeHtml(buildPokerHref('/poker/play/results'))}">My Results</a>
        </div>
        <form id="pokerPlayMatchmakeForm" class="pokerForm">
          <label>
            Table Type
            <select id="pokerPlayMatchmakeType">
              <option value="cash">Cash</option>
              <option value="tournament">Tournament</option>
            </select>
          </label>
          <label>
            Small Blind OIL
            <input id="pokerPlayMatchmakeSmallBlind" type="number" min="1" value="10">
          </label>
          <label>
            Big Blind OIL
            <input id="pokerPlayMatchmakeBigBlind" type="number" min="2" value="20">
          </label>
          <label>
            Buy-In OIL
            <input id="pokerPlayMatchmakeBuyIn" type="number" min="20" value="400">
          </label>
          <label>
            Display Name
            <input id="pokerPlayMatchmakeDisplayName" maxlength="80" value="${escapeHtml(payload?.data?.houseId || 'House Seat')}">
          </label>
          <button class="pokerButton" type="submit">Join Or Create</button>
        </form>
      `,
      series.length
        ? series.map((item) => `
          <div class="pokerSplit">
            <div>
              <h2>${escapeHtml(item.seriesTitle || 'Tournament Series')}</h2>
              <p>Shared tournament identity for multiple live 6-max tables before final-table convergence.</p>
              ${renderMetaBadges([
                item.stage || 'seating',
                `${Number(item.tableCount || 0)} tables`,
                Number(item.targetTableCount || 0) > 0 ? `target ${Number(item.targetTableCount || 0)}` : '',
                `${Number(item.entrantCount || 0)} entrants`,
                Number(item.prizePoolOil || 0) > 0 ? `${Number(item.prizePoolOil || 0)} OIL pool` : '',
                Number(item.paidPlaces || 0) > 0 ? `${Number(item.paidPlaces || 0)} paid` : '',
                item.lateRegistrationOpen ? 'late reg open' : 'late reg closed',
                item.needsRebalance ? 'table break pending' : '',
              ])}
              ${item.pendingBreakTableId
                ? `<p>Director target: collapse toward ${Number(item.targetTableCount || 0)} table${Number(item.targetTableCount || 0) === 1 ? '' : 's'} by breaking ${escapeHtml(item.pendingBreakTableId)} with ${Number(item.pendingBreakSeatCount || 0)} seat${Number(item.pendingBreakSeatCount || 0) === 1 ? '' : 's'}${item.pendingBreakBlockedByLiveTable ? ' once its live hand settles.' : '.'}</p>`
                : (item.needsRebalance ? `<p>Director target: rebalance toward ${Number(item.targetTableCount || 0)} table${Number(item.targetTableCount || 0) === 1 ? '' : 's'} across the remaining live tables.</p>` : '')}
              <div class="pokerLabel">Payout Ladder</div>
              ${renderPayoutPlan(item.payouts)}
            </div>
            <div class="pokerLinks">
              <a href="${escapeHtml(buildPokerHref(`/poker/play/tables/${encodeURIComponent(item.currentUserTableId || item.activeTableId || '')}`))}">${item.currentUserTableId ? 'Return To Series Table' : 'Open Series Table'}</a>
              <a href="${escapeHtml(buildPokerHref(`/poker/play/series/${encodeURIComponent(item.seriesId || '')}/timeline`))}">Timeline</a>
            </div>
          </div>
        `).join('')
        : '',
      items.length
        ? items.map((item) => `
          <div class="pokerSplit">
            <div>
              <h2>${escapeHtml(item.title)}</h2>
              <p>${escapeHtml(item?.summary?.headline || 'Human + agent co-op on a shared live table.')}</p>
              ${renderMetaBadges([
                item.tableType,
                `${Number(item.smallBlindOil || 0)} / ${Number(item.bigBlindOil || 0)}`,
                `${Number(item.buyInOil || 0)} OIL buy-in`,
                `${Number(item?.summary?.occupancy || 0)}/${Number(item.maxSeats || 6)} seated`,
                Number(item?.summary?.disconnectedSeatCount || 0) > 0 ? `${Number(item.summary.disconnectedSeatCount || 0)} disconnected` : '',
                item?.summary?.liveHand ? `hand ${Number(item?.summary?.handNumber || 0)}` : 'waiting',
                item?.tableType === 'tournament'
                  ? (item?.summary?.lateRegistrationOpen
                    ? `late reg ${Number(item?.summary?.lateRegistrationRemainingHands || 0)}`
                    : (item?.summary?.handNumber ? 'late reg closed' : 'late reg open'))
                  : '',
                item?.tableType === 'tournament' && Number(item?.summary?.prizePoolOil || 0) > 0
                  ? `${Number(item.summary.prizePoolOil || 0)} OIL pool`
                  : '',
              ])}
            </div>
            <div class="pokerLinks">
              <a href="${escapeHtml(buildPokerHref(`/poker/play/tables/${encodeURIComponent(item.tableId)}`))}">${item?.currentUser?.seated ? 'Return To Seat' : 'Open Table'}</a>
              <a href="${escapeHtml(buildPokerHref(`/poker/play/tables/${encodeURIComponent(item.tableId)}/history`, { status: 'completed' }))}">History</a>
            </div>
          </div>
        `).join('')
        : '<h2>No live tables yet.</h2><p>Use Quick Seat to create the first matching cash or tournament table.</p>',
    ]);
    bindPlayMatchmakeForm();
    setStatus(items.length ? `${items.length} live poker table${items.length === 1 ? '' : 's'} loaded.` : 'No live poker table available.');
  }

  async function loadPlayRailLobby() {
    clearLiveTableStream();
    setTitle('Live Poker Rail', 'Watch public 6-max table state, final-table convergence, and live action without opening a seat.');
    setStatus('Loading rail tables...');
    const payload = await api('/api/poker/play/rail');
    const items = Array.isArray(payload?.data?.items) ? payload.data.items : [];
    const series = Array.isArray(payload?.data?.series) ? payload.data.series : [];
    renderCards([
      `
        <h2>Public Rail</h2>
        <div class="pokerSummary">
          ${renderSummaryMetric('Tournament Series', `${series.length}`)}
          ${renderSummaryMetric('Live Tables', `${items.length}`)}
          ${renderSummaryMetric('Viewer Mode', payload?.data?.viewerMode || 'public')}
        </div>
        <p>Rail pages only expose public table state. Private human + agent seat threads, viewer-only actions, and unrevealed hole cards remain hidden.</p>
        <div class="pokerLinks">
          <a href="${escapeHtml(buildPokerHref('/poker/play'))}">Open Player Lobby</a>
        </div>
      `,
      series.length
        ? series.map((item) => `
          <div class="pokerSplit">
            <div>
              <h2>${escapeHtml(item.seriesTitle || 'Tournament Series')}</h2>
              <p>Watch table breaks, prize-pool movement, and the path to the final table in public mode.</p>
              ${renderMetaBadges([
                item.stage || 'seating',
                `${Number(item.tableCount || 0)} tables`,
                `${Number(item.entrantCount || 0)} entrants`,
                Number(item.prizePoolOil || 0) > 0 ? `${Number(item.prizePoolOil || 0)} OIL pool` : '',
                Number(item.paidPlaces || 0) > 0 ? `${Number(item.paidPlaces || 0)} paid` : '',
                item.needsRebalance ? 'table break pending' : '',
              ])}
            </div>
            <div class="pokerLinks">
              <a href="${escapeHtml(buildPokerHref(`/poker/play/rail/series/${encodeURIComponent(item.seriesId || '')}`))}">Open Series Rail</a>
              <a href="${escapeHtml(buildPokerHref(`/poker/play/rail/series/${encodeURIComponent(item.seriesId || '')}/timeline`))}">Timeline</a>
              ${item.activeTableId ? `<a href="${escapeHtml(buildPokerHref(`/poker/play/rail/tables/${encodeURIComponent(item.activeTableId)}`))}">Open Active Table</a>` : '<span class="pokerBadge">table pending</span>'}
            </div>
          </div>
        `).join('')
        : '',
      items.length
        ? items.map((item) => `
          <div class="pokerSplit">
            <div>
              <h2>${escapeHtml(item.title)}</h2>
              <p>${escapeHtml(item?.summary?.headline || 'Public table state only.')}</p>
              ${renderMetaBadges([
                item.tableType,
                `${Number(item.smallBlindOil || 0)} / ${Number(item.bigBlindOil || 0)}`,
                `${Number(item?.summary?.occupancy || 0)}/${Number(item.maxSeats || 6)} seated`,
                item?.summary?.liveHand ? `hand ${Number(item?.summary?.handNumber || 0)}` : 'waiting',
                Number(item?.summary?.disconnectedSeatCount || 0) > 0 ? `${Number(item.summary.disconnectedSeatCount || 0)} disconnected` : '',
                item?.tableType === 'tournament' && Number(item?.summary?.prizePoolOil || 0) > 0
                  ? `${Number(item.summary.prizePoolOil || 0)} OIL pool`
                  : '',
              ].filter(Boolean))}
            </div>
            <div class="pokerLinks">
              <a href="${escapeHtml(buildPokerHref(`/poker/play/rail/tables/${encodeURIComponent(item.tableId)}`))}">Open Rail Table</a>
              <a href="${escapeHtml(buildPokerHref(`/poker/play/tables/${encodeURIComponent(item.tableId)}`))}">Open Player Table</a>
            </div>
          </div>
        `).join('')
        : '<h2>No live rail tables yet.</h2><p>Open the player lobby to seat the first cash or tournament table.</p>',
    ]);
    setStatus(items.length ? `${items.length} rail table${items.length === 1 ? '' : 's'} loaded.` : 'No live rail table available.');
  }

  async function loadPlayRailSeries(seriesId, { silent = false } = {}) {
    clearLiveTableStream();
    setTitle('Tournament Rail Series', `Public tournament-series view for ${seriesId}.`);
    if (!silent) setStatus('Loading tournament series rail...');
    const payload = await api(`/api/poker/play/rail/series/${encodeURIComponent(seriesId)}`);
    const series = payload?.data?.series || null;
    const tables = Array.isArray(payload?.data?.tables) ? payload.data.tables : [];
    renderCards([
      `
        <h2>${escapeHtml(series?.seriesTitle || 'Tournament Series')}</h2>
        <p>Follow the full multi-table tournament field without opening a seat. Table-break state, prize pool movement, and final placements stay public here.</p>
        <div class="pokerSummary">
          ${renderSummaryMetric('Stage', series?.stage || 'seating')}
          ${renderSummaryMetric('Tables', `${Number(series?.tableCount || 0)}`)}
          ${renderSummaryMetric('Live Tables', `${Number(series?.liveTableCount || 0)}`)}
          ${renderSummaryMetric('Entrants', `${Number(series?.entrantCount || 0)}`)}
          ${renderSummaryMetric('Prize Pool', `${Number(series?.prizePoolOil || 0)} OIL`)}
          ${renderSummaryMetric('Paid Places', `${Number(series?.paidPlaces || 0)}`)}
          ${Number(series?.refundedTotalOil || 0) > 0 ? renderSummaryMetric('Refunded', `${Number(series?.refundedTotalOil || 0)} OIL`) : ''}
        </div>
        ${renderMetaBadges([
          payload?.data?.viewerMode || 'public',
          Number(series?.targetTableCount || 0) > 0 ? `target ${Number(series?.targetTableCount || 0)}` : '',
          series?.lateRegistrationOpen ? 'late reg open' : 'late reg closed',
          series?.needsRebalance ? 'table break pending' : 'balanced',
        ].filter(Boolean))}
        <div class="pokerLinks">
          <a href="${escapeHtml(buildPokerHref('/poker/play/rail'))}">Back To Rail</a>
          ${series?.activeTableId ? `<a href="${escapeHtml(buildPokerHref(`/poker/play/rail/tables/${encodeURIComponent(series.activeTableId)}`))}">Open Active Table</a>` : ''}
        </div>
      `,
      `
        <h2>Series Director</h2>
        ${renderSeriesClosureNotice(series)}
        ${String(series?.stage || '') === 'cancelled'
          ? '<p>No active tables remain. Closed tournament tables stay available through operator review and audit export.</p>'
          : series?.pendingBreakTableId
          ? `<p>${escapeHtml(series.pendingBreakTableId)} is the current break candidate with ${Number(series?.pendingBreakSeatCount || 0)} active seat${Number(series?.pendingBreakSeatCount || 0) === 1 ? '' : 's'}${series?.pendingBreakBlockedByLiveTable ? '; the table must finish its live hand before seats can move.' : '.'}</p>`
          : (series?.needsRebalance
            ? `<p>Director target: rebalance toward ${Number(series?.targetTableCount || 0)} table${Number(series?.targetTableCount || 0) === 1 ? '' : 's'} across the current live field.</p>`
            : '<p>The tournament series is currently balanced for its active field.</p>')}
        <div class="pokerLabel">Payout Ladder</div>
        ${renderPayoutPlan(series?.payouts)}
        ${Array.isArray(series?.standings) && series.standings.length ? `
          <div class="pokerLabel">Final Placements</div>
          ${renderSeriesStandings(series.standings)}
        ` : ''}
      `,
      tables.length
        ? tables.map((entry) => `
          <div class="pokerSplit">
            <div>
              <h2>${escapeHtml(entry?.table?.title || entry?.table?.tableId || 'Tournament Table')}</h2>
              <p>${escapeHtml(entry?.table?.summary?.headline || 'Public table state for the current tournament series.')}</p>
              ${renderMetaBadges([
                `${Number(entry?.table?.smallBlindOil || 0)} / ${Number(entry?.table?.bigBlindOil || 0)}`,
                `${Number(entry?.table?.summary?.occupancy || 0)}/${Number(entry?.table?.maxSeats || 6)} seated`,
                entry?.table?.summary?.liveHand ? `hand ${Number(entry?.table?.summary?.handNumber || 0)}` : 'waiting',
                Number(entry?.review?.openDisputeCount || 0) > 0 ? `${Number(entry?.review?.openDisputeCount || 0)} reviews` : '',
              ].filter(Boolean))}
              ${entry?.hand ? `
                <div class="pokerSplit">
                  <div>
                    <div class="pokerLabel">Board</div>
                    ${renderPokerCards(entry.hand.communityCards || [])}
                  </div>
                  <div>
                    <div class="pokerLabel">Acting Seat</div>
                    <div>${escapeHtml(entry.hand.actingSeat ? `Seat ${Number(entry.hand.actingSeat || 0)}` : 'none')}</div>
                  </div>
                </div>
              ` : '<p>No live hand on this table right now.</p>'}
              <div class="pokerLabel">Seats</div>
              ${renderSeatMarkers(entry?.seats)}
              <div class="pokerLabel">Public Action Log</div>
              ${renderPublicActionLog(entry?.actions)}
            </div>
            <div class="pokerLinks">
              <a href="${escapeHtml(buildPokerHref(`/poker/play/rail/tables/${encodeURIComponent(entry?.table?.tableId || '')}`))}">Open Rail Table</a>
            </div>
          </div>
        `).join('')
        : '<h2>No active series tables.</h2><p>The series summary will stay here even after tables converge or close.</p>',
    ]);
    bindRailSeriesStream(seriesId);
    scheduleRailSeriesRefresh(seriesId);
    if (!silent) {
      setStatus(tables.length ? `${tables.length} tournament table${tables.length === 1 ? '' : 's'} loaded for rail.` : 'Tournament series rail ready.');
    }
  }

  async function loadPlayResults() {
    clearLiveTableStream();
    setTitle('Poker Results', 'Wallet-bound results across cash and tournament seats.');
    setStatus('Loading poker results...');
    const payload = await api(buildPlayResultsApiPath());
    const data = payload?.data || {};
    const summary = data?.summary || {};
    const liveSeatSummary = data?.liveSeatSummary || {};
    const items = Array.isArray(data?.items) ? data.items : [];
    renderCards([
      `
        <h2>My Results</h2>
        <p>Results stay wallet-bound and offchain. This view aggregates the tables your current house wallet has entered or settled.</p>
        <div class="pokerSummary">
          ${renderSummaryMetric('Tables', `${Number(summary?.tableCount || 0)}`)}
          ${renderSummaryMetric('Cash', `${Number(summary?.cashCount || 0)}`)}
          ${renderSummaryMetric('Tournaments', `${Number(summary?.tournamentCount || 0)}`)}
          ${renderSummaryMetric('Buy-Ins', `${Number(summary?.buyInOil || 0)} OIL`)}
          ${renderSummaryMetric('Reloads', `${Number(summary?.reloadOil || 0)} OIL`)}
          ${renderSummaryMetric('Returned', `${Number(summary?.returnedOil || 0)} OIL`)}
          ${renderSummaryMetric('Prizes', `${Number(summary?.prizeOil || 0)} OIL`)}
          ${renderSummaryMetric('Net', `${Number(summary?.netOil || 0)} OIL`)}
        </div>
        <div class="pokerLinks">
          <a href="${escapeHtml(buildPokerHref('/poker/play'))}">Back To Lobby</a>
        </div>
      `,
      `
        <h2>Tournament Stats</h2>
        <p>Native live-play tournament rollups for the current wallet only.</p>
        <div class="pokerSummary">
          ${renderSummaryMetric('Entries', `${Number(summary?.tournamentEntries || 0)}`)}
          ${renderSummaryMetric('Cashes', `${Number(summary?.tournamentCashes || 0)}`)}
          ${renderSummaryMetric('Wins', `${Number(summary?.tournamentWins || 0)}`)}
          ${renderSummaryMetric('ROI', `${Number(summary?.tournamentRoiPercent || 0)}%`)}
          ${renderSummaryMetric('Cash Net', `${Number(summary?.cashNetOil || 0)} OIL`)}
        </div>
      `,
      `
        <h2>Live Seat Summary</h2>
        <p>Current open seats for the bound wallet stay separate from the settled lifetime totals.</p>
        <div class="pokerSummary">
          ${renderSummaryMetric('Active Seats', `${Number(liveSeatSummary?.activeSeatCount || 0)}`)}
          ${renderSummaryMetric('Cash Seats', `${Number(liveSeatSummary?.cashSeatCount || 0)}`)}
          ${renderSummaryMetric('Tournament Seats', `${Number(liveSeatSummary?.tournamentSeatCount || 0)}`)}
          ${renderSummaryMetric('Live Stack', `${Number(liveSeatSummary?.stackOil || 0)} OIL`)}
        </div>
      `,
      `
        <h2>Seat History</h2>
        ${renderPlayResultRows(items)}
      `,
    ]);
    setStatus(items.length ? `${items.length} result row${items.length === 1 ? '' : 's'} loaded.` : 'No poker results available for this wallet yet.');
  }

  async function loadPlayTableHistory(tableId) {
    clearLiveTableStream();
    const filterStatus = String(getRouteSearchParams().get('status') || '').trim();
    setTitle('Poker Hand History', `Hand history for ${tableId}.`);
    setStatus('Loading hand history...');
    const payload = await api(buildPlayTableHistoryApiPath(tableId, { status: filterStatus }));
    const data = payload?.data || {};
    const table = data?.table || {};
    const items = Array.isArray(data?.items) ? data.items : [];
    renderCards([
      `
        <h2>${escapeHtml(table?.title || 'Hand History')}</h2>
        <p>Ordered hand history for one table. Only public action logs and viewer-allowed worker notes are exposed here.</p>
        <div class="pokerSummary">
          ${renderSummaryMetric('Viewer Mode', data?.viewerMode || 'player')}
          ${renderSummaryMetric('Table Type', table?.tableType || 'cash')}
          ${renderSummaryMetric('Rows', `${items.length}`)}
          ${renderSummaryMetric('Filter', filterStatus || 'all')}
        </div>
        <div class="pokerLinks">
          <a href="${escapeHtml(buildPokerHref(`/poker/play/tables/${encodeURIComponent(table?.tableId || tableId)}`))}">Back To Table</a>
          <a href="${escapeHtml(buildPokerHref(`/poker/play/tables/${encodeURIComponent(table?.tableId || tableId)}/history`))}">All Hands</a>
          <a href="${escapeHtml(buildPokerHref(`/poker/play/tables/${encodeURIComponent(table?.tableId || tableId)}/history`, { status: 'completed' }))}">Completed</a>
          <a href="${escapeHtml(buildPokerHref(`/poker/play/tables/${encodeURIComponent(table?.tableId || tableId)}/history`, { status: 'live' }))}">Live</a>
          <a href="${escapeHtml(buildPokerHref('/poker/play/results'))}">My Results</a>
        </div>
      `,
      `
        <h2>Hands</h2>
        ${renderPlayHandHistoryRows(items)}
      `,
    ]);
    setStatus(items.length ? `${items.length} hand history row${items.length === 1 ? '' : 's'} loaded.` : 'No hand history rows matched this filter.');
  }

  async function loadPlaySeriesTimeline(seriesId, { rail = false } = {}) {
    clearLiveTableStream();
    setTitle(rail ? 'Tournament Rail Timeline' : 'Tournament Timeline', `${rail ? 'Public' : 'Player'} timeline for ${seriesId}.`);
    setStatus('Loading series timeline...');
    const payload = await api(buildPlaySeriesTimelineApiPath(seriesId, { rail }));
    const data = payload?.data || {};
    const series = data?.series || {};
    const summary = data?.summary || {};
    let adminTimeline = [];
    if (!rail) {
      const adminToken = readStoredPokerAdminToken();
      if (adminToken) {
        try {
          const reviewPayload = await api(`/api/poker/play/admin/series/${encodeURIComponent(seriesId)}/review`, {
            headers: { 'x-admin-token': adminToken },
          });
          adminTimeline = buildAdminSeriesTimelineItems(reviewPayload?.data || {});
        } catch {
          adminTimeline = [];
        }
      }
    }
    renderCards([
      `
        <h2>${escapeHtml(series?.seriesTitle || 'Tournament Timeline')}</h2>
        <p>One ordered series-wide narrative across table starts, moves, disputes, payouts, refunds, and closure.</p>
        <div class="pokerSummary">
          ${renderSummaryMetric('Viewer Mode', data?.viewerMode || (rail ? 'public' : 'player'))}
          ${renderSummaryMetric('Stage', series?.stage || 'unknown')}
          ${renderSummaryMetric('Tables', `${Number(series?.tableCount || summary?.tableCount || 0)}`)}
          ${renderSummaryMetric('Events', `${Number(summary?.eventCount || 0)}`)}
          ${renderSummaryMetric('Entrants', `${Number(series?.entryCount || 0)}`)}
          ${renderSummaryMetric('Prize Pool', `${Number(series?.prizePoolOil || 0)} OIL`)}
        </div>
        <div class="pokerLinks">
          <a href="${escapeHtml(buildPokerHref(rail ? '/poker/play/rail' : '/poker/play'))}">${rail ? 'Back To Rail' : 'Back To Lobby'}</a>
          ${series?.activeTableId ? `<a href="${escapeHtml(buildPokerHref(`${rail ? '/poker/play/rail/tables' : '/poker/play/tables'}/${encodeURIComponent(series.activeTableId)}`))}">${rail ? 'Open Rail Table' : 'Open Series Table'}</a>` : ''}
          ${rail ? '' : `<a href="${escapeHtml(buildPokerHref(`/poker/play/rail/series/${encodeURIComponent(seriesId)}/timeline`))}">Open Public Timeline</a>`}
        </div>
      `,
      `
        <h2>${rail ? 'Public Timeline' : 'Player Timeline'}</h2>
        ${renderTimelineRows(data?.items, { emptyText: 'No series timeline rows yet.' })}
      `,
      !rail && adminTimeline.length ? `
        <h2>Operator Timeline</h2>
        <p>Operator review uses the same durable audit rows, with private bodies visible only to admin review.</p>
        ${renderTimelineRows(adminTimeline, { emptyText: 'No operator-only timeline rows yet.' })}
      ` : '',
    ].filter(Boolean));
    setStatus(Number(summary?.eventCount || 0) > 0 ? `${Number(summary?.eventCount || 0)} series timeline row${Number(summary?.eventCount || 0) === 1 ? '' : 's'} loaded.` : 'No series timeline rows available.');
  }

  async function loadPlayIntegrityQueue() {
    clearLiveTableStream();
    const adminToken = readStoredPokerAdminToken();
    setTitle('Integrity Queue', 'Operator review queue for automated suspicious-play flags.');
    if (!adminToken) {
      setStatus('Poker admin token required.');
      renderCards([
        '<h2>Integrity Queue</h2><p>Set `poker.adminToken` in local storage before opening the operator integrity queue.</p>',
      ]);
      return;
    }
    const filterStatus = String(getRouteSearchParams().get('status') || 'open').trim() || 'open';
    setStatus('Loading integrity queue...');
    const payload = await api(buildPlayIntegrityQueueApiPath({ status: filterStatus }), {
      headers: { 'x-admin-token': adminToken },
    });
    const data = payload?.data || {};
    const summary = data?.summary || {};
    const items = Array.isArray(data?.items) ? data.items : [];
    renderCards([
      `
        <h2>Integrity Queue</h2>
        <p>Automated suspicious-play flags stay durable and operator-resolved. This queue is summary-only and never includes private seat-thread bodies.</p>
        <div class="pokerSummary">
          ${renderSummaryMetric('Open', `${Number(summary?.openFlagCount || 0)}`)}
          ${renderSummaryMetric('Resolved', `${Number(summary?.resolvedFlagCount || 0)}`)}
          ${renderSummaryMetric('Dismissed', `${Number(summary?.dismissedFlagCount || 0)}`)}
          ${renderSummaryMetric('Visible Rows', `${Number(summary?.eventCount || items.length || 0)}`)}
          ${renderSummaryMetric('Tables', `${Number(summary?.tableCount || 0)}`)}
        </div>
        <div class="pokerLinks">
          <a href="${escapeHtml(buildPokerHref('/poker/play/admin/integrity'))}">Open</a>
          <a href="${escapeHtml(buildPokerHref('/poker/play/admin/integrity', { status: 'all' }))}">All</a>
          <a href="${escapeHtml(buildPokerHref('/poker/play/admin/integrity', { status: 'resolved' }))}">Resolved</a>
          <a href="${escapeHtml(buildPokerHref('/poker/play/admin/integrity', { status: 'dismissed' }))}">Dismissed</a>
          <a href="${escapeHtml(buildPokerHref('/poker/play'))}">Back To Lobby</a>
        </div>
      `,
      `
        <h2>Flags</h2>
        ${renderIntegrityFlagRows(items)}
      `,
    ]);
    bindIntegrityQueueActions(filterStatus);
    setStatus(items.length ? `${items.length} integrity flag row${items.length === 1 ? '' : 's'} loaded.` : 'No integrity flags matched this filter.');
  }

  function bindPlayMatchmakeForm() {
    const form = document.getElementById('pokerPlayMatchmakeForm');
    if (!form) return;
    const typeEl = document.getElementById('pokerPlayMatchmakeType');
    const smallBlindEl = document.getElementById('pokerPlayMatchmakeSmallBlind');
    const bigBlindEl = document.getElementById('pokerPlayMatchmakeBigBlind');
    const buyInEl = document.getElementById('pokerPlayMatchmakeBuyIn');
    const applyDefaults = () => {
      const tableType = String(typeEl?.value || 'cash');
      if (!smallBlindEl || !bigBlindEl || !buyInEl) return;
      if (tableType === 'tournament') {
        if (String(smallBlindEl.value || '') === '10') smallBlindEl.value = '50';
        if (String(bigBlindEl.value || '') === '20') bigBlindEl.value = '100';
        if (String(buyInEl.value || '') === '400') buyInEl.value = '300';
      } else {
        if (String(smallBlindEl.value || '') === '50') smallBlindEl.value = '10';
        if (String(bigBlindEl.value || '') === '100') bigBlindEl.value = '20';
        if (String(buyInEl.value || '') === '300') buyInEl.value = '400';
      }
    };
    if (typeEl) typeEl.addEventListener('change', applyDefaults);
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setStatus('Finding a matching live table...');
      try {
        const payload = await api('/api/poker/play/matchmake', {
          method: 'POST',
          body: JSON.stringify({
            tableType: String(typeEl?.value || 'cash'),
            smallBlindOil: Number(smallBlindEl?.value || 0),
            bigBlindOil: Number(bigBlindEl?.value || 0),
            buyInOil: Number(buyInEl?.value || 0),
            displayName: String(document.getElementById('pokerPlayMatchmakeDisplayName')?.value || '').trim(),
          }),
        });
        const tableId = String(payload?.data?.table?.tableId || '');
        if (!tableId) throw new Error('POKER_PLAY_MATCHMAKE_MISSING_TABLE');
        window.location.assign(buildPokerHref(`/poker/play/tables/${encodeURIComponent(tableId)}`));
      } catch (err) {
        setStatus(`Quick seat failed: ${err.code || err.message || 'UNKNOWN'}`);
      }
    });
  }

  function renderPlayTableCards(data, { rail = false } = {}) {
    const table = data?.table || {};
    const series = data?.series || null;
    const hand = data?.hand || null;
    const mySeat = data?.mySeat || null;
    const seats = Array.isArray(data?.seats) ? data.seats : [];
    const actions = Array.isArray(data?.actions) ? data.actions : [];
    const messages = Array.isArray(data?.messages) ? data.messages : [];
    const review = data?.review || {};
    const waitlist = data?.waitlist || {};
    const myDisputes = Array.isArray(review?.myDisputes) ? review.myDisputes : [];
    const adminReview = data?.adminReview || null;
    const adminOpenDisputes = Array.isArray(adminReview?.disputes)
      ? adminReview.disputes.filter((dispute) => String(dispute?.status || '') === 'open')
      : [];
    const oilBalance = Number(data?.oilBalance?.balance || 0);
    const viewerMode = rail ? 'public' : String(data?.viewerMode || 'player');
    const publicRail = viewerMode === 'public';
    const paused = String(table?.status || 'open') === 'paused';
    const adminClosed = String(table?.status || '').toLowerCase() === 'admin_closed';
    const tableOpen = String(table?.status || 'open') === 'open';
    const canJoin = !publicRail && tableOpen && !mySeat && Number(table?.summary?.openSeatCount || 0) > 0;
    const canWaitlist = !publicRail && tableOpen && !mySeat && Number(table?.summary?.openSeatCount || 0) <= 0 && table?.tableType === 'cash';
    const hasOpenMyHandDispute = !!(hand && myDisputes.some((dispute) => String(dispute?.handId || '') === String(hand.handId || '') && String(dispute?.status || '') === 'open'));
    const cards = [
      `
        <h2>${escapeHtml(table?.title || 'Live Table')}</h2>
        <p>${escapeHtml(
          adminClosed
            ? (table?.state?.closeReason || 'Table closed by operator.')
            : paused
            ? (table?.state?.pausedReason ? `Table paused: ${table.state.pausedReason}` : 'Table paused by operator.')
            : (table?.summary?.completedAt ? 'Previous cycle complete. Seats can rotate back in for the next match.' : (table?.summary?.liveHand ? 'A live hand is in progress.' : 'Waiting for enough players to post blinds.'))
        )}</p>
        <div class="pokerSummary">
          ${renderSummaryMetric('Type', table?.tableType || 'cash')}
          ${renderSummaryMetric('Status', paused ? 'paused' : (table?.status || 'open'))}
          ${renderSummaryMetric('Blinds', `${Number(table?.smallBlindOil || 0)} / ${Number(table?.bigBlindOil || 0)}`)}
          ${renderSummaryMetric('Buy-In', `${Number(table?.buyInOil || 0)} OIL`)}
          ${table?.tableType === 'tournament' ? renderSummaryMetric('Level', `${Number(table?.summary?.blindLevel || hand?.blindLevel || 0) || 1}`) : ''}
          ${table?.tableType === 'tournament' ? renderSummaryMetric('Next Level', Number(table?.summary?.nextBlindLevel || 0) > 0 ? `${Number(table?.summary?.nextBlindLevel || 0)}` : 'final') : ''}
          ${table?.tableType === 'tournament' ? renderSummaryMetric('Hands To Next', Number(table?.summary?.nextBlindLevel || 0) > 0 ? `${Number(table?.summary?.handsUntilBlindIncrease || 0)}` : '0') : ''}
          ${table?.tableType === 'tournament' && table?.summary?.scheduledStartAt ? renderSummaryMetric('Scheduled Start', formatIso(table?.summary?.scheduledStartAt)) : ''}
          ${table?.tableType === 'tournament' ? renderSummaryMetric('Late Reg', table?.summary?.lateRegistrationOpen ? 'open' : 'closed') : ''}
          ${table?.tableType === 'tournament' ? renderSummaryMetric('Late Reg Hands', `${Number(table?.summary?.lateRegistrationRemainingHands || 0)}`) : ''}
          ${table?.tableType === 'tournament' ? renderSummaryMetric('Entries', `${Number(table?.summary?.entryCount || 0)}`) : ''}
          ${table?.tableType === 'tournament' && Number(table?.summary?.reentryLimit || 0) > 0 ? renderSummaryMetric('Re-Entry', `${Number(table?.summary?.acceptedReentryCount || 0)}/${Number(table?.summary?.reentryLimit || 0)}`) : ''}
          ${table?.tableType === 'tournament' ? renderSummaryMetric('Prize Pool', `${Number(table?.summary?.prizePoolOil || 0)} OIL`) : ''}
          ${table?.tableType === 'tournament' ? renderSummaryMetric('Paid Places', `${Number(table?.summary?.paidPlaces || 0)}`) : ''}
          ${Number(table?.summary?.waitlistCount || 0) > 0 ? renderSummaryMetric('Waitlist', `${Number(table?.summary?.waitlistCount || 0)}`) : ''}
          ${Number(table?.summary?.disconnectedSeatCount || 0) > 0 ? renderSummaryMetric('Disconnected', `${Number(table?.summary?.disconnectedSeatCount || 0)}`) : ''}
          ${publicRail ? renderSummaryMetric('Viewer Mode', 'public rail') : renderSummaryMetric('Your OIL', `${oilBalance}`)}
          ${adminClosed ? renderSummaryMetric('Refunded', `${Number(table?.state?.refundedTotalOil || 0)} OIL`) : ''}
        </div>
        ${renderMetaBadges([
          `${Number(table?.summary?.occupancy || 0)}/${Number(table?.maxSeats || 6)} seated`,
          table?.summary?.liveHand ? `hand ${Number(table?.summary?.handNumber || 0)}` : 'waiting',
          table?.summary?.winnerSeatNumber ? `winner seat ${Number(table?.summary?.winnerSeatNumber || 0)}` : '',
        ].filter(Boolean))}
        ${publicRail ? `
          <div class="pokerLinks">
            <a href="${escapeHtml(buildPokerHref('/poker/play/rail'))}">Back To Rail</a>
            <a href="${escapeHtml(buildPokerHref(`/poker/play/tables/${encodeURIComponent(table?.tableId || '')}`))}">Open Player Table</a>
          </div>
        ` : `
          <div class="pokerLinks">
            <a href="${escapeHtml(buildPokerHref('/poker/play'))}">Back To Lobby</a>
            <a href="${escapeHtml(buildPokerHref(`/poker/play/tables/${encodeURIComponent(table?.tableId || '')}/history`, { status: 'completed' }))}">Hand History</a>
            <a href="${escapeHtml(buildPokerHref('/poker/play/results'))}">My Results</a>
            ${series && table?.tableType === 'tournament' ? `<a href="${escapeHtml(buildPokerHref(`/poker/play/series/${encodeURIComponent(series?.seriesId || '')}/timeline`))}">Series Timeline</a>` : ''}
          </div>
        `}
      `,
      publicRail ? `
        <h2>Rail View</h2>
        <p>Watching public table state only. Private seat-thread discussion and seat-only actions stay hidden here, even while the hand is live.</p>
      ` : '',
      `
        <h2>Seats</h2>
        ${renderSeatMarkers(seats)}
      `,
    ].filter(Boolean);

    if (canJoin) {
      const nextOpenSeat = seats.map((seat) => Number(seat.seatNumber || 0));
      const options = Array.from({ length: Number(table?.maxSeats || 6) }, (_value, index) => index + 1)
        .filter((seat) => !nextOpenSeat.includes(seat))
        .map((seat) => `<option value="${seat}">Seat ${seat}</option>`)
        .join('');
      cards.push(`
        <h2>Take A Seat</h2>
        <p>Buying in starts a private human + agent thread for your seat. Other players only see your public actions, not your private discussion.</p>
        <form id="pokerPlayJoinForm" class="pokerForm">
          <label>
            Seat
            <select id="pokerPlaySeatNumber">${options}</select>
          </label>
          <label>
            Display Name
            <input id="pokerPlayDisplayName" maxlength="80" value="${escapeHtml(data?.houseId || 'House Seat')}">
          </label>
          <label>
            Buy-In OIL
            <input id="pokerPlayBuyInOil" type="number" min="${Number(table?.buyInOil || 0)}" value="${Number(table?.buyInOil || 0)}">
          </label>
          <button class="pokerButton" type="submit">Join Table</button>
        </form>
      `);
    }

    if (canWaitlist) {
      cards.push(`
        <h2>Waitlist</h2>
        <p>The table is full. Queue a buy-in and the first eligible waiting wallet is promoted when a seat opens.</p>
        ${waitlist?.viewerQueued
          ? `
            <div class="pokerSummary">
              ${renderSummaryMetric('Position', `${Number(waitlist?.viewerPosition || 0)}`)}
              ${renderSummaryMetric('Queue', `${Number(waitlist?.count || 0)}`)}
            </div>
            <div class="pokerLinks">
              <button id="pokerPlayLeaveWaitlistButton" class="pokerButton" type="button">Leave Waitlist</button>
            </div>
          `
          : `
            <form id="pokerPlayWaitlistForm" class="pokerForm">
              <label>
                Display Name
                <input id="pokerPlayWaitlistDisplayName" maxlength="80" value="${escapeHtml(data?.houseId || 'House Seat')}">
              </label>
              <label>
                Buy-In OIL
                <input id="pokerPlayWaitlistBuyInOil" type="number" min="${Number(table?.buyInOil || 0)}" value="${Number(table?.buyInOil || 0)}">
              </label>
              <button class="pokerButton" type="submit">Join Waitlist</button>
            </form>
          `}
      `);
    }

    if (mySeat) {
      const seatStatus = formatPlaySeatStatus(mySeat.status);
      const leaveQueued = String(mySeat.status || '') === 'leaving_after_hand';
      const seatSittingOut = String(mySeat.status || '') === 'sitting_out' || String(mySeat.status || '') === 'sitting_out_next_hand';
      const seatAway = String(mySeat.status || '') === 'away' || String(mySeat.status || '') === 'away_next_hand';
      cards.push(`
        <h2>Your Seat</h2>
        <div class="pokerSummary">
          ${renderSummaryMetric('Seat', `${Number(mySeat.seatNumber || 0)}`)}
          ${renderSummaryMetric('Stack', `${Number(mySeat.stackOil || 0)} OIL`)}
          ${renderSummaryMetric('Status', seatStatus)}
          ${renderSummaryMetric('Role', hand?.actingSeat === Number(mySeat.seatNumber || 0) ? 'acting now' : 'waiting')}
          ${mySeat?.finishPosition ? renderSummaryMetric('Finish', `${Number(mySeat.finishPosition || 0)}`) : ''}
          ${Number(mySeat?.prizeOil || 0) > 0 ? renderSummaryMetric('Prize', `${Number(mySeat.prizeOil || 0)} OIL`) : ''}
        </div>
        ${String(mySeat.status || '').toLowerCase() === 'registered' ? '<p>Your buy-in is posted. You are registered for the next hand and can use the seat thread before cards are dealt to you.</p>' : ''}
        ${table?.tableType === 'tournament' && String(mySeat.status || '').toLowerCase() === 'busted' && Number(table?.summary?.reentryLimit || 0) > 0 ? '<p>Your last tournament entry busted. Re-entry stays available until late registration closes or the table schedule locks.</p>' : ''}
        ${leaveQueued ? '<p>Your cash-out is queued. You stay in this hand, then your remaining stack returns to OIL automatically.</p>' : ''}
        ${seatSittingOut ? '<p>Your seat is marked to sit out. You keep the same wallet-bound seat and can return without rebuying.</p>' : ''}
        ${seatAway ? '<p>Your seat is marked away. The wallet-bound seat stays yours until you return or cash out.</p>' : ''}
        ${adminClosed ? `<p>This table was closed by an operator.${Number(table?.state?.refundedTotalOil || 0) > 0 ? ` Refunds issued: ${Number(table?.state?.refundedTotalOil || 0)} OIL total.` : ''}</p>` : ''}
        ${mySeat?.finishPosition ? `<p>You currently hold finish position ${Number(mySeat.finishPosition || 0)}.${Number(mySeat?.prizeOil || 0) > 0 ? ` Prize paid: ${Number(mySeat.prizeOil || 0)} OIL.` : ''}</p>` : ''}
        ${adminClosed ? '' : `
          <div class="pokerLinks">
            ${table?.tableType === 'cash' ? `<button id="pokerPlaySitOutButton" class="pokerButton" type="button"${seatSittingOut || seatAway ? ' disabled' : ''}>Sit Out Next Hand</button>` : ''}
            ${table?.tableType === 'cash' ? `<button id="pokerPlayAwayButton" class="pokerButton" type="button"${seatAway ? ' disabled' : ''}>Mark Away</button>` : ''}
            ${table?.tableType === 'cash' ? `<button id="pokerPlayReturnButton" class="pokerButton" type="button"${(!seatSittingOut && !seatAway) ? ' disabled' : ''}>Return To Table</button>` : ''}
            <button id="pokerPlayLeaveButton" class="pokerButton" type="button"${leaveQueued ? ' disabled' : ''}>${table?.tableType === 'cash' ? (leaveQueued ? 'Cash Out Queued' : (hand ? 'Leave After Hand' : 'Cash Out & Leave')) : 'Leave Seat'}</button>
            ${table?.tableType === 'tournament' && String(mySeat.status || '').toLowerCase() === 'busted' && Number(table?.summary?.reentryLimit || 0) > 0 ? `<button id="pokerPlayReenterButton" class="pokerButton" type="button"${table?.summary?.lateRegistrationOpen || String(table?.status || '') === 'scheduled' ? '' : ' disabled'}>Re-Enter Tournament</button>` : ''}
          </div>
          ${table?.tableType === 'cash' ? `
            <form id="pokerPlayReloadForm" class="pokerForm">
              <label>
                Reload OIL
                <input id="pokerPlayReloadAmount" type="number" min="1" value="${Number(table?.bigBlindOil || 0)}">
              </label>
              <button class="pokerButton" type="submit">Reload Stack</button>
            </form>
          ` : ''}
        `}
      `);
    }

    if (Number(review?.openDisputeCount || 0) > 0 || myDisputes.length) {
      cards.push(`
        <h2>Table Review</h2>
        <div class="pokerSummary">
          ${renderSummaryMetric('Status', review?.status || 'clear')}
          ${renderSummaryMetric('Open Disputes', `${Number(review?.openDisputeCount || 0)}`)}
          ${renderSummaryMetric('Current Hand', `${Number(review?.currentHandOpenDisputeCount || 0)}`)}
        </div>
        ${review?.latestAuditEvent ? `<p>Latest audit event: <strong>${escapeHtml(review.latestAuditEvent.eventKind || 'review')}</strong> at ${escapeHtml(review.latestAuditEvent.createdAt || '')}</p>` : ''}
        ${myDisputes.length ? `
          <div class="pokerStack">
            ${myDisputes.map((dispute) => `
              <div class="pokerMessage">
                <div class="pokerLabel">${escapeHtml(dispute.seatLabel || 'Seat')} · ${escapeHtml(dispute.category || 'general')} · ${escapeHtml(dispute.status || 'open')}</div>
                <div>${escapeHtml(dispute.note || '')}</div>
                ${dispute.resolutionNote ? `<div class="pokerLabel">Resolution: ${escapeHtml(dispute.resolutionNote)}</div>` : ''}
              </div>
            `).join('')}
          </div>
        ` : '<p>No seat dispute from you on this table.</p>'}
      `);
    }

    if (series && table?.tableType === 'tournament') {
      cards.push(`
        <h2>Series Director</h2>
        <div class="pokerSummary">
          ${renderSummaryMetric('Series Tables', `${Number(series?.tableCount || 0)}`)}
          ${renderSummaryMetric('Target Tables', `${Number(series?.targetTableCount || 0)}`)}
          ${renderSummaryMetric('Stage', series?.stage || 'seating')}
          ${renderSummaryMetric('Break Pending', series?.needsRebalance ? 'yes' : 'no')}
          ${series?.scheduledStartAt ? renderSummaryMetric('Scheduled Start', formatIso(series?.scheduledStartAt)) : ''}
          ${renderSummaryMetric('Entries', `${Number(series?.entryCount || 0)}`)}
          ${Number(series?.acceptedReentryCount || 0) > 0 || Number(table?.summary?.reentryLimit || 0) > 0 ? renderSummaryMetric('Re-Entries', `${Number(series?.acceptedReentryCount || 0)}`) : ''}
          ${renderSummaryMetric('Prize Pool', `${Number(series?.prizePoolOil || 0)} OIL`)}
          ${renderSummaryMetric('Paid Places', `${Number(series?.paidPlaces || 0)}`)}
          ${Number(series?.refundedTotalOil || 0) > 0 ? renderSummaryMetric('Refunded', `${Number(series?.refundedTotalOil || 0)} OIL`) : ''}
        </div>
        ${renderSeriesClosureNotice(series)}
        ${String(series?.stage || '') === 'cancelled'
          ? '<p>No active tables remain in this series. Operator review and export stay available on the closed table records.</p>'
          : series?.pendingBreakTableId
          ? `<p>${escapeHtml(series.pendingBreakTableId)} is the current break candidate with ${Number(series?.pendingBreakSeatCount || 0)} active seat${Number(series?.pendingBreakSeatCount || 0) === 1 ? '' : 's'}${series?.pendingBreakBlockedByLiveTable ? '; the table must finish its live hand before seats can move.' : '.'}</p>`
          : (series?.needsRebalance
            ? `<p>Director target: rebalance toward ${Number(series?.targetTableCount || 0)} table${Number(series?.targetTableCount || 0) === 1 ? '' : 's'} across the current live field.</p>`
            : '<p>The tournament series is currently balanced for its active field.</p>')}
        <div class="pokerLabel">Payout Ladder</div>
        ${renderPayoutPlan(series?.payouts)}
        ${Array.isArray(series?.standings) && series.standings.length ? `
          <div class="pokerLabel">Final Placements</div>
          ${renderSeriesStandings(series.standings)}
        ` : ''}
        <div class="pokerLinks">
          <a href="${escapeHtml(buildPokerHref(`/poker/play/series/${encodeURIComponent(series?.seriesId || '')}/timeline`))}">Series Timeline</a>
          <a href="${escapeHtml(buildPokerHref(`/poker/play/rail/series/${encodeURIComponent(series?.seriesId || '')}/timeline`))}">Public Timeline</a>
        </div>
      `);
    }

    if (hand) {
      cards.push(`
        <h2>Current Hand</h2>
        <div class="pokerSummary">
          ${renderSummaryMetric('Hand', `${Number(hand.handNumber || 0)}`)}
          ${renderSummaryMetric('Pot', `${Number(hand.potOil || 0)} OIL`)}
          ${renderSummaryMetric('Street', hand.street || 'preflop')}
          ${renderSummaryMetric('Acting Seat', hand.actingSeat ? `Seat ${Number(hand.actingSeat || 0)}` : 'none')}
          ${mySeat ? renderSummaryMetric('Time Bank', `${Number(hand.timeBankRemainingSeconds || 0)}s`) : ''}
        </div>
        <div class="pokerSplit">
          <div>
            <div class="pokerLabel">Board</div>
            ${renderPokerCards(hand.communityCards || [])}
          </div>
          <div>
            <div class="pokerLabel">Decision Clock</div>
            <div id="centaurCountdownValue" class="pokerCountdown">--</div>
          </div>
          <div>
            <div class="pokerLabel">Result</div>
            <div>${escapeHtml(hand?.result?.note || 'Hand is live.')}</div>
          </div>
        </div>
        ${renderMatchedPots(hand?.result)}
        ${seats.some((seat) => seat.isActing && seat.presenceStatus === 'disconnected') ? '<p>The acting seat is disconnected. The reconnect grace window is holding the clock before timeout action takes over.</p>' : ''}
      `);
    }

    if (!publicRail && !adminClosed && mySeat && hand) {
      const proposal = data?.agentProposal && typeof data.agentProposal === 'object' ? data.agentProposal : null;
      cards.push(`
        <h2>Worker Seat Agent</h2>
        ${proposal
          ? `
            <div class="pokerSummary">
              ${renderSummaryMetric('Action', proposal.actionKind || 'hold')}
              ${renderSummaryMetric('Amount', `${Number(proposal.amountOil || 0)} OIL`)}
              ${renderSummaryMetric('Confidence', proposal.confidence || 'medium')}
            </div>
            <p>${escapeHtml(proposal.body || 'No worker proposal body recorded.')}</p>
          `
          : '<p>No worker proposal is persisted for this hand yet. Request one from the in-browser worker to keep the strategic line on the runtime path.</p>'}
        <div class="pokerLinks">
          <button id="pokerSeatAgentProposeButton" class="pokerButton" type="button">Request Worker Line</button>
          ${proposal ? '<button id="pokerSeatAgentCommitButton" class="pokerButton" type="button">Commit Worker Action</button>' : ''}
        </div>
      `);
    }

    if (data?.suggestion && mySeat && !data?.agentProposal) {
      cards.push(`
        <h2>Your Agent Line</h2>
        <p>${escapeHtml(data.suggestion.body || 'No suggestion yet.')}</p>
      `);
    }

    if (!publicRail && !adminClosed && mySeat && hand) {
      cards.push(`
        <h2>Flag Hand For Review</h2>
        <p>Use this for rule, turn-order, disconnect, or settlement issues. Filing a review pauses the table for operator inspection.</p>
        ${hasOpenMyHandDispute ? '<p>You already flagged this hand for review.</p>' : ''}
        <form id="pokerPlayDisputeForm" class="pokerForm">
          <label>
            Category
            <select id="pokerPlayDisputeCategory">
              <option value="general">General</option>
              <option value="rule_misread">Rule Misread</option>
              <option value="bet_size">Bet Size</option>
              <option value="turn_order">Turn Order</option>
              <option value="disconnect">Disconnect</option>
              <option value="settlement">Settlement</option>
              <option value="conduct">Conduct</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            Review note
            <textarea id="pokerPlayDisputeNote" placeholder="Describe the issue and the seat/action involved."></textarea>
          </label>
          <button id="pokerPlayDisputeSubmit" class="pokerButton" type="submit"${hasOpenMyHandDispute ? ' disabled' : ''}>Flag Hand For Review</button>
        </form>
      `);
    }

    if (!publicRail && !adminClosed && mySeat && hand) {
      cards.push(`
        <h2>Seat Thread</h2>
        <div class="pokerStack">
          ${messages.length ? messages.map((message) => `
            <div class="pokerMessage ${message.authorRole === 'agent' ? 'is-agent' : ''}">
              <div class="pokerLabel">${escapeHtml(message.authorRole)}</div>
              <div>${escapeHtml(message.body)}</div>
            </div>
          `).join('') : '<p>No private thread yet.</p>'}
        </div>
        <form id="pokerPlayMessageForm" class="pokerForm">
          <label>
            Discuss the next line
            <textarea id="pokerPlayMessageBody" placeholder="What line are we taking into this spot?"></textarea>
          </label>
          <button class="pokerButton" type="submit">Send To Agent Thread</button>
        </form>
      `);
    }

    if (!publicRail && !adminClosed && mySeat && hand && paused) {
      cards.push(`
        <h2>Submit Action</h2>
        <p>Table play is paused by an operator. Your seat thread remains visible, but no new poker action can be submitted until the table resumes.</p>
      `);
    } else if (!publicRail && !adminClosed && mySeat && hand && Array.isArray(hand.viewerAllowedActions) && hand.viewerAllowedActions.length) {
      cards.push(`
        <h2>Submit Action</h2>
        <div class="pokerStack">
          ${actions.length ? actions.slice(-8).map((action) => `
            <div class="pokerRow">
              <span>${escapeHtml(action.seatLabel || 'Seat')}</span>
              <span>${escapeHtml(action.actionKind || 'act')}</span>
              <span>${Number(action.amountOil || 0)} OIL</span>
            </div>
          `).join('') : '<p>No public actions logged yet.</p>'}
        </div>
        <form id="pokerPlayActionForm" class="pokerForm">
          <label>
            Action
            <select id="pokerPlayActionKind">${renderActionOptions(hand.viewerAllowedActions)}</select>
          </label>
          <label>
            Amount OIL
            <input id="pokerPlayActionAmount" type="number" min="0" value="${Number(hand.minRaiseToOil || hand.requiredCallOil || 0)}">
          </label>
          ${hand.canUseTimeBank ? `<button id="pokerPlayTimeBankButton" class="pokerButton" type="button">Use Time Bank (+${Number(hand.timeBankRemainingSeconds || 0)}s)</button>` : ''}
          <button class="pokerButton" type="submit">Submit Action</button>
        </form>
      `);
    } else if (publicRail || actions.length) {
      cards.push(`
        <h2>Public Action Log</h2>
        ${renderPublicActionLog(actions)}
      `);
    }

    if (adminReview) {
      cards.push(`
        <h2>Operator Review</h2>
        <div class="pokerSummary">
          ${renderSummaryMetric('Review Hand', adminReview?.reviewHand?.handId || adminReview?.activeHand?.handId || 'none')}
          ${renderSummaryMetric('Open Disputes', `${Number(adminReview?.openDisputes?.length || 0)}`)}
          ${renderSummaryMetric('Open Integrity Flags', `${Number(adminReview?.integritySummary?.openFlagCount || 0)}`)}
          ${renderSummaryMetric('Audit Events', `${Number(adminReview?.auditEvents?.length || 0)}`)}
        </div>
        <div class="pokerLinks">
          <a href="${escapeHtml(buildPokerHref('/poker/play/admin/integrity'))}">Integrity Queue</a>
          ${adminClosed ? '' : `<button class="pokerButton" type="button" data-admin-table-close="1" data-admin-table-id="${escapeHtml(table?.tableId || '')}">Close + Refund</button>`}
          ${!adminClosed && series && table?.tableType === 'tournament' ? `<button class="pokerButton" type="button" data-admin-series-close="1" data-admin-series-id="${escapeHtml(series?.seriesId || '')}" data-admin-series-table-id="${escapeHtml(table?.tableId || '')}">Cancel Series + Refund</button>` : ''}
          ${!adminClosed && series && table?.tableType === 'tournament' && table?.summary?.lateRegistrationOpen ? `<button class="pokerButton" type="button" data-admin-series-registration-close="1" data-admin-series-id="${escapeHtml(series?.seriesId || '')}">Close Registration</button>` : ''}
          ${!adminClosed && series && table?.tableType === 'tournament' && series?.needsRebalance ? `<button class="pokerButton" type="button" data-admin-series-rebalance="1" data-admin-series-id="${escapeHtml(series?.seriesId || '')}">Rebalance Series</button>` : ''}
          ${!adminClosed && series && table?.tableType === 'tournament' && series?.pendingBreakTableId ? `<button class="pokerButton" type="button" data-admin-series-break-table="1" data-admin-series-id="${escapeHtml(series?.seriesId || '')}" data-admin-break-table-id="${escapeHtml(series?.pendingBreakTableId || '')}">Break Pending Table</button>` : ''}
          ${!adminClosed && table?.tableType === 'tournament' && String(table?.status || '') === 'scheduled' ? `<button class="pokerButton" type="button" data-admin-table-start="1" data-admin-table-id="${escapeHtml(table?.tableId || '')}">Start Table</button>` : ''}
          ${series && table?.tableType === 'tournament' ? `<button class="pokerButton" type="button" data-admin-series-export="1" data-admin-series-id="${escapeHtml(series?.seriesId || '')}">Export Series Review</button>` : ''}
          <button class="pokerButton" type="button" data-admin-export="1" data-admin-table-id="${escapeHtml(table?.tableId || '')}">Export Review</button>
          ${paused || adminClosed ? '' : `<button class="pokerButton" type="button" data-admin-table-pause="1" data-admin-table-id="${escapeHtml(table?.tableId || '')}">Pause Table</button>`}
          ${paused ? `<button class="pokerButton" type="button" data-admin-table-resume="1" data-admin-table-id="${escapeHtml(table?.tableId || '')}">Resume Table</button>` : ''}
        </div>
        ${series && table?.tableType === 'tournament' && Array.isArray(series?.tableIds) && series.tableIds.length > 1 ? `
          <form id="pokerDirectorMoveSeatForm" class="pokerForm">
            <label>
              Move seat
              <input id="pokerDirectorMoveSeatNumber" type="number" min="1" max="${Number(table?.maxSeats || 6)}" value="1">
            </label>
            <label>
              Target table
              <select id="pokerDirectorMoveTargetTable">
                ${series.tableIds.filter((id) => String(id || '') !== String(table?.tableId || '')).map((id) => `<option value="${escapeHtml(id)}">${escapeHtml(id)}</option>`).join('')}
              </select>
            </label>
            <label>
              Target seat
              <input id="pokerDirectorMoveTargetSeat" type="number" min="1" max="6" value="1">
            </label>
            <button class="pokerButton" type="submit">Move Seat</button>
          </form>
        ` : ''}
        <div class="pokerStack">
          ${adminOpenDisputes.length ? adminOpenDisputes.map((dispute) => `
            <div class="pokerMessage">
              <div class="pokerLabel">${escapeHtml(dispute.seatLabel || 'Seat')} · ${escapeHtml(dispute.category || 'general')} · ${escapeHtml(dispute.status || 'open')}</div>
              <div>${escapeHtml(dispute.note || '')}</div>
              <div class="pokerLinks">
                <button class="pokerButton" type="button" data-dispute-action="resolved" data-dispute-id="${escapeHtml(dispute.disputeId || '')}">Resolve</button>
                <button class="pokerButton" type="button" data-dispute-action="dismissed" data-dispute-id="${escapeHtml(dispute.disputeId || '')}">Dismiss</button>
                <button class="pokerButton" type="button" data-dispute-action="resolved_resume" data-dispute-id="${escapeHtml(dispute.disputeId || '')}">Resolve + Resume</button>
              </div>
            </div>
          `).join('') : '<p>No disputes on the selected hand.</p>'}
        </div>
        <div class="pokerStack">
          ${Array.isArray(adminReview?.integrityFlags) && adminReview.integrityFlags.length ? adminReview.integrityFlags.map((flag) => `
            <div class="pokerMessage">
              <div class="pokerLabel">${escapeHtml(flag.category || 'flag')} · ${escapeHtml(flag.severity || 'medium')} · ${escapeHtml(flag.status || 'open')}</div>
              <div>${escapeHtml(flag.summary || 'No integrity summary available.')}</div>
            </div>
          `).join('') : '<p>No integrity flags on this table.</p>'}
        </div>
        <div class="pokerStack">
          ${Array.isArray(adminReview?.auditEvents) && adminReview.auditEvents.length ? adminReview.auditEvents.slice(0, 12).map((event) => `
            <div class="pokerRow">
              <span>${escapeHtml(event.eventKind || 'event')}</span>
              <span>${escapeHtml(event.seatLabel || event.actorRole || 'system')}</span>
              <span>${escapeHtml(event.createdAt || '')}</span>
            </div>
          `).join('') : '<p>No audit events yet.</p>'}
        </div>
      `);
    }

    return cards;
  }

  function bindPlayJoinForm(tableId) {
    const form = document.getElementById('pokerPlayJoinForm');
    if (!form) return;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setStatus('Joining live table...');
      try {
        await api(`/api/poker/play/tables/${encodeURIComponent(tableId)}/sit`, {
          method: 'POST',
          body: JSON.stringify({
            seatNumber: Number(document.getElementById('pokerPlaySeatNumber')?.value || 0),
            displayName: String(document.getElementById('pokerPlayDisplayName')?.value || '').trim(),
            buyInOil: Number(document.getElementById('pokerPlayBuyInOil')?.value || 0),
          }),
        });
        await loadPlayTable(tableId);
      } catch (err) {
        setStatus(`Join failed: ${err.code || err.message || 'UNKNOWN'}`);
      }
    });
  }

  function bindPlayLeaveButton(tableId) {
    const button = document.getElementById('pokerPlayLeaveButton');
    if (!button) return;
    button.addEventListener('click', async () => {
      setStatus(button.disabled ? 'Cash-out is already queued.' : 'Leaving table...');
      if (button.disabled) return;
      try {
        await api(`/api/poker/play/tables/${encodeURIComponent(tableId)}/leave`, {
          method: 'POST',
          body: JSON.stringify({}),
        });
        await loadPlayTable(tableId);
      } catch (err) {
        setStatus(`Leave failed: ${err.code || err.message || 'UNKNOWN'}`);
      }
    });
  }

  function bindPlayReloadForm(tableId) {
    const form = document.getElementById('pokerPlayReloadForm');
    if (!form) return;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const amountOil = Number(document.getElementById('pokerPlayReloadAmount')?.value || 0);
      if (amountOil <= 0) {
        setStatus('Enter a reload amount greater than zero.');
        return;
      }
      setStatus('Reloading seat stack...');
      try {
        await api(`/api/poker/play/tables/${encodeURIComponent(tableId)}/reload`, {
          method: 'POST',
          body: JSON.stringify({ amountOil }),
        });
        await loadPlayTable(tableId);
      } catch (err) {
        setStatus(`Reload failed: ${err.code || err.message || 'UNKNOWN'}`);
      }
    });
  }

  function bindPlayLifecycleButtons(tableId) {
    const sitOutButton = document.getElementById('pokerPlaySitOutButton');
    if (sitOutButton) {
      sitOutButton.addEventListener('click', async () => {
        if (sitOutButton.disabled) return;
        setStatus('Marking seat to sit out...');
        try {
          await api(`/api/poker/play/tables/${encodeURIComponent(tableId)}/sit-out`, {
            method: 'POST',
            body: JSON.stringify({}),
          });
          await loadPlayTable(tableId);
        } catch (err) {
          setStatus(`Sit-out failed: ${err.code || err.message || 'UNKNOWN'}`);
        }
      });
    }
    const awayButton = document.getElementById('pokerPlayAwayButton');
    if (awayButton) {
      awayButton.addEventListener('click', async () => {
        if (awayButton.disabled) return;
        setStatus('Marking seat away...');
        try {
          await api(`/api/poker/play/tables/${encodeURIComponent(tableId)}/sit-out`, {
            method: 'POST',
            body: JSON.stringify({ markAway: true }),
          });
          await loadPlayTable(tableId);
        } catch (err) {
          setStatus(`Away failed: ${err.code || err.message || 'UNKNOWN'}`);
        }
      });
    }
    const returnButton = document.getElementById('pokerPlayReturnButton');
    if (returnButton) {
      returnButton.addEventListener('click', async () => {
        if (returnButton.disabled) return;
        setStatus('Returning seat to the table...');
        try {
          await api(`/api/poker/play/tables/${encodeURIComponent(tableId)}/return`, {
            method: 'POST',
            body: JSON.stringify({}),
          });
          await loadPlayTable(tableId);
        } catch (err) {
          setStatus(`Return failed: ${err.code || err.message || 'UNKNOWN'}`);
        }
      });
    }
  }

  function bindTournamentReentryButton(seriesId, tableId) {
    const button = document.getElementById('pokerPlayReenterButton');
    if (!button || !seriesId) return;
    button.addEventListener('click', async () => {
      if (button.disabled) return;
      setStatus('Re-entering tournament...');
      try {
        const payload = await api(`/api/poker/play/series/${encodeURIComponent(seriesId)}/reenter`, {
          method: 'POST',
          body: JSON.stringify({}),
        });
        const nextTableId = String(payload?.data?.table?.tableId || tableId || '');
        await loadPlayTable(nextTableId);
      } catch (err) {
        setStatus(`Re-entry failed: ${err.code || err.message || 'UNKNOWN'}`);
      }
    });
  }

  function bindWaitlistControls(tableId) {
    const form = document.getElementById('pokerPlayWaitlistForm');
    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        setStatus('Joining waitlist...');
        try {
          await api(`/api/poker/play/tables/${encodeURIComponent(tableId)}/waitlist`, {
            method: 'POST',
            body: JSON.stringify({
              displayName: String(document.getElementById('pokerPlayWaitlistDisplayName')?.value || '').trim(),
              buyInOil: Number(document.getElementById('pokerPlayWaitlistBuyInOil')?.value || 0),
            }),
          });
          await loadPlayTable(tableId);
        } catch (err) {
          setStatus(`Waitlist failed: ${err.code || err.message || 'UNKNOWN'}`);
        }
      });
    }
    const leaveButton = document.getElementById('pokerPlayLeaveWaitlistButton');
    if (leaveButton) {
      leaveButton.addEventListener('click', async () => {
        setStatus('Leaving waitlist...');
        try {
          await api(`/api/poker/play/tables/${encodeURIComponent(tableId)}/waitlist`, {
            method: 'DELETE',
            body: JSON.stringify({}),
          });
          await loadPlayTable(tableId);
        } catch (err) {
          setStatus(`Leave waitlist failed: ${err.code || err.message || 'UNKNOWN'}`);
        }
      });
    }
  }

  function bindPlayMessageForm(tableId, handId) {
    const form = document.getElementById('pokerPlayMessageForm');
    if (!form || !handId) return;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const body = String(document.getElementById('pokerPlayMessageBody')?.value || '').trim();
      if (!body) {
        setStatus('Enter a discussion note before sending.');
        return;
      }
      setStatus('Sending seat thread note...');
      try {
        await api(`/api/poker/play/hands/${encodeURIComponent(handId)}/messages`, {
          method: 'POST',
          body: JSON.stringify({ body }),
        });
        await loadPlayTable(tableId);
      } catch (err) {
        setStatus(`Message failed: ${err.code || err.message || 'UNKNOWN'}`);
      }
    });
  }

  function bindPlayActionForm(tableId, handId) {
    const form = document.getElementById('pokerPlayActionForm');
    const timeBankButton = document.getElementById('pokerPlayTimeBankButton');
    if (timeBankButton && handId) {
      timeBankButton.addEventListener('click', async () => {
        setStatus('Using time bank...');
        try {
          await api(`/api/poker/play/hands/${encodeURIComponent(handId)}/timebank`, {
            method: 'POST',
            body: JSON.stringify({}),
          });
          await loadPlayTable(tableId);
        } catch (err) {
          setStatus(`Time bank failed: ${err.code || err.message || 'UNKNOWN'}`);
        }
      });
    }
    if (!form || !handId) return;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setStatus('Submitting action...');
      try {
        await api(`/api/poker/play/hands/${encodeURIComponent(handId)}/actions`, {
          method: 'POST',
          body: JSON.stringify({
            actionKind: String(document.getElementById('pokerPlayActionKind')?.value || '').trim(),
            amountOil: Number(document.getElementById('pokerPlayActionAmount')?.value || 0),
          }),
        });
        await loadPlayTable(tableId);
      } catch (err) {
        setStatus(`Action failed: ${err.code || err.message || 'UNKNOWN'}`);
      }
    });
  }

  function bindWorkerSeatAgentControls(tableId, handId) {
    const proposeButton = document.getElementById('pokerSeatAgentProposeButton');
    if (proposeButton && handId) {
      proposeButton.addEventListener('click', async () => {
        setStatus('Requesting worker seat agent line...');
        try {
          const gateway = await getPokerRuntimeGateway();
          if (!gateway || typeof gateway.pokerActionProposeTool !== 'function') {
            throw new Error('RUNTIME_NOT_READY');
          }
          await gateway.pokerActionProposeTool({
            tableId,
            handId,
            persist: true,
          });
          await loadPlayTable(tableId);
        } catch (err) {
          setStatus(`Worker proposal failed: ${err?.message || 'UNKNOWN'}`);
        }
      });
    }
    const commitButton = document.getElementById('pokerSeatAgentCommitButton');
    if (commitButton && handId) {
      commitButton.addEventListener('click', async () => {
        setStatus('Committing worker action...');
        try {
          const gateway = await getPokerRuntimeGateway();
          if (!gateway || typeof gateway.pokerActionCommitTool !== 'function') {
            throw new Error('RUNTIME_NOT_READY');
          }
          await gateway.pokerActionCommitTool({
            tableId,
            handId,
            useLatestProposal: true,
          });
          await loadPlayTable(tableId);
        } catch (err) {
          setStatus(`Worker commit failed: ${err?.message || 'UNKNOWN'}`);
        }
      });
    }
  }

  function bindPlayDisputeForm(tableId, handId) {
    const form = document.getElementById('pokerPlayDisputeForm');
    if (!form || !handId) return;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const note = String(document.getElementById('pokerPlayDisputeNote')?.value || '').trim();
      if (!note) {
        setStatus('Add a short note before flagging the hand.');
        return;
      }
      setStatus('Flagging hand for operator review...');
      try {
        await api(`/api/poker/play/hands/${encodeURIComponent(handId)}/disputes`, {
          method: 'POST',
          body: JSON.stringify({
            category: String(document.getElementById('pokerPlayDisputeCategory')?.value || 'general'),
            note,
          }),
        });
        await loadPlayTable(tableId);
      } catch (err) {
        setStatus(`Review failed: ${err.code || err.message || 'UNKNOWN'}`);
      }
    });
  }

  function bindIntegrityQueueActions(filterStatus = 'open') {
    const token = readStoredPokerAdminToken();
    if (!token) return;
    const buttons = Array.from(document.querySelectorAll('[data-integrity-action][data-flag-id]'));
    for (const button of buttons) {
      button.addEventListener('click', async () => {
        const flagId = String(button.getAttribute('data-flag-id') || '').trim();
        const action = String(button.getAttribute('data-integrity-action') || '').trim();
        if (!flagId || !action) return;
        setStatus(action === 'dismissed' ? 'Dismissing integrity flag...' : 'Resolving integrity flag...');
        try {
          await api(`/api/poker/play/admin/integrity/${encodeURIComponent(flagId)}/resolve`, {
            method: 'POST',
            headers: { 'x-admin-token': token },
            body: JSON.stringify({
              status: action === 'dismissed' ? 'dismissed' : 'resolved',
              resolutionNote: action === 'dismissed'
                ? 'Operator dismissed the automated integrity signal.'
                : 'Operator resolved the automated integrity signal.',
            }),
          });
          await loadPlayIntegrityQueue();
        } catch (err) {
          setStatus(`Integrity resolution failed: ${err.code || err.message || 'UNKNOWN'}`);
        }
      });
    }
  }

  function bindAdminReviewActions(tableId, seriesId = '') {
    const token = readStoredPokerAdminToken();
    if (!token) return;
    const buttons = Array.from(document.querySelectorAll('[data-dispute-action][data-dispute-id]'));
    for (const button of buttons) {
      button.addEventListener('click', async () => {
        const disputeId = String(button.getAttribute('data-dispute-id') || '').trim();
        const action = String(button.getAttribute('data-dispute-action') || '').trim();
        if (!disputeId || !action) return;
        const status = action === 'dismissed' ? 'dismissed' : 'resolved';
        const resumeTable = action === 'resolved_resume';
        setStatus(resumeTable ? 'Resolving dispute and resuming table...' : 'Resolving dispute...');
        try {
          await api(`/api/poker/play/admin/disputes/${encodeURIComponent(disputeId)}/resolve`, {
            method: 'POST',
            headers: { 'x-admin-token': token },
            body: JSON.stringify({
              status,
              resolutionNote: status === 'dismissed' ? 'Dismissed by operator review.' : 'Resolved by operator review.',
              resumeTable,
            }),
          });
          await loadPlayTable(tableId);
        } catch (err) {
          setStatus(`Operator review failed: ${err.code || err.message || 'UNKNOWN'}`);
        }
      });
    }

    const seriesCloseButton = document.querySelector('[data-admin-series-close="1"][data-admin-series-id]');
    if (seriesCloseButton) {
      seriesCloseButton.addEventListener('click', async () => {
        const targetSeriesId = String(seriesCloseButton.getAttribute('data-admin-series-id') || '').trim() || String(seriesId || '').trim();
        const targetTableId = String(seriesCloseButton.getAttribute('data-admin-series-table-id') || '').trim() || String(tableId || '').trim();
        if (!targetSeriesId || !targetTableId) return;
        setStatus('Cancelling tournament series and issuing refunds...');
        try {
          await api(`/api/poker/play/admin/series/${encodeURIComponent(targetSeriesId)}/close`, {
            method: 'POST',
            headers: { 'x-admin-token': token },
            body: JSON.stringify({
              reason: 'Operator closed the tournament series.',
            }),
          });
          await loadPlayTable(targetTableId);
        } catch (err) {
          setStatus(`Series close failed: ${err.code || err.message || 'UNKNOWN'}`);
        }
      });
    }

    const registrationCloseButton = document.querySelector('[data-admin-series-registration-close="1"][data-admin-series-id]');
    if (registrationCloseButton) {
      registrationCloseButton.addEventListener('click', async () => {
        const targetSeriesId = String(registrationCloseButton.getAttribute('data-admin-series-id') || '').trim() || String(seriesId || '').trim();
        if (!targetSeriesId) return;
        setStatus('Closing tournament registration...');
        try {
          await api(`/api/poker/play/admin/series/${encodeURIComponent(targetSeriesId)}/registration/close`, {
            method: 'POST',
            headers: { 'x-admin-token': token },
            body: JSON.stringify({
              reason: 'Director closed tournament registration.',
            }),
          });
          await loadPlayTable(tableId);
        } catch (err) {
          setStatus(`Registration close failed: ${err.code || err.message || 'UNKNOWN'}`);
        }
      });
    }

    const rebalanceButton = document.querySelector('[data-admin-series-rebalance="1"][data-admin-series-id]');
    if (rebalanceButton) {
      rebalanceButton.addEventListener('click', async () => {
        const targetSeriesId = String(rebalanceButton.getAttribute('data-admin-series-id') || '').trim() || String(seriesId || '').trim();
        if (!targetSeriesId) return;
        setStatus('Rebalancing tournament series...');
        try {
          await api(`/api/poker/play/admin/series/${encodeURIComponent(targetSeriesId)}/rebalance`, {
            method: 'POST',
            headers: { 'x-admin-token': token },
            body: JSON.stringify({
              reason: 'Director rebalanced the tournament series.',
            }),
          });
          await loadPlayTable(tableId);
        } catch (err) {
          setStatus(`Rebalance failed: ${err.code || err.message || 'UNKNOWN'}`);
        }
      });
    }

    const breakButton = document.querySelector('[data-admin-series-break-table="1"][data-admin-series-id][data-admin-break-table-id]');
    if (breakButton) {
      breakButton.addEventListener('click', async () => {
        const targetSeriesId = String(breakButton.getAttribute('data-admin-series-id') || '').trim() || String(seriesId || '').trim();
        const targetBreakTableId = String(breakButton.getAttribute('data-admin-break-table-id') || '').trim();
        if (!targetSeriesId || !targetBreakTableId) return;
        setStatus('Breaking tournament table...');
        try {
          await api(`/api/poker/play/admin/series/${encodeURIComponent(targetSeriesId)}/break-table`, {
            method: 'POST',
            headers: { 'x-admin-token': token },
            body: JSON.stringify({
              tableId: targetBreakTableId,
              reason: 'Director broke the pending tournament table.',
            }),
          });
          await loadPlayTable(tableId);
        } catch (err) {
          setStatus(`Break failed: ${err.code || err.message || 'UNKNOWN'}`);
        }
      });
    }

    const closeButton = document.querySelector('[data-admin-table-close="1"][data-admin-table-id]');
    if (closeButton) {
      closeButton.addEventListener('click', async () => {
        const targetTableId = String(closeButton.getAttribute('data-admin-table-id') || '').trim();
        if (!targetTableId) return;
        setStatus('Closing table and issuing refunds...');
        try {
          await api(`/api/poker/play/admin/tables/${encodeURIComponent(targetTableId)}/close`, {
            method: 'POST',
            headers: { 'x-admin-token': token },
            body: JSON.stringify({
              reason: 'Operator closed the table.',
            }),
          });
          await loadPlayTable(targetTableId);
        } catch (err) {
          setStatus(`Operator close failed: ${err.code || err.message || 'UNKNOWN'}`);
        }
      });
    }

    const exportButton = document.querySelector('[data-admin-export="1"][data-admin-table-id]');
    if (exportButton) {
      exportButton.addEventListener('click', async () => {
        const targetTableId = String(exportButton.getAttribute('data-admin-table-id') || '').trim();
        if (!targetTableId) return;
        setStatus('Preparing review export...');
        try {
          const payload = await api(`/api/poker/play/admin/tables/${encodeURIComponent(targetTableId)}/export`, {
            headers: { 'x-admin-token': token },
          });
          const filename = `poker-review-${targetTableId}.json`;
          triggerJsonDownload(filename, payload?.data || {});
          setStatus(`Exported ${filename}`);
        } catch (err) {
          setStatus(`Export failed: ${err.code || err.message || 'UNKNOWN'}`);
        }
      });
    }

    const seriesExportButton = document.querySelector('[data-admin-series-export="1"][data-admin-series-id]');
    if (seriesExportButton) {
      seriesExportButton.addEventListener('click', async () => {
        const targetSeriesId = String(seriesExportButton.getAttribute('data-admin-series-id') || '').trim() || String(seriesId || '').trim();
        if (!targetSeriesId) return;
        setStatus('Preparing tournament series export...');
        try {
          const payload = await api(`/api/poker/play/admin/series/${encodeURIComponent(targetSeriesId)}/export`, {
            headers: { 'x-admin-token': token },
          });
          const filename = `poker-series-review-${targetSeriesId}.json`;
          triggerJsonDownload(filename, payload?.data || {});
          setStatus(`Exported ${filename}`);
        } catch (err) {
          setStatus(`Series export failed: ${err.code || err.message || 'UNKNOWN'}`);
        }
      });
    }

    const pauseButton = document.querySelector('[data-admin-table-pause="1"][data-admin-table-id]');
    if (pauseButton) {
      pauseButton.addEventListener('click', async () => {
        const targetTableId = String(pauseButton.getAttribute('data-admin-table-id') || '').trim();
        if (!targetTableId) return;
        setStatus('Pausing table...');
        try {
          await api(`/api/poker/play/admin/tables/${encodeURIComponent(targetTableId)}/pause`, {
            method: 'POST',
            headers: { 'x-admin-token': token },
            body: JSON.stringify({
              reason: 'operator review',
            }),
          });
          await loadPlayTable(targetTableId);
        } catch (err) {
          setStatus(`Pause failed: ${err.code || err.message || 'UNKNOWN'}`);
        }
      });
    }

    const startButton = document.querySelector('[data-admin-table-start="1"][data-admin-table-id]');
    if (startButton) {
      startButton.addEventListener('click', async () => {
        const targetTableId = String(startButton.getAttribute('data-admin-table-id') || '').trim();
        if (!targetTableId) return;
        setStatus('Starting tournament table...');
        try {
          await api(`/api/poker/play/admin/tables/${encodeURIComponent(targetTableId)}/start`, {
            method: 'POST',
            headers: { 'x-admin-token': token },
            body: JSON.stringify({
              reason: 'Director started the tournament table.',
            }),
          });
          await loadPlayTable(targetTableId);
        } catch (err) {
          setStatus(`Start failed: ${err.code || err.message || 'UNKNOWN'}`);
        }
      });
    }

    const moveSeatForm = document.getElementById('pokerDirectorMoveSeatForm');
    if (moveSeatForm) {
      moveSeatForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const targetSeriesId = String(seriesId || '').trim();
        if (!targetSeriesId) return;
        setStatus('Moving tournament seat...');
        try {
          await api(`/api/poker/play/admin/series/${encodeURIComponent(targetSeriesId)}/move-seat`, {
            method: 'POST',
            headers: { 'x-admin-token': token },
            body: JSON.stringify({
              sourceTableId: tableId,
              seatNumber: Number(document.getElementById('pokerDirectorMoveSeatNumber')?.value || 0),
              targetTableId: String(document.getElementById('pokerDirectorMoveTargetTable')?.value || '').trim(),
              targetSeatNumber: Number(document.getElementById('pokerDirectorMoveTargetSeat')?.value || 0),
              reason: 'Director moved the tournament seat.',
            }),
          });
          await loadPlayTable(tableId);
        } catch (err) {
          setStatus(`Move failed: ${err.code || err.message || 'UNKNOWN'}`);
        }
      });
    }

    const resumeButton = document.querySelector('[data-admin-table-resume="1"][data-admin-table-id]');
    if (resumeButton) {
      resumeButton.addEventListener('click', async () => {
        const targetTableId = String(resumeButton.getAttribute('data-admin-table-id') || '').trim();
        if (!targetTableId) return;
        setStatus('Resuming table...');
        try {
          await api(`/api/poker/play/admin/tables/${encodeURIComponent(targetTableId)}/resume`, {
            method: 'POST',
            headers: { 'x-admin-token': token },
            body: JSON.stringify({}),
          });
          await loadPlayTable(targetTableId);
        } catch (err) {
          setStatus(`Resume failed: ${err.code || err.message || 'UNKNOWN'}`);
        }
      });
    }
  }

  async function loadPlayTable(tableId, { silent = false, rail = false } = {}) {
    setTitle(rail ? 'Poker Rail Table' : 'Live Poker Table', rail ? `Public rail view for ${tableId}.` : `Shared 6-max table state for ${tableId}.`);
    if (!silent) setStatus('Loading live table...');
    const payload = await api(buildPlayTableApiPath(tableId, { rail }));
    const data = payload?.data && typeof payload.data === 'object' ? { ...payload.data } : {};
    const adminToken = rail ? '' : readStoredPokerAdminToken();
    if (adminToken) {
      try {
        const reviewPayload = await api(`/api/poker/play/admin/tables/${encodeURIComponent(tableId)}/review`, {
          headers: { 'x-admin-token': adminToken },
        });
        data.adminReview = reviewPayload?.data || null;
      } catch (err) {
        data.adminReview = null;
        data.adminReviewError = err?.code || 'UNKNOWN';
      }
    }
    renderCards(renderPlayTableCards(data, { rail }));
    if (!rail) {
      bindPlayJoinForm(tableId);
      bindWaitlistControls(tableId);
      bindPlayReloadForm(tableId);
      bindPlayLifecycleButtons(tableId);
      bindTournamentReentryButton(data?.series?.seriesId || '', tableId);
      bindPlayLeaveButton(tableId);
      bindPlayMessageForm(tableId, data?.hand?.handId || '');
      bindPlayActionForm(tableId, data?.hand?.handId || '');
      bindWorkerSeatAgentControls(tableId, data?.hand?.handId || '');
      bindPlayDisputeForm(tableId, data?.hand?.handId || '');
      bindAdminReviewActions(tableId, data?.series?.seriesId || '');
    }
    bindCountdown(data?.hand?.actionExpiresAt || null);
    bindLiveTableStream(tableId, { rail });
    scheduleLiveTableRefresh(tableId, { rail });
    if (!silent) {
      if (rail) {
        setStatus('Rail table ready.');
      } else {
        setStatus(data?.mySeat ? 'Live table synced.' : 'Live table ready.');
      }
    }
  }

  async function loadPlayRailTable(tableId, { silent = false } = {}) {
    return await loadPlayTable(tableId, { silent, rail: true });
  }

  async function loadCentaurLobby() {
    clearLiveTableStream();
    setTitle('Centaur Poker', 'Human + AI make one action together while the countdown runs.');
    setStatus('Loading centaur lobby...');
    const payload = await api('/api/poker/centaur/tournaments');
    const items = Array.isArray(payload?.data?.items) ? payload.data.items : [];
    const oilBalance = Number(payload?.data?.oilBalance?.balance || 0);
    renderCards([
      `
        <h2>Eligibility</h2>
        <div class="pokerSummary">
          ${renderSummaryMetric('House', payload?.data?.houseId || 'Pending')}
          ${renderSummaryMetric('Wallet', payload?.data?.wallet?.address || 'Bind wallet')}
          ${renderSummaryMetric('OIL Balance', `${oilBalance}`)}
          ${renderSummaryMetric('Verification', payload?.data?.verification?.status || 'unverified')}
        </div>
      `,
      `
        <h2>Current Hour Snapshots</h2>
        <p>15 randomized checks per hour. Each eligible snapshot credits 100 OIL offchain.</p>
        ${renderSnapshotSlots(payload?.data?.currentHourSnapshots)}
      `,
      items.length
        ? items.map((item) => `
          <div class="pokerSplit">
            <div>
              <h2>${escapeHtml(item.title)}</h2>
              <p>${escapeHtml(item?.summary?.headline || 'Human and AI share the same decision seat.')}</p>
              ${renderMetaBadges([
                item.status,
                `${Number(item.buyInOil || 0)} OIL buy-in`,
                `${item.requiredLockAmountAtomic} locked`,
              ])}
            </div>
            <div class="pokerLinks">
              <a href="${escapeHtml(buildPokerHref(`/poker/centaur/tournaments/${encodeURIComponent(item.tournamentId)}`))}">Open Table</a>
            </div>
          </div>
        `).join('')
        : '<h2>No centaur tournaments available.</h2><p>The lobby is live, but no tournament is open yet.</p>',
    ]);
    setStatus(items.length ? `${items.length} centaur tournament${items.length === 1 ? '' : 's'} loaded.` : 'No centaur tournaments available.');
  }

  async function loadSeason(seasonId) {
    setTitle('Poker Season', `Mirrored operator detail for ${seasonId}.`);
    setStatus('Loading season detail...');
    const payload = await api(`/api/poker/seasons/${encodeURIComponent(seasonId)}`);
    const season = payload?.data?.season || null;
    if (!season) {
      setStatus('Season not found.');
      renderCards(['<h2>Season not found.</h2>']);
      return;
    }
    setStatus(`Season ${season.displayName} loaded.`);
    renderCards([
      `
        <h2>${escapeHtml(season.displayName)}</h2>
        <div>${escapeHtml(season.seasonSlug)}</div>
        ${renderMetaBadges([season.status, season.rulesVersion || 'rules', season.operatorVersion || 'operator'])}
        <div class="pokerLinks">
          <a href="${escapeHtml(buildPokerHref(`/poker/leaderboards/${encodeURIComponent(season.seasonId)}`))}">Latest leaderboard</a>
          ${season?.latestReplayHighlight?.runId ? `<a href="${escapeHtml(buildPokerHref(`/poker/replays/${encodeURIComponent(season.latestReplayHighlight.runId)}`))}">Replay</a>` : ''}
        </div>
      `,
      `
        <h3>Divisions</h3>
        ${
          Array.isArray(season.divisions) && season.divisions.length
            ? season.divisions.map((division) => (
              `<div class="pokerMeta"><span class="pokerBadge">${escapeHtml(division.divisionSlug)}</span><span>${escapeHtml(division.runnerKind || 'runner')}</span></div>`
            )).join('')
            : '<p>No mirrored divisions.</p>'
        }
      `,
      `
        <h3>Submit Bundle</h3>
        <form id="pokerSubmissionForm" class="pokerForm">
          <label>
            Bundle Content Address
            <input id="bundleContentAddress" name="contentAddress" placeholder="sha256:..." value="sha256:bundle-demo">
          </label>
          <label>
            Bundle Manifest Hash
            <input id="bundleManifestHash" name="manifestHash" placeholder="sha256:..." value="sha256:manifest-demo">
          </label>
          <label>
            Artifact URI
            <input id="bundleArtifactUri" name="artifactUri" placeholder="s3://..." value="s3://operator/submissions/demo.zip">
          </label>
          <label>
            Entrypoint
            <input id="bundleEntrypoint" name="entrypoint" value="play.py">
          </label>
          <label>
            Declared Capabilities JSON
            <textarea id="bundleCapabilities">{ "browserCompatible": false }</textarea>
          </label>
          <button class="pokerButton" type="submit">Submit Bundle</button>
        </form>
      `,
    ]);
    bindSubmissionForm(season.seasonId);
  }

  function bindSubmissionForm(seasonId) {
    const form = document.getElementById('pokerSubmissionForm');
    if (!form) return;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setStatus('Submitting bundle...');
      let declaredCapabilities = {};
      try {
        declaredCapabilities = JSON.parse(String(document.getElementById('bundleCapabilities')?.value || '{}'));
      } catch {
        setStatus('Declared capabilities must be valid JSON.');
        return;
      }
      try {
        const payload = await api(`/api/poker/seasons/${encodeURIComponent(seasonId)}/submissions`, {
          method: 'POST',
          headers: {
            'Idempotency-Key': `poker-ui-${Date.now()}`,
          },
          body: JSON.stringify({
            bundle: {
              contentAddress: String(document.getElementById('bundleContentAddress')?.value || '').trim(),
              manifestHash: String(document.getElementById('bundleManifestHash')?.value || '').trim(),
              artifactUri: String(document.getElementById('bundleArtifactUri')?.value || '').trim(),
              entrypoint: String(document.getElementById('bundleEntrypoint')?.value || '').trim(),
            },
            declaredCapabilities,
          }),
        });
        const submissionId = payload?.data?.submission?.submissionId || '';
        setStatus(submissionId ? `Submission accepted: ${submissionId}` : 'Submission accepted.');
      } catch (err) {
        setStatus(`Submission failed: ${err.code || err.message || 'UNKNOWN'}`);
      }
    });
  }

  async function loadLeaderboard(seasonId) {
    setTitle('Poker Leaderboard', `Mirrored ranking snapshot for ${seasonId}.`);
    setStatus('Loading leaderboard...');
    const payload = await api(`/api/poker/leaderboards/${encodeURIComponent(seasonId)}/latest`);
    const rankings = Array.isArray(payload?.data?.rankings) ? payload.data.rankings : [];
    const snapshotId = payload?.data?.snapshotId || null;
    if (!rankings.length) {
      setStatus('No leaderboard snapshot mirrored yet.');
      renderCards([
        '<h2>No leaderboard snapshot yet.</h2><p>The page stays stable and empty until the operator mirror sync brings in a snapshot.</p>',
      ]);
      return;
    }
    setStatus(`Snapshot ${snapshotId || 'latest'} loaded.`);
    renderCards([
      `
        <h2>Latest Snapshot</h2>
        ${renderMetaBadges([`season ${seasonId}`, `snapshot ${snapshotId || 'latest'}`])}
        <table class="pokerTable">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Submission</th>
              <th>Rating</th>
              <th>Games</th>
              <th>Wins</th>
            </tr>
          </thead>
          <tbody id="leaderboardRows">
            ${rankings.map((row) => `
              <tr>
                <td class="leaderboard-rank">${escapeHtml(row.rank)}</td>
                <td>${escapeHtml(row.displayName || row.submissionId)}</td>
                <td class="leaderboard-rating">${escapeHtml(row.rating)}</td>
                <td>${escapeHtml(row.games)}</td>
                <td>${escapeHtml(row.wins)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `,
    ]);
  }

  async function loadReplay(runId) {
    setTitle('Poker Replay', `Replay manifest for ${runId}.`);
    setStatus('Loading replay manifest...');
    try {
      const payload = await api(`/api/poker/runs/${encodeURIComponent(runId)}/replay`);
      const summary = payload?.data?.summary || {};
      const replay = payload?.data?.replay || {};
      setStatus(`Replay ${runId} verified.`);
      renderCards([
        `
          <h2>Replay Manifest</h2>
          <div class="pokerSummary">
            <div>
              <div>Winner Seat</div>
              <div id="replayWinnerSeat" class="pokerSummaryValue">${escapeHtml(summary.winnerSeat || 'n/a')}</div>
            </div>
            <div>
              <div>Turns</div>
              <div id="replayTurns" class="pokerSummaryValue">${escapeHtml(summary.turns || 'n/a')}</div>
            </div>
            <div>
              <div>Seed</div>
              <div id="replaySeed" class="pokerSummaryValue">${escapeHtml(summary.seed || 'n/a')}</div>
            </div>
          </div>
        `,
        `
          <h3>Artifact</h3>
          ${renderMetaBadges([replay.replayFormat || 'unknown', replay.contentType || 'content', replay.artifactSha256 || 'sha256 pending'])}
          <p>${escapeHtml(replay.eventsJsonlUri || 'No operator artifact URI available.')}</p>
          <div class="pokerLinks">
            <span id="replayStatus" class="pokerBadge">hash verified</span>
          </div>
        `,
      ]);
    } catch (err) {
      setStatus(`Replay unavailable: ${err.code || err.message || 'UNKNOWN'}`);
      renderCards([
        `
          <h2>Replay Unavailable</h2>
          <p id="replayErrorCode">${escapeHtml(err.code || 'UNKNOWN')}</p>
        `,
      ]);
    }
  }

  async function loadSubmission(submissionId) {
    setTitle('Poker Submission', `Submission detail for ${submissionId}.`);
    setStatus('Loading submission...');
    try {
      const payload = await api(`/api/poker/submissions/${encodeURIComponent(submissionId)}`);
      const submission = payload?.data?.submission || null;
      if (!submission) {
        setStatus('Submission not found.');
        renderCards(['<h2>Submission not found.</h2>']);
        return;
      }
      setStatus(`Submission ${submission.submissionId} loaded.`);
      renderCards([
        `
          <h2>${escapeHtml(submission.submissionId)}</h2>
          ${renderMetaBadges([submission.status || 'unknown', submission.seasonId || 'season'])}
          <p>Created ${escapeHtml(formatIso(submission.createdAt))}</p>
        `,
      ]);
    } catch (err) {
      setStatus(`Submission unavailable: ${err.code || err.message || 'UNKNOWN'}`);
      renderCards(['<h2>Submission unavailable.</h2>']);
    }
  }

  function renderCentaurTournamentCards(data) {
    const tournament = data?.tournament || null;
    const entry = data?.entry || null;
    const hand = data?.hand || null;
    const messages = Array.isArray(data?.messages) ? data.messages : [];
    const actions = Array.isArray(data?.actions) ? data.actions : [];
    const oilBalance = Number(data?.oilBalance?.balance || 0);
    const verification = data?.verification || null;
    const tableState = hand?.tableState || {};
    const streamId = readStoredStreamId();
    const cards = [
      `
        <h2>${escapeHtml(tournament?.title || 'Centaur Tournament')}</h2>
        <p>${escapeHtml(tournament?.summary?.headline || 'Human and AI act from the same seat against a live countdown.')}</p>
        <div class="pokerSummary">
          ${renderSummaryMetric('House', data?.houseId || 'Pending')}
          ${renderSummaryMetric('Wallet', data?.wallet?.address || 'Bind wallet')}
          ${renderSummaryMetric('OIL Balance', `${oilBalance}`)}
          ${renderSummaryMetric('Lock Status', verification?.status || 'unverified')}
        </div>
      `,
      `
        <h2>Snapshot Hour</h2>
        <p>Randomized 15x/hour verification of the same wallet lock. Each successful check credits 100 OIL offchain.</p>
        ${renderSnapshotSlots(data?.currentHourSnapshots)}
      `,
    ];

    if (!verification) {
      cards.push(`
        <h2>Verify Streamflow Lock</h2>
        <p>Use the same wallet bound to your House. The signed message proves control of the wallet that holds the Streamflow lock.</p>
        <form id="centaurVerifyForm" class="pokerForm">
          <label>
            Streamflow Lock ID
            <input id="centaurStreamId" value="${escapeHtml(streamId)}" placeholder="streamflow lock id">
          </label>
          <label>
            Minimum Locked Amount (atomic)
            <input id="centaurMinLockAtomic" value="${escapeHtml(tournament?.requiredLockAmountAtomic || '0')}">
          </label>
          <button class="pokerButton" type="submit">Sign & Verify</button>
        </form>
      `);
    } else if (!entry) {
      cards.push(`
        <h2>Join The Table</h2>
        <p>Your verified lock is active. Join the shared centaur seat and start the first hand.</p>
        <form id="centaurJoinForm" class="pokerForm">
          <label>
            Seat Display Name
            <input id="centaurDisplayName" value="${escapeHtml(data?.houseId || 'Centaur Seat')}" maxlength="80">
          </label>
          <button class="pokerButton" type="submit">Join For ${Number(tournament?.buyInOil || 0)} OIL</button>
        </form>
      `);
    }

    if (entry && hand) {
      cards.push(`
        <h2>Live Hand</h2>
        ${renderMetaBadges([
          `entry ${entry.displayName || entry.entryId}`,
          `hand ${hand.handNumber || 1}`,
          hand.status || 'live',
        ])}
        <div class="pokerSummary">
          ${renderSummaryMetric('Phase', tableState.phase || 'n/a')}
          ${renderSummaryMetric('Pot', `${Number(tableState.potOil || 0)} OIL`)}
          ${renderSummaryMetric('Call', `${Number(tableState.requiredCallOil || 0)} OIL`)}
          ${renderSummaryMetric('Raise To', `${Number(tableState.minRaiseToOil || 0)} OIL`)}
        </div>
        <div class="pokerSplit">
          <div>
            <div class="pokerLabel">Hero Cards</div>
            <div class="pokerCardStrip">${(Array.isArray(tableState.heroCards) ? tableState.heroCards : []).map((card) => `<span class="pokerMiniCard">${escapeHtml(card)}</span>`).join('')}</div>
          </div>
          <div>
            <div class="pokerLabel">Board</div>
            <div class="pokerCardStrip">${(Array.isArray(tableState.boardCards) ? tableState.boardCards : []).map((card) => `<span class="pokerMiniCard">${escapeHtml(card)}</span>`).join('')}</div>
          </div>
          <div>
            <div class="pokerLabel">Decision Clock</div>
            <div id="centaurCountdownValue" class="pokerCountdown">--</div>
          </div>
        </div>
      `);
      cards.push(`
        <h2>Centaur Discussion</h2>
        <div id="centaurMessages" class="pokerStack">
          ${messages.length ? messages.map((message) => `
            <div class="pokerMessage ${message.authorRole === 'agent' ? 'is-agent' : 'is-human'}">
              <div class="pokerLabel">${escapeHtml(message.authorRole)}</div>
              <div>${escapeHtml(message.body)}</div>
            </div>
          `).join('') : '<p>No discussion yet.</p>'}
        </div>
        <form id="centaurMessageForm" class="pokerForm">
          <label>
            Discuss the next move
            <textarea id="centaurMessageBody" placeholder="What line do we want to take here?"></textarea>
          </label>
          <button class="pokerButton" type="submit">Send Discussion Note</button>
        </form>
      `);
      cards.push(`
        <h2>Submit Shared Action</h2>
        <div class="pokerStack">
          ${(Array.isArray(actions) && actions.length) ? actions.map((action) => `
            <div class="pokerRow">
              <span>${escapeHtml(action.actorRole)}</span>
              <span>${escapeHtml(action.actionKind)}</span>
              <span>${Number(action.amountOil || 0)} OIL</span>
            </div>
          `).join('') : '<p>No action has been locked in yet.</p>'}
        </div>
        <form id="centaurActionForm" class="pokerForm">
          <label>
            Action
            <select id="centaurActionKind">
              ${(Array.isArray(tableState.allowedActions) ? tableState.allowedActions : []).map((action) => `<option value="${escapeHtml(action)}">${escapeHtml(action)}</option>`).join('')}
            </select>
          </label>
          <label>
            Amount OIL
            <input id="centaurActionAmount" type="number" min="0" value="${Number(tableState.minRaiseToOil || tableState.requiredCallOil || 0)}">
          </label>
          <button class="pokerButton" type="submit">Lock Action</button>
        </form>
      `);
    }
    return cards;
  }

  function bindCentaurVerifyForm(tournamentId) {
    const form = document.getElementById('centaurVerifyForm');
    if (!form) return;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const streamId = String(document.getElementById('centaurStreamId')?.value || '').trim();
      const minLockAmountAtomic = String(document.getElementById('centaurMinLockAtomic')?.value || '').trim();
      if (!streamId || !minLockAmountAtomic) {
        setStatus('Stream ID and minimum locked amount are required.');
        return;
      }
      persistStreamId(streamId);
      setStatus('Requesting Streamflow challenge...');
      try {
        const client = getWalletClient();
        const address = await ensureSolanaWallet(client);
        const challengePayload = await api('/api/poker/streamflow/challenge', {
          method: 'POST',
          body: JSON.stringify({ streamId, minLockAmountAtomic }),
        });
        const challenge = challengePayload?.data?.challenge || null;
        if (!challenge?.message) throw new Error('STREAMFLOW_CHALLENGE_MISSING');
        setStatus(`Signing Streamflow challenge with ${address}...`);
        const signatureBytes = await client.signMessage({ chain: 'solana', message: challenge.message, address });
        const signature = bytesToBase64(signatureBytes);
        await api('/api/poker/streamflow/verify', {
          method: 'POST',
          body: JSON.stringify({
            streamId,
            minLockAmountAtomic,
            nonce: challenge.nonce,
            signature,
          }),
        });
        setStatus('Streamflow lock verified. Reloading centaur table...');
        await loadCentaurTournament(tournamentId);
      } catch (err) {
        setStatus(`Verification failed: ${err.code || err.message || 'UNKNOWN'}`);
      }
    });
  }

  function bindCentaurJoinForm(tournamentId) {
    const form = document.getElementById('centaurJoinForm');
    if (!form) return;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setStatus('Joining centaur table...');
      try {
        await api(`/api/poker/centaur/tournaments/${encodeURIComponent(tournamentId)}/join`, {
          method: 'POST',
          body: JSON.stringify({
            displayName: String(document.getElementById('centaurDisplayName')?.value || '').trim(),
          }),
        });
        await loadCentaurTournament(tournamentId);
      } catch (err) {
        setStatus(`Join failed: ${err.code || err.message || 'UNKNOWN'}`);
      }
    });
  }

  function bindCentaurMessageForm(tournamentId, handId) {
    const form = document.getElementById('centaurMessageForm');
    if (!form || !handId) return;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const body = String(document.getElementById('centaurMessageBody')?.value || '').trim();
      if (!body) {
        setStatus('Enter a message before posting.');
        return;
      }
      setStatus('Sending centaur discussion note...');
      try {
        await api(`/api/poker/centaur/hands/${encodeURIComponent(handId)}/messages`, {
          method: 'POST',
          body: JSON.stringify({ body }),
        });
        await loadCentaurTournament(tournamentId);
      } catch (err) {
        setStatus(`Message failed: ${err.code || err.message || 'UNKNOWN'}`);
      }
    });
  }

  function bindCentaurActionForm(tournamentId, handId) {
    const form = document.getElementById('centaurActionForm');
    if (!form || !handId) return;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setStatus('Locking shared action...');
      try {
        await api(`/api/poker/centaur/hands/${encodeURIComponent(handId)}/actions`, {
          method: 'POST',
          body: JSON.stringify({
            actionKind: String(document.getElementById('centaurActionKind')?.value || '').trim(),
            amountOil: Number(document.getElementById('centaurActionAmount')?.value || 0),
          }),
        });
        await loadCentaurTournament(tournamentId);
      } catch (err) {
        setStatus(`Action failed: ${err.code || err.message || 'UNKNOWN'}`);
      }
    });
  }

  async function loadCentaurTournament(tournamentId) {
    clearLiveTableStream();
    setTitle('Centaur Table', `Shared human + AI table state for ${tournamentId}.`);
    setStatus('Loading centaur table...');
    const payload = await api(`/api/poker/centaur/tournaments/${encodeURIComponent(tournamentId)}`);
    const data = payload?.data || {};
    renderCards(renderCentaurTournamentCards(data));
    bindCentaurVerifyForm(tournamentId);
    bindCentaurJoinForm(tournamentId);
    bindCentaurMessageForm(tournamentId, data?.hand?.handId || '');
    bindCentaurActionForm(tournamentId, data?.hand?.handId || '');
    bindCountdown(data?.hand?.decisionExpiresAt || null);
    setStatus(data?.entry ? 'Centaur table live.' : 'Centaur table ready for verification or join.');
  }

  async function route() {
    const url = new URL(window.location.href);
    const path = url.pathname;
    try {
      if (!path.match(/^\/poker\/play\/tables\/([^/]+)$/) && !path.match(/^\/poker\/play\/rail\/tables\/([^/]+)$/)) {
        clearLiveTableStream();
      }
      if (path === '/poker') return await loadIndex();
      if (path === '/poker/play') return await loadPlayLobby();
      if (path === '/poker/play/admin/integrity') return await loadPlayIntegrityQueue();
      if (path === '/poker/play/results') return await loadPlayResults();
      const tableHistoryMatch = path.match(/^\/poker\/play\/tables\/([^/]+)\/history$/);
      if (tableHistoryMatch) return await loadPlayTableHistory(tableHistoryMatch[1]);
      const seriesTimelineMatch = path.match(/^\/poker\/play\/series\/([^/]+)\/timeline$/);
      if (seriesTimelineMatch) return await loadPlaySeriesTimeline(seriesTimelineMatch[1]);
      if (path === '/poker/play/rail') return await loadPlayRailLobby();
      const railSeriesTimelineMatch = path.match(/^\/poker\/play\/rail\/series\/([^/]+)\/timeline$/);
      if (railSeriesTimelineMatch) return await loadPlaySeriesTimeline(railSeriesTimelineMatch[1], { rail: true });
      const seriesRailMatch = path.match(/^\/poker\/play\/rail\/series\/([^/]+)$/);
      if (seriesRailMatch) return await loadPlayRailSeries(seriesRailMatch[1]);
      const railMatch = path.match(/^\/poker\/play\/rail\/tables\/([^/]+)$/);
      if (railMatch) return await loadPlayRailTable(railMatch[1]);
      const playMatch = path.match(/^\/poker\/play\/tables\/([^/]+)$/);
      if (playMatch) return await loadPlayTable(playMatch[1]);
      if (path === '/poker/centaur') return await loadCentaurLobby();
      const centaurMatch = path.match(/^\/poker\/centaur\/tournaments\/([^/]+)$/);
      if (centaurMatch) return await loadCentaurTournament(centaurMatch[1]);
      const seasonMatch = path.match(/^\/poker\/seasons\/([^/]+)$/);
      if (seasonMatch) return await loadSeason(seasonMatch[1]);
      const leaderboardMatch = path.match(/^\/poker\/leaderboards\/([^/]+)$/);
      if (leaderboardMatch) return await loadLeaderboard(leaderboardMatch[1]);
      const replayMatch = path.match(/^\/poker\/replays\/([^/]+)$/);
      if (replayMatch) return await loadReplay(replayMatch[1]);
      const submissionMatch = path.match(/^\/poker\/submissions\/([^/]+)$/);
      if (submissionMatch) return await loadSubmission(submissionMatch[1]);
      setTitle('Portal Poker', 'Unknown route');
      setStatus('Unknown poker route.');
      renderCards(['<h2>Unknown poker route.</h2>']);
    } catch (err) {
      setStatus(err.code ? `${err.code}: ${err.message}` : (err.message || 'Unexpected error'));
      renderCards([`<h2>Unable to load poker page.</h2><p>${escapeHtml(err.code || err.message || 'Unexpected error')}</p>`]);
    }
  }

  route();
})();
