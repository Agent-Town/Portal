const EXPLICIT_SENSITIVE_HEADERS = new Set([
  'authorization',
  'cookie',
  'proxy-authorization',
  'x-admin-token',
  'x-house-auth',
  'x-house-ts',
  'x-team-code-hint',
  'x-test-reset',
  'x-wallet-address',
  'x-wallet-chain',
  'x-wallet-evm-address',
  'x-wallet-recovery-intent',
  'x-wallet-recovery-key',
  'x-wallet-solana-address'
]);

const SENSITIVE_COMPACT_HEADER_NAMES = new Set([
  'apikey',
  'authkey',
  'authtoken',
  'accesstoken',
  'refreshtoken',
  'sessiontoken',
  'csrftoken',
  'xcsrftoken',
  'xsrftoken'
]);

const ALWAYS_SENSITIVE_HEADER_PARTS = new Set([
  'auth',
  'authorization',
  'token',
  'secret',
  'credential',
  'credentials',
  'signature',
  'sig',
  'nonce',
  'cookie'
]);

const SENSITIVE_KEY_CONTEXT_PARTS = new Set([
  'api',
  'auth',
  'access',
  'refresh',
  'session',
  'csrf',
  'private',
  'sign',
  'signing',
  'wallet',
  'house',
  'team',
  'admin',
  'proxy'
]);

function isSensitiveRedirectHeader(name) {
  const normalized = typeof name === 'string' ? name.trim().toLowerCase() : '';
  if (!normalized) return false;
  if (EXPLICIT_SENSITIVE_HEADERS.has(normalized)) return true;
  if (normalized.startsWith('x-wallet-')) return true;
  const compact = normalized.replace(/[^a-z0-9]+/g, '');
  if (SENSITIVE_COMPACT_HEADER_NAMES.has(compact)) return true;
  const parts = normalized.split(/[^a-z0-9]+/).filter(Boolean);
  if (parts.some((part) => ALWAYS_SENSITIVE_HEADER_PARTS.has(part))) return true;
  if (parts.includes('key') && parts.some((part) => SENSITIVE_KEY_CONTEXT_PARTS.has(part))) return true;
  return false;
}

function toUrlOrNull(value) {
  try {
    return new URL(String(value || ''));
  } catch {
    return null;
  }
}

function stripSensitiveHeadersOnRedirect(fromUrl, toUrl, headers = {}) {
  const source = toUrlOrNull(fromUrl);
  const target = toUrlOrNull(toUrl);
  if (!source || !target || source.origin === target.origin) {
    return { ...(headers || {}) };
  }

  const next = {};
  for (const [name, value] of Object.entries(headers || {})) {
    if (isSensitiveRedirectHeader(name)) continue;
    next[name] = value;
  }
  return next;
}

module.exports = {
  isSensitiveRedirectHeader,
  stripSensitiveHeadersOnRedirect
};
