# Codex / GPT-5.4 Handoff — V1.4.4 Play-First Onboarding Cleanup

You are implementing the attached cleanup specification:

```text
specs/41_founders_plot_v1_4_4_play_first_onboarding_cleanup.md
specs/42_founders_plot_v1_4_4_play_first_onboarding_cleanup_tdd_matrix.md
```

## Read first

Before editing code, read:

1. `AGENTS.md`
2. `BRAND.md`, `DESIGN.md`, `GAME_UX.md`, `REGISTRY.md` or their canonical nested equivalents
3. Existing V1.4.4 spec: `specs/39_founders_plot_v1_4_4_play_first_onboarding.md`
4. Existing V1.4.4 TDD matrix: `specs/40_founders_plot_v1_4_4_play_first_onboarding_tdd_matrix.md`
5. This cleanup spec and TDD matrix

## Core objective

Make the Play-First Onboarding branch release-candidate ready without changing the product scope.

The intended player ladder is:

```text
Play Now → Connect Brain → Visit Town Hall
```

Founders Plot must be playable after authentication without full Town Hall / Brain / Sigil / Ceremony.

Real Clover must remain Brain-gated.

## Implement only these five things

1. Add Start Gate / Privy-path E2E proof.
2. Make `AgentTownAccess` or equivalent shared access helper fail closed when auth is unknown.
3. Classify No Brain vs Demo/Test Brain vs Production Brain and gate Real Clover accordingly.
4. Add behavior-based no-Brain protected Foreman mutation tests.
5. Reformat V1.4.4 docs into readable markdown.

## Do not add

- new contracts;
- new resources;
- new buildings;
- new visual asset pass;
- persistent/off-session Foreman;
- doctrine board;
- specialists;
- social features;
- token/economy features;
- new identity ceremony behavior.

## Brain gate rule

Manual Founder Mode can run without Brain.

Real Clover cannot.

A free/test/local Brain must not unlock Real Clover in production.

It may only exercise the deterministic CI path under an explicit test/dev harness.

## Server truth rule

Do not fake AGENT actions.

A protected Foreman mutation without production Brain/runtime must fail closed and leave:

- inventory unchanged;
- event log unchanged for AGENT actions;
- replay/recap free of fake Foreman action.

## Test-first requirement

Add or update tests before finalizing the implementation:

```text
e2e/208_founders_plot_start_gate_privy_play_first_redirect.spec.js
tests/v1_4_4_access_fail_closed.test.js
e2e/209_founders_plot_access_fail_closed.spec.js
e2e/210_founders_plot_brain_modes_and_real_clover_gate.spec.js
tests/v1_4_4_foreman_brain_guard_behavior.test.js
tests/v1_4_4_markdown_readability.test.js
```

Exact filenames may be adjusted if the repo naming sequence differs, but equivalent coverage is required.

## Final implementation report

Your final report must include:

- summary of changes;
- files changed;
- tests added/updated;
- test commands run and results;
- exact Brain-mode classification behavior;
- confirmation manual play works without Brain;
- confirmation Real Clover requires production Brain;
- confirmation no fake AGENT actions occur without Brain;
- confirmation no out-of-scope gameplay or visual systems were added;
- known limitations.
