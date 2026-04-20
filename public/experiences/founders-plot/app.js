(function foundersPlotBootstrap() {
  const TEAM_CODE_HINT_STORAGE_KEY = 'agentTown:teamCodeHint';
  const BUILDING_LABELS = {
    HQ: 'Headquarters',
    LUMBER_CAMP: 'Lumber Camp',
    FARM_PLOT: 'Farm Plot',
    QUARRY: 'Quarry',
    WORKSHOP: 'Workshop',
    MARKET_STALL: 'Market Stall'
  };
  const UPGRADE_CAPS = {
    HQ: 5,
    LUMBER_CAMP: 2,
    FARM_PLOT: 2,
    QUARRY: 2,
    WORKSHOP: 2,
    MARKET_STALL: 2
  };
  const BOARD_ORDER = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 0, y: 2 },
    { x: 1, y: 2 },
    { x: 2, y: 2 }
  ];

  let currentState = null;
  let selectedKey = 'hq';
  let pollTimer = null;
  let pendingAction = false;
  let gatewayPromise = null;
  let foremanRuntimeToken = '';
  let localForemanRuntimeId = '';
  let workerSchedulerStatus = {
    active: false,
    taskKind: 'COLLECT_READY_OUTPUTS',
    tickRunning: false,
    nextRunAtMs: 0,
    lastRunAtMs: 0,
    lastStatus: 'STOPPED',
    lastErrorCode: '',
    consecutiveErrors: 0,
    hasToken: false,
    lastStopReason: ''
  };

  function readTeamCodeHint() {
    try {
      return String(localStorage.getItem(TEAM_CODE_HINT_STORAGE_KEY) || '').trim();
    } catch {
      return '';
    }
  }

  function saveTeamCodeHint(value) {
    const raw = String(value || '').trim().toUpperCase();
    if (!/^TEAM-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(raw)) return;
    try {
      localStorage.setItem(TEAM_CODE_HINT_STORAGE_KEY, raw);
    } catch {
      // ignore
    }
  }

  async function initGateway() {
    if (window.__openclawLiteTest) return window.__openclawLiteTest;
    if (!gatewayPromise) {
      gatewayPromise = import('/openclaw-lite/gateway.js').then((module) => module.default || module);
    }
    return gatewayPromise;
  }

  async function apiText(url, opts = {}) {
    const response = await fetch(url, {
      credentials: 'include',
      cache: 'no-store',
      ...opts
    });
    if (!response.ok) {
      throw new Error(`HTTP_${response.status}`);
    }
    return await response.text();
  }

  async function api(url, opts = {}) {
    const headers = { 'content-type': 'application/json', ...(opts.headers || {}) };
    const teamCodeHint = readTeamCodeHint();
    if (teamCodeHint && headers['x-team-code-hint'] === undefined) {
      headers['x-team-code-hint'] = teamCodeHint;
    }
    const response = await fetch(url, {
      credentials: 'include',
      cache: 'no-store',
      ...opts,
      headers
    });
    const data = await response.json().catch(() => ({}));
    if (typeof data?.teamCode === 'string') {
      saveTeamCodeHint(data.teamCode);
    }
    if (!response.ok || data?.ok === false) {
      const error = new Error(String(data?.error?.code || data?.error || `HTTP_${response.status}`));
      error.payload = data;
      throw error;
    }
    return data;
  }

  async function foremanApi(url, opts = {}) {
    const headers = {
      ...(opts.headers || {}),
      authorization: `Bearer ${foremanRuntimeToken}`
    };
    return api(url, { ...opts, headers });
  }

  function setText(id, value) {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  function htmlEscape(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function prettyGoalOwner(owner) {
    switch (String(owner || '').toLowerCase()) {
      case 'approval':
        return 'Needs your say-so';
      case 'contract_ready':
      case 'contract_progress':
        return 'Active contract';
      case 'landmark':
        return 'Town square';
      case 'receipt':
        return 'Latest receipt';
      case 'optimization':
        return 'Town stability';
      default:
        return 'Tutorial';
    }
  }

  function prettyStandingOrder(order) {
    return String(order || '').toUpperCase() === 'BOLD_FOUNDER' ? 'Bold Founder' : 'Careful Steward';
  }

  function standingOrderSummary(order) {
    return String(order || '').toUpperCase() === 'BOLD_FOUNDER'
      ? 'Push growth when the move is still safe.'
      : 'Protect supplies and ask before spending.';
  }

  function prettyContractStatus(status) {
    return String(status || '')
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (match) => match.toUpperCase());
  }

  function formatResourceList(values = {}) {
    const order = ['wood', 'stone', 'food', 'coin', 'townXp'];
    const labels = {
      wood: 'wood',
      stone: 'stone',
      food: 'food',
      coin: 'coin',
      townXp: 'Town XP'
    };
    return order
      .filter((key) => Number(values?.[key] || 0) > 0)
      .map((key) => `${Number(values[key])} ${labels[key]}`)
      .join(', ');
  }

  function contractRequesterDisplay(contract) {
    return String(contract?.requesterSnapshot?.displayName || contract?.requester || 'Town request');
  }

  function contractInstitutionDisplay(contract) {
    return String(contract?.requesterSnapshot?.institution || contract?.institution || 'Founders Plot');
  }

  function formatSignalDelta(values = {}) {
    const labels = {
      depotReadiness: 'Depot Readiness',
      marketConfidence: 'Market Confidence',
      neighborGoodwill: 'Neighbor Goodwill',
      publicCharm: 'Public Charm'
    };
    return ['depotReadiness', 'marketConfidence', 'neighborGoodwill', 'publicCharm']
      .filter((key) => Number(values?.[key] || 0) !== 0)
      .map((key) => `${Number(values[key]) > 0 ? '+' : ''}${Number(values[key])} ${labels[key]}`)
      .join(', ');
  }

  function formatContractRequirements(contract) {
    const requirements = contract?.requirements || {};
    const buildingRequirements = Array.isArray(requirements.buildings) ? requirements.buildings : [];
    if (buildingRequirements.length > 0) {
      return buildingRequirements
        .map((entry) => `Build ${Number(entry?.minCount || 1)} ${BUILDING_LABELS[entry?.buildingType] || entry?.buildingType}.`)
        .join(' ');
    }
    const resourceText = formatResourceList(requirements.resources || requirements);
    return resourceText ? `Deliver ${resourceText}.` : 'No listed requirement.';
  }

  function formatContractRewards(contract) {
    const rewards = contract?.rewards || {};
    const rewardText = formatResourceList(rewards.resources || rewards);
    const signalText = formatSignalDelta(rewards.signalDelta || {});
    const parts = [];
    if (rewardText) parts.push(`Rewards: ${rewardText}.`);
    if (Number(rewards.townXp || 0) > 0) parts.push(`Adds ${Number(rewards.townXp)} Town XP.`);
    if (signalText) parts.push(`Town change: ${signalText}.`);
    return parts.length > 0 ? parts.join(' ') : 'No listed reward.';
  }

  function signalBandLabel(band) {
    switch (String(band || '').toUpperCase()) {
      case 'LOW':
        return 'Low';
      case 'STRONG':
        return 'Strong';
      default:
        return 'Steady';
    }
  }

  function signalList(state) {
    const townSignals = state?.townSignals || {};
    const labels = townSignals.labels || {};
    const bands = townSignals.bands || {};
    return ['depotReadiness', 'marketConfidence', 'neighborGoodwill', 'publicCharm'].map((key) => ({
      key,
      label: labels[key] || key,
      value: Number(townSignals[key] || 0),
      band: String(bands[key] || 'STEADY')
    }));
  }

  function foremanStatusMeta(status) {
    switch (String(status || 'NOT_STARTED').toUpperCase()) {
      case 'BOOTING':
        return { label: 'Foreman saddling up', tone: 'good' };
      case 'OBSERVING':
        return { label: 'Foreman watching', tone: 'good' };
      case 'THINKING':
        return { label: 'Foreman thinking', tone: 'good' };
      case 'WAITING_FOR_PERMISSION':
        return { label: 'Needs your say-so', tone: 'warn' };
      case 'ACTING':
        return { label: 'Foreman working', tone: 'good' };
      case 'PAUSED':
        return { label: 'Foreman paused', tone: 'warn' };
      case 'STALE':
        return { label: 'Foreman lost the trail', tone: 'warn' };
      case 'ERROR':
        return { label: 'Foreman needs help', tone: 'warn' };
      default:
        return { label: 'Foreman not started', tone: 'warn' };
    }
  }

  function focusPanel(id) {
    const node = document.getElementById(id);
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function formatDuration(endsAt) {
    const remainingMs = Math.max(0, Number(endsAt || 0) - Date.now());
    const totalSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes <= 0) return `${seconds}s`;
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  }

  function stateData() {
    return currentState && currentState.state ? currentState.state : null;
  }

  function normalizeWorkerSchedulerStatus(value = {}) {
    return {
      active: value?.active === true,
      taskKind: String(value?.taskKind || 'COLLECT_READY_OUTPUTS'),
      tickRunning: value?.tickRunning === true,
      nextRunAtMs: Number(value?.nextRunAtMs || 0),
      lastRunAtMs: Number(value?.lastRunAtMs || 0),
      lastStatus: String(value?.lastStatus || 'STOPPED'),
      lastErrorCode: String(value?.lastErrorCode || ''),
      consecutiveErrors: Number(value?.consecutiveErrors || 0),
      hasToken: value?.hasToken === true,
      lastStopReason: String(value?.lastStopReason || '')
    };
  }

  function localForemanRuntimeStatus(serverRuntime = {}) {
    const serverRuntimeId = String(serverRuntime?.runtimeId || '');
    const localRuntimeId = String(localForemanRuntimeId || '');
    const hasServerRuntime = !!serverRuntimeId;
    const hasLocalToken = !!foremanRuntimeToken && localRuntimeId === serverRuntimeId;
    const serverStatus = String(serverRuntime?.status || 'NOT_STARTED').toUpperCase();
    const serverHealthy = ['BOOTING', 'OBSERVING', 'THINKING', 'ACTING'].includes(serverStatus);
    const needsRestart = hasServerRuntime && serverHealthy && !hasLocalToken;
    const actionable = hasServerRuntime && hasLocalToken && serverHealthy;
    return {
      hasServerRuntime,
      hasLocalToken,
      needsRestart,
      actionable,
      serverStatus,
      serverRuntimeId,
      localRuntimeId
    };
  }

  function findBuilding(buildingId) {
    return stateData()?.buildings?.find((building) => building.buildingId === buildingId) || null;
  }

  function findSelected() {
    const state = stateData();
    if (!state) return null;
    if (selectedKey === 'hq') {
      return state.buildings.find((building) => building.type === 'HQ') || null;
    }
    if (selectedKey.startsWith('building:')) {
      return findBuilding(selectedKey.slice('building:'.length));
    }
    return null;
  }

  function emptyPadFromSelection() {
    const state = stateData();
    if (!state) return null;
    if (selectedKey.startsWith('pad:')) {
      const [xText, yText] = selectedKey.slice('pad:'.length).split(',');
      const x = Number(xText);
      const y = Number(yText);
      return state.pads.find((pad) => pad.x === x && pad.y === y && !pad.occupied) || null;
    }
    return null;
  }

  function firstEmptyPad() {
    return stateData()?.pads?.find((pad) => !pad.occupied) || null;
  }

  function setStatusLine(text) {
    setText('plotStatusLine', text);
  }

  function setQuestStatus(text) {
    setText('questStatusLine', text);
  }

  function queueSummary(state) {
    const jobs = Array.isArray(state?.jobs) ? state.jobs.filter((job) => job.status === 'RUNNING') : [];
    if (jobs.length === 0) return 'No active jobs.';
    if (jobs.length === 1) {
      const building = findBuilding(jobs[0].buildingId);
      return `${BUILDING_LABELS[building?.type] || 'Building'} finishes in ${formatDuration(jobs[0].endsAt)}.`;
    }
    return `${jobs.length} jobs running across the plot.`;
  }

  function inventoryRows(state) {
    const next = state?.progress?.next || null;
    return [
      { key: 'wood', label: 'Wood', value: state?.plot?.inventory?.wood ?? 0, cap: state?.plot?.storageCaps?.wood ?? 0 },
      { key: 'stone', label: 'Stone', value: state?.plot?.inventory?.stone ?? 0, cap: state?.plot?.storageCaps?.stone ?? 0 },
      { key: 'food', label: 'Food', value: state?.plot?.inventory?.food ?? 0, cap: state?.plot?.storageCaps?.food ?? 0 },
      { key: 'coin', label: 'Coin', value: state?.plot?.inventory?.coin ?? 0, cap: null },
      { key: 'xp', label: 'Town XP', value: state?.plot?.townXp ?? 0, cap: next?.xpRequired ?? null }
    ];
  }

  function renderInventory(state) {
    const node = document.getElementById('inventoryStrip');
    if (!node) return;
    node.innerHTML = inventoryRows(state).map((item) => {
      const meta = item.cap != null ? `${item.value} / ${item.cap}` : String(item.value);
      return `
        <div class="foundersInventoryItem" data-testid="inventory-${item.key}">
          <div class="foundersLabel">${htmlEscape(item.label)}</div>
          <strong>${htmlEscape(meta)}</strong>
        </div>
      `;
    }).join('');
  }

  function renderBoard(state) {
    const node = document.getElementById('plotBoard');
    if (!node) return;
    const padMap = new Map((state?.pads || []).map((pad) => [`${pad.x},${pad.y}`, pad]));
    const buildingByCoord = new Map((state?.buildings || []).map((building) => [`${building.x},${building.y}`, building]));
    node.innerHTML = BOARD_ORDER.map((cell) => {
      const key = `${cell.x},${cell.y}`;
      const building = buildingByCoord.get(key) || null;
      const pad = padMap.get(key) || null;
      const isScenic = !building && !pad;
      const selectionKey = building
        ? (building.type === 'HQ' ? 'hq' : `building:${building.buildingId}`)
        : (pad ? `pad:${key}` : `scenic:${key}`);
      const classes = ['foundersBoardTile'];
      if (building?.type === 'HQ') classes.push('is-hq');
      if (pad && !pad.occupied) classes.push('is-empty');
      if (isScenic) classes.push('is-scenic');
      if (selectedKey === selectionKey) classes.push('is-selected');
      if (!isScenic) classes.push('is-selectable');
      const title = building
        ? `${BUILDING_LABELS[building.type] || building.type}`
        : (pad ? `${pad.label}` : 'Frontier scrub');
      const meta = building
        ? `Lvl ${building.level} · ${building.state.toLowerCase().replace(/_/g, ' ')}`
        : (pad ? 'Open build pad' : 'Scenic space');
      return `
        <button
          class="${classes.join(' ')}"
          type="button"
          ${isScenic ? 'disabled' : ''}
          data-select-key="${htmlEscape(selectionKey)}"
          data-testid="board-tile-${cell.x}-${cell.y}"
        >
          <div class="foundersBoardTileTitle">${htmlEscape(title)}</div>
          <div class="foundersBoardTileMeta">${htmlEscape(meta)}</div>
        </button>
      `;
    }).join('');

    node.querySelectorAll('[data-select-key]').forEach((button) => {
      button.addEventListener('click', () => {
        selectedKey = button.getAttribute('data-select-key') || selectedKey;
        renderAll();
      });
    });
  }

  function actionButton(label, onClick, testId, disabled = false) {
    const button = document.createElement('button');
    button.className = 'btn small';
    button.type = 'button';
    button.textContent = label;
    if (testId) button.setAttribute('data-testid', testId);
    button.disabled = disabled || pendingAction;
    button.addEventListener('click', onClick);
    return button;
  }

  async function runTool(name, args = {}, actor = 'HUMAN') {
    pendingAction = true;
    setStatusLine(`Running ${name}…`);
    try {
      const response = await api(`/api/founders-plot/tool/${encodeURIComponent(name)}`, {
        method: 'POST',
        body: JSON.stringify({
          actor,
          ...args
        })
      });
      if (response?.data?.state) {
        currentState = { ok: true, state: response.data.state };
      } else {
        await loadState();
      }
      setStatusLine(`${name} complete.`);
      renderAll();
      return response;
    } catch (error) {
      const details = error?.payload?.error?.details || {};
      const detailText = details && Object.keys(details).length > 0 ? ` ${JSON.stringify(details)}` : '';
      setStatusLine(`${name} failed: ${error.message}.${detailText}`);
      throw error;
    } finally {
      pendingAction = false;
      renderAll();
    }
  }

  async function updatePolicy(key, value) {
    pendingAction = true;
    setStatusLine(`Updating ${key}…`);
    try {
      const response = await api('/api/founders-plot/policy', {
        method: 'POST',
        body: JSON.stringify({ key, value })
      });
      currentState = { ok: true, state: response.state };
      setStatusLine(`${key} updated.`);
      renderAll();
      return response;
    } catch (error) {
      setStatusLine(`Could not update ${key}: ${error.message}.`);
      throw error;
    } finally {
      pendingAction = false;
      renderAll();
    }
  }

  async function resolveApproval(approvalId, decision) {
    pendingAction = true;
    setStatusLine(`${decision === 'approve' ? 'Approving' : 'Rejecting'} request…`);
    try {
      const response = await api(`/api/founders-plot/approvals/${encodeURIComponent(approvalId)}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ decision })
      });
      currentState = { ok: true, state: response.state };
      setStatusLine(`Approval ${decision}d.`);
      renderAll();
      return response;
    } catch (error) {
      setStatusLine(`Approval update failed: ${error.message}.`);
      throw error;
    } finally {
      pendingAction = false;
      renderAll();
    }
  }

  async function claimReward(rewardKey) {
    return runTool('et.plot.claim_reward', {
      rewardKey,
      idempotencyKey: `claim:${rewardKey}:${Date.now()}`
    });
  }

  async function setStandingOrder(standingOrder) {
    return runTool('et.foreman.policy.set_standing_order', {
      standingOrder,
      idempotencyKey: `standing-order:${standingOrder}:${Date.now()}`
    });
  }

  async function acceptContract(contractId) {
    pendingAction = true;
    setStatusLine('Accepting contract…');
    try {
      const response = await api('/api/founders-plot/contracts/accept', {
        method: 'POST',
        body: JSON.stringify({
          contractId,
          idempotencyKey: `contract-accept:${contractId}:${Date.now()}`
        })
      });
      currentState = { ok: true, state: response.state };
      setStatusLine('Contract accepted.');
      renderAll();
      return response;
    } catch (error) {
      setStatusLine(`Could not accept contract: ${error.message}.`);
      throw error;
    } finally {
      pendingAction = false;
      renderAll();
    }
  }

  async function turnInContract(contractId) {
    pendingAction = true;
    setStatusLine('Turning in contract…');
    try {
      const response = await api('/api/founders-plot/contracts/turn-in', {
        method: 'POST',
        body: JSON.stringify({
          contractId,
          idempotencyKey: `contract-turn-in:${contractId}:${Date.now()}`
        })
      });
      currentState = { ok: true, state: response.state };
      setStatusLine('Contract turned in.');
      renderAll();
      return response;
    } catch (error) {
      setStatusLine(`Could not turn in contract: ${error.message}.`);
      throw error;
    } finally {
      pendingAction = false;
      renderAll();
    }
  }

  function buildTypeButtons(container, types, pad) {
    const row = document.createElement('div');
    row.className = 'foundersInlineButtons';
    for (const type of types) {
      row.appendChild(actionButton(
        `Place ${BUILDING_LABELS[type] || type}`,
        async () => {
          await runTool('et.plot.place_building', {
            type,
            x: pad.x,
            y: pad.y,
            idempotencyKey: `place:${type}:${pad.x}:${pad.y}:${Date.now()}`
          });
        },
        `place-${type.toLowerCase()}`
      ));
    }
    container.appendChild(row);
  }

  function renderSelection(state) {
    const node = document.getElementById('selectionCard');
    if (!node) return;
    node.innerHTML = '';
    const selectedBuilding = findSelected();
    const selectedPad = emptyPadFromSelection();

    if (selectedBuilding) {
      const runningJob = selectedBuilding.runningJob || null;
      const completedJobs = Array.isArray(selectedBuilding.completedJobs) ? selectedBuilding.completedJobs : [];
      const actions = document.createElement('div');
      actions.className = 'foundersActions';
      const title = document.createElement('h2');
      title.textContent = BUILDING_LABELS[selectedBuilding.type] || selectedBuilding.type;
      node.appendChild(title);

      const rows = document.createElement('div');
      rows.innerHTML = `
        <div class="foundersDataRow"><span>State</span><span class="foundersBadge">${htmlEscape(selectedBuilding.state.toLowerCase().replace(/_/g, ' '))}</span></div>
        <div class="foundersDataRow"><span>Level</span><span>${htmlEscape(String(selectedBuilding.level))}</span></div>
        <div class="foundersDataRow"><span>Priority</span><span>${htmlEscape(String(selectedBuilding.priority || 'BALANCED'))}</span></div>
      `;
      node.appendChild(rows);

      if (runningJob) {
        const running = document.createElement('p');
        running.textContent = `${runningJob.kind.toLowerCase()} finishes in ${formatDuration(runningJob.endsAt)}.`;
        node.appendChild(running);
      }
      if (completedJobs.length > 0) {
        actions.appendChild(actionButton(
          'Collect outputs',
          async () => {
            await runTool('et.plot.collect_outputs', {
              buildingId: selectedBuilding.buildingId,
              idempotencyKey: `collect:${selectedBuilding.buildingId}:${Date.now()}`
            });
          },
          'selection-collect'
        ));
      } else if (!runningJob && selectedBuilding.type !== 'HQ' && selectedBuilding.state === 'READY') {
        actions.appendChild(actionButton(
          selectedBuilding.type === 'MARKET_STALL' ? 'Queue market sale' : 'Queue job',
          async () => {
            await runTool('et.plot.queue_job', {
              buildingId: selectedBuilding.buildingId,
              idempotencyKey: `queue:${selectedBuilding.buildingId}:${Date.now()}`
            });
          },
          'selection-queue'
        ));
      }

      if (!runningJob && (UPGRADE_CAPS[selectedBuilding.type] || 1) > selectedBuilding.level) {
        const label = selectedBuilding.type === 'HQ' ? 'Upgrade Headquarters' : 'Upgrade building';
        actions.appendChild(actionButton(
          label,
          async () => {
            await runTool('et.plot.upgrade_building', {
              buildingId: selectedBuilding.type === 'HQ' ? undefined : selectedBuilding.buildingId,
              idempotencyKey: `upgrade:${selectedBuilding.buildingId}:${Date.now()}`
            });
          },
          'selection-upgrade'
        ));
      }

      if ((state.progress?.currentLevel || state.plot?.hqLevel || 1) >= 4 && selectedBuilding.type !== 'HQ') {
        const priorityRow = document.createElement('div');
        priorityRow.className = 'foundersPriorityRow';
        const titleRow = document.createElement('div');
        titleRow.className = 'small';
        titleRow.textContent = 'Priority';
        priorityRow.appendChild(titleRow);
        const buttons = document.createElement('div');
        buttons.className = 'foundersInlineButtons';
        ['BALANCED', 'WOOD', 'STONE', 'FOOD'].forEach((priority) => {
          buttons.appendChild(actionButton(
            priority.toLowerCase(),
            async () => {
              await runTool('et.plot.set_priority', {
                buildingId: selectedBuilding.buildingId,
                priority,
                idempotencyKey: `priority:${selectedBuilding.buildingId}:${priority}:${Date.now()}`
              });
            },
            `priority-${priority.toLowerCase()}`,
            selectedBuilding.priority === priority
          ));
        });
        priorityRow.appendChild(buttons);
        node.appendChild(priorityRow);
      }

      node.appendChild(actions);
      return;
    }

    if (selectedPad) {
      const title = document.createElement('h2');
      title.textContent = selectedPad.label;
      node.appendChild(title);
      const description = document.createElement('p');
      description.textContent = 'Choose the next building for this open pad.';
      node.appendChild(description);
      buildTypeButtons(node, state.unlocks.buildingTypes || [], selectedPad);
      return;
    }

    node.innerHTML = '<div class="foundersEmptyState">Select a pad or building to inspect it.</div>';
  }

  function renderContracts(state) {
    const node = document.getElementById('contractBoard');
    if (!node) return;
    const statusNode = document.getElementById('contractBoardStatus');
    const contracts = state?.contracts || {};
    const offers = Array.isArray(contracts.offers) ? contracts.offers : [];
    const activeContract = contracts.activeContract || null;
    if (contracts.boardLocked) {
      if (statusNode) statusNode.textContent = 'Opens at HQ2.';
      node.innerHTML = '<div class="foundersEmptyState">Town requests arrive once Headquarters reaches level 2.</div>';
      return;
    }

    if (statusNode) {
      statusNode.textContent = activeContract
        ? `Active: ${activeContract.title}`
        : `${offers.length} offers ready.`;
    }

    const cards = [];
    if (activeContract) {
      cards.push(`
        <article class="foundersContractItem is-active">
          <div class="foundersContractHeader">
            <div>
              <strong>${htmlEscape(activeContract.title)}</strong>
              <div class="foundersContractKicker">${htmlEscape(contractRequesterDisplay(activeContract))} · ${htmlEscape(contractInstitutionDisplay(activeContract))}</div>
            </div>
            <span class="foundersBadge">${htmlEscape(prettyContractStatus(activeContract.status))}</span>
          </div>
          <div class="small">${htmlEscape(activeContract.whyNow || activeContract.townBenefit || '')}</div>
          <div class="foundersContractMeta">
            <div class="small">${htmlEscape(formatContractRequirements(activeContract))}</div>
            <div class="small">${htmlEscape(formatContractRewards(activeContract))}</div>
            ${activeContract.townBenefit ? `<div class="small">${htmlEscape(activeContract.townBenefit)}</div>` : ''}
            ${activeContract.townMoment?.label ? `<div class="small">Town moment: ${htmlEscape(activeContract.townMoment.label)}</div>` : ''}
            <div class="small">${htmlEscape(activeContract.philosophyHint || '')}</div>
          </div>
          <div class="foundersContractAction">
            <button
              class="btn small"
              type="button"
              data-contract-turn-in="${htmlEscape(activeContract.contractId)}"
              ${activeContract.status === 'READY_TO_TURN_IN' && !pendingAction ? '' : 'disabled'}
            >
              ${activeContract.status === 'READY_TO_TURN_IN' ? 'Turn in contract' : 'In progress'}
            </button>
          </div>
        </article>
      `);
    }

    if (offers.length > 0) {
      cards.push(...offers.map((offer) => `
        <article class="foundersContractItem" data-testid="contract-offer">
          <div class="foundersContractHeader">
            <div>
              <strong>${htmlEscape(offer.title)}</strong>
              <div class="foundersContractKicker">${htmlEscape(contractRequesterDisplay(offer))} · ${htmlEscape(contractInstitutionDisplay(offer))}</div>
            </div>
            <span class="foundersBadge">${htmlEscape(offer.kind)}</span>
          </div>
          <div class="small">${htmlEscape(offer.whyNow || '')}</div>
          <div class="foundersContractMeta">
            <div class="small">${htmlEscape(formatContractRequirements(offer))}</div>
            <div class="small">${htmlEscape(formatContractRewards(offer))}</div>
            ${offer.townBenefit ? `<div class="small">${htmlEscape(offer.townBenefit)}</div>` : ''}
            ${offer.townMoment?.label ? `<div class="small">Town moment: ${htmlEscape(offer.townMoment.label)}</div>` : ''}
            <div class="small">${htmlEscape(offer.philosophyHint || '')}</div>
          </div>
          <div class="foundersContractAction">
            <button
              class="btn small"
              type="button"
              data-contract-accept="${htmlEscape(offer.contractId)}"
              ${activeContract || pendingAction ? 'disabled' : ''}
            >
              Accept ${htmlEscape(offer.kind.toLowerCase())} request
            </button>
          </div>
        </article>
      `));
    }

    node.innerHTML = cards.length > 0
      ? `<div class="foundersContractList">${cards.join('')}</div>`
      : '<div class="foundersEmptyState">No town requests are waiting right now.</div>';

    node.querySelectorAll('[data-contract-accept]').forEach((button) => {
      button.addEventListener('click', async () => {
        try {
          await acceptContract(button.getAttribute('data-contract-accept') || '');
        } catch {
          // status line already updated
        }
      });
    });
    node.querySelectorAll('[data-contract-turn-in]').forEach((button) => {
      button.addEventListener('click', async () => {
        if (button.hasAttribute('disabled')) return;
        try {
          await turnInContract(button.getAttribute('data-contract-turn-in') || '');
        } catch {
          // status line already updated
        }
      });
    });
  }

  function renderSignals(state) {
    const node = document.getElementById('signalsPanel');
    if (!node) return;
    const rows = signalList(state);
    node.innerHTML = rows.map((signal) => `
      <div class="foundersSignalItem" data-testid="signal-${htmlEscape(signal.key)}">
        <div class="foundersSignalHeader">
          <strong>${htmlEscape(signal.label)}</strong>
          <span class="foundersBadge ${signal.band === 'LOW' ? 'is-warn' : ''}">${htmlEscape(signalBandLabel(signal.band))}</span>
        </div>
        <div class="foundersSignalBar" aria-hidden="true">
          <div class="foundersSignalFill is-${htmlEscape(signal.band.toLowerCase())}" style="width:${Math.max(0, Math.min(100, signal.value))}%"></div>
        </div>
      </div>
    `).join('');
  }

  function renderLandmark(state) {
    const node = document.getElementById('publicSquareCard');
    if (!node) return;
    const landmark = state?.landmarks?.publicSquare || {};
    const canUpgrade = Number(landmark.level || 0) < 1
      && Number(state?.plot?.inventory?.wood || 0) >= 4
      && Number(state?.plot?.inventory?.coin || 0) >= 8;
    node.innerHTML = `
      <div class="foundersLandmarkBody">
        <div class="foundersLabel">Public square</div>
        <strong>${htmlEscape(landmark.level >= 1 ? 'Welcome Sign' : 'Open Dust Lot')}</strong>
        <div class="small">${htmlEscape(
          landmark.level >= 1
            ? 'The square feels settled enough to greet newcomers.'
            : 'A simple welcome sign would make the plot feel like a town.'
        )}</div>
        <div class="small">${landmark.level >= 1 ? 'Built.' : 'Cost: 4 wood, 8 coin.'}</div>
        <div class="foundersContractAction">
          <button class="btn small" type="button" id="publicSquareUpgradeBtn" data-testid="public-square-upgrade-btn" ${landmark.level >= 1 || pendingAction || !canUpgrade ? 'disabled' : ''}>
            ${landmark.level >= 1 ? 'Welcome Sign raised' : 'Raise the Welcome Sign'}
          </button>
        </div>
      </div>
    `;
    const button = document.getElementById('publicSquareUpgradeBtn');
    if (button) {
      button.onclick = async () => {
        try {
          await runTool('et.plot.town.upgrade_landmark', {
            landmarkId: 'public_square_welcome_sign',
            idempotencyKey: `landmark:${Date.now()}`
          });
        } catch {
          // status line already updated
        }
      };
    }
  }

  function renderJournal(state) {
    const node = document.getElementById('journalList');
    if (!node) return;
    const entries = Array.isArray(state?.journal?.entries) ? state.journal.entries : [];
    if (entries.length === 0) {
      node.innerHTML = '<div class="foundersEmptyState">No fresh town notes yet.</div>';
      return;
    }
    node.innerHTML = entries.map((entry) => `
      <div class="foundersJournalItem">
        <div class="foundersSignalHeader">
          <strong>${htmlEscape(entry.title || entry.category || 'Town note')}</strong>
          <span class="foundersBadge">${htmlEscape(String(entry.category || 'NOTE').toLowerCase())}</span>
        </div>
        <div class="small">${htmlEscape(entry.body || '')}</div>
      </div>
    `).join('');
  }

  function renderForeman(state) {
    const runtime = state?.foreman?.runtime || {};
    const runtimeLocal = localForemanRuntimeStatus(runtime);
    const status = runtimeLocal.needsRestart
      ? { label: 'Needs a fresh start', tone: 'warn' }
      : foremanStatusMeta(runtime.status);
    const badge = document.getElementById('foremanStatusBadge');
    if (badge) {
      badge.textContent = status.label;
      badge.className = `foundersBadge ${status.tone === 'warn' ? 'is-warn' : ''}`;
    }

    const recommendation = state?.foreman?.recommendation || 'Clover is watching. No safe action inside your standing order.';
    setText('foremanRecommendation', recommendation);

    const toolsLine = (() => {
      if (!runtime.runtimeId) return 'Start Clover when you are ready for in-session help.';
      if (runtimeLocal.needsRestart) return 'Restart Clover before any routine can run in this tab.';
      if (runtime.status === 'PAUSED') return 'Automation is paused until you wake Clover again.';
      if (runtime.status === 'STALE' || runtime.status === 'ERROR' || ['ERROR', 'STALE', 'TOKEN_MISSING'].includes(String(workerSchedulerStatus.lastStatus || '').toUpperCase())) {
        return 'Clover needs a fresh start.';
      }
      return 'Clover can observe, plan, and handle one safe routine task you have allowed.';
    })();
    setText('foremanToolsLine', toolsLine);

    const startBtn = document.getElementById('foremanStartBtn');
    const pauseBtn = document.getElementById('foremanPauseBtn');
    const runNowBtn = document.getElementById('foremanRunNowBtn');
    if (startBtn) {
      startBtn.disabled = pendingAction;
      startBtn.textContent = runtime.runtimeId ? 'Restart Clover' : 'Start Clover';
      startBtn.onclick = async () => {
        try {
          pendingAction = true;
          setStatusLine('Starting Clover…');
          const response = await startForemanRuntime();
          setStatusLine(response?.ok ? 'Clover is ready to watch the town.' : 'Clover could not start. You can still play by hand.');
          renderAll();
        } catch (error) {
          setStatusLine(`Clover could not start. You can still play by hand. (${error.message})`);
        } finally {
          pendingAction = false;
          renderAll();
        }
      };
    }
    if (pauseBtn) {
      pauseBtn.disabled = pendingAction || !runtimeLocal.actionable || String(runtime.status || '').toUpperCase() === 'PAUSED';
      pauseBtn.onclick = async () => {
        try {
          pendingAction = true;
          await pauseForemanRuntime();
          setStatusLine('Foreman paused.');
        } catch (error) {
          setStatusLine(`Could not pause Clover: ${error.message}.`);
        } finally {
          pendingAction = false;
          renderAll();
        }
      };
    }
    if (runNowBtn) {
      runNowBtn.disabled = pendingAction || !runtimeLocal.actionable || ['PAUSED', 'STALE', 'ERROR', 'NOT_STARTED'].includes(String(runtime.status || '').toUpperCase());
      runNowBtn.onclick = async () => {
        try {
          pendingAction = true;
          setStatusLine('Clover is taking a look…');
          const response = await runForemanTick();
          if (response?.receipt) {
            setStatusLine('Clover handled one safe task.');
          } else {
            setStatusLine('Clover watched but did not choose an action.');
          }
        } catch (error) {
          setStatusLine(`Clover watched but did not choose an action. (${error.message})`);
        } finally {
          pendingAction = false;
          renderAll();
        }
      };
    }

    const standingOrderNode = document.getElementById('standingOrderCard');
    if (standingOrderNode) {
      const activeOrder = state?.foreman?.standingOrder || 'CAREFUL_STEWARD';
      standingOrderNode.innerHTML = `
        <div class="foundersStandingOrderBody">
          <div class="foundersLabel">Standing order</div>
          <strong>${htmlEscape(prettyStandingOrder(activeOrder))}</strong>
          <div class="small">${htmlEscape(standingOrderSummary(activeOrder))}</div>
          <div class="foundersStandingOrderChoices">
            <button class="btn small foundersStandingOrderChoice" type="button" data-standing-order="CAREFUL_STEWARD" data-testid="standing-order-careful" ${activeOrder === 'CAREFUL_STEWARD' || pendingAction ? 'disabled' : ''}>
              <strong>Careful Steward</strong>
              <span class="small">Protect supplies and ask before spending.</span>
            </button>
            <button class="btn small foundersStandingOrderChoice" type="button" data-standing-order="BOLD_FOUNDER" data-testid="standing-order-bold" ${activeOrder === 'BOLD_FOUNDER' || pendingAction ? 'disabled' : ''}>
              <strong>Bold Founder</strong>
              <span class="small">Push growth when the move is still safe.</span>
            </button>
          </div>
        </div>
      `;
      standingOrderNode.querySelectorAll('[data-standing-order]').forEach((button) => {
        button.addEventListener('click', async () => {
          try {
            await setStandingOrder(button.getAttribute('data-standing-order') || '');
          } catch {
            // status line already updated
          }
        });
      });
    }

    const planNode = document.getElementById('planCard');
    const planCard = state?.foreman?.planCard || null;
    if (planNode) {
      if (!planCard) {
        planNode.innerHTML = `
          <div class="foundersPlanBody">
            <div class="foundersLabel">Foreman plan</div>
            <div class="small">Clover is watching. No safe action inside your standing order.</div>
          </div>
        `;
      } else {
        planNode.innerHTML = `
          <div class="foundersPlanBody">
            <div class="foundersLabel">Foreman plan</div>
            <strong>${htmlEscape(planCard.headline || 'Foreman plan')}</strong>
            <div class="foundersPlanMeta">
              <span class="foundersBadge ${planCard.canActNow ? '' : 'is-warn'}">${htmlEscape(String(planCard.goalServed || 'town_stability').replace(/_/g, ' '))}</span>
              <span class="small">${htmlEscape(planCard.canActNow ? 'Can act now' : 'Watching only')}</span>
            </div>
            <div class="small">${htmlEscape(planCard.observation || '')}</div>
            <div class="small">${htmlEscape(planCard.recommendation || '')}</div>
            <div class="small">${htmlEscape(planCard.reason || '')}</div>
            ${planCard.standingOrderInfluence ? `<div class="small">${htmlEscape(planCard.standingOrderInfluence)}</div>` : ''}
            ${planCard.alternative ? `<div class="small">${htmlEscape(planCard.alternative)}</div>` : ''}
          </div>
        `;
      }
    }

    const schedulerNode = document.getElementById('schedulerCard');
    if (schedulerNode) {
      const task = state?.foreman?.scheduler?.collectReadyOutputs || {};
      const schedulerLabel = task.paused === true
        ? 'Clover will ask next time.'
        : task.enabled && !runtimeLocal.actionable
          ? 'Restart Clover to resume this routine.'
          : ['ERROR', 'STALE', 'TOKEN_MISSING'].includes(String(workerSchedulerStatus.lastStatus || '').toUpperCase())
            ? 'Clover needs a fresh start.'
            : task.enabled && workerSchedulerStatus.active
              ? 'Clover is watching for ready outputs while this tab is open.'
              : task.enabled
                ? 'Collect ready outputs is enabled.'
                : 'Collect ready outputs is off.';
      schedulerNode.innerHTML = `
        <div class="foundersSchedulerBody">
          <div class="foundersLabel">Foreman routine</div>
          <strong>${htmlEscape(schedulerLabel)}</strong>
          <div class="small">This helps only while you keep Founders Plot open.</div>
          <div class="foundersSchedulerRow">
            <button class="btn small" type="button" id="schedulerCollectToggle" data-testid="scheduler-collect-toggle" ${pendingAction || !runtimeLocal.actionable ? 'disabled' : ''}>
              ${task.enabled && task.paused !== true ? 'Ask me next time' : 'Enable collect ready outputs'}
            </button>
            <span class="small">${task.runCount ? `${task.runCount} successful run${task.runCount === 1 ? '' : 's'}` : 'No automatic collection yet.'}</span>
          </div>
        </div>
      `;
      const toggleBtn = document.getElementById('schedulerCollectToggle');
      if (toggleBtn) {
        toggleBtn.onclick = async () => {
          try {
            if (task.enabled && task.paused !== true) {
              await applyReceiptCorrection('ASK_ME_NEXT_TIME');
              setStatusLine('Clover will ask next time before collecting automatically.');
            } else {
              await enableCollectReadyOutputs();
              setStatusLine('Collect ready outputs is enabled.');
            }
          } catch (error) {
            setStatusLine(`Could not update Clover’s routine: ${error.message}.`);
          } finally {
            renderAll();
          }
        };
      }
    }

    const receiptNode = document.getElementById('receiptCard');
    const receipt = state?.foreman?.receipt || null;
    if (receiptNode) {
      if (!receipt) {
        receiptNode.innerHTML = `
          <div class="foundersReceiptBody">
            <div class="foundersLabel">Latest receipt</div>
            <div class="small">Clover has not acted yet.</div>
          </div>
        `;
      } else {
        receiptNode.innerHTML = `
          <div class="foundersReceiptBody">
            <div class="foundersLabel">Latest receipt</div>
            <strong>${htmlEscape(receipt.action === 'collect_ready_outputs' ? 'Clover collected ready output' : receipt.action || 'Foreman action')}</strong>
            <div class="foundersReceiptMeta">
              <span class="small">Event #${htmlEscape(String(receipt.eventId || '0'))}</span>
              ${receipt.standingOrderUsed ? `<span class="small">${htmlEscape(prettyStandingOrder(receipt.standingOrderUsed))}</span>` : ''}
            </div>
            <div class="small">${htmlEscape(receipt.reason || receipt.result || '')}</div>
            <div class="foundersReceiptActions">
              <button class="btn small" type="button" id="receiptAskNextTime" data-testid="receipt-ask-next-time" ${pendingAction ? 'disabled' : ''}>Ask me next time</button>
              <button class="btn small" type="button" id="receiptPauseForeman" data-testid="receipt-pause-foreman" ${pendingAction ? 'disabled' : ''}>Pause Foreman</button>
            </div>
          </div>
        `;
        const askBtn = document.getElementById('receiptAskNextTime');
        if (askBtn) {
          askBtn.onclick = async () => {
            try {
              await applyReceiptCorrection('ASK_ME_NEXT_TIME');
              setStatusLine('Clover will ask next time before repeating that routine.');
            } catch (error) {
              setStatusLine(`Could not update Clover’s routine: ${error.message}.`);
            } finally {
              renderAll();
            }
          };
        }
        const pauseReceiptBtn = document.getElementById('receiptPauseForeman');
        if (pauseReceiptBtn) {
          pauseReceiptBtn.onclick = async () => {
            try {
              await applyReceiptCorrection('PAUSE_FOREMAN');
              setStatusLine('Foreman paused.');
            } catch (error) {
              setStatusLine(`Could not pause Clover: ${error.message}.`);
            } finally {
              renderAll();
            }
          };
        }
      }
    }
  }

  function permissionConfig() {
    return [
      { key: 'observeAndSuggest', label: 'Observe + suggest', level: 1 },
      { key: 'collectOutputs', label: 'Collect outputs', level: 1 },
      { key: 'queueProduction', label: 'Queue production', level: 3 },
      { key: 'setPriority', label: 'Set one priority', level: 4 },
      { key: 'sellSurplusFood', label: 'Sell surplus food', level: 5 }
    ];
  }

  function renderPermissions(state) {
    const node = document.getElementById('permissionsList');
    if (!node) return;
    node.innerHTML = '';
    const currentLevel = state?.progress?.currentLevel || state?.plot?.hqLevel || 1;
    for (const item of permissionConfig()) {
      const wrapper = document.createElement('div');
      wrapper.className = 'foundersPermissionItem';
      const enabled = !!state?.policy?.[item.key];
      const unlocked = currentLevel >= item.level;
      wrapper.innerHTML = `
        <div class="foundersPermissionToggle">
          <div>
            <strong>${htmlEscape(item.label)}</strong>
            <div class="small">${unlocked ? 'Unlocked' : `Unlocks at HQ ${item.level}`}</div>
          </div>
          <span class="foundersBadge ${enabled ? '' : 'is-warn'}">${enabled ? 'Enabled' : 'Disabled'}</span>
        </div>
      `;
      wrapper.appendChild(actionButton(
        enabled ? 'Disable' : 'Enable',
        async () => updatePolicy(item.key, !enabled),
        `permission-${item.key}`,
        !unlocked
      ));
      node.appendChild(wrapper);
    }
  }

  function renderApprovals(state) {
    const node = document.getElementById('approvalsList');
    if (!node) return;
    const approvals = Array.isArray(state?.foreman?.pendingApprovals) ? state.foreman.pendingApprovals : [];
    if (approvals.length === 0) {
      node.innerHTML = '<div class="foundersEmptyState">No pending approvals.</div>';
      return;
    }
    node.innerHTML = '';
    const list = document.createElement('div');
    list.className = 'foundersApprovalList';
    approvals.forEach((approval) => {
      const item = document.createElement('div');
      item.className = 'foundersApprovalItem';
      item.innerHTML = `
        <strong>${htmlEscape(approval.title)}</strong>
        <div class="small">${htmlEscape(approval.body)}</div>
      `;
      const actions = document.createElement('div');
      actions.className = 'foundersApprovalActions';
      actions.appendChild(actionButton('Approve', async () => resolveApproval(approval.approvalId, 'approve'), `approve-${approval.approvalId}`));
      actions.appendChild(actionButton('Reject', async () => resolveApproval(approval.approvalId, 'reject'), `reject-${approval.approvalId}`));
      item.appendChild(actions);
      list.appendChild(item);
    });
    node.appendChild(list);
  }

  function renderRewards(state) {
    const node = document.getElementById('rewardsList');
    if (!node) return;
    const rewards = Array.isArray(state?.rewards) ? state.rewards : [];
    if (rewards.length === 0) {
      node.innerHTML = '<div class="foundersEmptyState">No rewards ready.</div>';
      return;
    }
    node.innerHTML = '';
    const list = document.createElement('div');
    list.className = 'foundersRewardsList';
    rewards.forEach((reward) => {
      const item = document.createElement('div');
      item.className = 'foundersRewardItem';
      item.innerHTML = `
        <strong>${htmlEscape(reward.title)}</strong>
        <div class="small">${htmlEscape(reward.body || '')}</div>
      `;
      item.appendChild(actionButton('Claim reward', async () => claimReward(reward.key), `claim-${reward.key}`));
      list.appendChild(item);
    });
    node.appendChild(list);
  }

  function renderQueue(state) {
    setText('queueSummaryText', queueSummary(state));
    const node = document.getElementById('queueList');
    if (!node) return;
    const jobs = Array.isArray(state?.jobs) ? state.jobs : [];
    if (jobs.length === 0) {
      node.innerHTML = '<div class="foundersEmptyState">No active or pending jobs.</div>';
      return;
    }
    node.innerHTML = jobs.map((job) => {
      const building = findBuilding(job.buildingId);
      return `
        <div class="foundersQueueItem">
          <strong>${htmlEscape(BUILDING_LABELS[building?.type] || 'Building')}</strong>
          <div class="small">${htmlEscape(job.kind.toLowerCase())} · ${htmlEscape(job.status.toLowerCase())} · ends in ${htmlEscape(formatDuration(job.endsAt))}</div>
        </div>
      `;
    }).join('');
  }

  function renderRecap(state) {
    const lines = Array.isArray(state?.recap?.lines) ? state.recap.lines : [];
    const sections = Array.isArray(state?.recap?.sections) ? state.recap.sections : [];
    setText('recapSummaryText', lines.length > 0 ? `${lines.length} recap lines ready.` : 'No new recap lines yet.');
    const node = document.getElementById('recapList');
    if (!node) return;
    if (lines.length === 0 && sections.every((section) => !Array.isArray(section?.lines) || section.lines.length === 0)) {
      node.innerHTML = '<div class="foundersEmptyState">The plot has been quiet since your last visit.</div>';
      return;
    }
    const sectionHtml = sections.map((section) => `
      <div class="foundersRecapSection">
        <strong>${htmlEscape(section.title || 'Update')}</strong>
        <div class="foundersRecapSectionList">
          ${(Array.isArray(section?.lines) && section.lines.length > 0 ? section.lines : [{ line: 'No new notes.' }]).map((item) => `
            <div class="small">${htmlEscape(item.line || 'No new notes.')}</div>
          `).join('')}
        </div>
      </div>
    `).join('');
    node.innerHTML = sectionHtml || lines.map((item) => `
      <div class="foundersRecapItem">
        <strong>Event #${htmlEscape(String(item.eventId || item.seq))}</strong>
        <div class="small">${htmlEscape(item.line)}</div>
      </div>
    `).join('');
  }

  function renderQuest(state) {
    const currentGoal = state?.currentGoal || state?.quest || {};
    setText('questTitle', currentGoal.title || state?.quest?.title || 'Set the first productive district');
    setText('questBody', currentGoal.body || state?.quest?.body || 'Choose a meaningful next step for the settlement.');
    setText('goalOwnerBadge', prettyGoalOwner(currentGoal.owner));
    setQuestStatus(`${state?.recap?.unseenCount || 0} unseen recap lines · ${state?.foreman?.pendingApprovals?.length || 0} pending approvals`);

    const cta = document.getElementById('questCtaBtn');
    if (!cta) return;
    const action = currentGoal.primaryAction && typeof currentGoal.primaryAction === 'object'
      ? currentGoal.primaryAction
      : (state?.quest?.primaryAction && typeof state.quest.primaryAction === 'object' ? state.quest.primaryAction : null);
    const label = (() => {
      if (!action) return 'No action available';
      if (action.type === 'PLACE_BUILDING') return `Place ${BUILDING_LABELS[action.buildingType] || action.buildingType}`;
      if (action.type === 'QUEUE_JOB') return 'Queue the first job';
      if (action.type === 'COLLECT_OUTPUTS') return 'Collect outputs';
      if (action.type === 'UPGRADE_HQ') return 'Upgrade Headquarters';
      if (action.type === 'UPGRADE_LANDMARK') return 'Raise the Welcome Sign';
      if (action.type === 'ENABLE_PERMISSION') return 'Enable permission';
      if (action.type === 'TURN_IN_CONTRACT') return 'Turn in contract';
      if (action.type === 'VIEW_CONTRACT_BOARD') return 'Open Contract Board';
      if (action.type === 'RESOLVE_APPROVAL') return 'Review approval';
      if (action.type === 'QUEUE_BEST_JOB') return 'Queue best job';
      return 'Continue';
    })();
    cta.textContent = label;
    cta.disabled = pendingAction || !action;
    cta.onclick = async () => {
      if (!action) return;
      try {
        if (action.type === 'PLACE_BUILDING') {
          const pad = emptyPadFromSelection() || firstEmptyPad();
          if (!pad) {
            setStatusLine('No open pad is available.');
            return;
          }
          selectedKey = `pad:${pad.x},${pad.y}`;
          await runTool('et.plot.place_building', {
            type: action.buildingType,
            x: pad.x,
            y: pad.y,
            idempotencyKey: `quest-place:${action.buildingType}:${pad.x}:${pad.y}:${Date.now()}`
          });
          return;
        }
        if (action.type === 'QUEUE_JOB' && action.buildingId) {
          await runTool('et.plot.queue_job', {
            buildingId: action.buildingId,
            idempotencyKey: `quest-queue:${action.buildingId}:${Date.now()}`
          });
          return;
        }
        if (action.type === 'COLLECT_OUTPUTS' && action.buildingId) {
          await runTool('et.plot.collect_outputs', {
            buildingId: action.buildingId,
            idempotencyKey: `quest-collect:${action.buildingId}:${Date.now()}`
          });
          return;
        }
        if (action.type === 'UPGRADE_HQ') {
          await runTool('et.plot.upgrade_building', {
            idempotencyKey: `quest-upgrade-hq:${Date.now()}`
          });
          return;
        }
        if (action.type === 'UPGRADE_LANDMARK' && action.landmarkId) {
          await runTool('et.plot.town.upgrade_landmark', {
            landmarkId: action.landmarkId,
            idempotencyKey: `quest-landmark:${action.landmarkId}:${Date.now()}`
          });
          return;
        }
        if (action.type === 'ENABLE_PERMISSION' && action.permission) {
          await updatePolicy(action.permission, true);
          return;
        }
        if (action.type === 'TURN_IN_CONTRACT' && action.contractId) {
          await turnInContract(action.contractId);
          return;
        }
        if (action.type === 'VIEW_CONTRACT_BOARD') {
          focusPanel('contractBoard');
          setStatusLine('Contract Board is ready.');
          return;
        }
        if (action.type === 'RESOLVE_APPROVAL') {
          focusPanel('approvalsList');
          setStatusLine('An approval is waiting for your decision.');
          return;
        }
        if (action.type === 'QUEUE_BEST_JOB') {
          const candidate = (state.buildings || []).find((building) => (
            building.type !== 'HQ'
            && building.state === 'READY'
            && !building.runningJob
            && (!building.completedJobs || building.completedJobs.length === 0)
          ));
          if (!candidate) {
            setStatusLine('No ready building is available for a new job.');
            return;
          }
          await runTool('et.plot.queue_job', {
            buildingId: candidate.buildingId,
            idempotencyKey: `quest-queue:${candidate.buildingId}:${Date.now()}`
          });
        }
      } catch {
        // status line already updated
      }
    };
  }

  function renderProgress(state) {
    const progress = state?.progress?.next || null;
    setText('hqLevelValue', String(state?.progress?.currentLevel || state?.plot?.hqLevel || 1));
    const fill = document.getElementById('hqLevelFill');
    if (fill) {
      fill.style.width = `${Math.round((progress?.ratio || 0) * 100)}%`;
    }
    if (progress) {
      setText('hqProgressText', `${progress.xpCurrent} / ${progress.xpRequired} XP`);
    } else {
      setText('hqProgressText', 'Phase 1 complete');
    }
  }

  function renderAll() {
    const state = stateData();
    if (!state) return;
    document.title = `Agent Town — Founders Plot (HQ ${state.progress?.currentLevel || state.plot?.hqLevel || 1})`;
    renderProgress(state);
    renderInventory(state);
    renderBoard(state);
    renderQuest(state);
    renderSelection(state);
    renderContracts(state);
    renderSignals(state);
    renderLandmark(state);
    renderForeman(state);
    renderPermissions(state);
    renderApprovals(state);
    renderRewards(state);
    renderQueue(state);
    renderJournal(state);
    renderRecap(state);
  }

  async function loadState() {
    try {
      const payload = await api('/api/founders-plot/state');
      currentState = payload;
      await syncWorkerScheduler(payload?.state || null);
      const quest = payload?.state?.quest?.title || 'Settlement ready.';
      setStatusLine(`Plot synchronized. ${quest}`);
      renderAll();
      return payload;
    } catch (error) {
      setStatusLine(`Could not load the plot: ${error.message}.`);
      throw error;
    }
  }

  async function loadRecap() {
    try {
      const payload = await api('/api/founders-plot/recap');
      if (currentState?.state) {
        currentState.state.recap = {
          ...(currentState.state.recap || {}),
          unseenCount: payload.recap?.unseenCount || 0,
          lines: Array.isArray(payload.recap?.lines) ? payload.recap.lines : [],
          sections: Array.isArray(payload.recap?.sections) ? payload.recap.sections : []
        };
        renderRecap(currentState.state);
      }
    } catch {
      // ignore recap refresh failures
    }
  }

  async function markRecapRead() {
    try {
      await api('/api/founders-plot/recap/read', {
        method: 'POST',
        body: JSON.stringify({})
      });
      await loadState();
    } catch (error) {
      setStatusLine(`Could not mark recap read: ${error.message}.`);
    }
  }

  async function advanceForTest(ms) {
    const payload = await api('/__test__/founders-plot/advance', {
      method: 'POST',
      body: JSON.stringify({ ms })
    });
    currentState = { ok: true, state: payload.state };
    renderAll();
    return payload;
  }

  async function startForemanRuntime() {
    const gateway = await initGateway();
    if (gateway && typeof gateway.foundersPlotSchedulerStop === 'function') {
      await gateway.foundersPlotSchedulerStop({ reason: 'RUNTIME_RESTART' }).catch(() => null);
    }
    foremanRuntimeToken = '';
    localForemanRuntimeId = '';
    workerSchedulerStatus = normalizeWorkerSchedulerStatus();
    let skillLoaded = false;
    let toolsLoaded = false;
    let goalsLoaded = false;

    if (gateway && typeof gateway.visitExperience === 'function') {
      const visit = await gateway.visitExperience({ url: '/experiences/founders-plot/skill.md' }).catch(() => null);
      skillLoaded = !!visit?.ok;
    }
    try {
      const toolsText = await apiText('/experiences/founders-plot/tools.md');
      toolsLoaded = typeof toolsText === 'string' && toolsText.includes('Founders Plot Tool Surface');
    } catch {
      toolsLoaded = false;
    }
    try {
      const goalsText = await apiText('/experiences/founders-plot/goals.md');
      goalsLoaded = typeof goalsText === 'string' && goalsText.includes('Founders Plot Goals');
    } catch {
      goalsLoaded = false;
    }

    const payload = await api('/api/founders-plot/foreman/session/start', {
      method: 'POST',
      body: JSON.stringify({
        pack: {
          skillLoaded,
          toolsLoaded,
          goalsLoaded
        }
      })
    });
    foremanRuntimeToken = String(payload?.runtime?.token || '');
    localForemanRuntimeId = String(payload?.runtime?.runtimeId || '');
    await loadState();
    return payload;
  }

  async function heartbeatForemanRuntime() {
    const payload = await foremanApi('/api/founders-plot/foreman/session/heartbeat', {
      method: 'POST',
      body: JSON.stringify({})
    });
    await loadState();
    return payload;
  }

  async function pauseForemanRuntime() {
    const payload = await foremanApi('/api/founders-plot/foreman/session/pause', {
      method: 'POST',
      body: JSON.stringify({})
    });
    await stopWorkerScheduler('HUMAN_PAUSED');
    await loadState();
    return payload;
  }

  async function getForemanObservation() {
    return await foremanApi('/api/founders-plot/foreman/observation', {
      method: 'GET'
    });
  }

  async function enableCollectReadyOutputs() {
    const response = await api('/api/founders-plot/tool/et.foreman.scheduler.enable_collect_ready_outputs', {
      method: 'POST',
      body: JSON.stringify({
        idempotencyKey: `scheduler-enable:${Date.now()}`
      })
    });
    currentState = { ok: true, state: response.data?.state || response.state || currentState?.state || null };
    await syncWorkerScheduler(currentState?.state || null);
    renderAll();
    return {
      ok: true,
      scheduler: response.data?.scheduler || response.scheduler || null
    };
  }

  async function getSchedulerStatus() {
    const payload = await api('/api/founders-plot/state');
    const local = await syncWorkerScheduler(payload?.state || null);
    return {
      ok: true,
      scheduler: payload?.state?.foreman?.scheduler || payload?.state?.scheduler || null,
      local
    };
  }

  async function runForemanTick() {
    const runtimeLocal = localForemanRuntimeStatus(currentState?.state?.foreman?.runtime || {});
    if (!runtimeLocal.actionable) {
      return {
        ok: true,
        result: { mutationApplied: false },
        receipt: currentState?.state?.foreman?.receipt || null
      };
    }
    const gateway = await initGateway();
    if (!gateway || typeof gateway.foundersPlotForemanTick !== 'function') {
      throw new Error('FOREMAN_WORKER_UNAVAILABLE');
    }
    let payload;
    try {
      payload = await gateway.foundersPlotForemanTick({
        token: foremanRuntimeToken
      });
    } catch (error) {
      if (error?.message === 'STALE_RUNTIME' || error?.message === 'FOREMAN_RUNTIME_REQUIRED') {
        foremanRuntimeToken = '';
        localForemanRuntimeId = '';
        await stopWorkerScheduler('ERROR');
      }
      await loadState().catch(() => null);
      if (error?.message === 'STALE_RUNTIME' || error?.message === 'FOREMAN_RUNTIME_REQUIRED') {
        return {
          ok: true,
          result: { mutationApplied: false },
          receipt: currentState?.state?.foreman?.receipt || null
        };
      }
      throw error;
    }
    await loadState();
    return payload;
  }

  async function applyReceiptCorrection(correction) {
    const payload = await api('/api/founders-plot/foreman/receipt/correction', {
      method: 'POST',
      body: JSON.stringify({ correction })
    });
    currentState = { ok: true, state: payload.state };
    await syncWorkerScheduler(currentState?.state || null);
    renderAll();
    return payload;
  }

  async function stopWorkerScheduler(reason = 'HUMAN_PAUSED') {
    const gateway = await initGateway().catch(() => null);
    if (!gateway || typeof gateway.foundersPlotSchedulerStop !== 'function') {
      workerSchedulerStatus = normalizeWorkerSchedulerStatus({
        active: false,
        lastStatus: 'STOPPED',
        lastStopReason: reason
      });
      return workerSchedulerStatus;
    }
    const status = await gateway.foundersPlotSchedulerStop({ reason }).catch(() => null);
    workerSchedulerStatus = normalizeWorkerSchedulerStatus(status || {
      active: false,
      lastStatus: 'STOPPED',
      lastStopReason: reason
    });
    return workerSchedulerStatus;
  }

  async function syncWorkerScheduler(state = null) {
    const serverState = state || stateData();
    const runtimeLocal = localForemanRuntimeStatus(serverState?.foreman?.runtime || {});
    const task = serverState?.foreman?.scheduler?.collectReadyOutputs || {};
    const shouldCheckWorker = runtimeLocal.hasServerRuntime || task.enabled === true || !!foremanRuntimeToken;
    if (!shouldCheckWorker) {
      workerSchedulerStatus = normalizeWorkerSchedulerStatus();
      return workerSchedulerStatus;
    }
    const gateway = await initGateway().catch(() => null);
    if (!gateway || typeof gateway.foundersPlotSchedulerStatus !== 'function') {
      workerSchedulerStatus = normalizeWorkerSchedulerStatus({
        active: false,
        lastStatus: 'ERROR',
        lastErrorCode: 'FOREMAN_WORKER_UNAVAILABLE'
      });
      return workerSchedulerStatus;
    }
    let nextStatus = await gateway.foundersPlotSchedulerStatus().catch((error) => ({
      active: false,
      lastStatus: 'ERROR',
      lastErrorCode: String(error?.message || 'FOREMAN_WORKER_UNAVAILABLE')
    }));
    const shouldBeActive = runtimeLocal.actionable && task.enabled === true && task.paused !== true;
    if (shouldBeActive && nextStatus?.active !== true) {
      nextStatus = await gateway.foundersPlotSchedulerStart({
        token: foremanRuntimeToken,
        taskKind: 'COLLECT_READY_OUTPUTS'
      }).catch((error) => ({
        active: false,
        lastStatus: String(error?.message || 'ERROR').toUpperCase() === 'STALE_RUNTIME' ? 'STALE' : 'ERROR',
        lastErrorCode: String(error?.message || 'FOUNDERS_PLOT_SCHEDULER_START_FAILED')
      }));
    } else if (!shouldBeActive && nextStatus?.active === true) {
      nextStatus = await gateway.foundersPlotSchedulerStop({
        reason: runtimeLocal.needsRestart ? 'RUNTIME_RESTART' : task.paused === true ? 'HUMAN_PAUSED' : 'ERROR'
      }).catch(() => ({
        active: false,
        lastStatus: 'STOPPED'
      }));
    }
    workerSchedulerStatus = normalizeWorkerSchedulerStatus(nextStatus);
    return workerSchedulerStatus;
  }

  function startPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(() => {
      if (document.hidden || pendingAction) return;
      loadState().catch(() => {});
    }, 5000);
  }

  function applyEmbedMode() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('embed') === '1') {
      document.documentElement.classList.add('founders-plot-embed');
    }
  }

  function bindUi() {
    const recapDrawer = document.getElementById('recapDrawer');
    if (recapDrawer) {
      recapDrawer.addEventListener('toggle', () => {
        if (recapDrawer.open) {
          loadRecap().catch(() => {});
        }
      });
    }
    const markRecapReadBtn = document.getElementById('markRecapReadBtn');
    if (markRecapReadBtn) {
      markRecapReadBtn.addEventListener('click', () => {
        markRecapRead();
      });
    }
  }

  window.__foundersPlotTest = {
    loadState,
    getState: () => currentState,
    getLocalForemanRuntimeStatus: () => localForemanRuntimeStatus(currentState?.state?.foreman?.runtime || {}),
    getWorkerSchedulerStatus: () => ({ ...workerSchedulerStatus }),
    runTool,
    updatePolicy,
    resolveApproval,
    claimReward,
    advance: advanceForTest,
    startForemanRuntime,
    heartbeatForemanRuntime,
    pauseForemanRuntime,
    getForemanObservation,
    enableCollectReadyOutputs,
    getSchedulerStatus,
    runForemanTick,
    applyReceiptCorrection
  };

  applyEmbedMode();
  bindUi();
  loadState().catch(() => {});
  startPolling();
})();
