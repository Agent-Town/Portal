# Portal Loss v1

Lower is better.

This harness uses one scalar objective so an autonomous loop can keep or discard a Portal change without re-reading the whole repo every run.

## Hard invariants

These are measured in the evaluator and each failure is expensive:

1. App shell still loads as a minimal landing surface.
2. Agent panel and debug surfaces still render.
3. Trainer still opens as a modal from the page-scoped runtime.
4. Ceremony still opens inside the district modal iframe instead of full-page navigation.
5. Team Code does not leak into visible non-debug UI.
6. The generic LLM proxy still blocks loopback upstream targets.
7. `/api/state` still restores a missing-cookie session when `x-team-code-hint` matches a live session.

Each hard failure adds `1000` loss points.

## Soft penalties

These are summed across the evaluation run:

- `console_errors * 35`
- `page_errors * 120`
- `request_failures * 60`
- `team_code_leaks * 80`
- `max(0, landing_clutter - 2) * 8`
- `app_shell_ms / 200`
- `agent_panel_ms / 250`
- `debug_ready_ms / 250`
- `trainer_open_ms / 150`
- `ceremony_modal_ms / 200`

## Definitions

- `landing_clutter`
  Count of visible interactive controls on the landing shell after excluding district hotspots, modal contents, and the agent panel. It is a rough proxy for "minimal UI".
- `team_code_leaks`
  Count of visible non-debug elements that expose `TEAM-XXXX-YYYY`.
- `app_shell_ms`
  Navigation-to-visible time for the town shell.
- `agent_panel_ms`
  Navigation-to-visible time for the global agent panel.
- `debug_ready_ms`
  Time for the debug surface to become actionable and show session context.
- `trainer_open_ms`
  Click-to-visible time for the trainer modal.
- `ceremony_modal_ms`
  Click-to-visible time for the `/create?embed=1` ceremony frame.

## Why This Shape

- Hard failures dominate latency wins.
- Team Code leaks are treated as both usability and product-contract regressions.
- The latency terms are only comparable on the same machine, which matches `autoresearch`'s machine-local benchmarking model.
- This is a fast proxy objective. Before shipping a meaningful win, run the full acceptance suite with `npm test`.
