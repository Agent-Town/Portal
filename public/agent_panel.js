(() => {
  const PanelI18n = window.AgentTownI18n || null;
  const isCeremonyEmbed = (
    window.__agentTownCeremonyEmbed === true
    || document.documentElement.classList.contains('ceremony-embed')
  );
  if (isCeremonyEmbed) return;

  const PANEL_MINIMIZED_KEY = 'agentTown:panel:minimized';
  let gateway = null;
  let gatewayInitPromise = null;
  let gatewayListenersBound = false;
  let panelLayoutObserver = null;
  let panelLayoutResizeBound = false;
  let panelLayoutDeferredSyncBound = false;

  function el(id) {
    return document.getElementById(id);
  }

  function tPanel(key, vars = {}) {
    if (!PanelI18n || typeof PanelI18n.t !== 'function') return key;
    const locale = String(document.documentElement.lang || 'en').trim() || 'en';
    return PanelI18n.t(key, vars, locale);
  }

  function loadMinimizedPreference() {
    try {
      const raw = localStorage.getItem(PANEL_MINIMIZED_KEY);
      if (raw === null) return true;
      return raw !== '0';
    } catch {
      return true;
    }
  }

  function saveMinimizedPreference(minimized) {
    try {
      localStorage.setItem(PANEL_MINIMIZED_KEY, minimized ? '1' : '0');
    } catch {
      // ignore storage errors
    }
  }

  function setStatus(text) {
    const node = el('agentStatus');
    if (!node) return;
    node.textContent = text || tPanel('agent.panel.status.idle');
  }

  function syncPanelLayout(panel = null) {
    const root = document.documentElement;
    const body = document.body;
    const dock = panel || el('agentSidebar');
    if (!root || !body) return;
    if (!dock || dock.classList.contains('is-hidden')) {
      root.style.setProperty('--agent-panel-page-inset', '0px');
      body.classList.remove('agent-panel-expanded');
      return;
    }
    const insetPx = Math.max(0, Math.round(dock.getBoundingClientRect().height || 0));
    root.style.setProperty('--agent-panel-page-inset', `${insetPx}px`);
    body.classList.toggle('agent-panel-expanded', !dock.classList.contains('minimized'));
  }

  function schedulePanelLayoutSync(panel = null) {
    const dock = panel || el('agentSidebar');
    if (!dock) return;
    const run = () => syncPanelLayout(dock);
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(run);
      return;
    }
    setTimeout(run, 0);
  }

  function bindPanelLayout(panel) {
    if (!panel) return;
    syncPanelLayout(panel);
    schedulePanelLayoutSync(panel);
    setTimeout(() => schedulePanelLayoutSync(panel), 50);
    setTimeout(() => schedulePanelLayoutSync(panel), 250);
    if (typeof ResizeObserver === 'function') {
      if (!panelLayoutObserver) {
        panelLayoutObserver = new ResizeObserver(() => {
          syncPanelLayout(panel);
        });
      } else {
        panelLayoutObserver.disconnect();
      }
      panelLayoutObserver.observe(panel);
    }
    if (!panelLayoutResizeBound) {
      panelLayoutResizeBound = true;
      window.addEventListener('resize', () => {
        syncPanelLayout(panel);
      });
    }
    if (!panelLayoutDeferredSyncBound) {
      panelLayoutDeferredSyncBound = true;
      window.addEventListener('load', () => {
        schedulePanelLayoutSync(panel);
      }, { once: true });
      if (document.fonts && typeof document.fonts.ready?.then === 'function') {
        document.fonts.ready
          .then(() => {
            schedulePanelLayoutSync(panel);
          })
          .catch(() => {});
      }
    }
  }

  function appendChatMessage(role, text) {
    const box = el('chatTranscript');
    if (!box) return;
    const line = document.createElement('div');
    line.className = `chat-message ${role}`;
    line.textContent = String(text || '');
    box.appendChild(line);
    box.scrollTop = box.scrollHeight;
  }

  function appendAgentLog(text) {
    const box = el('agentLogs');
    if (!box) return;
    const line = document.createElement('div');
    line.textContent = `> ${String(text || '')}`;
    box.appendChild(line);
    box.scrollTop = box.scrollHeight;
  }

  function ensurePanelMarkup() {
    let panel = el('agentSidebar');
    if (panel) return panel;

    panel = document.createElement('div');
    panel.id = 'agentSidebar';
    panel.className = 'agent-sidebar minimized';
    panel.setAttribute('data-testid', 'agent-panel');
    panel.innerHTML = `
      <div class="sidebar-header">
        <div style="display:flex; align-items:center; gap:8px;">
          <h3 id="agentPanelTitle">${tPanel('agent.panel.title')}</h3>
          <div class="status-indicator" id="agentStatus">${tPanel('agent.panel.status.idle')}</div>
        </div>
        <button id="minimizeChatBtn" class="btn small" style="padding: 2px 8px; font-size: 12px;" aria-label="${tPanel('agent.panel.debug.minimize')}" title="${tPanel('agent.panel.debug.minimize')}">□</button>
      </div>

      <div class="sidebar-content">
        <div id="chatTranscript" class="chat-box sidebar-chat"></div>

        <div class="chat-input-area">
          <input type="text" id="chatInput" class="pixel-input" placeholder="${tPanel('agent.panel.chat_placeholder')}" />
          <button id="sendChatBtn" class="btn primary small">${tPanel('agent.panel.send')}</button>
          <button id="newSessionBtn" class="btn small" type="button" data-testid="agent-new-session">${tPanel('agent.panel.new_session')}</button>
          <button id="agentOpenTrainerBtn" class="btn small" type="button" data-testid="agent-open-trainer">${tPanel('agent.panel.trainer')}</button>
        </div>

        <div class="divider"></div>
        <div class="logs-header" id="agentLogsHeader">${tPanel('agent.panel.system_logs')}</div>
        <div id="agentLogs" class="logs-box sidebar-logs"></div>
      </div>
    `;
    document.body.appendChild(panel);
    return panel;
  }

  function syncMinimizeLabel() {
    const panel = el('agentSidebar');
    const btn = el('minimizeChatBtn');
    if (!panel || !btn) return;
    btn.textContent = panel.classList.contains('minimized') ? '□' : '_';
    const nextTitle = panel.classList.contains('minimized')
      ? tPanel('agent.panel.debug.expand')
      : tPanel('agent.panel.debug.minimize');
    btn.title = nextTitle;
    btn.setAttribute('aria-label', nextTitle);
  }

  function setMinimized(minimized) {
    const panel = el('agentSidebar');
    if (!panel) return;
    panel.classList.toggle('minimized', !!minimized);
    syncMinimizeLabel();
    saveMinimizedPreference(!!minimized);
    syncPanelLayout(panel);
    schedulePanelLayoutSync(panel);
  }

  async function initGateway() {
    if (gateway) return gateway;
    if (gatewayInitPromise) return gatewayInitPromise;

    gatewayInitPromise = (async () => {
      try {
        const mod = await import('/openclaw-lite/gateway.js');
        gateway = mod.default || mod;
        if (gateway instanceof Promise) {
          gateway = await gateway;
        }

        if (!gateway || typeof gateway.on !== 'function' || typeof gateway.send !== 'function') {
          throw new Error('GATEWAY_UNAVAILABLE');
        }

        if (!gatewayListenersBound) {
          gatewayListenersBound = true;
          gateway.on('message', (msg) => {
            const role = String(msg?.role || '').toLowerCase();
            if (role && role !== 'assistant') return;
            const text = typeof msg?.text === 'string' ? msg.text : JSON.stringify(msg);
            appendChatMessage('agent', text);
          });
          gateway.on('log', (entry) => {
            appendAgentLog(`[${entry?.level || 'info'}] ${entry?.message || ''}`);
          });
          gateway.on('status', (status) => {
            setStatus(status || tPanel('agent.panel.status.idle'));
          });
        }

        setStatus(tPanel('agent.panel.status.connected'));
        return gateway;
      } catch (e) {
        appendAgentLog(tPanel('agent.panel.log.gateway_unavailable', { message: e?.message || 'UNKNOWN' }));
        setStatus(tPanel('agent.panel.status.offline'));
        return null;
      } finally {
        gatewayInitPromise = null;
      }
    })();

    return gatewayInitPromise;
  }

  async function handleChat() {
    const input = el('chatInput');
    if (!input) return;
    const text = String(input.value || '').trim();
    if (!text) return;

    input.value = '';
    appendChatMessage('user', text);

    const liveGateway = await initGateway();
    if (!liveGateway) {
      appendChatMessage('system', tPanel('agent.panel.message.gateway_unavailable'));
      return;
    }

    try {
      await liveGateway.send({ type: 'chat', text });
    } catch (e) {
      appendChatMessage('system', tPanel('agent.panel.message.failed_to_send', { message: e?.message || 'UNKNOWN' }));
    }
  }

  async function handleNewSession() {
    const btn = el('newSessionBtn');
    if (btn) btn.disabled = true;

    try {
      const liveGateway = await initGateway();
      if (!liveGateway) {
        appendChatMessage('system', tPanel('agent.panel.message.gateway_unavailable'));
        return;
      }

      if (typeof liveGateway.clearTranscript === 'function') {
        await liveGateway.clearTranscript({ rotateSession: true, keepBootMessage: false });
      } else if (window.__openclawLiteTest && typeof window.__openclawLiteTest.clearTranscript === 'function') {
        await window.__openclawLiteTest.clearTranscript({ rotateSession: true, keepBootMessage: false });
      } else {
        throw new Error(tPanel('agent.panel.message.transcript_reset_unavailable'));
      }

      const box = el('chatTranscript');
      if (box) box.innerHTML = '';
      appendChatMessage('system', tPanel('agent.panel.message.new_session_started'));
      appendAgentLog(tPanel('agent.panel.log.new_session_started'));
    } catch (e) {
      const msg = e?.message || 'UNKNOWN';
      const failure = tPanel('agent.panel.message.new_session_failed', { message: msg });
      appendChatMessage('system', failure);
      appendAgentLog(failure);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function bindPanel() {
    const panel = ensurePanelMarkup();
    if (!panel || panel.dataset.bound === '1') return;
    panel.dataset.bound = '1';

    setMinimized(loadMinimizedPreference());
    bindPanelLayout(panel);
    setStatus(tPanel('agent.panel.status.idle'));

    const header = panel.querySelector('.sidebar-header');
    if (header) {
      header.addEventListener('click', () => {
        const isMinimized = panel.classList.contains('minimized');
        setMinimized(!isMinimized);
      });
    }

    const sendBtn = el('sendChatBtn');
    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        handleChat().catch(() => {});
      });
    }

    const newSessionBtn = el('newSessionBtn');
    if (newSessionBtn) {
      newSessionBtn.addEventListener('click', () => {
        handleNewSession().catch(() => {});
      });
    }

    const openTrainerBtn = el('agentOpenTrainerBtn');
    if (openTrainerBtn) {
      openTrainerBtn.addEventListener('click', () => {
        if (typeof window.openExperienceTrainerModal === 'function') {
          Promise.resolve(window.openExperienceTrainerModal()).catch(() => {
            window.location.assign('/trainer');
          });
          return;
        }
        window.location.assign('/trainer');
      });
    }

    const chatInput = el('chatInput');
    if (chatInput) {
      chatInput.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        handleChat().catch(() => {});
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindPanel, { once: true });
  } else {
    bindPanel();
  }
})();
