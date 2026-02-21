import { b64ToBytes, bytesToB64, utf8ToBytes } from '/openclaw-lite/vendor/shared/encoding.js';
import { randomBytes, sha256 } from '/openclaw-lite/vendor/shared/crypto.js';

const CEREMONY_E2EE_P256_AESGCM_V1 = 'CEREMONY_E2EE_P256_AESGCM_V1';

const runtime = {
  teamCode: '',
  llm: {
    provider: null,
    model: null
  },
  ceremony: null
};

function reply(requestId, payload) {
  self.postMessage({
    type: 'runtime.response',
    requestId,
    ...payload
  });
}

function normalizeTeamCode(input) {
  const raw = String(input || runtime.teamCode || '').trim();
  if (!raw) throw new Error('MISSING_TEAM_CODE');
  runtime.teamCode = raw;
  return raw;
}

async function api(url, { method = 'GET', body } = {}) {
  const headers = {};
  if (runtime.teamCode) {
    headers['x-team-code-hint'] = String(runtime.teamCode);
  }
  const opts = {
    method,
    credentials: 'include',
    headers
  };
  if (body !== undefined) {
    headers['content-type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(String(data?.error || `HTTP_${res.status}`));
  }
  return data;
}

function makeCeremonyRevealKeyInfo({ direction = '', teamCode = '' }) {
  return `elizatown-ceremony-reveal-v1|dir=${direction}|team=${teamCode || ''}`;
}

async function deriveCeremonyRevealKey({ sharedSecret, direction, teamCode, usages = ['encrypt'] }) {
  const baseKey = await crypto.subtle.importKey('raw', sharedSecret, 'HKDF', false, ['deriveKey']);
  const info = utf8ToBytes(makeCeremonyRevealKeyInfo({ direction, teamCode }));
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array([]), info },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    usages
  );
}

async function encryptCeremonyReveal({ revealBytes, recipientRevealPub, direction, teamCode }) {
  const recipientBytes = b64ToBytes(recipientRevealPub || '');
  if (!recipientBytes || !recipientBytes.length) throw new Error('INVALID_REVEAL_PUB');

  const recipientPub = await crypto.subtle.importKey(
    'spki',
    recipientBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );
  const eph = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );
  const sharedBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: recipientPub },
    eph.privateKey,
    256
  );
  const sharedSecret = new Uint8Array(sharedBits);
  const key = await deriveCeremonyRevealKey({
    sharedSecret,
    direction,
    teamCode,
    usages: ['encrypt']
  });

  const aadBytes = utf8ToBytes(JSON.stringify({ v: 1, direction, teamCode: teamCode || null }));
  const plaintext = utf8ToBytes(JSON.stringify({ v: 1, reveal: bytesToB64(revealBytes) }));
  const iv = randomBytes(12);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: aadBytes },
    key,
    plaintext
  );
  const epk = new Uint8Array(await crypto.subtle.exportKey('spki', eph.publicKey));

  return {
    alg: CEREMONY_E2EE_P256_AESGCM_V1,
    epk: bytesToB64(epk),
    iv: bytesToB64(iv),
    ct: bytesToB64(new Uint8Array(ciphertext)),
    aad: bytesToB64(aadBytes)
  };
}

async function handleCommand(command, payload) {
  switch (command) {
    case 'bootstrap': {
      const teamCode = normalizeTeamCode(payload?.teamCode);
      const runtimeInfo = await api('/api/agent/lite/runtime');
      return {
        teamCode,
        runtime: runtimeInfo
      };
    }
    case 'setLlmConfig': {
      runtime.llm.provider = payload?.provider ? String(payload.provider) : null;
      runtime.llm.model = payload?.model ? String(payload.model) : null;
      return { ok: true };
    }
    case 'agentSelect': {
      const teamCode = normalizeTeamCode(payload?.teamCode);
      const elementId = String(payload?.elementId || '').trim();
      if (!elementId) throw new Error('MISSING_ELEMENT_ID');
      return api('/api/agent/select', {
        method: 'POST',
        body: { teamCode, elementId }
      });
    }
    case 'agentOpenPress': {
      const teamCode = normalizeTeamCode(payload?.teamCode);
      return api('/api/agent/open/press', {
        method: 'POST',
        body: { teamCode }
      });
    }
    case 'ceremonyCommit': {
      const teamCode = normalizeTeamCode(payload?.teamCode);
      if (runtime.ceremony?.commit) {
        return {
          commit: runtime.ceremony.commit,
          revealPub: runtime.ceremony.revealPub
        };
      }
      const raBytes = randomBytes(32);
      const commit = bytesToB64(await sha256(raBytes));
      const revealPair = await crypto.subtle.generateKey(
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        ['deriveBits']
      );
      const revealPub = bytesToB64(new Uint8Array(await crypto.subtle.exportKey('spki', revealPair.publicKey)));
      await api('/api/agent/house/commit', {
        method: 'POST',
        body: {
          teamCode,
          commit,
          revealPub
        }
      });
      runtime.ceremony = {
        raBytes,
        revealPrivateKey: revealPair.privateKey,
        commit,
        revealPub,
        revealed: false
      };
      return { commit, revealPub };
    }
    case 'ceremonyReveal': {
      const teamCode = normalizeTeamCode(payload?.teamCode);
      if (!runtime.ceremony?.raBytes) throw new Error('CEREMONY_NOT_COMMITTED');
      const humanRevealPub = String(payload?.humanRevealPub || '').trim();
      if (!humanRevealPub) throw new Error('MISSING_HUMAN_REVEAL_PUB');
      const sealedForHuman = await encryptCeremonyReveal({
        revealBytes: runtime.ceremony.raBytes,
        recipientRevealPub: humanRevealPub,
        direction: 'agent_to_human',
        teamCode
      });
      const response = await api('/api/agent/house/reveal', {
        method: 'POST',
        body: {
          teamCode,
          sealedForHuman
        }
      });
      runtime.ceremony.revealed = true;
      return response;
    }
    case 'ceremonyReset': {
      runtime.ceremony = null;
      return { ok: true };
    }
    default:
      throw new Error('UNKNOWN_COMMAND');
  }
}

self.addEventListener('message', async (event) => {
  const msg = event?.data || {};
  const requestId = typeof msg.requestId === 'string' ? msg.requestId : '';
  if (!requestId) return;
  const command = String(msg.command || '').trim();
  try {
    const result = await handleCommand(command, msg.payload || {});
    reply(requestId, { ok: true, result });
  } catch (err) {
    reply(requestId, {
      ok: false,
      error: String(err?.message || err || 'RUNTIME_COMMAND_FAILED')
    });
  }
});
