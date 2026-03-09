#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const indexPath = path.join(repoRoot, 'server', 'index.js');
const ownerModules = {
  platform: path.join(repoRoot, 'server', 'platform_read_routes.js'),
  poker: path.join(repoRoot, 'server', 'poker_routes.js'),
  registry: path.join(repoRoot, 'server', 'registry_routes.js'),
  v1: path.join(repoRoot, 'server', 'platform_v1_routes.js'),
  web: path.join(repoRoot, 'server', 'web_routes.js'),
};

const directRoutePatterns = [
  { family: 'platform', regex: /^app\.(get|post)\('\/api\/platform\//m },
  { family: 'web', regex: /^app\.(get|post)\('\/api\/web\//m },
  { family: 'registry', regex: /^app\.(get|post)\('\/api\/registry\//m },
  { family: 'v1', regex: /^app\.(get|post)\('\/v1\//m },
  { family: 'poker', regex: /^app\.(get|post)\('\/api\/poker\//m },
];

const indexSource = fs.readFileSync(indexPath, 'utf8');
const failures = [];

for (const [family, modulePath] of Object.entries(ownerModules)) {
  if (!fs.existsSync(modulePath)) {
    failures.push({
      family,
      reason: 'OWNER_MODULE_MISSING',
      path: path.relative(repoRoot, modulePath),
    });
  }
}

for (const entry of directRoutePatterns) {
  if (entry.regex.test(indexSource)) {
    failures.push({
      family: entry.family,
      reason: 'DIRECT_ROUTE_REGISTRATION_FOUND',
      path: path.relative(repoRoot, indexPath),
    });
  }
}

if (failures.length > 0) {
  process.stderr.write(`${JSON.stringify({ ok: false, failures }, null, 2)}\n`);
  process.exit(1);
}

process.stdout.write(`${JSON.stringify({
  ok: true,
  owners: Object.fromEntries(
    Object.entries(ownerModules).map(([family, modulePath]) => [family, path.relative(repoRoot, modulePath)])
  ),
}, null, 2)}\n`);
