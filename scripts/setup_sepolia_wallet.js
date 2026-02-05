#!/usr/bin/env node

const readline = require('readline');

const {
  DEFAULT_FAUCET_URL,
  ensureWalletFile,
  readWalletConfig,
  writeWalletConfig,
  isValidAddress,
  getSepoliaBalanceWei,
  weiToEthString,
  minWeiFromEnv
} = require('../e2e/helpers/sepolia_wallet');

function parseArgs(argv) {
  const args = { address: null, noBalanceCheck: false };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--address') {
      args.address = argv[i + 1] || null;
      i += 1;
      continue;
    }
    if (token.startsWith('--address=')) {
      args.address = token.slice('--address='.length) || null;
      continue;
    }
    if (token === '--no-balance-check') {
      args.noBalanceCheck = true;
      continue;
    }
  }
  return args;
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(String(answer || '').trim());
    });
  });
}

async function resolveAddress(initial, existingAddress) {
  if (isValidAddress(initial || '')) return initial;
  if (!process.stdin.isTTY) {
    throw new Error('NON_INTERACTIVE_NEEDS_ADDRESS');
  }

  const promptBase = isValidAddress(existingAddress || '')
    ? `Enter Sepolia EVM wallet address (press Enter to keep ${existingAddress}): `
    : 'Enter Sepolia EVM wallet address (0x...): ';

  for (;;) {
    const answer = await ask(promptBase);
    if (!answer && isValidAddress(existingAddress || '')) return existingAddress;
    if (isValidAddress(answer)) return answer;
    process.stdout.write('Address must be a valid EVM address (0x + 40 hex chars).\n');
  }
}

async function printBalanceStatus(address) {
  const minWei = minWeiFromEnv();
  const balWei = await getSepoliaBalanceWei(address);
  const balEth = weiToEthString(balWei);
  const minEth = weiToEthString(minWei);
  process.stdout.write(`Sepolia balance for ${address}: ${balEth} ETH (min ${minEth})\n`);
  if (balWei < minWei) {
    process.stdout.write(`Balance is below threshold. Request funds here: ${DEFAULT_FAUCET_URL}\n`);
    return false;
  }
  process.stdout.write('Balance is sufficient. Faucet request is not required.\n');
  return true;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const file = ensureWalletFile();
  const { config } = readWalletConfig();

  const address = await resolveAddress(args.address, config.address);
  if (!isValidAddress(address)) throw new Error('INVALID_ADDRESS');

  writeWalletConfig(file, {
    ...config,
    address,
    network: 'sepolia',
    faucetUrl: DEFAULT_FAUCET_URL,
    note: 'Persistent local EVM wallet used by REAL_SEPOLIA_WALLET_TEST integration checks.'
  });

  process.stdout.write(`Saved wallet config: ${file}\n`);

  if (args.noBalanceCheck) {
    process.stdout.write('Skipped balance check (--no-balance-check).\n');
    return;
  }

  try {
    await printBalanceStatus(address);
  } catch (e) {
    process.stdout.write(`Could not check Sepolia balance (${e.message}). You can still continue and check later.\n`);
  }
}

main().catch((err) => {
  if (err && err.message === 'NON_INTERACTIVE_NEEDS_ADDRESS') {
    process.stderr.write('Non-interactive mode needs --address 0x...\n');
    process.exit(2);
    return;
  }
  process.stderr.write(`${err.message || String(err)}\n`);
  process.exit(1);
});
