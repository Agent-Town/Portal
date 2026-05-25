# Founders Plot Roadmap Slice Plan: V1.6 to V4+

Status: active implementation plan
Branch: `codex/founders-plot-threejs-playable-slice`
Date: 2026-05-25

## Scope

This plan translates `specs/46_agent_town_future_roadmap_v1_5_to_v4.md` into
implementation slices for the current Three.js branch.

The roadmap rule remains unchanged: Three.js renders the world surface; server
state and `et.plot.*` tools remain the gameplay authority.

## Slice Order

| Slice | Roadmap Layer | Implementation Target | Status |
| --- | --- | --- | --- |
| V1.4.5 Account Vault / Brain Restore | Return continuity and trust | Browser-encrypted Brain vault, explicit unlock restore, agent backup summary, wrong-wallet denial, and fresh-browser restore into Real Clover. | Implemented and validated in this branch. |
| V1.6 Civic Projects and Short Scenarios | Scenario preparation | Storm Prep at Public Square with progress, soft miss, recap, Three.js civic project anchor, and Clover pressure copy. | Implemented and validated in this branch. |
| V1.7 Town Identity, Pride, and Plot Cards | Aesthetic/civic identity | Public Square style choice, visible Three.js landmark variant, public-safe plot card export, postcard capture, camera flyover state, and cosmetic-only persistence. | Implemented and validated in this branch. |
| V2.0 Persistent Foreman Governance | Delegation governance | Time-boxed Foreman leases, revoke/pause, Exception Inbox, scene anchors, Morning Brief receipts, and bounded while-away collect-ready help proven through closed-page server sweep coverage. | Implemented with a persistent one-town collect-ready routine in this branch. |
| V2.1 Doctrine Lite and Teaching UI | Preference teaching | 2-4 reversible Foreman preferences with deterministic suggestion ranking and recap receipts. | Implemented and validated in this branch. |
| V2.5 Settler Expedition / Second Settlement | Multi-settlement delegation | Stability gate, second settlement shard, Governor Ledger, independent inventories/events. | Implemented and validating in this branch. |
| V3.0 Operating Model and Capability Web | Operating model | Charter choice, capability unlocks, contract deck weighting, visible banners/signage. | Implemented and validating in this branch. |
| V3.1 Specialist Foremen | Staffing | Two specialist roles, domain-scoped tools, conflict approvals, pause/reassign. | Implemented and validating in this branch. |
| V3.5 Settlement Network / Regional Governance | Regional allocation | Supply routes, regional contracts, regional map nodes, route visuals, jump-to-town camera focus, regional ledger. | Implemented and validating in this branch. |
| V4.0 Shareable Operating Styles | Social operating identity | Public-safe operating-style export, public lookup, and inspiration-only comparison. | Implemented and validating in this branch. |
| V4.5 Creator Buildings and District Experiences | Curated extension | Creator building manifest validation, typed tools/state, curated local import governance, asset-governance provenance, credit-only creator model, uninstall/rollback. | Implemented and validating in this branch with one curated local creator pack. |

## Current Next Hours Of Gameplay

After the completed V1.5 first-hour contract loop, the next playable hours should
feel like:

1. The player chooses contracts and builds a stable first town economy.
2. The Public Square offers short civic pressure scenarios that compete with
   contract reserves.
3. The player gives the town a visible identity through Public Square style and
   shareable plot cards.
4. Only after this V1 loop is worth returning to should the product move into
   persistent off-session Foreman governance.

## Definition Of Done For Each Slice

- The slice adds exactly one roadmap decision layer.
- The state is server-authoritative and mutation-safe through typed tools.
- The state appears in the Three.js scene and has a DOM/accessibility mirror.
- Playwright covers the browser gameplay path.
- Unit/API tests cover persistence, conservation, and migration risk.
- Normal gameplay contains no provider/runtime/debug jargon.
- Any player-facing visual asset follows prompt/manifest provenance rules.

## Known Gates

- V2.0 now has a persistent one-town governance baseline for one bounded
  collect-ready routine. It is not broad background autonomy.
- V2.5 should not ship until one settlement can safely run under bounded Foreman
  governance.
- V3.1 should not ship until one general Foreman is trusted.
- V4 social sharing should not ship until public exports have strict redaction
  coverage.

## Implementation Evidence

### V1.4.5

- Server vault: `server/brain_vault.js` stores only ciphertext, safe metadata,
  and safe agent backup summaries by account/wallet owner hash.
- Browser vault: `public/openclaw-lite/brain-vault-library.js` encrypts/decrypts
  Brain secrets with WebCrypto AES-GCM and PBKDF2 before server upload.
- Founders Plot UI: `public/experiences/founders-plot/app.js` shows a restore
  prompt and requires explicit unlock before writing restored Brain config into
  browser-local OpenClaw Lite state.
- Tests:
  - `tests/brain_vault.test.js`
  - `e2e/225_founders_plot_v145_brain_vault_restore.spec.js`

### V1.6

- Server state: `meta.scenarios`, Storm Prep template, scenario events, soft-miss resolution, and scenario state view.
- Tools: `et.plot.scenarios.get_state`, `et.plot.scenarios.start`, and `et.plot.scenarios.contribute`.
- Scene: `SCENARIO_SITE` world object plus `STATE:scenarios` Three.js state anchor.
- Tests:
  - `tests/founders_plot_v16_civic_scenarios.test.js`
  - `e2e/223_founders_plot_v16_civic_scenario.spec.js`

### V1.7

- Server state: cosmetic Public Square style on `landmarks.publicSquare`, plus
  public-safe postcard captures on `meta.townPostcards`.
- Tools: `et.plot.town.set_identity`.
- Plot card and postcard: `/api/founders-plot/plot-card` returns public-safe
  card data only; `POST /api/founders-plot/postcard` records a public-safe
  postcard export with camera flyover stops.
- Scene: Public Square tint/style marker, `STATE:town_identity`, and
  `STATE:town_postcard` Three.js state anchors.
- Tests:
  - `tests/founders_plot_v17_town_identity.test.js`
  - `e2e/224_founders_plot_v17_town_identity_plot_card.spec.js`

### V2.0

- Server state: `meta.governance` with active lease, lease history,
  open/resolved Exception Inbox items, persistent while-away state, and schema
  migration to V8.
- Tools: `et.foreman.governance.grant_lease`,
  `et.foreman.governance.revoke_lease`,
  `et.foreman.governance.raise_exception`, and
  `et.foreman.governance.resolve_exception`, plus
  `et.foreman.governance.start_persistent` and
  `et.foreman.governance.pause_persistent` for the bounded collect-ready
  routine.
- UI: Foreman drawer governance card with grant/revoke controls, while-away
  start/pause controls, and Exception Inbox resolution.
- Scene: Approval Bell counts Foreman exceptions; `STATE:governance`,
  `STATE:persistent_foreman`, `foreman-governance`, and
  `foreman-persistent` coverage prove the lease/exception/persistent state
  reaches the Three.js representation.
- Receipts and Morning Brief: Persistent collect-ready actions leave a receipt
  and return-loop note. Browser coverage now closes the page, runs the server
  background sweep path at the due tick, and reopens to verify the receipt.
- Tests:
  - `tests/founders_plot_v20_foreman_governance.test.js`
  - `tests/founders_plot_v20_persistent_foreman.test.js`
  - `tests/founders_plot_visual_state.test.js`
  - `e2e/226_founders_plot_v20_foreman_governance.spec.js`
  - `e2e/228_founders_plot_v20_persistent_foreman.spec.js`

### V2.1

- Server state: `meta.doctrine` with four reversible rules:
  `PREFER_RESERVES`, `PREFER_SPEED`, `ASK_BEFORE_SPENDING`, and
  `FINISH_ACTIVE_CONTRACTS_FIRST`, plus schema migration to V7.
- Tools: `et.foreman.doctrine.get_state` and
  `et.foreman.doctrine.set_rule`.
- UI: Foreman drawer Clover rules card with reversible preference buttons and
  conflict surfacing through the Exception Inbox.
- Scene: `STATE:doctrine` and `foreman-doctrine` coverage prove preference
  state reaches the Three.js representation.
- Receipts and Morning Brief: Foreman receipts and brief payloads include active
  doctrine influence when Clover acts under a preference.
- Tests:
  - `tests/founders_plot_v21_doctrine_lite.test.js`
  - `e2e/227_founders_plot_v21_doctrine_lite.spec.js`

### V2.5

- Server state: `meta.settlements` with a home-town ledger entry, Ridge Outpost
  settlement shard, active settlement focus, independent inventory/storage,
  founding tasks, and migration to V9.
- Gate: Settler Expedition requires HQ level 2, active while-away Clover help,
  and at least one completed persistent Foreman routine task before a second
  settlement can launch.
- Tools: `et.plot.settlements.get_ledger`,
  `et.plot.settlements.launch_expedition`, `et.plot.settlements.focus`, and
  `et.plot.settlements.complete_founding_task`.
- UI: Governor Ledger drawer and in-world Three.js `GOVERNOR_LEDGER` anchor show
  launch readiness, settlement summaries, focus controls, and founding tasks
  without exposing provider/runtime/debug jargon.
- Isolation: Ridge Outpost founding tasks consume only second-settlement
  supplies; Town 1 inventory and Foreman routines remain separate.
- Tests:
  - `tests/founders_plot_v25_second_settlement.test.js`
  - `tests/founders_plot_visual_state.test.js`
  - `e2e/229_founders_plot_v25_second_settlement.spec.js`
  - `e2e/55_phase3_skill_contract_line.spec.js`

### V3.0

- Server state: `meta.operatingModel` with a selected Town Charter,
  unlocked capability nodes, history, and migration to V10.
- Gate: Operating Model remains locked until HQ2 and active Ridge Outpost prove
  that the player has a stable town network.
- Tools: `et.plot.operating_model.get_state`,
  `et.plot.operating_model.choose_charter`,
  `et.plot.operating_model.unlock_capability`, and
  `et.plot.operating_model.refresh_contracts`.
- Charter choices: `STEADY_COMMONS`, `SWIFT_DEPOT`, and `CIVIC_BEACON` weight
  Contract Board recommendations toward stability/care, speed/logistics, or
  civic prestige without granting Foreman permissions.
- Capability Web: small nodes such as `CHARTER_CONTRACTS`,
  `SETTLEMENT_BANNERS`, and `FOREMAN_BRIEFING`; `CHARTER_CONTRACTS` is required
  before charter-driven contract refresh appears in allowed tools/actions.
- UI/Scene: Town Charter drawer, Public Square charter signage/badge, and
  `STATE:operating-model` Three.js coverage.
- Tests:
  - `tests/founders_plot_v30_operating_model.test.js`
  - `tests/founders_plot_visual_state.test.js`
  - `e2e/230_founders_plot_v30_operating_model.spec.js`
  - `e2e/55_phase3_skill_contract_line.spec.js`

### V3.1

- Server state: `meta.specialists` with Builder Foreman and Quartermaster
  role states, eligible domains, bounded domain tool lists, recommendation
  history, conflict id tracking, and migration to V11.
- Gate: Specialist staffing remains locked until a Town Charter exists and
  Clover has completed at least one bounded while-away routine.
- Tools: `et.foreman.specialists.get_state`,
  `et.foreman.specialists.assign`, `et.foreman.specialists.pause`, and
  `et.foreman.specialists.review_recommendation`.
- Domain enforcement: Builder Foreman may own `construction` or `public_works`;
  Quartermaster may own `supplies` or `contracts`; recommendations outside the
  assigned domain fail instead of becoming silent authority.
- Conflict handling: conflicting specialist recommendations open the existing
  Exception Inbox and produce specialist recap lines.
- UI/Scene: Foreman drawer specialist staffing card and `STATE:specialists`
  Three.js coverage under `FOREMAN_HUT`.
- Tests:
  - `tests/founders_plot_v31_specialist_foremen.test.js`
  - `tests/founders_plot_visual_state.test.js`
  - `e2e/231_founders_plot_v31_specialist_foremen.spec.js`
  - `e2e/55_phase3_skill_contract_line.spec.js`

### V3.5

- Server state: `meta.regionalNetwork` with a bounded Ridge Supply Route,
  shared-reserve view, one regional contract, route shortage state, and
  migration to V12.
- Gate: Regional governance remains locked until Ridge Outpost is active, a
  Town Charter is chosen, and at least one specialist lane is staffed.
- Tools: `et.plot.regional.get_ledger`,
  `et.plot.regional.open_supply_route`,
  `et.plot.regional.transfer_supply_route`,
  `et.plot.regional.accept_contract`, and
  `et.plot.regional.turn_in_contract`.
- Conservation: supply transfer moves one fixed shipment from Founders Plot to
  Ridge Outpost, rejects wrong-town transfer attempts, and preserves cross-town
  resource totals.
- Recovery: route shortages persist as Governor Ledger issues and recover after
  the missing resource is produced and the route is retried.
- UI/Scene: Governor Ledger regional panel, shared reserves, regional contract
  controls, regional map nodes for Founders Plot and Ridge Outpost,
  jump-to-town camera focus state, `STATE:regional-network` Three.js coverage,
  and a Three.js route link between settlement nodes.
- Tests:
  - `tests/founders_plot_v35_regional_governance.test.js`
  - `tests/founders_plot_visual_state.test.js`
  - `e2e/232_founders_plot_v35_regional_governance.spec.js`
  - `e2e/55_phase3_skill_contract_line.spec.js`

### V4.0

- Server export: `/api/founders-plot/operating-style-card` returns a
  public-safe operating-style card built from charter, doctrine, specialist
  staffing, regional route state, capability summaries, and cosmetic town
  identity only.
- Public lookup: `/api/founders-plot/public/operating-style-card/:plotId`
  loads the card without private account/session state.
- Comparison: `/api/founders-plot/operating-style/compare` sanitizes imported
  style cards and returns inspiration-only differences. It never grants
  resources, buildings, permissions, or capabilities.
- UI: Operating Model drawer includes a compact share-style control and preview
  for the current town-running style.
- Redaction: card generation and imported-card sanitization exclude Brain,
  provider, wallet, runtime, token, secret, log, event, and worker details.
- Tests:
  - `tests/founders_plot_v40_operating_style_card.test.js`
  - `e2e/233_founders_plot_v40_operating_style_card.spec.js`

### V4.5

- Scope: the first creator-building implementation is a curated local
  `creator.notice-kiosk` pack, not an open marketplace or upload system.
- Manifest governance: `notice-kiosk.manifest.json` declares approved
  moderation, no network access, public-summary-only data access, curated local
  import source, asset-governance provenance, typed state, typed creator tool
  schemas, install gate, credit-only creator model, and rollback-safe object
  metadata.
- Server truth: `et.plot.creator.get_catalog`, `install_building`,
  `disable_building`, and `remove_building` operate only on
  `meta.creatorExtensions`. They do not mutate core inventory, buildings,
  permissions, settlements, regional routes, or Capability Web nodes.
- Creator tool: `et.creator.notice_kiosk.post_notice` can mutate only the
  Notice Kiosk's typed creator state and rejects private/backstage text.
- UI/Scene: the Creator Buildings drawer shows catalog, gate, install,
  post-notice, disable, and remove controls. Once installed, the Notice Kiosk
  appears as `CREATOR_NOTICE_KIOSK` in the Three.js scene with
  `STATE:creator-extensions` coverage.
- Tests:
  - `tests/founders_plot_v45_creator_buildings.test.js`
  - `tests/founders_plot_visual_state.test.js`
  - `e2e/234_founders_plot_v45_creator_buildings.spec.js`
  - `e2e/154_founders_plot_v12_hardening_pack_contract.spec.js`
  - `e2e/55_phase3_skill_contract_line.spec.js`

### V5+ Boundary

- The roadmap's V5+ section is intentionally not an implementation slice. It
  names possible future directions such as agent-managed districts,
  inter-agent economies, public works, reputation, services marketplace, world
  events, and cross-framework participation.
- Do not enter V5+ from this goal. The roadmap guardrails require stronger
  evidence first: single-town retention, trusted persistent Foreman behavior,
  understandable multi-town governance, safe public/shareable operating style,
  and identity/reputation security review.
- The next responsible V5+ action is a security/product discovery spec, not
  gameplay implementation.

## V2 Boundary

V1.4.5 account/wallet Brain vault restore is implemented as the trust baseline
for returning players. V2.0 Foreman governance is implemented for in-session
routine help, leases, revocation, exceptions, and one persistent while-away
collect-ready routine. This still does not mean Clover has broad off-session
authority.

Doctrine Lite is now implemented as player-visible preference teaching, while
remaining separate from permissions and leases. V2.5 Settler Expedition /
Second Settlement now adds the first multi-settlement shard, but only after the
single-settlement governance gate is satisfied:

- Town 1 and Town 2 inventories/events stay isolated;
- Governor Ledger is the player-facing control surface for launch, focus, and
  founding tasks;
- the Three.js scene has a Governor Ledger anchor and `STATE:settlements`
  coverage;
V3.0 Operating Model is now implemented as a Ridge-Outpost-gated Town Charter
plus a small Capability Web. It deliberately does not broaden background
Foreman autonomy:

- charter state weights contracts, Clover suggestions, Morning Brief, and town
  signage;
- `CHARTER_CONTRACTS` gates the contract-refresh action and allowed tool;
- capability nodes remain narrow operating-model affordances, not a science
  tree.

V3.1 Specialist Foremen is now implemented as staffing lanes under Clover rather
than separate autonomous Brains:

- Builder Foreman and Quartermaster each have explicit eligible domains and
  allowed tool lists;
- pause and reassign controls stay player-owned in the Foreman drawer;
- conflicts route to the existing Exception Inbox before any specialist choice
  can win;
- `STATE:specialists` keeps the staffing layer visible in the Three.js state
  coverage.

V3.5 Regional Governance is now implemented as regional allocation over bounded
routes, not as a free shared inventory:

- the Ridge Supply Route has exact source/destination towns and a fixed
  shipment amount;
- wrong-town transfer attempts fail rather than silently moving resources;
- regional contracts reference both towns and complete only after route progress;
- `STATE:regional-network` and Three.js route links keep regional state visible
  from the Governor Ledger.

V4.0 Shareable Operating Styles is now implemented as a public-safe social
identity export, not as template import authority:

- style cards summarize how a town runs without private Brain/config/log data;
- public card lookup is safe without entering the private town;
- imported cards are comparison/inspiration only and cannot grant assets,
  resources, permissions, or Capability Web nodes.

V4.5 Creator Buildings is now implemented as a curated extension baseline, not
as an open creator marketplace:

- approved manifests are validated before appearing in the catalog;
- the Notice Kiosk installs as an in-world object and exposes one typed,
  public-safe notice action;
- disable/remove are explicit rollback controls;
- creator tools cannot bypass server truth or grant core town state.
