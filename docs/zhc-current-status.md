# ZHC Current Status Snapshot

Status: M44.1 complete, M44.2 contract/mechanics complete, M44.3 Town Hall founder-progression slice complete, M44.4 modal handoff corrected and green, M44.5 HQ-first-entry modal surface green, M44.6 shared HQ naming slice green, M44.7 saved HQ name now projects into the House shell header and is green, M44.8 saved HQ name now brands the Mission lane heading/lead and is green  
Last updated: 2026-03-16 22:55 +07  
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

### M44.8 — saved HQ name now brands the Mission lane heading and lead
The next smallest coherent follow-on to M44.7 is now landed: once the pair saves the HQ name, the early Mission lane itself starts using it.

What changed:
- after the HQ name is saved, the Mission panel heading becomes `Mission · <saved HQ name> HQ`
- the Mission panel lead becomes `Pick the next shared task for <saved HQ name> HQ.`
- the Mission lane still falls back to generic copy before any HQ name is saved
- after reload, reopening Mission for the same attached house restores the same named Mission copy immediately

Implementation details:
- `public/app.js`
  - added a tiny Mission-panel copy helper that derives from the already-saved local HQ name only
  - wired the Mission lane render path to refresh its heading and lead whenever the surface renders
  - kept the fallback Mission copy generic when no saved HQ name exists yet
- `public/views/house.html`
  - added stable ids / testids for the Mission heading and lead so the contract stays explicit

### Why this matches the direction better
This gives the shared HQ naming move visible payoff exactly where the pair heads next:
- still modal-only on `/app`
- still minimal and functional
- still one obvious primary action in the HQ entry state
- the saved shared name now changes both the House shell header and the early Mission lane
- no fake chat, no dialogue sprawl, no persistence broadening

## New / updated contract coverage
- added: `e2e/430_zhc0_mission_panel_uses_saved_hq_name.spec.js`
  - verifies saving the HQ name promotes it into the Mission panel heading
  - verifies the Mission lead also uses the saved HQ name
  - verifies the same Mission copy returns after reload when the same house reopens Mission

## Files changed in this slice

- `public/app.js`
- `public/views/house.html`
- `e2e/430_zhc0_mission_panel_uses_saved_hq_name.spec.js`
- `docs/zhc-current-status.md`

## Evidence runs

### Focused founders-loop House naming / Mission projection sweep
```bash
node --check public/app.js && npx playwright test e2e/420_zhc0_house_first_entry_hq_surface.spec.js e2e/421_zhc0_house_shared_naming.spec.js e2e/428_zhc0_ceremony_modal_handoff.spec.js e2e/429_zhc0_house_header_uses_saved_hq_name.spec.js e2e/430_zhc0_mission_panel_uses_saved_hq_name.spec.js
```

Result:
- `5 passed`

## What I verified

- the founder journey still stays inside the `/app` modal shell
- the shared HQ naming move still saves through the same single primary action
- the House modal header still projects the saved HQ name
- the Mission panel heading now projects the same saved HQ name after save
- the Mission lead also uses the saved HQ name without adding extra actions or explanatory sprawl
- after reload for the same house, reopening Mission restores the saved HQ-branded Mission copy
- existing M44.5 / M44.6 / M44.4 / M44.7 focused coverage still passes alongside the new Mission projection test

## Honest gaps / remaining debt

- HQ naming still persists in browser local storage only
  - coherent for this UI slice, but still not written into server/session/platform state
- the saved HQ name now appears in the House shell header and Mission heading/lead, but deeper product surfaces still do not reuse it
  - for example: selected-experience detail copy, share cards, and longer-lived metadata are still generic
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
1. project the saved HQ name one step deeper into the Mission lane itself
   - strongest candidate now: the selected-experience detail / empty-state copy inside the same House modal shell
2. keep persistence local-only unless there is an exceptionally small safe path to broader state
3. keep the next move just as narrow
   - modal-only on `/app`
   - one obvious primary action per state
   - no broad mission rewrite or fake dialogue layer

## Repo state notes

- this M44.8 Mission-lane projection is local in this worktree only
- unrelated dirty file remains: `package-lock.json` (leave it alone unless explicitly intended)
