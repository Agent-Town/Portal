const fs = require('fs');
const path = require('path');

const { isConfiguredWalletConfig } = require('../e2e/helpers/sepolia_wallet');

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
    description: 'Optional real Privy email-code lane that proves wallet exposure plus Town Hall ERC-8004 registration with automated OTP retrieval.',
  },
  {
    suiteId: 'sepolia-wallet',
    command: 'npm run test:sepolia-live',
    requiredEnv: ['REAL_SEPOLIA_WALLET_TEST=1'],
    requiredFlag: 'REAL_SEPOLIA_WALLET_TEST',
    defaultMode: 'skip',
    description: 'Optional real Sepolia wallet reuse and on-chain balance readiness check.',
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

function inspectSepoliaWalletConfig(env = process.env) {
  const configuredPath = typeof env?.LOCAL_SEPOLIA_WALLET_FILE === 'string' ? env.LOCAL_SEPOLIA_WALLET_FILE.trim() : '';
  const filePath = configuredPath
    ? path.resolve(configuredPath)
    : path.join(process.cwd(), 'data', 'local.sepolia.wallet.json');
  if (!fs.existsSync(filePath)) {
    return {
      ok: false,
      missing: ['LOCAL_SEPOLIA_WALLET_CONFIGURED'],
      mismatched: [],
    };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (isConfiguredWalletConfig(parsed)) {
      return {
        ok: true,
        missing: [],
        mismatched: [],
      };
    }
  } catch {
    // Fall through to stable local-config missing signal.
  }
  return {
    ok: false,
    missing: ['LOCAL_SEPOLIA_WALLET_CONFIGURED'],
    mismatched: [],
  };
}

function getLiveSuiteStatuses(env = process.env) {
  return getLiveSuiteManifest().map((suite) => {
    const validation = inspectLiveSuiteEnv(suite, env);
    const localValidation = String(suite?.suiteId || '') === 'sepolia-wallet'
      ? inspectSepoliaWalletConfig(env)
      : { ok: true, missing: [], mismatched: [] };
    const missing = [...validation.missing, ...localValidation.missing];
    const mismatched = [...validation.mismatched, ...localValidation.mismatched];
    const requiredFlag = String(suite?.requiredFlag || '').trim();
    const requiredFlagEnabled = requiredFlag ? isTruthy(env?.[requiredFlag]) : false;
    const ready = missing.length === 0 && mismatched.length === 0;
    return {
      suiteId: String(suite?.suiteId || ''),
      command: String(suite?.command || ''),
      description: String(suite?.description || ''),
      defaultMode: String(suite?.defaultMode || ''),
      requiredFlag,
      requiredFlagEnabled,
      ready,
      mode: ready ? 'ready' : (requiredFlagEnabled ? 'blocked' : 'skip'),
      missing,
      mismatched,
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
