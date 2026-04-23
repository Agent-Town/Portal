import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, '..');
export const platformManifestPath = path.join(repoRoot, 'public/assets/platform/asset-manifest.json');
export const inventoryPath = path.join(repoRoot, 'docs/visual/APP_WIDE_ASSET_INVENTORY_V1_4_3.md');
export const platformPromptRoot = 'specs/prompts/v1_4_3';
export const platformPromptMirrorRoot = 'public/assets/platform/prompts/v1_4_3';
export const platformBudgetBytes = 8_388_608;
export const approvalDate = '2026-04-23';
export const approvalBy = 'Robin';

const heroCastRefs = [
  'docs/brand/reference/hero-cast/prairie-dog-ranger-source.png',
  'docs/brand/reference/hero-cast/sheriff-lobster-source.jpeg',
  'docs/brand/reference/hero-cast/chibi-homesteader-girl-source.png',
  'docs/brand/reference/hero-cast/wizard-kid-source.png'
];

const platformRef = 'docs/brand/reference/platform/agenttown-visual-reference.jpeg';

export const platformAssetDefs = [
  {
    id: 'start_gate_hero_v1_4_3',
    path: 'public/assets/platform/start_gate/start-gate-hero-v1_4_3.webp',
    candidatePath: 'public/assets/candidates/v1_4_3/start_gate/start-gate-hero-c01.png',
    surface: 'start_gate',
    role: 'hero_background',
    model: 'gpt-image-2',
    promptFile: 'specs/prompts/v1_4_3/start_gate_hero_v1_4_3.md',
    promptMirrorFile: 'public/assets/platform/prompts/v1_4_3/start_gate_hero_v1_4_3.md',
    referenceInputs: [platformRef, 'public/assets/hero-cast/hero-cast-group.webp'],
    postProcessing: ['webp_compression'],
    usedBy: ['public/start.html', 'public/styles.css'],
    replaces: ['public/background.webp', 'public/assets/hero-cast/hero-cast-group.webp'],
    rollbackPath: 'public/assets/hero-cast/hero-cast-group.webp',
    approvalNotes: 'Approved with caveats for the V1.4.3 Start Gate hero baseline pending route screenshot review.'
  },
  {
    id: 'town_shell_background_v1_4_3',
    path: 'public/assets/platform/town_shell/town-shell-background-v1_4_3.webp',
    candidatePath: 'public/assets/candidates/v1_4_3/town_shell/town-shell-background-c01.png',
    surface: 'town_shell',
    role: 'hero_background',
    model: 'gpt-image-2',
    promptFile: 'specs/prompts/v1_4_3/town_shell_background_v1_4_3.md',
    promptMirrorFile: 'public/assets/platform/prompts/v1_4_3/town_shell_background_v1_4_3.md',
    referenceInputs: [platformRef, 'public/assets/platform/town-shell-background-v1_4_2.webp'],
    postProcessing: ['webp_compression'],
    usedBy: ['public/index.html', 'public/styles.css'],
    replaces: ['public/assets/platform/town-shell-background-v1_4_2.webp'],
    rollbackPath: 'public/assets/platform/town-shell-background-v1_4_2.webp',
    approvalNotes: 'Approved with caveats for the V1.4.3 town shell baseline pending route screenshot review.'
  },
  {
    id: 'townhall_onboarding_illustration_v1_4_3',
    path: 'public/assets/platform/townhall/townhall-onboarding-illustration-v1_4_3.webp',
    candidatePath: 'public/assets/candidates/v1_4_3/townhall/townhall-onboarding-c01.png',
    surface: 'townhall',
    role: 'illustration',
    model: 'gpt-image-2',
    promptFile: 'specs/prompts/v1_4_3/townhall_onboarding_v1_4_3.md',
    promptMirrorFile: 'public/assets/platform/prompts/v1_4_3/townhall_onboarding_v1_4_3.md',
    referenceInputs: [platformRef, 'public/assets/platform/townhall-onboarding-illustration-v1_4_2.webp'],
    postProcessing: ['webp_compression'],
    usedBy: ['public/views/townhall.html', 'public/styles.css'],
    replaces: ['public/assets/platform/townhall-onboarding-illustration-v1_4_2.webp'],
    rollbackPath: 'public/assets/platform/townhall-onboarding-illustration-v1_4_2.webp',
    approvalNotes: 'Approved with caveats for the V1.4.3 Town Hall onboarding art pending screenshot review.'
  },
  {
    id: 'brain_connect_illustration_v1_4_3',
    path: 'public/assets/platform/brain/brain-connect-illustration-v1_4_3.webp',
    candidatePath: 'public/assets/candidates/v1_4_3/brain/brain-connect-c01.png',
    surface: 'brain',
    role: 'illustration',
    model: 'gpt-image-2',
    promptFile: 'specs/prompts/v1_4_3/brain_connect_v1_4_3.md',
    promptMirrorFile: 'public/assets/platform/prompts/v1_4_3/brain_connect_v1_4_3.md',
    referenceInputs: [platformRef, 'public/assets/platform/brain-connect-marker-v1_4_2.webp'],
    postProcessing: ['webp_compression'],
    usedBy: ['public/views/brain.html', 'public/styles.css'],
    replaces: ['public/assets/platform/brain-connect-marker-v1_4_2.webp'],
    rollbackPath: 'public/assets/platform/brain-connect-marker-v1_4_2.webp',
    approvalNotes: 'Approved with caveats for the V1.4.3 Brain connect art pending screenshot review.'
  },
  {
    id: 'house_claim_share_illustration_v1_4_3',
    path: 'public/assets/platform/house/house-claim-share-illustration-v1_4_3.webp',
    candidatePath: 'public/assets/candidates/v1_4_3/house/house-claim-share-c01.png',
    surface: 'house',
    role: 'illustration',
    model: 'gpt-image-2',
    promptFile: 'specs/prompts/v1_4_3/house_home_claim_share_v1_4_3.md',
    promptMirrorFile: 'public/assets/platform/prompts/v1_4_3/house_home_claim_share_v1_4_3.md',
    referenceInputs: [platformRef, 'public/agenttown.jpeg'],
    postProcessing: ['webp_compression'],
    usedBy: ['public/views/house.html', 'public/share.html', 'public/claim-wallet.html', 'public/styles.css'],
    replaces: [],
    rollbackPath: 'public/agenttown.jpeg',
    approvalNotes: 'Approved with caveats for house, claim, and share surfaces pending screenshot review.'
  },
  {
    id: 'pony_express_illustration_v1_4_3',
    path: 'public/assets/platform/pony/pony-express-illustration-v1_4_3.webp',
    candidatePath: 'public/assets/candidates/v1_4_3/pony/pony-express-c01.png',
    surface: 'pony',
    role: 'illustration',
    model: 'gpt-image-2',
    promptFile: 'specs/prompts/v1_4_3/pony_express_v1_4_3.md',
    promptMirrorFile: 'public/assets/platform/prompts/v1_4_3/pony_express_v1_4_3.md',
    referenceInputs: [platformRef, 'public/images/parchment-bg.jpg'],
    postProcessing: ['webp_compression'],
    usedBy: ['public/views/pony.html', 'public/index.html', 'public/styles.css'],
    replaces: [],
    rollbackPath: null,
    approvalNotes: 'Approved with caveats for Pony Express pending screenshot review.'
  },
  {
    id: 'saloon_future_games_hub_v1_4_3',
    path: 'public/assets/platform/saloon/saloon-future-games-hub-v1_4_3.webp',
    candidatePath: 'public/assets/candidates/v1_4_3/saloon/saloon-future-games-c01.png',
    surface: 'saloon',
    role: 'illustration',
    model: 'gpt-image-2',
    promptFile: 'specs/prompts/v1_4_3/saloon_future_games_hub_v1_4_3.md',
    promptMirrorFile: 'public/assets/platform/prompts/v1_4_3/saloon_future_games_hub_v1_4_3.md',
    referenceInputs: [platformRef, 'public/images/wood-header.jpg'],
    postProcessing: ['webp_compression'],
    usedBy: ['public/views/saloon.html', 'public/index.html', 'public/styles.css'],
    replaces: [],
    rollbackPath: null,
    approvalNotes: 'Approved with caveats for Saloon pending screenshot review.'
  },
  {
    id: 'sigil_ceremony_illustration_v1_4_3',
    path: 'public/assets/platform/sigil/sigil-ceremony-illustration-v1_4_3.webp',
    candidatePath: 'public/assets/candidates/v1_4_3/sigil/sigil-ceremony-c01.png',
    surface: 'sigil',
    role: 'illustration',
    model: 'gpt-image-2',
    promptFile: 'specs/prompts/v1_4_3/sigil_ceremony_v1_4_3.md',
    promptMirrorFile: 'public/assets/platform/prompts/v1_4_3/sigil_ceremony_v1_4_3.md',
    referenceInputs: [platformRef, 'public/images/parchment-bg.jpg'],
    postProcessing: ['webp_compression'],
    usedBy: ['public/views/sigil.html'],
    replaces: [],
    rollbackPath: null,
    approvalNotes: 'Approved with caveats for Sigil pending screenshot review.'
  },
  {
    id: 'atlas_leaderboard_illustration_v1_4_3',
    path: 'public/assets/platform/atlas/atlas-leaderboard-illustration-v1_4_3.webp',
    candidatePath: 'public/assets/candidates/v1_4_3/atlas/atlas-leaderboard-c01.png',
    surface: 'atlas',
    role: 'illustration',
    model: 'gpt-image-2',
    promptFile: 'specs/prompts/v1_4_3/atlas_leaderboard_v1_4_3.md',
    promptMirrorFile: 'public/assets/platform/prompts/v1_4_3/atlas_leaderboard_v1_4_3.md',
    referenceInputs: [platformRef, 'public/images/atlas-map-bg.jpg'],
    postProcessing: ['webp_compression'],
    usedBy: ['public/atlas.html', 'public/views/leaderboard.html', 'public/styles.css', 'public/index.html'],
    replaces: ['public/images/atlas-map-bg.jpg'],
    rollbackPath: 'public/images/atlas-map-bg.jpg',
    approvalNotes: 'Approved with caveats for Atlas and Leaderboard pending screenshot review.'
  },
  {
    id: 'ui_ornaments_empty_states_v1_4_3',
    path: 'public/assets/platform/generic/ui-ornaments-empty-states-v1_4_3.webp',
    candidatePath: 'public/assets/candidates/v1_4_3/generic/ui-ornaments-empty-states-c01.png',
    surface: 'generic',
    role: 'empty_state',
    model: 'gpt-image-2',
    promptFile: 'specs/prompts/v1_4_3/ui_ornaments_empty_states_v1_4_3.md',
    promptMirrorFile: 'public/assets/platform/prompts/v1_4_3/ui_ornaments_empty_states_v1_4_3.md',
    referenceInputs: [platformRef, 'public/images/parchment-bg.jpg'],
    postProcessing: ['webp_compression'],
    usedBy: ['public/share.html', 'public/views/leaderboard.html', 'public/styles.css'],
    replaces: [],
    rollbackPath: null,
    approvalNotes: 'Approved with caveats for generic empty-state ornamentation pending screenshot review.'
  },
  {
    id: 'hero_cast_group_existing_v1_4_3',
    path: 'public/assets/hero-cast/hero-cast-group.webp',
    surface: 'brand',
    role: 'card_art',
    model: 'existing',
    promptFile: null,
    promptMirrorFile: null,
    referenceInputs: heroCastRefs,
    postProcessing: ['reference_normalization'],
    usedBy: ['public/styles.css', 'public/start.html'],
    replaces: [],
    rollbackPath: null,
    futureUse: false,
    approvalNotes: 'Owner-supplied hero cast group remains approved for platform and marketing contexts.'
  },
  {
    id: 'hero_prairie_dog_ranger_existing_v1_4_3',
    path: 'public/assets/hero-cast/prairie-dog-ranger.webp',
    surface: 'brand',
    role: 'card_art',
    model: 'existing',
    promptFile: null,
    promptMirrorFile: null,
    referenceInputs: ['docs/brand/reference/hero-cast/prairie-dog-ranger-source.png'],
    postProcessing: ['reference_normalization'],
    usedBy: ['public/start.html'],
    replaces: [],
    rollbackPath: null,
    futureUse: false,
    approvalNotes: 'Owner-supplied hero portrait remains approved for platform contexts.'
  },
  {
    id: 'hero_sheriff_lobster_existing_v1_4_3',
    path: 'public/assets/hero-cast/sheriff-lobster.webp',
    surface: 'brand',
    role: 'card_art',
    model: 'existing',
    promptFile: null,
    promptMirrorFile: null,
    referenceInputs: ['docs/brand/reference/hero-cast/sheriff-lobster-source.jpeg'],
    postProcessing: ['reference_normalization'],
    usedBy: ['public/start.html'],
    replaces: [],
    rollbackPath: null,
    futureUse: false,
    approvalNotes: 'Owner-supplied hero portrait remains approved for platform contexts.'
  },
  {
    id: 'hero_chibi_homesteader_existing_v1_4_3',
    path: 'public/assets/hero-cast/chibi-homesteader.webp',
    surface: 'brand',
    role: 'card_art',
    model: 'existing',
    promptFile: null,
    promptMirrorFile: null,
    referenceInputs: ['docs/brand/reference/hero-cast/chibi-homesteader-girl-source.png'],
    postProcessing: ['reference_normalization'],
    usedBy: ['public/start.html'],
    replaces: [],
    rollbackPath: null,
    futureUse: false,
    approvalNotes: 'Owner-supplied hero portrait remains approved for platform contexts.'
  },
  {
    id: 'hero_wizard_kid_existing_v1_4_3',
    path: 'public/assets/hero-cast/wizard-kid.webp',
    surface: 'brand',
    role: 'card_art',
    model: 'existing',
    promptFile: null,
    promptMirrorFile: null,
    referenceInputs: ['docs/brand/reference/hero-cast/wizard-kid-source.png'],
    postProcessing: ['reference_normalization'],
    usedBy: ['public/start.html'],
    replaces: [],
    rollbackPath: null,
    futureUse: false,
    approvalNotes: 'Owner-supplied hero portrait remains approved for platform contexts.'
  }
];

export const routeSearchRoots = [
  'public/start.html',
  'public/index.html',
  'public/atlas.html',
  'public/share.html',
  'public/claim-wallet.html',
  'public/styles.css',
  'public/views/townhall.html',
  'public/views/brain.html',
  'public/views/house.html',
  'public/views/pony.html',
  'public/views/saloon.html',
  'public/views/sigil.html',
  'public/views/leaderboard.html'
];

export const inventoryRoots = [
  'public/assets',
  'public/images',
  'public/brand-kit',
  'public/agenttown.jpeg',
  'public/logo.jpg',
  'public/background.webp',
  'public/favicon-16x16.png',
  'public/favicon-32x32.png',
  'public/favicon.ico'
];

function normalizePath(value) {
  return value.split(path.sep).join('/');
}

export function fileExists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

export function sha256File(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  return crypto.createHash('sha256').update(fs.readFileSync(absolutePath)).digest('hex');
}

export function ensureDir(relativeDir) {
  fs.mkdirSync(path.join(repoRoot, relativeDir), { recursive: true });
}

export function ensureWebp(candidatePath, outputPath) {
  if (!candidatePath) return;
  const absoluteCandidate = path.join(repoRoot, candidatePath);
  const absoluteOutput = path.join(repoRoot, outputPath);
  if (!fs.existsSync(absoluteCandidate)) {
    throw new Error(`Missing candidate image: ${candidatePath}`);
  }
  ensureDir(path.dirname(outputPath));
  const shouldWrite = !fs.existsSync(absoluteOutput)
    || fs.statSync(absoluteCandidate).mtimeMs > fs.statSync(absoluteOutput).mtimeMs;
  if (!shouldWrite) return;
  execFileSync('cwebp', ['-q', '84', absoluteCandidate, '-o', absoluteOutput], { stdio: 'ignore' });
}

export function readImageDimensions(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  const output = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', absolutePath], { encoding: 'utf8' });
  const width = Number(output.match(/pixelWidth:\s+(\d+)/)?.[1] || 0);
  const height = Number(output.match(/pixelHeight:\s+(\d+)/)?.[1] || 0);
  return { width, height };
}

export function buildPlatformManifest() {
  let totalBytes = 0;
  const assets = platformAssetDefs.map((assetDef) => {
    if (assetDef.candidatePath) {
      ensureWebp(assetDef.candidatePath, assetDef.path);
    }
    const { width, height } = readImageDimensions(assetDef.path);
    const bytes = fs.statSync(path.join(repoRoot, assetDef.path)).size;
    totalBytes += bytes;
    const referenceHashes = Object.fromEntries(
      assetDef.referenceInputs.map((ref) => [ref, `sha256:${sha256File(ref)}`])
    );
    return {
      id: assetDef.id,
      path: assetDef.path,
      surface: assetDef.surface,
      role: assetDef.role,
      model: assetDef.model,
      promptFile: assetDef.promptFile || null,
      promptHash: assetDef.promptFile ? `sha256:${sha256File(assetDef.promptFile)}` : null,
      promptMirrorFile: assetDef.promptMirrorFile || null,
      referenceInputs: assetDef.referenceInputs,
      referenceHashes,
      candidatePaths: assetDef.candidatePath ? [assetDef.candidatePath] : [],
      postProcessing: assetDef.postProcessing,
      width,
      height,
      bytes,
      format: path.extname(assetDef.path).slice(1),
      usedBy: assetDef.usedBy,
      approvalStatus: 'approved_with_caveats',
      approvedBy: approvalBy,
      approvedAt: approvalDate,
      approvalNotes: assetDef.approvalNotes,
      replaces: assetDef.replaces,
      rollbackPath: assetDef.rollbackPath,
      futureUse: Boolean(assetDef.futureUse)
    };
  });
  return {
    schemaVersion: 'v1.4.3',
    styleFamily: 'agent-town-frontier-storybook-v1_4_3',
    modelFamily: 'gpt-image-2',
    generatedAt: new Date().toISOString(),
    approvalStatus: 'approved_with_caveats',
    approvedBy: approvalBy,
    approvedAt: approvalDate,
    totalBytes,
    budgetBytes: platformBudgetBytes,
    assets
  };
}

export function writePlatformManifest(manifest) {
  ensureDir('public/assets/platform');
  fs.writeFileSync(platformManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function walkFiles(relativePath, results = []) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return results;
  const stat = fs.statSync(absolutePath);
  if (stat.isFile()) {
    results.push(relativePath);
    return results;
  }
  for (const entry of fs.readdirSync(absolutePath, { withFileTypes: true })) {
    walkFiles(normalizePath(path.join(relativePath, entry.name)), results);
  }
  return results;
}

export function collectInventoryFiles() {
  const results = new Set();
  for (const root of inventoryRoots) {
    walkFiles(root, []).forEach((item) => results.add(normalizePath(item)));
  }
  return Array.from(results).sort((a, b) => a.localeCompare(b));
}

export function findCodeUsages(relativeAssetPath) {
  const matches = [];
  const needle = relativeAssetPath.replace(/^public\//, '/');
  for (const relativeFile of routeSearchRoots) {
    const absoluteFile = path.join(repoRoot, relativeFile);
    if (!fs.existsSync(absoluteFile)) continue;
    const content = fs.readFileSync(absoluteFile, 'utf8');
    if (content.includes(relativeAssetPath) || content.includes(needle) || content.includes(path.basename(relativeAssetPath))) {
      matches.push(relativeFile);
    }
  }
  return matches;
}

const replacementMap = new Map([
  ['public/assets/platform/town-shell-background-v1_4_2.webp', {
    promptFile: 'specs/prompts/v1_4_3/town_shell_background_v1_4_3.md',
    replacementPath: 'public/assets/platform/town_shell/town-shell-background-v1_4_3.webp'
  }],
  ['public/assets/platform/townhall-onboarding-illustration-v1_4_2.webp', {
    promptFile: 'specs/prompts/v1_4_3/townhall_onboarding_v1_4_3.md',
    replacementPath: 'public/assets/platform/townhall/townhall-onboarding-illustration-v1_4_3.webp'
  }],
  ['public/assets/platform/brain-connect-marker-v1_4_2.webp', {
    promptFile: 'specs/prompts/v1_4_3/brain_connect_v1_4_3.md',
    replacementPath: 'public/assets/platform/brain/brain-connect-illustration-v1_4_3.webp'
  }],
  ['public/background.webp', {
    promptFile: 'specs/prompts/v1_4_3/start_gate_hero_v1_4_3.md',
    replacementPath: 'public/assets/platform/start_gate/start-gate-hero-v1_4_3.webp'
  }],
  ['public/agenttown.jpeg', {
    promptFile: 'specs/prompts/v1_4_3/house_home_claim_share_v1_4_3.md',
    replacementPath: 'public/assets/platform/house/house-claim-share-illustration-v1_4_3.webp'
  }]
]);

function inferSurface(relativePath) {
  if (relativePath.includes('/start_gate/') || relativePath.includes('start-gate')) return 'start_gate';
  if (relativePath.includes('/town_shell/') || relativePath.includes('town-shell')) return 'town_shell';
  if (relativePath.includes('/townhall/')) return 'townhall';
  if (relativePath.includes('/brain/')) return 'brain';
  if (relativePath.includes('/house/') || relativePath.includes('claim') || relativePath.includes('share')) return 'house';
  if (relativePath.includes('/pony/')) return 'pony';
  if (relativePath.includes('/saloon/')) return 'saloon';
  if (relativePath.includes('/sigil/')) return 'sigil';
  if (relativePath.includes('/atlas/') || relativePath.includes('atlas-map') || relativePath.includes('districts_style_images')) return 'atlas';
  if (relativePath.includes('leaderboard')) return 'leaderboard';
  if (relativePath.includes('hero-cast')) return 'brand';
  if (relativePath.includes('favicon') || relativePath.includes('logo')) return 'generic';
  return 'generic';
}

function inferRole(relativePath) {
  if (relativePath.includes('favicon')) return 'favicon';
  if (relativePath.includes('logo')) return 'logo';
  if (relativePath.includes('background') || relativePath.includes('hero')) return 'hero_background';
  if (relativePath.includes('empty') || relativePath.includes('loading')) return 'empty_state';
  if (relativePath.includes('badge') || relativePath.includes('ribbon')) return 'badge';
  if (relativePath.includes('icon')) return 'icon';
  if (relativePath.includes('share')) return 'card_art';
  return 'illustration';
}

function inferPriority(surface, usedBy) {
  if (surface === 'start_gate' || surface === 'town_shell' || surface === 'townhall' || surface === 'brain') return 'P0';
  if (usedBy.length > 0) return 'P1';
  return 'P2';
}

function inferCurrentStatus(relativePath, usedBy) {
  if (relativePath.includes('/candidates/v1_4_3/')) return 'keep';
  if (replacementMap.has(relativePath)) return 'replace_with_existing';
  if (relativePath.includes('v1_4_3')) return 'keep';
  if (relativePath === 'public/background.webp' || relativePath === 'public/agenttown.jpeg') return usedBy.length > 0 ? 'retire' : 'retire';
  if (usedBy.length > 0) return 'keep';
  return 'unknown';
}

function inferReplacement(relativePath, surface) {
  if (replacementMap.has(relativePath)) return replacementMap.get(relativePath);
  const promptFile = platformAssetDefs.find((asset) => asset.path === relativePath)?.promptFile || null;
  if (promptFile) {
    return { promptFile, replacementPath: relativePath };
  }
  const bySurface = platformAssetDefs.find((asset) => asset.surface === surface && asset.model === 'gpt-image-2');
  return {
    promptFile: bySurface?.promptFile || null,
    replacementPath: bySurface?.path || null
  };
}

export function buildInventoryRows() {
  return collectInventoryFiles().map((relativePath) => {
    const usedBy = findCodeUsages(relativePath);
    const surface = inferSurface(relativePath);
    const role = inferRole(relativePath);
    const replacement = inferReplacement(relativePath, surface);
    const currentStatus = inferCurrentStatus(relativePath, usedBy);
    return {
      id: relativePath.replace(/^public\//, '').replace(/[/.]/g, '-'),
      currentPath: relativePath,
      usedBy,
      surface,
      role,
      currentStatus,
      priority: inferPriority(surface, usedBy),
      replacementPromptFile: replacement.promptFile,
      replacementPath: replacement.replacementPath,
      notes: currentStatus === 'replace_with_existing'
        ? 'Retained in repo for rollback while the V1.4.3 replacement carries the live route.'
        : currentStatus === 'retire'
          ? 'Legacy baseline kept only for rollback or reference.'
          : usedBy.length > 0
            ? 'Referenced by the live app shell or platform routes.'
            : 'Currently not referenced by live non-game routes; inventory kept for visibility.'
    };
  });
}

function formatUsedBy(value) {
  return value.length ? value.join('<br>') : '—';
}

export function renderInventoryMarkdown(rows) {
  const lines = [
    '# Agent Town V1.4.3 — App-Wide Asset Inventory',
    '',
    'This inventory is generated from the live repo roots that V1.4.3 covers. Founders Plot gameplay assets under `public/experiences/founders-plot/assets/` remain out of scope for this sprint and are only referenced for style continuity.',
    '',
    `- Generated at: ${new Date().toISOString()}`,
    `- Rows: ${rows.length}`,
    '',
    '| ID | Current path | Used by | Surface | Role | Current status | Priority | Replacement prompt | Replacement path | Notes |',
    '|---|---|---|---|---|---|---|---|---|---|'
  ];
  for (const row of rows) {
    lines.push(`| ${row.id} | \`${row.currentPath}\` | ${formatUsedBy(row.usedBy)} | ${row.surface} | ${row.role} | ${row.currentStatus} | ${row.priority} | ${row.replacementPromptFile ? `\`${row.replacementPromptFile}\`` : '—'} | ${row.replacementPath ? `\`${row.replacementPath}\`` : '—'} | ${row.notes} |`);
  }
  lines.push('');
  return lines.join('\n');
}

export function writeInventoryMarkdown(rows) {
  fs.writeFileSync(inventoryPath, renderInventoryMarkdown(rows));
}
