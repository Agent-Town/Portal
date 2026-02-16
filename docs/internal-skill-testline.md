# Internal: Skill Test Line

Status: Active  
Audience: Engineering only

## Goal

Keep `skill.md` evolution testable as we:

1. stabilize Agent Town Portal skill behavior,
2. add Moltbook compatibility, and
3. support additional experience websites without regressions.

## Rules

- Every skill capability change must ship with at least one deterministic Playwright test.
- Every worker capability change that is required by `skill.md` must have a route or runtime assertion in tests.
- Keep tests API-first so UI restructuring does not break skill compatibility checks.

## Current Baseline

- Skill contract test file:
  - `e2e/55_phase3_skill_contract_line.spec.js`
- Skill source of truth:
  - `public/skill.md`

## Capability Matrix

| Capability | Source | Worker/runtime dependency | Test coverage |
|---|---|---|---|
| Minimal external agent playbook sections | `public/skill.md` | none | `e2e/55_phase3_skill_contract_line.spec.js` (`skill.md keeps the minimal external-agent contract`) |
| Portal external-agent API route wiring | `server/index.js` | HTTP route handlers | `e2e/55_phase3_skill_contract_line.spec.js` (`minimal skill endpoints are wired as JSON routes`) |

## Next Planned Expansions

1. Portal skill/worker parity:
- Add tests for `SKILL.md` vs `skill.md` workspace resolution.
- Add tests for real import/visit activation and truthful “agent active” state.

2. Moltbook multi-file package:
- Add fixture-driven tests for `skill.md` + referenced docs (`heartbeat.md`, `messaging.md`, `rules.md`, `skill.json`).
- Add worker import tests that verify same-origin linked-file fetch and persistence.

3. Multi-experience compatibility:
- Add experience contract tests that can be reused per domain.
- Add regression matrix so each new experience includes:
  - import test,
  - required-action test,
  - fallback-network test.

## Change Tracking Convention

When adding/changing skill behavior, update this document with:

- the capability row,
- source files touched,
- test file and test name,
- known gaps if partially implemented.
