# Agent Town: Founders Plot V1.3 — Design-Source Implementation Handoff

**Status:** companion implementation instruction for the V1.3 Visual Game Surface sprint  
**Use with:** `agent-town-founders-plot-v1.3-visual-game-surface-spec.md`  
**Purpose:** keep detailed design/UX law in `BRAND.md`, `DESIGN.md`, `GAME_UX.md`, and `REGISTRY.md` instead of duplicating it in `AGENTS.md` or the implementation prompt.

---

## 1. Source-of-truth hierarchy

Use this order when instructions appear to overlap:

1. Active sprint spec: `agent-town-founders-plot-v1.3-visual-game-surface-spec.md`
2. `BRAND.md`
3. `DESIGN.md`
4. `GAME_UX.md`
5. `REGISTRY.md`
6. `AGENTS.md`
7. Existing code/tests

`AGENTS.md` defines workflow and non-negotiable repo guardrails. It should link to design docs rather than carrying detailed style rules.

---

## 2. What changes from the previous implementation prompt

The previous prompt gave detailed style rules inline. Replace that approach with this:

- Read the design docs first.
- Implement the active spec using those docs as design law.
- Update design docs only when durable style/UX rules change.
- Update registry contracts when durable components/blocks change.
- Keep `AGENTS.md` concise and directive.

---

## 3. Codex / GPT-5.4 Extra High implementation prompt

Use this prompt with the attached V1.3 spec and updated design docs:

```md
# Implementation Task — Agent Town: Founders Plot V1.3 Visual Game Surface

You are implementing the attached sprint spec:

`agent-town-founders-plot-v1.3-visual-game-surface-spec.md`

You must also follow these design-source documents:

- `BRAND.md`
- `DESIGN.md`
- `GAME_UX.md`
- `REGISTRY.md`
- `AGENTS.md`

Treat the V1.3 spec as product scope. Treat the design docs as visual/UX law. Treat `AGENTS.md` as repo workflow and architecture law.

## Operating mode

Use GPT-5.4 Extra High thinking.

Before editing files:
1. Read the full V1.3 spec.
2. Read `BRAND.md`, `DESIGN.md`, `GAME_UX.md`, `REGISTRY.md`, and `AGENTS.md`.
3. Inspect the current Founders Plot implementation.
4. Produce a concise implementation plan with:
   - files to change;
   - registry items to use or add;
   - asset plan;
   - visual-state adapter plan;
   - accessibility plan;
   - screenshot plan;
   - test plan;
   - risks/ambiguities.

Do not begin implementation until the plan is written.

## Core objective

Transform Founders Plot from a text-heavy management surface into a scenic, readable, game-like town surface.

The same V1.2 systems should now feel like a game:

> “That is my town. That is the next thing to do. That is Clover helping me.”

## Scope discipline

Implement V1.3 only.

Do not add:
- new backend gameplay systems;
- new resources;
- new contract mechanics;
- new economy mechanics;
- persistent off-session Foreman behavior;
- new OpenClaw runtime architecture;
- blockchain/wallet/provider changes;
- multiplayer/social systems;
- specialist agents;
- doctrine board;
- UGC/editor systems;
- PixiJS/Phaser rewrite.

Preserve existing V1.2 game behavior and APIs unless the spec explicitly requires frontend adaptation.

## Design-source discipline

Do not invent a parallel style guide in code.

If a durable visual/UX rule is missing, update the appropriate source:

- `BRAND.md` for tone, naming, character, copy, and asset identity.
- `DESIGN.md` for visual rules, tokens, composition, motion, and asset acceptance.
- `GAME_UX.md` for flows, hierarchy, interaction behavior, and acceptance metrics.
- `REGISTRY.md` for reusable components/blocks.
- `AGENTS.md` only for workflow/guardrails.

## Registry discipline

Use `@agent-town` registry primitives/blocks where possible.

For Founders Plot V1.3, prefer:
- `game-surface-base`
- `founders-plot-stage`
- `game-top-hud`
- `world-object`
- `building-state-badge`
- `timer-ring`
- `resource-flyout`
- `context-action-sheet`
- `clover-foreman`
- `contract-board-object`
- `town-journal-trigger`
- `approval-inbox-trigger`

If an item does not yet exist in code, create it with a contract and registry entry before using it as a durable pattern.

## Product constraints

Agent Town is the product/masterbrand.
Founders Plot is the launch chapter.
Clover is the visible AI Foreman.
The world is the interface.
Normal gameplay must not expose provider/model/wallet/runtime/debug jargon.

## Visual implementation rules

Every visual state must derive from real game state, events, timers, permissions, contracts, scheduler status, or Foreman status.

Do not fake state visually.
Do not hide broken runtime truth.
Do not use generated images as a substitute for accessible state.

## Asset rules

Generated assets are allowed.

They must follow `BRAND.md` and `DESIGN.md`, be optimized, and be listed in:

`public/experiences/founders-plot/assets/asset-manifest.json`

Each manifest entry must include:
- path;
- intended use;
- prompt or prompt summary;
- generation tool/model if known;
- reviewer;
- approval status;
- optimization status.

## Testing requirement

Implement the V1.3 tests required by the spec and design docs.

At minimum, prove:
- default screen is scenic/game-like, not dashboard-like;
- mobile layout works;
- world-object interactions work;
- Clover is visible and stateful;
- visual-state adapter is correct;
- text-budget rules pass;
- debug/runtime/provider jargon is absent from normal gameplay;
- reduced-motion mode works;
- asset manifest is valid;
- accessibility smoke checks pass;
- V1.2 gameplay did not regress.

## Screenshot requirement

Create/update screenshot baselines for:
- 390px;
- 768px;
- 1280px;
- required game states from the V1.3 spec.

Inspect screenshots before finalizing.
The implementation is not complete if screenshots still read as a dashboard, wall of cards, or text UI with decorative art.

## Final implementation report

The final response must include:
1. Summary of what changed.
2. Files changed.
3. Registry items used/created.
4. Assets added/changed with provenance.
5. Tests added/updated.
6. Tests run and results.
7. Screenshot baseline locations.
8. Known limitations.
9. Confirmation that no out-of-scope systems were added.
10. Any follow-up recommendations limited to true blockers or post-V1.3 polish.

Begin by reading the spec and design-source documents, then produce the implementation plan.
```

---

## 4. Required repository placement

The implementation team should place the updated docs at repo root unless the repo already has a `docs/design/` convention:

```text
AGENTS.md
BRAND.md
DESIGN.md
GAME_UX.md
REGISTRY.md
components.json
registry/
registry-source/
```

If the repo already stores design docs under a subdirectory, then `AGENTS.md` must link to the exact paths.

---

## 5. V1.3 spec adaptation note

The original V1.3 spec remains valid.

This handoff adapts implementation by moving reusable style/UX law into the design markdown files. Future specs should avoid repeating large sections of visual law and instead cite the design docs.

Future sprint specs should include only:

- product scope for that sprint;
- gameplay/system changes;
- test matrix;
- deltas from existing design law.

Do not re-litigate the visual identity unless the product owner explicitly requests a brand-direction change.
