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
} = {}) {
  await page.getByTestId('house-open-library').click();
  await expect(page.getByTestId('house-library-panel')).toBeVisible();
  await page.getByTestId('house-library-public-stacks-query').fill(String(query || '').trim());
  await page.getByTestId('house-library-public-stacks-family').selectOption('house_library_stacks');
  await page.getByTestId('house-library-public-stacks-search').click();
  await page.locator('#houseLibraryPublicStacksResults button', { hasText: String(title || query || '').trim() }).first().click();
  await expect(page.getByTestId('house-library-registry-preview')).toContainText(String(title || query || '').trim());
}

module.exports = {
  APPROVED_PUBLICATION_ID,
  APPROVED_PUBLIC_STACK_ID,
  seedPublishedHouseLibraryPublicStack,
  openHouseLibraryPublicStackPreview,
};
