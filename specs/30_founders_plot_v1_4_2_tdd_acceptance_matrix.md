# Agent Town: Founders Plot V1.4.2 — TDD Acceptance Matrix

**Companion to:** `29_founders_plot_v1_4_2_gpt_image_2_full_asset_rebuild.md`  
**Purpose:** turn the GPT Image 2 asset rebuild into measurable tests for AI developers.

---

## 1. Test groups

| ID | Group | Purpose |
|---|---|---|
| A | Design docs | Design-source files exist and contain required asset governance rules. |
| B | Prompt provenance | Every production asset has a prompt file and hash. |
| C | Asset manifest | Manifest contains required fields and no stale production references. |
| D | Asset inventory | Every known player-facing asset is classified. |
| E | Route integration | Routes use new assets and avoid debug/hero-cast leaks. |
| F | Screenshot baselines | Actual app screens are captured and reviewed. |
| G | Performance budgets | Production image bytes/dimensions stay within budget. |
| H | Accessibility | Images/objects have alt/accessibility metadata where applicable. |
| I | Scope quarantine | No unrelated gameplay/runtime systems were added. |

---

## 2. Required tests

### A1 — Design docs include GPT Image 2 governance

**Suggested file:** `tests/v1_4_2_design_doc_governance.test.js`

Assert:

- `AGENTS.md` mentions GPT Image 2 / `gpt-image-2` workflow.
- `BRAND.md` states hero cast is platform ensemble, Clover is gameplay partner.
- `DESIGN.md` contains YAML front matter with `name`, `colors`, `typography`, `components`.
- `DESIGN.md` contains `## Asset Generation Law`.
- `GAME_UX.md` contains screenshot-first signoff rules.
- `REGISTRY.md` contains V1.4.2 asset registry items.

Metrics:

```text
DesignDocRequiredSectionCoverage = found / required = 100%
```

---

### A2 — DESIGN.md lint compatibility smoke

If `@google/design.md` is available, run:

```bash
npx @google/design.md lint DESIGN.md
```

If unavailable, local fallback parser must check:

- front matter starts and ends with `---`;
- YAML parses;
- token refs in components use existing token names;
- section headings do not duplicate.

Metrics:

```text
DesignMdStructuralErrorCount = 0
```

---

### B1 — Prompt file coverage

**Suggested file:** `tests/v1_4_2_asset_prompt_coverage.test.js`

For every production asset in `asset-manifest.json` where:

```json
"generatedBy": "gpt-image-2"
```

assert:

- `promptFile` exists;
- file has YAML front matter;
- `assetId` matches manifest id;
- `model` is `gpt-image-2`;
- sections exist: Intent, Positive prompt, Negative prompt, Output requirements, Post-processing notes, Acceptance checks.

Metrics:

```text
PromptFileCoverage = assets_with_valid_prompt / generated_assets = 100%
```

---

### B2 — Prompt hash match

Compute SHA-256 of each prompt file and assert it matches manifest `promptHash`.

Metrics:

```text
PromptHashMismatchCount = 0
```

---

### C1 — Asset manifest schema validation

**Suggested file:** `tests/v1_4_2_asset_manifest_schema.test.js`

Required fields per production generated asset:

```text
id
role
path
status
generatedBy
model
promptFile
promptHash
referenceInputs
referenceHashes
candidateId
postProcessing
dimensions
byteSize
approvedBy
approvedAt
approvalNotes
replaces
```

Allow `approvedBy: null` only when `status: "needs_human_signoff"`.

Metrics:

```text
AssetManifestCoverage = valid_assets / production_assets = 100%
ManifestRequiredFieldViolationCount = 0
```

---

### C2 — Reference hash coverage

Every manifest `referenceInputs[]` entry must exist and have a corresponding hash in `referenceHashes`.

Metrics:

```text
ReferenceHashCoverage = 100%
ReferenceMissingCount = 0
```

---

### C3 — No unapproved production generated assets

Production route assets may not have `status: candidate` or `status: rejected`.

Metrics:

```text
UnapprovedProductionAssetCount = 0
```

---

### D1 — Asset inventory coverage

**Suggested file:** `tests/v1_4_2_asset_inventory_coverage.test.js`

Assert:

- `docs/visual/ASSET_INVENTORY_V1_4_2.md` exists;
- every asset path referenced by normal player-facing HTML/CSS/JS appears in the inventory;
- every inventory row has one allowed classification.

Allowed classifications:

```text
KEEP_AS_REFERENCE
REGENERATE_P0
REGENERATE_P1
DEPRECATE_AFTER_REPLACEMENT
DEBUG_ONLY
DO_NOT_TOUCH
```

Metrics:

```text
AssetInventoryCoverage = 100%
UnknownAssetClassificationCount = 0
```

---

### E1 — Deprecated assets are not used by normal gameplay

Scan normal player-facing routes and production CSS/JS for asset paths classified `DEPRECATE_AFTER_REPLACEMENT`.

Metrics:

```text
LegacyPlayerFacingAssetUsage = 0
```

---

### E2 — Hero cast does not leak into Founders Plot gameplay

Playwright route:

```text
/app?district=founders-plot
```

Assert:

- no visible text for Prairie Dog Ranger, Sheriff Lobster, Chibi Homesteader Girl, Wizard Kid;
- no rendered `img[src]` or CSS `background-image` URL contains `/hero-cast/`;
- no default gameplay object uses hero-cast asset ids.

Metrics:

```text
HeroCastDefaultGameplayLeakCount = 0
```

### E2a — Platform shell uses the normalized hero-cast singles

Assert the normal Start Gate route renders:

- `hero_prairie_dog_ranger_v1_4_2`
- `hero_sheriff_lobster_v1_4_2`
- `hero_chibi_homesteader_v1_4_2`
- `hero_wizard_kid_v1_4_2`

on a non-gameplay platform surface, while the Founders Plot route remains Clover-first.

Metrics:

```text
HeroCastPlatformUsageCoverage = 4 / 4
```

---

### E3 — Normal gameplay has no backstage jargon

Assert default Founders Plot and Start Gate routes do not show:

```text
Worker Tools
Skill Context
Worker Traffic
Brain
Session Context
Trainer
OpenRouter
provider
model
runtime
OAuth
```

Allow only debug mode (`debug=1`) routes.

Metrics:

```text
NormalGameplayDebugJargonCount = 0
```

---

### E4 — Scenic labels and Clover helper copy stay quiet until useful

Assert on the default Founders Plot route:

- desktop stage loads with at most one visible stage label before interaction;
- hovering or keyboard-focusing a stage object reveals its label;
- mobile keeps visible stage labels capped to the existing density budget;
- Clover bubble is hidden while idle/observing and becomes visible on hover/focus;
- Clover bubble becomes persistently visible again while acting, waiting for approval, blocked, celebrating, or needing restart.

Metrics:

```text
DefaultVisibleStageLabelCount <= 1
IdleCloverBubbleVisible = false
HoverRevealCoverage = 100%
PersistentUrgentBubbleCoverage = 100%
```

---

### F1 — Required screenshot baselines exist

Required baselines:

```text
founders-v1-4-2-full-route-hero-1280
founders-v1-4-2-full-route-hero-390
founders-v1-4-2-selected-building-1280
founders-v1-4-2-clover-acting-1280
start-gate-v1-4-2-1280
town-shell-v1-4-2-1280
townhall-onboarding-v1-4-2-1280
brain-connect-v1-4-2-1280
```

Metrics:

```text
ScreenshotBaselineCoverage = existing_required / required = 100%
```

---

### F2 — Screenshot visual metadata report

A human or model-assisted review may create:

```text
docs/visual/VISUAL_SIGNOFF_SHEET_V1_4_2.md
```

The test only checks that the signoff sheet includes:

- reviewer;
- date;
- screenshot list;
- pass/fail per screenshot;
- blockers;
- asset replacement notes.

Metrics:

```text
VisualSignoffSheetComplete = true
```

---

### G1 — Asset byte budget

Assert byte sizes against budget table from the spec.

Metrics:

```text
AssetBudgetViolationCount = 0
```

Waivers must be explicitly recorded in `visual_signoff_sheet`.

---

### G2 — Image dimension sanity

Assert:

- scene backgrounds use approved dimensions;
- building/object sprites are not accidentally huge;
- icons are not larger than necessary;
- generated raw files are not referenced by production routes.

Metrics:

```text
UnexpectedDimensionCount = 0
RawCandidateReferencedInProduction = 0
```

---

### H1 — Accessibility metadata

Every interactive image/object asset used in the DOM must have:

- accessible name in markup, or
- alt text if `img`, or
- `aria-hidden="true"` if purely decorative.

Metrics:

```text
InteractiveImageAccessibilityCoverage = 100%
```

---

### H2 — No required text embedded in images

Scan prompt metadata and manifest. Production assets must not rely on embedded readable text unless explicitly marked:

```json
"containsIntentionalText": true
```

Metrics:

```text
UnapprovedEmbeddedTextAssetCount = 0
```

---

### I1 — Scope quarantine

Assert changed files do not add new server gameplay mechanics except manifest/inventory/asset-serving support.

Manual review may be required, but test can check no changes in:

```text
server/founders_plot/engine.js
server/founders_plot/contracts*.js
server/founders_plot/tools.js
vendors/openclaw-lite-main/src/openclaw-lite/*
```

unless the PR includes an explicit quarantine note.

Metrics:

```text
UnexpectedGameplayRuntimeFileChangeCount = 0
```

---

## 3. Release gates

Do not accept the branch unless:

```yaml
DesignMdStructuralErrorCount: 0
PromptFileCoverage: 1.0
PromptHashMismatchCount: 0
AssetManifestCoverage: 1.0
ReferenceHashCoverage: 1.0
UnapprovedProductionAssetCount: 0
AssetInventoryCoverage: 1.0
LegacyPlayerFacingAssetUsage: 0
HeroCastDefaultGameplayLeakCount: 0
NormalGameplayDebugJargonCount: 0
ScreenshotBaselineCoverage: 1.0
VisualSignoffSheetComplete: true
AssetBudgetViolationCount: 0
InteractiveImageAccessibilityCoverage: 1.0
UnapprovedEmbeddedTextAssetCount: 0
UnexpectedGameplayRuntimeFileChangeCount: 0
```

A named art owner may approve explicit waivers for byte-size or asset-detail issues, but not for missing prompt provenance or default-gameplay debug leaks.
