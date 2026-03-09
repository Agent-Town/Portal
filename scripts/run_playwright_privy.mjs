import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const useGuest = args.includes('--guest');
const forwardedArgs = args.filter((arg) => arg !== '--guest');

const env = {
  ...process.env,
  LOAD_DOTENV_IN_TEST: '1',
  ENABLE_PRIVY_IN_TEST: '1',
  START_PAGE_ENABLED: process.env.START_PAGE_ENABLED || '1',
  PW_PORT: process.env.PW_PORT || '4173',
};

if (useGuest) {
  env.PRIVY_LOGIN_METHOD = 'guest';
}

const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['playwright', 'test', '--config=playwright.privy.config.js', ...forwardedArgs],
  {
    stdio: 'inherit',
    env,
  }
);

if (typeof result.status === 'number') {
  process.exit(result.status);
}
process.exit(1);
