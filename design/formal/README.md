# Design Formal Models

This folder holds formal models for design logic that can be expressed as state and invariant constraints.

It is not for visual taste.
It is for the parts of design that can be made precise:

1. what the canonical product meaning is,
2. what the default human UI may show,
3. what advanced views may add,
4. what the LLM may explain,
5. how future voice-oriented naming should stay aligned,
6. which forms of simplification are allowed,
7. which kinds of semantic drift are forbidden.

## Why this exists

The design system now follows two strong rules:

1. the default human UI should stay dead simple,
2. the simple UI, advanced UI, LLM explanation layer, and future voice layer must not drift apart.

Those rules are close enough to product logic that they benefit from formalization.

This is the transferable design idea taken from the `tla-precheck` concept:

1. one truth,
2. many projections,
3. no drift.

## What is formalized

This folder formalizes four cross-cutting contracts:

1. one canonical meaning layer for core rooms and actions,
2. one simplified human projection,
3. one advanced/detail projection,
4. one LLM projection,
5. one future voice-ready projection,
6. one set of locale-safe command alias constraints,
7. invariants that guarantee:
   - summary is simpler than detail,
   - advanced is a superset of summary,
   - LLM sees the full canonical meaning,
   - no projection contradicts another,
   - the human layer does not leak technical-only concepts by default.

## What is not formalized

These remain design-review concerns, not TLA+ concerns:

1. typography taste,
2. whitespace quality,
3. color palette quality,
4. motion elegance,
5. visual premium-ness.

TLA+ here is for semantic UI logic, not for aesthetic judgment.

## Files

1. `DesignProjectionNoDrift.tla`
2. `DesignProjectionNoDrift.cfg`
3. `ModalFirstWorkerContinuity.tla`
4. `ModalFirstWorkerContinuity.cfg`
5. `HouseLibraryTaskDisclosure.tla`
6. `HouseLibraryTaskDisclosure.cfg`
7. `VoiceInteractionGrammar.tla`
8. `VoiceInteractionGrammar.cfg`

## First model

`DesignProjectionNoDrift.tla` formalizes the no-drift projection rule for Agent Town:

1. one canonical product meaning,
2. one simplified human projection,
3. one advanced/detail projection,
4. one LLM projection,
5. one future voice-oriented projection,
6. no semantic drift between them.

The model is intentionally small and finite.
It does not try to encode the whole product.
It encodes the semantic pattern that future design work must preserve.

### State modeled

1. room (`Start`, `Town`, `HouseLibrary`, `TownHall`)
2. task (`enterTown`, `exploreTown`, `reviewLibrary`, `reviewTrust`, `setupIdentity`)
3. selection state (`none`, `artifact`, `publicStack`)
4. trust state (`na`, `unknown`, `verified`, `blocked`)
5. advanced drawer open/closed
6. provider configured or not

### Invariants modeled

1. `TypeOK`
2. `TaskFitsRoom`
3. `SummaryNotInvented`
4. `HumanSummaryBound`
5. `HumanAvoidsTechnicalOnly`
6. `AdvancedSuperset`
7. `AdvancedOnlyShowsCanonical`
8. `AdvancedHidesLLMOnly`
9. `AdvancedOpenAddsDetail`
10. `LLMCompleteness`
11. `VoiceMatchesHuman`
12. `NoDrift`

## Second model

`ModalFirstWorkerContinuity.tla` formalizes the modal-first routing and page-scoped worker rule for Agent Town:

1. district work that is designed to be modal-first stays inside `/app`,
2. opening and closing modal-first surfaces does not tear down the worker runtime,
3. non-`/app` paths do not own modal-first district UI,
4. standalone Atlas routes may exist only as redirect entry points,
5. Atlas redirect returns to `/app` and reopens Atlas in modal form.

### State modeled

1. current path (`/start`, `/app`, `/atlas`, `/atlas.html`)
2. current modal surface (`none`, `Atlas`, `House`, `TownHall`, `Registry`, `Pony`, `Trainer`)
3. whether the page-scoped worker is alive
4. worker epoch
5. redirect pending or not
6. standalone target (`none`, `Atlas`)

### Invariants and temporal properties modeled

1. `TypeOK`
2. `AppPathHasWorker`
3. `ModalRequiresApp`
4. `ModalRequiresWorker`
5. `NonAppPathHasNoModal`
6. `SteadyStandaloneAtlasForbidden`
7. `RedirectStateWellFormed`
8. `SteadyAppClearsStandaloneTarget`
9. `ModalOpenClosePreserveWorkerEpoch`
10. `RedirectOpensAtlasInApp`

## Third model

`HouseLibraryTaskDisclosure.tla` formalizes the House Library design rule from Phase D4 and later Library phases:

1. the default House Library surface stays task-first,
2. the human layer shows one active task, one focus section, and one primary action,
3. technical and provenance detail stay out of the default human path,
4. advanced disclosure reveals detail without changing meaning,
5. the LLM still sees the full canonical Library state.

### State modeled

1. active Library task (`save`, `openLocal`, `reviewTrust`, `receiveDelivery`, `reviewHidden`, `followRoute`)
2. focused section (`MemoryTable`, `KeepBox`, `TrustedFinds`, `RouteDesk`, `HiddenShelf`, `Deliveries`)
3. current selection (`none`, `localItem`, `publicStack`, `delivery`, `hiddenStack`, `routeStack`)
4. trust state
5. disclosure mode (`closed`, `itemDetail`, `provenance`, `advancedDesk`)

### Invariants modeled

1. `TypeOK`
2. `TaskFocusFits`
3. `TaskSelectionTrustFits`
4. `DisclosureFitsSelection`
5. `SummaryNotInvented`
6. `HumanSummaryBound`
7. `HumanShowsSingleGoal`
8. `HumanShowsSingleFocusSection`
9. `HumanShowsSinglePrimaryAction`
10. `HumanAvoidsTechnicalFacts`
11. `HumanAvoidsDetailFacts`
12. `AdvancedSuperset`
13. `AdvancedOnlyShowsCanonical`
14. `AdvancedHidesLLMOnly`
15. `ClosedDisclosureMatchesHuman`
16. `OpenDisclosureAddsFacts`
17. `LLMCompleteness`
18. `NoDrift`

## Fourth model

`VoiceInteractionGrammar.tla` formalizes the command-alignment model that prepares for future voice interaction:

1. each canonical task maps to exactly one command intent,
2. each command intent maps to locale-specific aliases,
3. aliases remain non-empty and unique within a locale,
4. the default human surface keeps exactly one clear primary action,
5. advanced disclosure only adds context and never changes the canonical meaning,
6. the LLM surface remains complete for the same state,
7. locale switching changes phrase text but not command intent.

### State modeled

1. active task (`enterTown`, `openLibrary`, `openTownHall`, `openWorkshop`, `setupIdentity`, `saveArtifact`, `openArtifact`, `reviewTrust`, `receiveDelivery`, `hideArtifact`, `followRoute`)
2. focus section (`Entry`, `Library`, `TownHall`, `Workshop`, `KeepBox`, `MemoryTable`, `TrustedFinds`, `Deliveries`, `HiddenShelf`, `RouteDesk`)
3. selection (`none`, `artifact`, `publicStack`, `delivery`, `hiddenStack`, `routeStack`)
4. trust state (`na`, `unknown`, `verified`, `blocked`)
5. detail mode (`closed`, `itemDetail`, `provenance`, `advanced`)
6. active voice locale (`en`, `zh`)

### Invariants and compatibility modeled

1. `TypeOK`
2. `TaskSelectionTrustFits`
3. `CanonicalVerbValid`
4. `HumanSimple`
5. `CanonicalCoversHuman`
6. `LLMCompleteness`
7. `AdvancedSuperset`
8. `NoTechnicalLeakInHuman`
9. `NoDrift`
10. `ClosedDisclosureMatchesHuman`
11. `OpenDisclosureAddsFacts`
12. `NoLocaleAliasCollision`
13. `VoiceAliasExists`
14. `LocaleSwitchOnlyCommandStable`

## Running TLC

If `tla2tools.jar` is available:

```bash
cd design/formal
java -XX:+UseParallelGC -jar /path/to/tla2tools.jar DesignProjectionNoDrift.tla -config DesignProjectionNoDrift.cfg
java -XX:+UseParallelGC -jar /path/to/tla2tools.jar ModalFirstWorkerContinuity.tla -config ModalFirstWorkerContinuity.cfg
java -XX:+UseParallelGC -jar /path/to/tla2tools.jar HouseLibraryTaskDisclosure.tla -config HouseLibraryTaskDisclosure.cfg
java -XX:+UseParallelGC -jar /path/to/tla2tools.jar VoiceInteractionGrammar.tla -config VoiceInteractionGrammar.cfg
```

If TLC is not installed locally, the model should still be kept up to date and checked later in a verification-capable environment.

## Current verification status

Verified locally on 2026-03-16 with TLC 2.19.

Observed result:

1. `104` states generated,
2. `27` distinct reachable states,
3. complete search depth `9`,
4. no invariant violations,
5. no deadlock check requested by config.

`ModalFirstWorkerContinuity.tla` verified locally on 2026-03-16 with TLC 2.19.

Observed result:

1. `196` states generated,
2. `29` distinct reachable states,
3. complete search depth `6`,
4. no invariant violations,
5. no deadlock check requested by config.

`HouseLibraryTaskDisclosure.tla` verified locally on 2026-03-16 with TLC 2.19.

Observed result:

1. `292` states generated,
2. `37` distinct reachable states,
3. complete search depth `4`,
4. no invariant violations.

`VoiceInteractionGrammar.tla` has not yet been verified in this environment. Run TLC with the command above once tooling is available.

## How future agents should use this

Use the model when a design change affects:

1. what the simple UI shows by default,
2. what advanced drawers or detail panes add,
3. what the LLM should be able to explain,
4. how future voice labels should align with the visible UI,
5. what command alias and locale behavior should hold,
6. whether a proposed simplification hides truth or merely compresses it.

If a future phase changes those semantics, update this model and rerun TLC.

Use the modal-first continuity model when a design change affects:

1. route ownership between `/app` and district experiences,
2. whether a room opens as a modal or as a page,
3. whether worker continuity is preserved by the proposed UX,
4. how standalone Atlas entry points behave,
5. whether a new shell would accidentally become a second first-class navigation path.

Use the House Library disclosure model when a design change affects:

1. what the House Library shows by default,
2. which Library desks are primary versus secondary,
3. when provenance or trust detail becomes visible,
4. how much of Library state stays for the LLM instead of the default human path,
5. whether a proposed simplification would hide truth or merely defer it behind disclosure.

Use the voice command model when a design change affects:

1. future command vocabulary,
2. locale switching behavior,
3. the alignment between visible task actions and future voice phrases,
4. whether future spoken controls preserve one canonical meaning across projections.
