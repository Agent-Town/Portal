# ZHC Current Status Snapshot

Status: M44.1 complete, M44.2 contract/mechanics complete, M44.3 Town Hall founder-progression slice complete, M44.4 logic/gating coverage still green but now has a route-architecture conflict, M44.5 HQ-first-entry has been re-homed into the `/app` modal flow and is green  
Last updated: 2026-03-16 20:58 Asia/Bangkok  
Branch: `zhc0-founders-loop`  
Worktree: `/Users/robin/.openclaw/workspace/Portal-zhc0`

## Architecture correction (authoritative)

Robin clarified a hard product constraint during this pass:
- the whole founder journey must stay in modals on top of `/app`
- do **not** continue building the journey as standalone pages
- treat this as higher priority than prior route-based assumptions

What that means right now:
- the earlier standalone-route M44.5 HQ-first-entry prototype on raw `/house` is **not** the target architecture and was not kept as the current slice
- the useful M44.5 learnings were re-homed into the House modal surface under `/app`
- the existing M44.4 `/create`-based presentation is now a known architecture conflict/debt; keep its gating learnings, but do **not** extend that standalone route as the long-term journey shape

## What landed this pass

### M44.5 — House / HQ first-entry surface, re-homed into the `/app` modal shell
Completed conservatively inside the House district modal instead of on a standalone route.

Key changes:
- added a dedicated HQ-first-entry surface inside `public/views/house.html`
  - root: `#houseHqEntryPanel`
  - machine markers: `data-zhc-phase="house_ready"`, `data-zhc-progress-step="6"`, `data-zhc-progress-total="9"`, `data-zhc-overlay-state="ready"`, `data-zhc-next-unlock="first_mission"`
  - this surface stays inside the existing `/app` modal flow
- re-framed House as HQ within the modal shell
  - first visible rooms now call out: mission lane, memory, workshop, and mailroom
  - copy explicitly says the operating shell stays inside `/app`
- made one obvious primary move for the HQ-ready state
  - new button: `#houseHqStartMissionBtn`
  - it opens the existing Experiences surface as the conservative “mission lane” handoff inside the same modal shell
- kept deeper systems present but de-emphasized
  - `houseConsolePanel` now separates `Day-one rooms` from `Later-loop / deep ops`
  - Tracks / Archive / Trainer remain reachable, but they are no longer framed as the first thing the player should do
- preserved existing House modal entry-point behavior
  - trainer entry still works
  - workshop entry still works
  - library entry still works
- added the modal-correct M44.5 Playwright contract
  - `e2e/420_zhc0_house_first_entry_hq_surface.spec.js`
- reusable HQ card styling lives in `public/styles.css`

Relevant files:
- `public/app.js`
- `public/views/house.html`
- `public/styles.css`
- `e2e/420_zhc0_house_first_entry_hq_surface.spec.js`
- `docs/zhc-current-status.md`

## Evidence runs

### Focused M44.5 modal contract

```bash
npx playwright test e2e/420_zhc0_house_first_entry_hq_surface.spec.js
```

Result:
- `1 passed`

### Focused House-modal regression sweep after re-homing M44.5 into `/app`

```bash
npx playwright test \
  e2e/420_zhc0_house_first_entry_hq_surface.spec.js \
  e2e/149_house_trainer_minimal_view.spec.js \
  e2e/200_workshop_editor_surface.spec.js \
  e2e/261_house_library_icon_first_storefront.spec.js
```

Result:
- `5 passed`

## What I verified

- the HQ-first-entry surface now lives inside the House modal on `/app`, not on a standalone `/house` page
- once a House is attached to the current session, the modal exposes a clear HQ surface with mission / memory / workshop / mailroom framing
- there is exactly one visible founders-loop primary action on that surface
- the primary action opens the existing Experiences surface inside the same modal shell
- pre-existing House modal regressions for trainer, workshop, and library entry points stayed green after the re-home

## Conflicts / honest gaps

- **Known architecture conflict:** M44.4 still presents part of the founder journey through standalone `/create` (and the older raw `/house` path still exists). Per Robin’s correction, that is now technical/product debt, not target architecture.
- this pass did **not** yet re-home the M44.4 crest/house handoff out of standalone route flow
- the “mission lane” is still the conservative Experiences handoff, not a bespoke Step 7 mission implementation yet
- no modal screenshot evidence has been captured yet after the architecture correction

## What I did **not** do

- no push
- did **not** extend standalone `/create` or raw `/house` as the journey target
- did **not** modify the artifact chain (`docs/founders-loop-state-model.md`, `design/specs/10_founders_loop_ui_state_projection.md`, `design/specs/11_zhc0_ui_evidence_contract.md`, `specs/43_zhc0_founders_loop_state_contract.md`, `machines/FoundersLoop.machine.ts`) in this pass
- did **not** start a bespoke Step 7 mission implementation yet

## Next exact pickup

Most conservative next move:
1. re-home the remaining route-based founder journey handoff (`/create` → raw `/house`) into Town Hall / House modal flow on `/app`
2. keep `e2e/420_zhc0_house_first_entry_hq_surface.spec.js` as the contract anchor while adding the next modal-correct founders-loop test
3. decide the smallest viable Step 7 mission contract that still stays inside the same `/app` modal shell
4. capture modal screenshot evidence once the corrected flow stabilizes a bit more

## Repo state notes

The modal-correct M44.5 slice is local in this worktree.

There is still a pre-existing unrelated `package-lock.json` modification outside this founders-loop slice. Treat the worktree as dirty when resuming, and avoid sweeping that file into the next pass unless explicitly intended.
