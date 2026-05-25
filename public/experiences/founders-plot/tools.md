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
- `et.plot.town.set_identity`
- `et.plot.town.resolve_opportunity`
- `et.plot.journal.get_entries`
- `et.plot.contracts.get_state`
- `et.plot.contracts.accept`
- `et.plot.contracts.turn_in`
- `et.plot.scenarios.get_state`
- `et.plot.scenarios.start`
- `et.plot.scenarios.contribute`
- `et.plot.settlements.get_ledger`
- `et.plot.settlements.launch_expedition`
- `et.plot.settlements.focus`
- `et.plot.settlements.complete_founding_task`
- `et.plot.operating_model.get_state`
- `et.plot.operating_model.choose_charter`
- `et.plot.operating_model.unlock_capability`
- `et.plot.operating_model.refresh_contracts`
- `et.plot.regional.get_ledger`
- `et.plot.regional.open_supply_route`
- `et.plot.regional.transfer_supply_route`
- `et.plot.regional.accept_contract`
- `et.plot.regional.turn_in_contract`
- `et.plot.creator.get_catalog`
- `et.plot.creator.install_building`
- `et.plot.creator.disable_building`
- `et.plot.creator.remove_building`
- `et.creator.notice_kiosk.post_notice`
- `et.foreman.specialists.get_state`
- `et.foreman.specialists.assign`
- `et.foreman.specialists.pause`
- `et.foreman.specialists.review_recommendation`
- `et.foreman.policy.get_standing_order`
- `et.foreman.policy.set_standing_order`
- `et.foreman.doctrine.get_state`
- `et.foreman.doctrine.set_rule`
- `et.foreman.scheduler.get_status`
- `et.foreman.scheduler.enable_collect_ready_outputs`
- `et.foreman.scheduler.pause`
- `et.foreman.scheduler.resume`
- `et.foreman.governance.start_persistent`
- `et.foreman.governance.pause_persistent`

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
- `COLLECT_READY_OUTPUTS` runs in-session only while the Founders Plot page and worker stay open unless while-away Clover help is explicitly active.
- While-away Clover help is limited to collecting ready output under a real Brain, time-boxed lease, collect permission, receipt trail, and pause control.
- Reloading the page loses local control of Clover until the human starts Clover again in that tab, except for the explicitly active while-away collect-ready routine.

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
- Foreman preference route: `POST /api/founders-plot/foreman/preference`
- Policy toggles: `POST /api/founders-plot/policy`
- Approval resolution: `POST /api/founders-plot/approvals/:approvalId/resolve`
- Recap read model: `GET /api/founders-plot/recap`
- Journal read model: `POST /api/founders-plot/tool/et.plot.journal.get_entries`
- Postcard capture: `POST /api/founders-plot/postcard`
- Replay audit: `GET /api/founders-plot/replay`

## V1.5 first-hour contract rules

- Contract Board offers should present 2-3 named requester choices after HQ2, not a single anonymous task.
- Clover may recommend one offer using `contracts.recommendation`, but the human still chooses.
- Lightweight teaching preferences (`DO_THIS_AGAIN`, `ASK_ME_FIRST`, `PREFER_RESERVES`, `PREFER_SPEED`) tune future recommendations and may not unlock off-session autonomy.
- Morning Brief is a read model over real events; it must summarize changes, active work, blockers, Clover advice, and the next action without inventing outcomes.

## V1.6 civic scenario rules

- Short civic scenarios are player-started Public Square projects, not background autonomy.
- `storm_prep` is the first scenario and uses existing resources only.
- Scenario tasks spend real inventory through `et.plot.scenarios.contribute`; never fake progress in the UI.
- Scenario progress, completion, and soft-miss outcomes must appear in state, scene anchors, journal, and recap.
- Clover may explain scenario pressure and tradeoffs with active contracts, but the human still chooses whether to spend reserves.

## V1.7 town identity rules

- Public Square style choices are cosmetic and player-authored.
- `et.plot.town.set_identity` may set only `homestead`, `garden`, or `market` after the Welcome Sign is raised.
- Choosing a style must not spend inventory, grant XP, change signals, or unlock Foreman authority.
- Plot cards are public-safe summaries; they must exclude Brain, provider, wallet, runtime, token, secret, and debug details.
- Postcard capture is a public-safe camera/export workflow over server state. It records `townPostcards`, exposes a Three.js `STATE:town_postcard` anchor, and must not include private Brain, provider, wallet, runtime, token, secret, or debug details.

## V2.0 bounded Foreman governance rules

- Routine Foreman work needs a time-boxed governance lease.
- `et.foreman.governance.grant_lease` grants a short lease; `et.foreman.governance.revoke_lease` pauses routine work immediately.
- `et.foreman.governance.raise_exception` creates an Exception Inbox item when Clover cannot safely decide alone.
- `et.foreman.governance.resolve_exception` marks the item resolved after the human reviews it.
- `et.foreman.governance.start_persistent` starts while-away help only for the collect-ready routine after real Brain authorization.
- `et.foreman.governance.pause_persistent` stops while-away help immediately.
- A restored Brain does not imply while-away authority; the player must explicitly start while-away help and keep the lease, permission, and pause controls visible.
- Production-like while-away proof uses the server background sweep path after the page is closed; manual foreground ticks are only a deterministic test helper.
- Every routine action still needs receipts and can be paused from receipt controls.

## V2.1 Doctrine Lite rules

- Doctrine Lite is preference teaching, not permission.
- `et.foreman.doctrine.set_rule` may enable or disable only:
  `PREFER_RESERVES`, `PREFER_SPEED`, `ASK_BEFORE_SPENDING`, or
  `FINISH_ACTIVE_CONTRACTS_FIRST`.
- `PREFER_RESERVES` and `PREFER_SPEED` conflict. If both would be active,
  Clover must raise an Exception Inbox item instead of silently switching.
- Doctrine rules modify recommendation and safe-candidate ranking, but the
  server still validates every mutation through the existing policy, lease, and
  tool checks.
- Foreman receipts and Morning Briefs should mention the active preference when
  it influenced Clover’s action.

## V2.5 second settlement rules

- Settler Expedition stays locked until Founders Plot reaches HQ2, while-away
  Clover help is active, and Clover has completed one while-away routine action.
- `et.plot.settlements.launch_expedition` creates a distinct Ridge Outpost
  shard with its own plot ID, inventory, buildings, founding tasks, and events.
- `et.plot.settlements.complete_founding_task` may spend only the second
  settlement inventory. It must not debit or add to Town 1 resources.
- `et.plot.settlements.focus` changes Governor Ledger focus only; it does not
  mutate either settlement.

## V3.0 operating model rules

- Operating Model starts only after Ridge Outpost is active.
- `et.plot.operating_model.choose_charter` may choose exactly one charter:
  `STEADY_COMMONS`, `SWIFT_DEPOT`, or `CIVIC_BEACON`.
- A charter may weight Contract Board recommendations, Clover suggestions, and
  town signage. It must not grant broad autonomy or bypass Foreman policy.
- `et.plot.operating_model.unlock_capability` may unlock only small capability
  nodes: `CHARTER_CONTRACTS`, `SETTLEMENT_BANNERS`, or `FOREMAN_BRIEFING`.
- `CHARTER_CONTRACTS` is required before
  `et.plot.operating_model.refresh_contracts` is an allowed action.
- Capability Web is not a giant science tree. Keep it readable as a town
  operating-model layer.

## V3.1 specialist Foreman rules

- Specialist Foremen are staffing lanes under the trusted general Foreman, not
  separate hidden Brains.
- `et.foreman.specialists.assign` may assign only:
  - `BUILDER_FOREMAN` to `construction` or `public_works`;
  - `QUARTERMASTER` to `supplies` or `contracts`.
- Each assigned domain has a small allowed-tool list. A specialist
  recommendation outside that list must fail with `SPECIALIST_DOMAIN_VIOLATION`.
- `et.foreman.specialists.review_recommendation` records a bounded
  recommendation. If another active specialist conflicts on the same target, it
  must raise an Exception Inbox item instead of silently choosing a winner.
- `et.foreman.specialists.pause` pauses one specialist lane only; it does not
  pause Clover, leases, or while-away help.

## V3.5 regional governance rules

- Regional governance starts only after Ridge Outpost is active, a charter is
  chosen, and at least one specialist lane is staffed.
- `et.plot.regional.open_supply_route` opens only the bounded Ridge Supply
  Route between Founders Plot and Ridge Outpost.
- `et.plot.regional.transfer_supply_route` moves one deterministic shipment
  from the route's exact source town to its exact destination town. Wrong-town
  transfers must fail; successful transfers conserve cross-town resources.
- Route shortages are visible in the Governor Ledger and recover by producing
  the missing resource before retrying the same route.
- Regional contracts must reference both towns. `ridge_timber_bridge` can be
  turned in only after the required shipment is complete.
- The Three.js regional map must show settlement nodes, route links between
  the nodes, and jump-to-town camera focus state without making the renderer
  world truth.

## V4.0 operating-style sharing rules

- Operating-style sharing is a public export/read/compare surface, not a new
  mutation tool family.
- `GET /api/founders-plot/operating-style-card` generates the current
  player's public-safe style card from server state.
- `GET /api/founders-plot/public/operating-style-card/:plotId` loads a shared
  card without private town entry.
- `POST /api/founders-plot/operating-style/compare` compares an imported card
  without mutating town state.
- Cards may summarize charter, doctrine, specialist lanes, regional routes,
  Capability Web labels, and cosmetic town identity only.
- Cards and comparison responses must exclude Brain config, provider details,
  wallet/session data, runtime or worker traces, tokens, secrets, private logs,
  and private events.
- Imported cards are inspiration only; they must never grant resources,
  buildings, permissions, Foreman authority, or Capability Web nodes.

## V4.5 creator building rules

- Creator buildings are curated extensions, not arbitrary town authority.
- `et.plot.creator.get_catalog` reads approved creator-building manifests,
  install gates, current installation state, and allowed actions.
- `et.plot.creator.install_building` may install or re-enable only an approved
  manifest after its gate is ready.
- `et.plot.creator.disable_building` keeps the extension state but removes its
  active effect from play.
- `et.plot.creator.remove_building` removes the creator building from the town
  scene without deleting core town inventory, buildings, or progress.
- `et.creator.notice_kiosk.post_notice` may mutate only the Notice Kiosk's
  typed creator state. It must not mutate core plot resources, buildings,
  permissions, Foreman authority, settlements, or routes.
- Creator manifests must be approved, declare typed state and tool schemas, use
  public town summary only, and have no network access.
- Creator manifests must declare curated local import source, asset-governance
  approval/provenance requirements, and a credit-only creator model until a
  separate marketplace/revenue spec exists.
- Creator tools must reject private or backstage text such as Brain config,
  provider details, wallet/session data, runtime or worker traces, tokens,
  secrets, private logs, and private events.

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
