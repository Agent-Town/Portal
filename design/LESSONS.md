# LESSONS

Status: design memory for future sessions
Last updated: 2026-03-16

These lessons are derived from the current shipped UI and the March 2026 audit.

## 1. The world can be rich, but the UI must be quiet

The desert town background and pixel-western atmosphere are strong product assets.

Do not flatten the world.
Do quiet the interface laid on top of it.

## 2. Nested emphasis destroys hierarchy

Current issue:

1. modal shell is strong,
2. inner panels are also strong,
3. buttons, pills, and tokens are also strong.

Result:

1. everything competes,
2. nothing leads.

Rule:

1. if the shell is ornate, inner content must simplify,
2. if the action is primary, nearby metadata must quiet down.

## 3. The start page must survive third-party media failure

A blank or blocked media frame should never be the loudest visual object on the first screen.

## 4. The agent sidebar is valuable, but it is not the star

The app should feel like one product, not a world plus a debugging product strapped to it.

## 5. Human-facing Library design must emphasize tasks, not systems

Users should not have to think in terms of:

1. ledgers,
2. receipts,
3. provenance rows,
4. sync receipts,
5. technical imports.

They should understand:

1. save,
2. open,
3. trust,
4. hide,
5. share,
6. bring to chat.

## 6. Mobile reveals the truth

If the screen only feels coherent at desktop widths, it is not actually coherent.

## 7. Thick border plus gradient plus shadow is not a system

It is a style habit.
Use only the amount of visual framing required for hierarchy.

## 8. Progressive disclosure is mandatory in the House Library

The Library has enough capability already.
Its default state must not show every control at once.

## 9. Use one icon language

Bracket tokens are part of the current visual identity, but they must be used consistently and subordinate to hierarchy.

Mixed icon voices make the UI feel assembled instead of designed.

## 10. Never solve clarity with more copy

If the user needs a paragraph to understand the next step, the layout is wrong.

## 11. The interface must teach itself without AI literacy

The product cannot assume the user understands:

1. models,
2. providers,
3. agent memory,
4. LLMs,
5. context systems.

Primary flows must be understandable through:

1. place,
2. verbs,
3. hierarchy,
4. feedback.

## 12. International means more than translated English

A design is not global just because strings can be swapped.

It must also:

1. survive different text lengths,
2. avoid English-only idioms,
3. remain elegant for Chinese,
4. avoid relying on culture-specific software assumptions.

## 13. Future voice support begins with visual clarity

Voice-ready UI starts now by making:

1. rooms obvious,
2. actions short and distinct,
3. states visible,
4. controls referable by simple names.

## 14. No design phase is complete until:

1. mobile feels intentional,
2. tablet feels composed,
3. desktop feels calm,
4. empty and loading states still feel authored,
5. the full test suite remains green,
6. the main action is understandable without AI jargon,
7. English and Chinese remain plausible first-class targets.

## 15. Use a display face for world identity and a system UI face for comprehension

The product needs a memorable world voice and a calm reading voice at the same time.

Rule:

1. decorative display typography should lead headings and world identity,
2. buttons, labels, forms, metadata, and body copy should use the calmer UI stack,
3. international and Chinese fallback support matters more than a perfectly themed Latin-only UI font.

## 16. Secondary controls need their own compact size

When the global button system becomes more touch-friendly, compact secondary controls must not inherit full primary size by accident.

Rule:

1. primary actions can be large,
2. chip rows, toolbar controls, and review toggles need a smaller button variant,
3. always verify dense mobile clusters after increasing global control size.

## 17. Guidance overlays must not hide the places they explain

The D2 town HUD improved hierarchy, but the first mobile pass proved a common failure mode:

1. desktop flex-basis values leaked into stacked mobile cards,
2. the guidance layer became taller than intended,
3. the overlay hid the upper buildings the user needed to discover.

Rule:

1. treat every onboarding HUD as a guide, not a curtain,
2. recheck mobile overlays against the tappable world behind them,
3. if the guidance obscures the places it describes, it is too large.

## 18. Embedded experiences need a different modal rule than native rooms

Atlas already ships its own internal shell inside the iframe.

Rule:

1. native district rooms can use padded modal bodies,
2. embedded experiences often need a flush body to preserve viewport height,
3. sticky embedded headers should not block underlying clicks when only the controls need pointer interaction.

## 19. Simple rooms should not inherit large-room proportions

Leaderboard, Pony, and similar lightweight rooms feel heavier than they are if they inherit the same width and height as House or Town Hall.

Rule:

1. large workflows can keep large envelopes,
2. simple rooms should collapse into tighter modal widths and heights,
3. visual weight should match task weight.

## 20. Human-friendly relabeling still has to respect deterministic product contracts

The House Library redesign improved clarity by introducing friendlier labels like `Memory Table` and `Trusted Finds`, but Phase 30 benchmark contracts still required specific canonical headings.

Rule:

1. keep user-friendly cues,
2. preserve any heading or copy strings that are used by benchmark fixtures and design-contract tests,
3. when evolving language, layer new cues as secondary labels before removing canonical labels.

## 21. On mobile, opening a result should reveal the action surface automatically

Reordered sections are not enough on their own when the user opens a card deep inside a stacked layout.

Rule:

1. if a mobile action produces a preview or action dock, reveal it automatically,
2. do not rely on the user to scroll upward to find the next step,
3. treat preview reveal as part of the visual interaction design, not as optional polish.

## 22. Optional customization must follow the primary identity action

Town Hall worked better once the flow made one thing obvious:

1. name yourself,
2. continue,
3. customize only if you want to.

Rule:

1. optional personalization cannot sit in front of the identity decision,
2. on mobile, the primary continue action should appear before secondary customization content whenever possible,
3. support surfaces can still be attractive, but they must not become the first thing the user has to parse.

## 23. Support infrastructure should feel docked, not attached

The agent sidebar is important, but the app feels cleaner when the sidebar behaves like a calm support dock instead of a second main canvas.

Rule:

1. minimized support surfaces should take less width than expanded ones,
2. support headers should be calmer and shorter than primary room headers,
3. debug power can stay available without using the same visual intensity as the main task.

## 24. Empty-state contracts can evolve visually without breaking deterministic copy

The House surfaces proved that many empty-state strings are part of the test contract.

Rule:

1. preserve canonical empty-state text when tests or benchmark fixtures depend on it,
2. add guidance through secondary affordances such as helper lines, drawers, or `data-*` driven visual hints,
3. treat copy replacement as a contract change, not as harmless polish.

## 25. A shared tone system is more reliable than inline status colors

The final polish pass exposed how many surfaces were still setting `style.color` directly.

Rule:

1. status, warning, success, and error states should flow through one visual helper,
2. avoid one-off color writes in JS for presentational feedback,
3. if a state needs emphasis, use shared tone tokens so screenshots, accessibility, and future localization stay aligned.

## 26. Modal evidence should document the surface the user actually reads

The first D6 screenshot pass showed that raw element captures can misrepresent transformed modal layouts.

Rule:

1. prefer viewport captures that match what the user actually sees,
2. if a modal is scaled or transformed, scroll the relevant surface into view before capturing it,
3. design evidence should communicate hierarchy clearly, not just prove that a node exists.

## 27. When the LLM is always present, the UI does not need to explain everything

Agent Town is not a standalone form app.
The user has an LLM companion inside the product.

Rule:

1. keep rich information in the system,
2. let advanced views and drawers preserve optional human deep inspection,
3. keep the default screen focused on action, confidence, and orientation,
4. if the LLM can explain complexity on demand, the main UI should usually summarize rather than enumerate it.

## 28. Simplification must not create semantic drift

The useful idea in `tla-precheck` is not the exact tooling. It is the discipline:
one truth, many projections, no drift.

Rule:

1. the simple UI can be shorter than the advanced UI,
2. the LLM can explain more than the default UI,
3. but all three must still describe the same underlying reality,
4. summarize by compression, not by inventing a different product model.
