#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { chromium } = require('@playwright/test');

const { loadDotEnv } = require('../server/env');

loadDotEnv(process.cwd());

const DEFAULT_BASE_URL = 'http://localhost:3000';
const DEFAULT_OUTPUT_PATH = path.join(process.cwd(), 'data', 'house-worker.live.storage-state.json');
const REQUIRED_READY_CHECKS = Object.freeze(['house_attached', 'active_team_selected']);

function parseArgs(argv) {
  const args = {
    help: false,
    plan: false,
    baseURL: '',
    outputPath: '',
    headed: true,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = String(argv[i] || '').trim();
    if (!token) continue;
    if (token === '--help') {
      args.help = true;
      continue;
    }
    if (token === '--plan') {
      args.plan = true;
      continue;
    }
    if (token === '--headless') {
      args.headed = false;
      continue;
    }
    if (token === '--base-url' && i + 1 < argv.length) {
      args.baseURL = String(argv[i + 1] || '').trim();
      i += 1;
      continue;
    }
    if (token.startsWith('--base-url=')) {
      args.baseURL = token.slice('--base-url='.length).trim();
      continue;
    }
    if (token === '--output' && i + 1 < argv.length) {
      args.outputPath = String(argv[i + 1] || '').trim();
      i += 1;
      continue;
    }
    if (token.startsWith('--output=')) {
      args.outputPath = token.slice('--output='.length).trim();
      continue;
    }
  }
  return args;
}

function printHelp() {
  process.stdout.write(
    [
      'Usage:',
      '  node scripts/capture_house_worker_live_state.js [--plan] [--base-url URL] [--output PATH] [--headless]',
      '',
      'What this does:',
      '  Opens a browser on the House shell, lets you sign in and attach a house/team,',
      '  then saves a Playwright storageState file for the House worker live gate.',
      '',
      'Operator steps:',
      '  1. sign in with a real session if needed',
      '  2. make sure the session has a house attached',
      '  3. make sure an active team is selected',
      '  4. return to the terminal and press Enter to save the live session state',
      '',
      'Options:',
      '  --help                Show this help',
      '  --plan                Print the resolved capture plan as JSON and exit',
      '  --base-url URL        Override HOUSE_WORKER_LIVE_BASE_URL / BASE_URL',
      '  --output PATH         Override HOUSE_WORKER_LIVE_STORAGE_STATE',
      '  --headless            Launch headless instead of the default headed browser',
      '',
    ].join('\n')
  );
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

function buildPlan(args = {}, env = process.env) {
  const baseURL = String(args.baseURL || env.HOUSE_WORKER_LIVE_BASE_URL || env.BASE_URL || '').trim() || DEFAULT_BASE_URL;
  const outputPath = path.resolve(String(args.outputPath || env.HOUSE_WORKER_LIVE_STORAGE_STATE || '').trim() || DEFAULT_OUTPUT_PATH);
  return {
    baseURL,
    outputPath,
    readinessPath: '/api/platform/house-workers/live-readiness',
    targetPath: '/app?district=house',
    requiredReadyChecks: [...REQUIRED_READY_CHECKS],
    headed: args.headed !== false,
    captureCommand: 'npm run capture:house-worker-live-state',
    liveGateCommand: 'npm run test:house-worker-live',
  };
}

async function readLiveReadiness(page, plan) {
  return await page.evaluate(async ({ readinessPath, requiredReadyChecks }) => {
    try {
      const response = await fetch(readinessPath, {
        credentials: 'include',
        headers: {
          accept: 'application/json',
        },
      });
      const payload = await response.json().catch(() => null);
      const checks = Array.isArray(payload?.data?.checks) ? payload.data.checks : [];
      const missingChecks = requiredReadyChecks.filter((checkId) => {
        const entry = checks.find((candidate) => String(candidate?.checkId || '').trim() === String(checkId || '').trim());
        return String(entry?.status || '').trim() !== 'ready';
      });
      return {
        ok: response.ok,
        status: response.status,
        summary: String(payload?.data?.summary || '').trim(),
        checks: checks.map((entry) => ({
          checkId: String(entry?.checkId || '').trim(),
          status: String(entry?.status || '').trim(),
          summary: String(entry?.summary || '').trim(),
        })),
        missingChecks,
      };
    } catch (err) {
      return {
        ok: false,
        status: 0,
        summary: String(err?.message || 'READINESS_FETCH_FAILED'),
        checks: [],
        missingChecks: [...requiredReadyChecks],
      };
    }
  }, plan);
}

function printReadinessStatus(snapshot) {
  const checks = Array.isArray(snapshot?.checks) ? snapshot.checks : [];
  if (!checks.length) {
    process.stdout.write(`House live readiness unavailable: ${String(snapshot?.summary || 'UNKNOWN_ERROR')}\n`);
    return;
  }
  process.stdout.write('Current House worker live readiness:\n');
  for (const check of checks) {
    process.stdout.write(`- ${check.checkId}: ${check.status}${check.summary ? ` (${check.summary})` : ''}\n`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }
  const plan = buildPlan(args, process.env);
  if (args.plan) {
    process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
    return;
  }

  fs.mkdirSync(path.dirname(plan.outputPath), { recursive: true });
  const browser = await chromium.launch({
    headless: !plan.headed,
    args: ['--no-sandbox'],
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(new URL(plan.targetPath, `${plan.baseURL}/`).toString(), {
      waitUntil: 'domcontentloaded',
      timeout: 120000,
    });

    process.stdout.write(
      [
        `Opened ${new URL(plan.targetPath, `${plan.baseURL}/`).toString()}`,
        'Finish the real session setup in the browser:',
        '1. sign in if needed',
        '2. attach a house',
        '3. select an active team',
        '4. leave the browser on the House screen',
        '',
      ].join('\n')
    );

    while (true) {
      const answer = await ask('Press Enter to save this session, or type "q" to quit: ');
      if (/^(q|quit|exit)$/i.test(answer)) {
        throw new Error('CAPTURE_ABORTED');
      }
      const readiness = await readLiveReadiness(page, plan);
      const missingChecks = Array.isArray(readiness?.missingChecks) ? readiness.missingChecks : [];
      if (readiness.ok && missingChecks.length === 0) {
        await context.storageState({ path: plan.outputPath });
        process.stdout.write(`Saved House worker live storage state: ${plan.outputPath}\n`);
        process.stdout.write(`Next: ${plan.liveGateCommand}\n`);
        return;
      }
      printReadinessStatus(readiness);
      process.stdout.write(
        `Cannot save yet. Required ready checks: ${plan.requiredReadyChecks.join(', ')}.\n`
      );
    }
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

main().catch((err) => {
  const code = String(err?.message || '').trim();
  if (code === 'CAPTURE_ABORTED') {
    process.stderr.write('HOUSE_WORKER_LIVE_CAPTURE_ABORTED\n');
    process.exit(1);
  }
  process.stderr.write(`HOUSE_WORKER_LIVE_CAPTURE_FAILED:${String(err?.message || 'UNKNOWN_ERROR')}\n`);
  process.exit(1);
});
