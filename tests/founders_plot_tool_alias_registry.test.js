const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const { FOUNDERS_PLOT_TOOL_SPECS } = require('../server/founders_plot/tools');

async function loadModule() {
  const modulePath = path.join(__dirname, '../vendors/openclaw-lite-main/src/openclaw-lite/founders-plot-foreman-context.js');
  return import(pathToFileURL(modulePath).href);
}

test('tool alias registry maps canonical names to provider-safe aliases with no dotted tool names', async () => {
  const { buildFoundersPlotToolAliasRegistry } = await loadModule();
  const registry = buildFoundersPlotToolAliasRegistry(FOUNDERS_PLOT_TOOL_SPECS);

  assert.equal(registry.aliasMap.founders_plot_collect_outputs, 'et.plot.collect_outputs');
  assert.equal(registry.aliasMap.founders_plot_foreman_scheduler_pause, 'et.foreman.scheduler.pause');
  assert.ok(registry.providerTools.length >= FOUNDERS_PLOT_TOOL_SPECS.length);
  assert.ok(registry.providerTools.every((tool) => !tool.name.includes('.')));
  assert.ok(registry.providerTools.every((tool) => tool.canonicalName.startsWith('et.')));
});
