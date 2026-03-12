const { expect } = require('@playwright/test');

const { callPageJson } = require('./unified_platform');

const APPROVED_PUBLICATION_ID = 'appr_fixture_library_publish_approved_01';
const APPROVED_PUBLIC_STACK_ID = 'appr_fixture_library_public_stack_approved_01';

function normalizeIdPrefix(value = '') {
  return String(value || 'house-library-public-stack')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'house-library-public-stack';
}

async function seedPublishedHouseLibraryPublicStack(page, {
  idPrefix = 'house-library-public-stack',
  title = 'Journey Public Stack',
  scopeTitle = title,
  alphaTitle = 'Signal Notes',
  betaTitle = 'Skyline Checklist',
  alphaSourceKind = 'user_note',
  alphaSourceRef = 'user_note:signal-notes',
  betaSourceKind = 'workspace_file',
  betaSourceRef = 'workspace/.agent-town/playbooks/skyline-checklist.md',
} = {}) {
  const normalizedPrefix = normalizeIdPrefix(idPrefix);
  const alphaResp = await callPageJson(page, '/api/platform/library/items', {
    method: 'POST',
    headers: { 'Idempotency-Key': `${normalizedPrefix}-alpha-001` },
    data: {
      itemType: 'library_note',
      title: alphaTitle,
      summary: `${scopeTitle} alpha member.`,
      contentText: `${alphaTitle} belongs to ${scopeTitle}.`,
      sourceKind: alphaSourceKind,
      sourceRef: `${alphaSourceRef}:${normalizedPrefix}`,
      visibility: 'house_private',
    },
  });
  expect(alphaResp.status).toBe(201);
  const alphaId = String(alphaResp.json?.data?.item?.libraryItemId || '');

  const betaResp = await callPageJson(page, '/api/platform/library/items', {
    method: 'POST',
    headers: { 'Idempotency-Key': `${normalizedPrefix}-beta-001` },
    data: {
      itemType: 'playbook',
      title: betaTitle,
      summary: `${scopeTitle} beta member.`,
      contentText: `${betaTitle} belongs to ${scopeTitle}.`,
      sourceKind: betaSourceKind,
      sourceRef: `${betaSourceRef}:${normalizedPrefix}`,
      visibility: 'house_private',
    },
  });
  expect(betaResp.status).toBe(201);
  const betaId = String(betaResp.json?.data?.item?.libraryItemId || '');

  const scopeSetId = `scope_${normalizedPrefix}_01`;
  const scopeResp = await callPageJson(page, '/api/platform/library/scope', {
    method: 'POST',
    data: {
      scopeSetId,
      title: scopeTitle,
      itemIds: [alphaId, betaId],
      scopeKind: 'satchel',
    },
  });
  expect(scopeResp.status).toBe(200);

  const publishAlphaResp = await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: { 'Idempotency-Key': `${normalizedPrefix}-publish-alpha-001` },
    data: {
      libraryItemId: alphaId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  expect(publishAlphaResp.status).toBe(201);

  const publishBetaResp = await callPageJson(page, '/api/platform/library/publications', {
    method: 'POST',
    headers: { 'Idempotency-Key': `${normalizedPrefix}-publish-beta-001` },
    data: {
      libraryItemId: betaId,
      visibility: 'registry_public',
      approvalId: APPROVED_PUBLICATION_ID,
    },
  });
  expect(publishBetaResp.status).toBe(201);

  const publicStackResp = await callPageJson(page, '/api/platform/library/public-stacks', {
    method: 'POST',
    headers: { 'Idempotency-Key': `${normalizedPrefix}-stack-001` },
    data: {
      scopeSetId,
      approvalId: APPROVED_PUBLIC_STACK_ID,
    },
  });
  expect(publicStackResp.status).toBe(201);

  return {
    alphaId,
    betaId,
    scopeSetId,
    libraryPublicStackId: String(publicStackResp.json?.data?.publicStack?.libraryPublicStackId || ''),
  };
}

async function openHouseLibraryPublicStackPreview(page, {
  title = '',
  query = title,
  family = 'house_library_stacks',
} = {}) {
  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  await page.getByTestId('house-library-public-stacks-query').fill(String(query || '').trim());
  if (family === 'house_library_stacks') {
    await page.getByTestId('house-library-storefront-chip-satchels').click();
  } else if (family === 'skill') {
    await page.getByTestId('house-library-storefront-chip-skills').click();
  } else if (family === 'developer_workflows') {
    await page.getByTestId('house-library-storefront-chip-flows').click();
  } else if (family === 'registry') {
    await page.getByTestId('house-library-storefront-chip-registry').click();
  } else {
    await page.getByTestId('house-library-storefront-chip-all').click();
  }
  await page.getByTestId('house-library-public-stacks-search').click();
  const card = page.getByTestId('house-library-storefront-card').filter({
    hasText: String(title || query || '').trim(),
  }).first();
  await card.getByTestId('house-library-storefront-preview').click();
  await expect(page.getByTestId('house-library-preview-title')).toContainText(String(title || query || '').trim());
}

async function openHouseLibraryPreviewDetails(page) {
  const details = page.getByTestId('house-library-preview-details');
  const expanded = await details.evaluate((node) => node.open === true).catch(() => false);
  if (!expanded) {
    await page.getByTestId('house-library-preview-details-toggle').click();
  }
  await expect(details).toHaveAttribute('open', '');
}

async function openHouseLibraryStorefrontDetails(page) {
  const details = page.getByTestId('house-library-storefront-details');
  const expanded = await details.evaluate((node) => node.open === true).catch(() => false);
  if (!expanded) {
    await page.getByTestId('house-library-storefront-details-toggle').click();
  }
  await expect(details).toHaveAttribute('open', '');
}

async function saveHouseLibraryReview(page, {
  reviewTier = 'review_later',
  note = '',
} = {}) {
  if (!note) {
    if (reviewTier === 'trusted_here') {
      await page.getByTestId('house-library-preview-review-trusted').click();
    } else if (reviewTier === 'blocked_here') {
      await page.getByTestId('house-library-preview-review-blocked').click();
    } else {
      await page.getByTestId('house-library-preview-review-later').click();
    }
    return;
  }
  await openHouseLibraryPreviewDetails(page);
  await page.getByTestId('house-library-guided-review-tier').selectOption(reviewTier);
  await page.getByTestId('house-library-guided-review-note').fill(note);
  await page.getByTestId('house-library-guided-review-save-button').click();
}

async function saveHouseLibrarySafety(page, {
  safetyState = 'hidden_here',
} = {}) {
  await openHouseLibraryPreviewDetails(page);
  if (safetyState === 'reported_here') {
    await page.getByTestId('house-library-guided-report-button').click();
  } else if (safetyState === 'visible_here') {
    await page.getByTestId('house-library-guided-restore-button').click();
  } else {
    await page.getByTestId('house-library-guided-hide-button').click();
  }
}

async function setHouseLibraryTrustChip(page, value = '') {
  if (value === 'trusted_here') {
    await page.getByTestId('house-library-storefront-chip-trusted').click();
  } else if (value === 'blocked_here') {
    await page.getByTestId('house-library-storefront-chip-blocked').click();
  } else if (value === 'review_later') {
    await page.getByTestId('house-library-storefront-chip-later').click();
  } else if (value === 'sealed') {
    await page.getByTestId('house-library-storefront-chip-sealed').click();
  } else {
    await page.getByTestId('house-library-storefront-chip-all').click();
  }
}

async function setHouseLibrarySafetyFilter(page, value = '') {
  await openHouseLibraryStorefrontDetails(page);
  await page.getByTestId('house-library-public-stacks-safety').selectOption(value);
}

module.exports = {
  APPROVED_PUBLICATION_ID,
  APPROVED_PUBLIC_STACK_ID,
  openHouseLibraryPreviewDetails,
  openHouseLibraryStorefrontDetails,
  seedPublishedHouseLibraryPublicStack,
  openHouseLibraryPublicStackPreview,
  saveHouseLibraryReview,
  saveHouseLibrarySafety,
  setHouseLibrarySafetyFilter,
  setHouseLibraryTrustChip,
};
