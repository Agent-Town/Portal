(function () {
  function el(id) {
    return document.getElementById(id);
  }

  async function api(path) {
    const resp = await fetch(path, {
      credentials: 'include',
      headers: {
        Accept: 'application/json'
      }
    });
    return await resp.json();
  }

  function renderItems(items) {
    const list = el('registryList');
    if (!list) return;
    list.innerHTML = '';
    if (!Array.isArray(items) || items.length === 0) {
      const empty = document.createElement('article');
      empty.className = 'registryCard';
      empty.innerHTML = '<h2>No registry entities found.</h2><p>Try a broader query or clear the family filter.</p>';
      list.appendChild(empty);
      return;
    }
    for (const item of items) {
      const article = document.createElement('article');
      article.className = 'registryCard';
      const displayName = String(item?.displayName || 'Unnamed entity');
      const entityKind = String(item?.entityKind || 'entity');
      const description = String(item?.description || '');
      const family = String(item?.family || 'unscoped');
      const projection = JSON.stringify(item?.projection || {}, null, 2);
      article.innerHTML = `
        <div class="registryCardHeader">
          <div>
            <h2>${escapeHtml(displayName)}</h2>
            <div>${escapeHtml(description)}</div>
          </div>
          <span class="registryBadge">${escapeHtml(entityKind)}</span>
        </div>
        <div><strong>Family:</strong> ${escapeHtml(family)}</div>
        <pre class="registryProjection">${escapeHtml(projection)}</pre>
      `;
      list.appendChild(article);
    }
  }

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  async function load() {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    const family = params.get('family') || '';
    if (el('registryQuery')) el('registryQuery').value = q;
    if (el('registryFamily')) el('registryFamily').value = family;
    if (el('registryStatus')) el('registryStatus').textContent = 'Loading registry projection...';

    const requestParams = new URLSearchParams();
    if (q) requestParams.set('q', q);
    if (family) requestParams.set('family', family);
    const path = requestParams.toString()
      ? `/api/registry/search?${requestParams.toString()}`
      : '/api/registry/search';

    try {
      const payload = await api(path);
      if (!payload?.ok) {
        if (el('registryStatus')) el('registryStatus').textContent = `Registry search failed: ${payload?.error?.code || 'UNKNOWN'}`;
        renderItems([]);
        return;
      }
      const items = Array.isArray(payload?.data?.items) ? payload.data.items : [];
      if (el('registryStatus')) el('registryStatus').textContent = `${items.length} result${items.length === 1 ? '' : 's'} loaded.`;
      renderItems(items);
    } catch (err) {
      if (el('registryStatus')) el('registryStatus').textContent = `Registry search failed: ${String(err?.message || err || 'UNKNOWN')}`;
      renderItems([]);
    }
  }

  function bind() {
    const form = el('registrySearchForm');
    if (!form) return;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const params = new URLSearchParams(window.location.search);
      const q = String(el('registryQuery')?.value || '').trim();
      const family = String(el('registryFamily')?.value || '').trim();
      if (q) params.set('q', q); else params.delete('q');
      if (family) params.set('family', family); else params.delete('family');
      const next = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, '', next);
      load();
    });
  }

  bind();
  load();
})();
