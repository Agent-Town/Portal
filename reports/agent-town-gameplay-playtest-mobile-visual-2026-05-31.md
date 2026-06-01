# AgentTown Mobile + Visual Gameplay Playtest - 2026-05-31

Subagent: Hopper
Branch: `neo/progression-atlas-editor-next-2026-05-29`
Worktree: dirty shared branch; no source edits made.
Server: `PORT=4231 NODE_ENV=test STORE_PATH=/tmp/agent-town-hopper-mobile-visual-20260531.sqlite node server/index.js`

## Verdict

PASS for mobile/visual playability.

The newest Founders Plot build is playable and visually coherent at 390x844, 768x1024, and 1280x900. I found no high or medium blockers. The 390px layout no longer horizontally overflows, the Three.js scene is nonblank, tiles can be tapped, Expedition Board selection works in the dense HQ10 scene, and HQ9/HQ10 panels remain reachable and usable on mobile after the Parfit/Faraday/Feynman work.

## Findings

### High

None.

### Medium

None.

### Low - Nonblocking Three.js texture warnings in console

The browser probe captured repeated warnings: `THREE.WebGLRenderer: Texture marked for update but no image data found.`

This did not produce a blank scene or broken visible assets in the screenshots. Canvas pixel probes passed on mobile/tablet/desktop, and image checks found no broken HTML images. Treat this as a cleanup/perf signal for the renderer, not a playability blocker.

## What I Played / Inspected

- Real server-backed 390x844 mobile smoke: reset store, opened `/founders-plot`, tapped tile `0,1`, opened the build palette, placed Lumber Camp.
- Dense HQ10 visual state in browser route fixture at 390x844, 768x1024, and 1280x900 to stress the current UI with Reports, Site Plans, Claims, Research Lodge, HQ9 Work Orders, HQ10A World Grid, HQ10B Civic Proposals, and HQ10C Overlay Packs.
- Mobile dense tile tap: tapped Expedition Board tile `2,1`; building panel selected Expedition Board and exposed `Dispatch scout`.
- Mobile panel reachability: scrolled and captured HQ9 Work Orders, World Grid, Civic Proposals, and Overlay Packs panels.

## Layout + Canvas Metrics

| Surface | Screenshot dimensions | Scroll width | Canvas probe | Notes |
| --- | ---: | ---: | --- | --- |
| Real mobile 390x844 tile placement | 390x5506 | document 390 / body 390 | 362x270, nonblank, 914 variance | Tile tap + placement worked |
| Dense mobile 390x844 | 390x7990 | document 390 / body 390 | 362x270, nonblank, 913 variance | No page-level horizontal overflow |
| Dense tablet 768x1024 | 768x6634 | document 768 / body 768 | 716x446, nonblank, 1079 variance | Tablet-ish layout usable |
| Dense desktop 1280x900 | 1280x7071 | document 1280 / body 1280 | 739x460, nonblank, 1080 variance | Desktop layout usable |

Raw clipping scan note: the only mobile clipped nodes were intentionally clipped scene actor hooks and the closed recap drawer button. Visible panels/cards/buttons had no horizontal scroll impact, and `documentScrollWidth`/`bodyScrollWidth` stayed exactly equal to the viewport width.

## Visual Actors / Assets

Dense state emitted visual-only actors for `scout`, `workshop_specialist`, `market_trader`, and `settler`. The rendered actor hooks normalized them as `scout`, `workshop_specialist`, `trader`, and `settler`, and the Three.js scene was visibly populated/nonblank in every viewport screenshot.

Asset dimension spot-checks passed:

- `pathfinder-scout-v1.png`: 2048x2048
- `workshop-specialist-v1.png`: 2048x2048
- `market-trader-v1.png`: 2048x2048
- `settler-convoy-crew-v1.png`: 2048x2048

Batch C civic/World Grid characters were not expected in this state because the server does not emit `civic_routekeeper`, `oracle_adjunct`, or `outpost_keeper` actors yet.

## HQ9 / HQ10 Mobile Usability

- HQ9 Work Orders panel is reachable at 390px. Completed work order copy shows: `Completed receipt. Child receipts are preserved for audit.`
- HQ10A World Grid panel is reachable and reads as `READ MODEL READY - read-only`; no mutation controls were visible.
- HQ10B Civic Proposals panel is reachable; the proposal form and `Create civic proposal` button fit inside the 390px panel.
- HQ10C Overlay Packs panel is reachable; the overlay-pack form and `Create Overlay Record` button fit inside the 390px panel.

## Proof Files

- Contact sheet: `reports/agent-town-gameplay-playtest-mobile-visual-contact-sheet-2026-05-31.png`
- Proof JSON: `reports/agent-town-gameplay-playtest-mobile-visual-proof-2026-05-31.json`
- Real mobile tile placement: `reports/agent-town-gameplay-playtest-mobile-visual-real-mobile-390x844-tile-placement-2026-05-31.png`
- Dense mobile: `reports/agent-town-gameplay-playtest-mobile-visual-dense-mobile-390x844-2026-05-31.png`
- Dense mobile Expedition Board selected: `reports/agent-town-gameplay-playtest-mobile-visual-mobile-390x844-expedition-board-selected-2026-05-31.png`
- Mobile HQ9 Work Orders: `reports/agent-town-gameplay-playtest-mobile-visual-mobile-390x844-hq9-work-orders-panel-2026-05-31.png`
- Mobile HQ10 World Grid: `reports/agent-town-gameplay-playtest-mobile-visual-mobile-390x844-hq10-world-grid-panel-2026-05-31.png`
- Mobile HQ10 Civic Proposals: `reports/agent-town-gameplay-playtest-mobile-visual-mobile-390x844-hq10-civic-proposals-panel-2026-05-31.png`
- Mobile HQ10 Overlay Packs: `reports/agent-town-gameplay-playtest-mobile-visual-mobile-390x844-hq10-overlay-packs-panel-2026-05-31.png`
- Dense tablet: `reports/agent-town-gameplay-playtest-mobile-visual-dense-tablet-768x1024-2026-05-31.png`
- Dense desktop: `reports/agent-town-gameplay-playtest-mobile-visual-dense-desktop-1280x900-2026-05-31.png`

## Scope Notes

This was a browser-automation visual/playability pass, not a full gameplay regression suite. The early mobile tile action used the real local backend; the late-game HQ9/HQ10 screenshots used a deterministic routed browser state to stress the newest UI without making source or authority changes. No gameplay/server/Atlas authority changes, rendering implementation work, cleanup, push, merge, deploy, or external messages were performed.
