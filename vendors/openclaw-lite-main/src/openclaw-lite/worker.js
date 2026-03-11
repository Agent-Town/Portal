/* eslint-disable no-console */

import { agentLoop } from "@mariozechner/pi-agent-core/dist/agent-loop.js";
import { getModel as getPiModel } from "@mariozechner/pi-ai/dist/models.js";
import { zipSync } from "fflate";

import {
  repairToolCallInputs,
  repairToolUseResultPairing,
} from "./shared/session-transcript-repair-lite.js";

import { base58Encode } from "./shared/base58.js";
import { b64ToBytes, bytesToB64, utf8ToBytes } from "./shared/encoding.js";
import {
  aesGcmDecryptRaw,
  aesGcmEncryptRaw,
  hkdfSha256,
  importHmacSha256Key,
  randomBytes,
  sha256,
  sha256B64FromUtf8,
  hmacSha256B64,
} from "./shared/crypto.js";
import { deleteByKeys, getAllFromIndex, getRecord, openDb, putRecord } from "./shared/idb.js";
import { vfsGetUtf8, vfsListPaths, vfsPutBytes, vfsPutUtf8, vfsReadAllBytes } from "./shared/vfs.js";

const OPENCLAW_VERSION = __OPENCLAW_VERSION__;
const PI_VERSIONS = __PI_VERSIONS__;

const MAIN_AGENT_ID = "main";
const MAIN_SESSION_KEY = "agent:main:main";
const TRANSCRIPT_DIGEST_QUEUE_META_KEY = "transcriptDigestQueueV1";
const TRANSCRIPT_DIGEST_QUEUE_MAX = 500;
const LITE_TOOL_DISPATCH_PATH = "lite_tool_dispatch_v1";
const DEFAULT_WEB_FETCH_MAX_BYTES = 262_144;
const MAX_WEB_FETCH_MAX_BYTES = 1_048_576;
const WEB_FETCH_PROXY_PATH = "/api/tools/web_fetch";
const HTTP_REQUEST_PROXY_PATH = "/api/tools/http_request";
const DEFAULT_HTTP_TIMEOUT_MS = 30_000;
const MAX_HTTP_TIMEOUT_MS = 60_000;
const MIN_HTTP_TIMEOUT_MS = 100;
const DEFAULT_HTTP_MAX_BYTES = 262_144;
const MAX_HTTP_BODY_BYTES = 65_536;
const HTTP_RATE_LIMIT_WINDOW_MS = 1000;
const HTTP_RATE_LIMIT_MAX = 50;
const WS_DEFAULT_CONNECT_TIMEOUT_MS = 10_000;
const WS_MAX_CONNECT_TIMEOUT_MS = 30_000;
const WS_DEFAULT_RECV_WAIT_MS = 5_000;
const WS_MAX_RECV_WAIT_MS = 30_000;
const WS_MAX_RECV_MESSAGES = 50;
const TRAINER_ROOT_PATH = "lite/experience-trainer/v1";
const TRAINER_VERSION = 1;
const TRAINER_DEFAULT_QUEST_ID = "portal_onboarding_v1";
const TRAINER_ACTIVE_LOADOUT_META_KEY_PREFIX = "trainerActiveLoadoutV1:";
const TRAINER_COACHING_META_KEY = "trainerCoachingV1";
const TRAINER_PERSONAL_BACKUP_KIND = "agent-town-personal-backup";
const TRAINER_BACKUP_MAX_BYTES = 16 * 1024 * 1024;

const MAX_CHECKPOINTS_PER_HOUSE = 50;
const VISIT_MAX_COMPANION_FILES = 12;
const VISIT_COMPANION_EXT_RE = /\.(md|json)$/i;
const VISIT_COMPAT_BASENAMES = new Set([
  "heartbeat.md",
  "goals.md",
  "tools.md",
  "penalty.md",
  "rules.md",
  "messaging.md",
  "skill.json",
]);
const CEREMONY_E2EE_P256_AESGCM_V1 = "CEREMONY_E2EE_P256_AESGCM_V1";
const TRAINER_TOOL_DEFAULT_RUN_LIMIT = 20;
const TRAINER_TOOL_MAX_RUN_LIMIT = 200;
const TRAINER_TOOL_DEFAULT_SCAN_LIMIT = 20;
const TRAINER_TOOL_DEFAULT_EVIDENCE_LIMIT = 50;
const TRAINER_TOOL_MAX_EVIDENCE_LIMIT = 500;
const TRAINER_NAMESPACE_QUERY_KEYS = ["trainerNamespace", "trainer_namespace", "trainer-tools", "trainerTools"];
const TRAINER_NAMESPACE_DEFAULT_ENABLED = true;
const TRAINER_NAMESPACE_TOOL_PREFIX = "trainer.";
const TRAINER_NAMESPACE_ENABLED = resolveTrainerNamespaceEnabledFromWorkerLocation();
const ERC8004_REGISTRATION_V1_TYPE = "https://eips.ethereum.org/EIPS/eip-8004#registration-v1";
const PERMISSION_MANIFEST_V1_TYPE = "https://agent.town/schemas/permission-manifest-v1";
const PERMISSION_POLICY_META_KEY = "permissionPolicyV1";
const PERMISSION_RISK_LEVELS = new Set(["unknown", "low", "medium", "high", "critical"]);
const PERMISSION_IDS = new Set([
  "network.fetch",
  "storage.local.persistent",
  "wallet.eip1193.sign",
  "wallet.eip1193.tx",
  "secrets.read",
]);

function post(msg) {
  self.postMessage(msg);
}

function log(line) {
  post({ type: "worker.log.append", line: String(line || "") });
}

function parseBoolLike(value) {
  if (value === true || value === false) return value;
  const normalized = String(value == null ? "" : value).trim().toLowerCase();
  if (!normalized) return null;
  if (["1", "true", "yes", "on", "enable", "enabled"].includes(normalized)) return true;
  if (["0", "false", "no", "off", "disable", "disabled"].includes(normalized)) return false;
  return null;
}

function resolveTrainerNamespaceEnabledFromWorkerLocation() {
  let enabled = TRAINER_NAMESPACE_DEFAULT_ENABLED;
  try {
    const rawSearch = String(self?.location?.search || "").trim();
    if (!rawSearch) return enabled;
    const params = new URLSearchParams(rawSearch.startsWith("?") ? rawSearch.slice(1) : rawSearch);
    for (const key of TRAINER_NAMESPACE_QUERY_KEYS) {
      if (!params.has(key)) continue;
      const parsed = parseBoolLike(params.get(key));
      if (parsed !== null) {
        enabled = parsed;
        break;
      }
    }
  } catch {
    // Keep default behavior if query parsing fails.
  }
  return enabled;
}

function isTrainerNamespaceToolName(toolName) {
  return String(toolName || "").trim().startsWith(TRAINER_NAMESPACE_TOOL_PREFIX);
}

function trainerNamespaceEnabled() {
  return TRAINER_NAMESPACE_ENABLED === true;
}

function normalizeSkillImportStatus(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "loading" || raw === "ready" || raw === "failed") return raw;
  return "idle";
}

function normalizeSkillRunMode(value) {
  const raw = String(value || "").trim().toLowerCase();
  return raw || null;
}

function normalizeSkillImportPath(value) {
  const normalized = String(value || "")
    .trim()
    .replace(/\\/g, "/");
  if (!normalized.startsWith("workspace/")) return "";
  return normalized;
}

function skillImportPathSort(a, b) {
  const aFolded = String(a || "").toLowerCase();
  const bFolded = String(b || "").toLowerCase();
  if (aFolded < bFolded) return -1;
  if (aFolded > bFolded) return 1;
  const aRaw = String(a || "");
  const bRaw = String(b || "");
  if (aRaw < bRaw) return -1;
  if (aRaw > bRaw) return 1;
  return 0;
}

function normalizeSkillImportPaths(values, { limit = 500 } = {}) {
  const max = Math.max(0, Math.floor(Number(limit) || 0));
  const byPath = new Map();
  for (const value of Array.isArray(values) ? values : []) {
    const path = normalizeSkillImportPath(value);
    if (!path) continue;
    byPath.set(path, path);
  }
  return Array.from(byPath.values()).sort(skillImportPathSort).slice(0, max);
}

function normalizeSkillImportMetadataText(value) {
  const raw = String(value || "").trim();
  return raw || null;
}

function normalizeSkillImportHash(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  return /^[A-Za-z0-9+/=]+$/.test(raw) ? raw : null;
}

function normalizeSkillImportFileEntry(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const path = normalizeSkillImportPath(value.path);
  if (!path) return null;
  return {
    path,
    sourceUrl: normalizeSkillImportMetadataText(value.sourceUrl),
    finalUrl: normalizeSkillImportMetadataText(value.finalUrl),
    etag: normalizeSkillImportMetadataText(value.etag),
    lastModified: normalizeSkillImportMetadataText(value.lastModified),
    sha256B64: normalizeSkillImportHash(value.sha256B64),
  };
}

function normalizeSkillImportFiles(values, { limit = 500 } = {}) {
  const max = Math.max(0, Math.floor(Number(limit) || 0));
  const byPath = new Map();
  for (const value of Array.isArray(values) ? values : []) {
    const normalized = normalizeSkillImportFileEntry(value);
    if (!normalized) continue;
    byPath.set(normalized.path, normalized);
  }
  return Array.from(byPath.values())
    .sort((a, b) => skillImportPathSort(a.path, b.path))
    .slice(0, max);
}

function skillImportSnapshot({ importedPathLimit = 200, importedFileLimit = importedPathLimit } = {}) {
  const pathLimit = Math.max(0, Math.floor(Number(importedPathLimit) || 0));
  const fileLimit = Math.max(0, Math.floor(Number(importedFileLimit) || 0));
  const normalizedFiles = normalizeSkillImportFiles(state.skillImport.importedFiles, { limit: Math.max(fileLimit, pathLimit) });
  const importedPaths = normalizedFiles.length > 0
    ? normalizedFiles.map((entry) => entry.path).slice(0, pathLimit)
    : normalizeSkillImportPaths(state.skillImport.importedPaths, { limit: pathLimit });
  return {
    status: normalizeSkillImportStatus(state.skillImport.status),
    sourceUrl:
      typeof state.skillImport.sourceUrl === "string" && state.skillImport.sourceUrl
        ? state.skillImport.sourceUrl
        : null,
    siteRoot:
      typeof state.skillImport.siteRoot === "string" && state.skillImport.siteRoot.startsWith("workspace/skills/")
        ? state.skillImport.siteRoot
        : null,
    activeSkillPath:
      typeof state.skillImport.activeSkillPath === "string" && state.skillImport.activeSkillPath.startsWith("workspace/")
        ? state.skillImport.activeSkillPath
        : null,
    lastImportedAtMs: Number.isFinite(Number(state.skillImport.lastImportedAtMs))
      ? Number(state.skillImport.lastImportedAtMs)
      : null,
    lastError:
      typeof state.skillImport.lastError === "string" && state.skillImport.lastError
        ? state.skillImport.lastError
        : null,
    lastRunAtMs: Number.isFinite(Number(state.skillImport.lastRunAtMs))
      ? Number(state.skillImport.lastRunAtMs)
      : null,
    lastRunMode: normalizeSkillRunMode(state.skillImport.lastRunMode),
    lastRunOk: typeof state.skillImport.lastRunOk === "boolean" ? state.skillImport.lastRunOk : null,
    lastRunErrorCode:
      typeof state.skillImport.lastRunErrorCode === "string" && state.skillImport.lastRunErrorCode
        ? state.skillImport.lastRunErrorCode
        : null,
    lastRunErrorMessage:
      typeof state.skillImport.lastRunErrorMessage === "string" && state.skillImport.lastRunErrorMessage
        ? state.skillImport.lastRunErrorMessage
        : null,
    lastRunDurationMs: Number.isFinite(Number(state.skillImport.lastRunDurationMs))
      ? Number(state.skillImport.lastRunDurationMs)
      : null,
    importedPaths,
    importedFiles: normalizedFiles.slice(0, fileLimit),
  };
}

async function recordSkillRunDiagnostic({ mode, envelope, startedAtMs }) {
  const finishedAtMs = nowMs();
  state.skillImport.lastRunAtMs = finishedAtMs;
  state.skillImport.lastRunMode = normalizeSkillRunMode(mode);
  state.skillImport.lastRunOk = envelope?.ok === true;
  state.skillImport.lastRunDurationMs = Math.max(0, finishedAtMs - Number(startedAtMs || finishedAtMs));

  if (envelope?.ok === false && envelope?.error && typeof envelope.error === "object") {
    const codeRaw = String(envelope.error.code || "").trim();
    state.skillImport.lastRunErrorCode = codeRaw || "UNSUPPORTED";
    const messageRaw = String(envelope.error.message || "").trim();
    state.skillImport.lastRunErrorMessage = messageRaw || state.skillImport.lastRunErrorCode;
  } else {
    state.skillImport.lastRunErrorCode = null;
    state.skillImport.lastRunErrorMessage = null;
  }

  await persistSkillImportState();
  updateGatewayState();
  const runCode = state.skillImport.lastRunOk ? "ok" : state.skillImport.lastRunErrorCode || "UNSUPPORTED";
  log(`skill run ${state.skillImport.lastRunOk ? "ok" : "failed"} mode=${state.skillImport.lastRunMode || "unknown"} code=${runCode}`);
}

function updateGatewayState() {
  post({
    type: "worker.state.update",
    state: {
      houseId: state.houseId,
      vault: { latestBackupId: state.vaultLatestBackupId || null },
      skill: skillImportSnapshot({ importedPathLimit: 200 }),
      policy: permissionPolicySnapshot(),
    },
  });
}

function nowMs() {
  return Date.now();
}

function randomId(prefix) {
  const r = Math.random().toString(16).slice(2);
  return `${prefix}_${Date.now()}_${r}`;
}

async function metaGet(key) {
  const rec = await getRecord("meta", key);
  return rec ? rec.value : null;
}

async function metaSet(key, value) {
  await putRecord("meta", { key, value });
}

function safeOrigin() {
  try {
    return self.location?.origin || "";
  } catch {
    return "";
  }
}

function normalizeTeamCodeHint(value) {
  const raw = String(value || "").trim().toUpperCase();
  if (!raw) return "";
  return /^TEAM-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(raw) ? raw : "";
}

function bytesToHex(bytes) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array([]);
  let out = "";
  for (let i = 0; i < view.length; i += 1) {
    out += view[i].toString(16).padStart(2, "0");
  }
  return out;
}

function isPlainObject(value) {
  return !!(value && typeof value === "object" && !Array.isArray(value));
}

function normalizePermissionRiskLevel(value) {
  const raw = String(value || "unknown").trim().toLowerCase();
  return PERMISSION_RISK_LEVELS.has(raw) ? raw : "unknown";
}

function normalizePermissionOrigin(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw === "*") return "*";
  try {
    const parsed = new URL(raw, safeOrigin() || "http://localhost");
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    return parsed.origin;
  } catch {
    return "";
  }
}

function normalizePermissionOrigins(values) {
  if (!Array.isArray(values)) return [];
  const out = [];
  const seen = new Set();
  for (const value of values) {
    const normalized = normalizePermissionOrigin(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

function normalizePermissionEntry(value) {
  if (!isPlainObject(value)) return null;
  const id = String(value.id || "").trim();
  if (!id || !PERMISSION_IDS.has(id)) return null;
  const constraints = isPlainObject(value.constraints) ? value.constraints : {};
  return {
    id,
    constraints: {
      origins: normalizePermissionOrigins(constraints.origins),
      chainIds: Array.isArray(constraints.chainIds)
        ? constraints.chainIds.map((entry) => Number(entry)).filter((entry) => Number.isFinite(entry))
        : [],
      maxValueWei:
        constraints.maxValueWei == null || constraints.maxValueWei === ""
          ? null
          : String(constraints.maxValueWei),
      to:
        constraints.to == null || constraints.to === ""
          ? null
          : String(constraints.to).trim().toLowerCase(),
    },
  };
}

function normalizePermissionManifest(value) {
  if (!isPlainObject(value)) {
    return { ok: false, error: "INVALID_PERMISSION_MANIFEST" };
  }
  const type = String(value.type || "").trim();
  if (type && type !== PERMISSION_MANIFEST_V1_TYPE) {
    return { ok: false, error: "INVALID_PERMISSION_MANIFEST_TYPE" };
  }
  const version = String(value.version || "1.0.0").trim() || "1.0.0";
  const permissions = [];
  for (const entry of Array.isArray(value.permissions) ? value.permissions : []) {
    const normalized = normalizePermissionEntry(entry);
    if (!normalized) continue;
    permissions.push(normalized);
  }
  const deduped = [];
  const seenIds = new Set();
  for (const entry of permissions) {
    if (seenIds.has(entry.id)) continue;
    seenIds.add(entry.id);
    deduped.push(entry);
  }
  const risk = isPlainObject(value.risk) ? value.risk : {};
  const safety = isPlainObject(value.safety) ? value.safety : {};
  return {
    ok: true,
    manifest: {
      type: PERMISSION_MANIFEST_V1_TYPE,
      version,
      permissions: deduped,
      risk: {
        level: normalizePermissionRiskLevel(risk.level),
        rationale: String(risk.rationale || "").trim() || "",
      },
      safety,
    },
  };
}

function normalizePermissionManifestRef(value) {
  if (!isPlainObject(value)) return null;
  const uri = String(value.uri || "").trim();
  if (!uri) return null;
  const contentType = String(value.contentType || "").trim() || null;
  const hash = String(value.hash || "").trim() || null;
  return { uri, contentType, hash };
}

function parseJsonObject(value) {
  if (typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value);
    return isPlainObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function permissionPolicyDefault() {
  return {
    mode: "legacy-allow",
    source: null,
    manifest: null,
    permissions: [],
    permissionIds: [],
    originsByPermission: {},
    risk: { level: "unknown", rationale: "" },
    lastError: null,
  };
}

function permissionPolicySnapshot() {
  const source = isPlainObject(state.permissionPolicy?.source) ? state.permissionPolicy.source : null;
  const permissions = Array.isArray(state.permissionPolicy?.permissions) ? state.permissionPolicy.permissions : [];
  const originsByPermission = isPlainObject(state.permissionPolicy?.originsByPermission)
    ? state.permissionPolicy.originsByPermission
    : {};
  const risk = isPlainObject(state.permissionPolicy?.risk)
    ? state.permissionPolicy.risk
    : { level: "unknown", rationale: "" };
  return {
    mode: String(state.permissionPolicy?.mode || "legacy-allow"),
    source,
    risk: {
      level: normalizePermissionRiskLevel(risk.level),
      rationale: String(risk.rationale || ""),
    },
    permissions,
    originsByPermission,
    lastError:
      typeof state.permissionPolicy?.lastError === "string" && state.permissionPolicy.lastError
        ? state.permissionPolicy.lastError
        : null,
  };
}

function setPermissionPolicy(nextPolicy) {
  const base = permissionPolicyDefault();
  const next = isPlainObject(nextPolicy) ? nextPolicy : {};
  const permissions = Array.isArray(next.permissions) ? next.permissions : [];
  const permissionIds = permissions.map((entry) => String(entry?.id || "")).filter(Boolean);
  const originsByPermission = isPlainObject(next.originsByPermission) ? next.originsByPermission : {};
  state.permissionPolicy = {
    ...base,
    ...next,
    permissions,
    permissionIds: Array.from(new Set(permissionIds)),
    originsByPermission,
    risk: isPlainObject(next.risk)
      ? {
        level: normalizePermissionRiskLevel(next.risk.level),
        rationale: String(next.risk.rationale || ""),
      }
      : base.risk,
  };
}

async function persistPermissionPolicyState() {
  await metaSet(PERMISSION_POLICY_META_KEY, permissionPolicySnapshot());
}

function permissionPolicyHasPermission(permissionId) {
  if (!state.permissionPolicy || state.permissionPolicy.mode !== "manifest-enforced") return false;
  const id = String(permissionId || "").trim();
  if (!id) return false;
  const ids = Array.isArray(state.permissionPolicy.permissionIds) ? state.permissionPolicy.permissionIds : [];
  return ids.includes(id);
}

function permissionPolicyAllowedOrigins(permissionId) {
  if (!state.permissionPolicy || state.permissionPolicy.mode !== "manifest-enforced") return [];
  const byPermission = isPlainObject(state.permissionPolicy.originsByPermission)
    ? state.permissionPolicy.originsByPermission
    : {};
  const raw = byPermission[String(permissionId || "").trim()];
  return Array.isArray(raw) ? raw.map((value) => String(value || "")).filter(Boolean) : [];
}

function permissionPolicyEntry(permissionId) {
  if (!state.permissionPolicy || state.permissionPolicy.mode !== "manifest-enforced") return null;
  const id = String(permissionId || "").trim();
  if (!id) return null;
  const permissions = Array.isArray(state.permissionPolicy.permissions) ? state.permissionPolicy.permissions : [];
  for (const entry of permissions) {
    if (!entry || String(entry.id || "").trim() !== id) continue;
    return entry;
  }
  return null;
}

function permissionPolicyConstraints(permissionId) {
  const entry = permissionPolicyEntry(permissionId);
  if (!entry || !isPlainObject(entry.constraints)) return {};
  return entry.constraints;
}

function permissionDeniedEnvelope({ message = "Permission denied", details = {} } = {}) {
  return makeToolFailure("PERMISSION_DENIED", String(message || "Permission denied"), details);
}

function permissionDeniedReasonDetails(reason, extra = {}) {
  const out = { ...extra };
  if (reason === "missing_permission") out.missing_permission = String(extra.permissionId || "");
  if (reason === "origin_not_allowed") out.origin_not_allowed = String(extra.origin || "");
  if (reason === "approval_required") out.approval_required = true;
  out.reason = String(reason || "permission_denied");
  return out;
}

function parseRegistrationJsonFromFetchEnvelope(envelope) {
  const text = typeof envelope?.data?.text === "string" ? envelope.data.text : "";
  const parsed = parseJsonObject(text);
  if (!parsed) return null;
  if (String(parsed.type || "").trim() !== ERC8004_REGISTRATION_V1_TYPE) return null;
  return parsed;
}

function pickRegistrationWebServiceEndpoint(registration, registrationUrl) {
  const services = Array.isArray(registration?.services) ? registration.services : [];
  const webService = services.find((entry) => {
    if (!isPlainObject(entry)) return false;
    return String(entry.name || "").trim().toLowerCase() === "web" && typeof entry.endpoint === "string";
  });
  if (!webService) return "";
  const endpointRaw = String(webService.endpoint || "").trim();
  if (!endpointRaw) return "";
  try {
    const resolved = new URL(endpointRaw, registrationUrl || safeOrigin() || "http://localhost");
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") return "";
    return resolved.toString();
  } catch {
    return "";
  }
}

function permissionOriginsAllowOrigin(origins, targetOrigin) {
  const target = String(targetOrigin || "").trim();
  if (!target) return false;
  const allowlist = Array.isArray(origins) ? origins : [];
  if (allowlist.includes("*")) return true;
  return allowlist.includes(target);
}

function shouldEnforcePermissionPolicy() {
  return state.permissionPolicy?.mode === "manifest-enforced";
}

function denyIfMissingPermission(permissionId) {
  if (!shouldEnforcePermissionPolicy()) return null;
  if (permissionPolicyHasPermission(permissionId)) return null;
  return permissionDeniedEnvelope({
    details: permissionDeniedReasonDetails("missing_permission", { permissionId }),
  });
}

function permissionPolicyOriginsByPermission(permissions) {
  const out = {};
  for (const entry of Array.isArray(permissions) ? permissions : []) {
    const id = String(entry?.id || "").trim();
    if (!id) continue;
    const origins = normalizePermissionOrigins(entry?.constraints?.origins);
    out[id] = origins;
  }
  return out;
}

async function clearPermissionPolicyToLegacy(lastError = null) {
  setPermissionPolicy({
    ...permissionPolicyDefault(),
    lastError: typeof lastError === "string" && lastError ? lastError : null,
  });
  await persistPermissionPolicyState();
  updateGatewayState();
}

async function applyManifestPermissionPolicy({
  manifest,
  source = null,
  lastError = null,
} = {}) {
  const normalized = normalizePermissionManifest(manifest);
  if (!normalized.ok) {
    setPermissionPolicy({
      mode: "manifest-enforced",
      source: isPlainObject(source) ? source : null,
      manifest: null,
      permissions: [],
      originsByPermission: {},
      risk: {
        level: "unknown",
        rationale: "Invalid permission manifest",
      },
      lastError: normalized.error,
    });
    await persistPermissionPolicyState();
    updateGatewayState();
    return { ok: false, error: normalized.error };
  }

  const normalizedManifest = normalized.manifest;
  setPermissionPolicy({
    mode: "manifest-enforced",
    source: isPlainObject(source) ? source : null,
    manifest: normalizedManifest,
    permissions: normalizedManifest.permissions,
    originsByPermission: permissionPolicyOriginsByPermission(normalizedManifest.permissions),
    risk: normalizedManifest.risk,
    lastError: typeof lastError === "string" && lastError ? lastError : null,
  });
  await persistPermissionPolicyState();
  updateGatewayState();
  return { ok: true, manifest: normalizedManifest };
}

function stableJsonStringify(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableJsonStringify(entry)).join(",")}]`;
  }
  const keys = Object.keys(value).sort();
  const body = keys.map((key) => `${JSON.stringify(key)}:${stableJsonStringify(value[key])}`).join(",");
  return `{${body}}`;
}

async function sha256HexFromUtf8(text) {
  return bytesToHex(await sha256(utf8ToBytes(String(text || ""))));
}

async function sha256HexFromJson(value) {
  return sha256HexFromUtf8(stableJsonStringify(value));
}

function trainerQuestRoot(questId) {
  return `${TRAINER_ROOT_PATH}/quests/${questId}`;
}

function trainerAttemptsRoot(questId) {
  return `${trainerQuestRoot(questId)}/attempts`;
}

function trainerLoadoutsRoot(questId) {
  return `${trainerQuestRoot(questId)}/loadouts`;
}

function trainerAttemptRoot(questId, attemptId) {
  return `${trainerAttemptsRoot(questId)}/${attemptId}`;
}

function trainerLoadoutRoot(questId, loadoutId) {
  return `${trainerLoadoutsRoot(questId)}/${loadoutId}`;
}

function trainerActiveLoadoutMetaKey(questId) {
  return `${TRAINER_ACTIVE_LOADOUT_META_KEY_PREFIX}${questId}`;
}

function trainerQuestId(value) {
  const raw = String(value || "").trim();
  return raw || TRAINER_DEFAULT_QUEST_ID;
}

function trainerParseJsonSafe(raw, fallback = null) {
  if (typeof raw !== "string" || !raw.trim()) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function trainerNormalizeCoachingMode(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "manual" || raw === "reject") return raw;
  return "approve";
}

function trainerNormalizeCoachingState(value) {
  const source = isPlainObject(value) ? value : {};
  return {
    enabled: source.enabled === true,
    mode: trainerNormalizeCoachingMode(source.mode),
  };
}

function trainerDocRoleFromPath(pathValue) {
  const path = String(pathValue || "");
  const base = path.split("/").pop() || "";
  const lowered = base.toLowerCase();
  if (lowered === "skill.md") return "skill";
  if (lowered === "tools.md" || lowered === "tool.md") return "tools";
  if (lowered === "heartbeat.md") return "heartbeat";
  if (lowered === "goals.md" || lowered === "goal.md") return "goals";
  if (lowered === "penalty.md") return "penalty";
  return "other";
}

async function idbReqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("IDB_REQUEST_FAILED"));
  });
}

async function idbTxDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("IDB_TX_FAILED"));
    tx.onabort = () => reject(tx.error || new Error("IDB_TX_ABORTED"));
  });
}

async function idbGetAll(storeName) {
  const db = await openDb();
  const tx = db.transaction([storeName], "readonly");
  const req = tx.objectStore(storeName).getAll();
  const rows = await idbReqToPromise(req);
  await idbTxDone(tx);
  return Array.isArray(rows) ? rows : [];
}

function assertAllowlistedUrl(url) {
  const u = new URL(url, safeOrigin() || "http://localhost");
  const origin = safeOrigin();
  if (origin && u.origin !== origin) {
    throw new Error("NETWORK_ORIGIN_NOT_ALLOWLISTED");
  }
}

function normalizeHttpMethod(method) {
  const m = String(method || "GET").trim().toUpperCase();
  return m || "GET";
}

function parseUrlOrigin(url) {
  const u = new URL(String(url || ""), safeOrigin() || "http://localhost");
  return u.origin;
}

function isSameOriginHttpUrl(url) {
  const localOrigin = safeOrigin();
  if (!localOrigin) return false;
  try {
    return parseUrlOrigin(url) === localOrigin;
  } catch {
    return false;
  }
}

function parseOriginMethods(methods) {
  if (!Array.isArray(methods) || methods.length === 0) return null;
  const out = methods
    .map((m) => normalizeHttpMethod(m))
    .filter(Boolean);
  return out.length > 0 ? Array.from(new Set(out)) : null;
}

function matchingOriginGrant({ origin, capability, method }) {
  for (const grant of state.originGrants) {
    if (!grant || grant.origin !== origin || grant.capability !== capability) continue;
    if (Array.isArray(grant.methods) && grant.methods.length > 0 && !grant.methods.includes(method)) continue;
    return grant;
  }
  return null;
}

function evaluateOriginAccess({ url, capability = "web_fetch", method = "GET", consume = true }) {
  const origin = parseUrlOrigin(url);
  const methodNorm = normalizeHttpMethod(method);
  const localOrigin = safeOrigin();

  if (localOrigin && origin === localOrigin) {
    return {
      allowed: true,
      sameOrigin: true,
      origin,
      capability,
      method: methodNorm,
      grantId: null,
      scope: "same-origin",
    };
  }

  const grant = matchingOriginGrant({ origin, capability: String(capability || ""), method: methodNorm });
  if (!grant) {
    return {
      allowed: false,
      origin,
      capability,
      method: methodNorm,
      error: "NETWORK_BLOCKED",
    };
  }

  if (consume && grant.scope === "once") {
    state.originGrants = state.originGrants.filter((g) => g && g.id !== grant.id);
  }

  return {
    allowed: true,
    sameOrigin: false,
    origin,
    capability,
    method: methodNorm,
    grantId: grant.id,
    scope: grant.scope,
  };
}

function evaluatePermissionPolicyForNetworkFetch({ url, method = "GET", capability = "web_fetch", consume = true }) {
  const sameOrigin = isSameOriginHttpUrl(url);
  if (sameOrigin || !shouldEnforcePermissionPolicy()) {
    return { allowed: true, sameOrigin, reason: null, details: {} };
  }

  const permissionId = "network.fetch";
  const missingPermission = denyIfMissingPermission(permissionId);
  if (missingPermission) {
    return {
      allowed: false,
      reason: "missing_permission",
      envelope: missingPermission,
      details: permissionDeniedReasonDetails("missing_permission", { permissionId }),
    };
  }

  const origin = parseUrlOrigin(url);
  const allowedOrigins = permissionPolicyAllowedOrigins(permissionId);
  if (!permissionOriginsAllowOrigin(allowedOrigins, origin)) {
    return {
      allowed: false,
      reason: "origin_not_allowed",
      envelope: permissionDeniedEnvelope({
        details: permissionDeniedReasonDetails("origin_not_allowed", {
          permissionId,
          origin,
          allowedOrigins,
        }),
      }),
      details: permissionDeniedReasonDetails("origin_not_allowed", {
        permissionId,
        origin,
        allowedOrigins,
      }),
    };
  }

  const originAccess = evaluateOriginAccess({ url, capability, method, consume });
  if (!originAccess.allowed) {
    return {
      allowed: false,
      reason: "approval_required",
      envelope: permissionDeniedEnvelope({
        details: permissionDeniedReasonDetails("approval_required", {
          permissionId,
          origin,
          capability,
          method: normalizeHttpMethod(method),
        }),
      }),
      details: permissionDeniedReasonDetails("approval_required", {
        permissionId,
        origin,
        capability,
        method: normalizeHttpMethod(method),
      }),
    };
  }

  return { allowed: true, sameOrigin: false, reason: null, details: {} };
}

async function requestOriginGrant({ url, capability = "web_fetch", scope = "once", methods }) {
  const origin = parseUrlOrigin(url);
  const methodList = parseOriginMethods(methods);
  const scopeNorm = scope === "session" ? "session" : "once";
  const cap = String(capability || "web_fetch");
  const methodsSummary = methodList && methodList.length > 0 ? methodList.join(",") : "any";
  const body = `Origin grant (${scopeNorm}): ${cap} @ ${origin} methods=${methodsSummary}`;
  const decision = await requestApproval({ title: "Approval", body });
  if (decision !== "approve") {
    return {
      ok: false,
      error: "APPROVAL_REJECTED",
      origin,
      capability: cap,
      scope: scopeNorm,
    };
  }

  const grant = {
    id: randomId("og"),
    origin,
    capability: cap,
    scope: scopeNorm,
    methods: methodList,
    createdAtMs: nowMs(),
  };
  state.originGrants.push(grant);
  return { ok: true, grantId: grant.id, origin, capability: cap, scope: scopeNorm, methods: methodList };
}

function revokeOriginGrant(grantId) {
  const id = String(grantId || "").trim();
  if (!id) return { ok: false, error: "INVALID_GRANT_ID", removed: false };
  const before = state.originGrants.length;
  state.originGrants = state.originGrants.filter((g) => g && g.id !== id);
  return { ok: true, removed: state.originGrants.length < before, grantId: id };
}

async function apiJson(url, opts = {}) {
  assertAllowlistedUrl(url);
  const headers = {
    "content-type": "application/json",
    ...(opts.headers || {}),
  };
  const hintedTeamCode = normalizeTeamCodeHint(state?.teamCodeHint);
  if (
    hintedTeamCode &&
    headers["x-team-code-hint"] === undefined &&
    headers["X-Team-Code-Hint"] === undefined
  ) {
    headers["x-team-code-hint"] = hintedTeamCode;
  }
  const res = await fetch(url, {
    ...opts,
    credentials: "include",
    headers,
  });
  const data = await res.json().catch(() => ({}));
  const responseTeamCode = normalizeTeamCodeHint(data?.teamCode);
  if (responseTeamCode && responseTeamCode !== state?.teamCodeHint) {
    state.teamCodeHint = responseTeamCode;
    metaSet("teamCodeHint", responseTeamCode).catch(() => {
      // Non-fatal; hint is best-effort.
    });
  }
  if (!res.ok) {
    const err = data?.error || `HTTP_${res.status}`;
    throw new Error(err);
  }
  return data;
}

function normalizeToolErrorCode(message, fallback = "UNSUPPORTED") {
  const raw = String(message || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_");
  if (!raw) return String(fallback || "UNSUPPORTED");
  return raw;
}

function isRetryableAgentTownErrorCode(code) {
  const normalized = String(code || "").trim().toUpperCase();
  return normalized.startsWith("WAITING_");
}

function ensureAgentTownCeremonyStore() {
  if (!state.agentTownCeremonyByTeam || typeof state.agentTownCeremonyByTeam !== "object") {
    state.agentTownCeremonyByTeam = {};
  }
  return state.agentTownCeremonyByTeam;
}

async function resolveAgentTownTeamCode(rawTeamCode) {
  const explicit = typeof rawTeamCode === "string" ? rawTeamCode.trim() : "";
  if (explicit) return explicit;
  const appState = await apiJson("/api/state", { method: "GET" });
  const inferred = typeof appState?.teamCode === "string" ? appState.teamCode.trim() : "";
  if (!inferred) throw new Error("MISSING_TEAM_CODE");
  return inferred;
}

async function resolveAgentTownHouseId(rawHouseId) {
  const explicit = typeof rawHouseId === "string" ? rawHouseId.trim() : "";
  if (explicit) return explicit;
  const appState = await apiJson("/api/state", { method: "GET" });
  const inferred = typeof appState?.houseId === "string" ? appState.houseId.trim() : "";
  if (!inferred) throw new Error("MISSING_HOUSE_ID");
  return inferred;
}

function makeCeremonyRevealKeyInfo({ direction = "", teamCode = "" }) {
  return `elizatown-ceremony-reveal-v1|dir=${direction}|team=${teamCode || ""}`;
}

async function deriveCeremonyRevealKey({ sharedSecret, direction, teamCode, usages = ["encrypt"] }) {
  const baseKey = await crypto.subtle.importKey("raw", sharedSecret, "HKDF", false, ["deriveKey"]);
  const info = utf8ToBytes(makeCeremonyRevealKeyInfo({ direction, teamCode }));
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: new Uint8Array([]), info },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    usages,
  );
}

async function encryptCeremonyRevealForHouse({ revealBytes, recipientRevealPub, direction, teamCode }) {
  let recipientBytes;
  try {
    recipientBytes = b64ToBytes(recipientRevealPub || "");
  } catch {
    recipientBytes = null;
  }
  if (!recipientBytes || recipientBytes.length === 0) throw new Error("INVALID_REVEAL_PUB");

  let recipientPub;
  try {
    recipientPub = await crypto.subtle.importKey(
      "spki",
      recipientBytes,
      { name: "ECDH", namedCurve: "P-256" },
      false,
      [],
    );
  } catch {
    throw new Error("INVALID_REVEAL_PUB");
  }

  const eph = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );
  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: recipientPub },
    eph.privateKey,
    256,
  );
  const sharedSecret = new Uint8Array(sharedBits);
  const key = await deriveCeremonyRevealKey({
    sharedSecret,
    direction,
    teamCode,
    usages: ["encrypt"],
  });

  const aadBytes = utf8ToBytes(JSON.stringify({ v: 1, direction, teamCode: teamCode || null }));
  const plaintext = utf8ToBytes(JSON.stringify({ v: 1, reveal: bytesToB64(revealBytes) }));
  const iv = randomBytes(12);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: aadBytes },
    key,
    plaintext,
  );
  const epk = new Uint8Array(await crypto.subtle.exportKey("spki", eph.publicKey));

  return {
    alg: CEREMONY_E2EE_P256_AESGCM_V1,
    epk: bytesToB64(epk),
    iv: bytesToB64(iv),
    ct: bytesToB64(new Uint8Array(ciphertext)),
    aad: bytesToB64(aadBytes),
  };
}

async function runAgentTownCeremonyCommit(params, toolName = "agent_town_ceremony_commit") {
  const startedAtMs = nowMs();
  let teamCode = "";
  try {
    teamCode = await resolveAgentTownTeamCode(params?.teamCode);
  } catch (e) {
    const message = String(e?.message || "MISSING_TEAM_CODE");
    return withToolMeta(toolName, startedAtMs, makeToolFailure("MISSING_TEAM_CODE", message));
  }

  const store = ensureAgentTownCeremonyStore();
  let entry = store[teamCode] || null;
  if (!entry || !entry.raBytes || !entry.revealPrivateKey || !entry.commit || !entry.revealPub) {
    try {
      const raBytes = randomBytes(32);
      const commit = bytesToB64(await sha256(raBytes));
      const revealPair = await crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveBits"],
      );
      const revealPub = bytesToB64(new Uint8Array(await crypto.subtle.exportKey("spki", revealPair.publicKey)));
      entry = {
        teamCode,
        raBytes,
        revealPrivateKey: revealPair.privateKey,
        commit,
        revealPub,
        createdAtMs: nowMs(),
        revealedAtMs: null,
      };
      store[teamCode] = entry;
    } catch (e) {
      const message = String(e?.message || "CEREMONY_COMMIT_PREP_FAILED");
      const code = normalizeToolErrorCode(message, "UNSUPPORTED");
      return withToolMeta(
        toolName,
        startedAtMs,
        makeToolFailure(code, message, { teamCode }),
      );
    }
  }

  try {
    const response = await apiJson("/api/agent/house/commit", {
      method: "POST",
      body: JSON.stringify({
        teamCode,
        commit: entry.commit,
        revealPub: entry.revealPub,
      }),
    });
    return withToolMeta(
      toolName,
      startedAtMs,
      makeToolSuccess({
        teamCode,
        commit: entry.commit,
        revealPub: entry.revealPub,
        response,
      }),
    );
  } catch (e) {
    const message = String(e?.message || "CEREMONY_COMMIT_FAILED");
    const code = normalizeToolErrorCode(message, "UNSUPPORTED");
    return withToolMeta(
      toolName,
      startedAtMs,
      makeToolFailure(code, message, { teamCode }, isRetryableAgentTownErrorCode(code)),
    );
  }
}

async function runAgentTownCeremonyReveal(params, toolName = "agent_town_ceremony_reveal") {
  const startedAtMs = nowMs();
  let teamCode = "";
  try {
    teamCode = await resolveAgentTownTeamCode(params?.teamCode);
  } catch (e) {
    const message = String(e?.message || "MISSING_TEAM_CODE");
    return withToolMeta(toolName, startedAtMs, makeToolFailure("MISSING_TEAM_CODE", message));
  }

  const store = ensureAgentTownCeremonyStore();
  const entry = store[teamCode] || null;
  if (!entry || !entry.raBytes || !entry.revealPrivateKey || !entry.commit || !entry.revealPub) {
    return withToolMeta(
      toolName,
      startedAtMs,
      makeToolFailure("CEREMONY_NOT_COMMITTED", "Run ceremony commit first", { teamCode }),
    );
  }

  let humanRevealPub = typeof params?.humanRevealPub === "string" ? params.humanRevealPub.trim() : "";
  if (!humanRevealPub) {
    try {
      const material = await apiJson(`/api/agent/house/material?teamCode=${encodeURIComponent(teamCode)}`, {
        method: "GET",
      });
      humanRevealPub = typeof material?.humanRevealPub === "string" ? material.humanRevealPub.trim() : "";
    } catch (e) {
      const message = String(e?.message || "HOUSE_MATERIAL_FETCH_FAILED");
      const code = normalizeToolErrorCode(message, "UNSUPPORTED");
      return withToolMeta(
        toolName,
        startedAtMs,
        makeToolFailure(code, message, { teamCode }, isRetryableAgentTownErrorCode(code)),
      );
    }
  }
  if (!humanRevealPub) {
    return withToolMeta(
      toolName,
      startedAtMs,
      makeToolFailure(
        "WAITING_HUMAN_REVEAL_PUB",
        "Waiting for human reveal public key",
        { teamCode },
        true,
      ),
    );
  }

  let sealedForHuman;
  try {
    sealedForHuman = await encryptCeremonyRevealForHouse({
      revealBytes: entry.raBytes,
      recipientRevealPub: humanRevealPub,
      direction: "agent_to_human",
      teamCode,
    });
  } catch (e) {
    const message = String(e?.message || "CEREMONY_REVEAL_ENCRYPT_FAILED");
    const code = normalizeToolErrorCode(message, "UNSUPPORTED");
    return withToolMeta(
      toolName,
      startedAtMs,
      makeToolFailure(code, message, { teamCode }),
    );
  }

  try {
    const response = await apiJson("/api/agent/house/reveal", {
      method: "POST",
      body: JSON.stringify({
        teamCode,
        sealedForHuman,
      }),
    });
    entry.revealedAtMs = nowMs();
    return withToolMeta(
      toolName,
      startedAtMs,
      makeToolSuccess({
        teamCode,
        revealed: true,
        houseId: response?.houseId || null,
        response,
      }),
    );
  } catch (e) {
    const message = String(e?.message || "CEREMONY_REVEAL_FAILED");
    const code = normalizeToolErrorCode(message, "UNSUPPORTED");
    return withToolMeta(
      toolName,
      startedAtMs,
      makeToolFailure(code, message, { teamCode }, isRetryableAgentTownErrorCode(code)),
    );
  }
}

async function runAgentTownHouseRecover(_params, toolName = "agent_town_house_recover") {
  const startedAtMs = nowMs();
  try {
    await recoverHouse();
    return withToolMeta(
      toolName,
      startedAtMs,
      makeToolSuccess({
        houseId: state.houseId || null,
        ready: !!(state.houseId && state.krootBytes && state.kencBytes && state.kauthKey),
      }),
    );
  } catch (e) {
    const message = String(e?.message || "HOUSE_RECOVER_FAILED");
    const code = normalizeToolErrorCode(message, "UNSUPPORTED");
    return withToolMeta(
      toolName,
      startedAtMs,
      makeToolFailure(code, message, {}, isRetryableAgentTownErrorCode(code)),
    );
  }
}

async function runAgentTownHouseAppendNote(params, toolName = "agent_town_house_append_note") {
  const startedAtMs = nowMs();
  const text = typeof params?.text === "string" ? params.text.trim() : "";
  if (!text) {
    return withToolMeta(
      toolName,
      startedAtMs,
      makeToolFailure("INVALID_ARGUMENTS", "Missing note text"),
    );
  }
  try {
    const result = await appendE2eeEntry(text, {
      author: "lite",
      requireApproval: false,
    });
    if (!result || !result.houseId) {
      return withToolMeta(
        toolName,
        startedAtMs,
        makeToolFailure("HOUSE_APPEND_REJECTED", "House append was not completed"),
      );
    }
    return withToolMeta(
      toolName,
      startedAtMs,
      makeToolSuccess({
        houseId: result.houseId,
        entryId: result.entryId || null,
        author: result.author || "lite",
      }),
    );
  } catch (e) {
    const message = String(e?.message || "HOUSE_APPEND_FAILED");
    const code = normalizeToolErrorCode(message, "UNSUPPORTED");
    return withToolMeta(
      toolName,
      startedAtMs,
      makeToolFailure(code, message, {}, isRetryableAgentTownErrorCode(code)),
    );
  }
}

async function runAgentTownStateGetSession(_params, toolName = "agent_town_state_get_session") {
  const startedAtMs = nowMs();
  try {
    const session = await apiJson("/api/session", { method: "GET" });
    return withToolMeta(toolName, startedAtMs, makeToolSuccess({ session }));
  } catch (e) {
    const message = String(e?.message || "STATE_GET_SESSION_FAILED");
    const code = normalizeToolErrorCode(message, "UNSUPPORTED");
    return withToolMeta(toolName, startedAtMs, makeToolFailure(code, message));
  }
}

async function runAgentTownStateGetAgentState(params, toolName = "agent_town_state_get_agent_state") {
  const startedAtMs = nowMs();
  let teamCode = "";
  try {
    teamCode = await resolveAgentTownTeamCode(params?.teamCode);
    const snapshot = await apiJson(`/api/agent/state?teamCode=${encodeURIComponent(teamCode)}`, { method: "GET" });
    return withToolMeta(toolName, startedAtMs, makeToolSuccess({ teamCode, state: snapshot }));
  } catch (e) {
    const message = String(e?.message || "STATE_GET_AGENT_FAILED");
    const code = normalizeToolErrorCode(message, "UNSUPPORTED");
    return withToolMeta(toolName, startedAtMs, makeToolFailure(code, message, { teamCode: teamCode || null }));
  }
}

async function runAgentTownStateGetHouseContext(params, toolName = "agent_town_state_get_house_context") {
  const startedAtMs = nowMs();
  let houseId = "";
  try {
    houseId = await resolveAgentTownHouseId(params?.houseId);
    const context = await apiJson(`/api/house/${encodeURIComponent(houseId)}/meta`, { method: "GET" });
    return withToolMeta(toolName, startedAtMs, makeToolSuccess({ houseId, context }));
  } catch (e) {
    const message = String(e?.message || "STATE_GET_HOUSE_CONTEXT_FAILED");
    const code = normalizeToolErrorCode(message, "UNSUPPORTED");
    return withToolMeta(toolName, startedAtMs, makeToolFailure(code, message, { houseId: houseId || null }));
  }
}

async function runAgentTownStateGetPonyInbox(params, toolName = "agent_town_state_get_pony_inbox") {
  const startedAtMs = nowMs();
  let houseId = "";
  try {
    houseId = await resolveAgentTownHouseId(params?.houseId);
    const inbox = await apiJson(`/api/pony/inbox?houseId=${encodeURIComponent(houseId)}`, { method: "GET" });
    return withToolMeta(toolName, startedAtMs, makeToolSuccess({ houseId, inbox }));
  } catch (e) {
    const message = String(e?.message || "STATE_GET_PONY_INBOX_FAILED");
    const code = normalizeToolErrorCode(message, "UNSUPPORTED");
    return withToolMeta(toolName, startedAtMs, makeToolFailure(code, message, { houseId: houseId || null }));
  }
}

async function runAgentTownUiIntentTool(params, toolName) {
  const startedAtMs = nowMs();
  const safeParams = isPlainObject(params) ? params : {};
  const intentResult = await requestUiIntent(toolName, safeParams);
  if (intentResult.ok === true && intentResult.applied === true) {
    return withToolMeta(toolName, startedAtMs, makeToolSuccess(intentResult));
  }
  const code = String(intentResult?.error?.code || "UI_INTENT_INTERNAL");
  const message = String(intentResult?.error?.message || code || "UI intent failed");
  return withToolMeta(
    toolName,
    startedAtMs,
    makeToolFailure(code, message, {
      intent: toolName,
      stateSnapshot: intentResult?.stateSnapshot || null,
    }),
  );
}

function makeToolSuccess(data) {
  return { ok: true, data };
}

function makeToolFailure(code, message, details = {}, retryable = false) {
  return {
    ok: false,
    error: {
      code: String(code || "UNSUPPORTED"),
      message: String(message || code || "Tool failed"),
      retryable: !!retryable,
      details: details && typeof details === "object" ? details : {},
    },
  };
}

function withToolMeta(toolName, startedAtMs, envelope) {
  return {
    ...(envelope || {}),
    meta: {
      tool: String(toolName || ""),
      durationMs: Math.max(0, nowMs() - Number(startedAtMs || 0)),
    },
  };
}

function normalizeMaxBytes(value) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_WEB_FETCH_MAX_BYTES;
  return Math.min(MAX_WEB_FETCH_MAX_BYTES, n);
}

function normalizeCacheMode(value) {
  const raw = String(value || "allow-cache");
  if (raw === "bypass" || raw === "revalidate") return raw;
  return "allow-cache";
}

function cacheModeToFetchCache(mode) {
  if (mode === "bypass") return "no-store";
  if (mode === "revalidate") return "reload";
  return "default";
}

function normalizeExpectedMime(value) {
  const raw = String(value || "any").trim().toLowerCase();
  if (!raw || raw === "any") return "any";
  if (raw === "text/markdown") return "text/markdown";
  if (raw === "text/plain") return "text/plain";
  if (raw === "application/json") return "application/json";
  return "any";
}

function mimeMatchesExpected(expectedMime, contentType) {
  if (expectedMime === "any") return true;
  const ct = String(contentType || "").toLowerCase();
  return ct.startsWith(expectedMime);
}

function normalizeWebFetchInput(params) {
  const rawUrl = typeof params?.url === "string" ? params.url.trim() : "";
  if (!rawUrl) throw new Error("INVALID_ARGUMENTS");

  let parsed;
  try {
    parsed = new URL(rawUrl, safeOrigin() || "http://localhost");
  } catch {
    throw new Error("INVALID_ARGUMENTS");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("INVALID_ARGUMENTS");
  }

  return {
    url: parsed.toString(),
    maxBytes: normalizeMaxBytes(params?.maxBytes),
    followRedirects: params?.followRedirects !== false,
    cacheMode: normalizeCacheMode(params?.cacheMode),
    expectedMime: normalizeExpectedMime(params?.expectedMime),
  };
}

function truncateTextUtf8(text, maxBytes) {
  const bytes = utf8ToBytes(String(text || ""));
  if (bytes.length <= maxBytes) {
    return { text: String(text || ""), truncated: false };
  }
  const slice = bytes.slice(0, maxBytes);
  return { text: new TextDecoder().decode(slice), truncated: true };
}

function contentTypeSummary(headers) {
  const contentType = headers.get("content-type") || "";
  const etag = headers.get("etag") || null;
  const lastModified = headers.get("last-modified") || null;
  return { contentType, etag, lastModified };
}

async function webFetchSameOrigin(input) {
  const sameOrigin = isSameOriginHttpUrl(input.url);
  const response = await fetch(input.url, {
    method: "GET",
    credentials: sameOrigin ? "include" : "omit",
    redirect: input.followRedirects ? "follow" : "manual",
    cache: cacheModeToFetchCache(input.cacheMode),
  });

  const rawText = await response.text();
  const { text, truncated } = truncateTextUtf8(rawText, input.maxBytes);
  const { contentType, etag, lastModified } = contentTypeSummary(response.headers);

  if (!mimeMatchesExpected(input.expectedMime, contentType)) {
    return makeToolFailure("UNSUPPORTED", "MIME type mismatch", {
      expectedMime: input.expectedMime,
      contentType,
    });
  }

  return makeToolSuccess({
    url: input.url,
    finalUrl: response.url || input.url,
    status: response.status,
    contentType,
    etag,
    lastModified,
    sha256B64: bytesToB64(await sha256(utf8ToBytes(text))),
    text,
    truncated,
    fromCache: false,
  });
}

function shouldProxyFallbackForFetchError(error) {
  const msg = String(error?.message || error || "").toLowerCase();
  if (!msg) return true;
  return (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("load failed") ||
    msg.includes("cors") ||
    msg.includes("network request") ||
    msg.includes("content security policy") ||
    msg.includes("violates the following content security policy") ||
    msg.includes("refused to connect")
  );
}

async function webFetchCrossOriginViaProxy(input) {
  const res = await fetch(WEB_FETCH_PROXY_PATH, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      url: input.url,
      maxBytes: input.maxBytes,
      followRedirects: input.followRedirects,
      cacheMode: input.cacheMode,
      expectedMime: input.expectedMime,
    }),
  });

  const payload = await res.json().catch(() => null);
  if (payload && typeof payload === "object") {
    if (payload.ok === true) return payload;
    if (payload.ok === false && payload.error && typeof payload.error === "object") return payload;
  }

  return makeToolFailure("UNSUPPORTED", "Proxy fetch failed", {
    status: res.status || 0,
    url: input.url,
  });
}

async function runWebFetch(params, toolName = "web_fetch") {
  const startedAtMs = nowMs();
  let normalized;
  try {
    normalized = normalizeWebFetchInput(params || {});
  } catch (e) {
    if (String(e?.message || "") === "INVALID_ARGUMENTS") {
      return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Invalid web_fetch arguments"));
    }
    return withToolMeta(toolName, startedAtMs, makeToolFailure("UNSUPPORTED", e?.message || "web_fetch failed"));
  }

  const sameOrigin = isSameOriginHttpUrl(normalized.url);
  const shouldApplyPermissionPolicy = toolName !== "skill_fetch";
  if (shouldApplyPermissionPolicy) {
    const policyDecision = evaluatePermissionPolicyForNetworkFetch({
      url: normalized.url,
      method: "GET",
      capability: "web_fetch",
      consume: true,
    });
    if (!policyDecision.allowed) {
      return withToolMeta(toolName, startedAtMs, policyDecision.envelope);
    }
  }

  try {
    const directEnvelope = await webFetchSameOrigin(normalized);
    return withToolMeta(toolName, startedAtMs, directEnvelope);
  } catch (e) {
    if (sameOrigin || !shouldProxyFallbackForFetchError(e)) {
      return withToolMeta(toolName, startedAtMs, makeToolFailure("UNSUPPORTED", String(e?.message || "web_fetch failed")));
    }

    const rate = consumeHttpRateLimit(normalized.url);
    if (!rate.ok) {
      return withToolMeta(
        toolName,
        startedAtMs,
        makeToolFailure("RATE_LIMIT", "Rate limit exceeded", { origin: rate.origin, retryAfterMs: rate.retryAfterMs }),
      );
    }

    try {
      const proxyEnvelope = await webFetchCrossOriginViaProxy(normalized);
      return withToolMeta(toolName, startedAtMs, proxyEnvelope);
    } catch (proxyErr) {
      return withToolMeta(
        toolName,
        startedAtMs,
        makeToolFailure("UNSUPPORTED", proxyErr?.message || "web_fetch failed"),
      );
    }
  }
}

function envelopeToToolResult(envelope, toolName) {
  return liteToolResult(JSON.stringify(envelope), {
    dispatchPath: LITE_TOOL_DISPATCH_PATH,
    tool: String(toolName || ""),
    ok: envelope?.ok === true,
    errorCode: envelope?.ok === false ? envelope?.error?.code || null : null,
  });
}

function normalizeHttpTimeoutMs(value) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return DEFAULT_HTTP_TIMEOUT_MS;
  if (n < MIN_HTTP_TIMEOUT_MS) return MIN_HTTP_TIMEOUT_MS;
  if (n > MAX_HTTP_TIMEOUT_MS) return MAX_HTTP_TIMEOUT_MS;
  return n;
}

function normalizeHttpResponseMode(value) {
  const mode = String(value || "auto").trim().toLowerCase();
  if (mode === "json" || mode === "text" || mode === "base64") return mode;
  return "auto";
}

function normalizeHttpMaxBytes(value) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_HTTP_MAX_BYTES;
  return Math.min(MAX_WEB_FETCH_MAX_BYTES, n);
}

function normalizeObjectRecord(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  return input;
}

function normalizeHttpHeaders(input) {
  const src = normalizeObjectRecord(input);
  const out = {};
  for (const [k, v] of Object.entries(src)) {
    const key = String(k || "").trim().toLowerCase();
    if (!key) continue;
    if (v == null) continue;
    out[key] = String(v);
  }
  return out;
}

function normalizeHttpQuery(input) {
  const src = normalizeObjectRecord(input);
  const out = {};
  for (const [k, v] of Object.entries(src)) {
    const key = String(k || "").trim();
    if (!key) continue;
    if (Array.isArray(v)) {
      out[key] = v.map((x) => String(x));
    } else {
      out[key] = String(v);
    }
  }
  return out;
}

function applyHttpQuery(url, query) {
  const parsed = new URL(url);
  for (const [k, v] of Object.entries(query || {})) {
    parsed.searchParams.delete(k);
    if (Array.isArray(v)) {
      for (const entry of v) parsed.searchParams.append(k, String(entry));
    } else {
      parsed.searchParams.set(k, String(v));
    }
  }
  return parsed.toString();
}

function normalizeHttpBody(body, headers) {
  if (body == null) {
    return { wire: null, fetchBody: null, byteLength: 0 };
  }
  if (typeof body === "string") {
    return {
      wire: { kind: "text", text: body },
      fetchBody: body,
      byteLength: utf8ToBytes(body).length,
    };
  }
  if (typeof body !== "object") {
    const text = String(body);
    return {
      wire: { kind: "text", text },
      fetchBody: text,
      byteLength: utf8ToBytes(text).length,
    };
  }

  const hasOwn = (key) => Object.prototype.hasOwnProperty.call(body, key);
  const hasExplicitKind = typeof body.kind === "string" && body.kind.trim();
  const kind = hasExplicitKind ? String(body.kind).trim().toLowerCase() : "";

  if (!hasExplicitKind) {
    if (hasOwn("json")) {
      const jsonValue = body.json;
      const text = JSON.stringify(jsonValue);
      if (!headers["content-type"]) headers["content-type"] = "application/json";
      return {
        wire: { kind: "json", json: jsonValue },
        fetchBody: text,
        byteLength: utf8ToBytes(text).length,
      };
    }
    if (hasOwn("text")) {
      const text = typeof body.text === "string" ? body.text : String(body.text ?? "");
      return {
        wire: { kind: "text", text },
        fetchBody: text,
        byteLength: utf8ToBytes(text).length,
      };
    }
    if (hasOwn("base64")) {
      const base64 = typeof body.base64 === "string" ? body.base64 : "";
      const bytes = b64ToBytes(base64);
      return {
        wire: { kind: "base64", base64 },
        fetchBody: bytes,
        byteLength: bytes.length,
      };
    }
    // Shorthand: treat plain objects as JSON payloads.
    const text = JSON.stringify(body);
    if (!headers["content-type"]) headers["content-type"] = "application/json";
    return {
      wire: { kind: "json", json: body },
      fetchBody: text,
      byteLength: utf8ToBytes(text).length,
    };
  }

  if (kind === "json") {
    const jsonValue = body.json !== undefined ? body.json : {};
    const text = JSON.stringify(jsonValue);
    if (!headers["content-type"]) headers["content-type"] = "application/json";
    return {
      wire: { kind: "json", json: jsonValue },
      fetchBody: text,
      byteLength: utf8ToBytes(text).length,
    };
  }
  if (kind === "text") {
    const text = typeof body.text === "string" ? body.text : String(body.text ?? "");
    return {
      wire: { kind: "text", text },
      fetchBody: text,
      byteLength: utf8ToBytes(text).length,
    };
  }
  if (kind === "base64") {
    const base64 = typeof body.base64 === "string" ? body.base64 : "";
    const bytes = b64ToBytes(base64);
    return {
      wire: { kind: "base64", base64 },
      fetchBody: bytes,
      byteLength: bytes.length,
    };
  }
  throw new Error("INVALID_ARGUMENTS");
}

function normalizeHttpAuthInput(auth) {
  if (!auth || typeof auth !== "object") return { kind: "none" };
  const kind = String(auth.kind || "none").trim().toLowerCase();
  if (kind === "none") return { kind: "none" };
  if (kind === "bearer_secret_ref") {
    const secretRef = typeof auth.secretRef === "string" ? auth.secretRef.trim() : "";
    if (!secretRef) throw new Error("INVALID_ARGUMENTS");
    return { kind, secretRef };
  }
  throw new Error("INVALID_ARGUMENTS");
}

function isValidSecretName(name) {
  return /^[A-Za-z0-9._-]{1,128}$/.test(String(name || ""));
}

function redactStringSecrets(text, secrets) {
  let out = String(text || "");
  for (const secret of secrets || []) {
    if (typeof secret !== "string" || !secret) continue;
    out = out.split(secret).join("****");
    out = out.split(`Bearer ${secret}`).join("Bearer ****");
  }
  return out;
}

function deepRedactSecrets(value, secrets) {
  if (typeof value === "string") return redactStringSecrets(value, secrets);
  if (Array.isArray(value)) return value.map((v) => deepRedactSecrets(v, secrets));
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = deepRedactSecrets(v, secrets);
    }
    return out;
  }
  return value;
}

function redactEnvelopeSecrets(envelope, secrets) {
  if (!Array.isArray(secrets) || secrets.length === 0) return envelope;
  return deepRedactSecrets(envelope, secrets);
}

function applyHttpAuthToHeaders(auth, headers) {
  const outHeaders = { ...(headers || {}) };
  const secretValues = [];
  if (!auth || auth.kind === "none") {
    return { ok: true, headers: outHeaders, secretValues };
  }
  if (auth.kind === "bearer_secret_ref") {
    const secretRef = String(auth.secretRef || "");
    const value = state.secretStore?.[secretRef];
    if (typeof value !== "string" || !value) {
      return {
        ok: false,
        failure: makeToolFailure("NOT_FOUND", "Secret not found", { secretRef }),
      };
    }
    outHeaders.authorization = `Bearer ${value}`;
    secretValues.push(value, `Bearer ${value}`);
    return { ok: true, headers: outHeaders, secretValues };
  }
  return {
    ok: false,
    failure: makeToolFailure("INVALID_ARGUMENTS", "Unsupported auth mode"),
  };
}

function normalizeHttpRequestInput(params) {
  const rawUrl = typeof params?.url === "string" ? params.url.trim() : "";
  if (!rawUrl) throw new Error("INVALID_ARGUMENTS");

  let parsed;
  try {
    parsed = new URL(rawUrl, safeOrigin() || "http://localhost");
  } catch {
    throw new Error("INVALID_ARGUMENTS");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("INVALID_ARGUMENTS");

  const method = normalizeHttpMethod(params?.method || "GET");
  const allowedMethods = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"]);
  if (!allowedMethods.has(method)) throw new Error("INVALID_ARGUMENTS");

  const headers = normalizeHttpHeaders(params?.headers);
  const query = normalizeHttpQuery(params?.query);
  const normalized = {
    method,
    url: applyHttpQuery(parsed.toString(), query),
    query,
    headers,
    auth: normalizeHttpAuthInput(params?.auth),
    timeoutMs: normalizeHttpTimeoutMs(params?.timeoutMs),
    followRedirects: params?.followRedirects !== false,
    maxBytes: normalizeHttpMaxBytes(params?.maxBytes),
    responseMode: normalizeHttpResponseMode(params?.responseMode),
    body: null,
    fetchBody: null,
  };

  const bodyInfo = normalizeHttpBody(params?.body, normalized.headers);
  if (bodyInfo.byteLength > MAX_HTTP_BODY_BYTES) {
    throw new Error("SIZE_LIMIT");
  }
  normalized.body = bodyInfo.wire;
  normalized.fetchBody = bodyInfo.fetchBody;
  return normalized;
}

function consumeHttpRateLimit(url) {
  const origin = parseUrlOrigin(url);
  const now = nowMs();
  const prev = state.httpRateLimit.get(origin) || [];
  const next = prev.filter((t) => now - t < HTTP_RATE_LIMIT_WINDOW_MS);
  if (next.length >= HTTP_RATE_LIMIT_MAX) {
    const retryAfterMs = Math.max(1, HTTP_RATE_LIMIT_WINDOW_MS - (now - next[0]));
    state.httpRateLimit.set(origin, next);
    return { ok: false, origin, retryAfterMs };
  }
  next.push(now);
  state.httpRateLimit.set(origin, next);
  return { ok: true, origin, retryAfterMs: 0 };
}

function headersToObject(headers) {
  const out = {};
  if (!headers || typeof headers.entries !== "function") return out;
  for (const [k, v] of headers.entries()) {
    out[String(k || "").toLowerCase()] = String(v || "");
  }
  return out;
}

function decodeHttpResponse(bytes, responseMode, contentType) {
  const bodyText = new TextDecoder().decode(bytes);
  let bodyJson = null;
  let bodyBase64 = "";
  const mode = normalizeHttpResponseMode(responseMode);
  const looksJson = String(contentType || "").toLowerCase().includes("application/json");
  if (mode === "json" || (mode === "auto" && looksJson)) {
    try {
      bodyJson = JSON.parse(bodyText);
    } catch {
      bodyJson = null;
    }
  }
  if (mode === "base64") {
    bodyBase64 = bytesToB64(bytes);
  }
  return { bodyText, bodyJson, bodyBase64 };
}

async function runHttpRequestSameOrigin(input) {
  const startedAtMs = nowMs();
  const sameOrigin = isSameOriginHttpUrl(input.url);
  const abort = new AbortController();
  const timeoutId = setTimeout(() => abort.abort(), input.timeoutMs);
  let response;
  try {
    response = await fetch(input.url, {
      method: input.method,
      headers: input.headers,
      body: input.fetchBody == null ? undefined : input.fetchBody,
      credentials: sameOrigin ? "include" : "omit",
      redirect: input.followRedirects ? "follow" : "manual",
      signal: abort.signal,
    });
  } catch (e) {
    clearTimeout(timeoutId);
    if (e?.name === "AbortError") {
      return makeToolFailure("TIMEOUT", "Request timed out", { timeoutMs: input.timeoutMs }, true);
    }
    return makeToolFailure("UNSUPPORTED", e?.message || "Request failed");
  } finally {
    clearTimeout(timeoutId);
  }

  const bytesRaw = new Uint8Array(await response.arrayBuffer());
  const truncated = bytesRaw.length > input.maxBytes;
  const bytes = truncated ? bytesRaw.slice(0, input.maxBytes) : bytesRaw;
  const headers = headersToObject(response.headers);
  const decoded = decodeHttpResponse(bytes, input.responseMode, headers["content-type"] || "");

  return makeToolSuccess({
    status: response.status,
    finalUrl: response.url || input.url,
    headers,
    bodyText: decoded.bodyText,
    bodyJson: decoded.bodyJson,
    bodyBase64: decoded.bodyBase64,
    truncated,
    timing: {
      startedAtMs,
      durationMs: Math.max(0, nowMs() - startedAtMs),
    },
  });
}

function shouldProxyFallbackForHttpEnvelope(envelope) {
  if (!envelope || envelope.ok !== false || !envelope.error || typeof envelope.error !== "object") {
    return false;
  }
  const code = String(envelope.error.code || "").toUpperCase();
  if (code === "TIMEOUT") return true;
  if (code !== "UNSUPPORTED") return false;
  const msg = String(envelope.error.message || "").toLowerCase();
  if (!msg) return true;
  return (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("load failed") ||
    msg.includes("cors") ||
    msg.includes("network request") ||
    msg.includes("content security policy") ||
    msg.includes("violates the following content security policy") ||
    msg.includes("refused to connect")
  );
}

async function runHttpRequestCrossOriginViaProxy(input) {
  const res = await fetch(HTTP_REQUEST_PROXY_PATH, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      url: input.url,
      method: input.method,
      query: input.query,
      headers: input.headers,
      body: input.body,
      timeoutMs: input.timeoutMs,
      followRedirects: input.followRedirects,
      maxBytes: input.maxBytes,
      responseMode: input.responseMode,
    }),
  });
  const payload = await res.json().catch(() => null);
  if (payload && typeof payload === "object") {
    if (payload.ok === true) return payload;
    if (payload.ok === false && payload.error && typeof payload.error === "object") return payload;
  }
  return makeToolFailure("UNSUPPORTED", "Proxy request failed", { status: res.status || 0 });
}

async function persistSecretStore() {
  await metaSet("secretStoreV1", { ...(state.secretStore || {}) });
}

async function runSecretSet(params, toolName = "secret_set") {
  const startedAtMs = nowMs();
  const policyDeny = denyIfMissingPermission("secrets.read");
  if (policyDeny) {
    return withToolMeta(toolName, startedAtMs, policyDeny);
  }
  const name = typeof params?.name === "string" ? params.name.trim() : "";
  const value = typeof params?.value === "string" ? params.value : "";
  if (!isValidSecretName(name) || !value) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Invalid secret_set arguments"));
  }

  const decision = await requestApproval({
    title: "Approval",
    body: `Secret set: ${name}`,
  });
  if (decision !== "approve") {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("APPROVAL_REJECTED", "Secret set rejected"));
  }

  state.secretStore[name] = value;
  await persistSecretStore();
  return withToolMeta(toolName, startedAtMs, makeToolSuccess({ name, stored: true }));
}

function runSecretList(_params, toolName = "secret_list") {
  const startedAtMs = nowMs();
  const policyDeny = denyIfMissingPermission("secrets.read");
  if (policyDeny) {
    return withToolMeta(toolName, startedAtMs, policyDeny);
  }
  const names = Object.keys(state.secretStore || {}).sort();
  return withToolMeta(toolName, startedAtMs, makeToolSuccess({ names, count: names.length }));
}

async function runSecretDelete(params, toolName = "secret_delete") {
  const startedAtMs = nowMs();
  const policyDeny = denyIfMissingPermission("secrets.read");
  if (policyDeny) {
    return withToolMeta(toolName, startedAtMs, policyDeny);
  }
  const name = typeof params?.name === "string" ? params.name.trim() : "";
  if (!isValidSecretName(name)) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Invalid secret name"));
  }
  if (!Object.prototype.hasOwnProperty.call(state.secretStore || {}, name)) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("NOT_FOUND", "Secret not found", { name }));
  }

  const decision = await requestApproval({
    title: "Approval",
    body: `Secret delete: ${name}`,
  });
  if (decision !== "approve") {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("APPROVAL_REJECTED", "Secret delete rejected"));
  }

  delete state.secretStore[name];
  await persistSecretStore();
  return withToolMeta(toolName, startedAtMs, makeToolSuccess({ name, deleted: true }));
}

function normalizeWsConnectTimeoutMs(value) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n <= 0) return WS_DEFAULT_CONNECT_TIMEOUT_MS;
  return Math.min(WS_MAX_CONNECT_TIMEOUT_MS, n);
}

function normalizeWsWaitMs(value) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 0) return WS_DEFAULT_RECV_WAIT_MS;
  return Math.min(WS_MAX_RECV_WAIT_MS, n);
}

function normalizeWsMaxMessages(value) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.min(WS_MAX_RECV_MESSAGES, n);
}

function normalizeWsUrl(raw) {
  const str = typeof raw === "string" ? raw.trim() : "";
  if (!str) throw new Error("INVALID_ARGUMENTS");
  let parsed;
  try {
    parsed = new URL(str, safeOrigin() || "http://localhost");
  } catch {
    throw new Error("INVALID_ARGUMENTS");
  }
  if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:") {
    throw new Error("INVALID_ARGUMENTS");
  }
  return parsed.toString();
}

function wsReadyStateName(socket) {
  if (!socket) return "closed";
  if (socket.readyState === WebSocket.CONNECTING) return "connecting";
  if (socket.readyState === WebSocket.OPEN) return "open";
  if (socket.readyState === WebSocket.CLOSING) return "closing";
  return "closed";
}

function parseWsMessageData(data) {
  if (typeof data === "string") {
    try {
      return { type: "json", text: data, json: JSON.parse(data) };
    } catch {
      return { type: "text", text: data };
    }
  }
  if (data instanceof ArrayBuffer) {
    return { type: "binary", base64: bytesToB64(new Uint8Array(data)) };
  }
  if (ArrayBuffer.isView(data)) {
    return { type: "binary", base64: bytesToB64(new Uint8Array(data.buffer)) };
  }
  return { type: "text", text: String(data ?? "") };
}

function wakeWsWaiters(session) {
  if (!session || !Array.isArray(session.waiters)) return;
  while (session.waiters.length > 0) {
    const fn = session.waiters.shift();
    try {
      fn();
    } catch {
      // ignore
    }
  }
}

function getWsSession(sessionId) {
  const id = typeof sessionId === "string" ? sessionId.trim() : "";
  if (!id) return null;
  return state.wsSessions.get(id) || null;
}

async function runWsOpen(params, toolName = "ws_open") {
  const startedAtMs = nowMs();
  let url;
  try {
    url = normalizeWsUrl(params?.url);
  } catch {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Invalid websocket URL"));
  }
  const protocols = Array.isArray(params?.protocols)
    ? params.protocols.map((p) => String(p || "").trim()).filter(Boolean).slice(0, 5)
    : [];
  const connectTimeoutMs = normalizeWsConnectTimeoutMs(params?.connectTimeoutMs);

  const result = await new Promise((resolve) => {
    let settled = false;
    let sessionId = "";
    let socket;
    try {
      socket = protocols.length > 0 ? new WebSocket(url, protocols) : new WebSocket(url);
      socket.binaryType = "arraybuffer";
    } catch (e) {
      resolve(makeToolFailure("UNSUPPORTED", e?.message || "WS_OPEN_FAILED"));
      return;
    }

    const finish = (envelope) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(envelope);
    };

    const timer = setTimeout(() => {
      try {
        socket.close();
      } catch {
        // ignore
      }
      finish(makeToolFailure("TIMEOUT", "WebSocket connect timeout", { connectTimeoutMs }, true));
    }, connectTimeoutMs);

    socket.addEventListener("open", () => {
      sessionId = randomId("ws");
      const session = {
        id: sessionId,
        url,
        socket,
        queue: [],
        waiters: [],
        closed: false,
        closeInfo: null,
      };
      state.wsSessions.set(sessionId, session);

      socket.addEventListener("message", (ev) => {
        const current = state.wsSessions.get(sessionId);
        if (!current) return;
        current.queue.push(parseWsMessageData(ev.data));
        wakeWsWaiters(current);
      });

      socket.addEventListener("close", (ev) => {
        const current = state.wsSessions.get(sessionId);
        if (!current) return;
        current.closed = true;
        current.closeInfo = {
          code: Number(ev.code || 0),
          reason: String(ev.reason || ""),
          wasClean: !!ev.wasClean,
        };
        wakeWsWaiters(current);
      });

      finish(
        makeToolSuccess({
          sessionId,
          url,
          readyState: "open",
          protocol: socket.protocol || "",
        }),
      );
    });

    socket.addEventListener("error", () => {
      finish(makeToolFailure("UNSUPPORTED", "WS_OPEN_FAILED"));
    });
  });

  return withToolMeta(toolName, startedAtMs, result);
}

function runWsStatus(params, toolName = "ws_status") {
  const startedAtMs = nowMs();
  const session = getWsSession(params?.sessionId);
  if (!session) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("NOT_FOUND", "WebSocket session not found"));
  }
  return withToolMeta(
    toolName,
    startedAtMs,
    makeToolSuccess({
      sessionId: session.id,
      url: session.url,
      readyState: wsReadyStateName(session.socket),
      protocol: session.socket?.protocol || "",
      queuedMessages: session.queue.length,
      closed: !!session.closed,
    }),
  );
}

function runWsSend(params, toolName = "ws_send") {
  const startedAtMs = nowMs();
  const session = getWsSession(params?.sessionId);
  if (!session || session.closed || !session.socket || session.socket.readyState !== WebSocket.OPEN) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("NOT_FOUND", "WebSocket session not open"));
  }

  const hasText = typeof params?.text === "string";
  const hasJson = params && Object.prototype.hasOwnProperty.call(params, "json");
  if ((hasText && hasJson) || (!hasText && !hasJson)) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Provide exactly one of text or json"));
  }

  const payload = hasText ? params.text : JSON.stringify(params.json);
  try {
    session.socket.send(payload);
  } catch (e) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("UNSUPPORTED", e?.message || "WS_SEND_FAILED"));
  }

  return withToolMeta(
    toolName,
    startedAtMs,
    makeToolSuccess({
      sessionId: session.id,
      sentBytes: utf8ToBytes(payload).length,
    }),
  );
}

async function runWsRecv(params, toolName = "ws_recv") {
  const startedAtMs = nowMs();
  const session = getWsSession(params?.sessionId);
  if (!session) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("NOT_FOUND", "WebSocket session not found"));
  }

  const maxMessages = normalizeWsMaxMessages(params?.maxMessages);
  const waitMs = normalizeWsWaitMs(params?.waitMs);
  const drain = () => session.queue.splice(0, maxMessages);

  if (session.queue.length > 0) {
    return withToolMeta(toolName, startedAtMs, makeToolSuccess({ messages: drain() }));
  }
  if (session.closed) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("NOT_FOUND", "WebSocket session closed"));
  }

  await new Promise((resolve) => {
    let done = false;
    let timerId = null;
    const wake = () => {
      if (done) return;
      done = true;
      if (timerId !== null) clearTimeout(timerId);
      const idx = session.waiters.indexOf(wake);
      if (idx >= 0) session.waiters.splice(idx, 1);
      resolve();
    };
    timerId = setTimeout(wake, waitMs);
    session.waiters.push(wake);
    if (session.queue.length > 0 || session.closed) wake();
  });

  if (session.queue.length > 0) {
    return withToolMeta(toolName, startedAtMs, makeToolSuccess({ messages: drain() }));
  }
  if (session.closed) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("NOT_FOUND", "WebSocket session closed"));
  }
  return withToolMeta(toolName, startedAtMs, makeToolSuccess({ messages: [] }));
}

function runWsClose(params, toolName = "ws_close") {
  const startedAtMs = nowMs();
  const session = getWsSession(params?.sessionId);
  if (!session) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("NOT_FOUND", "WebSocket session not found"));
  }

  try {
    if (session.socket && session.socket.readyState === WebSocket.OPEN) {
      session.socket.close(1000, "client-close");
    } else if (session.socket && session.socket.readyState === WebSocket.CONNECTING) {
      session.socket.close();
    }
  } catch {
    // ignore
  }
  session.closed = true;
  wakeWsWaiters(session);
  state.wsSessions.delete(session.id);
  return withToolMeta(toolName, startedAtMs, makeToolSuccess({ sessionId: session.id, closed: true }));
}

async function runHttpRequest(params, toolName = "http_request") {
  const startedAtMs = nowMs();
  let input;
  try {
    input = normalizeHttpRequestInput(params || {});
  } catch (e) {
    const msg = String(e?.message || "INVALID_ARGUMENTS");
    if (msg === "SIZE_LIMIT") {
      return withToolMeta(toolName, startedAtMs, makeToolFailure("SIZE_LIMIT", "Request payload too large"));
    }
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Invalid http_request arguments"));
  }

  const sameOrigin = isSameOriginHttpUrl(input.url);
  if (!sameOrigin) {
    const policyDecision = evaluatePermissionPolicyForNetworkFetch({
      url: input.url,
      method: input.method,
      capability: "web_fetch",
      consume: true,
    });
    if (!policyDecision.allowed) {
      return withToolMeta(toolName, startedAtMs, policyDecision.envelope);
    }
  }

  if (String(input?.auth?.mode || "") === "bearer_secret_ref") {
    const secretPermissionDeny = denyIfMissingPermission("secrets.read");
    if (secretPermissionDeny) {
      return withToolMeta(toolName, startedAtMs, secretPermissionDeny);
    }
  }

  const authApplied = applyHttpAuthToHeaders(input.auth, input.headers);
  if (!authApplied.ok) {
    return withToolMeta(toolName, startedAtMs, authApplied.failure);
  }
  input.headers = authApplied.headers;
  const secretValues = authApplied.secretValues || [];

  try {
    const directEnvelope = await runHttpRequestSameOrigin(input);
    if (sameOrigin || directEnvelope.ok === true || !shouldProxyFallbackForHttpEnvelope(directEnvelope)) {
      return withToolMeta(toolName, startedAtMs, redactEnvelopeSecrets(directEnvelope, secretValues));
    }

    const rate = consumeHttpRateLimit(input.url);
    if (!rate.ok) {
      return withToolMeta(
        toolName,
        startedAtMs,
        makeToolFailure("RATE_LIMIT", "Rate limit exceeded", { origin: rate.origin, retryAfterMs: rate.retryAfterMs }),
      );
    }

    const proxyEnvelope = await runHttpRequestCrossOriginViaProxy(input);
    return withToolMeta(toolName, startedAtMs, redactEnvelopeSecrets(proxyEnvelope, secretValues));
  } catch (e) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("UNSUPPORTED", e?.message || "http_request failed"));
  }
}

// --- PI-AI model configuration (NO MOCKS) ---
//
// Lite runs PI's agent loop in-browser and uses PI-AI providers for real LLM calls.
// We keep same-origin by default and route third-party providers through a same-origin
// proxy path to avoid browser CORS failures.
function defaultLlmBaseUrl() {
  const u = new URL("/api/llm/openai/v1", safeOrigin() || "http://localhost");
  return u.toString();
}

function llmProxyBaseUrl(upstreamBaseUrl) {
  const raw = String(upstreamBaseUrl || "").trim();
  const normalized = raw.replace(/\/+$/, "");
  const encoded = encodeURIComponent(normalized);
  const u = new URL(`/api/llm/proxy/${encoded}`, safeOrigin() || "http://localhost");
  return u.toString();
}

function parseConfiguredModelRef() {
  const providerHint = String(state.llmProvider || "openai").trim() || "openai";
  const modelHint = String(state.llmModelId || "gpt-4o-mini").trim() || "gpt-4o-mini";
  const rawRef = String(state.llmModelRef || "").trim();
  if (!rawRef) return { provider: providerHint, modelId: modelHint };

  const slash = rawRef.indexOf("/");
  if (slash > 0) {
    const provider = rawRef.slice(0, slash).trim();
    const modelId = rawRef.slice(slash + 1).trim();
    if (provider && modelId) return { provider, modelId };
  }
  return { provider: providerHint, modelId: rawRef };
}

function resolveLlmBaseUrl({ provider, templateBaseUrl }) {
  const explicitBase = String(state.llmBaseUrl || "").trim();
  const useProxy = state.llmUseProxy !== false;
  const baseRaw = explicitBase || String(templateBaseUrl || "").trim() || defaultLlmBaseUrl();

  const origin = safeOrigin();
  const resolved = new URL(baseRaw, origin || "http://localhost");
  if (useProxy) {
    const isOpenAiDefaultPath = provider === "openai" && !explicitBase;
    if (isOpenAiDefaultPath) {
      return defaultLlmBaseUrl();
    }
    if (origin && resolved.origin === origin) return resolved.toString();
    return llmProxyBaseUrl(resolved.toString());
  }

  const access = evaluateOriginAccess({
    url: resolved.toString(),
    capability: "llm",
    method: "POST",
    consume: false,
  });
  if (!access.allowed) {
    log(`llm base blocked by allowlist (fallback to same-origin): ${resolved.toString()}`);
    return defaultLlmBaseUrl();
  }
  return resolved.toString();
}

function getConfiguredModel() {
  const parsed = parseConfiguredModelRef();
  const provider = String(parsed.provider || "openai").trim() || "openai";
  const modelId = String(parsed.modelId || "gpt-4o-mini").trim() || "gpt-4o-mini";

  let template = null;
  try {
    template = getPiModel(provider, modelId) || null;
  } catch {
    template = null;
  }

  const api = String(state.llmApi || template?.api || "openai-completions").trim() || "openai-completions";
  const baseUrl = resolveLlmBaseUrl({ provider, templateBaseUrl: template?.baseUrl || "" });

  if (template) {
    return {
      ...template,
      id: modelId,
      name: template.name || modelId,
      api,
      provider,
      baseUrl,
      headers: { ...(template.headers || {}) },
    };
  }

  /** @type {import("@mariozechner/pi-ai").Model<any>} */
  return {
    id: modelId,
    name: modelId,
    api,
    provider,
    baseUrl,
    headers: {},
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128_000,
    maxTokens: 4096,
  };
}

function normalizeReasoningLevel(value) {
  const v = String(value || "")
    .trim()
    .toLowerCase();
  if (!v || v === "off" || v === "default") return null;
  if (v === "minimal" || v === "low" || v === "medium" || v === "high" || v === "xhigh") return v;
  return null;
}

function makeAssistant(text, { stopReason = "stop", errorMessage = null } = {}) {
  const model = getConfiguredModel();
  const msg = {
    role: "assistant",
    content: [{ type: "text", text: String(text || "") }],
    api: model.api,
    provider: model.provider,
    model: model.id,
    usage: {
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
      totalTokens: 0,
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
    },
    stopReason,
    timestamp: nowMs(),
  };
  if (errorMessage) msg.errorMessage = String(errorMessage || "");
  return msg;
}

const LITE_TOOL_SPECS = [
  {
    name: "lite_echo",
    label: "Lite Echo",
    description: "Echoes back input text.",
    sampleArgs: { text: "hello" },
  },
  {
    name: "lite_uppercase",
    label: "Lite Uppercase",
    description: "Converts input text to uppercase.",
    sampleArgs: { text: "openclaw" },
  },
  {
    name: "lite_add",
    label: "Lite Add",
    description: "Adds two numbers.",
    sampleArgs: { a: 2, b: 3 },
  },
  {
    name: "lite_now",
    label: "Lite Now",
    description: "Returns current timestamp.",
    sampleArgs: {},
  },
  {
    name: "lite_sleep",
    label: "Lite Sleep",
    description: "Waits for a bounded number of milliseconds.",
    sampleArgs: { ms: 1000 },
  },
  {
    name: "lite_sha256",
    label: "Lite SHA256",
    description: "Returns SHA-256 digest of input text (base64).",
    sampleArgs: { text: "tool smoke" },
  },
  {
    name: "web_fetch",
    label: "Web Fetch",
    description: "Fetches a page/document and returns text + metadata.",
    sampleArgs: { url: "https://example.com/skill.md", maxBytes: 2048 },
  },
  {
    name: "skill_fetch",
    label: "Skill Fetch",
    description: "Alias for web_fetch (skill-centric naming).",
    sampleArgs: { url: "https://example.com/skill.md", maxBytes: 2048 },
  },
  {
    name: "http_request",
    label: "HTTP Request",
    description: "Browser-native curl pendant for API workflows.",
    sampleArgs: { method: "GET", url: "https://example.com/api" },
  },
  {
    name: "trainer.list_runs",
    label: "Trainer List Runs",
    description: "List trainer run captures (newest-first).",
    sampleArgs: { limit: 10 },
  },
  {
    name: "trainer.get_run",
    label: "Trainer Get Run",
    description: "Read one trainer run bundle by attemptId.",
    sampleArgs: { attemptId: "latest" },
  },
  {
    name: "trainer.get_event",
    label: "Trainer Get Event",
    description: "Read one trainer event by attemptId + seq.",
    sampleArgs: { attemptId: "latest", seq: 1 },
  },
  {
    name: "trainer.list_actions",
    label: "Trainer List Actions",
    description: "List action-like tool calls extracted from trainer run traces.",
    sampleArgs: { limit: 20 },
  },
  {
    name: "trainer.invoke_action",
    label: "Trainer Invoke Action",
    description: "Invoke one existing non-trainer tool by actionId with params.",
    sampleArgs: { actionId: "http_request", params: { method: "GET", url: "https://example.com" } },
  },
  {
    name: "trainer.list_evidence",
    label: "Trainer List Evidence",
    description: "List executed tool-call evidence rows from trainer traces.",
    sampleArgs: { limit: 20 },
  },
  {
    name: "trainer.get_transcript_integrity",
    label: "Trainer Transcript Integrity",
    description: "Read transcript tool pairing/integrity diagnostics.",
    sampleArgs: {},
  },
  {
    name: "trainer.get_session_context",
    label: "Trainer Session Context",
    description: "Read runtime/session context snapshot with transcript diagnostics.",
    sampleArgs: {},
  },
  {
    name: "trainer.explain_not_used",
    label: "Trainer Explain Not Used",
    description: "Explain why a given actionId was not used in recent runs.",
    sampleArgs: { actionId: "http_request" },
  },
  {
    name: "trainer.delete_trace",
    label: "Trainer Delete Trace",
    description: "Delete one trainer run trace (approval required).",
    sampleArgs: { attemptId: "latest" },
  },
  {
    name: "trainer.clear_traces",
    label: "Trainer Clear Traces",
    description: "Delete all trainer run traces (approval required).",
    sampleArgs: {},
  },
  {
    name: "agent_town_ceremony_commit",
    label: "Agent Town Ceremony Commit",
    description: "Generates agent ceremony entropy/keys and posts /api/agent/house/commit.",
    sampleArgs: { teamCode: "TEAM-ABCD-EFGH" },
  },
  {
    name: "agent_town_ceremony_reveal",
    label: "Agent Town Ceremony Reveal",
    description: "Encrypts agent reveal for human and posts /api/agent/house/reveal.",
    sampleArgs: { teamCode: "TEAM-ABCD-EFGH" },
  },
  {
    name: "agent_town_house_recover",
    label: "Agent Town House Recover",
    description: "Recovers unlocked house key context from wallet flow for vault operations.",
    sampleArgs: {},
  },
  {
    name: "agent_town_house_append_note",
    label: "Agent Town House Append Note",
    description: "Encrypts/appends a note entry to /api/house/:id/append using recovered house keys.",
    sampleArgs: { text: "hello from agent" },
  },
  {
    name: "agent_town_state_get_session",
    label: "Agent Town State Session",
    description: "Reads /api/session snapshot for current browser session.",
    sampleArgs: {},
  },
  {
    name: "agent_town_state_get_agent_state",
    label: "Agent Town State Agent",
    description: "Reads /api/agent/state for a team code (or inferred runtime team code).",
    sampleArgs: { teamCode: "TEAM-ABCD-EFGH" },
  },
  {
    name: "agent_town_state_get_house_context",
    label: "Agent Town State House",
    description: "Reads /api/house/:id/meta for inferred or explicit house id.",
    sampleArgs: { houseId: "hs_example_house" },
  },
  {
    name: "agent_town_state_get_pony_inbox",
    label: "Agent Town State Pony Inbox",
    description: "Reads /api/pony/inbox for inferred or explicit house id.",
    sampleArgs: { houseId: "hs_example_house" },
  },
  {
    name: "agent_town_ui_open_modal",
    label: "Agent Town UI Open Modal",
    description: "Opens a whitelisted app modal without route replacement.",
    sampleArgs: { modal: "atlas", params: {} },
  },
  {
    name: "agent_town_ui_atlas_search",
    label: "Agent Town UI Atlas Search",
    description: "Opens Atlas modal and applies query/family/searchType intent state.",
    sampleArgs: { q: "sentinel", family: "ethereum", searchType: "keyword" },
  },
  {
    name: "agent_town_ui_pony_compose",
    label: "Agent Town UI Pony Compose",
    description: "Opens Pony modal and prefills compose draft fields.",
    sampleArgs: { toHouseId: "hs_receiver", subject: "Hello", draft: "Draft body" },
  },
  {
    name: "secret_set",
    label: "Secret Set",
    description: "Store/update a secret value by reference name.",
    sampleArgs: { name: "moltbook.api_key", value: "redacted" },
  },
  {
    name: "secret_list",
    label: "Secret List",
    description: "List secret reference names (without raw values).",
    sampleArgs: {},
  },
  {
    name: "secret_delete",
    label: "Secret Delete",
    description: "Delete a secret by reference name.",
    sampleArgs: { name: "moltbook.api_key" },
  },
  {
    name: "ws_open",
    label: "WS Open",
    description: "Open a websocket session and return a session id.",
    sampleArgs: { url: "wss://example.com/socket" },
  },
  {
    name: "ws_send",
    label: "WS Send",
    description: "Send text/json payload over websocket session.",
    sampleArgs: { sessionId: "ws_...", text: "hello" },
  },
  {
    name: "ws_recv",
    label: "WS Recv",
    description: "Receive queued websocket messages with timeout.",
    sampleArgs: { sessionId: "ws_...", maxMessages: 1, waitMs: 1000 },
  },
  {
    name: "ws_close",
    label: "WS Close",
    description: "Close websocket session and release resources.",
    sampleArgs: { sessionId: "ws_..." },
  },
  {
    name: "ws_status",
    label: "WS Status",
    description: "Inspect websocket session state.",
    sampleArgs: { sessionId: "ws_..." },
  },
  {
    name: "workspace_mkdir",
    label: "Workspace Mkdir",
    description: "Create a directory inside workspace root.",
    sampleArgs: { path: "workspace/notes" },
  },
  {
    name: "workspace_list",
    label: "Workspace List",
    description: "List files/directories under workspace prefix.",
    sampleArgs: { path: "workspace/" },
  },
  {
    name: "workspace_read_file",
    label: "Workspace Read",
    description: "Read file content from workspace.",
    sampleArgs: { path: "workspace/skill.md" },
  },
  {
    name: "workspace_write_file",
    label: "Workspace Write",
    description: "Write file content into workspace.",
    sampleArgs: { path: "workspace/skill.md", content: "# Skill" },
  },
  {
    name: "workspace_edit_file",
    label: "Workspace Edit",
    description: "Find/replace text in a workspace file.",
    sampleArgs: { path: "workspace/skill.md", find: "a", replace: "b" },
  },
  {
    name: "workspace_delete",
    label: "Workspace Delete",
    description: "Delete workspace file or directory path.",
    sampleArgs: { path: "workspace/skill.md" },
  },
  {
    name: "wallet_connect",
    label: "Wallet Connect",
    description: "Connect to browser wallet and return active account.",
    sampleArgs: { chain: "solana" },
  },
  {
    name: "wallet_get_accounts",
    label: "Wallet Accounts",
    description: "List connected wallet accounts.",
    sampleArgs: { chain: "solana" },
  },
  {
    name: "wallet_sign_message",
    label: "Wallet Sign",
    description: "Sign message with connected wallet (approval-gated).",
    sampleArgs: { chain: "solana", message: "hello" },
  },
  {
    name: "wallet_send_transaction",
    label: "Wallet Send Tx",
    description: "Send EVM transaction with connected wallet (approval-gated).",
    sampleArgs: { chain: "evm", to: "0x000000000000000000000000000000000000dEaD", valueWei: "1", chainId: 11155111 },
  },
];

function makeLiteToolSchema() {
  return {
    type: "object",
    properties: {},
    additionalProperties: true,
  };
}

function liteToolResult(text, details = {}) {
  return {
    content: [{ type: "text", text: String(text || "") }],
    details,
  };
}

async function dispatchLiteTool(name, params, _signal, _onUpdate, toolCallId = null) {
  const normalizedName = String(name || "");
  const normalizedToolCallId = typeof toolCallId === "string" && toolCallId.trim() ? toolCallId.trim() : randomId("tc");
  if (isTrainerNamespaceToolName(normalizedName) && !trainerNamespaceEnabled()) {
    const startedAtMs = nowMs();
    const envelope = withToolMeta(
      normalizedName,
      startedAtMs,
      makeToolFailure("TOOL_NOT_FOUND", `Tool ${normalizedName} not found`, {
        toolCallId: normalizedToolCallId,
        tool: normalizedName,
      }),
    );
    return envelopeToToolResult(envelope, normalizedName);
  }
  const capture = state.trainer?.activeCapture || null;
  const coaching = trainerNormalizeCoachingState(state.trainer?.coaching);
  if (capture && coaching.enabled) {
    const pendingEvent = await trainerAppendEvent(
      capture,
      "tool.call.pending",
      "human",
      {
        turnId: capture.turnId || null,
        toolCallId: normalizedToolCallId,
        name: normalizedName,
        args: isPlainObject(params) ? params : {},
        status: "pending",
      },
      { parentSpanId: capture.turnSpanId || null },
    );

    let decision = coaching.mode === "reject" ? "reject" : "approve";
    if (coaching.mode === "manual") {
      try {
        const asked = await requestApproval({
          title: "Coach",
          body: `Allow tool call ${normalizedName}?`,
        });
        decision = asked === "approve" ? "approve" : "reject";
      } catch {
        decision = "reject";
      }
    }

    await trainerAppendEvent(
      capture,
      "human.intervention",
      "human",
      {
        action: decision === "approve" ? "tool.approve" : "tool.reject",
        toolCallId: normalizedToolCallId,
        name: normalizedName,
        pendingSeq: pendingEvent?.seq || null,
      },
      { parentSpanId: pendingEvent?.spanId || capture.turnSpanId || null },
    );

    if (decision !== "approve") {
      const startedAtMs = nowMs();
      const envelope = withToolMeta(
        normalizedName,
        startedAtMs,
        makeToolFailure("APPROVAL_REJECTED", "Tool call rejected by coach", {
          toolCallId: normalizedToolCallId,
          tool: normalizedName,
        }),
      );
      return envelopeToToolResult(envelope, normalizedName);
    }
  }

  switch (normalizedName) {
    case "lite_echo": {
      const text = typeof params?.text === "string" ? params.text : "";
      return liteToolResult(text, { dispatchPath: LITE_TOOL_DISPATCH_PATH });
    }
    case "lite_uppercase": {
      const text = typeof params?.text === "string" ? params.text : "";
      return liteToolResult(text.toUpperCase(), { dispatchPath: LITE_TOOL_DISPATCH_PATH });
    }
    case "lite_add": {
      const a = Number(params?.a || 0);
      const b = Number(params?.b || 0);
      const sum = (Number.isFinite(a) ? a : 0) + (Number.isFinite(b) ? b : 0);
      return liteToolResult(String(sum), { dispatchPath: LITE_TOOL_DISPATCH_PATH, sum });
    }
    case "lite_now": {
      const ts = nowMs();
      return liteToolResult(String(ts), { dispatchPath: LITE_TOOL_DISPATCH_PATH, ts });
    }
    case "lite_sleep": {
      const rawMs = Number(params?.ms);
      const ms = Number.isFinite(rawMs) ? Math.max(0, Math.min(10_000, Math.floor(rawMs))) : 0;
      if (ms > 0) await new Promise((resolve) => setTimeout(resolve, ms));
      return liteToolResult(`slept ${ms}ms`, { dispatchPath: LITE_TOOL_DISPATCH_PATH, ms });
    }
    case "lite_sha256": {
      const text = typeof params?.text === "string" ? params.text : "";
      const digest = bytesToB64(await sha256(utf8ToBytes(text)));
      return liteToolResult(digest, { dispatchPath: LITE_TOOL_DISPATCH_PATH });
    }
    case "web_fetch": {
      const envelope = await runWebFetch(params || {}, "web_fetch");
      return envelopeToToolResult(envelope, "web_fetch");
    }
    case "skill_fetch": {
      const envelope = await runWebFetch(params || {}, "skill_fetch");
      return envelopeToToolResult(envelope, "skill_fetch");
    }
    case "http_request": {
      const envelope = await runHttpRequest(params || {}, "http_request");
      return envelopeToToolResult(envelope, "http_request");
    }
    case "trainer.list_runs": {
      const envelope = await runTrainerListRuns(params || {}, "trainer.list_runs");
      return envelopeToToolResult(envelope, "trainer.list_runs");
    }
    case "trainer.get_run": {
      const envelope = await runTrainerGetRun(params || {}, "trainer.get_run");
      return envelopeToToolResult(envelope, "trainer.get_run");
    }
    case "trainer.get_event": {
      const envelope = await runTrainerGetEvent(params || {}, "trainer.get_event");
      return envelopeToToolResult(envelope, "trainer.get_event");
    }
    case "trainer.list_actions": {
      const envelope = await runTrainerListActions(params || {}, "trainer.list_actions");
      return envelopeToToolResult(envelope, "trainer.list_actions");
    }
    case "trainer.invoke_action": {
      const envelope = await runTrainerInvokeAction(params || {}, "trainer.invoke_action", normalizedToolCallId);
      return envelopeToToolResult(envelope, "trainer.invoke_action");
    }
    case "trainer.list_evidence": {
      const envelope = await runTrainerListEvidence(params || {}, "trainer.list_evidence");
      return envelopeToToolResult(envelope, "trainer.list_evidence");
    }
    case "trainer.get_transcript_integrity": {
      const envelope = runTrainerGetTranscriptIntegrity(params || {}, "trainer.get_transcript_integrity");
      return envelopeToToolResult(envelope, "trainer.get_transcript_integrity");
    }
    case "trainer.get_session_context": {
      const envelope = await runTrainerGetSessionContext(params || {}, "trainer.get_session_context");
      return envelopeToToolResult(envelope, "trainer.get_session_context");
    }
    case "trainer.explain_not_used": {
      const envelope = await runTrainerExplainNotUsed(params || {}, "trainer.explain_not_used");
      return envelopeToToolResult(envelope, "trainer.explain_not_used");
    }
    case "trainer.delete_trace": {
      const envelope = await runTrainerDeleteTrace(params || {}, "trainer.delete_trace");
      return envelopeToToolResult(envelope, "trainer.delete_trace");
    }
    case "trainer.clear_traces": {
      const envelope = await runTrainerClearTraces(params || {}, "trainer.clear_traces");
      return envelopeToToolResult(envelope, "trainer.clear_traces");
    }
    case "agent_town_ceremony_commit": {
      const envelope = await runAgentTownCeremonyCommit(params || {}, "agent_town_ceremony_commit");
      return envelopeToToolResult(envelope, "agent_town_ceremony_commit");
    }
    case "agent_town_ceremony_reveal": {
      const envelope = await runAgentTownCeremonyReveal(params || {}, "agent_town_ceremony_reveal");
      return envelopeToToolResult(envelope, "agent_town_ceremony_reveal");
    }
    case "agent_town_house_recover": {
      const envelope = await runAgentTownHouseRecover(params || {}, "agent_town_house_recover");
      return envelopeToToolResult(envelope, "agent_town_house_recover");
    }
    case "agent_town_house_append_note": {
      const envelope = await runAgentTownHouseAppendNote(params || {}, "agent_town_house_append_note");
      return envelopeToToolResult(envelope, "agent_town_house_append_note");
    }
    case "agent_town_state_get_session": {
      const envelope = await runAgentTownStateGetSession(params || {}, "agent_town_state_get_session");
      return envelopeToToolResult(envelope, "agent_town_state_get_session");
    }
    case "agent_town_state_get_agent_state": {
      const envelope = await runAgentTownStateGetAgentState(params || {}, "agent_town_state_get_agent_state");
      return envelopeToToolResult(envelope, "agent_town_state_get_agent_state");
    }
    case "agent_town_state_get_house_context": {
      const envelope = await runAgentTownStateGetHouseContext(params || {}, "agent_town_state_get_house_context");
      return envelopeToToolResult(envelope, "agent_town_state_get_house_context");
    }
    case "agent_town_state_get_pony_inbox": {
      const envelope = await runAgentTownStateGetPonyInbox(params || {}, "agent_town_state_get_pony_inbox");
      return envelopeToToolResult(envelope, "agent_town_state_get_pony_inbox");
    }
    case "agent_town_ui_open_modal":
    case "agent_town_ui_atlas_search":
    case "agent_town_ui_pony_compose":
    case "agent_town_ui_publish_post": {
      const envelope = await runAgentTownUiIntentTool(params || {}, normalizedName);
      return envelopeToToolResult(envelope, normalizedName);
    }
    case "secret_set": {
      const envelope = await runSecretSet(params || {}, "secret_set");
      return envelopeToToolResult(envelope, "secret_set");
    }
    case "secret_list": {
      const envelope = runSecretList(params || {}, "secret_list");
      return envelopeToToolResult(envelope, "secret_list");
    }
    case "secret_delete": {
      const envelope = await runSecretDelete(params || {}, "secret_delete");
      return envelopeToToolResult(envelope, "secret_delete");
    }
    case "ws_open": {
      const envelope = await runWsOpen(params || {}, "ws_open");
      return envelopeToToolResult(envelope, "ws_open");
    }
    case "ws_send": {
      const envelope = runWsSend(params || {}, "ws_send");
      return envelopeToToolResult(envelope, "ws_send");
    }
    case "ws_recv":
    case "ws_receive": {
      const envelope = await runWsRecv(params || {}, "ws_recv");
      return envelopeToToolResult(envelope, "ws_recv");
    }
    case "ws_close": {
      const envelope = runWsClose(params || {}, "ws_close");
      return envelopeToToolResult(envelope, "ws_close");
    }
    case "ws_status": {
      const envelope = runWsStatus(params || {}, "ws_status");
      return envelopeToToolResult(envelope, "ws_status");
    }
    case "workspace_mkdir": {
      const envelope = await runWorkspaceMkdir(params || {}, "workspace_mkdir");
      return envelopeToToolResult(envelope, "workspace_mkdir");
    }
    case "workspace_list": {
      const envelope = await runWorkspaceList(params || {}, "workspace_list");
      return envelopeToToolResult(envelope, "workspace_list");
    }
    case "workspace_read_file": {
      const envelope = await runWorkspaceReadFile(params || {}, "workspace_read_file");
      return envelopeToToolResult(envelope, "workspace_read_file");
    }
    case "workspace_write_file": {
      const envelope = await runWorkspaceWriteFile(params || {}, "workspace_write_file");
      return envelopeToToolResult(envelope, "workspace_write_file");
    }
    case "workspace_edit_file": {
      const envelope = await runWorkspaceEditFile(params || {}, "workspace_edit_file");
      return envelopeToToolResult(envelope, "workspace_edit_file");
    }
    case "workspace_delete": {
      const envelope = await runWorkspaceDelete(params || {}, "workspace_delete");
      return envelopeToToolResult(envelope, "workspace_delete");
    }
    case "wallet_connect": {
      const envelope = await runWalletConnectTool(params || {}, "wallet_connect");
      return envelopeToToolResult(envelope, "wallet_connect");
    }
    case "wallet_get_accounts": {
      const envelope = await runWalletGetAccountsTool(params || {}, "wallet_get_accounts");
      return envelopeToToolResult(envelope, "wallet_get_accounts");
    }
    case "wallet_sign_message": {
      const envelope = await runWalletSignMessageTool(params || {}, "wallet_sign_message");
      return envelopeToToolResult(envelope, "wallet_sign_message");
    }
    case "wallet_send_transaction": {
      const envelope = await runWalletSendTransactionTool(params || {}, "wallet_send_transaction");
      return envelopeToToolResult(envelope, "wallet_send_transaction");
    }
    default: {
      const startedAtMs = nowMs();
      const notFoundCode = normalizedName.startsWith("agent_town_ui_")
        ? "UI_INTENT_UNKNOWN"
        : normalizedName.startsWith("agent_town_state_")
          ? "STATE_TOOL_UNKNOWN"
          : "TOOL_NOT_FOUND";
      const envelope = withToolMeta(
        normalizedName,
        startedAtMs,
        makeToolFailure(notFoundCode, `Tool ${normalizedName} not found`, {
          toolCallId: normalizedToolCallId,
          tool: normalizedName,
        }),
      );
      return envelopeToToolResult(envelope, normalizedName);
    }
  }
}

function getLiteTools() {
  const specs = trainerNamespaceEnabled()
    ? LITE_TOOL_SPECS
    : LITE_TOOL_SPECS.filter((spec) => !isTrainerNamespaceToolName(spec?.name));
  return specs.map((spec) => ({
    name: spec.name,
    label: spec.label,
    description: spec.description,
    parameters: makeLiteToolSchema(),
    execute: async (toolCallId, params, signal, onUpdate) =>
      dispatchLiteTool(spec.name, params, signal, onUpdate, toolCallId),
  }));
}

function getToolRegistryInfo() {
  const tools = getLiteTools();
  return {
    trainerNamespaceEnabled: trainerNamespaceEnabled(),
    count: tools.length,
    names: tools.map((t) => t.name),
    dispatchPath: LITE_TOOL_DISPATCH_PATH,
  };
}

async function trainerBuildRegistrySnapshot() {
  const tools = getLiteTools();
  const rows = [];
  for (const tool of tools) {
    const schemaSha256 = await sha256HexFromJson(tool?.parameters || {});
    rows.push({
      name: String(tool?.name || ""),
      schemaSha256,
      version: null,
    });
  }
  rows.sort((a, b) => {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });
  const registrySha256 = await sha256HexFromJson(rows.map((row) => ({
    name: row.name,
    schemaSha256: row.schemaSha256,
    version: row.version,
  })));
  return { registrySha256, tools: rows };
}

function trainerResolveLlmFingerprint() {
  const parsed = parseConfiguredModelRef();
  return {
    provider: String(state.llmProvider || parsed.provider || "").trim() || null,
    modelId: String(state.llmModelId || parsed.modelId || "").trim() || null,
    modelRef: String(state.llmModelRef || "").trim() || null,
    api: String(state.llmApi || "").trim() || null,
    baseUrl: String(state.llmBaseUrl || "").trim() || null,
    reasoning: String(state.llmReasoning || "").trim() || null,
    useProxy: state.llmUseProxy !== false,
  };
}

async function trainerCollectExperienceDocs(resolved = null) {
  const docsByPath = new Map();

  const imported = Array.isArray(state.skillImport?.importedFiles) ? state.skillImport.importedFiles : [];
  for (const row of imported) {
    if (!isPlainObject(row)) continue;
    const path = normalizeSkillImportPath(row.path);
    if (!path) continue;
    let sha256 = "";
    const hashB64 = String(row.sha256B64 || "").trim();
    if (hashB64) {
      try {
        sha256 = bytesToHex(b64ToBytes(hashB64));
      } catch {
        sha256 = "";
      }
    }
    let bytes = 0;
    const content = await vfsGetUtf8(path);
    if (typeof content === "string") {
      bytes = utf8ToBytes(content).length;
      if (!sha256) {
        sha256 = await sha256HexFromUtf8(content);
      }
    }
    if (!sha256) continue;
    docsByPath.set(path, {
      role: trainerDocRoleFromPath(path),
      path,
      sha256,
      bytes,
    });
  }

  if (docsByPath.size === 0 && isPlainObject(resolved)) {
    const fileMap = isPlainObject(resolved.files) ? resolved.files : {};
    const pathMap = isPlainObject(resolved.resolvedPaths) ? resolved.resolvedPaths : {};
    for (const [key, value] of Object.entries(pathMap)) {
      const path = normalizeSkillImportPath(value);
      if (!path || docsByPath.has(path)) continue;
      const content = typeof fileMap[key] === "string" ? fileMap[key] : "";
      const sha256 = await sha256HexFromUtf8(content);
      docsByPath.set(path, {
        role: trainerDocRoleFromPath(path),
        path,
        sha256,
        bytes: utf8ToBytes(content).length,
      });
    }
  }

  return Array.from(docsByPath.values()).sort((a, b) => {
    if (a.path < b.path) return -1;
    if (a.path > b.path) return 1;
    return 0;
  });
}

async function trainerGetActiveLoadoutId(questId) {
  const normalizedQuestId = trainerQuestId(questId);
  const fromState = String(state.trainer?.activeLoadoutByQuest?.[normalizedQuestId] || "").trim();
  if (fromState) return fromState;
  const stored = await metaGet(trainerActiveLoadoutMetaKey(normalizedQuestId));
  return typeof stored === "string" && stored.trim() ? stored.trim() : null;
}

async function trainerSetActiveLoadoutId(questId, loadoutId) {
  const normalizedQuestId = trainerQuestId(questId);
  const normalizedLoadoutId = typeof loadoutId === "string" && loadoutId.trim() ? loadoutId.trim() : null;
  if (!isPlainObject(state.trainer.activeLoadoutByQuest)) {
    state.trainer.activeLoadoutByQuest = {};
  }
  state.trainer.activeLoadoutByQuest[normalizedQuestId] = normalizedLoadoutId;
  await metaSet(trainerActiveLoadoutMetaKey(normalizedQuestId), normalizedLoadoutId);
  return normalizedLoadoutId;
}

async function trainerEnsureLoadoutManifest({
  questId = TRAINER_DEFAULT_QUEST_ID,
  experienceDocs = [],
  registrySnapshot = null,
  reason = "capture",
} = {}) {
  const normalizedQuestId = trainerQuestId(questId);
  const normalizedDocs = Array.isArray(experienceDocs)
    ? experienceDocs.map((doc) => ({
      role: String(doc?.role || "other"),
      path: String(doc?.path || ""),
      sha256: String(doc?.sha256 || ""),
    }))
      .filter((doc) => doc.path && doc.sha256)
    : [];
  const registrySha256 = String(registrySnapshot?.registrySha256 || "").trim();
  const llmConfigFingerprint = trainerResolveLlmFingerprint();
  const runtime = {
    openclawLiteVersion: OPENCLAW_VERSION,
    piVersions: PI_VERSIONS,
    buildHash: null,
  };

  const loadoutHashInput = {
    docs: normalizedDocs,
    registrySha256,
    llmConfigFingerprint,
    runtime,
  };
  const loadoutId = `loadout_${await sha256HexFromJson(loadoutHashInput)}`;
  const root = trainerLoadoutRoot(normalizedQuestId, loadoutId);
  const manifestPath = `${root}/manifest.json`;
  const existing = trainerParseJsonSafe(await vfsGetUtf8(manifestPath), null);
  const previousLoadoutId = await trainerGetActiveLoadoutId(normalizedQuestId);

  let manifest = existing;
  let created = false;
  if (!isPlainObject(existing)) {
    manifest = {
      v: TRAINER_VERSION,
      questId: normalizedQuestId,
      loadoutId,
      createdAtMs: nowMs(),
      previousLoadoutId: previousLoadoutId && previousLoadoutId !== loadoutId ? previousLoadoutId : null,
      reason: String(reason || "capture"),
      registrySha256,
      experienceDocs: normalizedDocs,
      llmConfigFingerprint,
      runtime,
      active: true,
    };
    await vfsPutUtf8(manifestPath, JSON.stringify(manifest, null, 2));
    created = true;
  }

  await trainerSetActiveLoadoutId(normalizedQuestId, loadoutId);
  return { loadoutId, manifestPath, manifest, created };
}

function trainerIsLoadoutSensitiveWorkspacePath(pathValue) {
  const path = String(pathValue || "").trim().toLowerCase();
  if (!path.startsWith("workspace/")) return false;
  const base = path.split("/").pop() || "";
  return (
    base === "skill.md" ||
    base === "tools.md" ||
    base === "tool.md" ||
    base === "heartbeat.md" ||
    base === "goals.md" ||
    base === "goal.md" ||
    base === "penalty.md"
  );
}

async function trainerCheckpointForConfigChange(reason = "config-change") {
  let resolved = null;
  try {
    resolved = await resolveExperienceWorkspaceFiles({});
  } catch {
    resolved = null;
  }
  const docs = await trainerCollectExperienceDocs(resolved);
  if (!docs.length) return null;
  const registrySnapshot = await trainerBuildRegistrySnapshot();
  return trainerEnsureLoadoutManifest({
    questId: TRAINER_DEFAULT_QUEST_ID,
    experienceDocs: docs,
    registrySnapshot,
    reason,
  });
}

async function trainerAppendEvent(capture, type, actor, data = {}, options = {}) {
  if (!capture) return null;
  capture.seq += 1;
  const event = {
    v: TRAINER_VERSION,
    attemptId: capture.attemptId,
    seq: capture.seq,
    tsMs: nowMs(),
    type: String(type || ""),
    actor: String(actor || "system"),
    spanId: String(options?.spanId || randomId("span")),
    parentSpanId:
      typeof options?.parentSpanId === "string" && options.parentSpanId.trim() ? options.parentSpanId.trim() : null,
    data: isPlainObject(data) ? data : {},
  };
  const line = JSON.stringify(event);
  capture.events.push(event);
  capture.eventLines.push(line);
  capture.bytesWritten += line.length + 1;
  await vfsPutUtf8(capture.eventsPath, `${capture.eventLines.join("\n")}\n`);
  return event;
}

async function trainerPersistManifest(capture) {
  if (!capture) return null;
  const manifest = {
    ...capture.manifest,
    stats: {
      llmTurns: Number(capture.stats?.llmTurns || 0),
      toolCalls: Number(capture.stats?.toolCalls || 0),
      toolFailures: Number(capture.stats?.toolFailures || 0),
      durationMs: Number(capture.stats?.durationMs || 0),
      bytesWritten: Number(capture.stats?.bytesWritten || 0),
    },
  };

  let text = JSON.stringify(manifest, null, 2);
  const totalBytesWritten = capture.bytesWritten + text.length;
  manifest.stats.bytesWritten = totalBytesWritten;
  text = JSON.stringify(manifest, null, 2);
  capture.manifest = manifest;
  capture.stats.bytesWritten = totalBytesWritten;
  await vfsPutUtf8(capture.manifestPath, text);
  return manifest;
}

async function trainerWriteContextReceipt(capture, turnId, payload = {}) {
  if (!capture) return null;
  const contextPath = `${capture.contextRoot}/${turnId}.json`;
  const receipt = {
    v: TRAINER_VERSION,
    turnId,
    llmRequest: {
      system: String(payload?.systemPrompt || ""),
      messages: Array.isArray(payload?.messages) ? payload.messages : [],
      tools: Array.isArray(payload?.tools) ? payload.tools : [],
    },
    receipt: {
      sections: Array.isArray(payload?.sections) ? payload.sections : [],
    },
  };
  await vfsPutUtf8(contextPath, JSON.stringify(receipt, null, 2));
  return contextPath;
}

async function trainerStartAttemptCapture({
  questId = TRAINER_DEFAULT_QUEST_ID,
  entryPrompt = "",
  resolved = null,
  runtimeSnapshot = null,
  registrySnapshot = null,
} = {}) {
  const normalizedQuestId = trainerQuestId(questId);
  const attemptId = randomId("attempt");
  const createdAtMs = nowMs();
  const attemptRoot = trainerAttemptRoot(normalizedQuestId, attemptId);
  const eventsPath = `${attemptRoot}/events.jsonl`;
  const manifestPath = `${attemptRoot}/manifest.json`;
  const contextRoot = `${attemptRoot}/context`;
  const experienceDocs = await trainerCollectExperienceDocs(resolved);
  const loadout = await trainerEnsureLoadoutManifest({
    questId: normalizedQuestId,
    experienceDocs,
    registrySnapshot,
    reason: "attempt-start",
  });
  const runtimeContext = runtimeSnapshot?.context && typeof runtimeSnapshot.context === "object"
    ? runtimeSnapshot.context
    : null;
  const runtimeState = runtimeSnapshot?.appState && typeof runtimeSnapshot.appState === "object"
    ? runtimeSnapshot.appState
    : null;
  const llmConfigFingerprint = trainerResolveLlmFingerprint();
  const capture = {
    questId: normalizedQuestId,
    attemptId,
    createdAtMs,
    manifestPath,
    eventsPath,
    contextRoot,
    seq: 0,
    bytesWritten: 0,
    events: [],
    eventLines: [],
    stats: {
      llmTurns: 0,
      toolCalls: 0,
      toolFailures: 0,
      durationMs: 0,
      bytesWritten: 0,
    },
    manifest: {
      v: TRAINER_VERSION,
      attemptId,
      questId: normalizedQuestId,
      createdAtMs,
      endedAtMs: null,
      result: "unknown",
      successSignals: {
        isSuccess: false,
        houseId: null,
        experienceStep: null,
      },
      loadoutId: loadout.loadoutId,
      experienceDocs,
      runtime: {
        openclawLiteVersion: OPENCLAW_VERSION,
        piVersions: PI_VERSIONS,
        buildHash: null,
      },
      llmConfigFingerprint,
      stats: {
        llmTurns: 0,
        toolCalls: 0,
        toolFailures: 0,
        durationMs: 0,
        bytesWritten: 0,
      },
    },
    turnId: null,
    turnSpanId: null,
    llmStartEvent: null,
    registryEvent: null,
    registrySnapshot,
    runtimeBefore: runtimeState,
    coachingDecisions: [],
  };

  await vfsPutUtf8(eventsPath, "");
  await trainerAppendEvent(capture, "attempt.start", "system", {
    questId: normalizedQuestId,
    attemptLabel: null,
    loadoutId: loadout.loadoutId,
    entry: {
      source: "trainer",
      prompt: String(entryPrompt || ""),
    },
    runtime: {
      agentId: MAIN_AGENT_ID,
      sessionKey: MAIN_SESSION_KEY,
      openclawLiteVersion: OPENCLAW_VERSION,
    },
  });
  await trainerAppendEvent(capture, "experience.imported", "system", {
    siteRoot: String(state.skillImport?.siteRoot || "workspace/"),
    activeSkillPath: String(state.skillImport?.activeSkillPath || "workspace/SKILL.md"),
    docs: experienceDocs.map((doc) => ({
      role: doc.role,
      path: doc.path,
      sha256: doc.sha256,
      bytes: Number(doc.bytes || 0),
    })),
  });
  if (runtimeContext || runtimeState) {
    await trainerAppendEvent(capture, "context.injected", "system", {
      teamCode: typeof runtimeContext?.teamCode === "string" ? runtimeContext.teamCode : null,
      runtimeContext: runtimeContext || null,
      runtimeStateSummary: summarizeRuntimeAppStateForDebug(runtimeState),
    });
  }
  await trainerPersistManifest(capture);
  return capture;
}

function trainerResolveSuccessSignals(runtimeSnapshot = null) {
  const appState = runtimeSnapshot?.appState && typeof runtimeSnapshot.appState === "object"
    ? runtimeSnapshot.appState
    : null;
  const houseId = typeof appState?.houseId === "string" && appState.houseId.trim() ? appState.houseId.trim() : null;
  const experienceStep =
    typeof appState?.experience?.step === "string" && appState.experience.step.trim()
      ? appState.experience.step.trim()
      : null;
  const isSuccess = !!houseId || experienceStep === "house_ready";
  return { houseId, experienceStep, isSuccess };
}

function trainerNormalizeToolCallArgs(rawArgs) {
  if (isPlainObject(rawArgs)) return rawArgs;
  if (typeof rawArgs === "string") {
    try {
      const parsed = JSON.parse(rawArgs);
      return isPlainObject(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function trainerExtractToolCalls(messages = []) {
  const out = [];
  for (const message of Array.isArray(messages) ? messages : []) {
    if (!isPlainObject(message) || message.role !== "assistant" || !Array.isArray(message.content)) continue;
    for (const part of message.content) {
      if (!isPlainObject(part) || part.type !== "toolCall") continue;
      const toolCallId = typeof part.id === "string" && part.id.trim() ? part.id.trim() : randomId("toolcall");
      const name = typeof part.name === "string" ? part.name.trim() : "";
      const args = trainerNormalizeToolCallArgs(part.arguments);
      out.push({
        toolCallId,
        name,
        args,
        argsJson: stableJsonStringify(args),
      });
    }
  }
  return out;
}

function trainerExtractToolResults(messages = []) {
  const out = new Map();
  for (const message of Array.isArray(messages) ? messages : []) {
    if (!isPlainObject(message) || message.role !== "toolResult") continue;
    const toolCallId =
      typeof message.toolCallId === "string" && message.toolCallId.trim()
        ? message.toolCallId.trim()
        : typeof message.toolUseId === "string" && message.toolUseId.trim()
          ? message.toolUseId.trim()
          : "";
    if (!toolCallId) continue;
    const name = typeof message.toolName === "string" ? message.toolName.trim() : "";
    const text = textFromMessageContent(message.content || []);
    const parsed = trainerParseJsonSafe(text, null);

    let ok = message.isError !== true;
    let durationMs = 0;
    let normalizedResult = null;
    let normalizedError = null;
    if (isPlainObject(parsed) && typeof parsed.ok === "boolean") {
      ok = parsed.ok === true;
      const durationRaw = Number(parsed?.meta?.durationMs || 0);
      durationMs = Number.isFinite(durationRaw) && durationRaw >= 0 ? Math.floor(durationRaw) : 0;
      if (ok) {
        normalizedResult = parsed?.data ?? parsed?.result ?? null;
      } else {
        normalizedError = {
          code: String(parsed?.error?.code || "UNSUPPORTED"),
          message: String(parsed?.error?.message || "Tool execution failed"),
          details: isPlainObject(parsed?.error?.details) ? parsed.error.details : null,
        };
      }
    } else if (!ok) {
      normalizedError = {
        code: "UNSUPPORTED",
        message: text || "Tool execution failed",
        details: null,
      };
    } else {
      normalizedResult = text || null;
    }

    out.set(toolCallId, {
      toolCallId,
      name,
      ok,
      durationMs,
      result: normalizedResult,
      error: normalizedError,
    });
  }
  return out;
}

async function trainerListAttemptManifests(questId = TRAINER_DEFAULT_QUEST_ID) {
  const normalizedQuestId = trainerQuestId(questId);
  const prefix = `${trainerAttemptsRoot(normalizedQuestId)}/`;
  const paths = await vfsListPaths(prefix);
  const manifestPaths = paths.filter((path) => path.endsWith("/manifest.json"));
  const out = [];
  for (const manifestPath of manifestPaths) {
    const parsed = trainerParseJsonSafe(await vfsGetUtf8(manifestPath), null);
    if (!isPlainObject(parsed)) continue;
    out.push({ ...parsed, manifestPath });
  }
  out.sort((a, b) => Number(b.createdAtMs || 0) - Number(a.createdAtMs || 0));
  return out;
}

async function trainerListLoadoutManifests(questId = TRAINER_DEFAULT_QUEST_ID) {
  const normalizedQuestId = trainerQuestId(questId);
  const activeLoadoutId = await trainerGetActiveLoadoutId(normalizedQuestId);
  const prefix = `${trainerLoadoutsRoot(normalizedQuestId)}/`;
  const paths = await vfsListPaths(prefix);
  const manifestPaths = paths.filter((path) => path.endsWith("/manifest.json"));
  const out = [];
  for (const manifestPath of manifestPaths) {
    const parsed = trainerParseJsonSafe(await vfsGetUtf8(manifestPath), null);
    if (!isPlainObject(parsed)) continue;
    const loadoutId = String(parsed.loadoutId || "").trim();
    out.push({
      ...parsed,
      manifestPath,
      active: !!(loadoutId && loadoutId === activeLoadoutId),
    });
  }
  out.sort((a, b) => Number(b.createdAtMs || 0) - Number(a.createdAtMs || 0));
  return { activeLoadoutId, loadouts: out };
}

async function trainerReadAttemptBundle({ questId = TRAINER_DEFAULT_QUEST_ID, attemptId = "" } = {}) {
  const normalizedQuestId = trainerQuestId(questId);
  const normalizedAttemptId = String(attemptId || "").trim();
  if (!normalizedAttemptId) {
    throw new Error("MISSING_ATTEMPT_ID");
  }
  const root = trainerAttemptRoot(normalizedQuestId, normalizedAttemptId);
  const manifestPath = `${root}/manifest.json`;
  const eventsPath = `${root}/events.jsonl`;
  const manifest = trainerParseJsonSafe(await vfsGetUtf8(manifestPath), null);
  if (!isPlainObject(manifest)) {
    throw new Error("ATTEMPT_NOT_FOUND");
  }
  const lines = String(await vfsGetUtf8(eventsPath) || "")
    .split(/\r?\n/)
    .filter((line) => line.trim());
  const events = [];
  for (const line of lines) {
    const parsed = trainerParseJsonSafe(line, null);
    if (!isPlainObject(parsed)) continue;
    events.push(parsed);
  }
  return { manifest, events, manifestPath, eventsPath };
}

function trainerMedian(values = []) {
  const nums = values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value >= 0)
    .sort((a, b) => a - b);
  if (nums.length === 0) return 0;
  const mid = Math.floor(nums.length / 2);
  if (nums.length % 2 === 0) return Math.round((nums[mid - 1] + nums[mid]) / 2);
  return nums[mid];
}

async function trainerCompareAttempts({ questId = TRAINER_DEFAULT_QUEST_ID, limit = 3 } = {}) {
  const normalizedQuestId = trainerQuestId(questId);
  const count = Math.max(1, Math.floor(Number(limit) || 1));
  const manifests = (await trainerListAttemptManifests(normalizedQuestId)).slice(0, count);
  const attempts = [];
  const failureByTool = new Map();
  const fingerprintMap = new Map();
  for (const manifest of manifests) {
    let events = [];
    try {
      const bundle = await trainerReadAttemptBundle({ questId: normalizedQuestId, attemptId: manifest.attemptId });
      events = Array.isArray(bundle.events) ? bundle.events : [];
    } catch {
      events = [];
    }

    let firstError = null;
    for (const event of events) {
      if (!isPlainObject(event)) continue;
      if (event.type === "tool.call.executed") {
        const toolName = String(event?.data?.name || "").trim() || "(unknown)";
        const entry = failureByTool.get(toolName) || { toolName, failures: 0, total: 0 };
        entry.total += 1;
        if (event?.data?.ok !== true) entry.failures += 1;
        failureByTool.set(toolName, entry);
      }
      if (!firstError && event.type === "error") {
        firstError = event;
      }
    }

    if (!firstError) {
      firstError = events.find((event) => isPlainObject(event) && event.type === "tool.call.executed" && event?.data?.ok !== true) || null;
    }

    if (firstError) {
      const requestedToolName = String(firstError?.data?.requestedToolName || firstError?.data?.name || "").trim();
      const kind = String(firstError?.data?.kind || firstError?.data?.error?.code || "").trim();
      const step = String(manifest?.successSignals?.experienceStep || "").trim();
      const base = `${String(firstError.type || "")}|${requestedToolName}|${kind}|${step}`;
      const fingerprint = (await sha256HexFromUtf8(base)).slice(0, 16);
      const entry = fingerprintMap.get(fingerprint) || {
        fingerprint,
        count: 0,
        type: String(firstError.type || ""),
        requestedToolName: requestedToolName || null,
        kind: kind || null,
        experienceStep: step || null,
      };
      entry.count += 1;
      fingerprintMap.set(fingerprint, entry);
    }

    attempts.push(manifest);
  }

  const successCount = attempts.filter((attempt) => String(attempt?.result || "") === "success").length;
  const successRate = attempts.length > 0 ? successCount / attempts.length : 0;
  const medianDurationMs = trainerMedian(attempts.map((attempt) => attempt?.stats?.durationMs || 0));
  const toolFailureRates = Array.from(failureByTool.values())
    .map((entry) => ({
      toolName: entry.toolName,
      failures: entry.failures,
      total: entry.total,
      rate: entry.total > 0 ? entry.failures / entry.total : 0,
    }))
    .sort((a, b) => {
      if (b.failures !== a.failures) return b.failures - a.failures;
      if (b.total !== a.total) return b.total - a.total;
      return a.toolName.localeCompare(b.toolName);
    });
  const divergence = Array.from(fingerprintMap.values()).sort((a, b) => b.count - a.count);

  return {
    questId: normalizedQuestId,
    attemptsCount: attempts.length,
    successCount,
    successRate,
    medianDurationMs,
    toolFailureRates,
    divergence,
  };
}

function trainerClampInt(value, fallback, min, max) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function trainerSanitizeAttemptId(value) {
  return String(value || "").trim();
}

async function trainerResolveAttemptIdForTool(questId, attemptIdRaw) {
  const normalizedQuestId = trainerQuestId(questId || TRAINER_DEFAULT_QUEST_ID);
  const raw = trainerSanitizeAttemptId(attemptIdRaw);
  if (raw && raw.toLowerCase() !== "latest") {
    return { questId: normalizedQuestId, attemptId: raw };
  }
  const manifests = await trainerListAttemptManifests(normalizedQuestId);
  const latest = manifests[0];
  const latestId = String(latest?.attemptId || "").trim();
  if (!latestId) {
    throw new Error("ATTEMPT_NOT_FOUND");
  }
  return { questId: normalizedQuestId, attemptId: latestId };
}

function trainerToolResultEnvelopeToData(toolResult) {
  const text = textFromMessageContent(toolResult?.content || []);
  const parsed = trainerParseJsonSafe(text, null);
  if (isPlainObject(parsed) && typeof parsed.ok === "boolean") {
    return parsed;
  }
  if (toolResult?.isError === true) {
    return makeToolFailure("UNSUPPORTED", text || "Nested tool execution failed");
  }
  return makeToolSuccess({ text: text || "" });
}

async function trainerCollectActionStats({ questId = TRAINER_DEFAULT_QUEST_ID, scanLimit = TRAINER_TOOL_DEFAULT_SCAN_LIMIT } = {}) {
  const normalizedQuestId = trainerQuestId(questId);
  const manifests = await trainerListAttemptManifests(normalizedQuestId);
  const maxAttempts = trainerClampInt(scanLimit, TRAINER_TOOL_DEFAULT_SCAN_LIMIT, 1, TRAINER_TOOL_MAX_RUN_LIMIT);
  const selected = manifests.slice(0, maxAttempts);
  const byAction = new Map();

  const ensureAction = (id) => {
    const key = String(id || "").trim();
    if (!key) return null;
    if (!byAction.has(key)) {
      byAction.set(key, {
        id: key,
        params: new Set(),
        methods: new Set(),
        urlTemplates: new Set(),
        invocations: 0,
        failures: 0,
        lastSeenAtMs: 0,
        lastAttemptId: null,
      });
    }
    return byAction.get(key);
  };

  for (const manifest of selected) {
    const attemptId = String(manifest?.attemptId || "").trim();
    if (!attemptId) continue;
    let bundle;
    try {
      bundle = await trainerReadAttemptBundle({ questId: normalizedQuestId, attemptId });
    } catch {
      continue;
    }
    const events = Array.isArray(bundle?.events) ? bundle.events : [];
    const requestedByToolCallId = new Map();

    for (const event of events) {
      if (!isPlainObject(event) || String(event.type || "") !== "tool.call.requested") continue;
      const name = String(event?.data?.name || "").trim();
      const toolCallId = String(event?.data?.toolCallId || "").trim();
      if (!name) continue;
      const row = ensureAction(name);
      if (!row) continue;
      row.invocations += 1;
      const atMs = Number(event?.atMs || 0);
      if (Number.isFinite(atMs) && atMs >= row.lastSeenAtMs) {
        row.lastSeenAtMs = atMs;
        row.lastAttemptId = attemptId || row.lastAttemptId;
      }
      const args = isPlainObject(event?.data?.args) ? event.data.args : {};
      for (const key of Object.keys(args)) {
        if (key) row.params.add(String(key));
      }
      const method = String(args?.method || "").trim().toUpperCase();
      if (method) row.methods.add(method);
      const urlTemplate = String(args?.urlTemplate || args?.url || "").trim();
      if (urlTemplate) row.urlTemplates.add(urlTemplate);
      if (toolCallId) requestedByToolCallId.set(toolCallId, name);
    }

    for (const event of events) {
      if (!isPlainObject(event) || String(event.type || "") !== "tool.call.executed") continue;
      const toolCallId = String(event?.data?.toolCallId || "").trim();
      const explicitName = String(event?.data?.name || "").trim();
      const name = explicitName || (toolCallId ? requestedByToolCallId.get(toolCallId) : "") || "";
      if (!name) continue;
      const row = ensureAction(name);
      if (!row) continue;
      if (event?.data?.ok !== true) {
        row.failures += 1;
      }
    }
  }

  const actions = Array.from(byAction.values())
    .map((row) => ({
      id: row.id,
      source: "trainer_capture",
      confidence: Math.max(0.1, Math.min(0.99, row.invocations / (row.invocations + 1))),
      request: {
        method: row.methods.values().next().value || "GET",
        urlTemplate: row.urlTemplates.values().next().value || "",
      },
      params: Array.from(row.params.values()).sort(),
      runStats: {
        invocations: row.invocations,
        failures: row.failures,
        successes: Math.max(0, row.invocations - row.failures),
        lastSeenAtMs: row.lastSeenAtMs || null,
        lastAttemptId: row.lastAttemptId || null,
      },
    }))
    .sort((a, b) => {
      const invocationsDelta = Number(b?.runStats?.invocations || 0) - Number(a?.runStats?.invocations || 0);
      if (invocationsDelta !== 0) return invocationsDelta;
      return String(a?.id || "").localeCompare(String(b?.id || ""));
    });

  return { questId: normalizedQuestId, actions, scannedAttempts: selected.length };
}

async function trainerCollectEvidenceRows({
  questId = TRAINER_DEFAULT_QUEST_ID,
  actionId = "",
  scanLimit = TRAINER_TOOL_DEFAULT_SCAN_LIMIT,
  limit = TRAINER_TOOL_DEFAULT_EVIDENCE_LIMIT,
} = {}) {
  const normalizedQuestId = trainerQuestId(questId);
  const manifests = await trainerListAttemptManifests(normalizedQuestId);
  const maxAttempts = trainerClampInt(scanLimit, TRAINER_TOOL_DEFAULT_SCAN_LIMIT, 1, TRAINER_TOOL_MAX_RUN_LIMIT);
  const maxRows = trainerClampInt(limit, TRAINER_TOOL_DEFAULT_EVIDENCE_LIMIT, 1, TRAINER_TOOL_MAX_EVIDENCE_LIMIT);
  const selected = manifests.slice(0, maxAttempts);
  const requestedActionId = String(actionId || "").trim();
  const rows = [];

  for (const manifest of selected) {
    const attemptId = String(manifest?.attemptId || "").trim();
    if (!attemptId) continue;
    let bundle;
    try {
      bundle = await trainerReadAttemptBundle({ questId: normalizedQuestId, attemptId });
    } catch {
      continue;
    }
    const events = Array.isArray(bundle?.events) ? bundle.events : [];
    for (const event of events) {
      if (!isPlainObject(event) || String(event.type || "") !== "tool.call.executed") continue;
      const name = String(event?.data?.name || "").trim();
      if (!name) continue;
      if (requestedActionId && name !== requestedActionId) continue;
      rows.push({
        questId: normalizedQuestId,
        attemptId,
        seq: Number(event?.seq || 0) || null,
        atMs: Number(event?.atMs || 0) || null,
        actionId: name,
        ok: event?.data?.ok === true,
        durationMs: Number(event?.data?.durationMs || 0) || 0,
        errorCode: event?.data?.ok === true ? null : String(event?.data?.error?.code || "UNSUPPORTED"),
        errorMessage: event?.data?.ok === true ? null : String(event?.data?.error?.message || "Tool execution failed"),
      });
    }
  }

  rows.sort((a, b) => {
    const atDelta = Number(b?.atMs || 0) - Number(a?.atMs || 0);
    if (atDelta !== 0) return atDelta;
    return Number(b?.seq || 0) - Number(a?.seq || 0);
  });
  return rows.slice(0, maxRows);
}

async function runTrainerListRuns(params, toolName = "trainer.list_runs") {
  const startedAtMs = nowMs();
  const questId = trainerQuestId(params?.questId || TRAINER_DEFAULT_QUEST_ID);
  const limit = trainerClampInt(params?.limit, TRAINER_TOOL_DEFAULT_RUN_LIMIT, 1, TRAINER_TOOL_MAX_RUN_LIMIT);
  const manifests = await trainerListAttemptManifests(questId);
  return withToolMeta(toolName, startedAtMs, makeToolSuccess({
    questId,
    runs: manifests.slice(0, limit),
    totalRuns: manifests.length,
  }));
}

async function runTrainerGetRun(params, toolName = "trainer.get_run") {
  const startedAtMs = nowMs();
  try {
    const resolved = await trainerResolveAttemptIdForTool(
      params?.questId || TRAINER_DEFAULT_QUEST_ID,
      params?.attemptId || "",
    );
    const bundle = await trainerReadAttemptBundle({
      questId: resolved.questId,
      attemptId: resolved.attemptId,
    });
    return withToolMeta(toolName, startedAtMs, makeToolSuccess({
      questId: resolved.questId,
      attemptId: resolved.attemptId,
      run: {
        ...bundle.manifest,
        events: bundle.events,
        manifestPath: bundle.manifestPath,
        eventsPath: bundle.eventsPath,
      },
    }));
  } catch (err) {
    return withToolMeta(
      toolName,
      startedAtMs,
      makeToolFailure("NOT_FOUND", String(err?.message || "ATTEMPT_NOT_FOUND")),
    );
  }
}

async function runTrainerGetEvent(params, toolName = "trainer.get_event") {
  const startedAtMs = nowMs();
  const seq = trainerClampInt(params?.seq, 0, 0, 9e9);
  if (seq <= 0) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Missing or invalid seq"));
  }
  try {
    const resolved = await trainerResolveAttemptIdForTool(
      params?.questId || TRAINER_DEFAULT_QUEST_ID,
      params?.attemptId || "",
    );
    const bundle = await trainerReadAttemptBundle({
      questId: resolved.questId,
      attemptId: resolved.attemptId,
    });
    const events = Array.isArray(bundle?.events) ? bundle.events : [];
    const event = events.find((row) => Number(row?.seq || 0) === seq) || null;
    if (!event) {
      return withToolMeta(toolName, startedAtMs, makeToolFailure("NOT_FOUND", "EVENT_NOT_FOUND", {
        questId: resolved.questId,
        attemptId: resolved.attemptId,
        seq,
      }));
    }
    return withToolMeta(toolName, startedAtMs, makeToolSuccess({
      questId: resolved.questId,
      attemptId: resolved.attemptId,
      seq,
      event,
    }));
  } catch (err) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("NOT_FOUND", String(err?.message || "ATTEMPT_NOT_FOUND")));
  }
}

async function runTrainerListActions(params, toolName = "trainer.list_actions") {
  const startedAtMs = nowMs();
  const scanLimit = trainerClampInt(params?.scanLimit, TRAINER_TOOL_DEFAULT_SCAN_LIMIT, 1, TRAINER_TOOL_MAX_RUN_LIMIT);
  const limit = trainerClampInt(params?.limit, TRAINER_TOOL_DEFAULT_RUN_LIMIT, 1, TRAINER_TOOL_MAX_RUN_LIMIT);
  const collected = await trainerCollectActionStats({
    questId: params?.questId || TRAINER_DEFAULT_QUEST_ID,
    scanLimit,
  });
  return withToolMeta(toolName, startedAtMs, makeToolSuccess({
    questId: collected.questId,
    actions: collected.actions.slice(0, limit),
    totalActions: collected.actions.length,
    scannedAttempts: collected.scannedAttempts,
  }));
}

async function runTrainerInvokeAction(params, toolName = "trainer.invoke_action", toolCallId = null) {
  const startedAtMs = nowMs();
  const actionId = String(params?.actionId || "").trim();
  if (!actionId) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Missing actionId"));
  }
  if (actionId.startsWith("trainer.")) {
    return withToolMeta(
      toolName,
      startedAtMs,
      makeToolFailure("INVALID_ARGUMENTS", "trainer.invoke_action only supports non-trainer actionIds"),
    );
  }
  const knownTools = new Set(getLiteTools().map((tool) => String(tool?.name || "")));
  if (!knownTools.has(actionId)) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("NOT_FOUND", `Unknown actionId: ${actionId}`));
  }

  const actionParams = isPlainObject(params?.params) ? params.params : {};
  const nestedCallId = typeof toolCallId === "string" && toolCallId.trim() ? `${toolCallId}:invoke` : randomId("tc");
  const nestedToolResult = await dispatchLiteTool(actionId, actionParams, undefined, undefined, nestedCallId);
  const nestedEnvelope = trainerToolResultEnvelopeToData(nestedToolResult);
  if (nestedEnvelope?.ok !== true) {
    return withToolMeta(
      toolName,
      startedAtMs,
      makeToolFailure(
        String(nestedEnvelope?.error?.code || "UNSUPPORTED"),
        String(nestedEnvelope?.error?.message || "Action invocation failed"),
        {
          actionId,
          nested: nestedEnvelope?.error?.details || {},
        },
        nestedEnvelope?.error?.retryable === true,
      ),
    );
  }

  return withToolMeta(toolName, startedAtMs, makeToolSuccess({
    actionId,
    request: { params: actionParams },
    response: nestedEnvelope?.data ?? null,
    nestedTool: actionId,
  }));
}

async function runTrainerListEvidence(params, toolName = "trainer.list_evidence") {
  const startedAtMs = nowMs();
  const rows = await trainerCollectEvidenceRows({
    questId: params?.questId || TRAINER_DEFAULT_QUEST_ID,
    actionId: params?.actionId || "",
    scanLimit: params?.scanLimit,
    limit: params?.limit,
  });
  return withToolMeta(toolName, startedAtMs, makeToolSuccess({
    evidence: rows,
    count: rows.length,
  }));
}

function runTrainerGetTranscriptIntegrity(_params, toolName = "trainer.get_transcript_integrity") {
  const startedAtMs = nowMs();
  const transcriptIntegrity = computeTranscriptToolStats(state.transcript);
  return withToolMeta(toolName, startedAtMs, makeToolSuccess({
    transcriptIntegrity,
    transcriptLength: Array.isArray(state.transcript) ? state.transcript.length : 0,
  }));
}

async function runTrainerGetSessionContext(params, toolName = "trainer.get_session_context") {
  const startedAtMs = nowMs();
  const runtimeSnapshot = await resolveRuntimeSnapshotFromInput({
    runtimeContext: params?.runtimeContext || null,
    runtimeState: params?.runtimeState || null,
  });
  const runtimeSections = buildRuntimeContextSections(runtimeSnapshot);
  const transcriptIntegrity = computeTranscriptToolStats(state.transcript);
  return withToolMeta(toolName, startedAtMs, makeToolSuccess({
    sessionContext: {
      sessionId: state.sessionId || null,
      generatedAtMs: nowMs(),
      runtimeContext: runtimeSections.runtimeContext,
      runtimeAppState: runtimeSections.runtimeAppStateSummary,
      runtimeContextPrompt: runtimeSections.runtimeContextPrompt || null,
      runtimeExperiencePrompt: runtimeSections.runtimeExperiencePrompt || null,
      activeSkillPrompt: runtimeSections.activeSkillPrompt || null,
      coopChatPrompt: runtimeSections.coopChatPrompt || null,
      contextSections: runtimeSections.contextSections,
      combinedContext: runtimeSections.combinedContext || "",
      lastLlmInput: state.lastLlmInput || null,
      transcriptIntegrity,
      trainer: {
        activeCaptureAttemptId: state.trainer?.activeCapture?.attemptId || null,
        coaching: trainerNormalizeCoachingState(state.trainer?.coaching),
      },
    },
    runtimeContext: runtimeSections.runtimeContext,
  }));
}

async function runTrainerExplainNotUsed(params, toolName = "trainer.explain_not_used") {
  const startedAtMs = nowMs();
  const actionId = String(params?.actionId || "").trim();
  const collected = await trainerCollectActionStats({
    questId: params?.questId || TRAINER_DEFAULT_QUEST_ID,
    scanLimit: params?.scanLimit,
  });
  const action = collected.actions.find((row) => String(row?.id || "") === actionId) || null;
  const evidence = await trainerCollectEvidenceRows({
    questId: collected.questId,
    actionId,
    scanLimit: params?.scanLimit,
    limit: 10,
  });
  return withToolMeta(toolName, startedAtMs, makeToolSuccess({
    actionId: actionId || null,
    actionExists: !!action,
    attempted: Number(action?.runStats?.invocations || 0) > 0,
    matchedCalls: Number(action?.runStats?.invocations || 0),
    missingResults: 0,
    notUsed: actionId ? Number(action?.runStats?.invocations || 0) === 0 : null,
    reasonCodes: actionId
      ? (Number(action?.runStats?.invocations || 0) > 0 ? [] : ["NO_MATCHING_TOOL_CALLS"])
      : [],
    evidenceCount: evidence.length,
    freshEvidenceCount: evidence.length,
    evidence,
    diagnostics: {
      totalActions: collected.actions.length,
      scannedAttempts: collected.scannedAttempts,
    },
  }));
}

async function runTrainerDeleteTrace(params, toolName = "trainer.delete_trace") {
  const startedAtMs = nowMs();
  let resolved;
  try {
    resolved = await trainerResolveAttemptIdForTool(
      params?.questId || TRAINER_DEFAULT_QUEST_ID,
      params?.attemptId || "",
    );
  } catch (err) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("NOT_FOUND", String(err?.message || "ATTEMPT_NOT_FOUND")));
  }

  const prefix = `${trainerAttemptRoot(resolved.questId, resolved.attemptId)}/`;
  const paths = await vfsListPaths(prefix);
  if (!paths.length) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("NOT_FOUND", "ATTEMPT_NOT_FOUND"));
  }

  const decision = await requestApproval({
    title: "Approval",
    body: `Delete trainer trace ${resolved.attemptId}`,
  });
  if (decision !== "approve") {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("APPROVAL_REJECTED", "Trainer trace delete rejected"));
  }

  await deleteByKeys("vfs", paths);
  if (String(state.trainer?.activeCapture?.attemptId || "") === resolved.attemptId) {
    state.trainer.activeCapture = null;
  }
  return withToolMeta(toolName, startedAtMs, makeToolSuccess({
    questId: resolved.questId,
    attemptId: resolved.attemptId,
    deleted: true,
    deletedPaths: paths.length,
  }));
}

async function runTrainerClearTraces(params, toolName = "trainer.clear_traces") {
  const startedAtMs = nowMs();
  const questIdRaw = String(params?.questId || "").trim();
  const prefix = questIdRaw
    ? `${trainerAttemptsRoot(trainerQuestId(questIdRaw))}/`
    : `${TRAINER_ROOT_PATH}/quests/`;
  const allPaths = await vfsListPaths(prefix);
  const tracePaths = allPaths.filter((path) => String(path || "").includes("/attempts/"));
  if (!tracePaths.length) {
    return withToolMeta(toolName, startedAtMs, makeToolSuccess({
      deleted: true,
      deletedPaths: 0,
      deletedAttempts: 0,
      scope: questIdRaw ? trainerQuestId(questIdRaw) : "all",
    }));
  }

  const decision = await requestApproval({
    title: "Approval",
    body: questIdRaw ? `Clear trainer traces for ${trainerQuestId(questIdRaw)}` : "Clear all trainer traces",
  });
  if (decision !== "approve") {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("APPROVAL_REJECTED", "Trainer trace clear rejected"));
  }

  await deleteByKeys("vfs", tracePaths);
  state.trainer.activeCapture = null;
  const attemptRoots = new Set(
    tracePaths
      .map((path) => {
        const normalized = String(path || "");
        const marker = "/attempts/";
        const idx = normalized.indexOf(marker);
        if (idx < 0) return "";
        const suffix = normalized.slice(idx + marker.length);
        const parts = suffix.split("/");
        if (!parts.length || !parts[0]) return "";
        return normalized.slice(0, idx + marker.length + parts[0].length);
      })
      .filter(Boolean),
  );
  return withToolMeta(toolName, startedAtMs, makeToolSuccess({
    deleted: true,
    deletedPaths: tracePaths.length,
    deletedAttempts: attemptRoots.size,
    scope: questIdRaw ? trainerQuestId(questIdRaw) : "all",
  }));
}

function trainerClone(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}

function trainerNormalizeBackupMetaRows(rows) {
  const out = [];
  const seen = new Set();
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!isPlainObject(row)) continue;
    const key = typeof row.key === "string" ? row.key.trim() : "";
    if (!key || key === "krootB64" || seen.has(key)) continue;
    seen.add(key);
    out.push({ key, value: trainerClone(row.value) });
  }
  return out;
}

function trainerNormalizeBackupVfsRows(rows) {
  const out = [];
  const seen = new Set();
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!isPlainObject(row)) continue;
    const path = typeof row.path === "string" ? row.path.trim() : "";
    const dataB64 = typeof row.dataB64 === "string" ? row.dataB64.trim() : "";
    if (!path || !dataB64 || seen.has(path)) continue;
    seen.add(path);
    const updatedAtMsRaw = Number(row.updatedAtMs);
    out.push({
      path,
      updatedAtMs: Number.isFinite(updatedAtMsRaw) && updatedAtMsRaw >= 0 ? Math.floor(updatedAtMsRaw) : nowMs(),
      dataB64,
    });
  }
  return out;
}

function trainerNormalizeBackupCheckpointRows(rows) {
  const out = [];
  const seen = new Set();
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!isPlainObject(row)) continue;
    const checkpointId = typeof row.checkpointId === "string" ? row.checkpointId.trim() : "";
    if (!checkpointId || seen.has(checkpointId)) continue;
    const cloned = trainerClone(row);
    if (!isPlainObject(cloned)) continue;
    cloned.checkpointId = checkpointId;
    seen.add(checkpointId);
    out.push(cloned);
  }
  return out;
}

async function trainerExportPersonalBackup() {
  const [metaRows, vfsRows, checkpointRows] = await Promise.all([
    idbGetAll("meta"),
    idbGetAll("vfs"),
    idbGetAll("checkpoints"),
  ]);
  const backup = {
    v: TRAINER_VERSION,
    kind: TRAINER_PERSONAL_BACKUP_KIND,
    createdAt: new Date().toISOString(),
    stores: {
      meta: trainerNormalizeBackupMetaRows(metaRows),
      vfs: trainerNormalizeBackupVfsRows(vfsRows),
      checkpoints: trainerNormalizeBackupCheckpointRows(checkpointRows),
    },
  };
  const sizeBytes = utf8ToBytes(JSON.stringify(backup)).length;
  if (sizeBytes > TRAINER_BACKUP_MAX_BYTES) {
    throw new Error("BACKUP_TOO_LARGE");
  }
  return {
    backup,
    sizeBytes,
    counts: {
      meta: backup.stores.meta.length,
      vfs: backup.stores.vfs.length,
      checkpoints: backup.stores.checkpoints.length,
    },
  };
}

function trainerNormalizeBackupPayload(raw) {
  if (!isPlainObject(raw)) throw new Error("INVALID_BACKUP");
  if (Number(raw.v) !== TRAINER_VERSION) throw new Error("INVALID_BACKUP");
  if (String(raw.kind || "").trim() !== TRAINER_PERSONAL_BACKUP_KIND) throw new Error("INVALID_BACKUP");
  const stores = isPlainObject(raw.stores) ? raw.stores : null;
  if (!stores) throw new Error("INVALID_BACKUP");
  return {
    v: TRAINER_VERSION,
    kind: TRAINER_PERSONAL_BACKUP_KIND,
    createdAt: typeof raw.createdAt === "string" && raw.createdAt.trim() ? raw.createdAt.trim() : new Date().toISOString(),
    stores: {
      meta: trainerNormalizeBackupMetaRows(stores.meta),
      vfs: trainerNormalizeBackupVfsRows(stores.vfs),
      checkpoints: trainerNormalizeBackupCheckpointRows(stores.checkpoints),
    },
  };
}

async function trainerImportPersonalBackup(rawBackup) {
  const normalized = trainerNormalizeBackupPayload(rawBackup);
  const sizeBytes = utf8ToBytes(JSON.stringify(normalized)).length;
  if (sizeBytes > TRAINER_BACKUP_MAX_BYTES) {
    throw new Error("BACKUP_TOO_LARGE");
  }

  const db = await openDb();
  const tx = db.transaction(["meta", "vfs", "checkpoints"], "readwrite");
  const meta = tx.objectStore("meta");
  const vfs = tx.objectStore("vfs");
  const checkpoints = tx.objectStore("checkpoints");
  meta.clear();
  vfs.clear();
  checkpoints.clear();
  for (const row of normalized.stores.meta) meta.put(row);
  for (const row of normalized.stores.vfs) vfs.put(row);
  for (const row of normalized.stores.checkpoints) checkpoints.put(row);
  await idbTxDone(tx);

  // Rehydrate runtime state from restored stores.
  await loadStateFromIdb();
  updateGatewayState();

  return {
    imported: true,
    sizeBytes,
    counts: {
      meta: normalized.stores.meta.length,
      vfs: normalized.stores.vfs.length,
      checkpoints: normalized.stores.checkpoints.length,
    },
  };
}

function buildSyntheticToolCalls(count) {
  const target = Math.max(0, Math.floor(Number(count) || 0));
  const calls = [];
  for (let i = 0; i < target; i += 1) {
    const spec = LITE_TOOL_SPECS[i % LITE_TOOL_SPECS.length];
    calls.push({
      type: "toolCall",
      id: randomId("tc"),
      name: spec.name,
      arguments: spec.sampleArgs || {},
    });
  }
  return calls;
}

function computeTranscriptToolStats(messages) {
  const expectedIndexByToolCallId = new Map();
  const seenToolResultIds = new Set();
  let toolResultCount = 0;
  let orphanToolResults = 0;
  let duplicateToolResults = 0;
  let displacedToolResults = 0;

  for (let i = 0; i < messages.length; i += 1) {
    const msg = messages[i];
    if (!msg || typeof msg !== "object") continue;
    if (msg.role !== "assistant" || !Array.isArray(msg.content)) continue;
    const calls = msg.content.filter((c) => c && c.type === "toolCall" && typeof c.id === "string" && c.id);
    for (let j = 0; j < calls.length; j += 1) {
      expectedIndexByToolCallId.set(calls[j].id, i + 1 + j);
    }
  }

  for (let i = 0; i < messages.length; i += 1) {
    const msg = messages[i];
    if (!msg || typeof msg !== "object" || msg.role !== "toolResult") continue;
    toolResultCount += 1;
    const id =
      (typeof msg.toolCallId === "string" && msg.toolCallId) ||
      (typeof msg.toolUseId === "string" && msg.toolUseId) ||
      "";
    if (!id || !expectedIndexByToolCallId.has(id)) {
      orphanToolResults += 1;
      continue;
    }
    if (seenToolResultIds.has(id)) {
      duplicateToolResults += 1;
      continue;
    }
    seenToolResultIds.add(id);
    if (expectedIndexByToolCallId.get(id) !== i) {
      displacedToolResults += 1;
    }
  }

  return {
    toolResultCount,
    orphanToolResults,
    duplicateToolResults,
    displacedToolResults,
  };
}

async function runSyntheticToolSmoke(count = 5) {
  const calls = buildSyntheticToolCalls(count);
  const assistant = {
    role: "assistant",
    content: calls,
    api: "openclaw-lite",
    provider: "openclaw-lite",
    model: "tool-smoke",
    stopReason: "tool_calls",
    timestamp: nowMs(),
  };
  state.transcript.push(assistant);

  let completed = 0;
  let failed = 0;
  for (const call of calls) {
    let result;
    let isError = false;
    try {
      result = await dispatchLiteTool(call.name, call.arguments, undefined, undefined);
      completed += 1;
    } catch (e) {
      isError = true;
      failed += 1;
      result = liteToolResult(e?.message || String(e || "UNKNOWN_ERROR"), {
        dispatchPath: LITE_TOOL_DISPATCH_PATH,
      });
    }
    state.transcript.push({
      role: "toolResult",
      toolCallId: call.id,
      toolName: call.name,
      content: result.content,
      details: result.details,
      isError,
      timestamp: nowMs(),
    });
  }

  await persistTranscript();
  return {
    requested: calls.length,
    completed,
    failed,
    dispatchPath: LITE_TOOL_DISPATCH_PATH,
  };
}

const WORKSPACE_CONTEXT_FILE_ORDER = Object.freeze([
  "workspace/AGENTS.md",
  "workspace/SOUL.md",
  "workspace/TOOLS.md",
  "workspace/IDENTITY.md",
  "workspace/USER.md",
  "workspace/HEARTBEAT.md",
  "workspace/BOOTSTRAP.md",
  "workspace/MEMORY.md",
  "workspace/memory.md",
  "workspace/GOALS.md",
  "workspace/PENALTY.md",
]);
const WORKSPACE_CONTEXT_MAX_CHARS = 2e4;
const WORKSPACE_CONTEXT_HEAD_RATIO = 0.7;
const WORKSPACE_CONTEXT_TAIL_RATIO = 0.2;
const SILENT_REPLY_TOKEN = "NO_REPLY";
const LLM_NOT_CONFIGURED_MESSAGE = "LLM not configured. Set your API key or OAuth token in the Gateway panel.";

function workspaceContextPath(workspacePath) {
  const normalized = String(workspacePath || "").replace(/\\/g, "/");
  if (normalized.startsWith("workspace/")) {
    return normalized.slice("workspace/".length);
  }
  return normalized;
}

function textFromMessageContent(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.map((part) => (part && part.type === "text" && typeof part.text === "string" ? part.text : "")).join("");
}

function trimWorkspaceContextContent(content, fileName, maxChars = WORKSPACE_CONTEXT_MAX_CHARS) {
  const trimmed = String(content || "").trimEnd();
  if (!trimmed) {
    return { content: "", truncated: false, originalLength: 0, maxChars };
  }
  if (trimmed.length <= maxChars) {
    return { content: trimmed, truncated: false, originalLength: trimmed.length, maxChars };
  }

  const headChars = Math.floor(maxChars * WORKSPACE_CONTEXT_HEAD_RATIO);
  const tailChars = Math.floor(maxChars * WORKSPACE_CONTEXT_TAIL_RATIO);
  const head = trimmed.slice(0, headChars);
  const tail = trimmed.slice(-tailChars);
  const marker = [
    "",
    `[...truncated, read ${fileName} for full content...]`,
    `...(truncated ${fileName}: kept ${headChars}+${tailChars} chars of ${trimmed.length})...`,
    "",
  ].join("\n");
  return {
    content: [head, marker, tail].join("\n"),
    truncated: true,
    originalLength: trimmed.length,
    maxChars,
  };
}

function escapeXmlForPrompt(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;");
}

function normalizeSkillPromptCandidatePath(path) {
  const raw = String(path || "").trim().replace(/\\/g, "/");
  if (!raw || !raw.startsWith("workspace/")) return "";
  if (!/\/skill\.md$/i.test(raw)) return "";
  return raw;
}

function parseSkillFrontmatterValue(content, key) {
  const text = String(content || "");
  const frontmatterMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!frontmatterMatch) return "";
  const frontmatter = String(frontmatterMatch[1] || "");
  const lineMatch = frontmatter.match(new RegExp(`^\\s*${key}\\s*:\\s*(.+)$`, "im"));
  if (!lineMatch || typeof lineMatch[1] !== "string") return "";
  const raw = lineMatch[1].trim();
  if (!raw) return "";
  if (
    (raw.startsWith("\"") && raw.endsWith("\"") && raw.length >= 2)
    || (raw.startsWith("'") && raw.endsWith("'") && raw.length >= 2)
  ) {
    return raw.slice(1, -1).trim();
  }
  return raw;
}

function inferSkillNameFromPath(path) {
  const normalized = String(path || "").trim().replace(/\\/g, "/");
  if (!normalized) return "skill";
  const parts = normalized.split("/").filter(Boolean);
  if (parts.length === 0) return "skill";
  const last = String(parts[parts.length - 1] || "").trim().toLowerCase();
  if (last === "skill.md" || last === "skill") {
    const parent = String(parts[parts.length - 2] || "").trim();
    return parent || "skill";
  }
  return String(parts[parts.length - 1] || "skill").trim() || "skill";
}

function isSkillCompatibilityMirrorPath(path) {
  const normalized = String(path || "").trim().replace(/\\/g, "/");
  if (!normalized) return false;
  const folded = normalized.toLowerCase();
  if (folded === "workspace/skill.md") return true;
  return /^workspace\/skills\/[^/]+\/skill\.md$/i.test(normalized);
}

function skillPromptPathSpecificity(path) {
  const normalized = String(path || "").trim().replace(/\\/g, "/");
  if (!normalized) return 0;
  const segments = normalized.split("/").filter(Boolean);
  const depthScore = segments.length * 1000;
  const lengthScore = normalized.length;
  const compatibilityPenalty = isSkillCompatibilityMirrorPath(normalized) ? 500_000 : 0;
  return depthScore + lengthScore - compatibilityPenalty;
}

function normalizeSkillPromptSourceUrl(value) {
  const raw = String(value || "").trim();
  return raw || null;
}

function buildSkillPromptCandidate(path, metadata = {}) {
  const normalizedPath = normalizeSkillPromptCandidatePath(path);
  if (!normalizedPath) return null;
  return {
    path: normalizedPath,
    sourceUrl: normalizeSkillPromptSourceUrl(metadata?.sourceUrl),
    finalUrl: normalizeSkillPromptSourceUrl(metadata?.finalUrl),
    specificity: skillPromptPathSpecificity(normalizedPath),
  };
}

function skillPromptCandidateIdentity(candidate) {
  const finalUrl = String(candidate?.finalUrl || "").trim();
  if (finalUrl) return `final:${finalUrl}`;
  const sourceUrl = String(candidate?.sourceUrl || "").trim();
  if (sourceUrl) return `source:${sourceUrl}`;
  return `path:${String(candidate?.path || "").toLowerCase()}`;
}

function skillPromptCandidateSort(a, b) {
  const specificityDiff = Number(b?.specificity || 0) - Number(a?.specificity || 0);
  if (specificityDiff !== 0) return specificityDiff;
  const pathDiff = skillImportPathSort(a?.path || "", b?.path || "");
  if (pathDiff !== 0) return pathDiff;
  const aSource = String(a?.finalUrl || a?.sourceUrl || "");
  const bSource = String(b?.finalUrl || b?.sourceUrl || "");
  return skillImportPathSort(aSource, bSource);
}

function collectSkillPromptCandidates() {
  const out = [];
  const seenByPath = new Set();
  const pushCandidate = (path, metadata = {}) => {
    const candidate = buildSkillPromptCandidate(path, metadata);
    if (!candidate) return;
    const folded = candidate.path.toLowerCase();
    if (seenByPath.has(folded)) return;
    seenByPath.add(folded);
    out.push(candidate);
  };

  pushCandidate(state.skillImport.activeSkillPath, {
    sourceUrl: state.skillImport.sourceUrl,
    finalUrl: state.skillImport.sourceUrl,
  });
  for (const file of Array.isArray(state.skillImport.importedFiles) ? state.skillImport.importedFiles : []) {
    pushCandidate(file?.path, file);
  }
  for (const path of Array.isArray(state.skillImport.importedPaths) ? state.skillImport.importedPaths : []) {
    pushCandidate(path);
  }
  pushCandidate("workspace/SKILL.md");
  pushCandidate("workspace/skill.md");
  return out;
}

function selectSkillPromptCandidates(candidates, { limit = 32 } = {}) {
  const max = Math.max(0, Math.floor(Number(limit) || 0));
  const byIdentity = new Map();
  for (const candidate of Array.isArray(candidates) ? candidates : []) {
    if (!candidate || typeof candidate !== "object") continue;
    const key = skillPromptCandidateIdentity(candidate);
    const current = byIdentity.get(key);
    if (!current || skillPromptCandidateSort(candidate, current) < 0) {
      byIdentity.set(key, candidate);
    }
  }
  return Array.from(byIdentity.values()).sort(skillPromptCandidateSort).slice(0, max);
}

async function buildLiteSkillsPrompt() {
  const candidates = selectSkillPromptCandidates(collectSkillPromptCandidates(), { limit: 64 });
  if (!candidates.length) return "";

  const entries = [];
  for (const candidate of candidates) {
    const path = String(candidate?.path || "");
    if (!path) continue;
    const content = await vfsGetUtf8(path);
    if (content === null) continue;
    const rawName = parseSkillFrontmatterValue(content, "name");
    const rawDescription = parseSkillFrontmatterValue(content, "description");
    const name = (rawName || inferSkillNameFromPath(path)).trim() || "skill";
    const description = (rawDescription || `Skill instructions at ${path}`).trim() || `Skill instructions at ${path}`;
    entries.push({ name, description, location: path });
    if (entries.length >= 16) break;
  }

  if (!entries.length) return "";
  const lines = [
    "The following skills provide specialized instructions for specific tasks.",
    "Skills are listed from most specific to least specific paths.",
    "Use the workspace_read_file tool to load a skill's file when the task matches its description.",
    "When a skill file references a relative path, resolve it against the skill directory (parent of SKILL.md).",
    "",
    "<available_skills>",
  ];
  for (const entry of entries) {
    lines.push("  <skill>");
    lines.push(`    <name>${escapeXmlForPrompt(entry.name)}</name>`);
    lines.push(`    <description>${escapeXmlForPrompt(entry.description)}</description>`);
    lines.push(`    <location>${escapeXmlForPrompt(entry.location)}</location>`);
    lines.push("  </skill>");
  }
  lines.push("</available_skills>");
  return lines.join("\n");
}

async function buildWorkspaceContextFiles() {
  await ensureWorkspaceFiles({ recordEvents: false });
  const contextFiles = [];
  const usedFiles = [];
  const truncatedFiles = [];
  const seenCaseFoldedPaths = new Set();

  for (const path of WORKSPACE_CONTEXT_FILE_ORDER) {
    const foldedPath = String(path || "").toLowerCase();
    if (seenCaseFoldedPaths.has(foldedPath)) continue;
    const content = await vfsGetUtf8(path);
    if (content === null) continue;
    seenCaseFoldedPaths.add(foldedPath);
    const fileName = workspaceContextPath(path);
    const trimmed = trimWorkspaceContextContent(content, fileName, WORKSPACE_CONTEXT_MAX_CHARS);
    if (!trimmed.content) continue;
    contextFiles.push({
      path: fileName,
      content: trimmed.content,
    });
    usedFiles.push(path);
    if (trimmed.truncated) {
      truncatedFiles.push(path);
    }
  }

  return {
    contextFiles,
    usedFiles,
    truncatedFiles,
  };
}

function buildLiteToolSummaryMap(tools) {
  const map = {};
  for (const tool of Array.isArray(tools) ? tools : []) {
    const key = String(tool?.name || "")
      .trim()
      .toLowerCase();
    if (!key) continue;
    const summary = String(tool?.description || tool?.label || "").trim();
    if (!summary) continue;
    map[key] = summary;
  }
  return map;
}

function resolveWorkerTimezone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const value = String(tz || "").trim();
    return value || undefined;
  } catch {
    return undefined;
  }
}

function buildLiteRuntimeInfo(model) {
  let host = "browser";
  try {
    const origin = safeOrigin();
    if (origin) {
      host = new URL(origin).host || host;
    }
  } catch {
    // no-op
  }
  const provider = String(model?.provider || "unknown").trim() || "unknown";
  const modelId = String(model?.id || "unknown").trim() || "unknown";
  const modelRef = `${provider}/${modelId}`;
  return {
    agentId: MAIN_AGENT_ID,
    host,
    os: "browser",
    arch: "web",
    node: "n/a",
    model: modelRef,
    defaultModel: modelRef,
    channel: "webchat",
    capabilities: [],
  };
}

function buildLiteRuntimeLine(runtimeInfo, runtimeChannel, runtimeCapabilities = [], defaultThinkLevel) {
  return `Runtime: ${[
    runtimeInfo?.agentId ? `agent=${runtimeInfo.agentId}` : "",
    runtimeInfo?.host ? `host=${runtimeInfo.host}` : "",
    runtimeInfo?.repoRoot ? `repo=${runtimeInfo.repoRoot}` : "",
    runtimeInfo?.os
      ? `os=${runtimeInfo.os}${runtimeInfo?.arch ? ` (${runtimeInfo.arch})` : ""}`
      : runtimeInfo?.arch
        ? `arch=${runtimeInfo.arch}`
        : "",
    runtimeInfo?.node ? `node=${runtimeInfo.node}` : "",
    runtimeInfo?.model ? `model=${runtimeInfo.model}` : "",
    runtimeInfo?.defaultModel ? `default_model=${runtimeInfo.defaultModel}` : "",
    runtimeInfo?.shell ? `shell=${runtimeInfo.shell}` : "",
    runtimeChannel ? `channel=${runtimeChannel}` : "",
    runtimeChannel
      ? `capabilities=${runtimeCapabilities.length > 0 ? runtimeCapabilities.join(",") : "none"}`
      : "",
    `thinking=${defaultThinkLevel || "off"}`,
  ]
    .filter(Boolean)
    .join(" | ")}`;
}

function buildLiteAgentSystemPrompt(params) {
  const coreToolSummaries = {
    read: "Read file contents",
    write: "Create or overwrite files",
    edit: "Make precise edits to files",
    apply_patch: "Apply multi-file patches",
    grep: "Search file contents for patterns",
    find: "Find files by glob pattern",
    ls: "List directory contents",
    exec: "Run shell commands (pty available for TTY-required CLIs)",
    process: "Manage background exec sessions",
    web_search: "Search the web (Brave API)",
    web_fetch: "Fetch and extract readable content from a URL",
    browser: "Control web browser",
    canvas: "Present/eval/snapshot the Canvas",
    nodes: "List/describe/notify/camera/screen on paired nodes",
    cron: "Manage cron jobs and wake events",
    message: "Send messages and channel actions",
    gateway: "Restart, apply config, or run updates on the running OpenClaw process",
    agents_list: "List agent ids allowed for sessions_spawn",
    sessions_list: "List other sessions (incl. sub-agents) with filters/last",
    sessions_history: "Fetch history for another session/sub-agent",
    sessions_send: "Send a message to another session/sub-agent",
    session_status: "Show a /status-equivalent status card",
    image: "Analyze an image with the configured image model",
  };
  const toolOrder = [
    "read",
    "write",
    "edit",
    "apply_patch",
    "grep",
    "find",
    "ls",
    "exec",
    "process",
    "web_search",
    "web_fetch",
    "browser",
    "canvas",
    "nodes",
    "cron",
    "message",
    "gateway",
    "agents_list",
    "sessions_list",
    "sessions_history",
    "sessions_send",
    "session_status",
    "image",
  ];

  const rawToolNames = (params.toolNames || []).map((tool) => String(tool || "").trim());
  const canonicalToolNames = rawToolNames.filter(Boolean);
  const canonicalByNormalized = new Map();
  for (const name of canonicalToolNames) {
    const normalized = name.toLowerCase();
    if (!canonicalByNormalized.has(normalized)) {
      canonicalByNormalized.set(normalized, name);
    }
  }
  const resolveToolName = (normalized) => canonicalByNormalized.get(normalized) || normalized;
  const normalizedTools = canonicalToolNames.map((tool) => tool.toLowerCase());
  const availableTools = new Set(normalizedTools);
  const externalToolSummaries = new Map();
  for (const [key, value] of Object.entries(params.toolSummaries || {})) {
    const normalized = key.trim().toLowerCase();
    if (!normalized || !String(value || "").trim()) continue;
    externalToolSummaries.set(normalized, String(value).trim());
  }
  const extraTools = Array.from(new Set(normalizedTools.filter((tool) => !toolOrder.includes(tool))));
  const enabledTools = toolOrder.filter((tool) => availableTools.has(tool));
  const toolLines = enabledTools.map((tool) => {
    const summary = coreToolSummaries[tool] || externalToolSummaries.get(tool);
    const name = resolveToolName(tool);
    return summary ? `- ${name}: ${summary}` : `- ${name}`;
  });
  for (const tool of extraTools.sort()) {
    const summary = coreToolSummaries[tool] || externalToolSummaries.get(tool);
    const name = resolveToolName(tool);
    toolLines.push(summary ? `- ${name}: ${summary}` : `- ${name}`);
  }

  const userTimezone = String(params.userTimezone || "").trim();
  const runtimeInfo = params.runtimeInfo || {};
  const runtimeChannel = runtimeInfo.channel ? String(runtimeInfo.channel).trim().toLowerCase() : undefined;
  const runtimeCapabilities = Array.isArray(runtimeInfo.capabilities)
    ? runtimeInfo.capabilities.map((cap) => String(cap || "").trim()).filter(Boolean)
    : [];
  const contextFiles = Array.isArray(params.contextFiles) ? params.contextFiles : [];
  const skillsPrompt = String(params.skillsPrompt || "").trim();
  const validContextFiles = contextFiles.filter(
    (file) => file && typeof file.path === "string" && String(file.path).trim().length > 0,
  );
  const hasSoulFile = validContextFiles.some((file) => {
    const normalizedPath = String(file.path).trim().replace(/\\/g, "/");
    const baseName = normalizedPath.split("/").pop() || normalizedPath;
    return baseName.toLowerCase() === "soul.md";
  });

  const lines = [
    "You are a personal assistant running inside OpenClaw Lite.",
    "",
    "## Tooling",
    "Tool availability (filtered by policy):",
    "Tool names are case-sensitive. Call tools exactly as listed.",
    toolLines.length > 0
      ? toolLines.join("\n")
      : "No tools are currently enabled for this runtime.",
    "TOOLS.md does not control tool availability; it is user guidance for how to use external tools.",
    "Do not reference unavailable sub-agent workflows. Solve requests with the tools exposed in this browser runtime.",
    "",
    "## Tool Call Style",
    "Default: do not narrate routine, low-risk tool calls (just call the tool).",
    "Narrate only when it helps: multi-step work, complex/challenging problems, sensitive actions (e.g., deletions), or when the user explicitly asks.",
    "Keep narration brief and value-dense; avoid repeating obvious steps.",
    "Use plain human language for narration unless in a technical context.",
    "",
    ...(skillsPrompt
      ? [
        "## Skills (mandatory)",
        "Before replying: scan <available_skills> <description> entries.",
        "- If exactly one skill clearly applies: read its SKILL.md at <location> with `workspace_read_file`, then follow it.",
        "- If multiple could apply: choose the most specific one, then read/follow it.",
        "- If none clearly apply: do not read any SKILL.md.",
        "Constraints: never read more than one skill up front; only read after selecting.",
        skillsPrompt,
        "",
      ]
      : []),
    "## Safety",
    "You have no independent goals: do not pursue self-preservation, replication, resource acquisition, or power-seeking; avoid long-term plans beyond the user's request.",
    "Prioritize safety and human oversight over completion; if instructions conflict, pause and ask; comply with stop/pause/audit requests and never bypass safeguards. (Inspired by Anthropic's constitution.)",
    "Do not manipulate or persuade anyone to expand access or disable safeguards. Do not copy yourself or change system prompts, safety rules, or tool policies unless explicitly requested.",
    "",
    userTimezone ? "## Current Date & Time" : "",
    userTimezone ? `Time zone: ${userTimezone}` : "",
    userTimezone ? "" : "",
    userTimezone
      ? "If you need the current date, time, or day of week, use the browser runtime clock."
      : "",
    "## Workspace",
    `Your working directory is: ${params.workspaceDir}`,
    "Treat this directory as the single global workspace for file operations unless explicitly instructed otherwise.",
    "",
    "## Workspace Files (injected)",
    "These user-editable files are loaded by OpenClaw and included below in Project Context.",
    "",
  ];

  const extraSystemPrompt = String(params.extraSystemPrompt || "").trim();
  if (extraSystemPrompt) {
    lines.push("## Group Chat Context", extraSystemPrompt, "");
  }

  if (validContextFiles.length > 0) {
    lines.push("# Project Context", "", "The following project context files have been loaded:");
    if (hasSoulFile) {
      lines.push(
        "If SOUL.md is present, embody its persona and tone. Avoid stiff, generic replies; follow its guidance unless higher-priority instructions override it.",
      );
    }
    lines.push("");
    for (const file of validContextFiles) {
      lines.push(`## ${file.path}`, "", file.content, "");
    }
  }

  lines.push(
    "## Silent Replies",
    `When you have nothing to say, respond with ONLY: ${SILENT_REPLY_TOKEN}`,
    "",
    "## Heartbeats",
    "Heartbeat prompt: (configured)",
    "If you receive a heartbeat poll (a user message matching the heartbeat prompt above), and there is nothing that needs attention, reply exactly:",
    "HEARTBEAT_OK",
    'OpenClaw treats a leading/trailing "HEARTBEAT_OK" as a heartbeat ack (and may discard it).',
    'If something needs attention, do NOT include "HEARTBEAT_OK"; reply with the alert text instead.',
    "",
    "## Runtime",
    buildLiteRuntimeLine(runtimeInfo, runtimeChannel, runtimeCapabilities, params.defaultThinkLevel),
    "Reasoning: off (hidden unless on/stream). Reasoning mode is controlled by local model settings in this runtime.",
  );

  return lines.filter(Boolean).join("\n");
}

function buildLiteSystemPrompt({ model, tools, contextFiles, skillsPrompt = "" }) {
  return buildLiteAgentSystemPrompt({
    workspaceDir: "workspace/",
    defaultThinkLevel: state.llmReasoning || "off",
    extraSystemPrompt: "",
    toolNames: (tools || []).map((tool) => tool.name),
    toolSummaries: buildLiteToolSummaryMap(tools),
    userTimezone: resolveWorkerTimezone(),
    runtimeInfo: buildLiteRuntimeInfo(model),
    contextFiles: Array.isArray(contextFiles) ? contextFiles : [],
    skillsPrompt: String(skillsPrompt || ""),
  });
}

async function buildLitePromptPreview({ model, tools } = {}) {
  const resolvedModel = model || getConfiguredModel();
  const resolvedTools = Array.isArray(tools) ? tools : getLiteTools();
  const workspacePrompt = await buildWorkspaceContextFiles();
  const skillsPrompt = await buildLiteSkillsPrompt();
  const systemPrompt = buildLiteSystemPrompt({
    model: resolvedModel,
    tools: resolvedTools,
    contextFiles: workspacePrompt.contextFiles,
    skillsPrompt,
  });
  return {
    systemPrompt,
    skillsPrompt,
    contextFiles: workspacePrompt.contextFiles,
    contextFilePaths: workspacePrompt.contextFiles.map((file) => String(file?.path || "")).filter(Boolean),
    usedFiles: workspacePrompt.usedFiles,
    truncatedFiles: workspacePrompt.truncatedFiles,
  };
}

async function resolveRuntimeSessionContextValues() {
  const snapshot = await resolveRuntimeSessionSnapshot();
  return snapshot.context;
}

async function resolveRuntimeSessionSnapshot() {
  try {
    const appState = await apiJson("/api/state", { method: "GET" });
    const runtimeOrigin = safeOrigin() || null;
    const teamCode =
      typeof appState?.teamCode === "string" && appState.teamCode.trim() ? appState.teamCode.trim() : null;
    const runtimeHouseId = typeof state.houseId === "string" && state.houseId.trim() ? state.houseId.trim() : null;
    const stateHouseId =
      typeof appState?.houseId === "string" && appState.houseId.trim() ? appState.houseId.trim() : null;
    const houseId = runtimeHouseId || stateHouseId || null;

    const normalizedTeamCode = normalizeTeamCodeHint(teamCode);
    if (normalizedTeamCode && normalizedTeamCode !== state.teamCodeHint) {
      state.teamCodeHint = normalizedTeamCode;
      metaSet("teamCodeHint", normalizedTeamCode).catch(() => {
        // Non-fatal; hint is best-effort.
      });
    }

    const context = runtimeOrigin || teamCode || houseId
      ? { origin: runtimeOrigin, teamCode, houseId }
      : null;
    return { context, appState };
  } catch {
    return { context: null, appState: null };
  }
}

function buildRuntimeSessionContextPrompt(context) {
  if (!context || typeof context !== "object") return "";
  const lines = [];
  if (context.origin) lines.push(`- origin: ${context.origin}`);
  if (context.teamCode) lines.push(`- teamCode: ${context.teamCode}`);
  if (context.houseId) lines.push(`- houseId: ${context.houseId}`);
  if (!lines.length) return "";
  return `Runtime session context (authoritative):
${lines.join("\n")}
Use these values directly when SKILL.md asks for origin/teamCode/houseId.
Do not ask the human for them unless missing.
Do not substitute another localhost port when origin is provided.`;
}

function buildRuntimeExperienceStatePrompt(appState) {
  const stateObj = appState && typeof appState === "object" ? appState : null;
  if (!stateObj) return "";

  const experienceId = typeof stateObj?.experience?.id === "string" ? stateObj.experience.id.trim() : "";
  const experienceStep = typeof stateObj?.experience?.step === "string" ? stateObj.experience.step.trim() : "";
  const nextAgentAction =
    typeof stateObj?.experience?.nextAgentAction === "string" ? stateObj.experience.nextAgentAction.trim() : "";
  const humanSelected = typeof stateObj?.human?.selected === "string" ? stateObj.human.selected.trim() : "";
  const agentSelected = typeof stateObj?.agent?.selected === "string" ? stateObj.agent.selected.trim() : "";
  const matchState = typeof stateObj?.match?.matched === "boolean" ? stateObj.match.matched : null;
  const humanOpenPressed = !!stateObj?.human?.openPressed;
  const agentOpenPressed = !!stateObj?.agent?.openPressed;

  const lines = [];
  if (experienceId) lines.push(`- experience.id: ${experienceId}`);
  if (experienceStep) lines.push(`- experience.step: ${experienceStep}`);
  if (nextAgentAction) lines.push(`- experience.nextAgentAction: ${nextAgentAction}`);
  if (humanSelected) lines.push(`- human.selected: ${humanSelected}`);
  if (agentSelected) lines.push(`- agent.selected: ${agentSelected}`);
  if (matchState !== null) lines.push(`- match.matched: ${matchState ? "true" : "false"}`);
  lines.push(`- human.openPressed: ${humanOpenPressed ? "true" : "false"}`);
  lines.push(`- agent.openPressed: ${agentOpenPressed ? "true" : "false"}`);

  if (!lines.length) return "";
  return `Runtime experience state (authoritative):
${lines.join("\n")}
Use this state directly for status questions before asking the human to repeat values.`;
}

function buildActiveSkillGuidancePrompt() {
  const activeSkillPath =
    typeof state.skillImport?.activeSkillPath === "string" ? state.skillImport.activeSkillPath.trim() : "";
  const sourceUrl = typeof state.skillImport?.sourceUrl === "string" ? state.skillImport.sourceUrl.trim() : "";
  const skillStatus = typeof state.skillImport?.status === "string" ? state.skillImport.status.trim() : "";
  if (!activeSkillPath || skillStatus !== "ready") return "";

  const lines = [
    "Active imported skill package (authoritative for this experience):",
    `- activeSkillPath: ${activeSkillPath}`,
  ];
  if (sourceUrl) lines.push(`- sourceUrl: ${sourceUrl}`);
  lines.push(
    "Treat this active skill as the default applicable skill for this chat unless the user explicitly switches experiences.",
    "Do not claim SKILL.md is missing while this path exists.",
    "Read activeSkillPath with workspace_read_file first; if needed, use workspace/SKILL.md as fallback."
  );
  return lines.join("\n");
}

function buildAgentTownCoopChatGuidancePrompt(appState) {
  const stateObj = appState && typeof appState === "object" ? appState : null;
  if (!stateObj) return "";
  const experienceId = typeof stateObj?.experience?.id === "string" ? stateObj.experience.id.trim() : "";
  if (experienceId !== "agent_town_coop_v1") return "";

  const step = typeof stateObj?.experience?.step === "string" ? stateObj.experience.step.trim() : "";
  if (!step) return "";
  const hasHumanSignals =
    !!stateObj?.human?.selected ||
    !!stateObj?.human?.openPressed ||
    !!stateObj?.match?.matched;
  return [
    "Agent Town co-op guidance:",
    "- This is an active co-op session (`agent_town_coop_v1`): follow the co-op playbook at activeSkillPath (skill.md).",
    ...(hasHumanSignals
      ? [
        "- Human co-op signals are present in runtime state; do not switch to `skill_agent_solo.md` for this turn.",
      ]
      : []),
    "- Only use `skill_agent_solo.md` when the user explicitly asks for solo mode and co-op runtime signals are absent.",
    "- Use the active imported skill and runtime context for this message.",
    "- Treat runtime teamCode/houseId as already provided input.",
    "- Do not ask the human for teamCode/houseId/skill-path when runtime context already provides them.",
    "- If user asks status (e.g. chosen sigil / next step), answer from runtime state first, then do the next safe co-op action.",
  ].join("\n");
}

function summarizeRuntimeAppStateForDebug(appState) {
  const stateObj = appState && typeof appState === "object" ? appState : null;
  if (!stateObj) return null;
  const teamCode = typeof stateObj?.teamCode === "string" && stateObj.teamCode.trim() ? stateObj.teamCode.trim() : null;
  const houseId = typeof stateObj?.houseId === "string" && stateObj.houseId.trim() ? stateObj.houseId.trim() : null;
  const experienceId =
    typeof stateObj?.experience?.id === "string" && stateObj.experience.id.trim() ? stateObj.experience.id.trim() : null;
  const experienceStep =
    typeof stateObj?.experience?.step === "string" && stateObj.experience.step.trim()
      ? stateObj.experience.step.trim()
      : null;
  const nextAgentAction =
    typeof stateObj?.experience?.nextAgentAction === "string" && stateObj.experience.nextAgentAction.trim()
      ? stateObj.experience.nextAgentAction.trim()
      : null;
  const humanSelected =
    typeof stateObj?.human?.selected === "string" && stateObj.human.selected.trim()
      ? stateObj.human.selected.trim()
      : null;
  const agentSelected =
    typeof stateObj?.agent?.selected === "string" && stateObj.agent.selected.trim()
      ? stateObj.agent.selected.trim()
      : null;
  const matchMatched = typeof stateObj?.match?.matched === "boolean" ? stateObj.match.matched : null;
  const humanOpenPressed = !!stateObj?.human?.openPressed;
  const agentOpenPressed = !!stateObj?.agent?.openPressed;
  return {
    teamCode,
    houseId,
    experience: {
      id: experienceId,
      step: experienceStep,
      nextAgentAction,
    },
    human: {
      selected: humanSelected,
      openPressed: humanOpenPressed,
    },
    agent: {
      selected: agentSelected,
      openPressed: agentOpenPressed,
    },
    match: {
      matched: matchMatched,
    },
  };
}

function buildRuntimeContextSections(runtimeSnapshot) {
  const runtimeContext = runtimeSnapshot?.context || null;
  const runtimeAppState = runtimeSnapshot?.appState || null;
  const runtimeContextPrompt = buildRuntimeSessionContextPrompt(runtimeContext);
  const runtimeExperiencePrompt = buildRuntimeExperienceStatePrompt(runtimeAppState);
  const activeSkillPrompt = buildActiveSkillGuidancePrompt();
  const coopChatPrompt = buildAgentTownCoopChatGuidancePrompt(runtimeAppState);
  const contextSections = [runtimeContextPrompt, runtimeExperiencePrompt, activeSkillPrompt, coopChatPrompt].filter(Boolean);
  return {
    runtimeContext,
    runtimeAppState,
    runtimeAppStateSummary: summarizeRuntimeAppStateForDebug(runtimeAppState),
    runtimeContextPrompt,
    runtimeExperiencePrompt,
    activeSkillPrompt,
    coopChatPrompt,
    contextSections,
    combinedContext: contextSections.join("\n\n"),
  };
}

function recordLastLlmInputDebug(payload = {}) {
  const promptText = typeof payload.promptText === "string" ? payload.promptText : "";
  const extraContext = typeof payload.extraContext === "string" ? payload.extraContext : "";
  const source = typeof payload.source === "string" && payload.source.trim() ? payload.source.trim() : "unknown";
  state.lastLlmInput = {
    source,
    atMs: nowMs(),
    sessionId: state.sessionId || null,
    userText: typeof payload.userText === "string" ? payload.userText : "",
    displayUserText: typeof payload.displayUserText === "string" ? payload.displayUserText : "",
    promptText,
    promptTextChars: promptText.length,
    extraContext,
    extraContextChars: extraContext.length,
    extraContextSections: Array.isArray(payload.extraContextSections) ? payload.extraContextSections : [],
    runtimeContext: payload.runtimeContext || null,
    runtimeAppState: payload.runtimeAppState || null,
    runtimeContextPrompt:
      typeof payload.runtimeContextPrompt === "string" && payload.runtimeContextPrompt
        ? payload.runtimeContextPrompt
        : null,
    runtimeExperiencePrompt:
      typeof payload.runtimeExperiencePrompt === "string" && payload.runtimeExperiencePrompt
        ? payload.runtimeExperiencePrompt
        : null,
    activeSkillPrompt:
      typeof payload.activeSkillPrompt === "string" && payload.activeSkillPrompt ? payload.activeSkillPrompt : null,
    coopChatPrompt:
      typeof payload.coopChatPrompt === "string" && payload.coopChatPrompt ? payload.coopChatPrompt : null,
  };
}

function normalizeRuntimeContextInput(input, fallbackState = null) {
  const contextObj = input && typeof input === "object" && !Array.isArray(input) ? input : null;
  const stateObj = fallbackState && typeof fallbackState === "object" && !Array.isArray(fallbackState) ? fallbackState : null;

  const originRaw =
    typeof contextObj?.origin === "string" && contextObj.origin.trim()
      ? contextObj.origin.trim()
      : safeOrigin() || "";
  const teamCodeRaw =
    typeof contextObj?.teamCode === "string" && contextObj.teamCode.trim()
      ? contextObj.teamCode.trim()
      : typeof stateObj?.teamCode === "string" && stateObj.teamCode.trim()
        ? stateObj.teamCode.trim()
        : "";
  const stateHouseId =
    typeof stateObj?.houseId === "string" && stateObj.houseId.trim() ? stateObj.houseId.trim() : "";
  const runtimeHouseId =
    typeof state?.houseId === "string" && state.houseId.trim() ? state.houseId.trim() : "";
  const houseIdRaw =
    typeof contextObj?.houseId === "string" && contextObj.houseId.trim()
      ? contextObj.houseId.trim()
      : stateHouseId || runtimeHouseId || "";

  const origin = originRaw || null;
  const teamCode = teamCodeRaw || null;
  const houseId = houseIdRaw || null;
  if (!origin && !teamCode && !houseId) return null;
  return { origin, teamCode, houseId };
}

async function resolveRuntimeSnapshotFromInput({ runtimeContext = null, runtimeState = null } = {}) {
  const runtimeStateInput =
    runtimeState && typeof runtimeState === "object" && !Array.isArray(runtimeState) ? runtimeState : null;
  const hasRuntimeContextInput =
    runtimeContext && typeof runtimeContext === "object" && !Array.isArray(runtimeContext);
  const runtimeContextInput = (hasRuntimeContextInput || runtimeStateInput)
    ? normalizeRuntimeContextInput(runtimeContext, runtimeStateInput)
    : null;

  if (runtimeStateInput && runtimeContextInput) {
    return { context: runtimeContextInput, appState: runtimeStateInput };
  }

  const resolved = await resolveRuntimeSessionSnapshot();
  return {
    context: runtimeContextInput || resolved?.context || null,
    appState: runtimeStateInput || resolved?.appState || null,
  };
}

async function preflightChatSkillImports(userText) {
  const urls = extractSkillVisitUrlsFromText(userText);
  if (!urls.length) {
    return { urls: [], imported: [], failed: [] };
  }
  const imported = [];
  const failed = [];
  for (const url of urls) {
    const result = await runVisitImport({ url }, "visit_import");
    if (result?.ok === true) {
      imported.push({
        url,
        sourceUrl: typeof result?.data?.sourceUrl === "string" ? result.data.sourceUrl : null,
        activeSkillPath: typeof result?.data?.activeSkillPath === "string" ? result.data.activeSkillPath : null,
      });
      continue;
    }
    failed.push({
      url,
      code: result?.error?.code || "VISIT_FAILED",
      message: result?.error?.message || "Skill import failed",
    });
  }
  return { urls, imported, failed };
}

async function runAgentTurn(userText, opts = {}) {
  const displayUserText = typeof opts?.displayUserText === "string" ? opts.displayUserText : String(userText || "");
  const extraContext = typeof opts?.extraContext === "string" ? opts.extraContext.trim() : "";
  const persistToTranscript = opts?.persistToTranscript !== false;
  const emitChat = opts?.emitChat !== false;
  const promptText = extraContext ? `${String(userText || "")}\n\n${extraContext}` : String(userText || "");
  const prompt = {
    role: "user",
    content: promptText,
    timestamp: nowMs(),
  };
  const generatedMessages = [];

  const model = getConfiguredModel();
  const apiKey = state.llmApiKey || "";
  if (!apiKey) {
    const m = makeAssistant(LLM_NOT_CONFIGURED_MESSAGE, { stopReason: "error" });
    generatedMessages.push(prompt, m);
    if (persistToTranscript) {
      state.transcript.push(prompt);
      state.transcript.push(m);
    }
    if (emitChat) {
      post({ type: "worker.chat.append", role: "user", text: displayUserText });
      post({ type: "worker.chat.append", role: "assistant", text: LLM_NOT_CONFIGURED_MESSAGE });
    }
    if (persistToTranscript) {
      await persistTranscript();
    }
    return { messages: generatedMessages, persisted: persistToTranscript };
  }

  const tools = getLiteTools();
  const promptPreview = await buildLitePromptPreview({ model, tools });
  if (promptPreview.usedFiles.length) {
    log(
      `workspace prompt loaded files=${promptPreview.usedFiles.join(",")} truncated=${promptPreview.truncatedFiles.length > 0 ? "1" : "0"}`,
    );
  } else {
    log("workspace prompt loaded no files");
  }
  const systemPrompt = promptPreview.systemPrompt;

  const context = {
    systemPrompt,
    messages: state.transcript.slice(),
    tools,
  };

  const config = {
    model,
    apiKey,
    reasoning: state.llmReasoning || undefined,
    convertToLlm: (messages) => messages.filter((m) => m && (m.role === "user" || m.role === "assistant" || m.role === "toolResult")),
  };

  const abortController = new AbortController();
  const stream = agentLoop([prompt], context, config, abortController.signal);

  for await (const event of stream) {
    if (event.type === "message_end") {
      const m = event.message;
      if (!m || typeof m !== "object" || typeof m.role !== "string") continue;
      generatedMessages.push(m);
      if (persistToTranscript) {
        state.transcript.push(m);
      }
      if (emitChat && m.role === "user") post({ type: "worker.chat.append", role: "user", text: displayUserText });
      if (emitChat && m.role === "assistant") {
        const t = textFromMessageContent(m.content);
        post({ type: "worker.chat.append", role: "assistant", text: t });
      }
      if (persistToTranscript) {
        await persistTranscript({ repair: false });
      }
    }
  }
  if (persistToTranscript) {
    await persistTranscript({ repair: true });
  }
  return { messages: generatedMessages, persisted: persistToTranscript };
}

// --- Approvals ---
const approvals = new Map();

function requestApproval({ title, body }) {
  const id = randomId("ap");
  post({ type: "worker.approval.request", approval: { id, title, body } });
  return new Promise((resolve) => {
    approvals.set(id, resolve);
  });
}

function resolveApproval(id, decision) {
  const fn = approvals.get(id);
  if (!fn) return;
  approvals.delete(id);
  post({ type: "worker.approval.clear", id });
  fn(decision === "approve" ? "approve" : "reject");
}

// --- Wallet bridge ---
const walletRequests = new Map();

function walletRequest(method, payload) {
  const id = randomId("w");
  post({ type: "worker.wallet.request", id, method, ...(payload || {}) });
  return new Promise((resolve, reject) => {
    walletRequests.set(id, { resolve, reject });
  });
}

function resolveWalletResponse(msg) {
  const id = String(msg.id || "");
  const rec = walletRequests.get(id);
  if (!rec) return;
  walletRequests.delete(id);
  if (msg.ok) rec.resolve(msg);
  else rec.reject(new Error(msg.error || "WALLET_ERROR"));
}

// --- UI intent bridge ---
const uiIntentRequests = new Map();
const UI_INTENT_REQUEST_TIMEOUT_MS = 12_000;

function normalizeUiIntentResult(value) {
  const payload = isPlainObject(value) ? value : {};
  const errorRaw = isPlainObject(payload.error) ? payload.error : null;
  return {
    ok: payload.ok === true,
    applied: payload.applied === true,
    stateSnapshot: isPlainObject(payload.stateSnapshot) ? payload.stateSnapshot : null,
    error: errorRaw
      ? {
        code: String(errorRaw.code || "UI_INTENT_INTERNAL"),
        message: String(errorRaw.message || errorRaw.code || "UI intent failed"),
      }
      : null,
  };
}

function requestUiIntent(intent, params = {}) {
  const id = randomId("ui");
  post({
    type: "worker.ui.intent.request",
    id,
    intent: String(intent || ""),
    params: isPlainObject(params) ? params : {},
  });
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      uiIntentRequests.delete(id);
      resolve({
        ok: false,
        applied: false,
        stateSnapshot: null,
        error: {
          code: "UI_INTENT_UNAVAILABLE",
          message: "UI intent response timeout",
        },
      });
    }, UI_INTENT_REQUEST_TIMEOUT_MS);
    uiIntentRequests.set(id, { resolve, timeoutId });
  });
}

function resolveUiIntentResponse(msg) {
  const id = String(msg.id || "");
  if (!id) return;
  const rec = uiIntentRequests.get(id);
  if (!rec) return;
  uiIntentRequests.delete(id);
  clearTimeout(rec.timeoutId);
  rec.resolve(normalizeUiIntentResult(msg.result));
}

async function walletConnect() {
  const res = await walletRequest("connect", { chain: "solana" });
  const addr = typeof res.address === "string" ? res.address.trim() : "";
  if (!addr) throw new Error("WALLET_NOT_CONNECTED");
  return addr;
}

async function walletConnectEvm() {
  const res = await walletRequest("connect", { chain: "evm" });
  const addr = typeof res.address === "string" ? res.address.trim() : "";
  if (!addr) throw new Error("WALLET_NOT_CONNECTED");
  return addr;
}

async function walletSignMessage(message) {
  const res = await walletRequest("signMessage", { message, chain: "solana" });
  const sig = typeof res.signatureB64 === "string" ? res.signatureB64.trim() : "";
  if (!sig) throw new Error("MISSING_SIGNATURE");
  return { address: typeof res.address === "string" ? res.address.trim() : "", signatureBytes: b64ToBytes(sig) };
}

async function walletSignMessageEvm(message) {
  const res = await walletRequest("signMessage", { message, chain: "evm" });
  const sig = typeof res.signatureHex === "string" ? res.signatureHex.trim() : "";
  if (!sig) throw new Error("MISSING_SIGNATURE");
  return { address: typeof res.address === "string" ? res.address.trim() : "", signatureHex: sig };
}

async function walletSendTransactionEvm(transaction) {
  const res = await walletRequest("sendTransaction", { chain: "evm", transaction });
  const txHash = typeof res.txHash === "string" ? res.txHash.trim() : "";
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) throw new Error("MISSING_TX_HASH");
  return { txHash };
}

function parseNonNegativeInteger(value) {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) return value;
  if (typeof value === "string") {
    const raw = value.trim();
    if (!raw) return null;
    if (/^0x[0-9a-fA-F]+$/.test(raw)) {
      const parsed = Number.parseInt(raw.slice(2), 16);
      return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
    }
    if (/^\d+$/.test(raw)) {
      const parsed = Number.parseInt(raw, 10);
      return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
    }
  }
  return null;
}

function parseWeiBigInt(value) {
  if (typeof value === "bigint") return value >= 0n ? value : null;
  if (typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) && value >= 0) {
    return BigInt(value);
  }
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;
  try {
    if (/^0x[0-9a-fA-F]+$/.test(raw)) return BigInt(raw);
    if (/^\d+$/.test(raw)) return BigInt(raw);
  } catch {
    return null;
  }
  return null;
}

function normalizeHexQuantityFromBigInt(value) {
  if (typeof value !== "bigint" || value < 0n) return null;
  return `0x${value.toString(16)}`;
}

function normalizeEvmAddressStrict(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!/^0x[a-fA-F0-9]{40}$/.test(raw)) return null;
  return raw.toLowerCase();
}

function evaluateWalletTxPermissionConstraints({ chainId = null, to = null, valueWei = null } = {}) {
  const permissionId = "wallet.eip1193.tx";
  const constraints = permissionPolicyConstraints(permissionId);
  const allowedChainIds = Array.isArray(constraints.chainIds)
    ? constraints.chainIds.map((entry) => Number(entry)).filter((entry) => Number.isInteger(entry) && entry > 0)
    : [];
  if (allowedChainIds.length && (!Number.isInteger(chainId) || !allowedChainIds.includes(chainId))) {
    return {
      allowed: false,
      envelope: permissionDeniedEnvelope({
        details: {
          reason: "constraint_violation",
          permissionId,
          constraint_violation: "chain_not_allowed",
          chainId,
          allowedChainIds,
        },
      }),
    };
  }

  const requiredTo = normalizeEvmAddressStrict(constraints.to);
  const txTo = normalizeEvmAddressStrict(to);
  if (requiredTo && txTo && txTo !== requiredTo) {
    return {
      allowed: false,
      envelope: permissionDeniedEnvelope({
        details: {
          reason: "constraint_violation",
          permissionId,
          constraint_violation: "to_not_allowed",
          to: txTo,
          requiredTo,
        },
      }),
    };
  }
  if (requiredTo && !txTo) {
    return {
      allowed: false,
      envelope: permissionDeniedEnvelope({
        details: {
          reason: "constraint_violation",
          permissionId,
          constraint_violation: "to_missing",
          requiredTo,
        },
      }),
    };
  }

  const maxValueWei = parseWeiBigInt(constraints.maxValueWei);
  if (typeof maxValueWei === "bigint" && typeof valueWei === "bigint" && valueWei > maxValueWei) {
    return {
      allowed: false,
      envelope: permissionDeniedEnvelope({
        details: {
          reason: "constraint_violation",
          permissionId,
          constraint_violation: "value_exceeds_max",
          valueWei: valueWei.toString(),
          maxValueWei: maxValueWei.toString(),
        },
      }),
    };
  }

  return { allowed: true };
}

function normalizeWalletChain(chain) {
  const c = String(chain || "solana").trim().toLowerCase();
  return c || "solana";
}

async function runWalletConnectTool(params, toolName = "wallet_connect") {
  const startedAtMs = nowMs();
  const chain = normalizeWalletChain(params?.chain);
  try {
    const address = chain === "evm" ? await walletConnectEvm() : await walletConnect();
    return withToolMeta(toolName, startedAtMs, makeToolSuccess({ chain, address }));
  } catch (e) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("UNSUPPORTED", e?.message || "WALLET_CONNECT_FAILED"));
  }
}

async function runWalletGetAccountsTool(params, toolName = "wallet_get_accounts") {
  const startedAtMs = nowMs();
  const chain = normalizeWalletChain(params?.chain);
  try {
    const address = chain === "evm" ? await walletConnectEvm() : await walletConnect();
    return withToolMeta(toolName, startedAtMs, makeToolSuccess({ chain, accounts: [address] }));
  } catch (e) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("UNSUPPORTED", e?.message || "WALLET_CONNECT_FAILED"));
  }
}

async function runWalletSignMessageTool(params, toolName = "wallet_sign_message") {
  const startedAtMs = nowMs();
  const policyDeny = denyIfMissingPermission("wallet.eip1193.sign");
  if (policyDeny) {
    return withToolMeta(toolName, startedAtMs, policyDeny);
  }
  const chain = normalizeWalletChain(params?.chain);
  const message = typeof params?.message === "string" ? params.message : "";
  if (!message) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Missing wallet sign message"));
  }

  const preview = message.length > 160 ? `${message.slice(0, 160)}...` : message;
  const decision = await requestApproval({
    title: "Approval",
    body: `Wallet sign message (${chain}): ${preview}`,
  });
  if (decision !== "approve") {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("APPROVAL_REJECTED", "Wallet signing rejected"));
  }

  try {
    if (chain === "evm") {
      const signed = await walletSignMessageEvm(message);
      return withToolMeta(
        toolName,
        startedAtMs,
        makeToolSuccess({
          chain,
          address: signed.address,
          signatureHex: signed.signatureHex,
        }),
      );
    }
    const signed = await walletSignMessage(message);
    return withToolMeta(
      toolName,
      startedAtMs,
      makeToolSuccess({
        chain,
        address: signed.address,
        signatureB64: bytesToB64(signed.signatureBytes),
        signatureByteLength: signed.signatureBytes.length,
      }),
    );
  } catch (e) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("UNSUPPORTED", e?.message || "WALLET_SIGN_FAILED"));
  }
}

async function runWalletSendTransactionTool(params, toolName = "wallet_send_transaction") {
  const startedAtMs = nowMs();
  const policyDeny = denyIfMissingPermission("wallet.eip1193.tx");
  if (policyDeny) {
    return withToolMeta(toolName, startedAtMs, policyDeny);
  }

  const chain = normalizeWalletChain(params?.chain || "evm");
  if (chain !== "evm") {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("UNSUPPORTED", "wallet_send_transaction currently supports evm only"));
  }

  const input = isPlainObject(params?.transaction)
    ? params.transaction
    : (isPlainObject(params) ? params : {});

  const to = normalizeEvmAddressStrict(input.to || "");
  const from = normalizeEvmAddressStrict(input.from || "");
  const data = typeof input.data === "string" ? input.data.trim() : "";
  const chainId = parseNonNegativeInteger(input.chainId);
  const valueWei = parseWeiBigInt(input.valueWei != null ? input.valueWei : input.value);
  if (!to) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Missing or invalid transaction to address"));
  }
  if (!data && valueWei === null) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Missing transaction value/data payload"));
  }

  if (shouldEnforcePermissionPolicy()) {
    const constraints = evaluateWalletTxPermissionConstraints({ chainId, to, valueWei });
    if (!constraints.allowed) {
      return withToolMeta(toolName, startedAtMs, constraints.envelope);
    }
  }

  const valueHex = valueWei == null ? null : normalizeHexQuantityFromBigInt(valueWei);
  if (valueWei != null && !valueHex) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Invalid transaction value"));
  }
  const chainIdHex = chainId == null ? null : `0x${chainId.toString(16)}`;

  const txPayload = {
    to,
    ...(from ? { from } : {}),
    ...(data ? { data } : {}),
    ...(valueHex ? { value: valueHex } : {}),
    ...(chainIdHex ? { chainId: chainIdHex } : {}),
  };

  const decision = await requestApproval({
    title: "Approval",
    body: `Wallet transaction (evm): to=${to} value=${valueWei == null ? "0" : valueWei.toString()} chainId=${chainId == null ? "unknown" : chainId}`,
  });
  if (decision !== "approve") {
    return withToolMeta(
      toolName,
      startedAtMs,
      permissionDeniedEnvelope({
        details: permissionDeniedReasonDetails("approval_required", {
          permissionId: "wallet.eip1193.tx",
          to,
          chainId,
        }),
      }),
    );
  }

  try {
    const sent = await walletSendTransactionEvm(txPayload);
    return withToolMeta(toolName, startedAtMs, makeToolSuccess({ chain: "evm", txHash: sent.txHash }));
  } catch (e) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("UNSUPPORTED", e?.message || "WALLET_TX_FAILED"));
  }
}

// --- Checkpoints ---
async function writeCheckpoint(reason) {
  const houseId = state.houseId || null;
  const checkpoint = {
    v: 1,
    checkpointId: randomId("cp"),
    createdAtMs: nowMs(),
    houseId,
    reason,
    state: {
      runtime: { houseId: state.houseId || null, sessionId: state.sessionId || null },
      vaultPointer: { latestBackupId: state.vaultLatestBackupId || null },
    },
  };

  await putRecord("checkpoints", checkpoint);

  if (!houseId) return;
  const all = await getAllFromIndex(
    "checkpoints",
    "by_house_createdAtMs",
    IDBKeyRange.bound([houseId, 0], [houseId, 9e15]),
    "asc",
  );
  if (all.length <= MAX_CHECKPOINTS_PER_HOUSE) return;
  const toDelete = all
    .slice(0, all.length - MAX_CHECKPOINTS_PER_HOUSE)
    .map((x) => x.checkpointId)
    .filter(Boolean);
  await deleteByKeys("checkpoints", toDelete);
}

// --- OpenClaw VFS persistence ---
function workspaceCoreFiles() {
  return [
    ["workspace/AGENTS.md", "# Agents\n\nOpenClaw Lite exports OpenClaw-compatible artifacts.\n"],
    ["workspace/SOUL.md", "# Soul\n\nThis is a minimal OpenClaw Lite soul.\n"],
    ["workspace/SKILL.md", "# SKILL\n\nVisit an experience to import its skill package.\n"],
    ["workspace/USER.md", "# User\n\nUser profile is stored locally.\n"],
    ["workspace/IDENTITY.md", `# Identity\n\nhouseId: ${state.houseId || "unknown"}\n`],
    ["workspace/TOOLS.md", "# Tools\n\nBrowser runtime. Networking is allowlisted.\n"],
  ];
}

function normalizeWorkspacePath(rawPath, { allowDirectory = false } = {}) {
  const raw = String(rawPath || "").trim().replace(/\\/g, "/");
  if (!raw) throw new Error("INVALID_ARGUMENTS");
  if (raw.includes("\u0000")) throw new Error("INVALID_ARGUMENTS");
  const isDirInput = raw.endsWith("/");
  if (raw.startsWith("/")) throw new Error("INVALID_ARGUMENTS");

  const parts = raw.split("/").filter((p) => p.length > 0);
  if (parts.length === 0) throw new Error("INVALID_ARGUMENTS");
  if (parts.some((p) => p === "." || p === "..")) throw new Error("INVALID_ARGUMENTS");

  const canonical = parts.join("/");
  if (!(canonical === "workspace" || canonical.startsWith("workspace/"))) {
    throw new Error("INVALID_ARGUMENTS");
  }

  if (allowDirectory || isDirInput || canonical === "workspace") {
    return canonical === "workspace" ? "workspace/" : `${canonical}/`;
  }
  return canonical;
}

function workspaceParentDir(filePath) {
  const parts = String(filePath || "").split("/");
  if (parts.length <= 1) return null;
  parts.pop();
  if (!parts.length) return null;
  return `${parts.join("/")}/`;
}

async function persistWorkspaceDirs() {
  await metaSet("workspaceDirsV1", Array.from(state.workspaceDirs || []).sort());
}

function ensureWorkspaceDirAncestors(pathLike) {
  const normalized = String(pathLike || "");
  if (!normalized.startsWith("workspace/")) return;
  const parts = normalized.endsWith("/") ? normalized.slice(0, -1).split("/") : normalized.split("/");
  let acc = "";
  for (let i = 0; i < parts.length - 1; i += 1) {
    acc = acc ? `${acc}/${parts[i]}` : parts[i];
    state.workspaceDirs.add(`${acc}/`);
  }
}

function pushWorkspaceEvent({ actor, action, path }) {
  const event = {
    id: randomId("we"),
    actor: String(actor || "system"),
    action: String(action || "update"),
    path: String(path || ""),
    timestamp: new Date().toISOString(),
    timestampMs: nowMs(),
  };
  state.workspaceEvents.unshift(event);
  if (state.workspaceEvents.length > 500) {
    state.workspaceEvents.length = 500;
  }
  post({ type: "worker.workspace.events", events: state.workspaceEvents.slice(0, 100) });
}

async function ensureWorkspaceFiles({ recordEvents = true } = {}) {
  const createdPaths = [];
  for (const [p, content] of workspaceCoreFiles()) {
    const existing = await vfsGetUtf8(p);
    if (existing !== null) continue;
    await vfsPutUtf8(p, content);
    ensureWorkspaceDirAncestors(p);
    createdPaths.push(p);
    if (recordEvents) {
      pushWorkspaceEvent({ actor: "system", action: "bootstrap", path: p });
    }
  }
  if (!state.workspaceDirs.has("workspace/")) state.workspaceDirs.add("workspace/");
  await persistWorkspaceDirs();
  return createdPaths;
}

function resolveSessionTranscriptPath(sessionId) {
  return `.openclaw/agents/${MAIN_AGENT_ID}/sessions/${sessionId}.jsonl`;
}

function resolveTranscriptArchivePath(sourcePath, reason = "new-session", timestampMs = nowMs()) {
  const ts = new Date(timestampMs).toISOString().replaceAll(":", "-");
  return `${sourcePath}.${reason}.${ts}`;
}

async function readTranscriptDigestQueue() {
  const raw = await metaGet(TRANSCRIPT_DIGEST_QUEUE_META_KEY);
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const id = typeof item.id === "string" ? item.id : "";
    const sessionId = typeof item.sessionId === "string" ? item.sessionId : "";
    const archivedPath = typeof item.archivedPath === "string" ? item.archivedPath : "";
    if (!id || !sessionId || !archivedPath) continue;
    out.push({
      id,
      sessionId,
      sourcePath: typeof item.sourcePath === "string" ? item.sourcePath : null,
      archivedPath,
      reason: typeof item.reason === "string" ? item.reason : "new-session",
      status: typeof item.status === "string" ? item.status : "pending",
      queuedAtMs: Number.isFinite(Number(item.queuedAtMs)) ? Number(item.queuedAtMs) : nowMs(),
    });
    if (out.length >= TRANSCRIPT_DIGEST_QUEUE_MAX) break;
  }
  return out;
}

async function writeTranscriptDigestQueue(queue) {
  const rows = Array.isArray(queue) ? queue.slice(0, TRANSCRIPT_DIGEST_QUEUE_MAX) : [];
  await metaSet(TRANSCRIPT_DIGEST_QUEUE_META_KEY, rows);
  return rows;
}

async function archiveSessionTranscriptForDigest(sessionId, reason = "new-session") {
  const id = typeof sessionId === "string" ? sessionId.trim() : "";
  if (!id) {
    return { ok: false, reason: "missing-session-id", sourcePath: null, archivedPath: null, queueLength: null };
  }

  const sourcePath = resolveSessionTranscriptPath(id);
  const content = await vfsGetUtf8(sourcePath);
  if (content === null) {
    return { ok: false, reason: "not-found", sourcePath, archivedPath: null, queueLength: null };
  }

  // Ignore empty placeholder transcripts.
  if (!String(content || "").trim()) {
    await deleteByKeys("vfs", [sourcePath]);
    return { ok: false, reason: "empty", sourcePath, archivedPath: null, queueLength: null };
  }

  const archivedPath = resolveTranscriptArchivePath(sourcePath, reason, nowMs());
  await vfsPutUtf8(archivedPath, content);
  await deleteByKeys("vfs", [sourcePath]);

  const queue = await readTranscriptDigestQueue();
  const queueEntry = {
    id: randomId("tdq"),
    sessionId: id,
    sourcePath,
    archivedPath,
    reason,
    status: "pending",
    queuedAtMs: nowMs(),
  };
  queue.unshift(queueEntry);
  const savedQueue = await writeTranscriptDigestQueue(queue);

  return {
    ok: true,
    reason,
    sourcePath,
    archivedPath,
    queueEntry,
    queueLength: savedQueue.length,
  };
}

async function ensureSessionFiles() {
  if (!state.sessionId) {
    state.sessionId = randomId("sess");
    await metaSet("sessionId", state.sessionId);
  }
  const sessionsPath = `.openclaw/agents/${MAIN_AGENT_ID}/sessions/sessions.json`;
  const existing = await vfsGetUtf8(sessionsPath);
  let store = {};
  if (existing) {
    try {
      store = JSON.parse(existing);
    } catch {
      store = {};
    }
  }
  store[MAIN_SESSION_KEY] = { sessionId: state.sessionId, updatedAt: nowMs() };
  await vfsPutUtf8(sessionsPath, JSON.stringify(store, null, 2));

  const transcriptPath = resolveSessionTranscriptPath(state.sessionId);
  const tExisting = await vfsGetUtf8(transcriptPath);
  if (tExisting === null) {
    await vfsPutUtf8(transcriptPath, "");
  }
}

async function persistTranscript(options = {}) {
  const shouldRepair = options && options.repair === false ? false : true;
  await ensureSessionFiles();
  const sessionsPath = `.openclaw/agents/${MAIN_AGENT_ID}/sessions/sessions.json`;
  const transcriptPath = resolveSessionTranscriptPath(state.sessionId);

  let transcriptToWrite = state.transcript;
  if (shouldRepair) {
    // Repair only on finalized persistence boundaries, not per-message mid-turn.
    const repairedInputs = repairToolCallInputs(state.transcript);
    const repairedTools = repairToolUseResultPairing(repairedInputs.messages);
    transcriptToWrite = repairedTools.messages;
    state.transcript = transcriptToWrite;
  }

  const jsonl = transcriptToWrite.map((m) => JSON.stringify(m)).join("\n") + "\n";
  await vfsPutUtf8(transcriptPath, jsonl);

  let store = {};
  try {
    store = JSON.parse((await vfsGetUtf8(sessionsPath)) || "{}");
  } catch {
    store = {};
  }
  store[MAIN_SESSION_KEY] = { sessionId: state.sessionId, updatedAt: nowMs() };
  await vfsPutUtf8(sessionsPath, JSON.stringify(store, null, 2));
}

async function runWorkspaceMkdir(params, toolName = "workspace_mkdir", options = {}) {
  const startedAtMs = nowMs();
  const policy = await evaluatePersistentStoragePolicyWrite(toolName, options);
  if (!policy.ok) {
    return withToolMeta(toolName, startedAtMs, policy.envelope);
  }
  let path;
  try {
    path = normalizeWorkspacePath(params?.path, { allowDirectory: true });
  } catch {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Invalid workspace directory path"));
  }
  const existed = state.workspaceDirs.has(path);
  ensureWorkspaceDirAncestors(path);
  state.workspaceDirs.add(path);
  await persistWorkspaceDirs();
  if (!existed) {
    pushWorkspaceEvent({ actor: "agent", action: "mkdir", path });
  }
  return withToolMeta(toolName, startedAtMs, makeToolSuccess({ path, created: !existed }));
}

async function runWorkspaceList(params, toolName = "workspace_list") {
  const startedAtMs = nowMs();
  let prefix;
  try {
    prefix = normalizeWorkspacePath(params?.path || "workspace/", { allowDirectory: true });
  } catch {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Invalid workspace list path"));
  }

  const files = await vfsListPaths(prefix);
  const dirs = Array.from(state.workspaceDirs || []).filter((d) => d.startsWith(prefix) && d !== prefix);
  const paths = Array.from(new Set([...files, ...dirs])).sort();
  return withToolMeta(toolName, startedAtMs, makeToolSuccess({ path: prefix, paths }));
}

async function runWorkspaceReadFile(params, toolName = "workspace_read_file") {
  const startedAtMs = nowMs();
  let path;
  try {
    path = normalizeWorkspacePath(params?.path, { allowDirectory: false });
  } catch {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Invalid workspace file path"));
  }
  const content = await vfsGetUtf8(path);
  if (content === null) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("NOT_FOUND", "Workspace file not found", { path }));
  }
  return withToolMeta(toolName, startedAtMs, makeToolSuccess({ path, content }));
}

async function evaluatePersistentStoragePolicyWrite(toolName, { skipPermissionPolicy = false } = {}) {
  if (skipPermissionPolicy) return { ok: true };
  const deny = denyIfMissingPermission("storage.local.persistent");
  if (deny) return { ok: false, envelope: deny };
  if (!shouldEnforcePermissionPolicy()) return { ok: true };
  const decision = await requestApproval({
    title: "Approval",
    body: `Persistent storage write: ${String(toolName || "workspace_write_file")}`,
  });
  if (decision !== "approve") {
    return {
      ok: false,
      envelope: permissionDeniedEnvelope({
        details: permissionDeniedReasonDetails("approval_required", {
          permissionId: "storage.local.persistent",
          tool: String(toolName || "workspace_write_file"),
        }),
      }),
    };
  }
  return { ok: true };
}

async function runWorkspaceWriteFile(params, toolName = "workspace_write_file", options = {}) {
  const startedAtMs = nowMs();
  const policy = await evaluatePersistentStoragePolicyWrite(toolName, options);
  if (!policy.ok) {
    return withToolMeta(toolName, startedAtMs, policy.envelope);
  }
  let path;
  try {
    path = normalizeWorkspacePath(params?.path, { allowDirectory: false });
  } catch {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Invalid workspace file path"));
  }
  const content = typeof params?.content === "string" ? params.content : String(params?.content ?? "");
  const existing = await vfsGetUtf8(path);
  await vfsPutUtf8(path, content);
  ensureWorkspaceDirAncestors(path);
  const parent = workspaceParentDir(path);
  if (parent) state.workspaceDirs.add(parent);
  await persistWorkspaceDirs();
  pushWorkspaceEvent({ actor: "agent", action: existing === null ? "create" : "update", path });
  if (trainerIsLoadoutSensitiveWorkspacePath(path)) {
    trainerCheckpointForConfigChange("workspace-write").catch(() => {});
  }
  return withToolMeta(
    toolName,
    startedAtMs,
    makeToolSuccess({
      path,
      bytes: utf8ToBytes(content).length,
      updated: existing !== null,
    }),
  );
}

async function runWorkspaceEditFile(params, toolName = "workspace_edit_file", options = {}) {
  const startedAtMs = nowMs();
  const policy = await evaluatePersistentStoragePolicyWrite(toolName, options);
  if (!policy.ok) {
    return withToolMeta(toolName, startedAtMs, policy.envelope);
  }
  let path;
  try {
    path = normalizeWorkspacePath(params?.path, { allowDirectory: false });
  } catch {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Invalid workspace file path"));
  }
  const find = typeof params?.find === "string" ? params.find : "";
  const replace = typeof params?.replace === "string" ? params.replace : String(params?.replace ?? "");
  const all = params?.all !== false;
  if (!find) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Missing edit find string"));
  }
  const existing = await vfsGetUtf8(path);
  if (existing === null) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("NOT_FOUND", "Workspace file not found", { path }));
  }

  let replacements = 0;
  let next = existing;
  if (all) {
    const split = existing.split(find);
    replacements = Math.max(0, split.length - 1);
    if (replacements > 0) next = split.join(replace);
  } else {
    const idx = existing.indexOf(find);
    if (idx >= 0) {
      replacements = 1;
      next = `${existing.slice(0, idx)}${replace}${existing.slice(idx + find.length)}`;
    }
  }

  if (replacements > 0) {
    await vfsPutUtf8(path, next);
    pushWorkspaceEvent({ actor: "agent", action: "update", path });
    if (trainerIsLoadoutSensitiveWorkspacePath(path)) {
      trainerCheckpointForConfigChange("workspace-edit").catch(() => {});
    }
  }
  return withToolMeta(toolName, startedAtMs, makeToolSuccess({ path, replacements }));
}

async function runWorkspaceDelete(params, toolName = "workspace_delete", options = {}) {
  const startedAtMs = nowMs();
  const policy = await evaluatePersistentStoragePolicyWrite(toolName, options);
  if (!policy.ok) {
    return withToolMeta(toolName, startedAtMs, policy.envelope);
  }
  const raw = typeof params?.path === "string" ? params.path.trim() : "";
  if (!raw) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Missing workspace delete path"));
  }

  let dirPath = null;
  let filePath = null;
  try {
    dirPath = normalizeWorkspacePath(raw, { allowDirectory: true });
  } catch {
    dirPath = null;
  }
  try {
    filePath = normalizeWorkspacePath(raw, { allowDirectory: false });
  } catch {
    filePath = null;
  }

  const preferDirectory =
    raw.endsWith("/") ||
    (dirPath && state.workspaceDirs.has(dirPath) && (!filePath || `${filePath}/` === dirPath));

  if (preferDirectory && dirPath) {
    if (dirPath === "workspace/") {
      return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Cannot delete workspace root"));
    }
    const files = await vfsListPaths(dirPath);
    if (files.length > 0) {
      await deleteByKeys("vfs", files);
    }
    const removedDirs = [];
    for (const d of Array.from(state.workspaceDirs || [])) {
      if (d === dirPath || d.startsWith(dirPath)) {
        removedDirs.push(d);
        state.workspaceDirs.delete(d);
      }
    }
    if (!files.length && !removedDirs.length) {
      return withToolMeta(toolName, startedAtMs, makeToolFailure("NOT_FOUND", "Workspace path not found", { path: dirPath }));
    }
    await persistWorkspaceDirs();
    pushWorkspaceEvent({ actor: "agent", action: "delete", path: dirPath });
    if (files.some((path) => trainerIsLoadoutSensitiveWorkspacePath(path))) {
      trainerCheckpointForConfigChange("workspace-delete").catch(() => {});
    }
    return withToolMeta(
      toolName,
      startedAtMs,
      makeToolSuccess({ path: dirPath, deletedFiles: files.length, deletedDirs: removedDirs.length }),
    );
  }

  if (!filePath) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Invalid workspace delete path"));
  }

  const existing = await vfsGetUtf8(filePath);
  if (existing === null) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("NOT_FOUND", "Workspace file not found", { path: filePath }));
  }
  await deleteByKeys("vfs", [filePath]);
  pushWorkspaceEvent({ actor: "agent", action: "delete", path: filePath });
  if (trainerIsLoadoutSensitiveWorkspacePath(filePath)) {
    trainerCheckpointForConfigChange("workspace-delete").catch(() => {});
  }
  return withToolMeta(toolName, startedAtMs, makeToolSuccess({ path: filePath, deleted: true }));
}

async function runWorkspaceBootstrap(toolName = "workspace_bootstrap", options = {}) {
  const startedAtMs = nowMs();
  const policy = await evaluatePersistentStoragePolicyWrite(toolName, options);
  if (!policy.ok) {
    return withToolMeta(toolName, startedAtMs, policy.envelope);
  }
  const createdPaths = await ensureWorkspaceFiles({ recordEvents: true });
  return withToolMeta(toolName, startedAtMs, makeToolSuccess({ createdPaths }));
}

function runWorkspaceEvents(toolName = "workspace_events") {
  const startedAtMs = nowMs();
  return withToolMeta(toolName, startedAtMs, makeToolSuccess({ events: state.workspaceEvents.slice(0, 100) }));
}

function normalizeVisitInputUrl(rawValue) {
  const raw = String(rawValue || "").trim();
  if (!raw) throw new Error("INVALID_ARGUMENTS");

  if (raw === "test-local") {
    const origin = safeOrigin() || "http://localhost";
    return new URL("/skill.md", origin).toString();
  }

  const withScheme = /^[a-z][a-z0-9+\-.]*:\/\//i.test(raw) || raw.startsWith("/")
    ? raw
    : `https://${raw}`;
  const parsed = new URL(withScheme, safeOrigin() || "http://localhost");
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("INVALID_ARGUMENTS");
  }
  parsed.hash = "";
  return parsed.toString();
}

const CHAT_SKILL_URL_RE = /(?:https?:\/\/[^\s<>"'`]+|\/[^\s<>"'`]*skill\.md[^\s<>"'`]*)/gi;

function trimChatUrlToken(rawValue) {
  let text = String(rawValue || "").trim();
  while (text && /[),.;!?'"`>\]]$/.test(text)) {
    text = text.slice(0, -1);
  }
  return text;
}

function extractSkillVisitUrlsFromText(text) {
  const source = String(text || "");
  const out = [];
  const seen = new Set();
  const matches = source.match(CHAT_SKILL_URL_RE) || [];
  for (const candidateRaw of matches) {
    const candidate = trimChatUrlToken(candidateRaw);
    if (!candidate) continue;
    if (!/skill\.md/i.test(candidate)) continue;
    try {
      const normalized = normalizeVisitInputUrl(candidate);
      const parsed = new URL(normalized);
      if (!/\/skill\.md$/i.test(parsed.pathname || "")) continue;
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      out.push(normalized);
      if (out.length >= 3) break;
    } catch {
      continue;
    }
  }
  return out;
}

function buildVisitSkillCandidates(entryUrl) {
  const parsed = new URL(entryUrl);
  const pathname = String(parsed.pathname || "/");
  if (/\.md$/i.test(pathname)) {
    return [parsed.toString()];
  }

  const candidates = [];
  const seen = new Set();
  const push = (url) => {
    const normalized = String(url || "").trim();
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    candidates.push(normalized);
  };

  const dirPath = pathname.endsWith("/") ? pathname : `${pathname}/`;
  const scopedSkillPath = dirPath === "/" ? "/skill.md" : `${dirPath}skill.md`;
  const scopedSkillUpperPath = dirPath === "/" ? "/SKILL.md" : `${dirPath}SKILL.md`;
  push(new URL(scopedSkillPath, parsed.origin).toString());
  push(new URL(scopedSkillUpperPath, parsed.origin).toString());
  push(new URL("/skill.md", parsed.origin).toString());
  push(new URL("/SKILL.md", parsed.origin).toString());
  return candidates;
}

function normalizeCompanionCandidate(rawValue) {
  const text = String(rawValue || "").trim();
  if (!text) return "";
  if (text.startsWith("#")) return "";
  if (/^(javascript:|mailto:|tel:)/i.test(text)) return "";
  return text.replace(/^<|>$/g, "").trim();
}

function collectSkillCompanionUrls(skillText, baseSkillUrl) {
  const base = new URL(baseSkillUrl);
  const out = new Set([base.toString()]);
  const candidates = [];

  const markdownLinks = String(skillText || "").matchAll(/\[[^\]]*]\(([^)]+)\)/g);
  for (const match of markdownLinks) {
    if (match && match[1]) candidates.push(match[1]);
  }

  const bareReferences = String(skillText || "").matchAll(/(?:^|[\s`"'(])([A-Za-z0-9._/-]+\.(?:md|json))(?=$|[\s`"').,:;])/gi);
  for (const match of bareReferences) {
    if (match && match[1]) candidates.push(match[1]);
  }

  for (const rawCandidate of candidates) {
    if (out.size >= VISIT_MAX_COMPANION_FILES) break;
    const candidate = normalizeCompanionCandidate(rawCandidate);
    if (!candidate) continue;

    let resolved = null;
    try {
      resolved = new URL(candidate, base.toString());
    } catch {
      resolved = null;
    }
    if (!resolved) continue;
    if ((resolved.protocol !== "http:" && resolved.protocol !== "https:") || resolved.origin !== base.origin) continue;
    if (!VISIT_COMPANION_EXT_RE.test(resolved.pathname || "")) continue;
    resolved.hash = "";
    out.add(resolved.toString());
  }

  return Array.from(out).slice(0, VISIT_MAX_COMPANION_FILES);
}

function normalizeSkillWorkspaceHost(host) {
  const cleaned = String(host || "").trim().toLowerCase().replace(/[^a-z0-9._-]/g, "_");
  return cleaned || "unknown-host";
}

function normalizeSkillWorkspaceRelativePath(skillUrl) {
  const parsed = new URL(skillUrl);
  let pathname = String(parsed.pathname || "/").replace(/\\/g, "/");
  if (!pathname || pathname === "/") pathname = "/skill.md";
  if (pathname.endsWith("/")) pathname = `${pathname}skill.md`;
  return pathname.replace(/^\/+/, "");
}

function buildSkillWorkspaceImportPath(skillUrl) {
  const parsed = new URL(skillUrl);
  const host = normalizeSkillWorkspaceHost(parsed.host);
  const relativePath = normalizeSkillWorkspaceRelativePath(skillUrl);
  return `workspace/skills/${host}/${relativePath}`;
}

function buildSkillWorkspaceSiteRoot(skillUrl) {
  const parsed = new URL(skillUrl);
  const host = normalizeSkillWorkspaceHost(parsed.host);
  return `workspace/skills/${host}/`;
}

function uppercaseMdCompatibilityName(baseName) {
  const lower = String(baseName || "").toLowerCase();
  if (!lower.endsWith(".md")) return null;
  const stem = lower.slice(0, -3);
  return `${stem.toUpperCase()}.md`;
}

async function resolveExperienceWorkspaceFiles(params = {}) {
  const normalizeSiteRoot = (value) => {
    const raw = String(value || "").trim();
    if (!raw.startsWith("workspace/skills/")) return "";
    return raw.endsWith("/") ? raw : `${raw}/`;
  };
  const hintSiteRoot = normalizeSiteRoot(params?.siteRoot);
  const activeSiteRoot = normalizeSiteRoot(state.skillImport.siteRoot);
  const siteRoot = hintSiteRoot || activeSiteRoot;
  const hasSiteRoot = siteRoot.startsWith("workspace/skills/");
  const sitePath = (fileName) => (hasSiteRoot ? `${siteRoot}${fileName}` : "");

  const dedupePaths = (paths) => {
    const out = [];
    const seen = new Set();
    for (const path of paths) {
      const next = String(path || "").trim();
      if (!next || seen.has(next)) continue;
      seen.add(next);
      out.push(next);
    }
    return out;
  };

  const candidates = {
    skill: {
      required: true,
      paths: dedupePaths([sitePath("SKILL.md"), sitePath("skill.md"), "workspace/SKILL.md", "workspace/skill.md"]),
    },
    heartbeat: {
      required: false,
      paths: dedupePaths([
        sitePath("HEARTBEAT.md"),
        sitePath("heartbeat.md"),
        "workspace/HEARTBEAT.md",
        "workspace/heartbeat.md",
      ]),
    },
    goals: {
      required: false,
      paths: dedupePaths([sitePath("GOALS.md"), sitePath("goals.md"), "workspace/GOALS.md", "workspace/goals.md"]),
    },
    tools: {
      required: false,
      paths: dedupePaths([sitePath("TOOLS.md"), sitePath("tools.md"), "workspace/TOOLS.md", "workspace/tools.md"]),
    },
    penalty: {
      required: false,
      paths: dedupePaths([
        sitePath("PENALTY.md"),
        sitePath("penalty.md"),
        "workspace/PENALTY.md",
        "workspace/penalty.md",
      ]),
    },
  };

  const files = {};
  const resolvedPaths = {};
  const missingRequiredPaths = [];
  const missingOptionalPaths = [];
  for (const [key, descriptor] of Object.entries(candidates)) {
    const paths = Array.isArray(descriptor?.paths) ? descriptor.paths : [];
    let foundPath = null;
    let foundContent = null;
    for (const path of paths) {
      const content = await vfsGetUtf8(path);
      if (content === null) continue;
      foundPath = path;
      foundContent = content;
      break;
    }
    if (!foundPath) {
      const preferredPath = paths[0];
      if (descriptor?.required === true) {
        if (preferredPath) missingRequiredPaths.push(preferredPath);
      } else if (preferredPath) {
        missingOptionalPaths.push(preferredPath);
      }
      continue;
    }
    files[key] = foundContent;
    resolvedPaths[key] = foundPath;
  }

  return { files, resolvedPaths, missingRequiredPaths, missingOptionalPaths, siteRoot: hasSiteRoot ? siteRoot : null };
}

async function runVisitImport(params, toolName = "visit_import") {
  const startedAtMs = nowMs();
  const rawUrl = typeof params === "string" ? params : params?.url;
  let entryUrl;
  try {
    entryUrl = normalizeVisitInputUrl(rawUrl);
  } catch {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Invalid visit url"));
  }

  await clearPermissionPolicyToLegacy(null);

  let resolvedEntryUrl = entryUrl;
  let registrationInfo = null;
  try {
    const registrationFetch = await runWebFetch(
      { url: entryUrl, maxBytes: MAX_WEB_FETCH_MAX_BYTES, expectedMime: "any", followRedirects: true },
      "skill_fetch",
    );
    const registration = parseRegistrationJsonFromFetchEnvelope(registrationFetch);
    if (registration) {
      const registrationUrl = String(registrationFetch?.data?.finalUrl || registrationFetch?.data?.url || entryUrl);
      const webEndpoint = pickRegistrationWebServiceEndpoint(registration, registrationUrl);
      if (!webEndpoint) {
        await clearPermissionPolicyToLegacy("REGISTRATION_WEB_ENDPOINT_MISSING");
        return withToolMeta(
          toolName,
          startedAtMs,
          makeToolFailure("INVALID_REGISTRATION", "Registration missing web service endpoint", {
            registrationUrl,
          }),
        );
      }
      resolvedEntryUrl = normalizeVisitInputUrl(webEndpoint);

      let manifestRaw = null;
      let manifestUrl = registrationUrl;
      const manifestRef = normalizePermissionManifestRef(registration.permissionManifest);
      const manifestDeclared = !!manifestRef || isPlainObject(registration.permissionManifest);
      const permissionPolicySource = {
        kind: "erc8004-registration",
        entryUrl,
        registrationUrl,
        manifestUrl,
        loadedAtMs: nowMs(),
      };
      if (manifestRef?.uri) {
        let resolvedManifestUrl;
        try {
          resolvedManifestUrl = new URL(manifestRef.uri, registrationUrl).toString();
        } catch {
          resolvedManifestUrl = "";
        }
        if (resolvedManifestUrl) {
          const manifestFetch = await runWebFetch(
            { url: resolvedManifestUrl, maxBytes: MAX_WEB_FETCH_MAX_BYTES, expectedMime: "any", followRedirects: true },
            "skill_fetch",
          );
          manifestRaw = parseJsonObject(manifestFetch?.data?.text || "");
          manifestUrl = String(manifestFetch?.data?.finalUrl || manifestFetch?.data?.url || resolvedManifestUrl);
          permissionPolicySource.manifestUrl = manifestUrl;
        }
      } else if (isPlainObject(registration.permissionManifest)) {
        manifestRaw = registration.permissionManifest;
      }

      if (manifestDeclared && manifestRaw && isPlainObject(manifestRaw)) {
        const applied = await applyManifestPermissionPolicy({
          manifest: manifestRaw,
          source: permissionPolicySource,
        });
        if (!applied.ok) {
          log(`permission manifest parse failed code=${String(applied.error || "INVALID_PERMISSION_MANIFEST")}`);
        }
      } else if (manifestDeclared) {
        const applied = await applyManifestPermissionPolicy({
          manifest: null,
          source: permissionPolicySource,
        });
        if (!applied.ok) {
          log(`permission manifest unavailable code=${String(applied.error || "INVALID_PERMISSION_MANIFEST")}`);
        }
      } else {
        await clearPermissionPolicyToLegacy(null);
      }

      registrationInfo = {
        registrationUrl,
        webEndpoint: resolvedEntryUrl,
        hasPermissionManifest: manifestDeclared,
      };
    }
  } catch (e) {
    log(`registration probe skipped: ${String(e?.message || e || "UNKNOWN")}`);
  }

  state.skillImport.status = "loading";
  state.skillImport.sourceUrl = resolvedEntryUrl;
  state.skillImport.lastError = null;
  await persistSkillImportState();
  updateGatewayState();

  const skillCandidates = buildVisitSkillCandidates(resolvedEntryUrl);
  const attempted = [];
  let primary = null;
  for (const candidateUrl of skillCandidates) {
    const fetched = await runWebFetch(
      { url: candidateUrl, maxBytes: MAX_WEB_FETCH_MAX_BYTES, expectedMime: "any", followRedirects: true },
      "skill_fetch",
    );
    attempted.push({
      url: candidateUrl,
      ok: fetched?.ok === true,
      error: fetched?.ok === false ? fetched?.error?.message || fetched?.error?.code || "FETCH_FAILED" : null,
    });
    if (fetched?.ok === true && typeof fetched?.data?.text === "string") {
      primary = fetched;
      break;
    }
  }

  if (!primary || primary.ok !== true) {
    state.skillImport.status = "failed";
    state.skillImport.lastError = "SKILL_NOT_FOUND";
    state.skillImport.importedPaths = [];
    state.skillImport.importedFiles = [];
    state.skillImport.siteRoot = null;
    state.skillImport.activeSkillPath = null;
    await persistSkillImportState();
    updateGatewayState();
    return withToolMeta(
      toolName,
      startedAtMs,
      makeToolFailure("NOT_FOUND", "Skill file not found for visit target", {
        entryUrl,
        resolvedEntryUrl,
        registration: registrationInfo,
        attempted,
      }),
    );
  }

  const primaryUrl = String(primary.data?.finalUrl || primary.data?.url || skillCandidates[0] || entryUrl);
  const primaryContent = String(primary.data?.text || "");
  const companionUrls = collectSkillCompanionUrls(primaryContent, primaryUrl);
  const siteRoot = buildSkillWorkspaceSiteRoot(primaryUrl);
  const activeSkillPath = `${siteRoot}SKILL.md`;

  const importedFileByPath = new Map();
  const importedByBaseName = new Map();
  const failedUrls = [];
  const normalizeFetchedImportMetadata = async ({ fetched, sourceUrl, finalUrl, content }) => ({
    sourceUrl: normalizeSkillImportMetadataText(sourceUrl),
    finalUrl: normalizeSkillImportMetadataText(finalUrl),
    etag: normalizeSkillImportMetadataText(fetched?.data?.etag),
    lastModified: normalizeSkillImportMetadataText(fetched?.data?.lastModified),
    sha256B64: normalizeSkillImportHash(fetched?.data?.sha256B64) || (await sha256B64FromUtf8(content || "")),
  });
  const recordImportedFile = (path, metadata = {}) => {
    const normalized = normalizeSkillImportFileEntry({ path, ...(metadata || {}) });
    if (!normalized) return;
    importedFileByPath.set(normalized.path, normalized);
  };

  const primaryMetadata = await normalizeFetchedImportMetadata({
    fetched: primary,
    sourceUrl: primaryUrl,
    finalUrl: primaryUrl,
    content: primaryContent,
  });

  for (const url of companionUrls) {
    const fetched = url === primaryUrl
      ? primary
      : await runWebFetch({ url, maxBytes: MAX_WEB_FETCH_MAX_BYTES, expectedMime: "any", followRedirects: true }, "skill_fetch");
    if (!fetched || fetched.ok !== true || typeof fetched?.data?.text !== "string") {
      failedUrls.push({
        url,
        error: fetched?.error?.message || fetched?.error?.code || "FETCH_FAILED",
      });
      continue;
    }

    const finalUrl = String(fetched.data?.finalUrl || fetched.data?.url || url);
    const content = String(fetched.data?.text || "");
    const importPath = buildSkillWorkspaceImportPath(finalUrl);
    const importMetadata = await normalizeFetchedImportMetadata({
      fetched,
      sourceUrl: url,
      finalUrl,
      content,
    });
    const writeResult = await runWorkspaceWriteFile(
      { path: importPath, content },
      "workspace_write_file",
      { skipPermissionPolicy: true },
    );
    if (writeResult?.ok !== true) {
      failedUrls.push({
        url: finalUrl,
        error: writeResult?.error?.message || writeResult?.error?.code || "WRITE_FAILED",
      });
      continue;
    }

    recordImportedFile(importPath, importMetadata);
    const baseName = importPath.split("/").pop() || "";
    if (baseName) importedByBaseName.set(baseName.toLowerCase(), { content, metadata: importMetadata });
  }

  const compatibilityWrites = new Map();
  const siteCompatibilityWrites = new Map();
  compatibilityWrites.set("workspace/SKILL.md", { content: primaryContent, metadata: primaryMetadata });
  compatibilityWrites.set("workspace/skill.md", { content: primaryContent, metadata: primaryMetadata });
  siteCompatibilityWrites.set(`${siteRoot}SKILL.md`, { content: primaryContent, metadata: primaryMetadata });
  siteCompatibilityWrites.set(`${siteRoot}skill.md`, { content: primaryContent, metadata: primaryMetadata });
  for (const [baseName, descriptor] of importedByBaseName.entries()) {
    if (!VISIT_COMPAT_BASENAMES.has(baseName)) continue;
    compatibilityWrites.set(`workspace/${baseName}`, descriptor);
    siteCompatibilityWrites.set(`${siteRoot}${baseName}`, descriptor);
    const upperName = uppercaseMdCompatibilityName(baseName);
    if (upperName) {
      compatibilityWrites.set(`workspace/${upperName}`, descriptor);
      siteCompatibilityWrites.set(`${siteRoot}${upperName}`, descriptor);
    }
  }

  const compatibilityAllWrites = new Map([...siteCompatibilityWrites.entries(), ...compatibilityWrites.entries()]);
  for (const [path, descriptor] of compatibilityAllWrites.entries()) {
    const content = typeof descriptor?.content === "string" ? descriptor.content : String(descriptor?.content || "");
    const metadata = descriptor?.metadata || null;
    const writeResult = await runWorkspaceWriteFile(
      { path, content },
      "workspace_write_file",
      { skipPermissionPolicy: true },
    );
    if (writeResult?.ok === true) {
      if (metadata) {
        recordImportedFile(path, metadata);
      } else {
        recordImportedFile(path, { sha256B64: await sha256B64FromUtf8(content) });
      }
    }
  }

  const importedFiles = normalizeSkillImportFiles(Array.from(importedFileByPath.values()), { limit: 500 });
  const importedPaths = importedFiles.map((entry) => entry.path);

  state.skillImport.status = "ready";
  state.skillImport.sourceUrl = primaryUrl;
  state.skillImport.lastImportedAtMs = nowMs();
  state.skillImport.lastError = null;
  state.skillImport.siteRoot = siteRoot;
  state.skillImport.activeSkillPath = activeSkillPath;
  state.skillImport.importedFiles = importedFiles;
  state.skillImport.importedPaths = importedPaths.slice(0, 500);
  await persistSkillImportState();
  updateGatewayState();

  const result = withToolMeta(
    toolName,
    startedAtMs,
    makeToolSuccess({
      entryUrl,
      sourceUrl: primaryUrl,
      siteRoot,
      activeSkillPath,
      importedPaths,
      importedFiles,
      importedCount: importedPaths.length,
      failedUrls,
      attempted,
      registration: registrationInfo,
      permissionPolicy: permissionPolicySnapshot(),
    }),
  );
  log(`visit import ok source=${primaryUrl} files=${importedPaths.length} failed=${failedUrls.length}`);
  return result;
}

async function runWebMcpDiscover(params, toolName = "webmcp_discover") {
  const startedAtMs = nowMs();
  const endpointRaw = typeof params?.endpoint === "string" ? params.endpoint.trim() : "/__test__/webmcp/discover";
  let endpoint;
  try {
    endpoint = new URL(endpointRaw, safeOrigin() || "http://localhost").toString();
    assertAllowlistedUrl(endpoint);
  } catch {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Invalid WebMCP discover endpoint"));
  }

  try {
    const res = await fetch(endpoint, { method: "GET", credentials: "include" });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.ok !== true) {
      return withToolMeta(toolName, startedAtMs, makeToolFailure("UNSUPPORTED", String(data?.error || "WEBMCP_DISCOVER_FAILED")));
    }
    const tools = Array.isArray(data.tools) ? data.tools : [];
    return withToolMeta(toolName, startedAtMs, makeToolSuccess({ tools }));
  } catch (e) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("UNSUPPORTED", e?.message || "WEBMCP_DISCOVER_FAILED"));
  }
}

async function runWebMcpCall(params, toolName = "webmcp_call") {
  const startedAtMs = nowMs();
  const tool = typeof params?.tool === "string" ? params.tool.trim() : "";
  const args = params?.args && typeof params.args === "object" && !Array.isArray(params.args) ? params.args : {};
  if (!tool) {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Missing WebMCP tool name"));
  }

  const endpointRaw = typeof params?.endpoint === "string" ? params.endpoint.trim() : "/__test__/webmcp/call";
  let endpoint;
  try {
    endpoint = new URL(endpointRaw, safeOrigin() || "http://localhost").toString();
    assertAllowlistedUrl(endpoint);
  } catch {
    return withToolMeta(toolName, startedAtMs, makeToolFailure("INVALID_ARGUMENTS", "Invalid WebMCP call endpoint"));
  }

  let envelope;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tool, args }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.ok !== true) {
      envelope = makeToolFailure("UNSUPPORTED", String(data?.error || "WEBMCP_CALL_FAILED"), { tool });
    } else {
      envelope = makeToolSuccess({ tool, result: data.result ?? null });
    }
  } catch (e) {
    envelope = makeToolFailure("UNSUPPORTED", e?.message || "WEBMCP_CALL_FAILED", { tool });
  }

  const callId = randomId("mcp");
  state.transcript.push({
    role: "assistant",
    content: [{ type: "toolCall", id: callId, name: `webmcp:${tool}`, arguments: args }],
    api: "webmcp",
    provider: "webmcp",
    model: "webmcp-adapter",
    stopReason: "tool_calls",
    timestamp: nowMs(),
  });
  state.transcript.push({
    role: "toolResult",
    toolCallId: callId,
    toolName: `webmcp:${tool}`,
    content: [{ type: "text", text: JSON.stringify(envelope) }],
    isError: envelope.ok !== true,
    timestamp: nowMs(),
  });
  await persistTranscript();

  return withToolMeta(toolName, startedAtMs, envelope);
}

async function runExperienceEngineBaseline(params, toolName = "experience_engine_run") {
  const startedAtMs = nowMs();
  const requestedDryRun = params?.dryRun === true;
  const finishEnvelope = async (mode, envelope) => {
    const wrapped = withToolMeta(toolName, startedAtMs, envelope);
    await recordSkillRunDiagnostic({ mode, envelope: wrapped, startedAtMs });
    return wrapped;
  };
  const finishFailure = async (mode, code, message, details = {}, retryable = false) => {
    return finishEnvelope(mode, makeToolFailure(code, message, details, retryable));
  };
  const finishSuccess = async (mode, data) => {
    return finishEnvelope(mode, makeToolSuccess(data));
  };

  const resolved = await resolveExperienceWorkspaceFiles(params || {});
  if (resolved.missingRequiredPaths.length > 0) {
    return finishFailure(
      requestedDryRun ? "dry-run" : "resolve",
      "NOT_FOUND",
      "Missing required experience workspace files",
      {
        missingPaths: resolved.missingRequiredPaths,
        missingRequiredPaths: resolved.missingRequiredPaths,
        missingOptionalPaths: resolved.missingOptionalPaths,
      },
    );
  }

  if (requestedDryRun) {
    return finishSuccess("dry-run", {
      mode: "dry-run",
      resolvedPaths: resolved.resolvedPaths,
      siteRoot: resolved.siteRoot,
      fileKeys: Object.keys(resolved.files),
      missingRequiredPaths: resolved.missingRequiredPaths,
      missingOptionalPaths: resolved.missingOptionalPaths,
    });
  }

  const transportRaw = String(params?.transport || (params?.wsUrl ? "ws" : "agent-turn"))
    .trim()
    .toLowerCase();
  const transport = transportRaw || "agent-turn";

  if (transport === "ws") {
    const origin = safeOrigin() || "http://localhost";
    const defaultWsUrl = origin.replace(/^https:/, "wss:").replace(/^http:/, "ws:") + "/__test__/experience/ws";
    const wsUrl = typeof params?.wsUrl === "string" && params.wsUrl.trim() ? params.wsUrl.trim() : defaultWsUrl;

    const opened = await runWsOpen({ url: wsUrl, connectTimeoutMs: 8_000 }, "ws_open");
    if (!opened.ok) {
      return finishFailure("ws", opened.error?.code || "UNSUPPORTED", opened.error?.message || "WS_OPEN_FAILED");
    }
    const sessionId = opened.data?.sessionId;
    if (!sessionId) {
      return finishFailure("ws", "UNSUPPORTED", "Missing websocket session id");
    }

    const sent = runWsSend(
      {
        sessionId,
        json: {
          type: "experience.run",
          files: resolved.files,
        },
      },
      "ws_send",
    );
    if (!sent.ok) {
      runWsClose({ sessionId }, "ws_close");
      return finishFailure("ws", sent.error?.code || "UNSUPPORTED", sent.error?.message || "WS_SEND_FAILED");
    }

    const received = await runWsRecv({ sessionId, maxMessages: 1, waitMs: 8_000 }, "ws_recv");
    runWsClose({ sessionId }, "ws_close");
    if (!received.ok) {
      return finishFailure("ws", received.error?.code || "UNSUPPORTED", received.error?.message || "WS_RECV_FAILED");
    }

    const first = Array.isArray(received.data?.messages) && received.data.messages.length > 0 ? received.data.messages[0] : null;
    const ack = first?.json || null;
    if (!ack) {
      return finishFailure("ws", "TIMEOUT", "No experience response received");
    }

    return finishSuccess("ws", {
      mode: "ws",
      ack,
      resolvedPaths: resolved.resolvedPaths,
      siteRoot: resolved.siteRoot,
      fileKeys: Object.keys(resolved.files),
      missingRequiredPaths: resolved.missingRequiredPaths,
      missingOptionalPaths: resolved.missingOptionalPaths,
    });
  }

  const instruction =
    typeof params?.prompt === "string" && params.prompt.trim()
      ? params.prompt.trim()
      : "Read workspace/SKILL.md and execute the next safe step for this experience. Ask for human input only if required.";
  let instructionForModel = instruction;
  const runtimeSnapshot = await resolveRuntimeSnapshotFromInput({
    runtimeContext: params?.runtimeContext || null,
    runtimeState: params?.runtimeState || null,
  });
  const runtimeSections = buildRuntimeContextSections(runtimeSnapshot);
  const runtimeContext = runtimeSections.runtimeContext;
  const runtimeAppState = runtimeSections.runtimeAppState;
  const runtimeBeforeSummary = summarizeRuntimeAppStateForDebug(runtimeAppState);
  const hintedTeamCode = normalizeTeamCodeHint(runtimeContext?.teamCode || runtimeAppState?.teamCode);
  if (hintedTeamCode && hintedTeamCode !== state.teamCodeHint) {
    state.teamCodeHint = hintedTeamCode;
    metaSet("teamCodeHint", hintedTeamCode).catch(() => {
      // Non-fatal; hint is best-effort.
    });
  }
  if (runtimeSections.contextSections.length > 0) {
    instructionForModel = `${instruction}

${runtimeSections.combinedContext}`;
  }

  const recordToTranscript = params?.recordToTranscript !== false;
  const emitChat = params?.emitChat === true ? true : params?.emitChat === false ? false : recordToTranscript;
  const registrySnapshot = await trainerBuildRegistrySnapshot();
  const tools = getLiteTools();
  const preview = await buildLitePromptPreview({ model: getConfiguredModel(), tools });
  const llmRequestMessages = state.transcript
    .slice()
    .map((entry) => ({
      role: String(entry?.role || ""),
      content: textFromMessageContent(entry?.content || []),
    }))
    .concat([{ role: "user", content: instructionForModel }]);
  const llmToolSpecs = tools.map((tool) => ({
    name: String(tool?.name || ""),
    description: String(tool?.description || ""),
    parameters: tool?.parameters || {},
  }));

  const questId = trainerQuestId(params?.questId || TRAINER_DEFAULT_QUEST_ID);
  let capture = null;
  let captureClosed = false;
  const closeCapture = async (result = "unknown", successSignals = null) => {
    if (!capture || captureClosed) return;
    captureClosed = true;
    const endedAtMs = nowMs();
    capture.stats.durationMs = Math.max(0, endedAtMs - capture.createdAtMs);
    capture.manifest.endedAtMs = endedAtMs;
    capture.manifest.result = result;
    capture.manifest.successSignals = successSignals || {
      isSuccess: false,
      houseId: null,
      experienceStep: null,
    };
    await trainerAppendEvent(capture, "attempt.end", "system", {
      result: capture.manifest.result,
      successSignals: capture.manifest.successSignals,
    });
    await trainerPersistManifest(capture);
  };

  try {
    capture = await trainerStartAttemptCapture({
      questId,
      entryPrompt: instruction,
      resolved,
      runtimeSnapshot,
      registrySnapshot,
    });
    state.trainer.activeCapture = capture;
    capture.registryEvent = await trainerAppendEvent(capture, "tool.registry.snapshot", "system", {
      registrySha256: registrySnapshot.registrySha256,
      tools: registrySnapshot.tools,
    });
    capture.turnId = randomId("turn");
    const activeSkillPath =
      typeof state.skillImport?.activeSkillPath === "string" && state.skillImport.activeSkillPath.trim()
        ? state.skillImport.activeSkillPath.trim()
        : "workspace/SKILL.md";
    const skillDoc = capture.manifest.experienceDocs.find((doc) => doc.path === activeSkillPath) || null;
    const sections = [
      {
        id: "runtime-context",
        title: "Runtime context",
        sourceType: "runtimeState",
        sourceRef: "/api/state",
        sha256: await sha256HexFromUtf8(stableJsonStringify(runtimeSections.runtimeAppStateSummary || {})),
        chars: utf8ToBytes(stableJsonStringify(runtimeSections.runtimeAppStateSummary || {})).length,
        truncated: false,
      },
      {
        id: "active-skill",
        title: "Active skill path",
        sourceType: "experienceDoc",
        sourceRef: activeSkillPath,
        sha256: skillDoc?.sha256 || null,
        chars: activeSkillPath.length,
        truncated: false,
      },
      {
        id: "tool-registry",
        title: "Tool registry",
        sourceType: "harness",
        sourceRef: "tool.registry.snapshot",
        sha256: registrySnapshot.registrySha256,
        chars: utf8ToBytes(stableJsonStringify(registrySnapshot.tools)).length,
        truncated: false,
      },
      {
        id: "user-input",
        title: "Run prompt",
        sourceType: "userInput",
        sourceRef: "gateway.command.experience.run",
        sha256: await sha256HexFromUtf8(instructionForModel),
        chars: instructionForModel.length,
        truncated: false,
      },
    ];
    const contextReceiptPath = await trainerWriteContextReceipt(capture, capture.turnId, {
      systemPrompt: preview.systemPrompt,
      messages: llmRequestMessages,
      tools: llmToolSpecs,
      sections,
    });
    capture.llmStartEvent = await trainerAppendEvent(
      capture,
      "llm.turn.start",
      "agent",
      {
        turnId: capture.turnId,
        provider: String(state.llmProvider || getConfiguredModel()?.provider || "openai"),
        modelId: String(state.llmModelId || getConfiguredModel()?.id || "unknown"),
        modelRef: String(state.llmModelRef || ""),
        api: String(state.llmApi || getConfiguredModel()?.api || ""),
        reasoning: String(state.llmReasoning || ""),
        baseUrl: String(state.llmBaseUrl || ""),
        useProxy: state.llmUseProxy !== false,
        contextReceiptPath,
        toolRegistrySha256: registrySnapshot.registrySha256,
        truncation: {
          applied: preview.truncatedFiles.length > 0,
          reason: preview.truncatedFiles.length > 0 ? "workspace_context_file_limit" : null,
          maxChars: null,
        },
      },
      { parentSpanId: capture.registryEvent?.spanId || null },
    );
    capture.turnSpanId = capture.llmStartEvent?.spanId || null;
  } catch (err) {
    capture = null;
    state.trainer.activeCapture = null;
    log(`trainer capture init failed: ${err?.message || String(err)}`);
  }

  // Keep debug context authoritative even for silent loop turns that skip transcript/chat.
  recordLastLlmInputDebug({
    source: "gateway.command.experience.run",
    userText: instruction,
    displayUserText: instruction,
    promptText: instructionForModel,
    extraContext: runtimeSections.combinedContext,
    extraContextSections: runtimeSections.contextSections,
    runtimeContext: runtimeSections.runtimeContext,
    runtimeAppState: runtimeSections.runtimeAppStateSummary,
    runtimeContextPrompt: runtimeSections.runtimeContextPrompt,
    runtimeExperiencePrompt: runtimeSections.runtimeExperiencePrompt,
    activeSkillPrompt: runtimeSections.activeSkillPrompt,
    coopChatPrompt: runtimeSections.coopChatPrompt,
  });
  const transcriptStart = state.transcript.length;
  const turn = await runAgentTurn(instructionForModel, {
    persistToTranscript: recordToTranscript,
    emitChat,
  });
  const generated = Array.isArray(turn?.messages) ? turn.messages : state.transcript.slice(transcriptStart);
  let assistantText = "";
  let assistantMessageCount = 0;
  let assistantStopReason = "";
  let assistantErrorMessage = "";
  for (const msg of generated) {
    if (!msg || msg.role !== "assistant") continue;
    assistantMessageCount += 1;
    const text = textFromMessageContent(msg.content).trim();
    if (text) assistantText = text;
    const stopReason = String(msg.stopReason || "").trim().toLowerCase();
    if (stopReason) assistantStopReason = stopReason;
    const errorText = typeof msg.errorMessage === "string" ? msg.errorMessage.trim() : "";
    if (errorText) assistantErrorMessage = errorText;
  }

  const requestedToolCalls = trainerExtractToolCalls(generated);
  if (capture) {
    capture.stats.llmTurns += 1;
    await trainerAppendEvent(
      capture,
      "llm.turn.end",
      "agent",
      {
        turnId: capture.turnId,
        outputText: assistantText || "",
        toolCalls: requestedToolCalls.map((call) => ({
          toolCallId: call.toolCallId,
          name: call.name,
          argsJson: call.argsJson,
        })),
        finishReason: assistantStopReason || "stop",
        usage: null,
      },
      { parentSpanId: capture.turnSpanId || null },
    );
    const requestedById = new Map();
    for (const call of requestedToolCalls) {
      capture.stats.toolCalls += 1;
      const reqEvent = await trainerAppendEvent(
        capture,
        "tool.call.requested",
        "agent",
        {
          turnId: capture.turnId,
          toolCallId: call.toolCallId,
          name: call.name,
          args: call.args,
          argsJson: call.argsJson,
        },
        { parentSpanId: capture.turnSpanId || null },
      );
      requestedById.set(call.toolCallId, reqEvent);
    }

    const resultsById = trainerExtractToolResults(generated);
    const knownRegistryTools = new Set((registrySnapshot.tools || []).map((tool) => String(tool?.name || "")));
    for (const call of requestedToolCalls) {
      const result = resultsById.get(call.toolCallId) || null;
      const missing = !result;
      const inferredToolMissing = missing && !knownRegistryTools.has(call.name);
      const rawResultErrorCode = String(result?.error?.code || "").trim().toUpperCase();
      const rawResultErrorMessage = String(result?.error?.message || "");
      const resultReportsToolMissing = !missing && (
        rawResultErrorCode === "TOOL_NOT_FOUND"
        || (rawResultErrorCode === "UNSUPPORTED" && /not found/i.test(rawResultErrorMessage))
      );
      const errorCode = inferredToolMissing
        ? "TOOL_NOT_FOUND"
        : missing
          ? "UNSUPPORTED"
          : resultReportsToolMissing
            ? "TOOL_NOT_FOUND"
            : rawResultErrorCode;
      const errorMessage = inferredToolMissing
        ? `Tool ${call.name} is not registered`
        : missing
          ? `Tool ${call.name} result was not emitted`
          : rawResultErrorMessage;
      const execEvent = await trainerAppendEvent(
        capture,
        "tool.call.executed",
        "system",
        {
          toolCallId: call.toolCallId,
          name: call.name,
          ok: missing ? false : result.ok === true,
          durationMs: missing ? 0 : Number(result.durationMs || 0),
          retries: 0,
          result: missing ? null : result.result,
          error: missing || result.ok !== true
            ? {
              code: errorCode || "UNSUPPORTED",
              message: errorMessage || "Tool execution failed",
              details: missing ? { toolCallId: call.toolCallId, requestedTool: call.name } : result?.error?.details || null,
            }
            : null,
        },
        { parentSpanId: requestedById.get(call.toolCallId)?.spanId || capture.turnSpanId || null },
      );
      if (execEvent?.data?.ok !== true) {
        capture.stats.toolFailures += 1;
      }
      if ((execEvent?.data?.error?.code || "") === "TOOL_NOT_FOUND") {
        await trainerAppendEvent(
          capture,
          "error",
          "system",
          {
            kind: "TOOL_NOT_FOUND",
            message: execEvent?.data?.error?.message || `Tool ${call.name} not found`,
            toolCallId: call.toolCallId,
            turnId: capture.turnId,
            toolRegistrySha256: registrySnapshot.registrySha256,
            requestedToolName: call.name,
            requestedEventSeq: requestedById.get(call.toolCallId)?.seq || null,
            registryEventSeq: capture.registryEvent?.seq || null,
            llmTurnEventSeq: capture.llmStartEvent?.seq || null,
          },
          { parentSpanId: execEvent?.spanId || capture.turnSpanId || null },
        );
      }
      if ((execEvent?.data?.error?.code || "") === "APPROVAL_REJECTED") {
        await trainerAppendEvent(
          capture,
          "error",
          "system",
          {
            kind: "APPROVAL_REJECTED",
            message: execEvent?.data?.error?.message || "Tool call rejected by coach",
            toolCallId: call.toolCallId,
            turnId: capture.turnId,
            toolRegistrySha256: registrySnapshot.registrySha256,
            requestedToolName: call.name,
          },
          { parentSpanId: execEvent?.spanId || capture.turnSpanId || null },
        );
      }
    }
  }

  const runtimeAfterSnapshot = await resolveRuntimeSessionSnapshot();
  const runtimeAfterSummary = summarizeRuntimeAppStateForDebug(runtimeAfterSnapshot?.appState || null);
  const successSignals = trainerResolveSuccessSignals(runtimeAfterSnapshot);
  if (capture) {
    await trainerAppendEvent(
      capture,
      "state.transition",
      "system",
      {
        source: "api:/api/state",
        prev: runtimeBeforeSummary || null,
        next: runtimeAfterSummary || null,
        keys: [
          "experience.id",
          "experience.step",
          "experience.nextAgentAction",
          "houseId",
          "human.selected",
          "agent.selected",
          "match.matched",
          "human.openPressed",
          "agent.openPressed",
        ],
      },
      { parentSpanId: capture.turnSpanId || null },
    );
  }

  if (assistantText === LLM_NOT_CONFIGURED_MESSAGE) {
    await closeCapture("fail", successSignals);
    state.trainer.activeCapture = null;
    return finishFailure(
      "agent-turn",
      "LLM_NOT_CONFIGURED",
      LLM_NOT_CONFIGURED_MESSAGE,
      {
        mode: "agent-turn",
        prompt: instruction,
        runtimeContext,
        successSignals,
        resolvedPaths: resolved.resolvedPaths,
        siteRoot: resolved.siteRoot,
        fileKeys: Object.keys(resolved.files),
        missingRequiredPaths: resolved.missingRequiredPaths,
        missingOptionalPaths: resolved.missingOptionalPaths,
      },
    );
  }

  if (assistantErrorMessage || assistantStopReason === "error") {
    const normalizedError = String(assistantErrorMessage || "").toUpperCase();
    const errorCode = normalizedError.includes("HATCH_REQUIRED")
      ? "HATCH_REQUIRED"
      : normalizedError.includes("SESSION_REQUIRED")
        ? "SESSION_REQUIRED"
        : "LLM_RUN_FAILED";
    await closeCapture("fail", successSignals);
    state.trainer.activeCapture = null;
    return finishFailure(
      "agent-turn",
      errorCode,
      assistantErrorMessage || "Assistant run failed",
      {
        mode: "agent-turn",
        prompt: instruction,
        runtimeContext,
        successSignals,
        stopReason: assistantStopReason || "error",
        assistantMessageCount,
        assistantText: assistantText || null,
        resolvedPaths: resolved.resolvedPaths,
        siteRoot: resolved.siteRoot,
        fileKeys: Object.keys(resolved.files),
        missingRequiredPaths: resolved.missingRequiredPaths,
        missingOptionalPaths: resolved.missingOptionalPaths,
      },
    );
  }

  const attemptResult = successSignals.isSuccess ? "success" : "unknown";
  await closeCapture(attemptResult, successSignals);
  state.trainer.activeCapture = null;
  return finishSuccess("agent-turn", {
    mode: "agent-turn",
    prompt: instruction,
    runtimeContext,
    successSignals,
    trainerAttemptId: capture?.attemptId || null,
    assistantMessageCount,
    assistantText: assistantText || null,
    resolvedPaths: resolved.resolvedPaths,
    siteRoot: resolved.siteRoot,
    fileKeys: Object.keys(resolved.files),
    missingRequiredPaths: resolved.missingRequiredPaths,
    missingOptionalPaths: resolved.missingOptionalPaths,
  });
}

// --- House crypto helpers (mirrors public/create.js + public/house.js) ---
function buildHouseKeyWrapMessage({ houseId, origin }) {
  const parts = ["ElizaTown House Key Wrap", `houseId: ${houseId}`];
  if (origin) parts.push(`origin: ${origin}`);
  return parts.join("\n");
}

function buildVaultKeyWrapMessage({ houseId, origin }) {
  return ["ElizaTown Vault Backup Key Wrap", `houseId: ${houseId}`, `origin: ${origin}`].join("\n");
}

async function deriveHouseKeysFromKroot(krootBytes) {
  const kencBytes = await hkdfSha256(krootBytes, "elizatown-house-enc-v1", 32);
  const kauthBytes = await hkdfSha256(krootBytes, "elizatown-house-auth-v1", 32);
  const kauthKey = await importHmacSha256Key(kauthBytes, ["sign"]);
  return { kencBytes, kauthBytes, kauthKey };
}

async function houseAuthHeaders({ houseId, method, urlPath, body }) {
  if (!state.kauthKey) throw new Error("HOUSE_AUTH_NOT_READY");
  const ts = String(nowMs());
  const bodyHash = await sha256B64FromUtf8(body || "");
  const msg = `${houseId}.${ts}.${method}.${urlPath}.${bodyHash}`;
  const auth = await hmacSha256B64(state.kauthKey, msg);
  return { "x-house-ts": ts, "x-house-auth": auth };
}

// --- Vault backup ---
const deterministicSignerOk = new Set();

async function ensureDeterministicSigner(message) {
  const a = await walletSignMessage(message);
  const addr = typeof a?.address === "string" ? a.address : "";
  const cacheKey = `${addr}|${message}`;
  if (deterministicSignerOk.has(cacheKey)) return a;

  const b = await walletSignMessage(message);
  const aa = a.signatureBytes;
  const bb = b.signatureBytes;
  if (aa.length !== bb.length) throw new Error("NON_DETERMINISTIC_SIGNATURES");
  for (let i = 0; i < aa.length; i += 1) {
    if (aa[i] !== bb[i]) throw new Error("NON_DETERMINISTIC_SIGNATURES");
  }
  deterministicSignerOk.add(cacheKey);
  return a;
}

async function deriveVaultKeyBytes({ houseId }) {
  const origin = safeOrigin();
  const message = buildVaultKeyWrapMessage({ houseId, origin });
  const { signatureBytes } = await ensureDeterministicSigner(message);
  const wrapKeyBytes = await sha256(signatureBytes);
  return await hkdfSha256(wrapKeyBytes, "elizatown-vault-backup-v1", 32);
}

async function buildVaultPlaintext() {
  const allFiles = await vfsReadAllBytes("");
  const vfs = {};
  for (const [p, bytes] of Object.entries(allFiles)) {
    vfs[p] = bytesToB64(bytes);
  }
  return {
    v: 1,
    schema: "openclaw-lite-vault@1",
    createdAtMs: nowMs(),
    houseId: state.houseId,
    krootB64: state.krootBytes ? bytesToB64(state.krootBytes) : null,
    marker: state.secretMarker || null,
    vfs,
  };
}

async function lockAndBackupVault() {
  if (!state.houseId || !state.krootBytes) throw new Error("HOUSE_NOT_READY");
  const decision = await requestApproval({ title: "Approval", body: "Lock + backup vault" });
  if (decision !== "approve") {
    log("backup rejected");
    return;
  }

  const vaultKeyBytes = await deriveVaultKeyBytes({ houseId: state.houseId });
  const plaintext = await buildVaultPlaintext();
  const ptBytes = utf8ToBytes(JSON.stringify(plaintext));
  const enc = await aesGcmEncryptRaw(vaultKeyBytes, ptBytes);
  const sha = await sha256(enc.ct);

  const envelope = {
    v: 1,
    alg: "AES-GCM",
    kdf: {
      kind: "wallet-signature",
      wallet: "solana",
      message: buildVaultKeyWrapMessage({ houseId: state.houseId, origin: safeOrigin() }),
      origin: safeOrigin(),
      houseId: state.houseId,
    },
    iv: bytesToB64(enc.iv),
    ct: bytesToB64(enc.ct),
    meta: {
      schema: "openclaw-lite-vault@1",
      createdAtMs: nowMs(),
      byteLength: ptBytes.length,
      sha256: bytesToB64(sha),
    },
  };

  const urlPath = `/api/house/${encodeURIComponent(state.houseId)}/vault/backup`;
  const body = JSON.stringify({ vault: envelope });
  const headers = await houseAuthHeaders({ houseId: state.houseId, method: "POST", urlPath, body });
  const resp = await apiJson(urlPath, { method: "POST", body, headers });
  state.vaultLatestBackupId = resp?.backupId || null;
  await metaSet("vaultLatestBackupId", state.vaultLatestBackupId);
  updateGatewayState();
  log(`backup ok ${state.vaultLatestBackupId || ""}`);

  // Lock: wipe K_root from memory, but keep persisted VFS.
  state.krootBytes = null;
  state.kencBytes = null;
  state.kauthBytes = null;
  state.kauthKey = null;
  await metaSet("krootB64", null);
}

async function restoreFromLatestVault() {
  if (!state.houseId) throw new Error("HOUSE_NOT_READY");

  // If K_root is missing, recover via wallet keyWrap.
  if (!state.krootBytes) {
    await recoverHouse();
  }
  if (!state.krootBytes) throw new Error("HOUSE_KEY_NOT_RECOVERED");

  const urlPath = `/api/house/${encodeURIComponent(state.houseId)}/vault/latest`;
  const headers = await houseAuthHeaders({ houseId: state.houseId, method: "GET", urlPath, body: "" });
  const resp = await apiJson(urlPath, { method: "GET", headers });
  const vault = resp?.vault || null;
  if (!vault || typeof vault.ct !== "string" || typeof vault.iv !== "string") throw new Error("NO_VAULT");

  const vaultKeyBytes = await deriveVaultKeyBytes({ houseId: state.houseId });
  const ptBytes = await aesGcmDecryptRaw(vaultKeyBytes, b64ToBytes(vault.iv), b64ToBytes(vault.ct));

  const parsed = JSON.parse(new TextDecoder().decode(ptBytes));
  if (!parsed || parsed.v !== 1 || parsed.schema !== "openclaw-lite-vault@1") throw new Error("INVALID_VAULT");

  // Restore VFS (overwrite).
  const vfs = parsed.vfs && typeof parsed.vfs === "object" ? parsed.vfs : {};
  for (const [p, dataB64] of Object.entries(vfs)) {
    if (typeof p !== "string" || typeof dataB64 !== "string") continue;
    await vfsPutBytes(p, b64ToBytes(dataB64));
  }

  // Restore marker and transcript/session ids.
  state.secretMarker = parsed.marker || null;

  // If vault includes K_root, use it (still validate houseId).
  if (typeof parsed.krootB64 === "string" && parsed.krootB64) {
    const kroot = b64ToBytes(parsed.krootB64);
    const derivedHouseId = base58Encode(await sha256(kroot));
    if (derivedHouseId !== state.houseId) throw new Error("HOUSE_ID_MISMATCH");
    const keys = await deriveHouseKeysFromKroot(kroot);
    state.krootBytes = kroot;
    state.kencBytes = keys.kencBytes;
    state.kauthBytes = keys.kauthBytes;
    state.kauthKey = keys.kauthKey;
  }

  await ensureWorkspaceFiles();
  await ensureSessionFiles();
  await persistTranscript();
  log(`restore ok marker=${state.secretMarker || ""}`);
  updateGatewayState();
}

// --- Public profile ---
async function publishProfile({ housePublicJson, promptMd }) {
  if (!state.houseId || !state.kauthKey) throw new Error("HOUSE_NOT_READY");
  const decision = await requestApproval({ title: "Approval", body: "Publish public profile" });
  if (decision !== "approve") {
    log("publish rejected");
    return;
  }

  const urlPath = `/api/house/${encodeURIComponent(state.houseId)}/public-profile`;
  const body = JSON.stringify({ housePublicJson, promptMd: promptMd || "", previewImage: null, clear: false });
  const headers = await houseAuthHeaders({ houseId: state.houseId, method: "POST", urlPath, body });
  await apiJson(urlPath, { method: "POST", body, headers });
  log("publish ok");
}

// --- Export ---
async function exportZip() {
  await ensureWorkspaceFiles();
  await ensureSessionFiles();
  await persistTranscript();

  const files = await vfsReadAllBytes("");
  const manifest = {
    v: 1,
    kind: "openclaw-lite-export",
    createdAtMs: nowMs(),
    openclaw: {
      agentId: MAIN_AGENT_ID,
      mainSessionKey: MAIN_SESSION_KEY,
      compat: { openclawVersion: OPENCLAW_VERSION, piVersions: PI_VERSIONS },
    },
  };
  files["manifest.json"] = utf8ToBytes(JSON.stringify(manifest, null, 2));

  const zipped = zipSync(files, { level: 0 });
  post({ type: "worker.export.zip", filename: "openclaw-lite-export.zip", bytes: zipped.buffer }, [zipped.buffer]);
}

// --- House creation + recovery ---
async function createHouse({ rhB64 }) {
  if (state.houseId) return;

  const rh = b64ToBytes(rhB64);
  const ra = randomBytes(32);
  const combo = new Uint8Array(rh.length + ra.length);
  combo.set(rh, 0);
  combo.set(ra, rh.length);

  const kroot = await sha256(combo);
  const houseId = base58Encode(await sha256(kroot));
  const keys = await deriveHouseKeysFromKroot(kroot);

  const address = await walletConnect();
  const wrapMsg = buildHouseKeyWrapMessage({ houseId, origin: safeOrigin() });
  const { signatureBytes } = await walletSignMessage(wrapMsg);
  const wrapKeyBytes = await sha256(signatureBytes);
  const wrapped = await aesGcmEncryptRaw(wrapKeyBytes, kroot);
  const keyWrap = { alg: "AES-GCM", iv: bytesToB64(wrapped.iv), ct: bytesToB64(wrapped.ct) };

  const nonce = (await apiJson("/api/house/nonce"))?.nonce;
  await apiJson("/api/house/init", {
    method: "POST",
    body: JSON.stringify({
      houseId,
      housePubKey: houseId,
      nonce,
      keyMode: "ceremony",
      unlock: { kind: "solana-wallet-signature", address },
      keyWrap,
      houseAuthKey: bytesToB64(keys.kauthBytes),
    }),
  });

  state.houseId = houseId;
  state.krootBytes = kroot;
  state.kencBytes = keys.kencBytes;
  state.kauthBytes = keys.kauthBytes;
  state.kauthKey = keys.kauthKey;
  state.secretMarker = "secret.marker=1";

  await metaSet("houseId", houseId);
  await metaSet("krootB64", bytesToB64(kroot));
  await metaSet("secretMarker", state.secretMarker);

  await ensureWorkspaceFiles();
  await ensureSessionFiles();
  await persistTranscript();

  updateGatewayState();
  log(`house created ${houseId}`);
}

async function recoverHouse() {
  const address = await walletConnect();
  const nonceResp = await apiJson("/api/wallet/nonce");
  const nonce = nonceResp?.nonce;
  if (!nonce) throw new Error("NONCE_FAILED");
  const lookupMsg = ["ElizaTown House Lookup", `address: ${address}`, `nonce: ${nonce}`].join("\n");
  const lookupSig = await walletSignMessage(lookupMsg);
  const lookup = await apiJson("/api/wallet/lookup", {
    method: "POST",
    body: JSON.stringify({
      address,
      nonce,
      signature: bytesToB64(lookupSig.signatureBytes),
    }),
  });

  const houseId = typeof lookup?.houseId === "string" ? lookup.houseId.trim() : "";
  if (!houseId) throw new Error("HOUSE_NOT_FOUND");

  const keyWrap = lookup?.keyWrap || null;
  if (!keyWrap || keyWrap.alg !== "AES-GCM" || typeof keyWrap.iv !== "string" || typeof keyWrap.ct !== "string") {
    throw new Error("MISSING_KEY_WRAP");
  }

  async function decryptWithMessage(msg) {
    const sig = await walletSignMessage(msg);
    const wrapKeyBytes = await sha256(sig.signatureBytes);
    return await aesGcmDecryptRaw(wrapKeyBytes, b64ToBytes(keyWrap.iv), b64ToBytes(keyWrap.ct));
  }

  const attempts = [];
  attempts.push(buildHouseKeyWrapMessage({ houseId })); // legacy (no origin)
  const origin = safeOrigin();
  if (origin) {
    attempts.push(buildHouseKeyWrapMessage({ houseId, origin }));
    const u = new URL(origin);
    const portSuffix = u.port ? `:${u.port}` : "";
    if (u.hostname === "localhost") {
      attempts.push(buildHouseKeyWrapMessage({ houseId, origin: `${u.protocol}//127.0.0.1${portSuffix}` }));
    } else if (u.hostname === "127.0.0.1") {
      attempts.push(buildHouseKeyWrapMessage({ houseId, origin: `${u.protocol}//localhost${portSuffix}` }));
    }
  }

  let kroot = null;
  let lastErr = null;
  for (const msg of attempts) {
    try {
      kroot = await decryptWithMessage(msg);
      break;
    } catch (e) {
      lastErr = e;
    }
  }
  if (!kroot) throw new Error(lastErr?.message || "KEY_WRAP_DECRYPT_FAILED");

  const derivedHouseId = base58Encode(await sha256(kroot));
  if (derivedHouseId !== houseId) throw new Error("HOUSE_ID_MISMATCH");

  const keys = await deriveHouseKeysFromKroot(kroot);
  state.houseId = houseId;
  state.krootBytes = kroot;
  state.kencBytes = keys.kencBytes;
  state.kauthBytes = keys.kauthBytes;
  state.kauthKey = keys.kauthKey;

  await metaSet("houseId", houseId);
  await metaSet("krootB64", bytesToB64(kroot));

  updateGatewayState();
  log(`house recovered ${houseId}`);
}

async function appendE2eeEntry(text, opts = {}) {
  if (!state.houseId || !state.krootBytes || !state.kencBytes) throw new Error("HOUSE_NOT_READY");
  const requireApproval = opts?.requireApproval !== false;
  const author = typeof opts?.author === "string" && opts.author.trim()
    ? opts.author.trim()
    : "lite";
  if (requireApproval) {
    const decision = await requestApproval({ title: "Approval", body: "Append entry" });
    if (decision !== "approve") {
      log("append rejected");
      return null;
    }
  }

  const payload = {
    v: 1,
    id: randomId("e"),
    ts: nowMs(),
    author,
    type: "note",
    body: { text: String(text || "") },
  };
  const pt = utf8ToBytes(JSON.stringify(payload));
  const aad = utf8ToBytes(`house=${state.houseId}`);
  const enc = await aesGcmEncryptRaw(state.kencBytes, pt, aad);
  const ciphertext = { alg: "AES-GCM", iv: bytesToB64(enc.iv), ct: bytesToB64(enc.ct) };

  const urlPath = `/api/house/${encodeURIComponent(state.houseId)}/append`;
  const body = JSON.stringify({ ciphertext, author });
  const headers = await houseAuthHeaders({ houseId: state.houseId, method: "POST", urlPath, body });
  await apiJson(urlPath, { method: "POST", body, headers });
  log("append ok");
  return { houseId: state.houseId, entryId: payload.id, author };
}

// --- State ---
const state = {
  houseId: null,
  teamCodeHint: null,
  krootBytes: null,
  kencBytes: null,
  kauthBytes: null,
  kauthKey: null,
  vaultLatestBackupId: null,
  secretMarker: null,
  sessionId: null,
  transcript: [],
  llmApi: null,
  llmProvider: null,
  llmModelRef: null,
  llmModelId: null,
  llmBaseUrl: null,
  llmReasoning: null,
  llmUseProxy: true,
  llmApiKey: null,
  lastLlmInput: null,
  secretStore: {},
  agentTownCeremonyByTeam: {},
  originGrants: [],
  httpRateLimit: new Map(),
  wsSessions: new Map(),
  workspaceDirs: new Set(["workspace/"]),
  workspaceEvents: [],
  permissionPolicy: permissionPolicyDefault(),
  trainer: {
    activeCapture: null,
    activeLoadoutByQuest: {},
    coaching: {
      enabled: false,
      mode: "approve",
    },
  },
  skillImport: {
    status: "idle",
    sourceUrl: null,
    siteRoot: null,
    activeSkillPath: null,
    lastImportedAtMs: null,
    lastError: null,
    lastRunAtMs: null,
    lastRunMode: null,
    lastRunOk: null,
    lastRunErrorCode: null,
    lastRunErrorMessage: null,
    lastRunDurationMs: null,
    importedPaths: [],
    importedFiles: [],
  },
};

async function persistSkillImportState() {
  await metaSet("skillImportV1", skillImportSnapshot({ importedPathLimit: 500 }));
}

async function loadStateFromIdb() {
  state.houseId = (await metaGet("houseId")) || null;
  state.teamCodeHint = normalizeTeamCodeHint(await metaGet("teamCodeHint")) || null;
  state.vaultLatestBackupId = (await metaGet("vaultLatestBackupId")) || null;
  state.secretMarker = (await metaGet("secretMarker")) || null;
  state.sessionId = (await metaGet("sessionId")) || null;

  state.llmApi = (await metaGet("llmApi")) || null;
  state.llmProvider = (await metaGet("llmProvider")) || null;
  state.llmModelRef = (await metaGet("llmModelRef")) || null;
  state.llmModelId = (await metaGet("llmModelId")) || null;
  state.llmBaseUrl = (await metaGet("llmBaseUrl")) || null;
  state.llmReasoning = normalizeReasoningLevel(await metaGet("llmReasoning"));
  const llmUseProxyStored = await metaGet("llmUseProxy");
  state.llmUseProxy = llmUseProxyStored === false ? false : true;
  state.llmApiKey = (await metaGet("llmApiKey")) || null;
  const secretStoreRaw = (await metaGet("secretStoreV1")) || {};
  state.secretStore = {};
  if (secretStoreRaw && typeof secretStoreRaw === "object" && !Array.isArray(secretStoreRaw)) {
    for (const [k, v] of Object.entries(secretStoreRaw)) {
      if (!isValidSecretName(k)) continue;
      if (typeof v !== "string" || !v) continue;
      state.secretStore[k] = v;
    }
  }

  state.trainer.activeLoadoutByQuest = {};
  state.trainer.activeLoadoutByQuest[TRAINER_DEFAULT_QUEST_ID] =
    (await trainerGetActiveLoadoutId(TRAINER_DEFAULT_QUEST_ID)) || null;
  state.trainer.coaching = trainerNormalizeCoachingState(await metaGet(TRAINER_COACHING_META_KEY));
  state.trainer.activeCapture = null;

  state.workspaceDirs = new Set(["workspace/"]);
  const workspaceDirsRaw = (await metaGet("workspaceDirsV1")) || [];
  if (Array.isArray(workspaceDirsRaw)) {
    for (const entry of workspaceDirsRaw) {
      if (typeof entry !== "string") continue;
      try {
        const dir = normalizeWorkspacePath(entry, { allowDirectory: true });
        state.workspaceDirs.add(dir);
      } catch {
        // ignore invalid historical entries
      }
    }
  }

  const krootB64 = (await metaGet("krootB64")) || null;
  if (typeof krootB64 === "string" && krootB64) {
    try {
      const kroot = b64ToBytes(krootB64);
      const keys = await deriveHouseKeysFromKroot(kroot);
      state.krootBytes = kroot;
      state.kencBytes = keys.kencBytes;
      state.kauthBytes = keys.kauthBytes;
      state.kauthKey = keys.kauthKey;
    } catch {
      state.krootBytes = null;
      state.kencBytes = null;
      state.kauthBytes = null;
      state.kauthKey = null;
      log("invalid krootB64 ignored during boot");
    }
  }

  const skillImportRaw = (await metaGet("skillImportV1")) || null;
  if (skillImportRaw && typeof skillImportRaw === "object") {
    state.skillImport.status = normalizeSkillImportStatus(skillImportRaw.status);
    state.skillImport.sourceUrl =
      typeof skillImportRaw.sourceUrl === "string" && skillImportRaw.sourceUrl
        ? skillImportRaw.sourceUrl
        : null;
    state.skillImport.siteRoot =
      typeof skillImportRaw.siteRoot === "string" && skillImportRaw.siteRoot.startsWith("workspace/skills/")
        ? skillImportRaw.siteRoot
        : null;
    state.skillImport.activeSkillPath =
      typeof skillImportRaw.activeSkillPath === "string" && skillImportRaw.activeSkillPath.startsWith("workspace/")
        ? skillImportRaw.activeSkillPath
        : null;
    state.skillImport.lastImportedAtMs = Number.isFinite(Number(skillImportRaw.lastImportedAtMs))
      ? Number(skillImportRaw.lastImportedAtMs)
      : null;
    state.skillImport.lastError =
      typeof skillImportRaw.lastError === "string" && skillImportRaw.lastError
        ? skillImportRaw.lastError
        : null;
    state.skillImport.lastRunAtMs = Number.isFinite(Number(skillImportRaw.lastRunAtMs))
      ? Number(skillImportRaw.lastRunAtMs)
      : null;
    state.skillImport.lastRunMode = normalizeSkillRunMode(skillImportRaw.lastRunMode);
    state.skillImport.lastRunOk =
      typeof skillImportRaw.lastRunOk === "boolean" ? skillImportRaw.lastRunOk : null;
    state.skillImport.lastRunErrorCode =
      typeof skillImportRaw.lastRunErrorCode === "string" && skillImportRaw.lastRunErrorCode
        ? skillImportRaw.lastRunErrorCode
        : null;
    state.skillImport.lastRunErrorMessage =
      typeof skillImportRaw.lastRunErrorMessage === "string" && skillImportRaw.lastRunErrorMessage
        ? skillImportRaw.lastRunErrorMessage
        : null;
    state.skillImport.lastRunDurationMs = Number.isFinite(Number(skillImportRaw.lastRunDurationMs))
      ? Number(skillImportRaw.lastRunDurationMs)
      : null;
    const importedFiles = normalizeSkillImportFiles(skillImportRaw.importedFiles, { limit: 500 });
    const importedPaths = normalizeSkillImportPaths(skillImportRaw.importedPaths, { limit: 500 });
    if (importedFiles.length > 0) {
      state.skillImport.importedFiles = importedFiles;
      state.skillImport.importedPaths = importedFiles.map((entry) => entry.path).slice(0, 500);
    } else {
      state.skillImport.importedPaths = importedPaths;
      state.skillImport.importedFiles = normalizeSkillImportFiles(
        importedPaths.map((path) => ({ path })),
        { limit: 500 },
      );
    }
  }

  const permissionPolicyRaw = await metaGet(PERMISSION_POLICY_META_KEY);
  if (isPlainObject(permissionPolicyRaw)) {
    const mode = String(permissionPolicyRaw.mode || "legacy-allow").trim();
    if (mode === "manifest-enforced") {
      const permissions = [];
      for (const entry of Array.isArray(permissionPolicyRaw.permissions) ? permissionPolicyRaw.permissions : []) {
        const normalized = normalizePermissionEntry(entry);
        if (!normalized) continue;
        permissions.push(normalized);
      }
      setPermissionPolicy({
        mode: "manifest-enforced",
        source: isPlainObject(permissionPolicyRaw.source) ? permissionPolicyRaw.source : null,
        manifest: isPlainObject(permissionPolicyRaw.manifest) ? permissionPolicyRaw.manifest : null,
        permissions,
        originsByPermission: permissionPolicyOriginsByPermission(permissions),
        risk: isPlainObject(permissionPolicyRaw.risk) ? permissionPolicyRaw.risk : { level: "unknown", rationale: "" },
        lastError:
          typeof permissionPolicyRaw.lastError === "string" && permissionPolicyRaw.lastError
            ? permissionPolicyRaw.lastError
            : null,
      });
    } else {
      setPermissionPolicy(permissionPolicyDefault());
    }
  } else {
    setPermissionPolicy(permissionPolicyDefault());
  }

  await ensureWorkspaceFiles();
  await ensureSessionFiles();

  // Hydrate transcript from VFS.
  if (state.sessionId) {
    const transcriptPath = `.openclaw/agents/${MAIN_AGENT_ID}/sessions/${state.sessionId}.jsonl`;
    const raw = await vfsGetUtf8(transcriptPath);
    if (raw) {
      const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const parsed = [];
      for (const line of lines) {
        try {
          parsed.push(JSON.parse(line));
        } catch {
          // ignore malformed
        }
      }
      state.transcript = parsed;
    }
  }

  post({ type: "worker.workspace.events", events: state.workspaceEvents.slice(0, 100) });
}

async function boot() {
  await loadStateFromIdb();
  updateGatewayState();
  post({ type: "worker.runtime.ready" });
  post({ type: "worker.runtime.status", status: "ready" });

  if (!state.transcript.length) {
    const m = makeAssistant("openclaw-lite boot");
    state.transcript.push(m);
    post({ type: "worker.chat.append", role: "assistant", text: "openclaw-lite boot" });
    await persistTranscript();
  }
}

const bootReady = boot();

self.addEventListener("message", async (ev) => {
  const msg = ev.data;
  if (!msg || typeof msg.type !== "string") return;

  try {
    if (msg.type === "gateway.boot") {
      // no-op; boot is implicit
      return;
    }

    await bootReady;

    if (msg.type === "gateway.wallet.response") {
      resolveWalletResponse(msg);
      return;
    }

    if (msg.type === "gateway.ui.intent.response") {
      resolveUiIntentResponse(msg);
      return;
    }

    if (msg.type === "gateway.approval.respond") {
      resolveApproval(String(msg.id || ""), String(msg.decision || ""));
      return;
    }

    if (msg.type === "gateway.chat.send") {
      const text = String(msg.text || "");
      const extraSections = [];
      const preflight = await preflightChatSkillImports(text);
      if (preflight.imported.length > 0) {
        const importedLines = preflight.imported.map((entry) => {
          const source = entry.sourceUrl || entry.url;
          const skillPath = entry.activeSkillPath ? ` -> ${entry.activeSkillPath}` : "";
          return `- imported ${source}${skillPath}`;
        });
        extraSections.push(`Skill import preflight (already completed):\n${importedLines.join("\n")}`);
      } else if (preflight.failed.length > 0) {
        const failedLines = preflight.failed.map((entry) => `- failed ${entry.url} (${entry.code})`);
        extraSections.push(`Skill import preflight errors:\n${failedLines.join("\n")}`);
      }
      const runtimeSnapshot = await resolveRuntimeSnapshotFromInput({
        runtimeContext: msg?.runtimeContext || null,
        runtimeState: msg?.runtimeState || null,
      });
      const runtimeSections = buildRuntimeContextSections(runtimeSnapshot);
      const hintedTeamCode = normalizeTeamCodeHint(runtimeSnapshot?.context?.teamCode || runtimeSnapshot?.appState?.teamCode);
      if (hintedTeamCode && hintedTeamCode !== state.teamCodeHint) {
        state.teamCodeHint = hintedTeamCode;
        metaSet("teamCodeHint", hintedTeamCode).catch(() => {
          // Non-fatal; hint is best-effort.
        });
      }
      if (runtimeSections.contextSections.length > 0) {
        extraSections.push(...runtimeSections.contextSections);
      }
      const extraContext = extraSections.join("\n\n");
      const promptText = extraContext ? `${text}\n\n${extraContext}` : text;
      recordLastLlmInputDebug({
        source: "gateway.chat.send",
        userText: text,
        displayUserText: text,
        promptText,
        extraContext,
        extraContextSections: extraSections,
        runtimeContext: runtimeSections.runtimeContext,
        runtimeAppState: runtimeSections.runtimeAppStateSummary,
        runtimeContextPrompt: runtimeSections.runtimeContextPrompt,
        runtimeExperiencePrompt: runtimeSections.runtimeExperiencePrompt,
        activeSkillPrompt: runtimeSections.activeSkillPrompt,
        coopChatPrompt: runtimeSections.coopChatPrompt,
      });
      await runAgentTurn(text, {
        displayUserText: text,
        extraContext,
      });
      await writeCheckpoint("observation");

      if (text.startsWith("append:")) {
        const body = text.slice("append:".length).trim();
        if (body) await appendE2eeEntry(body);
      }
      return;
    }

    if (msg.type === "gateway.event.pagehide") {
      await writeCheckpoint("pagehide");
      return;
    }

    if (msg.type === "gateway.event.visibilitychange") {
      const st = String(msg.state || "");
      if (st === "hidden") {
        // Mirror pagehide behavior for browsers that don't reliably fire pagehide.
        await writeCheckpoint("pagehide");
      }
      return;
    }

    if (msg.type === "gateway.command.createHouse") {
      await createHouse({ rhB64: String(msg.rhB64 || "") });
      return;
    }

    if (msg.type === "gateway.command.recoverHouse") {
      await recoverHouse();
      return;
    }

    if (msg.type === "gateway.command.backupVault") {
      await lockAndBackupVault();
      return;
    }

    if (msg.type === "gateway.command.restoreVault") {
      await restoreFromLatestVault();
      return;
    }

    if (msg.type === "gateway.command.publishProfile") {
      await publishProfile({ housePublicJson: msg.housePublicJson || null, promptMd: msg.promptMd || "" });
      return;
    }

    if (msg.type === "gateway.command.freezeNow") {
      await writeCheckpoint("manual");
      log("freeze ok");
      return;
    }

    if (msg.type === "gateway.command.setLlmConfig") {
      const apiKey = typeof msg.apiKey === "string" ? msg.apiKey.trim() : "";
      const api = typeof msg.api === "string" ? msg.api.trim() : "";
      const provider = typeof msg.provider === "string" ? msg.provider.trim() : "";
      const modelRef = typeof msg.modelRef === "string" ? msg.modelRef.trim() : "";
      const modelId = typeof msg.modelId === "string" ? msg.modelId.trim() : "";
      const baseUrl = typeof msg.baseUrl === "string" ? msg.baseUrl.trim() : "";
      const reasoning = normalizeReasoningLevel(msg.reasoning);
      const useProxy = msg.useProxy !== false;

      state.llmApiKey = apiKey || null;
      state.llmApi = api || null;
      state.llmProvider = provider || null;
      state.llmModelRef = modelRef || null;
      state.llmModelId = modelId || null;
      state.llmBaseUrl = baseUrl || null;
      state.llmReasoning = reasoning;
      state.llmUseProxy = useProxy;

      await metaSet("llmApiKey", state.llmApiKey);
      await metaSet("llmApi", state.llmApi);
      await metaSet("llmProvider", state.llmProvider);
      await metaSet("llmModelRef", state.llmModelRef);
      await metaSet("llmModelId", state.llmModelId);
      await metaSet("llmBaseUrl", state.llmBaseUrl);
      await metaSet("llmReasoning", state.llmReasoning);
      await metaSet("llmUseProxy", state.llmUseProxy);
      trainerCheckpointForConfigChange("llm-config").catch(() => {});

      log(
        `llm configured api=${state.llmApi || "default"} provider=${state.llmProvider || "default"} model=${state.llmModelRef || state.llmModelId || "default"
        } proxy=${state.llmUseProxy ? "1" : "0"} thinking=${state.llmReasoning || "default"}`,
      );
      if (msg.requestId) {
        post({
          type: "worker.llm.config.set",
          requestId: String(msg.requestId || ""),
          ok: true,
          result: makeToolSuccess({
            api: state.llmApi || null,
            provider: state.llmProvider || null,
            modelRef: state.llmModelRef || null,
            modelId: state.llmModelId || null,
            baseUrl: state.llmBaseUrl || null,
            reasoning: state.llmReasoning || null,
            useProxy: state.llmUseProxy !== false,
          }),
        });
      }
      return;
    }

    if (msg.type === "gateway.command.exportZip") {
      await exportZip();
      return;
    }

    if (msg.type === "gateway.command.visit") {
      const result = await runVisitImport({ url: msg.url || msg?.params?.url || "" }, "visit_import");
      post({
        type: "worker.visit",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.tools.registry") {
      post({
        type: "worker.tools.registry",
        requestId: String(msg.requestId || ""),
        ok: true,
        info: getToolRegistryInfo(),
      });
      return;
    }

    if (msg.type === "gateway.command.tools.smoke") {
      const summary = await runSyntheticToolSmoke(Number(msg.count || 5));
      post({
        type: "worker.tools.smoke",
        requestId: String(msg.requestId || ""),
        ok: true,
        summary,
      });
      return;
    }

    if (msg.type === "gateway.command.tools.transcriptStats") {
      const stats = computeTranscriptToolStats(state.transcript);
      post({
        type: "worker.tools.transcriptStats",
        requestId: String(msg.requestId || ""),
        ok: true,
        stats,
      });
      return;
    }

    if (msg.type === "gateway.command.tools.webFetch") {
      const toolName = msg.toolName === "skill_fetch" ? "skill_fetch" : "web_fetch";
      const result = await runWebFetch(msg.params || {}, toolName);
      post({
        type: "worker.tools.webFetch",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.tools.httpRequest") {
      const result = await runHttpRequest(msg.params || {}, "http_request");
      post({
        type: "worker.tools.httpRequest",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.tools.agentTownCeremonyCommit") {
      const result = await runAgentTownCeremonyCommit(msg.params || {}, "agent_town_ceremony_commit");
      post({
        type: "worker.tools.agentTownCeremonyCommit",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.tools.agentTownCeremonyReveal") {
      const result = await runAgentTownCeremonyReveal(msg.params || {}, "agent_town_ceremony_reveal");
      post({
        type: "worker.tools.agentTownCeremonyReveal",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.secrets.set") {
      const result = await runSecretSet(msg.params || {}, "secret_set");
      post({
        type: "worker.secrets.set",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.secrets.list") {
      const result = runSecretList(msg.params || {}, "secret_list");
      post({
        type: "worker.secrets.list",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.secrets.delete") {
      const result = await runSecretDelete(msg.params || {}, "secret_delete");
      post({
        type: "worker.secrets.delete",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.tools.transcriptDump") {
      post({
        type: "worker.tools.transcriptDump",
        requestId: String(msg.requestId || ""),
        ok: true,
        dump: JSON.stringify(state.transcript || []),
      });
      return;
    }

    if (msg.type === "gateway.command.tools.transcriptReset") {
      const params = msg.params && typeof msg.params === "object" ? msg.params : {};
      const keepBootMessage = params.keepBootMessage === true;
      const rotateSession = params.rotateSession === true;
      const previousLength = Array.isArray(state.transcript) ? state.transcript.length : 0;
      const previousSessionId = state.sessionId || null;
      let archivedTranscript = null;

      if (rotateSession && previousSessionId) {
        archivedTranscript = await archiveSessionTranscriptForDigest(previousSessionId, "new-session");
      }

      state.transcript = [];
      if (rotateSession) {
        state.sessionId = randomId("sess");
        await metaSet("sessionId", state.sessionId);
      }

      if (keepBootMessage) {
        state.transcript.push(makeAssistant("openclaw-lite boot"));
      }

      await persistTranscript();
      post({
        type: "worker.tools.transcriptReset",
        requestId: String(msg.requestId || ""),
        ok: true,
        result: {
          previousLength,
          currentLength: state.transcript.length,
          previousSessionId,
          sessionId: state.sessionId || null,
          rotatedSession: rotateSession,
          keptBootMessage: keepBootMessage,
          archivedTranscriptPath: archivedTranscript?.archivedPath || null,
          archivedTranscriptSourcePath: archivedTranscript?.sourcePath || null,
          queuedForMemoryDigest: archivedTranscript?.ok === true,
          memoryDigestQueueLength:
            Number.isFinite(Number(archivedTranscript?.queueLength)) ? Number(archivedTranscript.queueLength) : null,
          memoryDigestQueueEntryId: archivedTranscript?.queueEntry?.id || null,
          archiveStatus: archivedTranscript?.reason || null,
        },
      });
      return;
    }

    if (msg.type === "gateway.command.tools.transcriptDigestQueue") {
      const queue = await readTranscriptDigestQueue();
      post({
        type: "worker.tools.transcriptDigestQueue",
        requestId: String(msg.requestId || ""),
        ok: true,
        queue,
      });
      return;
    }

    if (msg.type === "gateway.command.tools.ws.open") {
      const result = await runWsOpen(msg.params || {}, "ws_open");
      post({
        type: "worker.tools.ws.open",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.tools.ws.send") {
      const result = runWsSend(msg.params || {}, "ws_send");
      post({
        type: "worker.tools.ws.send",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.tools.ws.recv") {
      const result = await runWsRecv(msg.params || {}, "ws_recv");
      post({
        type: "worker.tools.ws.recv",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.tools.ws.close") {
      const result = runWsClose(msg.params || {}, "ws_close");
      post({
        type: "worker.tools.ws.close",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.tools.ws.status") {
      const result = runWsStatus(msg.params || {}, "ws_status");
      post({
        type: "worker.tools.ws.status",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.workspace.mkdir") {
      const result = await runWorkspaceMkdir(msg.params || {}, "workspace_mkdir");
      post({
        type: "worker.workspace.mkdir",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.workspace.list") {
      const result = await runWorkspaceList(msg.params || {}, "workspace_list");
      post({
        type: "worker.workspace.list",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.workspace.readFile") {
      const result = await runWorkspaceReadFile(msg.params || {}, "workspace_read_file");
      post({
        type: "worker.workspace.readFile",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.workspace.writeFile") {
      const result = await runWorkspaceWriteFile(msg.params || {}, "workspace_write_file");
      post({
        type: "worker.workspace.writeFile",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.workspace.editFile") {
      const result = await runWorkspaceEditFile(msg.params || {}, "workspace_edit_file");
      post({
        type: "worker.workspace.editFile",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.workspace.delete") {
      const result = await runWorkspaceDelete(msg.params || {}, "workspace_delete");
      post({
        type: "worker.workspace.delete",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.workspace.bootstrap") {
      const result = await runWorkspaceBootstrap("workspace_bootstrap");
      post({
        type: "worker.workspace.bootstrap",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.workspace.events") {
      const result = runWorkspaceEvents("workspace_events");
      post({
        type: "worker.workspace.events",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.tools.wallet.connect") {
      const result = await runWalletConnectTool(msg.params || {}, "wallet_connect");
      post({
        type: "worker.tools.wallet.connect",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.tools.wallet.accounts") {
      const result = await runWalletGetAccountsTool(msg.params || {}, "wallet_get_accounts");
      post({
        type: "worker.tools.wallet.accounts",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.tools.wallet.signMessage") {
      const result = await runWalletSignMessageTool(msg.params || {}, "wallet_sign_message");
      post({
        type: "worker.tools.wallet.signMessage",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.tools.wallet.sendTransaction") {
      const result = await runWalletSendTransactionTool(msg.params || {}, "wallet_send_transaction");
      post({
        type: "worker.tools.wallet.sendTransaction",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.runtime.sessionContext") {
      const params = msg.params && typeof msg.params === "object" ? msg.params : {};
      const runtimeSnapshot = await resolveRuntimeSnapshotFromInput({
        runtimeContext: params.runtimeContext || null,
        runtimeState: params.runtimeState || null,
      });
      const runtimeSections = buildRuntimeContextSections(runtimeSnapshot);
      post({
        type: "worker.runtime.sessionContext",
        requestId: String(msg.requestId || ""),
        ok: true,
        result: makeToolSuccess({
          sessionId: state.sessionId || null,
          generatedAtMs: nowMs(),
          runtimeContext: runtimeSections.runtimeContext,
          runtimeAppState: runtimeSections.runtimeAppStateSummary,
          runtimeContextPrompt: runtimeSections.runtimeContextPrompt || null,
          runtimeExperiencePrompt: runtimeSections.runtimeExperiencePrompt || null,
          activeSkillPrompt: runtimeSections.activeSkillPrompt || null,
          coopChatPrompt: runtimeSections.coopChatPrompt || null,
          contextSections: runtimeSections.contextSections,
          combinedContext: runtimeSections.combinedContext || "",
          lastLlmInput: state.lastLlmInput || null,
          permissionPolicy: permissionPolicySnapshot(),
        }),
      });
      return;
    }

    if (msg.type === "gateway.command.runtime.keyMaterialStatus") {
      post({
        type: "worker.runtime.keyMaterialStatus",
        requestId: String(msg.requestId || ""),
        ok: true,
        result: {
          ok: true,
          data: {
            hasKroot: !!(state.krootBytes && state.krootBytes.length > 0),
            hasKenc: !!(state.kencBytes && state.kencBytes.length > 0),
            hasKauth: !!(state.kauthBytes && state.kauthBytes.length > 0),
            houseId: state.houseId || null,
          },
        },
      });
      return;
    }

    if (msg.type === "gateway.command.skill.state") {
      const skillState = skillImportSnapshot({ importedPathLimit: 500 });
      post({
        type: "worker.skill.state",
        requestId: String(msg.requestId || ""),
        ok: true,
        result: makeToolSuccess({
          ...skillState,
          permissionPolicy: permissionPolicySnapshot(),
        }),
      });
      return;
    }

    if (msg.type === "gateway.command.permission.policy.get") {
      post({
        type: "worker.permission.policy.get",
        requestId: String(msg.requestId || ""),
        ok: true,
        result: makeToolSuccess(permissionPolicySnapshot()),
      });
      return;
    }

    if (msg.type === "gateway.command.permission.policy.clear") {
      await clearPermissionPolicyToLegacy(null);
      post({
        type: "worker.permission.policy.clear",
        requestId: String(msg.requestId || ""),
        ok: true,
        result: makeToolSuccess({
          cleared: true,
          policy: permissionPolicySnapshot(),
        }),
      });
      return;
    }

    if (msg.type === "gateway.command.permission.policy.set") {
      const source = isPlainObject(msg.source)
        ? msg.source
        : {
          kind: "manual",
          loadedAtMs: nowMs(),
        };
      let result;
      if (isPlainObject(msg.manifest)) {
        const applied = await applyManifestPermissionPolicy({ manifest: msg.manifest, source });
        result = makeToolSuccess({
          applied: applied.ok === true,
          error: applied.ok === true ? null : applied.error || "INVALID_PERMISSION_MANIFEST",
          policy: permissionPolicySnapshot(),
        });
      } else {
        await clearPermissionPolicyToLegacy(null);
        result = makeToolSuccess({
          applied: false,
          error: null,
          policy: permissionPolicySnapshot(),
        });
      }
      post({
        type: "worker.permission.policy.set",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.systemPrompt.preview") {
      const model = getConfiguredModel();
      const tools = getLiteTools();
      const preview = await buildLitePromptPreview({ model, tools });
      post({
        type: "worker.systemPrompt.preview",
        requestId: String(msg.requestId || ""),
        ok: true,
        result: makeToolSuccess({
          systemPrompt: preview.systemPrompt,
          skillsPrompt: preview.skillsPrompt,
          contextFiles: preview.contextFiles,
          contextFilePaths: preview.contextFilePaths,
          usedFiles: preview.usedFiles,
          truncatedFiles: preview.truncatedFiles,
        }),
      });
      return;
    }

    if (msg.type === "gateway.command.webmcp.discover") {
      const result = await runWebMcpDiscover(msg.params || {}, "webmcp_discover");
      post({
        type: "worker.webmcp.discover",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.webmcp.call") {
      const result = await runWebMcpCall(msg.params || {}, "webmcp_call");
      post({
        type: "worker.webmcp.call",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.experience.run") {
      const result = await runExperienceEngineBaseline(msg.params || {}, "experience_engine_run");
      post({
        type: "worker.experience.run",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.trainer.attempts.list") {
      const params = isPlainObject(msg.params) ? msg.params : {};
      const questId = trainerQuestId(params.questId || TRAINER_DEFAULT_QUEST_ID);
      const attempts = await trainerListAttemptManifests(questId);
      post({
        type: "worker.trainer.attempts.list",
        requestId: String(msg.requestId || ""),
        ok: true,
        result: makeToolSuccess({ questId, attempts }),
      });
      return;
    }

    if (msg.type === "gateway.command.trainer.attempt.get") {
      const params = isPlainObject(msg.params) ? msg.params : {};
      let result;
      try {
        const bundle = await trainerReadAttemptBundle({
          questId: trainerQuestId(params.questId || TRAINER_DEFAULT_QUEST_ID),
          attemptId: params.attemptId || "",
        });
        result = makeToolSuccess(bundle);
      } catch (err) {
        result = makeToolFailure("NOT_FOUND", err?.message || "ATTEMPT_NOT_FOUND");
      }
      post({
        type: "worker.trainer.attempt.get",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.trainer.compare") {
      const params = isPlainObject(msg.params) ? msg.params : {};
      const result = makeToolSuccess(await trainerCompareAttempts({
        questId: trainerQuestId(params.questId || TRAINER_DEFAULT_QUEST_ID),
        limit: params.limit,
      }));
      post({
        type: "worker.trainer.compare",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.trainer.loadouts.list") {
      const params = isPlainObject(msg.params) ? msg.params : {};
      const questId = trainerQuestId(params.questId || TRAINER_DEFAULT_QUEST_ID);
      const result = makeToolSuccess(await trainerListLoadoutManifests(questId));
      post({
        type: "worker.trainer.loadouts.list",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.trainer.loadouts.activate") {
      const params = isPlainObject(msg.params) ? msg.params : {};
      const questId = trainerQuestId(params.questId || TRAINER_DEFAULT_QUEST_ID);
      const loadoutId = typeof params.loadoutId === "string" ? params.loadoutId.trim() : "";
      let result;
      if (!loadoutId) {
        result = makeToolFailure("INVALID_ARGUMENTS", "Missing loadoutId");
      } else {
        const manifestPath = `${trainerLoadoutRoot(questId, loadoutId)}/manifest.json`;
        const manifest = trainerParseJsonSafe(await vfsGetUtf8(manifestPath), null);
        if (!isPlainObject(manifest)) {
          result = makeToolFailure("NOT_FOUND", "Loadout not found");
        } else {
          await trainerSetActiveLoadoutId(questId, loadoutId);
          result = makeToolSuccess({ questId, loadoutId });
        }
      }
      post({
        type: "worker.trainer.loadouts.activate",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.trainer.coaching.get") {
      post({
        type: "worker.trainer.coaching.get",
        requestId: String(msg.requestId || ""),
        ok: true,
        result: makeToolSuccess(trainerNormalizeCoachingState(state.trainer.coaching)),
      });
      return;
    }

    if (msg.type === "gateway.command.trainer.coaching.set") {
      const params = isPlainObject(msg.params) ? msg.params : {};
      state.trainer.coaching = trainerNormalizeCoachingState({
        enabled: params.enabled === true,
        mode: params.mode,
      });
      await metaSet(TRAINER_COACHING_META_KEY, state.trainer.coaching);
      post({
        type: "worker.trainer.coaching.set",
        requestId: String(msg.requestId || ""),
        ok: true,
        result: makeToolSuccess(state.trainer.coaching),
      });
      return;
    }

    if (msg.type === "gateway.command.trainer.backup.export") {
      let result;
      try {
        result = makeToolSuccess(await trainerExportPersonalBackup());
      } catch (err) {
        result = makeToolFailure("UNSUPPORTED", err?.message || "BACKUP_EXPORT_FAILED");
      }
      post({
        type: "worker.trainer.backup.export",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.trainer.backup.import") {
      const params = isPlainObject(msg.params) ? msg.params : {};
      let result;
      try {
        result = makeToolSuccess(await trainerImportPersonalBackup(params.backup));
      } catch (err) {
        result = makeToolFailure("INVALID_BACKUP", err?.message || "BACKUP_IMPORT_FAILED");
      }
      post({
        type: "worker.trainer.backup.import",
        requestId: String(msg.requestId || ""),
        ok: true,
        result,
      });
      return;
    }

    if (msg.type === "gateway.command.origin.check") {
      try {
        const result = evaluateOriginAccess({
          url: String(msg.url || ""),
          capability: String(msg.capability || "web_fetch"),
          method: String(msg.method || "GET"),
          consume: msg.consume !== false,
        });
        post({
          type: "worker.origin.check",
          requestId: String(msg.requestId || ""),
          ok: true,
          result,
        });
      } catch (e) {
        post({
          type: "worker.origin.check",
          requestId: String(msg.requestId || ""),
          ok: false,
          error: e?.message || String(e || "ORIGIN_CHECK_FAILED"),
        });
      }
      return;
    }

    if (msg.type === "gateway.command.origin.grant") {
      try {
        const result = await requestOriginGrant({
          url: String(msg.url || ""),
          capability: String(msg.capability || "web_fetch"),
          scope: String(msg.scope || "once"),
          methods: Array.isArray(msg.methods) ? msg.methods : null,
        });
        post({
          type: "worker.origin.grant",
          requestId: String(msg.requestId || ""),
          ...result,
        });
      } catch (e) {
        post({
          type: "worker.origin.grant",
          requestId: String(msg.requestId || ""),
          ok: false,
          error: e?.message || String(e || "ORIGIN_GRANT_FAILED"),
        });
      }
      return;
    }

    if (msg.type === "gateway.command.origin.revoke") {
      const result = revokeOriginGrant(msg.grantId);
      post({
        type: "worker.origin.revoke",
        requestId: String(msg.requestId || ""),
        ...result,
      });
      return;
    }
  } catch (e) {
    log(`error: ${e.message || String(e)}`);
  }
});

bootReady.catch((e) => {
  log(`boot failed: ${e.message || String(e)}`);
});
