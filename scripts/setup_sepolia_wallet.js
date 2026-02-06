#!/usr/bin/env node

const path = require('path');
const readline = require('readline');

const {
  DEFAULT_FAUCET_URL,
  ensureWalletFile,
  readWalletConfig,
  writeWalletConfig,
  isValidAddress,
  isValidPrivateKey,
  normalizePrivateKeyHex,
  addressFromPrivateKey,
  generateEvmWallet,
  getSepoliaBalanceWei,
  weiToEthString,
  minWeiFromEnv,
  EVM_ADDR_PLACEHOLDER,
  EVM_KEY_PLACEHOLDER
} = require('../e2e/helpers/sepolia_wallet');

const DEFAULT_WAIT_SECONDS = 180;

function parseArgs(argv) {
  const args = {
    address: null,
    privateKey: null,
    noBalanceCheck: false,
    noFaucet: false,
    headless: false,
    forceGenerate: false,
    waitSeconds: DEFAULT_WAIT_SECONDS
  };

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
    if (token === '--private-key') {
      args.privateKey = argv[i + 1] || null;
      i += 1;
      continue;
    }
    if (token.startsWith('--private-key=')) {
      args.privateKey = token.slice('--private-key='.length) || null;
      continue;
    }
    if (token === '--no-balance-check') {
      args.noBalanceCheck = true;
      continue;
    }
    if (token === '--no-faucet') {
      args.noFaucet = true;
      continue;
    }
    if (token === '--headless') {
      args.headless = true;
      continue;
    }
    if (token === '--force-generate') {
      args.forceGenerate = true;
      continue;
    }
    if (token === '--wait-seconds') {
      const raw = argv[i + 1] || '';
      i += 1;
      const num = Number(raw);
      if (!Number.isFinite(num) || num <= 0) throw new Error('INVALID_WAIT_SECONDS');
      args.waitSeconds = Math.floor(num);
      continue;
    }
    if (token.startsWith('--wait-seconds=')) {
      const raw = token.slice('--wait-seconds='.length);
      const num = Number(raw);
      if (!Number.isFinite(num) || num <= 0) throw new Error('INVALID_WAIT_SECONDS');
      args.waitSeconds = Math.floor(num);
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

async function resolveManualAddress(existingAddress) {
  if (!process.stdin.isTTY) return null;
  const prompt = isValidAddress(existingAddress || '') && existingAddress !== EVM_ADDR_PLACEHOLDER
    ? `Enter Sepolia EVM wallet address (press Enter to keep ${existingAddress}, or leave empty to auto-generate): `
    : 'Enter Sepolia EVM wallet address (0x..., or leave empty to auto-generate): ';
  const value = await ask(prompt);
  if (!value) return null;
  if (!isValidAddress(value)) throw new Error('INVALID_ADDRESS');
  return value;
}

function normalizeAddress(address) {
  if (!isValidAddress(address || '')) return null;
  return String(address).toLowerCase();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestGoogleFaucet(address, { headless }) {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch {
    return { attempted: false, reason: 'PLAYWRIGHT_MISSING' };
  }

  const profileDir = process.env.FAUCET_PROFILE_DIR
    ? path.resolve(process.env.FAUCET_PROFILE_DIR)
    : path.join(process.cwd(), 'data', 'faucet.browser-profile');

  const context = await chromium.launchPersistentContext(profileDir, {
    headless,
    args: ['--no-sandbox']
  });

  try {
    const page = context.pages()[0] || await context.newPage();
    await page.goto(DEFAULT_FAUCET_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });

    const inputSelectors = [
      'input[placeholder*="0x" i]',
      'input[placeholder*="address" i]',
      'input[type="text"]',
      'textarea'
    ];

    let filled = false;
    for (const selector of inputSelectors) {
      const locator = page.locator(selector).first();
      if (await locator.count()) {
        try {
          await locator.fill(address, { timeout: 3000 });
          filled = true;
          break;
        } catch {
          // Try the next selector.
        }
      }
    }

    const actionMatchers = [/send/i, /request/i, /drip/i, /claim/i, /receive/i, /faucet/i];
    let clicked = false;
    for (const matcher of actionMatchers) {
      const btn = page.getByRole('button', { name: matcher }).first();
      if (await btn.count()) {
        try {
          await btn.click({ timeout: 3000 });
          clicked = true;
          break;
        } catch {
          // Try the next matcher.
        }
      }
    }

    if (!clicked && process.stdin.isTTY) {
      process.stdout.write('Could not auto-submit faucet form. Complete the faucet in the opened browser and press Enter here.\n');
      await ask('Press Enter once faucet submission is complete... ');
      return { attempted: true, reason: 'MANUAL_BROWSER_CONFIRM' };
    }

    if (!filled) return { attempted: false, reason: 'NO_ADDRESS_INPUT' };
    if (!clicked) return { attempted: false, reason: 'NO_ACTION_BUTTON' };

    return { attempted: true, reason: 'AUTO_SUBMIT' };
  } finally {
    await context.close();
  }
}

async function waitForBalanceTopUp(address, initialWei, minWei, waitSeconds) {
  const deadline = Date.now() + waitSeconds * 1000;
  let last = initialWei;

  while (Date.now() < deadline) {
    await sleep(10000);
    const next = await getSepoliaBalanceWei(address);
    last = next;
    if (next >= minWei || next > initialWei) {
      return { toppedUp: true, balanceWei: next };
    }
  }

  return { toppedUp: false, balanceWei: last };
}

function hasConfiguredWallet(config) {
  const keyOk = isValidPrivateKey(config.privateKey || '');
  const addrOk = isValidAddress(config.address || '') && normalizeAddress(config.address) !== EVM_ADDR_PLACEHOLDER;
  if (!keyOk || !addrOk) return false;
  try {
    return normalizeAddress(addressFromPrivateKey(config.privateKey)) === normalizeAddress(config.address);
  } catch {
    return false;
  }
}

async function resolveWallet(args, existingConfig) {
  const existing = existingConfig || {};

  if (!args.forceGenerate && hasConfiguredWallet(existing)) {
    return {
      wallet: {
        privateKey: normalizePrivateKeyHex(existing.privateKey),
        address: normalizeAddress(existing.address)
      },
      createdFresh: false,
      source: 'existing'
    };
  }

  if (args.privateKey) {
    const key = normalizePrivateKeyHex(args.privateKey);
    if (!isValidPrivateKey(key || '')) throw new Error('INVALID_PRIVATE_KEY');
    const addr = normalizeAddress(addressFromPrivateKey(key));
    return {
      wallet: { privateKey: key, address: addr },
      createdFresh: false,
      source: 'arg-private-key'
    };
  }

  if (args.address) {
    const addr = normalizeAddress(args.address);
    if (!addr) throw new Error('INVALID_ADDRESS');
    return {
      wallet: {
        privateKey: normalizePrivateKeyHex(existing.privateKey || '') || EVM_KEY_PLACEHOLDER,
        address: addr
      },
      createdFresh: false,
      source: 'arg-address'
    };
  }

  const manual = await resolveManualAddress(existing.address);
  if (manual) {
    return {
      wallet: {
        privateKey: normalizePrivateKeyHex(existing.privateKey || '') || EVM_KEY_PLACEHOLDER,
        address: normalizeAddress(manual)
      },
      createdFresh: false,
      source: 'manual-address'
    };
  }

  const generated = generateEvmWallet();
  return {
    wallet: {
      privateKey: normalizePrivateKeyHex(generated.privateKey),
      address: normalizeAddress(generated.address)
    },
    createdFresh: true,
    source: 'generated'
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const file = ensureWalletFile();
  const { config } = readWalletConfig();

  const { wallet, createdFresh, source } = await resolveWallet(args, config);

  writeWalletConfig(file, {
    ...config,
    address: wallet.address,
    privateKey: wallet.privateKey,
    network: 'sepolia',
    faucetUrl: DEFAULT_FAUCET_URL,
    note: createdFresh
      ? 'Auto-generated local Sepolia wallet. Keep this private key safe (testnet only).'
      : 'Persistent local EVM wallet used by REAL_SEPOLIA_WALLET_TEST integration checks.'
  });

  process.stdout.write(`Saved wallet config: ${file}\n`);
  process.stdout.write(`Wallet source: ${source}\n`);
  process.stdout.write(`Address: ${wallet.address}\n`);

  if (wallet.privateKey && wallet.privateKey !== EVM_KEY_PLACEHOLDER) {
    process.stdout.write('Private key is persisted for local test automation (testnet only).\n');
  }

  if (args.noBalanceCheck) {
    process.stdout.write('Skipped balance check (--no-balance-check).\n');
    return;
  }

  const minWei = minWeiFromEnv();
  let balWei;
  try {
    balWei = await getSepoliaBalanceWei(wallet.address);
  } catch (e) {
    process.stdout.write(`Could not check Sepolia balance (${e.message}).\n`);
    return;
  }

  process.stdout.write(`Sepolia balance for ${wallet.address}: ${weiToEthString(balWei)} ETH (min ${weiToEthString(minWei)})\n`);

  if (balWei >= minWei) {
    process.stdout.write('Balance is sufficient. Faucet request is not required.\n');
    return;
  }

  process.stdout.write(`Balance below threshold. Faucet URL: ${DEFAULT_FAUCET_URL}\n`);

  if (args.noFaucet) {
    process.stdout.write('Auto-faucet is disabled (--no-faucet).\n');
    return;
  }

  if (!createdFresh) {
    process.stdout.write('Skipping auto-faucet because wallet was not freshly generated.\n');
    return;
  }

  try {
    const submitted = await requestGoogleFaucet(wallet.address, { headless: args.headless });
    process.stdout.write(`Faucet submit status: ${submitted.reason}\n`);
    if (!submitted.attempted) return;
  } catch (e) {
    process.stdout.write(`Auto-faucet attempt failed (${e.message}).\n`);
    return;
  }

  try {
    process.stdout.write(`Waiting up to ${args.waitSeconds}s for funds...\n`);
    const waited = await waitForBalanceTopUp(wallet.address, balWei, minWei, args.waitSeconds);
    if (waited.toppedUp) {
      process.stdout.write(`Top-up detected. New balance: ${weiToEthString(waited.balanceWei)} ETH\n`);
      return;
    }
    process.stdout.write(`No balance increase detected within timeout. Current balance: ${weiToEthString(waited.balanceWei)} ETH\n`);
  } catch (e) {
    process.stdout.write(`Could not confirm top-up (${e.message}).\n`);
  }
}

main().catch((err) => {
  process.stderr.write(`${err.message || String(err)}\n`);
  process.exit(1);
});
