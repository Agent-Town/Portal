# Implementation plan (RALPH)

This repo is already implemented, but this plan is structured so **Codex CLI** can re-build it step-by-step using a test-driven loop.

## Phase 0 — Objective & constraints

- Build a minimal Agent Town landing page teaser.
- MUST include cooperative **match** mechanic and shared creation.
- MUST use session cookie + Team Code (no external identity).
- MUST be test-driven: Playwright tests validate each milestone.

## Phase 1 — Acceptance tests

Write end-to-end tests first:
- `e2e/01_home.spec.js`
- `e2e/02_match_unlock.spec.js`
- `e2e/03_create_share_leaderboard.spec.js`

## Phase 2 — Implement in small steps

Follow `specs/04_tdd_milestones.md`.

## Phase 3 — Polish (still testable)

- Copy cleanup (no new CTAs)
- Pixel-ish styling (no heavy frameworks)
- Input validation + error messaging

## Phase 3.5 — Skill Contract Line (required before skill/worker expansion)

Lock in a stable, test-first skill workflow for future experience support:

- Keep `public/skill.md` as the external-agent contract source.
- Keep `e2e/55_phase3_skill_contract_line.spec.js` green as baseline contract coverage.
- Track capability matrix and future rollout in `docs/internal-skill-testline.md`.

For every skill or worker capability added:

1. Add or update a Playwright test first (extend `e2e/55` or add `e2e/56+`).
2. Implement the smallest change needed.
3. Run targeted test(s), then run full suite (`npm test`).
4. Record capability-to-test mapping in `docs/internal-skill-testline.md`.

This phase is mandatory for:

- `skill.md` / `SKILL.md` adoption and path-resolution work.
- Moltbook multi-file skill support.
- Future multi-experience support where each new domain must have deterministic regression coverage.

## Phase 4 — Hardening (optional)

- Move from file store to database
- Add rate limiting
- Add captcha for signup (if abused)

---

## How to run the loop with Codex CLI

Codex supports non-interactive automation via `codex exec`. citeturn12view0turn12view1

This repo includes prompts:
- `PROMPT_plan.md`
- `PROMPT_build.md`

Example:
```bash
# plan (read-only)
codex exec -C . - < PROMPT_plan.md

# build (workspace-write)
codex exec --full-auto -C . - < PROMPT_build.md
```
