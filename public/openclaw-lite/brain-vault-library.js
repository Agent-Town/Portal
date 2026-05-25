import { loadLlmConfig, saveLlmConfig } from '/openclaw-lite/llm-config-library.js';

export const BRAIN_VAULT_SCHEMA = 'agent-town-brain-vault@1';
export const BRAIN_VAULT_MODE = 'zero-knowledge-passphrase';
export const BRAIN_VAULT_KDF_ITERATIONS = 120000;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function requireSubtleCrypto() {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle || typeof globalThis.crypto?.getRandomValues !== 'function') {
    throw new Error('WEB_CRYPTO_UNAVAILABLE');
  }
  return subtle;
}

function bytesToBase64(bytes) {
  const array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
  let binary = '';
  for (let i = 0; i < array.length; i += 1) {
    binary += String.fromCharCode(array[i]);
  }
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(String(value || ''));
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

function randomBytes(length) {
  const out = new Uint8Array(length);
  globalThis.crypto.getRandomValues(out);
  return out;
}

function normalizePassphrase(passphrase) {
  const text = String(passphrase || '');
  if (text.length < 8) throw new Error('VAULT_PASSPHRASE_TOO_SHORT');
  return text;
}

async function deriveVaultKey(passphrase, saltB64, iterations = BRAIN_VAULT_KDF_ITERATIONS) {
  const subtle = requireSubtleCrypto();
  const baseKey = await subtle.importKey(
    'raw',
    encoder.encode(normalizePassphrase(passphrase)),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return await subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: base64ToBytes(saltB64),
      iterations: Number(iterations || BRAIN_VAULT_KDF_ITERATIONS)
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function publicBrainMetadata(config = {}, options = {}) {
  const provider = String(config.provider || '').trim();
  const model = String(config.model || config.modelId || '').trim();
  const modelRef = String(config.modelRef || (provider && model ? `${provider}/${model}` : '')).trim();
  const authMode = String(config.authMode || 'api-key').trim();
  if (!provider) throw new Error('MISSING_VAULT_PROVIDER');
  if (!model) throw new Error('MISSING_VAULT_MODEL');
  return {
    provider,
    model,
    modelRef,
    authMode,
    label: String(options.label || `${provider} ${model}`).trim().slice(0, 96),
    apiKeySet: true
  };
}

function normalizeAgentBackup(backup = {}) {
  const input = backup && typeof backup === 'object' ? backup : {};
  return {
    schemaVersion: Number(input.schemaVersion || input.v || 1) || 1,
    agentName: String(input.agentName || input.name || 'Clover').trim().slice(0, 96),
    packRefs: Array.isArray(input.packRefs || input.packs)
      ? (input.packRefs || input.packs).map((entry) => String(entry || '').trim()).filter(Boolean).slice(0, 16)
      : [],
    memorySummary: String(input.memorySummary || '').trim().slice(0, 1000),
    checkpointSummary: String(input.checkpointSummary || '').trim().slice(0, 1000),
    safeSettings: input.safeSettings && typeof input.safeSettings === 'object' ? input.safeSettings : {},
    migration: input.migration && typeof input.migration === 'object'
      ? {
          from: String(input.migration.from || '').trim().slice(0, 80),
          to: String(input.migration.to || '').trim().slice(0, 80)
        }
      : null
  };
}

function brainSecretPayload(config = {}) {
  const provider = String(config.provider || '').trim();
  const model = String(config.model || config.modelId || '').trim();
  const apiKey = String(config.apiKey || '').trim();
  if (!provider || !model || !apiKey) throw new Error('BRAIN_CONFIG_INCOMPLETE');
  return {
    provider,
    model,
    modelRef: String(config.modelRef || `${provider}/${model}`).trim(),
    apiKey,
    authMode: String(config.authMode || 'api-key').trim(),
    reasoning: String(config.reasoning || '').trim(),
    useProxy: config.useProxy !== false
  };
}

function redactedConfig(config = {}) {
  return {
    configured: true,
    provider: String(config.provider || '').trim(),
    model: String(config.model || '').trim(),
    modelRef: String(config.modelRef || '').trim(),
    authMode: String(config.authMode || 'api-key').trim(),
    apiKeySet: true
  };
}

export async function sealBrainVaultConfig(config = {}, passphrase = '', options = {}) {
  requireSubtleCrypto();
  const salt = bytesToBase64(randomBytes(16));
  const iv = bytesToBase64(randomBytes(12));
  const key = await deriveVaultKey(passphrase, salt, BRAIN_VAULT_KDF_ITERATIONS);
  const plaintext = {
    schema: BRAIN_VAULT_SCHEMA,
    sealedAtMs: Date.now(),
    brain: brainSecretPayload(config),
    agentBackup: normalizeAgentBackup(options.agentBackup || {})
  };
  const ctBytes = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: base64ToBytes(iv) },
    key,
    encoder.encode(JSON.stringify(plaintext))
  );
  return {
    schema: BRAIN_VAULT_SCHEMA,
    vaultMode: BRAIN_VAULT_MODE,
    metadata: publicBrainMetadata(config, options),
    ciphertext: {
      alg: 'AES-GCM',
      iv,
      ct: bytesToBase64(new Uint8Array(ctBytes)),
      salt,
      kdf: {
        name: 'PBKDF2-SHA256',
        hash: 'SHA-256',
        iterations: BRAIN_VAULT_KDF_ITERATIONS
      }
    },
    agentBackup: normalizeAgentBackup(options.agentBackup || {}),
    unlockRequired: true,
    restoredActsAutomatically: false
  };
}

export async function openBrainVaultPayload(vault = {}, passphrase = '') {
  const ciphertext = vault?.ciphertext || {};
  const iterations = Number(ciphertext?.kdf?.iterations || BRAIN_VAULT_KDF_ITERATIONS);
  const key = await deriveVaultKey(passphrase, ciphertext.salt, iterations);
  const plaintextBytes = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(ciphertext.iv) },
    key,
    base64ToBytes(ciphertext.ct)
  );
  const parsed = JSON.parse(decoder.decode(new Uint8Array(plaintextBytes)));
  if (parsed?.schema !== BRAIN_VAULT_SCHEMA) throw new Error('UNSUPPORTED_VAULT_SCHEMA');
  if (!parsed?.brain?.provider || !parsed?.brain?.model || !parsed?.brain?.apiKey) {
    throw new Error('BRAIN_VAULT_INCOMPLETE');
  }
  return parsed;
}

export async function getBrainVaultStatus({ includeSealed = false } = {}) {
  const url = includeSealed ? '/api/agent/lite/brain-vault?includeSealed=1' : '/api/agent/lite/brain-vault';
  const response = await fetch(url, { credentials: 'include' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.ok !== true) throw new Error(data?.error || 'BRAIN_VAULT_STATUS_FAILED');
  return data;
}

export async function saveBrainVaultToServer(config = {}, passphrase = '', options = {}) {
  const payload = await sealBrainVaultConfig(config, passphrase, options);
  const response = await fetch('/api/agent/lite/brain-vault', {
    method: 'PUT',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.ok !== true) throw new Error(data?.error || 'BRAIN_VAULT_SAVE_FAILED');
  return data;
}

export async function backupCurrentBrainVault(passphrase = '', options = {}) {
  const current = await loadLlmConfig();
  if (!current?.configured || !current?.apiKey) throw new Error('BRAIN_CONFIG_INCOMPLETE');
  return await saveBrainVaultToServer(current, passphrase, options);
}

export async function restoreBrainVault(passphrase = '', { confirm = false } = {}) {
  if (confirm !== true) throw new Error('EXPLICIT_UNLOCK_REQUIRED');
  const status = await getBrainVaultStatus({ includeSealed: true });
  if (status?.vault?.available !== true || !status.vault.ciphertext) {
    throw new Error('BRAIN_VAULT_NOT_FOUND');
  }
  const opened = await openBrainVaultPayload(status.vault, passphrase);
  await saveLlmConfig(opened.brain);
  const unlockResponse = await fetch('/api/agent/lite/brain-vault/unlock-confirmed', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      metadata: redactedConfig(opened.brain)
    })
  });
  const unlock = await unlockResponse.json().catch(() => ({}));
  if (!unlockResponse.ok || unlock?.ok !== true) throw new Error(unlock?.error || 'BRAIN_VAULT_UNLOCK_CONFIRM_FAILED');
  return {
    ok: true,
    config: redactedConfig(opened.brain),
    agentBackup: opened.agentBackup || status.vault.agentBackup || null,
    unlock: unlock.unlock || null
  };
}
