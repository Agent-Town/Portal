const DEFAULT_STUB_CODE = '246810';

const records = [];

function normalizeProvider(provider = '') {
  const normalized = String(provider || '').trim().toLowerCase();
  return normalized || 'stub';
}

function normalizeEmail(email = '') {
  return String(email || '').trim().toLowerCase();
}

function issueEmailOtp({
  provider = 'stub',
  email = '',
  code = '',
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedProvider = normalizeProvider(provider);
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedProvider || !normalizedEmail) {
    throw new Error('EMAIL_OTP_INVALID');
  }
  const normalizedCode = String(code || '').trim() || DEFAULT_STUB_CODE;
  const record = {
    otpId: `otp_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    provider: normalizedProvider,
    email: normalizedEmail,
    code: normalizedCode,
    consumed: false,
    issuedAt: nowIso,
    consumedAt: null,
  };
  records.push(record);
  return { ...record };
}

function getLatestEmailOtp({
  provider = 'stub',
  email = '',
} = {}) {
  const normalizedProvider = normalizeProvider(provider);
  const normalizedEmail = normalizeEmail(email);
  for (let index = records.length - 1; index >= 0; index -= 1) {
    const record = records[index];
    if (record.provider !== normalizedProvider || record.email !== normalizedEmail) continue;
    return { ...record };
  }
  return null;
}

function consumeEmailOtp({
  provider = 'stub',
  email = '',
  code = '',
  nowIso = new Date().toISOString(),
} = {}) {
  const normalizedProvider = normalizeProvider(provider);
  const normalizedEmail = normalizeEmail(email);
  const normalizedCode = String(code || '').trim();
  if (!normalizedProvider || !normalizedEmail || !normalizedCode) {
    throw new Error('EMAIL_OTP_INVALID');
  }
  const record = getLatestEmailOtp({
    provider: normalizedProvider,
    email: normalizedEmail,
  });
  if (!record) {
    return {
      ok: false,
      error: 'OTP_NOT_FOUND',
      record: null,
    };
  }
  if (record.code !== normalizedCode) {
    return {
      ok: false,
      error: 'OTP_INVALID',
      record,
    };
  }
  const stored = records.find((entry) => entry.otpId === record.otpId) || null;
  if (!stored) {
    return {
      ok: false,
      error: 'OTP_NOT_FOUND',
      record: null,
    };
  }
  if (stored.consumed) {
    return {
      ok: false,
      error: 'OTP_ALREADY_CONSUMED',
      record: { ...stored },
    };
  }
  stored.consumed = true;
  stored.consumedAt = nowIso;
  return {
    ok: true,
    error: null,
    record: { ...stored },
  };
}

function getEmailOtpActivity({
  provider = '',
  email = '',
} = {}) {
  const normalizedProvider = normalizeProvider(provider || 'stub');
  const normalizedEmail = normalizeEmail(email);
  return records
    .filter((record) => {
      if (provider && record.provider !== normalizedProvider) return false;
      if (normalizedEmail && record.email !== normalizedEmail) return false;
      return true;
    })
    .map((record) => ({ ...record }));
}

function resetEmailOtpAdapter() {
  records.length = 0;
}

module.exports = {
  consumeEmailOtp,
  getEmailOtpActivity,
  getLatestEmailOtp,
  issueEmailOtp,
  resetEmailOtpAdapter,
};
