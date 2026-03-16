# ZHC Current Status Snapshot

Status: M44.1 complete, M44.2 contract/mechanics complete, M44.3 Town Hall founder-progression slice complete, M44.4 modal handoff corrected and green, M44.5 HQ-first-entry modal surface green, M44.6 shared HQ naming slice green, M44.7 saved HQ name now projects into the House shell header and is green, M44.8 saved HQ name now brands the Mission lane heading/lead and is green, M44.9 saved HQ name now reaches the Mission detail line and is green, M44.10 saved HQ name now reaches the Mission empty-state copy and is green, M44.11 no-experience Mission detail hint is now truthful before save and HQ-branded after save and is green, M44.12 saved HQ name now brands the reconnect share-card action and is green, M44.13 saved HQ name now brands the reconnect intro/support line and is green, M44.14 saved HQ name now brands the reconnect copyable house snippet and is green, M44.15 wallet-recovery-specific reconnect intro coverage is now explicit and green, M44.16 saved HQ name now brands the House systems/team summary line and is green, M44.17 saved HQ name now brands the share-card placeholder shell/body and is green, M44.18 founders-loop coverage now directly exercises the House systems summary helper when no team context is attached and is green  
Last updated: 2026-03-17 03:13 +0700  
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

### M44.18 — founders-loop coverage now directly exercises the no-team House systems summary branch
This pass took the exact pickup from M44.17 and kept it test-only. The helper in `public/app.js` already had a dedicated no-team branch; this slice adds direct founders-loop coverage for that branch before and after HQ naming without changing product behavior.

What changed:
- kept the founder journey modal-first on `/app`
- made **no** product/UI logic changes
- made **no** persistence changes
- added a focused founders-loop spec that attaches a house without an active team
- proved the House systems summary stays coherent in both no-team states:
  - before save: `No seeded team context is available for this house yet.`
  - after HQ naming: `<saved HQ name> HQ · no seeded team context yet.`
- kept the existing with-team summary coverage green alongside the new no-team branch check

Implementation details:
- `e2e/440_zhc0_house_team_summary_no_team_branch.spec.js`
  - boots the founder-ready `/app` modal flow
  - attaches a seeded house **without** a team id
  - proves the summary helper renders the generic no-team message before save
  - saves a custom HQ name through the existing primary action
  - proves the summary helper renders the HQ-branded no-team message after save and after reload
- `docs/zhc-current-status.md`
  - updated snapshot, evidence, remaining gaps, and next pickup

### Why this matches the direction better
This is the right size for the follow-on:
- still modal-only for the founder journey on `/app`
- still one obvious primary action for the founder state
- still local-only
- no persistence broadening
- no route churn
- no UI churn
- direct confidence on a helper branch that was already implemented but previously uncovered

## New / updated contract coverage
- added: `e2e/440_zhc0_house_team_summary_no_team_branch.spec.js`
  - verifies the no-team summary helper path is explicit before HQ save
  - verifies the same helper path becomes HQ-branded after HQ save
  - verifies the branded no-team summary survives reload in the founder modal flow
- retained: `e2e/438_zhc0_house_team_summary_uses_saved_hq_name.spec.js`
  - confirms the existing with-team branch still stays green beside the new no-team coverage

## Files changed in this slice

- `e2e/440_zhc0_house_team_summary_no_team_branch.spec.js`
- `docs/zhc-current-status.md`

## Evidence runs

### Focused no-team summary coverage check
```bash
node --check e2e/440_zhc0_house_team_summary_no_team_branch.spec.js
npx playwright test e2e/438_zhc0_house_team_summary_uses_saved_hq_name.spec.js e2e/440_zhc0_house_team_summary_no_team_branch.spec.js
```

Result:
- `node --check` passed
- `2 passed`

## What I verified

- the founder journey still stays inside the `/app` modal shell
- attaching a seeded house without an active team still lands in the same founder-ready House flow
- the House systems summary helper now has direct founders-loop coverage for the no-team branch
- before HQ naming, the no-team summary stays generic and truthful
- after HQ naming, the no-team summary becomes HQ-branded without inventing a fake team id
- the HQ-branded no-team summary survives reload
- the existing with-team House systems summary coverage still passes unchanged
- no persistence scope changed beyond existing browser-local behavior

## Honest gaps / remaining debt

- HQ naming still persists in browser local storage only
  - coherent for this UI slice, but still not written into server/session/platform state
- the new share-card naming payoff only covers the placeholder shell/body path
  - real minted share payload/body content still does not intentionally reuse the saved HQ name
- deeper downstream surfaces beyond the current House shell still do not reuse the saved HQ name consistently
- the screenshot baseline still reflects the earlier modal shell state
  - I did **not** capture a fresh image pack for this slice
- the outer modal title for the embedded share card still stays generic `Share Card`
  - the current saved-HQ naming sweep has not branded that parent modal chrome yet

## What I did **not** do

- no push
- did **not** touch the unrelated dirty `package-lock.json`
- did **not** broaden persistence scope beyond existing browser storage
- did **not** change route architecture or move the founder flow out of `/app`
- did **not** add extra actions or expand the flow beyond the current modal shell
- did **not** change `public/app.js`; this pass was intentionally test-only
- did **not** update deeper machine/spec artifacts (`docs/founders-loop-state-model.md`, `design/specs/10_founders_loop_ui_state_projection.md`, `design/specs/11_zhc0_ui_evidence_contract.md`, `specs/43_zhc0_founders_loop_state_contract.md`, `machines/FoundersLoop.machine.ts`)

## Blockers

- none for this slice

## Next exact pickup

The cleanest next move is still another tiny saved-HQ naming follow-on, but it should stay as narrow as this pass.

Best next pickup:
1. brand the outer share-card modal title/chrome from the saved HQ name
2. keep it tiny and local to the existing share modal surface
3. keep persistence local-only unless there is an exceptionally small safe path to broader state
4. keep the next move just as narrow
   - modal-only on `/app`
   - one obvious primary action per state
   - no broad Mission rewrite
   - no share architecture expansion
   - no broad UI churn

## Repo state notes

- latest local commit in this slice: `test: cover no-team house summary branch`
- previous local commit before this slice: `c664cbf feat: brand share placeholder shell with saved hq name`
- this M44.18 slice is committed locally in this worktree only
- unrelated dirty file should remain: `package-lock.json` (leave it alone unless explicitly intended)
