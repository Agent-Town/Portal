const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { CIVIC_SCHEMA_VERSION } = require('../server/world_civilization/schemas');
const { createCivicAuditLedger } = require('../server/world_civilization/audit_ledger');
const {
  MODERATION_STATUS_NEEDS_REVIEW,
  PROPOSAL_STATUS_DRAFTED,
  createCivicProposalStore
} = require('../server/world_civilization/proposals');

function withTempProposalStore(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-proposals-'));
  const proposalPath = path.join(dir, 'proposals.sqlite');
  const auditPath = path.join(dir, 'audit.sqlite');
  const auditLedger = createCivicAuditLedger({ sqlitePath: auditPath });
  const store = createCivicProposalStore({ sqlitePath: proposalPath, auditLedger });
  try {
    return fn({ auditLedger, auditPath, proposalPath, store });
  } finally {
    store.close();
    auditLedger.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function proposal(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    proposalId: 'proposal_public_works_bridge_001',
    proposer: {
      kind: 'human',
      accountId: 'acct_v6_human_001'
    },
    scope: {
      kind: 'public_works',
      targetId: 'district_great_ridge'
    },
    affectedPublicState: ['public_works:gorge_bridge'],
    effectPreview: {
      effectType: 'public_works_accounting',
      mutationMode: 'preview_only',
      summary: 'Preview bridge accounting without applying it.'
    },
    moderationClass: 'public_works',
    expiresAtMs: 4_102_444_800_000,
    idempotencyKey: 'idem_proposal_bridge_001',
    rollbackPlan: {
      planId: 'rollbackplan_public_works_001',
      strategy: 'Restore previous public works accounting snapshot.',
      canRollback: true,
      irreversibleEffects: [],
      maxRollbackMs: 86_400_000
    },
    privacy: {
      redacted: true,
      privateDataIncluded: false,
      dataClasses: ['public_profile', 'public_world_state']
    },
    ...overrides
  };
}

test('V6 proposal lifecycle drafts bounded proposals without executing effects', () => withTempProposalStore(({ auditLedger, store }) => {
  const drafted = store.draftProposal(proposal(), { nowMs: 1_779_784_000_000 });

  assert.equal(drafted.proposalId, 'proposal_public_works_bridge_001');
  assert.equal(drafted.status, PROPOSAL_STATUS_DRAFTED);
  assert.equal(drafted.moderationStatus, MODERATION_STATUS_NEEDS_REVIEW);
  assert.equal(drafted.auditEntryId, 'audit_proposal_public_works_bridge_001');
  assert.equal(store.count(), 1);
  assert.equal(auditLedger.count(), 1);
  assert.deepEqual(auditLedger.replay().map((row) => row.entry.actionType), ['proposal.created']);
  assert.equal(typeof store.applyProposal, 'undefined');
  assert.equal(typeof store.executeProposal, 'undefined');

  const preview = store.previewProposalEffect(drafted.proposalId);
  assert.equal(preview.effectPreview.mutationMode, 'preview_only');
  assert.equal(auditLedger.count(), 1);
}));

test('V6 proposal lifecycle idempotency returns duplicates and rejects changed reuse', () => withTempProposalStore(({ auditLedger, store }) => {
  const first = store.draftProposal(proposal(), { nowMs: 1_779_784_000_000 });
  const duplicate = store.draftProposal(proposal(), { nowMs: 1_779_784_123_000 });

  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.proposalId, first.proposalId);
  assert.equal(store.count(), 1);
  assert.equal(auditLedger.count(), 1);
  assert.throws(
    () => store.draftProposal(proposal({
      proposalId: 'proposal_public_works_bridge_002',
      effectPreview: {
        effectType: 'public_works_accounting',
        mutationMode: 'preview_only',
        summary: 'Changed proposal content.'
      }
    }), { nowMs: 1_779_784_456_000 }),
    /CIVIC_PROPOSAL_IDEMPOTENCY_CONFLICT/
  );
  assert.equal(store.count(), 1);
  assert.equal(auditLedger.count(), 1);
}));

test('V6 proposal lifecycle rejects invalid, expired, and private-data proposals before persistence', () => withTempProposalStore(({ auditLedger, store }) => {
  assert.throws(
    () => store.draftProposal(proposal({
      effectPreview: {
        effectType: 'public_works_accounting',
        mutationMode: 'apply_now',
        summary: 'Apply immediately.'
      },
      debugTrace: {
        token: 'sk-test-secret-value'
      }
    }), { nowMs: 1_779_784_000_000 }),
    /CIVIC_PROPOSAL_INVALID/
  );
  assert.throws(
    () => store.draftProposal(proposal({
      proposalId: 'proposal_public_works_bridge_expired',
      idempotencyKey: 'idem_proposal_bridge_expired',
      expiresAtMs: 1_000
    }), { nowMs: 2_000 }),
    /CIVIC_PROPOSAL_EXPIRED/
  );
  assert.equal(store.count(), 0);
  assert.equal(auditLedger.count(), 0);
}));

test('V6 proposal lifecycle persists across reopen and supports proposer listing', () => withTempProposalStore(({ auditLedger, auditPath, proposalPath, store }) => {
  store.draftProposal(proposal(), { nowMs: 1_779_784_000_000 });
  store.close();
  auditLedger.close();

  const reopenedAudit = createCivicAuditLedger({ sqlitePath: auditPath });
  const reopened = createCivicProposalStore({ sqlitePath: proposalPath, auditLedger: reopenedAudit });
  try {
    assert.equal(reopened.count(), 1);
    assert.equal(reopened.getProposal('proposal_public_works_bridge_001').status, PROPOSAL_STATUS_DRAFTED);
    assert.deepEqual(
      reopened.listProposals({ proposerAccountId: 'acct_v6_human_001' }).map((entry) => entry.proposalId),
      ['proposal_public_works_bridge_001']
    );
    assert.deepEqual(
      reopened.listProposals({ moderationStatus: MODERATION_STATUS_NEEDS_REVIEW }).map((entry) => entry.proposalId),
      ['proposal_public_works_bridge_001']
    );
    assert.equal(reopenedAudit.count(), 1);
  } finally {
    reopened.close();
    reopenedAudit.close();
  }
}));
