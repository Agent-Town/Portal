const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const { FOUNDERS_PLOT_TOOL_SPECS } = require('../server/founders_plot/tools');

async function loadModule() {
  const modulePath = path.join(__dirname, '../vendors/openclaw-lite-main/src/openclaw-lite/founders-plot-foreman-context.js');
  return import(pathToFileURL(modulePath).href);
}

test('context assembler includes pack hashes, merged tool contract, and provider-safe candidate aliases', async () => {
  const { buildFoundersPlotForemanContext } = await loadModule();
  const context = await buildFoundersPlotForemanContext({
    plotId: 'plot_1',
    foremanId: 'clover',
    runtimeId: 'rt_1',
    packFiles: {
      skill: '# Skill\nClover is the bounded Foreman.',
      heartbeat: '# Heartbeat\nPrefer collecting ready outputs.',
      tools: '# Tools\nUse provider-safe aliases and the compact tool guide.',
      goals: '# Goals\nCollect ready output when it helps the town.',
      safety: '# Safety\nDo not invent tools.'
    },
    toolRegistry: FOUNDERS_PLOT_TOOL_SPECS,
    observation: {
      plotId: 'plot_1',
      currentGoal: { title: 'Collect wood' },
      activeContract: {
        contractId: 'ctr_1',
        requirements: { resources: { wood: 6 } }
      }
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

  assert.equal(context.contextVersion, 'founders-plot-foreman-context.v1');
  assert.equal(context.pack.files.skillMd.present, true);
  assert.equal(typeof context.pack.files.skillMd.hash, 'string');
  assert.equal(context.pack.files.heartbeatMd.present, true);
  assert.equal(context.toolContract.source, 'merged');
  assert.equal(context.completeness.canAct, true);
  assert.equal(typeof context.pack.packHash, 'string');
  assert.ok(context.toolContract.providerTools.some((tool) => tool.name === 'founders_plot_collect_outputs'));
  assert.equal(context.safeCandidates[0].providerSafeToolName, 'founders_plot_collect_outputs');
  assert.equal(context.safeCandidates[0].providerSafeToolKnown, true);
});
