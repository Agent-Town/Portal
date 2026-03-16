# ZHC Current Status Snapshot

Status: M44.1 complete, M44.2 contract/mechanics complete, M44.3 Town Hall founder-progression slice complete, M44.4 modal handoff corrected and green, M44.5 HQ-first-entry modal surface green, M44.6 shared HQ naming slice green, M44.7 saved HQ name now projects into the House shell header and is green, M44.8 saved HQ name now brands the Mission lane heading/lead and is green, M44.9 saved HQ name now reaches the Mission detail line and is green, M44.10 saved HQ name now reaches the Mission empty-state copy and is green  
Last updated: 2026-03-17 00:06 +0700  
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

### M44.10 — saved HQ name now reaches the Mission empty-state copy
The next smallest coherent follow-on to M44.9 is now landed: when House Mission has no routed experiences, the empty-state copy inside the same modal shell now reflects the saved HQ name.

What changed:
- when Mission opens before any HQ name is saved, the empty-state still stays generic:
  - `No House experiences available yet.`
- after the HQ name is saved, the same Mission empty-state becomes:
  - `No experiences routed to <saved HQ name> HQ yet.`
- after reload, reopening Mission for the same attached house restores that same HQ-branded empty-state copy immediately
- the House surface status line now mirrors the same empty-state copy when the Mission list is empty, so the modal shell stays internally consistent without adding new UI

Implementation details:
- `public/app.js`
  - added a tiny Mission empty-state copy helper derived only from the already-saved local HQ name
  - reused that helper for both the Mission empty-state text and the empty-list status line
  - kept the old generic empty-state when no HQ name is saved yet
- `e2e/432_zhc0_mission_empty_state_uses_saved_hq_name.spec.js`
  - added focused coverage for generic-before-save behavior plus the branded empty-state payoff after save and reload

### Why this matches the direction better
This keeps the shared naming move paying off one layer deeper without bloating the flow:
- still modal-only on `/app`
- still minimal and functional
- still one obvious primary action in the HQ entry state
- the saved shared name now changes the House shell header, Mission heading/lead, Mission detail line, and Mission empty-state copy
- no fake chat, no dialogue sprawl, no persistence broadening

## New / updated contract coverage
- added: `e2e/432_zhc0_mission_empty_state_uses_saved_hq_name.spec.js`
  - verifies Mission empty-state copy stays generic before save
  - verifies saving the HQ name promotes it into the empty-state copy
  - verifies the same empty-state copy returns after reload when the same house reopens Mission

## Files changed in this slice

- `public/app.js`
- `e2e/432_zhc0_mission_empty_state_uses_saved_hq_name.spec.js`
- `docs/zhc-current-status.md`

## Evidence runs

### Focused M44.10 Mission empty-state naming check
```bash
node --check public/app.js && npx playwright test e2e/432_zhc0_mission_empty_state_uses_saved_hq_name.spec.js
```

Result:
- `1 passed`

### Focused founders-loop House naming / Mission projection sweep
```bash
node --check public/app.js && npx playwright test e2e/420_zhc0_house_first_entry_hq_surface.spec.js e2e/421_zhc0_house_shared_naming.spec.js e2e/428_zhc0_ceremony_modal_handoff.spec.js e2e/429_zhc0_house_header_uses_saved_hq_name.spec.js e2e/430_zhc0_mission_panel_uses_saved_hq_name.spec.js e2e/431_zhc0_mission_detail_uses_saved_hq_name.spec.js e2e/432_zhc0_mission_empty_state_uses_saved_hq_name.spec.js e2e/188_house_experiences_surface.spec.js
```

Result:
- `8 passed`

## What I verified

- the founder journey still stays inside the `/app` modal shell
- Mission can still open with generic empty-state copy before any HQ name is saved
- the shared HQ naming move still saves through the same single primary action
- the House modal header still projects the saved HQ name
- the Mission panel heading and lead still project the saved HQ name
- the selected Mission detail line still projects the saved HQ name
- the Mission empty-state now also projects the saved HQ name when no experiences are routed yet
- after reload for the same house, reopening Mission restores the saved HQ-branded empty-state copy
- the broader House Experiences surface contract still passes after the empty-state copy change

## Honest gaps / remaining debt

- HQ naming still persists in browser local storage only
  - coherent for this UI slice, but still not written into server/session/platform state
- when no experiences exist, the Mission detail hint still says `Select an experience...`
  - this is now the most obvious small mismatch beside the improved empty-state copy
- deeper product surfaces beyond the Mission lane still do not reuse the saved HQ name
  - examples: share-card copy, longer-lived metadata, and other downstream detail surfaces
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
1. when no experiences are available, replace the Mission detail hint so it no longer tells the pair to select an experience that does not exist
2. keep that hint aligned with the saved HQ name when one exists and generic before save
3. keep persistence local-only unless there is an exceptionally small safe path to broader state
4. keep the next move just as narrow
   - modal-only on `/app`
   - one obvious primary action per state
   - no broad mission rewrite or fake dialogue layer

## Repo state notes

- this M44.10 Mission-empty-state projection is local in this worktree only
- unrelated dirty file remains: `package-lock.json` (leave it alone unless explicitly intended)
