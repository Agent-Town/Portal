# ZHC Current Status Snapshot

Status: M44.1 complete, M44.2 contract/mechanics complete, M44.3 Town Hall founder-progression slice complete, M44.4 modal handoff corrected and green, M44.5 HQ-first-entry modal surface green, M44.6 shared HQ naming slice green, M44.7 saved HQ name now projects into the House shell header and is green, M44.8 saved HQ name now brands the Mission lane heading/lead and is green, M44.9 saved HQ name now reaches the Mission detail line and is green, M44.10 saved HQ name now reaches the Mission empty-state copy and is green, M44.11 no-experience Mission detail hint is now truthful before save and HQ-branded after save and is green, M44.12 saved HQ name now brands the reconnect share-card action and is green, M44.13 saved HQ name now brands the reconnect intro/support line and is green, M44.14 saved HQ name now brands the reconnect copyable house snippet and is green, M44.15 wallet-recovery-specific reconnect intro coverage is now explicit and green, M44.16 saved HQ name now brands the House systems/team summary line and is green, M44.17 saved HQ name now brands the share-card placeholder shell/body and is green  
Last updated: 2026-03-17 03:00 +0700  
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

### M44.17 — saved HQ name now brands the share-card placeholder shell/body
This pass took the preferred next slice and kept it tight: when the founder flow opens the existing placeholder share-card preview (`/s/sh_missing`) from the `/app` House modal, the saved HQ name now survives into the share-card shell instead of stopping at the button label.

What changed:
- kept the founder journey modal-first on `/app`
- did **not** add or broaden share architecture, routes, or persistence scope
- when the share CTA resolves to the existing placeholder route, the House modal now writes a tiny preview context into `sessionStorage`
- the share page reads that preview context only for the placeholder sentinel route and only while it is fresh
- the placeholder share-card shell now reuses the saved HQ name in three small places:
  - share-card title: `<saved HQ name> HQ share card`
  - placeholder lead: `Placeholder shell for <saved HQ name> HQ while the public share card is still offline.`
  - hero placeholder line: `<saved HQ name> HQ hero will appear here once the public share card is minted.`
- the placeholder badge now reads `preview` instead of echoing the `sh_missing` sentinel
- the placeholder route no longer surfaces a raw `NOT_FOUND` error in this expected preview case
- real minted share cards still use the existing share payload/render path unchanged

Implementation details:
- `public/app.js`
  - added tiny `sessionStorage` preview helpers for the share placeholder route
  - writes preview context only when the share CTA falls back to `/s/sh_missing`
  - clears that preview context when a real share path is available
- `public/share_public.js`
  - added placeholder-preview parsing with a short freshness window
  - brands the placeholder title/lead/hero copy from the saved HQ name when present
  - treats `sh_missing` + `404` as the expected placeholder path instead of surfacing a raw error
- `public/share.html`
  - added stable ids/testids for the placeholder shell assertions
  - bumped the share-page asset version
- `public/index.html`
  - bumped the main `app.js` asset version so the House modal picks up the new preview handoff cleanly
- `e2e/439_zhc0_share_card_placeholder_uses_saved_hq_name.spec.js`
  - saves a custom HQ name through the existing primary action
  - opens the existing share-card preview from the House modal
  - proves the share iframe placeholder shell/body now uses the saved HQ name
- `docs/zhc-current-status.md`
  - updated snapshot, evidence, remaining gaps, and next pickup

### Why this matches the direction better
This is the right size and shape of follow-on:
- still modal-only for the founder journey on `/app`
- still one obvious primary action for the founder state
- still local-only
- no share API expansion
- no persistence broadening beyond existing browser storage
- no UI sprawl
- one more early support/payoff surface now reflects the shared HQ move

## New / updated contract coverage
- added: `e2e/439_zhc0_share_card_placeholder_uses_saved_hq_name.spec.js`
  - verifies the saved HQ name survives from the House modal into the share-card placeholder iframe
  - verifies the placeholder title, lead, hero placeholder, and `preview` badge are all coherent
  - verifies the expected placeholder path does not show a raw error

## Files changed in this slice

- `public/app.js`
- `public/index.html`
- `public/share.html`
- `public/share_public.js`
- `e2e/439_zhc0_share_card_placeholder_uses_saved_hq_name.spec.js`
- `docs/zhc-current-status.md`

## Evidence runs

### Focused placeholder-shell check
```bash
node --check public/app.js && node --check public/share_public.js && node --check e2e/439_zhc0_share_card_placeholder_uses_saved_hq_name.spec.js
npx playwright test e2e/29_atlas_route_nav.spec.js e2e/33_share_hero_og.spec.js e2e/421_zhc0_house_shared_naming.spec.js e2e/434_zhc0_share_card_button_uses_saved_hq_name.spec.js e2e/439_zhc0_share_card_placeholder_uses_saved_hq_name.spec.js
```

Result:
- `node --check` passed
- `5 passed`

### Focused founders-loop saved-HQ naming sweep
```bash
npx playwright test e2e/429_zhc0_house_header_uses_saved_hq_name.spec.js e2e/430_zhc0_mission_panel_uses_saved_hq_name.spec.js e2e/431_zhc0_mission_detail_uses_saved_hq_name.spec.js e2e/432_zhc0_mission_empty_state_uses_saved_hq_name.spec.js e2e/433_zhc0_mission_empty_detail_hint_uses_saved_hq_name.spec.js e2e/434_zhc0_share_card_button_uses_saved_hq_name.spec.js e2e/435_zhc0_reconnect_intro_uses_saved_hq_name.spec.js e2e/436_zhc0_reconnect_snippet_uses_saved_hq_name.spec.js e2e/437_zhc0_wallet_recovery_reconnect_intro_uses_saved_hq_name.spec.js e2e/438_zhc0_house_team_summary_uses_saved_hq_name.spec.js e2e/439_zhc0_share_card_placeholder_uses_saved_hq_name.spec.js
```

Result:
- `11 passed`

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
- the House systems/team summary line still stays generic before save and becomes HQ-branded after save
- the share-card placeholder iframe now uses the saved HQ name in its own shell/body copy
- the share-card placeholder sentinel no longer leaks a raw `NOT_FOUND` error in the expected preview path
- real share-card pages still render existing share hero media and route/nav behavior unchanged

## Honest gaps / remaining debt

- HQ naming still persists in browser local storage only
  - coherent for this UI slice, but still not written into server/session/platform state
- the new share-card naming payoff only covers the placeholder shell/body path
  - real minted share payload/body content still does not intentionally reuse the saved HQ name
- deeper downstream surfaces beyond the current House shell still do not reuse the saved HQ name consistently
- the screenshot baseline still reflects the earlier modal shell state
  - I did **not** capture a fresh image pack for this slice
- the no-team branch of the House systems summary helper is still implemented but not directly covered by a founders-loop spec yet
- the outer modal title for the embedded share card still stays generic `Share Card`
  - this pass only branded the share page/iframe shell, not the parent modal chrome

## What I did **not** do

- no push
- did **not** touch the unrelated dirty `package-lock.json`
- did **not** broaden persistence scope beyond existing browser storage
- did **not** change route architecture or move the founder flow out of `/app`
- did **not** add extra actions or expand the flow beyond the current modal shell
- did **not** change the real share-card data/render path for minted shares
- did **not** update deeper machine/spec artifacts (`docs/founders-loop-state-model.md`, `design/specs/10_founders_loop_ui_state_projection.md`, `design/specs/11_zhc0_ui_evidence_contract.md`, `specs/43_zhc0_founders_loop_state_contract.md`, `machines/FoundersLoop.machine.ts`)

## Blockers

- none for this slice

## Next exact pickup

The cleanest next move is now the fallback candidate that stayed intentionally untouched here.

Best next pickup:
1. add explicit founders-loop coverage for the no-team branch of the House systems summary helper
2. keep it tiny and local to the existing helper/spec surface
3. keep persistence local-only unless there is an exceptionally small safe path to broader state
4. keep the next move just as narrow
   - modal-only on `/app`
   - one obvious primary action per state
   - no broad Mission rewrite
   - no share architecture expansion
   - no broad UI churn

## Repo state notes

- latest local commit in this slice: `feat: brand share placeholder shell with saved hq name`
- this M44.17 slice is local in this worktree only
- unrelated dirty file should remain: `package-lock.json` (leave it alone unless explicitly intended)
