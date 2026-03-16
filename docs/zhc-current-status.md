# ZHC Current Status Snapshot

Status: M44.1 complete, M44.2 contract/mechanics complete, M44.3 Town Hall founder-progression slice complete, M44.4 modal handoff corrected and green, M44.5 HQ-first-entry modal surface green, M44.6 shared HQ naming slice green, M44.7 saved HQ name now projects into the House shell header and is green, M44.8 saved HQ name now brands the Mission lane heading/lead and is green, M44.9 saved HQ name now reaches the Mission detail line and is green, M44.10 saved HQ name now reaches the Mission empty-state copy and is green, M44.11 no-experience Mission detail hint is now truthful before save and HQ-branded after save and is green, M44.12 saved HQ name now brands the reconnect share-card action and is green, M44.13 saved HQ name now brands the reconnect intro/support line and is green, M44.14 saved HQ name now brands the reconnect copyable house snippet and is green, M44.15 wallet-recovery-specific reconnect intro coverage is now explicit and green, M44.16 saved HQ name now brands the House systems/team summary line and is green, M44.17 saved HQ name now brands the share-card placeholder shell/body and is green, M44.18 founders-loop coverage now directly exercises the House systems summary helper when no team context is attached and is green, M44.19 outer share-card modal title/chrome now uses the saved HQ name and is green, M44.20 resolved `/s/:id` share-path coverage for that outer HQ-branded modal title is now explicit and green  
Last updated: 2026-03-17 03:40 +0700  
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

### M44.20 — resolved `/s/:id` share-path coverage for the outer HQ-branded modal title
This pass took the exact M44.19 pickup and stayed test-first.

What changed:
- added a focused founders-loop assertion for a **real resolved** `/s/:id` share path
- kept the founder journey modal-first on `/app`
- made **no** app code changes
- made **no** share payload/body changes
- made **no** persistence changes beyond the existing local/session storage behavior
- made **no** route or UI architecture changes

Implementation details:
- `e2e/442_zhc0_share_card_modal_title_resolved_share_path.spec.js`
  - seeds a recoverable-token house plus a real share record
  - proves the House share-card opener resolves to `/s/<shareId>?embed=1` instead of the preview fallback path
  - proves the outer modal title still stays generic before HQ naming on that resolved share path
  - proves the same outer modal title becomes `${saved HQ name} HQ share card` after HQ save on that resolved share path
  - proves the HQ-branded title survives reload on the resolved share path as well
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
- closes the precise confidence gap left by M44.19 without inventing a wider share rewrite

## New / updated contract coverage
- added: `e2e/442_zhc0_share_card_modal_title_resolved_share_path.spec.js`
  - verifies the outer share-card modal title is still `Share Card` before HQ save on a resolved `/s/:id` path
  - verifies the same outer modal title becomes `${saved HQ name} HQ share card` after HQ save on that resolved path
  - verifies the branded title survives reload on the resolved path
- retained: `e2e/441_zhc0_share_card_modal_title_uses_saved_hq_name.spec.js`
  - confirms the already-landed preview-fallback branch still stays correct
- retained: `e2e/439_zhc0_share_card_placeholder_uses_saved_hq_name.spec.js`
  - confirms the inner placeholder shell/body copy still stays HQ-branded inside the embedded share card

## Files changed in this slice

- `e2e/442_zhc0_share_card_modal_title_resolved_share_path.spec.js`
- `docs/zhc-current-status.md`

## Evidence runs

### Focused resolved-share-path check
```bash
node --check e2e/442_zhc0_share_card_modal_title_resolved_share_path.spec.js
node --check e2e/441_zhc0_share_card_modal_title_uses_saved_hq_name.spec.js
npx playwright test e2e/441_zhc0_share_card_modal_title_uses_saved_hq_name.spec.js e2e/442_zhc0_share_card_modal_title_resolved_share_path.spec.js
npx playwright test e2e/439_zhc0_share_card_placeholder_uses_saved_hq_name.spec.js e2e/441_zhc0_share_card_modal_title_uses_saved_hq_name.spec.js e2e/442_zhc0_share_card_modal_title_resolved_share_path.spec.js
```

Result:
- both `node --check` commands passed
- Playwright pair: `2 passed`
- Playwright trio: `3 passed`

## What I verified

- the founder journey still stays inside the `/app` modal shell
- with a real share seeded, the House share-card opener now lands on a resolved `/s/<shareId>?embed=1` frame path in the existing modal shell
- before HQ naming, the outer modal title still stays generic as `Share Card` on that resolved path
- after HQ naming, the outer modal title brands correctly as `${saved HQ name} HQ share card` on that same resolved path
- the HQ-branded outer title survives reload via the existing local-only naming record
- the preview-fallback path from M44.19 still stays green
- the inner placeholder-shell assertions from M44.17 still stay green

## Honest gaps / remaining debt

- HQ naming still persists in browser local storage only
  - coherent for this UI slice, but still not written into server/session/platform state
- this new resolved-share-path coverage proves the **lookup-by-house success branch** from the House opener
  - it does **not** separately prove a branch where resolved share metadata is already hydrated into `lastState` before the click, if that path matters later
- real minted share payload/body content still does not intentionally reuse the saved HQ name
- deeper downstream surfaces beyond the current House/share shell still do not reuse the saved HQ name consistently
- the screenshot baseline still reflects the earlier modal shell state
  - I did **not** capture a fresh image pack for this slice

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

1. add one tiny founders-loop assertion for the branch where the share-card opener already has a resolved share path in hydrated state (`lastState.share.sharePath` / `lastState.share.id`), not just the lookup-by-house success path exercised here
2. keep it test-first and modal-only on `/app`
3. keep persistence local-only unless there is an exceptionally small safe path to broader state
4. keep the next move just as narrow
   - one obvious primary action per state
   - no share architecture expansion
   - no broad UI churn

## Repo state notes

- local commit for this slice:
  - `test: cover resolved share modal title path`
- recent earlier local commits include:
  - `e6be8cc feat: brand share modal title with saved hq name`
  - `1b15671 test: cover no-team house summary branch`
  - `c664cbf feat: brand share placeholder shell with saved hq name`
- unrelated dirty file should remain: `package-lock.json` (leave it alone unless explicitly intended)
