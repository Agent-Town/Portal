import fs from 'node:fs/promises';
import path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execAsync = promisify(exec);

const repoRoot = process.cwd();
const vendorRoot = path.join(repoRoot, 'vendors', 'openclaw-lite-main');
// The vendor build script outputs to its own public/openclaw-lite directory
const vendorBuildDir = path.join(vendorRoot, 'public', 'openclaw-lite');
// We want to copy specific shared modules if needed, but mostly the built assets
const vendorSharedDir = path.join(vendorRoot, 'src', 'openclaw-lite', 'shared');

const outRoot = path.join(repoRoot, 'public', 'openclaw-lite');
const outSharedDir = path.join(outRoot, 'vendor', 'shared');

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function readJsonIfExists(filePath) {
  try {
    return await readJson(filePath);
  } catch {
    return null;
  }
}

async function buildVendorProject() {
  console.log(`[openclaw-lite] building vendor project in ${vendorRoot}...`);

  const openclawMainPath = path.join(vendorRoot, 'vendor', 'openclaw-main');
  const hasOpenclaw = await exists(path.join(openclawMainPath, 'package.json'));

  if (!hasOpenclaw) {
    console.warn('[openclaw-lite] missing openclaw-main; using Lite vendor package pins for build metadata.');
  }

  // Install dependencies
  await execAsync('npm install', { cwd: vendorRoot });
  // Build the project
  await execAsync('npm run build', { cwd: vendorRoot });
  console.log('[openclaw-lite] vendor build complete.');
}

async function copyVendorBuildArtifacts() {
  await ensureDir(outRoot);

  // Copy the built artifacts from vendor's public/openclaw-lite to our public/openclaw-lite
  // We need gateway.js, worker.js, town.js, and any other generated files.
  // The vendor build script generates: gateway.js, worker.js, town.js (and maps)

  const files = await fs.readdir(vendorBuildDir);
  const copied = [];

  for (const file of files) {
    const src = path.join(vendorBuildDir, file);
    const dst = path.join(outRoot, file);
    // Only copy files, skip directories if any (unless needed, but usually flat)
    const stat = await fs.stat(src);
    if (stat.isFile()) {
      await fs.copyFile(src, dst);
      copied.push(file);
    }
  }
  return copied.sort();
}

async function copySharedModules() {
  // We might still need shared modules for other purposes or if the build doesn't bundle everything
  // effectively. The original script copied them, so we keep this capability.
  const entries = await fs.readdir(vendorSharedDir, { withFileTypes: true });
  await ensureDir(outSharedDir);
  const copied = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.js')) continue;
    const sourcePath = path.join(vendorSharedDir, entry.name);
    const targetPath = path.join(outSharedDir, entry.name);
    await fs.copyFile(sourcePath, targetPath);
    copied.push(entry.name);
  }
  return copied.sort();
}

async function assertRuntimeFilesPresent() {
  const required = [
    'gateway.js',
    'worker.js',
    // 'runtime-worker.js', // These might be named differently in the new build?
    // 'runtime-bridge.js', // Let's check what the vendor build actually produces.
    // 'llm-config-library.js' // This might be separate or bundled.
    // Based on analysis: gateway.js, worker.js, town.js are the main outputs.
    // 'pi-ai-browser-port.js' is a shim used during build, not necessarily an output unless bundled.
    // Let's stick to checking what we expect the NEW build to produce.
    'town.js'
  ];
  // Note: if the new build bundles everything into worker.js and gateway.js, we might not need others.
  // But let's verify what we have after build.

  const missing = [];
  for (const filename of required) {
    const fullPath = path.join(outRoot, filename);
    if (!(await exists(fullPath))) missing.push(filename);
  }
  if (missing.length > 0) {
    throw new Error(`MISSING_RUNTIME_FILES:${missing.join(',')}`);
  }
}

function buildInfoIdentity(payload) {
  return JSON.stringify({
    vendorPath: 'vendors/openclaw-lite-main',
    vendorVersion: typeof payload?.vendorVersion === 'string' ? payload.vendorVersion : '',
    copiedArtifacts: Array.isArray(payload?.copiedArtifacts) ? [...payload.copiedArtifacts].sort() : [],
    copiedShared: Array.isArray(payload?.copiedShared) ? [...payload.copiedShared].sort() : []
  });
}

export function createBuildInfoPayload({ vendorVersion, copiedArtifacts, copiedShared, builtAt }) {
  return {
    vendorPath: 'vendors/openclaw-lite-main',
    vendorVersion,
    builtAt: typeof builtAt === 'string' && builtAt.trim() ? builtAt.trim() : new Date().toISOString(),
    copiedArtifacts: Array.isArray(copiedArtifacts) ? [...copiedArtifacts].sort() : [],
    copiedShared: Array.isArray(copiedShared) ? [...copiedShared].sort() : []
  };
}

export function stabilizeBuildInfoPayload({ nextPayload, existingPayload }) {
  const existingBuiltAt = typeof existingPayload?.builtAt === 'string' ? existingPayload.builtAt.trim() : '';
  if (existingBuiltAt && buildInfoIdentity(existingPayload) === buildInfoIdentity(nextPayload)) {
    return {
      ...nextPayload,
      builtAt: existingBuiltAt
    };
  }
  return nextPayload;
}

async function writeFileIfChanged(filePath, nextContent) {
  try {
    const existingContent = await fs.readFile(filePath, 'utf8');
    if (existingContent === nextContent) return false;
  } catch {
    // Missing target is fine; we'll create it below.
  }
  await fs.writeFile(filePath, nextContent);
  return true;
}

async function writeBuildInfo({ vendorVersion, copiedArtifacts, copiedShared }) {
  const target = path.join(outRoot, 'build-info.json');
  const existingPayload = await readJsonIfExists(target);
  const nextPayload = stabilizeBuildInfoPayload({
    nextPayload: createBuildInfoPayload({ vendorVersion, copiedArtifacts, copiedShared }),
    existingPayload
  });
  if (existingPayload && JSON.stringify(existingPayload) === JSON.stringify(nextPayload)) {
    return;
  }
  await writeFileIfChanged(target, `${JSON.stringify(nextPayload, null, 2)}\n`);
}

async function main() {
  if (!(await exists(vendorRoot))) {
    throw new Error(`MISSING_VENDOR_ROOT:${vendorRoot}`);
  }

  // 1. Build the vendor project
  await buildVendorProject();

  // 2. Copy the built artifacts
  const copiedArtifacts = await copyVendorBuildArtifacts();

  // 3. Copy shared modules (legacy/helper support)
  const copiedShared = await copySharedModules();

  // 4. Verify
  await assertRuntimeFilesPresent();

  const pkgPath = path.join(vendorRoot, 'package.json');
  const pkg = await readJson(pkgPath);
  const vendorVersion = typeof pkg?.version === 'string' ? pkg.version.trim() : '';
  if (!vendorVersion) throw new Error('MISSING_VENDOR_VERSION');

  await writeBuildInfo({ vendorVersion, copiedArtifacts, copiedShared });

  // eslint-disable-next-line no-console
  console.log(`[openclaw-lite] sync complete. Artifacts: ${copiedArtifacts.length}, Shared: ${copiedShared.length}`);
}

const thisFilePath = fileURLToPath(import.meta.url);
const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (invokedPath === thisFilePath) {
  main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(String(err?.stack || err?.message || err));
    process.exit(1);
  });
}
