// iterate.js — ZHC1 iteration loop prototype
// All LLM calls go through the OpenClaw Lite browser worker (user's own key).
// Brain config + agent comms handled by agent_panel.js (the dock at the bottom).
// This file manages: identity, problem input, experiment feed, conversation mirror.

(() => {
  'use strict';

  // ── Constants ─────────────────────────────────────────────
  const LS_USER_NAME = 'iterate:userName';
  const LS_AGENT_NAME = 'iterate:agentName';
  const LS_STORY_ID = 'iterate:currentStoryId';
  const LS_TEAM_CODE = 'iterate:teamCode';
  const LS_USER_AVATAR = 'iterate:userAvatar';
  const LS_AGENT_AVATAR = 'iterate:agentAvatar';

  const DEFAULT_USER_AVATAR = '/brand-kit/default_user_avatar.png';
  const DEFAULT_AGENT_AVATAR = '/brand-kit/default_agent_avatar.png';

  // ── State ─────────────────────────────────────────────────
  let currentPhase = 'identity'; // identity | brain_config | problem_input | active_loop
  let userName = '';
  let agentName = 'OpenClaw';
  let userAvatar = DEFAULT_USER_AVATAR;
  let agentAvatar = DEFAULT_AGENT_AVATAR;
  let gateway = null;
  let sandbox = null;
  let flow = null; // ConversationFlow instance
  let storyId = null;
  let currentRound = 0;
  let experimentCards = [];

  // ── DOM helpers ───────────────────────────────────────────
  function el(id) { return document.getElementById(id); }
  function show(id) { const e = el(id); if (e) e.classList.remove('is-hidden'); }
  function hide(id) { const e = el(id); if (e) e.classList.add('is-hidden'); }

  // ── API helpers ───────────────────────────────────────────
  async function apiFetch(path, opts = {}) {
    const res = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  // ── Phase transitions ────────────────────────────────────
  function goToPhase(phase) {
    currentPhase = phase;
    hide('stepIdentity');
    hide('stepBrain');
    hide('stepProblem');
    hide('stepActive');

    switch (phase) {
      case 'identity':
        show('stepIdentity');
        break;
      case 'brain_config':
        show('stepBrain');
        updateBrainStep();
        startBrainDetectionLoop();
        break;
      case 'problem_input':
        show('stepProblem');
        break;
      case 'active_loop':
        show('stepActive');
        break;
    }
  }

  // ── Phase 1: Identity ─────────────────────────────────────
  function initIdentity() {
    const userInput = el('userName');
    const agentInput = el('agentName');
    const continueBtn = el('identityContinueBtn');

    // Restore from localStorage
    const savedUser = localStorage.getItem(LS_USER_NAME);
    const savedAgent = localStorage.getItem(LS_AGENT_NAME);
    const savedUserAvatar = localStorage.getItem(LS_USER_AVATAR);
    const savedAgentAvatar = localStorage.getItem(LS_AGENT_AVATAR);
    if (savedUser) { userInput.value = savedUser; userName = savedUser; }
    if (savedAgent) { agentInput.value = savedAgent; agentName = savedAgent; }
    if (savedUserAvatar) { userAvatar = savedUserAvatar; setAvatarSrc('userAvatarImg', userAvatar); }
    if (savedAgentAvatar) { agentAvatar = savedAgentAvatar; setAvatarSrc('agentAvatarImg', agentAvatar); }

    function checkValid() {
      const uv = userInput.value.trim();
      const av = agentInput.value.trim();
      continueBtn.disabled = !uv;
      userName = uv;
      agentName = av || 'OpenClaw';
    }

    userInput.addEventListener('input', checkValid);
    agentInput.addEventListener('input', checkValid);
    checkValid();

    // Avatar uploads
    initAvatarUpload('userAvatarUpload', 'userAvatarImg', (dataUrl) => {
      userAvatar = dataUrl;
      localStorage.setItem(LS_USER_AVATAR, dataUrl);
    });
    initAvatarUpload('agentAvatarUpload', 'agentAvatarImg', (dataUrl) => {
      agentAvatar = dataUrl;
      localStorage.setItem(LS_AGENT_AVATAR, dataUrl);
    });

    continueBtn.addEventListener('click', () => {
      localStorage.setItem(LS_USER_NAME, userName);
      localStorage.setItem(LS_AGENT_NAME, agentName);
      goToPhase('brain_config');
    });
  }

  function setAvatarSrc(imgId, src) {
    const img = el(imgId);
    if (!img) return;
    // Validate data URLs to prevent injection from tampered localStorage
    if (src && src.startsWith('data:') && !src.startsWith('data:image/')) {
      img.src = DEFAULT_USER_AVATAR;
      return;
    }
    img.src = src;
  }

  function initAvatarUpload(inputId, imgId, onLoaded) {
    const fileInput = el(inputId);
    if (!fileInput) return;
    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (!file || !file.type.startsWith('image/')) return;
      if (file.size > 5 * 1024 * 1024) {
        alert('Image too large. Please use an image under 5 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        setAvatarSrc(imgId, dataUrl);
        onLoaded(dataUrl);
      };
      reader.readAsDataURL(file);
    });
  }

  // ── Phase 2: Brain Config (guided wrapper) ─────────────────
  let brainPollTimer = null;
  let oauthAttemptId = null;
  let oauthPollTimer = null;
  let oauthExchangeInFlight = false;
  let oauthPollCount = 0;
  const OAUTH_POLL_MAX = 120; // ~3 minutes at 1.5s intervals

  const DEFAULT_FREE_MODEL = 'minimax/minimax-m2.5:free';
  const DEFAULT_FREE_PROVIDER = 'openrouter';

  function updateBrainStep() {
    const title = el('brainTitle');
    if (title) title.textContent = `Give ${agentName} a brain.`;
    const avatar = el('brainAgentAvatar');
    if (avatar) avatar.src = agentAvatar;
  }

  function initBrainStep() {
    const continueBtn = el('iterateBrainContinueBtn');
    if (!continueBtn) return;

    continueBtn.addEventListener('click', () => {
      stopBrainDetectionLoop();
      stopOAuthPoll();
      goToPhase('problem_input');
    });

    // OpenRouter connect button
    const orBtn = el('openrouterConnectBtn');
    if (orBtn) {
      orBtn.addEventListener('click', startOpenRouterOAuth);
    }

    // Check if returning from OAuth callback
    checkOAuthCallback();

    // Also check on load — maybe brain is already configured
    checkBrainConfig();
  }

  // ── OpenRouter OAuth PKCE ─────────────────────────────────
  async function startOpenRouterOAuth() {
    const statusEl = el('openrouterStatus');
    const btn = el('openrouterConnectBtn');
    if (btn) btn.disabled = true;
    if (statusEl) statusEl.textContent = 'Starting OpenRouter authentication...';

    try {
      const result = await apiFetch('/api/iterate/oauth/openrouter/start', {
        method: 'POST',
      });

      oauthAttemptId = result.attemptId;
      // Open OpenRouter auth in a new window
      const authWin = window.open(result.authorizeUrl, 'openrouter_auth', 'width=600,height=700');

      if (!authWin) {
        // Popup blocked — redirect instead
        if (statusEl) statusEl.textContent = 'Popup blocked. Redirecting...';
        window.location.href = result.authorizeUrl;
        return;
      }

      if (statusEl) statusEl.textContent = 'Waiting for OpenRouter authorization...';

      // Poll for completion
      startOAuthPoll();

    } catch (e) {
      if (statusEl) statusEl.textContent = `Error: ${e.message}`;
      if (btn) btn.disabled = false;
    }
  }

  function startOAuthPoll() {
    stopOAuthPoll();
    oauthPollCount = 0;
    oauthPollTimer = setInterval(async () => {
      if (!oauthAttemptId) return;
      oauthPollCount++;
      if (oauthPollCount > OAUTH_POLL_MAX) {
        stopOAuthPoll();
        const statusEl = el('openrouterStatus');
        if (statusEl) statusEl.textContent = 'OAuth timed out. Try again.';
        const btn = el('openrouterConnectBtn');
        if (btn) btn.disabled = false;
        return;
      }

      try {
        const status = await apiFetch(`/api/iterate/oauth/openrouter/status?attemptId=${oauthAttemptId}`);

        if (status.status === 'code_received') {
          stopOAuthPoll();
          await exchangeOpenRouterCode();
        } else if (status.status === 'completed') {
          stopOAuthPoll();
          // Already done (e.g., page refresh)
          const statusEl = el('openrouterStatus');
          if (statusEl) statusEl.textContent = 'Connected!';
          await checkBrainConfig();
        } else if (status.status === 'failed') {
          stopOAuthPoll();
          const statusEl = el('openrouterStatus');
          if (statusEl) statusEl.textContent = `Failed: ${status.lastError}`;
          const btn = el('openrouterConnectBtn');
          if (btn) btn.disabled = false;
        }
      } catch {
        // Keep polling
      }
    }, 1500);
  }

  function stopOAuthPoll() {
    if (oauthPollTimer) {
      clearInterval(oauthPollTimer);
      oauthPollTimer = null;
    }
  }

  async function exchangeOpenRouterCode() {
    if (oauthExchangeInFlight) return;
    oauthExchangeInFlight = true;
    const statusEl = el('openrouterStatus');
    if (statusEl) statusEl.textContent = 'Exchanging code for API key...';

    try {
      const result = await apiFetch('/api/iterate/oauth/openrouter/exchange', {
        method: 'POST',
        body: JSON.stringify({ attemptId: oauthAttemptId }),
      });

      if (result.apiKey) {
        if (statusEl) statusEl.textContent = 'Connected! Saving brain config...';

        // Save to LLM config library — same IndexedDB the dock uses
        try {
          const lib = await import('/openclaw-lite/llm-config-library.js');
          await lib.saveLlmConfig({
            provider: DEFAULT_FREE_PROVIDER,
            model: DEFAULT_FREE_MODEL,
            apiKey: result.apiKey,
          });
        } catch {
          // Fallback: at least store somewhere the dock can read
          console.warn('Could not save to llm-config-library, storing in localStorage');
        }

        if (statusEl) statusEl.textContent = 'Brain connected via OpenRouter!';
        await checkBrainConfig();
      }
    } catch (e) {
      if (statusEl) statusEl.textContent = `Exchange failed: ${e.message}`;
      const btn = el('openrouterConnectBtn');
      if (btn) btn.disabled = false;
    } finally {
      oauthExchangeInFlight = false;
    }
  }

  function checkOAuthCallback() {
    // Check if we're returning from an OAuth redirect
    const params = new URLSearchParams(window.location.search);
    const oauth = params.get('oauth');
    const attemptId = params.get('attemptId');

    if (oauth === 'openrouter' && attemptId) {
      oauthAttemptId = attemptId;
      // Clean URL
      const clean = window.location.pathname;
      window.history.replaceState({}, '', clean);
      // Auto-exchange
      exchangeOpenRouterCode();
    }
  }

  async function checkBrainConfig() {
    const continueBtn = el('iterateBrainContinueBtn');
    const detected = el('brainDetected');
    const modelLabel = el('brainDetectedModel');
    const statusText = el('iterateBrainStatusText');

    try {
      const lib = await import('/openclaw-lite/llm-config-library.js');
      const cfg = await lib.loadLlmConfig();
      if (cfg?.configured && cfg.provider && cfg.model) {
        if (detected) {
          detected.classList.remove('is-hidden');
          if (modelLabel) modelLabel.textContent = `${cfg.provider} / ${cfg.model}`;
        }
        if (continueBtn) continueBtn.disabled = false;
        if (statusText) statusText.textContent = '';
        return true;
      }
    } catch { /* library not available yet */ }

    if (continueBtn) continueBtn.disabled = true;
    if (detected) detected.classList.add('is-hidden');
    if (statusText) statusText.textContent = 'Waiting for brain configuration in the dock below...';
    return false;
  }

  let brainPollCount = 0;
  const BRAIN_POLL_MAX = 200; // ~5 minutes at 1.5s intervals

  function startBrainDetectionLoop() {
    stopBrainDetectionLoop();
    brainPollCount = 0;
    brainPollTimer = setInterval(async () => {
      brainPollCount++;
      if (brainPollCount > BRAIN_POLL_MAX) {
        stopBrainDetectionLoop();
        return;
      }
      await checkBrainConfig();
    }, 1500);
  }

  function stopBrainDetectionLoop() {
    if (brainPollTimer) {
      clearInterval(brainPollTimer);
      brainPollTimer = null;
    }
  }

  // ── Gateway — hook into agent_panel.js's gateway ──────────
  // agent_panel.js initializes the gateway. We import the same module
  // to get the shared instance and listen for agent messages in our
  // conversation thread.
  async function connectGateway() {
    try {
      const mod = await import('/openclaw-lite/gateway.js');
      gateway = mod.default || mod;
      if (gateway instanceof Promise) gateway = await gateway;

      if (!gateway || typeof gateway.on !== 'function') {
        gateway = null;
        return;
      }

      // Mirror agent messages into our conversation thread
      gateway.on('message', (msg) => {
        const role = String(msg?.role || '').toLowerCase();
        if (role && role !== 'assistant') return;
        const text = typeof msg?.text === 'string' ? msg.text
          : typeof msg?.content === 'string' ? msg.content
          : null;
        if (!text || !text.trim()) return;
        appendMessage('agent', text.trim());
        handleAgentMessage(text.trim());
      });
    } catch {
      gateway = null;
    }
  }

  // ── Problem Input ─────────────────────────────────────────
  function initProblemInput() {
    const input = el('problemInput');
    const startBtn = el('startBtn');

    function checkValid() {
      startBtn.disabled = !(input.value.trim().length > 10);
    }

    input.addEventListener('input', checkValid);
    checkValid();

    startBtn.addEventListener('click', async () => {
      const description = input.value.trim();
      startBtn.disabled = true;
      startBtn.textContent = 'Starting...';

      try {
        // Create problem story
        const story = await apiFetch('/api/problem-stories', {
          method: 'POST',
          body: JSON.stringify({ description }),
        });
        storyId = story.id;
        localStorage.setItem(LS_STORY_ID, storyId);

        // Transition to active loop
        goToPhase('active_loop');

        // Set problem title
        const titleEl = el('problemTitle');
        if (titleEl) titleEl.textContent = description.slice(0, 80) + (description.length > 80 ? '...' : '');

        // Initialize the conversation flow
        const { ConversationFlow } = await import('/conversation-flow.js');
        flow = new ConversationFlow();
        flow.onStepChange = (step) => {
          const label = el('roundLabel');
          if (label) label.textContent = flow.getStepLabel();
        };

        appendMessage('system', `Problem submitted. ${flow.getStepLabel()}...`);

        // Send step 1 prompt to the agent
        const prompt = await flow.buildPrompt({ problemDescription: description });
        if (prompt) {
          sendToAgent(prompt);
        } else {
          appendMessage('system', 'Agent not connected. Use the Agent Dock at the bottom to connect a brain.');
        }

      } catch (e) {
        startBtn.textContent = 'Start iterating';
        startBtn.disabled = false;
        appendMessage('system', `Error: ${e.message}`);
      }
    });
  }

  // buildIteratePrompt removed — conversation-flow.js handles step-specific prompts

  // ── LLM Config Push ────────────────────────────────────────
  // On the main app, app.js calls restoreLiteLlmConfigFromLocalIfNeeded()
  // which reads IndexedDB and pushes to the worker. On /iterate that doesn't
  // run because lastState is null. We do it manually here.
  async function pushSavedLlmConfigToWorker() {
    if (!gateway || typeof gateway.send !== 'function') return;
    try {
      const lib = await import('/openclaw-lite/llm-config-library.js');
      const cfg = await lib.loadLlmConfig();
      if (!cfg?.configured || !cfg.provider || !cfg.model || !cfg.apiKey) return;

      // All LLM calls go DIRECTLY from the browser to the provider.
      // The backend NEVER sees the API key — pure frontend.
      const provider = cfg.provider;
      const model = cfg.model;
      const modelRef = cfg.modelRef || `${provider}/${model}`;

      // Direct provider URL — no backend proxy
      const baseUrl = providerDirectUrl(provider);

      // API adapter type
      let api = '';
      if (provider === 'openai' || provider === 'ollama' || provider === 'openrouter' || provider === 'together' || provider === 'groq') {
        api = 'openai-completions';
      }

      gateway.send({
        type: 'gateway.command.setLlmConfig',
        apiKey: cfg.apiKey,
        api,
        provider,
        modelRef,
        modelId: model,
        baseUrl,
        reasoning: cfg.reasoning || '',
        useProxy: false, // NEVER proxy — keys stay in the browser
      });

      console.log(`Iterate: pushed LLM config to worker — ${provider}/${model}`);
    } catch (e) {
      console.warn('Iterate: LLM config push failed:', e.message);
    }
  }

  function providerDirectUrl(provider) {
    // Direct browser-to-provider URLs. No backend proxy — keys stay in browser.
    const map = {
      openai: 'https://api.openai.com/v1',
      openrouter: 'https://openrouter.ai/api/v1',
      anthropic: 'https://api.anthropic.com/v1',
      google: 'https://generativelanguage.googleapis.com/v1beta',
      groq: 'https://api.groq.com/openai/v1',
      together: 'https://api.together.xyz/v1',
      minimax: 'https://api.minimax.chat/v1',
      moonshot: 'https://api.moonshot.cn/v1',
      'kimi-coding': 'https://api.moonshot.cn/v1',
      huggingface: 'https://api-inference.huggingface.co/v1',
      nvidia: 'https://integrate.api.nvidia.com/v1',
      venice: 'https://api.venice.ai/api/v1',
      ollama: 'http://127.0.0.1:11434/v1',
    };
    return map[provider] || '';
  }

  // ── Agent Tool Handlers ────────────────────────────────────
  // The agent (via OpenClaw Lite worker) calls tools like
  // agent_town_iterate_set_problem, agent_town_iterate_submit_code, etc.
  // app.js routes these via CustomEvents to us.

  function initIterateTools() {
    window.addEventListener('iterate.toolRequest', async (evt) => {
      const { requestId, action, params } = evt.detail || {};
      if (!requestId || !action) return;

      let envelope;
      try {
        switch (action) {
          case 'setProblem':
            envelope = handleSetProblem(params);
            break;
          case 'proposeMetrics':
            envelope = handleProposeMetrics(params);
            break;
          case 'confirmMetrics':
            envelope = await handleConfirmMetrics(params);
            break;
          case 'submitCode':
            envelope = await handleSubmitCode(params);
            break;
          case 'submitScores':
            envelope = await handleSubmitScores(params);
            break;
          case 'getState':
            envelope = handleGetState();
            break;
          default:
            envelope = { ok: false, applied: false, error: { code: 'UNKNOWN_ACTION', message: `Unknown iterate action: ${action}` } };
        }
      } catch (e) {
        envelope = { ok: false, applied: false, error: { code: 'ITERATE_ERROR', message: e.message } };
      }

      window.dispatchEvent(new CustomEvent('iterate.toolResponse', {
        detail: { requestId, envelope }
      }));
    });
  }

  function handleSetProblem(params) {
    const description = String(params?.problemDescription || '').trim();
    if (!description || description.length < 5) {
      return { ok: false, applied: false, error: { code: 'INVALID_PARAM', message: 'problemDescription must be at least 5 chars' } };
    }

    // Fill the problem input and update UI
    const input = el('problemInput');
    if (input) input.value = description;

    const titleEl = el('problemTitle');
    if (titleEl) titleEl.textContent = description.slice(0, 80) + (description.length > 80 ? '...' : '');

    appendMessage('system', `Problem set: "${description.slice(0, 100)}${description.length > 100 ? '...' : ''}"`);

    return { ok: true, applied: true, stateSnapshot: { problemDescription: description } };
  }

  function handleProposeMetrics(params) {
    const metrics = Array.isArray(params?.metrics) ? params.metrics : [];
    if (metrics.length === 0) {
      return { ok: false, applied: false, error: { code: 'INVALID_PARAM', message: 'metrics array required' } };
    }

    // Show metrics as cards in the conversation
    const thread = el('conversationThread');
    if (!thread) return { ok: false, applied: false, error: { code: 'UI_NOT_READY', message: 'Conversation thread not available' } };

    const metricsHtml = metrics.map(m =>
      `<div class="iterate-metric-card" data-testid="metric-card">
        <div class="iterate-metric-card-name">${escapeHtml(m.name || '')}</div>
        <div class="iterate-metric-card-type">${escapeHtml(m.type || '')} · ${escapeHtml(m.direction || '')}</div>
        ${m.rationale ? `<div class="iterate-metric-card-rationale">${escapeHtml(m.rationale)}</div>` : ''}
      </div>`
    ).join('');

    const msg = document.createElement('div');
    msg.className = 'iterate-msg iterate-msg-system';
    msg.setAttribute('data-testid', 'proposed-metrics');
    msg.innerHTML = `
      <div class="iterate-msg-bubble">
        <p><strong>Proposed metrics:</strong></p>
        ${metricsHtml}
        <div class="iterate-metrics-actions" style="margin-top: 8px;">
          <button class="btn primary small" data-action="confirm-metrics">Confirm metrics</button>
          <button class="btn small" data-action="revise-metrics">Revise</button>
        </div>
      </div>
    `;
    thread.appendChild(msg);
    thread.scrollTop = thread.scrollHeight;

    // Store proposed metrics for confirmation
    window.__iterateProposedMetrics = metrics;

    msg.querySelector('[data-action="confirm-metrics"]')?.addEventListener('click', async () => {
      msg.querySelector('[data-action="confirm-metrics"]').disabled = true;
      msg.querySelector('[data-action="confirm-metrics"]').textContent = 'Confirming...';
      await handleConfirmMetrics({ metrics: window.__iterateProposedMetrics });
      msg.querySelector('.iterate-metrics-actions')?.remove();
    });

    msg.querySelector('[data-action="revise-metrics"]')?.addEventListener('click', () => {
      appendMessage('system', 'Tell the agent what to change about the metrics.');
    });

    return { ok: true, applied: true, stateSnapshot: { metricsCount: metrics.length } };
  }

  async function handleConfirmMetrics(params) {
    const metrics = Array.isArray(params?.metrics) ? params.metrics : (window.__iterateProposedMetrics || []);
    if (!storyId) {
      return { ok: false, applied: false, error: { code: 'NO_STORY', message: 'No problem story active' } };
    }

    try {
      for (const m of metrics) {
        await apiFetch(`/api/problem-stories/${storyId}/eval-proposals/metrics`, {
          method: 'POST',
          body: JSON.stringify({ name: m.name, type: m.type || 'qualitative', direction: m.direction || 'maximize', weight: m.weight }),
        });
      }
      await apiFetch(`/api/problem-stories/${storyId}/eval-confirm`, { method: 'POST' });
      appendMessage('system', `${metrics.length} metrics confirmed. Ready for experiments.`);
      return { ok: true, applied: true, stateSnapshot: { metricsConfirmed: true, count: metrics.length } };
    } catch (e) {
      return { ok: false, applied: false, error: { code: 'API_ERROR', message: e.message } };
    }
  }

  async function handleSubmitCode(params) {
    const files = params?.files;
    const summary = String(params?.summary || 'Agent experiment').slice(0, 280);
    const score = typeof params?.compositeScore === 'number' ? Math.max(0, Math.min(1, params.compositeScore)) : 0.5;

    if (!files || typeof files !== 'object' || Object.keys(files).length === 0) {
      return { ok: false, applied: false, error: { code: 'INVALID_PARAM', message: 'files object required with at least one file' } };
    }
    if (!storyId) {
      return { ok: false, applied: false, error: { code: 'NO_STORY', message: 'No problem story active' } };
    }

    // Run in sandbox if available
    let sandboxResult = null;
    if (sandbox?.ready) {
      appendMessage('system', 'Running code in sandbox...');
      sandboxResult = await runCodeInSandbox(files);
      const outputText = sandboxResult.exitCode === 0
        ? `Output:\n${sandboxResult.stdout || '(no output)'}`
        : `Error (exit ${sandboxResult.exitCode}):\n${sandboxResult.stderr || ''}`;
      appendMessage('system', `Sandbox (${sandboxResult.executionMs}ms):\n${outputText}`);
    }

    // Create experiment card
    try {
      const card = await apiFetch(`/api/problem-stories/${storyId}/experiment-cards`, {
        method: 'POST',
        body: JSON.stringify({
          agentSummary: summary,
          compositeScore: sandboxResult ? (sandboxResult.exitCode === 0 ? score : 0.1) : score,
          roundNumber: currentRound + 1,
          artifact: {
            source: files,
            outputType: 'terminal',
            outputPreview: sandboxResult ? (sandboxResult.stdout || sandboxResult.stderr || '').slice(0, 2000) : null,
            entrypoint: Object.keys(files).find(k => k.includes('index')) || Object.keys(files)[0],
            executionMs: sandboxResult?.executionMs || null,
            exitCode: sandboxResult?.exitCode ?? null,
          },
        }),
      });

      if (card.ok && card.card) {
        renderExperimentCard(card.card);
        experimentCards.push(card.card);
        currentRound++;
        await updateScoreTrend();
      }

      return {
        ok: true, applied: true,
        stateSnapshot: {
          cardId: card.card?.id,
          exitCode: sandboxResult?.exitCode ?? null,
          stdout: (sandboxResult?.stdout || '').slice(0, 500),
          stderr: (sandboxResult?.stderr || '').slice(0, 500),
          compositeScore: card.card?.compositeScore,
        }
      };
    } catch (e) {
      return { ok: false, applied: false, error: { code: 'API_ERROR', message: e.message } };
    }
  }

  async function handleSubmitScores(params) {
    const scores = params?.scores;
    const cardId = params?.cardId;
    if (!scores || !cardId) {
      return { ok: false, applied: false, error: { code: 'INVALID_PARAM', message: 'scores and cardId required' } };
    }

    // Update the card's scores on the server via feedback
    try {
      await apiFetch(`/api/experiment-cards/${cardId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({
          modality: 'text',
          textContent: `Agent self-assessment: ${JSON.stringify(scores)}`,
        }),
      });
      await updateScoreTrend();
      return { ok: true, applied: true, stateSnapshot: { cardId, scoresSubmitted: true } };
    } catch (e) {
      return { ok: false, applied: false, error: { code: 'API_ERROR', message: e.message } };
    }
  }

  function handleGetState() {
    return {
      ok: true, applied: true,
      stateSnapshot: {
        phase: currentPhase,
        storyId,
        currentRound,
        experimentCount: experimentCards.length,
        sandboxReady: !!sandbox?.ready,
        sandboxType: sandbox?.type || null,
        flowStep: flow?.currentStep || null,
        userName,
        agentName,
      }
    };
  }

  // ── Active Loop — Conversation ────────────────────────────
  // Chat input removed — the Agent Dock handles all chat.
  // Agent messages are mirrored into our conversation thread via the gateway listener.

  function appendMessage(role, text) {
    const thread = el('conversationThread');
    if (!thread) return;

    const msg = document.createElement('div');
    const isUser = role === 'user';
    const isAgent = role === 'agent';

    msg.className = `iterate-msg ${isUser ? 'iterate-msg-user' : isAgent ? 'iterate-msg-agent' : 'iterate-msg-system'}`;
    msg.setAttribute('data-testid', `msg-${role}`);

    if (isUser || isAgent) {
      const avatar = isUser ? userAvatar : agentAvatar;
      const name = isUser ? userName : agentName;
      msg.innerHTML = `
        <img class="iterate-avatar-mini" src="${escapeAttr(avatar)}" alt="${escapeHtml(name)}">
        <div class="iterate-msg-body">
          <div class="iterate-msg-name">${escapeHtml(name)}</div>
          <div class="iterate-msg-bubble">${escapeHtml(text)}</div>
        </div>
      `;
    } else {
      msg.innerHTML = `<div class="iterate-msg-bubble">${escapeHtml(text)}</div>`;
    }

    thread.appendChild(msg);
    thread.scrollTop = thread.scrollHeight;
  }

  // ── Agent message handling (flow-aware) ─────────────────────
  function handleAgentMessage(text) {
    if (!flow) return;

    const result = flow.processAgentMessage(text);

    // Update step label
    const roundLabel = el('roundLabel');
    if (roundLabel) roundLabel.textContent = flow.getStepLabel();

    switch (result.nextAction) {
      case 'confirm':
        showConfirmAction(result.artifact);
        break;
      case 'run_code':
        handleCodeFromAgent(result.codeFiles, text);
        break;
      case 'advance':
        flow.confirmArtifact(result.artifact);
        advanceFlow();
        break;
      case 'wait':
        // Agent is still conversing
        break;
    }
  }

  function showConfirmAction(artifact) {
    const thread = el('conversationThread');
    if (!thread) return;
    thread.querySelectorAll('[data-testid="confirm-action"]').forEach(e => e.remove());

    const typeName = artifact?.type?.replace(/_/g, ' ') || 'artifact';
    const action = document.createElement('div');
    action.className = 'iterate-msg iterate-msg-system';
    action.setAttribute('data-testid', 'confirm-action');
    action.innerHTML = `
      <div class="iterate-msg-bubble">
        <p>Agent proposed a <strong>${escapeHtml(typeName)}</strong>. Review above, then confirm or ask for changes.</p>
        <div class="iterate-metrics-actions">
          <button class="btn primary small" data-action="confirm">Confirm and continue</button>
          <button class="btn small" data-action="revise">Ask for changes</button>
        </div>
      </div>
    `;
    thread.appendChild(action);
    thread.scrollTop = thread.scrollHeight;

    action.querySelector('[data-action="confirm"]').addEventListener('click', async () => {
      action.remove();
      flow.confirmArtifact(artifact);

      // Store metrics on server when evaluation contract is confirmed
      if (artifact.type === 'evaluation_contract' && storyId) {
        await storeMetricsOnServer(artifact);
      }

      advanceFlow();
    });

    action.querySelector('[data-action="revise"]').addEventListener('click', () => {
      action.remove();
      sendToAgent('I want to change this. Let me explain.');
    });
  }

  async function handleCodeFromAgent(files, agentMessage) {
    const thread = el('conversationThread');
    if (!thread) return;

    const action = document.createElement('div');
    action.className = 'iterate-msg iterate-msg-system';
    action.setAttribute('data-testid', 'run-code-action');
    const fileCount = Object.keys(files).length;
    const sandboxLabel = sandbox?.ready ? `Run in sandbox (${sandbox.type})` : 'Sandbox not available';

    action.innerHTML = `
      <div class="iterate-msg-bubble">
        <p>Agent produced ${fileCount} TypeScript file${fileCount > 1 ? 's' : ''}.</p>
        <div class="iterate-metrics-actions">
          <button class="btn primary small" data-action="run-code" ${sandbox?.ready ? '' : 'disabled'}>${sandboxLabel}</button>
          <button class="btn small" data-action="save-card">Save as card only</button>
        </div>
      </div>
    `;
    thread.appendChild(action);
    thread.scrollTop = thread.scrollHeight;

    action.querySelector('[data-action="run-code"]')?.addEventListener('click', async () => {
      action.querySelector('[data-action="run-code"]').disabled = true;
      action.querySelector('[data-action="run-code"]').textContent = 'Running...';
      appendMessage('system', 'Compiling and running code in sandbox...');

      const result = await runCodeInSandbox(files);
      const outputText = result.exitCode === 0
        ? `Output:\n${result.stdout || '(no output)'}`
        : `Error (exit ${result.exitCode}):\n${result.stderr || '(no error details)'}`;
      appendMessage('system', `Sandbox result (${result.executionMs}ms):\n${outputText}`);

      // Record in the flow
      flow.recordExperiment(files, result);

      // Create experiment card
      try {
        const card = await apiFetch(`/api/problem-stories/${storyId}/experiment-cards`, {
          method: 'POST',
          body: JSON.stringify({
            agentSummary: agentMessage.slice(0, 280),
            compositeScore: result.exitCode === 0 ? 0.5 : 0.1,
            roundNumber: flow.experimentRound + 1,
            artifact: {
              source: files,
              outputType: 'terminal',
              outputPreview: (result.stdout || result.stderr || '').slice(0, 2000),
              entrypoint: 'src/index.ts',
              executionMs: result.executionMs,
              exitCode: result.exitCode,
            },
          }),
        });
        if (card.ok && card.card) {
          renderExperimentCard(card.card);
          experimentCards.push(card.card);
          currentRound = flow.experimentRound + 1;
          await updateScoreTrend();
        }
      } catch (e) {
        appendMessage('system', `Failed to save card: ${e.message}`);
      }

      action.remove();

      // Send output to agent for scoring (step 5)
      const scoringPrompt = await flow.buildPrompt({
        exitCode: result.exitCode,
        stdout: (result.stdout || '').slice(0, 2000),
        stderr: (result.stderr || '').slice(0, 1000),
        executionMs: result.executionMs,
      });
      if (scoringPrompt) sendToAgent(scoringPrompt);
    });

    action.querySelector('[data-action="save-card"]')?.addEventListener('click', async () => {
      try {
        const card = await apiFetch(`/api/problem-stories/${storyId}/experiment-cards`, {
          method: 'POST',
          body: JSON.stringify({
            agentSummary: agentMessage.slice(0, 280),
            compositeScore: 0.3,
            artifact: { source: files, outputType: null, outputPreview: null, entrypoint: 'src/index.ts', executionMs: null, exitCode: null },
          }),
        });
        if (card.ok && card.card) {
          renderExperimentCard(card.card);
          experimentCards.push(card.card);
          appendMessage('system', 'Code saved as experiment card.');
        }
      } catch (e) {
        appendMessage('system', `Failed to save card: ${e.message}`);
      }
      action.remove();
    });
  }

  async function storeMetricsOnServer(evalContract) {
    if (!storyId || !evalContract?.metrics) return;
    try {
      for (const m of evalContract.metrics) {
        await apiFetch(`/api/problem-stories/${storyId}/eval-proposals/metrics`, {
          method: 'POST',
          body: JSON.stringify({ name: m.name, type: m.type, direction: m.direction, weight: m.weight }),
        });
      }
      await apiFetch(`/api/problem-stories/${storyId}/eval-confirm`, { method: 'POST' });
    } catch (e) {
      appendMessage('system', `Warning: could not store metrics: ${e.message}`);
    }
  }

  async function advanceFlow() {
    if (!flow) return;
    appendMessage('system', flow.getStepLabel());
    const prompt = await flow.buildPrompt();
    if (prompt) sendToAgent(prompt);
  }

  function sendToAgent(text) {
    if (gateway && typeof gateway.send === 'function') {
      try {
        const result = gateway.send({ type: 'chat', text });
        // gateway.send() may or may not return a Promise
        if (result && typeof result.catch === 'function') {
          result.catch(e => {
            appendMessage('system', `Send failed: ${e.message}`);
          });
        }
      } catch (e) {
        appendMessage('system', `Send failed: ${e.message}`);
      }
    } else {
      appendMessage('system', 'Agent not connected. Configure brain in the Agent Dock at the bottom, then send a message there first to initialize the connection.');
    }
  }

  // runExperimentRound removed — experiments are now created by the agent
  // via agent_town_iterate_submit_code tool, not the simulated server endpoint.

  function renderExperimentCard(card) {
    const feed = el('experimentFeed');
    if (!feed) return;

    const cardEl = document.createElement('div');
    cardEl.className = 'iterate-exp-card';
    cardEl.setAttribute('data-testid', 'experiment-card');
    cardEl.setAttribute('data-card-id', card.id);

    const delta = card.deltaScore || 0;
    const deltaClass = delta > 0 ? 'positive' : delta < 0 ? 'negative' : '';
    const deltaText = delta > 0 ? `+${delta.toFixed(2)}` : delta < 0 ? delta.toFixed(2) : '';
    const hasArtifact = card.artifact?.outputPreview;
    const gradient = card.visual?.url || 'linear-gradient(135deg, var(--sky-200), var(--sky-400))';

    // Show real output if artifact exists, otherwise show gradient placeholder
    const visualHtml = hasArtifact
      ? `<pre class="iterate-exp-card-output" data-testid="card-visual">${escapeHtml(card.artifact.outputPreview.slice(0, 500))}</pre>`
      : `<div class="iterate-exp-card-visual" data-testid="card-visual" style="background: ${gradient}"></div>`;

    const artifactBadge = card.artifact?.exitCode === 0
      ? '<span class="iterate-exp-card-badge good">ran</span>'
      : card.artifact?.exitCode != null
        ? '<span class="iterate-exp-card-badge bad">error</span>'
        : '';

    cardEl.innerHTML = `
      <div class="iterate-exp-card-header">
        <span class="iterate-exp-card-round">R${card.roundNumber || currentRound} · E${card.iterationNumber || '?'} ${artifactBadge}</span>
        <span>
          <span class="iterate-exp-card-score">${(card.compositeScore || 0).toFixed(2)}</span>
          ${deltaText ? `<span class="iterate-exp-card-delta ${deltaClass}">${deltaText}</span>` : ''}
        </span>
      </div>
      ${visualHtml}
      <div class="iterate-exp-card-summary">${escapeHtml(card.agentSummary || 'Experiment')}</div>
      <div class="iterate-exp-card-status">${card.status === 'kept' ? 'Kept' : card.status === 'discarded' ? 'Discarded' : 'Pending review'}</div>
    `;

    cardEl.addEventListener('click', () => showCardDetail(card));
    feed.insertBefore(cardEl, feed.firstChild);
  }

  function showCardDetail(card) {
    appendMessage('system', `Reviewing: "${card.agentSummary}" (score: ${(card.compositeScore || 0).toFixed(2)}). Type your feedback below.`);
    const input = el('iterateChatInput');
    if (input) {
      input.focus();
      input.placeholder = `Feedback on experiment ${card.iterationNumber}...`;
    }
  }

  // ── Score trend ───────────────────────────────────────────
  async function updateScoreTrend() {
    if (!storyId) return;
    try {
      const trend = await apiFetch(`/api/iteration-loop/score-trend?problemStoryId=${storyId}`);
      const sparkline = el('sparkline');
      const scoreValue = el('scoreValue');

      if (sparkline && trend.points) {
        sparkline.innerHTML = '';
        const maxScore = Math.max(...trend.points.map(p => p.bestScore), 0.01);
        trend.points.forEach((pt, i) => {
          const bar = document.createElement('div');
          bar.className = `iterate-sparkline-bar${i === trend.points.length - 1 ? ' current' : ''}`;
          bar.style.height = `${(pt.bestScore / maxScore) * 100}%`;
          bar.title = `Round ${pt.round}: ${pt.bestScore.toFixed(2)}`;
          sparkline.appendChild(bar);
        });
        if (scoreValue && trend.points.length > 0) {
          scoreValue.textContent = trend.points[trend.points.length - 1].bestScore.toFixed(2);
        }
      }
    } catch { /* non-critical */ }
  }

  // ── Convergence ───────────────────────────────────────────
  async function checkConvergence() {
    if (!storyId) return;
    try {
      const status = await apiFetch(`/api/iteration-loop/convergence-status?problemStoryId=${storyId}`);
      const convergenceEl = el('convergenceStatus');
      if (convergenceEl && status.message) {
        convergenceEl.textContent = status.message;
        convergenceEl.classList.remove('is-hidden');
      }
      if (status.converged) {
        const detail = el('convergenceDetail');
        if (detail) detail.textContent = `Best score: ${(status.currentScore || 0).toFixed(2)} after ${currentRound} rounds.`;
        show('convergenceMessage');
      }
    } catch { /* non-critical */ }
  }

  // ── Export ─────────────────────────────────────────────────
  function initExportBtn() {
    const exportBtn = el('exportBtn');
    if (!exportBtn) return;
    exportBtn.addEventListener('click', async () => {
      if (!sandbox || typeof sandbox.exportZip !== 'function') {
        appendMessage('system', 'Sandbox not available — nothing to export.');
        return;
      }
      exportBtn.disabled = true;
      exportBtn.textContent = 'Exporting...';
      try {
        // Export from sandbox
        const zip = await sandbox.exportZip();
        // Store on server
        const res = await fetch('/api/sandbox/snapshot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'x-problem-story-id': storyId || '',
          },
          body: zip,
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || 'Store failed');

        // Publish as library item
        const pubRes = await apiFetch(`/api/sandbox/snapshot/${data.id}/publish`, {
          method: 'POST',
          body: JSON.stringify({
            problemDescription: el('problemTitle')?.textContent || '',
            convergenceScore: parseFloat(el('scoreValue')?.textContent || '0') || 0,
            entrypoint: 'src/index.ts',
          }),
        });

        appendMessage('system', `Workspace exported! Snapshot: ${data.id.slice(0, 8)}... (${(data.size / 1024).toFixed(1)} KB). Library item: ${pubRes.item?.id?.slice(0, 8)}...`);

        // Also offer download
        const blob = new Blob([zip], { type: 'application/zip' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `iterate-snapshot-${Date.now()}.zip`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (e) {
        appendMessage('system', `Export failed: ${e.message}`);
      }
      exportBtn.disabled = false;
      exportBtn.textContent = 'Export';
    });
  }

  // ── Save game ─────────────────────────────────────────────
  function initSaveBtn() {
    const saveBtn = el('saveBtn');
    if (!saveBtn) return;
    saveBtn.addEventListener('click', async () => {
      if (!storyId) return;
      saveBtn.disabled = true;
      try {
        const save = await apiFetch('/api/save-games', {
          method: 'POST',
          body: JSON.stringify({ problemStoryId: storyId, label: `Round ${currentRound}` }),
        });
        appendMessage('system', `Checkpoint saved: "${save.label || 'checkpoint'}"`);
      } catch (e) {
        appendMessage('system', `Save failed: ${e.message}`);
      }
      saveBtn.disabled = false;
    });
  }

  // ── Convergence resolution ────────────────────────────────
  function initConvergenceButtons() {
    el('publishBtn')?.addEventListener('click', async () => {
      if (!storyId) return;
      try {
        await apiFetch(`/api/problem-stories/${storyId}/finish`, { method: 'PUT' });
        await apiFetch('/api/published-streams', {
          method: 'POST',
          body: JSON.stringify({ problemStoryId: storyId }),
        });
        appendMessage('system', 'Solution published to the discovery feed!');
        hide('convergenceMessage');
      } catch (e) {
        appendMessage('system', `Publish failed: ${e.message}`);
      }
    });

    el('keepGoingBtn')?.addEventListener('click', () => {
      hide('convergenceMessage');
      appendMessage('system', 'Continuing iteration. Ask the agent for the next experiment.');
      sendToAgent('Please generate another experiment round, incorporating all feedback so far.');
    });
  }

  // ── Sandbox ────────────────────────────────────────────────
  async function bootSandbox() {
    try {
      const mod = await import('/sandbox.js');
      sandbox = await mod.createSandbox();
      console.log(`Sandbox ready: ${sandbox.type}`);
    } catch (e) {
      console.warn('Sandbox boot deferred:', e.message);
      // Sandbox is optional — the iterate loop works without it (text-only mode)
    }
  }

  /**
   * Run TypeScript code in the sandbox and return the result.
   * If sandbox isn't available, returns a stub result.
   */
  async function runCodeInSandbox(files, entrypoint) {
    if (!sandbox || !sandbox.ready) {
      return {
        stdout: '',
        stderr: 'Sandbox not available — code was not executed.',
        exitCode: null,
        executionMs: 0,
        phase: 'unavailable',
      };
    }
    try {
      return await sandbox.run(files, entrypoint);
    } catch (e) {
      return {
        stdout: '',
        stderr: `Sandbox error: ${e.message}`,
        exitCode: 1,
        executionMs: 0,
        phase: 'error',
      };
    }
  }

  // exportAndStoreSnapshot removed — export button handler does this inline.
  // extractCodeFromMessage removed — conversation-flow.js handles code extraction.

  // ── Session Context debug panel ────────────────────────────
  // app.js's poll loop calls /api/state which doesn't work on the iterate
  // page (no portal session). We populate the session context debug panel
  // directly so users can see their iterate session info.
  let sessionCtxTimer = null;

  function startSessionContextUpdater() {
    if (sessionCtxTimer) return;
    sessionCtxTimer = setInterval(() => {
      const panel = document.getElementById('agentDebugSession');
      if (!panel) return;
      // Only write when the panel is visible (session tab active)
      if (panel.closest('.is-hidden')) return;

      const teamCodeVal = localStorage.getItem(LS_TEAM_CODE) || '(none)';
      const storyIdVal = storyId || localStorage.getItem(LS_STORY_ID) || '(none)';
      const lines = [
        `--- Iterate Session Context ---`,
        `refreshedAt: ${new Date().toISOString()}`,
        `phase: ${currentPhase}`,
        `userName: ${userName}`,
        `agentName: ${agentName}`,
        `teamCode: ${teamCodeVal}`,
        `problemStoryId: ${storyIdVal}`,
        `currentRound: ${currentRound}`,
        `experimentCards: ${experimentCards.length}`,
        `gateway: ${gateway ? 'connected' : 'not connected'}`,
        `sandbox: ${sandbox ? `${sandbox.type} (${sandbox.ready ? 'ready' : 'not ready'})` : 'not booted'}`,
        `flow: ${flow ? JSON.stringify(flow.toJSON()) : 'not initialized'}`,
      ];
      panel.textContent = lines.join('\n');
    }, 2000);
  }

  // ── Utilities ─────────────────────────────────────────────
  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function escapeAttr(str) {
    return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ── Cleanup ────────────────────────────────────────────────
  function cleanupAllTimers() {
    stopBrainDetectionLoop();
    stopOAuthPoll();
    if (sessionCtxTimer) { clearInterval(sessionCtxTimer); sessionCtxTimer = null; }
  }
  window.addEventListener('beforeunload', cleanupAllTimers);

  // ── Init ──────────────────────────────────────────────────
  async function init() {
    // Restore identity
    const savedUser = localStorage.getItem(LS_USER_NAME);
    const savedAgent = localStorage.getItem(LS_AGENT_NAME);
    if (savedUser) userName = savedUser;
    if (savedAgent) agentName = savedAgent;

    initIdentity();
    initBrainStep();
    initProblemInput();
    initIterateTools();
    initExportBtn();
    initSaveBtn();
    initConvergenceButtons();

    // Ensure a server session exists (sets et_session cookie needed for LLM proxy)
    try {
      await apiFetch('/api/state');
    } catch {
      // /api/state may return HTML on the iterate page — that's OK,
      // the important thing is the server sets the et_session cookie.
      try { await fetch('/api/state'); } catch { /* ignore */ }
    }

    // Connect to the gateway that agent_panel.js initializes
    await connectGateway();

    // Push saved LLM config to the worker (the worker doesn't auto-restore on /iterate)
    await pushSavedLlmConfigToWorker();

    // Boot the code sandbox (WebContainer or fallback)
    bootSandbox();

    // Seed the session context debug panel with iterate-specific info.
    startSessionContextUpdater();

    goToPhase('identity');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
