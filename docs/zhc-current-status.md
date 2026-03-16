# ZHC Current Status Snapshot

Status: M44.1 complete, M44.2 contract/mechanics complete, M44.3 Town Hall founder-progression slice complete, M44.4 modal handoff corrected and green, M44.5 HQ-first-entry modal surface green, M44.6 shared HQ naming slice green, M44.7 saved HQ name now projects into the House shell header and is green, M44.8 saved HQ name now brands the Mission lane heading/lead and is green, M44.9 saved HQ name now reaches the Mission detail line and is green, M44.10 saved HQ name now reaches the Mission empty-state copy and is green, M44.11 no-experience Mission detail hint is now truthful before save and HQ-branded after save and is green, M44.12 saved HQ name now brands the reconnect share-card action and is green, M44.13 saved HQ name now brands the reconnect intro/support line and is green, M44.14 saved HQ name now brands the reconnect copyable house snippet and is green, M44.15 wallet-recovery-specific reconnect intro coverage is now explicit and green  
Last updated: 2026-03-17 02:15 +0700  
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

### M44.15 — dedicated coverage for the wallet-recovery `Welcome back` reconnect intro branch
The smallest coherent hardening slice from the last snapshot is now landed: the wallet-recovery-specific reconnect intro branch is directly covered, without widening persistence or adding new UI churn.

What changed:
- added a focused Playwright spec that exercises the saved-HQ reconnect intro path first in the normal attached-house branch, then again in the wallet-recovery-specific `Welcome back` branch
- the spec saves an HQ name, seeds recovered-wallet continuity in local browser state, reloads the `/app` House modal shell, and asserts that the recovered reconnect intro resolves through the saved-HQ helper path
- this directly proves the recovered copy branch now says:
  - `We found <saved HQ name> HQ for this wallet. Continue with your worker in this session.`
- it also explicitly asserts the recovered reconnect title switches to `Welcome back`

Implementation details:
- `e2e/437_zhc0_wallet_recovery_reconnect_intro_uses_saved_hq_name.spec.js`
  - installs the mock Solana wallet matching the seeded recoverable house
  - bootstraps founders-ready onboarding and attaches the seeded house inside `/app`
  - saves a custom HQ name through the existing single primary action
  - writes recovered wallet continuity into local browser state, reloads, and asserts the `Welcome back` reconnect title plus the HQ-branded recovered intro copy
- `docs/zhc-current-status.md`
  - updated snapshot, evidence, remaining gaps, and next pickup

### Why this matches the direction better
This is the right kind of tiny hardening pass:
- still modal-only on `/app`
- no UI rewrite
- no new actions
- no persistence broadening
- no architecture drift
- pure coverage hardening around an already-real branch that shared code but lacked direct proof

## New / updated contract coverage
- added: `e2e/437_zhc0_wallet_recovery_reconnect_intro_uses_saved_hq_name.spec.js`
  - verifies the standard reconnect intro is still generic before save
  - verifies saving the HQ name brands the standard reconnect intro
  - verifies the wallet-recovery-specific `Welcome back` branch uses the same saved HQ name after reload
  - verifies the recovered reconnect title flips to `Welcome back`

## Files changed in this slice

- `e2e/437_zhc0_wallet_recovery_reconnect_intro_uses_saved_hq_name.spec.js`
- `docs/zhc-current-status.md`

## Evidence runs

### Focused M44.15 wallet-recovery reconnect intro check
```bash
node --check e2e/437_zhc0_wallet_recovery_reconnect_intro_uses_saved_hq_name.spec.js
npx playwright test e2e/437_zhc0_wallet_recovery_reconnect_intro_uses_saved_hq_name.spec.js
```

Result:
- `node --check` passed
- `1 passed`

### Focused founders-loop House naming / Mission / reconnect sweep
```bash
npx playwright test e2e/420_zhc0_house_first_entry_hq_surface.spec.js e2e/421_zhc0_house_shared_naming.spec.js e2e/428_zhc0_ceremony_modal_handoff.spec.js e2e/429_zhc0_house_header_uses_saved_hq_name.spec.js e2e/430_zhc0_mission_panel_uses_saved_hq_name.spec.js e2e/431_zhc0_mission_detail_uses_saved_hq_name.spec.js e2e/432_zhc0_mission_empty_state_uses_saved_hq_name.spec.js e2e/433_zhc0_mission_empty_detail_hint_uses_saved_hq_name.spec.js e2e/434_zhc0_share_card_button_uses_saved_hq_name.spec.js e2e/435_zhc0_reconnect_intro_uses_saved_hq_name.spec.js e2e/436_zhc0_reconnect_snippet_uses_saved_hq_name.spec.js e2e/437_zhc0_wallet_recovery_reconnect_intro_uses_saved_hq_name.spec.js e2e/188_house_experiences_surface.spec.js
```

Result:
- `13 passed`

## What I verified

- the founder journey still stays inside the `/app` modal shell
- the shared HQ naming move still saves through the same single primary action
- the standard reconnect intro still stays generic before save and becomes HQ-branded after save
- the wallet-recovery-specific reconnect title now has direct coverage for the `Welcome back` branch
- the wallet-recovery-specific reconnect intro now has direct coverage proving it uses the saved HQ name
- the reconnect copyable snippet still stays generic before save and becomes HQ-branded after save
- after reload for the same house, the saved HQ preview still returns immediately
- the House modal header still projects the saved HQ name
- the Mission panel heading and lead still project the saved HQ name
- the selected Mission detail line still projects the saved HQ name
- the Mission empty-state still projects the saved HQ name when no experiences are routed yet
- the Mission no-experience detail hint still stays truthful before save and HQ-branded after save
- the reconnect share-card action still stays generic before save and becomes HQ-branded after save
- the broader House Experiences surface contract still passes

## Honest gaps / remaining debt

- HQ naming still persists in browser local storage only
  - coherent for this UI slice, but still not written into server/session/platform state
- the share-card page/body itself still does not reuse the saved HQ name
- the House systems/team summary line still does not reuse the saved HQ name
- deeper downstream surfaces beyond the current House shell still do not reuse the saved HQ name consistently
- screenshot baseline still reflects the prior M44.5–M44.14 modal shell state
  - I did **not** capture a fresh image pack for this test-only hardening slice
- this new spec hardens the recovered **UI branch** through cached wallet continuity on reload
  - it does **not** attempt a broader cold-session / cookie-cleared end-to-end recovery journey

## What I did **not** do

- no push
- did **not** touch the unrelated dirty `package-lock.json`
- did **not** broaden persistence scope beyond existing local storage
- did **not** change `public/app.js`
- did **not** add or rewrite UI copy to land this slice
- did **not** change the share-card route/page contract or publish new share metadata
- did **not** add extra actions or expand the flow beyond the current modal shell
- did **not** update deeper machine/spec artifacts (`docs/founders-loop-state-model.md`, `design/specs/10_founders_loop_ui_state_projection.md`, `design/specs/11_zhc0_ui_evidence_contract.md`, `specs/43_zhc0_founders_loop_state_contract.md`, `machines/FoundersLoop.machine.ts`)

## Blockers

- none for this slice
- conscious limitation remains persistence scope: local-only, by design, to keep the slice small and green

## Next exact pickup

Safest next move is now back to one more tiny saved-HQ projection outside the reconnect copy cluster.

Best next pickup:
1. pick one more early shell/support surface that benefits immediately from the saved HQ name without adding UI sprawl
2. strongest remaining candidates are:
   - a tiny House systems/team summary line
   - a safe placeholder/share-card shell detail if it can stay local-only
3. keep persistence local-only unless there is an exceptionally small safe path to broader state
4. keep the next move just as narrow
   - modal-only on `/app`
   - one obvious primary action per state
   - no broad Mission rewrite or share architecture expansion

## Repo state notes

- this M44.15 hardening slice is local in this worktree only
- unrelated dirty file remains: `package-lock.json` (leave it alone unless explicitly intended)
