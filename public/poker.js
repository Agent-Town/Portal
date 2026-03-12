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
  let liveTableTransportProtocol = '';
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

  function readRouteInviteCode() {
    return String(getRouteSearchParams().get('inviteCode') || '').trim();
  }

  function shouldPreserveInviteCode(pathname) {
    const path = String(pathname || '');
    return /^\/(?:api\/)?poker\/play\/tables\/[^/]+(?:\/stream)?$/i.test(path);
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
    const inviteCode = readRouteInviteCode();
    if (asOf && !parsed.searchParams.has('asOf')) {
      parsed.searchParams.set('asOf', asOf);
    }
    if (inviteCode && shouldPreserveInviteCode(parsed.pathname) && !parsed.searchParams.has('inviteCode')) {
      parsed.searchParams.set('inviteCode', inviteCode);
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

  function buildPokerWebSocketUrl(path, extraParams = {}) {
    const href = buildPokerHref(path, extraParams);
    const parsed = new URL(href, window.location.origin);
    parsed.protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
    return parsed.toString();
  }

  function setLiveTransportDebugState(patch) {
    liveTableTransportProtocol = String(patch?.protocol || liveTableTransportProtocol || '').trim();
    window.__pokerLiveTransportDebug = {
      ...(window.__pokerLiveTransportDebug || {}),
      protocol: liveTableTransportProtocol || '',
      ...(patch && typeof patch === 'object' ? patch : {}),
      updatedAtMs: Date.now(),
    };
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
    const inviteCode = readRouteInviteCode();
    if (asOf) params.set('asOf', asOf);
    if (inviteCode && shouldPreserveInviteCode(basePath)) params.set('inviteCode', inviteCode);
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

  function buildPlayHistoryExportApiPath(tableId, { format = 'json', status = '' } = {}) {
    return buildPokerApiPath(`/api/poker/play/tables/${encodeURIComponent(tableId)}/history/export`, {
      format,
      status,
    });
  }

  function buildPlayHandReviewApiPath(handId) {
    return buildPokerApiPath(`/api/poker/play/hands/${encodeURIComponent(handId)}/review`);
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

  function buildPlayOpsDashboardApiPath() {
    return buildPokerApiPath('/api/poker/play/admin/ops');
  }

  function buildPlayAdminScheduleTemplatesApiPath() {
    return buildPokerApiPath('/api/poker/play/admin/schedule/templates');
  }

  function buildPlayScheduleApiPath() {
    return buildPokerApiPath('/api/poker/play/schedule');
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

  async function fetchWithIdentity(path, options = {}) {
    const identityHeaders = await buildIdentityHeaders();
    const headers = {
      ...identityHeaders,
      ...(options.headers || {}),
    };
    return await fetch(path, {
      credentials: 'include',
      cache: 'no-store',
      ...options,
      headers,
    });
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
    liveTableTransportProtocol = '';
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

  function formatTournamentBountyModelLabel(bountyModel) {
    return String(bountyModel || '').trim().toLowerCase() === 'pko_50'
      ? 'PKO 50/50'
      : 'Standard';
  }

  function isSitAndGoFillPolicy(fillPolicy) {
    const value = String(fillPolicy || '').trim().toLowerCase();
    return value === 'fill_to_full' || value === 'fill_to_target';
  }

  function formatTournamentFillPolicyLabel(fillPolicy) {
    const value = String(fillPolicy || '').trim().toLowerCase();
    if (value === 'fill_to_full') return 'sit-and-go';
    if (value === 'fill_to_target') return 'sit-and-go target';
    return 'open match';
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
            <span>${Number(item.bountyWonOil || 0) > 0 ? `${Number(item.totalWonOil || (Number(item.prizeOil || 0) + Number(item.bountyWonOil || 0)))} OIL (${Number(item.prizeOil || 0)} prize + ${Number(item.bountyWonOil || 0)} bounty)` : `${Number(item.prizeOil || 0)} OIL`}</span>
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
              ${renderSummaryMetric('Bounty', `${Number(item.bountyOil || 0)} OIL`)}
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
              ${Number(item.notebookEntryCount || 0) > 0 ? `<span class="pokerBadge">${Number(item.notebookEntryCount || 0)} notebook</span>` : ''}
              ${Number(item.opponentNoteCount || 0) > 0 ? `<span class="pokerBadge">${Number(item.opponentNoteCount || 0)} opponent note${Number(item.opponentNoteCount || 0) === 1 ? '' : 's'}</span>` : ''}
            </div>
            <div class="pokerLabel">Board</div>
            ${renderPokerCards(item.communityCards || [])}
            ${item.agentProposal ? `<p>${escapeHtml(item.agentProposal.body || 'No worker note.')}</p>` : ''}
            ${Array.isArray(item.actions) && item.actions.length ? renderPublicActionLog(item.actions, 'No public actions logged.') : '<p class="pokerMuted">No public actions logged.</p>'}
            ${item.reviewPath ? `
              <div class="pokerLinks">
                <a href="${escapeHtml(buildPokerHref(item.reviewPath))}">Review Hand</a>
              </div>
            ` : ''}
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

  function renderOpsMetricCards(cards) {
    const items = Array.isArray(cards) ? cards : [];
    if (!items.length) return '<p>No operator metrics available.</p>';
    return `
      <div class="pokerStack">
        ${items.map((item) => `
          <div class="pokerMessage" data-ops-card="${escapeHtml(item.metricKey || '')}">
            <div class="pokerSplit">
              <div>
                <div class="pokerLabel">${escapeHtml(item.label || 'Metric')}</div>
                <div class="pokerSummaryValue">${escapeHtml(`${Number(item.count || 0)}`)}</div>
              </div>
              <div class="pokerLinks">
                <a href="${escapeHtml(buildPokerHref(item.href || '/poker/play'))}">Open</a>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderOpsTableRows(items, emptyText = 'No operator table rows.') {
    const rows = Array.isArray(items) ? items : [];
    if (!rows.length) return `<p>${escapeHtml(emptyText)}</p>`;
    return `
      <div class="pokerStack">
        ${rows.map((item) => `
          <div class="pokerMessage">
            <div class="pokerSplit">
              <div>
                <div class="pokerLabel">${escapeHtml(item.tableTitle || item.tableId || 'Poker Table')}</div>
                <div>${escapeHtml(item.status || item.tableType || 'open')}${item.reason ? ` · ${escapeHtml(item.reason)}` : ''}</div>
              </div>
              <div class="pokerLinks">
                <a href="${escapeHtml(buildPokerHref(item.href || '/poker/play'))}">Open</a>
              </div>
            </div>
            <div class="pokerMeta">
              ${item.tableType ? `<span class="pokerBadge">${escapeHtml(item.tableType)}</span>` : ''}
              ${item.liveHand ? '<span class="pokerBadge">live hand</span>' : ''}
              ${item.occupancy != null ? `<span class="pokerBadge">${Number(item.occupancy || 0)} seated</span>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderOpsSeriesRows(items) {
    const rows = Array.isArray(items) ? items : [];
    if (!rows.length) return '<p>No live tournament series.</p>';
    return `
      <div class="pokerStack">
        ${rows.map((item) => `
          <div class="pokerMessage">
            <div class="pokerSplit">
              <div>
                <div class="pokerLabel">${escapeHtml(item.seriesTitle || item.seriesId || 'Tournament Series')}</div>
                <div>${escapeHtml(item.stage || 'unknown')} · ${Number(item.entryCount || 0)} entrants</div>
              </div>
              <div class="pokerLinks">
                <a href="${escapeHtml(buildPokerHref(item.href || '/poker/play'))}">Open</a>
              </div>
            </div>
            <div class="pokerMeta">
              <span class="pokerBadge">${Number(item.tableCount || 0)} tables</span>
              <span class="pokerBadge">${Number(item.liveTableCount || 0)} live</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderOpsSeatRows(items) {
    const rows = Array.isArray(items) ? items : [];
    if (!rows.length) return '<p>No disconnected seats.</p>';
    return `
      <div class="pokerStack">
        ${rows.map((item) => `
          <div class="pokerMessage">
            <div class="pokerSplit">
              <div>
                <div class="pokerLabel">${escapeHtml(item.tableTitle || item.tableId || 'Poker Table')}</div>
                <div>${escapeHtml(`Seat ${Number(item.seatNumber || 0)}${item.displayName ? ` (${item.displayName})` : ''}`)}</div>
              </div>
              <div class="pokerMuted">${escapeHtml(formatIso(item.disconnectedAt))}</div>
            </div>
            <div class="pokerLinks">
              <a href="${escapeHtml(buildPokerHref(item.href || '/poker/play'))}">Open</a>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderOpsIssueRows(items, emptyText = 'No operator issue rows.') {
    const rows = Array.isArray(items) ? items : [];
    if (!rows.length) return `<p>${escapeHtml(emptyText)}</p>`;
    return `
      <div class="pokerStack">
        ${rows.map((item) => `
          <div class="pokerMessage">
            <div class="pokerSplit">
              <div>
                <div class="pokerLabel">${escapeHtml(item.tableTitle || item.tableId || 'Poker Table')}</div>
                <div>${escapeHtml(item.category || item.summary || item.note || 'issue')}</div>
              </div>
              <div class="pokerLinks">
                <a href="${escapeHtml(buildPokerHref(item.href || '/poker/play'))}">Open</a>
              </div>
            </div>
            ${item.summary ? `<div>${escapeHtml(item.summary)}</div>` : ''}
            ${item.note ? `<div>${escapeHtml(item.note)}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderOpsLedgerRows(items, emptyText = 'No recent ledger rows.') {
    const rows = Array.isArray(items) ? items : [];
    if (!rows.length) return `<p>${escapeHtml(emptyText)}</p>`;
    return `
      <div class="pokerStack">
        ${rows.map((item) => `
          <div class="pokerMessage">
            <div class="pokerSplit">
              <div>
                <div class="pokerLabel">${escapeHtml(item.tableTitle || item.seriesTitle || item.walletSubject || 'Ledger Row')}</div>
                <div>${escapeHtml(item.entryKind || 'ledger')} · ${Number(item.amount || 0)} OIL</div>
              </div>
              <div class="pokerMuted">${escapeHtml(formatIso(item.createdAt))}</div>
            </div>
            <div class="pokerLinks">
              <a href="${escapeHtml(buildPokerHref(item.href || '/poker/play'))}">Open</a>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderOpsWalletRows(items) {
    const rows = Array.isArray(items) ? items : [];
    if (!rows.length) return '<p>No wallet reconciliation rows.</p>';
    return `
      <div class="pokerStack">
        ${rows.map((item) => `
          <div class="pokerMessage">
            <div class="pokerSplit">
              <div>
                <div class="pokerLabel">${escapeHtml(item.walletSubject || 'wallet')}</div>
                <div>${escapeHtml(`${Number(item.mismatchCount || 0)} mismatch${Number(item.mismatchCount || 0) === 1 ? '' : 'es'}`)}</div>
              </div>
              <div class="pokerMuted">${escapeHtml(`${Number(item.balanceDelta || 0)} OIL delta`)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderOpsMismatchRows(items) {
    const rows = Array.isArray(items) ? items : [];
    if (!rows.length) return '<p>No reconciliation mismatches.</p>';
    return `
      <div class="pokerStack">
        ${rows.map((item) => `
          <div class="pokerMessage">
            <div class="pokerSplit">
              <div>
                <div class="pokerLabel">${escapeHtml(item.category || 'mismatch')}</div>
                <div>${escapeHtml(item.title || item.seriesTitle || item.walletSubject || 'Ledger')}</div>
              </div>
              <div class="pokerMuted">${escapeHtml(item.ledgerEntryId || 'missing')}</div>
            </div>
            <div>${escapeHtml(`expected ${Number(item.expectedAmount || 0)} · actual ${Number(item.actualAmount || 0)}`)}</div>
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

  function triggerTextDownload(filename, text, mimeType = 'text/plain') {
    const blob = new Blob([String(text || '')], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  function renderTagBadges(tags, emptyText = 'No tags yet.') {
    const items = Array.isArray(tags) ? tags.map((tag) => String(tag || '').trim()).filter(Boolean) : [];
    if (!items.length) return `<p class="pokerMuted">${escapeHtml(emptyText)}</p>`;
    return renderMetaBadges(items);
  }

  function renderNotebookEntryRows(items, { emptyText = 'No notebook entries yet.', showBody = true } = {}) {
    const rows = Array.isArray(items) ? items : [];
    if (!rows.length) return `<p>${escapeHtml(emptyText)}</p>`;
    return `
      <div class="pokerStack">
        ${rows.map((item) => `
          <div class="pokerMessage">
            <div class="pokerSplit">
              <div>
                <div class="pokerLabel">${escapeHtml(item.topic || (item.entryKind === 'opponent_note' ? 'Opponent Note' : 'Notebook Entry'))}</div>
                <div>${escapeHtml(item.opponentDisplayName || item.opponentWalletSubject || item.tableTitle || 'Study entry')}</div>
              </div>
              <div class="pokerMuted">${escapeHtml(formatIso(item.updatedAt || item.createdAt))}</div>
            </div>
            ${showBody ? `<div>${escapeHtml(item.body || '')}</div>` : ''}
            ${renderTagBadges(item.tags, 'No lesson tags.')}
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderStudyPreview(study) {
    const data = study && typeof study === 'object' ? study : null;
    if (!data) return '';
    const recentEntries = Array.isArray(data.recentEntries) ? data.recentEntries : [];
    const opponentNotes = Array.isArray(data.opponentNotes) ? data.opponentNotes : [];
    return `
      <h2>Study</h2>
      <div class="pokerSummary">
        ${renderSummaryMetric('Notebook', `${Number(data.notebookCount || 0)}`)}
        ${renderSummaryMetric('Opponent Notes', `${Number(data.opponentNoteCount || 0)}`)}
      </div>
      <div class="pokerLinks">
        ${data.handReviewPath ? `<a href="${escapeHtml(buildPokerHref(data.handReviewPath))}">Open Current Hand Review</a>` : ''}
        <a href="${escapeHtml(buildPokerHref(window.location.pathname.replace(/\/$/, '') + '/history', { status: 'completed' }))}">Open Hand History</a>
      </div>
      ${recentEntries.length ? `
        <div class="pokerLabel">Recent Notebook</div>
        ${renderNotebookEntryRows(recentEntries, { emptyText: 'No notebook entries yet.' })}
      ` : '<p>No notebook entries saved yet.</p>'}
      ${opponentNotes.length ? `
        <div class="pokerLabel">Recent Opponent Notes</div>
        ${renderNotebookEntryRows(opponentNotes, { emptyText: 'No opponent notes yet.' })}
      ` : '<p>No opponent notes saved yet.</p>'}
    `;
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
      ? items.map((action) => `<option value="${escapeHtml(action)}">${escapeHtml(formatPokerActionLabel(action))}</option>`).join('')
      : '<option value="">No actions</option>';
  }

  function formatPokerActionLabel(action) {
    const value = String(action || '').trim().toLowerCase();
    if (value === 'shove') return 'Shove';
    if (value === 'check_fold') return 'Check/Fold';
    if (value.includes('_')) return value.replace(/_/g, ' ');
    return value || 'action';
  }

  function formatAutoActLabel(mode) {
    const value = String(mode || 'off').trim().toLowerCase();
    if (value === 'check_fold') return 'check/fold';
    if (value === 'seat_agent_auto') return 'seat-agent auto';
    if (value === 'propose_only') return 'propose only';
    return value || 'off';
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

  function bindLegacyLiveTableStream(tableId, { rail = false } = {}) {
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
    setLiveTransportDebugState({
      protocol: 'sse',
      channelKind: 'table',
      channelId: tableId,
      viewerMode: rail ? 'rail' : 'player',
      state: 'connected',
    });
    stream.addEventListener('table', () => {
      if (window.location.pathname === expectedPath) {
        refreshLiveTable(tableId, { silent: true, rail }).catch(() => {});
      }
    });
    stream.addEventListener('error', () => {
      setLiveTransportDebugState({
        protocol: 'sse',
        channelKind: 'table',
        channelId: tableId,
        viewerMode: rail ? 'rail' : 'player',
        state: 'error',
      });
      scheduleLiveTableRefresh(tableId, { rail });
    });
  }

  function bindLegacyRailSeriesStream(seriesId) {
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
    setLiveTransportDebugState({
      protocol: 'sse',
      channelKind: 'series',
      channelId: seriesId,
      viewerMode: 'rail',
      state: 'connected',
    });
    stream.addEventListener('series', () => {
      if (window.location.pathname === expectedPath) {
        refreshRailSeries(seriesId, { silent: true }).catch(() => {});
      }
    });
    stream.addEventListener('error', () => {
      setLiveTransportDebugState({
        protocol: 'sse',
        channelKind: 'series',
        channelId: seriesId,
        viewerMode: 'rail',
        state: 'error',
      });
      scheduleRailSeriesRefresh(seriesId);
    });
  }

  function bindLiveTableStream(tableId, { rail = false } = {}) {
    if (!tableId) return;
    if (typeof window.WebSocket !== 'function') {
      bindLegacyLiveTableStream(tableId, { rail });
      return;
    }
    const streamKey = `${rail ? 'rail' : 'player'}:${tableId}`;
    if (liveTableStream && liveTableStreamKey === streamKey) return;
    clearLiveTableStream();
    liveTableStreamKey = streamKey;
    const expectedPath = rail ? `/poker/play/rail/tables/${tableId}` : `/poker/play/tables/${tableId}`;
    const socket = new window.WebSocket(buildPokerWebSocketUrl('/api/poker/play/ws', {
      channelKind: 'table',
      channelId: tableId,
      viewer: rail ? 'rail' : 'player',
    }));
    liveTableStream = socket;
    socket.addEventListener('open', () => {
      setLiveTransportDebugState({
        protocol: 'ws',
        channelKind: 'table',
        channelId: tableId,
        viewerMode: rail ? 'rail' : 'player',
        state: 'connected',
      });
    });
    socket.addEventListener('message', (event) => {
      let payload = null;
      try {
        payload = JSON.parse(String(event.data || '{}'));
      } catch {
        payload = null;
      }
      if (!payload || typeof payload !== 'object') return;
      setLiveTransportDebugState({
        protocol: 'ws',
        channelKind: 'table',
        channelId: tableId,
        viewerMode: rail ? 'rail' : 'player',
        state: 'connected',
        lastMessageKind: String(payload.messageKind || ''),
        lastVersion: Number(payload.version || 0),
        lastReason: String(payload.reason || ''),
      });
      const messageKind = String(payload.messageKind || '').trim().toLowerCase();
      if (!['delta', 'reset'].includes(messageKind)) return;
      if (window.location.pathname === expectedPath) {
        refreshLiveTable(tableId, { silent: true, rail }).catch(() => {});
      }
    });
    const handleFailure = () => {
      if (liveTableStream !== socket) return;
      setLiveTransportDebugState({
        protocol: 'ws',
        channelKind: 'table',
        channelId: tableId,
        viewerMode: rail ? 'rail' : 'player',
        state: 'error',
      });
      scheduleLiveTableRefresh(tableId, { rail });
    };
    socket.addEventListener('error', handleFailure);
    socket.addEventListener('close', handleFailure);
  }

  function bindRailSeriesStream(seriesId) {
    if (!seriesId) return;
    if (typeof window.WebSocket !== 'function') {
      bindLegacyRailSeriesStream(seriesId);
      return;
    }
    const streamKey = `series:${seriesId}`;
    if (liveTableStream && liveTableStreamKey === streamKey) return;
    clearLiveTableStream();
    liveTableStreamKey = streamKey;
    const expectedPath = `/poker/play/rail/series/${seriesId}`;
    const socket = new window.WebSocket(buildPokerWebSocketUrl('/api/poker/play/ws', {
      channelKind: 'series',
      channelId: seriesId,
      viewer: 'rail',
    }));
    liveTableStream = socket;
    socket.addEventListener('open', () => {
      setLiveTransportDebugState({
        protocol: 'ws',
        channelKind: 'series',
        channelId: seriesId,
        viewerMode: 'rail',
        state: 'connected',
      });
    });
    socket.addEventListener('message', (event) => {
      let payload = null;
      try {
        payload = JSON.parse(String(event.data || '{}'));
      } catch {
        payload = null;
      }
      if (!payload || typeof payload !== 'object') return;
      setLiveTransportDebugState({
        protocol: 'ws',
        channelKind: 'series',
        channelId: seriesId,
        viewerMode: 'rail',
        state: 'connected',
        lastMessageKind: String(payload.messageKind || ''),
        lastVersion: Number(payload.version || 0),
        lastReason: String(payload.reason || ''),
      });
      const messageKind = String(payload.messageKind || '').trim().toLowerCase();
      if (!['delta', 'reset'].includes(messageKind)) return;
      if (window.location.pathname === expectedPath) {
        refreshRailSeries(seriesId, { silent: true }).catch(() => {});
      }
    });
    const handleFailure = () => {
      if (liveTableStream !== socket) return;
      setLiveTransportDebugState({
        protocol: 'ws',
        channelKind: 'series',
        channelId: seriesId,
        viewerMode: 'rail',
        state: 'error',
      });
      scheduleRailSeriesRefresh(seriesId);
    };
    socket.addEventListener('error', handleFailure);
    socket.addEventListener('close', handleFailure);
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
    const pokerPolicy = payload?.data?.pokerPolicy || null;
    const dailySpendCapOil = Number(pokerPolicy?.dailySpendCapOil || 0);
    const todaySpendOil = Number(pokerPolicy?.todaySpendOil || 0);
    const remainingDailySpendOil = pokerPolicy?.remainingDailySpendOil == null
      ? null
      : Number(pokerPolicy?.remainingDailySpendOil || 0);
    const selfExcluded = !!pokerPolicy?.selfExcluded;
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
        <h2>Poker Policy</h2>
        <p>Wallet-level guardrails apply before live poker OIL spend. Daily caps reset at UTC midnight, and self-exclusion blocks new live-poker spend until the lock expires.</p>
        <div class="pokerSummary">
          ${renderSummaryMetric('Daily Cap', dailySpendCapOil > 0 ? `${dailySpendCapOil} OIL` : 'unlimited')}
          ${renderSummaryMetric('Spent Today', `${todaySpendOil} OIL`)}
          ${renderSummaryMetric('Remaining Today', remainingDailySpendOil == null ? 'unlimited' : `${remainingDailySpendOil} OIL`)}
          ${renderSummaryMetric('Self-Exclusion', selfExcluded ? `active until ${formatIso(pokerPolicy?.selfExcludedUntil)}` : 'inactive')}
        </div>
        <form id="pokerPlayPolicyForm" class="pokerForm">
          <label>
            Daily Spend Cap OIL
            <input id="pokerPlayPolicyDailyCap" type="number" min="0" placeholder="0 = unlimited" value="${dailySpendCapOil > 0 ? escapeHtml(String(dailySpendCapOil)) : ''}">
          </label>
          <button class="pokerButton" type="submit">Save Limit</button>
          <button id="pokerPlayPolicySelfExclude24h" class="pokerButton" type="button"${selfExcluded ? ' disabled' : ''}>Self-Exclude 24h</button>
        </form>
      `,
      `
        <h2>Quick Seat</h2>
        <p>Matchmake into an existing live table with the same structure, create a new public one instantly if no match exists, create a sit-and-go that waits for either a full table or a configured start target, or create an invite-only table that stays out of the public lobby and rail.</p>
        <div class="pokerLinks">
          <a href="${escapeHtml(buildPokerHref('/poker/play/schedule'))}">Tournament Schedule</a>
          <a href="${escapeHtml(buildPokerHref('/poker/play/rail'))}">Open Public Rail</a>
          <a href="${escapeHtml(buildPokerHref('/poker/play/results'))}">My Results</a>
        </div>
        <form id="pokerPlayMatchmakeForm" class="pokerForm">
          <label>
            Access
            <select id="pokerPlayMatchmakeAccess">
              <option value="public">Public</option>
              <option value="invite_only">Invite Only</option>
            </select>
          </label>
          <label>
            Table Type
            <select id="pokerPlayMatchmakeType">
              <option value="cash">Cash</option>
              <option value="tournament">Tournament</option>
            </select>
          </label>
          <label id="pokerPlayMatchmakeFillPolicyRow" hidden>
            Tournament Start
            <select id="pokerPlayMatchmakeFillPolicy">
              <option value="open_match">Open Match</option>
              <option value="fill_to_full">Sit-And-Go Fill To Full</option>
              <option value="fill_to_target">Sit-And-Go Fill To Target</option>
            </select>
          </label>
          <label id="pokerPlayMatchmakeMaxSeatsRow" hidden>
            Table Cap
            <select id="pokerPlayMatchmakeMaxSeats">
              <option value="6">6 Seats</option>
              <option value="3">3 Seats</option>
            </select>
          </label>
          <label id="pokerPlayMatchmakeStartTargetRow" hidden>
            Start Target
            <select id="pokerPlayMatchmakeStartTargetSeats"></select>
          </label>
          <label id="pokerPlayMatchmakeBountyRow" hidden>
            Tournament Bounty
            <select id="pokerPlayMatchmakeBountyModel">
              <option value="none">Standard</option>
              <option value="pko_50">PKO 50/50</option>
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
          <label>
            Table Title
            <input id="pokerPlayMatchmakeTitle" maxlength="96" placeholder="Optional custom title">
          </label>
          <button class="pokerButton" type="submit"${selfExcluded ? ' disabled' : ''}>Join Or Create</button>
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
                String(item?.bountyModel || '') === 'pko_50' ? `${Number(item?.bountyPoolOil || 0)} OIL bounty` : '',
                String(item?.bountyModel || '') === 'pko_50' ? formatTournamentBountyModelLabel(item?.bountyModel) : '',
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
                item?.tableType === 'tournament' && isSitAndGoFillPolicy(item?.summary?.fillPolicy) ? formatTournamentFillPolicyLabel(item?.summary?.fillPolicy) : '',
                item.accessMode === 'invite_only' ? 'invite-only' : '',
                `${Number(item.smallBlindOil || 0)} / ${Number(item.bigBlindOil || 0)}`,
                `${Number(item.buyInOil || 0)} OIL buy-in`,
                `${Number(item?.summary?.occupancy || 0)}/${Number(item.maxSeats || 6)} seated`,
                item?.tableType === 'tournament' && !item?.summary?.liveHand && Number(item?.summary?.seatsUntilStart || 0) > 0
                  ? `${Number(item?.summary?.seatsUntilStart || 0)} to start`
                  : '',
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
                item?.tableType === 'tournament' && String(item?.summary?.bountyModel || '') === 'pko_50'
                  ? `${Number(item.summary.bountyPoolOil || 0)} OIL bounty`
                  : '',
                item?.tableType === 'tournament' && String(item?.summary?.bountyModel || '') === 'pko_50'
                  ? formatTournamentBountyModelLabel(item?.summary?.bountyModel)
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
    bindPlayPolicyForm();
    bindPlayMatchmakeForm();
    setStatus(items.length ? `${items.length} live poker table${items.length === 1 ? '' : 's'} loaded.` : 'No live poker table available.');
  }

  async function loadPlaySchedule() {
    clearLiveTableStream();
    setTitle('Tournament Schedule', 'Recurring events, registration windows, and scheduled player breaks.');
    setStatus('Loading tournament schedule...');
    const adminToken = readStoredPokerAdminToken();
    const payload = await api(buildPlayScheduleApiPath());
    let adminPayload = null;
    let adminError = '';
    if (adminToken) {
      try {
        adminPayload = await api(buildPlayAdminScheduleTemplatesApiPath(), {
          headers: { 'x-admin-token': adminToken },
        });
      } catch (err) {
        adminError = err.code || err.message || 'UNKNOWN';
      }
    }
    const data = payload?.data || {};
    const adminData = adminPayload?.data || {};
    const summary = data?.summary || {};
    const adminSummary = adminData?.summary || {};
    const adminTemplates = Array.isArray(adminData?.templates) ? adminData.templates : [];
    const templates = Array.isArray(data?.templates) ? data.templates : [];
    const days = Array.isArray(data?.days) ? data.days : [];
    const cards = [
      `
        <h2>Schedule Snapshot</h2>
        <div class="pokerSummary">
          ${renderSummaryMetric('House', data?.houseId || 'Pending')}
          ${renderSummaryMetric('Wallet', data?.wallet?.address || 'Bind wallet')}
          ${renderSummaryMetric('Templates', `${Number(summary?.templateCount || 0)}`)}
          ${renderSummaryMetric('Upcoming Events', `${Number(summary?.eventCount || 0)}`)}
          ${renderSummaryMetric('Registered', `${Number(summary?.registeredCount || 0)}`)}
          ${renderSummaryMetric('Waitlisted', `${Number(summary?.waitlistedCount || 0)}`)}
        </div>
        <div class="pokerLinks">
          <a href="${escapeHtml(buildPokerHref('/poker/play'))}">Back To Lobby</a>
          <a href="${escapeHtml(buildPokerHref('/poker/play/results'))}">My Results</a>
        </div>
      `,
      adminToken
        ? `
          <h2>Schedule Admin</h2>
          <p>Durable recurring templates materialize real scheduled tournament tables. Create the template here; the public calendar stays on the same minimal route.</p>
          ${adminError
            ? `<p>Admin schedule load failed: ${escapeHtml(adminError)}</p>`
            : `
              <div class="pokerSummary">
                ${renderSummaryMetric('Templates', `${Number(adminSummary?.templateCount || 0)}`)}
                ${renderSummaryMetric('Events', `${Number(adminSummary?.eventCount || 0)}`)}
                ${renderSummaryMetric('Next Start', adminSummary?.nextStartAt ? formatIso(adminSummary.nextStartAt) : 'none')}
              </div>
            `}
          <form id="pokerPlayScheduleTemplateForm" class="pokerForm">
            <label>
              Title
              <input id="pokerPlayScheduleTemplateTitle" type="text" value="Daily Centaur Sprint" maxlength="80" required>
            </label>
            <label>
              First Start At
              <input id="pokerPlayScheduleTemplateFirstStartAt" type="text" value="2026-03-13T12:00:00.000Z" placeholder="2026-03-13T12:00:00.000Z" required>
            </label>
            <label>
              Recurrence
              <select id="pokerPlayScheduleTemplateRecurrenceKind">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </label>
            <label>
              Event Count
              <input id="pokerPlayScheduleTemplateEventCount" type="number" min="1" max="12" value="3">
            </label>
            <label>
              Buy-In OIL
              <input id="pokerPlayScheduleTemplateBuyInOil" type="number" min="0" value="400">
            </label>
            <label>
              Small Blind OIL
              <input id="pokerPlayScheduleTemplateSmallBlindOil" type="number" min="1" value="50">
            </label>
            <label>
              Big Blind OIL
              <input id="pokerPlayScheduleTemplateBigBlindOil" type="number" min="1" value="100">
            </label>
            <button class="pokerButton" type="submit">Create Template</button>
          </form>
          ${adminTemplates.length
            ? `
              <div class="pokerStack">
                ${adminTemplates.map((item) => `
                  <div class="pokerMessage">
                    <div class="pokerLabel">${escapeHtml(item?.title || 'Schedule Template')}</div>
                    <div>${escapeHtml(item?.recurrenceLabel || 'Recurring')}</div>
                    <div>${escapeHtml(String(item?.status || 'active'))}</div>
                    <div>${Number(item?.generatedEventCount || 0)} generated event${Number(item?.generatedEventCount || 0) === 1 ? '' : 's'}</div>
                    <div class="pokerLabel">${item?.nextStartAt ? `Next start ${escapeHtml(formatIso(item.nextStartAt))}` : 'No generated event yet.'}</div>
                    ${String(item?.status || 'active') === 'active'
                      ? `<button class="pokerButton" type="button" data-schedule-template-cancel="${escapeHtml(String(item?.templateId || ''))}">Cancel Template</button>`
                      : ''}
                  </div>
                `).join('')}
              </div>
            `
            : '<p>No durable schedule templates yet.</p>'}
        `
        : '',
      templates.length
        ? `
          <h2>Recurring Templates</h2>
          <div class="pokerStack">
            ${templates.map((item) => `
              <div class="pokerMessage">
                <div class="pokerLabel">${escapeHtml(item?.title || 'Tournament Template')}</div>
                <div>${escapeHtml(item?.recurrenceLabel || 'Ad hoc schedule')}</div>
                <div>${Number(item?.upcomingCount || 0)} upcoming event${Number(item?.upcomingCount || 0) === 1 ? '' : 's'}</div>
                <div class="pokerLabel">${item?.nextStartAt ? `Next start ${escapeHtml(formatIso(item.nextStartAt))}` : 'No next start yet.'}</div>
              </div>
            `).join('')}
          </div>
        `
        : '<h2>Recurring Templates</h2><p>No recurring tournament templates are scheduled yet.</p>',
    ];
    for (const day of days) {
      const items = Array.isArray(day?.items) ? day.items : [];
      cards.push(`
        <h2>${escapeHtml(day?.day || 'Upcoming')}</h2>
        <div class="pokerStack">
          ${items.map((item) => `
            <div class="pokerMessage" data-schedule-card="${escapeHtml(item?.tableId || '')}">
              <div class="pokerLabel">${escapeHtml(item?.title || 'Tournament')}</div>
              <div>${escapeHtml(formatIso(item?.scheduledStartAt))}</div>
              ${renderMetaBadges([
                String(item?.registrationStatus || 'closed'),
                item?.scheduleRecurrenceLabel || '',
                Number(item?.scheduledBreakCount || 0) > 0 ? `${Number(item?.scheduledBreakCount || 0)} break${Number(item?.scheduledBreakCount || 0) === 1 ? '' : 's'}` : '',
              ].filter(Boolean))}
              <div class="pokerSummary">
                ${renderSummaryMetric('Buy-In', `${Number(item?.buyInOil || 0)} OIL`)}
                ${renderSummaryMetric('Entries', `${Number(item?.entryCount || 0)}`)}
                ${renderSummaryMetric('Open Seats', `${Number(item?.openSeatCount || 0)}`)}
                ${renderSummaryMetric('Waitlist', `${Number(item?.waitlistCount || 0)}`)}
                ${Number(item?.nextScheduledBreakAfterHandNumber || 0) > 0 ? renderSummaryMetric('Next Break', `${String(item?.nextScheduledBreakLabel || 'Break')} after hand ${Number(item?.nextScheduledBreakAfterHandNumber || 0)}`) : ''}
              </div>
              <div class="pokerLinks">
                ${renderPlayScheduleActionButtons(item)}
                <a href="${escapeHtml(buildPokerHref(item?.links?.table || '/poker/play'))}">Open Lobby Table</a>
                ${item?.links?.timeline ? `<a href="${escapeHtml(buildPokerHref(item.links.timeline))}">Series Timeline</a>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `);
    }
    if (!days.length) {
      cards.push('<h2>No Scheduled Events</h2><p>No tournament events are scheduled in the current calendar window.</p>');
    }
    renderCards(cards);
    setStatus(Number(summary?.eventCount || 0) > 0
      ? `${Number(summary?.eventCount || 0)} scheduled tournament event${Number(summary?.eventCount || 0) === 1 ? '' : 's'} loaded.`
      : 'No tournament events are scheduled right now.');
    bindPlayScheduleAdminForm();
    bindPlayScheduleTemplateActions();
    bindPlayScheduleActions();
  }

  function renderPlayScheduleActionButtons(item) {
    const tableId = String(item?.tableId || '').trim();
    const actions = item?.actions && typeof item.actions === 'object' ? item.actions : {};
    const buyInOil = Number(item?.buyInOil || 0);
    const buttons = [];
    const pushButton = (action, kind, label) => {
      if (!action || !tableId) return;
      const path = String(action?.path || '').trim();
      const method = String(action?.method || '').trim().toUpperCase();
      if (!path || !method) return;
      buttons.push(`<button class="pokerButton" type="button" data-schedule-action-kind="${escapeHtml(kind)}" data-schedule-table-id="${escapeHtml(tableId)}" data-schedule-method="${escapeHtml(method)}" data-schedule-path="${escapeHtml(path)}" data-schedule-buy-in-oil="${escapeHtml(String(buyInOil))}">${escapeHtml(label)}</button>`);
    };
    pushButton(actions?.register, 'register', 'Register');
    pushButton(actions?.waitlist, 'waitlist', 'Join Waitlist');
    pushButton(actions?.unregister, 'unregister', 'Unregister');
    pushButton(actions?.leaveWaitlist, 'leave_waitlist', 'Leave Waitlist');
    return buttons.join('');
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
                String(item?.bountyModel || '') === 'pko_50' ? `${Number(item?.bountyPoolOil || 0)} OIL bounty` : '',
                String(item?.bountyModel || '') === 'pko_50' ? formatTournamentBountyModelLabel(item?.bountyModel) : '',
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
                item?.tableType === 'tournament' && isSitAndGoFillPolicy(item?.summary?.fillPolicy) ? formatTournamentFillPolicyLabel(item?.summary?.fillPolicy) : '',
                `${Number(item.smallBlindOil || 0)} / ${Number(item.bigBlindOil || 0)}`,
                `${Number(item?.summary?.occupancy || 0)}/${Number(item.maxSeats || 6)} seated`,
                item?.tableType === 'tournament' && !item?.summary?.liveHand && Number(item?.summary?.seatsUntilStart || 0) > 0
                  ? `${Number(item?.summary?.seatsUntilStart || 0)} to start`
                  : '',
                item?.summary?.liveHand ? `hand ${Number(item?.summary?.handNumber || 0)}` : 'waiting',
                Number(item?.summary?.disconnectedSeatCount || 0) > 0 ? `${Number(item.summary.disconnectedSeatCount || 0)} disconnected` : '',
                item?.tableType === 'tournament' && Number(item?.summary?.prizePoolOil || 0) > 0
                  ? `${Number(item.summary.prizePoolOil || 0)} OIL pool`
                  : '',
                item?.tableType === 'tournament' && String(item?.summary?.bountyModel || '') === 'pko_50'
                  ? `${Number(item.summary.bountyPoolOil || 0)} OIL bounty`
                  : '',
                item?.tableType === 'tournament' && String(item?.summary?.bountyModel || '') === 'pko_50'
                  ? formatTournamentBountyModelLabel(item?.summary?.bountyModel)
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
          ${renderSummaryMetric('Bounty Mode', formatTournamentBountyModelLabel(series?.bountyModel))}
          ${Number(series?.bountyPoolOil || 0) > 0 ? renderSummaryMetric('Bounty Pool', `${Number(series?.bountyPoolOil || 0)} OIL`) : ''}
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
          ${renderSummaryMetric('Bounties', `${Number(summary?.bountyOil || 0)} OIL`)}
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
          ${renderSummaryMetric('Bounty Won', `${Number(summary?.tournamentBountyOil || 0)} OIL`)}
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
          <button id="pokerPlayHistoryExportJson" class="pokerButton" type="button">Export JSON</button>
          <button id="pokerPlayHistoryExportNdjson" class="pokerButton" type="button">Export NDJSON</button>
          <button id="pokerPlayHistoryExportText" class="pokerButton" type="button">Export Text</button>
        </div>
      `,
      `
        <h2>Hands</h2>
        ${renderPlayHandHistoryRows(items)}
      `,
    ]);
    bindPlayHistoryExportButtons(table?.tableId || tableId, { status: filterStatus });
    setStatus(items.length ? `${items.length} hand history row${items.length === 1 ? '' : 's'} loaded.` : 'No hand history rows matched this filter.');
  }

  function parseTagInput(value) {
    return String(value || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  async function downloadPlayHistoryExport(tableId, { format = 'json', status = '' } = {}) {
    const response = await fetchWithIdentity(buildPlayHistoryExportApiPath(tableId, { format, status }), {
      headers: {
        Accept: format === 'json'
          ? 'application/json'
          : (format === 'ndjson' ? 'application/x-ndjson' : 'text/plain'),
      },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const error = new Error(body?.error?.message || `HTTP_${response.status}`);
      error.code = body?.error?.code || 'UNKNOWN';
      throw error;
    }
    const safeTableId = String(tableId || 'table').trim() || 'table';
    if (format === 'json') {
      const payload = await response.json().catch(() => ({}));
      triggerJsonDownload(`poker-history-${safeTableId}.json`, payload?.data || {});
      return;
    }
    const text = await response.text();
    if (format === 'ndjson') {
      triggerTextDownload(`poker-history-${safeTableId}.ndjson`, text, 'application/x-ndjson');
      return;
    }
    triggerTextDownload(`poker-history-${safeTableId}.txt`, text, 'text/plain');
  }

  function bindPlayHistoryExportButtons(tableId, { status = '' } = {}) {
    const buttonSpecs = [
      ['pokerPlayHistoryExportJson', 'json'],
      ['pokerPlayHistoryExportNdjson', 'ndjson'],
      ['pokerPlayHistoryExportText', 'text'],
    ];
    for (const [id, format] of buttonSpecs) {
      const button = document.getElementById(id);
      if (!button || !tableId) continue;
      button.addEventListener('click', async () => {
        setStatus(`Preparing ${format.toUpperCase()} export...`);
        try {
          await downloadPlayHistoryExport(tableId, { format, status });
          setStatus(`Exported ${format.toUpperCase()} hand history.`);
        } catch (err) {
          setStatus(`History export failed: ${err.code || err.message || 'UNKNOWN'}`);
        }
      });
    }
  }

  function bindPlayHandReviewForms(data) {
    const handId = String(data?.hand?.handId || '').trim();
    const tableId = String(data?.table?.tableId || '').trim();
    const notebookForm = document.getElementById('pokerStudyForm');
    if (notebookForm && handId && tableId) {
      notebookForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        setStatus('Saving notebook...');
        try {
          await api(String(data?.notebook?.savePath || '/api/poker/play/notebook'), {
            method: 'POST',
            body: JSON.stringify({
              tableId,
              handId,
              topic: String(document.getElementById('pokerStudyTopicInput')?.value || '').trim(),
              body: String(document.getElementById('pokerStudyBodyInput')?.value || '').trim(),
              tags: parseTagInput(document.getElementById('pokerStudyTagsInput')?.value || ''),
            }),
          });
          await loadPlayHandReview(handId);
          setStatus('Notebook saved.');
        } catch (err) {
          setStatus(`Notebook save failed: ${err.code || err.message || 'UNKNOWN'}`);
        }
      });
    }
    bindPlayHistoryExportButtons(tableId, { status: 'completed' });
  }

  async function loadPlayHandReview(handId) {
    clearLiveTableStream();
    setTitle('Poker Hand Review', `Study review for hand ${handId}.`);
    setStatus('Loading hand review...');
    const payload = await api(buildPlayHandReviewApiPath(handId));
    const data = payload?.data || {};
    const table = data?.table || {};
    const hand = data?.hand || {};
    const resultSummary = data?.resultSummary || {};
    const boardPot = data?.boardPot || {};
    const notebook = data?.notebook || {};
    const opponentNotes = Array.isArray(data?.opponentNotes) ? data.opponentNotes : [];
    const notebookItems = Array.isArray(notebook?.items) ? notebook.items : [];
    const lessonTags = Array.isArray(data?.lessonTags) ? data.lessonTags : [];
    renderCards([
      `
        <h2>${escapeHtml(table?.title || 'Poker Hand Review')}</h2>
        <p>Private post-hand review for the seated wallet. Hole cards stay excluded from this export-safe study surface.</p>
        <div class="pokerSummary">
          ${renderSummaryMetric('Table', table?.tableType || 'cash')}
          ${renderSummaryMetric('Hand', `${Number(hand?.handNumber || 0)}`)}
          ${renderSummaryMetric('Street', hand?.street || 'preflop')}
          ${renderSummaryMetric('Actions', `${Number(resultSummary?.actionCount || 0)}`)}
        </div>
        <div class="pokerLinks">
          <a href="${escapeHtml(buildPokerHref(data?.links?.table || `/poker/play/tables/${encodeURIComponent(table?.tableId || '')}`))}">Back To Table</a>
          <a href="${escapeHtml(buildPokerHref(data?.links?.history || `/poker/play/tables/${encodeURIComponent(table?.tableId || '')}/history`, { status: 'completed' }))}">Back To History</a>
          <button id="pokerPlayHistoryExportJson" class="pokerButton" type="button">Export JSON</button>
          <button id="pokerPlayHistoryExportNdjson" class="pokerButton" type="button">Export NDJSON</button>
          <button id="pokerPlayHistoryExportText" class="pokerButton" type="button">Export Text</button>
        </div>
      `,
      `
        <h2>Result Summary</h2>
        <div class="pokerSummary">
          ${renderSummaryMetric('Viewer Seat', resultSummary?.viewerSeatNumber ? `Seat ${Number(resultSummary.viewerSeatNumber || 0)}` : 'n/a')}
          ${renderSummaryMetric('Winning Seats', Array.isArray(resultSummary?.winningSeatNumbers) && resultSummary.winningSeatNumbers.length ? resultSummary.winningSeatNumbers.join(', ') : 'n/a')}
          ${renderSummaryMetric('Started', hand?.startedAt ? formatIso(hand.startedAt) : 'n/a')}
          ${renderSummaryMetric('Completed', hand?.completedAt ? formatIso(hand.completedAt) : 'n/a')}
        </div>
        <p>${escapeHtml(resultSummary?.note || 'No result note recorded for this hand.')}</p>
      `,
      `
        <h2>Action Line</h2>
        ${Array.isArray(data?.actionLine) && data.actionLine.length ? renderPublicActionLog(data.actionLine, 'No public actions logged.') : '<p>No public actions logged.</p>'}
      `,
      `
        <h2>Board & Pot</h2>
        <div class="pokerSummary">
          ${renderSummaryMetric('Pot', `${Number(boardPot?.potOil || 0)} OIL`)}
          ${renderSummaryMetric('Payout Rows', `${Array.isArray(boardPot?.payouts) ? boardPot.payouts.length : 0}`)}
        </div>
        <div class="pokerLabel">Board</div>
        ${renderPokerCards(boardPot?.communityCards || [])}
        ${renderMatchedPots(boardPot)}
        ${boardPot?.note ? `<p>${escapeHtml(boardPot.note)}</p>` : ''}
      `,
      `
        <h2>Human Note</h2>
        ${data?.humanNote?.body ? `<p>${escapeHtml(data.humanNote.body)}</p>` : '<p>No human study note saved for this hand yet.</p>'}
      `,
      `
        <h2>Agent Note</h2>
        ${data?.agentNote?.body ? `<p>${escapeHtml(data.agentNote.body)}</p>` : '<p>No worker proposal was saved for this hand.</p>'}
      `,
      `
        <h2>Lesson Tags</h2>
        ${renderTagBadges(lessonTags, 'No lesson tags saved yet.')}
      `,
      `
        <h2>Notebook</h2>
        <form id="pokerStudyForm" class="pokerForm">
          <label>
            Topic
            <input id="pokerStudyTopicInput" maxlength="120" value="">
          </label>
          <label>
            Note
            <textarea id="pokerStudyBodyInput" placeholder="Save the line you want to keep for this hand."></textarea>
          </label>
          <label>
            Tags
            <input id="pokerStudyTagsInput" maxlength="160" value="">
          </label>
          <button id="pokerStudySaveButton" class="pokerButton" type="submit">Save Notebook</button>
        </form>
        ${renderNotebookEntryRows(notebookItems, { emptyText: 'No notebook entries saved for this hand yet.', showBody: false })}
      `,
      `
        <h2>Opponent Notes</h2>
        ${renderNotebookEntryRows(opponentNotes, { emptyText: 'No opponent notes saved for this hand yet.' })}
      `,
    ]);
    bindPlayHandReviewForms(data);
    setStatus('Hand review ready.');
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
          ${renderSummaryMetric('Bounty Mode', formatTournamentBountyModelLabel(series?.bountyModel))}
          ${Number(series?.bountyPoolOil || 0) > 0 ? renderSummaryMetric('Bounty Pool', `${Number(series?.bountyPoolOil || 0)} OIL`) : ''}
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
          <a href="${escapeHtml(buildPokerHref('/poker/play/admin/ops'))}">Ops Dashboard</a>
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

  async function loadPlayOpsDashboard() {
    clearLiveTableStream();
    const adminToken = readStoredPokerAdminToken();
    const focusSection = String(getRouteSearchParams().get('section') || '').trim();
    setTitle('Poker Ops', 'One operator surface for live health and accounting state.');
    if (!adminToken) {
      setStatus('Poker admin token required.');
      renderCards([
        '<h2>Poker Ops</h2><p>Set `poker.adminToken` in local storage before opening the poker operations dashboard.</p>',
      ]);
      return;
    }
    setStatus('Loading poker operations dashboard...');
    const payload = await api(buildPlayOpsDashboardApiPath(), {
      headers: { 'x-admin-token': adminToken },
    });
    const data = payload?.data || {};
    const summary = data?.summary || {};
    const sections = data?.sections || {};
    const reconciliation = sections?.reconciliation || {};
    renderCards([
      `
        <h2>Poker Ops</h2>
        <p>Live tables, disputes, integrity flags, refund/payout rows, and reconciliation mismatches in one operator view.${focusSection ? ` Focus: ${escapeHtml(focusSection)}.` : ''}</p>
        <div class="pokerSummary">
          ${renderSummaryMetric('Live Tables', `${Number(summary?.liveTableCount || 0)}`)}
          ${renderSummaryMetric('Live Series', `${Number(summary?.liveSeriesCount || 0)}`)}
          ${renderSummaryMetric('Paused Tables', `${Number(summary?.pausedTableCount || 0)}`)}
          ${renderSummaryMetric('Disconnected Seats', `${Number(summary?.disconnectedSeatCount || 0)}`)}
          ${renderSummaryMetric('Open Disputes', `${Number(summary?.openDisputeCount || 0)}`)}
          ${renderSummaryMetric('Open Flags', `${Number(summary?.openIntegrityFlagCount || 0)}`)}
          ${renderSummaryMetric('Refunds', `${Number(summary?.recentRefundCount || 0)}`)}
          ${renderSummaryMetric('Payouts', `${Number(summary?.recentPayoutCount || 0)}`)}
          ${renderSummaryMetric('Reconciliation', `${Number(summary?.reconciliationMismatchCount || 0)}`)}
        </div>
      `,
      `
        <h2>Dashboard Cards</h2>
        ${renderOpsMetricCards(data?.cards)}
      `,
      `
        <h2>Live Tables</h2>
        ${renderOpsTableRows(sections?.liveTables, 'No live tables.')}
      `,
      `
        <h2>Live Series</h2>
        ${renderOpsSeriesRows(sections?.liveSeries)}
      `,
      `
        <h2>Paused Tables</h2>
        ${renderOpsTableRows(sections?.pausedTables, 'No paused tables.')}
      `,
      `
        <h2>Disconnected Seats</h2>
        ${renderOpsSeatRows(sections?.disconnectedSeats)}
      `,
      `
        <h2>Open Disputes</h2>
        ${renderOpsIssueRows(sections?.openDisputes, 'No open disputes.')}
      `,
      `
        <h2>Open Integrity Flags</h2>
        ${renderOpsIssueRows(sections?.openIntegrityFlags, 'No open integrity flags.')}
      `,
      `
        <h2>Recent Refunds</h2>
        ${renderOpsLedgerRows(sections?.recentRefunds, 'No recent refunds.')}
      `,
      `
        <h2>Recent Payout Jobs</h2>
        ${renderOpsLedgerRows(sections?.recentPayoutJobs, 'No recent payout jobs.')}
      `,
      `
        <h2 id="reconciliation">Reconciliation</h2>
        <div class="pokerSummary">
          ${renderSummaryMetric('Wallets', `${Number(reconciliation?.summary?.walletCount || 0)}`)}
          ${renderSummaryMetric('Mismatches', `${Number(reconciliation?.summary?.mismatchCount || 0)}`)}
          ${renderSummaryMetric('Mismatched Wallets', `${Number(reconciliation?.summary?.mismatchedWalletCount || 0)}`)}
        </div>
        <div class="pokerLinks">
          <a href="${escapeHtml(buildPokerHref('/poker/play/admin/integrity'))}">Integrity Queue</a>
          <a href="${escapeHtml(buildPokerHref('/poker/play'))}">Back To Lobby</a>
        </div>
      `,
      `
        <h2>Wallet Balances</h2>
        ${renderOpsWalletRows(reconciliation?.wallets)}
      `,
      `
        <h2>Mismatch Rows</h2>
        ${renderOpsMismatchRows(reconciliation?.items)}
      `,
    ]);
    setStatus(`Loaded ${Number(summary?.liveTableCount || 0)} live table${Number(summary?.liveTableCount || 0) === 1 ? '' : 's'} and ${Number(summary?.reconciliationMismatchCount || 0)} reconciliation mismatch${Number(summary?.reconciliationMismatchCount || 0) === 1 ? '' : 'es'}.`);
  }

  function bindPlayMatchmakeForm() {
    const form = document.getElementById('pokerPlayMatchmakeForm');
    if (!form) return;
    const accessEl = document.getElementById('pokerPlayMatchmakeAccess');
    const typeEl = document.getElementById('pokerPlayMatchmakeType');
    const fillPolicyRow = document.getElementById('pokerPlayMatchmakeFillPolicyRow');
    const fillPolicyEl = document.getElementById('pokerPlayMatchmakeFillPolicy');
    const maxSeatsRow = document.getElementById('pokerPlayMatchmakeMaxSeatsRow');
    const maxSeatsEl = document.getElementById('pokerPlayMatchmakeMaxSeats');
    const startTargetRow = document.getElementById('pokerPlayMatchmakeStartTargetRow');
    const startTargetEl = document.getElementById('pokerPlayMatchmakeStartTargetSeats');
    const bountyRow = document.getElementById('pokerPlayMatchmakeBountyRow');
    const bountyEl = document.getElementById('pokerPlayMatchmakeBountyModel');
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
    const syncStartTargetOptions = () => {
      if (!startTargetEl || !maxSeatsEl) return;
      const maxSeats = Math.max(2, Number(maxSeatsEl.value || 6));
      const currentValue = Math.max(2, Math.min(maxSeats, Number(startTargetEl.value || Math.min(maxSeats, 3))));
      startTargetEl.innerHTML = Array.from({ length: Math.max(1, maxSeats - 1) }, (_unused, index) => {
        const seatCount = index + 2;
        return `<option value="${seatCount}">${seatCount} Seats</option>`;
      }).join('');
      startTargetEl.value = String(currentValue);
    };
    const syncTournamentOptions = () => {
      const tournament = String(typeEl?.value || 'cash') === 'tournament';
      const fillPolicy = String(fillPolicyEl?.value || 'open_match');
      const targetStart = fillPolicy === 'fill_to_target';
      if (fillPolicyRow) fillPolicyRow.hidden = !tournament;
      if (maxSeatsRow) maxSeatsRow.hidden = !tournament;
      if (startTargetRow) startTargetRow.hidden = !tournament || !targetStart;
      if (bountyRow) bountyRow.hidden = !tournament;
      if (fillPolicyEl) fillPolicyEl.disabled = !tournament;
      if (maxSeatsEl) maxSeatsEl.disabled = !tournament;
      if (startTargetEl) startTargetEl.disabled = !tournament || !targetStart;
      if (bountyEl) bountyEl.disabled = !tournament;
      if (!tournament) {
        if (fillPolicyEl) fillPolicyEl.value = 'open_match';
        if (maxSeatsEl) maxSeatsEl.value = '6';
        if (startTargetEl) startTargetEl.value = '3';
        if (bountyEl) bountyEl.value = 'none';
      }
      syncStartTargetOptions();
    };
    if (typeEl) {
      typeEl.addEventListener('change', () => {
        applyDefaults();
        syncTournamentOptions();
      });
    }
    if (fillPolicyEl) {
      fillPolicyEl.addEventListener('change', () => {
        syncTournamentOptions();
      });
    }
    if (maxSeatsEl) {
      maxSeatsEl.addEventListener('change', () => {
        syncStartTargetOptions();
        syncTournamentOptions();
      });
    }
    syncTournamentOptions();
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const accessMode = String(accessEl?.value || 'public');
      setStatus(accessMode === 'invite_only' ? 'Creating invite-only table...' : 'Finding a matching live table...');
      try {
        const tableType = String(typeEl?.value || 'cash');
        const payloadBody = {
          accessMode,
          tableType,
          smallBlindOil: Number(smallBlindEl?.value || 0),
          bigBlindOil: Number(bigBlindEl?.value || 0),
          buyInOil: Number(buyInEl?.value || 0),
          displayName: String(document.getElementById('pokerPlayMatchmakeDisplayName')?.value || '').trim(),
          title: String(document.getElementById('pokerPlayMatchmakeTitle')?.value || '').trim(),
        };
        if (tableType === 'tournament') {
          payloadBody.fillPolicy = String(fillPolicyEl?.value || 'open_match');
          payloadBody.maxSeats = Number(maxSeatsEl?.value || 6);
          if (payloadBody.fillPolicy === 'fill_to_target') {
            payloadBody.startTargetSeats = Number(startTargetEl?.value || 3);
          }
          payloadBody.bountyModel = String(bountyEl?.value || 'none');
        }
        const payload = await api(accessMode === 'invite_only' ? '/api/poker/play/tables' : '/api/poker/play/matchmake', {
          method: 'POST',
          body: JSON.stringify(payloadBody),
        });
        const tableId = String(payload?.data?.table?.tableId || '');
        if (!tableId) throw new Error('POKER_PLAY_MATCHMAKE_MISSING_TABLE');
        window.location.assign(buildPokerHref(`/poker/play/tables/${encodeURIComponent(tableId)}`));
      } catch (err) {
        setStatus(`Quick seat failed: ${err.code || err.message || 'UNKNOWN'}`);
      }
    });
  }

  function bindPlayPolicyForm() {
    const form = document.getElementById('pokerPlayPolicyForm');
    if (!form) return;
    const capEl = document.getElementById('pokerPlayPolicyDailyCap');
    const selfExcludeButton = document.getElementById('pokerPlayPolicySelfExclude24h');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setStatus('Saving poker policy...');
      try {
        const dailySpendCapOil = capEl && String(capEl.value || '').trim()
          ? Number(capEl.value)
          : 0;
        await api('/api/poker/play/policy', {
          method: 'POST',
          body: JSON.stringify({
            dailySpendCapOil,
          }),
        });
        await loadPlayLobby();
        setStatus('Poker policy updated.');
      } catch (err) {
        setStatus(`Poker policy failed: ${err.code || err.message || 'UNKNOWN'}`);
      }
    });
    if (selfExcludeButton) {
      selfExcludeButton.addEventListener('click', async () => {
        setStatus('Activating 24-hour poker self-exclusion...');
        try {
          await api('/api/poker/play/policy', {
            method: 'POST',
            body: JSON.stringify({
              selfExcludeHours: 24,
            }),
          });
          await loadPlayLobby();
          setStatus('Poker self-exclusion is active for 24 hours.');
        } catch (err) {
          setStatus(`Poker policy failed: ${err.code || err.message || 'UNKNOWN'}`);
        }
      });
    }
  }

  function renderPlayTableCards(data, { rail = false } = {}) {
    const table = data?.table || {};
    const tableAccess = table?.access && typeof table.access === 'object' ? table.access : {};
    const series = data?.series || null;
    const hand = data?.hand || null;
    const mySeat = data?.mySeat || null;
    const seats = Array.isArray(data?.seats) ? data.seats : [];
    const actions = Array.isArray(data?.actions) ? data.actions : [];
    const messages = Array.isArray(data?.messages) ? data.messages : [];
    const cashMovement = data?.cashMovement && typeof data.cashMovement === 'object' ? data.cashMovement : null;
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
    const scheduledBreakActive = !!table?.summary?.scheduledBreakActive;
    const tournamentDirectorBreakReferenceHandNumber = Math.max(
      0,
      Number(table?.summary?.handNumber || 0),
      Number(table?.state?.lastSettledHandNumber || 0),
      Number(table?.state?.activeHandNumber || 0)
    );
    const tournamentDirectorBreakReady = table?.tableType === 'tournament'
      && !scheduledBreakActive
      && !adminClosed
      && !table?.summary?.scheduledStartPending
      && !table?.summary?.liveHand
      && tournamentDirectorBreakReferenceHandNumber > 0
      && Number(table?.summary?.nextScheduledBreakAfterHandNumber || 0) > 0;
    const multiTableSeriesDirectorBreakReady = !!series
      && table?.tableType === 'tournament'
      && Number(series?.tableCount || 0) > 1
      && !adminClosed
      && !series?.scheduledBreakActive
      && Number(series?.nextScheduledBreakAfterHandNumber || 0) > 0;
    const multiTableSeriesDirectorBreakActive = !!series
      && table?.tableType === 'tournament'
      && Number(series?.tableCount || 0) > 1
      && !adminClosed
      && !!series?.scheduledBreakActive;
    const tableOpen = String(table?.status || 'open') === 'open';
    const registrationOpen = tableOpen || (table?.tableType === 'tournament' && String(table?.status || '') === 'scheduled');
    const sitAndGoWaiting = table?.tableType === 'tournament'
      && isSitAndGoFillPolicy(table?.summary?.fillPolicy)
      && !table?.summary?.liveHand
      && !table?.summary?.completedAt
      && Number(table?.summary?.seatsUntilStart || 0) > 0;
    const canJoin = !publicRail && registrationOpen && !mySeat && Number(table?.summary?.openSeatCount || 0) > 0;
    const canWaitlist = !publicRail
      && registrationOpen
      && !mySeat
      && Number(table?.summary?.openSeatCount || 0) <= 0
      && (
        table?.tableType === 'cash'
        || (
          table?.tableType === 'tournament'
          && (table?.summary?.scheduledStartPending || !table?.summary?.liveHand || table?.summary?.lateRegistrationOpen)
        )
      );
    const hasOpenMyHandDispute = !!(hand && myDisputes.some((dispute) => String(dispute?.handId || '') === String(hand.handId || '') && String(dispute?.status || '') === 'open'));
    const cards = [
      `
        <h2>${escapeHtml(table?.title || 'Live Table')}</h2>
        <p>${escapeHtml(
          adminClosed
            ? (table?.state?.closeReason || 'Table closed by operator.')
            : scheduledBreakActive
            ? `${String(table?.summary?.scheduledBreakLabel || 'Scheduled break')} is active until ${formatIso(table?.summary?.scheduledBreakUntilAt)}.`
            : paused
            ? (table?.state?.pausedReason ? `Table paused: ${table.state.pausedReason}` : 'Table paused by operator.')
            : sitAndGoWaiting
            ? `Sit-and-go is waiting for ${Number(table?.summary?.seatsUntilStart || 0)} more seat${Number(table?.summary?.seatsUntilStart || 0) === 1 ? '' : 's'} before hand 1 starts.`
            : (table?.summary?.completedAt ? 'Previous cycle complete. Seats can rotate back in for the next match.' : (table?.summary?.liveHand ? 'A live hand is in progress.' : 'Waiting for enough players to post blinds.'))
        )}</p>
        <div class="pokerSummary">
          ${renderSummaryMetric('Type', table?.tableType || 'cash')}
          ${renderSummaryMetric('Status', paused ? 'paused' : (table?.status || 'open'))}
          ${tableAccess?.inviteOnly ? renderSummaryMetric('Access', 'invite-only') : ''}
          ${renderSummaryMetric('Blinds', `${Number(table?.smallBlindOil || 0)} / ${Number(table?.bigBlindOil || 0)}`)}
          ${renderSummaryMetric('Buy-In', `${Number(table?.buyInOil || 0)} OIL`)}
          ${table?.tableType === 'cash' ? renderSummaryMetric('Blind Return', String(table?.summary?.blindReturnPolicy || 'post_big_blind').replace(/_/g, ' ')) : ''}
          ${table?.tableType === 'tournament' ? renderSummaryMetric('Start Policy', formatTournamentFillPolicyLabel(table?.summary?.fillPolicy)) : ''}
          ${table?.tableType === 'tournament' ? renderSummaryMetric('Start Target', `${Number(table?.summary?.startTargetSeats || table?.minPlayers || 2)}`) : ''}
          ${table?.tableType === 'tournament' && !table?.summary?.liveHand && !table?.summary?.completedAt ? renderSummaryMetric('Seats To Start', `${Number(table?.summary?.seatsUntilStart || 0)}`) : ''}
          ${table?.tableType === 'tournament' ? renderSummaryMetric('Level', `${Number(table?.summary?.blindLevel || hand?.blindLevel || 0) || 1}`) : ''}
          ${table?.tableType === 'tournament' ? renderSummaryMetric('Next Level', Number(table?.summary?.nextBlindLevel || 0) > 0 ? `${Number(table?.summary?.nextBlindLevel || 0)}` : 'final') : ''}
          ${table?.tableType === 'tournament' ? renderSummaryMetric('Hands To Next', Number(table?.summary?.nextBlindLevel || 0) > 0 ? `${Number(table?.summary?.handsUntilBlindIncrease || 0)}` : '0') : ''}
          ${table?.tableType === 'tournament' && Number(table?.summary?.pendingBlindAdvanceCount || 0) > 0 ? renderSummaryMetric('Queued Blinds', `${Number(table?.summary?.pendingBlindAdvanceCount || 0)}`) : ''}
          ${table?.tableType === 'tournament' && table?.summary?.scheduledStartAt ? renderSummaryMetric('Scheduled Start', formatIso(table?.summary?.scheduledStartAt)) : ''}
          ${table?.tableType === 'tournament' ? renderSummaryMetric('Late Reg', table?.summary?.lateRegistrationOpen ? 'open' : 'closed') : ''}
          ${table?.tableType === 'tournament' ? renderSummaryMetric('Late Reg Hands', `${Number(table?.summary?.lateRegistrationRemainingHands || 0)}`) : ''}
          ${table?.tableType === 'tournament' ? renderSummaryMetric('Entries', `${Number(table?.summary?.entryCount || 0)}`) : ''}
          ${table?.tableType === 'tournament' && Number(table?.summary?.scheduledBreakCount || 0) > 0 ? renderSummaryMetric('Breaks', `${Number(table?.summary?.completedScheduledBreakCount || 0)}/${Number(table?.summary?.scheduledBreakCount || 0)}`) : ''}
          ${table?.tableType === 'tournament' && scheduledBreakActive ? renderSummaryMetric('Break Until', formatIso(table?.summary?.scheduledBreakUntilAt)) : ''}
          ${table?.tableType === 'tournament' && Number(table?.summary?.nextScheduledBreakAfterHandNumber || 0) > 0 ? renderSummaryMetric('Next Break', `${String(table?.summary?.nextScheduledBreakLabel || 'Break')} after hand ${Number(table?.summary?.nextScheduledBreakAfterHandNumber || 0)}`) : ''}
          ${table?.tableType === 'tournament' ? renderSummaryMetric('Bounty Mode', formatTournamentBountyModelLabel(table?.summary?.bountyModel)) : ''}
          ${table?.tableType === 'tournament' && Number(table?.summary?.bountyPerEntryOil || 0) > 0 ? renderSummaryMetric('Starting Bounty', `${Number(table?.summary?.bountyPerEntryOil || 0)} OIL`) : ''}
          ${table?.tableType === 'tournament' && Number(table?.summary?.reentryLimit || 0) > 0 ? renderSummaryMetric('Re-Entry', `${Number(table?.summary?.acceptedReentryCount || 0)}/${Number(table?.summary?.reentryLimit || 0)}`) : ''}
          ${table?.tableType === 'tournament' ? renderSummaryMetric('Prize Pool', `${Number(table?.summary?.prizePoolOil || 0)} OIL`) : ''}
          ${table?.tableType === 'tournament' && Number(table?.summary?.bountyPoolOil || 0) > 0 ? renderSummaryMetric('Bounty Pool', `${Number(table?.summary?.bountyPoolOil || 0)} OIL`) : ''}
          ${table?.tableType === 'tournament' ? renderSummaryMetric('Paid Places', `${Number(table?.summary?.paidPlaces || 0)}`) : ''}
          ${Number(table?.summary?.waitlistCount || 0) > 0 ? renderSummaryMetric('Waitlist', `${Number(table?.summary?.waitlistCount || 0)}`) : ''}
          ${Number(table?.summary?.disconnectedSeatCount || 0) > 0 ? renderSummaryMetric('Disconnected', `${Number(table?.summary?.disconnectedSeatCount || 0)}`) : ''}
          ${publicRail ? renderSummaryMetric('Viewer Mode', 'public rail') : renderSummaryMetric('Your OIL', `${oilBalance}`)}
          ${adminClosed ? renderSummaryMetric('Refunded', `${Number(table?.state?.refundedTotalOil || 0)} OIL`) : ''}
        </div>
        ${renderMetaBadges([
          table?.tableType === 'tournament' && isSitAndGoFillPolicy(table?.summary?.fillPolicy) ? formatTournamentFillPolicyLabel(table?.summary?.fillPolicy) : '',
          tableAccess?.inviteOnly ? 'invite-only' : '',
          `${Number(table?.summary?.occupancy || 0)}/${Number(table?.maxSeats || 6)} seated`,
          table?.tableType === 'tournament' && !table?.summary?.liveHand && Number(table?.summary?.seatsUntilStart || 0) > 0
            ? `${Number(table?.summary?.seatsUntilStart || 0)} to start`
            : '',
          table?.tableType === 'tournament' && scheduledBreakActive ? 'scheduled break active' : '',
          table?.tableType === 'tournament' && String(table?.summary?.bountyModel || '') === 'pko_50'
            ? formatTournamentBountyModelLabel(table?.summary?.bountyModel)
            : '',
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

    if (!publicRail && tableAccess?.inviteOnly) {
      cards.push(`
        <h2>Invite Access</h2>
        <p>Only invited wallets can open or join this table. Public lobby and rail discovery stay disabled.</p>
        <div class="pokerSummary">
          ${renderSummaryMetric('Mode', 'invite-only')}
          ${tableAccess?.viewerAuthorizedByInvite ? renderSummaryMetric('Invite', 'validated') : ''}
          ${tableAccess?.viewerCanShareInvite ? renderSummaryMetric('Share', 'creator controls') : ''}
        </div>
        ${tableAccess?.viewerCanShareInvite && tableAccess?.inviteJoinPath
          ? `
            <div class="pokerLinks">
              <a href="${escapeHtml(buildPokerHref(tableAccess.inviteJoinPath))}">Open Invite Link</a>
            </div>
            <div class="pokerMessage">
              <div class="pokerLabel">Invite Code</div>
              <div>${escapeHtml(tableAccess?.inviteCode || '')}</div>
              <div class="pokerLabel">${escapeHtml(tableAccess.inviteJoinPath)}</div>
            </div>
          `
          : `<p>${mySeat ? 'Your seated wallet no longer needs the invite code to stay at the table.' : 'This page was opened with a valid invite code.'}</p>`}
      `);
    }

    if (canJoin) {
      const nextOpenSeat = seats.map((seat) => Number(seat.seatNumber || 0));
      const options = Array.from({ length: Number(table?.maxSeats || 6) }, (_value, index) => index + 1)
        .filter((seat) => !nextOpenSeat.includes(seat))
        .map((seat) => `<option value="${seat}">Seat ${seat}</option>`)
        .join('');
      cards.push(`
        <h2>Take A Seat</h2>
        <p>${tableAccess?.inviteOnly ? 'This invite-only table still gives your seat the same private human + agent thread. Other players only see your public actions.' : 'Buying in starts a private human + agent thread for your seat. Other players only see your public actions, not your private discussion.'}</p>
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
        <p>${table?.tableType === 'tournament'
          ? (tableAccess?.inviteOnly
            ? 'This invite-only tournament is full. Invited wallets can still queue, and the first eligible waiting wallet is promoted when a seat opens before the schedule locks.'
            : 'The tournament is full. Queue a buy-in and the first eligible waiting wallet is promoted when a seat opens before the schedule locks.')
          : (tableAccess?.inviteOnly
            ? 'This invite-only table is full. Invited wallets can still queue, and the first eligible waiting wallet is promoted when a seat opens.'
            : 'The table is full. Queue a buy-in and the first eligible waiting wallet is promoted when a seat opens.')}
        </p>
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
      const seatChangeOpenSeatNumbers = Array.isArray(cashMovement?.seatChangeOpenSeatNumbers)
        ? cashMovement.seatChangeOpenSeatNumbers.map((value) => Number(value || 0)).filter((value) => Number.isFinite(value) && value > 0)
        : [];
      const transferOptions = Array.isArray(cashMovement?.transferOptions)
        ? cashMovement.transferOptions.map((entry) => ({
          tableId: String(entry?.tableId || ''),
          title: String(entry?.title || 'Cash Table'),
          openSeatNumbers: Array.isArray(entry?.openSeatNumbers)
            ? entry.openSeatNumbers.map((value) => Number(value || 0)).filter((value) => Number.isFinite(value) && value > 0)
            : [],
          occupancy: Number(entry?.occupancy || 0),
          maxSeats: Number(entry?.maxSeats || 6),
          smallBlindOil: Number(entry?.smallBlindOil || 0),
          bigBlindOil: Number(entry?.bigBlindOil || 0),
          buyInOil: Number(entry?.buyInOil || 0),
        })).filter((entry) => entry.tableId && entry.openSeatNumbers.length)
        : [];
      const defaultTransferTarget = transferOptions[0] || null;
      const transferOptionsJson = escapeHtml(JSON.stringify(transferOptions));
      const blindObligation = mySeat?.blindObligation && typeof mySeat.blindObligation === 'object' ? mySeat.blindObligation : null;
      const waitlistPromotion = mySeat?.waitlistPromotion && typeof mySeat.waitlistPromotion === 'object' ? mySeat.waitlistPromotion : null;
      const autoAct = mySeat?.autoAct && typeof mySeat.autoAct === 'object' ? mySeat.autoAct : { mode: 'off', enabled: false };
      cards.push(`
        <h2>Your Seat</h2>
        <div class="pokerSummary">
          ${renderSummaryMetric('Seat', `${Number(mySeat.seatNumber || 0)}`)}
          ${renderSummaryMetric('Stack', `${Number(mySeat.stackOil || 0)} OIL`)}
          ${renderSummaryMetric('Status', seatStatus)}
          ${renderSummaryMetric('Role', hand?.actingSeat === Number(mySeat.seatNumber || 0) ? 'acting now' : 'waiting')}
          ${renderSummaryMetric('Auto-Act', formatAutoActLabel(autoAct?.mode))}
          ${mySeat?.finishPosition ? renderSummaryMetric('Finish', `${Number(mySeat.finishPosition || 0)}`) : ''}
          ${Number(mySeat?.prizeOil || 0) > 0 ? renderSummaryMetric('Prize', `${Number(mySeat.prizeOil || 0)} OIL`) : ''}
          ${table?.tableType === 'tournament' && Number(mySeat?.currentBountyOil || 0) > 0 ? renderSummaryMetric('Current Bounty', `${Number(mySeat.currentBountyOil || 0)} OIL`) : ''}
          ${Number(mySeat?.bountyWonOil || 0) > 0 ? renderSummaryMetric('Bounty Won', `${Number(mySeat.bountyWonOil || 0)} OIL`) : ''}
        </div>
        ${String(mySeat.status || '').toLowerCase() === 'registered' ? '<p>Your buy-in is posted. You are registered for the next hand and can use the seat thread before cards are dealt to you.</p>' : ''}
        ${table?.tableType === 'tournament' && String(mySeat.status || '').toLowerCase() === 'busted' && Number(table?.summary?.reentryLimit || 0) > 0 ? '<p>Your last tournament entry busted. Re-entry stays available until late registration closes or the table schedule locks.</p>' : ''}
        ${table?.tableType === 'tournament' && scheduledBreakActive ? `<p>Scheduled break: ${escapeHtml(String(table?.summary?.scheduledBreakLabel || 'Break'))} until ${escapeHtml(formatIso(table?.summary?.scheduledBreakUntilAt))}.</p>` : ''}
        ${table?.tableType === 'tournament' && Number(table?.summary?.pendingBlindAdvanceCount || 0) > 0 ? `<p>Director queued ${Number(table?.summary?.pendingBlindAdvanceCount || 0)} blind advance${Number(table?.summary?.pendingBlindAdvanceCount || 0) === 1 ? '' : 's'}; the next hand starts at level ${Number(table?.summary?.upcomingBlindLevel || table?.summary?.blindLevel || hand?.blindLevel || 1)}.</p>` : ''}
        ${leaveQueued ? '<p>Your cash-out is queued. You stay in this hand, then your remaining stack returns to OIL automatically.</p>' : ''}
        ${seatSittingOut ? '<p>Your seat is marked to sit out. You keep the same wallet-bound seat and can return without rebuying.</p>' : ''}
        ${seatAway ? '<p>Your seat is marked away. The wallet-bound seat stays yours until you return or cash out.</p>' : ''}
        ${table?.tableType === 'cash' && (seatSittingOut || seatAway) ? `<p>Return policy: ${String(table?.summary?.blindReturnPolicy || 'post_big_blind') === 'wait_for_big_blind' ? 'wait for big blind.' : `post big blind (${Number(table?.bigBlindOil || 0)} OIL).`}</p>` : ''}
        ${blindObligation?.status === 'posted' ? `<p>Blind obligation posted: ${Number(blindObligation?.blindAmountOil || 0)} OIL big blind.</p>` : ''}
        ${blindObligation?.status === 'waiting' ? `<p>Blind obligation pending: wait for big blind before rejoining normal rotation.</p>` : ''}
        ${waitlistPromotion?.source === 'tournament_waitlist' ? '<p>Promoted from the tournament waitlist.</p>' : ''}
        ${adminClosed ? `<p>This table was closed by an operator.${Number(table?.state?.refundedTotalOil || 0) > 0 ? ` Refunds issued: ${Number(table?.state?.refundedTotalOil || 0)} OIL total.` : ''}</p>` : ''}
        ${mySeat?.finishPosition ? `<p>You currently hold finish position ${Number(mySeat.finishPosition || 0)}.${Number(mySeat?.prizeOil || 0) > 0 ? ` Prize paid: ${Number(mySeat.prizeOil || 0)} OIL.` : ''}${Number(mySeat?.bountyWonOil || 0) > 0 ? ` Bounty won: ${Number(mySeat.bountyWonOil || 0)} OIL.` : ''}</p>` : ''}
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
            <div class="pokerLabel">Seat Movement</div>
            ${cashMovement?.seatChangeAllowed && seatChangeOpenSeatNumbers.length ? `
              <form id="pokerPlaySeatChangeForm" class="pokerForm">
                <label>
                  Open Seat
                  <select id="pokerPlaySeatChangeNumber">
                    ${seatChangeOpenSeatNumbers.map((seatNumber) => `<option value="${seatNumber}">Seat ${seatNumber}</option>`).join('')}
                  </select>
                </label>
                <button id="pokerPlaySeatChangeButton" class="pokerButton" type="submit">Change Seat</button>
              </form>
            ` : '<p>Seat changes open between hands when another cash seat is available.</p>'}
            ${transferOptions.length ? `
              <form id="pokerPlayTransferForm" class="pokerForm" data-transfer-options="${transferOptionsJson}">
                <label>
                  Compatible Table
                  <select id="pokerPlayTransferTableId">
                    ${transferOptions.map((entry) => `
                      <option value="${escapeHtml(entry.tableId)}">
                        ${escapeHtml(entry.title)} · ${Number(entry.occupancy || 0)}/${Number(entry.maxSeats || 6)} · ${Number(entry.smallBlindOil || 0)}/${Number(entry.bigBlindOil || 0)}
                      </option>
                    `).join('')}
                  </select>
                </label>
                <label>
                  Target Seat
                  <select id="pokerPlayTransferSeatNumber">
                    ${defaultTransferTarget
                      ? defaultTransferTarget.openSeatNumbers.map((seatNumber) => `<option value="${seatNumber}">Seat ${seatNumber}</option>`).join('')
                      : ''}
                  </select>
                </label>
                <button id="pokerPlayTransferButton" class="pokerButton" type="submit">Transfer Table</button>
              </form>
            ` : '<p>No compatible cash table is open for transfer right now.</p>'}
          ` : ''}
        `}
      `);
    }

    if (!publicRail && !adminClosed && mySeat) {
      const autoAct = mySeat?.autoAct && typeof mySeat.autoAct === 'object' ? mySeat.autoAct : { mode: 'off', enabled: false };
      cards.push(`
        <h2>Auto-Act</h2>
        <p>Automation is opt-in per seat and stays visible in the live table state.</p>
        <div class="pokerSummary">
          ${renderSummaryMetric('Mode', formatAutoActLabel(autoAct?.mode))}
          ${renderSummaryMetric('Allow Disconnect', autoAct?.allowWhileDisconnected ? 'yes' : 'no')}
          ${renderSummaryMetric('Last Action', autoAct?.lastExecutedActionKind ? formatPokerActionLabel(autoAct.lastExecutedActionKind) : 'none')}
        </div>
        <form id="pokerPlayAutoActForm" class="pokerForm">
          <label>
            Mode
            <select id="pokerPlayAutoActMode">
              <option value="off"${String(autoAct?.mode || 'off') === 'off' ? ' selected' : ''}>Off</option>
              <option value="propose_only"${String(autoAct?.mode || '') === 'propose_only' ? ' selected' : ''}>Propose Only</option>
              <option value="check_fold"${String(autoAct?.mode || '') === 'check_fold' ? ' selected' : ''}>Check/Fold</option>
              <option value="seat_agent_auto"${String(autoAct?.mode || '') === 'seat_agent_auto' ? ' selected' : ''}>Seat-Agent Auto</option>
            </select>
          </label>
          <label>
            <input id="pokerPlayAutoActAllowDisconnect" type="checkbox"${autoAct?.allowWhileDisconnected ? ' checked' : ''}>
            Allow while disconnected
          </label>
          <button id="pokerPlayAutoActSaveButton" class="pokerButton" type="submit">Save Auto-Act</button>
        </form>
        <div class="pokerLinks">
          <button id="pokerPlayAutoActOffButton" class="pokerButton" type="button">Turn Off Auto-Act</button>
        </div>
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
          ${series?.scheduledBreakActive ? renderSummaryMetric('Break Until', formatIso(series?.scheduledBreakUntilAt)) : ''}
          ${Number(series?.scheduledBreakTableCount || 0) > 0 ? renderSummaryMetric('Break Tables', `${Number(series?.scheduledBreakTableCount || 0)}`) : ''}
          ${Number(series?.nextScheduledBreakAfterHandNumber || 0) > 0 ? renderSummaryMetric('Next Break', `${String(series?.nextScheduledBreakLabel || 'Break')} after hand ${Number(series?.nextScheduledBreakAfterHandNumber || 0)}`) : ''}
          ${renderSummaryMetric('Entries', `${Number(series?.entryCount || 0)}`)}
          ${renderSummaryMetric('Bounty Mode', formatTournamentBountyModelLabel(series?.bountyModel))}
          ${Number(series?.bountyPerEntryOil || 0) > 0 ? renderSummaryMetric('Starting Bounty', `${Number(series?.bountyPerEntryOil || 0)} OIL`) : ''}
          ${Number(series?.acceptedReentryCount || 0) > 0 || Number(table?.summary?.reentryLimit || 0) > 0 ? renderSummaryMetric('Re-Entries', `${Number(series?.acceptedReentryCount || 0)}`) : ''}
          ${renderSummaryMetric('Prize Pool', `${Number(series?.prizePoolOil || 0)} OIL`)}
          ${Number(series?.bountyPoolOil || 0) > 0 ? renderSummaryMetric('Bounty Pool', `${Number(series?.bountyPoolOil || 0)} OIL`) : ''}
          ${Number(series?.totalBountyAwardedOil || 0) > 0 ? renderSummaryMetric('Bounty Paid', `${Number(series?.totalBountyAwardedOil || 0)} OIL`) : ''}
          ${renderSummaryMetric('Paid Places', `${Number(series?.paidPlaces || 0)}`)}
          ${Number(series?.refundedTotalOil || 0) > 0 ? renderSummaryMetric('Refunded', `${Number(series?.refundedTotalOil || 0)} OIL`) : ''}
        </div>
        ${renderSeriesClosureNotice(series)}
        ${series?.scheduledBreakActive ? `<p>Scheduled break is active across ${Number(series?.scheduledBreakTableCount || 0)} table${Number(series?.scheduledBreakTableCount || 0) === 1 ? '' : 's'} until ${escapeHtml(formatIso(series?.scheduledBreakUntilAt))}.</p>` : ''}
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

    if (!publicRail && data?.study) {
      cards.push(renderStudyPreview(data.study));
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
      const shoveToOil = Number(mySeat.committedStreetOil || 0) + Number(mySeat.stackOil || 0);
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
          ${hand.viewerAllowedActions.includes('shove') ? `<button id="pokerPlayShoveButton" class="pokerButton" type="button" data-shove-to-oil="${Number(shoveToOil || 0)}">Shove</button>` : ''}
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
          ${multiTableSeriesDirectorBreakReady ? `<button class="pokerButton" type="button" data-admin-series-break-start="1" data-admin-series-id="${escapeHtml(series?.seriesId || '')}">Start Series Break</button>` : ''}
          ${multiTableSeriesDirectorBreakActive ? `<button class="pokerButton" type="button" data-admin-series-break-end="1" data-admin-series-id="${escapeHtml(series?.seriesId || '')}">End Series Break</button>` : ''}
          ${!adminClosed && table?.tableType === 'tournament' ? `<button class="pokerButton" type="button" data-admin-table-blinds-advance="1" data-admin-table-id="${escapeHtml(table?.tableId || '')}">Advance Blinds</button>` : ''}
          ${tournamentDirectorBreakReady ? `<button class="pokerButton" type="button" data-admin-table-break-start="1" data-admin-table-id="${escapeHtml(table?.tableId || '')}">Start Break Now</button>` : ''}
          ${!adminClosed && table?.tableType === 'tournament' && scheduledBreakActive ? `<button class="pokerButton" type="button" data-admin-table-break-end="1" data-admin-table-id="${escapeHtml(table?.tableId || '')}">End Break Early</button>` : ''}
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
      const inviteCode = readRouteInviteCode();
      setStatus('Joining live table...');
      try {
        await api(`/api/poker/play/tables/${encodeURIComponent(tableId)}/sit`, {
          method: 'POST',
          body: JSON.stringify({
            seatNumber: Number(document.getElementById('pokerPlaySeatNumber')?.value || 0),
            displayName: String(document.getElementById('pokerPlayDisplayName')?.value || '').trim(),
            buyInOil: Number(document.getElementById('pokerPlayBuyInOil')?.value || 0),
            inviteCode: inviteCode || undefined,
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

  function bindCashSeatMovementForms(tableId) {
    const seatChangeForm = document.getElementById('pokerPlaySeatChangeForm');
    if (seatChangeForm) {
      seatChangeForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const seatNumber = Number(document.getElementById('pokerPlaySeatChangeNumber')?.value || 0);
        if (!seatNumber) {
          setStatus('Choose an open seat first.');
          return;
        }
        setStatus('Changing seat...');
        try {
          await api(`/api/poker/play/tables/${encodeURIComponent(tableId)}/change-seat`, {
            method: 'POST',
            body: JSON.stringify({ seatNumber }),
          });
          await loadPlayTable(tableId);
          setStatus('Seat changed.');
        } catch (err) {
          setStatus(`Seat change failed: ${err.code || err.message || 'UNKNOWN'}`);
        }
      });
    }

    const transferForm = document.getElementById('pokerPlayTransferForm');
    if (!transferForm) return;
    let transferOptions = [];
    try {
      transferOptions = JSON.parse(String(transferForm.getAttribute('data-transfer-options') || '[]'));
    } catch {
      transferOptions = [];
    }
    const targetTableEl = document.getElementById('pokerPlayTransferTableId');
    const targetSeatEl = document.getElementById('pokerPlayTransferSeatNumber');
    const syncTransferSeatOptions = () => {
      if (!targetTableEl || !targetSeatEl) return;
      const targetTableId = String(targetTableEl.value || '').trim();
      const selected = transferOptions.find((entry) => String(entry?.tableId || '') === targetTableId) || null;
      const seatOptions = Array.isArray(selected?.openSeatNumbers)
        ? selected.openSeatNumbers.map((value) => Number(value || 0)).filter((value) => Number.isFinite(value) && value > 0)
        : [];
      targetSeatEl.innerHTML = seatOptions.map((seatNumber) => `<option value="${seatNumber}">Seat ${seatNumber}</option>`).join('');
      targetSeatEl.disabled = seatOptions.length <= 0;
    };
    if (targetTableEl) {
      targetTableEl.addEventListener('change', syncTransferSeatOptions);
    }
    syncTransferSeatOptions();
    transferForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const targetTableId = String(targetTableEl?.value || '').trim();
      const targetSeatNumber = Number(targetSeatEl?.value || 0);
      if (!targetTableId || !targetSeatNumber) {
        setStatus('Choose a compatible target table and seat.');
        return;
      }
      setStatus('Transferring table...');
      try {
        const payload = await api(`/api/poker/play/tables/${encodeURIComponent(tableId)}/transfer`, {
          method: 'POST',
          body: JSON.stringify({ targetTableId, targetSeatNumber }),
        });
        const nextTableId = String(payload?.data?.table?.tableId || targetTableId);
        await loadPlayTable(nextTableId);
        setStatus('Table transferred.');
      } catch (err) {
        setStatus(`Table transfer failed: ${err.code || err.message || 'UNKNOWN'}`);
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

  function bindPlayScheduleActions() {
    const buttons = document.querySelectorAll('[data-schedule-action-kind][data-schedule-method][data-schedule-path][data-schedule-table-id]');
    buttons.forEach((button) => {
      button.addEventListener('click', async () => {
        if (button.disabled) return;
        const actionKind = String(button.getAttribute('data-schedule-action-kind') || '').trim();
        const method = String(button.getAttribute('data-schedule-method') || 'POST').trim().toUpperCase();
        const path = String(button.getAttribute('data-schedule-path') || '').trim();
        const buyInOil = Number(button.getAttribute('data-schedule-buy-in-oil') || 0);
        if (!path) return;
        const statusByKind = {
          register: 'Registering for scheduled event...',
          waitlist: 'Joining scheduled waitlist...',
          unregister: 'Unregistering from scheduled event...',
          leave_waitlist: 'Leaving scheduled waitlist...',
        };
        const failureByKind = {
          register: 'Schedule registration failed',
          waitlist: 'Schedule waitlist failed',
          unregister: 'Schedule unregister failed',
          leave_waitlist: 'Schedule waitlist leave failed',
        };
        setStatus(statusByKind[actionKind] || 'Updating scheduled event...');
        try {
          const body = {};
          if ((actionKind === 'register' || actionKind === 'waitlist') && buyInOil > 0) {
            body.buyInOil = buyInOil;
          }
          await api(buildPokerApiPath(path), {
            method,
            body: JSON.stringify(body),
          });
          await loadPlaySchedule();
        } catch (err) {
          setStatus(`${failureByKind[actionKind] || 'Schedule action failed'}: ${err.code || err.message || 'UNKNOWN'}`);
        }
      });
    });
  }

  function bindPlayScheduleAdminForm() {
    const form = document.getElementById('pokerPlayScheduleTemplateForm');
    const adminToken = readStoredPokerAdminToken();
    if (!form || !adminToken) return;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const title = String(document.getElementById('pokerPlayScheduleTemplateTitle')?.value || '').trim();
      const firstStartAt = String(document.getElementById('pokerPlayScheduleTemplateFirstStartAt')?.value || '').trim();
      const recurrenceKind = String(document.getElementById('pokerPlayScheduleTemplateRecurrenceKind')?.value || 'daily').trim();
      const eventCount = Number(document.getElementById('pokerPlayScheduleTemplateEventCount')?.value || 0);
      const buyInOil = Number(document.getElementById('pokerPlayScheduleTemplateBuyInOil')?.value || 0);
      const smallBlindOil = Number(document.getElementById('pokerPlayScheduleTemplateSmallBlindOil')?.value || 0);
      const bigBlindOil = Number(document.getElementById('pokerPlayScheduleTemplateBigBlindOil')?.value || 0);
      if (!title || !firstStartAt) {
        setStatus('Schedule template title and first start time are required.');
        return;
      }
      setStatus('Creating recurring schedule template...');
      try {
        await api(buildPlayAdminScheduleTemplatesApiPath(), {
          method: 'POST',
          headers: { 'x-admin-token': adminToken },
          body: JSON.stringify({
            title,
            firstStartAt,
            recurrenceKind,
            eventCount,
            buyInOil,
            smallBlindOil,
            bigBlindOil,
            maxSeats: 6,
            minPlayers: 2,
            lateRegistrationHands: 2,
            handsPerBlindLevel: 8,
          }),
        });
        await loadPlaySchedule();
      } catch (err) {
        setStatus(`Schedule template creation failed: ${err.code || err.message || 'UNKNOWN'}`);
      }
    });
  }

  function bindPlayScheduleTemplateActions() {
    const adminToken = readStoredPokerAdminToken();
    if (!adminToken) return;
    const buttons = Array.from(document.querySelectorAll('[data-schedule-template-cancel]'));
    for (const button of buttons) {
      button.addEventListener('click', async () => {
        const templateId = String(button.getAttribute('data-schedule-template-cancel') || '').trim();
        if (!templateId || button.disabled) return;
        setStatus('Cancelling recurring schedule template...');
        try {
          await api(buildPokerApiPath(`/api/poker/play/admin/schedule/templates/${encodeURIComponent(templateId)}/cancel`), {
            method: 'POST',
            headers: { 'x-admin-token': adminToken },
            body: JSON.stringify({}),
          });
          await loadPlaySchedule();
        } catch (err) {
          setStatus(`Schedule template cancel failed: ${err.code || err.message || 'UNKNOWN'}`);
        }
      });
    }
  }

  function bindWaitlistControls(tableId) {
    const form = document.getElementById('pokerPlayWaitlistForm');
    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const inviteCode = readRouteInviteCode();
        setStatus('Joining waitlist...');
        try {
          await api(`/api/poker/play/tables/${encodeURIComponent(tableId)}/waitlist`, {
            method: 'POST',
            body: JSON.stringify({
              displayName: String(document.getElementById('pokerPlayWaitlistDisplayName')?.value || '').trim(),
              buyInOil: Number(document.getElementById('pokerPlayWaitlistBuyInOil')?.value || 0),
              inviteCode: inviteCode || undefined,
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
    const shoveButton = document.getElementById('pokerPlayShoveButton');
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
    if (shoveButton && handId) {
      shoveButton.addEventListener('click', async () => {
        setStatus('Submitting shove...');
        try {
          await api(`/api/poker/play/hands/${encodeURIComponent(handId)}/actions`, {
            method: 'POST',
            body: JSON.stringify({
              actionKind: 'shove',
              amountOil: Number(shoveButton.getAttribute('data-shove-to-oil') || 0),
            }),
          });
          await loadPlayTable(tableId);
          setStatus('Action submitted.');
        } catch (err) {
          setStatus(`Action failed: ${err.code || err.message || 'UNKNOWN'}`);
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
        setStatus('Action submitted.');
      } catch (err) {
        setStatus(`Action failed: ${err.code || err.message || 'UNKNOWN'}`);
      }
    });
  }

  function bindPlayAutoActControls(tableId) {
    const form = document.getElementById('pokerPlayAutoActForm');
    const offButton = document.getElementById('pokerPlayAutoActOffButton');
    if (form && tableId) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        setStatus('Saving auto-act...');
        try {
          await api(`/api/poker/play/tables/${encodeURIComponent(tableId)}/auto-act`, {
            method: 'POST',
            body: JSON.stringify({
              mode: String(document.getElementById('pokerPlayAutoActMode')?.value || 'off').trim(),
              allowWhileDisconnected: !!document.getElementById('pokerPlayAutoActAllowDisconnect')?.checked,
            }),
          });
          await loadPlayTable(tableId);
          setStatus('Auto-act updated.');
        } catch (err) {
          setStatus(`Auto-act failed: ${err.code || err.message || 'UNKNOWN'}`);
        }
      });
    }
    if (offButton && tableId) {
      offButton.addEventListener('click', async () => {
        setStatus('Disabling auto-act...');
        try {
          await api(`/api/poker/play/tables/${encodeURIComponent(tableId)}/auto-act`, {
            method: 'POST',
            body: JSON.stringify({
              mode: 'off',
              allowWhileDisconnected: false,
            }),
          });
          await loadPlayTable(tableId);
          setStatus('Auto-act disabled.');
        } catch (err) {
          setStatus(`Auto-act failed: ${err.code || err.message || 'UNKNOWN'}`);
        }
      });
    }
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

    const startSeriesBreakButton = document.querySelector('[data-admin-series-break-start="1"][data-admin-series-id]');
    if (startSeriesBreakButton) {
      startSeriesBreakButton.addEventListener('click', async () => {
        const targetSeriesId = String(startSeriesBreakButton.getAttribute('data-admin-series-id') || '').trim() || String(seriesId || '').trim();
        if (!targetSeriesId) return;
        setStatus('Starting scheduled break across the tournament series...');
        try {
          const payload = await api(`/api/poker/play/admin/series/${encodeURIComponent(targetSeriesId)}/breaks/start`, {
            method: 'POST',
            headers: { 'x-admin-token': token },
            body: JSON.stringify({
              reason: 'Director started the next scheduled break across the tournament series.',
            }),
          });
          await loadPlayTable(tableId);
          setStatus(`Series break started across ${Number(payload?.data?.series?.scheduledBreakTableCount || 0)} tables.`);
        } catch (err) {
          setStatus(`Series break start failed: ${err.code || err.message || 'UNKNOWN'}`);
        }
      });
    }

    const endSeriesBreakButton = document.querySelector('[data-admin-series-break-end="1"][data-admin-series-id]');
    if (endSeriesBreakButton) {
      endSeriesBreakButton.addEventListener('click', async () => {
        const targetSeriesId = String(endSeriesBreakButton.getAttribute('data-admin-series-id') || '').trim() || String(seriesId || '').trim();
        if (!targetSeriesId) return;
        setStatus('Ending scheduled break across the tournament series...');
        try {
          await api(`/api/poker/play/admin/series/${encodeURIComponent(targetSeriesId)}/breaks/end`, {
            method: 'POST',
            headers: { 'x-admin-token': token },
            body: JSON.stringify({
              reason: 'Director ended the scheduled break early across the tournament series.',
            }),
          });
          await loadPlayTable(tableId);
          setStatus('Series break ended.');
        } catch (err) {
          setStatus(`Series break end failed: ${err.code || err.message || 'UNKNOWN'}`);
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

    const advanceBlindButton = document.querySelector('[data-admin-table-blinds-advance="1"][data-admin-table-id]');
    if (advanceBlindButton) {
      advanceBlindButton.addEventListener('click', async () => {
        const targetTableId = String(advanceBlindButton.getAttribute('data-admin-table-id') || '').trim();
        if (!targetTableId) return;
        setStatus('Advancing tournament blinds...');
        try {
          const payload = await api(`/api/poker/play/admin/tables/${encodeURIComponent(targetTableId)}/blinds/advance`, {
            method: 'POST',
            headers: { 'x-admin-token': token },
            body: JSON.stringify({
              reason: 'Director advanced the tournament blinds.',
            }),
          });
          await loadPlayTable(targetTableId);
          const pendingBlindAdvanceCount = Number(payload?.data?.table?.summary?.pendingBlindAdvanceCount || 0);
          const upcomingBlindLevel = Number(payload?.data?.table?.summary?.upcomingBlindLevel || 0);
          const blindLevel = Number(payload?.data?.table?.summary?.blindLevel || 0);
          setStatus(
            pendingBlindAdvanceCount > 0
              ? `Blind advance queued. Next hand starts at level ${upcomingBlindLevel || blindLevel || 1}.`
              : `Blinds advanced to level ${blindLevel || upcomingBlindLevel || 1}.`
          );
        } catch (err) {
          setStatus(`Blind advance failed: ${err.code || err.message || 'UNKNOWN'}`);
        }
      });
    }

    const startBreakButton = document.querySelector('[data-admin-table-break-start="1"][data-admin-table-id]');
    if (startBreakButton) {
      startBreakButton.addEventListener('click', async () => {
        const targetTableId = String(startBreakButton.getAttribute('data-admin-table-id') || '').trim();
        if (!targetTableId) return;
        setStatus('Starting scheduled break...');
        try {
          const payload = await api(`/api/poker/play/admin/tables/${encodeURIComponent(targetTableId)}/breaks/start`, {
            method: 'POST',
            headers: { 'x-admin-token': token },
            body: JSON.stringify({
              reason: 'Director started the next scheduled break.',
            }),
          });
          await loadPlayTable(targetTableId);
          setStatus(`${String(payload?.data?.table?.summary?.scheduledBreakLabel || 'Scheduled break')} is now active.`);
        } catch (err) {
          setStatus(`Break start failed: ${err.code || err.message || 'UNKNOWN'}`);
        }
      });
    }

    const endBreakButton = document.querySelector('[data-admin-table-break-end="1"][data-admin-table-id]');
    if (endBreakButton) {
      endBreakButton.addEventListener('click', async () => {
        const targetTableId = String(endBreakButton.getAttribute('data-admin-table-id') || '').trim();
        if (!targetTableId) return;
        setStatus('Ending scheduled break...');
        try {
          await api(`/api/poker/play/admin/tables/${encodeURIComponent(targetTableId)}/breaks/end`, {
            method: 'POST',
            headers: { 'x-admin-token': token },
            body: JSON.stringify({
              reason: 'Director ended the scheduled break early.',
            }),
          });
          await loadPlayTable(targetTableId);
          setStatus('Scheduled break ended.');
        } catch (err) {
          setStatus(`Break end failed: ${err.code || err.message || 'UNKNOWN'}`);
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
      bindCashSeatMovementForms(tableId);
      bindPlayLifecycleButtons(tableId);
      bindPlayAutoActControls(tableId);
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
      if (path === '/poker/play/schedule') return await loadPlaySchedule();
      if (path === '/poker/play/admin/ops') return await loadPlayOpsDashboard();
      if (path === '/poker/play/admin/integrity') return await loadPlayIntegrityQueue();
      if (path === '/poker/play/results') return await loadPlayResults();
      const handReviewMatch = path.match(/^\/poker\/play\/hands\/([^/]+)\/review$/);
      if (handReviewMatch) return await loadPlayHandReview(handReviewMatch[1]);
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
