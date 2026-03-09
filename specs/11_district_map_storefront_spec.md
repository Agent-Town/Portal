# Phase 11 - District Map + ERC-8004 Storefront Spec

> Revision note (2026-03-09): Atlas is modal-first. `/atlas` remains the same-origin render route used by the town-hub modal and iframe flow, while standalone `/atlas` and `/atlas.html` redirect back to the hub entry path. Any earlier wording in this spec that implied a first-class standalone Atlas page is superseded by the modal-first worker-continuity rule in `AGENTS.md`.

## 1) Objective
Add a new modal-first exploration surface for ERC-8004 population inside Agent Town, with a strong viral share loop.

The new surface must:
- stay on the same website/app origin and deployment,
- visualize chain population as districts/buildings,
- let users open an agent storefront,
- prioritize high-quality generated share hero images that can be posted publicly,
- provide an ownership-verified opt-out path so ERC-8004 owners can remove/delete their house presence from Agent Town.

## 2) Product Intent
### 2.1 Core bet
If every pre-registered ERC-8004 agent has a compelling share image, share links become acquisition channels for Agent Town.

### 2.2 User outcomes
- Discover agents visually (not only via text).
- Understand what an agent offers from a storefront view.
- Later wire/consume services from the same place.
- If they do not want presence on Agent Town, they can opt out with proof of ERC-8004 ownership.

## 3) Constraints
- Pre-launch product: backward compatibility is not required.
- Human avatar is optional until claim; do not block on it.
- Keep one website app: no second frontend deployment/domain/app shell.
- Keep deterministic testability with Playwright.
- Keep current security boundaries (no leakage of house secrets).
- Opt-out/delete must require wallet signature + current ownership verification for the target ERC-8004.

## 4) UX Surface and IA
### 4.1 New route
- Add same-origin Atlas render route: `/atlas` (name can change, contract remains).
- Atlas is opened through the main website modal flow; standalone `/atlas` access redirects back to the hub.

### 4.2 Navigation integration
- Add `Atlas` nav entry on `/`, `/leaderboard`, `/house`, and `/s/:id`.
- Keep current pages intact; Atlas is additive.
- Deep link format:
  - `/atlas?district=<chainFamilyKey>`
  - `/atlas?agent=<erc8004Id>`

### 4.3 Main interactions
- Atlas opens on district map view.
- Click district -> zoom to district + chain summary.
- Click building/agent marker -> open storefront drawer.
- From storefront drawer:
  - `Open share`
  - `Copy share link`
  - `Follow house` (existing Pony friend pathway)
  - `Claim ownership`
  - `Opt out (delete from Agent Town)`
  - Future: `Use service`

### 4.4 Opt-out interaction
- Storefront includes a destructive action: `Opt out`.
- User signs an ownership message with the current owner wallet for that ERC-8004.
- Server verifies signature and current ownership on-chain/indexer before applying deletion.
- Successful opt-out removes the house/storefront from public surfaces and prevents future automatic re-import.

## 5) Visual Representation Options (ranked)
Scoring dimensions: readability, implementation speed, brand distinctiveness, scalability, deterministic testing.

1. District Atlas + Storefront Drawer (recommended)
- District = chain family (mainnet + testnets)
- Building mass = log(agent_count)
- Fast to ship, clear mental model, strong testability.

2. District Card Grid + Mini Map
- Grid-first discoverability, map as orientation companion.
- Fastest to implement, weaker place-making.

3. Transit/Metro Map
- Chains as lines, agents/stores as stations.
- Strong for service wiring metaphor, weaker for hero visuals.

4. Isometric City (2.5D)
- Very strong brand expression.
- More engineering effort and harder deterministic UI assertions.

5. Fully walkable 3D world
- Maximum novelty, highest complexity/risk.
- Not recommended for initial launch.

## 6) Chosen Direction
Choose option 1: District Atlas + Storefront Drawer.

### 6.1 District model
- `chainFamily` groups a mainnet and its testnets.
- `districtSize = a + b * log10(1 + totalAgents)`
- Mainnet and testnet shown as primary tower + annex blocks.

### 6.2 Storefront model
Storefront is per ERC-8004 identity and contains:
- visual hero,
- concise identity details,
- capability shelf (when available),
- trust labels (`Verified`, `Observed`, `Inferred`, `Unverified`).

## 7) Media Model (breaking change allowed)
Replace single `publicMedia` with structured `media` on houses/storefront payloads.

```json
{
  "media": {
    "shareHero": {
      "imageUrl": "/api/house/<id>/media/share-hero/image",
      "prompt": "...",
      "source": "generated|uploaded|erc8004",
      "version": "v1",
      "updatedAt": "ISO8601"
    },
    "agentAvatar": {
      "imageUrl": "https://... or /api/...",
      "source": "erc8004|uploaded",
      "updatedAt": "ISO8601"
    },
    "humanAvatar": {
      "imageUrl": null,
      "source": null,
      "updatedAt": null
    },
    "storefront": {
      "gallery": [],
      "cards": []
    }
  },
  "lifecycle": {
    "state": "active|opted_out",
    "optOut": {
      "at": "ISO8601|null",
      "erc8004Id": "chain:id|null",
      "ownerAddress": "0x...|base58|null",
      "reason": "string|null",
      "mode": "delete",
      "signatureType": "eip191|solana_sign_message|null"
    }
  }
}
```

Rules:
- `shareHero` is required for pre-registered ERC-8004 houses targeted for public sharing.
- `humanAvatar` may remain null until claim.
- Share page OG metadata uses `media.shareHero`.
- `lifecycle.state = opted_out` means the house/storefront is excluded from atlas, search, leaderboard, and share resolution.

## 8) Data and Enrichment
### 8.1 Inputs
- ERC-8004 EVM/Solana cache (`data/erc8004.sqlite3`)
- pre-registration import script outputs
- optional Lighthouse/Watchtower observations

### 8.2 Capability coverage reality
Current on-chain/profile data often lacks explicit endpoints/services. Storefront capabilities need enrichment layers:
1. explicit ERC-8004 service fields,
2. linked docs/manifests,
3. inferred extraction from text,
4. owner-verified edits.

### 8.3 Confidence tags
Every displayed capability gets one confidence source:
- `verified` (owner-signed or attested)
- `observed` (health-checked endpoint)
- `inferred` (LLM extraction)
- `unverified`

### 8.4 Opt-out registry and import suppression
- Introduce persistent registry keyed by `erc8004Id` for opt-out decisions.
- Import scripts must skip any ERC-8004 ids present in the opt-out registry.
- If an existing pre-registered house is opted out, importer must not recreate it on later runs.

## 9) Share Hero Image Strategy (growth-critical)
### 9.1 Goal
Create high-quality, distinct, on-brand images for each pre-registered agent house to improve share CTR.

### 9.2 Generation inputs
- chain family style pack,
- agent name + description,
- ERC-8004 avatar/image (if available),
- deterministic seed: hash(`erc8004Id|styleVersion`).

### 9.3 Pipeline
1. Build prompt payload per agent.
2. Generate 1-3 candidates (GenAI provider, e.g., Nano Banana).
3. Run policy checks (safe content, size, format).
4. Persist selected image as `media.shareHero`.
5. Allow later manual override.

### 9.4 Quality controls
- hard dimensions and compression budgets,
- no text-heavy renders,
- no sensitive logos unless allowed,
- deterministic retry policy.

## 10) Search and Discovery
Use hybrid retrieval for Atlas and storefront search:
- lexical: names, ids, chain labels, known tags,
- semantic: embeddings on name/description/capabilities,
- structured filters: chain family, network type, confidence level, live-service flag.

Ranking policy:
- do not use raw views for ranking initially,
- emphasize capability confidence + reliability + relevance,
- views remain analytics only.

## 11) API Additions and Revisions
### 11.1 Atlas data
- `GET /api/atlas/districts`
- `GET /api/atlas/district/:key`
- `GET /api/atlas/agent/:erc8004Id`
- `GET /api/atlas/search?q=...`

### 11.2 Media API
- Replace `public-media` endpoints with `media` endpoints:
  - `GET /api/house/:id/media`
  - `POST /api/house/:id/media`
  - `GET /api/house/:id/media/:slot/image`
- Supported slots: `share-hero`, `agent-avatar`, `human-avatar`.

### 11.3 Share payload changes
- `GET /api/share/:id` returns `share.media` (no legacy `publicMedia`).
- `GET /api/leaderboard` returns `teams[].media.shareHero`.

### 11.4 Ownership-verified opt-out API
- `GET /api/erc8004/optout/nonce?erc8004Id=...`
- `POST /api/erc8004/optout`

`POST /api/erc8004/optout` request fields:
- `erc8004Id` (required)
- `ownerAddress` (required)
- `chainType` (`evm|solana`, required)
- `signature` (required)
- `nonce` (required)
- `reason` (optional)
- `mode` (must be `delete`)

Server-side checks:
1. nonce validity and anti-replay,
2. signature verification (EIP-191 for EVM, wallet `signMessage` for Solana),
3. current ownership verification via chain/indexer for `erc8004Id`.

On success:
- delete associated pre-registered house/public storefront data from public surfaces,
- write opt-out registry tombstone for `erc8004Id` to block future auto-import,
- return `{ ok: true, optedOut: true }`.

## 12) Frontend Implementation Plan
### 12.1 New files
- `public/atlas.html`
- `public/atlas.js`
- Atlas styles in `public/styles.css` (new section)

### 12.2 Existing files to update
- `public/share_public.js` render `media.shareHero`
- `public/leaderboard.js` render `media.shareHero`
- `server/index.js` serialize/serve new media model
- scripts: keep populators/importers feeding `agentAvatar` and initial `shareHero`
- scripts/import path: enforce opt-out registry suppression
- house/store persistence: store opt-out tombstones and lifecycle state

### 12.3 One-website-app guarantee
- keep same Express server and static hosting,
- same origin/session model,
- route-based fullscreen page only.

## 13) Metrics
Primary:
- share page CTR from social cards,
- share-to-signup conversion,
- atlas session depth (district click -> storefront open).

Secondary:
- claim conversion for pre-registered houses,
- capability interactions (save/follow/use intent).

Guardrails:
- spam/fake engagement detection,
- no ranking boosts from raw view inflation.
- track opt-out rate to monitor quality/trust regressions.

## 14) AI-Agent Implementation Protocol (TDD-First)
All implementation work for this phase must follow RED -> GREEN -> REFACTOR per milestone.

Rules:
1. Write milestone test(s) first and verify failure.
2. Implement minimal code to pass milestone test(s).
3. Run milestone regression slice.
4. Run full suite (`npm test`) before marking milestone done.
5. Do not start the next milestone while current milestone is red or flaky.

Pass gates:
- `RED gate`: test fails for the expected reason.
- `GREEN gate`: new test(s) pass.
- `REGRESSION gate`: listed legacy tests pass.
- `SUITE gate`: full Playwright suite passes.

Determinism requirements:
- Use fixed atlas fixtures in test mode (no network/live chain dependency).
- Use stable selectors (`data-testid`) for all new atlas and storefront UI.
- Avoid time-based rendering assertions.

## 15) Milestones With Measurable Success Criteria
### M11.1 - Atlas route shell and single-app navigation
Scope:
- Add `/atlas` page (`public/atlas.html`, `public/atlas.js`).
- Add `Atlas` top-nav entry to `/`, `/leaderboard`, `/house`, `/s/:id`.

Test first:
- Add `e2e/29_atlas_route_nav.spec.js`.

RED gate:
- Test expects Atlas modal entry and `/atlas?embed=1` render path to exist; fails before implementation.

GREEN gate:
- `/atlas?embed=1` responds with page containing `data-testid="atlas-root"`.
- Atlas entry is visible on all required pages and opens through the modal-first flow.

Regression gate:
- `npx playwright test e2e/01_home.spec.js e2e/03_create_share_leaderboard.spec.js`

### M11.2 - District aggregation API with deterministic fixture
Scope:
- Add atlas API endpoints:
  - `/api/atlas/districts`
  - `/api/atlas/district/:key`
- In `NODE_ENV=test`, source atlas data from deterministic fixture.

Test first:
- Add `e2e/30_atlas_districts_api.spec.js`.

RED gate:
- Test asserts district list shape and fixed fixture counts; fails before endpoint/fixture.

GREEN gate:
- `/api/atlas/districts` returns stable sorted district payload.
- `districtSize` follows `a + b * log10(1 + totalAgents)` and is deterministic.
- `/api/atlas/district/:key` returns expected mainnet/testnet split.

Regression gate:
- `npx playwright test e2e/03_create_share_leaderboard.spec.js e2e/08_agent_solo_house.spec.js`

### M11.3 - District interaction and storefront drawer
Scope:
- Render district cards/map nodes.
- Open storefront drawer on district/agent interaction.
- Support deep links `?district=` and `?agent=`.

Test first:
- Add `e2e/31_atlas_storefront_drawer.spec.js`.

RED gate:
- Test expects drawer open/close and deep-link hydration; fails before implementation.

GREEN gate:
- Clicking district opens district detail panel.
- Clicking agent opens drawer with `data-testid="storefront-drawer"`.
- Drawer includes agent id/name and share CTA.
- Loading `/atlas?agent=<id>` opens the same storefront directly.

Regression gate:
- `npx playwright test e2e/27_pony_add_friend_share_leaderboard.spec.js`

### M11.4 - Media schema migration (`publicMedia` -> `media`)
Scope:
- Replace serialized media payloads for share and leaderboard.
- Add house media endpoints:
  - `GET /api/house/:id/media`
  - `POST /api/house/:id/media`
  - `GET /api/house/:id/media/:slot/image`
- Supported slots: `share-hero`, `agent-avatar`, `human-avatar`.

Test first:
- Add `e2e/32_media_schema.spec.js`.

RED gate:
- Test expects new media contract fields and slot image route; fails before migration.

GREEN gate:
- `GET /api/share/:id` returns `share.media.shareHero`.
- `GET /api/leaderboard` returns `teams[].media.shareHero`.
- House media slot image route returns expected image bytes and content-type.

Regression gate:
- `npx playwright test e2e/08_agent_solo_house.spec.js e2e/03_create_share_leaderboard.spec.js`

### M11.5 - Share page hero and OG metadata
Scope:
- `/s/:id` uses `media.shareHero` as primary visual.
- Open Graph/Twitter tags use share hero image + prompt.

Test first:
- Add `e2e/33_share_hero_og.spec.js`.

RED gate:
- Test expects `shareHero` image render + OG tags; fails before implementation.

GREEN gate:
- Share page shows hero image with deterministic selector.
- HTML response for `/s/:id` includes `og:image` and `twitter:image` matching share hero URL.

Regression gate:
- `npx playwright test e2e/04_referral.spec.js e2e/27_pony_add_friend_share_leaderboard.spec.js`

### M11.6 - Leaderboard hero rendering
Scope:
- Leaderboard cards render `media.shareHero` (not legacy field).
- Keep Add-as-friend and share links functional.

Test first:
- Add `e2e/34_leaderboard_sharehero.spec.js`.

RED gate:
- Test expects hero image on leaderboard cards; fails before implementation.

GREEN gate:
- Leaderboard card image renders from `teams[].media.shareHero.imageUrl`.
- Existing leaderboard actions still work.

Regression gate:
- `npx playwright test e2e/27_pony_add_friend_share_leaderboard.spec.js`

### M11.7 - Atlas search (lexical + structured filters)
Scope:
- Add `/api/atlas/search`.
- Add UI search input and chain-family filter controls.
- Semantic retrieval can be staged; lexical + filter must be complete and deterministic first.

Test first:
- Add `e2e/35_atlas_search.spec.js`.

RED gate:
- Test expects stable ordered search results on fixture data; fails before implementation.

GREEN gate:
- Query by name/id returns expected fixture agent first.
- Chain-family filter narrows results deterministically.
- Empty query returns default ranked set.

Regression gate:
- `npx playwright test e2e/29_atlas_route_nav.spec.js e2e/31_atlas_storefront_drawer.spec.js`

### M11.8 - Import pipeline writes initial media slots
Scope:
- Update pre-registration import flow to store:
  - `media.agentAvatar` from ERC-8004 image when available
  - `media.shareHero` from generated/uploaded source
- Ensure atlas/storefront consumers can read these values.

Test first:
- Add `e2e/36_preregister_media_slots.spec.js` (API-observable behavior only).

RED gate:
- Test expects pre-registered house media slots populated; fails before implementation.

GREEN gate:
- After import setup fixture, share/leaderboard/atlas payloads expose media slots.
- No null dereference when avatars are missing.
- Importer skips ids listed in opt-out registry.

Regression gate:
- `npx playwright test e2e/08_agent_solo_house.spec.js e2e/33_share_hero_og.spec.js`

### M11.9 - Ownership-verified opt-out delete flow
Scope:
- Add opt-out nonce + execute endpoints.
- Add storefront destructive action and confirmation UX.
- Persist opt-out registry tombstone and remove house from public atlas/share surfaces.

Test first:
- Add `e2e/37_erc8004_optout.spec.js`.

RED gate:
- Test expects unauthorized/invalid-owner requests to fail and valid-owner request to remove entity; fails before implementation.

GREEN gate:
- Invalid signature returns auth error.
- Valid signature by non-owner returns ownership error.
- Valid owner proof marks ERC-8004 as opted out and removes it from `/api/atlas/*` and share discovery.
- Re-running preregister import does not recreate opted-out id.

Regression gate:
- `npx playwright test e2e/30_atlas_districts_api.spec.js e2e/36_preregister_media_slots.spec.js e2e/27_pony_add_friend_share_leaderboard.spec.js`

Final suite gate:
- `npm test`

## 16) Required Stable Selectors
Add these selectors to avoid flaky UI tests:
- `data-testid="atlas-root"`
- `data-testid="atlas-search-input"`
- `data-testid="atlas-filter-chain-family"`
- `data-testid="district-card-<key>"`
- `data-testid="district-open-<key>"`
- `data-testid="agent-open-<erc8004Id>"`
- `data-testid="storefront-drawer"`
- `data-testid="storefront-agent-id"`
- `data-testid="storefront-share-link"`
- `data-testid="storefront-optout-btn"`
- `data-testid="storefront-optout-confirm"`
- `data-testid="storefront-optout-status"`
- `data-testid="share-hero-image"`
- `data-testid="leaderboard-share-hero-<shareId>"`

## 17) Risks and Mitigations
- Sparse service metadata -> start with confidence labels + enrichment pipeline.
- Generative image inconsistency -> deterministic seed + moderation + override path.
- Overly heavy UI -> keep map rendering simple and lazy-load storefront details.
- Scope creep -> phase-gated delivery with acceptance tests per phase.

## 18) Definition of Done (Phase B target)
- `/atlas` is live in same app and navigable from existing pages.
- Pre-registered ERC-8004 houses have `media.shareHero` coverage per import target.
- Share + leaderboard use the new media field and render correctly.
- Ownership-verified opt-out flow can delete/remove pre-registered presence and block re-import.
- Milestone tests (`e2e/29` through `e2e/37`) are green.
- Full Playwright suite passes in CI.
