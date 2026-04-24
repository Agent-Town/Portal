# Codex Task — Implement Founders Plot V1.4.4 Play-First Onboarding

You are implementing the attached specification:

`specs/39_founders_plot_v1_4_4_play_first_onboarding.md`

Also read:

1. `AGENTS.md`
2. `BRAND.md`
3. `DESIGN.md`
4. `GAME_UX.md`
5. `REGISTRY.md`
6. `specs/40_founders_plot_v1_4_4_play_first_onboarding_tdd_matrix.md`
7. `docs/product/PLAY_FIRST_ONBOARDING_LADDER_V1_4_4.md`

## Objective

Change Agent Town onboarding so a Privy-authenticated user can enter Founders Plot and play manually before completing full Town Hall / Brain / Sigil / Ceremony onboarding.

Real Clover Foreman behavior must still require a connected Brain.

## Required behavior

Implement:

- Play-first route from Start Gate / Privy login to Founders Plot.
- Manual Founder Mode without Brain.
- Brain Quick Connect as a non-blocking in-game unlock.
- Real Clover mode only after Brain/runtime readiness.
- Town Hall full onboarding as a later optional “Make it official” path.
- Tests proving Founders Plot is no longer blocked by full onboarding.

## Scope discipline

Do not add:

- new gameplay systems;
- new resources;
- new contract types;
- persistent/off-session Foreman;
- doctrine board;
- specialist agents;
- social systems;
- token economy changes;
- new image-generation pass;
- new renderer.

Do not remove existing full onboarding. Move it later in the journey.

## Important product truth

Without a Brain:

- Clover may guide/tutorialize deterministically.
- Clover must not perform autonomous actions.
- Clover must not produce fake LLM receipts.
- No world mutation may be attributed to AGENT/Clover.

With a Brain:

- Clover may use the existing OpenClaw Lite / LLM-or-Test-Brain path.
- Server remains world truth.
- Safe-candidate and policy guardrails remain mandatory.

## Implementation plan required before coding

Before editing files, produce a concise plan including:

- current gating code found;
- route changes;
- access-state changes;
- UI changes;
- Brain Quick Connect approach;
- Town Hall copy/stepper changes;
- test plan;
- risks.

## Final report required

After implementation, report:

1. files changed;
2. route/gating changes;
3. new/updated UI components;
4. tests added and commands run;
5. screenshots updated;
6. known limitations;
7. confirmation that no out-of-scope gameplay systems were added.
