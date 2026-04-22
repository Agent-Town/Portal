const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const { FOUNDERS_PLOT_TOOL_SPECS } = require('../server/founders_plot/tools');

async function loadModule() {
  const modulePath = path.join(__dirname, '../vendors/openclaw-lite-main/src/openclaw-lite/founders-plot-foreman-context.js');
  return import(pathToFileURL(modulePath).href);
}

async function buildContext(heartbeatText) {
  const { buildFoundersPlotForemanContext } = await loadModule();
  return buildFoundersPlotForemanContext({
    plotId: 'plot_1',
    foremanId: 'clover',
    runtimeId: 'rt_1',
    packFiles: {
      skill: '# Skill\nClover is the bounded Foreman.',
      heartbeat: heartbeatText,
      tools: '# Tools\nUse provider-safe aliases and the compact tool guide.',
      goals: '# Goals\nCollect ready output when it helps the town.',
    },
    toolRegistry: FOUNDERS_PLOT_TOOL_SPECS,
    observation: {
      plotId: 'plot_1',
      currentGoal: { title: 'Keep lumber moving' },
      activeContract: null
    },
    safeCandidates: [
      {
        candidateId: 'collect:bld_lumber',
        toolName: 'et.plot.collect_outputs',
        buildingId: 'bld_lumber',
        reason: 'Collect ready output from Lumber Camp.',
        canActNow: true
      }
    ]
  });
}

test('heartbeat and tools context changes alter pack hash and deterministic test-brain output', async () => {
  const { chooseFoundersPlotCandidateWithTestBrain } = await loadModule();
  const contextA = await buildContext('# Heartbeat\nPrefer collecting ready outputs.');
  const contextB = await buildContext('# Heartbeat\nIf no contract is active, return HEARTBEAT_OK unless storage is capped.');

  assert.notEqual(contextA.pack.packHash, contextB.pack.packHash);

  const decisionA = chooseFoundersPlotCandidateWithTestBrain(contextA);
  const decisionB = chooseFoundersPlotCandidateWithTestBrain(contextB);

  assert.equal(decisionA.selectedCandidateId, 'collect:bld_lumber');
  assert.equal(decisionB.selectedCandidateId, null);
  assert.equal(decisionB.noopCode, 'HEARTBEAT_OK');
});
