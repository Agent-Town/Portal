(function () {
  const titleEl = document.getElementById('pokerTitle');
  const subtitleEl = document.getElementById('pokerSubtitle');
  const statusEl = document.getElementById('pokerStatus');
  const contentEl = document.getElementById('pokerContent');
  const isEmbedded = new URLSearchParams(window.location.search).get('embed') === '1';
  let countdownTimer = null;
  let liveRefreshTimer = null;
  let liveTableStream = null;
  let liveTableStreamTableId = '';
  let liveTableRefreshInFlight = false;

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

  function buildPokerHref(path) {
    let parsed;
    try {
      parsed = new URL(path, window.location.origin);
    } catch {
      return String(path || '/poker');
    }
    if (isEmbedded) {
      parsed.searchParams.set('embed', '1');
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  }

  function readWalletRecoveryKey() {
    try {
      return String(window.localStorage.getItem('agentTown:walletRecoveryKey') || '').trim();
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
    liveTableStreamTableId = '';
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

  function scheduleLiveTableRefresh(tableId) {
    clearLiveRefreshTimer();
    if (!tableId) return;
    liveRefreshTimer = window.setTimeout(() => {
      const path = window.location.pathname;
      if (path === `/poker/play/tables/${tableId}`) {
        refreshLiveTable(tableId, { silent: true }).catch(() => {});
      }
    }, 15000);
  }

  async function refreshLiveTable(tableId, { silent = false } = {}) {
    if (!tableId || liveTableRefreshInFlight) return;
    liveTableRefreshInFlight = true;
    try {
      await loadPlayTable(tableId, { silent });
    } finally {
      liveTableRefreshInFlight = false;
    }
  }

  function bindLiveTableStream(tableId) {
    if (!tableId || typeof window.EventSource !== 'function') return;
    if (liveTableStream && liveTableStreamTableId === tableId) return;
    clearLiveTableStream();
    liveTableStreamTableId = tableId;
    const stream = new window.EventSource(buildPokerHref(`/api/poker/play/tables/${encodeURIComponent(tableId)}/stream`), {
      withCredentials: true,
    });
    liveTableStream = stream;
    stream.addEventListener('table', () => {
      if (window.location.pathname === `/poker/play/tables/${tableId}`) {
        refreshLiveTable(tableId, { silent: true }).catch(() => {});
      }
    });
    stream.addEventListener('error', () => {
      scheduleLiveTableRefresh(tableId);
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
      const oilBalance = Number(playPayload?.data?.oilBalance?.balance || 0);
      cards.push(`
        <h2>Live 6-Max Tables</h2>
        <p>Play cash and single-table tournament hold’em with other users and their agents. Each seat gets a private agent thread and a live decision clock.</p>
        ${renderMetaBadges([
          playPayload?.data?.houseId || 'house pending',
          playPayload?.data?.wallet?.address || 'wallet pending',
          `${oilBalance} OIL`,
          tables.length ? `${tables.length} tables` : 'no tables',
        ])}
        <div class="pokerLinks">
          <a href="${escapeHtml(buildPokerHref('/poker/play'))}">Open Live Lobby</a>
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
    const oilBalance = Number(payload?.data?.oilBalance?.balance || 0);
    renderCards([
      `
        <h2>Eligibility</h2>
        <div class="pokerSummary">
          ${renderSummaryMetric('House', payload?.data?.houseId || 'Pending')}
          ${renderSummaryMetric('Wallet', payload?.data?.wallet?.address || 'Bind wallet')}
          ${renderSummaryMetric('OIL Balance', `${oilBalance}`)}
          ${renderSummaryMetric('Live Tables', `${items.length}`)}
        </div>
      `,
      `
        <h2>Quick Seat</h2>
        <p>Matchmake into an existing live table with the same structure, or create a new one instantly if no match exists.</p>
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
              ])}
            </div>
            <div class="pokerLinks">
              <a href="${escapeHtml(buildPokerHref(`/poker/play/tables/${encodeURIComponent(item.tableId)}`))}">${item?.currentUser?.seated ? 'Return To Seat' : 'Open Table'}</a>
            </div>
          </div>
        `).join('')
        : '<h2>No live tables yet.</h2><p>Use Quick Seat to create the first matching cash or tournament table.</p>',
    ]);
    bindPlayMatchmakeForm();
    setStatus(items.length ? `${items.length} live poker table${items.length === 1 ? '' : 's'} loaded.` : 'No live poker table available.');
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

  function renderPlayTableCards(data) {
    const table = data?.table || {};
    const hand = data?.hand || null;
    const mySeat = data?.mySeat || null;
    const seats = Array.isArray(data?.seats) ? data.seats : [];
    const actions = Array.isArray(data?.actions) ? data.actions : [];
    const messages = Array.isArray(data?.messages) ? data.messages : [];
    const oilBalance = Number(data?.oilBalance?.balance || 0);
    const paused = String(table?.status || 'open') === 'paused';
    const canJoin = !paused && !mySeat && Number(table?.summary?.openSeatCount || 0) > 0;
    const cards = [
      `
        <h2>${escapeHtml(table?.title || 'Live Table')}</h2>
        <p>${escapeHtml(
          paused
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
          ${table?.tableType === 'tournament' ? renderSummaryMetric('Late Reg', table?.summary?.lateRegistrationOpen ? 'open' : 'closed') : ''}
          ${table?.tableType === 'tournament' ? renderSummaryMetric('Late Reg Hands', `${Number(table?.summary?.lateRegistrationRemainingHands || 0)}`) : ''}
          ${Number(table?.summary?.disconnectedSeatCount || 0) > 0 ? renderSummaryMetric('Disconnected', `${Number(table?.summary?.disconnectedSeatCount || 0)}`) : ''}
          ${renderSummaryMetric('Your OIL', `${oilBalance}`)}
        </div>
        ${renderMetaBadges([
          `${Number(table?.summary?.occupancy || 0)}/${Number(table?.maxSeats || 6)} seated`,
          table?.summary?.liveHand ? `hand ${Number(table?.summary?.handNumber || 0)}` : 'waiting',
          table?.summary?.winnerSeatNumber ? `winner seat ${Number(table?.summary?.winnerSeatNumber || 0)}` : '',
        ].filter(Boolean))}
      `,
      `
        <h2>Seats</h2>
        ${renderSeatMarkers(seats)}
      `,
    ];

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

    if (mySeat) {
      const seatStatus = formatPlaySeatStatus(mySeat.status);
      const leaveQueued = String(mySeat.status || '') === 'leaving_after_hand';
      cards.push(`
        <h2>Your Seat</h2>
        <div class="pokerSummary">
          ${renderSummaryMetric('Seat', `${Number(mySeat.seatNumber || 0)}`)}
          ${renderSummaryMetric('Stack', `${Number(mySeat.stackOil || 0)} OIL`)}
          ${renderSummaryMetric('Status', seatStatus)}
          ${renderSummaryMetric('Role', hand?.actingSeat === Number(mySeat.seatNumber || 0) ? 'acting now' : 'waiting')}
        </div>
        ${String(mySeat.status || '').toLowerCase() === 'registered' ? '<p>Your buy-in is posted. You are registered for the next hand and can use the seat thread before cards are dealt to you.</p>' : ''}
        ${leaveQueued ? '<p>Your cash-out is queued. You stay in this hand, then your remaining stack returns to OIL automatically.</p>' : ''}
        <div class="pokerLinks">
          <button id="pokerPlayLeaveButton" class="pokerButton" type="button"${leaveQueued ? ' disabled' : ''}>${table?.tableType === 'cash' ? (leaveQueued ? 'Cash Out Queued' : (hand ? 'Leave After Hand' : 'Cash Out & Leave')) : 'Leave Seat'}</button>
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
        ${seats.some((seat) => seat.isActing && seat.presenceStatus === 'disconnected') ? '<p>The acting seat is disconnected. The reconnect grace window is holding the clock before timeout action takes over.</p>' : ''}
      `);
    }

    if (data?.suggestion && mySeat) {
      cards.push(`
        <h2>Your Agent Line</h2>
        <p>${escapeHtml(data.suggestion.body || 'No suggestion yet.')}</p>
      `);
    }

    if (mySeat && hand) {
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

    if (mySeat && hand && paused) {
      cards.push(`
        <h2>Submit Action</h2>
        <p>Table play is paused by an operator. Your seat thread remains visible, but no new poker action can be submitted until the table resumes.</p>
      `);
    } else if (mySeat && hand && Array.isArray(hand.viewerAllowedActions) && hand.viewerAllowedActions.length) {
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
          <button class="pokerButton" type="submit">Submit Action</button>
        </form>
      `);
    } else if (actions.length) {
      cards.push(`
        <h2>Public Action Log</h2>
        <div class="pokerStack">
          ${actions.slice(-10).map((action) => `
            <div class="pokerRow">
              <span>${escapeHtml(action.seatLabel || 'Seat')}</span>
              <span>${escapeHtml(action.actionKind || 'act')}</span>
              <span>${Number(action.amountOil || 0)} OIL</span>
            </div>
          `).join('')}
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

  async function loadPlayTable(tableId, { silent = false } = {}) {
    setTitle('Live Poker Table', `Shared 6-max table state for ${tableId}.`);
    if (!silent) setStatus('Loading live table...');
    const payload = await api(`/api/poker/play/tables/${encodeURIComponent(tableId)}`);
    const data = payload?.data || {};
    renderCards(renderPlayTableCards(data));
    bindPlayJoinForm(tableId);
    bindPlayLeaveButton(tableId);
    bindPlayMessageForm(tableId, data?.hand?.handId || '');
    bindPlayActionForm(tableId, data?.hand?.handId || '');
    bindCountdown(data?.hand?.actionExpiresAt || null);
    bindLiveTableStream(tableId);
    scheduleLiveTableRefresh(tableId);
    if (!silent) {
      setStatus(data?.mySeat ? 'Live table synced.' : 'Live table ready.');
    }
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
      if (!path.match(/^\/poker\/play\/tables\/([^/]+)$/)) {
        clearLiveTableStream();
      }
      if (path === '/poker') return await loadIndex();
      if (path === '/poker/play') return await loadPlayLobby();
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
