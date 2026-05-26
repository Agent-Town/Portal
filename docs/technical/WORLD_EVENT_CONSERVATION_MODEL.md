# World Event Conservation Model

Status: implementation planning

World event contributions must conserve resources and remain rollback-safe.

## Rules

- Preview before contribution.
- Per-account and per-settlement caps.
- Idempotency key required for contributions.
- Duplicate contribution attempts return the original result.
- Contribution consumes exactly the accepted resources.
- Rewards are cosmetic/status-safe until a later economy gate exists.
- Event resolution is deterministic and replayable.

## Required Evidence

- Cap enforcement tests.
- Resource conservation tests.
- Duplicate idempotency tests.
- Wrong-owner reward denial tests.
- Rollback/replay evidence for event accounting.
