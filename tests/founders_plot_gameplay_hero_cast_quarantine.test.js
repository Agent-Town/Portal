const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');
const gameplayFiles = [
  'public/founders-plot.html',
  'public/experiences/founders-plot/app.js',
  'public/experiences/founders-plot/scene_state.js',
  'public/experiences/founders-plot/scene_render.js',
  'public/experiences/founders-plot/styles.css'
];

const forbiddenMarkers = [
  'prairie-dog-ranger-source',
  'sheriff-lobster-source',
  'chibi-homesteader-girl-source',
  'wizard-kid-source',
  'Prairie Dog Ranger',
  'Sheriff Lobster',
  'Chibi Homesteader Girl',
  'Wizard Kid'
];

test('default Founders Plot gameplay files stay free of hero-cast ensemble imports', () => {
  gameplayFiles.forEach((relativePath) => {
    const target = path.join(repoRoot, relativePath);
    const text = fs.readFileSync(target, 'utf8');
    forbiddenMarkers.forEach((marker) => {
      assert.doesNotMatch(text, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    });
  });
});
