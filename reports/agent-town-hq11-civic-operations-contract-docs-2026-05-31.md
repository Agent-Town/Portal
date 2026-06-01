# HQ11 Civic Operations Contract Docs - 2026-05-31

## Result

Updated the API/tool contract documentation for the HQ11 civic project inspection backend slice.

The new section documents `et.plot.inspect_civic_project` and `POST /api/founders-plot/civic-projects/inspect` as a one-shot same-plot `baseline_readiness` inspection for `ACTIVE` civic projects. It covers request fields, tool schema expectations, success/error envelope behavior, idempotency, agent approval, state/World Grid/read-model effects, Atlas non-execution, and prohibited capabilities.

## Changed Files

- `specs/02_api_contract.md`
- `reports/agent-town-hq11-civic-operations-contract-docs-2026-05-31.md`

## Boundary

Documentation only. No server, UI, Atlas runtime, scene, test, asset, generated, or gameplay files were edited.

## Verification

- `git diff --check -- specs/02_api_contract.md reports/agent-town-hq11-civic-operations-contract-docs-2026-05-31.md` passed
- Lightweight markdown sanity check passed:
  - `specs/02_api_contract.md`: fenced code blocks balanced, no trailing tabs
  - `reports/agent-town-hq11-civic-operations-contract-docs-2026-05-31.md`: fenced code blocks balanced, no trailing tabs
