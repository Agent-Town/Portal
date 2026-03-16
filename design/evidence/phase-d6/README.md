Phase D6 evidence pack

This folder captures the final polish pass for loading, empty, error, motion, and accessibility states.

Files:

1. `before/loading-desktop.png`
2. `before/empty-desktop.png`
3. `before/empty-mobile.png`
4. `before/error-start-desktop.png`
5. `before/reduced-motion-drawer.png`
6. `after/loading-desktop.png`
7. `after/empty-desktop.png`
8. `after/empty-mobile.png`
9. `after/error-start-desktop.png`
10. `after/reduced-motion-drawer.png`

What changed in D6:

1. loading surfaces now use a calmer shared presentation instead of blank parchment and a lone spinner,
2. empty states keep their deterministic contract text while adding one clear next-action hint,
3. status and error messages now share one tone system instead of ad hoc inline colors,
4. drawers use a restrained reveal motion and respect `prefers-reduced-motion`,
5. focus visibility is stronger across buttons, links, summaries, and form controls.

Verification used for this evidence set:

1. targeted D6 regressions passed
2. full `npm test` passed with `410 passed, 4 skipped`
