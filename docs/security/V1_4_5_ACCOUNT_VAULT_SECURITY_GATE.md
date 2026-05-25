---
schemaVersion: "agent-town-account-vault-security-gate-v1"
title: "V1.4.5 Account Vault Security Gate"
status: "baseline implemented for account/wallet Brain vault restore"
date: "2026-05-24"
---

# V1.4.5 Account Vault Security Gate

V1.4.5 now has a conservative baseline for Brain vault and agent backup restore.
This resolves the minimum gate for same-account restore, but it does **not** approve
persistent/off-session Foreman execution by itself.

The selected implementation model is:

- vault mode: zero-knowledge-style passphrase vault;
- encryption boundary: Brain secrets are encrypted in the browser with WebCrypto AES-GCM before upload;
- server storage: ciphertext, safe metadata, and safe agent backup summaries only;
- unlock semantics: restored Brain config is written back to browser-local OpenClaw Lite state only after explicit player unlock;
- account binding: vault records are keyed by account/wallet scope hash; wrong wallet/account sees no vault metadata.

Persistent Real Clover remains a later V2 boundary because off-session execution
needs leases, approvals, revocation, and audit receipts on top of this restore baseline.

## Required Decisions

1. Vault mode:
   - selected baseline: zero-knowledge-style passphrase vault.
2. Encryption boundary:
   - encrypted client-side: Brain provider/model secret payload and restore payload;
   - server decrypts nothing;
   - account/wallet continuity authorizes vault fetch by deriving a server-side owner hash from the current wallet/house/session scope.
3. Secret handling:
   - no plaintext Brain secrets in server storage;
   - no plaintext Brain secrets in logs;
   - no plaintext Brain secrets in screenshots;
   - no plaintext Brain secrets in replay/recap/events.
4. Unlock semantics:
   - restored Brain config does not power Real Clover until explicit user unlock/confirmation;
   - restored agent backup does not auto-act.
5. Wrong-account behavior:
   - another account/wallet cannot fetch, infer, or unlock a vault.

## Required Tests

- Ciphertext-only storage test.
- Redacted logs test.
- Wrong-wallet denial test.
- Fresh-browser restore test.
- Explicit unlock-before-Clover-acts test.
- Agent backup roundtrip and schema migration test.
- Manual play still works if vault restore fails.

## Implementation Evidence

- Server API: `server/brain_vault.js`, mounted from `server/index.js`.
- Browser encryption/restore: `public/openclaw-lite/brain-vault-library.js`.
- Founders Plot restore prompt: `public/experiences/founders-plot/app.js`.
- Store table: `brainVaults` in `server/store.js`.
- Unit coverage: `tests/brain_vault.test.js`.
- Browser coverage: `e2e/225_founders_plot_v145_brain_vault_restore.spec.js`.
