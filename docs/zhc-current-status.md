# ZHC Current Status Snapshot

Status: M44.1 complete, M44.2 contract/mechanics complete, M44.3 Town Hall founder-progression slice complete, M44.4 modal handoff corrected and green, M44.5 HQ-first-entry modal surface green, M44.6 shared HQ naming slice green, M44.7 saved HQ name now projects into the House shell header and is green, M44.8 saved HQ name now brands the Mission lane heading/lead and is green, M44.9 saved HQ name now reaches the Mission detail line and is green, M44.10 saved HQ name now reaches the Mission empty-state copy and is green, M44.11 no-experience Mission detail hint is now truthful before save and HQ-branded after save and is green, M44.12 saved HQ name now brands the reconnect share-card action and is green, M44.13 saved HQ name now brands the reconnect intro/support line and is green, M44.14 saved HQ name now brands the reconnect copyable house snippet and is green, M44.15 wallet-recovery-specific reconnect intro coverage is now explicit and green, M44.16 saved HQ name now brands the House systems/team summary line and is green, M44.17 saved HQ name now brands the share-card placeholder shell/body and is green, M44.18 founders-loop coverage now directly exercises the House systems summary helper when no team context is attached and is green, M44.19 outer share-card modal title/chrome now uses the saved HQ name and is green, M44.20 resolved `/s/:id` share-path coverage for that outer HQ-branded modal title is now explicit and green, M44.21 already-hydrated resolved share-state coverage for that outer HQ-branded modal title is now explicit and green  
Last updated: 2026-03-17 07:23 +0700  
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

### M44.21 — already-hydrated resolved share-state coverage for the outer HQ-branded modal title
This pass took the exact M44.20 pickup and stayed test-first.

What changed:
- added a focused founders-loop assertion for the branch where the session already carries a resolved share before the House share-card click
- proved the opener can reuse hydrated share state instead of falling back to the lookup-by-house request path
- kept the founder journey modal-first on `/app`
- made **no** app code changes
- made **no** share payload/body changes
- made **no** persistence changes beyond the existing local/session storage behavior
- made **no** route or UI architecture changes

Implementation details:
- `e2e/443_zhc0_share_card_modal_title_hydrated_resolved_share_path.spec.js`
  - attaches the house to the page session first, then creates the house share so the active session is hydrated with `share.id`
  - proves `/api/state` already carries the resolved share id before the share-card opener is clicked
  - proves the opener reaches `/s/<shareId>?embed=1` through the hydrated branch
  - proves no `GET /api/share/by-house/:houseId` lookup is needed on that path
  - proves the outer modal title still stays generic before HQ naming on that hydrated resolved path
  - proves the same outer modal title becomes `${saved HQ name} HQ share card` after HQ save on that same hydrated resolved path
  - proves the branded title survives reload while the share stays hydrated in session state
- `docs/zhc-current-status.md`
  - updated snapshot, evidence, gaps, and next pickup

### Why this matches the direction better
This is the right size for the follow-on:
- still modal-only for the founder journey on `/app`
- still one obvious primary action for the founder state
- still local-only
- no persistence broadening
- no route churn
- no share architecture expansion
- no broad UI churn
- closes the exact remaining confidence gap left by M44.20 without inventing a wider share rewrite

## New / updated contract coverage
- added: `e2e/443_zhc0_share_card_modal_title_hydrated_resolved_share_path.spec.js`
  - verifies the session already contains the resolved share id before click
  - verifies the opener does **not** need the lookup-by-house fallback on that branch
  - verifies the outer share-card modal title is still `Share Card` before HQ save on that hydrated resolved path
  - verifies the same outer modal title becomes `${saved HQ name} HQ share card` after HQ save on that hydrated resolved path
  - verifies the branded title survives reload on the hydrated resolved path
- retained: `e2e/442_zhc0_share_card_modal_title_resolved_share_path.spec.js`
  - confirms the lookup-by-house success branch still stays correct
- retained: `e2e/441_zhc0_share_card_modal_title_uses_saved_hq_name.spec.js`
  - confirms the preview-fallback branch still stays correct
- retained: `e2e/439_zhc0_share_card_placeholder_uses_saved_hq_name.spec.js`
  - confirms the inner placeholder shell/body copy still stays HQ-branded inside the embedded share card

## Files changed in this slice

- `e2e/443_zhc0_share_card_modal_title_hydrated_resolved_share_path.spec.js`
- `docs/zhc-current-status.md`

## Evidence runs

### Focused hydrated-share-state check
```bash
node --check e2e/441_zhc0_share_card_modal_title_uses_saved_hq_name.spec.js
node --check e2e/442_zhc0_share_card_modal_title_resolved_share_path.spec.js
node --check e2e/443_zhc0_share_card_modal_title_hydrated_resolved_share_path.spec.js
npx playwright test e2e/439_zhc0_share_card_placeholder_uses_saved_hq_name.spec.js e2e/441_zhc0_share_card_modal_title_uses_saved_hq_name.spec.js e2e/442_zhc0_share_card_modal_title_resolved_share_path.spec.js e2e/443_zhc0_share_card_modal_title_hydrated_resolved_share_path.spec.js
```

Result:
- all three `node --check` commands passed
- Playwright quartet: `4 passed`

## What I verified

- the founder journey still stays inside the `/app` modal shell
- once the house is attached first and the share is created after that, `/api/state` already carries the resolved share id before the click
- on that hydrated branch, the House share-card opener reaches `/s/<shareId>?embed=1` without hitting the lookup-by-house fallback request
- before HQ naming, the outer modal title still stays generic as `Share Card` on that hydrated resolved path
- after HQ naming, the outer modal title brands correctly as `${saved HQ name} HQ share card` on that same hydrated resolved path
- the HQ-branded outer title survives reload via the existing local-only naming record while the resolved share stays hydrated in session state
- the lookup-by-house success branch from M44.20 still stays green
- the preview-fallback branch from M44.19 still stays green
- the inner placeholder-shell assertions from M44.17 still stay green

## Honest gaps / remaining debt

- HQ naming still persists in browser local storage only
  - coherent for this UI slice, but still not written into server/session/platform state
- real minted share payload/body content still does not intentionally reuse the saved HQ name
- deeper downstream surfaces beyond the current House/share shell still do not reuse the saved HQ name consistently
- the screenshot baseline still reflects the earlier modal shell state
  - I did **not** capture a fresh image pack for this slice
- the outer share-card modal-title surface is now covered across:
  - preview fallback (`/s/sh_missing`)
  - lookup-by-house success to resolved `/s/:id`
  - already-hydrated resolved share state
  - but deeper downstream HQ-name propagation beyond that chrome still remains broader follow-on work

## What I did **not** do

- no push
- did **not** touch the unrelated dirty `package-lock.json`
- did **not** change `public/app.js`
- did **not** broaden persistence scope beyond existing browser storage
- did **not** change route architecture or move the founder flow out of `/app`
- did **not** broaden share architecture or payload generation
- did **not** change the inner public share payload/body contract
- did **not** update deeper machine/spec artifacts (`docs/founders-loop-state-model.md`, `design/specs/10_founders_loop_ui_state_projection.md`, `design/specs/11_zhc0_ui_evidence_contract.md`, `specs/43_zhc0_founders_loop_state_contract.md`, `machines/FoundersLoop.machine.ts`)

## Blockers

- none for this slice

## Next exact pickup

If we keep trimming this surface one notch at a time, the cleanest next move is:

1. decide whether the next tiny win should stay on share-shell branding or step one layer deeper into the public share payload/body copy
2. keep it test-first and modal-only on `/app`
3. keep persistence local-only unless there is an exceptionally small safe path to broader state
4. keep the next move just as narrow
   - one obvious primary action per state
   - no share architecture expansion
   - no broad UI churn

## Repo state notes

- local commit for this slice:
  - pending
- recent earlier local commits include:
  - `af72a6d test: cover resolved share modal title path`
  - `e6be8cc feat: brand share modal title with saved hq name`
  - `1b15671 test: cover no-team house summary branch`
  - `c664cbf feat: brand share placeholder shell with saved hq name`
- unrelated dirty file should remain: `package-lock.json` (leave it alone unless explicitly intended)
