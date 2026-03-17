// feed.js — ZHC1 iteration feed rendering logic (API-connected)

const STORAGE_KEY = 'zhc1-feed-scroll';
const API_BASE = window.location.origin;
const CURRENT_STORY_KEY = 'zhc1-current-story-id';

// ── Sample data (fallback when no API data) ──────────────────
const SAMPLE_EXPERIMENTS = [
  {
    iteration: 3,
    score: 0.91,
    delta: +0.04,
    summary: 'Moved CTA inline with hero. Trust badges strip.',
    files: [
      { name: 'hero.css', additions: 24, deletions: 18 },
      { name: 'nav.css', additions: 3, deletions: 15 },
    ],
    visualGradient: 'linear-gradient(145deg, #1a1a2e, #16213e 50%, #0f3460)',
    label: 'Layout B',
    title: 'Hero with inline CTA + social proof above fold',
    body: 'Moved CTA into hero headline. Added trust badges and testimonial strip. Reduced nav to 4 items.',
    metrics: { Load: '1.2s', LCP: '1.8s', CLS: '0.02', Visual: '9/10' },
    metricStatus: { Load: 'good', LCP: 'good', CLS: 'good', Visual: 'good' },
    age: '7m ago',
    round: 1,
    cardId: 'sample-3',
  },
  {
    iteration: 2,
    score: 0.87,
    delta: -0.02,
    summary: 'Full-width gradient hero. CLS regression. Discarded.',
    files: [
      { name: 'hero.css', additions: 31, deletions: 12 },
      { name: 'nav.css', additions: 42, deletions: 8 },
    ],
    visualGradient: 'linear-gradient(145deg, #1a1a2e, #1a0f2e 50%, #2d0f3e)',
    label: 'Layout A',
    title: 'Full-width hero with centered CTA and floating nav',
    body: 'Bolder hero with gradient. Floating nav caused CLS regression.',
    metrics: { Load: '1.6s', LCP: '2.4s', CLS: '0.12', Visual: '7/10' },
    metricStatus: { Load: 'warn', LCP: 'warn', CLS: 'bad', Visual: 'warn' },
    age: '14m ago',
    round: 1,
    cardId: 'sample-2',
  },
  {
    iteration: 1,
    score: 0.83,
    delta: +0.06,
    summary: 'High-contrast dark palette. Accessibility AA reached.',
    files: [
      { name: 'theme.css', additions: 18, deletions: 34 },
    ],
    visualGradient: 'linear-gradient(145deg, #0f2027, #203a43 50%, #2c5364)',
    label: 'Color System',
    title: 'High-contrast dark palette, accent on CTAs only',
    body: 'Reduced color noise. CTAs as only saturated element. Accessibility AA reached.',
    metrics: { Load: '1.1s', LCP: '1.9s', CLS: '0.01', Visual: '8/10' },
    metricStatus: { Load: 'good', LCP: 'good', CLS: 'good', Visual: 'warn' },
    age: '28m ago',
    round: 1,
    cardId: 'sample-1',
  },
];

// ── API helpers ───────────────────────────────────────────────

async function apiFetch(path, opts = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('[feed:api]', path, err.message);
    throw err;
  }
}

function getLastStoryId() {
  try { return localStorage.getItem(CURRENT_STORY_KEY); } catch { return null; }
}

function setLastStoryId(id) {
  try { localStorage.setItem(CURRENT_STORY_KEY, id); } catch { /* noop */ }
}

// ── Convert API experiment cards → feed display format ────────

function apiCardToDisplay(card) {
  // Build files list from codeReference
  const files = [];
  if (card.codeReference?.filePath) {
    const summary = card.codeReference.diffSummary || '';
    const addMatch = summary.match(/\+(\d+)/);
    const delMatch = summary.match(/-(\d+)/);
    files.push({
      name: card.codeReference.filePath,
      additions: addMatch ? parseInt(addMatch[1]) : 0,
      deletions: delMatch ? parseInt(delMatch[1]) : 0,
    });
  }

  // Compute age string
  const age = timeAgo(card.createdAt);

  // Build metrics display from scores
  const metrics = {};
  const metricStatus = {};
  if (card.scores && typeof card.scores === 'object') {
    for (const [key, val] of Object.entries(card.scores)) {
      metrics[key] = typeof val === 'number' ? val.toFixed(1) : String(val);
      // Simple heuristic: lower is better for certain keys
      const lowerIsBetter = ['cls', 'error rate', 'load', 'lcp'].includes(key.toLowerCase());
      if (typeof val === 'number') {
        metricStatus[key] = lowerIsBetter ? (val < 0.1 ? 'good' : val < 0.3 ? 'ok' : 'bad')
                                         : (val > 0.8 ? 'good' : val > 0.5 ? 'ok' : 'bad');
      }
    }
  }

  // Pick visual gradient from visual field
  const gradients = [
    'linear-gradient(145deg, #1a1a2e, #16213e 50%, #0f3460)',
    'linear-gradient(145deg, #1a1a2e, #1a0f2e 50%, #2d0f3e)',
    'linear-gradient(145deg, #0f2027, #203a43 50%, #2c5364)',
    'linear-gradient(145deg, #2d1b4e, #1a1a2e 50%, #0f3460)',
    'linear-gradient(145deg, #1b2a3d, #0f3460 50%, #16213e)',
  ];
  const gradientIdx = (card.iterationNumber - 1) % gradients.length;

  return {
    iteration: card.iterationNumber,
    score: card.compositeScore,
    delta: card.deltaScore,
    summary: card.agentSummary || 'No summary provided.',
    files: files.length ? files : [{ name: 'code.js', additions: 0, deletions: 0 }],
    visualGradient: gradients[gradientIdx],
    label: `Iteration ${card.iterationNumber}`,
    title: card.visual?.alt || `Experiment #${card.iterationNumber}`,
    body: card.deltaFromLast || 'First iteration for this problem.',
    metrics: Object.keys(metrics).length ? metrics : { Quality: card.compositeScore.toFixed(2) },
    metricStatus,
    age,
    round: card.roundNumber || 1,
    cardId: card.id,
    _rawCard: card,
  };
}

function timeAgo(isoStr) {
  if (!isoStr) return 'just now';
  try {
    const diff = Date.now() - new Date(isoStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch {
    return 'just now';
  }
}

// ── Rendering ─────────────────────────────────────────────────

let currentExperiments = [];

function renderFeed(experiments) {
  currentExperiments = experiments;
  const cardArea = document.getElementById('card-area');
  if (!cardArea) return;

  cardArea.innerHTML = experiments.map(renderCard).join('');
  updateScoreTrend(experiments);
  restoreScrollPosition(cardArea);
}

function renderCard(exp) {
  const isPositive = exp.delta >= 0;
  const deltaClass = isPositive ? 'positive' : 'negative';
  const deltaArrow = isPositive ? '↑' : '↓';
  const deltaStr = `${deltaArrow} ${Math.abs(exp.delta).toFixed(2)}`;

  const filesHtml = exp.files.map(f =>
    `<span class="code-ref-file">${escHtml(f.name)}</span>` +
    `<span class="code-ref-diff">+${f.additions} −${f.deletions}</span>`
  ).join('');

  const metricsHtml = Object.entries(exp.metrics).map(([label, value]) => {
    const status = exp.metricStatus?.[label] || 'good';
    const statusClass = status === 'bad' ? 'bad' : status === 'warn' ? 'ok' : '';
    return `<div class="slide-metric">
      <div class="metric-label">${escHtml(label)}</div>
      <div class="metric-value ${statusClass}">${escHtml(String(value))}</div>
    </div>`;
  }).join('');

  return `
    <div class="experiment-card"
         data-testid="experiment-card"
         data-card-id="${escHtml(exp.cardId)}"
         data-iteration="${exp.iteration}">
      <div class="card-header">
        <div class="card-meta">
          <span class="card-iteration">#${exp.iteration}</span>
          <span>Round ${exp.round} · ${escHtml(exp.age)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="card-delta ${deltaClass}">${deltaStr}</div>
          <div class="card-score">${exp.score.toFixed(2)}</div>
        </div>
      </div>
      <div class="card-visual card-clickable" data-card-id="${escHtml(exp.cardId)}">
        <div class="visual-placeholder">
          <div class="visual-slide" style="background:${exp.visualGradient}">
            <div class="slide-header">Experiment #${exp.iteration} — ${escHtml(exp.label)}</div>
            <div class="slide-title">${escHtml(exp.title)}</div>
            <div class="slide-body">${escHtml(exp.body)}</div>
            <div class="slide-metrics">${metricsHtml}</div>
          </div>
        </div>
      </div>
      <div class="card-footer">
        <div class="agent-summary card-clickable" data-card-id="${escHtml(exp.cardId)}">${escHtml(exp.summary)}</div>
        <div class="code-ref">${filesHtml}</div>
      </div>
    </div>`;
}

function updateScoreTrend(experiments) {
  const sparkline = document.getElementById('sparkline');
  const trendScore = document.getElementById('trend-score');
  const trendDelta = document.getElementById('trend-delta');
  const iterLabel = document.getElementById('iteration-label');

  if (!experiments.length) return;

  const scores = [...experiments].reverse().map(e => e.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;

  sparkline.innerHTML = scores.map((s, i) => {
    const pct = ((s - min) / range) * 60 + 35;
    const isLast = i === scores.length - 1;
    return `<div class="spark-bar${isLast ? ' last' : ''}" style="height:${pct}%"></div>`;
  }).join('');

  const latest = experiments[0];
  trendScore.textContent = latest.score.toFixed(2);
  const dArrow = latest.delta >= 0 ? '↑' : '↓';
  trendDelta.textContent = `${dArrow} ${Math.abs(latest.delta).toFixed(2)} from last`;
  trendDelta.style.color = latest.delta >= 0 ? 'var(--green)' : 'var(--red)';

  const totalExps = experiments.length;
  iterLabel.textContent = `Round ${latest.round} · ${totalExps} experiment${totalExps !== 1 ? 's' : ''}`;
}

// ── Card Detail View ──────────────────────────────────────────

let expandedCardId = null;

async function openCardDetail(cardId) {
  if (expandedCardId === cardId) {
    closeCardDetail();
    return;
  }
  expandedCardId = cardId;

  // Find the card in current experiments or fetch from API
  let card = null;
  const localExp = currentExperiments.find(e => e.cardId === cardId);
  if (localExp?._rawCard) {
    card = localExp._rawCard;
  }

  // Fetch full card details from API (includes all scores, feedback, etc.)
  if (!card && cardId && !cardId.startsWith('sample-')) {
    try {
      const res = await apiFetch(`/api/experiment-cards/${cardId}`);
      if (res.ok) card = res.card;
    } catch (err) {
      console.warn('[feed:card-detail] API fetch failed:', err.message);
    }
  }

  // Build detail view
  const detailContainer = document.createElement('div');
  detailContainer.id = 'card-detail';
  detailContainer.setAttribute('data-testid', 'card-detail');
  detailContainer.className = 'card-detail';

  if (!card) {
    detailContainer.innerHTML = `
      <div class="card-detail-header">
        <span class="card-detail-title">Card details unavailable</span>
        <button class="card-detail-close" id="card-detail-close">✕</button>
      </div>
      <div class="card-detail-body">
        <p>Could not load details for this experiment card.</p>
      </div>`;
  } else {
    // Full individual metric scores
    const allScores = card.scores || {};
    const scoresHtml = Object.entries(allScores).length > 0
      ? Object.entries(allScores).map(([name, value]) => {
          const display = typeof value === 'number' ? value.toFixed(3) : String(value);
          const pct = typeof value === 'number' ? Math.round(value * 100) : 50;
          const lowerIsBetter = ['cls', 'error rate', 'load', 'lcp'].includes(name.toLowerCase());
          const barColor = lowerIsBetter
            ? (value < 0.1 ? 'var(--green)' : value < 0.3 ? 'var(--yellow)' : 'var(--red)')
            : (value > 0.8 ? 'var(--green)' : value > 0.5 ? 'var(--yellow)' : 'var(--red)');
          return `<div class="detail-score-row">
            <span class="detail-score-name">${escHtml(name)}</span>
            <div class="detail-score-bar-wrap">
              <div class="detail-score-bar" style="width:${pct}%;background:${barColor}"></div>
            </div>
            <span class="detail-score-value">${display}</span>
          </div>`;
        }).join('')
      : '<p style="color:var(--muted)">No individual scores recorded.</p>';

    // Full agent explanation
    const agentExplain = card.agentSummary || card.deltaFromLast || 'No explanation provided.';

    // Full code diff summary
    const codeRef = card.codeReference || {};
    const diffHtml = codeRef.filePath
      ? `<div class="detail-code">
           <div class="detail-code-file">${escHtml(codeRef.filePath)}</div>
           ${codeRef.commitHash ? `<div class="detail-code-hash">${escHtml(codeRef.commitHash.slice(0, 12))}</div>` : ''}
           <div class="detail-code-diff">${escHtml(codeRef.diffSummary || 'No diff summary.')}</div>
         </div>`
      : '<p style="color:var(--muted)">No code reference available.</p>';

    // Feedback history
    const feedback = card.feedback;
    let feedbackHtml = '<p style="color:var(--muted)">No feedback recorded yet.</p>';
    if (feedback) {
      const fModality = feedback.modality || 'unknown';
      const fText = feedback.textContent || feedback.transcription || '';
      const fGesture = feedback.gesture || '';
      const fSentiment = feedback.sentiment || 'neutral';
      const fConstraints = Array.isArray(feedback.extractedConstraints) && feedback.extractedConstraints.length > 0
        ? feedback.extractedConstraints.map(c => `<li>${escHtml(c)}</li>`).join('')
        : '';
      const fTime = feedback.timestamp ? timeAgo(feedback.timestamp) : '';

      feedbackHtml = `
        <div class="detail-feedback">
          <div class="detail-feedback-meta">
            <span class="detail-feedback-sentiment ${fSentiment}">${escHtml(fSentiment)}</span>
            <span>${escHtml(fModality)}${fGesture ? ' · ' + escHtml(fGesture.replace('swipe_', '')) : ''}</span>
            ${fTime ? `<span> · ${escHtml(fTime)}</span>` : ''}
          </div>
          ${fText ? `<div class="detail-feedback-text">"${escHtml(fText)}"</div>` : ''}
          ${fConstraints ? `<ul class="detail-feedback-constraints">${fConstraints}</ul>` : ''}
        </div>`;
    }

    // Visual (larger)
    const gradients = [
      'linear-gradient(145deg, #1a1a2e, #16213e 50%, #0f3460)',
      'linear-gradient(145deg, #1a1a2e, #1a0f2e 50%, #2d0f3e)',
      'linear-gradient(145deg, #0f2027, #203a43 50%, #2c5364)',
      'linear-gradient(145deg, #2d1b4e, #1a1a2e 50%, #0f3460)',
      'linear-gradient(145deg, #1b2a3d, #0f3460 50%, #16213e)',
    ];
    const gIdx = (card.iterationNumber - 1) % gradients.length;
    const statusBadge = card.status === 'kept' ? '✅ kept' : card.status === 'discarded' ? '❌ discarded' : '⏳ pending';

    detailContainer.innerHTML = `
      <div class="card-detail-header">
        <div>
          <span class="card-detail-title">#${card.iterationNumber} — ${escHtml(card.visual?.alt || `Experiment #${card.iterationNumber}`)}</span>
          <span class="card-detail-status">${statusBadge}</span>
        </div>
        <button class="card-detail-close" id="card-detail-close">✕</button>
      </div>
      <div class="card-detail-body">
        <div class="detail-visual-large">
          <div class="visual-slide" style="background:${gradients[gIdx]}">
            <div class="slide-header">Experiment #${card.iterationNumber}</div>
            <div class="slide-title">${escHtml(card.visual?.alt || '')}</div>
            <div class="slide-body">${escHtml(card.deltaFromLast || card.agentSummary || '')}</div>
          </div>
        </div>

        <div class="detail-section">
          <h4 class="detail-section-title">📊 All Metric Scores</h4>
          <div class="detail-scores">${scoresHtml}</div>
          <div class="detail-composite">
            Composite: <strong>${(card.compositeScore || 0).toFixed(3)}</strong>
            ${typeof card.deltaScore === 'number' ? ` (Δ ${card.deltaScore >= 0 ? '↑' : '↓'}${Math.abs(card.deltaScore).toFixed(3)})` : ''}
          </div>
        </div>

        <div class="detail-section">
          <h4 class="detail-section-title">🤖 Agent Explanation</h4>
          <p class="detail-explanation">${escHtml(agentExplain)}</p>
        </div>

        <div class="detail-section">
          <h4 class="detail-section-title">📝 Code Changes</h4>
          ${diffHtml}
        </div>

        <div class="detail-section">
          <h4 class="detail-section-title">💬 Feedback</h4>
          ${feedbackHtml}
        </div>
      </div>`;
  }

  // Remove any existing detail view
  const existing = document.getElementById('card-detail');
  if (existing) existing.remove();

  // Insert after card area
  const cardArea = document.getElementById('card-area');
  if (cardArea && cardArea.parentNode) {
    cardArea.parentNode.insertBefore(detailContainer, cardArea.nextSibling);
  }

  // Animate in
  requestAnimationFrame(() => {
    detailContainer.classList.add('card-detail-visible');
  });

  // Close button
  document.getElementById('card-detail-close')?.addEventListener('click', closeCardDetail);

  // Scroll detail into view
  detailContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeCardDetail() {
  expandedCardId = null;
  const detail = document.getElementById('card-detail');
  if (!detail) return;
  detail.classList.remove('card-detail-visible');
  detail.classList.add('card-detail-closing');
  setTimeout(() => detail.remove(), 300);
}

// ── Save Game ─────────────────────────────────────────────────

async function createSaveGame() {
  const storyId = getLastStoryId();
  if (!storyId) {
    alert('No active problem story to save.');
    return;
  }

  const label = prompt('Checkpoint label (optional):') || undefined;

  try {
    const res = await apiFetch('/api/save-games', {
      method: 'POST',
      body: JSON.stringify({ problemStoryId: storyId, label }),
    });
    if (res.ok) {
      const sg = res.saveGame;
      const iterCount = sg.totalIterationsAtSave;
      const bestScore = sg.bestCompositeScore;
      alert(`💾 Checkpoint saved!\n${label ? 'Label: ' + label + '\n' : ''}Iterations: ${iterCount}\nBest score: ${bestScore}`);
    }
  } catch (err) {
    alert('Failed to create checkpoint: ' + err.message);
  }
}

async function loadSaveGame() {
  try {
    const storyId = getLastStoryId();
    const res = await apiFetch(`/api/save-games${storyId ? '?problemStoryId=' + storyId : ''}`);
    if (!res.ok || !res.saveGames || res.saveGames.length === 0) {
      alert('No checkpoints found for this story.');
      return;
    }

    // Build a simple picker
    const options = res.saveGames.map((sg, i) =>
      `[${i + 1}] ${sg.label || 'Unnamed'} (${timeAgo(sg.createdAt)}) — iter ${sg.totalIterationsAtSave}, best ${sg.bestCompositeScore}`
    ).join('\n');

    const choice = prompt(`Load checkpoint:\n${options}\n\nEnter number (or cancel):`);
    if (!choice) return;

    const idx = parseInt(choice) - 1;
    const sg = res.saveGames[idx];
    if (!sg) {
      alert('Invalid selection.');
      return;
    }

    const loadRes = await apiFetch(`/api/save-games/${sg.id}/load`, { method: 'POST' });
    if (loadRes.ok) {
      alert(`✅ Restored to iteration ${loadRes.totalIterationsAtSave}`);
      await loadFeedFromApi(sg.problemStoryId);
    }
  } catch (err) {
    alert('Failed to load checkpoint: ' + err.message);
  }
}

// ── Scroll position persistence ───────────────────────────────

function restoreScrollPosition(el) {
  try {
    const pos = localStorage.getItem(STORAGE_KEY);
    if (pos) el.scrollTop = parseInt(pos, 10);
  } catch { /* noop */ }
}

function persistScrollPosition() {
  const el = document.getElementById('card-area');
  if (!el) return;
  try { localStorage.setItem(STORAGE_KEY, el.scrollTop); } catch { /* noop */ }
}

// ── Tab switching ─────────────────────────────────────────────

function initTabs() {
  const tabs = document.querySelectorAll('.feed-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });
}

// ── Mic button toggle ─────────────────────────────────────────

function initMic() {
  const btn = document.getElementById('mic-btn');
  if (!btn) return;
  btn.addEventListener('click', () => btn.classList.toggle('recording'));
}

// ── Close button ──────────────────────────────────────────────

function initClose() {
  const btn = document.getElementById('close-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = '/';
  });
}

// ── Save/Load buttons in top bar ─────────────────────────────

function initSaveButtons() {
  const saveBtn = document.querySelector('.top-btn[title="Save"]');
  if (saveBtn) {
    saveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      createSaveGame();
    });
  }

  const storyBtn = document.querySelector('.top-btn[title="Story"]');
  if (storyBtn) {
    storyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      loadSaveGame();
    });
  }
}

// ── Card click delegation ─────────────────────────────────────

function initCardClicks() {
  const cardArea = document.getElementById('card-area');
  if (!cardArea) return;

  cardArea.addEventListener('click', (e) => {
    const clickable = e.target.closest('.card-clickable');
    if (!clickable) return;
    const cardId = clickable.dataset.cardId;
    if (cardId) openCardDetail(cardId);
  });
}

// ── "Create Test Problem" button ──────────────────────────────

function injectTestButton() {
  const tabsBar = document.querySelector('.feed-tabs');
  if (!tabsBar) return;
  if (document.getElementById('seed-test-btn')) return; // already injected

  const btn = document.createElement('button');
  btn.id = 'seed-test-btn';
  btn.textContent = '🧪 Create Test Problem';
  btn.style.cssText = 'margin-left:auto;padding:4px 12px;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;cursor:pointer;';
  tabsBar.appendChild(btn);

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.textContent = '⏳ Seeding…';
    try {
      await seedTestData();
      btn.textContent = '✅ Seeded!';
    } catch (err) {
      btn.textContent = '❌ Failed';
      console.error('[seed]', err);
    }
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = '🧪 Create Test Problem';
    }, 2000);
  });
}

/**
 * Full seed flow:
 *  a) POST /api/problem-stories — create a problem story
 *  b) GET eval-proposals — see proposed metrics
 *  c) POST eval-confirm — activate the problem
 *  d) POST 3 sample experiment cards
 *  e) Refresh the feed
 */
async function seedTestData() {
  // (a) Create problem story
  const story = await apiFetch('/api/problem-stories', {
    method: 'POST',
    body: JSON.stringify({
      problemDescription: 'Optimize landing page conversion rate — hero section feels cluttered, CTA is below fold, and navigation has too many items.',
    }),
  });
  const storyId = story.id;
  setLastStoryId(storyId);

  // Update problem title in UI
  const titleEl = document.getElementById('problem-title');
  if (titleEl) titleEl.textContent = story.problemDescription;

  // (b) Get proposed metrics
  const proposals = await apiFetch(`/api/problem-stories/${storyId}/eval-proposals`);
  console.log('[seed] Proposed metrics:', proposals.proposedMetrics?.length);

  // Accept the proposed metrics (POST each one)
  for (const metric of proposals.proposedMetrics || []) {
    await apiFetch(`/api/problem-stories/${storyId}/eval-proposals/metrics`, {
      method: 'POST',
      body: JSON.stringify({
        name: metric.name,
        type: metric.type,
        direction: metric.direction,
        unit: metric.unit,
        range: metric.range,
        assessmentPrompt: metric.assessmentPrompt,
      }),
    });
  }

  // (c) Confirm eval to activate the problem
  await apiFetch(`/api/problem-stories/${storyId}/eval-confirm`, {
    method: 'POST',
    body: JSON.stringify({}),
  });

  // (d) Post 3 sample experiment cards
  const sampleCards = [
    {
      agentSummary: 'High-contrast dark palette. Accent only on CTAs. Accessibility AA reached.',
      deltaFromLast: 'First iteration — establishing baseline.',
      visual: { type: 'css_gradient', alt: 'Color System — high-contrast dark palette' },
      codeReference: { filePath: 'theme.css', diffSummary: '+18 -34', commitHash: 'a1b2c3d4e5f6' },
      scores: { 'Response time': 0.85, 'Visual quality': 0.80 },
      compositeScore: 0.83,
      status: 'kept',
      roundNumber: 1,
      durationMs: 32000,
    },
    {
      agentSummary: 'Full-width gradient hero with centered CTA and floating nav. CLS regression on nav.',
      deltaFromLast: 'Bolder hero but nav instability.',
      visual: { type: 'css_gradient', alt: 'Layout A — full-width hero' },
      codeReference: { filePath: 'hero.css', diffSummary: '+31 -12', commitHash: 'b2c3d4e5f6a7' },
      scores: { 'Response time': 0.70, 'Visual quality': 0.72, 'CLS': 0.30 },
      compositeScore: 0.87,
      status: 'discarded',
      roundNumber: 1,
      durationMs: 45000,
    },
    {
      agentSummary: 'Moved CTA inline with hero headline. Added trust badges. Reduced nav to 4 items.',
      deltaFromLast: 'Fixed CLS, improved visual weight balance.',
      visual: { type: 'css_gradient', alt: 'Layout B — inline CTA + social proof' },
      codeReference: { filePath: 'hero.css', diffSummary: '+24 -18', commitHash: 'c3d4e5f6a7b8' },
      scores: { 'Response time': 0.92, 'Visual quality': 0.90, 'CLS': 0.95 },
      compositeScore: 0.91,
      status: 'pending_review',
      roundNumber: 1,
      durationMs: 38000,
    },
  ];

  for (const cardData of sampleCards) {
    await apiFetch(`/api/problem-stories/${storyId}/experiment-cards`, {
      method: 'POST',
      body: JSON.stringify(cardData),
    });
  }

  // (e) Refresh the feed
  await loadFeedFromApi(storyId);
}

// ── Feed loading from API ─────────────────────────────────────

async function loadFeedFromApi(storyId) {
  if (!storyId) return false;
  try {
    const data = await apiFetch(`/api/problem-stories/${storyId}/experiment-cards`);
    if (!data.ok || !data.cards || data.cards.length === 0) return false;

    const experiments = data.cards.map(apiCardToDisplay);
    renderFeed(experiments);

    // Update problem title
    try {
      const story = await apiFetch(`/api/problem-stories/${storyId}`);
      const titleEl = document.getElementById('problem-title');
      if (titleEl && story.problemDescription) {
        titleEl.textContent = story.problemDescription;
      }
    } catch { /* ignore story fetch failure */ }

    return true;
  } catch {
    return false;
  }
}

async function loadLatestStoryId() {
  try {
    const story = await apiFetch('/api/problem-stories/latest');
    return story.id || null;
  } catch {
    return null;
  }
}

// ── Utilities ─────────────────────────────────────────────────

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ── Bootstrap ─────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  initTabs();
  initMic();
  initClose();
  initSaveButtons();
  initCardClicks();
  injectTestButton();

  const cardArea = document.getElementById('card-area');
  if (cardArea) {
    cardArea.addEventListener('scroll', persistScrollPosition, { passive: true });
  }

  // Try loading from API: first check saved story ID, then fall back to latest
  let storyId = getLastStoryId();
  if (!storyId) {
    storyId = await loadLatestStoryId();
  }

  let loaded = false;
  if (storyId) {
    loaded = await loadFeedFromApi(storyId);
  }

  // Graceful fallback to sample data
  if (!loaded) {
    console.info('[feed] No API data — rendering sample experiments as fallback.');
    renderFeed(SAMPLE_EXPERIMENTS);
  }
});
