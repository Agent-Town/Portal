# Founders Plot Tool Surface

The Founders Plot runtime exposes a deliberately small worker-facing tool family:

- `founders_plot_get_state`
- `founders_plot_place_building`
- `founders_plot_queue_job`
- `founders_plot_collect_outputs`
- `founders_plot_upgrade_building`
- `founders_plot_set_priority`
- `founders_plot_claim_reward`
- `founders_plot_request_user_approval`
- `founders_plot_town_get_signals`
- `founders_plot_town_upgrade_landmark`
- `founders_plot_journal_get_entries`
- `founders_plot_contracts_get_state`
- `founders_plot_contracts_accept`
- `founders_plot_contracts_turn_in`
- `founders_plot_foreman_policy_get_standing_order`
- `founders_plot_foreman_policy_set_standing_order`
- `founders_plot_foreman_scheduler_get_status`
- `founders_plot_foreman_scheduler_enable_collect_ready_outputs`
- `founders_plot_foreman_scheduler_pause`
- `founders_plot_foreman_scheduler_resume`

The worker/LLM surface uses these underscore aliases. The canonical server/API/replay routes remain the dotted `et.plot.*` and `et.foreman.*` ids.

## V1.2 boundaries

- Use `SUPPLY`, `BUILD`, and `PREPARATION` contracts only.
- Only one contract may be active at a time.
- Contract offers come from named recurring requesters and carry a `requesterSnapshot`.
- The town exposes four civic signals: `depotReadiness`, `marketConfidence`, `neighborGoodwill`, and `publicCharm`.
- The only landmark in scope is `public_square_welcome_sign`.
- Standing Order v0 is limited to `CAREFUL_STEWARD` and `BOLD_FOUNDER`.
- The only shipped scheduler preset is `COLLECT_READY_OUTPUTS`.
- The first autonomous mutation must come through the Foreman-authenticated route, not a spoofed `actor` field.
- The visible `Run now` Foreman tick must be owned by the OpenClaw Lite worker command path, not page glue.
- `COLLECT_READY_OUTPUTS` runs in-session only while the Founders Plot page and worker stay open.
- Reloading the page loses local control of Clover until the human starts Clover again in that tab.

## Contract rules

- Read-only tools do not require `idempotencyKey`.
- Every mutation tool requires `idempotencyKey`.
- The server is authoritative for action validity and outcomes.
- Policy-blocked sensitive actions must fail with a real error instead of simulating success.
- Agent placement or HQ upgrade attempts must request approval first when Phase 1 policy requires it.
- `POST /api/founders-plot/tool/:toolName` is the human route and must reject `actor: "AGENT"` with `ACTOR_SPOOF_REJECTED`.
- `POST /api/founders-plot/foreman/tool/:toolName` is the Foreman route and requires server-issued runtime authority.
- Foreman mutation calls must include `origin: "OPENCLAW_LITE_WORKER"`, `workerCommandId`, `workerTraceId`, and the matching `runtimeId`.
- Worker-owned Foreman mutations append `FOREMAN_WORKER_COMMAND_STARTED`, `AGENT_ACTION_EXECUTED`, and `FOREMAN_WORKER_COMMAND_COMPLETED` events.

## Approval audit rules

- `founders_plot_request_user_approval` creates a visible approval card for the human.
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
- Journal read model: `POST /api/founders-plot/tool/et.plot.journal.get_entries`
- Replay audit: `GET /api/founders-plot/replay`
