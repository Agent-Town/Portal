# Phase 6 Spec: Experience Preference Presets + Localized Onboarding (TDD)

Status: Draft  
Version: 1.0  
Audience: AI agent developers, runtime engineers, frontend engineers, backend engineers, security engineers, QA automation engineers, UX engineers  
Goal: introduce an early user-selected language/preference path that adapts onboarding, provider recommendations, copy, media, and agent guidance without forking the product into separate app flows.

Implementation constraints:

1. Keep one shared co-op state machine for all users.
2. Keep worker-first architecture. Agent reasoning remains in the browser worker/runtime.
3. Keep modal-first UX so worker continuity is preserved.
4. Keep wallet-first identity and Team Code routing unchanged.
5. Keep deterministic Playwright verification for every new capability.
6. Do not rely on IP geolocation or hidden market inference as the authoritative source of user preference.
7. The user's explicit choice is authoritative until the user changes it.

## 1. Executive Summary

This phase adds a generic `experiencePreference` framework.

It is not a one-off "China mode".

It is a reusable profile system that allows the product to adapt:

1. language,
2. market/network assumptions,
3. provider recommendations,
4. media fallbacks,
5. social/share wording,
6. worker guidance.

The first two required presets are:

1. `global-default`
2. `cn-mainland`

The framework must preserve the existing product flow:

1. same onboarding steps,
2. same co-op logic,
3. same wallet and Team Code model,
4. same modal navigation model,
5. same agent runtime continuity.

Only recommendations, copy, media choices, and policy hints should change per preset.

## 2. Product Goals By Discipline

## 2.1 AI Agent Creators

1. The worker must know the chosen preference path through explicit runtime context.
2. The worker must respond in the chosen language by default.
3. The worker must avoid recommending blocked or discouraged services when the active preset says not to.
4. Agent behavior must remain deterministic and inspectable through existing debug surfaces.

## 2.2 UI/UX

1. The user chooses the path early on `/start`.
2. The choice must be understandable in one glance and require no settings page.
3. First-run onboarding copy must match the chosen language path.
4. The current global experience must remain available with minimal additional clutter.

## 2.3 Benchmarking and Evaluation

1. Recommendation behavior must be measurable, not subjective.
2. Copy coverage for first-run surfaces must be testable.
3. Worker prompt/runtime conditioning must be inspectable and testable.
4. "China-friendly" must mean observable behavior changes, not marketing copy only.

## 2.4 Skill and Tools

1. `public/skill.md` must document the new preference-aware behavior.
2. Worker prompt/runtime context must carry the preference object explicitly.
3. Skill contract tests must assert the new behavior.

## 2.5 Blockchain and Cybersecurity

1. Wallet-first identity must remain unchanged.
2. Preference selection must not expose Team Code or credential values.
3. Preference logic must not create alternate auth/session models.
4. Remote media fallback choices must not silently introduce new third-party dependencies for restricted markets.

## 2.6 Software Architecture

1. Avoid duplicate provider catalogs and duplicate copy logic.
2. Avoid region-specific branches inside core business logic where a data-driven preset can express the same behavior.
3. Keep shared state canonical on the server session and mirrored locally only for bootstrapping.

## 3. Non-Goals

1. No separate site or separate route tree for Chinese users.
2. No backend-side geo-routing to force a preset.
3. No change to wallet verification, sigil matching, ceremony, or unlock rules.
4. No replacement of OpenClaw Lite runtime architecture.
5. No new external identity provider.

## 4. Current Gaps

Current product limitations relevant to this phase:

1. The start page assumes one English-first experience.
2. Copy is hardcoded across HTML and JS runtime status strings.
3. Provider catalog logic is duplicated between `public/app.js` and `public/house.js`.
4. Start-page media assumes one external embed path.
5. Share UI uses X-specific wording for the human post path.
6. Worker runtime context does not carry a user-selected language/market preference.

## 5. Target Architecture

## 5.1 Experience Preference Model

Add one canonical session field:

```json
{
  "experiencePreference": {
    "presetId": "global-default",
    "locale": "en",
    "market": "global",
    "providerPolicy": "global-default",
    "sharePolicy": "x-moltbook",
    "mediaPolicy": "youtube",
    "agentPolicy": "default",
    "selectedAt": "2026-03-09T00:00:00.000Z",
    "source": "user"
  }
}
```

Rules:

1. This field is orthogonal to `onboarding`.
2. `onboarding` remains progress state.
3. `experiencePreference` remains presentation/recommendation policy state.

## 5.2 Preset Registry

Add one shared preset registry boundary.

Recommended file:

- `public/experience_profiles.js`

Required registry properties per preset:

1. `id`
2. `label`
3. `locale`
4. `market`
5. `copyNamespace`
6. `providerPolicy`
7. `mediaPolicy`
8. `sharePolicy`
9. `agentPolicy`

Required initial presets:

1. `global-default`
2. `cn-mainland`

## 5.3 Preference Resolution Precedence

Preference resolution MUST use the following precedence:

1. explicit choice in the current UI action,
2. persisted server session preference,
3. persisted local client preference,
4. optional browser-language suggestion only,
5. server default preset.

Rules:

1. Browser language may suggest but must not silently lock the user into a preset.
2. IP/geolocation may inform analytics but must not override explicit choice.
3. Switching presets must not reset wallet, Team Code, or onboarding progress.

## 5.4 Start-Page Chooser

`/start` must render an early preference chooser before or alongside the existing enter action.

Minimum choices:

1. `English / Global`
2. `简体中文 / Mainland-friendly`

Rules:

1. First-time users without a stored preference must see the chooser.
2. Returning users with a stored or session preference may skip directly if current auto-skip rules otherwise allow it.
3. The start page must persist the chosen preference locally before auth.

## 5.5 Shared Copy And Localization Layer

Add one shared localization boundary.

Recommended file:

- `public/i18n.js`

Required capabilities:

1. resolve template text by key,
2. resolve runtime JS status text by key,
3. support preset-aware overrides,
4. fall back deterministically to English when a key is missing.

Localization scope for this phase:

1. start page,
2. Town Hall onboarding,
3. Brain configuration,
4. Sigil test,
5. house share labels and errors,
6. key onboarding/gating status text in JS.

## 5.6 Shared Provider Catalog

Provider metadata must be centralized.

Recommended file:

- `public/llm_catalog.js`

This module becomes the only authoritative source for:

1. provider list,
2. provider aliases,
3. model lists,
4. default model selection,
5. preset-specific recommendation ranking,
6. provider warnings per preset.

Rules:

1. `public/app.js` and `public/house.js` must consume this shared catalog.
2. Duplicate static provider maps in those files must be removed.

## 5.7 Media Policy

Start-page hero media must become preset-driven.

Rules:

1. `global-default` may keep current behavior.
2. `cn-mainland` must not depend on the blocked external embed path for the hero.
3. Mainland-safe media must be a local asset or a same-origin-served asset.

## 5.8 Share Policy

The share system must support preset-aware wording without changing co-op logic.

Phase 1 requirements:

1. Keep existing APIs compatible.
2. Make human-post wording generic where required by preset.
3. Do not require X-specific wording under `cn-mainland`.

Phase 2 requirements:

1. Generalize human/agent post contract fields if needed.
2. Keep backward compatibility with stored share records.

## 5.9 Worker Runtime Context

Extend worker runtime context with:

```json
{
  "experiencePreference": {
    "presetId": "cn-mainland",
    "locale": "zh-CN",
    "market": "cn-mainland",
    "providerPolicy": "cn-mainland",
    "sharePolicy": "link-first",
    "agentPolicy": "avoid-blocked-services"
  }
}
```

Rules:

1. Worker should prefer the selected language for human-facing output.
2. Worker should avoid discouraged services unless the user explicitly asks for them.
3. Worker must still use the same shared state machine and tool surface.

## 5.10 Skill Contract

`public/skill.md` must gain explicit instructions:

1. honor `runtimeContext.experiencePreference.locale` for human-facing language,
2. honor `runtimeContext.experiencePreference.providerPolicy` for recommendations,
3. do not re-ask for language or market when runtime context already provides it,
4. do not recommend blocked/discouraged services by default under constrained presets.

## 5.11 Session Context Observability

The active preference must be visible in existing debug/inspection surfaces:

1. Session Context tab,
2. runtime session context APIs used by tests,
3. worker prompt preview or equivalent skill/runtime inspection surface.

## 6. API Contract Changes

## 6.1 GET `/api/experience/bootstrap`

Purpose:

1. return available presets,
2. return server default preset,
3. return current session preference if present.

Response:

```json
{
  "ok": true,
  "defaultPresetId": "global-default",
  "current": {
    "presetId": "global-default",
    "locale": "en",
    "market": "global"
  },
  "presets": [
    {
      "id": "global-default",
      "label": "English / Global",
      "locale": "en",
      "market": "global"
    },
    {
      "id": "cn-mainland",
      "label": "简体中文 / Mainland-friendly",
      "locale": "zh-CN",
      "market": "cn-mainland"
    }
  ]
}
```

## 6.2 POST `/api/experience/preference`

Purpose:

1. persist an explicit user choice into session.

Request:

```json
{
  "presetId": "cn-mainland"
}
```

Success response:

```json
{
  "ok": true,
  "experiencePreference": {
    "presetId": "cn-mainland",
    "locale": "zh-CN",
    "market": "cn-mainland",
    "providerPolicy": "cn-mainland",
    "sharePolicy": "link-first",
    "mediaPolicy": "mainland-safe",
    "agentPolicy": "avoid-blocked-services"
  }
}
```

Error codes:

1. `MISSING_PRESET_ID`
2. `INVALID_PRESET_ID`

## 6.3 Existing Endpoint Extensions

The following responses must include the current `experiencePreference`:

1. `/api/state`
2. `/api/onboarding/status`
3. any house/onboarding bootstrap response that already carries session-facing onboarding state

## 7. Security And Integrity Rules

1. Preference selection must never expose Team Code as a visible requirement.
2. Preference APIs must not store API keys, wallet identifiers, or OAuth tokens.
3. Preference change must not rotate session identity.
4. Preference change must not unlock or bypass any gated co-op action.
5. Mainland-safe media must be same-origin or bundled; do not add opaque third-party fallbacks.
6. Worker traffic and session context must show preference metadata without leaking secrets.

## 8. Delivery Plan (Strict Red -> Green -> Refactor)

## M0 - Registry + Persistence Skeleton

Goal:

1. establish canonical preset registry and storage without changing visible behavior beyond a minimal chooser.

Deliver:

1. shared preset registry,
2. local preference storage helpers,
3. session field skeleton,
4. bootstrap + persist API routes,
5. test harness coverage.

Exit criteria:

1. preference can be saved and read deterministically,
2. no onboarding logic regression.

## M1 - Start Page Preference Choice

Goal:

1. require or surface explicit preset selection on first run.

Deliver:

1. chooser UI on `/start`,
2. preference-aware auto-skip behavior,
3. English/global and Chinese/mainland labels.

Exit criteria:

1. first-time users can choose a preset,
2. returning users can still auto-skip when appropriate.

## M2 - Shared Copy Layer For First-Run Surfaces

Goal:

1. translate first-run surfaces without changing flow logic.

Deliver:

1. shared i18n resolver,
2. localized copy for start, Town Hall, Brain, Sigil, share labels,
3. deterministic fallback behavior.

Exit criteria:

1. `cn-mainland` renders target Chinese strings on required surfaces,
2. `global-default` remains English.

## M3 - Shared Provider Catalog + Recommendation Policies

Goal:

1. centralize provider metadata and make recommendations preset-aware.

Deliver:

1. shared provider catalog,
2. removal of duplicate provider maps,
3. preset-aware defaults and warnings.

Exit criteria:

1. app and house use the same provider ordering and defaults for a given preset.

## M4 - Mainland-Safe Media + Share Wording

Goal:

1. remove blocked-service assumptions from the mainland preset without changing the share data model yet.

Deliver:

1. preset-driven start hero media,
2. generic human post wording under mainland preset,
3. continued compatibility with existing share APIs.

Exit criteria:

1. mainland preset uses same-origin media,
2. share UI no longer hardcodes X in that preset.

## M5 - Worker + Skill Preference Awareness

Goal:

1. make the agent adapt to the selected preset deterministically.

Deliver:

1. runtime context extension,
2. skill contract update,
3. prompt/runtime context tests.

Exit criteria:

1. worker prompt/runtime context explicitly carries the preference,
2. agent guidance changes are visible and testable.

## M6 - Contract, Docs, And Guardrails

Goal:

1. lock the system down with docs and regression guards.

Deliver:

1. `specs/02_api_contract.md` updates,
2. `public/skill.md` update,
3. `docs/internal-skill-testline.md` update,
4. guard tests for shared catalog and preference observability.

Exit criteria:

1. full suite green,
2. docs reflect actual implemented behavior.

## 9. Deterministic Playwright Test Matrix

Use ID prefix `XP`.

## XP-001 - First visit requires visible preset choice

- File: `e2e/119_start_page_preference_choice.spec.js`
- Goal: user must be able to choose a preset before entering the app on first visit.
- Setup: no stored preference, Privy start page enabled.
- Assertions:
  - start page shows both preset choices,
  - `Enter` is disabled or blocked until one preset is chosen,
  - choosing a preset enables entry.

## XP-002 - Preference choice persists locally before app entry

- File: `e2e/119_start_page_preference_choice.spec.js`
- Goal: preset is written locally on selection.
- Assertions:
  - after choosing `cn-mainland`, localStorage contains `agentTown:experiencePreset = cn-mainland`,
  - locale and market keys are also persisted.

## XP-003 - Returning user without stored preference does not auto-skip chooser

- File: `e2e/120_start_page_preference_autoskip.spec.js`
- Goal: current auto-skip no longer bypasses the chooser when preference is missing.
- Setup: authenticated session, no stored preference.
- Assertions:
  - visiting `/start` remains on `/start`,
  - chooser is visible,
  - app does not redirect to `/app` automatically.

## XP-004 - Returning user with stored preference still auto-skips

- File: `e2e/120_start_page_preference_autoskip.spec.js`
- Goal: returning behavior stays fast when preference already exists.
- Setup: authenticated session, stored preset exists, onboarding state otherwise skippable.
- Assertions:
  - visiting `/start` redirects to `/app`,
  - app state reflects the stored preset.

## XP-005 - Global preset preserves current landing behavior

- File: `e2e/121_global_preset_preserves_current_path.spec.js`
- Goal: `global-default` behaves like the current product.
- Assertions:
  - landing title remains English,
  - start hero uses the current global media policy,
  - brain defaults match the current default provider/model policy unless changed elsewhere intentionally.

## XP-006 - Mainland preset renders Chinese first-run copy

- File: `e2e/122_mainland_preset_localization.spec.js`
- Goal: required onboarding surfaces switch to Simplified Chinese.
- Setup: choose `cn-mainland`.
- Assertions:
  - start page key text is Chinese,
  - Town Hall gate hint or onboarding heading is Chinese,
  - Brain modal heading/help text is Chinese,
  - Sigil test heading or helper text is Chinese.

## XP-007 - Missing translation key falls back deterministically to English

- File: `e2e/122_mainland_preset_localization.spec.js`
- Goal: localization failures are visible and safe.
- Setup: simulate one missing translation key.
- Assertions:
  - UI renders English fallback for that key,
  - no raw placeholder token or `undefined` appears.

## XP-008 - Mainland preset uses same-origin hero media

- File: `e2e/123_mainland_media_policy.spec.js`
- Goal: mainland-safe preset avoids blocked external embed path.
- Assertions:
  - start page does not render the YouTube iframe under `cn-mainland`,
  - start page renders a same-origin image/video/poster asset instead.

## XP-009 - Preference persists to session and echoes in `/api/state`

- File: `e2e/124_experience_preference_api.spec.js`
- Goal: server session is authoritative after selection.
- Assertions:
  - `POST /api/experience/preference` returns normalized preference payload,
  - subsequent `/api/state` includes the same `experiencePreference`,
  - session preference survives page reload.

## XP-010 - Invalid preset is rejected deterministically

- File: `e2e/124_experience_preference_api.spec.js`
- Goal: invalid input cannot silently create partial state.
- Assertions:
  - posting unknown preset returns `400`,
  - error code is `INVALID_PRESET_ID`,
  - existing valid preference remains unchanged.

## XP-011 - App brain recommendations are preset-aware

- File: `e2e/125_preference_provider_recommendations.spec.js`
- Goal: provider defaults and ordering change by preset.
- Setup: choose `cn-mainland`.
- Assertions:
  - `llmProviderSelect` defaults to the mainland-safe default,
  - first recommended options are mainland-safe providers,
  - discouraged providers remain selectable but are not first.

## XP-012 - House mind panel matches app provider policy

- File: `e2e/125_preference_provider_recommendations.spec.js`
- Goal: `/app` and `/house` use the same provider catalog and recommendation behavior.
- Assertions:
  - app and house render the same provider ordering for the same preset,
  - app and house render the same default provider/model for the same preset.

## XP-013 - Mainland preset warns on manual OpenAI selection

- File: `e2e/125_preference_provider_recommendations.spec.js`
- Goal: discouraged provider choice is explicit and measurable.
- Setup: mainland preset, manually select `openai` or `openai-codex`.
- Assertions:
  - a warning message appears,
  - warning explains the provider is discouraged for the active preset,
  - selection is still allowed.

## XP-014 - Share UI wording becomes generic under mainland preset

- File: `e2e/126_preference_share_policy.spec.js`
- Goal: UI no longer hardcodes X wording in the mainland-safe path.
- Assertions:
  - share field label is generic, not `Human X post`,
  - validation text is generic URL wording,
  - share save still succeeds with a valid URL.

## XP-015 - Global preset retains current share wording

- File: `e2e/126_preference_share_policy.spec.js`
- Goal: current global path remains intact.
- Assertions:
  - global preset continues to show current X-oriented wording unless intentionally changed in a later phase,
  - existing fallback tests still pass.

## XP-016 - Worker runtime context carries active preference

- File: `e2e/127_worker_preference_runtime_context.spec.js`
- Goal: worker receives explicit preference metadata.
- Assertions:
  - runtime session context includes `experiencePreference`,
  - `presetId`, `locale`, and `market` match the selected preset.

## XP-017 - System prompt / skill guidance includes preference policy

- File: `e2e/127_worker_preference_runtime_context.spec.js`
- Goal: agent guidance is conditioned by the preference in a measurable way.
- Assertions:
  - prompt preview or skill context includes the selected locale,
  - prompt preview or skill context includes policy guidance not to re-ask for language when provided,
  - mainland preset guidance includes blocked-service avoidance language.

## XP-018 - Session Context tab exposes active preference

- File: `e2e/128_preference_session_context_visibility.spec.js`
- Goal: builders can inspect the active preset in-app.
- Assertions:
  - Session Context tab renders `presetId`,
  - Session Context tab renders `locale`,
  - values match the current session selection.

## XP-019 - Onboarding state machine remains unchanged across presets

- File: `e2e/129_preference_onboarding_state_machine.spec.js`
- Goal: presets do not fork the core flow.
- Assertions:
  - both presets progress through the same onboarding step sequence,
  - same gating reasons appear in the same order,
  - only copy/recommendation/media differ.

## XP-020 - Shared provider catalog is authoritative

- File: `e2e/130_preference_catalog_guard.spec.js`
- Goal: no regression back to duplicated provider maps.
- Assertions:
  - guard test verifies provider catalog is sourced from one shared module,
  - `public/app.js` and `public/house.js` no longer declare independent static provider-model maps.

## XP-021 - Skill contract is updated for preference-aware behavior

- File: `e2e/131_preference_skill_contract.spec.js`
- Goal: worker-facing contract stays explicit and testable.
- Assertions:
  - `public/skill.md` contains preference-aware guidance,
  - contract text explicitly references runtime preference context,
  - guidance says not to re-ask for language when already provided.

## 10. Measurable Evaluation Criteria

These criteria are implementation gates, not aspirational metrics.

## 10.1 Preference Selection Eval

Success condition:

1. A first-time user can select a preset and enter the app in one visible interaction flow.

Measured by:

1. `XP-001`
2. `XP-002`
3. `XP-003`
4. `XP-004`

## 10.2 Localization Coverage Eval

Success condition:

1. Required first-run surfaces render the chosen language without raw placeholders.

Measured by:

1. `XP-006`
2. `XP-007`

## 10.3 Provider Recommendation Eval

Success condition:

1. Defaults and ordering are changed by preset and consistent between app and house.

Measured by:

1. `XP-011`
2. `XP-012`
3. `XP-013`
4. `XP-020`

## 10.4 Mainland-Safe Reachability Eval

Success condition:

1. Mainland preset avoids the blocked hero dependency and avoids X-first wording in required surfaces.

Measured by:

1. `XP-008`
2. `XP-014`

## 10.5 Agent Conditioning Eval

Success condition:

1. Worker can inspect and act on the chosen preset through explicit runtime context.

Measured by:

1. `XP-016`
2. `XP-017`
3. `XP-018`
4. `XP-021`

## 10.6 Core Flow Integrity Eval

Success condition:

1. Global preset remains stable and core onboarding logic is unchanged.

Measured by:

1. `XP-005`
2. `XP-015`
3. `XP-019`

## 11. Required Docs And Contract Updates

When this phase is implemented, update:

1. `specs/02_api_contract.md`
2. `public/skill.md`
3. `docs/internal-skill-testline.md`
4. provider docs under `docs/providers/`
5. start/onboarding help docs where current recommendation text assumes one universal path

## 12. Definition Of Done

This phase is done only when:

1. all new `XP-*` tests pass,
2. existing onboarding/share/brain regressions remain green,
3. `experiencePreference` is persisted in session and visible in runtime/session inspection,
4. `global-default` preserves the current product path,
5. `cn-mainland` measurably changes copy, provider recommendations, and media/share policy without changing the underlying co-op logic.
