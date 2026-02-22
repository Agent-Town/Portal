(function initSkillActionsPlugin(globalScope) {
  const PLUGIN_VERSION = "skill-actions-plugin-v1";
  const EXPLICIT_BLOCK_RE = /```skill-actions-v1\s*([\s\S]*?)```/i;
  const HTTP_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"]);
  const DEFAULT_TTL_MS = 120000;
  const DEFAULT_MAX_BODY_BYTES = 65536;
  const MAX_QUICKREF_LINES = 8;

  function toObject(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return value;
  }

  function deepClone(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return null;
    }
  }

  function safeJsonParse(raw, fallback = null) {
    try {
      return JSON.parse(String(raw || ""));
    } catch {
      return fallback;
    }
  }

  function normalizeMethod(value) {
    const method = String(value || "GET").trim().toUpperCase();
    return HTTP_METHODS.has(method) ? method : "GET";
  }

  function normalizeActionId(value, fallback = "action") {
    const raw = String(value || "").trim().toLowerCase();
    const normalized = raw
      .replace(/[^a-z0-9._-]+/g, ".")
      .replace(/\.+/g, ".")
      .replace(/^\./, "")
      .replace(/\.$/, "");
    return normalized || fallback;
  }

  function normalizeActionTitle(value, fallbackId) {
    const raw = String(value || "").trim();
    if (raw) return raw;
    const parts = String(fallbackId || "action")
      .split(".")
      .filter(Boolean);
    if (!parts.length) return "Skill action";
    return parts.map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`).join(" ");
  }

  function normalizeActionDescription(value, method, urlTemplate) {
    const raw = String(value || "").trim();
    if (raw) return raw;
    return `${method} ${urlTemplate}`;
  }

  function extractTemplateParams(templateValue, paramNames) {
    if (typeof templateValue === "string") {
      const matcher = /\{([A-Za-z0-9_]+)\}/g;
      let match = null;
      while ((match = matcher.exec(templateValue)) !== null) {
        paramNames.add(String(match[1] || "").trim());
      }
      return;
    }
    if (Array.isArray(templateValue)) {
      for (const entry of templateValue) {
        extractTemplateParams(entry, paramNames);
      }
      return;
    }
    if (!templateValue || typeof templateValue !== "object") return;
    for (const value of Object.values(templateValue)) {
      extractTemplateParams(value, paramNames);
    }
  }

  function normalizeParamRow(raw, inferredNames) {
    const row = toObject(raw);
    const name = String(row.name || "").trim();
    if (!name) return null;
    inferredNames.delete(name);
    return {
      name,
      type: String(row.type || "string").trim() || "string",
      required: row.required !== false,
      source: String(row.source || "").trim() || null,
      min: Number.isFinite(Number(row.min)) ? Number(row.min) : null,
      max: Number.isFinite(Number(row.max)) ? Number(row.max) : null,
      default: row.default === undefined ? null : deepClone(row.default),
    };
  }

  function normalizeJsonRule(raw) {
    const row = toObject(raw);
    const path = String(row.path || "").trim();
    if (!path) return null;
    const normalized = { path };
    if (Object.prototype.hasOwnProperty.call(row, "equals")) {
      normalized.equals = deepClone(row.equals);
    }
    if (typeof row.type === "string" && row.type.trim()) {
      normalized.type = row.type.trim();
    }
    if (row.nonEmpty === true) {
      normalized.nonEmpty = true;
    }
    return normalized;
  }

  function normalizeSecurity(raw, method) {
    const source = toObject(raw);
    const allowMethodsRaw = Array.isArray(source.allowMethods) ? source.allowMethods : [method];
    const allowMethods = Array.from(new Set(allowMethodsRaw.map((entry) => normalizeMethod(entry))));
    return {
      sameOriginOnly: source.sameOriginOnly !== false,
      allowMethods: allowMethods.length ? allowMethods : [method],
      maxBodyBytes: Number.isFinite(Number(source.maxBodyBytes))
        ? Math.max(0, Math.floor(Number(source.maxBodyBytes)))
        : DEFAULT_MAX_BODY_BYTES,
    };
  }

  function normalizeEvidence(raw, actionId) {
    const source = toObject(raw);
    const producesRaw = Array.isArray(source.produces) ? source.produces : [];
    const produces = producesRaw
      .map((entry) => String(entry || "").trim())
      .filter(Boolean);
    return {
      produces: produces.length ? produces : [`${actionId}.ok`],
      ttlMs: Number.isFinite(Number(source.ttlMs)) ? Math.max(0, Math.floor(Number(source.ttlMs))) : DEFAULT_TTL_MS,
    };
  }

  function normalizeClaim(raw) {
    const source = toObject(raw);
    const requiredFor = Array.isArray(source.requiredFor)
      ? source.requiredFor.map((entry) => String(entry || "").trim()).filter(Boolean)
      : [];
    if (!requiredFor.length) return null;
    return { requiredFor };
  }

  function normalizeSuccess(raw, sourceText) {
    const source = toObject(raw);
    const jsonRules = Array.isArray(source.jsonRules)
      ? source.jsonRules.map(normalizeJsonRule).filter(Boolean)
      : [];
    const explicitHttpStatus = String(source.httpStatus || "").trim();
    const inferredHasOk = /ok\s*:\s*true/i.test(String(sourceText || ""));
    if (!jsonRules.length && inferredHasOk) {
      jsonRules.push({ path: "ok", equals: true });
    }
    return {
      httpStatus: explicitHttpStatus || "2xx",
      jsonRules,
    };
  }

  function normalizeExplicitAction(rawAction, index, sourceText) {
    const source = toObject(rawAction);
    const request = toObject(source.request);
    const method = normalizeMethod(request.method || source.method || "GET");
    const urlTemplate = String(request.urlTemplate || request.url || source.urlTemplate || source.url || "").trim();
    if (!urlTemplate) return null;
    const fallbackId = `action.${index + 1}`;
    const id = normalizeActionId(source.id, fallbackId);
    const title = normalizeActionTitle(source.title, id);
    const description = normalizeActionDescription(source.description, method, urlTemplate);

    const paramNames = new Set();
    extractTemplateParams(urlTemplate, paramNames);
    extractTemplateParams(request.headersTemplate, paramNames);
    extractTemplateParams(request.bodyTemplate, paramNames);

    const params = [];
    const sourceParams = Array.isArray(source.params) ? source.params : [];
    for (const rawParam of sourceParams) {
      const normalized = normalizeParamRow(rawParam, paramNames);
      if (!normalized) continue;
      params.push(normalized);
    }
    for (const name of paramNames) {
      params.push({
        name,
        type: "string",
        required: true,
        source: null,
        min: null,
        max: null,
        default: null,
      });
    }

    return {
      id,
      title,
      description,
      source: "explicit",
      confidence: 1,
      request: {
        method,
        urlTemplate,
        headersTemplate: deepClone(request.headersTemplate) || {},
        bodyTemplate: request.bodyTemplate === undefined ? null : deepClone(request.bodyTemplate),
      },
      params,
      success: normalizeSuccess(source.success, sourceText),
      evidence: normalizeEvidence(source.evidence, id),
      claim: normalizeClaim(source.claim),
      security: normalizeSecurity(source.security, method),
    };
  }

  function sanitizeUrlTemplate(value) {
    return String(value || "")
      .trim()
      .replace(/[),.;]+$/, "");
  }

  function escapeRegexLiteral(value) {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function templateKnownQueryParams(urlTemplate, params) {
    let out = sanitizeUrlTemplate(urlTemplate);
    if (!out || out.indexOf("?") < 0) return out;
    const rows = Array.isArray(params) ? params : [];
    for (const row of rows) {
      const name = String(row?.name || "").trim();
      if (!name || name === "origin") continue;
      if (out.includes(`{${name}}`)) continue;
      const matcher = new RegExp(`([?&])${escapeRegexLiteral(name)}=[^&#\\s]*`, "i");
      out = out.replace(matcher, `$1${name}={${name}}`);
    }
    return out;
  }

  function splitPathSegments(urlTemplate) {
    let raw = String(urlTemplate || "").trim();
    raw = raw.replace(/^\{origin\}/i, "");
    try {
      const parsed = new URL(raw, "http://localhost");
      raw = parsed.pathname || "/";
    } catch {
      // Keep as-is.
    }
    return raw
      .split("?")[0]
      .split("/")
      .map((segment) => segment.trim())
      .filter(Boolean);
  }

  function inferActionId(method, urlTemplate, fallbackIndex) {
    const segments = splitPathSegments(urlTemplate);
    const joined = segments.join("/");
    if (/\/canvas\/paint$/i.test(joined)) return "canvas.paint";
    if (/\/canvas\/image$/i.test(joined)) return "canvas.image";
    if (/\/agent\/connect$/i.test(joined)) return "agent.connect";
    if (/\/agent\/state$/i.test(joined)) return "agent.state";
    if (/\/agent\/select$/i.test(joined)) return "agent.select";
    if (/\/agent\/open\/press$/i.test(joined)) return "agent.open.press";
    if (/\/agent\/house\/commit$/i.test(joined)) return "house.commit";
    if (/\/agent\/house\/reveal$/i.test(joined)) return "house.reveal";

    const tail = segments.slice(-2).join(".") || `action.${fallbackIndex + 1}`;
    if (!tail) return `action.${fallbackIndex + 1}`;
    return normalizeActionId(tail, `action.${fallbackIndex + 1}`);
  }

  function inferHeuristicParams(method, urlTemplate) {
    const params = [];
    const addParam = (name, type = "string", required = true, opts = {}) => {
      if (!name || params.some((param) => param.name === name)) return;
      params.push({
        name,
        type,
        required,
        source: opts.source || null,
        min: Number.isFinite(Number(opts.min)) ? Number(opts.min) : null,
        max: Number.isFinite(Number(opts.max)) ? Number(opts.max) : null,
        default: opts.default === undefined ? null : deepClone(opts.default),
      });
    };

    const methodNorm = normalizeMethod(method);
    const pathSegments = splitPathSegments(urlTemplate).join("/");
    if (/\/canvas\/paint$/i.test(pathSegments)) {
      addParam("teamCode", "string", true, { source: "runtime.teamCode" });
      addParam("x", "integer", true, { min: 0, max: 15 });
      addParam("y", "integer", true, { min: 0, max: 15 });
      addParam("color", "integer", true, { min: 0, max: 15 });
      return params;
    }
    if (/\/canvas\/image$/i.test(pathSegments)) {
      addParam("teamCode", "string", true, { source: "runtime.teamCode" });
      return params;
    }
    if (/\/agent\/connect$/i.test(pathSegments)) {
      addParam("teamCode", "string", true, { source: "runtime.teamCode" });
      addParam("agentName", "string", false, { default: "OpenClaw" });
      return params;
    }
    if (/\/agent\/state$/i.test(pathSegments)) {
      addParam("teamCode", "string", true, { source: "runtime.teamCode" });
      return params;
    }
    if (/\/agent\/select$/i.test(pathSegments)) {
      addParam("teamCode", "string", true, { source: "runtime.teamCode" });
      addParam("elementId", "string", true);
      return params;
    }
    if (/\/agent\/open\/press$/i.test(pathSegments)) {
      addParam("teamCode", "string", true, { source: "runtime.teamCode" });
      return params;
    }
    if (/\/agent\/house\/commit$/i.test(pathSegments)) {
      addParam("teamCode", "string", true, { source: "runtime.teamCode" });
      addParam("commit", "string", true);
      addParam("revealPub", "string", true);
      return params;
    }
    if (/\/agent\/house\/reveal$/i.test(pathSegments)) {
      addParam("teamCode", "string", true, { source: "runtime.teamCode" });
      addParam("sealedForHuman", "object", true);
      return params;
    }
    if (methodNorm === "POST" || methodNorm === "PUT" || methodNorm === "PATCH") {
      addParam("teamCode", "string", false, { source: "runtime.teamCode" });
    }
    return params;
  }

  function inferBodyTemplate(params) {
    const out = {};
    for (const param of params) {
      const name = String(param?.name || "").trim();
      if (!name || name === "origin") continue;
      if (name === "teamCode" || name === "x" || name === "y" || name === "color" || name === "elementId") {
        out[name] = `{${name}}`;
      }
    }
    return Object.keys(out).length ? out : null;
  }

  function inferActionsFromMarkdown(skillText) {
    const content = String(skillText || "");
    const candidates = [];
    const seen = new Set();

    const addCandidate = (method, urlTemplate) => {
      const url = sanitizeUrlTemplate(urlTemplate);
      if (!url) return;
      const key = `${normalizeMethod(method)} ${url}`;
      if (seen.has(key)) return;
      seen.add(key);
      candidates.push({ method: normalizeMethod(method), urlTemplate: url });
    };

    const inlineCodeRe = /`(GET|POST|PUT|PATCH|DELETE|HEAD)\s+([^`\n]+?)`/gi;
    let match = null;
    while ((match = inlineCodeRe.exec(content)) !== null) {
      addCandidate(match[1], match[2]);
    }

    const lineRe = /(?:^|\s)(GET|POST|PUT|PATCH|DELETE|HEAD)\s+((?:\{origin\})?\/[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=%{}-]+)/gim;
    while ((match = lineRe.exec(content)) !== null) {
      addCandidate(match[1], match[2]);
    }

    const actions = [];
    for (let i = 0; i < candidates.length; i += 1) {
      const candidate = candidates[i];
      const method = normalizeMethod(candidate.method);
      const rawUrlTemplate = sanitizeUrlTemplate(candidate.urlTemplate);
      const params = inferHeuristicParams(method, rawUrlTemplate);
      const urlTemplate = templateKnownQueryParams(rawUrlTemplate, params);
      if (!urlTemplate) continue;
      const id = inferActionId(method, urlTemplate, i);
      const requestBodyTemplate = method === "POST" || method === "PUT" || method === "PATCH"
        ? inferBodyTemplate(params)
        : null;
      const jsonRules = /ok\s*:\s*true/i.test(content) ? [{ path: "ok", equals: true }] : [];
      const claim = /\/canvas\/image/i.test(urlTemplate)
        ? { requiredFor: ["canvas.draw.complete"] }
        : null;
      const action = {
        id: normalizeActionId(id, `action.${i + 1}`),
        title: normalizeActionTitle("", id),
        description: normalizeActionDescription("", method, urlTemplate),
        source: "inferred",
        confidence: 0.6,
        request: {
          method,
          urlTemplate,
          headersTemplate: {},
          bodyTemplate: requestBodyTemplate,
        },
        params,
        success: {
          httpStatus: "2xx",
          jsonRules,
        },
        evidence: normalizeEvidence({}, normalizeActionId(id, `action.${i + 1}`)),
        claim,
        security: normalizeSecurity({}, method),
      };
      actions.push(action);
    }
    return actions;
  }

  function compileSkillActions(skillText, options = {}) {
    const text = String(skillText || "");
    const explicitMatch = EXPLICIT_BLOCK_RE.exec(text);
    const errors = [];
    const explicitActions = [];
    let explicitParseOk = false;

    if (explicitMatch && explicitMatch[1]) {
      const parsedBlock = safeJsonParse(explicitMatch[1], null);
      if (parsedBlock && typeof parsedBlock === "object") {
        const rawActions = Array.isArray(parsedBlock.actions) ? parsedBlock.actions : [];
        for (let i = 0; i < rawActions.length; i += 1) {
          const normalized = normalizeExplicitAction(rawActions[i], i, text);
          if (!normalized) continue;
          explicitActions.push(normalized);
        }
        explicitParseOk = true;
      } else {
        errors.push({
          code: "PARSE_INVALID",
          message: "Invalid skill-actions-v1 JSON block",
        });
      }
    }

    let inferredActions = [];
    if (!explicitActions.length) {
      inferredActions = inferActionsFromMarkdown(text);
    }

    const allActions = explicitActions.length ? explicitActions : inferredActions;
    const byId = new Map();
    for (let i = 0; i < allActions.length; i += 1) {
      const row = allActions[i];
      const baseId = normalizeActionId(row.id, `action.${i + 1}`);
      let actionId = baseId;
      let suffix = 2;
      while (byId.has(actionId)) {
        actionId = `${baseId}.${suffix}`;
        suffix += 1;
      }
      byId.set(actionId, { ...row, id: actionId });
    }

    const source = explicitActions.length
      ? "explicit"
      : inferredActions.length
        ? "inferred"
        : "none";
    const requestedSource = String(options?.source || "").trim().toLowerCase();
    const parserSource = requestedSource || source;

    return {
      ok: true,
      parserVersion: PLUGIN_VERSION,
      source: parserSource,
      explicitParseOk,
      actions: Array.from(byId.values()),
      errors,
    };
  }

  function getByPath(root, path) {
    if (!path) return undefined;
    const parts = String(path || "").split(".");
    let current = root;
    for (const part of parts) {
      if (!part) continue;
      if (!current || typeof current !== "object" || !Object.prototype.hasOwnProperty.call(current, part)) {
        return undefined;
      }
      current = current[part];
    }
    return current;
  }

  function evaluateJsonRule(rule, bodyJson) {
    const row = toObject(rule);
    const path = String(row.path || "").trim();
    if (!path) return { ok: true, reason: "" };
    const value = getByPath(bodyJson, path);
    if (Object.prototype.hasOwnProperty.call(row, "equals")) {
      const expected = row.equals;
      const ok = JSON.stringify(value) === JSON.stringify(expected);
      return {
        ok,
        reason: ok ? "" : `path ${path} expected ${JSON.stringify(expected)} got ${JSON.stringify(value)}`,
      };
    }
    if (typeof row.type === "string" && row.type.trim()) {
      const expectedType = row.type.trim().toLowerCase();
      const actualType = Array.isArray(value) ? "array" : value === null ? "null" : typeof value;
      if (actualType !== expectedType) {
        return {
          ok: false,
          reason: `path ${path} expected type ${expectedType} got ${actualType}`,
        };
      }
    }
    if (row.nonEmpty === true) {
      if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) {
        return {
          ok: false,
          reason: `path ${path} expected non-empty value`,
        };
      }
    }
    return { ok: true, reason: "" };
  }

  function resolveRuntimeContext(runtimeContext) {
    const source = toObject(runtimeContext);
    const originRaw = String(source.origin || "").trim();
    const origin = originRaw || (typeof window !== "undefined" && window.location ? window.location.origin : "");
    return {
      origin,
      teamCode: String(source.teamCode || "").trim() || null,
      houseId: String(source.houseId || "").trim() || null,
    };
  }

  function applyTemplateString(input, values) {
    return String(input || "").replace(/\{([A-Za-z0-9_]+)\}/g, (_full, name) => {
      if (!Object.prototype.hasOwnProperty.call(values, name)) return "";
      const value = values[name];
      if (value == null) return "";
      if (typeof value === "object") return JSON.stringify(value);
      return String(value);
    });
  }

  function applyTemplateValue(input, values) {
    if (typeof input === "string") {
      return applyTemplateString(input, values);
    }
    if (Array.isArray(input)) {
      return input.map((entry) => applyTemplateValue(entry, values));
    }
    if (!input || typeof input !== "object") {
      return input;
    }
    const out = {};
    for (const [key, value] of Object.entries(input)) {
      out[key] = applyTemplateValue(value, values);
    }
    return out;
  }

  function estimateBodyBytes(body) {
    if (body == null) return 0;
    if (typeof body === "string") return new TextEncoder().encode(body).length;
    if (typeof body === "object") {
      try {
        return new TextEncoder().encode(JSON.stringify(body)).length;
      } catch {
        return 0;
      }
    }
    return new TextEncoder().encode(String(body)).length;
  }

  function normalizeUrlForMatch(urlValue, originHint) {
    try {
      const parsed = new URL(String(urlValue || ""), String(originHint || "http://localhost"));
      return {
        href: parsed.href,
        origin: parsed.origin,
        pathname: parsed.pathname,
      };
    } catch {
      return {
        href: String(urlValue || ""),
        origin: "",
        pathname: String(urlValue || ""),
      };
    }
  }

  function actionTemplatePathPattern(action, originHint) {
    const request = toObject(action?.request);
    const urlTemplate = String(request.urlTemplate || "").trim();
    const normalized = normalizeUrlForMatch(applyTemplateString(urlTemplate, { origin: originHint || "" }), originHint);
    const escaped = normalized.pathname.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = escaped.replace(/\\\{[A-Za-z0-9_]+\\\}/g, "[^/]+");
    return new RegExp(`^${pattern}$`, "i");
  }

  function resolveActionParams(action, runtimeContext, inputParams) {
    const runtime = resolveRuntimeContext(runtimeContext);
    const provided = toObject(inputParams);
    const values = {
      origin: runtime.origin || "",
      teamCode: runtime.teamCode,
      houseId: runtime.houseId,
    };

    const missing = [];
    const params = Array.isArray(action?.params) ? action.params : [];
    for (const rowRaw of params) {
      const row = toObject(rowRaw);
      const name = String(row.name || "").trim();
      if (!name) continue;
      const source = String(row.source || "").trim().toLowerCase();
      let value;
      if (Object.prototype.hasOwnProperty.call(provided, name)) {
        value = provided[name];
      } else if (source === "runtime.teamcode") {
        value = runtime.teamCode;
      } else if (source === "runtime.houseid") {
        value = runtime.houseId;
      } else if (source === "runtime.origin") {
        value = runtime.origin;
      } else if (row.default !== undefined && row.default !== null) {
        value = deepClone(row.default);
      } else {
        value = values[name];
      }
      if ((value === undefined || value === null || value === "") && row.required !== false) {
        missing.push(name);
      }
      values[name] = value;
    }

    return { values, missing };
  }

  async function invokeSkillAction({
    action,
    runtimeContext = {},
    params = {},
    httpRequest,
    timeoutMs = 30000,
  } = {}) {
    const normalizedAction = toObject(action);
    const actionId = String(normalizedAction.id || "").trim();
    if (!actionId) {
      return {
        ok: false,
        code: "INVALID_ARGUMENTS",
        message: "Missing action id",
      };
    }
    if (typeof httpRequest !== "function") {
      return {
        ok: false,
        code: "UNSUPPORTED",
        message: "httpRequest callback is required",
      };
    }

    const runtime = resolveRuntimeContext(runtimeContext);
    const requestConfig = toObject(normalizedAction.request);
    const security = toObject(normalizedAction.security);
    const { values, missing } = resolveActionParams(normalizedAction, runtime, params);
    if (missing.length > 0) {
      return {
        ok: false,
        code: "PARAM_UNRESOLVED",
        message: `Missing required params: ${missing.join(", ")}`,
        actionId,
        missing,
      };
    }

    const method = normalizeMethod(requestConfig.method || "GET");
    const url = applyTemplateString(requestConfig.urlTemplate || "", values);
    const headers = applyTemplateValue(requestConfig.headersTemplate || {}, values);
    const body = requestConfig.bodyTemplate == null ? null : applyTemplateValue(requestConfig.bodyTemplate, values);
    const maxBodyBytes = Number.isFinite(Number(security.maxBodyBytes))
      ? Math.max(0, Math.floor(Number(security.maxBodyBytes)))
      : DEFAULT_MAX_BODY_BYTES;

    const allowMethods = Array.isArray(security.allowMethods)
      ? security.allowMethods.map(normalizeMethod)
      : [method];
    if (!allowMethods.includes(method)) {
      return {
        ok: false,
        code: "METHOD_NOT_ALLOWED",
        message: `Method ${method} is not allowed for action ${actionId}`,
        actionId,
      };
    }

    const normalizedRequestUrl = normalizeUrlForMatch(url, runtime.origin);
    const sameOriginOnly = security.sameOriginOnly !== false;
    if (sameOriginOnly && runtime.origin && normalizedRequestUrl.origin !== runtime.origin) {
      return {
        ok: false,
        code: "ORIGIN_BLOCKED",
        message: `Blocked cross-origin action: ${normalizedRequestUrl.origin}`,
        actionId,
      };
    }

    const bodyBytes = estimateBodyBytes(body);
    if (maxBodyBytes > 0 && bodyBytes > maxBodyBytes) {
      return {
        ok: false,
        code: "SIZE_LIMIT",
        message: `Action body exceeds ${maxBodyBytes} bytes`,
        actionId,
      };
    }

    let responseEnvelope;
    try {
      responseEnvelope = await httpRequest({
        method,
        url: normalizedRequestUrl.href,
        headers,
        body,
        timeoutMs,
      });
    } catch (err) {
      return {
        ok: false,
        code: "UNSUPPORTED",
        message: String(err?.message || err || "Action invocation failed"),
        actionId,
      };
    }

    const envelope = toObject(responseEnvelope);
    if (envelope.ok !== true) {
      const error = toObject(envelope.error);
      return {
        ok: false,
        code: String(error.code || "UNSUPPORTED"),
        message: String(error.message || "Action request failed"),
        actionId,
        request: {
          method,
          url: normalizedRequestUrl.href,
          headers,
          body,
        },
        response: envelope,
      };
    }

    const responseData = toObject(envelope.data);
    const status = Number(responseData.status || 0);
    const successConfig = toObject(normalizedAction.success);
    const statusOk = status >= 200 && status < 300;
    const jsonRules = Array.isArray(successConfig.jsonRules) ? successConfig.jsonRules : [];
    const ruleFailures = [];
    for (const rule of jsonRules) {
      const result = evaluateJsonRule(rule, responseData.bodyJson);
      if (!result.ok) {
        ruleFailures.push(result.reason);
      }
    }
    const jsonRulesOk = ruleFailures.length === 0;
    if (!statusOk || !jsonRulesOk) {
      return {
        ok: false,
        code: "SUCCESS_RULE_FAILED",
        message: statusOk ? `JSON rules failed (${ruleFailures.join("; ")})` : `HTTP status ${status} failed success criteria`,
        actionId,
        request: {
          method,
          url: normalizedRequestUrl.href,
          headers,
          body,
        },
        response: envelope,
        validation: {
          statusOk,
          jsonRulesOk,
          ruleFailures,
        },
      };
    }

    const evidenceConfig = normalizeEvidence(normalizedAction.evidence, actionId);
    const atMs = Date.now();
    const evidence = evidenceConfig.produces.map((evidenceKey) => ({
      evidenceKey,
      actionId,
      ok: true,
      atMs,
      ttlMs: evidenceConfig.ttlMs,
      summary: {
        status,
      },
    }));

    return {
      ok: true,
      actionId,
      request: {
        method,
        url: normalizedRequestUrl.href,
        headers,
        body,
      },
      response: envelope,
      validation: {
        statusOk: true,
        jsonRulesOk: true,
        ruleFailures: [],
      },
      evidence,
    };
  }

  function tokenize(text) {
    return String(text || "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .map((token) => token.trim())
      .filter(Boolean);
  }

  function rankActionsByQuery(actions, query, limit = 5) {
    const tokens = tokenize(query);
    const scored = [];
    for (const action of Array.isArray(actions) ? actions : []) {
      const haystack = `${action?.id || ""} ${action?.title || ""} ${action?.description || ""}`.toLowerCase();
      let score = 0;
      for (const token of tokens) {
        if (haystack.includes(token)) score += 1;
      }
      scored.push({
        action,
        score,
      });
    }
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return String(a.action?.id || "").localeCompare(String(b.action?.id || ""));
    });
    const max = Math.max(1, Math.min(MAX_QUICKREF_LINES, Math.floor(Number(limit) || 5)));
    return scored.slice(0, max).map((row) => row.action);
  }

  function buildActionQuickRef(actions, query, limit = 5) {
    const ranked = rankActionsByQuery(actions, query, limit);
    if (!ranked.length) return "";
    const lines = ["Skill Action Quickref (plugin-generated):"];
    for (const action of ranked) {
      const request = toObject(action?.request);
      const method = normalizeMethod(request.method || "GET");
      const urlTemplate = String(request.urlTemplate || "").trim();
      lines.push(`- skill_action.${action.id}: ${method} ${urlTemplate}`);
    }
    return lines.join("\n");
  }

  function parseToolResultEnvelope(message) {
    const content = Array.isArray(message?.content) ? message.content : [];
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      if (typeof part.text !== "string" || !part.text.trim()) continue;
      const parsed = safeJsonParse(part.text, null);
      if (parsed && typeof parsed === "object") return parsed;
    }
    return null;
  }

  function summarizeTranscriptUsage(messages, actions, runtimeContext = {}) {
    const runtime = resolveRuntimeContext(runtimeContext);
    const actionRows = Array.isArray(actions) ? actions : [];
    const actionById = new Map(actionRows.map((row) => [String(row.id || ""), row]));
    const usageByAction = new Map();
    for (const action of actionRows) {
      usageByAction.set(action.id, {
        actionId: action.id,
        invocations: 0,
        successes: 0,
        failures: 0,
        lastStatus: null,
      });
    }

    const toolCallsById = new Map();
    let httpRequestCalls = 0;
    let httpRequestMatched = 0;
    let missingResults = 0;
    for (const message of Array.isArray(messages) ? messages : []) {
      if (!message || typeof message !== "object") continue;
      if (message.role === "assistant" && Array.isArray(message.content)) {
        for (const part of message.content) {
          if (!part || typeof part !== "object") continue;
          if (part.type !== "toolCall") continue;
          const toolCallId = String(part.id || "").trim();
          if (!toolCallId) continue;
          toolCallsById.set(toolCallId, {
            name: String(part.name || "").trim(),
            args: toObject(part.arguments),
          });
        }
      }
    }

    for (const [toolCallId, call] of toolCallsById.entries()) {
      if (String(call.name || "") !== "http_request") continue;
      httpRequestCalls += 1;
      const method = normalizeMethod(call.args.method || "GET");
      const url = String(call.args.url || "").trim();
      const pathInfo = normalizeUrlForMatch(url, runtime.origin);
      let matchedAction = null;
      for (const action of actionRows) {
        const actionMethod = normalizeMethod(action?.request?.method || "GET");
        if (actionMethod !== method) continue;
        const pattern = actionTemplatePathPattern(action, runtime.origin);
        if (!pattern.test(pathInfo.pathname)) continue;
        matchedAction = action;
        break;
      }
      if (!matchedAction) continue;
      httpRequestMatched += 1;
      const row = usageByAction.get(matchedAction.id);
      if (!row) continue;
      row.invocations += 1;

      const toolResult = (Array.isArray(messages) ? messages : []).find((message) => {
        if (!message || typeof message !== "object") return false;
        if (message.role !== "toolResult") return false;
        const id = String(message.toolCallId || message.toolUseId || "").trim();
        return id === toolCallId;
      });
      if (!toolResult) {
        missingResults += 1;
        row.lastStatus = "TOOL_CALL_MISSING_RESULT";
        row.failures += 1;
        continue;
      }
      const parsedEnvelope = parseToolResultEnvelope(toolResult);
      const ok = parsedEnvelope && parsedEnvelope.ok === true;
      if (ok) {
        row.successes += 1;
        row.lastStatus = "ok";
      } else {
        row.failures += 1;
        row.lastStatus = String(parsedEnvelope?.error?.code || "UNSUPPORTED");
      }
    }

    const byAction = Array.from(usageByAction.values()).sort((a, b) => String(a.actionId).localeCompare(String(b.actionId)));
    const notUsedActions = byAction.filter((row) => row.invocations === 0).map((row) => row.actionId);
    const reasonCodes = [];
    if (actionRows.length === 0) {
      reasonCodes.push("NOT_EXTRACTED");
    } else if (httpRequestCalls === 0) {
      reasonCodes.push("MODEL_CHOICE");
    } else if (notUsedActions.length > 0) {
      reasonCodes.push("MODEL_CHOICE");
    }
    if (missingResults > 0) {
      reasonCodes.push("TOOL_CALL_MISSING_RESULT");
    }

    return {
      parserVersion: PLUGIN_VERSION,
      actionCount: actionRows.length,
      httpRequestCalls,
      httpRequestMatched,
      missingResults,
      byAction,
      notUsedActions,
      reasonCodes: Array.from(new Set(reasonCodes)),
    };
  }

  const api = {
    version: PLUGIN_VERSION,
    compileSkillActions,
    invokeSkillAction,
    rankActionsByQuery,
    buildActionQuickRef,
    summarizeTranscriptUsage,
    normalizeMethod,
    normalizeActionId,
  };

  globalScope.AgentTownSkillActionsPlugin = api;
})(window);
