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

  function renderForeman(state) {
    setText('foremanRecommendation', state.foreman?.recommendation || 'The foreman is waiting for a clear order.');
    const allowed = Array.isArray(state.foreman?.allowedTools) ? state.foreman.allowedTools.join(', ') : 'observation only';
    setText('foremanToolsLine', `Allowed tools: ${allowed}`);
  }

  function permissionConfig() {
    return [
      { key: 'observeAndSuggest', label: 'Observe + suggest', level: 1 },
      { key: 'collectOutputs', label: 'Collect outputs', level: 2 },
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
    setText('recapSummaryText', lines.length > 0 ? `${lines.length} recap lines ready.` : 'No new recap lines yet.');
    const node = document.getElementById('recapList');
    if (!node) return;
    if (lines.length === 0) {
      node.innerHTML = '<div class="foundersEmptyState">The plot has been quiet since your last visit.</div>';
      return;
    }
    node.innerHTML = lines.map((item) => `
      <div class="foundersRecapItem">
        <strong>#${htmlEscape(String(item.seq))}</strong>
        <div class="small">${htmlEscape(item.line)}</div>
      </div>
    `).join('');
  }

  function renderQuest(state) {
    const quest = state?.quest || {};
    setText('questTitle', quest.title || 'Set the first productive district');
    setText('questBody', quest.body || 'Choose a meaningful next step for the settlement.');
    setQuestStatus(`${state?.recap?.unseenCount || 0} unseen recap lines · ${state?.foreman?.pendingApprovals?.length || 0} pending approvals`);

    const cta = document.getElementById('questCtaBtn');
    if (!cta) return;
    const action = quest.primaryAction && typeof quest.primaryAction === 'object' ? quest.primaryAction : null;
    const label = (() => {
      if (!action) return 'No action available';
      if (action.type === 'PLACE_BUILDING') return `Place ${BUILDING_LABELS[action.buildingType] || action.buildingType}`;
      if (action.type === 'QUEUE_JOB') return 'Queue the first job';
      if (action.type === 'COLLECT_OUTPUTS') return 'Collect outputs';
      if (action.type === 'UPGRADE_HQ') return 'Upgrade Headquarters';
      if (action.type === 'ENABLE_PERMISSION') return 'Enable permission';
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
        if (action.type === 'ENABLE_PERMISSION' && action.permission) {
          await updatePolicy(action.permission, true);
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
    renderForeman(state);
    renderPermissions(state);
    renderApprovals(state);
    renderRewards(state);
    renderQueue(state);
    renderRecap(state);
  }

  async function loadState() {
    try {
      const payload = await api('/api/founders-plot/state');
      currentState = payload;
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
          lines: Array.isArray(payload.recap?.lines) ? payload.recap.lines : []
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
    runTool,
    updatePolicy,
    resolveApproval,
    claimReward,
    advance: advanceForTest
  };

  applyEmbedMode();
  bindUi();
  loadState().catch(() => {});
  startPolling();
})();
