# World Grid Tools

Prototype-gated world tools:

## et.world.region.get_state

Returns the current region observation, including redacted owner context,
settlement nodes, route edges, selectable cells, and camera/focus state.

## et.world.region.explain_cell

Explains one cell's terrain, state, feature, risk, and future-use preview. This
tool does not reserve, claim, build, or spend resources.

## et.world.territory.get_claim_options

Lists adjacent V5.1 claim options, costs, route preview, benefit, drawback, and
Clover advice.

## et.world.territory.plan_claim

Plans one adjacent claim. This reserves no resources.

## et.world.territory.complete_claim

Completes one planned claim through the server-authoritative resource flow.

## et.world.territory.cancel_claim

Cancels one planned claim before resources are spent.

## et.world.public.list_neighbors

Lists opt-in public town cards with public-safe fields only.

## et.world.public.summarize_neighbor

Summarizes one public town card without exposing private state.

## et.world.services.list

Lists bounded civic services, allowed input scopes, forbidden input classes, and
reputation counters.

## et.world.services.request_advice

Requests a structured recommendation from one service using only redacted,
approved inputs.

## et.world.services.accept_result

Accepts a service recommendation as advice only. It does not mutate town or
world state.

## et.world.services.report_issue

Reports a service issue and updates reliability bookkeeping once per request.

## et.world.events.get_state

Returns active public works events, public progress, and this town's personal
contribution recap.

## et.world.events.preview_contribution

Previews the accepted contribution after daily caps, settlement caps, public
goal remaining, and requested resources are applied. This tool spends nothing.

## et.world.events.contribute

Contributes the accepted resource bundle with an idempotency key. Duplicate
requests return the original contribution.

## et.world.events.claim_reward

Claims a cosmetic/status-safe event reward for the contributing account. It does
not reveal secrets or change private town resources.

## et.world.sandbox.get_state

Reads the controlled sandbox district, redacted participants, typed props,
recent moderation actions, and rollback handles.

## et.world.sandbox.enter

Enters the sandbox as a redacted public participant.

## et.world.sandbox.place_prop

Attempts to place one approved prop. Unsupported props are rejected by the
moderation policy and do not change sandbox cells.

## et.world.sandbox.agent_demo

Runs one approved typed agent demo action. Free-form agent output, chat, uploads,
and private-town mutations are not accepted.

## et.world.sandbox.rollback_last

Restores this participant's last approved sandbox action from its rollback
snapshot.

## et.world.sandbox.leave

Removes this session's public sandbox presence without touching private town
state.
