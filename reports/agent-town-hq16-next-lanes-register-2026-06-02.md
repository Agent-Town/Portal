# AgentTown HQ16 Next Lanes Register

Date: 2026-06-02 13:43 +07
Branch: `neo/progression-atlas-editor-next-2026-05-29`
Base checkpoint: `1f6773e Add AgentTown direct map command preview`

## North Star Gap

HQ15/HQ16A made the Expedition Map much closer to a playable command surface: server-owned units, command targets, direct map preview, and guarded Confirm/Cancel are live. The remaining gap is the full satisfying loop:

`objective -> command -> resolve -> receipt -> unlock/build/settle/survey -> next objective`

The next lanes should make confirmed commands feel immediate and legible, then connect them into one guided expedition loop without loosening server authority.

## Lane Order

### HQ16B - Command Outcome Feedback

Goal: after confirming a command from the map, the result should be visible on the map before the player has to read drawers or toasts.

Expected work:
- Animate or pulse the affected unit/cell/receipt/objective after `move_unit`, `scout_sector`, `prepare_settler_convoy`, and `found_settlement`.
- Keep all mutations routed through the existing guarded frontend handlers and server endpoints.
- Add/adjust focused browser proof around direct map preview -> Confirm -> visible outcome.
- Produce report/proof and screenshots if browser proof runs.

Primary write scope:
- `public/experiences/founders-plot/founders-plot.js`
- `public/experiences/founders-plot/founders-plot.css`
- `public/experiences/founders-plot/three_scene_entry.js`
- `public/experiences/founders-plot/three_scene_bundle.js`
- `e2e/200_founders_plot.spec.js`
- `e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
- `reports/agent-town-hq16b-*`

### HQ16C - Guided Expedition Loop

Goal: turn the current command pieces into one compact vertical loop the player can follow.

Expected work:
- Define and, if safe, implement a small guided loop read surface using existing server-owned state only.
- Show the next actionable step across Scout move, Scout Sector, Surveyor/Prepare Convoy, and Settler/Found Outpost.
- Avoid adding broad new server authority unless the lane explicitly proves a tiny read-model-only extension.
- Produce report/proof; if implementation is too coupled with HQ16B, write a precise blocked/preflight handoff instead.

Primary write scope:
- Prefer report/spec/test fixture work unless HQ16B has landed.
- `reports/agent-town-hq16c-*`
- Optional after HQ16B: `public/experiences/founders-plot/founders-plot.js`, `founders-plot.css`, focused e2e.

### HQ16D - Location Visit Layer Preflight

Goal: define the first visitable known/discovered sector scene so the map can lead into places, not just cells.

Expected work:
- Identify the smallest safe route from selected known/discovered sector -> visit layer -> receipt/event context -> return to map.
- Keep hidden sectors sealed; no hidden resources/routes/truth.
- Prefer report/proof/design sketch first unless a tiny UI-only prototype is clearly safe and disjoint.

Primary write scope:
- `reports/agent-town-hq16d-*`
- Optional later UI prototype only after HQ16B/C review.

### HQ16E - Runtime Visual Pack Backlog

Goal: list the next high-impact generated/runtime art slots that make the map feel closer to the GPT Image 2 north-star while staying packable and server-slot-bound.

Expected work:
- Prioritize terrain states, location scene thumbnails, event/receipt state markers, command outcome effects, and UI frame/swatch assets.
- Record manifest/provenance/slot requirements.
- No image generation or runtime promotion unless explicitly approved in a later lane.

Primary write scope:
- `reports/agent-town-hq16e-*`

## Guardrails

- No deploy, merge, public post, external message, or cleanup without Robin's explicit later request.
- No Atlas execution, Generated Universe runtime expansion, hidden autonomy, hidden-truth leakage, cross-plot mutation, combat, scheduler/background automation, external effects, or route/trade/economy/resource/reward expansion.
- Scout Sector remains the only fog reveal path.
- Scout movement stays adjacent discovered/known same-plot only.
- Surveyor/Settler commands must use existing guarded endpoints unless a later lane explicitly scopes and proves a new server-owned mutation.
- Command target rings may become preview triggers, but renderer-side objects must not directly execute mutations.

## Active Delegation Plan

- Start HQ16B as the first implementation worker.
- Start HQ16C as a parallel product/loop worker with report-first scope to avoid clashing with HQ16B.
- Start HQ16D/HQ16E as report-first sidecar workers if there is enough agent capacity; their output should guide the next implementation lane rather than editing the same frontend files now.
