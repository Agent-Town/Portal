# OpenRouter Scope Quarantine

## Why this is present
This repository line still contains earlier OpenRouter and OpenClaw Lite gateway changes that predate the V1.4 Founders Plot AI-reality sprint. The older V1.3.1 signoff guard checks the branch diff against `codex/founders-plot-v1-3-visual-surface`, so this quarantine note records that inherited scope instead of pretending those files are unrelated to the current branch.

## Files changed
- `public/llm_catalog.js`
- `public/house.js`
- `public/openclaw-lite/llm-config-library.js`
- `public/openclaw-lite/gateway.js`
- `public/openclaw-lite/gateway.js.map`
- `vendors/openclaw-lite-main/src/openclaw-lite/gateway.js`

## Owner
Codex implementation branch owner for `codex/founders-plot-v1-4-ai-reality`.

## Reviewer / signoff
Pending human review on top of the V1.4 Founders Plot sprint verification.

## Tests run
- `npx playwright test e2e/168_founders_plot_scope_quarantine.spec.js`
- `npx playwright test e2e/174_founders_plot_v1_4_scope_quarantine.spec.js`
- `npm test`

## Impact on Founders Plot visual signoff
No new V1.4 player-surface work depends on changing the OpenRouter proxy or gateway UI. The V1.4 sprint keeps those older files quarantined as inherited runtime support while Founders Plot visual behavior is validated through the dedicated V1.4 player-surface and Foreman tests.

## Rollback plan
If the inherited OpenRouter scope needs to be separated again, revert the gateway/catalog/library files above to the `codex/founders-plot-v1-3-visual-surface` baseline while keeping the V1.4 Founders Plot worker, route, recap, and documentation changes on this branch.
