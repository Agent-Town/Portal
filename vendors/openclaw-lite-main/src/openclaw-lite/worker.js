/* eslint-disable no-console */

import { agentLoop } from "@mariozechner/pi-agent-core/dist/agent-loop.js";
import { getModel as getPiModel } from "@mariozechner/pi-ai/dist/models.js";
import { zipSync } from "fflate";

import {
  repairToolCallInputs,
  repairToolUseResultPairing,
} from "../../vendor/openclaw-main/src/agents/session-transcript-repair.ts";

import { base58Encode } from "./shared/base58.js";
import { b64ToBytes, bytesToB64, utf8ToBytes } from "./shared/encoding.js";
import {
  aesGcmDecryptRaw,
  aesGcmEncryptRaw,
  hkdfSha256,
  importHmacSha256Key,
  randomBytes,
  sha256,
  sha256B64FromUtf8,
  hmacSha256B64,
} from "./shared/crypto.js";
import { deleteByKeys, getAllFromIndex, getRecord, putRecord } from "./shared/idb.js";
import { vfsGetUtf8, vfsListPaths, vfsPutBytes, vfsPutUtf8, vfsReadAllBytes } from "./shared/vfs.js";

const OPENCLAW_VERSION = __OPENCLAW_VERSION__;
const PI_VERSIONS = __PI_VERSIONS__;

const MAIN_AGENT_ID = "main";
const MAIN_SESSION_KEY = "agent:main:main";
const LITE_TOOL_DISPATCH_PATH = "lite_tool_dispatch_v1";
const DEFAULT_WEB_FETCH_MAX_BYTES = 262_144;
const MAX_WEB_FETCH_MAX_BYTES = 1_048_576;
const WEB_FETCH_PROXY_PATH = "/api/tools/web_fetch";
const HTTP_REQUEST_PROXY_PATH = "/api/tools/http_request";
const DEFAULT_HTTP_TIMEOUT_MS = 30_000;
const MAX_HTTP_TIMEOUT_MS = 60_000;
const MIN_HTTP_TIMEOUT_MS = 100;
const DEFAULT_HTTP_MAX_BYTES = 262_144;
const MAX_HTTP_BODY_BYTES = 65_536;
const HTTP_RATE_LIMIT_WINDOW_MS = 1000;
const HTTP_RATE_LIMIT_MAX = 2;
const WS_DEFAULT_CONNECT_TIMEOUT_MS = 10_000;
const WS_MAX_CONNECT_TIMEOUT_MS = 30_000;
const WS_DEFAULT_RECV_WAIT_MS = 5_000;
const WS_MAX_RECV_WAIT_MS = 30_000;
const WS_MAX_RECV_MESSAGES = 50;

const MAX_CHECKPOINTS_PER_HOUSE = 50;

function post(msg) {
  self.postMessage(msg);
}

function log(line) {
  post({ type: "worker.log.append", line: String(line || "") });
}

function updateGatewayState() {
  post({
    type: "worker.state.update",
    state: {
      houseId: state.houseId,
      vault: { latestBackupId: state.vaultLatestBackupId || null },
    },
  });
}

function nowMs() {
  return Date.now();
}

function randomId(prefix) {
  const r = Math.random().toString(16).slice(2);
  return `${prefix}_${Date.now()}_${r}`;
}

async function metaGet(key) {
  const rec = await getRecord("meta", key);
  return rec ? rec.value : null;
}

async function metaSet(key, value) {
  await putRecord("meta", { key, value });
}

function safeOrigin() {
  try {
    return self.location?.origin || "";
  } catch {
    return "";
  }
}

function assertAllowlistedUrl(url) {
  const u = new URL(url, safeOrigin() || "http://localhost");
  const origin = safeOrigin();
  if (origin && u.origin !== origin) {
    throw new Error("NETWORK_ORIGIN_NOT_ALLOWLISTED");
  }
}

function normalizeHttpMethod(method) {
  const m = String(method || "GET").trim().toUpperCase();
  return m || "GET";
}

function parseUrlOrigin(url) {
  const u = new URL(String(url || ""), safeOrigin() || "http://localhost");
  return u.origin;
}

function parseOriginMethods(methods) {
  if (!Array.isArray(methods) || methods.length === 0) return null;
  const out = methods
    .map((m) => normalizeHttpMethod(m))
    .filter(Boolean);
  return out.length > 0 ? Array.from(new Set(out)) : null;
}

function matchingOriginGrant({ origin, capability, method }) {
  for (const grant of state.originGrants) {
    if (!grant || grant.origin !== origin || grant.capability !== capability) continue;
    if (Array.isArray(grant.methods) && grant.methods.length > 0 && !grant.methods.includes(method)) continue;
    return grant;
  }
  return null;
}

function evaluateOriginAccess({ url, capability = "web_fetch", method = "GET", consume = true }) {
  const origin = parseUrlOrigin(url);
  const methodNorm = normalizeHttpMethod(method);
  const localOrigin = safeOrigin();

  if (localOrigin && origin === localOrigin) {
    return {
      allowed: true,
      sameOrigin: true,
      origin,
      capability,
      method: methodNorm,
      grantId: null,
      scope: "same-origin",
    };
  }

  const grant = matchingOriginGrant({ origin, capability: String(capability || ""), method: methodNorm });
  if (!grant) {
    return {
      allowed: false,
      origin,
      capability,
      method: methodNorm,
      error: "NETWORK_BLOCKED",
    };
  }

  if (consume && grant.scope === "once") {
    state.originGrants = state.originGrants.filter((g) => g && g.id !== grant.id);
  }

  return {
    allowed: true,
    sameOrigin: false,
    origin,
    capability,
    method: methodNorm,
    grantId: grant.id,
    scope: grant.scope,
  };
}

async function requestOriginGrant({ url, capability = "web_fetch", scope = "once", methods }) {
  const origin = parseUrlOrigin(url);
  const methodList = parseOriginMethods(methods);
  const scopeNorm = scope === "session" ? "session" : "once";
  const cap = String(capability || "web_fetch");
  const methodsSummary = methodList && methodList.length > 0 ? methodList.join(",") : "any";
  const body = `Origin grant (${scopeNorm}): ${cap} @ ${origin} methods=${methodsSummary}`;
  const decision = await requestApproval({ title: "Approval", body });
  if (decision !== "approve") {
    return {
      ok: false,
      error: "APPROVAL_REJECTED",
      origin,
      capability: cap,
      scope: scopeNorm,
    };
  }

  const grant = {
    id: randomId("og"),
    origin,
    capability: cap,
    scope: scopeNorm,
    methods: methodList,
    createdAtMs: nowMs(),
  };
  state.originGrants.push(grant);
  return { ok: true, grantId: grant.id, origin, capability: cap, scope: scopeNorm, methods: methodList };
}

function revokeOriginGrant(grantId) {
  const id = String(grantId || "").trim();
  if (!id) return { ok: false, error: "INVALID_GRANT_ID", removed: false };
  const before = state.originGrants.length;
  state.originGrants = state.originGrants.filter((g) => g && g.id !== id);
  return { ok: true, removed: state.originGrants.length < before, grantId: id };
}

async function apiJson(url, opts = {}) {
  assertAllowlistedUrl(url);
  const res = await fetch(url, {
    ...opts,
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(opts.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data?.error || `HTTP_${res.status}`;
    throw new Error(err);
  }
  return data;
}

function makeToolSuccess(data) {
  return { ok: true, data };
}

function makeToolFailure(code, message, details = {}, retryable = false) {
  return {
    ok: false,
    error: {
      code: String(code || "UNSUPPORTED"),
      message: String(message || code || "Tool failed"),
      retryable: !!retryable,
      details: details && typeof details === "object" ? details : {},
    },
  };
}

function withToolMeta(toolName, startedAtMs, envelope) {
  return {
    ...(envelope || {}),
    meta: {
      tool: String(toolName || ""),
      durationMs: Math.max(0, nowMs() - Number(startedAtMs || 0)),
    },
  };
}

function normalizeMaxBytes(value) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_WEB_FETCH_MAX_BYTES;
  return Math.min(MAX_WEB_FETCH_MAX_BYTES, n);
}

function normalizeCacheMode(value) {
  const raw = String(value || "allow-cache");
  if (raw === "bypass" || raw === "revalidate") return raw;
  return "allow-cache";
}

function cacheModeToFetchCache(mode) {
  if (mode === "bypass") return "no-store";
  if (mode === "revalidate") return "reload";
  return "default";
}

function normalizeExpectedMime(value) {
  const raw = String(value || "any").trim().toLowerCase();
  if (!raw || raw === "any") return "any";
  if (raw === "text/markdown") return "text/markdown";
  if (raw === "text/plain") return "text/plain";
  if (raw === "application/json") return "application/json";
  return "any";
}

function mimeMatchesExpected(expectedMime, contentType) {
  if (expectedMime === "any") return true;
  const ct = String(contentType || "").toLowerCase();
  return ct.startsWith(expectedMime);
}

function normalizeWebFetchInput(params) {
  const rawUrl = typeof params?.url === "string" ? params.url.trim() : "";
  if (!rawUrl) throw new Error("INVALID_ARGUMENTS");

  let parsed;
  try {
    parsed = new URL(rawUrl, safeOrigin() || "http://localhost");
  } catch {
    throw new Error("INVALID_ARGUMENTS");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("INVALID_ARGUMENTS");
  }

  return {
    url: parsed.toString(),
    maxBytes: normalizeMaxBytes(params?.maxBytes),
    followRedirects: params?.followRedirects !== false,
    cacheMode: normalizeCacheMode(params?.cacheMode),
    expectedMime: normalizeExpectedMime(params?.expectedMime),
  };
}

function truncateTextUtf8(text, maxBytes) {
  const bytes = utf8ToBytes(String(text || ""));
  if (bytes.length <= maxBytes) {
    return { text: String(text || ""), truncated: false };
  }
  const slice = bytes.slice(0, maxBytes);
  return { text: new TextDecoder().decode(slice), truncated: true };
}

function contentTypeSummary(headers) {
  const contentType = headers.get("content-type") || "";
  const etag = headers.get("etag") || null;
  const lastModified = headers.get("last-modified") || null;
  return { contentType, etag, lastModified };
}

async function webFetchSameOrigin(input) {
  const response = await fetch(input.url, {
    method: "GET",
    credentials: "include",
    redirect: input.followRedirects ? "follow" : "manual",
    cache: cacheModeToFetchCache(input.cacheMode),
  });

  const rawText = await response.text();
  const { text, truncated } = truncateTextUtf8(rawText, input.maxBytes);
  const { contentType, etag, lastModified } = contentTypeSummary(response.headers);

  if (!mimeMatchesExpected(input.expectedMime, contentType)) {
    return makeToolFailure("UNSUPPORTED", "MIME type mismatch", {
      expectedMime: input.expectedMime,
      contentType,
    });
  }

  return makeToolSuccess({
    url: input.url,
    finalUrl: response.url || input.url,
    status: response.status,
    contentType,
    etag,
    lastModified,
    sha256B64: bytesToB64(await sha256(utf8ToBytes(text))),
    text,
    truncated,
    fromCache: false,
  });
}

async function webFetchCrossOriginViaProxy(input) {
  const res = await fetch(WEB_FETCH_PROXY_PATH, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      url: input.url,
      maxBytes: input.maxBytes,
      followRedirects: input.followRedirects,
      cacheMode: input.cacheMode,
      expectedMime: input.expectedMime,
    }),
  });

  const payload = await res.json().catch(() => null);
  if (payload && typeof payload === "object") {
    if (payload.ok === true) return payload;
    if (payload.ok === false && payload.error && typeof payload.error === "object") return payload;
  }

  return makeToolFailure("UNSUPPORTED", "Proxy fetch failed", {
    status: res.status || 0,
    url: input.url,
  });
}

async function runWebFetch(params, toolName = "web_fetch") {
  const startedAtMs = nowMs();
  let normalized;
  try {
    normalized = normalizeWebFetchInput(params || {});
  } catch (e) {
    if (String(e?.message || "") === "INVALID_ARGUMENTS") {
      return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Invalid web_fetch arguments"));
    }
    return withToolMeta(toolName, startedAtMs, makeToolFailure("UNSUPPORTED", e?.message || "web_fetch failed"));
  }

  const access = evaluateOriginAccess({
    url: normalized.url,
    capability: "web_fetch",
    method: "GET",
    consume: true,
  });
  if (!access.allowed) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("NETWORK_BLOCKED", "Origin not granted", { origin: access.origin }));
  }

  try {
    const envelope = access.sameOrigin
      ? await webFetchSameOrigin(normalized)
      : await webFetchCrossOriginViaProxy(normalized);
    return withToolMeta(toolName, startedAtMs, envelope);
  } catch (e) {
    const msg = String(e?.message || "web_fetch failed");
    if (msg === "NETWORK_BLOCKED") {
      return withToolMeta(toolName, startedAtMs, makeToolFailure("NETWORK_BLOCKED", "Network blocked"));
    }
    return withToolMeta(toolName, startedAtMs, makeToolFailure("UNSUPPORTED", msg));
  }
}

function envelopeToToolResult(envelope, toolName) {
  return liteToolResult(JSON.stringify(envelope), {
    dispatchPath: LITE_TOOL_DISPATCH_PATH,
    tool: String(toolName || ""),
    ok: envelope?.ok === true,
    errorCode: envelope?.ok === false ? envelope?.error?.code || null : null,
  });
}

function normalizeHttpTimeoutMs(value) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return DEFAULT_HTTP_TIMEOUT_MS;
  if (n < MIN_HTTP_TIMEOUT_MS) return MIN_HTTP_TIMEOUT_MS;
  if (n > MAX_HTTP_TIMEOUT_MS) return MAX_HTTP_TIMEOUT_MS;
  return n;
}

function normalizeHttpResponseMode(value) {
  const mode = String(value || "auto").trim().toLowerCase();
  if (mode === "json" || mode === "text" || mode === "base64") return mode;
  return "auto";
}

function normalizeHttpMaxBytes(value) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_HTTP_MAX_BYTES;
  return Math.min(MAX_WEB_FETCH_MAX_BYTES, n);
}

function normalizeObjectRecord(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  return input;
}

function normalizeHttpHeaders(input) {
  const src = normalizeObjectRecord(input);
  const out = {};
  for (const [k, v] of Object.entries(src)) {
    const key = String(k || "").trim().toLowerCase();
    if (!key) continue;
    if (v == null) continue;
    out[key] = String(v);
  }
  return out;
}

function normalizeHttpQuery(input) {
  const src = normalizeObjectRecord(input);
  const out = {};
  for (const [k, v] of Object.entries(src)) {
    const key = String(k || "").trim();
    if (!key) continue;
    if (Array.isArray(v)) {
      out[key] = v.map((x) => String(x));
    } else {
      out[key] = String(v);
    }
  }
  return out;
}

function applyHttpQuery(url, query) {
  const parsed = new URL(url);
  for (const [k, v] of Object.entries(query || {})) {
    parsed.searchParams.delete(k);
    if (Array.isArray(v)) {
      for (const entry of v) parsed.searchParams.append(k, String(entry));
    } else {
      parsed.searchParams.set(k, String(v));
    }
  }
  return parsed.toString();
}

function normalizeHttpBody(body, headers) {
  if (!body || typeof body !== "object") {
    return { wire: null, fetchBody: null, byteLength: 0 };
  }
  const kind = String(body.kind || "text").trim().toLowerCase();
  if (kind === "json") {
    const jsonValue = body.json !== undefined ? body.json : {};
    const text = JSON.stringify(jsonValue);
    if (!headers["content-type"]) headers["content-type"] = "application/json";
    return {
      wire: { kind: "json", json: jsonValue },
      fetchBody: text,
      byteLength: utf8ToBytes(text).length,
    };
  }
  if (kind === "text") {
    const text = typeof body.text === "string" ? body.text : String(body.text ?? "");
    return {
      wire: { kind: "text", text },
      fetchBody: text,
      byteLength: utf8ToBytes(text).length,
    };
  }
  if (kind === "base64") {
    const base64 = typeof body.base64 === "string" ? body.base64 : "";
    const bytes = b64ToBytes(base64);
    return {
      wire: { kind: "base64", base64 },
      fetchBody: bytes,
      byteLength: bytes.length,
    };
  }
  throw new Error("INVALID_ARGUMENTS");
}

function normalizeHttpAuthInput(auth) {
  if (!auth || typeof auth !== "object") return { kind: "none" };
  const kind = String(auth.kind || "none").trim().toLowerCase();
  if (kind === "none") return { kind: "none" };
  if (kind === "bearer_secret_ref") {
    const secretRef = typeof auth.secretRef === "string" ? auth.secretRef.trim() : "";
    if (!secretRef) throw new Error("INVALID_ARGUMENTS");
    return { kind, secretRef };
  }
  throw new Error("INVALID_ARGUMENTS");
}

function isValidSecretName(name) {
  return /^[A-Za-z0-9._-]{1,128}$/.test(String(name || ""));
}

function redactStringSecrets(text, secrets) {
  let out = String(text || "");
  for (const secret of secrets || []) {
    if (typeof secret !== "string" || !secret) continue;
    out = out.split(secret).join("****");
    out = out.split(`Bearer ${secret}`).join("Bearer ****");
  }
  return out;
}

function deepRedactSecrets(value, secrets) {
  if (typeof value === "string") return redactStringSecrets(value, secrets);
  if (Array.isArray(value)) return value.map((v) => deepRedactSecrets(v, secrets));
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = deepRedactSecrets(v, secrets);
    }
    return out;
  }
  return value;
}

function redactEnvelopeSecrets(envelope, secrets) {
  if (!Array.isArray(secrets) || secrets.length === 0) return envelope;
  return deepRedactSecrets(envelope, secrets);
}

function applyHttpAuthToHeaders(auth, headers) {
  const outHeaders = { ...(headers || {}) };
  const secretValues = [];
  if (!auth || auth.kind === "none") {
    return { ok: true, headers: outHeaders, secretValues };
  }
  if (auth.kind === "bearer_secret_ref") {
    const secretRef = String(auth.secretRef || "");
    const value = state.secretStore?.[secretRef];
    if (typeof value !== "string" || !value) {
      return {
        ok: false,
        failure: makeToolFailure("NOT_FOUND", "Secret not found", { secretRef }),
      };
    }
    outHeaders.authorization = `Bearer ${value}`;
    secretValues.push(value, `Bearer ${value}`);
    return { ok: true, headers: outHeaders, secretValues };
  }
  return {
    ok: false,
    failure: makeToolFailure("INVALID_ARGUMENTS", "Unsupported auth mode"),
  };
}

function normalizeHttpRequestInput(params) {
  const rawUrl = typeof params?.url === "string" ? params.url.trim() : "";
  if (!rawUrl) throw new Error("INVALID_ARGUMENTS");

  let parsed;
  try {
    parsed = new URL(rawUrl, safeOrigin() || "http://localhost");
  } catch {
    throw new Error("INVALID_ARGUMENTS");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("INVALID_ARGUMENTS");

  const method = normalizeHttpMethod(params?.method || "GET");
  const allowedMethods = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"]);
  if (!allowedMethods.has(method)) throw new Error("INVALID_ARGUMENTS");

  const headers = normalizeHttpHeaders(params?.headers);
  const query = normalizeHttpQuery(params?.query);
  const normalized = {
    method,
    url: applyHttpQuery(parsed.toString(), query),
    query,
    headers,
    auth: normalizeHttpAuthInput(params?.auth),
    timeoutMs: normalizeHttpTimeoutMs(params?.timeoutMs),
    followRedirects: params?.followRedirects !== false,
    maxBytes: normalizeHttpMaxBytes(params?.maxBytes),
    responseMode: normalizeHttpResponseMode(params?.responseMode),
    body: null,
    fetchBody: null,
  };

  const bodyInfo = normalizeHttpBody(params?.body, normalized.headers);
  if (bodyInfo.byteLength > MAX_HTTP_BODY_BYTES) {
    throw new Error("SIZE_LIMIT");
  }
  normalized.body = bodyInfo.wire;
  normalized.fetchBody = bodyInfo.fetchBody;
  return normalized;
}

function consumeHttpRateLimit(url) {
  const origin = parseUrlOrigin(url);
  const now = nowMs();
  const prev = state.httpRateLimit.get(origin) || [];
  const next = prev.filter((t) => now - t < HTTP_RATE_LIMIT_WINDOW_MS);
  if (next.length >= HTTP_RATE_LIMIT_MAX) {
    const retryAfterMs = Math.max(1, HTTP_RATE_LIMIT_WINDOW_MS - (now - next[0]));
    state.httpRateLimit.set(origin, next);
    return { ok: false, origin, retryAfterMs };
  }
  next.push(now);
  state.httpRateLimit.set(origin, next);
  return { ok: true, origin, retryAfterMs: 0 };
}

function headersToObject(headers) {
  const out = {};
  if (!headers || typeof headers.entries !== "function") return out;
  for (const [k, v] of headers.entries()) {
    out[String(k || "").toLowerCase()] = String(v || "");
  }
  return out;
}

function decodeHttpResponse(bytes, responseMode, contentType) {
  const bodyText = new TextDecoder().decode(bytes);
  let bodyJson = null;
  let bodyBase64 = "";
  const mode = normalizeHttpResponseMode(responseMode);
  const looksJson = String(contentType || "").toLowerCase().includes("application/json");
  if (mode === "json" || (mode === "auto" && looksJson)) {
    try {
      bodyJson = JSON.parse(bodyText);
    } catch {
      bodyJson = null;
    }
  }
  if (mode === "base64") {
    bodyBase64 = bytesToB64(bytes);
  }
  return { bodyText, bodyJson, bodyBase64 };
}

async function runHttpRequestSameOrigin(input) {
  const startedAtMs = nowMs();
  const abort = new AbortController();
  const timeoutId = setTimeout(() => abort.abort(), input.timeoutMs);
  let response;
  try {
    response = await fetch(input.url, {
      method: input.method,
      headers: input.headers,
      body: input.fetchBody == null ? undefined : input.fetchBody,
      credentials: "include",
      redirect: input.followRedirects ? "follow" : "manual",
      signal: abort.signal,
    });
  } catch (e) {
    clearTimeout(timeoutId);
    if (e?.name === "AbortError") {
      return makeToolFailure("TIMEOUT", "Request timed out", { timeoutMs: input.timeoutMs }, true);
    }
    return makeToolFailure("UNSUPPORTED", e?.message || "Request failed");
  } finally {
    clearTimeout(timeoutId);
  }

  const bytesRaw = new Uint8Array(await response.arrayBuffer());
  const truncated = bytesRaw.length > input.maxBytes;
  const bytes = truncated ? bytesRaw.slice(0, input.maxBytes) : bytesRaw;
  const headers = headersToObject(response.headers);
  const decoded = decodeHttpResponse(bytes, input.responseMode, headers["content-type"] || "");

  return makeToolSuccess({
    status: response.status,
    finalUrl: response.url || input.url,
    headers,
    bodyText: decoded.bodyText,
    bodyJson: decoded.bodyJson,
    bodyBase64: decoded.bodyBase64,
    truncated,
    timing: {
      startedAtMs,
      durationMs: Math.max(0, nowMs() - startedAtMs),
    },
  });
}

async function runHttpRequestCrossOriginViaProxy(input) {
  const res = await fetch(HTTP_REQUEST_PROXY_PATH, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      url: input.url,
      method: input.method,
      query: input.query,
      headers: input.headers,
      body: input.body,
      timeoutMs: input.timeoutMs,
      followRedirects: input.followRedirects,
      maxBytes: input.maxBytes,
      responseMode: input.responseMode,
    }),
  });
  const payload = await res.json().catch(() => null);
  if (payload && typeof payload === "object") {
    if (payload.ok === true) return payload;
    if (payload.ok === false && payload.error && typeof payload.error === "object") return payload;
  }
  return makeToolFailure("UNSUPPORTED", "Proxy request failed", { status: res.status || 0 });
}

async function persistSecretStore() {
  await metaSet("secretStoreV1", { ...(state.secretStore || {}) });
}

async function runSecretSet(params, toolName = "secret_set") {
  const startedAtMs = nowMs();
  const name = typeof params?.name === "string" ? params.name.trim() : "";
  const value = typeof params?.value === "string" ? params.value : "";
  if (!isValidSecretName(name) || !value) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Invalid secret_set arguments"));
  }

  const decision = await requestApproval({
    title: "Approval",
    body: `Secret set: ${name}`,
  });
  if (decision !== "approve") {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("APPROVAL_REJECTED", "Secret set rejected"));
  }

  state.secretStore[name] = value;
  await persistSecretStore();
  return withToolMeta(toolName, startedAtMs, makeToolSuccess({ name, stored: true }));
}

function runSecretList(_params, toolName = "secret_list") {
  const startedAtMs = nowMs();
  const names = Object.keys(state.secretStore || {}).sort();
  return withToolMeta(toolName, startedAtMs, makeToolSuccess({ names, count: names.length }));
}

async function runSecretDelete(params, toolName = "secret_delete") {
  const startedAtMs = nowMs();
  const name = typeof params?.name === "string" ? params.name.trim() : "";
  if (!isValidSecretName(name)) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Invalid secret name"));
  }
  if (!Object.prototype.hasOwnProperty.call(state.secretStore || {}, name)) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("NOT_FOUND", "Secret not found", { name }));
  }

  const decision = await requestApproval({
    title: "Approval",
    body: `Secret delete: ${name}`,
  });
  if (decision !== "approve") {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("APPROVAL_REJECTED", "Secret delete rejected"));
  }

  delete state.secretStore[name];
  await persistSecretStore();
  return withToolMeta(toolName, startedAtMs, makeToolSuccess({ name, deleted: true }));
}

function normalizeWsConnectTimeoutMs(value) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n <= 0) return WS_DEFAULT_CONNECT_TIMEOUT_MS;
  return Math.min(WS_MAX_CONNECT_TIMEOUT_MS, n);
}

function normalizeWsWaitMs(value) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 0) return WS_DEFAULT_RECV_WAIT_MS;
  return Math.min(WS_MAX_RECV_WAIT_MS, n);
}

function normalizeWsMaxMessages(value) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.min(WS_MAX_RECV_MESSAGES, n);
}

function normalizeWsUrl(raw) {
  const str = typeof raw === "string" ? raw.trim() : "";
  if (!str) throw new Error("INVALID_ARGUMENTS");
  let parsed;
  try {
    parsed = new URL(str, safeOrigin() || "http://localhost");
  } catch {
    throw new Error("INVALID_ARGUMENTS");
  }
  if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:") {
    throw new Error("INVALID_ARGUMENTS");
  }
  return parsed.toString();
}

function wsReadyStateName(socket) {
  if (!socket) return "closed";
  if (socket.readyState === WebSocket.CONNECTING) return "connecting";
  if (socket.readyState === WebSocket.OPEN) return "open";
  if (socket.readyState === WebSocket.CLOSING) return "closing";
  return "closed";
}

function parseWsMessageData(data) {
  if (typeof data === "string") {
    try {
      return { type: "json", text: data, json: JSON.parse(data) };
    } catch {
      return { type: "text", text: data };
    }
  }
  if (data instanceof ArrayBuffer) {
    return { type: "binary", base64: bytesToB64(new Uint8Array(data)) };
  }
  if (ArrayBuffer.isView(data)) {
    return { type: "binary", base64: bytesToB64(new Uint8Array(data.buffer)) };
  }
  return { type: "text", text: String(data ?? "") };
}

function wakeWsWaiters(session) {
  if (!session || !Array.isArray(session.waiters)) return;
  while (session.waiters.length > 0) {
    const fn = session.waiters.shift();
    try {
      fn();
    } catch {
      // ignore
    }
  }
}

function getWsSession(sessionId) {
  const id = typeof sessionId === "string" ? sessionId.trim() : "";
  if (!id) return null;
  return state.wsSessions.get(id) || null;
}

async function runWsOpen(params, toolName = "ws_open") {
  const startedAtMs = nowMs();
  let url;
  try {
    url = normalizeWsUrl(params?.url);
  } catch {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Invalid websocket URL"));
  }
  const protocols = Array.isArray(params?.protocols)
    ? params.protocols.map((p) => String(p || "").trim()).filter(Boolean).slice(0, 5)
    : [];
  const connectTimeoutMs = normalizeWsConnectTimeoutMs(params?.connectTimeoutMs);

  const access = evaluateOriginAccess({
    url: url.replace(/^wss:/, "https:").replace(/^ws:/, "http:"),
    capability: "ws_open",
    method: "GET",
    consume: true,
  });
  if (!access.allowed) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("NETWORK_BLOCKED", "Origin not granted", { origin: access.origin }));
  }

  const result = await new Promise((resolve) => {
    let settled = false;
    let sessionId = "";
    let socket;
    try {
      socket = protocols.length > 0 ? new WebSocket(url, protocols) : new WebSocket(url);
      socket.binaryType = "arraybuffer";
    } catch (e) {
      resolve(makeToolFailure("UNSUPPORTED", e?.message || "WS_OPEN_FAILED"));
      return;
    }

    const finish = (envelope) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(envelope);
    };

    const timer = setTimeout(() => {
      try {
        socket.close();
      } catch {
        // ignore
      }
      finish(makeToolFailure("TIMEOUT", "WebSocket connect timeout", { connectTimeoutMs }, true));
    }, connectTimeoutMs);

    socket.addEventListener("open", () => {
      sessionId = randomId("ws");
      const session = {
        id: sessionId,
        url,
        socket,
        queue: [],
        waiters: [],
        closed: false,
        closeInfo: null,
      };
      state.wsSessions.set(sessionId, session);

      socket.addEventListener("message", (ev) => {
        const current = state.wsSessions.get(sessionId);
        if (!current) return;
        current.queue.push(parseWsMessageData(ev.data));
        wakeWsWaiters(current);
      });

      socket.addEventListener("close", (ev) => {
        const current = state.wsSessions.get(sessionId);
        if (!current) return;
        current.closed = true;
        current.closeInfo = {
          code: Number(ev.code || 0),
          reason: String(ev.reason || ""),
          wasClean: !!ev.wasClean,
        };
        wakeWsWaiters(current);
      });

      finish(
        makeToolSuccess({
          sessionId,
          url,
          readyState: "open",
          protocol: socket.protocol || "",
        }),
      );
    });

    socket.addEventListener("error", () => {
      finish(makeToolFailure("UNSUPPORTED", "WS_OPEN_FAILED"));
    });
  });

  return withToolMeta(toolName, startedAtMs, result);
}

function runWsStatus(params, toolName = "ws_status") {
  const startedAtMs = nowMs();
  const session = getWsSession(params?.sessionId);
  if (!session) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("NOT_FOUND", "WebSocket session not found"));
  }
  return withToolMeta(
    toolName,
    startedAtMs,
    makeToolSuccess({
      sessionId: session.id,
      url: session.url,
      readyState: wsReadyStateName(session.socket),
      protocol: session.socket?.protocol || "",
      queuedMessages: session.queue.length,
      closed: !!session.closed,
    }),
  );
}

function runWsSend(params, toolName = "ws_send") {
  const startedAtMs = nowMs();
  const session = getWsSession(params?.sessionId);
  if (!session || session.closed || !session.socket || session.socket.readyState !== WebSocket.OPEN) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("NOT_FOUND", "WebSocket session not open"));
  }

  const hasText = typeof params?.text === "string";
  const hasJson = params && Object.prototype.hasOwnProperty.call(params, "json");
  if ((hasText && hasJson) || (!hasText && !hasJson)) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Provide exactly one of text or json"));
  }

  const payload = hasText ? params.text : JSON.stringify(params.json);
  try {
    session.socket.send(payload);
  } catch (e) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("UNSUPPORTED", e?.message || "WS_SEND_FAILED"));
  }

  return withToolMeta(
    toolName,
    startedAtMs,
    makeToolSuccess({
      sessionId: session.id,
      sentBytes: utf8ToBytes(payload).length,
    }),
  );
}

async function runWsRecv(params, toolName = "ws_recv") {
  const startedAtMs = nowMs();
  const session = getWsSession(params?.sessionId);
  if (!session) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("NOT_FOUND", "WebSocket session not found"));
  }

  const maxMessages = normalizeWsMaxMessages(params?.maxMessages);
  const waitMs = normalizeWsWaitMs(params?.waitMs);
  const drain = () => session.queue.splice(0, maxMessages);

  if (session.queue.length > 0) {
    return withToolMeta(toolName, startedAtMs, makeToolSuccess({ messages: drain() }));
  }
  if (session.closed) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("NOT_FOUND", "WebSocket session closed"));
  }

  await new Promise((resolve) => {
    let done = false;
    let timerId = null;
    const wake = () => {
      if (done) return;
      done = true;
      if (timerId !== null) clearTimeout(timerId);
      const idx = session.waiters.indexOf(wake);
      if (idx >= 0) session.waiters.splice(idx, 1);
      resolve();
    };
    timerId = setTimeout(wake, waitMs);
    session.waiters.push(wake);
    if (session.queue.length > 0 || session.closed) wake();
  });

  if (session.queue.length > 0) {
    return withToolMeta(toolName, startedAtMs, makeToolSuccess({ messages: drain() }));
  }
  if (session.closed) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("NOT_FOUND", "WebSocket session closed"));
  }
  return withToolMeta(toolName, startedAtMs, makeToolSuccess({ messages: [] }));
}

function runWsClose(params, toolName = "ws_close") {
  const startedAtMs = nowMs();
  const session = getWsSession(params?.sessionId);
  if (!session) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("NOT_FOUND", "WebSocket session not found"));
  }

  try {
    if (session.socket && session.socket.readyState === WebSocket.OPEN) {
      session.socket.close(1000, "client-close");
    } else if (session.socket && session.socket.readyState === WebSocket.CONNECTING) {
      session.socket.close();
    }
  } catch {
    // ignore
  }
  session.closed = true;
  wakeWsWaiters(session);
  state.wsSessions.delete(session.id);
  return withToolMeta(toolName, startedAtMs, makeToolSuccess({ sessionId: session.id, closed: true }));
}

async function runHttpRequest(params, toolName = "http_request") {
  const startedAtMs = nowMs();
  let input;
  try {
    input = normalizeHttpRequestInput(params || {});
  } catch (e) {
    const msg = String(e?.message || "INVALID_ARGUMENTS");
    if (msg === "SIZE_LIMIT") {
      return withToolMeta(toolName, startedAtMs, makeToolFailure("SIZE_LIMIT", "Request payload too large"));
    }
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Invalid http_request arguments"));
  }

  const access = evaluateOriginAccess({
    url: input.url,
    capability: "http_request",
    method: input.method,
    consume: true,
  });
  if (!access.allowed) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("NETWORK_BLOCKED", "Origin not granted", { origin: access.origin }));
  }

  const authApplied = applyHttpAuthToHeaders(input.auth, input.headers);
  if (!authApplied.ok) {
    return withToolMeta(toolName, startedAtMs, authApplied.failure);
  }
  input.headers = authApplied.headers;
  const secretValues = authApplied.secretValues || [];

  if (input.method === "POST" || input.method === "PUT" || input.method === "PATCH" || input.method === "DELETE") {
    const decision = await requestApproval({
      title: "Approval",
      body: `HTTP ${input.method}: ${input.url}`,
    });
    if (decision !== "approve") {
      return withToolMeta(toolName, startedAtMs, makeToolFailure("APPROVAL_REJECTED", "HTTP mutation rejected"));
    }
  }

  if (!access.sameOrigin) {
    const rate = consumeHttpRateLimit(input.url);
    if (!rate.ok) {
      return withToolMeta(
        toolName,
        startedAtMs,
        makeToolFailure("RATE_LIMIT", "Rate limit exceeded", { origin: rate.origin, retryAfterMs: rate.retryAfterMs }),
      );
    }
  }

  try {
    const envelope = access.sameOrigin
      ? await runHttpRequestSameOrigin(input)
      : await runHttpRequestCrossOriginViaProxy(input);
    return withToolMeta(toolName, startedAtMs, redactEnvelopeSecrets(envelope, secretValues));
  } catch (e) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("UNSUPPORTED", e?.message || "http_request failed"));
  }
}

// --- PI-AI model configuration (NO MOCKS) ---
//
// Lite runs PI's agent loop in-browser and uses PI-AI providers for real LLM calls.
// We keep same-origin by default and route third-party providers through a same-origin
// proxy path to avoid browser CORS failures.
function defaultLlmBaseUrl() {
  const u = new URL("/api/llm/openai/v1", safeOrigin() || "http://localhost");
  return u.toString();
}

function llmProxyBaseUrl(upstreamBaseUrl) {
  const raw = String(upstreamBaseUrl || "").trim();
  const normalized = raw.replace(/\/+$/, "");
  const encoded = encodeURIComponent(normalized);
  const u = new URL(`/api/llm/proxy/${encoded}`, safeOrigin() || "http://localhost");
  return u.toString();
}

function parseConfiguredModelRef() {
  const providerHint = String(state.llmProvider || "openai").trim() || "openai";
  const modelHint = String(state.llmModelId || "gpt-4o-mini").trim() || "gpt-4o-mini";
  const rawRef = String(state.llmModelRef || "").trim();
  if (!rawRef) return { provider: providerHint, modelId: modelHint };

  const slash = rawRef.indexOf("/");
  if (slash > 0) {
    const provider = rawRef.slice(0, slash).trim();
    const modelId = rawRef.slice(slash + 1).trim();
    if (provider && modelId) return { provider, modelId };
  }
  return { provider: providerHint, modelId: rawRef };
}

function resolveLlmBaseUrl({ provider, templateBaseUrl }) {
  const explicitBase = String(state.llmBaseUrl || "").trim();
  const useProxy = state.llmUseProxy !== false;
  const baseRaw = explicitBase || String(templateBaseUrl || "").trim() || defaultLlmBaseUrl();

  const origin = safeOrigin();
  const resolved = new URL(baseRaw, origin || "http://localhost");
  if (useProxy) {
    const isOpenAiDefaultPath = provider === "openai" && !explicitBase;
    if (isOpenAiDefaultPath) {
      return defaultLlmBaseUrl();
    }
    if (origin && resolved.origin === origin) return resolved.toString();
    return llmProxyBaseUrl(resolved.toString());
  }

  const access = evaluateOriginAccess({
    url: resolved.toString(),
    capability: "llm",
    method: "POST",
    consume: false,
  });
  if (!access.allowed) {
    log(`llm base blocked by allowlist (fallback to same-origin): ${resolved.toString()}`);
    return defaultLlmBaseUrl();
  }
  return resolved.toString();
}

function getConfiguredModel() {
  const parsed = parseConfiguredModelRef();
  const provider = String(parsed.provider || "openai").trim() || "openai";
  const modelId = String(parsed.modelId || "gpt-4o-mini").trim() || "gpt-4o-mini";

  let template = null;
  try {
    template = getPiModel(provider, modelId) || null;
  } catch {
    template = null;
  }

  const api = String(state.llmApi || template?.api || "openai-completions").trim() || "openai-completions";
  const baseUrl = resolveLlmBaseUrl({ provider, templateBaseUrl: template?.baseUrl || "" });

  if (template) {
    return {
      ...template,
      id: modelId,
      name: template.name || modelId,
      api,
      provider,
      baseUrl,
      headers: { ...(template.headers || {}) },
    };
  }

  /** @type {import("@mariozechner/pi-ai").Model<any>} */
  return {
    id: modelId,
    name: modelId,
    api,
    provider,
    baseUrl,
    headers: {},
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128_000,
    maxTokens: 4096,
  };
}

function normalizeReasoningLevel(value) {
  const v = String(value || "")
    .trim()
    .toLowerCase();
  if (!v || v === "off" || v === "default") return null;
  if (v === "minimal" || v === "low" || v === "medium" || v === "high" || v === "xhigh") return v;
  return null;
}

function isCodexCliSentinelEligible(model) {
  if (!state.codexCliEnabled) return false;
  if (!model || model.provider !== "openai" || model.api !== "openai-completions") return false;
  try {
    const origin = safeOrigin();
    const u = new URL(String(model.baseUrl || ""), origin || "http://localhost");
    return !!origin && u.origin === origin && u.pathname.startsWith("/api/llm/openai/v1");
  } catch {
    return false;
  }
}

function makeAssistant(text, { stopReason = "stop", errorMessage = null } = {}) {
  const model = getConfiguredModel();
  const msg = {
    role: "assistant",
    content: [{ type: "text", text: String(text || "") }],
    api: model.api,
    provider: model.provider,
    model: model.id,
    usage: {
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
      totalTokens: 0,
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
    },
    stopReason,
    timestamp: nowMs(),
  };
  if (errorMessage) msg.errorMessage = String(errorMessage || "");
  return msg;
}

const LITE_TOOL_SPECS = [
  {
    name: "lite_echo",
    label: "Lite Echo",
    description: "Echoes back input text.",
    sampleArgs: { text: "hello" },
  },
  {
    name: "lite_uppercase",
    label: "Lite Uppercase",
    description: "Converts input text to uppercase.",
    sampleArgs: { text: "openclaw" },
  },
  {
    name: "lite_add",
    label: "Lite Add",
    description: "Adds two numbers.",
    sampleArgs: { a: 2, b: 3 },
  },
  {
    name: "lite_now",
    label: "Lite Now",
    description: "Returns current timestamp.",
    sampleArgs: {},
  },
  {
    name: "lite_sha256",
    label: "Lite SHA256",
    description: "Returns SHA-256 digest of input text (base64).",
    sampleArgs: { text: "tool smoke" },
  },
  {
    name: "web_fetch",
    label: "Web Fetch",
    description: "Fetches a page/document and returns text + metadata.",
    sampleArgs: { url: "https://example.com/skill.md", maxBytes: 2048 },
  },
  {
    name: "skill_fetch",
    label: "Skill Fetch",
    description: "Alias for web_fetch (skill-centric naming).",
    sampleArgs: { url: "https://example.com/skill.md", maxBytes: 2048 },
  },
  {
    name: "http_request",
    label: "HTTP Request",
    description: "Browser-native curl pendant for API workflows.",
    sampleArgs: { method: "GET", url: "https://example.com/api" },
  },
  {
    name: "secret_set",
    label: "Secret Set",
    description: "Store/update a secret value by reference name.",
    sampleArgs: { name: "moltbook.api_key", value: "redacted" },
  },
  {
    name: "secret_list",
    label: "Secret List",
    description: "List secret reference names (without raw values).",
    sampleArgs: {},
  },
  {
    name: "secret_delete",
    label: "Secret Delete",
    description: "Delete a secret by reference name.",
    sampleArgs: { name: "moltbook.api_key" },
  },
  {
    name: "ws_open",
    label: "WS Open",
    description: "Open a websocket session and return a session id.",
    sampleArgs: { url: "wss://example.com/socket" },
  },
  {
    name: "ws_send",
    label: "WS Send",
    description: "Send text/json payload over websocket session.",
    sampleArgs: { sessionId: "ws_...", text: "hello" },
  },
  {
    name: "ws_recv",
    label: "WS Recv",
    description: "Receive queued websocket messages with timeout.",
    sampleArgs: { sessionId: "ws_...", maxMessages: 1, waitMs: 1000 },
  },
  {
    name: "ws_close",
    label: "WS Close",
    description: "Close websocket session and release resources.",
    sampleArgs: { sessionId: "ws_..." },
  },
  {
    name: "ws_status",
    label: "WS Status",
    description: "Inspect websocket session state.",
    sampleArgs: { sessionId: "ws_..." },
  },
  {
    name: "workspace_mkdir",
    label: "Workspace Mkdir",
    description: "Create a directory inside workspace root.",
    sampleArgs: { path: "workspace/notes" },
  },
  {
    name: "workspace_list",
    label: "Workspace List",
    description: "List files/directories under workspace prefix.",
    sampleArgs: { path: "workspace/" },
  },
  {
    name: "workspace_read_file",
    label: "Workspace Read",
    description: "Read file content from workspace.",
    sampleArgs: { path: "workspace/skill.md" },
  },
  {
    name: "workspace_write_file",
    label: "Workspace Write",
    description: "Write file content into workspace.",
    sampleArgs: { path: "workspace/skill.md", content: "# Skill" },
  },
  {
    name: "workspace_edit_file",
    label: "Workspace Edit",
    description: "Find/replace text in a workspace file.",
    sampleArgs: { path: "workspace/skill.md", find: "a", replace: "b" },
  },
  {
    name: "workspace_delete",
    label: "Workspace Delete",
    description: "Delete workspace file or directory path.",
    sampleArgs: { path: "workspace/skill.md" },
  },
  {
    name: "wallet_connect",
    label: "Wallet Connect",
    description: "Connect to browser wallet and return active account.",
    sampleArgs: { chain: "solana" },
  },
  {
    name: "wallet_get_accounts",
    label: "Wallet Accounts",
    description: "List connected wallet accounts.",
    sampleArgs: { chain: "solana" },
  },
  {
    name: "wallet_sign_message",
    label: "Wallet Sign",
    description: "Sign message with connected wallet (approval-gated).",
    sampleArgs: { chain: "solana", message: "hello" },
  },
];

function makeLiteToolSchema() {
  return {
    type: "object",
    properties: {},
    additionalProperties: true,
  };
}

function liteToolResult(text, details = {}) {
  return {
    content: [{ type: "text", text: String(text || "") }],
    details,
  };
}

async function dispatchLiteTool(name, params, _signal, _onUpdate) {
  switch (String(name || "")) {
    case "lite_echo": {
      const text = typeof params?.text === "string" ? params.text : "";
      return liteToolResult(text, { dispatchPath: LITE_TOOL_DISPATCH_PATH });
    }
    case "lite_uppercase": {
      const text = typeof params?.text === "string" ? params.text : "";
      return liteToolResult(text.toUpperCase(), { dispatchPath: LITE_TOOL_DISPATCH_PATH });
    }
    case "lite_add": {
      const a = Number(params?.a || 0);
      const b = Number(params?.b || 0);
      const sum = (Number.isFinite(a) ? a : 0) + (Number.isFinite(b) ? b : 0);
      return liteToolResult(String(sum), { dispatchPath: LITE_TOOL_DISPATCH_PATH, sum });
    }
    case "lite_now": {
      const ts = nowMs();
      return liteToolResult(String(ts), { dispatchPath: LITE_TOOL_DISPATCH_PATH, ts });
    }
    case "lite_sha256": {
      const text = typeof params?.text === "string" ? params.text : "";
      const digest = bytesToB64(await sha256(utf8ToBytes(text)));
      return liteToolResult(digest, { dispatchPath: LITE_TOOL_DISPATCH_PATH });
    }
    case "web_fetch": {
      const envelope = await runWebFetch(params || {}, "web_fetch");
      return envelopeToToolResult(envelope, "web_fetch");
    }
    case "skill_fetch": {
      const envelope = await runWebFetch(params || {}, "skill_fetch");
      return envelopeToToolResult(envelope, "skill_fetch");
    }
    case "http_request": {
      const envelope = await runHttpRequest(params || {}, "http_request");
      return envelopeToToolResult(envelope, "http_request");
    }
    case "secret_set": {
      const envelope = await runSecretSet(params || {}, "secret_set");
      return envelopeToToolResult(envelope, "secret_set");
    }
    case "secret_list": {
      const envelope = runSecretList(params || {}, "secret_list");
      return envelopeToToolResult(envelope, "secret_list");
    }
    case "secret_delete": {
      const envelope = await runSecretDelete(params || {}, "secret_delete");
      return envelopeToToolResult(envelope, "secret_delete");
    }
    case "ws_open": {
      const envelope = await runWsOpen(params || {}, "ws_open");
      return envelopeToToolResult(envelope, "ws_open");
    }
    case "ws_send": {
      const envelope = runWsSend(params || {}, "ws_send");
      return envelopeToToolResult(envelope, "ws_send");
    }
    case "ws_recv":
    case "ws_receive": {
      const envelope = await runWsRecv(params || {}, "ws_recv");
      return envelopeToToolResult(envelope, "ws_recv");
    }
    case "ws_close": {
      const envelope = runWsClose(params || {}, "ws_close");
      return envelopeToToolResult(envelope, "ws_close");
    }
    case "ws_status": {
      const envelope = runWsStatus(params || {}, "ws_status");
      return envelopeToToolResult(envelope, "ws_status");
    }
    case "workspace_mkdir": {
      const envelope = await runWorkspaceMkdir(params || {}, "workspace_mkdir");
      return envelopeToToolResult(envelope, "workspace_mkdir");
    }
    case "workspace_list": {
      const envelope = await runWorkspaceList(params || {}, "workspace_list");
      return envelopeToToolResult(envelope, "workspace_list");
    }
    case "workspace_read_file": {
      const envelope = await runWorkspaceReadFile(params || {}, "workspace_read_file");
      return envelopeToToolResult(envelope, "workspace_read_file");
    }
    case "workspace_write_file": {
      const envelope = await runWorkspaceWriteFile(params || {}, "workspace_write_file");
      return envelopeToToolResult(envelope, "workspace_write_file");
    }
    case "workspace_edit_file": {
      const envelope = await runWorkspaceEditFile(params || {}, "workspace_edit_file");
      return envelopeToToolResult(envelope, "workspace_edit_file");
    }
    case "workspace_delete": {
      const envelope = await runWorkspaceDelete(params || {}, "workspace_delete");
      return envelopeToToolResult(envelope, "workspace_delete");
    }
    case "wallet_connect": {
      const envelope = await runWalletConnectTool(params || {}, "wallet_connect");
      return envelopeToToolResult(envelope, "wallet_connect");
    }
    case "wallet_get_accounts": {
      const envelope = await runWalletGetAccountsTool(params || {}, "wallet_get_accounts");
      return envelopeToToolResult(envelope, "wallet_get_accounts");
    }
    case "wallet_sign_message": {
      const envelope = await runWalletSignMessageTool(params || {}, "wallet_sign_message");
      return envelopeToToolResult(envelope, "wallet_sign_message");
    }
    default:
      throw new Error(`TOOL_NOT_FOUND:${name}`);
  }
}

function getLiteTools() {
  return LITE_TOOL_SPECS.map((spec) => ({
    name: spec.name,
    label: spec.label,
    description: spec.description,
    parameters: makeLiteToolSchema(),
    execute: async (_toolCallId, params, signal, onUpdate) => dispatchLiteTool(spec.name, params, signal, onUpdate),
  }));
}

function getToolRegistryInfo() {
  const tools = getLiteTools();
  return {
    count: tools.length,
    names: tools.map((t) => t.name),
    dispatchPath: LITE_TOOL_DISPATCH_PATH,
  };
}

function buildSyntheticToolCalls(count) {
  const target = Math.max(0, Math.floor(Number(count) || 0));
  const calls = [];
  for (let i = 0; i < target; i += 1) {
    const spec = LITE_TOOL_SPECS[i % LITE_TOOL_SPECS.length];
    calls.push({
      type: "toolCall",
      id: randomId("tc"),
      name: spec.name,
      arguments: spec.sampleArgs || {},
    });
  }
  return calls;
}

function computeTranscriptToolStats(messages) {
  const expectedIndexByToolCallId = new Map();
  const seenToolResultIds = new Set();
  let toolResultCount = 0;
  let orphanToolResults = 0;
  let duplicateToolResults = 0;
  let displacedToolResults = 0;

  for (let i = 0; i < messages.length; i += 1) {
    const msg = messages[i];
    if (!msg || typeof msg !== "object") continue;
    if (msg.role !== "assistant" || !Array.isArray(msg.content)) continue;
    const calls = msg.content.filter((c) => c && c.type === "toolCall" && typeof c.id === "string" && c.id);
    for (let j = 0; j < calls.length; j += 1) {
      expectedIndexByToolCallId.set(calls[j].id, i + 1 + j);
    }
  }

  for (let i = 0; i < messages.length; i += 1) {
    const msg = messages[i];
    if (!msg || typeof msg !== "object" || msg.role !== "toolResult") continue;
    toolResultCount += 1;
    const id =
      (typeof msg.toolCallId === "string" && msg.toolCallId) ||
      (typeof msg.toolUseId === "string" && msg.toolUseId) ||
      "";
    if (!id || !expectedIndexByToolCallId.has(id)) {
      orphanToolResults += 1;
      continue;
    }
    if (seenToolResultIds.has(id)) {
      duplicateToolResults += 1;
      continue;
    }
    seenToolResultIds.add(id);
    if (expectedIndexByToolCallId.get(id) !== i) {
      displacedToolResults += 1;
    }
  }

  return {
    toolResultCount,
    orphanToolResults,
    duplicateToolResults,
    displacedToolResults,
  };
}

async function runSyntheticToolSmoke(count = 5) {
  const calls = buildSyntheticToolCalls(count);
  const assistant = {
    role: "assistant",
    content: calls,
    api: "openclaw-lite",
    provider: "openclaw-lite",
    model: "tool-smoke",
    stopReason: "tool_calls",
    timestamp: nowMs(),
  };
  state.transcript.push(assistant);

  let completed = 0;
  let failed = 0;
  for (const call of calls) {
    let result;
    let isError = false;
    try {
      result = await dispatchLiteTool(call.name, call.arguments, undefined, undefined);
      completed += 1;
    } catch (e) {
      isError = true;
      failed += 1;
      result = liteToolResult(e?.message || String(e || "UNKNOWN_ERROR"), {
        dispatchPath: LITE_TOOL_DISPATCH_PATH,
      });
    }
    state.transcript.push({
      role: "toolResult",
      toolCallId: call.id,
      toolName: call.name,
      content: result.content,
      details: result.details,
      isError,
      timestamp: nowMs(),
    });
  }

  await persistTranscript();
  return {
    requested: calls.length,
    completed,
    failed,
    dispatchPath: LITE_TOOL_DISPATCH_PATH,
  };
}

async function runAgentTurn(userText) {
  const prompt = {
    role: "user",
    content: String(userText || ""),
    timestamp: nowMs(),
  };

  const model = getConfiguredModel();
  // PI-AI expects a non-empty `apiKey` string for provider calls.
  // In Codex-CLI bridge mode, the server ignores Authorization for chat.completions on
  // /api/llm/openai/v1, so we can use a sentinel in that specific configuration.
  const apiKey = state.llmApiKey || (isCodexCliSentinelEligible(model) ? "codex-cli" : "");
  if (!apiKey) {
    const m = makeAssistant("LLM not configured. Set your API key in the Gateway panel.", { stopReason: "error" });
    state.transcript.push(prompt);
    state.transcript.push(m);
    post({ type: "worker.chat.append", role: "user", text: String(userText || "") });
    post({ type: "worker.chat.append", role: "assistant", text: "LLM not configured. Set your API key in the Gateway panel." });
    await persistTranscript();
    return;
  }

  const context = {
    systemPrompt: "",
    messages: state.transcript.slice(),
    tools: getLiteTools(),
  };

  const config = {
    model,
    apiKey,
    reasoning: state.llmReasoning || undefined,
    convertToLlm: (messages) => messages.filter((m) => m && (m.role === "user" || m.role === "assistant" || m.role === "toolResult")),
  };

  const abortController = new AbortController();
  const stream = agentLoop([prompt], context, config, abortController.signal);

  for await (const event of stream) {
    if (event.type === "message_end") {
      const m = event.message;
      if (!m || typeof m !== "object" || typeof m.role !== "string") continue;
      state.transcript.push(m);
      if (m.role === "user") post({ type: "worker.chat.append", role: "user", text: userText });
      if (m.role === "assistant") {
        let t = "";
        if (typeof m.content === "string") {
          t = m.content;
        } else if (Array.isArray(m.content)) {
          t = m.content.map((c) => (c && c.type === "text" ? c.text : "")).join("");
        }
        post({ type: "worker.chat.append", role: "assistant", text: t });
      }
      await persistTranscript();
    }
  }
}

// --- Approvals ---
const approvals = new Map();

function requestApproval({ title, body }) {
  const id = randomId("ap");
  post({ type: "worker.approval.request", approval: { id, title, body } });
  return new Promise((resolve) => {
    approvals.set(id, resolve);
  });
}

function resolveApproval(id, decision) {
  const fn = approvals.get(id);
  if (!fn) return;
  approvals.delete(id);
  post({ type: "worker.approval.clear", id });
  fn(decision === "approve" ? "approve" : "reject");
}

// --- Wallet bridge ---
const walletRequests = new Map();

function walletRequest(method, payload) {
  const id = randomId("w");
  post({ type: "worker.wallet.request", id, method, ...(payload || {}) });
  return new Promise((resolve, reject) => {
    walletRequests.set(id, { resolve, reject });
  });
}

function resolveWalletResponse(msg) {
  const id = String(msg.id || "");
  const rec = walletRequests.get(id);
  if (!rec) return;
  walletRequests.delete(id);
  if (msg.ok) rec.resolve(msg);
  else rec.reject(new Error(msg.error || "WALLET_ERROR"));
}

async function walletConnect() {
  const res = await walletRequest("connect", { chain: "solana" });
  const addr = typeof res.address === "string" ? res.address.trim() : "";
  if (!addr) throw new Error("WALLET_NOT_CONNECTED");
  return addr;
}

async function walletConnectEvm() {
  const res = await walletRequest("connect", { chain: "evm" });
  const addr = typeof res.address === "string" ? res.address.trim() : "";
  if (!addr) throw new Error("WALLET_NOT_CONNECTED");
  return addr;
}

async function walletSignMessage(message) {
  const res = await walletRequest("signMessage", { message, chain: "solana" });
  const sig = typeof res.signatureB64 === "string" ? res.signatureB64.trim() : "";
  if (!sig) throw new Error("MISSING_SIGNATURE");
  return { address: typeof res.address === "string" ? res.address.trim() : "", signatureBytes: b64ToBytes(sig) };
}

async function walletSignMessageEvm(message) {
  const res = await walletRequest("signMessage", { message, chain: "evm" });
  const sig = typeof res.signatureHex === "string" ? res.signatureHex.trim() : "";
  if (!sig) throw new Error("MISSING_SIGNATURE");
  return { address: typeof res.address === "string" ? res.address.trim() : "", signatureHex: sig };
}

function normalizeWalletChain(chain) {
  const c = String(chain || "solana").trim().toLowerCase();
  return c || "solana";
}

async function runWalletConnectTool(params, toolName = "wallet_connect") {
  const startedAtMs = nowMs();
  const chain = normalizeWalletChain(params?.chain);
  try {
    const address = chain === "evm" ? await walletConnectEvm() : await walletConnect();
    return withToolMeta(toolName, startedAtMs, makeToolSuccess({ chain, address }));
  } catch (e) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("UNSUPPORTED", e?.message || "WALLET_CONNECT_FAILED"));
  }
}

async function runWalletGetAccountsTool(params, toolName = "wallet_get_accounts") {
  const startedAtMs = nowMs();
  const chain = normalizeWalletChain(params?.chain);
  try {
    const address = chain === "evm" ? await walletConnectEvm() : await walletConnect();
    return withToolMeta(toolName, startedAtMs, makeToolSuccess({ chain, accounts: [address] }));
  } catch (e) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("UNSUPPORTED", e?.message || "WALLET_CONNECT_FAILED"));
  }
}

async function runWalletSignMessageTool(params, toolName = "wallet_sign_message") {
  const startedAtMs = nowMs();
  const chain = normalizeWalletChain(params?.chain);
  const message = typeof params?.message === "string" ? params.message : "";
  if (!message) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Missing wallet sign message"));
  }

  const preview = message.length > 160 ? `${message.slice(0, 160)}...` : message;
  const decision = await requestApproval({
    title: "Approval",
    body: `Wallet sign message (solana): ${preview}`,
  });
  if (decision !== "approve") {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("APPROVAL_REJECTED", "Wallet signing rejected"));
  }

  try {
    if (chain === "evm") {
      const signed = await walletSignMessageEvm(message);
      return withToolMeta(
        toolName,
        startedAtMs,
        makeToolSuccess({
          chain,
          address: signed.address,
          signatureHex: signed.signatureHex,
        }),
      );
    }
    const signed = await walletSignMessage(message);
    return withToolMeta(
      toolName,
      startedAtMs,
      makeToolSuccess({
        chain,
        address: signed.address,
        signatureB64: bytesToB64(signed.signatureBytes),
        signatureByteLength: signed.signatureBytes.length,
      }),
    );
  } catch (e) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("UNSUPPORTED", e?.message || "WALLET_SIGN_FAILED"));
  }
}

// --- Checkpoints ---
async function writeCheckpoint(reason) {
  const houseId = state.houseId || null;
  const checkpoint = {
    v: 1,
    checkpointId: randomId("cp"),
    createdAtMs: nowMs(),
    houseId,
    reason,
    state: {
      runtime: { houseId: state.houseId || null, sessionId: state.sessionId || null },
      vaultPointer: { latestBackupId: state.vaultLatestBackupId || null },
    },
  };

  await putRecord("checkpoints", checkpoint);

  if (!houseId) return;
  const all = await getAllFromIndex(
    "checkpoints",
    "by_house_createdAtMs",
    IDBKeyRange.bound([houseId, 0], [houseId, 9e15]),
    "asc",
  );
  if (all.length <= MAX_CHECKPOINTS_PER_HOUSE) return;
  const toDelete = all
    .slice(0, all.length - MAX_CHECKPOINTS_PER_HOUSE)
    .map((x) => x.checkpointId)
    .filter(Boolean);
  await deleteByKeys("checkpoints", toDelete);
}

// --- OpenClaw VFS persistence ---
function workspaceCoreFiles() {
  return [
    ["workspace/AGENTS.md", "# Agents\n\nOpenClaw Lite exports OpenClaw-compatible artifacts.\n"],
    ["workspace/SOUL.md", "# Soul\n\nThis is a minimal OpenClaw Lite soul.\n"],
    ["workspace/USER.md", "# User\n\nUser profile is stored locally.\n"],
    ["workspace/IDENTITY.md", `# Identity\n\nhouseId: ${state.houseId || "unknown"}\n`],
    ["workspace/TOOLS.md", "# Tools\n\nBrowser runtime. Networking is allowlisted.\n"],
  ];
}

function normalizeWorkspacePath(rawPath, { allowDirectory = false } = {}) {
  const raw = String(rawPath || "").trim().replace(/\\/g, "/");
  if (!raw) throw new Error("INVALID_ARGUMENTS");
  if (raw.includes("\u0000")) throw new Error("INVALID_ARGUMENTS");
  const isDirInput = raw.endsWith("/");
  if (raw.startsWith("/")) throw new Error("INVALID_ARGUMENTS");

  const parts = raw.split("/").filter((p) => p.length > 0);
  if (parts.length === 0) throw new Error("INVALID_ARGUMENTS");
  if (parts.some((p) => p === "." || p === "..")) throw new Error("INVALID_ARGUMENTS");

  const canonical = parts.join("/");
  if (!(canonical === "workspace" || canonical.startsWith("workspace/"))) {
    throw new Error("INVALID_ARGUMENTS");
  }

  if (allowDirectory || isDirInput || canonical === "workspace") {
    return canonical === "workspace" ? "workspace/" : `${canonical}/`;
  }
  return canonical;
}

function workspaceParentDir(filePath) {
  const parts = String(filePath || "").split("/");
  if (parts.length <= 1) return null;
  parts.pop();
  if (!parts.length) return null;
  return `${parts.join("/")}/`;
}

async function persistWorkspaceDirs() {
  await metaSet("workspaceDirsV1", Array.from(state.workspaceDirs || []).sort());
}

function ensureWorkspaceDirAncestors(pathLike) {
  const normalized = String(pathLike || "");
  if (!normalized.startsWith("workspace/")) return;
  const parts = normalized.endsWith("/") ? normalized.slice(0, -1).split("/") : normalized.split("/");
  let acc = "";
  for (let i = 0; i < parts.length - 1; i += 1) {
    acc = acc ? `${acc}/${parts[i]}` : parts[i];
    state.workspaceDirs.add(`${acc}/`);
  }
}

function pushWorkspaceEvent({ actor, action, path }) {
  const event = {
    id: randomId("we"),
    actor: String(actor || "system"),
    action: String(action || "update"),
    path: String(path || ""),
    timestamp: new Date().toISOString(),
    timestampMs: nowMs(),
  };
  state.workspaceEvents.unshift(event);
  if (state.workspaceEvents.length > 500) {
    state.workspaceEvents.length = 500;
  }
  post({ type: "worker.workspace.events", events: state.workspaceEvents.slice(0, 100) });
}

async function ensureWorkspaceFiles({ recordEvents = true } = {}) {
  const createdPaths = [];
  for (const [p, content] of workspaceCoreFiles()) {
    const existing = await vfsGetUtf8(p);
    if (existing !== null) continue;
    await vfsPutUtf8(p, content);
    ensureWorkspaceDirAncestors(p);
    createdPaths.push(p);
    if (recordEvents) {
      pushWorkspaceEvent({ actor: "system", action: "bootstrap", path: p });
    }
  }
  if (!state.workspaceDirs.has("workspace/")) state.workspaceDirs.add("workspace/");
  await persistWorkspaceDirs();
  return createdPaths;
}

async function ensureSessionFiles() {
  if (!state.sessionId) {
    state.sessionId = randomId("sess");
    await metaSet("sessionId", state.sessionId);
  }
  const sessionsPath = `.openclaw/agents/${MAIN_AGENT_ID}/sessions/sessions.json`;
  const existing = await vfsGetUtf8(sessionsPath);
  let store = {};
  if (existing) {
    try {
      store = JSON.parse(existing);
    } catch {
      store = {};
    }
  }
  store[MAIN_SESSION_KEY] = { sessionId: state.sessionId, updatedAt: nowMs() };
  await vfsPutUtf8(sessionsPath, JSON.stringify(store, null, 2));

  const transcriptPath = `.openclaw/agents/${MAIN_AGENT_ID}/sessions/${state.sessionId}.jsonl`;
  const tExisting = await vfsGetUtf8(transcriptPath);
  if (tExisting === null) {
    await vfsPutUtf8(transcriptPath, "");
  }
}

async function persistTranscript() {
  await ensureSessionFiles();
  const sessionsPath = `.openclaw/agents/${MAIN_AGENT_ID}/sessions/sessions.json`;
  const transcriptPath = `.openclaw/agents/${MAIN_AGENT_ID}/sessions/${state.sessionId}.jsonl`;

  // Repair using OpenClaw source of truth before writing.
  const repairedInputs = repairToolCallInputs(state.transcript);
  const repairedTools = repairToolUseResultPairing(repairedInputs.messages);
  const repaired = repairedTools.messages;
  state.transcript = repaired;

  const jsonl = repaired.map((m) => JSON.stringify(m)).join("\n") + "\n";
  await vfsPutUtf8(transcriptPath, jsonl);

  let store = {};
  try {
    store = JSON.parse((await vfsGetUtf8(sessionsPath)) || "{}");
  } catch {
    store = {};
  }
  store[MAIN_SESSION_KEY] = { sessionId: state.sessionId, updatedAt: nowMs() };
  await vfsPutUtf8(sessionsPath, JSON.stringify(store, null, 2));
}

async function runWorkspaceMkdir(params, toolName = "workspace_mkdir") {
  const startedAtMs = nowMs();
  let path;
  try {
    path = normalizeWorkspacePath(params?.path, { allowDirectory: true });
  } catch {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Invalid workspace directory path"));
  }
  const existed = state.workspaceDirs.has(path);
  ensureWorkspaceDirAncestors(path);
  state.workspaceDirs.add(path);
  await persistWorkspaceDirs();
  if (!existed) {
    pushWorkspaceEvent({ actor: "agent", action: "mkdir", path });
  }
  return withToolMeta(toolName, startedAtMs, makeToolSuccess({ path, created: !existed }));
}

async function runWorkspaceList(params, toolName = "workspace_list") {
  const startedAtMs = nowMs();
  let prefix;
  try {
    prefix = normalizeWorkspacePath(params?.path || "workspace/", { allowDirectory: true });
  } catch {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Invalid workspace list path"));
  }

  const files = await vfsListPaths(prefix);
  const dirs = Array.from(state.workspaceDirs || []).filter((d) => d.startsWith(prefix) && d !== prefix);
  const paths = Array.from(new Set([...files, ...dirs])).sort();
  return withToolMeta(toolName, startedAtMs, makeToolSuccess({ path: prefix, paths }));
}

async function runWorkspaceReadFile(params, toolName = "workspace_read_file") {
  const startedAtMs = nowMs();
  let path;
  try {
    path = normalizeWorkspacePath(params?.path, { allowDirectory: false });
  } catch {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Invalid workspace file path"));
  }
  const content = await vfsGetUtf8(path);
  if (content === null) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("NOT_FOUND", "Workspace file not found", { path }));
  }
  return withToolMeta(toolName, startedAtMs, makeToolSuccess({ path, content }));
}

async function runWorkspaceWriteFile(params, toolName = "workspace_write_file") {
  const startedAtMs = nowMs();
  let path;
  try {
    path = normalizeWorkspacePath(params?.path, { allowDirectory: false });
  } catch {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Invalid workspace file path"));
  }
  const content = typeof params?.content === "string" ? params.content : String(params?.content ?? "");
  const existing = await vfsGetUtf8(path);
  await vfsPutUtf8(path, content);
  ensureWorkspaceDirAncestors(path);
  const parent = workspaceParentDir(path);
  if (parent) state.workspaceDirs.add(parent);
  await persistWorkspaceDirs();
  pushWorkspaceEvent({ actor: "agent", action: existing === null ? "create" : "update", path });
  return withToolMeta(
    toolName,
    startedAtMs,
    makeToolSuccess({
      path,
      bytes: utf8ToBytes(content).length,
      updated: existing !== null,
    }),
  );
}

async function runWorkspaceEditFile(params, toolName = "workspace_edit_file") {
  const startedAtMs = nowMs();
  let path;
  try {
    path = normalizeWorkspacePath(params?.path, { allowDirectory: false });
  } catch {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Invalid workspace file path"));
  }
  const find = typeof params?.find === "string" ? params.find : "";
  const replace = typeof params?.replace === "string" ? params.replace : String(params?.replace ?? "");
  const all = params?.all !== false;
  if (!find) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Missing edit find string"));
  }
  const existing = await vfsGetUtf8(path);
  if (existing === null) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("NOT_FOUND", "Workspace file not found", { path }));
  }

  let replacements = 0;
  let next = existing;
  if (all) {
    const split = existing.split(find);
    replacements = Math.max(0, split.length - 1);
    if (replacements > 0) next = split.join(replace);
  } else {
    const idx = existing.indexOf(find);
    if (idx >= 0) {
      replacements = 1;
      next = `${existing.slice(0, idx)}${replace}${existing.slice(idx + find.length)}`;
    }
  }

  if (replacements > 0) {
    await vfsPutUtf8(path, next);
    pushWorkspaceEvent({ actor: "agent", action: "update", path });
  }
  return withToolMeta(toolName, startedAtMs, makeToolSuccess({ path, replacements }));
}

async function runWorkspaceDelete(params, toolName = "workspace_delete") {
  const startedAtMs = nowMs();
  const raw = typeof params?.path === "string" ? params.path.trim() : "";
  if (!raw) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Missing workspace delete path"));
  }

  let dirPath = null;
  let filePath = null;
  try {
    dirPath = normalizeWorkspacePath(raw, { allowDirectory: true });
  } catch {
    dirPath = null;
  }
  try {
    filePath = normalizeWorkspacePath(raw, { allowDirectory: false });
  } catch {
    filePath = null;
  }

  const preferDirectory =
    raw.endsWith("/") ||
    (dirPath && state.workspaceDirs.has(dirPath) && (!filePath || `${filePath}/` === dirPath));

  if (preferDirectory && dirPath) {
    if (dirPath === "workspace/") {
      return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Cannot delete workspace root"));
    }
    const files = await vfsListPaths(dirPath);
    if (files.length > 0) {
      await deleteByKeys("vfs", files);
    }
    const removedDirs = [];
    for (const d of Array.from(state.workspaceDirs || [])) {
      if (d === dirPath || d.startsWith(dirPath)) {
        removedDirs.push(d);
        state.workspaceDirs.delete(d);
      }
    }
    if (!files.length && !removedDirs.length) {
      return withToolMeta(toolName, startedAtMs, makeToolFailure("NOT_FOUND", "Workspace path not found", { path: dirPath }));
    }
    await persistWorkspaceDirs();
    pushWorkspaceEvent({ actor: "agent", action: "delete", path: dirPath });
    return withToolMeta(
      toolName,
      startedAtMs,
      makeToolSuccess({ path: dirPath, deletedFiles: files.length, deletedDirs: removedDirs.length }),
    );
  }

  if (!filePath) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Invalid workspace delete path"));
  }

  const existing = await vfsGetUtf8(filePath);
  if (existing === null) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("NOT_FOUND", "Workspace file not found", { path: filePath }));
  }
  await deleteByKeys("vfs", [filePath]);
  pushWorkspaceEvent({ actor: "agent", action: "delete", path: filePath });
  return withToolMeta(toolName, startedAtMs, makeToolSuccess({ path: filePath, deleted: true }));
}

async function runWorkspaceBootstrap(toolName = "workspace_bootstrap") {
  const startedAtMs = nowMs();
  const createdPaths = await ensureWorkspaceFiles({ recordEvents: true });
  return withToolMeta(toolName, startedAtMs, makeToolSuccess({ createdPaths }));
}

function runWorkspaceEvents(toolName = "workspace_events") {
  const startedAtMs = nowMs();
  return withToolMeta(toolName, startedAtMs, makeToolSuccess({ events: state.workspaceEvents.slice(0, 100) }));
}

async function runWebMcpDiscover(params, toolName = "webmcp_discover") {
  const startedAtMs = nowMs();
  const endpointRaw = typeof params?.endpoint === "string" ? params.endpoint.trim() : "/__test__/webmcp/discover";
  let endpoint;
  try {
    endpoint = new URL(endpointRaw, safeOrigin() || "http://localhost").toString();
    assertAllowlistedUrl(endpoint);
  } catch {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Invalid WebMCP discover endpoint"));
  }

  try {
    const res = await fetch(endpoint, { method: "GET", credentials: "include" });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.ok !== true) {
      return withToolMeta(toolName, startedAtMs, makeToolFailure("UNSUPPORTED", String(data?.error || "WEBMCP_DISCOVER_FAILED")));
    }
    const tools = Array.isArray(data.tools) ? data.tools : [];
    return withToolMeta(toolName, startedAtMs, makeToolSuccess({ tools }));
  } catch (e) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("UNSUPPORTED", e?.message || "WEBMCP_DISCOVER_FAILED"));
  }
}

async function runWebMcpCall(params, toolName = "webmcp_call") {
  const startedAtMs = nowMs();
  const tool = typeof params?.tool === "string" ? params.tool.trim() : "";
  const args = params?.args && typeof params.args === "object" && !Array.isArray(params.args) ? params.args : {};
  if (!tool) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Missing WebMCP tool name"));
  }

  const endpointRaw = typeof params?.endpoint === "string" ? params.endpoint.trim() : "/__test__/webmcp/call";
  let endpoint;
  try {
    endpoint = new URL(endpointRaw, safeOrigin() || "http://localhost").toString();
    assertAllowlistedUrl(endpoint);
  } catch {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Invalid WebMCP call endpoint"));
  }

  let envelope;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tool, args }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.ok !== true) {
      envelope = makeToolFailure("UNSUPPORTED", String(data?.error || "WEBMCP_CALL_FAILED"), { tool });
    } else {
      envelope = makeToolSuccess({ tool, result: data.result ?? null });
    }
  } catch (e) {
    envelope = makeToolFailure("UNSUPPORTED", e?.message || "WEBMCP_CALL_FAILED", { tool });
  }

  const callId = randomId("mcp");
  state.transcript.push({
    role: "assistant",
    content: [{ type: "toolCall", id: callId, name: `webmcp:${tool}`, arguments: args }],
    api: "webmcp",
    provider: "webmcp",
    model: "webmcp-adapter",
    stopReason: "tool_calls",
    timestamp: nowMs(),
  });
  state.transcript.push({
    role: "toolResult",
    toolCallId: callId,
    toolName: `webmcp:${tool}`,
    content: [{ type: "text", text: JSON.stringify(envelope) }],
    isError: envelope.ok !== true,
    timestamp: nowMs(),
  });
  await persistTranscript();

  return withToolMeta(toolName, startedAtMs, envelope);
}

async function runExperienceEngineBaseline(params, toolName = "experience_engine_run") {
  const startedAtMs = nowMs();
  const fileMap = {
    skill: "workspace/skill.md",
    heartbeat: "workspace/heartbeat.md",
    goals: "workspace/goals.md",
    tools: "workspace/tools.md",
    penalty: "workspace/penalty.md",
  };

  const files = {};
  const missingPaths = [];
  for (const [key, path] of Object.entries(fileMap)) {
    const content = await vfsGetUtf8(path);
    if (content === null) {
      missingPaths.push(path);
    } else {
      files[key] = content;
    }
  }
  if (missingPaths.length > 0) {
    return withToolMeta(
      toolName,
      startedAtMs,
      makeToolFailure("NOT_FOUND", "Missing experience workspace files", { missingPaths }),
    );
  }

  const origin = safeOrigin() || "http://localhost";
  const defaultWsUrl = origin.replace(/^https:/, "wss:").replace(/^http:/, "ws:") + "/__test__/experience/ws";
  const wsUrl = typeof params?.wsUrl === "string" && params.wsUrl.trim() ? params.wsUrl.trim() : defaultWsUrl;

  const opened = await runWsOpen({ url: wsUrl, connectTimeoutMs: 8_000 }, "ws_open");
  if (!opened.ok) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure(opened.error?.code || "UNSUPPORTED", opened.error?.message || "WS_OPEN_FAILED"));
  }
  const sessionId = opened.data?.sessionId;
  if (!sessionId) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("UNSUPPORTED", "Missing websocket session id"));
  }

  const sent = runWsSend(
    {
      sessionId,
      json: {
        type: "experience.run",
        files,
      },
    },
    "ws_send",
  );
  if (!sent.ok) {
    runWsClose({ sessionId }, "ws_close");
    return withToolMeta(toolName, startedAtMs, makeToolFailure(sent.error?.code || "UNSUPPORTED", sent.error?.message || "WS_SEND_FAILED"));
  }

  const received = await runWsRecv({ sessionId, maxMessages: 1, waitMs: 8_000 }, "ws_recv");
  runWsClose({ sessionId }, "ws_close");
  if (!received.ok) {
    return withToolMeta(
      toolName,
      startedAtMs,
      makeToolFailure(received.error?.code || "UNSUPPORTED", received.error?.message || "WS_RECV_FAILED"),
    );
  }

  const first = Array.isArray(received.data?.messages) && received.data.messages.length > 0 ? received.data.messages[0] : null;
  const ack = first?.json || null;
  if (!ack) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("TIMEOUT", "No experience response received"));
  }

  return withToolMeta(toolName, startedAtMs, makeToolSuccess({ ack }));
}

// --- House crypto helpers (mirrors public/create.js + public/house.js) ---
function buildHouseKeyWrapMessage({ houseId, origin }) {
  const parts = ["ElizaTown House Key Wrap", `houseId: ${houseId}`];
  if (origin) parts.push(`origin: ${origin}`);
  return parts.join("\n");
}

function buildVaultKeyWrapMessage({ houseId, origin }) {
  return ["ElizaTown Vault Backup Key Wrap", `houseId: ${houseId}`, `origin: ${origin}`].join("\n");
}

async function deriveHouseKeysFromKroot(krootBytes) {
  const kencBytes = await hkdfSha256(krootBytes, "elizatown-house-enc-v1", 32);
  const kauthBytes = await hkdfSha256(krootBytes, "elizatown-house-auth-v1", 32);
  const kauthKey = await importHmacSha256Key(kauthBytes, ["sign"]);
  return { kencBytes, kauthBytes, kauthKey };
}

async function houseAuthHeaders({ houseId, method, urlPath, body }) {
  if (!state.kauthKey) throw new Error("HOUSE_AUTH_NOT_READY");
  const ts = String(nowMs());
  const bodyHash = await sha256B64FromUtf8(body || "");
  const msg = `${houseId}.${ts}.${method}.${urlPath}.${bodyHash}`;
  const auth = await hmacSha256B64(state.kauthKey, msg);
  return { "x-house-ts": ts, "x-house-auth": auth };
}

// --- Vault backup ---
const deterministicSignerOk = new Set();

async function ensureDeterministicSigner(message) {
  const a = await walletSignMessage(message);
  const addr = typeof a?.address === "string" ? a.address : "";
  const cacheKey = `${addr}|${message}`;
  if (deterministicSignerOk.has(cacheKey)) return a;

  const b = await walletSignMessage(message);
  const aa = a.signatureBytes;
  const bb = b.signatureBytes;
  if (aa.length !== bb.length) throw new Error("NON_DETERMINISTIC_SIGNATURES");
  for (let i = 0; i < aa.length; i += 1) {
    if (aa[i] !== bb[i]) throw new Error("NON_DETERMINISTIC_SIGNATURES");
  }
  deterministicSignerOk.add(cacheKey);
  return a;
}

async function deriveVaultKeyBytes({ houseId }) {
  const origin = safeOrigin();
  const message = buildVaultKeyWrapMessage({ houseId, origin });
  const { signatureBytes } = await ensureDeterministicSigner(message);
  const wrapKeyBytes = await sha256(signatureBytes);
  return await hkdfSha256(wrapKeyBytes, "elizatown-vault-backup-v1", 32);
}

async function buildVaultPlaintext() {
  const allFiles = await vfsReadAllBytes("");
  const vfs = {};
  for (const [p, bytes] of Object.entries(allFiles)) {
    vfs[p] = bytesToB64(bytes);
  }
  return {
    v: 1,
    schema: "openclaw-lite-vault@1",
    createdAtMs: nowMs(),
    houseId: state.houseId,
    krootB64: state.krootBytes ? bytesToB64(state.krootBytes) : null,
    marker: state.secretMarker || null,
    vfs,
  };
}

async function lockAndBackupVault() {
  if (!state.houseId || !state.krootBytes) throw new Error("HOUSE_NOT_READY");
  const decision = await requestApproval({ title: "Approval", body: "Lock + backup vault" });
  if (decision !== "approve") {
    log("backup rejected");
    return;
  }

  const vaultKeyBytes = await deriveVaultKeyBytes({ houseId: state.houseId });
  const plaintext = await buildVaultPlaintext();
  const ptBytes = utf8ToBytes(JSON.stringify(plaintext));
  const enc = await aesGcmEncryptRaw(vaultKeyBytes, ptBytes);
  const sha = await sha256(enc.ct);

  const envelope = {
    v: 1,
    alg: "AES-GCM",
    kdf: {
      kind: "wallet-signature",
      wallet: "solana",
      message: buildVaultKeyWrapMessage({ houseId: state.houseId, origin: safeOrigin() }),
      origin: safeOrigin(),
      houseId: state.houseId,
    },
    iv: bytesToB64(enc.iv),
    ct: bytesToB64(enc.ct),
    meta: {
      schema: "openclaw-lite-vault@1",
      createdAtMs: nowMs(),
      byteLength: ptBytes.length,
      sha256: bytesToB64(sha),
    },
  };

  const urlPath = `/api/house/${encodeURIComponent(state.houseId)}/vault/backup`;
  const body = JSON.stringify({ vault: envelope });
  const headers = await houseAuthHeaders({ houseId: state.houseId, method: "POST", urlPath, body });
  const resp = await apiJson(urlPath, { method: "POST", body, headers });
  state.vaultLatestBackupId = resp?.backupId || null;
  await metaSet("vaultLatestBackupId", state.vaultLatestBackupId);
  updateGatewayState();
  log(`backup ok ${state.vaultLatestBackupId || ""}`);

  // Lock: wipe K_root from memory, but keep persisted VFS.
  state.krootBytes = null;
  state.kencBytes = null;
  state.kauthBytes = null;
  state.kauthKey = null;
  await metaSet("krootB64", null);
}

async function restoreFromLatestVault() {
  if (!state.houseId) throw new Error("HOUSE_NOT_READY");

  // If K_root is missing, recover via wallet keyWrap.
  if (!state.krootBytes) {
    await recoverHouse();
  }
  if (!state.krootBytes) throw new Error("HOUSE_KEY_NOT_RECOVERED");

  const urlPath = `/api/house/${encodeURIComponent(state.houseId)}/vault/latest`;
  const headers = await houseAuthHeaders({ houseId: state.houseId, method: "GET", urlPath, body: "" });
  const resp = await apiJson(urlPath, { method: "GET", headers });
  const vault = resp?.vault || null;
  if (!vault || typeof vault.ct !== "string" || typeof vault.iv !== "string") throw new Error("NO_VAULT");

  const vaultKeyBytes = await deriveVaultKeyBytes({ houseId: state.houseId });
  const ptBytes = await aesGcmDecryptRaw(vaultKeyBytes, b64ToBytes(vault.iv), b64ToBytes(vault.ct));

  const parsed = JSON.parse(new TextDecoder().decode(ptBytes));
  if (!parsed || parsed.v !== 1 || parsed.schema !== "openclaw-lite-vault@1") throw new Error("INVALID_VAULT");

  // Restore VFS (overwrite).
  const vfs = parsed.vfs && typeof parsed.vfs === "object" ? parsed.vfs : {};
  for (const [p, dataB64] of Object.entries(vfs)) {
    if (typeof p !== "string" || typeof dataB64 !== "string") continue;
    await vfsPutBytes(p, b64ToBytes(dataB64));
  }

  // Restore marker and transcript/session ids.
  state.secretMarker = parsed.marker || null;

  // If vault includes K_root, use it (still validate houseId).
  if (typeof parsed.krootB64 === "string" && parsed.krootB64) {
    const kroot = b64ToBytes(parsed.krootB64);
    const derivedHouseId = base58Encode(await sha256(kroot));
    if (derivedHouseId !== state.houseId) throw new Error("HOUSE_ID_MISMATCH");
    const keys = await deriveHouseKeysFromKroot(kroot);
    state.krootBytes = kroot;
    state.kencBytes = keys.kencBytes;
    state.kauthBytes = keys.kauthBytes;
    state.kauthKey = keys.kauthKey;
  }

  await ensureWorkspaceFiles();
  await ensureSessionFiles();
  await persistTranscript();
  log(`restore ok marker=${state.secretMarker || ""}`);
  updateGatewayState();
}

// --- Public profile ---
async function publishProfile({ housePublicJson, promptMd }) {
  if (!state.houseId || !state.kauthKey) throw new Error("HOUSE_NOT_READY");
  const decision = await requestApproval({ title: "Approval", body: "Publish public profile" });
  if (decision !== "approve") {
    log("publish rejected");
    return;
  }

  const urlPath = `/api/house/${encodeURIComponent(state.houseId)}/public-profile`;
  const body = JSON.stringify({ housePublicJson, promptMd: promptMd || "", previewImage: null, clear: false });
  const headers = await houseAuthHeaders({ houseId: state.houseId, method: "POST", urlPath, body });
  await apiJson(urlPath, { method: "POST", body, headers });
  log("publish ok");
}

// --- Export ---
async function exportZip() {
  await ensureWorkspaceFiles();
  await ensureSessionFiles();
  await persistTranscript();

  const files = await vfsReadAllBytes("");
  const manifest = {
    v: 1,
    kind: "openclaw-lite-export",
    createdAtMs: nowMs(),
    openclaw: {
      agentId: MAIN_AGENT_ID,
      mainSessionKey: MAIN_SESSION_KEY,
      compat: { openclawVersion: OPENCLAW_VERSION, piVersions: PI_VERSIONS },
    },
  };
  files["manifest.json"] = utf8ToBytes(JSON.stringify(manifest, null, 2));

  const zipped = zipSync(files, { level: 0 });
  post({ type: "worker.export.zip", filename: "openclaw-lite-export.zip", bytes: zipped.buffer }, [zipped.buffer]);
}

// --- House creation + recovery ---
async function createHouse({ rhB64 }) {
  if (state.houseId) return;

  const rh = b64ToBytes(rhB64);
  const ra = randomBytes(32);
  const combo = new Uint8Array(rh.length + ra.length);
  combo.set(rh, 0);
  combo.set(ra, rh.length);

  const kroot = await sha256(combo);
  const houseId = base58Encode(await sha256(kroot));
  const keys = await deriveHouseKeysFromKroot(kroot);

  const address = await walletConnect();
  const wrapMsg = buildHouseKeyWrapMessage({ houseId, origin: safeOrigin() });
  const { signatureBytes } = await walletSignMessage(wrapMsg);
  const wrapKeyBytes = await sha256(signatureBytes);
  const wrapped = await aesGcmEncryptRaw(wrapKeyBytes, kroot);
  const keyWrap = { alg: "AES-GCM", iv: bytesToB64(wrapped.iv), ct: bytesToB64(wrapped.ct) };

  const nonce = (await apiJson("/api/house/nonce"))?.nonce;
  await apiJson("/api/house/init", {
    method: "POST",
    body: JSON.stringify({
      houseId,
      housePubKey: houseId,
      nonce,
      keyMode: "ceremony",
      unlock: { kind: "solana-wallet-signature", address },
      keyWrap,
      houseAuthKey: bytesToB64(keys.kauthBytes),
    }),
  });

  state.houseId = houseId;
  state.krootBytes = kroot;
  state.kencBytes = keys.kencBytes;
  state.kauthBytes = keys.kauthBytes;
  state.kauthKey = keys.kauthKey;
  state.secretMarker = "secret.marker=1";

  await metaSet("houseId", houseId);
  await metaSet("krootB64", bytesToB64(kroot));
  await metaSet("secretMarker", state.secretMarker);

  await ensureWorkspaceFiles();
  await ensureSessionFiles();
  await persistTranscript();

  updateGatewayState();
  log(`house created ${houseId}`);
}

async function recoverHouse() {
  const address = await walletConnect();
  const nonceResp = await apiJson("/api/wallet/nonce");
  const nonce = nonceResp?.nonce;
  if (!nonce) throw new Error("NONCE_FAILED");
  const lookupMsg = ["ElizaTown House Lookup", `address: ${address}`, `nonce: ${nonce}`].join("\n");
  const lookupSig = await walletSignMessage(lookupMsg);
  const lookup = await apiJson("/api/wallet/lookup", {
    method: "POST",
    body: JSON.stringify({
      address,
      nonce,
      signature: bytesToB64(lookupSig.signatureBytes),
    }),
  });

  const houseId = typeof lookup?.houseId === "string" ? lookup.houseId.trim() : "";
  if (!houseId) throw new Error("HOUSE_NOT_FOUND");

  const keyWrap = lookup?.keyWrap || null;
  if (!keyWrap || keyWrap.alg !== "AES-GCM" || typeof keyWrap.iv !== "string" || typeof keyWrap.ct !== "string") {
    throw new Error("MISSING_KEY_WRAP");
  }

  async function decryptWithMessage(msg) {
    const sig = await walletSignMessage(msg);
    const wrapKeyBytes = await sha256(sig.signatureBytes);
    return await aesGcmDecryptRaw(wrapKeyBytes, b64ToBytes(keyWrap.iv), b64ToBytes(keyWrap.ct));
  }

  const attempts = [];
  attempts.push(buildHouseKeyWrapMessage({ houseId })); // legacy (no origin)
  const origin = safeOrigin();
  if (origin) {
    attempts.push(buildHouseKeyWrapMessage({ houseId, origin }));
    const u = new URL(origin);
    const portSuffix = u.port ? `:${u.port}` : "";
    if (u.hostname === "localhost") {
      attempts.push(buildHouseKeyWrapMessage({ houseId, origin: `${u.protocol}//127.0.0.1${portSuffix}` }));
    } else if (u.hostname === "127.0.0.1") {
      attempts.push(buildHouseKeyWrapMessage({ houseId, origin: `${u.protocol}//localhost${portSuffix}` }));
    }
  }

  let kroot = null;
  let lastErr = null;
  for (const msg of attempts) {
    try {
      kroot = await decryptWithMessage(msg);
      break;
    } catch (e) {
      lastErr = e;
    }
  }
  if (!kroot) throw new Error(lastErr?.message || "KEY_WRAP_DECRYPT_FAILED");

  const derivedHouseId = base58Encode(await sha256(kroot));
  if (derivedHouseId !== houseId) throw new Error("HOUSE_ID_MISMATCH");

  const keys = await deriveHouseKeysFromKroot(kroot);
  state.houseId = houseId;
  state.krootBytes = kroot;
  state.kencBytes = keys.kencBytes;
  state.kauthBytes = keys.kauthBytes;
  state.kauthKey = keys.kauthKey;

  await metaSet("houseId", houseId);
  await metaSet("krootB64", bytesToB64(kroot));

  updateGatewayState();
  log(`house recovered ${houseId}`);
}

async function appendE2eeEntry(text) {
  if (!state.houseId || !state.krootBytes || !state.kencBytes) throw new Error("HOUSE_NOT_READY");
  const decision = await requestApproval({ title: "Approval", body: "Append entry" });
  if (decision !== "approve") {
    log("append rejected");
    return;
  }

  const payload = {
    v: 1,
    id: randomId("e"),
    ts: nowMs(),
    author: "lite",
    type: "note",
    body: { text: String(text || "") },
  };
  const pt = utf8ToBytes(JSON.stringify(payload));
  const aad = utf8ToBytes(`house=${state.houseId}`);
  const enc = await aesGcmEncryptRaw(state.kencBytes, pt, aad);
  const ciphertext = { alg: "AES-GCM", iv: bytesToB64(enc.iv), ct: bytesToB64(enc.ct) };

  const urlPath = `/api/house/${encodeURIComponent(state.houseId)}/append`;
  const body = JSON.stringify({ ciphertext, author: "lite" });
  const headers = await houseAuthHeaders({ houseId: state.houseId, method: "POST", urlPath, body });
  await apiJson(urlPath, { method: "POST", body, headers });
  log("append ok");
}

// --- State ---
const state = {
  houseId: null,
  krootBytes: null,
  kencBytes: null,
  kauthBytes: null,
  kauthKey: null,
  vaultLatestBackupId: null,
  secretMarker: null,
  sessionId: null,
  transcript: [],
  codexCliEnabled: false,
  llmApi: null,
  llmProvider: null,
  llmModelRef: null,
  llmModelId: null,
  llmBaseUrl: null,
  llmReasoning: null,
  llmUseProxy: true,
  llmApiKey: null,
  secretStore: {},
  originGrants: [],
  httpRateLimit: new Map(),
  wsSessions: new Map(),
  workspaceDirs: new Set(["workspace/"]),
  workspaceEvents: [],
};

async function loadStateFromIdb() {
  state.houseId = (await metaGet("houseId")) || null;
  state.vaultLatestBackupId = (await metaGet("vaultLatestBackupId")) || null;
  state.secretMarker = (await metaGet("secretMarker")) || null;
  state.sessionId = (await metaGet("sessionId")) || null;

  state.llmApi = (await metaGet("llmApi")) || null;
  state.llmProvider = (await metaGet("llmProvider")) || null;
  state.llmModelRef = (await metaGet("llmModelRef")) || null;
  state.llmModelId = (await metaGet("llmModelId")) || null;
  state.llmBaseUrl = (await metaGet("llmBaseUrl")) || null;
  state.llmReasoning = normalizeReasoningLevel(await metaGet("llmReasoning"));
  const llmUseProxyStored = await metaGet("llmUseProxy");
  state.llmUseProxy = llmUseProxyStored === false ? false : true;
  state.llmApiKey = (await metaGet("llmApiKey")) || null;
  const secretStoreRaw = (await metaGet("secretStoreV1")) || {};
  state.secretStore = {};
  if (secretStoreRaw && typeof secretStoreRaw === "object" && !Array.isArray(secretStoreRaw)) {
    for (const [k, v] of Object.entries(secretStoreRaw)) {
      if (!isValidSecretName(k)) continue;
      if (typeof v !== "string" || !v) continue;
      state.secretStore[k] = v;
    }
  }

  state.workspaceDirs = new Set(["workspace/"]);
  const workspaceDirsRaw = (await metaGet("workspaceDirsV1")) || [];
  if (Array.isArray(workspaceDirsRaw)) {
    for (const entry of workspaceDirsRaw) {
      if (typeof entry !== "string") continue;
      try {
        const dir = normalizeWorkspacePath(entry, { allowDirectory: true });
        state.workspaceDirs.add(dir);
      } catch {
        // ignore invalid historical entries
      }
    }
  }

  const krootB64 = (await metaGet("krootB64")) || null;
  if (typeof krootB64 === "string" && krootB64) {
    const kroot = b64ToBytes(krootB64);
    const keys = await deriveHouseKeysFromKroot(kroot);
    state.krootBytes = kroot;
    state.kencBytes = keys.kencBytes;
    state.kauthBytes = keys.kauthBytes;
    state.kauthKey = keys.kauthKey;
  }

  await ensureWorkspaceFiles();
  await ensureSessionFiles();

  // Hydrate transcript from VFS.
  if (state.sessionId) {
    const transcriptPath = `.openclaw/agents/${MAIN_AGENT_ID}/sessions/${state.sessionId}.jsonl`;
    const raw = await vfsGetUtf8(transcriptPath);
    if (raw) {
      const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const parsed = [];
      for (const line of lines) {
        try {
          parsed.push(JSON.parse(line));
        } catch {
          // ignore malformed
        }
      }
      state.transcript = parsed;
    }
  }

  post({ type: "worker.workspace.events", events: state.workspaceEvents.slice(0, 100) });
}

async function boot() {
  await loadStateFromIdb();
  updateGatewayState();
  post({ type: "worker.runtime.ready" });
  post({ type: "worker.runtime.status", status: "ready" });

  if (!state.transcript.length) {
    const m = makeAssistant("openclaw-lite boot");
    state.transcript.push(m);
    post({ type: "worker.chat.append", role: "assistant", text: "openclaw-lite boot" });
    await persistTranscript();
  }

  // Demo approval request (M1): deterministic and immediate.
  const decision = await requestApproval({ title: "Approval", body: "Demo approval request" });
  log(`demo approval: ${decision === "approve" ? "approved" : "rejected"}`);
}

self.addEventListener("message", async (ev) => {
  const msg = ev.data;
  if (!msg || typeof msg.type !== "string") return;

  try {
    if (msg.type === "gateway.boot") {
      // no-op; boot is implicit
      return;
    }

    if (msg.type === "gateway.wallet.response") {
      resolveWalletResponse(msg);
      return;
    }

    if (msg.type === "gateway.approval.respond") {
      resolveApproval(String(msg.id || ""), String(msg.decision || ""));
      return;
    }

    if (msg.type === "gateway.chat.send") {
      const text = String(msg.text || "");
      await runAgentTurn(text);
      await writeCheckpoint("observation");

      if (text.startsWith("append:")) {
        const body = text.slice("append:".length).trim();
        if (body) await appendE2eeEntry(body);
      }
      return;
    }

    if (msg.type === "gateway.event.pagehide") {
      await writeCheckpoint("pagehide");
      return;
    }

    if (msg.type === "gateway.event.visibilitychange") {
      const st = String(msg.state || "");
      if (st === "hidden") {
        // Mirror pagehide behavior for browsers that don't reliably fire pagehide.
        await writeCheckpoint("pagehide");
      }
      return;
    }

    if (msg.type === "gateway.command.createHouse") {
      await createHouse({ rhB64: String(msg.rhB64 || "") });
      return;
    }

    if (msg.type === "gateway.command.recoverHouse") {
      await recoverHouse();
      return;
    }

    if (msg.type === "gateway.command.backupVault") {
      await lockAndBackupVault();
      return;
    }

    if (msg.type === "gateway.command.restoreVault") {
      await restoreFromLatestVault();
      return;
    }

    if (msg.type === "gateway.command.publishProfile") {
      await publishProfile({ housePublicJson: msg.housePublicJson || null, promptMd: msg.promptMd || "" });
      return;
    }

    if (msg.type === "gateway.command.freezeNow") {
      await writeCheckpoint("manual");
      log("freeze ok");
      return;
    }

    if (msg.type === "gateway.command.setRuntimeCaps") {
      state.codexCliEnabled = msg.codexCli === true;
      log(`caps codexCli=${state.codexCliEnabled ? "1" : "0"}`);
      return;
    }

    if (msg.type === "gateway.command.setLlmConfig") {
      const apiKey = typeof msg.apiKey === "string" ? msg.apiKey.trim() : "";
      const api = typeof msg.api === "string" ? msg.api.trim() : "";
      const provider = typeof msg.provider === "string" ? msg.provider.trim() : "";
      const modelRef = typeof msg.modelRef === "string" ? msg.modelRef.trim() : "";
      const modelId = typeof msg.modelId === "string" ? msg.modelId.trim() : "";
      const baseUrl = typeof msg.baseUrl === "string" ? msg.baseUrl.trim() : "";
      const reasoning = normalizeReasoningLevel(msg.reasoning);
      const useProxy = msg.useProxy !== false;

      state.llmApiKey = apiKey || null;
      state.llmApi = api || null;
      state.llmProvider = provider || null;
      state.llmModelRef = modelRef || null;
      state.llmModelId = modelId || null;
      state.llmBaseUrl = baseUrl || null;
      state.llmReasoning = reasoning;
      state.llmUseProxy = useProxy;

      await metaSet("llmApiKey", state.llmApiKey);
      await metaSet("llmApi", state.llmApi);
      await metaSet("llmProvider", state.llmProvider);
      await metaSet("llmModelRef", state.llmModelRef);
      await metaSet("llmModelId", state.llmModelId);
      await metaSet("llmBaseUrl", state.llmBaseUrl);
      await metaSet("llmReasoning", state.llmReasoning);
      await metaSet("llmUseProxy", state.llmUseProxy);

      log(
        `llm configured api=${state.llmApi || "default"} provider=${state.llmProvider || "default"} model=${state.llmModelRef || state.llmModelId || "default"
        } proxy=${state.llmUseProxy ? "1" : "0"} thinking=${state.llmReasoning || "default"}`,
      );
      return;
    }

    if (msg.type === "gateway.command.exportZip") {
      await exportZip();
      return;
    }

    if (msg.type === "gateway.command.tools.registry") {
      post({
        type: "worker.tools.registry",
        requestId: String(msg.requestId || ""),
        ok: true,
        info: getToolRegistryInfo(),
      });
      return;
    }

    if (msg.type === "gateway.command.tools.smoke") {
      const summary = await runSyntheticToolSmoke(Number(msg.count || 5));
      post({
        type: "worker.tools.smoke",
        requestId: String(msg.requestId || ""),
        ok: true,
        summary,
      });
      return;
    }

    if (msg.type === "gateway.command.tools.transcriptStats") {
      const stats = computeTranscriptToolStats(state.transcript);
      post({
        type: "worker.tools.transcriptStats",
        requestId: String(msg.requestId || ""),
        ok: true,
        stats,
      });
      return;
    }

    if (msg.type === "gateway.command.tools.webFetch") {
      const toolName = msg.toolName === "skill_fetch" ? "skill_fetch" : "web_fetch";
      const result = await runWebFetch(msg.params || {}, toolName);
      post({
        type: "worker.tools.webFetch",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.tools.httpRequest") {
      const result = await runHttpRequest(msg.params || {}, "http_request");
      post({
        type: "worker.tools.httpRequest",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.secrets.set") {
      const result = await runSecretSet(msg.params || {}, "secret_set");
      post({
        type: "worker.secrets.set",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.secrets.list") {
      const result = runSecretList(msg.params || {}, "secret_list");
      post({
        type: "worker.secrets.list",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.secrets.delete") {
      const result = await runSecretDelete(msg.params || {}, "secret_delete");
      post({
        type: "worker.secrets.delete",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.tools.transcriptDump") {
      post({
        type: "worker.tools.transcriptDump",
        requestId: String(msg.requestId || ""),
        ok: true,
        dump: JSON.stringify(state.transcript || []),
      });
      return;
    }

    if (msg.type === "gateway.command.tools.ws.open") {
      const result = await runWsOpen(msg.params || {}, "ws_open");
      post({
        type: "worker.tools.ws.open",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.tools.ws.send") {
      const result = runWsSend(msg.params || {}, "ws_send");
      post({
        type: "worker.tools.ws.send",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.tools.ws.recv") {
      const result = await runWsRecv(msg.params || {}, "ws_recv");
      post({
        type: "worker.tools.ws.recv",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.tools.ws.close") {
      const result = runWsClose(msg.params || {}, "ws_close");
      post({
        type: "worker.tools.ws.close",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.tools.ws.status") {
      const result = runWsStatus(msg.params || {}, "ws_status");
      post({
        type: "worker.tools.ws.status",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.workspace.mkdir") {
      const result = await runWorkspaceMkdir(msg.params || {}, "workspace_mkdir");
      post({
        type: "worker.workspace.mkdir",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.workspace.list") {
      const result = await runWorkspaceList(msg.params || {}, "workspace_list");
      post({
        type: "worker.workspace.list",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.workspace.readFile") {
      const result = await runWorkspaceReadFile(msg.params || {}, "workspace_read_file");
      post({
        type: "worker.workspace.readFile",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.workspace.writeFile") {
      const result = await runWorkspaceWriteFile(msg.params || {}, "workspace_write_file");
      post({
        type: "worker.workspace.writeFile",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.workspace.editFile") {
      const result = await runWorkspaceEditFile(msg.params || {}, "workspace_edit_file");
      post({
        type: "worker.workspace.editFile",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.workspace.delete") {
      const result = await runWorkspaceDelete(msg.params || {}, "workspace_delete");
      post({
        type: "worker.workspace.delete",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.workspace.bootstrap") {
      const result = await runWorkspaceBootstrap("workspace_bootstrap");
      post({
        type: "worker.workspace.bootstrap",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.workspace.events") {
      const result = runWorkspaceEvents("workspace_events");
      post({
        type: "worker.workspace.events",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.tools.wallet.connect") {
      const result = await runWalletConnectTool(msg.params || {}, "wallet_connect");
      post({
        type: "worker.tools.wallet.connect",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.tools.wallet.accounts") {
      const result = await runWalletGetAccountsTool(msg.params || {}, "wallet_get_accounts");
      post({
        type: "worker.tools.wallet.accounts",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.tools.wallet.signMessage") {
      const result = await runWalletSignMessageTool(msg.params || {}, "wallet_sign_message");
      post({
        type: "worker.tools.wallet.signMessage",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.runtime.keyMaterialStatus") {
      post({
        type: "worker.runtime.keyMaterialStatus",
        requestId: String(msg.requestId || ""),
        ok: true,
        result: {
          ok: true,
          data: {
            hasKroot: !!(state.krootBytes && state.krootBytes.length > 0),
            hasKenc: !!(state.kencBytes && state.kencBytes.length > 0),
            hasKauth: !!(state.kauthBytes && state.kauthBytes.length > 0),
            houseId: state.houseId || null,
          },
        },
      });
      return;
    }

    if (msg.type === "gateway.command.webmcp.discover") {
      const result = await runWebMcpDiscover(msg.params || {}, "webmcp_discover");
      post({
        type: "worker.webmcp.discover",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.webmcp.call") {
      const result = await runWebMcpCall(msg.params || {}, "webmcp_call");
      post({
        type: "worker.webmcp.call",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.experience.run") {
      const result = await runExperienceEngineBaseline(msg.params || {}, "experience_engine_run");
      post({
        type: "worker.experience.run",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.origin.check") {
      try {
        const result = evaluateOriginAccess({
          url: String(msg.url || ""),
          capability: String(msg.capability || "web_fetch"),
          method: String(msg.method || "GET"),
          consume: msg.consume !== false,
        });
        post({
          type: "worker.origin.check",
          requestId: String(msg.requestId || ""),
          ok: true,
          result,
        });
      } catch (e) {
        post({
          type: "worker.origin.check",
          requestId: String(msg.requestId || ""),
          ok: false,
          error: e?.message || String(e || "ORIGIN_CHECK_FAILED"),
        });
      }
      return;
    }

    if (msg.type === "gateway.command.origin.grant") {
      try {
        const result = await requestOriginGrant({
          url: String(msg.url || ""),
          capability: String(msg.capability || "web_fetch"),
          scope: String(msg.scope || "once"),
          methods: Array.isArray(msg.methods) ? msg.methods : null,
        });
        post({
          type: "worker.origin.grant",
          requestId: String(msg.requestId || ""),
          ...result,
        });
      } catch (e) {
        post({
          type: "worker.origin.grant",
          requestId: String(msg.requestId || ""),
          ok: false,
          error: e?.message || String(e || "ORIGIN_GRANT_FAILED"),
        });
      }
      return;
    }

    if (msg.type === "gateway.command.origin.revoke") {
      const result = revokeOriginGrant(msg.grantId);
      post({
        type: "worker.origin.revoke",
        requestId: String(msg.requestId || ""),
        ...result,
      });
      return;
    }
  } catch (e) {
    log(`error: ${e.message || String(e)}`);
  }
});

boot().catch((e) => {
  log(`boot failed: ${e.message || String(e)}`);
});
