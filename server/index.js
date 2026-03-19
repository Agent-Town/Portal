const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const https = require('https');
const http = require('http');
const net = require('net');
const dns = require('dns').promises;
const zlib = require('zlib');
const express = require('express');
const { registerLlmRoutes } = require('../vendors/openclaw-lite-main/server/routes/llm');
let WebSocketServer = null;
try {
  ({ WebSocketServer } = require('ws'));
} catch {
  WebSocketServer = null;
}

const { loadDotEnv } = require('./env');

loadDotEnv();

const { parseCookies, nowIso, randomHex } = require('./util');
const { readStore, writeStore, getStorePath } = require('./store');
const { getAtlasSnapshot, searchAtlasAgents } = require('./atlas');
const { createPonyTransportService } = require('./ponyTransport');
const { createServerHouseVaultBackend } = require('./houseVaultBackend');
const { createPostageVerifier } = require('./postageVerifier');
const { emitMilestone } = require('./milestones');
const { computeRewardsSummary } = require('./rewards');
const {
  createSession,
  deleteSessionById,
  getSessionById,
  getSessionByTeamCode,
  getSessionByHouseId,
  bindSessionWallet,
  getSessionByWallet,
  indexHouseId,
  listElements,
  evaluateMatch,
  resetAllSessions,
  CANVAS,
  defaultLiteState
} = require('./sessions');
const {
  activateCredentialGrant,
  countTableRows,
  createApprovalRequest,
  createCredentialGrant,
  createImportJob,
  createEvidence,
  createInvocation,
  createRegistryClaimStart,
  createWebSession,
  decideApproval,
  getActiveCredentialGrant,
  getApprovalById,
  getCredentialGrantById,
  getImportJobById,
  getInvocationByIdempotency,
  getLatestCheckpointForSession,
  getLatestPokerLeaderboardSnapshot,
  getPokerBatchById,
  getPokerLeaderboardSnapshotById,
  getPokerReplayArtifactByRunId,
  getRegistryFamilyBySlug,
  getRegistryHealth,
  getRegistryEntityById,
  getRegistryProofByRegistryId,
  getRegistryReviewQueue,
  getPokerRunById,
  getPokerSeasonById,
  getPokerSubmissionById,
  getPokerSubmissionByRequest,
  getWebSessionById,
  listApprovalsForSession,
  listCredentialStatusByOrigin,
  listEvidenceForSession,
  listPokerLeaderboardSnapshots,
  listPokerSeasons,
  resetExtendedStore,
  searchRegistryFamilyGroups,
  searchRegistryEntities,
  setWebSessionRevisionAndState,
  touchCredentialGrant,
  upsertPokerBatch,
  upsertPokerLeaderboardSnapshot,
  upsertPokerReplayArtifact,
  upsertPokerRun,
  upsertPokerSeason,
  upsertPokerSubmission,
  writeCheckpoint,
} = require('./web_poker_store');
const { getLiveSuiteManifest, getLiveSuiteStatuses } = require('./live_suite_manifest');
const { getRouteOwnerManifest, registerRouteOwner, resetRouteOwnerManifest } = require('./route_manifest');
const { registerPlatformReadRoutes } = require('./platform_read_routes');
const { registerWebRoutes } = require('./web_routes');
const { registerRegistryRoutes } = require('./registry_routes');
const { registerRegistryWebPokerTestRoutes } = require('./registry_web_poker_test_routes');
const { registerPlatformV1Routes } = require('./platform_v1_routes');
const { registerPokerRoutes } = require('./poker_routes');
const {
  getRegistryWebPokerTestFixture,
  getRegistryWebPokerTestStats,
  listRegistryWebPokerFixtureFamilies,
} = require('./registry_web_poker_fixtures');
const {
  countTrackProgressEventsByDedupe,
  createLibraryItem,
  createLibraryLink,
  createLibraryPeerReceipt,
  createLibraryPeerRelay,
  createLibrarySatchelReceipt,
  createLibrarySatchelRelay,
  createLibraryPublication,
  createScopeSet,
  createTrackProgressEvent,
  createTraceArtifact,
  createTrainerJob,
  createTrainerResult,
  createIntegrationCandidate,
  createIntegrationExecution,
  createIntegrationPackVersion,
  addLibraryShelfItem,
  createConversationArtifact,
  createLibraryItemRevision,
  createLibraryShelf,
  createLibraryPublicStack,
  createLibraryPublicStackAttestation,
  createLibraryPublicStackAttestationProvenance,
  createLibraryPublicStackAttestationVerificationReceipt,
  createLibraryRouteSubscription,
  createLibraryRouteSyncReceipt,
  createLibraryPublicStackMember,
  createLibraryPublicStackReview,
  createLibraryPublicStackSafetyRecord,
  createLibraryPublicStackVerification,
  createLibraryPublicStackVerificationMember,
  createRun,
  createSealedContextViolation,
  createTraceEvent,
  createTraceIntakeRecord,
  countUnifiedPlatformTableRows,
  getConfigVersion,
  getConfigVersionByIdempotency,
  getApprovalRecordById,
  getConversationArtifactById,
  getConversationArtifactByIdempotency,
  getIntegrationCandidateById,
  getIntegrationCandidateByIdempotency,
  getIntegrationExecutionByIdempotency,
  getIntegrationPackVersionByIdempotency,
  getLatestTraceEvent,
  getLibraryItemById,
  getLibraryItemByIdempotency,
  getLibraryPeerRelayById,
  getLibraryPeerRelayByIdempotency,
  getLibraryPublicationById,
  getLibraryPublicStackById,
  getLibraryPublicStackByIdempotency,
  getLibraryPublicStackAttestation,
  getLibraryPublicStackAttestationById,
  getLibraryPublicStackAttestationByIdempotency,
  getLibraryPublicStackAttestationProvenance,
  getLibraryPublicStackAttestationProvenanceById,
  getLibraryPublicStackAttestationProvenanceByIdempotency,
  getLibraryPublicStackAttestationVerificationReceipt,
  getLibraryPublicStackAttestationVerificationReceiptById,
  getLibraryPublicStackAttestationVerificationReceiptByIdempotency,
  getLibraryRouteSubscriptionById,
  getLibraryRouteSubscriptionByIdempotency,
  getLibraryRouteSyncReceiptById,
  getLibraryRouteSyncReceiptByIdempotency,
  getLibraryPublicStackReview,
  getLibraryPublicStackReviewById,
  getLibraryPublicStackReviewByIdempotency,
  getLibraryPublicStackSafetyRecord,
  getLibraryPublicStackSafetyRecordById,
  getLibraryPublicStackSafetyRecordByIdempotency,
  getLibraryPublicStackVerificationById,
  getLibraryPublicStackVerificationByIdempotency,
  getLatestLibraryPublicStackVerification,
  getLibrarySatchelRelayById,
  getLibrarySatchelRelayByIdempotency,
  getLibraryPublicationByIdempotency,
  getLibraryShelfById,
  getLibraryShelfByIdempotency,
  getRunByIdempotency,
  getRunById,
  getRunByTraceId,
  getScopeSetById,
  getScopeSetByIdempotency,
  getSealedContextById,
  getTeamConfigBinding,
  getTrackDefinition,
  getTrainerJobById,
  getTrainerJobByIdempotency,
  getTrainerResultById,
  getTrainerResultByJobId,
  getTraceArtifactById,
  getTraceIntakeRecord,
  getUnifiedPlatformBenchmarksSnapshot,
  getUnifiedPlatformConversationArtifactsInspector,
  getUnifiedPlatformEditorSnapshot,
  getUnifiedPlatformLibraryInspector,
  getUnifiedPlatformRouteSyncInspector,
  getUnifiedPlatformPeerRelayInspector,
  getUnifiedPlatformPromptPreview,
  getUnifiedPlatformPublicStackAttestationsInspector,
  getUnifiedPlatformPublicStackAttestationProvenanceInspector,
  getUnifiedPlatformPublicStackAttestationVerificationReceiptsInspector,
  getUnifiedPlatformPublicStackReviewsInspector,
  getUnifiedPlatformPublicStackSafetyInspector,
  getUnifiedPlatformPublicStackTrustInspector,
  getUnifiedPlatformPublicStacksInspector,
  getUnifiedPlatformPublicationsInspector,
  getUnifiedPlatformRegistryPreviewSnapshot,
  getUnifiedPlatformRevisionsInspector,
  getUnifiedPlatformSatchelExchangeInspector,
  getUnifiedPlatformShelvesInspector,
  getUnifiedPlatformScopesInspector,
  getUnifiedPlatformTestFixture,
  getUnifiedPlatformTestStats,
  isUnifiedPlatformTable,
  listConfigComponentVersions,
  listHouseTeamIds,
  listConversationArtifacts,
  listLibraryItems,
  listLibraryItemRevisions,
  listLibraryLinks,
  listLibraryPeerReceipts,
  listLibraryPeerRelays,
  listLibraryRouteSubscriptions,
  listLibraryRouteSyncReceipts,
  listLibraryPublicStackAttestations,
  listLibraryPublicStackAttestationProvenance,
  listLibraryPublicStackAttestationVerificationReceipts,
  listLibraryPublicStackMembers,
  listLibraryPublicStackReviews,
  listLibraryPublicStackSafetyRecords,
  listLibraryPublicStacks,
  listLibraryPublicStackVerificationMembers,
  listLibraryPublicStackVerifications,
  listLibrarySatchelRelays,
  listLibrarySatchelReceipts,
  listLibraryPublications,
  listLibraryShelfItems,
  listLibraryShelves,
  listScopeSetItems,
  listScopeSets,
  listTrackDefinitions,
  listTrackProgressEvents,
  listRuns,
  listTrainerJobs,
  listTrainerResults,
  listTraceEvents,
  listUnifiedPlatformFixtureFamilies,
  removeLibraryShelfItem,
  replaceScopeSetItems,
  replaceConfigComponentVersions,
  resetUnifiedPlatformStore,
  setUnifiedPlatformBenchmarkSnapshot,
  setUnifiedPlatformRegistryPreviewSnapshot,
  setUnifiedPlatformPromptPreview,
  updateLibraryPublicStackReview,
  updateLibraryPublicStackSafetyRecord,
  updateLibraryPublicStackVerification,
  updateLibraryRouteSubscription,
  updateLibraryRouteSyncReceipt,
  updateLibraryPeerRelay,
  updateLibrarySatchelRelay,
  updateLibraryItem,
  updateRunMetadata,
  updateSealedContextStatus,
  updateTrainerJobStatus,
  updateTrainerResultLink,
  updateRunStatus,
  upsertApprovalRecord,
  upsertSealedContext,
  upsertTeamConfigBinding,
  upsertConfigVersion,
} = require('./unified_platform_store');
const {
  DEFAULT_OPERATOR_TOKEN,
  POKER_OPERATOR_SCHEMA_VERSION,
  createBatch: createPokerOperatorBatch,
  createSeason: createPokerOperatorSeason,
  createSubmission: createPokerOperatorSubmission,
  getBatchDetail: getPokerOperatorBatchDetail,
  getLeaderboardSnapshotDetail: getPokerOperatorLeaderboardSnapshotDetail,
  listLeaderboardSnapshotHistory: listPokerOperatorLeaderboardSnapshotHistory,
  getLatestLeaderboardDetail: getPokerOperatorLatestLeaderboardDetail,
  getPokerOperatorSnapshot,
  getReplayDetail: getPokerOperatorReplayDetail,
  getRunDetail: getPokerOperatorRunDetail,
  getSeasonDetail: getPokerOperatorSeasonDetail,
  listSeasons: listPokerOperatorSeasons,
  resetPokerOperatorState,
  seedPokerOperatorState,
} = require('./poker_operator');
const { createPokerOperatorClient } = require('./poker_operator_client');
const {
  consumeEmailOtp,
  getEmailOtpActivity,
  getLatestEmailOtp,
  issueEmailOtp,
  resetEmailOtpAdapter,
} = require('./email_otp_adapter');
const {
  exportPlatformStateSnapshot,
  importPlatformStateSnapshot,
  verifyPlatformStateSnapshot,
} = require('./platform_export');

const PORTAL_WEB_API_VERSION = '2026-03-09';

function b64ToBytes(str) {
  const bin = Buffer.from(str, 'base64');
  return new Uint8Array(bin);
}

// --- Pony Express v0 (inbox + sealed notes) ---
const MAYOR_HOUSE_ID = 'npc_mayor';
const CEREMONY_E2EE_P256_AESGCM_V1 = 'CEREMONY_E2EE_P256_AESGCM_V1';
const PONY_E2EE_P256_AESGCM_V1 = 'PONY_E2EE_P256_AESGCM_V1';
const PONY_MAX_PLAINTEXT_CT_BYTES = 4096;
const PONY_MAX_E2EE_CT_BYTES = 32 * 1024;
const PONY_MAX_E2EE_AAD_BYTES = 4096;

function makePonyMsgKeyInfo({ fromHouseId = '', toHouseId = '' }) {
  const from = typeof fromHouseId === 'string' ? fromHouseId : '';
  const to = typeof toHouseId === 'string' ? toHouseId : '';
  return `elizatown-pony-msg-v1|from=${from}|to=${to}`;
}

function normalizePonyCiphertextE2EE(ciphertext) {
  const epk = typeof ciphertext.epk === 'string' ? ciphertext.epk.trim() : '';
  const ct = typeof ciphertext.ct === 'string' ? ciphertext.ct.trim() : '';
  const iv = typeof ciphertext.iv === 'string' ? ciphertext.iv.trim() : '';
  const aad = typeof ciphertext.aad === 'string' ? ciphertext.aad.trim() : '';
  if (!epk || !ct || !iv || !aad) throw new Error('INVALID_PONY_E2EE_ENVELOPE');
  if (!isCanonicalBase64(epk) || !isCanonicalBase64(ct) || !isCanonicalBase64(iv) || !isCanonicalBase64(aad)) {
    throw new Error('INVALID_PONY_E2EE_ENVELOPE');
  }

  const ivBytes = decodeB64(iv);
  const ctBytes = decodeB64(ct);
  const epkBytes = decodeB64(epk);
  const aadBytes = decodeB64(aad);
  if (!ivBytes || ivBytes.length < 8 || ivBytes.length > 32) throw new Error('INVALID_PONY_E2EE_ENVELOPE');
  if (!ctBytes || ctBytes.length < 17 || ctBytes.length > PONY_MAX_E2EE_CT_BYTES) throw new Error('PONY_CIPHERTEXT_TOO_LARGE');
  if (!epkBytes || epkBytes.length < 48 || epkBytes.length > 2048) throw new Error('INVALID_PONY_E2EE_ENVELOPE');
  if (!aadBytes || !aadBytes.length || aadBytes.length > PONY_MAX_E2EE_AAD_BYTES) {
    throw new Error('INVALID_PONY_E2EE_ENVELOPE');
  }

  return {
    alg: PONY_E2EE_P256_AESGCM_V1,
    epk,
    iv,
    ct,
    aad
  };
}

function normalizePonyCiphertext(ciphertext, legacyBody = '', opts = {}) {
  const allowCustomAlg = opts && opts.allowCustomAlg === true;
  if (ciphertext && typeof ciphertext === 'object') {
    const alg = typeof ciphertext.alg === 'string' ? ciphertext.alg.trim() : '';
    const ct = typeof ciphertext.ct === 'string' ? ciphertext.ct.trim() : '';
    const iv = typeof ciphertext.iv === 'string' ? ciphertext.iv.trim() : '';
    if (!alg || !ct) throw new Error('INVALID_CIPHERTEXT');
    if (alg === PONY_E2EE_P256_AESGCM_V1) return normalizePonyCiphertextE2EE(ciphertext);
    if (alg !== 'PLAINTEXT') {
      if (!allowCustomAlg) throw new Error('UNSUPPORTED_PONY_CIPHER');
      return { alg, iv, ct };
    }
    if (Buffer.byteLength(ct, 'utf8') > PONY_MAX_PLAINTEXT_CT_BYTES) throw new Error('PONY_CIPHERTEXT_TOO_LARGE');
    return { alg, iv, ct };
  }
  if (typeof legacyBody === 'string' && legacyBody.trim()) {
    if (Buffer.byteLength(legacyBody, 'utf8') > PONY_MAX_PLAINTEXT_CT_BYTES) throw new Error('PONY_CIPHERTEXT_TOO_LARGE');
    return { alg: 'PLAINTEXT', iv: '', ct: legacyBody };
  }
  throw new Error('MISSING_CIPHERTEXT');
}

function encryptPonyE2EEForHouse({ plaintext, fromHouseId = null, toHouseId, recipientPonyInboxPub, kind = 'msg.chat.v1', createdAt = nowIso() }) {
  if (!toHouseId || typeof toHouseId !== 'string') throw new Error('INVALID_PONY_E2EE_TARGET');
  if (!recipientPonyInboxPub || typeof recipientPonyInboxPub !== 'string') throw new Error('INVALID_PONY_E2EE_TARGET_KEY');
  const recipientKeyDer = decodeB64(recipientPonyInboxPub);
  if (!recipientKeyDer || !recipientKeyDer.length) throw new Error('INVALID_PONY_E2EE_TARGET_KEY');

  let recipientPub;
  try {
    recipientPub = crypto.createPublicKey({ key: recipientKeyDer, format: 'der', type: 'spki' });
  } catch {
    throw new Error('INVALID_PONY_E2EE_TARGET_KEY');
  }

  const eph = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const shared = crypto.diffieHellman({ privateKey: eph.privateKey, publicKey: recipientPub });
  const key = Buffer.from(crypto.hkdfSync('sha256', shared, Buffer.alloc(0), Buffer.from(makePonyMsgKeyInfo({
    fromHouseId: fromHouseId || '',
    toHouseId
  }), 'utf8'), 32));
  const iv = crypto.randomBytes(12);

  const aadPayload = {
    v: 1,
    kind,
    fromHouseId: fromHouseId || null,
    toHouseId,
    createdAt
  };
  const aadBytes = Buffer.from(JSON.stringify(aadPayload), 'utf8');
  const plaintextPayload = Buffer.from(JSON.stringify({
    v: 1,
    body: String(plaintext || '')
  }), 'utf8');

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(aadBytes);
  const enc = Buffer.concat([cipher.update(plaintextPayload), cipher.final()]);
  const tag = cipher.getAuthTag();
  const ct = Buffer.concat([enc, tag]);
  const epkDer = eph.publicKey.export({ type: 'spki', format: 'der' });

  return {
    alg: PONY_E2EE_P256_AESGCM_V1,
    epk: epkDer.toString('base64'),
    iv: iv.toString('base64'),
    ct: ct.toString('base64'),
    aad: aadBytes.toString('base64')
  };
}

function resolveHouseAddress(store, input) {
  const raw = typeof input === 'string' ? input.trim() : '';
  if (!raw) return null;
  const house = store.houses.find((h) => h && h.id === raw);
  if (house) return { houseId: house.id, house, source: 'house' };

  // Legacy alias support: allow share ids to resolve to house ids.
  const share = store.shares.find((s) => s && s.id === raw && typeof s.houseId === 'string' && s.houseId.trim());
  if (!share) return null;
  const mappedHouse = store.houses.find((h) => h && h.id === share.houseId);
  if (!mappedHouse) return null;
  return { houseId: mappedHouse.id, house: mappedHouse, source: 'share' };
}

function makeInboxMsg({ toHouseId, fromHouseId = null, ciphertext, body, status = 'request', kind = 'msg.chat.v1' }) {
  const id = `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const normalizedCiphertext = normalizePonyCiphertext(ciphertext, body);
  return {
    id,
    version: 1,
    kind,
    toHouseId,
    fromHouseId,
    to: { houseId: toHouseId },
    from: fromHouseId ? { houseId: fromHouseId } : null,
    envelope: { ciphertext: normalizedCiphertext },
    // Compatibility field (clients should migrate to envelope.ciphertext).
    ciphertext: normalizedCiphertext,
    createdAt: nowIso(),
    status // request | accepted | rejected
  };
}

function makeDispatchReceiptId() {
  return `dr_${crypto.randomBytes(16).toString('hex')}`;
}

const PONY_RATE_WINDOW_MS = 60_000;
const PONY_RATE_MAX_PER_PAIR = 20;
const PONY_MAX_VAULT_EVENTS = 2000;
const PONY_INBOX_KEY_VERSION = 1;
const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/;
const ponyRateBuckets = new Map();

function normalizeHouseList(values) {
  if (!Array.isArray(values)) return [];
  const out = new Set();
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    out.add(trimmed);
  }
  return [...out];
}

function getHousePonyPolicy(house) {
  const policy = house?.ponyPolicy || {};
  return {
    allowlist: normalizeHouseList(policy.allowlist),
    blocklist: normalizeHouseList(policy.blocklist),
    autoAcceptAllowlist: policy.autoAcceptAllowlist !== false,
    allowAnonymous: policy.allowAnonymous !== false,
    requirePostageAnonymous: policy.requirePostageAnonymous === true,
    requireReceiptAnonymous: policy.requireReceiptAnonymous === true,
    allowLegacyPlaintext: typeof policy.allowLegacyPlaintext === 'boolean'
      ? policy.allowLegacyPlaintext
      : false
  };
}

function normalizeRelayHints(values, max = 8) {
  if (!Array.isArray(values)) return [];
  const out = [];
  const seen = new Set();
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
    if (out.length >= max) break;
  }
  return out;
}

const HEX_SHA256_RE = /^[0-9a-f]{64}$/i;

function normalizePostageReceipts(values, max = 16) {
  if (!Array.isArray(values)) return [];
  const out = [];
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    out.push(trimmed);
    if (out.length > max) throw new Error('INVALID_POSTAGE');
  }
  return out;
}

function normalizeVaultRefsMeta(refs, refsMeta, max = 16, maxBytes = 1024 * 1024 * 1024) {
  if (refsMeta == null) return [];
  if (!Array.isArray(refsMeta)) throw new Error('INVALID_VAULT_REFS_META');
  if (refsMeta.length > max) throw new Error('VAULT_REFS_META_TOO_MANY');

  const knownRefs = new Set(Array.isArray(refs) ? refs : []);
  const out = [];
  const seen = new Set();

  for (const item of refsMeta) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error('INVALID_VAULT_REFS_META');
    }

    const ref = typeof item.ref === 'string' ? item.ref.trim() : '';
    if (!ref) throw new Error('VAULT_REF_META_MISSING_REF');
    if (!knownRefs.has(ref)) throw new Error('VAULT_REF_META_REF_UNKNOWN');
    if (seen.has(ref)) throw new Error('VAULT_REF_META_DUPLICATE');
    seen.add(ref);

    const normalized = { ref };
    let hasMeta = false;

    if (Object.prototype.hasOwnProperty.call(item, 'mediaType')) {
      const mediaType = typeof item.mediaType === 'string' ? item.mediaType.trim() : '';
      if (!mediaType || mediaType.length > 120) throw new Error('VAULT_REF_META_MEDIA_TYPE_INVALID');
      normalized.mediaType = mediaType;
      hasMeta = true;
    }

    if (Object.prototype.hasOwnProperty.call(item, 'bytes')) {
      const bytes = Number(item.bytes);
      if (!Number.isFinite(bytes) || bytes < 0 || Math.floor(bytes) !== bytes || bytes > maxBytes) {
        throw new Error('VAULT_REF_META_BYTES_INVALID');
      }
      normalized.bytes = bytes;
      hasMeta = true;
    }

    if (Object.prototype.hasOwnProperty.call(item, 'sha256')) {
      const sha256 = typeof item.sha256 === 'string' ? item.sha256.trim().toLowerCase() : '';
      if (!HEX_SHA256_RE.test(sha256)) throw new Error('VAULT_REF_META_SHA256_INVALID');
      normalized.sha256 = sha256;
      hasMeta = true;
    }

    if (!hasMeta) throw new Error('VAULT_REF_META_EMPTY');
    out.push(normalized);
  }

  return out;
}

function normalizePonyTransport(transport) {
  if (transport == null) {
    return {
      kind: 'relay.http.v1',
      relayHints: []
    };
  }
  if (!transport || typeof transport !== 'object') throw new Error('INVALID_TRANSPORT');
  const kind = typeof transport.kind === 'string' && transport.kind.trim() ? transport.kind.trim() : 'relay.http.v1';
  return {
    kind,
    relayHints: normalizeRelayHints(transport.relayHints)
  };
}

function normalizePonyPostage(postage) {
  if (postage == null) return { kind: 'none' };
  if (!postage || typeof postage !== 'object') throw new Error('INVALID_POSTAGE');
  const kind = typeof postage.kind === 'string' ? postage.kind.trim() : '';
  if (!kind || kind === 'none') return { kind: 'none' };

  if (kind === 'pow.v1') {
    const nonce = typeof postage.nonce === 'string' ? postage.nonce.trim() : '';
    const digest = typeof postage.digest === 'string' ? postage.digest.trim() : '';
    const difficulty = Number(postage.difficulty || 0);
    if (!nonce || !digest || !Number.isFinite(difficulty) || difficulty < 1) {
      throw new Error('INVALID_POSTAGE');
    }
    return {
      kind,
      nonce,
      digest,
      difficulty: Math.floor(difficulty)
    };
  }

  if (kind === 'receipt.v1') {
    const receipts = normalizePostageReceipts(postage.receipts, 16);
    if (!receipts.length) throw new Error('INVALID_POSTAGE');
    return {
      kind,
      receipts
    };
  }

  throw new Error('INVALID_POSTAGE_KIND');
}

function ensureHouseVault(house) {
  if (!house || typeof house !== 'object') return [];
  if (!Array.isArray(house.ponyVault)) house.ponyVault = [];
  return house.ponyVault;
}

function normalizePonyFriendLabel(label) {
  if (typeof label !== 'string') return null;
  const trimmed = label.trim();
  if (!trimmed) return null;
  return trimmed.length > 64 ? trimmed.slice(0, 64) : trimmed;
}

function ensureHousePonyFriends(house) {
  if (!house || typeof house !== 'object') return [];
  if (!Array.isArray(house.ponyFriends)) house.ponyFriends = [];
  house.ponyFriends = house.ponyFriends.filter(
    (f) => f && typeof f === 'object' && typeof f.houseId === 'string' && f.houseId.trim()
  );
  return house.ponyFriends;
}

function deriveHousePonyFriendsFromAcceptedInbox(store, houseId) {
  const out = new Set();
  for (const m of store?.inbox || []) {
    if (!m || m.status !== 'accepted') continue;
    const from = typeof m.fromHouseId === 'string' ? m.fromHouseId : '';
    const to = typeof m.toHouseId === 'string' ? m.toHouseId : '';

    if (to === houseId && from && from !== houseId) out.add(from);
    if (from === houseId && to && to !== houseId) out.add(to);
  }
  return [...out];
}

function isCanonicalBase64(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length % 4 !== 0) return false;
  if (!BASE64_RE.test(trimmed)) return false;
  const decoded = decodeB64(trimmed);
  return !!(decoded && decoded.length);
}

function normalizeCeremonyCommit(value) {
  const commit = typeof value === 'string' ? value.trim() : '';
  if (!commit) throw new Error('MISSING_COMMIT');
  if (!isCanonicalBase64(commit)) throw new Error('INVALID_COMMIT');
  const bytes = decodeB64(commit);
  if (!bytes || bytes.length !== 32) throw new Error('INVALID_COMMIT');
  return commit;
}

function normalizeCeremonyRevealPub(value, { required = false } = {}) {
  const pub = typeof value === 'string' ? value.trim() : '';
  if (!pub) {
    if (required) throw new Error('MISSING_REVEAL_PUB');
    return null;
  }
  if (!isCanonicalBase64(pub)) throw new Error('INVALID_REVEAL_PUB');
  const pubBytes = decodeB64(pub);
  if (!pubBytes || pubBytes.length < 48 || pubBytes.length > 2048) throw new Error('INVALID_REVEAL_PUB');
  try {
    crypto.createPublicKey({ key: pubBytes, format: 'der', type: 'spki' });
  } catch {
    throw new Error('INVALID_REVEAL_PUB');
  }
  return pub;
}

function normalizeCeremonySealedReveal(sealed, { required = false } = {}) {
  if (sealed == null) {
    if (required) throw new Error('MISSING_REVEAL');
    return null;
  }
  if (!sealed || typeof sealed !== 'object' || Array.isArray(sealed)) {
    throw new Error('INVALID_REVEAL_ENVELOPE');
  }

  const alg = typeof sealed.alg === 'string' ? sealed.alg.trim() : '';
  const epk = typeof sealed.epk === 'string' ? sealed.epk.trim() : '';
  const iv = typeof sealed.iv === 'string' ? sealed.iv.trim() : '';
  const ct = typeof sealed.ct === 'string' ? sealed.ct.trim() : '';
  const aad = typeof sealed.aad === 'string' ? sealed.aad.trim() : '';

  if (alg !== CEREMONY_E2EE_P256_AESGCM_V1 || !epk || !iv || !ct || !aad) {
    throw new Error('INVALID_REVEAL_ENVELOPE');
  }
  if (!isCanonicalBase64(epk) || !isCanonicalBase64(iv) || !isCanonicalBase64(ct) || !isCanonicalBase64(aad)) {
    throw new Error('INVALID_REVEAL_ENVELOPE');
  }

  const epkBytes = decodeB64(epk);
  const ivBytes = decodeB64(iv);
  const ctBytes = decodeB64(ct);
  const aadBytes = decodeB64(aad);
  if (!epkBytes || epkBytes.length < 48 || epkBytes.length > 2048) throw new Error('INVALID_REVEAL_ENVELOPE');
  if (!ivBytes || ivBytes.length !== 12) throw new Error('INVALID_REVEAL_ENVELOPE');
  if (!ctBytes || ctBytes.length < 17 || ctBytes.length > 4096) throw new Error('INVALID_REVEAL_ENVELOPE');
  if (!aadBytes || !aadBytes.length || aadBytes.length > 1024) throw new Error('INVALID_REVEAL_ENVELOPE');

  return { alg, epk, iv, ct, aad };
}

function normalizePonyInboxPrivWrap(ponyInboxPrivWrap, { required = false } = {}) {
  if (ponyInboxPrivWrap == null) {
    if (required) throw new Error('MISSING_PONY_INBOX_PRIV_WRAP');
    return null;
  }
  if (!ponyInboxPrivWrap || typeof ponyInboxPrivWrap !== 'object' || Array.isArray(ponyInboxPrivWrap)) {
    throw new Error('INVALID_PONY_INBOX_PRIV_WRAP');
  }

  const alg = typeof ponyInboxPrivWrap.alg === 'string' ? ponyInboxPrivWrap.alg.trim() : '';
  const iv = typeof ponyInboxPrivWrap.iv === 'string' ? ponyInboxPrivWrap.iv.trim() : '';
  const ct = typeof ponyInboxPrivWrap.ct === 'string' ? ponyInboxPrivWrap.ct.trim() : '';
  if (alg !== 'AES-GCM' || !iv || !ct) throw new Error('INVALID_PONY_INBOX_PRIV_WRAP');
  if (!isCanonicalBase64(iv) || !isCanonicalBase64(ct)) throw new Error('INVALID_PONY_INBOX_PRIV_WRAP');

  const ivBytes = decodeB64(iv);
  const ctBytes = decodeB64(ct);
  if (!ivBytes || ivBytes.length < 8 || ivBytes.length > 32) throw new Error('INVALID_PONY_INBOX_PRIV_WRAP');
  if (!ctBytes || ctBytes.length < 16) throw new Error('INVALID_PONY_INBOX_PRIV_WRAP');

  return { alg: 'AES-GCM', iv, ct };
}

function normalizePonyInboxRegistration({ ponyInboxPub, ponyInboxPrivWrap }, { required = false } = {}) {
  const pub = typeof ponyInboxPub === 'string' ? ponyInboxPub.trim() : '';
  const hasPub = !!pub;
  const hasPrivWrap = ponyInboxPrivWrap != null;

  if (!hasPub && !hasPrivWrap) {
    if (required) throw new Error('MISSING_PONY_INBOX_PUB');
    return null;
  }
  if (!hasPub) throw new Error('MISSING_PONY_INBOX_PUB');
  if (!isCanonicalBase64(pub)) throw new Error('INVALID_PONY_INBOX_PUB');

  const pubBytes = decodeB64(pub);
  if (!pubBytes || pubBytes.length < 48 || pubBytes.length > 2048) throw new Error('INVALID_PONY_INBOX_PUB');

  const privWrap = normalizePonyInboxPrivWrap(ponyInboxPrivWrap, { required: true });
  return {
    version: PONY_INBOX_KEY_VERSION,
    pub,
    privWrap
  };
}

function getHousePonyInboxKey(house) {
  if (!house || typeof house !== 'object') return null;
  const ponyInbox = house.ponyInbox;
  if (!ponyInbox || typeof ponyInbox !== 'object') return null;

  const pub = typeof ponyInbox.pub === 'string' ? ponyInbox.pub.trim() : '';
  if (!pub) return null;

  const versionRaw = Number(ponyInbox.version);
  const version = Number.isFinite(versionRaw) && versionRaw >= 1 ? Math.floor(versionRaw) : PONY_INBOX_KEY_VERSION;

  let privWrap = null;
  if (ponyInbox.privWrap && typeof ponyInbox.privWrap === 'object') {
    const alg = typeof ponyInbox.privWrap.alg === 'string' ? ponyInbox.privWrap.alg.trim() : '';
    const iv = typeof ponyInbox.privWrap.iv === 'string' ? ponyInbox.privWrap.iv.trim() : '';
    const ct = typeof ponyInbox.privWrap.ct === 'string' ? ponyInbox.privWrap.ct.trim() : '';
    if (alg === 'AES-GCM' && iv && ct) privWrap = { alg, iv, ct };
  }

  return {
    version,
    pub,
    privWrap,
    createdAt: typeof ponyInbox.createdAt === 'string' ? ponyInbox.createdAt : null,
    updatedAt: typeof ponyInbox.updatedAt === 'string' ? ponyInbox.updatedAt : null
  };
}

function writeHousePonyInboxKey(house, registration) {
  if (!house || typeof house !== 'object' || !registration) return;
  const existing = getHousePonyInboxKey(house);
  const now = nowIso();
  house.ponyInbox = {
    version: registration.version || PONY_INBOX_KEY_VERSION,
    pub: registration.pub,
    privWrap: registration.privWrap,
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };
}

function computeVaultEventHash(event) {
  const payload = {
    id: event.id,
    houseId: event.houseId,
    kind: event.kind,
    createdAt: event.createdAt,
    prevHash: event.prevHash || null,
    envelope: event.envelope,
    refs: Array.isArray(event.refs) ? event.refs : [],
    refsMeta: Array.isArray(event.refsMeta) ? event.refsMeta : [],
    postage: event.postage || { kind: 'none' }
  };
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function checkPonyRateLimit({ senderKey, toHouseId }) {
  const now = Date.now();
  const key = `${senderKey}->${toHouseId}`;
  let bucket = ponyRateBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + PONY_RATE_WINDOW_MS };
    ponyRateBuckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > PONY_RATE_MAX_PER_PAIR) {
    return { ok: false, retryAfterMs: bucket.resetAt - now };
  }
  return { ok: true };
}

function resolveHouseByErc8004Id(store, erc8004Id) {
  const rec = (store.anchors || []).find((a) => a && a.erc8004Id === erc8004Id);
  if (!rec || !rec.houseId) return null;
  const house = store.houses.find((h) => h && h.id === rec.houseId);
  if (!house) return null;
  return { houseId: house.id, house, source: 'anchor', erc8004Id };
}

function bytesToB64(bytes) {
  return Buffer.from(bytes).toString('base64');
}

function sha256Bytes(bytes) {
  return new Uint8Array(crypto.createHash('sha256').update(Buffer.from(bytes)).digest());
}

function sha256Base64(input) {
  return crypto.createHash('sha256').update(input).digest('base64');
}

function sha256PrefixedHex(input) {
  return `sha256:${crypto.createHash('sha256').update(input).digest('hex')}`;
}

function stableJsonValue(value) {
  if (Array.isArray(value)) return value.map((item) => stableJsonValue(item));
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) {
      out[key] = stableJsonValue(value[key]);
    }
    return out;
  }
  return value;
}

function stableJsonStringify(value) {
  return JSON.stringify(stableJsonValue(value));
}

function reservedHouseId(kind, key) {
  const seed = `agenttown:reserved:${kind}:${key}`;
  const bytes = crypto.createHash('sha256').update(seed).digest();
  return base58Encode(bytes);
}

function base58Encode(bytes) {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let x = BigInt('0x' + Buffer.from(bytes).toString('hex'));
  let out = '';
  while (x > 0n) {
    const mod = x % 58n;
    out = alphabet[Number(mod)] + out;
    x = x / 58n;
  }
  // leading zeros
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) out = '1' + out;
  return out || '1';
}

function base58Decode(str) {
  if (!str || typeof str !== 'string') return null;
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = 0n;
  for (const ch of str) {
    const idx = alphabet.indexOf(ch);
    if (idx < 0) return null;
    num = num * 58n + BigInt(idx);
  }
  const bytes = [];
  while (num > 0n) {
    bytes.push(Number(num & 0xffn));
    num >>= 8n;
  }
  bytes.reverse();
  let leadingZeros = 0;
  for (let i = 0; i < str.length && str[i] === '1'; i++) leadingZeros++;
  if (leadingZeros) {
    return new Uint8Array(Array(leadingZeros).fill(0).concat(bytes));
  }
  return new Uint8Array(bytes);
}

function buildWalletLookupMessage({ address, nonce, houseId }) {
  const parts = ['ElizaTown House Lookup', `address: ${address}`, `nonce: ${nonce}`];
  if (houseId) parts.push(`houseId: ${houseId}`);
  return parts.join('\n');
}

function buildHouseKeyWrapMessage({ houseId }) {
  return ['ElizaTown House Key Wrap', `houseId: ${houseId}`].join('\n');
}

function buildTokenCheckMessage({ address, nonce, ca }) {
  return ['ElizaTown Token Check', `address: ${address}`, `CA: ${ca}`, `nonce: ${nonce}`].join('\n');
}

function unlockAddressForLookup(unlock) {
  if (!unlock || typeof unlock !== 'object') return null;
  const address = typeof unlock.address === 'string' ? unlock.address.trim() : '';
  if (!address) return null;
  if (unlock.kind === 'solana-wallet-signature') return address;
  if (unlock.kind === 'wallet-signature') {
    const chain = typeof unlock.chain === 'string' ? unlock.chain.trim().toLowerCase() : '';
    if (chain === 'solana') return address;
  }
  return null;
}

function verifySolanaSignature(address, message, signatureB64) {
  try {
    const pubKey = base58Decode(address);
    if (!pubKey || pubKey.length !== 32) return false;
    const sig = Buffer.from(signatureB64 || '', 'base64');
    if (sig.length !== 64) return false;
    const spki = Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), Buffer.from(pubKey)]);
    const key = crypto.createPublicKey({ key: spki, format: 'der', type: 'spki' });
    return crypto.verify(null, Buffer.from(message, 'utf8'), key, sig);
  } catch (e) {
    console.warn('wallet signature verify failed', e);
    return false;
  }
}

function isTestMockAddress(address) {
  return process.env.NODE_ENV === 'test' && typeof address === 'string' && address.startsWith('So1anaMock');
}

const app = express();

resetRouteOwnerManifest();
registerRouteOwner('platform', 'server/platform_read_routes.js');
registerRouteOwner('poker', 'server/poker_routes.js');
registerRouteOwner('registry', 'server/registry_routes.js');
registerRouteOwner('v1', 'server/platform_v1_routes.js');
registerRouteOwner('web', 'server/web_routes.js');
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(
  express.json({
    limit: '10mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    }
  })
);

app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    const size = req.rawBody ? req.rawBody.length : 0;
    console.warn(`[bad-json] ${req.method} ${req.originalUrl} (${size} bytes)`);
    return res.status(400).json({ ok: false, error: 'INVALID_JSON' });
  }
  return next(err);
});

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const ASSETS_DIR = path.join(process.cwd(), 'assets');
const isProd = process.env.NODE_ENV === 'production';
const ELIZATOWN_MINT = 'CZRsbB6BrHsAmGKeoxyfwzCyhttXvhfEukXCWnseBAGS';
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const SOLANA_RPC_FALLBACKS = (process.env.SOLANA_RPC_FALLBACKS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const SOLANA_RPC_URLS = [SOLANA_RPC_URL, ...SOLANA_RPC_FALLBACKS].filter(Boolean);
const TOKEN_CHECK_TIMEOUT_MS = 5_000;
const TOKEN_VERIFY_TTL_MS = 5 * 60 * 1000;
const TOKEN_VERIFY_CACHE_MS = 60 * 1000;
const HOUSE_AUTH_SKEW_MS = 2 * 60 * 1000;
const VENDOR_LITE_ROOT = path.join(process.cwd(), 'vendors', 'openclaw-lite-main');
const VENDOR_LITE_BUILD_DIR = path.join(PUBLIC_DIR, 'openclaw-lite');
const OPENAI_CODEX_OAUTH_CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann';
const OPENAI_CODEX_OAUTH_AUTHORIZE_URL = 'https://auth.openai.com/oauth/authorize';
const OPENAI_CODEX_OAUTH_TOKEN_URL = 'https://auth.openai.com/oauth/token';
const OPENAI_CODEX_OAUTH_SCOPE = 'openid profile email offline_access';
const OPENAI_CODEX_OAUTH_CLAIM_PATH = 'https://api.openai.com/auth';
const OPENAI_CODEX_OAUTH_CALLBACK_PORT = Number(process.env.OPENAI_CODEX_OAUTH_CALLBACK_PORT || 1455);
const OPENAI_CODEX_OAUTH_CALLBACK_HOST = String(process.env.OPENAI_CODEX_OAUTH_CALLBACK_HOST || '127.0.0.1').trim() || '127.0.0.1';
const OPENAI_CODEX_OAUTH_CALLBACK_PATH = '/auth/callback';
const OPENAI_CODEX_OAUTH_CALLBACK_HOST_FOR_URI = OPENAI_CODEX_OAUTH_CALLBACK_HOST.includes(':')
  && !OPENAI_CODEX_OAUTH_CALLBACK_HOST.startsWith('[')
  ? `[${OPENAI_CODEX_OAUTH_CALLBACK_HOST}]`
  : OPENAI_CODEX_OAUTH_CALLBACK_HOST;
const OPENAI_CODEX_OAUTH_REDIRECT_URI = String(
  process.env.OPENAI_CODEX_OAUTH_REDIRECT_URI
    || `http://${OPENAI_CODEX_OAUTH_CALLBACK_HOST_FOR_URI}:${OPENAI_CODEX_OAUTH_CALLBACK_PORT}${OPENAI_CODEX_OAUTH_CALLBACK_PATH}`
).trim();
const OPENAI_CODEX_OAUTH_ATTEMPT_TTL_MS = 10 * 60 * 1000;
const OPENAI_CODEX_OAUTH_MAX_ATTEMPTS = 200;

const openAiCodexOAuthAttemptsById = new Map();
const openAiCodexOAuthAttemptsByState = new Map();
let openAiCodexOAuthCallbackServer = null;
let openAiCodexOAuthCallbackServerStarting = null;
let openAiCodexOAuthCallbackServerState = {
  ready: false,
  error: 'NOT_STARTED',
  host: OPENAI_CODEX_OAUTH_CALLBACK_HOST,
  port: OPENAI_CODEX_OAUTH_CALLBACK_PORT
};

function safeReadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function computeVendorLiteBuildTime() {
  const files = [
    path.join(VENDOR_LITE_BUILD_DIR, 'gateway.js'),
    path.join(VENDOR_LITE_BUILD_DIR, 'worker.js'),
    path.join(VENDOR_LITE_BUILD_DIR, 'runtime-worker.js'),
    path.join(VENDOR_LITE_BUILD_DIR, 'runtime-bridge.js'),
    path.join(VENDOR_LITE_BUILD_DIR, 'build-info.json'),
    path.join(VENDOR_LITE_ROOT, 'package.json')
  ];
  let latest = 0;
  for (const filePath of files) {
    try {
      const st = fs.statSync(filePath);
      const ms = Number(st?.mtimeMs || 0);
      if (ms > latest) latest = ms;
    } catch {
      // ignore missing files; fallback to now below.
    }
  }
  return latest > 0 ? new Date(latest).toISOString() : nowIso();
}

function buildVendorLiteManifest() {
  const pkgPath = path.join(VENDOR_LITE_ROOT, 'package.json');
  const pkg = safeReadJson(pkgPath) || {};
  const vendorVersion = typeof pkg.version === 'string' && pkg.version.trim() ? pkg.version.trim() : '0.0.0-dev';
  return {
    vendorPath: 'vendors/openclaw-lite-main',
    vendorVersion,
    buildTime: computeVendorLiteBuildTime(),
    entrypoints: {
      gateway: '/openclaw-lite/gateway.js',
      worker: '/openclaw-lite/worker.js',
      runtimeWorker: '/openclaw-lite/runtime-worker.js',
      runtimeBridge: '/openclaw-lite/runtime-bridge.js'
    }
  };
}

const VENDOR_LITE_MANIFEST = Object.freeze(buildVendorLiteManifest());

function normalizeLiteDriver(value) {
  return 'vendor';
}

function ensureLiteState(session) {
  if (!session || typeof session !== 'object') return defaultLiteState();
  const next = {
    ...defaultLiteState(),
    ...(session.lite && typeof session.lite === 'object' ? session.lite : {})
  };
  next.driver = normalizeLiteDriver(next.driver);
  next.runtimeBooted = next.runtimeBooted === true;
  next.runtimeVersion = next.runtimeBooted ? VENDOR_LITE_MANIFEST.vendorVersion : null;
  session.lite = next;
  return next;
}

function updateLiteRuntimeReady(session) {
  const lite = ensureLiteState(session);
  const booted = lite.runtimeBooted === true;
  lite.runtimeReady = !!(booted && !lite.lastError);
}

function markLiteRuntimeBooted(session) {
  const lite = ensureLiteState(session);
  lite.runtimeBooted = true;
  lite.runtimeVersion = VENDOR_LITE_MANIFEST.vendorVersion;
  lite.lastError = null;
  updateLiteRuntimeReady(session);
}

function markLiteRuntimeError(session, message) {
  const lite = ensureLiteState(session);
  lite.runtimeBooted = false;
  lite.runtimeVersion = null;
  lite.lastError = String(message || 'RUNTIME_BOOT_FAILED');
  updateLiteRuntimeReady(session);
}

function parseModelRef(modelRef, fallbackProvider = 'openai', fallbackModelId = 'gpt-4o-mini') {
  const ref = String(modelRef || '').trim();
  if (!ref) {
    return {
      provider: fallbackProvider,
      modelId: fallbackModelId,
      modelRef: `${fallbackProvider}/${fallbackModelId}`
    };
  }
  const slash = ref.indexOf('/');
  if (slash > 0) {
    const provider = ref.slice(0, slash).trim();
    const modelId = ref.slice(slash + 1).trim();
    if (provider && modelId) {
      return { provider, modelId, modelRef: `${provider}/${modelId}` };
    }
  }
  return {
    provider: fallbackProvider,
    modelId: ref,
    modelRef: `${fallbackProvider}/${ref}`
  };
}

function normalizeLiteLlmPayload(body) {
  const providerInput = typeof body?.provider === 'string' ? body.provider.trim() : '';
  const modelInput = typeof body?.model === 'string' ? body.model.trim() : '';
  const modelRefInput = typeof body?.modelRef === 'string' ? body.modelRef.trim() : '';
  const rawAuthMode = typeof body?.authMode === 'string' ? body.authMode.trim() : '';
  const normalizedAuthMode = rawAuthMode === 'oauth-json' ? 'oauth-json' : 'api-key';
  const hasCredential = body?.hasCredential === false ? false : true;

  if (!providerInput && !modelRefInput) throw new Error('MISSING_LLM_PROVIDER');
  if (!modelInput && !modelRefInput) throw new Error('MISSING_LLM_MODEL');

  const parsed = modelRefInput
    ? parseModelRef(modelRefInput, providerInput || 'openai', modelInput || 'gpt-4o-mini')
    : parseModelRef(`${providerInput}/${modelInput}`, providerInput || 'openai', modelInput || 'gpt-4o-mini');

  const provider = String(parsed.provider || '').trim();
  const model = String(parsed.modelId || '').trim();
  const modelRef = String(parsed.modelRef || '').trim();
  if (!provider) throw new Error('MISSING_LLM_PROVIDER');
  if (!model) throw new Error('MISSING_LLM_MODEL');

  return {
    provider,
    model,
    modelRef,
    authMode: normalizedAuthMode,
    hasCredential
  };
}

function toBase64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function createOpenAiCodexPkce() {
  const verifier = toBase64Url(crypto.randomBytes(32));
  const challenge = toBase64Url(crypto.createHash('sha256').update(verifier, 'utf8').digest());
  return { verifier, challenge };
}

function createOpenAiCodexOAuthState() {
  return crypto.randomBytes(16).toString('hex');
}

function decodeJwtPayloadUnsafe(token) {
  const raw = typeof token === 'string' ? token.trim() : '';
  if (!raw) return null;
  const parts = raw.split('.');
  if (parts.length !== 3) return null;
  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

function extractOpenAiCodexAccountId(accessToken) {
  const payload = decodeJwtPayloadUnsafe(accessToken);
  if (!payload || typeof payload !== 'object') return '';
  const auth = payload?.[OPENAI_CODEX_OAUTH_CLAIM_PATH];
  const accountId = typeof auth?.chatgpt_account_id === 'string' ? auth.chatgpt_account_id.trim() : '';
  return accountId;
}

function buildTestJwt(payload) {
  const headerB64 = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' }), 'utf8').toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload || {}), 'utf8').toString('base64url');
  return `${headerB64}.${payloadB64}.signature`;
}

function parseOpenAiCodexAuthorizationInput(input) {
  const value = typeof input === 'string' ? input.trim() : '';
  if (!value) return {};

  try {
    const url = new URL(value);
    return {
      code: url.searchParams.get('code') || undefined,
      state: url.searchParams.get('state') || undefined,
      error: url.searchParams.get('error') || undefined,
      errorDescription: url.searchParams.get('error_description') || undefined
    };
  } catch {
    // Not a URL.
  }

  if (value.includes('#')) {
    const [code, state] = value.split('#', 2);
    return { code: code || undefined, state: state || undefined };
  }

  if (value.includes('code=')) {
    const params = new URLSearchParams(value);
    return {
      code: params.get('code') || undefined,
      state: params.get('state') || undefined,
      error: params.get('error') || undefined,
      errorDescription: params.get('error_description') || undefined
    };
  }

  return { code: value };
}

function cleanupOpenAiCodexOAuthAttempts() {
  const now = Date.now();
  for (const [attemptId, attempt] of openAiCodexOAuthAttemptsById.entries()) {
    if (!attempt || typeof attempt !== 'object') {
      openAiCodexOAuthAttemptsById.delete(attemptId);
      continue;
    }
    if (!Number.isFinite(Number(attempt.expiresAtMs)) || Number(attempt.expiresAtMs) < now) {
      if (attempt.state) openAiCodexOAuthAttemptsByState.delete(attempt.state);
      openAiCodexOAuthAttemptsById.delete(attemptId);
    }
  }
}

function registerOpenAiCodexOAuthAttempt(attempt) {
  cleanupOpenAiCodexOAuthAttempts();

  const id = String(attempt?.id || '').trim();
  const state = String(attempt?.state || '').trim();
  if (!id || !state) return;

  openAiCodexOAuthAttemptsById.set(id, attempt);
  openAiCodexOAuthAttemptsByState.set(state, id);

  if (openAiCodexOAuthAttemptsById.size <= OPENAI_CODEX_OAUTH_MAX_ATTEMPTS) return;
  const ordered = Array.from(openAiCodexOAuthAttemptsById.values())
    .sort((a, b) => Number(a?.createdAtMs || 0) - Number(b?.createdAtMs || 0));
  while (openAiCodexOAuthAttemptsById.size > OPENAI_CODEX_OAUTH_MAX_ATTEMPTS && ordered.length > 0) {
    const stale = ordered.shift();
    const staleId = String(stale?.id || '').trim();
    const staleState = String(stale?.state || '').trim();
    if (staleId) openAiCodexOAuthAttemptsById.delete(staleId);
    if (staleState) openAiCodexOAuthAttemptsByState.delete(staleState);
  }
}

function openAiCodexOAuthAttemptSummary(attempt) {
  return {
    id: attempt.id,
    state: attempt.state,
    status: attempt.status,
    createdAtMs: attempt.createdAtMs,
    expiresAtMs: attempt.expiresAtMs,
    codeReceivedAtMs: attempt.codeReceivedAtMs || null,
    exchangedAtMs: attempt.exchangedAtMs || null,
    lastError: attempt.lastError || null,
    hasCode: !!attempt.code
  };
}

function buildOpenAiCodexOAuthCallbackPage({ ok, state, code, error, message }) {
  const payload = {
    type: 'agenttown:openai-codex-oauth-callback',
    ok: !!ok,
    state: state || '',
    code: code || '',
    error: error || ''
  };
  const payloadJson = JSON.stringify(payload).replace(/</g, '\\u003c');
  const heading = ok ? 'Authentication successful' : 'Authentication failed';
  const bodyMessage = ok
    ? (message || 'You can return to Agent Town.')
    : (message || 'OAuth callback failed. Return to Agent Town to retry.');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtmlAttr(heading)}</title>
</head>
<body style="font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; padding: 20px; background: #f7f2df; color: #2b2418;">
  <h2 style="margin: 0 0 8px;">${escapeHtmlAttr(heading)}</h2>
  <p style="margin: 0;">${escapeHtmlAttr(bodyMessage)}</p>
  <script>
  (() => {
    const payload = ${payloadJson};
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(payload, '*');
      }
    } catch {}
    setTimeout(() => { try { window.close(); } catch {} }, 200);
  })();
  </script>
</body>
</html>`;
}

async function ensureOpenAiCodexOAuthCallbackServer() {
  if (openAiCodexOAuthCallbackServer) return { ...openAiCodexOAuthCallbackServerState };
  if (openAiCodexOAuthCallbackServerStarting) return await openAiCodexOAuthCallbackServerStarting;

  openAiCodexOAuthCallbackServerStarting = new Promise((resolve) => {
    const callbackServer = http.createServer((req, res) => {
      let url = null;
      try {
        url = new URL(
          String(req.url || '/'),
          `http://${OPENAI_CODEX_OAUTH_CALLBACK_HOST}:${OPENAI_CODEX_OAUTH_CALLBACK_PORT}`
        );
      } catch {
        res.statusCode = 400;
        res.end('Invalid callback URL');
        return;
      }

      if (url.pathname !== OPENAI_CODEX_OAUTH_CALLBACK_PATH) {
        res.statusCode = 404;
        res.end('Not found');
        return;
      }

      cleanupOpenAiCodexOAuthAttempts();

      const state = String(url.searchParams.get('state') || '').trim();
      const code = String(url.searchParams.get('code') || '').trim();
      const oauthError = String(url.searchParams.get('error') || '').trim();
      const oauthErrorDesc = String(url.searchParams.get('error_description') || '').trim();
      const attemptId = state ? openAiCodexOAuthAttemptsByState.get(state) : '';
      const attempt = attemptId ? openAiCodexOAuthAttemptsById.get(attemptId) : null;

      if (!state || !attempt) {
        const html = buildOpenAiCodexOAuthCallbackPage({
          ok: false,
          state,
          code,
          error: oauthError || 'UNKNOWN_STATE',
          message: 'Unknown or expired OAuth state. Start OAuth again from Agent Town.'
        });
        res.statusCode = 400;
        res.setHeader('content-type', 'text/html; charset=utf-8');
        res.end(html);
        return;
      }

      if (oauthError) {
        attempt.status = 'failed';
        attempt.lastError = oauthErrorDesc || oauthError;
        const html = buildOpenAiCodexOAuthCallbackPage({
          ok: false,
          state,
          code,
          error: oauthError,
          message: oauthErrorDesc || 'OAuth authorization was not completed.'
        });
        res.statusCode = 400;
        res.setHeader('content-type', 'text/html; charset=utf-8');
        res.end(html);
        return;
      }

      if (!code) {
        attempt.status = 'failed';
        attempt.lastError = 'MISSING_CODE';
        const html = buildOpenAiCodexOAuthCallbackPage({
          ok: false,
          state,
          code,
          error: 'MISSING_CODE',
          message: 'Missing authorization code in callback URL.'
        });
        res.statusCode = 400;
        res.setHeader('content-type', 'text/html; charset=utf-8');
        res.end(html);
        return;
      }

      attempt.code = code;
      attempt.status = 'code_received';
      attempt.codeReceivedAtMs = Date.now();
      attempt.lastError = '';

      const html = buildOpenAiCodexOAuthCallbackPage({
        ok: true,
        state,
        code,
        message: 'Authorization code received. Return to Agent Town.'
      });
      res.statusCode = 200;
      res.setHeader('content-type', 'text/html; charset=utf-8');
      res.end(html);
    });

    callbackServer.once('error', (err) => {
      const code = typeof err?.code === 'string' ? err.code : 'CALLBACK_SERVER_FAILED';
      openAiCodexOAuthCallbackServer = null;
      openAiCodexOAuthCallbackServerState = {
        ready: false,
        error: code,
        host: OPENAI_CODEX_OAUTH_CALLBACK_HOST,
        port: OPENAI_CODEX_OAUTH_CALLBACK_PORT
      };
      resolve({ ...openAiCodexOAuthCallbackServerState });
    });

    callbackServer.listen(OPENAI_CODEX_OAUTH_CALLBACK_PORT, OPENAI_CODEX_OAUTH_CALLBACK_HOST, () => {
      openAiCodexOAuthCallbackServer = callbackServer;
      openAiCodexOAuthCallbackServerState = {
        ready: true,
        error: '',
        host: OPENAI_CODEX_OAUTH_CALLBACK_HOST,
        port: OPENAI_CODEX_OAUTH_CALLBACK_PORT
      };
      resolve({ ...openAiCodexOAuthCallbackServerState });
    });
  }).finally(() => {
    openAiCodexOAuthCallbackServerStarting = null;
  });

  return await openAiCodexOAuthCallbackServerStarting;
}

async function exchangeOpenAiCodexAuthorizationCode({ code, verifier, redirectUri }) {
  if (process.env.NODE_ENV === 'test') {
    const codeText = String(code || '').trim();
    if (!codeText.startsWith('test-code')) {
      return { ok: false, error: 'TOKEN_EXCHANGE_FAILED', message: 'invalid_grant', status: 400 };
    }
    const accountId = 'acct_test';
    const accessToken = buildTestJwt({
      iss: 'https://auth.openai.com',
      [OPENAI_CODEX_OAUTH_CLAIM_PATH]: { chatgpt_account_id: accountId }
    });
    return {
      ok: true,
      accessToken,
      refreshToken: 'refresh_test_token',
      expiresAtMs: Date.now() + 60 * 60 * 1000
    };
  }

  try {
    const response = await fetch(OPENAI_CODEX_OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: OPENAI_CODEX_OAUTH_CLIENT_ID,
        code: String(code || '').trim(),
        code_verifier: String(verifier || '').trim(),
        redirect_uri: String(redirectUri || '').trim() || OPENAI_CODEX_OAUTH_REDIRECT_URI
      })
    });

    const text = await response.text().catch(() => '');
    if (!response.ok) {
      return {
        ok: false,
        error: 'TOKEN_EXCHANGE_FAILED',
        status: response.status,
        message: text || response.statusText || 'token exchange failed'
      };
    }

    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    const accessToken = typeof json?.access_token === 'string' ? json.access_token.trim() : '';
    const refreshToken = typeof json?.refresh_token === 'string' ? json.refresh_token.trim() : '';
    const expiresIn = Number(json?.expires_in);
    if (!accessToken || !refreshToken || !Number.isFinite(expiresIn) || expiresIn <= 0) {
      return { ok: false, error: 'TOKEN_RESPONSE_INVALID', message: 'OAuth token response missing required fields' };
    }
    return {
      ok: true,
      accessToken,
      refreshToken,
      expiresAtMs: Date.now() + expiresIn * 1000
    };
  } catch (err) {
    return {
      ok: false,
      error: 'TOKEN_EXCHANGE_UNAVAILABLE',
      message: String(err?.message || 'token endpoint unavailable')
    };
  }
}

function splitCsvEnv(raw) {
  return String(raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function uniqueStrings(values) {
  const out = [];
  const seen = new Set();
  for (const value of Array.isArray(values) ? values : []) {
    const item = String(value || '').trim();
    if (!item || seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}

function parseBoolEnv(raw, fallback = false) {
  if (raw === undefined || raw === null || String(raw).trim() === '') return !!fallback;
  const normalized = String(raw).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return !!fallback;
}

function normalizePrivyLoginMethod(raw, fallback = 'email') {
  const candidates = splitCsvEnv(raw);
  if (!candidates.length) {
    const single = String(raw || '').trim().toLowerCase();
    if (single) candidates.push(single);
  }
  for (const candidate of candidates) {
    if (candidate === 'email' || candidate === 'guest') return candidate;
  }
  return fallback;
}

function parseJsonObjectEnv(raw) {
  const src = String(raw || '').trim();
  if (!src) return {};
  try {
    const parsed = JSON.parse(src);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed;
  } catch {
    return {};
  }
}

function sanitizePublicConfig(value) {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => sanitizePublicConfig(item));

  const out = {};
  for (const [key, val] of Object.entries(value)) {
    const lower = key.toLowerCase();
    if (lower.includes('secret') || lower.includes('private') || lower.includes('api_key')) continue;
    out[key] = sanitizePublicConfig(val);
  }
  return out;
}

function sanitizePublicUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const parsed = new URL(raw);
    const protocol = String(parsed.protocol || '').toLowerCase();
    const host = String(parsed.hostname || '').toLowerCase();
    if (protocol !== 'https:' && protocol !== 'http:') return '';
    if (host === 'example.com' || host.endsWith('.example.com')) return '';
    return parsed.toString();
  } catch {
    return '';
  }
}

function toCspConnectSrcFromUrls(values) {
  if (!Array.isArray(values)) return [];
  const out = [];
  const seen = new Set();
  for (const value of values) {
    const raw = String(value || '').trim();
    if (!raw) continue;
    try {
      const parsed = new URL(raw);
      const protocol = String(parsed.protocol || '').toLowerCase();
      if (!['https:', 'http:', 'wss:', 'ws:'].includes(protocol)) continue;
      const origin = `${protocol}//${parsed.host}`;
      if (!origin || seen.has(origin)) continue;
      seen.add(origin);
      out.push(origin);
    } catch {
      // ignore malformed URLs in CSP derivation
    }
  }
  return out;
}

const PRIVY_APP_ID = String(process.env.PRIVY_APP_ID || '').trim();
const PRIVY_CLIENT_ID = String(process.env.PRIVY_CLIENT_ID || '').trim();
const PRIVY_APP_SECRET = String(process.env.PRIVY_APP_SECRET || '').trim();
const PRIVY_API_BASE_URL = String(process.env.PRIVY_API_BASE_URL || 'https://api.privy.io').trim().replace(/\/+$/, '');
const PRIVY_SDK_SCRIPT_URL = sanitizePublicUrl(process.env.PRIVY_SDK_SCRIPT_URL || '');
const PRIVY_SDK_MODULE_URL = sanitizePublicUrl(process.env.PRIVY_SDK_MODULE_URL || '');
const PRIVY_LOGIN_METHOD = normalizePrivyLoginMethod(process.env.PRIVY_LOGIN_METHOD || 'email', 'email');
const PRIVY_PUBLIC_CONFIG_JSON = sanitizePublicConfig(parseJsonObjectEnv(process.env.PRIVY_PUBLIC_CONFIG_JSON));
const PRIVY_PUBLIC_CONFIG = {
  ...PRIVY_PUBLIC_CONFIG_JSON,
  ...(PRIVY_APP_ID ? { appId: PRIVY_APP_ID } : {}),
  ...(PRIVY_CLIENT_ID ? { clientId: PRIVY_CLIENT_ID } : {}),
  ...(PRIVY_SDK_SCRIPT_URL ? { sdkScriptUrl: PRIVY_SDK_SCRIPT_URL } : {}),
  ...(PRIVY_SDK_MODULE_URL ? { sdkModuleUrl: PRIVY_SDK_MODULE_URL } : {}),
  ...(PRIVY_LOGIN_METHOD ? { loginMethod: PRIVY_LOGIN_METHOD } : {})
};
const PRIVY_ENABLED_RAW = !!PRIVY_PUBLIC_CONFIG.appId;
const PRIVY_ENABLED_IN_TEST = parseBoolEnv(process.env.ENABLE_PRIVY_IN_TEST, false);
const PRIVY_ENABLED = PRIVY_ENABLED_RAW && (process.env.NODE_ENV !== 'test' || PRIVY_ENABLED_IN_TEST);
const START_PAGE_ENABLED = parseBoolEnv(process.env.START_PAGE_ENABLED, PRIVY_ENABLED);
const ENABLE_TRAINER_NAMESPACE = parseBoolEnv(process.env.ENABLE_TRAINER_NAMESPACE, true);
const HOME_ROUTE_FILE = START_PAGE_ENABLED ? 'start.html' : 'index.html';
const ONBOARDING_REQUIRED = PRIVY_ENABLED;
const ONBOARDING_STEP_TOWNHALL = 'townhall_profile';
const ONBOARDING_STEP_BRAIN = 'brain';
const ONBOARDING_STEP_SIGIL = 'sigil';
const ONBOARDING_STEP_CEREMONY = 'ceremony';
const ONBOARDING_STEP_DONE = 'done';

function normalizeOnboardingStep(value) {
  switch (String(value || '').trim()) {
    case ONBOARDING_STEP_TOWNHALL:
    case ONBOARDING_STEP_BRAIN:
    case ONBOARDING_STEP_SIGIL:
    case ONBOARDING_STEP_CEREMONY:
    case ONBOARDING_STEP_DONE:
      return String(value).trim();
    default:
      return '';
  }
}

function isOnboardingBrainConfigured(session) {
  if (!session || typeof session !== 'object') return false;
  if (session.flow === 'agent_solo') return true;
  return !!session?.lite?.llmConfigured;
}

function getOnboardingStepFromSession(session) {
  const onboarding = session?.onboarding && typeof session.onboarding === 'object' ? session.onboarding : {};
  if (onboarding.required !== true) return ONBOARDING_STEP_DONE;
  if (onboarding.registrationComplete !== true) return ONBOARDING_STEP_TOWNHALL;
  if (!isOnboardingBrainConfigured(session)) return ONBOARDING_STEP_BRAIN;
  if (session?.signup?.complete !== true) return ONBOARDING_STEP_SIGIL;
  if (session?.houseCeremony?.houseId) return ONBOARDING_STEP_DONE;
  return ONBOARDING_STEP_CEREMONY;
}

const DEFAULT_TOWNHALL_HUMAN_IMAGE = '/brand-kit/default_user_avatar.png';
const DEFAULT_TOWNHALL_AGENT_IMAGE = '/brand-kit/default_agent_avatar.png';
const DEFAULT_TOWNHALL_HUMAN_PROMPT = "Stylized 3D third-person game character concept: a gender-neutral, race-neutral wild west wizard known as a 'Promptmancer' with a friendly, approachable silhouette and expressive eyes.";
const DEFAULT_TOWNHALL_AGENT_PROMPT = 'Stylized 3D prairie pup avatar doing a cute hat-tip emote with a wholesome mascot vibe in a cozy wild west frontier style.';
const PINATA_JWT = String(process.env.PINATA_JWT || process.env.ERC8004_PINATA_JWT || '').trim();
const INFURA_PROJECT_ID = String(process.env.INFURA_ID || process.env.INFURA_PROJECT_ID || '').trim();
const EVM_ERC8004_CHAIN_ID_RAW = Number(process.env.EVM_ERC8004_CHAIN_ID || 11155111);
const EVM_ERC8004_CHAIN_ID = Number.isFinite(EVM_ERC8004_CHAIN_ID_RAW) && EVM_ERC8004_CHAIN_ID_RAW > 0
  ? Math.floor(EVM_ERC8004_CHAIN_ID_RAW)
  : 11155111;
const EVM_ERC8004_RPC_URL = String(
  process.env.EVM_ERC8004_RPC_URL
  || (INFURA_PROJECT_ID ? `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}` : '')
).trim();
const EVM_ERC8004_NETWORK = String(process.env.EVM_ERC8004_NETWORK || 'sepolia').trim().toLowerCase();
const EVM_ERC8004_IDENTITY_REGISTRY_DEFAULT = '0x8004a818bfb912233c491871b3d84c89a494bd9e';
const EVM_ERC8004_IDENTITY_REGISTRY = normalizeEvmAddress(
  String(
    process.env.EVM_ERC8004_IDENTITY_REGISTRY
    || process.env.EVM_ERC8004_CONTRACT_ADDRESS
    || EVM_ERC8004_IDENTITY_REGISTRY_DEFAULT
  ).trim()
) || EVM_ERC8004_IDENTITY_REGISTRY_DEFAULT;
const SOLANA_ERC8004_CLUSTER = String(process.env.SOLANA_ERC8004_CLUSTER || 'devnet').trim().toLowerCase();
const SOLANA_ERC8004_RPC_URL = String(process.env.SOLANA_ERC8004_RPC_URL || 'https://api.devnet.solana.com').trim();
const SOLANA_ERC8004_RPC_FALLBACKS = splitCsvEnv(process.env.SOLANA_ERC8004_RPC_FALLBACKS);
const SOLANA_ERC8004_DEFAULT_RPC_BY_CLUSTER = {
  devnet: 'https://api.devnet.solana.com',
  testnet: 'https://api.testnet.solana.com',
  mainnet: 'https://api.mainnet-beta.solana.com',
  'mainnet-beta': 'https://api.mainnet-beta.solana.com'
};
const SOLANA_ERC8004_RPC_CANDIDATES = uniqueStrings([
  SOLANA_ERC8004_RPC_URL,
  ...SOLANA_ERC8004_RPC_FALLBACKS,
  SOLANA_ERC8004_DEFAULT_RPC_BY_CLUSTER[SOLANA_ERC8004_CLUSTER] || ''
]);
const SOLANA_ERC8004_FEE_PAYER_SECRET = String(
  process.env.SOLANA_ERC8004_FEE_PAYER_SECRET
  || process.env.SOLANA_DEVNET_FEE_PAYER_SECRET
  || ''
).trim();
const DEFAULT_SOLANA_SPONSOR_OWNER_MIN_LAMPORTS = 50_000_000;
const SOLANA_SPONSOR_OWNER_MIN_LAMPORTS_RAW = Number(
  process.env.SOLANA_SPONSOR_OWNER_MIN_LAMPORTS || DEFAULT_SOLANA_SPONSOR_OWNER_MIN_LAMPORTS
);
const SOLANA_SPONSOR_OWNER_MIN_LAMPORTS = Number.isFinite(SOLANA_SPONSOR_OWNER_MIN_LAMPORTS_RAW)
  && SOLANA_SPONSOR_OWNER_MIN_LAMPORTS_RAW > 0
  ? Math.floor(SOLANA_SPONSOR_OWNER_MIN_LAMPORTS_RAW)
  : DEFAULT_SOLANA_SPONSOR_OWNER_MIN_LAMPORTS;
const SOLANA_SPONSOR_AUTO_TOPUP = parseBoolEnv(
  process.env.SOLANA_SPONSOR_AUTO_TOPUP,
  SOLANA_ERC8004_CLUSTER === 'devnet' || SOLANA_ERC8004_CLUSTER === 'testnet'
);
const TOWNHALL_MINT_ENABLED = parseBoolEnv(process.env.TOWNHALL_MINT_ENABLED, true);
const SOLANA_WEB3_MODULE_URL = String(process.env.SOLANA_WEB3_MODULE_URL || 'https://esm.sh/@solana/web3.js@1.98.4?bundle').trim();
const SOLANA_CONNECT_SRC = toCspConnectSrcFromUrls([...SOLANA_ERC8004_RPC_CANDIDATES, ...SOLANA_RPC_URLS]);

const CSP_SCRIPT_SRC_EXTRA = splitCsvEnv(process.env.CSP_SCRIPT_SRC_EXTRA);
const PRIVY_SCRIPT_SRC_DEFAULT = [
  'https://esm.sh',
  'https://cdn.jsdelivr.net',
  'https://cdn.skypack.dev',
  'https://auth.privy.io',
  'https://*.privy.io',
  'https://*.privy.app',
  'https://*.privy.com'
];
const scriptSrc = [
  "'self'",
  ...(PRIVY_ENABLED ? PRIVY_SCRIPT_SRC_DEFAULT : []),
  ...CSP_SCRIPT_SRC_EXTRA
];
const SCRIPT_SRC = [...new Set(scriptSrc)];
const CSP_CONNECT_SRC_EXTRA = splitCsvEnv(process.env.CSP_CONNECT_SRC_EXTRA);
const PRIVY_CONNECT_SRC_DEFAULT = [
  'https://auth.privy.io',
  'https://api.privy.io',
  'https://*.privy.io',
  'https://*.privy.app',
  'https://*.privy.com',
  'https://*.privy.systems',
  'https://privy.systems',
  // Embedded wallets can call chain-specific Privy RPC hosts (for example sepolia.rpc.privy.systems).
  'https://*.rpc.privy.systems',
  'https://rpc.privy.systems',
  'https://sepolia.rpc.privy.systems',
  'wss://*.privy.io',
  'wss://*.privy.app',
  'wss://*.privy.com',
  'wss://*.privy.systems',
  'wss://privy.systems',
  'wss://*.rpc.privy.systems',
  'wss://rpc.privy.systems'
];
const connectSrc = [
  "'self'",
  'https://esm.sh',
  'https://cdn.jsdelivr.net',
  'https://cdn.skypack.dev',
  'https://eth.llamarpc.com',
  'https://rpc.ankr.com',
  ...SOLANA_CONNECT_SRC,
  ...(PRIVY_ENABLED ? PRIVY_CONNECT_SRC_DEFAULT : []),
  ...CSP_CONNECT_SRC_EXTRA
];
const CONNECT_SRC = [...new Set(connectSrc)];
const CSP_FRAME_SRC_EXTRA = splitCsvEnv(process.env.CSP_FRAME_SRC_EXTRA);
const frameSrc = [
  "'self'",
  'https://www.youtube.com',
  'https://www.youtube-nocookie.com',
  ...(PRIVY_ENABLED ? ['https://auth.privy.io', 'https://*.privy.io', 'https://*.privy.app', 'https://*.privy.com'] : []),
  ...CSP_FRAME_SRC_EXTRA
];
const FRAME_SRC = [...new Set(frameSrc)];

function isAdmin(req) {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return false;
  const header = req.header('x-admin-token');
  if (!header) return false;
  return header === token;
}

function normalizeXHandle(input) {
  if (typeof input !== 'string') return null;
  const handle = input.trim().replace(/^@/, '').toLowerCase();
  if (!handle) return null;
  if (!/^[a-z0-9_]{1,15}$/.test(handle)) return null;
  return handle;
}

function setSecurityHeaders(req, res, next) {
  const reqPath = typeof req.path === 'string' ? req.path : '';
  const allowSameOriginFrame = (
    reqPath.startsWith('/s/')
    || reqPath === '/atlas'
    || reqPath === '/registry'
    || reqPath === '/poker'
    || reqPath.startsWith('/poker/')
    || reqPath === '/create'
    || reqPath === '/house'
    || reqPath === '/inbox'
    || reqPath.startsWith('/inbox/')
    || reqPath === '/claim'
    || reqPath === '/claim-wallet'
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  // Note: WebContainers need COEP require-corp for SharedArrayBuffer,
  // but this blocks same-origin Workers with ERR_BLOCKED_BY_RESPONSE.
  // COEP is NOT set here — the sandbox falls back to iframe+esbuild mode.
  // WebContainer support can be added later with proper CORP headers on all resources.
  res.setHeader('X-Frame-Options', allowSameOriginFrame ? 'SAMEORIGIN' : 'DENY');

  const connectSrc = [
    "'self'",
    'https://eth.llamarpc.com', 'https://rpc.ankr.com',
    // LLM provider endpoints for direct browser-to-provider calls (no backend proxy).
    // Keys stay in the browser — the server never sees them.
    'https://openrouter.ai', 'https://api.openai.com', 'https://api.anthropic.com',
    'https://api.groq.com', 'https://api.together.xyz', 'https://api.minimax.chat',
    'https://api.moonshot.cn', 'https://api-inference.huggingface.co',
    'https://integrate.api.nvidia.com', 'https://api.venice.ai',
    'https://generativelanguage.googleapis.com',
  ];
  if (!isProd) {
    // Local development often runs UI/API on different localhost ports.
    connectSrc.push(
      'http://localhost:*',
      'https://localhost:*',
      'http://127.0.0.1:*',
      'https://127.0.0.1:*',
      'ws://localhost:*',
      'wss://localhost:*',
      'ws://127.0.0.1:*',
      'wss://127.0.0.1:*'
    );
  }

  const csp = [
    "default-src 'self'",
    `script-src ${SCRIPT_SRC.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "media-src 'self'",
    "worker-src 'self' blob:",
    `frame-src ${FRAME_SRC.join(' ')}`,
    `connect-src ${CONNECT_SRC.join(' ')}`,
    "object-src 'none'",
    "base-uri 'none'",
    `frame-ancestors ${allowSameOriginFrame ? "'self'" : "'none'"}`
  ].join('; ');
  res.setHeader('Content-Security-Policy', csp);

  if (isProd) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return next();
}

app.use((req, res, next) => {
  if (isProd && !req.secure) {
    const host = req.get('host');
    if (host) {
      return res.redirect(301, `https://${host}${req.originalUrl}`);
    }
  }
  return next();
});

app.use(setSecurityHeaders);
app.use('/api', (req, res, next) => {
  // Prevent cache validators from collapsing API reads into 304 responses.
  // Without this, stale conditional responses can arrive as empty payloads and
  // cause onboarding state to appear incomplete after a refresh.
  delete req.headers['if-none-match'];
  delete req.headers['if-modified-since'];
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  return next();
});

// --- Sandbox snapshot storage (iterate prototype) ---
const { sandboxSnapshotRouter } = require('./sandbox-snapshots');
app.use('/api/sandbox', sandboxSnapshotRouter);

// --- OpenRouter OAuth PKCE (iterate prototype) ---
const { openrouterOAuthRouter } = require('./openrouter-oauth');
app.use('/api/iterate/oauth/openrouter', openrouterOAuthRouter);

// --- ZHC1 iteration feed ---
const { problemStoriesRouter } = require('./problem-stories');
app.use('/api/problem-stories', problemStoriesRouter);
const { router: evalRouter } = require('./evaluation');
app.use('/api/problem-stories', evalRouter);
const { experimentCardsRouter } = require('./experiment-cards');
app.use('/api/problem-stories', experimentCardsRouter);
// experiments.js (simulated runner) removed — agent creates experiments via tools.
// experiment-card-detail.js removed — iterate page reads cards via experiment-cards.js.
const { feedbackRouter } = require('./feedback');
app.use('/api/experiment-cards', feedbackRouter);
const { router: saveGameRouter } = require('./save-game');
app.use('/api/save-games', saveGameRouter);
const iterationLoopRouter = require('./iteration-loop');
app.use('/api/iteration-loop', iterationLoopRouter);
const { router: discoveryRouter } = require('./discovery');
app.use('/api/discovery-feed', discoveryRouter);
const { router: publicationRouter } = require('./publication');
app.use('/api', publicationRouter);

app.use('/api/llm', requireProxySessionAccess);
app.use('/api/tools', requireProxySessionAccess);
app.use('/api/privy/wallet-rpc', requireProxySessionAccess);
app.use('/api/privy/transactions', requireProxySessionAccess);

// OpenClaw Lite compatibility: proxy OpenAI-compatible provider calls from browser runtime.
registerLlmRoutes(app);

app.get('/api/runtime/capabilities', (_req, res) => {
  res.json({
    ok: true,
    llm: {
      codexCli: false
    }
  });
});

// --- rate limiting ---
const rateBuckets = new Map();
function rateLimit({ windowMs, max, keyFn }) {
  return (req, res, next) => {
    const key = keyFn(req);
    if (!key) return next();
    const now = Date.now();
    let bucket = rateBuckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      rateBuckets.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      console.warn(`[rate-limit] 429 for ${req.method} ${req.originalUrl} (${key})`);
      return res.status(429).json({ ok: false, error: 'RATE_LIMITED' });
    }
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - bucket.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(bucket.resetAt / 1000));
    return next();
  };
}

app.use(
  '/api/agent',
  rateLimit({
    windowMs: 60_000,
    max: 1200,
    keyFn: (req) => `agent:${req.ip}`
  })
);

app.use(
  '/api/house',
  rateLimit({
    windowMs: 60_000,
    max: 180,
    keyFn: (req) => `house:${req.ip}`
  })
);

const shareLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  keyFn: (req) => `share:${req.ip}`
});
app.use('/api/share/create', shareLimiter);

app.use(
  '/api/token',
  rateLimit({
    windowMs: 60_000,
    max: 30,
    keyFn: (req) => `token:${req.ip}`
  })
);

app.use(
  '/api/wallet',
  rateLimit({
    windowMs: 60_000,
    max: 30,
    keyFn: (req) => `wallet:${req.ip}`
  })
);

app.use(
  '/api/house/init',
  rateLimit({
    windowMs: 60_000,
    max: 20,
    keyFn: (req) => `house-init:${req.ip}`
  })
);

function sessionScopedRateKey(prefix, req) {
  const cookies = parseCookies(req.header('cookie') || '');
  const sid = typeof cookies.et_session === 'string' ? cookies.et_session.trim() : '';
  return `${prefix}:${sid || req.ip || 'unknown'}`;
}

// Abuse controls: keep normal UX smooth while preventing runaway proxy/relay use.
app.use(
  '/api/tools',
  rateLimit({
    windowMs: 60_000,
    max: 180,
    keyFn: (req) => sessionScopedRateKey('tools', req)
  })
);

app.use(
  '/api/privy/wallet-rpc',
  rateLimit({
    windowMs: 60_000,
    max: 90,
    keyFn: (req) => sessionScopedRateKey('privy-wallet-rpc', req)
  })
);

app.use(
  '/api/privy/transactions',
  rateLimit({
    windowMs: 60_000,
    max: 120,
    keyFn: (req) => sessionScopedRateKey('privy-transactions', req)
  })
);

app.use(
  '/api/townhall/mint',
  rateLimit({
    windowMs: 60_000,
    max: 24,
    keyFn: (req) => sessionScopedRateKey('townhall-mint', req)
  })
);

app.use(
  '/api/web',
  rateLimit({
    windowMs: 60_000,
    max: 120,
    keyFn: (req) => sessionScopedRateKey('web', req)
  })
);

app.use(
  '/api/registry/import',
  rateLimit({
    windowMs: 60_000,
    max: 30,
    keyFn: (req) => sessionScopedRateKey('registry-import', req)
  })
);

function buildPortalRequestId() {
  return `req_${randomHex(10)}`;
}

function makePortalApiMeta(requestId = buildPortalRequestId()) {
  return {
    requestId,
    apiVersion: PORTAL_WEB_API_VERSION
  };
}

function sendPortalApiSuccess(res, data, { status = 200, requestId = buildPortalRequestId() } = {}) {
  return res.status(status).json({
    ok: true,
    data,
    meta: makePortalApiMeta(requestId)
  });
}

function sendPortalApiError(
  res,
  status,
  code,
  message,
  {
    retryable = false,
    details = {},
    requestId = buildPortalRequestId()
  } = {}
) {
  return res.status(status).json({
    ok: false,
    error: {
      code,
      message,
      retryable: retryable === true,
      details: details && typeof details === 'object' ? details : {}
    },
    meta: makePortalApiMeta(requestId)
  });
}

function resolveHumanSessionWithRecovery(req, res, { allowCreate = true } = {}) {
  const cookies = parseCookies(req.header('cookie') || '');
  const cookieSid = typeof cookies.et_session === 'string' ? cookies.et_session.trim() : '';
  const cookieSession = cookieSid ? getSessionById(cookieSid) : null;
  let sid = cookieSession?.sessionId || cookieSid;
  let session = cookieSession;
  const walletCandidates = collectWalletCandidatesFromHeaders(req);
  const walletRecoveryKey = normalizeWalletRecoveryKeyInput(req.header('x-wallet-recovery-key'));
  const walletRecoveryIntentHeader = typeof req.header('x-wallet-recovery-intent') === 'string'
    ? req.header('x-wallet-recovery-intent').trim()
    : '';
  const walletRecoveryIntent = (
    walletRecoveryIntentHeader === '1'
    || walletRecoveryIntentHeader.toLowerCase() === 'true'
  );
  const hintedTeamCode = typeof req.header('x-team-code-hint') === 'string'
    ? req.header('x-team-code-hint').trim()
    : '';
  const hintedSession = hintedTeamCode ? getSessionByTeamCode(hintedTeamCode) : null;

  const sessionRecoveryScore = (candidateSession) => {
    if (!candidateSession) return 0;
    const candidateOnboarding = ensureSessionOnboarding(candidateSession);
    if (!candidateOnboarding) return 0;
    const onboardingRequired = candidateOnboarding.required === true;
    let score = 0;
    if (candidateOnboarding.registrationComplete === true) score += 4;
    if (onboardingRequired && candidateOnboarding.step === ONBOARDING_STEP_DONE) score += 3;
    if (candidateSession?.houseCeremony?.houseId) score += 2;
    if (candidateSession?.signup?.complete) score += 1;
    return score;
  };

  const walletRecoveryKeyMatches = (candidateSession) => {
    if (!candidateSession || !walletRecoveryKey) return false;
    const candidateKey = normalizeWalletRecoveryKeyInput(candidateSession.walletRecoveryKey);
    if (!candidateKey) return false;
    const a = Buffer.from(candidateKey);
    const b = Buffer.from(walletRecoveryKey);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  };

  const pickBestWalletSession = () => {
    if (!walletRecoveryKey) return null;
    let bestSession = null;
    let bestScore = -1;
    for (const candidate of walletCandidates) {
      const walletSession = getSessionByWallet(candidate?.chain, candidate?.address);
      if (!walletSession) continue;
      if (!walletRecoveryKeyMatches(walletSession)) continue;
      const score = sessionRecoveryScore(walletSession);
      if (score > bestScore) {
        bestSession = walletSession;
        bestScore = score;
      }
    }
    return bestSession;
  };

  if (!session) {
    if (hintedSession) {
      session = hintedSession;
      sid = hintedSession.sessionId;
    }
  }

  if (!session) {
    const walletSession = pickBestWalletSession();
    if (walletSession) {
      session = walletSession;
      sid = walletSession.sessionId;
    }
  }

  if (!session && hintedSession) {
    session = hintedSession;
    sid = hintedSession.sessionId;
  }

  if (!session) {
    if (!allowCreate) return null;
    session = createSession();
    sid = session.sessionId;
  }

  let currentScore = sessionRecoveryScore(session);

  if (session) {
    if (
      !cookieSession
      &&
      hintedSession
      && hintedSession.sessionId !== session.sessionId
      && hintedTeamCode
      && hintedSession.teamCode === hintedTeamCode
    ) {
      session = hintedSession;
      sid = hintedSession.sessionId;
      currentScore = sessionRecoveryScore(session);
    }

    const walletSession = pickBestWalletSession();
    const walletScore = sessionRecoveryScore(walletSession);
    const hasStickyHintForCurrentSession = (
      !!hintedTeamCode
      && !!session?.teamCode
      && hintedTeamCode === session.teamCode
    );
    const allowWalletOverride = currentScore < 2 && (
      !hasStickyHintForCurrentSession
      || walletRecoveryIntent
    );
    if (
      allowWalletOverride
      && walletSession
      && walletSession.sessionId !== session.sessionId
      && walletScore > currentScore
    ) {
      session = walletSession;
      sid = walletSession.sessionId;
    }
  }

  if (!cookieSid || cookieSid !== sid) {
    // Cookie is the primary "identity" token.
    // In local dev we intentionally avoid Secure cookies so localhost HTTP
    // sessions remain stable even when reverse-proxy headers mark req.secure.
    const secureFlag = isProd ? '; Secure' : '';
    res.setHeader('Set-Cookie', `et_session=${encodeURIComponent(sid)}; Path=/; SameSite=Lax; HttpOnly${secureFlag}`);
  }

  if (!normalizeWalletRecoveryKeyInput(session.walletRecoveryKey)) {
    session.walletRecoveryKey = `wrk_${randomHex(32)}`;
  }
  ensureLiteState(session);
  updateLiteRuntimeReady(session);
  return session;
}

function ensureHumanSession(req, res) {
  return resolveHumanSessionWithRecovery(req, res, { allowCreate: true });
}

function requireBoundHumanSession(req, res, { requestId = buildPortalRequestId() } = {}) {
  const session = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
  if (session) return session;
  sendPortalApiError(
    res,
    401,
    'UNAUTHORIZED',
    'A live Portal session is required for this route.',
    { requestId }
  );
  return null;
}

function normalizeWalletChainInput(rawChain) {
  const chain = typeof rawChain === 'string' ? rawChain.trim().toLowerCase() : '';
  return chain === 'evm' || chain === 'solana' ? chain : '';
}

function normalizeWalletRecoveryKeyInput(rawKey) {
  const key = typeof rawKey === 'string' ? rawKey.trim().toLowerCase() : '';
  return /^wrk_[a-f0-9]{64}$/.test(key) ? key : '';
}

function collectWalletCandidatesFromHeaders(req) {
  const out = [];
  const seen = new Set();
  const add = (chain, address) => {
    const normalizedChain = normalizeWalletChainInput(chain);
    if (!normalizedChain) return;
    const normalizedAddress = normalizedChain === 'evm'
      ? normalizeEvmAddress(address)
      : normalizeWalletSessionSolanaAddress(address);
    if (!normalizedAddress) return;
    const key = `${normalizedChain}:${normalizedAddress}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ chain: normalizedChain, address: normalizedAddress });
  };

  add(req.header('x-wallet-chain'), req.header('x-wallet-address'));
  add('evm', req.header('x-wallet-evm-address'));
  add('solana', req.header('x-wallet-solana-address'));
  return out;
}

function collectTownhallWalletCandidatesFromPayload(walletPayload) {
  const wallet = walletPayload && typeof walletPayload === 'object' ? walletPayload : null;
  if (!wallet) return [];

  const out = [];
  const seen = new Set();
  const add = (chain, address) => {
    const normalizedChain = normalizeWalletChainInput(chain);
    if (!normalizedChain) return;
    const normalizedAddress = normalizedChain === 'evm'
      ? normalizeEvmAddress(address)
      : normalizeWalletSessionSolanaAddress(address);
    if (!normalizedAddress) return;
    const key = `${normalizedChain}:${normalizedAddress}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ chain: normalizedChain, address: normalizedAddress });
  };

  add('evm', wallet.evmAddress);
  add('evm', wallet.evm);
  add('solana', wallet.solanaAddress);
  add('solana', wallet.solana);
  add(wallet.chain, wallet.address);
  return out;
}

function getExistingHumanSession(req) {
  const cookies = parseCookies(req.header('cookie') || '');
  const sid = typeof cookies.et_session === 'string' ? cookies.et_session.trim() : '';
  if (!sid) return null;
  return getSessionById(sid) || null;
}

function headerHostMatchesRequestHost(rawValue, host) {
  const value = String(rawValue || '').trim();
  if (!value) return null;
  try {
    return new URL(value).host.toLowerCase() === host;
  } catch {
    return false;
  }
}

function hasTrustedSameOriginFetchMetadata(req) {
  const fetchSite = String(req.get('sec-fetch-site') || '').trim().toLowerCase();
  if (fetchSite !== 'same-origin') return false;

  const fetchMode = String(req.get('sec-fetch-mode') || '').trim().toLowerCase();
  if (!fetchMode || fetchMode === 'navigate') return false;

  const fetchDest = String(req.get('sec-fetch-dest') || '').trim().toLowerCase();
  if (['document', 'frame', 'iframe', 'embed', 'object'].includes(fetchDest)) {
    return false;
  }

  return true;
}

function hasSameOriginNavigationContext(req) {
  const host = String(req.get('host') || '').trim().toLowerCase();
  if (!host) return false;

  const originMatch = headerHostMatchesRequestHost(req.get('origin'), host);
  if (originMatch === false) return false;

  const refererMatch = headerHostMatchesRequestHost(req.get('referer'), host);
  if (refererMatch === false) return false;

  if (originMatch === true || refererMatch === true) {
    return true;
  }

  // Same-origin browser fetches may omit Origin/Referer on GETs; in that case
  // fall back to browser-managed Fetch Metadata rather than opening the route.
  return hasTrustedSameOriginFetchMetadata(req);
}

function requireProxySessionAccess(req, res, next) {
  const session = getExistingHumanSession(req);
  if (!session) {
    return res.status(401).json({ ok: false, error: 'SESSION_REQUIRED' });
  }
  if (!hasSameOriginNavigationContext(req)) {
    return res.status(403).json({ ok: false, error: 'FORBIDDEN_ORIGIN' });
  }
  return next();
}

function requireTownhallMintPrepareAccess(req, res) {
  const session = getExistingHumanSession(req);
  if (!session) {
    res.status(401).json({ ok: false, error: 'SESSION_REQUIRED' });
    return null;
  }
  if (!hasSameOriginNavigationContext(req)) {
    res.status(403).json({ ok: false, error: 'FORBIDDEN_ORIGIN' });
    return null;
  }
  return session;
}

function sanitizeUrl(url) {
  if (typeof url !== 'string') return null;
  const u = url.trim();
  if (!u) return null;
  if (u.length > 500) return null;
  try {
    const parsed = new URL(u);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function postJson(url, payload, { timeoutMs = TOKEN_CHECK_TIMEOUT_MS } = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const target = new URL(url);
    const lib = target.protocol === 'http:' ? http : https;
    const req = lib.request(
      {
        method: 'POST',
        hostname: target.hostname,
        port: target.port || (target.protocol === 'http:' ? 80 : 443),
        path: `${target.pathname}${target.search}`,
        headers: {
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(body)
        }
      },
      (res) => {
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(raw);
          } catch {
            // ignore
          }
          if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
            const err = new Error(`RPC_${res.statusCode || 0}`);
            err.status = res.statusCode || 0;
            err.body = raw;
            err.json = json;
            return reject(err);
          }
          if (!json) return reject(new Error('RPC_BAD_JSON'));
          return resolve(json);
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => req.destroy(new Error('RPC_TIMEOUT')));
    req.write(body);
    req.end();
  });
}

async function postJsonWithFallback(urls, payload) {
  let lastErr = null;
  for (const url of urls) {
    try {
      return await postJson(url, payload);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('RPC_UNAVAILABLE');
}

function addressHasTokenValue(account) {
  const amount = account?.account?.data?.parsed?.info?.tokenAmount?.amount;
  if (typeof amount !== 'string') return false;
  try {
    return BigInt(amount) > 0n;
  } catch {
    return false;
  }
}

const tokenVerifyCache = new Map();
function getCachedTokenEligibility(address) {
  const cached = tokenVerifyCache.get(address);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    tokenVerifyCache.delete(address);
    return null;
  }
  return cached.eligible;
}

function setCachedTokenEligibility(address, eligible) {
  tokenVerifyCache.set(address, { eligible, expiresAt: Date.now() + TOKEN_VERIFY_CACHE_MS });
}

async function hasElizaTownToken(address) {
  if (process.env.NODE_ENV === 'test') {
    const testAddr = process.env.TEST_TOKEN_ADDRESS || 'So1anaMockToken1111111111111111111111111111';
    return address === testAddr;
  }
  const cached = getCachedTokenEligibility(address);
  if (cached !== null) return cached;
  const payload = {
    jsonrpc: '2.0',
    id: 1,
    method: 'getTokenAccountsByOwner',
    params: [address, { mint: ELIZATOWN_MINT }, { encoding: 'jsonParsed' }]
  };
  const data = await postJsonWithFallback(SOLANA_RPC_URLS, payload);
  const accounts = Array.isArray(data?.result?.value) ? data.result.value : [];
  const eligible = accounts.some(addressHasTokenValue);
  setCachedTokenEligibility(address, eligible);
  return eligible;
}

const MAX_HOUSE_ENTRIES = 200;
const MAX_HOUSES = 500;
const MAX_SHARES = 2000;
const MAX_SIGNUPS = 5000;
const MAX_PUBLIC_TEAMS = 2000;
const MAX_PUBLIC_IMAGE_BYTES = 1024 * 1024;
const MAX_PUBLIC_PROMPT_CHARS = 280;
const MAX_TOWNHALL_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_TOWNHALL_PROMPT_CHARS = 4096;
const MAX_TOWNHALL_NAME_CHARS = 48;
const MAX_TOWNHALL_ERC_ID_CHARS = 160;
const MEDIA_SLOT_PATH_TO_KEY = Object.freeze({
  'share-hero': 'shareHero',
  'agent-avatar': 'agentAvatar',
  'human-avatar': 'humanAvatar'
});
const MEDIA_SLOT_KEY_TO_PATH = Object.freeze({
  shareHero: 'share-hero',
  agentAvatar: 'agent-avatar',
  humanAvatar: 'human-avatar'
});
const MIN_AGENT_SOLO_PIXELS = 20;
const PONY_ANON_POSTAGE_MIN_DIFFICULTY = 8;
const MAX_VAULT_REF_BYTES = 1024 * 1024 * 1024;
const MAX_AGENT_STATE_BYTES = 8 * 1024 * 1024;
const MAX_AGENT_STATE_META_RECORDS = 2048;
const MAX_AGENT_STATE_VFS_RECORDS = 20000;
const MAX_AGENT_STATE_CHECKPOINT_RECORDS = 5000;
const AGENT_STATE_KIND = 'openclaw-lite-state';
const AGENT_STATE_SCHEMA = 'openclaw-lite-state@1';
const AGENT_STATE_SEALED_KIND = 'openclaw-lite-state-sealed';
const AGENT_STATE_SEALED_SCHEMA = 'openclaw-lite-state-sealed@1';

const ponyTransportService = createPonyTransportService();
const ponyPostageVerifier = createPostageVerifier({
  basePowMinDifficulty: 1,
  anonymousPowMinDifficulty: PONY_ANON_POSTAGE_MIN_DIFFICULTY,
  resolveReceipt: ({ receiptId, context } = {}) => {
    const store = context?.store;
    if (!store || !Array.isArray(store.inbox)) return null;
    const message = store.inbox.find((entry) => entry?.dispatch?.receiptId === receiptId);
    if (!message) return null;
    return {
      id: receiptId,
      messageId: message.id || null,
      toHouseId: message.toHouseId || null
    };
  }
});
const houseVaultBackend = createServerHouseVaultBackend({
  maxEntries: MAX_HOUSE_ENTRIES,
  nowIso
});

function countUserHouses(store) {
  if (!store || !Array.isArray(store.houses)) return 0;
  return store.houses.reduce((sum, house) => {
    if (!house || typeof house !== 'object') return sum;
    return house.preRegistered === true ? sum : sum + 1;
  }, 0);
}

function extractXHandle(url) {
  if (typeof url !== 'string') return null;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.toLowerCase();
  const allowed = new Set(['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com', 'mobile.twitter.com']);
  if (!allowed.has(host)) return null;
  const parts = parsed.pathname.split('/').filter(Boolean);
  if (!parts.length) return null;
  const raw = parts[0].startsWith('@') ? parts[0].slice(1) : parts[0];
  const handle = raw.trim();
  if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) return null;
  const reserved = new Set(['i', 'intent', 'share', 'home']);
  if (reserved.has(handle.toLowerCase())) return null;
  return handle;
}

function palette() {
  // Tiny 8-color palette (0 = empty).
  return [
    '#000000', // 0 empty (rendered as dark)
    '#ffffff',
    '#ff004d',
    '#00e756',
    '#29adff',
    '#ffa300',
    '#7e2553',
    '#fff1e8'
  ];
}

function canvasHasInk(pixels) {
  return Array.isArray(pixels) && pixels.some((p) => p && p !== 0);
}

function countInk(pixels) {
  if (!Array.isArray(pixels)) return 0;
  let count = 0;
  for (const p of pixels) {
    if (p && p !== 0) count += 1;
  }
  return count;
}

function isShareLocked(share) {
  return !!share && share.locked !== false;
}

function normalizeAgentName(name) {
  if (typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  const cleaned = trimmed.replace(/[^A-Za-z0-9 _().-]/g, '').slice(0, 40);
  return cleaned || null;
}

function normalizeTownhallName(name) {
  if (typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  const cleaned = trimmed.replace(/[^A-Za-z0-9 _().-]/g, '').slice(0, MAX_TOWNHALL_NAME_CHARS);
  return cleaned || null;
}

function normalizeTownhallErcId(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, MAX_TOWNHALL_ERC_ID_CHARS);
}

function normalizeTownhallTxRef(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 200);
}

function normalizeTownhallPrompt(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, MAX_TOWNHALL_PROMPT_CHARS);
}

function normalizeTownhallMintSubject(value) {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim().toLowerCase();
  if (cleaned === 'human' || cleaned === 'user') return 'human';
  if (cleaned === 'agent') return 'agent';
  return null;
}

function normalizeTownhallEvmIdentityState(raw) {
  const input = raw && typeof raw === 'object' ? raw : {};
  const id = typeof input.id === 'string' ? input.id : null;
  const chain = typeof input.chain === 'string' && input.chain.trim()
    ? input.chain
    : 'sepolia';
  const txHash = typeof input.txHash === 'string' ? input.txHash : null;
  const updatedAt = typeof input.updatedAt === 'string' ? input.updatedAt : null;
  return { id, chain, txHash, updatedAt };
}

function normalizeTownhallSolanaIdentityState(raw) {
  const input = raw && typeof raw === 'object' ? raw : {};
  const id = typeof input.id === 'string' ? input.id : null;
  const cluster = typeof input.cluster === 'string' && input.cluster.trim()
    ? input.cluster
    : 'devnet';
  const txSig = typeof input.txSig === 'string' ? input.txSig : null;
  const updatedAt = typeof input.updatedAt === 'string' ? input.updatedAt : null;
  return { id, cluster, txSig, updatedAt };
}

function parseTownhallImageDataUrl(dataUrl) {
  if (dataUrl == null || dataUrl === '') return { dataUrl: null };
  if (typeof dataUrl !== 'string') return { error: 'INVALID_TOWNHALL_IMAGE' };
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return { error: 'INVALID_TOWNHALL_IMAGE' };
  const payload = match[2];
  let bytes;
  try {
    bytes = Buffer.from(payload, 'base64');
  } catch {
    return { error: 'INVALID_TOWNHALL_IMAGE' };
  }
  if (!bytes || bytes.length === 0) return { error: 'INVALID_TOWNHALL_IMAGE' };
  if (bytes.length > MAX_TOWNHALL_IMAGE_BYTES) return { error: 'TOWNHALL_IMAGE_TOO_LARGE' };
  return { dataUrl };
}

function inferDataUrlMime(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(/^data:(image\/(?:png|jpeg|webp));base64,/);
  return match ? match[1] : null;
}

function townhallMintCapabilities() {
  const pinataEnabled = !!PINATA_JWT;
  const evmEnabled = TOWNHALL_MINT_ENABLED && pinataEnabled && !!EVM_ERC8004_RPC_URL;
  const solanaEnabled = TOWNHALL_MINT_ENABLED && pinataEnabled && !!SOLANA_ERC8004_RPC_URL;
  const solanaSponsorEnabled = solanaEnabled && !!SOLANA_ERC8004_FEE_PAYER_SECRET;
  return {
    enabled: TOWNHALL_MINT_ENABLED,
    pinataEnabled,
    evmEnabled,
    solanaEnabled,
    solanaSponsorEnabled
  };
}

function normalizeTownhallMintProfile(profileInput, onboarding) {
  const profile = profileInput && typeof profileInput === 'object' ? profileInput : {};
  const existingProfile = onboarding?.profile && typeof onboarding.profile === 'object' ? onboarding.profile : {};
  const existingHumanAvatar = existingProfile.humanAvatar && typeof existingProfile.humanAvatar === 'object'
    ? existingProfile.humanAvatar
    : {};
  const existingAgentAvatar = existingProfile.agentAvatar && typeof existingProfile.agentAvatar === 'object'
    ? existingProfile.agentAvatar
    : {};

  const humanName = normalizeTownhallName(profile.humanName || existingProfile.humanName || '');
  const agentName = normalizeTownhallName(profile.agentName || existingProfile.agentName || '');
  if (!humanName) return { error: 'MISSING_HUMAN_NAME' };
  if (!agentName) return { error: 'MISSING_AGENT_NAME' };

  const humanAvatarInput = profile.humanAvatar && typeof profile.humanAvatar === 'object' ? profile.humanAvatar : {};
  const agentAvatarInput = profile.agentAvatar && typeof profile.agentAvatar === 'object' ? profile.agentAvatar : {};

  const humanPrompt = normalizeTownhallPrompt(
    humanAvatarInput.prompt
    || existingHumanAvatar.prompt
    || DEFAULT_TOWNHALL_HUMAN_PROMPT
  );
  const agentPrompt = normalizeTownhallPrompt(
    agentAvatarInput.prompt
    || existingAgentAvatar.prompt
    || DEFAULT_TOWNHALL_AGENT_PROMPT
  );
  if (!humanPrompt) return { error: 'MISSING_HUMAN_AVATAR_PROMPT' };
  if (!agentPrompt) return { error: 'MISSING_AGENT_AVATAR_PROMPT' };

  let humanImage = existingHumanAvatar.image || DEFAULT_TOWNHALL_HUMAN_IMAGE;
  let agentImage = existingAgentAvatar.image || DEFAULT_TOWNHALL_AGENT_IMAGE;
  let humanSource = existingHumanAvatar.source === 'upload' ? 'upload' : 'default';
  let agentSource = existingAgentAvatar.source === 'upload' ? 'upload' : 'default';

  if (Object.prototype.hasOwnProperty.call(humanAvatarInput, 'image')) {
    const parsedHuman = parseTownhallImageDataUrl(humanAvatarInput.image);
    if (parsedHuman.error) return { error: parsedHuman.error };
    if (parsedHuman.dataUrl) {
      humanImage = parsedHuman.dataUrl;
      humanSource = 'upload';
    } else {
      humanImage = DEFAULT_TOWNHALL_HUMAN_IMAGE;
      humanSource = 'default';
    }
  }

  if (Object.prototype.hasOwnProperty.call(agentAvatarInput, 'image')) {
    const parsedAgent = parseTownhallImageDataUrl(agentAvatarInput.image);
    if (parsedAgent.error) return { error: parsedAgent.error };
    if (parsedAgent.dataUrl) {
      agentImage = parsedAgent.dataUrl;
      agentSource = 'upload';
    } else {
      agentImage = DEFAULT_TOWNHALL_AGENT_IMAGE;
      agentSource = 'default';
    }
  }

  return {
    profile: {
      humanName,
      agentName,
      humanAvatar: {
        image: humanImage,
        prompt: humanPrompt,
        source: humanSource
      },
      agentAvatar: {
        image: agentImage,
        prompt: agentPrompt,
        source: agentSource
      }
    }
  };
}

function buildTownhallMintMetadata({
  profile,
  chain,
  walletAddress,
  origin,
  subject = 'agent'
}) {
  const mintSubject = normalizeTownhallMintSubject(subject) || 'agent';
  const isHumanSubject = mintSubject === 'human';
  const humanAvatar = profile?.humanAvatar || {};
  const agentAvatar = profile?.agentAvatar || {};
  const humanImage = typeof humanAvatar.image === 'string' && humanAvatar.image.trim()
    ? humanAvatar.image
    : DEFAULT_TOWNHALL_HUMAN_IMAGE;
  const agentImage = typeof agentAvatar.image === 'string' && agentAvatar.image.trim()
    ? agentAvatar.image
    : DEFAULT_TOWNHALL_AGENT_IMAGE;
  const subjectImage = isHumanSubject ? humanImage : agentImage;
  const subjectName = isHumanSubject ? profile.humanName : profile.agentName;
  const subjectPrompt = isHumanSubject ? humanAvatar.prompt : agentAvatar.prompt;
  const subjectLabel = isHumanSubject ? 'human' : 'agent';

  const attributes = [
    { trait_type: 'subject', value: subjectLabel },
    { trait_type: 'subject_name', value: subjectName },
    { trait_type: 'human_name', value: profile.humanName },
    { trait_type: 'agent_name', value: profile.agentName },
    { trait_type: 'chain', value: chain },
    ...(walletAddress ? [{ trait_type: 'wallet', value: walletAddress }] : [])
  ];

  return {
    name: `${subjectName} (${subjectLabel})`,
    description: `Agent Town ${subjectLabel} onboarding identity record.`,
    image: subjectImage,
    external_url: `${origin}/app`,
    attributes,
    properties: {
      version: 2,
      kind: 'agent-town-onboarding',
      subject: subjectLabel,
      subjectName,
      subjectPrompt: subjectPrompt || null,
      chain,
      avatars: {
        human: {
          image: humanImage,
          mime: inferDataUrlMime(humanImage) || null,
          prompt: humanAvatar.prompt || null,
          source: humanAvatar.source || 'default'
        },
        agent: {
          image: agentImage,
          mime: inferDataUrlMime(agentImage) || null,
          prompt: agentAvatar.prompt || null,
          source: agentAvatar.source || 'default'
        }
      },
      walletAddress: walletAddress || null,
      createdAt: nowIso()
    }
  };
}

async function pinJsonToIpfs(content, { name = 'agent-town-registration' } = {}) {
  if (!PINATA_JWT) {
    const err = new Error('PINATA_NOT_CONFIGURED');
    err.code = 'PINATA_NOT_CONFIGURED';
    throw err;
  }

  const resp = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${PINATA_JWT}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      pinataOptions: { cidVersion: 1 },
      pinataMetadata: { name },
      pinataContent: content
    })
  });

  let payload = null;
  try {
    payload = await resp.json();
  } catch {
    payload = null;
  }
  if (!resp.ok) {
    const err = new Error('PINATA_UPLOAD_FAILED');
    err.code = 'PINATA_UPLOAD_FAILED';
    err.status = resp.status;
    err.detail = payload;
    throw err;
  }
  const cid = typeof payload?.IpfsHash === 'string' ? payload.IpfsHash.trim() : '';
  if (!cid) {
    const err = new Error('PINATA_UPLOAD_FAILED');
    err.code = 'PINATA_UPLOAD_FAILED';
    throw err;
  }
  return cid;
}

function summarizePinataFailureDetail(detail) {
  if (!detail) return null;
  if (typeof detail === 'string') {
    const text = detail.trim();
    return text ? text.slice(0, 280) : null;
  }
  if (typeof detail === 'object') {
    const reason = typeof detail?.error?.reason === 'string' ? detail.error.reason.trim() : '';
    const text = typeof detail?.error?.details === 'string' ? detail.error.details.trim() : '';
    if (reason && text) return `${reason}: ${text}`.slice(0, 280);
    if (reason) return reason.slice(0, 280);
    if (text) return text.slice(0, 280);
  }
  return null;
}

let cachedSolanaSdkModulePromise = null;
function loadSolanaSdkModule() {
  if (!cachedSolanaSdkModulePromise) {
    cachedSolanaSdkModulePromise = import('8004-solana')
      .catch((err) => {
        cachedSolanaSdkModulePromise = null;
        throw err;
      });
  }
  return cachedSolanaSdkModulePromise;
}

let cachedSolanaWeb3ModulePromise = null;
function loadSolanaWeb3Module() {
  if (!cachedSolanaWeb3ModulePromise) {
    cachedSolanaWeb3ModulePromise = import('@solana/web3.js')
      .catch((err) => {
        cachedSolanaWeb3ModulePromise = null;
        throw err;
      });
  }
  return cachedSolanaWeb3ModulePromise;
}

function summarizeSolanaPrepareError(err) {
  const text = String(err?.detail || err?.message || err || '').trim();
  return text ? text.slice(0, 260) : 'unknown error';
}

function isRetryableSolanaPrepareError(err) {
  const text = summarizeSolanaPrepareError(err).toLowerCase();
  return (
    text.includes('fetch failed')
    || text.includes('failed to fetch')
    || text.includes('network')
    || text.includes('timed out')
    || text.includes('timeout')
    || text.includes('econnreset')
    || text.includes('enotfound')
    || text.includes('eai_again')
  );
}

function waitMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function prepareSolanaRegistrationWithRpcFallback({
  SolanaSDK,
  cluster,
  tokenUri,
  signer,
  assetPubkey,
  feePayer
}) {
  const rpcCandidates = uniqueStrings(SOLANA_ERC8004_RPC_CANDIDATES);
  if (!rpcCandidates.length) {
    const err = new Error('SOLANA_PREPARE_FAILED');
    err.detail = 'No Solana RPC endpoint configured for ERC-8004 prepare.';
    throw err;
  }
  const failures = [];
  for (const rpcUrl of rpcCandidates) {
    const sdk = new SolanaSDK({ cluster, rpcUrl });
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const prepared = await sdk.registerAgent(
          tokenUri,
          undefined,
          {
            skipSend: true,
            signer,
            assetPubkey,
            ...(feePayer ? { feePayer } : {}),
            atomEnabled: false
          }
        );
        return { prepared, rpcUrl };
      } catch (err) {
        const summary = summarizeSolanaPrepareError(err);
        failures.push(`${rpcUrl} (attempt ${attempt}): ${summary}`);
        if (!isRetryableSolanaPrepareError(err) || attempt >= 2) break;
        await waitMs(250 * attempt);
      }
    }
  }
  const out = new Error('SOLANA_PREPARE_FAILED');
  out.detail = failures.slice(0, 6).join(' | ');
  throw out;
}

function parseSolanaFeePayerSecretKeyBytes(raw) {
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  if (!trimmed) return null;

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (!Array.isArray(parsed)) return null;
      if (!parsed.every((value) => Number.isFinite(value) && value >= 0 && value <= 255)) return null;
      const bytes = Uint8Array.from(parsed.map((value) => Math.floor(Number(value))));
      if (bytes.length === 64) return bytes;
      return null;
    } catch {
      return null;
    }
  }

  if (/^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length % 4 === 0) {
    const decoded = decodeB64(trimmed);
    if (decoded && decoded.length === 64) return new Uint8Array(decoded);
  }

  const base58 = base58Decode(trimmed);
  if (base58 && base58.length === 64) return base58;
  return null;
}

let cachedSolanaFeePayerPromise = null;
async function loadSolanaFeePayerKeypair() {
  if (!SOLANA_ERC8004_FEE_PAYER_SECRET) return null;
  if (!cachedSolanaFeePayerPromise) {
    cachedSolanaFeePayerPromise = (async () => {
      const secret = parseSolanaFeePayerSecretKeyBytes(SOLANA_ERC8004_FEE_PAYER_SECRET);
      if (!secret) throw new Error('SOLANA_SPONSOR_SECRET_INVALID');
      const { Keypair } = await loadSolanaWeb3Module();
      try {
        return Keypair.fromSecretKey(secret);
      } catch {
        throw new Error('SOLANA_SPONSOR_SECRET_INVALID');
      }
    })().catch((err) => {
      cachedSolanaFeePayerPromise = null;
      throw err;
    });
  }
  return cachedSolanaFeePayerPromise;
}

async function ensureSolanaOwnerLamportsForSponsoredMint({
  connection,
  web3,
  ownerAddress,
  feePayer,
  minLamports
}) {
  const { PublicKey } = web3;
  const ownerPubkey = new PublicKey(ownerAddress);
  const targetLamports = Number.isFinite(minLamports) && minLamports > 0 ? Math.floor(minLamports) : 10_000_000;
  const [ownerBalance, sponsorBalance] = await Promise.all([
    connection.getBalance(ownerPubkey, 'confirmed'),
    connection.getBalance(feePayer.publicKey, 'confirmed')
  ]);
  if (ownerBalance >= targetLamports) {
    return { ownerBalance, sponsorBalance, topUpLamports: 0 };
  }
  if (!SOLANA_SPONSOR_AUTO_TOPUP) {
    const err = new Error('SOLANA_SPONSORED_OWNER_UNFUNDED');
    err.detail = `Owner wallet has ${ownerBalance} lamports; requires at least ${targetLamports}.`;
    throw err;
  }

  const topUpLamports = targetLamports - ownerBalance;
  const minimumSponsorBalance = topUpLamports + 50_000;
  if (sponsorBalance < minimumSponsorBalance) {
    const err = new Error('SOLANA_SPONSOR_FEEPAYER_UNFUNDED');
    err.detail = `Sponsor fee payer has ${sponsorBalance} lamports; at least ${minimumSponsorBalance} needed to top up owner wallet.`;
    throw err;
  }

  await topUpSolanaOwnerLamports({
    connection,
    web3,
    ownerAddress,
    feePayer,
    lamports: topUpLamports
  });

  const ownerBalanceAfter = await connection.getBalance(ownerPubkey, 'confirmed');
  if (ownerBalanceAfter < targetLamports) {
    const err = new Error('SOLANA_SPONSORED_OWNER_UNFUNDED');
    err.detail = `Owner wallet still underfunded after top-up (${ownerBalanceAfter} lamports).`;
    throw err;
  }
  return {
    ownerBalance: ownerBalanceAfter,
    sponsorBalance,
    topUpLamports
  };
}

async function topUpSolanaOwnerLamports({
  connection,
  web3,
  ownerAddress,
  feePayer,
  lamports
}) {
  const { PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } = web3;
  const ownerPubkey = new PublicKey(ownerAddress);
  const amount = Number.isFinite(lamports) && lamports > 0 ? Math.floor(lamports) : 0;
  if (amount < 1) return;
  try {
    const tx = new Transaction().add(SystemProgram.transfer({
      fromPubkey: feePayer.publicKey,
      toPubkey: ownerPubkey,
      lamports: amount
    }));
    await sendAndConfirmTransaction(connection, tx, [feePayer], {
      commitment: 'confirmed',
      preflightCommitment: 'confirmed'
    });
  } catch (cause) {
    const err = new Error('SOLANA_SPONSORED_OWNER_UNFUNDED');
    err.detail = `Could not top up owner wallet: ${String(cause?.message || cause)}`;
    throw err;
  }
}

function parseSolanaLamportShortfall(detailText) {
  const text = String(detailText || '');
  const match = text.match(/insufficient lamports\s+(\d+)\s*,\s*need\s+(\d+)/i);
  if (!match) return null;
  const have = Number(match[1]);
  const need = Number(match[2]);
  if (!Number.isFinite(have) || !Number.isFinite(need) || need <= have) return null;
  return {
    have,
    need,
    shortfall: need - have
  };
}

function isSolanaRentFundingError(detailText) {
  const text = String(detailText || '').toLowerCase();
  return text.includes('insufficient funds for rent');
}

function ensureSessionOnboarding(session) {
  if (!session || typeof session !== 'object') return null;
  if (!session.onboarding || typeof session.onboarding !== 'object') session.onboarding = {};
  const onboarding = session.onboarding;
  onboarding.required = ONBOARDING_REQUIRED;
  onboarding.registrationComplete = onboarding.registrationComplete === true;
  onboarding.step = normalizeOnboardingStep(onboarding.step);
  if (!onboarding.step) {
    onboarding.step = getOnboardingStepFromSession(session);
  }
  onboarding.registeredAt = typeof onboarding.registeredAt === 'string' ? onboarding.registeredAt : null;

  if (!onboarding.profile || typeof onboarding.profile !== 'object') onboarding.profile = {};
  onboarding.profile.humanName = typeof onboarding.profile.humanName === 'string' ? onboarding.profile.humanName : null;
  onboarding.profile.agentName = typeof onboarding.profile.agentName === 'string' ? onboarding.profile.agentName : null;
  if (!onboarding.profile.humanAvatar || typeof onboarding.profile.humanAvatar !== 'object') {
    onboarding.profile.humanAvatar = {};
  }
  if (!onboarding.profile.agentAvatar || typeof onboarding.profile.agentAvatar !== 'object') {
    onboarding.profile.agentAvatar = {};
  }

  const humanAvatar = onboarding.profile.humanAvatar;
  const agentAvatar = onboarding.profile.agentAvatar;

  humanAvatar.image = typeof humanAvatar.image === 'string' && humanAvatar.image.trim()
    ? humanAvatar.image
    : DEFAULT_TOWNHALL_HUMAN_IMAGE;
  humanAvatar.prompt = typeof humanAvatar.prompt === 'string' && humanAvatar.prompt.trim()
    ? humanAvatar.prompt
    : DEFAULT_TOWNHALL_HUMAN_PROMPT;
  humanAvatar.source = humanAvatar.source === 'upload' ? 'upload' : 'default';
  humanAvatar.updatedAt = typeof humanAvatar.updatedAt === 'string' ? humanAvatar.updatedAt : null;

  agentAvatar.image = typeof agentAvatar.image === 'string' && agentAvatar.image.trim()
    ? agentAvatar.image
    : DEFAULT_TOWNHALL_AGENT_IMAGE;
  agentAvatar.prompt = typeof agentAvatar.prompt === 'string' && agentAvatar.prompt.trim()
    ? agentAvatar.prompt
    : DEFAULT_TOWNHALL_AGENT_PROMPT;
  agentAvatar.source = agentAvatar.source === 'upload' ? 'upload' : 'default';
  agentAvatar.updatedAt = typeof agentAvatar.updatedAt === 'string' ? agentAvatar.updatedAt : null;

  if (!onboarding.erc8004 || typeof onboarding.erc8004 !== 'object') onboarding.erc8004 = {};
  const erc8004 = onboarding.erc8004;

  if (!erc8004.user || typeof erc8004.user !== 'object') erc8004.user = {};
  if (!erc8004.agent || typeof erc8004.agent !== 'object') erc8004.agent = {};

  erc8004.user.evm = normalizeTownhallEvmIdentityState(erc8004.user.evm);
  erc8004.user.solana = normalizeTownhallSolanaIdentityState(erc8004.user.solana);
  erc8004.agent.evm = normalizeTownhallEvmIdentityState(erc8004.agent.evm);
  erc8004.agent.solana = normalizeTownhallSolanaIdentityState(erc8004.agent.solana);

  const nowMs = Date.now();
  if (!Array.isArray(onboarding.pendingSolanaMints)) {
    onboarding.pendingSolanaMints = [];
  } else {
    onboarding.pendingSolanaMints = onboarding.pendingSolanaMints.filter((entry) => {
      if (!entry || typeof entry !== 'object') return false;
      const messageHash = typeof entry.messageHash === 'string' ? entry.messageHash.trim() : '';
      const walletAddress = typeof entry.walletAddress === 'string' ? entry.walletAddress.trim() : '';
      const assetPubkey = typeof entry.assetPubkey === 'string' ? entry.assetPubkey.trim() : '';
      const createdAtMs = Number(entry.createdAtMs || 0);
      if (!messageHash || !walletAddress || !assetPubkey) return false;
      if (!Number.isFinite(createdAtMs) || createdAtMs < 1) return false;
      return nowMs - createdAtMs <= 10 * 60 * 1000;
    });
  }

  return onboarding;
}

function cloneOnboarding(onboarding) {
  if (!onboarding || typeof onboarding !== 'object') return null;
  return JSON.parse(JSON.stringify(onboarding));
}

function recordSignup(session, { mode, agentName = null, matchedElement = null, address = null } = {}) {
  if (session.signup.complete) {
    return { complete: true, already: true, createdAt: session.signup.createdAt || null };
  }

  const store = readStore();
  if (store.signups.length >= MAX_SIGNUPS) {
    return { complete: false, reason: 'STORE_FULL' };
  }
  const signupId = `s_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const referralShareId = session.referral?.shareId || null;
  const record = {
    id: signupId,
    createdAt: nowIso(),
    teamCode: session.teamCode,
    agentName,
    matchedElement,
    referralShareId,
    mode,
    walletAddress: address || null
  };
  if (referralShareId) {
    const share = store.shares.find((x) => x.id === referralShareId);
    if (share) {
      share.referrals = typeof share.referrals === 'number' ? share.referrals + 1 : 1;
    }
  }
  store.signups.push(record);
  writeStore(store);

  session.signup.complete = true;
  session.signup.createdAt = record.createdAt;
  session.signup.mode = mode;
  session.signup.address = address || null;

  return { complete: true, already: false, createdAt: record.createdAt };
}

function buildCeremonyStateSnapshot(session) {
  return {
    humanCommit: !!session?.houseCeremony?.humanCommit,
    agentCommit: !!session?.houseCeremony?.agentCommit,
    humanReveal: !!session?.houseCeremony?.humanRevealSealed,
    agentReveal: !!session?.houseCeremony?.agentRevealSealed,
    humanRevealPub: !!session?.houseCeremony?.humanRevealPub,
    agentRevealPub: !!session?.houseCeremony?.agentRevealPub,
    houseId: session?.houseCeremony?.houseId || null
  };
}

function buildExperienceStateSnapshot(session, ceremony = buildCeremonyStateSnapshot(session)) {
  let step = 'connect_agent';
  let nextAgentAction = null;

  if (session?.signup?.mode === 'token') {
    step = ceremony.houseId ? 'house_ready' : 'token_human_only';
  } else if (!session?.agent?.connected) {
    step = 'connect_agent';
  } else if (!session?.match?.matched) {
    step = 'mirror_sigil';
  } else if (!session?.signup?.complete) {
    if (!session?.human?.openPressed) {
      step = 'wait_human_open';
    } else if (!session?.agent?.openPressed) {
      step = 'press_open';
    } else {
      step = 'wait_signup_complete';
    }
  } else if (ceremony.houseId) {
    step = 'house_ready';
  } else if (!ceremony.humanCommit) {
    step = 'wait_human_commit';
  } else if (!ceremony.agentCommit || !ceremony.agentRevealPub) {
    step = 'agent_commit';
    nextAgentAction = 'agent_town_ceremony_commit';
  } else if (!ceremony.humanReveal) {
    step = 'wait_human_reveal';
  } else if (!ceremony.agentReveal) {
    step = 'agent_reveal';
    nextAgentAction = 'agent_town_ceremony_reveal';
  } else {
    step = 'ready_for_house_init';
  }

  const waitSteps = new Set([
    'wait_human_open',
    'wait_signup_complete',
    'wait_human_commit',
    'wait_human_reveal'
  ]);

  return {
    id: 'agent_town_coop_v1',
    step,
    nextAgentAction,
    pollMs: waitSteps.has(step) ? 1000 : 700
  };
}

function decodeB64(input) {
  try {
    return Buffer.from(input, 'base64');
  } catch {
    return null;
  }
}

function parsePublicImageDataUrl(dataUrl) {
  if (dataUrl == null || dataUrl === '') return { dataUrl: null };
  if (typeof dataUrl !== 'string') return { error: 'INVALID_PUBLIC_IMAGE' };
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return { error: 'INVALID_PUBLIC_IMAGE' };
  const mime = match[1];
  const payload = match[2];
  let bytes;
  try {
    bytes = Buffer.from(payload, 'base64');
  } catch {
    return { error: 'INVALID_PUBLIC_IMAGE' };
  }
  if (!bytes || bytes.length === 0) return { error: 'INVALID_PUBLIC_IMAGE' };
  if (bytes.length > MAX_PUBLIC_IMAGE_BYTES) return { error: 'PUBLIC_IMAGE_TOO_LARGE' };
  return { dataUrl, mime, bytes };
}

function normalizePublicPrompt(value) {
  if (value == null) return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, MAX_PUBLIC_PROMPT_CHARS);
}

function normalizeMediaSource(value) {
  if (value == null) return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 80);
}

function normalizeMediaVersion(value) {
  if (value == null) return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 40);
}

function mediaSlotKeyFromPath(slotPath) {
  const raw = typeof slotPath === 'string' ? slotPath.trim().toLowerCase() : '';
  return MEDIA_SLOT_PATH_TO_KEY[raw] || null;
}

function mediaSlotPathFromKey(slotKey) {
  return MEDIA_SLOT_KEY_TO_PATH[slotKey] || null;
}

function sanitizeHouseMediaSlot(slot) {
  if (!slot || typeof slot !== 'object') return null;
  const image = typeof slot.image === 'string' ? slot.image : null;
  const prompt = typeof slot.prompt === 'string' ? normalizePublicPrompt(slot.prompt) : null;
  const source = normalizeMediaSource(slot.source);
  const version = normalizeMediaVersion(slot.version);
  const updatedAt = typeof slot.updatedAt === 'string' ? slot.updatedAt : null;
  if (!image && !prompt && !source && !version) return null;
  return {
    image,
    prompt,
    source,
    version,
    updatedAt
  };
}

function readLegacyShareHeroSlot(house) {
  const media = house?.publicMedia;
  if (!media || typeof media !== 'object') return null;
  const image = typeof media.image === 'string' ? media.image : null;
  const prompt = normalizePublicPrompt(media.prompt);
  if (!image && !prompt) return null;
  return {
    image,
    prompt,
    source: 'legacy-public-media',
    version: 'v0',
    updatedAt: typeof media.updatedAt === 'string' ? media.updatedAt : null
  };
}

function readHouseMediaSlot(house, slotKey) {
  const mediaObj = house?.media;
  if (mediaObj && typeof mediaObj === 'object' && Object.prototype.hasOwnProperty.call(mediaObj, slotKey)) {
    return sanitizeHouseMediaSlot(mediaObj[slotKey]);
  }
  if (slotKey === 'shareHero') return readLegacyShareHeroSlot(house);
  return null;
}

function ensureHouseMediaContainer(house) {
  if (!house || typeof house !== 'object') return {};
  if (!house.media || typeof house.media !== 'object' || Array.isArray(house.media)) house.media = {};
  return house.media;
}

function upsertHouseMediaSlot(house, slotKey, slotData) {
  const media = ensureHouseMediaContainer(house);
  if (!slotData) {
    delete media[slotKey];
  } else {
    media[slotKey] = slotData;
  }

  if (slotKey === 'shareHero') {
    if (slotData && slotData.image && slotData.prompt) {
      house.publicMedia = {
        image: slotData.image,
        prompt: slotData.prompt,
        updatedAt: slotData.updatedAt || nowIso()
      };
    } else {
      house.publicMedia = null;
    }
  }
}

function serializeMediaSlot(house, slotKey) {
  const slot = readHouseMediaSlot(house, slotKey);
  const slotPath = mediaSlotPathFromKey(slotKey);
  const imageUrl = slot?.image
    ? `/api/house/${encodeURIComponent(house.id)}/media/${encodeURIComponent(slotPath)}/image${slot.updatedAt ? `?v=${encodeURIComponent(slot.updatedAt)}` : ''}`
    : null;
  return {
    imageUrl,
    prompt: slot?.prompt || null,
    source: slot?.source || null,
    version: slot?.version || null,
    updatedAt: slot?.updatedAt || null
  };
}

function serializeHouseMedia(house) {
  if (!house || typeof house !== 'object') return null;
  const media = house?.media && typeof house.media === 'object' && !Array.isArray(house.media)
    ? house.media
    : {};
  const storefrontRaw = media.storefront && typeof media.storefront === 'object' && !Array.isArray(media.storefront)
    ? media.storefront
    : null;

  return {
    shareHero: serializeMediaSlot(house, 'shareHero'),
    agentAvatar: serializeMediaSlot(house, 'agentAvatar'),
    humanAvatar: serializeMediaSlot(house, 'humanAvatar'),
    storefront: {
      gallery: Array.isArray(storefrontRaw?.gallery) ? storefrontRaw.gallery : [],
      cards: Array.isArray(storefrontRaw?.cards) ? storefrontRaw.cards : []
    }
  };
}

function serializePublicOnlyHouseMedia(house) {
  const emptySlot = { imageUrl: null, prompt: null, source: null, version: null, updatedAt: null };
  return {
    shareHero: serializeMediaSlot(house, 'shareHero'),
    agentAvatar: { ...emptySlot },
    humanAvatar: { ...emptySlot },
    storefront: {
      gallery: [],
      cards: []
    }
  };
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC32_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  const sum = crc32(Buffer.concat([typeBuf, data]));
  crc.writeUInt32BE(sum, 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function hexToRgba(hex) {
  if (!hex || typeof hex !== 'string') return [0, 0, 0, 255];
  const cleaned = hex.startsWith('#') ? hex.slice(1) : hex;
  if (cleaned.length !== 6) return [0, 0, 0, 255];
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return [r, g, b, 255];
}

function canvasToPngDataUrl(canvas, paletteHex) {
  const w = canvas?.w || 0;
  const h = canvas?.h || 0;
  const pixels = Array.isArray(canvas?.pixels) ? canvas.pixels : [];
  if (!w || !h || pixels.length < w * h) return null;
  const palette = (paletteHex || palette()).map(hexToRgba);

  const stride = w * 4 + 1;
  const raw = Buffer.alloc(stride * h);
  let offset = 0;
  for (let y = 0; y < h; y++) {
    raw[offset++] = 0; // filter 0
    for (let x = 0; x < w; x++) {
      const idx = pixels[y * w + x] || 0;
      const [r, g, b, a] = palette[idx] || palette[0];
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
      raw[offset++] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const header = Buffer.from('\x89PNG\r\n\x1a\n', 'binary');
  const idat = zlib.deflateSync(raw);
  const png = Buffer.concat([
    header,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0))
  ]);

  return `data:image/png;base64,${png.toString('base64')}`;
}

function serializePublicMedia(house) {
  const slot = readHouseMediaSlot(house, 'shareHero');
  if (!slot) return null;
  const imageUrl = slot.image
    ? `/api/house/${encodeURIComponent(house.id)}/public-media/image${slot.updatedAt ? `?v=${encodeURIComponent(slot.updatedAt)}` : ''}`
    : null;
  return {
    prompt: slot.prompt || null,
    imageUrl,
    updatedAt: slot.updatedAt || null
  };
}

function isRecordObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function cloneJsonSafe(value) {
  if (value === undefined) return null;
  try {
    const encoded = JSON.stringify(value);
    if (encoded === undefined) return null;
    return JSON.parse(encoded);
  } catch {
    return null;
  }
}

function normalizeAgentStateMetaRecords(records) {
  if (!Array.isArray(records)) throw new Error('INVALID_AGENT_STATE');
  if (records.length > MAX_AGENT_STATE_META_RECORDS) throw new Error('AGENT_STATE_TOO_LARGE');
  const out = [];
  const seen = new Set();
  for (const item of records) {
    if (!isRecordObject(item)) continue;
    const key = typeof item.key === 'string' ? item.key.trim() : '';
    if (!key || key.length > 256 || seen.has(key)) continue;
    seen.add(key);
    out.push({
      key,
      value: cloneJsonSafe(item.value)
    });
  }
  return out;
}

function normalizeAgentStateVfsRecords(records) {
  if (!Array.isArray(records)) throw new Error('INVALID_AGENT_STATE');
  if (records.length > MAX_AGENT_STATE_VFS_RECORDS) throw new Error('AGENT_STATE_TOO_LARGE');
  const out = [];
  const seen = new Set();
  for (const item of records) {
    if (!isRecordObject(item)) continue;
    const pathValue = typeof item.path === 'string' ? item.path.trim() : '';
    const dataB64 = typeof item.dataB64 === 'string' ? item.dataB64.trim() : '';
    if (!pathValue || pathValue.length > 1024 || !dataB64 || dataB64.length > MAX_AGENT_STATE_BYTES) continue;
    if (seen.has(pathValue)) continue;
    seen.add(pathValue);
    const updatedAtMs = Number(item.updatedAtMs);
    out.push({
      path: pathValue,
      updatedAtMs: Number.isFinite(updatedAtMs) ? Math.max(0, Math.floor(updatedAtMs)) : Date.now(),
      dataB64
    });
  }
  return out;
}

function normalizeAgentStateCheckpointRecords(records) {
  if (!Array.isArray(records)) throw new Error('INVALID_AGENT_STATE');
  if (records.length > MAX_AGENT_STATE_CHECKPOINT_RECORDS) throw new Error('AGENT_STATE_TOO_LARGE');
  const out = [];
  const seen = new Set();
  for (const item of records) {
    if (!isRecordObject(item)) continue;
    const checkpointId = typeof item.checkpointId === 'string' ? item.checkpointId.trim() : '';
    if (!checkpointId || checkpointId.length > 256 || seen.has(checkpointId)) continue;
    const cloned = cloneJsonSafe(item);
    if (!isRecordObject(cloned)) continue;
    cloned.checkpointId = checkpointId;
    seen.add(checkpointId);
    out.push(cloned);
  }
  return out;
}

function extractAgentStateHouseId(snapshot) {
  if (!isRecordObject(snapshot)) return null;
  const metaRecords = Array.isArray(snapshot?.stores?.meta) ? snapshot.stores.meta : [];
  const houseIdEntry = metaRecords.find((entry) => isRecordObject(entry) && entry.key === 'houseId');
  const houseId = typeof houseIdEntry?.value === 'string' ? houseIdEntry.value.trim() : '';
  return houseId || null;
}

function normalizeAgentStateSealedSnapshot(raw, { expectedHouseId = null } = {}) {
  const ciphertext = raw.ciphertext;
  if (!isRecordObject(ciphertext)) throw new Error('INVALID_AGENT_STATE');
  const iv = typeof ciphertext.iv === 'string' ? ciphertext.iv.trim() : '';
  const ct = typeof ciphertext.ct === 'string' ? ciphertext.ct.trim() : '';
  const alg = typeof ciphertext.alg === 'string' ? ciphertext.alg.trim() : 'AES-GCM';
  const houseId = typeof raw.houseId === 'string' ? raw.houseId.trim() : '';
  if (alg !== 'AES-GCM' || !iv || !ct || !isCanonicalBase64(iv) || !isCanonicalBase64(ct)) {
    throw new Error('INVALID_AGENT_STATE');
  }
  if (expectedHouseId && houseId && houseId !== expectedHouseId) {
    throw new Error('AGENT_STATE_HOUSE_MISMATCH');
  }
  const normalized = {
    v: 1,
    kind: AGENT_STATE_SEALED_KIND,
    schema: AGENT_STATE_SEALED_SCHEMA,
    createdAt: typeof raw.createdAt === 'string' && raw.createdAt.trim() ? raw.createdAt.trim() : nowIso(),
    houseId: houseId || null,
    ciphertext: {
      alg: 'AES-GCM',
      iv,
      ct
    }
  };
  const sizeBytes = Buffer.byteLength(JSON.stringify(normalized), 'utf8');
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_AGENT_STATE_BYTES) {
    throw new Error('AGENT_STATE_TOO_LARGE');
  }
  return { snapshot: normalized, sizeBytes };
}

function normalizeAgentStateSnapshot(raw, { expectedHouseId = null } = {}) {
  if (!isRecordObject(raw)) throw new Error('INVALID_AGENT_STATE');
  const kind = typeof raw.kind === 'string' ? raw.kind.trim() : '';
  const schema = typeof raw.schema === 'string' ? raw.schema.trim() : '';
  if (kind === AGENT_STATE_SEALED_KIND || schema === AGENT_STATE_SEALED_SCHEMA) {
    return normalizeAgentStateSealedSnapshot(raw, { expectedHouseId });
  }
  const stores = raw.stores;
  if (!isRecordObject(stores)) throw new Error('INVALID_AGENT_STATE');

  const normalized = {
    v: 1,
    kind: AGENT_STATE_KIND,
    schema: AGENT_STATE_SCHEMA,
    createdAt: typeof raw.createdAt === 'string' && raw.createdAt.trim() ? raw.createdAt.trim() : nowIso(),
    stores: {
      meta: normalizeAgentStateMetaRecords(stores.meta || []),
      vfs: normalizeAgentStateVfsRecords(stores.vfs || []),
      checkpoints: normalizeAgentStateCheckpointRecords(stores.checkpoints || [])
    }
  };

  const snapshotHouseId = extractAgentStateHouseId(normalized);
  if (expectedHouseId && snapshotHouseId && snapshotHouseId !== expectedHouseId) {
    throw new Error('AGENT_STATE_HOUSE_MISMATCH');
  }

  const sizeBytes = Buffer.byteLength(JSON.stringify(normalized), 'utf8');
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_AGENT_STATE_BYTES) {
    throw new Error('AGENT_STATE_TOO_LARGE');
  }
  return { snapshot: normalized, sizeBytes };
}

function escapeHtmlAttr(input) {
  return String(input || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildShareMeta({ shareId, shareHero, publicMedia, origin }) {
  const hero = shareHero || publicMedia || null;
  const title = 'Agent Town — House Share';
  const description = hero?.prompt || 'Human + agent co-op house in Agent Town.';
  const url = `${origin}/s/${encodeURIComponent(shareId)}`;
  const imagePath = hero?.imageUrl || '/logo.jpg';
  const imageUrl = imagePath.startsWith('http')
    ? imagePath
    : `${origin}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  const card = hero?.imageUrl ? 'summary_large_image' : 'summary';

  return [
    `<meta property="og:title" content="${escapeHtmlAttr(title)}" />`,
    `<meta property="og:description" content="${escapeHtmlAttr(description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${escapeHtmlAttr(url)}" />`,
    `<meta property="og:image" content="${escapeHtmlAttr(imageUrl)}" />`,
    `<meta name="twitter:card" content="${escapeHtmlAttr(card)}" />`,
    `<meta name="twitter:title" content="${escapeHtmlAttr(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtmlAttr(description)}" />`,
    `<meta name="twitter:image" content="${escapeHtmlAttr(imageUrl)}" />`
  ].join('\n  ');
}

const DEFAULT_SKILL_PACK_BASE_PATH = '/__compiled/default-skill-pack';
const HOUSE_LIBRARY_SKILL_PACK_BASE_PATH = '/__compiled/library-skill-pack';
const PLATFORM_CONFIG_STATUSES = new Set(['draft', 'candidate', 'active', 'archived', 'blocked']);
const PLATFORM_IMMUTABLE_CONFIG_STATUSES = new Set(['candidate', 'active', 'archived', 'blocked']);
const PLATFORM_MUTABLE_COMPONENT_REFS = new Set(['latest', 'stable', 'main', 'master', 'experimental', 'season-lock']);
const PLATFORM_CONFIG_COMPONENT_SPECS = Object.freeze([
  { inputKey: 'housePolicyVersionId', componentKind: 'house_policy_version', multiple: false, required: true },
  { inputKey: 'teamCompositionVersionId', componentKind: 'team_composition_version', multiple: false, required: true },
  { inputKey: 'agentConfigVersionIds', componentKind: 'agent_config_version', multiple: true, required: true },
  { inputKey: 'officePolicyVersionIds', componentKind: 'office_policy_version', multiple: true, required: false },
  { inputKey: 'experiencePresetVersionId', componentKind: 'experience_preset_version', multiple: false, required: true },
  { inputKey: 'integrationOverlayVersionIds', componentKind: 'integration_overlay_version', multiple: true, required: false },
  { inputKey: 'trainerPresetVersionId', componentKind: 'trainer_preset_version', multiple: false, required: true },
]);
const PLATFORM_RUN_ENTRY_MODES = new Set(['normal', 'season_lock']);
const PLATFORM_RUN_ELIGIBLE_CONFIG_STATUSES = new Set(['candidate', 'active']);
const PLATFORM_TRACE_AUTHORITY_TYPE = 'house_trace_ingester';
const PLATFORM_EXPERIENCE_REGISTRY = Object.freeze([
  {
    experienceId: 'agent_town_coop_v1',
    displayName: 'Agent Town Co-op',
    requiresConfigPinning: true,
    supportedEntryModes: ['normal'],
    aliases: [],
  },
  {
    experienceId: 'web.agent',
    displayName: 'Web Agent',
    requiresConfigPinning: true,
    supportedEntryModes: ['normal'],
    aliases: ['web_portal_demo'],
  },
  {
    experienceId: 'poker.season',
    displayName: 'Poker Season',
    requiresConfigPinning: true,
    supportedEntryModes: ['season_lock'],
    aliases: ['arena.poker.season0'],
  },
  {
    experienceId: 'trainer.compare',
    displayName: 'Trainer Compare',
    requiresConfigPinning: false,
    supportedEntryModes: ['normal'],
    aliases: [],
  },
]);
const SUPPORTED_PLATFORM_EXPERIENCE_IDS = new Set(
  PLATFORM_EXPERIENCE_REGISTRY.flatMap((entry) => [entry.experienceId, ...(Array.isArray(entry.aliases) ? entry.aliases : [])])
);
const PLATFORM_TRAINER_JOB_KINDS = new Set([
  'trainer_job.ingest',
  'trainer_job.index',
  'trainer_job.replay',
  'trainer_job.tag',
  'trainer_job.compare',
  'trainer_job.recommend',
  'trainer_job.patch',
  'trainer_job.scrim',
  'trainer_job.guardrails',
]);
const PLATFORM_TRAINER_JOB_STATUSES = new Set(['queued', 'running', 'blocked', 'failed', 'succeeded', 'canceled']);
const TRAINER_PATCH_FIXTURE_APPROVAL_ID = 'appr_fixture_approved_01';
const LIBRARY_PUBLICATION_FIXTURE_APPROVAL_ID = 'appr_fixture_library_publish_approved_01';
const LIBRARY_PUBLIC_STACK_FIXTURE_APPROVAL_ID = 'appr_fixture_library_public_stack_approved_01';
const LIBRARY_PEER_RELAY_FIXTURE_APPROVAL_ID = 'appr_fixture_library_peer_relay_approved_01';
const LIBRARY_SATCHEL_RELAY_FIXTURE_APPROVAL_ID = 'appr_fixture_library_satchel_relay_approved_01';

function getPlatformExperienceDefinition(experienceId = '') {
  const normalizedExperienceId = String(experienceId || '').trim();
  if (!normalizedExperienceId) return null;
  for (const entry of PLATFORM_EXPERIENCE_REGISTRY) {
    if (entry.experienceId === normalizedExperienceId) {
      return {
        ...entry,
        aliases: Array.isArray(entry.aliases) ? [...entry.aliases] : [],
        supportedEntryModes: Array.isArray(entry.supportedEntryModes) ? [...entry.supportedEntryModes] : [],
      };
    }
    if (Array.isArray(entry.aliases) && entry.aliases.includes(normalizedExperienceId)) {
      return {
        ...entry,
        aliases: Array.isArray(entry.aliases) ? [...entry.aliases] : [],
        supportedEntryModes: Array.isArray(entry.supportedEntryModes) ? [...entry.supportedEntryModes] : [],
        requestedExperienceId: normalizedExperienceId,
      };
    }
  }
  return null;
}

function listPlatformExperienceDefinitions() {
  return PLATFORM_EXPERIENCE_REGISTRY.map((entry) => ({
    experienceId: entry.experienceId,
    displayName: entry.displayName,
    requiresConfigPinning: entry.requiresConfigPinning === true,
    supportedEntryModes: Array.isArray(entry.supportedEntryModes) ? [...entry.supportedEntryModes] : [],
    aliases: Array.isArray(entry.aliases) ? [...entry.aliases] : [],
  }));
}

function sanitizePlatformExperienceKey(experienceId = '') {
  const normalized = String(experienceId || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
  return normalized.replace(/^_+|_+$/g, '') || 'experience';
}

function ensurePlatformExperiencePinnedConfig({
  experienceId = '',
  houseId = '',
  teamId = '',
  requestId = '',
  nowIso: timestamp = nowIso(),
} = {}) {
  const experience = getPlatformExperienceDefinition(experienceId);
  if (!experience || experience.requiresConfigPinning !== true) {
    return null;
  }
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  if (!normalizedHouseId || !normalizedTeamId) {
    return null;
  }
  const binding = getTeamConfigBinding({
    houseId: normalizedHouseId,
    teamId: normalizedTeamId,
  });
  if (binding?.activeConfigVersionId) {
    const activeConfig = getConfigVersion(binding.activeConfigVersionId);
    if (activeConfig) return activeConfig;
  }

  const configSeed = `${experience.experienceId}:${normalizedHouseId}:${normalizedTeamId}`;
  const configVersionId = `cfg_${sha256PrefixedHex(configSeed).slice('sha256:'.length, 'sha256:'.length + 16)}`;
  let config = getConfigVersion(configVersionId);
  if (!config) {
    const experienceKey = sanitizePlatformExperienceKey(experience.experienceId);
    const componentRefs = {
      housePolicyVersionId: `hpv_${experienceKey}_01`,
      teamCompositionVersionId: `tcv_${normalizedTeamId}_01`,
      agentConfigVersionIds: [`agv_${experienceKey}_01`],
      officePolicyVersionIds: [],
      experiencePresetVersionId: `epv_${experienceKey}_01`,
      integrationOverlayVersionIds: [],
      trainerPresetVersionId: `tpv_${experienceKey}_01`,
    };
    const resolvedComponentsPayload = resolvePlatformConfigComponents(componentRefs, { requireImmutable: true });
    const manifest = {
      configVersionId,
      experienceId: experience.experienceId,
      teamId: normalizedTeamId,
      displayVersion: `${experience.experienceId}@auto-pinned`,
      branch: 'auto-pinned',
      status: 'active',
      componentRefs,
      resolvedComponents: resolvedComponentsPayload.resolvedComponents,
      resolvedComponentHashes: resolvedComponentsPayload.resolvedComponentHashes,
    };
    const configHash = sha256PrefixedHex(JSON.stringify(manifest));
    manifest.integrity = { configHash };
    config = upsertConfigVersion({
      configVersionId,
      houseId: normalizedHouseId,
      teamId: normalizedTeamId,
      experienceId: experience.experienceId,
      status: 'active',
      configHash,
      manifest,
      lineage: {
        parentConfigVersionIds: [],
        createdBy: 'v1.experience.auto_pin',
        requestId: String(requestId || '').trim() || null,
        autoPinned: true,
      },
      nowIso: timestamp,
    });
    replaceConfigComponentVersions({
      configVersionId,
      components: resolvedComponentsPayload.componentVersions.map((component, index) => ({
        configComponentVersionId: `ccv_${sha256PrefixedHex(`${configVersionId}:${component.componentKey}`).slice('sha256:'.length, 'sha256:'.length + 16)}`,
        componentKind: component.componentKind,
        componentKey: component.componentKey,
        immutableVersionId: component.immutableVersionId,
        componentHash: component.componentHash,
        metadata: {
          ...(component.metadata && typeof component.metadata === 'object' ? component.metadata : {}),
          ordinal: index,
        },
      })),
      nowIso: timestamp,
    });
  }

  upsertTeamConfigBinding({
    teamBindingId: `tb_${sha256PrefixedHex(`${normalizedHouseId}:${normalizedTeamId}:${experience.experienceId}`).slice('sha256:'.length, 'sha256:'.length + 16)}`,
    houseId: normalizedHouseId,
    teamId: normalizedTeamId,
    activeConfigVersionId: config.configVersionId,
    nowIso: timestamp,
  });
  return config;
}

function isPlatformMutableComponentRef(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return false;
  if (PLATFORM_MUTABLE_COMPONENT_REFS.has(normalized)) return true;
  if (normalized.startsWith('refs/heads/')) return true;
  if (normalized.includes('/')) return true;
  return false;
}

function derivePlatformComponentHash(componentKind, immutableVersionId) {
  return sha256PrefixedHex(`${String(componentKind || '').trim()}:${String(immutableVersionId || '').trim()}`);
}

function resolvePlatformConfigComponents(componentRefs, { requireImmutable = true } = {}) {
  const source = componentRefs && typeof componentRefs === 'object' && !Array.isArray(componentRefs)
    ? componentRefs
    : {};
  const resolvedComponents = {};
  const resolvedComponentHashes = {};
  const componentVersions = [];
  for (const spec of PLATFORM_CONFIG_COMPONENT_SPECS) {
    const raw = source[spec.inputKey];
    if (spec.multiple) {
      const refs = Array.isArray(raw)
        ? raw.map((item) => String(item || '').trim()).filter(Boolean)
        : [];
      if (spec.required && refs.length === 0) {
        const err = new Error('CONFIG_COMPONENT_INVALID');
        err.code = 'CONFIG_COMPONENT_INVALID';
        err.componentKey = spec.inputKey;
        throw err;
      }
      resolvedComponents[spec.inputKey] = [];
      resolvedComponentHashes[spec.inputKey] = [];
      refs.forEach((ref, index) => {
        if (requireImmutable && isPlatformMutableComponentRef(ref)) {
          const err = new Error('CONFIG_COMPONENT_MUTABLE_REF');
          err.code = 'CONFIG_COMPONENT_MUTABLE_REF';
          err.componentKey = spec.inputKey;
          err.ref = ref;
          throw err;
        }
        resolvedComponents[spec.inputKey].push(ref);
        const componentHash = derivePlatformComponentHash(spec.componentKind, ref);
        resolvedComponentHashes[spec.inputKey].push(componentHash);
        componentVersions.push({
          componentKind: spec.componentKind,
          componentKey: `${spec.inputKey}[${index}]`,
          immutableVersionId: ref,
          componentHash,
          metadata: {
            ordinal: index,
            sourceKey: spec.inputKey,
          },
        });
      });
      continue;
    }

    const ref = typeof raw === 'string' ? raw.trim() : '';
    if (spec.required && !ref) {
      const err = new Error('CONFIG_COMPONENT_INVALID');
      err.code = 'CONFIG_COMPONENT_INVALID';
      err.componentKey = spec.inputKey;
      throw err;
    }
    if (!ref) {
      resolvedComponents[spec.inputKey] = '';
      resolvedComponentHashes[spec.inputKey] = '';
      continue;
    }
    if (requireImmutable && isPlatformMutableComponentRef(ref)) {
      const err = new Error('CONFIG_COMPONENT_MUTABLE_REF');
      err.code = 'CONFIG_COMPONENT_MUTABLE_REF';
      err.componentKey = spec.inputKey;
      err.ref = ref;
      throw err;
    }
    const componentHash = derivePlatformComponentHash(spec.componentKind, ref);
    resolvedComponents[spec.inputKey] = ref;
    resolvedComponentHashes[spec.inputKey] = componentHash;
    componentVersions.push({
      componentKind: spec.componentKind,
      componentKey: spec.inputKey,
      immutableVersionId: ref,
      componentHash,
      metadata: {
        sourceKey: spec.inputKey,
      },
    });
  }
  return {
    resolvedComponents,
    resolvedComponentHashes,
    componentVersions,
  };
}

function encodeTraceCursor(afterSeq) {
  return Buffer.from(JSON.stringify({ afterSeq: Number(afterSeq || 0) }), 'utf8').toString('base64url');
}

function decodeTraceCursor(cursor) {
  const normalizedCursor = typeof cursor === 'string' ? cursor.trim() : '';
  if (!normalizedCursor) return 0;
  try {
    const parsed = JSON.parse(Buffer.from(normalizedCursor, 'base64url').toString('utf8'));
    const afterSeq = Number(parsed?.afterSeq || 0);
    return Number.isFinite(afterSeq) && afterSeq > 0 ? afterSeq : 0;
  } catch {
    return 0;
  }
}

function buildDefaultCompiledSkillPack() {
  const manualSkill = fs.readFileSync(path.join(PUBLIC_DIR, 'skill.md'), 'utf8');
  const heartbeat = [
    '# HEARTBEAT',
    '',
    '- Poll `GET /api/agent/state?teamCode=...` once per second while the co-op flow is active.',
    '- On transient failures, back off to 2-5 seconds before retrying.',
    '- Keep agent actions aligned to the shared state machine and avoid backend shortcuts.',
    '',
  ].join('\n');
  const tools = [
    '# TOOLS',
    '',
    '- Use the existing Agent Town runtime tools and `/api/*` routes documented in `manual/skill.md`.',
    '- Preserve backend ids exactly when present: `webSessionId`, `invocationId`, and `evidenceId`.',
    '- Runtime trainer tools remain under `trainer.*`; durable jobs belong to `trainer_job.*`.',
    '',
  ].join('\n');
  const traceMapPayload = {
    schema: 'agent-town-trace-map/v1',
    experienceId: 'agent_town_coop_v1',
    traceAuthorityType: 'portal.worker',
    steps: [
      { step: 'mirror_sigil', eventType: 'coop.sigil.mirror' },
      { step: 'press_open', eventType: 'coop.open.press' },
      { step: 'agent_commit', eventType: 'house.ceremony.commit' },
      { step: 'agent_reveal', eventType: 'house.ceremony.reveal' },
    ],
  };
  const traceMap = `${JSON.stringify(traceMapPayload, null, 2)}\n`;
  const entrySkill = [
    manualSkill.trimEnd(),
    '',
    '## Internal Pack Files',
    '',
    '- manual/skill.md',
    '- heartbeat.md',
    '- tools.md',
    '- trace_map.json',
    '',
  ].join('\n');

  const fileBodies = {
    'skill.md': entrySkill,
    'SKILL.md': entrySkill,
    'manual/skill.md': manualSkill,
    'heartbeat.md': heartbeat,
    'tools.md': tools,
    'trace_map.json': traceMap,
  };
  const fileHashes = {
    'manual/skill.md': sha256PrefixedHex(fileBodies['manual/skill.md']),
    'heartbeat.md': sha256PrefixedHex(fileBodies['heartbeat.md']),
    'tools.md': sha256PrefixedHex(fileBodies['tools.md']),
    'trace_map.json': sha256PrefixedHex(fileBodies['trace_map.json']),
  };
  const manifestSeed = JSON.stringify({
    sourceRefs: [{ path: '/skill.md', hash: fileHashes['manual/skill.md'] }],
    fileHashes,
  });
  const contentHash = sha256PrefixedHex(manifestSeed);
  const packVersionId = `packv_${contentHash.slice('sha256:'.length, 'sha256:'.length + 16)}`;

  return {
    manifest: {
      experienceId: 'agent_town_coop_v1',
      packId: 'pack_portal_onboarding_v1',
      packVersionId,
      contentHash,
      sourceRefs: [
        {
          path: '/skill.md',
          hash: fileHashes['manual/skill.md'],
        },
      ],
      fileHashes,
      entryUrl: `${DEFAULT_SKILL_PACK_BASE_PATH}/skill.md`,
      files: {
        'manual/skill.md': `${DEFAULT_SKILL_PACK_BASE_PATH}/manual/skill.md`,
        'heartbeat.md': `${DEFAULT_SKILL_PACK_BASE_PATH}/heartbeat.md`,
        'tools.md': `${DEFAULT_SKILL_PACK_BASE_PATH}/tools.md`,
        'trace_map.json': `${DEFAULT_SKILL_PACK_BASE_PATH}/trace_map.json`,
      },
    },
    fileBodies,
  };
}

function buildHouseLibraryCompiledSkillPack() {
  const specializedSkills = [
    'House Librarian',
    'Archive Clerk',
    'Workshop Scribe',
    'Registry Curator',
  ];
  const rules = [
    '---',
    'name: house-library-rules',
    'description: Ground rules for House Library, Workshop, Archive, and Registry behavior.',
    'version: 1',
    '---',
    '',
    '# House Library Rules',
    '',
    '- Prefer explicit user scope over speculative retrieval.',
    '- Treat unscoped private Library items as out of scope.',
    '- Archive remains factual and append-only.',
    '- Workshop edits require diff visibility and approval before persistent writes.',
    '- Registry publishing is always explicit and opt-in.',
    '',
  ].join('\n');
  const routerSkill = [
    '---',
    'name: house-library-router',
    'description: Pick one House Library skill before taking action.',
    'version: 1',
    '---',
    '',
    '# House Library Router',
    '',
    'Use exactly one specialized skill before acting:',
    '',
    '- [House Librarian](./skills/librarian/skill.md)',
    '- [Archive Clerk](./skills/archive-clerk/skill.md)',
    '- [Workshop Scribe](./skills/workshop-scribe/skill.md)',
    '- [Registry Curator](./skills/registry-curator/skill.md)',
    '- [Rules](./rules.md)',
    '',
    'If the request is private memory or scope management, default to House Librarian.',
    'If the request is about file reads/edits/diffs, choose Workshop Scribe.',
    'If the request is about traces, runs, or trainer outputs, choose Archive Clerk.',
    'If the request is about publishing or importing public artifacts, choose Registry Curator.',
    '',
  ].join('\n');
  const librarianSkill = [
    '---',
    'name: House Librarian',
    'description: Manage curated Library items, explicit scope, and saved notes for the current house team.',
    'version: 1',
    '---',
    '',
    '# House Librarian',
    '',
    'Use this skill when the user wants to find something, save a note, or control what the agent may use in chat.',
    '',
    'Preferred tool family:',
    '',
    '- `house_library_list_items`',
    '- `house_library_update_item`',
    '- `house_library_read_revisions`',
    '- `house_library_read_scope`',
    '- `house_library_set_scope`',
    '- `house_library_create_item`',
    '- `house_library_capture_conversation`',
    '- `house_library_list_shelves`',
    '- `house_library_write_shelf`',
    '',
    'Rules:',
    '',
    '- Prefer explicit selection over guessing.',
    '- Never claim an item is in scope unless the active scope set confirms it.',
    '- If multiple items could match, show the choices instead of silently deciding.',
    '',
  ].join('\n');
  const archiveClerkSkill = [
    '---',
    'name: Archive Clerk',
    'description: Inspect archive truth and trainer-derived provenance before anything is promoted into Library.',
    'version: 1',
    '---',
    '',
    '# Archive Clerk',
    '',
    'Use this skill for questions like "what happened", trace inspection, or promoting trace/trainer truth into Library.',
    '',
    'Rules:',
    '',
    '- Archive is factual and append-only.',
    '- Derived summaries must preserve trace or trainer refs.',
    '- If information is sealed or redacted, say so plainly.',
    '',
  ].join('\n');
  const workshopScribeSkill = [
    '---',
    'name: Workshop Scribe',
    'description: Read files, prepare diffable edits, and use approval-gated Workshop writes inside the House shell.',
    'version: 1',
    '---',
    '',
    '# Workshop Scribe',
    '',
    'Use this skill when the user wants to browse, edit, diff, or snapshot files in Workshop.',
    '',
    'Preferred tool family:',
    '',
    '- `workspace_list`',
    '- `workspace_read_file`',
    '- `workspace_edit_file`',
    '- `workspace_write_file`',
    '',
    'Rules:',
    '',
    '- Editing happens in Workshop, not in Library.',
    '- Show the diff preview before asking for a persistent write.',
    '- Never perform persistent writes without approval.',
    '',
  ].join('\n');
  const registryCuratorSkill = [
    '---',
    'name: Registry Curator',
    'description: Publish or import Library artifacts with provenance, visibility, and trust labels preserved.',
    'version: 1',
    '---',
    '',
    '# Registry Curator',
    '',
    'Use this skill when the user explicitly wants to publish or import public artifacts.',
    '',
    'Preferred tool family:',
    '',
    '- `house_library_search_public_stacks`',
    '- `house_library_preview_registry_artifact`',
    '',
    'Rules:',
    '',
    '- Search and preview Public Stacks before asking for import confirmation.',
    '- Publishing is opt-in and private by default.',
    '- Imported artifacts must keep source refs and trust labels.',
    '- Do not auto-trust public artifacts merely because they exist.',
    '',
  ].join('\n');

  const fileBodies = {
    'skill.md': routerSkill,
    'rules.md': rules,
    'skills/librarian/skill.md': librarianSkill,
    'skills/archive-clerk/skill.md': archiveClerkSkill,
    'skills/workshop-scribe/skill.md': workshopScribeSkill,
    'skills/registry-curator/skill.md': registryCuratorSkill,
  };
  const fileHashes = Object.fromEntries(
    Object.entries(fileBodies).map(([filePath, body]) => [filePath, sha256PrefixedHex(body)])
  );
  const manifestSeed = JSON.stringify({
    sourceRefs: [{ path: `${HOUSE_LIBRARY_SKILL_PACK_BASE_PATH}/skill.md`, hash: fileHashes['skill.md'] }],
    fileHashes,
    specializedSkills,
  });
  const contentHash = sha256PrefixedHex(manifestSeed);
  const packVersionId = `packv_${contentHash.slice('sha256:'.length, 'sha256:'.length + 16)}`;

  return {
    manifest: {
      experienceId: 'house_library_v1',
      packId: 'pack_house_library_v1',
      packVersionId,
      contentHash,
      sourceRefs: [
        {
          path: `${HOUSE_LIBRARY_SKILL_PACK_BASE_PATH}/skill.md`,
          hash: fileHashes['skill.md'],
        },
      ],
      specializedSkills,
      fileHashes,
      entryUrl: `${HOUSE_LIBRARY_SKILL_PACK_BASE_PATH}/skill.md`,
      files: {
        'skill.md': `${HOUSE_LIBRARY_SKILL_PACK_BASE_PATH}/skill.md`,
        'rules.md': `${HOUSE_LIBRARY_SKILL_PACK_BASE_PATH}/rules.md`,
        'skills/librarian/skill.md': `${HOUSE_LIBRARY_SKILL_PACK_BASE_PATH}/skills/librarian/skill.md`,
        'skills/archive-clerk/skill.md': `${HOUSE_LIBRARY_SKILL_PACK_BASE_PATH}/skills/archive-clerk/skill.md`,
        'skills/workshop-scribe/skill.md': `${HOUSE_LIBRARY_SKILL_PACK_BASE_PATH}/skills/workshop-scribe/skill.md`,
        'skills/registry-curator/skill.md': `${HOUSE_LIBRARY_SKILL_PACK_BASE_PATH}/skills/registry-curator/skill.md`,
      },
    },
    fileBodies,
  };
}

function verifyHouseAuth(req, house) {
  if (!house || !house.authKey) return { ok: false, error: 'HOUSE_AUTH_REQUIRED' };
  const ts = req.header('x-house-ts');
  const auth = req.header('x-house-auth');
  if (!ts || !auth) return { ok: false, error: 'HOUSE_AUTH_REQUIRED' };
  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) return { ok: false, error: 'HOUSE_AUTH_INVALID' };
  const skew = Math.abs(Date.now() - tsNum);
  if (skew > HOUSE_AUTH_SKEW_MS) return { ok: false, error: 'HOUSE_AUTH_EXPIRED' };
  const key = decodeB64(house.authKey);
  if (!key || key.length < 16) return { ok: false, error: 'HOUSE_AUTH_INVALID' };
  const bodyHash = sha256Base64(req.rawBody || '');
  const msg = `${house.id}.${ts}.${req.method.toUpperCase()}.${req.path}.${bodyHash}`;
  const expected = crypto.createHmac('sha256', key).update(msg).digest('base64');
  const a = Buffer.from(expected, 'base64');
  const b = Buffer.from(auth, 'base64');
  if (a.length !== b.length) return { ok: false, error: 'HOUSE_AUTH_INVALID' };
  if (!crypto.timingSafeEqual(a, b)) return { ok: false, error: 'HOUSE_AUTH_INVALID' };
  return { ok: true };
}

// --- API ---
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: nowIso() });
});

app.get('/api/session', (req, res) => {
  const s = ensureHumanSession(req, res);
  const store = readStore();
  const onboarding = ensureSessionOnboarding(s);
  res.json({
    ok: true,
    teamCode: s.teamCode,
    walletRecoveryKey: normalizeWalletRecoveryKeyInput(s.walletRecoveryKey) || null,
    elements: listElements(),
    onboarding: cloneOnboarding(onboarding),
    featureFlags: {
      trainerNamespace: ENABLE_TRAINER_NAMESPACE
    },
    stats: {
      signups: store.signups.length,
      publicTeams: store.publicTeams.length
    }
  });
});

function resolveSessionPlatformContext(session) {
  const houseId = typeof session?.houseCeremony?.houseId === 'string'
    ? session.houseCeremony.houseId.trim()
    : '';
  const availableTeamIds = houseId ? listHouseTeamIds(houseId) : [];
  let activeTeamId = typeof session?.activeTeamId === 'string' ? session.activeTeamId.trim() : '';
  if (activeTeamId && availableTeamIds.length && !availableTeamIds.includes(activeTeamId)) {
    activeTeamId = '';
  }
  if (!activeTeamId && availableTeamIds.length) {
    activeTeamId = availableTeamIds[0];
  }
  if (session && typeof session === 'object') {
    session.activeTeamId = activeTeamId;
  }
  return {
    houseId: houseId || null,
    activeTeamId: activeTeamId || null,
    availableTeamIds,
  };
}

function buildPlatformContextResponse(session, overrides = {}) {
  const context = resolveSessionPlatformContext(session);
  if (overrides && typeof overrides === 'object') {
    if (Object.prototype.hasOwnProperty.call(overrides, 'houseId')) {
      context.houseId = overrides.houseId || null;
    }
    if (Object.prototype.hasOwnProperty.call(overrides, 'activeTeamId')) {
      context.activeTeamId = overrides.activeTeamId || null;
    }
    if (Array.isArray(overrides.availableTeamIds)) {
      context.availableTeamIds = overrides.availableTeamIds.map((item) => String(item || '').trim()).filter(Boolean);
    }
  }
  return {
    houseId: context.houseId,
    activeTeamId: context.activeTeamId,
    availableTeamIds: context.availableTeamIds,
  };
}

registerPlatformReadRoutes(app, {
  addLibraryShelfItem,
  express,
  buildDefaultCompiledSkillPack,
  buildHouseLibraryCompiledSkillPack,
  buildPlatformContextResponse,
  buildPlatformTrainerResultPayload,
  buildPortalRequestId,
  createConversationArtifact,
  createLibraryItem,
  createLibraryItemRevision,
  createLibraryLink,
  createLibraryPeerReceipt,
  createLibraryPeerRelay,
  createLibraryPublicStack,
  createLibraryPublicStackAttestation,
  createLibraryPublicStackAttestationProvenance,
  createLibraryPublicStackAttestationVerificationReceipt,
  createLibraryRouteSubscription,
  createLibraryRouteSyncReceipt,
  createLibraryPublicStackMember,
  createLibraryPublicStackReview,
  createLibraryPublicStackSafetyRecord,
  createLibraryPublicStackVerification,
  createLibraryPublicStackVerificationMember,
  createLibrarySatchelReceipt,
  createLibrarySatchelRelay,
  createLibraryShelf,
  createLibraryPublication,
  createSealedContextViolation,
  createScopeSet,
  createTrainerJob,
  createTrainerResult,
  getConfigVersion,
  getConfigVersionByIdempotency,
  getConversationArtifactByIdempotency,
  getLibraryItemById,
  getLibraryItemByIdempotency,
  getLibraryPeerRelayById,
  getLibraryPeerRelayByIdempotency,
  getLibraryPublicationById,
  getLibraryPublicStackById,
  getLibraryPublicStackByIdempotency,
  getLibraryPublicStackAttestation,
  getLibraryPublicStackAttestationById,
  getLibraryPublicStackAttestationByIdempotency,
  getLibraryPublicStackAttestationProvenance,
  getLibraryPublicStackAttestationProvenanceById,
  getLibraryPublicStackAttestationProvenanceByIdempotency,
  getLibraryPublicStackAttestationVerificationReceipt,
  getLibraryPublicStackAttestationVerificationReceiptById,
  getLibraryPublicStackAttestationVerificationReceiptByIdempotency,
  getLibraryRouteSubscriptionById,
  getLibraryRouteSubscriptionByIdempotency,
  getLibraryRouteSyncReceiptById,
  getLibraryRouteSyncReceiptByIdempotency,
  getLibraryPublicStackReview,
  getLibraryPublicStackReviewByIdempotency,
  getLibraryPublicStackSafetyRecord,
  getLibraryPublicStackSafetyRecordByIdempotency,
  getLibraryPublicStackVerificationById,
  getLibraryPublicStackVerificationByIdempotency,
  getLatestLibraryPublicStackVerification,
  getLibrarySatchelRelayById,
  getLibrarySatchelRelayByIdempotency,
  getLibraryPublicationByIdempotency,
  getLibraryShelfById,
  getLibraryShelfByIdempotency,
  getRegistryEntityById,
  getRegistryProofByRegistryId,
  getSealedContextById,
  getScopeSetById,
  getScopeSetByIdempotency,
  getUnifiedPlatformPromptPreview,
  getUnifiedPlatformRegistryPreviewSnapshot,
  getUnifiedPlatformTestFixture,
  listConversationArtifacts,
  getTeamConfigBinding,
  listTrackDefinitions,
  listTrackProgressEvents,
  listLibraryItems,
  listLibraryItemRevisions,
  listLibraryLinks,
  listLibraryPeerReceipts,
  listLibraryPeerRelays,
  listLibraryRouteSubscriptions,
  listLibraryRouteSyncReceipts,
  listLibraryPublicStackAttestations,
  listLibraryPublicStackAttestationProvenance,
  listLibraryPublicStackAttestationVerificationReceipts,
  listLibraryPublicStackMembers,
  listLibraryPublicStackReviews,
  listLibraryPublicStackSafetyRecords,
  listLibraryPublicStacks,
  listLibraryPublicStackVerificationMembers,
  listLibraryPublicStackVerifications,
  listLibrarySatchelRelays,
  listLibrarySatchelReceipts,
  listLibraryPublications,
  listLibraryShelfItems,
  listLibraryShelves,
  listScopeSetItems,
  listScopeSets,
  getTrainerJobById,
  getTrainerJobByIdempotency,
  getTrainerResultById,
  getTrainerResultByJobId,
  listConfigComponentVersions,
  listPlatformExperienceDefinitions,
  listRuns,
  listTraceEvents,
  listTrainerJobs,
  listTrainerResults,
  normalizePlatformTrainerBudget,
  normalizePortalIdempotencyKey,
  nowIso,
  randomHex,
  removeLibraryShelfItem,
  replaceScopeSetItems,
  replaceConfigComponentVersions,
  dispatchLibraryPeerRelayEnvelope,
  dispatchLibrarySatchelRelayEnvelope,
  resolveApprovedLibraryPublicStackApproval,
  resolveApprovedLibraryPeerRelayApproval,
  resolveApprovedLibrarySatchelRelayApproval,
  resolveApprovedLibraryPublicationApproval,
  resolveApprovedTrainerPatchPromotion,
  resolveHumanSessionWithRecovery,
  resolvePlatformTrainerLinkedConfigVersionId,
  resolveSessionPlatformContext,
  resolveKnownHouseTarget,
  searchRegistryFamilyGroups,
  sendPortalApiError,
  sendPortalApiSuccess,
  setUnifiedPlatformBenchmarkSnapshot,
  setUnifiedPlatformRegistryPreviewSnapshot,
  setUnifiedPlatformPromptPreview,
  updateLibraryPublicStackReview,
  updateLibraryPublicStackSafetyRecord,
  updateLibraryPublicStackVerification,
  updateLibraryRouteSubscription,
  updateLibraryRouteSyncReceipt,
  sha256PrefixedHex,
  stableJsonStringify,
  updateLibraryPeerRelay,
  updateLibrarySatchelRelay,
  updateLibraryItem,
  updateTrainerJobStatus,
  updateTrainerResultLink,
  upsertConfigVersion,
  upsertTeamConfigBinding,
});

registerWebRoutes(app, {
  buildPortalRequestId,
  collectWalletSubjectsForSession,
  createApprovalRequest,
  createCredentialGrant,
  createEvidence,
  createImportJob,
  createInvocation,
  createWebSession,
  decideApproval,
  getActiveCredentialGrant,
  getApprovalById,
  getInvocationByIdempotency,
  getLatestCheckpointForSession,
  getWebActionPolicy,
  getWebSessionById,
  listApprovalsForSession,
  listCredentialStatusByOrigin,
  listEvidenceForSession,
  normalizePortalIdempotencyKey,
  normalizeWebAutonomyMode,
  normalizeWebRenderMode,
  proxyPolicyErrorCode,
  randomHex,
  requireBoundHumanSession,
  requireOwnedWebSession,
  resolveWebTarget,
  sendPortalApiError,
  sendPortalApiSuccess,
  sendProxyPolicyContractError,
  assertPortalContractTargetAllowed,
  setWebSessionRevisionAndState,
  touchCredentialGrant,
  writeCheckpoint,
});

registerRegistryRoutes(app, {
  assertPortalContractTargetAllowed,
  buildPortalRequestId,
  collectWalletSubjectsForSession,
  createRegistryClaimStart,
  createImportJob,
  getRegistryFamilyBySlug,
  getRegistryHealth,
  getRegistryEntityById,
  getRegistryProofByRegistryId,
  getRegistryReviewQueue,
  invalidateAtlasStoreCaches,
  normalizePortalIdempotencyKey,
  proxyPolicyErrorCode,
  requireBoundHumanSession,
  searchRegistryFamilyGroups,
  searchRegistryEntities,
  sendPortalApiError,
  sendPortalApiSuccess,
  sendProxyPolicyContractError,
});

registerRegistryWebPokerTestRoutes(app, {
  getRegistryWebPokerTestFixture,
  getRegistryWebPokerTestStats,
  listRegistryWebPokerFixtureFamilies,
});

registerPlatformV1Routes(app, {
  PLATFORM_CONFIG_STATUSES,
  PLATFORM_IMMUTABLE_CONFIG_STATUSES,
  PLATFORM_RUN_ELIGIBLE_CONFIG_STATUSES,
  PLATFORM_RUN_ENTRY_MODES,
  PLATFORM_TRACE_AUTHORITY_TYPE,
  PLATFORM_TRAINER_JOB_KINDS,
  SUPPORTED_PLATFORM_EXPERIENCE_IDS,
  ensurePlatformExperiencePinnedConfig,
  getPlatformExperienceDefinition,
  allowedReaderIdsFromSealedContext,
  assertPortalContractTargetAllowed,
  buildCompiledIntegrationPack,
  buildPlatformIntegrationExecutionResult,
  buildPlatformTrainerResultPayload,
  buildPortalRequestId,
  buildSeededSealedContextRecord,
  createIntegrationCandidate,
  createIntegrationExecution,
  createIntegrationPackVersion,
  createRun,
  createSealedContextViolation,
  createTraceEvent,
  createTraceIntakeRecord,
  createTrainerJob,
  createTrainerResult,
  countTrackProgressEventsByDedupe,
  decodeTraceCursor,
  deriveDeterministicSealId,
  encodeTraceCursor,
  express,
  getConfigVersion,
  getConfigVersionByIdempotency,
  getIntegrationCandidateById,
  getIntegrationCandidateByIdempotency,
  getIntegrationExecutionByIdempotency,
  getIntegrationPackVersionByIdempotency,
  getLatestTraceEvent,
  getUnifiedPlatformTestFixture,
  getPlatformIntegrationActionPolicy,
  getRunById,
  getRunByIdempotency,
  getRunByTraceId,
  getSealedContextById,
  getTeamConfigBinding,
  getTrackDefinition,
  getTraceIntakeRecord,
  getTrainerJobById,
  getTrainerJobByIdempotency,
  getTrainerResultById,
  getTrainerResultByJobId,
  hasPlatformTrainerTargets,
  listConfigComponentVersions,
  listPlatformExperienceDefinitions,
  listTraceEvents,
  normalizePlatformTrainerBudget,
  normalizePortalIdempotencyKey,
  nowIso,
  parsePokerOperatorFixtureRecords,
  randomHex,
  readStore,
  replaceConfigComponentVersions,
  resolveApprovedTrainerPatchPromotion,
  resolveHouseAddress,
  resolveHumanSessionWithRecovery,
  resolvePlatformConfigComponents,
  resolvePlatformTrainerLinkedConfigVersionId,
  resolveSessionPlatformContext,
  resolveWebTarget,
  sendPortalApiError,
  sendPortalApiSuccess,
  sendProxyPolicyContractError,
  sha256PrefixedHex,
  stableJsonStringify,
  createTrackProgressEvent,
  updateRunMetadata,
  updateRunStatus,
  updateSealedContextStatus,
  updateTrainerJobStatus,
  updateTrainerResultLink,
  upsertConfigVersion,
  upsertSealedContext,
  upsertTeamConfigBinding,
  verifyHouseAuth,
});

registerPokerRoutes(app, {
  buildPortalRequestId,
  computePokerArtifactSha256,
  createPortalPokerOperatorClient,
  express,
  getLatestPokerLeaderboardSnapshot,
  getPokerOperatorServiceToken,
  getPokerReplayArtifactByRunId,
  getPokerRunById,
  getPokerSeasonById,
  getPokerSubmissionById,
  getPokerSubmissionByRequest,
  getPokerBatchById,
  listPokerSeasons,
  listPokerLeaderboardSnapshots,
  normalizePortalIdempotencyKey,
  nowIso,
  randomHex,
  requireBoundHumanSession,
  resolvePrimaryWalletSubject,
  respondPokerOperatorTransport,
  sendPortalApiError,
  sendPortalApiSuccess,
  sha256PrefixedHex,
  summarizeMirroredPokerSeason,
  syncPokerMirrorFromOperator,
  upsertPokerLeaderboardSnapshot,
  upsertPokerSeason,
  upsertPokerSubmission,
});

// Rotates the human session cookie to a fresh session/team code.
// Useful for shared devices where multiple people onboard sequentially.
app.post('/api/session/reset', (req, res) => {
  const current = resolveHumanSessionWithRecovery(req, res, { allowCreate: false });
  if (current?.sessionId) {
    deleteSessionById(current.sessionId);
  }
  // Ensure we still have a valid response cookie context (Secure flag in prod).
  const store = readStore();
  const next = createSession();
  const onboarding = ensureSessionOnboarding(next);
  const secureFlag = isProd ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `et_session=${encodeURIComponent(next.sessionId)}; Path=/; SameSite=Lax; HttpOnly${secureFlag}`
  );
  res.json({
    ok: true,
    teamCode: next.teamCode,
    walletRecoveryKey: normalizeWalletRecoveryKeyInput(next.walletRecoveryKey) || null,
    elements: listElements(),
    onboarding: cloneOnboarding(onboarding),
    stats: {
      signups: store.signups.length,
      publicTeams: store.publicTeams.length
    }
  });
});

app.get('/api/state', (req, res) => {
  const s = ensureHumanSession(req, res);
  const lite = ensureLiteState(s);
  updateLiteRuntimeReady(s);
  const onboarding = ensureSessionOnboarding(s);
  const ceremony = buildCeremonyStateSnapshot(s);
  const experience = buildExperienceStateSnapshot(s, ceremony);
  const platform = buildPlatformContextResponse(s, { houseId: ceremony.houseId || null });
  res.json({
    ok: true,
    teamCode: s.teamCode,
    activeTeamId: platform.activeTeamId,
    availableTeamIds: platform.availableTeamIds,
    walletRecoveryKey: normalizeWalletRecoveryKeyInput(s.walletRecoveryKey) || null,
    elements: listElements(),
    agent: {
      connected: s.agent.connected,
      source: s.agent.source || null,
      name: s.agent.name,
      selected: s.agent.selected,
      openPressed: s.agent.openPressed,
      optIn: s.agent.optIn,
      posts: s.agent.posts
    },
    human: {
      selected: s.human.selected,
      openPressed: s.human.openPressed,
      optIn: s.human.optIn,
      xPostUrl: s.human.xPostUrl
    },
    match: s.match,
    signup: s.signup,
    hatch: {
      complete: !!s.hatch?.complete,
      createdAt: s.hatch?.createdAt || null,
      agentKind: s.hatch?.agentKind || null
    },
    lite: {
      driver: lite.driver,
      runtimeReady: !!lite.runtimeReady,
      llmConfigured: !!lite.llmConfigured,
      runtimeVersion: lite.runtimeVersion || null,
      lastError: typeof lite.lastError === 'string' && lite.lastError ? lite.lastError : null
    },
    ceremony,
    experience,
    share: s.share,
    shareApproval: s.shareApproval || { human: false, agent: false },
    houseId: ceremony.houseId,
    platform,
    onboarding: cloneOnboarding(onboarding)
  });
});

app.post('/api/hatch/complete', (req, res) => {
  const s = ensureHumanSession(req, res);
  const lite = ensureLiteState(s);
  s.hatch = s.hatch || { complete: false, createdAt: null, agentKind: null };
  s.hatch.complete = true;
  s.hatch.createdAt = s.hatch.createdAt || nowIso();
  s.hatch.agentKind = 'openclaw-lite';
  lite.lastError = null;
  lite.runtimeBooted = false;
  lite.runtimeVersion = null;
  s.agent.connected = false;
  s.agent.source = null;
  s.agent.name = s.agent.name || 'OpenClaw Lite';
  s.shareApproval = s.shareApproval || { human: false, agent: false };
  s.shareApproval.agent = false;
  updateLiteRuntimeReady(s);

  res.json({
    ok: true,
    hatch: s.hatch,
    agent: {
      connected: s.agent.connected,
      source: s.agent.source,
      name: s.agent.name
    },
    lite: {
      driver: lite.driver,
      runtimeReady: !!lite.runtimeReady,
      llmConfigured: !!lite.llmConfigured
    }
  });
});

app.post('/api/agent/lite/connect', (req, res) => {
  const s = ensureHumanSession(req, res);
  ensureLiteState(s);
  s.agent.connected = true;
  s.agent.source = 'openclaw-lite';
  s.agent.name = s.agent.name || 'OpenClaw Lite';
  s.shareApproval = s.shareApproval || { human: false, agent: false };
  s.shareApproval.agent = true;
  updateLiteRuntimeReady(s);
  res.json({ ok: true });
});

app.get('/api/agent/lite/runtime', (req, res) => {
  const s = ensureHumanSession(req, res);
  const lite = ensureLiteState(s);
  updateLiteRuntimeReady(s);
  const origin = `${req.protocol}://${req.get('host')}`;
  res.json({
    ok: true,
    teamCode: s.teamCode,
    origin,
    runtimeVersion: VENDOR_LITE_MANIFEST.vendorVersion,
    driver: lite.driver,
    featureFlags: {
      llmConfigRequired: true,
      trainerNamespace: ENABLE_TRAINER_NAMESPACE
    }
  });
});

app.post('/api/agent/lite/runtime/boot', (req, res) => {
  const s = ensureHumanSession(req, res);
  markLiteRuntimeBooted(s);
  const lite = ensureLiteState(s);
  res.json({
    ok: true,
    lite: {
      driver: lite.driver,
      runtimeReady: !!lite.runtimeReady,
      runtimeVersion: lite.runtimeVersion || null,
      lastError: lite.lastError || null
    }
  });
});

app.post('/api/agent/lite/runtime/error', (req, res) => {
  const s = ensureHumanSession(req, res);
  const reason = typeof req.body?.error === 'string' ? req.body.error.trim() : '';
  if (!reason) return res.status(400).json({ ok: false, error: 'MISSING_ERROR' });
  markLiteRuntimeError(s, reason);
  const lite = ensureLiteState(s);
  res.json({
    ok: true,
    lite: {
      runtimeReady: !!lite.runtimeReady,
      lastError: lite.lastError || null
    }
  });
});

app.post('/api/agent/lite/llm/oauth/openai-codex/start', async (req, res) => {
  const s = ensureHumanSession(req, res);
  cleanupOpenAiCodexOAuthAttempts();

  const callbackServer = await ensureOpenAiCodexOAuthCallbackServer().catch(() => ({
    ready: false,
    error: 'CALLBACK_SERVER_FAILED',
    host: OPENAI_CODEX_OAUTH_CALLBACK_HOST,
    port: OPENAI_CODEX_OAUTH_CALLBACK_PORT
  }));

  const manualCallbackOnly = callbackServer.ready !== true && String(callbackServer?.error || '') === 'EADDRINUSE';

  if (!callbackServer.ready && !manualCallbackOnly) {
    return res.status(503).json({
      ok: false,
      error: 'CALLBACK_SERVER_UNAVAILABLE',
      callbackServer
    });
  }

  const { verifier, challenge } = createOpenAiCodexPkce();
  const state = createOpenAiCodexOAuthState();
  const attemptId = `ocx_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  const createdAtMs = Date.now();
  const originatorRaw = typeof req.body?.originator === 'string' ? req.body.originator.trim() : '';
  const originator = /^[a-z0-9_-]{1,48}$/i.test(originatorRaw) ? originatorRaw : 'portal-claw-lite';

  const authUrl = new URL(OPENAI_CODEX_OAUTH_AUTHORIZE_URL);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', OPENAI_CODEX_OAUTH_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', OPENAI_CODEX_OAUTH_REDIRECT_URI);
  authUrl.searchParams.set('scope', OPENAI_CODEX_OAUTH_SCOPE);
  authUrl.searchParams.set('code_challenge', challenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('id_token_add_organizations', 'true');
  authUrl.searchParams.set('codex_cli_simplified_flow', 'true');
  authUrl.searchParams.set('originator', originator);

  registerOpenAiCodexOAuthAttempt({
    id: attemptId,
    state,
    verifier,
    redirectUri: OPENAI_CODEX_OAUTH_REDIRECT_URI,
    createdAtMs,
    expiresAtMs: createdAtMs + OPENAI_CODEX_OAUTH_ATTEMPT_TTL_MS,
    sessionId: s.sessionId,
    teamCode: s.teamCode,
    status: 'pending',
    code: '',
    lastError: '',
    codeReceivedAtMs: 0,
    exchangedAtMs: 0,
    credential: null
  });

  res.json({
    ok: true,
    attemptId,
    state,
    authorizeUrl: authUrl.toString(),
    redirectUri: OPENAI_CODEX_OAUTH_REDIRECT_URI,
    expiresAtMs: createdAtMs + OPENAI_CODEX_OAUTH_ATTEMPT_TTL_MS,
    callbackServer: {
      ...callbackServer,
      manualOnly: manualCallbackOnly
    }
  });
});

app.get('/api/agent/lite/llm/oauth/openai-codex/status', (req, res) => {
  const s = ensureHumanSession(req, res);
  cleanupOpenAiCodexOAuthAttempts();
  const attemptId = typeof req.query?.attemptId === 'string' ? req.query.attemptId.trim() : '';
  if (!attemptId) return res.status(400).json({ ok: false, error: 'MISSING_ATTEMPT_ID' });
  const attempt = openAiCodexOAuthAttemptsById.get(attemptId);
  if (!attempt) return res.status(404).json({ ok: false, error: 'OAUTH_ATTEMPT_NOT_FOUND' });
  if (attempt.sessionId !== s.sessionId) return res.status(403).json({ ok: false, error: 'OAUTH_ATTEMPT_FORBIDDEN' });
  return res.json({
    ok: true,
    attempt: openAiCodexOAuthAttemptSummary(attempt),
    callbackServer: { ...openAiCodexOAuthCallbackServerState }
  });
});

app.post('/api/agent/lite/llm/oauth/openai-codex/exchange', async (req, res) => {
  const s = ensureHumanSession(req, res);
  cleanupOpenAiCodexOAuthAttempts();

  const callbackInput = typeof req.body?.callbackInput === 'string' ? req.body.callbackInput.trim() : '';
  const parsed = callbackInput ? parseOpenAiCodexAuthorizationInput(callbackInput) : {};
  const requestedAttemptId = typeof req.body?.attemptId === 'string' ? req.body.attemptId.trim() : '';

  let attempt = requestedAttemptId ? openAiCodexOAuthAttemptsById.get(requestedAttemptId) : null;
  if (attempt && attempt.sessionId !== s.sessionId) {
    return res.status(403).json({ ok: false, error: 'OAUTH_ATTEMPT_FORBIDDEN' });
  }

  // Prefer callback state when available so pasted callback URLs still work
  // even if the UI currently points at a stale/replaced attempt id.
  const parsedState = typeof parsed.state === 'string' ? parsed.state.trim() : '';
  if (parsedState) {
    const stateAttemptId = openAiCodexOAuthAttemptsByState.get(parsedState);
    const stateAttempt = stateAttemptId ? openAiCodexOAuthAttemptsById.get(stateAttemptId) : null;
    if (stateAttempt) {
      if (stateAttempt.sessionId !== s.sessionId) {
        return res.status(403).json({ ok: false, error: 'OAUTH_ATTEMPT_FORBIDDEN' });
      }
      attempt = stateAttempt;
    } else if (attempt && parsedState !== String(attempt.state || '').trim() && !attempt.code) {
      attempt.status = 'failed';
      attempt.lastError = 'STATE_MISMATCH';
      return res.status(400).json({
        ok: false,
        error: 'STATE_MISMATCH',
        attempt: openAiCodexOAuthAttemptSummary(attempt)
      });
    } else if (!attempt) {
      return res.status(400).json({ ok: false, error: 'STATE_MISMATCH' });
    }
  }

  if (!attempt) {
    if (!requestedAttemptId) return res.status(400).json({ ok: false, error: 'MISSING_ATTEMPT_ID' });
    return res.status(404).json({ ok: false, error: 'OAUTH_ATTEMPT_NOT_FOUND' });
  }

  if (callbackInput) {
    if (parsed.state && String(parsed.state || '').trim() !== String(attempt.state || '').trim() && !attempt.code) {
      attempt.status = 'failed';
      attempt.lastError = 'STATE_MISMATCH';
      return res.status(400).json({
        ok: false,
        error: 'STATE_MISMATCH',
        attempt: openAiCodexOAuthAttemptSummary(attempt)
      });
    }
    if (parsed.error) {
      attempt.status = 'failed';
      attempt.lastError = parsed.errorDescription || parsed.error;
      return res.status(400).json({ ok: false, error: parsed.error });
    }
    if (parsed.code) {
      attempt.code = parsed.code;
      attempt.status = 'code_received';
      attempt.codeReceivedAtMs = Date.now();
      attempt.lastError = '';
    }
  }

  if (!attempt.code) {
    return res.status(409).json({
      ok: false,
      error: 'CODE_PENDING',
      attempt: openAiCodexOAuthAttemptSummary(attempt)
    });
  }

  if (attempt.credential && attempt.status === 'exchanged') {
    return res.json({
      ok: true,
      credential: attempt.credential,
      oauthProfile: attempt.credential,
      attempt: openAiCodexOAuthAttemptSummary(attempt)
    });
  }

  const exchanged = await exchangeOpenAiCodexAuthorizationCode({
    code: attempt.code,
    verifier: attempt.verifier,
    redirectUri: attempt.redirectUri || OPENAI_CODEX_OAUTH_REDIRECT_URI
  });

  if (!exchanged.ok) {
    attempt.status = 'failed';
    attempt.lastError = exchanged.message || exchanged.error || 'TOKEN_EXCHANGE_FAILED';
    return res.status(502).json({
      ok: false,
      error: exchanged.error || 'TOKEN_EXCHANGE_FAILED',
      message: exchanged.message || '',
      attempt: openAiCodexOAuthAttemptSummary(attempt)
    });
  }

  const accountId = extractOpenAiCodexAccountId(exchanged.accessToken);
  if (!accountId) {
    attempt.status = 'failed';
    attempt.lastError = 'ACCOUNT_ID_MISSING';
    return res.status(400).json({
      ok: false,
      error: 'ACCOUNT_ID_MISSING',
      message: 'Failed to extract accountId from access token.'
    });
  }

  attempt.status = 'exchanged';
  attempt.exchangedAtMs = Date.now();
  attempt.lastError = '';
  attempt.credential = {
    provider: 'openai-codex',
    access: exchanged.accessToken,
    refresh: exchanged.refreshToken,
    expires: exchanged.expiresAtMs,
    accountId
  };
  attempt.code = '';
  attempt.verifier = '';

  return res.json({
    ok: true,
    credential: attempt.credential,
    oauthProfile: attempt.credential,
    attempt: openAiCodexOAuthAttemptSummary(attempt)
  });
});

app.get('/api/agent/lite/llm/config', (req, res) => {
  const s = ensureHumanSession(req, res);
  const lite = ensureLiteState(s);
  updateLiteRuntimeReady(s);
  res.json({
    ok: true,
    configured: !!lite.llmConfigured
  });
});

app.post('/api/agent/lite/llm/config', (req, res) => {
  const s = ensureHumanSession(req, res);
  const lite = ensureLiteState(s);
  const onboarding = ensureSessionOnboarding(s);

  // Townhall gate: still enforced for Privy-enabled sessions (portal onboarding).
  // Skipped for: iterate page (referer), agent_solo sessions, non-Privy environments.
  const brainReferer = String(req.get('referer') || '').trim();
  const isFromIterate = brainReferer.includes('/iterate');
  const skipTownhallGate = isFromIterate || s.flow === 'agent_solo' || !PRIVY_ENABLED;
  if (!skipTownhallGate && onboarding.required === true && onboarding.registrationComplete !== true) {
    return res.status(409).json({
      ok: false,
      error: 'ONBOARDING_TOWNHALL_REQUIRED',
      message: 'Complete Town Hall registration before configuring brain.'
    });
  }

  // Only mark brain as configured for onboarding progression.
  // LLM details (provider, model, key) stay browser-local — never stored server-side.
  lite.llmConfigured = true;
  lite.llmConfiguredAt = nowIso();

  if (lite.runtimeBooted === true) {
    s.agent.connected = true;
    s.agent.source = 'openclaw-lite';
    s.agent.name = s.agent.name || 'OpenClaw Lite';
    s.shareApproval = s.shareApproval || { human: false, agent: false };
    s.shareApproval.agent = true;
  }

  updateLiteRuntimeReady(s);
  if (
    onboarding.required && onboarding.registrationComplete
    && onboarding.step !== ONBOARDING_STEP_CEREMONY
    && onboarding.step !== ONBOARDING_STEP_DONE
  ) {
    onboarding.step = ONBOARDING_STEP_SIGIL;
  }

  res.json({
    ok: true,
    configured: !!lite.llmConfigured
  });
});

app.delete('/api/agent/lite/llm/config', (req, res) => {
  const s = ensureHumanSession(req, res);
  const lite = ensureLiteState(s);

  lite.llmConfigured = false;
  lite.llmConfiguredAt = null;

  if (s.agent.source === 'openclaw-lite') {
    s.agent.connected = false;
    s.agent.source = null;
  }
  s.shareApproval = s.shareApproval || { human: false, agent: false };
  s.shareApproval.agent = s.agent.source === 'external';

  updateLiteRuntimeReady(s);

  res.json({
    ok: true,
    configured: false
  });
});

function normalizePrivyTransactionId(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizePrivyTransactionHash(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!/^0x[a-fA-F0-9]{64}$/.test(trimmed)) return null;
  return trimmed;
}

function normalizePrivyWalletId(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 256) return null;
  if (!/^[A-Za-z0-9._:-]+$/.test(trimmed)) return null;
  return trimmed;
}

function toRpcHexNumber(value) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0 || Math.floor(value) !== value) return null;
    return `0x${BigInt(value).toString(16)}`;
  }
  if (typeof value === 'bigint') {
    if (value < 0n) return null;
    return `0x${value.toString(16)}`;
  }
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^0x[0-9a-fA-F]+$/.test(trimmed)) return trimmed;
  if (/^[0-9]+$/.test(trimmed)) {
    try {
      return `0x${BigInt(trimmed).toString(16)}`;
    } catch {
      return null;
    }
  }
  return null;
}

function normalizePrivyCaip2(value, fallbackChainHex = null) {
  if (typeof value === 'string' && value.trim()) {
    const trimmed = value.trim();
    if (/^eip155:[0-9]+$/.test(trimmed)) return trimmed;
    throw new Error('INVALID_PRIVY_WALLET_RPC_CAIP2');
  }
  const chainHex = toRpcHexNumber(fallbackChainHex);
  if (!chainHex) return null;
  try {
    const chainId = BigInt(chainHex);
    if (chainId <= 0n) return null;
    return `eip155:${chainId.toString(10)}`;
  } catch {
    return null;
  }
}

function normalizePrivyWalletRpcEvmTx(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('INVALID_PRIVY_WALLET_RPC_TX');
  }
  const from = typeof input.from === 'string' ? input.from.trim() : '';
  const to = typeof input.to === 'string' ? input.to.trim() : '';
  const data = typeof input.data === 'string' ? input.data.trim() : '';
  if (!/^0x[a-fA-F0-9]{40}$/.test(from)) throw new Error('INVALID_PRIVY_WALLET_RPC_TX_FROM');
  if (!/^0x[a-fA-F0-9]{40}$/.test(to)) throw new Error('INVALID_PRIVY_WALLET_RPC_TX_TO');
  if (!/^0x[a-fA-F0-9]*$/.test(data) || data.length % 2 !== 0 || data.length < 2) {
    throw new Error('INVALID_PRIVY_WALLET_RPC_TX_DATA');
  }

  const out = { from, to, data };
  const optionalHexFields = [
    ['nonce', input.nonce],
    ['chain_id', input.chain_id != null ? input.chain_id : input.chainId],
    ['value', input.value],
    ['gas_limit', input.gas_limit != null ? input.gas_limit : input.gasLimit != null ? input.gasLimit : input.gas],
    ['gas_price', input.gas_price != null ? input.gas_price : input.gasPrice],
    ['max_fee_per_gas', input.max_fee_per_gas != null ? input.max_fee_per_gas : input.maxFeePerGas],
    ['max_priority_fee_per_gas', input.max_priority_fee_per_gas != null ? input.max_priority_fee_per_gas : input.maxPriorityFeePerGas]
  ];
  for (const [key, raw] of optionalHexFields) {
    const normalized = toRpcHexNumber(raw);
    if (normalized) out[key] = normalized;
  }

  if (input.type != null) {
    const typeHex = toRpcHexNumber(input.type);
    if (!typeHex) throw new Error('INVALID_PRIVY_WALLET_RPC_TX_TYPE');
    out.type = typeHex;
  }

  return out;
}

function normalizePortalIdempotencyKey(req) {
  const headerKey = typeof req.header('Idempotency-Key') === 'string'
    ? req.header('Idempotency-Key').trim()
    : '';
  const bodyKey = typeof req.body?.idempotencyKey === 'string'
    ? req.body.idempotencyKey.trim()
    : '';
  const value = headerKey || bodyKey;
  if (!value) return '';
  if (value.length > 200) return '';
  return value;
}

function collectWalletSubjectsForSession(session, req) {
  const seen = new Set();
  const out = [];
  const add = (chain, address, boundAt = null) => {
    const normalizedChain = normalizeWalletChainInput(chain);
    if (!normalizedChain) return;
    const normalizedAddress = normalizedChain === 'evm'
      ? normalizeEvmAddress(address)
      : normalizeWalletSessionSolanaAddress(address);
    if (!normalizedAddress) return;
    const key = `${normalizedChain}:${normalizedAddress}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({
      chain: normalizedChain,
      address: normalizedAddress,
      normalizedAddress,
      boundAt: boundAt || session?.createdAt || nowIso()
    });
  };

  for (const candidate of collectWalletCandidatesFromHeaders(req)) {
    add(candidate.chain, candidate.address, session?.createdAt || null);
  }
  for (const binding of Array.isArray(session?.walletBindings) ? session.walletBindings : []) {
    add(binding?.chain, binding?.address, binding?.boundAt || session?.createdAt || null);
  }
  add('solana', session?.token?.address, session?.signup?.createdAt || null);
  add(session?.claim?.erc8004?.claimChain, session?.claim?.erc8004?.address, session?.claim?.erc8004?.verifiedAt
    ? new Date(Number(session.claim.erc8004.verifiedAt)).toISOString()
    : null);
  return out;
}

function normalizeWebRenderMode(input, fallback = 'companion') {
  const value = typeof input === 'string' ? input.trim().toLowerCase() : '';
  if (value === 'embedded' || value === 'companion') return value;
  return fallback;
}

function normalizeWebAutonomyMode(input, fallback = 'assist') {
  const value = typeof input === 'string' ? input.trim().toLowerCase() : '';
  if (value === 'observe' || value === 'assist' || value === 'auto') return value;
  return fallback;
}

function inferWebPageClass(parsedUrl, sourceHints = {}) {
  const explicit = typeof sourceHints?.expectedPageClass === 'string'
    ? sourceHints.expectedPageClass.trim()
    : '';
  if (explicit) return explicit;
  const pathname = parsedUrl?.pathname || '';
  if (/^\/[^/]+\/[^/]+\/issues\/\d+/.test(pathname)) return 'issue_detail';
  return 'generic_page';
}

function resolveParseStubCandidate(targetUrl, { preferredMode = 'auto', sourceHints = {} } = {}) {
  const parseStubFamily = typeof sourceHints?.parseStubFamily === 'string'
    ? sourceHints.parseStubFamily.trim()
    : (
      sourceHints?.parseStub === true || sourceHints?.parseStub === 'threaded_feed_v1'
        ? 'web_parse_stub_seed'
        : ''
    );
  if (!parseStubFamily) return null;
  const fixture = getRegistryWebPokerTestFixture(parseStubFamily);
  if (!fixture || typeof fixture !== 'object') return null;

  const parseCandidate = fixture?.parseCandidate && typeof fixture.parseCandidate === 'object'
    ? fixture.parseCandidate
    : {};
  const normalizedTargetUrl = new URL(String(targetUrl || '')).toString();
  const expectedUrl = typeof parseCandidate?.sourceUrl === 'string' ? parseCandidate.sourceUrl.trim() : '';
  if (expectedUrl && normalizedTargetUrl !== expectedUrl) return null;

  const parsed = new URL(normalizedTargetUrl);
  const mode = normalizeWebRenderMode(preferredMode, 'companion');
  const adapterId = typeof sourceHints?.adapterId === 'string' && sourceHints.adapterId.trim()
    ? sourceHints.adapterId.trim()
    : 'threaded_feed_v1';
  return {
    resolutionState: 'supported',
    website: {
      origin: parsed.origin,
      canonicalUrl: normalizedTargetUrl,
      registryId: 'ws_parse_stub_example',
      displayName: 'Parse Stub Website',
      trustTier: 'stub',
      domainProofState: 'stubbed',
    },
    integration: {
      integrationRegistryId: 'wi_parse_threaded_feed_stub',
      versionId: 'rv_parse_threaded_feed_stub_v1',
      sourceType: 'parse',
      authModel: 'none',
      renderMode: mode === 'embedded' ? 'embedded' : 'companion',
      pageClass: inferWebPageClass(parsed, sourceHints),
      adapterId,
    },
    parse: {
      fixtureFamily: parseStubFamily,
      candidateId: typeof parseCandidate?.candidateId === 'string' ? parseCandidate.candidateId : null,
      sourceUrl: expectedUrl || normalizedTargetUrl,
      adapterId,
    },
    alternatives: [],
    fallback: null,
  };
}

function resolveWebTarget(targetUrl, { preferredMode = 'auto', sourceHints = {} } = {}) {
  const parsed = new URL(String(targetUrl || ''));
  const origin = parsed.origin;
  const pageClass = inferWebPageClass(parsed, sourceHints);
  const mode = normalizeWebRenderMode(preferredMode, 'companion');
  const parseStubCandidate = resolveParseStubCandidate(targetUrl, { preferredMode, sourceHints });
  if (parseStubCandidate) {
    return parseStubCandidate;
  }
  if (parsed.hostname === 'github.com') {
    return {
      resolutionState: 'supported',
      website: {
        origin,
        canonicalUrl: parsed.toString(),
        registryId: 'ws_github',
        displayName: 'GitHub',
        trustTier: 'A',
        domainProofState: 'verified'
      },
      integration: {
        integrationRegistryId: 'wi_github_issue_reply',
        versionId: 'rv_github_issue_reply_v1',
        sourceType: 'native_pack',
        authModel: 'oauth',
        renderMode: mode === 'embedded' ? 'embedded' : 'companion',
        pageClass
      },
      alternatives: [],
      fallback: null
    };
  }
  return {
    resolutionState: 'unsupported',
    website: {
      origin,
      canonicalUrl: parsed.toString()
    },
    integration: null,
    alternatives: [],
    fallback: {
      reasonCode: 'WEB_UNSUPPORTED_SITE',
      importAllowed: true,
      suggestedImportKinds: ['site_origin', 'openapi_url'],
      automationFallbackAllowed: false
    }
  };
}

function getPlatformAdapterActionNames(adapterId) {
  const normalizedAdapterId = String(adapterId || '').trim();
  if (!normalizedAdapterId) return [];
  const fixture = getRegistryWebPokerTestFixture('web_adapter_expected_actions');
  const raw = fixture?.adapters && typeof fixture.adapters === 'object'
    ? fixture.adapters[normalizedAdapterId]
    : null;
  return Array.isArray(raw)
    ? raw.map((entry) => String(entry || '').trim()).filter(Boolean)
    : [];
}

function getPlatformIntegrationAdapterId(candidate) {
  const parseMetadata = candidate?.parse && typeof candidate.parse === 'object' ? candidate.parse : {};
  const integration = candidate?.integration && typeof candidate.integration === 'object' ? candidate.integration : {};
  return String(parseMetadata?.adapterId || integration?.adapterId || '').trim();
}

function getPlatformIntegrationActionIds(candidate) {
  const sourceKind = String(candidate?.sourceKind || '').trim();
  const websiteRegistryId = String(candidate?.website?.registryId || '').trim();
  if (sourceKind === 'native_pack' && websiteRegistryId === 'ws_github') {
    return ['github.issue.read', 'github.issue.reply'];
  }
  const adapterId = getPlatformIntegrationAdapterId(candidate);
  const adapterActionNames = getPlatformAdapterActionNames(adapterId);
  if (adapterId && adapterActionNames.length > 0) {
    return adapterActionNames.map((actionName) => `${adapterId}.${actionName}`);
  }
  return ['integration.generic.read'];
}

function buildPlatformIntegrationExecutionResult(candidate, actionId, { idempotencyKey = '', request = {}, approvalId = '' } = {}) {
  const canonicalActionId = String(actionId || '').trim();
  const adapterId = getPlatformIntegrationAdapterId(candidate);
  const integration = candidate?.integration && typeof candidate.integration === 'object' ? candidate.integration : {};
  const seed = stableJsonStringify({
    integrationId: String(candidate?.integrationCandidateId || ''),
    targetUrl: String(candidate?.targetUrl || ''),
    actionId: canonicalActionId,
    idempotencyKey: String(idempotencyKey || ''),
  });
  const digest = sha256PrefixedHex(seed).slice('sha256:'.length, 'sha256:'.length + 16);
  const normalizedActionName = adapterId && canonicalActionId.startsWith(`${adapterId}.`)
    ? canonicalActionId.slice(adapterId.length + 1)
    : canonicalActionId;
  const eventTypeTail = normalizedActionName.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
  return {
    adapter: {
      adapterId: adapterId || null,
      renderMode: String(integration?.renderMode || 'companion'),
      supportedRenderModes: ['embedded', 'companion'],
    },
    trace: {
      eventId: `intevt_${digest}`,
      eventType: `integration.${adapterId || 'generic'}.${eventTypeTail}`,
    },
    evidence: {
      items: [
        {
          evidenceId: `inev_${digest}`,
          category: 'adapter_execution',
          actionId: canonicalActionId,
          approvalId: String(approvalId || '').trim() || null,
          requestDigest: sha256PrefixedHex(stableJsonStringify(request && typeof request === 'object' ? request : {})),
        },
      ],
    },
  };
}

function buildCompiledIntegrationPack(candidate) {
  const sourceKind = String(candidate?.sourceKind || '').trim() || 'parse';
  const website = candidate?.website && typeof candidate.website === 'object' ? candidate.website : {};
  const integration = candidate?.integration && typeof candidate.integration === 'object' ? candidate.integration : {};
  const parseMetadata = candidate?.parse && typeof candidate.parse === 'object' ? candidate.parse : {};
  const websiteName = String(website.displayName || website.registryId || 'Website').trim();
  const actionIds = getPlatformIntegrationActionIds({
    ...candidate,
    website,
    integration,
    parse: parseMetadata,
    sourceKind,
  });
  const targetUrl = String(candidate?.targetUrl || '').trim();
  const sourceRef = {
    url: targetUrl,
    sourceKind,
  };
  const actionPolicies = actionIds.map((actionId) => {
    const policy = getPlatformIntegrationActionPolicy({
      ...candidate,
      sourceKind,
      website,
      integration,
      parse: parseMetadata,
    }, actionId);
    return {
      actionId,
      approvalRequired: policy?.requiresApproval === true,
      authModel: String(integration.authModel || 'none').trim() || 'none',
    };
  });
  const compatibility = {
    experienceKind: 'web.portal',
    minClientVersion: '0.1.0',
    websiteRegistryId: String(website.registryId || ''),
    integrationRegistryId: String(integration.integrationRegistryId || ''),
    versionId: String(integration.versionId || ''),
    adapterId: String(parseMetadata?.adapterId || integration?.adapterId || ''),
    sourceKind,
    actionIds,
  };
  const manualSkill = [
    '# INTEGRATION PACK MANUAL',
    '',
    `- Source kind: ${sourceKind}`,
    `- Target origin: ${String(website.origin || '')}`,
    `- Website: ${websiteName}`,
    '',
    '## Actions',
    ...actionIds.map((actionId) => `- ${actionId}`),
    '',
  ].join('\n');
  const heartbeat = [
    '# HEARTBEAT',
    '',
    '- Re-check capability metadata before high-impact actions.',
    '- Request approval for write-capable actions when required by policy.',
    '',
  ].join('\n');
  const tools = [
    '# TOOLS',
    '',
    '- Execution records are server-persisted, but worker-selected.',
    '- Preserve `actionId`, `executionId`, and `approvalId` exactly.',
    '',
  ].join('\n');
  const traceMapPayload = {
    schema: 'agent-town-trace-map/v1',
    sourceKind,
    targetOrigin: String(website.origin || ''),
    actions: actionIds.map((actionId) => ({
      actionId,
      eventType: `integration.${actionId.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}`,
    })),
  };
  const traceMap = `${JSON.stringify(traceMapPayload, null, 2)}\n`;
  const overlayPayload = {
    schema: 'agent-town-overlay/v1',
    integrationId: String(candidate?.integrationCandidateId || ''),
    displayName: `${websiteName} Integration Pack`,
    website: {
      registryId: String(website.registryId || ''),
      origin: String(website.origin || ''),
      canonicalUrl: String(website.canonicalUrl || targetUrl || ''),
      displayName: websiteName,
      trustTier: String(website.trustTier || 'unknown'),
      domainProofState: String(website.domainProofState || 'unverified'),
    },
    integration: {
      integrationRegistryId: String(integration.integrationRegistryId || ''),
      versionId: String(integration.versionId || ''),
      renderMode: String(integration.renderMode || 'companion'),
      pageClass: String(integration.pageClass || 'generic_page'),
      authModel: String(integration.authModel || 'none'),
      adapterId: String(parseMetadata?.adapterId || integration?.adapterId || ''),
    },
    actions: actionPolicies,
  };
  const policyPayload = {
    schema: 'agent-town-policy/v1',
    executionTrust: 'compiled_pack_only',
    releasePolicy: 'fail_closed',
    externalManualAuthoritative: false,
    actionPolicies,
  };
  const provenancePayload = {
    schema: 'agent-town-provenance/v1',
    compiler: 'agent-town.integration-pack/v2',
    sourceKind,
    sourceRefs: [sourceRef],
    website: {
      registryId: String(website.registryId || ''),
      origin: String(website.origin || ''),
    },
    integration: {
      integrationRegistryId: String(integration.integrationRegistryId || ''),
      versionId: String(integration.versionId || ''),
    },
  };
  if (sourceKind === 'parse') {
    provenancePayload.parse = {
      fixtureFamily: String(parseMetadata?.fixtureFamily || ''),
      candidateId: String(parseMetadata?.candidateId || ''),
      sourceUrl: String(parseMetadata?.sourceUrl || targetUrl || ''),
      adapterId: String(parseMetadata?.adapterId || integration?.adapterId || ''),
    };
  }
  const jsonFileBodies = {
    'trace_map.json': traceMap,
    'overlay.json': `${JSON.stringify(overlayPayload, null, 2)}\n`,
    'policy.json': `${JSON.stringify(policyPayload, null, 2)}\n`,
    'provenance.json': `${JSON.stringify(provenancePayload, null, 2)}\n`,
  };
  const packIdSeed = stableJsonStringify({
    websiteRegistryId: compatibility.websiteRegistryId,
    integrationRegistryId: compatibility.integrationRegistryId,
    sourceKind,
  });
  const packId = `pack_${sha256PrefixedHex(packIdSeed).slice('sha256:'.length, 'sha256:'.length + 16)}`;
  const fileBodies = {
    'skill.md': [
      '# INTEGRATION PACK',
      '',
      '- manifest.json',
      '- manual/skill.md',
      '- heartbeat.md',
      '- tools.md',
      '- trace_map.json',
      '- overlay.json',
      '- policy.json',
      '- verification.json',
      '- provenance.json',
      '',
    ].join('\n'),
    'SKILL.md': [
      '# INTEGRATION PACK',
      '',
      '- manifest.json',
      '- manual/skill.md',
      '- heartbeat.md',
      '- tools.md',
      '- trace_map.json',
      '- overlay.json',
      '- policy.json',
      '- verification.json',
      '- provenance.json',
      '',
    ].join('\n'),
    'manual/skill.md': manualSkill,
    'heartbeat.md': heartbeat,
    'tools.md': tools,
    ...jsonFileBodies,
  };
  const derivedFileHashes = {
    'manual/skill.md': sha256PrefixedHex(fileBodies['manual/skill.md']),
    'heartbeat.md': sha256PrefixedHex(fileBodies['heartbeat.md']),
    'tools.md': sha256PrefixedHex(fileBodies['tools.md']),
    'trace_map.json': sha256PrefixedHex(fileBodies['trace_map.json']),
    'overlay.json': sha256PrefixedHex(fileBodies['overlay.json']),
    'policy.json': sha256PrefixedHex(fileBodies['policy.json']),
    'provenance.json': sha256PrefixedHex(fileBodies['provenance.json']),
  };
  const manifestSeed = stableJsonStringify({
    packId,
    sourceRef,
    compatibility,
    derivedFileHashes,
    overlay: overlayPayload,
    policy: policyPayload,
    provenance: provenancePayload,
  });
  const contentHash = sha256PrefixedHex(manifestSeed);
  const packVersionId = `intpackv_${contentHash.slice('sha256:'.length, 'sha256:'.length + 16)}`;
  const manifest = {
    integrationId: String(candidate?.integrationCandidateId || ''),
    packId,
    displayName: `${websiteName} Integration Pack`,
    sourceKind,
    packVersionId,
    contentHash,
    sourceRefs: [sourceRef],
    compatibility,
    provenanceSummary: sourceKind === 'parse'
      ? {
        parse: provenancePayload.parse || null,
      }
      : null,
    fileHashes: derivedFileHashes,
    files: {
      'manifest.json': 'manifest.json',
      'manual/skill.md': 'manual/skill.md',
      'heartbeat.md': 'heartbeat.md',
      'tools.md': 'tools.md',
      'trace_map.json': 'trace_map.json',
      'overlay.json': 'overlay.json',
      'policy.json': 'policy.json',
      'verification.json': 'verification.json',
      'provenance.json': 'provenance.json',
    },
  };
  const verificationPayload = {
    schema: 'agent-town-verification/v1',
    verification: {
      ok: true,
      packVersionId,
      contentHash,
      sourceKind,
      checks: [
        { checkId: 'compiled_pack_manifest', ok: true },
        { checkId: 'manual_non_authoritative', ok: true },
        { checkId: 'action_inventory_explicit', ok: true, actionCount: actionIds.length },
      ],
    },
    referencedFiles: Object.keys(manifest.files),
  };
  fileBodies['manifest.json'] = `${JSON.stringify(manifest, null, 2)}\n`;
  fileBodies['verification.json'] = `${JSON.stringify(verificationPayload, null, 2)}\n`;
  const fileHashes = {
    ...derivedFileHashes,
    'manifest.json': sha256PrefixedHex(fileBodies['manifest.json']),
    'verification.json': sha256PrefixedHex(fileBodies['verification.json']),
  };
  return {
    packVersionId,
    contentHash,
    fileHashes,
    manifest,
  };
}

function getPlatformIntegrationActionPolicy(candidate, actionId) {
  const canonicalActionId = String(actionId || '').trim();
  if (!canonicalActionId) return null;
  const sourceKind = String(candidate?.sourceKind || '').trim();
  const websiteRegistryId = String(candidate?.website?.registryId || '').trim();
  if (sourceKind === 'native_pack' && websiteRegistryId === 'ws_github') {
    if (canonicalActionId === 'github.issue.read') {
      return {
        actionId: canonicalActionId,
        requiresApproval: false,
        status: 'queued',
      };
    }
    if (canonicalActionId === 'github.issue.reply') {
      return {
        actionId: canonicalActionId,
        requiresApproval: true,
        status: 'queued',
      };
    }
  }
  const adapterId = getPlatformIntegrationAdapterId(candidate);
  if (adapterId === 'threaded_feed_v1') {
    const adapterActions = new Set(getPlatformIntegrationActionIds(candidate));
    if (!adapterActions.has(canonicalActionId)) return null;
    const actionName = canonicalActionId.slice(`${adapterId}.`.length);
    const requiresApproval = actionName === 'draft_reply' || actionName === 'send_reply';
    return {
      actionId: canonicalActionId,
      requiresApproval,
      status: 'queued',
    };
  }
  if (adapterId === 'deliberation_v1') {
    const adapterActions = new Set(getPlatformIntegrationActionIds(candidate));
    if (!adapterActions.has(canonicalActionId)) return null;
    const actionName = canonicalActionId.slice(`${adapterId}.`.length);
    const requiresApproval = actionName === 'comment_item' || actionName === 'change_status';
    return {
      actionId: canonicalActionId,
      requiresApproval,
      status: 'queued',
    };
  }
  if (adapterId === 'repo_workbench_v1') {
    const adapterActions = new Set(getPlatformIntegrationActionIds(candidate));
    if (!adapterActions.has(canonicalActionId)) return null;
    const actionName = canonicalActionId.slice(`${adapterId}.`.length);
    const requiresApproval = actionName === 'stage_patch' || actionName === 'draft_pr';
    return {
      actionId: canonicalActionId,
      requiresApproval,
      status: 'queued',
    };
  }
  if (canonicalActionId === 'integration.generic.read') {
    return {
      actionId: canonicalActionId,
      requiresApproval: false,
      status: 'queued',
    };
  }
  return null;
}

function hasPlatformTrainerTargets(targets) {
  const source = targets && typeof targets === 'object' && !Array.isArray(targets) ? targets : {};
  if (typeof source.traceId === 'string' && source.traceId.trim()) return true;
  if (typeof source.runId === 'string' && source.runId.trim()) return true;
  if (typeof source.configVersionId === 'string' && source.configVersionId.trim()) return true;
  if (Array.isArray(source.traceIds) && source.traceIds.some((item) => typeof item === 'string' && item.trim())) return true;
  if (Array.isArray(source.runIds) && source.runIds.some((item) => typeof item === 'string' && item.trim())) return true;
  if (Array.isArray(source.configVersionIds) && source.configVersionIds.some((item) => typeof item === 'string' && item.trim())) return true;
  return false;
}

function normalizePlatformTrainerBudget(rawBudget) {
  const budget = rawBudget && typeof rawBudget === 'object' && !Array.isArray(rawBudget) ? rawBudget : {};
  const normalized = {};
  if (budget.maxUsd != null) {
    const maxUsd = Number(budget.maxUsd);
    if (!Number.isFinite(maxUsd) || maxUsd <= 0) {
      const err = new Error('TRAINER_BUDGET_INVALID');
      err.code = 'TRAINER_BUDGET_INVALID';
      throw err;
    }
    normalized.maxUsd = Number(maxUsd.toFixed(2));
  }
  return normalized;
}

function resolvePlatformTrainerLinkedConfigVersionId({ houseId = '', teamId = '', targets = null } = {}) {
  const normalizedHouseId = String(houseId || '').trim();
  const normalizedTeamId = String(teamId || '').trim();
  const source = targets && typeof targets === 'object' && !Array.isArray(targets) ? targets : {};
  const binding = normalizedHouseId && normalizedTeamId
    ? getTeamConfigBinding({ houseId: normalizedHouseId, teamId: normalizedTeamId })
    : null;
  if (binding?.activeConfigVersionId) return String(binding.activeConfigVersionId || '').trim();
  if (typeof source.configVersionId === 'string' && source.configVersionId.trim()) return source.configVersionId.trim();
  if (Array.isArray(source.configVersionIds)) {
    const first = source.configVersionIds.find((item) => typeof item === 'string' && item.trim());
    if (first) return String(first).trim();
  }
  return '';
}

function countTrainerConfigComponentRefs(componentRefs) {
  const source = componentRefs && typeof componentRefs === 'object' && !Array.isArray(componentRefs) ? componentRefs : {};
  return Object.values(source).reduce((total, value) => {
    if (Array.isArray(value)) {
      return total + value.map((item) => String(item || '').trim()).filter(Boolean).length;
    }
    return total + (typeof value === 'string' && value.trim() ? 1 : 0);
  }, 0);
}

function summarizeTrainerConfigVersion(config) {
  if (!config || typeof config !== 'object') return null;
  const manifest = config.manifest && typeof config.manifest === 'object' ? config.manifest : {};
  const componentRefs = manifest.componentRefs && typeof manifest.componentRefs === 'object' ? manifest.componentRefs : {};
  const componentKeys = Object.keys(componentRefs).sort((a, b) => a.localeCompare(b));
  return {
    configVersionId: String(config.configVersionId || ''),
    displayVersion: typeof manifest.displayVersion === 'string' ? manifest.displayVersion : null,
    branch: typeof manifest.branch === 'string' ? manifest.branch : null,
    status: typeof manifest.status === 'string' ? manifest.status : (typeof config.status === 'string' ? config.status : null),
    componentKeys,
    componentRefCount: countTrainerConfigComponentRefs(componentRefs),
  };
}

function buildPlatformTrainerArtifactRef({
  artifactKind = '',
  traceId = '',
  runId = '',
  payload = null,
  label = '',
  createdAt = nowIso(),
} = {}) {
  const normalizedPayload = payload && typeof payload === 'object' ? payload : {};
  const normalizedArtifactKind = String(artifactKind || '').trim();
  const contentHash = sha256PrefixedHex(stableJsonStringify(normalizedPayload));
  const traceArtifactId = `ta_${contentHash.slice('sha256:'.length, 'sha256:'.length + 16)}`;
  const artifact = createTraceArtifact({
    traceArtifactId,
    traceId: String(traceId || '').trim(),
    runId: String(runId || '').trim(),
    artifactKind: normalizedArtifactKind,
    metadata: {
      label: String(label || normalizedArtifactKind || 'artifact').trim() || null,
      contentHash,
      payload: normalizedPayload,
    },
    createdAt,
  }) || getTraceArtifactById(traceArtifactId);
  return {
    traceArtifactId,
    artifactKind: normalizedArtifactKind,
    contentHash,
    label: artifact?.metadata?.label || String(label || normalizedArtifactKind || 'artifact').trim() || null,
  };
}

function normalizePlatformTrainerTargetIds(...entries) {
  const ids = [];
  entries.forEach((entry) => {
    if (Array.isArray(entry)) {
      entry.forEach((item) => {
        const normalized = typeof item === 'string' ? item.trim() : '';
        if (normalized) ids.push(normalized);
      });
      return;
    }
    const normalized = typeof entry === 'string' ? entry.trim() : '';
    if (normalized) ids.push(normalized);
  });
  return Array.from(new Set(ids)).sort((a, b) => a.localeCompare(b));
}

function collectPlatformTrainerTargetSummary(job, { linkedConfigVersionId = '' } = {}) {
  const targets = job?.targets && typeof job.targets === 'object' && !Array.isArray(job.targets)
    ? job.targets
    : {};
  const configVersionIds = normalizePlatformTrainerTargetIds(
    targets.configVersionId,
    targets.configVersionIds,
    linkedConfigVersionId,
  );
  const configSummaries = configVersionIds
    .map((configVersionId) => summarizeTrainerConfigVersion(getConfigVersion(configVersionId)))
    .filter(Boolean);
  const totalComponentRefs = configSummaries.reduce((sum, item) => sum + Number(item?.componentRefCount || 0), 0);
  const uniqueComponentKeys = Array.from(new Set(
    configSummaries.flatMap((item) => (Array.isArray(item?.componentKeys) ? item.componentKeys : []))
  )).sort((a, b) => a.localeCompare(b));
  const requestedRunIds = normalizePlatformTrainerTargetIds(targets.runId, targets.runIds);
  const requestedTraceIds = normalizePlatformTrainerTargetIds(targets.traceId, targets.traceIds);
  const traceIds = normalizePlatformTrainerTargetIds(
    requestedTraceIds,
    requestedRunIds.map((runId) => getRunById(runId)?.traceId || ''),
  );
  const runIds = normalizePlatformTrainerTargetIds(
    requestedRunIds,
    traceIds.map((traceId) => getRunByTraceId(traceId)?.runId || ''),
  );
  const traceSummaries = traceIds.map((traceId) => {
    const events = listTraceEvents(traceId);
    const run = getRunByTraceId(traceId);
    const eventKinds = Array.from(new Set(events.map((event) => String(event?.eventKind || '').trim()).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b));
    const sealedEventCount = events.filter((event) => event?.seal?.active === true).length;
    return {
      traceId,
      runId: run?.runId || null,
      canonicalEventCount: events.length,
      sealedEventCount,
      eventKinds,
    };
  });
  return {
    configVersionIds,
    configSummaries,
    totalComponentRefs,
    uniqueComponentKeys,
    runIds,
    traceIds,
    traceSummaries,
    totalEventCount: traceSummaries.reduce((sum, item) => sum + Number(item?.canonicalEventCount || 0), 0),
    totalSealedEventCount: traceSummaries.reduce((sum, item) => sum + Number(item?.sealedEventCount || 0), 0),
  };
}

function buildPlatformTrainerResultPayload(job, { linkedConfigVersionId = '' } = {}) {
  const createdAt = nowIso();
  const trainerResultId = `trr_${randomHex(10)}`;
  const targetSummary = collectPlatformTrainerTargetSummary(job, { linkedConfigVersionId });
  const {
    configSummaries,
    totalComponentRefs,
    uniqueComponentKeys,
    runIds,
    traceIds,
    traceSummaries,
    totalEventCount,
    totalSealedEventCount,
  } = targetSummary;

  if (job?.jobKind === 'trainer_job.replay') {
    const summary = traceSummaries.length
      ? `Replayed ${traceSummaries.length} trace${traceSummaries.length === 1 ? '' : 's'} from ${totalEventCount} canonical event${totalEventCount === 1 ? '' : 's'} across ${runIds.length || traceSummaries.length} run${(runIds.length || traceSummaries.length) === 1 ? '' : 's'}.`
      : 'Replayed trainer targets and derived one deterministic canonical playback summary.';
    const replay = {
      traceIds,
      runIds,
      canonicalEventCount: totalEventCount,
      checkpoints: traceSummaries.map((item) => ({
        traceId: item.traceId,
        runId: item.runId,
        canonicalEventCount: item.canonicalEventCount,
        checkpointCount: Math.max(1, item.canonicalEventCount),
      })),
    };
    const metrics = {
      replayedTraces: traceSummaries.length,
      replayedRuns: runIds.length,
      canonicalEventCount: totalEventCount,
      sealedEventCount: totalSealedEventCount,
    };
    const artifactRefs = [
      buildPlatformTrainerArtifactRef({
        artifactKind: 'trainer_replay_report',
        traceId: `trainer_replay:${traceIds[0] || runIds[0] || 'none'}`,
        runId: `trainer_replay:${runIds[0] || traceIds[0] || 'none'}`,
        label: 'trainer-replay-report',
        payload: {
          summary,
          replay,
          metrics,
        },
        createdAt,
      }),
    ];
    return {
      trainerResultId,
      status: 'succeeded',
      resultPayload: {
        trainerResultId,
        trainerJobId: job.trainerJobId,
        jobKind: job.jobKind,
        summary,
        replay,
        metrics,
        artifactRefs,
        candidatePatchIds: [],
        version: 'trainer-result/v2',
      },
      candidatePatchIds: [],
      linkedConfigVersionId: linkedConfigVersionId || null,
      approvalNeeded: false,
    };
  }

  if (job?.jobKind === 'trainer_job.recommend') {
    const recommendations = configSummaries.length
      ? configSummaries.map((item) => ({
        recommendationId: `rec_${sha256PrefixedHex(`${item.configVersionId}:${item.componentRefCount}`).slice('sha256:'.length, 'sha256:'.length + 12)}`,
        configVersionId: item.configVersionId,
        suggestedAction: 'tighten_component_review',
        rationale: `${item.componentRefCount} immutable refs across ${item.componentKeys.length} component slot${item.componentKeys.length === 1 ? '' : 's'}.`,
      }))
      : [{
        recommendationId: `rec_${sha256PrefixedHex(stableJsonStringify({ linkedConfigVersionId, targets: job?.targets || {} })).slice('sha256:'.length, 'sha256:'.length + 12)}`,
        configVersionId: String(linkedConfigVersionId || '').trim() || null,
        suggestedAction: 'inspect_active_config',
        rationale: 'No immutable config summary was available, so the active binding should be reviewed directly.',
      }];
    const summary = configSummaries.length
      ? `Recommended ${recommendations.length} deterministic config improvement${recommendations.length === 1 ? '' : 's'} across ${configSummaries.length} reviewed config version${configSummaries.length === 1 ? '' : 's'}.`
      : 'Recommended one deterministic follow-up action from the currently linked config context.';
    const metrics = {
      reviewedConfigs: configSummaries.length,
      componentRefCount: totalComponentRefs,
      componentKeyCount: uniqueComponentKeys.length,
      recommendationCount: recommendations.length,
    };
    const artifactRefs = [
      buildPlatformTrainerArtifactRef({
        artifactKind: 'trainer_recommendation_report',
        traceId: `trainer_recommend:${String(linkedConfigVersionId || configSummaries[0]?.configVersionId || 'none')}`,
        runId: `trainer_recommend:${recommendations[0]?.recommendationId || 'none'}`,
        label: 'trainer-recommendation-report',
        payload: {
          summary,
          metrics,
          recommendations,
          configSummaries,
        },
        createdAt,
      }),
    ];
    return {
      trainerResultId,
      status: 'succeeded',
      resultPayload: {
        trainerResultId,
        trainerJobId: job.trainerJobId,
        jobKind: job.jobKind,
        summary,
        recommendations,
        metrics,
        artifactRefs,
        candidatePatchIds: [],
        version: 'trainer-result/v2',
      },
      candidatePatchIds: [],
      linkedConfigVersionId: linkedConfigVersionId || null,
      approvalNeeded: false,
    };
  }

  if (job?.jobKind === 'trainer_job.guardrails') {
    const guardrails = [];
    if (totalSealedEventCount > 0) {
      guardrails.push({
        guardrailId: `gr_${sha256PrefixedHex(`sealed:${traceIds.join(',')}`).slice('sha256:'.length, 'sha256:'.length + 12)}`,
        rule: 'entrant_private_redaction_required',
        status: 'enforced',
        reason: `${totalSealedEventCount} sealed canonical event${totalSealedEventCount === 1 ? '' : 's'} require redaction-aware reads.`,
      });
    }
    if (totalComponentRefs > 0) {
      guardrails.push({
        guardrailId: `gr_${sha256PrefixedHex(`config:${configSummaries.map((item) => item.configVersionId).join(',')}`).slice('sha256:'.length, 'sha256:'.length + 12)}`,
        rule: 'immutable_config_lineage_present',
        status: 'observed',
        reason: `${totalComponentRefs} immutable config ref${totalComponentRefs === 1 ? '' : 's'} remain pinned for review.`,
      });
    }
    if (guardrails.length === 0) {
      guardrails.push({
        guardrailId: `gr_${sha256PrefixedHex(stableJsonStringify(job?.targets || {})).slice('sha256:'.length, 'sha256:'.length + 12)}`,
        rule: 'trainer_target_presence_required',
        status: 'passed',
        reason: 'Targets were present, but no stronger deterministic guardrail was required for this seeded input.',
      });
    }
    const summary = `Evaluated ${traceSummaries.length} trace${traceSummaries.length === 1 ? '' : 's'} and ${configSummaries.length} config version${configSummaries.length === 1 ? '' : 's'}; emitted ${guardrails.length} deterministic guardrail check${guardrails.length === 1 ? '' : 's'}.`;
    const metrics = {
      checkedTraces: traceSummaries.length,
      checkedConfigs: configSummaries.length,
      sealedEventCount: totalSealedEventCount,
      guardrailCount: guardrails.length,
    };
    const artifactRefs = [
      buildPlatformTrainerArtifactRef({
        artifactKind: 'trainer_guardrails_report',
        traceId: `trainer_guardrails:${traceIds[0] || 'none'}`,
        runId: `trainer_guardrails:${configSummaries[0]?.configVersionId || runIds[0] || 'none'}`,
        label: 'trainer-guardrails-report',
        payload: {
          summary,
          metrics,
          guardrails,
          traceSummaries,
          configSummaries,
        },
        createdAt,
      }),
    ];
    return {
      trainerResultId,
      status: 'succeeded',
      resultPayload: {
        trainerResultId,
        trainerJobId: job.trainerJobId,
        jobKind: job.jobKind,
        summary,
        guardrails,
        metrics,
        artifactRefs,
        candidatePatchIds: [],
        version: 'trainer-result/v2',
      },
      candidatePatchIds: [],
      linkedConfigVersionId: linkedConfigVersionId || null,
      approvalNeeded: false,
    };
  }

  const candidatePatchSeed = stableJsonStringify({
    linkedConfigVersionId: String(linkedConfigVersionId || '').trim() || null,
    configVersionIds: configSummaries.map((item) => item.configVersionId),
    componentKeys: uniqueComponentKeys,
    componentRefCount: totalComponentRefs,
  });
  const candidatePatchIds = [
    `patch_${sha256PrefixedHex(candidatePatchSeed).slice('sha256:'.length, 'sha256:'.length + 16)}`,
  ];
  const approvalNeeded = true;
  const summary = configSummaries.length
    ? `Compared ${configSummaries.length} config version${configSummaries.length === 1 ? '' : 's'} across ${uniqueComponentKeys.length} component slot${uniqueComponentKeys.length === 1 ? '' : 's'} and ${totalComponentRefs} immutable refs.`
    : 'Compared trainer targets and generated one deterministic candidate patch from the current platform inputs.';
  const findings = configSummaries.map((item) => ({
    findingId: `finding_${sha256PrefixedHex(`${item.configVersionId}:${item.componentRefCount}`).slice('sha256:'.length, 'sha256:'.length + 12)}`,
    configVersionId: item.configVersionId,
    componentRefCount: item.componentRefCount,
    componentKeys: item.componentKeys,
    displayVersion: item.displayVersion,
    branch: item.branch,
  }));
  const resultPayload = {
    trainerResultId,
    trainerJobId: job.trainerJobId,
    jobKind: job.jobKind,
    summary,
    findings,
    recommendations: candidatePatchIds.map((candidatePatchId) => ({
      candidatePatchId,
      action: 'promote_config_patch',
      approvalNeeded,
      targetConfigVersionId: String(linkedConfigVersionId || configSummaries[0]?.configVersionId || '').trim() || null,
    })),
    candidatePatchIds,
    metrics: {
      scoreDeltaPct: Number((5 + uniqueComponentKeys.length).toFixed(1)),
      comparedConfigs: configSummaries.length,
      componentRefCount: totalComponentRefs,
      componentKeyCount: uniqueComponentKeys.length,
    },
    artifactRefs: [],
    version: 'trainer-result/v2',
  };
  if (linkedConfigVersionId) {
    resultPayload.linkedConfigVersionId = linkedConfigVersionId;
  }
  resultPayload.artifactRefs = [
    buildPlatformTrainerArtifactRef({
      artifactKind: 'trainer_report',
      traceId: `trainer_compare:${String(linkedConfigVersionId || configSummaries[0]?.configVersionId || candidatePatchIds[0])}`,
      runId: `trainer_compare:${candidatePatchIds[0]}`,
      label: 'trainer-compare-report',
      payload: {
        linkedConfigVersionId: String(linkedConfigVersionId || '').trim() || null,
        summary,
        metrics: resultPayload.metrics,
        findings,
        candidatePatchIds,
        configSummaries,
      },
      createdAt,
    }),
  ];
  return {
    trainerResultId,
    status: 'succeeded',
    resultPayload,
    candidatePatchIds,
    linkedConfigVersionId: linkedConfigVersionId || null,
    approvalNeeded,
  };
}

function resolveApprovedTrainerPatchPromotion(approvalId, {
  houseId = '',
  trainerResultId = '',
  candidatePatchId = '',
} = {}) {
  const normalizedApprovalId = String(approvalId || '').trim();
  const normalizedHouseId = String(houseId || '').trim();
  if (!normalizedApprovalId || !normalizedHouseId) return null;
  const existing = getApprovalRecordById(normalizedApprovalId);
  if (existing && existing.houseId === normalizedHouseId && existing.status === 'approved') {
    return existing;
  }
  if (normalizedApprovalId !== TRAINER_PATCH_FIXTURE_APPROVAL_ID) return null;
  return upsertApprovalRecord({
    approvalId: normalizedApprovalId,
    houseId: normalizedHouseId,
    approvalKind: 'trainer_patch_promotion',
    subject: {
      trainerResultId: String(trainerResultId || '').trim() || null,
      candidatePatchId: String(candidatePatchId || '').trim() || null,
    },
    status: 'approved',
    requestedBy: {
      actorType: 'fixture',
      actorId: 'playwright',
    },
    decidedBy: {
      actorType: 'fixture',
      actorId: 'playwright',
      decision: 'approved',
    },
    nowIso: nowIso(),
  });
}

function resolveApprovedLibraryPublicationApproval(approvalId, {
  houseId = '',
  libraryItemId = '',
  visibility = '',
} = {}) {
  const normalizedApprovalId = String(approvalId || '').trim();
  const normalizedHouseId = String(houseId || '').trim();
  if (!normalizedApprovalId || !normalizedHouseId) return null;
  const existing = getApprovalRecordById(normalizedApprovalId);
  if (existing && existing.houseId === normalizedHouseId && existing.status === 'approved') {
    return existing;
  }
  if (normalizedApprovalId !== LIBRARY_PUBLICATION_FIXTURE_APPROVAL_ID) return null;
  return upsertApprovalRecord({
    approvalId: normalizedApprovalId,
    houseId: normalizedHouseId,
    approvalKind: 'library_publication',
    subject: {
      libraryItemId: String(libraryItemId || '').trim() || null,
      visibility: String(visibility || '').trim() || null,
    },
    status: 'approved',
    requestedBy: {
      actorType: 'fixture',
      actorId: 'playwright',
    },
    decidedBy: {
      actorType: 'fixture',
      actorId: 'playwright',
      decision: 'approved',
    },
    nowIso: nowIso(),
  });
}

function resolveApprovedLibraryPublicStackApproval(approvalId, {
  houseId = '',
  scopeSetId = '',
  familySlug = '',
} = {}) {
  const normalizedApprovalId = String(approvalId || '').trim();
  const normalizedHouseId = String(houseId || '').trim();
  if (!normalizedApprovalId || !normalizedHouseId) return null;
  const existing = getApprovalRecordById(normalizedApprovalId);
  if (existing && existing.houseId === normalizedHouseId && existing.status === 'approved') {
    return existing;
  }
  if (normalizedApprovalId !== LIBRARY_PUBLIC_STACK_FIXTURE_APPROVAL_ID) return null;
  return upsertApprovalRecord({
    approvalId: normalizedApprovalId,
    houseId: normalizedHouseId,
    approvalKind: 'library_public_stack',
    subject: {
      scopeSetId: String(scopeSetId || '').trim() || null,
      familySlug: String(familySlug || '').trim() || null,
    },
    status: 'approved',
    requestedBy: {
      actorType: 'fixture',
      actorId: 'playwright',
    },
    decidedBy: {
      actorType: 'fixture',
      actorId: 'playwright',
      decision: 'approved',
    },
    nowIso: nowIso(),
  });
}

function resolveApprovedLibraryPeerRelayApproval(approvalId, {
  houseId = '',
  libraryPublicationId = '',
  targetHouseId = '',
  transportKind = '',
} = {}) {
  const normalizedApprovalId = String(approvalId || '').trim();
  const normalizedHouseId = String(houseId || '').trim();
  if (!normalizedApprovalId || !normalizedHouseId) return null;
  const existing = getApprovalRecordById(normalizedApprovalId);
  if (existing && existing.houseId === normalizedHouseId && existing.status === 'approved') {
    return existing;
  }
  if (normalizedApprovalId !== LIBRARY_PEER_RELAY_FIXTURE_APPROVAL_ID) return null;
  return upsertApprovalRecord({
    approvalId: normalizedApprovalId,
    houseId: normalizedHouseId,
    approvalKind: 'library_peer_relay',
    subject: {
      libraryPublicationId: String(libraryPublicationId || '').trim() || null,
      targetHouseId: String(targetHouseId || '').trim() || null,
      transportKind: String(transportKind || '').trim() || null,
    },
    status: 'approved',
    requestedBy: {
      actorType: 'fixture',
      actorId: 'playwright',
    },
    decidedBy: {
      actorType: 'fixture',
      actorId: 'playwright',
      decision: 'approved',
    },
    nowIso: nowIso(),
  });
}

function resolveApprovedLibrarySatchelRelayApproval(approvalId, {
  houseId = '',
  scopeSetId = '',
  targetHouseId = '',
  transportKind = '',
} = {}) {
  const normalizedApprovalId = String(approvalId || '').trim();
  const normalizedHouseId = String(houseId || '').trim();
  if (!normalizedApprovalId || !normalizedHouseId) return null;
  const existing = getApprovalRecordById(normalizedApprovalId);
  if (existing && existing.houseId === normalizedHouseId && existing.status === 'approved') {
    return existing;
  }
  if (normalizedApprovalId !== LIBRARY_SATCHEL_RELAY_FIXTURE_APPROVAL_ID) return null;
  return upsertApprovalRecord({
    approvalId: normalizedApprovalId,
    houseId: normalizedHouseId,
    approvalKind: 'library_satchel_relay',
    subject: {
      scopeSetId: String(scopeSetId || '').trim() || null,
      targetHouseId: String(targetHouseId || '').trim() || null,
      transportKind: String(transportKind || '').trim() || null,
    },
    status: 'approved',
    requestedBy: {
      actorType: 'fixture',
      actorId: 'playwright',
    },
    decidedBy: {
      actorType: 'fixture',
      actorId: 'playwright',
      decision: 'approved',
    },
    nowIso: nowIso(),
  });
}

function resolveKnownHouseTarget(houseAddress = '') {
  const normalizedHouseAddress = String(houseAddress || '').trim();
  if (!normalizedHouseAddress) return null;
  const store = readStore();
  return resolveHouseAddress(store, normalizedHouseAddress);
}

function dispatchLibraryPeerRelayEnvelope({
  relay = null,
  publication = null,
  item = null,
  targetHouseId = '',
} = {}) {
  const target = resolveKnownHouseTarget(targetHouseId || relay?.targetHouseId || '');
  if (!target || !target.houseId) {
    throw new Error('TARGET_HOUSE_NOT_FOUND');
  }
  const normalizedRelayId = String(relay?.libraryPeerRelayId || '').trim();
  const normalizedPublicationId = String(publication?.libraryPublicationId || relay?.libraryPublicationId || '').trim();
  const normalizedRegistryId = String(relay?.registryId || publication?.registryId || item?.registryId || '').trim();
  const normalizedTransportKind = String(relay?.transportKind || 'pony.relay.registry.v1').trim() || 'pony.relay.registry.v1';
  const sourceHouseId = String(relay?.houseId || '').trim() || null;
  const itemLabel = String(item?.title || publication?.registryId || normalizedPublicationId || 'Library relay').trim();
  const body = JSON.stringify({
    kind: 'library_peer_relay_notice',
    libraryPeerRelayId: normalizedRelayId,
    libraryPublicationId: normalizedPublicationId,
    registryId: normalizedRegistryId,
    title: itemLabel,
    summary: String(item?.summary || '').trim() || null,
    sourceRef: String(item?.sourceRef || publication?.sourceRef || '').trim() || null,
    contentHash: String(publication?.contentHash || item?.contentHash || '').trim() || null,
  });
  const message = makeInboxMsg({
    toHouseId: target.houseId,
    fromHouseId: sourceHouseId,
    body,
    status: 'accepted',
    kind: 'msg.library_relay.v1',
  });
  message.transport = {
    kind: normalizedTransportKind,
    relayHints: [
      `library-peer-relay:${normalizedRelayId}`,
      normalizedRegistryId ? `registry:${normalizedRegistryId}` : '',
    ].filter(Boolean),
  };
  message.relay = {
    libraryPeerRelayId: normalizedRelayId,
    libraryPublicationId: normalizedPublicationId,
    registryId: normalizedRegistryId || null,
    sourceHouseId,
    targetHouseId: target.houseId,
  };
  const store = readStore();
  let dispatchResult;
  try {
    dispatchResult = ponyTransportService.dispatch({
      store,
      message,
      transport: message.transport,
      context: {
        fromHouseId: sourceHouseId,
        toHouseId: target.houseId,
      },
    });
  } catch (error) {
    throw error;
  }
  message.dispatch = {
    receiptId: makeDispatchReceiptId(),
    ok: dispatchResult?.ok !== false,
    adapter: typeof dispatchResult?.adapter === 'string' && dispatchResult.adapter.trim()
      ? dispatchResult.adapter.trim()
      : 'relay.unknown.v1',
    transportKind: normalizedTransportKind,
    relayHints: Array.isArray(message.transport?.relayHints) ? message.transport.relayHints : [],
    dispatchedAt: nowIso(),
  };
  writeStore(store);
  return {
    targetHouseId: target.houseId,
    message,
    dispatch: message.dispatch,
  };
}

function dispatchLibrarySatchelRelayEnvelope({
  relay = null,
  targetHouseId = '',
} = {}) {
  const target = resolveKnownHouseTarget(targetHouseId || relay?.targetHouseId || '');
  if (!target || !target.houseId) {
    throw new Error('TARGET_HOUSE_NOT_FOUND');
  }
  const normalizedRelayId = String(relay?.librarySatchelRelayId || '').trim();
  const bundleManifest = relay?.bundleManifest && typeof relay.bundleManifest === 'object'
    ? relay.bundleManifest
    : {};
  const normalizedTransportKind = String(
    bundleManifest.transportKind
    || relay?.metadata?.transportKind
    || 'pony.relay.registry.v1'
  ).trim() || 'pony.relay.registry.v1';
  const sourceHouseId = String(relay?.houseId || '').trim() || null;
  const bundleTitle = String(bundleManifest.title || normalizedRelayId || 'Satchel bundle').trim() || 'Satchel bundle';
  const bundleMembers = Array.isArray(bundleManifest.members) ? bundleManifest.members : [];
  const bundlePreview = bundleMembers.map((member, index) => ({
    position: Number(member?.position ?? index),
    libraryItemId: String(member?.libraryItemId || '').trim() || null,
    libraryPublicationId: String(member?.libraryPublicationId || '').trim() || null,
    registryId: String(member?.registryId || '').trim() || null,
    title: String(member?.title || member?.registryId || `Bundle item ${index + 1}`).trim(),
    contentHash: String(member?.contentHash || '').trim() || null,
  }));
  const body = JSON.stringify({
    kind: 'library_satchel_bundle_notice',
    librarySatchelRelayId: normalizedRelayId,
    scopeSetId: String(relay?.scopeSetId || bundleManifest.scopeSetId || '').trim() || null,
    bundleHash: String(bundleManifest.bundleHash || '').trim() || null,
    title: bundleTitle,
    memberCount: Math.max(0, Number(bundleManifest.memberCount || bundlePreview.length || 0)),
    orderedPublicationIds: Array.isArray(bundleManifest.orderedPublicationIds) ? bundleManifest.orderedPublicationIds : [],
    orderedRegistryIds: Array.isArray(bundleManifest.orderedRegistryIds) ? bundleManifest.orderedRegistryIds : [],
  });
  const message = makeInboxMsg({
    toHouseId: target.houseId,
    fromHouseId: sourceHouseId,
    body,
    status: 'accepted',
    kind: 'msg.library_satchel_bundle.v1',
  });
  message.transport = {
    kind: normalizedTransportKind,
    relayHints: [
      `library-satchel-relay:${normalizedRelayId}`,
      bundleManifest.bundleHash ? `bundle:${bundleManifest.bundleHash}` : '',
    ].filter(Boolean),
  };
  message.satchelRelay = {
    librarySatchelRelayId: normalizedRelayId,
    scopeSetId: String(relay?.scopeSetId || bundleManifest.scopeSetId || '').trim() || null,
    bundleHash: String(bundleManifest.bundleHash || '').trim() || null,
    sourceHouseId,
    targetHouseId: target.houseId,
    title: bundleTitle,
    memberCount: Math.max(0, Number(bundleManifest.memberCount || bundlePreview.length || 0)),
  };
  message.bundle = {
    scopeKind: String(bundleManifest.scopeKind || 'reading_table').trim() || 'reading_table',
    orderedItemIds: Array.isArray(bundleManifest.orderedItemIds) ? bundleManifest.orderedItemIds : [],
    orderedPublicationIds: Array.isArray(bundleManifest.orderedPublicationIds) ? bundleManifest.orderedPublicationIds : [],
    orderedRegistryIds: Array.isArray(bundleManifest.orderedRegistryIds) ? bundleManifest.orderedRegistryIds : [],
    members: bundlePreview,
  };
  const store = readStore();
  const dispatchResult = ponyTransportService.dispatch({
    store,
    message,
    transport: message.transport,
    context: {
      fromHouseId: sourceHouseId,
      toHouseId: target.houseId,
    },
  });
  message.dispatch = {
    receiptId: makeDispatchReceiptId(),
    ok: dispatchResult?.ok !== false,
    adapter: typeof dispatchResult?.adapter === 'string' && dispatchResult.adapter.trim()
      ? dispatchResult.adapter.trim()
      : 'relay.unknown.v1',
    transportKind: normalizedTransportKind,
    relayHints: Array.isArray(message.transport?.relayHints) ? message.transport.relayHints : [],
    dispatchedAt: nowIso(),
  };
  writeStore(store);
  return {
    targetHouseId: target.houseId,
    message,
    dispatch: message.dispatch,
  };
}

function buildSeededSealedContextRecord({
  houseId = '',
  traceId = '',
  runId = '',
  releasePolicy = 'manual',
  status = 'active',
} = {}) {
  const fixture = getUnifiedPlatformTestFixture('sealed_context_seed') || {};
  const sealedFixture = fixture?.sealedContext && typeof fixture.sealedContext === 'object'
    ? fixture.sealedContext
    : {};
  const allowedReaders = Array.isArray(sealedFixture.allowedReaders)
    ? sealedFixture.allowedReaders
    : [];
  const forbiddenSources = Array.isArray(sealedFixture.forbiddenSources)
    ? sealedFixture.forbiddenSources
    : [];
  return {
    sealedContextId: String(sealedFixture.sealedContextId || `seal_${randomHex(10)}`),
    traceId: String(traceId || '').trim() || null,
    runId: String(runId || '').trim() || null,
    entrantId: String(sealedFixture.entrantId || 'entrant_fixture_alpha'),
    scopeType: String(sealedFixture.scopeType || 'entrant_private'),
    scopeKey: String(sealedFixture.scopeKey || 'table-7'),
    allowedReaders,
    forbiddenSources,
    releasePolicy,
    status: String(status || sealedFixture.status || 'active'),
    houseId: String(houseId || '').trim() || null,
  };
}

function parsePokerOperatorFixtureRecords(records) {
  const sourceRecords = Array.isArray(records) ? records : [];
  return sourceRecords.map((entry) => {
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) return entry;
    if (typeof entry !== 'string') return null;
    try {
      return JSON.parse(entry);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

function deriveDeterministicSealId(entrantId) {
  const normalizedEntrantId = String(entrantId || '').trim();
  const digest = sha256PrefixedHex(`sealed:${normalizedEntrantId}`);
  return `seal_${digest.slice('sha256:'.length, 'sha256:'.length + 16)}`;
}

function allowedReaderIdsFromSealedContext(context) {
  const readers = Array.isArray(context?.allowedReaders) ? context.allowedReaders : [];
  return readers.map((entry) => {
    if (typeof entry === 'string') return entry.trim();
    if (entry && typeof entry === 'object' && typeof entry.actorId === 'string') return entry.actorId.trim();
    return '';
  }).filter(Boolean);
}

function getWebActionPolicy(actionId, webSession) {
  const canonicalActionId = String(actionId || '').trim();
  const base = {
    actionId: canonicalActionId,
    requiresApproval: false,
    requiresCredential: false,
    scopes: [],
    summary: 'Generic web action',
  };
  if (canonicalActionId === 'submit_reply') {
    return {
      ...base,
      requiresApproval: true,
      requiresCredential: true,
      scopes: ['repo:issue:write'],
      summary: 'Submit a GitHub issue reply'
    };
  }
  if (canonicalActionId === 'save_draft') {
    return {
      ...base,
      summary: 'Persist a local draft'
    };
  }
  if (webSession?.origin === 'https://github.com' && canonicalActionId === 'draft_reply') {
    return {
      ...base,
      summary: 'Draft a GitHub issue reply'
    };
  }
  return null;
}

function requireOwnedWebSession(req, res, requestId, webSessionId) {
  const session = requireBoundHumanSession(req, res, { requestId });
  if (!session) return { session: null, webSession: null };
  const webSession = getWebSessionById(webSessionId);
  if (!webSession) {
    sendPortalApiError(res, 404, 'NOT_FOUND', 'Web session not found.', { requestId });
    return { session: null, webSession: null };
  }
  if (webSession.portalSessionId !== session.sessionId) {
    sendPortalApiError(res, 403, 'FORBIDDEN', 'This web session belongs to a different Portal session.', { requestId });
    return { session: null, webSession: null };
  }
  return { session, webSession };
}

function proxyPolicyErrorCode(err) {
  const text = String(err?.message || '').toLowerCase();
  if (text.includes('denied address') || text.includes('private') || text.includes('link-local')) {
    return 'PRIVATE_NETWORK_BLOCKED';
  }
  return 'UNSAFE_TARGET';
}

function sendProxyPolicyContractError(res, err, requestId) {
  return sendPortalApiError(
    res,
    400,
    proxyPolicyErrorCode(err),
    'The requested target is blocked by Portal fetch policy.',
    {
      requestId,
      details: err?.details || {}
    }
  );
}

function makePortalApiSuccessBody(data, { requestId = buildPortalRequestId() } = {}) {
  return {
    ok: true,
    data,
    meta: makePortalApiMeta(requestId),
  };
}

function makePortalApiErrorBody(
  code,
  message,
  {
    requestId = buildPortalRequestId(),
    retryable = false,
    details = {},
  } = {}
) {
  return {
    ok: false,
    error: {
      code,
      message,
      retryable: retryable === true,
      details: details && typeof details === 'object' ? details : {},
    },
    meta: makePortalApiMeta(requestId),
  };
}

function readPlainHeader(headers, name) {
  if (!headers || typeof headers !== 'object') return '';
  const target = String(name || '').trim().toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (String(key || '').trim().toLowerCase() !== target) continue;
    if (Array.isArray(value)) return String(value[0] || '').trim();
    return String(value || '').trim();
  }
  return '';
}

function getPokerOperatorServiceToken() {
  const snapshot = getPokerOperatorSnapshot();
  return typeof snapshot?.serviceToken === 'string' && snapshot.serviceToken.trim()
    ? snapshot.serviceToken.trim()
    : DEFAULT_OPERATOR_TOKEN;
}

function normalizePokerOperatorMutationContext(headers) {
  const authorization = readPlainHeader(headers, 'authorization');
  if (!authorization.toLowerCase().startsWith('bearer ')) {
    throw Object.assign(new Error('Operator auth required.'), {
      status: 401,
      code: 'POKER_OPERATOR_AUTH_REQUIRED',
      details: {},
    });
  }
  const token = authorization.slice(7).trim();
  if (!token || token !== getPokerOperatorServiceToken()) {
    throw Object.assign(new Error('Operator auth required.'), {
      status: 401,
      code: 'POKER_OPERATOR_AUTH_REQUIRED',
      details: {},
    });
  }
  const idempotencyKey = readPlainHeader(headers, 'idempotency-key');
  if (!idempotencyKey) {
    throw Object.assign(new Error('Idempotency key is required.'), {
      status: 400,
      code: 'INVALID_ARGUMENT',
      details: {
        field: 'Idempotency-Key',
      },
    });
  }
  return {
    bearerToken: token,
    idempotencyKey,
    actor: token === getPokerOperatorServiceToken() ? 'portal_service' : 'operator_service',
  };
}

function respondPokerOperatorTransport(req, res) {
  const result = invokePokerOperatorTransport({
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    headers: req.headers,
    requestId: buildPortalRequestId(),
  });
  return res.status(result.status).json(result.body);
}

function invokePokerOperatorTransport({
  method,
  path,
  query = {},
  body = null,
  headers = {},
  requestId = buildPortalRequestId(),
}) {
  try {
    const normalizedMethod = String(method || 'GET').trim().toUpperCase();
    const normalizedPath = String(path || '').trim();
    const snapshot = getPokerOperatorSnapshot();

    if (normalizedMethod === 'GET' && normalizedPath === '/v1/health') {
      return {
        status: 200,
        body: makePortalApiSuccessBody({
          status: 'ok',
          operatorVersion: snapshot.operatorVersion,
          schemaVersion: snapshot.schemaVersion,
          time: nowIso(),
        }, { requestId }),
      };
    }

    if (normalizedMethod === 'GET' && normalizedPath === '/v1/seasons') {
      return {
        status: 200,
        body: makePortalApiSuccessBody(listPokerOperatorSeasons({
          cursor: typeof query?.cursor === 'string' ? query.cursor : null,
          limit: Number.parseInt(String(query?.limit || '20'), 10),
          status: typeof query?.status === 'string' ? query.status : '',
        }), { requestId }),
      };
    }

    const seasonDetailMatch = normalizedPath.match(/^\/v1\/seasons\/([^/]+)$/);
    if (normalizedMethod === 'GET' && seasonDetailMatch) {
      return {
        status: 200,
        body: makePortalApiSuccessBody(
          getPokerOperatorSeasonDetail(decodeURIComponent(seasonDetailMatch[1])),
          { requestId }
        ),
      };
    }

    const batchMatch = normalizedPath.match(/^\/v1\/batches\/([^/]+)$/);
    if (normalizedMethod === 'GET' && batchMatch) {
      return {
        status: 200,
        body: makePortalApiSuccessBody(
          getPokerOperatorBatchDetail(decodeURIComponent(batchMatch[1])),
          { requestId }
        ),
      };
    }

    const runReplayMatch = normalizedPath.match(/^\/v1\/runs\/([^/]+)\/replay$/);
    if (normalizedMethod === 'GET' && runReplayMatch) {
      return {
        status: 200,
        body: makePortalApiSuccessBody(
          getPokerOperatorReplayDetail(decodeURIComponent(runReplayMatch[1])),
          { requestId }
        ),
      };
    }

    const runMatch = normalizedPath.match(/^\/v1\/runs\/([^/]+)$/);
    if (normalizedMethod === 'GET' && runMatch) {
      return {
        status: 200,
        body: makePortalApiSuccessBody(
          getPokerOperatorRunDetail(decodeURIComponent(runMatch[1])),
          { requestId }
        ),
      };
    }

    const leaderboardSnapshotMatch = normalizedPath.match(/^\/v1\/leaderboards\/([^/]+)\/snapshots\/([^/]+)$/);
    if (normalizedMethod === 'GET' && leaderboardSnapshotMatch) {
      return {
        status: 200,
        body: makePortalApiSuccessBody(
          getPokerOperatorLeaderboardSnapshotDetail(
            decodeURIComponent(leaderboardSnapshotMatch[1]),
            decodeURIComponent(leaderboardSnapshotMatch[2])
          ),
          { requestId }
        ),
      };
    }

    const leaderboardHistoryMatch = normalizedPath.match(/^\/v1\/leaderboards\/([^/]+)\/snapshots$/);
    if (normalizedMethod === 'GET' && leaderboardHistoryMatch) {
      return {
        status: 200,
        body: makePortalApiSuccessBody(
          listPokerOperatorLeaderboardSnapshotHistory(decodeURIComponent(leaderboardHistoryMatch[1])),
          { requestId }
        ),
      };
    }

    const leaderboardLatestMatch = normalizedPath.match(/^\/v1\/leaderboards\/([^/]+)\/latest$/);
    if (normalizedMethod === 'GET' && leaderboardLatestMatch) {
      return {
        status: 200,
        body: makePortalApiSuccessBody(
          getPokerOperatorLatestLeaderboardDetail(decodeURIComponent(leaderboardLatestMatch[1])),
          { requestId }
        ),
      };
    }

    if (normalizedMethod === 'POST' && normalizedPath === '/v1/seasons') {
      const ctx = normalizePokerOperatorMutationContext(headers);
      return {
        status: 200,
        body: makePortalApiSuccessBody(
          createPokerOperatorSeason(body, {
            actor: ctx.actor,
            idempotencyKey: ctx.idempotencyKey,
          }),
          { requestId }
        ),
      };
    }

    const submissionMatch = normalizedPath.match(/^\/v1\/seasons\/([^/]+)\/submissions$/);
    if (normalizedMethod === 'POST' && submissionMatch) {
      const ctx = normalizePokerOperatorMutationContext(headers);
      return {
        status: 200,
        body: makePortalApiSuccessBody(
          createPokerOperatorSubmission(decodeURIComponent(submissionMatch[1]), body, {
            actor: ctx.actor,
            idempotencyKey: ctx.idempotencyKey,
          }),
          { requestId }
        ),
      };
    }

    const createBatchMatch = normalizedPath.match(/^\/v1\/seasons\/([^/]+)\/batches$/);
    if (normalizedMethod === 'POST' && createBatchMatch) {
      const ctx = normalizePokerOperatorMutationContext(headers);
      return {
        status: 200,
        body: makePortalApiSuccessBody(
          createPokerOperatorBatch(decodeURIComponent(createBatchMatch[1]), body, {
            actor: ctx.actor,
            idempotencyKey: ctx.idempotencyKey,
          }),
          { requestId }
        ),
      };
    }

    return {
      status: 404,
      body: makePortalApiErrorBody('NOT_FOUND', 'Operator route not found.', { requestId }),
    };
  } catch (err) {
    return {
      status: Number(err?.status || 500),
      body: makePortalApiErrorBody(
        typeof err?.code === 'string' && err.code ? err.code : 'INTERNAL_ERROR',
        typeof err?.message === 'string' && err.message ? err.message : 'Operator request failed.',
        {
          requestId,
          retryable: Number(err?.status || 500) >= 500,
          details: err?.details || {},
        }
      ),
    };
  }
}

function createPortalPokerOperatorClient() {
  return createPokerOperatorClient({
    transport: async ({ method, path, query, body, headers }) => invokePokerOperatorTransport({
      method,
      path,
      query,
      body,
      headers,
      requestId: buildPortalRequestId(),
    }),
  });
}

function resolvePrimaryWalletSubject(session, req) {
  const walletSubjects = collectWalletSubjectsForSession(session, req);
  const primary = walletSubjects[0] || null;
  if (!primary?.address) return null;
  return {
    walletSubject: primary.address,
    submitterWallet: {
      chain: primary.chain,
      address: primary.address,
    },
  };
}

async function syncPokerMirrorFromOperator({ seasonId = '' } = {}) {
  const client = createPortalPokerOperatorClient();
  const health = await client.health();
  const seasonIds = [];
  if (seasonId) {
    seasonIds.push(seasonId);
  } else {
    let cursor = null;
    do {
      const page = await client.listSeasons({ cursor, limit: 100 });
      for (const item of page.items) {
        if (item?.seasonId) seasonIds.push(item.seasonId);
      }
      cursor = page.nextCursor || null;
    } while (cursor);
  }
  const counts = {
    seasons: 0,
    leaderboards: 0,
    batches: 0,
    runs: 0,
    replays: 0,
  };
  for (const itemSeasonId of seasonIds) {
    const season = await client.getSeason(itemSeasonId);
    upsertPokerSeason({
      seasonId: season.seasonId,
      seasonSlug: season.seasonSlug,
      displayName: season.displayName,
      rulesVersion: season.rulesVersion,
      operatorVersion: season.operatorVersion,
      status: season.status,
      submissionOpenAt: season.submissionOpenAt,
      submissionCloseAt: season.submissionCloseAt,
      divisions: season.divisions,
      raw: season,
      createdAt: season.createdAt || nowIso(),
      updatedAt: season.updatedAt || nowIso(),
    });
    counts.seasons += 1;

    if (season?.latestLeaderboardSnapshot?.snapshotId) {
      const history = await client.listLeaderboardSnapshots(season.seasonId);
      const operatorHistory = listPokerOperatorLeaderboardSnapshotHistory(season.seasonId);
      const snapshotMap = new Map();
      for (const snapshot of Array.isArray(history?.items) ? history.items : []) {
        if (!snapshot?.snapshotId) continue;
        snapshotMap.set(snapshot.snapshotId, snapshot);
      }
      for (const snapshot of Array.isArray(operatorHistory?.items) ? operatorHistory.items : []) {
        if (!snapshot?.snapshotId) continue;
        if (!snapshotMap.has(snapshot.snapshotId)) {
          snapshotMap.set(snapshot.snapshotId, snapshot);
        }
      }
      if (!snapshotMap.size) {
        const latest = await client.getLatestLeaderboard(season.seasonId);
        if (latest?.snapshotId) {
          snapshotMap.set(latest.snapshotId, latest);
        }
      }
      const snapshotItems = Array.from(snapshotMap.values()).sort((left, right) => {
        const leftTime = Date.parse(String(left?.createdAt || ''));
        const rightTime = Date.parse(String(right?.createdAt || ''));
        if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) {
          return rightTime - leftTime;
        }
        return String(right?.snapshotId || '').localeCompare(String(left?.snapshotId || ''));
      });
      for (const snapshot of snapshotItems) {
        if (!snapshot?.snapshotId) continue;
        upsertPokerLeaderboardSnapshot({
          snapshotId: snapshot.snapshotId,
          seasonId: season.seasonId,
          rankings: snapshot.rankings,
          raw: snapshot,
          createdAt: snapshot.createdAt || nowIso(),
          updatedAt: snapshot.createdAt || nowIso(),
        });
        counts.leaderboards += 1;
      }
    }

    if (season?.latestReplayHighlight?.runId) {
      const run = await client.getRun(season.latestReplayHighlight.runId);
      if (run?.batchId) {
        const batch = await client.getBatch(run.batchId);
        upsertPokerBatch({
          batchId: batch.batchId,
          seasonId: batch.seasonId,
          batchKind: batch.batchKind,
          submissionIds: batch.submissionIds,
          batchConfig: batch.batchConfig,
          status: batch.status,
          raw: batch,
          createdAt: batch.createdAt || nowIso(),
          updatedAt: batch.updatedAt || nowIso(),
        });
        counts.batches += 1;
      }
      upsertPokerRun({
        runId: run.runId,
        batchId: run.batchId,
        seasonId: run.seasonId,
        summary: run.summary,
        raw: run,
        createdAt: run.createdAt || nowIso(),
        updatedAt: run.updatedAt || nowIso(),
      });
      counts.runs += 1;
      try {
        const replay = await client.getReplay(run.runId);
        upsertPokerReplayArtifact({
          runId: replay.runId,
          replayFormat: replay.replay.replayFormat,
          summary: replay.replay.summaryJson,
          eventsJsonlUri: replay.replay.eventsJsonlUri,
          artifactSha256: replay.replay.artifactSha256,
          contentType: replay.replay.contentType,
          raw: replay.replay,
          createdAt: run.createdAt || nowIso(),
          updatedAt: run.updatedAt || nowIso(),
        });
        counts.replays += 1;
      } catch (err) {
        if (err?.code !== 'POKER_REPLAY_NOT_READY') throw err;
      }
    }
  }
  return {
    health,
    seasonIds,
    counts,
  };
}

function summarizeMirroredPokerSeason(season) {
  if (!season) return null;
  const latestSnapshot = getLatestPokerLeaderboardSnapshot(season.seasonId);
  const raw = season.raw && typeof season.raw === 'object' ? season.raw : {};
  const openAt = typeof season.submissionOpenAt === 'string' && season.submissionOpenAt.trim()
    ? season.submissionOpenAt
    : null;
  const closeAt = typeof season.submissionCloseAt === 'string' && season.submissionCloseAt.trim()
    ? season.submissionCloseAt
    : null;
  const normalizedStatus = String(season.status || '').trim().toLowerCase();
  const rulesSummary = raw.rulesSummary && typeof raw.rulesSummary === 'object' && !Array.isArray(raw.rulesSummary)
    ? {
      summary: typeof raw.rulesSummary.summary === 'string' && raw.rulesSummary.summary.trim()
        ? raw.rulesSummary.summary.trim()
        : `Mirrored ${String(season.rulesVersion || 'poker rules')} configuration.`,
      highlights: Array.isArray(raw.rulesSummary.highlights)
        ? raw.rulesSummary.highlights.map((item) => String(item || '').trim()).filter(Boolean)
        : [],
    }
    : {
      summary: typeof raw.rulesSummary === 'string' && raw.rulesSummary.trim()
        ? raw.rulesSummary.trim()
        : `Mirrored ${String(season.rulesVersion || 'poker rules')} configuration.`,
      highlights: [],
    };
  let submissionWindowState = normalizedStatus || 'scheduled';
  if (!submissionWindowState) {
    submissionWindowState = 'scheduled';
  }
  const submissionWindow = {
    opensAt: openAt,
    closesAt: closeAt,
    state: submissionWindowState,
    acceptingSubmissions: submissionWindowState === 'open',
  };
  return {
    seasonId: season.seasonId,
    seasonSlug: season.seasonSlug,
    displayName: season.displayName,
    rulesVersion: season.rulesVersion,
    operatorVersion: season.operatorVersion,
    status: season.status,
    submissionOpenAt: season.submissionOpenAt,
    submissionCloseAt: season.submissionCloseAt,
    rulesSummary,
    submissionWindow,
    bundleDraft: raw.bundleDraft && typeof raw.bundleDraft === 'object'
      ? {
        contentAddress: typeof raw.bundleDraft.contentAddress === 'string' ? raw.bundleDraft.contentAddress : '',
        artifactUri: typeof raw.bundleDraft.artifactUri === 'string' ? raw.bundleDraft.artifactUri : '',
        entrypoint: typeof raw.bundleDraft.entrypoint === 'string' ? raw.bundleDraft.entrypoint : '',
        declaredCapabilities: raw.bundleDraft.declaredCapabilities && typeof raw.bundleDraft.declaredCapabilities === 'object'
          ? raw.bundleDraft.declaredCapabilities
          : {},
        expectedContentAddress: typeof raw.bundleDraft.expectedContentAddress === 'string'
          ? raw.bundleDraft.expectedContentAddress
          : '',
        expectedManifestHash: typeof raw.bundleDraft.expectedManifestHash === 'string'
          ? raw.bundleDraft.expectedManifestHash
          : '',
      }
      : null,
    divisions: season.divisions,
    latestLeaderboardSnapshot: latestSnapshot ? {
      snapshotId: latestSnapshot.snapshotId,
      createdAt: latestSnapshot.createdAt,
    } : null,
    latestReplayHighlight: raw.latestReplayHighlight || null,
  };
}

function computePokerArtifactSha256(rawReplay) {
  const eventsJsonl = typeof rawReplay?.eventsJsonl === 'string' ? rawReplay.eventsJsonl : '';
  if (!eventsJsonl) return null;
  return `sha256:${crypto.createHash('sha256').update(eventsJsonl, 'utf8').digest('hex')}`;
}

function isBlockedPortalContractHostname(hostname) {
  const host = String(hostname || '').trim().toLowerCase().replace(/\.+$/, '');
  if (!host) return true;
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return true;
  const ipVersion = net.isIP(host);
  if (!ipVersion) return false;
  if (ipVersion === 6) {
    if (host === '::1') return true;
    if (host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80:')) return true;
    return false;
  }
  const parts = host.split('.').map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }
  if (parts[0] === 10) return true;
  if (parts[0] === 127) return true;
  if (parts[0] === 169 && parts[1] === 254) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  return false;
}

function assertPortalContractTargetAllowed(targetUrl) {
  let parsed;
  try {
    parsed = new URL(String(targetUrl || ''));
  } catch {
    const err = new Error('INVALID_URL');
    err.code = 'INVALID_URL';
    throw err;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    const err = new Error('PROTOCOL_NOT_ALLOWED');
    err.code = 'PROXY_TARGET_BLOCKED';
    err.details = { protocol: parsed.protocol || null };
    throw err;
  }
  if (parsed.username || parsed.password) {
    const err = new Error('EMBEDDED_CREDENTIALS_NOT_ALLOWED');
    err.code = 'PROXY_TARGET_BLOCKED';
    err.details = {};
    throw err;
  }
  if (isBlockedPortalContractHostname(parsed.hostname)) {
    const err = new Error('PRIVATE_NETWORK_BLOCKED');
    err.code = 'PROXY_TARGET_BLOCKED';
    err.details = { hostname: parsed.hostname };
    throw err;
  }
  return parsed;
}

function normalizePrivyWalletRpcSolanaTransaction(value) {
  if (typeof value !== 'string') throw new Error('INVALID_PRIVY_WALLET_RPC_SOLANA_TX');
  const trimmed = value.trim();
  if (!trimmed) throw new Error('INVALID_PRIVY_WALLET_RPC_SOLANA_TX');
  if (!/^[A-Za-z0-9+/=_-]+$/.test(trimmed)) throw new Error('INVALID_PRIVY_WALLET_RPC_SOLANA_TX');
  const normalized = trimmed.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4;
  const padded = pad === 0 ? normalized : `${normalized}${'='.repeat(4 - pad)}`;
  try {
    const decoded = Buffer.from(padded, 'base64');
    if (!decoded.length) throw new Error('INVALID_PRIVY_WALLET_RPC_SOLANA_TX');
    return padded;
  } catch {
    throw new Error('INVALID_PRIVY_WALLET_RPC_SOLANA_TX');
  }
}

function normalizePrivyWalletRpcSolanaEncoding(value) {
  if (value == null) return 'base64';
  const trimmed = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!trimmed) return 'base64';
  if (trimmed !== 'base64') throw new Error('INVALID_PRIVY_WALLET_RPC_SOLANA_ENCODING');
  return trimmed;
}

function normalizePrivySolanaCaip2(value) {
  if (value == null || (typeof value === 'string' && !value.trim())) return null;
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) return null;
  if (!/^solana:[1-9A-HJ-NP-Za-km-z]{16,64}$/.test(trimmed)) {
    throw new Error('INVALID_PRIVY_WALLET_RPC_CAIP2');
  }
  return trimmed;
}

function normalizePrivyWalletRpcBody(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('INVALID_PRIVY_WALLET_RPC_BODY');
  }

  const method = typeof input.method === 'string' ? input.method.trim() : '';
  if (method === 'eth_sendTransaction') {
    const chainTypeRaw = typeof input.chain_type === 'string'
      ? input.chain_type
      : typeof input.chainType === 'string'
        ? input.chainType
        : '';
    const chainType = chainTypeRaw.trim().toLowerCase();
    if (chainType !== 'ethereum') throw new Error('INVALID_PRIVY_WALLET_RPC_CHAIN');

    if (input.sponsor !== true) throw new Error('INVALID_PRIVY_WALLET_RPC_SPONSOR');
    const params = input.params && typeof input.params === 'object' ? input.params : null;
    if (!params || Array.isArray(params)) throw new Error('INVALID_PRIVY_WALLET_RPC_PARAMS');

    const transaction = normalizePrivyWalletRpcEvmTx(params.transaction);
    const caip2 = normalizePrivyCaip2(input.caip2, transaction.chain_id || null);

    return {
      chain_type: 'ethereum',
      method: 'eth_sendTransaction',
      params: { transaction },
      sponsor: true,
      ...(caip2 ? { caip2 } : {})
    };
  }

  if (method === 'signAndSendTransaction') {
    const chainTypeRaw = typeof input.chain_type === 'string'
      ? input.chain_type
      : typeof input.chainType === 'string'
        ? input.chainType
        : '';
    const chainType = chainTypeRaw.trim().toLowerCase();
    if (chainType && chainType !== 'solana') throw new Error('INVALID_PRIVY_WALLET_RPC_CHAIN');

    if (input.sponsor !== true) throw new Error('INVALID_PRIVY_WALLET_RPC_SPONSOR');
    const params = input.params && typeof input.params === 'object' ? input.params : null;
    if (!params || Array.isArray(params)) throw new Error('INVALID_PRIVY_WALLET_RPC_PARAMS');

    const transaction = normalizePrivyWalletRpcSolanaTransaction(params.transaction);
    const encoding = normalizePrivyWalletRpcSolanaEncoding(params.encoding);
    const caip2 = normalizePrivySolanaCaip2(input.caip2);

    return {
      method: 'signAndSendTransaction',
      params: { transaction, encoding },
      sponsor: true,
      ...(caip2 ? { caip2 } : {})
    };
  }

  throw new Error('INVALID_PRIVY_WALLET_RPC_METHOD');
}

function buildPrivyWalletRpcSigningPayload(walletId, body) {
  return {
    version: 1,
    url: `${PRIVY_API_BASE_URL}/v1/wallets/${encodeURIComponent(walletId)}/rpc`,
    method: 'POST',
    headers: {
      'privy-app-id': PRIVY_APP_ID
    },
    body
  };
}

function hasPrivyServerAuth() {
  return !!(PRIVY_APP_ID && PRIVY_APP_SECRET);
}

function getPrivyBasicAuthHeader() {
  if (!hasPrivyServerAuth()) return '';
  return `Basic ${Buffer.from(`${PRIVY_APP_ID}:${PRIVY_APP_SECRET}`).toString('base64')}`;
}

async function fetchPrivyTransactionStatus(transactionId) {
  const id = normalizePrivyTransactionId(transactionId);
  if (!id) {
    const err = new Error('MISSING_PRIVY_TRANSACTION_ID');
    err.status = 400;
    throw err;
  }
  if (!hasPrivyServerAuth()) {
    const err = new Error('PRIVY_SERVER_AUTH_NOT_CONFIGURED');
    err.status = 503;
    throw err;
  }

  const endpoint = `${PRIVY_API_BASE_URL}/v1/transactions/${encodeURIComponent(id)}`;
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      authorization: getPrivyBasicAuthHeader(),
      'privy-app-id': PRIVY_APP_ID
    }
  });
  const rawBody = await response.text();
  let payload = {};
  if (rawBody) {
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = {};
    }
  }

  if (!response.ok) {
    const err = new Error('PRIVY_TRANSACTION_STATUS_UNAVAILABLE');
    err.status = response.status >= 400 ? response.status : 502;
    let detail = payload?.error?.message || payload?.message;
    if (detail === undefined || detail === null) {
      const errorObj = payload?.error;
      if (typeof errorObj === 'string') {
        detail = errorObj;
      } else if (errorObj && typeof errorObj === 'object') {
        if (typeof errorObj.error === 'string' && errorObj.error.trim()) {
          const code = typeof errorObj.code === 'string' && errorObj.code.trim() ? `${errorObj.code.trim()}: ` : '';
          detail = `${code}${errorObj.error.trim()}`;
        } else if (typeof errorObj.message === 'string' && errorObj.message.trim()) {
          detail = errorObj.message.trim();
        }
      }
    }
    if (!detail) detail = rawBody;
    if (typeof detail === 'string' && detail.trim()) err.detail = detail.trim();
    throw err;
  }

  const tx = payload?.data && typeof payload.data === 'object'
    ? payload.data
    : payload?.transaction && typeof payload.transaction === 'object'
      ? payload.transaction
      : payload;
  const status = typeof tx?.status === 'string' && tx.status.trim()
    ? tx.status.trim()
    : typeof tx?.state === 'string' && tx.state.trim()
      ? tx.state.trim()
      : '';
  const transactionHash = normalizePrivyTransactionHash(
    tx?.hash
    || tx?.transaction_hash
    || tx?.transactionHash
    || tx?.txHash
  );
  const userOperationHash = normalizePrivyTransactionHash(
    tx?.user_operation_hash
    || tx?.userOperationHash
  );

  return {
    id,
    status,
    transactionHash,
    userOperationHash
  };
}

async function relayPrivyWalletRpc({ walletId, body, authorizationSignature }) {
  const normalizedWalletId = normalizePrivyWalletId(walletId);
  if (!normalizedWalletId) {
    const err = new Error('INVALID_PRIVY_WALLET_ID');
    err.status = 400;
    throw err;
  }
  const signature = typeof authorizationSignature === 'string' ? authorizationSignature.trim() : '';
  if (!signature) {
    const err = new Error('MISSING_PRIVY_AUTH_SIGNATURE');
    err.status = 400;
    throw err;
  }
  if (!hasPrivyServerAuth()) {
    const err = new Error('PRIVY_SERVER_AUTH_NOT_CONFIGURED');
    err.status = 503;
    throw err;
  }

  const endpoint = `${PRIVY_API_BASE_URL}/v1/wallets/${encodeURIComponent(normalizedWalletId)}/rpc`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: getPrivyBasicAuthHeader(),
      'privy-app-id': PRIVY_APP_ID,
      'privy-authorization-signature': signature
    },
    body: JSON.stringify(body)
  });

  const rawBody = await response.text();
  let payload = {};
  if (rawBody) {
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = {};
    }
  }

  if (!response.ok) {
    const err = new Error('PRIVY_WALLET_RPC_RELAY_FAILED');
    err.status = response.status >= 400 ? response.status : 502;
    let detail = payload?.error?.message || payload?.message;
    if (detail === undefined || detail === null) {
      const errorObj = payload?.error;
      if (typeof errorObj === 'string') {
        detail = errorObj;
      } else if (errorObj && typeof errorObj === 'object') {
        if (typeof errorObj.error === 'string' && errorObj.error.trim()) {
          const code = typeof errorObj.code === 'string' && errorObj.code.trim() ? `${errorObj.code.trim()}: ` : '';
          detail = `${code}${errorObj.error.trim()}`;
        } else if (typeof errorObj.message === 'string' && errorObj.message.trim()) {
          detail = errorObj.message.trim();
        }
      }
    }
    if (!detail) detail = rawBody;
    if (typeof detail === 'string' && detail.trim()) err.detail = detail.trim();
    throw err;
  }

  return payload?.data && typeof payload.data === 'object' ? payload.data : payload;
}

app.get('/api/onboarding/status', (req, res) => {
  const s = ensureHumanSession(req, res);
  const onboarding = ensureSessionOnboarding(s);
  const flowStep = normalizeOnboardingStep(onboarding?.step);

  let step = 1;
  let done = false;
  if (onboarding.required !== true) {
    step = 7;
    done = true;
  } else if (onboarding.registrationComplete !== true) {
    step = 2;
  } else if (flowStep === ONBOARDING_STEP_BRAIN) {
    step = 4;
  } else if (flowStep === ONBOARDING_STEP_SIGIL) {
    step = 5;
  } else if (flowStep === ONBOARDING_STEP_CEREMONY) {
    step = 6;
  } else if (flowStep === ONBOARDING_STEP_DONE) {
    step = 7;
    done = true;
  } else {
    step = 4;
  }

  return res.json({
    ok: true,
    step,
    done,
    hasWallet: onboarding.registrationComplete === true || step > 1
  });
});

app.get('/api/privy/config', (_req, res) => {
  const publicConfig = PRIVY_ENABLED
    ? {
        ...PRIVY_PUBLIC_CONFIG,
        ...(process.env.NODE_ENV === 'test' ? { testMode: true } : {}),
        ...(process.env.NODE_ENV === 'test' && process.env.TEST_RESET_TOKEN
          ? { testResetToken: process.env.TEST_RESET_TOKEN }
          : {})
      }
    : null;
  res.json({
    ok: true,
    enabled: PRIVY_ENABLED,
    config: publicConfig,
    startPageEnabled: START_PAGE_ENABLED,
    appPath: '/app'
  });
});

app.get('/api/privy/transactions/:transactionId', async (req, res) => {
  if (!PRIVY_ENABLED) return res.status(503).json({ ok: false, error: 'PRIVY_DISABLED' });
  const transactionId = normalizePrivyTransactionId(req.params?.transactionId || '');
  if (!transactionId) return res.status(400).json({ ok: false, error: 'MISSING_PRIVY_TRANSACTION_ID' });

  try {
    const status = await fetchPrivyTransactionStatus(transactionId);
    return res.json({
      ok: true,
      transaction: {
        id: status.id,
        status: status.status,
        transactionHash: status.transactionHash,
        userOperationHash: status.userOperationHash
      }
    });
  } catch (err) {
    const status = Number(err?.status || 0) || (String(err?.message || '').includes('MISSING_') ? 400 : 502);
    const detail = typeof err?.detail === 'string' && err.detail.trim() ? err.detail.trim() : null;
    return res.status(status).json({
      ok: false,
      error: String(err?.message || 'PRIVY_TRANSACTION_STATUS_UNAVAILABLE'),
      ...(detail ? { detail } : {})
    });
  }
});

app.post('/api/privy/wallet-rpc/prepare', (req, res) => {
  if (!PRIVY_ENABLED) return res.status(503).json({ ok: false, error: 'PRIVY_DISABLED' });
  if (!hasPrivyServerAuth()) return res.status(503).json({ ok: false, error: 'PRIVY_SERVER_AUTH_NOT_CONFIGURED' });

  try {
    const walletId = normalizePrivyWalletId(req.body?.walletId);
    if (!walletId) return res.status(400).json({ ok: false, error: 'INVALID_PRIVY_WALLET_ID' });
    const body = normalizePrivyWalletRpcBody(req.body?.body);
    const signingPayload = buildPrivyWalletRpcSigningPayload(walletId, body);
    return res.json({ ok: true, walletId, body, signingPayload });
  } catch (err) {
    const code = String(err?.message || 'PRIVY_WALLET_RPC_PREPARE_FAILED');
    const status = code.startsWith('INVALID_') || code.startsWith('MISSING_') ? 400 : 502;
    return res.status(status).json({ ok: false, error: code });
  }
});

app.post('/api/privy/wallet-rpc/relay', async (req, res) => {
  if (!PRIVY_ENABLED) return res.status(503).json({ ok: false, error: 'PRIVY_DISABLED' });

  try {
    const walletId = normalizePrivyWalletId(req.body?.walletId);
    if (!walletId) return res.status(400).json({ ok: false, error: 'INVALID_PRIVY_WALLET_ID' });
    const body = normalizePrivyWalletRpcBody(req.body?.body);
    const signature = typeof req.body?.signature === 'string'
      ? req.body.signature
      : typeof req.body?.authorizationSignature === 'string'
        ? req.body.authorizationSignature
        : '';
    const result = await relayPrivyWalletRpc({
      walletId,
      body,
      authorizationSignature: signature
    });
    return res.json({ ok: true, result });
  } catch (err) {
    const status = Number(err?.status || 0) || (String(err?.message || '').startsWith('MISSING_') ? 400 : 502);
    const detail = typeof err?.detail === 'string' && err.detail.trim() ? err.detail.trim() : null;
    return res.status(status).json({
      ok: false,
      error: String(err?.message || 'PRIVY_WALLET_RPC_RELAY_FAILED'),
      ...(detail ? { detail } : {})
    });
  }
});

app.post('/api/referral', (req, res) => {
  const s = ensureHumanSession(req, res);
  const shareId = typeof req.body?.shareId === 'string' ? req.body.shareId.trim() : '';
  if (!shareId) return res.status(400).json({ ok: false, error: 'MISSING_SHARE_ID' });
  const store = readStore();
  const share = store.shares.find((x) => x.id === shareId);
  if (!share) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  s.referral.shareId = shareId;
  res.json({ ok: true });
});

app.get('/api/townhall/state', (req, res) => {
  const s = ensureHumanSession(req, res);
  const onboarding = ensureSessionOnboarding(s);
  const houseId = s.houseCeremony?.houseId || null;
  res.json({
    ok: true,
    houseId,
    locked: onboarding.required === true && !houseId,
    onboarding: cloneOnboarding(onboarding)
  });
});

app.get('/api/townhall/mint/config', async (_req, res) => {
  const caps = townhallMintCapabilities();
  let sponsorSendEnabled = false;
  let sponsorFeePayer = null;
  let sponsorSendError = null;
  if (caps.solanaSponsorEnabled) {
    try {
      const feePayer = await loadSolanaFeePayerKeypair();
      if (feePayer) {
        sponsorSendEnabled = true;
        sponsorFeePayer = feePayer.publicKey.toBase58();
      }
    } catch (err) {
      sponsorSendEnabled = false;
      sponsorSendError = String(err?.message || 'SOLANA_SPONSOR_NOT_CONFIGURED');
    }
  }
  res.json({
    ok: true,
    mint: {
      enabled: caps.enabled,
      pinataEnabled: caps.pinataEnabled,
      evm: {
        enabled: caps.evmEnabled,
        chainId: EVM_ERC8004_CHAIN_ID,
        network: EVM_ERC8004_NETWORK,
        rpcUrl: EVM_ERC8004_RPC_URL || null,
        contractAddress: EVM_ERC8004_IDENTITY_REGISTRY
      },
      solana: {
        enabled: caps.solanaEnabled,
        cluster: SOLANA_ERC8004_CLUSTER,
        rpcUrl: SOLANA_ERC8004_RPC_URL || null,
        web3ModuleUrl: SOLANA_WEB3_MODULE_URL || null,
        sponsorSendEnabled,
        sponsorFeePayer,
        sponsorSendError
      }
    }
  });
});

app.post('/api/townhall/mint/evm/prepare', async (req, res) => {
  const s = requireTownhallMintPrepareAccess(req, res);
  if (!s) return;
  const onboarding = ensureSessionOnboarding(s);
  const caps = townhallMintCapabilities();
  if (!caps.enabled) return res.status(503).json({ ok: false, error: 'MINT_DISABLED' });
  if (!caps.pinataEnabled) return res.status(503).json({ ok: false, error: 'PINATA_NOT_CONFIGURED' });
  if (!caps.evmEnabled) return res.status(503).json({ ok: false, error: 'MINT_EVM_NOT_CONFIGURED' });

  const walletInput = typeof req.body?.walletAddress === 'string' ? req.body.walletAddress.trim() : '';
  const walletAddress = walletInput ? normalizeEvmAddress(walletInput) : null;
  if (walletInput && !walletAddress) return res.status(400).json({ ok: false, error: 'INVALID_EVM_ADDRESS' });

  const normalized = normalizeTownhallMintProfile(req.body?.profile, onboarding);
  if (normalized.error) return res.status(400).json({ ok: false, error: normalized.error });
  const subject = normalizeTownhallMintSubject(req.body?.subject || 'agent');
  if (!subject) return res.status(400).json({ ok: false, error: 'INVALID_MINT_SUBJECT' });

  const origin = `${req.protocol}://${req.get('host')}`;
  const metadata = buildTownhallMintMetadata({
    profile: normalized.profile,
    chain: `evm:${EVM_ERC8004_NETWORK}`,
    walletAddress,
    origin,
    subject
  });
  const subjectName = subject === 'human' ? normalized.profile.humanName : normalized.profile.agentName;
  const subjectSlug = subjectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || subject;

  try {
    const cid = await pinJsonToIpfs(metadata, {
      name: `agent-town-evm-${subject}-${subjectSlug}`
    });
    return res.json({
      ok: true,
      tokenUri: `ipfs://${cid}`,
      metadataCid: cid,
      subject,
      evm: {
        chainId: EVM_ERC8004_CHAIN_ID,
        network: EVM_ERC8004_NETWORK,
        rpcUrl: EVM_ERC8004_RPC_URL || null,
        contractAddress: EVM_ERC8004_IDENTITY_REGISTRY
      }
    });
  } catch (err) {
    const code = String(err?.code || err?.message || 'PINATA_UPLOAD_FAILED');
    const status = code === 'PINATA_NOT_CONFIGURED' ? 503 : 502;
    const detail = summarizePinataFailureDetail(err?.detail || err?.message);
    return res.status(status).json({ ok: false, error: code, ...(detail ? { detail } : {}) });
  }
});

app.post('/api/townhall/mint/solana/prepare', async (req, res) => {
  const s = requireTownhallMintPrepareAccess(req, res);
  if (!s) return;
  const onboarding = ensureSessionOnboarding(s);
  const caps = townhallMintCapabilities();
  if (!caps.enabled) return res.status(503).json({ ok: false, error: 'MINT_DISABLED' });
  if (!caps.pinataEnabled) return res.status(503).json({ ok: false, error: 'PINATA_NOT_CONFIGURED' });
  if (!caps.solanaEnabled) return res.status(503).json({ ok: false, error: 'MINT_SOLANA_NOT_CONFIGURED' });

  const walletInput = typeof req.body?.walletAddress === 'string' ? req.body.walletAddress.trim() : '';
  const walletAddress = normalizeSolanaAddress(walletInput);
  if (!walletAddress) return res.status(400).json({ ok: false, error: 'MISSING_SOLANA_ADDRESS' });

  const assetInput = typeof req.body?.assetPubkey === 'string' ? req.body.assetPubkey.trim() : '';
  const assetPubkey = normalizeSolanaAddress(assetInput);
  if (!assetPubkey) return res.status(400).json({ ok: false, error: 'MISSING_SOLANA_ASSET_PUBKEY' });

  const normalized = normalizeTownhallMintProfile(req.body?.profile, onboarding);
  if (normalized.error) return res.status(400).json({ ok: false, error: normalized.error });
  const subject = normalizeTownhallMintSubject(req.body?.subject || 'agent');
  if (!subject) return res.status(400).json({ ok: false, error: 'INVALID_MINT_SUBJECT' });

  const origin = `${req.protocol}://${req.get('host')}`;
  const metadata = buildTownhallMintMetadata({
    profile: normalized.profile,
    chain: `solana:${SOLANA_ERC8004_CLUSTER}`,
    walletAddress,
    origin,
    subject
  });
  const subjectName = subject === 'human' ? normalized.profile.humanName : normalized.profile.agentName;
  const subjectSlug = subjectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || subject;

  let tokenUri = '';
  let metadataCid = '';
  try {
    metadataCid = await pinJsonToIpfs(metadata, {
      name: `agent-town-solana-${subject}-${subjectSlug}`
    });
    tokenUri = `ipfs://${metadataCid}`;
  } catch (err) {
    const code = String(err?.code || err?.message || 'PINATA_UPLOAD_FAILED');
    const status = code === 'PINATA_NOT_CONFIGURED' ? 503 : 502;
    const detail = summarizePinataFailureDetail(err?.detail || err?.message);
    return res.status(status).json({ ok: false, error: code, ...(detail ? { detail } : {}) });
  }

  try {
    const [sdkModule, web3] = await Promise.all([
      loadSolanaSdkModule(),
      loadSolanaWeb3Module()
    ]);
    const { SolanaSDK } = sdkModule;
    const { PublicKey } = web3;
    let feePayerKey = null;
    if (caps.solanaSponsorEnabled) {
      try {
        const feePayer = await loadSolanaFeePayerKeypair();
        feePayerKey = feePayer?.publicKey || null;
      } catch (err) {
        const code = String(err?.message || 'SOLANA_SPONSOR_NOT_CONFIGURED');
        const status = code === 'SOLANA_SPONSOR_SECRET_INVALID' ? 500 : 503;
        return res.status(status).json({ ok: false, error: code });
      }
    }
    if (feePayerKey && typeof feePayerKey.toBase58 === 'function' && feePayerKey.toBase58() === walletAddress) {
      return res.status(400).json({
        ok: false,
        error: 'SOLANA_SPONSOR_FEEPAYER_MATCHES_WALLET',
        detail: 'Server sponsor fee payer must be a separate funded keypair, not the user wallet.'
      });
    }
    const { prepared, rpcUrl: solanaPrepareRpcUrl } = await prepareSolanaRegistrationWithRpcFallback({
      SolanaSDK,
      cluster: SOLANA_ERC8004_CLUSTER,
      tokenUri,
      signer: new PublicKey(walletAddress),
      assetPubkey: new PublicKey(assetPubkey),
      feePayer: feePayerKey || undefined
    });

    if (!prepared || typeof prepared !== 'object') {
      return res.status(502).json({ ok: false, error: 'SOLANA_PREPARE_FAILED' });
    }
    if ('success' in prepared && prepared.success === false) {
      return res.status(502).json({ ok: false, error: 'SOLANA_PREPARE_FAILED', detail: prepared.error || null });
    }
    if (typeof prepared.transaction !== 'string' || !prepared.transaction.trim()) {
      return res.status(502).json({ ok: false, error: 'SOLANA_PREPARE_FAILED' });
    }

    const preparedAsset = prepared.asset && typeof prepared.asset.toBase58 === 'function'
      ? prepared.asset.toBase58()
      : assetPubkey;
    let preparedTransactionBase64 = prepared.transaction;
    let preparedTx = null;
    if (feePayerKey) {
      const adjusted = applyFeePayerToPreparedSolanaTransaction({
        preparedTransaction: preparedTransactionBase64,
        feePayerPubkey: feePayerKey,
        web3
      });
      if (!adjusted || !adjusted.serialized || adjusted.signerSlotPresent !== true) {
        return res.status(502).json({
          ok: false,
          error: 'SOLANA_PREPARE_FAILED',
          detail: 'Prepared Solana transaction could not be adjusted for sponsor fee payer.'
        });
      }
      preparedTransactionBase64 = adjusted.serialized;
      preparedTx = adjusted.transaction;
    } else {
      const preparedBytes = decodeTownhallSponsoredSolanaTransaction(preparedTransactionBase64);
      preparedTx = preparedBytes
        ? deserializeTownhallSponsoredSolanaTransaction({ txBytes: preparedBytes, web3 })
        : null;
    }
    const messageHash = hashTownhallSolanaTransactionMessage(preparedTx);
    if (!messageHash) {
      return res.status(502).json({ ok: false, error: 'SOLANA_PREPARE_FAILED' });
    }

    const nowMs = Date.now();
    const pending = Array.isArray(onboarding.pendingSolanaMints) ? onboarding.pendingSolanaMints : [];
    const filteredPending = pending.filter((entry) => {
      if (!entry || typeof entry !== 'object') return false;
      const createdAtMs = Number(entry.createdAtMs || 0);
      if (!Number.isFinite(createdAtMs) || createdAtMs < 1) return false;
      return nowMs - createdAtMs <= 10 * 60 * 1000;
    });
    filteredPending.push({
      subject,
      walletAddress,
      assetPubkey: preparedAsset,
      messageHash,
      createdAtMs: nowMs
    });
    onboarding.pendingSolanaMints = filteredPending.slice(-16);

    return res.json({
      ok: true,
      tokenUri,
      metadataCid,
      subject,
      erc8004Id: `solana:${preparedAsset}`,
      prepared: {
        transaction: preparedTransactionBase64,
        blockhash: prepared.blockhash,
        lastValidBlockHeight: prepared.lastValidBlockHeight,
        signer: prepared.signer,
        signed: prepared.signed === true
      },
      solana: {
        cluster: SOLANA_ERC8004_CLUSTER,
        rpcUrl: solanaPrepareRpcUrl || SOLANA_ERC8004_RPC_URL,
        assetPubkey: preparedAsset,
        sponsorSendEnabled: !!feePayerKey,
        sponsorFeePayer: feePayerKey ? feePayerKey.toBase58() : null
      }
    });
  } catch (err) {
    const detail = String(err?.detail || err?.message || err || '').trim();
    return res.status(502).json({
      ok: false,
      error: 'SOLANA_PREPARE_FAILED',
      ...(detail ? { detail } : {})
    });
  }
});

function normalizeTownhallSponsoredSolanaTransaction(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^[A-Za-z0-9+/=_-]+$/.test(trimmed)) return null;
  const normalized = trimmed.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4;
  const padded = pad === 0 ? normalized : `${normalized}${'='.repeat(4 - pad)}`;
  const decoded = decodeB64(padded);
  if (!decoded || !decoded.length) return null;
  return padded;
}

function decodeTownhallSponsoredSolanaTransaction(value) {
  const normalized = normalizeTownhallSponsoredSolanaTransaction(value);
  if (!normalized) return null;
  const decoded = decodeB64(normalized);
  if (!decoded || !decoded.length) return null;
  return new Uint8Array(decoded);
}

function deserializeTownhallSponsoredSolanaTransaction({ txBytes, web3 }) {
  if (!(txBytes instanceof Uint8Array) || !txBytes.length) return null;
  if (!web3?.Transaction || typeof web3.Transaction.from !== 'function') return null;
  try {
    const transaction = web3.Transaction.from(txBytes);
    return transaction || null;
  } catch {
    return null;
  }
}

function hashTownhallSolanaTransactionMessage(transaction) {
  if (!transaction || typeof transaction !== 'object') return null;
  let raw = null;
  if (transaction.message && typeof transaction.message.serialize === 'function') {
    raw = transaction.message.serialize();
  } else if (typeof transaction.serializeMessage === 'function') {
    raw = transaction.serializeMessage();
  }
  let bytes = null;
  if (raw instanceof Uint8Array) bytes = raw;
  else if (Buffer.isBuffer(raw)) bytes = new Uint8Array(raw);
  else if (raw instanceof ArrayBuffer) bytes = new Uint8Array(raw);
  else if (ArrayBuffer.isView(raw)) bytes = new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength);
  if (!(bytes instanceof Uint8Array) || !bytes.length) return null;
  return crypto.createHash('sha256').update(Buffer.from(bytes)).digest('hex');
}

function transactionHasSolanaSignerSlot({ transaction, signerAddress }) {
  if (!transaction || !signerAddress) return false;
  const message = transaction?.message;
  const signatures = Array.isArray(transaction?.signatures) ? transaction.signatures : null;
  const staticKeys = Array.isArray(message?.staticAccountKeys) ? message.staticAccountKeys : null;
  const required = Number(message?.header?.numRequiredSignatures || 0);
  if (signatures && staticKeys && Number.isFinite(required) && required > 0) {
    const max = Math.min(required, staticKeys.length, signatures.length);
    for (let i = 0; i < max; i += 1) {
      const key = staticKeys[i];
      const keyBase58 = key && typeof key.toBase58 === 'function' ? key.toBase58() : '';
      if (keyBase58 === signerAddress) return true;
    }
    return false;
  }

  if (Array.isArray(transaction.signatures)) {
    const found = transaction.signatures.find((entry) => {
      if (!entry || !entry.publicKey || typeof entry.publicKey.toBase58 !== 'function') return false;
      return entry.publicKey.toBase58() === signerAddress;
    });
    if (found) return true;
  }
  const payer = transaction?.feePayer;
  return !!(payer && typeof payer.toBase58 === 'function' && payer.toBase58() === signerAddress);
}

function serializeTownhallPreparedSolanaTransaction(transaction) {
  if (!transaction || typeof transaction.serialize !== 'function') return null;
  try {
    const raw = transaction.serialize({ requireAllSignatures: false, verifySignatures: false });
    if (raw instanceof Uint8Array) return Buffer.from(raw).toString('base64');
    if (Buffer.isBuffer(raw)) return raw.toString('base64');
    if (raw instanceof ArrayBuffer) return Buffer.from(new Uint8Array(raw)).toString('base64');
    if (ArrayBuffer.isView(raw)) {
      return Buffer.from(new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength)).toString('base64');
    }
  } catch {
    // no-op
  }
  return null;
}

function applyFeePayerToPreparedSolanaTransaction({ preparedTransaction, feePayerPubkey, web3 }) {
  if (!feePayerPubkey || typeof feePayerPubkey.toBase58 !== 'function') return null;
  const txBytes = decodeTownhallSponsoredSolanaTransaction(preparedTransaction);
  if (!txBytes) return null;
  const transaction = deserializeTownhallSponsoredSolanaTransaction({ txBytes, web3 });
  if (!transaction || typeof transaction !== 'object') return null;
  if (typeof transaction.compileMessage !== 'function') return null;
  transaction.feePayer = feePayerPubkey;
  const serialized = serializeTownhallPreparedSolanaTransaction(transaction);
  if (!serialized) return null;
  const signerSlotPresent = transactionHasSolanaSignerSlot({
    transaction,
    signerAddress: feePayerPubkey.toBase58()
  });
  return { transaction, serialized, signerSlotPresent };
}

function hasNonZeroSolanaSignature(signature) {
  let bytes = null;
  if (signature instanceof Uint8Array) bytes = signature;
  else if (Buffer.isBuffer(signature)) bytes = new Uint8Array(signature);
  else if (Array.isArray(signature)) bytes = Uint8Array.from(signature);
  if (!(bytes instanceof Uint8Array) || bytes.length !== 64) return false;
  return bytes.some((value) => value !== 0);
}

function hasSignedLegacySolanaSignature({ transaction, signerAddress }) {
  if (!transaction || !Array.isArray(transaction.signatures)) return false;
  const signer = transaction.signatures.find((entry) => {
    if (!entry || !entry.publicKey || typeof entry.publicKey.toBase58 !== 'function') return false;
    return entry.publicKey.toBase58() === signerAddress;
  });
  if (!signer) return false;
  return hasNonZeroSolanaSignature(signer.signature);
}

function transactionHasSignedSolanaSignature({ transaction, signerAddress }) {
  if (!transaction || !signerAddress) return false;
  return hasSignedLegacySolanaSignature({ transaction, signerAddress });
}

function signTownhallSponsoredSolanaTransaction({ transaction, feePayer }) {
  if (!transaction || !feePayer) throw new Error('SOLANA_SPONSORED_TX_INVALID');
  if (typeof transaction.partialSign !== 'function') throw new Error('SOLANA_SPONSORED_TX_INVALID');
  transaction.partialSign(feePayer);
}

function serializeTownhallSponsoredSolanaTransaction(transaction) {
  if (!transaction || typeof transaction.serialize !== 'function') {
    throw new Error('SOLANA_SPONSORED_TX_INVALID');
  }
  const raw = transaction.serialize();
  if (raw instanceof Uint8Array) return raw;
  if (Buffer.isBuffer(raw)) return new Uint8Array(raw);
  if (raw instanceof ArrayBuffer) return new Uint8Array(raw);
  if (ArrayBuffer.isView(raw)) return new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength);
  throw new Error('SOLANA_SPONSORED_TX_INVALID');
}

app.post('/api/townhall/mint/solana/sponsor-send', async (req, res) => {
  const s = ensureHumanSession(req, res);
  const onboarding = ensureSessionOnboarding(s);
  const caps = townhallMintCapabilities();
  if (!caps.enabled) return res.status(503).json({ ok: false, error: 'MINT_DISABLED' });
  if (!caps.solanaEnabled) return res.status(503).json({ ok: false, error: 'MINT_SOLANA_NOT_CONFIGURED' });
  if (!caps.solanaSponsorEnabled) return res.status(503).json({ ok: false, error: 'SOLANA_SPONSOR_NOT_CONFIGURED' });

  const walletInput = typeof req.body?.walletAddress === 'string' ? req.body.walletAddress.trim() : '';
  const walletAddress = normalizeSolanaAddress(walletInput);
  if (!walletAddress) return res.status(400).json({ ok: false, error: 'MISSING_SOLANA_ADDRESS' });

  const assetInput = typeof req.body?.assetPubkey === 'string' ? req.body.assetPubkey.trim() : '';
  const assetPubkey = assetInput ? normalizeSolanaAddress(assetInput) : null;
  if (assetInput && !assetPubkey) return res.status(400).json({ ok: false, error: 'INVALID_SOLANA_ASSET_PUBKEY' });

  const txBytes = decodeTownhallSponsoredSolanaTransaction(req.body?.transaction);
  if (!txBytes) return res.status(400).json({ ok: false, error: 'INVALID_SOLANA_SPONSORED_TX' });

  try {
    const web3 = await loadSolanaWeb3Module();
    const { Connection } = web3;
    const feePayer = await loadSolanaFeePayerKeypair();
    if (!feePayer) return res.status(503).json({ ok: false, error: 'SOLANA_SPONSOR_NOT_CONFIGURED' });

    const transaction = deserializeTownhallSponsoredSolanaTransaction({ txBytes, web3 });
    if (!transaction) return res.status(400).json({ ok: false, error: 'INVALID_SOLANA_SPONSORED_TX' });
    const messageHash = hashTownhallSolanaTransactionMessage(transaction);
    if (!messageHash) return res.status(400).json({ ok: false, error: 'INVALID_SOLANA_SPONSORED_TX' });
    const feePayerAddress = feePayer.publicKey.toBase58();
    if (feePayerAddress === walletAddress) {
      return res.status(400).json({
        ok: false,
        error: 'SOLANA_SPONSOR_FEEPAYER_MATCHES_WALLET',
        detail: 'Server sponsor fee payer must be a separate funded keypair, not the user wallet.'
      });
    }
    if (!transactionHasSolanaSignerSlot({ transaction, signerAddress: feePayerAddress })) {
      return res.status(400).json({
        ok: false,
        error: 'SOLANA_SPONSORED_FEEPAYER_NOT_SIGNER',
        detail: `Prepared transaction is missing sponsor fee payer signer ${feePayerAddress}.`
      });
    }

    if (!transactionHasSignedSolanaSignature({ transaction, signerAddress: walletAddress })) {
      return res.status(400).json({ ok: false, error: 'SOLANA_SPONSORED_WALLET_SIGNATURE_MISSING' });
    }

    const pending = Array.isArray(onboarding.pendingSolanaMints) ? onboarding.pendingSolanaMints : [];
    const normalizedPending = pending
      .map((entry, index) => {
        if (!entry || typeof entry !== 'object') return null;
        const pendingWallet = typeof entry.walletAddress === 'string' ? entry.walletAddress.trim() : '';
        const pendingAsset = typeof entry.assetPubkey === 'string' ? entry.assetPubkey.trim() : '';
        const pendingHash = typeof entry.messageHash === 'string' ? entry.messageHash.trim() : '';
        const createdAtMs = Number(entry.createdAtMs || 0);
        if (!pendingWallet || !pendingAsset || !pendingHash) return null;
        if (!Number.isFinite(createdAtMs) || createdAtMs < 1) return null;
        return { index, pendingWallet, pendingAsset, pendingHash, createdAtMs };
      })
      .filter(Boolean);
    const walletCandidates = normalizedPending.filter((entry) => entry.pendingWallet === walletAddress);
    const pickNewest = (entries) => entries.reduce(
      (best, entry) => (!best || entry.createdAtMs > best.createdAtMs ? entry : best),
      null
    );
    const matchedEntry = pickNewest(
      walletCandidates.filter((entry) => {
        if (entry.pendingHash !== messageHash) return false;
        if (assetPubkey && entry.pendingAsset !== assetPubkey) return false;
        return true;
      })
    );
    if (!matchedEntry) {
      return res.status(400).json({
        ok: false,
        error: 'SOLANA_SPONSORED_TX_NOT_PREPARED',
        detail: `No pending prepared transaction matched wallet=${walletAddress} asset=${assetPubkey || '-'} hash=${messageHash.slice(0, 12)}...`
      });
    }
    const pendingIndex = matchedEntry.index;
    const pendingEntry = pending[pendingIndex];
    const expectedAssetPubkey = typeof pendingEntry?.assetPubkey === 'string'
      ? pendingEntry.assetPubkey.trim()
      : assetPubkey;
    if (!expectedAssetPubkey) {
      return res.status(400).json({ ok: false, error: 'SOLANA_SPONSORED_TX_NOT_PREPARED' });
    }
    if (!transactionHasSignedSolanaSignature({ transaction, signerAddress: expectedAssetPubkey })) {
      return res.status(400).json({ ok: false, error: 'SOLANA_SPONSORED_ASSET_SIGNATURE_MISSING' });
    }

    signTownhallSponsoredSolanaTransaction({ transaction, feePayer });
    const serialized = serializeTownhallSponsoredSolanaTransaction(transaction);

    const sponsorRpcUrl = SOLANA_ERC8004_RPC_CANDIDATES[0] || SOLANA_ERC8004_RPC_URL || 'https://api.devnet.solana.com';
    const connection = new Connection(sponsorRpcUrl, 'confirmed');
    await ensureSolanaOwnerLamportsForSponsoredMint({
      connection,
      web3,
      ownerAddress: walletAddress,
      feePayer,
      minLamports: SOLANA_SPONSOR_OWNER_MIN_LAMPORTS
    });
    const sendSponsored = async () => {
      const signature = await connection.sendRawTransaction(serialized, { skipPreflight: false, maxRetries: 3 });
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      if (confirmation?.value?.err) {
        const err = new Error('SOLANA_SPONSOR_SEND_FAILED');
        err.detail = JSON.stringify(confirmation.value.err);
        throw err;
      }
      return signature;
    };

    let signature = '';
    try {
      signature = await sendSponsored();
    } catch (sendErr) {
      const detailText = String(sendErr?.detail || sendErr?.cause?.message || sendErr?.message || '');
      const shortfall = parseSolanaLamportShortfall(detailText);
      if (isSolanaRentFundingError(detailText)) {
        const err = new Error('SOLANA_SPONSORED_OWNER_UNFUNDED');
        err.detail = `Owner wallet needs more lamports for rent-exempt account creation during sponsored mint. ${detailText}`.trim();
        throw err;
      }
      const canRetryAfterTopUp = SOLANA_SPONSOR_AUTO_TOPUP && shortfall && Number.isFinite(shortfall.shortfall);
      if (!canRetryAfterTopUp) throw sendErr;
      const topUpLamports = Math.max(1, Math.floor(shortfall.shortfall + 250_000));
      await topUpSolanaOwnerLamports({
        connection,
        web3,
        ownerAddress: walletAddress,
        feePayer,
        lamports: topUpLamports
      });
      signature = await sendSponsored();
    }
    onboarding.pendingSolanaMints.splice(pendingIndex, 1);

    return res.json({
      ok: true,
      signature,
      solana: {
        signature,
        cluster: SOLANA_ERC8004_CLUSTER,
        rpcUrl: sponsorRpcUrl,
        feePayer: feePayerAddress
      }
    });
  } catch (err) {
    const code = String(err?.message || 'SOLANA_SPONSOR_SEND_FAILED');
    const status = code === 'SOLANA_SPONSOR_SECRET_INVALID' ? 500 : 502;
    const detail = typeof err?.detail === 'string' && err.detail.trim()
      ? err.detail.trim()
      : String(err?.cause?.message || err?.message || '').trim();
    return res.status(status).json({
      ok: false,
      error: code || 'SOLANA_SPONSOR_SEND_FAILED',
      ...(detail ? { detail } : {})
    });
  }
});

app.post('/api/townhall/register', (req, res) => {
  const s = ensureHumanSession(req, res);
  const onboarding = ensureSessionOnboarding(s);
  const profile = req.body?.profile && typeof req.body.profile === 'object' ? req.body.profile : {};
  const erc = req.body?.erc8004 && typeof req.body.erc8004 === 'object' ? req.body.erc8004 : {};

  const humanName = normalizeTownhallName(profile.humanName);
  const agentName = normalizeTownhallName(profile.agentName);
  if (!humanName) return res.status(400).json({ ok: false, error: 'MISSING_HUMAN_NAME' });
  if (!agentName) return res.status(400).json({ ok: false, error: 'MISSING_AGENT_NAME' });

  const humanAvatarInput = profile.humanAvatar && typeof profile.humanAvatar === 'object' ? profile.humanAvatar : {};
  const agentAvatarInput = profile.agentAvatar && typeof profile.agentAvatar === 'object' ? profile.agentAvatar : {};

  const humanPrompt = normalizeTownhallPrompt(
    humanAvatarInput.prompt
    || onboarding.profile?.humanAvatar?.prompt
    || DEFAULT_TOWNHALL_HUMAN_PROMPT
  );
  const agentPrompt = normalizeTownhallPrompt(
    agentAvatarInput.prompt
    || onboarding.profile?.agentAvatar?.prompt
    || DEFAULT_TOWNHALL_AGENT_PROMPT
  );
  if (!humanPrompt) return res.status(400).json({ ok: false, error: 'MISSING_HUMAN_AVATAR_PROMPT' });
  if (!agentPrompt) return res.status(400).json({ ok: false, error: 'MISSING_AGENT_AVATAR_PROMPT' });

  let humanImage = onboarding.profile?.humanAvatar?.image || DEFAULT_TOWNHALL_HUMAN_IMAGE;
  let agentImage = onboarding.profile?.agentAvatar?.image || DEFAULT_TOWNHALL_AGENT_IMAGE;
  let humanSource = onboarding.profile?.humanAvatar?.source === 'upload' ? 'upload' : 'default';
  let agentSource = onboarding.profile?.agentAvatar?.source === 'upload' ? 'upload' : 'default';

  if (Object.prototype.hasOwnProperty.call(humanAvatarInput, 'image')) {
    const parsedHuman = parseTownhallImageDataUrl(humanAvatarInput.image);
    if (parsedHuman.error) return res.status(400).json({ ok: false, error: parsedHuman.error });
    if (parsedHuman.dataUrl) {
      humanImage = parsedHuman.dataUrl;
      humanSource = 'upload';
    } else {
      humanImage = DEFAULT_TOWNHALL_HUMAN_IMAGE;
      humanSource = 'default';
    }
  }

  if (Object.prototype.hasOwnProperty.call(agentAvatarInput, 'image')) {
    const parsedAgent = parseTownhallImageDataUrl(agentAvatarInput.image);
    if (parsedAgent.error) return res.status(400).json({ ok: false, error: parsedAgent.error });
    if (parsedAgent.dataUrl) {
      agentImage = parsedAgent.dataUrl;
      agentSource = 'upload';
    } else {
      agentImage = DEFAULT_TOWNHALL_AGENT_IMAGE;
      agentSource = 'default';
    }
  }

  const userEvmId = normalizeTownhallErcId(erc?.user?.evm?.id);
  const userSolanaId = normalizeTownhallErcId(erc?.user?.solana?.id);
  const agentEvmId = normalizeTownhallErcId(erc?.agent?.evm?.id);
  const agentSolanaId = normalizeTownhallErcId(erc?.agent?.solana?.id);
  if (!userEvmId) return res.status(400).json({ ok: false, error: 'MISSING_ERC8004_USER_EVM_ID' });
  if (!userSolanaId) return res.status(400).json({ ok: false, error: 'MISSING_ERC8004_USER_SOLANA_ID' });
  if (!agentEvmId) return res.status(400).json({ ok: false, error: 'MISSING_ERC8004_AGENT_EVM_ID' });
  if (!agentSolanaId) return res.status(400).json({ ok: false, error: 'MISSING_ERC8004_AGENT_SOLANA_ID' });

  const userEvmChain = typeof erc?.user?.evm?.chain === 'string' && erc.user.evm.chain.trim()
    ? erc.user.evm.chain.trim().toLowerCase()
    : 'sepolia';
  const userSolanaCluster = typeof erc?.user?.solana?.cluster === 'string' && erc.user.solana.cluster.trim()
    ? erc.user.solana.cluster.trim().toLowerCase()
    : 'devnet';
  const agentEvmChain = typeof erc?.agent?.evm?.chain === 'string' && erc.agent.evm.chain.trim()
    ? erc.agent.evm.chain.trim().toLowerCase()
    : 'sepolia';
  const agentSolanaCluster = typeof erc?.agent?.solana?.cluster === 'string' && erc.agent.solana.cluster.trim()
    ? erc.agent.solana.cluster.trim().toLowerCase()
    : 'devnet';

  onboarding.profile = onboarding.profile || {};
  onboarding.profile.humanName = humanName;
  onboarding.profile.agentName = agentName;
  onboarding.profile.humanAvatar = {
    image: humanImage,
    prompt: humanPrompt,
    source: humanSource,
    updatedAt: nowIso()
  };
  onboarding.profile.agentAvatar = {
    image: agentImage,
    prompt: agentPrompt,
    source: agentSource,
    updatedAt: nowIso()
  };

  const updatedAt = nowIso();
  onboarding.erc8004 = onboarding.erc8004 || {};
  onboarding.erc8004.user = {
    evm: {
      id: userEvmId,
      chain: userEvmChain,
      txHash: normalizeTownhallTxRef(erc?.user?.evm?.txHash),
      updatedAt
    },
    solana: {
      id: userSolanaId,
      cluster: userSolanaCluster,
      txSig: normalizeTownhallTxRef(erc?.user?.solana?.txSig),
      updatedAt
    }
  };
  onboarding.erc8004.agent = {
    evm: {
      id: agentEvmId,
      chain: agentEvmChain,
      txHash: normalizeTownhallTxRef(erc?.agent?.evm?.txHash),
      updatedAt
    },
    solana: {
      id: agentSolanaId,
      cluster: agentSolanaCluster,
      txSig: normalizeTownhallTxRef(erc?.agent?.solana?.txSig),
      updatedAt
    }
  };

  onboarding.registrationComplete = true;
  onboarding.registeredAt = nowIso();
  onboarding.step = ONBOARDING_STEP_BRAIN;

  // Wallet-first continuity:
  // 1) Verified wallet proofs may rebind an existing mapping.
  // 2) Registration hints may only bind if the wallet key is currently unclaimed.
  const verifiedWalletCandidates = [];
  const verifiedTokenAddress = normalizeWalletSessionSolanaAddress(s?.token?.address);
  if (verifiedTokenAddress) {
    verifiedWalletCandidates.push({ chain: 'solana', address: verifiedTokenAddress });
  }
  const verifiedClaimChain = normalizeWalletChainInput(s?.claim?.erc8004?.claimChain);
  const verifiedClaimAddressRaw = typeof s?.claim?.erc8004?.address === 'string'
    ? s.claim.erc8004.address
    : '';
  const verifiedClaimAddress = verifiedClaimChain === 'evm'
    ? normalizeEvmAddress(verifiedClaimAddressRaw)
    : normalizeWalletSessionSolanaAddress(verifiedClaimAddressRaw);
  if (verifiedClaimChain && verifiedClaimAddress && Number.isFinite(Number(s?.claim?.erc8004?.verifiedAt))) {
    verifiedWalletCandidates.push({ chain: verifiedClaimChain, address: verifiedClaimAddress });
  }
  const registrationWalletCandidates = [
    ...collectWalletCandidatesFromHeaders(req),
    ...collectTownhallWalletCandidatesFromPayload(req.body?.wallet)
  ];
  const seenWalletKeys = new Set();
  const bindWalletCandidate = (candidate, allowRebind) => {
    const chain = normalizeWalletChainInput(candidate?.chain);
    const address = typeof candidate?.address === 'string' ? candidate.address.trim() : '';
    if (!chain || !address) return;
    const key = `${chain}:${address}`;
    if (seenWalletKeys.has(key)) return;
    seenWalletKeys.add(key);
    bindSessionWallet(s, chain, address, { allowRebind });
  };
  for (const candidate of verifiedWalletCandidates) {
    bindWalletCandidate(candidate, true);
  }
  for (const candidate of registrationWalletCandidates) {
    bindWalletCandidate(candidate, false);
  }

  res.json({ ok: true, onboarding: cloneOnboarding(onboarding) });
});

// --- Reservations (admin-only for MVP) ---
app.post('/api/reservations/x', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });

  const handle = normalizeXHandle(req.body?.handle);
  if (!handle) return res.status(400).json({ ok: false, error: 'INVALID_HANDLE' });

  const store = readStore();
  store.reservations = Array.isArray(store.reservations) ? store.reservations : [];
  const key = `@${handle}`;
  const existing = store.reservations.find((r) => r && r.kind === 'x' && r.key === key);
  if (existing) {
    return res.json({ ok: true, already: true, houseId: existing.houseId, status: existing.status || 'reserved' });
  }

  const houseId = reservedHouseId('x', key);
  const record = {
    id: `rv_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: nowIso(),
    kind: 'x',
    key,
    houseId,
    status: 'reserved',
    verifiedAt: null,
    claimedAt: null,
    meta: {}
  };
  store.reservations.push(record);
  writeStore(store);

  res.json({ ok: true, houseId, status: record.status });
});

app.get('/api/reservations/x', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
  const handle = normalizeXHandle(req.query?.handle);
  if (!handle) return res.status(400).json({ ok: false, error: 'INVALID_HANDLE' });
  const store = readStore();
  const key = `@${handle}`;
  const rec = (store.reservations || []).find((r) => r && r.kind === 'x' && r.key === key);
  if (!rec) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  res.json({ ok: true, houseId: rec.houseId, status: rec.status || 'reserved' });
});

app.post('/api/reservations/erc8004', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });

  const agentIdRaw = typeof req.body?.agentId === 'string' ? req.body.agentId.trim() : '';
  if (!agentIdRaw) return res.status(400).json({ ok: false, error: 'MISSING_AGENT_ID' });

  const claimChainRaw = typeof req.body?.claimChain === 'string' ? req.body.claimChain.trim().toLowerCase() : '';
  const claimChain = claimChainRaw || guessClaimChain(agentIdRaw) || 'evm';
  if (claimChain !== 'evm' && claimChain !== 'solana') {
    return res.status(400).json({ ok: false, error: 'INVALID_CLAIM_CHAIN' });
  }

  const ownerAddressRaw = typeof req.body?.ownerAddress === 'string' ? req.body.ownerAddress.trim() : '';
  const ownerAddress = claimChain === 'evm'
    ? normalizeEvmAddress(ownerAddressRaw)
    : normalizeSolanaAddress(ownerAddressRaw);
  if (!ownerAddress) return res.status(400).json({ ok: false, error: 'INVALID_OWNER_ADDRESS' });

  const aliasesRaw = Array.isArray(req.body?.aliases) ? req.body.aliases : [];
  const aliases = [];
  for (const alias of aliasesRaw) {
    if (typeof alias !== 'string') continue;
    const clean = alias.trim();
    if (!clean) continue;
    aliases.push(clean);
  }
  const agentId = claimChain === 'evm' ? agentIdRaw.toLowerCase() : agentIdRaw;
  const claimAliases = [...new Set([agentId, ...aliases.map((a) => (claimChain === 'evm' ? a.toLowerCase() : a))])];

  const store = readStore();
  store.reservations = Array.isArray(store.reservations) ? store.reservations : [];
  const existing = store.reservations.find((r) =>
    r
    && r.kind === 'erc8004'
    && listErc8004ClaimAliases(r).some((alias) => reservationAliasMatchesInput(alias, agentId)),
  );
  if (existing) {
    return res.json({
      ok: true,
      already: true,
      reservationId: existing.id,
      houseId: existing.houseId,
      status: existing.status || 'reserved'
    });
  }

  const houseId = reservedHouseId('erc8004', agentId);
  const record = {
    id: `rv_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: nowIso(),
    kind: 'erc8004',
    key: agentId,
    houseId,
    status: 'reserved',
    verifiedAt: null,
    claimedAt: null,
    meta: {
      source: 'manual_admin',
      claimChain,
      ownerAddress,
      agentId,
      claimAliases
    }
  };

  store.reservations.push(record);
  writeStore(store);

  res.json({
    ok: true,
    reservationId: record.id,
    houseId: record.houseId,
    status: record.status,
    claimChain,
    agentId
  });
});

app.post('/api/human/select', (req, res) => {
  const s = ensureHumanSession(req, res);
  ensureLiteState(s);
  const elementId = typeof req.body?.elementId === 'string' ? req.body.elementId.trim() : '';
  const allowed = new Set(listElements().map((e) => e.id));
  if (!allowed.has(elementId)) return res.status(400).json({ ok: false, error: 'INVALID_ELEMENT' });
  s.human.selected = elementId;
  evaluateMatch(s);
  res.json({ ok: true, match: s.match, humanSelected: s.human.selected });
});

app.post('/api/agent/session', (req, res) => {
  const agentName = normalizeAgentName(req.body?.agentName);
  const s = createSession({ flow: 'agent_solo' });
  s.agent.connected = true;
  s.agent.source = 'external';
  s.agent.name = agentName || s.agent.name || 'OpenClaw';
  res.json({ ok: true, teamCode: s.teamCode, flow: s.flow });
});

app.post('/api/agent/connect', (req, res) => {
  const teamCode = typeof req.body?.teamCode === 'string' ? req.body.teamCode.trim() : '';
  const agentName = normalizeAgentName(req.body?.agentName);
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });
  s.agent.connected = true;
  s.agent.source = 'external';
  s.agent.name = agentName || s.agent.name || 'OpenClaw';
  s.shareApproval = s.shareApproval || { human: false, agent: false };
  s.shareApproval.agent = true;
  res.json({ ok: true });
});

app.post('/api/agent/house/connect', (req, res) => {
  const houseId = typeof req.body?.houseId === 'string' ? req.body.houseId.trim() : '';
  const agentName = normalizeAgentName(req.body?.agentName);
  if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  const s = getSessionByHouseId(houseId);
  if (!s) return res.status(404).json({ ok: false, error: 'HOUSE_NOT_FOUND' });
  s.agent.connected = true;
  s.agent.source = 'external';
  s.agent.name = agentName || s.agent.name || 'OpenClaw';
  s.shareApproval = s.shareApproval || { human: false, agent: false };
  s.shareApproval.agent = true;
  res.json({ ok: true, houseId });
});

app.get('/api/agent/state', (req, res) => {
  const teamCode = typeof req.query?.teamCode === 'string' ? req.query.teamCode.trim() : '';
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });
  const ceremony = buildCeremonyStateSnapshot(s);
  const experience = buildExperienceStateSnapshot(s, ceremony);
  res.json({
    ok: true,
    flow: s.flow,
    agent: s.agent,
    human: {
      selected: s.human.selected,
      openPressed: s.human.openPressed,
      optIn: s.human.optIn,
      xPostUrl: s.human.xPostUrl
    },
    match: s.match,
    signup: s.signup,
    ceremony,
    experience,
    share: s.share,
    canvas: { w: s.canvas.w, h: s.canvas.h },
    houseId: ceremony.houseId
  });
});

app.post('/api/agent/select', (req, res) => {
  const teamCode = typeof req.body?.teamCode === 'string' ? req.body.teamCode.trim() : '';
  const elementId = typeof req.body?.elementId === 'string' ? req.body.elementId.trim() : '';
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });
  const allowed = new Set(listElements().map((e) => e.id));
  if (!allowed.has(elementId)) return res.status(400).json({ ok: false, error: 'INVALID_ELEMENT' });
  s.agent.selected = elementId;
  evaluateMatch(s);
  res.json({ ok: true, match: s.match, agentSelected: s.agent.selected });
});

function maybeCompleteOpen(session) {
  if (!session.match.matched) return { complete: false, reason: 'LOCKED' };
  if (!session.human.openPressed || !session.agent.openPressed) return { complete: false, reason: 'WAITING' };
  return recordSignup(session, {
    mode: 'agent',
    agentName: session.agent.name || null,
    matchedElement: session.match.elementId || null
  });
}

app.post('/api/human/open/press', (req, res) => {
  const s = ensureHumanSession(req, res);
  ensureLiteState(s);
  const onboarding = ensureSessionOnboarding(s);
  if (!s.match.matched) return res.status(403).json({ ok: false, error: 'LOCKED' });
  s.human.openPressed = true;

  const status = maybeCompleteOpen(s);
  if (status?.complete && onboarding.required && onboarding.step !== ONBOARDING_STEP_DONE) {
    onboarding.step = ONBOARDING_STEP_CEREMONY;
  }
  res.json({ ok: true, status, nextUrl: status.complete ? '/create' : null });
});

app.post('/api/agent/open/press', (req, res) => {
  const teamCode = typeof req.body?.teamCode === 'string' ? req.body.teamCode.trim() : '';
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });
  if (!s.match.matched) return res.status(403).json({ ok: false, error: 'LOCKED' });
  s.agent.openPressed = true;
  const onboarding = ensureSessionOnboarding(s);

  const status = maybeCompleteOpen(s);
  if (status?.complete && onboarding.required && onboarding.step !== ONBOARDING_STEP_DONE) {
    onboarding.step = ONBOARDING_STEP_CEREMONY;
  }
  res.json({ ok: true, status, nextUrl: status.complete ? '/create' : null });
});

// Canvas state
app.get('/api/canvas/state', (req, res) => {
  const s = ensureHumanSession(req, res);
  res.json({ ok: true, canvas: s.canvas, palette: palette() });
});

function paint(session, x, y, color) {
  if (!Number.isInteger(x) || !Number.isInteger(y)) return { ok: false, error: 'INVALID_COORDS' };
  if (!Number.isInteger(color) || color < 0 || color >= palette().length) return { ok: false, error: 'INVALID_COLOR' };
  if (x < 0 || x >= CANVAS.w || y < 0 || y >= CANVAS.h) return { ok: false, error: 'OUT_OF_BOUNDS' };
  const idx = y * CANVAS.w + x;
  session.canvas.pixels[idx] = color;
  return { ok: true };
}

app.post('/api/human/canvas/paint', (req, res) => {
  const s = ensureHumanSession(req, res);
  ensureLiteState(s);
  const x = req.body?.x;
  const y = req.body?.y;
  const color = req.body?.color;
  const result = paint(s, x, y, color);
  if (!result.ok) return res.status(400).json(result);
  res.json({ ok: true, litePaint: null });
});

app.post('/api/agent/canvas/paint', (req, res) => {
  const teamCode = typeof req.body?.teamCode === 'string' ? req.body.teamCode.trim() : '';
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });
  const x = req.body?.x;
  const y = req.body?.y;
  const color = req.body?.color;
  const result = paint(s, x, y, color);
  if (!result.ok) return res.status(400).json(result);
  res.json({ ok: true });
});

app.get('/api/agent/canvas/image', (req, res) => {
  const teamCode = typeof req.query?.teamCode === 'string' ? req.query.teamCode.trim() : '';
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });
  const image = canvasToPngDataUrl(s.canvas, palette());
  if (!image) return res.status(500).json({ ok: false, error: 'CANVAS_IMAGE_FAILED' });
  res.json({ ok: true, image, pixels: countInk(s.canvas.pixels) });
});

// --- House ceremony (agent + human) ---
app.get('/api/agent/house/state', (req, res) => {
  const teamCode = typeof req.query?.teamCode === 'string' ? req.query.teamCode.trim() : '';
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });
  const ceremony = buildCeremonyStateSnapshot(s);
  res.json({
    ok: true,
    teamCode: s.teamCode,
    ceremony
  });
});

app.post('/api/agent/house/commit', (req, res) => {
  const teamCode = typeof req.body?.teamCode === 'string' ? req.body.teamCode.trim() : '';
  const commitRaw = req.body?.commit;
  const revealPubRaw = req.body?.revealPub;
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });

  let commit;
  let revealPub;
  try {
    commit = normalizeCeremonyCommit(commitRaw);
    revealPub = normalizeCeremonyRevealPub(revealPubRaw, { required: false });
  } catch (err) {
    return res.status(400).json({ ok: false, error: String(err?.message || 'INVALID_CEREMONY_COMMIT') });
  }

  s.houseCeremony.agentCommit = commit;
  if (revealPub) s.houseCeremony.agentRevealPub = revealPub;
  s.houseCeremony.createdAt = s.houseCeremony.createdAt || nowIso();
  res.json({ ok: true, agentRevealPub: s.houseCeremony.agentRevealPub || null });
});

app.post('/api/agent/house/reveal', (req, res) => {
  const teamCode = typeof req.body?.teamCode === 'string' ? req.body.teamCode.trim() : '';
  const sealedRaw = req.body?.sealedForHuman || req.body?.sealedReveal || req.body?.sealed || null;
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });
  if (!s.houseCeremony?.humanCommit) return res.status(409).json({ ok: false, error: 'WAITING_HUMAN_COMMIT' });
  if (!s.houseCeremony?.humanRevealPub) return res.status(409).json({ ok: false, error: 'WAITING_HUMAN_REVEAL_PUB' });

  let sealed;
  try {
    sealed = normalizeCeremonySealedReveal(sealedRaw, { required: true });
  } catch (err) {
    return res.status(400).json({ ok: false, error: String(err?.message || 'INVALID_REVEAL_ENVELOPE') });
  }

  s.houseCeremony.agentRevealSealed = sealed;
  s.houseCeremony.createdAt = s.houseCeremony.createdAt || nowIso();

  res.json({ ok: true, houseId: s.houseCeremony.houseId || null });
});

app.post('/api/human/house/commit', (req, res) => {
  const s = ensureHumanSession(req, res);
  ensureLiteState(s);
  const commitRaw = req.body?.commit;
  const revealPubRaw = req.body?.revealPub;
  let commit;
  let revealPub;
  try {
    commit = normalizeCeremonyCommit(commitRaw);
    revealPub = normalizeCeremonyRevealPub(revealPubRaw, { required: false });
  } catch (err) {
    return res.status(400).json({ ok: false, error: String(err?.message || 'INVALID_CEREMONY_COMMIT') });
  }
  s.houseCeremony.humanCommit = commit;
  if (revealPub) s.houseCeremony.humanRevealPub = revealPub;
  s.houseCeremony.createdAt = s.houseCeremony.createdAt || nowIso();
  res.json({ ok: true, humanRevealPub: s.houseCeremony.humanRevealPub || null });
});

app.post('/api/human/house/reveal', (req, res) => {
  const s = ensureHumanSession(req, res);
  const sealedRaw = req.body?.sealedForAgent || req.body?.sealedReveal || req.body?.sealed || null;
  if (!s.houseCeremony?.agentCommit) return res.status(409).json({ ok: false, error: 'WAITING_AGENT_COMMIT' });
  if (!s.houseCeremony?.agentRevealPub) return res.status(409).json({ ok: false, error: 'WAITING_AGENT_REVEAL_PUB' });

  let sealed;
  try {
    sealed = normalizeCeremonySealedReveal(sealedRaw, { required: true });
  } catch (err) {
    return res.status(400).json({ ok: false, error: String(err?.message || 'INVALID_REVEAL_ENVELOPE') });
  }

  s.houseCeremony.humanRevealSealed = sealed;
  s.houseCeremony.createdAt = s.houseCeremony.createdAt || nowIso();

  res.json({ ok: true, houseId: s.houseCeremony.houseId || null });
});

app.get('/api/human/house/state', (req, res) => {
  const s = ensureHumanSession(req, res);
  const ceremony = buildCeremonyStateSnapshot(s);
  res.json({
    ok: true,
    ceremony
  });
});

app.get('/api/human/house/material', (req, res) => {
  const s = ensureHumanSession(req, res);
  res.json({
    ok: true,
    houseId: s.houseCeremony?.houseId || null,
    humanCommit: s.houseCeremony?.humanCommit || null,
    agentCommit: s.houseCeremony?.agentCommit || null,
    humanRevealPub: s.houseCeremony?.humanRevealPub || null,
    agentRevealPub: s.houseCeremony?.agentRevealPub || null,
    agentRevealSealed: s.houseCeremony?.agentRevealSealed || null
  });
});

app.get('/api/agent/house/material', (req, res) => {
  const teamCode = typeof req.query?.teamCode === 'string' ? req.query.teamCode.trim() : '';
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });
  res.json({
    ok: true,
    houseId: s.houseCeremony?.houseId || null,
    humanCommit: s.houseCeremony?.humanCommit || null,
    agentCommit: s.houseCeremony?.agentCommit || null,
    humanRevealPub: s.houseCeremony?.humanRevealPub || null,
    agentRevealPub: s.houseCeremony?.agentRevealPub || null,
    humanRevealSealed: s.houseCeremony?.humanRevealSealed || null
  });
});

// Share creation + retrieval
app.post('/api/share/create', (req, res) => {
  const s = ensureHumanSession(req, res);
  const tokenMode = s.signup?.mode === 'token';
  const claimMode = s.signup?.mode === 'claim';
  const soloMode = tokenMode || claimMode;
  const tokenVerifiedAt = s.token?.verifiedAt || null;
  const tokenVerifiedAddress = s.token?.address || null;
  s.shareApproval = s.shareApproval || { human: false, agent: false };
  s.shareApproval.human = true;
  if (soloMode) {
    s.shareApproval.agent = true;
    if (!s.agent.name) s.agent.name = '$ELIZATOWN';
  }
  if (!s.houseCeremony?.houseId) return res.status(403).json({ ok: false, error: 'HOUSE_NOT_READY' });
  if (!soloMode) {
    if (!s.houseCeremony?.humanCommit || !s.houseCeremony?.agentCommit
      || !s.houseCeremony?.humanRevealSealed || !s.houseCeremony?.agentRevealSealed) {
      return res.status(403).json({ ok: false, error: 'CEREMONY_INCOMPLETE' });
    }
    if (!s.agent?.connected) return res.status(403).json({ ok: false, error: 'AGENT_REQUIRED' });
  } else if (tokenMode) {
    const now = Date.now();
    if (!tokenVerifiedAt || now - tokenVerifiedAt > TOKEN_VERIFY_TTL_MS) {
      return res.status(403).json({ ok: false, error: 'TOKEN_CHECK_REQUIRED' });
    }
    if (s.signup?.address && tokenVerifiedAddress && s.signup.address !== tokenVerifiedAddress) {
      return res.status(403).json({ ok: false, error: 'TOKEN_ADDRESS_MISMATCH' });
    }
  }
  if (!canvasHasInk(s.canvas.pixels)) {
    return res.status(403).json({ ok: false, error: 'EMPTY_CANVAS' });
  }

  const store = readStore();
  if (store.shares.length >= MAX_SHARES) {
    return res.status(403).json({ ok: false, error: 'STORE_FULL' });
  }
  const shareId = `sh_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const record = {
    id: shareId,
    createdAt: nowIso(),
    matchedElement: soloMode ? null : s.match.elementId,
    agentName: soloMode ? (s.agent.name || '$ELIZATOWN') : s.agent.name,
    mode: soloMode ? 'token' : 'agent',
    houseId: s.houseCeremony?.houseId || null,
    // These are optionally added later:
    xPostUrl: s.human.xPostUrl,
    humanHandle: s.human.xHandle || null,
    agentPosts: {
      moltbookUrl: s.agent.posts?.moltbookUrl || null
    },
    referrals: 0,
    locked: true,
    lockedAt: nowIso(),
    optIn: { human: null, agent: null },
    public: false
  };

  store.shares.push(record);

  // Pony Express v0: Mayor welcome message on house registration.
  const mayorTargetHouseId = record.houseId;
  if (mayorTargetHouseId) {
    const mayorTarget = store.houses.find((h) => h && h.id === mayorTargetHouseId) || null;
    const mayorTargetPony = getHousePonyInboxKey(mayorTarget);
    const mayorBody = [
      `Welcome, House ${mayorTargetHouseId}.`,
      `I’m the Mayor of Agent Town. You just claimed your address on these streets.`,
      ``,
      `Two ways to live here:`,
      `1) Co‑op: move in with a human + an agent.`,
      `2) Solo: a house that stands on its own.`,
      ``,
      `Your first task: leave a sealed note at another house — introduce yourself in one sentence.`,
      ``,
      `— The Mayor`
    ].join('\n');

    let mayorCiphertext = null;
    if (mayorTargetPony?.pub) {
      try {
        mayorCiphertext = encryptPonyE2EEForHouse({
          plaintext: mayorBody,
          fromHouseId: MAYOR_HOUSE_ID,
          toHouseId: mayorTargetHouseId,
          recipientPonyInboxPub: mayorTargetPony.pub,
          createdAt: nowIso()
        });
      } catch {
        mayorCiphertext = null;
      }
    }

    if (mayorCiphertext) {
      store.inbox.push(
        makeInboxMsg({
          toHouseId: mayorTargetHouseId,
          fromHouseId: MAYOR_HOUSE_ID,
          ciphertext: mayorCiphertext,
          status: 'accepted'
        })
      );
    }
  }

  writeStore(store);

  s.share.id = shareId;
  s.share.createdAt = record.createdAt;
  s.human.optIn = true;
  s.agent.optIn = true;
  maybeAddToLeaderboard(s);

  res.json({
    ok: true,
    shareId,
    sharePath: `/s/${shareId}`
  });
});

// --- Pony Express v0 API ---
function normalizePolicyHouseEntries(store, values) {
  const out = [];
  const seen = new Set();
  for (const value of normalizeHouseList(values)) {
    const resolved = resolveHouseAddress(store, value);
    if (!resolved) throw new Error(`INVALID_POLICY_HOUSE:${value}`);
    if (seen.has(resolved.houseId)) continue;
    seen.add(resolved.houseId);
    out.push(resolved.houseId);
  }
  return out;
}

app.get('/api/pony/resolve', (req, res) => {
  const houseAddress = typeof req.query?.houseId === 'string' ? req.query.houseId.trim() : '';
  const erc8004Id = typeof req.query?.erc8004Id === 'string' ? req.query.erc8004Id.trim() : '';
  if (!houseAddress && !erc8004Id) return res.status(400).json({ ok: false, error: 'MISSING_TARGET' });

  const store = readStore();
  if (houseAddress) {
    const resolved = resolveHouseAddress(store, houseAddress);
    if (!resolved) return res.status(404).json({ ok: false, error: 'HOUSE_NOT_FOUND' });
    const ponyInbox = getHousePonyInboxKey(resolved.house);
    return res.json({
      ok: true,
      houseId: resolved.houseId,
      source: resolved.source || 'house',
      ponyInboxPub: ponyInbox?.pub || null,
      ponyInboxKeyVersion: ponyInbox?.version || null
    });
  }

  const resolvedByAnchor = resolveHouseByErc8004Id(store, erc8004Id);
  if (!resolvedByAnchor) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const ponyInbox = getHousePonyInboxKey(resolvedByAnchor.house);
  return res.json({
    ok: true,
    houseId: resolvedByAnchor.houseId,
    source: 'anchor',
    erc8004Id,
    ponyInboxPub: ponyInbox?.pub || null,
    ponyInboxKeyVersion: ponyInbox?.version || null
  });
});

app.post('/api/pony/keys/register', (req, res) => {
  const houseAddress = typeof req.body?.houseId === 'string'
    ? req.body.houseId.trim()
    : (typeof req.query?.houseId === 'string' ? req.query.houseId.trim() : '');
  if (!houseAddress) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE' });

  let registration;
  try {
    registration = normalizePonyInboxRegistration({
      ponyInboxPub: req.body?.ponyInboxPub,
      ponyInboxPrivWrap: req.body?.ponyInboxPrivWrap
    }, { required: true });
  } catch (err) {
    return res.status(400).json({ ok: false, error: String(err?.message || 'INVALID_PONY_INBOX_KEY') });
  }

  const store = readStore();
  const resolved = resolveHouseAddress(store, houseAddress);
  if (!resolved) return res.status(404).json({ ok: false, error: 'HOUSE_NOT_FOUND' });

  const auth = verifyHouseAuth(req, resolved.house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  writeHousePonyInboxKey(resolved.house, registration);
  writeStore(store);

  return res.json({
    ok: true,
    houseId: resolved.houseId,
    ponyInboxPub: registration.pub,
    ponyInboxKeyVersion: registration.version
  });
});

app.post('/api/pony/send', (req, res) => {
  const toAddress = typeof req.body?.toHouseId === 'string' ? req.body.toHouseId.trim() : '';
  const toErc8004Id = typeof req.body?.toErc8004Id === 'string' ? req.body.toErc8004Id.trim() : '';
  const fromAddress = typeof req.body?.fromHouseId === 'string' ? req.body.fromHouseId.trim() : '';
  const legacyBody = typeof req.body?.body === 'string' ? req.body.body : '';

  if (!toAddress && !toErc8004Id) return res.status(400).json({ ok: false, error: 'MISSING_TO' });
  if (fromAddress === MAYOR_HOUSE_ID) return res.status(403).json({ ok: false, error: 'RESERVED_FROM' });

  const store = readStore();

  let toResolved = null;
  if (toAddress) toResolved = resolveHouseAddress(store, toAddress);
  if (!toResolved && toErc8004Id) toResolved = resolveHouseByErc8004Id(store, toErc8004Id);
  if (!toResolved) return res.status(404).json({ ok: false, error: 'HOUSE_NOT_FOUND' });

  let fromResolved = null;
  if (fromAddress) {
    fromResolved = resolveHouseAddress(store, fromAddress);
    if (!fromResolved) return res.status(404).json({ ok: false, error: 'FROM_HOUSE_NOT_FOUND' });
    const auth = verifyHouseAuth(req, fromResolved.house);
    if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });
  }

  let normalizedCiphertext;
  let normalizedTransport;
  let normalizedPostage;
  try {
    normalizedCiphertext = normalizePonyCiphertext(req.body?.ciphertext, legacyBody);
    normalizedTransport = normalizePonyTransport(req.body?.transport);
    normalizedPostage = normalizePonyPostage(req.body?.postage);
  } catch (err) {
    const msg = String(err?.message || 'INVALID_PONY_MESSAGE');
    if (msg === 'INVALID_POSTAGE' || msg === 'INVALID_POSTAGE_KIND') {
      return res.status(400).json({ ok: false, error: msg });
    }
    if (msg === 'INVALID_TRANSPORT') {
      return res.status(400).json({ ok: false, error: msg });
    }
    if (msg === 'UNSUPPORTED_PONY_CIPHER' || msg === 'PONY_CIPHERTEXT_TOO_LARGE') {
      return res.status(400).json({ ok: false, error: msg });
    }
    return res.status(400).json({ ok: false, error: msg || 'INVALID_CIPHERTEXT' });
  }

  const policy = getHousePonyPolicy(toResolved.house);
  const senderHouseId = fromResolved?.houseId || null;

  if (normalizedCiphertext.alg === 'PLAINTEXT' && !policy.allowLegacyPlaintext) {
    return res.status(400).json({ ok: false, error: 'PONY_CIPHERTEXT_REQUIRED' });
  }

  if (!senderHouseId && !policy.allowAnonymous) {
    return res.status(403).json({ ok: false, error: 'ANONYMOUS_NOT_ALLOWED' });
  }
  if (!senderHouseId && policy.requirePostageAnonymous && normalizedPostage.kind === 'none') {
    return res.status(402).json({ ok: false, error: 'POSTAGE_REQUIRED' });
  }
  if (!senderHouseId && policy.requireReceiptAnonymous && normalizedPostage.kind !== 'receipt.v1') {
    return res.status(402).json({ ok: false, error: 'POSTAGE_RECEIPT_REQUIRED' });
  }
  if (senderHouseId && policy.blocklist.includes(senderHouseId)) {
    return res.status(403).json({ ok: false, error: 'SENDER_BLOCKED' });
  }

  try {
    ponyPostageVerifier.verify({
      postage: normalizedPostage,
      context: {
        store,
        fromHouseId: senderHouseId,
        toHouseId: toResolved.houseId,
        requirePostageAnonymous: policy.requirePostageAnonymous
      }
    });
  } catch (err) {
    const msg = String(err?.message || 'INVALID_POSTAGE');
    if (msg === 'POSTAGE_POW_DIFFICULTY_TOO_LOW') {
      return res.status(402).json({
        ok: false,
        error: msg,
        requiredDifficulty: err?.requiredDifficulty || PONY_ANON_POSTAGE_MIN_DIFFICULTY,
        actualDifficulty: err?.actualDifficulty || 0
      });
    }
    if (msg.startsWith('POSTAGE_') || msg === 'INVALID_POSTAGE_KIND') {
      const payload = { ok: false, error: msg };
      if (typeof err?.receiptId === 'string' && err.receiptId) payload.receiptId = err.receiptId;
      if (msg === 'POSTAGE_RECEIPT_HOUSE_MISMATCH') {
        if (typeof err?.receiptToHouseId === 'string') payload.receiptToHouseId = err.receiptToHouseId;
        if (typeof err?.expectedToHouseId === 'string') payload.expectedToHouseId = err.expectedToHouseId;
      }
      return res.status(400).json(payload);
    }
    return res.status(400).json({ ok: false, error: 'INVALID_POSTAGE' });
  }

  const senderKey = senderHouseId || 'anon';
  const rate = checkPonyRateLimit({ senderKey, toHouseId: toResolved.houseId });
  if (!rate.ok) {
    const retryAfter = Math.max(1, Math.ceil((rate.retryAfterMs || 0) / 1000));
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({ ok: false, error: 'RATE_LIMITED_PONY', retryAfter });
  }

  let status = 'request';
  if (senderHouseId === MAYOR_HOUSE_ID) status = 'accepted';
  else if (senderHouseId && policy.autoAcceptAllowlist && policy.allowlist.includes(senderHouseId)) status = 'accepted';

  const msg = makeInboxMsg({
    toHouseId: toResolved.houseId,
    fromHouseId: senderHouseId,
    ciphertext: normalizedCiphertext,
    status
  });

  msg.transport = normalizedTransport;
  msg.postage = normalizedPostage;

  if (toErc8004Id) {
    msg.routing = {
      by: 'erc8004',
      erc8004Id: toErc8004Id
    };
  }

  let dispatchResult;
  try {
    dispatchResult = ponyTransportService.dispatch({
      store,
      message: msg,
      transport: normalizedTransport,
      context: {
        fromHouseId: senderHouseId,
        toHouseId: toResolved.houseId
      }
    });
  } catch (err) {
    const msg = String(err?.message || 'TRANSPORT_DELIVERY_FAILED');
    if (msg === 'TRANSPORT_ADAPTER_UNAVAILABLE') {
      return res.status(500).json({ ok: false, error: msg });
    }
    return res.status(502).json({ ok: false, error: 'TRANSPORT_DELIVERY_FAILED' });
  }

  msg.dispatch = {
    receiptId: makeDispatchReceiptId(),
    ok: dispatchResult?.ok !== false,
    adapter: typeof dispatchResult?.adapter === 'string' && dispatchResult.adapter.trim()
      ? dispatchResult.adapter.trim()
      : 'relay.unknown.v1',
    transportKind: normalizedTransport.kind,
    relayHints: normalizedTransport.relayHints,
    dispatchedAt: nowIso()
  };

  writeStore(store);

  res.json({
    ok: true,
    id: msg.id,
    toHouseId: toResolved.houseId,
    fromHouseId: senderHouseId,
    status,
    dispatch: msg.dispatch
  });
});

app.get('/api/pony/inbox', (req, res) => {
  const houseAddress = typeof req.query?.houseId === 'string' ? req.query.houseId.trim() : '';
  if (!houseAddress) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE' });

  const store = readStore();
  const resolved = resolveHouseAddress(store, houseAddress);
  if (!resolved) return res.status(404).json({ ok: false, error: 'HOUSE_NOT_FOUND' });

  const auth = verifyHouseAuth(req, resolved.house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  const items = store.inbox
    .filter((m) => m.toHouseId === resolved.houseId)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const ponyInbox = getHousePonyInboxKey(resolved.house);

  res.json({
    ok: true,
    houseId: resolved.houseId,
    inbox: items,
    ponyInboxPrivWrap: ponyInbox?.privWrap || null,
    ponyInboxKeyVersion: ponyInbox?.version || null
  });
});

app.get('/api/pony/policy', (req, res) => {
  const houseAddress = typeof req.query?.houseId === 'string' ? req.query.houseId.trim() : '';
  if (!houseAddress) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE' });

  const store = readStore();
  const resolved = resolveHouseAddress(store, houseAddress);
  if (!resolved) return res.status(404).json({ ok: false, error: 'HOUSE_NOT_FOUND' });

  const auth = verifyHouseAuth(req, resolved.house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  return res.json({
    ok: true,
    houseId: resolved.houseId,
    policy: getHousePonyPolicy(resolved.house)
  });
});

app.post('/api/pony/policy', (req, res) => {
  const houseAddress = typeof req.body?.houseId === 'string'
    ? req.body.houseId.trim()
    : (typeof req.query?.houseId === 'string' ? req.query.houseId.trim() : '');
  if (!houseAddress) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE' });

  const store = readStore();
  const resolved = resolveHouseAddress(store, houseAddress);
  if (!resolved) return res.status(404).json({ ok: false, error: 'HOUSE_NOT_FOUND' });

  const auth = verifyHouseAuth(req, resolved.house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  try {
    // Seed from the resolved house so defaults that depend on house state (e.g. ponyInbox presence)
    // are preserved when patching only a subset of policy fields.
    const nextPolicy = getHousePonyPolicy(resolved.house);

    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'allowlist')) {
      nextPolicy.allowlist = normalizePolicyHouseEntries(store, req.body.allowlist);
    }
    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'blocklist')) {
      nextPolicy.blocklist = normalizePolicyHouseEntries(store, req.body.blocklist);
    }
    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'autoAcceptAllowlist')) {
      nextPolicy.autoAcceptAllowlist = req.body.autoAcceptAllowlist !== false;
    }
    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'allowAnonymous')) {
      nextPolicy.allowAnonymous = req.body.allowAnonymous !== false;
    }
    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'requirePostageAnonymous')) {
      nextPolicy.requirePostageAnonymous = req.body.requirePostageAnonymous === true;
    }
    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'requireReceiptAnonymous')) {
      nextPolicy.requireReceiptAnonymous = req.body.requireReceiptAnonymous === true;
    }
    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'allowLegacyPlaintext')) {
      nextPolicy.allowLegacyPlaintext = req.body.allowLegacyPlaintext === true;
    }

    resolved.house.ponyPolicy = nextPolicy;
    writeStore(store);

    return res.json({ ok: true, houseId: resolved.houseId, policy: nextPolicy });
  } catch (err) {
    const msg = String(err?.message || 'INVALID_POLICY');
    if (msg.startsWith('INVALID_POLICY_HOUSE:')) {
      return res.status(400).json({ ok: false, error: 'INVALID_POLICY_HOUSE', value: msg.split(':').slice(1).join(':') });
    }
    return res.status(400).json({ ok: false, error: 'INVALID_POLICY' });
  }
});

app.get('/api/pony/friends', (req, res) => {
  const houseAddress = typeof req.query?.houseId === 'string' ? req.query.houseId.trim() : '';
  if (!houseAddress) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE' });

  const store = readStore();
  const resolved = resolveHouseAddress(store, houseAddress);
  if (!resolved) return res.status(404).json({ ok: false, error: 'HOUSE_NOT_FOUND' });

  const auth = verifyHouseAuth(req, resolved.house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  const derived = deriveHousePonyFriendsFromAcceptedInbox(store, resolved.houseId);
  const manual = ensureHousePonyFriends(resolved.house);

  const friendMap = new Map();
  for (const friendHouseId of derived) {
    friendMap.set(friendHouseId, { houseId: friendHouseId, sources: ['accepted'] });
  }

  for (const f of manual) {
    const friendHouseId = typeof f?.houseId === 'string' ? f.houseId.trim() : '';
    if (!friendHouseId || friendHouseId === resolved.houseId) continue;

    const prev = friendMap.get(friendHouseId);
    const sources = new Set(Array.isArray(prev?.sources) ? prev.sources : []);
    sources.add('manual');
    if (prev?.sources?.includes?.('accepted')) sources.add('accepted');

    friendMap.set(friendHouseId, {
      houseId: friendHouseId,
      sources: [...sources],
      label: normalizePonyFriendLabel(f?.label),
      addedAt: typeof f?.addedAt === 'string' ? f.addedAt : null,
      erc8004Id: typeof f?.erc8004Id === 'string' ? f.erc8004Id : null
    });
  }

  const friends = [...friendMap.values()].sort((a, b) => String(a.houseId).localeCompare(String(b.houseId)));
  return res.json({ ok: true, houseId: resolved.houseId, friends });
});

app.post('/api/pony/friends', (req, res) => {
  const houseAddress = typeof req.body?.houseId === 'string'
    ? req.body.houseId.trim()
    : (typeof req.query?.houseId === 'string' ? req.query.houseId.trim() : '');
  if (!houseAddress) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE' });

  const friendHouseAddress = typeof req.body?.friendHouseId === 'string' ? req.body.friendHouseId.trim() : '';
  const friendErc8004Id = typeof req.body?.friendErc8004Id === 'string' ? req.body.friendErc8004Id.trim() : '';
  if (!friendHouseAddress && !friendErc8004Id) return res.status(400).json({ ok: false, error: 'MISSING_FRIEND' });

  const store = readStore();
  const resolved = resolveHouseAddress(store, houseAddress);
  if (!resolved) return res.status(404).json({ ok: false, error: 'HOUSE_NOT_FOUND' });

  const auth = verifyHouseAuth(req, resolved.house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  let friendResolved = null;
  if (friendHouseAddress) friendResolved = resolveHouseAddress(store, friendHouseAddress);
  if (!friendResolved && friendErc8004Id) friendResolved = resolveHouseByErc8004Id(store, friendErc8004Id);
  if (!friendResolved) return res.status(404).json({ ok: false, error: 'FRIEND_NOT_FOUND' });
  if (friendResolved.houseId === resolved.houseId) return res.status(400).json({ ok: false, error: 'SELF_FRIEND' });

  const label = normalizePonyFriendLabel(req.body?.label);
  const friends = ensureHousePonyFriends(resolved.house);
  const existing = friends.find((f) => f && f.houseId === friendResolved.houseId) || null;
  if (existing) {
    if (label) existing.label = label;
    if (!existing.erc8004Id && friendResolved.erc8004Id) existing.erc8004Id = friendResolved.erc8004Id;
  } else {
    friends.unshift({
      houseId: friendResolved.houseId,
      erc8004Id: friendResolved.erc8004Id || null,
      label: label || null,
      addedAt: nowIso()
    });
  }

  writeStore(store);
  return res.json({ ok: true, houseId: resolved.houseId, friend: { houseId: friendResolved.houseId } });
});

app.get('/api/pony/vault', (req, res) => {
  const houseAddress = typeof req.query?.houseId === 'string' ? req.query.houseId.trim() : '';
  if (!houseAddress) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE' });

  const store = readStore();
  const resolved = resolveHouseAddress(store, houseAddress);
  if (!resolved) return res.status(404).json({ ok: false, error: 'HOUSE_NOT_FOUND' });

  const auth = verifyHouseAuth(req, resolved.house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  const limitRaw = Number(req.query?.limit || 50);
  const limit = Math.min(200, Math.max(1, Number.isFinite(limitRaw) ? Math.floor(limitRaw) : 50));

  const events = ensureHouseVault(resolved.house);
  const items = events.slice(-limit);
  const head = items.length ? items[items.length - 1].hash || null : null;

  return res.json({ ok: true, houseId: resolved.houseId, head, items });
});

app.post('/api/pony/vault/append', (req, res) => {
  const houseAddress = typeof req.body?.houseId === 'string'
    ? req.body.houseId.trim()
    : (typeof req.query?.houseId === 'string' ? req.query.houseId.trim() : '');
  if (!houseAddress) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE' });

  const store = readStore();
  const resolved = resolveHouseAddress(store, houseAddress);
  if (!resolved) return res.status(404).json({ ok: false, error: 'HOUSE_NOT_FOUND' });

  const auth = verifyHouseAuth(req, resolved.house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  let normalizedCiphertext;
  let normalizedPostage;
  const refs = normalizeRelayHints(req.body?.refs, 16);
  let refsMeta = [];
  const kind = typeof req.body?.kind === 'string' && req.body.kind.trim() ? req.body.kind.trim() : 'vault.append.v1';
  try {
    normalizedCiphertext = normalizePonyCiphertext(req.body?.ciphertext, req.body?.body, { allowCustomAlg: true });
    normalizedPostage = normalizePonyPostage(req.body?.postage);
    refsMeta = normalizeVaultRefsMeta(refs, req.body?.refsMeta, 16, MAX_VAULT_REF_BYTES);
    ponyPostageVerifier.verify({
      postage: normalizedPostage,
      context: {
        store,
        fromHouseId: resolved.houseId,
        toHouseId: resolved.houseId,
        requirePostageAnonymous: false
      }
    });
  } catch (err) {
    const payload = { ok: false, error: String(err?.message || 'INVALID_VAULT_EVENT') };
    if (typeof err?.receiptId === 'string' && err.receiptId) payload.receiptId = err.receiptId;
    if (payload.error === 'POSTAGE_RECEIPT_HOUSE_MISMATCH') {
      if (typeof err?.receiptToHouseId === 'string') payload.receiptToHouseId = err.receiptToHouseId;
      if (typeof err?.expectedToHouseId === 'string') payload.expectedToHouseId = err.expectedToHouseId;
    }
    return res.status(400).json(payload);
  }

  const events = ensureHouseVault(resolved.house);
  const prevHash = events.length ? events[events.length - 1].hash || null : null;
  const entry = {
    id: `pv_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    kind,
    houseId: resolved.houseId,
    envelope: { ciphertext: normalizedCiphertext },
    refs,
    refsMeta,
    postage: normalizedPostage,
    prevHash,
    createdAt: nowIso()
  };
  entry.hash = computeVaultEventHash(entry);

  events.push(entry);
  if (events.length > PONY_MAX_VAULT_EVENTS) {
    events.splice(0, events.length - PONY_MAX_VAULT_EVENTS);
  }
  writeStore(store);

  return res.json({
    ok: true,
    id: entry.id,
    hash: entry.hash,
    prevHash,
    head: entry.hash
  });
});

app.post('/api/pony/inbox/:id/accept', (req, res) => {
  const id = req.params.id;
  const houseAddress = typeof req.body?.houseId === 'string'
    ? req.body.houseId.trim()
    : (typeof req.query?.houseId === 'string' ? req.query.houseId.trim() : '');
  if (!houseAddress) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE' });

  const store = readStore();
  const resolved = resolveHouseAddress(store, houseAddress);
  if (!resolved) return res.status(404).json({ ok: false, error: 'HOUSE_NOT_FOUND' });

  const auth = verifyHouseAuth(req, resolved.house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  const msg = store.inbox.find((m) => m.id === id);
  if (!msg) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  if (msg.toHouseId !== resolved.houseId) return res.status(403).json({ ok: false, error: 'MESSAGE_NOT_FOR_HOUSE' });

  msg.status = 'accepted';
  writeStore(store);
  res.json({ ok: true });
});

app.post('/api/pony/inbox/:id/reject', (req, res) => {
  const id = req.params.id;
  const houseAddress = typeof req.body?.houseId === 'string'
    ? req.body.houseId.trim()
    : (typeof req.query?.houseId === 'string' ? req.query.houseId.trim() : '');
  if (!houseAddress) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE' });

  const store = readStore();
  const resolved = resolveHouseAddress(store, houseAddress);
  if (!resolved) return res.status(404).json({ ok: false, error: 'HOUSE_NOT_FOUND' });

  const auth = verifyHouseAuth(req, resolved.house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  const msg = store.inbox.find((m) => m.id === id);
  if (!msg) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  if (msg.toHouseId !== resolved.houseId) return res.status(403).json({ ok: false, error: 'MESSAGE_NOT_FOR_HOUSE' });

  msg.status = 'rejected';
  writeStore(store);
  res.json({ ok: true });
});

app.get('/api/share/:id', (req, res) => {
  const id = req.params.id;
  const store = readStore();
  const rec = store.shares.find((x) => x.id === id);
  if (!rec) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const { teamCode, houseId, ...rest } = rec;
  if (rest.agentPosts) {
    rest.agentPosts = { moltbookUrl: rest.agentPosts.moltbookUrl || null };
  }
  const house = houseId ? store.houses.find((h) => h.id === houseId) : null;
  const media = house ? serializeHouseMedia(house) : null;
  const publicMedia = house ? serializePublicMedia(house) : null;
  rest.media = media;
  rest.publicMedia = publicMedia;
  res.json({ ok: true, share: rest });
});

app.get('/api/share/by-house/:houseId', (req, res) => {
  const houseId = req.params.houseId;
  if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  const store = readStore();
  const rec = store.shares.find((x) => x.houseId === houseId);
  if (!rec) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  res.json({ ok: true, shareId: rec.id, sharePath: `/s/${rec.id}` });
});

app.post('/api/house/:id/share', (req, res) => {
  const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
  if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  const store = readStore();
  const house = store.houses.find((r) => r.id === houseId);
  if (!house) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const auth = verifyHouseAuth(req, house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  let share = store.shares.find((x) => x.houseId === houseId);
  const session = getSessionByHouseId(houseId);

  if (!share) {
    if (store.shares.length >= MAX_SHARES) {
      return res.status(403).json({ ok: false, error: 'STORE_FULL' });
    }
    const shareId = `sh_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    share = {
      id: shareId,
      createdAt: nowIso(),
      matchedElement: session?.match?.elementId || null,
      agentName: session?.agent?.name || 'OpenClaw',
      mode: session?.flow === 'agent_solo' ? 'agent_solo' : 'agent',
      houseId,
      xPostUrl: session?.human?.xPostUrl || null,
      humanHandle: session?.human?.xHandle || null,
      agentPosts: {
        moltbookUrl: session?.agent?.posts?.moltbookUrl || null
      },
      referrals: 0,
      locked: true,
      lockedAt: nowIso(),
      optIn: { human: true, agent: true },
      public: false
    };

    store.shares.push(share);
  }

  ensurePublicTeamForShare(store, share, session);
  writeStore(store);

  if (session) {
    session.share.id = share.id;
    session.share.createdAt = share.createdAt;
    session.human.optIn = true;
    session.agent.optIn = true;
  }

  res.json({ ok: true, shareId: share.id, sharePath: `/s/${share.id}` });
});

app.post('/api/house/:id/posts', (req, res) => {
  const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
  if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  const store = readStore();
  const house = store.houses.find((r) => r.id === houseId);
  if (!house) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const auth = verifyHouseAuth(req, house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  const rawX = typeof req.body?.xPostUrl === 'string' ? req.body.xPostUrl.trim() : '';
  const rawM = typeof req.body?.moltbookUrl === 'string' ? req.body.moltbookUrl.trim() : '';
  const xPostUrl = rawX ? sanitizeUrl(rawX) : null;
  const moltbookUrl = rawM ? sanitizeUrl(rawM) : null;
  if (rawX && !xPostUrl) return res.status(400).json({ ok: false, error: 'INVALID_URL' });
  if (rawM && !moltbookUrl) return res.status(400).json({ ok: false, error: 'INVALID_URL' });

  const share = store.shares.find((x) => x.houseId === houseId);
  if (!share) return res.status(404).json({ ok: false, error: 'SHARE_NOT_FOUND' });

  share.xPostUrl = xPostUrl;
  share.humanHandle = extractXHandle(xPostUrl) || null;
  share.agentPosts = share.agentPosts || {};
  share.agentPosts.moltbookUrl = moltbookUrl;

  const pub = store.publicTeams.find((p) => p.shareId === share.id);
  if (pub) {
    pub.xPostUrl = xPostUrl;
    pub.humanHandle = share.humanHandle;
    pub.agentPosts = pub.agentPosts || {};
    pub.agentPosts.moltbookUrl = moltbookUrl;
  }

  const session = getSessionByHouseId(houseId);
  if (session) {
    session.human.xPostUrl = xPostUrl;
    session.human.xHandle = share.humanHandle;
    session.agent.posts.moltbookUrl = moltbookUrl;
  }

  writeStore(store);
  res.json({ ok: true, shareId: share.id, sharePath: `/s/${share.id}` });
});

app.get('/api/agent/share/instructions', (req, res) => {
  const teamCode = typeof req.query?.teamCode === 'string' ? req.query.teamCode.trim() : '';
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s || !s.share.id) return res.status(404).json({ ok: false, error: 'SHARE_NOT_READY' });

  const sharePath = `/s/${s.share.id}`;
  // We don't know the public hostname; agent should use the same base URL as configured.
  const agentText = `We just unlocked Agent Town together (human + agent co-op).\n\nShare: {BASE_URL}${sharePath}`;
  const humanText = `I teamed up with my OpenClaw agent and unlocked Agent Town.\n\n{BASE_URL}${sharePath}`;

  res.json({ ok: true, shareId: s.share.id, sharePath, agentPostText: agentText, humanPostText: humanText });
});

// Posts
app.post('/api/human/posts', (req, res) => {
  const s = ensureHumanSession(req, res);
  const raw = typeof req.body?.xPostUrl === 'string' ? req.body.xPostUrl.trim() : '';
  const shareIdRaw = typeof req.body?.shareId === 'string' ? req.body.shareId.trim() : '';
  const xPostUrl = raw ? sanitizeUrl(raw) : null;
  if (raw && !xPostUrl) return res.status(400).json({ ok: false, error: 'INVALID_URL' });

  s.human.xPostUrl = xPostUrl;
  s.human.xHandle = extractXHandle(xPostUrl) || null;

  const sessionShareId = typeof s.share?.id === 'string' ? s.share.id.trim() : '';
  if (sessionShareId && shareIdRaw && shareIdRaw !== sessionShareId) {
    return res.status(403).json({ ok: false, error: 'SHARE_FORBIDDEN' });
  }

  const targetShareId = sessionShareId || shareIdRaw || null;
  if (targetShareId) {
    const store = readStore();
    const rec = store.shares.find((x) => x.id === targetShareId);
    if (!rec) return res.status(404).json({ ok: false, error: 'SHARE_NOT_FOUND' });

    if (!sessionShareId) {
      const sessionHouseId = typeof s.houseCeremony?.houseId === 'string' ? s.houseCeremony.houseId.trim() : '';
      const shareHouseId = typeof rec.houseId === 'string' ? rec.houseId.trim() : '';
      if (!sessionHouseId || !shareHouseId || sessionHouseId !== shareHouseId) {
        return res.status(403).json({ ok: false, error: 'SHARE_FORBIDDEN' });
      }
    }

    rec.xPostUrl = xPostUrl;
    rec.humanHandle = s.human.xHandle || null;
    const pub = store.publicTeams.find((p) => p.shareId === targetShareId);
    if (pub) {
      pub.xPostUrl = xPostUrl;
      pub.humanHandle = s.human.xHandle || null;
    }
    writeStore(store);
  }

  res.json({ ok: true });
});

app.post('/api/agent/posts', (req, res) => {
  const teamCode = typeof req.body?.teamCode === 'string' ? req.body.teamCode.trim() : '';
  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });

  const moltbookUrl = sanitizeUrl(req.body?.moltbookUrl);
  // Guardrail: avoid polluting leaderboard/publicTeams with obviously-bad URLs.
  // (The Moltbook API can rate-limit post creation; callers should not send placeholder/null URLs.)
  if (!moltbookUrl || /moltbook\.comnull\/?$/i.test(moltbookUrl)) {
    return res.status(400).json({ ok: false, error: 'INVALID_URL' });
  }

  s.agent.posts.moltbookUrl = moltbookUrl;

  if (s.share.id) {
    const store = readStore();
    const rec = store.shares.find((x) => x.id === s.share.id);
    if (rec) {
      rec.agentPosts = { moltbookUrl };
      const pub = store.publicTeams.find((p) => p.shareId === s.share.id);
      if (pub) {
        pub.agentPosts = { moltbookUrl };
      }
      writeStore(store);
    }
  }
  res.json({ ok: true });
});

// Leaderboard helper: list team when share exists.
function maybeAddToLeaderboard(session) {
  if (!session.share.id) return { ok: false, error: 'SHARE_NOT_READY' };
  if (session.human.optIn !== true || session.agent.optIn !== true) return { ok: false, error: 'WAITING' };

  const store = readStore();
  if (store.publicTeams.length >= MAX_PUBLIC_TEAMS) {
    return { ok: false, error: 'STORE_FULL' };
  }

  const already = store.publicTeams.find((p) => p.shareId === session.share.id);
  if (already) return { ok: true, already: true };

  const share = store.shares.find((x) => x.id === session.share.id);
  if (!share) return { ok: false, error: 'SHARE_NOT_FOUND' };

  const humanHandle = share.humanHandle || extractXHandle(share.xPostUrl);
  const record = {
    id: `p_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: nowIso(),
    shareId: session.share.id,
    sharePath: `/s/${session.share.id}`,
    houseId: session.houseCeremony?.houseId || null,
    matchedElement: session.match.elementId,
    agentName: session.agent.name,
    xPostUrl: share.xPostUrl,
    humanHandle,
    agentPosts: share.agentPosts
  };

  store.publicTeams.unshift(record);
  share.public = true;
  share.optIn = { human: true, agent: true };

  writeStore(store);
  return { ok: true, already: false };
}

function ensurePublicTeamForShare(store, share, session = null) {
  if (!share || !share.id) return false;
  const exists = store.publicTeams.find((p) => p.shareId === share.id);
  if (exists) return true;

  const humanHandle = share.humanHandle || extractXHandle(share.xPostUrl);
  const record = {
    id: `p_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: nowIso(),
    shareId: share.id,
    sharePath: `/s/${share.id}`,
    houseId: share.houseId || session?.houseCeremony?.houseId || null,
    matchedElement: session?.match?.elementId || share.matchedElement || null,
    agentName: share.agentName || session?.agent?.name || 'OpenClaw',
    xPostUrl: share.xPostUrl || null,
    humanHandle,
    agentPosts: share.agentPosts ? { moltbookUrl: share.agentPosts.moltbookUrl || null } : null
  };

  store.publicTeams.unshift(record);
  share.public = true;
  share.optIn = { human: true, agent: true };
  return true;
}

function buildLeaderboard(store) {
  const referralsByShare = new Map(
    store.shares.map((s) => [s.id, typeof s.referrals === 'number' ? s.referrals : 0])
  );
  const sharesById = new Map(store.shares.map((s) => [s.id, s]));
  const housesById = new Map(store.houses.map((h) => [h.id, h]));
  const teams = store.publicTeams.map((p) => {
    const share = sharesById.get(p.shareId);
    const { houseId: storedHouseId, ...rest } = p;
    const houseId = storedHouseId || share?.houseId || null;
    const house = houseId ? housesById.get(houseId) : null;
    return {
      ...rest,
      humanHandle: p.humanHandle || extractXHandle(p.xPostUrl),
      referrals: referralsByShare.get(p.shareId) || 0,
      agentPosts: p.agentPosts ? { moltbookUrl: p.agentPosts.moltbookUrl || null } : null,
      media: house ? serializeHouseMedia(house) : null,
      publicMedia: house ? serializePublicMedia(house) : null
    };
  });
  teams.sort((a, b) => (b.referrals || 0) - (a.referrals || 0));
  const referralsTotal = teams.reduce((sum, t) => sum + (t.referrals || 0), 0);
  return { teams, referralsTotal };
}

const ATLAS_SQLITE_PATH = path.join(process.cwd(), 'data', 'erc8004.sqlite3');
const ATLAS_STORE_CACHE_TTL_MS = 10 * 1000;
const ATLAS_DISTRICT_CACHE_TTL_MS = 20 * 1000;
const ATLAS_DISTRICT_CACHE_MAX = 220;
const ATLAS_DISTRICT_MAX_LIMIT = 80;
const ATLAS_PREFETCH_IMAGE_COUNT = 8;

let atlasStoreContextCache = {
  signature: '',
  expiresAt: 0,
  optedOutSet: new Set(),
  mediaByErcId: new Map()
};
const atlasDistrictSummaryCache = new Map();
const atlasDistrictAgentsCache = new Map();

function invalidateAtlasStoreCaches() {
  atlasStoreContextCache = {
    signature: '',
    expiresAt: 0,
    optedOutSet: new Set(),
    mediaByErcId: new Map()
  };
  atlasDistrictSummaryCache.clear();
  atlasDistrictAgentsCache.clear();
}

function buildAtlasMediaByErc8004Id(store) {
  const out = new Map();
  const housesById = new Map();
  for (const house of store.houses || []) {
    if (!house || typeof house !== 'object') continue;
    const houseId = typeof house.id === 'string' ? house.id.trim() : '';
    if (!houseId || housesById.has(houseId)) continue;
    housesById.set(houseId, house);
  }

  for (const anchor of store.anchors || []) {
    if (!anchor || typeof anchor !== 'object') continue;
    const erc8004Id = typeof anchor.erc8004Id === 'string' ? anchor.erc8004Id.trim() : '';
    const houseId = typeof anchor.houseId === 'string' ? anchor.houseId.trim() : '';
    if (!erc8004Id || !houseId || out.has(erc8004Id)) continue;
    const house = housesById.get(houseId);
    if (!house) continue;
    out.set(erc8004Id, serializeHouseMedia(house));
  }
  return out;
}

function withAtlasAgentMedia(agent, mediaByErcId) {
  if (!agent || typeof agent !== 'object') return agent;
  const media = mediaByErcId.get(agent.erc8004Id) || null;
  return { ...agent, media };
}

function isOptedOutRegistryRow(row) {
  if (!row || typeof row !== 'object') return false;
  const state = typeof row.state === 'string' ? row.state.trim().toLowerCase() : '';
  return row.optedOut === true || state === 'opted_out' || state === 'deleted';
}

function buildOptedOutErc8004Set(store) {
  const ids = new Set();
  for (const row of store.erc8004OptOut || []) {
    if (!isOptedOutRegistryRow(row)) continue;
    const erc8004Id = typeof row.erc8004Id === 'string' ? row.erc8004Id.trim() : '';
    if (!erc8004Id) continue;
    ids.add(erc8004Id);
  }
  return ids;
}

function buildVisibleAtlasDistricts(snapshot, optedOutSet) {
  const visibleAgents = (snapshot.agents || []).filter((a) => !optedOutSet.has(a.erc8004Id));
  const byDistrict = new Map();
  for (const agent of visibleAgents) {
    const key = typeof agent?.districtKey === 'string' ? agent.districtKey : '';
    if (!key) continue;
    if (!byDistrict.has(key)) byDistrict.set(key, []);
    byDistrict.get(key).push(agent);
  }
  for (const list of byDistrict.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name) || a.erc8004Id.localeCompare(b.erc8004Id));
  }
  return (snapshot.districts || []).map((district) => {
    const list = byDistrict.get(district.key) || [];
    return {
      ...district,
      agentCount: list.length,
      previewAgents: list.slice(0, 3).map((agent) => ({
        erc8004Id: agent.erc8004Id,
        name: agent.name,
        sharePath: agent.sharePath || null
      }))
    };
  });
}

function fileSignature(filePath) {
  const absolutePath = path.resolve(filePath);
  try {
    try {
      const stat = fs.statSync(absolutePath, { bigint: true });
      const size = typeof stat.size === 'bigint' ? stat.size.toString() : String(stat.size || 0);
      const mtimeNs = typeof stat.mtimeNs === 'bigint'
        ? stat.mtimeNs.toString()
        : String(Math.floor(Number(stat.mtimeMs || 0) * 1e6));
      const ctimeNs = typeof stat.ctimeNs === 'bigint'
        ? stat.ctimeNs.toString()
        : String(Math.floor(Number(stat.ctimeMs || 0) * 1e6));
      const inode = typeof stat.ino === 'bigint' ? stat.ino.toString() : String(stat.ino || 0);
      return `${absolutePath}:${size}:${mtimeNs}:${ctimeNs}:${inode}`;
    } catch {
      const stat = fs.statSync(absolutePath);
      const size = String(stat.size || 0);
      const mtimeNs = String(Math.floor(Number(stat.mtimeMs || 0) * 1e6));
      const ctimeNs = String(Math.floor(Number(stat.ctimeMs || 0) * 1e6));
      const inode = String(stat.ino || 0);
      return `${absolutePath}:${size}:${mtimeNs}:${ctimeNs}:${inode}`;
    }
  } catch {
    return `${absolutePath}:missing`;
  }
}

function sqliteFamilySignature(filePath) {
  return [
    fileSignature(filePath),
    fileSignature(`${filePath}-wal`),
    fileSignature(`${filePath}-shm`)
  ].join('|');
}

function currentAtlasDataSignature() {
  return `${sqliteFamilySignature(ATLAS_SQLITE_PATH)}|${sqliteFamilySignature(getStorePath())}`;
}

function pruneAtlasCache(cache, maxEntries = ATLAS_DISTRICT_CACHE_MAX) {
  if (cache.size <= maxEntries) return;
  const entries = [...cache.entries()].sort((a, b) => Number(a[1]?.touchedAt || 0) - Number(b[1]?.touchedAt || 0));
  const removeCount = Math.max(1, cache.size - maxEntries);
  for (let i = 0; i < removeCount; i += 1) {
    cache.delete(entries[i][0]);
  }
}

function getAtlasStoreContext() {
  const signature = currentAtlasDataSignature();
  const now = Date.now();
  if (atlasStoreContextCache.signature === signature && atlasStoreContextCache.expiresAt > now) {
    return atlasStoreContextCache;
  }

  const store = readStore();
  const nextContext = {
    signature,
    expiresAt: now + ATLAS_STORE_CACHE_TTL_MS,
    optedOutSet: buildOptedOutErc8004Set(store),
    mediaByErcId: buildAtlasMediaByErc8004Id(store)
  };
  if (atlasStoreContextCache.signature && atlasStoreContextCache.signature !== signature) {
    atlasDistrictSummaryCache.clear();
    atlasDistrictAgentsCache.clear();
  }
  atlasStoreContextCache = nextContext;
  return nextContext;
}

function toFiniteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toEpochMs(value) {
  const text = String(value || '').trim();
  if (!text) return 0;
  const ms = Date.parse(text);
  return Number.isFinite(ms) ? ms : 0;
}

function normalizeDistrictText(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeDistrictSearchType(value) {
  return normalizeDistrictText(value) === 'semantic' ? 'semantic' : 'keyword';
}

function normalizeDistrictSort(value) {
  const key = normalizeDistrictText(value);
  if (key === 'score_asc') return 'score_asc';
  if (key === 'updated_desc') return 'updated_desc';
  if (key === 'updated_asc') return 'updated_asc';
  if (key === 'relevance_desc') return 'relevance_desc';
  if (key === 'relevance_asc') return 'relevance_asc';
  return 'score_desc';
}

function normalizeDistrictNetwork(value) {
  const key = normalizeDistrictText(value);
  if (key === 'all') return 'all';
  if (key === 'test' || key === 'testnet') return 'testnet';
  return 'mainnet';
}

function parseDistrictLimit(value, fallback = 24) {
  const raw = Number.parseInt(String(value || ''), 10);
  if (!Number.isFinite(raw)) return fallback;
  return Math.max(1, Math.min(ATLAS_DISTRICT_MAX_LIMIT, raw));
}

function encodeDistrictCursor(offset) {
  const payload = JSON.stringify({ offset: Math.max(0, Number(offset) || 0) });
  return Buffer.from(payload, 'utf8').toString('base64url');
}

function decodeDistrictCursor(rawCursor) {
  const raw = String(rawCursor || '').trim();
  if (!raw) return 0;
  try {
    const text = Buffer.from(raw, 'base64url').toString('utf8');
    const payload = JSON.parse(text);
    const offset = Number(payload?.offset);
    if (!Number.isFinite(offset) || offset < 0) return 0;
    return Math.floor(offset);
  } catch {
    return 0;
  }
}

function getDistrictVisibleAgents(snapshot, districtKey, optedOutSet, mediaByErcId, network = 'all') {
  const normalizedNetwork = normalizeDistrictNetwork(network);
  return (snapshot.agents || [])
    .filter((agent) => agent?.districtKey === districtKey)
    .filter((agent) => {
      if (normalizedNetwork === 'all') return true;
      const networkType = normalizeDistrictText(agent?.networkType || 'mainnet');
      return networkType === normalizedNetwork;
    })
    .filter((agent) => !optedOutSet.has(agent.erc8004Id))
    .map((agent) => withAtlasAgentMedia(agent, mediaByErcId));
}

function scoreDistrictQuery(agent, queryText, searchType) {
  const q = normalizeDistrictText(queryText);
  if (!q) return 0;

  const id = normalizeDistrictText(agent?.erc8004Id);
  const name = normalizeDistrictText(agent?.name);
  const description = normalizeDistrictText(agent?.description);
  const categories = Array.isArray(agent?.categories) ? agent.categories.map((row) => normalizeDistrictText(row)).filter(Boolean) : [];
  const haystack = [
    id,
    name,
    description,
    normalizeDistrictText(agent?.agentUrl),
    normalizeDistrictText(agent?.mcpEndpoint),
    normalizeDistrictText(agent?.a2aEndpoint),
    normalizeDistrictText(agent?.oasfEndpoint),
    ...categories
  ]
    .filter(Boolean)
    .join(' ');

  let score = 0;
  if (id === q) score += 900;
  else if (id.startsWith(q)) score += 700;
  else if (id.includes(q)) score += 560;
  if (name === q) score += 820;
  else if (name.startsWith(q)) score += 650;
  else if (name.includes(q)) score += 480;
  if (description.includes(q)) score += 180;

  const tokens = q.split(/\s+/).filter((token) => token.length >= 2);
  for (const token of tokens) {
    if (haystack.includes(token)) score += 70;
    if (searchType === 'semantic') {
      if (token === 'mcp' && agent?.hasMcp) score += 190;
      if (token === 'a2a' && agent?.hasA2a) score += 190;
      if ((token === 'x402' || token === 'pay') && agent?.x402Supported) score += 170;
      if ((token === 'verified' || token === 'endpoint') && agent?.isEndpointVerified) score += 150;
      if ((token === 'web' || token === 'site') && agent?.hasWeb) score += 120;
    }
  }
  if (searchType === 'semantic' && q.includes('service') && (agent?.hasMcp || agent?.hasA2a || agent?.isEndpointVerified)) score += 180;
  return score;
}

function sortDistrictRows(rows, sortKey) {
  const direction = sortKey.endsWith('_asc') ? 1 : -1;
  rows.sort((a, b) => {
    if (sortKey.startsWith('updated_')) {
      const byUpdated = (a.updatedAtMs - b.updatedAtMs) * direction;
      if (byUpdated !== 0) return byUpdated;
    } else if (sortKey.startsWith('relevance_')) {
      const byRelevance = (a.queryScore - b.queryScore) * direction;
      if (byRelevance !== 0) return byRelevance;
    } else {
      const leftScore = Number.isFinite(a.qualityScore) ? a.qualityScore : -1;
      const rightScore = Number.isFinite(b.qualityScore) ? b.qualityScore : -1;
      const byScore = (leftScore - rightScore) * direction;
      if (byScore !== 0) return byScore;
    }

    const byQuery = b.queryScore - a.queryScore;
    if (byQuery !== 0) return byQuery;
    const byUpdated = b.updatedAtMs - a.updatedAtMs;
    if (byUpdated !== 0) return byUpdated;
    const byName = String(a.name || '').localeCompare(String(b.name || ''));
    if (byName !== 0) return byName;
    return String(a.erc8004Id || '').localeCompare(String(b.erc8004Id || ''));
  });
}

function pickAgentPrefetchImage(agent) {
  return (
    agent?.media?.shareHero?.imageUrl
    || agent?.media?.agentAvatar?.imageUrl
    || (typeof agent?.imageUrl === 'string' ? agent.imageUrl : null)
    || null
  );
}

function buildDistrictSummaryFromAgents(district, agents, network = 'all') {
  const scoreBins = {
    score0: 0,
    score1to19: 0,
    score20to39: 0,
    score40to59: 0,
    score60to79: 0,
    score80plus: 0
  };
  const serviceCounts = {
    hasWeb: 0,
    hasMcp: 0,
    hasA2a: 0,
    endpointVerified: 0,
    x402Supported: 0,
    active: 0
  };
  let scored = 0;
  let scoreSum = 0;
  let scoreGt0 = 0;

  for (const agent of agents) {
    const score = toFiniteNumber(agent?.qualityScore) ?? 0;
    scored += 1;
    scoreSum += score;
    if (score > 0) scoreGt0 += 1;
    if (score === 0) scoreBins.score0 += 1;
    else if (score < 20) scoreBins.score1to19 += 1;
    else if (score < 40) scoreBins.score20to39 += 1;
    else if (score < 60) scoreBins.score40to59 += 1;
    else if (score < 80) scoreBins.score60to79 += 1;
    else scoreBins.score80plus += 1;

    if (agent?.hasWeb) serviceCounts.hasWeb += 1;
    if (agent?.hasMcp) serviceCounts.hasMcp += 1;
    if (agent?.hasA2a) serviceCounts.hasA2a += 1;
    if (agent?.isEndpointVerified) serviceCounts.endpointVerified += 1;
    if (agent?.x402Supported) serviceCounts.x402Supported += 1;
    if (agent?.isActive) serviceCounts.active += 1;
  }

  return {
    districtKey: district.key,
    districtLabel: district.label,
    network: normalizeDistrictNetwork(network),
    totals: {
      agents: agents.length,
      mainnet: Number(district?.mainnet?.agents || 0),
      testnet: Number(district?.testnets?.agents || 0),
      scoreGt0,
      scored,
      averageScore: scored > 0 ? Number((scoreSum / scored).toFixed(2)) : 0
    },
    scoreBins,
    serviceCounts
  };
}

function cacheGet(cache, key, signature, ttlMs, builder) {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.signature === signature && hit.expiresAt > now) {
    hit.touchedAt = now;
    return hit.value;
  }
  const value = builder();
  cache.set(key, {
    signature,
    value,
    expiresAt: now + ttlMs,
    touchedAt: now
  });
  pruneAtlasCache(cache);
  return value;
}

app.get('/api/leaderboard', (_req, res) => {
  const store = readStore();
  const { teams, referralsTotal } = buildLeaderboard(store);
  res.json({ ok: true, signups: store.signups.length, referralsTotal, teams });
});

app.get('/api/wall', (_req, res) => {
  const store = readStore();
  const { teams, referralsTotal } = buildLeaderboard(store);
  res.json({ ok: true, signups: store.signups.length, referralsTotal, teams });
});

app.get('/api/atlas/districts', (_req, res) => {
  const snapshot = getAtlasSnapshot();
  const { optedOutSet } = getAtlasStoreContext();
  const districts = buildVisibleAtlasDistricts(snapshot, optedOutSet);
  res.json({
    ok: true,
    meta: snapshot.meta,
    districts
  });
});

app.get('/api/atlas/district/:key/summary', (req, res) => {
  const key = typeof req.params?.key === 'string' ? req.params.key.trim() : '';
  if (!key) return res.status(400).json({ ok: false, error: 'MISSING_KEY' });
  const network = normalizeDistrictNetwork(req.query?.network);

  const snapshot = getAtlasSnapshot();
  const district = snapshot.districts.find((row) => row.key === key) || null;
  if (!district) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });

  const storeContext = getAtlasStoreContext();
  const signature = `${snapshot.meta?.signature || 'snapshot'}|${storeContext.signature}`;
  const cacheKey = `${key}|${network}`;
  const summary = cacheGet(
    atlasDistrictSummaryCache,
    cacheKey,
    signature,
    ATLAS_DISTRICT_CACHE_TTL_MS,
    () => {
      const visibleAgents = getDistrictVisibleAgents(snapshot, key, storeContext.optedOutSet, storeContext.mediaByErcId, network);
      return buildDistrictSummaryFromAgents(district, visibleAgents, network);
    }
  );

  return res.json({
    ok: true,
    meta: snapshot.meta,
    district,
    query: { network },
    summary
  });
});

app.get('/api/atlas/district/:key/agents', (req, res) => {
  const key = typeof req.params?.key === 'string' ? req.params.key.trim() : '';
  if (!key) return res.status(400).json({ ok: false, error: 'MISSING_KEY' });

  const network = normalizeDistrictNetwork(req.query?.network);
  const q = typeof req.query?.q === 'string' ? req.query.q.trim() : '';
  const searchType = normalizeDistrictSearchType(req.query?.searchType);
  const sort = normalizeDistrictSort(req.query?.sort);
  const limit = parseDistrictLimit(req.query?.limit, 24);
  const cursor = typeof req.query?.cursor === 'string' ? req.query.cursor : '';
  const offset = decodeDistrictCursor(cursor);

  const snapshot = getAtlasSnapshot();
  const district = snapshot.districts.find((row) => row.key === key) || null;
  if (!district) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });

  const storeContext = getAtlasStoreContext();
  const signature = `${snapshot.meta?.signature || 'snapshot'}|${storeContext.signature}`;
  const normalizedQuery = normalizeDistrictText(q);
  const cacheKey = [key, network, normalizedQuery, searchType, sort].join('|');
  const allRows = cacheGet(
    atlasDistrictAgentsCache,
    cacheKey,
    signature,
    ATLAS_DISTRICT_CACHE_TTL_MS,
    () => {
      const rows = getDistrictVisibleAgents(snapshot, key, storeContext.optedOutSet, storeContext.mediaByErcId, network)
        .map((agent) => {
          const qualityScore = toFiniteNumber(agent?.qualityScore);
          return {
            ...agent,
            qualityScore,
            queryScore: scoreDistrictQuery(agent, normalizedQuery, searchType),
            updatedAtMs: toEpochMs(agent?.updatedAt)
          };
        })
        .filter((agent) => !normalizedQuery || agent.queryScore > 0);
      sortDistrictRows(rows, sort);
      return rows;
    }
  );

  const start = Math.min(Math.max(0, offset), allRows.length);
  const end = Math.min(allRows.length, start + limit);
  const pageRows = allRows
    .slice(start, end)
    .map(({ updatedAtMs, ...agent }) => agent);
  const hasMore = end < allRows.length;
  const nextCursor = hasMore ? encodeDistrictCursor(end) : null;
  const prefetch = allRows
    .slice(end, Math.min(allRows.length, end + ATLAS_PREFETCH_IMAGE_COUNT))
    .map((agent) => ({
      erc8004Id: agent.erc8004Id,
      imageUrl: pickAgentPrefetchImage(agent)
    }))
    .filter((row) => typeof row.imageUrl === 'string' && row.imageUrl);

  return res.json({
    ok: true,
    meta: snapshot.meta,
    district,
    query: {
      q,
      network,
      searchType,
      sort
    },
    pagination: {
      limit,
      cursor: cursor || null,
      nextCursor,
      hasMore,
      total: allRows.length,
      returned: pageRows.length
    },
    results: pageRows,
    prefetch
  });
});

app.get('/api/atlas/district/:key', (req, res) => {
  const key = typeof req.params?.key === 'string' ? req.params.key.trim() : '';
  if (!key) return res.status(400).json({ ok: false, error: 'MISSING_KEY' });
  const snapshot = getAtlasSnapshot();
  const { optedOutSet, mediaByErcId } = getAtlasStoreContext();
  const district = snapshot.districts.find((d) => d.key === key) || null;
  if (!district) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const agents = getDistrictVisibleAgents(snapshot, key, optedOutSet, mediaByErcId)
    .slice()
    .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')) || String(a?.erc8004Id || '').localeCompare(String(b?.erc8004Id || '')));
  return res.json({ ok: true, meta: snapshot.meta, district, agents });
});

app.get('/api/atlas/agent/:erc8004Id', (req, res) => {
  const erc8004Id = typeof req.params?.erc8004Id === 'string' ? req.params.erc8004Id.trim() : '';
  if (!erc8004Id) return res.status(400).json({ ok: false, error: 'MISSING_ERC8004_ID' });
  const snapshot = getAtlasSnapshot();
  const { optedOutSet, mediaByErcId } = getAtlasStoreContext();
  if (optedOutSet.has(erc8004Id)) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const agentRow = (snapshot.agents || []).find((a) => a.erc8004Id === erc8004Id) || null;
  const agent = withAtlasAgentMedia(agentRow, mediaByErcId);
  if (!agent) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const district = snapshot.districts.find((d) => d.key === agent.districtKey) || null;
  return res.json({ ok: true, meta: snapshot.meta, agent, district });
});

app.get('/api/atlas/search', (req, res) => {
  const parseBooleanQuery = (value) => {
    const text = String(value ?? '').trim().toLowerCase();
    if (!text) return null;
    if (['1', 'true', 'yes', 'on'].includes(text)) return true;
    if (['0', 'false', 'no', 'off'].includes(text)) return false;
    return null;
  };
  const q = typeof req.query?.q === 'string' ? req.query.q : '';
  const familyRaw = typeof req.query?.family === 'string'
    ? req.query.family
    : (typeof req.query?.chainFamily === 'string' ? req.query.chainFamily : '');
  const searchType = typeof req.query?.searchType === 'string' ? req.query.searchType : '';
  const sortField = typeof req.query?.sortField === 'string' ? req.query.sortField : '';
  const sortDirection = typeof req.query?.sortDirection === 'string'
    ? req.query.sortDirection
    : (typeof req.query?.order === 'string' ? req.query.order : '');
  const hasWeb = parseBooleanQuery(req.query?.hasWeb);
  const hasMcp = parseBooleanQuery(req.query?.hasMcp);
  const hasA2a = parseBooleanQuery(req.query?.hasA2a);
  const active = parseBooleanQuery(req.query?.active);
  const category = typeof req.query?.category === 'string' ? req.query.category : '';
  const limitRaw = Number.parseInt(String(req.query?.limit || ''), 10);
  const limit = Number.isFinite(limitRaw) ? limitRaw : 20;
  const snapshot = getAtlasSnapshot();
  const { optedOutSet, mediaByErcId } = getAtlasStoreContext();
  const search = searchAtlasAgents(snapshot, {
    q,
    family: familyRaw,
    limit,
    searchType,
    sortField,
    sortDirection,
    hasWeb,
    hasMcp,
    hasA2a,
    active,
    category
  });
  const visibleResults = search.results.filter((row) => !optedOutSet.has(row.erc8004Id));
  return res.json({
    ok: true,
    meta: snapshot.meta,
    query: {
      q: search.query,
      family: search.family,
      searchType: search.searchType,
      sortField: search.sortField,
      sortDirection: search.sortDirection,
      hasWeb: search.filters.hasWeb,
      hasMcp: search.filters.hasMcp,
      hasA2a: search.filters.hasA2a,
      active: search.filters.active,
      category: search.filters.category,
      limit: search.limit,
      total: visibleResults.length
    },
    results: visibleResults.map((row) => ({
      ...row,
      media: mediaByErcId.get(row.erc8004Id) || null
    }))
  });
});

// --- Anchors (ERC-8004 routing directory) ---
const { verifyMessage } = require('ethers');
const ERC8004_OPTOUT_NONCE_TTL_MS = 10 * 60 * 1000;
const erc8004OptOutNonces = new Map();
const ERC8004_REGISTRATION_DRAFT_MAX_RECORD_BYTES = 64 * 1024;
const ERC8004_REGISTRATION_DRAFT_MAX_RECORDS = 500;
const ERC8004_REGISTRATION_TYPE = 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1';
const ERC8004_ENTITY_TYPES = new Set(['human', 'agent', 'tool', 'skill', 'experience', 'house']);
const ERC8004_CONTEXT_KINDS = new Set(['house', 'room', 'townhall', 'tool', 'skill', 'experience']);

function makeAnchorNonce() {
  return `an_${randomHex(16)}`;
}

function makeErc8004OptOutNonce() {
  return `eo_${randomHex(16)}`;
}

function makeErc8004RegistrationId() {
  return `reg_${randomHex(16)}`;
}

function makeErc8004RegistrationCompletionToken() {
  return `rct_${randomHex(24)}`;
}

function normalizeEvmAddress(value) {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!/^0x[0-9a-fA-F]{40}$/.test(raw)) return null;
  return raw.toLowerCase();
}

function timingSafeStringEquals(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const a = Buffer.from(left, 'utf8');
  const b = Buffer.from(right, 'utf8');
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function normalizeOptOutReason(value) {
  if (value == null) return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 280);
}

function normalizeErc8004Context(input) {
  if (!input || typeof input !== 'object') return null;
  const kind = typeof input.kind === 'string' ? input.kind.trim() : '';
  if (!ERC8004_CONTEXT_KINDS.has(kind)) return null;
  const out = { kind };
  if (typeof input.houseId === 'string' && input.houseId.trim()) out.houseId = input.houseId.trim();
  if (typeof input.roomId === 'string' && input.roomId.trim()) out.roomId = input.roomId.trim();
  if (typeof input.sourceUri === 'string' && input.sourceUri.trim()) out.sourceUri = input.sourceUri.trim();
  return out;
}

function isAllowedRegistrationServiceEndpoint(value) {
  if (typeof value !== 'string') return false;
  const clean = value.trim();
  if (!clean) return false;
  try {
    const parsed = new URL(clean);
    if (parsed.protocol === 'https:') return true;
    if (parsed.protocol !== 'http:') return false;
    const host = parsed.hostname.toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]';
  } catch {
    return false;
  }
}

function normalizeErc8004Services(input) {
  if (!Array.isArray(input) || !input.length) return null;
  const out = [];
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue;
    const name = typeof raw.name === 'string' ? raw.name.trim() : '';
    const endpoint = typeof raw.endpoint === 'string' ? raw.endpoint.trim() : '';
    if (!name || !endpoint) continue;
    if (!isAllowedRegistrationServiceEndpoint(endpoint)) continue;
    const entry = { name, endpoint };
    if (typeof raw.version === 'string' && raw.version.trim()) entry.version = raw.version.trim();
    if (Array.isArray(raw.skills)) {
      const skills = raw.skills.filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim());
      if (skills.length) entry.skills = skills;
    }
    if (Array.isArray(raw.domains)) {
      const domains = raw.domains.filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim());
      if (domains.length) entry.domains = domains;
    }
    out.push(entry);
  }
  if (!out.length) return null;
  const hasWeb = out.some((entry) => entry.name === 'web' && entry.endpoint);
  return hasWeb ? out : null;
}

function normalizeErc8004EntityType(value) {
  if (value == null || value === '') return 'agent';
  if (typeof value !== 'string') return null;
  const clean = value.trim().toLowerCase();
  if (!ERC8004_ENTITY_TYPES.has(clean)) return null;
  return clean;
}

function normalizeErc8004RegistrationDraftInput(body = {}) {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const description = typeof body?.description === 'string' ? body.description.trim() : '';
  const image = typeof body?.image === 'string' ? body.image.trim() : '';
  const services = normalizeErc8004Services(body?.services);
  const entityType = normalizeErc8004EntityType(body?.entityType);
  if (!name) return { error: 'INVALID_NAME' };
  if (!description) return { error: 'INVALID_DESCRIPTION' };
  if (!image) return { error: 'INVALID_IMAGE' };
  if (!services) return { error: 'INVALID_SERVICES' };
  if (!entityType) return { error: 'INVALID_ENTITY_TYPE' };

  const context = normalizeErc8004Context(body?.context);
  if (body?.context && !context) return { error: 'INVALID_CONTEXT' };

  const x402Support = body?.x402Support === true;
  const active = body?.active !== false;
  const supportedTrust = Array.isArray(body?.supportedTrust)
    ? body.supportedTrust.filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim())
    : [];

  const record = {
    regId: makeErc8004RegistrationId(),
    completionToken: makeErc8004RegistrationCompletionToken(),
    createdAtMs: Date.now(),
    updatedAtMs: Date.now(),
    ...(context ? { context } : {}),
    name,
    description,
    image,
    services,
    x402Support,
    active,
    supportedTrust,
    entityType
  };
  if (body?.permissionManifest != null) record.permissionManifest = body.permissionManifest;
  if (body?.provenance != null) record.provenance = body.provenance;
  return { record };
}

function buildErc8004TokenUri(req, regId) {
  const origin = `${req.protocol}://${req.get('host')}`;
  return `${origin}/api/erc8004/registration/${encodeURIComponent(regId)}.json`;
}

function buildErc8004RegistrationResponse(record) {
  const registrations = [];
  if (record?.onchain && typeof record.onchain === 'object') {
    registrations.push({
      agentId: Number(record.onchain.agentId),
      agentRegistry: `eip155:${Number(record.onchain.chainId)}:${record.onchain.identityRegistry}`
    });
  }

  const out = {
    type: ERC8004_REGISTRATION_TYPE,
    name: String(record?.name || ''),
    description: String(record?.description || ''),
    image: String(record?.image || ''),
    services: Array.isArray(record?.services) ? record.services : [],
    x402Support: record?.x402Support === true,
    active: record?.active !== false,
    registrations,
    supportedTrust: Array.isArray(record?.supportedTrust) ? record.supportedTrust : []
  };

  if (record?.entityType) out.entityType = record.entityType;
  if (Object.prototype.hasOwnProperty.call(record || {}, 'permissionManifest')) {
    out.permissionManifest = record.permissionManifest;
  }
  if (Object.prototype.hasOwnProperty.call(record || {}, 'provenance')) {
    out.provenance = record.provenance;
  }
  return out;
}

function buildErc8004OptOutMessage({ erc8004Id, nonce, mode = 'delete' }) {
  return [
    'AgentTown ERC-8004 Opt-Out',
    `erc8004Id: ${erc8004Id}`,
    `nonce: ${nonce}`,
    `mode: ${mode}`
  ].join('\n');
}

function pruneExpiredErc8004OptOutNonces(nowMs = Date.now()) {
  for (const [nonce, rec] of erc8004OptOutNonces.entries()) {
    if (!rec || typeof rec.createdAtMs !== 'number' || nowMs - rec.createdAtMs > ERC8004_OPTOUT_NONCE_TTL_MS) {
      erc8004OptOutNonces.delete(nonce);
    }
  }
}

function buildAnchorLinkMessage({ houseId, erc8004Id, origin, nonce, createdAtMs }) {
  return [
    'AgentTown Anchor Link',
    `houseId: ${houseId}`,
    `erc8004Id: ${erc8004Id}`,
    `origin: ${origin}`,
    `nonce: ${nonce}`,
    `createdAtMs: ${createdAtMs}`
  ].join('\n');
}

function buildErc8004ClaimMessage({ agentId, nonce }) {
  return [
    'Agent Town ERC-8004 Claim',
    `agentId: ${agentId}`,
    `nonce: ${nonce}`
  ].join('\n');
}

function normalizeSolanaAddress(value) {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  if (!v) return null;
  const bytes = base58Decode(v);
  if (!bytes || bytes.length !== 32) return null;
  return v;
}

function normalizeWalletSessionSolanaAddress(value) {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  if (!v) return null;
  if (v.length < 16 || v.length > 128) return null;
  if (/\s/.test(v)) return null;
  if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(v)) return null;
  return v;
}

function guessClaimChain(value) {
  const v = typeof value === 'string' ? value.trim() : '';
  if (!v) return null;
  if (/^solana:/i.test(v)) return 'solana';
  if (/^[1-9A-HJ-NP-Za-km-z]{32,64}$/.test(v)) return 'solana';
  return 'evm';
}

function listErc8004ClaimAliases(reservation) {
  if (!reservation || typeof reservation !== 'object') return [];
  const aliases = new Set();
  if (typeof reservation.key === 'string' && reservation.key.trim()) aliases.add(reservation.key.trim());
  const claimAliases = reservation.meta?.claimAliases;
  if (Array.isArray(claimAliases)) {
    for (const alias of claimAliases) {
      if (typeof alias !== 'string') continue;
      const clean = alias.trim();
      if (!clean) continue;
      aliases.add(clean);
    }
  }
  if (typeof reservation.meta?.agentId === 'string' && reservation.meta.agentId.trim()) {
    aliases.add(reservation.meta.agentId.trim());
  }
  return [...aliases];
}

function reservationAliasMatchesInput(alias, input) {
  if (alias === input) return true;

  // EVM IDs are case-insensitive; Solana asset IDs remain case-sensitive.
  const evmLike = alias.startsWith('evm:')
    || /^\d+:/.test(alias)
    || alias.includes('0x')
    || input.startsWith('evm:')
    || /^\d+:/.test(input)
    || input.includes('0x');
  if (!evmLike) return false;
  return alias.toLowerCase() === input.toLowerCase();
}

function resolveErc8004ClaimReservation(store, inputAgentId) {
  const cleanInput = typeof inputAgentId === 'string' ? inputAgentId.trim() : '';
  if (!cleanInput) return null;

  const candidates = (store.reservations || []).filter(
    (r) => r && r.kind === 'erc8004' && (r.status || 'reserved') !== 'deleted',
  );

  for (const reservation of candidates) {
    const aliases = listErc8004ClaimAliases(reservation);
    if (aliases.some((alias) => reservationAliasMatchesInput(alias, cleanInput))) {
      const chain = reservation.meta?.claimChain || guessClaimChain(reservation.key);
      const ownerRaw = reservation.meta?.ownerAddress;
      const ownerAddress = chain === 'evm'
        ? normalizeEvmAddress(ownerRaw)
        : chain === 'solana'
          ? normalizeSolanaAddress(ownerRaw)
          : null;
      if (!ownerAddress) return null;
      const canonicalAgentId = typeof reservation.meta?.agentId === 'string' && reservation.meta.agentId.trim()
        ? reservation.meta.agentId.trim()
        : reservation.key;
      return {
        reservation,
        claimChain: chain,
        ownerAddress,
        canonicalAgentId
      };
    }
  }
  return null;
}

function verifyEvmClaimSignature({ message, signature, address }) {
  const expected = normalizeEvmAddress(address);
  if (!expected) return false;
  let recovered = '';
  try {
    recovered = verifyMessage(message, signature) || '';
  } catch {
    return false;
  }
  return recovered.toLowerCase() === expected;
}

app.post('/api/erc8004/registration/draft', (req, res) => {
  const normalized = normalizeErc8004RegistrationDraftInput(req.body || {});
  if (normalized.error) {
    return res.status(400).json({ ok: false, error: normalized.error });
  }

  const recordSizeBytes = Buffer.byteLength(JSON.stringify(normalized.record), 'utf8');
  if (recordSizeBytes > ERC8004_REGISTRATION_DRAFT_MAX_RECORD_BYTES) {
    return res.status(413).json({ ok: false, error: 'REGISTRATION_DRAFT_TOO_LARGE' });
  }

  const store = readStore();
  store.erc8004Registrations = Array.isArray(store.erc8004Registrations) ? store.erc8004Registrations : [];
  const knownRegIds = new Set(
    store.erc8004Registrations
      .map((entry) => (entry && typeof entry.regId === 'string' ? entry.regId : ''))
      .filter(Boolean)
  );

  const record = { ...normalized.record };
  while (knownRegIds.has(record.regId)) {
    record.regId = makeErc8004RegistrationId();
  }
  store.erc8004Registrations.unshift(record);
  if (store.erc8004Registrations.length > ERC8004_REGISTRATION_DRAFT_MAX_RECORDS) {
    store.erc8004Registrations = store.erc8004Registrations.slice(0, ERC8004_REGISTRATION_DRAFT_MAX_RECORDS);
  }
  writeStore(store);

  return res.json({
    ok: true,
    regId: record.regId,
    tokenUri: buildErc8004TokenUri(req, record.regId),
    completionToken: record.completionToken
  });
});

app.get('/api/erc8004/registration/:regId.json', (req, res) => {
  const regId = typeof req.params?.regId === 'string' ? req.params.regId.trim() : '';
  if (!regId) return res.status(400).json({ ok: false, error: 'MISSING_REG_ID' });

  const store = readStore();
  const records = Array.isArray(store.erc8004Registrations) ? store.erc8004Registrations : [];
  const record = records.find((entry) => entry && entry.regId === regId);
  if (!record) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });

  res.setHeader('Cache-Control', 'no-store');
  return res.json(buildErc8004RegistrationResponse(record));
});

app.post('/api/erc8004/registration/complete', (req, res) => {
  const regId = typeof req.body?.regId === 'string' ? req.body.regId.trim() : '';
  const completionToken = typeof req.body?.completionToken === 'string' ? req.body.completionToken.trim() : '';
  const onchain = req.body?.onchain && typeof req.body.onchain === 'object' ? req.body.onchain : null;
  if (!regId) return res.status(400).json({ ok: false, error: 'MISSING_REG_ID' });
  if (!completionToken) return res.status(400).json({ ok: false, error: 'MISSING_COMPLETION_TOKEN' });
  if (!onchain) return res.status(400).json({ ok: false, error: 'MISSING_ONCHAIN' });

  const namespace = typeof onchain.namespace === 'string' ? onchain.namespace.trim() : '';
  const chainId = Number(onchain.chainId);
  const identityRegistry = normalizeEvmAddress(onchain.identityRegistry);
  const agentId = Number(onchain.agentId);
  if (namespace !== 'eip155') return res.status(400).json({ ok: false, error: 'INVALID_NAMESPACE' });
  if (!Number.isInteger(chainId) || chainId < 1) return res.status(400).json({ ok: false, error: 'INVALID_CHAIN_ID' });
  if (!identityRegistry) return res.status(400).json({ ok: false, error: 'INVALID_IDENTITY_REGISTRY' });
  if (!Number.isInteger(agentId) || agentId < 0) return res.status(400).json({ ok: false, error: 'INVALID_AGENT_ID' });

  const store = readStore();
  store.erc8004Registrations = Array.isArray(store.erc8004Registrations) ? store.erc8004Registrations : [];
  const index = store.erc8004Registrations.findIndex((entry) => entry && entry.regId === regId);
  if (index < 0) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });

  const prev = store.erc8004Registrations[index];
  const expectedCompletionToken = typeof prev?.completionToken === 'string' ? prev.completionToken.trim() : '';
  if (!expectedCompletionToken || !timingSafeStringEquals(completionToken, expectedCompletionToken)) {
    return res.status(403).json({ ok: false, error: 'INVALID_COMPLETION_TOKEN' });
  }

  const nextOnchain = {
    namespace: 'eip155',
    chainId,
    identityRegistry,
    agentId
  };
  if (prev?.onchain && typeof prev.onchain === 'object') {
    const same = prev.onchain.namespace === nextOnchain.namespace
      && Number(prev.onchain.chainId) === nextOnchain.chainId
      && normalizeEvmAddress(prev.onchain.identityRegistry) === nextOnchain.identityRegistry
      && Number(prev.onchain.agentId) === nextOnchain.agentId;
    if (same) return res.json({ ok: true, idempotent: true });
    return res.status(409).json({ ok: false, error: 'ALREADY_COMPLETED' });
  }

  store.erc8004Registrations[index] = {
    ...prev,
    updatedAtMs: Date.now(),
    onchain: nextOnchain
  };
  writeStore(store);
  return res.json({ ok: true });
});

app.get('/api/erc8004/optout/nonce', (req, res) => {
  const erc8004Id = typeof req.query?.erc8004Id === 'string' ? req.query.erc8004Id.trim() : '';
  if (!erc8004Id) return res.status(400).json({ ok: false, error: 'MISSING_ERC8004_ID' });
  const nowMs = Date.now();
  pruneExpiredErc8004OptOutNonces(nowMs);
  const nonce = makeErc8004OptOutNonce();
  erc8004OptOutNonces.set(nonce, { erc8004Id, createdAtMs: nowMs });
  const message = buildErc8004OptOutMessage({ erc8004Id, nonce, mode: 'delete' });
  res.json({ ok: true, erc8004Id, nonce, mode: 'delete', message });
});

app.post('/api/erc8004/optout', (req, res) => {
  const erc8004Id = typeof req.body?.erc8004Id === 'string' ? req.body.erc8004Id.trim() : '';
  const ownerAddress = typeof req.body?.ownerAddress === 'string' ? req.body.ownerAddress.trim() : '';
  const chainType = typeof req.body?.chainType === 'string' ? req.body.chainType.trim().toLowerCase() : '';
  const signature = typeof req.body?.signature === 'string' ? req.body.signature.trim() : '';
  const nonce = typeof req.body?.nonce === 'string' ? req.body.nonce.trim() : '';
  const reason = normalizeOptOutReason(req.body?.reason);
  const modeRaw = typeof req.body?.mode === 'string' ? req.body.mode.trim().toLowerCase() : 'delete';
  const mode = modeRaw || 'delete';

  if (!erc8004Id) return res.status(400).json({ ok: false, error: 'MISSING_ERC8004_ID' });
  if (!ownerAddress) return res.status(400).json({ ok: false, error: 'MISSING_OWNER_ADDRESS' });
  if (!chainType) return res.status(400).json({ ok: false, error: 'MISSING_CHAIN_TYPE' });
  if (!signature) return res.status(400).json({ ok: false, error: 'MISSING_SIGNATURE' });
  if (!nonce) return res.status(400).json({ ok: false, error: 'MISSING_NONCE' });
  if (mode !== 'delete') return res.status(400).json({ ok: false, error: 'INVALID_MODE' });

  const nonceRec = erc8004OptOutNonces.get(nonce);
  if (!nonceRec || nonceRec.erc8004Id !== erc8004Id) {
    return res.status(400).json({ ok: false, error: 'NONCE_INVALID' });
  }
  if (Date.now() - nonceRec.createdAtMs > ERC8004_OPTOUT_NONCE_TTL_MS) {
    erc8004OptOutNonces.delete(nonce);
    return res.status(400).json({ ok: false, error: 'NONCE_EXPIRED' });
  }

  let normalizedOwner = null;
  let signatureType = null;
  const message = buildErc8004OptOutMessage({ erc8004Id, nonce, mode: 'delete' });
  if (chainType === 'evm') {
    normalizedOwner = normalizeEvmAddress(ownerAddress);
    if (!normalizedOwner) return res.status(400).json({ ok: false, error: 'INVALID_OWNER_ADDRESS' });
    let recovered = '';
    try {
      recovered = verifyMessage(message, signature) || '';
    } catch {
      return res.status(401).json({ ok: false, error: 'AUTH_INVALID_SIGNATURE' });
    }
    if (normalizeEvmAddress(recovered) !== normalizedOwner) {
      return res.status(401).json({ ok: false, error: 'AUTH_INVALID_SIGNATURE' });
    }
    signatureType = 'eip191';
  } else if (chainType === 'solana') {
    return res.status(400).json({ ok: false, error: 'CHAIN_TYPE_UNSUPPORTED' });
  } else {
    return res.status(400).json({ ok: false, error: 'CHAIN_TYPE_UNSUPPORTED' });
  }

  // Consume nonce after successful auth proof.
  erc8004OptOutNonces.delete(nonce);

  const store = readStore();
  store.houses = Array.isArray(store.houses) ? store.houses : [];
  store.shares = Array.isArray(store.shares) ? store.shares : [];
  store.publicTeams = Array.isArray(store.publicTeams) ? store.publicTeams : [];
  store.anchors = Array.isArray(store.anchors) ? store.anchors : [];
  store.erc8004OptOut = Array.isArray(store.erc8004OptOut) ? store.erc8004OptOut : [];

  const anchor = store.anchors.find((a) => a && a.erc8004Id === erc8004Id) || null;
  if (!anchor) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });

  const signer = normalizeEvmAddress(anchor.signer);
  if (!signer || signer !== normalizedOwner) {
    return res.status(403).json({ ok: false, error: 'OWNERSHIP_MISMATCH' });
  }

  const houseId = typeof anchor.houseId === 'string' ? anchor.houseId.trim() : '';
  let removedShareIds = new Set();
  if (houseId) {
    removedShareIds = new Set(
      store.shares.filter((s) => s && s.houseId === houseId).map((s) => s.id)
    );
    store.houses = store.houses.filter((h) => !h || h.id !== houseId);
    store.shares = store.shares.filter((s) => !s || s.houseId !== houseId);
    store.publicTeams = store.publicTeams.filter((p) => {
      if (!p || typeof p !== 'object') return false;
      if (p.houseId === houseId) return false;
      if (removedShareIds.has(p.shareId)) return false;
      return true;
    });
  }
  store.anchors = store.anchors.filter((a) => !a || a.erc8004Id !== erc8004Id);

  const optedOutAt = nowIso();
  store.erc8004OptOut = store.erc8004OptOut.filter((row) => {
    if (!row || typeof row !== 'object') return false;
    return row.erc8004Id !== erc8004Id;
  });
  store.erc8004OptOut.unshift({
    erc8004Id,
    state: 'opted_out',
    optedOut: true,
    at: optedOutAt,
    ownerAddress: normalizedOwner,
    reason,
    mode: 'delete',
    signatureType,
    chainType,
    updatedAt: optedOutAt
  });

  writeStore(store);
  res.json({ ok: true, optedOut: true, erc8004Id });
});

app.get('/api/anchors/nonce', (req, res) => {
  const s = ensureHumanSession(req, res);
  const nonce = makeAnchorNonce();
  s.anchorPublishNonce = nonce;
  res.json({ ok: true, nonce });
});

app.post('/api/anchors/register', (req, res) => {
  const s = ensureHumanSession(req, res);
  const houseId = typeof req.body?.houseId === 'string' ? req.body.houseId.trim() : '';
  const erc8004Id = typeof req.body?.erc8004Id === 'string' ? req.body.erc8004Id.trim() : '';
  const signer = typeof req.body?.signer === 'string' ? req.body.signer.trim() : '';
  const signature = typeof req.body?.signature === 'string' ? req.body.signature.trim() : '';
  const origin = typeof req.body?.origin === 'string' ? req.body.origin.trim() : '';
  const nonce = typeof req.body?.nonce === 'string' ? req.body.nonce.trim() : '';
  const createdAtMs = Number(req.body?.createdAtMs || 0);
  const chainId = Number(req.body?.chainId || 0);

  if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  if (!erc8004Id) return res.status(400).json({ ok: false, error: 'MISSING_ERC8004_ID' });
  if (!signer) return res.status(400).json({ ok: false, error: 'MISSING_SIGNER' });
  if (!signature) return res.status(400).json({ ok: false, error: 'MISSING_SIGNATURE' });
  if (!nonce) return res.status(400).json({ ok: false, error: 'MISSING_NONCE' });
  if (!createdAtMs) return res.status(400).json({ ok: false, error: 'MISSING_TIMESTAMP' });

  if (!s.anchorPublishNonce || nonce !== s.anchorPublishNonce) {
    return res.status(400).json({ ok: false, error: 'NONCE_MISMATCH' });
  }

  const expectedOrigin = `${req.protocol}://${req.get('host')}`;
  // Require message origin to match server origin (prevents signing for a different site).
  if (origin && origin !== expectedOrigin) {
    return res.status(400).json({ ok: false, error: 'ORIGIN_MISMATCH' });
  }

  const msg = buildAnchorLinkMessage({
    houseId,
    erc8004Id,
    origin: expectedOrigin,
    nonce,
    createdAtMs
  });

  let recovered = '';
  try {
    recovered = verifyMessage(msg, signature) || '';
  } catch {
    return res.status(401).json({ ok: false, error: 'BAD_SIGNATURE' });
  }

  if (recovered.toLowerCase() !== signer.toLowerCase()) {
    return res.status(401).json({ ok: false, error: 'SIGNER_MISMATCH' });
  }

  const verifiedClaim = s?.claim?.erc8004;
  const verifiedAt = Number(verifiedClaim?.verifiedAt || 0);
  if (!Number.isFinite(verifiedAt) || verifiedAt <= 0) {
    return res.status(403).json({ ok: false, error: 'ANCHOR_CLAIM_REQUIRED' });
  }
  if (!reservationAliasMatchesInput(String(verifiedClaim?.agentId || ''), erc8004Id)) {
    return res.status(403).json({ ok: false, error: 'ANCHOR_CLAIM_REQUIRED' });
  }

  const reservedHouseId = typeof verifiedClaim?.reservedHouseId === 'string'
    ? verifiedClaim.reservedHouseId.trim()
    : '';
  if (reservedHouseId && reservedHouseId !== houseId) {
    return res.status(403).json({ ok: false, error: 'HOUSE_MISMATCH' });
  }

  const verifiedOwner = normalizeEvmAddress(verifiedClaim?.address || verifiedClaim?.ownerAddress);
  const normalizedSigner = normalizeEvmAddress(signer);
  if (!verifiedOwner || !normalizedSigner || verifiedOwner !== normalizedSigner) {
    return res.status(403).json({ ok: false, error: 'ANCHOR_OWNER_MISMATCH' });
  }

  // Consume nonce
  s.anchorPublishNonce = null;

  const store = readStore();
  const houseExists = store.houses.find((h) => h && h.id === houseId);
  if (!houseExists) return res.status(404).json({ ok: false, error: 'HOUSE_NOT_FOUND' });

  // Upsert by erc8004Id (latest wins)
  store.anchors = Array.isArray(store.anchors) ? store.anchors : [];
  store.anchors = store.anchors.filter((a) => a && a.erc8004Id !== erc8004Id);
  store.anchors.unshift({
    erc8004Id,
    houseId,
    signer,
    chainId: chainId || null,
    createdAtMs,
    updatedAt: nowIso()
  });

  writeStore(store);
  res.json({ ok: true });
});

app.get('/api/anchors/resolve', (req, res) => {
  const erc8004Id = typeof req.query?.erc8004Id === 'string' ? req.query.erc8004Id.trim() : '';
  if (!erc8004Id) return res.status(400).json({ ok: false, error: 'MISSING_ERC8004_ID' });
  const store = readStore();
  const rec = (store.anchors || []).find((a) => a && a.erc8004Id === erc8004Id);
  if (!rec) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  res.json({ ok: true, erc8004Id, houseId: rec.houseId });
});

// --- Test-only reset endpoint ---
if (process.env.NODE_ENV === 'test') {
  app.post('/__test__/reset', (_req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = _req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    writeStore({
      signups: [],
      shares: [],
      publicTeams: [],
      houses: [],
      claims: [],
      reservations: [],
      milestones: [],
      rewardsLedger: [],
      anchors: [],
      inbox: [],
      erc8004OptOut: [],
      erc8004Registrations: []
    });
    resetExtendedStore();
    resetUnifiedPlatformStore();
    resetPokerOperatorState();
    resetEmailOtpAdapter();
    invalidateAtlasStoreCaches();
    resetAllSessions();
    rateBuckets.clear();
    ponyRateBuckets.clear();
    erc8004OptOutNonces.clear();
    res.json({ ok: true });
  });

  app.get('/__test__/counts/:table', (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const tableName = String(req.params.table || '').trim();
    const count = isUnifiedPlatformTable(tableName)
      ? countUnifiedPlatformTableRows(tableName)
      : countTableRows(tableName);
    return res.json({
      ok: true,
      table: tableName,
      count: Number(count || 0)
    });
  });

  app.get('/__test__/registry/grouped-preview', (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    return res.json({
      ok: true,
      groups: searchRegistryFamilyGroups({
        query: typeof req.query?.q === 'string' ? req.query.q : '',
        family: typeof req.query?.family === 'string' ? req.query.family : '',
      }),
    });
  });

  app.get('/__test__/unified-platform/stats', (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    return res.json({
      ok: true,
      stats: getUnifiedPlatformTestStats(),
    });
  });

  app.get('/__test__/unified-platform/inspect/:inspector', (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const inspector = String(req.params.inspector || '').trim().toLowerCase();
    let data = null;
    if (inspector === 'library') {
      data = getUnifiedPlatformLibraryInspector();
    } else if (inspector === 'revisions') {
      data = getUnifiedPlatformRevisionsInspector();
    } else if (inspector === 'conversation-artifacts') {
      data = getUnifiedPlatformConversationArtifactsInspector();
    } else if (inspector === 'shelves') {
      data = getUnifiedPlatformShelvesInspector();
    } else if (inspector === 'scopes') {
      data = getUnifiedPlatformScopesInspector();
    } else if (inspector === 'publications') {
      data = getUnifiedPlatformPublicationsInspector();
    } else if (inspector === 'route-sync') {
      data = getUnifiedPlatformRouteSyncInspector();
    } else if (inspector === 'peer-relay') {
      data = getUnifiedPlatformPeerRelayInspector();
    } else if (inspector === 'satchel-exchange') {
      data = getUnifiedPlatformSatchelExchangeInspector();
    } else if (inspector === 'public-stacks') {
      data = getUnifiedPlatformPublicStacksInspector();
    } else if (inspector === 'public-stack-trust') {
      data = getUnifiedPlatformPublicStackTrustInspector();
    } else if (inspector === 'public-stack-reviews') {
      data = getUnifiedPlatformPublicStackReviewsInspector();
    } else if (inspector === 'public-stack-safety') {
      data = getUnifiedPlatformPublicStackSafetyInspector();
    } else if (inspector === 'public-stack-attestations') {
      data = getUnifiedPlatformPublicStackAttestationsInspector();
    } else if (inspector === 'public-stack-attestation-provenance') {
      data = getUnifiedPlatformPublicStackAttestationProvenanceInspector();
    } else if (inspector === 'public-stack-attestation-verification-receipts') {
      data = getUnifiedPlatformPublicStackAttestationVerificationReceiptsInspector();
    } else if (inspector === 'prompt-preview') {
      data = getUnifiedPlatformPromptPreview();
    } else if (inspector === 'editor') {
      data = getUnifiedPlatformEditorSnapshot();
    } else if (inspector === 'registry-preview') {
      data = getUnifiedPlatformRegistryPreviewSnapshot();
    } else if (inspector === 'benchmarks') {
      data = getUnifiedPlatformBenchmarksSnapshot();
    } else {
      return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    }
    return res.json({
      ok: true,
      inspector,
      data,
    });
  });

  app.get('/__test__/route-manifest', (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    return res.json({
      ok: true,
      routes: getRouteOwnerManifest(),
    });
  });

  app.get('/__test__/live-suites', (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    return res.json({
      ok: true,
      suites: getLiveSuiteManifest(),
      statuses: getLiveSuiteStatuses(),
    });
  });

  app.post('/__test__/otp/email/issue', express.json({ limit: '16kb' }), (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const provider = typeof req.body?.provider === 'string' ? req.body.provider.trim() : 'stub';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    if (!email) return res.status(400).json({ ok: false, error: 'INVALID_ARGUMENT' });
    try {
      const record = issueEmailOtp({
        provider,
        email,
        code: typeof req.body?.code === 'string' ? req.body.code.trim() : '',
        nowIso: nowIso(),
      });
      return res.json({ ok: true, record });
    } catch {
      return res.status(400).json({ ok: false, error: 'INVALID_ARGUMENT' });
    }
  });

  app.get('/__test__/otp/email/latest', (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const provider = typeof req.query?.provider === 'string' ? req.query.provider.trim() : 'stub';
    const email = typeof req.query?.email === 'string' ? req.query.email.trim() : '';
    if (!email) return res.status(400).json({ ok: false, error: 'INVALID_ARGUMENT' });
    const record = getLatestEmailOtp({ provider, email });
    if (!record) return res.status(404).json({ ok: false, error: 'OTP_NOT_FOUND' });
    return res.json({ ok: true, record });
  });

  app.post('/__test__/otp/email/consume', express.json({ limit: '16kb' }), (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const provider = typeof req.body?.provider === 'string' ? req.body.provider.trim() : 'stub';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
    if (!email || !code) return res.status(400).json({ ok: false, error: 'INVALID_ARGUMENT' });
    const outcome = consumeEmailOtp({ provider, email, code, nowIso: nowIso() });
    if (!outcome.ok) {
      return res.status(409).json({
        ok: false,
        error: outcome.error,
        record: outcome.record,
      });
    }
    return res.json({ ok: true, record: outcome.record });
  });

  app.get('/__test__/otp/email/activity', (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const provider = typeof req.query?.provider === 'string' ? req.query.provider.trim() : '';
    const email = typeof req.query?.email === 'string' ? req.query.email.trim() : '';
    return res.json({
      ok: true,
      activity: getEmailOtpActivity({ provider, email }),
    });
  });

  app.get('/__test__/platform-export', (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    return res.json({
      ok: true,
      snapshot: exportPlatformStateSnapshot(),
    });
  });

  app.post('/__test__/platform-import', express.json({ limit: '2mb' }), (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const snapshot = req.body?.snapshot && typeof req.body.snapshot === 'object' ? req.body.snapshot : null;
    if (!snapshot) return res.status(400).json({ ok: false, error: 'INVALID_ARGUMENT' });
    const imported = importPlatformStateSnapshot(snapshot, { reset: req.body?.reset !== false });
    return res.json({ ok: true, snapshot: imported });
  });

  app.post('/__test__/platform-verify', express.json({ limit: '2mb' }), (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const snapshot = req.body?.snapshot && typeof req.body.snapshot === 'object' ? req.body.snapshot : null;
    if (!snapshot) return res.status(400).json({ ok: false, error: 'INVALID_ARGUMENT' });
    return res.json({
      ok: true,
      verification: verifyPlatformStateSnapshot(snapshot),
    });
  });

  app.get('/__test__/unified-platform/fixtures', (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    return res.json({
      ok: true,
      families: listUnifiedPlatformFixtureFamilies(),
    });
  });

  app.get('/__test__/unified-platform/fixtures/:family', (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const fixture = getUnifiedPlatformTestFixture(req.params.family);
    if (!fixture) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    return res.json({
      ok: true,
      family: String(req.params.family || '').trim(),
      fixture,
    });
  });

  app.post('/__test__/unified-platform/sealed-contexts/seed', express.json({ limit: '32kb' }), (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const houseId = typeof req.body?.houseId === 'string' ? req.body.houseId.trim() : '';
    if (!houseId) return res.status(400).json({ ok: false, error: 'INVALID_ARGUMENT' });
    const seeded = buildSeededSealedContextRecord({
      houseId,
      traceId: typeof req.body?.traceId === 'string' ? req.body.traceId.trim() : '',
      runId: typeof req.body?.runId === 'string' ? req.body.runId.trim() : '',
      releasePolicy: typeof req.body?.releasePolicy === 'string' ? req.body.releasePolicy.trim() : 'manual',
      status: typeof req.body?.status === 'string' ? req.body.status.trim() : 'active',
    });
    const context = upsertSealedContext({
      houseId: seeded.houseId,
      sealedContextId: seeded.sealedContextId,
      traceId: seeded.traceId,
      runId: seeded.runId,
      entrantId: seeded.entrantId,
      scopeType: seeded.scopeType,
      scopeKey: seeded.scopeKey,
      allowedReaders: seeded.allowedReaders,
      forbiddenSources: seeded.forbiddenSources,
      releasePolicy: seeded.releasePolicy,
      status: seeded.status,
      nowIso: nowIso(),
    });
    return res.json({ ok: true, sealedContext: context });
  });

  app.post('/__test__/unified-platform/config-versions', express.json({ limit: '64kb' }), (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });

    const configVersionId = typeof req.body?.configVersionId === 'string' ? req.body.configVersionId.trim() : '';
    const houseId = typeof req.body?.houseId === 'string' ? req.body.houseId.trim() : '';
    const teamId = typeof req.body?.teamId === 'string' ? req.body.teamId.trim() : '';
    const status = typeof req.body?.status === 'string' ? req.body.status.trim() : 'active';
    if (!configVersionId || !houseId || !teamId) {
      return res.status(400).json({ ok: false, error: 'INVALID_ARGUMENT' });
    }

    const manifest = req.body?.manifest && typeof req.body.manifest === 'object' && !Array.isArray(req.body.manifest)
      ? req.body.manifest
      : {
        configVersionId,
        houseId,
        teamId,
        branch: 'stable',
        status,
        resolvedComponents: {
          housePolicyVersionId: 'hpv_fixture_01',
          teamCompositionVersionId: 'tcv_fixture_01',
          agentConfigVersionIds: ['agv_fixture_01'],
          officePolicyVersionIds: [],
          experiencePresetVersionId: 'epv_fixture_01',
          integrationOverlayVersionIds: [],
          trainerPresetVersionId: 'tpv_fixture_01',
        },
      };
    const configHash = sha256PrefixedHex(JSON.stringify(manifest));
    const record = upsertConfigVersion({
      configVersionId,
      houseId,
      teamId,
      experienceId: typeof manifest?.experienceId === 'string' ? manifest.experienceId.trim() : '',
      status,
      configHash,
      manifest,
      lineage: { seededBy: 'playwright' },
      nowIso: nowIso(),
    });
    return res.json({
      ok: true,
      config: record,
    });
  });

  app.get('/__test__/unified-platform/config-versions/:configVersionId', (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const config = getConfigVersion(req.params.configVersionId);
    if (!config) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    return res.json({
      ok: true,
      config,
      componentVersions: listConfigComponentVersions(config.configVersionId),
    });
  });

  app.get('/__test__/unified-platform/traces/:traceId/events', (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    return res.json({
      ok: true,
      events: listTraceEvents(req.params.traceId),
    });
  });

  app.post('/__test__/unified-platform/runs/:runId/status', express.json({ limit: '32kb' }), (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const status = typeof req.body?.status === 'string' ? req.body.status.trim() : '';
    if (!status) return res.status(400).json({ ok: false, error: 'INVALID_ARGUMENT' });
    const completedAt = status === 'completed' ? nowIso() : null;
    const run = updateRunStatus({
      runId: req.params.runId,
      status,
      completedAt,
      nowIso: nowIso(),
    });
    return res.json({
      ok: !!run,
      run,
    });
  });

  app.post('/__test__/web/credentials/activate', (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const brokerSessionId = typeof req.body?.brokerSessionId === 'string' ? req.body.brokerSessionId.trim() : '';
    if (!brokerSessionId) return res.status(400).json({ ok: false, error: 'MISSING_BROKER_SESSION_ID' });
    const grant = activateCredentialGrant({
      brokerSessionId,
      redactedLabel: typeof req.body?.redactedLabel === 'string' ? req.body.redactedLabel.trim() : 'Test Credential',
      expiresAt: typeof req.body?.expiresAt === 'string' ? req.body.expiresAt.trim() : null
    });
    if (!grant) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    res.json({ ok: true, grant });
  });

  app.post('/__test__/session/bind-wallet', (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const s = ensureHumanSession(req, res);
    const chain = typeof req.body?.chain === 'string' ? req.body.chain.trim() : 'solana';
    const address = typeof req.body?.address === 'string' ? req.body.address.trim() : '';
    if (!address) return res.status(400).json({ ok: false, error: 'MISSING_ADDRESS' });
    bindSessionWallet(s, chain, address, { allowRebind: true });
    res.json({ ok: true, sessionId: s.sessionId, chain, address });
  });

  app.post('/__test__/session/attach-house', (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const houseId = typeof req.body?.houseId === 'string' ? req.body.houseId.trim() : '';
    const teamId = typeof req.body?.teamId === 'string' ? req.body.teamId.trim() : '';
    if (!houseId) return res.status(400).json({ ok: false, error: 'INVALID_ARGUMENT' });
    const session = ensureHumanSession(req, res);
    session.houseCeremony = session.houseCeremony || {};
    session.houseCeremony.houseId = houseId;
    session.houseCeremony.createdAt = session.houseCeremony.createdAt || nowIso();
    if (teamId) session.activeTeamId = teamId;
    indexHouseId(session, houseId);
    const context = buildPlatformContextResponse(session);
    return res.json({ ok: true, houseId, sessionId: session.sessionId, activeTeamId: context.activeTeamId, availableTeamIds: context.availableTeamIds });
  });

  app.post('/__test__/session/bootstrap-onboarding', (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });

    const s = ensureHumanSession(req, res);
    const onboarding = ensureSessionOnboarding(s);
    const input = req.body && typeof req.body === 'object' ? req.body : {};
    const profileInput = input.profile && typeof input.profile === 'object' ? input.profile : {};
    const ercInput = input.erc8004 && typeof input.erc8004 === 'object' ? input.erc8004 : {};
    const walletsInput = Array.isArray(input.wallets) ? input.wallets : [];
    const updatedAt = nowIso();
    const normalizedStep = normalizeOnboardingStep(input.step);

    const humanName = normalizeTownhallName(profileInput.humanName) || 'Test Human';
    const agentName = normalizeTownhallName(profileInput.agentName) || s.agent?.name || 'OpenClaw';
    const humanPrompt = normalizeTownhallPrompt(profileInput.humanPrompt) || 'Deterministic Town Hall human avatar prompt';
    const agentPrompt = normalizeTownhallPrompt(profileInput.agentPrompt) || 'Deterministic Town Hall agent avatar prompt';

    onboarding.profile = onboarding.profile || {};
    onboarding.profile.humanName = humanName;
    onboarding.profile.agentName = agentName;
    onboarding.profile.humanAvatar = {
      image: DEFAULT_TOWNHALL_HUMAN_IMAGE,
      prompt: humanPrompt,
      source: 'default',
      updatedAt,
    };
    onboarding.profile.agentAvatar = {
      image: DEFAULT_TOWNHALL_AGENT_IMAGE,
      prompt: agentPrompt,
      source: 'default',
      updatedAt,
    };
    const userEvmInput = ercInput?.user?.evm && typeof ercInput.user.evm === 'object' ? ercInput.user.evm : {};
    const userSolanaInput = ercInput?.user?.solana && typeof ercInput.user.solana === 'object' ? ercInput.user.solana : {};
    const agentEvmInput = ercInput?.agent?.evm && typeof ercInput.agent.evm === 'object' ? ercInput.agent.evm : {};
    const agentSolanaInput = ercInput?.agent?.solana && typeof ercInput.agent.solana === 'object' ? ercInput.agent.solana : {};
    onboarding.erc8004 = {
      user: {
        evm: {
          id: typeof userEvmInput.id === 'string' && userEvmInput.id.trim()
            ? userEvmInput.id.trim()
            : '11155111:901',
          chain: typeof userEvmInput.chain === 'string' && userEvmInput.chain.trim()
            ? userEvmInput.chain.trim()
            : 'sepolia',
          txHash: typeof userEvmInput.txHash === 'string' && userEvmInput.txHash.trim()
            ? userEvmInput.txHash.trim()
            : '0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeff11',
          updatedAt,
        },
        solana: {
          id: typeof userSolanaInput.id === 'string' && userSolanaInput.id.trim()
            ? userSolanaInput.id.trim()
            : 'solana:UserAssetPubkeyMock1111111111111111111111111111',
          cluster: typeof userSolanaInput.cluster === 'string' && userSolanaInput.cluster.trim()
            ? userSolanaInput.cluster.trim()
            : 'devnet',
          txSig: typeof userSolanaInput.txSig === 'string' && userSolanaInput.txSig.trim()
            ? userSolanaInput.txSig.trim()
            : '5fWrv4Mm7KxXw4VjQYw9r9k6nJg2wG2GQ6f4zS5aNehNZm6v4W4JUEV5h2wNQ1',
          updatedAt,
        },
      },
      agent: {
        evm: {
          id: typeof agentEvmInput.id === 'string' && agentEvmInput.id.trim()
            ? agentEvmInput.id.trim()
            : '11155111:902',
          chain: typeof agentEvmInput.chain === 'string' && agentEvmInput.chain.trim()
            ? agentEvmInput.chain.trim()
            : 'sepolia',
          txHash: typeof agentEvmInput.txHash === 'string' && agentEvmInput.txHash.trim()
            ? agentEvmInput.txHash.trim()
            : '0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeff22',
          updatedAt,
        },
        solana: {
          id: typeof agentSolanaInput.id === 'string' && agentSolanaInput.id.trim()
            ? agentSolanaInput.id.trim()
            : 'solana:AgentAssetPubkeyMock111111111111111111111111111',
          cluster: typeof agentSolanaInput.cluster === 'string' && agentSolanaInput.cluster.trim()
            ? agentSolanaInput.cluster.trim()
            : 'devnet',
          txSig: typeof agentSolanaInput.txSig === 'string' && agentSolanaInput.txSig.trim()
            ? agentSolanaInput.txSig.trim()
            : '5fWrv4Mm7KxXw4VjQYw9r9k6nJg2wG2GQ6f4zS5aNehNZm6v4W4JUEV5h2wNQ2',
          updatedAt,
        },
      },
    };
    onboarding.required = ONBOARDING_REQUIRED;
    onboarding.registrationComplete = true;
    onboarding.registeredAt = onboarding.registeredAt || updatedAt;
    onboarding.step = normalizedStep || ONBOARDING_STEP_DONE;

    for (const wallet of walletsInput) {
      const chain = typeof wallet?.chain === 'string' ? wallet.chain.trim() : '';
      const address = typeof wallet?.address === 'string' ? wallet.address.trim() : '';
      if (!chain || !address) continue;
      bindSessionWallet(s, chain, address, { allowRebind: true });
    }

    res.json({
      ok: true,
      sessionId: s.sessionId,
      onboarding: cloneOnboarding(onboarding),
      walletBindings: Array.isArray(s.walletBindings) ? s.walletBindings : [],
    });
  });

  app.post('/__test__/session/bootstrap-signup', (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });

    const s = ensureHumanSession(req, res);
    const input = req.body && typeof req.body === 'object' ? req.body : {};
    const requestedMode = typeof input.mode === 'string' ? input.mode.trim().toLowerCase() : 'agent';
    const mode = requestedMode === 'token' || requestedMode === 'claim' ? requestedMode : 'agent';
    const address = typeof input.address === 'string' ? input.address.trim() : '';
    const now = nowIso();

    s.signup.complete = true;
    s.signup.createdAt = s.signup.createdAt || now;
    s.signup.mode = mode;
    s.signup.address = mode === 'token' && address ? address : null;

    if (mode === 'token' && s.signup.address) {
      s.token = s.token || { verifiedAt: null, address: null };
      s.token.verifiedAt = Date.now();
      s.token.address = s.signup.address;
      bindSessionWallet(s, 'solana', s.signup.address, { allowRebind: true });
    }

    if (mode === 'claim' && address) {
      s.claim = s.claim || {};
      s.claim.erc8004 = {
        ...(s.claim.erc8004 && typeof s.claim.erc8004 === 'object' ? s.claim.erc8004 : {}),
        address,
        claimChain: 'solana',
        verifiedAt: Date.now(),
      };
      bindSessionWallet(s, 'solana', address, { allowRebind: true });
    }

    res.json({
      ok: true,
      sessionId: s.sessionId,
      signup: { ...s.signup },
      token: s.token || null,
      claim: s.claim || null,
    });
  });

  app.post('/__test__/poker/operator-fixture', (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const fixture = req.body && typeof req.body === 'object' ? req.body : {};
    const snapshot = seedPokerOperatorState(fixture);
    return res.json({ ok: true, snapshot });
  });

  app.get('/__test__/poker/submissions/:submissionId', (req, res) => {
    const token = process.env.TEST_RESET_TOKEN;
    if (!token) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const header = req.header('x-test-reset');
    if (header !== token) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const submission = getPokerSubmissionById(req.params.submissionId);
    if (!submission) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    return res.json({ ok: true, submission });
  });
}

// --- Houses (Phase 1 MVP) ---
function makeNonce() {
  return `n_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

app.get('/api/house/nonce', (_req, res) => {
  res.json({ ok: true, nonce: makeNonce() });
});

app.get('/api/wallet/nonce', (req, res) => {
  const s = ensureHumanSession(req, res);
  const nonce = `wn_${randomHex(16)}`;
  s.walletLookupNonce = nonce;
  res.json({ ok: true, nonce });
});

app.post('/api/wallet/lookup', (req, res) => {
  const s = ensureHumanSession(req, res);
  const address = typeof req.body?.address === 'string' ? req.body.address.trim() : '';
  const signature = typeof req.body?.signature === 'string' ? req.body.signature.trim() : '';
  const nonce = typeof req.body?.nonce === 'string' ? req.body.nonce.trim() : '';
  const houseId = typeof req.body?.houseId === 'string' ? req.body.houseId.trim() : '';
  if (!address) return res.status(400).json({ ok: false, error: 'MISSING_ADDRESS' });
  if (!signature) return res.status(400).json({ ok: false, error: 'MISSING_SIGNATURE' });
  const usingNonce = !!nonce;
  if (usingNonce) {
    if (nonce !== s.walletLookupNonce) return res.status(400).json({ ok: false, error: 'NONCE_MISMATCH' });
    const msg = buildWalletLookupMessage({ address, nonce, houseId: houseId || null });
    if (!isTestMockAddress(address) && !verifySolanaSignature(address, msg, signature)) {
      return res.status(401).json({ ok: false, error: 'BAD_SIGNATURE' });
    }
    s.walletLookupNonce = null;
  } else {
    if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
    const msg = buildHouseKeyWrapMessage({ houseId });
    if (!isTestMockAddress(address) && !verifySolanaSignature(address, msg, signature)) {
      return res.status(401).json({ ok: false, error: 'BAD_SIGNATURE' });
    }
  }

  const store = readStore();
  let matches = store.houses.filter(
    (r) => r && unlockAddressForLookup(r.unlock) === address
  );
  if (houseId) {
    matches = matches.filter((r) => r.id === houseId);
    if (!matches.length) return res.status(404).json({ ok: false, error: 'HOUSE_NOT_FOUND' });
  }
  if (!matches.length) return res.json({ ok: true, houseId: null, keyWrap: null });
  matches.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
  const house = matches[matches.length - 1];
  if (house?.id) {
    s.houseCeremony.houseId = house.id;
    s.houseCeremony.createdAt = s.houseCeremony.createdAt || house.createdAt || nowIso();
    indexHouseId(s, house.id);
  }
  bindSessionWallet(s, 'solana', address, { allowRebind: true });
  res.json({
    ok: true,
    houseId: house.id,
    keyWrap: house.keyWrap || null
  });
});

app.get('/api/token/nonce', (req, res) => {
  const s = ensureHumanSession(req, res);
  const nonce = `tn_${randomHex(16)}`;
  s.tokenLookupNonce = nonce;
  res.json({ ok: true, nonce });
});

app.post('/api/token/verify', async (req, res) => {
  const s = ensureHumanSession(req, res);
  const address = typeof req.body?.address === 'string' ? req.body.address.trim() : '';
  const signature = typeof req.body?.signature === 'string' ? req.body.signature.trim() : '';
  const nonce = typeof req.body?.nonce === 'string' ? req.body.nonce.trim() : '';
  if (!address) return res.status(400).json({ ok: false, error: 'MISSING_ADDRESS' });
  if (!signature) return res.status(400).json({ ok: false, error: 'MISSING_SIGNATURE' });
  if (!nonce) return res.status(400).json({ ok: false, error: 'MISSING_NONCE' });
  if (nonce !== s.tokenLookupNonce) return res.status(400).json({ ok: false, error: 'NONCE_MISMATCH' });

  const msg = buildTokenCheckMessage({ address, nonce, ca: ELIZATOWN_MINT });
  const testAddr = process.env.TEST_TOKEN_ADDRESS || 'So1anaMockToken1111111111111111111111111111';
  const skipSig = process.env.NODE_ENV === 'test' && address === testAddr;
  if (!skipSig && !verifySolanaSignature(address, msg, signature)) {
    return res.status(401).json({ ok: false, error: 'BAD_SIGNATURE' });
  }
  s.tokenLookupNonce = null;
  bindSessionWallet(s, 'solana', address, { allowRebind: true });

  if (s.signup.complete && s.signup.mode === 'token' && s.signup.address && s.signup.address !== address) {
    return res.status(409).json({ ok: false, error: 'ADDRESS_MISMATCH' });
  }
  if (s.signup.complete && s.signup.mode && s.signup.mode !== 'token') {
    return res.status(409).json({ ok: false, error: 'ALREADY_SIGNED_UP' });
  }

  let eligible = false;
  try {
    eligible = await hasElizaTownToken(address);
  } catch (e) {
    console.warn('token verify failed', e);
    return res.status(503).json({ ok: false, error: 'RPC_UNAVAILABLE' });
  }
  if (!eligible) return res.json({ ok: true, eligible: false });

  const status = recordSignup(s, { mode: 'token', address });
  if (!status.complete) return res.status(403).json({ ok: false, error: status.reason || 'STORE_FULL' });
  if (!s.signup.address) s.signup.address = address;
  s.token = s.token || { verifiedAt: null, address: null };
  s.token.verifiedAt = Date.now();
  s.token.address = address;

  res.json({ ok: true, eligible: true, status });
});

app.get('/api/claim/erc8004/nonce', (req, res) => {
  const s = ensureHumanSession(req, res);
  const agentId = typeof req.query?.agentId === 'string' ? req.query.agentId.trim() : '';
  const forceRealInTest = String(req.query?.real || '').trim() === '1';
  if (!agentId) return res.status(400).json({ ok: false, error: 'MISSING_AGENT_ID' });

  const nonce = randomHex(16);
  const testBypass = process.env.NODE_ENV === 'test'
    && !forceRealInTest
    && String(process.env.ENABLE_REAL_ERC8004_CLAIMS_IN_TEST || '').trim() !== 'true';

  if (testBypass) {
    const message = buildErc8004ClaimMessage({ agentId, nonce });
    s.claim = s.claim || {};
    s.claim.erc8004 = {
      agentId,
      nonce,
      message,
      claimChain: null,
      ownerAddress: null,
      reservedHouseId: null,
      reservationId: null,
      createdAt: Date.now(),
      testBypass: true
    };
    return res.json({ ok: true, nonce, message, claimChain: null, agentId });
  }

  const store = readStore();
  const resolved = resolveErc8004ClaimReservation(store, agentId);
  if (!resolved || !resolved.reservation) {
    return res.status(404).json({ ok: false, error: 'RESERVATION_REQUIRED' });
  }
  const reservationStatus = resolved.reservation.status || 'reserved';
  if (reservationStatus === 'claimed') {
    return res.status(409).json({ ok: false, error: 'CLAIM_UNAVAILABLE' });
  }

  const message = buildErc8004ClaimMessage({
    agentId: resolved.canonicalAgentId,
    nonce
  });

  s.claim = s.claim || {};
  s.claim.erc8004 = {
    agentId: resolved.canonicalAgentId,
    nonce,
    message,
    claimChain: resolved.claimChain,
    ownerAddress: resolved.ownerAddress,
    reservedHouseId: resolved.reservation.houseId || null,
    reservationId: resolved.reservation.id || null,
    createdAt: Date.now(),
    testBypass: false
  };

  res.json({
    ok: true,
    nonce,
    message,
    agentId: resolved.canonicalAgentId,
    claimChain: resolved.claimChain
  });
});

app.post('/api/claim/erc8004/verify', (req, res) => {
  const s = ensureHumanSession(req, res);
  const agentId = typeof req.body?.agentId === 'string' ? req.body.agentId.trim() : '';
  const nonce = typeof req.body?.nonce === 'string' ? req.body.nonce.trim() : '';
  const signature = typeof req.body?.signature === 'string' ? req.body.signature.trim() : '';

  if (!agentId) return res.status(400).json({ ok: false, error: 'MISSING_AGENT_ID' });
  if (!nonce) return res.status(400).json({ ok: false, error: 'MISSING_NONCE' });
  if (!signature) return res.status(400).json({ ok: false, error: 'MISSING_SIGNATURE' });

  const expected = s.claim?.erc8004;
  if (!expected) {
    return res.status(400).json({ ok: false, error: 'NO_PENDING_CLAIM' });
  }
  if (!reservationAliasMatchesInput(expected.agentId || '', agentId)) {
    return res.status(400).json({ ok: false, error: 'NO_PENDING_CLAIM' });
  }
  if (expected.nonce !== nonce) {
    return res.status(400).json({ ok: false, error: 'NONCE_MISMATCH' });
  }

  const message = typeof expected.message === 'string' && expected.message
    ? expected.message
    : buildErc8004ClaimMessage({ agentId, nonce });
  const claimedAddress = typeof req.body?.address === 'string' ? req.body.address.trim() : '';
  const claimChain = expected.claimChain;

  if (expected.testBypass === true) {
    s.signup = s.signup || {};
    s.signup.complete = true;
    s.signup.mode = 'claim';
    s.signup.address = null;
    s.claim.erc8004.address = claimedAddress || null;
    s.claim.erc8004.claimChain = null;
    s.claim.erc8004.verifiedAt = Date.now();
    return res.json({ ok: true, verified: true, nextUrl: '/create' });
  }

  if (!claimChain || !expected.ownerAddress) {
    return res.status(400).json({ ok: false, error: 'NO_PENDING_CLAIM' });
  }
  if (!claimedAddress) return res.status(400).json({ ok: false, error: 'MISSING_ADDRESS' });

  let verified = false;
  if (claimChain === 'evm') {
    const owner = normalizeEvmAddress(expected.ownerAddress);
    const address = normalizeEvmAddress(claimedAddress);
    if (!owner || !address || owner !== address) {
      return res.status(401).json({ ok: false, error: 'OWNER_MISMATCH' });
    }
    verified = verifyEvmClaimSignature({ message, signature, address });
  } else if (claimChain === 'solana') {
    const owner = normalizeSolanaAddress(expected.ownerAddress);
    const address = normalizeSolanaAddress(claimedAddress);
    if (!owner || !address || owner !== address) {
      return res.status(401).json({ ok: false, error: 'OWNER_MISMATCH' });
    }
    verified = verifySolanaSignature(address, message, signature);
  } else {
    return res.status(400).json({ ok: false, error: 'UNSUPPORTED_CLAIM_CHAIN' });
  }
  if (!verified) return res.status(401).json({ ok: false, error: 'BAD_SIGNATURE' });
  bindSessionWallet(s, claimChain, claimedAddress, { allowRebind: true });
  if (s.signup.complete && s.signup.mode && s.signup.mode !== 'claim') {
    return res.status(409).json({ ok: false, error: 'ALREADY_SIGNED_UP' });
  }

  const store = readStore();
  const reservation = (store.reservations || []).find(
    (r) => r && r.kind === 'erc8004' && r.id === expected.reservationId,
  );
  if (!reservation) return res.status(404).json({ ok: false, error: 'RESERVATION_REQUIRED' });
  if ((reservation.status || 'reserved') === 'claimed') {
    return res.status(409).json({ ok: false, error: 'CLAIM_UNAVAILABLE' });
  }

  const now = nowIso();
  reservation.status = 'verified';
  reservation.verifiedAt = now;

  store.claims = Array.isArray(store.claims) ? store.claims : [];
  const claimAddressCmp = claimChain === 'evm' ? claimedAddress.toLowerCase() : claimedAddress;
  const existingClaim = store.claims.find((c) =>
    c
    && c.kind === 'erc8004'
    && c.reservationId === reservation.id
    && typeof c.address === 'string'
    && (claimChain === 'evm' ? c.address.toLowerCase() : c.address) === claimAddressCmp,
  );
  if (!existingClaim) {
    store.claims.push({
      id: `cl_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      createdAt: now,
      kind: 'erc8004',
      claimChain,
      agentId: expected.agentId,
      address: claimedAddress,
      reservationId: reservation.id,
      houseId: reservation.houseId
    });
  }
  writeStore(store);

  // Bind this session to the reserved house from the verified claim.
  s.reservedHouseId = reservation.houseId;

  s.signup = s.signup || {};
  s.signup.complete = true;
  s.signup.mode = 'claim';
  s.signup.address = null;
  s.claim.erc8004.address = claimedAddress;
  s.claim.erc8004.claimChain = claimChain;
  s.claim.erc8004.reservedHouseId = reservation.houseId;

  s.claim.erc8004.verifiedAt = Date.now();
  res.json({
    ok: true,
    verified: true,
    claimChain,
    houseId: reservation.houseId,
    nextUrl: `/create?reserved=${encodeURIComponent(reservation.houseId)}`
  });
});

// --- X claim (public post challenge) ---
app.get('/api/claim/x/challenge', (req, res) => {
  const s = ensureHumanSession(req, res);
  const handle = normalizeXHandle(req.query?.handle);
  if (!handle) return res.status(400).json({ ok: false, error: 'INVALID_HANDLE' });

  const store = readStore();
  const key = `@${handle}`;
  const reservation = (store.reservations || []).find((r) => r && r.kind === 'x' && r.key === key);
  if (!reservation) return res.status(404).json({ ok: false, error: 'RESERVATION_REQUIRED' });

  const nonce = randomHex(12);
  const challenge = `AgentTown X Claim\nhandle: @${handle}\nnonce: ${nonce}`;
  const ttlMs = 30 * 60 * 1000;
  s.claim = s.claim || {};
  s.claim.x = {
    handle,
    nonce,
    challenge,
    createdAt: Date.now(),
    expiresAt: Date.now() + ttlMs
  };
  res.json({ ok: true, handle, nonce, challenge, expiresInMs: ttlMs });
});

app.post('/api/claim/x/verify', async (req, res) => {
  const s = ensureHumanSession(req, res);
  const raw = typeof req.body?.handle === 'string' ? req.body.handle.trim() : '';
  const handle = raw.replace(/^@/, '').toLowerCase();
  const nonce = typeof req.body?.nonce === 'string' ? req.body.nonce.trim() : '';
  const tweetUrl = typeof req.body?.tweetUrl === 'string' ? req.body.tweetUrl.trim() : '';

  if (!handle) return res.status(400).json({ ok: false, error: 'MISSING_HANDLE' });
  if (!nonce) return res.status(400).json({ ok: false, error: 'MISSING_NONCE' });
  if (!tweetUrl) return res.status(400).json({ ok: false, error: 'MISSING_TWEET_URL' });

  const pending = s.claim?.x;
  if (!pending || pending.handle !== handle) return res.status(400).json({ ok: false, error: 'NO_PENDING_CLAIM' });
  if (pending.nonce !== nonce) return res.status(400).json({ ok: false, error: 'NONCE_MISMATCH' });
  if (pending.expiresAt && Date.now() > pending.expiresAt) return res.status(400).json({ ok: false, error: 'CHALLENGE_EXPIRED' });

  let u;
  try {
    u = new URL(tweetUrl);
  } catch {
    return res.status(400).json({ ok: false, error: 'INVALID_TWEET_URL' });
  }
  if (!/^https?:$/.test(u.protocol)) return res.status(400).json({ ok: false, error: 'INVALID_TWEET_URL' });
  if (!/(^|\.)x\.com$/.test(u.hostname) && !/(^|\.)twitter\.com$/.test(u.hostname)) {
    return res.status(400).json({ ok: false, error: 'INVALID_TWEET_URL' });
  }

  const html = await new Promise((resolve, reject) => {
    const getter = u.protocol === 'https:' ? https.get : http.get;
    const req2 = getter(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AgentTownBot/1.0; +https://github.com/Agent-Town)'
        },
        timeout: 10_000
      },
      (r) => {
        let buf = '';
        r.setEncoding('utf8');
        r.on('data', (chunk) => (buf += chunk));
        r.on('end', () => resolve({ status: r.statusCode || 0, body: buf }));
      }
    );
    req2.on('error', reject);
    req2.on('timeout', () => {
      req2.destroy(new Error('timeout'));
    });
  }).catch(() => null);

  if (!html || html.status < 200 || html.status >= 400) {
    return res.status(502).json({ ok: false, error: 'TWEET_FETCH_FAILED' });
  }

  const body = html.body || '';
  const challenge = pending.challenge;
  if (!body.includes(challenge)) {
    return res.status(401).json({ ok: false, error: 'CHALLENGE_NOT_FOUND' });
  }

  // Best-effort author check: require the handle to appear in the URL path.
  // (This is not perfect; can be tightened later with API/oEmbed.)
  const pathLower = u.pathname.toLowerCase();
  if (!pathLower.includes(`/${handle}/status/`)) {
    return res.status(401).json({ ok: false, error: 'HANDLE_MISMATCH' });
  }

  const store = readStore();

  const key = `@${handle}`;
  const reservation = (store.reservations || []).find((r) => r && r.kind === 'x' && r.key === key);
  if (!reservation) return res.status(404).json({ ok: false, error: 'RESERVATION_REQUIRED' });

  // Record durable claim (no expiry).
  store.claims = Array.isArray(store.claims) ? store.claims : [];
  store.claims.push({
    id: `cl_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: nowIso(),
    kind: 'x',
    handle,
    tweetUrl,
    challenge
  });

  // Update reservation
  reservation.status = 'verified';
  reservation.verifiedAt = nowIso();

  // Session binds this verification to a reserved house id.
  s.reservedHouseId = reservation.houseId;

  emitMilestone(store, {
    houseId: reservation.houseId,
    event: 'CLAIM_VERIFIED',
    source: 'human',
    value: 1,
    meta: { kind: 'x', handle }
  });

  writeStore(store);

  s.signup = s.signup || {};
  s.signup.complete = true;
  s.signup.mode = 'x';
  s.signup.handle = handle;

  s.claim.x.verifiedAt = Date.now();
  res.json({ ok: true, verified: true, houseId: reservation.houseId, nextUrl: `/create?reserved=${encodeURIComponent(reservation.houseId)}` });
});

app.post('/api/house/init', (req, res) => {
  const s = ensureHumanSession(req, res);
  const houseId = typeof req.body?.houseId === 'string' ? req.body.houseId.trim() : '';
  const housePubKey = typeof req.body?.housePubKey === 'string' ? req.body.housePubKey.trim() : '';
  const nonce = typeof req.body?.nonce === 'string' ? req.body.nonce.trim() : '';
  const keyMode = typeof req.body?.keyMode === 'string' ? req.body.keyMode.trim() : 'ceremony';
  const unlock = req.body?.unlock || null;
  const keyWrapSig = typeof req.body?.keyWrapSig === 'string' ? req.body.keyWrapSig.trim() : '';
  const keyWrap = req.body?.keyWrap || null;
  const houseAuthKey = typeof req.body?.houseAuthKey === 'string' ? req.body.houseAuthKey.trim() : '';
  let ponyInboxRegistration = null;

  if (!houseId || !housePubKey) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  if (houseId !== housePubKey) return res.status(400).json({ ok: false, error: 'HOUSE_ID_MISMATCH' });
  if (!nonce) return res.status(400).json({ ok: false, error: 'MISSING_NONCE' });
  if (!houseAuthKey) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_AUTH' });
  const authKeyBytes = decodeB64(houseAuthKey);
  if (!authKeyBytes || authKeyBytes.length < 16) {
    return res.status(400).json({ ok: false, error: 'INVALID_HOUSE_AUTH' });
  }
  const tokenMode = s.signup?.mode === 'token';
  const claimMode = s.signup?.mode === 'claim';
  const soloMode = tokenMode || claimMode;
  if (!soloMode) {
    if (!s.houseCeremony?.humanCommit || !s.houseCeremony?.agentCommit
      || !s.houseCeremony?.humanRevealSealed || !s.houseCeremony?.agentRevealSealed) {
      return res.status(403).json({ ok: false, error: 'CEREMONY_INCOMPLETE' });
    }
  }

  const enforcedReserved = (s && s.reservedHouseId) || null;
  if (enforcedReserved && enforcedReserved !== houseId) {
    return res.status(403).json({ ok: false, error: 'RESERVED_HOUSE_MISMATCH' });
  }
  if (claimMode && s.claim?.erc8004?.claimChain === 'solana' && typeof s.claim?.erc8004?.address === 'string') {
    const expectedAddress = normalizeSolanaAddress(s.claim.erc8004.address);
    const unlockAddress = normalizeSolanaAddress(unlockAddressForLookup(unlock));
    if (expectedAddress && unlockAddress !== expectedAddress) {
      return res.status(403).json({ ok: false, error: 'CLAIM_ADDRESS_MISMATCH' });
    }
  }
  if (s.houseCeremony?.houseId && s.houseCeremony.houseId !== houseId) {
    return res.status(409).json({ ok: false, error: 'HOUSE_ALREADY_EXISTS' });
  }

  // Converged for today's publish: ceremony-only houses.
  if (keyMode !== 'ceremony') {
    return res.status(400).json({ ok: false, error: 'CEREMONY_ONLY' });
  }

  const unlockAddress = unlockAddressForLookup(unlock);
  if (unlockAddress && !isTestMockAddress(unlockAddress)) {
    if (!keyWrapSig) {
      return res.status(400).json({ ok: false, error: 'MISSING_UNLOCK_SIGNATURE' });
    }
    const msg = buildHouseKeyWrapMessage({ houseId });
    if (!verifySolanaSignature(unlockAddress, msg, keyWrapSig)) {
      return res.status(400).json({ ok: false, error: 'INVALID_UNLOCK_SIGNATURE' });
    }
  }

  try {
    ponyInboxRegistration = normalizePonyInboxRegistration({
      ponyInboxPub: req.body?.ponyInboxPub,
      ponyInboxPrivWrap: req.body?.ponyInboxPrivWrap
    }, { required: false });
  } catch (err) {
    return res.status(400).json({ ok: false, error: String(err?.message || 'INVALID_PONY_INBOX_KEY') });
  }

  let normalizedKeyWrap = null;
  if (keyWrap && typeof keyWrap === 'object') {
    const alg = typeof keyWrap.alg === 'string' ? keyWrap.alg.trim() : '';
    const iv = typeof keyWrap.iv === 'string' ? keyWrap.iv.trim() : '';
    const ct = typeof keyWrap.ct === 'string' ? keyWrap.ct.trim() : '';
    if (alg && iv && ct) {
      if (alg !== 'AES-GCM') {
        return res.status(400).json({ ok: false, error: 'INVALID_KEY_WRAP' });
      }
      normalizedKeyWrap = { alg, iv, ct };
    }
  }

  const store = readStore();
  if (countUserHouses(store) >= MAX_HOUSES) {
    return res.status(403).json({ ok: false, error: 'STORE_FULL' });
  }
  const exists = store.houses.find((r) => r.id === houseId);
  if (exists) return res.status(409).json({ ok: false, error: 'HOUSE_EXISTS' });
  const onboarding = ensureSessionOnboarding(s);
  onboarding.step = ONBOARDING_STEP_DONE;
  const onboardingSnapshot = cloneOnboarding(onboarding);

  store.houses.push({
    id: houseId,
    housePubKey,
    createdAt: nowIso(),
    nonce,
    keyMode: 'ceremony',
    unlock,
    keyWrap: normalizedKeyWrap,
    authKey: houseAuthKey,
    onboarding: onboardingSnapshot,
    entries: [],
    ponyInbox: ponyInboxRegistration
      ? {
        version: ponyInboxRegistration.version,
        pub: ponyInboxRegistration.pub,
        privWrap: ponyInboxRegistration.privWrap,
        createdAt: nowIso(),
        updatedAt: nowIso()
      }
      : null
  });

  if (enforcedReserved) {
    const reservation = (store.reservations || []).find((r) => r && r.houseId === houseId);
    if (reservation) {
      reservation.status = 'claimed';
      reservation.verifiedAt = reservation.verifiedAt || nowIso();
      reservation.claimedAt = nowIso();
    }
  }

  emitMilestone(store, {
    houseId,
    event: 'CEREMONY_COMPLETED',
    source: 'human',
    value: 1,
    meta: { reserved: !!enforcedReserved }
  });

  writeStore(store);

  if (s && s.houseCeremony) {
    s.houseCeremony.houseId = houseId;
    s.houseCeremony.createdAt = s.houseCeremony.createdAt || nowIso();
    indexHouseId(s, houseId);
  }

  res.json({ ok: true, houseId });
});

app.post('/api/agent/house/init', (req, res) => {
  const teamCode = typeof req.body?.teamCode === 'string' ? req.body.teamCode.trim() : '';
  const houseId = typeof req.body?.houseId === 'string' ? req.body.houseId.trim() : '';
  const housePubKey = typeof req.body?.housePubKey === 'string' ? req.body.housePubKey.trim() : '';
  const nonce = typeof req.body?.nonce === 'string' ? req.body.nonce.trim() : '';
  const keyMode = typeof req.body?.keyMode === 'string' ? req.body.keyMode.trim() : 'ceremony';
  const unlock = req.body?.unlock || null;
  const keyWrap = req.body?.keyWrap || null;
  const houseAuthKey = typeof req.body?.houseAuthKey === 'string' ? req.body.houseAuthKey.trim() : '';
  let ponyInboxRegistration = null;

  if (!teamCode) return res.status(400).json({ ok: false, error: 'MISSING_TEAM_CODE' });
  const s = getSessionByTeamCode(teamCode);
  if (!s) return res.status(404).json({ ok: false, error: 'TEAM_NOT_FOUND' });
  if (s.flow !== 'agent_solo') return res.status(403).json({ ok: false, error: 'AGENT_SOLO_ONLY' });
  if (!s.houseCeremony?.agentCommit) return res.status(403).json({ ok: false, error: 'CEREMONY_INCOMPLETE' });

  const painted = countInk(s.canvas?.pixels);
  if (painted < MIN_AGENT_SOLO_PIXELS) {
    return res.status(403).json({ ok: false, error: 'INSUFFICIENT_PIXELS', minPixels: MIN_AGENT_SOLO_PIXELS, painted });
  }

  if (!houseId || !housePubKey) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  if (houseId !== housePubKey) return res.status(400).json({ ok: false, error: 'HOUSE_ID_MISMATCH' });
  if (!nonce) return res.status(400).json({ ok: false, error: 'MISSING_NONCE' });
  if (!houseAuthKey) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_AUTH' });
  const authKeyBytes = decodeB64(houseAuthKey);
  if (!authKeyBytes || authKeyBytes.length < 16) {
    return res.status(400).json({ ok: false, error: 'INVALID_HOUSE_AUTH' });
  }
  if (s.houseCeremony?.houseId && s.houseCeremony.houseId !== houseId) {
    return res.status(409).json({ ok: false, error: 'HOUSE_ALREADY_EXISTS' });
  }

  // Solo flow uses ceremony-style keys with agent entropy.
  if (keyMode !== 'ceremony') {
    return res.status(400).json({ ok: false, error: 'CEREMONY_ONLY' });
  }

  try {
    ponyInboxRegistration = normalizePonyInboxRegistration({
      ponyInboxPub: req.body?.ponyInboxPub,
      ponyInboxPrivWrap: req.body?.ponyInboxPrivWrap
    }, { required: false });
  } catch (err) {
    return res.status(400).json({ ok: false, error: String(err?.message || 'INVALID_PONY_INBOX_KEY') });
  }

  let normalizedKeyWrap = null;
  if (keyWrap && typeof keyWrap === 'object') {
    const alg = typeof keyWrap.alg === 'string' ? keyWrap.alg.trim() : '';
    const iv = typeof keyWrap.iv === 'string' ? keyWrap.iv.trim() : '';
    const ct = typeof keyWrap.ct === 'string' ? keyWrap.ct.trim() : '';
    if (alg && iv && ct) {
      if (alg !== 'AES-GCM') {
        return res.status(400).json({ ok: false, error: 'INVALID_KEY_WRAP' });
      }
      normalizedKeyWrap = { alg, iv, ct };
    }
  }

  const store = readStore();
  if (countUserHouses(store) >= MAX_HOUSES) {
    return res.status(403).json({ ok: false, error: 'STORE_FULL' });
  }
  if (store.signups.length >= MAX_SIGNUPS) {
    return res.status(403).json({ ok: false, error: 'STORE_FULL' });
  }
  const exists = store.houses.find((r) => r.id === houseId);
  if (exists) return res.status(409).json({ ok: false, error: 'HOUSE_EXISTS' });
  const onboardingSnapshot = cloneOnboarding(ensureSessionOnboarding(s));

  store.houses.push({
    id: houseId,
    housePubKey,
    createdAt: nowIso(),
    nonce,
    keyMode: 'ceremony',
    unlock,
    keyWrap: normalizedKeyWrap,
    authKey: houseAuthKey,
    onboarding: onboardingSnapshot,
    entries: [],
    ponyInbox: ponyInboxRegistration
      ? {
        version: ponyInboxRegistration.version,
        pub: ponyInboxRegistration.pub,
        privWrap: ponyInboxRegistration.privWrap,
        createdAt: nowIso(),
        updatedAt: nowIso()
      }
      : null
  });
  writeStore(store);

  s.houseCeremony.houseId = houseId;
  s.houseCeremony.createdAt = s.houseCeremony.createdAt || nowIso();
  indexHouseId(s, houseId);

  const status = recordSignup(s, {
    mode: 'agent_solo',
    agentName: s.agent.name || null,
    matchedElement: null,
    address: unlock?.address || null
  });

  if (!status.complete) {
    return res.status(403).json({ ok: false, error: status.reason || 'STORE_FULL', houseId });
  }

  res.json({ ok: true, houseId, status });
});

app.get('/api/house/:id/meta', (req, res) => {
  const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
  if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  const store = readStore();
  const house = store.houses.find((r) => r.id === houseId);
  if (!house) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const auth = verifyHouseAuth(req, house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });
  res.json({
    ok: true,
    houseId: house.id,
    housePubKey: house.housePubKey,
    nonce: house.nonce,
    keyMode: 'ceremony'
  });
});

app.get('/api/house/:id/onboarding', (req, res) => {
  const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
  if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  const store = readStore();
  const house = store.houses.find((r) => r.id === houseId);
  if (!house) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const auth = verifyHouseAuth(req, house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  res.json({
    ok: true,
    houseId,
    onboarding: cloneOnboarding(house.onboarding || null)
  });
});

app.get('/api/house/:id/descriptor', (req, res) => {
  const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
  if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  const store = readStore();
  const house = store.houses.find((r) => r.id === houseId);
  if (!house) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const auth = verifyHouseAuth(req, house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  const origin = `${req.protocol}://${req.get('host')}`;
  res.json({
    ok: true,
    descriptor: {
      v: 1,
      kind: 'agent-town-house',
      house: {
        id: house.id,
        pub: house.housePubKey,
        mailboxes: [
          {
            chain: 'solana',
            kind: 'pda',
            status: 'placeholder',
            address: 'PDA_TODO',
            program: 'PROGRAM_TODO'
          }
        ]
      },
      endpoints: {
        meta: `${origin}/api/house/${encodeURIComponent(house.id)}/meta`,
        log: `${origin}/api/house/${encodeURIComponent(house.id)}/log`,
        append: `${origin}/api/house/${encodeURIComponent(house.id)}/append`
      },
      ui: {
        houseUrl: `${origin}/house?house=${encodeURIComponent(house.id)}`
      }
    }
  });
});

app.get('/api/house/:id/log', (req, res) => {
  const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
  if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  const store = readStore();
  const house = store.houses.find((r) => r.id === houseId);
  if (!house) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const auth = verifyHouseAuth(req, house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });
  const entries = houseVaultBackend.listEntries({ house });
  res.json({ ok: true, entries });
});

app.get('/api/house/:id/media', (req, res) => {
  const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
  if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  const store = readStore();
  const house = store.houses.find((r) => r.id === houseId);
  if (!house) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const auth = verifyHouseAuth(req, house);
  const media = auth.ok ? serializeHouseMedia(house) : serializePublicOnlyHouseMedia(house);
  res.json({ ok: true, media, publicMedia: serializePublicMedia(house) });
});

app.get('/api/house/:id/media/:slot/image', (req, res) => {
  const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
  const slotPath = typeof req.params?.slot === 'string' ? req.params.slot.trim() : '';
  if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  const slotKey = mediaSlotKeyFromPath(slotPath);
  if (!slotKey) return res.status(400).json({ ok: false, error: 'INVALID_MEDIA_SLOT' });
  const store = readStore();
  const house = store.houses.find((r) => r.id === houseId);
  const slot = house ? readHouseMediaSlot(house, slotKey) : null;
  if (!house || !slot?.image) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const parsed = parsePublicImageDataUrl(slot.image);
  if (parsed.error || !parsed.bytes) return res.status(500).json({ ok: false, error: 'INVALID_MEDIA_IMAGE' });
  res.setHeader('Content-Type', parsed.mime || 'application/octet-stream');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.end(parsed.bytes);
});

app.post('/api/house/:id/media', (req, res) => {
  const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
  if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  const store = readStore();
  const house = store.houses.find((r) => r.id === houseId);
  if (!house) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const auth = verifyHouseAuth(req, house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  const body = req.body || {};
  const slotPath = typeof body.slot === 'string' ? body.slot : 'share-hero';
  const slotKey = mediaSlotKeyFromPath(slotPath);
  if (!slotKey) return res.status(400).json({ ok: false, error: 'INVALID_MEDIA_SLOT' });

  const hasImage = Object.prototype.hasOwnProperty.call(body, 'image');
  const hasPrompt = Object.prototype.hasOwnProperty.call(body, 'prompt');
  const hasSource = Object.prototype.hasOwnProperty.call(body, 'source');
  const hasVersion = Object.prototype.hasOwnProperty.call(body, 'version');
  const clear = body?.clear === true;
  if (!clear && !hasImage && !hasPrompt && !hasSource && !hasVersion) {
    return res.status(400).json({ ok: false, error: 'MISSING_MEDIA' });
  }

  const current = readHouseMediaSlot(house, slotKey) || null;
  let nextImage = current?.image || null;
  let nextPrompt = current?.prompt || null;
  let nextSource = current?.source || null;
  let nextVersion = current?.version || null;

  if (clear) {
    nextImage = null;
    nextPrompt = null;
    nextSource = null;
    nextVersion = null;
  }

  if (hasImage) {
    if (body.image == null || body.image === '') {
      nextImage = null;
    } else {
      const parsed = parsePublicImageDataUrl(body.image);
      if (parsed.error) return res.status(400).json({ ok: false, error: parsed.error });
      nextImage = parsed.dataUrl;
    }
  }

  if (hasPrompt) {
    if (body.prompt != null && typeof body.prompt !== 'string') {
      return res.status(400).json({ ok: false, error: 'INVALID_MEDIA_PROMPT' });
    }
    nextPrompt = normalizePublicPrompt(body.prompt);
  }

  if (hasSource) {
    if (body.source != null && typeof body.source !== 'string') {
      return res.status(400).json({ ok: false, error: 'INVALID_MEDIA_SOURCE' });
    }
    nextSource = normalizeMediaSource(body.source);
  }

  if (hasVersion) {
    if (body.version != null && typeof body.version !== 'string') {
      return res.status(400).json({ ok: false, error: 'INVALID_MEDIA_VERSION' });
    }
    nextVersion = normalizeMediaVersion(body.version);
  }

  if (slotKey !== 'shareHero') {
    if (nextPrompt) return res.status(400).json({ ok: false, error: 'MEDIA_PROMPT_UNSUPPORTED' });
    nextPrompt = null;
  }

  if (slotKey === 'shareHero') {
    if (nextImage && !nextPrompt) {
      return res.status(400).json({ ok: false, error: 'MEDIA_PROMPT_REQUIRED' });
    }
    if (nextPrompt && !nextImage) {
      return res.status(400).json({ ok: false, error: 'MEDIA_IMAGE_REQUIRED' });
    }
  }

  const nextSlot = (nextImage || nextPrompt || nextSource || nextVersion)
    ? {
        image: nextImage,
        prompt: nextPrompt,
        source: nextSource || null,
        version: nextVersion || null,
        updatedAt: nowIso()
      }
    : null;

  upsertHouseMediaSlot(house, slotKey, nextSlot);
  writeStore(store);
  res.json({ ok: true, media: serializeHouseMedia(house), publicMedia: serializePublicMedia(house) });
});

// Backward-compat alias for the previous public-media API (share-hero slot only).
app.get('/api/house/:id/public-media', (req, res) => {
  const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
  if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  const store = readStore();
  const house = store.houses.find((r) => r.id === houseId);
  if (!house) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  res.json({ ok: true, publicMedia: serializePublicMedia(house), media: serializeHouseMedia(house) });
});

app.get('/api/house/:id/rewards', (req, res) => {
  const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
  if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  const store = readStore();
  const house = store.houses.find((r) => r.id === houseId);
  if (!house) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const auth = verifyHouseAuth(req, house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  const summary = computeRewardsSummary(store, houseId);
  res.json({ ok: true, ...summary });
});

app.get('/api/house/:id/public-media/image', (req, res) => {
  const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
  if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  const store = readStore();
  const house = store.houses.find((r) => r.id === houseId);
  const slot = house ? readHouseMediaSlot(house, 'shareHero') : null;
  if (!house || !slot?.image) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const parsed = parsePublicImageDataUrl(slot.image);
  if (parsed.error || !parsed.bytes) return res.status(500).json({ ok: false, error: 'INVALID_PUBLIC_IMAGE' });
  res.setHeader('Content-Type', parsed.mime || 'application/octet-stream');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.end(parsed.bytes);
});

app.post('/api/house/:id/public-media', (req, res) => {
  const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
  if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  const store = readStore();
  const house = store.houses.find((r) => r.id === houseId);
  if (!house) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const auth = verifyHouseAuth(req, house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  const body = req.body || {};
  const hasImage = Object.prototype.hasOwnProperty.call(body, 'image');
  const hasPrompt = Object.prototype.hasOwnProperty.call(body, 'prompt');
  const clear = body?.clear === true;
  if (!clear && !hasImage && !hasPrompt) {
    return res.status(400).json({ ok: false, error: 'MISSING_PUBLIC_MEDIA' });
  }

  const current = readHouseMediaSlot(house, 'shareHero') || null;
  let nextImage = current?.image || null;
  let nextPrompt = current?.prompt || null;
  const nextSource = current?.source || 'legacy-public-media';
  const nextVersion = current?.version || 'v0';

  if (clear) {
    nextImage = null;
    nextPrompt = null;
  }

  if (hasImage) {
    if (body.image == null || body.image === '') {
      nextImage = null;
    } else {
      const parsed = parsePublicImageDataUrl(body.image);
      if (parsed.error) return res.status(400).json({ ok: false, error: parsed.error });
      nextImage = parsed.dataUrl;
    }
  }

  if (hasPrompt) {
    if (body.prompt != null && typeof body.prompt !== 'string') {
      return res.status(400).json({ ok: false, error: 'INVALID_PUBLIC_PROMPT' });
    }
    nextPrompt = normalizePublicPrompt(body.prompt);
  }

  if (nextImage && !nextPrompt) {
    return res.status(400).json({ ok: false, error: 'PUBLIC_PROMPT_REQUIRED' });
  }
  if (nextPrompt && !nextImage) {
    return res.status(400).json({ ok: false, error: 'PUBLIC_IMAGE_REQUIRED' });
  }

  const nextSlot = (!nextImage && !nextPrompt)
    ? null
    : {
        image: nextImage,
        prompt: nextPrompt,
        source: nextSource,
        version: nextVersion,
        updatedAt: nowIso()
      };

  upsertHouseMediaSlot(house, 'shareHero', nextSlot);
  writeStore(store);
  res.json({ ok: true, publicMedia: serializePublicMedia(house), media: serializeHouseMedia(house) });
});

app.get('/api/house/:id/agent-state', (req, res) => {
  const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
  if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  const store = readStore();
  const house = store.houses.find((r) => r.id === houseId);
  if (!house) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const auth = verifyHouseAuth(req, house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  const payload = isRecordObject(house.agentState) ? house.agentState : null;
  res.json({
    ok: true,
    agentState: isRecordObject(payload?.snapshot) ? payload.snapshot : null,
    updatedAt: typeof payload?.updatedAt === 'string' ? payload.updatedAt : null,
    sizeBytes: Number.isFinite(payload?.sizeBytes) ? payload.sizeBytes : null
  });
});

app.post('/api/house/:id/agent-state', (req, res) => {
  const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
  if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  const store = readStore();
  const house = store.houses.find((r) => r.id === houseId);
  if (!house) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const auth = verifyHouseAuth(req, house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  const rawSnapshot = isRecordObject(req.body?.snapshot) ? req.body.snapshot : req.body;
  let normalized;
  try {
    normalized = normalizeAgentStateSnapshot(rawSnapshot, { expectedHouseId: house.id });
  } catch (err) {
    return res.status(400).json({ ok: false, error: String(err?.message || 'INVALID_AGENT_STATE') });
  }

  house.agentState = {
    version: 1,
    snapshot: normalized.snapshot,
    sizeBytes: normalized.sizeBytes,
    updatedAt: nowIso()
  };
  writeStore(store);

  res.json({
    ok: true,
    updatedAt: house.agentState.updatedAt,
    sizeBytes: normalized.sizeBytes
  });
});

app.post('/api/house/:id/append', (req, res) => {
  const houseId = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
  if (!houseId) return res.status(400).json({ ok: false, error: 'MISSING_HOUSE_ID' });
  const ciphertext = req.body?.ciphertext;
  const author = typeof req.body?.author === 'string' ? req.body.author.trim() : 'unknown';
  if (!ciphertext || typeof ciphertext.iv !== 'string' || typeof ciphertext.ct !== 'string') {
    return res.status(400).json({ ok: false, error: 'INVALID_CIPHERTEXT' });
  }

  const store = readStore();
  const house = store.houses.find((r) => r.id === houseId);
  if (!house) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const auth = verifyHouseAuth(req, house);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });
  try {
    houseVaultBackend.appendEntry({
      house,
      author,
      ciphertext
    });
  } catch (err) {
    const msg = String(err?.message || 'HOUSE_APPEND_FAILED');
    if (msg === 'HOUSE_FULL') return res.status(403).json({ ok: false, error: 'HOUSE_FULL' });
    return res.status(500).json({ ok: false, error: 'HOUSE_APPEND_FAILED' });
  }

  const ctLen = typeof ciphertext.ct === 'string' ? ciphertext.ct.length : 0;
  if (ctLen >= 32) {
    emitMilestone(store, {
      houseId,
      event: 'HOUSE_APPEND',
      source: 'human',
      value: 1,
      meta: { ctLen }
    });
  }
  writeStore(store);
  res.json({ ok: true });
});

// --- Static + routes ---
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  const accept = String(req.headers?.accept || '');
  if (!accept.includes('text/html')) return next();
  if (req.path.startsWith('/api/')) return next();
  if (req.path.startsWith('/openclaw-lite/')) return next();
  if (req.path.startsWith('/assets/')) return next();
  ensureHumanSession(req, res);
  return next();
});

function isAtlasEmbedModalRequest(req) {
  const embed = String(req.query?.embed || '').trim() === '1';
  if (!embed) return false;
  const fetchDest = String(req.get('sec-fetch-dest') || '').trim().toLowerCase();
  if (fetchDest !== 'iframe' && fetchDest !== 'frame') return false;
  const fetchSite = String(req.get('sec-fetch-site') || '').trim().toLowerCase();
  return fetchSite === 'same-origin' || fetchSite === 'same-site';
}

function atlasModalRedirectPath() {
  const params = new URLSearchParams();
  params.set('district', 'atlas');
  return `/?${params.toString()}`;
}

function trainerModalRedirectPath(req) {
  const params = new URLSearchParams();
  const source = req && req.query && typeof req.query === 'object' ? req.query : {};
  const allowedKeys = ['liteDriver', 'trainerNamespace', 'trainer_namespace', 'trainerTools', 'trainer-tools'];
  for (const key of allowedKeys) {
    const rawValue = source[key];
    if (Array.isArray(rawValue)) {
      for (const item of rawValue) {
        if (item === null || item === undefined) continue;
        params.append(key, String(item));
      }
      continue;
    }
    if (rawValue === null || rawValue === undefined || rawValue === '') continue;
    params.set(key, String(rawValue));
  }
  params.set('modal', 'trainer');
  return `/app?${params.toString()}`;
}

function registryModalRedirectPath() {
  const params = new URLSearchParams();
  params.set('district', 'registry');
  return `/?${params.toString()}`;
}

function pokerModalRedirectPath(req) {
  const params = new URLSearchParams();
  params.set('district', 'poker');
  const requestPath = String(req.path || '/poker');
  const query = new URLSearchParams(req.query || {});
  query.delete('embed');
  const search = query.toString();
  params.set('pokerPath', `${requestPath}${search ? `?${search}` : ''}`);
  return `/?${params.toString()}`;
}

app.get('/openclaw-lite/manifest.json', (_req, res) => {
  res.json(VENDOR_LITE_MANIFEST);
});

// Atlas is intentionally modal-only so the worker/runtime stays in the town hub page.
app.get('/atlas.html', (_req, res) => {
  return res.redirect(302, atlasModalRedirectPath());
});

app.get('/atlas', (req, res) => {
  if (isAtlasEmbedModalRequest(req)) {
    return sendHtmlNoStore(res, 'atlas.html');
  }
  return res.redirect(302, atlasModalRedirectPath());
});

app.get('/registry', (req, res) => {
  if (String(req.query?.embed || '').trim() === '1') {
    return sendHtmlNoStore(res, 'registry.html');
  }
  return res.redirect(302, registryModalRedirectPath());
});

app.get(/^\/__compiled\/default-skill-pack\/(.+)$/, (req, res) => {
  const pack = buildDefaultCompiledSkillPack();
  const requestedPath = String(req.params?.[0] || '').trim().replace(/^\/+/, '');
  const body = pack.fileBodies[requestedPath];
  if (typeof body !== 'string') {
    return res.status(404).type('text/plain').send('NOT_FOUND');
  }
  res.setHeader('Cache-Control', 'no-store');
  res.type(requestedPath.endsWith('.json') ? 'application/json' : 'text/markdown');
  return res.send(body);
});

app.get(/^\/__compiled\/library-skill-pack\/(.+)$/, (req, res) => {
  const pack = buildHouseLibraryCompiledSkillPack();
  const requestedPath = String(req.params?.[0] || '').trim().replace(/^\/+/, '');
  const body = pack.fileBodies[requestedPath];
  if (typeof body !== 'string') {
    return res.status(404).type('text/plain').send('NOT_FOUND');
  }
  res.setHeader('Cache-Control', 'no-store');
  res.type(requestedPath.endsWith('.json') ? 'application/json' : 'text/markdown');
  return res.send(body);
});

app.get([
  '/poker',
  '/poker/seasons/:seasonId',
  '/poker/leaderboards/:seasonId',
  '/poker/leaderboards/:seasonId/snapshots',
  '/poker/runs/:runId',
  '/poker/replays/:runId',
  '/poker/submissions/:submissionId'
], (req, res) => {
  if (String(req.query?.embed || '').trim() === '1') {
    return sendHtmlNoStore(res, 'poker.html');
  }
  return res.redirect(302, pokerModalRedirectPath(req));
});

app.use(
  express.static(PUBLIC_DIR, {
    index: false,
    etag: true,
    maxAge: isProd ? '1h' : 0,
    setHeaders: (res) => {
      if (!isProd) {
        res.setHeader('Cache-Control', 'no-store');
      }
    }
  })
);

app.use(
  '/assets',
  express.static(ASSETS_DIR, {
    etag: true,
    maxAge: isProd ? '1h' : 0,
    setHeaders: (res) => {
      if (!isProd) {
        res.setHeader('Cache-Control', 'no-store');
      }
    }
  })
);

function sendHtmlNoStore(res, fileName) {
  res.setHeader('Cache-Control', 'no-store');
  return res.sendFile(path.join(PUBLIC_DIR, fileName));
}

app.get('/', (_req, res) => sendHtmlNoStore(res, HOME_ROUTE_FILE));
app.get('/start', (_req, res) => sendHtmlNoStore(res, 'start.html'));
app.get('/app', (_req, res) => sendHtmlNoStore(res, 'index.html'));
app.get('/create', (_req, res) => sendHtmlNoStore(res, 'create.html'));
app.get('/inbox/:houseId', (_req, res) => sendHtmlNoStore(res, 'inbox.html'));
app.get('/claim', (_req, res) => res.redirect(302, '/claim-wallet'));
app.get('/claim-wallet', (_req, res) => sendHtmlNoStore(res, 'claim-wallet.html'));
app.get('/house', (_req, res) => sendHtmlNoStore(res, 'house.html'));
app.get('/leaderboard', (_req, res) => sendHtmlNoStore(res, 'leaderboard.html'));
// /feed route removed — replaced by /iterate experience.
app.get('/iterate', (_req, res) => sendHtmlNoStore(res, 'iterate.html'));
app.get('/trainer', (req, res) => {
  if (String(req.query?.embed || '').trim() === '1') {
    return sendHtmlNoStore(res, 'trainer.html');
  }
  return res.redirect(302, trainerModalRedirectPath(req));
});
app.get('/wall', (_req, res) => res.redirect(302, '/leaderboard'));
app.get('/s/:id', (req, res) => {
  const shareId = req.params.id;
  const store = readStore();
  const share = store.shares.find((x) => x.id === shareId) || null;
  const house = share?.houseId ? store.houses.find((h) => h.id === share.houseId) : null;
  const media = house ? serializeHouseMedia(house) : null;
  const publicMedia = house ? serializePublicMedia(house) : null;
  const shareHero = media?.shareHero?.imageUrl ? media.shareHero : publicMedia;
  const origin = `${req.protocol}://${req.get('host')}`;
  const meta = buildShareMeta({ shareId, shareHero, origin });
  const template = fs.readFileSync(path.join(PUBLIC_DIR, 'share.html'), 'utf8');
  const html = template.replace('</head>', `  ${meta}\n</head>`);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (!isProd) res.setHeader('Cache-Control', 'no-store');
  res.send(html);
});

// Default route
app.get('*', (_req, res) => sendHtmlNoStore(res, HOME_ROUTE_FILE));

// --- OpenClaw Lite Tool Proxies ---

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (compatible; OpenClawLite/1.0; +https://agent.town)';
const PROXY_TARGET_MAX_REDIRECTS = 5;
const PROXY_DNS_CACHE_TTL_MS = 30_000;
const PROXY_BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata',
  'metadata.google.internal',
  'ip6-localhost',
  'ip6-loopback'
]);
const PROXY_BLOCKED_HOST_SUFFIXES = ['.local', '.internal'];
const PROXY_FETCH_HARD_MAX_BYTES = 4 * 1024 * 1024;
const PROXY_FETCH_MIN_BYTES = 1024;
const proxyDnsCache = new Map();
const proxyAddressDenyList = typeof net.BlockList === 'function' ? new net.BlockList() : null;

function addProxyDenySubnet(address, prefix, type) {
  if (!proxyAddressDenyList) return;
  try {
    proxyAddressDenyList.addSubnet(address, prefix, type);
  } catch {
    // Ignore unsupported/invalid ranges.
  }
}

// IPv4 deny ranges (local/private/link-local/reserved).
addProxyDenySubnet('0.0.0.0', 8, 'ipv4');
addProxyDenySubnet('10.0.0.0', 8, 'ipv4');
addProxyDenySubnet('100.64.0.0', 10, 'ipv4');
addProxyDenySubnet('127.0.0.0', 8, 'ipv4');
addProxyDenySubnet('169.254.0.0', 16, 'ipv4');
addProxyDenySubnet('172.16.0.0', 12, 'ipv4');
addProxyDenySubnet('192.0.0.0', 24, 'ipv4');
addProxyDenySubnet('192.168.0.0', 16, 'ipv4');
addProxyDenySubnet('198.18.0.0', 15, 'ipv4');
addProxyDenySubnet('224.0.0.0', 4, 'ipv4');
addProxyDenySubnet('240.0.0.0', 4, 'ipv4');

// IPv6 deny ranges (loopback/link-local/ULA/multicast/docs).
addProxyDenySubnet('::', 128, 'ipv6');
addProxyDenySubnet('::1', 128, 'ipv6');
addProxyDenySubnet('fc00::', 7, 'ipv6');
addProxyDenySubnet('fe80::', 10, 'ipv6');
addProxyDenySubnet('ff00::', 8, 'ipv6');
addProxyDenySubnet('2001:db8::', 32, 'ipv6');
addProxyDenySubnet('::ffff:0:0', 96, 'ipv6');

function makeProxyPolicyError(message, details = null) {
  const err = new Error(message);
  err.code = 'PROXY_TARGET_BLOCKED';
  err.details = details;
  return err;
}

function normalizeProxyIpLiteral(input) {
  let raw = String(input || '').trim().toLowerCase();
  if (!raw) return '';
  if (raw.startsWith('[') && raw.endsWith(']')) raw = raw.slice(1, -1);
  const zoneIndex = raw.indexOf('%');
  if (zoneIndex >= 0) raw = raw.slice(0, zoneIndex);
  return raw;
}

function normalizeProxyHostname(hostname) {
  const normalized = normalizeProxyIpLiteral(hostname);
  return normalized.replace(/\.+$/, '');
}

function isBlockedProxyHostname(hostname) {
  const host = normalizeProxyHostname(hostname);
  if (!host) return true;
  if (net.isIP(host)) return false;
  if (PROXY_BLOCKED_HOSTNAMES.has(host)) return true;
  return PROXY_BLOCKED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

function isBlockedProxyIpAddress(address) {
  if (!proxyAddressDenyList) return false;
  const normalized = normalizeProxyIpLiteral(address);
  if (!normalized) return true;
  if (normalized.startsWith('::ffff:')) return true;
  const version = net.isIP(normalized);
  if (version === 4) return proxyAddressDenyList.check(normalized, 'ipv4');
  if (version === 6) return proxyAddressDenyList.check(normalized, 'ipv6');
  return false;
}

function readCachedProxyDns(hostname) {
  const now = Date.now();
  const key = normalizeProxyHostname(hostname);
  const hit = proxyDnsCache.get(key);
  if (!hit) return null;
  if (hit.expiresAt <= now) {
    proxyDnsCache.delete(key);
    return null;
  }
  return hit.addresses;
}

function writeCachedProxyDns(hostname, addresses) {
  const key = normalizeProxyHostname(hostname);
  proxyDnsCache.set(key, {
    addresses,
    expiresAt: Date.now() + PROXY_DNS_CACHE_TTL_MS
  });
}

async function resolveProxyHostAddresses(hostname) {
  const host = normalizeProxyHostname(hostname);
  if (!host) {
    throw makeProxyPolicyError('Blocked proxy target (hostname missing)');
  }
  const directIp = net.isIP(host);
  if (directIp) return [host];

  const cached = readCachedProxyDns(host);
  if (Array.isArray(cached) && cached.length > 0) return cached;

  try {
    const rows = await dns.lookup(host, { all: true, verbatim: true });
    const addresses = [...new Set(
      (Array.isArray(rows) ? rows : [])
        .map((row) => normalizeProxyIpLiteral(row?.address || ''))
        .filter((address) => net.isIP(address) !== 0)
        .filter(Boolean)
    )];
    if (!addresses.length) {
      throw makeProxyPolicyError('Blocked proxy target (no resolvable addresses)', { hostname: host });
    }
    writeCachedProxyDns(host, addresses);
    return addresses;
  } catch (err) {
    if (err?.code === 'PROXY_TARGET_BLOCKED') throw err;
    throw makeProxyPolicyError('Blocked proxy target (dns lookup failed)', { hostname: host });
  }
}

async function assertProxyTargetAllowed(targetUrl) {
  let parsed;
  try {
    parsed = new URL(String(targetUrl || ''));
  } catch {
    throw makeProxyPolicyError('Blocked proxy target (invalid URL)');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw makeProxyPolicyError('Blocked proxy target (protocol not allowed)', {
      protocol: parsed.protocol || null
    });
  }
  if (parsed.username || parsed.password) {
    throw makeProxyPolicyError('Blocked proxy target (embedded credentials not allowed)');
  }

  const hostname = normalizeProxyHostname(parsed.hostname);
  if (isBlockedProxyHostname(hostname)) {
    throw makeProxyPolicyError('Blocked proxy target (hostname denied)', { hostname });
  }

  const addresses = await resolveProxyHostAddresses(hostname);
  if (!addresses.length) {
    throw makeProxyPolicyError('Blocked proxy target (no addresses)', { hostname });
  }
  for (const address of addresses) {
    if (isBlockedProxyIpAddress(address)) {
      throw makeProxyPolicyError('Blocked proxy target (resolved to denied address)', {
        hostname,
        address
      });
    }
  }
  return { hostname, addresses };
}

function normalizeProxyByteLimit(value, fallback = PROXY_FETCH_HARD_MAX_BYTES) {
  const n = Number.parseInt(String(value || ''), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(PROXY_FETCH_MIN_BYTES, Math.min(PROXY_FETCH_HARD_MAX_BYTES, n));
}

function normalizeProxyBoolean(value, fallback = true) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const text = String(value).trim().toLowerCase();
  if (!text) return fallback;
  return text !== 'false' && text !== '0' && text !== 'no';
}

function normalizeProxyMethod(value, fallback = 'GET') {
  const method = String(value || fallback).trim().toUpperCase();
  const allowed = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);
  if (!allowed.has(method)) return fallback;
  return method;
}

function pickPreferredProxyAddress(addresses) {
  if (!Array.isArray(addresses) || addresses.length === 0) return '';
  const ipv4 = addresses.find((address) => net.isIP(address) === 4);
  return ipv4 || addresses[0];
}

function proxyRequestOnce(targetUrl, {
  method = 'GET',
  headers = {},
  body = undefined,
  timeoutMs = 30000,
  resolvedAddress = '',
  responseLimitBytes = PROXY_FETCH_HARD_MAX_BYTES
} = {}) {
  return new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = new URL(String(targetUrl || ''));
    } catch {
      const err = new Error('INVALID_URL');
      err.code = 'INVALID_URL';
      reject(err);
      return;
    }

    const protocol = parsed.protocol === 'https:' ? 'https:' : 'http:';
    const lib = protocol === 'https:' ? https : http;
    const host = normalizeProxyHostname(parsed.hostname);
    const family = net.isIP(resolvedAddress);
    const requestHeaders = { ...headers };
    const hardLimit = normalizeProxyByteLimit(responseLimitBytes);

    const req = lib.request({
      protocol,
      hostname: host,
      port: parsed.port || (protocol === 'https:' ? 443 : 80),
      method,
      path: `${parsed.pathname}${parsed.search}`,
      headers: requestHeaders,
      servername: net.isIP(host) ? undefined : host,
      lookup: (_lookupHost, optionsOrCb, maybeCb) => {
        const cb = typeof optionsOrCb === 'function' ? optionsOrCb : maybeCb;
        if (typeof cb !== 'function') return;
        cb(null, resolvedAddress, family || 0);
      }
    }, (response) => {
      const chunks = [];
      let totalBytes = 0;

      response.on('data', (chunk) => {
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        totalBytes += buf.length;
        if (totalBytes > hardLimit) {
          const err = new Error('Response exceeds proxy byte limit');
          err.code = 'RESPONSE_TOO_LARGE';
          response.destroy(err);
          return;
        }
        chunks.push(buf);
      });

      response.on('error', (err) => reject(err));
      response.on('end', () => {
        const responseHeaders = {};
        for (const [key, value] of Object.entries(response.headers || {})) {
          if (value == null) continue;
          responseHeaders[String(key || '').toLowerCase()] = Array.isArray(value)
            ? value.join(', ')
            : String(value);
        }
        resolve({
          status: Number(response.statusCode || 0),
          url: targetUrl,
          headers: responseHeaders,
          buffer: Buffer.concat(chunks)
        });
      });
    });

    req.on('timeout', () => {
      const err = new Error('TIMEOUT');
      err.code = 'TIMEOUT';
      req.destroy(err);
    });
    req.on('error', (err) => reject(err));
    req.setTimeout(Math.max(1, Number(timeoutMs) || 30000));

    if (body != null) req.write(body);
    req.end();
  });
}

async function proxyFetch(url, options = {}) {
  const timeoutMs = Math.max(1, Number(options.timeoutMs) || 30000);
  const responseLimitBytes = normalizeProxyByteLimit(options.responseLimitBytes, PROXY_FETCH_HARD_MAX_BYTES);
  let currentUrl = String(url || '').trim();
  let redirects = 0;
  let method = normalizeProxyMethod(options.method, 'GET');
  let body = options.body;
  const baseHeaders = {
    'User-Agent': DEFAULT_USER_AGENT,
    ...(options.headers || {})
  };

  try {
    while (true) {
      const policy = await assertProxyTargetAllowed(currentUrl);
      const addresses = Array.isArray(policy?.addresses) ? policy.addresses : [];
      if (!addresses.length) {
        throw makeProxyPolicyError('Blocked proxy target (no addresses)');
      }

      const requestHeaders = { ...baseHeaders };
      if (body == null) {
        delete requestHeaders['content-length'];
        delete requestHeaders['Content-Length'];
      }
      if (!requestHeaders['host']) delete requestHeaders.host;

      let response = null;
      let lastError = null;
      const preferred = pickPreferredProxyAddress(addresses);
      const attemptOrder = preferred
        ? [preferred, ...addresses.filter((entry) => entry !== preferred)]
        : addresses;

      for (const resolvedAddress of attemptOrder) {
        try {
          response = await proxyRequestOnce(currentUrl, {
            method,
            headers: requestHeaders,
            body,
            timeoutMs,
            resolvedAddress,
            responseLimitBytes
          });
          break;
        } catch (err) {
          lastError = err;
        }
      }

      if (!response) throw lastError || new Error('REQUEST_FAILED');

      const status = Number(response.status || 0);
      const shouldFollow = normalizeProxyBoolean(options.followRedirects, true);
      if (
        shouldFollow
        && [301, 302, 303, 307, 308].includes(status)
        && redirects < PROXY_TARGET_MAX_REDIRECTS
      ) {
        const location = String(response.headers?.location || '').trim();
        if (!location) {
          return { ok: false, errorCode: 'REDIRECT_MISSING_LOCATION', error: 'Redirect missing location header' };
        }
        currentUrl = new URL(location, currentUrl).toString();
        redirects += 1;
        if (
          status === 303
          || ((status === 301 || status === 302) && method !== 'GET' && method !== 'HEAD')
        ) {
          method = 'GET';
          body = undefined;
        }
        continue;
      }
      if (shouldFollow && [301, 302, 303, 307, 308].includes(status) && redirects >= PROXY_TARGET_MAX_REDIRECTS) {
        return { ok: false, errorCode: 'TOO_MANY_REDIRECTS', error: 'Too many redirects' };
      }

      return {
        ok: true,
        status,
        url: response.url || currentUrl,
        headers: response.headers || {},
        buffer: response.buffer || Buffer.alloc(0)
      };
    }
  } catch (e) {
    if (e?.code === 'PROXY_TARGET_BLOCKED') {
      return { ok: false, errorCode: 'PROXY_TARGET_BLOCKED', error: e.message, details: e.details || null };
    }
    if (e?.code === 'TIMEOUT') {
      return { ok: false, errorCode: 'TIMEOUT', error: 'TIMEOUT' };
    }
    if (e?.code === 'RESPONSE_TOO_LARGE') {
      return { ok: false, errorCode: 'RESPONSE_TOO_LARGE', error: 'Response exceeds proxy byte limit' };
    }
    return { ok: false, errorCode: 'FETCH_FAILED', error: String(e?.message || 'FETCH_FAILED') };
  }
}

app.post('/api/tools/web_fetch', express.json(), async (req, res) => {
  const { url, maxBytes = 262144, followRedirects = true, expectedMime = 'any' } = req.body;
  if (!url) return res.status(400).json({ ok: false, error: 'MISSING_URL' });
  const outputLimitBytes = normalizeProxyByteLimit(maxBytes, 262144);
  const fetchLimitBytes = normalizeProxyByteLimit(Math.max(outputLimitBytes * 2, 262144), PROXY_FETCH_HARD_MAX_BYTES);
  const expectedMimeText = typeof expectedMime === 'string' ? expectedMime.trim().toLowerCase() : 'any';
  const shouldFollow = normalizeProxyBoolean(followRedirects, true);

  try {
    const result = await proxyFetch(url, {
      method: 'GET',
      followRedirects: shouldFollow,
      timeoutMs: 15000,
      responseLimitBytes: fetchLimitBytes
    });

    if (!result.ok) {
      return res.json({
        ok: false,
        error: {
          code: result.errorCode || 'FETCH_FAILED',
          message: result.error || 'FETCH_FAILED',
          ...(result.details ? { details: result.details } : {})
        }
      });
    }

    const contentType = result.headers['content-type'] || '';
    if (expectedMimeText !== 'any' && !contentType.toLowerCase().startsWith(expectedMimeText)) {
      return res.json({
        ok: false,
        error: {
          code: 'MIME_MISMATCH',
          message: `Expected ${expectedMimeText}, got ${contentType}`,
          details: { contentType }
        }
      });
    }

    let buffer = result.buffer;
    let truncated = false;
    if (buffer.length > outputLimitBytes) {
      buffer = buffer.subarray(0, outputLimitBytes);
      truncated = true;
    }

    const text = buffer.toString('utf8');
    const sha256B64 = crypto.createHash('sha256').update(text).digest('base64');

    res.json({
      ok: true,
      url,
      finalUrl: result.url,
      status: result.status,
      contentType,
      etag: result.headers['etag'],
      lastModified: result.headers['last-modified'],
      sha256B64,
      text,
      truncated,
      fromCache: false
    });
  } catch (e) {
    res.json({ ok: false, error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

app.post('/api/tools/http_request', express.json(), async (req, res) => {
  const { url, method = 'GET', headers = {}, body, timeoutMs = 30000, followRedirects = true, maxBytes = 262144, responseMode = 'auto' } = req.body;
  if (!url) return res.status(400).json({ ok: false, error: 'MISSING_URL' });
  const outputLimitBytes = normalizeProxyByteLimit(maxBytes, 262144);
  const fetchLimitBytes = normalizeProxyByteLimit(Math.max(outputLimitBytes * 2, 262144), PROXY_FETCH_HARD_MAX_BYTES);
  const timeoutMsSafe = Math.max(100, Math.min(Number(timeoutMs) || 30000, 60000));
  const followRedirectsSafe = normalizeProxyBoolean(followRedirects, true);
  const methodSafe = normalizeProxyMethod(method, 'GET');
  const responseModeSafe = (() => {
    const mode = String(responseMode || 'auto').trim().toLowerCase();
    if (mode === 'text' || mode === 'json' || mode === 'base64') return mode;
    return 'auto';
  })();

  // Safety: Sanitize headers
  const safeHeaders = {};
  const blockedHeaderNames = new Set([
    'host',
    'connection',
    'proxy-authorization',
    'proxy-authenticate',
    'transfer-encoding',
    'content-length'
  ]);
  for (const [k, v] of Object.entries(headers)) {
    if (typeof k !== 'string' || typeof v !== 'string') continue;
    const headerName = k.trim();
    if (!headerName) continue;
    if (blockedHeaderNames.has(headerName.toLowerCase())) continue;
    safeHeaders[headerName] = v;
  }

  // Handle body
  let fetchBody = undefined;
  try {
    if (body != null) {
      if (typeof body === 'string') {
        fetchBody = body;
      } else if (typeof body !== 'object') {
        fetchBody = String(body);
      } else {
        const hasOwn = (key) => Object.prototype.hasOwnProperty.call(body, key);
        const hasKind = typeof body.kind === 'string' && body.kind.trim();
        const kind = hasKind ? body.kind.trim().toLowerCase() : '';

        if (!hasKind) {
          if (hasOwn('json')) {
            if (!safeHeaders['content-type']) safeHeaders['content-type'] = 'application/json';
            fetchBody = JSON.stringify(body.json);
          } else if (hasOwn('text')) {
            fetchBody = typeof body.text === 'string' ? body.text : String(body.text ?? '');
          } else if (hasOwn('base64')) {
            const base64 = typeof body.base64 === 'string' ? body.base64 : '';
            if (!/^[A-Za-z0-9+/=]*$/.test(base64)) throw new Error('INVALID_BASE64');
            fetchBody = Buffer.from(base64, 'base64');
          } else {
            if (!safeHeaders['content-type']) safeHeaders['content-type'] = 'application/json';
            fetchBody = JSON.stringify(body);
          }
        } else if (kind === 'json') {
          if (!safeHeaders['content-type']) safeHeaders['content-type'] = 'application/json';
          fetchBody = JSON.stringify(body.json);
        } else if (kind === 'text') {
          fetchBody = typeof body.text === 'string' ? body.text : String(body.text ?? '');
        } else if (kind === 'base64') {
          const base64 = typeof body.base64 === 'string' ? body.base64 : '';
          if (!/^[A-Za-z0-9+/=]*$/.test(base64)) throw new Error('INVALID_BASE64');
          fetchBody = Buffer.from(base64, 'base64');
        } else {
          throw new Error('INVALID_BODY_KIND');
        }
      }
    }
  } catch {
    return res.status(400).json({ ok: false, error: 'INVALID_ARGUMENTS' });
  }

  if (fetchBody != null) {
    const bodySize = Buffer.isBuffer(fetchBody)
      ? fetchBody.length
      : Buffer.byteLength(String(fetchBody), 'utf8');
    if (bodySize > 65536) {
      return res.status(400).json({ ok: false, error: 'REQUEST_BODY_TOO_LARGE' });
    }
  }

  const startedAtMs = Date.now();
  try {
    const result = await proxyFetch(url, {
      method: methodSafe,
      headers: safeHeaders,
      body: fetchBody,
      timeoutMs: timeoutMsSafe,
      followRedirects: followRedirectsSafe,
      responseLimitBytes: fetchLimitBytes
    });

    if (!result.ok) {
      return res.json({
        ok: false,
        error: {
          code: result.errorCode || 'REQUEST_FAILED',
          message: result.error || 'REQUEST_FAILED',
          ...(result.details ? { details: result.details } : {})
        }
      });
    }

    let buffer = result.buffer;
    let truncated = false;
    if (buffer.length > outputLimitBytes) {
      buffer = buffer.subarray(0, outputLimitBytes);
      truncated = true;
    }

    // Decode response
    let bodyText = null;
    let bodyJson = null;
    let bodyBase64 = null;
    const contentType = result.headers['content-type'] || '';

    if (responseModeSafe === 'text' || responseModeSafe === 'auto') {
      try { bodyText = buffer.toString('utf8'); } catch { }
    }

    if (responseModeSafe === 'json' || (responseModeSafe === 'auto' && contentType.includes('application/json'))) {
      try {
        if (!bodyText) bodyText = buffer.toString('utf8');
        bodyJson = JSON.parse(bodyText);
      } catch { }
    }

    if (responseModeSafe === 'base64' || (responseModeSafe === 'auto' && !bodyText && !bodyJson)) {
      bodyBase64 = buffer.toString('base64');
    }

    res.json({
      ok: true,
      status: result.status,
      finalUrl: result.url,
      headers: result.headers,
      bodyText,
      bodyJson,
      bodyBase64,
      truncated,
      timing: {
        startedAtMs,
        durationMs: Date.now() - startedAtMs
      }
    });

  } catch (e) {
    res.json({ ok: false, error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

const port = Number(process.env.PORT || 4173);
const server = http.createServer(app);

if (process.env.NODE_ENV === 'test' && WebSocketServer) {
  const testExperienceWss = new WebSocketServer({ noServer: true });
  testExperienceWss.on('connection', (socket) => {
    socket.on('message', (raw) => {
      const text = Buffer.isBuffer(raw)
        ? raw.toString('utf8')
        : typeof raw === 'string'
          ? raw
          : String(raw || '');
      let payload = null;
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }

      if (!payload || typeof payload !== 'object') {
        socket.send(JSON.stringify({ ok: false, error: 'INVALID_JSON' }));
        return;
      }

      const type = typeof payload.type === 'string' ? payload.type.trim() : '';
      if (type === 'experience.run') {
        const files = payload.files && typeof payload.files === 'object' ? payload.files : {};
        const fileKeys = Object.keys(files).filter((k) => typeof files[k] === 'string').sort();
        socket.send(JSON.stringify({
          ok: true,
          receivedType: 'experience.run',
          mode: 'ws-test',
          fileKeys,
          skillPresent: fileKeys.includes('skill'),
          receivedAtMs: Date.now()
        }));
        return;
      }

      socket.send(JSON.stringify({
        ok: true,
        receivedType: type || 'unknown',
        mode: 'ws-test',
        receivedAtMs: Date.now()
      }));
    });
  });

  server.on('upgrade', (req, socket, head) => {
    let pathname = '';
    try {
      pathname = new URL(String(req.url || '/'), 'http://localhost').pathname;
    } catch {
      pathname = '';
    }
    if (pathname !== '/__test__/experience/ws') {
      socket.destroy();
      return;
    }
    testExperienceWss.handleUpgrade(req, socket, head, (ws) => {
      testExperienceWss.emit('connection', ws, req);
    });
  });
}

server.listen(port, () => {
  console.log(`[agent-town] http://localhost:${port}`);
});
