# V1.4.5 Brain Vault Security Release Gate

Status: required before promoting Brain Vault restore to production default.

Release status: `blocked_on_security` until every checklist section below has
test evidence and human security signoff.

## Owner Identity

- Vault records are bound to account/wallet owner identity.
- Wrong account/wallet fetch and restore attempts fail closed.
- Session refresh cannot switch vault ownership silently.
- Account/wallet ownership is enforced on every list, save, fetch, restore, and
  sealed-payload read.
- Local-session fallback cannot be confused with account-level vault restore.
- `includeSealed=1` is allowed only for the correct owner and only when the
  request path explicitly needs sealed ciphertext.

## Ciphertext And Unlock Semantics

- Server stores ciphertext and safe metadata only.
- Unlock is explicit before restored Brain config can power Real Clover.
- Wrong passphrase and corrupted payload errors are recoverable and non-destructive.
- Restored Brain config never starts Clover automatically.
- Vault unlock remains an explicit player action, separate from account login.
- Dev/preview restore can exist before release, but production copy must not
  market Brain Vault as account recovery until this gate passes.

## Redaction

- No plaintext API keys, tokens, provider secrets, Brain config, or vault material appears in logs, replay, recap, worker traffic, screenshots, analytics, or test artifacts.
- No plaintext secrets appear in server error objects, debug payloads, local
  event logs, replay/recap payloads, browser screenshots, or Playwright traces.

## KDF Posture

- KDF parameters are versioned.
- Migration plan exists before changing KDF/cipher parameters.
- Recovery UX explains passphrase loss without implying server-side recovery.

## Signoff

- `tests/brain_vault.test.js` passes.
- Browser restore Playwright passes in a fresh context.
- Wrong-owner `includeSealed=1` coverage passes.
- Explicit-unlock Real Clover coverage passes.
- Redaction audit covers logs, events, screenshots, replay, recap, worker
  traffic, and debug payloads.
- Security reviewer signs off before public release.
