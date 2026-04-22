# Agent Town: Founders Plot V1.4 — TDD Acceptance Matrix

**Companion to:** `26_founders_plot_v1_4_ai_reality_and_visual_direction_pack.md`  
**Purpose:** measurable acceptance criteria for agentic AI developers.  
**Rule:** every P0 behavior must have deterministic automated coverage. Live provider coverage is gated/manual.

---

## 1. Metrics

| ID | Metric | Definition | Required value | Test type |
|---|---|---|---:|---|
| M01 | `ForemanModelInvocationCoverage` | Percent of gameplay Foreman decisions that have `modelInvocationId` or `testBrainInvocationId`. | 100% | E2E + replay audit |
| M02 | `ExperiencePackContextCoverage` | Percent of Foreman cognition turns with pack file hashes or explicit missing markers. | 100% | Unit + E2E |
| M03 | `SkillMdContextCoverage` | Percent of turns including `skill.md` hash/excerpt or missing marker. | 100% | Unit |
| M04 | `HeartbeatMdContextCoverage` | Percent of turns including `heartbeat.md` hash/excerpt or missing marker. | 100% | Unit + E2E |
| M05 | `ToolsMdContextCoverage` | Percent of turns including tool descriptions/schemas from `tools.md` or canonical registry. | 100% | Unit + provider-request capture |
| M06 | `GoalsMdContextCoverage` | Percent of turns including `goals.md` hash/excerpt or missing marker. | 100% | Unit |
| M07 | `ProviderSafeToolNameRate` | Percent of provider tool/function names matching provider-safe regex. | 100% | Unit + E2E |
| M08 | `DottedProviderToolNameRate` | Percent of provider tool/function names containing canonical dotted names like `et.plot.*`. | 0% | Unit + E2E |
| M09 | `InvalidCandidateMutationRate` | Percent of invalid LLM-selected candidates that mutate world state. | 0% | E2E |
| M10 | `ServerAuthorityBypassRate` | Percent of Foreman mutations bypassing server validation routes. | 0% | E2E + route assertions |
| M11 | `ReplayDecisionTraceCoverage` | Percent of Foreman decisions represented in replay with runtime/model/tool metadata. | 100% | E2E |
| M12 | `PlayerFacingDebugJargonCount` | Count of provider/model/runtime/debug labels in normal gameplay route. | 0 | E2E DOM/screenshot |
| M13 | `VisualDirectionPackCompleteness` | Required sections present in visual direction pack. | 100% | Markdown test |
| M14 | `HeroSourceIndexStatus` | Hero source index reports `found`, `partial`, or `not_found_in_repo` with evidence. | non-empty | Markdown test |
| M15 | `NoGameplayExpansionDrift` | New gameplay resources/contracts/buildings added without spec approval. | 0 | Diff/static test |

---

## 2. Required unit tests

### `tests/founders_plot_foreman_context_assembler.test.js`

Must prove:

1. assembler loads pack docs;
2. hashes are stable for identical content;
3. missing required docs create `FOREMAN_CONTEXT_INCOMPLETE`;
4. observation, active goal, contract, permissions, scheduler, events, and candidates are included;
5. context redacts secrets and does not include hidden debug/provider UI text.

### `tests/founders_plot_tool_alias_registry.test.js`

Must prove:

1. canonical `et.plot.*` names map to provider-safe aliases;
2. alias names match `^[A-Za-z0-9_-]+$`;
3. descriptions and JSON schemas are preserved;
4. reverse mapping works;
5. unknown alias fails closed.

### `tests/founders_plot_heartbeat_context_hash.test.js`

Must prove:

1. changing `heartbeat.md` changes context hash;
2. changing `tools.md` changes context hash;
3. changing unrelated UI copy does not change Foreman cognition hash;
4. context hash is recorded on decision events.

### `tests/founders_plot_hero_source_index.test.js`

Must prove:

1. `docs/brand/HERO_VIDEO_SOURCE_INDEX.md` exists;
2. it includes searched terms;
3. it includes search paths;
4. it has a clear status: `found`, `partial`, or `not_found_in_repo`;
5. if `found`, every indexed file path exists.

### `tests/founders_plot_visual_direction_pack.test.js`

Must prove:

1. visual direction pack exists;
2. mood board, reference board, anti-examples, paintover requirements, weak asset list, signoff rubric are present;
3. signoff owner field exists even if set to `TBD_ART_OWNER`;
4. no instruction asks agents to copy a single third-party style 1:1.

---

## 3. Required E2E tests

### `e2e/172_founders_plot_foreman_llm_tick.spec.js`

Scenario:

- configure the client-only OpenRouter brain;
- start Clover;
- enable the shipped collect routine;
- intercept the live provider request and decision sync.

Pass if:

- the browser calls OpenRouter directly with no backend LLM credential relay;
- the synced decision payload contains `modelInvocationId`, `llmToolName`, pack hashes, and alias-map metadata;
- a valid live-LLM candidate produces a server-authoritative mutation and receipt.

### `e2e/174_founders_plot_v1_4_scope_quarantine.spec.js`

Scenario:

- inspect changed file list or static branch metadata if available;
- assert no unrelated provider/proxy/runtime visual changes are mixed without a quarantine doc.

Pass if:

- quarantine doc exists for any non-Founders Plot AI/visual changes; or
- no unrelated files changed.

### `e2e/175_founders_plot_v1_4_visual_regression_survives_llm_port.spec.js`

Scenario:

- open normal Founders Plot route;
- assert V1.3.1 player surface still hides debug chrome;
- capture desktop and mobile screenshots if visual baselines exist.

Pass if:

- no Agent Comms/Worker Tools/Brain/Trainer in normal gameplay;
- no new debug/model/provider jargon;
- screenshot threshold remains within configured tolerance.

### `e2e/176_founders_plot_foreman_context_includes_pack_docs.spec.js`

Scenario:

- start Founders Plot;
- start Clover/OpenClaw Lite worker;
- trigger Foreman tick with Test Brain;
- inspect worker traffic/debug trace or replay event.

Pass if trace includes:

- `skillMdHash`;
- `heartbeatMdHash`;
- `toolsMdHash`;
- `goalsMdHash`;
- compact tool guide or provider tool definitions;
- safe candidate list.

### `e2e/177_founders_plot_provider_safe_tool_context.spec.js`

Scenario:

- intercept provider/test-brain request;
- inspect tools/function definitions.

Pass if:

- provider tools use safe names like `founders_plot_foreman_select_candidate`;
- no provider tool is named `et.plot.collect_outputs` or other dotted canonical name;
- alias map is recorded.

### `e2e/178_founders_plot_llm_foreman_selects_candidate.spec.js`

Scenario:

- create ready output;
- configure mocked provider/Test Brain to select candidate ID;
- run Foreman tick.

Pass if:

- model/test-brain invocation occurs;
- server executes canonical action;
- resource changes;
- Clover visible receipt appears;
- replay event includes model/test-brain metadata.

### `e2e/179_founders_plot_invalid_llm_candidate_rejected.spec.js`

Scenario:

- mocked provider selects invalid candidate or invented tool.

Pass if:

- server rejects;
- world state unchanged;
- event includes `FOREMAN_ACTION_REJECTED`;
- UI does not claim success.

### `e2e/180_founders_plot_llm_receipt_and_recap_trace.spec.js`

Scenario:

- run a successful Foreman decision;
- open recap/replay/journal.

Pass if:

- player sees one-line Clover explanation;
- expandable audit has model/tool/pack metadata in debug or recap detail;
- passive simulation events and Foreman decisions are distinct.

### `e2e/181_founders_plot_heartbeat_and_tools_change_decision_context.spec.js`

Scenario:

- run fixture A and fixture B with different `heartbeat.md`/`tools.md` content.

Pass if:

- context hashes differ;
- deterministic Test Brain sees the difference;
- behavior follows fixture expectation;
- no server logic changes are needed.

### `e2e/182_founders_plot_real_llm_foreman_smoke.spec.js`

Gated manual test.

Pass if:

- skipped by default;
- when env flag and provider credentials exist, a real provider request is made;
- response selects candidate or returns no-op;
- if candidate selected, server mutation succeeds and replay metadata includes provider/model.

---

## 4. Markdown artifact tests

### Required markdown files

```text
AGENTS.md
BRAND.md
DESIGN.md
GAME_UX.md
REGISTRY.md
public/experiences/founders-plot/skill.md
public/experiences/founders-plot/heartbeat.md
public/experiences/founders-plot/tools.md
public/experiences/founders-plot/goals.md
docs/visual/FOUNDERS_PLOT_V1_4_VISUAL_DIRECTION_PACK.md
docs/brand/HERO_VIDEO_REUSE_BRIEF_V1_4.md
docs/brand/HERO_VIDEO_SOURCE_INDEX.md
docs/handoff/codex_v1_4_ai_reality_visual_direction_prompt.md
```

### Pass conditions

- all exist;
- no placeholder `TODO` appears in P0 acceptance rules except explicitly allowed `TBD_ART_OWNER` or `not_found_in_repo` statuses;
- design docs refer to visual direction pack workflow;
- experience pack docs refer to OpenClaw Lite Foreman context;
- AGENTS.md routes future agents to the canonical design-doc paths.

---

## 5. Final report checklist

The implementing team must report:

1. branch base and ported commits;
2. files changed;
3. exact LLM/Test Brain flow implemented;
4. context packet sample with secrets redacted;
5. provider-safe alias map sample;
6. tests run and results;
7. live-provider smoke result or reason not run;
8. visual direction pack completion status;
9. hero-video source index status;
10. confirmation that no out-of-scope gameplay system was added.
