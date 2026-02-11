const { test, expect } = require('@playwright/test');
const crypto = require('crypto');
const {
  CEREMONY_E2EE_P256_AESGCM_V1,
  makeCeremonyRevealPair,
  encryptCeremonyReveal,
  decryptCeremonyReveal
} = require('./helpers/ceremony_crypto');

const resetToken = process.env.TEST_RESET_TOKEN || 'test-reset';

test.beforeEach(async ({ request }) => {
  await request.post('/__test__/reset', { headers: { 'x-test-reset': resetToken } });
});

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest();
}

test('ceremony rejects plaintext reveals and relays sealed envelopes only', async ({ request }) => {
  const stateResp = await request.get('/api/state');
  expect(stateResp.ok()).toBeTruthy();
  const state = await stateResp.json();
  const teamCode = state.teamCode;
  expect(teamCode).toBeTruthy();

  const connectResp = await request.post('/api/agent/connect', {
    data: { teamCode, agentName: 'BoundaryBot' }
  });
  expect(connectResp.ok()).toBeTruthy();

  const rh = crypto.randomBytes(32);
  const ra = crypto.randomBytes(32);
  const humanPair = makeCeremonyRevealPair();
  const agentPair = makeCeremonyRevealPair();

  const humanCommit = sha256(rh).toString('base64');
  const agentCommit = sha256(ra).toString('base64');

  const humanCommitResp = await request.post('/api/human/house/commit', {
    data: { commit: humanCommit, revealPub: humanPair.publicKeyB64 }
  });
  expect(humanCommitResp.ok()).toBeTruthy();

  const agentCommitResp = await request.post('/api/agent/house/commit', {
    data: { teamCode, commit: agentCommit, revealPub: agentPair.publicKeyB64 }
  });
  expect(agentCommitResp.ok()).toBeTruthy();

  const badHumanReveal = await request.post('/api/human/house/reveal', {
    data: { sealedForAgent: rh.toString('base64') }
  });
  expect(badHumanReveal.status()).toBe(400);
  const badHumanJson = await badHumanReveal.json();
  expect(badHumanJson.error).toBe('INVALID_REVEAL_ENVELOPE');

  const badAgentReveal = await request.post('/api/agent/house/reveal', {
    data: { teamCode, sealedForHuman: ra.toString('base64') }
  });
  expect(badAgentReveal.status()).toBe(400);
  const badAgentJson = await badAgentReveal.json();
  expect(badAgentJson.error).toBe('INVALID_REVEAL_ENVELOPE');

  const preHumanMaterialResp = await request.get('/api/human/house/material');
  expect(preHumanMaterialResp.ok()).toBeTruthy();
  const preHumanMaterial = await preHumanMaterialResp.json();
  expect(preHumanMaterial.agentRevealSealed).toBeNull();
  expect(preHumanMaterial.houseId).toBeNull();

  const preAgentMaterialResp = await request.get(`/api/agent/house/material?teamCode=${encodeURIComponent(teamCode)}`);
  expect(preAgentMaterialResp.ok()).toBeTruthy();
  const preAgentMaterial = await preAgentMaterialResp.json();
  expect(preAgentMaterial.humanRevealSealed).toBeNull();
  expect(preAgentMaterial.houseId).toBeNull();

  const sealedForAgent = encryptCeremonyReveal({
    revealBytes: rh,
    recipientRevealPubB64: agentPair.publicKeyB64,
    direction: 'human_to_agent',
    teamCode
  });
  const humanRevealResp = await request.post('/api/human/house/reveal', {
    data: { sealedForAgent }
  });
  expect(humanRevealResp.ok()).toBeTruthy();

  const sealedForHuman = encryptCeremonyReveal({
    revealBytes: ra,
    recipientRevealPubB64: humanPair.publicKeyB64,
    direction: 'agent_to_human',
    teamCode
  });
  const agentRevealResp = await request.post('/api/agent/house/reveal', {
    data: { teamCode, sealedForHuman }
  });
  expect(agentRevealResp.ok()).toBeTruthy();

  const humanMaterialResp = await request.get('/api/human/house/material');
  expect(humanMaterialResp.ok()).toBeTruthy();
  const humanMaterial = await humanMaterialResp.json();
  expect(humanMaterial.agentRevealSealed).toBeTruthy();
  expect(humanMaterial.agentRevealSealed.alg).toBe(CEREMONY_E2EE_P256_AESGCM_V1);
  expect(humanMaterial).not.toHaveProperty('agentReveal');
  expect(humanMaterial).not.toHaveProperty('humanReveal');
  expect(humanMaterial.houseId).toBeNull();

  const agentMaterialResp = await request.get(`/api/agent/house/material?teamCode=${encodeURIComponent(teamCode)}`);
  expect(agentMaterialResp.ok()).toBeTruthy();
  const agentMaterial = await agentMaterialResp.json();
  expect(agentMaterial.humanRevealSealed).toBeTruthy();
  expect(agentMaterial.humanRevealSealed.alg).toBe(CEREMONY_E2EE_P256_AESGCM_V1);
  expect(agentMaterial).not.toHaveProperty('agentReveal');
  expect(agentMaterial).not.toHaveProperty('humanReveal');
  expect(agentMaterial.houseId).toBeNull();

  const recoveredRa = decryptCeremonyReveal({
    sealed: humanMaterial.agentRevealSealed,
    privateKey: humanPair.privateKey,
    direction: 'agent_to_human',
    teamCode
  });
  expect(Buffer.compare(recoveredRa, ra)).toBe(0);

  const recoveredRh = decryptCeremonyReveal({
    sealed: agentMaterial.humanRevealSealed,
    privateKey: agentPair.privateKey,
    direction: 'human_to_agent',
    teamCode
  });
  expect(Buffer.compare(recoveredRh, rh)).toBe(0);
});
