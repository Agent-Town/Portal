# AgentTown HQ16V Generated HUD Art + DOM Integration Preflight

Date: 2026-06-02
Branch: `neo/progression-atlas-editor-next-2026-05-29`
Head: `82051836b27a2103a7e8ff93affda7671d0c822a`
Lane: HQ16V Generated HUD Art + DOM Integration Preflight
Verdict: `PREFLIGHT_READY_BLOCKED_ON_VISUAL_ASSET_GENERATION`

## Scope

This is a report/proof-only implementation preflight for replacing the remaining generic Expedition Map DOM/CSS chrome with generated AgentTown HUD art while preserving live DOM controls, accessibility, `data-testid` hooks, and server authority.

No runtime source, tests, server files, schema files, package files, asset files, generated images, git state, public sharing, deploy, merge, or push path was changed.

## Inputs Inspected

- `public/experiences/founders-plot/founders-plot.css`
- `public/experiences/founders-plot/founders-plot.js`
- `public/experiences/founders-plot/assets/expedition-map/hq15e-expedition-unit-marker-sprites-v1/manifest.json`
- `public/experiences/founders-plot/assets/expedition-map/hq14s-public-terrain-underlay-v1/manifest.json`
- `reports/agent-town-hq16p-expedition-map-game-hud-shell-2026-06-02.md`
- `reports/agent-town-hq15q-symbol-first-text-replacement-plan-2026-06-02.md`
- `reports/agent-town-hq16e-runtime-visual-pack-backlog-2026-06-02.md`
- Current proof screenshots:
  - `reports/agent-town-hq16p-expedition-map-game-hud-shell-2026-06-02-desktop.png` (`1232x789`)
  - `reports/agent-town-hq16p-expedition-map-game-hud-shell-2026-06-02-mobile.png` (`366x757`)

## Current DOM/CSS HUD Surfaces Worth Replacing

The Three.js renderer already owns the map, terrain/fog underlay, unit sprites, event/objective markers, command rings, and renderer proof metadata. The remaining high-value surfaces are DOM elements styled with gradients, borders, glyphs, and CSS chips:

1. **Unit dock rail and tokens**
   - Builder: `appendExpeditionUnitRoster` in `public/experiences/founders-plot/founders-plot.js`.
   - CSS: `.fp-expedition-unit-roster`, `.fp-expedition-unit-rail`, `.fp-expedition-unit-token`.
   - Why first: it is a live DOM control surface with selectable buttons, command counts, unit sprites, and stable `data-testid` attributes. Generated art can make it feel like a game dock without changing click handlers or read-model binding.

2. **Selected objective / current-focus plaque**
   - Builder: `appendExpeditionObjectiveStrip` and `expeditionObjectiveModel`.
   - CSS: `.fp-expedition-objective-strip`, `.fp-expedition-guided-loop`, `.fp-expedition-guided-loop__step`.
   - Why first: it is the primary "what now?" surface and still looks like a styled status strip rather than civic game chrome.

3. **Command chips and preview pucks**
   - Builder: selected unit command bar inside `appendExpeditionUnitRoster`; preview panel in `appendExpeditionCommandPreview`.
   - CSS: `.fp-expedition-unit-command-bar`, `.fp-expedition-unit-command-bar__button`, `.fp-expedition-command-preview`.
   - Why first: this is the main interactive seam between DOM and map target rings. Art should frame the existing buttons, not replace them with canvas-only UI.

4. **Inspector drawer frame/spine**
   - Builder: `appendExpeditionInspectorChrome`, `appendExpeditionAuditDetails`, and inspector sections.
   - CSS: `.fp-expedition-inspector-drawer`, `.fp-expedition-inspector-drawer__chrome`, `.fp-expedition-inspector-section`.
   - Why first: this can become a receipt/ledger drawer with parchment/canvas/brass framing while keeping details collapsed and live.

5. **Semantic zoom badge**
   - Builder: `appendExpeditionSemanticZoomOverlay`.
   - CSS: `.fp-expedition-semantic-zoom`.
   - Why first: it is a small overlay, easy to prove, and a good test of art-backed chrome that does not interfere with map pointer events.

6. **Receipt trace / ledger tabs**
   - Builder: `appendExpeditionReceiptTrace`, Event Packet and objective ledger details.
   - CSS: `.fp-expedition-receipt-trace`, `.fp-expedition-audit-details`.
   - Why first: this reinforces Robin's direction that proof belongs behind optional ledger/receipt layers, not primary play text.

## First Tiny Runtime Pack Slots

Keep the first pack to six empty or near-empty chrome assets. Do not bake readable labels, IDs, endpoint names, costs, routes, timers, resources, rewards, combat cues, or fake stamps into the art.

Proposed pack id: `hq16v_generated_hud_dom_chrome_v1`

Recommended directory after a separate art-generation/review lane:

`public/experiences/founders-plot/assets/expedition-map/hq16v-generated-hud-dom-chrome-v1/`

Recommended slots:

| Slot | Runtime file | Purpose | Format / size | DOM binding |
| --- | --- | --- | --- | --- |
| `hud.chrome.unit_dock_rail.v1` | `unit-dock-rail-v1.png` | Timber/canvas/brass rail behind the unit dock. | 1024x256 PNG/WebP, stretch-safe center, transparent edges preferred. | `.fp-expedition-unit-roster::before` or background layer; buttons remain real DOM. |
| `hud.chrome.objective_plaque.v1` | `objective-plaque-v1.png` | Civic objective plaque for Current Focus/guided loop. | 768x256 PNG/WebP or 9-slice panel source. | `.fp-expedition-objective-strip::before`; text and details remain DOM. |
| `hud.chrome.command_puck.v1` | `command-puck-v1.png` | Brass/teal command puck for Move/Scout/Convoy/Found buttons. | 256x256 transparent PNG/WebP, no text. | Button pseudo-element/background on `.fp-expedition-unit-command-bar__button`; click target remains button. |
| `hud.chrome.inspector_drawer_frame.v1` | `inspector-drawer-frame-v1.png` | Parchment/canvas drawer frame or spine for receipts/details. | 1024x1024 9-slice source or frame PNG with slice metadata. | `.fp-expedition-inspector-drawer` background/border image; summaries remain `<details>`. |
| `hud.chrome.semantic_zoom_badge.v1` | `semantic-zoom-badge-v1.png` | Small worn teal/cream badge for zoom tier. | 384x128 PNG/WebP. | `.fp-expedition-semantic-zoom strong::before` or background. |
| `hud.chrome.receipt_ledger_tab.v1` | `receipt-ledger-tab-v1.png` | Receipt tab treatment for collapsed proof/ledger details. | 384x128 PNG/WebP, transparent, no text. | `.fp-expedition-audit-details summary::before` or background. |

Visual direction for all slots:

- AgentTown frontier-tech civic settlement, human-plus-agent collaboration.
- Timber, brass, canvas, parchment, worn teal, cream paper, hand-built civic UI, scout ledgers, receipt tabs, beacon glow.
- Subtle bounded agent-tech glow is okay: cyan/teal beads, tiny civic signal lamps, warm non-surveillance indicators.
- Avoid Wild West/cowboy/saloon/gold-rush drift, guns, badges, sheriff stars, poker/casino motifs, wanted posters, readable text, logos, coins-as-rewards, trade routes, combat/defense cues, surveillance equipment, and cyberpunk chrome.

## Manifest And Provenance Requirements

Runtime promotion should require a manifest at:

`public/experiences/founders-plot/assets/expedition-map/hq16v-generated-hud-dom-chrome-v1/manifest.json`

Minimum manifest shape:

```json
{
  "id": "hq16v_generated_hud_dom_chrome_v1",
  "kind": "agenttown.expedition_map.runtime_hud_dom_chrome_pack",
  "version": "hq16v_generated_hud_dom_chrome_v1",
  "presentationOnly": true,
  "visualOnly": true,
  "serverOwnedReadModelRequired": true,
  "domControlsRemainAuthoritative": true,
  "noBakedReadableText": true,
  "scoutSectorOnlyFogRevealPath": true,
  "source": {
    "kind": "generated_review_asset_promotion",
    "reviewReport": "reports/agent-town-hq16v-generated-hud-art-review-2026-06-02.md",
    "reviewMediaDir": "reports/media/agent-town-hq16v-generated-hud-art-review-2026-06-02/",
    "runtimeAuthority": "presentation_only_no_gameplay_truth"
  },
  "guardrails": {
    "serverAuthorityUnchanged": true,
    "movementAuthority": false,
    "routeAuthority": false,
    "resourceTruth": false,
    "rewardCreation": false,
    "combat": false,
    "scheduler": false,
    "atlasExecution": false,
    "generatedUniverseRuntimeExpansion": false,
    "externalEffects": false,
    "hiddenTruthLeakage": false
  },
  "assets": {}
}
```

Per asset entry should include:

- `slotId`
- `file`
- `sameOriginPath`
- `assetKind`
- `dimensions`
- `format`
- `sha256`
- `sourcePromptPath`
- `sourceImagePath`
- `runtimeCrop` or `sliceGuide`
- `reviewVerdict`
- `transparentOrSafeFill`
- `smallSizeLegible`
- `noReadableText`
- `noGameplayAuthority`
- `allowedDomSelectors`
- `blockedBindings`

Do not expose prompt/provenance text in the user-facing UI. Manifest/proof can cite it; player surfaces should not.

## Safe Implementation Plan

1. **Generate/review only in a separate art lane**
   - Write review media to `reports/media/...` only.
   - Record prompt, model, source dimensions, negative constraints, SHA-256, reviewer verdict, alpha/small-size checks, and Wild-West-drift check.
   - Runtime promotion remains blocked until the review pack exists.

2. **Promote same-origin assets in a separate runtime lane**
   - Add only the six chrome assets plus `manifest.json` under the proposed `public/.../hq16v-generated-hud-dom-chrome-v1/` directory.
   - Keep assets empty/chrome-only: no labels, IDs, endpoint words, costs, route lines, or hidden-world hints.

3. **CSS-layer integration only**
   - Add CSS custom properties for pack paths, for example `--fp-hud-unit-dock-rail`.
   - Apply art through backgrounds, `border-image`, masks, or `::before`/`::after`.
   - Keep `pointer-events: none` on decorative pseudo-elements.
   - Keep real DOM buttons, summaries, labels, `aria-label`, `title`, and `data-*` attributes intact.
   - Do not move command handling into Three.js or image hitboxes.

4. **No server authority changes**
   - Do not change server routes, tool actions, schema, read-model fields, mutation payloads, or idempotency keys.
   - Existing command buttons still call the same handlers: Scout Sector, Move Unit, Prepare Convoy, Found Settlement.
   - Art never creates command availability, target eligibility, movement permission, receipt existence, fog state, objective completion, or location truth.

5. **Responsive integration**
   - Use 9-slice-style assets for frames where possible.
   - Preserve fixed dimensions/aspect constraints for rail, buttons, and badges so art loading cannot shift layout.
   - Use CSS fallbacks matching the current gradients if assets fail to load.
   - Ensure mobile does not push the Three.js map below a new decorative header.

## Verification Plan

Future generation/review lane:

- `file` and `magick identify` on review images.
- `shasum -a 256` for generated source and candidate runtime crops.
- Review report checks for no text/logos, no Wild West drift, no hidden-truth cues, no route/resource/reward/combat/scheduler/external-effects cues.
- `jq empty` on review proof JSON.

Future runtime promotion/integration lane:

- Syntax:
  - `node --check public/experiences/founders-plot/founders-plot.js`
  - `node --check e2e/200_founders_plot.spec.js`
  - `node --check e2e/204_founders_plot_hq16m_prepare_convoy_to_settler_map_bridge.spec.js`
- Manifest and assets:
  - `jq empty public/experiences/founders-plot/assets/expedition-map/hq16v-generated-hud-dom-chrome-v1/manifest.json`
  - `jq empty reports/agent-town-hq16v-generated-hud-art-dom-integration-proof-2026-06-02.json`
  - `file public/experiences/founders-plot/assets/expedition-map/hq16v-generated-hud-dom-chrome-v1/*.{png,webp}`
  - `magick identify` for dimensions/alpha where ImageMagick is available.
- Build:
  - `npm run build:founders-plot-threejs`
- Focused Playwright:
  - `npx playwright test e2e/200_founders_plot.spec.js --project=chromium --grep "FP-E2E-022" --reporter=line`
  - `npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js --project=chromium --grep "FP-E2E-023" --reporter=line`
  - Bridge flow proof such as `FP-E2E-022M` if command preview/convoy/found-outpost surfaces are styled.
- Screenshot/file checks:
  - Desktop and mobile screenshots.
  - Verify generated chrome appears in the unit dock, objective plaque, command pucks, inspector drawer, semantic zoom badge, and receipt tabs.
  - Verify decorative pseudo-elements do not intercept clicks.
- Text-overlap/mobile checks:
  - At `366x757` and `390x844`, no command button text/icon clipping.
  - No primary HUD overlap with map controls or semantic zoom overlay.
  - No horizontal overflow.
  - Text inside buttons, summaries, and chips remains readable with art loaded and with art blocked.
- Authority/proof gates:
  - Existing command buttons retain `data-testid`, `data-command-id`, server mutation flags, idempotency keys where applicable, and accessible labels.
  - Hidden/hinted/locked cells do not gain terrain/resource/route/reward clues from HUD art.
  - Proof JSON records `serverAuthorityUnchanged: true`, `domControlsRemainLive: true`, `decorativePointerEventsNone: true`, and all blocked authority flags as false.
- Cleanup checks:
  - `git diff --check`
  - Focused `git diff --check -- reports/...` for report/proof files.

## BLOCKED / PREFLIGHT Notes

Runtime integration should wait. The current repository has no generated HQ16V HUD chrome assets or review pack to promote.

The next safe lane is review-only image generation for the six slots above, not runtime promotion. After that, a separate bounded promotion lane can add the same-origin pack, manifest, CSS-only integration, screenshots, and proof gates.

Do not use this lane to add new Scout/Outpost authority, route/trade/economy/resource/reward/combat/scheduler behavior, Atlas execution, Generated Universe runtime, hidden autonomy, hidden-truth leakage, cross-plot mutation, public/deploy/merge/push actions, or external effects.

## Recommended Next Lane

`HQ16W Generated HUD Chrome Review Pack`

Goal: generate and review the six chrome-only art slots under `reports/media/...`, with prompt/provenance/proof only and `runtimePromotion: false`.
