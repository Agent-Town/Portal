const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');

function readLocal(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('design workspace defines the current source of truth for future agents', async () => {
  const requiredFiles = [
    'design/README.md',
    'design/DESIGN_SYSTEM.md',
    'design/FRONTEND_GUIDELINES.md',
    'design/APP_FLOW.md',
    'design/PRD.md',
    'design/TECH_STACK.md',
    'design/DESIGN_AUDIT_BASELINE.md',
    'design/IMPLEMENTATION_ROADMAP.md',
    'design/BACKLOG.md',
    'design/TDD_SPEC.md',
    'design/AGENT_RUNBOOK.md',
    'design/AUDIENCE_AND_GLOBALIZATION.md',
    'design/LESSONS.md',
    'design/progress.txt',
  ];

  for (const relativePath of requiredFiles) {
    expect(fs.existsSync(path.join(repoRoot, relativePath)), `${relativePath} should exist`).toBeTruthy();
  }

  const designSystem = readLocal('design/DESIGN_SYSTEM.md');
  expect(designSystem).toMatch(/public\/styles\.css/i);
  expect(designSystem).toMatch(/live implementation truth/i);
  expect(designSystem).toMatch(/reference-only/i);

  const readme = readLocal('design/README.md');
  expect(readme).toMatch(/future agentic ai designers/i);
  expect(readme).toMatch(/test-driven design/i);

  const tddSpec = readLocal('design/TDD_SPEC.md');
  expect(tddSpec).toMatch(/264_design_source_of_truth_contract/i);
  expect(tddSpec).toMatch(/279_provider_neutral_primary_copy/i);
});
