const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { CIVIC_SCHEMA_VERSION } = require('../server/world_civilization/schemas');
const { createCivicAuditLedger } = require('../server/world_civilization/audit_ledger');
const {
  INSTITUTION_STATUS_CHARTERED,
  createCivicInstitutionStore
} = require('../server/world_civilization/institutions');

function withTempInstitutionStore(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-institutions-'));
  const sqlitePath = path.join(dir, 'institutions.sqlite');
  const auditSqlitePath = path.join(dir, 'audit.sqlite');
  const auditLedger = createCivicAuditLedger({ sqlitePath: auditSqlitePath });
  const store = createCivicInstitutionStore({ sqlitePath, auditLedger });
  try {
    return fn({ auditLedger, auditSqlitePath, sqlitePath, store });
  } finally {
    store.close();
    auditLedger.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function institution(overrides = {}) {
  return {
    schemaVersion: CIVIC_SCHEMA_VERSION,
    institutionId: 'institution_bridge_council_001',
    charterId: 'charter_bridge_council_001',
    charteredBy: {
      kind: 'human',
      accountId: 'acct_v6_human_001'
    },
    displayName: 'Bridge Council',
    purpose: 'Coordinate public works proposals for the Great Ridge district.',
    scope: {
      kind: 'public_works',
      targetId: 'district_great_ridge'
    },
    proposalTypes: ['public_works', 'public_world'],
    membershipRuleId: 'rule_bridge_members_001',
    eligibilityRuleId: 'rule_bridge_voters_001',
    moderationPolicyId: 'policy_v6_public_001',
    votingRuleId: 'rule_bridge_majority_001',
    publicAuditSummary: 'Bridge Council charter for public works coordination.',
    effectiveAtMs: 1_779_784_000_000,
    privacy: {
      redacted: true,
      privateDataIncluded: false,
      dataClasses: ['public_audit_summary', 'public_world_state']
    },
    ...overrides
  };
}

test('V6 institution store records chartered institutions without player-visible mechanics', () => withTempInstitutionStore(({ auditLedger, store }) => {
  const row = store.charterInstitution(institution(), { nowMs: 1_779_784_000_000 });
  const summary = store.summarizeScopeInstitutions('district_great_ridge');

  assert.equal(row.institutionId, 'institution_bridge_council_001');
  assert.equal(row.status, INSTITUTION_STATUS_CHARTERED);
  assert.equal(row.auditEntryId, 'audit_institution_bridge_council_001');
  assert.equal(row.scopeKind, 'public_works');
  assert.equal(summary.institutionCount, 1);
  assert.equal(summary.byScope.public_works.chartered, 1);
  assert.equal(summary.playerVisible, false);
  assert.equal(summary.executionStatus, 'not_executable');
  assert.equal(typeof store.applyCharter, 'undefined');
  assert.equal(typeof store.openInstitution, 'undefined');

  const audit = auditLedger.getByEntryId('audit_institution_bridge_council_001');
  assert.equal(audit.entry.actionType, 'institution.chartered');
  assert.equal(audit.entry.actor.accountId, 'acct_v6_human_001');
  assert.equal(audit.entry.objectRef, 'institution_bridge_council_001');
}));

test('V6 institution store is idempotent by institution and rejects duplicate scope charters', () => withTempInstitutionStore(({ auditLedger, store }) => {
  const first = store.charterInstitution(institution(), { nowMs: 1_779_784_000_000 });
  const duplicate = store.charterInstitution(institution(), { nowMs: 1_779_784_001_000 });

  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.institutionId, first.institutionId);
  assert.equal(store.count(), 1);
  assert.equal(auditLedger.count(), 1);
  assert.throws(
    () => store.charterInstitution(institution({
      displayName: 'Changed Bridge Council'
    }), { nowMs: 1_779_784_002_000 }),
    /CIVIC_INSTITUTION_ID_CONFLICT/
  );
  assert.throws(
    () => store.charterInstitution(institution({
      institutionId: 'institution_bridge_council_002'
    }), { nowMs: 1_779_784_003_000 }),
    /CIVIC_INSTITUTION_SCOPE_CHARTER_CONFLICT/
  );
  assert.equal(store.count(), 1);
  assert.equal(auditLedger.count(), 1);
}));

test('V6 institution store rejects unsupported charters and private data before persistence', () => withTempInstitutionStore(({ auditLedger, store }) => {
  assert.throws(
    () => store.charterInstitution(institution({
      institutionId: 'institution_agent_charter_001',
      charterId: 'charter_agent_charter_001',
      charteredBy: {
        kind: 'agent',
        accountId: 'acct_v6_human_001',
        agentId: 'agent_civic_clover_001'
      }
    }), { nowMs: 1_779_784_000_000 }),
    /CIVIC_INSTITUTION_INVALID/
  );
  assert.throws(
    () => store.charterInstitution(institution({
      institutionId: 'institution_bad_type_001',
      charterId: 'charter_bad_type_001',
      proposalTypes: ['public_works', 'private_town']
    }), { nowMs: 1_779_784_000_000 }),
    /CIVIC_INSTITUTION_INVALID/
  );
  assert.throws(
    () => store.charterInstitution(institution({
      institutionId: 'institution_private_trace_001',
      charterId: 'charter_private_trace_001',
      debugTrace: {
        token: 'sk-test-secret-value'
      }
    }), { nowMs: 1_779_784_000_000 }),
    /CIVIC_INSTITUTION_INVALID/
  );
  assert.equal(store.count(), 0);
  assert.equal(auditLedger.count(), 0);
}));

test('V6 institution store persists charters and supports scope replay indexes', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-v6-institutions-persist-'));
  const sqlitePath = path.join(dir, 'institutions.sqlite');
  const auditSqlitePath = path.join(dir, 'audit.sqlite');
  try {
    const auditLedger = createCivicAuditLedger({ sqlitePath: auditSqlitePath });
    const store = createCivicInstitutionStore({ sqlitePath, auditLedger });
    store.charterInstitution(institution(), { nowMs: 1_779_784_000_000 });
    store.charterInstitution(institution({
      institutionId: 'institution_sandbox_council_001',
      charterId: 'charter_sandbox_council_001',
      displayName: 'Sandbox Council',
      purpose: 'Review controlled sandbox policies before public experiments.',
      scope: {
        kind: 'sandbox_policy',
        targetId: 'district_great_ridge'
      },
      proposalTypes: ['sandbox_policy'],
      membershipRuleId: 'rule_sandbox_members_001',
      eligibilityRuleId: 'rule_sandbox_voters_001',
      moderationPolicyId: 'policy_v6_sandbox_001',
      votingRuleId: 'rule_sandbox_majority_001',
      publicAuditSummary: 'Sandbox Council charter for controlled policy review.'
    }), { nowMs: 1_779_784_001_000 });
    store.close();
    auditLedger.close();

    const reopenedAudit = createCivicAuditLedger({ sqlitePath: auditSqlitePath });
    const reopened = createCivicInstitutionStore({ sqlitePath, auditLedger: reopenedAudit });
    assert.equal(reopened.count(), 2);
    assert.equal(reopened.getInstitution('institution_bridge_council_001').displayName, 'Bridge Council');
    assert.deepEqual(
      reopened.listInstitutions({ scopeTargetId: 'district_great_ridge' }).map((row) => row.institutionId),
      ['institution_bridge_council_001', 'institution_sandbox_council_001']
    );
    assert.deepEqual(
      reopened.listInstitutions({ scopeKind: 'sandbox_policy' }).map((row) => row.institutionId),
      ['institution_sandbox_council_001']
    );
    const summary = reopened.summarizeScopeInstitutions('district_great_ridge');
    assert.equal(summary.institutionCount, 2);
    assert.equal(summary.byScope.sandbox_policy.chartered, 1);
    assert.equal(reopenedAudit.replay({ objectRef: 'institution_sandbox_council_001' })[0].entry.actionType, 'institution.chartered');
    reopened.close();
    reopenedAudit.close();
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
