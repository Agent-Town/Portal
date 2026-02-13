const fs = require('fs');
const path = require('path');

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  const exportPrefix = 'export ';
  const normalized = trimmed.startsWith(exportPrefix) ? trimmed.slice(exportPrefix.length) : trimmed;
  const eq = normalized.indexOf('=');
  if (eq <= 0) return null;

  const key = normalized.slice(0, eq).trim();
  if (!key || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return null;

  let value = normalized.slice(eq + 1).trim();
  if (!value) return { key, value: '' };

  const quoted = (value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"));
  if (quoted) {
    const quote = value[0];
    value = value.slice(1, -1);
    if (quote === '"') {
      value = value.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t');
    }
    return { key, value };
  }

  const comment = value.indexOf(' #');
  if (comment >= 0) value = value.slice(0, comment).trim();
  return { key, value };
}

function loadEnvFile(filePath, lockedKeys = new Set()) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    const parsed = parseEnvLine(line);
    if (!parsed) continue;
    if (lockedKeys.has(parsed.key)) continue;
    process.env[parsed.key] = parsed.value;
  }
}

function loadDotEnv(cwd = process.cwd()) {
  const envName = process.env.NODE_ENV ? String(process.env.NODE_ENV).trim() : '';
  const files = ['.env'];
  if (envName) files.push(`.env.${envName}`);
  files.push('.env.local');
  if (envName) files.push(`.env.${envName}.local`);
  const lockedKeys = new Set(Object.keys(process.env));

  for (const fileName of files) {
    loadEnvFile(path.join(cwd, fileName), lockedKeys);
  }
}

module.exports = {
  loadDotEnv
};
