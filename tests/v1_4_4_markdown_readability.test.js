const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const ROOT = path.join(__dirname, '..');
const DOCS = [
  'specs/41_founders_plot_v1_4_4_play_first_onboarding_cleanup.md',
  'specs/42_founders_plot_v1_4_4_play_first_onboarding_cleanup_tdd_matrix.md',
  'docs/product/BRAIN_MODE_AND_ONBOARDING_COPY_DECISION_V1_4_4.md',
  'docs/product/PLAY_FIRST_ONBOARDING_CLEANUP_NOTES_V1_4_4.md',
  'docs/product/START_GATE_PRIVY_TO_FOUNDERS_PLOT_FLOW_V1_4_4.md',
  'docs/handoff/codex_v1_4_4_play_first_onboarding_cleanup_prompt.md',
  'public/experiences/founders-plot/skill.md',
  'public/experiences/founders-plot/heartbeat.md',
  'public/experiences/founders-plot/tools.md',
  'public/experiences/founders-plot/goals.md'
];

function isSkippableMarkdownLine(line, inFence) {
  const trimmed = line.trim();
  return (
    inFence
    || trimmed === ''
    || trimmed === '---'
    || trimmed.startsWith('|')
    || trimmed.startsWith('http://')
    || trimmed.startsWith('https://')
  );
}

test('V1.4.4 cleanup docs stay readable for future agent handoff', () => {
  const failures = [];
  for (const relPath of DOCS) {
    const absPath = path.join(ROOT, relPath);
    const text = fs.readFileSync(absPath, 'utf8');
    assert.match(text, /^# /m, `${relPath} must have a top-level heading`);
    let inFence = false;
    text.split(/\r?\n/).forEach((line, index) => {
      if (line.trim().startsWith('```')) {
        inFence = !inFence;
        return;
      }
      if (isSkippableMarkdownLine(line, inFence)) return;
      if (line.length > 160) failures.push(`${relPath}:${index + 1}:${line.length}`);
    });
  }

  assert.deepEqual(failures, []);
});

test('cleanup docs record Brain mode and play-first policy explicitly', () => {
  const spec = fs.readFileSync(path.join(ROOT, DOCS[0]), 'utf8');
  assert.match(spec, /Manual Founder Mode/);
  assert.match(spec, /Preview Clover/);
  assert.match(spec, /Real Clover Foreman/);
  assert.match(spec, /fail closed/i);
});
