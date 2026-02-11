# K_root Security Boundary (Non-Negotiable)

Status: Active  
Last updated: 2026-02-11

## Purpose

This document defines hard security constraints for house key material.  
These constraints are mandatory for all future changes.

## Non-Negotiable Rules

1. Backend must never receive raw `K_root`.
2. Backend must never receive raw ceremony reveal bytes (`Rh` / `Ra`) in plaintext.
3. Backend must never derive `K_root` (directly or indirectly) from ceremony material.
4. Backend must never persist any field that can be used to reconstruct `K_root` without user-held secrets.
5. Client code must not persist raw `K_root` in web storage (`localStorage` / `sessionStorage` / IndexedDB).

## Allowed Server Data

- Ceremony commits (`sha256(reveal)`).
- Ceremony reveal public keys.
- Sealed reveal envelopes (`CEREMONY_E2EE_P256_AESGCM_V1`) that the server cannot decrypt.
- Wallet-wrapped house key blobs (`keyWrap`) where unwrap requires a user wallet signature.
- Derived auth keys (`houseAuthKey`) and other non-reversible derivatives.

## Required Review Checks For Any Ceremony/House PR

1. Verify no endpoint accepts plaintext `Rh`, plaintext `Ra`, or plaintext `K_root`.
2. Verify no backend code computes `sha256(Rh || Ra)` or equivalent.
3. Verify no logs, analytics, or debug payloads include raw reveal or `K_root` material.
4. Verify browser code does not write raw `K_root` to persistent storage.
5. Verify Playwright coverage includes at least one regression asserting sealed ceremony flow.

## Reject Conditions

Any change must be rejected if it:
- reintroduces plaintext reveal transport,
- reintroduces server-side key derivation from reveal material,
- or stores raw `K_root` in browser/server persistence.
