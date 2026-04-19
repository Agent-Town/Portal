# Founders Plot Tool Surface

The Founders Plot runtime exposes a deliberately small tool family:

- `et.plot.get_state`
- `et.plot.place_building`
- `et.plot.queue_job`
- `et.plot.collect_outputs`
- `et.plot.upgrade_building`
- `et.plot.set_priority`
- `et.plot.claim_reward`
- `et.plot.request_user_approval`
- `et.plot.contracts.get_state`
- `et.plot.contracts.accept`
- `et.plot.contracts.turn_in`
- `et.foreman.policy.get_standing_order`
- `et.foreman.policy.set_standing_order`
- `et.foreman.scheduler.get_status`
- `et.foreman.scheduler.enable_collect_ready_outputs`
- `et.foreman.scheduler.pause`
- `et.foreman.scheduler.resume`

## V1.1 boundaries

- Use `SUPPLY` and `BUILD` contracts only.
- Only one contract may be active at a time.
- Standing Order v0 is limited to `CAREFUL_STEWARD` and `BOLD_FOUNDER`.
- The only shipped scheduler preset is `COLLECT_READY_OUTPUTS`.
- The first autonomous mutation must come through the Foreman-authenticated route, not a spoofed `actor` field.

## Contract rules

- Every mutation tool requires `idempotencyKey`.
- The server is authoritative for action validity and outcomes.
- Policy-blocked sensitive actions must fail with a real error instead of simulating success.
- Agent placement or HQ upgrade attempts must request approval first when Phase 1 policy requires it.
- `POST /api/founders-plot/tool/:toolName` is the human route and must reject `actor: "AGENT"` with `ACTOR_SPOOF_REJECTED`.
- `POST /api/founders-plot/foreman/tool/:toolName` is the Foreman route and requires server-issued runtime authority.

## Approval audit rules

- `et.plot.request_user_approval` creates a visible approval card for the human.
- Creating the card appends an `APPROVAL_REQUESTED` event to the Founders Plot event log.
- Resolving the card appends either `APPROVAL_APPROVED` or `APPROVAL_REJECTED`.
- Those approval events must appear in both recap output and replay output.

## HTTP surfaces

- Tool execution: `POST /api/founders-plot/tool/:toolName`
- Contract routes: `GET /api/founders-plot/contracts/state`, `POST /api/founders-plot/contracts/accept`, `POST /api/founders-plot/contracts/turn-in`
- Foreman session routes: `POST /api/founders-plot/foreman/session/start`, `POST /api/founders-plot/foreman/session/heartbeat`, `POST /api/founders-plot/foreman/session/pause`
- Foreman observation route: `GET /api/founders-plot/foreman/observation`
- Foreman execution route: `POST /api/founders-plot/foreman/tool/:toolName`
- Foreman receipt correction route: `POST /api/founders-plot/foreman/receipt/correction`
- Policy toggles: `POST /api/founders-plot/policy`
- Approval resolution: `POST /api/founders-plot/approvals/:approvalId/resolve`
- Recap read model: `GET /api/founders-plot/recap`
- Replay audit: `GET /api/founders-plot/replay`
