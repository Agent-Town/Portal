// Playwright config for .env-backed Privy verification runs.
const path = require('path');
const base = require('./playwright.config');

const PORT = Number(process.env.PW_PORT || 4173);

module.exports = {
  ...base,
  use: {
    ...(base.use || {}),
    // Privy/start flow canonicalizes loopback hosts to localhost.
    // Keep Playwright on the same origin so cookies + localStorage survive
    // document navigations between /start, /app, and /create.
    baseURL: `http://localhost:${PORT}`,
  },
  webServer: {
    ...(base.webServer || {}),
    url: `http://localhost:${PORT}/api/health`,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: String(PORT),
      TEST_RESET_TOKEN: 'test-reset',
      ADMIN_TOKEN: 'test-admin',
      LOAD_DOTENV_IN_TEST: '1',
      ENABLE_PRIVY_IN_TEST: '1',
      START_PAGE_ENABLED: String(process.env.START_PAGE_ENABLED || '1'),
      STORE_PATH: path.join(process.cwd(), 'data', 'store.privy.e2e.sqlite'),
    },
  },
};
