const { test, expect } = require("@playwright/test");
const fs = require("fs/promises");
const path = require("path");

async function readJson(p) {
  const raw = await fs.readFile(p, "utf8");
  return JSON.parse(raw);
}

test("OpenClaw Lite hard-requires PI (pi-mono) and stays version-aligned with vendored OpenClaw", async () => {
  const repoRoot = process.cwd();

  const vendorPkgPath = path.join(repoRoot, "vendor", "openclaw-main", "package.json");
  const vendorPkg = await readJson(vendorPkgPath);

  const rootPkgPath = path.join(repoRoot, "package.json");
  const rootPkg = await readJson(rootPkgPath);

  const piKeys = [
    "@mariozechner/pi-agent-core",
    "@mariozechner/pi-ai",
    "@mariozechner/pi-coding-agent",
    "@mariozechner/pi-tui",
  ];

  for (const k of piKeys) {
    const vendorV = vendorPkg.dependencies?.[k];
    expect(typeof vendorV).toBe("string");
    const rootV = rootPkg.dependencies?.[k] || rootPkg.devDependencies?.[k];
    expect(typeof rootV).toBe("string");
    expect(rootV).toBe(vendorV);
  }

  const specPath = path.join(repoRoot, "specs", "07_openclaw_lite_web_runtime_spec_v1_2.md");
  const specRaw = await fs.readFile(specPath, "utf8");
  expect(specRaw).toContain("pi-mono");
  expect(specRaw).toContain("MUST");
});

