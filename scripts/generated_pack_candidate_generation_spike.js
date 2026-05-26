#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const {
  runCandidateImageGenerationSpike
} = require('../server/world_grid/generated_asset_generation');

function parseArgs(argv) {
  const args = {
    packPath: '',
    targetLimit: undefined,
    writeJobLogs: true
  };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--pack') {
      args.packPath = argv[index + 1] || '';
      index += 1;
    } else if (arg === '--target-limit') {
      args.targetLimit = Number.parseInt(argv[index + 1] || '', 10);
      index += 1;
    } else if (arg === '--no-write') {
      args.writeJobLogs = false;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    }
  }
  return args;
}

function usage() {
  return [
    'Usage: node scripts/generated_pack_candidate_generation_spike.js --pack <generated-pack.json> [--target-limit n] [--no-write]',
    '',
    'This command only performs the GU-5 consent/auth/cost preflight and job-log evidence.',
    'It does not call an image model, read provider secrets, or approve production assets.',
    '',
    'Gate environment:',
    '  GENERATED_PACK_IMAGE_RUN_ENABLED=1',
    '  GENERATED_PACK_IMAGE_PRODUCT_SECURITY_APPROVAL=granted',
    '  GENERATED_PACK_IMAGE_AUTH_MODEL_DOCUMENTED=1',
    '  GENERATED_PACK_IMAGE_AUTH_MODE=operator_managed|oauth_user_delegated',
    '  GENERATED_PACK_IMAGE_COST_MODEL_DOCUMENTED=1',
    '  GENERATED_PACK_IMAGE_COST_ACCEPTED=1',
    '  GENERATED_PACK_IMAGE_USER_CONSENT=granted',
    '  GENERATED_PACK_IMAGE_TEAM_CONSENT=granted',
    '  GENERATED_PACK_IMAGE_ESTIMATED_MIN_USD=0',
    '  GENERATED_PACK_IMAGE_ESTIMATED_MAX_USD=0'
  ].join('\n');
}

function configFromEnv(env) {
  return {
    enabled: env.GENERATED_PACK_IMAGE_RUN_ENABLED === '1',
    productSecurityApprovalGranted: env.GENERATED_PACK_IMAGE_PRODUCT_SECURITY_APPROVAL === 'granted',
    authModelDocumented: env.GENERATED_PACK_IMAGE_AUTH_MODEL_DOCUMENTED === '1',
    authMode: env.GENERATED_PACK_IMAGE_AUTH_MODE || 'not_configured',
    costModelDocumented: env.GENERATED_PACK_IMAGE_COST_MODEL_DOCUMENTED === '1',
    costEstimateAccepted: env.GENERATED_PACK_IMAGE_COST_ACCEPTED === '1',
    userConsentGranted: env.GENERATED_PACK_IMAGE_USER_CONSENT === 'granted',
    teamConsentGranted: env.GENERATED_PACK_IMAGE_TEAM_CONSENT === 'granted',
    estimatedCostUsd: {
      min: env.GENERATED_PACK_IMAGE_ESTIMATED_MIN_USD || 0,
      max: env.GENERATED_PACK_IMAGE_ESTIMATED_MAX_USD || 0
    }
  };
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.packPath) {
    console.log(usage());
    process.exitCode = args.help ? 0 : 2;
    return;
  }
  const packPath = path.resolve(process.cwd(), args.packPath);
  const pack = JSON.parse(fs.readFileSync(packPath, 'utf8'));
  const result = await runCandidateImageGenerationSpike({
    pack,
    config: configFromEnv(process.env),
    targetLimit: args.targetLimit,
    writeJobLogs: args.writeJobLogs
  });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error?.message || String(error));
  process.exitCode = 1;
});
