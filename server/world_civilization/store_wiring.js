const { createCivicAuditLedger } = require('./audit_ledger');
const { createCivicDelegationStore } = require('./delegations');
const { createCivicProposalStore } = require('./proposals');

let proposalRouteStores = null;
let proposalRouteStoresKey = '';

function truthy(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

function configuredWorldCivilizationStorePaths(env = process.env) {
  return {
    auditSqlitePath: String(env.V6_CIVIC_AUDIT_SQLITE_PATH || '').trim(),
    proposalSqlitePath: String(env.V6_CIVIC_PROPOSAL_SQLITE_PATH || '').trim(),
    delegationSqlitePath: String(env.V6_CIVIC_DELEGATION_SQLITE_PATH || '').trim()
  };
}

function proposalRouteStoreWiringEnabled(env = process.env) {
  return truthy(env.V6_CIVIC_PROPOSAL_STORE_WIRING_ENABLED);
}

function proposalRouteStoreKey(paths = {}) {
  return [
    paths.auditSqlitePath || '',
    paths.proposalSqlitePath || '',
    paths.delegationSqlitePath || ''
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

module.exports = {
  closeConfiguredWorldCivilizationProposalStores,
  configuredWorldCivilizationStorePaths,
  getConfiguredWorldCivilizationProposalStores,
  proposalRouteStoreWiringEnabled
};
