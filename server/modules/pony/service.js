// Pony Express v0: inbox + sealed notes (plaintext today, forward-compatible with ciphertext).

const MAYOR_HOUSE_ID = 'npc_mayor';

function nowIso() {
  return new Date().toISOString();
}

function makeInboxMsg({ toHouseId, fromHouseId = null, body, status = 'request', kind = 'msg.chat' }) {
  const id = `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  return {
    id,
    version: 1,
    kind,
    toHouseId,
    fromHouseId,
    // Forward-compatible: treat as ciphertext even if plaintext today.
    ciphertext: String(body || ''),
    createdAt: nowIso(),
    status // request | accepted | rejected
  };
}

module.exports = {
  MAYOR_HOUSE_ID,
  makeInboxMsg
};

