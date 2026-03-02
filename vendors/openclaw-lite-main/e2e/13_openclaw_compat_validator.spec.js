const { test, expect } = require("@playwright/test");
const fs = require("fs/promises");
const path = require("path");
const os = require("os");

async function readJson(p) {
  const raw = await fs.readFile(p, "utf8");
  return JSON.parse(raw);
}

test("OpenClaw Lite export validator accepts a minimal OpenClaw-compatible bundle dir", async () => {
  const repoRoot = process.cwd();
  const vendorPkg = path.join(repoRoot, "vendor", "openclaw-main", "package.json");

  // Hard requirement: vendored OpenClaw reference must exist for compat validation.
  const vendor = await readJson(vendorPkg);
  expect(typeof vendor.version).toBe("string");
  const openclawVersion = vendor.version.trim();
  expect(openclawVersion.length).toBeGreaterThan(0);

  const piVersions = {};
  for (const k of [
    "@mariozechner/pi-agent-core",
    "@mariozechner/pi-ai",
    "@mariozechner/pi-coding-agent",
    "@mariozechner/pi-tui",
  ]) {
    expect(typeof vendor.dependencies?.[k]).toBe("string");
    piVersions[k] = vendor.dependencies[k];
  }

  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "openclaw-lite-export-fixture-"));
  try {
    // manifest.json
    const manifest = {
      v: 1,
      kind: "openclaw-lite-export",
      createdAtMs: 0,
      openclaw: {
        agentId: "main",
        mainSessionKey: "agent:main:main",
        compat: { openclawVersion, piVersions },
      },
    };
    await fs.writeFile(path.join(tmp, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

    // workspace (core files)
    const ws = path.join(tmp, "workspace");
    await fs.mkdir(ws, { recursive: true });
    await fs.writeFile(path.join(ws, "AGENTS.md"), "# AGENTS\n", "utf8");
    await fs.writeFile(path.join(ws, "SOUL.md"), "# SOUL\n", "utf8");
    await fs.writeFile(path.join(ws, "USER.md"), "# USER\n", "utf8");
    await fs.writeFile(path.join(ws, "IDENTITY.md"), "# IDENTITY\n", "utf8");
    await fs.writeFile(path.join(ws, "TOOLS.md"), "# TOOLS\n", "utf8");

    // .openclaw sessions
    const sessionsDir = path.join(tmp, ".openclaw", "agents", "main", "sessions");
    await fs.mkdir(sessionsDir, { recursive: true });

    const sessionId = "00000000-0000-0000-0000-000000000000";
    const sessionsStore = {
      "agent:main:main": {
        sessionId,
        updatedAt: 0,
        // sessionFile intentionally omitted: export must be portable
      },
    };
    await fs.writeFile(
      path.join(sessionsDir, "sessions.json"),
      JSON.stringify(sessionsStore, null, 2),
      "utf8",
    );

    const transcript = [
      JSON.stringify({ role: "user", content: "hello", timestamp: 0 }),
      JSON.stringify({ role: "assistant", content: "hi", timestamp: 1 }),
    ].join("\n");
    await fs.writeFile(path.join(sessionsDir, `${sessionId}.jsonl`), transcript, "utf8");

    const { validateOpenClawLiteExportDir } = await import(
      path.join(repoRoot, "scripts", "openclaw_compat", "validate_bundle_dir.mjs")
    );

    const result = await validateOpenClawLiteExportDir(tmp);
    expect(result.ok).toBeTruthy();
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

