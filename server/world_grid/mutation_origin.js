function headerHostMatchesRequestHost(rawValue, host) {
  const value = String(rawValue || '').trim();
  if (!value) return null;
  try {
    return new URL(value).host.toLowerCase() === String(host || '').trim().toLowerCase();
  } catch {
    return false;
  }
}

function hasTrustedSameOriginFetchMetadata(req = null) {
  const fetchSite = String(req?.get?.('sec-fetch-site') || '').trim().toLowerCase();
  if (fetchSite !== 'same-origin') return false;

  const fetchMode = String(req?.get?.('sec-fetch-mode') || '').trim().toLowerCase();
  if (!fetchMode || fetchMode === 'navigate') return false;

  const fetchDest = String(req?.get?.('sec-fetch-dest') || '').trim().toLowerCase();
  if (['document', 'frame', 'iframe', 'embed', 'object'].includes(fetchDest)) {
    return false;
  }

  return true;
}

function hasExplicitCrossOriginSignal(req = null) {
  const host = String(req?.get?.('host') || '').trim().toLowerCase();
  if (!host) return false;

  const originMatch = headerHostMatchesRequestHost(req?.get?.('origin'), host);
  if (originMatch === false) return true;

  const refererMatch = headerHostMatchesRequestHost(req?.get?.('referer'), host);
  if (refererMatch === false) return true;

  const fetchSite = String(req?.get?.('sec-fetch-site') || '').trim().toLowerCase();
  return Boolean(fetchSite && fetchSite !== 'same-origin');
}

function hasPositiveSameOriginContext(req = null) {
  const host = String(req?.get?.('host') || '').trim().toLowerCase();
  if (!host) return false;

  const originMatch = headerHostMatchesRequestHost(req?.get?.('origin'), host);
  if (originMatch === false) return false;

  const refererMatch = headerHostMatchesRequestHost(req?.get?.('referer'), host);
  if (refererMatch === false) return false;

  return originMatch === true || refererMatch === true || hasTrustedSameOriginFetchMetadata(req);
}

function requireWorldGridMutationOrigin(req = null, { productionRequired = process.env.NODE_ENV === 'production' } = {}) {
  if (hasExplicitCrossOriginSignal(req)) {
    const error = new Error('FORBIDDEN_ORIGIN');
    error.details = { reason: 'CROSS_ORIGIN_WORLD_GRID_MUTATION' };
    throw error;
  }

  if (hasPositiveSameOriginContext(req)) return true;

  if (productionRequired) {
    const error = new Error('FORBIDDEN_ORIGIN');
    error.details = { reason: 'MISSING_SAME_ORIGIN_CONTEXT' };
    throw error;
  }

  return true;
}

module.exports = {
  hasPositiveSameOriginContext,
  hasTrustedSameOriginFetchMetadata,
  requireWorldGridMutationOrigin
};
