const fs = require("fs");
const path = require("path");
const { test, expect } = require("@playwright/test");

const {
  ROOT_DIR,
  lineCount,
  readUtf8,
  resetServer,
  startStandaloneServer,
} = require("./helpers/backend_modularity");

function listJsFiles(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listJsFiles(full));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".js")) out.push(full);
  }
  return out;
}

function lineCountAbs(filePath) {
  return fs.readFileSync(filePath, "utf8").split(/\r?\n/).length;
}

test.describe("M29: final backend modularity gate", () => {
  test("test-only routes are isolated, index is composition-root sized, and core route parity holds", async ({ request }) => {
    await resetServer(request);

    expect(lineCount("server", "index.js")).toBeLessThanOrEqual(450);
    const indexSource = readUtf8("server", "index.js");
    expect(indexSource.includes("app.post(\"/api/tools/web_fetch\"")).toBeFalsy();
    expect(indexSource.includes("app.post(\"/api/llm/openai/v1/chat/completions\"")).toBeFalsy();

    const jsFiles = listJsFiles(path.join(ROOT_DIR, "server"));
    for (const filePath of jsFiles) {
      const lc = lineCountAbs(filePath);
      expect(lc, `${filePath} exceeds 900 lines`).toBeLessThanOrEqual(900);
    }

    const health = await request.get("/api/health");
    expect(health.status()).toBe(200);
    expect((await health.json())?.ok).toBe(true);

    const caps = await request.get("/api/runtime/capabilities");
    expect(caps.status()).toBe(200);
    const capsBody = await caps.json();
    expect(capsBody?.ok).toBe(true);
    expect(typeof capsBody?.llm?.codexCli).toBe("boolean");

    const badFetch = await request.post("/api/tools/web_fetch", { data: {} });
    expect(badFetch.status()).toBe(400);
    expect((await badFetch.json())?.error?.code).toBe("INVALID_ARGUMENTS");

    const badHttp = await request.post("/api/tools/http_request", { data: {} });
    expect(badHttp.status()).toBe(400);
    expect((await badHttp.json())?.error?.code).toBe("INVALID_ARGUMENTS");

    const llm = await request.post("/api/llm/openai/v1/chat/completions", {
      data: { model: "test-model", stream: true, messages: [{ role: "user", content: "hello" }] },
    });
    expect(llm.status()).toBe(200);
    expect((await llm.text()).includes("data: [DONE]")).toBeTruthy();
  });

  test("production-like server does not expose test-only reset endpoint", async () => {
    const server = await startStandaloneServer({ NODE_ENV: "development" });
    try {
      const res = await fetch(`${server.origin}/__test__/reset`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-test-reset": "test-reset" },
        body: "{}",
      });
      expect(res.status).toBe(404);
    } finally {
      await server.stop();
    }
  });
});
