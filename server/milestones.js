const { nowIso } = require('./util');
const { awardNewRewards } = require('./rewards');

function emitMilestone(store, { houseId, event, source = 'system', value = 1, meta = {} }) {
  store.milestones = Array.isArray(store.milestones) ? store.milestones : [];
  const ms = {
    id: `ms_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: nowIso(),
    houseId,
    event,
    source,
    value,
    meta: meta && typeof meta === 'object' ? meta : {}
  };
  store.milestones.push(ms);

  // Award any newly-unlocked rewards (append-only ledger).
  awardNewRewards(store, houseId, ms.id);

  return ms;
}

module.exports = {
  emitMilestone
};
