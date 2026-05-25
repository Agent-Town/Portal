const NOTICE_KIOSK_MANIFEST = require('../../public/experiences/founders-plot/creator-packs/notice-kiosk.manifest.json');

const CREATOR_EXTENSION_MANIFESTS = [NOTICE_KIOSK_MANIFEST];
const CREATOR_FORBIDDEN_RE = /(?:\b(?:api[-_ ]?key|secret|token|bearer|authorization|provider|model|brain|runtime|worker|trace|logs?|events?|private|wallet)\b|sk-[a-z0-9_-]+)/i;

function copyJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function manifestById(extensionId = '') {
  return CREATOR_EXTENSION_MANIFESTS.find((manifest) => manifest.id === extensionId) || null;
}

function validateObjectSchema(schema, { requireProperties = false } = {}) {
  const errors = [];
  if (!schema || typeof schema !== 'object') {
    return ['schema missing'];
  }
  if (schema.type !== 'object') errors.push('schema.type must be object');
  if (schema.additionalProperties !== false) errors.push('schema.additionalProperties must be false');
  if (requireProperties && (!schema.properties || typeof schema.properties !== 'object')) {
    errors.push('schema.properties missing');
  }
  return errors;
}

function validateCreatorManifest(manifest = {}) {
  const errors = [];
  if (manifest.schemaVersion !== 'founders-plot.creator-building.v1') errors.push('schemaVersion unsupported');
  if (!/^creator\.[a-z0-9-]+$/.test(String(manifest.id || ''))) errors.push('id must use creator.* namespace');
  if (!/^[A-Z0-9_]+$/.test(String(manifest.buildingType || ''))) errors.push('buildingType must be constant-style');
  if (!String(manifest.label || '').trim()) errors.push('label required');
  if (!String(manifest.summary || '').trim()) errors.push('summary required');
  if (manifest?.source?.importMode !== 'curated_local_pack') errors.push('source.importMode must be curated_local_pack');
  if (manifest?.source?.externalUpload !== false) errors.push('source.externalUpload must be false');
  if (!String(manifest?.source?.path || '').startsWith('public/experiences/founders-plot/creator-packs/')) {
    errors.push('source.path must stay in creator-packs');
  }
  if (manifest?.assetGovernance?.status !== 'APPROVED') errors.push('assetGovernance.status must be APPROVED');
  if (manifest?.assetGovernance?.promptProvenanceRequired !== true) errors.push('assetGovernance.promptProvenanceRequired must be true');
  if (!String(manifest?.assetGovernance?.manifestPath || '').trim()) errors.push('assetGovernance.manifestPath required');
  if (!String(manifest?.creatorEconomics?.creditModel || '').trim()) errors.push('creatorEconomics.creditModel required');
  if (manifest?.creatorEconomics?.revenueEnabled !== false) errors.push('creatorEconomics.revenueEnabled must be false for curated baseline');
  if (manifest?.moderation?.status !== 'APPROVED') errors.push('moderation.status must be APPROVED');
  if (manifest?.moderation?.networkAccess !== false) errors.push('networkAccess must be false');
  const dataAccess = Array.isArray(manifest?.moderation?.dataAccess) ? manifest.moderation.dataAccess : [];
  const forbiddenData = Array.isArray(manifest?.moderation?.forbiddenData) ? manifest.moderation.forbiddenData : [];
  if (!dataAccess.includes('plot_public_summary')) errors.push('dataAccess must include plot_public_summary');
  for (const forbidden of ['brain', 'wallet', 'runtime', 'worker', 'token', 'secret']) {
    if (!forbiddenData.includes(forbidden)) errors.push(`forbiddenData missing ${forbidden}`);
  }
  if (!manifest.install || typeof manifest.install !== 'object') errors.push('install required');
  if (!String(manifest?.install?.objectId || '').trim()) errors.push('install.objectId required');
  if (Number(manifest?.install?.requiresHqLevel || 0) < 1) errors.push('install.requiresHqLevel required');
  errors.push(...validateObjectSchema(manifest.stateSchema, { requireProperties: true }).map((entry) => `stateSchema ${entry}`));
  if (!Array.isArray(manifest.tools) || manifest.tools.length < 1) {
    errors.push('tools required');
  } else {
    const names = new Set();
    for (const tool of manifest.tools) {
      const name = String(tool?.name || '');
      if (!/^et\.creator\.[a-z0-9_]+\.[a-z0-9_]+$/.test(name)) errors.push(`tool ${name || '<missing>'} must use et.creator.* namespace`);
      if (names.has(name)) errors.push(`tool ${name} duplicated`);
      names.add(name);
      errors.push(...validateObjectSchema(tool?.inputSchema, { requireProperties: true }).map((entry) => `${name} inputSchema ${entry}`));
      errors.push(...validateObjectSchema(tool?.resultSchema).map((entry) => `${name} resultSchema ${entry}`));
      if (!Array.isArray(tool?.inputSchema?.required) || !tool.inputSchema.required.includes('idempotencyKey')) {
        errors.push(`${name} inputSchema must require idempotencyKey`);
      }
    }
  }
  return {
    ok: errors.length === 0,
    errors
  };
}

function approvedCreatorManifests() {
  return CREATOR_EXTENSION_MANIFESTS
    .map((manifest) => ({ manifest, validation: validateCreatorManifest(manifest) }))
    .filter((entry) => entry.validation.ok)
    .map((entry) => copyJson(entry.manifest));
}

function safeCreatorText(value = '', fallback = '') {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text || CREATOR_FORBIDDEN_RE.test(text)) return fallback;
  return text.slice(0, 80);
}

function validateCreatorToolInput(manifest, toolName, raw = {}) {
  const tool = (manifest?.tools || []).find((entry) => entry.name === toolName) || null;
  if (!tool) {
    return { ok: false, error: 'CREATOR_TOOL_NOT_FOUND', args: {} };
  }
  const schema = tool.inputSchema || {};
  const required = Array.isArray(schema.required) ? schema.required : [];
  const args = {};
  if (required.includes('text')) {
    const text = safeCreatorText(raw.text);
    if (!text) return { ok: false, error: 'CREATOR_TOOL_MODERATION_FAILED', args: {} };
    args.text = text;
  }
  if (required.includes('idempotencyKey')) {
    const idempotencyKey = String(raw.idempotencyKey || '').trim();
    if (!idempotencyKey) return { ok: false, error: 'INVALID_STATE', args: {} };
    args.idempotencyKey = idempotencyKey;
  }
  return { ok: true, args };
}

module.exports = {
  CREATOR_EXTENSION_MANIFESTS,
  approvedCreatorManifests,
  manifestById,
  safeCreatorText,
  validateCreatorManifest,
  validateCreatorToolInput
};
