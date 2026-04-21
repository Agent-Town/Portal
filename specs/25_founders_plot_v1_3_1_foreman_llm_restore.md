# Agent Town: Founders Plot V1.3.1 — Foreman LLM Decision Restore

_Status: corrective implementation addendum_  
_Date: 2026-04-21_  
_Applies after `codex/founders-plot-v1-3-1-signoff`_

## 0. Why this exists

Founders Plot V1.1 defined a hybrid Foreman boundary:

1. the server enumerates safe candidates,
2. the worker chooses among those safe candidates or no-ops,
3. tests use a deterministic test brain,
4. live mode may use the configured LLM.

The shipped V1.1 and V1.2 line drifted from that contract. The worker tick stayed deterministic in both test and live mode, so Clover could act without the configured LLM participating in the choice.

This addendum records the correction.

## 1. Corrected behavior

The Foreman decision boundary is now:

1. `server/founders_plot/engine.js` remains authoritative for safe-candidate enumeration.
2. The worker uses the configured deterministic test brain only when the configured brain is explicitly `test-local/deterministic`.
3. In live OpenRouter mode, the worker asks the configured LLM to choose one actionable candidate ID or `NO_ACTION`.
4. Before invoking the bounded Foreman tool route, the worker syncs the chosen candidate to the server through `POST /api/founders-plot/foreman/decision`.
5. The server validates that the synced candidate still belongs to the current safe-candidate set for that runtime.
6. The bounded tool route still performs full runtime, permission, origin, and idempotency validation before mutating the world.

## 2. Client-only LLM privacy rule

This correction adds one explicit privacy rule for the live OpenRouter Foreman path:

- the LLM API key, provider choice, model ID, base URL, and reasoning config remain client-side only;
- the Foreman worker calls `https://openrouter.ai/api/v1` directly from the browser;
- the general OpenRouter brain path also calls `https://openrouter.ai/api/v1` directly from the browser instead of routing through `/api/llm/proxy/*`;
- the backend must never receive Foreman LLM config as part of decision selection;
- the backend must never receive Town Hall or browser brain config as part of onboarding progression;
- the backend receives only the decision-sync payload needed to validate and audit the chosen candidate.

This pass also replaces the old browser brain signal with a config-free onboarding route:

- after the browser saves config locally, it advances onboarding with `POST /api/onboarding/brain/complete`;
- that route carries no provider/model/auth/key fields;
- legacy `POST` / `PUT` / `DELETE` calls to `/api/agent/lite/llm/config` are rejected with `LLM_CONFIG_CLIENT_ONLY`;
- `GET /api/agent/lite/llm/config` and `/api/state` remain server-neutral and never echo provider/model/auth details back out.

Allowed backend payload:

```json
{
  "chosenCandidateId": "collect:bld_1234abcd",
  "source": "llm"
}
```

Forbidden backend payload categories:

- API keys
- provider names used only to configure the LLM call
- model refs/base URLs
- raw prompt text for the live Foreman selector

## 3. State and contract consequences

`state.foreman.lastDecision.source` is now part of the durable state contract.

Valid values:

- `test_brain`
- `llm`
- `server_default`

Interpretation:

- `test_brain`: deterministic test configuration selected the last decision
- `llm`: the live worker selected the last decision through the configured LLM
- `server_default`: fallback/default rendering state with no explicit live worker choice recorded yet

## 4. Acceptance coverage

The corrective acceptance set is:

- [e2e/146_founders_plot_v12_worker_owned_tick.spec.js](/private/tmp/portal-founders-plot-v1-3-1-signoff/e2e/146_founders_plot_v12_worker_owned_tick.spec.js)
  deterministic test-brain path remains local and does not introduce new Foreman-time LLM traffic
- [e2e/172_founders_plot_foreman_llm_tick.spec.js](/private/tmp/portal-founders-plot-v1-3-1-signoff/e2e/172_founders_plot_foreman_llm_tick.spec.js)
  live OpenRouter Foreman tick performs a client-only browser call to OpenRouter, sends no `/api/llm/*` request to the backend for the selection, syncs the bounded decision, and records `source: "llm"`
- [e2e/173_lite_llm_config_client_only.spec.js](/private/tmp/portal-founders-plot-v1-3-1-signoff/e2e/173_lite_llm_config_client_only.spec.js)
  legacy calls to the old brain-config route are rejected, the new onboarding completion route advances the step without config data, and server state stays config-free

## 5. Non-goals

This correction does not add:

- new gameplay systems
- off-session/persistent Foreman execution
- server-side autonomous planning
- backend-owned LLM selection
- extra contracts/resources/buildings

It restores the original live/test decision boundary that the earlier specs already intended.
