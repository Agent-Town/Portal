'use strict';

/**
 * Experience manifest loader + /api/experiences registry.
 *
 * This is the generalized piece from the poker-saloon-redesign branch,
 * scoped to Phase 1 to just discover Founders Plot (and any future experience
 * pack). It walks public/experiences/<name>/manifest.json and serves a
 * registry summary plus individual fetches.
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');

function loadManifests(root) {
  const out = [];
  let entries;
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch { return out; }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(root, entry.name);
    const file = path.join(dir, 'manifest.json');
    if (!fs.existsSync(file)) continue;
    try {
      const raw = fs.readFileSync(file, 'utf8');
      const manifest = JSON.parse(raw);
      const hash = crypto.createHash('sha256').update(raw).digest('hex');
      out.push({ name: entry.name, manifest, hash, source: file });
    } catch (err) {
      // Skip invalid manifests; register still returns.
    }
  }
  return out;
}

function createExperiencesRouter({ publicDir } = {}) {
  const root = path.join(publicDir || path.join(process.cwd(), 'public'), 'experiences');
  const router = express.Router();

  function readRegistry() {
    const items = loadManifests(root);
    return items.map(({ name, manifest, hash }) => ({
      name,
      title: manifest.title || name,
      parentDistrict: manifest.parentDistrict || null,
      entryLabel: manifest.entryLabel || null,
      entryPrimary: !!manifest.entryPrimary,
      routePrefix: manifest.routePrefix || `/${name}`,
      embedPath: manifest.embedPath || null,
      indexPath: manifest.indexPath || `/experiences/${name}/`,
      apiPrefix: manifest.apiPrefix || null,
      tools: manifest.tools || [],
      theme: manifest.theme || null,
      hash,
    }));
  }

  router.get('/', (_req, res) => {
    res.json({ ok: true, experiences: readRegistry() });
  });

  router.get('/:name', (req, res) => {
    const manifests = loadManifests(root);
    const hit = manifests.find((m) => m.name === req.params.name);
    if (!hit) {
      return res.status(404).json({ ok: false, error: { code: 'INVALID_STATE', message: 'Unknown experience.', retryable: false } });
    }
    res.json({ ok: true, name: hit.name, manifest: hit.manifest, hash: hit.hash });
  });

  return router;
}

module.exports = { loadManifests, createExperiencesRouter };
