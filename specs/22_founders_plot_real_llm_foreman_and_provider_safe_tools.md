# Agent Town: Real-LLM Foreman + Provider-Safe Tool Names

**Document status:** implementation specification for real-provider OpenClaw worker runs on this branch  
**Target area:** OpenClaw Lite worker, Founders Plot foreman loop, skill/tool docs  
**Branch intent:** remove the last deterministic foreman chooser from production flow and make worker tool calling valid for providers that reject dotted function names

## Why this spec exists

This branch currently has two blocking issues for real-provider end-to-end testing:

1. Founders Plot foreman observation still picks a candidate server-side with `chooseForemanCandidateWithTestBrain(...)`, so Clover is not actually using the worker LLM to decide.
2. OpenClaw Lite still exposes dotted tool names such as `trainer.list_runs` and `et.plot.collect_outputs` directly to chat-completions tool calling, which breaks providers like OpenRouter that require function names to match `^[A-Za-z0-9_-]+$`.

This spec makes the fix traceable without rewriting the whole Founders Plot stack.

## Goals

1. A real LLM turn must happen during a production Foreman `Run now` tick.
2. The worker must send only provider-safe tool names to LLM APIs.
3. Founders Plot skill/docs must name the worker-facing tools the same way as the rest of the OpenClaw worker surface: lowercase underscore names.
4. Server-authoritative Founders Plot routes and replay semantics must stay intact.

## Non-goals

- Do not move foreman decision logic into backend handlers.
- Do not remove the canonical dotted Founders Plot route ids from server routes.
- Do not change the human-facing Founders Plot UI route contract.

## Contract split

Two contracts now exist intentionally:

### 1. Canonical server contract

The Founders Plot API and replay model keep their existing dotted route ids, for example:

- `et.plot.collect_outputs`
- `et.foreman.scheduler.enable_collect_ready_outputs`

These remain the server-side authority and replay/audit vocabulary.

### 2. LLM-facing worker contract

OpenClaw Lite must expose provider-safe aliases to the LLM/tool-calling layer.

Founders Plot aliases:

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

Generic dotted worker tools must follow the same rule. Example:

- `trainer.list_runs` -> `trainer_list_runs`

## Required implementation

### A. Provider-safe aliasing at the worker LLM boundary

In `vendors/openclaw-lite-main/src/openclaw-lite/worker.js`:

- Keep canonical dispatch names for direct/runtime invocation.
- Build a provider-safe alias table for any tool whose canonical name is not already provider-safe.
- Use the alias names, not the canonical dotted names, when building LLM tool specs and LLM system-prompt tool listings.
- Preserve a reverse mapping so tool calls returned by the model resolve back to the canonical dispatch path.
- Expose alias metadata in worker registry/debug surfaces so the mapping is inspectable and testable.

### B. Real LLM foreman decisioning

For production Founders Plot foreman ticks:

- `GET /api/founders-plot/foreman/observation` must stop choosing a fresh candidate server-side.
- The worker must read observation + safe candidates, run one bounded LLM turn, and choose at most one safe action through the worker path.
- The worker LLM turn should use a single bounded selection tool named `founders_plot_foreman_select_candidate`, then execute the chosen canonical dotted route itself.
- The chosen action must still execute through the server-authoritative foreman mutation route with worker-origin metadata.

### C. Persist worker-authored foreman decisions

The worker should send back a normalized decision payload for the chosen action so the server can persist:

- `chosenCandidateId`
- `chosenTool`
- `planCard`
- worker/provider metadata when useful

This persisted decision becomes the source for:

- receipt reasoning,
- `stateView().foreman.lastDecision`,
- `stateView().foreman.planCard`

The server must not synthesize a new production decision on read.

## Documentation updates

Update these files to use the worker-facing Founders Plot alias names:

- `public/skill.md`
- `public/experiences/founders-plot/skill.md`
- `public/experiences/founders-plot/tools.md`
- `docs/internal-skill-testline.md`

These docs must also make the split explicit:

- worker/LLM-facing aliases are underscore names,
- server/API/replay routes remain dotted names.

## Deterministic test coverage

Add or update Playwright coverage for the following:

### T1. Provider-safe worker tool names

Prove an LLM request generated by OpenClaw Lite contains:

- no tool function name with `.`,
- provider-safe aliases for dotted tools,
- traceable registry metadata mapping canonical names to alias names.

### T2. Foreman uses an LLM turn

Prove a Founders Plot `Run now` action:

- produces at least one `/api/llm/*` request,
- uses provider-safe Founders Plot alias names in that request,
- no longer depends on a server-side fresh chooser from the observation route.

### T3. Server state surfaces only persisted worker decisions

Prove server state/read paths no longer invent a production decision when no worker-authored decision has been stored, and that a stored worker decision is surfaced unchanged.

## Acceptance criteria

This work is complete when all of the following are true:

1. Generic OpenClaw Lite LLM requests contain only provider-safe function names.
2. Founders Plot `Run now` produces an LLM request and still yields worker-origin replay evidence.
3. `public/skill.md` and Founders Plot experience docs use the provider-safe Founders Plot alias names.
4. Server observation/state paths no longer perform fresh production candidate choice with the old test brain.
5. `npm run build:openclaw-lite` is run and `public/openclaw-lite/*` stays in sync with vendor source.
