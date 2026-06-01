# AgentTown Heartbeat Reactivation and Active Lanes

Date: 2026-05-31
Worktree: `/Users/robin/Projects/Portal-atlas-editor`
Branch: `neo/progression-atlas-editor-next-2026-05-29`

## Trigger

Robin reactivated the AgentTown heartbeat at 2026-05-31 09:28 +07 after subscription limits reset.

Directive:

- Fix image/UI/UX issues.
- Improve the Progression Atlas general UI/UX with GPT Image 2.0 help.
- Start another implementation lane.
- Keep asset generation on par with gameplay development.
- Produce handoffs with image proof for each milestone.

## Active Lanes

### Herschel: Image/UI/UX and Progression Atlas Polish

Agent ID: `019e7be0-6db3-72e1-9eef-f04981d4eec2`

Scope:

- Audit and fix image, asset, responsive, and UI/UX issues.
- Improve Progression Atlas as an operational AgentTown planning/workbench surface.
- Use GPT Image 2.0 where it materially improves real game/tool surfaces.
- Persist generated assets into the repo, not only OpenClaw media.
- Produce Markdown report plus screenshot/contact-sheet proof images.

Primary ownership:

- `public/progression-atlas.*`
- `public/experiences/founders-plot/*` frontend/visual files
- `public/experiences/founders-plot/assets/**`
- `public/assets/icons/agent-town/**`
- visual/UI e2e tests and reports

### Hubble: Next Gameplay Implementation Lane

Agent ID: `019e7be0-cdda-7031-bdd8-98cb09080b39`

Scope:

- Continue after HQ9A Cohort Work-Order draft planner.
- Recommended target: HQ9B single safe executor for `collect_ready_outputs_once`.
- Keep gameplay truth server-owned in engine/store/routes/tools/tests.
- Keep Progression Atlas advisory unless engine-promoted.
- Produce Markdown report plus proof artifact images/screenshots.

Primary ownership:

- `server/founders_plot/engine.js`
- `server/founders_plot/store.js`
- `server/founders_plot/routes.js`
- `server/founders_plot/tools.js`
- `server/founders_plot/progression_atlas.js`
- `tests-founders-plot/*.test.js`
- tool/skill docs and reports

## GPT Image 2.0 Task

Task ID: `129ecb59-b5eb-427b-bfc2-70b78a649571`

Output target:

- `agent-town-pathfinder-scout-sprite-sheet-v1-opaque.png`

Purpose:

- Generate the missing dedicated 4x4 pathfinder scout sprite sheet.
- Replace the current visual-only scout placeholder that reuses Rook's messenger sprite.
- Use opaque/chroma background for local cleanup because GPT Image 2.0 does not support native transparency.

## Heartbeat Rules

Future heartbeat polls may continue the AgentTown push when there is no newer conflicting instruction.

Required for each milestone:

- Markdown report in `reports/`.
- Image proof in `reports/`: screenshot, contact sheet, generated asset preview, or visual API proof.
- Focused verification commands.
- `git diff --check`.

Do not push, merge, deploy, post publicly, send external messages, clean unrelated files, or rewrite branches from heartbeat.
