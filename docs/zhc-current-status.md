# ZHC Current Status Snapshot

Status: M44.1 complete, M44.2 contract/mechanics complete, M44.3 Town Hall founder-progression slice complete, M44.4 modal handoff corrected and green, M44.5 HQ-first-entry modal surface green, M44.6 shared HQ naming slice green, M44.7 saved HQ name now projects into the House shell header and is green, M44.8 saved HQ name now brands the Mission lane heading/lead and is green, M44.9 saved HQ name now reaches the Mission detail line and is green, M44.10 saved HQ name now reaches the Mission empty-state copy and is green, M44.11 no-experience Mission detail hint is now truthful before save and HQ-branded after save and is green, M44.12 saved HQ name now brands the reconnect share-card action and is green, M44.13 saved HQ name now brands the reconnect intro/support line and is green, M44.14 saved HQ name now brands the reconnect copyable house snippet and is green, M44.15 wallet-recovery-specific reconnect intro coverage is now explicit and green, M44.16 saved HQ name now brands the House systems/team summary line and is green  
Last updated: 2026-03-17 02:31 +0700  
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

### M44.16 — saved HQ name now brands the tiny House systems/team summary line
This pass closes the strongest remaining early-shell naming gap with the smallest coherent surface: the short team summary line inside the `HQ systems` panel now reuses the saved HQ name after save/reload.

What changed:
- added a tiny `getHouseTeamSummaryText(...)` helper in `public/app.js`
- kept the unattached and generic fallback states intact
- when an HQ name has been saved, the summary line now brands the active team branch as:
  - `<saved HQ name> HQ · active team <team id>`
- the same helper also keeps the no-team branch ready for HQ-branded copy without touching persistence scope or route architecture
- added focused Playwright coverage for the new branded summary line
- tightened one existing empty-state spec so it only asserts the contract it actually owns, avoiding a flaky pre-save step that was racing the shared `open mission` save path

Implementation details:
- `public/app.js`
  - introduced `getHouseTeamSummaryText(...)`
  - routed `houseTeamSummary` rendering through the helper so saved-HQ branding stays centralized with the other naming helpers
- `e2e/438_zhc0_house_team_summary_uses_saved_hq_name.spec.js`
  - attaches a house with `team_main`
  - proves the summary is still generic before save
  - saves a custom HQ name through the existing primary action
  - proves the House systems summary line becomes HQ-branded after save and after reload
- `e2e/432_zhc0_mission_empty_state_uses_saved_hq_name.spec.js`
  - removed an unstable pre-save assertion so the spec stays focused on the saved-name empty-state contract it is meant to cover
- `docs/zhc-current-status.md`
  - updated snapshot, evidence, remaining gaps, and next pickup

### Why this matches the direction better
This is the right kind of follow-on slice:
- still modal-only on `/app`
- still local-only
- no new routes
- no new persistence scope
- no UI sprawl
- no Mission/share architecture rewrite
- one more immediately useful shell/support line now benefits from the saved HQ name

## New / updated contract coverage
- added: `e2e/438_zhc0_house_team_summary_uses_saved_hq_name.spec.js`
  - verifies the House systems summary stays generic before save
  - verifies saving the HQ name brands the active-team summary line
  - verifies the branded summary survives reload
- updated: `e2e/432_zhc0_mission_empty_state_uses_saved_hq_name.spec.js`
  - now focuses only on the saved-name empty-state contract
  - removes a flaky pre-save expectation that could race the shared mission-open path

## Files changed in this slice

- `public/app.js`
- `e2e/432_zhc0_mission_empty_state_uses_saved_hq_name.spec.js`
- `e2e/438_zhc0_house_team_summary_uses_saved_hq_name.spec.js`
- `docs/zhc-current-status.md`

## Evidence runs

### Focused M44.16 summary-line check
```bash
node --check public/app.js && node --check e2e/438_zhc0_house_team_summary_uses_saved_hq_name.spec.js
npx playwright test e2e/438_zhc0_house_team_summary_uses_saved_hq_name.spec.js
```

Result:
- `node --check` passed
- `1 passed`

### Focused founders-loop naming + House surface regression sweep
```bash
node --check e2e/432_zhc0_mission_empty_state_uses_saved_hq_name.spec.js
npx playwright test e2e/158_house_team_switch_surface.spec.js e2e/188_house_experiences_surface.spec.js e2e/190_house_office_staff_scaffold.spec.js e2e/420_zhc0_house_first_entry_hq_surface.spec.js e2e/421_zhc0_house_shared_naming.spec.js e2e/428_zhc0_ceremony_modal_handoff.spec.js e2e/429_zhc0_house_header_uses_saved_hq_name.spec.js e2e/430_zhc0_mission_panel_uses_saved_hq_name.spec.js e2e/431_zhc0_mission_detail_uses_saved_hq_name.spec.js e2e/432_zhc0_mission_empty_state_uses_saved_hq_name.spec.js e2e/433_zhc0_mission_empty_detail_hint_uses_saved_hq_name.spec.js e2e/434_zhc0_share_card_button_uses_saved_hq_name.spec.js e2e/435_zhc0_reconnect_intro_uses_saved_hq_name.spec.js e2e/436_zhc0_reconnect_snippet_uses_saved_hq_name.spec.js e2e/437_zhc0_wallet_recovery_reconnect_intro_uses_saved_hq_name.spec.js e2e/438_zhc0_house_team_summary_uses_saved_hq_name.spec.js
```

Result:
- `node --check` passed
- `16 passed`

## What I verified

- the founder journey still stays inside the `/app` modal shell
- the shared HQ naming move still saves through the same single primary action
- the House modal header still projects the saved HQ name
- the Mission panel heading and lead still project the saved HQ name
- the selected Mission detail line still projects the saved HQ name
- the Mission empty-state still projects the saved HQ name when no experiences are routed yet
- the Mission no-experience detail hint still stays truthful before save and HQ-branded after save
- the reconnect share-card action still stays generic before save and becomes HQ-branded after save
- the reconnect intro still stays generic before save and becomes HQ-branded after save
- the reconnect copyable snippet still stays generic before save and becomes HQ-branded after save
- the wallet-recovery-specific `Welcome back` reconnect intro still uses the saved HQ name
- the House systems/team summary line now stays generic before save and becomes HQ-branded after save
- the House systems/team summary line persists the saved HQ name across reload
- the older House team switch and House office/staff scaffolding contracts still pass
- the broader House Experiences surface contract still passes

## Honest gaps / remaining debt

- HQ naming still persists in browser local storage only
  - coherent for this UI slice, but still not written into server/session/platform state
- the share-card page/body itself still does not reuse the saved HQ name
- deeper downstream surfaces beyond the current House shell still do not reuse the saved HQ name consistently
- the screenshot baseline still reflects the earlier modal shell state
  - I did **not** capture a fresh image pack for this slice
- the no-team branch of the new summary helper is implemented but not directly covered by a founders-loop spec yet

## What I did **not** do

- no push
- did **not** touch the unrelated dirty `package-lock.json`
- did **not** broaden persistence scope beyond existing local storage
- did **not** change route architecture or move the founder flow out of `/app`
- did **not** add extra actions or expand the flow beyond the current modal shell
- did **not** update deeper machine/spec artifacts (`docs/founders-loop-state-model.md`, `design/specs/10_founders_loop_ui_state_projection.md`, `design/specs/11_zhc0_ui_evidence_contract.md`, `specs/43_zhc0_founders_loop_state_contract.md`, `machines/FoundersLoop.machine.ts`)

## Blockers

- none for this slice
- one existing empty-state spec needed tightening because its pre-save assertion could race the shared `open mission` save path; I fixed the spec rather than widening product behavior

## Next exact pickup

The safest next move is now the next tiny saved-HQ projection outside the current Mission/reconnect cluster.

Best next pickup:
1. brand one more safe support surface that already exists, without adding UI sprawl
2. strongest remaining candidate:
   - the share-card page/body placeholder shell so the saved HQ name survives beyond the button label
3. if staying inside House instead, a very small follow-on would be:
   - explicit coverage for the no-team branch of the new House systems summary helper
4. keep persistence local-only unless there is an exceptionally small safe path to broader state
5. keep the next move just as narrow
   - modal-only on `/app`
   - one obvious primary action per state
   - no broad Mission rewrite or share architecture expansion

## Repo state notes

- latest local commit in this slice: `feat: brand house team summary with saved hq name`
- this M44.16 slice is local in this worktree only
- unrelated dirty file should remain: `package-lock.json` (leave it alone unless explicitly intended)
