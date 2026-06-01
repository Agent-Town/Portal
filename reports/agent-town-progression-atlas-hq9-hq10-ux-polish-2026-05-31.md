# AgentTown Progression Atlas HQ9/HQ10 UX Polish

Date: 2026-05-31
Worktree: `/Users/robin/Projects/Portal-atlas-editor`
Branch: `neo/progression-atlas-editor-next-2026-05-29`

## UX Changes

- Added an Atlas operations strip above the canonical map:
  - `Authority Boundary` shows server-owned action refs, Atlas executable count, advisory strategies, and canonical node count.
  - `HQ9 Work Orders` summarizes the `collect_ready_outputs_once` server template, allowed action, caps, prerequisites, and no-scheduler/no-spend/no-arbitrary-tools guardrails.
  - `HQ10 World Grid` summarizes the future World Grid horizon, current HQ6 bridge, advisory mutation policy, next read-model slice, and guardrails.
- Reworked prerequisite visibility:
  - Resource gates are now labeled as server-owned gates or draft advisory gates.
  - Building prerequisite items show required READY state, such as `Expedition Board READY`.
  - The top summary now includes outpost and work-order counts.
- Expanded the canonical coverage map to include HQ6, HQ upgrade prerequisite gates, Expedition Board loops, HQ6-HQ9 planning/research/cohort lanes, policies, rewards, storage, and construction caps.
- Improved Engine Graph Studio scanning:
  - Added planning, settlement, research, and cohort groups.
  - The inspector now shows prerequisite blockers, metadata-only action refs, HTTP method/path when present, and explicit copy that Atlas cannot execute refs.
- Tightened mobile layout for the new operations panels and authority metrics.

## Files Changed

- `public/progression-atlas.html`
- `public/progression-atlas.css`
- `public/progression-atlas.js`
- `e2e/114_progression_atlas_openclaw_lite.spec.js`
- `reports/agent-town-progression-atlas-hq9-hq10-ux-polish-desktop-2026-05-31.png`
- `reports/agent-town-progression-atlas-hq9-hq10-ux-polish-mobile-2026-05-31.png`
- `reports/agent-town-progression-atlas-hq9-hq10-ux-polish-2026-05-31.md`

## Proof Paths

- Desktop embedded Atlas proof: `reports/agent-town-progression-atlas-hq9-hq10-ux-polish-desktop-2026-05-31.png`
- Mobile operations proof: `reports/agent-town-progression-atlas-hq9-hq10-ux-polish-mobile-2026-05-31.png`

## Tests Run

Passed:

- `node --check public/progression-atlas.js`
- `node --check e2e/114_progression_atlas_openclaw_lite.spec.js`
- `PW_PORT=4249 npx playwright test e2e/114_progression_atlas_openclaw_lite.spec.js --project=chromium` - 2/2
- `git diff --check`

## Residual Risks

- The separate HQ10A World Grid read-model lane appears to add volatile projection timestamps into `gameplayStableHash`. The Atlas e2e now proves no gameplay mutation with plot continuity, audit event count, and inventory checks instead of relying on byte-for-byte stable hash equality across read-only calls. The server lane should decide whether World Grid volatile fields belong in the stable gameplay hash.
- The Atlas remains non-executable by design. Action refs are clearer, but actual draft/execute buttons still live in Founders Plot server-owned UI surfaces.
- The current work-order visual still uses existing cohort dossier art. No new World Grid or Cohort Coordinator asset was generated in this lane.
