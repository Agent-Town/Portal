async function api(url) {
  const res = await fetch(url, { credentials: 'include' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `HTTP_${res.status}`);
  return data;
}

function el(id) {
  return document.getElementById(id);
}

function escapeAttr(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function renderHouseCard(house) {
  const houseId = typeof house?.houseId === 'string' ? house.houseId : '';
  const displayName = String(house?.housePublicJson?.displayName || 'House');
  const tagline = String(house?.housePublicJson?.tagline || '');
  const footprintTiles = Math.max(1, Number(house?.footprint?.tiles || 1));
  const maxTiles = Math.max(footprintTiles, Number(house?.footprint?.maxTiles || footprintTiles));
  const updatedAt = typeof house?.updatedAt === 'string' ? house.updatedAt : '';

  return `
    <article class="panel" data-testid="town-house-card" data-house-id="${escapeAttr(houseId)}" style="margin:0;">
      <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start;">
        <div>
          <h2 style="margin:0; font-size:1.1rem;">${escapeHtml(displayName)}</h2>
          <div class="small" style="margin-top:6px; color: var(--muted);">${escapeHtml(tagline || 'Public house')}</div>
        </div>
        <span class="pill">${footprintTiles}/${maxTiles} tiles</span>
      </div>
      <div class="small" style="margin-top:12px; color: var(--muted);">
        ${escapeHtml(updatedAt ? `Updated ${updatedAt}` : 'Newly visible in town')}
      </div>
      ${houseId ? `<div class="kv" style="margin-top:12px;"><a class="btn" href="/house?house=${encodeURIComponent(houseId)}">Open house</a></div>` : ''}
    </article>
  `;
}

async function initTownPage() {
  const grid = el('townGrid');
  const status = el('townStatus');
  if (!grid) return;

  try {
    const payload = await api('/api/town/grid');
    const houses = Array.isArray(payload?.houses) ? payload.houses : [];
    if (!houses.length) {
      grid.innerHTML = '<div class="small" style="color: var(--muted);">No public houses are visible yet.</div>';
      if (status) status.textContent = 'Town grid is empty.';
      return;
    }
    grid.innerHTML = houses.map((house) => renderHouseCard(house)).join('');
    if (status) {
      status.textContent = `${houses.length} public house${houses.length === 1 ? '' : 's'} loaded.`;
    }
  } catch (err) {
    grid.innerHTML = `<div class="small" style="color: var(--bad);">${escapeHtml(err?.message || String(err))}</div>`;
    if (status) status.textContent = 'Town grid failed to load.';
  }
}

initTownPage();
