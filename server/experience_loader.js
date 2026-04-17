const fs = require('fs');
const path = require('path');

const EXPERIENCES_ROOT = path.join(process.cwd(), 'public', 'experiences');

function humanizeSlug(value) {
  return String(value || '')
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function normalizeManifest(raw, slug) {
  const manifest = raw && typeof raw === 'object' ? raw : {};
  const routePrefix = typeof manifest.routePrefix === 'string' && manifest.routePrefix.trim()
    ? manifest.routePrefix.trim()
    : `/${slug}`;
  const embedPath = typeof manifest.embedPath === 'string' && manifest.embedPath.trim()
    ? manifest.embedPath.trim()
    : `${routePrefix}?embed=1`;

  return {
    name: typeof manifest.name === 'string' && manifest.name.trim() ? manifest.name.trim() : slug,
    title: typeof manifest.title === 'string' && manifest.title.trim() ? manifest.title.trim() : humanizeSlug(slug),
    slug,
    parentDistrict: typeof manifest.parentDistrict === 'string' && manifest.parentDistrict.trim()
      ? manifest.parentDistrict.trim()
      : 'house',
    entryLabel: typeof manifest.entryLabel === 'string' && manifest.entryLabel.trim()
      ? manifest.entryLabel.trim()
      : `Open ${humanizeSlug(slug)}`,
    entryPrimary: manifest.entryPrimary === true,
    routePrefix,
    embedPath,
    theme: manifest.theme && typeof manifest.theme === 'object' ? manifest.theme : {}
  };
}

function listExperiences() {
  if (!fs.existsSync(EXPERIENCES_ROOT)) return [];
  const entries = fs.readdirSync(EXPERIENCES_ROOT, { withFileTypes: true });
  const manifests = [];
  for (const entry of entries) {
    if (!entry || !entry.isDirectory()) continue;
    const slug = String(entry.name || '').trim();
    if (!slug) continue;
    const manifestPath = path.join(EXPERIENCES_ROOT, slug, 'manifest.json');
    if (!fs.existsSync(manifestPath)) continue;
    const parsed = readJsonFile(manifestPath);
    if (!parsed) continue;
    manifests.push(normalizeManifest(parsed, slug));
  }
  return manifests.sort((a, b) => {
    if (a.entryPrimary !== b.entryPrimary) return a.entryPrimary ? -1 : 1;
    return String(a.title || '').localeCompare(String(b.title || ''));
  });
}

module.exports = {
  listExperiences
};
