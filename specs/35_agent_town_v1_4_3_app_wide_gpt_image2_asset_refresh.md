# Agent Town V1.4.3 — App-Wide GPT Image 2 Asset Refresh Specification

**Status:** implemented on release branch, with final release-candidate cleanup applied  
**Target branch name:** `codex/agent-town-v1-4-3-app-wide-gpt-image2-refresh`  
**Depends on:** Founders Plot V1.4.2 Patch 2 signoff branch, or latest accepted Founders Plot visual baseline  
**Primary goal:** upgrade the visual appeal of the whole Agent Town app outside the Founders Plot gameplay asset pack, using Codex + GPT Image 2 in a controlled, prompt-versioned, manifest-backed pipeline.

---

## 0. Executive summary

Founders Plot game assets have now received a GPT Image 2 rebuild and acceptance cleanup path. The rest of the app still contains older or partially upgraded assets: the Start Gate, town shell, district modals, Town Hall onboarding, Brain connect surface, House, Pony Express, Saloon, Sigil, Atlas, Leaderboard, empty states, district icons, brand headers, and small platform images.

This sprint upgrades the **platform shell and non-game app surfaces** so the whole product feels coherent with the new Agent Town frontier-storybook style.

The sprint is not about new gameplay. It is a **visual production and integration sprint**.

The core outcome:

> A new user should move from Start Gate → town shell → Town Hall / Brain / House / Founders Plot without feeling that different parts of the app belong to different visual eras.

### 0.1 Release-candidate cleanup note

The final release line includes one narrow cleanup patch on top of the visual refresh:

- raw `agent.panel.*` fallback keys must never appear in normal player-facing routes, even if the shared agent panel boots before the i18n bundle is ready;
- raw wallet error codes such as `NO_SOLANA_WALLET` must never appear in player-facing copy;
- successful Town Hall registration must hand off directly into the Brain district when Brain is the next required onboarding step;
- the standalone Sigil route must keep the worker reconnect controls available whenever onboarding reaches Sigil before the worker is live, and it must not duplicate unnecessary title chrome around the ceremony illustration;
- the app-wide signoff sheet must reflect the current automated proof, current owner-approved baseline decisions, and any remaining caveats truthfully;
- this cleanup does not reopen asset generation, gameplay, economy, runtime, or Founders Plot art scope.

---

## 1. Product framing

### 1.1 Masterbrand hierarchy

Use the established naming architecture:

- **Agent Town** = product / world / masterbrand.
- **Founders Plot** = launch chapter / first playable campaign.
- Platform hero cast = brand ensemble for marketing, onboarding, loading, and platform identity.
- Clover = Founders Plot gameplay partner / Foreman.

### 1.2 Visual objective

The app should feel like one authored frontier platform:

- warm;
- playful;
- storybook / soft-3D collectible;
- civically hopeful;
- AI-native but not sterile;
- game-first, not dashboard-first;
- coherent across shell, onboarding, settings, and gameplay entry points.

### 1.3 Why now

The V1.4.2 GPT Image 2 rebuild materially improved Founders Plot. Leaving the rest of the app unchanged creates a quality gap: the player enters through older assets, then sees stronger game art later. This sprint closes that gap.

---

## 2. Scope

### 2.1 In scope

Inventory, regenerate, integrate, and validate non-Founders-Plot platform assets for:

1. **Start Gate / landing entry**
   - start hero background;
   - warning / playful disclaimer framing;
   - hero-cast strip or brand emblem;
   - primary CTA visual treatment.

2. **Town shell / district hub**
   - town-shell background;
   - district-map decorative background;
   - district hotspot/icon set;
   - modal header images.

3. **Town Hall onboarding**
   - human + agent ceremony illustration;
   - registration / identity / handshake visual;
   - “begin your town” visual bridge into Founders Plot.

4. **Brain connection surface**
   - friendly “agent brain” marker;
   - model/provider setup illustration;
   - safe AI/runtime status empty states.

5. **House / home / claim / share surfaces**
   - house visual;
   - deed / key / mailbox images;
   - share-card background.

6. **Pony Express / Inbox**
   - sealed note / courier / post office art;
   - message empty state;
   - delivery status icons.

7. **Saloon**
   - saloon exterior/interior illustration;
   - future-experience placeholder visual;
   - “games are coming” surface.

8. **Sigil / Ceremony**
   - lock/sigil visual;
   - co-op ritual illustration;
   - matching / unlock status visuals.

9. **Atlas / Leaderboard / Marketplace-adjacent surfaces**
   - atlas map / discovery illustration;
   - standings / mayor board illustration;
   - empty states and badges.

10. **Platform hero cast usage**
    - owner-supplied hero cast appears in brand/marketing/onboarding contexts;
    - not injected into default Founders Plot gameplay.

11. **Small brand assets**
    - logo treatment if needed;
    - favicon / icon set only if it does not break existing brand recognition;
    - loading splash;
    - generic empty/error/loading illustrations.

12. **Prompts and provenance**
    - prompt files stored under `specs/prompts/v1_4_3/` and/or `public/assets/platform/prompts/v1_4_3/`;
    - app-wide asset manifest;
    - signoff sheet;
    - screenshot baselines.

### 2.2 Out of scope

Do **not** implement:

- new Founders Plot gameplay systems;
- new game resources, contracts, buildings, or economy;
- persistent/off-session Foreman;
- doctrine board;
- specialist agents;
- social systems;
- renderer rewrite;
- new wallet/identity flows;
- major UX flow changes;
- new token economy or marketplace features;
- new hero-video extraction workflow.

### 2.3 Founders Plot boundary

Do **not** replace accepted Founders Plot gameplay assets unless Patch 2 explicitly requires it. This sprint may reference Founders Plot assets for style continuity, but it should not reopen the game-asset signoff.

---

## 3. Source-of-truth documents to update

The implementation must update or add the following artifacts:

```text
AGENTS.md
BRAND.md
DESIGN.md
GAME_UX.md
REGISTRY.md
specs/35_agent_town_v1_4_3_app_wide_gpt_image2_asset_refresh.md
specs/36_agent_town_v1_4_3_tdd_acceptance_matrix.md
docs/visual/APP_WIDE_ASSET_INVENTORY_V1_4_3.md
docs/visual/APP_WIDE_ASSET_MANIFEST_SCHEMA_V1_4_3.md
docs/visual/APP_WIDE_PROMPT_LIBRARY_V1_4_3.md
docs/visual/APP_WIDE_VISUAL_SIGNOFF_SHEET_V1_4_3.md
docs/visual/APP_WIDE_SURFACE_MAP_V1_4_3.md
public/assets/platform/asset-manifest.json
public/assets/platform/prompts/v1_4_3/*
```

If the repo keeps design docs under `Brand kit/guidelines/agent-town-design-pack/`, update that canonical location and optionally add root redirect stubs.

---

## 4. Required asset inventory

Before generating anything, Codex must create or update `docs/visual/APP_WIDE_ASSET_INVENTORY_V1_4_3.md`.

The inventory must list every non-game asset candidate under:

```text
public/assets/
public/images/
public/brand-kit/
public/views/
public/agenttown.jpeg
public/logo.jpg
public/background.webp
public/favicon-*.png
public/favicon.ico
```

For each asset:

```yaml
id: string
currentPath: string
usedBy:
  - routeOrFile: string
surface: start_gate | town_shell | townhall | brain | house | pony | saloon | sigil | atlas | leaderboard | share | claim | generic
role: hero_background | illustration | icon | empty_state | decoration | logo | favicon | card_art | modal_header
currentStatus: keep | regenerate | replace_with_existing | retire | unknown
priority: P0 | P1 | P2
replacementPromptFile: string | null
replacementPath: string | null
notes: string
```

No production asset replacement may happen before inventory exists.

---

## 5. Generation workflow

### 5.1 Candidate-first, production-second

All generated assets must first land in candidate folders:

```text
public/assets/candidates/v1_4_3/<surface>/<asset-id>/
```

Production assets land only after selection:

```text
public/assets/platform/<asset-id>.webp
public/assets/platform/<surface>/<asset-id>.webp
public/images/<asset-id>.webp
```

### 5.2 Prompt files are source files

Every generated production asset must have a prompt file. Prompt files are durable source code.

Required prompt file fields:

```yaml
---
id: start_gate_hero_v1_4_3
model: gpt-image-2
assetRole: hero_background
surface: start_gate
size: 2048x1152
quality: high
references:
  - public/assets/hero-cast/hero-cast-group.webp
  - public/experiences/founders-plot/assets/scenes/founders-plot-desktop.webp
negativePromptRef: specs/prompts/v1_4_3/00_global_style_lock.md#negative
owner: Robin
status: draft | candidate | approved | rejected
---

## Prompt
...

## Notes
...
```

### 5.3 Human signoff required

App-wide assets can be generated by Codex/GPT Image 2, but they are not approved until a named human signs off.

For this sprint, default reviewer/art owner:

```yaml
artOwner: Robin
```

If another reviewer is used, the signoff sheet must say so.

### 5.4 Reuse the owner-approved humorous copy

The Start Gate line:

```text
WARNING! CONTAINS AND PRODUCES AI SLOP.
```

is product-owner-approved humorous brand copy. It must not be removed unless Robin explicitly reverses that decision.

The visual treatment around it may be improved so it feels intentional and playful rather than accidental or broken.

---

## 6. Style lock

### 6.1 Shared visual style

Use one coherent style family:

```text
Agent Town frontier storybook / soft-3D collectible / warm civic-builder
```

Properties:

- soft 3D / storybook, not pixel art;
- warm sunrise / golden-hour frontier palette;
- tactile wood, brass, parchment, leather, clay, fabric;
- rounded friendly silhouettes;
- optimistic civic tone;
- playful but not childish;
- AI-native but not cyberpunk;
- consistent with V1.4.2 Founders Plot art baseline.

### 6.2 Negative style rules

Avoid:

- generic SaaS dashboards;
- neon cyberpunk;
- grimdark westerns;
- harsh realism;
- pixel art;
- flat placeholder vector art;
- over-detailed cinematic images that fight UI readability;
- fake text in images;
- cluttered mobile-game ad style;
- copying a commercial game’s trade dress.

### 6.3 Platform vs gameplay distinction

Platform assets may be more brand/story oriented than Founders Plot gameplay assets.

Examples:

- Start Gate can use hero-cast ensemble art.
- Town shell can use broad scenic town imagery.
- Founders Plot default gameplay remains focused on plot + Clover.

---

## 7. Surface-by-surface requirements

### 7.1 Start Gate

Must generate or select:

- `start-gate-hero-v1_4_3.webp`
- `start-gate-card-ornament-v1_4_3.svg|webp`
- optional `hero-cast-strip-v1_4_3.webp`

Acceptance:

- 1280 screenshot reads as a game/product landing, not a technical portal.
- CTA remains clear.
- AI SLOP copy remains visible and intentional.
- Load time remains within budget.

### 7.2 Town shell

Must generate or select:

- `town-shell-background-v1_4_3.webp`
- district icon set for Town Hall, Founders Plot, Brain, House, Pony, Saloon, Atlas/Leaderboard.

Acceptance:

- town shell feels like the same world as Founders Plot;
- district icons are readable at navigation size;
- debug/provider/runtime concepts remain backstage unless explicitly opened.

### 7.3 Town Hall onboarding

Must generate or select:

- `townhall-onboarding-illustration-v1_4_3.webp`
- `identity-handshake-v1_4_3.webp` or equivalent ceremony visual.

Acceptance:

- onboarding feels like a story moment, not account setup;
- wallet/chain detail remains progressively disclosed;
- visual metaphor is human + agent entering town together.

### 7.4 Brain connect

Must generate or select:

- `brain-connect-marker-v1_4_3.webp`
- `brain-empty-state-v1_4_3.webp`
- `brain-connected-state-v1_4_3.webp` optional.

Acceptance:

- surface remains understandable to nontechnical users;
- no scary backend-runtime visual language;
- the image supports the copy: “connect your agent’s brain.”

### 7.5 House / Home / Claim / Share

Must generate or select:

- `house-cozy-cabin-v1_4_3.webp`
- `deed-key-v1_4_3.webp`
- `share-card-background-v1_4_3.webp`

Acceptance:

- home/claim visuals create ownership and warmth;
- share card is attractive enough to post;
- no gameplay state is falsely represented.

### 7.6 Pony Express / Inbox

Must generate or select:

- `pony-express-office-v1_4_3.webp`
- `sealed-letter-empty-state-v1_4_3.webp`
- `delivery-badge-set-v1_4_3.svg|webp`

Acceptance:

- private communication feels charming and secure;
- empty inbox does not feel broken;
- sealed/private semantics are visible.

### 7.7 Saloon

Must generate or select:

- `saloon-frontier-room-v1_4_3.webp`
- `saloon-coming-soon-v1_4_3.webp`

Acceptance:

- Saloon feels like a future games/experiences hub;
- does not promise unimplemented gameplay;
- art does not compete with Founders Plot as the primary V1 game.

### 7.8 Sigil / Ceremony

Must generate or select:

- `sigil-lock-v1_4_3.webp`
- `co-op-unlock-ritual-v1_4_3.webp`

Acceptance:

- co-op ritual is playful and legible;
- not mystical in a way that conflicts with frontier civic-builder tone;
- clearly about human + agent co-op.

### 7.9 Atlas / Leaderboard

Must generate or select:

- `atlas-map-v1_4_3.webp`
- `leaderboard-town-board-v1_4_3.webp`
- `empty-board-v1_4_3.webp`

Acceptance:

- discovery and ranking surfaces feel civic, not esporty;
- empty states encourage exploration;
- no raw spreadsheet visual as default.

---

## 8. Asset manifest requirements

Create or update:

```text
public/assets/platform/asset-manifest.json
```

Required top-level shape:

```json
{
  "schemaVersion": "v1.4.3",
  "styleFamily": "agent-town-frontier-storybook-v1_4_3",
  "modelFamily": "gpt-image-2",
  "generatedAt": "2026-04-22T00:00:00.000Z",
  "approvalStatus": "pending|approved|approved_with_caveats",
  "approvedBy": "Robin",
  "assets": []
}
```

Each asset must include:

```json
{
  "id": "start-gate-hero-v1_4_3",
  "path": "public/assets/platform/start-gate-hero-v1_4_3.webp",
  "surface": "start_gate",
  "role": "hero_background",
  "model": "gpt-image-2",
  "promptFile": "specs/prompts/v1_4_3/start_gate_hero_v1_4_3.md",
  "promptHash": "sha256:...",
  "referenceInputs": [],
  "referenceHashes": [],
  "candidatePaths": [],
  "postProcessing": [],
  "width": 2048,
  "height": 1152,
  "bytes": 0,
  "format": "webp",
  "approvedBy": "Robin",
  "approvedAt": "2026-04-22",
  "approvalNotes": "...",
  "replaces": [],
  "rollbackPath": null
}
```

---

## 9. Integration rules

### 9.1 No orphan assets

Every production asset must be referenced by at least one route/component or explicitly marked `future_use` in the manifest.

### 9.2 No untracked prompt use

No generated production asset may exist without a prompt file and manifest entry.

### 9.3 No gameplay state in static platform art

Static platform art may show symbolic scenes, but it must not represent live gameplay state as if it were true.

### 9.4 Keep debug backstage

Normal app surfaces must not display worker/provider/runtime/debug imagery unless the user opens an explicit debug/developer mode.

### 9.5 Image budgets

Initial budget targets:

```yaml
platformTotalProductionBytesMax: 8MB
singleHeroImageMax: 1.2MB
singleCardIllustrationMax: 600KB
singleIconMax: 80KB
mobileCriticalPathImagesMax: 2MB
```

If exceeded, the implementation must justify the exception in the signoff sheet.

---

## 10. Testing requirements

Add Node/Playwright tests in the V1.4.3 range.

Recommended names:

```text
tests/v1_4_3_app_wide_asset_inventory.test.js
tests/v1_4_3_platform_asset_manifest_schema.test.js
tests/v1_4_3_platform_prompt_coverage.test.js
tests/v1_4_3_design_doc_update.test.js
e2e/191_agent_town_v1_4_3_start_gate_visual.spec.js
e2e/192_agent_town_v1_4_3_town_shell_visual.spec.js
e2e/193_agent_town_v1_4_3_townhall_brain_visual.spec.js
e2e/194_agent_town_v1_4_3_secondary_surfaces_visual.spec.js
e2e/195_agent_town_v1_4_3_mobile_platform_visual.spec.js
e2e/196_agent_town_v1_4_3_asset_usage_and_budget.spec.js
```

---

## 11. Acceptance metrics

| Metric | Target |
|---|---:|
| `AssetInventoryCoverage` | 100% of non-game public assets inventoried |
| `ProductionAssetManifestCoverage` | 100% |
| `PromptCoverage` | 100% for generated production assets |
| `PromptHashCoverage` | 100% |
| `HumanSignoffCoverage` | 100% before final acceptance |
| `OrphanProductionAssetCount` | 0 unless marked `future_use` |
| `MissingRollbackPathForReplacedAssets` | 0 |
| `PlatformCriticalImageBudget` | <= 8MB total production platform assets |
| `MobileCriticalPathImageBudget` | <= 2MB |
| `NormalRouteDebugVisualLeakage` | 0 |
| `FoundersPlotGameplayRegression` | 0 known regressions |
| `ScreenshotBaselineCoverage` | start, town shell, townhall, brain, house/pony/saloon/sigil/atlas/leaderboard, mobile |

---

## 12. Required screenshots

Capture and commit screenshot baselines for:

```text
start gate desktop 1280
start gate mobile 390
town shell desktop 1280
town shell mobile 390
townhall onboarding desktop 1280
brain connect desktop 1280
house desktop 1280
pony desktop 1280
saloon desktop 1280
sigil desktop 1280
atlas desktop 1280
leaderboard desktop 1280
share card preview if route exists
```

The signoff sheet must embed or link these screenshots.

---

## 13. Milestones

### M0 — Inventory and plan

Deliver:

- inventory doc;
- route/surface map;
- list of assets to keep/regenerate/retire;
- risk list.

Gate:

- no image generation before inventory is complete.

### M1 — Prompt set and candidate generation

Deliver:

- prompt files;
- candidate folders;
- 2–3 candidate images for each P0 asset group.

Gate:

- candidates are reviewed before production integration.

### M2 — Production asset integration

Deliver:

- selected production assets;
- manifest entries;
- UI route integration;
- old assets retained or rollback paths documented.

Gate:

- no broken references;
- budgets within limits.

### M3 — Screenshot and mobile pass

Deliver:

- route screenshots;
- mobile screenshots;
- screenshot-based fixes.

Gate:

- app feels visually coherent from Start Gate to Founders Plot entry.

### M4 — Signoff and cleanup

Deliver:

- signoff sheet completed;
- tests green;
- changelog entry;
- no out-of-scope features.

---

## 14. Definition of Done

This sprint is done when:

1. All non-game public assets are inventoried.
2. P0 platform assets are regenerated or explicitly kept.
3. Production assets have prompt files, hashes, manifest records, and approval metadata.
4. Start Gate, Town Shell, Town Hall, Brain, House, Pony, Saloon, Sigil, Atlas, and Leaderboard screenshots show one coherent Agent Town art direction.
5. Normal gameplay/debug boundaries are preserved.
6. Founders Plot gameplay visuals remain accepted and are not unintentionally reopened.
7. Visual signoff sheet is complete.
8. Tests and screenshot baselines pass.

---

## 15. Machine-readable summary

```yaml
specId: agent-town-v1.4.3-app-wide-gpt-image2-asset-refresh
sprintType: visual_asset_production
primaryModel: gpt-image-2
product: Agent Town
chapter: Founders Plot
scope:
  include:
    - start_gate
    - town_shell
    - townhall
    - brain
    - house
    - pony
    - saloon
    - sigil
    - atlas
    - leaderboard
    - generic_empty_states
    - platform_hero_cast_usage
  exclude:
    - new_gameplay
    - foundry_plot_gameplay_asset_reopen
    - persistent_foreman
    - doctrine
    - specialist_agents
    - social_systems
    - token_economy
hardRules:
  promptsAreSource: true
  manifestRequired: true
  humanSignoffRequired: true
  keepAiSlopCopy: true
  noDebugInNormalRoutes: true
  noOutOfScopeGameplay: true
acceptance:
  AssetInventoryCoverage: 1.0
  PromptCoverage: 1.0
  HumanSignoffCoverage: 1.0
  NormalRouteDebugVisualLeakage: 0
  FoundersPlotGameplayRegression: 0
```
```
