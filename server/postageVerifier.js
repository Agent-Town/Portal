const crypto = require('crypto');

const HEX_DIGEST_RE = /^[0-9a-f]{64}$/i;
const RECEIPT_ID_RE = /^[A-Za-z0-9:_-]{6,120}$/;
const MAX_POW_NONCE_CHARS = 256;

function toInt(value, fallback = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.floor(num);
}

function normalizeReceiptId(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function isDispatchReceiptId(receiptId) {
  return typeof receiptId === 'string' && receiptId.startsWith('dr_');
}

function countLeadingZeroBitsHex(hexDigest) {
  let bits = 0;
  for (const ch of hexDigest) {
    const nibble = Number.parseInt(ch, 16);
    if (!Number.isFinite(nibble) || nibble < 0 || nibble > 15) return 0;
    if (nibble === 0) {
      bits += 4;
      continue;
    }
    if ((nibble & 0b1000) === 0) bits += 1;
    if ((nibble & 0b0100) === 0) bits += 1;
    if ((nibble & 0b0010) === 0) bits += 1;
    break;
  }
  return bits;
}

function createPostageVerifier(options = {}) {
  const basePowMinDifficulty = Math.max(1, toInt(options.basePowMinDifficulty, 1));
  const anonymousPowMinDifficulty = Math.max(basePowMinDifficulty, toInt(options.anonymousPowMinDifficulty, 8));
  const resolveReceipt = typeof options.resolveReceipt === 'function' ? options.resolveReceipt : null;

  function verifyPow(postage, context = {}) {
    const requirePostageAnonymous = context?.requirePostageAnonymous === true;
    const isAnonymous = !context?.fromHouseId;
    const requiredDifficulty = requirePostageAnonymous && isAnonymous
      ? anonymousPowMinDifficulty
      : basePowMinDifficulty;

    if (toInt(postage?.difficulty, 0) < requiredDifficulty) {
      const err = new Error('POSTAGE_POW_DIFFICULTY_TOO_LOW');
      err.requiredDifficulty = requiredDifficulty;
      err.actualDifficulty = toInt(postage?.difficulty, 0);
      throw err;
    }

    const nonce = typeof postage?.nonce === 'string' ? postage.nonce.trim() : '';
    const digest = typeof postage?.digest === 'string' ? postage.digest.trim().toLowerCase() : '';
    if (!nonce || nonce.length > MAX_POW_NONCE_CHARS || !digest || !HEX_DIGEST_RE.test(digest)) {
      throw new Error('POSTAGE_POW_DIGEST_INVALID');
    }

    const expectedDigest = crypto
      .createHash('sha256')
      .update(`pony_pow_v1|${nonce}`, 'utf8')
      .digest('hex');
    if (digest !== expectedDigest) throw new Error('POSTAGE_POW_DIGEST_INVALID');

    if (countLeadingZeroBitsHex(digest) < toInt(postage?.difficulty, 0)) {
      throw new Error('POSTAGE_POW_DIGEST_INVALID');
    }
  }

  function verifyReceipt(postage, context = {}) {
    const receipts = Array.isArray(postage?.receipts) ? postage.receipts : [];
    if (!receipts.length) throw new Error('POSTAGE_RECEIPT_EMPTY');

    const normalizedReceipts = [];
    const seen = new Set();
    for (const rawReceiptId of receipts) {
      const receiptId = normalizeReceiptId(rawReceiptId);
      if (!receiptId || !RECEIPT_ID_RE.test(receiptId)) {
        const err = new Error('POSTAGE_RECEIPT_INVALID');
        err.receiptId = receiptId || null;
        throw err;
      }
      if (seen.has(receiptId)) {
        const err = new Error('POSTAGE_RECEIPT_DUPLICATE');
        err.receiptId = receiptId;
        throw err;
      }
      seen.add(receiptId);
      normalizedReceipts.push(receiptId);
    }

    if (resolveReceipt) {
      for (const receiptId of normalizedReceipts) {
        if (!isDispatchReceiptId(receiptId)) continue;
        let resolved = null;
        try {
          resolved = resolveReceipt({ receiptId, context });
        } catch {
          throw new Error('POSTAGE_RECEIPT_LOOKUP_FAILED');
        }
        if (!resolved) {
          const err = new Error('POSTAGE_RECEIPT_NOT_FOUND');
          err.receiptId = receiptId;
          throw err;
        }
        if (context?.toHouseId && resolved?.toHouseId && resolved.toHouseId !== context.toHouseId) {
          const err = new Error('POSTAGE_RECEIPT_HOUSE_MISMATCH');
          err.receiptId = receiptId;
          err.receiptToHouseId = resolved.toHouseId;
          err.expectedToHouseId = context.toHouseId;
          throw err;
        }
      }
    }

    return {
      ok: true,
      kind: 'receipt.v1',
      mode: resolveReceipt ? 'dispatch' : 'stub',
      receipts: normalizedReceipts
    };
  }

  return {
    verify({ postage, context } = {}) {
      if (!postage || postage.kind === 'none') return { ok: true, kind: 'none' };
      if (postage.kind === 'pow.v1') {
        verifyPow(postage, context);
        return { ok: true, kind: 'pow.v1' };
      }
      if (postage.kind === 'receipt.v1') {
        return verifyReceipt(postage, context);
      }
      throw new Error('INVALID_POSTAGE_KIND');
    }
  };
}

module.exports = {
  createPostageVerifier
};
