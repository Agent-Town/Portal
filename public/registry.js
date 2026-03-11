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
      if (Array.isArray(item?.members)) {
        list.appendChild(renderFamilyGroup(item));
      } else {
        list.appendChild(renderEntityCard(item));
      }
    }
  }

  function renderEntityCard(item) {
    const article = document.createElement('article');
    article.className = 'registryCard';
    const displayName = String(item?.displayName || item?.storefront?.title || 'Unnamed entity');
    const entityKind = String(item?.entityKind || 'entity');
    const description = String(item?.description || item?.storefront?.summary || '');
    const family = String(item?.familySlug || item?.family || 'unscoped');
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
    appendProofAndLoadouts(article, item);
    return article;
  }

  function renderFamilyGroup(group) {
    const article = document.createElement('article');
    article.className = 'registryCard';
    const familyTitle = String(group?.familyTitle || group?.storefront?.title || group?.familySlug || 'Unnamed family');
    const familyDescription = String(group?.familyDescription || group?.storefront?.summary || '');
    const familySlug = String(group?.familySlug || group?.family || 'unscoped');
    const members = Array.isArray(group?.members) ? group.members : [];
    article.innerHTML = `
      <div class="registryCardHeader">
        <div>
          <h2>${escapeHtml(familyTitle)}</h2>
          <div>${escapeHtml(familyDescription)}</div>
        </div>
        <span class="registryBadge">${escapeHtml(`${members.length} member${members.length === 1 ? '' : 's'}`)}</span>
      </div>
      <div><strong>Family:</strong> ${escapeHtml(familySlug)}</div>
    `;
    for (const member of members) {
      const memberBlock = document.createElement('div');
      memberBlock.style.marginTop = '0.85rem';
      memberBlock.innerHTML = `
        <div><strong>${escapeHtml(String(member?.displayName || member?.storefront?.title || member?.slug || 'Unnamed entity'))}</strong></div>
        <div>${escapeHtml(String(member?.description || member?.storefront?.summary || ''))}</div>
        <pre class="registryProjection">${escapeHtml(JSON.stringify(member?.projection || {}, null, 2))}</pre>
      `;
      appendProofAndLoadouts(memberBlock, member);
      article.appendChild(memberBlock);
    }
    return article;
  }

  function appendProofAndLoadouts(container, item) {
    if (!container) return;
    const proofSection = renderProofCardsSection(item?.proofCards);
    if (proofSection) container.appendChild(proofSection);
    const loadoutSection = renderLoadoutsSection(item?.loadouts);
    if (loadoutSection) container.appendChild(loadoutSection);
  }

  function renderProofCardsSection(proofCards) {
    const items = Array.isArray(proofCards) ? proofCards : [];
    if (!items.length) return null;
    const section = document.createElement('section');
    section.className = 'registrySection';
    section.innerHTML = `<h3>Proof Cards</h3>`;
    const list = document.createElement('div');
    list.className = 'registryMiniList';
    for (const proof of items) {
      const card = document.createElement('article');
      card.className = 'registryMiniCard';
      card.dataset.registryProofCard = 'true';
      card.innerHTML = `
        <div><strong>${escapeHtml(String(proof?.sourceKind || 'proof'))}</strong></div>
        <div>${escapeHtml(String(proof?.summary || 'Evidence linked into the Registry storefront.'))}</div>
        <div><strong>Evidence:</strong> ${escapeHtml(String(proof?.evidenceId || ''))}</div>
        <div><strong>Linked:</strong> ${escapeHtml(String(proof?.linkedAt || ''))}</div>
        ${
          proof?.poker
            ? `
              <div><strong>Season:</strong> ${escapeHtml(String(proof.poker.seasonId || ''))}</div>
              <div><strong>Run:</strong> ${escapeHtml(String(proof.poker.runId || ''))}</div>
              <div><strong>Rank:</strong> ${escapeHtml(String(proof.poker.rank ?? 'n/a'))}</div>
              <div><strong>Rating:</strong> ${escapeHtml(String(proof.poker.rating ?? 'n/a'))}</div>
            `
            : ''
        }
        ${
          proof?.browserClass
            ? `<div><strong>Browser Class:</strong> ${escapeHtml(String(proof.browserClass.divisionSlug || proof.browserClass.runnerKind || ''))}</div>`
            : ''
        }
        ${
          proof?.safety
            ? `
              <div><strong>Safety:</strong> ${escapeHtml((Array.isArray(proof.safety.flags) ? proof.safety.flags : []).join(', ') || String(proof.safety.sourceKind || ''))}</div>
              ${
                Array.isArray(proof?.safety?.policyLabels) && proof.safety.policyLabels.length
                  ? `<div><strong>Policy:</strong> ${escapeHtml(proof.safety.policyLabels.join(', '))}</div>`
                  : ''
              }
            `
            : ''
        }
      `;
      list.appendChild(card);
    }
    section.appendChild(list);
    return section;
  }

  function renderLoadoutsSection(loadouts) {
    const items = Array.isArray(loadouts) ? loadouts : [];
    if (!items.length) return null;
    const section = document.createElement('section');
    section.className = 'registrySection';
    section.innerHTML = `<h3>Loadouts</h3>`;
    const list = document.createElement('div');
    list.className = 'registryMiniList';
    for (const loadout of items) {
      const card = document.createElement('article');
      card.className = 'registryMiniCard';
      card.dataset.registryLoadout = 'true';
      const componentRefs = Array.isArray(loadout?.componentRefs)
        ? loadout.componentRefs.map((entry) => String(entry || '')).filter(Boolean)
        : [];
      const bundles = Array.isArray(loadout?.bundles) ? loadout.bundles : [];
      const bundleHash = bundles[0]?.contentHash ? String(bundles[0].contentHash) : '';
      card.innerHTML = `
        <div><strong>${escapeHtml(String(loadout?.displayName || loadout?.loadoutId || 'Loadout'))}</strong></div>
        <div><strong>Loadout:</strong> ${escapeHtml(String(loadout?.loadoutId || ''))}</div>
        <div><strong>Components:</strong> ${escapeHtml(componentRefs.join(', '))}</div>
        ${bundleHash ? `<div><strong>Bundle hash:</strong> ${escapeHtml(bundleHash)}</div>` : ''}
      `;
      list.appendChild(card);
    }
    section.appendChild(list);
    return section;
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
    const entityId = params.get('entityId') || params.get('registryEntityId') || '';
    const q = params.get('q') || '';
    const family = params.get('family') || '';
    if (el('registryQuery')) el('registryQuery').value = q;
    if (el('registryFamily')) el('registryFamily').value = family;
    if (el('registryStatus')) el('registryStatus').textContent = 'Loading registry projection...';

    if (entityId) {
      try {
        const payload = await api(`/api/registry/entities/${encodeURIComponent(entityId)}`);
        if (!payload?.ok || !payload?.data?.entity) {
          if (el('registryStatus')) el('registryStatus').textContent = `Registry entity load failed: ${payload?.error?.code || 'UNKNOWN'}`;
          renderItems([]);
          return;
        }
        if (el('registryStatus')) el('registryStatus').textContent = '1 result loaded.';
        renderItems([payload.data.entity]);
        return;
      } catch (err) {
        if (el('registryStatus')) el('registryStatus').textContent = `Registry entity load failed: ${String(err?.message || err || 'UNKNOWN')}`;
        renderItems([]);
        return;
      }
    }

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
      params.delete('entityId');
      params.delete('registryEntityId');
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
