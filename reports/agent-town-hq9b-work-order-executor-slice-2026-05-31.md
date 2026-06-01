# Agent Town HQ9B Work-Order Executor Slice

Date: 2026-05-31
Worktree: `/Users/robin/Projects/Portal-atlas-editor`
Branch: `neo/progression-atlas-editor-next-2026-05-29`

## Summary

Implemented and tightened the next bounded HQ9 slice: a single explicit server-owned executor for `collect_ready_outputs_once` work-order drafts.

Baseline inspection found the dirty tree already contained much of the HQ9B route/tool/engine scaffolding. This pass kept that in-flight work, added the missing no-op/tamper guardrails, updated the external skill/API contracts, and captured read-model proof.

## Implemented

- `et.plot.execute_work_order` remains the only HQ9B executor path.
- The only executable template is `collect_ready_outputs_once`.
- Execution now rejects drafts with no ready same-plot outputs instead of completing an empty parent work order.
- Work-order selected building ids are de-duplicated before child execution.
- Each child collection revalidates same-plot `OUTPUT_READY` state before mutation.
- Agent execution keeps the parent human approval requirement and rechecks live `collectOutputs` policy/caps before child collection.
- Added focused unit coverage for:
  - empty-output rejection
  - tampered `allowedActions` rejection
  - ready output left unmutated after rejected execution
- Updated tool docs/contracts:
  - `public/skill.md`
  - `public/experiences/founders-plot/skill.md`
  - `public/experiences/founders-plot/tools.md`
  - `server/founders_plot/tools.js`
  - `specs/02_api_contract.md`
  - `docs/internal-skill-testline.md`
  - `e2e/55_phase3_skill_contract_line.spec.js`

## Authority Boundaries

- No generic work-order executor was added.
- No scheduler, autonomous loop, or background runner was added.
- No spending, placement, upgrades, doctrine selection, scouting, second-plot founding, settlement routing, world-grid mutation, or public/cross-player mutation was added.
- Progression Atlas action refs remain non-executable metadata; Founders Plot server routes own the mutation.
- Agent callers cannot approve their own execution. They need a matching human approval for `execute_work_order`, plus live `collectOutputs` policy and hourly cap availability.
- Parent idempotency is enforced through the existing mutation idempotency ledger. Child actions get receipt-linked child idempotency keys.

## Verification

Passed:

- `node --check server/founders_plot/engine.js`
- `node --check server/founders_plot/tools.js`
- `node --check tests-founders-plot/fp-unit.test.js`
- `node --check tests-founders-plot/fp-http.test.js`
- `node --check e2e/55_phase3_skill_contract_line.spec.js`
- `NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js` - 28/28
- `NODE_ENV=test node --test tests-founders-plot/fp-contract.test.js tests-founders-plot/fp-http.test.js` - 30/30
- `PW_PORT=4199 npx playwright test e2e/55_phase3_skill_contract_line.spec.js --project=chromium` - 3/3
- `PW_PORT=4199 npx playwright test e2e/200_founders_plot.spec.js e2e/114_progression_atlas_openclaw_lite.spec.js --project=chromium` - 14/14
- `git diff --check`

Note: the default Playwright port `4174` was already occupied, so targeted Playwright checks were rerun on `PW_PORT=4199`.

## Parent Review

Parent review on 2026-05-31 reran the Founders Plot unit, contract, and HTTP suites against the current dirty tree.

The first parent run caught an integration issue outside the executor itself: the new StarCraft-style HQ building prerequisite gates meant the older HTTP `reachHq` fixture still tried to upgrade to HQ4/HQ6 without first constructing the required Expedition Board and Market Stall. The fixture now follows the real gated progression path:

- Build Expedition Board before HQ4.
- Build Market Stall before HQ6.
- Re-check convoy coin/food resources after Market Stall sell output.

Parent verification after that adjustment passed:

- `node --check tests-founders-plot/fp-http.test.js`
- `NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js tests-founders-plot/fp-contract.test.js tests-founders-plot/fp-http.test.js` - 59/59
- `git diff --check`

## Proof

Read-model proof image:

- `/Users/robin/Projects/Portal-atlas-editor/reports/agent-town-hq9b-work-order-executor-read-model-proof-2026-05-31.png`

The proof run creates an unlocked HQ9B plot, seeds three ready outputs, drafts one `collect_ready_outputs_once` order, executes it, and shows:

- parent status `COMPLETED`
- two child `et.plot.collect_outputs` receipts
- inventory delta `wood +12`, `food +9`, `stone +0`, `coin +0`
- the third seeded ready output still in `OUTPUT_READY`
- child authority boundary `server_owned_child_collect_outputs_same_plot_no_spend`

## Remaining Gaps

- No Founders Plot UI controls were added for reviewing/executing drafts; this slice is API/tool-contract first.
- No full `npm test` run was performed in this pass; targeted Founders Plot and skill-contract coverage passed.
