const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');

const EXPERIENCES_DIR = path.join(process.cwd(), 'public', 'experiences');

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function safeReadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function loadExperienceRegistry() {
  if (!fs.existsSync(EXPERIENCES_DIR)) return [];
  const entries = fs.readdirSync(EXPERIENCES_DIR, { withFileTypes: true });
  const registry = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(EXPERIENCES_DIR, entry.name, 'manifest.json');
    if (!fs.existsSync(manifestPath)) continue;
    const raw = fs.readFileSync(manifestPath, 'utf8');
    const manifest = safeReadJson(manifestPath);
    if (!manifest || typeof manifest !== 'object') continue;
    registry.push({
      id: String(manifest.id || entry.name),
      slug: entry.name,
      name: String(manifest.name || entry.name),
      kind: String(manifest.kind || 'experience'),
      route: String(manifest.route || `/experiences/${entry.name}/`),
      modalRoute: String(manifest.modalRoute || manifest.route || `/experiences/${entry.name}/`),
      version: String(manifest.version || '0.0.0'),
      summary: String(manifest.summary || ''),
      manifest,
      manifestHash: sha256(raw)
    });
  }
  registry.sort((a, b) => a.name.localeCompare(b.name));
  return registry;
}

function createExperiencesRouter() {
  const router = express.Router();
  router.get('/', (_req, res) => {
    res.json({
      ok: true,
      experiences: loadExperienceRegistry()
    });
  });
  return router;
}

module.exports = {
  createExperiencesRouter,
  loadExperienceRegistry
};
