# ZHC Current Status Snapshot

Status: M44.1 complete, M44.2 contract/mechanics complete, M44.3 Town Hall founder-progression slice complete, M44.4 modal handoff corrected and green, M44.5 HQ-first-entry modal surface green, M44.6 shared HQ naming slice green, M44.7 saved HQ name now projects into the House shell header and is green  
Last updated: 2026-03-16 22:36 Asia/Bangkok  
Branch: `zhc0-founders-loop`  
Worktree: `/Users/robin/.openclaw/workspace/Portal-zhc0`

## Active product direction (authoritative)

Robin clarified the constraints that currently govern the founders-loop passes:

### 1) Architecture
- the founder journey must stay in modals on top of `/app`
- do **not** continue the primary journey as standalone pages
- route-based pages can still exist as support surfaces, but the intended founder flow must hand back into the `/app` modal shell

### 2) Interaction / UI tone
- current UI is too text-heavy / explanatory
- explanatory/tutorial prose should move into docs
- in-product UI should be more functional, minimal, and timeless
- keep one obvious primary action per state
- the journey should feel explicitly like **the human and the agent succeeding together**
- early shared wins matter; prefer concise co-authored moments over dead explanatory panels where coherent
- Robin explicitly suggested house naming as a promising shared mechanic

## What landed this pass

### M44.7 — saved HQ name now brands the House modal header
The smallest coherent follow-on to M44.6 is now landed: once the pair saves the HQ name, the surrounding House shell starts using it.

What changed:
- the House modal header now stays generic (`Plan Wagons`) until the HQ name is actually saved
- once saved, the modal header switches to `<saved HQ name> HQ`
- after reload, the saved HQ name still appears in the header immediately when the House modal comes back
- unsaved typing does **not** rename the shell early; the naming payoff still happens through the existing single primary action

Implementation details:
- `public/app.js`
  - added a tiny header renderer for the House district modal title
  - derives the shell title from the already-saved local HQ name only
  - keeps the fallback title as `Plan Wagons` when no saved HQ name exists yet
  - re-renders the title through the existing HQ-entry render path so save/reload both stay in sync

### Why this matches the direction better
This gives the naming move visible payoff in the shell itself without broadening scope:
- still modal-only on `/app`
- still minimal and functional
- still one obvious primary action in the HQ entry state
- the saved shared name now feels like it actually changes the headquarters, not just one input field
- no fake chat, no extra ceremony layer, no persistence broadening

## New / updated contract coverage
- added: `e2e/429_zhc0_house_header_uses_saved_hq_name.spec.js`
  - verifies the House modal title starts as `Plan Wagons`
  - verifies saving the HQ name promotes it into the modal header as `<name> HQ`
  - verifies the same header title persists after reload for the same attached house

## Files changed in this slice

- `public/app.js`
- `e2e/429_zhc0_house_header_uses_saved_hq_name.spec.js`
- `docs/zhc-current-status.md`

## Evidence runs

### Focused founders-loop House naming/header sweep
```bash
node --check public/app.js && npx playwright test e2e/420_zhc0_house_first_entry_hq_surface.spec.js e2e/421_zhc0_house_shared_naming.spec.js e2e/428_zhc0_ceremony_modal_handoff.spec.js e2e/429_zhc0_house_header_uses_saved_hq_name.spec.js
```

Result:
- `4 passed`

## What I verified

- the first House HQ entry still lives inside the `/app` modal shell
- the shared HQ naming move still saves through the same single primary action
- the shell does **not** rename itself while the input is still just a draft
- after save, the House modal header switches to the saved HQ name
- after reload for the same house, the saved HQ name still appears in the House modal header immediately
- existing M44.5 / M44.6 / M44.4 focused coverage still passes alongside the new header projection test

## Honest gaps / remaining debt

- HQ naming still persists in browser local storage only
  - coherent for this UI slice, but still not written into server/session/platform state
- the saved HQ name now appears in the House shell header, but it is still not reused across broader product surfaces
  - for example: deeper mission copy, share cards, and longer-lived metadata still do not use it
- no screenshot evidence was captured in this pass

## What I did **not** do

- no push
- did **not** touch the unrelated dirty `package-lock.json`
- did **not** broaden persistence scope beyond existing local storage
- did **not** add extra actions or expand the flow beyond the current modal shell
- did **not** update deeper machine/spec artifacts (`docs/founders-loop-state-model.md`, `design/specs/10_founders_loop_ui_state_projection.md`, `design/specs/11_zhc0_ui_evidence_contract.md`, `specs/43_zhc0_founders_loop_state_contract.md`, `machines/FoundersLoop.machine.ts`)

## Blockers

- none for this slice
- conscious limitation remains persistence scope: local-only, by design, to keep the slice small and green

## Next exact pickup

Best next small follow-on:
1. project the saved HQ name into the Mission lane itself
   - strongest candidate now: the Mission panel heading/lead inside the same House modal shell
2. keep persistence local-only unless there is an exceptionally small safe path to broader state
3. keep the next move just as narrow
   - modal-only on `/app`
   - one obvious primary action per state
   - no broad mission rewrite or fake dialogue layer

## Repo state notes

- this M44.7 shell-header projection is local in this worktree only
- unrelated dirty file remains: `package-lock.json` (leave it alone unless explicitly intended)
