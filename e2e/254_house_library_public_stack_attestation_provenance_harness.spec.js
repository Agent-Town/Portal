const { test, expect } = require('@playwright/test');

const { resetPortalWebState } = require('./helpers/portal_web');
const {
  exportPlatformSnapshot,
  getPlatformFixture,
  getPlatformInspector,
  getPlatformStats,
  importPlatformSnapshot,
  listPlatformFixtures,
} = require('./helpers/unified_platform');

const REQUIRED_FAMILIES = [
  'library_public_stack_attestation_provenance_seed',
];

test.beforeEach(async ({ request }) => {
  await resetPortalWebState(request);
});

test('M37.0: unified platform harness exposes deterministic Public Stack attestation provenance fixtures and inspectors', async ({ request }) => {
  const listed = await listPlatformFixtures(request);
  expect(listed?.ok).toBe(true);
  expect(Array.isArray(listed?.families)).toBe(true);
  expect(listed.families).toEqual(expect.arrayContaining(REQUIRED_FAMILIES));

  const statsA = await getPlatformStats(request);
  const statsB = await getPlatformStats(request);
  expect(statsA?.ok).toBe(true);
  expect(statsB?.ok).toBe(true);
  expect(statsA.stats).toEqual(statsB.stats);
  expect(statsA.stats?.fixtureFamilies).toEqual(expect.arrayContaining(REQUIRED_FAMILIES));
  expect(statsA.stats?.inspectors).toEqual(expect.objectContaining({
    publicStackAttestationProvenance: true,
    publicStackAttestationVerificationReceipts: true,
  }));
  expect(statsA.stats?.counts).toEqual(expect.objectContaining({
    library_public_stack_attestation_provenance: 0,
    library_public_stack_attestation_verification_receipts: 0,
  }));

  const fixture = await getPlatformFixture(request, 'library_public_stack_attestation_provenance_seed');
  expect(fixture?.ok).toBe(true);
  expect(fixture?.fixture).toEqual(expect.objectContaining({
    phase: '37.0',
    description: expect.stringContaining('Public Stack attestation provenance'),
    provenance: expect.objectContaining({
      messageVersion: 'v1',
      supportedChains: ['solana'],
      verificationStatuses: ['verified', 'mismatch'],
      sealStates: ['unsealed', 'unchecked', 'verified', 'mismatch'],
    }),
  }));

  const provenanceInspector = await getPlatformInspector(request, 'public-stack-attestation-provenance');
  expect(provenanceInspector.status).toBe(200);
  expect(provenanceInspector.json).toMatchObject({
    ok: true,
    inspector: 'public-stack-attestation-provenance',
    data: {
      provenance: [],
      filters: {
        sourceHouseId: '',
        teamId: '',
        libraryPublicStackId: '',
        libraryPublicStackAttestationId: '',
        chain: '',
      },
    },
  });

  const receiptInspector = await getPlatformInspector(request, 'public-stack-attestation-verification-receipts');
  expect(receiptInspector.status).toBe(200);
  expect(receiptInspector.json).toMatchObject({
    ok: true,
    inspector: 'public-stack-attestation-verification-receipts',
    data: {
      verificationReceipts: [],
      filters: {
        targetHouseId: '',
        teamId: '',
        libraryPublicStackId: '',
        libraryPublicStackAttestationId: '',
        libraryPublicStackAttestationProvenanceId: '',
        verificationStatus: '',
      },
    },
  });

  const exported = await exportPlatformSnapshot(request);
  expect(exported.status).toBe(200);
  const snapshot = exported.json?.snapshot;
  expect(Array.isArray(snapshot?.tables?.library_public_stack_attestation_provenance)).toBe(true);
  expect(Array.isArray(snapshot?.tables?.library_public_stack_attestation_verification_receipts)).toBe(true);

  const imported = await importPlatformSnapshot(request, snapshot, { reset: true });
  expect(imported.status).toBe(200);

  const statsAfterImport = await getPlatformStats(request);
  expect(statsAfterImport?.stats?.counts).toEqual(expect.objectContaining({
    library_public_stack_attestation_provenance: 0,
    library_public_stack_attestation_verification_receipts: 0,
  }));
});
