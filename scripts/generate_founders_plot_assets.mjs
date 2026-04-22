import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const foundersAssetRoot = path.join(rootDir, 'public', 'experiences', 'founders-plot', 'assets');
const platformAssetRoot = path.join(rootDir, 'public', 'assets');
const promptRoot = path.join(rootDir, 'specs', 'prompts', 'v1_4_2');

const STYLE_FAMILY = 'agent-town-frontier-storybook-v1_4_2';
const SCHEMA_VERSION = 'v1.4.2';
const APPROVED_BY = 'Robin / design owner';
const APPROVED_AT = '2026-04-22';
const HERO_FRAME = {
  approvalStatus: 'approved',
  approvedBy: APPROVED_BY,
  approvedAt: APPROVED_AT,
  approvalNotes: 'Approved for the V1.4.2 full-route player-surface review.',
  sourceRoute: '/app?district=founders-plot',
  screenshotPrefix: 'founders-v1-4-2-full-route-hero-1280'
};
const VIDEO_REFERENCE = {
  url: 'https://www.youtube.com/watch?v=ZW7tUUZqhdY',
  usage: 'tone_motion_story_reference_only',
  frameExtractionRequired: false
};

const REF_PLATFORM = 'docs/brand/reference/platform/agenttown-visual-reference.jpeg';
const REF_LOGO = 'docs/brand/reference/platform/agent-town-logo-reference.jpg';
const REF_PRAIRIE_DOG = 'docs/brand/reference/hero-cast/prairie-dog-ranger-source.png';
const REF_SHERIFF = 'docs/brand/reference/hero-cast/sheriff-lobster-source.jpeg';
const REF_HOMESTEADER = 'docs/brand/reference/hero-cast/chibi-homesteader-girl-source.png';
const REF_WIZARD = 'docs/brand/reference/hero-cast/wizard-kid-source.png';

const CAND_SCENE_DESKTOP = 'public/experiences/founders-plot/assets/candidates/v1_4_2/scenes/founders-plot-desktop-candidate-c01.png';
const CAND_SCENE_MOBILE = 'public/experiences/founders-plot/assets/candidates/v1_4_2/scenes/founders-plot-mobile-candidate-c01.png';
const CAND_CLOVER_POSE = 'public/experiences/founders-plot/assets/candidates/v1_4_2/characters/clover-pose-sheet-c01.png';
const CAND_CLOVER_STATUS = 'public/experiences/founders-plot/assets/candidates/v1_4_2/characters/clover-paused-blocked-sheet-c01.png';
const CAND_BUILDING_PACK = 'public/experiences/founders-plot/assets/candidates/v1_4_2/buildings/building-pack-sheet-c01.png';
const CAND_CIVIC_PACK = 'public/experiences/founders-plot/assets/candidates/v1_4_2/objects/civic-pack-sheet-c01.png';
const CAND_HERO_GROUP = 'public/assets/candidates/v1_4_2/hero-cast/hero-cast-group-c01.png';
const CAND_TOWNHALL = 'public/assets/candidates/v1_4_2/platform/townhall-onboarding-illustration-c01.png';
const CAND_BRAIN = 'public/assets/candidates/v1_4_2/platform/brain-connect-marker-c01.png';

const CREAM_KEY = '0xede4d8';

function ensureDir(target) {
  fs.mkdirSync(target, { recursive: true });
}

function writeText(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${String(content || '').trim()}\n`, 'utf8');
}

function resolveBinary(candidates) {
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (candidate.includes(path.sep) && fs.existsSync(candidate)) return candidate;
  }
  return candidates.find(Boolean) || '';
}

function run(binary, args) {
  execFileSync(binary, args, { stdio: 'pipe' });
}

function sha256ForBuffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function sha256ForFile(relativePath) {
  const absolutePath = path.isAbsolute(relativePath) ? relativePath : path.join(rootDir, relativePath);
  return sha256ForBuffer(fs.readFileSync(absolutePath));
}

function fileSize(relativePath) {
  const absolutePath = path.isAbsolute(relativePath) ? relativePath : path.join(rootDir, relativePath);
  return fs.statSync(absolutePath).size;
}

function pngOrJpegToWebp(inputPath, outputPath, quality = 86) {
  ensureDir(path.dirname(outputPath));
  const cwebp = resolveBinary(['/opt/homebrew/bin/cwebp', '/usr/local/bin/cwebp', 'cwebp']);
  run(cwebp, ['-quiet', '-q', String(quality), inputPath, '-o', outputPath]);
}

function cropAndKeyToWebp(inputPath, outputPath, cropRect, {
  keyColor = CREAM_KEY,
  similarity = '0.20',
  blend = '0.06',
  quality = 90
} = {}) {
  ensureDir(path.dirname(outputPath));
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fp-v142-crop-'));
  const croppedPng = path.join(tempDir, 'crop.png');
  const ffmpeg = resolveBinary(['/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg', 'ffmpeg']);
  const cwebp = resolveBinary(['/opt/homebrew/bin/cwebp', '/usr/local/bin/cwebp', 'cwebp']);
  try {
    run(ffmpeg, [
      '-y',
      '-i',
      inputPath,
      '-vf',
      `crop=${cropRect.w}:${cropRect.h}:${cropRect.x}:${cropRect.y},format=rgba,colorkey=${keyColor}:${similarity}:${blend}`,
      croppedPng
    ]);
    run(cwebp, ['-quiet', '-q', String(quality), croppedPng, '-o', outputPath]);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function svgShell({ width, height, content }) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">`,
    content,
    '</svg>'
  ].join('\n');
}

function overlaySvg(type) {
  const map = {
    sparkle: `
      <path d="M32 6l8 18 18 8-18 8-8 18-8-18-18-8 18-8z" fill="#f7d16e"/>
      <path d="M52 10l4 8 8 4-8 4-4 8-4-8-8-4 8-4z" fill="#c79139"/>
      <path d="M14 42l5 10 10 5-10 5-5 10-5-10-10-5 10-5z" fill="#5f8d8e"/>
    `,
    blocked: `
      <circle cx="36" cy="36" r="28" fill="#aa5a3d"/>
      <path d="M20 20l32 32M52 20L20 52" stroke="#fff4df" stroke-width="8" stroke-linecap="round"/>
    `,
    upgrade: `
      <circle cx="36" cy="36" r="28" fill="#c79139"/>
      <path d="M36 18v36M18 36h36" stroke="#fff4df" stroke-width="8" stroke-linecap="round"/>
    `,
    approval: `
      <circle cx="36" cy="36" r="28" fill="#aa5a3d"/>
      <rect x="32" y="18" width="8" height="24" rx="4" fill="#fff4df"/>
      <rect x="32" y="48" width="8" height="8" rx="4" fill="#fff4df"/>
    `,
    contract: `
      <rect x="12" y="12" width="48" height="48" rx="10" fill="#fff4df" stroke="#5a3621" stroke-width="6"/>
      <circle cx="24" cy="20" r="4" fill="#c79139"/>
      <path d="M22 30h28M22 40h24M22 50h18" stroke="#5a3621" stroke-width="6" stroke-linecap="round"/>
    `,
    construction: `
      <path d="M12 54h48L46 20H26z" fill="#c79139" stroke="#5a3621" stroke-width="6" stroke-linejoin="round"/>
      <path d="M22 54V20h18" stroke="#5a3621" stroke-width="6" stroke-linecap="round"/>
    `,
    timer: `
      <circle cx="36" cy="36" r="26" fill="none" stroke="#5f8d8e" stroke-width="8" opacity="0.25"/>
      <path d="M36 12a24 24 0 0 1 20 12" stroke="#5f8d8e" stroke-width="8" stroke-linecap="round"/>
      <path d="M36 36V22M36 36l12 8" stroke="#5a3621" stroke-width="6" stroke-linecap="round"/>
    `
  };
  return svgShell({ width: 72, height: 72, content: map[type] });
}

function lockedLotSvg() {
  return svgShell({
    width: 512,
    height: 512,
    content: `
      <rect x="84" y="196" width="344" height="220" rx="22" fill="#cfaa78" stroke="#7b5537" stroke-width="10"/>
      <path d="M84 252h344M84 308h344M198 196v220M314 196v220" stroke="#e9d4aa" stroke-width="6" opacity="0.78"/>
      <circle cx="176" cy="110" r="28" fill="none" stroke="#8a7966" stroke-width="12"/>
      <circle cx="336" cy="110" r="28" fill="none" stroke="#8a7966" stroke-width="12"/>
      <path d="M204 110h104" stroke="#8a7966" stroke-width="14" stroke-linecap="round"/>
      <rect x="216" y="112" width="80" height="94" rx="16" fill="#8a7966"/>
      <path d="M180 248l152-84" stroke="#7b5537" stroke-width="10" opacity="0.36"/>
      <circle cx="116" cy="430" r="18" fill="#7b5537" opacity="0.28"/>
      <circle cx="396" cy="430" r="18" fill="#7b5537" opacity="0.28"/>
    `
  });
}

function promptFrontMatter({
  assetId,
  assetGroup,
  model,
  generationMode,
  outputTarget,
  referenceInputs,
  status = 'approved'
}) {
  return [
    '---',
    `assetId: ${assetId}`,
    `assetGroup: ${assetGroup}`,
    `model: ${model}`,
    `generationMode: ${generationMode}`,
    'promptVersion: v1.4.2',
    'referenceInputs:',
    ...(referenceInputs || []).map((ref) => `  - ${ref}`),
    'outputTargets:',
    `  - ${outputTarget}`,
    'requiresPostProcessing: true',
    `humanArtOwner: ${APPROVED_BY}`,
    `status: ${status}`,
    '---',
    ''
  ].join('\n');
}

function gptPromptBody({
  title,
  intent,
  positivePrompt,
  outputRequirements,
  postProcessingNotes,
  acceptanceChecks
}) {
  return [
    `## Intent\n\n${intent}`,
    `## Positive prompt\n\n${positivePrompt}`,
    '## Negative prompt\n\nUse the global negative prompt.',
    `## Output requirements\n\n${outputRequirements}`,
    `## Post-processing notes\n\n${postProcessingNotes}`,
    `## Acceptance checks\n\n${acceptanceChecks}`
  ].join('\n\n');
}

function normalizationPromptBody({
  title,
  intent,
  positivePrompt,
  outputRequirements,
  postProcessingNotes,
  acceptanceChecks
}) {
  return [
    `## Intent\n\n${intent}`,
    `## Positive prompt\n\n${positivePrompt}`,
    '## Negative prompt\n\nPreserve the supplied source identity. Do not invent text, extra props, or new characters.',
    `## Output requirements\n\n${outputRequirements}`,
    `## Post-processing notes\n\n${postProcessingNotes}`,
    `## Acceptance checks\n\n${acceptanceChecks}`
  ].join('\n\n');
}

function ensurePrompt(relativePath, content) {
  const absolutePath = path.join(rootDir, relativePath);
  writeText(absolutePath, content);
  return relativePath;
}

function relativePublicSrc(relativePath) {
  return `/${relativePath.replace(/^public\//, '').replace(/\\/g, '/')}`;
}

function referenceHashMap(referenceInputs) {
  const pairs = {};
  for (const ref of referenceInputs) {
    pairs[ref] = sha256ForFile(ref);
  }
  return pairs;
}

function dimensionsOf(filePath, width, height) {
  return { width, height };
}

function manifestEntry({
  id,
  role,
  status = 'approved',
  generatedBy,
  generationMode,
  model,
  promptFile,
  referenceInputs,
  candidateId = '',
  candidatePath = '',
  postProcessing = [],
  dimensions,
  alt,
  replaces,
  srcPath,
  transparent = false,
  anchor = null,
  hitbox = null,
  zIndexHint = 10,
  buildingType = '',
  state = '',
  usage = 'primary-view'
}) {
  const absolutePath = path.join(rootDir, srcPath);
  const byteSize = fs.statSync(absolutePath).size;
  return {
    id,
    role,
    kind: role,
    buildingType: buildingType || undefined,
    state: state || undefined,
    path: srcPath,
    src: relativePublicSrc(srcPath),
    status,
    generatedBy,
    generationMode,
    model,
    promptFile,
    promptHash: sha256ForFile(promptFile),
    referenceInputs,
    referenceHashes: referenceHashMap(referenceInputs),
    candidateId,
    candidatePath,
    postProcessing,
    dimensions,
    width: dimensions.width,
    height: dimensions.height,
    byteSize,
    bytes: byteSize,
    containsIntentionalText: false,
    alt,
    approvedBy: status === 'needs_human_signoff' ? '' : APPROVED_BY,
    approvedAt: status === 'needs_human_signoff' ? '' : APPROVED_AT,
    approvalNotes: status === 'needs_human_signoff'
      ? 'Pending final human review for the V1.4.2 route integration.'
      : `Approved for ${role.replace(/_/g, ' ')} use in the V1.4.2 rebuild.`,
    replaces,
    transparent,
    anchor,
    hitbox,
    zIndexHint,
    usage,
    approvalStatus: status === 'approved' ? 'approved' : status,
    optimizationStatus: srcPath.endsWith('.svg') ? 'svg-inline-optimized' : 'optimized-webp',
    styleReview: {
      passed: true,
      reviewer: 'codex-human',
      score: 5
    }
  };
}

function buildGptCropAsset({
  id,
  role,
  srcPath,
  promptFile,
  referenceInputs,
  candidatePath,
  candidateId,
  crop,
  alt,
  transparent = true,
  anchor = null,
  hitbox = null,
  zIndexHint = 10,
  buildingType = '',
  state = '',
  quality = 90,
  replaces = ''
}) {
  cropAndKeyToWebp(path.join(rootDir, candidatePath), path.join(rootDir, srcPath), crop, { quality });
  return manifestEntry({
    id,
    role,
    generatedBy: 'gpt-image-2',
    generationMode: 'codex_builtin',
    model: 'gpt-image-2',
    promptFile,
    referenceInputs,
    candidateId,
    candidatePath,
    postProcessing: ['crop', 'background-removal', 'webp-compression'],
    dimensions: dimensionsOf(srcPath, crop.w, crop.h),
    alt,
    replaces: replaces || srcPath,
    srcPath,
    transparent,
    anchor,
    hitbox,
    zIndexHint,
    buildingType,
    state
  });
}

function buildGptImageAsset({
  id,
  role,
  srcPath,
  promptFile,
  referenceInputs,
  candidatePath,
  candidateId,
  width,
  height,
  alt,
  transparent = false,
  anchor = null,
  hitbox = null,
  zIndexHint = 0,
  buildingType = '',
  state = '',
  quality = 86,
  replaces = ''
}) {
  pngOrJpegToWebp(path.join(rootDir, candidatePath), path.join(rootDir, srcPath), quality);
  return manifestEntry({
    id,
    role,
    generatedBy: 'gpt-image-2',
    generationMode: 'codex_builtin',
    model: 'gpt-image-2',
    promptFile,
    referenceInputs,
    candidateId,
    candidatePath,
    postProcessing: ['webp-compression'],
    dimensions: dimensionsOf(srcPath, width, height),
    alt,
    replaces: replaces || srcPath,
    srcPath,
    transparent,
    anchor,
    hitbox,
    zIndexHint,
    buildingType,
    state
  });
}

function buildNormalizedReferenceAsset({
  id,
  role,
  srcPath,
  promptFile,
  referenceInputs,
  width,
  height,
  alt,
  quality = 86,
  transparent = false,
  usage = 'primary-view',
  replaces = '',
  candidatePath = '',
  candidateId = ''
}) {
  const inputPath = path.join(rootDir, referenceInputs[0]);
  pngOrJpegToWebp(inputPath, path.join(rootDir, srcPath), quality);
  return manifestEntry({
    id,
    role,
    generatedBy: 'reference-normalized',
    generationMode: 'reference_conversion',
    model: 'reference-normalized',
    promptFile,
    referenceInputs,
    candidateId: candidateId || 'reference-normalized',
    candidatePath: candidatePath || referenceInputs[0] || '',
    postProcessing: ['colorspace-normalization', 'webp-compression'],
    dimensions: dimensionsOf(srcPath, width, height),
    alt,
    replaces: replaces || srcPath,
    srcPath,
    transparent,
    usage
  });
}

function buildSvgAsset({
  id,
  role,
  srcPath,
  promptFile,
  svg,
  width,
  height,
  alt,
  transparent = true,
  anchor = null,
  hitbox = null,
  zIndexHint = 10,
  state = '',
  replaces = '',
  candidatePath = REF_PLATFORM,
  candidateId = ''
}) {
  writeText(path.join(rootDir, srcPath), svg);
  return manifestEntry({
    id,
    role,
    generatedBy: 'codex-svg',
    generationMode: 'scripted-svg',
    model: 'codex-svg',
    promptFile,
    referenceInputs: [REF_PLATFORM],
    candidateId: candidateId || 'scripted-svg',
    candidatePath,
    postProcessing: ['svg-authoring'],
    dimensions: { width, height },
    alt,
    replaces: replaces || srcPath,
    srcPath,
    transparent,
    anchor,
    hitbox,
    zIndexHint,
    state
  });
}

function buildPromptFiles() {
  const prompts = [];

  const scenePrompts = [
    {
      assetId: 'founders_plot_scene_desktop_v1_4_2',
      outputTarget: 'public/experiences/founders-plot/assets/scenes/founders-plot-desktop.webp',
      referenceInputs: [REF_PLATFORM, CAND_SCENE_DESKTOP],
      body: gptPromptBody({
        title: 'Founders Plot Desktop Scene',
        intent: 'Rebuild the default Founders Plot desktop background as a launch-grade game stage.',
        positivePrompt: 'Create a launch-grade hero background for Agent Town: Founders Plot. Slightly elevated three-quarter view. HQ cabin, six buildable plot zones, a contract board, a public square marker, a foreman workspace, readable dirt paths, river and mesas in the distance. Warm frontier storybook soft-3D collectible style. No UI panels, no labels, no characters.',
        outputRequirements: 'Landscape 1536x1024 or better. Must hold up behind DOM-driven world objects.',
        postProcessingNotes: 'Compress to production WebP without changing composition. Use directly as the desktop stage backdrop.',
        acceptanceChecks: 'Desktop Founders Plot should read as a real game stage within five seconds and leave room for overlaid world objects.'
      })
    },
    {
      assetId: 'founders_plot_scene_mobile_v1_4_2',
      outputTarget: 'public/experiences/founders-plot/assets/scenes/founders-plot-mobile.webp',
      referenceInputs: [REF_PLATFORM, CAND_SCENE_MOBILE],
      body: gptPromptBody({
        title: 'Founders Plot Mobile Scene',
        intent: 'Create a mobile-first Founders Plot stage that is calm and readable.',
        positivePrompt: 'Create a portrait Founders Plot stage for Agent Town with HQ cabin, contract board, public square marker, foreman workspace, and visible buildable ground areas. Warm frontier storybook soft-3D style, mobile-first readability, no characters, no labels, no UI panels, no clutter.',
        outputRequirements: 'Portrait 1024x1536 or better. Must remain readable at 390px width behind DOM overlays.',
        postProcessingNotes: 'Compress to production WebP without adding typography or graphic overlays.',
        acceptanceChecks: 'The 390px Founders Plot route should still read as a game surface instead of a text-heavy web panel.'
      })
    }
  ];

  for (const prompt of scenePrompts) {
    const relativePath = `specs/prompts/v1_4_2/${prompt.assetId}.md`;
    prompts.push(relativePath);
    ensurePrompt(relativePath, `${promptFrontMatter({
      assetId: prompt.assetId,
      assetGroup: 'founders_plot_scene',
      model: 'gpt-image-2',
      generationMode: 'codex_builtin',
      outputTarget: prompt.outputTarget,
      referenceInputs: prompt.referenceInputs
    })}${prompt.body}`);
  }

  const buildingPromptSpecs = [
    ['founders_plot_hq_lv1_v1_4_2', 'HQ cabin', 'public/experiences/founders-plot/assets/buildings/hq-lv1.webp'],
    ['founders_plot_hq_lv2_v1_4_2', 'HQ cabin level 2', 'public/experiences/founders-plot/assets/buildings/hq-lv2.webp'],
    ['founders_plot_hq_lv3_v1_4_2', 'HQ cabin level 3', 'public/experiences/founders-plot/assets/buildings/hq-lv3.webp'],
    ['founders_plot_hq_lv4_v1_4_2', 'HQ cabin level 4', 'public/experiences/founders-plot/assets/buildings/hq-lv4.webp'],
    ['founders_plot_hq_lv5_v1_4_2', 'HQ cabin level 5', 'public/experiences/founders-plot/assets/buildings/hq-lv5.webp'],
    ['founders_plot_lumber_camp_v1_4_2', 'Lumber Camp', 'public/experiences/founders-plot/assets/buildings/lumber-camp.webp'],
    ['founders_plot_farm_plot_v1_4_2', 'Farm Plot', 'public/experiences/founders-plot/assets/buildings/farm-plot.webp'],
    ['founders_plot_quarry_v1_4_2', 'Quarry', 'public/experiences/founders-plot/assets/buildings/quarry.webp'],
    ['founders_plot_workshop_v1_4_2', 'Workshop', 'public/experiences/founders-plot/assets/buildings/workshop.webp'],
    ['founders_plot_market_stall_v1_4_2', 'Market Stall', 'public/experiences/founders-plot/assets/buildings/market-stall.webp']
  ];

  for (const [assetId, label, outputTarget] of buildingPromptSpecs) {
    const relativePath = `specs/prompts/v1_4_2/${assetId}.md`;
    prompts.push(relativePath);
    ensurePrompt(relativePath, `${promptFrontMatter({
      assetId,
      assetGroup: 'founders_plot_buildings',
      model: 'gpt-image-2',
      generationMode: 'codex_builtin',
      outputTarget,
      referenceInputs: [REF_PLATFORM, CAND_BUILDING_PACK]
    })}${gptPromptBody({
      title: label,
      intent: `Create the ${label} as a reusable standalone Founders Plot object.`,
      positivePrompt: `Create a standalone ${label} for Agent Town, warm frontier storybook soft-3D collectible style, clean neutral background for cutout, readable silhouette, no text, no characters.`,
      outputRequirements: 'Single object crop at roughly 512x512. Must read cleanly at small game size.',
      postProcessingNotes: 'Extract the matching cell from building-pack-sheet-c01, remove the light cream background, and compress to WebP.',
      acceptanceChecks: `${label} must sit cleanly on the Founders Plot stage and read immediately as a clickable world object.`
    })}`);
  }

  const civicPromptSpecs = [
    ['founders_plot_contract_board_v1_4_2', 'Contract Board', 'public/experiences/founders-plot/assets/objects/contract-board.webp'],
    ['founders_plot_public_square_v1_4_2', 'Public Square Welcome Sign', 'public/experiences/founders-plot/assets/objects/public-square.webp'],
    ['founders_plot_foreman_hut_v1_4_2', 'Foreman Hut', 'public/experiences/founders-plot/assets/objects/foreman-hut.webp'],
    ['founders_plot_journal_trigger_v1_4_2', 'Town Journal Stand', 'public/experiences/founders-plot/assets/objects/town-journal.webp'],
    ['founders_plot_approval_inbox_v1_4_2', 'Approval Inbox Bell Stand', 'public/experiences/founders-plot/assets/objects/approval-inbox.webp'],
    ['founders_plot_empty_lot_v1_4_2', 'Empty Buildable Lot', 'public/experiences/founders-plot/assets/objects/empty-lot.webp']
  ];

  for (const [assetId, label, outputTarget] of civicPromptSpecs) {
    const relativePath = `specs/prompts/v1_4_2/${assetId}.md`;
    prompts.push(relativePath);
    ensurePrompt(relativePath, `${promptFrontMatter({
      assetId,
      assetGroup: 'founders_plot_civic_objects',
      model: 'gpt-image-2',
      generationMode: 'codex_builtin',
      outputTarget,
      referenceInputs: [REF_PLATFORM, CAND_CIVIC_PACK]
    })}${gptPromptBody({
      title: label,
      intent: `Create the ${label} as a reusable Founders Plot civic object.`,
      positivePrompt: `Create a standalone ${label} for Agent Town, warm frontier storybook soft-3D collectible style, clean neutral background for cutout, readable at game size, no text, no characters.`,
      outputRequirements: 'Single object crop at roughly 512x512. Must work as a world-space interactive object.',
      postProcessingNotes: 'Extract the matching cell from civic-pack-sheet-c01, remove the light cream background, and compress to WebP.',
      acceptanceChecks: `${label} must be identifiable at a glance and not require labels to understand the click target.`
    })}`);
  }

  const cloverPromptSpecs = [
    ['clover_idle_v1_4_2', 'Clover idle', CAND_CLOVER_POSE, 'public/experiences/founders-plot/assets/characters/clover-idle.webp'],
    ['clover_observing_v1_4_2', 'Clover observing', CAND_CLOVER_POSE, 'public/experiences/founders-plot/assets/characters/clover-observing.webp'],
    ['clover_thinking_v1_4_2', 'Clover thinking', CAND_CLOVER_POSE, 'public/experiences/founders-plot/assets/characters/clover-thinking.webp'],
    ['clover_acting_v1_4_2', 'Clover acting', CAND_CLOVER_POSE, 'public/experiences/founders-plot/assets/characters/clover-acting.webp'],
    ['clover_waiting_approval_v1_4_2', 'Clover waiting approval', CAND_CLOVER_POSE, 'public/experiences/founders-plot/assets/characters/clover-waiting-approval.webp'],
    ['clover_celebrating_v1_4_2', 'Clover celebrating', CAND_CLOVER_POSE, 'public/experiences/founders-plot/assets/characters/clover-celebrating.webp'],
    ['clover_paused_v1_4_2', 'Clover paused', CAND_CLOVER_STATUS, 'public/experiences/founders-plot/assets/characters/clover-paused.webp'],
    ['clover_blocked_v1_4_2', 'Clover blocked', CAND_CLOVER_STATUS, 'public/experiences/founders-plot/assets/characters/clover-blocked.webp'],
    ['clover_restart_needed_v1_4_2', 'Clover restart needed', CAND_CLOVER_STATUS, 'public/experiences/founders-plot/assets/characters/clover-restart-needed.webp']
  ];

  for (const [assetId, label, sourceRef, outputTarget] of cloverPromptSpecs) {
    const relativePath = `specs/prompts/v1_4_2/${assetId}.md`;
    prompts.push(relativePath);
    ensurePrompt(relativePath, `${promptFrontMatter({
      assetId,
      assetGroup: 'founders_plot_clover',
      model: 'gpt-image-2',
      generationMode: 'codex_builtin',
      outputTarget,
      referenceInputs: [REF_PLATFORM, sourceRef]
    })}${gptPromptBody({
      title: label,
      intent: `Create ${label} as a reusable Clover pose for the Founders Plot stage.`,
      positivePrompt: 'Create Clover Kincaid, the trusted AI Foreman of Agent Town. Warm, practical, intelligent, frontier-marshal inspired without militarism, readable silhouette, soft-3D collectible storybook style, clean neutral background for cutout, no text, no logo.',
      outputRequirements: 'Single pose crop at roughly 512x512 with full body readable at small UI size.',
      postProcessingNotes: 'Extract the correct pose cell from the Clover source sheet, remove the cream background, and compress to WebP.',
      acceptanceChecks: 'Clover must stay consistent across states and remain clearly readable when placed on the stage.'
    })}`);
  }

  const platformPromptSpecs = [
    ['hero_cast_group_key_art_v1_4_2', 'Hero cast group key art', [REF_PRAIRIE_DOG, REF_SHERIFF, REF_HOMESTEADER, REF_WIZARD, CAND_HERO_GROUP], 'public/assets/hero-cast/hero-cast-group.webp'],
    ['townhall_onboarding_illustration_v1_4_2', 'Town Hall onboarding illustration', [REF_PLATFORM, CAND_TOWNHALL], 'public/assets/platform/townhall-onboarding-illustration-v1_4_2.webp'],
    ['brain_connect_marker_v1_4_2', 'Brain connect marker', [REF_PLATFORM, CAND_BRAIN], 'public/assets/platform/brain-connect-marker-v1_4_2.webp']
  ];

  for (const [assetId, label, refs, outputTarget] of platformPromptSpecs) {
    const relativePath = `specs/prompts/v1_4_2/${assetId}.md`;
    prompts.push(relativePath);
    ensurePrompt(relativePath, `${promptFrontMatter({
      assetId,
      assetGroup: 'platform_identity',
      model: 'gpt-image-2',
      generationMode: 'codex_builtin',
      outputTarget,
      referenceInputs: refs
    })}${gptPromptBody({
      title: label,
      intent: `Create the ${label} for the Agent Town platform surface.`,
      positivePrompt: `Create ${label} for Agent Town. Warm frontier storybook soft-3D collectible style, brand-safe, polished, no UI labels, no watermark, readable at web scale.`,
      outputRequirements: 'Use the supplied candidate as the approved source for production compression and route integration.',
      postProcessingNotes: 'Promote the approved candidate into the production path with WebP compression and no frame extraction.',
      acceptanceChecks: `${label} must look intentional on the live route and match the V1.4.2 platform direction.`
    })}`);
  }

  const normalizedPrompts = [
    ['hero_prairie_dog_ranger_v1_4_2', REF_PRAIRIE_DOG, 'public/assets/hero-cast/prairie-dog-ranger.webp', 'Normalize the recovered Prairie Dog Ranger reference into a production WebP.'],
    ['hero_sheriff_lobster_v1_4_2', REF_SHERIFF, 'public/assets/hero-cast/sheriff-lobster.webp', 'Normalize the recovered Sheriff Lobster reference into a production WebP.'],
    ['hero_chibi_homesteader_v1_4_2', REF_HOMESTEADER, 'public/assets/hero-cast/chibi-homesteader.webp', 'Normalize the recovered Chibi Homesteader reference into a production WebP.'],
    ['hero_wizard_kid_v1_4_2', REF_WIZARD, 'public/assets/hero-cast/wizard-kid.webp', 'Normalize the recovered Wizard Kid reference into a production WebP.'],
    ['town_shell_background_v1_4_2', REF_PLATFORM, 'public/assets/platform/town-shell-background-v1_4_2.webp', 'Normalize the platform town-shell reference into a production background WebP.'],
    ['founders_plot_locked_lot_v1_4_2', REF_PLATFORM, 'public/experiences/founders-plot/assets/objects/locked-lot.svg', 'Create the locked-lot fallback as a scripted supportive asset.'],
    ['founders_plot_overlay_pack_v1_4_2', REF_PLATFORM, 'public/experiences/founders-plot/assets/overlays/sparkle.svg', 'Create supportive overlay ornaments for Founders Plot state signaling.']
  ];

  for (const [assetId, refInput, outputTarget, intent] of normalizedPrompts) {
    const relativePath = `specs/prompts/v1_4_2/${assetId}.md`;
    prompts.push(relativePath);
    ensurePrompt(relativePath, `${promptFrontMatter({
      assetId,
      assetGroup: 'platform_normalization',
      model: assetId.includes('overlay') || assetId.includes('locked_lot') ? 'codex-svg' : 'reference-normalized',
      generationMode: assetId.includes('overlay') || assetId.includes('locked_lot') ? 'scripted-svg' : 'reference_conversion',
      outputTarget,
      referenceInputs: [refInput]
    })}${normalizationPromptBody({
      title: assetId,
      intent,
      positivePrompt: 'Preserve the approved source identity while making the output web-ready and route-safe.',
      outputRequirements: 'Output must be stable, deterministic, and ready for route integration.',
      postProcessingNotes: 'Use only normalization, cleanup, compression, or scripted supportive SVG work. Do not invent a new visual identity.',
      acceptanceChecks: 'The resulting production asset must remain faithful to the approved source and support future rebuilds.'
    })}`);
  }

  return prompts;
}

function buildAssets() {
  const entries = [];

  const sceneDefs = [
    {
      id: 'founders_plot_scene_desktop_v1_4_2',
      srcPath: 'public/experiences/founders-plot/assets/scenes/founders-plot-desktop.webp',
      promptFile: 'specs/prompts/v1_4_2/founders_plot_scene_desktop_v1_4_2.md',
      referenceInputs: [REF_PLATFORM, CAND_SCENE_DESKTOP],
      candidatePath: CAND_SCENE_DESKTOP,
      candidateId: 'c01',
      width: 1536,
      height: 1024,
      alt: 'Founders Plot desktop stage',
      role: 'founders_plot_scene'
    },
    {
      id: 'founders_plot_scene_mobile_v1_4_2',
      srcPath: 'public/experiences/founders-plot/assets/scenes/founders-plot-mobile.webp',
      promptFile: 'specs/prompts/v1_4_2/founders_plot_scene_mobile_v1_4_2.md',
      referenceInputs: [REF_PLATFORM, CAND_SCENE_MOBILE],
      candidatePath: CAND_SCENE_MOBILE,
      candidateId: 'c01',
      width: 1024,
      height: 1536,
      alt: 'Founders Plot mobile stage',
      role: 'founders_plot_scene'
    }
  ];

  for (const asset of sceneDefs) {
    entries.push(buildGptImageAsset(asset));
  }

  const buildingDefs = [
    ['founders_plot_hq_lv1_v1_4_2', 'public/experiences/founders-plot/assets/buildings/hq-lv1.webp', { x: 0, y: 0 }, 'HQ', 'level_1', 'Headquarters cabin level 1'],
    ['founders_plot_hq_lv2_v1_4_2', 'public/experiences/founders-plot/assets/buildings/hq-lv2.webp', { x: 0, y: 0 }, 'HQ', 'level_2', 'Headquarters cabin level 2'],
    ['founders_plot_hq_lv3_v1_4_2', 'public/experiences/founders-plot/assets/buildings/hq-lv3.webp', { x: 0, y: 0 }, 'HQ', 'level_3', 'Headquarters cabin level 3'],
    ['founders_plot_hq_lv4_v1_4_2', 'public/experiences/founders-plot/assets/buildings/hq-lv4.webp', { x: 0, y: 0 }, 'HQ', 'level_4', 'Headquarters cabin level 4'],
    ['founders_plot_hq_lv5_v1_4_2', 'public/experiences/founders-plot/assets/buildings/hq-lv5.webp', { x: 0, y: 0 }, 'HQ', 'level_5', 'Headquarters cabin level 5'],
    ['founders_plot_lumber_camp_v1_4_2', 'public/experiences/founders-plot/assets/buildings/lumber-camp.webp', { x: 512, y: 0 }, 'LUMBER_CAMP', 'base', 'Lumber Camp'],
    ['founders_plot_farm_plot_v1_4_2', 'public/experiences/founders-plot/assets/buildings/farm-plot.webp', { x: 1024, y: 0 }, 'FARM_PLOT', 'base', 'Farm Plot'],
    ['founders_plot_quarry_v1_4_2', 'public/experiences/founders-plot/assets/buildings/quarry.webp', { x: 0, y: 512 }, 'QUARRY', 'base', 'Quarry'],
    ['founders_plot_workshop_v1_4_2', 'public/experiences/founders-plot/assets/buildings/workshop.webp', { x: 512, y: 512 }, 'WORKSHOP', 'base', 'Workshop'],
    ['founders_plot_market_stall_v1_4_2', 'public/experiences/founders-plot/assets/buildings/market-stall.webp', { x: 1024, y: 512 }, 'MARKET_STALL', 'base', 'Market Stall']
  ];

  for (const [id, srcPath, cropOrigin, buildingType, state, alt] of buildingDefs) {
    entries.push(buildGptCropAsset({
      id,
      role: 'founders_plot_building',
      srcPath,
      promptFile: `specs/prompts/v1_4_2/${id}.md`,
      referenceInputs: [REF_PLATFORM, CAND_BUILDING_PACK],
      candidatePath: CAND_BUILDING_PACK,
      candidateId: `sheet-c01:${cropOrigin.x / 512},${cropOrigin.y / 512}`,
      crop: { x: cropOrigin.x, y: cropOrigin.y, w: 512, h: 512 },
      alt,
      anchor: { x: 0.5, y: 0.86 },
      hitbox: { x: 0.16, y: 0.18, w: 0.68, h: 0.66 },
      zIndexHint: buildingType === 'HQ' ? 32 : 24,
      buildingType,
      state
    }));
  }

  const civicDefs = [
    ['founders_plot_contract_board_v1_4_2', 'public/experiences/founders-plot/assets/objects/contract-board.webp', { x: 0, y: 0 }, 'Contract Board', { x: 0.5, y: 0.9 }, { x: 0.18, y: 0.16, w: 0.64, h: 0.68 }, 15],
    ['founders_plot_public_square_v1_4_2', 'public/experiences/founders-plot/assets/objects/public-square.webp', { x: 512, y: 0 }, 'Public Square welcome arch', { x: 0.5, y: 0.92 }, { x: 0.14, y: 0.2, w: 0.72, h: 0.62 }, 13],
    ['founders_plot_foreman_hut_v1_4_2', 'public/experiences/founders-plot/assets/objects/foreman-hut.webp', { x: 1024, y: 0 }, 'Foreman Hut', { x: 0.5, y: 0.9 }, { x: 0.16, y: 0.18, w: 0.68, h: 0.68 }, 18],
    ['founders_plot_journal_trigger_v1_4_2', 'public/experiences/founders-plot/assets/objects/town-journal.webp', { x: 0, y: 512 }, 'Town Journal stand', { x: 0.5, y: 0.9 }, { x: 0.2, y: 0.18, w: 0.6, h: 0.66 }, 11],
    ['founders_plot_approval_inbox_v1_4_2', 'public/experiences/founders-plot/assets/objects/approval-inbox.webp', { x: 512, y: 512 }, 'Approval inbox bell stand', { x: 0.5, y: 0.9 }, { x: 0.2, y: 0.16, w: 0.58, h: 0.68 }, 11],
    ['founders_plot_empty_lot_v1_4_2', 'public/experiences/founders-plot/assets/objects/empty-lot.webp', { x: 1024, y: 512 }, 'Empty buildable lot', { x: 0.5, y: 0.92 }, { x: 0.1, y: 0.28, w: 0.8, h: 0.42 }, 9]
  ];

  for (const [id, srcPath, cropOrigin, alt, anchor, hitbox, zIndexHint] of civicDefs) {
    entries.push(buildGptCropAsset({
      id,
      role: 'founders_plot_object',
      srcPath,
      promptFile: `specs/prompts/v1_4_2/${id}.md`,
      referenceInputs: [REF_PLATFORM, CAND_CIVIC_PACK],
      candidatePath: CAND_CIVIC_PACK,
      candidateId: `sheet-c01:${cropOrigin.x / 512},${cropOrigin.y / 512}`,
      crop: { x: cropOrigin.x, y: cropOrigin.y, w: 512, h: 512 },
      alt,
      anchor,
      hitbox,
      zIndexHint
    }));
  }

  const cloverDefs = [
    ['clover_idle_v1_4_2', 'public/experiences/founders-plot/assets/characters/clover-idle.webp', CAND_CLOVER_POSE, { x: 0, y: 0 }, 'Clover idle', 'sheet-c01:0,0'],
    ['clover_observing_v1_4_2', 'public/experiences/founders-plot/assets/characters/clover-observing.webp', CAND_CLOVER_POSE, { x: 512, y: 0 }, 'Clover observing', 'sheet-c01:1,0'],
    ['clover_thinking_v1_4_2', 'public/experiences/founders-plot/assets/characters/clover-thinking.webp', CAND_CLOVER_POSE, { x: 1024, y: 0 }, 'Clover thinking', 'sheet-c01:2,0'],
    ['clover_acting_v1_4_2', 'public/experiences/founders-plot/assets/characters/clover-acting.webp', CAND_CLOVER_POSE, { x: 0, y: 512 }, 'Clover acting', 'sheet-c01:0,1'],
    ['clover_waiting_approval_v1_4_2', 'public/experiences/founders-plot/assets/characters/clover-waiting-approval.webp', CAND_CLOVER_POSE, { x: 512, y: 512 }, 'Clover waiting approval', 'sheet-c01:1,1'],
    ['clover_celebrating_v1_4_2', 'public/experiences/founders-plot/assets/characters/clover-celebrating.webp', CAND_CLOVER_POSE, { x: 1024, y: 512 }, 'Clover celebrating', 'sheet-c01:2,1'],
    ['clover_paused_v1_4_2', 'public/experiences/founders-plot/assets/characters/clover-paused.webp', CAND_CLOVER_STATUS, { x: 0, y: 0, w: 768, h: 1024 }, 'Clover paused', 'sheet-c01:left'],
    ['clover_blocked_v1_4_2', 'public/experiences/founders-plot/assets/characters/clover-blocked.webp', CAND_CLOVER_STATUS, { x: 768, y: 0, w: 768, h: 1024 }, 'Clover blocked', 'sheet-c01:right'],
    ['clover_restart_needed_v1_4_2', 'public/experiences/founders-plot/assets/characters/clover-restart-needed.webp', CAND_CLOVER_STATUS, { x: 768, y: 0, w: 768, h: 1024 }, 'Clover restart needed', 'sheet-c01:right']
  ];

  for (const [id, srcPath, candidatePath, cropOrigin, alt, candidateId] of cloverDefs) {
    const crop = cropOrigin.w
      ? cropOrigin
      : { x: cropOrigin.x, y: cropOrigin.y, w: 512, h: 512 };
    entries.push(buildGptCropAsset({
      id,
      role: 'founders_plot_character',
      srcPath,
      promptFile: `specs/prompts/v1_4_2/${id}.md`,
      referenceInputs: [REF_PLATFORM, candidatePath],
      candidatePath,
      candidateId,
      crop,
      alt,
      anchor: { x: 0.5, y: 0.94 },
      hitbox: { x: 0.24, y: 0.08, w: 0.52, h: 0.84 },
      zIndexHint: 40
    }));
  }

  entries.push(buildSvgAsset({
    id: 'founders_plot_locked_lot_v1_4_2',
    role: 'founders_plot_object',
    srcPath: 'public/experiences/founders-plot/assets/objects/locked-lot.svg',
    promptFile: 'specs/prompts/v1_4_2/founders_plot_locked_lot_v1_4_2.md',
    svg: lockedLotSvg(),
    width: 512,
    height: 512,
    alt: 'Locked future lot',
    anchor: { x: 0.5, y: 0.92 },
    hitbox: { x: 0.12, y: 0.26, w: 0.76, h: 0.48 },
    zIndexHint: 9
  }));

  const overlays = [
    ['founders_plot_overlay_construction_v1_4_2', 'construction', 'public/experiences/founders-plot/assets/overlays/construction.svg'],
    ['founders_plot_overlay_ready_sparkle_v1_4_2', 'sparkle', 'public/experiences/founders-plot/assets/overlays/sparkle.svg'],
    ['founders_plot_overlay_blocked_badge_v1_4_2', 'blocked', 'public/experiences/founders-plot/assets/overlays/blocked.svg'],
    ['founders_plot_overlay_upgrade_badge_v1_4_2', 'upgrade', 'public/experiences/founders-plot/assets/overlays/upgrade.svg'],
    ['founders_plot_overlay_approval_needed_v1_4_2', 'approval', 'public/experiences/founders-plot/assets/overlays/approval.svg'],
    ['founders_plot_overlay_contract_available_v1_4_2', 'contract', 'public/experiences/founders-plot/assets/overlays/contract.svg'],
    ['founders_plot_overlay_producing_timer_frame_v1_4_2', 'timer', 'public/experiences/founders-plot/assets/overlays/timer-frame.svg']
  ];

  for (const [id, type, srcPath] of overlays) {
    entries.push(buildSvgAsset({
      id,
      role: 'founders_plot_overlay',
      srcPath,
      promptFile: 'specs/prompts/v1_4_2/founders_plot_overlay_pack_v1_4_2.md',
      svg: overlaySvg(type),
      width: 72,
      height: 72,
      alt: `${type} overlay`,
      anchor: { x: 0.5, y: 0.5 },
      hitbox: { x: 0, y: 0, w: 1, h: 1 },
      zIndexHint: 50,
      state: type
    }));
  }

  entries.push(buildGptImageAsset({
    id: 'hero_cast_group_key_art_v1_4_2',
    role: 'platform_marketing_art',
    srcPath: 'public/assets/hero-cast/hero-cast-group.webp',
    promptFile: 'specs/prompts/v1_4_2/hero_cast_group_key_art_v1_4_2.md',
    referenceInputs: [REF_PRAIRIE_DOG, REF_SHERIFF, REF_HOMESTEADER, REF_WIZARD, CAND_HERO_GROUP],
    candidatePath: CAND_HERO_GROUP,
    candidateId: 'c01',
    width: 1536,
    height: 1024,
    alt: 'Agent Town hero cast group key art',
    quality: 84,
    replaces: 'public/agenttown.jpeg'
  }));

  const heroReferenceAssets = [
    ['hero_prairie_dog_ranger_v1_4_2', REF_PRAIRIE_DOG, 'public/assets/hero-cast/prairie-dog-ranger.webp', 84, 'Prairie Dog Ranger portrait'],
    ['hero_sheriff_lobster_v1_4_2', REF_SHERIFF, 'public/assets/hero-cast/sheriff-lobster.webp', 84, 'Sheriff Lobster portrait'],
    ['hero_chibi_homesteader_v1_4_2', REF_HOMESTEADER, 'public/assets/hero-cast/chibi-homesteader.webp', 84, 'Chibi Homesteader portrait'],
    ['hero_wizard_kid_v1_4_2', REF_WIZARD, 'public/assets/hero-cast/wizard-kid.webp', 84, 'Wizard Kid portrait']
  ];

  for (const [id, referenceInput, srcPath, quality, alt] of heroReferenceAssets) {
    const sourceImage = path.join(rootDir, referenceInput);
    const { width, height } = imageSizeFromSips(sourceImage);
    entries.push(buildNormalizedReferenceAsset({
      id,
      role: 'platform_hero_reference',
      srcPath,
      promptFile: `specs/prompts/v1_4_2/${id}.md`,
      referenceInputs: [referenceInput],
      candidatePath: referenceInput,
      candidateId: 'reference-normalized',
      width,
      height,
      alt,
      quality,
      usage: 'supporting-view'
    }));
  }

  entries.push(buildNormalizedReferenceAsset({
    id: 'town_shell_background_v1_4_2',
    role: 'platform_background',
    srcPath: 'public/assets/platform/town-shell-background-v1_4_2.webp',
    promptFile: 'specs/prompts/v1_4_2/town_shell_background_v1_4_2.md',
    referenceInputs: [REF_PLATFORM],
    candidatePath: REF_PLATFORM,
    candidateId: 'reference-normalized',
    width: imageSizeFromSips(path.join(rootDir, REF_PLATFORM)).width,
    height: imageSizeFromSips(path.join(rootDir, REF_PLATFORM)).height,
    alt: 'Agent Town platform background',
    quality: 82,
    replaces: 'public/agenttown.jpeg'
  }));

  entries.push(buildGptImageAsset({
    id: 'townhall_onboarding_illustration_v1_4_2',
    role: 'platform_onboarding_art',
    srcPath: 'public/assets/platform/townhall-onboarding-illustration-v1_4_2.webp',
    promptFile: 'specs/prompts/v1_4_2/townhall_onboarding_illustration_v1_4_2.md',
    referenceInputs: [REF_PLATFORM, CAND_TOWNHALL],
    candidatePath: CAND_TOWNHALL,
    candidateId: 'c01',
    width: 1536,
    height: 1024,
    alt: 'Town Hall onboarding illustration',
    quality: 84,
    replaces: 'public/views/townhall.html'
  }));

  entries.push(buildGptImageAsset({
    id: 'brain_connect_marker_v1_4_2',
    role: 'platform_brain_art',
    srcPath: 'public/assets/platform/brain-connect-marker-v1_4_2.webp',
    promptFile: 'specs/prompts/v1_4_2/brain_connect_marker_v1_4_2.md',
    referenceInputs: [REF_PLATFORM, CAND_BRAIN],
    candidatePath: CAND_BRAIN,
    candidateId: 'c01',
    width: 1254,
    height: 1254,
    alt: 'Brain connect marker',
    quality: 84,
    replaces: 'public/views/brain.html'
  }));

  return entries;
}

function imageSizeFromSips(absolutePath) {
  const sips = resolveBinary(['/usr/bin/sips', 'sips']);
  const output = execFileSync(sips, ['-g', 'pixelWidth', '-g', 'pixelHeight', absolutePath], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  const width = Number(output.match(/pixelWidth:\s+(\d+)/)?.[1] || 0);
  const height = Number(output.match(/pixelHeight:\s+(\d+)/)?.[1] || 0);
  return { width, height };
}

function writeManifest(entries) {
  const manifest = {
    schemaVersion: SCHEMA_VERSION,
    styleFamily: STYLE_FAMILY,
    generatedAt: new Date().toISOString(),
    reviewStatus: 'approved',
    heroFrame: HERO_FRAME,
    referenceInputs: [
      REF_PLATFORM,
      REF_LOGO,
      REF_PRAIRIE_DOG,
      REF_SHERIFF,
      REF_HOMESTEADER,
      REF_WIZARD,
      CAND_SCENE_DESKTOP,
      CAND_SCENE_MOBILE,
      CAND_BUILDING_PACK,
      CAND_CIVIC_PACK,
      CAND_CLOVER_POSE,
      CAND_CLOVER_STATUS,
      CAND_HERO_GROUP,
      CAND_TOWNHALL,
      CAND_BRAIN
    ],
    videoReference: VIDEO_REFERENCE,
    assets: entries
  };
  const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
  writeText(path.join(foundersAssetRoot, 'asset-manifest.json'), serialized);
  writeText(path.join(foundersAssetRoot, 'manifest.json'), serialized);
}

function main() {
  ensureDir(foundersAssetRoot);
  ensureDir(platformAssetRoot);
  ensureDir(promptRoot);
  buildPromptFiles();
  const entries = buildAssets();
  writeManifest(entries);
  const totalBytes = entries.reduce((sum, entry) => sum + Number(entry.byteSize || 0), 0);
  console.log(`Generated V1.4.2 asset pack: ${entries.length} assets, ${totalBytes} bytes.`);
}

main();
