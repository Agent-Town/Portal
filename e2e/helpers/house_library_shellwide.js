const { expect } = require('@playwright/test');

const { callPageJson, attachHouseToPageSession } = require('./unified_platform');
const { seedHouseLibraryRouteSyncScene } = require('./house_library_route_sync');
const {
  APPROVED_PUBLICATION_ID,
  seedPublishedHouseLibraryPublicStack,
} = require('./house_library_public_stacks');

const APPROVED_RELAY_ID = 'appr_fixture_library_peer_relay_approved_01';
const APPROVED_SATCHEL_RELAY_ID = 'appr_fixture_library_satchel_relay_approved_01';

async function seedHouseLibraryShellwideScene(page, request, playwrightRequest, {
  titlePrefix = 'Shellwide',
} = {}) {
  const scene = await seedHouseLibraryRouteSyncScene(page, request, playwrightRequest, {
    titlePrefix,
    stackCount: 1,
  });

  await attachHouseToPageSession(page, {
    houseId: scene.sourceHouse.houseId,
    teamId: 'team_main',
  });

  const secondPack = await seedPublishedHouseLibraryPublicStack(page, {
    idPrefix: `${String(titlePrefix || 'Shellwide').trim().replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-relay`,
    title: `${titlePrefix} Relay Pack`,
    scopeTitle: `${titlePrefix} Relay Pack`,
    alphaTitle: `${titlePrefix} Relay Note`,
    betaTitle: `${titlePrefix} Relay Checklist`,
  });

  const relayResp = await callPageJson(page, '/api/platform/library/peer-relays', {
    method: 'POST',
    headers: { 'Idempotency-Key': `phase42-peer-relay-${String(titlePrefix || 'shellwide').toLowerCase()}` },
    data: {
      libraryPublicationId: String(secondPack.alphaPublicationId || ''),
      targetHouseId: scene.targetHouse.houseId,
      transportKind: 'pony.relay.registry.v1',
      approvalId: APPROVED_RELAY_ID,
    },
  });
  expect(relayResp.status).toBe(201);
  const libraryPeerRelayId = String(relayResp.json?.data?.relay?.libraryPeerRelayId || '');
  expect(libraryPeerRelayId).toBeTruthy();

  const relayDeliverResp = await callPageJson(page, `/api/platform/library/peer-relays/${encodeURIComponent(libraryPeerRelayId)}/deliver`, {
    method: 'POST',
    data: {},
  });
  expect([200, 201]).toContain(relayDeliverResp.status);

  const satchelRelayResp = await callPageJson(page, '/api/platform/library/satchel-relays', {
    method: 'POST',
    headers: { 'Idempotency-Key': `phase42-satchel-relay-${String(titlePrefix || 'shellwide').toLowerCase()}` },
    data: {
      scopeSetId: String(secondPack.scopeSetId || ''),
      targetHouseId: scene.targetHouse.houseId,
      transportKind: 'pony.relay.registry.v1',
      approvalId: APPROVED_SATCHEL_RELAY_ID,
    },
  });
  expect(satchelRelayResp.status).toBe(201);
  const librarySatchelRelayId = String(satchelRelayResp.json?.data?.relay?.librarySatchelRelayId || '');
  expect(librarySatchelRelayId).toBeTruthy();

  const satchelDeliverResp = await callPageJson(page, `/api/platform/library/satchel-relays/${encodeURIComponent(librarySatchelRelayId)}/deliver`, {
    method: 'POST',
    data: {},
  });
  expect([200, 201]).toContain(satchelDeliverResp.status);

  await attachHouseToPageSession(page, {
    houseId: scene.targetHouse.houseId,
    teamId: 'team_main',
  });

  return {
    ...scene,
    relayPack: secondPack,
    libraryPeerRelayId,
    librarySatchelRelayId,
    approvals: {
      publication: APPROVED_PUBLICATION_ID,
      peerRelay: APPROVED_RELAY_ID,
      satchelRelay: APPROVED_SATCHEL_RELAY_ID,
    },
  };
}

module.exports = {
  seedHouseLibraryShellwideScene,
};
