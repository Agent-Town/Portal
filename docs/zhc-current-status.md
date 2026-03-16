# ZHC Current Status Snapshot

Status: M44.1 complete, M44.2 contract/mechanics complete, M44.3 Town Hall founder-progression slice complete, M44.4 conservative alignment/crest gating slice complete and green  
Last updated: 2026-03-16 20:09 Asia/Bangkok  
Branch: `zhc0-founders-loop`  
Worktree: `/Users/robin/.openclaw/workspace/Portal-zhc0`

## What landed this pass

### M44.4 — alignment / crest gating (conservative slice)
Completed for the alignment-passed handoff plus `/create` gating contract.

Key changes:
- added an explicit Town Hall alignment-passed handoff panel
  - root: `#townhallAlignmentPanel`
  - machine markers: `data-zhc-phase="alignment_passed"`, `data-zhc-overlay-state="success_feedback"`, `data-zhc-progress-step="4"`, `data-zhc-progress-total="9"`, `data-zhc-next-unlock="create"`
  - primary move is now explicit: `Create crest`
- removed the premature Town Hall House CTA leak from the alignment handoff
  - `#openReady` now exposes `/create`
  - no `/house` link is shown in the alignment-passed state
- added machine-visible crest gating markers to `/create`
  - root: `#zhcCreateRoot`
  - blocked state: `data-zhc-blocker-key="needs_crest"`
  - ready state flips once the player paints ink onto the crest canvas
  - `Generate house key` remains the single visible primary action on the page
- kept scope tight to measurable gating only
  - `/create` is still blocked before the co-op sigil pass exists
  - House/HQ CTA remains hidden before crest creation
  - no artifact-chain changes; this slice stayed UI-contract/local-state only
- fixed one regression while landing the slice
  - initial alignment override accidentally stripped `data-zhc-primary-action` from the earlier `Open Brain` gate
  - corrected by only overriding primary-action ownership while the alignment-passed handoff is actually active

Relevant files:
- `public/app.js`
- `public/views/townhall.html`
- `public/create.html`
- `public/create.js`
- `e2e/418_zhc0_alignment_gate.spec.js`
- `e2e/419_zhc0_create_crest_contract.spec.js`
- `docs/zhc-current-status.md`

## Evidence runs

### Focused M44.4 command

```bash
npx playwright test \
  e2e/418_zhc0_alignment_gate.spec.js \
  e2e/419_zhc0_create_crest_contract.spec.js
```

Result:
- `3 passed`

### Focused founders-loop regression sweep after the M44.4 changes

```bash
npx playwright test \
  e2e/37_phase1_lite_agent_open_press.spec.js \
  e2e/38_phase1_create_ceremony_regression.spec.js \
  e2e/44_phase2_vendor_open_press.spec.js \
  e2e/59_townhall_worker_single_path_modal.spec.js \
  e2e/415_zhc0_start_entry_contract.spec.js \
  e2e/416_zhc0_first_worker_ready_gate.spec.js \
  e2e/417_zhc0_townhall_founder_progress.spec.js \
  e2e/418_zhc0_alignment_gate.spec.js \
  e2e/419_zhc0_create_crest_contract.spec.js \
  e2e/425_zhc0_founders_loop_resume_contract.spec.js \
  e2e/426_zhc0_founders_loop_machine_projection.spec.js \
  e2e/427_zhc0_founders_loop_mobile_primary_action.spec.js
```

Result:
- `17 passed`

## What I verified

- `/create` redirects away on a fresh session, so crest completion stays blocked before alignment passes
- alignment-passed Town Hall state exposes a dedicated `alignment_passed` handoff with `Create crest` as the only visible primary move
- Town Hall no longer leaks a House CTA before crest creation
- `/create` exposes a blocked crest contract until the player adds ink
- `/create` flips to ready once ink exists, while House still stays hidden until actual crest completion
- prior M44.1/M44.2/M44.3 coverage remained green in the focused regression sweep

## Blockers / honest gaps

- screenshot evidence still has not been generated
- this slice does **not** yet add a dedicated on-screen `crest_created` success handoff before HQ; `/create` still follows the existing house-generation flow once completed
- M44.5 House/HQ first-entry surface is still the next real milestone

## What I did **not** do

- no push
- no screenshot artifacts generated yet
- did **not** modify the artifact chain (`docs/founders-loop-state-model.md`, `design/specs/10_founders_loop_ui_state_projection.md`, `design/specs/11_zhc0_ui_evidence_contract.md`, `specs/43_zhc0_founders_loop_state_contract.md`, `machines/FoundersLoop.machine.ts`) because the transition semantics did not move

## Next exact pickup

Most conservative next move:
1. start M44.5 House / HQ first-entry contract work
2. add / turn green:
   - `e2e/420_zhc0_house_first_entry_hq_surface.spec.js`
3. decide whether the branch still wants an explicit in-UI `crest_created` success handoff on `/create`, or whether that should wait until the House/HQ first-entry slice lands
4. keep M44.4 gating invariant coverage intact while expanding toward HQ-ready

## Repo state notes

Relevant M44.1–M44.4 changes are still local in this worktree.

There are also pre-existing dirty items outside the founders-loop slice (notably `package-lock.json`). Treat the worktree as dirty when resuming, and avoid sweeping unrelated files into the next pass.
