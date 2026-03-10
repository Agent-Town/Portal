(function () {
  const titleEl = document.getElementById('pokerTitle');
  const subtitleEl = document.getElementById('pokerSubtitle');
  const statusEl = document.getElementById('pokerStatus');
  const contentEl = document.getElementById('pokerContent');
  const isEmbedded = new URLSearchParams(window.location.search).get('embed') === '1';

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

  function stableJsonValue(value) {
    if (Array.isArray(value)) return value.map((item) => stableJsonValue(item));
    if (value && typeof value === 'object') {
      return Object.keys(value).sort().reduce((acc, key) => {
        acc[key] = stableJsonValue(value[key]);
        return acc;
      }, {});
    }
    return value;
  }

  function stableJsonStringify(value) {
    return JSON.stringify(stableJsonValue(value));
  }

  async function sha256PrefixedHex(value) {
    if (!window.crypto?.subtle) throw new Error('CRYPTO_UNAVAILABLE');
    const input = new TextEncoder().encode(String(value || ''));
    const digest = await window.crypto.subtle.digest('SHA-256', input);
    const hex = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
    return `sha256:${hex}`;
  }

  async function computeSubmissionBundleHashes({ artifactUri, entrypoint, declaredCapabilities }) {
    const normalizedCapabilities = stableJsonValue(declaredCapabilities || {});
    const contentAddress = await sha256PrefixedHex(stableJsonStringify({
      artifactUri,
      entrypoint,
      declaredCapabilities: normalizedCapabilities,
    }));
    const manifestHash = await sha256PrefixedHex(stableJsonStringify({
      schema: 'agent-town-poker-bundle/v1',
      bundle: {
        contentAddress,
        artifactUri,
        entrypoint,
      },
      declaredCapabilities: normalizedCapabilities,
    }));
    return {
      contentAddress,
      manifestHash,
    };
  }

  function renderRulesSummaryHtml(rulesSummary) {
    const summary = rulesSummary && typeof rulesSummary === 'object' ? rulesSummary : {};
    const highlights = Array.isArray(summary.highlights) ? summary.highlights : [];
    return `
      <div id="seasonRulesSummary">${escapeHtml(summary.summary || 'No mirrored rules summary.')}</div>
      ${
        highlights.length
          ? `<ul>${highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
          : ''
      }
    `;
  }

  function formatSubmissionWindowText(submissionWindow) {
    const state = String(submissionWindow?.state || 'scheduled');
    const statusLabel = submissionWindow?.acceptingSubmissions ? 'accepting submissions' : 'not accepting submissions';
    return `${state} · ${statusLabel}`;
  }

  async function api(path, options = {}) {
    const headers = {
      Accept: 'application/json',
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

  function renderCards(items) {
    if (!contentEl) return;
    contentEl.innerHTML = '';
    for (const item of items) {
      const card = document.createElement('article');
      card.className = 'pokerCard';
      card.innerHTML = item;
      contentEl.appendChild(card);
    }
  }

  async function loadIndex() {
    setTitle('Portal Poker', 'Operator-authoritative seasons mirrored into Portal without score rewriting.');
    setStatus('Loading mirrored seasons...');
    const payload = await api('/api/poker/seasons');
    const items = Array.isArray(payload?.data?.items) ? payload.data.items : [];
    if (!items.length) {
      setStatus('No mirrored seasons yet.');
      renderCards([
        '<h2>No seasons yet.</h2><p>Run a mirror sync before opening poker pages.</p>',
      ]);
      return;
    }
    setStatus(`${items.length} season${items.length === 1 ? '' : 's'} loaded.`);
    renderCards(items.map((item) => {
      const latestReplayRunId = item?.latestReplayHighlight?.runId || '';
      const latestLeaderboardSnapshotId = item?.latestLeaderboardSnapshot?.snapshotId || '';
      return `
        <h2>${escapeHtml(item.displayName)}</h2>
        <div>${escapeHtml(item.seasonSlug)}</div>
        <div class="pokerMeta">
          <span class="pokerBadge">${escapeHtml(item.status)}</span>
          <span class="pokerBadge">${escapeHtml(item.rulesVersion || 'rules')}</span>
          <span class="pokerBadge">${escapeHtml(item.operatorVersion || 'operator')}</span>
        </div>
        <div class="pokerLinks">
          <a href="${escapeHtml(buildPokerHref(`/poker/seasons/${encodeURIComponent(item.seasonId)}`))}">Season</a>
          <a href="${escapeHtml(buildPokerHref(`/poker/leaderboards/${encodeURIComponent(item.seasonId)}`))}">Leaderboard</a>
          ${latestReplayRunId ? `<a href="${escapeHtml(buildPokerHref(`/poker/replays/${encodeURIComponent(latestReplayRunId)}`))}">Replay</a>` : ''}
          ${latestLeaderboardSnapshotId ? `<span class="pokerBadge">snapshot ${escapeHtml(latestLeaderboardSnapshotId)}</span>` : ''}
        </div>
      `;
    }));
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
        <div class="pokerMeta">
          <span class="pokerBadge">${escapeHtml(season.status)}</span>
          <span class="pokerBadge">${escapeHtml(season.rulesVersion || 'rules')}</span>
          <span class="pokerBadge">${escapeHtml(season.operatorVersion || 'operator')}</span>
        </div>
        <div class="pokerLinks">
          <a href="${escapeHtml(buildPokerHref(`/poker/leaderboards/${encodeURIComponent(season.seasonId)}`))}">Latest leaderboard</a>
          <a href="${escapeHtml(buildPokerHref(`/poker/leaderboards/${encodeURIComponent(season.seasonId)}/snapshots`))}">Snapshot history</a>
          ${season?.latestReplayHighlight?.runId ? `<a href="${escapeHtml(buildPokerHref(`/poker/runs/${encodeURIComponent(season.latestReplayHighlight.runId)}`))}">Run detail</a>` : ''}
          ${season?.latestReplayHighlight?.runId ? `<a href="${escapeHtml(buildPokerHref(`/poker/replays/${encodeURIComponent(season.latestReplayHighlight.runId)}`))}">Replay</a>` : ''}
        </div>
      `,
      `
        <h3>Season Rules</h3>
        <p id="seasonRulesSummary">${escapeHtml(season?.rulesSummary?.summary || 'Rules summary unavailable.')}</p>
        ${
          Array.isArray(season?.rulesSummary?.highlights) && season.rulesSummary.highlights.length
            ? `<ul id="seasonRulesHighlights">${season.rulesSummary.highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
            : ''
        }
        <div id="seasonSubmissionWindow" class="pokerMeta">
          <span id="seasonWindowState" class="pokerBadge">${escapeHtml(season?.submissionWindow?.state || season.status || 'scheduled')}</span>
          <span class="pokerBadge">${escapeHtml(season?.submissionWindow?.acceptingSubmissions ? 'accepting submissions' : 'submissions closed')}</span>
          <span class="pokerBadge">${escapeHtml(season?.submissionWindow?.opensAt || season.submissionOpenAt || 'opens unknown')}</span>
          <span class="pokerBadge">${escapeHtml(season?.submissionWindow?.closesAt || season.submissionCloseAt || 'closes unknown')}</span>
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
            <input id="bundleContentAddress" name="contentAddress" placeholder="sha256:..." value="${escapeHtml(season?.bundleDraft?.expectedContentAddress || season?.bundleDraft?.contentAddress || '')}" readonly>
          </label>
          <label>
            Bundle Manifest Hash
            <input id="bundleManifestHash" name="manifestHash" placeholder="sha256:..." value="${escapeHtml(season?.bundleDraft?.expectedManifestHash || '')}" readonly>
          </label>
          <div class="pokerMeta"><span class="pokerBadge">Computed hash</span><span id="bundleComputedHash">${escapeHtml(season?.bundleDraft?.expectedManifestHash || 'Awaiting bundle fields...')}</span></div>
          <label>
            Artifact URI
            <input id="bundleArtifactUri" name="artifactUri" placeholder="s3://..." value="${escapeHtml(season?.bundleDraft?.artifactUri || 's3://operator/submissions/demo.zip')}">
          </label>
          <label>
            Entrypoint
            <input id="bundleEntrypoint" name="entrypoint" value="${escapeHtml(season?.bundleDraft?.entrypoint || 'play.py')}">
          </label>
          <label>
            Declared Capabilities JSON
            <textarea id="bundleCapabilities">${escapeHtml(JSON.stringify(season?.bundleDraft?.declaredCapabilities || { browserCompatible: false }, null, 2))}</textarea>
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
    const contentAddressInput = document.getElementById('bundleContentAddress');
    const manifestHashInput = document.getElementById('bundleManifestHash');
    const artifactUriInput = document.getElementById('bundleArtifactUri');
    const entrypointInput = document.getElementById('bundleEntrypoint');
    const capabilitiesInput = document.getElementById('bundleCapabilities');
    const computedHashEl = document.getElementById('bundleComputedHash');

    async function recomputeBundleHash() {
      let declaredCapabilities = {};
      try {
        declaredCapabilities = JSON.parse(String(capabilitiesInput?.value || '{}'));
      } catch {
        if (manifestHashInput) manifestHashInput.value = '';
        if (computedHashEl) computedHashEl.textContent = 'Awaiting valid capabilities JSON';
        return null;
      }
      const bundle = {
        artifactUri: String(artifactUriInput?.value || '').trim(),
        entrypoint: String(entrypointInput?.value || '').trim(),
      };
      if (!bundle.artifactUri || !bundle.entrypoint) {
        if (contentAddressInput) contentAddressInput.value = '';
        if (manifestHashInput) manifestHashInput.value = '';
        if (computedHashEl) computedHashEl.textContent = 'Awaiting bundle fields';
        return null;
      }
      const hashes = await computeSubmissionBundleHashes({
        artifactUri: bundle.artifactUri,
        entrypoint: bundle.entrypoint,
        declaredCapabilities,
      });
      if (contentAddressInput) contentAddressInput.value = hashes.contentAddress;
      if (manifestHashInput) manifestHashInput.value = hashes.manifestHash;
      if (computedHashEl) computedHashEl.textContent = hashes.manifestHash;
      return {
        bundle,
        contentAddress: hashes.contentAddress,
        declaredCapabilities,
        manifestHash: hashes.manifestHash,
      };
    }

    for (const control of [artifactUriInput, entrypointInput, capabilitiesInput]) {
      control?.addEventListener('input', () => {
        recomputeBundleHash().catch(() => {
          if (computedHashEl) computedHashEl.textContent = 'Bundle hash unavailable';
        });
      });
    }
    recomputeBundleHash().catch(() => {
      if (computedHashEl) computedHashEl.textContent = 'Bundle hash unavailable';
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setStatus('Submitting bundle...');
      const computed = await recomputeBundleHash();
      if (!computed) {
        setStatus('Bundle hash requires valid bundle fields and capabilities JSON.');
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
              contentAddress: computed.contentAddress,
              manifestHash: computed.manifestHash,
              artifactUri: computed.bundle.artifactUri,
              entrypoint: computed.bundle.entrypoint,
            },
            declaredCapabilities: computed.declaredCapabilities,
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
        <div class="pokerMeta">
          <span class="pokerBadge">season ${escapeHtml(seasonId)}</span>
          <span class="pokerBadge">snapshot ${escapeHtml(snapshotId || 'latest')}</span>
        </div>
        <div class="pokerLinks">
          <a href="${escapeHtml(buildPokerHref(`/poker/leaderboards/${encodeURIComponent(seasonId)}/snapshots`))}">Snapshot history</a>
        </div>
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
            ${
              rankings.map((entry) => `
                <tr data-rank="${escapeHtml(entry.rank)}">
                  <td class="leaderboard-rank">${escapeHtml(entry.rank)}</td>
                  <td class="leaderboard-name">${escapeHtml(entry.displayName || entry.submissionId)}</td>
                  <td class="leaderboard-rating">${escapeHtml(entry.rating)}</td>
                  <td>${escapeHtml(entry.games)}</td>
                  <td>${escapeHtml(entry.wins)}</td>
                </tr>
              `).join('')
            }
          </tbody>
        </table>
      `,
    ]);
  }

  async function loadSnapshotHistory(seasonId) {
    setTitle('Poker Snapshot History', `Mirrored snapshot history for ${seasonId}.`);
    setStatus('Loading snapshot history...');
    const payload = await api(`/api/poker/leaderboards/${encodeURIComponent(seasonId)}/snapshots`);
    const items = Array.isArray(payload?.data?.items) ? payload.data.items : [];
    if (!items.length) {
      setStatus('No mirrored snapshot history yet.');
      renderCards([
        '<h2>No snapshot history yet.</h2><p>The page stays stable and empty until mirrored snapshots arrive.</p>',
      ]);
      return;
    }
    setStatus(`${items.length} snapshot${items.length === 1 ? '' : 's'} loaded.`);
    renderCards([
      `
        <h2>Snapshot History</h2>
        <div class="pokerMeta">
          <span class="pokerBadge">season ${escapeHtml(seasonId)}</span>
        </div>
        <table class="pokerTable">
          <thead>
            <tr>
              <th>Snapshot</th>
              <th>Created At</th>
              <th>Rows</th>
            </tr>
          </thead>
          <tbody id="pokerSnapshotHistoryRows">
            ${
              items.map((entry) => `
                <tr data-snapshot-id="${escapeHtml(entry.snapshotId)}">
                  <td class="snapshot-history-id">${escapeHtml(entry.snapshotId)}</td>
                  <td>${escapeHtml(entry.createdAt)}</td>
                  <td>${escapeHtml(entry.rankingsCount)}</td>
                </tr>
              `).join('')
            }
          </tbody>
        </table>
      `,
    ]);
  }

  async function loadRun(runId) {
    setTitle('Poker Run', `Mirrored operator run detail for ${runId}.`);
    setStatus('Loading run detail...');
    try {
      const payload = await api(`/api/poker/runs/${encodeURIComponent(runId)}`);
      const run = payload?.data?.run || null;
      if (!run) throw new Error('NOT_FOUND');
      const seatResults = Array.isArray(run.seatResults) ? run.seatResults : [];
      setStatus(`Run ${runId} loaded.`);
      renderCards([
        `
          <h2>Run Detail</h2>
          <div class="pokerMeta">
            <span class="pokerBadge">${escapeHtml(run.runId)}</span>
            <span id="runSubmissionId" class="pokerBadge">${escapeHtml(run.submissionId || 'submission unavailable')}</span>
            <span class="pokerBadge">${escapeHtml(run.seasonId || 'season')}</span>
          </div>
          <div class="pokerMeta">
            <span class="pokerBadge">fingerprint</span>
            <span id="runDetailFingerprint">${escapeHtml(run.fingerprint || 'unavailable')}</span>
          </div>
          <div class="pokerSummary">
            <div>
              <div>Winner Seat</div>
              <div class="pokerSummaryValue">${escapeHtml(run.winnerSeat)}</div>
            </div>
            <div>
              <div>Turns</div>
              <div class="pokerSummaryValue">${escapeHtml(run.turns)}</div>
            </div>
            <div>
              <div>Seed</div>
              <div class="pokerSummaryValue">${escapeHtml(run.seed)}</div>
            </div>
          </div>
          <div class="pokerLinks">
            ${run.replayReady ? `<a id="runReplayLink" href="${escapeHtml(buildPokerHref(`/poker/replays/${encodeURIComponent(run.runId)}`))}">Replay</a>` : '<span class="pokerBadge">Replay unavailable</span>'}
          </div>
        `,
        `
          <h3>Seat Results</h3>
          ${
            seatResults.length
              ? `
                <table class="pokerTable">
                  <thead>
                    <tr>
                      <th>Seat</th>
                      <th>Placement</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody id="pokerRunSeatRows">
                    ${
                      seatResults.map((entry) => `
                        <tr>
                          <td>${escapeHtml(entry.seat)}</td>
                          <td>${escapeHtml(entry.finishRank ?? entry.placement)}</td>
                          <td>${escapeHtml(entry.chips ?? entry.chipDelta)}</td>
                        </tr>
                      `).join('')
                    }
                  </tbody>
                </table>
              `
              : '<p>No seat results mirrored for this run.</p>'
          }
        `,
      ]);
    } catch (err) {
      setStatus(`Run unavailable: ${err.code || err.message || 'UNKNOWN'}`);
      renderCards(['<h2>Run unavailable.</h2>']);
    }
  }

  async function loadReplay(runId) {
    setTitle('Poker Replay', `Hash-verified replay manifest for ${runId}.`);
    setStatus('Loading replay manifest...');
    try {
      const payload = await api(`/api/poker/runs/${encodeURIComponent(runId)}/replay`);
      const replay = payload?.data?.replay || {};
      const summary = replay?.summaryJson || payload?.data?.summary || {};
      setStatus(`Replay manifest verified for ${runId}.`);
      renderCards([
        `
          <h2>Replay Manifest</h2>
          <div class="pokerMeta">
            <span class="pokerBadge">${escapeHtml(replay.replayFormat || 'unknown')}</span>
            <span class="pokerBadge">${escapeHtml(replay.artifactSha256 || 'no-hash')}</span>
          </div>
          <div class="pokerSummary">
            <div>
              <div>Winner Seat</div>
              <div id="replayWinnerSeat" class="pokerSummaryValue">${escapeHtml(summary.winnerSeat)}</div>
            </div>
            <div>
              <div>Turns</div>
              <div id="replayTurns" class="pokerSummaryValue">${escapeHtml(summary.turns)}</div>
            </div>
            <div>
              <div>Seed</div>
              <div id="replaySeed" class="pokerSummaryValue">${escapeHtml(summary.seed)}</div>
            </div>
          </div>
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
    setTitle('Poker Submission', `Portal-owned submission status for ${submissionId}.`);
    setStatus('Loading submission status...');
    try {
      const payload = await api(`/api/poker/submissions/${encodeURIComponent(submissionId)}`);
      const submission = payload?.data?.submission || null;
      if (!submission) throw new Error('NOT_FOUND');
      setStatus(`Submission ${submissionId} loaded.`);
      renderCards([
        `
          <h2>Submission Status</h2>
          <div class="pokerMeta">
            <span class="pokerBadge">${escapeHtml(submission.status || 'unknown')}</span>
            <span class="pokerBadge">${escapeHtml(submission.seasonId || 'season')}</span>
          </div>
          <pre>${escapeHtml(JSON.stringify(submission.validation || {}, null, 2))}</pre>
        `,
      ]);
    } catch (err) {
      setStatus(`Submission unavailable: ${err.code || err.message || 'UNKNOWN'}`);
      renderCards(['<h2>Submission unavailable.</h2>']);
    }
  }

  async function boot() {
    const path = window.location.pathname;
    try {
      if (path === '/poker') return await loadIndex();
      const seasonMatch = path.match(/^\/poker\/seasons\/([^/]+)$/);
      if (seasonMatch) return await loadSeason(decodeURIComponent(seasonMatch[1]));
      const snapshotHistoryMatch = path.match(/^\/poker\/leaderboards\/([^/]+)\/snapshots$/);
      if (snapshotHistoryMatch) return await loadSnapshotHistory(decodeURIComponent(snapshotHistoryMatch[1]));
      const leaderboardMatch = path.match(/^\/poker\/leaderboards\/([^/]+)$/);
      if (leaderboardMatch) return await loadLeaderboard(decodeURIComponent(leaderboardMatch[1]));
      const runMatch = path.match(/^\/poker\/runs\/([^/]+)$/);
      if (runMatch) return await loadRun(decodeURIComponent(runMatch[1]));
      const replayMatch = path.match(/^\/poker\/replays\/([^/]+)$/);
      if (replayMatch) return await loadReplay(decodeURIComponent(replayMatch[1]));
      const submissionMatch = path.match(/^\/poker\/submissions\/([^/]+)$/);
      if (submissionMatch) return await loadSubmission(decodeURIComponent(submissionMatch[1]));
      setStatus('Unknown poker route.');
      renderCards(['<h2>Unknown poker route.</h2>']);
    } catch (err) {
      setStatus(`Poker page failed: ${err.code || err.message || 'UNKNOWN'}`);
      renderCards(['<h2>Poker page failed to load.</h2>']);
    }
  }

  boot();
})();
