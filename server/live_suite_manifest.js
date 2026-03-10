const LIVE_SUITE_MANIFEST = Object.freeze([
  {
    suiteId: 'privy-guest',
    command: 'npm run test:privy-live',
    requiredEnv: ['PRIVY_APP_ID', 'PRIVY_LOGIN_METHOD=guest'],
    requiredFlag: 'PRIVY_LIVE_REQUIRED',
    defaultMode: 'skip',
    description: 'Real Privy guest login plus embedded Solana and EVM wallet smoke.',
  },
  {
    suiteId: 'privy-email-otp',
    command: 'npm run test:privy-email-live',
    requiredEnv: ['PRIVY_APP_ID', 'PRIVY_LOGIN_METHOD=email', 'PRIVY_EMAIL_OTP_PROVIDER', 'PRIVY_EMAIL_OTP_FETCH_URL', 'PRIVY_EMAIL_OTP_TEST_EMAIL'],
    requiredFlag: 'PRIVY_EMAIL_OTP_REQUIRED',
    defaultMode: 'skip',
    description: 'Optional real Privy email-code lane with automated OTP retrieval.',
  },
  {
    suiteId: 'sepolia-wallet',
    command: 'REAL_SEPOLIA_WALLET_TEST=1 npx playwright test e2e/10_sepolia_wallet_reuse.spec.js',
    requiredEnv: ['REAL_SEPOLIA_WALLET_TEST=1', 'SEPOLIA_TEST_WALLET_ADDRESS'],
    requiredFlag: 'REAL_SEPOLIA_WALLET_TEST',
    defaultMode: 'skip',
    description: 'Optional real Sepolia wallet reuse and balance checks.',
  },
]);

function isTruthy(value) {
  return /^(1|true|yes|on)$/i.test(String(value || '').trim());
}

function parseRequiredEnvEntry(raw) {
  const value = String(raw || '').trim();
  const eqIndex = value.indexOf('=');
  if (eqIndex < 0) {
    return {
      raw: value,
      name: value,
      expectedValue: '',
      expectsExactValue: false,
    };
  }
  return {
    raw: value,
    name: value.slice(0, eqIndex).trim(),
    expectedValue: value.slice(eqIndex + 1).trim(),
    expectsExactValue: true,
  };
}

function getLiveSuiteManifest() {
  return LIVE_SUITE_MANIFEST.map((entry) => ({
    ...entry,
    requiredEnv: Array.isArray(entry.requiredEnv) ? [...entry.requiredEnv] : [],
  }));
}

function inspectLiveSuiteEnv(suite, env = process.env) {
  const requiredEnv = Array.isArray(suite?.requiredEnv) ? suite.requiredEnv : [];
  const requirements = requiredEnv
    .map(parseRequiredEnvEntry)
    .filter((entry) => entry.name);
  const missing = [];
  const mismatched = [];
  for (const requirement of requirements) {
    const actualValue = String(env?.[requirement.name] || '').trim();
    if (!actualValue) {
      missing.push(requirement.expectsExactValue ? requirement.raw : requirement.name);
      continue;
    }
    if (requirement.expectsExactValue && actualValue !== requirement.expectedValue) {
      mismatched.push(requirement.raw);
    }
  }
  return {
    ok: missing.length === 0 && mismatched.length === 0,
    missing,
    mismatched,
    requirements: requirements.map((entry) => ({
      name: entry.name,
      expectsExactValue: entry.expectsExactValue,
      expectedValue: entry.expectsExactValue ? entry.expectedValue : null,
      present: String(env?.[entry.name] || '').trim().length > 0,
      matchesExpected: entry.expectsExactValue
        ? String(env?.[entry.name] || '').trim() === entry.expectedValue
        : String(env?.[entry.name] || '').trim().length > 0,
    })),
  };
}

function getLiveSuiteStatuses(env = process.env) {
  return getLiveSuiteManifest().map((suite) => {
    const validation = inspectLiveSuiteEnv(suite, env);
    const requiredFlag = String(suite?.requiredFlag || '').trim();
    const requiredFlagEnabled = requiredFlag ? isTruthy(env?.[requiredFlag]) : false;
    return {
      suiteId: String(suite?.suiteId || ''),
      command: String(suite?.command || ''),
      description: String(suite?.description || ''),
      defaultMode: String(suite?.defaultMode || ''),
      requiredFlag,
      requiredFlagEnabled,
      ready: validation.ok,
      mode: validation.ok ? 'ready' : (requiredFlagEnabled ? 'blocked' : 'skip'),
      missing: validation.missing,
      mismatched: validation.mismatched,
      requirements: validation.requirements,
    };
  });
}

module.exports = {
  getLiveSuiteManifest,
  getLiveSuiteStatuses,
  inspectLiveSuiteEnv,
  isTruthy,
  parseRequiredEnvEntry,
};
