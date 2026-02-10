# Modularization spec (extractable modules)

Goal: make **Houses** and **Pony Express** reusable and swappable across apps while keeping this repo:
- minimal UI (single-purpose)
- human + agent co-op gating intact
- session-cookie + Team Code identity (no external auth providers)
- deterministic and verifiable with **Playwright** at every step

This spec is written so an AI developer agent can implement it via a strict TDD loop.

---

## Definitions

- **Host app**: the current landing page app (this repo).
- **Module**: a cohesive subsystem that can be moved to another repo with minimal edits.
- **Composition root**: the file that wires dependencies and mounts routers. In this repo: `server/index.js`.
- **Port**: a small interface the host provides to a module (dependency injection) so the module does not import host internals.
- **Adapter**: an implementation of a port (e.g. SQLite-backed adapter using `server/store.js`).

---

## Invariants (must not break)

1. The existing public routes and API endpoints remain stable unless explicitly versioned.
2. `/skill.md` stays correct and readable.
3. No new identity providers; no real API keys.
4. `npm test` (Playwright) is the source of truth.

---

## Target Architecture (end state)

### Server layout

`server/index.js` becomes a thin composition root:
- security headers + rate limit middleware
- create/store/sessions adapters
- mount routers from modules

New module folders (in-repo first):
```
server/modules/
  houses/
    router.js
    service.js
    ports.js
    README.md
  pony/
    router.js
    service.js
    ports.js
    README.md
```

Later (optional), these folders can be moved to separate repos or published packages with minimal changes.

### Module design rules

Each module:
- exports `createRouter(deps)` (pure factory; no side effects on import)
- does **not** `require('../store')` or `require('../sessions')` directly
- depends only on ports passed by the host (plain JS objects with functions)
- has a README describing integration (what to pass to `createRouter`)

---

## Module: Houses

### Scope

Server-side only:
- house container creation (`/api/house/init`, `/api/agent/house/init`)
- house-authenticated API (`/api/house/:id/*`)
- wallet lookup for recovery (`/api/wallet/*`)
- share endpoints that are house-authenticated (`/api/house/:id/share`, `/api/house/:id/posts`)

Client-side code (`public/create.js`, `public/house.js`) is a **reference UI** and can remain in the host app initially.

### Contract (must remain compatible)

The API contract is defined in `specs/02_api_contract.md` under **Houses** and **Wallet House Recovery**.
Extraction must not change:
- `x-house-auth` signing format
- skew window behavior
- keyMode restrictions (`ceremony` only)

### Ports (dependency injection)

`Houses` module requires these ports from the host:

`houseStorePort`:
- `getHouse(houseId) -> house | null`
- `insertHouse(houseRecord) -> void`
- `appendHouseEntry(houseId, entryRecord) -> void`
- `setHousePublicMedia(houseId, media | null) -> void`
- `findHousesByUnlockAddress(address) -> house[]`

`shareStorePort` (only if the module owns house-auth share routes):
- `findShareByHouseId(houseId) -> share | null`
- `insertShare(shareRecord) -> void`
- `ensurePublicTeamForShare(shareRecord, sessionOrNull) -> void`

`sessionsPort`:
- `getSessionByTeamCode(teamCode) -> session | null`
- `getSessionByHouseId(houseId) -> session | null`
- `indexHouseId(session, houseId) -> void`

Notes:
- In the first extraction pass, adapters can implement these via `readStore()` / `writeStore()` and existing session helpers.
- The key requirement is: **the module imports none of those files directly**.

---

## Module: Pony Express (v0)

### Scope

Pony Express v0 is an inbox/message subsystem:
- send a message to a destination id
- list inbox for a destination id
- accept/reject messages (v0 has no auth; see “Hardening”)

### Contract (v0)

Endpoints (documented in `specs/02_api_contract.md` after this spec lands):
- `POST /api/pony/send`
- `GET /api/pony/inbox?houseId=...`
- `POST /api/pony/inbox/:id/accept`
- `POST /api/pony/inbox/:id/reject`

Message schema:
```json
{
  "id": "msg_...",
  "version": 1,
  "kind": "msg.chat",
  "toHouseId": "sh_...",
  "fromHouseId": "sh_...|npc_mayor|null",
  "ciphertext": "opaque string (plaintext in v0)",
  "createdAt": "ISO8601",
  "status": "request|accepted|rejected"
}
```

Behavior:
- `toHouseId` must exist (currently validated against share ids in the store).
- if `fromHouseId === "npc_mayor"`, message auto-accepts (`status = "accepted"`); otherwise `status = "request"`.

### Ports (dependency injection)

`ponyStorePort`:
- `insertMsg(msg) -> void`
- `listInbox(toHouseId) -> msg[]`
- `getMsgById(id) -> msg | null`
- `setMsgStatus(id, status) -> void`

`addressBookPort`:
- `destinationExists(toHouseId) -> boolean`

In the host app, `destinationExists` is implemented as “share id exists”. If another app wants messages addressed to house ids, they can swap this adapter.

### Hardening (future v1, not required for extraction)

Pony v0 endpoints are unauthenticated. A future v1 can:
- require house-auth headers (reuse Houses HMAC scheme)
- store only ciphertext produced client-side (true E2EE)
- move addressing from share ids to house ids (or explicit “mailbox ids”)

These are separate milestones after extraction; do not mix with refactors unless tests demand it.

---

## TDD Migration Plan (Playwright-verified milestones)

### MOD-0: Baseline

**Goal:** lock current behavior.
- Run `npm test` and ensure green before changes.

**Done when:**
- `npm test` passes.

### MOD-1: Spec + contract tests for Pony Express

**Goal:** freeze Pony v0 behavior before refactoring.

Changes:
- Update `specs/02_api_contract.md` with a Pony Express section.
- Add `e2e/13_pony_express.spec.js` covering:
  - creating a share link without unlocking the house (forces `/api/share/create`)
  - mayor welcome message appears in `/api/pony/inbox`
  - sending a message creates a `request`
  - accept/reject updates status

**Tests:**
- `npx playwright test e2e/13_pony_express.spec.js`

**Done when:**
- the new test passes reliably
- `npm test` still passes

### MOD-2: Extract Pony Express into `server/modules/pony/*`

**Goal:** no behavior change, only structure.

Changes:
- Move Pony-specific constants/helpers/routes out of `server/index.js` into:
  - `server/modules/pony/router.js` (Express router factory)
  - `server/modules/pony/service.js` (pure functions like `makeInboxMsg`)
  - `server/modules/pony/ports.js` (JSDoc describing required deps)
- `server/index.js` mounts the router and passes adapters:
  - `ponyStorePort` backed by `readStore/writeStore`
  - `addressBookPort` backed by existing share lookup

**Tests:**
- `npx playwright test e2e/13_pony_express.spec.js`
- `npm test`

**Done when:**
- all tests pass and Pony routes are absent from `server/index.js` (composition root only)

### MOD-3: Extract Houses API router into `server/modules/houses/*`

**Goal:** isolate Houses logic behind a router factory and ports.

Changes:
- Create `server/modules/houses/router.js` and move:
  - `/api/house/nonce`
  - `/api/house/init`
  - `/api/agent/house/init`
  - `/api/wallet/nonce`
  - `/api/wallet/lookup`
  - `/api/house/:id/*` (meta/descriptor/log/public-media/append)
  - `verifyHouseAuth`, `serializePublicMedia`, public media parsing helpers
- `server/index.js` mounts the router and passes ports/adapters.

**Tests:**
- `npm test` (existing e2e covers Houses heavily: 03, 04, 06, 07, 08, 09)

**Done when:**
- all tests pass and the Houses routes are absent from `server/index.js`

### MOD-4: Consolidate “ports” and remove hidden imports

**Goal:** ensure each module can be lifted out of the repo.

Changes:
- Ensure modules do not import:
  - `server/store.js`
  - `server/sessions.js`
  - host-only helpers from `server/index.js`
- Only `server/index.js` imports host internals and provides adapters.

**Tests:**
- `npm test`

**Done when:**
- `npm test` passes
- a code search shows no forbidden imports inside `server/modules/**`

### MOD-5 (optional): Client protocol extraction for Houses

**Goal:** reduce duplication and make “Houses web” reusable.

Changes:
- Extract shared browser-side house protocol code (HKDF/AES-GCM/HMAC headers/message builders) into `public/lib/houses_protocol.js`.
- Update `public/create.js` + `public/house.js` to use it.

**Tests:**
- `npm test`

**Done when:**
- `npm test` passes and duplicated protocol code is removed from the pages

---

## Definition of done (for the whole modularization effort)

- All Playwright tests pass (`npm test`).
- `server/index.js` is a composition root (wiring only).
- `server/modules/houses/*` and `server/modules/pony/*` can be moved to a new repo with minimal edits (ports are the seam).
- API contract is updated and consistent (`specs/02_api_contract.md`).
- `/skill.md` remains accurate (no endpoint drift).

