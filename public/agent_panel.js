(() => {
  const PANEL_MINIMIZED_KEY = 'agentTown:panel:minimized';
  let gateway = null;
  let gatewayInitPromise = null;
  let gatewayListenersBound = false;

  function el(id) {
    return document.getElementById(id);
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
    node.textContent = text || 'Idle';
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
          <h3>Agent Comms</h3>
          <div class="status-indicator" id="agentStatus">Idle</div>
        </div>
        <button id="minimizeChatBtn" class="btn small" style="padding: 2px 8px; font-size: 12px;">□</button>
      </div>

      <div class="sidebar-content">
        <div id="chatTranscript" class="chat-box sidebar-chat"></div>

        <div class="chat-input-area">
          <input type="text" id="chatInput" class="pixel-input" placeholder="Message agent..." />
          <button id="sendChatBtn" class="btn primary small">Send</button>
        </div>

        <div class="divider"></div>
        <div class="logs-header">System Logs</div>
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
  }

  function setMinimized(minimized) {
    const panel = el('agentSidebar');
    if (!panel) return;
    panel.classList.toggle('minimized', !!minimized);
    syncMinimizeLabel();
    saveMinimizedPreference(!!minimized);
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
            setStatus(status || 'Idle');
          });
        }

        setStatus('Connected');
        return gateway;
      } catch (e) {
        appendAgentLog(`Gateway unavailable: ${e?.message || 'UNKNOWN'}`);
        setStatus('Offline');
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
      appendChatMessage('system', 'Agent gateway is unavailable on this page.');
      return;
    }

    try {
      await liveGateway.send({ type: 'chat', text });
    } catch (e) {
      appendChatMessage('system', `Failed to send: ${e?.message || 'UNKNOWN'}`);
    }
  }

  function bindPanel() {
    const panel = ensurePanelMarkup();
    if (!panel || panel.dataset.bound === '1') return;
    panel.dataset.bound = '1';

    setMinimized(loadMinimizedPreference());
    setStatus('Idle');

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
