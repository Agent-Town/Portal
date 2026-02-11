# Phase 7 - Pony Inbox E2EE Spec

Status: Proposed
Owner: Security Architecture + Application Architecture
Last updated: 2026-02-11

## 1) Objective

Upgrade Pony inbox so message payloads are end-to-end encrypted (E2EE) and readable only by parties that can recover house secrets (`K_root`) on the client side.

This spec covers:
- protocol and cryptography for Pony inbox messages,
- API and data model deltas,
- migration from plaintext envelopes,
- deterministic Playwright acceptance criteria.

## 2) Scope

In scope:
- `/api/pony/send`, `/api/pony/inbox`, `/api/pony/resolve` message path.
- Mayor welcome message path (must be encrypted too).
- House initialization payloads (`/api/house/init`, `/api/agent/house/init`) for inbox key registration.
- Inbox UI encrypt-on-send and decrypt-on-read.

Out of scope:
- Post-quantum cryptography (covered in separate spec).
- Multi-device sync UX.
- Group messaging or attachment encryption.

## 3) Security Goals

Primary goals:
1. Server store compromise does not reveal inbox plaintext.
2. Transport interception does not reveal plaintext.
3. Only holders of the target house's inbox private key can decrypt.
4. The inbox flow remains deterministic and testable with Playwright.

Secondary goals:
- Backward-compatible migration for existing houses.
- Keep API minimal and implementation lightweight.

## 4) Threat Model

Protected assets:
- Inbox message body plaintext.
- Sender/receiver privacy beyond routing metadata.

Trust boundaries:
- Browser/agent runtime is trusted after house unlock.
- Server is trusted for availability/routing but not for plaintext confidentiality.

Attacker assumptions covered:
- Reads database snapshots and logs.
- Reads in-transit payloads.

Not covered in this phase:
- Fully malicious server replacing recipient public keys (key transparency/signature binding is phase 8).
- Compromised unlocked endpoint memory.

## 5) Crypto Design (Phase 7)

### 5.1 Primitives

- Key agreement: ECDH P-256 (WebCrypto-native).
- KDF: HKDF-SHA-256.
- AEAD: AES-256-GCM.
- Randomness: `crypto.getRandomValues`.

Rationale: native browser support, no heavy runtime dependency, easy deterministic testing hooks.

### 5.2 House Inbox Key Material

Each house gets a dedicated Pony inbox encryption keypair:
- `ponyInboxPub`: recipient public key (SPKI, base64).
- `ponyInboxPrivWrap`: private key encrypted with a key derived from `K_root`.

New KDF label:
- `K_pony_wrap = HKDF-SHA256(K_root, info="elizatown-pony-inbox-wrap-v1", len=32)`.

`ponyInboxPrivWrap` format:
```json
{
  "alg": "AES-GCM",
  "iv": "<base64>",
  "ct": "<base64 pkcs8-bytes>"
}
```

### 5.3 Message Ciphertext Envelope

`ciphertext` for Pony messages becomes:

```json
{
  "alg": "PONY_E2EE_P256_AESGCM_V1",
  "epk": "<base64 spki ephemeral public key>",
  "iv": "<base64 12-byte nonce>",
  "ct": "<base64 ciphertext||tag>",
  "aad": "<base64 canonical aad json>"
}
```

Canonical AAD payload:
```json
{
  "v": 1,
  "kind": "msg.chat.v1",
  "fromHouseId": "<houseId|null>",
  "toHouseId": "<houseId>",
  "createdAt": "<ISO8601>"
}
```

Plaintext payload encrypted into `ct`:
```json
{
  "v": 1,
  "body": "<utf8 text>",
  "refs": [],
  "meta": {
    "client": "web|agent",
    "senderLabel": "optional"
  }
}
```

### 5.4 Key Agreement Per Message

Sender flow:
1. Resolve receiver and fetch `receiverPonyInboxPub`.
2. Generate ephemeral ECDH keypair.
3. Compute `Z = ECDH(ephemeralPriv, receiverPub)`.
4. Derive `K_msg = HKDF-SHA256(Z, info="elizatown-pony-msg-v1|from=<id>|to=<id>", len=32)`.
5. AES-GCM encrypt plaintext with random `iv` and canonical AAD.
6. Send envelope with `epk`, `iv`, `ct`, `aad`.

Receiver flow:
1. Recover/decrypt `ponyInboxPrivWrap` locally using `K_root`.
2. Import sender `epk` from message envelope.
3. Compute `Z = ECDH(receiverPriv, epk)`.
4. Derive same `K_msg` and decrypt `ct`.

## 6) API Contract Changes

## 6.1 House Init Extensions

### POST `/api/house/init`
### POST `/api/agent/house/init`

Add required fields for new houses:
```json
{
  "ponyInboxPub": "<base64 spki>",
  "ponyInboxPrivWrap": { "alg": "AES-GCM", "iv": "...", "ct": "..." }
}
```

Validation errors:
- `MISSING_PONY_INBOX_PUB`
- `MISSING_PONY_INBOX_PRIV_WRAP`
- `INVALID_PONY_INBOX_PUB`
- `INVALID_PONY_INBOX_PRIV_WRAP`

## 6.2 Resolve Endpoint Extension

### GET `/api/pony/resolve?houseId=...` or `?erc8004Id=...`

Extend response:
```json
{
  "ok": true,
  "houseId": "<base58>",
  "source": "house|share|anchor",
  "ponyInboxPub": "<base64 spki>",
  "ponyInboxKeyVersion": 1
}
```

If key missing:
- `PONY_KEY_UNAVAILABLE` (409)

## 6.3 Send Endpoint Rules

### POST `/api/pony/send`

New send rules:
- `ciphertext.alg` must be `PONY_E2EE_P256_AESGCM_V1`.
- `PLAINTEXT` send is rejected after migration cutoff.
- envelope fields `epk`, `iv`, `ct`, `aad` are required.

New errors:
- `PONY_CIPHERTEXT_REQUIRED`
- `INVALID_PONY_E2EE_ENVELOPE`
- `UNSUPPORTED_PONY_CIPHER`
- `RECEIVER_KEY_UNAVAILABLE`

## 6.4 Inbox Endpoint

### GET `/api/pony/inbox?houseId=...`

Extend response to include receiver key wrap for local decrypt:
```json
{
  "ok": true,
  "houseId": "<base58>",
  "inbox": ["..."],
  "ponyInboxPrivWrap": { "alg": "AES-GCM", "iv": "...", "ct": "..." },
  "ponyInboxKeyVersion": 1
}
```

Access remains house-auth protected.

## 6.5 Mayor Welcome Message

When server creates mayor message, it must encrypt to the recipient house `ponyInboxPub` using the same envelope format.

No server-side plaintext persistence is allowed.

## 7) Client Changes

### 7.1 `public/create.js`

- Generate `ponyInbox` keypair at house creation time.
- Wrap `ponyInbox` private key with `K_pony_wrap`.
- Submit `ponyInboxPub` and `ponyInboxPrivWrap` in house init request.

### 7.2 `public/house.js`

- After unlock, derive `K_pony_wrap` from recovered `K_root`.
- Store decrypt-capable in-memory object for inbox handoff (same tab/session).

### 7.3 `public/inbox.js`

- On send:
  - resolve recipient to get `ponyInboxPub`.
  - encrypt message body locally.
- On load:
  - decrypt each message locally using `ponyInboxPrivWrap`.
- Do not render raw `ct` except explicit debug mode.

## 8) Data Model Changes

House record additions:
```json
{
  "ponyInbox": {
    "version": 1,
    "pub": "<base64 spki>",
    "privWrap": { "alg": "AES-GCM", "iv": "...", "ct": "..." },
    "createdAt": "ISO8601"
  }
}
```

Message record:
- Keep `envelope.ciphertext` as authoritative.
- Do not persist `body` plaintext field.

## 9) Migration Strategy

### Stage A (compat read)
- Server accepts old plaintext and new encrypted messages.
- Client can decrypt new, still display old.

### Stage B (compat write removed)
- Clients send encrypted only.
- Server rejects plaintext sends with `UNSUPPORTED_PONY_CIPHER`.

### Stage C (cleanup)
- Remove plaintext compatibility rendering paths.
- Optional one-time migration script for historical plaintext records to remain as legacy unreadable artifacts or admin-redacted.

Existing houses missing keys:
- Add `POST /api/pony/keys/register` (house-auth) to attach `ponyInbox` keys post hoc.
- Sending to houses without keys returns `RECEIVER_KEY_UNAVAILABLE`.

## 10) Playwright Acceptance (Definition of Done)

Required new tests:
1. `e2e/21_pony_e2ee_send_receive.spec.js`
- A sends "hello" to B.
- Stored record does not contain plaintext body.
- B inbox UI decrypts and displays "hello".

2. `e2e/22_pony_e2ee_mayor.spec.js`
- Mayor message exists.
- Stored as E2EE envelope.
- House inbox UI decrypts mayor text.

3. `e2e/23_pony_e2ee_missing_key.spec.js`
- Send to house without `ponyInbox` key fails with `RECEIVER_KEY_UNAVAILABLE`.

4. Regression checks
- Existing pony phase tests still pass where semantics unchanged.

## 11) Operational Controls

- Never log decrypted payloads server-side.
- Add log scrubbing for `ciphertext.ct` in error traces.
- Add metric counters:
  - `pony.e2ee.send.ok`
  - `pony.e2ee.send.reject.plaintext`
  - `pony.e2ee.decrypt.fail`

## 12) Open Questions

1. Should receivers auto-reject unsigned sender metadata in phase 7, or defer sender authenticity hardening to phase 8?
2. Should legacy plaintext messages remain visible in UI after stage C?
3. Should encrypted payload size be capped per message to prevent abuse (recommended: 8 KB plaintext limit)?
