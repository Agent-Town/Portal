# Language Path And Preference Framework

Date: 2026-03-09

## Goal

Add an early user choice on the website that lets the product adapt onboarding, provider recommendations, copy, media, and sharing behavior without forking the app into separate country-specific codepaths.

The right abstraction is not "China mode".

The right abstraction is an `experience preference` or `experience preset` that can encode:

- display language
- market/network assumptions
- recommended provider strategy
- media fallback policy
- share/social policy
- agent guidance policy

The first two presets can be:

- `global-default`: current experience
- `cn-mainland`: simplified Chinese, mainland-safe recommendations

That keeps the current path intact while making the China-friendly path a data-driven profile instead of a special-case branch.

## Recommendation

Do not overload the old "path" storage.

`PATH_STORAGE_KEY` in `public/app.js` and `public/house.js` is effectively pinned to `coop`. It is a legacy flow-role artifact, not a good fit for language or market preferences. Reusing it will make the meaning of "path" ambiguous.

Instead:

- add a new `experiencePreference` object to session state
- mirror it in localStorage for pre-auth/start-page use
- pass it into runtime context so the worker can adapt recommendations and language

## Proposed Data Model

### Session shape

Add a new top-level session field in `server/sessions.js`:

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

### Client storage

Add new localStorage keys:

- `agentTown:experiencePreset`
- `agentTown:locale`
- `agentTown:market`

These should be written on the start page before auth and then reconciled with the server session after `/app` loads.

### Preset registry

Add a shared registry module, for example:

- `public/experience_profiles.js`

Each preset should be declarative:

```js
{
  id: 'cn-mainland',
  label: '简体中文',
  locale: 'zh-CN',
  market: 'cn-mainland',
  providerPolicy: {
    recommended: ['qwen', 'glm', 'moonshot', 'kimi-coding', 'minimax', 'ollama'],
    discouraged: ['openai', 'openai-codex'],
    defaultProvider: 'qwen',
    defaultModel: 'coder-model'
  },
  mediaPolicy: {
    startHero: 'local-poster-or-mp4'
  },
  sharePolicy: {
    humanPostLabel: 'Public post URL',
    humanPostPlaceholder: 'https://...',
    xFirst: false
  },
  copyNamespace: 'zh-CN',
  agentPolicy: {
    avoidBlockedServicesByDefault: true
  }
}
```

## Concrete Code Changes

## 1. Start Page Choice

### Files

- `public/start.html`
- `public/start.js`
- `e2e/31_start_page.spec.js`
- `e2e/32_start_page_privy_email_code_ui.spec.js`
- `e2e/33_start_page_privy_invalid_native_app_id.spec.js`
- `e2e/34_start_page_privy_wallet_option.spec.js`
- `e2e/38_start_page_auth_modal_prime.spec.js`
- `e2e/39_start_page_auth_modal_retry_on_error.spec.js`
- `e2e/40_start_page_auth_retry_rearms_email.spec.js`
- `e2e/41_start_page_does_not_block_on_wallet_create.spec.js`
- `e2e/42_start_page_skip_otp_when_already_signed_in.spec.js`

### What changes

`public/start.html` currently assumes one English path and a single CTA.

Change the start page so the user picks a preset before entering:

- `English / Global`
- `简体中文 / Mainland-friendly`

This should happen before or alongside the existing `Enter` action, not after the user is deep in onboarding.

`public/start.js` should:

- load the preset registry
- persist the chosen preset locally before auth
- include the preference when entering the app
- stop auto-skipping directly into `/app` unless a preference already exists

### Recommended flow

1. User lands on `/start`.
2. User chooses language/preset.
3. App stores the choice locally.
4. `handleEnter()` authenticates as today.
5. `/app` syncs the choice to session state.

### Important detail

`maybeAutoSkipStart()` currently jumps returning users into `/app` based on onboarding state. That should become preference-aware:

- if a preference already exists locally or in session, keep auto-skip
- if no preference exists, do not skip the chooser

## 2. Shared Copy And Template Localization

### Files

- `public/index.html`
- `public/start.html`
- `public/create.html`
- `public/house.html`
- `public/claim-wallet.html`
- `public/views/brain.html`
- `public/views/house.html`
- `public/views/townhall.html`
- `public/views/sigil.html`
- `public/views/leaderboard.html`
- `public/app.js`
- `public/start.js`
- `public/create.js`
- `public/house.js`

### What changes

Today the UI text is hardcoded across HTML partials and JS status/error strings.

That is the main blocker to supporting multiple languages or preset-specific wording cleanly.

Add a shared translation layer, for example:

- `public/i18n.js`

This should support:

- static text in HTML via `data-i18n`
- runtime status/error strings via `t('key')`
- preset-specific overrides

### Why this matters

The current onboarding copy is duplicated across:

- shell pages
- modal views loaded dynamically
- runtime-generated status text in `public/app.js`, `public/start.js`, `public/house.js`, and `public/create.js`

If you only translate templates and not JS strings, the user will still hit English during wallet errors, gate hints, OAuth messages, and share errors.

## 3. Provider Recommendation Framework

### Files

- `public/app.js`
- `public/house.js`
- `public/views/brain.html`
- `docs/which-provider.md`
- `docs/providers/README.md`
- provider-specific docs under `docs/providers/`

### What changes

Provider/model catalog logic is duplicated today:

- `LLM_MODEL_OPTIONS_BY_PROVIDER` in `public/app.js`
- `MIND_MODEL_OPTIONS_BY_PROVIDER` in `public/house.js`

That duplication must be removed before adding preset-driven recommendations.

### Recommended refactor

Create a shared module, for example:

- `public/llm_catalog.js`

It should own:

- provider list
- model list
- aliases
- default model selection
- optional provider metadata
- preset-specific recommendation ranking

Then let both `/app` and `/house` import the same provider catalog.

### Behavior change for presets

Keep the full provider list available, but change:

- display ordering
- default provider/model
- warning copy
- help text

For `cn-mainland`:

- recommend `qwen`, `glm`, `moonshot`, `kimi-coding`, `minimax`, `ollama`
- do not make `openai-codex` the default for mainland-friendly provider recommendations, except on explicitly ChatGPT-first Brain connection surfaces
- show a preset-aware warning when the user manually chooses OpenAI providers

This keeps the current path intact while making the recommended path adaptive.

## 4. Media Policy On Start Page

### Files

- `public/start.html`
- `public/start.js`

### What changes

The current start page uses a YouTube iframe as the hero media.

That should become policy-driven:

- `global-default`: current embedded video can remain
- `cn-mainland`: use local poster, GIF, or local MP4 fallback

This should be part of the preset registry, not hardcoded in the page.

## 5. Share Policy And Social Labels

### Files

- `public/house.html`
- `public/house.js`
- `server/index.js`
- `specs/02_api_contract.md`
- `e2e/54_share_links_x_only_fallback.spec.js`
- `e2e/60_human_posts_share_auth.spec.js`

### What changes

The current share UI is X-specific in the human field and Moltbook-specific in the agent field.

That is too narrow for a generic language/preference framework.

### Recommended approach

Phase 1:

- keep the existing API fields for compatibility
- make the UI label and placeholder profile-driven
- in `cn-mainland`, use neutral wording like `Public post URL`

Phase 2:

- generalize the API contract from `xPostUrl` to something like:
  - `humanPostUrl`
  - `humanPostPlatform`
  - `agentPostUrl`
  - `agentPostPlatform`
- maintain backward compatibility in `server/index.js`

### Why phase this

The UI can be made generic quickly.

The API rename touches persistence, share serialization, contract docs, and tests, so it is a broader migration.

## 6. Worker And Agent Awareness

### Files

- `public/app.js`
- `public/create.js`
- `vendors/openclaw-lite-main/src/openclaw-lite/worker.js`
- `public/skill.md`
- `e2e/55_phase3_skill_contract_line.spec.js`
- `e2e/56_phase3_skill_visit_worker.spec.js`
- `e2e/58_phase3_skill_playbook_behavior.spec.js`
- `docs/internal-skill-testline.md`

### What changes

If this is supposed to be a strong agentic AI use case, the worker should know which preset the human selected.

`public/app.js` and `public/create.js` already pass `runtimeContext` into worker turns.

Extend that runtime context with:

```json
{
  "experiencePreference": {
    "presetId": "cn-mainland",
    "locale": "zh-CN",
    "market": "cn-mainland",
    "providerPolicy": "cn-mainland",
    "sharePolicy": "link-first"
  }
}
```

Then the worker can:

- speak the chosen language
- avoid recommending blocked services by default
- guide the user toward the right provider path
- generate copy or instructions that match the chosen experience profile

### Repo-specific contract note

If worker behavior changes based on preference:

- update `public/skill.md`
- update skill compatibility tests
- update `docs/internal-skill-testline.md`

Do not make the worker infer market behavior from brittle heuristics alone.
The explicit user-selected preference should be authoritative.

## 7. Server Persistence And APIs

### Files

- `server/sessions.js`
- `server/index.js`
- `specs/02_api_contract.md`

### What changes

Add a dedicated server-side preference flow instead of stuffing this into onboarding state.

### Recommended minimal API

- `GET /api/experience/bootstrap`
- `POST /api/experience/preference`

`GET /api/experience/bootstrap` should return:

- available presets
- current selected preset from session if present
- server default preset

`POST /api/experience/preference` should:

- validate preset id
- persist preference into the human session
- return the normalized preference object

### Also update

- `/api/state`
- `/api/onboarding/status`

so the current preference is included in client state payloads.

### Why not overload `onboarding`

`onboarding` today is about progress through Town Hall, Brain, Sigil, and Ceremony.
Language/preset is orthogonal. Mixing them together will make the state machine harder to reason about and harder to test.

## 8. App-Level Gating And Modal Views

### Files

- `public/app.js`
- `public/views/townhall.html`
- `public/views/brain.html`
- `public/views/sigil.html`
- `public/views/house.html`

### What changes

The modal hub currently has English gate text and assumes one recommendation path.

The framework should make these preset-aware:

- gate hints
- wallet prompts
- brain guidance
- sigil instructions
- reconnect messaging

This is mostly a copy and recommendation layer; it should not change the shared co-op state machine.

That is important: both presets should still use the same underlying flow rules.

## 9. Docs And Product Surface

### Files

- `docs/getting-started.md`
- `docs/which-provider.md`
- `docs/providers/README.md`
- `docs/providers/openai-codex.md`
- `docs/providers/qwen.md`
- `docs/providers/glm.md`
- `docs/providers/moonshot.md`
- `docs/providers/kimi-coding.md`

### What changes

The docs should stop assuming one universal recommendation.

Instead:

- `global-default`: current recommendation logic can stay
- `cn-mainland`: add a mainland-safe recommendation path

Do not create a separate docs tree per language yet.

Start with:

- preset-aware recommendation notes
- one short Chinese onboarding section
- explicit "if you chose Mainland-friendly setup, start here" links

## Concrete Implementation Shape

## New modules

Recommended additions:

- `public/experience_profiles.js`
- `public/i18n.js`
- `public/llm_catalog.js`

## New session field

Recommended addition:

- `session.experiencePreference`

## New endpoints

Recommended additions:

- `GET /api/experience/bootstrap`
- `POST /api/experience/preference`

## Existing files that become consumers

- `public/start.js`
- `public/app.js`
- `public/create.js`
- `public/house.js`

## Suggested Rollout

### Phase 1: framework only

- add preset registry
- add session/local storage persistence
- keep UI copy English-only for now
- keep `global-default` behavior unchanged

This proves the architecture without changing the current path.

### Phase 2: China-friendly preset

- add `cn-mainland`
- add simplified Chinese for start/onboarding/brain/share surfaces
- switch start hero media for that preset
- change provider recommendations and warnings
- make share copy generic

### Phase 3: agent-aware preference handling

- pass preference into runtime context
- update `public/skill.md`
- add worker behavior tests

### Phase 4: broader localization coverage

- `create`
- `house`
- `claim-wallet`
- `leaderboard`
- other long-tail pages

## Playwright And Spec Impact

These are the highest-risk test areas to update or extend.

### Start and early entry

- `e2e/31_start_page.spec.js`
- `e2e/32_start_page_privy_email_code_ui.spec.js`
- `e2e/33_start_page_privy_invalid_native_app_id.spec.js`
- `e2e/34_start_page_privy_wallet_option.spec.js`
- `e2e/38_start_page_auth_modal_prime.spec.js`
- `e2e/39_start_page_auth_modal_retry_on_error.spec.js`
- `e2e/40_start_page_auth_retry_rearms_email.spec.js`
- `e2e/41_start_page_does_not_block_on_wallet_create.spec.js`
- `e2e/42_start_page_skip_otp_when_already_signed_in.spec.js`

### Onboarding and brain persistence

- `e2e/57_phase3_onboarding_wallet_llm_persist.spec.js`

### Share and post URLs

- `e2e/54_share_links_x_only_fallback.spec.js`
- `e2e/60_human_posts_share_auth.spec.js`

### Skill/runtime context

- `e2e/55_phase3_skill_contract_line.spec.js`
- `e2e/56_phase3_skill_visit_worker.spec.js`
- `e2e/58_phase3_skill_playbook_behavior.spec.js`

### Specs/docs

- `specs/02_api_contract.md`
- `docs/internal-skill-testline.md`

## What Should Not Change

- wallet-first identity
- shared co-op state machine
- modal-first navigation
- deterministic Playwright coverage
- session-token routing via Team Code

This framework should change recommendation, copy, and reachability assumptions.
It should not create separate product logic for China vs non-China users.

## Practical Summary

The smallest correct implementation is:

1. Add a start-page preset chooser.
2. Persist a new `experiencePreference` object in session and localStorage.
3. Centralize provider catalog and recommendation rules.
4. Introduce a real translation/preset copy layer.
5. Make share and media behavior preset-driven.
6. Pass the preference into worker runtime context.

That gives you:

- the current path unchanged
- a China-friendly path
- a generic framework for future languages, regions, and provider preferences

without fragmenting the app into separate sites or incompatible flows.
