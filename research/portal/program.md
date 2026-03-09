# Portal Autoresearch Program

This is an `autoresearch`-style loop for improving Portal itself.

## Setup

To start a new run, work with the user to:

1. Agree on a run tag based on today's date.
2. Create a fresh branch named `codex/portal-autoresearch-<tag>`.
3. Read the in-scope files:
   - `README.md`
   - `research/portal/README.md`
   - `research/portal/loss.md`
   - `research/portal/evaluate.mjs`
   - `research/portal/program.md`
   - `e2e/31_phase1_landing_minimal.spec.js`
   - `e2e/53_agent_panel_global_presence.spec.js`
   - `e2e/59_townhall_worker_single_path_modal.spec.js`
   - `e2e/73_experience_trainer_entry.spec.js`
   - `e2e/108_llm_proxy_ssrf_guard.spec.js`
   - `e2e/57_phase3_onboarding_wallet_llm_persist.spec.js`
4. Run `npm install` if dependencies are missing.
5. Run `npm run research:portal:prepare`.
6. Run the baseline once: `npm run research:portal:eval`.
7. Confirm the baseline artifact and `results.tsv` exist.

## Editable surface

Prefer product changes in:

- `public/`
- `server/`

Do not modify:

- `research/portal/*`
- the loss definition
- the evaluator itself

The whole point is to keep the measurement stable while the product changes.

## Goal

Minimize `loss` from `research/portal/evaluate.mjs`.

This is not the full quality bar. It is a fast proxy for:

- minimal UI
- observability
- modal continuity
- runtime cleanliness
- loopback SSRF protection
- missing-cookie session continuity via Team Code hint

If you get a meaningful win, validate it separately with `npm test`.

## Output format

The evaluator prints a footer like:

```text
---
loss:                23.117
hard_failures:       0
console_errors:      0
page_errors:         0
request_failures:    0
landing_clutter:     3
team_code_leaks:     0
app_shell_ms:        688.4
agent_panel_ms:      511.1
debug_ready_ms:      1180.2
trainer_open_ms:     344.8
ceremony_modal_ms:   921.6
playwright_seconds:  6.7
artifact:            research/portal/artifacts/last-run.json
```

Lower is better.

## Logging results

Append each experiment to the untracked `research/portal/results.tsv`:

```text
commit	loss	status	hard_failures	console_errors	page_errors	request_failures	description
```

Rules:

1. `commit` is the short git hash.
2. `loss` is the scalar from the footer. Use `1000000.000` for catastrophic crashes.
3. `status` is `keep`, `discard`, or `crash`.
4. `description` is a short note about the idea.

## Experiment loop

LOOP:

1. Check the current kept commit on the research branch.
2. Make one concrete product change.
3. Commit it.
4. Run `npm run research:portal:eval > run.log 2>&1`.
5. Read the footer from `run.log`.
6. If the evaluator crashed or did not print a footer, inspect the log, fix obvious issues once, and retry. Otherwise record it as `crash`.
7. Append the result to `research/portal/results.tsv`.
8. If `loss` improved, keep the commit as the new branch head.
9. If `loss` is equal or worse, restore the branch to the last kept commit and try a new idea.

## Strategy guidance

- Prefer changes that reduce friction without violating the repo's modal-first and worker-first constraints.
- Simpler wins beat tiny score gains with ugly complexity.
- Do not game the harness by hiding required UI or stripping debug surfaces the product depends on.
- If two changes tie on loss, keep the simpler and more readable one.
