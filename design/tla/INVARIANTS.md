# Design Logic Invariants

This file maps Portal design principles to bounded TLA+ invariants.

## Town Shell

Model:
- [TownShell.tla](/Users/robin/.codex/worktrees/afe5/Portal/design/tla/TownShell.tla)

Invariants:
- `TypeInv`
  All variables stay within the allowed shell state space.
- `OnePrimaryAction`
  The shell exposes exactly one primary action in any top-level state.
- `ModalContinuityPreserved`
  Opening a district does not leave the main `/app` shell.
- `DebugNeverPrimary`
  Debug remains accessible but is never the default primary surface.
- `AssistantCarriesDetail`
  When the assistant is available, town-shell detail stays summary-first instead of expanding into a dense manual dashboard.
- `LocaleSafeActionModel`
  Locale changes do not change the basic action structure.

## House Flow

Model:
- [HouseFlow.tla](/Users/robin/.codex/worktrees/afe5/Portal/design/tla/HouseFlow.tla)

Invariants:
- `TypeInv`
  House state stays within the approved narrative model.
- `OnePrimaryAction`
  The first viewport never exposes multiple equally primary CTAs.
- `UnlockBeforeAdvanced`
  Unlock/reconnect leads when it is relevant.
- `ContinuityBeforeSharing`
  Continuity and recovery come before share/presence layers.
- `AdvancedHiddenByDefault`
  Advanced sections are not expanded by default.
- `AssistantCarriesDetail`
  Rich detail exists, but the first visible layer remains summary-first when the assistant is available.

## House Office Disclosure

Model:
- [HouseOfficeDisclosure.tla](/Users/robin/.codex/worktrees/afe5/Portal/design/tla/HouseOfficeDisclosure.tla)

Invariants:
- `TypeInv`
  House Office disclosure state remains valid.
- `SummaryBeforeDetail`
  The top layer always remains summary-first.
- `NoRawIdsInTopLayer`
  Raw session/runtime/config identifiers do not appear in the top summary layer.
- `OneDominantHelperAction`
  The helper surface exposes one dominant next action in the top layer.
- `AdvancedDetailRetained`
  Useful detail still exists in advanced layers instead of being deleted.
- `AssistantCarriesDetail`
  The assistant can interpret richer evidence while humans get a simplified first view.

## What these invariants do not prove

They do not prove:

- visual beauty
- premium spacing
- type rhythm
- color harmony
- animation quality

Those remain the job of:

- the design docs
- Playwright design tests
- screenshot review
