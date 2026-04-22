# Codex / GPT‑5.4 Extra High Prompt — Implement Founders Plot V1.4

You are implementing the attached sprint specification:

```text
specs/26_founders_plot_v1_4_ai_reality_and_visual_direction_pack.md
```

Use GPT‑5.4 Extra High thinking.

---

## Read order before coding

1. `AGENTS.md`
2. `BRAND.md` or canonical nested `Brand kit/guidelines/agent-town-design-pack/BRAND.md`
3. `DESIGN.md` or canonical nested `Brand kit/guidelines/agent-town-design-pack/DESIGN.md`
4. `GAME_UX.md` or canonical nested `Brand kit/guidelines/agent-town-design-pack/GAME_UX.md`
5. `REGISTRY.md` or canonical nested `Brand kit/guidelines/agent-town-design-pack/REGISTRY.md`
6. `public/experiences/founders-plot/skill.md`
7. `public/experiences/founders-plot/heartbeat.md`
8. `public/experiences/founders-plot/tools.md`
9. `public/experiences/founders-plot/goals.md`
10. `specs/26_founders_plot_v1_4_ai_reality_and_visual_direction_pack.md`
11. `specs/27_founders_plot_v1_4_tdd_acceptance_matrix.md`

Do not start implementation until you have written a concise plan.

---

## Implementation objective

Make Clover a real OpenClaw Lite LLM/Test Brain gameplay participant and prepare the reference-led visual direction pack for the next art lift.

The player-facing proof is:

> Clover observes the town, chooses among safe candidates through the worker/model path, acts through server-authoritative tools, and leaves a short receipt.

---

## Scope discipline

Do not add:

- persistent/off-session Foreman;
- doctrine board;
- specialist agents;
- new contracts;
- new resources/currencies;
- new gameplay systems;
- social/visitor mode;
- token economy features;
- renderer rewrite;
- full hero video production.

---

## Required implementation plan

Before editing files, output:

1. branch base and source patch/branch for real LLM Foreman;
2. files you expect to change;
3. how you will preserve V1.3.1 visual behavior;
4. context assembler design;
5. tool alias design;
6. tests to add/update;
7. visual direction docs to create/update;
8. hero-video source search plan.

---

## Core technical requirements

1. OpenClaw Lite worker owns Foreman cognition.
2. Server validates and executes world mutations.
3. Foreman context includes `skill.md`, `heartbeat.md`, `tools.md`, `goals.md`.
4. `tools.md` descriptions/schemas must reach the LLM/Test Brain.
5. Provider-facing tool names must be safe aliases, not dotted canonical names.
6. LLM/Test Brain chooses among server-provided safe candidates only.
7. Invalid model output must not mutate world state.
8. Replay/receipt/recap must record model/test-brain and tool mapping metadata.
9. Normal player UI must not show provider/model/runtime/debug jargon.

---

## Visual direction requirements

Create/update:

- `docs/visual/FOUNDERS_PLOT_V1_4_VISUAL_DIRECTION_PACK.md`
- `docs/brand/HERO_VIDEO_REUSE_BRIEF_V1_4.md`
- `docs/brand/HERO_VIDEO_SOURCE_INDEX.md`

Search for existing hero-video/script material, including:

- Lobster;
- Chibi girl;
- Wizard kid;
- Prairie dog.

If not found, state honestly that it was not found in the repo and request source material. Do not invent the script.

---

## Tests

Implement tests from:

```text
specs/27_founders_plot_v1_4_tdd_acceptance_matrix.md
```

At minimum:

- context assembler unit tests;
- tool alias unit tests;
- heartbeat/tools context hash unit tests;
- E2E test proving LLM/Test Brain selected a safe candidate;
- E2E test proving invalid candidate rejection;
- E2E test proving normal UI stays debug-free;
- markdown artifact tests for visual direction pack and hero source index.

---

## Final report required

Your final implementation response must include:

1. Summary of changes.
2. Port/reconciliation notes.
3. Files changed.
4. Foreman LLM/Test Brain flow with sample trace.
5. Provider-safe alias map sample.
6. Pack docs included in context with hashes.
7. Tests added/updated.
8. Tests run and results.
9. Live-provider smoke status.
10. Hero-video source index status.
11. Visual direction pack status.
12. Confirmation no out-of-scope gameplay systems were added.

Begin by reading the docs and writing the implementation plan.
