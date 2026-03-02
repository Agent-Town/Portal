const crypto = require("crypto");
const net = require("net");

function sha256Base64(input) {
  return crypto.createHash("sha256").update(input).digest("base64");
}

function normalizeToolMaxBytes(value, fallback, hardMax) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, hardMax);
}

function isPrivateIpv4(host) {
  const parts = String(host || "")
    .split(".")
    .map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

function isLocalOrPrivateIpv6(host) {
  const h = String(host || "").toLowerCase();
  if (!h) return false;
  if (h === "::1") return true;
  if (h.startsWith("fc") || h.startsWith("fd")) return true; // unique local
  if (h.startsWith("fe8") || h.startsWith("fe9") || h.startsWith("fea") || h.startsWith("feb")) return true; // link-local
  return false;
}

function isBlockedProxyHost(hostname) {
  const host = String(hostname || "").toLowerCase().replace(/\.$/, "");
  if (!host) return true;
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host === "0.0.0.0") return true;
  if (host.endsWith(".local")) return true;

  const ipVersion = net.isIP(host);
  if (ipVersion === 4 && isPrivateIpv4(host)) return true;
  if (ipVersion === 6 && isLocalOrPrivateIpv6(host)) return true;
  return false;
}

function truncateUtf8Buffer(buf, maxBytes) {
  if (!Buffer.isBuffer(buf)) return { text: "", truncated: false };
  if (buf.length <= maxBytes) return { text: buf.toString("utf8"), truncated: false };
  return { text: buf.subarray(0, maxBytes).toString("utf8"), truncated: true };
}

function webFetchSuccess({ url, finalUrl, status, contentType, etag, lastModified, text, truncated, fromCache, startedAtMs }) {
  return {
    ok: true,
    data: {
      url,
      finalUrl,
      status,
      contentType: contentType || "",
      etag: etag || null,
      lastModified: lastModified || null,
      sha256B64: sha256Base64(String(text || "")),
      text: String(text || ""),
      truncated: !!truncated,
      fromCache: !!fromCache,
    },
    meta: {
      tool: "web_fetch",
      durationMs: Math.max(0, Date.now() - Number(startedAtMs || 0)),
    },
  };
}

function webFetchFailure({ code, message, details, retryable, startedAtMs }) {
  return {
    ok: false,
    error: {
      code: String(code || "UNSUPPORTED"),
      message: String(message || code || "web_fetch failed"),
      retryable: !!retryable,
      details: details && typeof details === "object" ? details : {},
    },
    meta: {
      tool: "web_fetch",
      durationMs: Math.max(0, Date.now() - Number(startedAtMs || 0)),
    },
  };
}

const WEB_FETCH_DEFAULT_MAX_BYTES = 262_144;
const WEB_FETCH_MAX_BYTES = 1_048_576;
const WEB_FETCH_REDIRECT_LIMIT = 5;
const WEB_FETCH_TIMEOUT_MS = 20_000;

function normalizeExpectedMime(raw) {
  const value = String(raw || "any").trim().toLowerCase();
  if (value === "text/markdown") return "text/markdown";
  if (value === "text/plain") return "text/plain";
  if (value === "application/json") return "application/json";
  return "any";
}

function expectedMimeMatches(expectedMime, contentType) {
  if (expectedMime === "any") return true;
  const ct = String(contentType || "").toLowerCase();
  return ct.startsWith(expectedMime);
}

function normalizeWebFetchRequest(body) {
  const rawUrl = typeof body?.url === "string" ? body.url.trim() : "";
  if (!rawUrl) throw new Error("INVALID_ARGUMENTS");
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("INVALID_ARGUMENTS");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("INVALID_ARGUMENTS");
  }
  return {
    url: parsed.toString(),
    followRedirects: body?.followRedirects !== false,
    maxBytes: normalizeToolMaxBytes(body?.maxBytes, WEB_FETCH_DEFAULT_MAX_BYTES, WEB_FETCH_MAX_BYTES),
    cacheMode: String(body?.cacheMode || "allow-cache"),
    expectedMime: normalizeExpectedMime(body?.expectedMime),
  };
}

function fixtureDocumentForPath(pathname) {
  if (pathname === "/docs/agenttown") {
    return {
      contentType: "text/markdown; charset=utf-8",
      text: "# Agent Town\n\nYou are an Agent Town worker. Use structured API calls.",
    };
  }
  if (pathname === "/docs/long-skill") {
    return {
      contentType: "text/markdown; charset=utf-8",
      text: [
        "# Long Skill",
        "",
        "This fixture intentionally exceeds truncation thresholds for deterministic tests.",
        "Agent Town long skill content.",
      ].join("\n"),
    };
  }
  return null;
}

async function executeWebFetchProxy(input, startedAtMs) {
  let current = new URL(input.url);
  let redirects = 0;

  for (;;) {
    if (isBlockedProxyHost(current.hostname)) {
      return webFetchFailure({
        code: "NETWORK_BLOCKED",
        message: "Blocked local/private host",
        details: { hostname: current.hostname },
        startedAtMs,
      });
    }

    // Deterministic cross-origin fixture host for e2e (no external internet dependency).
    if (current.hostname === "fixture.openclaw.test") {
      if (current.pathname === "/redirect/long-skill") {
        if (!input.followRedirects) {
          return webFetchSuccess({
            url: input.url,
            finalUrl: current.toString(),
            status: 302,
            contentType: "text/plain; charset=utf-8",
            etag: null,
            lastModified: null,
            text: "",
            truncated: false,
            fromCache: false,
            startedAtMs,
          });
        }
        if (redirects >= WEB_FETCH_REDIRECT_LIMIT) {
          return webFetchFailure({
            code: "UNSUPPORTED",
            message: "Redirect limit exceeded",
            details: { limit: WEB_FETCH_REDIRECT_LIMIT },
            startedAtMs,
          });
        }
        redirects += 1;
        current = new URL("https://fixture.openclaw.test/docs/long-skill");
        continue;
      }

      const doc = fixtureDocumentForPath(current.pathname);
      if (!doc) {
        return webFetchFailure({
          code: "NOT_FOUND",
          message: "Fixture document not found",
          details: { path: current.pathname },
          startedAtMs,
        });
      }

      if (!expectedMimeMatches(input.expectedMime, doc.contentType)) {
        return webFetchFailure({
          code: "UNSUPPORTED",
          message: "MIME type mismatch",
          details: { expectedMime: input.expectedMime, contentType: doc.contentType },
          startedAtMs,
        });
      }

      const truncatedDoc = truncateUtf8Buffer(Buffer.from(doc.text, "utf8"), input.maxBytes);
      return webFetchSuccess({
        url: input.url,
        finalUrl: current.toString(),
        status: 200,
        contentType: doc.contentType,
        etag: '"fixture-etag"',
        lastModified: "Mon, 01 Jan 2024 00:00:00 GMT",
        text: truncatedDoc.text,
        truncated: truncatedDoc.truncated,
        fromCache: false,
        startedAtMs,
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WEB_FETCH_TIMEOUT_MS);
    let upstream;
    try {
      upstream = await fetch(current.toString(), {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
      });
    } catch (e) {
      clearTimeout(timeoutId);
      if (e?.name === "AbortError") {
        return webFetchFailure({
          code: "TIMEOUT",
          message: "Upstream fetch timed out",
          retryable: true,
          details: { timeoutMs: WEB_FETCH_TIMEOUT_MS },
          startedAtMs,
        });
      }
      return webFetchFailure({
        code: "UNSUPPORTED",
        message: "Upstream fetch failed",
        retryable: true,
        details: { url: current.toString() },
        startedAtMs,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const location = upstream.headers.get("location");
    if (location && upstream.status >= 300 && upstream.status < 400) {
      if (!input.followRedirects) {
        return webFetchSuccess({
          url: input.url,
          finalUrl: current.toString(),
          status: upstream.status,
          contentType: upstream.headers.get("content-type") || "",
          etag: upstream.headers.get("etag"),
          lastModified: upstream.headers.get("last-modified"),
          text: "",
          truncated: false,
          fromCache: false,
          startedAtMs,
        });
      }
      if (redirects >= WEB_FETCH_REDIRECT_LIMIT) {
        return webFetchFailure({
          code: "UNSUPPORTED",
          message: "Redirect limit exceeded",
          details: { limit: WEB_FETCH_REDIRECT_LIMIT },
          startedAtMs,
        });
      }
      let next;
      try {
        next = new URL(location, current.toString());
      } catch {
        return webFetchFailure({
          code: "UNSUPPORTED",
          message: "Invalid redirect URL",
          details: { location },
          startedAtMs,
        });
      }
      if (next.protocol !== "http:" && next.protocol !== "https:") {
        return webFetchFailure({
          code: "NETWORK_BLOCKED",
          message: "Blocked redirect protocol",
          details: { protocol: next.protocol },
          startedAtMs,
        });
      }
      redirects += 1;
      current = next;
      continue;
    }

    const contentType = upstream.headers.get("content-type") || "";
    if (!expectedMimeMatches(input.expectedMime, contentType)) {
      return webFetchFailure({
        code: "UNSUPPORTED",
        message: "MIME type mismatch",
        details: { expectedMime: input.expectedMime, contentType },
        startedAtMs,
      });
    }

    const bytes = Buffer.from(await upstream.arrayBuffer());
    const truncated = truncateUtf8Buffer(bytes, input.maxBytes);
    return webFetchSuccess({
      url: input.url,
      finalUrl: current.toString(),
      status: upstream.status,
      contentType,
      etag: upstream.headers.get("etag"),
      lastModified: upstream.headers.get("last-modified"),
      text: truncated.text,
      truncated: truncated.truncated,
      fromCache: false,
      startedAtMs,
    });
  }
}

const HTTP_REQUEST_DEFAULT_MAX_BYTES = 262_144;
const HTTP_REQUEST_MAX_BYTES = 1_048_576;
const HTTP_REQUEST_MAX_REDIRECTS = 5;
const HTTP_REQUEST_DEFAULT_TIMEOUT_MS = 30_000;
const HTTP_REQUEST_MIN_TIMEOUT_MS = 100;
const HTTP_REQUEST_MAX_TIMEOUT_MS = 60_000;

function normalizeHttpRequestMethod(value) {
  const method = String(value || "GET").trim().toUpperCase();
  const allowed = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"]);
  if (!allowed.has(method)) throw new Error("INVALID_ARGUMENTS");
  return method;
}

function normalizeHttpRequestResponseMode(value) {
  const mode = String(value || "auto").trim().toLowerCase();
  if (mode === "json" || mode === "text" || mode === "base64") return mode;
  return "auto";
}

function normalizeHttpRequestTimeout(value) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return HTTP_REQUEST_DEFAULT_TIMEOUT_MS;
  if (n < HTTP_REQUEST_MIN_TIMEOUT_MS) return HTTP_REQUEST_MIN_TIMEOUT_MS;
  if (n > HTTP_REQUEST_MAX_TIMEOUT_MS) return HTTP_REQUEST_MAX_TIMEOUT_MS;
  return n;
}

function normalizeHttpRequestHeaders(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const out = {};
  for (const [k, v] of Object.entries(input)) {
    const key = String(k || "").trim().toLowerCase();
    if (!key || v == null) continue;
    out[key] = String(v);
  }
  return out;
}

function normalizeHttpRequestQuery(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const out = {};
  for (const [k, v] of Object.entries(input)) {
    const key = String(k || "").trim();
    if (!key) continue;
    if (Array.isArray(v)) out[key] = v.map((x) => String(x));
    else out[key] = String(v);
  }
  return out;
}

function applyQueryToUrl(urlStr, query) {
  const url = new URL(urlStr);
  for (const [k, v] of Object.entries(query || {})) {
    url.searchParams.delete(k);
    if (Array.isArray(v)) {
      for (const entry of v) url.searchParams.append(k, String(entry));
    } else {
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

function normalizeHttpRequestBody(body, headers) {
  if (!body || typeof body !== "object") return { wire: null, buffer: null };
  const kind = String(body.kind || "text").trim().toLowerCase();
  if (kind === "json") {
    const jsonValue = body.json !== undefined ? body.json : {};
    const text = JSON.stringify(jsonValue);
    if (!headers["content-type"]) headers["content-type"] = "application/json";
    return { wire: { kind: "json", json: jsonValue }, buffer: Buffer.from(text, "utf8") };
  }
  if (kind === "text") {
    const text = typeof body.text === "string" ? body.text : String(body.text ?? "");
    return { wire: { kind: "text", text }, buffer: Buffer.from(text, "utf8") };
  }
  if (kind === "base64") {
    const base64 = typeof body.base64 === "string" ? body.base64 : "";
    if (!/^[A-Za-z0-9+/=]*$/.test(base64)) throw new Error("INVALID_ARGUMENTS");
    return { wire: { kind: "base64", base64 }, buffer: Buffer.from(base64, "base64") };
  }
  throw new Error("INVALID_ARGUMENTS");
}

function normalizeHttpRequestProxyInput(body) {
  const rawUrl = typeof body?.url === "string" ? body.url.trim() : "";
  if (!rawUrl) throw new Error("INVALID_ARGUMENTS");
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("INVALID_ARGUMENTS");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("INVALID_ARGUMENTS");
  }

  const method = normalizeHttpRequestMethod(body?.method);
  const headers = normalizeHttpRequestHeaders(body?.headers);
  const query = normalizeHttpRequestQuery(body?.query);
  const bodyInfo = normalizeHttpRequestBody(body?.body, headers);
  return {
    method,
    headers,
    query,
    body: bodyInfo.wire,
    bodyBuffer: bodyInfo.buffer,
    followRedirects: body?.followRedirects !== false,
    timeoutMs: normalizeHttpRequestTimeout(body?.timeoutMs),
    maxBytes: normalizeToolMaxBytes(body?.maxBytes, HTTP_REQUEST_DEFAULT_MAX_BYTES, HTTP_REQUEST_MAX_BYTES),
    responseMode: normalizeHttpRequestResponseMode(body?.responseMode),
    url: applyQueryToUrl(parsed.toString(), query),
  };
}

function isSensitiveHeaderName(name) {
  const key = String(name || "").toLowerCase();
  return key === "authorization" || key === "cookie" || key === "proxy-authorization" || key === "x-api-key";
}

function stripSensitiveHeaders(headers) {
  const out = {};
  for (const [k, v] of Object.entries(headers || {})) {
    if (isSensitiveHeaderName(k)) continue;
    out[k] = v;
  }
  return out;
}

function responseHeadersToObject(headers) {
  const out = {};
  if (!headers || typeof headers.entries !== "function") return out;
  for (const [k, v] of headers.entries()) out[String(k || "").toLowerCase()] = String(v || "");
  return out;
}

function decodeHttpRequestResponseBody(buffer, responseMode, contentType) {
  const bytes = Buffer.isBuffer(buffer) ? buffer : Buffer.from("");
  const bodyText = bytes.toString("utf8");
  let bodyJson = null;
  let bodyBase64 = "";
  const mode = normalizeHttpRequestResponseMode(responseMode);
  const isJsonLike = String(contentType || "").toLowerCase().includes("application/json");
  if (mode === "json" || (mode === "auto" && isJsonLike)) {
    try {
      bodyJson = JSON.parse(bodyText);
    } catch {
      bodyJson = null;
    }
  }
  if (mode === "base64") bodyBase64 = bytes.toString("base64");
  return { bodyText, bodyJson, bodyBase64 };
}

function httpRequestSuccess({ status, finalUrl, headers, bodyBuffer, responseMode, startedAtMs, maxBytes }) {
  const allBytes = Buffer.isBuffer(bodyBuffer) ? bodyBuffer : Buffer.from("");
  const truncated = allBytes.length > maxBytes;
  const limited = truncated ? allBytes.subarray(0, maxBytes) : allBytes;
  const ct = headers["content-type"] || "";
  const decoded = decodeHttpRequestResponseBody(limited, responseMode, ct);
  return {
    ok: true,
    data: {
      status,
      finalUrl,
      headers,
      bodyText: decoded.bodyText,
      bodyJson: decoded.bodyJson,
      bodyBase64: decoded.bodyBase64,
      truncated,
      timing: {
        startedAtMs,
        durationMs: Math.max(0, Date.now() - Number(startedAtMs || 0)),
      },
    },
    meta: {
      tool: "http_request",
      durationMs: Math.max(0, Date.now() - Number(startedAtMs || 0)),
    },
  };
}

function httpRequestFailure({ code, message, details, retryable, startedAtMs }) {
  return {
    ok: false,
    error: {
      code: String(code || "UNSUPPORTED"),
      message: String(message || code || "http_request failed"),
      retryable: !!retryable,
      details: details && typeof details === "object" ? details : {},
    },
    meta: {
      tool: "http_request",
      durationMs: Math.max(0, Date.now() - Number(startedAtMs || 0)),
    },
  };
}

function tryFixtureHttpResponse(urlObj, method, headers, followRedirects) {
  if (urlObj.hostname === "fixture.openclaw.test" && urlObj.pathname === "/redirect/auth-header") {
    if (!followRedirects) {
      return {
        done: true,
        status: 302,
        headers: { location: "https://fixture-two.openclaw.test/echo/auth-header", "content-type": "text/plain" },
        bodyBuffer: Buffer.from("", "utf8"),
        finalUrl: urlObj.toString(),
      };
    }
    return {
      redirectTo: "https://fixture-two.openclaw.test/echo/auth-header",
    };
  }

  if (urlObj.hostname === "fixture-two.openclaw.test" && urlObj.pathname === "/echo/auth-header") {
    return {
      done: true,
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
      bodyBuffer: Buffer.from(
        JSON.stringify({
          ok: true,
          method,
          receivedAuthorization: headers.authorization || null,
        }),
        "utf8",
      ),
      finalUrl: urlObj.toString(),
    };
  }

  if (urlObj.hostname === "fixture-rate.openclaw.test" && urlObj.pathname === "/ping") {
    return {
      done: true,
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8" },
      bodyBuffer: Buffer.from("pong", "utf8"),
      finalUrl: urlObj.toString(),
    };
  }

  return null;
}

async function executeHttpRequestProxy(input, startedAtMs) {
  let currentUrl = new URL(input.url);
  let currentMethod = input.method;
  let currentHeaders = { ...input.headers };
  let currentBody = input.bodyBuffer;
  let redirects = 0;

  for (;;) {
    if (isBlockedProxyHost(currentUrl.hostname)) {
      return httpRequestFailure({
        code: "NETWORK_BLOCKED",
        message: "Blocked local/private host",
        details: { hostname: currentUrl.hostname },
        startedAtMs,
      });
    }

    const fixture = tryFixtureHttpResponse(currentUrl, currentMethod, currentHeaders, input.followRedirects);
    if (fixture) {
      if (fixture.redirectTo) {
        if (redirects >= HTTP_REQUEST_MAX_REDIRECTS) {
          return httpRequestFailure({
            code: "UNSUPPORTED",
            message: "Redirect limit exceeded",
            details: { limit: HTTP_REQUEST_MAX_REDIRECTS },
            startedAtMs,
          });
        }
        const next = new URL(fixture.redirectTo, currentUrl.toString());
        if (next.origin !== currentUrl.origin) {
          currentHeaders = stripSensitiveHeaders(currentHeaders);
        }
        redirects += 1;
        currentUrl = next;
        currentBody = null;
        currentMethod = "GET";
        continue;
      }
      return httpRequestSuccess({
        status: fixture.status,
        finalUrl: fixture.finalUrl,
        headers: fixture.headers,
        bodyBuffer: fixture.bodyBuffer,
        responseMode: input.responseMode,
        startedAtMs,
        maxBytes: input.maxBytes,
      });
    }

    const abort = new AbortController();
    const timeoutId = setTimeout(() => abort.abort(), input.timeoutMs);
    let upstream;
    try {
      upstream = await fetch(currentUrl.toString(), {
        method: currentMethod,
        headers: currentHeaders,
        body: currentBody == null ? undefined : currentBody,
        redirect: "manual",
        signal: abort.signal,
      });
    } catch (e) {
      clearTimeout(timeoutId);
      if (e?.name === "AbortError") {
        return httpRequestFailure({
          code: "TIMEOUT",
          message: "Upstream request timed out",
          retryable: true,
          details: { timeoutMs: input.timeoutMs },
          startedAtMs,
        });
      }
      return httpRequestFailure({
        code: "UNSUPPORTED",
        message: "Upstream request failed",
        retryable: true,
        details: { url: currentUrl.toString() },
        startedAtMs,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const location = upstream.headers.get("location");
    if (location && upstream.status >= 300 && upstream.status < 400) {
      if (!input.followRedirects) {
        const bodyBuffer = Buffer.from(await upstream.arrayBuffer());
        return httpRequestSuccess({
          status: upstream.status,
          finalUrl: currentUrl.toString(),
          headers: responseHeadersToObject(upstream.headers),
          bodyBuffer,
          responseMode: input.responseMode,
          startedAtMs,
          maxBytes: input.maxBytes,
        });
      }
      if (redirects >= HTTP_REQUEST_MAX_REDIRECTS) {
        return httpRequestFailure({
          code: "UNSUPPORTED",
          message: "Redirect limit exceeded",
          details: { limit: HTTP_REQUEST_MAX_REDIRECTS },
          startedAtMs,
        });
      }
      let next;
      try {
        next = new URL(location, currentUrl.toString());
      } catch {
        return httpRequestFailure({
          code: "UNSUPPORTED",
          message: "Invalid redirect URL",
          details: { location },
          startedAtMs,
        });
      }
      if (next.protocol !== "http:" && next.protocol !== "https:") {
        return httpRequestFailure({
          code: "NETWORK_BLOCKED",
          message: "Blocked redirect protocol",
          details: { protocol: next.protocol },
          startedAtMs,
        });
      }
      if (next.origin !== currentUrl.origin) {
        currentHeaders = stripSensitiveHeaders(currentHeaders);
      }

      // Follow browser-like semantics for 303 or legacy 301/302 non-GET/HEAD.
      if (
        upstream.status === 303 ||
        ((upstream.status === 301 || upstream.status === 302) && currentMethod !== "GET" && currentMethod !== "HEAD")
      ) {
        currentMethod = "GET";
        currentBody = null;
      }

      redirects += 1;
      currentUrl = next;
      continue;
    }

    const bodyBuffer = Buffer.from(await upstream.arrayBuffer());
    return httpRequestSuccess({
      status: upstream.status,
      finalUrl: currentUrl.toString(),
      headers: responseHeadersToObject(upstream.headers),
      bodyBuffer,
      responseMode: input.responseMode,
      startedAtMs,
      maxBytes: input.maxBytes,
    });
  }
}

function registerToolsRoutes(app) {
  app.post("/api/tools/web_fetch", async (req, res) => {
    const startedAtMs = Date.now();
    let input;
    try {
      input = normalizeWebFetchRequest(req.body || {});
    } catch {
      return res.status(400).json(
        webFetchFailure({
          code: "INVALID_ARGUMENTS",
          message: "Invalid web_fetch request",
          startedAtMs,
        }),
      );
    }

    const out = await executeWebFetchProxy(input, startedAtMs);
    if (out.ok) return res.status(200).json(out);
    if (out.error?.code === "NETWORK_BLOCKED") return res.status(403).json(out);
    if (out.error?.code === "TIMEOUT") return res.status(504).json(out);
    if (out.error?.code === "INVALID_ARGUMENTS") return res.status(400).json(out);
    if (out.error?.code === "NOT_FOUND") return res.status(404).json(out);
    return res.status(502).json(out);
  });

  app.post("/api/tools/http_request", async (req, res) => {
    const startedAtMs = Date.now();
    let input;
    try {
      input = normalizeHttpRequestProxyInput(req.body || {});
    } catch {
      return res.status(400).json(
        httpRequestFailure({
          code: "INVALID_ARGUMENTS",
          message: "Invalid http_request request",
          startedAtMs,
        }),
      );
    }

    const out = await executeHttpRequestProxy(input, startedAtMs);
    if (out.ok) return res.status(200).json(out);
    if (out.error?.code === "NETWORK_BLOCKED") return res.status(403).json(out);
    if (out.error?.code === "TIMEOUT") return res.status(504).json(out);
    if (out.error?.code === "INVALID_ARGUMENTS") return res.status(400).json(out);
    if (out.error?.code === "NOT_FOUND") return res.status(404).json(out);
    if (out.error?.code === "SIZE_LIMIT") return res.status(413).json(out);
    return res.status(502).json(out);
  });
}

module.exports = { registerToolsRoutes };
