import fs from "node:fs/promises";
import path from "node:path";

import esbuild from "esbuild";

async function fileExists(p) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function readJson(p) {
  const raw = await fs.readFile(p, "utf8");
  return JSON.parse(raw);
}

async function writeFileEnsured(p, content) {
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, content, "utf8");
}

async function readVendorPinnedVersions({ repoRoot }) {
  const vendorPkgPath = path.join(repoRoot, "vendor", "openclaw-main", "package.json");
  assert(await fileExists(vendorPkgPath), `MISSING_VENDOR_OPENCLAW:${vendorPkgPath}`);
  const pkg = await readJson(vendorPkgPath);

  const openclawVersion = typeof pkg.version === "string" ? pkg.version.trim() : "";
  assert(openclawVersion, "VENDOR_OPENCLAW_VERSION_MISSING");

  const deps = pkg && typeof pkg === "object" ? pkg.dependencies : null;
  assert(deps && typeof deps === "object", "VENDOR_OPENCLAW_DEPENDENCIES_MISSING");

  const piKeys = [
    "@mariozechner/pi-agent-core",
    "@mariozechner/pi-ai",
    "@mariozechner/pi-coding-agent",
    "@mariozechner/pi-tui",
  ];

  const piVersions = {};
  for (const k of piKeys) {
    const v = deps[k];
    assert(typeof v === "string" && v.trim(), `VENDOR_OPENCLAW_PI_VERSION_MISSING:${k}`);
    piVersions[k] = v.trim();
  }

  return { openclawVersion, piVersions };
}

async function main() {
  const repoRoot = process.cwd();

  const pinned = await readVendorPinnedVersions({ repoRoot });

  const outDir = path.join(repoRoot, "public", "openclaw-lite");
  await fs.mkdir(outDir, { recursive: true });

  const shimPiAi = path.join(repoRoot, "src", "openclaw-lite", "pi-ai-browser-port.js");
  const localWalletEntrypoint = path.join(repoRoot, "src", "openclaw-wallet", "fallback.js");

  /** @type {import('esbuild').Plugin} */
  const piAiShimPlugin = {
    name: "pi-ai-shim",
    setup(build) {
      build.onResolve({ filter: /^@mariozechner\/pi-ai$/ }, () => ({ path: shimPiAi }));
    },
  };

  /** @type {import('esbuild').Plugin} */
  const nodeBuiltinsExternalPlugin = {
    name: "node-builtins-external",
    setup(build) {
      build.onResolve({ filter: /^node:/ }, (args) => ({ path: args.path, external: true }));
    },
  };

  await esbuild.build({
    entryPoints: [
      path.join(repoRoot, "src", "openclaw-lite", "gateway.js"),
      path.join(repoRoot, "src", "openclaw-lite", "worker.js"),
      path.join(repoRoot, "src", "openclaw-lite", "town.js"),
    ],
    outdir: outDir,
    bundle: true,
    format: "esm",
    target: ["es2020"],
    sourcemap: true,
    logLevel: "info",
    plugins: [piAiShimPlugin, nodeBuiltinsExternalPlugin],
    define: {
      __OPENCLAW_VERSION__: JSON.stringify(pinned.openclawVersion),
      __PI_VERSIONS__: JSON.stringify(pinned.piVersions),
    },
  });

  // Build a tiny local wallet fallback (classic script) used by the non-Lite pages and Lite gateway.
  await esbuild.build({
    entryPoints: [localWalletEntrypoint],
    outfile: path.join(repoRoot, "public", "openclaw-wallet.js"),
    bundle: true,
    format: "iife",
    target: ["es2020"],
    sourcemap: true,
    logLevel: "info",
  });
}

await main();
