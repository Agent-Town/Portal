const FOREMAN_CONTEXT_VERSION = "founders-plot-foreman-context.v1";
const FOREMAN_SELECTION_TOOL_NAME = "founders_plot_foreman_select_candidate";
const RESOURCE_KEYS = ["wood", "stone", "food", "coin"];
const NOOP_CODES = new Set([
  "HEARTBEAT_OK",
  "NO_SAFE_CANDIDATE",
  "LOW_CONFIDENCE",
  "FOREMAN_CONTEXT_INCOMPLETE",
]);

function normalizeText(value = "") {
  return String(value || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

function collapseWhitespace(value = "") {
  return normalizeText(value).replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function trimExcerpt(value = "", maxChars = 640) {
  const normalized = collapseWhitespace(value);
  if (!normalized) return null;
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}

async function digestText(value = "") {
  const bytes = new TextEncoder().encode(String(value || ""));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function jsonClone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function normalizeToolSchema(value) {
  return value && typeof value === "object" ? jsonClone(value) : { type: "object", properties: {}, additionalProperties: false };
}

function providerSafeAliasFromCanonicalName(canonicalName = "") {
  const raw = String(canonicalName || "").trim().toLowerCase();
  if (!raw) return "";
  let alias = raw;
  if (alias.startsWith("et.plot.")) {
    alias = `founders_plot_${alias.slice("et.plot.".length)}`;
  } else if (alias.startsWith("et.foreman.")) {
    alias = `founders_plot_foreman_${alias.slice("et.foreman.".length)}`;
  } else {
    alias = `founders_plot_${alias}`;
  }
  return alias
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function buildFoundersPlotToolAliasRegistry(toolSpecs = []) {
  const aliasMap = {};
  const providerTools = [];
  const seenAliases = new Set();
  for (const rawSpec of Array.isArray(toolSpecs) ? toolSpecs : []) {
    const canonicalName = String(rawSpec?.name || "").trim();
    if (!canonicalName) continue;
    const alias = providerSafeAliasFromCanonicalName(canonicalName);
    if (!alias || seenAliases.has(alias)) continue;
    seenAliases.add(alias);
    aliasMap[alias] = canonicalName;
    providerTools.push({
      name: alias,
      canonicalName,
      description: String(rawSpec?.description || "").trim(),
      inputSchema: normalizeToolSchema(rawSpec?.inputSchema),
      resultSchema: rawSpec?.resultSchema ? normalizeToolSchema(rawSpec.resultSchema) : undefined,
      preconditions: Array.isArray(rawSpec?.preconditions)
        ? rawSpec.preconditions.map((entry) => String(entry || "").trim()).filter(Boolean)
        : [],
      errorCodes: Array.isArray(rawSpec?.errorCodes)
        ? rawSpec.errorCodes.map((entry) => String(entry || "").trim()).filter(Boolean)
        : [],
    });
  }
  return {
    aliasMap,
    providerTools,
  };
}

function formatToolGuide(providerTools = []) {
  const rows = [];
  for (const tool of Array.isArray(providerTools) ? providerTools : []) {
    const inputSchema = JSON.stringify(tool.inputSchema || {});
    const resultSchema = tool.resultSchema ? ` Result schema: ${JSON.stringify(tool.resultSchema)}.` : "";
    const errorCodes = Array.isArray(tool.errorCodes) && tool.errorCodes.length > 0
      ? ` Error codes: ${tool.errorCodes.join(", ")}.`
      : "";
    rows.push(
      `- ${tool.name}: ${tool.description} Canonical tool ${tool.canonicalName}. Input schema: ${inputSchema}.${resultSchema}${errorCodes}`
    );
  }
  return rows.join("\n");
}

function firstNeededContractResource(contract = null) {
  for (const resource of RESOURCE_KEYS) {
    if (Number(contract?.requirements?.resources?.[resource] || contract?.requirements?.[resource] || 0) > 0) {
      return resource;
    }
  }
  return "";
}

function humanResourceLabel(resource = "") {
  const normalized = String(resource || "").trim().toLowerCase();
  if (!normalized) return "supplies";
  return normalized;
}

function buildPlayerFacingLine(candidate = null, context = null) {
  const canonicalToolName = String(candidate?.canonicalToolName || candidate?.toolName || "").trim();
  const contract = context?.activeContract || null;
  if (canonicalToolName === "et.plot.collect_outputs") {
    const resource = firstNeededContractResource(contract);
    if (resource) {
      return `I collected ${humanResourceLabel(resource)} because the Contract Board needs ${humanResourceLabel(resource)}.`;
    }
    return "I collected ready goods because the town could use the supplies.";
  }
  if (canonicalToolName === "et.plot.queue_job") {
    return "I queued one safe job to keep the town moving.";
  }
  if (canonicalToolName === "et.plot.request_user_approval") {
    return "I stopped to ask before spending resources on a bigger move.";
  }
  if (candidate?.requiresApproval === true) {
    return "I held back and asked because this move needs your approval.";
  }
  return "I picked the safest useful step for the town.";
}

function buildNoopDecision(noopCode = "HEARTBEAT_OK", reason = "", playerFacingLine = "") {
  const normalizedNoopCode = NOOP_CODES.has(String(noopCode || "")) ? String(noopCode) : "HEARTBEAT_OK";
  return {
    selectedCandidateId: null,
    confidence: 1,
    reason: String(reason || "").trim() || "No safe Foreman action was needed.",
    playerFacingLine: String(playerFacingLine || "").trim() || "I stayed put because the town did not need a safe move right now.",
    noopCode: normalizedNoopCode,
  };
}

function buildPackFilesShape(files = {}) {
  return {
    skillMd: {
      text: String(files?.skill || ""),
      required: true,
    },
    heartbeatMd: {
      text: String(files?.heartbeat || ""),
      required: true,
    },
    toolsMd: {
      text: String(files?.tools || ""),
      required: true,
    },
    goalsMd: {
      text: String(files?.goals || ""),
      required: true,
    },
    safetyMd: {
      text: String(files?.safety || files?.penalty || ""),
      required: false,
    },
  };
}

async function buildPackFileEntries(files = {}) {
  const shape = buildPackFilesShape(files);
  const entries = {};
  const missingRequired = [];
  for (const [key, descriptor] of Object.entries(shape)) {
    const text = normalizeText(descriptor.text);
    const present = text.length > 0;
    if (!present && descriptor.required) missingRequired.push(key);
    entries[key] = {
      present,
      hash: present ? await digestText(text) : null,
      excerpt: present ? trimExcerpt(text, key === "toolsMd" ? 1200 : 680) : null,
    };
  }
  return { entries, missingRequired };
}

function enrichSafeCandidates(safeCandidates = [], aliasMap = {}) {
  return (Array.isArray(safeCandidates) ? safeCandidates : []).map((candidate) => {
    const canonicalToolName = String(candidate?.toolName || "").trim();
    const providerSafeToolName = providerSafeAliasFromCanonicalName(canonicalToolName);
    return {
      ...jsonClone(candidate),
      canonicalToolName,
      providerSafeToolName,
      providerSafeToolKnown: aliasMap[providerSafeToolName] === canonicalToolName,
    };
  });
}

function summarizeRecentEvents(events = []) {
  return (Array.isArray(events) ? events : []).slice(-8).map((event) => ({
    eventId: event?.eventId || event?.seq || null,
    seq: event?.seq || null,
    type: String(event?.type || ""),
    summary: String(event?.summary || event?.recapLine || event?.explanation || "").trim(),
    createdAt: Number(event?.createdAt || event?.atMs || 0) || 0,
  }));
}

async function buildFoundersPlotForemanContext({
  plotId = "",
  foremanId = "clover",
  runtimeId = "",
  packFiles = {},
  toolRegistry = [],
  observation = null,
  activeGoal = null,
  activeContract = null,
  permissions = null,
  scheduler = null,
  recentEvents = [],
  recentReceipts = [],
  safeCandidates = [],
} = {}) {
  const { entries, missingRequired } = await buildPackFileEntries(packFiles);
  const toolAliasRegistry = buildFoundersPlotToolAliasRegistry(toolRegistry);
  const compactToolGuide = [
    entries.toolsMd.excerpt ? `Guidance from tools.md:\n${entries.toolsMd.excerpt}` : "Guidance from tools.md: missing.",
    "",
    "Provider-safe aliases for canonical Founders Plot tools:",
    formatToolGuide(toolAliasRegistry.providerTools),
  ].filter(Boolean).join("\n");
  const enrichedCandidates = enrichSafeCandidates(safeCandidates, toolAliasRegistry.aliasMap);
  const toolSource = entries.toolsMd.present && toolAliasRegistry.providerTools.length > 0
    ? "merged"
    : entries.toolsMd.present
      ? "tools.md"
      : "server-tool-registry";
  const completenessIssues = [];
  for (const key of missingRequired) {
    completenessIssues.push(`${key} missing`);
  }
  if (toolAliasRegistry.providerTools.length === 0) {
    completenessIssues.push("server tool registry missing");
  }
  if (enrichedCandidates.some((candidate) => candidate.providerSafeToolKnown !== true)) {
    completenessIssues.push("provider alias map incomplete");
  }
  const packHash = await digestText(JSON.stringify({
    files: Object.fromEntries(Object.entries(entries).map(([key, entry]) => [key, entry.hash || null])),
    aliasMap: toolAliasRegistry.aliasMap,
    compactToolGuide,
  }));
  return {
    contextVersion: FOREMAN_CONTEXT_VERSION,
    experienceId: "founders-plot",
    plotId: String(plotId || ""),
    foremanId: String(foremanId || "clover"),
    runtimeId: String(runtimeId || ""),
    pack: {
      packHash,
      files: entries,
    },
    toolContract: {
      source: toolSource,
      providerTools: toolAliasRegistry.providerTools,
      compactToolGuide,
      aliasMap: toolAliasRegistry.aliasMap,
    },
    observation: jsonClone(observation || null),
    activeGoal: jsonClone(activeGoal || observation?.currentGoal || null),
    activeContract: jsonClone(activeContract || observation?.activeContract || null),
    permissions: jsonClone(permissions || observation?.permissions || {}),
    scheduler: jsonClone(scheduler || observation?.scheduler || {}),
    recentEvents: summarizeRecentEvents(recentEvents),
    recentReceipts: (Array.isArray(recentReceipts) ? recentReceipts : []).slice(0, 4).map((receipt) => jsonClone(receipt)),
    safeCandidates: enrichedCandidates,
    outputContract: {
      mode: "select_candidate_or_noop",
      neverInventTools: true,
      neverInventCandidateIds: true,
      serverValidatesAllActions: true,
    },
    completeness: {
      canAct: completenessIssues.length === 0,
      issues: completenessIssues,
    },
  };
}

function buildFoundersPlotDecisionPrompt(context = null) {
  const payload = {
    contextVersion: context?.contextVersion || FOREMAN_CONTEXT_VERSION,
    pack: {
      packHash: context?.pack?.packHash || null,
      files: context?.pack?.files || {},
    },
    toolContract: {
      source: context?.toolContract?.source || "server-tool-registry",
      providerTools: context?.toolContract?.providerTools || [],
      compactToolGuide: context?.toolContract?.compactToolGuide || "",
      aliasMap: context?.toolContract?.aliasMap || {},
      selectionTool: {
        name: FOREMAN_SELECTION_TOOL_NAME,
        description: "Select exactly one safe candidate or return a no-op code.",
        inputSchema: {
          type: "object",
          properties: {
            selectedCandidateId: { type: ["string", "null"] },
            confidence: { type: "number", minimum: 0, maximum: 1 },
            reason: { type: "string", minLength: 1, maxLength: 300 },
            playerFacingLine: { type: "string", minLength: 1, maxLength: 160 },
            noopCode: {
              type: ["string", "null"],
              enum: ["HEARTBEAT_OK", "NO_SAFE_CANDIDATE", "LOW_CONFIDENCE", "FOREMAN_CONTEXT_INCOMPLETE", null],
            },
          },
          required: ["selectedCandidateId", "confidence", "reason", "playerFacingLine", "noopCode"],
          additionalProperties: false,
        },
      },
    },
    observation: context?.observation || null,
    activeGoal: context?.activeGoal || null,
    activeContract: context?.activeContract || null,
    permissions: context?.permissions || {},
    scheduler: context?.scheduler || {},
    recentEvents: context?.recentEvents || [],
    recentReceipts: context?.recentReceipts || [],
    safeCandidates: context?.safeCandidates || [],
    outputContract: context?.outputContract || {},
    completeness: context?.completeness || {},
  };
  return [
    "Select Clover's next safe Founders Plot action.",
    "Reply with minified JSON only.",
    `Use the provider-safe selection tool contract named ${FOREMAN_SELECTION_TOOL_NAME}.`,
    "Do not invent candidate IDs, tools, or approval states.",
    "If context is incomplete, choose a no-op with FOREMAN_CONTEXT_INCOMPLETE.",
    JSON.stringify(payload),
  ].join("\n");
}

function chooseFoundersPlotCandidateWithTestBrain(context = null) {
  const safeCandidates = Array.isArray(context?.safeCandidates) ? context.safeCandidates : [];
  const actionableCandidates = safeCandidates.filter((candidate) => candidate?.canActNow === true);
  if (context?.completeness?.canAct !== true) {
    return buildNoopDecision(
      "FOREMAN_CONTEXT_INCOMPLETE",
      `Context incomplete: ${(context?.completeness?.issues || []).join(", ") || "required pack files missing"}.`,
      "I stayed put because I could not load the full Foreman playbook."
    );
  }
  if (actionableCandidates.length === 0) {
    return buildNoopDecision(
      "NO_SAFE_CANDIDATE",
      "No safe candidate was ready to act.",
      "I watched the plot, but there was no safe task to take."
    );
  }
  const heartbeatText = String(context?.pack?.files?.heartbeatMd?.excerpt || "").toLowerCase();
  const hasActiveContract = !!context?.activeContract?.contractId;
  if (!hasActiveContract && heartbeatText.includes("no contract is active")) {
    return buildNoopDecision(
      "HEARTBEAT_OK",
      "Heartbeat guidance prefers a calm no-op when no contract is active.",
      "I stayed put because nothing urgent was pulling on the town."
    );
  }
  const chosen = actionableCandidates[0];
  return {
    selectedCandidateId: String(chosen?.candidateId || ""),
    confidence: 0.88,
    reason: String(chosen?.reason || "").trim() || "This is the safest useful action.",
    playerFacingLine: buildPlayerFacingLine(chosen, context),
    noopCode: null,
  };
}

export {
  FOREMAN_CONTEXT_VERSION,
  FOREMAN_SELECTION_TOOL_NAME,
  buildFoundersPlotDecisionPrompt,
  buildFoundersPlotForemanContext,
  buildFoundersPlotToolAliasRegistry,
  buildNoopDecision,
  chooseFoundersPlotCandidateWithTestBrain,
  digestText,
  providerSafeAliasFromCanonicalName,
};
