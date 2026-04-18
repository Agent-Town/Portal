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

## Contract rules

- Every mutation tool requires `idempotencyKey`.
- The server is authoritative for action validity and outcomes.
- Policy-blocked sensitive actions must fail with a real error instead of simulating success.
- Agent placement or HQ upgrade attempts must request approval first when Phase 1 policy requires it.

## Approval audit rules

- `et.plot.request_user_approval` creates a visible approval card for the human.
- Creating the card appends an `APPROVAL_REQUESTED` event to the Founders Plot event log.
- Resolving the card appends either `APPROVAL_APPROVED` or `APPROVAL_REJECTED`.
- Those approval events must appear in both recap output and replay output.

## HTTP surfaces

- Tool execution: `POST /api/founders-plot/tool/:toolName`
- Policy toggles: `POST /api/founders-plot/policy`
- Approval resolution: `POST /api/founders-plot/approvals/:approvalId/resolve`
- Recap read model: `GET /api/founders-plot/recap`
- Replay audit: `GET /api/founders-plot/replay`
