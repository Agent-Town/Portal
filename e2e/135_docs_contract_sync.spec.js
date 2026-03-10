const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

test('Phase 16 docs stay in sync with shipped web, poker, trainer, and Atlas contracts', async () => {
  const apiContract = readRepoFile('specs/02_api_contract.md');
  for (const route of [
    '/api/web/resolve',
    '/api/web/import',
    '/api/web/sessions',
    '/api/web/credentials/start',
    '/api/poker/admin/sync',
    '/api/poker/seasons/:seasonId/submissions',
    '/v1/seasons/:seasonId/submissions',
    '/v1/runs/:runId/replay',
  ]) {
    expect(apiContract).toContain(route);
  }

  const skillContract = readRepoFile('public/skill.md');
  expect(skillContract).toContain('trainer.invoke_action`, `trainer.list_evidence`, and `trainer.get_session_context` accept optional `webSessionId`.');
  expect(skillContract).toContain('Preserve backend ids exactly:');
  expect(skillContract).toContain('`invocationId`');
  expect(skillContract).toContain('`evidenceId`');
  expect(skillContract).toContain('`webSessionId`');
  expect(skillContract).toContain('`atlas`, `registry`, `poker`, `pony`, `townhall`, `saloon`, `leaderboard`, `house`, `brain`, `sigil`');
  expect(skillContract).toContain('Do not navigate to direct standalone routes (for example `/poker`) when a modal intent exists.');

  const skillContractLine = readRepoFile('e2e/55_phase3_skill_contract_line.spec.js');
  expect(skillContractLine).toContain('trainer.invoke_action`, `trainer.list_evidence`, and `trainer.get_session_context` accept optional `webSessionId`.');
  expect(skillContractLine).toContain('Preserve backend ids exactly:');
  expect(skillContractLine).toContain('`invocationId`');
  expect(skillContractLine).toContain('`evidenceId`');
  expect(skillContractLine).toContain('`webSessionId`');

  const internalTestline = readRepoFile('docs/internal-skill-testline.md');
  expect(internalTestline).toContain('Trainer namespace Web Experience parity');
  expect(internalTestline).toContain('/api/web/*');
  expect(internalTestline).toContain('`invocationId` / `evidenceId`');
  expect(internalTestline).toContain('Experience UI intent tools (modal open / Atlas search / Registry search / Poker modal / Pony compose)');
  expect(internalTestline).toContain('e2e/136_poker_modal_embed_policy.spec.js');

  const trainerSpec = readRepoFile('specs/14_trainer_namespace_tdd_spec.md');
  expect(trainerSpec).toContain('`webSessionId`');
  expect(trainerSpec).toContain('POST /api/web/sessions/:id/actions/:actionId/invoke');
  expect(trainerSpec).toContain('GET /api/web/sessions/:id/evidence');
  expect(trainerSpec).toContain('backend `invocationId` parity');
  expect(trainerSpec).toContain('backend `evidenceId` values exactly');
  expect(trainerSpec).toContain('e2e/127_web_approval_roundtrip.spec.js');
  expect(trainerSpec).toContain('e2e/135_docs_contract_sync.spec.js');

  const atlasSpec = readRepoFile('specs/11_district_map_storefront_spec.md');
  expect(atlasSpec).toContain('Atlas is modal-first.');
  expect(atlasSpec).toContain('standalone `/atlas` access redirects back to the hub');

  const intentSpec = readRepoFile('specs/15_experience_os_intent_tools_tdd_spec.md');
  expect(intentSpec).toContain('"modal": "atlas|registry|poker|pony|townhall|saloon|leaderboard|house|brain|sigil"');
  expect(intentSpec).toContain('registry` and `poker` render through the modal iframe/embed path');

  const implementationPack = readRepoFile('specs/16_portal_web_poker_v0.4_implementation_pack.md');
  expect(implementationPack).toContain('Portal Poker pages are modal-first from the town hub.');
  expect(implementationPack).toContain('Standalone `/poker*` requests redirect back to the town hub modal entry route');
});
