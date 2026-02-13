const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

function readCodexAccessToken() {
  try {
    const p = path.join(os.homedir(), ".codex", "auth.json");
    const raw = fs.readFileSync(p, "utf8");
    const json = JSON.parse(raw);
    const tok = json?.tokens?.access_token;
    return typeof tok === "string" && tok.trim() ? tok.trim() : null;
  } catch {
    return null;
  }
}

function isLocalRequest(req) {
  const ip = req.ip || req.connection?.remoteAddress || "";
  // Express may report ::ffff:127.0.0.1
  return ip === "127.0.0.1" || ip === "::1" || ip.endsWith("::1") || ip.endsWith("127.0.0.1");
}

function clampBody(rawBody, maxBytes = 200_000) {
  const body = typeof rawBody === "string" ? rawBody : JSON.stringify(rawBody || {});
  if (Buffer.byteLength(body, "utf8") > maxBytes) {
    throw new Error("BODY_TOO_LARGE");
  }
  return body;
}

function proxyViaCodexCli(req, res) {
  if (!isLocalRequest(req)) {
    return res.status(403).json({ ok: false, error: "LOCALHOST_ONLY" });
  }

  const accessToken = readCodexAccessToken();
  if (!accessToken) {
    return res.status(400).json({ ok: false, error: "MISSING_CODEX_CLI_SESSION" });
  }

  let rawBody = "";
  try {
    rawBody = clampBody(req.rawBody || req.body);
  } catch (err) {
    const msg = err && typeof err.message === "string" ? err.message : "";
    if (msg === "BODY_TOO_LARGE") {
      return res.status(413).json({ ok: false, error: "BODY_TOO_LARGE" });
    }
    return res.status(400).json({ ok: false, error: "INVALID_BODY" });
  }

  const child = spawn(
    "codex",
    [
      "exec",
      "--json",
      // Run a minimal session that only emits JSONL on stdout.
      // We ask Codex to call the OpenAI-style endpoint, but use the Codex CLI session.
      // The actual provider plumbing happens inside the Codex CLI.
      //
      // IMPORTANT: We do not implement full OpenAI request translation here yet.
      // For v0, we only support chat.completions with a single user message.
      "-",
    ],
    {
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        // Ensure codex uses its normal auth/session.
        // Don't pass OPENAI_API_KEY.
        OPENAI_API_KEY: "",
      },
    },
  );

  let responded = false;
  function respondJson(status, body) {
    if (responded) return;
    responded = true;
    res.status(status).json(body);
  }

  function respondSse(lines) {
    if (responded) return;
    responded = true;
    res.status(200);
    res.setHeader("content-type", "text/event-stream; charset=utf-8");
    res.setHeader("cache-control", "no-cache");
    res.setHeader("connection", "keep-alive");
    res.flushHeaders?.();
    for (const line of lines) res.write(line);
    res.end();
  }

  child.on("error", (err) => {
    const code = typeof err?.code === "string" ? err.code : null;
    respondJson(502, { ok: false, error: "CODEX_CLI_SPAWN_FAILED", code });
  });

  let stderr = "";
  child.stderr.on("data", (d) => {
    stderr += d.toString("utf8");
  });

  // Parse the incoming OpenAI-style body to extract the user prompt.
  let prompt = "";
  let wantsStream = false;
  let model = "codex-cli";
  try {
    const body = JSON.parse(rawBody);
    wantsStream = body?.stream === true;
    if (typeof body?.model === "string" && body.model.trim()) {
      model = body.model.trim();
    }
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const firstUser = messages.find((m) => m && m.role === "user");
    const content = firstUser?.content;
    prompt = typeof content === "string" ? content : "";
  } catch {
    // ignore
  }

  // Feed prompt to codex via stdin.
  child.stdin.write(prompt || "");
  child.stdin.end();

  // Collect JSONL events.
  let out = "";
  child.stdout.on("data", (d) => {
    out += d.toString("utf8");
  });

  child.on("close", (code) => {
    if (responded) return;
    if (code !== 0) {
      return respondJson(502, { ok: false, error: "CODEX_CLI_FAILED", code, stderr: stderr.slice(-4000) });
    }

    // Find the final agent_message text.
    const lines = out.split(/\r?\n/).filter(Boolean);
    let text = "";
    for (const line of lines) {
      if (!line.startsWith("{")) continue;
      try {
        const evt = JSON.parse(line);
        if (evt?.type === "item.completed" && evt?.item?.type === "agent_message") {
          text = String(evt.item.text || "");
        }
      } catch {
        // ignore
      }
    }

    const id = `chatcmpl_codexcli_${Date.now()}`;
    const created = Math.floor(Date.now() / 1000);

    if (wantsStream) {
      const chunk1 = {
        id,
        object: "chat.completion.chunk",
        created,
        model,
        choices: [{ index: 0, delta: { role: "assistant", content: text }, finish_reason: null }],
      };
      const chunk2 = {
        id,
        object: "chat.completion.chunk",
        created,
        model,
        choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
      };
      return respondSse([
        `data: ${JSON.stringify(chunk1)}\n\n`,
        `data: ${JSON.stringify(chunk2)}\n\n`,
        "data: [DONE]\n\n",
      ]);
    }

    // Return an OpenAI-compatible non-streaming chat.completions response.
    return respondJson(200, {
      id,
      object: "chat.completion",
      created,
      model,
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: text },
          finish_reason: "stop",
        },
      ],
    });
  });
}

module.exports = { proxyViaCodexCli };
