// Playwright config for .env-backed Privy verification runs.
const path = require('path');
const base = require('./playwright.config');

const PORT = Number(process.env.PW_PORT || 4184);

module.exports = {
  ...base,
  use: {
    ...(base.use || {}),
    baseURL: `http://[::1]:${PORT}`,
  },
  webServer: {
    ...(base.webServer || {}),
    url: `http://[::1]:${PORT}/api/health`,
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
