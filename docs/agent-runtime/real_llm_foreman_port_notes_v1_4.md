# Real LLM Foreman Port Notes — V1.4

**Status:** implemented  
**Purpose:** document exactly how the real LLM/Test Brain Foreman path was ported onto the latest visual branch.

---

## Port record

```yaml
latest_visual_branch: codex/founders-plot-v1-3-1-signoff
latest_visual_commit_before_port: a7105bb
llm_source_branch_or_patch: codex/founders-plot-v1-3-1-signoff plus manual V1.4 context-assembler and provider-safe alias patch set
llm_source_commit: a7105bb
ported_by: Codex
ported_at: 2026-04-22
```

---

## Files intentionally ported

| File | Reason | Notes |
|---|---|---|
| `vendors/openclaw-lite-main/src/openclaw-lite/worker.js` | Move Clover decision-making onto the V1.4 worker path with pack-context assembly, same-origin pack hydration, provider-safe alias metadata, and rich decision sync payloads. | Rebuilt into `public/openclaw-lite/worker.js` and `public/openclaw-lite/worker.js.map`. |
| `vendors/openclaw-lite-main/src/openclaw-lite/founders-plot-foreman-context.js` | Centralize the Founders Plot cognition context object, pack hashing, provider-safe tool alias registry, compact tool guide, and deterministic Test Brain selection rules. | New V1.4 worker-side module. |
| `server/founders_plot/routes.js` | Accept and persist the richer Foreman decision payload; expose `toolRegistry` and `recentReceipts`; record rejection and alias-mapping events; preserve client-only LLM privacy. | Backend remains authoritative for mutations. |
| `server/founders_plot/engine.js` | Add V1.4 Foreman event types and preserve the richer last-decision metadata in state/replay views. | No new gameplay systems added. |
| `server/founders_plot/recap.js` | Classify the new V1.4 Foreman context/decision/rejection events into the Clover-facing recap section. | Keeps recap player-readable. |
| `public/experiences/founders-plot/app.js` | Mirror shared client-only Brain config into the iframe worker, mirror pack docs into the worker workspace, and start Clover against the same client-only context the player configured. | Prevents top-page and iframe worker drift. |
| `public/experiences/founders-plot/{skill,heartbeat,tools,goals}.md` | Make the experience pack explicit about the real LLM/Test Brain loop, heartbeat cadence, provider-safe alias boundary, and no-op rules. | Source-of-truth pack docs for V1.4. |
| `specs/26_founders_plot_v1_4_ai_reality_and_visual_direction_pack.md` | Canonical product/spec record for the sprint. | Updated to repo-native numbering and actual test file names. |
| `specs/27_founders_plot_v1_4_tdd_acceptance_matrix.md` | Canonical acceptance matrix. | Updated to actual shipped tests (`172`, `174`-`182`). |

---

## Files intentionally not ported

| File | Reason not ported |
|---|---|
| `public/experiences/founders-plot/styles.css` | V1.4 is not a renderer/art-direction rewrite; V1.3.1 visual signoff remains the player-surface baseline. |
| `public/experiences/founders-plot/scene_render.js` | No visual-surface replacement was needed to restore the real LLM/Test Brain path. |
| `public/experiences/founders-plot/scene_state.js` | Kept V1.3.1 world-as-interface composition intact. |
| `public/experiences/founders-plot/assets/*` | V1.4 adds art-direction docs and hero-source indexing, not a new asset pack. |
| `server/founders_plot` economy/progression rules outside Foreman trace fields | Sprint scope explicitly forbids gameplay expansion drift. |

---

## Quarantined scope

```yaml
quarantine_required: true
owner: codex/founders-plot-v1-4-ai-reality
rollback_plan: Revert the V1.4 worker/routes/app/docs patch set back to a7105bb if the real Foreman path regresses the visual branch, and use specs/OPENROUTER_SCOPE_QUARANTINE.md to isolate inherited OpenRouter scope if needed.
```

---

## Validation summary

```yaml
v1_3_1_visual_tests: passed_via_v1_4_visual_regression_slice
v1_4_foreman_llm_tests: passed
live_provider_smoke: implemented_and_gated_in_e2e/182_founders_plot_real_llm_foreman_smoke.spec.js
```
