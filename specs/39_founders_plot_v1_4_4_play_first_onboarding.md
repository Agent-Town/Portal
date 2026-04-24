# Agent Town: Founders Plot V1.4.4 — Play-First Onboarding and Brain-Gated Clover

**Spec version:** v1.0  
**Date:** 2026-04-24  
**Target branch name:** `codex/founders-plot-v1-4-4-play-first-onboarding`  
**Applies to:** current Agent Town / Portal V1.4.x release line after the app-wide GPT Image 2 refresh and Founders Plot visual signoff work.  
**Primary audience:** agentic AI developers, frontend engineers, game designers, QA, product/design owner.

---

## 0. Executive summary

The current onboarding path asks too much before the player has felt why Agent Town matters. The new onboarding model must let a player enter **Agent Town: Founders Plot** quickly after Privy login, play the first loop manually, and only then ask them to connect a Brain when they want **real Clover Foreman** behavior.

This spec changes onboarding from:

```text
Start Gate -> Privy -> Town Hall / Brain / Sigil / Ceremony -> eventually game
```

to:

```text
Start Gate -> Privy -> Founders Plot playable immediately
                 -> optional Brain Quick Connect when Clover can help
                 -> optional Town Hall later when the player wants public identity / advanced setup
```

The key product decision:

> **Founders Plot is playable without a Brain. Real Clover Foreman gameplay requires a connected Brain. Full Town Hall onboarding is deferred until the user is invested.**

This removes a major adoption pain point without weakening the AI promise. It also makes the product more honest: deterministic guide behavior is not presented as real AI autonomy, and real Foreman actions are only unlocked when the player has configured a capable Brain.

---

## 1. Product goals

### 1.1 Goals

1. **Reduce time-to-game.** A Privy-authenticated user must be able to enter Founders Plot and perform the first meaningful action without completing Town Hall, Brain, Sigil, or Ceremony.
2. **Preserve the AI differentiator.** Real Clover Foreman behavior must still require a connected Brain and the OpenClaw Lite / LLM-or-Test-Brain runtime path.
3. **Avoid fake AI.** Without a Brain, Clover may guide/tutorialize deterministically, but must not be presented as reasoning or autonomously acting.
4. **Move full onboarding into Town Hall.** Town Hall becomes an in-world upgrade path for public identity, deeper agent setup, ERC-8004, and advanced autonomy.
5. **Use Privy as the production identity front door.** Privy login gives the user enough identity/wallet context to create a private plot and play manually.
6. **Keep current V1.4.x visual and gameplay work stable.** This is a flow/gating sprint, not an art sprint or a new content sprint.

### 1.2 Non-goals

Do **not** add:

- new resources;
- new buildings;
- new contract types;
- persistent/off-session Foreman;
- doctrine board;
- specialist agents;
- social systems;
- token economy changes;
- new wallet providers beyond current Privy assumptions;
- a new renderer;
- a new agent runtime architecture.

Do **not** remove the full onboarding flow. It remains available in Town Hall.

---

## 2. Current problem

The current app has a multi-step onboarding model built around Town Hall profile/registration, Brain configuration, Sigil, and Ceremony. That was reasonable when the product was primarily an onboarding portal, but Founders Plot is now the flagship gameplay surface.

The current journey risks this failure mode:

```text
User sees beautiful start page.
User signs in.
User is asked to configure identity / agent / brain / ceremony before understanding the game.
User leaves before experiencing the town-builder loop.
```

The product needs the opposite sequence:

```text
User signs in.
User plays within minutes.
User sees where Clover could help.
User chooses to connect a Brain because the value is now obvious.
User later visits Town Hall because the town feels worth formalizing.
```

---

## 3. Core design decision: split play access from Foreman access

### 3.1 Three modes

The app must clearly distinguish three modes.

| Mode | Brain required? | What the player can do | What Clover can do | Product copy |
|---|---:|---|---|---|
| **Manual Founder Mode** | No | Play core Founders Plot manually: build, collect, accept contracts, upgrade. | Deterministic tutorial/guide suggestions only. No LLM, no autonomous actions. | “Clover can guide the basics. Connect a Brain to unlock real Foreman help.” |
| **Real Clover Foreman Mode** | Yes | Full V1 game loop plus bounded Foreman actions. | Uses OpenClaw Lite worker + Brain/LLM/Test Brain path to observe, choose among safe candidates, act, explain. | “Clover is now thinking with your Brain and can help with approved actions.” |
| **Town Hall Official Mode** | Not directly, but likely useful | Public identity, deeper profile, advanced agent setup, ERC-8004 / registration, future governance. | Advanced settings and future autonomy configuration. | “Make your town official at Town Hall.” |

### 3.2 Brain rule

A free/basic/no-op Brain is **not** sufficient for real Clover gameplay in production.

Production rules:

- Real Foreman actions require `brain.configured === true` and `foreman.runtimeReady === true`.
- Test Brain is allowed in deterministic CI and local test mode only.
- Without a Brain, the Foreman scheduler must not execute world mutations.
- Without a Brain, no UI copy may imply that Clover is reasoning autonomously.

### 3.3 Town Hall rule

Town Hall full onboarding is not required to start Founders Plot.

Town Hall is required only for:

- public identity / official profile;
- ERC-8004 / registration paths;
- public reputation / passport-like features;
- advanced agent profile;
- future social/governance participation;
- any feature explicitly marked as requiring official identity.

---

## 4. Target first-session flow

### 4.1 New default flow

```text
1. Start Gate
   - Primary CTA: “Play Founders Plot” or “Enter Agent Town”
   - Privy login starts when needed.

2. Privy login
   - Email/social/wallet login depending on current Privy configuration.
   - After success, redirect to `/app?district=founders-plot&entry=play-first`.

3. Founders Plot opens immediately
   - Player sees the town/game surface.
   - Mode badge says: “Manual Founder Mode”.
   - Current objective: first build/collect action.

4. First manual loop
   - Build or select first building.
   - Collect first resource.
   - Accept or complete first simple contract depending on current content state.

5. First Clover value prompt
   - Trigger after a meaningful moment, not before gameplay.
   - Example: output ready, contract needs production, or bottleneck detected.
   - Copy: “Clover can handle routine checks if you connect a Brain.”

6. Brain Quick Connect
   - Lightweight sheet/drawer.
   - Use existing Brain provider/model storage and validation.
   - After success, Clover mode changes to Real Foreman Mode.

7. Town Hall invitation
   - Trigger after HQ2, first contract completion, or first Morning Brief.
   - Copy: “Your settlement is growing. Visit Town Hall to make it official.”
```

### 4.2 Old full onboarding remains available

The existing full route must still be reachable:

```text
Town Shell -> Town Hall -> full setup / profile / Brain / Sigil / Ceremony / identity flow
```

But it is no longer the default blocker for Founders Plot.

---

## 5. Route and gate rules

### 5.1 Start Gate

Update the Start Gate CTA semantics:

- Primary CTA: **Play Founders Plot** / **Enter Agent Town**.
- On click, ensure Privy login.
- After successful Privy login, default destination should be Founders Plot, not the full onboarding stepper.

Recommended redirect:

```text
/app?district=founders-plot&entry=play-first
```

If direct modal opening is unreliable, use:

```text
/app?open=founders-plot&entry=play-first
```

and normalize it in app initialization.

### 5.2 Town Hub district gating

Founders Plot must be allowed when:

```ts
isPrivyAuthenticated === true
```

or in local dev/test when an equivalent test session exists.

Founders Plot must not be blocked by:

- `onboarding.registrationComplete !== true`;
- Brain not configured;
- Sigil incomplete;
- Ceremony incomplete;
- Town Hall profile incomplete.

Brain/Town Hall/Sigil/Ceremony can remain gated by their own needs. They must not gate the first manual Founders Plot loop.

### 5.3 Brain-gated functionality

Brain not configured should disable only:

- Real Foreman Run Now;
- Foreman scheduled actions;
- LLM-generated Plan Cards;
- LLM-generated reasoning/receipts;
- any autonomous `actor: AGENT` mutation;
- any worker heartbeat that chooses actions via LLM/Test Brain.

Brain not configured must not disable:

- human building placement;
- human production queueing;
- human collection;
- human contract acceptance/turn-in;
- manual plot progression;
- deterministic tutorial guidance;
- Town Hall visit.

### 5.4 Town Hall later

Town Hall should become an explicit destination with a progression invitation.

Recommended unlock prompt:

```text
Make it official
Your settlement is growing. Visit Town Hall to name your public role, finish your identity setup, and prepare for future reputation features.
```

Do not call this “required” unless the player attempts a feature that truly requires official identity.

---

## 6. State model changes

Add or normalize a single server/client access object.

```ts
export type AgentTownAccessState = {
  authenticated: boolean;
  authProvider: 'privy' | 'session' | 'test' | 'unknown';

  foundersPlot: {
    playable: boolean;
    mode: 'MANUAL_FOUNDER' | 'REAL_CLOVER' | 'OFFICIAL_TOWN';
    blockedReason: null | 'AUTH_REQUIRED' | 'PLOT_INIT_FAILED';
    defaultDestination: boolean;
  };

  brain: {
    configured: boolean;
    runtimeReady: boolean;
    requiredForRealForeman: true;
    provider: string | null;
    model: string | null;
    testBrainOnly: boolean;
  };

  clover: {
    guideAvailable: boolean;
    realForemanAvailable: boolean;
    schedulerEnabled: boolean;
    disabledReason: null | 'BRAIN_REQUIRED' | 'RUNTIME_NOT_READY' | 'CONTEXT_INCOMPLETE';
  };

  townHall: {
    complete: boolean;
    requiredForPublicIdentity: boolean;
    recommended: boolean;
    recommendedReason: null | 'HQ2_REACHED' | 'FIRST_CONTRACT_DONE' | 'PLAYER_OPENED_PUBLIC_FEATURE';
  };
};
```

This object may be returned inside the existing `/api/state` payload or exposed through a new focused route:

```text
GET /api/onboarding/access
```

If the route is added, it must be read-only and deterministic.

---

## 7. Founders Plot UI requirements

### 7.1 Default mode badge

Add a small, non-noisy status line or badge in the Foreman area.

Manual mode:

```text
Manual Founder Mode
Clover can guide the basics. Connect a Brain to unlock real Foreman help.
```

Real Foreman mode:

```text
Real Clover Foreman
Clover is using your Brain and can help with approved actions.
```

Official mode, if Town Hall complete:

```text
Official Founder
Your town identity is set. Clover can use your configured Brain when enabled.
```

### 7.2 Brain Quick Connect CTA

The first Brain CTA should appear only when relevant.

Good trigger points:

- a completed output is ready and the player has collected manually once;
- a contract would benefit from routine production;
- the player clicks Clover while in Manual Founder Mode;
- the player opens the Foreman drawer.

Bad trigger points:

- before the first game action;
- as a blocking modal on first entry;
- while the player is reading the first objective.

### 7.3 Brain Quick Connect sheet

Create or adapt a compact sheet from the existing Brain district behavior.

Required content:

- one-sentence value statement;
- provider/model selection using existing provider catalog;
- credential/OAuth path using existing Brain code;
- “Save and unlock Clover” CTA;
- “Maybe later” secondary action;
- link to full Brain settings.

Forbidden in quick sheet:

- debug tabs;
- worker traffic;
- long provider education;
- model benchmark walls;
- wallet/chain jargon;
- full Town Hall stepper.

### 7.4 Manual-mode Foreman controls

In Manual Founder Mode:

- `Run now` and scheduler controls are disabled or hidden.
- If visible, their disabled state must explain the requirement.
- Manual human actions stay enabled.

Example disabled tooltip/copy:

```text
Connect a Brain to let Clover reason and act as your Foreman.
```

Do not show:

```text
LLM not configured
runtime missing
provider error
```

unless in debug mode.

---

## 8. Server / API behavior

### 8.1 Manual plot bootstrap

When a Privy-authenticated user enters Founders Plot for the first time, the server must create or load a private plot without requiring Town Hall completion.

Required behavior:

- `GET /api/founders-plot/state` may initialize the plot for the authenticated user/session.
- Plot ownership is tied to the Privy identity / wallet/session identity already used by the app.
- Existing plot state must resume after reload.
- If a future official Town Hall identity is created, the plot must attach or alias to that identity without data loss.

### 8.2 Actor boundary

Human manual tools are still allowed through existing human routes.

Foreman mutation routes must remain strict:

- require Brain/runtime readiness;
- require OpenClaw Lite worker origin metadata where applicable;
- reject spoofed `actor: AGENT` from human routes;
- fail closed if Foreman context is incomplete.

### 8.3 No fake Foreman mutation

In Manual Founder Mode, no code path may create world mutations attributed to Clover/AGENT.

Allowed:

- deterministic UI suggestions;
- tutorial copy;
- highlighting an objective;
- explaining that Brain is required.

Forbidden:

- `actor: AGENT` mutation;
- replay event claiming LLM action;
- scheduler auto-collect;
- LLM receipt;
- worker-origin fake metadata.

---

## 9. Town Hall changes

### 9.1 Town Hall becomes “Make it official”

Update Town Hall copy to communicate optional progression:

```text
Town Hall is where your settlement becomes official.
Set your public role, connect deeper identity, and prepare for future reputation and governance features.
```

### 9.2 Stepper containment

The four-step onboarding stepper may remain inside Town Hall, but must not appear as the global blocking path for Founders Plot.

### 9.3 Town Hall entry triggers

Show a non-blocking Town Hall invitation after:

- HQ reaches Level 2;
- first contract completed;
- first Morning Brief opened;
- user opens a public/social/identity feature.

Do not interrupt the player during a building or collection action.

---

## 10. Copy requirements

### 10.1 Approved copy set

Use clear player-facing language.

```text
Play Founders Plot
Start building your first settlement.
```

```text
Manual Founder Mode
Build by hand for now. Clover can guide the basics.
```

```text
Connect a Brain
Let Clover reason about your town and help with approved actions.
```

```text
Real Clover Foreman
Clover is using your Brain and can help with routine work.
```

```text
Visit Town Hall
Make your growing settlement official.
```

### 10.2 Forbidden normal-gameplay copy

Do not show these in normal gameplay:

- `LLM not configured`
- `runtime missing`
- `provider error`
- `NO_SOLANA_WALLET`
- `agent.panel.*`
- `onboarding.required`
- raw JSON error codes
- `ERC-8004 required` unless the user is explicitly entering an identity/reputation feature

Raw diagnostics may remain in debug surfaces.

---

## 11. Instrumentation and metrics

Add lightweight analytics/event logging. If a central analytics provider is not present, add server event log entries or test-observable counters.

Required events:

```text
onboarding.play_first.entered_founders_plot
onboarding.play_first.first_manual_action
onboarding.play_first.first_contract_seen
onboarding.brain_cta.shown
onboarding.brain_cta.dismissed
onboarding.brain_quick_connect.started
onboarding.brain_quick_connect.completed
onboarding.townhall_invite.shown
onboarding.townhall.opened_after_play
clover.mode.manual_guide
clover.mode.real_foreman_unlocked
```

Required metrics:

| Metric | Target |
|---|---:|
| `TimeToFoundersPlotAfterPrivyP95` | <= 6 seconds in local/e2e environment after auth callback |
| `FirstActionVisibleWithinP95` | <= 5 seconds after Founders Plot route load |
| `FullOnboardingBlocksFoundersPlotRate` | 0 |
| `RealForemanMutationWithoutBrainRate` | 0 |
| `ManualModeFirstLoopCompletion` | test-proven; product metric later |
| `BrainCTAAppearsBeforeFirstActionRate` | 0 |
| `TownHallBlockingFirstLoopRate` | 0 |
| `RawDebugJargonVisibleInNormalGameRate` | 0 |

---

## 12. TDD / testing overview

See `specs/40_founders_plot_v1_4_4_play_first_onboarding_tdd_matrix.md` for the full test matrix.

Minimum required tests:

1. Privy-authenticated/test-authenticated user enters Founders Plot without Brain/Town Hall.
2. Manual first loop can complete without Brain.
3. Real Foreman actions are blocked without Brain.
4. Brain Quick Connect unlocks Real Clover mode.
5. Town Hall remains reachable and full onboarding still works.
6. Founders Plot is no longer blocked by Brain/Town Hall/Sigil/Ceremony.
7. No raw debug/provider/wallet jargon appears in normal gameplay.
8. Existing V1.4.3 visual/mobile screenshots do not regress materially.

---

## 13. Implementation work packages

### WP1 — Access state and route gating

- Add `AgentTownAccessState` or equivalent normalized access object.
- Decouple Founders Plot playability from full onboarding completion.
- Update town hub district gating to always permit Founders Plot after Privy/test auth.
- Preserve direct Town Hall/Brain/Sigil/Ceremony paths.

### WP2 — Start Gate redirect

- Update Start Gate primary CTA to play-first behavior.
- After Privy login, send user to Founders Plot by default.
- Preserve secondary paths for full town hub / existing onboarding if needed.

### WP3 — Founders Plot Manual Founder Mode

- Add manual-mode UI badge/copy.
- Ensure manual building/contract loop works with no Brain.
- Disable/hide real Foreman controls until Brain is configured.

### WP4 — Brain Quick Connect

- Implement compact Brain connection sheet.
- Reuse existing provider/model/OAuth/API-key storage logic.
- On success, switch Clover mode to Real Foreman if runtime is ready.
- Add “full Brain settings” link.

### WP5 — Town Hall deferred onboarding

- Move full onboarding framing into Town Hall.
- Add “Make it official” copy and progression invitation.
- Ensure Town Hall does not interrupt first loop.

### WP6 — Foreman safety and no-fake-AI guardrails

- Prevent AGENT mutations without Brain/runtime readiness.
- Prevent fake LLM receipts in Manual Founder Mode.
- Add explicit event separation: manual guide suggestion vs real Foreman action.

### WP7 — Tests and screenshots

- Add Playwright and Node tests from the TDD matrix.
- Update screenshots only if visual differences are intentional and small.
- Keep V1.4.3 app-wide asset baseline unchanged.

---

## 14. Definition of Done

The sprint is done when:

- a new authenticated user can enter Founders Plot immediately after Privy/test login;
- the user can complete the first manual loop without Brain or Town Hall;
- Brain Quick Connect appears only after gameplay context makes it useful;
- Real Clover actions require Brain/runtime readiness;
- full Town Hall onboarding remains available and working;
- existing V1.4.x gameplay/visual baselines remain stable;
- all required tests pass;
- release notes clearly explain Manual Founder Mode vs Real Clover Foreman Mode.

---

## 15. Release messaging

Recommended release note:

```text
Play first, configure later.

Founders Plot now opens immediately after login, so you can start building your first settlement before completing the deeper Town Hall setup. Clover will guide the basics in Manual Founder Mode. When you are ready for real AI-assisted gameplay, connect a Brain and unlock Clover as your active Foreman. Town Hall remains available later when you want to make your town official and prepare for future identity and reputation features.
```

---

## 16. Machine-readable planning summary

```yaml
spec_id: founders_plot_v1_4_4_play_first_onboarding
version: v1.0
scope_type: release_candidate_onboarding_refactor
primary_goal: allow_authenticated_users_to_play_founders_plot_before_full_onboarding
must_ship:
  - privy_to_founders_plot_default_path
  - manual_founder_mode_without_brain
  - brain_required_for_real_clover
  - brain_quick_connect_sheet
  - townhall_deferred_full_onboarding
  - no_fake_agent_mutations_without_brain
  - test_coverage_for_gating_and_copy
must_not_ship:
  - persistent_off_session_foreman
  - new_gameplay_systems
  - new_resources_or_contracts
  - new_visual_asset_rebuild
  - doctrine_board
  - specialist_agents
key_metrics:
  time_to_founders_plot_after_privy_p95_seconds: 6
  first_action_visible_p95_seconds: 5
  full_onboarding_blocks_founders_plot_rate: 0
  real_foreman_mutation_without_brain_rate: 0
  raw_debug_jargon_visible_rate: 0
user_modes:
  - MANUAL_FOUNDER
  - REAL_CLOVER
  - OFFICIAL_TOWN
```
