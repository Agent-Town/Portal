# V1.4.5 Brain Vault Security Release Gate

Status: required before promoting Brain Vault restore to production default.

## Owner Identity

- Vault records are bound to account/wallet owner identity.
- Wrong account/wallet fetch and restore attempts fail closed.
- Session refresh cannot switch vault ownership silently.

## Ciphertext And Unlock Semantics

- Server stores ciphertext and safe metadata only.
- Unlock is explicit before restored Brain config can power Real Clover.
- Wrong passphrase and corrupted payload errors are recoverable and non-destructive.

## Redaction

- No plaintext API keys, tokens, provider secrets, Brain config, or vault material appears in logs, replay, recap, worker traffic, screenshots, analytics, or test artifacts.

## KDF Posture

- KDF parameters are versioned.
- Migration plan exists before changing KDF/cipher parameters.
- Recovery UX explains passphrase loss without implying server-side recovery.

## Signoff

- `tests/brain_vault.test.js` passes.
- Browser restore Playwright passes in a fresh context.
- Security reviewer signs off before public release.
