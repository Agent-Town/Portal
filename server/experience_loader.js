// Experience Loader
//
// Discovers experience manifests from public/experiences/<name>/manifest.json
// and serves them via GET /api/experiences for client-side auto-registration.
//
// Server-side route mounting remains manual in index.js because each
// experience has unique dependency injection needs. The loader handles
// the client-facing config that was previously hardcoded in app.js.

const fs = require('fs');
const path = require('path');

const EXPERIENCES_DIR = path.join(__dirname, '..', 'public', 'experiences');

const REQUIRED_FIELDS = ['name', 'title', 'embedPath', 'routePrefix'];

function discoverExperiences() {
  if (!fs.existsSync(EXPERIENCES_DIR)) return [];
  const entries = fs.readdirSync(EXPERIENCES_DIR, { withFileTypes: true });
  const experiences = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(EXPERIENCES_DIR, entry.name, 'manifest.json');
    if (!fs.existsSync(manifestPath)) continue;
    try {
      const raw = fs.readFileSync(manifestPath, 'utf8');
      const manifest = JSON.parse(raw);
      const missing = REQUIRED_FIELDS.filter((f) => !manifest[f]);
      if (missing.length) {
        console.warn(`Experience ${entry.name}: manifest missing fields: ${missing.join(', ')}`);
        continue;
      }
      if (manifest.name !== entry.name) {
        console.warn(`Experience ${entry.name}: manifest name "${manifest.name}" does not match directory`);
        continue;
      }
      experiences.push({
        name: String(manifest.name),
        title: String(manifest.title),
        parentDistrict: String(manifest.parentDistrict || ''),
        entryLabel: String(manifest.entryLabel || manifest.title),
        entryPrimary: !!manifest.entryPrimary,
        secondaryLinks: Array.isArray(manifest.secondaryLinks) ? manifest.secondaryLinks : [],
        embedPath: String(manifest.embedPath),
        routePrefix: String(manifest.routePrefix),
        theme: manifest.theme && typeof manifest.theme === 'object' ? {
          borderColor: String(manifest.theme.borderColor || ''),
          rivetCore: String(manifest.theme.rivetCore || ''),
          rivetMid: String(manifest.theme.rivetMid || ''),
          rivetEdge: String(manifest.theme.rivetEdge || ''),
        } : null,
      });
    } catch (err) {
      console.warn(`Experience ${entry.name}: failed to parse manifest: ${err.message}`);
    }
  }
  return experiences;
}

function registerExperienceRoutes(app) {
  const experiences = discoverExperiences();
  console.log(`Discovered ${experiences.length} experience(s): ${experiences.map((e) => e.name).join(', ') || 'none'}`);

  app.get('/api/experiences', (_req, res) => {
    res.json({ ok: true, data: experiences });
  });

  return experiences;
}

module.exports = { discoverExperiences, registerExperienceRoutes };
