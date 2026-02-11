# Phase 8 - Quantum Resistance Roadmap

Status: Proposed
Owner: Security Architecture + Cryptography Architecture
Last updated: 2026-02-11

## 1) Objective

Define a separate, explicit roadmap to harden Pony and house cryptography against "harvest now, decrypt later" risk and long-term quantum threats.

This document is intentionally separate from Phase 7 E2EE so implementation can ship in controlled steps.

## 2) Current State Inventory

## 2.1 Components already strong enough for near term

- `K_root`-derived symmetric keys (`HKDF` + `AES-256-GCM`) remain comparatively resilient.
- House-auth HMAC (`HMAC-SHA-256`) is symmetric and not directly broken by Shor-style attacks.

## 2.2 Components not quantum-resistant

- Classical public-key agreement/signatures (ECDH/ECDSA/EdDSA/secp/curve-based wallets).
- Any inbox E2EE based solely on classical ECDH.

Operational implication:
- Confidentiality for archived traffic is at risk long-term if only classical KEM/ECDH is used.

## 3) Security Targets

1. Provide hybrid confidentiality for Pony inbox messages (classical + PQ).
2. Add cryptographic agility: versioned key suites and policy flags.
3. Add authenticity and anti-key-substitution controls for published inbox keys.
4. Preserve deterministic Playwright validation.

## 4) Architectural Principles

- Hybrid before pure-PQ: reduce migration risk by requiring both classical and PQ shared secrets.
- Crypto agility by design: every envelope carries explicit `alg` and `version`.
- No server private keys: server stores public material and ciphertext only.
- Minimal UI disruption: keep current unlock UX, add cryptographic upgrades behind protocol negotiation.

## 5) Target Cryptographic Profile

Recommended profile (phase 8 default):
- KEM (PQ): `ML-KEM-768`
- KEM (classical): `X25519` or `P-256 ECDH`
- AEAD: `AES-256-GCM` (or `XChaCha20-Poly1305` if runtime support standardizes)
- Signature (PQ for key records): `ML-DSA-65`

Hybrid message key derivation:
- `ss_classical = KEM/EC shared secret`
- `ss_pq = ML-KEM decapsulated secret`
- `K_msg = HKDF-SHA-384(concat(ss_classical, ss_pq), info="elizatown-pony-hybrid-v1", len=32)`

Decryption requires both shared secrets.

## 6) Protocol Changes

## 6.1 House Key Bundle (versioned)

House stores publishable bundle:
```json
{
  "ponyKeyBundle": {
    "version": 2,
    "classical": { "alg": "X25519", "pub": "..." },
    "pq": { "alg": "ML-KEM-768", "pub": "..." },
    "sig": {
      "alg": "ML-DSA-65",
      "pub": "...",
      "signature": "<sig over canonical key bundle>"
    },
    "createdAt": "ISO8601"
  }
}
```

Private portions remain client-side wrapped by `K_root`-derived wrapping keys.

## 6.2 Hybrid Ciphertext Envelope

```json
{
  "alg": "PONY_HYBRID_X25519_MLKEM768_AESGCM_V1",
  "kem": {
    "classical": { "epk": "..." },
    "pq": { "ct": "..." }
  },
  "iv": "...",
  "ct": "...",
  "aad": "..."
}
```

## 6.3 Policy Flags

Extend `/api/pony/policy`:
```json
{
  "requireHybridPq": false,
  "requireSignedKeyBundle": false,
  "minCryptoVersion": 1
}
```

Behavior:
- `requireHybridPq=true`: reject non-hybrid envelopes.
- `requireSignedKeyBundle=true`: reject sends to unresolved/unsigned key bundles.
- `minCryptoVersion`: allows staged deprecation.

## 7) Unlock and Identity Implications

Current unlock remains wallet-signature based and therefore classical.

Phase 8 does not remove wallet unlock immediately. It isolates quantum-resistance goals to message confidentiality and key integrity first.

Optional future hardening path:
- Add additional PQ-capable unlock factor (`pqUnlock`) for high-security mode while preserving default UX.

## 8) Rollout Plan

### Q0 - Preparation
- Ship key versioning and algorithm negotiation fields.
- Keep `minCryptoVersion=1` default.

### Q1 - Hybrid-capable clients
- Clients can generate/store PQ key material and hybrid-encrypt.
- Server accepts both v1 and v2.

### Q2 - Signed key bundle enforcement (opt-in)
- Verify `ML-DSA` signatures on key bundles.
- Add observability for key verification failures.

### Q3 - Hybrid required (default)
- Set `requireHybridPq=true` for new houses by default.
- Legacy houses remain opt-in migration path.

### Q4 - Legacy disable
- Raise `minCryptoVersion` and reject classical-only envelopes globally.

## 9) Deterministic Test Strategy

Required test additions:
1. `e2e/24_pony_hybrid_encrypt_decrypt.spec.js`
- Send hybrid message and decrypt successfully.

2. `e2e/25_pony_policy_require_hybrid.spec.js`
- Enforced policy rejects classical envelope.

3. `e2e/26_pony_signed_key_bundle.spec.js`
- Invalid key-bundle signature is rejected.

4. `e2e/27_pony_crypto_version_negotiation.spec.js`
- `minCryptoVersion` behavior is correct.

Test determinism rules:
- Keep randomized crypto in production behavior.
- In `NODE_ENV=test`, allow deterministic seed hooks only in tests to assert stable vectors when needed.
- Prefer behavioral assertions (decrypt success/failure) over byte-for-byte ciphertext matching.

## 10) Operational Requirements

- Bundle and pin vetted cryptography implementations (WASM/native wrappers) with strict version locks.
- Add startup self-tests for KEM/signature operations.
- Add runtime metrics:
  - `pony.crypto.hybrid.send`
  - `pony.crypto.hybrid.decrypt.fail`
  - `pony.crypto.bundle.verify.fail`

- Add kill-switch env flags:
  - `PONY_CRYPTO_ALLOW_CLASSICAL_ONLY`
  - `PONY_CRYPTO_REQUIRE_HYBRID`

## 11) Migration and Backward Compatibility

Legacy houses/messages:
- Continue reading v1 while migration is active.
- Require explicit house-auth migration call to register PQ bundle.
- Provide clear UX/API errors when receiver lacks required crypto version.

Error additions:
- `CRYPTO_VERSION_UNSUPPORTED`
- `HYBRID_REQUIRED`
- `PONY_PQ_KEY_MISSING`
- `PONY_KEY_BUNDLE_INVALID_SIGNATURE`

## 12) Risks and Mitigations

Risk: Browser/runtime PQ support variance.
Mitigation: ship a vetted portable implementation and strict compatibility matrix.

Risk: Envelope bloat and latency.
Mitigation: enforce message size caps; benchmark and budget limits per operation.

Risk: False sense of full PQ security while unlock remains classical.
Mitigation: document trust model explicitly in UI/docs and keep roadmap milestones separate.

## 13) Definition of Done

Phase 8 is complete when:
1. Hybrid encryption/decryption is default for new houses.
2. Policy can enforce hybrid-only mode.
3. Signed key bundles are verified in send path.
4. Legacy compatibility is explicit and bounded by `minCryptoVersion`.
5. Playwright hybrid and policy tests pass in CI.
