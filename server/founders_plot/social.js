'use strict';

/**
 * Founders Plot — social read-only hooks (Milestone 7).
 *
 * Exposes a sanitized public "town card" view of a plot. Never leaks internal
 * state (policy, idempotency, PII, full event log).
 */

function buildPublicSummary(plot) {
  if (!plot) return null;
  const buildings = plot.buildings || [];
  const running = (plot.jobs || []).filter((j) => j.status === 'RUNNING').length;
  // Productivity score: a Phase-1 scalar derived from HQ level, placements,
  // completed production jobs, and XP. Deterministic, not a ranking.
  const completedJobs = (plot.jobs || []).filter((j) => j.status === 'CLAIMED' || j.status === 'COMPLETED').length;
  const productivity = plot.hqLevel * 50 + buildings.length * 10 + completedJobs * 2 + Math.floor((plot.townXp || 0) / 5);
  // Beauty score: placeholder based on diversity of building types.
  const types = new Set(buildings.map((b) => b.type));
  const beauty = types.size * 8;

  return {
    plotId: plot.plotId,
    title: `Founders Plot ${plot.plotId.slice(-4).toUpperCase()}`,
    hqLevel: plot.hqLevel,
    buildingCount: buildings.length,
    buildingTypes: [...types],
    running,
    productivity,
    beauty,
    townXp: plot.townXp,
    lastActivityAt: plot.updatedAt,
  };
}

module.exports = { buildPublicSummary };
