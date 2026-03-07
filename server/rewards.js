const { nowIso } = require('./util');

const REWARDS = [
  {
    id: 'key-holder',
    label: 'Key Holder',
    kind: 'badge',
    grants: { points: 10 },
    requires: [{ event: 'CEREMONY_COMPLETED', count: 1 }]
  },
  {
    id: 'first-entry',
    label: 'First Entry',
    kind: 'badge',
    grants: { points: 5 },
    requires: [{ event: 'HOUSE_APPEND', count: 1 }]
  }
];

function milestonesByEvent(milestones, houseId) {
  const out = new Map();
  for (const ms of milestones) {
    if (!ms || ms.houseId !== houseId) continue;
    const ev = ms.event;
    out.set(ev, (out.get(ev) || 0) + (typeof ms.value === 'number' ? ms.value : 1));
  }
  return out;
}

function rewardAlreadyGranted(ledger, houseId, rewardId) {
  return ledger.some((x) => x && x.houseId === houseId && x.rewardId === rewardId);
}

function isEligible(reward, counts) {
  return (reward.requires || []).every((r) => (counts.get(r.event) || 0) >= r.count);
}

function awardNewRewards(store, houseId, reasonEventId = null) {
  store.milestones = Array.isArray(store.milestones) ? store.milestones : [];
  store.rewardsLedger = Array.isArray(store.rewardsLedger) ? store.rewardsLedger : [];

  const counts = milestonesByEvent(store.milestones, houseId);
  const awarded = [];

  for (const reward of REWARDS) {
    if (!isEligible(reward, counts)) continue;
    if (rewardAlreadyGranted(store.rewardsLedger, houseId, reward.id)) continue;

    const entry = {
      id: `rw_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      createdAt: nowIso(),
      houseId,
      rewardId: reward.id,
      reasonEventId,
      meta: {}
    };
    store.rewardsLedger.push(entry);
    awarded.push(entry);
  }

  return { awarded };
}

function computeRewardsSummary(store, houseId) {
  store.rewardsLedger = Array.isArray(store.rewardsLedger) ? store.rewardsLedger : [];
  const unlockedIds = new Set(store.rewardsLedger.filter((x) => x && x.houseId === houseId).map((x) => x.rewardId));
  const unlocked = REWARDS.filter((r) => unlockedIds.has(r.id));
  const points = unlocked.reduce((sum, r) => sum + (Number(r.grants?.points) || 0), 0);
  const next = REWARDS.filter((r) => !unlockedIds.has(r.id));
  return { unlocked, points, next };
}

module.exports = {
  REWARDS,
  awardNewRewards,
  computeRewardsSummary
};
