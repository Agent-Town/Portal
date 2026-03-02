import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { validateOpenClawLiteExportDir } from "./validate_bundle_dir.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function fileExists(p) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

export async function validateOpenClawLiteExportZip(zipPath, opts = {}) {
  assert(typeof zipPath === "string" && zipPath.trim(), "MISSING_ZIP_PATH");
  const abs = path.resolve(zipPath);
  assert(await fileExists(abs), `ZIP_NOT_FOUND:${abs}`);

  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "openclaw-lite-export-"));
  try {
    const unzip = spawnSync("unzip", ["-qq", abs, "-d", tmpRoot], { stdio: "inherit" });
    assert(unzip.status === 0, `UNZIP_FAILED:${unzip.status ?? "unknown"}`);
    return await validateOpenClawLiteExportDir(tmpRoot, opts);
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const zip = process.argv[2];
  await validateOpenClawLiteExportZip(zip);
  process.stdout.write("ok\n");
}

