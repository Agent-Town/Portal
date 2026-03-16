# ZHC Current Status Snapshot

Status: M44.1 complete, M44.2 contract/mechanics complete, M44.3 Town Hall founder-progression slice complete, M44.4 modal handoff corrected and green, M44.5 HQ-first-entry modal surface green  
Last updated: 2026-03-16 21:31 Asia/Bangkok  
Branch: `zhc0-founders-loop`  
Worktree: `/Users/robin/.openclaw/workspace/Portal-zhc0`

## Active product direction (authoritative)

Robin clarified two constraints that now govern the founders-loop passes:

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
- if naming / mission handoff / first-step surfaces are touched, bias toward paired interaction language and shared-action framing

## What landed this pass

### M44.4 — `/create` completion now hands back into the House modal flow
The remaining route-shaped founders-loop debt was the `/create` completion handoff: even when Town Hall opened `/create` inside the modal frame, completion still fell forward to raw `/house`.

That is now corrected inside the modal-only flow:
- `public/create.js`
  - embedded ceremony completion now posts a same-origin `agent-town:ceremony-complete` message to the parent shell
  - embedded fallback now prefers `/app?district=house` instead of continuing deeper into raw route flow
- `public/app.js`
  - the `/app` shell now listens for `agent-town:ceremony-complete` from the active district frame
  - on receipt, it refreshes `/api/state` and swaps the modal from the ceremony iframe back into the House district surface
- practical result:
  - Town Hall → crest ceremony still opens inside the district modal frame
  - ceremony completion now re-homes into the House modal instead of continuing as a raw `/house` iframe/route continuation

### UI trim + pair framing on affected founders-loop surfaces
This pass also trimmed the most explanatory copy on the touched founder surfaces without changing ZHC markers.

#### Town Hall
- founder naming copy is shorter and more pair-framed
  - `Name the human` / `What should your agent call you?`
  - `Name the agent` / `What should you call your agent?`
- the registration-processing surface is now terser
- first-worker / sigil / alignment surfaces were reduced to shorter instrument-panel language
- alignment handoff now points to `Open crest studio` instead of narrated prose

#### House / HQ
- HQ copy now frames the house as a paired operating surface inside the modal shell
- room cards were shortened to functional labels and concise affordances
- primary action is now `Open mission`
- mission handoff copy is shorter and shared-task oriented

### New / updated contract coverage
- added: `e2e/428_zhc0_ceremony_modal_handoff.spec.js`
  - verifies ceremony completion re-homes from the `/create` iframe into the House modal shell
- updated: `e2e/420_zhc0_house_first_entry_hq_surface.spec.js`
  - relaxed a stale `mission lane` text expectation to the now-trimmed `mission` surface wording

## Files changed in this slice

- `public/app.js`
- `public/create.js`
- `public/views/townhall.html`
- `public/views/house.html`
- `e2e/420_zhc0_house_first_entry_hq_surface.spec.js`
- `e2e/428_zhc0_ceremony_modal_handoff.spec.js`
- `docs/zhc-current-status.md`

## Evidence runs

### First focused founders-loop/modal sweep
```bash
npx playwright test e2e/59_townhall_worker_single_path_modal.spec.js e2e/417_zhc0_townhall_founder_progress.spec.js e2e/418_zhc0_alignment_gate.spec.js e2e/419_zhc0_create_crest_contract.spec.js e2e/420_zhc0_house_first_entry_hq_surface.spec.js e2e/425_zhc0_founders_loop_resume_contract.spec.js e2e/426_zhc0_founders_loop_machine_projection.spec.js e2e/428_zhc0_ceremony_modal_handoff.spec.js
```

Result:
- `11 passed`
- `1 failed`
- failure was expected text drift in `e2e/420_zhc0_house_first_entry_hq_surface.spec.js`
  - old assertion expected `/mission lane/i`
  - trimmed UI now presents `Mission`

### Green rerun after updating the stale expectation
```bash
npx playwright test e2e/59_townhall_worker_single_path_modal.spec.js e2e/417_zhc0_townhall_founder_progress.spec.js e2e/418_zhc0_alignment_gate.spec.js e2e/419_zhc0_create_crest_contract.spec.js e2e/420_zhc0_house_first_entry_hq_surface.spec.js e2e/425_zhc0_founders_loop_resume_contract.spec.js e2e/426_zhc0_founders_loop_machine_projection.spec.js e2e/428_zhc0_ceremony_modal_handoff.spec.js
```

Result:
- `12 passed`

## What I verified

- Town Hall still opens the ceremony in the district modal frame on `/app`
- completing the embedded ceremony can now hand back into the House district modal instead of continuing the route-based `/house` path
- the House HQ-first-entry surface still exposes exactly one primary action in the ready state
- the affected founders-loop surfaces are materially less narrated and more functional
- the touched naming / alignment / mission surfaces now lean more toward human+agent shared-action framing

## Honest gaps / remaining debt

- the primary flow is now modal-correct, but standalone `/create` still exists as a support route; this pass did **not** delete that page
- the new Robin direction about co-authored wins is only partially expressed so far through copy/handoff framing
  - no bespoke paired interaction mechanic landed yet
  - the example Robin gave (`house naming as a conversation`) is still future work
- `Mission` is still the conservative handoff into the existing Experiences surface, not a bespoke Step 7 paired interaction yet
- no screenshot evidence was captured in this pass

## What I did **not** do

- no push
- did **not** remove the standalone `/create` page itself
- did **not** start a bespoke naming conversation or Step 7 mission mechanic yet
- did **not** modify the deeper founders-loop artifacts (`docs/founders-loop-state-model.md`, `design/specs/10_founders_loop_ui_state_projection.md`, `design/specs/11_zhc0_ui_evidence_contract.md`, `specs/43_zhc0_founders_loop_state_contract.md`, `machines/FoundersLoop.machine.ts`) in this pass

## Next exact pickup

Smallest coherent next slice:
1. turn one early post-crest / early-HQ action into a **real co-authored moment** instead of just trimmed copy
2. best candidate right now: make the first House naming / mission-selection move feel like a concise human+agent exchange inside the existing `/app` modal shell
3. preserve the modal-only rule and keep one obvious primary action per state
4. add a focused contract around that paired interaction rather than broadening the journey all at once

## Repo state notes

- this modal handoff correction is local in this worktree
- there is still a pre-existing unrelated `package-lock.json` modification outside this founders-loop slice; avoid sweeping it into the next commit unless explicitly intended
