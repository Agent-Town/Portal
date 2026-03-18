/**
 * Sandbox Snapshots — server-side storage for WebContainer zip exports.
 *
 * Snapshots are binary blobs too large for JSON experiment cards.
 * Stored in-memory with SHA-256 content addressing.
 *
 * Routes:
 *   POST /api/sandbox/snapshot           — store a zip snapshot (binary body)
 *   GET  /api/sandbox/snapshot/:id       — retrieve snapshot by ID
 *   GET  /api/sandbox/snapshot/:id/meta  — metadata only (no binary)
 */

const { Router } = require('express');
const crypto = require('crypto');

const router = Router();

// ── In-memory store ─────────────────────────────────────────
/** @type {Map<string, { id: string, contentHash: string, size: number, createdAt: string, problemStoryId: string, cardId: string, data: Buffer }>} */
const snapshots = new Map();

function sha256hex(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

// ── Routes ──────────────────────────────────────────────────

// POST /api/sandbox/snapshot — store a zip snapshot
// Content-Type: application/octet-stream (raw binary body)
// Headers: x-problem-story-id, x-card-id (optional metadata)
router.post('/snapshot', (req, res) => {
  const chunks = [];
  const maxSize = 50 * 1024 * 1024; // 50 MB limit
  let totalSize = 0;

  req.on('data', (chunk) => {
    totalSize += chunk.length;
    if (totalSize > maxSize) {
      res.status(413).json({ ok: false, error: 'SNAPSHOT_TOO_LARGE', maxBytes: maxSize });
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });

  req.on('end', () => {
    if (res.headersSent) return;
    const data = Buffer.concat(chunks);

    if (data.length < 4) {
      return res.status(400).json({ ok: false, error: 'EMPTY_SNAPSHOT' });
    }

    // Validate zip header (PK magic bytes)
    if (data[0] !== 0x50 || data[1] !== 0x4B) {
      // Allow non-zip for fallback sandbox (JSON blobs)
      // but mark content_type accordingly
    }

    const contentHash = `sha256:${sha256hex(data)}`;
    const id = crypto.randomUUID();
    const problemStoryId = typeof req.headers['x-problem-story-id'] === 'string'
      ? req.headers['x-problem-story-id'].trim() : '';
    const cardId = typeof req.headers['x-card-id'] === 'string'
      ? req.headers['x-card-id'].trim() : '';

    const isZip = data[0] === 0x50 && data[1] === 0x4B;

    snapshots.set(id, {
      id,
      contentHash,
      contentType: isZip ? 'application/zip' : 'application/octet-stream',
      size: data.length,
      createdAt: new Date().toISOString(),
      problemStoryId,
      cardId,
      data,
    });

    res.status(201).json({
      ok: true,
      id,
      contentHash,
      contentType: isZip ? 'application/zip' : 'application/octet-stream',
      size: data.length,
    });
  });

  req.on('error', () => {
    if (!res.headersSent) {
      res.status(500).json({ ok: false, error: 'UPLOAD_ERROR' });
    }
  });
});

// GET /api/sandbox/snapshot/:id — retrieve binary snapshot
router.get('/snapshot/:id', (req, res) => {
  const snap = snapshots.get(req.params.id);
  if (!snap) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });

  res.setHeader('Content-Type', snap.contentType);
  res.setHeader('Content-Length', snap.size);
  res.setHeader('Content-Disposition', `attachment; filename="snapshot-${snap.id.slice(0, 8)}.zip"`);
  res.setHeader('X-Content-Hash', snap.contentHash);
  res.send(snap.data);
});

// GET /api/sandbox/snapshot/:id/meta — metadata only
router.get('/snapshot/:id/meta', (req, res) => {
  const snap = snapshots.get(req.params.id);
  if (!snap) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });

  res.json({
    ok: true,
    id: snap.id,
    contentHash: snap.contentHash,
    contentType: snap.contentType,
    size: snap.size,
    createdAt: snap.createdAt,
    problemStoryId: snap.problemStoryId,
    cardId: snap.cardId,
  });
});

// ── Library item bridge ──────────────────────────────────────
// Store a snapshot as a library-style item with lineage tracking.

/** @type {Map<string, object>} */
const libraryItems = new Map();

router.post('/snapshot/:id/publish', (req, res) => {
  const snap = snapshots.get(req.params.id);
  if (!snap) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });

  const parentArtifactId = typeof req.body?.parentArtifactId === 'string'
    ? req.body.parentArtifactId.trim() : null;
  const problemDescription = typeof req.body?.problemDescription === 'string'
    ? req.body.problemDescription.slice(0, 500) : '';
  const convergenceScore = typeof req.body?.convergenceScore === 'number'
    ? req.body.convergenceScore : 0;
  const entrypoint = typeof req.body?.entrypoint === 'string'
    ? req.body.entrypoint.slice(0, 200) : 'src/index.ts';

  const itemId = crypto.randomUUID();
  const item = {
    id: itemId,
    type: 'sandbox_snapshot',
    content_type: snap.contentType,
    content_hash: snap.contentHash,
    snapshotId: snap.id,
    size: snap.size,
    createdAt: new Date().toISOString(),
    metadata: {
      problemDescription,
      convergenceScore,
      entrypoint,
      parentArtifactId,
      problemStoryId: snap.problemStoryId || '',
      iterationTrace: null,
    },
  };

  libraryItems.set(itemId, item);
  res.status(201).json({ ok: true, item });
});

// GET /api/sandbox/library — list all library items
router.get('/library', (_req, res) => {
  const items = Array.from(libraryItems.values())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ ok: true, items });
});

// GET /api/sandbox/library/:id — single item
router.get('/library/:id', (req, res) => {
  const item = libraryItems.get(req.params.id);
  if (!item) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  res.json({ ok: true, item });
});

// GET /api/sandbox/library/:id/lineage — fork genealogy
router.get('/library/:id/lineage', (req, res) => {
  const chain = [];
  let currentId = req.params.id;
  const seen = new Set();

  while (currentId && !seen.has(currentId)) {
    seen.add(currentId);
    const item = libraryItems.get(currentId);
    if (!item) break;
    chain.unshift(item.id);
    currentId = item.metadata?.parentArtifactId || null;
  }

  if (chain.length === 0) {
    return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  }

  res.json({ ok: true, lineage: chain });
});

module.exports = {
  sandboxSnapshotRouter: router,
  _resetStore: () => { snapshots.clear(); libraryItems.clear(); },
};
