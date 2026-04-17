---
name: founders-plot.tools
phase: 1
---

# Founders Plot — Tool Contract

All tools are exposed under `/api/founders-plot/tools/<name>` as POST. All
bodies are JSON, all responses are JSON. Every mutation tool requires an
`idempotencyKey` (UUID-shaped string) and returns `worldDelta`.

## Error codes

| code                   | retryable | meaning                                                     |
| ---------------------- | --------- | ----------------------------------------------------------- |
| `UNAUTHORIZED`         | false     | Session not attached to a plot.                             |
| `FORBIDDEN_POLICY`     | after approval | Permission flag disabled or cap exceeded.              |
| `INVALID_STATE`        | false     | Action does not apply to current state.                     |
| `OUT_OF_RESOURCES`     | true      | Inventory cannot cover input cost.                          |
| `OUT_OF_BOUNDS`        | false     | Tile coordinate not on the plot grid.                       |
| `BUILD_SLOT_OCCUPIED`  | false     | Tile already occupied or slots at cap.                      |
| `JOB_ALREADY_RUNNING`  | true      | Building already has an active job.                         |
| `RATE_LIMITED`         | true      | Too many autonomous actions in the window.                  |
| `IDEMPOTENCY_CONFLICT` | false     | Different payload used with existing key.                   |
| `SIMULATION_DESYNC`    | false     | Event log cannot reproduce state; manual repair needed.     |
| `SERVER_ERROR`         | true      | Unhandled internal error.                                   |

## Tools

### `et.plot.get_state`

Read-only. Returns the observation payload. No idempotency key.

### `et.plot.place_building`

Body: `{ plotId, type, x, y, idempotencyKey }`.
Always requires human approval in Phase 1 — this route is gated to `HUMAN`
callers; agent attempts return `FORBIDDEN_POLICY` with `retryable:false`.

### `et.plot.queue_job`

Body: `{ plotId, buildingId, kind, idempotencyKey }`.
`kind` is one of `PRODUCE` or `SELL`. Policy requires `queueProduction` at HQ 3
for PRODUCE or `sellSurplusFood` at HQ 5 for SELL. Also enforces daily coin cap.

### `et.plot.collect_outputs`

Body: `{ plotId, buildingId, idempotencyKey }`.
Agent requires `collectOutputs`. Clamps to storage caps and logs overflow.

### `et.plot.upgrade_building`

Body: `{ plotId, buildingId, idempotencyKey }`.
Upgrading HQ always requires human approval; agent attempts return
`FORBIDDEN_POLICY`.

### `et.plot.set_priority`

Body: `{ plotId, buildingId, priority, idempotencyKey }`.
Policy requires `setPriority`. `priority` in `WOOD | STONE | FOOD | BALANCED`.

### `et.plot.claim_reward`

Body: `{ plotId, rewardId, idempotencyKey }`.
Claims quest/level rewards recorded in the event log.

### `et.plot.request_user_approval`

Body: `{ plotId, action, reason, idempotencyKey }`.
Creates a visible approval card. No state mutation.

## World delta format

Every mutation returns `worldDelta: Array<Event>` containing the newly
appended event log entries from this action, in order. The client can merge
these into its local view without re-fetching full state.
