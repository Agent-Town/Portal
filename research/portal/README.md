# Portal Autoresearch

This is an `autoresearch`-style harness for improving Portal itself instead of a model.

The structure mirrors the useful part of [`karpathy/autoresearch`](https://github.com/karpathy/autoresearch):

- fixed prep step
- fixed evaluator and loss
- untracked `results.tsv`
- agent instructions for a keep/discard loop

## Files

- `research/portal/prepare.mjs` — one-time setup check and `results.tsv` initialization.
- `research/portal/evaluate.mjs` — fixed Playwright-backed evaluator. This is the ground-truth loss harness.
- `research/portal/loss.md` — exact scalar loss definition.
- `research/portal/program.md` — instructions for the autonomous improvement loop.
- `research/portal/results.tsv` — untracked experiment ledger.
- `research/portal/artifacts/last-run.json` — last evaluator artifact, also untracked.

## What It Optimizes

The harness targets Portal's quality and usability in the areas that are most central to this repo's agreements:

- minimal landing shell
- stable agent-panel observability
- modal-first trainer access
- modal-first ceremony flow
- low UI/runtime noise: console errors, page errors, request failures, Team Code leaks

This is intentionally a proxy objective, not the full product definition of done. Iterate quickly with this harness, then validate stronger candidates with `npm test`.

The evaluator also includes two server regression guards that recently failed in the full suite:

- loopback SSRF blocking for `/api/llm/proxy/*`
- missing-cookie session recovery via `x-team-code-hint`

## Commands

```bash
npm run research:portal:prepare
npm run research:portal:eval
npm run research:portal:app
```

`npm run research:portal:app` is a small Codex-app bootstrap helper. It:

- runs prepare,
- runs a baseline eval when needed,
- optionally supports `-- --baseline` or `-- --full-test`,
- prints a ready-to-paste prompt for an app session.

The evaluator prints a parseable footer:

```text
---
loss:                0.000
hard_failures:       0
console_errors:      0
page_errors:         0
request_failures:    0
landing_clutter:     0
team_code_leaks:     0
app_shell_ms:        0.0
agent_panel_ms:      0.0
debug_ready_ms:      0.0
trainer_open_ms:     0.0
ceremony_modal_ms:   0.0
playwright_seconds:  0.0
artifact:            research/portal/artifacts/last-run.json
```

Lower is better.

## Results Ledger

`prepare.mjs` initializes this untracked file:

```text
commit	loss	status	hard_failures	console_errors	page_errors	request_failures	description
```

Use `keep`, `discard`, or `crash` for `status`.

## Scope

The evaluator is fixed. Product changes should stay focused on Portal app code:

- `public/`
- `server/`

Avoid modifying `research/portal/*` during experiments or you invalidate comparability.
