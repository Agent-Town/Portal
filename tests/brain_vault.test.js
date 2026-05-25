const test = require('node:test');
const assert = require('node:assert/strict');
const {
  BRAIN_VAULT_MODE,
  BRAIN_VAULT_SCHEMA,
  normalizeBrainVaultEnvelope,
  publicBrainVaultView,
  redactSecrets
} = require('../server/brain_vault');

function b64(size, fill = 7) {
  return Buffer.alloc(size, fill).toString('base64');
}

function validEnvelope(overrides = {}) {
  return {
    schema: BRAIN_VAULT_SCHEMA,
    vaultMode: BRAIN_VAULT_MODE,
    metadata: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      modelRef: 'openai/gpt-4o-mini',
      authMode: 'api-key',
      label: 'Test Brain',
      apiKeySet: true
    },
    ciphertext: {
      alg: 'AES-GCM',
      iv: b64(12, 1),
      ct: b64(48, 2),
      salt: b64(16, 3),
      kdf: {
        name: 'PBKDF2-SHA256',
        hash: 'SHA-256',
        iterations: 120000
      }
    },
    agentBackup: {
      schemaVersion: 1,
      agentName: 'Clover',
      packRefs: ['skill.md', 'tools.md'],
      checkpointSummary: 'One safe checkpoint summary.',
      safeSettings: {
        standingOrder: 'protect_reserves'
      },
      migration: {
        from: 'v1',
        to: 'v1'
      }
    },
    ...overrides
  };
}

test('Brain vault envelope stores metadata and ciphertext without plaintext secret fields', () => {
  const normalized = normalizeBrainVaultEnvelope(validEnvelope());
  assert.equal(normalized.schema, BRAIN_VAULT_SCHEMA);
  assert.equal(normalized.vaultMode, BRAIN_VAULT_MODE);
  assert.equal(normalized.metadata.provider, 'openai');
  assert.equal(normalized.metadata.apiKeySet, true);
  assert.equal(normalized.ciphertext.ct, b64(48, 2));
  assert.equal(normalized.agentBackup.schemaVersion, 1);
  assert.equal(normalized.agentBackup.restoredActsAutomatically, false);
});

test('Brain vault rejects plaintext secrets outside ciphertext', () => {
  assert.throws(() => normalizeBrainVaultEnvelope(validEnvelope({
    metadata: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      apiKey: 'sk-plaintext-secret'
    }
  })), /PLAINTEXT_SECRET_FIELD/);

  assert.throws(() => normalizeBrainVaultEnvelope(validEnvelope({
    agentBackup: {
      schemaVersion: 1,
      agentName: 'Clover',
      checkpointSummary: 'bearer abcdefghijklmnop'
    }
  })), /PLAINTEXT_SECRET_VALUE/);
});

test('Brain vault public view is explicit-unlock and redacts sealed bytes unless requested', () => {
  const envelope = normalizeBrainVaultEnvelope(validEnvelope());
  const record = {
    ...envelope,
    createdAtMs: 100,
    updatedAtMs: 200
  };

  const status = publicBrainVaultView(record);
  assert.equal(status.available, true);
  assert.equal(status.unlockRequired, true);
  assert.equal(status.restoredActsAutomatically, false);
  assert.equal(status.ciphertext, undefined);

  const sealed = publicBrainVaultView(record, { includeSealed: true });
  assert.equal(sealed.ciphertext.ct, b64(48, 2));

  const redacted = redactSecrets({
    apiKey: 'sk-plaintext-secret',
    ciphertext: { ct: b64(48, 2) }
  });
  assert.equal(redacted.apiKey, '[REDACTED]');
  assert.equal(redacted.ciphertext.ct, '[REDACTED]');
});
