const SUPPORTED_EMAIL_OTP_PROVIDERS = Object.freeze(['http-json', 'imap', 'gmail-imap']);
const EMAIL_OTP_PROVIDER_REQUIREMENT = `PRIVY_EMAIL_OTP_PROVIDER=${SUPPORTED_EMAIL_OTP_PROVIDERS.join('|')}`;

function normalizeEmailOtpProvider(value) {
  return String(value || '').trim().toLowerCase();
}

function isTruthy(value) {
  return /^(1|true|yes|on)$/i.test(String(value || '').trim());
}

function parseInteger(value, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const parsed = Number.parseInt(String(value || '').trim(), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function safeString(value) {
  return String(value || '').trim();
}

function createRequirement(name, {
  expectedValue = null,
  actualValue = '',
  present = false,
  matchesExpected = false,
} = {}) {
  return {
    name,
    expectsExactValue: typeof expectedValue === 'string' && expectedValue.length > 0,
    expectedValue: typeof expectedValue === 'string' && expectedValue.length > 0 ? expectedValue : null,
    present: Boolean(present),
    matchesExpected: Boolean(matchesExpected),
    active: true,
    raw: typeof expectedValue === 'string' && expectedValue.length > 0 ? `${name}=${expectedValue}` : name,
    actualValue: safeString(actualValue),
  };
}

function getEmailOtpProviderEnvMap() {
  return {
    'http-json': [
      'PRIVY_EMAIL_OTP_PROVIDER=http-json',
      'PRIVY_EMAIL_OTP_TEST_EMAIL',
      'PRIVY_EMAIL_OTP_FETCH_URL',
    ],
    imap: [
      'PRIVY_EMAIL_OTP_PROVIDER=imap',
      'PRIVY_EMAIL_OTP_TEST_EMAIL',
      'PRIVY_EMAIL_OTP_IMAP_HOST',
      'PRIVY_EMAIL_OTP_IMAP_PASSWORD',
    ],
    'gmail-imap': [
      'PRIVY_EMAIL_OTP_PROVIDER=gmail-imap',
      'PRIVY_EMAIL_OTP_TEST_EMAIL',
      'PRIVY_EMAIL_OTP_IMAP_PASSWORD',
    ],
  };
}

function inspectLiveEmailOtpEnv(env = process.env) {
  const provider = normalizeEmailOtpProvider(env?.PRIVY_EMAIL_OTP_PROVIDER);
  const testEmail = safeString(env?.PRIVY_EMAIL_OTP_TEST_EMAIL);
  const fetchUrl = safeString(env?.PRIVY_EMAIL_OTP_FETCH_URL);
  const imapHost = safeString(env?.PRIVY_EMAIL_OTP_IMAP_HOST);
  const imapPassword = safeString(env?.PRIVY_EMAIL_OTP_IMAP_PASSWORD);
  const requirements = [];
  const missing = [];
  const mismatched = [];

  const providerPresent = provider.length > 0;
  const providerSupported = SUPPORTED_EMAIL_OTP_PROVIDERS.includes(provider);
  requirements.push(createRequirement('PRIVY_EMAIL_OTP_PROVIDER', {
    expectedValue: SUPPORTED_EMAIL_OTP_PROVIDERS.join('|'),
    actualValue: provider,
    present: providerPresent,
    matchesExpected: providerSupported,
  }));
  if (!providerPresent) {
    missing.push('PRIVY_EMAIL_OTP_PROVIDER');
  } else if (!providerSupported) {
    mismatched.push(EMAIL_OTP_PROVIDER_REQUIREMENT);
  }

  requirements.push(createRequirement('PRIVY_EMAIL_OTP_TEST_EMAIL', {
    actualValue: testEmail,
    present: testEmail.length > 0,
    matchesExpected: testEmail.length > 0,
  }));
  if (!testEmail) {
    missing.push('PRIVY_EMAIL_OTP_TEST_EMAIL');
  }

  if (provider === 'http-json') {
    requirements.push(createRequirement('PRIVY_EMAIL_OTP_FETCH_URL', {
      actualValue: fetchUrl,
      present: fetchUrl.length > 0,
      matchesExpected: fetchUrl.length > 0,
    }));
    if (!fetchUrl) missing.push('PRIVY_EMAIL_OTP_FETCH_URL');
  }

  if (provider === 'imap' || provider === 'gmail-imap') {
    const resolvedHost = provider === 'gmail-imap' ? (imapHost || 'imap.gmail.com') : imapHost;
    requirements.push(createRequirement('PRIVY_EMAIL_OTP_IMAP_HOST', {
      actualValue: resolvedHost,
      present: resolvedHost.length > 0,
      matchesExpected: resolvedHost.length > 0,
    }));
    if (provider === 'imap' && !resolvedHost) {
      missing.push('PRIVY_EMAIL_OTP_IMAP_HOST');
    }

    requirements.push(createRequirement('PRIVY_EMAIL_OTP_IMAP_PASSWORD', {
      actualValue: imapPassword ? 'configured' : '',
      present: imapPassword.length > 0,
      matchesExpected: imapPassword.length > 0,
    }));
    if (!imapPassword) {
      missing.push('PRIVY_EMAIL_OTP_IMAP_PASSWORD');
    }
  }

  return {
    ok: missing.length === 0 && mismatched.length === 0,
    provider,
    missing,
    mismatched,
    requirements,
    providerEnv: getEmailOtpProviderEnvMap(),
  };
}

function buildEmailOtpFetchUrl(fetchUrl, email) {
  const raw = safeString(fetchUrl);
  if (!raw) return '';
  if (raw.includes('{email}')) {
    return raw.replaceAll('{email}', encodeURIComponent(email));
  }
  const url = new URL(raw);
  if (!url.searchParams.has('email')) {
    url.searchParams.set('email', email);
  }
  return url.toString();
}

function getLiveEmailOtpConfig(env = process.env) {
  const inspection = inspectLiveEmailOtpEnv(env);
  if (!inspection.ok) {
    const issues = [...inspection.missing, ...inspection.mismatched];
    throw new Error(`LIVE_EMAIL_OTP_ENV_INVALID:${issues.join(',')}`);
  }
  const provider = inspection.provider;
  const testEmail = safeString(env?.PRIVY_EMAIL_OTP_TEST_EMAIL);
  const timeoutMs = parseInteger(env?.PRIVY_EMAIL_OTP_TIMEOUT_MS, 120000, { min: 5000, max: 600000 });
  const pollIntervalMs = parseInteger(env?.PRIVY_EMAIL_OTP_POLL_INTERVAL_MS, 2000, { min: 250, max: 30000 });
  const subjectHint = safeString(env?.PRIVY_EMAIL_OTP_SUBJECT_HINT) || 'Privy';
  const regexSource = safeString(env?.PRIVY_EMAIL_OTP_REGEX);
  const customRegex = regexSource ? new RegExp(regexSource) : null;
  if (provider === 'http-json') {
    return {
      provider,
      testEmail,
      timeoutMs,
      pollIntervalMs,
      fetchUrl: safeString(env?.PRIVY_EMAIL_OTP_FETCH_URL),
      subjectHint,
      customRegex,
    };
  }
  const host = provider === 'gmail-imap'
    ? (safeString(env?.PRIVY_EMAIL_OTP_IMAP_HOST) || 'imap.gmail.com')
    : safeString(env?.PRIVY_EMAIL_OTP_IMAP_HOST);
  return {
    provider,
    testEmail,
    timeoutMs,
    pollIntervalMs,
    subjectHint,
    customRegex,
    imap: {
      host,
      port: parseInteger(env?.PRIVY_EMAIL_OTP_IMAP_PORT, 993, { min: 1, max: 65535 }),
      secure: env?.PRIVY_EMAIL_OTP_IMAP_SECURE == null || String(env.PRIVY_EMAIL_OTP_IMAP_SECURE).trim() === ''
        ? true
        : isTruthy(env?.PRIVY_EMAIL_OTP_IMAP_SECURE),
      user: safeString(env?.PRIVY_EMAIL_OTP_IMAP_USER) || testEmail,
      password: safeString(env?.PRIVY_EMAIL_OTP_IMAP_PASSWORD),
      mailbox: safeString(env?.PRIVY_EMAIL_OTP_IMAP_MAILBOX) || 'INBOX',
      fromHint: safeString(env?.PRIVY_EMAIL_OTP_IMAP_FROM),
      subjectHint,
      lookbackMinutes: parseInteger(env?.PRIVY_EMAIL_OTP_LOOKBACK_MINUTES, 10, { min: 1, max: 240 }),
      maxMessages: parseInteger(env?.PRIVY_EMAIL_OTP_MAX_MESSAGES, 20, { min: 1, max: 100 }),
    },
  };
}

function extractLiveEmailOtpCodeFromSource(source, {
  subjectHint = '',
  customRegex = null,
} = {}) {
  const raw = Buffer.isBuffer(source)
    ? source.toString('utf8')
    : (typeof source === 'string' ? source : '');
  if (!raw) return '';
  const normalized = raw.replace(/\r\n/g, '\n');
  const lower = normalized.toLowerCase();
  const normalizedSubjectHint = safeString(subjectHint).toLowerCase();
  if (normalizedSubjectHint && !lower.includes(normalizedSubjectHint)) {
    return '';
  }
  if (customRegex) {
    const customMatch = normalized.match(customRegex);
    if (customMatch) {
      return safeString(customMatch[1] || customMatch[0]).replace(/\D/g, '').slice(0, 6);
    }
  }
  const patterns = [
    /\b(\d{6})\b/,
    /code[^0-9]{0,20}(\d{6})/i,
    /otp[^0-9]{0,20}(\d{6})/i,
    /verification[^0-9]{0,20}(\d{6})/i,
  ];
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match && match[1]) {
      return safeString(match[1]);
    }
  }
  return '';
}

async function fetchEmailOtpCodeViaHttpJson(config, email) {
  const deadline = Date.now() + config.timeoutMs;
  while (Date.now() < deadline) {
    const url = buildEmailOtpFetchUrl(config.fetchUrl, email);
    const response = await fetch(url, { method: 'GET' });
    if (response.ok) {
      const payload = await response.json().catch(() => ({}));
      const code = safeString(payload?.code);
      if (code) return code;
    }
    await new Promise((resolve) => setTimeout(resolve, config.pollIntervalMs));
  }
  throw new Error('EMAIL_OTP_TIMEOUT');
}

function envelopeAddressesToStrings(addressRows) {
  if (!Array.isArray(addressRows)) return [];
  return addressRows
    .map((row) => {
      const mailbox = safeString(row?.mailbox);
      const host = safeString(row?.host);
      if (!mailbox || !host) return '';
      return `${mailbox}@${host}`.toLowerCase();
    })
    .filter(Boolean);
}

function imapMessageMatches(message, {
  earliestTimestampMs,
  fromHint = '',
  email = '',
  subjectHint = '',
} = {}) {
  const internalDate = message?.internalDate instanceof Date ? message.internalDate.getTime() : 0;
  if (internalDate && internalDate < earliestTimestampMs) return false;

  const normalizedEmail = safeString(email).toLowerCase();
  if (normalizedEmail) {
    const toAddresses = envelopeAddressesToStrings(message?.envelope?.to);
    if (toAddresses.length > 0 && !toAddresses.includes(normalizedEmail)) {
      return false;
    }
  }

  const normalizedFromHint = safeString(fromHint).toLowerCase();
  if (normalizedFromHint) {
    const fromAddresses = envelopeAddressesToStrings(message?.envelope?.from);
    const matchesFrom = fromAddresses.some((value) => value.includes(normalizedFromHint));
    if (!matchesFrom) return false;
  }

  const normalizedSubjectHint = safeString(subjectHint).toLowerCase();
  if (normalizedSubjectHint) {
    const subject = safeString(message?.envelope?.subject).toLowerCase();
    if (subject && subject.includes(normalizedSubjectHint)) return true;
  }
  return true;
}

async function readLatestEmailOtpCodeViaImap(config, email) {
  const { ImapFlow } = require('imapflow');
  const client = new ImapFlow({
    host: config.imap.host,
    port: config.imap.port,
    secure: config.imap.secure,
    auth: {
      user: config.imap.user,
      pass: config.imap.password,
    },
    logger: false,
  });
  const earliestTimestampMs = Date.now() - (config.imap.lookbackMinutes * 60 * 1000);
  await client.connect();
  try {
    const deadline = Date.now() + config.timeoutMs;
    while (Date.now() < deadline) {
      const lock = await client.getMailboxLock(config.imap.mailbox);
      try {
        const total = Number(client.mailbox?.exists || 0);
        if (total > 0) {
          const start = Math.max(1, total - config.imap.maxMessages + 1);
          const messages = [];
          for await (const message of client.fetch(`${start}:*`, {
            uid: true,
            envelope: true,
            source: true,
            internalDate: true,
          })) {
            messages.push(message);
          }
          messages.sort((a, b) => Number(b?.uid || 0) - Number(a?.uid || 0));
          for (const message of messages) {
            if (!imapMessageMatches(message, {
              earliestTimestampMs,
              fromHint: config.imap.fromHint,
              email,
              subjectHint: config.imap.subjectHint,
            })) {
              continue;
            }
            const code = extractLiveEmailOtpCodeFromSource(message?.source, {
              subjectHint: config.imap.subjectHint,
              customRegex: config.customRegex,
            });
            if (code) return code;
          }
        }
      } finally {
        lock.release();
      }
      await new Promise((resolve) => setTimeout(resolve, config.pollIntervalMs));
    }
  } finally {
    await client.logout().catch(() => {});
  }
  throw new Error('EMAIL_OTP_TIMEOUT');
}

async function fetchLiveEmailOtpCode(email, {
  env = process.env,
} = {}) {
  const config = getLiveEmailOtpConfig(env);
  const targetEmail = safeString(email) || config.testEmail;
  if (config.provider === 'http-json') {
    return fetchEmailOtpCodeViaHttpJson(config, targetEmail);
  }
  return readLatestEmailOtpCodeViaImap(config, targetEmail);
}

module.exports = {
  EMAIL_OTP_PROVIDER_REQUIREMENT,
  SUPPORTED_EMAIL_OTP_PROVIDERS,
  buildEmailOtpFetchUrl,
  extractLiveEmailOtpCodeFromSource,
  fetchLiveEmailOtpCode,
  getEmailOtpProviderEnvMap,
  getLiveEmailOtpConfig,
  inspectLiveEmailOtpEnv,
  normalizeEmailOtpProvider,
};
