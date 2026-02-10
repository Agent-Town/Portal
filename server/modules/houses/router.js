const crypto = require('crypto');
const express = require('express');

const {
  decodeB64,
  serializePublicMedia,
  verifyHouseAuth,
  parsePublicImageDataUrl,
  normalizePublicPrompt
} = require('./service');

function nowIso() {
  return new Date().toISOString();
}

function b64ToBytes(str) {
  const bin = Buffer.from(str, 'base64');
  return new Uint8Array(bin);
}

function sha256Bytes(bytes) {
  return new Uint8Array(crypto.createHash('sha256').update(Buffer.from(bytes)).digest());
}

function base58Encode(bytes) {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let x = BigInt('0x' + Buffer.from(bytes).toString('hex'));
  let out = '';
  while (x > 0n) {
    const mod = x % 58n;
    out = alphabet[Number(mod)] + out;
    x = x / 58n;
  }
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) out = '1' + out;
  return out || '1';
}

function countInk(pixels) {
  if (!Array.isArray(pixels)) return 0;
  let count = 0;
  for (const p of pixels) {
    if (p && p !== 0) count += 1;
  }
  return count;
}

function buildWalletLookupMessage({ address, nonce, houseId }) {
  const parts = ['ElizaTown House Lookup', `address: ${address}`, `nonce: ${nonce}`];
  if (houseId) parts.push(`houseId: ${houseId}`);
  return parts.join('\n');
}

function buildHouseKeyWrapMessage({ houseId }) {
  return ['ElizaTown House Key Wrap', `houseId: ${houseId}`].join('\n');
}

function isTestMockAddress(address) {
  return process.env.NODE_ENV === 'test' && typeof address === 'string' && address.startsWith('So1anaMock');
}

function ensurePublicTeamForShare(store, share, session = null, { extractXHandle: extractXHandleFn } = {}) {
  if (!share || !share.id) return false;
  const exists = store.publicTeams.find((p) => p.shareId === share.id);
  if (exists) return true;

  const humanHandle = share.humanHandle || extractXHandleFn?.(share.xPostUrl);
  const record = {
    id: `p_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: nowIso(),
    shareId: share.id,
    sharePath: `/s/${share.id}`,
    houseId: share.houseId || session?.houseCeremony?.houseId || null,
    matchedElement: session?.match?.elementId || share.matchedElement || null,
    agentName: share.agentName || session?.agent?.name || 'OpenClaw',
    xPostUrl: share.xPostUrl || null,
    humanHandle,
    agentPosts: share.agentPosts ? { moltbookUrl: share.agentPosts.moltbookUrl || null } : null
  };

  store.publicTeams.unshift(record);
  share.public = true;
  share.optIn = { human: true, agent: true };
  return true;
}

function createHousesRouter(deps) {
  if (!deps) throw new Error('HOUSES_DEPS_REQUIRED');
  const {
    ensureHumanSession,
    getSessionByTeamCode,
    getSessionByHouseId,
    indexHouseId,
    readStore,
    writeStore,
    verifySolanaSignature,
    recordSignup,
    sanitizeUrl,
    extractXHandle,
    emitMilestone = null,
    computeRewardsSummary = null,
    MAX_HOUSE_ENTRIES = 200,
    MAX_HOUSES = 500,
    MAX_SHARES = 2000,
    MAX_SIGNUPS = 5000,
    MIN_AGENT_SOLO_PIXELS = 20,
    HOUSE_AUTH_SKEW_MS = 2 * 60 * 1000,
    MAX_PUBLIC_IMAGE_BYTES = 1024 * 1024,
    MAX_PUBLIC_PROMPT_CHARS = 280
  } = deps;

  if (typeof ensureHumanSession !== 'function') throw new Error('HOUSES_ENSURE_HUMAN_SESSION_REQUIRED');
  if (typeof readStore !== 'function' || typeof writeStore !== 'function') throw new Error('HOUSES_STORE_REQUIRED');

  const router = express.Router();

  function makeNonce() {
    return `n_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  router.get('/house/nonce', (_req, res) => {
    res.json({ ok: true, nonce: makeNonce() });
  });

  router.get('/wallet/nonce', (req, res) => {
    const s = ensureHumanSession(req, res);
    const nonce = `wn_${crypto.randomBytes(16).toString('hex')}`;
    s.walletLookupNonce = nonce;
    res.json({ ok: true, nonce });
  });

  router.post('/wallet/lookup', (req, res) => {
    const s = ensureHumanSession(req, res);
    const address = typeof req.body?.address === 'string' ? req.body.address.trim() : '';
    const signature = typeof req.body?.signature === 'string' ? req.body.signature.trim() : '';
    const nonce = typeof req.body?.nonce === 'string' ? req.body.nonce.trim() : '';
    const houseId = typeof req.body?.houseId === 'string' ? req.body.houseId.trim() : '';
    if (!address) return res.status(400).json({ ok: false, error: 'MISSING_ADDRESS' });
    if (!signature) return res.status(400).json({ ok: false, error: 'MISSING_SIGNATURE' });
    const usingNonce = !!nonce;
    if (usingNonce) {
      if (nonce !== s.walletLookupNonce) return res.status(400).json({ ok: false, error: 'NONCE_MISMATCH' });
      const msg = buildWalletLookupMessage({ address, nonce, houseId: houseId || null });
      if (!isTestMockAddress(address) && !verifySolanaSignature(address, msg, signature)) {
        return res.status(401).json({ ok: false, error: 'BAD_SIGNATURE' });
      }
      s.walletLookupNonce = null;
    } else {
      if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
      const msg = buildHouseKeyWrapMessage({ houseId });
      if (!isTestMockAddress(address) && !verifySolanaSignature(address, msg, signature)) {
        return res.status(401).json({ ok: false, error: 'BAD_SIGNATURE' });
      }
    }

    const store = readStore();
    let matches = store.houses.filter(
      (r) => r && r.unlock && r.unlock.kind === 'solana-wallet-signature' && r.unlock.address === address
    );
    if (houseId) {
      matches = matches.filter((r) => r.id === houseId);
      if (!matches.length) return res.status(404).json({ ok: false, error: 'HOUSE_NOT_FOUND' });
    }
    if (!matches.length) return res.json({ ok: true, houseId: null, keyWrap: null });
    matches.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    const house = matches[matches.length - 1];
    if (house?.id) {
      s.houseCeremony.houseId = house.id;
      s.houseCeremony.createdAt = s.houseCeremony.createdAt || house.createdAt || nowIso();
      indexHouseId(s, house.id);
    }
    res.json({
      ok: true,
      houseId: house.id,
      keyWrap: house.keyWrap || null
    });
  });

  router.post('/house/init', (req, res) => {
    const s = ensureHumanSession(req, res);
    const houseId = typeof req.body?.houseId === 'string' ? req.body.houseId.trim() : '';
    const housePubKey = typeof req.body?.housePubKey === 'string' ? req.body.housePubKey.trim() : '';
    const nonce = typeof req.body?.nonce === 'string' ? req.body.nonce.trim() : '';
    const keyMode = typeof req.body?.keyMode === 'string' ? req.body.keyMode.trim() : 'ceremony';
    const unlock = req.body?.unlock || null;
    const keyWrap = req.body?.keyWrap || null;
    const houseAuthKey = typeof req.body?.houseAuthKey === 'string' ? req.body.houseAuthKey.trim() : '';

    if (!houseId || !housePubKey) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
    if (houseId !== housePubKey) return res.status(400).json({ ok: false, error: 'HOUSE_ID_MISMATCH' });
    if (!nonce) return res.status(400).json({ ok: false, error: 'MISSING_NONCE' });
    if (!houseAuthKey) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_AUTH' });
    const authKeyBytes = decodeB64(houseAuthKey);
    if (!authKeyBytes || authKeyBytes.length < 16) {
      return res.status(400).json({ ok: false, error: 'INVALID_HOUSE_AUTH' });
    }
    const enforcedReserved = (s && (s.reservedHouseId || s.claim?.x?.reservedHouseId)) || null;
    if (enforcedReserved && enforcedReserved !== houseId) {
      return res.status(403).json({ ok: false, error: 'RESERVED_HOUSE_MISMATCH' });
    }
    if (s.houseCeremony?.houseId && s.houseCeremony.houseId !== houseId) {
      return res.status(409).json({ ok: false, error: 'HOUSE_ALREADY_EXISTS' });
    }

    if (keyMode !== 'ceremony') {
      return res.status(400).json({ ok: false, error: 'CEREMONY_ONLY' });
    }

    let normalizedKeyWrap = null;
    if (keyWrap && typeof keyWrap === 'object') {
      const alg = typeof keyWrap.alg === 'string' ? keyWrap.alg.trim() : '';
      const iv = typeof keyWrap.iv === 'string' ? keyWrap.iv.trim() : '';
      const ct = typeof keyWrap.ct === 'string' ? keyWrap.ct.trim() : '';
      if (alg && iv && ct) {
        if (alg !== 'AES-GCM') {
          return res.status(400).json({ ok: false, error: 'INVALID_KEY_WRAP' });
        }
        normalizedKeyWrap = { alg, iv, ct };
      }
    }

    const store = readStore();
    if (store.houses.length >= MAX_HOUSES) {
      return res.status(403).json({ ok: false, error: 'STORE_FULL' });
    }
    const exists = store.houses.find((r) => r.id === houseId);
    if (exists) return res.status(409).json({ ok: false, error: 'HOUSE_EXISTS' });

    store.houses.push({
      id: houseId,
      housePubKey,
      createdAt: nowIso(),
      nonce,
      keyMode: 'ceremony',
      unlock,
      keyWrap: normalizedKeyWrap,
      authKey: houseAuthKey,
      entries: []
    });

    if (typeof emitMilestone === 'function') {
      emitMilestone(store, {
        houseId,
        event: 'CEREMONY_COMPLETED',
        source: 'human',
        value: 1,
        meta: { reserved: !!enforcedReserved }
      });
    }
    writeStore(store);

    if (s && s.houseCeremony) {
      s.houseCeremony.houseId = houseId;
      s.houseCeremony.createdAt = s.houseCeremony.createdAt || nowIso();
      indexHouseId(s, houseId);
    }

    res.json({ ok: true, houseId });
  });

  router.post('/agent/house/init', (req, res) => {
    const teamCode = typeof req.body?.teamCode === 'string' ? req.body.teamCode.trim() : '';
    const houseId = typeof req.body?.houseId === 'string' ? req.body.houseId.trim() : '';
    const housePubKey = typeof req.body?.housePubKey === 'string' ? req.body.housePubKey.trim() : '';
    const nonce = typeof req.body?.nonce === 'string' ? req.body.nonce.trim() : '';
    const keyMode = typeof req.body?.keyMode === 'string' ? req.body.keyMode.trim() : 'ceremony';
    const unlock = req.body?.unlock || null;
    const keyWrap = req.body?.keyWrap || null;
    const houseAuthKey = typeof req.body?.houseAuthKey === 'string' ? req.body.houseAuthKey.trim() : '';

    if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
    const s = getSessionByTeamCode(teamCode);
    if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });
    if (s.flow !== 'agent_solo') return res.status(403).json({ ok: false, error: 'AGENT_SOLO_ONLY' });
    if (!s.houseCeremony?.agentReveal) return res.status(403).json({ ok: false, error: 'CEREMONY_INCOMPLETE' });

    const painted = countInk(s.canvas?.pixels);
    if (painted < MIN_AGENT_SOLO_PIXELS) {
      return res.status(403).json({ ok: false, error: 'INSUFFICIENT_PIXELS', minPixels: MIN_AGENT_SOLO_PIXELS, painted });
    }

    if (!houseId || !housePubKey) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
    if (houseId !== housePubKey) return res.status(400).json({ ok: false, error: 'HOUSE_ID_MISMATCH' });
    if (!nonce) return res.status(400).json({ ok: false, error: 'MISSING_NONCE' });
    if (!houseAuthKey) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_AUTH' });
    const authKeyBytes = decodeB64(houseAuthKey);
    if (!authKeyBytes || authKeyBytes.length < 16) {
      return res.status(400).json({ ok: false, error: 'INVALID_HOUSE_AUTH' });
    }
    if (s.houseCeremony?.houseId && s.houseCeremony.houseId !== houseId) {
      return res.status(409).json({ ok: false, error: 'HOUSE_ALREADY_EXISTS' });
    }

    if (keyMode !== 'ceremony') {
      return res.status(400).json({ ok: false, error: 'CEREMONY_ONLY' });
    }

    const ra = b64ToBytes(s.houseCeremony.agentReveal);
    if (!ra || !ra.length) return res.status(400).json({ ok: false, error: 'INVALID_REVEAL' });
    const kroot = sha256Bytes(ra);
    const expectedHouseId = base58Encode(sha256Bytes(kroot));
    if (expectedHouseId !== houseId) {
      return res.status(400).json({ ok: false, error: 'HOUSE_ID_MISMATCH' });
    }

    let normalizedKeyWrap = null;
    if (keyWrap && typeof keyWrap === 'object') {
      const alg = typeof keyWrap.alg === 'string' ? keyWrap.alg.trim() : '';
      const iv = typeof keyWrap.iv === 'string' ? keyWrap.iv.trim() : '';
      const ct = typeof keyWrap.ct === 'string' ? keyWrap.ct.trim() : '';
      if (alg && iv && ct) {
        if (alg !== 'AES-GCM') {
          return res.status(400).json({ ok: false, error: 'INVALID_KEY_WRAP' });
        }
        normalizedKeyWrap = { alg, iv, ct };
      }
    }

    const store = readStore();
    if (store.houses.length >= MAX_HOUSES) {
      return res.status(403).json({ ok: false, error: 'STORE_FULL' });
    }
    if (store.signups.length >= MAX_SIGNUPS) {
      return res.status(403).json({ ok: false, error: 'STORE_FULL' });
    }
    const exists = store.houses.find((r) => r.id === houseId);
    if (exists) return res.status(409).json({ ok: false, error: 'HOUSE_EXISTS' });

    store.houses.push({
      id: houseId,
      housePubKey,
      createdAt: nowIso(),
      nonce,
      keyMode: 'ceremony',
      unlock,
      keyWrap: normalizedKeyWrap,
      authKey: houseAuthKey,
      entries: []
    });

    if (typeof emitMilestone === 'function') {
      emitMilestone(store, {
        houseId,
        event: 'CEREMONY_COMPLETED',
        source: 'agent',
        value: 1,
        meta: { reserved: false, solo: true }
      });
    }
    writeStore(store);

    s.houseCeremony.houseId = houseId;
    s.houseCeremony.createdAt = s.houseCeremony.createdAt || nowIso();
    indexHouseId(s, houseId);

    const status = recordSignup(s, {
      mode: 'agent_solo',
      agentName: s.agent.name || null,
      matchedElement: null,
      address: unlock?.address || null
    });

    if (!status.complete) {
      return res.status(403).json({ ok: false, error: status.reason || 'STORE_FULL', houseId });
    }

    res.json({ ok: true, houseId, status });
  });

  router.get('/house/:id/meta', (req, res) => {
    const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
    if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
    const store = readStore();
    const house = store.houses.find((r) => r.id === houseId);
    if (!house) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const auth = verifyHouseAuth(req, house, { skewMs: HOUSE_AUTH_SKEW_MS });
    if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });
    res.json({
      ok: true,
      houseId: house.id,
      housePubKey: house.housePubKey,
      nonce: house.nonce,
      keyMode: 'ceremony'
    });
  });

  router.get('/house/:id/descriptor', (req, res) => {
    const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
    if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
    const store = readStore();
    const house = store.houses.find((r) => r.id === houseId);
    if (!house) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const auth = verifyHouseAuth(req, house, { skewMs: HOUSE_AUTH_SKEW_MS });
    if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

    const origin = `${req.protocol}://${req.get('host')}`;
    res.json({
      ok: true,
      descriptor: {
        v: 1,
        kind: 'agent-town-house',
        house: {
          id: house.id,
          pub: house.housePubKey,
          mailboxes: [
            {
              chain: 'solana',
              kind: 'pda',
              status: 'placeholder',
              address: 'PDA_TODO',
              program: 'PROGRAM_TODO'
            }
          ]
        },
        endpoints: {
          meta: `${origin}/api/house/${encodeURIComponent(house.id)}/meta`,
          log: `${origin}/api/house/${encodeURIComponent(house.id)}/log`,
          append: `${origin}/api/house/${encodeURIComponent(house.id)}/append`
        },
        ui: {
          houseUrl: `${origin}/house?house=${encodeURIComponent(house.id)}`
        }
      }
    });
  });

  router.get('/house/:id/log', (req, res) => {
    const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
    if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
    const store = readStore();
    const house = store.houses.find((r) => r.id === houseId);
    if (!house) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const auth = verifyHouseAuth(req, house, { skewMs: HOUSE_AUTH_SKEW_MS });
    if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });
    res.json({ ok: true, entries: Array.isArray(house.entries) ? house.entries : [] });
  });

  router.get('/house/:id/public-media', (req, res) => {
    const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
    if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
    const store = readStore();
    const house = store.houses.find((r) => r.id === houseId);
    if (!house) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    res.json({ ok: true, publicMedia: serializePublicMedia(house) });
  });

  router.get('/house/:id/rewards', (req, res) => {
    const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
    if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
    const store = readStore();
    const house = store.houses.find((r) => r.id === houseId);
    if (!house) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const auth = verifyHouseAuth(req, house, { skewMs: HOUSE_AUTH_SKEW_MS });
    if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });
    if (typeof computeRewardsSummary !== 'function') {
      return res.status(501).json({ ok: false, error: 'NOT_IMPLEMENTED' });
    }
    const summary = computeRewardsSummary(store, houseId);
    res.json({ ok: true, ...summary });
  });

  router.get('/house/:id/public-media/image', (req, res) => {
    const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
    if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
    const store = readStore();
    const house = store.houses.find((r) => r.id === houseId);
    if (!house || !house.publicMedia?.image) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const parsed = parsePublicImageDataUrl(house.publicMedia.image, { maxBytes: MAX_PUBLIC_IMAGE_BYTES });
    if (parsed.error || !parsed.bytes) return res.status(500).json({ ok: false, error: 'INVALID_PUBLIC_IMAGE' });
    res.setHeader('Content-Type', parsed.mime || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.end(parsed.bytes);
  });

  router.post('/house/:id/public-media', (req, res) => {
    const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
    if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
    const store = readStore();
    const house = store.houses.find((r) => r.id === houseId);
    if (!house) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const auth = verifyHouseAuth(req, house, { skewMs: HOUSE_AUTH_SKEW_MS });
    if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

    const body = req.body || {};
    const hasImage = Object.prototype.hasOwnProperty.call(body, 'image');
    const hasPrompt = Object.prototype.hasOwnProperty.call(body, 'prompt');
    const clear = body?.clear === true;
    if (!clear && !hasImage && !hasPrompt) {
      return res.status(400).json({ ok: false, error: 'MISSING_PUBLIC_MEDIA' });
    }

    let nextImage = house.publicMedia?.image || null;
    let nextPrompt = house.publicMedia?.prompt || null;

    if (clear) {
      nextImage = null;
      nextPrompt = null;
    }

    if (hasImage) {
      if (body.image == null || body.image === '') {
        nextImage = null;
      } else {
        const parsed = parsePublicImageDataUrl(body.image, { maxBytes: MAX_PUBLIC_IMAGE_BYTES });
        if (parsed.error) return res.status(400).json({ ok: false, error: parsed.error });
        nextImage = parsed.dataUrl;
      }
    }

    if (hasPrompt) {
      if (body.prompt != null && typeof body.prompt !== 'string') {
        return res.status(400).json({ ok: false, error: 'INVALID_PUBLIC_PROMPT' });
      }
      nextPrompt = normalizePublicPrompt(body.prompt, { maxChars: MAX_PUBLIC_PROMPT_CHARS });
    }

    if (nextImage && !nextPrompt) {
      return res.status(400).json({ ok: false, error: 'PUBLIC_PROMPT_REQUIRED' });
    }
    if (nextPrompt && !nextImage) {
      return res.status(400).json({ ok: false, error: 'PUBLIC_IMAGE_REQUIRED' });
    }

    if (!nextImage && !nextPrompt) {
      house.publicMedia = null;
    } else {
      house.publicMedia = {
        image: nextImage,
        prompt: nextPrompt,
        updatedAt: nowIso()
      };
    }

    writeStore(store);
    res.json({ ok: true, publicMedia: serializePublicMedia(house) });
  });

  router.post('/house/:id/append', (req, res) => {
    const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
    if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
    const ciphertext = req.body?.ciphertext;
    const author = typeof req.body?.author === 'string' ? req.body.author.trim() : 'unknown';
    if (!ciphertext || typeof ciphertext.iv !== 'string' || typeof ciphertext.ct !== 'string') {
      return res.status(400).json({ ok: false, error: 'INVALID_CIPHERTEXT' });
    }

    const store = readStore();
    const house = store.houses.find((r) => r.id === houseId);
    if (!house) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const auth = verifyHouseAuth(req, house, { skewMs: HOUSE_AUTH_SKEW_MS });
    if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });
    house.entries = Array.isArray(house.entries) ? house.entries : [];
    if (house.entries.length >= MAX_HOUSE_ENTRIES) {
      return res.status(403).json({ ok: false, error: 'HOUSE_FULL' });
    }
    house.entries.push({
      id: `re_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      createdAt: nowIso(),
      author,
      ciphertext
    });

    const ctLen = typeof ciphertext.ct === 'string' ? ciphertext.ct.length : 0;
    if (ctLen >= 32 && typeof emitMilestone === 'function') {
      emitMilestone(store, {
        houseId,
        event: 'HOUSE_APPEND',
        source: 'human',
        value: 1,
        meta: { ctLen }
      });
    }
    writeStore(store);
    res.json({ ok: true });
  });

  router.post('/house/:id/share', (req, res) => {
    const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
    if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
    const store = readStore();
    const house = store.houses.find((r) => r.id === houseId);
    if (!house) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const auth = verifyHouseAuth(req, house, { skewMs: HOUSE_AUTH_SKEW_MS });
    if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

    let share = store.shares.find((x) => x.houseId === houseId);
    const session = getSessionByHouseId(houseId);

    if (!share) {
      if (store.shares.length >= MAX_SHARES) {
        return res.status(403).json({ ok: false, error: 'STORE_FULL' });
      }
      const shareId = `sh_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      share = {
        id: shareId,
        createdAt: nowIso(),
        matchedElement: session?.match?.elementId || null,
        agentName: session?.agent?.name || 'OpenClaw',
        mode: session?.flow === 'agent_solo' ? 'agent_solo' : 'agent',
        houseId,
        xPostUrl: session?.human?.xPostUrl || null,
        humanHandle: session?.human?.xHandle || null,
        agentPosts: {
          moltbookUrl: session?.agent?.posts?.moltbookUrl || null
        },
        referrals: 0,
        locked: true,
        lockedAt: nowIso(),
        optIn: { human: true, agent: true },
        public: false
      };

      store.shares.push(share);
    }

    ensurePublicTeamForShare(store, share, session, { extractXHandle });
    writeStore(store);

    if (session) {
      session.share.id = share.id;
      session.share.createdAt = share.createdAt;
      session.human.optIn = true;
      session.agent.optIn = true;
    }

    res.json({ ok: true, shareId: share.id, sharePath: `/s/${share.id}` });
  });

  router.post('/house/:id/posts', (req, res) => {
    const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
    if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
    const store = readStore();
    const house = store.houses.find((r) => r.id === houseId);
    if (!house) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const auth = verifyHouseAuth(req, house, { skewMs: HOUSE_AUTH_SKEW_MS });
    if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

    const rawX = typeof req.body?.xPostUrl === 'string' ? req.body.xPostUrl.trim() : '';
    const rawM = typeof req.body?.moltbookUrl === 'string' ? req.body.moltbookUrl.trim() : '';
    const xPostUrl = rawX ? sanitizeUrl(rawX) : null;
    const moltbookUrl = rawM ? sanitizeUrl(rawM) : null;
    if (rawX && !xPostUrl) return res.status(400).json({ ok: false, error: 'INVALID_URL' });
    if (rawM && !moltbookUrl) return res.status(400).json({ ok: false, error: 'INVALID_URL' });

    const share = store.shares.find((x) => x.houseId === houseId);
    if (!share) return res.status(404).json({ ok: false, error: 'SHARE_NOT_FOUND' });

    share.xPostUrl = xPostUrl;
    share.humanHandle = extractXHandle(xPostUrl) || null;
    share.agentPosts = share.agentPosts || {};
    share.agentPosts.moltbookUrl = moltbookUrl;

    const pub = store.publicTeams.find((p) => p.shareId === share.id);
    if (pub) {
      pub.xPostUrl = xPostUrl;
      pub.humanHandle = share.humanHandle;
      pub.agentPosts = pub.agentPosts || {};
      pub.agentPosts.moltbookUrl = moltbookUrl;
    }

    const session = getSessionByHouseId(houseId);
    if (session) {
      session.human.xPostUrl = xPostUrl;
      session.human.xHandle = share.humanHandle;
      session.agent.posts.moltbookUrl = moltbookUrl;
    }

    writeStore(store);
    res.json({ ok: true, shareId: share.id, sharePath: `/s/${share.id}` });
  });

  return router;
}

module.exports = { createHousesRouter };
