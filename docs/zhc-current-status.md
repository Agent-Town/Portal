# ZHC Current Status Snapshot

Status: M44.1 complete, M44.2 contract/mechanics complete, M44.3 Town Hall founder-progression slice complete, M44.4 modal handoff corrected and green, M44.5 HQ-first-entry modal surface green, M44.6 shared HQ naming slice green  
Last updated: 2026-03-16 22:11 Asia/Bangkok  
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

### M44.6 — shared HQ naming now sits inside the existing House modal handoff
The next smallest coherent slice is now live inside the existing HQ-first-entry surface.

What changed:
- the House modal now opens with a concise paired naming move before Mission
- the surface shows one word from the human side and one word from the agent side
- the pair gets one editable shared HQ name field plus one obvious primary action
- the primary action saves the shared name and opens Mission in the same move
- after the name is saved, the same surface simplifies back down to `Open mission`

Implementation details:
- `public/views/house.html`
  - added a minimal paired proposal row inside the HQ panel
  - added live HQ-name preview + editable input
  - kept the entire interaction inside the existing `/app` modal shell
- `public/app.js`
  - derives concise deterministic human/agent word proposals from founder names + house id
  - persists the chosen HQ name in local storage keyed by house id
  - preserves one primary action by making the mission button also commit the shared name
  - changes the CTA label by state:
    - fresh house: `Name HQ and open mission`
    - after save: `Open mission`
  - Enter on the input also triggers the same single primary action
- `public/styles.css`
  - adds minimal styling for the paired proposal strip and live HQ-name preview

### Why this matches the direction better
This is the first early post-crest / early-HQ interaction that feels like a shared win rather than a dead handoff panel:
- still modal-only on `/app`
- still sparse and functional
- still one obvious primary action
- explicitly framed as the human and agent contributing together
- not a fake chat app and not a wall of copy

## New / updated contract coverage
- added: `e2e/421_zhc0_house_shared_naming.spec.js`
  - verifies the paired human+agent naming surface appears on first House entry
  - verifies the user can edit the shared HQ name
  - verifies the saved name persists after reload for the same house
  - verifies the primary action remains singular and then simplifies to `Open mission`
- updated: `e2e/428_zhc0_ceremony_modal_handoff.spec.js`
  - ceremony completion still re-homes into the House modal
  - assertion now expects the naming-first HQ state rather than the pre-M44.6 plain `Open mission` state

## Files changed in this slice

- `public/app.js`
- `public/views/house.html`
- `public/styles.css`
- `e2e/421_zhc0_house_shared_naming.spec.js`
- `e2e/428_zhc0_ceremony_modal_handoff.spec.js`
- `docs/zhc-current-status.md`

## Evidence runs

### Focused founders-loop HQ naming sweep
```bash
npx playwright test e2e/420_zhc0_house_first_entry_hq_surface.spec.js e2e/421_zhc0_house_shared_naming.spec.js e2e/428_zhc0_ceremony_modal_handoff.spec.js
```

Result:
- `3 passed`

### Syntax sanity on touched browser files
```bash
node --check public/app.js && node --check public/create.js
```

Result:
- passed

## What I verified

- the first House HQ entry still lives inside the `/app` modal shell
- the first HQ state now presents a concise co-authored naming move instead of only a static mission handoff
- the human and agent names from onboarding are surfaced directly in the paired naming UI
- the shared HQ name can be edited before Mission opens
- the chosen HQ name persists across reload for the same attached house
- after save, the primary action simplifies back down to `Open mission`
- ceremony handoff still lands correctly in the House modal and now lands on the naming-first surface

## Honest gaps / remaining debt

- HQ naming currently persists in browser local storage only
  - it is coherent for the UI slice, but it is **not** yet written into server/session/platform state
- the saved shared name is not yet reused broadly across the rest of the product
  - it does not yet flow into share cards, deeper House surfaces, or longer-lived metadata
- this pass intentionally stops at the smallest coherent shared-win interaction
  - it does **not** introduce a broader Step 7 paired mission mechanic yet
- no screenshot evidence was captured in this pass

## What I did **not** do

- no push
- did **not** touch the unrelated dirty `package-lock.json`
- did **not** broaden the slice into a fake conversation UI or chat surface
- did **not** update deeper machine/spec artifacts (`docs/founders-loop-state-model.md`, `design/specs/10_founders_loop_ui_state_projection.md`, `design/specs/11_zhc0_ui_evidence_contract.md`, `specs/43_zhc0_founders_loop_state_contract.md`, `machines/FoundersLoop.machine.ts`)

## Blockers

- none for this slice
- main conscious limitation is persistence scope: local-only for now, by design, to keep the change minimal and green

## Next exact pickup

Best next small follow-on:
1. use the saved HQ name in one more place where it pays off immediately
   - strongest candidate: reflect it in the Mission/House header or another early post-entry shell surface
2. decide whether the HQ name should graduate from local UI state into server/platform state
3. keep the next move just as narrow
   - modal-only on `/app`
   - one obvious primary action
   - no broad ceremony / mission rewrite

## Repo state notes

- this M44.6 naming slice is local in this worktree only
- unrelated dirty file remains: `package-lock.json` (leave it alone unless explicitly intended)
