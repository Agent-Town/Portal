const { AUTONOMY_TIER_BY_POLICY, DEFAULT_POLICY, stateHash, stateHashPayload } = require('./engine');

function replayFromEvents(events = []) {
  const plot = {};
  const buildings = new Map();
  const jobs = new Map();
  const approvals = new Map();
  const policy = {
    observeAndSuggest: DEFAULT_POLICY.observeAndSuggest,
    collectOutputs: DEFAULT_POLICY.collectOutputs,
    queueProduction: DEFAULT_POLICY.queueProduction,
    setPriority: DEFAULT_POLICY.setPriority,
    sellSurplusFood: DEFAULT_POLICY.sellSurplusFood,
    sellDailyCoinCap: DEFAULT_POLICY.sellDailyCoinCap,
    maxAutonomousActionsPerHour: DEFAULT_POLICY.maxAutonomousActionsPerHour,
    emergencyPause: DEFAULT_POLICY.emergencyPause
  };
  const meta = {
    workshopBuffCharges: 0,
    pendingRewards: [],
    claimedRewards: [],
    firstPlacedTypes: [],
    firstCollectedTypes: [],
    automationAwards: []
  };

  for (const event of Array.isArray(events) ? events : []) {
    const data = event && typeof event.data === 'object' ? event.data : {};
    if (data.plot && typeof data.plot === 'object') {
      Object.assign(plot, data.plot);
      if (Array.isArray(data.plot.pendingRewards)) {
        meta.pendingRewards = data.plot.pendingRewards;
      }
      if (typeof data.plot.workshopBuffCharges === 'number') {
        meta.workshopBuffCharges = data.plot.workshopBuffCharges;
      }
    }
    if (data.building && typeof data.building === 'object' && data.building.buildingId) {
      buildings.set(data.building.buildingId, { ...data.building });
    }
    if (data.job && typeof data.job === 'object' && data.job.jobId) {
      jobs.set(data.job.jobId, { ...data.job });
    }
    if (data.approval && typeof data.approval === 'object' && data.approval.approvalId) {
      approvals.set(data.approval.approvalId, { ...data.approval });
    }
    if (data.policy && typeof data.policy === 'object' && data.policy.key) {
      if (Object.prototype.hasOwnProperty.call(policy, data.policy.key)) {
        policy[data.policy.key] = data.policy.value;
      }
      const automationTier = AUTONOMY_TIER_BY_POLICY[data.policy.key];
      if (automationTier && !meta.automationAwards.includes(automationTier)) {
        meta.automationAwards.push(automationTier);
      }
    }
    if (data.reward && typeof data.reward === 'object' && data.reward.key) {
      meta.claimedRewards = [...meta.claimedRewards, data.reward.key];
      meta.pendingRewards = meta.pendingRewards.filter((reward) => reward.key !== data.reward.key);
    }
    if (event?.type === 'BUILDING_PLACED' && data.building?.type && data.building.type !== 'HQ') {
      if (!meta.firstPlacedTypes.includes(data.building.type)) {
        meta.firstPlacedTypes.push(data.building.type);
      }
    }
    if (event?.type === 'OUTPUT_COLLECTED' && data.building?.buildingId) {
      for (const job of jobs.values()) {
        if (
          job.buildingId === data.building.buildingId
          && job.status === 'COMPLETED'
          && (job.kind === 'PRODUCE' || job.kind === 'SELL')
        ) {
          job.status = 'CLAIMED';
        }
      }
    }
    if (event?.type === 'OUTPUT_COLLECTED' && data.building?.type && data.building.type !== 'HQ') {
      if (!meta.firstCollectedTypes.includes(data.building.type)) {
        meta.firstCollectedTypes.push(data.building.type);
      }
    }
  }

  const finalState = {
    plot,
    buildings: Array.from(buildings.values()).sort((a, b) => {
      if (a.type < b.type) return -1;
      if (a.type > b.type) return 1;
      return String(a.buildingId || '').localeCompare(String(b.buildingId || ''));
    }),
    jobs: Array.from(jobs.values()).sort((a, b) => {
      if (a.startedAt !== b.startedAt) return a.startedAt - b.startedAt;
      return String(a.jobId || '').localeCompare(String(b.jobId || ''));
    }),
    approvals: Array.from(approvals.values()).sort((a, b) => {
      if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
      return String(a.approvalId || '').localeCompare(String(b.approvalId || ''));
    }),
    policy,
    meta
  };

  return {
    eventCount: Array.isArray(events) ? events.length : 0,
    events: Array.isArray(events)
      ? events.map((event) => ({
        seq: event.seq,
        type: event.type,
        actor: event.actor,
        createdAt: event.createdAt,
        explanation: event.explanation || '',
        recapLine: event.recapLine || '',
        data: event && typeof event.data === 'object' ? event.data : {}
      }))
      : [],
    finalState,
    finalHash: stateHash(stateHashPayload(finalState))
  };
}

module.exports = {
  replayFromEvents
};
