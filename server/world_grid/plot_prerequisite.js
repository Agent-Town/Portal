const { loadPlotByPairId } = require('../founders_plot/store');

function worldGridPlotRequired(reason = 'FOUNDERS_PLOT_MISSING') {
  const error = new Error('WORLD_GRID_PLOT_REQUIRED');
  error.details = { reason };
  return error;
}

function loadWorldGridPlotPrerequisite(identity = {}) {
  const pairId = typeof identity?.pairId === 'string' ? identity.pairId.trim() : '';
  if (!pairId) throw worldGridPlotRequired('PLOT_IDENTITY_MISSING');
  const state = loadPlotByPairId(pairId);
  const hasHomeSettlement = !!state?.plot?.plotId
    && Array.isArray(state.buildings)
    && state.buildings.some((building) => building?.type === 'HQ');
  if (!hasHomeSettlement) throw worldGridPlotRequired('FOUNDERS_PLOT_MISSING');
  return state;
}

module.exports = {
  loadWorldGridPlotPrerequisite,
  worldGridPlotRequired
};
