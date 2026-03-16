# ZHC Current Status Snapshot

Status: M44.1 complete, M44.2 contract/mechanics complete, M44.3 Town Hall founder-progression slice complete, M44.4 modal handoff corrected and green, M44.5 HQ-first-entry modal surface green, M44.6 shared HQ naming slice green, M44.7 saved HQ name now projects into the House shell header and is green, M44.8 saved HQ name now brands the Mission lane heading/lead and is green, M44.9 saved HQ name now reaches the Mission detail line and is green, M44.10 saved HQ name now reaches the Mission empty-state copy and is green, M44.11 no-experience Mission detail hint is now truthful before save and HQ-branded after save and is green, M44.12 saved HQ name now brands the reconnect share-card action and is green, M44.13 saved HQ name now brands the reconnect intro/support line and is green, M44.14 saved HQ name now brands the reconnect copyable house snippet and is green, M44.15 wallet-recovery-specific reconnect intro coverage is now explicit and green, M44.16 saved HQ name now brands the House systems/team summary line and is green, M44.17 saved HQ name now brands the share-card placeholder shell/body and is green, M44.18 founders-loop coverage now directly exercises the House systems summary helper when no team context is attached and is green, M44.19 outer share-card modal title/chrome now uses the saved HQ name and is green  
Last updated: 2026-03-17 03:26 +0700  
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

### M44.19 — outer share-card modal title/chrome now uses the saved HQ name
This pass took the exact M44.18 pickup and kept it extremely tight. The inner placeholder share card was already branded from the saved HQ name; this slice now applies the same saved HQ name to the **parent modal title/chrome** that wraps the embedded share card inside `/app`.

What changed:
- kept the founder journey modal-first on `/app`
- kept the share-card flow inside the existing district modal frame
- made **no** share payload/body generation changes
- made **no** persistence changes beyond the existing local/session storage behavior
- taught the existing house share-card opener to pass a tiny HQ-aware frame title into the modal shell
- kept the title generic before HQ naming and HQ-branded after save

Implementation details:
- `public/app.js`
  - added `getHouseShareCardModalTitle(...)`
  - updated `routeToShareCard(...)` so `/s/...` routes opened from the House share-card action can brand the parent frame title from the saved HQ name
  - kept the fallback title as plain `Share Card` when no HQ name is saved yet
  - passed the active `houseId` through the existing opener so the title resolves from the right saved local record
- `e2e/441_zhc0_share_card_modal_title_uses_saved_hq_name.spec.js`
  - proves the outer modal title stays generic before save
  - proves the outer modal title becomes `${saved HQ name} HQ share card` after save
  - proves the branded title survives reload in the same founder modal flow
- `docs/zhc-current-status.md`
  - updated snapshot, evidence, remaining gaps, and next pickup

### Why this matches the direction better
This is the right size for the follow-on:
- still modal-only for the founder journey on `/app`
- still one obvious primary action for the founder state
- still local-only
- no persistence broadening
- no route churn
- no share architecture expansion
- no broad UI churn
- one small but visible payoff from the saved shared HQ name

## New / updated contract coverage
- added: `e2e/441_zhc0_share_card_modal_title_uses_saved_hq_name.spec.js`
  - verifies the outer share-card modal title is the generic `Share Card` before HQ save
  - verifies the same modal title becomes `${saved HQ name} HQ share card` after HQ save
  - verifies the HQ-branded modal title survives reload
- retained: `e2e/439_zhc0_share_card_placeholder_uses_saved_hq_name.spec.js`
  - confirms the already-landed inner placeholder shell/body copy still stays HQ-branded inside the embedded share card

## Files changed in this slice

- `public/app.js`
- `e2e/441_zhc0_share_card_modal_title_uses_saved_hq_name.spec.js`
- `docs/zhc-current-status.md`

## Evidence runs

### Focused share-card modal-title check
```bash
node --check public/app.js
node --check e2e/441_zhc0_share_card_modal_title_uses_saved_hq_name.spec.js
npx playwright test e2e/439_zhc0_share_card_placeholder_uses_saved_hq_name.spec.js e2e/441_zhc0_share_card_modal_title_uses_saved_hq_name.spec.js
```

Result:
- both `node --check` commands passed
- Playwright: `2 passed`

## What I verified

- the founder journey still stays inside the `/app` modal shell
- before HQ naming, opening the share card still uses the generic outer modal title `Share Card`
- after HQ naming, opening the same share card now brands the outer modal title/chrome as `${saved HQ name} HQ share card`
- the HQ-branded outer title survives reload via the existing local-only naming record
- the inner placeholder share-card shell/body from M44.17 still stays HQ-branded
- no persistence scope changed beyond existing browser-local/session behavior

## Honest gaps / remaining debt

- HQ naming still persists in browser local storage only
  - coherent for this UI slice, but still not written into server/session/platform state
- the new outer-title coverage is exercised on the existing preview fallback path (`/s/sh_missing`)
  - the helper applies to `/s/...` share routes generally, but this pass did **not** add a dedicated resolved-share-path founders-loop assertion
- real minted share payload/body content still does not intentionally reuse the saved HQ name
- deeper downstream surfaces beyond the current House/share shell still do not reuse the saved HQ name consistently
- the screenshot baseline still reflects the earlier modal shell state
  - I did **not** capture a fresh image pack for this slice

## What I did **not** do

- no push
- did **not** touch the unrelated dirty `package-lock.json`
- did **not** broaden persistence scope beyond existing browser storage
- did **not** change route architecture or move the founder flow out of `/app`
- did **not** broaden share architecture or payload generation
- did **not** change the inner public share payload/body contract
- did **not** update deeper machine/spec artifacts (`docs/founders-loop-state-model.md`, `design/specs/10_founders_loop_ui_state_projection.md`, `design/specs/11_zhc0_ui_evidence_contract.md`, `specs/43_zhc0_founders_loop_state_contract.md`, `machines/FoundersLoop.machine.ts`)

## Blockers

- none for this slice

## Next exact pickup

The cleanest next move is another tiny share-card confidence pass, not a broader product rewrite.

Best next pickup:
1. add a small founders-loop assertion for the already-landed outer modal title on a **resolved** `/s/:id` share path, not just the preview fallback path
2. keep it tiny and local to the existing share modal surface
3. keep persistence local-only unless there is an exceptionally small safe path to broader state
4. keep the next move just as narrow
   - modal-only on `/app`
   - one obvious primary action per state
   - no share architecture expansion
   - no broad UI churn

## Repo state notes

- latest local commit before this slice: `test: cover no-team house summary branch`
- previous local commit before that: `c664cbf feat: brand share placeholder shell with saved hq name`
- this M44.19 slice is currently present in the worktree and ready for a local commit if desired
- unrelated dirty file should remain: `package-lock.json` (leave it alone unless explicitly intended)
