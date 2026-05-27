const { createCivicAuditLedger } = require('./audit_ledger');
const { createCivicDelegationStore } = require('./delegations');
const { createCivicProposalStore } = require('./proposals');
const { createCivicVoteStore } = require('./votes');

let proposalRouteStores = null;
let proposalRouteStoresKey = '';
let voteRouteStores = null;
let voteRouteStoresKey = '';

function truthy(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

function configuredWorldCivilizationStorePaths(env = process.env) {
  return {
    auditSqlitePath: String(env.V6_CIVIC_AUDIT_SQLITE_PATH || '').trim(),
    proposalSqlitePath: String(env.V6_CIVIC_PROPOSAL_SQLITE_PATH || '').trim(),
    delegationSqlitePath: String(env.V6_CIVIC_DELEGATION_SQLITE_PATH || '').trim(),
    voteSqlitePath: String(env.V6_CIVIC_VOTE_SQLITE_PATH || '').trim()
  };
}

function proposalRouteStoreWiringEnabled(env = process.env) {
  return truthy(env.V6_CIVIC_PROPOSAL_STORE_WIRING_ENABLED);
}

function voteRouteStoreWiringEnabled(env = process.env) {
  return truthy(env.V6_CIVIC_VOTE_STORE_WIRING_ENABLED);
}

function proposalRouteStoreKey(paths = {}) {
  return [
    paths.auditSqlitePath || '',
    paths.proposalSqlitePath || '',
    paths.delegationSqlitePath || ''
  ].join('\n');
}

function voteRouteStoreKey(paths = {}) {
  return [
    paths.auditSqlitePath || '',
    paths.proposalSqlitePath || '',
    paths.delegationSqlitePath || '',
    paths.voteSqlitePath || ''
  ].join('\n');
}

function closeConfiguredWorldCivilizationProposalStores() {
  if (!proposalRouteStores) return;
  const stores = proposalRouteStores;
  proposalRouteStores = null;
  proposalRouteStoresKey = '';
  if (stores.delegationStore?.close) stores.delegationStore.close();
  if (stores.proposalStore?.close) stores.proposalStore.close();
  if (stores.auditLedger?.close) stores.auditLedger.close();
}

function closeConfiguredWorldCivilizationVoteStores() {
  if (!voteRouteStores) return;
  const stores = voteRouteStores;
  voteRouteStores = null;
  voteRouteStoresKey = '';
  if (stores.voteStore?.close) stores.voteStore.close();
  if (stores.delegationStore?.close) stores.delegationStore.close();
  if (stores.proposalStore?.close) stores.proposalStore.close();
  if (stores.auditLedger?.close) stores.auditLedger.close();
}

function getConfiguredWorldCivilizationProposalStores(env = process.env) {
  if (!proposalRouteStoreWiringEnabled(env)) return null;
  const paths = configuredWorldCivilizationStorePaths(env);
  if (!paths.auditSqlitePath || !paths.proposalSqlitePath) return null;
  const key = proposalRouteStoreKey(paths);
  if (proposalRouteStores && proposalRouteStoresKey === key) return proposalRouteStores;

  closeConfiguredWorldCivilizationProposalStores();

  const auditLedger = createCivicAuditLedger({ sqlitePath: paths.auditSqlitePath });
  try {
    const proposalStore = createCivicProposalStore({
      sqlitePath: paths.proposalSqlitePath,
      auditLedger
    });
    let delegationStore = null;
    try {
      if (paths.delegationSqlitePath) {
        delegationStore = createCivicDelegationStore({
          sqlitePath: paths.delegationSqlitePath,
          auditLedger
        });
      }
    } catch (err) {
      proposalStore.close();
      throw err;
    }
    proposalRouteStores = {
      auditLedger,
      proposalStore,
      delegationStore,
      paths: { ...paths },
      releaseReady: false,
      status: 'research_only'
    };
    proposalRouteStoresKey = key;
    return proposalRouteStores;
  } catch (err) {
    auditLedger.close();
    throw err;
  }
}

function getConfiguredWorldCivilizationVoteStores(env = process.env) {
  if (!voteRouteStoreWiringEnabled(env)) return null;
  const paths = configuredWorldCivilizationStorePaths(env);
  if (!paths.auditSqlitePath || !paths.proposalSqlitePath || !paths.voteSqlitePath) return null;
  const key = voteRouteStoreKey(paths);
  if (voteRouteStores && voteRouteStoresKey === key) return voteRouteStores;

  closeConfiguredWorldCivilizationVoteStores();

  const auditLedger = createCivicAuditLedger({ sqlitePath: paths.auditSqlitePath });
  try {
    const proposalStore = createCivicProposalStore({
      sqlitePath: paths.proposalSqlitePath,
      auditLedger
    });
    let delegationStore = null;
    let voteStore = null;
    try {
      if (paths.delegationSqlitePath) {
        delegationStore = createCivicDelegationStore({
          sqlitePath: paths.delegationSqlitePath,
          auditLedger
        });
      }
      voteStore = createCivicVoteStore({
        sqlitePath: paths.voteSqlitePath,
        proposalStore,
        auditLedger
      });
    } catch (err) {
      if (voteStore?.close) voteStore.close();
      if (delegationStore?.close) delegationStore.close();
      proposalStore.close();
      throw err;
    }
    voteRouteStores = {
      auditLedger,
      proposalStore,
      delegationStore,
      voteStore,
      paths: { ...paths },
      releaseReady: false,
      status: 'research_only'
    };
    voteRouteStoresKey = key;
    return voteRouteStores;
  } catch (err) {
    auditLedger.close();
    throw err;
  }
}

module.exports = {
  closeConfiguredWorldCivilizationProposalStores,
  closeConfiguredWorldCivilizationVoteStores,
  configuredWorldCivilizationStorePaths,
  getConfiguredWorldCivilizationProposalStores,
  getConfiguredWorldCivilizationVoteStores,
  proposalRouteStoreWiringEnabled,
  voteRouteStoreWiringEnabled
};
