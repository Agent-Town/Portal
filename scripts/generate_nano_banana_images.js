#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const DEFAULT_MANIFEST = './data/erc8004-image-prompts-missing-share-hero.jsonl';
const DEFAULT_IMAGES_DIR = './data/generated-share-heroes';
const DEFAULT_REPORTS_DIR = './data/generated-share-heroes/reports';
const DEFAULT_MODEL = 'gemini-2.5-flash-image';
const DEFAULT_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_AUTH = 'api-key';
const DEFAULT_CONCURRENCY = 2;
const DEFAULT_TIMEOUT_MS = 120000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_BACKOFF_MS = 1250;
const DEFAULT_UNIT_COST_USD = 0.039;
const DEFAULT_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const DEFAULT_OAUTH_TOKEN_COMMAND = 'gcloud auth application-default print-access-token';
const DEFAULT_ASPECT_RATIO = '16:9';

const SUPPORTED_ASPECT_RATIOS = new Set([
  '1:1',
  '3:4',
  '4:3',
  '9:16',
  '16:9'
]);

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

function printHelp() {
  process.stdout.write(
    [
      'Generate storefront images from ERC-8004 prompt manifests using Gemini image generation (Nano Banana).',
      '',
      'Usage:',
      '  node scripts/generate_nano_banana_images.js [options]',
      '',
      'Core options:',
      `  --manifest <path>                 Prompt JSONL manifest (default: ${DEFAULT_MANIFEST})`,
      `  --images-dir <path>               Output image directory (default: ${DEFAULT_IMAGES_DIR})`,
      `  --reports-dir <path>              Run reports directory (default: ${DEFAULT_REPORTS_DIR})`,
      `  --model <name>                    Gemini image model (default: ${DEFAULT_MODEL})`,
      `  --api-base-url <url>              API base URL (default: ${DEFAULT_API_BASE_URL})`,
      `  --aspect-ratio <ratio>            1:1 | 3:4 | 4:3 | 9:16 | 16:9 (default: ${DEFAULT_ASPECT_RATIO})`,
      `  --auth <api-key|oauth>            Auth mode (default: ${DEFAULT_AUTH})`,
      '  --concurrency <n>                 Concurrent requests (default: 2)',
      '  --start-offset <n>                Start from manifest index n (default: 0)',
      '  --limit <n>                       Process at most n records (0 = all, default: 0)',
      '  --overwrite                        Regenerate even when image already exists',
      '  --dry-run                          Validate + estimate only; no API calls or writes',
      '',
      'Budget/safety options:',
      `  --unit-cost-usd <n>               Planning cost per image (default: ${DEFAULT_UNIT_COST_USD})`,
      '  --max-spend-usd <n>               Stop scheduling once planned spend would exceed n',
      `  --timeout-ms <n>                  Request timeout (default: ${DEFAULT_TIMEOUT_MS})`,
      `  --max-retries <n>                 Retry count for transient failures (default: ${DEFAULT_MAX_RETRIES})`,
      `  --retry-backoff-ms <n>            Base retry backoff (default: ${DEFAULT_RETRY_BACKOFF_MS})`,
      '',
      'API key auth:',
      '  --api-key <key>                   Gemini API key (or GEMINI_API_KEY / GOOGLE_API_KEY)',
      '',
      'OAuth auth:',
      '  --oauth-access-token <token>      Direct bearer token (short-lived)',
      '  --oauth-client-id <id>            OAuth client id for refresh-token flow',
      '  --oauth-client-secret <secret>    OAuth client secret for refresh-token flow',
      '  --oauth-refresh-token <token>     OAuth refresh token for backend flow',
      `  --oauth-token-url <url>           OAuth token endpoint (default: ${DEFAULT_OAUTH_TOKEN_URL})`,
      `  --oauth-token-command <cmd>       Fallback command to print access token (default: ${DEFAULT_OAUTH_TOKEN_COMMAND})`,
      '  --google-cloud-project <id>       Optional quota project header (x-goog-user-project)',
      '',
      'Output/report options:',
      '  --resolved-manifest <path>        Write resolved output mapping JSONL',
      '  --help                            Show help',
      '',
      'Manifest fields used:',
      '  prompt (required), erc8004Id, outputFilename, outputFileBase',
      '',
      'Wrappers:',
      '  node scripts/generate_nano_banana_images_api_key.js ...',
      '  node scripts/generate_nano_banana_images_oauth.js ...'
    ].join('\n') + '\n'
  );
}

function parseArgs(argv) {
  const opts = {
    manifest: DEFAULT_MANIFEST,
    imagesDir: DEFAULT_IMAGES_DIR,
    reportsDir: DEFAULT_REPORTS_DIR,
    model: DEFAULT_MODEL,
    apiBaseUrl: DEFAULT_API_BASE_URL,
    auth: DEFAULT_AUTH,
    aspectRatio: DEFAULT_ASPECT_RATIO,
    apiKey: null,
    oauthAccessToken: null,
    oauthClientId: null,
    oauthClientSecret: null,
    oauthRefreshToken: null,
    oauthTokenUrl: DEFAULT_OAUTH_TOKEN_URL,
    oauthTokenCommand: DEFAULT_OAUTH_TOKEN_COMMAND,
    googleCloudProject: null,
    concurrency: DEFAULT_CONCURRENCY,
    startOffset: 0,
    limit: 0,
    overwrite: false,
    dryRun: false,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    maxRetries: DEFAULT_MAX_RETRIES,
    retryBackoffMs: DEFAULT_RETRY_BACKOFF_MS,
    unitCostUsd: DEFAULT_UNIT_COST_USD,
    maxSpendUsd: null,
    resolvedManifest: null,
    help: false
  };

  function nextValue(i, flag) {
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) throw new Error(`MISSING_VALUE:${flag}`);
    return value;
  }

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--help') {
      opts.help = true;
      continue;
    }
    if (token === '--overwrite') {
      opts.overwrite = true;
      continue;
    }
    if (token === '--dry-run') {
      opts.dryRun = true;
      continue;
    }

    if (token === '--manifest') {
      opts.manifest = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--manifest=')) {
      opts.manifest = token.slice('--manifest='.length);
      continue;
    }

    if (token === '--images-dir') {
      opts.imagesDir = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--images-dir=')) {
      opts.imagesDir = token.slice('--images-dir='.length);
      continue;
    }

    if (token === '--reports-dir') {
      opts.reportsDir = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--reports-dir=')) {
      opts.reportsDir = token.slice('--reports-dir='.length);
      continue;
    }

    if (token === '--model') {
      opts.model = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--model=')) {
      opts.model = token.slice('--model='.length);
      continue;
    }

    if (token === '--api-base-url') {
      opts.apiBaseUrl = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--api-base-url=')) {
      opts.apiBaseUrl = token.slice('--api-base-url='.length);
      continue;
    }

    if (token === '--aspect-ratio') {
      opts.aspectRatio = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--aspect-ratio=')) {
      opts.aspectRatio = token.slice('--aspect-ratio='.length);
      continue;
    }

    if (token === '--auth') {
      opts.auth = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--auth=')) {
      opts.auth = token.slice('--auth='.length);
      continue;
    }

    if (token === '--api-key') {
      opts.apiKey = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--api-key=')) {
      opts.apiKey = token.slice('--api-key='.length);
      continue;
    }

    if (token === '--oauth-access-token') {
      opts.oauthAccessToken = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--oauth-access-token=')) {
      opts.oauthAccessToken = token.slice('--oauth-access-token='.length);
      continue;
    }

    if (token === '--oauth-client-id') {
      opts.oauthClientId = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--oauth-client-id=')) {
      opts.oauthClientId = token.slice('--oauth-client-id='.length);
      continue;
    }

    if (token === '--oauth-client-secret') {
      opts.oauthClientSecret = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--oauth-client-secret=')) {
      opts.oauthClientSecret = token.slice('--oauth-client-secret='.length);
      continue;
    }

    if (token === '--oauth-refresh-token') {
      opts.oauthRefreshToken = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--oauth-refresh-token=')) {
      opts.oauthRefreshToken = token.slice('--oauth-refresh-token='.length);
      continue;
    }

    if (token === '--oauth-token-url') {
      opts.oauthTokenUrl = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--oauth-token-url=')) {
      opts.oauthTokenUrl = token.slice('--oauth-token-url='.length);
      continue;
    }

    if (token === '--oauth-token-command') {
      opts.oauthTokenCommand = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--oauth-token-command=')) {
      opts.oauthTokenCommand = token.slice('--oauth-token-command='.length);
      continue;
    }

    if (token === '--google-cloud-project') {
      opts.googleCloudProject = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--google-cloud-project=')) {
      opts.googleCloudProject = token.slice('--google-cloud-project='.length);
      continue;
    }

    if (token === '--concurrency') {
      opts.concurrency = Number(nextValue(i, token));
      i += 1;
      continue;
    }
    if (token.startsWith('--concurrency=')) {
      opts.concurrency = Number(token.slice('--concurrency='.length));
      continue;
    }

    if (token === '--start-offset') {
      opts.startOffset = Number(nextValue(i, token));
      i += 1;
      continue;
    }
    if (token.startsWith('--start-offset=')) {
      opts.startOffset = Number(token.slice('--start-offset='.length));
      continue;
    }

    if (token === '--limit') {
      opts.limit = Number(nextValue(i, token));
      i += 1;
      continue;
    }
    if (token.startsWith('--limit=')) {
      opts.limit = Number(token.slice('--limit='.length));
      continue;
    }

    if (token === '--timeout-ms') {
      opts.timeoutMs = Number(nextValue(i, token));
      i += 1;
      continue;
    }
    if (token.startsWith('--timeout-ms=')) {
      opts.timeoutMs = Number(token.slice('--timeout-ms='.length));
      continue;
    }

    if (token === '--max-retries') {
      opts.maxRetries = Number(nextValue(i, token));
      i += 1;
      continue;
    }
    if (token.startsWith('--max-retries=')) {
      opts.maxRetries = Number(token.slice('--max-retries='.length));
      continue;
    }

    if (token === '--retry-backoff-ms') {
      opts.retryBackoffMs = Number(nextValue(i, token));
      i += 1;
      continue;
    }
    if (token.startsWith('--retry-backoff-ms=')) {
      opts.retryBackoffMs = Number(token.slice('--retry-backoff-ms='.length));
      continue;
    }

    if (token === '--unit-cost-usd') {
      opts.unitCostUsd = Number(nextValue(i, token));
      i += 1;
      continue;
    }
    if (token.startsWith('--unit-cost-usd=')) {
      opts.unitCostUsd = Number(token.slice('--unit-cost-usd='.length));
      continue;
    }

    if (token === '--max-spend-usd') {
      opts.maxSpendUsd = Number(nextValue(i, token));
      i += 1;
      continue;
    }
    if (token.startsWith('--max-spend-usd=')) {
      opts.maxSpendUsd = Number(token.slice('--max-spend-usd='.length));
      continue;
    }

    if (token === '--resolved-manifest') {
      opts.resolvedManifest = nextValue(i, token);
      i += 1;
      continue;
    }
    if (token.startsWith('--resolved-manifest=')) {
      opts.resolvedManifest = token.slice('--resolved-manifest='.length);
      continue;
    }

    throw new Error(`UNKNOWN_ARG:${token}`);
  }

  opts.auth = String(opts.auth || '').trim().toLowerCase();
  if (!new Set(['api-key', 'oauth']).has(opts.auth)) throw new Error('INVALID_AUTH_MODE');

  if (!Number.isFinite(opts.concurrency) || opts.concurrency <= 0) throw new Error('INVALID_CONCURRENCY');
  opts.concurrency = Math.floor(opts.concurrency);

  if (!Number.isFinite(opts.startOffset) || opts.startOffset < 0) throw new Error('INVALID_START_OFFSET');
  opts.startOffset = Math.floor(opts.startOffset);

  if (!Number.isFinite(opts.limit) || opts.limit < 0) throw new Error('INVALID_LIMIT');
  opts.limit = Math.floor(opts.limit);

  if (!Number.isFinite(opts.timeoutMs) || opts.timeoutMs < 1000) throw new Error('INVALID_TIMEOUT_MS');
  opts.timeoutMs = Math.floor(opts.timeoutMs);

  if (!Number.isFinite(opts.maxRetries) || opts.maxRetries < 0) throw new Error('INVALID_MAX_RETRIES');
  opts.maxRetries = Math.floor(opts.maxRetries);

  if (!Number.isFinite(opts.retryBackoffMs) || opts.retryBackoffMs < 0) throw new Error('INVALID_RETRY_BACKOFF_MS');
  opts.retryBackoffMs = Math.floor(opts.retryBackoffMs);

  if (!Number.isFinite(opts.unitCostUsd) || opts.unitCostUsd < 0) throw new Error('INVALID_UNIT_COST_USD');

  if (opts.maxSpendUsd != null && (!Number.isFinite(opts.maxSpendUsd) || opts.maxSpendUsd < 0)) {
    throw new Error('INVALID_MAX_SPEND_USD');
  }

  if (!SUPPORTED_ASPECT_RATIOS.has(opts.aspectRatio)) throw new Error('INVALID_ASPECT_RATIO');

  opts.manifest = path.resolve(opts.manifest);
  opts.imagesDir = path.resolve(opts.imagesDir);
  opts.reportsDir = path.resolve(opts.reportsDir);
  opts.apiBaseUrl = String(opts.apiBaseUrl || '').replace(/\/+$/, '');
  if (!opts.apiBaseUrl) throw new Error('INVALID_API_BASE_URL');

  if (opts.resolvedManifest) opts.resolvedManifest = path.resolve(opts.resolvedManifest);

  opts.apiKey =
    nonEmpty(opts.apiKey) ||
    nonEmpty(process.env.GEMINI_API_KEY) ||
    nonEmpty(process.env.GOOGLE_API_KEY) ||
    null;
  opts.oauthAccessToken =
    nonEmpty(opts.oauthAccessToken) ||
    nonEmpty(process.env.GOOGLE_OAUTH_ACCESS_TOKEN) ||
    nonEmpty(process.env.GEMINI_OAUTH_ACCESS_TOKEN) ||
    null;
  opts.oauthClientId =
    nonEmpty(opts.oauthClientId) ||
    nonEmpty(process.env.GOOGLE_OAUTH_CLIENT_ID) ||
    nonEmpty(process.env.GOOGLE_CLIENT_ID) ||
    null;
  opts.oauthClientSecret =
    nonEmpty(opts.oauthClientSecret) ||
    nonEmpty(process.env.GOOGLE_OAUTH_CLIENT_SECRET) ||
    nonEmpty(process.env.GOOGLE_CLIENT_SECRET) ||
    null;
  opts.oauthRefreshToken =
    nonEmpty(opts.oauthRefreshToken) ||
    nonEmpty(process.env.GOOGLE_OAUTH_REFRESH_TOKEN) ||
    nonEmpty(process.env.GOOGLE_REFRESH_TOKEN) ||
    null;
  opts.oauthTokenUrl = nonEmpty(opts.oauthTokenUrl) || DEFAULT_OAUTH_TOKEN_URL;
  opts.oauthTokenCommand = nonEmpty(opts.oauthTokenCommand) || DEFAULT_OAUTH_TOKEN_COMMAND;
  opts.googleCloudProject =
    nonEmpty(opts.googleCloudProject) ||
    nonEmpty(process.env.GOOGLE_CLOUD_PROJECT) ||
    nonEmpty(process.env.GCLOUD_PROJECT) ||
    null;

  return opts;
}

function nonEmpty(value) {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  return v ? v : null;
}

function nowCompactUtc() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function readJsonl(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((line) => line.trim());
  const out = [];
  for (let i = 0; i < lines.length; i += 1) {
    try {
      out.push(JSON.parse(lines[i]));
    } catch {
      throw new Error(`INVALID_JSONL_LINE:${i + 1}`);
    }
  }
  return out;
}

function safeFileId(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100) || 'image';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extFromMime(mime) {
  const m = String(mime || '').toLowerCase().trim();
  if (m === 'image/png') return '.png';
  if (m === 'image/jpeg') return '.jpg';
  if (m === 'image/webp') return '.webp';
  return null;
}

function findExistingImagePath(imagesDir, rec) {
  const explicit = nonEmpty(rec?.outputFilename);
  if (explicit) {
    const candidate = path.join(imagesDir, explicit);
    if (fs.existsSync(candidate)) return candidate;
  }

  const base = nonEmpty(rec?.outputFileBase) || safeFileId(rec?.erc8004Id);
  const exts = ['.png', '.jpg', '.jpeg', '.webp'];
  for (const ext of exts) {
    const candidate = path.join(imagesDir, `${base}${ext}`);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function buildOutputFilename(rec, mimeType, fallbackIndex) {
  const extFromResponse = extFromMime(mimeType) || '.png';
  const explicit = nonEmpty(rec?.outputFilename);
  const explicitExt = explicit ? path.extname(explicit).toLowerCase() : null;
  if (explicit && explicitExt === extFromResponse) {
    return {
      filename: explicit,
      extensionMismatch: false,
      extension: extFromResponse
    };
  }

  const base =
    nonEmpty(rec?.outputFileBase) ||
    (explicit ? path.basename(explicit, path.extname(explicit)) : null) ||
    safeFileId(rec?.erc8004Id) ||
    `image-${fallbackIndex}`;

  return {
    filename: `${base}${extFromResponse}`,
    extensionMismatch: Boolean(explicit && explicitExt && explicitExt !== extFromResponse),
    extension: extFromResponse
  };
}

function writeJsonl(filePath, rows) {
  const lines = rows.map((row) => JSON.stringify(row)).join('\n');
  fs.writeFileSync(filePath, lines ? `${lines}\n` : '', 'utf8');
}

function extractInlineImage(responseJson) {
  const candidates = Array.isArray(responseJson?.candidates) ? responseJson.candidates : [];
  for (const candidate of candidates) {
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    for (const part of parts) {
      const inline = part?.inlineData || part?.inline_data;
      const data = nonEmpty(inline?.data);
      if (!data) continue;
      const mimeType = nonEmpty(inline?.mimeType || inline?.mime_type) || 'image/png';
      return { mimeType, data };
    }
  }

  const textParts = [];
  for (const candidate of candidates) {
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    for (const part of parts) {
      const text = nonEmpty(part?.text);
      if (text) textParts.push(text);
    }
  }

  return {
    error: textParts.length
      ? `NO_INLINE_IMAGE_IN_RESPONSE:${textParts.join(' | ').slice(0, 400)}`
      : 'NO_INLINE_IMAGE_IN_RESPONSE'
  };
}

function isRetryableStatus(statusCode) {
  return RETRYABLE_STATUS.has(Number(statusCode));
}

async function fetchOAuthTokenFromRefreshToken(opts) {
  const clientId = opts.oauthClientId;
  const clientSecret = opts.oauthClientSecret;
  const refreshToken = opts.oauthRefreshToken;
  if (!clientId || !clientSecret || !refreshToken) return null;

  const body = new URLSearchParams();
  body.set('client_id', clientId);
  body.set('client_secret', clientSecret);
  body.set('refresh_token', refreshToken);
  body.set('grant_type', 'refresh_token');

  const response = await fetch(opts.oauthTokenUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });

  const raw = await response.text();
  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    throw new Error(`OAUTH_REFRESH_FAILED:${response.status}:${raw.slice(0, 500)}`);
  }

  const accessToken = nonEmpty(parsed?.access_token);
  if (!accessToken) throw new Error('OAUTH_REFRESH_FAILED:NO_ACCESS_TOKEN');

  const expiresIn = Number(parsed?.expires_in);
  const ttlMs = Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn * 1000 : 45 * 60 * 1000;

  return {
    accessToken,
    expiresAt: Date.now() + ttlMs
  };
}

async function fetchOAuthTokenFromCommand(opts) {
  const command = nonEmpty(opts.oauthTokenCommand);
  if (!command) throw new Error('OAUTH_TOKEN_COMMAND_MISSING');

  const { stdout } = await execAsync(command, { timeout: Math.max(1000, opts.timeoutMs) });
  const token = nonEmpty(stdout);
  if (!token) throw new Error('OAUTH_TOKEN_COMMAND_EMPTY');

  return {
    accessToken: token.split(/\s+/)[0],
    expiresAt: Date.now() + 45 * 60 * 1000
  };
}

function makeAuthClient(opts) {
  const state = {
    cachedOauthToken: null,
    cachedOauthTokenExpiresAt: 0
  };

  async function getOauthToken() {
    if (opts.oauthAccessToken) return opts.oauthAccessToken;

    if (state.cachedOauthToken && Date.now() < state.cachedOauthTokenExpiresAt - 60_000) {
      return state.cachedOauthToken;
    }

    let tokenObj = null;
    tokenObj = await fetchOAuthTokenFromRefreshToken(opts);
    if (!tokenObj) tokenObj = await fetchOAuthTokenFromCommand(opts);

    state.cachedOauthToken = tokenObj.accessToken;
    state.cachedOauthTokenExpiresAt = tokenObj.expiresAt;
    return state.cachedOauthToken;
  }

  return {
    clearOAuthCache() {
      state.cachedOauthToken = null;
      state.cachedOauthTokenExpiresAt = 0;
    },

    async applyAuthHeaders(headers) {
      if (opts.auth === 'api-key') {
        if (!opts.apiKey) throw new Error('MISSING_API_KEY: set --api-key or GEMINI_API_KEY');
        headers['x-goog-api-key'] = opts.apiKey;
        return;
      }

      const token = await getOauthToken();
      headers.authorization = `Bearer ${token}`;
      if (opts.googleCloudProject) {
        headers['x-goog-user-project'] = opts.googleCloudProject;
      }
    }
  };
}

async function generateOneImage({ opts, authClient, prompt, requestId }) {
  const endpoint = `${opts.apiBaseUrl}/models/${encodeURIComponent(opts.model)}:generateContent`;

  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ['Image'],
      imageConfig: {
        aspectRatio: opts.aspectRatio
      }
    }
  };

  let lastError = null;
  for (let attempt = 0; attempt <= opts.maxRetries; attempt += 1) {
    const headers = {
      'content-type': 'application/json'
    };

    await authClient.applyAuthHeaders(headers);

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), opts.timeoutMs);

    let response;
    let responseText = null;

    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      responseText = await response.text();
    } catch (err) {
      clearTimeout(timeoutHandle);
      const isFinal = attempt >= opts.maxRetries;
      lastError = new Error(`REQUEST_FAILED:${err?.message || String(err)}`);
      if (isFinal) break;
      const delay = opts.retryBackoffMs * Math.max(1, 2 ** attempt) + Math.floor(Math.random() * 250);
      await sleep(delay);
      continue;
    }

    clearTimeout(timeoutHandle);

    if (!response.ok) {
      const status = Number(response.status);
      const bodyPreview = String(responseText || '').slice(0, 600).replace(/\s+/g, ' ').trim();
      const errMsg = `HTTP_${status}:${bodyPreview || 'empty_body'}`;

      // Token expiry edge case: clear cached OAuth token and retry once.
      if (opts.auth === 'oauth' && status === 401 && attempt < opts.maxRetries) {
        authClient.clearOAuthCache();
      }

      const shouldRetry = isRetryableStatus(status) || (opts.auth === 'oauth' && status === 401);
      if (!shouldRetry || attempt >= opts.maxRetries) {
        lastError = new Error(errMsg);
        break;
      }

      const delay = opts.retryBackoffMs * Math.max(1, 2 ** attempt) + Math.floor(Math.random() * 250);
      await sleep(delay);
      continue;
    }

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const isFinal = attempt >= opts.maxRetries;
      lastError = new Error(`INVALID_JSON_RESPONSE:${String(responseText || '').slice(0, 300)}`);
      if (isFinal) break;
      const delay = opts.retryBackoffMs * Math.max(1, 2 ** attempt) + Math.floor(Math.random() * 250);
      await sleep(delay);
      continue;
    }

    const extracted = extractInlineImage(parsed);
    if (extracted.error) {
      const isFinal = attempt >= opts.maxRetries;
      lastError = new Error(extracted.error);
      if (isFinal) break;
      const delay = opts.retryBackoffMs * Math.max(1, 2 ** attempt) + Math.floor(Math.random() * 250);
      await sleep(delay);
      continue;
    }

    return extracted;
  }

  throw new Error(`${lastError?.message || 'UNKNOWN_GENERATION_ERROR'}:${requestId}`);
}

async function run() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    printHelp();
    return;
  }

  if (!fs.existsSync(opts.manifest)) throw new Error(`MANIFEST_NOT_FOUND:${opts.manifest}`);
  fs.mkdirSync(opts.imagesDir, { recursive: true });
  fs.mkdirSync(opts.reportsDir, { recursive: true });

  const manifestRows = readJsonl(opts.manifest);
  const rows = manifestRows
    .slice(opts.startOffset)
    .slice(0, opts.limit > 0 ? opts.limit : undefined)
    .map((row, idx) => ({ ...row, __manifestIndex: opts.startOffset + idx }));

  const promptRows = rows.filter((row) => nonEmpty(row?.prompt));
  const plannedImages = promptRows.length;
  const plannedCost = plannedImages * opts.unitCostUsd;

  process.stdout.write(
    [
      `[nano-banana] manifest=${opts.manifest}`,
      `[nano-banana] images_dir=${opts.imagesDir}`,
      `[nano-banana] reports_dir=${opts.reportsDir}`,
      `[nano-banana] model=${opts.model} auth=${opts.auth} aspect_ratio=${opts.aspectRatio}`,
      `[nano-banana] rows_total=${manifestRows.length} rows_selected=${rows.length} with_prompt=${plannedImages}`,
      `[nano-banana] unit_cost_usd=${opts.unitCostUsd.toFixed(6)} planned_cost_usd=${plannedCost.toFixed(2)}`,
      `[nano-banana] max_spend_usd=${opts.maxSpendUsd == null ? 'unbounded' : opts.maxSpendUsd.toFixed(2)} mode=${opts.dryRun ? 'dry-run' : 'apply'}`
    ].join('\n') + '\n'
  );

  if (opts.dryRun) return;

  if (opts.auth === 'api-key' && !opts.apiKey) {
    throw new Error('MISSING_API_KEY: set --api-key or GEMINI_API_KEY for --auth api-key');
  }

  if (
    opts.auth === 'oauth' &&
    !opts.oauthAccessToken &&
    !(opts.oauthClientId && opts.oauthClientSecret && opts.oauthRefreshToken) &&
    !opts.oauthTokenCommand
  ) {
    throw new Error('MISSING_OAUTH_SOURCE: provide access token, refresh credentials, or --oauth-token-command');
  }

  const authClient = makeAuthClient(opts);

  const state = {
    cursor: 0,
    stopForBudget: false,
    reservedBudgetUsd: 0,
    generated: 0,
    failed: 0,
    skippedExisting: 0,
    skippedNoPrompt: rows.length - promptRows.length,
    extensionMismatch: 0,
    estimatedSpendUsd: 0,
    failureRows: [],
    resolvedRows: []
  };

  async function processRow(row, workerId) {
    const prompt = nonEmpty(row?.prompt);
    if (!prompt) return;

    const existingPath = findExistingImagePath(opts.imagesDir, row);
    if (existingPath && !opts.overwrite) {
      state.skippedExisting += 1;
      state.resolvedRows.push({
        erc8004Id: nonEmpty(row?.erc8004Id) || null,
        outputFileBase: nonEmpty(row?.outputFileBase) || null,
        outputFilename: nonEmpty(row?.outputFilename) || null,
        resolvedFilename: path.basename(existingPath),
        absolutePath: path.resolve(existingPath),
        status: 'existing'
      });
      return;
    }

    if (opts.maxSpendUsd != null) {
      if (state.reservedBudgetUsd + opts.unitCostUsd > opts.maxSpendUsd + 1e-9) {
        state.stopForBudget = true;
        return;
      }
      state.reservedBudgetUsd += opts.unitCostUsd;
    }

    const requestId = `${row.__manifestIndex}:${nonEmpty(row?.erc8004Id) || `row-${row.__manifestIndex}`}`;

    try {
      const generated = await generateOneImage({
        opts,
        authClient,
        prompt,
        requestId
      });

      const { filename, extensionMismatch } = buildOutputFilename(
        row,
        generated.mimeType,
        row.__manifestIndex
      );
      const outputPath = path.join(opts.imagesDir, filename);

      fs.writeFileSync(outputPath, Buffer.from(generated.data, 'base64'));

      state.generated += 1;
      state.estimatedSpendUsd += opts.unitCostUsd;
      if (extensionMismatch) state.extensionMismatch += 1;

      state.resolvedRows.push({
        erc8004Id: nonEmpty(row?.erc8004Id) || null,
        outputFileBase: nonEmpty(row?.outputFileBase) || null,
        outputFilename: nonEmpty(row?.outputFilename) || null,
        resolvedFilename: filename,
        absolutePath: path.resolve(outputPath),
        mimeType: generated.mimeType,
        status: 'generated'
      });

      const done = state.generated + state.failed + state.skippedExisting;
      if (done % 25 === 0) {
        process.stdout.write(
          `[nano-banana] progress generated=${state.generated} failed=${state.failed} skipped_existing=${state.skippedExisting} spend_est_usd=${state.estimatedSpendUsd.toFixed(2)}\n`
        );
      }
    } catch (err) {
      state.failed += 1;
      state.failureRows.push({
        erc8004Id: nonEmpty(row?.erc8004Id) || null,
        manifestIndex: row.__manifestIndex,
        outputFileBase: nonEmpty(row?.outputFileBase) || null,
        outputFilename: nonEmpty(row?.outputFilename) || null,
        error: err?.message || String(err)
      });
    }
  }

  async function worker(workerId) {
    while (true) {
      if (state.stopForBudget) return;
      const idx = state.cursor;
      state.cursor += 1;
      if (idx >= rows.length) return;
      await processRow(rows[idx], workerId);
    }
  }

  const workerCount = Math.min(opts.concurrency, Math.max(1, rows.length));
  await Promise.all(Array.from({ length: workerCount }, (_, i) => worker(i)));

  const runStamp = nowCompactUtc();
  const summary = {
    generatedAt: new Date().toISOString(),
    authMode: opts.auth,
    manifest: opts.manifest,
    imagesDir: opts.imagesDir,
    reportsDir: opts.reportsDir,
    model: opts.model,
    aspectRatio: opts.aspectRatio,
    apiBaseUrl: opts.apiBaseUrl,
    config: {
      concurrency: opts.concurrency,
      startOffset: opts.startOffset,
      limit: opts.limit,
      overwrite: opts.overwrite,
      timeoutMs: opts.timeoutMs,
      maxRetries: opts.maxRetries,
      retryBackoffMs: opts.retryBackoffMs,
      unitCostUsd: opts.unitCostUsd,
      maxSpendUsd: opts.maxSpendUsd
    },
    totals: {
      rowsTotal: manifestRows.length,
      rowsSelected: rows.length,
      skippedNoPrompt: state.skippedNoPrompt,
      skippedExisting: state.skippedExisting,
      generated: state.generated,
      failed: state.failed,
      extensionMismatch: state.extensionMismatch,
      stopForBudget: state.stopForBudget,
      estimatedSpendUsd: Number(state.estimatedSpendUsd.toFixed(6))
    }
  };

  const summaryPath = path.join(opts.reportsDir, `nano-banana-run-${runStamp}.json`);
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');

  let failuresPath = null;
  if (state.failureRows.length > 0) {
    failuresPath = path.join(opts.reportsDir, `nano-banana-failures-${runStamp}.jsonl`);
    writeJsonl(failuresPath, state.failureRows);
  }

  const resolvedPath =
    opts.resolvedManifest ||
    path.join(opts.reportsDir, `nano-banana-resolved-${runStamp}.jsonl`);
  writeJsonl(resolvedPath, state.resolvedRows);

  process.stdout.write(
    [
      `[nano-banana] generated=${state.generated} failed=${state.failed} skipped_existing=${state.skippedExisting} skipped_no_prompt=${state.skippedNoPrompt}`,
      `[nano-banana] stop_for_budget=${state.stopForBudget} est_spend_usd=${state.estimatedSpendUsd.toFixed(2)}`,
      `[nano-banana] summary=${summaryPath}`,
      `[nano-banana] resolved_manifest=${resolvedPath}`,
      `[nano-banana] failures=${failuresPath || 'none'}`
    ].join('\n') + '\n'
  );

  if (state.failed > 0) process.exitCode = 2;
}

run().catch((err) => {
  process.stderr.write(`${err?.message || String(err)}\n`);
  process.exit(1);
});
