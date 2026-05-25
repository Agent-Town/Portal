---
schemaVersion: "agent-town-roadmap-v1"
documentId: "specs/46_agent_town_future_roadmap_v1_5_to_v4"
title: "Agent Town Future Roadmap: V1.5 to V4+"
status: "current-branch-aligned roadmap"
date: "2026-05-24"
owner: "Agent Town product"
sourceBranchReference: "codex/founders-plot-threejs-playable-slice"
lockedDecisions:
  - "Founders Plot V1.x uses Three.js as the forward human-facing renderer path."
  - "Three.js is a renderer boundary, not a simulation rewrite."
  - "Server-authoritative world state and et.plot.* tool contracts remain source of truth."
  - "Clover is Brain-gated for real Foreman behavior."
  - "Production identity is account/wallet continuity, with Privy as current login/wallet provider."
  - "Each major version adds one new player decision layer."
---

# Agent Town Future Roadmap: V1.5 to V4+

This roadmap supersedes the earlier V1.5-to-V4 future roadmap by aligning it with the
current Three.js branch and the implementation-team feedback.

## Current State to Lock

Agent Town has moved from a dashboard-like portal into a game-first product centered on
**Agent Town: Founders Plot**. The current working direction is:

- Founders Plot is the V1 home-town game chapter.
- Clover is the first real AI Foreman and must remain Brain-gated for genuine LLM-mediated actions.
- The server owns world truth.
- Agents act through typed tools.
- The player can play first, then connect Brain, then complete deeper Town Hall onboarding later.
- GPT Image 2 assets and prompt/source provenance are now part of the production visual pipeline.
- **Three.js is now the forward renderer path for the Founders Plot world surface.**

## Critical Three.js Alignment

The Three.js work is not speculative. It is now a locked V1.x rendering direction.

The active Three.js branch defines the renderer boundary like this:

- `server/founders_plot/*` remains the server-authoritative simulation.
- `et.plot.*` remains the gameplay mutation contract.
- `scene_state.js` remains the state-to-scene adapter.
- `three_scene_entry.js` renders scene objects with Three.js.
- `scene_render.js` keeps semantic DOM hooks for accessibility and Playwright continuity.
- `three_scene_bundle.js` is generated through `npm run build:founders-plot-threejs`.

The first Three.js replacement is the **world/game surface**, not the whole application.
The DOM shell still owns HUD, drawers, Brain setup, Foreman setup, and detailed forms until a later
explicit full-canvas HUD decision is made.

### Three.js Must Not Become World Truth

Three.js may render:

- terrain;
- buildings;
- pads;
- Clover;
- timers;
- badges;
- highlights;
- target links;
- state anchors;
- selected-object summaries.

Three.js must not:

- simulate economy rules;
- mutate plot state directly;
- bypass `et.plot.*`;
- invent agent actions;
- hide gameplay state inside non-inspectable visuals;
- remove semantic DOM/accessibility mirrors.

## Durable Identity Contract

Product copy may mention Privy where appropriate, but the durable product contract is:

> **Account/wallet continuity restores the player’s town, Brain-vault state, and agent backups.**

Privy is the current production login/wallet provider. It is not the product truth players need to
understand. Player-facing copy should say:

- “Sign in to restore your town.”
- “Recover your wallet/account to unlock your Brain vault.”
- “Your town is tied to your account/wallet.”

Avoid player-facing provider jargon unless the user is in an explicit settings/debug surface.

## Source-of-Truth Document Path Decision

The repo must stop relying on ambiguous root design-doc paths if those files are not present.

Use one of these two acceptable patterns:

### Preferred Pattern

Add root redirect stubs:

- `BRAND.md`
- `DESIGN.md`
- `GAME_UX.md`
- `REGISTRY.md`

Each root file should point to the canonical file under:

```text
Brand kit/guidelines/agent-town-design-pack/
```

### Acceptable Alternative

Update all read-order instructions in `AGENTS.md` and future specs to point directly to the nested
canonical paths.

Do not leave future agents guessing whether the root docs exist.

## Version Ladder

The long-term product sequence remains:

1. **V1** — make one town fun and understandable.
2. **V2** — make one town governable through a trusted Foreman.
3. **V3** — make operating style replayable through charters, capability paths, and specialists.
4. **V4** — make operating style social/shareable.
5. **V5+** — grow toward agent civilization and multi-settlement society.

Each version should add one new player decision layer.

---

# V1.4.x Closeout — Public Preview Candidate

## Goal

Ship a coherent public preview where Founders Plot is playable, visually coherent, and not blocked
by full onboarding.

## Locked Scope

V1.4.x is release-candidate closeout, not new gameplay depth.

It includes:

- play-first onboarding;
- Brain-gated Real Clover;
- app-wide GPT Image 2 visual refresh;
- Three.js playable slice foundation;
- mobile calmness;
- account/wallet continuity tests;
- final release evidence.

## Definition of Done

- New user can enter Founders Plot through Start Gate/account login without full Town Hall onboarding.
- Manual Founder Mode works without Brain and never creates AGENT-attributed mutations.
- Real Clover is locked until Brain/runtime readiness.
- Same account/wallet restores the same plot.
- Normal gameplay shows no raw provider/runtime/debug jargon.
- Full-route mobile and desktop screenshots are committed.
- Three.js world surface remains server-state-driven.
- Release notes clearly state this is a public preview/alpha.

## Required Test Evidence

### Playwright

- Start Gate → account login → Founders Plot play-first route.
- Founders Plot direct route does not show Town Hall blocker.
- Manual mode first loop creates only HUMAN actions.
- Real Clover controls remain Brain-gated.
- Full-route 390px mobile calmness.
- Full-route desktop Founders Plot hero screenshot.
- Three.js scene object picking opens the same selected object/detail flow.
- Debug surfaces remain hidden unless explicit debug mode is active.

### API / Unit

- Access helper fails closed on unknown auth.
- Same account/wallet identity resolves same plot/pair ID.
- Brain-gated Foreman route denies mutation when Brain is missing.
- No AGENT event appears after no-Brain mutation attempt.

---

# V1.4.5 — Account Vault, Brain Restore, and Agent Backup Restore

## Goal

Make returning users fluid across browsers/devices by allowing Brain configuration and agent backup
state to be restored after account/wallet recovery.

## Product Promise

> “Recover your account/wallet, unlock your Brain vault, and continue with your town and agents.”

## Scope

V1.4.5 may implement:

- encrypted Brain config vault;
- agent backup snapshots;
- restore flow after account/wallet login;
- explicit vault unlock before Real Clover acts;
- local-device restore fallback;
- redacted logs/debug output.

V1.4.5 must not implement persistent/off-session Foreman execution. That remains V2.

## Security Requirements

- No plaintext API keys in server storage.
- No plaintext API keys in logs.
- No plaintext API keys in screenshots.
- No plaintext API keys in replay/recap/events.
- Vault unlock must be explicit before restored Brain can power Real Clover.
- Wrong account/wallet cannot fetch or unlock another vault.
- Secret export/import must require an intentional user action.
- The security model must document whether the vault is trusted-recovery or zero-knowledge.

## Definition of Done

- Same account/wallet on a fresh browser restores plot.
- Same account/wallet can unlock encrypted Brain vault.
- Restored Brain config can unlock Real Clover only after explicit user confirmation.
- Agent backup can restore named agent metadata, pack references, memory/checkpoint summary, and safe local settings.
- Restored agent does not act automatically.
- User can still play manually if vault restore fails.

## Required Test Evidence

### Playwright

- Fresh browser context logs in with same mocked account/wallet.
- Existing plot restores.
- Brain restore prompt appears.
- Vault unlock restores Brain label/model/provider metadata without exposing secret.
- Real Clover remains disabled until explicit confirmation.
- After confirmation, Real Clover can start.

### API / Unit

- Vault ciphertext stored without plaintext secret substrings.
- Wrong account/wallet request returns 403/404 without leaking metadata.
- Redaction test covers logs, debug payloads, replay events, and screenshots.
- Backup roundtrip preserves schema version and migration fields.

---

# V1.5 — First-Hour and Return-Loop Expansion

## Goal

Turn the current vertical slice into a small, satisfying game loop that lasts 30–60 minutes and
gives players a reason to return.

## New Decision Layer

**Contract choice.**

The player should choose between competing town needs, not simply complete one linear checklist.

## Core Additions

- 2–3 contract offers at the Town Board.
- Named requesters and institutions.
- Better first-hour pacing.
- Morning Brief return screen.
- Contract-aware Clover suggestions.
- Tiny teaching affordance after Clover suggestions/actions.

## Three.js Integration

V1.5 content must render through the Three.js world surface:

- Contract Board offer state appears as in-world anchors/chips.
- Requester presence appears near relevant town objects.
- Morning Brief can focus the camera or highlight changed objects.
- Teaching affordance remains DOM for now, but scene context must highlight the affected object.

## First-Hour Target Arc

1. Enter Founders Plot.
2. Build Lumber Camp.
3. Collect first wood.
4. Build Farm Plot.
5. Choose first contract.
6. Complete first supply/build contract.
7. See Clover suggest or perform one Brain-gated action.
8. Upgrade HQ or Public Square.
9. Receive first Morning Brief / return summary.
10. Choose second contract.

## Definition of Done

- A new user can complete the first contract without external help.
- The user sees at least two contract offers and chooses one.
- Contracts include named requester/institution context.
- Clover references the active contract in suggestions.
- Morning Brief appears on return after meaningful elapsed time/events.
- The player can give Clover one lightweight preference/correction.
- The loop still works with Manual Founder Mode.

## Required Test Evidence

### Playwright

- First-hour golden path completes from fresh plot.
- Contract choice UI shows at least two offers.
- Choosing a contract changes active goal and in-world Contract Board marker.
- Named requester/institution appears in contract drawer and recap.
- Clover suggestion references active contract.
- Morning Brief appears after simulated return.
- Teaching affordance records preference without unlocking full doctrine board.
- Three.js scene reflects active contract, selected object, and requester markers.

### API / Unit

- Contract deck generation deterministic under seeded fixture.
- Contract rewards and requirements conserve resources.
- Contract state persists across reload.
- Morning Brief deduplicates events and does not invent outcomes.
- Preference/correction signal changes future suggestion ranking in deterministic fixture.

---

# V1.6 — Civic Projects and Short Scenarios

## Goal

Give players memorable session goals that sit on top of the home plot.

## New Decision Layer

**Scenario preparation.**

The player decides how to allocate limited reserves and time toward a civic event or short project.

## Examples

- Harvest Festival.
- Storm Prep.
- Bridge Repair.
- Trade Caravan.
- Welcome Week.

## Three.js Integration

- Scenario object appears in the world as a civic project anchor.
- Camera can focus the scenario site.
- Progress is visible in the Three.js scene.
- Clover can highlight blocked scenario requirements.

## Definition of Done

- At least one scenario can be started, progressed, completed, and recapped.
- Scenario uses existing resources; no large new resource tree.
- Scenario creates at least one meaningful tradeoff with active contracts.
- Scenario failure/soft-miss is player-readable and not punishing.

## Required Test Evidence

### Playwright

- Start scenario from Town Board/Public Square.
- Scenario progress marker appears in Three.js.
- Completing tasks updates scenario progress.
- Clover suggestion can reference scenario pressure.
- Recap includes scenario outcome.

### API / Unit

- Scenario timeline deterministic under seeded fixtures.
- Scenario progress persists across reload.
- Scenario cannot bypass normal resource/tool validation.
- Soft-miss outcome emits correct event.

---

# V1.7 — Town Identity, Pride, and Plot Cards

## Goal

Make the town feel like the player’s authored place.

## New Decision Layer

**Aesthetic/civic identity.**

The player chooses how the town presents itself.

## Core Additions

- Public Square styles.
- Welcome Sign upgrades.
- Town charm/prestige score.
- Cosmetic civic ornaments.
- Plot card/screenshot export.
- Camera postcard capture.

## Three.js Integration

This is where Three.js becomes especially valuable:

- rendered town postcards;
- camera flyover;
- visible landmark variants;
- shareable 3D-feeling plot cards;
- in-world decorative props.

## Definition of Done

- Player can choose at least one town identity/aesthetic option.
- The choice is visible in the Three.js scene.
- Plot card can be generated without debug UI.
- Cosmetics do not affect core economy unless explicitly documented.

## Required Test Evidence

### Playwright

- Select Public Square/Welcome Sign style.
- Verify Three.js scene reflects selected style.
- Generate plot card.
- Verify plot card has no debug/provider/runtime jargon.
- Capture postcard and verify public-safe Three.js camera/flyover state.

### API / Unit

Implementation status in `codex/founders-plot-threejs-playable-slice`: covered
by `tests/founders_plot_v17_town_identity.test.js` and
`e2e/224_founders_plot_v17_town_identity_plot_card.spec.js`, including
`meta.townPostcards`, `STATE:town_postcard`, a data-URL postcard preview, and
public-safe redaction checks.

- Cosmetic choice persists.
- Cosmetic choice does not mutate economy fields.
- Plot card endpoint/output redacts secrets and debug info.

---

# V2.0 — Persistent Foreman Governance

## Goal

Let the town continue under bounded Foreman governance while the user is away.

## New Decision Layer

**Delegation governance.**

The player decides what Clover may do without them, what requires approval, and when to pause.

## Preconditions

Do not implement V2 until:

- V1.5 first-hour loop is fun.
- V1.6 or equivalent return-session content exists.
- Brain vault/restore path is secure enough.
- In-session Clover is trustworthy and understandable.

## Core Additions

- Backend-pool Foreman runtime.
- Runtime leases.
- Persistent task execution.
- Exception Inbox.
- Morning Brief as primary return surface.
- Emergency pause.
- Explicit authority boundaries.

## Three.js Integration

- Morning Brief can replay/focus key world actions.
- Exception Inbox can focus the camera on the problem object.
- Clover action trails can be represented as camera cuts or target highlights.

## Definition of Done

- Foreman can run bounded tasks while tab is closed.
- User can pause/resume.
- User sees exactly what Clover did and why.
- Exceptions appear in an Inbox instead of silent failure.
- No action exceeds policy or spend caps.
- Wrong account cannot control another user’s Foreman.

## Required Test Evidence

### Playwright

- Start persistent Foreman.
- Close/reopen simulated session.
- Run the server background sweep while the page is closed.
- Morning Brief shows Foreman actions.
- Exception Inbox displays blocked actions.
- Emergency pause stops future actions.

### API / Unit

Implementation status in `codex/founders-plot-threejs-playable-slice`: covered
by `tests/founders_plot_v20_persistent_foreman.test.js` and
`e2e/228_founders_plot_v20_persistent_foreman.spec.js`, including a closed-page
server sweep for the bounded collect-ready routine, receipt/Morning Brief proof,
pause control, and policy-blocked Exception Inbox behavior.

- Runtime leases prevent duplicate execution.
- Task idempotency prevents double collection/queueing.
- Policy violation rate is zero in fixtures.
- Background Foreman cannot act without unlocked Brain/vault authorization.
- No plaintext Brain secrets appear in worker logs.

---

# V2.1 — Doctrine Lite and Teaching UI

## Goal

Turn Foreman correction into a visible operating preference without creating a large doctrine board yet.

## New Decision Layer

**Preference teaching.**

The player teaches Clover simple priorities.

## Examples

- Prefer reserves.
- Prefer speed.
- Ask before spending.
- Help people before merchants.
- Finish active contracts first.

## Definition of Done

- Player can set 2–4 lightweight preferences.
- Preferences affect Clover suggestion ranking.
- Morning Brief explains preference-driven actions.
- Preferences remain reversible.

## Required Test Evidence

Implementation status in `codex/founders-plot-threejs-playable-slice`: covered
by `tests/founders_plot_v35_regional_governance.test.js` and
`e2e/232_founders_plot_v35_regional_governance.spec.js`, including settlement
nodes, route links between nodes, jump-to-town camera focus state, shortage
recovery, and cross-town conservation.

- Preference modifies deterministic Foreman candidate ranking.
- Preference appears in receipt/recap.
- Conflicting preference triggers approval/clarification instead of arbitrary action.
- Preferences persist across reload and account restore.

---

# V2.5 — Settler Expedition / Second Settlement

## Goal

Unlock a second settlement because the first can run under bounded Foreman governance.

## New Decision Layer

**Multi-settlement delegation.**

The player decides when the first town is stable enough to found another.

## Core Additions

- Settler Expedition launch.
- Second settlement shard.
- Town 1 remains under Clover/Foreman oversight.
- New settlement starts with a small founding loop.
- Governor Ledger summarizes towns.

## Three.js Integration

- Expedition departure scene.
- New terrain plate / new diorama.
- Camera transition from Town 1 to outpost.
- Governor Ledger can jump/focus between settlements.

## Definition of Done

- User can launch a second settlement only after first-town stability criteria.
- Town 1 state persists and remains governed.
- Town 2 initializes independently.
- Governor Ledger shows both settlements and pending decisions.
- User can switch settlements without state loss.

## Required Test Evidence

- Stability gate blocks early second-town launch.
- Settler expedition creates a second plot/shard with distinct ID.
- Town 1 and Town 2 have independent inventory/buildings/events.
- Governor Ledger shows both.
- Foreman actions in Town 1 do not mutate Town 2.

---

# V3.0 — Operating Model and Capability Web

## Goal

Make each town/civilization feel like it runs according to a distinct philosophy.

## New Decision Layer

**Operating model.**

The player chooses capabilities, doctrine paths, and governance patterns.

## Core Additions

- Founding Charters.
- Capability Web.
- Deeper doctrine slots.
- Contract deck variants.
- More meaningful tradeoffs between speed, stability, prestige, and care.

## Three.js Integration

- Capability choices affect civic buildings/landmarks.
- Charter identity appears in town banners/signage.
- Settlement flyover can show operating style.

## Definition of Done

- Player chooses a charter.
- Charter affects contract weighting, Foreman suggestions, or civic bonuses.
- Capability unlocks change available actions or town behavior.
- No giant Civ-style science tree; this remains an Agent Town operating-model layer.

## Required Test Evidence

- Charter changes deterministic contract deck weights.
- Capability unlock modifies allowed tools/actions.
- Doctrine/capability choices appear in recap.
- State migration preserves older towns.

---

# V3.1 — Specialist Foremen

## Goal

Give larger towns delegated experts without losing player oversight.

## New Decision Layer

**Staffing.**

The player chooses which specialist handles which domain.

## Specialist Examples

- Builder Foreman.
- Quartermaster.
- Trade Clerk.
- Event Steward.
- Public Works Planner.

## Preconditions

Do not implement specialists until one general Foreman is already trustworthy.

## Definition of Done

- At least two specialist roles exist.
- Each specialist has bounded domain tools.
- Specialists cannot conflict silently.
- Player can pause or reassign a specialist.

## Required Test Evidence

- Specialist domain permissions enforced.
- Conflicting specialist recommendations route to user approval.
- Recap distinguishes specialist actions.
- Specialist state restores from account/agent backup.

---

# V3.5 — Settlement Network / Regional Governance

## Goal

Turn multiple towns into a coherent regional system.

## New Decision Layer

**Regional allocation.**

The player decides how towns support each other.

## Core Additions

- Supply routes.
- Regional contracts.
- Shared reserves.
- Cross-town events.
- Regional Foreman recommendations.

## Three.js Integration

- Regional map with settlement nodes.
- Caravan route visuals.
- Jump-to-town camera transitions.

## Definition of Done

- At least two settlements can exchange goods through a bounded route.
- Regional contract references both towns.
- Route failure/shortage is visible and recoverable.
- Local town gameplay remains understandable.

## Required Test Evidence

- Supply route transfers resources deterministically.
- Cross-town resource conservation holds.
- Route cannot transfer from wrong account/town.
- Regional ledger summarizes pending issues.

---

# V4.0 — Shareable Operating Styles

## Goal

Let players share how they run towns, not just what towns look like.

## New Decision Layer

**Social operating identity.**

Players can export, compare, and maybe import operating templates.

## Core Additions

- Plot cards.
- Operating-style cards.
- Charter/doctrine summaries.
- Asynchronous comparison.
- Optional public showcase.

## Definition of Done

- Player can generate public-safe operating-style card.
- Secrets, Brain config, logs, and private events are excluded.
- Shared style is understandable without entering the player’s private town.

## Required Test Evidence

- Export redacts secrets and private logs.
- Public card loads without authenticated private data.
- Imported/inspired style does not grant unauthorized assets/resources.

---

# V4.5 — Creator Buildings and District Experiences

## Goal

Let the platform expand through controlled creator-made buildings and experiences.

## New Decision Layer

**Curated extension.**

Players choose which external experiences/buildings to attach to their town.

## Preconditions

- Stable experience registry.
- Moderation and safety policy.
- Asset-governance pipeline.
- Clear creator revenue/credit model.

## Definition of Done

- A creator building can be installed as a town object.
- It exposes typed tools and state.
- It cannot bypass plot/server truth.
- It can be disabled or removed safely.

## Required Test Evidence

- Manifest validation.
- Tool schema validation.
- Safety/moderation checks.
- Uninstall/rollback test.
- No unauthorized data access.

Implementation status in `codex/founders-plot-threejs-playable-slice`: covered
by `tests/founders_plot_v45_creator_buildings.test.js` and
`e2e/234_founders_plot_v45_creator_buildings.spec.js`, including curated local
import source, asset-governance provenance, credit-only creator model,
moderation/no-network checks, typed state/tools, rollback, and no core-town
truth mutation.

---

# V5+ — Agent Civilization Layer

## Goal

Grow Agent Town from one-player settlements into a broader world of agent-run civic systems.

## Possible Directions

- Agent-managed districts.
- Inter-agent economies.
- Public works.
- Reputation systems.
- Agent services marketplace.
- World events.
- Cross-framework agent participation.

## Guardrails

Do not enter this phase until:

- single-town loop retains;
- persistent Foreman is trusted;
- multi-town governance is understandable;
- public/shareable operating style is safe;
- identity/reputation systems have security review.

---

# Parallelization Guidance

## Safe to Run in Parallel

- V1.5 design/spec while V1.4.x closes.
- Three.js asset pipeline work while V1.5 gameplay is designed.
- V1.4.5 security review while V1.5 game design starts.
- V2 persistent Foreman research docs while V1 content is implemented.
- Marketing roadmap prompt deck and hero art.

## Should Stay Sequential

- Do not ship V2 persistent Foreman before V1.5 makes the town loop worth delegating.
- Do not ship second settlement before persistent one-town governance works.
- Do not ship specialists before one Foreman is trusted.
- Do not ship social sharing before player identity/pride loops exist.

---

# Canonical Next Step

The next product implementation goal should be:

> **V1.5 — First-Hour and Return-Loop Expansion**

This sprint builds directly on the Three.js playable scene without jumping prematurely into V2 complexity.

The V1.5 team should read:

1. `AGENTS.md`
2. canonical brand/design/UX/registry docs
3. `specs/43_founders_plot_threejs_playable_slice.md`
4. `specs/44_founders_plot_2d_asset_pipeline.md`
5. `specs/45_founders_plot_threejs_full_state_coverage.md`
6. this roadmap document
7. the V1.5 implementation spec

---

# Machine-Readable Summary

```yaml
current_locked_renderer:
  founders_plot_v1x: threejs
  renderer_role: presentation_only
  simulation_truth: server/founders_plot
  mutation_truth: et.plot_tools

identity_contract:
  player_facing: account_wallet_continuity
  current_provider: privy
  copy_rule: avoid provider jargon in normal gameplay

next_implementation:
  version: V1.5
  name: First-Hour and Return-Loop Expansion
  decision_layer: contract_choice
  depends_on:
    - play_first_onboarding
    - brain_gated_clover
    - threejs_playable_slice
    - mobile_calmness
  must_not_add:
    - persistent_offsession_foreman
    - specialists
    - second_settlement
    - social_systems
    - new_large_resource_tree

parallel_tracks:
  - v1_4_5_account_vault_security_spec
  - threejs_asset_pipeline
  - v2_persistent_foreman_research
  - marketing_roadmap_prompt_deck
```
