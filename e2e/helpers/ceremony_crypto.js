const crypto = require('crypto');

const CEREMONY_E2EE_P256_AESGCM_V1 = 'CEREMONY_E2EE_P256_AESGCM_V1';

function hkdf(ikm, info, len = 32) {
  return Buffer.from(crypto.hkdfSync('sha256', ikm, Buffer.alloc(0), Buffer.from(info, 'utf8'), len));
}

function makeCeremonyKeyInfo({ direction = '', teamCode = '' }) {
  return `elizatown-ceremony-reveal-v1|dir=${direction}|team=${teamCode || ''}`;
}

function makeCeremonyRevealPair() {
  const pair = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  return {
    publicKeyB64: pair.publicKey.export({ type: 'spki', format: 'der' }).toString('base64'),
    privateKey: pair.privateKey
  };
}

function encryptCeremonyReveal({ revealBytes, recipientRevealPubB64, direction, teamCode = '' }) {
  const recipientPub = crypto.createPublicKey({
    key: Buffer.from(recipientRevealPubB64, 'base64'),
    format: 'der',
    type: 'spki'
  });
  const eph = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const shared = crypto.diffieHellman({ privateKey: eph.privateKey, publicKey: recipientPub });
  const key = hkdf(shared, makeCeremonyKeyInfo({ direction, teamCode }), 32);

  const aadBytes = Buffer.from(JSON.stringify({
    v: 1,
    direction,
    teamCode: teamCode || null
  }), 'utf8');
  const payloadBytes = Buffer.from(JSON.stringify({
    v: 1,
    reveal: Buffer.from(revealBytes).toString('base64')
  }), 'utf8');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(aadBytes);
  const enc = Buffer.concat([cipher.update(payloadBytes), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    alg: CEREMONY_E2EE_P256_AESGCM_V1,
    epk: eph.publicKey.export({ type: 'spki', format: 'der' }).toString('base64'),
    iv: iv.toString('base64'),
    ct: Buffer.concat([enc, tag]).toString('base64'),
    aad: aadBytes.toString('base64')
  };
}

function decryptCeremonyReveal({ sealed, privateKey, direction, teamCode = '' }) {
  const peerPublic = crypto.createPublicKey({
    key: Buffer.from(sealed.epk, 'base64'),
    format: 'der',
    type: 'spki'
  });
  const shared = crypto.diffieHellman({ privateKey, publicKey: peerPublic });
  const key = hkdf(shared, makeCeremonyKeyInfo({ direction, teamCode }), 32);
  const iv = Buffer.from(sealed.iv, 'base64');
  const aadBytes = Buffer.from(sealed.aad, 'base64');
  const ct = Buffer.from(sealed.ct, 'base64');
  if (ct.length < 17) throw new Error('INVALID_REVEAL_ENVELOPE');
  const enc = ct.subarray(0, ct.length - 16);
  const tag = ct.subarray(ct.length - 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAAD(aadBytes);
  decipher.setAuthTag(tag);
  const payload = Buffer.concat([decipher.update(enc), decipher.final()]);
  const parsed = JSON.parse(payload.toString('utf8'));
  if (!parsed || typeof parsed.reveal !== 'string') throw new Error('INVALID_REVEAL_ENVELOPE');
  return Buffer.from(parsed.reveal, 'base64');
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForAgentHouseMaterial(request, teamCode, predicate, attempts = 40, delayMs = 100) {
  for (let i = 0; i < attempts; i += 1) {
    const resp = await request.get(`/api/agent/house/material?teamCode=${encodeURIComponent(teamCode)}`);
    if (resp.ok()) {
      const data = await resp.json();
      if (!predicate || predicate(data)) return data;
    }
    await sleep(delayMs);
  }
  return null;
}

module.exports = {
  CEREMONY_E2EE_P256_AESGCM_V1,
  makeCeremonyRevealPair,
  encryptCeremonyReveal,
  decryptCeremonyReveal,
  waitForAgentHouseMaterial
};
