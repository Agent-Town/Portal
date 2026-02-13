const path = require("path");
const express = require("express");

const { nowIso } = require("./util");
const { createSessionManager } = require("./session");
const { registerToolsRoutes } = require("./routes/tools");
const { registerLlmRoutes } = require("./routes/llm");
const { registerHouseRoutes } = require("./routes/house");
const { registerTestOnlyRoutes } = require("./routes/test_only");

function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(
    express.json({
      limit: "3mb",
      verify: (req, _res, buf) => {
        req.rawBody = buf.toString("utf8");
      },
    }),
  );

  app.use((err, req, res, next) => {
    if (err && err.type === "entity.parse.failed") {
      const size = req.rawBody ? req.rawBody.length : 0;
      console.warn(`[bad-json] ${req.method} ${req.originalUrl} (${size} bytes)`);
      return res.status(400).json({ ok: false, error: "INVALID_JSON" });
    }
    return next(err);
  });

  const PUBLIC_DIR = path.join(process.cwd(), "public");
  const isProd = process.env.NODE_ENV === "production";

  function setSecurityHeaders(req, res, next) {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "geolocation=(), camera=(), microphone=()");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    res.setHeader("X-Frame-Options", "DENY");

    const connectSrc = ["'self'"];
    const csp = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      `connect-src ${connectSrc.join(" ")}`,
      "object-src 'none'",
      "base-uri 'none'",
      "frame-ancestors 'none'",
    ].join("; ");
    res.setHeader("Content-Security-Policy", csp);

    if (isProd) {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }

    if (isProd && !req.secure) {
      const host = req.get("host");
      if (host) return res.redirect(301, `https://${host}${req.originalUrl}`);
    }

    return next();
  }

  app.use(setSecurityHeaders);

  const sessionManager = createSessionManager();

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, time: nowIso() });
  });

  // Runtime feature flags/capabilities (minimal; used by the Gateway UI).
  app.get("/api/runtime/capabilities", (_req, res) => {
    res.json({
      ok: true,
      llm: {
        codexCli: process.env.OPENCLAW_LITE_CODEX_CLI === "1",
      },
    });
  });

  registerToolsRoutes(app);
  const llmRuntime = registerLlmRoutes(app);
  registerHouseRoutes(app, { ensureSession: sessionManager.ensureSession });
  registerTestOnlyRoutes(app, {
    resetAllSessions: sessionManager.resetAllSessions,
    getLlmStats: llmRuntime.getLlmStats,
    resetLlmStats: llmRuntime.resetLlmStats,
  });

  // Unknown API routes should not redirect.
  app.use("/api", (_req, res) => {
    res.status(404).json({ ok: false, error: "NOT_FOUND" });
  });

  // --- Static + routes ---
  app.use(
    express.static(PUBLIC_DIR, {
      etag: true,
      maxAge: isProd ? "1h" : 0,
      setHeaders: (res) => {
        if (!isProd) res.setHeader("Cache-Control", "no-store");
      },
    }),
  );

  app.get("/", (_req, res) => res.redirect(302, "/lite"));
  app.get("/lite", (_req, res) => res.sendFile(path.join(PUBLIC_DIR, "lite.html")));
  app.get("/town", (_req, res) => res.sendFile(path.join(PUBLIC_DIR, "town.html")));
  app.get("/house", (_req, res) => res.sendFile(path.join(PUBLIC_DIR, "house.html")));

  // Default route: keep it single-purpose.
  app.get("*", (_req, res) => res.redirect(302, "/lite"));

  return app;
}

module.exports = { createApp };
