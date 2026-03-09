const routeOwners = new Map();

function registerRouteOwner(family, owner) {
  const normalizedFamily = String(family || '').trim();
  const normalizedOwner = String(owner || '').trim();
  if (!normalizedFamily || !normalizedOwner) return;
  routeOwners.set(normalizedFamily, normalizedOwner);
}

function getRouteOwnerManifest() {
  return Array.from(routeOwners.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([family, owner]) => ({ family, owner }));
}

function resetRouteOwnerManifest() {
  routeOwners.clear();
}

module.exports = {
  getRouteOwnerManifest,
  registerRouteOwner,
  resetRouteOwnerManifest,
};
