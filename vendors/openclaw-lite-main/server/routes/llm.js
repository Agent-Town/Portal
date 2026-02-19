const { Readable } = require("stream");


function registerLlmRoutes(app) {
  // --- LLM proxy (OpenAI-compatible) ---
  //
  // OpenClaw Lite (browser) uses PI-AI providers which expect to call an OpenAI-style API.
  // Browsers can't reliably call vendor APIs directly (CORS) and we must keep a strict
  // networking allowlist, so we provide a same-origin proxy.
  //
  // Security:
  // - The server MUST NOT persist any user API keys.
  // - The proxy forwards bytes and streams responses.
  const llmTestStats = {
    chatCompletions: 0,
    responses: 0,
    lastPath: null,
  };
  let llmTestSeq = 0;

  function getReqHeader(req, name) {
    const v = req.header(name);
    return typeof v === "string" ? v : "";
  }

  function isHopByHopHeader(name) {
    const k = String(name || "").toLowerCase();
    return (
      k === "connection" ||
      k === "keep-alive" ||
      k === "proxy-authenticate" ||
      k === "proxy-authorization" ||
      k === "te" ||
      k === "trailer" ||
      k === "transfer-encoding" ||
      k === "upgrade"
    );
  }

  function respondSse(res, lines) {
    res.status(200);
    res.setHeader("content-type", "text/event-stream; charset=utf-8");
    res.setHeader("cache-control", "no-cache");
    res.setHeader("connection", "keep-alive");
    res.flushHeaders?.();
    for (const line of lines) res.write(line);
    res.end();
  }

  function textFromOpenAiMessageContent(content) {
    if (typeof content === "string") return content;
    if (!Array.isArray(content)) return "";
    return content
      .map((part) => {
        if (!part || typeof part !== "object") return "";
        if (typeof part.text === "string") return part.text;
        if (part.type === "text" && typeof part.text === "string") return part.text;
        return "";
      })
      .join("\n");
  }

  function lastUserPrompt(messages = []) {
    const rows = Array.isArray(messages) ? messages : [];
    for (let i = rows.length - 1; i >= 0; i -= 1) {
      const row = rows[i];
      if (String(row?.role || "").toLowerCase() !== "user") continue;
      return {
        index: i,
        text: textFromOpenAiMessageContent(row?.content || ""),
      };
    }
    return { index: -1, text: "" };
  }

  function hasToolResultAfter(messages = [], index = -1) {
    if (!Array.isArray(messages) || index < 0) return false;
    const after = messages.slice(index + 1);
    return after.some((row) => String(row?.role || "").toLowerCase() === "tool");
  }

  function buildToolCallChunks({ id, created, model, callId, toolName, args = {} }) {
    return [
      {
        id,
        object: "chat.completion.chunk",
        created,
        model,
        choices: [{
          index: 0,
          delta: {
            role: "assistant",
            tool_calls: [{
              index: 0,
              id: callId,
              type: "function",
              function: {
                name: String(toolName || "").trim(),
                arguments: JSON.stringify(args || {}),
              },
            }],
          },
          finish_reason: null,
        }],
      },
      {
        id,
        object: "chat.completion.chunk",
        created,
        model,
        choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }],
      },
    ];
  }

  function buildTextChunks({ id, created, model, text = "pi-ai ok" }) {
    return [
      {
        id,
        object: "chat.completion.chunk",
        created,
        model,
        choices: [{ index: 0, delta: { role: "assistant", content: String(text || "pi-ai ok") }, finish_reason: null }],
      },
      {
        id,
        object: "chat.completion.chunk",
        created,
        model,
        choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
      },
    ];
  }

  function handleTestOpenAiChatCompletions(req, res) {
    llmTestStats.chatCompletions += 1;
    llmTestStats.lastPath = "/api/llm/openai/v1/chat/completions";
    llmTestSeq += 1;
    const id = `chatcmpl_test_${llmTestSeq}`;
    const model = typeof req.body?.model === "string" && req.body.model.trim() ? req.body.model.trim() : "test-model";
    const created = Math.floor(Date.now() / 1000);
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const prompt = lastUserPrompt(messages);
    const userText = String(prompt.text || "").toLowerCase();
    const seenToolResult = hasToolResultAfter(messages, prompt.index);

    let chunks = null;
    if (!seenToolResult && userText.includes("publish the agent ceremony reveal payload")) {
      chunks = buildToolCallChunks({
        id,
        created,
        model,
        callId: `call_test_${llmTestSeq}`,
        toolName: "agent_town_ceremony_reveal",
      });
    } else if (!seenToolResult && userText.includes("publish the agent ceremony commit and reveal public key")) {
      chunks = buildToolCallChunks({
        id,
        created,
        model,
        callId: `call_test_${llmTestSeq}`,
        toolName: "agent_town_ceremony_commit",
      });
    } else {
      chunks = buildTextChunks({ id, created, model, text: "pi-ai ok" });
    }

    respondSse(
      res,
      chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).concat("data: [DONE]\n\n"),
    );
  }

  function handleTestOpenAiResponses(req, res) {
    llmTestStats.responses += 1;
    llmTestStats.lastPath = "/api/llm/openai/v1/responses";
    // For now we only need chat.completions for deterministic e2e.
    return res.status(501).json({ ok: false, error: "TEST_RESPONSES_NOT_IMPLEMENTED" });
  }

  async function proxyToOpenAI(req, res, upstreamPath) {
    const auth = getReqHeader(req, "authorization");
    if (!auth || !auth.toLowerCase().startsWith("bearer ")) {
      return res.status(400).json({ ok: false, error: "MISSING_OPENAI_API_KEY" });
    }

    const upstreamUrl = `https://api.openai.com/v1/${upstreamPath}`;
    const headers = {
      authorization: auth,
      "content-type": getReqHeader(req, "content-type") || "application/json",
      accept: getReqHeader(req, "accept") || "application/json",
    };
    for (const h of ["openai-beta", "x-initiator", "openai-intent", "copilot-vision-request"]) {
      const v = getReqHeader(req, h);
      if (v) headers[h] = v;
    }

    const body = typeof req.rawBody === "string" ? req.rawBody : JSON.stringify(req.body || {});
    let upstream;
    try {
      upstream = await fetch(upstreamUrl, { method: "POST", headers, body, redirect: "manual" });
    } catch {
      return res.status(502).json({ ok: false, error: "UPSTREAM_UNAVAILABLE" });
    }

    res.status(upstream.status);
    const ct = upstream.headers.get("content-type");
    if (ct) res.setHeader("content-type", ct);
    const cc = upstream.headers.get("cache-control");
    if (cc) res.setHeader("cache-control", cc);

    if (!upstream.body) {
      const text = await upstream.text().catch(() => "");
      res.send(text);
      return;
    }

    Readable.fromWeb(upstream.body).pipe(res);
  }

  function joinPath(basePath, tailPath) {
    const base = String(basePath || "").replace(/\/+$/, "");
    const tail = String(tailPath || "").replace(/^\/+/, "");
    if (!tail) return base || "/";
    if (!base) return `/${tail}`;
    return `${base}/${tail}`;
  }

  function resolveGenericUpstreamUrl(req) {
    const encodedBase = typeof req.params?.encodedBase === "string" ? req.params.encodedBase.trim() : "";
    if (!encodedBase) {
      throw new Error("INVALID_UPSTREAM_BASE");
    }
    let decodedBase = "";
    try {
      decodedBase = decodeURIComponent(encodedBase);
    } catch {
      throw new Error("INVALID_UPSTREAM_BASE");
    }
    if (!/^https?:\/\//i.test(decodedBase)) {
      throw new Error("INVALID_UPSTREAM_BASE");
    }

    let upstream;
    try {
      upstream = new URL(decodedBase);
    } catch {
      throw new Error("INVALID_UPSTREAM_BASE");
    }

    const tail = typeof req.params?.[0] === "string" ? req.params[0] : "";
    upstream.pathname = joinPath(upstream.pathname, tail);

    const q = req.originalUrl.indexOf("?");
    if (q >= 0) upstream.search = req.originalUrl.slice(q);
    return upstream.toString();
  }

  function buildForwardHeaders(req) {
    const out = {};
    for (const [rawName, rawValue] of Object.entries(req.headers || {})) {
      const name = String(rawName || "").toLowerCase();
      if (!name) continue;
      if (name === "host" || name === "content-length" || name === "cookie") continue;
      if (isHopByHopHeader(name)) continue;
      if (Array.isArray(rawValue)) {
        if (rawValue.length > 0) out[name] = rawValue.join(", ");
        continue;
      }
      if (typeof rawValue === "string") out[name] = rawValue;
    }
    return out;
  }

  async function proxyGeneric(req, res) {
    let upstreamUrl = "";
    try {
      upstreamUrl = resolveGenericUpstreamUrl(req);
    } catch (err) {
      const msg = err && typeof err.message === "string" ? err.message : "INVALID_UPSTREAM_BASE";
      return res.status(400).json({ ok: false, error: msg });
    }

    const method = String(req.method || "POST").toUpperCase();
    const headers = buildForwardHeaders(req);
    const body =
      method === "GET" || method === "HEAD"
        ? undefined
        : typeof req.rawBody === "string"
          ? req.rawBody
          : JSON.stringify(req.body || {});

    let upstream;
    try {
      upstream = await fetch(upstreamUrl, {
        method,
        headers,
        body,
        redirect: "manual",
      });
    } catch {
      return res.status(502).json({ ok: false, error: "UPSTREAM_UNAVAILABLE" });
    }

    res.status(upstream.status);
    for (const [name, value] of upstream.headers.entries()) {
      if (isHopByHopHeader(name)) continue;
      if (name === "content-length") continue;
      res.setHeader(name, value);
    }

    if (!upstream.body) {
      const text = await upstream.text().catch(() => "");
      res.send(text);
      return;
    }
    Readable.fromWeb(upstream.body).pipe(res);
  }

  app.post("/api/llm/openai/v1/chat/completions", async (req, res) => {
    if (process.env.NODE_ENV === "test") return handleTestOpenAiChatCompletions(req, res);
    return await proxyToOpenAI(req, res, "chat/completions");
  });

  app.post("/api/llm/openai/v1/responses", async (req, res) => {
    if (process.env.NODE_ENV === "test") return handleTestOpenAiResponses(req, res);
    return await proxyToOpenAI(req, res, "responses");
  });

  app.all("/api/llm/proxy/:encodedBase", async (req, res) => {
    return await proxyGeneric(req, res);
  });

  app.all("/api/llm/proxy/:encodedBase/*", async (req, res) => {
    return await proxyGeneric(req, res);
  });

  function getLlmStats() {
    return { ...llmTestStats };
  }

  function resetLlmStats() {
    llmTestStats.chatCompletions = 0;
    llmTestStats.responses = 0;
    llmTestStats.lastPath = null;
  }

  return { getLlmStats, resetLlmStats };
}

module.exports = { registerLlmRoutes };
