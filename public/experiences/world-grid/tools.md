# World Grid Tools

Prototype-gated world tools:

## et.world.region.get_state

Feature flag: `FEATURE_WORLD_GRID_V50_REGION`

Returns the current region observation, including redacted owner context,
settlement nodes, route edges, selectable cells, and camera/focus state.

## et.world.region.explain_cell

Feature flag: `FEATURE_WORLD_GRID_V50_REGION`

Explains one cell's terrain, state, feature, risk, and future-use preview. This
tool does not reserve, claim, build, or spend resources.

## et.world.territory.get_claim_options

Feature flag: `FEATURE_WORLD_GRID_V51_CLAIMS`

Lists adjacent V5.1 claim options, costs, route preview, benefit, drawback, and
Clover advice.

## et.world.territory.plan_claim

Feature flag: `FEATURE_WORLD_GRID_V51_CLAIMS`

Plans one adjacent claim. This reserves no resources. Requires an existing
Founders Plot prerequisite.

## et.world.territory.complete_claim

Feature flag: `FEATURE_WORLD_GRID_V51_CLAIMS`

Completes one planned claim through the server-authoritative resource flow.
Requires an existing Founders Plot prerequisite.

## et.world.territory.cancel_claim

Feature flag: `FEATURE_WORLD_GRID_V51_CLAIMS`

Cancels one planned claim before resources are spent.
Requires an existing Founders Plot prerequisite.

## et.world.public.list_neighbors

Feature flag: `FEATURE_WORLD_GRID_V52_PUBLIC_PRESENCE`

Lists opt-in public town cards with public-safe fields only.

## et.world.public.summarize_neighbor

Feature flag: `FEATURE_WORLD_GRID_V52_PUBLIC_PRESENCE`

Summarizes one public town card without exposing private state.

## et.world.services.list

Feature flag: `FEATURE_WORLD_GRID_V53_AGENT_SERVICES`

Lists bounded V5.3 civic service advice prototypes, allowed input scopes,
forbidden input classes, and reputation counters.

## et.world.services.request_advice

Feature flag: `FEATURE_WORLD_GRID_V53_AGENT_SERVICES`

Requests a structured recommendation from one service using only redacted,
approved inputs. Requires an existing Founders Plot prerequisite.

## et.world.services.accept_result

Feature flag: `FEATURE_WORLD_GRID_V53_AGENT_SERVICES`

Accepts a service recommendation as advice only. It does not mutate town or
world state. Requires an existing Founders Plot prerequisite.

## et.world.services.report_issue

Feature flag: `FEATURE_WORLD_GRID_V53_AGENT_SERVICES`

Reports a service issue and updates reliability bookkeeping once per request.
Requires an existing Founders Plot prerequisite.

## et.world.events.get_state

Feature flag: `FEATURE_WORLD_GRID_V54_WORLD_EVENTS`

Returns active public works events, public progress, and this town's personal
contribution recap.

## et.world.events.preview_contribution

Feature flag: `FEATURE_WORLD_GRID_V54_WORLD_EVENTS`

Previews the accepted contribution after daily caps, settlement caps, public
goal remaining, and requested resources are applied. This tool spends nothing.

## et.world.events.contribute

Feature flag: `FEATURE_WORLD_GRID_V54_WORLD_EVENTS`

Contributes the accepted resource bundle with an idempotency key. Duplicate
requests return the original contribution. Requires an existing Founders Plot
prerequisite.

## et.world.events.claim_reward

Feature flag: `FEATURE_WORLD_GRID_V54_WORLD_EVENTS`

Claims a cosmetic/status-safe event reward for the contributing account. It does
not reveal secrets or change private town resources. Requires an existing
Founders Plot prerequisite.

## et.world.sandbox.get_state

Feature flag: `FEATURE_WORLD_GRID_V55_SANDBOX_DISTRICTS`

Reads the controlled sandbox district, redacted participants, typed props,
recent moderation actions, and rollback handles.

## et.world.sandbox.enter

Feature flag: `FEATURE_WORLD_GRID_V55_SANDBOX_DISTRICTS`

Enters the sandbox as a redacted public participant. Requires an existing
Founders Plot prerequisite.

## et.world.sandbox.place_prop

Feature flag: `FEATURE_WORLD_GRID_V55_SANDBOX_DISTRICTS`

Attempts to place one approved prop. Unsupported props are rejected by the
moderation policy and do not change sandbox cells.
Requires an existing Founders Plot prerequisite.

## et.world.sandbox.agent_demo

Feature flag: `FEATURE_WORLD_GRID_V55_SANDBOX_DISTRICTS`

Runs one approved typed agent demo action. Free-form agent output, chat, uploads,
and private-town mutations are not accepted.
Requires an existing Founders Plot prerequisite.

## et.world.sandbox.rollback_last

Feature flag: `FEATURE_WORLD_GRID_V55_SANDBOX_DISTRICTS`

Restores this participant's last approved sandbox action from its rollback
snapshot.
Requires an existing Founders Plot prerequisite.

## et.world.sandbox.leave

Feature flag: `FEATURE_WORLD_GRID_V55_SANDBOX_DISTRICTS`

Removes this session's public sandbox presence without touching private town
state.
Requires an existing Founders Plot prerequisite.
