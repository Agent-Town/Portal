#!/usr/bin/env node

const path = require('path');
const readline = require('readline');

const {
  DEFAULT_FAUCET_URL,
  ensureWalletFile,
  readWalletConfig,
  writeWalletConfig,
  isValidAddress,
  isValidSecretKey,
  normalizeAddress,
  normalizeSecretKey,
  addressFromSecretKey,
  generateSolanaWallet,
  getDevnetBalanceLamports,
  lamportsToSolString,
  minLamportsFromEnv,
  SOLANA_ADDR_PLACEHOLDER,
  SOLANA_SECRET_KEY_PLACEHOLDER
} = require('../e2e/helpers/solana_wallet');

const DEFAULT_WAIT_SECONDS = 180;

function parseArgs(argv) {
  const args = {
    address: null,
    secretKey: null,
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
    if (token === '--secret-key') {
      args.secretKey = argv[i + 1] || null;
      i += 1;
      continue;
    }
    if (token.startsWith('--secret-key=')) {
      args.secretKey = token.slice('--secret-key='.length) || null;
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
  const prompt = isValidAddress(existingAddress || '') && existingAddress !== SOLANA_ADDR_PLACEHOLDER
    ? `Enter Solana devnet wallet address (press Enter to keep ${existingAddress}, or leave empty to auto-generate): `
    : 'Enter Solana devnet wallet address (base58, or leave empty to auto-generate): ';
  const value = await ask(prompt);
  if (!value) return null;
  const normalized = normalizeAddress(value);
  if (!normalized) throw new Error('INVALID_ADDRESS');
  return normalized;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestSolanaFaucet(address, { headless }) {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch {
    return { attempted: false, reason: 'PLAYWRIGHT_MISSING' };
  }

  const profileDir = process.env.FAUCET_PROFILE_DIR
    ? path.resolve(process.env.FAUCET_PROFILE_DIR)
    : path.join(process.cwd(), 'data', 'solana.faucet.browser-profile');

  const context = await chromium.launchPersistentContext(profileDir, {
    headless,
    args: ['--no-sandbox']
  });

  try {
    const page = context.pages()[0] || await context.newPage();
    await page.goto(DEFAULT_FAUCET_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });

    const inputSelectors = [
      'input[placeholder*="address" i]',
      'input[placeholder*="wallet" i]',
      'input[name*="address" i]',
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

    const actionMatchers = [/request/i, /airdrop/i, /claim/i, /receive/i, /faucet/i, /drip/i, /send/i];
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
      process.stdout.write('Could not auto-submit Solana faucet form. Complete the faucet in the opened browser and press Enter here.\n');
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

async function waitForBalanceTopUp(address, initialLamports, minLamports, waitSeconds) {
  const deadline = Date.now() + waitSeconds * 1000;
  let last = initialLamports;

  while (Date.now() < deadline) {
    await sleep(10000);
    const next = await getDevnetBalanceLamports(address);
    last = next;
    if (next >= minLamports || next > initialLamports) {
      return { toppedUp: true, balanceLamports: next };
    }
  }

  return { toppedUp: false, balanceLamports: last };
}

function hasConfiguredWallet(config) {
  const secretOk = isValidSecretKey(config.secretKey || '');
  const addrNorm = normalizeAddress(config.address || '');
  const addrOk = Boolean(addrNorm) && addrNorm !== SOLANA_ADDR_PLACEHOLDER;
  if (!secretOk || !addrOk) return false;
  try {
    return normalizeAddress(addressFromSecretKey(config.secretKey)) === addrNorm;
  } catch {
    return false;
  }
}

async function resolveWallet(args, existingConfig) {
  const existing = existingConfig || {};

  if (!args.forceGenerate && hasConfiguredWallet(existing)) {
    return {
      wallet: {
        secretKey: normalizeSecretKey(existing.secretKey),
        address: normalizeAddress(existing.address)
      },
      createdFresh: false,
      source: 'existing'
    };
  }

  if (args.secretKey) {
    const secretKey = normalizeSecretKey(args.secretKey);
    if (!secretKey) throw new Error('INVALID_SECRET_KEY');
    return {
      wallet: {
        secretKey,
        address: normalizeAddress(addressFromSecretKey(secretKey))
      },
      createdFresh: false,
      source: 'arg-secret-key'
    };
  }

  if (args.address) {
    const address = normalizeAddress(args.address);
    if (!address) throw new Error('INVALID_ADDRESS');
    return {
      wallet: {
        secretKey: normalizeSecretKey(existing.secretKey || '') || SOLANA_SECRET_KEY_PLACEHOLDER,
        address
      },
      createdFresh: false,
      source: 'arg-address'
    };
  }

  const manual = await resolveManualAddress(existing.address);
  if (manual) {
    return {
      wallet: {
        secretKey: normalizeSecretKey(existing.secretKey || '') || SOLANA_SECRET_KEY_PLACEHOLDER,
        address: manual
      },
      createdFresh: false,
      source: 'manual-address'
    };
  }

  const generated = generateSolanaWallet();
  return {
    wallet: {
      secretKey: normalizeSecretKey(generated.secretKey),
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
    secretKey: wallet.secretKey,
    network: 'solana-devnet',
    faucetUrl: DEFAULT_FAUCET_URL,
    note: createdFresh
      ? 'Auto-generated local Solana devnet wallet. Keep this secret key safe (testnet only).'
      : 'Persistent local Solana devnet wallet used by REAL_SOLANA_WALLET_TEST integration checks.'
  });

  process.stdout.write(`Saved wallet config: ${file}\n`);
  process.stdout.write(`Wallet source: ${source}\n`);
  process.stdout.write(`Address: ${wallet.address}\n`);

  if (wallet.secretKey && wallet.secretKey !== SOLANA_SECRET_KEY_PLACEHOLDER) {
    process.stdout.write('Secret key is persisted for local test automation (testnet only).\n');
  }

  if (args.noBalanceCheck) {
    process.stdout.write('Skipped balance check (--no-balance-check).\n');
    return;
  }

  const minLamports = minLamportsFromEnv();
  let balanceLamports;
  try {
    balanceLamports = await getDevnetBalanceLamports(wallet.address);
  } catch (e) {
    process.stdout.write(`Could not check Solana devnet balance (${e.message}).\n`);
    return;
  }

  process.stdout.write(
    `Solana devnet balance for ${wallet.address}: ` +
      `${lamportsToSolString(balanceLamports)} SOL ` +
      `(min ${lamportsToSolString(minLamports)})\n`
  );

  if (balanceLamports >= minLamports) {
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
    const submitted = await requestSolanaFaucet(wallet.address, { headless: args.headless });
    process.stdout.write(`Faucet submit status: ${submitted.reason}\n`);
    if (!submitted.attempted) return;
  } catch (e) {
    process.stdout.write(`Auto-faucet attempt failed (${e.message}).\n`);
    return;
  }

  try {
    process.stdout.write(`Waiting up to ${args.waitSeconds}s for funds...\n`);
    const waited = await waitForBalanceTopUp(wallet.address, balanceLamports, minLamports, args.waitSeconds);
    if (waited.toppedUp) {
      process.stdout.write(`Top-up detected. New balance: ${lamportsToSolString(waited.balanceLamports)} SOL\n`);
      return;
    }
    process.stdout.write(
      `No balance increase detected within timeout. ` +
        `Current balance: ${lamportsToSolString(waited.balanceLamports)} SOL\n`
    );
  } catch (e) {
    process.stdout.write(`Could not confirm top-up (${e.message}).\n`);
  }
}

main().catch((err) => {
  process.stderr.write(`${err.message || String(err)}\n`);
  process.exit(1);
});
