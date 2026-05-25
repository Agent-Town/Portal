# V2.0 Persistent Foreman Release Gate

Status: required before promoting `FEATURE_FOUNDERS_V20_PERSISTENT_FOREMAN`.

## Product Gate

- Player understands exactly what Clover may do while away.
- Start, pause, revoke, and emergency stop are visible and reversible.
- Morning Brief and receipts explain every Foreman action.
- Normal gameplay contains no provider/runtime/debug jargon.

## QA Gate

- Closed-page sweep proves one bounded collect-ready routine.
- Duplicate lease/idempotency tests pass.
- Exception Inbox receives every blocked action.
- 390px and 1280px screenshots show readable Foreman state.

## Security Gate

- Brain/vault unlock is required before persistent action.
- Wrong account cannot control another Foreman lease.
- No plaintext Brain secrets appear in logs, recap, replay, traffic, screenshots, or receipts.

## Migration And Rollback

- Existing towns migrate with persistent Foreman disabled.
- Feature flag default is off.
- Rollback disables the flag and leaves receipts/events readable without executing new ticks.
