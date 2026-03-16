# ZHC Current Status Snapshot

Status: M44.1 complete, M44.2 contract/mechanics complete, M44.3 Town Hall founder-progression slice complete, M44.4 modal handoff corrected and green, M44.5 HQ-first-entry modal surface green, M44.6 shared HQ naming slice green, M44.7 saved HQ name now projects into the House shell header and is green, M44.8 saved HQ name now brands the Mission lane heading/lead and is green, M44.9 saved HQ name now reaches the Mission detail line and is green, M44.10 saved HQ name now reaches the Mission empty-state copy and is green, M44.11 no-experience Mission detail hint is now truthful before save and HQ-branded after save and is green, M44.12 saved HQ name now brands the reconnect share-card action and is green  
Last updated: 2026-03-17 01:15 +0700  
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

### M44.12 — saved HQ name now reaches the reconnect share-card action
The next smallest coherent follow-on outside the Mission copy cluster is now landed in the same `/app` modal shell: the reconnect share-card action now reflects the locally saved HQ name.

What changed:
- before the HQ name is saved, the reconnect action stays generic and does **not** leak draft naming into the share surface
  - it remains `Open share card` when a share path is already present in state
  - it remains `Open share card (preview)` when the house still has no share path in state
- after the HQ name is saved, the reconnect action becomes HQ-branded using only the saved local name for that attached house
  - with no share path yet: `Preview <saved HQ name> HQ share card`
  - with a share path present: `Open <saved HQ name> HQ share card`
- after reload, reopening the same attached house restores that HQ-branded reconnect action immediately
- if no share exists yet and the action falls back to the placeholder card, the supporting missing-share status line now also mentions `<saved HQ name> HQ`

Implementation details:
- `public/app.js`
  - widened the saved-HQ lookup helper so reconnect/share UI can read the already-persisted local name by house id without changing persistence scope
  - added a tiny reconnect share-card CTA renderer so the button label updates both during regular state refreshes and right after the local HQ save action
  - branded the missing-share placeholder status text with the saved HQ name when available
- `e2e/434_zhc0_share_card_button_uses_saved_hq_name.spec.js`
  - added focused founders-loop coverage for generic-before-save behavior, HQ-branded behavior after save, and HQ-branded behavior after reload

### Why this matches the direction better
This keeps the slice narrow and immediately useful:
- still modal-only on `/app`
- still local-only; no server/session/share persistence changes
- still one obvious primary action in the HQ entry state
- avoids more Mission microcopy churn
- gives the saved shared HQ name one more early payoff on a real downstream action instead of only inside the Mission panel copy cluster

## New / updated contract coverage
- added: `e2e/434_zhc0_share_card_button_uses_saved_hq_name.spec.js`
  - verifies the reconnect share-card action stays generic before save
  - verifies saving the HQ name promotes that action into HQ-branded copy
  - verifies the same HQ-branded action returns after reload for the same attached house

## Files changed in this slice

- `public/app.js`
- `e2e/434_zhc0_share_card_button_uses_saved_hq_name.spec.js`
- `docs/zhc-current-status.md`

## Evidence runs

### Focused M44.12 reconnect share-card naming check
```bash
node --check public/app.js && node --check e2e/434_zhc0_share_card_button_uses_saved_hq_name.spec.js && npx playwright test e2e/434_zhc0_share_card_button_uses_saved_hq_name.spec.js
```

Result:
- `1 passed`

### Focused founders-loop House naming / Mission / reconnect share-card sweep
```bash
node --check public/app.js && npx playwright test e2e/420_zhc0_house_first_entry_hq_surface.spec.js e2e/421_zhc0_house_shared_naming.spec.js e2e/428_zhc0_ceremony_modal_handoff.spec.js e2e/429_zhc0_house_header_uses_saved_hq_name.spec.js e2e/430_zhc0_mission_panel_uses_saved_hq_name.spec.js e2e/431_zhc0_mission_detail_uses_saved_hq_name.spec.js e2e/432_zhc0_mission_empty_state_uses_saved_hq_name.spec.js e2e/433_zhc0_mission_empty_detail_hint_uses_saved_hq_name.spec.js e2e/434_zhc0_share_card_button_uses_saved_hq_name.spec.js e2e/188_house_experiences_surface.spec.js
```

Result:
- `10 passed`

## What I verified

- the founder journey still stays inside the `/app` modal shell
- the shared HQ naming move still saves through the same single primary action
- the House modal header still projects the saved HQ name
- the Mission panel heading and lead still project the saved HQ name
- the selected Mission detail line still projects the saved HQ name
- the Mission empty-state still projects the saved HQ name when no experiences are routed yet
- the Mission no-experience detail hint still stays truthful before save and HQ-branded after save
- the reconnect share-card action now stays generic before save and becomes HQ-branded after save
- after reload for the same house, the reconnect share-card action still shows the saved HQ name immediately
- the broader House Experiences surface contract still passes after the reconnect/share wording change

## Honest gaps / remaining debt

- HQ naming still persists in browser local storage only
  - coherent for this UI slice, but still not written into server/session/platform state
- the share-card **page/body** itself still does not reuse the saved HQ name
  - this pass only touches the reconnect/share action wording and fallback status line inside the modal shell
- deeper downstream surfaces beyond the current House shell still do not reuse the saved HQ name consistently
- screenshot baseline still reflects the prior M44.5–M44.11 modal shell state
  - I did **not** capture a fresh image pack for this copy-level reconnect-action change

## What I did **not** do

- no push
- did **not** touch the unrelated dirty `package-lock.json`
- did **not** broaden persistence scope beyond existing local storage
- did **not** change the share-card route/page contract or publish new share metadata
- did **not** add extra actions or expand the flow beyond the current modal shell
- did **not** churn more Mission copy to land this slice
- did **not** update deeper machine/spec artifacts (`docs/founders-loop-state-model.md`, `design/specs/10_founders_loop_ui_state_projection.md`, `design/specs/11_zhc0_ui_evidence_contract.md`, `specs/43_zhc0_founders_loop_state_contract.md`, `machines/FoundersLoop.machine.ts`)

## Blockers

- none for this slice
- conscious limitation remains persistence scope: local-only, by design, to keep the slice small and green

## Next exact pickup

Safest next move is still another tiny saved-HQ projection outside the Mission copy cluster.

Best next pickup:
1. pick one more early shell/support surface that benefits immediately from the saved HQ name without adding UI sprawl
2. strongest remaining candidates are:
   - the reconnect intro/support line
   - a tiny House systems/team summary line
   - a safe placeholder/share-card shell detail if it can stay local-only
3. keep persistence local-only unless there is an exceptionally small safe path to broader state
4. keep the next move just as narrow
   - modal-only on `/app`
   - one obvious primary action per state
   - no broad Mission rewrite or share architecture expansion

## Repo state notes

- this M44.12 reconnect/share-card projection is local in this worktree only
- unrelated dirty file remains: `package-lock.json` (leave it alone unless explicitly intended)
