# ZHC Current Status Snapshot

Status: M44.1 complete, M44.2 contract/mechanics complete, M44.3 Town Hall founder-progression slice complete, M44.4 modal handoff corrected and green, M44.5 HQ-first-entry modal surface green, M44.6 shared HQ naming slice green, M44.7 saved HQ name now projects into the House shell header and is green, M44.8 saved HQ name now brands the Mission lane heading/lead and is green, M44.9 saved HQ name now reaches the Mission detail line and is green, M44.10 saved HQ name now reaches the Mission empty-state copy and is green, M44.11 no-experience Mission detail hint is now truthful before save and HQ-branded after save and is green, M44.12 saved HQ name now brands the reconnect share-card action and is green, M44.13 saved HQ name now brands the reconnect intro/support line and is green, M44.14 saved HQ name now brands the reconnect copyable house snippet and is green, M44.15 wallet-recovery-specific reconnect intro coverage is now explicit and green, M44.16 saved HQ name now brands the House systems/team summary line and is green, M44.17 saved HQ name now brands the share-card placeholder shell/body and is green, M44.18 founders-loop coverage now directly exercises the House systems summary helper when no team context is attached and is green, M44.19 outer share-card modal title/chrome now uses the saved HQ name and is green, M44.20 resolved `/s/:id` share-path coverage for that outer HQ-branded modal title is now explicit and green, M44.21 already-hydrated resolved share-state coverage for that outer HQ-branded modal title is now explicit and green, M44.22 resolved inner share-card title now uses the saved HQ name on the embedded public share shell and is green, M44.23 resolved inner share lead now uses the saved HQ name on the embedded public share shell and is green  
Last updated: 2026-03-17 08:47 +0700  
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

### M44.23 — resolved inner share lead now reuses the saved HQ name
This pass stayed test-first and deliberately kept the scope tiny.

What changed:
- added a focused founders-loop assertion for the **inner** embedded public share lead on a resolved `/s/:id` path
- kept the inner lead generic before HQ save
- branded that same inner lead as `High-distribution card for social sharing with generated ${saved HQ name} HQ hero.` after HQ save
- reused the existing local/session preview record path instead of expanding share payload architecture
- kept the founder journey modal-first on `/app`
- made **no** server/share payload changes
- made **no** route changes
- made **no** persistence broadening beyond the existing browser local/session storage behavior
- left the real minted share lead/body contract alone

Implementation details:
- `e2e/445_zhc0_resolved_share_card_inner_lead_uses_saved_hq_name.spec.js`
  - creates a real resolved share for the attached house
  - proves the embedded inner share lead stays `High-distribution card for social sharing with generated house hero.` before HQ save on that resolved `/s/:id` path
  - proves the embedded inner share lead becomes `High-distribution card for social sharing with generated ${saved HQ name} HQ hero.` after HQ save on that same resolved path
  - proves the share-id badge still stays the real share id, so this is not the placeholder branch
  - proves the branded inner lead survives reload and reopen
- `public/share_public.js`
  - reads the matching resolved-share preview record and applies the saved HQ name to the inner public share lead while leaving the real payload contract alone
- `docs/zhc-current-status.md`
  - updated snapshot, evidence, gaps, and next pickup

### Why this matches the direction better
This is still the right size:
- still modal-only for the founder journey on `/app`
- still one obvious primary action for the founder state
- still local-only
- no persistence broadening
- no route churn
- no share architecture expansion
- no broad UI churn
- extends the existing share-shell branding line by exactly one small inner surface

## New / updated contract coverage
- added: `e2e/445_zhc0_resolved_share_card_inner_lead_uses_saved_hq_name.spec.js`
  - verifies the embedded inner lead is still generic before HQ save on a resolved `/s/:id` path
  - verifies the same embedded inner lead becomes `High-distribution card for social sharing with generated ${saved HQ name} HQ hero.` after HQ save on that resolved path
  - verifies the real share id badge remains visible on that path
  - verifies the branded inner lead survives reload and reopen
- retained: `e2e/444_zhc0_resolved_share_card_inner_title_uses_saved_hq_name.spec.js`
  - confirms the embedded inner title branch still stays correct on the same resolved path
- retained: `e2e/443_zhc0_share_card_modal_title_hydrated_resolved_share_path.spec.js`
  - confirms the already-hydrated resolved-share outer modal-title branch still stays correct
- retained: `e2e/442_zhc0_share_card_modal_title_resolved_share_path.spec.js`
  - confirms the lookup-by-house resolved-share outer modal-title branch still stays correct
- retained: `e2e/441_zhc0_share_card_modal_title_uses_saved_hq_name.spec.js`
  - confirms the preview-fallback outer modal-title branch still stays correct
- retained: `e2e/439_zhc0_share_card_placeholder_uses_saved_hq_name.spec.js`
  - confirms the placeholder inner shell/body copy still stays HQ-branded

## Files changed in this slice

- `public/share_public.js`
- `e2e/445_zhc0_resolved_share_card_inner_lead_uses_saved_hq_name.spec.js`
- `docs/zhc-current-status.md`

## Evidence runs

### Focused resolved-share inner-lead check
```bash
node --check public/share_public.js
node --check e2e/445_zhc0_resolved_share_card_inner_lead_uses_saved_hq_name.spec.js
npx playwright test e2e/439_zhc0_share_card_placeholder_uses_saved_hq_name.spec.js e2e/441_zhc0_share_card_modal_title_uses_saved_hq_name.spec.js e2e/442_zhc0_share_card_modal_title_resolved_share_path.spec.js e2e/443_zhc0_share_card_modal_title_hydrated_resolved_share_path.spec.js e2e/444_zhc0_resolved_share_card_inner_title_uses_saved_hq_name.spec.js e2e/445_zhc0_resolved_share_card_inner_lead_uses_saved_hq_name.spec.js
```

Result:
- both `node --check` commands passed
- Playwright sextet: `6 passed`

## What I verified

- the founder journey still stays inside the `/app` modal shell
- on a resolved `/s/:id` share path, the embedded inner public share lead still stays generic before HQ save
- after HQ save, that same embedded inner lead brands correctly as `High-distribution card for social sharing with generated ${saved HQ name} HQ hero.`
- the embedded share still shows the real share id badge, so this remains the resolved-share branch rather than placeholder fallback
- the HQ-branded inner lead survives reload and reopen through the existing local/session browser state path
- the inner title coverage from M44.22 still stays green
- the outer modal-title coverage from M44.19, M44.20, and M44.21 still stays green
- the placeholder inner-shell assertions from M44.17 still stay green

## Honest gaps / remaining debt

- HQ naming still persists in browser local storage only
  - coherent for this UI slice, but still not written into server/session/platform state
- the resolved-share inner lead branding still comes from the local/session preview path, not from the real server share payload
- real minted share body content still does not intentionally reuse the saved HQ name
- deeper downstream surfaces beyond the current House/share shell still do not reuse the saved HQ name consistently
- the screenshot baseline still reflects the earlier modal shell state
  - I did **not** capture a fresh image pack for this slice

## What I did **not** do

- no push
- did **not** touch the unrelated dirty `package-lock.json`
- did **not** change route architecture or move the founder flow out of `/app`
- did **not** broaden persistence scope beyond existing browser storage
- did **not** broaden share architecture or payload generation
- did **not** change the real public share lead/body payload contract
- did **not** update deeper machine/spec artifacts (`docs/founders-loop-state-model.md`, `design/specs/10_founders_loop_ui_state_projection.md`, `design/specs/11_zhc0_ui_evidence_contract.md`, `specs/43_zhc0_founders_loop_state_contract.md`, `machines/FoundersLoop.machine.ts`)

## Blockers

- none for this slice

## Next exact pickup

If we keep trimming this same seam one notch at a time, the cleanest next move is:

1. keep the work on the resolved public share shell rather than broadening architecture
2. make the next tiny win the resolved inner hero placeholder copy using the same preview-only/local-only path
3. keep it test-first and modal-only on `/app`
4. keep it just as narrow
   - one obvious primary action per state
   - no share architecture expansion
   - no broad UI churn

## Repo state notes

- local commit for this slice:
  - `feat: brand resolved share lead with saved hq name`
- recent earlier local commits include:
  - `1ec8a0b feat: brand resolved share title with saved hq name`
  - `d949e8c test: cover hydrated share modal title path`
  - `af72a6d test: cover resolved share modal title path`
- unrelated dirty file should remain: `package-lock.json` (leave it alone unless explicitly intended)
