# Privy Wallet Migration (TDD Spec for AI Developers)

Status: Proposed  
Owner: Web + API + QA  
Last updated: 2026-02-12

## 1) Objective

Replace all direct wallet usage with a Privy integration while preserving:

- minimal UX,
- human + agent co-op flow,
- session-cookie identity (`et_session`) and Team Code model,
- deterministic Playwright verification.

In short: anywhere the app currently uses a wallet, it must use Privy-backed wallet APIs instead of `window.solana` / `window.ethereum`.

## 2) Hard Constraints

1. Keep session identity unchanged:
   - No login/session coupling to Privy user IDs.
   - `et_session` + Team Code remain the only app identity system.
2. Keep UI minimal:
   - No extra dashboard-like onboarding.
   - Existing primary actions stay intact (`Connect wallet`, `Check wallet`, `Sign to unlock`, etc.).
3. Keep deterministic testing:
   - Every milestone is validated by Playwright.
   - Tests must run without external wallet extensions.
4. Privy-only frontend + migration-safe backend:
   - New wallet flows must be Privy-only in the client.
   - During migration, backend compatibility must allow existing houses to continue when users connect the same wallet via Privy.

## 3) Current Wallet Surface (Must Migrate)

Frontend wallet usage exists in:

- `public/app.js`
  - wallet connect/disconnect, house lookup, token verify
- `public/create.js`
  - wallet connect/sign for key wrap + house init unlock payload
- `public/house.js`
  - wallet connect/disconnect, house unlock, token verify for share, EVM signing for anchors, EVM provider for ERC-8004 mint
- `public/inbox.js`
  - wallet signing for legacy key-wrap recovery/decrypt
- `public/skill.md` and `public/skill_agent_solo.md`
  - wallet instructions
- wallet-oriented Playwright specs in `e2e/`

Backend wallet logic exists in:

- `server/index.js`
  - `/api/wallet/nonce`, `/api/wallet/lookup`
  - `/api/token/nonce`, `/api/token/verify`
  - house init unlock shape + wallet lookup matching
  - anchor EVM signature verification

## 4) Target Architecture

## 4.1 Wallet Adapter Boundary

Add a single browser adapter module (example path: `public/wallet_client.js`) and route all wallet operations through it.

Required interface:

```js
initWalletClient()
connect({ chain, silent })
disconnect({ chain })
getAddress({ chain })
signMessage({ chain, message })   // returns canonical bytes or hex, normalized by adapter
getEvmProvider()                  // for Agent0 SDK
on(event, handler)                // disconnect/accountChanged
off(event, handler)
```

Rules:

- App code must not call `window.solana` or `window.ethereum` directly.
- Adapter is the only place allowed to touch Privy SDK APIs.
- Adapter normalizes signatures and address formats for existing server contracts.

## 4.2 Chain Responsibilities

- Solana chain via Privy:
  - house lookup signature
  - token verify signature
  - house unlock/key-wrap flows
  - legacy inbox key-wrap recovery
- EVM chain via Privy:
  - anchor link `personal_sign` flow
  - Agent0 SDK provider for ERC-8004 mint

## 4.3 Migration Rules (Same-Wallet Continuity)

There is no automatic background conversion of old wallet records.

Canonical new unlock shape:

```json
{
  "kind": "wallet-signature",
  "provider": "privy",
  "chain": "solana",
  "address": "<base58>"
}
```

Legacy shape that already exists in store:

```json
{ "kind": "solana-wallet-signature", "address": "<base58>" }
```

Required migration behavior:

1. Frontend uses Privy only.
2. Backend wallet lookup/unlock matching accepts both record shapes during migration.
3. If a user connects the same wallet address in Privy, existing house lookup/unlock must continue to work.
4. If a user connects a different wallet, system returns explicit rebind/recovery errors (no silent fallback).

Optional post-migration cleanup (separate release):

1. Add one-time rebind flow or migration script to rewrite legacy unlock metadata.
2. After measurable adoption, remove legacy shape support with a planned deprecation date.

## 4.4 Configuration

Privy public config must be injected without adding a framework:

- server-served config endpoint or inline config script,
- test-safe fallback (`window.__PRIVY_MOCK__`) for Playwright.

Do not require real Privy keys in tests.

## 5) TDD Delivery Plan (Milestones)

Use strict Red -> Green -> Refactor in each milestone:

1. add/modify tests,
2. run only impacted tests,
3. implement minimal code to pass,
4. run milestone regression set,
5. continue.

## M0 - Test Harness + Adapter Skeleton

Goal: deterministic Privy mocking foundation before feature changes.

Deliver:

- `e2e/helpers/privy_mock.js` (single canonical mock installer),
- adapter skeleton file with test hook support (`window.__PRIVY_MOCK__`).

Exit criteria:

- new harness test passes,
- no feature behavior changes yet.

## M1 - Landing Page Wallet + Token Verify

Scope:

- migrate `public/app.js` wallet flows to adapter,
- preserve token-gated solo flow behavior.

Regression focus:

- team code flow unchanged,
- token verification states unchanged.

## M2 - Create + House Unlock Path

Scope:

- migrate `public/create.js` and `public/house.js` wallet calls to adapter,
- keep house init + unlock semantics stable.

Regression focus:

- co-op house creation works,
- token solo house creation works,
- unlock still gates descriptor/erc8004 panels.

## M3 - Reconnect + Shared-Device Safety

Scope:

- account change/disconnect handling via adapter events,
- session reset behavior preserved.

Regression focus:

- disconnect resets session where currently expected,
- reconnect panel behavior preserved.

## M4 - Inbox Legacy Recovery Path

Scope:

- migrate `public/inbox.js` signature/recovery to adapter,
- preserve wrapped-key recovery compatibility for pre-Privy houses when the same wallet is connected in Privy.

Regression focus:

- E2EE read still works,
- no direct legacy provider calls remain in inbox flow.

## M5 - EVM Flows (Anchors + ERC-8004)

Scope:

- migrate EVM signing/provider usage in `public/house.js` to Privy,
- preserve anchor register and mint behavior.

Regression focus:

- anchor publish/resolve works,
- ERC-8004 mint UI path still works with mocked SDK/provider.

## M6 - Contract + Docs + Guardrails

Scope:

- update `specs/02_api_contract.md` for Privy-backed wallet behavior,
- update `public/skill.md` and `public/skill_agent_solo.md` wording,
- add guard test ensuring no direct wallet globals in app code.

Regression focus:

- full suite green (`npm test`),
- docs reflect actual behavior.

## 6) Playwright Test Matrix (One Clear Goal Per Test)

Use these IDs in test titles for traceability.

## PV-001 - Home connect/disconnect via Privy

- File: `e2e/29_privy_home_connect.spec.js`
- Goal: wallet connection state on `/` is controlled through Privy adapter.
- Setup: install Privy mock with deterministic Solana address.
- Assertions:
  - clicking `Connect wallet` changes button text to `Disconnect wallet`,
  - `#walletAddr` equals mocked address,
  - clicking `Disconnect wallet` returns button text to `Connect wallet`.

## PV-002 - Token verify success via Privy signer

- File: `e2e/30_privy_token_verify_success.spec.js`
- Goal: human token verification succeeds using Privy-backed Solana signing.
- Assertions:
  - `Check wallet` results in `token-status` text `Verified`,
  - `Create house` link becomes visible.

## PV-003 - Token verify failure mapping

- File: `e2e/31_privy_token_verify_failure.spec.js`
- Goal: signature/format errors still map to deterministic user-facing error states.
- Assertions:
  - failed verify shows `Check failed`,
  - error message is non-empty and specific (not raw stack).

## PV-004 - Co-op house generation with Privy wallet

- File: `e2e/32_privy_create_house_coop.spec.js`
- Goal: co-op create flow can generate a house using Privy wallet signatures.
- Assertions:
  - flow reaches `/house?house=...`,
  - created house has retrievable metadata,
  - share creation endpoint returns `ok: true`.

## PV-005 - Token solo house generation with Privy wallet

- File: `e2e/33_privy_create_house_token.spec.js`
- Goal: token-holder solo path remains functional with Privy.
- Assertions:
  - token verify -> create -> house URL works end-to-end,
  - house unlock action is available.

## PV-006 - House unlock via Privy signer

- File: `e2e/34_privy_house_unlock.spec.js`
- Goal: unlock gate works with Privy-backed signature.
- Assertions:
  - `Sign to unlock` transitions to unlocked state,
  - descriptor/ERC-8004 toggle visibility matches existing behavior.

## PV-007 - Reconnect lookup via Privy wallet identity

- File: `e2e/35_privy_reconnect_lookup.spec.js`
- Goal: reconnect panel correctly resolves existing house by Privy wallet address.
- Assertions:
  - reconnect panel visible after connect,
  - `Open house` and House nav target correct `houseId`.

## PV-008 - House disconnect resets session (shared device)

- File: `e2e/36_privy_disconnect_house_reset.spec.js`
- Goal: disconnect on unlocked house resets to a fresh session.
- Assertions:
  - redirected to `/`,
  - new team code differs from prior code.

## PV-009 - Home disconnect clears token-verified state

- File: `e2e/37_privy_disconnect_home_reset.spec.js`
- Goal: disconnect on landing page clears token verification state.
- Assertions:
  - token status hidden after reset,
  - `Create house` link hidden,
  - team code rotates.

## PV-010 - Inbox nav stability after reload/lock

- File: `e2e/38_privy_inbox_nav_visibility.spec.js`
- Goal: inbox navigation remains stable for current house after reload and lock.
- Assertions:
  - Inbox link remains visible and points to same `houseId` before and after reload,
  - link persists after `Lock (wipe key)`.

## PV-011 - Inbox recovery via Privy signer

- File: `e2e/39_privy_inbox_legacy_recovery.spec.js`
- Goal: wrapped-key decrypt path works through Privy signer APIs.
- Assertions:
  - encrypted message is displayed as decrypted content,
  - pre-Privy wrapped keys are recoverable when Privy connects the same wallet address.

## PV-012 - Anchor registration via Privy EVM signing

- File: `e2e/40_privy_anchor_register.spec.js`
- Goal: anchor link publishing uses Privy EVM signing and remains server-verifiable.
- Assertions:
  - `Sign + link` succeeds,
  - `/api/anchors/resolve` returns expected `houseId`.

## PV-013 - ERC-8004 mint path via Privy EVM provider

- File: `e2e/41_privy_erc8004_mint.spec.js`
- Goal: mint flow can run with Privy-provided EVM provider + mocked Agent0 SDK.
- Assertions:
  - mint action reaches confirmed status text,
  - generated agent id is rendered in UI status.

## PV-014 - No direct wallet globals outside adapter

- File: `e2e/42_privy_no_direct_wallet_globals.spec.js`
- Goal: enforce architecture boundary preventing regressions.
- Assertions:
  - search over `public/` finds no `window.solana`/`window.ethereum` references outside adapter files and test mocks.

## PV-015 - API contract doc updated for Privy

- File: `e2e/43_privy_api_contract_docs.spec.js`
- Goal: shipped docs match implemented contract.
- Assertions:
  - `specs/02_api_contract.md` references Privy-backed wallet behavior,
  - migration compatibility behavior is documented (same-wallet continuity + no background auto-migration).

## PV-016 - Skill docs updated for Privy instructions

- File: `e2e/44_privy_skill_docs.spec.js`
- Goal: agent instructions reflect Privy-first wallet flow.
- Assertions:
  - `public/skill.md` and `public/skill_agent_solo.md` mention Privy-based connection steps,
  - obsolete “direct Phantom/MetaMask-only” instructions are removed.

## PV-017 - Existing house unlocks after Privy migration (same wallet)

- File: `e2e/45_privy_existing_house_same_wallet.spec.js`
- Goal: a house created with legacy unlock metadata remains unlockable after Privy migration when the same wallet address is used.
- Assertions:
  - pre-seeded legacy house is discovered by wallet lookup,
  - unlock succeeds with Privy signing,
  - house read/write endpoints remain accessible after unlock.

## 7) Definition of Done

All of the following must be true:

1. Wallet flows in `public/app.js`, `public/create.js`, `public/house.js`, and `public/inbox.js` are adapter-based and Privy-backed.
2. All PV tests pass plus existing regressions:
   - `npm test`
3. `specs/02_api_contract.md` is updated to match implementation.
4. `/skill.md` and `/skill_agent_solo.md` are accurate and readable.
5. Session-token identity model is unchanged (`et_session` + Team Code).

## 8) Implementation Notes for AI Developers

1. Migrate tests first, not app code first.
2. Keep one shared Privy mock helper to avoid drift.
3. Do not mix provider-specific logic into page files.
4. Keep error taxonomy stable where possible (`BAD_SIGNATURE`, `NONCE_MISMATCH`, etc.).
5. Keep UI copy changes minimal and test-driven.

## 9) Decisions Locked

Resolved decisions:

1. Migration compatibility: yes, for existing records when users connect the same wallet in Privy.
2. Privy mandatory for both Solana and EVM flows: yes.
3. User-facing docs stay Privy-first; legacy details belong in API/spec docs only.
