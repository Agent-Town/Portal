const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { listPromptFiles, parseFrontMatter, repoRoot } = require('./v1_4_3_test_helpers');

test('V1.4.3 prompt files declare required front matter keys', () => {
  const promptFiles = listPromptFiles();
  assert.ok(promptFiles.length >= 10, 'expected V1.4.3 prompt set');
  for (const promptFile of promptFiles) {
    const text = fs.readFileSync(path.join(repoRoot, promptFile), 'utf8');
    const frontMatter = parseFrontMatter(text);
    assert.ok(frontMatter, `missing front matter for ${promptFile}`);
    const requiredFields = promptFile.endsWith('/00_global_style_lock.md')
      ? ['id', 'model', 'scope', 'status']
      : ['id', 'model', 'surface', 'status'];
    requiredFields.forEach((field) => {
      assert.ok(Object.prototype.hasOwnProperty.call(frontMatter, field), `missing ${field} in ${promptFile}`);
    });
    assert.equal(frontMatter.model, 'gpt-image-2');
  }
});
