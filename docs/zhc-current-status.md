# ZHC Current Status Snapshot

Status: M44.1 complete, M44.2 contract/mechanics complete, M44.3 Town Hall founder-progression slice complete, M44.4 modal handoff corrected and green, M44.5 HQ-first-entry modal surface green, M44.6 shared HQ naming slice green, M44.7 saved HQ name now projects into the House shell header and is green, M44.8 saved HQ name now brands the Mission lane heading/lead and is green, M44.9 saved HQ name now reaches the Mission detail line and is green, M44.10 saved HQ name now reaches the Mission empty-state copy and is green, M44.11 no-experience Mission detail hint is now truthful before save and HQ-branded after save and is green  
Last updated: 2026-03-17 00:34 +0700  
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

### M44.11 — no-experience Mission detail hint no longer lies
The next smallest coherent follow-on to M44.10 is now landed: when House Mission has no routed experiences, the Mission detail hint inside the same modal shell no longer tells the pair to select an experience that does not exist.

What changed:
- when Mission opens with no available experiences and no saved HQ name yet, the detail hint now stays generic:
  - `Entry points appear here once an experience is routed in.`
- after the HQ name is saved, the same no-experience detail hint becomes:
  - `Entry points for <saved HQ name> HQ appear here once an experience is routed in.`
- after reload, reopening Mission for the same attached house restores that same HQ-branded no-experience detail hint immediately
- selected-experience detail copy is unchanged; only the empty Mission-detail hint path moved

Implementation details:
- `public/app.js`
  - added a dedicated no-experience Mission detail helper derived only from the already-saved local HQ name
  - switched the no-items Mission detail path to use that helper instead of the generic "Select an experience..." copy
  - left the selected-experience detail line untouched so the slice stays tight
- `e2e/433_zhc0_mission_empty_detail_hint_uses_saved_hq_name.spec.js`
  - added focused coverage for generic-before-save behavior plus the HQ-branded payoff after save and reload

### Why this matches the direction better
This keeps the Mission lane internally honest without widening scope:
- still modal-only on `/app`
- still minimal and functional
- still one obvious primary action in the HQ entry state
- the saved shared name now changes the House shell header, Mission heading/lead, selected Mission detail line, Mission empty-state copy, and Mission no-experience detail hint
- no fake chat, no dialogue sprawl, no persistence broadening

## New / updated contract coverage
- added: `e2e/433_zhc0_mission_empty_detail_hint_uses_saved_hq_name.spec.js`
  - verifies the no-experience Mission detail hint stays generic before save
  - verifies saving the HQ name promotes that hint into HQ-branded copy
  - verifies the same HQ-branded hint returns after reload when the same house reopens Mission

## Files changed in this slice

- `public/app.js`
- `e2e/433_zhc0_mission_empty_detail_hint_uses_saved_hq_name.spec.js`
- `docs/zhc-current-status.md`

## Evidence runs

### Focused M44.11 no-experience Mission detail hint check
```bash
node --check public/app.js && npx playwright test e2e/433_zhc0_mission_empty_detail_hint_uses_saved_hq_name.spec.js
```

Result:
- `1 passed`

### Focused founders-loop House naming / Mission projection sweep
```bash
node --check public/app.js && npx playwright test e2e/420_zhc0_house_first_entry_hq_surface.spec.js e2e/421_zhc0_house_shared_naming.spec.js e2e/428_zhc0_ceremony_modal_handoff.spec.js e2e/429_zhc0_house_header_uses_saved_hq_name.spec.js e2e/430_zhc0_mission_panel_uses_saved_hq_name.spec.js e2e/431_zhc0_mission_detail_uses_saved_hq_name.spec.js e2e/432_zhc0_mission_empty_state_uses_saved_hq_name.spec.js e2e/433_zhc0_mission_empty_detail_hint_uses_saved_hq_name.spec.js e2e/188_house_experiences_surface.spec.js
```

Result:
- `9 passed`

### Modal screenshot baseline captured
Saved via a local Playwright capture harness against the test server:
- `docs/evidence/zhc0-modal-baseline-2026-03-17/01_house_hq_entry_generic.png`
- `docs/evidence/zhc0-modal-baseline-2026-03-17/02_house_mission_named_empty.png`
- `docs/evidence/zhc0-modal-baseline-2026-03-17/03_house_mission_named_empty_reload.png`

These pin the current M44.5–M44.11 modal-shell baseline before any further UI changes.

## What I verified

- the founder journey still stays inside the `/app` modal shell
- Mission can still open with generic no-experience copy before any HQ name is saved
- the shared HQ naming move still saves through the same single primary action
- the House modal header still projects the saved HQ name
- the Mission panel heading and lead still project the saved HQ name
- the selected Mission detail line still projects the saved HQ name
- the Mission empty-state still projects the saved HQ name when no experiences are routed yet
- the Mission no-experience detail hint now stays truthful instead of telling the pair to select a missing experience
- after reload for the same house, reopening Mission restores the saved HQ-branded no-experience detail hint
- the broader House Experiences surface contract still passes after the hint change

## Honest gaps / remaining debt

- HQ naming still persists in browser local storage only
  - coherent for this UI slice, but still not written into server/session/platform state
- deeper downstream surfaces beyond the current Mission lane still do not reuse the saved HQ name
  - examples: share-card copy, longer-lived metadata, and other downstream detail surfaces
- screenshot baseline is now captured for the current M44.5–M44.11 modal shell, but there is still no broader Town Hall / ceremony / downstream evidence pack
- I did **not** make a local commit for M44.11 yet
  - slice is coherent and green, but remains uncommitted in this worktree

## What I did **not** do

- no push
- did **not** touch the unrelated dirty `package-lock.json`
- did **not** broaden persistence scope beyond existing local storage
- did **not** add extra actions or expand the flow beyond the current modal shell
- did **not** rewrite selected-experience Mission copy beyond the empty-detail-hint path
- did **not** update deeper machine/spec artifacts (`docs/founders-loop-state-model.md`, `design/specs/10_founders_loop_ui_state_projection.md`, `design/specs/11_zhc0_ui_evidence_contract.md`, `specs/43_zhc0_founders_loop_state_contract.md`, `machines/FoundersLoop.machine.ts`)

## Blockers

- none for this slice
- conscious limitation remains persistence scope: local-only, by design, to keep the slice small and green

## Next exact pickup

Safest next move is still **not another Mission rewrite**.

Best next pickup:
1. decide the next equally small saved-HQ projection **outside** the current Mission microcopy cluster
2. strongest candidates now are downstream-but-local surfaces like share-card wording, a tiny House support line, or another early shell detail that immediately benefits from the saved HQ name
3. optionally make a clean local commit for the M44.11 hint-fix + screenshot-evidence checkpoint before moving on
4. keep persistence local-only unless there is an exceptionally small safe path to broader state
5. keep the next move just as narrow
   - modal-only on `/app`
   - one obvious primary action per state
   - no broad mission rewrite or fake dialogue layer

## Repo state notes

- this M44.11 Mission-detail-hint projection is local in this worktree only
- unrelated dirty file remains: `package-lock.json` (leave it alone unless explicitly intended)
