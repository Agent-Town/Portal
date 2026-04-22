# Working agreements for coding agents

This repo is **Agent Town / Portal**: the web entry, onboarding shell, OpenClaw Lite worker path, and Founders Plot game surface.

The project is no longer only a minimal landing page. It contains both:

1. legacy/start/onboarding flows that must remain stable; and
2. **Agent Town: Founders Plot**, the V1 home-town game chapter.

## Source-of-truth documents

Before making product/UI changes, read the relevant docs in this order:

1. `AGENTS.md` — repo workflow and non-negotiable coding rules.
2. `BRAND.md` — product identity, tone, naming, copy, character, and asset law.
3. `DESIGN.md` — visual law, tokens, layout, game-surface composition, accessibility, and asset-generation law.
4. `GAME_UX.md` — UX flows, hierarchy, game-surface interaction rules, screenshot signoff rules, and measurable acceptance criteria.
5. `REGISTRY.md` — approved `@agent-town` components/blocks, visual contracts, and asset-governance primitives.
6. The active sprint spec in `specs/`.

Do not duplicate detailed style rules in `AGENTS.md`. Put durable design/UX rules in the design docs above and link to them here.

## V1.4.2 GPT Image 2 asset workflow

When the active sprint uses GPT Image 2 / `gpt-image-2`:

- create or update the prompt file before generating production assets;
- keep durable prompts under `specs/prompts/`;
- generate into candidate folders first, not directly into production paths;
- record prompt hash, reference hashes, model, candidate id, post-processing, byte size, and human signoff in the manifest;
- use actual route screenshots as the signoff surface;
- do not request transparent backgrounds from GPT Image 2; post-process sprite-like assets after generation;
- do not ship untracked generated-image bundles or temporary capture folders.

## V1.4.2 acceptance cleanup rules

When implementing the V1.4.2 acceptance cleanup:

- treat the GPT Image 2 art baseline as product-owner-approved;
- do not start a broad asset rebuild;
- preserve the Start Gate copy `WARNING! CONTAINS AND PRODUCES AI SLOP.` as product-owner-approved;
- implement the layered-plates scene model with separate `scene-base`, `scene-ambient`, `live-object`, `character`, `effects`, and `ui-overlay` responsibilities;
- do not bake stateful gameplay objects into scene backgrounds;
- reduce same-weight floating labels and repeated `Build here` text;
- on mobile, keep only selected, recommended, or urgent labels visible by default;
- Clover must visibly act on a target object without requiring a drawer or debug panel;
- HQ progression must be visually readable;
- do not add new gameplay systems in this cleanup patch.

Read before implementation:

- `specs/31_founders_plot_v1_4_2_acceptance_cleanup.md`
- `specs/32_founders_plot_v1_4_2_acceptance_cleanup_tdd_matrix.md`
- `docs/visual/VISUAL_SIGNOFF_SHEET_V1_4_2.md`
- `docs/visual/SCENE_LAYERING_DECISION_V1_4_2.md`
- `Brand kit/guidelines/agent-town-design-pack/DESIGN.md`
- `Brand kit/guidelines/agent-town-design-pack/GAME_UX.md`
- `Brand kit/guidelines/agent-town-design-pack/REGISTRY.md`

## Primary goals

1. **Game-first frontend** — the default player-facing experience must feel like a real Agent Town game, not a dashboard.
2. **Minimal UI by default** — keep the main path single-purpose, with advanced/debug surfaces hidden.
3. **Human + agent co-op** — the player and agent/Foreman must operate through the same shared state machine.
4. **Worker-first architecture** — OpenClaw Lite worker/runtime owns agent behavior; the server owns world truth.
5. **Deterministic testability** — every milestone must be verifiable with Playwright and lower-level tests where appropriate.
6. **Wallet/session continuity** — wallet/session continuity must not regress.
7. **Design-source discipline** — visual/game-surface changes must follow `BRAND.md`, `DESIGN.md`, `GAME_UX.md`, and `REGISTRY.md`.

## Non-goals / constraints

- Do **not** add point systems, token farming, or engagement hacks.
- Do **not** add heavy frameworks unless the active spec explicitly approves them.
- Do **not** expose provider/model/wallet/runtime/debug jargon in normal gameplay.
- Do **not** move agent decision logic into backend handlers.
- Do **not** fake world state or Foreman behavior in the UI.
- Do **not** introduce broad future-version systems during a narrow sprint.
- Do **not** create one-off visual systems when an `@agent-town` registry primitive or block should be used.

Legacy note: Team Code remains a session/routing token for legacy flows. Brain/OAuth/API-key flows may exist only where already part of the product path and must remain progressively disclosed.

## Commands

Install:
```bash
npm install
```

Dev server:
```bash
npm run dev
```

E2E tests:
```bash
npm test
```

Run a single test file:
```bash
npx playwright test e2e/02_match_unlock.spec.js
```

Rebuild OpenClaw Lite artifacts after vendor runtime changes:
```bash
npm run build:openclaw-lite
```

Optional `design.md` lint, when available:
```bash
npx @google/design.md lint DESIGN.md
```

## Where to change things

- `public/` — HTML/CSS/JS, visual assets, experience clients.
- `public/experiences/founders-plot/` — Founders Plot client, style, packs, assets.
- `public/experiences/founders-plot/assets/` — Founders Plot production and candidate assets.
- `server/` — Express API + session logic + server-authoritative game state.
- `server/founders_plot/` — Founders Plot engine, store, routes, tools, recap/replay.
- `vendors/openclaw-lite-main/src/openclaw-lite/` — OpenClaw Lite source runtime.
- `public/openclaw-lite/` — built OpenClaw Lite browser artifacts; keep in sync with vendor changes.
- `e2e/` — Playwright tests and acceptance criteria.
- `tests/` — lower-level validation tests.
- `specs/` — product + API specifications.
- `specs/prompts/` — durable prompt source files for generated assets.
- `docs/visual/` — inventories, schemas, signoff sheets, and visual-process docs.
- design docs: `BRAND.md`, `DESIGN.md`, `GAME_UX.md`, `REGISTRY.md`.

## Definition of done

A change is not done until:

- all relevant tests pass;
- no new console errors occur on the golden path;
- `npm run build:openclaw-lite` has been run when worker/vendor code changed;
- design/UX docs are updated when durable design behavior changed;
- screenshot baselines are added/updated for player-facing UI changes;
- generated production assets have prompt provenance and manifest approval metadata;
- normal gameplay contains no backstage/debug/provider/runtime jargon;
- accessibility checks pass for new interactive surfaces;
- the active sprint spec’s measurable metrics are satisfied.

## Design and UX implementation workflow

For any shell, onboarding, or Founders Plot game-surface change:

1. Read `BRAND.md`, `DESIGN.md`, `GAME_UX.md`, and `REGISTRY.md` first.
2. Identify whether the change is shell, onboarding, game-surface, debug/backstage, or server logic.
3. Use existing `@agent-town` registry items before inventing new components.
4. If a new pattern is durable, add it to `REGISTRY.md` and provide a contract.
5. Preserve one primary player action per screen/state.
6. Hide advanced/debug/provider/runtime details behind explicit disclosure.
7. Add Playwright screenshot coverage for 390 / 768 / 1280 widths.
8. Verify the UI still reads as Agent Town, not generic SaaS.

### Founders Plot visual/game-surface rule

For Founders Plot and future Agent Town game surfaces:

- The world is the interface.
- The default screen must feel like a game, not a dashboard.
- Buildings, contracts, resources, timers, and Foreman actions should be visible in-world.
- Use contextual sheets/drawers instead of permanent text panels.
- Clover/the Foreman must appear as an in-world helper with short receipts.
- No provider/model/wallet/runtime/debug jargon may appear in normal gameplay.
- Visual state must derive from real server/game state.
- Respect reduced motion, keyboard access, touch targets, and accessible names.

## Skill Contract Convention (mandatory)

To keep future skill and worker work safe, preserve this convention:

- `public/skill.md` is the source of truth for the external-agent playbook.
- `e2e/55_phase3_skill_contract_line.spec.js` is the baseline contract line for skill compatibility.
- `docs/internal-skill-testline.md` tracks capability-to-test mapping and planned expansions.

When changing skill behavior:

- Update `public/skill.md`.
- Update or extend `e2e/55_phase3_skill_contract_line.spec.js` (or add `e2e/56+` tests).
- Update `docs/internal-skill-testline.md` with the new capability row and coverage.

When changing worker behavior required by skill files (`skill.md` / `SKILL.md`):

- Add deterministic Playwright coverage first.
- Keep tests API-first and behavior-focused so UI reshuffles do not break contract validation.
- Do not merge worker-skill changes unless the full suite passes.

## New Agent Onboarding Rules (mandatory)

### 1) Worker-first architecture, no backend shortcuts

- The in-browser OpenClaw Lite worker/runtime is authoritative for agent behavior.
- The server is an API/state backend only; do **not** move agent decision logic into backend handlers.
- Do **not** fake co-op outcomes or Foreman outcomes in server routes.
- If behavior is missing, add/extend a worker tool and route the skill through tools + LLM or deterministic test brain as specified.

### 2) Shared-state co-op model

- Human and agent must operate against the same shared state machine.
- Worker should poll or subscribe with delay/backoff, not tight loops.
- Co-op actions that require both participants must remain two-party flows.

### 3) Skill path and execution expectations

- `public/skill.md` is the product playbook source; worker-imported `workspace/.../SKILL.md` is execution input.
- Do not bypass skill execution by manually injecting “next step” behavior into server responses.
- Preserve most-specific-skill selection behavior and single upfront skill-read constraint.

### 4) Tools and observability for debugging

Keep agent debugging transparent in backstage/debug areas:

- `Worker Tools` tab: current callable worker tool surface.
- `Skill Context` tab: imported skill state + extracted `<available_skills>`.
- `Worker Traffic` tab: outbound/inbound worker/gateway traffic trace.
- `Session Context` tab: runtime snapshot + transcript/system prompt preview.

Debug tabs must remain hidden from the normal gameplay surface.

### 5) Required implementation workflow

- For worker/runtime changes under `vendors/openclaw-lite-main/src/openclaw-lite/*`, rebuild artifacts with `npm run build:openclaw-lite`.
- Keep `public/openclaw-lite/*` in sync with vendor source changes.
- Add deterministic Playwright coverage for each new worker capability and regression risk.

### 6) Session and identity guardrails

- The user identity is the connected wallet/session identity, not a transient browser credential.
- Team Code is a session/routing token and should stay hidden from cluttered UX surfaces.
- Session identity should be stable across polling/refresh for a live session.

### 7) Brain OAuth and debug-panel guardrails

- OpenAI Codex authentication must use the PKCE flow (`/api/agent/lite/llm/oauth/openai-codex/start` -> `status` -> `exchange`).
- Do not treat OpenAI `id_token` callback URLs as usable model credentials; only access tokens from OAuth exchange are valid.
- Preserve state-based OAuth recovery.
- Keep the right-side agent debug tabs stable and worker-observable:
  - `Worker Tools`, `Skill Context`, `Worker Traffic`, `Brain`, `Session Context`.
- Keep Worker Traffic behavior stable:
  - card entries, newest-first ordering, filter buttons (`All`, `Incoming`, `Outgoing`).
- If changing any of the above, update deterministic coverage in:
  - `e2e/53_agent_panel_global_presence.spec.js`
  - `e2e/57_phase3_onboarding_wallet_llm_persist.spec.js`

### 8) Modal-first navigation guardrail (mandatory)

- Keep experience surfaces modal-first from the town hub page when live worker continuity matters.
- Do not implement full-page navigation for agent-driven UX steps when a modal/frame flow is possible.
- Reasoning:
  - The worker runtime is page-scoped JavaScript (`new Worker(...)` in the current document).
  - Full document navigation tears down that runtime and forces a worker restart.
  - Session/transcript can be restored, but live continuity and in-flight state are interrupted.
- Atlas policy:
  - Atlas must be opened through the main website modal flow.
  - Direct standalone Atlas access (`/atlas`, `/atlas.html`) should not render Atlas as a normal page.
  - Standalone hits should be redirected back to the town hub modal entry path.

## Sprint-spec discipline

When implementing a sprint spec:

1. Treat the active spec as scope law.
2. Treat `BRAND.md`, `DESIGN.md`, and `GAME_UX.md` as style/UX law.
3. Do not add future-roadmap systems unless explicitly required.
4. Document any ambiguity before coding.
5. Produce a final implementation report with changed files, tests, screenshots, and known limitations.

## Founders Plot V1.3.1 signoff-pass rule

When implementing the V1.3.1 visual-surface signoff pass:

- treat the existing V1.3 scene-first architecture as a locked win;
- do not rewrite the shell or add gameplay systems;
- read `BRAND.md`, `DESIGN.md`, `GAME_UX.md`, and `REGISTRY.md` before coding;
- update those docs when durable visual/UX rules change;
- keep normal Founders Plot gameplay free of Agent Comms / Worker Tools / Skill Context / Worker Traffic / Brain / Session Context / Trainer panels unless explicit debug mode is enabled;
- make Clover `ACTING` target-linked and testable;
- reduce mobile label density through the design-system rules, not one-off CSS hacks;
- ensure only the objective-relevant lot gets primary attention by default;
- split or quarantine unrelated OpenRouter/proxy changes with a separate owner and rollback note;
- capture full-route screenshots, not only embedded experience screenshots.

## Founders Plot V1.4.2 Patch 2 visual acceptance guardrail

When implementing Founders Plot visual acceptance fixes:

- do not satisfy visual requirements with metadata-only changes;
- mobile calmness must be proven on the real 390px route with screenshots and label/clip metrics;
- HQ progression must be proven with real distinct assets, visual-delta checks, and gameplay-scale screenshots;
- preserve owner-approved V1.4.2 art baseline and `AI SLOP` Start Gate copy;
- do not add gameplay systems, runtime architecture changes, new contracts, new resources, or hero-cast gameplay cameos during visual acceptance cleanup.


---

## V1.4 AI reality + visual-direction governance

### Canonical design-doc paths

Coding agents must read the design docs before changing player-facing UI. If root-level docs exist, they may be mirrors. The canonical repo path must be one of:

1. root files: `BRAND.md`, `DESIGN.md`, `GAME_UX.md`, `REGISTRY.md`; or
2. nested files: `Brand kit/guidelines/agent-town-design-pack/BRAND.md`, `DESIGN.md`, `GAME_UX.md`, `REGISTRY.md`.

If both exist, verify they are equivalent or that the root files clearly redirect to the nested canonical files. Do not leave `AGENTS.md` pointing at missing design docs.

### Foreman AI truth rule

Do not claim Clover/Foreman uses AI during gameplay unless a Foreman decision produces one of:

- `modelInvocationId`; or
- `testBrainInvocationId` from the same worker/runtime path used by live play.

The OpenClaw Lite worker must own Foreman cognition. Backend routes validate and execute world mutations; they must not choose Foreman actions as a shortcut.

### Experience-pack context rule

Every Founders Plot Foreman cognition turn must include or explicitly mark the status of:

- `skill.md`
- `heartbeat.md`
- `tools.md`
- `goals.md`
- optional `safety.md`

A heartbeat without tool descriptions is incomplete. If `tools.md` or the canonical tool registry cannot be loaded, the Foreman must no-op or ask for recovery; it must not act.

### Visual-direction workflow rule

Do not start a broad visual-art sprint from vague instructions such as “make it more premium.” First create or update:

- `docs/visual/FOUNDERS_PLOT_V1_4_VISUAL_DIRECTION_PACK.md`
- `docs/brand/HERO_VIDEO_SOURCE_INDEX.md`
- `docs/brand/HERO_VIDEO_REUSE_BRIEF_V1_4.md`

The visual direction pack is the input for later art implementation. It is not optional when changing the flagship Founders Plot surface.
