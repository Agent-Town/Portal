# Phase 7 Execution Plan - Pony Inbox E2EE

Status: Active
Last updated: 2026-02-11

## Delivery Strategy

Phase 7 is split into small PR-sized chunks so each merge is testable and low-risk.

Guiding constraints:
- Keep existing Pony tests green at every step.
- Keep UI minimal (no extra onboarding complexity).
- Preserve deterministic Playwright acceptance checks.

## PR Chunks

## PR-1 (this implementation)
Title: Pony inbox key bundle plumbing (no send-path breakage)

Scope:
- Add optional Pony inbox key bundle storage on house init endpoints.
- Add `POST /api/pony/keys/register` (house-auth) for existing houses.
- Extend `GET /api/pony/resolve` to return recipient Pony inbox public key metadata.
- Extend `GET /api/pony/inbox` to return receiver key-wrap metadata.
- Add Playwright coverage for key registration and metadata surfacing.

Acceptance:
- Existing Pony phase tests continue to pass.
- New key-registration test passes.

## PR-2
Title: Client key generation + registration on house creation

Scope:
- Generate Pony inbox keypair during house creation.
- Wrap private key with `K_root`-derived wrapping key.
- Submit key bundle in `/api/house/init` and `/api/agent/house/init` payloads.

Acceptance:
- New houses always expose `ponyInboxPub` from `/api/pony/resolve`.

## PR-3
Title: Encrypt on send (web + agent examples)

Scope:
- In inbox compose flow, resolve recipient key and encrypt locally.
- Add server-side validation for new E2EE envelope format (compat mode keeps plaintext accepted).
- Encrypt mayor welcome message path using the same envelope format when key exists.

Acceptance:
- New e2e verifies stored message does not contain plaintext for key-enabled houses.

## PR-4
Title: Decrypt on read + encrypted UX path

Scope:
- Decrypt inbox messages client-side using wrapped private key.
- Render plaintext only after successful decrypt.
- Explicit fallback label for legacy plaintext during migration.

Acceptance:
- New e2e verifies UI decrypts message for receiver.

## PR-5
Title: Cutover and hardening

Scope:
- Reject plaintext sends by policy flag, then default-on.
- Tighten payload limits, logging controls, and error taxonomy.
- Remove legacy plaintext rendering path after migration window.

Acceptance:
- Policy gate + cutover tests pass.
- No plaintext sent in normal client paths.

## Test Plan by Chunk

- PR-1: `e2e/21_pony_key_registration.spec.js` + selected regression specs.
- PR-2: existing house init tests + one new assertion on resolve metadata.
- PR-3: new encrypted-send spec + friends compose regression.
- PR-4: new decrypt-read spec + inbox nav regression.
- PR-5: policy enforcement + compatibility window tests.

## Rollback Strategy

Each PR keeps compatibility with prior stored data unless explicitly marked cutover.

If a PR regresses:
- Revert only that PR.
- Keep migration data fields (`ponyInbox`) additive and harmless.
