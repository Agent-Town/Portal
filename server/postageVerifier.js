const HEX_DIGEST_RE = /^[0-9a-f]+$/i;

function toInt(value, fallback = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.floor(num);
}

function createPostageVerifier(options = {}) {
  const basePowMinDifficulty = Math.max(1, toInt(options.basePowMinDifficulty, 1));
  const anonymousPowMinDifficulty = Math.max(basePowMinDifficulty, toInt(options.anonymousPowMinDifficulty, 8));

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

    const digest = typeof postage?.digest === 'string' ? postage.digest.trim() : '';
    if (!digest || !HEX_DIGEST_RE.test(digest) || digest.length < 6) {
      throw new Error('POSTAGE_POW_DIGEST_INVALID');
    }
  }

  function verifyReceipt(postage) {
    const receipts = Array.isArray(postage?.receipts) ? postage.receipts : [];
    if (!receipts.length) throw new Error('POSTAGE_RECEIPT_INVALID');
    return {
      ok: true,
      mode: 'stub'
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
