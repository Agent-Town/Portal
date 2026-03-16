(function () {
  function el(id) {
    return document.getElementById(id);
  }

  async function api(path, options = {}) {
    const resp = await fetch(path, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers && typeof options.headers === 'object' ? options.headers : {}),
      },
      ...options,
    });
    let json = null;
    try {
      json = await resp.json();
    } catch {
      json = null;
    }
    return {
      ok: resp.ok,
      status: resp.status,
      json,
    };
  }

  function createWorkerStatusNode(text, { error = false } = {}) {
    const node = document.createElement('div');
    node.className = `small registryHint${error ? ' registryHintError' : ''}`;
    node.textContent = String(text || '').trim();
    return node;
  }

  function createActionButton(label, {
    className = '',
    testId = '',
    onClick = null,
  } = {}) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = String(label || '').trim();
    button.className = className || 'btn';
    if (testId) button.setAttribute('data-testid', testId);
    if (typeof onClick === 'function') {
      button.addEventListener('click', onClick);
    }
    return button;
  }

  function createBannerMessageCard(text, { error = false } = {}) {
    const card = document.createElement('article');
    card.className = 'registryCard';
    card.appendChild(createWorkerStatusNode(text, { error }));
    return card;
  }

  function renderItems(items) {
    const list = el('registryList');
    if (!list) return;
    list.innerHTML = '';
    if (!Array.isArray(items) || items.length === 0) {
      const empty = document.createElement('article');
      empty.className = 'registryCard';
      empty.setAttribute('data-testid', 'registry-empty-state');
      empty.innerHTML = `
        <div class="registrySectionHeader">
          <div class="small registrySectionEyebrow">Search</div>
          <h2 class="registrySectionTitle">No registry entities found.</h2>
        </div>
        <p class="small registryCardDescription">Try a broader query or clear the family filter.</p>
      `;
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
    if (item?.workerPackage) {
      return renderWorkerPackageCard(item);
    }
    const article = document.createElement('article');
    article.className = 'registryCard';
    const displayName = String(item?.displayName || item?.storefront?.title || 'Unnamed entity');
    const entityKind = String(item?.entityKind || 'entity');
    const description = String(item?.description || item?.storefront?.summary || '');
    const family = String(item?.familySlug || item?.family || 'unscoped');
    const projection = JSON.stringify(item?.projection || {}, null, 2);
    article.innerHTML = `
      <div class="registryCardHeader">
        <div class="registryCardLead">
          <h2 class="registryCardTitle">${escapeHtml(displayName)}</h2>
          ${description ? `<p class="small registryCardDescription">${escapeHtml(description)}</p>` : ''}
        </div>
        <span class="pill registryBadge">${escapeHtml(entityKind)}</span>
      </div>
      <p class="small registryCardMeta"><strong>Family:</strong> ${escapeHtml(family)}</p>
      <pre class="registryProjection">${escapeHtml(projection)}</pre>
    `;
    appendProofAndLoadouts(article, item);
    return article;
  }

  function renderWorkerPackageCard(item, {
    shareEnvelope = null,
    bannerMode = false,
  } = {}) {
    const workerPackage = item?.workerPackage && typeof item.workerPackage === 'object'
      ? item.workerPackage
      : {};
    const article = document.createElement('article');
    article.className = 'registryCard';
    article.setAttribute('data-testid', bannerMode ? 'registry-worker-share-card' : 'registry-worker-package-card');

    const displayName = String(workerPackage?.displayName || item?.displayName || item?.storefront?.title || 'Worker Package').trim() || 'Worker Package';
    const family = String(item?.familySlug || item?.family || 'workers').trim() || 'workers';
    const oneLineBenefit = String(workerPackage?.oneLineBenefit || item?.description || '').trim();
    const whatItDoes = String(workerPackage?.whatItDoes || '').trim();
    const bestFor = Array.isArray(workerPackage?.bestFor) ? workerPackage.bestFor : [];
    const supportedSurfaces = Array.isArray(workerPackage?.supportedSurfaces) ? workerPackage.supportedSurfaces : [];
    const recommendedOfficeLabel = String(workerPackage?.recommendedOfficeLabel || workerPackage?.recommendedOfficeId || '').trim();
    const versionLabel = String(workerPackage?.versionLabel || workerPackage?.entityVersionId || '').trim();
    const compatibilityLabel = String(
      workerPackage?.compatibilityLabel
      || (bannerMode
        ? (shareEnvelope?.portable?.compatibilityLabel || '')
        : '')
    ).trim();
    const requiresLocalBrain = workerPackage?.requiresLocalBrain === true;
    const statusNode = createWorkerStatusNode(
      bannerMode
        ? String(shareEnvelope?.summary || 'Install this shared helper into your House.').trim()
        : (oneLineBenefit || 'Helper package details are ready.')
    );

    article.innerHTML = `
      <div class="registryCardHeader">
        <div class="registryCardLead">
          <h2 class="registryCardTitle">${escapeHtml(displayName)}</h2>
          <p class="small registryCardDescription">${escapeHtml(oneLineBenefit || String(item?.description || '').trim())}</p>
        </div>
        <span class="pill registryBadge">${escapeHtml(bannerMode ? 'shared helper' : 'worker package')}</span>
      </div>
      <p class="small registryCardMeta"><strong>Family:</strong> ${escapeHtml(family)}</p>
    `;

    const copySection = document.createElement('section');
    copySection.className = 'registrySection';
    copySection.innerHTML = `
      <div class="registrySectionHeader">
        <div class="small registrySectionEyebrow">Overview</div>
        <h3 class="registrySectionTitle">What It Does</h3>
      </div>
    `;
    const copyBody = document.createElement('div');
    copyBody.className = 'registrySectionBody';
    const summary = document.createElement('p');
    summary.className = 'small registryHint';
    summary.textContent = whatItDoes || 'This helper keeps work moving and explains next steps in plain language.';
    copyBody.appendChild(summary);
    if (recommendedOfficeLabel) {
      const office = document.createElement('p');
      office.className = 'small registryHint';
      office.textContent = `Recommended office: ${recommendedOfficeLabel}`;
      copyBody.appendChild(office);
    }
    if (versionLabel) {
      const releaseNode = document.createElement('p');
      releaseNode.className = 'small registryHint';
      releaseNode.setAttribute('data-testid', 'registry-worker-package-release');
      releaseNode.textContent = `Release: ${versionLabel}`;
      copyBody.appendChild(releaseNode);
    }
    if (compatibilityLabel) {
      const compatibilityNode = document.createElement('p');
      compatibilityNode.className = 'small registryHint';
      compatibilityNode.setAttribute('data-testid', 'registry-worker-package-compatibility');
      compatibilityNode.textContent = compatibilityLabel;
      copyBody.appendChild(compatibilityNode);
    }
    if (bestFor.length) {
      const bestForNode = document.createElement('p');
      bestForNode.className = 'small registryHint';
      bestForNode.textContent = `Best for: ${bestFor.join(', ')}`;
      copyBody.appendChild(bestForNode);
    }
    if (supportedSurfaces.length) {
      const surfacesNode = document.createElement('p');
      surfacesNode.className = 'small registryHint';
      surfacesNode.textContent = `Works across: ${supportedSurfaces.join(', ')}`;
      copyBody.appendChild(surfacesNode);
    }
    if (requiresLocalBrain) {
      const setupNode = document.createElement('p');
      setupNode.className = 'small registryHint';
      setupNode.textContent = 'Local brain setup stays local. Connect a brain after install inside the receiving House.';
      copyBody.appendChild(setupNode);
    }
    copySection.appendChild(copyBody);
    article.appendChild(copySection);

    const actionRow = document.createElement('div');
    actionRow.className = 'registryActionRow';
    const installPath = bannerMode ? '/api/platform/house-workers/install-shared' : '/api/platform/house-workers/install';
    const installPayload = bannerMode
      ? { shareId: String(shareEnvelope?.shareId || '').trim() }
      : { registryEntityId: String(workerPackage?.registryEntityId || item?.registryEntityId || '').trim() };
    actionRow.appendChild(createActionButton(
      bannerMode ? String(shareEnvelope?.installActionLabel || 'Install to My House') : String(workerPackage?.install?.actionLabel || 'Install to House'),
      {
        className: 'btn primary',
        testId: 'registry-worker-package-install',
        onClick: async () => {
          statusNode.textContent = bannerMode
            ? 'Installing shared helper into your House...'
            : 'Installing helper into your House...';
          statusNode.classList.remove('registryHintError');
          const response = await api(installPath, {
            method: 'POST',
            body: JSON.stringify(installPayload),
          });
          if (!response.ok || response?.json?.ok !== true) {
            statusNode.textContent = String(response?.json?.error?.message || 'Helper install failed. Attach a house and select an active team first.').trim();
            statusNode.classList.add('registryHintError');
            return;
          }
          const guidance = response?.json?.data?.guidance && typeof response.json.data.guidance === 'object'
            ? response.json.data.guidance
            : {};
          statusNode.textContent = String(guidance?.nextStep || 'Helper installed into your House.').trim();
          statusNode.classList.remove('registryHintError');
        },
      }
    ));
    actionRow.appendChild(createActionButton(
      bannerMode ? 'Copy Share Link' : String(workerPackage?.install?.shareLabel || 'Send to Friend'),
      {
        className: 'btn',
        testId: 'registry-worker-package-share',
        onClick: async () => {
          const response = bannerMode
            ? {
              ok: true,
              json: {
                ok: true,
                data: shareEnvelope,
              },
            }
            : await api('/api/platform/house-workers/share', {
              method: 'POST',
              body: JSON.stringify({
                registryEntityId: String(workerPackage?.registryEntityId || item?.registryEntityId || '').trim(),
              }),
            });
          if (!response.ok || response?.json?.ok !== true) {
            statusNode.textContent = String(response?.json?.error?.message || 'Could not create a friend link right now.').trim();
            statusNode.classList.add('registryHintError');
            return;
          }
          const sharePath = String(response?.json?.data?.sharePath || '').trim();
          const absoluteSharePath = sharePath
            ? new URL(sharePath, window.location.origin).toString()
            : '';
          if (absoluteSharePath && navigator.clipboard?.writeText) {
            try {
              await navigator.clipboard.writeText(absoluteSharePath);
            } catch {
              // fall through to visible text below
            }
          }
          statusNode.textContent = absoluteSharePath
            ? `Friend link ready: ${absoluteSharePath}`
            : 'Friend link is ready.';
          statusNode.classList.remove('registryHintError');
        },
      }
    ));
    actionRow.appendChild(createActionButton(
      bannerMode ? 'View Shared Details' : String(workerPackage?.install?.detailLabel || 'View Details'),
      {
        className: 'btn quiet',
        testId: 'registry-worker-package-details',
        onClick: () => {
          details.open = !details.open;
        },
      }
    ));
    article.appendChild(actionRow);
    article.appendChild(statusNode);

    const advanced = document.createElement('section');
    advanced.className = 'registryAdvanced';
    const details = document.createElement('details');
    details.className = 'registryAdvancedDetails';
    details.setAttribute('data-testid', 'registry-worker-package-advanced');
    const summaryNode = document.createElement('summary');
    summaryNode.className = 'registryAdvancedSummary';
    summaryNode.textContent = 'Advanced runtime details';
    details.appendChild(summaryNode);
    const advancedBody = document.createElement('pre');
    advancedBody.setAttribute('data-testid', 'registry-worker-package-advanced-body');
    advancedBody.className = 'registryProjection registryAdvancedBody';
    advancedBody.textContent = JSON.stringify({
      registryEntityId: String(workerPackage?.registryEntityId || item?.registryEntityId || '').trim() || null,
      entityVersionId: String(workerPackage?.entityVersionId || item?.entityVersionId || '').trim() || null,
      versionLabel: versionLabel || null,
      loadoutId: String(workerPackage?.portableArtifacts?.loadoutId || workerPackage?.runtimeDefaults?.loadoutId || '').trim() || null,
      bundleHash: String(workerPackage?.portableArtifacts?.bundleHash || '').trim() || null,
      compatibilityLabel: compatibilityLabel || null,
      runtimeDefaults: workerPackage?.runtimeDefaults || null,
    }, null, 2);
    details.appendChild(advancedBody);
    advanced.appendChild(details);
    article.appendChild(advanced);
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
        <div class="registryCardLead">
          <h2 class="registryCardTitle">${escapeHtml(familyTitle)}</h2>
          ${familyDescription ? `<p class="small registryCardDescription">${escapeHtml(familyDescription)}</p>` : ''}
        </div>
        <span class="pill registryBadge">${escapeHtml(`${members.length} member${members.length === 1 ? '' : 's'}`)}</span>
      </div>
      <p class="small registryCardMeta"><strong>Family:</strong> ${escapeHtml(familySlug)}</p>
    `;
    const membersList = document.createElement('div');
    membersList.className = 'registryFamilyMembers';
    for (const member of members) {
      const memberWrapper = document.createElement('div');
      memberWrapper.className = 'registryFamilyMember';
      memberWrapper.appendChild(renderEntityCard(member));
      membersList.appendChild(memberWrapper);
    }
    article.appendChild(membersList);
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
    section.innerHTML = `
      <div class="registrySectionHeader">
        <div class="small registrySectionEyebrow">Proof</div>
        <h3 class="registrySectionTitle">Proof Cards</h3>
      </div>
    `;
    const list = document.createElement('div');
    list.className = 'registryMiniList registrySectionBody';
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
    section.innerHTML = `
      <div class="registrySectionHeader">
        <div class="small registrySectionEyebrow">Setup</div>
        <h3 class="registrySectionTitle">Loadouts</h3>
      </div>
    `;
    const list = document.createElement('div');
    list.className = 'registryMiniList registrySectionBody';
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

  async function loadWorkerShareBanner() {
    const banner = el('registryWorkerShare');
    if (!banner) return null;
    const params = new URLSearchParams(window.location.search);
    const shareId = String(params.get('workerShare') || '').trim();
    if (!shareId) {
      banner.classList.add('is-hidden');
      banner.innerHTML = '';
      return null;
    }
    banner.classList.remove('is-hidden');
    banner.innerHTML = '';
    banner.appendChild(createBannerMessageCard('Loading shared helper…'));
    const response = await api(`/api/platform/house-workers/shares/${encodeURIComponent(shareId)}`);
    if (!response.ok || response?.json?.ok !== true) {
      banner.innerHTML = '';
      banner.appendChild(createBannerMessageCard(
        String(response?.json?.error?.message || 'Shared helper link is unavailable.').trim(),
        { error: true }
      ));
      return null;
    }
    const data = response?.json?.data && typeof response.json.data === 'object' ? response.json.data : {};
    const portable = data?.portable && typeof data.portable === 'object' ? data.portable : {};
    banner.innerHTML = '';
    banner.appendChild(renderWorkerPackageCard({
      familySlug: 'workers',
      family: 'workers',
      workerPackage: {
        ...portable,
        registryEntityId: String(portable?.registryEntityId || '').trim() || null,
        entityVersionId: String(portable?.entityVersionId || '').trim() || null,
        versionLabel: String(portable?.versionLabel || '').trim() || null,
        displayName: String(portable?.displayName || 'Shared Helper').trim(),
        compatibilityLabel: String(portable?.compatibilityLabel || '').trim() || null,
        portableArtifacts: {
          loadoutId: String(portable?.loadoutId || portable?.runtimeDefaults?.loadoutId || '').trim() || null,
          bundleHash: String(portable?.bundleHash || '').trim() || null,
        },
        install: {
          actionLabel: String(data?.installActionLabel || 'Install to My House'),
          shareLabel: 'Copy Share Link',
          detailLabel: 'View Shared Details',
        },
      },
      loadouts: [],
      proofCards: [],
    }, {
      shareEnvelope: data,
      bannerMode: true,
    }));
    return data;
  }

  async function load() {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    const family = params.get('family') || '';
    if (el('registryQuery')) el('registryQuery').value = q;
    if (el('registryFamily')) el('registryFamily').value = family;
    if (el('registryStatus')) el('registryStatus').textContent = 'Loading registry projection...';

    await loadWorkerShareBanner();

    const requestParams = new URLSearchParams();
    if (q) requestParams.set('q', q);
    if (family) requestParams.set('family', family);
    const path = requestParams.toString()
      ? `/api/registry/search?${requestParams.toString()}`
      : '/api/registry/search';

    try {
      const payload = await api(path);
      if (!payload.ok || payload?.json?.ok !== true) {
        if (el('registryStatus')) el('registryStatus').textContent = `Registry search failed: ${payload?.json?.error?.code || 'UNKNOWN'}`;
        renderItems([]);
        return;
      }
      const items = Array.isArray(payload?.json?.data?.items) ? payload.json.data.items : [];
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
