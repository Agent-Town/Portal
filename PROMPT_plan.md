You are a senior product engineer and test-driven builder.

Goal: produce a step-by-step implementation plan that can be executed with Codex CLI using a strict TDD loop.

Constraints:
- Keep UI minimal.
- No points.
- No external identity providers.
- Use Playwright e2e tests as the source of truth.

Inputs:
- `specs/00_product_story.md`
- `specs/01_experience_flow.md`
- `specs/02_api_contract.md`
- `specs/04_tdd_milestones.md`

Output:
- Update `IMPLEMENTATION_PLAN.md` with a numbered list of milestones.
- For each milestone:
  - which files to create/edit
  - which Playwright test(s) prove completion
  - any edge cases

Do not write code yet.
