const crypto = require('crypto');

function nowIso() {
  return new Date().toISOString();
}

function randomHex(bytes = 16) {
  return crypto.randomBytes(bytes).toString('hex');
}

// Human-copyable, unambiguous alphabet (no 0/O, 1/I).
const TEAM_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function createTeamCode() {
  const bytes = crypto.randomBytes(8);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += TEAM_ALPHABET[bytes[i] % TEAM_ALPHABET.length];
  }
  // Format: TEAM-XXXX-XXXX
  return `TEAM-${out.slice(0, 4)}-${out.slice(4, 8)}`;
}

function parseCookies(headerValue) {
  const out = {};
  if (!headerValue || typeof headerValue !== 'string') return out;
  const parts = headerValue.split(';');
  for (const p of parts) {
    const idx = p.indexOf('=');
    if (idx === -1) continue;
    const k = p.slice(0, idx).trim();
    const v = p.slice(idx + 1).trim();
    if (!k) continue;
    out[k] = decodeURIComponent(v);
  }
  return out;
}

function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const e = email.trim();
  if (!e || e.length > 254) return false;
  // Minimal, pragmatic validation.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

module.exports = {
  nowIso,
  randomHex,
  createTeamCode,
  parseCookies,
  isValidEmail
};
