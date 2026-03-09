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

function getLiveSuiteManifest() {
  return LIVE_SUITE_MANIFEST.map((entry) => ({
    ...entry,
    requiredEnv: Array.isArray(entry.requiredEnv) ? [...entry.requiredEnv] : [],
  }));
}

module.exports = {
  getLiveSuiteManifest,
};
