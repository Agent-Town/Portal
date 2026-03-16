# Portal Design Logic Formalization

This folder contains bounded TLA+ models for the parts of Portal design that can be formalized usefully.

These models are for:

- navigation and disclosure logic
- information-order invariants
- assistant-first detail staging
- modal-first continuity
- debug availability without default visual dominance

These models are not for:

- typography taste
- color judgment
- whitespace feel
- visual elegance
- motion aesthetics

Those still belong to:

- [design/DESIGN_SYSTEM.md](/Users/robin/.codex/worktrees/afe5/Portal/design/DESIGN_SYSTEM.md)
- [design/TDD_SPEC.md](/Users/robin/.codex/worktrees/afe5/Portal/design/TDD_SPEC.md)
- screenshot captures in [design/captures](/Users/robin/.codex/worktrees/afe5/Portal/design/captures)

## Why this folder exists

Portal now has strong design principles around:

- dead-simple human surfaces
- assistant-carried detail
- advanced disclosure instead of dense default dashboards
- one dominant action
- modal-first continuity

TLA+ helps formalize those rules as UI-state invariants so future agents do not accidentally reintroduce:

- multiple competing primaries
- top-layer technical overload
- route-jumping that breaks continuity
- debug-first layouts
- detail deletion instead of staged disclosure

## Model Set

- [INVARIANTS.md](/Users/robin/.codex/worktrees/afe5/Portal/design/tla/INVARIANTS.md)
  Human-readable mapping from design rule to formal invariant.
- [TownShell.tla](/Users/robin/.codex/worktrees/afe5/Portal/design/tla/TownShell.tla)
  Formalizes town hub shell logic and modal-first district entry.
- [TownShell_MC.cfg](/Users/robin/.codex/worktrees/afe5/Portal/design/tla/TownShell_MC.cfg)
  Suggested TLC config for `TownShell.tla`.
- [HouseFlow.tla](/Users/robin/.codex/worktrees/afe5/Portal/design/tla/HouseFlow.tla)
  Formalizes the first-viewport House narrative and advanced disclosure rules.
- [HouseFlow_MC.cfg](/Users/robin/.codex/worktrees/afe5/Portal/design/tla/HouseFlow_MC.cfg)
  Suggested TLC config for `HouseFlow.tla`.
- [HouseOfficeDisclosure.tla](/Users/robin/.codex/worktrees/afe5/Portal/design/tla/HouseOfficeDisclosure.tla)
  Formalizes House Office summary-first behavior and detail staging.
- [HouseOfficeDisclosure_MC.cfg](/Users/robin/.codex/worktrees/afe5/Portal/design/tla/HouseOfficeDisclosure_MC.cfg)
  Suggested TLC config for `HouseOfficeDisclosure.tla`.

## Scope Limits

These are bounded models, not proofs that the entire frontend is correct.

Important caveats:

- the models are abstractions, not the full DOM/CSS/JS implementation
- green TLC runs do not prove the rendered app looks good
- drift between model and shipped UI is possible unless future agents keep docs, tests, captures, and code aligned
- these models should be treated like design-logic regression checks, not aesthetic guarantees

## How future agents should use this

When changing design logic on the town shell, House, or House Office:

1. update the human-facing design docs first
2. update the relevant TLA+ model if the logic contract changes
3. update Playwright visual/design assertions
4. implement the smallest UI change
5. capture before/after screenshots
6. verify that model, tests, captures, and shipped UI still agree

## Suggested TLC workflow

If TLC tooling is available locally, future agents can run checks like:

```bash
tlc -config design/tla/TownShell_MC.cfg design/tla/TownShell.tla
tlc -config design/tla/HouseFlow_MC.cfg design/tla/HouseFlow.tla
tlc -config design/tla/HouseOfficeDisclosure_MC.cfg design/tla/HouseOfficeDisclosure.tla
```

This repo does not currently require TLC in CI. Until that changes, these models are a formal companion layer to the existing design TDD stack.
