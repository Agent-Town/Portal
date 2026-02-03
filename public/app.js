async function api(url, opts) {
  const res = await fetch(url, {
    headers: { 'content-type': 'application/json', ...(opts && opts.headers ? opts.headers : {}) },
    credentials: 'include',
    ...opts
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data && data.error ? data.error : `HTTP_${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function el(id) {
  return document.getElementById(id);
}

let elements = [];
let lastState = null;
let redirecting = false;

function renderSigils(state) {
  const grid = el('sigilGrid');
  grid.innerHTML = '';

  const humanSel = state.human?.selected || null;
  const agentSel = state.agent?.selected || null;

  for (const item of elements) {
    const btn = document.createElement('button');
    btn.className = 'btn sigil';
    btn.type = 'button';
    btn.dataset.elementId = item.id;
    btn.setAttribute('data-testid', `sigil-${item.id}`);

    const left = document.createElement('div');
    const icon = item.icon ? `<span class="sigilIcon" aria-hidden="true">${item.icon}</span>` : '';
    left.innerHTML = `<div class="name">${icon}<span>${item.label}</span></div><div class="hint">click to pick</div>`;

    const right = document.createElement('div');
    right.style.display = 'grid';
    right.style.gap = '6px';
    right.style.justifyItems = 'end';

    const you = document.createElement('div');
    you.className = 'pill';
    you.style.padding = '4px 8px';
    you.textContent = humanSel === item.id ? 'you' : '';

    const agent = document.createElement('div');
    agent.className = 'pill';
    agent.style.padding = '4px 8px';
    agent.textContent = agentSel === item.id ? 'agent' : '';

    right.appendChild(you);
    right.appendChild(agent);

    btn.appendChild(left);
    btn.appendChild(right);

    if (humanSel === item.id || agentSel === item.id) {
      btn.classList.add('selected');
    }

    btn.addEventListener('click', async () => {
      try {
        await api('/api/human/select', {
          method: 'POST',
          body: JSON.stringify({ elementId: item.id })
        });
      } catch (e) {
        console.warn(e);
      }
    });

    grid.appendChild(btn);
  }
}

function updateUI(state) {
  lastState = state;

  // Counts
  el('signupCount').textContent = String(state.stats?.signups ?? '—');

  // Team code (fallback for older servers that still send pairCode)
  const teamCode = state.teamCode || state.pairCode || '…';
  el('teamCode').textContent = teamCode;

  const origin = window.location.origin;
  el('teamSnippet').textContent = `Read ${origin}/skill.md and team with code: ${teamCode}`;

  // Agent status
  const connected = !!state.agent?.connected;
  const dot = el('agentDot');
  dot.className = `dot ${connected ? 'good' : ''}`;
  el('agentStatusText').textContent = connected
    ? `Agent connected${state.agent?.name ? `: ${state.agent.name}` : ''}`
    : 'Agent not connected';

  // Sigils
  renderSigils(state);

  // Match lock
  const matched = !!state.match?.matched;
  el('matchState').textContent = matched ? 'UNLOCKED' : 'LOCKED';
  el('matchState').className = `state ${matched ? 'good' : 'bad'}`;
  el('matchDetail').textContent = matched
    ? `Matched on “${state.match.elementId}”. Now press beta together.`
    : 'Pick the same sigil to unlock.';

  // Beta panel gating
  const betaBtn = el('betaBtn');
  betaBtn.disabled = !matched;

  // Signup completion
  const complete = !!state.signup?.complete;
  el('betaReady').style.display = complete ? 'inline-flex' : 'none';

  // Waiting pill: show if human pressed but not complete
  const waiting = !!state.human?.betaPressed && !complete;
  el('betaWaiting').style.display = waiting ? 'inline-flex' : 'none';

  // Auto-redirect only once per completed signup.
  let freshComplete = false;
  if (complete && state.signup?.createdAt) {
    try {
      const key = 'agentTownSignupCompleteAt';
      const last = localStorage.getItem(key);
      if (last !== state.signup.createdAt) {
        localStorage.setItem(key, state.signup.createdAt);
        freshComplete = true;
      }
    } catch {
      freshComplete = true;
    }
  }
  if (complete && freshComplete && !redirecting) {
    redirecting = true;
    // small delay for perceived continuity
    setTimeout(() => {
      window.location.href = '/create';
    }, 150);
  }
}

async function poll() {
  try {
    const state = await api('/api/state');
    updateUI(state);
  } catch (e) {
    console.warn('state poll failed', e);
  } finally {
    setTimeout(poll, 800);
  }
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if (ref) {
    try {
      await api('/api/referral', { method: 'POST', body: JSON.stringify({ shareId: ref }) });
    } catch {
      // ignore invalid referral
    }
    params.delete('ref');
    const qs = params.toString();
    const nextUrl = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
    window.history.replaceState({}, '', nextUrl);
  }

  const session = await api('/api/session');
  elements = session.elements || [];
  // Update UI quickly using /api/state next.
  updateUI({
    teamCode: session.teamCode,
    elements,
    agent: { connected: false },
    human: {},
    match: { matched: false },
    signup: { complete: false },
    share: { id: null },
    stats: session.stats
  });

  el('copyTeam').addEventListener('click', async () => {
    const msg = el('teamSnippet').textContent;
    try {
      await navigator.clipboard.writeText(msg);
      el('copyTeam').textContent = 'Copied ✓';
      setTimeout(() => (el('copyTeam').textContent = 'Copy team message'), 1200);
    } catch {
      // Fallback
      alert(msg);
    }
  });

  el('betaBtn').addEventListener('click', async () => {
    el('betaError').textContent = '';
    const email = el('email').value.trim();
    try {
      await api('/api/human/beta/press', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
    } catch (e) {
      el('betaError').textContent = e.message === 'INVALID_EMAIL' ? 'Enter a valid email.' : `Error: ${e.message}`;
    }
  });

  poll();
}

init().catch((e) => {
  console.error(e);
});
