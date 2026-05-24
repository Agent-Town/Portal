# Agent Town: Founders Plot V1.4.4 Cleanup Patch Specification

**Spec ID:** `41_founders_plot_v1_4_4_play_first_onboarding_cleanup`  
**Target branch:** apply on top of `codex/founders-plot-v1-4-4-play-first-onboarding`
or the current release-candidate line containing commit `9634056`  
**Product area:** Play-first onboarding, Brain-gated Clover, release-candidate safety  
**Status:** implementation-ready cleanup patch  
**Owner:** implementation team  
**Review owner:** product/design/QA  

---

## 0. Executive summary

V1.4.4 correctly moves Agent Town toward a better first-session flow:

```text
Start Gate → Privy login → Founders Plot playable immediately → Brain Quick Connect when Clover matters → Town Hall later
```

This cleanup patch makes that implementation release-candidate safe.

It must not add new gameplay, visual scope, contracts, resources, or Foreman runtime features.

It only closes the five findings from the V1.4.4 review:

1. Prove the actual Start Gate / Privy path reaches Founders Plot play-first mode.
2. Make the shared access helper fail closed when authentication is unknown.
3. Resolve the free/test Brain versus Real Clover policy mismatch.
4. Replace source-string Brain-gate tests with behavior tests against the protected Foreman route.
5. Reformat the new V1.4.4 markdown docs for LLM readability and durable implementation handoff.

The desired product outcome is:

> A new user can enter Founders Plot quickly after Privy/test authentication,
> play manually without Brain, clearly understand that Real Clover requires a real connected Brain,
> and never see fake AGENT actions or unsafe access defaults.

---

## 1. Scope

### 1.1 In scope

- Start Gate / Privy-to-Founders-Plot redirect proof.
- Access helper authentication-default hardening.
- Brain mode policy and copy cleanup.
- Foreman protected-route no-Brain denial behavior coverage.
- Markdown readability/formatting cleanup for V1.4.4 docs.
- Minimal UI copy changes required to clarify Manual Founder Mode vs Real Clover.
- Tests, screenshots if changed, and release-candidate notes.

### 1.2 Out of scope

Do not add or modify:

- new contracts;
- new resources;
- new buildings;
- V1.5 first-hour systems;
- persistent/off-session Foreman;
- doctrine board;
- specialist agents;
- social systems;
- token/economy changes;
- new image-generation pass;
- platform asset refresh;
- OpenRouter/provider migration beyond the Brain-mode policy required here.

---

## 2. Source-of-truth product decisions

### 2.1 Product name and chapter

- **Agent Town** is the product/masterbrand.
- **Founders Plot** is the launch chapter / starting campaign.

### 2.2 Onboarding ladder

The V1.4.4 ladder is locked:

```text
Play Now
  ↓
Manual Founder Mode
  ↓
Connect Brain
  ↓
Real Clover Foreman
  ↓
Visit Town Hall / Make it official
```

### 2.3 Brain policy

Founders Plot must be playable without a Brain.

Real Clover Foreman must require a real Brain/runtime path.

The system must not pretend that a free/basic/no-op/test Brain is sufficient for full Real Clover in production.

### 2.4 Production auth assumption

Production uses Privy.

Once a production user logs in through Privy, wallet access should be available through the production auth path.

The game should not require full Town Hall onboarding before manual Founders Plot play.

---

## 3. Work package A — Start Gate / Privy play-first proof

### 3.1 Problem

The current V1.4.4 tests prove direct entry to:

```text
/app?district=founders-plot&entry=play-first
```

but the release path starts from Start Gate / Privy. The patch must prove the actual entry path.

### 3.2 Required behavior

When a user starts from the Start Gate and completes or simulates a valid Privy/test-auth login, the app must route to:

```text
/app?district=founders-plot&entry=play-first
```

and show the Founders Plot game surface without blocking on:

- Town Hall registration;
- Brain connection;
- Sigil/Ceremony;
- ERC-8004 registration;
- provider/model setup.

### 3.3 Implementation guidance

Inspect and update as needed:

```text
public/start.js
public/start.html
public/app.js
public/agent_town_access.js
server auth/session helpers if relevant
```

If tests need a deterministic Privy stand-in, add a test-only harness flag. Do not weaken production auth.

Acceptable test-auth mechanisms:

```text
?testPrivy=1
window.__AGENT_TOWN_TEST_AUTH__ = { authenticated: true, walletReady: true }
server-side test session fixture
```

The test mechanism must be impossible to enable accidentally in production unless the repo already has a safe test-mode convention.

### 3.4 Acceptance criteria

- A Playwright test starts on `/` or `/start.html`, triggers the auth/start flow, and lands in Founders Plot play-first mode.
- Founders Plot modal/game shell is visible.
- The first manual action can be performed.
- No Town Hall/Brain/Sigil/Ceremony gate blocks play.
- The test verifies the final URL contains `district=founders-plot` and `entry=play-first`.

### 3.5 Required test

Create or update:

```text
e2e/208_founders_plot_start_gate_privy_play_first.spec.js
```

Suggested assertions:

```js
await expect(page).toHaveURL(/district=founders-plot/);
await expect(page).toHaveURL(/entry=play-first/);
await expect(page.getByTestId('founders-plot-game-shell')).toBeVisible();
await expect(page.getByText(/Town Hall registration required/i)).toHaveCount(0);
await expect(page.getByText(/Connect Brain to continue/i)).toHaveCount(0);
```

Use actual selectors from the implementation; do not invent fragile text-only selectors if stable test IDs exist.

---

## 4. Work package B — Fail-closed access helper

### 4.1 Problem

The shared access helper should not default to authenticated when auth input is missing or ambiguous. Test convenience must not create release-risk defaults.

### 4.2 Required behavior

`AgentTownAccess` must default to:

```text
authenticated = false
```

unless the caller explicitly provides authenticated state.

Unknown auth state must not be interpreted as authenticated.

### 4.3 Allowed gameplay result

Unauthenticated users may see a Start Gate / login prompt, but must not silently enter authenticated-only play-first mode.

Authenticated users may enter Manual Founder Mode without Brain/Town Hall.

### 4.4 Implementation guidance

Update:

```text
public/agent_town_access.js
all callers that relied on implicit authenticated=true
tests that need explicit authenticated fixtures
```

Ensure the helper clearly distinguishes:

```ts
type AccessState = {
  authenticated: boolean;
  privyReady?: boolean;
  walletReady?: boolean;
  brainReady?: boolean;
  townHallComplete?: boolean;
  foundsPlotPlayAllowed: boolean;
  realCloverAllowed: boolean;
};
```

The exact type shape may differ, but the semantics must be equivalent.

### 4.5 Acceptance criteria

- Unit test: missing auth input returns `authenticated: false`.
- Unit test: explicit auth true returns Founders Plot play allowed.
- Unit test: auth true + no Brain allows manual play but not Real Clover.
- Playwright test: unauthenticated direct `/app?district=founders-plot&entry=play-first`
  redirects to or shows Start Gate/login, unless the repo intentionally allows demo mode
  behind an explicit flag.

### 4.6 Required tests

Create/update:

```text
tests/v1_4_4_access_fail_closed.test.js
e2e/209_founders_plot_play_first_auth_required.spec.js
```

---

## 5. Work package C — Brain mode policy: Preview Brain vs Real Clover

### 5.1 Problem

The V1.4.4 spec says a free/basic/no-op Brain is not sufficient for full Real Clover in production.

The implementation/test path may use an OpenRouter `:free` model to unlock Clover controls.

That creates a product-truth mismatch.

### 5.2 Required decision

Implement the following mode split:

| Mode | Brain required | May perform AGENT mutations | Production status | Player copy |
|---|---:|---:|---|---|
| Manual Founder Mode | No | No | allowed | “Build manually. Clover guides the basics.” |
| Preview Clover / Test Brain | Test/local or free/basic | No, unless explicitly test-only | dev/test or limited preview | “Preview guidance only.” |
| Real Clover Foreman | Real Brain + runtime ready | Yes, through protected route only | production | “Clover can reason and act with your approval.” |

The production-first Real Brain path is ChatGPT login through the existing `openai-codex`
PKCE/OAuth flow. The old provider/model/API-key Brain setup must remain available as an
advanced alternative, but it should not be the main first-session CTA.

### 5.3 Production rule

In production, a model/provider marked as free/basic/test/no-op must not unlock full Real Clover AGENT mutation controls.

If the product owner later wants to allow specific free models, that must be explicit config, not default behavior:

```text
ALLOW_FREE_REAL_CLOVER=1
```

This flag must default false in production.

### 5.4 Brain quality classifier

Add or harden a simple classifier:

```ts
type BrainQuality = 'none' | 'test' | 'preview' | 'real';
```

Recommended rules:

```text
none: no provider/model/token config
test: test-local, deterministic test brain, mock provider
preview: provider/model configured but model is free/basic/no-op or key is absent
real: provider/model/key/runtime configured and not disallowed by production policy
```

The exact labels may differ, but the state machine must support the policy above.

### 5.5 UI requirements

Manual Founder Mode must say something like:

```text
You can build manually now. Log in with ChatGPT when you want Clover to reason and act.
```

Preview mode must say something like:

```text
Preview guidance only. Real Clover actions require a connected Brain.
```

Real Clover mode may say:

```text
Clover is ready to reason and act through approved tools.
```

Avoid provider jargon in the normal game surface. Detailed provider/model/API-key text belongs inside the Brain sheet, not the default plot view.

### 5.6 Required tests

Create/update:

```text
tests/v1_4_4_brain_quality_policy.test.js
e2e/210_founders_plot_preview_brain_does_not_unlock_real_clover.spec.js
e2e/204_founders_plot_brain_quick_connect.spec.js
```

The test that currently uses a `:free` OpenRouter model should either:

1. run only under test/dev and assert it unlocks **Preview Clover**, not Real Clover; or
2. use a test fixture representing a production-allowed real Brain.

### 5.7 Acceptance criteria

- Production `:free` model does not unlock Real Clover AGENT mutation controls by default.
- Test-local deterministic brain can be used in CI without pretending to be production Real Clover.
- UI copy clearly distinguishes Manual Mode, Preview Guidance, and Real Clover.
- Existing real-LLM Foreman tests still pass when a production-allowed Brain fixture is supplied.

---

## 6. Work package D — Protected Foreman route no-Brain behavior test

### 6.1 Problem

A source-string test is not enough.

The release candidate needs a behavior test that proves the protected Foreman route denies no-Brain mutations
and does not mutate the world.

### 6.2 Required behavior

When a user/session has no Real Brain:

- protected Foreman mutation route returns a friendly guard;
- inventory does not change;
- job/building state does not change;
- no AGENT event is recorded;
- replay/recap do not attribute action to Clover;
- the UI may invite Brain connection, but must not fake the action.

### 6.3 Required server response

Recommended response shape:

```json
{
  "ok": false,
  "error": {
    "code": "BRAIN_REQUIRED",
    "message": "Log in with ChatGPT to let Clover act as your Foreman.",
    "retryable": false
  }
}
```

If the implementation already has an envelope format, use that format but preserve the code and friendly message.

### 6.4 Required tests

Replace/augment the source scan with actual behavior tests:

```text
tests/v1_4_4_foreman_brain_requirement_behavior.test.js
```

If feasible, add route-level integration coverage:

```text
e2e/211_founders_plot_foreman_no_brain_denied_without_mutation.spec.js
```

### 6.5 Suggested test scenario

1. Create/load a plot.
2. Ensure a completed output exists, or create a deterministic state where `collect_outputs` would otherwise be legal.
3. Attempt protected Foreman action without Brain.
4. Assert `BRAIN_REQUIRED`.
5. Reload state.
6. Assert inventory unchanged.
7. Read event log/replay.
8. Assert no AGENT mutation event appears.

### 6.6 Metrics

- `BrainlessForemanMutationDenialRate = 100%`
- `BrainlessInventoryMutationCount = 0`
- `BrainlessAgentEventCount = 0`
- `FriendlyBrainRequiredCopyCoverage = 100%` for player-facing guard surfaces

---

## 7. Work package E — Reformat V1.4.4 docs for LLM readability

### 7.1 Problem

Several V1.4.4 docs are useful but compressed into very long lines.

These docs are intended to be read by LLM implementers and future Codex agents,
so readability is a functional requirement.

### 7.2 Required behavior

Reformat new/updated V1.4.4 docs into normal markdown:

- clear headings;
- short paragraphs;
- bullets and tables where useful;
- valid YAML front matter if used;
- no giant one-line sections;
- stable file names and paths.

### 7.3 Required files to inspect

At minimum:

```text
specs/39_founders_plot_v1_4_4_play_first_onboarding.md
specs/40_founders_plot_v1_4_4_play_first_onboarding_tdd_matrix.md
docs/product/PLAY_FIRST_ONBOARDING_LADDER_V1_4_4.md
AGENTS.md
Brand kit/guidelines/agent-town-design-pack/BRAND.md
Brand kit/guidelines/agent-town-design-pack/DESIGN.md
Brand kit/guidelines/agent-town-design-pack/GAME_UX.md
Brand kit/guidelines/agent-town-design-pack/REGISTRY.md
public/experiences/founders-plot/skill.md
public/experiences/founders-plot/heartbeat.md
public/experiences/founders-plot/tools.md
public/experiences/founders-plot/goals.md
```

### 7.4 Acceptance criteria

- No newly created/updated V1.4.4 doc has extremely long markdown lines except code blocks, JSON examples, URLs, or generated hashes.
- YAML front matter parses if present.
- Tables remain readable.
- The docs clearly state:
  - Play Now;
  - Manual Founder Mode;
  - Connect Brain;
  - Real Clover;
  - Visit Town Hall later.

### 7.5 Required test

Create/update:

```text
tests/v1_4_4_markdown_readability.test.js
```

Recommended thresholds:

```text
max normal prose line length: 180 chars
exceptions: fenced code blocks, URLs, hashes, JSON fixtures
max consecutive non-empty lines without heading/bullet/table break: 12
```

Do not make this too brittle; it is a guardrail against one-line docs, not a typography lint crusade.

---

## 8. Release-candidate non-regression requirements

The cleanup patch must preserve:

- Founders Plot manual play path;
- V1.4.3 app-wide asset refresh behavior;
- Founders Plot mobile calmness;
- HQ progression readability;
- AI reality / real Foreman path when a valid Brain is supplied;
- debug boundary: normal player routes hide debug chrome; explicit debug route shows it;
- owner-approved `AI SLOP` copy;
- Privy production positioning.

---

## 9. Required commands / validation

Run the repo’s normal checks plus targeted tests.

Minimum targeted tests:

```bash
node --test \
  tests/v1_4_4_access_fail_closed.test.js \
  tests/v1_4_4_brain_quality_policy.test.js \
  tests/v1_4_4_foreman_brain_requirement_behavior.test.js \
  tests/v1_4_4_markdown_readability.test.js

npx playwright test \
  e2e/208_founders_plot_start_gate_privy_play_first.spec.js \
  e2e/209_founders_plot_play_first_auth_required.spec.js \
  e2e/210_founders_plot_preview_brain_does_not_unlock_real_clover.spec.js \
  e2e/211_founders_plot_foreman_no_brain_denied_without_mutation.spec.js
```

If file names differ, the implementation report must map the equivalent tests.

Also rerun the already-existing V1.4.4 tests:

```bash
npx playwright test \
  e2e/201_founders_plot_play_first_entry.spec.js \
  e2e/202_founders_plot_manual_mode_first_loop.spec.js \
  e2e/203_founders_plot_real_clover_requires_brain.spec.js \
  e2e/204_founders_plot_brain_quick_connect.spec.js \
  e2e/205_founders_plot_brain_cta_timing.spec.js \
  e2e/206_founders_plot_townhall_deferred_nonblocking.spec.js \
  e2e/207_founders_plot_townhall_full_onboarding_still_available.spec.js
```

Run broader suite if feasible. If not feasible, state why and list exact commands for CI.

---

## 10. Definition of done

This cleanup patch is done when:

- Start Gate / Privy/test-auth path proves play-first Founders Plot entry.
- Unknown auth fails closed.
- Manual Founder Mode works without Brain.
- Preview/test/free Brain does not unlock production Real Clover AGENT mutation controls.
- Real Clover works only with an allowed real Brain/runtime path.
- Protected Foreman route without Brain returns `BRAIN_REQUIRED`, mutates nothing, and logs no AGENT action.
- V1.4.4 docs are readable by humans and LLM implementers.
- Existing V1.4.4 play-first tests still pass.
- No new gameplay systems or visual asset passes are introduced.

---

## 11. Implementation report template

The final team report must include:

```md
# V1.4.4 Cleanup Patch Implementation Report

## Summary

## Files changed

## Start Gate / Privy proof

## Access helper fail-closed changes

## Brain mode policy decision implemented

## Foreman no-Brain route behavior proof

## Docs reformatted

## Tests added/updated

## Commands run and results

## Screenshots updated, if any

## Known limitations

## Confirmation of non-goals
- no new gameplay systems
- no persistent/off-session Foreman
- no new image-generation pass
- no V1.5 content
```

---

## 12. Machine-readable summary

## 12.1 RC route and ceremony hotfix note

QA found one production-path blocker after the cleanup branch reached commit `0f25a8f`.

Observed behavior:

```text
/app?district=house briefly opened Plan Wagons,
then downgraded into the Town Hall/onboarding shell with step 4 active.
```

The regenerated standalone route at `/views/house.html` rendered correctly, so this was a state-gating bug rather than an asset or view bug.

Required RC truth:

- Once `houseId` exists, onboarding is complete even if a stale explicit `onboarding.step` still says `ceremony`.
- The server and app shell must both derive `done` before honoring stale ceremony state.
- The ceremony client must send `keyWrapSig` to `/api/house/init` for real Privy/Solana wallet users.
- The ceremony key-wrap signature message must match the server-verifiable recovery message:

```text
ElizaTown House Key Wrap
houseId: <houseId>
```

Do not include the current browser origin in the primary ceremony key-wrap signature.
Origin fallback remains only for legacy recovery attempts on the house page.

Regression coverage:

- `e2e/120_onboarding_privy_required.spec.js` includes the stale-ceremony direct-house route case.
- `e2e/38_phase1_create_ceremony_regression.spec.js` asserts that `/api/house/init` includes `keyWrapSig`.
- The same test asserts that the signed key-wrap message has no `origin:` line.

## 12.2 Incognito-safe RC verification addendum

QA later found that manual `/app?district=house` checks can be misleading when run in a normal browser window.
Old `et_session` cookies or local browser state can make the route look valid even when a clean browser has no completed house session.

Required verification rule:

- A clean incognito browser with no completed house session should redirect `/app?district=house` to Start Gate.
- A clean isolated browser may prove post-house continuity only after it creates or seeds a house in that same isolated context.
- The accepted deterministic seed path is:

```text
new empty browser context
seed/create recoverable test house through the context-owned session
open /app?district=house
reload /app?district=house
force stale onboarding.step = ceremony in /api/state
verify Plan Wagons/House remains open
```

Regression coverage:

- `e2e/213_rc_incognito_house_route_verification.spec.js` proves the clean no-session redirect.
- The same test proves the clean seeded-house route, reload, and stale-ceremony route truth.

## 12.3 ChatGPT allocation and Codex app-server bridge

The ChatGPT-first Brain flow now includes a Clover game budget before Clover spends subscription-backed LLM turns.

Required product truth:

- “Log in with ChatGPT” remains the primary Brain CTA.
- The old provider/API-key Brain setup remains available under “Use another brain.”
- Users can set a 5-hour and weekly percentage allocation for Founders Plot.
- Portal reads live Codex app-server limits through `/api/agent/lite/codex/rate-limits`, which calls `account/rateLimits/read` on the local `codex app-server`.
- The bridge exposes sanitized quota fields only; no account email, OAuth token, refresh token, or raw app-server output may be returned to the browser.
- OpenClaw Lite enforces the local game allocation before a Clover LLM turn.
- If Codex app-server is unavailable or the user is not logged in, the UI shows recovery guidance and keeps enforcing local budget tracking.

Regression coverage:

- `e2e/215_founders_plot_codex_budget.spec.js` proves bridge-backed UI rendering, allocation persistence, failure fallback, and pre-LLM budget blocking.
- `e2e/214_founders_plot_chatgpt_brain_login.spec.js` keeps the ChatGPT CTA/login persistence contract covered.
- `e2e/204_founders_plot_brain_quick_connect_unlocks_real_clover.spec.js` keeps the alternative provider path available and preview-only.

```yaml
spec_id: 41_founders_plot_v1_4_4_play_first_onboarding_cleanup
version: v1.4.4-cleanup
branch_target: codex/founders-plot-v1-4-4-play-first-onboarding
commit_reviewed: 9634056
scope: cleanup_patch
must_fix:
  - start_gate_privy_play_first_e2e
  - agent_town_access_fail_closed
  - free_preview_brain_not_real_clover
  - protected_foreman_no_brain_behavior_test
  - markdown_readability_reformat
  - stale_ceremony_house_route_done_truth
  - ceremony_house_init_key_wrap_signature
  - incognito_safe_house_route_verification
non_goals:
  - new_gameplay_systems
  - persistent_foreman
  - doctrine_board
  - specialist_agents
  - new_visual_asset_pass
  - v1_5_content
key_modes:
  manual_founder:
    brain_required: false
    agent_mutations_allowed: false
  preview_clover:
    brain_required: test_or_free_or_basic
    agent_mutations_allowed: false_in_production
  real_clover:
    brain_required: real
    agent_mutations_allowed: true_through_protected_route
release_gate: all_targeted_tests_green_and_docs_readable
```
