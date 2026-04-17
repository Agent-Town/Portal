---
name: founders-plot.safety
phase: 1
---

# Founders Plot — Safety

## Authority

- The **server** is always authoritative. Tool calls propose state changes;
  the server validates every invariant before mutating.
- The **human** is always the owner of the plot. The agent operates only on
  behalf of the human, inside permission flags, under caps, and with an
  emergency pause switch.

## Invariants (enforced server-side)

1. Inventory values never go negative.
2. No tile may host more than one building.
3. A building has at most one active running job.
4. A plot never exceeds its construction slot count.
5. HQ level increases monotonically.
6. A job cannot start unless its inputs are available.
7. A completed job can only be claimed once.
8. Offline catch-up caps at 8 hours, simulated in 1-minute ticks.
9. Every autonomous action respects `policy` flags and caps.
10. Replaying an event log from a snapshot yields the same state hash.

## Stop-the-world

A user toggling `emergencyPause` causes:

- Every agent-initiated tool call to return `FORBIDDEN_POLICY`.
- No new autonomous jobs are queued.
- Running jobs continue, because stopping them mid-run would violate the
  determinism invariant.

## Data

- No PII lives inside plot state. Plot identifiers link to session/pair
  identifiers but do not expose email, wallet addresses, or OAuth profile
  data.
- Public read-only views expose only: title, HQ level, productivity score,
  building count, last activity timestamp. Never the event log.

## Chain / finance

- Phase 1 has no on-chain actions, no wallet sends, and no token rewards.
- `coin` is a Phase 1 in-game number only, never exchanged for external value.
