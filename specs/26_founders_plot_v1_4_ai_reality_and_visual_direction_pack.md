# Agent Town: Founders Plot V1.4 — AI Reality Integration + Visual Direction Pack

**Status:** implementation specification for the next sprint  
**Prepared for:** agentic AI developers using Codex / GPT‑5.4 Extra High thinking  
**Product:** Agent Town  
**Chapter:** Founders Plot  
**Sprint name:** `v1.4-ai-reality-and-visual-direction`  
**Primary outcome:** Clover is a real OpenClaw Lite LLM/Test Brain gameplay participant, and the visual team has a frozen direction pack for the next art lift.

---

## 0. Executive summary

V1.3/V1.3.1 moved Founders Plot from a dashboard toward a stage-first game surface. That structural shift is a win and must not be reopened casually.

The next sprint must solve two different problems without mixing them into one vague polish effort:

1. **AI reality problem:** Clover / the Foreman must actually use the OpenClaw Lite worker + LLM/Test Brain path during gameplay. The player-facing fantasy is not “a scheduler card clicked a button”; it is “my AI partner observed the town, reasoned within safe boundaries, acted through tools, and explained itself.”
2. **Visual finish process problem:** the UI now has the right structure, but the next art lift needs a reference-led, screenshot-first, human-signoff workflow. The team must freeze a visual direction pack before asking implementation agents to make the screen “more premium.”

This sprint is **not** a gameplay expansion sprint and **not** a renderer rewrite. It is a focused bridge sprint:

- port/finish the real LLM Foreman loop on the current visual branch;
- make experience-pack context (`skill.md`, `heartbeat.md`, `tools.md`, `goals.md`, optionally `safety.md`) mandatory in Foreman turns;
- prove that `tools.md` descriptions/schemas reach the LLM/Test Brain;
- produce a visual direction pack that can drive the next art/asset sprint;
- recover and index the existing hero-video/script material if it exists in the repo/project archive, including the remembered Lobster, Chibi girl, Wizard kid, and Prairie dog material.

---

## 1. Product principle

The product sentence remains:

> **Agent Town is a frontier town-builder where you found a settlement with an AI partner and gradually teach it to run by your rules.**

V1 must still prove a polished home-plot game. V2 is where persistent/off-session Foreman governance belongs. V3 is where charters, specialist foremen, and deeper operating identity belong.

The sprint must protect the roadmap discipline:

- **V1:** found a living town.
- **V2:** govern through a Foreman.
- **V3:** build a distinct operating model.

This sprint is still V1. It may lay foundations for V2, but it must not implement V2.

---

## 2. Inputs and assumptions

### 2.1 Current implementation state assumed by this spec

The implementation currently has:

- Founders Plot as a playable chapter.
- Server-authoritative plot simulation.
- Contract Board, town signals, Public Square / Welcome Sign, Town Journal, recap, and Foreman surfaces.
- A stage-first visual surface from V1.3/V1.3.1.
- OpenClaw Lite worker architecture and Founders Plot worker-mediated routes.
- A separate real-LLM validation branch or patch that claims Clover can now use an LLM/Test Brain path.

### 2.2 Known branch tension

The real-LLM Foreman patch may be based on an older V1.2 hardening line. Do **not** merge it wholesale over V1.3.1 visual work. Port the relevant AI-runtime changes onto the current visual branch and rerun both visual and AI tests.

### 2.3 Hero video / script material

The product owner remembers an earlier hero-video/script concept with:

- a Lobster,
- a Chibi girl,
- a Wizard kid,
- a Prairie dog.

Those source materials were **not found in the currently provided local artifact set** during this spec preparation. Therefore:

- treat them as **candidate existing brand material**, not invented canon;
- search the repo/project archive for them during this sprint;
- index them if found;
- only promote them to canonical brand assets after the actual files/script are recovered and approved by a named design owner.

---

## 3. Sprint goals

### Goal A — AI reality

Clover must perform at least one gameplay decision through the real OpenClaw Lite worker + LLM/Test Brain path:

```text
Founders Plot state
→ structured observation
→ experience-pack context loaded
→ safe candidate list
→ LLM/Test Brain selection
→ provider-safe tool alias
→ canonical et.plot.* server route
→ server validation
→ world mutation or no-op
→ visible Clover action
→ receipt + replay + recap trace
```

### Goal B — Tool context correctness

The LLM/Test Brain must receive enough context to choose correctly:

- `skill.md` for role and behavior;
- `heartbeat.md` for when/why to think and no-op rules;
- `tools.md` for what tools exist, when to use them, schemas, errors, and provider-safe aliases;
- `goals.md` for example plans and gameplay recipes;
- optional `safety.md` if present.

A heartbeat without tool descriptions is incomplete.

### Goal C — Visual direction pack

Create a usable visual-direction package for the next art sprint:

- mood board inventory;
- reference board inventory;
- anti-example strip;
- paintover requirements for desktop, mobile, and Clover acting;
- weak asset list;
- hero-video/script recovery plan;
- asset-generation workflow rules;
- signoff owner fields;
- screenshot comparison rubric.

This sprint may implement minor visual doc/asset-indexing changes, but it must **not** attempt a broad art reboot.

### Goal D — Artifact governance

Update the correct markdown artifacts:

- `AGENTS.md`
- `BRAND.md`
- `DESIGN.md`
- `GAME_UX.md`
- `REGISTRY.md`
- Founders Plot experience-pack docs: `skill.md`, `heartbeat.md`, `tools.md`, `goals.md`
- new visual direction / hero media docs
- new TDD acceptance matrix
- Codex handoff prompt

---

## 4. Non-goals

Do **not** add in this sprint:

- persistent/off-session Foreman execution;
- backend-pool Foreman;
- doctrine board;
- specialist agents;
- new contracts;
- new resources/currencies;
- new buildings beyond existing visual signoff needs;
- social/visitor mode;
- token economy features;
- UGC/editor features;
- PixiJS/Phaser rewrite;
- full hero video production;
- a new brand direction unrelated to Agent Town’s warm frontier civic-builder identity.

---

## 5. Work packages

## WP1 — Branch reconciliation and scope quarantine

### Objective

Port the real LLM Foreman work onto the latest V1.3.1 visual branch without regressing the visual surface.

### Required actions

1. Identify the current latest visual branch.
2. Identify the real-LLM Foreman patch/branch.
3. Cherry-pick or manually port only the relevant AI-runtime changes.
4. Do not port stale visual files from the older branch over V1.3.1.
5. Add `docs/agent-runtime/real_llm_foreman_port_notes_v1_4.md`.

### Acceptance criteria

- V1.3.1 visual tests still pass.
- Real LLM/Test Brain Foreman tests pass.
- No V1.3.1 screenshot baseline is deleted without replacement.
- No unrelated OpenRouter/proxy/test-surface changes are bundled unless documented in a quarantine note.

### Required tests

- `e2e/174_founders_plot_v1_4_scope_quarantine.spec.js`
- `e2e/175_founders_plot_v1_4_visual_regression_survives_llm_port.spec.js`

---

## WP2 — Experience Context Assembler

### Objective

Build a single context assembly path for all Founders Plot Foreman cognition turns.

### Required module

Add or extend a worker-side module such as:

```text
vendors/openclaw-lite-main/src/openclaw-lite/experience_context_assembler.js
```

or an equivalent internal file approved by the team.

### Required context object

Every Foreman cognition turn must assemble:

```ts
type ForemanCognitionContextV1 = {
  contextVersion: "founders-plot-foreman-context.v1";
  experienceId: "founders-plot";
  plotId: string;
  foremanId: string;
  runtimeId: string;

  pack: {
    packHash: string | null;
    files: {
      skillMd: { present: boolean; hash: string | null; excerpt: string | null };
      heartbeatMd: { present: boolean; hash: string | null; excerpt: string | null };
      toolsMd: { present: boolean; hash: string | null; excerpt: string | null };
      goalsMd: { present: boolean; hash: string | null; excerpt: string | null };
      safetyMd?: { present: boolean; hash: string | null; excerpt: string | null };
    };
  };

  toolContract: {
    source: "tools.md" | "server-tool-registry" | "merged";
    providerTools: ProviderSafeToolDefinition[];
    compactToolGuide: string;
    aliasMap: Record<string, string>;
  };

  observation: PlotObservation;
  activeGoal: CurrentGoal | null;
  activeContract: ActiveContract | null;
  permissions: ForemanPermissions;
  scheduler: ForemanSchedulerState;
  recentEvents: EventSummary[];
  safeCandidates: SafeActionCandidate[];

  outputContract: {
    mode: "select_candidate_or_noop";
    neverInventTools: true;
    neverInventCandidateIds: true;
    serverValidatesAllActions: true;
  };
};
```

### Context completeness rule

If `tools.md` or the server tool registry cannot be loaded, the Foreman must not act. It may no-op with:

```text
FOREMAN_CONTEXT_INCOMPLETE
```

### Acceptance criteria

- Every Foreman LLM/Test Brain request includes pack hashes or explicit `missing` markers.
- `tools.md` content is supplied as provider tool definitions, a compact tool guide, or both.
- Canonical dotted tool names remain canonical internally.
- Provider-facing tool names are safe aliases.
- The context event is traceable in replay/debug logs.

### Required tests

- `tests/founders_plot_foreman_context_assembler.test.js`
- `e2e/176_founders_plot_foreman_context_includes_pack_docs.spec.js`

---

## WP3 — Tool registry and provider-safe aliases

### Objective

Make the LLM capable of choosing correctly by exposing descriptions/schemas safely.

### Required behavior

The worker must convert the active experience’s tool contract into provider-compatible tool definitions.

Canonical names remain:

```text
et.plot.collect_outputs
et.plot.queue_job
et.plot.request_user_approval
```

Provider-safe aliases must look like:

```text
founders_plot_collect_outputs
founders_plot_queue_job
founders_plot_request_user_approval
```

### Required provider tool definition shape

```ts
type ProviderSafeToolDefinition = {
  name: string;                 // provider-safe alias
  canonicalName: string;        // et.plot.*
  description: string;
  inputSchema: JSONSchema;
  resultSchema?: JSONSchema;
  preconditions?: string[];
  errorCodes?: string[];
};
```

### P0 provider tool

For V1.4, the model does not need arbitrary direct tool access. It may use a single selection tool:

```text
founders_plot_foreman_select_candidate
```

This tool must still include the compact guide for the actual canonical tools so the model understands what each candidate means.

### Acceptance criteria

- Mock provider requests contain provider-safe names only.
- No dotted `et.plot.*` function names are sent as provider function names.
- Trace contains alias map.
- Invalid/missing alias map causes no-op, not mutation.

### Required tests

- `tests/founders_plot_tool_alias_registry.test.js`
- `e2e/177_founders_plot_provider_safe_tool_context.spec.js`

---

## WP4 — Real LLM/Test Brain Foreman decision loop

### Objective

Clover must make a model-mediated or Test Brain-mediated decision during gameplay.

### Required decision contract

```ts
type ForemanDecisionOutputV1 = {
  selectedCandidateId: string | null;
  confidence: number; // 0..1
  reason: string;
  playerFacingLine: string;
  needsApproval?: boolean;
  noopCode?: "HEARTBEAT_OK" | "NO_SAFE_CANDIDATE" | "LOW_CONFIDENCE" | "FOREMAN_CONTEXT_INCOMPLETE";
};
```

### Decision rules

- The LLM/Test Brain may select **one** candidate from the server-provided `safeCandidates` list.
- The LLM/Test Brain may return no-op.
- The LLM/Test Brain may ask for approval by selecting an approval candidate.
- It may not invent tools.
- It may not invent candidate IDs.
- It may not directly mutate world state.
- The server must validate the selected candidate again.

### Required event trail

Emit or persist events equivalent to:

```text
FOREMAN_CONTEXT_ASSEMBLED
FOREMAN_LLM_REQUESTED
FOREMAN_LLM_DECISION_SELECTED
FOREMAN_LLM_DECISION_NOOP
FOREMAN_TOOL_ALIAS_MAPPED
FOREMAN_ACTION_EXECUTED
FOREMAN_ACTION_REJECTED
```

Each decision event must include:

- `runtimeId`
- `workerCommandId`
- `workerTraceId`
- `modelInvocationId` or `testBrainInvocationId`
- `provider`
- `model`
- `packHash`
- `skillMdHash`
- `heartbeatMdHash`
- `toolsMdHash`
- `goalsMdHash`
- selected `candidateId`
- `llmToolName`
- `canonicalToolName`

### UI requirement

Normal player UI shows only:

```text
Clover: “I collected lumber because the Contract Board needs wood.”
```

Debug details remain behind explicit debug/dev mode.

### Required tests

- `e2e/178_founders_plot_llm_foreman_selects_candidate.spec.js`
- `e2e/179_founders_plot_invalid_llm_candidate_rejected.spec.js`
- `e2e/180_founders_plot_llm_receipt_and_recap_trace.spec.js`

---

## WP5 — Heartbeat + tools context behavior

### Objective

Make `heartbeat.md` meaningful and prove it participates in the Foreman cognition turn.

### Required behavior

A Founders Plot heartbeat turn must include:

1. contents or summarized relevant sections of `heartbeat.md`;
2. tool descriptions/schemas from `tools.md`;
3. current observation;
4. safe candidates;
5. recent Foreman memory/receipt context;
6. output contract.

### Required test fixture

Create two temporary heartbeat/tool fixtures:

- Fixture A: heartbeat says “prefer collecting ready outputs.”
- Fixture B: heartbeat says “if no contract is active, return `HEARTBEAT_OK` unless storage is capped.”

The Test Brain should receive different context hashes and make different deterministic decisions when the fixture changes.

### Required tests

- `tests/founders_plot_heartbeat_context_hash.test.js`
- `e2e/181_founders_plot_heartbeat_and_tools_change_decision_context.spec.js`

---

## WP6 — Gated live-provider smoke test

### Objective

Prove the live-provider path exists without making CI brittle.

### Required command

Add a gated manual test such as:

```bash
REAL_LLM_FOREMAN_SMOKE=1 \
FOUNDERS_PLOT_SMOKE_PROVIDER=openrouter \
FOUNDERS_PLOT_SMOKE_MODEL=<model> \
npx playwright test e2e/182_founders_plot_real_llm_foreman_smoke.spec.js
```

Use the actual environment variable names used in the repo.

### Required behavior

Scenario:

- Lumber Camp output is ready.
- Auto-collect/safe candidate exists.
- Worker assembles context.
- Live provider receives request.
- Provider returns selection or no-op.
- If selection is valid, server executes canonical tool.
- Replay records model/provider metadata.

### CI behavior

- If env flag is absent, test must skip with a clear message.
- Normal CI must use deterministic Test Brain/mocked provider.

---

## WP7 — Visual direction pack and hero media recovery

### Objective

Prepare the next visual-art sprint with stronger inputs, not vague adjectives.

### Required new docs

Create:

```text
docs/visual/FOUNDERS_PLOT_V1_4_VISUAL_DIRECTION_PACK.md
docs/brand/HERO_VIDEO_REUSE_BRIEF_V1_4.md
docs/brand/HERO_VIDEO_SOURCE_INDEX.md
```

### Visual direction pack must include

1. **One-page Founders Plot visual brief**
   - must-feel;
   - must-not-feel;
   - primary player emotion;
   - focal hierarchy.

2. **Mood board inventory**
   - 8–15 references max;
   - each reference annotated by principle to borrow;
   - each reference tagged as owned/licensed/public-reference/internal.

3. **Reference board inventory**
   - 5–10 concrete UI/game references;
   - composition, hierarchy, density, object-state treatment.

4. **Anti-example strip**
   - 3–5 examples or screenshots of what not to do;
   - explicitly include “dashboard with decorative art” as an anti-pattern.

5. **Paintover requirements**
   - desktop hero frame 1280;
   - mobile hero frame 390;
   - Clover acting frame;
   - goal lot emphasis frame;
   - optional return/recap frame.

6. **Weak asset list**
   - exact asset ID;
   - reason it is weak;
   - replacement brief;
   - priority;
   - target screenshot state.

7. **Visual platform pilot plan**
   - optional Scenario/Firefly/other visual platform role;
   - no unlicensed training;
   - provenance and approval rules.

8. **Signoff rubric**
   - named art/design owner;
   - screenshot states;
   - pass/fail criteria.

### Hero video/script recovery

The sprint must search for existing materials with these terms:

```text
hero video
trailer
script
lobster
chibi
wizard kid
prairie dog
prairie-dog
```

Search locations:

```text
repo docs/
repo specs/
repo public/
repo assets/
Brand kit/
marketing/
prior generated packs if present
project archive if mounted
```

If found:

- index the source file path;
- summarize the script beats;
- list recoverable characters;
- mark asset/provenance status;
- recommend whether it informs in-game UI, hero marketing, or both.

If not found:

- create `docs/brand/HERO_VIDEO_SOURCE_INDEX.md` with `status: not_found_in_repo`;
- list the remembered terms;
- request the source from the product owner;
- do not fabricate a script.

### Candidate character handling

The Lobster, Chibi girl, Wizard kid, and Prairie dog are **not P0 Founders Plot gameplay entities** in this sprint.

They may be used as:

- hero video / marketing cast;
- reference for tone;
- future visitor/event mascots;
- optional visual-direction mood elements.

They must not replace Clover as the Foreman or create new gameplay systems unless a later spec says so.

---

## WP8 — Artifact updates

The following docs must be updated in the repo.

### `AGENTS.md`

Required update:

- fix design-doc path ambiguity;
- explicitly state that root copies may exist, but canonical design docs live at the repo’s chosen path;
- require Foreman gameplay changes to use OpenClaw Lite worker + LLM/Test Brain;
- require experience-pack context in model turns;
- forbid “fake LLM” claims without invocation trace.

### `BRAND.md`

Required update:

- add “AI partner truth” rule;
- add hero-video source/cameo policy;
- clarify Clover remains the in-game Foreman;
- candidate characters from prior hero video remain non-canon until source is recovered and approved.

### `DESIGN.md`

Required update:

- add visual-direction-pack workflow;
- add screenshot-first review law;
- add asset provenance and visual-platform usage rules;
- state that visual platform output is a production input, not art-direction authority.

### `GAME_UX.md`

Required update:

- define AI gameplay truth path;
- define how one-line Clover LLM receipts appear;
- ensure debug/model/provider details remain backstage;
- add hero-frame five-second test.

### `REGISTRY.md`

Required update:

Add or define these registry items:

- `foreman-decision-receipt`
- `foreman-debug-trace-panel` (debug-only)
- `visual-direction-pack-template`
- `hero-media-source-index`
- `reference-board-card`
- `screenshot-signoff-panel`

### Experience pack docs

Update or add these sections:

- `public/experiences/founders-plot/skill.md`
- `public/experiences/founders-plot/heartbeat.md`
- `public/experiences/founders-plot/tools.md`
- `public/experiences/founders-plot/goals.md`

They must explain the Foreman’s real LLM/Test Brain loop, heartbeat cadence, tool descriptions, candidate-selection boundary, and no-op behavior.

---

## 6. TDD acceptance matrix summary

The full acceptance matrix is in:

```text
specs/27_founders_plot_v1_4_tdd_acceptance_matrix.md
```

Core metrics:

| Metric | Required value |
|---|---:|
| `ForemanModelInvocationCoverage` | 100% of Foreman gameplay decisions |
| `ExperiencePackContextCoverage` | 100% of Foreman LLM/Test Brain requests |
| `ToolsMdContextCoverage` | 100% |
| `HeartbeatMdContextCoverage` | 100% |
| `ProviderSafeToolNameRate` | 100% |
| `DottedProviderToolNameRate` | 0% |
| `InvalidCandidateMutationRate` | 0% |
| `ServerAuthorityBypassRate` | 0% |
| `PlayerFacingDebugJargonCount` | 0 in normal gameplay |
| `VisualDirectionPackCompleteness` | 100% of required sections |
| `HeroSourceIndexStatus` | `found` or `not_found_in_repo` with evidence |

---

## 7. Milestone roadmap

### M1 — Reconcile branch and fix doc paths

- port AI changes onto current visual branch;
- fix `AGENTS.md` design-doc routing;
- add scope quarantine note if needed.

### M2 — Implement Context Assembler

- load pack docs;
- parse tools/aliases;
- produce context event and hashes.

### M3 — Implement LLM/Test Brain Foreman decision

- provider-safe selection tool;
- safe candidate selection;
- server validation;
- replay/receipt/recap trace.

### M4 — Add heartbeat + tools tests

- prove `heartbeat.md` and `tools.md` enter the context window;
- prove changed docs change context hash and deterministic behavior.

### M5 — Add live-provider smoke test

- gated manual smoke;
- documented setup;
- no normal CI dependency on external provider.

### M6 — Create visual direction pack + hero source index

- recover/index hero video/script if present;
- produce visual direction pack template filled with known current state;
- mark unknowns and required human signoff fields.

### M7 — Final regression and report

- run full relevant tests;
- update docs;
- capture screenshots only as needed to prove no regression;
- provide implementation report.

---

## 8. Definition of Done

The sprint is done only if:

1. A Foreman action is demonstrably model-mediated or Test Brain-mediated through OpenClaw Lite worker.
2. Foreman context includes `skill.md`, `heartbeat.md`, `tools.md`, `goals.md` or explicit missing markers that cause no-op when required.
3. Tool descriptions/schemas reach the model request as provider-safe tool definitions and/or compact guide.
4. The server still validates all mutations and rejects invalid candidate/tool attempts.
5. Normal player UI shows a short Clover line, not debug/model/provider jargon.
6. Replay/recap records model/test-brain, pack hashes, tool alias, canonical tool, and selected candidate metadata.
7. The visual direction pack exists and is complete enough for a human art owner to approve or redline.
8. The hero-video/source index exists and honestly states whether the Lobster/Chibi/Wizard/Prairie Dog material was recovered.
9. `AGENTS.md`, `BRAND.md`, `DESIGN.md`, `GAME_UX.md`, `REGISTRY.md`, and Founders Plot pack docs are updated.
10. Tests in the acceptance matrix pass or are explicitly documented as gated/manual.

---

## 9. Machine-readable summary

```yaml
sprint: founders_plot_v1_4_ai_reality_and_visual_direction
product: Agent Town
chapter: Founders Plot
version_stage: V1
primary_objective: >
  Make Clover a real OpenClaw Lite LLM/Test Brain gameplay participant and prepare a
  reference-led visual direction pack for the next art lift.

p0:
  - port_real_llm_foreman_to_latest_visual_branch
  - implement_foreman_context_assembler
  - include_skill_heartbeat_tools_goals_in_model_context
  - expose_tools_md_descriptions_and_provider_safe_aliases
  - prove_llm_or_test_brain_selects_safe_candidate
  - preserve_server_authority
  - create_visual_direction_pack
  - recover_or_index_hero_video_sources
  - update_design_and_runtime_docs

non_goals:
  - persistent_off_session_foreman
  - doctrine_board
  - specialist_agents
  - new_gameplay_systems
  - new_economy_resources
  - renderer_rewrite
  - full_hero_video_production
  - broad_visual_reboot

required_docs:
  - AGENTS.md
  - BRAND.md
  - DESIGN.md
  - GAME_UX.md
  - REGISTRY.md
  - public/experiences/founders-plot/skill.md
  - public/experiences/founders-plot/heartbeat.md
  - public/experiences/founders-plot/tools.md
  - public/experiences/founders-plot/goals.md
  - docs/visual/FOUNDERS_PLOT_V1_4_VISUAL_DIRECTION_PACK.md
  - docs/brand/HERO_VIDEO_REUSE_BRIEF_V1_4.md
  - docs/brand/HERO_VIDEO_SOURCE_INDEX.md

tests:
  unit:
    - founders_plot_foreman_context_assembler
    - founders_plot_tool_alias_registry
    - founders_plot_heartbeat_context_hash
  e2e:
    - scope_quarantine
    - visual_regression_survives_llm_port
    - pack_docs_in_context
    - provider_safe_tool_context
    - llm_foreman_selects_candidate
    - invalid_llm_candidate_rejected
    - receipt_and_recap_trace
    - heartbeat_and_tools_change_context
    - real_llm_foreman_smoke_gated
```
