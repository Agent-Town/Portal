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
