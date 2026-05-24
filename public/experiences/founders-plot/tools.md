# Founders Plot Tool Surface

## Manual Mode vs Real Foreman authorization

### Human/manual tools

Human/manual tools may be used by the authenticated player in Manual Founder Mode:

- place building;
- queue production;
- collect output;
- accept contract;
- turn in contract;
- upgrade building where allowed.

These actions must be attributed to `HUMAN`.

### Foreman tools

Foreman mutation tools require Real Clover Foreman Mode:

- connected Brain;
- OpenClaw Lite worker/runtime readiness;
- worker-origin metadata where required;
- complete context pack;
- server-provided safe candidate;
- policy/permission acceptance.

If the Brain is missing, Foreman mutation tools must fail closed with a friendly player-facing reason:

```json
{
  "ok": false,
  "error": {
    "code": "BRAIN_REQUIRED",
    "message": "Connect a Brain to let Clover act as your Foreman.",
    "retryable": false
  }
}
```

### Spoof rejection

Human routes must reject any attempt to spoof `actor: "AGENT"`.

The Founders Plot runtime exposes a deliberately small tool family:

- `et.plot.get_state`
- `et.plot.place_building`
- `et.plot.queue_job`
- `et.plot.collect_outputs`
- `et.plot.upgrade_building`
- `et.plot.set_priority`
- `et.plot.claim_reward`
- `et.plot.request_user_approval`
- `et.plot.town.get_signals`
- `et.plot.town.upgrade_landmark`
- `et.plot.town.resolve_opportunity`
- `et.plot.journal.get_entries`
- `et.plot.contracts.get_state`
- `et.plot.contracts.accept`
- `et.plot.contracts.turn_in`
- `et.foreman.policy.get_standing_order`
- `et.foreman.policy.set_standing_order`
- `et.foreman.scheduler.get_status`
- `et.foreman.scheduler.enable_collect_ready_outputs`
- `et.foreman.scheduler.pause`
- `et.foreman.scheduler.resume`

## V1.2 boundaries

- Use `SUPPLY`, `BUILD`, and `PREPARATION` contracts only.
- Only one contract may be active at a time.
- Contract offers come from named recurring requesters and carry a `requesterSnapshot`.
- The town exposes four civic signals: `depotReadiness`, `marketConfidence`, `neighborGoodwill`, and `publicCharm`.
- The only landmark in scope is `public_square_welcome_sign`.
- Public Square town opportunities are player preference choices; Clover may explain tradeoffs, but `et.plot.town.resolve_opportunity` should run only after the human chooses an option.
- Early Public Square opportunities can chain; after resolving one, re-read state before proposing the next build, upgrade, or choice.
- `foreman.companionAdvice` is the shared-state companion readout for current bottlenecks and Public Square pros/cons; surface it as advice, not as permission to bypass the human choice.
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

- `et.plot.request_user_approval` creates a visible approval card for the human.
- Creating the card appends an `APPROVAL_REQUESTED` event to the Founders Plot event log.
- Resolving the card appends either `APPROVAL_APPROVED` or `APPROVAL_REJECTED`.
- Those approval events must appear in both recap output and replay output.

## HTTP surfaces

- Tool execution: `POST /api/founders-plot/tool/:toolName`
- Contract routes:
  `GET /api/founders-plot/contracts/state`,
  `POST /api/founders-plot/contracts/accept`,
  `POST /api/founders-plot/contracts/turn-in`
- Foreman session routes:
  `POST /api/founders-plot/foreman/session/start`,
  `POST /api/founders-plot/foreman/session/heartbeat`,
  `POST /api/founders-plot/foreman/session/pause`
- Foreman observation route: `GET /api/founders-plot/foreman/observation`
- Foreman execution route: `POST /api/founders-plot/foreman/tool/:toolName`
- Foreman receipt correction route: `POST /api/founders-plot/foreman/receipt/correction`
- Policy toggles: `POST /api/founders-plot/policy`
- Approval resolution: `POST /api/founders-plot/approvals/:approvalId/resolve`
- Recap read model: `GET /api/founders-plot/recap`
- Journal read model: `POST /api/founders-plot/tool/et.plot.journal.get_entries`
- Replay audit: `GET /api/founders-plot/replay`

---

## V1.4 Foreman AI Reality Update

### Tool naming model

Canonical server/replay names remain dotted:

```text
et.plot.collect_outputs
et.plot.queue_job
et.plot.request_user_approval
```

LLM/provider-facing names must be provider-safe aliases:

```text
founders_plot_collect_outputs
founders_plot_queue_job
founders_plot_request_user_approval
```

The worker must record the alias map in the decision trace.

### P0 Foreman selection tool

For V1.4, Clover should usually select among server-provided safe candidates via:

```text
founders_plot_foreman_select_candidate
```

### Rules

- Do not invent candidate IDs.
- Do not invent tools.
- If no candidate is useful, select `null` and use a no-op code.
- The server validates the selected candidate again before mutation.

### Compact tool guide requirement

The provider request must also include a compact guide for actual canonical tools, including:

- what the tool does;
- when to use it;
- required arguments;
- key error codes;
- whether it can spend resources or requires approval.

## Brain-Required Foreman Mutations

Foreman mutation tools require Real Clover readiness.

If the caller lacks Real Clover readiness, mutation tools must return:

```json
{
  "ok": false,
  "error": {
    "code": "BRAIN_REQUIRED",
    "message": "Connect a Brain to let Clover act as your Foreman.",
    "retryable": false
  }
}
```

The server must not mutate world state and must not emit AGENT action events on `BRAIN_REQUIRED`.
