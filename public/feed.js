// feed.js — ZHC1 iteration feed rendering logic

const STORAGE_KEY = 'zhc1-feed-scroll';

// ── Sample data (3 experiment cards) ──────────────────────────
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
  },
];

// ── Rendering ─────────────────────────────────────────────────
function renderFeed(experiments) {
  const cardArea = document.getElementById('card-area');
  if (!cardArea) return;

  // Cards are already newest-first in the array
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
      <div class="card-visual">
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
        <div class="agent-summary">${escHtml(exp.summary)}</div>
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

  // Build sparkline from scores (chronological order, oldest → newest)
  const scores = [...experiments].reverse().map(e => e.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;

  sparkline.innerHTML = scores.map((s, i) => {
    const pct = ((s - min) / range) * 60 + 35; // 35%–95%
    const isLast = i === scores.length - 1;
    return `<div class="spark-bar${isLast ? ' last' : ''}" style="height:${pct}%"></div>`;
  }).join('');

  const latest = experiments[0];
  trendScore.textContent = latest.score.toFixed(2);
  const dArrow = latest.delta >= 0 ? '↑' : '↓';
  trendDelta.textContent = `${dArrow} ${Math.abs(latest.delta).toFixed(2)} from last`;
  trendDelta.style.color = latest.delta >= 0 ? 'var(--green)' : 'var(--red)';

  // Compute rounds/experiments summary
  const totalExps = experiments.length;
  iterLabel.textContent = `Round 1 · ${totalExps} experiment${totalExps !== 1 ? 's' : ''}`;
}

// ── Scroll position persistence ───────────────────────────────
function restoreScrollPosition(el) {
  try {
    const pos = localStorage.getItem(STORAGE_KEY);
    if (pos) el.scrollTop = parseInt(pos, 10);
  } catch { /* storage unavailable */ }
}

function persistScrollPosition() {
  const el = document.getElementById('card-area');
  if (!el) return;
  try {
    localStorage.setItem(STORAGE_KEY, el.scrollTop);
  } catch { /* storage unavailable */ }
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

// ── Utilities ─────────────────────────────────────────────────
function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ── Bootstrap ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderFeed(SAMPLE_EXPERIMENTS);
  initTabs();
  initMic();
  initClose();

  const cardArea = document.getElementById('card-area');
  if (cardArea) {
    cardArea.addEventListener('scroll', persistScrollPosition, { passive: true });
  }
});
