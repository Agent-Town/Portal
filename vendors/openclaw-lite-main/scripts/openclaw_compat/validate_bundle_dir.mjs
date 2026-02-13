import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

async function fileExists(p) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFile(p) {
  const raw = await fs.readFile(p, "utf8");
  return JSON.parse(raw);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function parseJsonLines(raw) {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const out = [];
  for (let i = 0; i < lines.length; i += 1) {
    try {
      out.push(JSON.parse(lines[i]));
    } catch (err) {
      throw new Error(`INVALID_JSONL_LINE:${i + 1}`);
    }
  }
  return out;
}

async function readOpenClawPinnedVersions({ repoRoot, vendorDir }) {
  const vendorPkgPath = path.join(repoRoot, vendorDir, "package.json");
  assert(await fileExists(vendorPkgPath), `MISSING_VENDOR_OPENCLAW:${vendorPkgPath}`);
  const pkg = await readJsonFile(vendorPkgPath);

  const deps = pkg && typeof pkg === "object" ? pkg.dependencies : null;
  assert(isPlainObject(deps), "VENDOR_OPENCLAW_DEPENDENCIES_MISSING");

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

  const openclawVersion = typeof pkg.version === "string" ? pkg.version.trim() : "";
  assert(openclawVersion, "VENDOR_OPENCLAW_VERSION_MISSING");

  return { openclawVersion, piVersions };
}

async function requireFile(p, code) {
  assert(await fileExists(p), `${code}:${p}`);
}

export async function validateOpenClawLiteExportDir(
  dir,
  {
    repoRoot = process.cwd(),
    vendorDir = "vendor/openclaw-main",
    requireTranscriptHygiene = true,
  } = {},
) {
  assert(typeof dir === "string" && dir.trim(), "MISSING_DIR");

  const root = path.resolve(dir);
  await requireFile(root, "MISSING_EXPORT_DIR");

  const manifestPath = path.join(root, "manifest.json");
  await requireFile(manifestPath, "MISSING_MANIFEST");

  const manifest = await readJsonFile(manifestPath);
  assert(isPlainObject(manifest), "INVALID_MANIFEST");
  assert(manifest.v === 1, "INVALID_MANIFEST_VERSION");
  assert(manifest.kind === "openclaw-lite-export", "INVALID_MANIFEST_KIND");
  assert(Number.isInteger(manifest.createdAtMs), "INVALID_MANIFEST_CREATED_AT_MS");

  assert(isPlainObject(manifest.openclaw), "INVALID_MANIFEST_OPENCLAW");
  const agentId = typeof manifest.openclaw.agentId === "string" ? manifest.openclaw.agentId.trim() : "";
  assert(agentId, "INVALID_MANIFEST_AGENT_ID");
  assert(agentId === "main", "OPENCLAW_AGENT_ID_MUST_BE_MAIN");

  const mainSessionKey =
    typeof manifest.openclaw.mainSessionKey === "string" ? manifest.openclaw.mainSessionKey.trim() : "";
  assert(mainSessionKey, "INVALID_MANIFEST_MAIN_SESSION_KEY");
  assert(mainSessionKey === "agent:main:main", "OPENCLAW_MAIN_SESSION_KEY_MUST_BE_AGENT_MAIN_MAIN");

  assert(isPlainObject(manifest.openclaw.compat), "INVALID_MANIFEST_OPENCLAW_COMPAT");
  const compat = manifest.openclaw.compat;
  const compatOpenClawVersion =
    typeof compat.openclawVersion === "string" ? compat.openclawVersion.trim() : "";
  assert(compatOpenClawVersion, "INVALID_MANIFEST_OPENCLAW_VERSION");
  assert(isPlainObject(compat.piVersions), "INVALID_MANIFEST_PI_VERSIONS");

  const pinned = await readOpenClawPinnedVersions({ repoRoot, vendorDir });
  assert(
    compatOpenClawVersion === pinned.openclawVersion,
    `OPENCLAW_VERSION_MISMATCH:manifest=${compatOpenClawVersion} vendor=${pinned.openclawVersion}`,
  );

  for (const [k, v] of Object.entries(pinned.piVersions)) {
    const mv = typeof compat.piVersions[k] === "string" ? compat.piVersions[k].trim() : "";
    assert(mv, `MANIFEST_PI_VERSION_MISSING:${k}`);
    assert(mv === v, `PI_VERSION_MISMATCH:${k}:manifest=${mv} vendor=${v}`);
  }

  // Workspace files (core set).
  const ws = path.join(root, "workspace");
  await requireFile(ws, "MISSING_WORKSPACE_DIR");
  await requireFile(path.join(ws, "AGENTS.md"), "MISSING_AGENTS_MD");
  await requireFile(path.join(ws, "SOUL.md"), "MISSING_SOUL_MD");
  await requireFile(path.join(ws, "USER.md"), "MISSING_USER_MD");
  await requireFile(path.join(ws, "IDENTITY.md"), "MISSING_IDENTITY_MD");
  await requireFile(path.join(ws, "TOOLS.md"), "MISSING_TOOLS_MD");

  // OpenClaw state dir: only sessions are included (no credentials/config).
  const stateSessionsDir = path.join(root, ".openclaw", "agents", agentId, "sessions");
  await requireFile(stateSessionsDir, "MISSING_OPENCLAW_SESSIONS_DIR");
  const sessionsStorePath = path.join(stateSessionsDir, "sessions.json");
  await requireFile(sessionsStorePath, "MISSING_SESSIONS_JSON");

  const sessionsStore = await readJsonFile(sessionsStorePath);
  assert(isPlainObject(sessionsStore), "INVALID_SESSIONS_JSON");
  assert(isPlainObject(sessionsStore[mainSessionKey]), "MISSING_MAIN_SESSION_ENTRY");

  const entry = sessionsStore[mainSessionKey];
  const sessionId = typeof entry.sessionId === "string" ? entry.sessionId.trim() : "";
  assert(sessionId, "INVALID_SESSION_ID");
  assert(Number.isFinite(entry.updatedAt), "INVALID_SESSION_UPDATED_AT");

  // Portable export: do not embed absolute paths that will break when imported.
  assert(!("sessionFile" in entry), "SESSION_FILE_MUST_BE_OMITTED_FOR_PORTABLE_EXPORT");

  const transcriptPath = path.join(stateSessionsDir, `${sessionId}.jsonl`);
  await requireFile(transcriptPath, "MISSING_TRANSCRIPT");

  const rawJsonl = await fs.readFile(transcriptPath, "utf8");
  const messages = parseJsonLines(rawJsonl);
  assert(messages.length >= 1, "EMPTY_TRANSCRIPT");
  for (const msg of messages) {
    assert(isPlainObject(msg), "INVALID_TRANSCRIPT_MESSAGE");
    assert(typeof msg.role === "string" && msg.role.trim(), "INVALID_TRANSCRIPT_MESSAGE_ROLE");
  }

  if (requireTranscriptHygiene) {
    const repairModFile = path.join(repoRoot, vendorDir, "src", "agents", "session-transcript-repair.ts");
    const repair = await import(pathToFileURL(repairModFile).href);
    const callInputReport = repair.repairToolCallInputs(messages);
    assert(callInputReport && typeof callInputReport === "object", "REPAIR_TOOL_CALL_INPUTS_FAILED");
    assert(callInputReport.droppedToolCalls === 0, "TRANSCRIPT_HAS_TOOL_CALLS_WITH_MISSING_INPUTS");
    assert(callInputReport.droppedAssistantMessages === 0, "TRANSCRIPT_HAS_ASSISTANT_MESSAGES_DROPPED_BY_REPAIR");

    const toolUseReport = repair.repairToolUseResultPairing(messages);
    assert(toolUseReport && typeof toolUseReport === "object", "REPAIR_TOOL_USE_PAIRING_FAILED");
    assert(toolUseReport.droppedOrphanCount === 0, "TRANSCRIPT_HAS_ORPHAN_TOOL_RESULTS");
    assert(toolUseReport.droppedDuplicateCount === 0, "TRANSCRIPT_HAS_DUPLICATE_TOOL_RESULTS");
    assert(toolUseReport.added.length === 0, "TRANSCRIPT_HAS_MISSING_TOOL_RESULTS");
    assert(toolUseReport.moved === false, "TRANSCRIPT_HAS_DISPLACED_TOOL_RESULTS");
  }

  // Ensure we didn't accidentally export credentials/config.
  assert(!(await fileExists(path.join(root, ".openclaw", "credentials"))), "EXPORT_MUST_NOT_INCLUDE_CREDENTIALS");
  assert(!(await fileExists(path.join(root, ".openclaw", "openclaw.json"))), "EXPORT_MUST_NOT_INCLUDE_OPENCLAW_CONFIG");

  return { ok: true };
}
