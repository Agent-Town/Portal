#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import * as esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const sdkRoot = path.join(repoRoot, 'vendors', 'agent0-ts');
const sdkPackagePath = path.join(sdkRoot, 'package.json');
const sdkDistEntry = path.join(sdkRoot, 'dist', 'index.js');
const sdkNodeModules = path.join(sdkRoot, 'node_modules');
const outDir = path.join(repoRoot, 'public', 'vendor');
const outFile = path.join(outDir, 'agent0-sdk.mjs');
const outInfoFile = path.join(outDir, 'agent0-sdk.build-info.json');

const args = new Set(process.argv.slice(2));
const forceInstall = args.has('--install');
const forceBuild = args.has('--build');

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function run(cmd, cmdArgs, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, cmdArgs, { cwd, stdio: 'inherit' });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${cmd} ${cmdArgs.join(' ')} exited with code ${code}`));
    });
  });
}

function runCapture(cmd, cmdArgs, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, cmdArgs, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
        return;
      }
      reject(new Error(`${cmd} ${cmdArgs.join(' ')} exited with code ${code}: ${stderr.trim()}`));
    });
  });
}

async function ensureForkCheckout() {
  if (await exists(sdkPackagePath)) return;
  throw new Error(
    [
      'Missing vendors/agent0-ts checkout.',
      'Run: git submodule update --init --recursive vendors/agent0-ts',
    ].join(' ')
  );
}

async function maybeInstall() {
  if (!forceInstall && (await exists(sdkNodeModules))) return;
  console.log('[agent0-sdk] installing fork dependencies...');
  await run('npm', ['ci', '--no-audit', '--no-fund'], sdkRoot);
}

async function maybeBuildSdk() {
  if (!forceBuild && (await exists(sdkDistEntry))) return;
  console.log('[agent0-sdk] building fork dist artifacts...');
  await run('npm', ['run', 'build'], sdkRoot);
}

async function bundleSdk() {
  await fs.mkdir(outDir, { recursive: true });
  console.log('[agent0-sdk] bundling browser artifact...');
  await esbuild.build({
    entryPoints: [sdkDistEntry],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: ['es2022'],
    outfile: outFile,
    external: ['fs'],
    sourcemap: false,
    minify: false,
    legalComments: 'none',
  });
}

async function writeBuildInfo() {
  const bundleContent = await fs.readFile(outFile);
  const bundleHash = createHash('sha256').update(bundleContent).digest('hex');
  const bundleBytes = bundleContent.byteLength;
  const sdkCommit = await runCapture('git', ['-C', sdkRoot, 'rev-parse', 'HEAD'], repoRoot);
  const sdkBranch = await runCapture('git', ['-C', sdkRoot, 'rev-parse', '--abbrev-ref', 'HEAD'], repoRoot);

  const info = {
    builtAt: new Date().toISOString(),
    source: {
      path: 'vendors/agent0-ts',
      commit: sdkCommit,
      branch: sdkBranch,
    },
    output: {
      file: 'public/vendor/agent0-sdk.mjs',
      bytes: bundleBytes,
      sha256: bundleHash,
    },
    notes: [
      'Bundle built from local Agent-Town fork checkout.',
      'fs is externalized for Node-only addFile() dynamic import path.',
    ],
  };

  await fs.writeFile(outInfoFile, `${JSON.stringify(info, null, 2)}\n`, 'utf8');
  console.log(`[agent0-sdk] wrote ${path.relative(repoRoot, outInfoFile)}`);
}

async function main() {
  await ensureForkCheckout();
  await maybeInstall();
  await maybeBuildSdk();
  await bundleSdk();
  await writeBuildInfo();
  console.log(`[agent0-sdk] wrote ${path.relative(repoRoot, outFile)}`);
}

main().catch((error) => {
  console.error('[agent0-sdk] build failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
